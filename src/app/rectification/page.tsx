'use client';
import React, { useState } from 'react';
import { Button, Segmented, Select, Modal } from 'antd';
import { useRouter } from 'next/navigation';
import { PrinterOutlined, FileDoneOutlined, DownloadOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import {
  sortedIssues,
  teacherItemOf,
  useTaskStatus,
  useResolvedIssues,
  useCycle,
  coreResult,
  ANNUAL_FOCUS,
  DEMO_MAJOR,
  type IssueLevel,
  type TaskStatus,
} from '@/lib/diagnosis';
import { getIndicatorById } from '@/lib/indicators';
import { TENANT_NAME } from '@/lib/brand';

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: '已派发' },
  { value: 'doing', label: '整改中' },
  { value: 'done', label: '已完成' },
];
const statusColor: Record<TaskStatus, string> = { todo: '#94a3b8', doing: '#f59e0b', done: '#10b981' };

// 问题整改报告:由诊断结论生成,分教师层面 / 管理层面,含标准要求与范本,可打印分发
export default function RectificationPage() {
  const router = useRouter();
  const [level, setLevel] = useState<'ALL' | IssueLevel>('ALL');
  const { statusOf, setStatus, resetAll, ready } = useTaskStatus();
  const { resolved, resolve, unresolve, reset } = useResolvedIssues();
  const [cycle, setCycle] = useCycle();
  const [modal, modalHolder] = Modal.useModal();

  const groups: { level: IssueLevel; title: string; desc: string }[] = [
    { level: 'MANAGEMENT', title: '管理层面整改', desc: '面向教务处、学院、专业负责人:方向与设置层面的问题' },
    { level: 'TEACHER', title: '教师层面整改', desc: '面向任课教师:照着标准与范本补齐,只推送有问题的那一项' },
  ];
  const shownGroups = groups.filter((g) => level === 'ALL' || g.level === level);

  const statusFor = (id: string): TaskStatus => (resolved.includes(id) ? 'done' : statusOf(id));
  const doneCount = sortedIssues.filter((i) => statusFor(i.id) === 'done').length;
  const allDone = doneCount === sortedIssues.length;

  const nextCycle = () => {
    modal.confirm({
      title: `发起第 ${cycle + 1} 轮诊断?`,
      content: '本轮问题与整改记录将归档用于纵向回看,下一轮将根据本轮结果推荐新的聚焦点。',
      okText: '发起',
      cancelText: '取消',
      onOk: () => {
        setCycle(cycle + 1);
        reset();
        resetAll();
      },
    });
  };

  const cores = [coreResult('consistency'), coreResult('effectiveness')];

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {modalHolder}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap no-print">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white text-xl shadow-sm">
            <FileDoneOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">整改报告与任务跟踪</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">由诊断结论自动生成 · 第 {cycle} 轮 · 已完成 {doneCount}/{sortedIssues.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            value={level}
            onChange={(v) => setLevel(v as typeof level)}
            options={[
              { value: 'ALL', label: '全部' },
              { value: 'MANAGEMENT', label: '管理层面' },
              { value: 'TEACHER', label: '教师层面' },
            ]}
          />
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印 / 导出 PDF</Button>
        </div>
      </div>

      {/* 报告正文(打印区) */}
      <div data-spec="rect-report" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10">
        <div className="text-center border-b border-slate-200 pb-6 mb-6">
          <div className="text-sm text-slate-400">{TENANT_NAME} · 第 {cycle} 轮专业诊断</div>
          <h2 className="text-2xl font-black text-slate-800 mt-2 mb-1">
            {DEMO_MAJOR.name}专业问题整改报告
            {level !== 'ALL' && <span className="text-slate-500">({level === 'TEACHER' ? '教师层面' : '管理层面'})</span>}
          </h2>
          <div className="text-sm text-slate-500 flex items-center justify-center gap-1">
            <StarFilled className="text-amber-500" /> 本年度重点环节:{ANNUAL_FOCUS}
          </div>
        </div>

        <section className="mb-8">
          <h3 className="text-base font-bold text-slate-800 mb-3">一、诊断结论</h3>
          <div className="grid grid-cols-2 gap-4">
            {cores.map((r) => (
              <div key={r.key} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-700">{r.name}</span>
                  <span className="text-2xl font-black text-slate-800">{r.score}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2 mb-0 leading-relaxed">{r.conclusion}</p>
              </div>
            ))}
          </div>
        </section>

        {shownGroups.map((g, gi) => {
          const list = sortedIssues.filter((i) => i.level === g.level);
          return (
            <section key={g.level} className={`mb-8 ${gi > 0 ? 'print-break' : ''}`}>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                {level === 'ALL' ? (gi === 0 ? '二、' : '三、') : '二、'}
                {g.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0 mb-3">{g.desc}</p>
              <div className="space-y-4">
                {list.map((issue, idx) => {
                  const ind = getIndicatorById(issue.indicatorId);
                  const tItem = teacherItemOf(issue.indicatorId);
                  const st = statusFor(issue.id);
                  return (
                    <div key={issue.id} className="rounded-xl border border-slate-200 p-5 break-inside-avoid">
                      <div className="flex items-start gap-3 mb-2">
                        <span className="font-bold text-slate-400">{idx + 1}.</span>
                        <div className="flex-1">
                          <div className="font-bold text-slate-800 text-[15px]">{issue.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            依据指标 {ind?.id} {ind?.name}
                          </div>
                        </div>
                        {ready && (
                          <Select
                            size="small"
                            className="w-24 no-print"
                            value={st}
                            onChange={(v) => {
                              setStatus(issue.id, v);
                              if (v === 'done') resolve(issue.id);
                              else unresolve(issue.id);
                            }}
                            options={statusOptions}
                          />
                        )}
                        <span className="hidden print:inline text-xs font-bold" style={{ color: statusColor[st] }}>
                          {statusOptions.find((o) => o.value === st)?.label}
                        </span>
                      </div>
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          <Row label="问题">{issue.detail}</Row>
                          <Row label="整改要求">{issue.action}</Row>
                          {tItem && (
                            <Row label="标准要求">
                              <ul className="m-0 pl-4 space-y-0.5">
                                {tItem.standard.map((s) => (
                                  <li key={s}>{s}</li>
                                ))}
                              </ul>
                            </Row>
                          )}
                          {tItem && (
                            <Row label="模板范本">
                              <button
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                onClick={() => router.push(`/templates/${tItem.templateId}`)}
                              >
                                <DownloadOutlined /> {tItem.templateName}
                              </button>
                            </Row>
                          )}
                          <Row label="责任人">{issue.owner}</Row>
                          <Row label="完成时间">{issue.due}</Row>
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* 闭环:下一轮 */}
      <div data-spec="rect-cycle" className="no-print mt-5 rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-bold text-slate-800">
            {allDone ? '本轮整改已全部完成' : `本轮还有 ${sortedIssues.length - doneCount} 项整改未完成`}
          </div>
          <div className="text-sm text-slate-500 mt-0.5">
            诊断 → 分析 → 整改 → 建设 → 评价 → 下一轮。{allDone ? '可以发起下一轮,聚焦下一个改进点。' : '全部完成后可发起下一轮。'}
          </div>
        </div>
        <Button type="primary" icon={<ReloadOutlined />} disabled={!allDone} onClick={nextCycle}>
          发起第 {cycle + 1} 轮诊断
        </Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-t border-slate-100">
      <td className="py-2 pr-4 align-top text-slate-400 whitespace-nowrap w-20">{label}</td>
      <td className="py-2 text-slate-700 leading-relaxed">{children}</td>
    </tr>
  );
}
