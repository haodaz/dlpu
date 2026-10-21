// 评价任务:管理分析四段(评价任务 → 评价结果 → 诊断分析 → 整改与跟踪)与教师端的共同数据源
// 一次评价任务 = 各专业自评(上传资料)→ AI 评价出结果 → 诊断 → 整改。学校版、院系版共用,文案不写「全校」。
// 学校内部数据均为演示数据:最近一次有结果的任务(2025-2026 学年)取现有诊断数据,往期按确定性规则派生。
import { MAJORS, DEMO_MAJOR, LAST_CYCLE, scoreOf, sortedIssues, CORE_METRICS, type Major, type Verdict, type Issue, type CoreKey } from './diagnosis';
import { indicators } from './indicators';

export type TaskState = 'draft' | 'ongoing' | 'ended';

export interface EvalTask {
  id: string;
  name: string;
  period: string; // 学年
  start: string;
  end: string; // 自评截止
  state: TaskState;
  hasResults: boolean; // AI 评价结果是否已出
}

export const TASK_STATE_META: Record<TaskState, { label: string; color: string }> = {
  draft: { label: '未开始', color: 'default' },
  ongoing: { label: '自评进行中', color: 'processing' },
  ended: { label: '已结束', color: 'success' },
};

// 新的在前
export const EVAL_TASKS: EvalTask[] = [
  { id: 'T2027', name: '2026-2027 学年专业评价', period: '2026-2027 学年', start: '2026-09-01', end: '2026-12-31', state: 'ongoing', hasResults: false },
  { id: 'T2026', name: '2025-2026 学年专业评价', period: '2025-2026 学年', start: '2025-09-01', end: '2025-12-31', state: 'ended', hasResults: true },
  { id: 'T2025', name: '2024-2025 学年专业评价', period: '2024-2025 学年', start: '2024-09-01', end: '2024-12-31', state: 'ended', hasResults: true },
  { id: 'T2024', name: '2023-2024 学年专业评价', period: '2023-2024 学年', start: '2023-09-01', end: '2023-12-31', state: 'ended', hasResults: true },
];

export const CURRENT_TASK = EVAL_TASKS.find((t) => t.state === 'ongoing') ?? EVAL_TASKS[0];
export const LATEST_RESULT_TASK = EVAL_TASKS.find((t) => t.hasResults)!;
export const RESULT_TASKS = EVAL_TASKS.filter((t) => t.hasResults);
export const taskById = (id?: string | null) => EVAL_TASKS.find((t) => t.id === id);

// ---------- 三档结论(宏观决策与评价结果同一套文案) ----------
export const VERDICT_TEXT: Record<Verdict, string> = { GO: '重点发展', RISK: '优化整改', NO: '风险关注' };

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.max(40, Math.min(99, n));
// 确定性伪随机:同一输入永远得到同一结果,刷新不跳
const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  return h;
};
const pick = (s: string, lo: number, hi: number) => lo + (hash(s) % (hi - lo + 1));

export const overallOf = (c: number, e: number) => round1((c + e) / 2);
export const verdictOf = (overall: number): Verdict => (overall >= 80 ? 'GO' : overall >= 70 ? 'RISK' : 'NO');

export interface MajorResult {
  major: string;
  college: string;
  consistency: number;
  effectiveness: number;
  overall: number;
  verdict: Verdict;
}

const taskIndex = (taskId: string) => RESULT_TASKS.findIndex((t) => t.id === taskId); // 0 = 最近一次有结果的任务

/** 某任务某专业的评价结果;任务还没有结果时返回 null */
export function majorResult(taskId: string, major: string): MajorResult | null {
  const m = MAJORS.find((x) => x.name === major);
  const k = taskIndex(taskId);
  if (!m || k < 0) return null;
  if (k === 0) return { major: m.name, college: m.college, consistency: m.consistency, effectiveness: m.effectiveness, overall: overallOf(m.consistency, m.effectiveness), verdict: m.verdict };
  let c = m.consistency;
  let e = m.effectiveness;
  for (let i = 1; i <= k; i++) {
    // 往前推一年:多数专业逐年小幅进步,个别退步
    c -= pick(`${m.name}|c|${i}`, -2, 5);
    e -= pick(`${m.name}|e|${i}`, -2, 5);
  }
  if (m.name === DEMO_MAJOR.name && k === 1) {
    c = LAST_CYCLE.consistency;
    e = LAST_CYCLE.effectiveness;
  }
  c = round1(clamp(c));
  e = round1(clamp(e));
  const overall = overallOf(c, e);
  return { major: m.name, college: m.college, consistency: c, effectiveness: e, overall, verdict: verdictOf(overall) };
}

export function taskResults(taskId: string): MajorResult[] {
  return MAJORS.map((m) => majorResult(taskId, m.name)).filter((r): r is MajorResult => !!r);
}

export const avgOf = (rows: MajorResult[], k: 'consistency' | 'effectiveness' | 'overall') => (rows.length ? round1(rows.reduce((s, r) => s + r[k], 0) / rows.length) : 0);

