// 产业检索飞轮
// 1. 缓存:同一检索词的联网检索 7 天、OpenAlex 年度统计 30 天内直接复用(更快、可复现)
// 2. 知识库:每次生成的政策 / 产业链环节与企业 / 集群 / 岗位 / 弱信号按产业去重沉淀,记录出现次数与来源
// 3. 增量:同产业同地区有历史时,先取知识库作底稿,再只检索上次之后的变化(时效过滤),报告给出变化差值
// 4. 审核回流:专家审核过的章节,其条目在知识库标记为已审核,后续优先采用
import { searchWeb, type SearchResult, type SearchOptions } from '@/lib/search';
import { fetchYearCounts } from './quant';
import { getStore, hashKey } from './store';
import type { DirectionPlan, IndustryReport, PolicyLevel, ChainNode } from './types';

const DAY = 86400000;
const SEARCH_TTL = 7 * DAY;
const OPENALEX_TTL = 30 * DAY;

export interface KbSource {
  title: string;
  url: string;
  origin: 'web' | 'pingfang';
}

export interface KbEntry<T> {
  key: string;
  item: T;
  region: string; // 条目适用地区('全国' 表示通用)
  firstSeen: string;
  lastSeen: string;
  seenCount: number;
  sources: KbSource[];
  reviewed: boolean;
  runIds: string[];
}

export interface IndustryKb {
  industry: string;
  updatedAt: string;
  runCount: number;
  directions: KbEntry<DirectionPlan>[];
  policies: KbEntry<{ name: string; issuer: string; level: PolicyLevel; year: number }>[];
  nodes: KbEntry<{ level: ChainNode['level']; node: string; companies: string[] }>[];
  clusters: KbEntry<{ name: string; type: string; mainIndustry: string }>[];
  jobs: KbEntry<{ title: string; background: string[]; skills: string[] }>[];
  weak: KbEntry<{ topic: string; evidence: string }>[];
  /** 每次生成的技术方向阶段快照,用于对比阶段变化 */
  stageHistory: { runId: string; at: string; region: string; stages: Record<string, string> }[];
}

export interface FlywheelStats {
  searchHit: number;
  searchMiss: number;
  openalexHit: number;
  openalexMiss: number;
}

