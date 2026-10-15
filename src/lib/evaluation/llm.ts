import OpenAI from 'openai';

/**
 * LLM 配置 — 根据当前环境变量自动选择 API 提供商与默认模型
 * 支持：DeepSeek / 阿里云 DashScope / OpenAI
 */

export type LLMProvider = 'deepseek' | 'dashscope' | 'openai';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL: string;
  model: string;
}

const PROVIDER_INFO: Record<LLMProvider, { baseURL: string; defaultModel: string; envKey: string }> = {
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    envKey: 'DEEPSEEK_API_KEY',
  },
  dashscope: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    envKey: 'DASHSCOPE_API_KEY',
  },
  openai: {
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    envKey: 'OPENAI_API_KEY',
  },
};

/** 检测当前使用的 LLM 提供商（按 dashscope → deepseek → openai 优先级；默认统一走阿里云） */
export function detectProvider(): LLMProvider {
  if (process.env.DASHSCOPE_API_KEY) return 'dashscope';
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'openai'; // 兜底
}

/** 获取当前 LLM 完整配置 */
export function getLLMConfig(): LLMConfig {
  const provider = detectProvider();
  const info = PROVIDER_INFO[provider];
  const apiKey = process.env[info.envKey] || '';
  // 允许通过 LLM_MODEL(或阿里云的 DASHSCOPE_MODEL)覆盖模型名
  const model =
    process.env.LLM_MODEL || (provider === 'dashscope' ? process.env.DASHSCOPE_MODEL : undefined) || info.defaultModel;
  return { provider, apiKey, baseURL: info.baseURL, model };
}

/** 是否有可用的 API Key */
export function hasLLMKey(): boolean {
  return !!(process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY);
}

/** 创建 OpenAI 客户端（兼容多家 API）
 * 阿里云 qwen3.x 默认开启原生思考,评价引擎的结构化输出不需要,统一在这里关掉(调用方显式传了则以调用方为准) */
export function createLLMClient(): OpenAI {
  const { apiKey, baseURL, provider } = getLLMConfig();
  const client = new OpenAI({ apiKey, baseURL });
  if (provider === 'dashscope') {
    const create = client.chat.completions.create.bind(client.chat.completions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client.chat.completions as any).create = (body: any, options?: any) => create({ enable_thinking: false, ...body }, options);
  }
  return client;
}
