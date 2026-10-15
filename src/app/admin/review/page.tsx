'use client';
import React, { useState } from 'react';
import { Segmented, Table } from 'antd';
import { CheckCircleFilled, SyncOutlined, ExclamationCircleFilled, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, LabelList } from 'recharts';
import { useRouter } from 'next/navigation';
import { MAJORS, verdictMeta, coreResult, LAST_CYCLE, DEMO_MAJOR, schoolAvg, type Major, type PrevIssue } from '@/lib/diagnosis';
import { getIndicatorById } from '@/lib/indicators';

// 回看与比较
// 横向:全校专业在一致性 / 有效性上的位置与差距(与红绿灯同一份数据)
// 纵向:示例专业上一学年 vs 本学年,大问题是否已经解决(上一学年为演示数据)
const LINE = 80; // 象限分界线

export default function ReviewPage() {
  const [tab, setTab] = useState<'horizontal' | 'vertical'>('horizontal');
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0">回看与比较</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">横向看全校专业差距在哪;纵向看去年的大问题今年解决了没有</p>
        </div>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as typeof tab)}
          options={[
            { value: 'horizontal', label: '横向比较 · 全校专业' },
            { value: 'vertical', label: `纵向回看 · ${DEMO_MAJOR.name}` },
          ]}
        />
      </div>
      {tab === 'horizontal' ? <Horizontal /> : <Vertical />}
    </div>
  );
}

// ---------- 横向比较 ----------
const QUADRANTS = [
  { key: 'both', label: '方向对、做得好', desc: '一致性与有效性都 ≥ 80', color: '#047857' },
  { key: 'exec', label: '方向对、没做好', desc: '一致性 ≥ 80,有效性 < 80:抓教学过程与结果', color: '#b45309' },
  { key: 'dir', label: '做得好、方向偏', desc: '有效性 ≥ 80,一致性 < 80:调培养方案与课程设置', color: '#b45309' },
  { key: 'none', label: '方向偏、也没做好', desc: '都 < 80:考虑缩减或停招', color: '#b91c1c' },
] as const;

const quadrantOf = (m: Major) =>
  m.consistency >= LINE && m.effectiveness >= LINE ? 'both' : m.consistency >= LINE ? 'exec' : m.effectiveness >= LINE ? 'dir' : 'none';

