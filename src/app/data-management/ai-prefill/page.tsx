'use client';
import React, { useState, useMemo } from 'react';
import { Select, Tag, Input } from 'antd';
import {
  RobotOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAIPrefillData, type ProcessedDataItem } from '@/lib/data-management';
import { indicators, dimensions, aiPrefillActions, getAIActionsByIndicator } from '@/lib/indicators';
import { getAllUploadMaterials } from '@/lib/my-uploads';

type StatusFilter = 'all' | 'pending' | 'confirmed';
type SourceFilter = 'all' | 'sample' | 'external' | 'upload';
type DimensionFilter = 'all' | 'A' | 'B' | 'C' | 'D';

interface IndicatorDisplay {
  indicatorId: string;
  indicatorName: string;
  dimensionKey: string;
  dimensionName: string;
  dimensionColor: string;
  weight: number;
  actionCount: number;
  actions: string[];
  pendingCount: number;
  confirmedCount: number;
  // 来源描述
  sources: { label: string; type: 'sample' | 'external' | 'upload' }[];
  hasMaterials: boolean;
  firstMaterialId: string | null;
}

interface DimensionGroup {
  key: string;
  name: string;
  color: string;
  weight: number;
  indicators: IndicatorDisplay[];
}

export default function AIPrefillPage() {
  return (
    <React.Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50"><div className="text-slate-400">加载中…</div></div>}>
      <AIPrefillContent />
    </React.Suspense>
  );
}

function AIPrefillContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectIndicator = searchParams.get('indicator');

  const [search, setSearch] = useState('');
  const [dimensionFilter, setDimensionFilter] = useState<DimensionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');

  const allData = useMemo(() => getAIPrefillData(), []);
  const allUploadMaterials = useMemo(() => getAllUploadMaterials(), []);

  // 维度 → 指标 → 显示数据
  const groups: DimensionGroup[] = useMemo(() => {
    return dimensions.map((dim) => {
      const dimIndicators = indicators.filter((ind) => ind.dimension === dim.key);
      const displays: IndicatorDisplay[] = dimIndicators
        .map((ind) => {
          const aiAct = getAIActionsByIndicator(ind.id);
          if (!aiAct) return null;

          // 找关联的预填材料
          const materials = allData.filter((item) => item.relatedIndicators.includes(ind.id));

          // 构建来源描述
          const sources: { label: string; type: 'sample' | 'external' | 'upload' }[] = [];

          // 1. 我的上传：从 my-uploads 动态获取该指标关联的上传材料
          const relatedUploads = allUploadMaterials.filter((m) => m.relatedIndicators.includes(ind.id));
          relatedUploads.forEach((m) => {
            sources.push({ label: m.name, type: 'upload' });
          });

          // 2. AI 特有来源（Sample 模板 / 外部数据）— 这些不是用户上传的，是 AI 预填动作的输入
          const aiSources: Record<string, { label: string; type: 'sample' | 'external' }[]> = {
            '1.1.1': [{ label: 'Sample（产业白皮书模板）', type: 'sample' }, { label: '外部数据（统计年鉴等）', type: 'external' }],
            '1.1.2': [{ label: '1.1.1 产业白皮书', type: 'sample' }],
            '1.1.3': [{ label: '1.1.1 产业白皮书', type: 'sample' }],
            '1.2.1': [{ label: '外部数据（ISBN数据库）', type: 'external' }],
            '1.3.1': [{ label: 'Sample（国际标准库）', type: 'sample' }],
            '4.1.1': [{ label: '1.1.1 产业白皮书', type: 'sample' }],
          };
          (aiSources[ind.id] || []).forEach((s) => {
            sources.push({ label: s.label, type: s.type });
          });

          // 兜底：如果没有任何来源，显示 AI 自动生成
          if (sources.length === 0) {
            sources.push({ label: 'AI 自动生成', type: 'sample' });
          }

          return {
            indicatorId: ind.id,
            indicatorName: ind.name,
            dimensionKey: ind.dimension,
            dimensionName: dim.name,
            dimensionColor: dim.color,
            weight: ind.weight,
            actionCount: aiAct.actionCount,
            actions: aiAct.actions,
            pendingCount: materials.filter((m) => m.processStatus === 'pending').length,
            confirmedCount: materials.filter((m) => m.processStatus === 'confirmed').length,
            sources,
            hasMaterials: materials.length > 0,
            firstMaterialId: materials.length > 0 ? materials[0].id : null,
          };
        })
        .filter((x): x is IndicatorDisplay => x !== null);

      return {
        key: dim.key,
        name: dim.name,
        color: dim.color,
        weight: dim.weight,
        indicators: displays,
      };
    });
  }, [indicators, dimensions, allData, allUploadMaterials]);

  // 筛选
  const filteredGroups = useMemo(() => {
    return groups
      .map((g) => ({
        ...g,
        indicators: g.indicators.filter((ind) => {
          if (dimensionFilter !== 'all' && ind.dimensionKey !== dimensionFilter) return false;
          if (search) {
            const q = search.toLowerCase();
            if (!ind.indicatorName.toLowerCase().includes(q) && !ind.indicatorId.toLowerCase().includes(q) && !ind.actions.some((a) => a.toLowerCase().includes(q))) return false;
          }
          if (statusFilter === 'pending' && ind.pendingCount === 0) return false;
          if (statusFilter === 'confirmed' && ind.confirmedCount === 0) return false;
          if (sourceFilter !== 'all' && !ind.sources.some((s) => s.type === sourceFilter)) return false;
          return true;
        }),
      }))
      .filter((g) => g.indicators.length > 0);
  }, [groups, search, dimensionFilter, statusFilter, sourceFilter]);

  const highlightedId = preselectIndicator || null;

  // 全局统计
  const stats = useMemo(() => {
    const all = groups.flatMap((g) => g.indicators);
    return {
      totalIndicators: all.length,
      totalActions: all.reduce((s, i) => s + i.actionCount, 0),
      totalPending: all.reduce((s, i) => s + i.pendingCount, 0),
      totalConfirmed: all.reduce((s, i) => s + i.confirmedCount, 0),
    };
  }, [groups]);

  const goConfirm = (ind: IndicatorDisplay) => {
    router.push(`/data-management/ai-prefill/detail?indicator=${ind.indicatorId}`);
  };

  const sourceColor = (type: 'sample' | 'external' | 'upload') => {
    switch (type) {
      case 'sample': return { color: '#7c3aed', bg: '#f5f3ff' };
      case 'external': return { color: '#0891b2', bg: '#ecfeff' };
      case 'upload': return { color: '#d97706', bg: '#fffbeb' };
    }
  };
  const sourceLabel = (type: 'sample' | 'external' | 'upload') => {
    switch (type) {
      case 'sample': return '🤖 Sample';
      case 'external': return '🌐 外部数据';
      case 'upload': return '☁️ 我的上传';
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部 ===== */}
      <div className="px-8 py-8 shrink-0 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white text-2xl shadow-sm">
            <RobotOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">AI 预填数据</h1>
            <p className="text-sm text-slate-500 m-0 mt-1">按指标查看 AI 预填动作，逐项确认/修改。</p>
          </div>
        </div>

        {/* 统计条 */}
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-3 shadow-sm flex items-center gap-6 text-sm">
          <span className="text-slate-500">
            共 <span className="font-bold text-slate-800">{stats.totalIndicators}</span> 项指标
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            <ThunderboltOutlined className="text-amber-500 mr-1" />
            AI 预填动作 <span className="font-bold text-amber-600">{stats.totalActions}</span> 个
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            待确认 <span className="font-bold text-amber-600">{stats.totalPending}</span> 项
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">
            已确认 <span className="font-bold text-green-600">{stats.totalConfirmed}</span> 项
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
              className="w-40"
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
                { value: 'pending', label: '有待确认' },
                { value: 'confirmed', label: '有已确认' },
              ]}
            />
            <Select
              value={sourceFilter}
              onChange={(v) => setSourceFilter(v)}
              className="w-36"
              options={[
                { value: 'all', label: '全部来源' },
                { value: 'sample', label: 'Sample 模板' },
                { value: 'upload', label: '我的上传' },
                { value: 'external', label: '外部数据' },
              ]}
            />
            <Input
              placeholder="搜索指标名称/编号/AI动作"
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="flex-1 min-w-[200px] max-w-xs"
            />
          </div>
        </div>
      </div>

      {/* ===== 维度分组列表 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-12">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400 text-sm shadow-sm">暂无匹配的指标</div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((g) => (
              <div key={g.key}>
                {/* 维度标题 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 rounded" style={{ backgroundColor: g.color }} />
                  <span className="text-sm font-bold text-slate-700">
                    维度{g.key}：{g.name}
                  </span>
                  <span className="text-xs text-slate-400">（{g.weight}%，{g.indicators.length}项）</span>
                </div>

                {/* 指标卡片 */}
                <div className="space-y-2.5">
                  {g.indicators.map((ind) => (
                    <div
                      key={ind.indicatorId}
                      className={`bg-white rounded-xl shadow-sm overflow-hidden transition-all ${highlightedId === ind.indicatorId ? 'ring-2 ring-purple-300' : 'border border-slate-200'}`}
                      style={highlightedId === ind.indicatorId ? { borderLeft: `4px solid ${ind.dimensionColor}` } : { borderLeft: `4px solid ${ind.dimensionColor}` }}
                    >
                      <div className="px-5 py-3.5">
                        {/* 第一行：编号+名称+权重+去确认 */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-xs text-slate-400 w-14 shrink-0">{ind.indicatorId}</span>
                          <span className="font-bold text-slate-800 text-base flex-1">{ind.indicatorName}</span>
                          <button
                            onClick={() => goConfirm(ind)}
                            className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-colors"
                          >
                            去确认 <ArrowRightOutlined />
                          </button>
                        </div>

                        {/* 第二行：tag 信息行 */}
                        <div className="flex items-center gap-2 flex-wrap mb-2.5">
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            权重 <span className="font-bold text-slate-800 ml-1">{ind.weight}%</span>
                          </span>
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                            <ThunderboltOutlined className="mr-1" /> AI 预填 <span className="font-bold ml-0.5">{ind.actionCount}</span> 个动作
                          </span>
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                            <span className="font-bold">{ind.pendingCount}</span> 待确认
                          </span>
                          <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-green-50 text-green-700">
                            <span className="font-bold">{ind.confirmedCount}</span> 已确认
                          </span>
                        </div>

                        {/* 第三行：来源（给足空间） */}
                        <div className="text-xs text-slate-500 mb-2 leading-relaxed">
                          <span className="text-slate-400 mr-1 font-semibold">来源：</span>
                          <div className="inline">
                            {ind.sources.map((s, i) => {
                              const sc = sourceColor(s.type);
                              return (
                                <span key={i} className="inline-flex items-center mr-2 mb-1">
                                  <span className="font-bold" style={{ color: sc.color }}>{sourceLabel(s.type)}</span>
                                  <span className="text-slate-500 ml-0.5">{s.label.replace(/^(Sample|外部数据|我的上传)（|）$/, '')}</span>
                                  {i < ind.sources.length - 1 && <span className="text-slate-300 mx-1">+</span>}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* 第四行：动作 */}
                        <div className="text-xs text-slate-600 leading-relaxed">
                          <span className="text-purple-500 mr-1 font-semibold">⚡ 动作：</span>
                          <div className="inline">
                            {ind.actions.map((a, i) => (
                              <span key={i} className="inline-flex items-center">
                                <span className="text-purple-700">{a}</span>
                                {i < ind.actions.length - 1 && <span className="text-slate-300 mx-1.5">|</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
