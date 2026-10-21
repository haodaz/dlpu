/**
 * 统一联网检索:只走阿里云 DashScope 大模型搜索(与 zhiji-yida 同一套做法)
 *
 * - 原生 text-generation 端点 + enable_search,返回带 [ref_N] 角标的正文 + 来源列表
 * - 端点只认原生模型名:默认 qwen-plus(qwen3.7-plus 只在 compatible-mode 可用;qwen-turbo 已被限流),可用 SEARCH_MODEL 覆盖
 * - 严格模式:搜不到就答"未找到相关信息",禁止模型用内部知识补写
 * - 全局最多 2 个并发 + 429 退避重试,避免触发限流
 * 不再使用 Bocha / DuckDuckGo。
 */

/** 搜索来源项 */
export interface SearchSource {
  index: number;
  title: string;
  url: string;
}

export interface SearchResult {
  AbstractText: string;
  AbstractURL: string;
  Heading: string;
  RelatedTopics: Array<{ Text?: string; FirstURL?: string }>;
  source: 'aliyun';
  sources?: SearchSource[];
}

export interface SearchOptions {
  /** 只要最近 N 天的结果 */
  freshnessDays?: 7 | 30 | 180 | 365;
}

const SYSTEM_PROMPT =
  '你是一个严格的联网事实检索助手。你的唯一任务是基于搜索引擎返回的真实网页数据,提取关键事实、人物、机构、时间和数据,并保留政策名称、发布机构、企业名、岗位与技能等原文信息。' +
  '如果搜索引擎没有返回相关信息,或者信息不足以回答,必须直接回复"未找到相关信息",严禁根据内部知识捏造、续写、推测或虚构。每句话都要标注来源角标。';

async function fetchAliyun(query: string, options?: SearchOptions): Promise<SearchResult> {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key) throw new Error('未配置 DASHSCOPE_API_KEY,无法执行搜索。');

  const base = (process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com')
    .replace(/\/compatible-mode\/v1\/?$/, '')
    .replace(/\/$/, '');

  const res = await fetch(`${base}/api/v1/services/aigc/text-generation/generation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.SEARCH_MODEL || 'qwen-plus',
      input: {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: query },
        ],
      },
      parameters: {
        enable_search: true,
        search_options: {
          forced_search: true,
          search_strategy: 'turbo',
          ...(options?.freshnessDays ? { freshness: options.freshnessDays } : {}),
          enable_source: true,
          enable_citation: true,
          citation_format: '[ref_<number>]',
        },
        result_format: 'message',
      },
    }),
    signal: AbortSignal.timeout(90000),
  });

  if (res.status === 429) throw Object.assign(new Error('阿里云搜索限流'), { retry: true });
  if (!res.ok) throw new Error(`阿里云搜索返回 ${res.status} ${await res.text().catch(() => '')}`);

  const data = await res.json();
  const content: string = data.output?.choices?.[0]?.message?.content || '';
  const raw: { index?: number; title?: string; name?: string; url?: string; link?: string }[] =
    data.output?.search_info?.search_results ?? data.output?.search_results ?? [];
  const sources: SearchSource[] = raw.map((r, i) => ({
    index: r.index ?? i + 1,
    title: r.title || r.name || '',
    url: r.url || r.link || '',
  }));

  return {
    AbstractText: content,
    AbstractURL: sources[0]?.url || '',
    Heading: '阿里云大模型搜索结果',
    RelatedTopics: sources.map((s) => ({ Text: s.title, FirstURL: s.url })),
    source: 'aliyun',
    sources,
  };
}

// ---------- 并发上限 + 429 重试 ----------
const MAX_CONCURRENT = 2;
let active = 0;
const waiting: (() => void)[] = [];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function acquire() {
  if (active < MAX_CONCURRENT) {
    active++;
    return;
  }
  await new Promise<void>((r) => waiting.push(r));
}

function release() {
  const next = waiting.shift();
  if (next) next();
  else active--;
}

// 低质量 / 不可核对的来源:题库、文库、问答、付费文档站。这类页面常与搜索摘要对不上或需付费解锁,
// 直接从来源中剔除,并去掉正文里指向它们的角标——只靠这些来源支撑的句子随之失去来源,抽取时会被丢弃
const LOW_QUALITY = [
  /tiku|题库|ks5u|zujuan|zuoyebang|jyeoo|exam/i,
  /wenku\.baidu|wenku\.so|docin\.com|doc88\.com|book118\.com|max\.book118|renrendoc|mbalib|wendangku|taodocs|360doc\.com/i,
  /zhidao\.baidu|wenwen\.sogou|iask\.sina|zhihu\.com\/question/i,
  /道客巴巴|豆丁|原创力文档|人人文库|百度文库|百度题库|百度知道/,
];
export const isLowQuality = (s: { title: string; url: string }) => LOW_QUALITY.some((re) => re.test(s.url) || re.test(s.title));

export function dropLowQuality(r: SearchResult): SearchResult {
  const bad = new Set((r.sources ?? []).filter(isLowQuality).map((s) => s.index));
  if (!bad.size) return r;
  return {
    ...r,
    sources: (r.sources ?? []).filter((s) => !bad.has(s.index)),
    AbstractText: r.AbstractText.replace(/\[ref_(\d+)\]/g, (m, n) => (bad.has(Number(n)) ? '' : m)),
  };
}

export async function searchWeb(query: string, options?: SearchOptions): Promise<SearchResult> {
  await acquire();
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        return dropLowQuality(await fetchAliyun(query, options));
      } catch (e) {
        if (!(e as { retry?: boolean }).retry || attempt >= 3) throw e;
        await sleep(3000 * 2 ** attempt);
      }
    }
  } finally {
    release();
  }
}
