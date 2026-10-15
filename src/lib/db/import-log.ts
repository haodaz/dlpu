// 数据接入:导入日志 + 异常告警(服务端)
import type { PrismaClient } from '@prisma/client';

export const ALERT_WINDOW_DAYS = 7;

/** 告警:近 7 天内有失败行的导入,以及离线 / 降级的数据源 */
export async function importAlerts(db: PrismaClient) {
  const since = new Date(Date.now() - ALERT_WINDOW_DAYS * 86400_000);
  const [failedLogs, badSources] = await Promise.all([
    db.dataImportLog.findMany({ where: { createdAt: { gte: since }, errorDetail: { not: null } }, orderBy: { createdAt: 'desc' } }),
    db.dataSource.findMany({ where: { status: { in: ['offline', 'degraded'] } } }),
  ]);
  return [
    ...badSources.map((s) => ({
      level: s.status === 'offline' ? ('error' as const) : ('warning' as const),
      title: `${s.name}${s.status === 'offline' ? '离线' : '降级运行'}`,
      detail: `最近同步 ${s.lastSync ? s.lastSync.toISOString() : '无'},请检查接入端点 ${s.endpoint}`,
      sourceId: s.id,
    })),
    ...failedLogs
      .filter((l) => !badSources.some((s) => s.id === l.sourceId))
      .map((l) => ({
        level: l.successCount === 0 ? ('error' as const) : ('warning' as const),
        title: `${l.sourceSystem} 导入 ${l.successCount}/${l.rowCount} 行成功`,
        detail: l.errorDetail ?? '',
        sourceId: l.sourceId,
      })),
  ];
}
