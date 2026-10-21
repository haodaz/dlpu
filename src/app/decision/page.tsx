'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button, Segmented, Tabs, Tag } from 'antd';
import { useRouter } from 'next/navigation';
import { LockOutlined, CloudUploadOutlined, DesktopOutlined, ArrowRightOutlined, ExperimentOutlined, RobotOutlined, EnvironmentOutlined, FireOutlined } from '@ant-design/icons';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { verdictMeta, type Verdict } from '@/lib/diagnosis';
import { useDataImported } from '@/lib/diagnosis-state';
import { POLICY_POINTS, POLICY_SOURCE_NOTE } from '@/lib/policy';
import { LATEST_RESULT_TASK, avgOf, majorSlug, taskResults } from '@/lib/eval-tasks';
import MeetingMode from '@/components/diagnosis/MeetingMode';
import { AdvisorDrawer, ADVISOR_QUESTIONS } from '@/components/advisor/AdvisorChat';
import { TENANT_NAME, TENANT_REGION } from '@/lib/brand';
import type { RegionIndustryProfile } from '@/lib/industry-report/region-industries';

// 宏观决策分析
// 「诊断前 · 政策解读」:学校还没有导入数据时的获客页(双优政策解读钩子 + 区域重点产业 + 导入入口)
// 「诊断结论」:大屏风格的结论区 + 区域重点产业(客观,不取决于本校专业)+ 专业红绿灯(三档 tab)+ 专业建设专家 AI
export default function DecisionPage() {
  const [imported, setImported, ready] = useDataImported();
  const [meeting, setMeeting] = useState(false);

  return (
    <div className="max-w-6xl mx-auto w-full pb-12">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <h1 className="text-xl font-bold text-slate-800 m-0">宏观决策分析</h1>
        {ready && (
          <div className="flex items-center gap-2 flex-wrap">
            <Segmented
              data-spec="decision-switch"
              value={imported ? 'result' : 'before'}
              onChange={(v) => setImported(v === 'result')}
              options={[
                { value: 'before', label: '诊断前 · 政策解读' },
                { value: 'result', label: '诊断结论' },
              ]}
            />
            {imported && (
              <span data-spec="meeting-btn">
                <Button type="primary" icon={<DesktopOutlined />} onClick={() => setMeeting(true)}>
                  会议模式(大屏)
                </Button>
              </span>
            )}
          </div>
        )}
      </div>

      {!ready ? null : imported ? <DecisionView /> : <HookView onImport={() => setImported(true)} />}

      <MeetingMode open={meeting} initial={0} onClose={() => setMeeting(false)} />
    </div>
  );
}

// ---------- 区域重点产业(客观) ----------
function useRegionIndustries(): RegionIndustryProfile | null | false {
  const [d, setD] = useState<RegionIndustryProfile | null | false>(null);
  useEffect(() => {
    fetch(`/api/region-industries?region=${encodeURIComponent(TENANT_REGION)}`)
      .then((r) => r.json())
      .then((j) => setD(j.success ? j : false))
      .catch(() => setD(false));
  }, []);
  return d;
}

