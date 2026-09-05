/**
 * lib/intelligence/industry-pipeline.ts
 *
 * 产业热度分析 Pipeline
 *
 * 流水线：
 *   Stage 1: 路由分类器 → 提取行业关键词 + 搜索策略
 *   Stage 2: 并行（产业研究员 + 政策扫描器 + 人才扫描器 + 注意力迁移分析器 + 区域缺口评估器）
 *   Stage 3: 总编整合器 → 输出完整报告
 *
 * 数据源：
 *   - 平方 MCP: VSDIndustryList, VSDIndustryPolicy, CRMTalentPerson, VSDPaperAuthor, VSDPatentInventor 等
 *   - 联网搜索: searchWeb
 *   - AI 推理: DashScope qwen-plus
 */

import { mcpToolsDataPlatform } from '@/lib/mcp/generated-tools';
import { TalentAuditService } from '@/lib/mcp/talent';
import { searchWeb } from '@/lib/search';
import type {
  IndustryReport, HeatSource, HeatTrendPoint, FieldDistItem,
  TechTrend, TopTalentItem, TopCompanyItem, AttentionShiftItem,
  RegionalGapItem, PolicyItem, RiskAlert, Recommendation, InvestTrendItem,
} from './types';
import {
  SendFn, getMCPToken, callAIForJSON,
  agentWorking, agentDone, agentError, log,
} from './shared';

const talentService = new TalentAuditService();

// ═══════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════

export async function runIndustryPipeline(
  industry: string,
  region: string,
  send: SendFn
): Promise<IndustryReport> {
  const token = getMCPToken();
  const regionStr = region || '全国';

  // ═══════════════════════════════════════
  // STAGE 1: 路由分类器
  // ═══════════════════════════════════════
  agentWorking(send, '路由分类器', 'compass');
  log(send, `正在分析产业方向: ${industry}（${regionStr}）...`);

  let routerResult = await agentRouter(industry, regionStr);
  agentDone(send, '路由分类器', 'compass');
  log(send, `已识别行业关键词: ${routerResult.keywords.join(', ')}`);

  // ═══════════════════════════════════════
  // STAGE 2: 并行子 Agent
  // ═══════════════════════════════════════
  agentWorking(send, '产业研究员', 'globe');
  agentWorking(send, '政策扫描器', 'shield');
  agentWorking(send, '人才扫描器', 'users');
  log(send, '启动并行分析: 产业研究员 + 政策扫描器 + 人才扫描器...');

  const [industryResult, policyResult, talentResult] = await Promise.all([
    agentIndustryResearcher(industry, regionStr, routerResult, token, send),
    agentPolicyScanner(industry, regionStr, routerResult.keywords, token, send),
    agentTalentScanner(industry, regionStr, routerResult.keywords, token, send),
  ]);

  agentDone(send, '产业研究员', 'globe');
  agentDone(send, '政策扫描器', 'shield');
  agentDone(send, '人才扫描器', 'users');

  // 依赖 Stage 2 结果的子 Agent
  agentWorking(send, '注意力迁移分析器', 'trending-up');
  agentWorking(send, '区域缺口评估器', 'alert-triangle');
  log(send, '启动注意力迁移分析 + 区域缺口评估...');

  const [attentionResult, gapResult] = await Promise.all([
    agentAttentionShift(talentResult.topTalents, token, send),
    agentRegionalGap(industry, regionStr, industryResult.fieldDistribution, token, send),
  ]);

  agentDone(send, '注意力迁移分析器', 'trending-up');
  agentDone(send, '区域缺口评估器', 'alert-triangle');

  // ═══════════════════════════════════════
  // STAGE 3: 总编整合器
  // ═══════════════════════════════════════
  agentWorking(send, '总编整合器', 'file-text');
  log(send, '正在整合全部分析结果...');

  const report = await agentEditor(
    industry, regionStr,
    industryResult, policyResult, talentResult,
    attentionResult, gapResult, send
  );

  agentDone(send, '总编整合器', 'file-text');
  log(send, '产业热度分析报告生成完成！');

  return report;
}

// ═══════════════════════════════════════════════════════
// 子 Agent 1: 路由分类器
// ═══════════════════════════════════════════════════════

interface RouterResult {
  keywords: string[];
  searchQueries: string[];
  relatedFields: string[];
}

