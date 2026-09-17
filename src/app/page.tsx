'use client';

import React, { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  UploadOutlined,
  RobotOutlined,
  BarChartOutlined,
  BellOutlined,
  TrophyOutlined,
  RightOutlined,
  DownOutlined,
  UpOutlined,
  RiseOutlined,
  FallOutlined,
  FormOutlined,
  HistoryOutlined,
  LineChartOutlined,
  RadarChartOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { indicators, dimensions } from '@/lib/indicators';
import { getAllProcessedData, type ProcessedDataItem } from '@/lib/data-management';

// ---------- 类型 ----------
interface EvalReport {
  totalScore?: number;
  grade?: string;
  diagnosis?: string;
  radarData?: { item: string; score: number }[];
  expertResults?: Record<string, { indicator?: string; grade?: string }>;
}

interface HistoryItem {
  id: number;
  date: string;
  grade: string;
  score: number;
  data: EvalReport;
}

type IndicatorStatus = 'done' | 'supplement' | 'progress' | 'empty';

interface IndicatorRow {
  id: string;
  name: string;
  dimension: string;
  weight: number;
  status: IndicatorStatus;
  score: number | null;
  confirmedCount: number;
  pendingCount: number;
}

// ---------- 常量 ----------
const STATUS_CONFIG: Record<
  IndicatorStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  done: { label: '已完成', color: '#16a34a', bg: '#dcfce7', icon: <CheckCircleOutlined /> },
  supplement: { label: '需补充', color: '#ea580c', bg: '#ffedd5', icon: <ExclamationCircleOutlined /> },
  progress: { label: '进行中', color: '#2563eb', bg: '#dbeafe', icon: <ClockCircleOutlined /> },
  empty: { label: '未开始', color: '#94a3b8', bg: '#f1f5f9', icon: <ClockCircleOutlined /> },
};

const ACTION_BY_STATUS: Record<IndicatorStatus, { label: string; path: (id: string) => string }> = {
  done: { label: '查看', path: (id) => `/metrics/detail?id=${id}` },
  supplement: { label: '去补充', path: (id) => `/data-management/ai-prefill/detail?indicator=${id}` },
  progress: { label: '继续', path: (id) => `/data-management/ai-prefill/detail?indicator=${id}` },
  empty: { label: '去填报', path: (id) => `/data-management/ai-prefill/detail?indicator=${id}` },
};

// ---------- 工具函数 ----------
function gradeToScore(grade?: string): number | null {
  if (!grade) return null;
  if (grade.includes('优秀') || grade.includes('卓越')) return 92;
  if (grade.includes('良好')) return 82;
  if (grade.includes('合格')) return 72;
  if (grade.includes('不合格')) return 55;
  return null;
}

function scoreToGrade(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '合格';
  return '待提升';
}

function gradeColor(grade?: string): { color: string; bg: string } {
  if (!grade) return { color: '#64748b', bg: '#f1f5f9' };
  if (grade.includes('优秀') || grade.includes('卓越')) return { color: '#16a34a', bg: '#dcfce7' };
  if (grade.includes('良好')) return { color: '#2563eb', bg: '#dbeafe' };
  if (grade.includes('合格')) return { color: '#ea580c', bg: '#ffedd5' };
  return { color: '#dc2626', bg: '#fef2f2' };
}

function extractIndicatorIds(text?: string): string[] {
  if (!text) return [];
  const matched = text.match(/\d+\.\d+\.\d+/g);
  return matched ? Array.from(new Set(matched)) : [];
}

