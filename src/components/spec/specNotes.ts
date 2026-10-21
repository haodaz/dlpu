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
    label: '我的全部工作',
    title: '这次评价需要本人提交的资料,一次列全',
    lead: '按产品反馈,不再一次只给一件:列出本次评价任务里需要老师本人提交的全部资料(教案、学情分析、形成性评价、综合性课程设计),每项的进度与审核意见一目了然。',
    points: [
      ['看要求与范本', '展开即见达标标准、对应模板范本和 AI 能帮到哪一步;需修改的项默认展开。'],
      ['上传 / 再上传', '上传后进入「已提交 · 待审核」;收到修改意见后可「修改后重新上传」。管理员在评价任务里能同步看到上传情况。'],
      ['往期任务', '顶部切换到往期任务,只读查看当时提交的资料。'],
    ],
    from: [['在具体评价任务页列出所有目标工作,而不是做完一件再推下一件', '全部工作平铺,带进度与审核意见'], ['点击某项任务给出要求范本,上传资料、查看反馈、再上传', '每项都有要求与范本、上传、在线填写']],
    impl: ['src/app/teacher/task/page.tsx', 'src/lib/teacher-work.ts(状态取填报状态机)'],
  },
  'teacher-latest': {
    layer: 'page',
    label: '最新评价任务',
    title: '教师首页:最新任务与我的完成进度',
    lead: '首页展示最新一次评价任务、截止时间和本人 4 项资料各自的状态;有审核意见需要修改时直接提示。',
    points: [],
    from: [['教师应有一个首页,展示最新评价任务、负责的专业、工作完成进度以及历史评价任务列表', '首页四块内容']],
    impl: ['src/app/page.tsx'],
  },
  'teacher-majors': {
    layer: 'page',
    label: '我负责的专业',
    title: '本人负责专业的最近一次评价结果',
    lead: '显示专业的结论(重点发展 / 优化整改 / 风险关注)与综合、一致性、有效性得分,可进入查看完整的评价结果与诊断。',
    points: [],
    from: [['教师也可以查看所负责专业的评价结果和诊断分析', '「专业评价结果」页,与管理员看到的同一份']],
    impl: ['src/app/page.tsx', 'src/app/teacher/result/page.tsx'],
  },
  'teacher-history': {
    layer: 'page',
    label: '历史评价任务',
    title: '往期任务:当时提交的资料与评价结果',
    lead: '每次评价任务一行,可查看当时本人提交的资料,或该次评价的专业结果。',
    points: [],
    impl: ['src/app/page.tsx'],
  },
  'teacher-progress': {
    layer: 'page',
    label: '我的完成进度',
    title: '已完成 / 待审核 / 需修改 / 填写中一条看清',
    lead: '进度条每一段对应一份资料,颜色即状态;右侧给出自评截止日和需要修改的份数。',
    points: [],
    impl: ['src/app/teacher/task/page.tsx'],
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
    label: '大屏结论区',
    title: '一屏看清:多少专业重点发展、优化整改、风险关注',
    lead: '数据大屏风格:校徽与本次评价任务、参评专业数、三档专业数量(点击切换下方红绿灯)、综合 / 一致性 / 有效性均分、区域重点产业数量,右侧为三档占比环形图。',
    points: [['判定依据', '一致性(方向对不对)+ 有效性(做没做好)的综合得分:≥ 80 重点发展,70–80 优化整改,< 70 风险关注。']],
    from: [['首页稍微做一些 UI 设计(参考数据大屏的感觉),加点图片、logo 之类装饰', '深色大屏结论区 + 校徽 + 环形图 + 网格光效'], ['红灯专业不要直接说「不可办」', '三档文案:重点发展 / 优化整改 / 风险关注']],
    impl: ['src/app/decision/page.tsx · DecisionView', 'src/lib/eval-tasks.ts · taskResults'],
  },
  'decision-switch': {
    layer: 'page',
    label: '诊断前 / 诊断结论',
    title: '两个页面随时切换',
    lead: '「诊断前 · 政策解读」是学校还没导入数据时看到的获客页;「诊断结论」是导入数据后的决策页。演示时用这里来回切换。',
    points: [],
    from: [['之前有一个诊断之前的页面,找不到了', '页首切换,两种状态都能直接进入']],
    impl: ['src/app/decision/page.tsx'],
  },
  'decision-region': {
    layer: 'page',
    label: '区域重点产业',
    title: '客观展示本地区重点发展的产业,不随本校专业变化',
    lead: '列出省、市两级政府重点发展的产业:定位(国家级集群 / 省重点产业 / 市主导产业 / 未来产业等)、规模和一句话说明,每条可点角标看原文;下方附平方产业集群库收录的集群。点「产业分析报告」可对该产业生成完整报告。',
    points: [['数据怎么来', '代码内预查底库(scripts/prefetch-region-industries.ts)命中直接显示;其他地区现查后回流知识库。规模数字须在原文中逐字出现。']],
    from: [['区域产业信号应客观展示学校所在区域的重点产业(来自政策分析等),不取决于学校专业对应的产业', '改为省市规划与政府工作报告中的重点产业 + 平方集群库']],
    impl: ['src/lib/industry-report/region-industries.ts', 'GET /api/region-industries', 'src/lib/industry-report/region-base/(预查底库)'],
  },
  'decision-lights': {
    layer: 'page',
    label: '专业红绿灯',
    title: '按三档 tab 切换,专业多时也好找',
    lead: '重点发展 / 优化整改 / 风险关注三个 tab,每个专业显示综合得分、一致性与有效性;点任一专业进入该专业的诊断详情。',
    points: [['演示数据', '学校内部数据为演示数据。']],
    from: [['专业红绿灯分为绿、黄、红三个 tab 切换', '三档 tab,所有专业都可点进诊断']],
    impl: ['src/app/decision/page.tsx'],
  },
  'decision-advisor': {
    layer: 'page',
    label: '专业建设专家 AI',
    title: '用对话代替生硬的「保留 / 缩减 / 停招」',
    lead: '原「专业布局建议」与红绿灯重复,且缩减、停招表述有风险,改为和专业建设专家 AI 聊一聊:AI 结合区域重点产业、已检索的产业画像和各专业评价结果回答布局问题;涉及招生调整的只给论证方向,不替学校下结论。',
    points: [['常用问题', '点推荐问题直接提问,也可以自由输入,支持多轮追问。'], ['数据边界', 'AI 只依据平台数据作答,没有的数据会直说「未覆盖」。']],
    from: [['专业布局建议删除,或改成点击后和专业建设专家 AI 聊一聊', '对话入口 + 推荐问题']],
    impl: ['src/components/advisor/AdvisorChat.tsx', 'POST /api/advisor'],
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
    title: '两个核心指标,分析结果默认展开',
    lead: '一致性回答「专业定位 → 培养目标 → 产业需求 → 培养方案 → 课程设置是否指向同一个最终需要」;有效性回答「方向对了之后,过程与结果有没有达成」。按产品反馈,分析结果默认展开:每个环节的得分、未达标原因和支撑指标一屏看全。',
    points: [
      ['看环节', '红色条是未达标(< 85)的环节,下方直接写原因。'],
      ['看支撑指标', '每个环节下列出支撑指标及得分,点击进入「为什么是这个结论」。'],
    ],
    from: [['两个核心指标:一致性 + 有效性', '17 项只作为支撑逻辑'], ['点击步骤太多,默认展开分析结果,支撑指标可点击查看', '默认展开,不再需要逐层点开']],
    impl: ['src/components/eval/MajorDiagnosis.tsx · CoreBlock', 'src/lib/eval-tasks.ts · coreLinks'],
  },
  'indicator-table': {
    layer: 'page',
    label: '指标得分与缺失点',
    title: '按指标展示得分与缺失点',
    lead: '默认只列有缺失或未达标的指标,可展开全部 17 项;每项给出扣分点,点「分析逻辑」看评分理由与证据链。',
    points: [],
    from: [['诊断页面按照指标展示得分和缺失点', '指标表 + 扣分点']],
    impl: ['src/components/eval/MajorDiagnosis.tsx · IndicatorTable'],
  },
  'issue-list': {
    layer: 'page',
    label: '问题与整改建议',
    title: '全部问题平铺,不用整改完一个才看下一个',
    lead: '按本年度重点环节与影响排序,每个问题给出问题描述、整改建议、责任方、建议完成时间和当前整改状态;点链接看判定依据。',
    points: [['整改状态', '示例专业的最近一次评价取整改与跟踪中的真实状态,其余为演示数据。']],
    from: [['整改问题也可以平铺,不需要先整改完再看下一个', '全部平铺']],
    impl: ['src/components/eval/MajorDiagnosis.tsx · IssueList', 'src/lib/eval-tasks.ts · majorIssues'],
  },
  'analysis-layers': {
    layer: 'page',
    label: '整体分析',
    title: '本次评价各专业的整体情况',
    lead: '各环节在所有参评专业中的最低 / 中位 / 最高分、综合得分分布与各环节均分,均由各专业的评价结果实时计算;切换任务即看往期。',
    points: [],
    from: [['把分析层「提交结果质量与 AI 评价概览」的图放到诊断分析首页', '整体分析图表 + 横向比较 + 专业列表']],
    impl: ['src/app/admin/page.tsx'],
  },
  'diag-kpis': {
    layer: 'page',
    label: '诊断概览',
    title: '参评专业、两个核心指标均分与问题数',
    lead: '一行看清本次评价的整体水平和诊断出的问题规模(其中多少落到教师层面)。',
    points: [],
    impl: ['src/app/admin/page.tsx'],
  },
  'diag-majors': {
    layer: 'page',
    label: '各专业诊断',
    title: '点专业进入具体诊断页',
    lead: '按综合得分从低到高排列,列出结论、主要短板环节与问题数;点任一行进入该专业的诊断详情。',
    points: [],
    from: [['在专业列表里,点击可以进入具体专业的诊断页面', '整行可点']],
    impl: ['src/app/admin/page.tsx', 'src/app/admin/diagnosis/page.tsx'],
  },
  'review-scatter': {
    layer: 'page',
    label: '横向:一致性 × 有效性',
    title: '各专业差距在哪个维度上',
    lead: '每个点是一个专业,横轴一致性(方向对不对),纵轴有效性(做没做好),以 80 分为界分成四个象限;下方给出各象限的专业与对应的抓手。',
    points: [['看象限', '「方向对、没做好」抓教学过程与结果;「做得好、方向偏」调培养方案与课程设置;两者都低的考虑缩减或停招。']],
    from: [['横向比较放到诊断分析首页', '散点四象限,点圆点进入该专业诊断']],
    impl: ['src/components/eval/MajorScatter.tsx'],
  },
  'review-trend': {
    layer: 'page',
    label: '纵向回看',
    title: '每个环节比去年好了多少',
    lead: '在具体专业的诊断页里,与上一次评价逐个环节对比:灰条为上次,彩条为本次;红色是本次仍未达标的环节。',
    points: [['数据', '往期为演示数据;正式使用时由每次评价归档自动生成。']],
    from: [['纵向回看:大问题是否已解决', '环节逐项对比']],
    impl: ['src/components/eval/MajorDiagnosis.tsx · Vertical'],
  },
  'review-issues': {
    layer: 'page',
    label: '去年的大问题',
    title: '已解决 / 好转中 / 仍存在',
    lead: '逐条回看上一次评价的大问题;仍存在的问题已并入本次的问题清单。',
    points: [],
    impl: ['src/components/eval/MajorDiagnosis.tsx · Vertical'],
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
    impl: ['src/app/rectification/report/page.tsx'],
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
  'task-board': {
    layer: 'page',
    label: '评价任务看板',
    title: '设置评价任务、管理评价进程',
    lead: '顶部切换评价任务(或新建),看板给出参评专业数、已提交 / 自评中 / 未开始的专业数、资料上传完成率和自评截止时间;已出结果的任务可直接跳到该任务的评价结果、诊断分析、整改与跟踪。',
    points: [['学校版 / 院系版', '同一套功能,只差可评价的专业数(账号配额);文案不写「全校」。']],
    from: [['评价任务:设置任务、管理进程,看各专业自评进度与资料上传', '看板 + 专业列表 + 跳转'], ['可能卖给学校,也可能卖给院系', '以「参评专业」为范围,不写全校']],
    impl: ['src/app/admin/tasks/page.tsx', 'src/lib/eval-tasks.ts'],
  },
  'task-majors': {
    layer: 'page',
    label: '各专业自评与资料上传',
    title: '可按院系、专业或进度排序;点专业看资料明细',
    lead: '每个专业的所属院系、评价进度、资料上传情况与状态;点任一行打开资料明细,看 12 份资料各自是否已上传。示例专业的教师资料与教师端实时同步。',
    points: [],
    from: [['具体列表数据,可按院系首字母、专业首字母、评价进度排序', '三种排序(按拼音)'], ['目前 demo 无法点击查看', '整行可点,打开资料明细']],
    impl: ['src/app/admin/tasks/page.tsx'],
  },
  'result-tiers': {
    layer: 'page',
    label: '三档评价结果',
    title: '重点发展 / 优化整改 / 风险关注',
    lead: '最近一次评价任务(可切换往期)各专业的三档结论与得分;点卡片或标签切换档位,点专业进入该次评价的专业诊断。',
    points: [],
    from: [['三档按 绿:重点发展、黄:优化整改、红:风险关注 调整,点击进入当次评价该专业的诊断页面', '三档 tab + 专业得分列表']],
    impl: ['src/app/admin/reports/page.tsx'],
  },
  'result-trend': {
    layer: 'page',
    label: '近三次变化趋势',
    title: '三档专业数、综合均分与各专业得分的变化',
    lead: '左图看近三次评价三档专业数与综合均分的变化,右表看每个专业近三次的综合得分及升降。',
    points: [],
    from: [['近三次专业评价结果的变化趋势分析', '趋势图 + 专业变化表']],
    impl: ['src/app/admin/reports/page.tsx'],
  },
  'rect-kpis': {
    layer: 'page',
    label: '整改概览',
    title: '各专业待整改问题数量与整改进度',
    lead: '涉及专业、整改问题、待整改、已完成与完成率;切换任务看往期整改情况。',
    points: [],
    from: [['整改与跟踪首页展示各专业的待整改问题数量、整改进度', '概览 + 专业列表']],
    impl: ['src/app/rectification/page.tsx'],
  },
  'rect-majors': {
    layer: 'page',
    label: '各专业整改进度',
    title: '点专业进入整改与跟踪报告',
    lead: '按整改进度从低到高排列,区分管理层面与教师层面的问题数;点任一行进入该专业的整改与跟踪报告。',
    points: [],
    impl: ['src/app/rectification/page.tsx', 'src/app/rectification/report/page.tsx'],
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
  'ir-list': {
    layer: 'page',
    label: '报告列表',
    title: '进来先看报告列表,历史版本都在',
    lead: '按产品反馈,产业分析报告先进入列表:同一产业同一地区合并为一份,最新版在前,展开可看历史版本;「更新报告」只检索上次之后的变化。产业检索日志也并入这个板块。',
    points: [
      ['产业配额', '学校版 / 院系版功能相同,只差可评价的专业数和可生成报告的产业数;这里显示已用产业数 / 配额(演示值 10)。'],
      ['数据来源', '列表读取产业检索日志(GET /api/industry-log),所有用户的生成都会记录。'],
    ],
    impl: ['src/app/industry-report/page.tsx'],
  },
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
    lead: '报告按行业研究报告的体例排成 A4 纸张:封面、核心观点与目录、三章正文 + 研判建议、附录。每章先给成段正文,再给三线表和图(带编号与资料来源);正文上标是参考来源编号,点开即原文;标红数字为程序未能核对的数字。',
    points: [
      ['三章结构(10-21 反馈)', '第一章 产业分析(概况 / 政策 / 资本与创新投入 / 态势总结)→ 第二章 产业链图谱分析(上中下游细分行业与全国代表企业 / 区域布局与重点企业介绍)→ 第三章 产业人才需求分析(紧缺 / 岗位需求 / 人才供给 / 关键岗位逐个介绍)→ 研判与建议。'],
      ['平方数据优先', '企业介绍先查平方企业库,岗位介绍与分年限月薪先查平方职业库,没有的再联网检索补;关键岗位结果沉淀进飞轮,作为回哺职业库的候选(平方目前只有读接口)。'],
      ['低质量来源过滤', '题库、文库、问答类网页(百度题库 / 文库、道客巴巴、知乎问答等)在检索阶段直接剔除,连同引用编号一起去掉。'],
      ['尚缺', '平方暂无招聘库,「全国岗位数量分布、本省岗位数量变化」目前只能引用公开报道中的陈述,接入招聘库后改为按库计算。'],
      ['区域画像', '本省规模、细分方向、企业城市分布、上市公司研发投入、投融资、岗位薪资与人才缺口。先查代码内预查底库,没有再现查并回流知识库(基建 + 飞轮)。'],
      ['下载', '「下载 PDF」按 A4 分页带页码;「下载 Word」是可编辑文档,图表换成同数据的表格,方便学校修改后上报。'],
    ],
    from: [
      ['做成研究报告格式,有规范的行业研究报告文字支撑,不只是图片 + bullet', '成段正文 + 三线表 + 图表编号 + 资料来源 + 参考文献'],
      ['列出本省企业分布、产值、重点产业细分方向', '第一章规模指标与细分方向、第二章区域布局与企业城市分布'],
      ['上市企业研发投入不局限于本省', '第一章表 1-3 同时列全国代表性上市公司与本省上市公司'],
      ['产业链从一句话扩成小章节', '第二章产业链图谱 + 各环节细分行业与全国代表性企业表'],
      ['区域布局要有企业介绍', '第二章「重点企业介绍」每家企业一个小标题'],
      ['关键岗位逐个介绍', '第三章关键岗位表 + 每个岗位:介绍 / 所需能力 / 技能清单 / 薪资范围 / 代表性企业'],
      ['政策从国家—部委—本省梳理并解读', '第一章三级政策导向表 + 传导关系解读'],
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