export const normIndustry = (s: string) => s.replace(/\s+/g, '').toLowerCase();
const normName = (s: string) => s.replace(/[《》“”"'\s]/g, '').toLowerCase();

const emptyKb = (industry: string): IndustryKb => ({
  industry,
  updatedAt: '',
  runCount: 0,
  directions: [],
  policies: [],
  nodes: [],
  clusters: [],
  jobs: [],
  weak: [],
  stageHistory: [],
});

export async function loadKb(industry: string): Promise<IndustryKb> {
  return (await getStore().get<IndustryKb>('kb', normIndustry(industry))) ?? emptyKb(industry);
}

// ---------- 带缓存的检索 ----------
export class Flywheel {
  stats: FlywheelStats = { searchHit: 0, searchMiss: 0, openalexHit: 0, openalexMiss: 0 };

  async search(query: string, options?: SearchOptions): Promise<SearchResult> {
    const key = hashKey(`${query}|${options?.freshnessDays ?? ''}`);
    const hit = await getStore().get<{ at: number; result: SearchResult }>('cache-search', key);
    if (hit && Date.now() - hit.at < SEARCH_TTL) {
      this.stats.searchHit++;
      return hit.result;
    }
    this.stats.searchMiss++;
    const result = await searchWeb(query, options);
    if (result.AbstractText) await getStore().put('cache-search', key, { at: Date.now(), query, result });
    return result;
  }

  async yearCounts(query: string, years: number[]) {
    const key = hashKey(`${query}|${years.join(',')}`);
    const hit = await getStore().get<{ at: number; counts: { year: number; count: number }[] }>('cache-openalex', key);
    if (hit && Date.now() - hit.at < OPENALEX_TTL) {
      this.stats.openalexHit++;
      return hit.counts;
    }
    this.stats.openalexMiss++;
    const counts = await fetchYearCounts(query, years);
    await getStore().put('cache-openalex', key, { at: Date.now(), query, counts });
    return counts;
  }
}

// ---------- 增量模式判定 ----------
export interface IncrementalPlan {
  mode: 'full' | 'incremental';
  baseRunId?: string;
  baseAt?: string;
  freshnessDays?: 7 | 30 | 180 | 365;
}

export function planIncremental(kb: IndustryKb, region: string, forceFull: boolean): IncrementalPlan {
  const last = [...kb.stageHistory].reverse().find((h) => h.region === region);
  if (forceFull || !last) return { mode: 'full' };
  const days = (Date.now() - new Date(last.at).getTime()) / DAY;
  if (days > 365) return { mode: 'full' };
  const freshnessDays = days <= 7 ? 7 : days <= 30 ? 30 : days <= 180 ? 180 : 365;
  return { mode: 'incremental', baseRunId: last.runId, baseAt: last.at, freshnessDays };
}

// 知识库中可用于本次报告的历史条目:同地区或全国通用、有来源、一年内出现过(过期条目不再补回)
const RECALL_TTL = 365 * DAY;
export function recallable<T>(entries: KbEntry<T>[], region: string): KbEntry<T>[] {
  return entries.filter(
    (e) => (e.region === region || e.region === '全国') && e.sources.length > 0 && Date.now() - new Date(e.lastSeen).getTime() < RECALL_TTL,
  );
}

export type KbListName = 'directions' | 'policies' | 'nodes' | 'clusters' | 'jobs' | 'weak';

// 管理员删除错误条目(删除后不会再被补回;若之后检索又命中,会作为新条目重新沉淀)
export async function deleteKbEntry(industryKey: string, list: KbListName, key: string, region: string) {
  const kb = await getStore().get<IndustryKb>('kb', industryKey);
  if (!kb) return false;
  const arr = kb[list] as KbEntry<unknown>[];
  const next = arr.filter((e) => !(e.key === key && e.region === region));
  if (next.length === arr.length) return false;
  (kb[list] as KbEntry<unknown>[]) = next;
  kb.updatedAt = new Date().toISOString();
  await getStore().put('kb', industryKey, kb);
  return true;
}

// ---------- 沉淀:把一份报告并入知识库 ----------
function upsert<T>(
  list: KbEntry<T>[],
  key: string,
  item: T,
  region: string,
  sources: KbSource[],
  runId: string,
  at: string,
  merge?: (old: T, next: T) => T,
) {
  const hit = list.find((e) => e.key === key && e.region === region);
  if (hit) {
    hit.item = merge ? merge(hit.item, item) : item;
    hit.lastSeen = at;
    if (!hit.runIds.includes(runId)) {
      hit.seenCount++;
      hit.runIds = [...hit.runIds, runId].slice(-20);
    }
    sources.forEach((s) => {
      if (!hit.sources.some((x) => x.url === s.url && x.title === s.title)) hit.sources.push(s);
    });
    hit.sources = hit.sources.slice(-8);
  } else {
    list.push({ key, item, region, firstSeen: at, lastSeen: at, seenCount: 1, sources: sources.slice(0, 8), reviewed: false, runIds: [runId] });
  }
}

const uniq = (a: string[]) => Array.from(new Set(a.filter(Boolean)));

export async function ingestReport(runId: string, report: IndustryReport) {
  const kb = await loadKb(report.industry);
  const at = report.generatedAt;
  const src = (ids: number[]): KbSource[] =>
    ids
      .map((id) => report.sources.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => ({ title: s!.title, url: s!.url, origin: s!.origin }));

  report.tech.directions.forEach((d) => upsert(kb.directions, normName(d.name), { name: d.name, query: d.query }, '全国', [{ title: 'OpenAlex', url: d.queryUrl, origin: 'web' }], runId, at));
  report.policy.items.forEach((p) =>
    upsert(kb.policies, normName(p.name), { name: p.name, issuer: p.issuer, level: p.level, year: p.year }, p.level === '国家级' || p.level === '部委级' ? '全国' : report.region, src([p.sourceId]), runId, at),
  );
  report.chain.nodes.forEach((n) =>
    upsert(kb.nodes, `${n.level}|${normName(n.node)}`, { level: n.level, node: n.node, companies: n.companies }, report.region, src(n.sourceIds), runId, at, (o, x) => ({ ...x, companies: uniq([...o.companies, ...x.companies]).slice(0, 12) })),
  );
  (report.chain.clusters ?? []).forEach((c) => upsert(kb.clusters, normName(c.name), { name: c.name, type: c.type, mainIndustry: c.mainIndustry }, report.region, src([c.sourceId]), runId, at));
  report.chain.jobs.forEach((j) =>
    upsert(kb.jobs, normName(j.title), { title: j.title, background: j.background, skills: j.skills }, report.region, src([j.sourceId]), runId, at, (o, x) => ({
      title: x.title,
      background: uniq([...o.background, ...x.background]),
      skills: uniq([...o.skills, ...x.skills]),
    })),
  );
  report.weak.signals.forEach((w) => upsert(kb.weak, normName(w.topic), { topic: w.topic, evidence: w.evidence }, '全国', src(w.sourceIds), runId, at));

  kb.stageHistory = [
    ...kb.stageHistory,
    { runId, at, region: report.region, stages: Object.fromEntries(report.tech.directions.map((d) => [d.name, d.stage])) },
  ].slice(-30);
  kb.runCount++;
  kb.updatedAt = new Date().toISOString();
  await getStore().put('kb', normIndustry(report.industry), kb);
}

// 专家审核回流:把某次报告中已审核章节的条目标记为已审核
export async function markReviewed(runId: string, industry: string, chapters: string[]) {
  const kb = await loadKb(industry);
  const mark = <T,>(list: KbEntry<T>[]) => list.forEach((e) => e.runIds.includes(runId) && (e.reviewed = true));
  if (chapters.includes('policy')) mark(kb.policies);
  if (chapters.includes('chain')) {
    mark(kb.nodes);
    mark(kb.clusters);
    mark(kb.jobs);
  }
  if (chapters.includes('tech')) mark(kb.directions);
  if (chapters.includes('weak')) mark(kb.weak);
  await getStore().put('kb', normIndustry(industry), kb);
}
