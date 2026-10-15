'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Tooltip } from 'antd';
import { SafetyCertificateFilled, LinkOutlined, HistoryOutlined, RiseOutlined } from '@ant-design/icons';
import type { IndustryReport, SignalKind, Claim, HistoryMark, ReportDelta } from '@/lib/industry-report/types';

// 产业分析报告展示(产业分析报告页、教师白皮书工具共用)
// 每章标注信号类型;来源可点击溯源;解读中未核验的数字标红;专家逐章审核并回流知识库

const REVIEW_KEY = 'industry_report_review';

export const KIND_META: Record<SignalKind, { label: string; cls: string; tip: string }> = {
  STRONG: { label: '强信号 · 公式计算', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', tip: '数值由公开数据按附录公式计算,大模型不参与' },
  EXTRACTED: { label: 'AI 抽取 · 来源可核验', cls: 'bg-sky-50 text-sky-700 border-sky-200', tip: '大模型只从检索材料中抽取,每条都带来源编号' },
  INTERPRETED: { label: 'AI 解读 · 仅基于上述表格', cls: 'bg-violet-50 text-violet-700 border-violet-200', tip: '只读取第一至三章的表格,不引入新数字;未能核验的数字标红' },
  WEAK: { label: '弱信号 · 置信度低', cls: 'bg-amber-50 text-amber-700 border-amber-200', tip: '无量化数据支撑,仅供专家参考' },
  SKIPPED: { label: '数据不足 · 本章跳过', cls: 'bg-slate-100 text-slate-500 border-slate-200', tip: '不以模型推断补齐' },
};

const CHAPTERS = [
  { key: 'tech', title: '一、技术热度与成熟度' },
  { key: 'policy', title: '二、政策信号' },
  { key: 'chain', title: '三、产业链与岗位需求' },
  { key: 'insight', title: '四、综合研判与专业建设建议' },
  { key: 'weak', title: '五、早期弱信号(AI 建议区)' },
] as const;


export function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}


