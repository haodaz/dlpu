// 学校系统数据推送接口(中台:学校系统不改造,只按规范把数据推过来)
// 规范见 docs/data-integration-spec.md
//   POST /api/data-import
//   鉴权:Header `X-Import-Token: <DATA_IMPORT_TOKEN>`;未配置该变量时按管理员登录鉴权(API_REQUIRE_AUTH)
//   Body:{ sourceSystem, templateCode, records: object[], sourceId?, fileName? }
// 结果:合格记录写入全景数据(sourceType=SYSTEM,待确认);无论成败都写一条导入日志
import { getDb } from '@/lib/db';
import { dbUnavailable, bad } from '@/lib/db/respond';
import { guard, denied } from '@/lib/api-guard';
import { templateMapping } from '@/lib/data-management';

const MAX_RECORDS = 5000;

export async function POST(request: Request) {
  const token = process.env.DATA_IMPORT_TOKEN;
  let importedBy: string | null = null;
  if (token) {
    if (request.headers.get('x-import-token') !== token) return bad('导入令牌无效', 401);
    importedBy = '系统推送';
  } else {
    const g = await guard(request, 'admin');
    if (denied(g)) return g;
    importedBy = g.name;
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return bad('请求体必须是 JSON 对象');
  const sourceSystem = String(body.sourceSystem ?? '').trim();
  const templateCode = String(body.templateCode ?? '').trim().toUpperCase();
  if (!sourceSystem) return bad('缺少 sourceSystem(来源系统名称)');
  const importable = Object.keys(templateMapping).filter((k) => /^T\d{2}$/.test(k));
  if (!importable.includes(templateCode)) return bad(`未知模板 ${templateCode},可用:${importable.join(' / ')}`);
  if (!Array.isArray(body.records) || body.records.length === 0) return bad('records 必须是非空数组');
  if (body.records.length > MAX_RECORDS) return bad(`单次最多 ${MAX_RECORDS} 条,请分批推送`);

  const valid: object[] = [];
  const errors: string[] = [];
  body.records.forEach((r: unknown, i: number) => {
    if (r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length > 0) valid.push(r);
    else errors.push(`第 ${i + 1} 条不是非空对象`);
  });

  let db;
  try {
    db = await getDb();
  } catch (e) {
    return dbUnavailable(e, '本次推送未入库,请稍后重试');
  }

  const sourceId = body.sourceId ? String(body.sourceId) : null;
  let dataId: string | null = null;
  if (valid.length) {
    const row = await db.panoramicData.create({
      data: {
        templateCode,
        sourceType: 'SYSTEM',
        rawPayload: JSON.stringify({ sourceSystem, records: valid }),
        status: 'PENDING',
      },
    });
    dataId = row.id;
  }
  const errorDetail = errors.length ? `${errors.length} 条未导入:${errors.slice(0, 5).join(';')}${errors.length > 5 ? ' …' : ''}` : null;
  const log = await db.dataImportLog.create({
    data: {
      sourceType: 'SYSTEM',
      sourceSystem,
      sourceId,
      templateCode,
      fileName: body.fileName ? String(body.fileName) : null,
      rowCount: body.records.length,
      successCount: valid.length,
      errorDetail,
      importedBy,
    },
  });
  if (sourceId) {
    await db.dataSource
      .update({ where: { id: sourceId }, data: { lastSync: new Date(), status: valid.length ? 'online' : 'degraded' } })
      .catch(() => null);
  }

  return Response.json(
    { success: valid.length > 0, logId: log.id, dataId, rowCount: body.records.length, successCount: valid.length, errorDetail },
    { status: valid.length ? 200 : 422 },
  );
}
