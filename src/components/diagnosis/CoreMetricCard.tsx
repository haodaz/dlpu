'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DownOutlined, UpOutlined, RightOutlined } from '@ant-design/icons';
import { coreResult, scoreOf, sourceOf, type CoreKey } from '@/lib/diagnosis';
import { getIndicatorById } from '@/lib/indicators';
import SourceTag from './SourceTag';

const verdictStyle = {
  达成: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  基本达成: 'bg-amber-50 text-amber-700 border-amber-200',
  未达成: 'bg-red-50 text-red-700 border-red-200',
};

// 核心指标卡:先给结论;展开才看链条;点环节才下钻到支撑指标
export default function CoreMetricCard({ metric }: { metric: CoreKey }) {
  const router = useRouter();
  const r = coreResult(metric);
  const [open, setOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const link = r.links.find((l) => l.name === activeLink);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-slate-800">{r.name}</span>
            <span className="text-xs text-slate-400">{r.audience}</span>
          </div>
          <p className="text-xs text-slate-500 m-0 max-w-md leading-relaxed">{r.question}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-4xl font-black text-slate-800 leading-none">{r.score}</div>
          <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded border ${verdictStyle[r.verdict]}`}>
            {r.verdict}
          </span>
        </div>
      </div>

      <div className="mt-4 text-[15px] text-slate-700 leading-relaxed">{r.conclusion}</div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
      >
        {open ? '收起分析' : '查看分析:问题出在哪个环节'} {open ? <UpOutlined /> : <DownOutlined />}
      </button>

      {open && (
        <div className="mt-4">
          <div className="flex items-stretch gap-1 flex-wrap">
            {r.links.map((l, i) => (
              <React.Fragment key={l.name}>
                <button
                  onClick={() => setActiveLink(activeLink === l.name ? null : l.name)}
                  className={`flex-1 min-w-[96px] rounded-lg border px-3 py-2 text-left transition-all ${
                    activeLink === l.name ? 'ring-2 ring-blue-300' : ''
                  } ${l.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className={`text-xs font-bold ${l.ok ? 'text-emerald-700' : 'text-red-700'}`}>{l.name}</div>
                  <div className={`text-lg font-black ${l.ok ? 'text-emerald-800' : 'text-red-700'}`}>{l.score}</div>
                </button>
                {i < r.links.length - 1 && <RightOutlined className="self-center text-slate-300 text-xs" />}
              </React.Fragment>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 mb-0">点击某个环节,查看它背后的支撑指标</p>

          {link && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-700 mb-3">
                <span className="font-bold">「{link.name}」分析逻辑:</span>
                {link.insight}
              </div>
              <div className="space-y-1.5">
                {link.indicatorIds.map((id) => {
                  const ind = getIndicatorById(id);
                  const s = scoreOf(id);
                  return (
                    <button
                      key={id}
                      onClick={() => router.push(`/admin/indicator-analysis?id=${id}`)}
                      className="w-full flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-3 py-2 text-left hover:border-blue-300"
                    >
                      <span className="font-mono text-xs text-slate-400 w-12">{id}</span>
                      <span className="flex-1 text-sm font-bold text-slate-700">{ind?.name}</span>
                      <SourceTag source={sourceOf(id)} />
                      <span className={`text-sm font-bold w-10 text-right ${s >= 85 ? 'text-emerald-600' : 'text-red-600'}`}>{s}</span>
                      <RightOutlined className="text-slate-300 text-xs" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
