// 阿里云 DashScope(OpenAI 兼容模式)调用封装,模型统一由 DASHSCOPE_MODEL 指定
import OpenAI from 'openai';

export function reportModel(): string {
  return process.env.DASHSCOPE_MODEL || 'qwen3.7-plus';
}

function client(): OpenAI {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('未配置 DASHSCOPE_API_KEY');
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
}

function parseJson<T>(raw: string): T | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// 结构化调用:关闭思考模式(抽取/拆分类任务不需要),低温度,强制 JSON
export async function callJSON<T>(system: string, user: string, maxTokens = 4000): Promise<T> {
  const params = {
    model: reportModel(),
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user' as const, content: user },
    ],
    response_format: { type: 'json_object' as const },
    temperature: 0.1,
    max_tokens: maxTokens,
    enable_thinking: false, // DashScope 扩展参数
  };
  const res = await client().chat.completions.create(params as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, {
    timeout: 120000,
  });
  const parsed = parseJson<T>(res.choices?.[0]?.message?.content ?? '');
  if (!parsed) throw new Error('模型未返回合法 JSON');
  return parsed;
}
