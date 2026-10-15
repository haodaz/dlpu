// AI-native 产业分析报告流水线
//
// 因果链:产业值不值得对接 → 往哪个方向走 → 需要什么人 → 专业怎么改
//
//   ⓪ 先查日志:读取该产业的知识库;同产业同地区有历史 → 增量模式(只检索上次之后的变化)
//   ① 检索式拆分(LLM,沿用历史方向保证可比)→ OpenAlex 年度论文数(缓存)→ 增长率/阶段(纯计算) = 强信号
//   ② 政策检索 + 平方政策库 + 知识库沉淀 → 政策清单(须带来源)→ 力度/密度/加速度(纯计算)        = 强信号
//   ③ 产业链/岗位检索 + 平方集群库/专业库 + 知识库沉淀 → 节点、企业、岗位技能 → 技能频次(纯计算)
//   ④ 综合研判(LLM)只读 ①②③ 的表格,不得创造数字;生成后程序逐个校验数字
//   ⑤ 早期弱信号(LLM)只看最近 30 天,量化数据不足时的兜底
//   ⑥ 与上一次报告比对,输出变化差值;报告沉淀回知识库(飞轮)

import { callJSON, reportModel } from './llm';
import { pfPolicies, pfClusters, pfMajorJobs, regionInfo } from './pingfang';
import { Flywheel, loadKb, planIncremental, recallable, normIndustry, type IndustryKb, type IncrementalPlan, type KbEntry } from './flywheel';
import {
  analysisYears,
  directionMetrics,
  POLICY_SCORE,
  policyByYear,
  policyAcceleration,
  skillFrequency,
  allowedNumbers,
  unverifiedNumbers,
  STAGE_RULES,
} from './quant';
import type {
  IndustryReport,
  ReportInput,
  ProgressEvent,
  Source,
  DirectionPlan,
  DirectionMetrics,
  PolicyItem,
  PolicyLevel,
  ChainNode,
  JobItem,
  Claim,
  WeakSignal,
  TechChapter,
  PolicyChapter,
  ChainChapter,
  ClusterItem,
  ReportDelta,
  HistoryMark,
} from './types';

type Emit = (e: ProgressEvent) => void;

const POLICY_LEVELS = Object.keys(POLICY_SCORE) as PolicyLevel[];
const CHAIN_LEVELS = ['上游', '中游', '下游'] as const;
const norm = (s: string) => s.replace(/[《》“”"'\s]/g, '').toLowerCase();

// 地方政策必须属于报告所在地区:名称或发布机构里出现本省 / 本市名称;国家级、部委级不受限
function regionMatcher(region: string) {
  const { provinceName, city } = regionInfo(region);
  const places = [provinceName, city].filter(Boolean) as string[];
  return (p: { level: PolicyLevel; name: string; issuer: string }) =>
    p.level === '国家级' || p.level === '部委级' || !places.length || places.some((x) => p.name.includes(x) || p.issuer.includes(x));
}

// ---------- 来源登记:全报告统一编号 ----------
class SourceRegistry {
  list: Source[] = [];
  add(title: string, url: string, origin: Source['origin'] = 'web'): number {
    const hit = this.list.find((s) => (url ? s.url === url : s.title === title));
    if (hit) return hit.id;
    const id = this.list.length + 1;
    this.list.push({ id, title: title || url, url, origin });
    return id;
  }
}

interface SearchBundle {
  text: string; // 已把 [ref_N] 改写为全局 [S#]
  ids: number[];
}

// 一次生成的上下文
interface Ctx {
  input: ReportInput;
  reg: SourceRegistry;
  emit: Emit;
  fw: Flywheel;
  kb: IndustryKb;
  inc: IncrementalPlan;
}

async function search(ctx: Ctx, query: string, fresh = true): Promise<SearchBundle> {
  // 增量模式下,检索只看上次之后的时效窗口
  const freshnessDays = fresh && ctx.inc.mode === 'incremental' ? ctx.inc.freshnessDays : undefined;
  const r = await ctx.fw.search(query, freshnessDays ? { freshnessDays } : undefined);
  const local = new Map<number, number>();
  (r.sources ?? []).forEach((s) => local.set(s.index, ctx.reg.add(s.title, s.url)));
  const text = r.AbstractText.replace(/\[ref_(\d+)\]/g, (_, n) => {
    const id = local.get(Number(n));
    return id ? `[S${id}]` : '';
  });
  return { text, ids: [...local.values()] };
}

const sid = (v: unknown): number => Number(String(v ?? '').replace(/[^\d]/g, '')) || 0;

// 模型偶尔把数组字段返回成字符串,统一容错为字符串数组
const arr = (v: unknown): string[] =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[、,，;；/]/) : []).map((x) => String(x).trim()).filter(Boolean);

