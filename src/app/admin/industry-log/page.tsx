'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Button, Table, Tag, Tabs, Segmented, Empty, Tooltip, Popconfirm } from 'antd';
import { ReloadOutlined, DatabaseOutlined, EyeOutlined, CheckCircleFilled, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { RunSummary } from '@/lib/industry-report/runs';
import type { IndustryKb, KbEntry } from '@/lib/industry-report/flywheel';

// 产业检索日志(管理员):所有用户生成过的产业报告 + 按产业沉淀的知识库
// 知识库越积越全:后续检索先查这里,只检索变化,并把历史条目补回报告

interface IndustrySummary {
  key: string;
  industry: string;
  runCount: number;
  updatedAt: string;
  regions: string[];
  counts: { policies: number; nodes: number; companies: number; jobs: number; clusters: number; weak: number };
  reviewed: number;
}

interface LogData {
  runs: RunSummary[];
  industries: IndustrySummary[];
  stats: { runs: number; users: number; industries: number; cacheHitRate: number | null; incremental: number };
}

const ENTRY_LABEL: Record<string, string> = { 'industry-report': '产业分析报告', whitepaper: '教师 · 产业白皮书' };
const ROLE_LABEL: Record<string, string> = { admin: '管理员', user: '教师' };
const fmtTime = (s: string) => new Date(s).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function IndustryLogPage() {
  const router = useRouter();
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [kbKey, setKbKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await (await fetch('/api/industry-log')).json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const s = data?.stats;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-slate-800 flex items-center justify-center text-white text-xl shadow-sm">
            <DatabaseOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">产业检索日志</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">所有用户的产业检索都会记录并沉淀进知识库,后续检索先查历史、只搜变化,越搜越全</p>
          </div>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>
          刷新
        </Button>
      </div>

      <div data-spec="log-stats" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="检索次数" value={s?.runs} />
        <Stat label="使用人数" value={s?.users} />
        <Stat label="已沉淀产业" value={s?.industries} />
        <Stat label="增量检索" value={s?.incremental} hint="复用历史、只检索变化的次数" />
        <Stat label="缓存命中率" value={s?.cacheHitRate === null || s?.cacheHitRate === undefined ? '—' : `${s.cacheHitRate}%`} hint="检索与论文统计命中缓存的比例" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <Tabs
          items={[
            {
              key: 'runs',
              label: `检索记录(${data?.runs.length ?? 0})`,
              children: (
                <div data-spec="log-runs">
                <Table
                  size="middle"
                  rowKey="id"
                  loading={loading}
                  dataSource={data?.runs ?? []}
                  pagination={{ pageSize: 15 }}
                  scroll={{ x: 1100 }}
                  locale={{ emptyText: <Empty description="还没有检索记录" /> }}
                  columns={[
                    { title: '时间', dataIndex: 'startedAt', width: 120, render: fmtTime },
                    {
                      title: '用户 / 入口',
                      width: 170,
                      render: (_: unknown, r: RunSummary) => (
                        <div>
                          <div className="text-sm text-slate-700">
                            {ROLE_LABEL[r.user.role] ?? r.user.role}
                            {r.user.name ? ` · ${r.user.name}` : ''}
                          </div>
                          <div className="text-xs text-slate-400">{ENTRY_LABEL[r.entry] ?? r.entry}</div>
                        </div>
                      ),
                    },
                    {
                      title: '产业 / 区域 / 专业',
                      render: (_: unknown, r: RunSummary) => (
                        <div>
                          <div className="font-bold text-slate-700">{r.input.industry}</div>
                          <div className="text-xs text-slate-400">
                            {r.input.region}
                            {r.input.major ? ` · ${r.input.major}` : ''}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: '模式',
                      width: 90,
                      render: (_: unknown, r: RunSummary) =>
                        r.status === 'error' ? (
                          <Tooltip title={r.error}>
                            <Tag color="error">失败</Tag>
                          </Tooltip>
                        ) : r.mode === 'incremental' ? (
                          <Tag color="purple">增量</Tag>
                        ) : (
                          <Tag>全量</Tag>
                        ),
                    },
                    {
                      title: '结果',
                      width: 220,
                      render: (_: unknown, r: RunSummary) =>
                        r.counts ? (
                          <span className="text-xs text-slate-600">
                            政策 {r.counts.policies} · 环节 {r.counts.nodes} · 岗位 {r.counts.jobs} · 来源 {r.counts.sources}
                            {r.counts.newItems > 0 && <span className="text-indigo-600 font-bold"> · 新增 {r.counts.newItems}</span>}
                          </span>
                        ) : (
                          '—'
                        ),
                    },
                    {
                      title: '缓存命中',
                      width: 100,
                      render: (_: unknown, r: RunSummary) =>
                        r.cache ? (
                          <span className="text-xs text-slate-500">
                            {r.cache.searchHit + r.cache.openalexHit}/{r.cache.searchHit + r.cache.searchMiss + r.cache.openalexHit + r.cache.openalexMiss}
                          </span>
                        ) : (
                          '—'
                        ),
                    },
                    { title: '用时', dataIndex: 'durationMs', width: 80, render: (v: number) => `${Math.round(v / 1000)} 秒` },
                    {
                      title: '',
                      width: 90,
                      fixed: 'right' as const,
                      render: (_: unknown, r: RunSummary) =>
                        r.status === 'done' ? (
                          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/industry-report?run=${r.id}`)}>
                            报告
                          </Button>
                        ) : null,
                    },
                  ]}
                />
                </div>
              ),
            },
            {
              key: 'kb',
              label: `产业知识库(${data?.industries.length ?? 0})`,
              children: (
                <div data-spec="log-kb" className="space-y-4">
                  {!data?.industries.length && <Empty description="还没有沉淀的产业" />}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data?.industries.map((i) => (
                      <button
                        key={i.key}
                        onClick={() => setKbKey(kbKey === i.key ? null : i.key)}
                        className={`text-left rounded-xl border p-4 transition-all ${kbKey === i.key ? 'border-indigo-400 shadow-md' : 'border-slate-200 hover:border-indigo-200'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{i.industry}</span>
                          <span className="text-xs text-slate-400">检索 {i.runCount} 次</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{i.regions.join('、')}</div>
                        <div className="text-xs text-slate-600 mt-2 leading-relaxed">
                          政策 {i.counts.policies} · 环节 {i.counts.nodes} · 企业 {i.counts.companies} · 岗位 {i.counts.jobs} · 集群 {i.counts.clusters} · 弱信号 {i.counts.weak}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          已审核 {i.reviewed} 条 · 更新于 {fmtTime(i.updatedAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                  {kbKey && <KbDetail kbKey={kbKey} />}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value?: number | string; hint?: string }) {
  return (
    <Tooltip title={hint}>
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-3">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-black text-slate-800 mt-0.5">{value ?? '—'}</div>
      </div>
    </Tooltip>
  );
}

type KbTab = 'policies' | 'nodes' | 'jobs' | 'clusters' | 'weak';

function KbDetail({ kbKey }: { kbKey: string }) {
  const [kb, setKb] = useState<IndustryKb | null>(null);
  const [tab, setTab] = useState<KbTab>('policies');

  const reload = useCallback(() => {
    fetch(`/api/industry-log?kb=${encodeURIComponent(kbKey)}`)
      .then((r) => r.json())
      .then(setKb)
      .catch(() => setKb(null));
  }, [kbKey]);
  useEffect(() => {
    reload();
  }, [reload]);

  const remove = async (e: KbEntry<unknown>) => {
    await fetch('/api/industry-log', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kb: kbKey, list: tab, key: e.key, region: e.region }),
    });
    reload();
  };

  if (!kb) return null;

  const label = (e: KbEntry<unknown>): React.ReactNode => {
    const it = e.item as Record<string, unknown>;
    switch (tab) {
      case 'policies':
        return (
          <span>
            {String(it.name)} <span className="text-xs text-slate-400">· {String(it.issuer)} · {String(it.level)} · {String(it.year)}</span>
          </span>
        );
      case 'nodes':
        return (
          <span>
            {String(it.level)} · {String(it.node)}
            {(it.companies as string[]).length > 0 && <span className="text-xs text-slate-400"> · {(it.companies as string[]).join('、')}</span>}
          </span>
        );
      case 'jobs':
        return (
          <span>
            {String(it.title)}
            {(it.skills as string[]).length > 0 && <span className="text-xs text-slate-400"> · {(it.skills as string[]).slice(0, 8).join('、')}</span>}
          </span>
        );
      case 'clusters':
        return (
          <span>
            {String(it.name)} <span className="text-xs text-slate-400">· {String(it.type)}</span>
          </span>
        );
      default:
        return (
          <span>
            {String(it.topic)} <span className="text-xs text-slate-400">· {String(it.evidence)}</span>
          </span>
        );
    }
  };

  const list = ([...(kb[tab] as KbEntry<unknown>[])] as KbEntry<unknown>[]).sort((a, b) => Number(b.reviewed) - Number(a.reviewed) || b.seenCount - a.seenCount);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <span className="font-bold text-slate-800">{kb.industry} · 知识库明细</span>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as KbTab)}
          options={[
            { value: 'policies', label: `政策 ${kb.policies.length}` },
            { value: 'nodes', label: `产业链 ${kb.nodes.length}` },
            { value: 'jobs', label: `岗位 ${kb.jobs.length}` },
            { value: 'clusters', label: `集群 ${kb.clusters.length}` },
            { value: 'weak', label: `弱信号 ${kb.weak.length}` },
          ]}
        />
      </div>
      <Table
        size="small"
        rowKey={(e) => `${e.key}|${e.region}`}
        dataSource={list}
        pagination={{ pageSize: 10 }}
        columns={[
          { title: '条目', render: (_: unknown, e: KbEntry<unknown>) => label(e) },
          { title: '地区', dataIndex: 'region', width: 110 },
          { title: '出现', dataIndex: 'seenCount', width: 70, render: (v: number) => `${v} 次` },
          { title: '最近', dataIndex: 'lastSeen', width: 110, render: fmtTime },
          {
            title: '来源',
            width: 80,
            render: (_: unknown, e: KbEntry<unknown>) => (
              <span className="text-xs">
                {e.sources.slice(0, 3).map((src, i) =>
                  src.url ? (
                    <a key={i} href={src.url} target="_blank" rel="noreferrer" className="text-sky-600 mr-1" title={src.title}>
                      [{i + 1}]
                    </a>
                  ) : (
                    <span key={i} className="text-teal-600 mr-1" title={src.title}>
                      [平方]
                    </span>
                  ),
                )}
              </span>
            ),
          },
          {
            title: '审核',
            width: 70,
            render: (_: unknown, e: KbEntry<unknown>) => (e.reviewed ? <CheckCircleFilled className="text-emerald-500" /> : <span className="text-slate-300">—</span>),
          },
          {
            title: '',
            width: 50,
            render: (_: unknown, e: KbEntry<unknown>) => (
              <Popconfirm title="删除这条沉淀?" description="删除后不再补回报告;以后检索再次命中会重新沉淀。" okText="删除" cancelText="取消" onConfirm={() => remove(e)}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  );
}
