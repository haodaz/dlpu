'use client';
import React from 'react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, LabelList } from 'recharts';
import { verdictMeta } from '@/lib/diagnosis';
import { avgOf, type MajorResult } from '@/lib/eval-tasks';

// 横向比较:各专业在一致性 × 有效性上的位置(原「回看与比较 · 横向」)
const LINE = 80;
const QUADRANTS = [
  { key: 'both', label: '方向对、做得好', desc: '一致性与有效性都 ≥ 80', color: '#047857' },
  { key: 'exec', label: '方向对、没做好', desc: '一致性 ≥ 80,有效性 < 80:抓教学过程与结果', color: '#b45309' },
  { key: 'dir', label: '做得好、方向偏', desc: '有效性 ≥ 80,一致性 < 80:调培养方案与课程设置', color: '#b45309' },
  { key: 'none', label: '方向偏、也没做好', desc: '都 < 80:重点关注', color: '#b91c1c' },
] as const;
const quadrantOf = (m: MajorResult) =>
  m.consistency >= LINE && m.effectiveness >= LINE ? 'both' : m.consistency >= LINE ? 'exec' : m.effectiveness >= LINE ? 'dir' : 'none';

export default function MajorScatter({ rows, onPick }: { rows: MajorResult[]; onPick?: (major: string) => void }) {
  const xs = rows.map((r) => r.consistency);
  const ys = rows.map((r) => r.effectiveness);
  const dom = (v: number[]): [number, number] => [Math.floor((Math.min(...v, LINE) - 4) / 5) * 5, Math.ceil((Math.max(...v, LINE) + 3) / 5) * 5];
  return (
    <div data-spec="review-scatter" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-800 m-0">横向比较 · 一致性 × 有效性</h3>
        <span className="text-xs text-slate-400">
          {rows.length} 个专业均值:一致性 {avgOf(rows, 'consistency')} · 有效性 {avgOf(rows, 'effectiveness')} · 分界线 {LINE}
          {onPick ? ' · 点圆点查看该专业诊断' : ''}
        </span>
      </div>
      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis type="number" dataKey="consistency" name="一致性" domain={dom(xs)} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: '一致性(方向对不对)', position: 'bottom', fontSize: 12, fill: '#64748b' }} />
            <YAxis type="number" dataKey="effectiveness" name="有效性" domain={dom(ys)} tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: '有效性(做没做好)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#64748b' }} />
            <ZAxis range={[90, 90]} />
            <ReferenceLine x={LINE} stroke="#cbd5e1" strokeDasharray="4 4" />
            <ReferenceLine y={LINE} stroke="#cbd5e1" strokeDasharray="4 4" />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ payload }) => {
                const m = payload?.[0]?.payload as MajorResult | undefined;
                if (!m) return null;
                return (
                  <div className="bg-white rounded-lg shadow-lg border border-slate-100 px-3 py-2 text-xs">
                    <div className="font-bold text-slate-800">{m.major}</div>
                    <div className="text-slate-500">
                      一致性 {m.consistency} · 有效性 {m.effectiveness} · 综合 {m.overall}
                    </div>
                    <div style={{ color: verdictMeta[m.verdict].color }}>{verdictMeta[m.verdict].label}</div>
                  </div>
                );
              }}
            />
            <Scatter data={rows} onClick={(d) => onPick?.((d as unknown as MajorResult).major)} cursor={onPick ? 'pointer' : undefined}>
              {rows.map((m) => (
                <Cell key={m.major} fill={verdictMeta[m.verdict].dot} />
              ))}
              <LabelList dataKey="major" position="top" style={{ fontSize: 10, fill: '#475569' }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {QUADRANTS.map((q) => {
          const list = rows.filter((m) => quadrantOf(m) === q.key);
          return (
            <div key={q.key} className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="text-sm font-bold" style={{ color: q.color }}>
                {q.label} · {list.length}
              </div>
              <div className="text-[11px] text-slate-400 mb-1">{q.desc}</div>
              <div className="text-xs text-slate-600">{list.map((m) => m.major).join('、') || '—'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
