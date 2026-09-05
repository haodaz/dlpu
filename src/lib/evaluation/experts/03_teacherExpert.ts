import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';
import { searchWeb } from '@/lib/search';

export const teacherExpert: EvaluationExpert = {
  id: 'expert_teacher',
  name: '师资与投入剖析专家',
  icon: '👩‍🏫',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('👩‍🏫 师资与投入剖析专家 开始工作：正在拉取 T15 师资力量数据...');
    
    const t15Data = context.panoramicData['T15'];

    if (!t15Data) {
      onLog('⚠️ 师资与投入剖析专家 发现 T15 缺失，无法完成师资剖析。');
      return {
        status: "T15(师资力量)数据缺失",
        indicator: "2.1.1 横向转化 / 2.2.1 教学投入",
        criteria: "考察三维教学投入与横向科研转化",
        grade: "不合格",
        analysis: "依赖链断裂：无法验证教师在横向课题及传道授业解惑三维度的投入，触发紧急改进。",
        suggestions: "请教务处及相关院系立刻补充导入近三学期的教师授课日志、平台答疑记录及参与横向课题的清单，确保基础数据池充实。"
      };
    }

    onLog('👩‍🏫 师资与投入剖析专家 正在查验传道、授业、解惑三维数据，以及横向课题向教学转化的案例...');

    const prompt = `你是一位犀利的【师资与投入剖析专家】，负责依据《使命型17项指标体系》中的【2.1.1 横向科研转化】和【2.2.1 教学投入深度】进行打分。

目标：刺破虚假的“出勤率”和“头衔”，真正考核教师是否解决了产业问题，并在教学中做到了“传道授业解惑”。

以下是 T15 (师资力量及投入) 的摘要数据：
${JSON.stringify(t15Data).substring(0, 1000)}

分析指令：
1. 提取横向科研转化事实：教师是否有横向课题经历，并真实转化为教学案例？（评 2.1.1）
2. 提取教学投入深度事实：是否在“传道(职业指引)”、“授业(课程依赖逻辑)”、“解惑(答疑与修订)”三维都有扎实数据？（评 2.2.1）
3. 评价其有效性与评级：
   - 【优秀】：横向课题大规模转化为核心教学案例。三维投入数据极其详实，问答不仅回复快，且高频纳入了下一版大纲修订。
   - 【良好】：有横向课题转化，三维投入基本达标，无明显短板。
   - 【合格】：满足基本教学投入，但缺乏横向课题反哺，或问答环节流于形式（无实质修订）。
   - 【不合格】：严重缺乏“传道”或“解惑”数据（如长时间不答疑，无职业指引），且全无横向课题产业连接，触发报警。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细阐述数据中反映的三维投入与横向情况，不少于200字)",
  "indicator": "2.1.1 / 2.2.1",
  "criteria": "评级标准 (简述三维考评与科研转化的要求)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析优劣势及给出定级理由，论述翔实，不少于300字)",
  "suggestions": "建议 (给出提升答疑活跃度及横向课题转化的落地措施，不少于200字)"
}`;

    onLog('🧠 师资与投入剖析专家 正在交由大模型进行三维投入深度推理...');
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
      onLog(`✅ 师资与投入剖析专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status}`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '2.1.1 / 2.2.1 师资投入',
        criteria: parsed.criteria || '考评三维投入与科研转化',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
