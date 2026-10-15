import { getStore } from '@/lib/industry-report/store';
import { markReviewed, deleteKbEntry, type IndustryKb, type KbListName } from '@/lib/industry-report/flywheel';
import type { RunRecord, RunSummary } from '@/lib/industry-report/runs';
import { regionInfo } from '@/lib/industry-report/pingfang';
import { guard, denied } from '@/lib/api-guard';

// 检索记录 / 知识库 / 删除 / 审核回流只对管理员开放(API_REQUIRE_AUTH=true 时生效);地区摘要只含聚合结论,不做限制
async function denyIfNotAdmin(request: Request): Promise<Response | null> {
  const g = await guard(request, 'admin');
  return denied(g) ? g : null;
}

// 产业检索日志(管理员)
//   GET                 → 检索记录列表 + 各产业知识库概况 + 飞轮统计
//   GET ?id=<runId>     → 单次检索完整记录(含报告)
//   GET ?kb=<产业key>   → 某产业知识库明细
//   GET ?latest=<地区>  → 该地区最近一次产业报告摘要
//   POST {runId, chapters} → 专家审核回流
//   DELETE {kb, list, key, region} → 删除知识库错误条目
export async function GET(request: Request) {
  const url = new URL(request.url);
  const store = getStore();

  const latestOnly = url.searchParams.get('latest');
  if (!latestOnly) {
    const denied = await denyIfNotAdmin(request);
    if (denied) return denied;
  }

  const id = url.searchParams.get('id');
  if (id) {
    const run = await store.get<RunRecord>('runs', id);
    return run ? Response.json(run) : Response.json({ error: '记录不存在' }, { status: 404 });
  }

  // 某地区最近一次产业报告的摘要(供宏观决策页使用)
  const latest = url.searchParams.get('latest');
  if (latest) {
    const hit = (await store.readLog<RunSummary>('runs-index'))
      .reverse()
      .find((r) => r.status === 'done' && (r.input.region.includes(latest) || latest.includes(r.input.region)));
    const run = hit ? await store.get<RunRecord>('runs', hit.id) : null;
    if (!run?.report) return Response.json({ found: false });
    const r = run.report;
    const STAGE_ORDER = ['爆发期', '成长期', '萌芽期', '成熟期', '调整期', '数据不足'];
    return Response.json({
      found: true,
      runId: run.id,
      at: run.finishedAt,
      industry: r.industry,
      region: r.region,
      clusters: r.chain.clusters.map((c) => ({ name: c.name, type: c.type })),
      directions: [...r.tech.directions]
        .filter((d) => !d.name.includes('整体'))
        .sort((a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage) || (b.cagr ?? 0) - (a.cagr ?? 0))
        .slice(0, 4)
        .map((d) => ({ name: d.name, stage: d.stage, cagr: d.cagr })),
      policyCount: r.policy.items.length,
      localPolicies: r.policy.items
        .filter((p) => (p.level === '省级' || p.level === '市级') && [regionInfo(r.region).provinceName, regionInfo(r.region).city].some((x) => x && (p.name.includes(x) || p.issuer.includes(x))))
        .slice(0, 3)
        .map((p) => p.name),
      companies: Array.from(new Set(r.chain.nodes.flatMap((n) => n.companies))).slice(0, 8),
    });
  }

  const kbKey = url.searchParams.get('kb');
  if (kbKey) {
    const kb = await store.get<IndustryKb>('kb', kbKey);
    return kb ? Response.json(kb) : Response.json({ error: '知识库不存在' }, { status: 404 });
  }

  const runs = (await store.readLog<RunSummary>('runs-index')).reverse();
  const keys = await store.list('kb');
  const industries = (
    await Promise.all(
      keys.map(async (key) => {
        const kb = await store.get<IndustryKb>('kb', key);
        if (!kb) return null;
        const reviewed = [...kb.policies, ...kb.nodes, ...kb.jobs].filter((e) => e.reviewed).length;
        return {
          key,
          industry: kb.industry,
          runCount: kb.runCount,
          updatedAt: kb.updatedAt,
          regions: Array.from(new Set(kb.stageHistory.map((h) => h.region))),
          counts: { policies: kb.policies.length, nodes: kb.nodes.length, companies: new Set(kb.nodes.flatMap((n) => n.item.companies)).size, jobs: kb.jobs.length, clusters: kb.clusters.length, weak: kb.weak.length },
          reviewed,
        };
      }),
    )
  ).filter(Boolean);

  const done = runs.filter((r) => r.status === 'done');
  const hit = done.reduce((s, r) => s + (r.cache?.searchHit ?? 0) + (r.cache?.openalexHit ?? 0), 0);
  const total = done.reduce((s, r) => s + (r.cache?.searchHit ?? 0) + (r.cache?.searchMiss ?? 0) + (r.cache?.openalexHit ?? 0) + (r.cache?.openalexMiss ?? 0), 0);
  return Response.json({
    runs,
    industries,
    stats: {
      runs: runs.length,
      users: new Set(runs.map((r) => `${r.user.role}:${r.user.name}`)).size,
      industries: industries.length,
      cacheHitRate: total ? Math.round((hit / total) * 100) : null,
      incremental: done.filter((r) => r.mode === 'incremental').length,
    },
  });
}

// DELETE {kb, list, key, region} → 管理员删除知识库中的错误条目
export async function DELETE(request: Request) {
  const denied = await denyIfNotAdmin(request);
  if (denied) return denied;
  const { kb, list, key, region } = (await request.json().catch(() => ({}))) as { kb?: string; list?: KbListName; key?: string; region?: string };
  const lists: KbListName[] = ['directions', 'policies', 'nodes', 'clusters', 'jobs', 'weak'];
  if (!kb || !list || !lists.includes(list) || !key || !region) return Response.json({ error: '参数错误' }, { status: 400 });
  const ok = await deleteKbEntry(kb, list, key, region);
  return ok ? Response.json({ ok: true }) : Response.json({ error: '条目不存在' }, { status: 404 });
}

export async function POST(request: Request) {
  const denied = await denyIfNotAdmin(request);
  if (denied) return denied;
  const { runId, chapters } = (await request.json().catch(() => ({}))) as { runId?: string; chapters?: string[] };
  if (!runId || !Array.isArray(chapters)) return Response.json({ error: '参数错误' }, { status: 400 });
  const store = getStore();
  const run = await store.get<RunRecord>('runs', runId);
  if (!run?.report) return Response.json({ error: '记录不存在' }, { status: 404 });
  run.review = { chapters, at: new Date().toISOString() };
  await store.put('runs', runId, run);
  await markReviewed(runId, run.report.industry, chapters);
  return Response.json({ ok: true });
}
