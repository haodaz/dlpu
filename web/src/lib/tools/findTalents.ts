import { talentAuditService } from '@/lib/mcp/talent';
import { searchWeb } from '@/lib/search';
import OpenAI from 'openai';
import { talentJournal } from '@/lib/mcp/talent-journal';

function getOpenAIClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY 未配置');
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
}

export async function runFindTalentsStream(
  topic: string, 
  expandedTopics: string = '', 
  institution: string = '', 
  honors: string = '', 
  limit: number = 20, 
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
        let gatheredData: any = { pingfang: [] };
        let webFallbackResults: any = null;

        // --- 阶段 1: 核心词检索 ---
        const cleanTopic = topic.trim();
        const primaryKeywords = cleanTopic ? cleanTopic.split(/[,，\s]+/).filter(k => k.trim().length > 0) : [];
        const criteriaParts = [];
        if (topic) criteriaParts.push(`领域:${topic}`);
        if (institution) criteriaParts.push(`机构:${institution}`);
        if (honors) criteriaParts.push(`荣誉/标签:${honors}`);
        const criteriaStr = criteriaParts.join(' | ');

        sendEvent('log', { step: '🔍 [第一阶段] 正在检索平方库底座...', message: `查询条件: ${criteriaStr}` });
        
        const start1 = Date.now();
        let talents = await talentAuditService.searchTalentsByConditions(primaryKeywords, institution, honors, limit, token || undefined);
        const elapsed1 = Date.now() - start1;

        let finalExpandedTopics = expandedTopics;

        if (talents.length >= 3 || (!expandedTopics.trim() && !topic.trim())) {
          sendEvent('log', { step: '✅ [第一阶段完成]', message: `耗时 ${elapsed1}ms。找到 ${talents.length} 名匹配专家。` });
        } else {
          sendEvent('log', { step: '⚠️ [第一阶段不足]', message: `核心词仅命中 ${talents.length} 人，准备触发扩展检索...` });
          
          // --- 智能扩展词生成 ---
          if (!finalExpandedTopics.trim() && topic.trim()) {
            sendEvent('log', { step: '🧠 [智能扩展]', message: `未提供扩展词，系统正在调用大模型自动联想与 [${topic}] 相关的扩展概念...` });
            const aiClient = getOpenAIClient();
            try {
              const expRes = await aiClient.chat.completions.create({
                model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
                messages: [{ role: 'user', content: `请你根据核心概念 "${topic}"，联想出 3-5 个最相关的专业领域、近义词或子方向，用逗号分隔，不要输出任何其他解释性文字。` }],
                temperature: 0.3,
              });
              finalExpandedTopics = (expRes.choices[0]?.message?.content || '').replace(/\n/g, '').trim();
              sendEvent('log', { step: '✅ [智能扩展完成]', message: `AI 生成扩展词: ${finalExpandedTopics}` });
            } catch (e) {
              sendEvent('log', { step: '⚠️ [智能扩展异常]', message: `AI 联想词生成失败，跳过扩展检索。` });
            }
          }

          if (finalExpandedTopics.trim()) {
            // --- 阶段 1.5: 扩展词检索 ---
            const fallbackKeywords = finalExpandedTopics.split(/[,，\s]+/).filter(k => k.trim().length > 0);
            sendEvent('log', { step: '🔍 [第一阶段.5] 正在应用扩展概念检索...', message: `扩展概念: ${finalExpandedTopics}` });
            
            const start15 = Date.now();
            const fallbackTalents = await talentAuditService.searchTalentsByConditions(fallbackKeywords, institution, honors, limit, token || undefined);
            const elapsed15 = Date.now() - start15;
            
            // 合并去重
            const seenIds = new Set(talents.map(t => String(t.id)));
            let added = 0;
            for (const ft of fallbackTalents) {
              if (!seenIds.has(String(ft.id))) {
                talents.push(ft);
                seenIds.add(String(ft.id));
                added++;
              }
            }
            sendEvent('log', { step: `✅ [第一阶段.5完成]`, message: `耗时 ${elapsed15}ms。通过扩展词额外找到 ${added} 名专家（去重后共 ${talents.length} 人）。` });
          }
        }

        gatheredData.pingfang = talents;

        // --- 阶段 2: 全网搜索（始终执行，与平方库结果互补） ---
        sendEvent('log', { step: '🌐 [第二阶段] 正在检索全网引擎 (Aliyun/Bocha)...', message: `查询条件: ${topic} ${institution} ${honors}` });
        
        try {
          const start2 = Date.now();
          const webQuery = `${topic} ${institution} ${honors} 领域 专家 教授 学者`.trim();
          const webRes = await searchWeb(webQuery);
          const elapsed2 = Date.now() - start2;

          if (webRes && (webRes.AbstractText || (webRes.RelatedTopics && webRes.RelatedTopics.length > 0))) {
            webFallbackResults = {
              heading: webRes.Heading,
              abstract: webRes.AbstractText,
              url: webRes.AbstractURL,
              related: webRes.RelatedTopics?.slice(0, 5) || []
            };
            gatheredData['internet_search'] = webFallbackResults;
            sendEvent('log', { step: '✅ [第二阶段完成]', message: `耗时 ${elapsed2}ms。成功从全网抓取到相关网页摘要。` });
          } else {
            sendEvent('log', { step: '⚠️ [第二阶段结束]', message: `全网检索未找到明显关联信息。` });
          }
        } catch (webErr: any) {
          sendEvent('log', { step: '❌ [第二阶段异常]', message: `全网检索失败: ${webErr.message}` });
        }

        // --- 阶段 2.5: 人才日志记忆层匹配 ---
        const journalSnippets: string[] = [];
        if (talents.length > 0) {
          try {
            const names = talents.slice(0, 10).map((t: any) => t.name).filter(Boolean);
            sendEvent('log', { step: '📚 [日志匹配]', message: `正在检查 ${names.length} 位候选人的历史档案...` });
            let matched = 0;
            for (const name of names) {
              try {
                const entry = await talentJournal.findByName(name, undefined, userToken);
                if (entry?.ai_report) {
                  matched++;
                  journalSnippets.push(`### ${name}（历史档案，搜索${entry.search_count}次）\n${entry.ai_report.substring(0, 1500)}`);
                }
              } catch { /* skip */ }
            }
            if (matched > 0) {
              sendEvent('log', { step: '✅ [日志匹配完成]', message: `${matched}/${names.length} 位候选人有历史档案，将融入报告` });
            } else {
              sendEvent('log', { step: '📝 [日志匹配完成]', message: `暂无历史档案，将基于本次检索数据生成报告` });
            }
          } catch (e) {
            sendEvent('log', { step: '⚠️ [日志匹配]', message: '日志查询跳过' });
          }
        }

        // --- 阶段 3: AI 组装报告 ---
        sendEvent('log', { step: '🧠 [第三阶段] 数据收集完毕', message: `开始交由大模型评估与组装推荐候选人报告...` });

        const assemblePrompt = `你是一位专业的人才情报分析师。用户希望寻找与特定条件相关的专家人才。
用户的核心条件：
- 核心研究领域/意图: "${topic}"
${expandedTopics ? `- 相关的语义扩展概念: "${expandedTopics}"` : ''}
${institution ? `- 限定机构: "${institution}"` : ''}
${honors ? `- 限定荣誉/标签: "${honors}"` : ''}

【写作规范】

1. 开篇概述：报告开头用 2-3 句话说明检索到多少位候选人、主要来自哪些机构/领域，帮用户建立整体认知。

2. 综合排序：不要按数据源分组输出，而是将所有候选人打散，按与用户需求的匹配度统一排序。同一个人在两个数据源中都出现，合并信息不要重复列出。

3. 翔实度原则：每位专家的介绍必须详尽充实。如果数据源提供了 introduction（人物简介）、research_field（研究领域描述）、notes 等长文本信息，必须充分利用并加工呈现，不要省略或过度浓缩。有几条经历就写几条，禁止“曾在多所高校任教”“发表多篇论文”这种归纳吞没。

4. 推荐理由：每位专家最后必须有一段「推荐理由」，用 2-3 句话结合用户的核心查询条件，解释为什么这位专家与用户需求强匹配。

5. 充分利用所有数据：原始 JSON 中每个专家的所有字段（姓名、机构、职位、研究方向、introduction、research_field、talent_type、notes、邮箱等）都必须写进报告。禁止丢失任何有效数据。

6. 无数据则跳过：某个字段为空就不写，不要写“暂无”“未知”。

【每位专家必须包含的内容（有数据的写，没数据的跳过）】
- 基本信息：姓名（中英文）、现任机构、职位/头衔、国籍/地区、邮箱
- 研究领域与方向：详细展开描述，不只写关键词。如果有 research_field 长文本，必须提取并呈现核心内容
- 人物简介：充分利用 introduction 字段，完整呈现其学术背景、职业履历、重要贡献。如果 introduction 为空，则基于其他字段组织一段至少 2-3 句话的介绍
- 荣誉与成就：talent_type（如院士、长江学者等）、奖项等
- 推荐理由：结合用户的核心查询条件，用 2-3 句话解释为什么这位专家是强匹配

【绝对禁止】
- 丢失数据：原始 JSON 中有的 introduction、research_field、notes 等不得遗漏
- 归纳吞没：“多篇论文”“多所高校”“多项荣誉”——必须逐条列出
- 空占位：“暂无”“未知”——直接不写
- 每位专家只写 1-2 句话就跳到下一个

【完整性自检】
写完报告后，回头检查原始 JSON 中每一位候选人的每一个有效字段是否都已写入报告。如果有遗漏，继续补充。宁可报告很长，也不允许丢失数据。

【原始数据 JSON】
${JSON.stringify(gatheredData, null, 2)}

特别注意：纯 Markdown 输出，直接从开篇概述开始。如果所有检索渠道都没有找到任何数据，委婉告知并建议放宽搜索条件。报告要尽可能详尽，把每位专家的所有有效信息都写进去。
${journalSnippets.length > 0 ? `

【历史档案参考】以下候选人在系统中有更详细的历史档案。写报告时请融合这些信息，让每位专家的介绍更加充实：

${journalSnippets.join('\n\n')}

注意：历史档案仅供参考，如与本次检索数据冲突，以本次数据为准。` : ''}
`;

        const client = getOpenAIClient();
        const aiStream = await client.chat.completions.create({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
          messages: [{ role: 'user', content: assemblePrompt }],
          stream: true,
          max_tokens: 8192,
        });

        for await (const chunk of aiStream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            sendEvent('ai_chunk', text);
          }
        }

        sendEvent('raw_data', { gatheredData, searchCondition: topic });
        sendEvent('done', { message: '报告生成完毕' });
        controller.close();
      } catch (e: any) {
        sendEvent('error', { message: String(e.message || e) });
        controller.close();
      }
    }
  });
}
