'use client';
import React, { useMemo, useState } from 'react';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  CloudUploadOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { indicators, dimensions, getAIActionsByIndicator } from '@/lib/indicators';
import { getAllProcessedData, getGlobalStat, type ProcessedDataItem } from '@/lib/data-management';

interface IndicatorResult {
  id: string;
  name: string;
  dimension: string;
  weight: number;
  confirmedItems: ProcessedDataItem[];
  pendingItems: ProcessedDataItem[];
  totalActions: number;
  isComplete: boolean;
}

export default function ByIndicatorPage() {
  const router = useRouter();
  const allData = useMemo(() => getAllProcessedData(), []);
  const global = useMemo(() => getGlobalStat(), []);
  const [dimFilter, setDimFilter] = useState<string>('all');

  // 为每个指标汇总已确认 / 待确认数据
  const indicatorResults = useMemo<IndicatorResult[]>(() => {
    return indicators.map((ind) => {
      const related = allData.filter((d) => d.relatedIndicators.includes(ind.id));
      const confirmed = related.filter((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified');
      const pending = related.filter((d) => d.processStatus === 'pending');
      const aiAct = getAIActionsByIndicator(ind.id);
      return {
        id: ind.id,
        name: ind.name,
        dimension: ind.dimension,
        weight: ind.weight,
        confirmedItems: confirmed,
        pendingItems: pending,
        totalActions: aiAct?.actionCount || 0,
        isComplete: pending.length === 0 && confirmed.length > 0,
      };
    });
  }, [allData]);

  const filtered = dimFilter === 'all'
    ? indicatorResults
    : indicatorResults.filter((i) => i.dimension === dimFilter);

  const confirmedTotal = allData.filter((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified').length;

  const sourceIcon = (ds: string) =>
    ds === 'ai-prefill' ? <RobotOutlined className="text-purple-400" /> :
    ds === 'user-upload' ? <CloudUploadOutlined className="text-green-400" /> :
    <GlobalOutlined className="text-cyan-400" />;

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      <div className="px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl bg-green-600 flex items-center justify-center text-white text-xl shadow-sm">
            <CheckCircleOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">按指标查看</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">按 17 项指标展示确认后的正式数据 — 每个指标下，我确认了哪些内容。</p>
          </div>
        </div>

        {/* 提示条 */}
        <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-sm">
          <InfoCircleOutlined className="text-blue-600" />
          <span className="text-blue-700">这里是<strong>评价的输入</strong>，AI 将按指标对确认后的数据打分。最终成果的另一种视角请查看
            <button onClick={() => router.push('/panoramic')} className="text-purple-600 hover:underline font-bold mx-1">【按板块查看】</button>
          </span>
        </div>

        {/* KPI 条 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">数据项总数</div>
            <div className="text-2xl font-bold text-blue-600">{global.totalData}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">已确认</div>
            <div className="text-2xl font-bold text-green-600">{confirmedTotal}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">待确认</div>
            <div className="text-2xl font-bold text-amber-600">{global.totalData - confirmedTotal}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className="text-xs text-slate-500 mb-1">覆盖指标</div>
            <div className="text-2xl font-bold text-slate-800">{global.coveredIndicatorCount}/{indicators.length}</div>
          </div>
        </div>

        {/* 维度筛选 */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
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

        {/* 按维度分组展示指标 */}
        <div className="space-y-6">
          {dimensions
            .filter((d) => dimFilter === 'all' || d.key === dimFilter)
            .map((dim) => {
              const dimIndicators = filtered.filter((i) => i.dimension === dim.key);
              if (dimIndicators.length === 0) return null;

              return (
                <div key={dim.key}>
                  {/* 维度标题 */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1 h-5 rounded" style={{ backgroundColor: dim.color }} />
                    <span className="font-bold text-sm text-slate-700">
                      维度{dim.key} · {dim.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      权重 {dim.weight}% · {dimIndicators.length} 项
                    </span>
                  </div>

                  {/* 指标卡片 */}
                  <div className="space-y-3">
                    {dimIndicators.map((ind) => (
                      <div
                        key={ind.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                        style={{ borderLeft: `4px solid ${dim.color}` }}
                      >
                        <div className="px-5 py-4">
                          {/* 第一行：编号 + 名称 + 状态 */}
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-mono text-xs text-slate-400 shrink-0">{ind.id}</span>
                            <span className="font-bold text-slate-800 text-sm flex-1">{ind.name}</span>
                            <span className="text-xs text-slate-400">权重 {ind.weight}%</span>
                            {ind.isComplete ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                                <CheckCircleOutlined /> 数据齐备
                              </span>
                            ) : ind.pendingItems.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                                <ClockCircleOutlined /> {ind.pendingItems.length} 项待确认
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
                                暂无数据
                              </span>
                            )}
                          </div>

                          {/* 第二行：确认内容 — 已确认的数据项及用到的字段 */}
                          {ind.confirmedItems.length > 0 ? (
                            <div className="space-y-2 mb-3">
                              <div className="text-xs font-bold text-slate-500">确认内容</div>
                              {ind.confirmedItems.map((item) => {
                                const usage = item.indicatorUsages?.find((u) => u.indicatorId === ind.id);
                                return (
                                  <div key={item.id} className="flex items-start gap-2 text-xs bg-slate-50 rounded-lg px-3 py-2">
                                    {sourceIcon(item.dataSource)}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-700">{item.displayName}</span>
                                        <span className="text-[10px] text-slate-400">
                                          {item.dataSource === 'ai-prefill' ? 'AI 预填' : '我上传'}
                                          {item.processStatus === 'modified' && ' · 已修改'}
                                        </span>
                                      </div>
                                      {usage && usage.usedFields.length > 0 && (
                                        <div className="flex items-center gap-1 flex-wrap mt-1">
                                          <span className="text-[10px] text-slate-400">用到字段：</span>
                                          {usage.usedFields.map((f, fi) => (
                                            <span key={fi} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                                              {f}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-green-600 font-bold shrink-0">已确认</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 mb-3 italic">暂无已确认内容</div>
                          )}

                          {/* 第三行：待确认项（如果有） */}
                          {ind.pendingItems.length > 0 && (
                            <div className="space-y-2 mb-3">
                              <div className="text-xs font-bold text-amber-600">待确认</div>
                              {ind.pendingItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-xs bg-amber-50/50 rounded-lg px-3 py-2 border border-amber-100">
                                  {sourceIcon(item.dataSource)}
                                  <span className="text-slate-600 flex-1">{item.displayName}</span>
                                  <span className="text-[10px] text-amber-600 font-bold">待确认</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 操作 */}
                          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                            <button
                              onClick={() => router.push(`/data-management/ai-prefill/detail?indicator=${ind.id}`)}
                              className="text-xs text-purple-600 hover:text-purple-700 font-bold flex items-center gap-0.5"
                            >
                              查看 AI 填报 <ArrowRightOutlined />
                            </button>
                            <span className="text-slate-200">|</span>
                            <button
                              onClick={() => router.push(`/metrics/detail`)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                            >
                              指标详情 <ArrowRightOutlined />
                            </button>
                            {ind.pendingItems.length > 0 && (
                              <>
                                <span className="text-slate-200">|</span>
                                <button
                                  onClick={() => router.push(`/data-management/ai-prefill/detail?indicator=${ind.id}`)}
                                  className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5"
                                >
                                  <PlusOutlined /> 去确认
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
