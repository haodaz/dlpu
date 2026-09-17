// 指标填报 — 填报模式与填报状态
// 说明：本模块只保存"内存态"，刷新页面后重置为初始 mock。
import { useSyncExternalStore } from 'react';
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

function seedState(indicatorId: string): FilingState {
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

const store = new Map<string, FilingState>();
const listeners = new Set<() => void>();
let revision = 0;

function ensure(indicatorId: string): FilingState {
  let state = store.get(indicatorId);
  if (!state) {
    state = seedState(indicatorId);
    store.set(indicatorId, state);
  }
  return state;
}

function emit() {
  revision += 1;
  listeners.forEach((l) => l());
}

export function getFilingState(indicatorId: string): FilingState {
  return ensure(indicatorId);
}

export function setFilingMode(indicatorId: string, mode: FilingMode): void {
  const current = ensure(indicatorId);
  if (current.mode === mode) return;
  const status: FilingStatus = mode === 'unselected' ? 'not-started' : 'in-progress';
  store.set(indicatorId, { mode, status });
  emit();
}

export function setFilingStatus(indicatorId: string, status: FilingStatus): void {
  const current = ensure(indicatorId);
  if (current.status === status) return;
  store.set(indicatorId, { ...current, status });
  // 白皮书产出/更新：1.1.1 每次提交都视为一次新版本
  if (indicatorId === WHITEPAPER_PRODUCER_ID && status === 'submitted') {
    whitepaperRevision += 1;
    // 尚未表态的引用指标对齐到当前版本，避免"刚产出就提示已更新"
    WHITEPAPER_REFERENCES.forEach((r) => {
      if (!ackStore.has(r.indicatorId)) ackStore.set(r.indicatorId, whitepaperRevision);
    });
  }
  emit();
}

export function subscribeFiling(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// 单个指标的填报状态（订阅式，跨页面共享）
export function useFilingState(indicatorId: string): FilingState {
  return useSyncExternalStore(
    subscribeFiling,
    () => ensure(indicatorId),
    () => ensure(indicatorId),
  );
}

// 全局版本号：任一指标状态变化都会触发重渲染（供列表页读取全部指标）
export function useFilingRevision(): number {
  return useSyncExternalStore(
    subscribeFiling,
    () => revision,
    () => revision,
  );
}

// ---------- 产业白皮书：跨指标引用 ----------
// 原则：不强制、不锁定、只引导。白皮书是"可用资源"，不是前置门槛；
// 所有指标平级，谁都能先填，只是填的时候可以把 1.1.1 的产出勾进来当输入。

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

const referenceStore = new Map<string, boolean>(); // 用户显式的勾选/取消
const ackStore = new Map<string, number>(); // 用户已确认引用的白皮书版本
let whitepaperRevision = 0; // 白皮书每产出一版 +1

function isProducerSubmitted(): boolean {
  return getFilingState(WHITEPAPER_PRODUCER_ID).status === 'submitted';
}

export function setReferenceChecked(indicatorId: string, checked: boolean): void {
  referenceStore.set(indicatorId, checked);
  if (checked) ackStore.set(indicatorId, whitepaperRevision);
  emit();
}

export function acknowledgeWhitepaper(indicatorId: string): void {
  ackStore.set(indicatorId, whitepaperRevision);
  emit();
}

export interface WhitepaperRefState {
  available: boolean; // 白皮书是否已完成（1.1.1 已提交）
  checked: boolean; // 引用区勾选状态（默认跟随 available）
  stale: boolean; // 白皮书在引用之后又更新过
}

export function getWhitepaperRefState(indicatorId: string): WhitepaperRefState {
  const available = isProducerSubmitted();
  // 非引用指标不参与白皮书引用
  if (!whitepaperReferenceOf(indicatorId)) return { available, checked: false, stale: false };
  const checked = referenceStore.get(indicatorId) ?? available;
  const ack = ackStore.get(indicatorId) ?? 0;
  return { available, checked, stale: checked && available && whitepaperRevision > ack };
}

export function useWhitepaperRef(indicatorId: string): WhitepaperRefState {
  useFilingRevision();
  return getWhitepaperRefState(indicatorId);
}