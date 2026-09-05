import { ExpertResult } from './types';
import OpenAI from 'openai';

export interface ChartData {
  tags: string[];
  tier: {
    totalTiers: number;
    currentTier: number;
    label: string;
  };
}

export type ChartExpertResponse = Record<string, ChartData>;

export async function chartEvaluate(
  expertResults: Record<string, ExpertResult>,
  onLog: (msg: string) => void
): Promise<ChartExpertResponse> {
  onLog('📊 图表绘制师 开始工作：正在审阅 9 位专家的报告，准备抽取量化梯队图表数据...');
  
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
  const baseURL = process.env.DEEPSEEK_API_KEY 
    ? 'https://api.deepseek.com/v1' 
    : (process.env.DASHSCOPE_API_KEY ? 'https://dashscope.aliyuncs.com/compatible-mode/v1' : 'https://api.openai.com/v1');

  if (!apiKey) {
    onLog('⚠️ 未找到图表绘制师的 API Key，跳过图表生成');
    return {};
  }

  const prompt = `
作为方略一答的高级图表绘制师与数据结构化专家，你的任务是阅读以下 9 位专业领域AI专家的诊断报告，并为每个模块提炼出用于可视化的【高阶数据标签】和【全国排位档次】。

输入数据 (9大底层专家报告):
${JSON.stringify(expertResults, null, 2)}

任务：
为每个专家ID（如 expert_industry, expert_alignment 等），输出以下 JSON 结构：
{
  "tags": ["高浓缩词1", "高浓缩词2", "高浓缩词3"], // 提取该模块最核心特征的3-4个短语标签，如"产教脱节"、"硬件闲置"、"高度对口"等
  "tier": {
    "totalTiers": 5, // 统一设定为 5 档（代表从底层到顶层的不同能级）
    "currentTier": X, // 根据专家评级和分析，研判该校在该维度处于第几档 (1-5)。例如“不合格”通常是1或2档，“优秀”通常是4或5档。
    "label": "维度名称对比" // 例如 "全国双一流竞争力档位"、"产教融合深度档位"、"设备流转效率档位"等，贴合原专家的主题。
  }
}

要求：
1. 必须包含所有传入的专家ID作为 key。
2. 以严格的 JSON 格式输出，不要有任何多余文字。
`;

  try {
    const client = new OpenAI({ apiKey, baseURL });
    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.2
    });

    const reportContent = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(reportContent.replace(/```json/g, '').replace(/```/g, '').trim());
    
    onLog('✅ 图表绘制师 完成数据图表化结构生成！');
    return parsed;
  } catch (e: any) {
    onLog(`❌ 图表绘制师 运行崩溃: ${e.message}`);
    return {};
  }
}
