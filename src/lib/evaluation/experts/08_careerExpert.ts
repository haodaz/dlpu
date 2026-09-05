import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';

export const careerExpert: EvaluationExpert = {
  id: 'expert_career',
  name: '初次就业质量专家',
  icon: '💼',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('💼 初次就业质量专家 开始工作：正在抽取 T18(就业数据) 与 T03(产业白皮书) 进行对口率锚定...');
    
    const t18Data = context.panoramicData['T18']; // 就业数据
    const t03Data = context.panoramicData['T03']; // 产业白皮书（用作靶点对齐）

    if (!t18Data) {
      onLog('⚠️ 初次就业质量专家 未发现 T18 数据，无法进行就业质量核对。');
      return {
        status: "T18(就业数据)缺失",
        indicator: "4.1.1 行业就业率 / 4.1.3 用人单位满意度",
        criteria: "评估真实对口就业率及用人单位满意度",
        grade: "不合格",
        analysis: "依赖链断裂：缺乏毕业生的去向与用人单位评价数据，无法验证专业建设的最终社会产出结果，这在结果验证维度属于严重缺失。",
        suggestions: "1. 立即对接招生就业处，导入近两届毕业生的去向落实明细。\n2. 针对签约单位发起统一的线上《毕业生综合素质满意度问卷》发放与回收。"
      };
    }

    onLog('💼 初次就业质量专家 正在计算真实“对口率”及剔除无效问卷后的“用人单位满意度”...');

    const prompt = `你是一位不看表面数字、极其看重产业结果的【初次就业质量专家】。依据《使命型17项指标体系》对【4.1.1 行业就业率】和【4.1.3 用人单位满意度】进行深度评估。

目标：拆穿笼统的“就业率（送外卖也算就业）”，转而严格对比 T03 白皮书中规划的产业靶点，计算出真正的“产业对口就业率”。同时评估用人单位的真实满意度。

以下是 T03 (产业白皮书) 规划的靶点摘要：
${JSON.stringify(t03Data || { info: "未提供明确靶点，请自行判断" }).substring(0, 500)}

以下是 T18 (就业与满意度数据) 的摘要：
${JSON.stringify(t18Data).substring(0, 1000)}

分析指令：
1. 计算真实行业对口率：对比 T03 规划的岗位与 T18 实际的去向，评估有多少学生真正进入了本专业定位的核心产业链？
2. 校验满意度真伪：分析用人单位问卷的样本量是否达标（≥30%），满意度数据是否可信？
3. 评价其有效性与评级：
   - 【优秀】：超高比例的毕业生进入了 T03 规划的核心产业链节点；用人单位满意度问卷样本量大且评分极高，专业输出人才在市场上供不应求。
   - 【良好】：绝大多数学生实现了对口就业，用人单位总体反馈良好。
   - 【合格】：整体就业率尚可，但真实对口率偏低（如多数从事边缘或无关行业），用人单位满意度刚好过线。
   - 【不合格】：严重偏离产业定位，几乎无人进入目标行业；或问卷样本量极低/作假，触发报警。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细描述真实的产业对口就业状况及满意度样本情况，不少于200字)",
  "indicator": "4.1.1 / 4.1.3",
  "criteria": "评级标准 (简述真实对口率与满意度考评机制)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析就业质量与白皮书目标的偏离度，论述必须翔实，不少于300字)",
  "suggestions": "建议 (给出提升专业核心竞争力、加强企业端供需对接的具体建议，不少于200字)"
}`;

    onLog('🧠 初次就业质量专家 正在进行跨模板交叉推理(T18 vs T03)...');
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
      onLog(`✅ 初次就业质量专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status.substring(0, 15)}...`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '4.1.1 行业就业 / 4.1.3 满意度',
        criteria: parsed.criteria || '计算真实对口率与企业满意度',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
