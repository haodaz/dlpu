'use client';
import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Table, Tag } from 'antd';
import { DesktopOutlined } from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Cell, LabelList, Legend,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { CORE_METRICS, verdictMeta, type Verdict } from '@/lib/diagnosis';
import { LATEST_RESULT_TASK, RESULT_TASKS, avgOf, coreLinks, majorIssues, majorSlug, taskResults, LINK_PASS, type MajorResult } from '@/lib/eval-tasks';
import { TaskHeader, HistoryTasks, useTaskParam } from '@/components/eval/TaskBar';
import MajorScatter from '@/components/eval/MajorScatter';
import MeetingMode from '@/components/diagnosis/MeetingMode';

// 诊断分析:某次评价任务(默认最近一次)各专业的整体分析 → 横向比较 → 专业列表(点进具体专业的诊断)→ 往期诊断
export default function Page() {
  return (
    <Suspense fallback={null}>
      <DiagnosisOverview />
    </Suspense>
  );
}

const LINKS = CORE_METRICS.flatMap((c) => c.links.map((l) => ({ core: c.key, name: l.name })));
const median = (v: number[]) => {
  const s = [...v].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : Math.round(((s[s.length / 2 - 1] + s[s.length / 2]) / 2) * 10) / 10;
};

function DiagnosisOverview() {
  const router = useRouter();
  const [meeting, setMeeting] = useState(false);
  const [task, setTask] = useTaskParam(LATEST_RESULT_TASK);
  const rows = taskResults(task.id);
  const open = (major: string) => router.push(`/admin/diagnosis?major=${majorSlug(major)}&task=${task.id}`);

  // 各环节得分分布(按专业):最低 / 中位 / 最高
  const linkScores = LINKS.map((l) => {
    const v = rows.map((r) => coreLinks(task.id, r.major, l.core).find((x) => x.name === l.name)!.score);
    return { name: l.name, min: Math.min(...v), median: median(v), max: Math.max(...v), avg: Math.round((v.reduce((s, x) => s + x, 0) / v.length) * 10) / 10, failing: v.filter((x) => x < LINK_PASS).length };
  });
  const histogram = [
    { range: '≥ 90', count: rows.filter((r) => r.overall >= 90).length, color: '#10b981' },
    { range: '80–89', count: rows.filter((r) => r.overall >= 80 && r.overall < 90).length, color: '#1677ff' },
    { range: '70–79', count: rows.filter((r) => r.overall >= 70 && r.overall < 80).length, color: '#f59e0b' },
    { range: '< 70', count: rows.filter((r) => r.overall < 70).length, color: '#ef4444' },
  ];
  const issues = rows.flatMap((r) => majorIssues(task.id, r.major));
  const weakest = (r: MajorResult) =>
    [...coreLinks(task.id, r.major, 'consistency'), ...coreLinks(task.id, r.major, 'effectiveness')].sort((a, b) => a.score - b.score)[0];

  return (
    <div className="space-y-5 pb-8 max-w-6xl mx-auto">
      <TaskHeader
        title="诊断分析"
        desc={`${task.name} · ${rows.length} 个专业的整体分析与横向比较 · 点专业进入该专业的诊断`}
        task={task}
        onTask={setTask}
        tasks={RESULT_TASKS}
        extra={
          <span data-spec="meeting-btn">
            <Button type="primary" icon={<DesktopOutlined />} onClick={() => setMeeting(true)}>
              会议模式(大屏)
            </Button>
          </span>
        }
      />

      {/* 整体概览 */}
      <div data-spec="diag-kpis" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '参评专业', value: rows.length, unit: '个' },
          { label: '一致性均分', value: avgOf(rows, 'consistency'), unit: '' },
          { label: '有效性均分', value: avgOf(rows, 'effectiveness'), unit: '' },
          { label: '诊断问题', value: issues.length, unit: '个' },
          { label: '其中教师层面', value: issues.filter((i) => i.level === 'TEACHER').length, unit: '个' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="text-xs font-bold text-slate-500">{k.label}</div>
            <div className="mt-1.5 text-2xl font-black text-slate-800">
              {k.value}
              <span className="text-xs font-normal text-slate-400 ml-1">{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div data-spec="analysis-layers" className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="text-base font-bold text-slate-800 m-0">各环节得分分布</h3>
          <p className="text-xs text-slate-400 mt-1 mb-2">每个环节在 {rows.length} 个专业中的最低 / 中位 / 最高分;达标线 {LINK_PASS}</p>
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={linkScores} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} interval={0} />
                <YAxis domain={[40, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <RTooltip formatter={(v, n) => [v, n === 'max' ? '最高' : n === 'median' ? '中位' : '最低']} />
                <Legend formatter={(v) => (v === 'max' ? '最高' : v === 'median' ? '中位' : '最低')} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="max" fill="#dbeafe" radius={[3, 3, 0, 0]} />
                <Bar dataKey="median" fill="#1677ff" radius={[3, 3, 0, 0]} />
                <Bar dataKey="min" fill="#1e3a8a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-rows-2 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-1">综合得分分布</h3>
            <div className="h-[110px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogram} margin={{ top: 14, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <RTooltip formatter={(v) => [`${v} 个专业`, '专业数']} />
                  <Bar dataKey="count" barSize={30} radius={[4, 4, 0, 0]}>
                    {histogram.map((h) => (
                      <Cell key={h.range} fill={h.color} />
                    ))}
                    <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#475569', fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-1">各环节均分</h3>
            <div className="h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={linkScores}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <PolarRadiusAxis domain={[50, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="avg" stroke="#1677ff" fill="#1677ff" fillOpacity={0.35} />
                  <RTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <MajorScatter rows={rows} onPick={open} />

      {/* 专业列表 */}
      <div data-spec="diag-majors" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-3">各专业诊断</h3>
        <Table
          rowKey="major"
          scroll={{ x: 980 }}
          pagination={false}
          size="middle"
          dataSource={[...rows].sort((a, b) => a.overall - b.overall)}
          onRow={(r) => ({ onClick: () => open(r.major), style: { cursor: 'pointer' } })}
          columns={[
            { title: '专业', dataIndex: 'major', width: 170, fixed: 'left' as const, render: (x: string) => <span className="font-bold text-slate-700">{x}</span> },
            { title: '所属院系', dataIndex: 'college', width: 180 },
            { title: '一致性', dataIndex: 'consistency', width: 80 },
            { title: '有效性', dataIndex: 'effectiveness', width: 80 },
            { title: '综合', dataIndex: 'overall', width: 70, render: (x: number) => <b>{x}</b> },
            {
              title: '结论',
              dataIndex: 'verdict',
              width: 100,
              render: (v: Verdict) => (
                <Tag style={{ color: verdictMeta[v].color, background: verdictMeta[v].bg, borderColor: 'transparent' }}>{verdictMeta[v].label}</Tag>
              ),
            },
            {
              title: '主要短板',
              width: 150,
              render: (_: unknown, r: MajorResult) => {
                const w = weakest(r);
                return (
                  <span className={w.ok ? 'text-slate-500 text-xs' : 'text-red-500 text-xs font-bold'}>
                    {w.name} {w.score}
                  </span>
                );
              },
            },
            { title: '问题', width: 70, render: (_: unknown, r: MajorResult) => `${majorIssues(task.id, r.major).length} 个` },
            { title: '', width: 90, render: () => <span className="text-xs text-blue-600">查看诊断 →</span> },
          ]}
        />
      </div>

      <HistoryTasks
        title="往期诊断分析"
        tasks={RESULT_TASKS}
        current={task.id}
        onPick={setTask}
        meta={(t) => {
          const rs = taskResults(t.id);
          return <span className="text-xs text-slate-400">一致性 {avgOf(rs, 'consistency')} · 有效性 {avgOf(rs, 'effectiveness')}</span>;
        }}
      />

      <MeetingMode open={meeting} initial={1} onClose={() => setMeeting(false)} />
    </div>
  );
}
