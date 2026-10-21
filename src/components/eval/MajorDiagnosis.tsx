'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Tag, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, FileDoneOutlined, CheckCircleFilled, ExclamationCircleFilled, SyncOutlined, StarFilled, DownOutlined, UpOutlined } from '@ant-design/icons';
import { CORE_METRICS, DEMO_MAJOR, LAST_CYCLE, verdictMeta, type CoreKey, type PrevIssue } from '@/lib/diagnosis';
import { indicators, getIndicatorById } from '@/lib/indicators';
import { MOCK_REPORT } from '@/lib/mock-evaluation-report';
import { useTaskStatus, useResolvedIssues, type TaskStatus } from '@/lib/diagnosis-state';
import { RESULT_TASKS, LATEST_RESULT_TASK, coreLinks, indicatorScore, majorIssues, majorResult, staticRectDone, taskById, LINK_PASS, majorSlug } from '@/lib/eval-tasks';

// 某专业某次评价的诊断详情(管理员与教师共用)
// 按产品反馈:分析结果默认展开、支撑指标可点开看;问题全部平铺,不再整改完一个才露出下一个
export default function MajorDiagnosis({ taskId, major, mode = 'admin' }: { taskId: string; major: string; mode?: 'admin' | 'teacher' }) {
  const router = useRouter();
  const task = taskById(taskId) ?? LATEST_RESULT_TASK;
  const r = majorResult(task.id, major);
  const k = RESULT_TASKS.findIndex((t) => t.id === task.id);
  const prevTask = RESULT_TASKS[k + 1];
  const prev = prevTask ? majorResult(prevTask.id, major) : null;
  const live = major === DEMO_MAJOR.name && task.id === LATEST_RESULT_TASK.id; // 示例专业最近一次:整改状态取数据库
  if (!r) return <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-400">该任务还没有评价结果</div>;
  const vm = verdictMeta[r.verdict];
  const delta = (a: number, b?: number) => (b === undefined ? null : Math.round((a - b) * 10) / 10);

  return (
    <div className="space-y-5">
      {/* 结论 */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-wrap items-center gap-6">
        <div className="flex-1 min-w-[16rem]">
          <div className="text-xs text-slate-400">
            {task.name} · {r.college}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800 m-0">{major}</h2>
            <span className="text-sm font-bold px-2.5 py-1 rounded-lg" style={{ color: vm.color, backgroundColor: vm.bg }}>
              {vm.label}
            </span>
          </div>
        </div>
        {(
          [
            ['综合', r.overall, prev?.overall],
            ['一致性', r.consistency, prev?.consistency],
            ['有效性', r.effectiveness, prev?.effectiveness],
          ] as const
        ).map(([label, v, p]) => {
          const d = delta(v, p);
          return (
            <div key={label} className="text-center min-w-[5.5rem]">
              <div className="text-xs text-slate-400">{label}</div>
              <div className="text-3xl font-black text-slate-800">{v}</div>
              {d !== null && (
                <div className={`text-xs font-bold ${d >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {d >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(d)} 较上次
                </div>
              )}
            </div>
          );
        })}
        {mode === 'admin' && (
          <Button icon={<FileDoneOutlined />} onClick={() => router.push(`/rectification/report?major=${majorSlug(major)}&task=${task.id}`)}>
            整改与跟踪报告
          </Button>
        )}
      </div>

      {/* 分析结果(默认展开) */}
      <div data-spec="core-metrics" className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {(['consistency', 'effectiveness'] as CoreKey[]).map((key) => (
          <CoreBlock key={key} taskId={task.id} major={major} metric={key} score={r[key]} />
        ))}
      </div>

      {/* 指标得分与缺失点 */}
      <IndicatorTable taskId={task.id} major={major} />

      {/* 问题平铺 */}
      <IssueList taskId={task.id} major={major} live={live} />

      {/* 纵向回看 */}
      {prevTask && prev && <Vertical taskId={task.id} prevTaskId={prevTask.id} major={major} showPrevIssues={live} />}
    </div>
  );
}

function CoreBlock({ taskId, major, metric, score }: { taskId: string; major: string; metric: CoreKey; score: number }) {
  const router = useRouter();
  const m = CORE_METRICS.find((c) => c.key === metric)!;
  const links = coreLinks(taskId, major, metric);
  const weakest = [...links].sort((a, b) => a.score - b.score)[0];
  const verdict = score >= 90 ? '达成' : score >= 80 ? '基本达成' : '未达成';
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-800">{m.name}</span>
            <span className="text-xs text-slate-400">{m.audience}</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">{m.question}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-4xl font-black text-slate-800">{score}</div>
          <Tag color={verdict === '达成' ? 'success' : verdict === '基本达成' ? 'gold' : 'error'}>{verdict}</Tag>
        </div>
      </div>
      <p className="text-[15px] text-slate-700 mt-3 mb-4 leading-relaxed">
        短板在「{weakest.name}」:{weakest.insight}
      </p>
      <div className="space-y-3">
        {links.map((l) => (
          <div key={l.name}>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-16 shrink-0 font-bold text-slate-700">{l.name}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded">
                <div className={`h-2 rounded ${l.ok ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${l.score}%` }} />
              </div>
              <span className={`w-12 text-right font-mono text-xs font-bold ${l.ok ? 'text-slate-600' : 'text-red-500'}`}>{l.score}</span>
            </div>
            {!l.ok && <div className="text-xs text-red-500 mt-1 ml-[4.75rem]">{l.insight}</div>}
            <div className="flex flex-wrap gap-1.5 mt-1.5 ml-[4.75rem]">
              {l.indicatorIds.map((id) => {
                const ind = getIndicatorById(id);
                const s = indicatorScore(taskId, major, id);
                return (
                  <button
                    key={id}
                    onClick={() => router.push(`/admin/indicator-analysis?id=${id}`)}
                    className={`text-[11px] px-2 py-0.5 rounded border hover:border-blue-400 ${s >= LINK_PASS ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-red-50 border-red-200 text-red-600'}`}
                  >
                    {id} {ind?.name} · {s}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IndicatorTable({ taskId, major }: { taskId: string; major: string }) {
  const router = useRouter();
  const [all, setAll] = useState(false);
  const rows = indicators.map((i) => {
    const s = indicatorScore(taskId, major, i.id);
    const detail = MOCK_REPORT.indicators?.find((x) => x.id === i.id);
    const isDemo = major === DEMO_MAJOR.name && taskId === LATEST_RESULT_TASK.id;
    let gaps = isDemo ? detail?.deductions ?? [] : s < LINK_PASS ? [`得分 ${s},低于达标线 ${LINK_PASS};${detail?.deductions?.[0] ?? '支撑材料不完整'}`] : [];
    if (!gaps.length && s < LINK_PASS) gaps = [`得分 ${s},低于达标线 ${LINK_PASS}${detail ? '' : ';支撑材料未提交或不完整'}`];
    return { i, s, gaps };
  });
  const shown = all ? rows : rows.filter((x) => x.s < LINK_PASS || x.gaps.length);
  return (
    <div data-spec="indicator-table" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-800 m-0">指标得分与缺失点</h3>
        <button className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1" onClick={() => setAll((v) => !v)}>
          {all ? (
            <>
              只看有缺失的 <UpOutlined />
            </>
          ) : (
            <>
              展开全部 {rows.length} 项 <DownOutlined />
            </>
          )}
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {shown.map(({ i, s, gaps }) => (
          <div key={i.id} className="py-3 flex gap-4 items-start">
            <span className="font-mono text-xs text-slate-400 w-10 shrink-0 mt-0.5">{i.id}</span>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-700 text-sm">{i.name}</div>
              {gaps.length > 0 ? (
                <ul className="m-0 mt-1 pl-4 text-xs text-slate-500 space-y-0.5">
                  {gaps.map((g, k) => (
                    <li key={k}>{g}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-xs text-slate-400 mt-1">无明显缺失</div>
              )}
            </div>
            <span className={`w-12 text-right font-black ${s >= LINK_PASS ? 'text-slate-700' : 'text-red-500'}`}>{s}</span>
            <button className="text-xs text-blue-600 hover:underline shrink-0 mt-1" onClick={() => router.push(`/admin/indicator-analysis?id=${i.id}`)}>
              分析逻辑
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const RECT_LABEL: Record<TaskStatus, { text: string; color: string }> = {
  todo: { text: '待整改', color: 'default' },
  doing: { text: '整改中', color: 'processing' },
  done: { text: '已完成', color: 'success' },
};

function IssueList({ taskId, major, live }: { taskId: string; major: string; live: boolean }) {
  const router = useRouter();
  const issues = majorIssues(taskId, major);
  const { statusOf } = useTaskStatus();
  const { resolved } = useResolvedIssues();
  const doneN = live ? issues.filter((i) => resolved.includes(i.id)).length : staticRectDone(taskId, major, issues.length);
  return (
    <div data-spec="issue-list" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-800 m-0">重点问题与整改建议({issues.length})</h3>
        <span className="text-xs text-slate-400">
          已整改 {doneN}/{issues.length} · 按本年度重点环节与影响排序
        </span>
      </div>
      {issues.length === 0 && <div className="text-sm text-slate-400">本次评价没有发现未达标的环节。</div>}
      <div className="space-y-3">
        {issues.map((issue, idx) => {
          const st: TaskStatus = live ? (resolved.includes(issue.id) ? 'done' : statusOf(issue.id)) : idx < doneN ? 'done' : 'todo';
          const ind = getIndicatorById(issue.indicatorId);
          return (
            <div key={issue.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">
                  {idx + 1}. {issue.title}
                </span>
                {issue.focus && (
                  <Tag color="orange" icon={<StarFilled />}>
                    本年度重点环节
                  </Tag>
                )}
                <Tag color={issue.level === 'TEACHER' ? 'gold' : 'blue'}>{issue.level === 'TEACHER' ? '教师层面' : '管理层面'}</Tag>
                <Tag color={RECT_LABEL[st].color} className="ml-auto">
                  {RECT_LABEL[st].text}
                </Tag>
              </div>
              <p className="text-sm text-slate-600 mt-2 mb-2">{issue.detail}</p>
              <div className="rounded-lg bg-blue-50/60 border border-blue-100 px-3 py-2 text-sm text-slate-700">
                <b className="text-blue-700">整改建议:</b>
                {issue.action}
                <div className="text-xs text-slate-400 mt-1">
                  责任方:{issue.owner} · 建议完成:{issue.due}
                </div>
              </div>
              <button className="text-xs text-blue-600 hover:underline mt-2" onClick={() => router.push(`/admin/indicator-analysis?id=${issue.indicatorId}`)}>
                依据指标 {ind?.id} {ind?.name} · 为什么是这个结论 →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PREV_STATUS: Record<PrevIssue['status'], { label: string; icon: React.ReactNode; cls: string }> = {
  resolved: { label: '已解决', icon: <CheckCircleFilled />, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  improving: { label: '好转中', icon: <SyncOutlined />, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
  persisting: { label: '仍存在', icon: <ExclamationCircleFilled />, cls: 'text-red-600 bg-red-50 border-red-200' },
};

function Vertical({ taskId, prevTaskId, major, showPrevIssues }: { taskId: string; prevTaskId: string; major: string; showPrevIssues: boolean }) {
  const prevName = taskById(prevTaskId)!.period;
  return (
    <div className="space-y-4">
      <div data-spec="review-trend" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-1">纵向回看 · 与{prevName}相比</h3>
        <p className="text-xs text-slate-400 mt-0 mb-4">灰条为上次,彩条为本次;红色为本次仍未达标(&lt; {LINK_PASS})的环节</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(['consistency', 'effectiveness'] as CoreKey[]).map((key) => {
            const now = coreLinks(taskId, major, key);
            const before = coreLinks(prevTaskId, major, key);
            return (
              <div key={key} className="space-y-2">
                <div className="text-sm font-bold text-slate-700">{CORE_METRICS.find((c) => c.key === key)!.name}</div>
                {now.map((l) => {
                  const p = before.find((x) => x.name === l.name)!.score;
                  const d = Math.round((l.score - p) * 10) / 10;
                  return (
                    <div key={l.name} className="flex items-center gap-3 text-sm">
                      <span className="w-16 text-slate-600">{l.name}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded relative">
                        <div className="absolute h-2 rounded bg-slate-300" style={{ width: `${p}%` }} />
                        <div className={`absolute h-2 rounded ${l.ok ? 'bg-emerald-500' : 'bg-red-400'}`} style={{ width: `${l.score}%`, opacity: 0.85 }} />
                      </div>
                      <Tooltip title={`${p} → ${l.score}`}>
                        <span className={`w-12 text-right font-mono text-xs font-bold ${d >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{d >= 0 ? `+${d}` : d}</span>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {showPrevIssues && (
        <div data-spec="review-issues" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 m-0 mb-1">{LAST_CYCLE.label}的大问题,这次解决了吗</h3>
          <p className="text-xs text-slate-400 mt-0 mb-4">「仍存在」的问题已并入本次的问题清单</p>
          <div className="space-y-3">
            {LAST_CYCLE.issues.map((i) => {
              const st = PREV_STATUS[i.status];
              return (
                <div key={i.title} className="flex items-start gap-3 border-b border-slate-50 pb-3">
                  <span className={`shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded border ${st.cls}`}>
                    {st.icon} {st.label}
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800">{i.title}</div>
                    <div className="text-sm text-slate-600 mt-0.5">{i.note}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