function RegionIndustries({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const data = useRegionIndustries();
  const [scope, setScope] = useState<string>('all');
  if (data === null) return <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-400">区域重点产业加载中…</div>;
  if (data === false) return <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-400">区域重点产业暂时无法获取</div>;
  const scopes = Array.from(new Set(data.industries.map((i) => i.scope)));
  const list = data.industries.filter((i) => scope === 'all' || i.scope === scope).slice(0, compact ? 8 : 20);
  const src = new Map(data.sources.map((s) => [s.id, s]));
  return (
    <div data-spec="decision-region" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <h3 className="text-base font-bold text-slate-800 m-0 flex items-center gap-2">
          <EnvironmentOutlined className="text-indigo-500" /> 区域重点产业 · {TENANT_REGION}
        </h3>
        {scopes.length > 1 && !compact && (
          <Segmented size="small" value={scope} onChange={(v) => setScope(v as string)} options={[{ value: 'all', label: '全部' }, ...scopes.map((s) => ({ value: s, label: s }))]} />
        )}
      </div>
      <p className="text-xs text-slate-400 mt-0 mb-4">客观展示本地区政府重点发展的产业(来自省市规划与政府工作报告、平方产业集群库),不取决于本校开设了哪些专业</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {list.map((i) => (
          <div key={`${i.scope}-${i.name}`} className="rounded-xl border border-slate-200 p-4 flex flex-col">
            <div className="flex items-start gap-2">
              <span className="font-bold text-slate-800 flex-1">{i.name}</span>
              <Tag className="m-0 text-[11px]">{i.scope}</Tag>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 mt-1">{i.level}</div>
            {i.scale && (
              <div className="text-sm font-black text-slate-800 mt-1">
                <FireOutlined className="text-orange-500" /> {i.scale}
              </div>
            )}
            <div className="text-xs text-slate-500 mt-1.5 leading-relaxed flex-1">{i.desc}</div>
            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-slate-400">
                {i.src.slice(0, 2).map((id) => {
                  const s = src.get(id);
                  return s?.url ? (
                    <a key={id} href={s.url} target="_blank" rel="noreferrer" className="mr-1 hover:text-blue-600" title={s.title}>
                      [{id}]
                    </a>
                  ) : null;
                })}
              </span>
              {!compact && (
                <button className="text-blue-600 hover:underline" onClick={() => router.push(`/industry-report?industry=${encodeURIComponent(i.name)}`)}>
                  产业分析报告 →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.clusters.length > 0 && (
        <div className="mt-4 text-xs text-slate-500">
          平方产业集群库:
          {data.clusters.map((c) => (
            <Tag key={c.name} color="cyan" className="ml-1">
              {c.name} · {c.type}
            </Tag>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- 诊断前:政策解读(获客) ----------
function HookView({ onImport }: { onImport: () => void }) {
  const router = useRouter();
  const free = POLICY_POINTS.filter((p) => p.freeLevel === 0);
  const locked = POLICY_POINTS.filter((p) => p.freeLevel === 1);

  return (
    <div className="space-y-5">
      <div className="aurora-card rounded-2xl p-7">
        <SchoolBadge sub="双优政策解读" />
        <h2 className="text-[24px] font-black text-slate-800 mt-5 mb-0 leading-snug">
          专业建设已经进入“生存之战”:
          <br />
          不是材料齐不齐,而是专业还该不该办、该怎么办。
        </h2>
        <p className="text-slate-500 mt-3 mb-0 text-[15px]">先给两个最关键的判断;结合学校自己的专业数据,才能给出完整诊断。</p>
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

      <RegionIndustries compact />

      <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-6">
        <div className="text-sm font-bold text-slate-500 mb-3 flex items-center gap-2">
          <LockOutlined /> 还有 {locked.length} 条解读,以及本校专业与区域产业的匹配结论,导入数据后解锁
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

      <div data-spec="decision-cta" className="rounded-2xl bg-white border border-blue-200 shadow-sm p-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-lg font-bold text-slate-800">导入专业数据,获取完整诊断</div>
          <div className="text-sm text-slate-500 mt-1">只需把现有系统数据交出来,不改动学校原有系统。</div>
        </div>
        <div className="flex gap-2">
          <Button size="large" type="primary" icon={<CloudUploadOutlined />} onClick={() => router.push('/admin/data-sources')}>
            去导入数据
          </Button>
          <Button size="large" icon={<ExperimentOutlined />} onClick={onImport}>
            使用示例数据体验
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-400 text-center m-0">{POLICY_SOURCE_NOTE}</p>
    </div>
  );
}

// ---------- 诊断结论 ----------
const TIERS: Verdict[] = ['GO', 'RISK', 'NO'];

function DecisionView() {
  const router = useRouter();
  const rows = taskResults(LATEST_RESULT_TASK.id);
  const region = useRegionIndustries();
  const [tier, setTier] = useState<Verdict>('GO');
  const [ask, setAsk] = useState<{ open: boolean; q: string | null }>({ open: false, q: null });
  const count = (v: Verdict) => rows.filter((r) => r.verdict === v).length;
  const pie = TIERS.map((v) => ({ name: verdictMeta[v].label, value: count(v), color: verdictMeta[v].dot }));

  return (
    <div className="space-y-5">
      {/* 本年度结论:浅色卡片 */}
      <div data-spec="decision-verdict" className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div className="aurora-card rounded-2xl p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <SchoolBadge sub={`本年度结论 · ${LATEST_RESULT_TASK.name} · ${rows.length} 个参评专业`} />
            <span className="text-xs text-slate-400">判定依据:一致性(方向对不对)+ 有效性(做没做好)</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {TIERS.map((v) => (
              <button
                key={v}
                onClick={() => setTier(v)}
                className={`rounded-xl px-4 py-3 text-left border transition-all ${tier === v ? 'shadow-sm' : 'bg-white/70 border-white hover:border-slate-200'}`}
                style={tier === v ? { borderColor: verdictMeta[v].dot, backgroundColor: `${verdictMeta[v].dot}12` } : undefined}
              >
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: verdictMeta[v].dot }} />
                  {verdictMeta[v].label}
                </div>
                <div className="text-3xl font-black text-slate-800 mt-1">{count(v)}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 2xl:grid-cols-4 gap-3 mt-4">
            {[
              ['综合均分', avgOf(rows, 'overall')],
              ['一致性均分', avgOf(rows, 'consistency')],
              ['有效性均分', avgOf(rows, 'effectiveness')],
              ['区域重点产业', region ? region.industries.length : '—'],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-lg bg-white/70 px-3 py-2">
                <div className="text-[11px] text-slate-500 whitespace-nowrap">{l}</div>
                <div className="text-xl font-bold text-slate-800">{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="text-base font-bold text-slate-800">三档分布</div>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius="62%" outerRadius="88%" paddingAngle={3} stroke="none">
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-xs text-slate-500">重点发展占比</div>
              <div className="text-3xl font-black text-slate-800">{rows.length ? Math.round((count('GO') / rows.length) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>

      <RegionIndustries />

      {/* 专业红绿灯:三档 tab */}
      <div data-spec="decision-lights" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800 m-0">专业红绿灯</h3>
          <span className="text-xs text-slate-400">点专业查看诊断</span>
        </div>
        <Tabs
          activeKey={tier}
          onChange={(k) => setTier(k as Verdict)}
          items={TIERS.map((v) => ({
            key: v,
            label: (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: verdictMeta[v].dot }} />
                {verdictMeta[v].label}({count(v)})
              </span>
            ),
            children: (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rows
                  .filter((r) => r.verdict === v)
                  .sort((a, b) => b.overall - a.overall)
                  .map((r) => (
                    <button
                      key={r.major}
                      onClick={() => router.push(`/admin/diagnosis?major=${majorSlug(r.major)}&task=${LATEST_RESULT_TASK.id}`)}
                      className="rounded-xl border border-slate-200 p-4 text-left hover:border-blue-400 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: verdictMeta[r.verdict].dot }} />
                        <span className="font-bold text-slate-800 flex-1 truncate">{r.major}</span>
                        <span className="text-lg font-black text-slate-700">{r.overall}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{r.college}</div>
                      <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        一致性 {r.consistency} · 有效性 {r.effectiveness}
                      </div>
                    </button>
                  ))}
                {!count(v) && <div className="text-sm text-slate-400">没有该档专业</div>}
              </div>
            ),
          }))}
        />
      </div>

      {/* 专业建设专家 AI(替代原「专业布局建议」) */}
      <div data-spec="decision-advisor" className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm p-6 flex flex-col md:flex-row gap-5 md:items-center">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-base font-bold text-slate-800">
            <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <RobotOutlined />
            </span>
            专业布局怎么调?和专业建设专家 AI 聊一聊
          </div>
          <p className="text-sm text-slate-500 mt-2 mb-0 leading-relaxed">AI 会结合上面的区域重点产业、已检索的产业分析和各专业提交资料后的评价结果,给出布局方面的建议;涉及招生调整的只给论证方向,不替学校下结论。</p>
        </div>
        <div className="flex flex-col gap-2 md:w-[22rem]">
          {ADVISOR_QUESTIONS.slice(0, 3).map((q) => (
            <button key={q} onClick={() => setAsk({ open: true, q })} className="text-left text-sm rounded-lg border border-indigo-100 bg-white px-3 py-2 text-indigo-700 hover:border-indigo-300">
              {q}
            </button>
          ))}
          <Button type="primary" icon={<RobotOutlined />} onClick={() => setAsk({ open: true, q: null })}>
            开始对话
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>学校内部数据为演示数据;区域重点产业为真实检索结果</span>
        <button className="hover:text-blue-500" onClick={() => router.push('/admin')}>
          进入管理分析 <ArrowRightOutlined />
        </button>
      </div>

      <AdvisorDrawer open={ask.open} question={ask.q} onClose={() => setAsk({ open: false, q: null })} />
    </div>
  );
}


// 校徽 + 学校名(浅色卡片用)
function SchoolBadge({ sub }: { sub: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm ring-1 ring-indigo-100 relative overflow-hidden shrink-0">
        <Image src="/dlpu_logo.png" alt={`${TENANT_NAME}校徽`} fill className="object-contain p-1" />
      </span>
      <div>
        <div className="text-base font-bold text-slate-800 leading-tight">{TENANT_NAME}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
    </div>
  );
}