async function agentRouter(industry: string, region: string): Promise<RouterResult> {
  try {
    const result = await callAIForJSON(
      '你是一名行业分类路由器。严格按 JSON 格式输出。',
      `请分析以下产业方向，提取搜索关键词和相关细分领域。
产业方向：${industry}
区域：${region}

输出严格 JSON：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "searchQueries": ["用于搜索的查询语句1", "查询语句2", "查询语句3"],
  "relatedFields": ["细分领域1", "细分领域2", "细分领域3", "细分领域4", "细分领域5"]
}`,
      { temperature: 0.2 }
    );
    return {
      keywords: result.keywords || [industry],
      searchQueries: result.searchQueries || [`${industry} 行业发展趋势 2025 2026`],
      relatedFields: result.relatedFields || [],
    };
  } catch {
    return {
      keywords: [industry],
      searchQueries: [`${industry} 行业发展趋势 2025 2026`],
      relatedFields: [],
    };
  }
}

// ═══════════════════════════════════════════════════════
// 子 Agent 2: 产业研究员
// ═══════════════════════════════════════════════════════

interface IndustryResearchResult {
  overview: string;
  heatIndex: { score: number; trend: '上升' | '下降' | '稳定'; judgment: string };
  heatSources: HeatSource[];
  heatTrend: HeatTrendPoint[];
  fieldDistribution: FieldDistItem[];
  techTrends: TechTrend[];
  investTrend: InvestTrendItem[];
}

async function agentIndustryResearcher(
  industry: string, region: string,
  router: RouterResult, token: string,
  send: SendFn
): Promise<IndustryResearchResult> {
  // 1. MCP: 查产业目录
  let industryEntities = '';
  try {
    log(send, '产业研究员正在检索平方数据工作台产业实体...');
    const res = await mcpToolsDataPlatform.dashGenericSearch({
      model: 'VSDIndustryList',
      condition: JSON.stringify({
        logic_operator: '|',
        children: router.keywords.map(k => ({
          leaf: { field: 'name', comparator: 'ilike', value: `%${k}%` }
        }))
      }),
      fields: ['id', 'name', 'industry_type', 'level', 'code'],
      limit: 20,
    }, token);
    if (res.items?.length > 0) {
      industryEntities = res.items.map((i: any) => `- ${i.name} (${i.industry_type || ''}, Level: ${i.level || ''})`).join('\n');
      log(send, `产业研究员获取到 ${res.items.length} 条产业目录数据`);
    }
  } catch (e: any) {
    log(send, `产业目录查询跳过: ${e.message?.substring(0, 60)}`);
  }

  // 2. 联网搜索: 行业趋势 + 媒体热度
  let webSearchText = '';
  try {
    log(send, '产业研究员正在联网搜索行业最新动态...');
    const queries = router.searchQueries.slice(0, 2);
    const results = await Promise.all(queries.map(q => searchWeb(q).catch(() => null)));
    webSearchText = results
      .filter(Boolean)
      .map(r => r!.AbstractText?.substring(0, 1500))
      .filter(Boolean)
      .join('\n\n---\n\n');
    if (webSearchText) {
      log(send, `联网搜索完成，获取 ${webSearchText.length} 字行业资料`);
    }
  } catch {
    log(send, '联网搜索跳过');
  }

  // 3. AI 分析
  log(send, '产业研究员正在撰写产业全景分析...');
  const result = await callAIForJSON(
    '你是一名资深产业研究员。请基于提供的数据源，进行深度产业分析。严格按 JSON 格式输出。',
    `## 分析目标
产业：${industry}，区域：${region}

## 数据源 1: 平方数据工作台产业实体
${industryEntities || '未查到相关数据'}

## 数据源 2: 互联网搜索结果
${webSearchText || '未获取到搜索结果'}

## 细分领域参考
${router.relatedFields.join('、')}

## 输出格式（严格 JSON）
{
  "overview": "产业全景概述（300-500字，涵盖规模、增长趋势、产业链关系、技术方向）",
  "heatIndex": {
    "score": 87,
    "trend": "上升",
    "judgment": "综合热度判断（100字）"
  },
  "heatSources": [
    { "source": "科技媒体", "score": 87, "desc": "数据来源说明", "trend": "up" },
    { "source": "arXiv 预印本", "score": 90, "desc": "数据来源说明", "trend": "up" },
    { "source": "VC/投资报告", "score": 84, "desc": "数据来源说明", "trend": "up" },
    { "source": "政策文件", "score": 80, "desc": "数据来源说明", "trend": "stable" }
  ],
  "heatTrend": [
    { "month": "2026-01", "source": "科技媒体", "value": 72 },
    { "month": "2026-02", "source": "科技媒体", "value": 74 }
  ],
  "fieldDistribution": [
    { "field": "大语言模型", "count": 42 },
    { "field": "计算机视觉", "count": 28 }
  ],
  "techTrends": [
    { "direction": "技术方向名称", "maturity": "成熟", "description": "趋势描述" }
  ],
  "investTrend": [
    { "month": "2026-Q1", "value": 186 },
    { "month": "2026-Q2", "value": 247 }
  ]
}

重要提示：
1. heatTrend 数据需覆盖最近 9 个月（2026-01 到 2026-09），每个月有4个source的数据点
2. fieldDistribution 至少 5 个细分领域
3. techTrends 至少 4 个技术方向
4. investTrend 至少 3 个季度
5. 所有数据基于你搜索到的真实信息做合理推断，不要凭空编造`,
    { temperature: 0.5, maxTokens: 6000 }
  );

  return {
    overview: result.overview || '',
    heatIndex: result.heatIndex || { score: 0, trend: '稳定', judgment: '' },
    heatSources: result.heatSources || [],
    heatTrend: result.heatTrend || [],
    fieldDistribution: result.fieldDistribution || [],
    techTrends: result.techTrends || [],
    investTrend: result.investTrend || [],
  };
}

