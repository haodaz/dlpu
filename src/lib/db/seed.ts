// 空库时写入演示数据(学校内部数据均为演示数据);只在对应表为空时执行,不覆盖已有记录
import type { PrismaClient } from '@prisma/client';
import mockDb from '@/lib/mockDb.json';
import { normalizeSourceType } from '@/lib/source-type';
import { indicators } from '@/lib/indicators';
import { seedState } from '@/lib/filing-core';
import { DATA_SOURCE_SEED, IMPORT_LOG_SEED, LEGACY_SOURCE_NAMES } from '@/lib/data-sources';
import { activeCycle } from './closed-loop';

type MockRow = { id: string; templateCode: string; sourceType?: string; rawPayload: string; status?: string; createdAt?: string };

export async function seedDatabase(db: PrismaClient) {
  if ((await db.panoramicData.count()) === 0) {
    await db.panoramicData.createMany({
      data: (mockDb as MockRow[]).map((r) => ({
        id: r.id,
        templateCode: r.templateCode,
        sourceType: normalizeSourceType(r.sourceType),
        rawPayload: typeof r.rawPayload === 'string' ? r.rawPayload : JSON.stringify(r.rawPayload),
        status: r.status ?? 'PENDING',
        createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      })),
    });
  }

  if ((await db.filingRecord.count()) === 0) {
    await db.filingRecord.createMany({ data: indicators.map((i) => ({ indicatorId: i.id, ...seedState(i.id) })) });
  }

  // 旧版演示数据源(含企业工商信息等外部数据)整体替换为学校系统清单
  const legacy = !!(await db.dataSource.findFirst({ where: { name: '企业工商信息' } }));
  if (legacy) {
    await db.dataSource.deleteMany({ where: { name: { in: LEGACY_SOURCE_NAMES } } });
    await db.dataImportLog.deleteMany({ where: { sourceSystem: { in: LEGACY_SOURCE_NAMES } } });
  }

  if (legacy || (await db.dataSource.count()) === 0) {
    const taken = new Set((await db.dataSource.findMany({ select: { id: true } })).map((d) => d.id));
    await db.dataSource.createMany({ data: DATA_SOURCE_SEED.filter((d) => !taken.has(d.id)).map((d) => ({ ...d, lastSync: new Date(d.lastSync) })) });
    await db.dataImportLog.createMany({
      data: IMPORT_LOG_SEED.map((l) => ({ ...l, sourceType: 'SYSTEM', createdAt: new Date(l.createdAt) })),
    });
  }

  await activeCycle(db); // 没有轮次时创建第 1 轮及其整改任务
}
