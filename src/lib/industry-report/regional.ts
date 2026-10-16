// 区域产业画像:本省产业规模、细分方向、企业分布、上市公司研发投入、投融资、国家—部委—本省政策、岗位薪资与供需
//
// 取数顺序(基建 + 飞轮):
//   1. 代码内预查底库(base/,scripts/prefetch-industry-base.ts 生成)——直接调用,秒出
//   2. 飞轮知识库(以前现查过的)——180 天内直接复用
//   3. 都没有 → 现查(9 次联网检索 + 2 次抽取),结果回流飞轮,下次就有了
//
// 可解释与鲁棒:模型只从检索原文中抽取;每条都带来源;数值与企业名必须在原文中逐字出现,否则丢弃。
import { callJSON } from './llm';
import { getStore } from './store';
import { regionInfo } from './pingfang';
import { normIndustry } from './flywheel';
import { BASE_PROFILES } from './base';
import type { SearchResult } from '@/lib/search';
import type { RegionalProfile, RegionalSource, RegionalPolicy } from './types';

export type SearchFn = (query: string) => Promise<SearchResult>;
type Log = (message: string) => void;

const STORE_TTL = 180 * 86400000;
const LEVELS: RegionalPolicy['level'][] = ['国家级', '部委级', '省级', '市级'];

// ---------- 取数 ----------
const core = (s: string) => normIndustry(s).replace(/产业|行业|与|和|及/g, '');

/** 底库匹配:同省,且产业名或别名互相包含 */
export function findBaseProfile(industry: string, province: string): RegionalProfile | null {
  const q = core(industry);
  if (!q) return null;
  const hit = BASE_PROFILES.find(
    (p) => p.province === province && [p.industry, ...(p.aliases ?? [])].some((n) => q.includes(core(n)) || core(n).includes(q)),
  );
  return hit ? { ...hit, origin: 'base' } : null;
}

const storeKey = (province: string, industry: string) => `${province}|${normIndustry(industry)}`;

export async function getRegionalProfile(industry: string, region: string, search: SearchFn, log: Log): Promise<RegionalProfile | null> {
  const { provinceName } = regionInfo(region);
  if (!provinceName) {
    log('区域画像:未识别出省份,跳过');
    return null;
  }
  const base = findBaseProfile(industry, provinceName);
  if (base) {
    log(`区域画像:命中代码内底库「${provinceName} · ${base.industry}」(预查于 ${base.collectedAt.slice(0, 10)})`);
    return base;
  }
  const cached = await getStore().get<RegionalProfile>('regional', storeKey(provinceName, industry));
  if (cached && Date.now() - new Date(cached.collectedAt).getTime() < STORE_TTL) {
    log(`区域画像:命中飞轮知识库(${cached.collectedAt.slice(0, 10)} 现查沉淀)`);
    return cached;
  }
  log(`区域画像:底库暂无「${provinceName} · ${industry}」,现查并回流知识库`);
  const live = await collectRegionalProfile(industry, provinceName, search, log);
  await getStore().put('regional', storeKey(provinceName, industry), live);
  return live;
}

// ---------- 现查 ----------
// terms:统计口径的产业名(如「装备制造业」「农产品加工业」),第一个为主口径;
// 规模与细分方向按每个口径各查一次(不同省份统计口径不同),其余检索用主口径
const QUERIES = (prov: string, terms: string[]) => {
  const ind = terms[0];
  return [
  ...terms.flatMap((t, i) => [
    { key: 'scale', q: `${prov}${t} 2024年 营业收入 增加值 同比增长 规模以上` },
    { key: 'scale2', q: `${prov} ${t} 产业规模 产值 突破 亿元 2025年` },
    { key: 'segments', q: i === 0 ? `${prov} 推动${t}高质量发展 实施方案 重点任务 重点领域` : `${prov} ${t} 重点发展 细分领域 产业集群` },
  ]),
  { key: 'cities', q: `${prov} ${ind} 龙头企业 重点企业 城市分布 产业园区 产业基地` },
  { key: 'listedNames', q: `${prov} ${ind} A股上市公司 龙头 证券代码 主营业务` },
  { key: 'financing', q: `${prov} ${ind} 企业 完成融资 亿元 投资项目 签约 2025年` },
  { key: 'policyNation', q: `${ind} 国家政策 国务院 工信部 发展改革委 指导意见 行动方案 2024 2025` },
  { key: 'policyProvince', q: `${prov} ${ind} 政策 实施方案 行动计划 若干措施 2024 2025` },
  { key: 'jobs', q: `${prov} ${ind} 企业招聘 岗位 薪资 月薪 任职要求 技能` },
  { key: 'demand', q: `${prov} ${ind} 人才需求 人才缺口 紧缺岗位 用工需求` },
  ];
};

