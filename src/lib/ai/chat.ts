import { Message, ChatOptions, AIResponse } from './types';
import { executeToolCall, TOOL_DEFINITIONS } from '@/lib/tools';
import { mcpClient } from '@/lib/mcp/client';

export async function chatCompletion(
  messages: Message[],
  options: ChatOptions = {}
): Promise<AIResponse> {
  let fullText = '';
  return chatCompletionStream(messages, options, (token) => {
    fullText += token;
  });
}

function getProvider(model: string): 'claude' | 'deepseek' | 'gemini' {
  if (model.startsWith('claude')) return 'claude';
  if (model.startsWith('gemini')) return 'gemini';
  return 'deepseek';
}

async function streamAnthropic(
  messages: Message[],
  options: ChatOptions,
  onToken: (token: string) => void
): Promise<AIResponse> {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: options.max_tokens || 4096,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API Error: ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
            const text = data.delta.text;
            assistantMessage += text;
            onToken(text);
          }
        } catch (e) {
          // ignore parse error on partial chunks
        }
      }
    }
  }

  return {
    message: {
      role: 'assistant',
      content: assistantMessage,
    },
  };
}

async function streamDeepSeek(
  messages: Message[],
  options: ChatOptions,
  onToken: (token: string) => void
): Promise<AIResponse> {
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp';
  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is not configured');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: options.max_tokens || 4096,
      messages: messages
        .filter(m => m.role !== 'prefill')  // 过滤掉占位角色
        .map(m => ({
          role: m.role,
          content: m.content,
        })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API Error: ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';
  let hasStartedThinking = false;
  let hasFinishedThinking = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const delta = data.choices?.[0]?.delta;
          
          // 处理推理内容 (DeepSeek-R1 等带有 reasoning_content 的模型)
          if (delta?.reasoning_content) {
            if (!hasStartedThinking) {
              hasStartedThinking = true;
              assistantMessage += '<think>\n';
              onToken('<think>\n');
            }
            assistantMessage += delta.reasoning_content;
            onToken(delta.reasoning_content);
          }

          if (delta?.content) {
            if (hasStartedThinking && !hasFinishedThinking) {
              hasFinishedThinking = true;
              assistantMessage += '\n</think>\n\n';
              onToken('\n</think>\n\n');
            }
            assistantMessage += delta.content;
            onToken(delta.content);
          }
        } catch (e) {
          // ignore parse error on partial chunks
        }
      }
    }
  }

  return {
    message: {
      role: 'assistant',
      content: assistantMessage,
    },
  };
}

async function streamGemini(
  messages: Message[],
  options: ChatOptions,
  onToken: (token: string) => void
): Promise<AIResponse> {
  const model = options.model || 'gemini-2.0-flash';
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemMsg = messages.find(m => m.role === 'system');
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const contents: any[] = [];
  for (const msg of conversationMessages) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  const requestBody: any = {
    contents,
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
    generationConfig: {
      maxOutputTokens: options.max_tokens || 4096,
    },
  };

  if (systemMsg) {
    requestBody.systemInstruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API Error: ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            assistantMessage += text;
            onToken(text);
          }
        } catch (e) {
          // ignore parse error on partial chunks
        }
      }
    }
  }

  return {
    message: {
      role: 'assistant',
      content: assistantMessage,
    },
  };
}

export async function chatCompletionStream(
  messages: Message[],
  options: ChatOptions = {},
  onToken: (token: string) => void
): Promise<AIResponse> {
  const model = options.model || 'claude-3-5-sonnet-20241022';
  const provider = getProvider(model);

  // 1. 获取本地硬编码工具
  const localTools = TOOL_DEFINITIONS.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  // 2. 动态获取 MCP 工具
  let mcpTools: any[] = [];
  try {
    const rawMcpTools = await mcpClient.getTools();
    const toolsArr = (rawMcpTools as unknown[]) || [];
    mcpTools = toolsArr.map((t: unknown) => {
      const tool = t as Record<string, unknown>;
      return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
      };
    });
  } catch (err) {
    console.error('[Chat] Failed to load MCP tools:', err);
  }

  const combinedTools = [...localTools];
  const localNames = new Set(localTools.map(t => t.name));
  for (const mt of mcpTools) {
    if (!localNames.has(mt.name)) {
      combinedTools.push(mt);
    }
  }

  switch (provider) {
    case 'claude':
      return streamAnthropic(messages, { ...options, model }, onToken);
    case 'deepseek':
      return streamDeepSeek(messages, { ...options, model }, onToken);
    case 'gemini':
      return streamGemini(messages, { ...options, model }, onToken);
    default:
      return streamAnthropic(messages, { ...options, model }, onToken);
  }
}
