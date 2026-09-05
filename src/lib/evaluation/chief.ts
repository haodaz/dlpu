import { ExpertResult } from './types';
import OpenAI from 'openai';

export interface FinalChiefReport {
  totalScore: number;
  grade: string;
  radarData: { item: string; score: number }[];
  diagnosis: string;
  suggestions: string;
  expertResults: Record<string, ExpertResult>; // Keyed by expert ID
}

export const chiefEvaluate = async (
  expertResults: Record<string, ExpertResult>,
  onLog: (msg: string) => void
): Promise<FinalChiefReport> => {
  onLog('👑 主智能体 (Chief AI) 开始工作：正在汇总 9 位微专家的存证报告...');

  // 将所有专家的分析拼装起来供主智能体阅读
  let combinedContext = '';
  for (const [expertId, result] of Object.entries(expertResults)) {
    combinedContext += `\n--- [${expertId}] ---\n指标: ${result.indicator}\n当前评级: ${result.grade}\n现状: ${result.status}\n深度分析: ${result.analysis}\n建议: ${result.suggestions}\n`;
  }

  const prompt = `你是最高级别的【总评价 AI 司令】。
请仔细阅读以下 9 位子领域专家的详尽诊断报告，进行跨维度的“总线推理”。

9位专家诊断原文：
${combinedContext}

任务指令：
1. 给出综合评分（0-100分）。
2. 给出一个综合评级：卓越 (A+)、优秀 (A)、良好 (B)、合格 (C)、不合格 (D)。如果有任何一位专家打出“不合格”并触发了“紧急改进”报警，则总评级不得高于“合格 (C)”。
3. 综合专家意见，生成一页纸长（约800字）的“全局战略诊断书 (diagnosis)”，点破核心痛点与系统性优势。
4. 给出全局层面的战略建议 (suggestions)，不少于300字。
5. 构建一个 6 维度的雷达图数据，每个维度满分100，包含：
   - 产业对齐定位 (对应 T03)
   - 目标穿透解析 (对应 T04/T11)
   - 师资与资源投入 (对应 T10/T15)
   - 质量监控闭环 (对应 T06/T09)
   - 产教实战驱动 (对应 T12/T13/T14)
   - 社会影响与反馈 (对应 T18/T19)

严格返回 JSON 格式：
{
  "totalScore": 88,
  "grade": "良好 (B)",
  "diagnosis": "全局战略诊断 (不少于800字长篇分析...)",
  "suggestions": "全局改进建议 (不少于300字...)",
  "radarData": [
    {"item": "产业对齐定位", "score": 90},
    {"item": "目标穿透解析", "score": 85},
    {"item": "师资与资源投入", "score": 75},
    {"item": "质量监控闭环", "score": 80},
    {"item": "产教实战驱动", "score": 92},
    {"item": "社会影响与反馈", "score": 88}
  ]
}`;

  onLog('🧠 👑 主智能体 正在结合 9 大专家的结论进行总线长文本生成...');
  
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.DEEPSEEK_API_KEY 
    ? 'https://api.deepseek.com/v1' 
    : (process.env.DASHSCOPE_API_KEY ? 'https://dashscope.aliyuncs.com/compatible-mode/v1' : 'https://api.openai.com/v1');

  if (!apiKey) {
    throw new Error("未配置 API_KEY，主智能体拒绝工作");
  }

  const client = new OpenAI({ apiKey, baseURL });
  const response = await client.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 3000,
  });

  const reportContent = response.choices[0]?.message?.content || '{}';
  
  try {
    const parsed = JSON.parse(reportContent.replace(/```json/g, '').replace(/```/g, '').trim());
    onLog(`✅ 主智能体 裁决完毕: 总分 [${parsed.totalScore}] 级 [${parsed.grade}]`);
    return {
      totalScore: parsed.totalScore || 0,
      grade: parsed.grade || '未定级',
      diagnosis: parsed.diagnosis || '无诊断',
      suggestions: parsed.suggestions || '无建议',
      radarData: parsed.radarData || [],
      expertResults: expertResults // 保留原本的专家报告集合，后续前端渲染用
    };
  } catch (e) {
    throw new Error(`JSON解析失败 (Chief): ${reportContent}`);
  }
};