// ═══════════════════════════════════════════════════════
// 子 Agent 3: 政策扫描器
// ═══════════════════════════════════════════════════════

interface PolicyResult {
  summary: string;
  keyPolicies: PolicyItem[];
  riskAlerts: RiskAlert[];
}

async function agentPolicyScanner(
  industry: string, region: string,
  keywords: string[], token: string,
  send: SendFn
): Promise<PolicyResult> {
  // 1. MCP: 查产业政策
  let policyData: any[] = [];
  try {
    log(send, '政策扫描器正在检索产业政策数据...');
    // 按城市/省 + 关键词搜索
    const cityKeyword = region.replace(/区$|市$|省$/, '');
    const res = await mcpToolsDataPlatform.dashGenericSearch({
      model: 'VSDIndustryPolicy',
      condition: JSON.stringify({
        logic_operator: '&',
        children: [
          {
            logic_operator: '|',
            children: [
              { leaf: { field: 'city', comparator: 'ilike', value: `%${cityKeyword}%` } },
              { leaf: { field: 'province', comparator: 'ilike', value: `%${cityKeyword}%` } },
              { leaf: { field: 'region', comparator: 'ilike', value: `%${cityKeyword}%` } },
            ]
          },
        ]
      }),
      fields: ['id', 'name', 'type', 'publish_date', 'publish_organization', 'theme', 'policy_keywords', 'official_link', 'remarks'],
      limit: 15,
    }, token);
    policyData = res.items || [];
    if (policyData.length > 0) {
      log(send, `政策扫描器获取到 ${policyData.length} 条政策数据`);
    }
  } catch (e: any) {
    log(send, `政策数据查询跳过: ${e.message?.substring(0, 60)}`);
  }

  // 2. 联网搜索补充
  let webPolicies = '';
  try {
    const webRes = await searchWeb(`${region} ${industry} 政策 扶持 2025 2026`);
    webPolicies = webRes?.AbstractText?.substring(0, 1500) || '';
    if (webPolicies) log(send, `政策扫描器联网搜索完成`);
  } catch {}

  // 3. AI 分析
  log(send, '政策扫描器正在分析政策环境...');
  const policyStr = policyData.map(p =>
    `- ${p.name || '未命名'} (${p.publish_organization || ''}, ${p.publish_date || ''}) 主题: ${p.theme || ''} 关键词: ${p.policy_keywords || ''}`
  ).join('\n');

  const result = await callAIForJSON(
    '你是一名政策分析师。请分析产业政策环境。严格按 JSON 格式输出。',
    `## 分析目标
产业：${industry}，区域：${region}

## 数据源 1: 平方数据工作台政策数据
${policyStr || '未查到政策数据'}

## 数据源 2: 互联网搜索
${webPolicies || '未获取到'}

## 输出格式（严格 JSON）
{
  "summary": "政策环境总结（100-200字）",
  "keyPolicies": [
    { "name": "政策名称", "relevance": "与该产业的关联分析", "publishDate": "发布日期", "publishOrg": "发布机构", "officialLink": "链接" }
  ],
  "riskAlerts": [
    { "title": "预警标题", "level": "高/中/低", "description": "描述", "suggestion": "建议" }
  ]
}

至少输出 3 条政策和 2 条风险预警。如果平方数据不足，基于联网搜索结果合理补充。`,
    { temperature: 0.5 }
  );

  return {
    summary: result.summary || '',
    keyPolicies: result.keyPolicies || [],
    riskAlerts: result.riskAlerts || [],
  };
}