// 无评价报告时，基于已提交证据的确定性预估分（数据越充分 / 置信度越高 → 分越高）
function estimateScore(confirmed: ProcessedDataItem[], pending: ProcessedDataItem[]): number | null {
  if (confirmed.length === 0 && pending.length === 0) return null;
  let score = 58;
  score += Math.min(confirmed.length, 4) * 6;
  if (confirmed.length > 0) {
    const avgConf = confirmed.reduce((s, d) => s + d.confidence, 0) / confirmed.length;
    score += Math.round(((avgConf - 60) / 40) * 12);
  }
  if (confirmed.some((d) => d.externalVerifications?.some((v) => v.status === 'verified'))) score += 4;
  const ratings = confirmed.map((d) => d.aiPreEvaluation?.rating).filter(Boolean) as string[];
  if (ratings.includes('优秀')) score += 6;
  else if (ratings.includes('良好')) score += 4;
  else if (ratings.includes('合格')) score += 2;
  score -= Math.min(pending.length, 3) * 5;
  return Math.max(50, Math.min(96, score));
}

function heatColor(score: number | null): string {
  if (score == null) return '#e2e8f0';
  if (score >= 90) return '#16a34a';
  if (score >= 80) return '#4ade80';
  if (score >= 70) return '#facc15';
  if (score >= 65) return '#fb923c';
  return '#ef4444';
}

const DIM_COLOR: Record<string, string> = {
  A: '#1677ff',
  B: '#7c3aed',
  C: '#059669',
  D: '#d97706',
};

// ---------- localStorage 外部数据源 ----------
// 通过 useSyncExternalStore 读取，避免在 effect 中同步 setState 造成级联渲染
const EMPTY_SNAPSHOT = '[]';

function subscribeStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getHistorySnapshot(): string {
  return localStorage.getItem('dlpu_eval_history') || EMPTY_SNAPSHOT;
}

function getReadSnapshot(): string {
  return localStorage.getItem('dlpu_read_reports') || EMPTY_SNAPSHOT;
}

function getServerSnapshot(): string {
  return EMPTY_SNAPSHOT;
}

