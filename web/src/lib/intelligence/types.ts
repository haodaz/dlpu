/**
 * lib/intelligence/types.ts
 *
 * 三个 Pipeline（产业/人才池/单人）的统一输入输出类型定义。
 * 前端 Dashboard 页面直接引用这些类型渲染卡片。
 */

// ═══════════════════════════════════════════════════════
// 总线入口
// ═══════════════════════════════════════════════════════

export type IntelligenceScene = 'industry' | 'talent_pool' | 'talent_single';

export interface OrchestrateRequest {
  scene: IntelligenceScene;
  // scene=industry
  industry?: string;
  region?: string;
  // scene=talent_pool
  talents?: { name: string; institution: string }[];
  // scene=talent_single
  name?: string;
  institution?: string;
}

// SSE 事件协议
export interface AgentEvent {
  type: 'agent';
  data: { name: string; status: 'working' | 'done' | 'error'; icon: string };
}
export interface LogEvent {
  type: 'log';
  message: string;
}
export interface ResultEvent<T = unknown> {
  type: 'result';
  data: T;
}
export interface ErrorEvent {
  type: 'error';
  message: string;
}
export type PipelineEvent = AgentEvent | LogEvent | ResultEvent | ErrorEvent;

// ═══════════════════════════════════════════════════════
// Pipeline 1: 产业分析报告
// ═══════════════════════════════════════════════════════

/** 多源热度指标 */
export interface HeatSource {
  source: string;      // e.g. "科技媒体", "arXiv", "VC报告", "政策文件"
  score: number;       // 0-100
  desc: string;        // 数据来源说明
  trend: 'up' | 'down' | 'stable';
}

/** 热度趋势数据点 */
export interface HeatTrendPoint {
  month: string;       // "2026-01"
  source: string;      // "科技媒体" | "arXiv" | ...
  value: number;       // 热度指数
}

/** 细分领域分布 */
export interface FieldDistItem {
  field: string;
  count: number;
}

/** 技术方向 */
export interface TechTrend {
  direction: string;
  maturity: '萌芽' | '成长' | '成熟';
  description: string;
}

/** 头部人才条目 */
export interface TopTalentItem {
  name: string;
  field: string;
  institution: string;
  achievement: string;
  level: string;       // "院士" | "教授" | "企业家" | "副教授"
  photoUrl?: string;
}

/** 头部企业条目 */
export interface TopCompanyItem {
  name: string;
  field: string;
  scale: string;
  stage: string;       // "上市" | "B轮" | "A轮"
  highlight: string;
}

/** 人才注意力迁移条目 */
export interface AttentionShiftItem {
  name: string;
  from: string;         // 原研究方向
  to: string;           // 新研究方向
  signal: string;       // 迁移信号描述
  risk: '高' | '中' | '低';
}

/** 区域缺口条目 */
export interface RegionalGapItem {
  field: string;         // 新兴领域
  nationalHeat: number;  // 全国热度 0-100
  regionalCapacity: number; // 区域能力 0-100
  gap: number;           // 缺口值
  riskLevel: '高' | '中' | '低';
  outflowRisk: string;   // 流出风险分析
}

/** 政策条目 */
export interface PolicyItem {
  name: string;
  relevance: string;
  publishDate?: string;
  publishOrg?: string;
  officialLink?: string;
}

/** 风险预警条目 */
export interface RiskAlert {
  title: string;
  level: '高' | '中' | '低';
  description: string;
  suggestion?: string;
}

/** 行动建议条目 */
export interface Recommendation {
  priority: number;
  action: string;
}

/** 融资趋势 */
export interface InvestTrendItem {
  month: string;
  value: number;
}

/** 产业分析完整报告 */
export interface IndustryReport {
  // 元信息
  reportTitle: string;
  reportDate: string;
  industry: string;
  region: string;

  // 热度指数
  heatIndex: {
    score: number;
    trend: '上升' | '下降' | '稳定';
    judgment: string;
  };

