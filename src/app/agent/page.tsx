'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Select, Tag, Button, Input, Empty, Alert } from 'antd';
import { RobotOutlined, ReadOutlined, BulbOutlined, SearchOutlined } from '@ant-design/icons';
import { MAJORS } from '@/lib/diagnosis';
import { LATEST_RESULT_TASK, majorResult, VERDICT_TEXT } from '@/lib/eval-tasks';
import { AdvisorChat, type AskPayload } from '@/components/advisor/AdvisorChat';
import type { KbDoc, KbResult } from '@/lib/knowledge';

// 专业建设智能体:
//   读库 —— 选中专业后,回答时读取该专业最近一次评价的环节得分与问题清单,结合区域重点产业给建议
//   推送 —— 右侧按专业推送专业建设知识库(平方高教知识库)里的政策与案例,一键让智能体解读
const ALL = '全部专业';
const VERDICT_COLOR = { GO: 'green', RISK: 'gold', NO: 'red' } as const;

export default function AgentPage() {
  return (
    <Suspense fallback={null}>
      <AgentContent />
    </Suspense>
  );
}

function AgentContent() {
  const params = useSearchParams();
  const [major, setMajor] = useState(params.get('major') ?? ALL);
  // 从知识库页带着文件跳过来时,直接发起解读
  const [pending, setPending] = useState<AskPayload | null>(() => {
    const title = params.get('title');
    if (!title) return null;
    return { text: `请解读《${title}》,对我校专业建设有什么启示?`, doc: { title, summary: params.get('summary') ?? '', sample: (params.get('doc') ?? '').startsWith('S') } };
  });
  const focus = major === ALL ? undefined : major;
  const result = focus ? majorResult(LATEST_RESULT_TASK.id, focus) : null;

  const questions = focus
    ? [`「${focus}」最该优先解决的问题是什么?`, `「${focus}」和本地区重点产业的对接还差在哪?`, `「${focus}」下一轮评价前,哪些整改最容易见效?`, `有哪些政策可以支撑「${focus}」的建设?`]
    : undefined;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-sm shrink-0">
            <RobotOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">专业建设智能体</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">读取各专业的评价结果与区域产业数据给出建设建议,并从专业建设知识库推送政策与案例、逐篇解读</p>
          </div>
        </div>
        <Select
          value={major}
          onChange={setMajor}
          showSearch
          style={{ width: 240 }}
          options={[{ value: ALL, label: ALL }, ...MAJORS.map((m) => ({ value: m.name, label: m.name }))]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        <div data-spec="agent-chat" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 h-[640px] flex flex-col">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="font-bold text-slate-800">{focus ?? '全部专业'}</span>
            {result && (
              <>
                <Tag color={VERDICT_COLOR[result.verdict]}>{VERDICT_TEXT[result.verdict]}</Tag>
                <span className="text-xs text-slate-500">
                  {LATEST_RESULT_TASK.name} · 综合 {result.overall} · 一致性 {result.consistency} · 有效性 {result.effectiveness}
                </span>
              </>
            )}
          </div>
          <div className="flex-1 min-h-0">
            <AdvisorChat
              key={major}
              major={focus}
              questions={questions}
              intro={
                focus ? (
                  <>
                    已读取「<b>{focus}</b>」最近一次的评价结果、各环节得分和问题清单,并结合本地区重点产业回答。可以直接提问,或点下面的问题:
                  </>
                ) : undefined
              }
              initialQuestion={pending}
              onAsked={() => setPending(null)}
            />
          </div>
        </div>
        <KnowledgePush major={focus} onInterpret={(doc) => setPending({ text: `请解读《${doc.title}》,对${focus ? `「${focus}」` : '我校专业'}建设有什么启示?`, doc: { title: doc.title, summary: doc.summary, sample: doc.id.startsWith('S') } })} />
      </div>
    </div>
  );
}

// 知识库推送:按专业名检索;未接入高教知识库时显示示例条目
function KnowledgePush({ major, onInterpret }: { major?: string; onInterpret: (d: KbDoc) => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<KbResult | null>(null);
  const query = q || (major ? `${major} 专业建设` : '专业建设');
  useEffect(() => {
    let alive = true;
    fetch(`/api/knowledge?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => alive && setRes(d))
      .catch(() => alive && setRes({ source: 'sample', docs: [] }));
    return () => {
      alive = false;
    };
  }, [query]);

  return (
    <div data-spec="agent-kb" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 h-[640px] flex flex-col">
      <div className="flex items-center gap-2 font-bold text-slate-800">
        <ReadOutlined className="text-cyan-600" /> 知识库推送
        <span className="text-xs font-normal text-slate-400">平方高教知识库 · 政策与案例</span>
      </div>
      <Input.Search className="mt-3" placeholder="搜政策、案例,如:一流专业 产教融合" allowClear enterButton={<SearchOutlined />} onSearch={(v) => setQ(v.trim())} />
      {res?.source === 'sample' && <Alert className="mt-3" type="warning" showIcon title={res.note ?? '高教知识库待技术接入,以下为示例条目'} />}
      <div className="flex-1 overflow-y-auto mt-3 space-y-2.5 pr-1">
        {res?.docs.map((d) => (
          <div key={d.id} className="rounded-xl border border-slate-200 p-3 hover:border-cyan-300">
            <div className="text-sm font-semibold text-slate-800 leading-snug">{d.title}</div>
            <div className="text-xs text-slate-400 mt-1">
              {d.scene} · {d.date}
            </div>
            <p className="text-xs text-slate-600 mt-1.5 mb-2 leading-relaxed">{d.summary}</p>
            <Button size="small" icon={<BulbOutlined />} onClick={() => onInterpret(d)}>
              让智能体解读
            </Button>
          </div>
        ))}
        {res && !res.docs.length && <Empty description="没有找到相关条目" />}
        {!res && <div className="text-sm text-slate-400">加载中…</div>}
      </div>
    </div>
  );
}
