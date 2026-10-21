/**
 * 演示故事线(照 yida-company 的 lib/story.ts + StoryBar):按 9.23 会议纪要的叙事主线——
 * 以「年度教育教学工作会议」为场景,看清形势 → 诊断分析 → 整改落地 → 下一轮。
 * 每一步 = 驱动页面(切角色 / 跳页面 / 切换有无数据)+ 高亮这一页要看的模块(data-spec)
 *        + cap(给听众讲的产品语言)+ tech(给技术同学看的实现说明)。
 * 改页面结构时同步改这里的 path / focus。
 */
import type { Role } from '@/components/AppLayout';

const DEMO = '智能制造工程'; // 示例专业

export interface StoryStep {
  key: string;
  act: string; // 所属环节
  title: string;
  role: Role;
  path: string;
  imported?: boolean; // 学校是否已导入数据(决定决策页是获客态还是决策态)
  focus: string; // 高亮的模块(页面上的 data-spec)
  cap: string;
  tech: string;
}

export const STORY_ACTS = ['序幕 · 获客', '环节一 · 看清形势', '环节二 · 诊断分析', '环节三 · 整改落地', '闭环 · 下一轮'];

export const STORY: StoryStep[] = [
  {
    key: 'hook',
    act: '序幕 · 获客',
    title: '还没有数据的学校',
    role: 'admin',
    path: '/decision',
    imported: false,
    focus: 'decision-hook',
    cap: '学校还没把数据交给我们时,首页不放空仪表盘,而是先给一两条「双优」政策解读和区域产业信号,让校长意识到这场生存之战和自己有关;想看完整诊断,就得把数据交出来。',
    tech: '决策页按学校级设置 dataImported 走两种状态;政策要点在 src/lib/policy.ts,免费露出 1-2 条,其余导入数据后解锁。',
  },
  {
    key: 'import',
    act: '序幕 · 获客',
    title: '学校只需把数据交出来',
    role: 'admin',
    path: '/admin/data-sources',
    imported: false,
    focus: 'ds-layers',
    cap: '不动学校原有系统,只要求把现有系统的数据交出来:AI 自动采集一大半,学校系统导入一部分,教师只需要填 4 类没有数据源的材料。',
    tech: '中台:学校系统按规范推送到 POST /api/data-import(规范见右上角「接入规范」),每次导入写日志,失败在页面顶部告警。',
  },
  {
    key: 'lights',
    act: '环节一 · 看清形势',
    title: '一屏看清本年度结论',
    role: 'admin',
    path: '/decision',
    imported: true,
    focus: 'decision-verdict',
    cap: '数据到位后,会议第一环节给校长和班子看:大屏上一眼看清多少专业重点发展、多少要优化整改、多少需风险关注;下方红绿灯按三档切换,点专业能看诊断。',
    tech: '红绿灯由每个专业的一致性 × 有效性判定(src/lib/diagnosis.ts · MAJORS),学校内部数据目前为演示数据。',
  },
  {
    key: 'region',
    act: '环节一 · 看清形势',
    title: '本地区重点发展哪些产业',
    role: 'admin',
    path: '/decision',
    imported: true,
    focus: 'decision-region',
    cap: '判断专业该不该办,看的是区域产业要不要这样的人。这里客观列出省、市两级政府重点发展的产业和规模,来自规划和政府工作报告,不随本校专业变化;每个产业都能一键生成完整的产业分析报告。',
    tech: '区域重点产业:省市规划与政府工作报告(阿里云联网检索抽取)+ 平方产业集群库;代码内预查底库命中直接显示,规模数字须在原文中逐字出现。',
  },
  {
    key: 'advisor',
    act: '环节一 · 看清形势',
    title: '布局怎么调,问专业建设专家 AI',
    role: 'admin',
    path: '/decision',
    imported: true,
    focus: 'decision-advisor',
    cap: '布局怎么调不写死成「保留 / 缩减 / 停招」,而是让专业建设专家 AI 结合区域重点产业和各专业评价结果来回答;敏感的招生调整只给论证方向。',
    tech: 'POST /api/advisor:系统提示词注入各专业评价结果、区域重点产业与已检索的产业画像,只依据这些数据作答。',
  },
  {
    key: 'industry',
    act: '环节一 · 看清形势',
    title: '每个重点产业一份研究报告',
    role: 'admin',
    path: '/industry-report',
    imported: true,
    focus: 'ir-list',
    cap: '区域重点产业可以一键生成研究报告,分三章:产业分析、产业链图谱、产业人才需求;报告都留在列表里,再次生成只看变化,历史版本可以回看。',
    tech: '企业介绍、岗位介绍与薪资优先取平方企业库 / 职业库,其余联网检索;题库、文库类低质量来源在检索阶段剔除;数字须在原文中逐字出现。',
  },
  {
    key: 'tasks',
    act: '环节二 · 诊断分析',
    title: '先看评价任务进展到哪了',
    role: 'admin',
    path: '/admin/tasks',
    imported: true,
    focus: 'task-board',
    cap: '会议第二环节面向教务处和学院。先看这次评价任务的进程:多少专业已提交自评、资料上传完成了多少、还有几天截止;点任一专业能看到它的资料明细。',
    tech: '评价任务是管理分析的起点:任务 → 结果 → 诊断 → 整改;学校版与院系版共用,只差可评价的专业数。',
  },
  {
    key: 'results',
    act: '环节二 · 诊断分析',
    title: '评价结果分三档',
    role: 'admin',
    path: '/admin/reports',
    imported: true,
    focus: 'result-tiers',
    cap: '最近一次评价的结果分三档:重点发展、优化整改、风险关注,每个专业都有得分;下方还能看近三次的变化趋势和往期结果。',
    tech: '三档按一致性与有效性的综合得分判定(≥ 80 / 70–80 / < 70),与宏观决策页的红绿灯同一套文案。',
  },
  {
    key: 'core',
    act: '环节二 · 诊断分析',
    title: '进到一个专业:两个核心指标默认展开',
    role: 'admin',
    path: `/admin/diagnosis?major=${encodeURIComponent(DEMO)}&task=T2026`,
    imported: true,
    focus: 'core-metrics',
    cap: '点进具体专业,前台只有两个指标:一致性看「方向对不对」,有效性看「做没做好」。分析结果默认展开,每个环节的得分、没达标的原因和支撑指标一屏看全。',
    tech: '一致性 / 有效性按链条环节聚合 17 项指标的得分(CORE_METRICS),17 项只作为支撑逻辑出现。',
  },
  {
    key: 'issues',
    act: '环节二 · 诊断分析',
    title: '问题与整改建议一次看全',
    role: 'admin',
    path: `/admin/diagnosis?major=${encodeURIComponent(DEMO)}&task=T2026`,
    imported: true,
    focus: 'issue-list',
    cap: '这个专业的问题全部平铺:问题出在哪、整改建议、谁负责、什么时候完成、现在整改到哪一步,按本年度重点环节排序。',
    tech: '问题由诊断结论生成(示例专业为人工梳理,其余专业由最低分指标生成);整改状态与「整改与跟踪」同步。',
  },
  {
    key: 'drill',
    act: '环节二 · 诊断分析',
    title: '指标退居幕后,点开才给逻辑',
    role: 'admin',
    path: '/admin/indicator-analysis?id=1.2.1',
    imported: true,
    focus: 'indicator-analysis',
    cap: '想知道「为什么是这个结论」,从问题点进去才看到指标层:评分理由、扣分点、证据链。没有下钻,指标不会出现在前台。',
    tech: '菜单里已没有指标入口;/admin/indicator-analysis 只从结论下钻到达,菜单高亮其来源页。',
  },
  {
    key: 'meeting',
    act: '环节二 · 诊断分析',
    title: '开会时一键上大屏',
    role: 'admin',
    path: '/admin',
    imported: true,
    focus: 'meeting-btn',
    cap: '在会上,点「会议模式」进入大屏:去掉导航、放大字号,决策结论、诊断分析、整改报告三个环节可以连续演示。',
    tech: 'MeetingMode 组件全屏渲染三个环节,支持键盘翻页。',
  },
  {
    key: 'report',
    act: '环节三 · 整改落地',
    title: '自动生成整改报告',
    role: 'admin',
    path: `/rectification/report?major=${encodeURIComponent(DEMO)}&task=T2026`,
    imported: true,
    focus: 'rect-report',
    cap: '会议第三环节:由诊断结论自动生成整改报告,分管理层面和教师层面,写清标准要求、范本、责任人和时间,可以直接打印分发。',
    tech: '整改任务存数据库(RectificationTask),状态可派发、可跟踪;报告页支持打印样式。',
  },
  {
    key: 'teacher',
    act: '环节三 · 整改落地',
    title: '老师在评价任务里看到自己的全部工作',
    role: 'user',
    path: '/teacher/task',
    imported: true,
    focus: 'teacher-task',
    cap: '老师打开评价任务,看到这次需要本人提交的全部资料:每项的要求与范本、当前进度、审核意见;收到修改意见就按意见改完重新上传,管理员那边同步可见。',
    tech: '教师只提交 4 类无源数据(教案 / 学情分析 / 形成性评价 / 综合性课程设计);状态取填报状态机(数据库)。',
  },
  {
    key: 'fill',
    act: '环节三 · 整改落地',
    title: '照着标准和范本填',
    role: 'user',
    path: '/data-management/ai-prefill/detail?indicator=2.1.2',
    imported: true,
    focus: 'prefill-standard',
    cap: '老师点进去,标准要求和模板范本就在同一屏,可以选 AI 辅助先起草。大量精力投在给老师做模板和范本上,这是教师端唯一真正的难点。',
    tech: '填报状态机存数据库(/api/filing),服务端校验状态转换;模板目录只在 src/lib/templates.ts 维护一份。',
  },
  {
    key: 'review',
    act: '闭环 · 下一轮',
    title: '横向比较,纵向回看',
    role: 'admin',
    path: '/admin',
    imported: true,
    focus: 'review-scatter',
    cap: '整改之后回头看:诊断分析首页横向看各专业的差距在哪,进到专业里纵向看去年的大问题今年解决了没有。',
    tech: '每轮归档时记录一致性、有效性与整改完成情况(EvaluationCycle),用于纵向回看。',
  },
  {
    key: 'next',
    act: '闭环 · 下一轮',
    title: '发起下一轮',
    role: 'admin',
    path: `/rectification/report?major=${encodeURIComponent(DEMO)}&task=T2026`,
    imported: true,
    focus: 'rect-cycle',
    cap: '这一轮整改完成后发起下一轮:本轮结果归档,下一轮按结果推荐新的聚焦点。诊断 → 分析 → 整改 → 建设 → 评价 → 下一轮,每年抓一个环节。',
    tech: 'POST /api/state {action: nextCycle}:归档本轮并生成下一轮的整改任务。',
  },
];
