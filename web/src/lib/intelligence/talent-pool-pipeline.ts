/**
 * lib/intelligence/talent-pool-pipeline.ts
 *
 * 人才池分析 Pipeline
 *
 * 流水线：
 *   Stage 1: 并发对每位人才执行深搜 + 查历史档案（每批3人）
 *   Stage 2: AI 综合分析活跃度、流动风险、异常信号
 *   Stage 3: 组装 Dashboard 数据结构
 *
 * 数据源：
 *   - runTalentDeepSearchStream（深度搜索）
 *   - talentJournal（历史档案对比）
 *   - Gemini / searchWeb（fallback）
 */

import { runTalentDeepSearchStream } from '@/lib/tools/talentDeepSearch';
import { talentJournal } from '@/lib/mcp/talent-journal';
import { searchWeb } from '@/lib/search';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { MonitorReport, TalentCard, MonitorRiskAlert } from './types';
import {
  SendFn, getMCPToken, callAIForJSON,
  agentWorking, agentDone, agentError, log,
} from './shared';

// ── 内部类型 ──

interface TalentInput {
  name: string;
  institution: string;
}

interface TalentProfile {
  name: string;
  institution: string;
  deepSearchData: Record<string, any>;
  aiReport: string;
  dataSources: string[];
  journalEntry: any | null;
  hasHistory: boolean;
}

// ═══════════════════════════════════════════════════════
// 主入口
// ═══════════════════════════════════════════════════════

