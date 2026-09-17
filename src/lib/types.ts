// 评价报告相关类型定义

export interface MetricCard {
  label: string;
  value: string;
  threshold?: string;
}

export interface IndicatorDetail {
  id: string;
  name: string;
  grade: string;
  score: number;
  intro: string;           // 指标介绍
  rationale: string[];     // 评分理由
  deductions: string[];    // 扣分点
  evidence: string[];     // 证据链
  metrics?: MetricCard[];  // 量化指标卡
  tags?: string[];         // 关键标签
}

export interface ReportData {
  totalScore?: number;
  grade?: string;
  diagnosis?: string;
  suggestions?: string;
  radarData?: { item: string; score: number }[];
  indicators?: IndicatorDetail[];
  expertResults?: Record<string, {
    status?: string;
    indicator?: string;
    criteria?: string;
    grade?: string;
    analysis?: string;
    suggestions?: string;
    chartData?: {
      tags?: string[];
      tier?: {
        totalTiers?: number;
        currentTier?: number;
        label?: string;
      };
    };
  }>;
}