const mark = <T,>(e: KbEntry<T>): HistoryMark => ({ lastSeen: e.lastSeen, seenCount: e.seenCount, reviewed: e.reviewed });

// 把知识库条目的来源登记进本次报告,返回来源编号
const kbSourceIds = <T,>(ctx: Ctx, e: KbEntry<T>) =>
  e.sources.slice(0, 3).map((s) => ctx.reg.add(s.title, s.url, s.origin));

// 已审核的排前面,其次按出现次数
const byTrust = <T,>(a: KbEntry<T>, b: KbEntry<T>) => Number(b.reviewed) - Number(a.reviewed) || b.seenCount - a.seenCount;

// ---------- ① 技术热度 ----------
async function techChapter(ctx: Ctx): Promise<TechChapter> {
  const { input, emit } = ctx;
  const years = analysisYears();
  emit({ type: 'step', step: 'plan', status: 'working' });

  // 有历史方向时直接沿用(时间序列可比);否则由模型拆分
  const known = [...ctx.kb.directions].sort(byTrust).slice(0, 7).map((e) => e.item);
  let directions: DirectionPlan[];
  if (ctx.inc.mode === 'incremental' && known.length >= 3) {
    directions = known;
    emit({ type: 'step', step: 'plan', status: 'done', detail: `沿用历史方向:${directions.map((d) => d.name).join('、')}` });
  } else {
    const plan = await callJSON<{ directions: DirectionPlan[] }>(
      '你是科技情报检索专家,只负责把产业拆成可检索的技术方向并写出英文检索式,不做任何判断与打分。',
      `产业:${input.industry}
服务专业:${input.major || '未指定'}
${known.length ? `历史上用过的方向(优先沿用,保证前后可比):${known.map((d) => `${d.name}=${d.query}`).join(';')}\n` : ''}
把该产业拆成 5-6 个关键技术方向。每个方向给出:
- name:中文方向名(简短)
- query:用于 OpenAlex 全文检索的英文短语,精确、常用的学术术语,可用双引号包裹词组,不要用布尔运算符
另外加一项 name 为"${input.industry}(整体)"的总体检索式放在第一位。

输出 JSON:{"directions":[{"name":"","query":""}]}`,
    );
    directions = (plan.directions ?? []).filter((d) => d?.name && d?.query).slice(0, 7);
    if (!directions.length) throw new Error('检索式拆分失败');
    emit({ type: 'step', step: 'plan', status: 'done', detail: directions.map((d) => d.name).join('、') });
  }

  emit({ type: 'step', step: 'openalex', status: 'working' });
  const metrics: DirectionMetrics[] = [];
  for (const d of directions) {
    try {
      const counts = await ctx.fw.yearCounts(d.query, years);
      metrics.push(directionMetrics(d, counts, years));
      emit({ type: 'log', message: `OpenAlex · ${d.name}:${years[years.length - 1]} 年 ${counts[counts.length - 1].count} 篇` });
    } catch (e) {
      emit({ type: 'log', message: `OpenAlex · ${d.name} 查询失败:${(e as Error).message}` });
      metrics.push(directionMetrics(d, years.map((year) => ({ year, count: 0 })), years));
    }
  }
  const usable = metrics.filter((m) => m.stage !== '数据不足').length;
  emit({ type: 'step', step: 'openalex', status: usable ? 'done' : 'skipped', detail: `${usable}/${metrics.length} 个方向有足量数据` });
  return {
    kind: usable ? 'STRONG' : 'SKIPPED',
    years,
    directions: metrics,
    note: usable ? undefined : '论文数据不足,未做量化判定,相关方向转入"早期弱信号"。',
  };
}

