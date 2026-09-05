import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';
import { searchWeb } from '@/lib/search';

export const alumniExpert: EvaluationExpert = {
  id: 'expert_alumni',
  name: '校友长效影响力专家',
  icon: '🏆',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('🏆 校友长效影响力专家 开始工作：正在提取 T19 毕业3-5年校友追踪数据...');
    
    const t19Data = context.panoramicData['T19']; // 校友职业发展追踪数据

    if (!t19Data) {
      onLog('⚠️ 校友长效影响力专家 未发现 T19 数据，无法核实长效培养质量。');
      return {
        status: "T19(校友职场追踪)数据缺失",
        indicator: "4.1.2 职业发展成就",
        criteria: "评估毕业3-5年后的薪资涨幅、职场晋升与行业留存率。",
        grade: "不合格",
        analysis: "依赖链断裂：缺乏毕业3-5年校友的持续追踪数据。专业培养是否具备“长效势能”与“抗周期能力”无法被证实。触发改进警报。",
        suggestions: "1. 立即成立校友会工作小组，启动“毕业五周年职场大调研”。\n2. 联合领英、脉脉等职场数据平台，抽取本专业校友画像及薪资涨幅轨迹。"
      };
    }

    onLog('🏆 校友长效影响力专家 正在比对宏观行业薪资与校友薪资涨幅，进行外部校验...');
    
    // 动态提取校友主要去向行业进行薪资背景调查
    const mainIndustry = t19Data?.mainIndustry || '智能制造/信息技术';
    const query = `${mainIndustry} 行业 毕业3-5年 平均薪资 晋升比例 2026`;
    
    let externalData = '';
    try {
      const searchRes = await searchWeb(query);
      externalData = searchRes.AbstractText || '';
      onLog(`✅ 校友评估专家 成功拉取外部【${mainIndustry}】行业的平均薪资与晋升背景数据，提取摘要 ${externalData.length} 字`);
    } catch (e) {
      onLog(`⚠️ 校友评估专家 无法连接外网，回退至纯文本分析`);
    }

    const prompt = `你是一位目光极其长远的【校友长效影响力专家】。依据《使命型17项指标体系》对【4.1.2 职业发展成就】进行深度评估。

目标：跳出“初次就业率”的短期数据，聚焦毕业3-5年后的校友群体，考察其薪资涨幅、职位晋升比例以及在核心产业内的留存率。验证专业教育是否赋予了学生长期的职场势能。

以下是 T19 (校友追踪) 的摘要数据：
${JSON.stringify(t19Data).substring(0, 1000)}

以下是近期互联网关于该目标行业薪资和晋升现状的背景基准数据：
${externalData.substring(0, 800)}

分析指令：
1. 提取成长事实：校友毕业3-5年后的平均薪资涨幅是多少？核心管理/技术骨干的晋升比例是多少？在原对口产业的留存率如何？
2. 跨界比对基准：结合外部检索的行业平均水平，判断本专业校友的发展速度是跑赢了行业大盘，还是在拖后腿？
3. 评价其有效性与评级：
   - 【优秀】：校友薪资涨幅显著跑赢行业大盘，晋升比例高，且大量留存在核心产业链中，甚至涌现出行业领军人物/创业先锋。
   - 【良好】：薪资涨幅与晋升比例持平或略高于行业平均，发展轨迹稳健健康。
   - 【合格】：有一定的加薪和晋升记录，但较多校友出现跨行流失，职业天花板初步显现。
   - 【不合格】：毕业3-5年后薪资增长停滞，大量校友被迫转行或失业，毫无长效抗风险能力，触发改进警报。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细描述 T19 中呈现的薪资涨幅、晋升数据及行业留存率，不少于200字)",
  "indicator": "4.1.2 职业发展成就",
  "criteria": "评级标准 (简述长期抗风险能力与跑赢大盘的要求)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (对比行业大盘数据，深度剖析专业教育的长效势能，论述必须翔实，不少于300字)",
  "suggestions": "建议 (给出针对校友终身学习支持体系或底层通识能力培养的建设方案，不少于200字)"
}`;

    onLog('🧠 校友长效影响力专家 正在交由大模型进行长效数据推演...');
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.DEEPSEEK_API_KEY 
      ? 'https://api.deepseek.com/v1' 
      : (process.env.DASHSCOPE_API_KEY ? 'https://dashscope.aliyuncs.com/compatible-mode/v1' : 'https://api.openai.com/v1');

    if (!apiKey) {
      throw new Error("未配置 API_KEY，智能体拒绝工作");
    }

    const client = new OpenAI({ apiKey, baseURL });
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    });

    const reportContent = response.choices[0]?.message?.content || '{}';
    try {
      const parsed = JSON.parse(reportContent);
      onLog(`✅ 校友长效影响力专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status.substring(0, 15)}...`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '4.1.2 职业发展成就',
        criteria: parsed.criteria || '考评3-5年长期职场势能',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
