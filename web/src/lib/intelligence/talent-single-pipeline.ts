/**
 * lib/intelligence/talent-single-pipeline.ts
 *
 * 单人深度分析 Pipeline
 *
 * 流水线：
 *   Stage 1: 并行（runTalentDeepSearchStream + 平方 MCP 关联数据）
 *   Stage 2: AI 深度分析（活跃度雷达 + 风险评估 + 时间线）
 *
 * 数据源：
 *   - runTalentDeepSearchStream（多源融合深搜）
 *   - TalentAuditService.searchTalents（平方库 + 6维关联数据）
 *   - talentJournal（历史快照对比）
 */

import { runTalentDeepSearchStream } from '@/lib/tools/talentDeepSearch';
import { TalentAuditService } from '@/lib/mcp/talent';
import { talentJournal } from '@/lib/mcp/talent-journal';
import type { ProfileReport, RadarDimension, TimelineEvent, RiskDimension } from './types';
import {
  SendFn, getMCPToken, callAIForJSON,
  agentWorking, agentDone, agentError, log,
} from './shared';

const talentService = new TalentAuditService();

// ═══════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════

export async function runTalentSinglePipeline(
  name: string,
  institution: string,
  send: SendFn
): Promise<ProfileReport> {
  const token = getMCPToken();

  log(send, `启动单人深度分析: ${name}${institution ? ' · ' + institution : ''}`);

  // ═══════════════════════════════════════
  // STAGE 1: 并行数据采集
  // ═══════════════════════════════════════
  agentWorking(send, '多源深搜', 'search');
  agentWorking(send, '平方数据', 'database');
  log(send, '启动并行采集: 多源深搜 + 平方数据库...');

  // 1a: Deep Search（流式消费）
  const deepSearchPromise = (async () => {
    let data: Record<string, any> = {};
    let aiReport = '';
    let dataSources: string[] = [];

    try {
      const stream = await runTalentDeepSearchStream(name, institution, undefined, undefined, token);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.substring(6));
            if (evt.type === 'structured_data') data = { ...data, ...evt.data };
            if (evt.type === 'ai_report') aiReport = evt.data || '';
            if (evt.type === 'data_sources') dataSources = evt.data || [];
            if (evt.type === 'complete') {
              if (evt.structured_data) data = evt.structured_data;
              if (evt.ai_report) aiReport = evt.ai_report;
              if (evt.data_sources) dataSources = evt.data_sources;
            }
          } catch {}
        }
      }
      log(send, `多源深搜完成（数据源: ${dataSources.join(', ')}）`);
    } catch (e: any) {
      log(send, `多源深搜失败: ${e.message?.substring(0, 60)}`);
    }

    return { data, aiReport, dataSources };
  })();

  // 1b: 平方 MCP 结构化数据
  const mcpPromise = (async () => {
    try {
      const results = await talentService.searchTalents(name, 3, token);
      if (results.length > 0) {
        // 取最匹配的一个
        const best = results[0];
        log(send, `平方数据库匹配: ${best.name}（${best.workplace_current || best.school_current || ''}）`);
        return best;
      }
      log(send, '平方数据库未匹配到目标人才');
      return null;
    } catch (e: any) {
      log(send, `平方数据库查询失败: ${e.message?.substring(0, 60)}`);
      return null;
    }
  })();

  // 1c: 历史档案
  const journalPromise = (async () => {
    try {
      const entry = await talentJournal.findByName(name, institution, token);
      if (entry) log(send, `找到历史档案（搜索 ${entry.search_count} 次）`);
      return entry;
    } catch { return null; }
  })();

  const [deepSearch, mcpData, journalEntry] = await Promise.all([
    deepSearchPromise, mcpPromise, journalPromise,
  ]);

  agentDone(send, '多源深搜', 'search');
  agentDone(send, '平方数据', 'database');

  // ═══════════════════════════════════════
  // STAGE 2: AI 深度分析
  // ═══════════════════════════════════════
  agentWorking(send, '深度分析引擎', 'brain');
  log(send, '正在执行 AI 深度分析...');

  // 构造上下文
  const sd = deepSearch.data;
  const pf = mcpData;
  const contextStr = `
## 目标人才
- 姓名: ${name}
- 机构: ${institution}

## 平方数据库信息
${pf ? `- 姓名: ${pf.name} / ${pf.name_en || ''}
- 机构: ${pf.workplace_current || pf.school_current || ''}
- 职位: ${pf.position_current || ''}
- 研究领域: ${String(pf.research_field || '').substring(0, 300)}
- 教育背景: ${(pf.education_backgrounds || []).map((e: any) => `${e.school_name_cn || ''} ${e.degree || ''} ${e.major_name_cn || ''}`).join('; ')}
- 工作经历: ${(pf.work_experiences || []).slice(0, 5).map((w: any) => `${w.employer || w.name || ''} ${w.position || ''} (${w.start_date || ''}~${w.end_date || w.is_current_work ? '至今' : ''})`).join('; ')}
- 奖项: ${(pf.award_experiences || []).slice(0, 5).map((a: any) => `${a.program_name || a.description || ''} ${a.year || ''}`).join('; ')}
- 专利: ${(pf.patents || []).length} 项 ${(pf.patents || []).slice(0, 3).map((p: any) => p.name || '').join('; ')}
- 论文: ${(pf.papers || []).length} 篇 ${(pf.papers || []).slice(0, 3).map((p: any) => p.name || '').join('; ')}` : '未查到平方数据'}

## 多源深搜数据
${sd?.google_scholar ? `- Google Scholar: h-index=${sd.google_scholar?.h_index || 'N/A'}, 被引=${sd.google_scholar?.cited_by_count || 'N/A'}, 发文=${sd.google_scholar?.works_count || 'N/A'}` : ''}
${sd?.orcid ? `- ORCID: ${String(JSON.stringify(sd.orcid)).substring(0, 300)}` : ''}
${sd?.internet ? `- 互联网: ${String(sd.internet).substring(0, 800)}` : ''}

## AI 深搜报告
${deepSearch.aiReport?.substring(0, 1500) || '无'}

## 历史档案
${journalEntry ? `上次搜索: ${journalEntry.last_searched_at}, h-index=${journalEntry.h_index || 'N/A'}, 被引=${journalEntry.cited_by_count || 'N/A'}, 发文=${journalEntry.works_count || 'N/A'}, 机构=${journalEntry.workplace || journalEntry.institution || ''}` : '无历史档案'}
`;

  const analysisResult = await callAIForJSON(
    `你是一名资深人才情报分析师。请基于多源数据对目标人才进行全方位深度分析。
输出需包含活跃度雷达（5+维度）、活动频率基线对比、风险维度评估、活动时间线、异常事件。
严格按 JSON 格式输出。`,
    `${contextStr}

## 输出格式（严格 JSON）
{
  "activityRadar": [
    { "dimension": "论文产出", "score": 85 },
    { "dimension": "学术影响力", "score": 92 },
    { "dimension": "项目活跃度", "score": 70 },
    { "dimension": "产学合作", "score": 60 },
    { "dimension": "公开活动", "score": 45 },
    { "dimension": "国际交流", "score": 75 }
  ],
  "activityScore": 78,
  "activityLevel": "高活跃/正常/低活跃/沉寂",
  "activityBaseline": {
    "current": 78,
    "baseline": 65,
    "deviation": "高于基线 20%"
  },
  "mobilityRisk": "高/中/低",
  "mobilityScore": 35,
  "riskDimensions": [
    { "dimension": "机构稳定性", "score": 25, "analysis": "分析说明" },
    { "dimension": "研究方向偏移", "score": 40, "analysis": "分析说明" },
    { "dimension": "合作网络变化", "score": 30, "analysis": "分析说明" },
    { "dimension": "产业化信号", "score": 20, "analysis": "分析说明" }
  ],
  "overallRiskAssessment": "综合风险评估（200字）",
  "timeline": [
    { "date": "2026-08", "type": "论文", "title": "事件标题", "detail": "事件详情", "source": "来源", "url": "链接" }
  ],
  "anomalies": [
    { "date": "2026-07", "type": "类型", "description": "异常描述", "severity": "高/中/低" }
  ]
}

## 重要提示
1. activityRadar 至少 5 个维度
2. riskDimensions 至少 4 个维度
3. timeline 至少 5 条事件，涵盖论文、专利、会议、职务变动等
4. 所有评分基于实际数据做合理推断
5. 无数据支撑的结论明确标注"推断"或"数据不足"`,
    { temperature: 0.5, maxTokens: 6000 }
  );

  agentDone(send, '深度分析引擎', 'brain');
  log(send, '单人深度分析完成！');

  // 组装 ProfileReport
  const report: ProfileReport = {
    name: pf?.name || name,
    nameEn: pf?.name_en || sd?.google_scholar?.name_en || '',
    institution: pf?.workplace_current || pf?.school_current || institution,
    position: pf?.position_current || '',
    researchField: String(pf?.research_field || '').substring(0, 200),
    photoUrl: (pf as any)?.['photo_id.download_url'] || '',

    hIndex: sd?.google_scholar?.h_index || journalEntry?.h_index,
    citedByCount: sd?.google_scholar?.cited_by_count || journalEntry?.cited_by_count,
    worksCount: sd?.google_scholar?.works_count || journalEntry?.works_count,
    patentCount: (pf?.patents || []).length,

    activityRadar: analysisResult.activityRadar || [],
    activityScore: analysisResult.activityScore || 0,
    activityLevel: analysisResult.activityLevel || '正常',
    activityBaseline: analysisResult.activityBaseline || { current: 0, baseline: 0, deviation: '数据不足' },

    mobilityRisk: analysisResult.mobilityRisk || '低',
    mobilityScore: analysisResult.mobilityScore || 0,

    riskDimensions: analysisResult.riskDimensions || [],
    overallRiskAssessment: analysisResult.overallRiskAssessment || '',

    timeline: analysisResult.timeline || [],
    anomalies: analysisResult.anomalies || [],

    education: pf?.education_backgrounds || [],
    workExperience: pf?.work_experiences || [],
    awards: pf?.award_experiences || [],
    patents: pf?.patents || [],
    papers: pf?.papers || [],

    // journal metadata
    searchCount: journalEntry?.search_count,
    firstSearchedAt: journalEntry?.first_searched_at,
    lastSearchedAt: journalEntry?.last_searched_at,
    dataSources: journalEntry?.data_sources || deepSearch.dataSources || [],
    verified: journalEntry?.verified ?? false,
    pingfangId: pf?.id || journalEntry?.pingfang_id,
    orcidId: journalEntry?.orcid_data?.orcidId || '',
  };

  return report;
}