// ---------- ② 政策信号 ----------
async function policyChapter(ctx: Ctx): Promise<{ chapter: PolicyChapter; recalled: number }> {
  const { input, reg, emit } = ctx;
  emit({ type: 'step', step: 'policy', status: 'working' });
  const years = analysisYears();
  const from = years[years.length - 5];
  const now = new Date().getFullYear();
  const province = input.region.match(/^(.+?(省|自治区|市))/)?.[1] ?? input.region;
  const recent = ctx.inc.mode === 'incremental' ? '最新 近期 新发布' : `${from}年以来`;
  const queries = [
    `${input.industry} 国务院 工信部 政策 规划 行动方案 指导意见 ${recent} 发布机构 发布时间`,
    `${province} ${input.industry} 制造业数字化转型 政策 实施方案 ${recent} 发布时间`,
  ];
  if (province !== input.region) queries.push(`${input.region} ${input.industry} 政策 措施 实施方案 ${recent} 发布时间`);
  const bundles = (await Promise.all(queries.map((q) => search(ctx, q).catch(() => null)))).filter(Boolean) as SearchBundle[];
  const text = bundles.map((b) => b.text).join('\n\n');
  const validIds = new Set(bundles.flatMap((b) => b.ids));

  let items: PolicyItem[] = [];
  if (text.trim()) {
    const out = await callJSON<{ policies: { name: string; issuer: string; level: string; year: number | string; source: string }[] }>(
      '你是政策信息抽取员。只能抽取材料中明确出现名称的政策文件,不得补充材料外的政策,不得猜测年份。',
      `材料(每句后的 [S数字] 是来源编号):
${text.slice(0, 12000)}

抽取材料中提到的、以"${input.industry}"或制造业数字化/智能化为主题的政策文件(交通、低空经济、软件业等主题不相关的不要)。每条给出:
- name:政策文件全称(材料中的原名)
- issuer:发布机构
- level:只能是 ${POLICY_LEVELS.join(' / ')} 之一(国务院/中共中央=国家级;部委=部委级;省/自治区/直辖市政府及其厅局=省级;地级市=市级;区县=区县级)
- year:发布年份(材料中未写明则不要输出该条)
- source:该条信息所在句子后的来源编号,如 "S3"(没有来源编号则不要输出该条)

输出 JSON:{"policies":[...]}`,
    );
    const seen = new Set<string>();
    items = (out.policies ?? [])
      .map((p) => ({
        name: String(p.name ?? '').trim(),
        issuer: String(p.issuer ?? '').trim(),
        level: p.level as PolicyLevel,
        year: Number(p.year),
        sourceId: sid(p.source),
      }))
      .filter((p) => p.name && POLICY_LEVELS.includes(p.level) && p.year >= from && p.year <= now && validIds.has(p.sourceId))
      .filter((p) => (seen.has(norm(p.name)) ? false : (seen.add(norm(p.name)), true)))
      .map((p) => ({ ...p, score: POLICY_SCORE[p.level] }));
  }
  const inRegion = regionMatcher(input.region);
  const dropped = items.filter((p) => !inRegion(p));
  if (dropped.length) emit({ type: 'log', message: `剔除非本地区的地方政策 ${dropped.length} 条:${dropped.map((p) => p.name).join('、')}` });
  items = items.filter(inRegion);
  const has = (name: string) => items.some((x) => norm(x.name) === norm(name));

  // 平方政策库:结构化一手数据(层级、发布时间、官方链接)
  const pf = await pfPolicies([input.industry], input.region);
  let pfAdded = 0;
  for (const p of pf) {
    const year = Number(p.date.slice(0, 4));
    if (!year || year < from || year > now || has(p.name)) continue;
    const level: PolicyLevel = p.isNational ? '国家级' : p.hasCity ? '市级' : '省级';
    items.push({ name: p.name, issuer: p.issuer, level, year, score: POLICY_SCORE[level], sourceId: reg.add(`平方政策库 · ${p.name}`, p.link, 'pingfang') });
    pfAdded++;
  }
  if (pf.length) emit({ type: 'log', message: `平方政策库:匹配 ${pf.length} 条,新增 ${pfAdded} 条` });

  // 知识库沉淀:历史上带来源出现过、本次未检索到的政策补回
  let recalled = 0;
  for (const e of recallable(ctx.kb.policies, input.region).sort(byTrust)) {
    const p = e.item;
    if (p.year < from || p.year > now || has(p.name) || !inRegion(p)) continue;
    const ids = kbSourceIds(ctx, e);
    items.push({ ...p, score: POLICY_SCORE[p.level], sourceId: ids[0], history: mark(e) });
    recalled++;
  }
  if (recalled) emit({ type: 'log', message: `知识库补回历史政策 ${recalled} 条` });

  const byYear = policyByYear(items, years.slice(-5));
  if (items.length < 2) {
    emit({ type: 'step', step: 'policy', status: 'skipped', detail: '可核验的政策不足 2 条' });
    return { chapter: { kind: 'SKIPPED', items, byYear, acceleration: null, note: '可核验来源的公开政策不足,本章跳过,不以模型推断补齐。' }, recalled };
  }
  emit({ type: 'step', step: 'policy', status: 'done', detail: `${items.length} 条可核验政策(含历史沉淀 ${recalled} 条)` });
  return {
    chapter: {
      kind: 'STRONG',
      items,
      byYear,
      acceleration: policyAcceleration(byYear, 2),
      note: '政策清单来自联网检索、平方政策库与历次检索沉淀,不是全量政策库;年度计数反映样本分布,某年为 0 不代表当年没有政策。',
    },
    recalled,
  };
}