function Horizontal() {
  const avgC = Math.round((MAJORS.reduce((s, m) => s + m.consistency, 0) / MAJORS.length) * 10) / 10;
  const avgE = Math.round((MAJORS.reduce((s, m) => s + m.effectiveness, 0) / MAJORS.length) * 10) / 10;
  return (
    <>
      <div data-spec="review-scatter" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800 m-0">一致性 × 有效性</h3>
          <span className="text-xs text-slate-400">
            全校均值:一致性 {avgC} · 有效性 {avgE} · 综合 {schoolAvg} · 分界线 {LINE}
          </span>
        </div>
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey="consistency" name="一致性" domain={[55, 95]} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: '一致性(方向对不对)', position: 'bottom', fontSize: 12, fill: '#64748b' }} />
              <YAxis type="number" dataKey="effectiveness" name="有效性" domain={[65, 90]} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: '有效性(做没做好)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
              <ZAxis range={[90, 90]} />
              <ReferenceLine x={LINE} stroke="#cbd5e1" strokeDasharray="4 4" />
              <ReferenceLine y={LINE} stroke="#cbd5e1" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  const m = payload?.[0]?.payload as Major | undefined;
                  if (!m) return null;
                  return (
                    <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs">
                      <div className="font-bold text-slate-800">{m.name}</div>
                      <div className="text-slate-500">
                        一致性 {m.consistency} · 有效性 {m.effectiveness}
                      </div>
                      <div style={{ color: verdictMeta[m.verdict].color }}>{verdictMeta[m.verdict].label} · 建议{m.layout}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={MAJORS}>
                {MAJORS.map((m) => (
                  <Cell key={m.name} fill={verdictMeta[m.verdict].dot} />
                ))}
                <LabelList dataKey="name" position="top" style={{ fontSize: 10, fill: '#475569' }} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
          {QUADRANTS.map((q) => {
            const list = MAJORS.filter((m) => quadrantOf(m) === q.key);
            return (
              <div key={q.key} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <div className="text-sm font-bold" style={{ color: q.color }}>
                  {q.label} · {list.length}
                </div>
                <div className="text-[11px] text-slate-400 mb-1">{q.desc}</div>
                <div className="text-xs text-slate-600">{list.map((m) => m.name).join('、') || '—'}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div data-spec="review-gap" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-3">与全校均值的差距</h3>
        <Table
          size="small"
          rowKey="name"
          pagination={false}
          dataSource={[...MAJORS].sort((a, b) => a.consistency + a.effectiveness - (b.consistency + b.effectiveness))}
          columns={[
            { title: '专业', dataIndex: 'name', render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
            { title: '一致性差距', dataIndex: 'consistency', width: 120, render: (v: number) => <Gap v={Math.round((v - avgC) * 10) / 10} /> },
            { title: '有效性差距', dataIndex: 'effectiveness', width: 120, render: (v: number) => <Gap v={Math.round((v - avgE) * 10) / 10} /> },
            { title: '短板在', width: 110, render: (_: unknown, m: Major) => (m.consistency - avgC < m.effectiveness - avgE ? '一致性' : '有效性') },
            { title: '原因', dataIndex: 'reason', render: (v: string) => <span className="text-xs text-slate-500">{v}</span> },
          ]}
        />
        <p className="text-xs text-slate-400 mt-2 mb-0">演示数据 · 学校内部数据接入后按真实诊断结果计算</p>
      </div>
    </>
  );
}

function Gap({ v }: { v: number }) {
  return <span className={`font-mono text-xs font-bold ${v >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{v >= 0 ? `+${v}` : v}</span>;
}

// ---------- 纵向回看 ----------
const STATUS: Record<PrevIssue['status'], { label: string; icon: React.ReactNode; cls: string }> = {
  resolved: { label: '已解决', icon: <CheckCircleFilled />, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  improving: { label: '好转中', icon: <SyncOutlined />, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  persisting: { label: '仍存在', icon: <ExclamationCircleFilled />, cls: 'text-red-600 bg-red-50 border-red-200' },
};

function Vertical() {
  const router = useRouter();
  const cores = [coreResult('consistency'), coreResult('effectiveness')];
  const last = { consistency: LAST_CYCLE.consistency, effectiveness: LAST_CYCLE.effectiveness };
  return (
    <>
      <div data-spec="review-trend" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cores.map((r) => {
          const prev = last[r.key];
          const d = Math.round((r.score - prev) * 10) / 10;
          return (
            <div key={r.key} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-800">{r.name}</span>
                <span className="text-sm text-slate-400">
                  {LAST_CYCLE.label} {prev} →<span className="text-3xl font-black text-slate-800 ml-2">{r.score}</span>
                  <span className={`ml-2 font-bold ${d >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {d >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(d)}
                  </span>
                </span>
              </div>
              <div className="mt-4 space-y-2">
                {r.links.map((l) => {
                  const p = LAST_CYCLE.links[l.name];
                  const dl = Math.round((l.score - p) * 10) / 10;
                  return (
                    <div key={l.name} className="flex items-center gap-3 text-sm">
                      <span className="w-20 text-slate-600">{l.name}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded relative">
                        <div className="absolute h-2 rounded bg-slate-300" style={{ width: `${p}%` }} />
                        <div className={`absolute h-2 rounded ${l.ok ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${l.score}%`, opacity: 0.85 }} />
                      </div>
                      <span className="w-24 text-right font-mono text-xs text-slate-500">
                        {p} → <b className="text-slate-800">{l.score}</b>
                      </span>
                      <span className={`w-12 text-right font-mono text-xs font-bold ${dl >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{dl >= 0 ? `+${dl}` : dl}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-slate-400 mt-3">灰条为上一学年,彩条为本学年;红色为本学年仍未达标(&lt; 85)的环节</div>
            </div>
          );
        })}
      </div>

      <div data-spec="review-issues" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-1">{LAST_CYCLE.label}的大问题,今年解决了吗</h3>
        <p className="text-xs text-slate-400 mt-0 mb-4">「仍存在」的问题会继续进入本学年的问题队列</p>
        <div className="space-y-3">
          {LAST_CYCLE.issues.map((i) => {
            const st = STATUS[i.status];
            const ind = getIndicatorById(i.indicatorId);
            return (
              <div key={i.title} className="flex items-start gap-3 border-b border-slate-50 pb-3">
                <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${st.cls}`}>
                  {st.icon} {st.label}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{i.title}</div>
                  <div className="text-sm text-slate-600 mt-0.5">{i.note}</div>
                </div>
                <button className="text-xs text-blue-600 hover:underline shrink-0" onClick={() => router.push(`/admin/indicator-analysis?id=${i.indicatorId}`)}>
                  {ind?.id} {ind?.name}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3 mb-0">上一学年为演示数据;正式使用时由每轮诊断归档自动生成</p>
      </div>
    </>
  );
}
