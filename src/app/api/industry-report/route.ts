import crypto from 'crypto';
import { runIndustryReport } from '@/lib/industry-report/pipeline';
import { ingestReport } from '@/lib/industry-report/flywheel';
import { getStore } from '@/lib/industry-report/store';
import type { ProgressEvent, ReportInput } from '@/lib/industry-report/types';
import type { RunRecord, RunSummary } from '@/lib/industry-report/runs';

// 产业分析报告生成:SSE 推送每一步进度,最后推送完整报告
// 每次生成都写入检索日志,并把结果沉淀进产业知识库(飞轮)
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Partial<ReportInput> & {
    user?: { role?: string; name?: string };
    entry?: string;
  };
  const input: ReportInput = {
    industry: String(body.industry ?? '').trim(),
    region: String(body.region ?? '').trim() || '全国',
    major: String(body.major ?? '').trim(),
    forceFull: !!body.forceFull,
  };
  if (!input.industry) return Response.json({ error: '缺少产业方向' }, { status: 400 });
  if (!process.env.DASHSCOPE_API_KEY) return Response.json({ error: '未配置 DASHSCOPE_API_KEY' }, { status: 500 });

  const runId = `${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}-${crypto.randomBytes(3).toString('hex')}`;
  const startedAt = new Date().toISOString();
  const user = { role: String(body.user?.role ?? 'unknown'), name: String(body.user?.name ?? '') };
  const entry = String(body.entry ?? 'industry-report');
  const events: ProgressEvent[] = [];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: ProgressEvent) => {
        if (e.type === 'step' || e.type === 'log') events.push(e);
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));
        } catch {
          // 客户端已断开,继续跑完以便写入日志
        }
      };
      const store = getStore();
      let record: RunRecord;
      try {
        const report = { ...(await runIndustryReport(input, emit)), runId };
        record = { id: runId, startedAt, finishedAt: new Date().toISOString(), user, entry, input, status: 'done', events, report };
        await store.put('runs', runId, record);
        await ingestReport(runId, report).catch((err) => console.error('[industry-flywheel] 沉淀失败', err));
        emit({ type: 'result', report });
      } catch (e) {
        record = { id: runId, startedAt, finishedAt: new Date().toISOString(), user, entry, input, status: 'error', error: (e as Error).message, events };
        await store.put('runs', runId, record).catch(() => {});
        emit({ type: 'error', message: (e as Error).message || '生成失败' });
      } finally {
        const r = record!;
        const summary: RunSummary = {
          id: r.id,
          startedAt: r.startedAt,
          durationMs: new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime(),
          user: r.user,
          entry: r.entry,
          input: r.input,
          status: r.status,
          error: r.error,
          mode: r.report?.delta?.mode,
          counts: r.report
            ? {
                policies: r.report.policy.items.length,
                nodes: r.report.chain.nodes.length,
                jobs: r.report.chain.jobs.length,
                sources: r.report.sources.length,
                newItems:
                  (r.report.delta?.newPolicies.length ?? 0) + (r.report.delta?.newNodes.length ?? 0) + (r.report.delta?.newJobs.length ?? 0),
              }
            : undefined,
          cache: r.report?.delta?.cache,
        };
        await store.append('runs-index', summary).catch(() => {});
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