// ---------- ③ 产业链与岗位 ----------
async function chainChapter(ctx: Ctx): Promise<{ chapter: ChainChapter; recalled: { nodes: number; jobs: number } }> {
  const { input, reg, emit } = ctx;
  emit({ type: 'step', step: 'chain', status: 'working' });
  // 产业链结构(全国通用,变化慢,不加时效)+ 区域重点企业 + 区域岗位,分开检索
  const [clustersRaw, majorJobs, structure, local, jobs] = await Promise.all([
    pfClusters(input.industry, input.region),
    pfMajorJobs(input.major),
    search(ctx, `${input.industry} 产业链图谱 上游 中游 下游 各环节构成 代表企业`, false).catch(() => null),
    search(ctx, `${input.region} ${input.industry} 重点企业 龙头企业 产业集群 主营业务`).catch(() => null),
    Promise.all([
      search(ctx, `${input.region} ${input.industry} 企业招聘 工程师 岗位职责 任职要求 技能`).catch(() => null),
      search(ctx, `${input.major || input.industry} 毕业生 就业岗位 企业招聘 任职要求 技能 工具`).catch(() => null),
    ]).then((list) => {
      const ok = list.filter(Boolean) as SearchBundle[];
      return ok.length ? { text: ok.map((b) => b.text).join('\n\n'), ids: ok.flatMap((b) => b.ids) } : null;
    }),
  ]);
  const chain = structure || local ? { text: [structure?.text, local?.text].filter(Boolean).join('\n\n'), ids: [...(structure?.ids ?? []), ...(local?.ids ?? [])] } : null;
  const validIds = new Set([...(chain?.ids ?? []), ...(jobs?.ids ?? [])]);

  let nodes: ChainNode[] = [];
  let jobList: JobItem[] = [];
  if (chain?.text || jobs?.text) {
    const out = await callJSON<{
      nodes: { level: string; node: string; companies: unknown; sources: unknown }[];
      jobs: { title: string; background: unknown; skills: unknown; source: string }[];
    }>(
      '你是产业信息抽取员。只能抽取材料中明确出现的内容,不得补充材料外的企业、岗位或技能。',
      `产业:${input.industry}

【产业链材料】
${(chain?.text ?? '').slice(0, 9000)}

【岗位材料】
${(jobs?.text ?? '').slice(0, 10000)}

抽取:
1. nodes:产业链环节。不同材料中含义相同的环节要合并为一条,每个 level 最多 4 个环节。
   level 只能是 上游/中游/下游;node 为简短环节名(不超过 12 字);companies 为材料中点名的该环节企业,优先列出${input.region}本地企业(没有则空数组);
   sources 为支撑该环节的全部来源编号数组,如 ["S2","S5"]
2. jobs:与「${input.industry}」产业直接相关的企业岗位(不要学校/教师招聘,不要与该产业无关的岗位,如化工生产、销售、行政、普工)。title 为岗位名;background 为专业背景要求(如"自动化""机械工程");
   skills 为具体技能或工具(如"PLC 编程""机器视觉""MES"),不要把专业名当技能;source 为来源编号
没有来源编号的条目不要输出。

输出 JSON:{"nodes":[...],"jobs":[...]}`,
    );
    nodes = (out.nodes ?? [])
      .map((n) => ({
        level: n.level as ChainNode['level'],
        node: String(n.node ?? '').trim(),
        companies: Array.from(new Set(arr(n.companies))).slice(0, 8),
        sourceIds: Array.from(new Set(arr(n.sources).map(sid).filter((id) => validIds.has(id)))),
      }))
      .filter((n) => n.node && CHAIN_LEVELS.includes(n.level) && n.sourceIds.length);
    jobList = (out.jobs ?? [])
      .map((j) => ({ title: String(j.title ?? '').trim(), background: arr(j.background), skills: arr(j.skills), sourceId: sid(j.source) }))
      .filter((j) => j.title && !/教师|讲师|辅导员/.test(j.title) && validIds.has(j.sourceId));
  }

  // 平方数据:区域产业集群 + 专业库就业方向
  const clusters: ClusterItem[] = clustersRaw.map((c) => ({ ...c, sourceId: reg.add(`平方产业集群库 · ${c.name}`, '', 'pingfang') }));
  if (majorJobs.titles.length) {
    const sidMajor = reg.add(`平方国内专业库 · ${input.major} · 就业方向`, '', 'pingfang');
    majorJobs.titles
      .filter((t) => !jobList.some((j) => norm(j.title) === norm(t)))
      .forEach((t) => jobList.push({ title: t, background: [input.major], skills: [], sourceId: sidMajor }));
  }
  emit({ type: 'log', message: `平方数据:产业集群 ${clusters.length} 个,专业就业方向 ${majorJobs.titles.length} 个` });

  // 知识库沉淀:同地区历史上出现过的环节(合并企业)、集群与岗位
  let recNodes = 0;
  for (const e of recallable(ctx.kb.nodes, input.region).sort(byTrust)) {
    const hit = nodes.find((n) => n.level === e.item.level && norm(n.node) === norm(e.item.node));
    if (hit) {
      hit.companies = Array.from(new Set([...hit.companies, ...e.item.companies])).slice(0, 12);
    } else if (nodes.filter((n) => n.level === e.item.level).length < 4) {
      nodes.push({ ...e.item, sourceIds: kbSourceIds(ctx, e), history: mark(e) });
      recNodes++;
    }
  }
  for (const e of recallable(ctx.kb.clusters, input.region)) {
    if (!clusters.some((c) => norm(c.name) === norm(e.item.name))) clusters.push({ ...e.item, sourceId: kbSourceIds(ctx, e)[0] });
  }
  let recJobs = 0;
  for (const e of recallable(ctx.kb.jobs, input.region).sort(byTrust).slice(0, 12)) {
    if (jobList.some((j) => norm(j.title) === norm(e.item.title))) continue;
    jobList.push({ ...e.item, sourceId: kbSourceIds(ctx, e)[0], history: mark(e) });
    recJobs++;
  }
  if (recNodes || recJobs) emit({ type: 'log', message: `知识库补回历史环节 ${recNodes} 个、岗位 ${recJobs} 个` });

  if (!nodes.length && !jobList.length && !clusters.length) {
    emit({ type: 'step', step: 'chain', status: 'skipped', detail: '未检索到产业链与岗位材料' });
    return { chapter: { kind: 'SKIPPED', clusters: [], nodes: [], jobs: [], skillFreq: [], note: '未检索到可用材料,本章跳过。' }, recalled: { nodes: 0, jobs: 0 } };
  }
  emit({ type: 'step', step: 'chain', status: 'done', detail: `${nodes.length} 个产业链环节 · ${jobList.length} 个岗位(含历史沉淀 ${recNodes + recJobs})` });
  return { chapter: { kind: 'EXTRACTED', clusters, nodes, jobs: jobList, skillFreq: skillFrequency(jobList) }, recalled: { nodes: recNodes, jobs: recJobs } };
}