// ═══════════════════════════════════════════════════════
// 子 Agent 4: 人才扫描器
// ═══════════════════════════════════════════════════════

interface TalentScanResult {
  summary: string;
  topTalents: TopTalentItem[];
  topCompanies: TopCompanyItem[];
}

async function agentTalentScanner(
  industry: string, region: string,
  keywords: string[], token: string,
  send: SendFn
): Promise<TalentScanResult> {
  // 1. MCP: 按研究方向搜索人才
  let talents: any[] = [];
  try {
    log(send, '人才扫描器正在检索区域头部人才...');
    // 用多个关键词搜索
    for (const kw of keywords.slice(0, 3)) {
      const batch = await talentService.searchTalentsByTopic(kw, 10, token);
      talents.push(...batch);
    }
    // 去重（按 id）
    const seen = new Set<number>();
    talents = talents.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
    log(send, `人才扫描器共检索到 ${talents.length} 位相关人才`);
  } catch (e: any) {
    log(send, `人才搜索跳过: ${e.message?.substring(0, 60)}`);
  }

  // 2. MCP: 查头部企业
  let companies: any[] = [];
  try {
    log(send, '人才扫描器正在检索头部企业...');
    const cityKeyword = region.replace(/区$|市$|省$/, '');
    for (const kw of keywords.slice(0, 2)) {
      const res = await mcpToolsDataPlatform.dashGenericSearch({
        model: 'CRMCompany',
        condition: JSON.stringify({
          logic_operator: '&',
          children: [
            { leaf: { field: 'business_range', comparator: 'ilike', value: `%${kw}%` } },
            {
              logic_operator: '|',
              children: [
                { leaf: { field: 'city', comparator: 'ilike', value: `%${cityKeyword}%` } },
                { leaf: { field: 'province', comparator: 'ilike', value: `%${cityKeyword}%` } },
              ]
            },
          ]
        }),
        fields: ['id', 'name', 'brief_name', 'business_range', 'city', 'introduction', 'one_sentence', 'kind', 'official_website'],
        limit: 10,
      }, token);
      companies.push(...(res.items || []));
    }
    // 去重
    const seenC = new Set<number>();
    companies = companies.filter(c => {
      if (seenC.has(c.id)) return false;
      seenC.add(c.id);
      return true;
    });
    log(send, `人才扫描器共检索到 ${companies.length} 家相关企业`);
  } catch (e: any) {
    log(send, `企业搜索跳过: ${e.message?.substring(0, 60)}`);
  }

  // 3. 联网搜索补充头部人才/企业
  let webTalentText = '';
  try {
    const webRes = await searchWeb(`${region} ${industry} 头部人才 领军人物 教授 企业 2025`);
    webTalentText = webRes?.AbstractText?.substring(0, 2000) || '';
  } catch {}

  // 4. AI 整合
  log(send, '人才扫描器正在整合分析...');
  const talentStr = talents.slice(0, 15).map(t =>
    `- ${t.name || ''} (${t.name_en || ''})，机构: ${t.workplace_current || t.school_current || ''}，方向: ${String(t.research_field || '').substring(0, 100)}，职位: ${t.position_current || ''}，类型: ${t.talent_type || ''}`
  ).join('\n');
  const companyStr = companies.slice(0, 10).map(c =>
    `- ${c.name || c.brief_name || ''} (${c.city || ''})，业务: ${String(c.business_range || c.one_sentence || '').substring(0, 100)}`
  ).join('\n');

  const result = await callAIForJSON(
    '你是一名人才与产业分析师。请整合多源数据，输出结构化的人才和企业列表。严格按 JSON 格式输出。',
    `## 分析目标
产业：${industry}，区域：${region}

## 数据源 1: 平方人才库
${talentStr || '未查到相关人才'}

## 数据源 2: 平方企业库
${companyStr || '未查到相关企业'}

## 数据源 3: 互联网搜索
${webTalentText || '未获取到'}

## 输出格式（严格 JSON）
{
  "summary": "人才储备总结（100-200字）",
  "topTalents": [
    { "name": "姓名", "field": "研究领域", "institution": "机构", "achievement": "代表成果", "level": "院士/教授/企业家/副教授" }
  ],
  "topCompanies": [
    { "name": "企业名", "field": "业务领域", "scale": "规模", "stage": "上市/B轮/A轮", "highlight": "核心产品/亮点" }
  ]
}

至少输出 10 位人才和 8 家企业。优先使用平方数据库的真实数据，不足部分用联网搜索补充。`,
    { temperature: 0.5 }
  );

  return {
    summary: result.summary || '',
    topTalents: result.topTalents || [],
    topCompanies: result.topCompanies || [],
  };
}

