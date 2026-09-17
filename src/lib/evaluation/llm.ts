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

/** 检测当前使用的 LLM 提供商（按 deepseek → dashscope → openai 优先级） */
export function detectProvider(): LLMProvider {
  if (process.env.DEEPSEEK_API_KEY) return 'deepseek';
  if (process.env.DASHSCOPE_API_KEY) return 'dashscope';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'openai'; // 兜底
}

/** 获取当前 LLM 完整配置 */
export function getLLMConfig(): LLMConfig {
  const provider = detectProvider();
  const info = PROVIDER_INFO[provider];
  const apiKey = process.env[info.envKey] || '';
  // 允许通过 LLM_MODEL 覆盖模型名
  const model = process.env.LLM_MODEL || info.defaultModel;
  return { provider, apiKey, baseURL: info.baseURL, model };
}

/** 是否有可用的 API Key */
export function hasLLMKey(): boolean {
  return !!(process.env.DEEPSEEK_API_KEY || process.env.DASHSCOPE_API_KEY || process.env.OPENAI_API_KEY);
}

/** 创建 OpenAI 客户端（兼容多家 API） */
export function createLLMClient(): OpenAI {
  const { apiKey, baseURL } = getLLMConfig();
  return new OpenAI({ apiKey, baseURL });
}
