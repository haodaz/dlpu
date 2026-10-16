/**
 * 演示故事线(照 yida-company 的 lib/story.ts + StoryBar):按 9.23 会议纪要的叙事主线——
 * 以「年度教育教学工作会议」为场景,看清形势 → 诊断分析 → 整改落地 → 下一轮。
 * 每一步 = 驱动页面(切角色 / 跳页面 / 切换有无数据)+ 高亮这一页要看的模块(data-spec)
 *        + cap(给听众讲的产品语言)+ tech(给技术同学看的实现说明)。
 * 改页面结构时同步改这里的 path / focus。
 */
import type { Role } from '@/components/AppLayout';

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
    title: '校长只要是 / 否结论',
    role: 'admin',
    path: '/decision',
    imported: true,
    focus: 'decision-lights',
    cap: '数据到位后,会议第一环节给校长和班子看:全校专业红绿灯——可办、有风险、不可办。决策视角只要是 / 否级别的结论,不给指标明细。',
    tech: '红绿灯由每个专业的一致性 × 有效性判定(src/lib/diagnosis.ts · MAJORS),学校内部数据目前为演示数据。',
  },
  {
    key: 'layout',
    act: '环节一 · 看清形势',
    title: '落到专业布局建议',
    role: 'admin',
    path: '/decision',
    imported: true,
    focus: 'decision-layout',
    cap: '红绿灯直接落到下一步怎么办:哪些专业保留、哪些优化、哪些缩减或停招,每条都附一句理由。',
    tech: '布局建议与理由写在 MAJORS 的 layout / reason 字段,与红绿灯同源。',
  },
  {
    key: 'region',
    act: '环节一 · 看清形势',
    title: '结论背后是真实的产业数据',
    role: 'admin',
    path: '/decision',
    imported: true,
    focus: 'decision-region',
    cap: '判断专业该不该办,看的是区域产业要不要这样的人。这里的产业信号来自真实检索,不是拍脑袋;在「产业分析报告」里可以现场输入任意产业和地区生成一份。',
    tech: '产业侧真实检索:阿里云联网检索 + 平方数据 + OpenAlex 论文数;数值按公式计算,模型只做抽取和解读,所有数字逐条可溯源。',
  },
  {
    key: 'core',
    act: '环节二 · 诊断分析',
    title: '前台只有两个核心指标',
    role: 'admin',
    path: '/admin',
    imported: true,
    focus: 'core-metrics',
    cap: '会议第二环节面向教务处和学院。前台只放两个指标:一致性看「方向对不对」——从专业定位到课程设置是否指向同一个需要;有效性看「做没做好」——过程和结果有没有达成。',
    tech: '一致性 / 有效性按链条环节聚合 17 项指标的得分(CORE_METRICS),17 项只作为支撑逻辑在下钻时出现。',
  },
  {
    key: 'queue',
    act: '环节二 · 诊断分析',
    title: '一次只给一个问题',
    role: 'admin',
    path: '/admin',
    imported: true,
    focus: 'issue-queue',
    cap: '不把问题一口气全摊开。按本年度重点环节排序,只给最该先解决的那一个,整改完再露出下一个——不让人望而却步。',
    tech: '问题队列按 priority 排序,本年度重点环节(ANNUAL_FOCUS)优先;完成状态存数据库(/api/state)。',
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
    path: '/rectification',
    imported: true,
    focus: 'rect-report',
    cap: '会议第三环节:由诊断结论自动生成整改报告,分管理层面和教师层面,写清标准要求、范本、责任人和时间,可以直接打印分发。',
    tech: '整改任务存数据库(RectificationTask),状态可派发、可跟踪;报告页支持打印样式。',
  },
  {
    key: 'teacher',
    act: '环节三 · 整改落地',
    title: '问题才落到老师,一次一件',
    role: 'user',
    path: '/',
    imported: true,
    focus: 'teacher-task',
    cap: '没有问题不打扰老师。只有教师层面的问题才推给相关老师,而且只给「需要你做的这一件」:为什么找你、要多久、做成什么样算达标、照哪个范本填。',
    tech: '教师端只推 4 类无源数据(教案 / 学情分析 / 形成性评价 / 综合性课程设计);进度跟随真实填报状态。',
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
    path: '/admin/review',
    imported: true,
    focus: 'review-scatter',
    cap: '整改之后回头看:横向看全校专业的差距在哪,纵向看去年的大问题今年解决了没有。',
    tech: '每轮归档时记录一致性、有效性与整改完成情况(EvaluationCycle),用于纵向回看。',
  },
  {
    key: 'next',
    act: '闭环 · 下一轮',
    title: '发起下一轮',
    role: 'admin',
    path: '/rectification',
    imported: true,
    focus: 'rect-cycle',
    cap: '这一轮整改完成后发起下一轮:本轮结果归档,下一轮按结果推荐新的聚焦点。诊断 → 分析 → 整改 → 建设 → 评价 → 下一轮,每年抓一个环节。',
    tech: 'POST /api/state {action: nextCycle}:归档本轮并生成下一轮的整改任务。',
  },
];