interface Material {
  key: string;
  text: string; // [ref_N] 已改写为画像内编号 [S#]
}

function collector(search: SearchFn, log: Log) {
  const sources: RegionalSource[] = [];
  const materials: Material[] = [];
  const addSource = (title: string, url: string) => {
    const hit = sources.find((s) => (url ? s.url === url : s.title === title));
    if (hit) return hit.id;
    const id = sources.length + 1;
    sources.push({ id, title: title || url, url });
    return id;
  };
  const run = async (key: string, q: string) => {
    try {
      const r = await search(q);
      if (!r.AbstractText || /未找到相关信息/.test(r.AbstractText.slice(0, 30))) return;
      const local = new Map<number, number>();
      (r.sources ?? []).forEach((s) => local.set(s.index, addSource(s.title, s.url)));
      const text = r.AbstractText.replace(/\[ref_(\d+)\]/g, (_, n) => {
        const id = local.get(Number(n));
        return id ? `[S${id}]` : '';
      });
      materials.push({ key, text });
    } catch (e) {
      log(`检索失败(${key}):${(e as Error).message}`);
    }
  };
  return { sources, materials, run };
}

// 上市公司研发投入分两步查:先找出本省该产业的上市公司,再逐家查年报研发数据(宽泛检索查不到)
async function listedMaterials(c: ReturnType<typeof collector>, prov: string, log: Log) {
  const base = c.materials.filter((m) => m.key === 'listedNames' || m.key === 'cities').map((m) => m.text).join('\n\n');
  if (!base) return;
  const out = await callJSON<{ companies: { company: string; code: string }[] }>(
    '你是信息抽取员,只抽取材料中明确出现的内容。',
    `${base.slice(0, 9000)}\n\n从材料中找出注册或总部在${prov}的 A 股 / 港股上市公司(材料里明确说是上市公司或给出了证券代码的才算),最多 5 家。输出 JSON:{"companies":[{"company":"公司简称或全称","code":"证券代码,没有就空"}]}`,
    800,
  ).catch(() => ({ companies: [] }));
  const names = (out.companies ?? []).map((x) => str(x.company)).filter((n) => nameOk(n, base)).slice(0, 5);
  log(`上市公司:${names.length ? names.join('、') : '材料中未找到'}`);
  await Promise.all(names.map((n) => c.run('listed', `${n} 2024年年度报告 研发投入 研发费用 营业收入 占比`)));
}

