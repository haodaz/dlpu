// API 通用:数据库不可用时显式返回 degraded(503),前端据此提示并退回本地暂存
export function dbUnavailable(e: unknown, what = '改动暂存在本机浏览器') {
  const detail = String((e as Error)?.message ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean)
    ?.slice(0, 120);
  console.warn('[db] 数据库不可用:', detail);
  return Response.json(
    { success: false, degraded: true, degradedReason: `数据库不可用,${what}${detail ? `(${detail})` : ''}` },
    { status: 503 },
  );
}

export const bad = (error: string, status = 400) => Response.json({ success: false, error }, { status });
