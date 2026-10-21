'use client';
// 教师端「我的工作」:某次评价任务里需要本人提交的全部资料(不再一次只给一件)
// 状态取自填报状态机(数据库);往期任务一律视为已通过
import { useSyncExternalStore } from 'react';
import { TEACHER_ITEMS, sortedIssues, type TeacherItem } from './diagnosis';
import { useFilingRevision, getFilingState, type FilingStatus } from './filing';
import { CURRENT_TASK, type EvalTask } from './eval-tasks';

export const WORK_STATUS: Record<FilingStatus, { label: string; color: string; step: number }> = {
  'not-started': { label: '未开始', color: 'default', step: 0 },
  'in-progress': { label: '填写中', color: 'processing', step: 1 },
  pending: { label: '已提交 · 待审核', color: 'cyan', step: 2 },
  submitted: { label: '已通过', color: 'success', step: 3 },
  supplement: { label: '需修改', color: 'error', step: 1 },
};

export interface MyWork extends TeacherItem {
  status: FilingStatus;
  feedback: string | null; // 审核意见
}

/** 审核反馈:需修改时给出具体意见(来自诊断问题);通过 / 待审核给出简短说明 */
export function feedbackOf(item: TeacherItem, status: FilingStatus): string | null {
  const issue = sortedIssues.find((i) => i.indicatorId === item.indicatorId);
  if (status === 'supplement') return issue ? `${issue.detail} 请${issue.action.replace(/^核心课教师|^任课教师/, '')}` : '材料与达标要求还有差距,请对照要求补充后重新上传。';
  if (status === 'pending') return '已提交,等待专业负责人审核。';
  if (status === 'submitted') return '审核通过。';
  return null;
}

export function useMyWorks(task: EvalTask = CURRENT_TASK): MyWork[] {
  useFilingRevision();
  return TEACHER_ITEMS.map((t) => {
    const status: FilingStatus = task.id === CURRENT_TASK.id ? getFilingState(t.indicatorId).status : 'submitted';
    return { ...t, status, feedback: feedbackOf(t, status) };
  });
}

export const workDone = (w: MyWork) => w.status === 'submitted' || w.status === 'pending';

// ---------- 上传的文件(演示:只记录文件名,保存在本机浏览器) ----------
const KEY = 'teacher_uploads';
const EVT = 'teacher-uploads-change';
type Uploads = Record<string, { name: string; at: string }[]>;

function read(): Uploads {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as Uploads;
  } catch {
    return {};
  }
}
let cacheRaw: string | null = null;
let cacheVal: Uploads = {};
function snapshot(): Uploads {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheVal = read();
  }
  return cacheVal;
}
const EMPTY: Uploads = {};

export function useUploads(): [Uploads, (indicatorId: string, names: string[]) => void] {
  const v = useSyncExternalStore(
    (cb) => {
      addEventListener(EVT, cb);
      return () => removeEventListener(EVT, cb);
    },
    snapshot,
    () => EMPTY,
  );
  const add = (indicatorId: string, names: string[]) => {
    const next = { ...read() };
    const at = new Date().toLocaleString('zh-CN', { hour12: false });
    next[indicatorId] = [...(next[indicatorId] ?? []), ...names.map((name) => ({ name, at }))];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    dispatchEvent(new Event(EVT));
  };
  return [v, add];
}