// ---------- 程序校验 ----------
const numbersIn = (s: string) => (s.match(/\d+(?:\.\d+)?/g) ?? []).filter((n) => n.length > 0);
const plain = (s: string) => s.replace(/[,，\s]/g, '');
/** 字段里的每个数字都必须在原文中出现(去掉千分位后比较) */
const numbersOk = (field: string, text: string) => {
  const t = plain(text);
  return numbersIn(plain(field)).every((n) => t.includes(n));
};
const nameOk = (name: string, text: string) => !!name && plain(text).includes(plain(name).replace(/[《》“”"]/g, '').slice(0, 12));
const ids = (v: unknown, valid: Set<number>) =>
  Array.from(new Set((Array.isArray(v) ? v : [v]).map((x) => Number(String(x ?? '').replace(/[^\d]/g, ''))).filter((n) => valid.has(n))));
const str = (v: unknown) => String(v ?? '').trim();
const yearOf = (v: unknown) => String(v ?? '').match(/(19|20)\d{2}/)?.[0] ?? '';
// 同一指标同年同口径出现多个数值时(多为不同统计期),只保留第一条,避免报告前后矛盾
const dedupe = <T,>(rows: T[], key: (r: T) => string) => rows.filter((r, i) => rows.findIndex((x) => key(x) === key(r)) === i);
const list = (v: unknown) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(/[、,，;；/]/) : []).map((x) => String(x).trim()).filter(Boolean);

export async function collectRegionalProfile(industry: string, province: string, search: SearchFn, log: Log, terms: string[] = [industry]): Promise<RegionalProfile> {
  const c = collector(search, log);
  const queries = QUERIES(province, terms.length ? terms : [industry]);
  await Promise.all(queries.map(({ key, q }) => c.run(key, q)));
  await listedMaterials(c, province, log);
  const { sources, materials } = c;
  const total = queries.length;
  const valid = new Set(sources.map((s) => s.id));
  const pick = (...keys: string[]) =>
    materials
      .filter((m) => keys.includes(m.key))
      .map((m) => `【${m.key}】\n${m.text}`)
      .join('\n\n');
  const textA = pick('scale', 'scale2', 'segments', 'cities', 'listedNames', 'listed', 'financing');
  const textB = pick('policyNation', 'policyProvince', 'jobs', 'demand');
  const all = textA + '\n' + textB;
  log(`区域画像检索完成:${materials.length} 组材料(基础检索 ${total} 次 + 上市公司逐家检索),${sources.length} 条来源`);

  const rule = '你是产业研究信息抽取员。只能抽取材料中明确出现的内容,数值必须照抄原文,不得换算、补充或推测;每条必须给出材料中的来源编号(如 "S3"),没有来源编号的条目不要输出。';
  const [a, b] = await Promise.all([
    textA
      ? callJSON<Record<string, Record<string, unknown>[]>>(
          rule,
          `产业:${industry};省份:${province}

${textA.slice(0, 16000)}

抽取以下内容(只要${province}或其下辖城市的;全国数据不要放进 scale):
1. scale:该产业的经济规模事实,只要营业收入、产值、增加值、增速、利润、企业数量、占全省工业比重这类经济指标(培训人次、效率提升、目标值等不要)。metric 指标名(如"规模以上企业营业收入");value 原文数值(只写数字);unit 单位(亿元 / % / 家 等);year 四位统计年份;scope 统计范围(全省 / 某市 / 某园区);src 来源编号数组。全省口径排前面,最多 8 条。
2. segments:重点细分方向。name 方向名(不超过 12 字);desc 一句话依据;src。最多 6 条。
3. cities:企业的城市分布。city 城市名;focus 该市侧重(一句话);companies 原文点名的企业;src。最多 6 个城市。
4. listed:${province}的上市公司研发投入。company;code 股票代码(原文没有就空);city;rdExpense 研发费用(含单位,照抄);rdRatio 研发投入占营收比(照抄,没有就空);year;src。最多 8 家。
5. financing:投融资与重大项目。company;event 事件(融资轮次 / 投资项目 / 签约 / 产业基金);amount 金额(照抄,没有就空);date;src。最多 8 条。

输出 JSON:{"scale":[],"segments":[],"cities":[],"listed":[],"financing":[]}`,
          5000,
        ).catch((e) => {
          log(`抽取失败(规模与企业):${(e as Error).message}`);
          return {};
        })
      : Promise.resolve({}),
    textB
      ? callJSON<Record<string, Record<string, unknown>[]>>(
          rule,
          `产业:${industry};省份:${province}

${textB.slice(0, 16000)}

抽取以下内容:
1. policies:与该产业直接相关的政策文件。level 只能是 国家级(国务院及其办公厅)/部委级(工信部、发改委等部委)/省级(${province}省级)/市级(${province}下辖城市);name 政策全称;issuer 发布机构;year 四位发布年份(原文没有就空);gist 政策导向要点(一句话,概括原文);src。其他省份的地方政策不要。最多 12 条。
2. jobs:企业岗位。title 岗位名;city 城市(原文没有就空);salary 薪资(照抄原文,如 "8-15K";没有就空);skills 技能或工具数组;src。不要教师、销售、行政、普工类岗位。最多 12 条。
3. demand:人才供需与缺口的原文陈述(text 一句话,保留原文数字);src。最多 5 条。

输出 JSON:{"policies":[],"jobs":[],"demand":[]}`,
          5000,
        ).catch((e) => {
          log(`抽取失败(政策与人才):${(e as Error).message}`);
          return {};
        })
      : Promise.resolve({}),
  ]);

  let dropped = 0;
  const keep = <T,>(ok: boolean, v: T): T[] => {
    if (!ok) dropped++;
    return ok ? [v] : [];
  };
  const rows = (o: Record<string, Record<string, unknown>[]>, k: string) => (Array.isArray(o[k]) ? o[k] : []);

  const profile: RegionalProfile = {
    industry,
    province,
    collectedAt: new Date().toISOString(),
    origin: 'live',
    sources,
    scale: dedupe(rows(a, 'scale'), (r) => `${str(r.metric)}|${yearOf(r.year)}|${str(r.scope)}`).flatMap((r) => {
      const v = { metric: str(r.metric), value: str(r.value), unit: str(r.unit), year: yearOf(r.year), scope: str(r.scope), src: ids(r.src, valid) };
      return keep(!!v.metric && !!v.value && v.src.length > 0 && numbersOk(v.value, all), v);
    }),
    segments: rows(a, 'segments').flatMap((r) => {
      const v = { name: str(r.name), desc: str(r.desc), src: ids(r.src, valid) };
      return keep(!!v.name && v.src.length > 0, v);
    }),
    cities: rows(a, 'cities').flatMap((r) => {
      const v = { city: str(r.city), focus: str(r.focus), companies: list(r.companies).filter((c) => nameOk(c, all)).slice(0, 8), src: ids(r.src, valid) };
      return keep(!!v.city && v.src.length > 0, v);
    }),
    listed: rows(a, 'listed').flatMap((r) => {
      const v = {
        company: str(r.company),
        code: str(r.code),
        city: str(r.city),
        rdExpense: str(r.rdExpense),
        rdRatio: str(r.rdRatio),
        year: yearOf(r.year),
        src: ids(r.src, valid),
      };
      return keep(nameOk(v.company, all) && v.src.length > 0 && numbersOk(v.rdExpense + v.rdRatio + v.code, all) && !!(v.rdExpense || v.rdRatio), v);
    }),
    financing: rows(a, 'financing').flatMap((r) => {
      const v = { company: str(r.company), event: str(r.event), amount: str(r.amount), date: str(r.date), src: ids(r.src, valid) };
      return keep(!!v.event && v.src.length > 0 && numbersOk(v.amount, all), v);
    }),
    policies: rows(b, 'policies').flatMap((r) => {
      const v = { level: str(r.level) as RegionalPolicy['level'], name: str(r.name), issuer: str(r.issuer), year: yearOf(r.year), gist: str(r.gist), src: ids(r.src, valid) };
      return keep(LEVELS.includes(v.level) && nameOk(v.name, all) && v.src.length > 0, v);
    }),
    jobs: rows(b, 'jobs').flatMap((r) => {
      const v = { title: str(r.title), city: str(r.city), salary: str(r.salary), skills: list(r.skills).slice(0, 8), src: ids(r.src, valid) };
      return keep(!!v.title && !/教师|讲师|销售|行政|普工/.test(v.title) && v.src.length > 0 && numbersOk(v.salary, all), v);
    }),
    demand: rows(b, 'demand').flatMap((r) => {
      const v = { text: str(r.text), src: ids(r.src, valid) };
      return keep(!!v.text && v.src.length > 0 && numbersOk(v.text, all), v);
    }),
  };
  log(
    `区域画像抽取:规模 ${profile.scale.length} · 细分 ${profile.segments.length} · 城市 ${profile.cities.length} · 上市公司 ${profile.listed.length} · 投融资 ${profile.financing.length} · 政策 ${profile.policies.length} · 岗位 ${profile.jobs.length}` +
      (dropped ? `;${dropped} 条因来源或数字无法在原文核对而丢弃` : ''),
  );
  return profile;
}
