// 数据源接入配置(管理员 · 数据上传视角)
//   GET → 数据源 + 导入日志(最近 50 条)+ 异常告警
//   POST {action:'create', name, type, endpoint, indicatorId, frequency}
//   POST {action:'remove', id}  移除(只能移除非正常状态的数据源,导入日志保留)
//   POST {action:'sync', id}  手动触发一次同步(演示:学校系统未接入时模拟拉取,结果照常写入导入日志)
import { getDb } from '@/lib/db';
import { importAlerts } from '@/lib/db/import-log';
import { dbUnavailable, bad } from '@/lib/db/respond';
import { guard, denied } from '@/lib/api-guard';
import { indicators } from '@/lib/indicators';
import type { PrismaClient } from '@prisma/client';

const TYPES = ['rest', 'database', 'file', 'webhooks'];
const FREQ: Record<string, string> = { hourly: '每小时', daily: '每日', weekly: '每周', manual: '手动' };

async function snapshot(db: PrismaClient) {
  const [sources, logs, alerts] = await Promise.all([
    db.dataSource.findMany({ orderBy: { id: 'asc' } }),
    db.dataImportLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    importAlerts(db),
  ]);
  return { success: true, degraded: false, sources, logs, alerts };
}

export async function GET(request: Request) {
  const g = await guard(request, 'admin');
  if (denied(g)) return g;
  try {
    return Response.json(await snapshot(await getDb()));
  } catch (e) {
    return dbUnavailable(e);
  }
}

export async function POST(request: Request) {
  const g = await guard(request, 'admin');
  if (denied(g)) return g;
  const body = await request.json().catch(() => null);
  let db: PrismaClient;
  try {
    db = await getDb();
  } catch (e) {
    return dbUnavailable(e);
  }

  if (body?.action === 'create') {
    const name = String(body.name ?? '').trim();
    const endpoint = String(body.endpoint ?? '').trim();
    if (!name || !endpoint) return bad('名称和接入端点必填');
    if (!TYPES.includes(body.type)) return bad(`不支持的类型 ${body.type}`);
    if (!indicators.some((i) => i.id === body.indicatorId)) return bad(`未知指标 ${body.indicatorId}`);
    const n = (await db.dataSource.count()) + 1;
    let id = `DS-${String(n).padStart(2, '0')}`;
    while (await db.dataSource.findUnique({ where: { id } })) id = `DS-${String(Number(id.slice(3)) + 1).padStart(2, '0')}`;
    await db.dataSource.create({
      data: { id, name, type: body.type, endpoint, indicatorId: body.indicatorId, frequency: FREQ[body.frequency] ?? '手动', status: 'online' },
    });
    return Response.json({ ...(await snapshot(db)), createdId: id });
  }

  if (body?.action === 'remove') {
    const src = await db.dataSource.findUnique({ where: { id: String(body.id) } });
    if (!src) return bad(`数据源不存在 ${body.id}`, 404);
    if (src.status === 'online') return bad('正常运行中的数据源不能直接移除,请先停用', 409);
    await db.dataSource.delete({ where: { id: src.id } });
    return Response.json(await snapshot(db));
  }

  if (body?.action === 'sync') {
    const src = await db.dataSource.findUnique({ where: { id: String(body.id) } });
    if (!src) return bad(`数据源不存在 ${body.id}`, 404);
    const ok = src.status !== 'offline';
    const rows = ok ? 200 + src.name.length * 37 : 0;
    await db.dataImportLog.create({
      data: {
        sourceType: 'SYSTEM',
        sourceSystem: src.name,
        sourceId: src.id,
        rowCount: rows,
        successCount: rows,
        errorDetail: ok ? null : '连接失败,请检查接入端点',
        importedBy: g.name ?? '手动同步',
      },
    });
    await db.dataSource.update({ where: { id: src.id }, data: { lastSync: new Date(), status: ok ? 'online' : 'offline' } });
    return Response.json({ ...(await snapshot(db)), synced: ok });
  }

  return bad(`未知 action ${body?.action}`);
}
