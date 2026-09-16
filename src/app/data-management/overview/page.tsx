'use client';
import React, { useMemo } from 'react';
import {
  DatabaseOutlined,
  RobotOutlined,
  ArrowRightOutlined,
  CloudUploadOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import {
  getCategoryGroups,
  getGlobalStat,
  getAllProcessedData,
  type MaterialCategoryKey,
} from '@/lib/data-management';
import { indicators, dimensions, getAIActionsByIndicator } from '@/lib/indicators';

export default function DataOverviewPage() {
  const router = useRouter();
  const groups = useMemo(() => getCategoryGroups(), []);
  const global = useMemo(() => getGlobalStat(), []);
  const allData = useMemo(() => getAllProcessedData(), []);

  // 每个类型的图标 emoji（简单一个字符，不花哨）
  const catIcon: Record<MaterialCategoryKey, string> = {
    'course-doc': '📄',
    'academic': '📋',
    'research': '🔬',
    'platform-log': '📊',
    'asset': '💾',
    'enterprise': '🏢',
    'employment': '👥',
    'training-ai': '🤖',
  };

  // 数据流向：每个类型 → 关联指标列表
  const flowByCategory = useMemo(() => {
    const map = new Map<MaterialCategoryKey, Set<string>>();
    allData.forEach((d) => {
      const set = map.get(d.category) || new Set<string>();
      d.relatedIndicators.forEach((i) => set.add(i));
      map.set(d.category, set);
    });
    return map;
  }, [allData]);

  // 指标 → 由多少类材料支撑（覆盖率）
  const indicatorCoverage = useMemo(() => {
    return indicators.map((ind) => {
      const relatedMaterials = allData.filter((d) => d.relatedIndicators.includes(ind.id));
      const aiAct = getAIActionsByIndicator(ind.id);
      return {
        id: ind.id,
        name: ind.name,
        dimension: ind.dimension,
        weight: ind.weight,
        covered: relatedMaterials.length > 0,
        aiActions: aiAct?.actionCount || 0,
        materialCount: relatedMaterials.length,
        pending: relatedMaterials.filter((m) => m.processStatus === 'pending').length,
      };
    });
  }, [allData]);

  // 来源统计
  const sourceStats = useMemo(() => {
    const ai = allData.filter((d) => d.dataSource === 'ai-prefill');
    const up = allData.filter((d) => d.dataSource === 'user-upload');
    const ext = allData.filter((d) =>
      d.sourceType === 'EXTERNAL_DATA' ||
      d.relatedIndicators.some((iid) => indicators.find((x) => x.id === iid)?.needsExternalData)
    );
    const total = allData.length || 1;
    return [
      { key: 'ai', label: 'AI 预填', count: ai.length, pct: Math.round((ai.length / total) * 100), color: '#7c3aed', icon: <RobotOutlined /> },
      { key: 'upload', label: '我上传', count: up.length, pct: Math.round((up.length / total) * 100), color: '#059669', icon: <CloudUploadOutlined /> },
      { key: 'external', label: '外部引用', count: ext.length, pct: Math.round((ext.length / total) * 100), color: '#0891b2', icon: <GlobalOutlined /> },
    ];
  }, [allData]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      <div className="px-8 py-8 max-w-7xl mx-auto w-full">
        {/* ============================================================ */}
        {/* Header: 核心统计 + 快捷入口                                    */}
        {/* ============================================================ */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xl shadow-sm">
            <DatabaseOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">数据总览</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">我的数据地图 — 手上有什么、从哪来、去了哪</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Kpi label="材料总数" value={global.totalData} color="#1677ff" />
          <Kpi label="AI 预填" value={global.aiPrefillCount} color="#7c3aed" />
          <Kpi label="我上传" value={global.userUploadCount} color="#059669" />
          <Kpi label="覆盖指标" value={`${global.coveredIndicatorCount}/${global.totalIndicatorCount}`} color="#d97706" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-10">
          <QuickLink
            color="#7c3aed"
            bg="#f5f3ff"
            icon={<RobotOutlined />}
            title="处理 AI 预填数据"
            desc="查看 AI 预填结果，确认或修改"
            onClick={() => router.push('/data-management/ai-prefill')}
          />
          <QuickLink
            color="#059669"
            bg="#ecfdf5"
            icon={<CloudUploadOutlined />}
            title="上传材料"
            desc="上传已有文件，系统自动解析映射"
            onClick={() => router.push('/data-management/my-uploads')}
          />
        </div>

        {/* ============================================================ */}
        {/* Section 1: 我有哪些数据 — 按材料类型盘点                        */}
        {/* ============================================================ */}
        <Section num="01" title="我有哪些数据" desc="按材料类型盘点手上的材料清单">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {groups.map((g) => {
              const indicatorsList = Array.from(flowByCategory.get(g.category.key) || []);
              return (
                <button
                  key={g.category.key}
                  onClick={() => router.push('/data-management/overview')}
                  className="group text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl leading-none">{catIcon[g.category.key]}</span>
                      <span className="text-sm font-bold text-slate-700">{g.category.name}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-800">{g.total}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] mb-2">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                      <RobotOutlined className="text-[10px]" /> AI {g.aiPrefill}
                    </span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-green-600">
                      <CloudUploadOutlined className="text-[10px]" /> 上传 {g.userUpload}
                    </span>
                  </div>

                  {g.pendingCount > 0 ? (
                    <div className="flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                      <ClockCircleOutlined /> {g.pendingCount} 份待确认
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-green-600 font-bold">
                      <CheckCircleOutlined /> 全部已确认
                    </div>
                  )}

                  {indicatorsList.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="text-[10px] text-slate-400 mb-1">
                        流向 <span className="font-bold text-slate-600">{indicatorsList.length}</span> 个指标
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {indicatorsList.slice(0, 4).map((iid) => (
                          <span key={iid} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {iid}
                          </span>
                        ))}
                        {indicatorsList.length > 4 && (
                          <span className="text-[10px] text-slate-400">+{indicatorsList.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section 2: 这些数据从哪来 — 来源分布                            */}
        {/* ============================================================ */}
        <Section num="02" title="这些数据从哪来" desc="AI 预填 / 我上传 / 外部引用，三种来源的占比">
          {/* 顶部一条合并的占比条 */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
              {sourceStats.map((s) => (
                <div
                  key={s.key}
                  className="h-full transition-all duration-500"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              ))}
            </div>
          </div>

          {/* 三张并列的来源卡 */}
          <div className="grid grid-cols-3 gap-3">
            {sourceStats.map((s) => (
              <div
                key={s.key}
                className="rounded-xl border p-4"
                style={{ borderColor: `${s.color}30`, backgroundColor: `${s.color}08` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span className="text-sm font-bold text-slate-700">{s.label}</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-3xl font-bold" style={{ color: s.color }}>{s.count}</span>
                  <span className="text-sm text-slate-400">份</span>
                  <span className="text-xs text-slate-500 ml-auto font-bold">{s.pct}%</span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ============================================================ */}
        {/* Section 3: 这些数据流向了哪些指标 — 流向矩阵                    */}
        {/* ============================================================ */}
        <Section num="03" title="这些数据流向了哪些指标" desc="按维度看每个指标是否已有材料覆盖、AI 是否已预填">
          <div className="space-y-4">
            {dimensions.map((dim) => {
              const dimInds = indicatorCoverage.filter((i) => i.dimension === dim.key);
              return (
                <div key={dim.key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div
                    className="px-4 py-2.5 flex items-center justify-between"
                    style={{ backgroundColor: dim.bg, borderBottom: `1px solid ${dim.border}` }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-4 rounded-full" style={{ backgroundColor: dim.color }} />
                      <span className="font-bold text-sm" style={{ color: dim.color }}>
                        维度{dim.key} · {dim.name}
                      </span>
                      <span className="text-xs text-slate-500">权重 {dim.weight}% · {dimInds.length} 项</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {dimInds.map((ind) => (
                      <button
                        key={ind.id}
                        onClick={() => router.push(`/data-management/ai-prefill/detail?indicator=${ind.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                      >
                        <span className="font-mono text-xs text-slate-400 w-14 shrink-0">{ind.id}</span>
                        <span className="flex-1 text-sm text-slate-700 truncate">{ind.name}</span>

                        {/* 覆盖状态 */}
                        {ind.covered ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full shrink-0">
                            <CheckCircleOutlined /> {ind.materialCount} 份材料
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full shrink-0">
                            暂无材料
                          </span>
                        )}

                        {/* AI 预填状态 */}
                        {ind.aiActions > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full shrink-0">
                            <RobotOutlined /> {ind.aiActions} 个动作
                          </span>
                        ) : null}

                        {/* 待确认 */}
                        {ind.pending > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                            <ClockCircleOutlined /> {ind.pending} 待确认
                          </span>
                        )}

                        <ArrowRightOutlined className="text-slate-300 text-xs shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}

// ---------- 组件 ----------
function Section({ num, title, desc, children }: { num: string; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-mono text-slate-300 font-bold">{num}</span>
        <h2 className="text-base font-bold text-slate-800 m-0">{title}</h2>
        <span className="text-xs text-slate-400">{desc}</span>
      </div>
      {children}
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function QuickLink({ color, bg, icon, title, desc, onClick }: {
  color: string; bg: string; icon: React.ReactNode; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex items-center gap-3 text-left"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ backgroundColor: bg, color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-slate-800">{title}</div>
        <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
      </div>
      <ArrowRightOutlined className="text-slate-300" />
    </button>
  );
}
