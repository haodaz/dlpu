// 平方数据(MCP)查询:政策库 / 产业集群库 / 国内专业库
// 结构化、可溯源的一手数据;查询失败或无结果时返回空数组,由流水线降级到联网检索
import { mcpToolsDataPlatform } from '@/lib/mcp/generated-tools';

// 省级行政区划代码(平方库里的 province 字段存代码)
const PROVINCE_CODE: Record<string, string> = {
  北京: '11', 天津: '12', 河北: '13', 山西: '14', 内蒙古: '15', 辽宁: '21', 吉林: '22', 黑龙江: '23',
  上海: '31', 江苏: '32', 浙江: '33', 安徽: '34', 福建: '35', 江西: '36', 山东: '37', 河南: '41',
  湖北: '42', 湖南: '43', 广东: '44', 广西: '45', 海南: '46', 重庆: '50', 四川: '51', 贵州: '52',
  云南: '53', 西藏: '54', 陕西: '61', 甘肃: '62', 青海: '63', 宁夏: '64', 新疆: '65',
};

export function regionInfo(region: string) {
  const province = Object.keys(PROVINCE_CODE).find((p) => region.includes(p));
  const city = region.replace(/^.*?(省|自治区)/, '').replace(/市.*$/, '').trim();
  return { provinceName: province, provinceCode: province ? PROVINCE_CODE[province] : undefined, city: city && city !== province ? city : undefined };
}

type Item = Record<string, unknown>;

async function search(model: string, fields: string[], condition: unknown, limit: number): Promise<Item[]> {
  const token = process.env.VISIONSQUARE_AUTH_BEARER;
  if (!token) return [];
  // MCP 首次调用要冷启动,偶尔超时:超时后重试一次
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = (await Promise.race([
        mcpToolsDataPlatform.dashGenericSearch({ model, fields, condition: JSON.stringify(condition), limit }, token),
        new Promise((_, reject) => setTimeout(() => reject(new Error('平方数据查询超时')), 30000)),
      ])) as { items?: Item[] };
      return res?.items ?? [];
    } catch {
      /* 重试 */
    }
  }
  return [];
}

const like = (field: string, v: string) => ({ leaf: { field, comparator: 'ilike', value: `%${v}%` } });

export interface PfPolicy {
  name: string;
  issuer: string;
  date: string;
  level: string; // 平方原始层级字段
  isNational: boolean;
  hasCity: boolean;
  link: string;
}

// 政策库:按名称/主题/关键词匹配,只保留全国性政策或报告所在省份的政策
export async function pfPolicies(keywords: string[], region: string): Promise<PfPolicy[]> {
  const { provinceCode } = regionInfo(region);
  const items = await search(
    'VSDIndustryPolicy',
    ['name', 'policy_level', 'province', 'city', 'publish_organization', 'publish_date', 'official_link'],
    { logic_operator: '|', children: keywords.flatMap((k) => [like('name', k), like('theme', k), like('policy_keywords', k)]) },
    30,
  );
  return items
    .map((p) => {
      const provinces = ([] as unknown[]).concat(p.province ?? []).map(String);
      const cities = ([] as unknown[]).concat(p.city ?? []).map(String).filter(Boolean);
      return {
        name: String(p.name ?? ''),
        issuer: String(p.publish_organization ?? ''),
        date: String(p.publish_date ?? ''),
        level: String(p.policy_level ?? ''),
        isNational: !provinces.length || /country|nation/i.test(String(p.policy_level ?? '')),
        hasCity: cities.length > 0,
        link: String(p.official_link ?? ''),
        provinces,
      };
    })
    .filter((p) => p.name && (p.isNational || (provinceCode && p.provinces.includes(provinceCode))));
}

export interface PfCluster {
  name: string;
  type: string;
  mainIndustry: string;
}

// 产业集群库:按地区名找集群,再按主导产业与产业方向的相关性过滤
export async function pfClusters(industry: string, region: string): Promise<PfCluster[]> {
  const { provinceName, city } = regionInfo(region);
  const places = [city, provinceName].filter(Boolean) as string[];
  if (!places.length) return [];
  const items = await search('VSDIndustryCluster', ['name', 'cluster_type', 'main_industry', 'province', 'city'], { logic_operator: '|', children: places.map((p) => like('name', p)) }, 30);
  const core = industry.slice(0, 2);
  return items
    .map((c) => ({ name: String(c.name ?? ''), type: String(c.cluster_type ?? ''), mainIndustry: String(c.main_industry ?? '') }))
    .filter((c) => c.name && (c.mainIndustry.includes(core) || industry.includes(c.mainIndustry)));
}

