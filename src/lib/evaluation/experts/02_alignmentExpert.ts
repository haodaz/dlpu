import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';

export const alignmentExpert: EvaluationExpert = {
  id: 'expert_alignment',
  name: '矩阵与大纲对齐专家',
  icon: '🎯',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('🎯 矩阵与大纲对齐专家 开始工作：正在拉取 T04 和 T11 数据...');
    
    const t04Data = context.panoramicData['T04']; // 能力矩阵
    const t11Data = context.panoramicData['T11']; // 课程大纲

    if (!t04Data || !t11Data) {
      onLog('⚠️ 矩阵与大纲对齐专家 发现 T04 或 T11 缺失，无法完成对齐校验。');
      return {
        status: "T04或T11数据缺失",
        indicator: "1.1.2 课程-产业链对应性 / 1.1.3",
        criteria: "课程目标必须精准映射岗位能力，形成完整矩阵",
        grade: "不合格",
        analysis: "依赖链断裂：无法验证课程目标与岗位能力的映射关系，请检查培养方案是否填写完整。",
        suggestions: "补充 T04 和 T11 数据，并确保每个课程都挂载明确的产业链节点。"
      };
    }

    // 纯内部逻辑链校验，无需外网查询
    onLog('🎯 矩阵与大纲对齐专家 正在进行内部逻辑闭环推理，排查【挂名课程】与【空壳节点】...');

    const prompt = `你是一位严谨的【矩阵与大纲对齐专家】，负责依据《使命型17项指标体系》中的【1.1.2 课程-产业链对应性】和【1.1.3 课程目标与岗位能力匹配度】打分。

目标：作为“执行严谨度”检查官，审查大纲是否真实挂载了产业需求，是否存在虚假映射。

以下是 T04 (能力矩阵) 的摘要数据：
${JSON.stringify(t04Data).substring(0, 800)}

以下是 T11 (课程大纲) 的摘要数据：
${JSON.stringify(t11Data).substring(0, 1000)}

分析指令：
1. 对比 T04 和 T11 的映射关系。
2. 重点排查是否存在“空壳节点”（产业需要该能力，但没有任何课程支撑）？
3. 重点排查是否存在“挂名课程”（课程目标没有精准标注或映射到任何岗位能力，属于教师凭经验编造）？
4. 评价其有效性与评级：
   - 【优秀】：完全无缝映射，所有产业需求节点均有主次课程支撑，所有核心课均明确溯源到产业需求。
   - 【良好】：偶有个别边缘课程缺乏明确映射，但主干课程和核心产业需求全部闭环。
   - 【合格】：基本完成映射，但存在少数空壳节点或挂名课程。
   - 【不合格】：大量课程无产业目标支撑，或核心产业需求完全无课程覆盖，触发紧急改进。
5. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细描述映射情况，是否存在空壳节点等，不少于200字)",
  "indicator": "1.1.2 / 1.1.3",
  "criteria": "评级标准 (简述判断标准)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析优劣势及逻辑严密性，不少于300字)",
  "suggestions": "建议 (给出针对具体未闭环课程的调整建议，不少于200字)"
}`;

    onLog('🧠 矩阵与大纲对齐专家 正在交由大模型进行深度语义比对...');
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
      onLog(`✅ 矩阵与大纲对齐专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status}`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '1.1.2 / 1.1.3 对齐检验',
        criteria: parsed.criteria || '检查矩阵映射闭环',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
