// 诊断层统一数据源(演示数据)
// - 两个核心指标:一致性(服务学校层面)/ 有效性(服务教务处/学院/教师),前台只呈现这两项
// - 17 项指标作为两者的支撑逻辑,只在下钻时出现
// - 每项指标的填报归属(fillOwner)与数据来源(sourceType)
// - 问题队列:一次只给一个问题,整改完再给下一个
// - 全校专业红绿灯(宏观决策视角)
// 口径待产品定稿,目前按会议纪要原则给出演示版本。

import { useSyncExternalStore } from 'react';
import { indicators } from './indicators';
import { MOCK_REPORT } from './mock-evaluation-report';

// ---------- 数据来源三层 ----------
// AI:AI 自动采集/预填(>85% 的数据)
// SCHOOL:从学校教务/科研/资产等系统导入
// TEACHER:无源数据,只能由教师本人填报(教案/学情分析/形成性评价/综合性课程设计)
export type SourceType = 'AI' | 'SCHOOL' | 'TEACHER';

export const sourceMeta: Record<SourceType, { label: string; short: string; color: string; bg: string }> = {
  AI: { label: 'AI 自动采集', short: 'AI', color: '#7c3aed', bg: '#f5f3ff' },
  SCHOOL: { label: '学校系统导入', short: '系统', color: '#0284c7', bg: '#f0f9ff' },
  TEACHER: { label: '教师填报', short: '教师', color: '#d97706', bg: '#fffbeb' },
};

// 教师只承接的 4 类无源数据 → 对应指标与范本
export interface TeacherItem {
  indicatorId: string;
  kind: string; // 教案 / 学情分析 / 形成性评价 / 综合性课程设计
  templateId: string; // 对应 /templates/tXX
  templateName: string;
  standard: string[]; // 标准要求(做成什么样算达标)
}

export const TEACHER_ITEMS: TeacherItem[] = [
  {
    indicatorId: '2.1.2',
    kind: '教案',
    templateId: 't05',
    templateName: 'T05 教案(典型)',
    standard: [
      '至少 1 份完整教案体现 AI 工具在课堂中的使用场景(用什么工具、解决什么问题)',
      '教学目标、重难点、案例引入、逻辑递进四部分齐全',
      '附 AI 平台使用记录或学生产出物截图作为佐证',
    ],
  },
  {
    indicatorId: '2.3.1',
    kind: '学情分析',
    templateId: 't07',
    templateName: 'T07 学情分析报告',
    standard: [
      '与上一届同课程数据做纵向对比,至少 2 个维度',
      '明确指出 1-2 个能力短板,并说明对后续课程的交接建议',
      '引用课程平台行为数据(出勤、作业、互动),不得只写主观判断',
    ],
  },
  {
    indicatorId: '2.3.2',
    kind: '形成性评价',
    templateId: 't06',
    templateName: 'T06 过程性评价记录',
    standard: [
      '过程性考核占比 ≥ 40%,且每项考核任务对应到具体课程目标',
      '记录至少 3 次日常测验/项目表现,可追溯到学生个人',
      '给出达成度计算结果与下一轮改进措施',
    ],
  },
  {
    indicatorId: '1.2.2',
    kind: '综合性课程设计',
    templateId: 't11',
    templateName: 'T11 课程大纲(典型)',
    standard: [
      '设计题目来自企业真实问题或行业标准场景',
      '覆盖 ≥ 3 门前序课程的知识点,并在大纲中标明贯通关系',
      '有明确的验收标准与评分细则',
    ],
  },
];

export const TEACHER_INDICATOR_IDS = TEACHER_ITEMS.map((t) => t.indicatorId);

// 学校系统可导入的指标(其余为 AI 采集)
const SCHOOL_INDICATOR_IDS = ['1.2.1', '1.2.3', '2.2.1', '3.1.1', '3.1.2', '4.1.1'];

