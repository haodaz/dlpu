'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Progress, Tag } from 'antd';
import { ArrowRightOutlined, CalendarOutlined, ExclamationCircleFilled, RightOutlined } from '@ant-design/icons';
import { DEMO_TEACHER, verdictMeta } from '@/lib/diagnosis';
import { CURRENT_TASK, LATEST_RESULT_TASK, RESULT_TASKS, TASK_STATE_META, majorResult } from '@/lib/eval-tasks';
import { useMyWorks, workDone, WORK_STATUS } from '@/lib/teacher-work';

// 专业教师首页:最新评价任务与我的完成进度、我负责的专业、历史评价任务
export default function TeacherHome() {
  const router = useRouter();
  const works = useMyWorks(CURRENT_TASK);
  const done = works.filter(workDone).length;
  const fixes = works.filter((w) => w.status === 'supplement');
  const [now] = useState(() => new Date());
  const daysLeft = Math.ceil((new Date(`${CURRENT_TASK.end}T23:59:59`).getTime() - now.getTime()) / 86400000);
  const h = now.getHours();
  const hello = h < 6 ? '夜深了' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';

  return (
    <div className="max-w-5xl mx-auto pt-2 pb-14 space-y-5">
      <div>
        <div className="text-sm text-slate-400">
          {now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })} · 任教课程:{DEMO_TEACHER.course}
        </div>
        <h1 className="text-[28px] font-bold text-slate-800 mt-1 mb-0 tracking-tight">
          {hello},{DEMO_TEACHER.call}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* 最新评价任务 */}
        <div data-spec="teacher-latest" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400">最新评价任务</span>
            <Tag color={TASK_STATE_META[CURRENT_TASK.state].color}>{TASK_STATE_META[CURRENT_TASK.state].label}</Tag>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mt-2 mb-1">{CURRENT_TASK.name}</h2>
          <div className="text-sm text-slate-500 flex items-center gap-1.5">
            <CalendarOutlined /> 自评截止 {CURRENT_TASK.end}
            {daysLeft > 0 && <span className={daysLeft <= 14 ? 'text-red-500 font-bold' : ''}>,还有 {daysLeft} 天</span>}
          </div>
          <div className="mt-5 flex items-center gap-5">
            <Progress type="circle" size={84} percent={Math.round((done / works.length) * 100)} format={() => `${done}/${works.length}`} strokeColor="#1677ff" />
            <div className="flex-1 space-y-1.5">
              {works.map((w) => (
                <div key={w.indicatorId} className="flex items-center gap-2 text-sm">
                  <span className="w-28 text-slate-700">{w.kind}</span>
                  <Tag color={WORK_STATUS[w.status].color} className="m-0">
                    {WORK_STATUS[w.status].label}
                  </Tag>
                </div>
              ))}
            </div>
          </div>
          {fixes.length > 0 && (
            <div className="mt-4 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 flex items-center gap-2">
              <ExclamationCircleFilled /> {fixes.map((f) => f.kind).join('、')} 有审核意见,需要修改后重新上传
            </div>
          )}
          <Button type="primary" size="large" className="mt-5" onClick={() => router.push('/teacher/task')}>
            进入评价任务 <ArrowRightOutlined />
          </Button>
        </div>

        {/* 我负责的专业 */}
        <div data-spec="teacher-majors" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <span className="text-xs font-bold text-slate-400">我负责的专业</span>
          <div className="space-y-4 mt-3">
            {DEMO_TEACHER.majors.map((m) => {
              const r = majorResult(LATEST_RESULT_TASK.id, m.name);
              return (
                <div key={m.name}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg font-bold text-slate-800">{m.name}</span>
                    {r && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: verdictMeta[r.verdict].color, backgroundColor: verdictMeta[r.verdict].bg }}>
                        {verdictMeta[r.verdict].label}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {r?.college} · {m.role}
                  </div>
                  {r && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {(
                        [
                          ['综合', r.overall],
                          ['一致性', r.consistency],
                          ['有效性', r.effectiveness],
                        ] as const
                      ).map(([l, v]) => (
                        <div key={l} className="rounded-lg bg-slate-50 py-2 text-center">
                          <div className="text-[11px] text-slate-400">{l}</div>
                          <div className="text-xl font-black text-slate-800">{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-2">{LATEST_RESULT_TASK.name}结果</div>
                  <Button className="mt-3" onClick={() => router.push('/teacher/result')}>
                    查看评价结果与诊断
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 历史评价任务 */}
      <div data-spec="teacher-history" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-3">历史评价任务</h3>
        <div className="divide-y divide-slate-100">
          {RESULT_TASKS.map((t) => {
            const r = majorResult(t.id, DEMO_TEACHER.majors[0].name);
            return (
              <div key={t.id} className="py-3 flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-700">{t.name}</span>
                <Tag color="success">资料已全部通过</Tag>
                {r && (
                  <span className="text-sm text-slate-500">
                    {DEMO_TEACHER.majors[0].name} · 综合 {r.overall} ·{' '}
                    <span style={{ color: verdictMeta[r.verdict].color }}>{verdictMeta[r.verdict].label}</span>
                  </span>
                )}
                <span className="ml-auto flex gap-3 text-sm">
                  <button className="text-blue-600 hover:underline" onClick={() => router.push(`/teacher/task?task=${t.id}`)}>
                    我提交的资料
                  </button>
                  <button className="text-blue-600 hover:underline" onClick={() => router.push(`/teacher/result?task=${t.id}`)}>
                    评价结果 <RightOutlined />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
