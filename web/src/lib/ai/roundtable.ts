import { Message, ChatOptions } from './types';
import { characterManager } from './characters';
import { buildSystemPrompt } from './prompts';
import { chatCompletion } from './chat';
import { storage } from '@/lib/storage';

// ── 回复风格映射 ──────────────────────────────────────────────────────────────
const REPLY_STYLE_MAP: Record<string, { instruction: string; maxTokens: number }> = {
  short:    { instruction: '【回答风格：简洁】控制在 200 字以内，直接表达核心观点。', maxTokens: 2048 },
  medium:   { instruction: '【回答风格：适中】控制在 500 字左右，内容实质但不冗长。', maxTokens: 4096 },
  detailed: { instruction: '【回答风格：详尽】可展开到 1000 字，深入分析，可用表格、分级标题、案例等。', maxTokens: 8192 },
};

type AiMsg = { role: 'ai'; content: string; charId: string; charName: string };

/**
 * 为单个角色生成圆桌回复。
 *
 * @param isFirst  是否是本轮第一个发言的角色。
 *                 第一个角色不需要回应其他嘉宾（没有其他嘉宾）。
 *                 第二个及之后的角色：在用户消息里附上已发言内容，
 *                 并要求开篇用 2-3 句话简短回应，再展开自己的分析。
 */
