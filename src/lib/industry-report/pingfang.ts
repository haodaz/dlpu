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
  try {
    const res = (await Promise.race([
      mcpToolsDataPlatform.dashGenericSearch({ model, fields, condition: JSON.stringify(condition), limit }, token),
      new Promise((_, reject) => setTimeout(() => reject(new Error('平方数据查询超时')), 30000)),
    ])) as { items?: Item[] };
    return res?.items ?? [];
  } catch {
    return [];
  }
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
