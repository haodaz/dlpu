// 区域重点产业:某地区(省 + 市)客观的重点产业清单,不取决于学校开设了哪些专业
// 来源:省市规划 / 政府工作报告等政策文件(联网检索抽取)+ 平方产业集群库
// 取数顺序同区域画像:代码内预查底库(region-base/)→ 飞轮知识库 → 现查并回流
import { callJSON } from './llm';
import { getStore } from './store';
import { regionInfo, pfRegionClusters, type PfCluster } from './pingfang';
import { REGION_BASE } from './region-base';
import type { SearchFn } from './regional';
import type { RegionalSource } from './types';

export interface RegionIndustry {
  name: string; // 产业名(简称)
  level: string; // 定位:国家级集群 / 省重点产业 / 市主导产业 / 战略性新兴产业 / 未来产业 等(照原文)
  scope: string; // 省名或市名
  desc: string; // 一句话:定位、规模或发展目标(照原文概括)
  scale: string; // 原文中的规模数字(如「营收 1.2 万亿元」),没有为空
  src: number[];
}

export interface RegionIndustryProfile {
  region: string;
  province: string;
  city: string;
  collectedAt: string;
  origin: 'base' | 'live';
  sources: RegionalSource[];
  industries: RegionIndustry[];
  clusters: PfCluster[]; // 平方产业集群库
}

const TTL = 180 * 86400000;
const plain = (s: string) => s.replace(/[,，\s]/g, '');
const nums = (s: string) => plain(s).match(/\d+(?:\.\d+)?/g) ?? [];

export async function getRegionIndustries(region: string, search: SearchFn, log: (m: string) => void): Promise<RegionIndustryProfile | null> {
  const { provinceName, city } = regionInfo(region);
  if (!provinceName) return null;
  const base = REGION_BASE.find((r) => r.province === provinceName && (!city || r.city === city));
  if (base) {
    log(`区域重点产业:命中代码内底库(${base.collectedAt.slice(0, 10)})`);
    return { ...base, origin: 'base' };
  }
  const key = `${provinceName}|${city ?? ''}`;
  const cached = await getStore().get<RegionIndustryProfile>('region-industries', key);
  if (cached && Date.now() - new Date(cached.collectedAt).getTime() < TTL) return cached;
  const live = await collectRegionIndustries(region, search, log);
  await getStore().put('region-industries', key, live);
  return live;
}

export async function collectRegionIndustries(region: string, search: SearchFn, log: (m: string) => void): Promise<RegionIndustryProfile> {
  const { provinceName = '', city = '' } = regionInfo(region);
  const sources: RegionalSource[] = [];
  const add = (title: string, url: string) => {
    const hit = sources.find((s) => (url ? s.url === url : s.title === title));
    if (hit) return hit.id;
    sources.push({ id: sources.length + 1, title: title || url, url });
    return sources.length;
  };
  const queries = [
    `${provinceName} 重点产业集群 "十四五" 规划 重点发展 产业 名单`,
    `${provinceName} 2025年 政府工作报告 重点产业 战略性新兴产业 未来产业`,
    ...(city ? [`${city} 2025年 政府工作报告 主导产业 重点产业集群`, `${city} 重点产业 产值 规模 产业集群`] : []),
  ];
  const texts: string[] = [];
  await Promise.all(
    queries.map(async (q) => {
      try {
        const r = await search(q);
        if (!r.AbstractText || /未找到相关信息/.test(r.AbstractText.slice(0, 30))) return;
        const local = new Map<number, number>();
        (r.sources ?? []).forEach((s) => local.set(s.index, add(s.title, s.url)));
        texts.push(r.AbstractText.replace(/\[ref_(\d+)\]/g, (_, n) => (local.get(Number(n)) ? `[S${local.get(Number(n))}]` : '')));
      } catch (e) {
        log(`检索失败:${(e as Error).message}`);
      }
    }),
  );
  const all = texts.join('\n\n');
  const valid = new Set(sources.map((s) => s.id));
  const clusters = await pfRegionClusters(region);
  log(`区域重点产业检索:${texts.length}/${queries.length} 组材料,平方集群 ${clusters.length} 个`);

  const out = all
    ? await callJSON<{ industries: Record<string, unknown>[] }>(
        '你是区域产业研究信息抽取员。只能抽取材料中明确出现的内容,不得补充或推测;每条必须给出材料中的来源编号。',
        `地区:${provinceName}${city ? ` · ${city}` : ''}

${all.slice(0, 16000)}

抽取材料中明确提到的、该地区政府重点发展的产业(产业集群、主导产业、战略性新兴产业、未来产业),合并同义项,最多 14 条。每条:
- name:产业名(简洁,如「高端装备制造」「石化和精细化工」)
- level:材料中的定位(如 国家级先进制造业集群 / 省重点产业集群 / 市主导产业 / 战略性新兴产业 / 未来产业)
- scope:${provinceName}${city ? ` 或 ${city}` : ''}(属于哪一级)
- desc:一句话说明定位或发展目标(照材料概括)
- scale:材料中该产业的规模数字(如「营业收入 1.2 万亿元」),照抄,没有就空
- src:来源编号数组,如 ["S2"]

输出 JSON:{"industries":[...]}`,
        4000,
      ).catch(() => ({ industries: [] }))
    : { industries: [] };

  const str = (v: unknown) => String(v ?? '').trim();
  const t = plain(all);
  const industries: RegionIndustry[] = (out.industries ?? [])
    .map((r) => ({
      name: str(r.name),
      level: str(r.level),
      scope: str(r.scope) || provinceName,
      desc: str(r.desc),
      scale: str(r.scale),
      src: Array.from(new Set((Array.isArray(r.src) ? r.src : [r.src]).map((x) => Number(String(x ?? '').replace(/[^\d]/g, ''))).filter((n) => valid.has(n)))),
    }))
    .filter((r) => r.name && r.src.length && nums(r.scale).every((n) => t.includes(n)));
  log(`区域重点产业:${industries.length} 个`);
  return { region, province: provinceName, city, collectedAt: new Date().toISOString(), origin: 'live', sources, industries, clusters };
}
