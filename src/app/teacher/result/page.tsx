'use client';
import React, { Suspense, useState } from 'react';
import { Select } from 'antd';
import { DEMO_TEACHER } from '@/lib/diagnosis';
import { LATEST_RESULT_TASK, RESULT_TASKS } from '@/lib/eval-tasks';
import { TaskHeader, useTaskParam } from '@/components/eval/TaskBar';
import MajorDiagnosis from '@/components/eval/MajorDiagnosis';

// 教师 · 专业评价结果:查看本人负责专业在每次评价任务中的结果与诊断(与管理员看到的同一份)
export default function Page() {
  return (
    <Suspense fallback={null}>
      <TeacherResult />
    </Suspense>
  );
}

function TeacherResult() {
  const [task, setTask] = useTaskParam(LATEST_RESULT_TASK);
  const majors = DEMO_TEACHER.majors;
  const [major, setMajor] = useState(majors[0].name);
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <TaskHeader
        title="专业评价结果"
        desc="您负责专业的评价结果与诊断分析"
        task={task}
        onTask={setTask}
        tasks={RESULT_TASKS}
        extra={majors.length > 1 ? <Select value={major} onChange={setMajor} options={majors.map((m) => ({ value: m.name, label: m.name }))} style={{ minWidth: 180 }} /> : undefined}
      />
      <MajorDiagnosis taskId={task.id} major={major} mode="teacher" />
    </div>
  );
}
