// AI-native 产业分析报告 — 数据结构
// 原则:可解释(数值全部由确定性计算产出,大模型只做检索式拆分、信息抽取、解读)
//       鲁棒(量化数据不足时转为"早期弱信号",明确标注,不用模型补数)

export type SignalKind = 'STRONG' | 'EXTRACTED' | 'INTERPRETED' | 'WEAK' | 'SKIPPED';

// 来自知识库的历史沉淀条目(本次检索未命中,但历史上带来源出现过)
export interface HistoryMark {
  lastSeen: string;
  seenCount: number;
  reviewed: boolean; // 专家审核过
}

export interface Source {
  id: number; // 报告内统一编号 [S1] [S2] ...
  title: string;
  url: string; // 平方库条目可能没有外链,此时为空
  origin: 'web' | 'pingfang'; // 阿里云联网检索 / 平方数据
}

// ---------- 第一章:技术热度与成熟度(OpenAlex 年度论文数,纯计算) ----------
export type Stage = '萌芽期' | '爆发期' | '成长期' | '成熟期' | '调整期' | '数据不足';

export interface DirectionPlan {
  name: string; // 中文方向名
  query: string; // OpenAlex 英文检索式
}

export interface DirectionMetrics extends DirectionPlan {
  counts: { year: number; count: number }[];
  total: number;
  yoy: number | null; // 最近完整年同比 %
  yoyPrev: number | null; // 前一年同比 %
  cagr: number | null; // 区间年均复合增长 %
  accel: number | null; // 加速比 = yoy / yoyPrev
  recentShare: number | null; // 最近 2 年论文占区间总量比例
  stage: Stage;
  stageRule: string; // 命中的判定规则(可解释)
  queryUrl: string; // 可复现的 OpenAlex 查询链接
}

export interface TechChapter {
  kind: SignalKind;
  years: number[];
  directions: DirectionMetrics[];
  note?: string;
}

// ---------- 第二章:政策信号(检索 + 抽取,打分纯计算) ----------
export type PolicyLevel = '国家级' | '部委级' | '省级' | '市级' | '区县级';

export interface PolicyItem {
  name: string;
  issuer: string;
  level: PolicyLevel;
  year: number;
  sourceId: number;
  score: number; // 政策力度得分 PIS
  history?: HistoryMark;
}

export interface PolicyYear {
  year: number;
  density: number; // 政策密度 PD
  weighted: number; // 政策层级加权得分 PWS
}

export interface PolicyChapter {
  kind: SignalKind;
  items: PolicyItem[];
  byYear: PolicyYear[];
  acceleration: number | null; // 政策加速度 PA %
  note?: string;
}

// ---------- 第三章:产业链与岗位需求(检索 + 抽取,技能频次纯计算) ----------
export interface ChainNode {
  level: '上游' | '中游' | '下游';
  node: string;
  companies: string[];
  sourceIds: number[];
  history?: HistoryMark;
}

export interface JobItem {
  title: string;
  background: string[]; // 专业背景要求
  skills: string[]; // 具体技能/工具
  sourceId: number;
  history?: HistoryMark;
}

export interface ClusterItem {
  name: string;
  type: string; // 如:国家级战略性新兴产业集群
  mainIndustry: string;
  sourceId: number;
}

export interface ChainChapter {
  kind: SignalKind;
  clusters: ClusterItem[]; // 平方产业集群库:区域内与该产业相关的集群
  nodes: ChainNode[];
  jobs: JobItem[];
  skillFreq: { skill: string; count: number }[];
  note?: string;
}

// ---------- 第四章:综合研判(只解读表格) ----------
export interface Claim {
  text: string;
  refs: string[]; // 引用的表格 / 来源,如 T1、T2、S3
  unverifiedNumbers: string[]; // 程序校验:文中出现但在输入数据中找不到的数字
}

export interface InsightChapter {
  kind: SignalKind;
  summary: Claim[];
  majorAdvice: Claim[]; // 对专业建设的建议
}

// ---------- 第五章:早期弱信号(AI 建议区) ----------
export interface WeakSignal {
  topic: string;
  evidence: string;
  sourceIds: number[];
  confidence: '低';
}

export interface WeakChapter {
  kind: SignalKind;
  signals: WeakSignal[];
}

// 飞轮:与上一次同产业同地区报告相比的变化
export interface ReportDelta {
  mode: 'full' | 'incremental';
  baseAt?: string; // 对比基准(上一次生成时间)
  freshnessDays?: number; // 增量检索的时效窗口
  newPolicies: string[];
  newNodes: string[];
  newCompanies: string[];
  newJobs: string[];
  stageChanges: { name: string; from: string; to: string }[];
  recalled: { policies: number; nodes: number; jobs: number }; // 从知识库补回的条目数
  cache: { searchHit: number; searchMiss: number; openalexHit: number; openalexMiss: number };
}

export interface IndustryReport {
  runId?: string;
  delta?: ReportDelta;
  industry: string;
  region: string;
  major: string;
  generatedAt: string;
  model: string;
  tech: TechChapter;
  policy: PolicyChapter;
  chain: ChainChapter;
  insight: InsightChapter;
  weak: WeakChapter;
  sources: Source[];
  method: { label: string; value: string }[];
}

export interface ReportInput {
  industry: string;
  region: string;
  major: string;
  forceFull?: boolean; // 忽略历史,全量检索
}

export type ProgressEvent =
  | { type: 'step'; step: string; status: 'working' | 'done' | 'skipped' | 'error'; detail?: string }
  | { type: 'log'; message: string }
  | { type: 'result'; report: IndustryReport }
  | { type: 'error'; message: string };