async function generateCharResponse(
  charId: string,
  history: any[],
  userMessage: string,
  replyStyle: { instruction: string; maxTokens: number },
  options: ChatOptions,
  token?: string,
  isFirst = false,
): Promise<AiMsg | null> {
  const char = await characterManager.getCharacter(charId);
  if (!char) return null;

  const systemPrompt = await buildSystemPrompt(char, { skipReportSOP: true, disableHandoff: true });

  // 找到当前轮次起始位置（history 中最后一条 user 消息）
  let currentTurnStart = history.length;
  for (let i = history.length - 1; i >= 0; i--) {
    if ((history[i] as any).role === 'user') { currentTurnStart = i; break; }
  }

  // 历史轮次（当前轮之前）— 保留 user/assistant 对，让当前角色有跨轮记忆
  const pastTurnMessages: Message[] = [];
  for (const m of history.slice(0, currentTurnStart) as any[]) {
    if (m.role === 'user') {
      pastTurnMessages.push({ role: 'user', content: m.content });
    } else if (m.role === 'ai') {
      if (m.charId === charId) {
        pastTurnMessages.push({ role: 'assistant', content: m.content });
      } else {
        pastTurnMessages.push({ role: 'user', content: `[嘉宾 ${m.charName || '其他嘉宾'}]：${m.content}` });
      }
    }
  }

  // 当前轮次消息
  const currentTurnMsgs = history.slice(currentTurnStart) as any[];
  const currentQuestion = currentTurnMsgs.find(m => m.role === 'user')?.content || userMessage;
  const alreadySpoken = currentTurnMsgs.filter(m => m.role === 'ai' && m.charId !== charId);

  // 构造当前轮的用户消息
  // - 第一个发言者：直接回答问题
  // - 后续发言者：附上已发言内容，要求开篇 2-3 句简评，再展开自己的分析
  let currentUserMsg: string;
  if (!isFirst && alreadySpoken.length > 0) {
    const transcript = alreadySpoken
      .map((m: any) => `【${m.charName || '嘉宾'} 的发言】\n${m.content}`)
      .join('\n\n---\n\n');
    currentUserMsg =
      `${currentQuestion}\n\n` +
      `━━ 本轮其他嘉宾的观点（供参考）━━\n\n${transcript}\n\n` +
      `━━ 现在请你发言 ━━\n` +
      `请在开篇用 2-3 句话点评上面嘉宾的观点（赞同/补充/提出不同看法均可），` +
      `之后直接展开你自己的完整分析，体现你独特的专业视角。`;
  } else {
    currentUserMsg = currentQuestion;
  }

  const roundtableSystemNote =
    `\n\n【圆桌讨论规则（最高优先级）】\n` +
    `你正在参与一场多嘉宾圆桌讨论。\n\n规则：\n` +
    `1. ${replyStyle.instruction}\n` +
    `2. 如果用户要求表格，必须用 Markdown 表格格式（| 列1 | 列2 |）输出，不能用项目列表替代。\n` +
    `3. 直接在正文里输出完整分析，不要把内容包裹在任何 XML 标签（如 zj_report 等）里。\n` +
    `4. 不要说"基于我之前的分析"（那是其他嘉宾说的，不是你说的）。`;

  const messages: Message[] = [
    { role: 'system', content: systemPrompt + roundtableSystemNote },
    ...pastTurnMessages,
    { role: 'user', content: currentUserMsg },
  ];

  const roundtableOptions = { ...options, max_tokens: options.max_tokens || replyStyle.maxTokens };
  const response = await chatCompletion(messages, roundtableOptions);
  const rawContent = response.message.content;

  // 清理 XML 工具标签
  const aiContent = rawContent
    .replace(/<zj_report[^>]*>([\s\S]*?)<\/zj_report>/gi, (_: string, inner: string) => inner.trim())
    .replace(/<student_profile[^>]*>[\s\S]*?<\/student_profile[^>]*>/gi, '')
    .replace(/<student_profile[^>]*\/>/gi, '')
    .replace(/<student_profile[^>]*>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { role: 'ai', content: aiContent, charId, charName: char.name };
}

// ── 主入口 ────────────────────────────────────────────────────────────────────
export async function* runRoundtableSession(
  roomId: string,
  userMessage: string,
  options: ChatOptions = {},
  token?: string,
) {
  const room = await storage.getRoundtableById(roomId, token);
  if (!room) throw new Error('Room not found');

  // 1. 保存用户消息
  const userMsg = { role: 'user', content: userMessage, charName: 'User' };
  await storage.pushRoundtableMessage(roomId, userMsg, token);
  yield { type: 'user_message', data: userMsg };

  const characters = room.characters || [];
  const speakingOrder = room.speakingOrder || characters;
  const replyLength = room.replyLength || 'medium';
  const replyStyle = REPLY_STYLE_MAP[replyLength] ?? REPLY_STYLE_MAP.medium;

  // 2. 解析 @点名（只让被点到的 AI 回复）
  const mentionMatches = [...userMessage.matchAll(/@([^\s@，。！？,.!?《》【】、]+)/g)];
  const mentionedNames = mentionMatches.map(m => m[1].trim());
  let respondingCharIds: string[] = speakingOrder;
  if (mentionedNames.length > 0) {
    const allChars = await Promise.all(speakingOrder.map(id => characterManager.getCharacter(id)));
    const filtered = speakingOrder.filter((_, idx) => {
      const char = allChars[idx];
      if (!char) return false;
      return mentionedNames.some(n =>
        char.name.includes(n) || n.includes(char.name.replace(/【.*?】/g, '').trim())
      );
    });
    if (filtered.length > 0) respondingCharIds = filtered;
  }

  if (respondingCharIds.length === 0) {
    yield { type: 'done', data: {} };
    return;
  }

  // ── 执行策略 ──────────────────────────────────────────────────────────────
  //
  // 第 1 个 AI：顺序执行，它的回答作为后续嘉宾回应的参考。
  // 第 2+ 个 AI：在第 1 个完成后并行执行，都能看到第 1 个 AI 的回答。
  //             每人只需在开篇用 2-3 句话回应，之后展开各自的独立分析。
  //             这样总耗时 ≈ T(AI1) + max(T(AI2), T(AI3), ...) 而非累加。
  //
  const [firstCharId, ...restCharIds] = respondingCharIds;

  // ── 第 1 个 AI（顺序）────────────────────────────────────────────────────
  {
    const firstChar = await characterManager.getCharacter(firstCharId);
    if (firstChar) {
      yield { type: 'ai_start', data: { charId: firstCharId, charName: firstChar.name } };
      try {
        const snap = await storage.getRoundtableById(roomId, token);
        const history = snap?.messages || [];
        const result = await generateCharResponse(
          firstCharId, history, userMessage, replyStyle, options, token, true
        );
        if (result) {
          await storage.pushRoundtableMessage(roomId, result, token);
          yield { type: 'ai_message', data: result };
        }
      } catch (err: any) {
        console.error(`[Roundtable] Error for first char ${firstCharId}:`, err);
        yield { type: 'error', data: { charId: firstCharId, error: err.message } };
      }
    }
  }

  // ── 第 2+ 个 AI（并行）───────────────────────────────────────────────────
  if (restCharIds.length > 0) {
    // 获取包含第 1 个 AI 回答的最新 history（所有并行 AI 共享这个快照）
    const freshSnap = await storage.getRoundtableById(roomId, token);
    const latestHistory = freshSnap?.messages || [];

    // 预加载所有剩余角色信息（并行）
    const restChars = await Promise.all(restCharIds.map(id => characterManager.getCharacter(id)));

    // 启动所有剩余 AI 的生成任务（并行执行以节省时间）
    const promises = restCharIds.map(charId =>
      generateCharResponse(charId, latestHistory, userMessage, replyStyle, options, token, false)
        .catch(err => {
          console.error(`[Roundtable] Parallel error for ${charId}:`, err);
          return null;
        })
    );

    // 依次等待结果，并逐个发送给前端（前端只支持单 activeCharId，因此需要排队显示）
    for (let i = 0; i < restCharIds.length; i++) {
      const char = restChars[i];
      if (char) yield { type: 'ai_start', data: { charId: restCharIds[i], charName: char.name } };

      const result = await promises[i];
      if (result) {
        await storage.pushRoundtableMessage(roomId, result, token);
        yield { type: 'ai_message', data: result };
      }
    }
  }

  yield { type: 'done', data: {} };
}
