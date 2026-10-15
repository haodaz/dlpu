// 产业检索日志的数据结构
import type { IndustryReport, ProgressEvent, ReportInput, ReportDelta } from './types';

export interface RunUser {
  role: string; // admin / user(教师)
  name: string;
}

export interface RunRecord {
  id: string;
  startedAt: string;
  finishedAt: string;
  user: RunUser;
  entry: string; // industry-report(产业分析报告页)/ whitepaper(教师白皮书工具)
  input: ReportInput;
  status: 'done' | 'error';
  error?: string;
  events: ProgressEvent[];
  report?: IndustryReport;
  review?: { chapters: string[]; at: string };
}

export interface RunSummary {
  id: string;
  startedAt: string;
  durationMs: number;
  user: RunUser;
  entry: string;
  input: ReportInput;
  status: 'done' | 'error';
  error?: string;
  mode?: 'full' | 'incremental';
  counts?: { policies: number; nodes: number; jobs: number; sources: number; newItems: number };
  cache?: ReportDelta['cache'];
}
