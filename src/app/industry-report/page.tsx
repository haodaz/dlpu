'use client';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Checkbox, Table, Tag, Empty, Tooltip } from 'antd';
import { ExperimentOutlined, PlusOutlined, ArrowLeftOutlined, EyeOutlined, HistoryOutlined, DatabaseOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { IndustryReport } from '@/lib/industry-report/types';
import type { RunSummary } from '@/lib/industry-report/runs';
import { ReportView, readJSON, writeJSON } from '@/components/industry-report/ReportView';
import { Progress, useReportGenerator } from '@/components/industry-report/Generator';

// AI-native 产业分析报告
// 进入先看报告列表(同产业同地区合并,可展开历史版本);?new=1 新建,?run= 查看某次生成的报告
// 可解释:数值由公开数据按公式计算;大模型只做检索式拆分、信息抽取与解读,且解读中的数字由程序逐个校验
// 飞轮:先查检索日志与知识库,有历史时只检索变化;所有生成都记入产业检索日志

const STORE_KEY = 'industry_report_last';
// 可生成报告的产业数(学校版 / 院系版的配额,演示值;在「用户与权限」中设置)
const INDUSTRY_QUOTA = 10;

export default function IndustryReportPage() {
  return (
    <Suspense fallback={null}>
      <IndustryReportContent />
    </Suspense>
  );
}

function IndustryReportContent() {
  const params = useSearchParams();
  const runParam = params.get('run');
  const creating = params.get('new') === '1' || !!params.get('industry');
  if (runParam) return <RunReport runId={runParam} />;
  if (creating) return <CreateReport />;
  return <ReportList />;
}

function PageHead({ title, desc, extra }: { title: string; desc: string; extra?: React.ReactNode }) {
  return (
    <div className="no-print flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-sm shrink-0">
          <ExperimentOutlined />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">{title}</h1>
          <p className="text-sm text-slate-500 m-0 mt-0.5">{desc}</p>
        </div>
      </div>
      {extra}
    </div>
  );
}

// ---------- 报告列表 ----------
interface Group {
  key: string;
  industry: string;
  region: string;
  latest: RunSummary;
  history: RunSummary[];
}

const fmtTime = (s: string) => new Date(s).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const ROLE_LABEL: Record<string, string> = { admin: '管理员', user: '教师' };
const who = (u: RunSummary['user']) => (u.role in ROLE_LABEL ? `${ROLE_LABEL[u.role]}${u.name ? ` · ${u.name}` : ''}` : '演示用户');

function ReportList() {
  const router = useRouter();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/industry-log');
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? '需要管理员登录后查看' : `加载失败(${r.status})`);
      setRuns(((await r.json()).runs ?? []) as RunSummary[]);
    } catch (e) {
      setErr((e as Error).message);
      setRuns([]);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // 同产业 + 同地区合并为一份报告,最新一次在前,其余为历史版本
  const groups = useMemo(() => {
    const map = new Map<string, Group>();
    for (const r of (runs ?? []).filter((x) => x.status === 'done')) {
      const key = `${r.input.industry}|${r.input.region}`;
      const g = map.get(key);
      if (!g) map.set(key, { key, industry: r.input.industry, region: r.input.region, latest: r, history: [] });
      else g.history.push(r);
    }
    return [...map.values()];
  }, [runs]);
  const industries = new Set(groups.map((g) => g.industry)).size;

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <PageHead
        title="产业分析报告"
        desc="按产业与地区生成研究报告:产业分析 · 产业链图谱 · 人才需求三章;同一产业再次生成只检索变化,历史版本都保留"
        extra={
          <div className="flex gap-2">
            <Link href="/admin/industry-log">
              <Button icon={<DatabaseOutlined />}>检索日志</Button>
            </Link>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/industry-report?new=1')}>
              新建报告
            </Button>
          </div>
        }
      />
      <div data-spec="ir-list-stats" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <Stat label="报告数" value={groups.length} hint="同产业同地区合并为一份" />
        <Stat label="累计生成次数" value={(runs ?? []).filter((r) => r.status === 'done').length} />
        <Stat label="已用产业配额" value={`${industries} / ${INDUSTRY_QUOTA}`} hint="可生成报告的产业数,按购买版本设定" />
        <Stat label="最近生成" value={groups[0] ? fmtTime(groups[0].latest.startedAt).slice(5) : '—'} />
      </div>
      <div data-spec="ir-list" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        {err && <div className="text-sm text-amber-600 mb-3">{err}</div>}
        <Table<Group>
          rowKey="key"
          loading={runs === null}
          dataSource={groups}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 1040 }}
          locale={{ emptyText: <Empty description="还没有生成过产业分析报告" /> }}
          expandable={{
            rowExpandable: (g) => g.history.length > 0,
            expandedRowRender: (g) => (
              <div className="space-y-1.5 py-1">
                {g.history.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-sm">
                    <HistoryOutlined className="text-slate-400" />
                    <span className="text-slate-600">{fmtTime(h.startedAt)}</span>
                    <span className="text-slate-400">
                      {who(h.user)} · {h.mode === 'incremental' ? '增量检索' : '全量检索'}
                    </span>
                    <Link href={`/industry-report?run=${h.id}`} className="ml-auto">
                      查看此版本
                    </Link>
                  </div>
                ))}
              </div>
            ),
          }}
          columns={[
            {
              title: '报告',
              key: 'title',
              fixed: 'left',
              width: 240,
              render: (_, g) => (
                <Link href={`/industry-report?run=${g.latest.id}`} className="font-semibold">
                  {g.region}
                  {g.industry}产业分析报告
                </Link>
              ),
            },
            { title: '服务专业', key: 'major', width: 140, render: (_, g) => g.latest.input.major || '—' },
            { title: '最近生成', key: 'at', width: 150, render: (_, g) => fmtTime(g.latest.startedAt) },
            { title: '生成人', key: 'user', width: 140, render: (_, g) => who(g.latest.user) },
            {
              title: '版本',
              key: 'ver',
              width: 90,
              render: (_, g) => (g.history.length ? <Tag color="blue">{g.history.length + 1} 个版本</Tag> : <Tag>首版</Tag>),
            },
            { title: '引用来源', key: 'src', width: 90, render: (_, g) => g.latest.counts?.sources ?? '—' },
            {
              title: '',
              key: 'op',
              width: 170,
              render: (_, g) => (
                <div className="flex gap-1">
                  <Link href={`/industry-report?run=${g.latest.id}`}>
                    <Button size="small" type="link" icon={<EyeOutlined />}>
                      查看
                    </Button>
                  </Link>
                  <Tooltip title="再次生成只检索上次之后的变化">
                    <Link href={`/industry-report?new=1&industry=${encodeURIComponent(g.industry)}&region=${encodeURIComponent(g.region)}&major=${encodeURIComponent(g.latest.input.major)}`}>
                      <Button size="small" type="link">
                        更新报告
                      </Button>
                    </Link>
                  </Tooltip>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl bg-white border border-slate-200 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-800 mt-0.5">{value}</div>
      {hint && <div className="text-[11px] text-slate-400 mt-0.5">{hint}</div>}
    </div>
  );
}

const BackLink = () => (
  <Link href="/industry-report" className="no-print inline-flex items-center gap-1 text-sm text-slate-500 mb-3">
    <ArrowLeftOutlined /> 报告列表
  </Link>
);

// ---------- 查看某次生成的报告 ----------
function RunReport({ runId }: { runId: string }) {
  const [report, setReport] = useState<IndustryReport | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    fetch(`/api/industry-log?id=${encodeURIComponent(runId)}`)
      .then((r) => r.json())
      .then((run) => (run.report ? setReport({ ...run.report, runId }) : setErr(run.error || '该次检索没有生成报告')))
      .catch(() => setErr('加载失败'));
  }, [runId]);
  return (
    <div className="max-w-6xl mx-auto pb-16">
      <BackLink />
      {err && <div className="text-sm text-red-500 mb-4">{err}</div>}
      {!report && !err && <div className="text-sm text-slate-400">加载中…</div>}
      {report && <ReportView report={report} />}
    </div>
  );
}

