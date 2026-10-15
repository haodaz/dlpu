'use client';
// 学校诊断状态(客户端 hooks):存数据库(/api/state),数据库不可用时退回本机暂存
// 诊断数据本身(问题、指标、专业)在 diagnosis.ts,前后端共用
import { createSyncedStore } from './synced-store';
import { coreResult, type ViewGroup } from './diagnosis';

// ---------- 学校诊断状态(存数据库,见 /api/state;数据库不可用时退回本机暂存) ----------
export type TaskStatus = 'todo' | 'doing' | 'done';

interface CycleRow {
  cycleNo: number;
  period?: string;
  focusDimension?: string;
}
interface TaskRow {
  issueId: string;
  status: TaskStatus;
  assignee?: string;
  updatedBy?: string | null;
  updatedAt?: string;
}
interface ArchivedCycle extends CycleRow {
  consistencyScore: number | null;
  effectivenessScore: number | null;
  resolvedCount: number | null;
  totalCount: number | null;
  archivedAt: string | null;
}
export interface SchoolState {
  settings: { dataImported?: boolean; viewVisibility?: Record<ViewGroup, boolean> };
  cycle: CycleRow;
  tasks: TaskRow[];
  history: ArchivedCycle[];
}

const schoolStore = createSyncedStore<SchoolState>('school-state', '/api/state', {
  settings: {},
  cycle: { cycleNo: 1 },
  tasks: [],
  history: [],
});

export const useSchoolState = () => schoolStore.use();

const setSetting = <K extends keyof SchoolState['settings']>(key: K, value: SchoolState['settings'][K]) =>
  schoolStore.mutate({ action: 'setSetting', key, value }, (d) => ({ ...d, settings: { ...d.settings, [key]: value } }));

const setTaskStatus = (issueId: string, status: TaskStatus) =>
  schoolStore.mutate({ action: 'setTaskStatus', issueId, status }, (d) => {
    const exists = d.tasks.some((t) => t.issueId === issueId);
    const tasks = exists ? d.tasks.map((t) => (t.issueId === issueId ? { ...t, status } : t)) : [...d.tasks, { issueId, status }];
    return { ...d, tasks };
  });

const resetTasks = () =>
  schoolStore.mutate({ action: 'resetTasks' }, (d) => ({ ...d, tasks: d.tasks.map((t) => ({ ...t, status: 'todo' as TaskStatus })) }));

const taskStatusOf = (tasks: TaskRow[], id: string): TaskStatus => tasks.find((t) => t.issueId === id)?.status ?? 'todo';

// 学校是否已导入专业数据(决定首页/决策页走获客态还是决策态)
export function useDataImported(): [boolean, (v: boolean) => void, boolean] {
  const { data, ready } = schoolStore.use();
  return [data.settings.dataImported ?? false, (v) => void setSetting('dataImported', v), ready];
}

// 已整改的问题 id(= 本轮已完成的整改任务)
export function useResolvedIssues() {
  const { data, ready } = schoolStore.use();
  const resolved = data.tasks.filter((t) => t.status === 'done').map((t) => t.issueId);
  return {
    resolved,
    ready,
    resolve: (id: string) => void setTaskStatus(id, 'done'),
    unresolve: (id: string) => {
      if (taskStatusOf(schoolStore.get().data.tasks, id) === 'done') void setTaskStatus(id, 'doing');
    },
    reset: () => void resetTasks(),
  };
}

// 整改任务状态(派发 → 进行中 → 已完成)
export function useTaskStatus() {
  const { data, ready } = schoolStore.use();
  return {
    statusOf: (id: string): TaskStatus => taskStatusOf(data.tasks, id),
    taskOf: (id: string) => data.tasks.find((t) => t.issueId === id),
    ready,
    setStatus: (id: string, s: TaskStatus) => void setTaskStatus(id, s),
    resetAll: () => void resetTasks(),
  };
}

// 评价轮次:设置为下一轮时归档本轮(记录两大核心指标与整改完成情况)
export function useCycle(): [number, (n: number) => void, boolean] {
  const { data, ready } = schoolStore.use();
  const next = () =>
    void schoolStore.mutate(
      { action: 'nextCycle', consistency: coreResult('consistency').score, effectiveness: coreResult('effectiveness').score },
      (d) => ({ ...d, cycle: { cycleNo: d.cycle.cycleNo + 1 }, tasks: d.tasks.map((t) => ({ ...t, status: 'todo' as TaskStatus })) }),
    );
  return [data.cycle.cycleNo, (n) => n > data.cycle.cycleNo && next(), ready];
}

const ALL_VIEWS: Record<ViewGroup, boolean> = { decision: true, management: true, upload: true };
export function useViewVisibility(): [Record<ViewGroup, boolean>, (v: Record<ViewGroup, boolean>) => void, boolean] {
  const { data, ready } = schoolStore.use();
  return [data.settings.viewVisibility ?? ALL_VIEWS, (v) => void setSetting('viewVisibility', v), ready];
}
