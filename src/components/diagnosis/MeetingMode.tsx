'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CloseOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
  MAJORS,
  verdictMeta,
  coreResult,
  sortedIssues,
  useResolvedIssues,
  DEMO_MAJOR,
  type Verdict,
} from '@/lib/diagnosis';
import { PRODUCT_NAME, TENANT_NAME } from '@/lib/brand';

// 会议模式(大屏):年度教育教学工作会议三环节连续演示
// ① 决策:全校专业结论 ② 管理:一致性/有效性 + 最大问题 ③ 整改:教师层面 / 管理层面
// 去导航、放大字号、深色高对比,适配投影
export const MEETING_STEPS = ['决策 · 全校专业结论', '管理 · 诊断分析', '整改 · 任务落实'] as const;

export default function MeetingMode({ open, initial = 0, onClose }: { open: boolean; initial?: number; onClose: () => void }) {
  // 每次打开都重新挂载,从指定环节开始
  if (!open) return null;
  return <MeetingScreen initial={initial} onClose={onClose} />;
}

function MeetingScreen({ initial, onClose }: { initial: number; onClose: () => void }) {
  const [step, setStep] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  }, [onClose]);

  useEffect(() => {
    ref.current?.requestFullscreen?.().catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') setStep((s) => Math.min(s + 1, 2));
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setStep((s) => Math.max(s - 1, 0));
      if (e.key === 'Escape') close();
    };
    const onFs = () => {
      if (!document.fullscreenElement) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [close, onClose]);

  return (
    <div ref={ref} className="fixed inset-0 z-[2000] bg-slate-950 text-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-12 py-6 border-b border-white/10 shrink-0">
        <div className="text-xl font-bold tracking-wide">
          {TENANT_NAME} · 年度教育教学工作会议
          <span className="text-white/40 font-normal ml-4">{PRODUCT_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          {MEETING_STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => setStep(i)}
              className={`text-base px-4 py-1.5 rounded-full transition-colors ${
                step === i ? 'bg-white text-slate-900 font-bold' : 'text-white/50 hover:text-white'
              }`}
            >
              {i + 1}. {s}
            </button>
          ))}
          <button onClick={close} className="ml-4 text-white/60 hover:text-white text-2xl" aria-label="退出会议模式">
            <CloseOutlined />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-12 py-10">
        {step === 0 && <DecisionSlide />}
        {step === 1 && <AnalysisSlide />}
        {step === 2 && <RectifySlide />}
      </div>

      <div className="flex items-center justify-between px-12 py-5 border-t border-white/10 text-white/40 text-sm shrink-0">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="disabled:opacity-20 hover:text-white text-lg">
          <LeftOutlined /> 上一环节
        </button>
        <span>← → 切换环节 · Esc 退出</span>
        <button disabled={step === 2} onClick={() => setStep(step + 1)} className="disabled:opacity-20 hover:text-white text-lg">
          下一环节 <RightOutlined />
        </button>
      </div>
    </div>
  );
}

function DecisionSlide() {
  const count = (v: Verdict) => MAJORS.filter((m) => m.verdict === v).length;
  return (
    <div>
      <h2 className="text-5xl font-black mb-3">全校 {MAJORS.length} 个专业,{count('GO')} 个可办</h2>
      <p className="text-2xl text-white/60 mb-10">
        {count('RISK')} 个有风险需优化,{count('NO')} 个建议缩减或停招
      </p>
      <div className="grid grid-cols-4 gap-5">
        {MAJORS.map((m) => {
          const v = verdictMeta[m.verdict];
          return (
            <div key={m.name} className="rounded-2xl p-5 border-2" style={{ borderColor: v.dot, backgroundColor: `${v.dot}1a` }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: v.dot }} />
                <span className="text-2xl font-bold truncate">{m.name}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: v.dot }}>
                {v.label} · 建议{m.layout}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnalysisSlide() {
  const cores = [coreResult('consistency'), coreResult('effectiveness')];
  const top = sortedIssues[0];
  return (
    <div>
      <h2 className="text-4xl font-black mb-8">{DEMO_MAJOR.name}专业 · 诊断结论</h2>
      <div className="grid grid-cols-2 gap-8 mb-10">
        {cores.map((r) => (
          <div key={r.key} className="rounded-3xl bg-white/5 border border-white/15 p-8">
            <div className="flex items-baseline justify-between mb-4">
              <span className="text-3xl font-bold">{r.name}</span>
              <span className="text-7xl font-black">{r.score}</span>
            </div>
            <div className="flex gap-2 mb-5">
              {r.links.map((l) => (
                <div
                  key={l.name}
                  className={`flex-1 rounded-lg py-2 text-center text-lg font-bold ${l.ok ? 'bg-emerald-500/25 text-emerald-300' : 'bg-red-500/30 text-red-300'}`}
                >
                  {l.name}
                </div>
              ))}
            </div>
            <div className="text-2xl text-white/80 leading-relaxed">{r.conclusion}</div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl bg-red-500/15 border-2 border-red-400/60 p-8">
        <div className="text-xl text-red-300 font-bold mb-2">今年先抓这一个问题</div>
        <div className="text-4xl font-black mb-3">{top.title}</div>
        <div className="text-2xl text-white/70">{top.detail}</div>
      </div>
    </div>
  );
}

function RectifySlide() {
  const { resolved } = useResolvedIssues();
  const groups = [
    { level: 'MANAGEMENT' as const, title: '管理层面' },
    { level: 'TEACHER' as const, title: '教师层面' },
  ];
  return (
    <div>
      <h2 className="text-4xl font-black mb-8">整改任务落实</h2>
      <div className="grid grid-cols-2 gap-8">
        {groups.map((g) => (
          <div key={g.level} className="rounded-3xl bg-white/5 border border-white/15 p-8">
            <div className="text-3xl font-bold mb-6">{g.title}</div>
            <div className="space-y-5">
              {sortedIssues
                .filter((i) => i.level === g.level)
                .map((i) => (
                  <div key={i.id} className="border-l-4 pl-5" style={{ borderColor: resolved.includes(i.id) ? '#10b981' : '#f59e0b' }}>
                    <div className="text-2xl font-bold">
                      {i.title}
                      {resolved.includes(i.id) && <span className="text-emerald-400 text-xl ml-3">已整改</span>}
                    </div>
                    <div className="text-xl text-white/60 mt-1">
                      {i.owner} · {i.due} 前
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
