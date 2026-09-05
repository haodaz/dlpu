import { mcpToolsDataPlatform } from '@/lib/mcp/generated-tools';
import { searchWeb, SearchSource } from '@/lib/search';
import { policyJournal } from '@/lib/mcp/policy-journal';
import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY 未配置');
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
}

/**
 * 政策检索流式引擎
 * 三阶段：平方库检索 → 全网搜索（始终执行）→ AI 组装报告
 *
 * ⚠️ 平方库数据特征（影响搜索策略）：
 *   - VSDIndustryPolicy: 产业政策（name, content, policy_keywords, theme, publish_organization 是安全文本字段）
 *   - VSDInstitutePolicy: 高校政策（name, content, source, school_department 是安全文本字段）
 *   - region / city / province 是数组字段 → 绝对不能在 condition 中使用
 *   - policy_level: 'region' | 'country' — 文本字段，可以精确匹配
 *   - type: 'policy_interpretation' | 'management_regulation' | 'planning_document' | 'notice' — 文本字段
 */
export async function runPolicySearchStream(
  topic: string,
  region: string = '',
  policyLevel: string = '',
  policyType: string = '',
  userProfile: string = '',
  limit: number = 15,
  userToken?: string
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const token = userToken || process.env.VISIONSQUARE_AUTH_BEARER;

  return new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: any) => {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type, data }) + '\n\n'));
      };

      try {
        let gatheredData: any = { industryPolicies: [], institutePolicies: [] };

        // --- 提取关键词（清洗口语噪声）---
        const TOPIC_NOISE_RE = /^(我是|我想|请问|帮我|能不能|可以|想|问|下|能|得到|获得|哪些|什么|怎么|多少|请|我|的|了|吗|呢|啊|吧|？|\?|。|,|，)/u;
        const cleanTopicWords = topic
          .trim()
          .split(/[,，\s]+/)
          .map(k => k.replace(TOPIC_NOISE_RE, '').trim())
          .filter(k => k.length > 0);
        const primaryKeywords = cleanTopicWords.slice(0, 3); // 限制3个关键词，避免叶子爆炸

        // ── 提升到外层作用域：供政策日志保存使用 ──
        const cleanTopicForJournal = cleanTopicWords.join(' ') || topic.trim();

        const criteriaParts = [];
        if (cleanTopicWords.length > 0) criteriaParts.push(`主题:${cleanTopicWords.join(' ')}`);
        if (region) criteriaParts.push(`地区:${region}`);
        if (policyLevel) criteriaParts.push(`级别:${policyLevel}`);
        if (policyType) criteriaParts.push(`类型:${policyType}`);
        const criteriaStr = criteriaParts.join(' | ');

        // ═══════════════════════════════════════════════════════════════
        // 阶段 1: 平方库检索（VSDIndustryPolicy + VSDInstitutePolicy）
        // ═══════════════════════════════════════════════════════════════
        sendEvent('log', { step: '🔍 [第一阶段] 正在检索平方政策库...', message: `查询条件: ${criteriaStr}` });

        const start1 = Date.now();
        const effectiveKeywords = primaryKeywords.slice(0, 3); // 限制3个关键词，避免叶子爆炸

        // --- 1a. 搜 VSDIndustryPolicy（产业政策）---
        let industryPolicies: any[] = [];
        if (effectiveKeywords.length > 0 || region || policyLevel || policyType) {
          try {
            const rootChildren: any[] = [];

            // 主题关键词条件（OR 组）
            if (effectiveKeywords.length > 0) {
              const topicLeaves: any[] = [];
              for (const kw of effectiveKeywords) {
                topicLeaves.push({ leaf: { field: 'name', comparator: 'ilike', value: `%${kw}%` } });
                topicLeaves.push({ leaf: { field: 'content', comparator: 'ilike', value: `%${kw}%` } });
                topicLeaves.push({ leaf: { field: 'policy_keywords', comparator: 'ilike', value: `%${kw}%` } });
                topicLeaves.push({ leaf: { field: 'theme', comparator: 'ilike', value: `%${kw}%` } });
                topicLeaves.push({ leaf: { field: 'publish_organization', comparator: 'ilike', value: `%${kw}%` } });
              }
              rootChildren.push({ logic_operator: '|', children: topicLeaves });
            }

            // 地区关键词（只能搜 publish_organization，因为 region/province/city 都是数组字段）
            if (region.trim()) {
              const regionKws = region.split(/[,，\s]+/).filter(k => k.trim());
              const regionLeaves: any[] = [];
              for (const kw of regionKws) {
                regionLeaves.push({ leaf: { field: 'publish_organization', comparator: 'ilike', value: `%${kw}%` } });
                regionLeaves.push({ leaf: { field: 'name', comparator: 'ilike', value: `%${kw}%` } });
                regionLeaves.push({ leaf: { field: 'content', comparator: 'ilike', value: `%${kw}%` } });
              }
              rootChildren.push({ logic_operator: '|', children: regionLeaves });
            }

            // 政策级别（精确匹配）
            if (policyLevel.trim()) {
              rootChildren.push({ logic_operator: '|', children: [
                { leaf: { field: 'policy_level', comparator: '=', value: policyLevel.trim() } }
              ]});
            }

            // 政策类型（精确匹配）
            if (policyType.trim()) {
              rootChildren.push({ logic_operator: '|', children: [
                { leaf: { field: 'type', comparator: '=', value: policyType.trim() } }
              ]});
            }

            if (rootChildren.length > 0) {
              const conditionJson = JSON.stringify({ logic_operator: '&', children: rootChildren });
              console.log(`[PolicySearch] IndustryPolicy condition 叶子数: ${rootChildren.reduce((a, g) => a + (g.children?.length || 0), 0)}`);

              const res = await mcpToolsDataPlatform.dashGenericSearch({
                model: 'VSDIndustryPolicy',
                condition: conditionJson,
                fields: ['id', 'name', 'type', 'label', 'policy_level', 'publish_organization', 'publish_date', 'official_link', 'remarks', 'theme', 'policy_keywords', 'content'],
                limit: Math.min(limit, 20),
              }, token);
              industryPolicies = (res.items || []) as any[];
            }
          } catch (e: any) {
            console.warn('[PolicySearch] IndustryPolicy search failed:', e.message);
          }
        }

        // --- 1b. 搜 VSDInstitutePolicy（高校政策）---
        let institutePolicies: any[] = [];
        if (effectiveKeywords.length > 0) {
          try {
            const topicLeaves: any[] = [];
            for (const kw of effectiveKeywords) {
              topicLeaves.push({ leaf: { field: 'name', comparator: 'ilike', value: `%${kw}%` } });
              topicLeaves.push({ leaf: { field: 'content', comparator: 'ilike', value: `%${kw}%` } });
              topicLeaves.push({ leaf: { field: 'source', comparator: 'ilike', value: `%${kw}%` } });
            }
            const conditionJson = JSON.stringify({ logic_operator: '&', children: [{ logic_operator: '|', children: topicLeaves }] });
            console.log(`[PolicySearch] InstitutePolicy condition 叶子数: ${topicLeaves.length}`);

            const res = await mcpToolsDataPlatform.dashGenericSearch({
              model: 'VSDInstitutePolicy',
              condition: conditionJson,
              fields: ['id', 'name', 'type', 'label', 'source', 'source_publish_date', 'official_link', 'school_department', 'content', 'gaokao_enrollment_rule'],
              limit: Math.min(limit, 10),
            }, token);
            institutePolicies = (res.items || []) as any[];
          } catch (e: any) {
            console.warn('[PolicySearch] InstitutePolicy search failed:', e.message);
          }
        }

        // 截断 content 字段，防止超过 AI 模型 131072 token 限制
        const truncateField = (items: any[], field: string, maxLen: number) => {
          for (const item of items) {
            if (item[field] && typeof item[field] === 'string' && item[field].length > maxLen) {
              item[field] = item[field].substring(0, maxLen) + '...(已截断)';
            }
          }
        };
        truncateField(industryPolicies, 'content', 500);
        truncateField(industryPolicies, 'remarks', 300);
        truncateField(institutePolicies, 'content', 500);

        gatheredData.industryPolicies = industryPolicies;
        gatheredData.institutePolicies = institutePolicies;
        const totalPingfang = industryPolicies.length + institutePolicies.length;
        const elapsed1 = Date.now() - start1;

        if (totalPingfang > 0) {
          sendEvent('log', { step: '✅ [第一阶段完成]', message: `耗时 ${elapsed1}ms。产业政策 ${industryPolicies.length} 条 + 高校政策 ${institutePolicies.length} 条，共 ${totalPingfang} 条。` });
        } else {
          sendEvent('log', { step: '⚠️ [第一阶段完成]', message: `耗时 ${elapsed1}ms。平方库未命中任何政策，将依赖互联网搜索。` });
        }

        // ═══════════════════════════════════════════════════════════════
        // 阶段 2: 全网搜索（多路并行 + 自然语言改写）
        // ═══════════════════════════════════════════════════════════════
        try {
          const start2 = Date.now();

          // ── 方案1: 智能提取用户画像关键词 + 自然语言改写 ──
          const profileInfo: {
            edu?: string;
            age?: string;
            schools: string[];
            papers?: string;
            hasStartup?: boolean;
            cities: string[];
          } = { schools: [], cities: [] };

          if (userProfile) {
            // 学历
            const eduRe = /(?:[\u4e00-\u9fa5A-Za-z]{0,6}?(?:大学|学院|学校|研究院|实验室|中心|研究所))?[\u4e00-\u9fa5A-Za-z]+(博士|硕士|博士后|Ph\.?D|Master)/i;
            const eduMatch = userProfile.match(eduRe);
            if (eduMatch) {
              const cleaned = eduMatch[0].replace(/^(我是|我|从|在|于|毕业于|毕业|就读于|就读)/, '').trim();
              if (cleaned) profileInfo.edu = cleaned;
            }
            // 年龄
            const ageMatch = userProfile.match(/(\d+岁)/);
            if (ageMatch) profileInfo.age = ageMatch[1];
            // 学校（含消歧映射，大小写不敏感）
            const SCHOOL_MAP: Record<string, string> = {};
            const schoolMapEntries: [string, string][] = [
              ['usc', '南加州大学'], ['ucla', '加州大学洛杉矶分校'], ['ucb', '加州大学伯克利分校'],
              ['mit', '麻省理工学院'], ['stanford', '斯坦福大学'], ['哈佛', '哈佛大学'],
              ['剑桥', '剑桥大学'], ['牛津', '牛津大学'], ['普林斯顿', '普林斯顿大学'],
              ['耶鲁', '耶鲁大学'], ['caltech', '加州理工学院'], ['帝国理工', '帝国理工学院'],
              ['复旦', '复旦大学'], ['上交', '上海交通大学'], ['浙大', '浙江大学'],
              ['南大', '南京大学'], ['中科大', '中国科学技术大学'], ['国科大', '中国科学院大学'],
              ['清华', '清华大学'], ['北大', '北京大学'],
            ];
            for (const [k, v] of schoolMapEntries) { SCHOOL_MAP[k.toLowerCase()] = v; }
            const schoolMatches = (userProfile.match(/(UCLA|哈佛|MIT|斯坦福|清华|北大|剑桥|牛津|普林斯顿|伯克利|耶鲁|加州理工|帝国理工|复旦|上交|浙大|南大|中科大|国科大|usc|ucb|uchicago|columbia|nyu|penn|duke|northwestern|cornell|brown|dartmouth|vanderbilt|rice|georgetown)/gi) || []);
            for (const s of schoolMatches.slice(0, 2)) {
              profileInfo.schools.push(SCHOOL_MAP[s.toLowerCase()] || s);
            }
            // 论文/成果
            const paperMatch = userProfile.match(/(\d+)篇/);
            const hasFirstAuthor = /一作|第一作者|通讯作者/i.test(userProfile);
            if (paperMatch) {
              profileInfo.papers = `${paperMatch[1]}篇${hasFirstAuthor ? '一作' : ''}`;
            }
            // 创业
            if (/创业|公司|注册|成立|startup/i.test(userProfile)) {
              profileInfo.hasStartup = true;
            }
            // 地区
            const cityRe = /(北京|上海|深圳|广州|杭州|成都|武汉|南京|西安|苏州|天津|重庆|青岛|厦门|长沙|合肥|郑州|沈阳|大连|宁波|无锡|福州|济南|昆明|贵阳|南昌|太原|南宁|兰州|珠海|东莞|佛山|中山|惠州|嘉兴|常州|泉州|漳州|威海|烟台|唐山|徐州|绍兴|金华|台州|温州)/g;
            const cityMatches = userProfile.match(cityRe) || [];
            profileInfo.cities = [...new Set(cityMatches)];
          }

          // ── 方案1+2: 生成3条自然语言 query + 并行检索 ──
          const yearTag = new Date().getFullYear();
          const queries: Array<{ template: string; query: string }> = [];

          // Query A: 政策概览（通用政策趋势）
          const eduLabel = profileInfo.edu ? (profileInfo.edu.includes('博士') ? '博士' : profileInfo.edu.includes('硕士') ? '硕士' : '高层次') : '高层次';
          queries.push({
            template: '政策概览',
            query: `${yearTag}年${eduLabel}人才引进补贴政策 最新标准 申报条件`,
          });

          // Query B: 学校/地区专项（精准匹配）
          if (profileInfo.schools.length > 0) {
            const schoolLabel = profileInfo.schools[0];
            const cityLabel = profileInfo.cities.length > 0 ? profileInfo.cities[0] : '';
            queries.push({
              template: '学校/地区专项',
              query: `${schoolLabel} 海外${eduLabel}人才${cityLabel ? cityLabel + ' ' : ''}落户政策 补贴标准 2024 ${yearTag}`,
            });
          }

          // Query C: 个人条件匹配（精准申报指南）
          const condParts: string[] = [];
          if (profileInfo.age) condParts.push(profileInfo.age);
          if (profileInfo.papers) condParts.push(`${profileInfo.papers}科研成果`);
          if (profileInfo.hasStartup) condParts.push('创业经历');
          if (condParts.length > 0) {
            queries.push({
              template: '个人条件匹配',
              query: `${condParts.join(' ')} ${eduLabel} 人才引进 申报资格 补贴金额`,
            });
          }

          // 去重 query
          const seenQueries = new Set<string>();
          const uniqueQueries = queries.filter(q => {
            const key = q.query.replace(/\s+/g, ' ').trim();
            if (seenQueries.has(key)) return false;
            seenQueries.add(key);
            return true;
          });

          // 展示查询条件
          const displayQueries = uniqueQueries.map((q, i) => `${i + 1}. [${q.template}] ${q.query}`).join(' | ');
          sendEvent('log', { step: '🌐 [第二阶段] 正在并行检索全网引擎...', message: displayQueries });
          console.log(`[PolicySearch] 阶段2: 并行检索 ${uniqueQueries.length} 条 query`);
          uniqueQueries.forEach((q, i) => console.log(`  [${i + 1}] ${q.template}: "${q.query}"`));

          // 超时告警：30s 时提醒
          const timeoutWarnTimer = setTimeout(() => {
            sendEvent('log', { step: '⏳ [第二阶段] 检索进行中...', message: `${uniqueQueries.length} 路并行搜索中，阿里云联网搜索可能需要 30-60 秒，请耐心等待...` });
          }, 25000);

          // ── 方案2: 并行检索 ──
          const searchPromises = uniqueQueries.map((q, i) =>
            searchWeb(q.query).then(res => ({ ...res, _template: q.template, _index: i }))
          );
          const allResults = await Promise.all(searchPromises);
          clearTimeout(timeoutWarnTimer);
          const elapsed2 = Date.now() - start2;

          // ── 合并结果 ──
          const validResults = allResults.filter(r => r.AbstractText || (r.RelatedTopics && r.RelatedTopics.length > 0));
          const mergedAbstracts = validResults
            .map(r => `【${r._template}】\n${r.AbstractText}`)
            .filter(Boolean)
            .join('\n\n');

          // 合并 RelatedTopics，去重
          const seenUrls = new Set<string>();
          const mergedRelated: Array<{ Text?: string; FirstURL?: string }> = [];
          for (const r of validResults) {
            for (const rt of r.RelatedTopics || []) {
              const url = rt.FirstURL || '';
              if (url && seenUrls.has(url)) continue;
              if (url) seenUrls.add(url);
              mergedRelated.push(rt);
            }
          }

          // 合并 sources（阿里云来源列表），去重
          const seenSourceUrls = new Set<string>();
          const mergedSources: SearchSource[] = [];
          for (const r of validResults) {
            for (const s of r.sources || []) {
              if (s.url && seenSourceUrls.has(s.url)) continue;
              if (s.url) seenSourceUrls.add(s.url);
              mergedSources.push(s);
            }
          }

          const mergedSource = validResults.length > 0 ? validResults.map(r => r.source).join('+') : 'none';

          console.log(`[PolicySearch] 阶段2: 并行检索完成 —— ${validResults.length}/${allResults.length} 条有效, 耗时 ${elapsed2}ms`);
          console.log(`[PolicySearch] 阶段2: 合并后 AbstractText 长度=${mergedAbstracts.length}, RelatedTopics=${mergedRelated.length} 条, sources=${mergedSources.length} 条`);

          // 展示各条结果的命中情况
          for (const r of allResults) {
            const hit = r.AbstractText ? `摘要${r.AbstractText.length}字` : (r.RelatedTopics?.length ? `链接${r.RelatedTopics.length}条` : '空结果');
            const srcCount = r.sources?.length ? `, 来源${r.sources.length}条` : '';
            console.log(`  [${r._index + 1}] ${r._template}: ${hit}${srcCount} (source=${r.source})`);
          }

          const hasResult = mergedAbstracts.length > 0 || mergedRelated.length > 0;

          if (hasResult) {
            // 兜底：如果 sources 为空但有 RelatedTopics，从 RelatedTopics 生成信源
            let finalSources = mergedSources;
            if (finalSources.length === 0 && mergedRelated.length > 0) {
              console.warn('[PolicySearch] sources 为空，从 RelatedTopics 生成兜底信源');
              finalSources = mergedRelated
                .filter(rt => rt.FirstURL)
                .map((rt, idx) => ({
                  index: idx + 1,
                  title: rt.Text?.substring(0, 100) || `搜索结果 ${idx + 1}`,
                  url: rt.FirstURL || '',
                }));
              console.log(`[PolicySearch] 兜底信源生成: ${finalSources.length}条`);
            }

            gatheredData['internet_search'] = {
              heading: '全网政策检索结果（多路合并）',
              abstract: mergedAbstracts,
              url: mergedRelated[0]?.FirstURL || finalSources[0]?.url || '',
              related: mergedRelated.slice(0, 10),
              sources: finalSources,
              search_source: mergedSource,
              search_query: uniqueQueries.map(q => q.query).join(' ||| '),
            };
            const hitMsg = [
              `耗时 ${elapsed2}ms`,
              `${validResults.length}/${uniqueQueries.length} 路命中`,
              `来源: ${mergedSource}`,
              mergedAbstracts.length ? `摘要 ${mergedAbstracts.length} 字` : null,
              finalSources.length ? `信源 ${finalSources.length} 条` : null,
            ].filter(Boolean).join('，');
            sendEvent('log', { step: '✅ [第二阶段完成]', message: `成功从全网抓取到相关政策信息（${hitMsg}）。` });

            // 展示来源链接列表
            if (finalSources.length > 0) {
              const sourceList = finalSources.slice(0, 8).map(s => `[${s.index}] ${s.title} - ${s.url}`).join('\n');
              sendEvent('log', { step: '📎 [信源列表]', message: sourceList });
            }
          } else {
            console.warn('[PolicySearch] 阶段2: 判定为空结果 —— 原因: AbstractText为空 且 RelatedTopics为空');
            sendEvent('log', { step: '⚠️ [第二阶段结束]', message: `全网检索未找到明显关联信息（耗时 ${elapsed2}ms，${allResults.length} 路均未命中）。建议更换或补充关键词。` });
          }
        } catch (webErr: any) {
          console.error('[PolicySearch] 阶段2 异常:', webErr?.stack || webErr?.message);
          sendEvent('log', { step: '❌ [第二阶段异常]', message: `全网检索失败: ${webErr.message}` });
        }

        // ═══════════════════════════════════════════════════════════════
        // 阶段 3: AI 组装报告
        // ═══════════════════════════════════════════════════════════════
        sendEvent('log', { step: '🧠 [第三阶段] 数据收集完毕', message: `开始交由大模型评估与组装政策分析报告...` });

        const profileBlock = userProfile ? `\n【用户个人背景】\n${userProfile}\n⚠️ 重要：用户提供了个人背景信息，你必须基于这些背景做 **资格匹配分析**：\n- 分析用户是否符合每条政策的申报条件（年龄、学历、海外经历、成果等）\n- 明确标注"✅ 高度匹配""⚠️ 待确认""❌ 不符合"\n- 给出具体的补贴金额、落户条件等待遇数字` : '';

        const taskBlock = userProfile
          ? `【个性化匹配报告原则】
1. 分层推荐：按“国家级人才项目”“一线城市政策”“新一线/二线城市政策”三个层级组织输出。
2. 资格匹配分析：对每条政策，列出关键门槛，并与用户背景逐项比对。
3. 补贴明细：每条政策必须列出具体的资金/补贴/落户等待遇数字，有几项写几项。
4. 对比表格：多个城市的类似政策，用表格对比差异。
5. 结论与建议：综合建议用户优先关注哪些政策/城市。
6. 信源标注（强制）：引用互联网信息时用 [ref_N] 标注出处，报告末尾必须添加「信源参考」章节。`
          : `【政策检索报告原则】
1. 综合排序：将所有数据源的政策打散，按相关度统一排序。
2. 翔实解读：充分利用 content、remarks、policy_keywords 等字段，提取核心条款并深度解读。
3. 信源标注（强制）：引用互联网信息时用 [ref_N] 标注出处，报告末尾必须添加「信源参考」章节。`;

        const assemblePrompt = `你是一位资深的政策研究分析师${userProfile ? '，擅长结合用户背景做精准的资格匹配分析' : ''}。
用户的查询条件：
- 核心政策主题: "${topic}"
${region ? `- 限定地区: "${region}"` : ''}
${policyLevel ? `- 政策级别: "${policyLevel === 'country' ? '国家级' : '地方级'}"` : ''}
${policyType ? `- 政策类型: "${policyType}"` : ''}
${profileBlock}

【写作规范】
1. 开篇概述：报告开头 2-3 句话说明检索到多少条政策、覆盖哪些地区/级别。
2. 翔实度原则：每条政策解读详尽充实，充分利用 content、remarks 等字段。禁止“该政策涵盖多项补贴”这种归纳吞没。
3. 叙述 + 实证结合：列出政策条款后自然解释其对用户的意义（不用“小结”标签）。
4. 充分利用所有数据源：平方数据和互联网数据必须同时使用，标注来源。
5. 无数据则跳过，不写“暂无”。

${taskBlock}

【完整性自检】
写完报告后，回头检查原始 JSON 中每条政策的每个有效字段是否已写入。有遗漏就继续补充。

【数据源】
${gatheredData.internet_search ? '互联网搜索摘要：\n' + gatheredData.internet_search.abstract?.substring(0, 2000) + '\n\n互联网信源：\n' + (gatheredData.internet_search.sources || []).map((s: any) => `  [${s.index}] ${s.title} - ${s.url}`).join('\n') : '互联网搜索未命中'}
${gatheredData.internet_search?.related?.length ? '\n互联网相关链接：\n' + gatheredData.internet_search.related.slice(0, 10).map((r: any, i: number) => `  [${i + 1}] ${r.Text} - ${r.FirstURL}`).join('\n') : ''}

完整 JSON：
${JSON.stringify(gatheredData, null, 2)}

特别注意：纯 Markdown 输出，直接从开篇概述开始。报告要尽可能详尽。
`;

        const client = getOpenAIClient();
        const aiStream = await client.chat.completions.create({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
          messages: [{ role: 'user', content: assemblePrompt }],
          stream: true,
        });

        for await (const chunk of aiStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            sendEvent('ai_chunk', text);
          }
        }

        sendEvent('raw_data', { gatheredData, searchCondition: topic });

        // ── 政策日志：fire-and-forget 保存每条政策 ──
        // 有 userToken 说明来自 chat 路由，否则来自测试台
        const pjTrigger = userToken ? 'chat' : 'tools_tester';
        // 平方产业政策
        for (const p of (gatheredData.industryPolicies || [])) {
          if (!p.name) continue;
          policyJournal.savePolicyData(p.name, p.publish_organization || '', {
            policy_level: p.policy_level,
            policy_type: p.type,
            region: p.region || '',
            publish_date: p.publish_date,
            official_link: p.official_link,
            content_summary: (p.content || '').substring(0, 500),
            policy_keywords: p.policy_keywords ? (Array.isArray(p.policy_keywords) ? p.policy_keywords : [p.policy_keywords]) : [],
            theme: p.theme,
            data_sources: ['pingfang_industry'],
          }, cleanTopicForJournal, pjTrigger, token).catch(e => console.error('[PolicyJournal] save industry failed:', e.message));
        }
        // 平方高校政策
        for (const p of (gatheredData.institutePolicies || [])) {
          if (!p.name) continue;
          policyJournal.savePolicyData(p.name, p.source || '', {
            publish_date: p.source_publish_date,
            official_link: p.official_link,
            content_summary: (p.content || '').substring(0, 500),
            data_sources: ['pingfang_institute'],
          }, cleanTopicForJournal, pjTrigger, token).catch(e => console.error('[PolicyJournal] save institute failed:', e.message));
        }
        // 互联网搜索结果中提到的政策（从 related topics 提取）
        if (gatheredData.internet_search?.related) {
          for (const r of gatheredData.internet_search.related) {
            const text = r.Text || r.FirstURL || '';
            if (text.length > 10) {
              policyJournal.savePolicyData(text.substring(0, 100), '', {
                official_link: r.FirstURL || '',
                content_summary: text.substring(0, 500),
                data_sources: ['internet'],
              }, cleanTopicForJournal, pjTrigger, token).catch(e => console.error('[PolicyJournal] save internet failed:', e.message));
            }
          }
        }

        // 互联网信源也保存到日志
        if (gatheredData.internet_search?.sources) {
          for (const s of gatheredData.internet_search.sources) {
            if (s.title && s.title.length > 4) {
              policyJournal.savePolicyData(s.title.substring(0, 100), '', {
                official_link: s.url || '',
                content_summary: s.title.substring(0, 500),
                data_sources: ['internet'],
              }, cleanTopicForJournal, pjTrigger, token).catch(e => console.error('[PolicyJournal] save source failed:', e.message));
            }
          }
        }

        sendEvent('done', { message: '报告生成完毕' });
        controller.close();
      } catch (e: any) {
        sendEvent('error', { message: String(e.message || e) });
        controller.close();
      }
    }
  });
}