// ---------- 自评进度与资料上传 ----------
export const REQUIRED_MATERIALS = 12; // 每个专业需提交的资料类数(教师 4 类 + 学校系统 8 类)

export interface MajorProgress {
  major: string;
  college: string;
  progress: number; // %
  uploaded: number;
  required: number;
  status: '未开始' | '自评中' | '已提交';
  updatedAt: string;
}

export function majorProgress(task: EvalTask, m: Major): MajorProgress {
  let progress = 100;
  if (task.state === 'ongoing') progress = m.name === DEMO_MAJOR.name ? 67 : [0, 25, 42, 58, 75, 83, 92, 100][hash(`${task.id}|${m.name}`) % 8];
  if (task.state === 'draft') progress = 0;
  const uploaded = Math.round((progress / 100) * REQUIRED_MATERIALS);
  const day = String(pick(`${task.id}|${m.name}|d`, 1, 28)).padStart(2, '0');
  return {
    major: m.name,
    college: m.college,
    progress,
    uploaded,
    required: REQUIRED_MATERIALS,
    status: progress >= 100 ? '已提交' : progress > 0 ? '自评中' : '未开始',
    updatedAt: progress > 0 ? `${task.start.slice(0, 7)}-${day}` : '—',
  };
}

export const taskProgress = (task: EvalTask) => MAJORS.map((m) => majorProgress(task, m));

// ---------- 指标得分与问题(按专业) ----------
const coreOfIndicator = (id: string): CoreKey => (CORE_METRICS[0].links.some((l) => l.indicatorIds.includes(id)) ? 'consistency' : 'effectiveness');
const DEMO_CORE = { consistency: MAJORS[0].consistency, effectiveness: MAJORS[0].effectiveness };

/** 指标得分:示例专业的最近一次结果为真实演示数据;其他专业 / 往期按核心指标比例缩放,保证加权后与该专业的核心指标一致 */
export function indicatorScore(taskId: string, major: string, indicatorId: string): number {
  const r = majorResult(taskId, major);
  if (!r) return 0;
  const core = coreOfIndicator(indicatorId);
  const ratio = r[core] / DEMO_CORE[core];
  return round1(Math.min(100, scoreOf(indicatorId) * ratio));
}

export const LINK_PASS = 85;

export function coreLinks(taskId: string, major: string, key: CoreKey) {
  const m = CORE_METRICS.find((c) => c.key === key)!;
  return m.links.map((l) => {
    const items = indicators.filter((i) => l.indicatorIds.includes(i.id));
    const w = items.reduce((s, i) => s + i.weight, 0) || 1;
    let score = round1(items.reduce((s, i) => s + indicatorScore(taskId, major, i.id) * i.weight, 0) / w);
    // 示例专业上一学年:用归档的各环节真实得分
    if (major === DEMO_MAJOR.name && taskIndex(taskId) === 1 && LAST_CYCLE.links[l.name] !== undefined) score = LAST_CYCLE.links[l.name];
    return { ...l, score, ok: score >= LINK_PASS };
  });
}

/** 某专业某次评价的问题清单:示例专业最近一次为人工梳理的问题;其余由最低分指标生成 */
export function majorIssues(taskId: string, major: string): Issue[] {
  const isDemo = major === DEMO_MAJOR.name && taskIndex(taskId) === 0;
  if (isDemo) return sortedIssues;
  const r = majorResult(taskId, major);
  if (!r) return [];
  const low = indicators
    .map((i) => ({ i, s: indicatorScore(taskId, major, i.id) }))
    .filter((x) => x.s < LINK_PASS)
    .sort((a, b) => a.s - b.s)
    .slice(0, 4);
  return low.map(({ i, s }, k) => {
    const template = sortedIssues.find((x) => x.indicatorId === i.id);
    return {
      id: `${major}-${i.id}`,
      indicatorId: i.id,
      core: coreOfIndicator(i.id),
      level: template?.level ?? (i.id.startsWith('2.') ? 'TEACHER' : 'MANAGEMENT'),
      title: template?.title ?? `「${i.name}」未达标`,
      detail: `该指标得分 ${s},低于达标线 ${LINK_PASS}。${template ? template.detail : '支撑材料不足或证据链不完整。'}`,
      action: template?.action ?? '由专业负责人组织补齐支撑材料,对照指标评分标准逐项整改。',
      owner: template?.owner ?? '专业负责人',
      due: template?.due ?? '2026-12-31',
      priority: k + 1,
    } as Issue;
  });
}

/** 非示例专业的整改完成情况(确定性);示例专业以数据库中的整改任务为准 */
export function staticRectDone(taskId: string, major: string, total: number) {
  if (taskIndex(taskId) > 0) return total; // 往期已整改完
  return Math.min(total, pick(`${taskId}|${major}|rect`, 0, total));
}

export const majorSlug = (name: string) => encodeURIComponent(name);
