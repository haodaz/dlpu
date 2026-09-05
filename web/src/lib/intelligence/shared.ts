/**
 * lib/intelligence/shared.ts
 *
 * 所有 Pipeline 共享的工具函数：AI 客户端、JSON 解析、SSE 发送等。
 */

import OpenAI from 'openai';

// ── AI 客户端 ──────────────────────────────────────────

export function getAIClient(): OpenAI {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY 未配置');
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });
}

export function getAIModel(): string {
  return process.env.DASHSCOPE_MODEL || 'qwen-plus';
}

export function getMCPToken(): string {
  return process.env.VISIONSQUARE_AUTH_BEARER || '';
}

// ── JSON 安全解析 ──────────────────────────────────────

export function safeParseJson(raw: string): any {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return {};
    return JSON.parse(raw.substring(start, end + 1));
  } catch { return {}; }
}

// ── SSE 发送辅助 ──────────────────────────────────────

export type SendFn = (data: any) => void;

export function createSSEStream(handler: (send: SendFn) => Promise<void>): ReadableStream {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send: SendFn = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller closed
        }
      };
      try {
        await handler(send);
      } catch (e: any) {
        send({ type: 'error', message: e.message || '未知错误' });
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// ── Agent 状态事件快捷函数 ─────────────────────────────

export function agentWorking(send: SendFn, name: string, icon: string) {
  send({ type: 'agent', data: { name, status: 'working', icon } });
}

export function agentDone(send: SendFn, name: string, icon: string) {
  send({ type: 'agent', data: { name, status: 'done', icon } });
}

export function agentError(send: SendFn, name: string, icon: string) {
  send({ type: 'agent', data: { name, status: 'error', icon } });
}

export function log(send: SendFn, message: string) {
  send({ type: 'log', message });
}

// ── AI 调用封装（带 JSON 格式化）──────────────────────

export async function callAIForJSON(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<any> {
  const client = getAIClient();
  const res = await client.chat.completions.create({
    model: getAIModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: options?.temperature ?? 0.5,
    max_tokens: options?.maxTokens ?? 8000,
  });
  return safeParseJson(res.choices?.[0]?.message?.content || '{}');
}
