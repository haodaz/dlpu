// 学校诊断状态:学校级设置 + 当前评价轮次 + 整改任务 + 历史轮次
//   GET                                     → 全部状态
//   POST {action:'setSetting', key, value}  → 学校级设置(dataImported / viewVisibility),管理员
//   POST {action:'setTaskStatus', issueId, status} → 更新整改任务状态
//   POST {action:'resetTasks'}              → 当前轮次任务全部重置为待处理(演示用),管理员
//   POST {action:'nextCycle', consistency, effectiveness} → 归档本轮、发起下一轮,管理员
import { getDb } from '@/lib/db';
import { activeCycle, startNextCycle } from '@/lib/db/closed-loop';
import { dbUnavailable, bad } from '@/lib/db/respond';
import { guard, denied } from '@/lib/api-guard';

const SETTING_KEYS = ['dataImported', 'viewVisibility', 'customTasks'];
const TASK_STATUS = ['todo', 'doing', 'done'];

async function snapshot() {
  const db = await getDb();
  const cycle = await activeCycle(db);
  const [tasks, settings, history] = await Promise.all([
    db.rectificationTask.findMany({ where: { cycleId: cycle.id }, orderBy: { issueId: 'asc' } }),
    db.appSetting.findMany({ where: { key: { in: SETTING_KEYS } } }),
    db.evaluationCycle.findMany({ where: { status: 'ARCHIVED' }, orderBy: { cycleNo: 'desc' } }),
  ]);
  return {
    success: true,
    degraded: false,
    settings: Object.fromEntries(settings.map((s) => [s.key, JSON.parse(s.value)])),
    cycle,
    tasks,
    history,
  };
}

export async function GET(request: Request) {
  const g = await guard(request, 'user');
  if (denied(g)) return g;
  try {
    return Response.json(await snapshot());
  } catch (e) {
    return dbUnavailable(e);
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.action) return bad('缺少 action');
  const g = await guard(request, body.action === 'setTaskStatus' ? 'user' : 'admin');
  if (denied(g)) return g;

  let db;
  try {
    db = await getDb();
  } catch (e) {
    return dbUnavailable(e);
  }

  switch (body.action) {
    case 'setSetting': {
      if (!SETTING_KEYS.includes(body.key)) return bad(`不支持的设置项 ${body.key}`);
      const value = JSON.stringify(body.value);
      await db.appSetting.upsert({ where: { key: body.key }, update: { value }, create: { key: body.key, value } });
      break;
    }
    case 'setTaskStatus': {
      if (!TASK_STATUS.includes(body.status)) return bad(`非法状态 ${body.status}`);
      const cycle = await activeCycle(db);
      const r = await db.rectificationTask.updateMany({
        where: { cycleId: cycle.id, issueId: String(body.issueId) },
        data: { status: body.status, resolvedAt: body.status === 'done' ? new Date() : null, updatedBy: g.name },
      });
      if (r.count === 0) return bad(`本轮没有整改任务 ${body.issueId}`, 404);
      break;
    }
    case 'resetTasks': {
      const cycle = await activeCycle(db);
      await db.rectificationTask.updateMany({ where: { cycleId: cycle.id }, data: { status: 'todo', resolvedAt: null, updatedBy: g.name } });
      break;
    }
    case 'nextCycle': {
      const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
      await startNextCycle(db, { consistency: num(body.consistency), effectiveness: num(body.effectiveness) });
      break;
    }
    default:
      return bad(`未知 action ${body.action}`);
  }
  return Response.json(await snapshot());
}
