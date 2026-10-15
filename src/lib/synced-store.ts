// 与服务端数据库同步的前端状态(取代 localStorage / 内存 Map)
// - 首次订阅时从 API 读取;写操作先本地乐观更新,再按顺序提交,以服务端返回为准
// - 数据库不可用(503 degraded)时退回本机浏览器暂存,并通过 degraded / reason 显式告知页面
import { useSyncExternalStore } from 'react';

export interface SyncedState<T> {
  data: T;
  ready: boolean; // 已读到服务端或本机暂存
  degraded: boolean;
  reason: string | null;
}

export interface SyncedStore<T> {
  use(): SyncedState<T>;
  get(): SyncedState<T>;
  subscribe(cb: () => void): () => void;
  /** optimistic:本地立即生效的变换;body:提交给 API 的请求体 */
  mutate(body: unknown, optimistic: (d: T) => T): Promise<void>;
}

const degradedStores = new Set<string>();
const degradedListeners = new Set<() => void>();
let degradedReason: string | null = null;
function setDegraded(name: string, reason: string | null) {
  if (reason) {
    degradedStores.add(name);
    degradedReason = reason;
  } else degradedStores.delete(name);
  if (!degradedStores.size) degradedReason = null;
  degradedListeners.forEach((l) => l());
}

/** 任一同步状态降级时返回原因(供全局提示条使用) */
export function useDegradedReason(): string | null {
  return useSyncExternalStore(
    (cb) => {
      degradedListeners.add(cb);
      return () => {
        degradedListeners.delete(cb);
      };
    },
    () => degradedReason,
    () => null,
  );
}

export function createSyncedStore<T>(name: string, url: string, initial: T): SyncedStore<T> {
  const cacheKey = `synced:${name}`;
  const serverSnapshot: SyncedState<T> = { data: initial, ready: false, degraded: false, reason: null };
  let state = serverSnapshot;
  let loaded = false;
  let queue: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  const set = (next: Partial<SyncedState<T>>) => {
    state = { ...state, ...next };
    if (next.data !== undefined) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(state.data));
      } catch {
        // 隐私模式等:仅本次会话生效
      }
    }
    listeners.forEach((l) => l());
  };

  const readCache = (): T => {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  };

  const fallBack = (reason: string) => {
    setDegraded(name, reason);
    set({ data: state.ready ? state.data : readCache(), ready: true, degraded: true, reason });
  };

  const accept = async (res: Response) => {
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success !== false) {
      setDegraded(name, null);
      const data = { ...(json ?? {}) };
      delete data.success;
      delete data.degraded;
      set({ data: data as T, ready: true, degraded: false, reason: null });
      return null;
    }
    if (json?.degraded) {
      fallBack(json.degradedReason ?? '数据库不可用');
      return null;
    }
    return (json?.error as string) ?? `请求失败 ${res.status}`;
  };

  const load = async () => {
    try {
      const err = await accept(await fetch(url, { cache: 'no-store' }));
      if (err) fallBack(err);
    } catch {
      fallBack('无法连接服务器,改动暂存在本机浏览器');
    }
  };

  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    if (!loaded && typeof window !== 'undefined') {
      loaded = true;
      void load();
    }
    return () => {
      listeners.delete(cb);
    };
  };
  const getState = () => state;
  const getServerState = () => serverSnapshot;

  return {
    get: getState,
    subscribe,
    use: () => useSyncExternalStore(subscribe, getState, getServerState),
    mutate(body, optimistic) {
      set({ data: optimistic(state.data) });
      queue = queue.then(async () => {
        if (state.degraded) return; // 降级期间只改本机暂存
        try {
          const err = await accept(
            await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
          );
          if (err) {
            console.warn(`[${name}] 提交被拒绝:`, err);
            await load(); // 回到服务端真实状态
          }
        } catch {
          fallBack('无法连接服务器,改动暂存在本机浏览器');
        }
      });
      return queue;
    },
  };
}
