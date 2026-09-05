import { EvaluationExpert, EvaluationContext, ExpertResult } from '../types';
import OpenAI from 'openai';
import { searchWeb } from '@/lib/search';

export const practiceExpert: EvaluationExpert = {
  id: 'expert_practice',
  name: '真题真做与项目驱动专家',
  icon: '🚀',
  
  evaluate: async (context: EvaluationContext, onLog: (msg: string) => void): Promise<ExpertResult> => {
    onLog('🚀 真题真做与项目驱动专家 开始工作：正在拉取 T12(项目课程) 与 T13(毕设选题)...');
    
    const t12Data = context.panoramicData['T12']; // 实践/项目课程
    const t13Data = context.panoramicData['T13']; // 毕业设计

    if (!t12Data && !t13Data) {
      onLog('⚠️ 真题真做与项目驱动专家 发现 T12 与 T13 数据双双缺失，退回安全模式评估。');
      return {
        status: "T12与T13(综合验证课及毕业设计)数据缺失",
        indicator: "1.2.2 综合验证课 / 1.2.3 毕业设计 / 3.1.2 真实项目驱动率",
        criteria: "考核真题真做比例，验证是否存在假借企业名义的水课。",
        grade: "不合格",
        analysis: "依赖链断裂：没有任何项目驱动或毕业设计的数据支撑，无法证实学生是否具备跨课程解决复杂问题的实战能力。触发紧急改进。",
        suggestions: "1. 全面排查培养方案，增设跨能力的阶段性综合验证课程。\n2. 强制导入近一届毕业设计选题清单及双导师（企业导师）指导记录。"
      };
    }

    onLog('🚀 真题真做与项目驱动专家 正在穿透企业名称与合同编号，发起网络爬虫查验企业真实资质...');
    
    // 动态提取企业名称进行搜索验证
    const sampleEnterprise = t13Data?.enterpriseName || t12Data?.coopEnterprise || '大连科技创新企业';
    const query = `${sampleEnterprise} 工商注册信息 营业执照 经营状态`;
    
    let externalData = '';
    try {
      const searchRes = await searchWeb(query);
      externalData = searchRes.AbstractText || '';
      onLog(`✅ 真题真做专家 成功拦截并外呼网络检索【${sampleEnterprise}】资质，提取摘要 ${externalData.length} 字`);
    } catch (e) {
      onLog(`⚠️ 真题真做专家 无法连接外网，回退至纯文本分析`);
    }

    const prompt = `你是一位极度痛恨“水课”和“假把式”的【真题真做与项目驱动专家】。依据《使命型17项指标体系》对【1.2.2 阶段性综合验证课程】、【1.2.3 毕业设计】和【3.1.2 真实项目驱动率】进行深度打分。

目标：刺破虚假的“校企合作”，核实课程项目与毕业设计是否源自企业真实需求，是否有企业导师的实质性参与与验收电子签章。

以下是 T12 (综合验证课程) 摘要数据：
${JSON.stringify(t12Data || {}).substring(0, 800)}

以下是 T13 (毕业设计) 摘要数据：
${JSON.stringify(t13Data || {}).substring(0, 800)}

以下是针对其合作企业资质发起的互联网核验结果：
${externalData.substring(0, 800)}

分析指令：
1. 提取真题真做事实：是否有清晰的跨能力综合验证课程梯度？毕设选题是否有明确的横向课题编号、企业导师记录及签章？
2. 验证企业资质：结合互联网搜索结果，判定合作企业是否为皮包公司？是否具备对应的产业指导能力？
3. 评价其有效性与评级：
   - 【优秀】：真题真做比例达80%以上，企业导师深度介入指导与验收，合作企业在产业内资质深厚；综合验证课具备明显的梯队递进。
   - 【良好】：半数以上毕设源于真实课题，有基本的企业验收流程；综合验证课设置合理。
   - 【合格】：有企业参与，但多流于形式（如仅有签章但缺乏过程性指导记录），缺乏梯队性综合验证课。
   - 【不合格】：纯理论闭门造车，毕设全是“假定题”和“空想题”，查验发现合作企业已被吊销或完全无相关资质，触发报警。
4. 严格返回 JSON 格式结果。请务必给出【翔实的说明】，每个字段的输出总篇幅必须达到一页左右（不少于800字），要极其详细：
{
  "status": "现状 (详细描述项目中真实企业需求的占比及签章合规性，不少于200字)",
  "indicator": "1.2.2 / 1.2.3 / 3.1.2",
  "criteria": "评级标准 (简述真实项目驱动与双导师验收的要求)",
  "grade": "优秀 | 良好 | 合格 | 不合格",
  "analysis": "分析 (深度剖析是‘真做’还是‘走过场’，结合网络查验结果进行论述，不少于300字)",
  "suggestions": "建议 (给出打通校企真实课题通道、引入企业严格验收机制的改革方案，不少于200字)"
}`;

    onLog('🧠 真题真做专家 正在结合企业背景做交叉核验及长文本推演...');
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
      onLog(`✅ 真题真做专家 校验完毕: [${parsed.grade || '未定级'}] ${parsed.status.substring(0, 15)}...`);
      return {
        status: parsed.status || '校验完毕',
        indicator: parsed.indicator || '1.2.2/1.2.3/3.1.2 真题真做',
        criteria: parsed.criteria || '考评真实项目驱动率与企业验收',
        grade: parsed.grade || '不合格',
        analysis: parsed.analysis || '无',
        suggestions: parsed.suggestions || '无'
      };
    } catch (e) {
      throw new Error(`JSON解析失败: ${reportContent}`);
    }
  }
};
