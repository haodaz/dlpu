// 指标填报 — 填报模式与填报状态
// 状态存数据库(/api/filing,服务端按 FILING_TRANSITIONS 校验状态转换);数据库不可用时退回本机暂存
// 类型、展示元信息与状态机定义在 filing-core.ts(前后端共用)
import { createSyncedStore } from './synced-store';
import {
  seedState,
  whitepaperReferenceOf,
  WHITEPAPER_PRODUCER_ID,
  WHITEPAPER_REFERENCES,
  type FilingMode,
  type FilingState,
  type FilingStatus,
} from './filing-core';

export * from './filing-core';

interface FilingRow {
  indicatorId: string;
  mode: FilingMode;
  status: FilingStatus;
  refChecked: boolean | null;
  refAckRevision: number;
}
interface FilingData {
  records: FilingRow[];
  whitepaperRevision: number;
}

const store = createSyncedStore<FilingData>('filing', '/api/filing', { records: [], whitepaperRevision: 0 });

// useSyncExternalStore 要求同一份数据返回同一个对象:按数据版本缓存每个指标的状态
let cachedFor: FilingData | null = null;
let cache = new Map<string, FilingRow>();
let revision = 0;
function rowOf(indicatorId: string): FilingRow {
  const data = store.get().data;
  if (data !== cachedFor) {
    cachedFor = data;
    cache = new Map(data.records.map((r) => [r.indicatorId, r]));
    revision += 1;
  }
  let row = cache.get(indicatorId);
  if (!row) {
    row = { indicatorId, ...seedState(indicatorId), refChecked: null, refAckRevision: 0 };
    cache.set(indicatorId, row);
  }
  return row;
}

const patchRow = (d: FilingData, indicatorId: string, patch: Partial<FilingRow>): FilingData => {
  const cur = d.records.find((r) => r.indicatorId === indicatorId) ?? rowOf(indicatorId);
  return { ...d, records: [...d.records.filter((r) => r.indicatorId !== indicatorId), { ...cur, ...patch }] };
};

export function getFilingState(indicatorId: string): FilingState {
  return rowOf(indicatorId);
}

export function setFilingMode(indicatorId: string, mode: FilingMode): void {
  if (rowOf(indicatorId).mode === mode) return;
  const status: FilingStatus = mode === 'unselected' ? 'not-started' : 'in-progress';
  void store.mutate({ action: 'mode', indicatorId, mode }, (d) => patchRow(d, indicatorId, { mode, status }));
}

export function setFilingStatus(indicatorId: string, status: FilingStatus): void {
  if (rowOf(indicatorId).status === status) return;
  void store.mutate({ action: 'status', indicatorId, status }, (d) => {
    let next = patchRow(d, indicatorId, { status });
    // 白皮书产出/更新:1.1.1 每次提交都视为一次新版本(服务端同样处理,这里只是本地先行)
    if (indicatorId === WHITEPAPER_PRODUCER_ID && status === 'submitted') {
      const rev = next.whitepaperRevision + 1;
      next = { ...next, whitepaperRevision: rev };
      WHITEPAPER_REFERENCES.forEach((r) => {
        if (rowOf(r.indicatorId).refChecked === null) next = patchRow(next, r.indicatorId, { refAckRevision: rev });
      });
    }
    return next;
  });
}

export const subscribeFiling = store.subscribe;

// 单个指标的填报状态(订阅式,跨页面共享)
export function useFilingState(indicatorId: string): FilingState {
  store.use();
  return rowOf(indicatorId);
}

// 全局版本号:任一指标状态变化都会触发重渲染(供列表页读取全部指标)
export function useFilingRevision(): number {
  store.use();
  rowOf(WHITEPAPER_PRODUCER_ID);
  return revision;
}

// ---------- 产业白皮书:跨指标引用 ----------
// 原则:不强制、不锁定、只引导。白皮书是"可用资源",不是前置门槛;
// 所有指标平级,谁都能先填,只是填的时候可以把 1.1.1 的产出勾进来当输入。

export function setReferenceChecked(indicatorId: string, checked: boolean): void {
  void store.mutate({ action: 'refCheck', indicatorId, checked }, (d) =>
    patchRow(d, indicatorId, checked ? { refChecked: true, refAckRevision: d.whitepaperRevision } : { refChecked: false }),
  );
}

export function acknowledgeWhitepaper(indicatorId: string): void {
  void store.mutate({ action: 'ack', indicatorId }, (d) => patchRow(d, indicatorId, { refAckRevision: d.whitepaperRevision }));
}

export interface WhitepaperRefState {
  available: boolean; // 白皮书是否已完成(1.1.1 已提交)
  checked: boolean; // 引用区勾选状态(默认跟随 available)
  stale: boolean; // 白皮书在引用之后又更新过
}

export function getWhitepaperRefState(indicatorId: string): WhitepaperRefState {
  const available = rowOf(WHITEPAPER_PRODUCER_ID).status === 'submitted';
  // 非引用指标不参与白皮书引用
  if (!whitepaperReferenceOf(indicatorId)) return { available, checked: false, stale: false };
  const row = rowOf(indicatorId);
  const checked = row.refChecked ?? available;
  return { available, checked, stale: checked && available && store.get().data.whitepaperRevision > row.refAckRevision };
}

export function useWhitepaperRef(indicatorId: string): WhitepaperRefState {
  useFilingRevision();
  return getWhitepaperRefState(indicatorId);
}
