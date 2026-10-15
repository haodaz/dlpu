import React from 'react';
import { sourceMeta, type SourceType } from '@/lib/diagnosis';

// 数据来源标识:AI 自动采集 / 学校系统导入 / 教师填报
export default function SourceTag({ source, full = false }: { source: SourceType; full?: boolean }) {
  const m = sourceMeta[source];
  return (
    <span
      className="inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded shrink-0"
      style={{ color: m.color, backgroundColor: m.bg, border: `1px solid ${m.color}33` }}
      title={m.label}
    >
      {full ? m.label : m.short}
    </span>
  );
}
