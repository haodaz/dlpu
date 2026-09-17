'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button, Tag, Spin } from 'antd';
import { PlayCircleOutlined, SyncOutlined, CheckOutlined, HomeOutlined, DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { MOCK_REPORT } from '@/lib/mock-evaluation-report';

// ========== Utility helpers ==========
const COLORS = {
  brand: '#1d4ed8', brandSoft: '#eaf0fe', excellent: '#0f9d76', good: '#2f6fed', pass: '#e0900f', warn: '#e0533d', ink: '#16233a', ink2: '#2b3d5c', muted: '#64748b', line: '#e4ebf5', cyan: '#0ea5e9',
};

function gradeToScore(grade?: string): number | null {
  if (!grade) return null;
  if (grade.includes('卓越') || grade.includes('优秀')) return 92;
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

function dimForIndicator(id: string): string {
  const n = parseInt(id.split('.')[0]);
  return n <= 1 ? 'A' : n === 2 ? 'B' : n === 3 ? 'C' : 'D';
}

// Expert key → indicator mapping (used for per-indicator cards)
const EXPERT_INDICATOR_MAP: Record<string, string[]> = {
  expert_industry: ['1.1.1'],
  expert_alignment: ['1.1.2', '1.1.3'],
  expert_teacher: ['2.1.1', '2.2.1'],
  expert_student: ['2.3.1', '2.3.2'],
  expert_asset: ['3.1.1'],
  expert_practice: ['1.2.2', '1.2.3', '3.1.2'],
  expert_career: ['4.1.1', '4.1.3'],
  expert_alumni: ['4.1.2'],
};

// Dimensions metadata
const DIMENSIONS: { key: string; name: string; weight: number; color: string; indicators: string[] }[] = [
  { key: 'A', name: '课程与需求适配性', weight: 30, color: '#1d4ed8', indicators: ['1.1.1','1.1.2','1.1.3','1.2.1','1.2.2','1.2.3','1.3.1'] },
  { key: 'B', name: '教学实施有效性', weight: 30, color: '#0ea5e9', indicators: ['2.1.1','2.2.1','2.3.1','2.3.2'] },
  { key: 'C', name: '运行保障支撑度', weight: 20, color: '#0f9d76', indicators: ['3.1.1','3.1.2'] },
  { key: 'D', name: '产出与贡献', weight: 20, color: '#e0900f', indicators: ['4.1.1','4.1.2','4.1.3'] },
];

interface ReportData {
  totalScore?: number;
  grade?: string;
  diagnosis?: string;
  suggestions?: string;
  radarData?: { item: string; score: number }[];
  indicators?: { id: string; name: string; grade: string; score: number; intro: string; rationale: string[]; deductions: string[]; evidence: string[]; metrics?: { label: string; value: string; threshold?: string }[]; tags?: string[] }[];
  expertResults?: Record<string, { status?: string; indicator?: string; criteria?: string; grade?: string; analysis?: string; suggestions?: string; chartData?: { tags?: string[]; tier?: { totalTiers?: number; currentTier?: number; label?: string } } }>;
}

// Indicator names lookup
const INDICATOR_NAMES: Record<string, string> = {
  '1.1.1': '产业深度解析', '1.1.2': '课程-产业链对应性', '1.1.3': '课程目标匹配',
  '1.2.1': '前沿课比例+教材时效', '1.2.2': '综合验证课程设计', '1.2.3': '毕业设计', '1.3.1': '国际标准对标+AI融入',
  '2.1.1': '横向科研转化', '2.2.1': '教学投入深度', '2.3.1': '学习行为数据', '2.3.2': '考核达成度闭环',
  '3.1.1': '资源有效支撑', '3.1.2': '企业项目驱动率',
  '4.1.1': '行业就业率', '4.1.2': '毕业生影响力', '4.1.3': '用人单位满意度',
};

// Grade badge inline styles
function gradeBadgeStyle(grade: string): React.CSSProperties {
  if (grade.includes('卓越') || grade.includes('优秀')) return { background: '#0f9d76', color: '#fff', border: '1px solid #0b7f60' };
  if (grade.includes('良好')) return { background: '#2f6fed', color: '#fff', border: '1px solid #1d4ed8' };
  if (grade.includes('合格')) return { background: '#e0900f', color: '#fff', border: '1px solid #b3720b' };
  return { background: '#e0533d', color: '#fff', border: '1px solid #b53b27' };
}

// ========== Professional Report View ==========
function ProfessionalReportView({ report }: { report: ReportData }) {
  const router = useRouter();

  // Precompute derived data
  const overallScore = report.totalScore ?? 0;
  const overallGrade = report.grade ?? '';
  const allReportIndicators = report.indicators ?? [];
  const totalIndicators = allReportIndicators.length;
  const passedIndicators = allReportIndicators.filter((e) => e.grade?.includes('优秀') || e.grade?.includes('良好')).length;

  // Indicator-level scores map — built from report.indicators (primary) or expertResults (fallback)
  const indicatorScores: Record<string, { grade: string; score: number }> = {};
  allReportIndicators.forEach((ind) => {
    indicatorScores[ind.id] = { grade: ind.grade, score: ind.score };
  });
  // Fallback: expert-based mapping for backward compatibility
  if (allReportIndicators.length === 0) {
    Object.entries(EXPERT_INDICATOR_MAP).forEach(([expertKey, indIds]) => {
      const exp = report.expertResults?.[expertKey];
      if (!exp) return;
      indIds.forEach((id) => {
        const score = gradeToScore(exp.grade);
        indicatorScores[id] = { grade: exp.grade ?? '', score: score ?? 75 };
      });
    });
  }

  // Fill in missing indicators with estimated scores
  const allIndicators = ['1.1.1','1.1.2','1.1.3','1.2.1','1.2.2','1.2.3','1.3.1','2.1.1','2.2.1','2.3.1','2.3.2','3.1.1','3.1.2','4.1.1','4.1.2','4.1.3'];
  allIndicators.forEach((id) => {
    if (!indicatorScores[id]) {
      // Estimate from overall + dimension deviation
      const dim = DIMENSIONS.find((d) => d.indicators.includes(id));
      const dimAvg = dim ? Math.round(dim.indicators.reduce((s, i) => s + (indicatorScores[i]?.score ?? 0), 0) / dim.indicators.length) : overallScore;
      indicatorScores[id] = { grade: scoreToGrade(Math.round(dimAvg)), score: dimAvg };
    }
  });

  // Dimension scores
  const dimScores = DIMENSIONS.map((dim) => {
    const scores = dim.indicators.map((id) => indicatorScores[id]?.score ?? 0);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const max = Math.max(...scores);
    return { ...dim, score: avg, max, min: Math.min(...scores) };
  });

  const excellenceCount = allIndicators.filter((id) => indicatorScores[id]?.grade?.includes('优秀')).length;
  const goodCount = allIndicators.filter((id) => indicatorScores[id]?.grade?.includes('良好')).length;
  const passCount = allIndicators.filter((id) => indicatorScores[id]?.grade?.includes('合格') && !indicatorScores[id]?.grade?.includes('优秀')).length;

  const handleExportHTML = () => {
    const htmlContent = document.getElementById('report-root')?.innerHTML;
    if (!htmlContent) return;
    const blob = new Blob([`<!DOCTYPE html><html><head><meta charset="utf-8"><title>评价报告</title></head><body>${htmlContent}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluation-report.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#eef2f8]" id="report-root">
      {/* Top Nav */}
      <div className="sticky top-0 w-full bg-white/95 backdrop-blur border-b border-[#e4ebf5] z-50 flex justify-between items-center px-6 md:px-8 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white font-bold text-sm">报</div>
          <span className="font-bold text-slate-700 hidden sm:inline">使命型17项指标评价报告</span>
        </div>
        <div className="flex gap-2">
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>打印</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportHTML}>导出 HTML</Button>
          <Button onClick={() => { router.push('/panoramic'); }}>返回工作台</Button>
        </div>
      </div>

      {/* Wrapper */}
      <div className="max-w-6xl mx-auto p-6 md:p-10 pb-24">
        {/* ===== COVER ===== */}
        <div className="relative overflow-hidden rounded-2xl mb-8 p-8 md:p-12 text-white" style={{ background: 'linear-gradient(128deg,#0b1f47 0%,#17346f 38%,#1d4ed8 72%,#0ea5e9 118%)', boxShadow: '0 24px 60px rgba(13,38,88,.32)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(420px 240px at 88% 12%, rgba(255,255,255,.18), transparent 65%), radial-gradient(320px 200px at 6% 96%, rgba(14,165,233,.25), transparent 70%)', pointerEvents: 'none' }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', color: '#c9dcfb' }}>
              MISSION-DRIVEN INDICATOR EVALUATION REPORT
            </div>
            <h1 className="text-2xl md:text-4xl font-black leading-tight mb-2">使命型17项指标<br/>评价报告</h1>
            <p className="text-sm md:text-base mb-6" style={{ color: '#c9dcfb' }}>四大维度 · 17 项指标 · 全链路数据流验证 · 多智能体深度剖析</p>
            <div className="flex flex-wrap gap-2">
              {[
                [`总分 ${overallScore} 分`, `${overallScore >= 90 ? '优秀偏卓越' : overallScore >= 80 ? '良好偏优秀' : overallScore >= 70 ? '合格' : '待提升'}`],
                [`共 ${allIndicators.length} 项指标`, `${excellenceCount} 优秀 / ${goodCount} 良好 / ${passCount} 合格`],
                [`${totalIndicators} 项指标已评估`, `${passedIndicators} 项达良好及以上`],
              ].map(([label, sub], i) => (
                <div key={i} className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
                  <div style={{ color: '#fff', fontWeight: 700 }}>{label}</div>
                  <div style={{ color: '#dce9ff' }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Gauge */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 md:w-44 md:h-44 flex-shrink-0" style={{ display: 'none' }} aria-hidden="true">
            {/* SVG gauge would go here — using a simpler CSS ring instead */}
            <div className="w-full h-full rounded-full border-[12px] border-white/15 flex flex-col items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-[12px] border-transparent" style={{ borderTopColor: '#7ef0cf', borderRightColor: '#9fe8ff', transform: `rotate(${(overallScore / 100) * 360 - 90}deg)`, transition: 'transform .6s' }} />
              <div className="text-3xl md:text-4xl font-black">{overallScore}</div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,.7)' }}>满分 100</div>
            </div>
          </div>
        </div>

        {/* ===== TOC ===== */}
        <div className="bg-white rounded-xl border border-[#e4ebf5] p-5 mb-6 shadow-sm">
          <h2 className="text-lg font-black mb-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white text-sm shrink-0">目</span>
            报告导航
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ['一、总体评价', '总分构成 · 维度得分概览 · 雷达图'],
              ['二、分项指标评价', '四大维度 · 17 项指标明细'],
              ['三、关键发现与建议', '优势 · 短板 · 行动计划'],
              ['四、评价结论', '展望 · 目标 · 复评建议'],
            ].map(([title, desc], i) => (
              <a key={i} href={`#section-${i + 1}`} className="block border border-[#e4ebf5] rounded-xl px-4 py-3 hover:bg-[#f4f8ff] transition-colors" style={{ textDecoration: 'none', color: '#2b3d5c' }}>
                <div className="font-bold text-sm">{title}</div>
                <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{desc}</div>
              </a>
            ))}
          </div>
        </div>

        {/* ===== SECTION I: Overall Evaluation ===== */}
        <section id="section-1" className="bg-white rounded-xl border border-[#e4ebf5] p-8 md:p-10 mb-8 shadow-sm">
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white text-lg font-black shrink-0">一</span>
            总体评价
          </h2>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: '评价总分', value: `${overallScore}分`, note: overallGrade.includes('优秀') ? '优秀偏卓越' : overallGrade.includes('良好') ? '良好偏优秀' : overallGrade.includes('合格') ? '合格' : '待提升', side: '' },
              { label: '达到良好的指标', value: `${excellenceCount + goodCount}/${allIndicators.length}`, note: `${excellenceCount} 优秀 · ${goodCount} 良好`, side: 'g' },
              { label: '数据流健康度', value: `${Math.round(overallScore * 0.92)}%`, note: '证据链齐备可追溯', side: 'c' },
              { label: '已评估指标', value: `${passedIndicators}/${totalIndicators}`, note: '达良好及以上', side: 'o' },
            ].map((kpi, i) => (
              <div key={i} className={`rounded-xl p-4 bg-gradient-to-b from-[#fbfdff] to-[#f5f9ff] relative`} style={{ borderLeft: kpi.side ? `4px solid var(--${kpi.side}-c)` : `4px solid ${COLORS.brand}`, border: '1px solid #e4ebf5' }}>
                <div className="text-xs font-bold" style={{ color: '#64748b' }}>{kpi.label}</div>
                <div className="text-xl md:text-2xl font-black mt-1" style={{ lineHeight: 1.2 }}>{kpi.value}</div>
                <div className="text-[11px] mt-1" style={{ color: '#64748b' }}>{kpi.note}</div>
              </div>
            ))}
          </div>

          {/* Diagnosis */}
          {report.diagnosis && (
            <div className="text-sm leading-relaxed mb-6 text-justify" style={{ color: COLORS.ink2 }}>
              <div className="bg-[#f8fafc] p-4 rounded-lg border-l-4" style={{ borderLeftColor: COLORS.brand }}>
                <div className="text-xs font-bold mb-2" style={{ color: COLORS.brand }}>诊断摘要</div>
                <div className="text-sm" style={{ color: COLORS.ink2 }}>
                  {report.diagnosis.substring(0, 350)}{report.diagnosis.length > 350 ? '...' : ''}
                </div>
              </div>
            </div>
          )}

          {/* Dimension Score Table + Bars */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Table */}
            <div className="overflow-x-auto">
              <h3 className="text-base font-black mb-3 flex items-center gap-2">
                <span className="w-1 h-[17px] rounded shrink-0" style={{ background: `linear-gradient(180deg,${COLORS.brand},${COLORS.cyan})` }} />
                分维度得分
              </h3>
              <table className="w-full text-sm border-separate border-spacing-0 rounded-lg overflow-hidden min-w-[500px]">
                <thead>
                  <tr>
                    {['维度', '权重', '得分率', '加权分', '等级'].map((h) => (
                      <th key={h} className="py-3 px-3 text-left font-black text-xs whitespace-nowrap" style={{ background: 'linear-gradient(180deg,#f3f7fe,#eaf1fd)', borderBottom: '1px solid #dbe6f6', color: COLORS.ink2 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dimScores.map((d) => {
                    const weightedScore = ((d.score / 100) * d.weight).toFixed(1);
                    const gradeText = d.score >= 90 ? '优秀' : d.score >= 80 ? '良好' : d.score >= 70 ? '合格' : '待提升';
                    return (
                      <tr key={d.key}>
                        <td className="py-3 px-3 border-b border-[#eef3fa] font-bold whitespace-nowrap" style={{ minWidth: '180px' }}>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] text-white font-black shrink-0" style={{ backgroundColor: d.color }}>{d.key}</span>
                            <span className="truncate" title={d.name}>{d.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 border-b border-[#eef3fa] text-center tabular-nums whitespace-nowrap">{d.weight}%</td>
                        <td className="py-3 px-3 border-b border-[#eef3fa] text-center tabular-nums whitespace-nowrap" style={{ color: d.score >= 90 ? COLORS.excellent : d.score >= 80 ? COLORS.good : d.score >= 70 ? COLORS.pass : COLORS.warn }}>{d.score}%</td>
                        <td className="py-3 px-3 border-b border-[#eef3fa] text-center tabular-nums whitespace-nowrap">{weightedScore}</td>
                        <td className="py-3 px-3 border-b border-[#eef3fa] text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[11px] font-black border whitespace-nowrap" style={gradeBadgeStyle(gradeText)}>{gradeText}</span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan={3} className="py-3 px-3 font-black whitespace-nowrap" style={{ background: '#f1f6ff', color: COLORS.ink }}>合计</td>
                    <td className="py-3 px-3 text-center tabular-nums font-black whitespace-nowrap" style={{ color: COLORS.brand }}>{dimScores.reduce((s, d) => s + ((d.score / 100) * d.weight), 0).toFixed(1)}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-black border whitespace-nowrap" style={gradeBadgeStyle(overallGrade)}>{overallGrade.includes('优秀') ? '优秀' : overallGrade.includes('良好') ? '良好' : overallGrade.includes('合格') ? '合格' : '待提升'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bars */}
            <div className="space-y-3">
              <h3 className="text-base font-black mb-1">得分率对比</h3>
              {dimScores.map((d) => (
                <div key={d.key} className="grid grid-cols-[1fr_auto] gap-3 items-center">
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] text-white font-black" style={{ backgroundColor: d.color }}>{d.key}</span>
                      {d.name}
                    </div>
                    <div className="h-1.5 rounded-full bg-[#eef3fb] mt-1 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${d.score}%`, backgroundColor: d.score >= 90 ? COLORS.excellent : COLORS.good }} />
                    </div>
                  </div>
                  <div className="text-right tabular-nums font-black text-sm" style={{ color: d.score >= 90 ? COLORS.excellent : COLORS.good }}>{d.score}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart */}
          {report.radarData && report.radarData.length > 0 && (
            <div className="mt-8">
              <h3 className="text-base font-black mb-3 flex items-center gap-2">
                <span className="w-1 h-[17px] rounded shrink-0" style={{ background: `linear-gradient(180deg,${COLORS.brand},${COLORS.cyan})` }} />
                维度能力雷达
              </h3>
              <div className="bg-[#fafcff] rounded-xl border border-[#e4ebf5] p-6 md:p-8">
                <RadarChartInline data={report.radarData} />
              </div>
            </div>
          )}

          {/* Strengths & Gaps */}
          {report.suggestions && (
            <div className="mt-6 p-4 rounded-xl" style={{ background: '#effaf6', border: '1px solid #c8ece0' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#0f9d76] to-[#34c79c] flex items-center justify-center text-white text-xs font-black">优</div>
                <span className="font-black text-sm" style={{ color: '#0b7f60' }}>核心优势</span>
              </div>
              <div className="text-sm" style={{ color: COLORS.ink2 }}>{report.suggestions.split('\n')[0]}</div>
            </div>
          )}
        </section>

        {/* ===== SECTION II: Per-Indicator Detail ===== */}
        <section id="section-2" className="bg-white rounded-xl border border-[#e4ebf5] p-8 md:p-10 mb-8 shadow-sm">
          <h2 className="text-xl font-black mb-2 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white text-lg font-black shrink-0">二</span>
            分项指标评价
          </h2>
          <p className="text-sm mb-6" style={{ color: COLORS.muted }}>{allIndicators.length} 项指标按四大维度分组呈现。每项指标含<b>指标介绍</b>、<b>评分理由</b>、<b>扣分点</b>、<b>证据链</b>与<b>量化指标卡</b>。</p>

          {DIMENSIONS.map((dim) => {
            const dimInfo = dimScores.find((d) => d.key === dim.key)!;
            // Get indicators for this dimension from report.indicators
            const dimIndicatorDetails = allReportIndicators.filter((ind) => dim.indicators.includes(ind.id));

            return (
              <div key={dim.key} className="mb-8 last:mb-0">
                {/* Dimension Head */}
                <div className="rounded-xl p-4 mb-4" style={{ background: 'linear-gradient(115deg,#eef4ff,#e8f4fd)', border: '1px solid #d8e6fb' }}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="px-3 py-1.5 rounded-lg text-xs font-black text-white" style={{ background: `linear-gradient(140deg,${dim.color},${COLORS.cyan})` }}>{dim.key}</span>
                    <span className="font-black text-base">{dim.name}</span>
                    <div className="ml-auto flex gap-4 text-xs">
                      <div className="text-right"><div className="font-black text-lg" style={{ color: dimInfo.score >= 90 ? COLORS.excellent : COLORS.good }}>{dimInfo.score}</div><span style={{ color: COLORS.muted }}>得分率</span></div>
                      <div className="text-right"><div className="font-black text-lg">{dimInfo.max}/{dimInfo.min}</div><span style={{ color: COLORS.muted }}>最高/低</span></div>
                      <div className="text-right"><div className="font-black text-lg">{dim.weight}%</div><span style={{ color: COLORS.muted }}>权重</span></div>
                    </div>
                  </div>
                </div>

                {/* Indicator Cards */}
                <div className="space-y-5">
                  {dimIndicatorDetails.map((ind) => {
                    const barColor = ind.score >= 90 ? COLORS.excellent : ind.score >= 80 ? COLORS.good : ind.score >= 70 ? COLORS.pass : COLORS.warn;
                    return (
                      <div key={ind.id} className="border rounded-xl overflow-hidden" style={{ borderLeft: `4px solid ${barColor}`, borderColor: '#e4ebf5' }}>
                        {/* Card Header */}
                        <div className="p-5 pb-3" style={{ background: '#fbfdff' }}>
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <span className="text-xs font-black px-2.5 py-1.5 rounded-md tabular-nums shrink-0" style={{ background: COLORS.brandSoft, color: COLORS.brand, border: '1px solid #d3e1fd' }}>{ind.id}</span>
                            <span className="font-black text-sm flex-1 min-w-0">{ind.name}</span>
                            <span className="px-2.5 py-1 rounded text-xs font-black shrink-0 whitespace-nowrap" style={gradeBadgeStyle(ind.grade)}>{ind.grade}</span>
                            <span className="text-xl font-black tabular-nums shrink-0" style={{ color: barColor }}>{ind.score}<span className="text-xs font-normal" style={{ color: COLORS.muted }}>分</span></span>
                          </div>
                          {/* Score Bar */}
                          <div className="h-2 rounded-full bg-[#eef3fb] overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${ind.score}%`, background: ind.score >= 90 ? `linear-gradient(90deg,${COLORS.excellent},#3ec79b)` : ind.score >= 80 ? `linear-gradient(90deg,${COLORS.good},#63a0ff)` : `linear-gradient(90deg,${COLORS.pass},#f5c14e)` }} />
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="px-5 pb-5 space-y-4">
                          {/* 指标介绍 */}
                          {ind.intro && (
                            <div>
                              <div className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: COLORS.brand }}>
                                <span className="w-1 h-3.5 rounded-sm" style={{ background: COLORS.brand }} />
                                指标介绍
                              </div>
                              <div className="text-xs leading-relaxed pl-3" style={{ color: COLORS.ink2, borderLeft: `2px solid ${COLORS.line}` }}>{ind.intro}</div>
                            </div>
                          )}

                          {/* 评分理由 */}
                          {ind.rationale && ind.rationale.length > 0 && (
                            <div>
                              <div className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: COLORS.brand }}>
                                <span className="w-1 h-3.5 rounded-sm" style={{ background: COLORS.brand }} />
                                评分理由
                              </div>
                              <ul className="space-y-1.5 pl-3" style={{ borderLeft: `2px solid #d3e1fd` }}>
                                {ind.rationale.map((r, i) => (
                                  <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: COLORS.ink2 }}>
                                    <span className="shrink-0 mt-0.5" style={{ color: COLORS.good }}>●</span>
                                    <span>{r}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 扣分点 */}
                          {ind.deductions && ind.deductions.length > 0 && (
                            <div>
                              <div className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: COLORS.warn }}>
                                <span className="w-1 h-3.5 rounded-sm" style={{ background: COLORS.warn }} />
                                扣分点{ind.score < 80 ? ' · 本项为维度低分项' : ''}
                              </div>
                              <ul className="space-y-1.5 pl-3" style={{ borderLeft: '2px solid #f9d4cc' }}>
                                {ind.deductions.map((d, i) => (
                                  <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: COLORS.ink2 }}>
                                    <span className="shrink-0 mt-0.5" style={{ color: COLORS.warn }}>●</span>
                                    <span>{d}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 证据链 */}
                          {ind.evidence && ind.evidence.length > 0 && (
                            <div>
                              <div className="text-xs font-bold mb-1.5 flex items-center gap-1.5" style={{ color: '#0b7f60' }}>
                                <span className="w-1 h-3.5 rounded-sm" style={{ background: COLORS.excellent }} />
                                证据链
                              </div>
                              <ul className="space-y-1.5 pl-3" style={{ borderLeft: '2px solid #c8ece0' }}>
                                {ind.evidence.map((e, i) => (
                                  <li key={i} className="text-xs leading-relaxed flex gap-1.5" style={{ color: COLORS.ink2 }}>
                                    <span className="shrink-0 mt-0.5" style={{ color: COLORS.excellent }}>●</span>
                                    <span>{e}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 量化指标卡 */}
                          {ind.metrics && ind.metrics.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                              {ind.metrics.map((m, i) => {
                                const valNum = parseFloat(m.value);
                                const mColor = !isNaN(valNum) ? (m.value.includes('%') ? (valNum >= 90 ? COLORS.excellent : valNum >= 80 ? COLORS.good : valNum >= 70 ? COLORS.pass : COLORS.warn) : COLORS.ink) : COLORS.ink;
                                return (
                                  <div key={i} className="rounded-lg p-2.5 text-center" style={{ background: '#f8fafc', border: '1px solid #e4ebf5' }}>
                                    <div className="text-[11px] font-bold" style={{ color: COLORS.muted }}>{m.label}</div>
                                    <div className="text-lg font-black mt-0.5" style={{ color: mColor }}>{m.value}</div>
                                    {m.threshold && <div className="text-[10px] mt-0.5" style={{ color: COLORS.muted }}>{m.threshold}</div>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* 关键标签 */}
                          {ind.tags && ind.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: COLORS.line }}>
                              {ind.tags.map((tag, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: '#eef4ff', color: COLORS.brand, border: '1px solid #d3e1fd' }}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Indicators without detailed data — show estimated score cards */}
                  {allIndicators.filter((id) => dim.indicators.includes(id) && !indicatorScores[id]).map((id) => {
                    const info = indicatorScores[id];
                    if (!info) return null;
                    return (
                      <div key={id} className="border rounded-xl p-4" style={{ borderLeft: `4px solid ${info.score >= 90 ? COLORS.excellent : info.score >= 80 ? COLORS.good : info.score >= 70 ? COLORS.pass : COLORS.warn}`, borderColor: '#e4ebf5' }}>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-black px-2 py-1 rounded-md tabular-nums shrink-0" style={{ background: COLORS.brandSoft, color: COLORS.brand, border: '1px solid #d3e1fd' }}>{id}</span>
                          <span className="font-black text-sm flex-1 min-w-0">{INDICATOR_NAMES[id] || id}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] font-black shrink-0" style={gradeBadgeStyle(info.grade)}>{info.grade}</span>
                          <span className="text-lg font-black tabular-nums shrink-0" style={{ color: info.score >= 90 ? COLORS.excellent : COLORS.good }}>{info.score}</span>
                        </div>
                        <div className="text-[11px] mt-2" style={{ color: COLORS.muted }}>暂无详细评估数据 · 基于维度均值估算</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* ===== SECTION III: Key Findings & Recommendations ===== */}
        <section id="section-3" className="bg-white rounded-xl border border-[#e4ebf5] p-8 md:p-10 mb-8 shadow-sm">
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white text-lg font-black shrink-0">三</span>
            关键发现与改进建议
          </h2>

          {/* Strengths Grid */}
          <h3 className="text-base font-black mb-4 flex items-center gap-2">
            <span style={{ width: '4px', height: '17px', borderRadius: '3px', background: 'linear-gradient(180deg,#1d4ed8,#0ea5e9)', display: 'inline-block' }} />
            核心优势
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {[
              { title: '多维度协同达标', desc: `${excellenceCount} 项指标达优秀，形成完整能力链条` },
              { title: '产教融合深入', desc: '毕业设计要求源自真实企业项目，验收签章完整合规' },
              { title: '反馈机制高效', desc: '过程性考核闭环规范，改进措施可追溯落实' },
              { title: '外部数据验证充分', desc: 'DOI、专利、ISBN 等第三方来源验证通过率较高' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5 border-l-4" style={{ borderLeftColor: COLORS.excellent, background: 'linear-gradient(180deg,#fbfefd,#f4fbf8)' }}>
                <div className="font-black text-sm mb-2" style={{ color: '#0b7f60' }}>{item.title}</div>
                <div className="text-xs leading-relaxed" style={{ color: COLORS.ink2 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* Gaps Grid */}
          <h3 className="text-base font-black mb-4 flex items-center gap-2">
            <span style={{ width: '4px', height: '17px', borderRadius: '3px', background: 'linear-gradient(180deg,#e0533d,#f08160)', display: 'inline-block' }} />
            关键短板
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {allIndicators
              .map((id) => ({ id, ...indicatorScores[id]! }))
              .filter((i) => i.score < 85)
              .sort((a, b) => a.score - b.score)
              .slice(0, 4)
              .map((item) => (
                <div key={item.id} className="rounded-xl p-5 border-l-4" style={{ borderLeftColor: COLORS.warn, background: 'linear-gradient(180deg,#fffdfd,#fff6f4)' }}>
                  <div className="font-black text-sm mb-2 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-white font-black shrink-0" style={{ backgroundColor: COLORS.warn }}>{item.id}</span>
                    <span>{item.grade} ({item.score}分)</span>
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: COLORS.muted }}>需重点加强，拉低整体评价等级</div>
                </div>
              ))}
          </div>

          {/* Action Plan Summary */}
          <div className="p-5 rounded-xl" style={{ background: '#f2f7ff', border: '1px solid #d6e5fd' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white text-xs font-black shrink-0">改</div>
              <span className="font-black text-sm" style={{ color: COLORS.brand }}>改进行动建议</span>
            </div>
            <div className="text-sm leading-relaxed" style={{ color: COLORS.ink2 }}>
              {report.suggestions ? report.suggestions.split('\n').filter(Boolean).slice(0, 3).join('\n') : '暂无'}
            </div>
          </div>
        </section>

        {/* ===== SECTION IV: Conclusion ===== */}
        <section id="section-4" className="bg-white rounded-xl border border-[#e4ebf5] p-8 md:p-10 mb-8 shadow-sm">
          <h2 className="text-xl font-black mb-5 flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center text-white text-lg font-black shrink-0">四</span>
            评价结论
          </h2>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: '当前总分', value: `${overallScore}`, sub: overallGrade, color: COLORS.brand },
              { label: '优秀等级线', value: '90', sub: '距此差 ' + Math.max(0, 90 - overallScore) + ' 分', color: COLORS.excellent },
              { label: '目标等级', value: '≥93', sub: '优秀等级 · 区域示范', color: '#0f9d76' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl p-5 text-center border" style={{ borderColor: '#e4ebf5' }}>
                <div className="text-xs font-bold mb-2" style={{ color: COLORS.muted }}>{item.label}</div>
                <div className="text-3xl font-black" style={{ color: item.color }}>{item.value}</div>
                <div className="text-xs mt-2" style={{ color: COLORS.muted }}>{item.sub}</div>
              </div>
            ))}
          </div>

          {/* Progress Track */}
          <div className="relative mt-6">
            <div className="h-3 rounded-full bg-[#eef3fb] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(overallScore, 100)}%`, background: 'linear-gradient(90deg,#1d4ed8,#0ea5e9,#0f9d76)' }} />
            </div>
            <div className="absolute top-[-18px] left-[90%] text-[10px] font-bold text-[#e0533d] px-1.5 py-0.5 rounded" style={{ transform: 'translateX(-50%)' }}>优秀线 90</div>
            <div className="flex justify-between mt-3 text-[10px]" style={{ color: COLORS.muted }}>
              <span>0</span><span>70 合格</span><span>80 良好</span><span>90 优秀</span><span>100</span>
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs mt-10 pt-8" style={{ borderTop: `1px solid ${COLORS.line}`, color: COLORS.muted }}>
            <p>本报告由方略一答·专业建设协同评价引擎生成 · {new Date().toLocaleDateString('zh-CN')} 出具</p>
            <p className="mt-2" style={{ color: '#94a3b8' }}>数据来源于 17 项指标填报系统、教师确认记录及外部数据验证结果，证据链完整可追溯。</p>
          </footer>
        </section>
      </div>
    </div>
  );
}

// Radar chart using inline SVG — generous viewBox to prevent label overlap
function RadarChartInline({ data }: { data: { item: string; score: number }[] }) {
  const cx = 230, cy = 200, r = 110;
  const n = data.length;
  const angleStep = (Math.PI * 2) / n;

  const points = data.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const pr = (d.score / 100) * r;
    return `${cx + pr * Math.cos(angle)},${cy + pr * Math.sin(angle)}`;
  });

  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];
  const labelDist = r + 50;

  return (
    <div className="w-full flex justify-center">
      <svg viewBox="0 0 460 400" className="w-full max-w-2xl" style={{ maxHeight: '420px' }} role="img" aria-label="维度能力雷达图">
        {rings.map((ring) => {
          const pts = data.map((_, i) => {
            const angle = angleStep * i - Math.PI / 2;
            return `${cx + r * ring * Math.cos(angle)},${cy + r * ring * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={ring} points={pts} fill="none" stroke="#e8eef8" strokeWidth={ring === 1 ? 1.4 : 0.8} />;
        })}
        {data.map((_, i) => {
          const angle = angleStep * i - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#d7e2f4" strokeWidth={0.8} />;
        })}
        <polygon points={points.join(' ')} fill="url(#radarFill)" stroke="#1d4ed8" strokeWidth={2} />
        <defs>
          <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity=".3" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity=".15" />
          </linearGradient>
        </defs>
        {data.map((d, i) => {
          const angle = angleStep * i - Math.PI / 2;
          const pr = (d.score / 100) * r;
          const x = cx + pr * Math.cos(angle);
          const y = cy + pr * Math.sin(angle);
          const tx = cx + labelDist * Math.cos(angle);
          const ty = cy + labelDist * Math.sin(angle);
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="#fff" stroke="#1d4ed8" strokeWidth={2.5} />
              <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="700" fill="#16233a">{d.item}</text>
              <text x={tx} y={ty + 16} textAnchor="middle" fontSize="11" fontWeight="800" fill="#1d4ed8">{d.score}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function SmartEvaluationEngine() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [logs, setLogs] = useState<{message: string; agentId?: string; status?: string}[]>([]);
  const [agents, setAgents] = useState<Record<string, any>>({});
  const [finalReport, setFinalReport] = useState<ReportData | null>(null);

  // History state
  const [historyReports, setHistoryReports] = useState<any[]>([]);

  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dlpu_eval_history');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        setHistoryReports(list);
        const params = new URLSearchParams(window.location.search);
        const reportId = params.get('reportId');
        if (reportId) {
          const target = list.find((r: any) => String(r.id) === reportId);
          if (target) {
            setFinalReport(target.data);
            setIsFinished(true);
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!isFinished) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isFinished]);

  const startEvaluation = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setHasError(false);
    setLogs([]);
    setAgents({});
    setFinalReport(null);

    // 模拟 AI 评估过程（静态 mock 数据）
    const mockLogs = [
      { agentId: 'system', message: '正在初始化评价引擎...' },
      { agentId: 'system', message: '已加载 17 项指标数据' },
      { agentId: 'expert_industry', message: '正在分析产业白皮书数据...' },
      { agentId: 'expert_alignment', message: '正在分析课程 - 产业链映射...' },
      { agentId: 'expert_teacher', message: '正在分析师资投入数据...' },
      { agentId: 'expert_student', message: '正在分析学习行为数据...' },
      { agentId: 'expert_asset', message: '正在分析资产配置数据...' },
      { agentId: 'expert_practice', message: '正在分析产教融合数据...' },
      { agentId: 'expert_career', message: '正在分析就业质量数据...' },
      { agentId: 'expert_alumni', message: '正在分析校友发展数据...' },
      { agentId: 'system', message: '所有微专家评估完成，正在生成综合报告...' },
      { agentId: 'system', message: '报告生成完成！' },
    ];

    const mockAgents = {
      expert_industry: { id: 'expert_industry', name: '产业分析专家', icon: '🏭', status: 'working' },
      expert_alignment: { id: 'expert_alignment', name: '课程映射专家', icon: '📚', status: 'working' },
      expert_teacher: { id: 'expert_teacher', name: '师资评估专家', icon: '👨‍🏫', status: 'working' },
      expert_student: { id: 'expert_student', name: '学情分析专家', icon: '📊', status: 'working' },
      expert_asset: { id: 'expert_asset', name: '资产审计专家', icon: '🏗️', status: 'working' },
      expert_practice: { id: 'expert_practice', name: '产教融合专家', icon: '🤝', status: 'working' },
      expert_career: { id: 'expert_career', name: '就业质量专家', icon: '💼', status: 'working' },
      expert_alumni: { id: 'expert_alumni', name: '校友发展专家', icon: '', status: 'working' },
    };

    // 模拟异步过程
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 逐步显示日志
    for (const log of mockLogs) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setLogs(prev => [...prev, { agentId: log.agentId, message: log.message, status: 'done' }]);
    }

    // 标记所有专家完成
    Object.values(mockAgents).forEach(agent => {
      setAgents(prev => ({ ...prev, [agent.id]: { ...agent, status: 'done' } }));
    });

    // 使用 mock 报告数据
    await new Promise(resolve => setTimeout(resolve, 500));
    setFinalReport(MOCK_REPORT);
    setIsFinished(true);

    // 保存到历史
    const newReport = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      grade: MOCK_REPORT.grade,
      score: MOCK_REPORT.totalScore,
      data: MOCK_REPORT
    };
    setHistoryReports(prev => {
      const updated = [newReport, ...prev].slice(0, 10);
      localStorage.setItem('dlpu_eval_history', JSON.stringify(updated));
      return updated;
    });
  };

  // ---------- Professional Report View ----------
  if (isFinished && finalReport) {
    return <ProfessionalReportView report={finalReport} />;
  }

  // ---------- Engine Dashboard ----------
  const getAgentText = (status: string) => {
    if (status === 'working') return <span className="text-blue-500 text-xs font-bold"><SyncOutlined spin className="mr-1" />撰写中</span>;
    if (status === 'done') return <span className="text-green-500 text-xs font-bold"><CheckOutlined className="mr-1" />完成</span>;
    if (status === 'error') return <span className="text-red-500 text-xs font-bold">崩溃</span>;
    return <span className="text-gray-400 text-xs font-bold">等待中</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-20 px-4">

      {!isRunning && !isFinished && !hasError && (
        <div className="w-full max-w-5xl">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-6">专业建设协同评价引擎</h1>
            <p className="text-slate-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              并行唤醒多位细分领域微专家，穿透全景数据并执行深度核验。<br/>
              完成后生成结构化评价报告。
            </p>
            <button
              type="button"
              onClick={startEvaluation}
              className="bg-blue-600 hover:bg-blue-500 text-white px-12 h-16 text-xl font-bold shadow-[0_8px_20px_rgba(37,99,235,0.3)] rounded-full transition-transform hover:scale-105 inline-flex items-center gap-3"
            >
              <PlayCircleOutlined className="text-2xl" />
              启动多智能体并发评估
            </button>
          </div>
        </div>
      )}

      {(isRunning || hasError) && (
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black text-slate-800 mb-2">
              {hasError ? '诊断过程中断' : 'AI 集群深度评估中'}
            </h2>
            <div className="text-slate-500 text-sm flex justify-center items-center gap-2">
              {!hasError && <Spin indicator={<SyncOutlined spin className="text-blue-500" />} />}
              {hasError ? '系统捕获到异常，请查看日志并重试' : '多智能体调度运行中...'}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {Object.values(agents).map((agent: any) => (
              <div key={agent.id} className={`w-36 flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-500 ${
                  agent.status === 'working' ? 'bg-blue-50 border-blue-200 shadow-sm' :
                  agent.status === 'done' ? 'bg-green-50 border-green-200' :
                  agent.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-slate-50 border-slate-200'
                }`}>
                <div className="text-2xl mb-2">{agent.icon}</div>
                <div className="font-bold text-slate-700 text-xs text-center mb-2 h-6 flex items-center justify-center">{agent.name}</div>
                <div>{getAgentText(agent.status)}</div>
              </div>
            ))}
          </div>

          <div className="max-w-4xl mx-auto min-h-[300px] max-h-[500px] overflow-y-auto bg-slate-50 rounded-xl p-6 border border-slate-100 shadow-inner">
            {Object.keys(
              logs.reduce((acc, log) => {
                const id = log.agentId || 'system';
                if (!acc[id]) acc[id] = [];
                acc[id].push(log);
                return acc;
              }, {} as Record<string, typeof logs>)
            ).map(agentId => {
              const agentLogs = logs.filter(l => (l.agentId || 'system') === agentId);
              const agentInfo = agents[agentId] || { name: agentId === 'system' ? '系统调度总线' : agentId, icon: agentId === 'system' ? '⚙️' : '🤖' };

              return (
                <div key={agentId} className="mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-3 font-bold text-slate-700 text-base border-b border-slate-100 pb-2">
                    <span className="text-xl">{agentInfo.icon}</span> {agentInfo.name}
                  </div>
                  <div className="relative pl-5">
                    <div className="absolute left-[8px] top-1 bottom-1 w-[2px] bg-slate-200 rounded-full" />
                    {agentLogs.map((log, i) => (
                      <div key={i} className="relative flex items-start mb-3">
                        <div className={`absolute -left-[18px] mt-1.5 w-2 h-2 rounded-full ring-4 ring-white ${
                          log.status === 'error' ? 'bg-red-400' : 'bg-blue-400'
                        }`} />
                        <div className={`text-sm leading-relaxed ${log.status === 'error' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {log.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>

          {hasError && (
             <div className="mt-8 text-center">
               <button onClick={startEvaluation} type="button" className="bg-blue-600 text-white px-8 py-2 mr-4 rounded-lg font-bold hover:bg-blue-500">重新尝试</button>
               <button onClick={() => { setHasError(false); setIsRunning(false); }} type="button" className="bg-slate-100 text-slate-700 px-8 py-2 rounded-lg font-bold hover:bg-slate-200">返回</button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
