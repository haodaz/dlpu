import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';

export const studentExpert: EvaluationExpert = {
  id: 'expert_student',
  name: '过程与行为监测专家',
  icon: '📊',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('📊 过程与行为监测专家 开始工作：正在拉取 T06 和 T09 学情及平台行为日志...');
    
    const t06Data = context.panoramicData['T06']; // 学情行为
    const t09Data = context.panoramicData['T09']; // 平台日志

    if (!t06Data || !t09Data) {
      onLog('⚠️ 过程与行为监测专家 发现 T06 或 T09 数据缺失，退回安全模式评估。');
      return {
        status: "T06(学情行为)或T09(平台日志)数据缺失",
        indicator: "2.3.1 学习行为 / 2.3.2 考核闭环",
        criteria: "考评学生实际投入数据及考核改进闭环率",
        grade: "不合格",
        analysis: "依赖链断裂：缺乏学情及平台行为日志，系统平台可能处于空转状态，无法客观评估学习过程，数据失真严重。",
        suggestions: "1. 立即打通教务系统与在线课程平台的数据接口。\n2. 强制要求全校核心课程通过平台布置作业与进行过程性测试。\n3. 定期自动生成达成度报告并比对大纲版本diff。"
      };
    }

    onLog('📊 过程与行为监测专家 正在深入比对平台访问频次、作业提交率以及大纲版本 diff 以核实闭环改进率...');

    const prompt = `你是一位不听任何主观汇报，只看客观数据的【过程与行为监测专家】。负责依据《使命型17项指标体系》对【2.3.1 学习行为数据】和【2.3.2 考核评价与达成度闭环】进行严苛打分。

目标：穿透总结报告，用纯客观日志验证学生是否真正在学（2.3.1），教师的考核闭环是否真正落实到了下一轮大纲的修改中（2.3.2）。

以下是 T06 (学情行为) 摘要数据：
${JSON.stringify(t06Data).substring(0, 1000)}

以下是 T09 (平台日志) 摘要数据：
${JSON.stringify(t09Data).substring(0, 1000)}

分析指令：
1. 提取学习行为事实：评价出勤率、作业提交率、平台资源访问频次等纯客观行为指标。
2. 提取考核闭环事实：检查目标-考核映射率，查阅过程性考核的时效，通过分析“下一轮大纲版本 diff”验证是否真有改进发生（“说要改的”是否“真的改了”）。
3. 评价其有效性与评级：
   - 【优秀】：学习行为数据高度活跃，平台资源访问频次高；达成度报告无缝衔接至下版大纲修订，改进闭环率达100%，过程评价反馈极速。
   - 【良好】：行为数据正常，有明确的过程性考核记录及达成度报告，闭环率尚可。
   - 【合格】：平台数据能反映基本运转，达成度报告存在，但缺乏大纲实质性 diff 改进（仅停留于表面报告）。
   - 【不合格】：平台几乎空转，学生活跃度极低；考核方式单一（期末一张卷），毫无达成度改进与迭代闭环。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细描述平台日志活跃度与大纲版本变更记录，不少于200字)",
  "indicator": "2.3.1 / 2.3.2",
  "criteria": "评级标准 (简述行为考评与闭环要求)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析优劣势，从数据真伪及迭代效果入手，必须翔实，不少于300字)",
  "suggestions": "建议 (给出针对具体薄弱环节的数字化监督与干预措施，不少于200字)"
}`;

    onLog('🧠 过程与行为监测专家 正在交由大模型进行长文本日志剖析...');
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
      onLog(`✅ 过程与行为监测专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status.substring(0, 15)}...`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '2.3.1 / 2.3.2 行为与闭环',
        criteria: parsed.criteria || '考评学生实际投入数据及考核改进闭环率',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
