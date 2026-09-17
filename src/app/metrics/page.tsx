'use client';
import React, { useState, useMemo } from 'react';
import { Input, Select, Tag, Tooltip } from 'antd';
import {
  BarChartOutlined,
  SearchOutlined,
  GlobalOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  DatabaseOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { indicators, dimensions, type Indicator, type DimensionKey } from '@/lib/indicators';

type SortKey = 'default' | 'weight-desc' | 'weight-asc';
type ExtFilter = 'all' | 'yes' | 'no';

export default function MetricsOverviewPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [dimFilter, setDimFilter] = useState<DimensionKey | 'all'>('all');
  const [extFilter, setExtFilter] = useState<ExtFilter>('all');
  const [sortBy, setSortBy] = useState<SortKey>('default');

  // 指标总数 / 分类数 / 层级数
  const totalIndicators = indicators.length;
  const totalCategories = dimensions.length;
  const totalLevels = 3; // 一级维度 / 二级分类 / 三级指标
  const extCount = indicators.filter((i) => i.needsExternalData).length;

  // 筛选+排序
  const filtered = useMemo(() => {
    let list = indicators.filter((i) => {
      if (dimFilter !== 'all' && i.dimension !== dimFilter) return false;
      if (extFilter === 'yes' && !i.needsExternalData) return false;
      if (extFilter === 'no' && i.needsExternalData) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !i.id.includes(q) && !i.oneLineSummary.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
    if (sortBy === 'weight-desc') list = [...list].sort((a, b) => b.weight - a.weight);
    if (sortBy === 'weight-asc') list = [...list].sort((a, b) => a.weight - b.weight);
    return list;
  }, [search, dimFilter, extFilter, sortBy]);

  const goDetail = (id: string) => router.push(`/metrics/detail?id=${id}`);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部：指标结构概览 ===== */}
      <div className="px-8 py-8 shrink-0 max-w-7xl mx-auto w-full">
        {/* 标题 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-sm">
            <BarChartOutlined />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">指标总览</h1>
            <p className="text-sm text-slate-500 m-0 mt-1">
              使命型 17 项指标体系标准地图 — 快速看清指标全貌与标准结构。
            </p>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard icon={<AppstoreOutlined />} label="指标总数" value={totalIndicators} unit="项" color="#1677ff" bg="#eff6ff" />
          <StatCard icon={<ApartmentOutlined />} label="指标分类" value={totalCategories} unit="类" color="#7c3aed" bg="#f5f3ff" />
          <StatCard icon={<DatabaseOutlined />} label="指标层级" value={totalLevels} unit="级" color="#059669" bg="#ecfdf5" />
          <StatCard icon={<GlobalOutlined />} label="需外部数据" value={extCount} unit="项" color="#d97706" bg="#fffbeb" />
        </div>

        {/* 权重分布图 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <TrophyOutlined className="text-amber-500" />
            <h2 className="text-base font-bold text-slate-800 m-0">权重分布图</h2>
            <span className="text-xs text-slate-400">各维度在总评价中的权重占比</span>
          </div>
          <div className="space-y-4">
            {dimensions.map((d) => {
              const dimIndicators = indicators.filter((i) => i.dimension === d.key);
              return (
                <div key={d.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: d.color }}>
                        维度 {d.key} · {d.name}
                      </span>
                      <span className="text-xs text-slate-400">{dimIndicators.length} 项指标</span>
                    </div>
                    <span className="font-mono font-bold text-sm" style={{ color: d.color }}>
                      {d.weight}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${d.weight}%`, backgroundColor: d.color }}
                    >
                      {dimIndicators.map((ind, idx) => (
                        <div
                          key={ind.id}
                          className="h-full border-r border-white/30 last:border-r-0"
                          style={{ width: `${(ind.weight / d.weight) * 100}%` }}
                          title={`${ind.id} ${ind.name} (${ind.weight}%)`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* 二级分类标签 */}
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {d.subCategories.map((sc) => {
                      const subIndicators = dimIndicators.filter((i) => i.subCategoryId === sc.id);
                      const subWeight = subIndicators.reduce((s, i) => s + i.weight, 0);
                      return (
                        <span key={sc.id} className="text-xs text-slate-500">
                          {sc.id} {sc.name}（{subWeight}%）
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 层级关系说明 */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <ApartmentOutlined className="text-slate-400" />
              <span className="text-sm font-bold text-slate-600">指标层级关系</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap text-xs">
              <LevelBadge level="一级" label="维度（A/B/C/D）" color="#1677ff" />
              <span className="text-slate-300">→</span>
              <LevelBadge level="二级" label="分类（如 1.1 课程产业对接）" color="#7c3aed" />
              <span className="text-slate-300">→</span>
              <LevelBadge level="三级" label="具体指标（如 1.1.1 产业深度解析）" color="#059669" />
            </div>
          </div>
        </div>
      </div>

      {/* ===== 中部：筛选 + 指标列表 ===== */}
      <div className="px-8 shrink-0 max-w-7xl mx-auto w-full pb-12">
        {/* 筛选栏 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-5">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="搜索指标名称或编号"
              prefix={<SearchOutlined className="text-slate-400" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="flex-1 min-w-[200px] max-w-xs"
            />
            <Select
              value={dimFilter}
              onChange={(v) => setDimFilter(v)}
              className="w-48"
              options={[
                { value: 'all', label: '全部分类' },
                ...dimensions.map((d) => ({ value: d.key, label: `维度 ${d.key} · ${d.name}` })),
              ]}
            />
            <Select
              value={extFilter}
              onChange={(v) => setExtFilter(v)}
              className="w-40"
              options={[
                { value: 'all', label: '外部数据：全部' },
                { value: 'yes', label: '需外部数据' },
                { value: 'no', label: '不需要外部数据' },
              ]}
            />
            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v)}
              className="w-36"
              options={[
                { value: 'default', label: '默认排序' },
                { value: 'weight-desc', label: '权重高→低' },
                { value: 'weight-asc', label: '权重低→高' },
              ]}
            />
            <span className="text-sm text-slate-400 ml-auto">共 {filtered.length} 项</span>
          </div>
        </div>

        {/* 指标卡片网格 */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => (
            <IndicatorCard key={item.id} item={item} onView={() => goDetail(item.id)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
            <div className="text-slate-400 text-base mb-2">未找到匹配的指标</div>
            <p className="text-slate-500 text-sm">请调整搜索条件或筛选器。</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- 统计卡片 ----------
function StatCard({
  icon,
  label,
  value,
  unit,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
        style={{ backgroundColor: bg, color }}
      >
        {icon}
      </div>
      <div>
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <span className="text-xs text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- 层级标签 ----------
function LevelBadge({ level, label, color }: { level: string; label: string; color: string }) {
  return (
    <span
      className="px-2.5 py-1 rounded-md text-xs font-bold border"
      style={{ color, backgroundColor: `${color}10`, borderColor: `${color}40` }}
    >
      {level}：{label}
    </span>
  );
}

// ---------- 指标卡片 ----------
function IndicatorCard({ item, onView }: { item: Indicator; onView: () => void }) {
  const dim = dimensions.find((d) => d.key === item.dimension)!;
  const scoringColor = item.scoringMethod === '定量评分' ? '#059669' : item.scoringMethod === '定性评价' ? '#d97706' : '#1677ff';
  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col gap-3 group cursor-pointer"
      onClick={onView}
    >
      {/* 标题行 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono font-bold text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: dim.bg, color: dim.color, border: `1px solid ${dim.border}` }}
          >
            {item.id}
          </span>
          <span className="font-bold text-slate-800 text-base">{item.name}</span>
          {item.tag && (
            <Tag color="blue" className="m-0 font-bold px-1.5 py-0 text-[10px] leading-4">
              {item.tag}
            </Tag>
          )}
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: '#6366f1', backgroundColor: '#eef2ff' }}
        >
          权重 {item.weight}%
        </span>
      </div>

      {/* 一句话说明 */}
      <p className="text-sm text-slate-600 leading-relaxed m-0">{item.oneLineSummary}</p>

      {/* 信息行 */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="text-slate-400">分类：</span>
          <span className="font-bold" style={{ color: dim.color }}>
            {item.subCategoryName}
          </span>
        </span>
        <span className="text-slate-200">|</span>
        <span className="flex items-center gap-1">
          <span className="text-slate-400">评分方式：</span>
          <span className="font-bold" style={{ color: scoringColor }}>
            {item.scoringMethod}
          </span>
        </span>
      </div>

      {/* 材料类型标签 + 外部数据 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400">所需材料：</span>
        {item.materialTypes.map((mt) => (
          <Tag key={mt} className="m-0 text-[10px] px-1.5 py-0 leading-4">
            {mt}
          </Tag>
        ))}
        <span className="ml-auto flex items-center gap-1 text-xs font-bold">
          {item.needsExternalData ? (
            <span className="flex items-center gap-1 text-amber-600">
              <GlobalOutlined /> 需外部数据
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400">
              <GlobalOutlined /> 无需外部
            </span>
          )}
        </span>
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Tooltip title="查看该指标的完整标准说明">
          <button
            className="text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            <FileTextOutlined /> 查看详情
          </button>
        </Tooltip>
        <button
          className="text-slate-400 text-xs hover:text-blue-600 transition-colors flex items-center gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
        >
          去填报 <ArrowRightOutlined />
        </button>
      </div>
    </div>
  );
}