// ---------- ⑤ 早期弱信号(始终只看最近 30 天) ----------
async function weakChapter(ctx: Ctx, tech: TechChapter): Promise<WeakSignal[]> {
  const { input, emit } = ctx;
  emit({ type: 'step', step: 'weak', status: 'working' });
  const sparse = tech.directions.filter((d) => d.stage === '数据不足').map((d) => d.name);
  const r = await ctx.fw.search(`${input.industry} 最新 技术突破 新兴方向 前沿`, { freshnessDays: 30 }).catch(() => null);
  if (!r?.AbstractText) {
    emit({ type: 'step', step: 'weak', status: 'skipped' });
    return [];
  }
  const local = new Map<number, number>();
  (r.sources ?? []).forEach((s) => local.set(s.index, ctx.reg.add(s.title, s.url)));
  const text = r.AbstractText.replace(/\[ref_(\d+)\]/g, (_, n) => (local.get(Number(n)) ? `[S${local.get(Number(n))}]` : ''));
  const out = await callJSON<{ signals: { topic: string; evidence: string; sources: unknown }[] }>(
    '你是前沿情报分析员。只依据材料列出近期出现密集报道或理论突破、但尚无量化数据支撑的方向。',
    `产业:${input.industry}
已有量化数据覆盖的方向(不要重复):${tech.directions.filter((d) => d.stage !== '数据不足').map((d) => d.name).join('、') || '无'}
量化数据不足的方向(可作为弱信号候选):${sparse.join('、') || '无'}

材料:
${text.slice(0, 6000)}

列出 2-4 个早期弱信号。topic 为方向名,evidence 为一句话依据(不写数字),sources 为来源编号数组如 ["S5"]。
输出 JSON:{"signals":[...]}`,
  );
  const valid = new Set(local.values());
  const signals = (out.signals ?? [])
    .map((s) => ({
      topic: String(s.topic ?? '').trim(),
      evidence: String(s.evidence ?? '').trim(),
      sourceIds: arr(s.sources).map(sid).filter((id) => valid.has(id)),
      confidence: '低' as const,
    }))
    .filter((s) => s.topic && s.sourceIds.length);
  emit({ type: 'step', step: 'weak', status: 'done', detail: `${signals.length} 条` });
  return signals;
}