// ---------- 新建报告 ----------
function CreateReport() {
  const params = useSearchParams();
  const [industry, setIndustry] = useState(params.get('industry') ?? '智能制造');
  const [region, setRegion] = useState(params.get('region') ?? '辽宁省大连市');
  const [major, setMajor] = useState(params.get('major') ?? '智能制造工程');
  const [forceFull, setForceFull] = useState(false);
  const [report, setReport] = useState<IndustryReport | null>(null);
  const { running, steps, logs, error, generate } = useReportGenerator();

  // 演示时避免重复等待:先展示本机上次生成的同产业报告
  useEffect(() => {
    const last = readJSON<IndustryReport>(STORE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last && last.industry === industry && last.region === region) setReport(last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async () => {
    const r = await generate({ industry, region, major, forceFull }, 'industry-report');
    if (r) {
      setReport(r);
      writeJSON(STORE_KEY, r);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <BackLink />
      <PageHead title="新建产业分析报告" desc="研究报告体例 · 数值来自公开数据并按公式计算或从原文逐字抽取 · 每条结论都能追溯来源 · 可下载 PDF / Word" />
      <div data-spec="ir-form" className="no-print rounded-2xl bg-white border border-slate-200 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <Field label="产业方向">
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={running} />
          </Field>
          <Field label="区域">
            <Input value={region} onChange={(e) => setRegion(e.target.value)} disabled={running} />
          </Field>
          <Field label="服务专业">
            <Input value={major} onChange={(e) => setMajor(e.target.value)} disabled={running} />
          </Field>
          <Button type="primary" size="large" loading={running} disabled={!industry.trim()} onClick={run}>
            {report ? '重新生成' : '生成报告'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <p className="text-xs text-slate-400 m-0">
            先查历史检索沉淀,有历史时只检索变化;政策、产业集群、企业介绍、职业介绍与薪资优先取平方数据,论文统计来自 OpenAlex,其余来自阿里云联网检索(已过滤题库、文库、问答类低质量来源)。
          </p>
          <Checkbox checked={forceFull} onChange={(e) => setForceFull(e.target.checked)} disabled={running}>
            <span className="text-xs text-slate-500">忽略历史,全量检索</span>
          </Checkbox>
        </div>
      </div>

      {(running || error) && <Progress steps={steps} logs={logs} error={error} running={running} />}
      {report && !running && <ReportView report={report} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
