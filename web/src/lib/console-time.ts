/**
 * console 时间戳补丁：为所有 console 输出统一加上本地时间前缀（含毫秒），
 * 便于定位执行顺序与耗时。服务端（instrumentation）与浏览器端（ConsoleTime 组件）共用。
 * 幂等：重复调用不会二次包装。
 */

let patched = false;

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

/** 格式化本地时间为 YYYY-MM-DD HH:mm:ss.SSS */
export function formatTime(d: Date = new Date()): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`
  );
}

const LEVELS = ["log", "info", "warn", "error", "debug", "trace"] as const;

export function patchConsoleTime(): void {
  if (patched) return;
  patched = true;

  for (const level of LEVELS) {
    const original = (console as unknown as Record<string, unknown>)[level];
    if (typeof original !== "function") continue;
    (console as unknown as Record<string, (...args: unknown[]) => void>)[level] = (...args: unknown[]) => {
      (original as (...a: unknown[]) => void).call(console, `[${formatTime()}]`, ...args);
    };
  }
}