// 产业集群库:某地区的全部集群(不按产业过滤,用于「区域重点产业」的客观展示)
export async function pfRegionClusters(region: string): Promise<PfCluster[]> {
  const { provinceName, city } = regionInfo(region);
  const places = [city, provinceName].filter(Boolean) as string[];
  if (!places.length) return [];
  const items = await search('VSDIndustryCluster', ['name', 'cluster_type', 'main_industry'], { logic_operator: '|', children: places.map((p) => like('name', p)) }, 40);
  const seen = new Set<string>();
  return items
    .map((c) => ({ name: String(c.name ?? ''), type: String(c.cluster_type ?? ''), mainIndustry: String(c.main_industry ?? '') }))
    .filter((c) => c.name && !seen.has(c.name) && (seen.add(c.name), true));
}

// 国内专业库:取专业的就业方向(结构化文本中的岗位名)
export async function pfMajorJobs(major: string): Promise<{ titles: string[]; raw: string }> {
  if (!major) return { titles: [], raw: '' };
  const items = await search('CRMMoe', ['name', 'employment_direction'], { logic_operator: '|', children: [{ leaf: { field: 'name', comparator: '=', value: major } }] }, 1);
  const raw = String(items[0]?.employment_direction ?? '');
  const part = raw.split(/就业方向\s*[:：]/)[1] ?? '';
  const titles = part
    .split(/[、,，。;；\n]/)
    .map((s) => s.trim())
    .filter((s) => s && s.length <= 20);
  return { titles, raw };
}

// 企业库:按企业名查简介(企业库字段多为空,查不到时由流水线改用联网检索)
export interface PfCompany {
  name: string;
  intro: string;
  city: string;
  revenue: string;
}
export async function pfCompanies(names: string[]): Promise<PfCompany[]> {
  if (!names.length) return [];
  const items = await search('CRMCompany', ['name', 'introduction', 'one_sentence', 'city', 'operating_revenue'], { logic_operator: '|', children: names.map((n) => like('name', n)) }, 30);
  return items
    .map((c) => ({ name: String(c.name ?? ''), intro: String(c.introduction || c.one_sentence || '').trim(), city: String(c.city ?? ''), revenue: String(c.operating_revenue ?? '') }))
    .filter((c) => c.name);
}

// 职业库薪资字段是按工作年限分档的 JSON(月薪,元),转成可读文本;全为 0 视为无数据
function salaryText(raw: unknown, recent: unknown): string {
  try {
    const o = JSON.parse(String(raw ?? '')) as Record<string, number>;
    const parts = Object.entries(o)
      .filter(([, v]) => Number(v) > 0)
      .map(([k, v]) => `${k.replace(/^year_(\d+)_(\d+)$/, '$1–$2 年')} ${Math.round(Number(v))} 元`);
    if (parts.length) return `月薪:${parts.join(' / ')}`;
  } catch {
    /* 非 JSON */
  }
  return Number(recent) > 0 ? `近一年月薪约 ${Math.round(Number(recent))} 元` : '';
}

// 职业库:按岗位关键词查职业(介绍、任职要求、职责、薪资)
export interface PfOccupation {
  name: string;
  intro: string;
  requirement: string;
  responsibility: string;
  salary: string;
}
export async function pfOccupations(keywords: string[]): Promise<PfOccupation[]> {
  if (!keywords.length) return [];
  const items = await search('CRMOccupation', ['name', 'intro', 'position_requirement', 'responsibility', 'salary_str', 'recent_year_monthly_salary'], { logic_operator: '|', children: keywords.map((k) => like('name', k)) }, 30);
  return items
    .map((o) => ({
      name: String(o.name ?? ''),
      intro: String(o.intro ?? '').trim(),
      requirement: String(o.position_requirement ?? '').trim(),
      responsibility: String(o.responsibility ?? '').trim(),
      salary: salaryText(o.salary_str, o.recent_year_monthly_salary),
    }))
    .filter((o) => o.name);
}
