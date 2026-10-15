// 接口鉴权(统一入口)
// 服务器设置 API_REQUIRE_AUTH=true 后生效:登录态来自 zhiji_token(cookie 或 Authorization: Bearer)
// - 'user':需登录;'admin':需管理员(见 auth.ts checkIsAdmin)
// 本地演示无登录体系,不设置即放开(旧变量 INDUSTRY_LOG_REQUIRE_ADMIN=true 同样开启)
import { getToken, checkIsAdmin } from '@/lib/auth';
import { mcpTools } from '@/lib/mcp/generated-tools';

export type GuardLevel = 'user' | 'admin';
export interface Caller {
  name: string | null; // 登录用户名;未开启鉴权时为 null
}

const authEnabled = () => process.env.API_REQUIRE_AUTH === 'true' || process.env.INDUSTRY_LOG_REQUIRE_ADMIN === 'true';

const cache = new Map<string, { name: string | null; admin: boolean; at: number }>();
const TTL = 5 * 60 * 1000;

async function identify(token: string) {
  const hit = cache.get(token);
  if (hit && Date.now() - hit.at < TTL) return hit;
  const me = await mcpTools.userMe(token).catch(() => null);
  const name: string | null = me?.me ? me.me.display_name || me.me.name || '已登录用户' : null;
  const admin = name ? await checkIsAdmin(token).catch(() => false) : false;
  const v = { name, admin, at: Date.now() };
  cache.set(token, v);
  return v;
}

/** 通过返回调用者;不通过返回 401/403 响应 */
export async function guard(request: Request, level: GuardLevel): Promise<Caller | Response> {
  if (!authEnabled()) return { name: null };
  const token = await getToken(request);
  const who = token ? await identify(token) : null;
  if (!who?.name) return Response.json({ success: false, error: '请先登录' }, { status: 401 });
  if (level === 'admin' && !who.admin) return Response.json({ success: false, error: '仅管理员可操作' }, { status: 403 });
  return { name: who.name };
}

export const denied = (r: Caller | Response): r is Response => r instanceof Response;
