// 数据接入:导入日志 + 异常告警(服务端)
import type { PrismaClient } from '@prisma/client';

export const ALERT_WINDOW_DAYS = 7;

// 告警文案里的时间按北京时间显示,如 2026-09-16 03:00
const cnTime = (d: Date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d);

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
      detail: `最近同步 ${s.lastSync ? cnTime(s.lastSync) : '无'},请检查接入端点 ${s.endpoint}`,
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
