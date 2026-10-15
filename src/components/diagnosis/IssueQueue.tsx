'use client';
import React from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { CheckOutlined, ArrowRightOutlined, AimOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { sortedIssues, type IssueLevel } from '@/lib/diagnosis';
import { useResolvedIssues } from '@/lib/diagnosis-state';
import { getIndicatorById } from '@/lib/indicators';

// 「一次只给一个问题」:只渲染队首 1 条,整改完再露出下一条
export default function IssueQueue({ level, title = '当前最需要解决的问题' }: { level?: IssueLevel; title?: string }) {
  const router = useRouter();
  const { resolved, resolve, reset, ready } = useResolvedIssues();
  const queue = sortedIssues.filter((i) => !level || i.level === level);
  const pending = queue.filter((i) => !resolved.includes(i.id));
  const current = pending[0];
  const doneCount = queue.length - pending.length;

  if (!ready) return <div className="h-[220px] rounded-2xl bg-white border border-slate-200 animate-pulse" />;

  if (!current) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl mb-3">
          <CheckOutlined />
        </div>
        <div className="text-lg font-bold text-emerald-800">本轮 {queue.length} 个问题已全部整改</div>
        <p className="text-sm text-emerald-700 mt-1 mb-4">可以发起下一轮诊断,聚焦下一个改进点。</p>
        <Button icon={<ReloadOutlined />} onClick={reset}>演示:重置问题队列</Button>
      </div>
    );
  }

  const ind = getIndicatorById(current.indicatorId);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-100">
        <span className="text-sm font-bold text-slate-600 flex items-center gap-2">
          <AimOutlined className="text-red-500" />
          {title}
        </span>
        <span className="text-xs text-slate-400">
          第 {doneCount + 1} / {queue.length} 个 · 整改完再看下一个
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-3 flex-wrap">
          <h3 className="text-xl font-bold text-slate-800 m-0 flex-1 min-w-[240px]">{current.title}</h3>
          {current.focus && (
            <span className="text-xs font-bold px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
              <StarFilled /> 本年度重点环节
            </span>
          )}
          <span
            className={`text-xs font-bold px-2 py-1 rounded border ${
              current.level === 'TEACHER'
                ? 'bg-orange-50 text-orange-700 border-orange-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {current.level === 'TEACHER' ? '教师层面' : '管理层面'}
          </span>
        </div>
        <p className="text-slate-600 text-[15px] leading-relaxed m-0 mb-4">{current.detail}</p>
        <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 mb-4">
          <div className="text-xs font-bold text-blue-700 mb-1">整改建议</div>
          <div className="text-sm text-slate-700 leading-relaxed">{current.action}</div>
          <div className="text-xs text-slate-500 mt-2">
            责任方:{current.owner} · 建议完成:{current.due}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button type="primary" icon={<CheckOutlined />} onClick={() => resolve(current.id)}>
            已整改,看下一个
          </Button>
          <Button onClick={() => router.push(`/admin/indicator-analysis?id=${current.indicatorId}`)}>
            为什么是这个结论 <ArrowRightOutlined />
          </Button>
          {ind && <span className="text-xs text-slate-400 ml-1">依据指标 {ind.id} {ind.name}</span>}
        </div>
      </div>
    </div>
  );
}
