// 指标填报状态机(持久化)
//   GET → 全部指标的填报状态 + 产业白皮书版本
//   POST {action:'mode', indicatorId, mode}
//   POST {action:'status', indicatorId, status}   (按 FILING_TRANSITIONS 校验)
//   POST {action:'refCheck', indicatorId, checked} / {action:'ack', indicatorId}  白皮书引用
import { getDb } from '@/lib/db';
import { dbUnavailable, bad } from '@/lib/db/respond';
import { guard, denied } from '@/lib/api-guard';
import { FILING_TRANSITIONS, WHITEPAPER_PRODUCER_ID, WHITEPAPER_REFERENCES, isFilingMode, isFilingStatus, seedState, whitepaperReferenceOf } from '@/lib/filing-core';
import { indicators } from '@/lib/indicators';
import type { PrismaClient } from '@prisma/client';

const REV_KEY = 'whitepaperRevision';

async function revisionOf(db: PrismaClient): Promise<number> {
  const s = await db.appSetting.findUnique({ where: { key: REV_KEY } });
  return s ? Number(JSON.parse(s.value)) || 0 : 0;
}

async function snapshot(db: PrismaClient) {
  const [records, whitepaperRevision] = await Promise.all([db.filingRecord.findMany(), revisionOf(db)]);
  return { success: true, degraded: false, records, whitepaperRevision };
}

export async function GET(request: Request) {
  const g = await guard(request, 'user');
  if (denied(g)) return g;
  try {
    return Response.json(await snapshot(await getDb()));
  } catch (e) {
    return dbUnavailable(e);
  }
}

export async function POST(request: Request) {
  const g = await guard(request, 'user');
  if (denied(g)) return g;
  const body = await request.json().catch(() => null);
  const indicatorId = String(body?.indicatorId ?? '');
  if (!indicators.some((i) => i.id === indicatorId)) return bad(`未知指标 ${indicatorId}`);

  let db: PrismaClient;
  try {
    db = await getDb();
  } catch (e) {
    return dbUnavailable(e);
  }
  const cur = (await db.filingRecord.findUnique({ where: { indicatorId } })) ?? { indicatorId, ...seedState(indicatorId), refChecked: null, refAckRevision: 0 };
  const save = (data: Partial<typeof cur>) =>
    db.filingRecord.upsert({
      where: { indicatorId },
      update: { ...data, updatedBy: g.name },
      create: { indicatorId, mode: cur.mode, status: cur.status, ...data, updatedBy: g.name },
    });

  switch (body.action) {
    case 'mode': {
      if (!isFilingMode(body.mode)) return bad(`非法模式 ${body.mode}`);
      if (body.mode !== cur.mode) await save({ mode: body.mode, status: body.mode === 'unselected' ? 'not-started' : 'in-progress' });
      break;
    }
    case 'status': {
      if (!isFilingStatus(body.status)) return bad(`非法状态 ${body.status}`);
      if (body.status === cur.status) break;
      if (!FILING_TRANSITIONS[cur.status as keyof typeof FILING_TRANSITIONS]?.includes(body.status)) {
        return bad(`不允许从「${cur.status}」直接变为「${body.status}」`, 409);
      }
      await save({ status: body.status });
      // 产业白皮书每提交一次视为新版本;尚未表态的引用指标对齐到新版本,避免"刚产出就提示已更新"
      if (indicatorId === WHITEPAPER_PRODUCER_ID && body.status === 'submitted') {
        const rev = (await revisionOf(db)) + 1;
        await db.appSetting.upsert({ where: { key: REV_KEY }, update: { value: String(rev) }, create: { key: REV_KEY, value: String(rev) } });
        for (const r of WHITEPAPER_REFERENCES) {
          const rec = await db.filingRecord.findUnique({ where: { indicatorId: r.indicatorId } });
          if (rec && rec.refChecked === null) await db.filingRecord.update({ where: { indicatorId: r.indicatorId }, data: { refAckRevision: rev } });
        }
      }
      break;
    }
    case 'refCheck':
    case 'ack': {
      if (!whitepaperReferenceOf(indicatorId)) return bad(`${indicatorId} 不引用产业白皮书`);
      const rev = await revisionOf(db);
      if (body.action === 'ack') await save({ refAckRevision: rev });
      else await save(body.checked ? { refChecked: true, refAckRevision: rev } : { refChecked: false });
      break;
    }
    default:
      return bad(`未知 action ${body?.action}`);
  }
  return Response.json(await snapshot(db));
}