export function sourceOf(indicatorId: string): SourceType {
  if (TEACHER_INDICATOR_IDS.includes(indicatorId)) return 'TEACHER';
  if (SCHOOL_INDICATOR_IDS.includes(indicatorId)) return 'SCHOOL';
  return 'AI';
}

export function teacherItemOf(indicatorId: string): TeacherItem | undefined {
  return TEACHER_ITEMS.find((t) => t.indicatorId === indicatorId);
}

// ---------- 单项得分(与评价报告同一份) ----------
// 2.1.2 在示例报告中缺失(教案材料未提交),按 62 分记,作为教师端的触发项
const MISSING_SCORES: Record<string, number> = { '2.1.2': 62 };

export function scoreOf(indicatorId: string): number {
  return MOCK_REPORT.indicators?.find((i) => i.id === indicatorId)?.score ?? MISSING_SCORES[indicatorId] ?? 0;
}

// ---------- 两个核心指标 ----------
export type CoreKey = 'consistency' | 'effectiveness';

export interface CoreLink {
  name: string; // 链条环节
  indicatorIds: string[];
  insight: string; // 该环节出问题时,对外给出的分析逻辑(为什么是这个结论)
}

export interface CoreMetric {
  key: CoreKey;
  name: string;
  audience: string;
  question: string; // 它回答的问题
  links: CoreLink[]; // 链条环节(一致性) / 过程-结果环节(有效性)
}

export const CORE_METRICS: CoreMetric[] = [
  {
    key: 'consistency',
    name: '一致性',
    audience: '服务学校层面',
    question: '专业定位 → 培养目标 → 产业需求 → 培养方案 → 课程设置,是否指向同一个最终需要',
    links: [
      { name: '专业定位', indicatorIds: ['1.1.1'], insight: '产业白皮书缺少定量增长数据,定位依据偏定性。' },
      { name: '培养目标', indicatorIds: ['1.1.3'], insight: '课程目标与关键岗位能力的映射还有缺口。' },
      { name: '产业需求', indicatorIds: ['1.1.2'], insight: '存在未对接产业节点的悬空课程。' },
      { name: '培养方案', indicatorIds: ['1.2.2', '1.3.1'], insight: '培养方案对国际标准与 AI 能力的融入不够。' },
      { name: '课程设置', indicatorIds: ['1.2.1'], insight: '前沿课比例与教材时效没跟上产业需求。' },
    ],
  },
  {
    key: 'effectiveness',
    name: '有效性',
    audience: '服务教务处 / 学院 / 教师',
    question: '方向与设置对了之后,教学过程与培养结果有没有真正达成',
    links: [
      { name: '师资能力', indicatorIds: ['2.1.1', '2.1.2'], insight: '教案中缺少 AI 能力融入的证据,横向科研向教学转化不足。' },
      { name: '教学过程', indicatorIds: ['2.2.1', '2.3.1', '2.3.2'], insight: '学情分析缺少纵向对比,过程数据未形成闭环。' },
      { name: '资源保障', indicatorIds: ['3.1.1', '3.1.2'], insight: '企业真实项目进入课程的比例偏低。' },
      { name: '培养结果', indicatorIds: ['4.1.1', '4.1.2', '4.1.3'], insight: '毕业生影响力数据薄弱,结果端证据不足。' },
    ],
  },
];

const round1 = (n: number) => Math.round(n * 10) / 10;

function weightedScore(ids: string[]): number {
  const items = indicators.filter((i) => ids.includes(i.id));
  const w = items.reduce((s, i) => s + i.weight, 0);
  return round1(items.reduce((s, i) => s + scoreOf(i.id) * i.weight, 0) / (w || 1));
}

export interface LinkResult extends CoreLink {
  score: number;
  ok: boolean;
}

export interface CoreResult extends CoreMetric {
  score: number;
  verdict: '达成' | '基本达成' | '未达成';
  links: LinkResult[];
  weakest: LinkResult;
  conclusion: string;
}

const LINK_PASS = 85;

