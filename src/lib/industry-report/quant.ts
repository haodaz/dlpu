// 确定性计算层:不调用大模型,所有数值都能按公式复现
import type {
  DirectionMetrics,
  DirectionPlan,
  PolicyItem,
  PolicyLevel,
  PolicyYear,
  Stage,
  IndustryReport,
} from './types';

const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- 年份口径 ----------
// 只统计完整年份:当前年份未结束,不纳入增长率计算
export function analysisYears(now = new Date()): number[] {
  const last = now.getFullYear() - 1;
  return Array.from({ length: 7 }, (_, i) => last - 6 + i); // 7 个完整年
}

// ---------- OpenAlex 年度论文数 ----------
export function openAlexUrl(query: string, years: number[]): string {
  const params = new URLSearchParams({
    search: query,
    filter: `publication_year:${years[0]}-${years[years.length - 1]}`,
    group_by: 'publication_year',
  });
  return `https://api.openalex.org/works?${params.toString()}`;
}

export async function fetchYearCounts(query: string, years: number[]): Promise<{ year: number; count: number }[]> {
  const res = await fetch(openAlexUrl(query, years), { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`OpenAlex ${res.status}`);
  const data = (await res.json()) as { group_by?: { key: string; count: number }[] };
  const map = new Map((data.group_by ?? []).map((g) => [Number(g.key), g.count]));
  return years.map((year) => ({ year, count: map.get(year) ?? 0 }));
}

// ---------- 增长指标 ----------
const pct = (a: number, b: number) => (b > 0 ? round1(((a - b) / b) * 100) : null);

// 判定阈值(演示口径,需结合学科特点由专家校准)
export const STAGE_RULES = {
  minTotal: 30, // 区间总论文 < 30 → 数据不足
  embryoMaxLast: 200, // 萌芽期:最近一年论文 < 200 且近两年占比 > 50%
  embryoRecentShare: 0.5,
  burstYoy: 25, // 爆发期:同比 ≥ 25% 且加速比 > 1
  declineYoy: -10, // 调整期:同比 < -10%
  growthCagr: 15, // 成长期:CAGR ≥ 15%
};

export function directionMetrics(plan: DirectionPlan, counts: { year: number; count: number }[], years: number[]): DirectionMetrics {
  const c = counts.map((x) => x.count);
  const n = c.length;
  const total = c.reduce((s, v) => s + v, 0);
  const last = c[n - 1];
  const yoy = pct(last, c[n - 2]);
  const yoyPrev = pct(c[n - 2], c[n - 3]);
  const first = c[0];
  const cagr = first > 0 ? round1((Math.pow(last / first, 1 / (n - 1)) - 1) * 100) : null;
  const accel = yoy !== null && yoyPrev !== null && yoyPrev > 0 ? round1(yoy / yoyPrev) : null;
  const recentShare = total > 0 ? Math.round(((c[n - 1] + c[n - 2]) / total) * 100) / 100 : null;

  const R = STAGE_RULES;
  let stage: Stage;
  let stageRule: string;
  if (total < R.minTotal) {
    stage = '数据不足';
    stageRule = `区间论文总数 ${total} < ${R.minTotal},不做阶段判定`;
  } else if (last < R.embryoMaxLast && (recentShare ?? 0) > R.embryoRecentShare) {
    stage = '萌芽期';
    stageRule = `最近一年论文 ${last} < ${R.embryoMaxLast} 且近两年占比 ${recentShare} > ${R.embryoRecentShare}`;
  } else if (yoy !== null && yoy >= R.burstYoy && accel !== null && accel > 1) {
    stage = '爆发期';
    stageRule = `同比 ${yoy}% ≥ ${R.burstYoy}% 且加速比 ${accel} > 1`;
  } else if (yoy !== null && yoy < R.declineYoy) {
    stage = '调整期';
    stageRule = `同比 ${yoy}% < ${R.declineYoy}%`;
  } else if (cagr !== null && cagr >= R.growthCagr) {
    stage = '成长期';
    stageRule = `年均复合增长 ${cagr}% ≥ ${R.growthCagr}%`;
  } else {
    stage = '成熟期';
    stageRule = `未命中以上规则(同比 ${yoy ?? '—'}%,CAGR ${cagr ?? '—'}%)`;
  }

  return { ...plan, counts, total, yoy, yoyPrev, cagr, accel, recentShare, stage, stageRule, queryUrl: openAlexUrl(plan.query, years) };
}

// ---------- 政策力度 ----------
export const POLICY_SCORE: Record<PolicyLevel, number> = {
  国家级: 5,
  部委级: 4,
  省级: 3,
  市级: 2,
  区县级: 1,
};

export function policyByYear(items: PolicyItem[], years: number[]): PolicyYear[] {
  return years.map((year) => {
    const list = items.filter((p) => p.year === year);
    return { year, density: list.length, weighted: list.reduce((s, p) => s + p.score, 0) };
  });
}

// 政策加速度:最近完整年 vs 前一年的加权得分变化
// 鲁棒性:两年中任一年政策数少于 minPerYear 时样本太小,不计算(避免"0 → -100%"这类伪趋势)
export function policyAcceleration(byYear: PolicyYear[], minPerYear = 2): number | null {
  const n = byYear.length;
  if (n < 2) return null;
  const [prev, last] = [byYear[n - 2], byYear[n - 1]];
  if (prev.density < minPerYear || last.density < minPerYear) return null;
  return pct(last.weighted, prev.weighted);
}

// ---------- 技能频次 ----------
// 同一技能的不同写法(大小写、空格)合并计数,展示时保留第一次出现的写法
export function skillFrequency(jobs: { skills: string[] }[]): { skill: string; count: number }[] {
  const map = new Map<string, { skill: string; count: number }>();
  jobs.forEach((j) => {
    const keys = new Map(j.skills.map((s) => [s.replace(/\s+/g, '').toLowerCase(), s.trim()]));
    keys.forEach((display, key) => {
      if (!key) return;
      const hit = map.get(key);
      if (hit) hit.count += 1;
      else map.set(key, { skill: display, count: 1 });
    });
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

// ---------- 数字校验 ----------
// 收集报告中所有由计算/抽取得到的数值,作为大模型解读时允许引用的"白名单"
export function allowedNumbers(r: Pick<IndustryReport, 'tech' | 'policy' | 'chain'>): number[] {
  const nums: number[] = [];
  r.tech.directions.forEach((d) => {
    d.counts.forEach((c) => nums.push(c.count, c.year));
    [d.total, d.yoy, d.yoyPrev, d.cagr, d.accel, d.recentShare].forEach((v) => v !== null && nums.push(v));
    if (d.recentShare !== null) nums.push(Math.round(d.recentShare * 100));
  });
  nums.push(r.tech.directions.length);
  r.policy.items.forEach((p) => nums.push(p.year, p.score));
  r.policy.byYear.forEach((y) => nums.push(y.year, y.density, y.weighted));
  if (r.policy.acceleration !== null) nums.push(r.policy.acceleration);
  nums.push(r.policy.items.length);
  r.chain.skillFreq.forEach((s) => nums.push(s.count));
  nums.push(r.chain.jobs.length, r.chain.nodes.length);
  return nums;
}

// 找出文本中无法在白名单中找到的数字(≤10 的整数视为序号/个数,年份单独放行)
export function unverifiedNumbers(text: string, allowed: number[]): string[] {
  const found = text.match(/-?\d+(?:\.\d+)?/g) ?? [];
  const bad = found.filter((raw) => {
    const n = Number(raw);
    if (Number.isInteger(n) && Math.abs(n) <= 10) return false;
    if (Number.isInteger(n) && n >= 2000 && n <= 2035) return false;
    return !allowed.some((a) => Math.abs(Math.abs(a) - Math.abs(n)) <= Math.max(0.051, Math.abs(a) * 0.005));
  });
  return Array.from(new Set(bad));
}