export async function runTalentPoolPipeline(
  talents: TalentInput[],
  region: string,
  send: SendFn
): Promise<MonitorReport> {
  const token = getMCPToken();
  const validTalents = talents.filter(t => t.name?.trim());
  const regionStr = region || '';

  log(send, `启动人才动态监测，共 ${validTalents.length} 位目标人才`);

  // ═══════════════════════════════════════
  // STAGE 1: 并发深搜 + 查历史档案
  // ═══════════════════════════════════════
  const profiles: TalentProfile[] = [];
  const BATCH_SIZE = 3;

  for (let i = 0; i < validTalents.length; i += BATCH_SIZE) {
    const batch = validTalents.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (talent, batchIdx) => {
      const idx = i + batchIdx;
      const displayName = `${talent.name}${talent.institution ? ' · ' + talent.institution : ''}`;

      agentWorking(send, `深搜 ${talent.name}`, 'search');
      log(send, `[${idx + 1}/${validTalents.length}] 正在深搜: ${displayName}`);

      let deepSearchData: Record<string, any> = {};
      let aiReport = '';
      let dataSources: string[] = [];
      let journalEntry: any = null;

      // 1a: 查历史档案
      try {
        journalEntry = await talentJournal.findByName(talent.name, talent.institution, token || undefined);
        if (journalEntry) {
          log(send, `  ${talent.name}: 找到历史档案（上次搜索: ${journalEntry.last_searched_at || '未知'}）`);
        }
      } catch {}

      // 1b: 执行 Deep Search
      try {
        const deepSearchResult = await runTalentDeepSearchStream(
          talent.name, talent.institution || '', undefined, undefined, token || undefined,
        );

        const reader = deepSearchResult.getReader();
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
              if (evt.type === 'structured_data') deepSearchData = { ...deepSearchData, ...evt.data };
              if (evt.type === 'ai_report') aiReport = evt.data || '';
              if (evt.type === 'data_sources') dataSources = evt.data || [];
              if (evt.type === 'complete') {
                if (evt.structured_data) deepSearchData = evt.structured_data;
                if (evt.ai_report) aiReport = evt.ai_report;
                if (evt.data_sources) dataSources = evt.data_sources;
              }
            } catch {}
          }
        }

        log(send, `  ${talent.name}: 深搜完成（数据源: ${dataSources.join(', ') || 'N/A'}）`);
      } catch (e: any) {
        log(send, `  ${talent.name}: 深搜失败 (${e.message?.substring(0, 60)})，尝试联网补充...`);

        // Fallback: Gemini / searchWeb
        try {
          const geminiKey = process.env.GEMINI_API_KEY;
          let fallbackText = '';

          if (geminiKey) {
            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} }] as any });
            const result = await model.generateContent(
              `Search Google for "${talent.name}" ${talent.institution || ''} professor researcher. Provide a detailed biography, recent publications, h-index, and research activities in Chinese.`
            );
            fallbackText = result.response.text();
          }

          if (!fallbackText || fallbackText.length < 50) {
            const webRes = await searchWeb(`${talent.name} ${talent.institution || ''} 教授 研究`);
            fallbackText = webRes?.AbstractText || '';
          }

          if (fallbackText && fallbackText.length > 50) {
            deepSearchData['internet'] = fallbackText;
            dataSources = ['internet_fallback'];
            log(send, `  ${talent.name}: 联网补充成功（${fallbackText.length} 字）`);
          }
        } catch {}
      }

      agentDone(send, `深搜 ${talent.name}`, 'search');

      return {
        name: talent.name,
        institution: talent.institution,
        deepSearchData,
        aiReport,
        dataSources,
        journalEntry,
        hasHistory: !!journalEntry,
      } as TalentProfile;
    });

    const batchResults = await Promise.allSettled(batchPromises);
    for (const result of batchResults) {
      if (result.status === 'fulfilled') profiles.push(result.value);
    }
  }

  log(send, `全部 ${profiles.length} 位人才数据采集完成`);

  // ═══════════════════════════════════════
  // STAGE 2: AI 综合分析
  // ═══════════════════════════════════════
  agentWorking(send, '风险评估专家', 'shield-alert');
  log(send, '风险评估专家正在分析活跃度、流动风险与异常信号...');

  const talentSummaries = profiles.map((p, idx) => {
    const journal = p.journalEntry;
    const sd = p.deepSearchData;
    return `
### 人才 ${idx + 1}: ${p.name}${p.institution ? ' · ' + p.institution : ''}
- **数据源**: ${p.dataSources.join(', ') || '无'}
- **有历史档案**: ${p.hasHistory ? '是' : '否'}
${p.hasHistory ? `- **历史档案摘要**: 上次搜索 ${journal?.last_searched_at || '未知'}, h-index=${journal?.h_index || 'N/A'}, 被引=${journal?.cited_by_count || 'N/A'}, 发文=${journal?.works_count || 'N/A'}, 机构=${journal?.workplace || journal?.institution || 'N/A'}` : ''}
${sd?.pingfang ? `- **平方数据**: 姓名=${sd.pingfang?.name || 'N/A'}, 机构=${sd.pingfang?.workplace_current || 'N/A'}, 研究领域=${String(sd.pingfang?.research_field || '').substring(0, 200)}` : ''}
${sd?.google_scholar ? `- **Google Scholar**: h-index=${sd.google_scholar?.h_index || 'N/A'}, 被引=${sd.google_scholar?.cited_by_count || 'N/A'}, 发文=${sd.google_scholar?.works_count || 'N/A'}` : ''}
${sd?.orcid ? `- **ORCID**: ${String(JSON.stringify(sd.orcid)).substring(0, 200)}` : ''}
${sd?.internet ? `- **互联网信息**: ${String(sd.internet).substring(0, 500)}` : ''}
${p.aiReport ? `- **AI 综合报告摘要**: ${p.aiReport.substring(0, 500)}` : ''}
`;
  }).join('\n');

  const report = await callAIForJSON(
    `你是一名资深的人才风险评估专家，专门分析高端人才的活跃度、流动风险和异常行为信号。
你需要基于多源数据（平方人才库、Google Scholar、ORCID、互联网搜索、历史档案对比），
对每位人才给出专业的活跃度评分和流动风险评估。严格按 JSON 格式输出。`,
    `请对以下 ${profiles.length} 位人才进行综合动态监测分析。
${regionStr ? `关注区域: ${regionStr}` : ''}

${talentSummaries}

## 输出格式（严格 JSON）
{
  "reportTitle": "核心人才动态监测报告",
  "reportDate": "${new Date().toLocaleDateString('zh-CN')}",
  "region": "${regionStr || '未指定'}",
  "totalMonitored": ${profiles.length},

  "overallAssessment": "整体人才态势总结（150-200字，分析团队稳定性和整体风险水平）",

  "talentCards": [
    {
      "name": "姓名",
      "institution": "机构",
      "activityScore": 78,
      "activityLevel": "高活跃/正常/低活跃/沉寂",
      "activityDetails": "活跃度分析（80字，基于发文频率、会议参与、项目动态等）",
      "mobilityRisk": "高/中/低",
      "mobilitySignals": ["具体信号1", "信号2"],
      "mobilityAnalysis": "流动风险分析（80字）",
      "anomalies": ["异常信号描述1"],
      "keyFindings": "关键发现（100字，该人才最值得关注的动态）",
      "recommendation": "建议措施（50字）"
    }
  ],

  "riskAlerts": [
    {
      "level": "高/中/低",
      "talentName": "涉及人才",
      "title": "预警标题",
      "description": "预警详情",
      "suggestedAction": "建议行动"
    }
  ],

  "trendInsights": [
    "基于本次监测发现的趋势洞察1",
    "趋势洞察2"
  ]
}

## 分析指南
1. **活跃度评分** (0-100): 基于论文产出、h-index 增长、项目活跃度、公开活动
2. **流动风险判断**:
   - 高风险信号: 机构变更、新注册关联公司、频繁参加产业（非学术）论坛、合作网络突变
   - 中风险信号: 研究方向偏移、发文频率异常变化、跨城市活动增多
   - 低风险信号: 稳定在原机构、研究方向一致、合作网络稳定
3. **异常检测**: 对比历史档案（如果有），识别不符合"正常基线"的行为变化
4. 没有数据支撑的判断，请明确标注"数据不足，需进一步监测"，不要凭空臆测`,
    { temperature: 0.5, maxTokens: 8000 }
  );

  agentDone(send, '风险评估专家', 'shield-alert');
  log(send, '人才动态监测报告生成完成！');

  return report as MonitorReport;
}
