'use client';
import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Breadcrumb, Select } from 'antd';
import { MAJORS, DEMO_MAJOR } from '@/lib/diagnosis';
import { LATEST_RESULT_TASK, RESULT_TASKS, majorSlug } from '@/lib/eval-tasks';
import { TaskHeader, useTaskParam } from '@/components/eval/TaskBar';
import MajorDiagnosis from '@/components/eval/MajorDiagnosis';

// 具体专业的诊断页(从诊断分析 / 评价结果的专业列表进入)
export default function Page() {
  return (
    <Suspense fallback={null}>
      <MajorPage />
    </Suspense>
  );
}

function MajorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const major = params.get('major') ?? DEMO_MAJOR.name;
  const [task, setTask] = useTaskParam(LATEST_RESULT_TASK);
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <Breadcrumb
        items={[
          { title: <a onClick={() => router.push(`/admin?task=${task.id}`)}>诊断分析</a> },
          { title: major },
        ]}
      />
      <TaskHeader
        title={`专业诊断 · ${major}`}
        desc="分析结果默认展开;支撑指标、问题与整改建议全部平铺"
        task={task}
        onTask={setTask}
        tasks={RESULT_TASKS}
        extra={
          <Select
            value={major}
            style={{ minWidth: 200 }}
            onChange={(m) => router.replace(`/admin/diagnosis?major=${majorSlug(m)}&task=${task.id}`)}
            options={MAJORS.map((m) => ({ value: m.name, label: m.name }))}
            showSearch
          />
        }
      />
      <MajorDiagnosis taskId={task.id} major={major} />
    </div>
  );
}