// ---------- 报告 ----------
export function ReportView({ report }: { report: IndustryReport }) {
  const reviewKey = `${REVIEW_KEY}:${report.generatedAt}`;
  const [review, setReview] = useState<Record<string, boolean>>({});
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReview(readJSON<Record<string, boolean>>(reviewKey) ?? {});
  }, [reviewKey]);
  const toggle = (k: string, v: boolean) => {
    const next = { ...review, [k]: v };
    setReview(next);
    writeJSON(reviewKey, next);
    // 审核结果回流知识库:已审核章节的条目在后续检索中优先采用
    if (report.runId) {
      fetch('/api/industry-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: report.runId, chapters: Object.keys(next).filter((x) => next[x]) }),
      }).catch(() => {});
    }
  };
  const reviewed = CHAPTERS.every((c) => review[c.key]);
  const srcUrl = useMemo(() => new Map(report.sources.map((s) => [s.id, s])), [report.sources]);
  const Src = ({ id }: { id: number }) => {
    const s = srcUrl.get(id);
    const cls = `text-[11px] font-mono mx-0.5 ${s?.origin === 'pingfang' ? 'text-teal-600' : 'text-sky-600'}`;
    return (
      <Tooltip title={s?.title}>
        {s?.url ? (
          <a href={s.url} target="_blank" rel="noreferrer" className={`${cls} hover:underline`}>
            [S{id}]
          </a>
        ) : (
          <span className={cls}>[S{id}]</span>
        )}
      </Tooltip>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 space-y-10">
      {/* 封面 */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm text-slate-400">
              {report.region} · 服务专业:{report.major || '—'}
            </div>
            <h2 className="text-2xl font-black text-slate-800 mt-1 mb-1">{report.industry}产业分析报告</h2>
            <div className="text-xs text-slate-400">
              生成于 {new Date(report.generatedAt).toLocaleString('zh-CN')} · 模型 {report.model} · 引用来源 {report.sources.length} 条
            </div>
          </div>
          {reviewed ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <SafetyCertificateFilled /> 经专家审核校正
            </span>
          ) : (
            <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
              待专家审核({CHAPTERS.filter((c) => review[c.key]).length}/{CHAPTERS.length})
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {(['STRONG', 'EXTRACTED', 'INTERPRETED', 'WEAK'] as SignalKind[]).map((k) => (
            <Tooltip key={k} title={KIND_META[k].tip}>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${KIND_META[k].cls}`}>{KIND_META[k].label}</span>
            </Tooltip>
          ))}
        </div>
      </div>

      {report.delta && <DeltaPanel delta={report.delta} />}

      {/* 一、技术热度 */}
      <Chapter spec="ir-tech" title={CHAPTERS[0].title} kind={report.tech.kind} note={report.tech.note} reviewed={!!review.tech} onReview={(v) => toggle('tech', v)}>
        <p className="text-sm text-slate-500 mt-0 mb-3">
          表 T1:各技术方向在 OpenAlex 的年度论文数(颜色越深越多,按行归一),及由公式计算的增长指标与阶段。
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-xs text-slate-400">
                <th className="text-left font-medium py-2 pr-3">方向</th>
                {report.tech.years.map((y) => (
                  <th key={y} className="font-medium px-1">
                    {y}
                  </th>
                ))}
                <th className="font-medium px-2">同比</th>
                <th className="font-medium px-2">CAGR</th>
                <th className="font-medium px-2">加速比</th>
                <th className="font-medium px-2 text-left">阶段</th>
              </tr>
            </thead>
            <tbody>
              {report.tech.directions.map((d) => {
                const max = Math.max(...d.counts.map((c) => c.count), 1);
                return (
                  <tr key={d.name} className="border-t border-slate-100">
                    <td className="py-2 pr-3">
                      <div className="font-bold text-slate-700">{d.name}</div>
                      <a href={d.queryUrl} target="_blank" rel="noreferrer" className="text-[11px] text-slate-400 hover:text-sky-600 font-mono">
                        <LinkOutlined /> {d.query}
                      </a>
                    </td>
                    {d.counts.map((c) => (
                      <td key={c.year} className="px-0.5 py-1">
                        <div
                          className="rounded text-center text-[11px] py-1.5 font-mono"
                          style={{
                            backgroundColor: `rgba(79,70,229,${0.08 + 0.8 * (c.count / max)})`,
                            color: c.count / max > 0.55 ? '#fff' : '#334155',
                          }}
                        >
                          {c.count.toLocaleString()}
                        </div>
                      </td>
                    ))}
                    <Num v={d.yoy} suffix="%" />
                    <Num v={d.cagr} suffix="%" />
                    <Num v={d.accel} />
                    <td className="px-2">
                      <Tooltip title={`判定依据:${d.stageRule}`}>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded whitespace-nowrap ${STAGE_CLS[d.stage]}`}>{d.stage}</span>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-2 mb-0">鼠标悬停阶段可查看命中的判定规则;点击检索式可在 OpenAlex 复现原始计数。</p>
      </Chapter>

      {/* 二、政策 */}
      <Chapter spec="ir-policy" title={CHAPTERS[1].title} kind={report.policy.kind} note={report.policy.note} reviewed={!!review.policy} onReview={(v) => toggle('policy', v)}>
        {report.policy.items.length > 0 && (
          <>
            <p className="text-sm text-slate-500 mt-0 mb-3">表 T2:检索到的政策按年份统计(政策数 / 层级加权得分),政策加速度 {report.policy.acceleration === null ? '样本不足,不计算' : `${report.policy.acceleration}%`}。</p>
            <div className="flex items-end gap-3 h-28 mb-4">
              {report.policy.byYear.map((y) => {
                const max = Math.max(...report.policy.byYear.map((x) => x.weighted), 1);
                return (
                  <div key={y.year} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-xs font-bold text-slate-600">{y.weighted}</span>
                    <div className="w-full max-w-12 rounded-t bg-indigo-500" style={{ height: `${(y.weighted / max) * 70}%`, minHeight: 2 }} />
                    <span className="text-[11px] text-slate-400 mt-1">
                      {y.year} · {y.density} 条
                    </span>
                  </div>
                );
              })}
            </div>
            <table className="w-full text-sm">
              <tbody>
                {report.policy.items
                  .slice()
                  .sort((a, b) => b.year - a.year || b.score - a.score)
                  .map((p) => (
                    <tr key={p.name} className="border-t border-slate-100">
                      <td className="py-2 pr-2 text-slate-400 w-12">{p.year}</td>
                      <td className="py-2 pr-2 w-16">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{p.level}</span>
                      </td>
                      <td className="py-2 pr-2 text-slate-700">
                        {p.name}
                        <span className="text-xs text-slate-400 ml-1">· {p.issuer}</span>
                        <Src id={p.sourceId} />
                        <HistoryTag h={p.history} />
                      </td>
                      <td className="py-2 text-right text-xs text-slate-400 w-16">力度 {p.score}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </>
        )}
      </Chapter>

      {/* 三、产业链与岗位 */}
      <Chapter spec="ir-chain" title={CHAPTERS[2].title} kind={report.chain.kind} note={report.chain.note} reviewed={!!review.chain} onReview={(v) => toggle('chain', v)}>
        <p className="text-sm text-slate-500 mt-0 mb-3">表 T3:区域产业集群(平方数据)、产业链环节与代表企业(检索材料),以及岗位技能出现频次(按岗位计数)。</p>
        {report.chain.clusters?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {report.chain.clusters.map((c) => (
              <div key={c.name} className="rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm">
                <span className="font-bold text-teal-800">{c.name}</span>
                <span className="text-xs text-teal-700 ml-2">{c.type}</span>
                <Src id={c.sourceId} />
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
          {(['上游', '中游', '下游'] as const).map((lv) => (
            <div key={lv} className="rounded-xl border border-slate-200 p-4">
              <div className="text-sm font-bold text-slate-700 mb-2">{lv}</div>
              <div className="space-y-2.5">
                {report.chain.nodes
                  .filter((n) => n.level === lv)
                  .map((n) => (
                    <div key={n.node}>
                      <div className="text-sm text-slate-700">
                        {n.node}
                        {n.sourceIds.slice(0, 3).map((id) => (
                          <Src key={id} id={id} />
                        ))}
                        <HistoryTag h={n.history} />
                      </div>
                      {n.companies.length > 0 && <div className="text-xs text-slate-500 mt-0.5">{n.companies.join('、')}</div>}
                    </div>
                  ))}
                {!report.chain.nodes.some((n) => n.level === lv) && <div className="text-xs text-slate-400">材料中未提及</div>}
              </div>
            </div>
          ))}
        </div>
        {report.chain.skillFreq.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-bold text-slate-700 mb-2">岗位技能频次(共 {report.chain.jobs.length} 个岗位)</div>
              <div className="space-y-1.5">
                {report.chain.skillFreq.slice(0, 12).map((s) => (
                  <div key={s.skill} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate text-slate-600">{s.skill}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded">
                      <div className="h-2 bg-sky-500 rounded" style={{ width: `${(s.count / report.chain.skillFreq[0].count) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right text-xs text-slate-500">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-slate-700 mb-2">岗位明细</div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {report.chain.jobs.map((j, i) => (
                  <div key={i} className="text-sm border-b border-slate-50 pb-1.5">
                    <span className="font-bold text-slate-700">{j.title}</span>
                    <Src id={j.sourceId} />
                    <HistoryTag h={j.history} />
                    {j.background?.length > 0 && <div className="text-xs text-slate-400">专业背景:{j.background.join('、')}</div>}
                    {j.skills.length > 0 && <div className="text-xs text-slate-500">技能:{j.skills.join('、')}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Chapter>

      {/* 四、综合研判 */}
      <Chapter spec="ir-insight" title={CHAPTERS[3].title} kind={report.insight.kind} reviewed={!!review.insight} onReview={(v) => toggle('insight', v)}>
        <div className="text-sm font-bold text-slate-700 mb-2">综合判断</div>
        <ClaimList claims={report.insight.summary} />
        <div className="text-sm font-bold text-slate-700 mt-5 mb-2">对「{report.major || '相关专业'}」建设的建议</div>
        <ClaimList claims={report.insight.majorAdvice} />
      </Chapter>

      {/* 五、弱信号 */}
      <Chapter spec="ir-weak" title={CHAPTERS[4].title} kind={report.weak.signals.length ? 'WEAK' : 'SKIPPED'} reviewed={!!review.weak} onReview={(v) => toggle('weak', v)}>
        <p className="text-sm text-slate-500 mt-0 mb-3">近期报道密集但尚无量化数据支撑的方向,未经严格验证,仅供专家参考。</p>
        <div className="space-y-2">
          {report.weak.signals.map((s) => (
            <div key={s.topic} className="rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{s.topic}</span>
                <span className="text-[11px] font-bold text-amber-700">置信度:低</span>
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {s.evidence}
                {s.sourceIds.map((id) => (
                  <Src key={id} id={id} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Chapter>

      {/* 附录 */}
      <section data-spec="ir-appendix" className="print-break">
        <h3 className="text-lg font-bold text-slate-800 mb-3">附录:方法与来源</h3>
        <table className="w-full text-sm mb-6">
          <tbody>
            {report.method.map((m) => (
              <tr key={m.label} className="border-t border-slate-100">
                <td className="py-2 pr-4 text-slate-400 whitespace-nowrap align-top w-24">{m.label}</td>
                <td className="py-2 text-slate-600">{m.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-sm font-bold text-slate-700 mb-2">引用来源</div>
        <ol className="m-0 pl-0 list-none space-y-1 text-xs">
          {report.sources.map((s) => (
            <li key={s.id} className="flex gap-2">
              <span className="font-mono text-slate-400 w-10 shrink-0">[S{s.id}]</span>
              {s.origin === 'pingfang' && <span className="shrink-0 text-[10px] font-bold px-1 rounded bg-teal-50 text-teal-700 border border-teal-200">平方</span>}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-sky-600 break-all">
                  {s.title}
                </a>
              ) : (
                <span className="text-slate-600">{s.title}</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

const STAGE_CLS: Record<string, string> = {
  萌芽期: 'bg-cyan-50 text-cyan-700',
  爆发期: 'bg-red-50 text-red-600',
  成长期: 'bg-emerald-50 text-emerald-700',
  成熟期: 'bg-slate-100 text-slate-600',
  调整期: 'bg-amber-50 text-amber-700',
  数据不足: 'bg-slate-50 text-slate-400',
};

const fmt = (v: number | null, suffix = '') => (v === null ? '—' : `${v}${suffix}`);

function Num({ v, suffix = '' }: { v: number | null; suffix?: string }) {
  return (
    <td className={`px-2 text-center font-mono text-xs ${v !== null && v < 0 ? 'text-red-500' : 'text-slate-600'}`}>{fmt(v, suffix)}</td>
  );
}

function Chapter({
  spec,
  title,
  kind,
  note,
  reviewed,
  onReview,
  children,
}: {
  spec: string;
  title: string;
  kind: SignalKind;
  note?: string;
  reviewed: boolean;
  onReview: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const m = KIND_META[kind];
  return (
    <section data-spec={spec} className="break-inside-avoid-page">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h3 className="text-lg font-bold text-slate-800 m-0">{title}</h3>
        <Tooltip title={m.tip}>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
        </Tooltip>
        <Checkbox className="ml-auto no-print" checked={reviewed} onChange={(e) => onReview(e.target.checked)}>
          <span className="text-xs text-slate-500">专家已审核</span>
        </Checkbox>
      </div>
      {note && <div className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-3">{note}</div>}
      {kind !== 'SKIPPED' && children}
    </section>
  );
}

// 解读文本:未在表格中找到的数字标红
function ClaimList({ claims }: { claims: Claim[] }) {
  return (
    <ul className="m-0 pl-0 list-none space-y-2">
      {claims.map((c, i) => (
        <li key={i} className="flex gap-2 text-[15px] text-slate-700 leading-relaxed">
          <span className="text-slate-300 mt-0.5">•</span>
          <div>
            <Highlighted text={c.text} bad={c.unverifiedNumbers} />
            {c.refs.map((r) => (
              <span key={r} className="text-[11px] font-mono text-violet-500 ml-1">
                [{r}]
              </span>
            ))}
            {c.unverifiedNumbers.length > 0 && (
              <div className="text-xs text-red-500 mt-0.5">
                标红数字在表格中未逐字出现(可能是取整或推算),请专家核对
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Highlighted({ text, bad }: { text: string; bad: string[] }) {
  if (!bad.length) return <>{text}</>;
  // 只匹配完整数字,避免 45 命中 45.4
  const re = new RegExp(`((?<![\\d.])(?:${bad.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\d.]))`, 'g');
  return (
    <>
      {text.split(re).map((part, i) =>
        bad.includes(part) ? (
          <mark key={i} className="bg-red-100 text-red-700 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}


// 历史沉淀标记:本次检索未命中、由知识库补回的条目
function HistoryTag({ h }: { h?: HistoryMark }) {
  if (!h) return null;
  return (
    <Tooltip title={`历史检索沉淀:累计出现 ${h.seenCount} 次,最近 ${new Date(h.lastSeen).toLocaleDateString('zh-CN')}${h.reviewed ? ',专家已审核' : ''}`}>
      <span className={`ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold px-1 rounded border ${h.reviewed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
        <HistoryOutlined /> {h.reviewed ? '已审核沉淀' : '历史沉淀'}
      </span>
    </Tooltip>
  );
}

// 本次变化:与上一次同产业同地区报告的差值
function DeltaPanel({ delta }: { delta: ReportDelta }) {
  const first = !delta.baseAt;
  const groups = [
    { label: '新增政策', items: delta.newPolicies },
    { label: '新增产业链环节', items: delta.newNodes },
    { label: '新出现企业', items: delta.newCompanies },
    { label: '新增岗位', items: delta.newJobs },
  ];
  const recalled = delta.recalled.policies + delta.recalled.nodes + delta.recalled.jobs;
  return (
    <section data-spec="ir-delta" className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <RiseOutlined className="text-indigo-500" />
        <span className="font-bold text-slate-800">本次变化</span>
        <span className="text-xs text-slate-500">
          {first
            ? '首次检索该产业,已建立基线,下次将只检索变化'
            : `对比 ${new Date(delta.baseAt!).toLocaleDateString('zh-CN')} 的上一次报告 · ${delta.mode === 'incremental' ? `增量检索最近 ${delta.freshnessDays} 天` : '全量检索'}`}
        </span>
      </div>
      {!first && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {groups.map((g) => (
            <div key={g.label}>
              <span className="text-slate-500">{g.label}:</span>
              {g.items.length ? <span className="text-slate-700">{g.items.slice(0, 6).join('、')}{g.items.length > 6 ? ` 等 ${g.items.length} 项` : ''}</span> : <span className="text-slate-400">无</span>}
            </div>
          ))}
          <div className="md:col-span-2">
            <span className="text-slate-500">技术方向阶段变化:</span>
            {delta.stageChanges.length ? (
              <span className="text-slate-700">{delta.stageChanges.map((c) => `${c.name} ${c.from} → ${c.to}`).join(';')}</span>
            ) : (
              <span className="text-slate-400">无</span>
            )}
          </div>
        </div>
      )}
      <div className="text-xs text-slate-400 mt-2">
        从知识库补回历史条目 {recalled} 条 · 检索缓存命中 {delta.cache.searchHit}/{delta.cache.searchHit + delta.cache.searchMiss} · 论文统计缓存命中 {delta.cache.openalexHit}/
        {delta.cache.openalexHit + delta.cache.openalexMiss}
      </div>
    </section>
  );
}
