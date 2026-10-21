'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Input, Segmented, Alert, Empty, Button, Tag } from 'antd';
import { ReadOutlined, BulbOutlined } from '@ant-design/icons';
import type { KbResult } from '@/lib/knowledge';

// 专业建设知识库:院校治理工作台的高教知识库(团队标准版内容 + 专业建设专业版内容)
// 数据与一答「官方知识库 · 专家智库」同源;未接入时显示示例条目
export default function KnowledgePage() {
  const [q, setQ] = useState('');
  const [scene, setScene] = useState('全部');
  const [res, setRes] = useState<KbResult | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/knowledge?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => alive && setRes(d))
      .catch(() => alive && setRes({ source: 'sample', docs: [] }));
    return () => {
      alive = false;
    };
  }, [q]);
  const scenes = useMemo(() => ['全部', ...Array.from(new Set((res?.docs ?? []).map((d) => d.scene)))], [res]);
  const docs = (res?.docs ?? []).filter((d) => scene === '全部' || d.scene === scene);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-cyan-600 flex items-center justify-center text-white text-xl shadow-sm shrink-0">
          <ReadOutlined />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">专业建设知识库</h1>
          <p className="text-sm text-slate-500 m-0 mt-0.5">高教知识库中与专业建设相关的政策文件、评估认证与建设案例;任意一篇都可以交给专业建设智能体解读</p>
        </div>
      </div>
      {res?.source === 'sample' && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title="高教知识库待技术接入"
          description="知识库与一答「官方知识库 · 专家智库」同一份数据,取数接口相同(assist_repository_search);需要配置一答主站的访问令牌后切换为实时检索。以下为示例条目,标题取自专家智库中的真实文件。"
        />
      )}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex gap-3 flex-wrap items-center">
          <Input.Search placeholder="搜索政策、评估认证、建设案例" allowClear style={{ maxWidth: 360 }} onSearch={(v) => setQ(v.trim())} />
          <Segmented value={scene} onChange={(v) => setScene(String(v))} options={scenes} />
        </div>
        <div className="divide-y divide-slate-100 mt-4">
          {docs.map((d) => (
            <div key={d.id} className="py-4 flex gap-4 items-start">
              <div className="flex-1">
                <div className="font-semibold text-slate-800">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noreferrer">
                      {d.title}
                    </a>
                  ) : (
                    d.title
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  <Tag className="mr-2">{d.scene}</Tag>
                  {d.date}
                </div>
                <p className="text-sm text-slate-600 mt-2 mb-0 leading-relaxed">{d.summary}</p>
              </div>
              <Link href={`/agent?doc=${encodeURIComponent(d.id)}&title=${encodeURIComponent(d.title)}&summary=${encodeURIComponent(d.summary.slice(0, 200))}`}>
                <Button size="small" icon={<BulbOutlined />}>
                  去智能体解读
                </Button>
              </Link>
            </div>
          ))}
          {res && !docs.length && <Empty className="py-8" description="没有找到相关条目" />}
          {!res && <div className="py-6 text-sm text-slate-400">加载中…</div>}
        </div>
      </div>
    </div>
  );
}
