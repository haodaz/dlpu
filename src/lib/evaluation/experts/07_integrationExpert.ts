import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';
import { searchWeb } from '@/lib/search';

export const integrationExpert: EvaluationExpert = {
  id: 'expert_integration',
  name: '产教融合评估专家',
  icon: '🤝',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('🤝 产教融合评估专家 开始工作：正在抽取 T14 产教融合基地/实验室协议数据...');
    
    const t14Data = context.panoramicData['T14'];

    if (!t14Data) {
      onLog('⚠️ 产教融合评估专家 未发现 T14 数据，回退安全模式。');
      return {
        status: "T14(产教融合协议)数据缺失",
        indicator: "3.1.2 企业项目驱动率 / 产业融合支撑",
        criteria: "评估校企联合实验室、产教融合基地的实质性履约情况。",
        grade: "不合格",
        analysis: "依赖链断裂：无法找到产教融合基地的合作协议与履约记录。专业建设缺乏产业支撑平台，容易沦为纸上谈兵。触发紧急改进。",
        suggestions: "1. 立即提交与头部企业（如黄海实验室等）的联合培养协议。\n2. 补充历年企业资金投入、设备捐赠或联合培养人数的实质性履约台账。"
      };
    }

    onLog('🤝 产教融合评估专家 正在对合作机构的产业影响力进行全网调研...');
    
    const coopLab = t14Data?.labName || t14Data?.platformName || '黄海实验室/大型产教基地';
    const query = `${coopLab} 科技创新 产业地位 产学研合作成果`;
    
    let externalData = '';
    try {
      const searchRes = await searchWeb(query);
      externalData = searchRes.AbstractText || '';
      onLog(`✅ 产教融合评估专家 成功检索【${coopLab}】的产学研成果，提取摘要 ${externalData.length} 字`);
    } catch (e) {
      onLog(`⚠️ 产教融合评估专家 无法连接外网，回退至纯文本分析`);
    }

    const prompt = `你是一位严打“挂牌不干活”现象的【产教融合评估专家】。依据《使命型17项指标体系》对产教融合基地的实质履约情况进行深度打分。

目标：评估校企合作平台（如黄海实验室等）是否发生了实质性的资源交互（资金、设备、人员共建），而不是仅仅签了个战略协议挂个牌。

以下是 T14 (产教融合) 的摘要数据：
${JSON.stringify(t14Data).substring(0, 1000)}

以下是对该合作平台的产业影响力进行的互联网核验结果：
${externalData.substring(0, 800)}

分析指令：
1. 提取履约事实：协议中是否有明确的资金投入、场地共建、双向挂职或企业讲师授课的量化记录？
2. 验证平台能级：结合外部检索，判定该平台在真实产业界中是否具备高水平的攻关能力与社会影响力？
3. 评价其有效性与评级：
   - 【优秀】：合作平台具有极高的产业地位（如国家级实验室/行业龙头）。履约数据详实（如明确的资金到账、持续的企业工程师驻校授课），产教共生深度极高。
   - 【良好】：有实质性的资金或设备共建投入，双向挂职通道顺畅。
   - 【合格】：签署了正式协议，有零星的学生参观或讲座记录，但缺乏深度的资金/设备共建与课程共建。
   - 【不合格】：纯“挂牌”协议，仅有一纸空文，既无资金设备投入，也无实质性的人员交互与联合攻关。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细披露校企协议的履约细项：投入资金、设备、人员流转等，不少于200字)",
  "indicator": "3.1.2 产业融合支撑度",
  "criteria": "评级标准 (简述反挂牌考核与能级验证机制)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析是‘真金白银’还是‘一纸空文’，结合合作方能级进行长文本论述，不少于300字)",
  "suggestions": "建议 (给出促使企业深度投入、做实双轨制教学的具体举措，不少于200字)"
}`;

    onLog('🧠 产教融合评估专家 正在研判校企协议的实质性履约深度...');
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
      onLog(`✅ 产教融合评估专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status.substring(0, 15)}...`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '3.1.2 产教融合',
        criteria: parsed.criteria || '考评实质性履约与投入',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
