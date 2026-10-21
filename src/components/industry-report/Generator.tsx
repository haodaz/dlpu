'use client';
import React, { useState } from 'react';
import { LoadingOutlined, CheckCircleFilled, MinusCircleOutlined, CloseCircleFilled } from '@ant-design/icons';
import type { IndustryReport, ProgressEvent, ReportInput } from '@/lib/industry-report/types';

// 产业分析报告生成:调用流水线(SSE),带进度;产业分析报告页与教师白皮书工具共用

const STEPS: { key: string; label: string }[] = [
  { key: 'history', label: '查询检索日志与知识库' },
  { key: 'plan', label: '拆分技术方向与检索式' },
  { key: 'openalex', label: 'OpenAlex 论文年度统计' },
  { key: 'policy', label: '政策检索与抽取' },
  { key: 'chain', label: '产业链与岗位检索与抽取' },
  { key: 'regional', label: '区域产业画像(底库 / 现查)' },
  { key: 'extend', label: '重点企业 · 关键岗位 · 人才供需(平方企业库 / 职业库 + 检索)' },
  { key: 'insight', label: '综合研判 + 数字校验' },
  { key: 'narrative', label: '撰写研究报告正文 + 数字校验' },
  { key: 'weak', label: '早期弱信号扫描' },
];


export type StepState = Record<string, { status: 'working' | 'done' | 'skipped' | 'error'; detail?: string }>;

// 当前操作者(演示环境无登录,取顶栏的角色切换)
function currentUser() {
  try {
    return { role: localStorage.getItem('app_role') || 'user', name: localStorage.getItem('app_user_name') || '' };
  } catch {
    return { role: 'unknown', name: '' };
  }
}

export function useReportGenerator() {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<StepState>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');

  const generate = async (input: ReportInput, entry: string): Promise<IndustryReport | null> => {
    setRunning(true);
    setSteps({});
    setLogs([]);
    setError('');
    let report: IndustryReport | null = null;
    try {
      const res = await fetch('/api/industry-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...input, entry, user: currentUser() }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `请求失败 ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop() ?? '';
        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim();
          if (!line) continue;
          const e = JSON.parse(line) as ProgressEvent;
          if (e.type === 'step') setSteps((s) => ({ ...s, [e.step]: { status: e.status, detail: e.detail } }));
          if (e.type === 'log') setLogs((l) => [...l, e.message]);
          if (e.type === 'error') setError(e.message);
          if (e.type === 'result') report = e.report;
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
    return report;
  };

  return { running, steps, logs, error, generate };
}

export function Progress({ steps, logs, error, running }: { steps: StepState; logs: string[]; error: string; running: boolean }) {
  return (
    <div className="no-print rounded-2xl bg-white border border-slate-200 shadow-sm p-5 mb-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
        {STEPS.map((s) => {
          const st = steps[s.key];
          const icon =
            st?.status === 'done' ? (
              <CheckCircleFilled className="text-emerald-500" />
            ) : st?.status === 'working' ? (
              <LoadingOutlined className="text-blue-500" />
            ) : st?.status === 'skipped' ? (
              <MinusCircleOutlined className="text-slate-400" />
            ) : st?.status === 'error' ? (
              <CloseCircleFilled className="text-red-500" />
            ) : (
              <span className="inline-block w-3.5 h-3.5 rounded-full border border-slate-300" />
            );
          return (
            <div key={s.key} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5">{icon}</span>
              <div>
                <div className={st ? 'text-slate-700 font-medium' : 'text-slate-400'}>{s.label}</div>
                {st?.detail && <div className="text-xs text-slate-400">{st.detail}</div>}
              </div>
            </div>
          );
        })}
      </div>
      {logs.length > 0 && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 max-h-36 overflow-y-auto font-mono text-xs text-slate-500 space-y-0.5">
          {logs.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 text-sm text-red-600">生成失败:{error}</div>}
      {running && <div className="mt-3 text-xs text-slate-400">正在生成,请勿关闭页面…</div>}
    </div>
  );
}
