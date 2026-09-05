/**
 * 统一搜索工具
 *
 * 策略：优先使用阿里云大模型搜索（DashScope 原生 API，返回来源+角标），失败时降级到 Bocha API，最后使用 DuckDuckGo。
 * 返回结构兼容 DuckDuckGo Instant Answer API，方便调用方统一处理结果。
 */

/** 搜索来源项（阿里云 DashScope 原生 API 返回） */
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
  /** 实际使用的搜索来源 */
  source: 'aliyun' | 'bocha' | 'duckduckgo';
  /** 搜索来源列表（仅阿里云 DashScope 原生 API 返回） */
  sources?: SearchSource[];
}

/**
 * 调用阿里云大模型搜索（DashScope 原生 API）
 *
 * 使用原生 API 而非 OpenAI 兼容模式，以支持 search_options.enable_source + enable_citation，
 * 返回带 [ref_N] 角标的回复内容 + search_info.search_results 来源列表。
 */
async function fetchAliyun(query: string): Promise<SearchResult> {
  const dashscopeKey = process.env.DASHSCOPE_API_KEY;

  if (!dashscopeKey || dashscopeKey === 'sk-your-dashscope-key-here') {
    throw new Error('未配置 DASHSCOPE_API_KEY，无法执行搜索。');
  }

  // 原生 API 端点（非 OpenAI 兼容模式）
  // 兼容环境变量中可能配置了兼容模式路径的情况
  const envBase = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com';
  const baseUrl = envBase.replace(/\/compatible-mode\/v1\/?$/, '').replace(/\/$/, '');
  const endpoint = `${baseUrl}/api/v1/services/aigc/text-generation/generation`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashscopeKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: '你是一个专业的搜索助手。请搜索相关信息，并以简明扼要的方式提取关键事实、人物和数据。',
            },
            {
              role: 'user',
              content: query,
            },
          ],
        },
        parameters: {
          enable_search: true,
          search_options: {
            enable_source: true,        // 返回搜索来源链接
            enable_citation: true,      // 开启角标标注 [ref_N]
            citation_format: '[ref_<number>]',
          },
          result_format: 'message',
        },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`阿里云 API 返回错误状态码：${res.status} ${errText}`);
    }

    const data = await res.json();

    // ── 诊断日志：打印完整响应结构 ──
    console.log('[Aliyun] 原始响应结构:', JSON.stringify({
      hasOutput: !!data.output,
      outputKeys: data.output ? Object.keys(data.output) : [],
      hasSearchInfo: !!data.output?.search_info,
      searchInfoKeys: data.output?.search_info ? Object.keys(data.output.search_info) : [],
      choicesLength: data.output?.choices?.length || 0,
      contentLength: data.output?.choices?.[0]?.message?.content?.length || 0,
      // 尝试多种路径获取 sources
      searchResultsPath1: data.output?.search_info?.search_results?.length || 0,
      searchResultsPath2: data.output?.search_results?.length || 0,
      searchResultsPath3: data.output?.search_info?.results?.length || 0,
      // 完整 search_info 结构
      searchInfoSample: data.output?.search_info ? JSON.stringify(data.output.search_info).substring(0, 500) : 'none',
    }, null, 2));

    // DashScope 原生 API 响应结构：output.choices[0].message.content + output.search_info.search_results
    const content: string = data.output?.choices?.[0]?.message?.content || '';
    
    // ── 多路径尝试获取 sources ──
    let searchResults: any[] = [];
    if (data.output?.search_info?.search_results) {
      searchResults = data.output.search_info.search_results;
      console.log('[Aliyun] sources 路径1 (output.search_info.search_results):', searchResults.length, '条');
    } else if (data.output?.search_results) {
      searchResults = data.output.search_results;
      console.log('[Aliyun] sources 路径2 (output.search_results):', searchResults.length, '条');
    } else if (data.output?.search_info?.results) {
      searchResults = data.output.search_info.results;
      console.log('[Aliyun] sources 路径3 (output.search_info.results):', searchResults.length, '条');
    } else {
      console.warn('[Aliyun] 未找到 sources，可用路径为空。完整 search_info:', 
        JSON.stringify(data.output?.search_info || data.output?.search_results || 'no search info'));
    }

    // 解析来源列表
    const sources: SearchSource[] = searchResults.map((r: any, idx: number) => ({
      index: r.index ?? idx + 1,
      title: r.title || r.name || '',
      url: r.url || r.link || '',
    }));

    console.log(`[Aliyun] 搜索完成: content=${content.length}字, sources=${sources.length}条`);
    if (sources.length > 0) {
      console.log('[Aliyun] 信源列表:', sources.map(s => `[${s.index}] ${s.title?.substring(0, 50)} - ${s.url?.substring(0, 80)}`).join('\n'));
    }

    if (!content) {
      return { AbstractText: '', AbstractURL: '', Heading: '', RelatedTopics: [], source: 'aliyun', sources };
    }

    return {
      AbstractText: content,
      AbstractURL: sources[0]?.url || '',
      Heading: '阿里云大模型搜索结果',
      RelatedTopics: sources.map(s => ({
        Text: s.title,
        FirstURL: s.url,
      })),
      source: 'aliyun',
      sources,
    };
  } catch (err: any) {
    console.error('[Aliyun] 搜索失败:', err.message);
    throw new Error(`阿里云搜索失败: ${err.message}`);
  }
}