export function coreResult(key: CoreKey): CoreResult {
  const m = CORE_METRICS.find((c) => c.key === key)!;
  const links = m.links.map((l) => {
    const score = weightedScore(l.indicatorIds);
    return { ...l, score, ok: score >= LINK_PASS };
  });
  const score = weightedScore(m.links.flatMap((l) => l.indicatorIds));
  const weakest = [...links].sort((a, b) => a.score - b.score)[0];
  const verdict = score >= 90 ? '达成' : score >= 80 ? '基本达成' : '未达成';
  const conclusion =
    key === 'consistency'
      ? `链条基本贯通,断点在「${weakest.name}」:${weakest.insight}`
      : `整体基本达成,短板在「${weakest.name}」:${weakest.insight}`;
  return { ...m, links, score, verdict, weakest, conclusion };
}

// ---------- 问题队列 ----------
export type IssueLevel = 'TEACHER' | 'MANAGEMENT';

export interface Issue {
  id: string;
  indicatorId: string;
  core: CoreKey;
  level: IssueLevel; // 整改落到教师层面 / 管理层面
  title: string;
  detail: string; // 问题出在哪
  action: string; // 整改建议
  owner: string; // 责任方
  due: string;
  priority: number; // 越小越先处理
  focus?: boolean; // 本年度重点环节
}

// 排序规则(演示):本年度重点环节优先 → 再按影响分(权重 × 差距)
export const ANNUAL_FOCUS = '培养方案与课程设置';

export const ISSUES: Issue[] = [
  {
    id: 'ISS-01',
    indicatorId: '1.2.1',
    core: 'consistency',
    level: 'MANAGEMENT',
    title: '课程设置跟不上产业需求',
    detail: '行业前沿课占比 18%(要求 ≥ 25%),5 门核心课教材出版超过 5 年。',
    action: '由专业负责人牵头修订培养方案,新增 2 门前沿课;教务处本学期内完成教材更新审批。',
    owner: '教务处 · 专业负责人',
    due: '2026-12-31',
    priority: 1,
    focus: true,
  },
  {
    id: 'ISS-02',
    indicatorId: '2.1.2',
    core: 'effectiveness',
    level: 'TEACHER',
    title: '教案中缺少 AI 能力融入的证据',
    detail: '本专业 12 门核心课中仅 3 门教案体现 AI 工具使用,且无学生产出物佐证。',
    action: '核心课教师按 T05 范本补充 1 份体现 AI 融入的教案,并附课堂产出物。',
    owner: '核心课任课教师',
    due: '2026-11-30',
    priority: 2,
  },
  {
    id: 'ISS-03',
    indicatorId: '4.1.2',
    core: 'effectiveness',
    level: 'MANAGEMENT',
    title: '毕业生影响力数据薄弱',
    detail: '校友追踪覆盖率仅 31%,3-5 年职业发展数据缺失,结果端无法证明培养成效。',
    action: '学院建立校友追踪机制,招就处每年导入一次毕业生发展数据。',
    owner: '学院 · 招生就业处',
    due: '2027-03-31',
    priority: 3,
  },
  {
    id: 'ISS-04',
    indicatorId: '2.3.1',
    core: 'effectiveness',
    level: 'TEACHER',
    title: '学情分析缺少纵向对比',
    detail: '学情分析报告只描述本届情况,没有与上一届对比,无法支撑课程间交接。',
    action: '任课教师按 T07 范本补充与上一届的纵向对比,并写明对后续课程的交接建议。',
    owner: '核心课任课教师',
    due: '2026-12-15',
    priority: 4,
  },
  {
    id: 'ISS-05',
    indicatorId: '3.1.2',
    core: 'effectiveness',
    level: 'MANAGEMENT',
    title: '企业真实项目驱动率偏低',
    detail: '仅 2 门课程使用带企业签章与合同编号的真实项目。',
    action: '学院对接 2 家合作企业,下学期新增 2 门课程引入真实项目。',
    owner: '学院 · 校企合作办',
    due: '2027-06-30',
    priority: 5,
  },
];

