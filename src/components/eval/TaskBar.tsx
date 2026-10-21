'use client';
import React from 'react';
import { Select, Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { EVAL_TASKS, TASK_STATE_META, taskById, type EvalTask } from '@/lib/eval-tasks';

/** 当前查看的评价任务:地址栏 ?task=;没有时用默认任务 */
export function useTaskParam(fallback: EvalTask): [EvalTask, (id: string) => void] {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const task = taskById(params.get('task')) ?? fallback;
  const setTask = (id: string) => {
    const q = new URLSearchParams(params.toString());
    q.set('task', id);
    router.replace(`${path}?${q.toString()}`);
  };
  return [task, setTask];
}

/** 页头:标题 + 任务切换(只列出符合条件的任务) */
export function TaskHeader({
  title,
  desc,
  task,
  onTask,
  tasks = EVAL_TASKS,
  extra,
}: {
  title: string;
  desc: string;
  task: EvalTask;
  onTask: (id: string) => void;
  tasks?: EvalTask[];
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-xl font-bold text-slate-800 m-0">{title}</h1>
        <p className="text-sm text-slate-500 m-0 mt-1">{desc}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={task.id}
          onChange={onTask}
          style={{ minWidth: 250 }}
          options={tasks.map((t) => ({
            value: t.id,
            label: (
              <span>
                {t.name} <Tag color={TASK_STATE_META[t.state].color} className="ml-1">{TASK_STATE_META[t.state].label}</Tag>
              </span>
            ),
          }))}
        />
        {extra}
      </div>
    </div>
  );
}

/** 往期任务列表:点击切换到该任务 */
export function HistoryTasks({ title, tasks, current, onPick, meta }: { title: string; tasks: EvalTask[]; current: string; onPick: (id: string) => void; meta?: (t: EvalTask) => React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
      <h3 className="text-base font-bold text-slate-800 m-0 mb-3">{title}</h3>
      <div className="divide-y divide-slate-100">
        {tasks.map((t) => (
          <button
            key={t.id}
            onClick={() => onPick(t.id)}
            className={`w-full text-left flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-slate-50 ${t.id === current ? 'bg-blue-50/60' : ''}`}
          >
            <span className="font-bold text-slate-700">{t.name}</span>
            <Tag color={TASK_STATE_META[t.state].color}>{TASK_STATE_META[t.state].label}</Tag>
            <span className="text-xs text-slate-400">
              {t.start} ~ {t.end}
            </span>
            <span className="ml-auto text-sm text-slate-500 flex items-center gap-2">
              {meta?.(t)}
              {t.id === current ? <span className="text-blue-600 text-xs font-bold">正在查看</span> : <RightOutlined className="text-slate-300" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
