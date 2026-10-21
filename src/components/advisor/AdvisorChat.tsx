'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Input } from 'antd';
import { RobotOutlined, SendOutlined, LoadingOutlined } from '@ant-design/icons';

// 专业建设专家 AI:结合区域产业分析与各专业评价结果回答专业布局问题(/api/advisor)
// 宏观决策页「聊一聊」与后续的专业建设智能体共用
export interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export const ADVISOR_QUESTIONS = [
  '结合区域重点产业,哪些专业值得加大投入?',
  '「风险关注」的专业,下一步该怎么论证调整方向?',
  '我校专业布局和本地区重点产业的匹配情况怎么样?',
  '有没有本地区重点发展、但我校还没有对应专业的产业?',
];

// 轻量渲染:**加粗**、分行、列表
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, k) => (p.startsWith('**') && p.endsWith('**') ? <b key={k}>{p.slice(2, -2)}</b> : <React.Fragment key={k}>{p}</React.Fragment>));
        if (!line.trim()) return <div key={i} className="h-2" />;
        const list = /^\s*([-*•]|\d+[.、])\s+/.test(line);
        return (
          <div key={i} className={list ? 'pl-3' : ''}>
            {parts}
          </div>
        );
      })}
    </>
  );
}

export function AdvisorChat({ initialQuestion, onAsked }: { initialQuestion?: string | null; onAsked?: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || busy) return;
    const next: ChatMsg[] = [...msgs, { role: 'user', content: text }];
    setMsgs(next);
    setDraft('');
    setBusy(true);
    try {
      const r = await fetch('/api/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: next }) }).then((x) => x.json());
      setMsgs([...next, { role: 'assistant', content: r.success ? r.reply : `抱歉,暂时无法回答:${r.error ?? '服务异常'}` }]);
    } catch {
      setMsgs([...next, { role: 'assistant', content: '网络异常,请稍后再试。' }]);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialQuestion) {
      onAsked?.();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void ask(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);
  useEffect(() => {
    // 新版浏览器的 scrollIntoView 会返回 Promise,不能作为 effect 的返回值
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [msgs, busy]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {!msgs.length && (
          <div className="text-sm text-slate-500 leading-relaxed">
            我会结合<b>本地区的重点产业</b>和<b>各专业最近一次的评价结果</b>,给出专业布局方面的建议。你可以直接提问,或点下面的问题:
            <div className="mt-3 flex flex-col gap-2">
              {ADVISOR_QUESTIONS.map((q) => (
                <button key={q} onClick={() => ask(q)} className="text-left text-sm rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-indigo-700 hover:border-indigo-300">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-indigo-600 text-white px-4 py-2.5 text-sm">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="flex gap-2.5">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <RobotOutlined />
              </span>
              <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                <Rich text={m.content} />
              </div>
            </div>
          ),
        )}
        {busy && (
          <div className="flex gap-2.5 items-center text-sm text-slate-400">
            <LoadingOutlined /> 正在结合区域产业与评价结果分析…
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="pt-3 border-t border-slate-100 mt-3 flex gap-2">
        <Input.TextArea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="问问专业布局、调整方向、与区域产业的匹配…"
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              void ask(draft);
            }
          }}
        />
        <Button type="primary" icon={<SendOutlined />} loading={busy} onClick={() => ask(draft)}>
          发送
        </Button>
      </div>
      <div className="text-[11px] text-slate-400 mt-2">AI 只依据平台中的区域产业数据与评价结果作答,涉及招生调整等建议仅供论证参考。</div>
    </div>
  );
}

export function AdvisorDrawer({ open, question, onClose }: { open: boolean; question: string | null; onClose: () => void }) {
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setPending(question);
  }, [open, question]);
  return (
    <Drawer
      title={
        <span className="flex items-center gap-2">
          <RobotOutlined className="text-indigo-600" /> 专业建设专家 AI
        </span>
      }
      open={open}
      onClose={onClose}
      size={520}
      styles={{ body: { display: 'flex', flexDirection: 'column' } }}
    >
      <AdvisorChat initialQuestion={pending} onAsked={() => setPending(null)} />
    </Drawer>
  );
}
