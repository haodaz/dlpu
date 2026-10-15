import { NextResponse } from 'next/server';
import mockDb from '@/lib/mockDb.json';
import { normalizeSourceType } from '@/lib/source-type';
import { getDb } from '@/lib/db';
import { guard, denied } from '@/lib/api-guard';

// 数据库不可用时降级到演示数据,但必须显式告诉前端(degraded + 原因),不再静默回落
const degradedReason = (e: unknown) => {
  const detail = String((e as Error)?.message ?? '')
    .split('\n')
    .map((l) => l.trim())
    .find(Boolean)
    ?.slice(0, 120);
  return `数据库不可用,当前显示演示数据${detail ? `(${detail})` : ''}`;
};

export async function POST(req: Request) {
  const caller = await guard(req, 'user');
  if (denied(caller)) return caller;
  try {
    const body = await req.json();
    const { templateCode, rawPayload } = body;
    if (!templateCode) return NextResponse.json({ success: false, error: '缺少 templateCode' }, { status: 400 });
    const sourceType = normalizeSourceType(body.sourceType);

    try {
      const db = await getDb();
      const data = await db.panoramicData.create({
        data: { templateCode, sourceType, rawPayload: JSON.stringify(rawPayload), status: 'PENDING' },
      });
      return NextResponse.json({ success: true, degraded: false, data });
    } catch (dbError) {
      console.warn('[panoramic] 数据库写入失败,本次提交未持久化:', (dbError as Error).message);
      const now = new Date();
      return NextResponse.json({
        success: true,
        degraded: true,
        degradedReason: `${degradedReason(dbError)};本次提交未保存`,
        data: { id: `mock-${now.getTime()}`, templateCode, sourceType, rawPayload: JSON.stringify(rawPayload), status: 'PENDING', createdAt: now, updatedAt: now },
      });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const caller = await guard(req, 'user');
  if (denied(caller)) return caller;
  try {
    const db = await getDb();
    const rows = await db.panoramicData.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ success: true, degraded: false, data: rows.map((r) => ({ ...r, sourceType: normalizeSourceType(r.sourceType) })) });
  } catch (dbError) {
    console.warn('[panoramic] 数据库查询失败,返回演示数据:', (dbError as Error).message);
    return NextResponse.json({
      success: true,
      degraded: true,
      degradedReason: degradedReason(dbError),
      data: (mockDb as { sourceType?: string }[]).map((r) => ({ ...r, sourceType: normalizeSourceType(r.sourceType) })),
    });
  }
}