// ═══════════════════════════════════════════════════════
// 子 Agent 5: 注意力迁移分析器
// ═══════════════════════════════════════════════════════

async function agentAttentionShift(
  topTalents: TopTalentItem[],
  token: string,
  send: SendFn
): Promise<AttentionShiftItem[]> {
  // 对前 8 位人才，尝试查其近期论文方向
  const talentNames = topTalents.slice(0, 8);
  let paperDataStr = '';

  try {
    log(send, '注意力迁移分析器正在检索人才论文方向...');
    // 逐人查平方库拿 id，再查论文
    for (const t of talentNames.slice(0, 5)) {
      try {
        const res = await mcpToolsDataPlatform.dashGenericSearch({
          model: 'CRMTalentPerson',
          condition: JSON.stringify({
            logic_operator: '&',
            children: [{ leaf: { field: 'name', comparator: 'ilike', value: `%${t.name}%` } }]
          }),
          fields: ['id', 'name', 'research_field'],
          limit: 1,
        }, token);
        if (res.items?.[0]) {
          const talentId = (res.items[0] as any).id;
          // 查论文关联
          const paperRes = await mcpToolsDataPlatform.dashGenericSearch({
            model: 'VSDPaperAuthor',
            condition: JSON.stringify({
              logic_operator: '&',
              children: [
                { leaf: { field: 'talent_id', comparator: '=', value: talentId } },
              ]
            }),
            fields: ['id', 'paper_id'],
            limit: 5,
          }, token);
          if (paperRes.items?.length) {
            // 拉几篇论文标题
            const paperTitles: string[] = [];
            for (const pa of (paperRes.items as any[]).slice(0, 3)) {
              try {
                const pDetail = await mcpToolsDataPlatform.dashGenericRelationModelSearch({
                  currentModel: 'VSDPaperAuthor',
                  currentID: pa.id,
                  currentRelationField: 'paper_id',
                  fields: ['id', 'name'],
                  limit: 1, offset: 0, searchType: 'associated',
                }, token);
                if (pDetail.items?.[0]) paperTitles.push((pDetail.items[0] as any).name || '');
              } catch {}
            }
            if (paperTitles.length > 0) {
              paperDataStr += `\n${t.name}: 近期论文: ${paperTitles.join('; ')}`;
            }
          }
        }
      } catch {}
    }
  } catch {}

  // AI 分析迁移信号
  log(send, '注意力迁移分析器正在AI分析...');
  const result = await callAIForJSON(
    '你是一名学术注意力分析专家。请分析人才的研究方向迁移信号。严格按 JSON 格式输出。',
    `## 人才列表
${talentNames.map(t => `- ${t.name}，当前领域: ${t.field}，机构: ${t.institution}`).join('\n')}

## 论文数据
${paperDataStr || '暂无具体论文数据，请基于人才领域和近期行业趋势做合理推断'}

## 输出格式（严格 JSON）
{
  "shifts": [
    {
      "name": "人才姓名",
      "from": "原研究方向",
      "to": "新研究方向",
      "signal": "迁移信号描述（基于论文方向变化/专利变化/社交媒体等）",
      "risk": "高/中/低"
    }
  ]
}

输出 4-6 条迁移分析。对于有论文数据的人才，基于论文标题判断方向变化；没有数据的，基于行业趋势做合理推断并标注"推断"。`,
    { temperature: 0.5 }
  );

  return result.shifts || [];
}

// ═══════════════════════════════════════════════════════
// 子 Agent 6: 区域缺口评估器
// ═══════════════════════════════════════════════════════