export const sortedIssues = [...ISSUES].sort((a, b) => a.priority - b.priority);

// ---------- 本地演示状态(localStorage) ----------
// 用 storage 事件 + 自定义事件让同页多个组件同步
const EVT = 'diagnosis-state-change';

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 忽略:隐私模式等场景下仅本次会话生效
  }
  window.dispatchEvent(new Event(EVT));
}

const SSR = '__ssr__';

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener('storage', cb);
  };
}

// 返回 [值, 写入, 是否已在客户端读到 localStorage]
function useStored<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => SSR,
  );
  const ready = raw !== SSR;
  let value = fallback;
  if (ready && raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  return [value, (v: T) => writeJSON(key, v), ready];
}

// 学校是否已导入专业数据(决定首页/决策页走获客态还是决策态)
export function useDataImported() {
  return useStored<boolean>('dx_data_imported', false);
}

// 已整改的问题 id
export function useResolvedIssues() {
  const [ids, setIds, ready] = useStored<string[]>('dx_resolved_issues', []);
  return {
    resolved: ids,
    ready,
    resolve: (id: string) => setIds(Array.from(new Set([...ids, id]))),
    unresolve: (id: string) => setIds(ids.filter((x) => x !== id)),
    reset: () => setIds([]),
  };
}

// 整改任务状态(派发 → 进行中 → 已完成)
export type TaskStatus = 'todo' | 'doing' | 'done';
export function useTaskStatus() {
  const [map, setMap, ready] = useStored<Record<string, TaskStatus>>('dx_task_status', {});
  return {
    statusOf: (id: string): TaskStatus => map[id] ?? 'todo',
    ready,
    setStatus: (id: string, s: TaskStatus) => setMap({ ...map, [id]: s }),
    resetAll: () => setMap({}),
  };
}

// 评价轮次
export function useCycle() {
  return useStored<number>('dx_cycle', 1);
}

// ---------- 全校专业红绿灯(宏观决策视角) ----------
export type Verdict = 'GO' | 'RISK' | 'NO';
export type Layout = '保留' | '优化' | '缩减' | '停招';

export interface Major {
  name: string;
  college: string;
  consistency: number;
  effectiveness: number;
  industryMatch: number; // 与区域产业匹配度
  verdict: Verdict;
  layout: Layout;
  reason: string;
}

