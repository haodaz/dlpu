'use client';
import React from 'react';
import { Typography, Card, Tag, Descriptions, Badge } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function LogicDocPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-6">
      <Title level={2}>🧠 智能评价引擎 (Multi-Agent) 设计文档</Title>
      <Paragraph className="text-slate-500 mb-8">
        本页面用于动态记录和校验 9 大微专家的核心定位、关注的 T 模板以及独立的评分标准（映射自《使命型17项说明》）。
      </Paragraph>

      <div className="space-y-6">
        <Card title={<span>📖 专家 1：产业白皮书审核专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">1.1.1 产业深度解析</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T03 (行业白皮书)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              提取行业名称拼接 `2026年 产业生命周期 国家政策 产业链图谱` 调用全网搜索，拉取最新宏观政策与产业现状。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：审核“方向”的源头。**<br/>
              1. 检查 T03 是否输出了三大件：①产业生命周期判定 ②产业链图谱/节点清单 ③关键岗位能力清单。<br/>
              2. 交叉验证 T03 判定是否与全网搜到的国家战略重合。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：三大件齐全，判定精准踩中国家战略红利区，展现极强的前瞻性。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：三大件基本齐全，判定合理但缺乏深度前瞻。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：有白皮书意识，但生命周期或岗位清单过于笼统。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：严重脱节、内容过期或缺失关键要素，触发【紧急改进】，因为下游全部将失去方向。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>🎯 专家 2：矩阵与大纲对齐专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">1.1.2 课程-产业链对应性 / 1.1.3 课程目标与岗位能力匹配度</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T04 (能力矩阵)</Tag>
              <Tag color="blue">T11 (课程大纲)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              无外部检索。纯基于内部逻辑的“闭环/依赖链”深度推理校验。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：严查“挂名课程”与“空壳节点”。**<br/>
              1. 检查能力矩阵（T04），看是否存在“产业需要的能力但没有课支撑”，或“开的课对应不到任何产业链节点”。<br/>
              2. 检查大纲（T11），判定课程目标是否精准挂载了岗位能力编号（而非教师凭经验编造）。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：完全无缝映射，所有产业需求节点均有主次课程支撑，所有核心课均明确溯源到产业需求。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：偶有个别边缘课程缺乏明确映射，但主干课程和核心产业需求全部闭环。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：基本完成映射，但存在少数空壳节点或挂名课程。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：大量课程无产业目标支撑，或核心产业需求完全无课程覆盖，触发紧急改进。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>👩‍🏫 专家 3：师资投入剖析专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">2.1.1 横向科研转化 / 2.2.1 教学投入深度</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T15 (师资力量)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              查验横向课题向教学转化的案例，评估“传道、授业、解惑”三维数据。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：刺破虚假的“出勤率”，考核实质性的产业问题解决与教学反哺。**<br/>
              1. 提取横向科研转化事实：教师是否有横向课题经历，并真实转化为教学案例。<br/>
              2. 提取教学投入深度事实：是否在“传道(职业指引)”、“授业(逻辑矩阵)”、“解惑(答疑与修订)”均有扎实数据。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：横向课题大规模转化为核心教学案例。三维投入数据极其详实，问答高频纳入下一版大纲修订。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：有横向课题转化，三维投入基本达标，无明显短板。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：满足基本教学投入，但缺乏横向课题反哺，或问答环节流于形式。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：严重缺乏“传道”或“解惑”数据，且全无横向课题产业连接，触发报警。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>📊 专家 4：过程与行为监测专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">2.3.1 学习行为数据 / 2.3.2 考核评价与达成度闭环</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T06 (学情行为)</Tag>
              <Tag color="blue">T09 (平台日志)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              纯客观数据分析，不听主观汇报。深度比对平台访问频次及大纲 diff。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：穿透总结报告，验证平台是否真在用，闭环是否真发生。**<br/>
              1. 提取学习行为事实：出勤率、作业提交率、平台资源访问频次等纯客观行为指标。<br/>
              2. 提取考核闭环事实：检查目标-考核映射率，通过分析“下一轮大纲版本 diff”验证是否真有改进发生（“说要改的”是否“真的改了”）。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：行为数据高度活跃；达成度报告无缝衔接至下版大纲修订，改进闭环率100%，过程评价反馈极速。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：行为数据正常，有明确的过程性考核记录及达成度报告，闭环率尚可。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：平台数据能反映基本运转，达成度报告存在，但缺乏大纲实质性 diff 改进（仅停留于表面报告）。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：平台几乎空转，学生活跃度极低；考核方式单一，毫无达成度改进与迭代闭环。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>🏭 专家 5：资产与资源调度专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">3.1.1 资源对教学的有效支撑</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T10 (资产与资源)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              纯内部逻辑推理。穿透设备台账与使用记录，清查吃灰资产。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：查处“重买轻用”，查验硬件与AI基础设施的课程渗透率。**<br/>
              1. 提取硬件使用事实：计算实验设备完好率与开出率，排查闲置的大型设备。<br/>
              2. 提取AI基建事实：评估校级知识图谱、智能学伴在核心课程中的接入率。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：实验开出率极高，大型设备高频流转于核心课程；AI基础设施全面覆盖核心课程，形成智能化教学生态。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：硬件利用率达标，能满足日常实训需求；AI基础设施已建成并在部分课程中常态化使用。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：拥有基本的实验场地，但部分高价值设备利用率低下；AI基建仅处于起步阶段。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：设备大量闲置；或者完全缺乏 AI 时代的数字基础设施支撑。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>🚀 专家 6：真题真做与项目驱动专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">1.2.2 综合验证课 / 1.2.3 毕业设计 / 3.1.2 真实项目驱动率</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T12 (项目课程)</Tag>
              <Tag color="blue">T13 (毕设选题)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              外呼搜索引擎。动态提取填报的合作企业名称，爬取企业工商注册信息与营业状态，打击皮包公司。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：刺破虚假的“校企合作”，核实毕设与项目是否源于产业真实需求。**<br/>
              1. 提取真题真做事实：是否有清晰的验证课程梯度？毕设选题是否有明确的横向编号、企业导师记录及签章？<br/>
              2. 验证企业资质：结合检索判定合作企业是否具备对应的产业指导能力。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：真题真做比例达80%以上，企业导师深度介入与验收，合作企业在产业内资质深厚；综合验证课具备明显的梯队递进。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：半数以上毕设源于真实课题，有基本的企业验收流程；综合验证课设置合理。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：有企业参与，但多流于形式（如仅有签章缺乏指导记录），缺乏梯队性的综合课。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：纯理论闭门造车，查验发现合作企业已被吊销或完全无资质，触发报警。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>🤝 专家 7：产教融合评估专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">3.1.2 产业融合支撑度 (黄海实验室等)</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T14 (产教融合)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              外呼搜索引擎。评估校企合作平台（如黄海实验室）在产业界中的真实能级与影响力。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：严打“挂牌不干活”，查验资金投入与人员流转的实质履约台账。**<br/>
              1. 提取履约事实：协议中是否有明确的资金投入、场地共建、双向挂职或企业讲师授课的量化记录。<br/>
              2. 验证平台能级：判定该产教融合平台在产业界中是否具备高水平的攻关能力与社会影响力。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：合作平台具有极高的产业地位。履约数据极其详实（明确的资金到账、持续的企业讲师驻校），产教共生深度极高。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：有实质性的资金或设备共建投入，双向挂职通道顺畅。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：签署了正式协议，有零星的学生参观记录，但缺乏深度的共建。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：纯“挂牌”协议，仅一纸空文，无任何资金人员流转，触发报警。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>💼 专家 8：初次就业质量专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">4.1.1 行业就业率 / 4.1.3 用人单位满意度</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T18 (就业数据)</Tag>
              <Tag color="blue">T03 (产业白皮书)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              纯内部逻辑推理。跨越多个模板，强制比对 T18 数据与 T03 的规划靶点。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：拆穿笼统的“就业率（送外卖也算就业）”，计算真正的“产业对口就业率”。**<br/>
              1. 计算真实行业对口率：对比 T03 规划的岗位与 T18 实际的去向，评估有多少学生进入了核心产业链？<br/>
              2. 校验满意度真伪：分析用人单位问卷的样本量是否达标（≥30%）。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：超高比例毕业生进入了 T03 规划的核心节点；满意度问卷样本量大且评分极高。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：绝大多数学生实现了对口就业，用人单位总体反馈良好。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：整体就业率尚可，但真实对口率偏低（多数从事边缘/无关行业），满意度刚好过线。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：严重偏离产业定位，几乎无人进入目标行业；或问卷样本极低涉嫌作假，触发报警。
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title={<span>🏆 专家 9：校友长效影响力专家</span>} extra={<Tag color="green"><CheckCircleOutlined /> 已就绪</Tag>}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="评价指标">4.1.2 职业发展成就</Descriptions.Item>
            <Descriptions.Item label="关注模板">
              <Tag color="blue">T19 (校友追踪)</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="MCP / 检索指令">
              外呼搜索引擎。提取对口产业，抓取行业平均薪资大盘及晋升比例，用作基准对标。
            </Descriptions.Item>
            <Descriptions.Item label="评分逻辑与定级标准">
              **核心：跳出初次就业的短期视野，评估毕业3-5年后的长期职场抗风险能力。**<br/>
              1. 提取成长事实：考察校友的薪资涨幅、晋升比例及原产业留存率。<br/>
              2. 跨界比对基准：结合外呼检索的行业大盘，判断校友是领跑还是拖后腿。<br/>
              **【评级标准】**：<br/>
              - <span className="text-green-600 font-bold">【优秀】</span>：薪资涨幅显著跑赢大盘，晋升比例高，涌现行业领军人物。<br/>
              - <span className="text-blue-600 font-bold">【良好】</span>：薪资涨幅与晋升比例持平行业平均，发展轨迹稳健健康。<br/>
              - <span className="text-orange-500 font-bold">【合格】</span>：有加薪记录，但出现跨行流失，职业天花板显现。<br/>
              - <span className="text-red-500 font-bold">【不合格】</span>：毕业3-5年后薪资增长停滞，大量被迫转行失业，毫无长效抗风险能力，触发报警。
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </div>
  );
}
