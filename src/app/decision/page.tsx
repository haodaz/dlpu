'use client';
import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import {
  FundProjectionScreenOutlined,
  LockOutlined,
  CloudUploadOutlined,
  DesktopOutlined,
  ArrowRightOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { MAJORS, verdictMeta, schoolAvg, DEMO_MAJOR, type Verdict, type Layout } from '@/lib/diagnosis';
import { useDataImported } from '@/lib/diagnosis-state';
import { POLICY_POINTS, POLICY_SOURCE_NOTE, REGION_PREVIEW } from '@/lib/policy';
import MeetingMode from '@/components/diagnosis/MeetingMode';
import { TENANT_REGION } from '@/lib/brand';

// 本地区最近一次产业分析报告的摘要(真实检索结果,来自产业检索日志)
interface RegionSignal {
  found: boolean;
  runId?: string;
  at?: string;
  industry?: string;
  clusters?: { name: string; type: string }[];
  directions?: { name: string; stage: string; cagr: number | null }[];
  policyCount?: number;
  localPolicies?: string[];
  companies?: string[];
}

function useRegionSignal(): RegionSignal | null {
  const [sig, setSig] = useState<RegionSignal | null>(null);
  useEffect(() => {
    const city = TENANT_REGION.replace(/^.*?(省|自治区)/, '').replace(/市$/, '');
    fetch(`/api/industry-log?latest=${encodeURIComponent(city)}`)
      .then((r) => r.json())
      .then(setSig)
      .catch(() => setSig({ found: false }));
  }, []);
  return sig;
}

const STAGE_COLOR: Record<string, string> = { 爆发期: '#dc2626', 成长期: '#059669', 萌芽期: '#0891b2', 成熟期: '#64748b', 调整期: '#d97706' };

// 宏观决策分析:面向校领导班子,只给是/否级别的结论
// 无数据 → 获客态(双优政策解读钩子 + 导入 CTA);有数据 → 决策态(专业红绿灯 + 可办/风险/不可办)
export default function DecisionPage() {
  const [imported, setImported, ready] = useDataImported();
  const [meeting, setMeeting] = useState(false);

  return (
    <div className="max-w-6xl mx-auto w-full pb-12">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-600 flex items-center justify-center text-white text-xl shadow-sm">
            <FundProjectionScreenOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">宏观决策分析</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">面向校领导班子 · 只给是 / 否级别的结论</p>
          </div>
        </div>
        {ready && imported && (
          <span data-spec="meeting-btn">
            <Button type="primary" size="large" icon={<DesktopOutlined />} onClick={() => setMeeting(true)}>
              会议模式(大屏)
            </Button>
          </span>
        )}
      </div>

      {!ready ? null : imported ? (
        <DecisionView onReset={() => setImported(false)} />
      ) : (
        <HookView onImport={() => setImported(true)} />
      )}

      <MeetingMode open={meeting} initial={0} onClose={() => setMeeting(false)} />
    </div>
  );
}

// ---------- 状态 A:无数据(获客态) ----------
function HookView({ onImport }: { onImport: () => void }) {
  const router = useRouter();
  const sig = useRegionSignal();
  const free = POLICY_POINTS.filter((p) => p.freeLevel === 0);
  const locked = POLICY_POINTS.filter((p) => p.freeLevel === 1);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-8">
        <div className="text-sm text-indigo-200 font-bold mb-2">双优政策解读</div>
        <h2 className="text-2xl font-black m-0 leading-snug">
          专业建设已经进入“生存之战”:
          <br />
          不是材料齐不齐,而是专业还该不该办、该怎么办。
        </h2>
        <p className="text-indigo-100/80 mt-3 mb-0 text-[15px]">先给你两个最关键的判断,其余解读需要结合学校自己的专业数据才有意义。</p>
      </div>

      <div data-spec="decision-hook" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {free.map((p, i) => (
          <div key={p.id} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <div className="text-xs font-bold text-indigo-600 mb-2">关键判断 {i + 1}</div>
            <h3 className="text-lg font-bold text-slate-800 m-0 mb-2">{p.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed m-0 mb-3">{p.summary}</p>
            <div className="text-sm text-slate-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
              <span className="font-bold">对学校意味着:</span>
              {p.meaning}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 m-0">区域产业匹配预览</h3>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <LockOutlined /> 导入专业数据后显示本校匹配结果
          </span>
        </div>
        {sig?.found ? (
          <>
            <div className="text-xs text-slate-500 mb-3">
              {TENANT_REGION} · {sig.industry} · 来自 {new Date(sig.at!).toLocaleDateString('zh-CN')} 的产业分析报告(真实检索)
              {sig.clusters?.map((c) => (
                <span key={c.name} className="ml-2 inline-block text-[11px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  {c.name}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sig.directions?.map((d) => (
                <div key={d.name} className="rounded-xl border border-slate-200 p-4">
                  <div className="text-sm font-bold text-slate-700">{d.name}</div>
                  <div className="text-xs mt-1" style={{ color: STAGE_COLOR[d.stage] ?? '#64748b' }}>
                    {d.stage}
                    {d.cagr !== null && <span className="text-slate-400"> · 年均增长 {d.cagr}%</span>}
                  </div>
                  <div className="mt-3 blur-[5px] select-none text-slate-600 text-sm" aria-hidden>
                    本校匹配专业 ×× 个
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {REGION_PREVIEW.map((r) => (
            <div key={r.industry} className="rounded-xl border border-slate-200 p-4 relative overflow-hidden">
              <div className="text-sm font-bold text-slate-700">{r.industry}</div>
              <div className="text-xs text-slate-400 mt-1">区域需求 {r.demand}</div>
              <div className="mt-3 blur-[5px] select-none text-slate-600 text-sm" aria-hidden>
                本校匹配专业 ×× 个
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-6">
        <div className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
          <LockOutlined /> 还有 {locked.length} 条解读,结合本校数据后解锁
        </div>
        <div className="space-y-2">
          {locked.map((p) => (
            <div key={p.id} className="flex items-center gap-3 text-slate-400">
              <LockOutlined className="text-xs" />
              <span className="text-sm">{p.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div data-spec="decision-cta" className="rounded-2xl bg-blue-600 text-white p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-lg font-bold">导入专业数据,获取完整诊断</div>
          <div className="text-sm text-blue-100 mt-1">只需把现有系统数据交出来,不改动学校原有系统。</div>
        </div>
        <div className="flex gap-2">
          <Button size="large" icon={<CloudUploadOutlined />} onClick={() => router.push('/admin/data-sources')}>
            去导入数据
          </Button>
          <Button size="large" type="primary" ghost className="!text-white !border-white" icon={<ExperimentOutlined />} onClick={onImport}>
            使用示例数据体验
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center m-0">{POLICY_SOURCE_NOTE}</p>
    </div>
  );
}

// ---------- 状态 B:有数据(决策态) ----------
const VERDICT_ORDER: Verdict[] = ['GO', 'RISK', 'NO'];
const LAYOUT_ORDER: Layout[] = ['保留', '优化', '缩减', '停招'];

function DecisionView({ onReset }: { onReset: () => void }) {
  const router = useRouter();
  const sig = useRegionSignal();
  const [filter, setFilter] = useState<Verdict | null>(null);
  const count = (v: Verdict) => MAJORS.filter((m) => m.verdict === v).length;
  const shown = filter ? MAJORS.filter((m) => m.verdict === filter) : MAJORS;

  return (
    <div className="space-y-5">
      {/* 一句话结论 */}
      <div data-spec="decision-verdict" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="text-xs font-bold text-slate-400 mb-2">本年度结论</div>
        <h2 className="text-2xl font-black text-slate-800 m-0 leading-snug">
          {MAJORS.length} 个专业中 {count('GO')} 个重点发展;{count('RISK')} 个优化整改;{count('NO')} 个需风险关注。
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-0">专业综合诊断均分 {schoolAvg} · 判定依据:一致性(是否对准产业需求)+ 有效性(培养是否真正达成)</p>
      </div>

      {/* 重点发展 / 优化整改 / 风险关注 */}
      <div className="grid grid-cols-3 gap-4">
        {VERDICT_ORDER.map((v) => {
          const m = verdictMeta[v];
          const active = filter === v;
          return (
            <button
              key={v}
              onClick={() => setFilter(active ? null : v)}
              className={`rounded-2xl border-2 p-5 text-left transition-all ${active ? 'shadow-md' : 'hover:shadow-sm'}`}
              style={{ borderColor: active ? m.dot : `${m.dot}55`, backgroundColor: m.bg }}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: m.dot }} />
                <span className="font-bold" style={{ color: m.color }}>{m.label}</span>
              </div>
              <div className="text-4xl font-black mt-2" style={{ color: m.color }}>{count(v)}</div>
            </button>
          );
        })}
      </div>

      {/* 区域产业信号:来自产业分析报告的真实检索结果 */}
      <div data-spec="decision-region" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800 m-0">区域产业信号 · {TENANT_REGION}</h3>
          {sig?.found ? (
            <button className="text-xs text-blue-600 hover:underline" onClick={() => router.push(`/industry-report?run=${sig.runId}`)}>
              {sig.industry}产业分析报告 · {new Date(sig.at!).toLocaleDateString('zh-CN')} <ArrowRightOutlined />
            </button>
          ) : (
            <button className="text-xs text-blue-600 hover:underline" onClick={() => router.push('/industry-report')}>
              生成本地区产业分析报告 <ArrowRightOutlined />
            </button>
          )}
        </div>
        {sig?.found ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-400 mb-1.5">产业集群(平方数据)</div>
              {sig.clusters?.length ? (
                sig.clusters.map((c) => (
                  <div key={c.name} className="text-slate-700">
                    {c.name}
                    <span className="text-xs text-slate-400"> · {c.type}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">未收录</div>
              )}
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1.5">技术方向(OpenAlex 论文统计)</div>
              {sig.directions?.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="text-slate-700">{d.name}</span>
                  <span className="text-xs font-bold" style={{ color: STAGE_COLOR[d.stage] ?? '#64748b' }}>
                    {d.stage}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1.5">本地政策(共检索到 {sig.policyCount} 条相关政策)</div>
              {sig.localPolicies?.length ? (
                sig.localPolicies.map((p) => (
                  <div key={p} className="text-slate-700 text-xs leading-relaxed truncate" title={p}>
                    {p}
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-xs">暂无本地政策</div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-400">{sig ? '还没有本地区的产业分析报告,生成后这里会显示真实的产业集群、技术热度与政策信号。' : '加载中…'}</div>
        )}
      </div>

      {/* 专业红绿灯 */}
      <div data-spec="decision-lights" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-800 m-0">专业红绿灯{filter ? ` · ${verdictMeta[filter].label}` : ''}</h3>
          <span className="text-xs text-slate-400">点击「{DEMO_MAJOR.name}」查看完整诊断(示例专业)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shown.map((m) => {
            const v = verdictMeta[m.verdict];
            const demo = m.name === DEMO_MAJOR.name;
            return (
              <button
                key={m.name}
                disabled={!demo}
                title={demo ? '查看诊断分析' : '演示环境只有示例专业有完整诊断数据'}
                onClick={() => router.push('/admin')}
                className={`rounded-xl border p-4 text-left transition-all ${demo ? 'border-blue-200 hover:border-blue-400 hover:shadow-sm cursor-pointer' : 'border-slate-200 cursor-default'}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: v.dot }} />
                  <span className="font-bold text-slate-800 flex-1 truncate">{m.name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: v.color, backgroundColor: v.bg }}>
                    {v.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-2 leading-relaxed">{m.reason}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 专业布局建议 */}
      <div data-spec="decision-layout" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 m-0 mb-4">专业布局建议</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {LAYOUT_ORDER.map((l) => {
            const list = MAJORS.filter((m) => m.layout === l);
            return (
              <div key={l} className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                <div className="text-sm font-bold text-slate-700 mb-2">
                  {l} <span className="text-slate-400 font-normal">· {list.length}</span>
                </div>
                <div className="space-y-1">
                  {list.map((m) => (
                    <div key={m.name} className="text-sm text-slate-600 truncate">{m.name}</div>
                  ))}
                  {!list.length && <div className="text-xs text-slate-400">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>演示数据 · 专业结论由诊断引擎按一致性与有效性综合判定</span>
        <span className="flex items-center gap-3">
          <button className="hover:text-blue-500" onClick={() => router.push('/admin')}>
            进入管理分析 <ArrowRightOutlined />
          </button>
          <button className="hover:text-blue-500" onClick={onReset}>演示:切回无数据状态</button>
        </span>
      </div>
    </div>
  );
}
