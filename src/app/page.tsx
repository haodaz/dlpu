'use client';
import React from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import {
  CheckOutlined,
  DownloadOutlined,
  EditOutlined,
  CheckCircleFilled,
  SmileOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { sortedIssues, teacherItemOf } from '@/lib/diagnosis';
import { useResolvedIssues } from '@/lib/diagnosis-state';
import { getIndicatorById } from '@/lib/indicators';

// 专业教师首页:按需触达
// "没有问题不打扰老师,哪个指标有问题才一定落到老师。"
// 不给仪表盘、雷达图、全量指标——只给"需要你做的这一项" + 标准要求 + 模板范本
export default function TeacherHome() {
  const router = useRouter();
  const { resolved, resolve, reset, ready } = useResolvedIssues();
  const mine = sortedIssues.filter((i) => i.level === 'TEACHER');
  const pending = mine.filter((i) => !resolved.includes(i.id));
  const current = pending[0];

  if (!ready) return null;

  return (
    <div className="max-w-3xl mx-auto pt-4 pb-12">
      <h1 className="text-2xl font-bold text-slate-800 m-0">老师,您好</h1>
      <p className="text-slate-500 mt-1 mb-6">
        {current ? '本轮诊断有一项需要您补充,完成后再告诉您下一项。' : '目前没有需要您处理的事项。'}
      </p>

      {current ? (
        <CurrentTask
          issueId={current.id}
          onDone={() => resolve(current.id)}
          onFill={(id) => router.push(`/data-management/ai-prefill/detail?indicator=${id}`)}
          onTemplate={(tid) => router.push(`/templates/${tid}`)}
        />
      ) : (
        <div data-spec="teacher-task" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
          <SmileOutlined className="text-5xl text-emerald-500" />
          <div className="text-lg font-bold text-slate-800 mt-4">没有需要您做的事</div>
          <p className="text-sm text-slate-500 mt-1 mb-5">诊断发现与您相关的问题时,会第一时间推送到这里。</p>
          <Button size="small" onClick={reset}>演示:重新推送任务</Button>
        </div>
      )}

      <div className="flex items-center justify-between mt-5 text-sm text-slate-400">
        <span>
          本轮推送给您 {mine.length} 项 · 已完成 {mine.length - pending.length} 项
        </span>
        <button className="hover:text-blue-500 inline-flex items-center gap-1" onClick={() => router.push('/data-management/records')}>
          <HistoryOutlined /> 填报记录
        </button>
      </div>
    </div>
  );
}

function CurrentTask({
  issueId,
  onDone,
  onFill,
  onTemplate,
}: {
  issueId: string;
  onDone: () => void;
  onFill: (indicatorId: string) => void;
  onTemplate: (templateId: string) => void;
}) {
  const issue = sortedIssues.find((i) => i.id === issueId)!;
  const ind = getIndicatorById(issue.indicatorId);
  const t = teacherItemOf(issue.indicatorId);

  return (
    <div data-spec="teacher-task" className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-7 pt-7 pb-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold px-2 py-1 rounded bg-orange-50 text-orange-700 border border-orange-200">
            需要您做的这一项
          </span>
          {t && <span className="text-xs text-slate-400">类别:{t.kind}</span>}
          <span className="text-xs text-slate-400 ml-auto">请在 {issue.due} 前完成</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 m-0">{issue.title}</h2>
        <p className="text-[15px] text-slate-600 leading-relaxed mt-2 mb-0">{issue.detail}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] border-t border-slate-100">
        <div className="p-7 md:border-r border-slate-100">
          <div className="text-sm font-bold text-slate-800 mb-3">做成什么样算达标</div>
          <ul className="space-y-2.5 m-0 p-0 list-none">
            {(t?.standard ?? [issue.action]).map((s) => (
              <li key={s} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                <CheckCircleFilled className="text-emerald-500 mt-1 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-7 bg-slate-50/60">
          <div className="text-sm font-bold text-slate-800 mb-3">照着范本填</div>
          {t && (
            <button
              onClick={() => onTemplate(t.templateId)}
              className="w-full text-left rounded-xl border border-blue-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <DownloadOutlined /> {t.templateName}
              </div>
              <div className="text-xs text-slate-500 mt-1">含填写示例与优秀范本</div>
            </button>
          )}
          <div className="text-xs text-slate-400 mt-3">
            依据指标 {ind?.id} {ind?.name}
          </div>
        </div>
      </div>

      <div className="px-7 py-5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
        <Button type="primary" size="large" icon={<EditOutlined />} onClick={() => onFill(issue.indicatorId)}>
          去填报
        </Button>
        <Button size="large" icon={<CheckOutlined />} onClick={onDone}>
          已提交,看下一项
        </Button>
      </div>
    </div>
  );
}
