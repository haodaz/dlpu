'use client';
import React from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CalendarOutlined,
  RobotOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  HeartFilled,
  CheckOutlined,
} from '@ant-design/icons';
import { indicators } from '@/lib/indicators';
import { sortedIssues, teacherItemOf, sourceOf, sourceMeta, DEMO_TEACHER, type Issue } from '@/lib/diagnosis';
import { useResolvedIssues, useSchoolState, useTaskStatus } from '@/lib/diagnosis-state';
import { useFilingState, type FilingStatus } from '@/lib/filing';

// 专业教师首页:按需触达
// "没有问题不打扰老师,哪个指标有问题才一定落到老师。"
// 不给仪表盘、雷达图、全量指标——只给"需要你做的这一项" + 标准要求 + 模板范本。
// 但"只有一张待办卡"会让老师觉得被点名、被派活,所以首页同时回答他心里的几个问题:
// 为什么找我、总共要做多少、要花多久、从哪开始、做完有人看吗。
export default function TeacherHome() {
  const router = useRouter();
  const { resolved, resolve, reset, ready } = useResolvedIssues();
  const { taskOf } = useTaskStatus();
  const { data } = useSchoolState();
  const mine = sortedIssues.filter((i) => i.level === 'TEACHER');
  const pending = mine.filter((i) => !resolved.includes(i.id));
  const done = mine.filter((i) => resolved.includes(i.id));
  const current = pending[0];

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto pt-2 pb-14">
      <Greeting pendingCount={pending.length} period={data.cycle.period} />

      <Workload mineCount={mine.length} />

      {current ? (
        <CurrentTask
          issue={current}
          order={mine.indexOf(current) + 1}
          total={mine.length}
          onDone={() => resolve(current.id)}
          onFill={() => router.push(`/data-management/ai-prefill/detail?indicator=${current.indicatorId}`)}
          onTemplate={(tid) => router.push(`/templates/${tid}`)}
        />
      ) : (
        <AllDone onReplay={reset} />
      )}

      {pending.length > 1 && <UpNext issues={pending.slice(1)} />}

      <Thanks done={done} doneAt={(id) => taskOf(id)?.updatedAt} />

      <div className="mt-8 flex items-center justify-between text-sm text-slate-400 flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5">
          <QuestionCircleOutlined /> 对要求有疑问,或觉得这项不该由您来做,可以直接联系{DEMO_TEACHER.contact}
        </span>
        <button className="hover:text-blue-500" onClick={() => router.push('/data-management/records')}>
          查看我的填报记录 →
        </button>
      </div>
    </div>
  );
}

// ---------- 问候:有温度,而且一句话说清楚今天的状态 ----------
function Greeting({ pendingCount, period }: { pendingCount: number; period?: string }) {
  const h = new Date().getHours();
  const hello = h < 6 ? '夜深了' : h < 11 ? '早上好' : h < 13 ? '中午好' : h < 18 ? '下午好' : '晚上好';
  const today = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  return (
    <div className="mb-6">
      <div className="text-sm text-slate-400">
        {today} · {DEMO_TEACHER.course}
        {period ? ` · ${period}专业评价` : ''}
      </div>
      <h1 className="text-[28px] font-bold text-slate-800 mt-1 mb-1 tracking-tight">
        {hello},{DEMO_TEACHER.call}
      </h1>
      <p className="text-[15px] text-slate-500 m-0">
        {pendingCount > 0
          ? `这一轮专业评价里,有 ${pendingCount} 件事需要您亲自来做。我们每次只给您一件,做完再告诉您下一件。`
          : '这一轮需要您做的事都已经完成了。'}
      </p>
    </div>
  );
}

// ---------- 工作量:让老师看到大部分材料不用他动手 ----------
function Workload({ mineCount }: { mineCount: number }) {
  const layers = (['AI', 'SCHOOL', 'TEACHER'] as const).map((k) => ({ k, n: indicators.filter((i) => sourceOf(i.id) === k).length }));
  const total = indicators.length;
  const auto = layers.filter((l) => l.k !== 'TEACHER').reduce((s, l) => s + l.n, 0);
  return (
    <div data-spec="teacher-workload" className="rounded-2xl border border-slate-200 bg-white px-6 py-5 mb-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-3">
        <div className="text-[15px] text-slate-700">
          这一轮评价共需要 <b>{total}</b> 类材料,其中 <b className="text-emerald-600">{auto} 类已经自动准备好</b>,不用您动手。
        </div>
        <div className="text-xs text-slate-400">需要老师本人写的只有教案、学情分析、形成性评价、综合性课程设计 4 类</div>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
        {layers.map(({ k, n }) => (
          <div key={k} style={{ width: `${(n / total) * 100}%`, backgroundColor: sourceMeta[k].color, opacity: k === 'TEACHER' ? 1 : 0.55 }} />
        ))}
      </div>
      <div className="flex gap-5 mt-2.5 text-xs text-slate-500 flex-wrap">
        {layers.map(({ k, n }) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sourceMeta[k].color }} />
            {k === 'AI' ? 'AI 自动整理' : k === 'SCHOOL' ? '学校系统导入' : '老师本人填写'} {n} 类
          </span>
        ))}
        <span className="ml-auto text-amber-700 font-medium">这一轮轮到您的:{mineCount} 项</span>
      </div>
    </div>
  );
}