  // 多源热度
  heatSources: HeatSource[];
  heatTrend: HeatTrendPoint[];

  // 产业全景
  industryOverview: string;
  fieldDistribution: FieldDistItem[];

  // 技术方向
  techTrends: TechTrend[];

  // 头部人才 & 企业
  talentLandscape: {
    summary: string;
    topTalents: TopTalentItem[];
  };
  topCompanies: TopCompanyItem[];

  // 人才注意力迁移
  attentionShifts: AttentionShiftItem[];

  // 区域缺口
  regionalGaps: RegionalGapItem[];

  // 政策环境
  policyEnvironment: {
    summary: string;
    keyPolicies: PolicyItem[];
  };

  // 风险预警
  riskAlerts: RiskAlert[];

  // 融资趋势
  investTrend: InvestTrendItem[];

  // 行动建议
  recommendations: Recommendation[];
}

// ═══════════════════════════════════════════════════════
// Pipeline 2: 人才池监测报告
// ═══════════════════════════════════════════════════════

export interface TalentCard {
  name: string;
  institution: string;
  activityScore: number;      // 0-100
  activityLevel: '高活跃' | '正常' | '低活跃' | '沉寂';
  activityDetails: string;
  mobilityRisk: '高' | '中' | '低';
  mobilitySignals: string[];
  mobilityAnalysis: string;
  anomalies: string[];
  keyFindings: string;
  recommendation: string;
  photoUrl?: string;
}

export interface MonitorRiskAlert {
  level: '高' | '中' | '低';
  talentName: string;
  title: string;
  description: string;
  suggestedAction: string;
}

export interface MonitorReport {
  reportTitle: string;
  reportDate: string;
  region: string;
  totalMonitored: number;
  overallAssessment: string;
  talentCards: TalentCard[];
  riskAlerts: MonitorRiskAlert[];
  trendInsights: string[];
}

// ═══════════════════════════════════════════════════════
// Pipeline 3: 单人深度分析报告
// ═══════════════════════════════════════════════════════

export interface RadarDimension {
  dimension: string;
  score: number;       // 0-100
}

export interface TimelineEvent {
  date: string;
  type: '论文' | '专利' | '会议' | '职务变动' | '奖项' | '其他';
  title: string;
  detail: string;
  source?: string;
  url?: string;
}

export interface RiskDimension {
  dimension: string;
  score: number;       // 0-100
  analysis: string;
}

export interface ProfileReport {
  // 基础信息
  name: string;
  nameEn?: string;
  institution: string;
  position: string;
  researchField: string;
  photoUrl?: string;

  // 学术指标
  hIndex?: number;
  citedByCount?: number;
  worksCount?: number;
  patentCount?: number;

  // 活跃度
  activityRadar: RadarDimension[];
  activityScore: number;
  activityLevel: '高活跃' | '正常' | '低活跃' | '沉寂';
  activityBaseline: {
    current: number;
    baseline: number;
    deviation: string;     // "高于基线 23%" 等
  };

  // 流动风险
  mobilityRisk: '高' | '中' | '低';
  mobilityScore: number;   // 0-100

  // 风险分析
  riskDimensions: RiskDimension[];
  overallRiskAssessment: string;

  // 活动时间线
  timeline: TimelineEvent[];

  // 异常事件
  anomalies: Array<{
    date: string;
    type: string;
    description: string;
    severity: '高' | '中' | '低';
  }>;

  // 教育背景 & 工作经历（来自平方库）
  education?: Array<Record<string, unknown>>;
  workExperience?: Array<Record<string, unknown>>;
  awards?: Array<Record<string, unknown>>;
  patents?: Array<Record<string, unknown>>;
  papers?: Array<Record<string, unknown>>;

  // 人才日志元数据（来自 talentJournal）
  searchCount?: number;
  firstSearchedAt?: string;
  lastSearchedAt?: string;
  dataSources?: string[];
  verified?: boolean;
  pingfangId?: number;
  orcidId?: string;
}