// ---------- ④ 综合研判 ----------
function tablesForLLM(tech: TechChapter, policy: PolicyChapter, chain: ChainChapter): string {
  const t1 = tech.directions
    .map((d) => `| ${d.name} | ${d.counts.map((c) => c.count).join(' / ')} | ${d.yoy ?? '—'} | ${d.cagr ?? '—'} | ${d.accel ?? '—'} | ${d.stage} |`)
    .join('\n');
  const t2 =
    policy.kind === 'SKIPPED'
      ? '(本章数据不足,已跳过)'
      : policy.byYear.map((y) => `| ${y.year} | ${y.density} | ${y.weighted} |`).join('\n') +
        `\n政策加速度(最近两年加权得分变化):${policy.acceleration === null ? '样本不足,不计算;不要据此判断政策趋势' : `${policy.acceleration}%`}`;
  const t3 =
    chain.kind === 'SKIPPED'
      ? '(本章数据不足,已跳过)'
      : `区域产业集群:${chain.clusters.map((c) => `${c.name}(${c.type})`).join(';') || '无'}\n环节:${chain.nodes.map((n) => `${n.level}·${n.node}`).join(';')}\n岗位样本:${chain.jobs.length} 个\n${
          chain.skillFreq.some((s) => s.count >= 2)
            ? `技能频次(仅列出现 ≥2 次的):${chain.skillFreq
                .filter((s) => s.count >= 2)
                .slice(0, 12)
                .map((s) => `${s.skill}×${s.count}`)
                .join('、')}`
            : '技能频次:样本不足(没有出现 ≥2 次的技能),不要基于具体技能给建议'
        }`;
  return `【T1 技术方向论文数与增长(年份 ${tech.years.join(' / ')};同比%、CAGR%、加速比、阶段)】
| 方向 | 年度论文数 | 同比% | CAGR% | 加速比 | 阶段 |
${t1}

【T2 政策信号(年份、政策数、加权得分)】
${t2}

【T3 产业链与岗位技能】
${t3}`;
}