export const verdictMeta: Record<Verdict, { label: string; color: string; bg: string; dot: string }> = {
  GO: { label: '可办', color: '#047857', bg: '#ecfdf5', dot: '#10b981' },
  RISK: { label: '有风险', color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  NO: { label: '不可办', color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
};

const c = coreResult('consistency').score;
const e = coreResult('effectiveness').score;

export const MAJORS: Major[] = [
  { name: '智能制造工程', college: '机械工程与自动化学院', consistency: c, effectiveness: e, industryMatch: 91, verdict: 'GO', layout: '保留', reason: '对接区域装备制造集群,链条贯通' },
  { name: '机械设计制造及其自动化', college: '机械工程与自动化学院', consistency: 86, effectiveness: 83, industryMatch: 88, verdict: 'GO', layout: '保留', reason: '就业稳定,产业需求持续' },
  { name: '食品科学与工程', college: '食品学院', consistency: 89, effectiveness: 85, industryMatch: 90, verdict: 'GO', layout: '保留', reason: '海洋食品特色鲜明,区域需求强' },
  { name: '轻化工程', college: '轻工与化学工程学院', consistency: 84, effectiveness: 82, industryMatch: 81, verdict: 'GO', layout: '保留', reason: '学校传统优势专业' },
  { name: '服装与服饰设计', college: '服装学院', consistency: 87, effectiveness: 80, industryMatch: 84, verdict: 'GO', layout: '保留', reason: '行业影响力高' },
  { name: '纺织工程', college: '纺织与材料工程学院', consistency: 76, effectiveness: 78, industryMatch: 72, verdict: 'RISK', layout: '优化', reason: '课程设置偏传统,需向功能纺织转型' },
  { name: '计算机科学与技术', college: '信息科学与工程学院', consistency: 74, effectiveness: 81, industryMatch: 79, verdict: 'RISK', layout: '优化', reason: '同质化严重,缺少与本校特色的结合点' },
  { name: '数据科学与大数据技术', college: '信息科学与工程学院', consistency: 72, effectiveness: 70, industryMatch: 76, verdict: 'RISK', layout: '优化', reason: '师资与实践平台不足' },
  { name: '生物工程', college: '生物工程学院', consistency: 78, effectiveness: 74, industryMatch: 70, verdict: 'RISK', layout: '优化', reason: '就业对口率下降' },
  { name: '环境设计', college: '艺术设计学院', consistency: 75, effectiveness: 77, industryMatch: 68, verdict: 'RISK', layout: '缩减', reason: '区域需求收缩,建议控制招生规模' },
  { name: '会计学', college: '管理学院', consistency: 64, effectiveness: 72, industryMatch: 58, verdict: 'NO', layout: '缩减', reason: '与学校工科定位不一致,AI 替代风险高' },
  { name: '英语', college: '外国语学院', consistency: 58, effectiveness: 69, industryMatch: 52, verdict: 'NO', layout: '停招', reason: '与区域产业匹配度低,就业对口率持续下降' },
];

export const schoolAvg = round1(
  MAJORS.reduce((s, m) => s + (m.consistency + m.effectiveness) / 2, 0) / MAJORS.length,
);

// 本专业(演示主角)
export const DEMO_MAJOR = MAJORS[0];

// ---------- 纵向回看:上一学年基线(演示数据) ----------
export interface PrevIssue {
  title: string;
  indicatorId: string;
  status: 'resolved' | 'improving' | 'persisting'; // 已解决 / 好转中 / 仍存在
  note: string;
}

export const LAST_CYCLE = {
  label: '2024-2025 学年',
  consistency: 85.9,
  effectiveness: 82.3,
  links: {
    专业定位: 90,
    培养目标: 91,
    产业需求: 93,
    培养方案: 82.1,
    课程设置: 74,
    师资能力: 72.4,
    教学过程: 90.2,
    资源保障: 81,
    培养结果: 80.3,
  } as Record<string, number>,
  issues: [
    { title: '培养方案未对接国际工程教育标准', indicatorId: '1.3.1', status: 'resolved', note: '已按工程教育认证标准修订培养方案,本学年该环节回到达标线以上。' },
    { title: '课程设置跟不上产业需求', indicatorId: '1.2.1', status: 'persisting', note: '前沿课比例从 12% 提到 18%,仍低于 25% 要求,本学年继续作为重点环节。' },
    { title: '企业真实项目驱动率偏低', indicatorId: '3.1.2', status: 'improving', note: '新增 1 门课程引入真实项目,资源保障环节刚回到达标线,但该项单独看仍偏低,本学年继续跟踪。' },
    { title: '教案缺少 AI 能力融入', indicatorId: '2.1.2', status: 'persisting', note: '师资能力环节有小幅提升,但多数核心课教案仍未体现 AI 工具使用,本学年已推送给任课教师。' },
  ] as PrevIssue[],
};

// ---------- 三视角可见范围(由教务部门自行开关;先做前端显隐,后接权限) ----------
export type ViewGroup = 'decision' | 'management' | 'upload';
export const VIEW_GROUP_META: Record<ViewGroup, { label: string; audience: string }> = {
  decision: { label: '宏观决策分析', audience: '校长 / 班子' },
  management: { label: '管理分析', audience: '教务处 / 学院' },
  upload: { label: '数据上传', audience: '教务操作人员' },
};
export function useViewVisibility() {
  return useStored<Record<ViewGroup, boolean>>('dx_view_visibility', { decision: true, management: true, upload: true });
}
