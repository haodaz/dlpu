'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  RobotOutlined,
  BarChartOutlined,
  BellOutlined,
  ArrowRightOutlined,
  FileSearchOutlined,
  DatabaseOutlined,
  TrophyOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Progress } from 'antd';
import {
  indicators,
  dimensions,
  getAIActionsByIndicator,
} from '@/lib/indicators';
import {
  getAllProcessedData,
  getGlobalStat,
  buildEvaluationContext,
  getAllDataRecords,
  actionConfig,
} from '@/lib/data-management';

export default function Dashboard() {
  const router = useRouter();

  // ---- 计算评价上下文（只取已确认数据） ----
  const evalCtx = buildEvaluationContext();
  const globalStat = getGlobalStat();
  const allData = getAllProcessedData();
  const records = getAllDataRecords();

  // ---- 指标状态矩阵 ----
  type IndicatorStatus = 'empty' | 'pending' | 'confirmed' | 'partial';
  const getIndicatorStatus = (indId: string): IndicatorStatus => {
    const items = evalCtx.indicatorData[indId] || [];
    const pendingItems = allData.filter(
      (d) => d.processStatus === 'pending' && d.relatedIndicators.includes(indId)
    );
    if (items.length > 0 && pendingItems.length === 0) return 'confirmed';
    if (items.length > 0 && pendingItems.length > 0) return 'partial';
    if (pendingItems.length > 0) return 'pending';
    return 'empty';
  };

  const statusConfig: Record<IndicatorStatus, { color: string; bg: string; label: string }> = {
    confirmed: { color: '#16a34a', bg: '#dcfce7', label: '已确认' },
    partial: { color: '#ea580c', bg: '#ffedd5', label: '部分确认' },
    pending: { color: '#2563eb', bg: '#dbeafe', label: '待确认' },
    empty: { color: '#94a3b8', bg: '#f1f5f9', label: '无数据' },
  };

  // ---- 倒计时 ----
  const deadline = new Date('2026-10-15T23:59:59');
  const now = new Date('2026-09-15T10:00:00');
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const countdownColor =
    daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#ea580c' : daysLeft <= 30 ? '#2563eb' : '#94a3b8';
  const countdownBg =
    daysLeft <= 3 ? 'bg-red-50' : daysLeft <= 7 ? 'bg-orange-50' : daysLeft <= 30 ? 'bg-blue-50' : 'bg-slate-50';
  const countdownFlash = daysLeft <= 3 ? 'animate-pulse' : '';

  // ---- 完成度 ----
  const confirmedIndicators = Object.keys(evalCtx.indicatorData).length;
  const totalIndicators = indicators.length;
  const completionPct = Math.round((confirmedIndicators / totalIndicators) * 100);

  // ---- 待办事项 ----
  // 待填报指标：有 pending 数据的指标
  const pendingIndicatorIds = indicators
    .filter((ind) => {
      const pendingItems = allData.filter(
        (d) => d.processStatus === 'pending' && d.relatedIndicators.includes(ind.id)
      );
      return pendingItems.length > 0;
    })
    .map((ind) => ind.id);

  // 待补充材料：processStatus === 'pending' 的 AI 预填项
  const pendingMaterials = allData
    .filter((d) => d.processStatus === 'pending')
    .slice(0, 5);

  // 待查看报告：从 localStorage 读取
  const [unreadReports, setUnreadReports] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('dlpu_eval_history');
    if (saved) {
      try {
        const all = JSON.parse(saved);
        const readIds = JSON.parse(localStorage.getItem('dlpu_read_reports') || '[]');
        const unread = all.filter((r: any) => !readIds.includes(r.id));
        setUnreadReports(unread.slice(0, 3));
      } catch {}
    }
  }, []);

  // ---- 最近动态（取最近 5 条记录） ----
  const recentRecords = records.slice(0, 5);

  // ---- 关键数字 ----
  const materialCount = globalStat.totalData;
  const externalCount = allData.filter(
    (d) => d.aiPreEvaluation || d.externalVerifications?.length
  ).length;
  const aiScore = 68; // 最近一次评价分数（mock，可从 localStorage 读取）

  // ---- 快捷入口 ----
  const quickLinks = [
    { label: '材料填报', icon: <UploadOutlined />, path: '/data-management/my-uploads', color: 'bg-blue-500' },
    { label: 'AI 填报', icon: <RobotOutlined />, path: '/data-management/ai-prefill', color: 'bg-cyan-500' },
    { label: '填报成果', icon: <BarChartOutlined />, path: '/filling-results/by-indicator', color: 'bg-emerald-500' },
    { label: '报告列表', icon: <FileTextOutlined />, path: '/reports/detail', color: 'bg-purple-500' },
    { label: '指标体系', icon: <DatabaseOutlined />, path: '/metrics', color: 'bg-orange-500' },
    { label: '提交记录', icon: <FileSearchOutlined />, path: '/data-management/records', color: 'bg-slate-500' },
  ];

  // ---- 通知 ----
  const notifications: { type: 'urgent' | 'info' | 'success'; text: string; action?: () => void }[] = [];
  if (daysLeft <= 7) {
    notifications.push({ type: 'urgent', text: `距评价截止仅剩 ${daysLeft} 天，请尽快完成填报`, action: () => router.push('/data-management/ai-prefill') });
  }
  if (pendingIndicatorIds.length > 0) {
    notifications.push({ type: 'info', text: `${pendingIndicatorIds.length} 项指标有待确认数据`, action: () => router.push('/data-management/ai-prefill') });
  }
  if (unreadReports.length > 0) {
    notifications.push({ type: 'info', text: `${unreadReports.length} 份新报告待查看`, action: () => router.push('/reports/detail') });
  }
  if (notifications.length === 0) {
    notifications.push({ type: 'success', text: '所有数据已确认，可以发起 AI 评价', action: () => router.push('/evaluations') });
  }

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-[calc(100vh-140px)] p-6 overflow-y-auto custom-scrollbar">

      {/* ============ ① 当前任务卡（顶部主视觉） ============ */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${countdownBg} border-opacity-30`}>
        <div className="flex items-center justify-between p-6 gap-6">
          {/* 左侧：任务信息 */}
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${countdownFlash}`}
              style={{ backgroundColor: countdownColor }}>
              <ClockCircleOutlined style={{ color: '#fff', fontSize: 28 }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 m-0">2026 年度专业评价</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-slate-500">评价周期：2026.09.01 — 2026.10.15</span>
                <span className={`text-sm font-bold ${countdownFlash}`} style={{ color: countdownColor }}>
                  距截止 {daysLeft} 天
                </span>
              </div>
            </div>
          </div>

          {/* 中间：完成度环形图 */}
          <div className="flex items-center gap-4">
            <Progress
              type="circle"
              percent={completionPct}
              size={72}
              strokeColor={completionPct >= 80 ? '#16a34a' : completionPct >= 50 ? '#2563eb' : '#ea580c'}
              strokeWidth={8}
            />
            <div>
              <div className="text-2xl font-bold text-slate-800">{confirmedIndicators}/{totalIndicators}</div>
              <div className="text-xs text-slate-500">指标已确认</div>
            </div>
          </div>

          {/* 右侧：主按钮 */}
          <button
            onClick={() => router.push('/data-management/ai-prefill')}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-md flex items-center gap-2 shrink-0"
          >
            继续填报
            <ArrowRightOutlined />
          </button>
        </div>
      </div>

      {/* ============ ② + ③ 待办事项（左） + 完成速览（右） ============ */}
      <div className="grid grid-cols-2 gap-4 flex-1">

        {/* ② 待办事项（左） */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ExclamationCircleOutlined className="text-orange-500" />
            待办事项
          </h2>

          {/* 待填报指标 */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">待填报指标</h3>
            {pendingIndicatorIds.length === 0 ? (
              <div className="text-sm text-slate-400 py-2">✅ 所有指标已确认</div>
            ) : (
              <div className="space-y-2">
                {indicators.filter((ind) => pendingIndicatorIds.includes(ind.id)).slice(0, 4).map((ind) => (
                  <div
                    key={ind.id}
                    onClick={() => router.push(`/data-management/ai-prefill/detail?indicator=${ind.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-blue-600 font-bold">{ind.id}</span>
                      <span className="text-sm text-slate-700">{ind.name}</span>
                    </div>
                    <button className="text-xs text-blue-600 font-bold flex items-center gap-1">
                      去填报 <RightOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 待补充材料 */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">待补充材料</h3>
            {pendingMaterials.length === 0 ? (
              <div className="text-sm text-slate-400 py-2">✅ 无待补充项</div>
            ) : (
              <div className="space-y-2">
                {pendingMaterials.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => router.push('/data-management/my-uploads')}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-slate-700 truncate">{m.displayName}</span>
                      {m.dataSource === 'ai-prefill' && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold shrink-0">AI</span>
                      )}
                    </div>
                    <button className="text-xs text-orange-600 font-bold flex items-center gap-1 shrink-0">
                      补充 <RightOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 待查看报告 */}
          <div className="flex-1">
            <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">待查看报告</h3>
            {unreadReports.length === 0 ? (
              <div className="text-sm text-slate-400 py-2">暂无未读报告</div>
            ) : (
              <div className="space-y-2">
                {unreadReports.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => router.push(`/evaluations?reportId=${r.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50 border border-purple-100 hover:bg-purple-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-700">{r.score}分 · {r.grade}</span>
                    </div>
                    <button className="text-xs text-purple-600 font-bold flex items-center gap-1">
                      查看 <RightOutlined />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ③ 完成速览（右） */}
        <div className="flex flex-col gap-4">
          {/* 指标矩阵热力图 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BarChartOutlined className="text-blue-500" />
                指标矩阵
              </h2>
              <div className="flex items-center gap-2 text-xs">
                {Object.entries(statusConfig).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: v.color }} />
                    <span className="text-slate-500">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {dimensions.map((dim) => {
                const dimIndicators = indicators.filter((i) => i.dimension === dim.key);
                return (
                  <div key={dim.key}>
                    <div className="text-xs font-bold text-slate-400 mb-1.5">
                      {dim.name}（{dim.weight}%）
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {dimIndicators.map((ind) => {
                        const status = getIndicatorStatus(ind.id);
                        const cfg = statusConfig[status];
                        return (
                          <div
                            key={ind.id}
                            onClick={() => router.push(`/filling-results/by-indicator`)}
                            className="group relative rounded-lg p-2 cursor-pointer hover:scale-105 transition-transform"
                            style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33` }}
                            title={`${ind.id} ${ind.name} — ${cfg.label}`}
                          >
                            <div className="text-[10px] font-mono font-bold" style={{ color: cfg.color }}>
                              {ind.id}
                            </div>
                            <div className="text-[9px] text-slate-500 truncate">
                              {ind.name.substring(0, 4)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 关键数字 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
              <DatabaseOutlined className="text-blue-500 text-lg mb-1" />
              <div className="text-2xl font-bold text-slate-800">{materialCount}</div>
              <div className="text-xs text-slate-500">材料数</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
              <RobotOutlined className="text-cyan-500 text-lg mb-1" />
              <div className="text-2xl font-bold text-slate-800">{externalCount}</div>
              <div className="text-xs text-slate-500">外部引用</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 text-center">
              <TrophyOutlined className="text-amber-500 text-lg mb-1" />
              <div className="text-2xl font-bold text-slate-800">{aiScore}</div>
              <div className="text-xs text-slate-500">AI 预估分</div>
            </div>
          </div>

          {/* 最近动态 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">最近动态</h3>
            <div className="space-y-2.5">
              {recentRecords.map((r) => {
                const actCfg = actionConfig[r.action];
                return (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: actCfg.color }}
                    />
                    <span className="text-slate-700 flex-1 truncate">{r.materialName}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold shrink-0"
                      style={{ color: actCfg.color, backgroundColor: actCfg.bg }}
                    >
                      {actCfg.label}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{r.timestamp.split(' ')[1]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ============ ④ 快捷入口 + 通知（底部） ============ */}
      <div className="grid grid-cols-3 gap-4">
        {/* 快捷入口 */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="grid grid-cols-6 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-10 h-10 rounded-xl ${link.color} text-white flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
                  {link.icon}
                </div>
                <span className="text-xs font-medium text-slate-600">{link.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 通知 */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <BellOutlined className="text-blue-500" />
            <span className="text-sm font-bold text-slate-800">通知</span>
          </div>
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <div
                key={i}
                onClick={n.action}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  n.type === 'urgent' ? 'bg-red-500' : n.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <span className="text-xs text-slate-600 leading-relaxed">{n.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