/**
 * 调用 Bocha API 并转换为兼容结构
 */
async function fetchBocha(query: string, count = 10): Promise<SearchResult> {
  const bochaKey = process.env.BOCHA_API_KEY;
  if (!bochaKey || bochaKey === 'your-bocha-key-here') {
    throw new Error('未配置 BOCHA_API_KEY，无法执行搜索。');
  }

  try {
    const res = await fetch('https://api.bochaai.com/v1/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bochaKey}`,
      },
      body: JSON.stringify({ query, freshness: 'noLimit', summary: true, count }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Bocha API 返回错误状态码：${res.status}`);
    }

    const data = await res.json();
    const results: Array<{ name?: string; url?: string; snippet?: string }> =
      data.data?.webPages?.value ?? [];

    if (results.length === 0) {
      return { AbstractText: '', AbstractURL: '', Heading: '', RelatedTopics: [], source: 'bocha' };
    }

    return {
      // 拼接所有结果摘要，方便后续全文检索匹配
      AbstractText: results.map((r) => r.snippet ?? '').filter(Boolean).join(' | '),
      AbstractURL: results[0]?.url ?? '',
      Heading: results[0]?.name ?? '',
      RelatedTopics: results.slice(1).map((r) => ({
        Text: r.snippet ?? '',
        FirstURL: r.url ?? '',
      })),
      source: 'bocha',
    };
  } catch (err: any) {
    console.error('[Bocha] 搜索失败:', err.message);
    throw new Error(`搜索失败: ${err.message}`);
  }
}

/**
 * 调用 DuckDuckGo Instant Answer API
 */
async function fetchDuckDuckGo(query: string): Promise<SearchResult> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TalentAudit/1.0 (yida-platform; fact-checking)' },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return {
      AbstractText: data?.AbstractText || '',
      AbstractURL: data?.AbstractURL || '',
      Heading: data?.Heading || '',
      RelatedTopics: data?.RelatedTopics || [],
      source: 'duckduckgo',
    };
  } catch (err: any) {
    console.error('[DuckDuckGo] 搜索失败:', err.message);
    return { AbstractText: '', AbstractURL: '', Heading: '', RelatedTopics: [], source: 'duckduckgo' };
  }
}

/**
 * 统一搜索：优先使用阿里云大模型搜索，失败时降级到 Bocha，再失败降级到 DuckDuckGo
 */
export async function searchWeb(query: string): Promise<SearchResult> {
  try {
    return await fetchAliyun(query);
  } catch (err) {
    console.warn('[Search] 阿里云搜索失败，降级到 Bocha:', err);
    try {
      return await fetchBocha(query);
    } catch (bochaErr) {
      console.warn('[Search] Bocha搜索失败，降级到 DuckDuckGo:', bochaErr);
      return await fetchDuckDuckGo(query);
    }
  }
}