async function insightChapter(ctx: Ctx, tables: string, allowed: number[]) {
  const { input, emit } = ctx;
  emit({ type: 'step', step: 'insight', status: 'working' });
  const out = await callJSON<{ summary: { text: string; refs: string[] }[]; majorAdvice: { text: string; refs: string[] }[] }>(
    `你是产业研究报告的解读撰稿人。规则:
1. 只能使用给定表格中的信息,不得引入外部知识或新的数字;
2. 引用数字时必须与表格完全一致;
3. 若数据无明显变化,不要写成变化;阶段判定以表格为准,不得改判;
4. 每条结论必须在 refs 中注明依据的表格编号(T1/T2/T3);
5. 技能只能引用频次 ≥ 2 的项;若岗位样本较少,要明确说明"岗位样本有限"。`,
    `产业:${input.industry};区域:${input.region};服务专业:${input.major || '未指定'}

${tables}

请输出:
- summary:3-5 条综合判断(该产业是否值得专业对接、哪些方向在加速、政策是否在加码),每条 1-2 句
- majorAdvice:3-4 条对"${input.major || '相关专业'}"建设的建议(课程方向、能力培养、校企合作对接环节),每条要落到表格中的具体方向/环节/技能

输出 JSON:{"summary":[{"text":"","refs":["T1"]}],"majorAdvice":[{"text":"","refs":["T3"]}]}`,
    3000,
  );
  const check = (list: { text: string; refs: string[] }[] | undefined): Claim[] =>
    (list ?? [])
      .filter((c) => c?.text)
      .map((c) => ({ text: c.text, refs: (c.refs ?? []).map(String), unverifiedNumbers: unverifiedNumbers(c.text, allowed) }));
  const summary = check(out.summary);
  const majorAdvice = check(out.majorAdvice);
  const flagged = [...summary, ...majorAdvice].filter((c) => c.unverifiedNumbers.length).length;
  emit({ type: 'step', step: 'insight', status: 'done', detail: flagged ? `${flagged} 条含未核验数字,已标出` : '数字全部可在表格中找到' });
  return { summary, majorAdvice };
}

// ---------- ⑥ 与上一次比对 ----------
function computeDelta(ctx: Ctx, tech: TechChapter, policy: PolicyChapter, chain: ChainChapter, recalled: ReportDelta['recalled']): ReportDelta {
  const { kb, input, inc } = ctx;
  const knownPolicies = new Set(kb.policies.map((e) => e.key));
  const knownNodes = new Set(kb.nodes.filter((e) => e.region === input.region).map((e) => e.key));
  const knownCompanies = new Set(kb.nodes.filter((e) => e.region === input.region).flatMap((e) => e.item.companies));
  const knownJobs = new Set(kb.jobs.filter((e) => e.region === input.region).map((e) => e.key));
  const last = [...kb.stageHistory].reverse().find((h) => h.region === input.region);
  const first = !kb.runCount;
  return {
    mode: inc.mode,
    baseAt: last?.at,
    freshnessDays: inc.freshnessDays,
    newPolicies: first ? [] : policy.items.filter((p) => !p.history && !knownPolicies.has(norm(p.name))).map((p) => p.name),
    newNodes: first ? [] : chain.nodes.filter((n) => !n.history && !knownNodes.has(`${n.level}|${norm(n.node)}`)).map((n) => `${n.level}·${n.node}`),
    newCompanies: first ? [] : Array.from(new Set(chain.nodes.flatMap((n) => n.companies).filter((c) => !knownCompanies.has(c)))),
    newJobs: first ? [] : chain.jobs.filter((j) => !j.history && !knownJobs.has(norm(j.title))).map((j) => j.title),
    stageChanges: last
      ? tech.directions.filter((d) => last.stages[d.name] && last.stages[d.name] !== d.stage).map((d) => ({ name: d.name, from: last.stages[d.name], to: d.stage }))
      : [],
    recalled,
    cache: { ...ctx.fw.stats },
  };
}