// ---------- 当前这一件 ----------
const STEP_OF: Record<FilingStatus, number> = { 'not-started': 0, 'in-progress': 1, supplement: 1, pending: 2, submitted: 3 };

// 截止日按字面显示(不经时区换算,避免海外时区显示成前一天)
const monthDay = (d: string) => `${Number(d.slice(5, 7))}月${Number(d.slice(8, 10))}日`;

function daysLeft(due: string) {
  const ms = new Date(`${due}T23:59:59+08:00`).getTime() - Date.now();
  return Math.ceil(ms / 86400_000);
}

function CurrentTask({
  issue,
  order,
  total,
  onDone,
  onFill,
  onTemplate,
}: {
  issue: Issue;
  order: number;
  total: number;
  onDone: () => void;
  onFill: () => void;
  onTemplate: (templateId: string) => void;
}) {
  const t = teacherItemOf(issue.indicatorId);
  const filing = useFilingState(issue.indicatorId);
  const step = STEP_OF[filing.status];
  const left = daysLeft(issue.due);
  const dueText = monthDay(issue.due);
  const submitted = step >= 2;

  const steps = [
    { title: '看一眼要求和范本', desc: '知道做成什么样算数' },
    { title: filing.status === 'supplement' ? '按意见补充' : '填写', desc: t ? '可以先让 AI 起草' : '在填报页完成' },
    { title: '提交', desc: '教务处审核后反馈给您' },
  ];

  return (
    <div data-spec="teacher-task" className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      {/* 头部:是什么 + 为什么找您 */}
      <div className="px-7 pt-6 pb-5 bg-gradient-to-b from-amber-50/70 to-white">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-800">
            现在只需要做这一件 · 第 {order}/{total} 件
          </span>
          {t && <span className="text-xs text-slate-500 px-2 py-1 rounded-md bg-white border border-slate-200">{t.kind}</span>}
        </div>
        <h2 className="text-[22px] font-bold text-slate-800 m-0 leading-snug">{t ? `补一份${t.kind === '教案' ? '体现 AI 融入的教案' : t.kind}` : issue.title}</h2>
        <p className="text-[15px] text-slate-600 leading-relaxed mt-2 mb-0">
          这次专业评价发现:{issue.detail}
        </p>
        <p className="text-sm text-slate-500 leading-relaxed mt-2 mb-0">
          为什么找您:{t?.kind ?? '这类材料'}只有任课老师本人能写,AI 和学校系统都替代不了。这不是对您教学的评价,而是专业整体要补齐的证据。
        </p>

        <div className="flex gap-x-6 gap-y-2 mt-4 text-sm flex-wrap">
          {t && (
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <ClockCircleOutlined className="text-slate-400" /> 预计 {t.effort}
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 ${left <= 7 ? 'text-red-600 font-medium' : 'text-slate-600'}`}>
            <CalendarOutlined className={left <= 7 ? '' : 'text-slate-400'} /> {dueText}前完成{left > 0 ? `,还有 ${left} 天` : ',已到期'}
          </span>
          {t && (
            <span className="inline-flex items-center gap-1.5 text-violet-700">
              <RobotOutlined /> 可以用 AI 辅助起草
            </span>
          )}
        </div>
      </div>

      {/* 三步:跟着真实填报状态走 */}
      <div className="px-7 py-4 border-y border-slate-100 bg-white">
        <div className="grid grid-cols-3 gap-3">
          {steps.map((s, i) => {
            const isDone = i < step;
            const isNow = i === step || (step === 3 && i === 2);
            return (
              <div key={s.title} className="flex items-start gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                    isDone ? 'bg-emerald-500 text-white' : isNow ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? <CheckOutlined /> : i + 1}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-bold ${isDone ? 'text-slate-400' : isNow ? 'text-slate-800' : 'text-slate-400'}`}>{s.title}</div>
                  <div className="text-xs text-slate-400">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 达标要求 + 范本,同屏 */}
      <div className="grid grid-cols-1 md:grid-cols-[1.45fr_1fr]">
        <div className="p-7 md:border-r border-slate-100">
          <div className="text-sm font-bold text-slate-800 mb-3">做到这几点就算达标</div>
          <ul className="space-y-3 m-0 p-0 list-none">
            {(t?.standard ?? [issue.action]).map((s) => (
              <li key={s} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                <CheckCircleFilled className="mt-1 shrink-0" style={{ color: '#10b981' }} />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-7 bg-slate-50/70 flex flex-col gap-3">
          <div className="text-sm font-bold text-slate-800">有现成的可以参考</div>
          {t && (
            <button
              onClick={() => onTemplate(t.templateId)}
              className="w-full text-left rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileTextOutlined className="text-blue-600" /> {t.templateName}
              </div>
              <div className="text-xs text-slate-500 mt-1">填写示例 + 往届优秀范本,照着填就行</div>
            </button>
          )}
          {t && (
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 text-xs text-violet-800 leading-relaxed">
              <RobotOutlined className="mr-1" />
              {t.aiAssist}
            </div>
          )}
        </div>
      </div>

      {/* 行动 */}
      <div className="px-7 py-5 border-t border-slate-100 flex items-center gap-3 flex-wrap">
        {!submitted ? (
          <>
            <Button type="primary" size="large" onClick={onFill}>
              {step === 0 ? '开始填写' : filing.status === 'supplement' ? '按意见补充' : '继续填写'} <ArrowRightOutlined />
            </Button>
            <span className="text-sm text-slate-400">
              {step === 0 ? '可以随时保存,分几次做完也没关系' : filing.status === 'supplement' ? '教务处提了补充意见,补完再提交' : '草稿已保存,接着上次的继续'}
            </span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 text-emerald-700 font-medium">
              <CheckCircleFilled /> {filing.status === 'submitted' ? '已提交,教务处审核通过后会通知您' : '已提交,正在等教务处确认'}
            </span>
            <Button className="ml-auto" onClick={onDone}>
              这件完成了,看下一件
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- 接下来:只露出"还有几件、什么时候",不展开细节 ----------
function UpNext({ issues }: { issues: Issue[] }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-5 py-3.5 text-sm text-slate-500 flex items-center gap-3 flex-wrap">
      <span className="font-medium text-slate-600">之后还有 {issues.length} 件</span>
      {issues.map((i) => (
        <span key={i.id} className="px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-xs">
          {teacherItemOf(i.indicatorId)?.kind ?? i.title} · {monthDay(i.due)}前
        </span>
      ))}
      <span className="text-xs text-slate-400">做完这一件再推给您,现在不用管</span>
    </div>
  );
}

// ---------- 全部完成 ----------
function AllDone({ onReplay }: { onReplay: () => void }) {
  return (
    <div data-spec="teacher-task" className="rounded-2xl bg-white border border-slate-200 shadow-sm px-10 py-12 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 text-2xl flex items-center justify-center mx-auto">
        <CheckOutlined />
      </div>
      <div className="text-xl font-bold text-slate-800 mt-4">这一轮需要您做的,都完成了</div>
      <p className="text-[15px] text-slate-500 mt-2 mb-0 leading-relaxed">
        谢谢您。平时我们不会打扰您;
        <br />
        下一轮评价如果有只有您能补的材料,会提前推送到这里。
      </p>
      <button className="mt-6 text-xs text-slate-300 hover:text-slate-500" onClick={onReplay}>
        演示:重新推送任务
      </button>
    </div>
  );
}

// ---------- 已完成:让付出被看见 ----------
function Thanks({ done, doneAt }: { done: Issue[]; doneAt: (id: string) => string | undefined }) {
  if (!done.length) return null;
  return (
    <div className="mt-6">
      <div className="text-sm font-bold text-slate-700 mb-2 inline-flex items-center gap-1.5">
        <HeartFilled className="text-rose-400" /> 这一轮您已经完成的
      </div>
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {done.map((i) => {
          const t = teacherItemOf(i.indicatorId);
          const at = doneAt(i.id);
          return (
            <div key={i.id} className="px-5 py-3 flex items-center gap-3 text-sm">
              <CheckCircleFilled className="text-emerald-500" />
              <span className="text-slate-700">{t ? `${t.kind}:${i.title}` : i.title}</span>
              <span className="ml-auto text-xs text-slate-400">
                {at ? `${new Date(at).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })} 完成 · ` : ''}已计入本专业「
                {i.core === 'effectiveness' ? '有效性' : '一致性'}」评价
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
