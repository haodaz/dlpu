'use client';
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Progress, Table, Tag } from 'antd';
import { DEMO_MAJOR, MAJORS } from '@/lib/diagnosis';
import { useResolvedIssues } from '@/lib/diagnosis-state';
import { LATEST_RESULT_TASK, RESULT_TASKS, majorIssues, majorSlug, staticRectDone } from '@/lib/eval-tasks';
import { TaskHeader, HistoryTasks, useTaskParam } from '@/components/eval/TaskBar';

// 整改与跟踪:某次评价任务(默认最近一次)各专业的待整改问题与整改进度 → 点进具体专业的整改与跟踪报告
export default function Page() {
  return (
    <Suspense fallback={null}>
      <RectOverview />
    </Suspense>
  );
}

interface Row {
  major: string;
  college: string;
  total: number;
  done: number;
  mgmt: number;
  teacher: number;
}

function RectOverview() {
  const router = useRouter();
  const [task, setTask] = useTaskParam(LATEST_RESULT_TASK);
  const { resolved } = useResolvedIssues();
  const latest = task.id === LATEST_RESULT_TASK.id;

  const rows: Row[] = MAJORS.map((m) => {
    const issues = majorIssues(task.id, m.name);
    const live = latest && m.name === DEMO_MAJOR.name;
    return {
      major: m.name,
      college: m.college,
      total: issues.length,
      done: live ? issues.filter((i) => resolved.includes(i.id)).length : staticRectDone(task.id, m.name, issues.length),
      mgmt: issues.filter((i) => i.level === 'MANAGEMENT').length,
      teacher: issues.filter((i) => i.level === 'TEACHER').length,
    };
  }).filter((r) => r.total > 0);

  const total = rows.reduce((s, r) => s + r.total, 0);
  const done = rows.reduce((s, r) => s + r.done, 0);
  const open = (major: string) => router.push(`/rectification/report?major=${majorSlug(major)}&task=${task.id}`);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <TaskHeader title="整改与跟踪" desc={`${task.name} · 各专业的待整改问题与整改进度 · 点专业查看整改与跟踪报告`} task={task} onTask={setTask} tasks={RESULT_TASKS} />

      <div data-spec="rect-kpis" className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '涉及专业', value: rows.length, unit: '个' },
          { label: '整改问题', value: total, unit: '个' },
          { label: '待整改', value: total - done, unit: '个' },
          { label: '已完成', value: done, unit: '个' },
          { label: '整改完成率', value: total ? Math.round((done / total) * 100) : 0, unit: '%' },
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

      <div data-spec="rect-majors" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-3">各专业整改进度</h3>
        <Table
          rowKey="major"
          scroll={{ x: 900 }}
          pagination={false}
          size="middle"
          dataSource={[...rows].sort((a, b) => a.done / a.total - b.done / b.total)}
          onRow={(r) => ({ onClick: () => open(r.major), style: { cursor: 'pointer' } })}
          columns={[
            { title: '专业', dataIndex: 'major', width: 170, fixed: 'left' as const, render: (x: string) => <span className="font-bold text-slate-700">{x}</span> },
            { title: '所属院系', dataIndex: 'college', width: 180 },
            { title: '管理层面', dataIndex: 'mgmt', width: 90, render: (x: number) => `${x} 个` },
            { title: '教师层面', dataIndex: 'teacher', width: 90, render: (x: number) => `${x} 个` },
            {
              title: '整改进度',
              width: 220,
              render: (_: unknown, r: Row) => (
                <div className="flex items-center gap-2">
                  <Progress percent={Math.round((r.done / r.total) * 100)} size="small" className="flex-1 m-0" strokeColor={r.done === r.total ? '#10b981' : '#1677ff'} showInfo={false} />
                  <span className="text-xs text-slate-500 w-10 text-right">
                    {r.done}/{r.total}
                  </span>
                </div>
              ),
            },
            {
              title: '状态',
              width: 90,
              render: (_: unknown, r: Row) => <Tag color={r.done === r.total ? 'success' : r.done ? 'processing' : 'default'}>{r.done === r.total ? '已完成' : r.done ? '整改中' : '待整改'}</Tag>,
            },
            { title: '', width: 90, render: () => <span className="text-xs text-blue-600">整改报告 →</span> },
          ]}
        />
      </div>

      <HistoryTasks
        title="往期整改与跟踪"
        tasks={RESULT_TASKS}
        current={task.id}
        onPick={setTask}
        meta={(t) => {
          const n = MAJORS.reduce((s, m) => s + majorIssues(t.id, m.name).length, 0);
          return <span className="text-xs text-slate-400">{n} 个整改问题</span>;
        }}
      />
    </div>
  );
}
