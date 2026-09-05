import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';
import { searchWeb } from '@/lib/search';

export const industryExpert: EvaluationExpert = {
  id: 'expert_industry',
  name: '产业白皮书审核专家',
  icon: '📖',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('📖 产业白皮书审核专家 开始工作：正在拉取 T03 产业报告...');
    
    // 1. 获取 T03 专属数据
    const t03Data = context.panoramicData['T03'];
    if (!t03Data) {
      onLog('⚠️ 产业白皮书审核专家 未发现 T03 数据，进行降级评估');
      return {
        status: "T03(产业白皮书)数据缺失",
        indicator: "1.1.1 产业深度解析",
        criteria: "产业白皮书必须包含生命周期、图谱与岗位清单三大核心内容",
        grade: "不合格",
        analysis: "极度危险：产业白皮书是使命型专业建设的源头。缺失T03数据意味着下游的课程映射、目标匹配将失去方向。触发【不评级，紧急改进】。",
        suggestions: "立即启动产业白皮书专项调研，限期 1 个月内组织专业负责人与合作企业联合编制，梳理出《专业对接产业链图谱》及对应的《核心岗位能力模型》。"
      };
    }

    // 2. 外部验证搜索 (Web Search)
    onLog('📖 产业白皮书审核专家 正在全网检索最新的产业周期与扶持政策...');
    // 动态提取搜索词，如果 T03 有明确的领域方向，则带上；否则用通用词
    const field = t03Data?.industryName || t03Data?.majorName || '轻工/装备/包装工程';
    const query = `${field} 2026年 产业生命周期 国家政策 产业链图谱`;
    
    let externalData = '';
    try {
      const searchRes = await searchWeb(query);
      externalData = searchRes.AbstractText || '';
      onLog(`✅ 产业白皮书审核专家 成功获取全网外部数据，共截取摘要 ${externalData.length} 字`);
    } catch (e) {
      onLog(`⚠️ 产业白皮书审核专家 外网搜索失败，退回纯文本审查`);
    }

    // 3. 组织独特的 AI Prompt
    const prompt = `你是一位严苛的【产业白皮书审核专家】，负责依据《使命型17项指标体系》中的【1.1.1 产业深度解析】打分。

目标：审查输入的 T03 数据（产业白皮书）是否真实、与时俱进，是否对产业进行了深度解析。
数据要求重点审查以下三部分是否齐全：
① 产业生命周期判定
② 产业链图谱/节点清单
③ 关键岗位能力清单

以下是用户填写的 T03 全景数据摘要：
${JSON.stringify(t03Data).substring(0, 800)}

以下是外部互联网检索到的 2026 年该领域的国家宏观政策与产业现状补充：
${externalData.substring(0, 1000)}

分析指令：
1. 提取现状事实：该专业是否输出了这三部分？是否有实质内容？
2. 评价其有效性与评级：
   - 【优秀】：三大件齐全，判定精准踩中国家战略红利区，展现极强的前瞻性。
   - 【良好】：三大件基本齐全，判定合理但缺乏深度前瞻。
   - 【合格】：有白皮书意识，但生命周期或岗位清单过于笼统。
   - 【不合格】：严重脱节、内容过期或缺失关键要素，触发紧急改进。
3. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细描述当前查明的事实，不少于200字)",
  "indicator": "1.1.1 产业深度解析",
  "criteria": "评级标准 (简述判断标准)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析优劣势及给出定级理由，必须翔实，不少于300字)",
  "suggestions": "建议 (给出至少3条可落地的改进举措，不少于200字)"
}`;

    // 4. 调用真实大模型进行判定
    onLog('🧠 产业白皮书审核专家 正在进行多维逻辑推理判定...');
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_API_KEY 
      ? 'https://api.deepseek.com/v1' 
      : (process.env.DASHSCOPE_API_KEY ? 'https://dashscope.aliyuncs.com/compatible-mode/v1' : 'https://api.openai.com/v1');

    if (!apiKey) {
      throw new Error("未配置 API_KEY，智能体拒绝工作");
    }

    const client = new OpenAI({ apiKey, baseURL });
    const response = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const reportContent = response.choices[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(reportContent.replace(/```json/g, '').replace(/```/g, '').trim());
      onLog(`✅ 产业白皮书审核专家 判定完毕: [${parsed.grade || '未定级'}] ${parsed.status}`);
      return {
        status: parsed.status || '审查完毕',
        indicator: parsed.indicator || '1.1.1 产业深度解析',
        criteria: parsed.criteria || '产业白皮书应包含生命周期、图谱与岗位清单',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '建议完善各项基本数据'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