export default function Dashboard() {
  const router = useRouter();

  const allData = useMemo(() => getAllProcessedData(), []);

  const historyRaw = useSyncExternalStore(subscribeStorage, getHistorySnapshot, getServerSnapshot);
  const readRaw = useSyncExternalStore(subscribeStorage, getReadSnapshot, getServerSnapshot);

  const [todoOpen, setTodoOpen] = useState(false);
  const [scoreSort, setScoreSort] = useState<'default' | 'desc' | 'asc'>('default');

  // ---- 从 localStorage 解析评价报告 ----
  const historyReports = useMemo<HistoryItem[]>(() => {
    try {
      const parsed = JSON.parse(historyRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [historyRaw]);

  const unreadReports = useMemo<HistoryItem[]>(() => {
    let readIds: number[] = [];
    try {
      const parsed = JSON.parse(readRaw);
      if (Array.isArray(parsed)) readIds = parsed;
    } catch {
      readIds = [];
    }
    return historyReports.filter((r) => !readIds.includes(r.id)).slice(0, 3);
  }, [historyReports, readRaw]);

  const report = historyReports[0]?.data ?? null;

  // ---- 评价报告 → 指标得分映射（按专家结论中的指标编号回溯） ----
  const reportScoreMap = useMemo(() => {
    const map: Record<string, number> = {};
    const experts = report?.expertResults;
    if (!experts) return map;
    Object.values(experts).forEach((exp) => {
      const s = gradeToScore(exp?.grade);
      if (s == null) return;
      extractIndicatorIds(exp?.indicator).forEach((id) => {
        map[id] = s;
      });
    });
    return map;
  }, [report]);

  // ---- 指标行：状态 + 得分 ----
  const rows = useMemo<IndicatorRow[]>(() => {
    return indicators.map((ind) => {
      const related = allData.filter((d) => d.relatedIndicators.includes(ind.id));
      const confirmed = related.filter(
        (d) => d.processStatus === 'confirmed' || d.processStatus === 'modified'
      );
      const pending = related.filter((d) => d.processStatus === 'pending');

      let status: IndicatorStatus = 'empty';
      if (confirmed.length > 0 && pending.length === 0) status = 'done';
      else if (confirmed.length > 0) status = 'supplement';
      else if (pending.length > 0) status = 'progress';

      const score = reportScoreMap[ind.id] ?? estimateScore(confirmed, pending);

      return {
        id: ind.id,
        name: ind.name,
        dimension: ind.dimension,
        weight: ind.weight,
        status,
        score,
        confirmedCount: confirmed.length,
        pendingCount: pending.length,
      };
    });
  }, [allData, reportScoreMap]);

  // ---- 汇总指标 ----
  const totalIndicators = indicators.length;
  const submittedCount = rows.filter((r) => r.confirmedCount > 0).length;
  const doneCount = rows.filter((r) => r.status === 'done').length;
  const pendingCount = totalIndicators - submittedCount;
  const completionPct = Math.round((submittedCount / totalIndicators) * 100);
  const progressColor =
    completionPct >= 80 ? '#16a34a' : completionPct >= 50 ? '#2563eb' : '#ea580c';

  const scoredRows = rows.filter((r) => r.score != null);
  const weightedScore = scoredRows.length
    ? Math.round(
        scoredRows.reduce((s, r) => s + (r.score as number) * r.weight, 0) /
          scoredRows.reduce((s, r) => s + r.weight, 0)
      )
    : null;
  const overallScore = report?.totalScore ?? weightedScore;
  const overallGrade = report?.grade ?? (overallScore != null ? scoreToGrade(overallScore) : undefined);
  const gc = gradeColor(overallGrade);

  // ---- 维度均分 → 雷达图 / 摘要兜底 ----
  const dimensionAvgs = useMemo(
    () =>
      dimensions.map((d) => {
        const dr = scoredRows.filter((r) => r.dimension === d.key);
        return {
          key: d.key,
          name: d.name,
          color: d.color,
          score: dr.length
            ? Math.round(dr.reduce((s, r) => s + (r.score as number), 0) / dr.length)
            : null,
        };
      }),
    [scoredRows]
  );

  const radarData = report?.radarData?.length
    ? report.radarData
    : dimensionAvgs.map((d) => ({ item: d.name, score: d.score ?? 0 }));

  const trendData = useMemo(
    () =>
      [...historyReports]
        .sort((a, b) => a.id - b.id)
        .map((h) => ({ name: (h.date || '').split(',')[0], score: h.score })),
    [historyReports]
  );

  const ranked = useMemo(
    () => [...scoredRows].sort((a, b) => (b.score as number) - (a.score as number)),
    [scoredRows]
  );
  const strengths = ranked.slice(0, 3);
  const weaknesses = [...ranked].reverse().slice(0, 3);

  const sortedRows = useMemo(() => {
    if (scoreSort === 'default') return rows;
    return [...rows].sort((a, b) => {
      if (a.score == null && b.score == null) return 0;
      if (a.score == null) return 1;
      if (b.score == null) return -1;
      return scoreSort === 'desc' ? b.score - a.score : a.score - b.score;
    });
  }, [rows, scoreSort]);

  const aiSummary = useMemo(() => {
    if (report?.diagnosis) {
      const first = report.diagnosis.split(/[。；\n]/)[0];
      return first ? `${first}。` : report.diagnosis;
    }
    const valid = dimensionAvgs.filter((d) => d.score != null) as { name: string; score: number }[];
    if (valid.length === 0) {
      return '暂无评价数据，完成指标填报并运行 AI 评价后即可生成评价摘要。';
    }
    const sorted = [...valid].sort((a, b) => b.score - a.score);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return `整体${overallGrade ?? '待提升'}，${best.name}维度表现突出，${worst.name}维度相对偏弱。`;
  }, [report, dimensionAvgs, overallGrade]);

  // ---- 倒计时 ----
  const deadline = new Date('2026-10-15T23:59:59');
  const now = new Date('2026-09-15T10:00:00');
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const countdownColor =
    daysLeft <= 3 ? '#dc2626' : daysLeft <= 7 ? '#ea580c' : daysLeft <= 30 ? '#2563eb' : '#94a3b8';

  // ---- 待办数据 ----
  const pendingIndicators = rows.filter((r) => r.pendingCount > 0);
  const pendingMaterials = allData.filter((d) => d.processStatus === 'pending').slice(0, 5);

  // ---- 快捷入口 ----
  const quickLinks = [
    { label: '指标填报', icon: <FormOutlined />, path: '/data-management/ai-prefill', color: 'bg-blue-500' },
    { label: '上传材料', icon: <UploadOutlined />, path: '/data-management/my-uploads', color: 'bg-cyan-500' },
    { label: '我的报告', icon: <FileTextOutlined />, path: '/reports/detail', color: 'bg-purple-500' },
    { label: '历史记录', icon: <HistoryOutlined />, path: '/data-management/records', color: 'bg-slate-500' },
  ];

  // ---- 通知 ----
  const notifications: { type: 'urgent' | 'info' | 'success'; text: string; action?: () => void }[] = [];
  if (daysLeft <= 7) {
    notifications.push({
      type: 'urgent',
      text: `距评价截止仅剩 ${daysLeft} 天，请尽快完成填报`,
      action: () => router.push('/data-management/ai-prefill'),
    });
  }
  if (pendingIndicators.length > 0) {
    notifications.push({
      type: 'info',
      text: `${pendingIndicators.length} 项指标有待确认数据`,
      action: () => router.push('/data-management/ai-prefill'),
    });
  }
  if (unreadReports.length > 0) {
    notifications.push({
      type: 'info',
      text: `${unreadReports.length} 份新报告待查看`,
      action: () => router.push('/reports/detail'),
    });
  }
  if (notifications.length === 0) {
    notifications.push({
      type: 'success',
      text: '所有数据已确认，可以发起 AI 评价',
      action: () => router.push('/evaluations'),
    });
  }

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-[calc(100vh-140px)] p-6 overflow-y-auto custom-scrollbar">

      {/* ============ ① 核心数据卡 ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 完成度 */}
        <button
          onClick={() => router.push('/filling-results/by-indicator')}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-500 mb-1">完成度</div>
              <div className="text-2xl font-bold text-slate-800">{completionPct}%</div>
              <div className="text-xs text-slate-400 mt-1">{submittedCount}/{totalIndicators} 项</div>
              <div className="text-xs font-bold mt-1" style={{ color: countdownColor }}>
                距截止 {daysLeft} 天
              </div>
            </div>
            <Progress
              type="circle"
              percent={completionPct}
              size={64}
              strokeWidth={8}
              strokeColor={progressColor}
            />
          </div>
        </button>

        {/* 综合得分 */}
        <button
          onClick={() => router.push('/reports/detail')}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all relative"
        >
          <TrophyOutlined className="absolute top-4 right-4 text-amber-400 text-lg" />
          <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
            综合得分
            {!report && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">预估</span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{overallScore ?? '—'}</span>
            {overallScore != null && <span className="text-xs text-slate-400">分</span>}
            {overallGrade && (
              <span
                className="ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ color: gc.color, backgroundColor: gc.bg }}
              >
                {overallGrade}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {report ? '来自最近一次 AI 评价' : '基于已提交数据的预估'}
          </div>
        </button>

        {/* 已提交 */}
        <button
          onClick={() => router.push('/filling-results/by-indicator')}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="text-xs text-slate-500 mb-1">已提交</div>
          <div className="text-3xl font-black text-green-600">{submittedCount}</div>
          <div className="text-xs text-slate-400 mt-2">项指标已提交数据</div>
        </button>

        {/* 待完成 */}
        <button
          onClick={() => router.push('/data-management/ai-prefill')}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="text-xs text-slate-500 mb-1">待完成</div>
          <div className="text-3xl font-black text-orange-500">{pendingCount}</div>
          <div className="text-xs text-slate-400 mt-2">项指标尚未提交</div>
        </button>
      </div>

      {/* ============ ② 指标矩阵（左） + ③ 评分详情（右） ============ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* ② 指标完成与得分矩阵 */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 m-0">
              <BarChartOutlined className="text-blue-500" />
              指标完成与得分矩阵
            </h2>
            <div className="flex items-center gap-3">
              {/* 状态图例 */}
              <div className="hidden md:flex items-center gap-2 text-[11px]">
                {(Object.keys(STATUS_CONFIG) as IndicatorStatus[]).map((k) => (
                  <div key={k} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: STATUS_CONFIG[k].color }} />
                    <span className="text-slate-500">{STATUS_CONFIG[k].label}</span>
                  </div>
                ))}
              </div>
              {/* 排序 */}
              <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden">
                {([
                  { k: 'default', label: '默认' },
                  { k: 'desc', label: '得分高→低' },
                  { k: 'asc', label: '得分低→高' },
                ] as const).map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setScoreSort(o.k)}
                    className={`text-[11px] font-bold px-2 py-1 transition-colors ${
                      scoreSort === o.k ? 'bg-blue-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 得分热力图 */}
          <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500">指标得分热力图</span>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>低</span>
                {['#ef4444', '#fb923c', '#facc15', '#4ade80', '#16a34a'].map((c) => (
                  <div key={c} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
                <span>高</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {rows.map((r) => (
                <div
                  key={r.id}
                  title={`${r.id} ${r.name} · ${r.score != null ? `${r.score} 分` : STATUS_CONFIG[r.status].label}`}
                  onClick={() => router.push(ACTION_BY_STATUS[r.status].path(r.id))}
                  className="w-5 h-5 rounded cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: heatColor(r.score) }}
                />
              ))}
            </div>
          </div>

          {/* 表头 */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[11px] font-bold text-slate-400 border-b border-slate-100">
            <div className="col-span-6">指标名称</div>
            <div className="col-span-2">完成状态</div>
            <div className="col-span-2">得分</div>
            <div className="col-span-2 text-right">操作</div>
          </div>

          {/* 行 */}
          <div className="flex-1 divide-y divide-slate-50">
            {sortedRows.map((r) => {
              const cfg = STATUS_CONFIG[r.status];
              const act = ACTION_BY_STATUS[r.status];
              return (
                <div
                  key={r.id}
                  onClick={() => router.push(`/metrics/detail?id=${r.id}`)}
                  className="grid grid-cols-12 gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="col-span-6 flex items-center gap-2 min-w-0">
                    <span
                      className="w-1 h-8 rounded shrink-0"
                      style={{ backgroundColor: DIM_COLOR[r.dimension] }}
                    />
                    <span className="font-mono text-xs text-slate-400 shrink-0">{r.id}</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{r.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">权重 {r.weight}%</span>
                  </div>
                  <div className="col-span-2">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-2">
                    {r.score != null ? (
                      <span className="text-lg font-bold" style={{ color: heatColor(r.score) }}>
                        {r.score}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(act.path(r.id));
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-0.5"
                    >
                      {act.label}
                      <RightOutlined />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ③ 评分详情 */}
        <div className="flex flex-col gap-4">

          {/* A. 得分趋势 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <LineChartOutlined className="text-blue-500" />
              得分趋势
            </h3>
            {trendData.length >= 2 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} width={30} />
                    <RechartsTooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#2563eb' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">
                暂无历史对比，多次评价后可查看得分走势
              </div>
            )}
          </div>

          {/* B. 得分雷达图 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <RadarChartOutlined className="text-indigo-500" />
              各维度得分雷达图
            </h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="68%" data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="item"
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#cbd5e1', fontSize: 9 }} />
                  <Radar
                    name="得分"
                    dataKey="score"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* C. 优势项 / 薄弱项 */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
              <TrophyOutlined className="text-amber-500" />
              优势项 / 薄弱项
            </h3>

            <div className="mb-4">
              <div className="text-xs font-bold text-green-600 flex items-center gap-1 mb-2">
                <RiseOutlined /> 优势项 Top 3
              </div>
              {strengths.length > 0 ? (
                <div className="space-y-1.5">
                  {strengths.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/metrics/detail?id=${r.id}`)}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5"
                    >
                      <span className="font-mono text-slate-400 shrink-0">{r.id}</span>
                      <span className="text-slate-700 truncate flex-1">{r.name}</span>
                      <span className="font-bold text-green-600 shrink-0">{r.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400">暂无可评估得分</div>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-2">
                <FallOutlined /> 薄弱项 Top 3
              </div>
              {weaknesses.length > 0 ? (
                <div className="space-y-1.5">
                  {weaknesses.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => router.push(`/metrics/detail?id=${r.id}`)}
                      className="flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5"
                    >
                      <span className="font-mono text-slate-400 shrink-0">{r.id}</span>
                      <span className="text-slate-700 truncate flex-1">{r.name}</span>
                      <span className="font-bold text-orange-500 shrink-0">{r.score}</span>
                    </div>
                  ))}
                  <div className="text-[11px] text-orange-500 flex items-center gap-1 pt-1">
                    <WarningOutlined /> 建议重点改进
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">暂无可评估得分</div>
              )}
            </div>
          </div>

          {/* D. AI 评价摘要 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
              <RobotOutlined className="text-blue-600" />
              AI 评价摘要
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed m-0">{aiSummary}</p>
          </div>
        </div>
      </div>

      {/* ============ ④ 待办事项（折叠） ============ */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <button
          onClick={() => setTodoOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span className="font-bold text-slate-800">待办事项</span>
            <span className="text-xs text-slate-400 truncate">
              已完成 {doneCount} 项 · {pendingIndicators.length} 项待确认 · {unreadReports.length} 份报告待查看
            </span>
          </div>
          <span className="text-slate-400">
            {todoOpen ? <UpOutlined /> : <DownOutlined />}
          </span>
        </button>

        {todoOpen && (
          <div className="px-4 pb-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 待填报指标 */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-2">待填报 / 待确认指标</h3>
              {pendingIndicators.length === 0 ? (
                <div className="text-sm text-slate-400 py-2">所有指标已确认</div>
              ) : (
                <div className="space-y-2">
                  {pendingIndicators.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      onClick={() =>
                        router.push(`/data-management/ai-prefill/detail?indicator=${r.id}`)
                      }
                      className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-blue-600 font-bold shrink-0">
                          {r.id}
                        </span>
                        <span className="text-sm text-slate-700 truncate">{r.name}</span>
                      </div>
                      <span className="text-xs text-blue-600 font-bold flex items-center gap-1 shrink-0">
                        去填报 <RightOutlined />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 待补充材料 */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-2">待补充材料</h3>
              {pendingMaterials.length === 0 ? (
                <div className="text-sm text-slate-400 py-2">无待补充项</div>
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
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-bold shrink-0">
                            AI
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-orange-600 font-bold flex items-center gap-1 shrink-0">
                        补充 <RightOutlined />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 待查看报告 */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 mb-2">待查看报告</h3>
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
                      <span className="text-sm text-slate-700">
                        {r.score} 分 · {r.grade}
                      </span>
                      <span className="text-xs text-purple-600 font-bold flex items-center gap-1 shrink-0">
                        查看 <RightOutlined />
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ ⑤ 快捷入口 + 通知 ============ */}
      <div className="grid grid-cols-3 gap-4">
        {/* 快捷入口 */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="grid grid-cols-4 gap-3">
            {quickLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${link.color} text-white flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}
                >
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
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    n.type === 'urgent' ? 'bg-red-500' : n.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                />
                <span className="text-xs text-slate-600 leading-relaxed">{n.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}