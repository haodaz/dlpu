import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';

export const assetExpert: EvaluationExpert = {
  id: 'expert_asset',
  name: '资产与资源调度专家',
  icon: '🏭',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('🏭 资产与资源调度专家 开始工作：正在拉取 T10 设备台账与平台使用记录...');
    
    const t10Data = context.panoramicData['T10']; // 资产与资源

    if (!t10Data) {
      onLog('⚠️ 资产与资源调度专家 发现 T10 数据缺失，退回安全模式评估。');
      return {
        status: "T10(资源与资产)数据缺失",
        indicator: "3.1.1 资源对教学的有效支撑",
        criteria: "考评实验设备、实训场地及AI基础设施的使用率与课程支撑度",
        grade: "不合格",
        analysis: "依赖链断裂：无法获取设备台账及使用记录，无法验证硬件资产与AI基础设施是否真正服务于核心课程，触发紧急改进。",
        suggestions: "1. 尽快对接资产管理系统与教务排课系统。\n2. 补录近两年的大型实验设备流转及使用记录。\n3. 清查校级AI教学平台（知识图谱、智能学伴等）的核心课程接入率。"
      };
    }

    onLog('🏭 资产与资源调度专家 正在深度刺透设备闲置率及校级AI基础设施渗透率...');

    const prompt = `你是一位极其精明的【资产与资源调度专家】，负责依据《使命型17项指标体系》对【3.1.1 资源对教学的有效支撑】进行深度打分。

目标：查处“买而不用”的设备吃灰现象，验证硬件资产、虚拟仿真平台以及AI教学基础设施（智能助手/知识图谱）是否真实支撑了核心课程的实践教学。

以下是 T10 (资产与资源) 的摘要数据：
${JSON.stringify(t10Data).substring(0, 1500)}

分析指令：
1. 提取硬件使用事实：计算实验设备完好率与开出率，排查是否有高昂设备在核心课程中根本未被调用？
2. 提取AI基础设施事实：校级统一资源中心、课程知识图谱、智能学伴等的建设情况如何？其在核心课程中的接入率（渗透率）是否达标？
3. 评价其有效性与评级：
   - 【优秀】：实验开出率极高，大型设备高频流转于核心课程与项目中；AI基础设施（知识图谱/智能助教）全面覆盖核心课程，形成智能化教学生态。
   - 【良好】：硬件设备利用率达标，能满足日常实验实训需求；AI基础设施已建成并在部分课程中常态化使用。
   - 【合格】：拥有基本的实验场地，但部分高价值设备利用率低下；AI基建仅处于起步阶段。
   - 【不合格】：严重“重买轻用”，设备大量闲置；或者完全缺乏AI时代的数字基础设施支撑。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细盘点硬件流转记录与AI基建接入率，不少于200字)",
  "indicator": "3.1.1 资源对教学的有效支撑",
  "criteria": "评级标准 (简述硬件利用率与AI渗透率考核)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析设备吃灰现象或AI生态建设成效，论述必须翔实，不少于300字)",
  "suggestions": "建议 (给出盘活不良资产、提升软硬件课程接入率的强力举措，不少于200字)"
}`;

    onLog('🧠 资产与资源调度专家 正在交由大模型进行资产流转长文本推演...');
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
      onLog(`✅ 资产与资源调度专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status.substring(0, 15)}...`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '3.1.1 资源有效支撑',
        criteria: parsed.criteria || '硬件流转与AI渗透率',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
