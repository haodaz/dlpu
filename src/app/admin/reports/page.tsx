'use client';
import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Tabs } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { verdictMeta, type Verdict } from '@/lib/diagnosis';
import { LATEST_RESULT_TASK, RESULT_TASKS, avgOf, majorResult, majorSlug, taskResults, type MajorResult } from '@/lib/eval-tasks';
import { TaskHeader, HistoryTasks, useTaskParam } from '@/components/eval/TaskBar';

// 评价结果:某次评价任务各专业的三档结论与得分(默认最近一次)、近三次变化趋势、往期结果
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResultsPage />
    </Suspense>
  );
}

const TIERS: Verdict[] = ['GO', 'RISK', 'NO'];
const TIER_DESC: Record<Verdict, string> = {
  GO: '一致性与有效性综合 ≥ 80:方向对、做得好,建议加大投入',
  RISK: '综合 70–80:有明确短板,按诊断问题优化整改',
  NO: '综合 < 70:需重点关注,结合区域产业需求论证调整方向',
};

function ResultsPage() {
  const router = useRouter();
  const [task, setTask] = useTaskParam(LATEST_RESULT_TASK);
  const rows = taskResults(task.id);
  const [tier, setTier] = useState<Verdict>('GO');
  const k = RESULT_TASKS.findIndex((t) => t.id === task.id);
  const prevTask = RESULT_TASKS[k + 1];
  const recent = RESULT_TASKS.slice(k, k + 3).reverse(); // 最近三次(含当前),时间正序
  const open = (major: string) => router.push(`/admin/diagnosis?major=${majorSlug(major)}&task=${task.id}`);

  const trend = recent.map((t) => {
    const rs = taskResults(t.id);
    return {
      name: t.period.replace(' 学年', ''),
      综合均分: avgOf(rs, 'overall'),
      重点发展: rs.filter((r) => r.verdict === 'GO').length,
      优化整改: rs.filter((r) => r.verdict === 'RISK').length,
      风险关注: rs.filter((r) => r.verdict === 'NO').length,
    };
  });

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <TaskHeader title="评价结果" desc={`${rows.length} 个专业的评价结论与得分 · 点专业查看该次评价的诊断`} task={task} onTask={setTask} tasks={RESULT_TASKS} />

      {/* 三档 */}
      <div data-spec="result-tiers" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((v) => {
          const m = verdictMeta[v];
          const n = rows.filter((r) => r.verdict === v).length;
          return (
            <button
              key={v}
              onClick={() => setTier(v)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${tier === v ? 'shadow-md' : 'opacity-80 hover:opacity-100'}`}
              style={{ backgroundColor: m.bg, borderColor: tier === v ? m.dot : 'transparent' }}
            >
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: m.color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.dot }} />
                {m.label}
              </div>
              <div className="text-4xl font-black mt-2" style={{ color: m.color }}>
                {n}
                <span className="text-sm font-normal ml-1">个专业</span>
              </div>
              <div className="text-xs mt-1" style={{ color: m.color, opacity: 0.8 }}>
                {TIER_DESC[v]}
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <Tabs
          activeKey={tier}
          onChange={(v) => setTier(v as Verdict)}
          items={TIERS.map((v) => ({
            key: v,
            label: `${verdictMeta[v].label}(${rows.filter((r) => r.verdict === v).length})`,
            children: (
              <Table
                rowKey="major"
                scroll={{ x: 860 }}
                size="middle"
                pagination={false}
                dataSource={rows.filter((r) => r.verdict === v).sort((a, b) => b.overall - a.overall)}
                onRow={(r) => ({ onClick: () => open(r.major), style: { cursor: 'pointer' } })}
                locale={{ emptyText: '没有该档专业' }}
                columns={[
                  { title: '专业', dataIndex: 'major', width: 170, fixed: 'left' as const, render: (x: string) => <span className="font-bold text-slate-700">{x}</span> },
                  { title: '所属院系', dataIndex: 'college', width: 190 },
                  { title: '一致性', dataIndex: 'consistency', width: 90 },
                  { title: '有效性', dataIndex: 'effectiveness', width: 90 },
                  { title: '综合得分', dataIndex: 'overall', width: 100, render: (x: number) => <b className="text-slate-800">{x}</b> },
                  {
                    title: prevTask ? `较${prevTask.period}` : '变化',
                    width: 130,
                    render: (_: unknown, r: MajorResult) => <Change now={r.overall} prev={prevTask ? majorResult(prevTask.id, r.major)?.overall : undefined} />,
                  },
                  { title: '', width: 90, render: () => <span className="text-xs text-blue-600">查看诊断 →</span> },
                ]}
              />
            ),
          }))}
        />
      </div>

      {/* 近三次趋势 */}
      {recent.length > 1 && (
        <div data-spec="result-trend" className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-2">近 {recent.length} 次评价 · 三档专业数与综合均分</h3>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis yAxisId="n" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis yAxisId="s" orientation="right" domain={[60, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="n" dataKey="重点发展" stroke="#10b981" strokeWidth={2} />
                  <Line yAxisId="n" dataKey="优化整改" stroke="#f59e0b" strokeWidth={2} />
                  <Line yAxisId="n" dataKey="风险关注" stroke="#ef4444" strokeWidth={2} />
                  <Line yAxisId="s" dataKey="综合均分" stroke="#1677ff" strokeDasharray="5 4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-2">各专业综合得分变化</h3>
            <Table<MajorResult & { scores: (number | undefined)[] }>
              rowKey="major"
              size="small"
              pagination={false}
              scroll={{ y: 260 }}
              dataSource={rows.map((r) => ({ ...r, scores: recent.map((t) => majorResult(t.id, r.major)?.overall) }))}
              onRow={(r) => ({ onClick: () => open(r.major), style: { cursor: 'pointer' } })}
              columns={[
                { title: '专业', dataIndex: 'major', width: 170, fixed: 'left' as const, render: (x: string) => <span className="font-semibold text-slate-700">{x}</span> },
                ...recent.map((t, i) => ({ title: t.period.replace(' 学年', ''), width: 90, render: (_: unknown, r: { scores: (number | undefined)[] }) => r.scores[i] ?? '—' })),
                {
                  title: '近三次',
                  width: 100,
                  render: (_: unknown, r: { scores: (number | undefined)[] }) => <Change now={r.scores[r.scores.length - 1]!} prev={r.scores[0]} />,
                },
              ]}
            />
          </div>
        </div>
      )}

      <HistoryTasks
        title="往期评价结果"
        tasks={RESULT_TASKS}
        current={task.id}
        onPick={setTask}
        meta={(t) => {
          const rs = taskResults(t.id);
          return (
            <span className="text-xs">
              <span style={{ color: verdictMeta.GO.color }}>重点发展 {rs.filter((r) => r.verdict === 'GO').length}</span> ·{' '}
              <span style={{ color: verdictMeta.RISK.color }}>优化整改 {rs.filter((r) => r.verdict === 'RISK').length}</span> ·{' '}
              <span style={{ color: verdictMeta.NO.color }}>风险关注 {rs.filter((r) => r.verdict === 'NO').length}</span>
            </span>
          );
        }}
      />
    </div>
  );
}

function Change({ now, prev }: { now: number; prev?: number }) {
  if (prev === undefined) return <span className="text-xs text-slate-400">—</span>;
  const d = Math.round((now - prev) * 10) / 10;
  if (d === 0)
    return (
      <span className="text-xs text-slate-400">
        <MinusOutlined /> 持平
      </span>
    );
  return (
    <span className={`text-xs font-bold ${d > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
      {d > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(d)}
    </span>
  );
}