// ---------- 主入口 ----------
export async function runIndustryReport(input: ReportInput, emit: Emit): Promise<IndustryReport> {
  // ⓪ 先查日志
  const kb = await loadKb(input.industry);
  const inc = planIncremental(kb, input.region, !!input.forceFull);
  const ctx: Ctx = { input, reg: new SourceRegistry(), emit, fw: new Flywheel(), kb, inc };
  emit({
    type: 'step',
    step: 'history',
    status: 'done',
    detail:
      inc.mode === 'incremental'
        ? `已有 ${kb.runCount} 次检索沉淀,上次 ${new Date(inc.baseAt!).toLocaleDateString('zh-CN')};本次只检索最近 ${inc.freshnessDays} 天的变化`
        : kb.runCount
          ? `已有 ${kb.runCount} 次检索沉淀,本次全量检索并与历史合并`
          : '首次检索该产业,全量检索',
  });

  // ①②③ 并行
  const [tech, pol, ch] = await Promise.all([
    techChapter(ctx),
    policyChapter(ctx).catch((e) => {
      emit({ type: 'step', step: 'policy', status: 'error', detail: (e as Error).message });
      return { chapter: { kind: 'SKIPPED', items: [], byYear: [], acceleration: null, note: `检索或抽取失败:${(e as Error).message}` } as PolicyChapter, recalled: 0 };
    }),
    chainChapter(ctx).catch((e) => {
      emit({ type: 'step', step: 'chain', status: 'error', detail: (e as Error).message });
      return { chapter: { kind: 'SKIPPED', clusters: [], nodes: [], jobs: [], skillFreq: [], note: `检索或抽取失败:${(e as Error).message}` } as ChainChapter, recalled: { nodes: 0, jobs: 0 } };
    }),
  ]);
  const policy = pol.chapter;
  const chain = ch.chapter;

  // ④⑤ 并行
  const allowed = allowedNumbers({ tech, policy, chain });
  const [insight, signals] = await Promise.all([insightChapter(ctx, tablesForLLM(tech, policy, chain), allowed), weakChapter(ctx, tech).catch(() => [] as WeakSignal[])]);

  const delta = computeDelta(ctx, tech, policy, chain, { policies: pol.recalled, ...ch.recalled });
  const R = STAGE_RULES;
  return {
    industry: input.industry,
    region: input.region,
    major: input.major,
    delta,
    generatedAt: new Date().toISOString(),
    model: reportModel(),
    tech,
    policy,
    chain,
    insight: { kind: 'INTERPRETED', ...insight },
    weak: { kind: 'WEAK', signals },
    sources: ctx.reg.list,
    method: [
      { label: '检索飞轮', value: `先查该产业的历史沉淀(${normIndustry(input.industry)});有历史时只检索上次之后的变化,并把本次未命中、历史上带来源出现过的条目补回(标注「历史沉淀」)` },
      { label: '平方数据', value: '政策库(层级、发布时间、官方链接)、产业集群库、国内专业库(就业方向),经 MCP 查询,来源标注「平方」' },
      { label: '论文数据', value: `OpenAlex 年度论文数(${tech.years[0]}–${tech.years[tech.years.length - 1]},仅统计完整年份)` },
      { label: '增长指标', value: '同比 =(当年−上年)/上年;CAGR =(末年/首年)^(1/6)−1;加速比 = 当年同比 / 上年同比' },
      {
        label: '阶段判定',
        value: `总量<${R.minTotal}→数据不足;末年<${R.embryoMaxLast}且近两年占比>${R.embryoRecentShare}→萌芽期;同比≥${R.burstYoy}%且加速比>1→爆发期;同比<${R.declineYoy}%→调整期;CAGR≥${R.growthCagr}%→成长期;其余→成熟期(阈值为演示口径,需专家校准)`,
      },
      { label: '政策力度', value: '国家级 5 / 部委级 4 / 省级 3 / 市级 2 / 区县级 1;加权得分 = 当年政策力度之和;加速度 = 最近两年加权得分变化率(任一年少于 2 条时不计算)' },
      { label: '大模型', value: `阿里云 ${reportModel()}:仅用于检索式拆分、信息抽取与解读,不参与任何数值计算` },
      { label: '数字校验', value: '解读文本中的每个数字都会与计算结果比对,找不到出处的数字在报告中标红' },
    ],
  };
}
