'use client';
import React, { useState } from 'react';
import { Select, Input } from 'antd';
import {
  ArrowRightOutlined,
  SearchOutlined,
  FormOutlined,
  EditOutlined,
  RobotOutlined,
  ExperimentOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { indicators, dimensions } from '@/lib/indicators';
import {
  filingModeMeta,
  filingStatusMeta,
  filingStatusOrder,
  getFilingState,
  useFilingRevision,
  whitepaperReferenceOf,
  WHITEPAPER_NAME,
  WHITEPAPER_PRODUCER_ID,
  WHITEPAPER_REFERENCES,
  type FilingMode,
  type FilingStatus,
} from '@/lib/filing';

type StatusFilter = 'all' | FilingStatus;
type DimensionFilter = 'all' | 'A' | 'B' | 'C' | 'D';

interface IndicatorRow {
  indicatorId: string;
  indicatorName: string;
  weight: number;
  mode: FilingMode;
  status: FilingStatus;
  tag?: string;
}

interface DimensionGroup {
  key: string;
  name: string;
  color: string;
  weight: number;
  indicators: IndicatorRow[];
}

export default function IndicatorFilingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50">
          <div className="text-slate-400">加载中…</div>
        </div>
      }
    >
      <IndicatorFilingContent />
    </React.Suspense>
  );
}

function IndicatorFilingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectIndicator = searchParams.get('indicator');

  const [search, setSearch] = useState('');
  const [dimensionFilter, setDimensionFilter] = useState<DimensionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // 订阅内存态填报状态：任一指标状态变化都会触发本组件重渲染
  useFilingRevision();

  const groups: DimensionGroup[] = dimensions.map((dim) => ({
    key: dim.key,
    name: dim.name,
    color: dim.color,
    weight: dim.weight,
    indicators: indicators
      .filter((ind) => ind.dimension === dim.key)
      .map((ind) => {
        const state = getFilingState(ind.id);
        return {
          indicatorId: ind.id,
          indicatorName: ind.name,
          weight: ind.weight,
          mode: state.mode,
          status: state.status,
          tag: ind.tag,
        };
      }),
  }));

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      indicators: g.indicators.filter((ind) => {
        if (dimensionFilter !== 'all' && g.key !== dimensionFilter) return false;
        if (statusFilter !== 'all' && ind.status !== statusFilter) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !ind.indicatorName.toLowerCase().includes(q) &&
            !ind.indicatorId.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      }),
    }))
    .filter((g) => g.indicators.length > 0);

  // 所有指标平铺为同一层级：不锁定、不按依赖分区，维度只作为卡片上的一个标签
  const flatRows = filteredGroups.flatMap((g) =>
    g.indicators.map((ind) => ({ ...ind, dimKey: g.key, dimColor: g.color })),
  );

  const highlightedId = preselectIndicator || null;

  const allRows = groups.flatMap((g) => g.indicators);
  const byStatus = filingStatusOrder.reduce<Record<FilingStatus, number>>(
    (acc, s) => {
      acc[s] = allRows.filter((i) => i.status === s).length;
      return acc;
    },
    {} as Record<FilingStatus, number>,
  );
  const stats = {
    total: allRows.length,
    byStatus,
    modeSelected: allRows.filter((i) => i.mode !== 'unselected').length,
  };

  const goDetail = (ind: IndicatorRow) => {
    router.push(`/data-management/ai-prefill/detail?indicator=${ind.indicatorId}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部 ===== */}
      <div className="px-8 py-8 shrink-0 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white text-2xl shadow-sm">
            <FormOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">指标填报</h1>
            <p className="text-sm text-slate-500 m-0 mt-1">
              按指标组织，每个指标进入后可选择「直接填报」或「AI 辅助填报」。
            </p>
          </div>
        </div>

        {/* 统计条 */}
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm flex items-center gap-5 text-sm flex-wrap">
          <span className="text-slate-500">
            共 <span className="font-bold text-slate-800">{stats.total}</span> 项指标
          </span>
          <span className="text-slate-400">|</span>
          {filingStatusOrder.map((s) => {
            const meta = filingStatusMeta[s];
            return (
              <span key={s} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                <span className="text-slate-500">{meta.label}</span>
                <span className="font-bold" style={{ color: meta.color }}>
                  {stats.byStatus[s]}
                </span>
              </span>
            );
          })}
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            已选模式 <span className="font-bold text-purple-600">{stats.modeSelected}</span> 项
          </span>
        </div>
      </div>

      {/* ===== 筛选栏 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={dimensionFilter}
              onChange={(v) => setDimensionFilter(v)}
              className="w-44"
              options={[
                { value: 'all', label: '全部维度' },
                { value: 'A', label: '维度A · 课程与需求适配性' },
                { value: 'B', label: '维度B · 教学实施有效性' },
                { value: 'C', label: '维度C · 运行保障支撑度' },
                { value: 'D', label: '维度D · 产出与贡献' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              className="w-32"
              options={[
                { value: 'all', label: '全部状态' },
                ...filingStatusOrder.map((s) => ({ value: s, label: filingStatusMeta[s].label })),
              ]}
            />
            <Input
              placeholder="搜索指标名称/编号"
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="flex-1 min-w-[200px] max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* ===== 指标平铺列表（不锁定、不分区） ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-12">
        {flatRows.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400 text-sm shadow-sm">
            暂无匹配的指标
          </div>
        ) : (
          <div className="space-y-2.5">
            {flatRows.map((ind) => {
              const modeMeta = filingModeMeta[ind.mode];
              const statusMeta = filingStatusMeta[ind.status];
              const highlighted = highlightedId === ind.indicatorId;
              const isProducer = ind.indicatorId === WHITEPAPER_PRODUCER_ID;
              const ref = whitepaperReferenceOf(ind.indicatorId);
              return (
                <button
                  key={ind.indicatorId}
                  onClick={() => goDetail(ind)}
                  className={`w-full text-left bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:-translate-y-[1px] ${
                    highlighted ? 'ring-2 ring-purple-300' : 'border border-slate-200'
                  }`}
                  style={{ borderLeft: `4px solid ${ind.dimColor}` }}
                >
                  <div className="px-5 py-3.5">
                    {/* 第一行：编号 + 名称 + 状态 + 模式 + 进入 */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-xs text-slate-400 w-14 shrink-0">{ind.indicatorId}</span>
                      <span className="font-bold text-slate-800 text-base flex-1">{ind.indicatorName}</span>

                      <span
                        className="shrink-0 inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          color: statusMeta.color,
                          backgroundColor: statusMeta.bg,
                          border: `1px solid ${statusMeta.border}`,
                        }}
                      >
                        {statusMeta.label}
                      </span>

                      <span
                        className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          color: modeMeta.color,
                          backgroundColor: modeMeta.bg,
                          border: `1px solid ${modeMeta.border}`,
                        }}
                      >
                        {ind.mode === 'direct' ? <EditOutlined /> : ind.mode === 'ai' ? <RobotOutlined /> : null}
                        {modeMeta.label}
                      </span>

                      <span className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-colors">
                        进入填报 <ArrowRightOutlined />
                      </span>
                    </div>

                    {/* 第二行：权重 + 维度 + 白皮书关系标注 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        权重 <span className="font-bold text-slate-800 ml-1">{ind.weight}%</span>
                      </span>

                      <span
                        className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded"
                        style={{ color: ind.dimColor, backgroundColor: `${ind.dimColor}14` }}
                      >
                        维度 {ind.dimKey}
                      </span>

                      {isProducer && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          <ExperimentOutlined />
                          产出{WHITEPAPER_NAME}，可供 {WHITEPAPER_REFERENCES.length} 项指标引用
                        </span>
                      )}

                      {ref && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
                          <LinkOutlined />
                          可引用：{WHITEPAPER_PRODUCER_ID} {WHITEPAPER_NAME}
                          <span className="text-cyan-500">（{ref.usedModule}）</span>
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}