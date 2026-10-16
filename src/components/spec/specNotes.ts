/**
 * 产品方案模式 · 使用说明(按页面模块组织)
 * 每个 key = 页面元素上的 data-spec 值。layer:frame 框架(侧栏、顶栏)| page 本页面
 * 每份说明 = 标签 / 标题 / 一句话 / 怎么用 [小标题, 说明] / 对应会议要求 [会议要求, 本页做法] / 实现落点
 * 新模块 = 元素上加 data-spec + 这里加一份。依据:9.23 会议纪要与修改反馈总结。
 */
import { BASE_COVERAGE } from '@/lib/industry-report/base/coverage';

export type SpecLayer = 'frame' | 'page';
export const LAYER_NAME: Record<SpecLayer, string> = { frame: '框架', page: '本页面' };

export interface SpecNote {
  layer: SpecLayer;
  label: string;
  title: string;
  lead: string;
  points: [string, string][];
  from?: [string, string][];
  impl: string[];
}

export const SPEC_NOTES: Record<string, SpecNote> = {
  /* ───────── 框架 ───────── */
  sidebar: {
    layer: 'frame',
    label: '侧栏:按开会叙事排',
    title: '菜单顺序就是年度教育教学工作会议的三个环节',
    lead: '管理员侧按「看清形势 → 诊断分析 → 补数据」排:宏观决策分析给校领导是 / 否结论,管理分析给教务处和学院找问题、派整改,数据上传只要求学校把现有数据交出来。教师侧只留「我要做的事」。模板、知识库、数据流等收进「内部参考」,默认收起。',
    points: [
      ['管理员:三种页面视角', '同一个管理员角色,按会议场景分成宏观决策 / 管理分析 / 数据上传三组入口;可见范围后续由教务部门自行开关。'],
      ['教师:按需触达', '只有「我的待办 / 待填报指标 / 填报记录」三项,没有仪表盘和全量指标。'],
      ['指标不在菜单里', '17 项指标只能从诊断结论下钻进入,前台只呈现一致性和有效性两个结论。'],
    ],
    from: [
      ['按故事线组织,以开会场景为叙事主线', '菜单顺序 = 决策 → 管理 → 数据上传'],
      ['角色仍是 2 层,管理员内部拆 3 类页面视角', '管理员菜单分三组,教师单独一套'],
      ['指标后置,点开单项才给', '菜单移除「指标总览 / 指标查询」入口'],
    ],
    impl: ['src/components/AppLayout.tsx · userMenuItems / adminMenuItems'],
  },
  topbar: {
    layer: 'frame',
    label: '顶栏:视角切换',
    title: '演示时在教师和管理员之间切换',
    lead: '演示环境没有登录,用右上角的「教师 / 管理员」切换视角;切到管理员默认进入宏观决策分析。「产品方案模式」就是你现在打开的这一层,正式产品里不出现。',
    points: [
      ['切视角会跳到该视角首页', '教师 → 我的待办;管理员 → 宏观决策分析。'],
      ['方案模式按层看', '下方提示条可以在「本页面」和「框架」之间切换;点虚线框看说明,Esc 退出。'],
    ],
    impl: ['src/components/AppLayout.tsx · handleRoleChange', 'src/components/spec/SpecMode.tsx(移植自 yida-company)'],
  },

  /* ───────── 教师端 ───────── */
  'teacher-task': {
    layer: 'page',
    label: '需要您做的这一项',
    title: '没有问题不打扰老师,有问题只给这一项',
    lead: '教师首页仍然只给一件事,但不再只是一张冷冰冰的待办卡:同时回答老师心里的几个问题——为什么找我(只有任课老师能写,不是对教学的评价)、总共要做多少(17 类材料 13 类已自动准备好)、要花多久、什么时候截止、从哪开始、做完有人看吗。',
    points: [
      ['工作量条', '三层来源占比一眼看清:大部分材料 AI 和学校系统已备好,轮到老师的只有几项。'],
      ['三步进度', '看要求和范本 → 填写(可 AI 起草)→ 提交,跟着真实填报状态走,草稿、需补充、已提交各有说法。'],
      ['之后还有', '只露出还有几件、各自截止时间,不展开细节,做完这件再推。'],
      ['已完成', '记下完成日期和计入哪个核心指标,让付出被看见;全部完成时致谢,并承诺平时不打扰。'],
    ],
    from: [
      ['教师只承接无源数据:教案 / 学情分析 / 形成性评价 / 综合课程设计', '只有这 4 类会推给教师'],
      ['一次只给一个问题,整改完再给下一个', '同时只显示 1 项'],
      ['大量精力投在模板与范本', '标准与范本和问题同屏'],
    ],
    impl: ['src/app/page.tsx', 'src/lib/diagnosis.ts · TEACHER_ITEMS / ISSUES'],
  },
  'prefill-list': {
    layer: 'page',
    label: '待填报指标',
    title: '默认只列需要教师本人填的 4 类',
    lead: '17 项指标里,大多数由 AI 自动采集或学校系统导入,不需要教师填写。这里默认只列教案、学情分析、形成性评价、综合性课程设计 4 类;其余可以点右上角「查看」只读参考。',
    points: [
      ['看数据来源', '每项右侧标注来源:教师填报 / 学校系统导入 / AI 自动采集。'],
      ['进入填报', '点卡片进入填报页,页面顶部会同屏给出标准与范本。'],
    ],
    from: [['学校可导入项不出现在教师待办', '默认过滤为 4 类教师项']],
    impl: ['src/app/data-management/ai-prefill/page.tsx'],
  },
  'prefill-standard': {
    layer: 'page',
    label: '标准 + 范本同屏',
    title: '填之前先知道「做成什么样算达标」',
    lead: '教师负责的指标,在填报页最上方显示:为什么推送给你、达标标准、对应模板范本。',
    points: [
      ['为什么推给你', '橙色条是诊断发现的具体问题。'],
      ['照范本填', '点右侧范本打开模板页,照着示例填写。'],
    ],
    from: [['填报页强制同屏展示标准要求 + 模板范本', '固定在页面顶部']],
    impl: ['src/app/data-management/ai-prefill/detail/page.tsx · StandardAndTemplate'],
  },
  'whitepaper-smart': {
    layer: 'page',
    label: '白皮书:演示版 / 智能生成',
    title: '默认展示数据秒出;需要时再跑真实流水线',
    lead: '指标 1.1.1「产业深度解析」需要一份产业白皮书。「生成演示版」用展示数据,秒出;「智能生成」调用与「产业分析报告」同一条真实流水线(OpenAlex + 平方数据 + 阿里云检索与模型),约 3 分钟,结果自动记入管理员的产业检索日志。',
    points: [
      ['先填专业、产业、区域', '区域会影响政策、企业与岗位的检索范围。'],
      ['智能生成后确认提交', '报告逐章标注信号类型与来源;确认无误后「确认并提交」。'],
    ],
    impl: ['src/components/WhitepaperTool.tsx', 'src/components/industry-report/*'],
  },

  /* ───────── 宏观决策分析 ───────── */
  'decision-hook': {
    layer: 'page',
    label: '无数据:政策解读钩子',
    title: '还没导入数据时,先给两个关键判断',
    lead: '学校第一次进来没有数据,页面不展示空仪表盘,而是先给双优政策的 1-2 个关键判断和区域产业匹配预览(模糊化),其余解读需要导入专业数据后解锁。',
    points: [
      ['免费露出 2 条', '每条包含政策要点和「对学校意味着什么」。'],
      ['锁定内容', '区域产业匹配与其余政策解读在导入数据后解锁。'],
      ['文案待审定', '当前为占位口径,需李校侧提供权威解读后替换。'],
    ],
    from: [['无数据时做双优政策解读获客;全部知道需输入数据', '免费 2 条 + 锁定 3 条 + 导入入口']],
    impl: ['src/app/decision/page.tsx · HookView', 'src/lib/policy.ts'],
  },
  'decision-cta': {
    layer: 'page',
    label: '导入数据入口',
    title: '只要求学校把现有系统数据交出来',
    lead: '「去导入数据」进入数据源接入页;演示时可点「使用示例数据体验」直接切到决策态。',
    points: [['演示切换', '决策态页面底部有「切回无数据状态」,方便反复演示两种状态。']],
    from: [['中台架构,不动原系统', '导入走数据源接入,不改学校原系统']],
    impl: ['src/lib/diagnosis.ts · useDataImported'],
  },
  'decision-verdict': {
    layer: 'page',
    label: '是 / 否级结论',
    title: '校领导只看结论:可办、有风险、不可办',
    lead: '一句话给出全校专业结论,再用三张卡给出可办 / 有风险 / 不可办的数量;点卡片可筛选下方红绿灯。',
    points: [['判定依据', '一致性(是否对准产业需求)+ 有效性(培养是否真正达成)。']],
    from: [['决策视角只要是 / 否级别的结论', '首屏只有结论,不出现指标明细与雷达图']],
    impl: ['src/app/decision/page.tsx · DecisionView', 'src/lib/diagnosis.ts · MAJORS(演示数据)'],
  },
  'decision-region': {
    layer: 'page',
    label: '区域产业信号',
    title: '决策依据来自真实的产业检索',
    lead: '读取本地区最近一次「产业分析报告」:产业集群(平方数据)、技术方向阶段(OpenAlex 论文统计)、本地政策。点右上角可打开完整报告;还没有报告时可直接去生成。无数据状态下的「区域产业匹配预览」也用这份真实结果。',
    points: [['数据怎么更新', '任何人生成产业报告都会进入检索日志,这里自动取最新一份。']],
    from: [['区域产业匹配预览', '由占位改为真实检索结果,只有「本校匹配专业」保持锁定']],
    impl: ['src/app/decision/page.tsx · useRegionSignal', 'GET /api/industry-log?latest=<地区>'],
  },
  'decision-lights': {
    layer: 'page',
    label: '专业红绿灯',
    title: '全校专业一屏看完',
    lead: '每个专业一张卡:红绿灯、结论、一句话原因。点专业进入管理分析看具体问题出在哪。',
    points: [['演示数据', '学校内部数据拿不到,专业清单与结论为演示数据。']],
    impl: ['src/app/decision/page.tsx'],
  },
  'decision-layout': {
    layer: 'page',
    label: '专业布局建议',
    title: '保留 / 优化 / 缩减 / 停招',
    lead: '把专业结论翻译成布局动作,直接用于年度工作会议讨论。',
    points: [],
    impl: ['src/app/decision/page.tsx'],
  },
  'meeting-btn': {
    layer: 'page',
    label: '会议模式(大屏)',
    title: '三个会议环节连续演示',
    lead: '全屏深色、大字号,适配投影。用 ← → 在「决策 · 全校专业结论 → 管理 · 诊断分析 → 整改 · 任务落实」三个环节之间切换,Esc 退出。',
    points: [['从哪进', '决策页从第 1 环节开始,管理分析页从第 2 环节开始。']],
    from: [['落地场景:年度教育教学工作会议三环节 + 大屏', '一个按钮连续讲完三环节']],
    impl: ['src/components/diagnosis/MeetingMode.tsx'],
  },

  /* ───────── 管理分析 ───────── */
  'core-metrics': {
    layer: 'page',
    label: '一致性 / 有效性',
    title: '前台只有两个核心指标',
    lead: '一致性回答「专业定位 → 培养目标 → 产业需求 → 培养方案 → 课程设置是否指向同一个最终需要」(服务学校层面);有效性回答「方向对了之后,过程与结果有没有达成」(服务教务处、学院、教师)。',
    points: [
      ['先看结论', '分数、达成程度和一句话结论。'],
      ['再看环节', '点「查看分析」展开链条,红色环节就是断点。'],
      ['最后看指标', '点某个环节才出现它背后的支撑指标,再点进入指标详情。'],
    ],
    from: [
      ['两个核心指标:一致性 + 有效性', '17 项只作为支撑逻辑,置于其后'],
      ['分层分页面、按需下钻', '结论 → 环节 → 指标三层'],
    ],
    impl: ['src/components/diagnosis/CoreMetricCard.tsx', 'src/lib/diagnosis.ts · CORE_METRICS(口径待产品定稿)'],
  },
  'issue-queue': {
    layer: 'page',
    label: '一次只给一个问题',
    title: '整改完再看下一个',
    lead: '问题按「本年度重点环节优先,再按影响」排序,只显示队首 1 条:问题出在哪、整改建议、责任方、时限。',
    points: [
      ['已整改,看下一个', '标记后自动露出下一条;教师端提交同一问题也会同步消失。'],
      ['为什么是这个结论', '跳到对应指标详情,看分析逻辑。'],
    ],
    from: [['不打扰原则,一次只给一个问题', '任一时刻可见的待处理问题 ≤ 1 条'], ['今年着重抓一个环节,明年抓下一个', '本年度重点环节排第一']],
    impl: ['src/components/diagnosis/IssueQueue.tsx'],
  },
  'analysis-layers': {
    layer: 'page',
    label: '分析层 / 进度层',
    title: '原来的全量图表都收在这里,按需展开',
    lead: '提交结果质量、AI 评价概览、提交进度等图表默认收起,需要时再展开,避免首屏信息过载。',
    points: [],
    from: [['首页全展示让人望而却步', '默认收起,首屏只留结论层']],
    impl: ['src/app/admin/page.tsx'],
  },
  'review-scatter': {
    layer: 'page',
    label: '横向:一致性 × 有效性',
    title: '全校专业差距在哪个维度上',
    lead: '每个点是一个专业,横轴一致性(方向对不对),纵轴有效性(做没做好),以 80 分为界分成四个象限;下方给出各象限的专业与对应的抓手。',
    points: [['看象限', '「方向对、没做好」抓教学过程与结果;「做得好、方向偏」调培养方案与课程设置;两者都低的考虑缩减或停招。']],
    from: [['横向比较:全校专业差距在哪个指标上', '散点四象限 + 均值差距表']],
    impl: ['src/app/admin/review/page.tsx · Horizontal'],
  },
  'review-gap': {
    layer: 'page',
    label: '与全校均值的差距',
    title: '每个专业的短板在一致性还是有效性',
    lead: '按综合表现从低到高排列,给出相对全校均值的差距和主要原因。',
    points: [],
    impl: ['src/app/admin/review/page.tsx'],
  },
  'review-trend': {
    layer: 'page',
    label: '纵向:上一学年 → 本学年',
    title: '每个环节比去年好了多少',
    lead: '一致性、有效性及其各环节的分数对比,灰条为上一学年,彩条为本学年;红色是本学年仍未达标的环节。',
    points: [['数据', '上一学年为演示数据;正式使用时由每轮诊断归档自动生成。']],
    from: [['纵向回看:大问题是否已解决', '环节逐项对比']],
    impl: ['src/lib/diagnosis.ts · LAST_CYCLE'],
  },
  'review-issues': {
    layer: 'page',
    label: '去年的大问题',
    title: '已解决 / 好转中 / 仍存在',
    lead: '逐条回看上一学年的大问题;仍存在的问题会继续进入本学年的问题队列。点右侧指标查看分析逻辑。',
    points: [],
    impl: ['src/app/admin/review/page.tsx · Vertical'],
  },
  'rect-report': {
    layer: 'page',
    label: '整改报告',
    title: '由诊断结论生成,分管理层面 / 教师层面',
    lead: '每条整改包含问题、整改要求、标准要求、模板范本、责任人和完成时间;可按层面筛选,直接打印分发。',
    points: [
      ['跟踪状态', '每条可改为已派发 / 整改中 / 已完成。'],
      ['打印', '「打印 / 导出 PDF」只输出报告正文。'],
    ],
    from: [['整改报告分教师 / 管理层面导出打印', '两个层面分节,支持单独打印']],
    impl: ['src/app/rectification/page.tsx'],
  },
  'rect-cycle': {
    layer: 'page',
    label: '闭环:下一轮',
    title: '诊断 → 分析 → 整改 → 建设 → 评价 → 下一轮',
    lead: '本轮整改全部完成后,可发起下一轮诊断;本轮记录归档,用于纵向回看。',
    points: [],
    from: [['后半段闭环是高刚需、高频', '整改跟踪 + 轮次循环']],
    impl: ['src/lib/diagnosis.ts · useCycle'],
  },
  'major-matrix': {
    layer: 'page',
    label: '指标层',
    title: '17 项支撑指标的明细',
    lead: '从管理分析点「指标明细」进入,是三层下钻的最后一层:每项指标的完成状态与得分。',
    points: [['返回', '左上角「返回管理分析」回到结论层。']],
    impl: ['src/app/admin/major/page.tsx'],
  },
  'indicator-analysis': {
    layer: 'page',
    label: '指标分析逻辑',
    title: '为什么是这个结论',
    lead: '从一致性/有效性的环节、或问题卡片下钻到这里:得分、它支撑哪个环节、评分理由、扣分点、证据链,以及由此产生的整改问题。指标定义与填报说明属于填报侧内容,默认收起。',
    points: [['切换指标', '右上角可切换到其他指标,保持在分析视角。']],
    from: [['指标详情降级为结论的下钻,只给分析逻辑', '分析逻辑在前,填报说明折叠']],
    impl: ['src/app/admin/indicator-analysis/page.tsx', '数据:src/lib/mock-evaluation-report.ts(评分理由 / 扣分点 / 证据链)'],
  },
  'tpl-catalog': {
    layer: 'page',
    label: '模板与范本',
    title: '全站只有一份模板目录',
    lead: '教师端「模板库」与这里读同一份目录:每个模板标明关联指标、由谁填(教师 / 学校系统导入 / AI 采集),以及是否作为教师填报范本。教师范本会在教师的待办卡片和填报页里同屏给出。',
    points: [['筛选', '右上角按「由谁填」筛选。'], ['已清理', 'T16、T17 已并入 AI 自动存证,不再单独维护。']],
    from: [['合并两套模板体系为单一来源,清理 t16/t17,模板嵌入教师填报流程', '统一目录 + 教师范本嵌入填报']],
    impl: ['src/lib/templates.ts'],
  },
  'view-visibility': {
    layer: 'page',
    label: '视角可见范围',
    title: '三类页面视角由教务部门自行开关',
    lead: '宏观决策分析、管理分析、数据上传三组入口可以分别开关,关闭后从管理员菜单隐藏(至少保留一个)。',
    points: [['现状', '先做前端显隐;接入统一权限后按账号生效。']],
    from: [['三视角可见范围由教务部门自行开关', '用户与权限页的三个开关']],
    impl: ['src/app/admin/users/page.tsx · ViewVisibilityCard', 'src/components/AppLayout.tsx'],
  },
  'indicators-table': {
    layer: 'page',
    label: '指标明细与来源',
    title: '每项指标都标注数据来源',
    lead: '按维度 / 二级分类筛选指标,查看全校平均分、合格率和数据来源(AI 自动采集 / 学校系统导入 / 教师填报)。',
    points: [],
    from: [['任一材料在任一页面可辨识来源', '新增「数据来源」列']],
    impl: ['src/app/admin/indicators/page.tsx'],
  },

  /* ───────── 数据上传 ───────── */
  'ds-layers': {
    layer: 'page',
    label: '数据从哪里来',
    title: '三层来源:AI 采集 / 学校系统导入 / 教师填报',
    lead: '按 17 项指标归属统计三类来源各占多少(合计 100%)。导入完成后点「查看诊断结论」进入决策页。',
    points: [],
    from: [['AI >85% / 学校系统导入 / 教师仅填 4 类无源项', '三层分离,每项只归一类']],
    impl: ['src/app/admin/data-sources/page.tsx', 'src/lib/diagnosis.ts · sourceOf'],
  },
  'ds-table': {
    layer: 'page',
    label: '数据源接入',
    title: '接入学校现有系统',
    lead: '「接入数据源」填写名称、类型、接入端点、关联指标和同步频率,接入后立即同步一次;列表可按类型筛选、搜索,单条可手动同步。',
    points: [],
    impl: ['src/app/admin/data-sources/page.tsx'],
  },
  'ds-log': {
    layer: 'page',
    label: '导入日志',
    title: '每次同步的行数与异常',
    lead: '同步失败或部分失败会写明原因,便于数据管理员排查。',
    points: [],
    impl: ['src/app/admin/data-sources/page.tsx'],
  },

  /* ───────── 产业分析报告 ───────── */
  'ir-form': {
    layer: 'page',
    label: '生成报告',
    title: '输入产业、区域、服务专业,一键生成',
    lead: '先查代码内预查底库与历史检索沉淀:底库已覆盖的「省份 × 产业」约 1 分钟出报告,内容最扎实;未覆盖的现查(约 3-5 分钟)并回流知识库。下面按省份列出底库覆盖与数据丰富度,演示时优先选「丰富」的组合。',
    points: [
      ...coveragePoints(),
      ['评级口径', '七类数据(规模、细分方向、城市分布、上市公司研发、投融资、政策、岗位薪资)中有数据的类数 ≥ 6 且规模指标 ≥ 3 条为「丰富」,≥ 4 类为「一般」,其余「偏薄」。产业名可用别名,如输入「智能制造」「食品」「软件」也能命中。'],
      ['数据来源', '论文:OpenAlex;政策 / 产业集群 / 专业就业方向:优先平方数据;其余:阿里云联网检索;模型:阿里云通义千问。'],
      ['每次生成都会记录', '进入管理员的「产业检索日志」,并沉淀进产业知识库。'],
    ],
    impl: ['src/app/industry-report/page.tsx', 'src/lib/industry-report/pipeline.ts'],
  },
  'ir-delta': {
    layer: 'page',
    label: '本次变化',
    title: '先找日志,再搜变化差值',
    lead: '与上一次同产业同地区报告对比:新增政策、新增产业链环节、新出现企业、新增岗位、技术方向阶段变化;并显示从知识库补回的历史条目数和缓存命中情况。',
    points: [['首次检索', '建立基线,下次起只检索变化。']],
    impl: ['src/lib/industry-report/flywheel.ts', 'pipeline.ts · computeDelta'],
  },
  'ir-tech': {
    layer: 'page',
    label: '一、技术热度与成熟度',
    title: '强信号:数值全部按公式计算',
    lead: '各技术方向在 OpenAlex 的年度论文数,计算同比、CAGR、加速比,按规则判定阶段。悬停阶段可看命中规则;点检索式可在 OpenAlex 复现原始计数。',
    points: [['模型做什么', '只负责把产业拆成技术方向并写检索式,不参与任何数值。']],
    from: [['趋势分析不能是 AI 黑盒', '数值可复现,阶段规则公开']],
    impl: ['src/lib/industry-report/quant.ts'],
  },
  'ir-policy': {
    layer: 'page',
    label: '二、政策信号',
    title: '政策清单可核验,力度按层级计算',
    lead: '政策来自联网检索、平方政策库和历次检索沉淀,每条都有来源;按层级赋分(国家 5 → 区县 1),计算年度密度与加权得分。样本不足时不计算加速度,避免伪趋势。',
    points: [['历史沉淀', '带「历史沉淀」标记的是本次未检索到、但历史上带来源出现过的政策。']],
    impl: ['pipeline.ts · policyChapter', 'src/lib/industry-report/pingfang.ts'],
  },
  'ir-chain': {
    layer: 'page',
    label: '三、产业链与岗位',
    title: '区域集群、产业链环节、企业与岗位技能',
    lead: '区域产业集群来自平方数据;产业链环节与代表企业、岗位与技能从检索材料中抽取,每条带来源;技能频次按岗位计数。',
    points: [['技能样本', '只有出现 ≥ 2 次的技能才会进入综合研判。']],
    impl: ['pipeline.ts · chainChapter'],
  },
  'ir-insight': {
    layer: 'page',
    label: '四、综合研判',
    title: 'AI 只解读表格,数字由程序逐个校验',
    lead: '模型只读取前三章的表格,给出综合判断和专业建设建议,每条注明依据的表格;文中找不到出处的数字会标红,提醒专家核对。',
    points: [],
    from: [['大模型仅用于总结与综述,不参与数值计算', '解读与计算分离 + 数字校验']],
    impl: ['pipeline.ts · insightChapter', 'quant.ts · unverifiedNumbers'],
  },
  'ir-weak': {
    layer: 'page',
    label: '五、早期弱信号',
    title: '量化数据不足时的兜底,置信度低',
    lead: '只看最近 30 天的报道,列出还没有量化数据支撑的新方向,明确标注「弱信号 · 置信度低」,仅供专家参考。',
    points: [],
    from: [['数据不足时 AI 给出合理推荐(后备方案)', '与强信号分开展示']],
    impl: ['pipeline.ts · weakChapter'],
  },
  'ir-paper': {
    layer: 'page',
    label: '在线 PDF 报告',
    title: '研究报告体例,可下载 PDF / Word 直接作为上报材料',
    lead: '报告按行业研究报告的体例排成 A4 纸张:封面、核心观点与目录、六章正文、附录。每章先给成段正文,再给三线表和图(带编号与资料来源);正文上标是参考来源编号,点开即原文;标红数字为程序未能核对的数字。',
    points: [
      ['六章结构', '产业发展概况 → 政策环境(国家—部委—本省)→ 产业结构与区域布局 → 资本与创新投入 → 人才需求 → 发展研判与专业建设建议;论文热度降为补充参考。'],
      ['区域画像', '本省规模、细分方向、企业城市分布、上市公司研发投入、投融资、岗位薪资与人才缺口。先查代码内预查底库,没有再现查并回流知识库(基建 + 飞轮)。'],
      ['下载', '「下载 PDF」按 A4 分页带页码;「下载 Word」是可编辑文档,图表换成同数据的表格,方便学校修改后上报。'],
    ],
    from: [
      ['做成研究报告格式,有规范的行业研究报告文字支撑,不只是图片 + bullet', '成段正文 + 三线表 + 图表编号 + 资料来源 + 参考文献'],
      ['列出本省企业分布、产值、重点产业细分方向', '第一章规模指标与细分方向、第三章企业城市分布'],
      ['岗位技能、薪资、供需分析', '第五章岗位薪资表、技能频次、人才缺口'],
      ['论文不是重点,更重要的是产值、投融资、上市公司 R&D', '第四章投融资与上市公司研发投入,论文热度降为补充参考'],
      ['政策从国家—部委—本省梳理并解读', '第二章三级政策导向表 + 传导关系解读'],
    ],
    impl: ['src/components/industry-report/ReportView.tsx', 'src/lib/industry-report/regional.ts', 'src/lib/industry-report/base/(预查底库)', 'scripts/prefetch-industry-base.ts'],
  },
  'ir-appendix': {
    layer: 'page',
    label: '附录与专家审核',
    title: '方法、公式、阈值与全部来源',
    lead: '附录列出检索飞轮、数据来源、公式、阶段阈值和全部引用来源(平方数据单独标注)。每章标题右侧可勾选「专家已审核」,全部勾选后工具条显示「经专家审核校正」;审核结果回流知识库,后续检索优先采用。',
    points: [],
    impl: ['src/components/industry-report/ReportView.tsx'],
  },

  /* ───────── 产业检索日志 ───────── */
  'log-stats': {
    layer: 'page',
    label: '飞轮概况',
    title: '检索越多,知识库越全,检索越快',
    lead: '检索次数、使用人数、已沉淀产业、增量检索次数、缓存命中率。',
    points: [],
    impl: ['src/app/api/industry-log/route.ts'],
  },
  'log-runs': {
    layer: 'page',
    label: '检索记录',
    title: '所有用户的每一次产业检索',
    lead: '谁、在哪个入口(产业分析报告 / 教师白皮书)、检索了什么,全量还是增量,结果规模、新增条目、缓存命中与用时。点「报告」打开当次报告。',
    points: [],
    impl: ['data/industry-flywheel/runs-index.jsonl(现为本地文件,最终上云)'],
  },
  'log-kb': {
    layer: 'page',
    label: '产业知识库',
    title: '按产业沉淀的政策、产业链、企业、岗位与弱信号',
    lead: '每个条目记录出现次数、最近出现时间、来源和是否经专家审核。点产业卡片查看明细。',
    points: [
      ['怎么起作用', '下次检索同一产业时先读这里:只检索变化,并把本次未命中的历史条目补回报告。'],
      ['纠错', '发现错误条目(如地区不符、与产业无关)点右侧删除,避免被飞轮反复补回;一年内未再出现的条目自动不再补回。'],
    ],
    impl: ['src/lib/industry-report/flywheel.ts', 'src/lib/industry-report/store.ts(存储接口,上云时替换实现)'],
  },
};

// 预查底库覆盖情况(由 scripts/prefetch-industry-base.ts 生成的 coverage.ts),按省份汇总为说明条目
function coveragePoints(): [string, string][] {
  const provinces = Array.from(new Set(BASE_COVERAGE.map((c) => c.province)));
  return provinces.map((prov) => {
    const rows = BASE_COVERAGE.filter((c) => c.province === prov);
    const text = (['丰富', '一般', '偏薄'] as const)
      .map((g) => {
        const list = rows.filter((c) => c.grade === g);
        if (!list.length) return '';
        const items = list.map((c) => (g === '丰富' || !c.missing.length ? c.industry : `${c.industry}(缺${c.missing.join('、')})`));
        return `${g === '丰富' ? '★ ' : ''}${g}:${items.join('、')}`;
      })
      .filter(Boolean)
      .join(';');
    return [`${prov} · 底库 ${rows.length} 个产业`, text];
  });
}
