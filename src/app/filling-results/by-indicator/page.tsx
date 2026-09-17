'use client';
import React, { useMemo, useState } from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RightOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { indicators, dimensions } from '@/lib/indicators';
import { getAllProcessedData } from '@/lib/data-management';

// 材料完成情况：done=齐备  partial=部分待确认  pending=待确认  none=暂无材料
type MaterialStatus = 'done' | 'partial' | 'pending' | 'none';

const STATUS_META: Record<
  MaterialStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode; action: string }
> = {
  done: { label: '材料齐备', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: <CheckCircleOutlined />, action: '查看完成内容' },
  partial: { label: '部分待确认', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: <ClockCircleOutlined />, action: '继续填报' },
  pending: { label: '待确认', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: <ExclamationCircleOutlined />, action: '去确认' },
  none: { label: '暂无材料', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: <ClockCircleOutlined />, action: '去填报' },
};

interface IndicatorRow {
  id: string;
  name: string;
  subCategoryName: string;
  dimension: string;
  weight: number;
  total: number;
  confirmed: number;
  pending: number;
  status: MaterialStatus;
  progress: number;
}

export default function ByIndicatorPage() {
  const router = useRouter();
  const allData = useMemo(() => getAllProcessedData(), []);
  const [dimFilter, setDimFilter] = useState<string>('all');

  // 以指标为单位，汇总其评价材料的完成情况
  const rows = useMemo<IndicatorRow[]>(() => {
    return indicators.map((ind) => {
      const related = allData.filter((d) => d.relatedIndicators.includes(ind.id));
      const confirmed = related.filter((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified').length;
      const pending = related.length - confirmed;
      const total = related.length;

      let status: MaterialStatus = 'none';
      if (total === 0) status = 'none';
      else if (pending === 0) status = 'done';
      else if (confirmed > 0) status = 'partial';
      else status = 'pending';

      return {
        id: ind.id,
        name: ind.name,
        subCategoryName: ind.subCategoryName,
        dimension: ind.dimension,
        weight: ind.weight,
        total,
        confirmed,
        pending,
        status,
        progress: total ? Math.round((confirmed / total) * 100) : 0,
      };
    });
  }, [allData]);

  const confirmedTotal = rows.reduce((s, r) => s + r.confirmed, 0);
  const materialTotal = rows.reduce((s, r) => s + r.total, 0);
  const coveredCount = rows.filter((r) => r.confirmed > 0).length;
  const overallProgress = materialTotal ? Math.round((confirmedTotal / materialTotal) * 100) : 0;

  const filtered = dimFilter === 'all' ? rows : rows.filter((r) => r.dimension === dimFilter);

  const openIndicator = (id: string) => router.push(`/data-management/ai-prefill/detail?indicator=${id}`);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      <div className="px-8 py-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center text-white text-xl shadow-sm">
            <TableOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">按指标查看</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">
              以指标为单位查看评价材料完成情况，点击任一指标可查看完成内容与最终结果。
            </p>
          </div>
        </div>

        {/* 总体进度 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 mb-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold text-slate-500">材料完成度</span>
            <span className="text-lg font-bold text-green-600">{overallProgress}%</span>
            <span className="ml-auto text-xs text-slate-400">
              已确认 {confirmedTotal}/{materialTotal} 份 · 覆盖 {coveredCount}/{indicators.length} 项指标
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
        </div>

        {/* 维度筛选 */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-slate-400 font-bold">维度筛选：</span>
          {[
            { key: 'all', label: '全部', color: '#64748b' },
            ...dimensions.map((d) => ({ key: d.key, label: `维度${d.key}`, color: d.color })),
          ].map((d) => (
            <button
              key={d.key}
              onClick={() => setDimFilter(d.key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                dimFilter === d.key
                  ? 'text-white border-transparent shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={dimFilter === d.key ? { backgroundColor: d.color } : {}}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* 按维度分组的指标列表 */}
        <div className="space-y-6">
          {dimensions
            .filter((d) => dimFilter === 'all' || d.key === dimFilter)
            .map((dim) => {
              const dimRows = filtered.filter((r) => r.dimension === dim.key);
              if (dimRows.length === 0) return null;

              return (
                <div key={dim.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-1 h-5 rounded" style={{ backgroundColor: dim.color }} />
                    <span className="font-bold text-sm text-slate-700">
                      维度{dim.key} · {dim.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      权重 {dim.weight}% · {dimRows.length} 项
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                    {dimRows.map((r) => {
                      const meta = STATUS_META[r.status];
                      return (
                        <div
                          key={r.id}
                          onClick={() => openIndicator(r.id)}
                          className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-colors"
                          style={{ borderLeft: `4px solid ${dim.color}` }}
                        >
                          {/* 指标名称 */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-400 shrink-0">{r.id}</span>
                              <span className="font-bold text-sm text-slate-800 truncate">{r.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">权重 {r.weight}%</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{r.subCategoryName}</div>
                          </div>

                          {/* 材料完成情况 */}
                          <div className="w-48 shrink-0">
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="text-slate-500 font-bold">
                                已确认 {r.confirmed}/{r.total} 份
                              </span>
                              {r.pending > 0 && <span className="text-amber-500">{r.pending} 份待确认</span>}
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${r.progress}%`, backgroundColor: meta.color }}
                              />
                            </div>
                          </div>

                          {/* 状态 */}
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 w-24 justify-center"
                            style={{ color: meta.color, backgroundColor: meta.bg, border: `1px solid ${meta.border}` }}
                          >
                            {meta.icon} {meta.label}
                          </span>

                          {/* 操作 */}
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-blue-600 shrink-0 w-24 justify-end">
                            {meta.action} <RightOutlined className="text-[10px]" />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}