async function agentRegionalGap(
  industry: string, region: string,
  fieldDist: FieldDistItem[],
  token: string,
  send: SendFn
): Promise<RegionalGapItem[]> {
  // 1. 联网搜索：各新兴领域全国热度
  let webHeatText = '';
  try {
    log(send, '区域缺口评估器正在分析全国热度与区域能力...');
    const webRes = await searchWeb(`${industry} 新兴领域 全国热度 人才缺口 区域布局 2025 2026`);
    webHeatText = webRes?.AbstractText?.substring(0, 2000) || '';
  } catch {}

  // 2. 对每个细分领域统计区域内人才数
  const fieldStats: string[] = [];
  for (const f of fieldDist.slice(0, 5)) {
    try {
      const res = await mcpToolsDataPlatform.dashGenericSearch({
        model: 'CRMTalentPerson',
        condition: JSON.stringify({
          logic_operator: '&',
          children: [
            { leaf: { field: 'research_field', comparator: 'ilike', value: `%${f.field}%` } },
          ]
        }),
        fields: ['id'],
        limit: 1,
      }, token);
      const count = (res as any).total ?? res.items?.length ?? 0;
      fieldStats.push(`${f.field}: 平方库匹配人才数 ${count}`);
    } catch {
      fieldStats.push(`${f.field}: 查询失败`);
    }
  }

  // 3. AI 评估
  log(send, '区域缺口评估器正在AI分析...');
  const result = await callAIForJSON(
    '你是一名区域产业分析专家。请评估新兴领域在特定区域的发展缺口与人才流出风险。严格按 JSON 格式输出。',
    `## 分析目标
产业：${industry}，区域：${region}

## 细分领域分布
${fieldDist.map(f => `- ${f.field}: 占比 ${f.count}`).join('\n')}

## 区域内人才统计
${fieldStats.join('\n')}

## 全国热度参考
${webHeatText || '未获取到'}

## 输出格式（严格 JSON）
{
  "gaps": [
    {
      "field": "新兴领域名称",
      "nationalHeat": 92,
      "regionalCapacity": 35,
      "gap": 57,
      "riskLevel": "高/中/低",
      "outflowRisk": "该领域全国热度急升但区域布局不足，相关人才可能流向XX"
    }
  ]
}

输出 5 条缺口分析，按 gap 从大到小排列。nationalHeat 和 regionalCapacity 均为 0-100。`,
    { temperature: 0.5 }
  );

  return result.gaps || [];
}

// ═══════════════════════════════════════════════════════
// 子 Agent 7: 总编整合器
// ═══════════════════════════════════════════════════════

async function agentEditor(
  industry: string, region: string,
  industryResult: IndustryResearchResult,
  policyResult: PolicyResult,
  talentResult: TalentScanResult,
  attentionShifts: AttentionShiftItem[],
  regionalGaps: RegionalGapItem[],
  send: SendFn
): Promise<IndustryReport> {
  // 生成行动建议
  log(send, '总编整合器正在生成行动建议...');
  const recResult = await callAIForJSON(
    '你是一名产业发展顾问。请基于以下分析结果生成行动建议。严格按 JSON 格式输出。',
    `## 产业全景
${industryResult.overview?.substring(0, 500)}

## 政策环境
${policyResult.summary?.substring(0, 300)}

## 区域缺口
${regionalGaps.map(g => `- ${g.field}: 缺口 ${g.gap}, ${g.outflowRisk}`).join('\n')}

## 输出格式
{
  "recommendations": [
    { "priority": 1, "action": "建议内容" }
  ]
}
输出 4-6 条，按优先级排列。`,
    { temperature: 0.5, maxTokens: 2000 }
  );

  // 组装最终报告
  const report: IndustryReport = {
    reportTitle: `${region} ${industry} 产业热度分析报告`,
    reportDate: new Date().toLocaleDateString('zh-CN'),
    industry,
    region,

    heatIndex: industryResult.heatIndex,
    heatSources: industryResult.heatSources,
    heatTrend: industryResult.heatTrend,

    industryOverview: industryResult.overview,
    fieldDistribution: industryResult.fieldDistribution,
    techTrends: industryResult.techTrends,

    talentLandscape: {
      summary: talentResult.summary,
      topTalents: talentResult.topTalents,
    },
    topCompanies: talentResult.topCompanies,

    attentionShifts,
    regionalGaps,

    policyEnvironment: {
      summary: policyResult.summary,
      keyPolicies: policyResult.keyPolicies,
    },
    riskAlerts: policyResult.riskAlerts,
    investTrend: industryResult.investTrend,
    recommendations: recResult.recommendations || [],
  };

  return report;
}
