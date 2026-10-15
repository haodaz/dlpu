// 指标填报状态机(纯逻辑,前后端共用):类型、展示元信息、合法转换、演示初始状态
import { indicators } from './indicators';

export type FilingMode = 'unselected' | 'direct' | 'ai';

export type FilingStatus =
  | 'not-started' // 未开始
  | 'in-progress' // 进行中
  | 'pending' // 待确认
  | 'submitted' // 已提交
  | 'supplement'; // 需补充

export interface FilingModeMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const filingModeMeta: Record<FilingMode, FilingModeMeta> = {
  unselected: { label: '未选', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  direct: { label: '直接填报', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  ai: { label: 'AI辅助', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
};

export interface FilingStatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const filingStatusMeta: Record<FilingStatus, FilingStatusMeta> = {
  'not-started': { label: '未开始', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  'in-progress': { label: '进行中', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  pending: { label: '待确认', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  submitted: { label: '已提交', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  supplement: { label: '需补充', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

export const filingStatusOrder: FilingStatus[] = [
  'not-started',
  'in-progress',
  'pending',
  'submitted',
  'supplement',
];

export const filingModeOrder: FilingMode[] = ['direct', 'ai'];

export interface FilingState {
  mode: FilingMode;
  status: FilingStatus;
}

// 初始 mock：按指标在标准列表中的顺序确定性派生，刷新后保持一致
const MODE_POOL: FilingMode[] = ['ai', 'direct', 'ai', 'unselected', 'ai', 'direct'];
const STATUS_POOL: FilingStatus[] = [
  'submitted',
  'pending',
  'in-progress',
  'not-started',
  'supplement',
  'in-progress',
];

export function seedState(indicatorId: string): FilingState {
  const idx = indicators.findIndex((i) => i.id === indicatorId);
  const n = idx < 0 ? 0 : idx;
  const ind = idx < 0 ? undefined : indicators[idx];

  // 起点指标（如 1.1.1 产业深度解析）是填报起点，初始为未开始，
  // 避免出现"尚未填报却显示已提交"的矛盾状态。
  if (ind?.tag === '起点指标') return { mode: 'ai', status: 'not-started' };

  const mode = MODE_POOL[n % MODE_POOL.length];
  let status = STATUS_POOL[n % STATUS_POOL.length];
  if (mode === 'unselected') status = 'not-started';
  else if (status === 'not-started') status = 'in-progress';
  return { mode, status };
}

export const WHITEPAPER_PRODUCER_ID = '1.1.1';
export const WHITEPAPER_NAME = '产业白皮书';

export interface WhitepaperReference {
  indicatorId: string;
  usedModule: string; // 该指标引用白皮书的哪一部分
}

// 与各指标自身表述一一对应（非随意指定）：
// 1.1.2 原文"核心课程与产业链节点建立映射" → 产业链图谱
// 1.1.3 原文"追溯到白皮书中的岗位能力项"   → 岗位能力清单
// 1.2.1 原文"引入验证通过的前沿技术来源"   → 产业生命周期与前沿技术
// 1.2.3 原文"选题来自企业真实项目"         → 核心企业清单
// 4.1.1 原文"岗位匹配产业白皮书方向"       → 关键岗位清单
export const WHITEPAPER_REFERENCES: WhitepaperReference[] = [
  { indicatorId: '1.1.2', usedModule: '产业链图谱' },
  { indicatorId: '1.1.3', usedModule: '岗位能力清单' },
  { indicatorId: '1.2.1', usedModule: '产业生命周期与前沿技术' },
  { indicatorId: '1.2.3', usedModule: '核心企业清单' },
  { indicatorId: '4.1.1', usedModule: '关键岗位清单' },
];

export function whitepaperReferenceOf(indicatorId: string): WhitepaperReference | undefined {
  return WHITEPAPER_REFERENCES.find((r) => r.indicatorId === indicatorId);
}


// 合法状态转换(服务端校验):模式切换会重置状态;提交后只能被退回补充或重新编辑
export const FILING_TRANSITIONS: Record<FilingStatus, FilingStatus[]> = {
  'not-started': ['in-progress', 'pending', 'submitted'],
  'in-progress': ['pending', 'submitted', 'not-started'],
  pending: ['submitted', 'in-progress', 'supplement'],
  submitted: ['supplement', 'in-progress'],
  supplement: ['in-progress', 'pending', 'submitted'],
};
export const isFilingMode = (v: unknown): v is FilingMode => v === 'unselected' || v === 'direct' || v === 'ai';
export const isFilingStatus = (v: unknown): v is FilingStatus => typeof v === 'string' && v in FILING_TRANSITIONS;
