'use client';
import React, { Suspense } from 'react';
import { Button, Collapse, Select } from 'antd';
import { ArrowLeftOutlined, CheckCircleFilled, MinusCircleFilled, FileSearchOutlined, AimOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { indicators, dimensions, getIndicatorById } from '@/lib/indicators';
import { MOCK_REPORT } from '@/lib/mock-evaluation-report';
import { CORE_METRICS, coreResult, scoreOf, sourceOf, sortedIssues, DEMO_MAJOR } from '@/lib/diagnosis';
import SourceTag from '@/components/diagnosis/SourceTag';

// 指标分析逻辑(管理员从诊断结论下钻的最后一层)
// 回答「为什么是这个结论」:得分 → 评分理由 → 扣分点 → 证据链;
// 指标定义、评分标准、填报指引属于填报侧内容,默认收起
export default function IndicatorAnalysisPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}

function Content() {
  const router = useRouter();
  const id = useSearchParams().get('id') || indicators[0].id;
  const ind = getIndicatorById(id) ?? indicators[0];
  const dim = dimensions.find((d) => d.key === ind.dimension)!;
  const detail = MOCK_REPORT.indicators?.find((i) => i.id === ind.id);
  const score = scoreOf(ind.id);

  // 它支撑哪个核心指标的哪个环节
  const core = CORE_METRICS.find((m) => m.links.some((l) => l.indicatorIds.includes(ind.id)))!;
  const link = core.links.find((l) => l.indicatorIds.includes(ind.id))!;
  const linkResult = coreResult(core.key).links.find((l) => l.name === link.name)!;
  const issue = sortedIssues.find((i) => i.indicatorId === ind.id);

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          返回
        </Button>
        <span className="text-sm text-slate-500">指标层 · 这个结论背后的分析逻辑</span>
        <Select
          className="ml-auto w-72"
          value={ind.id}
          showSearch
          optionFilterProp="label"
          onChange={(v) => router.replace(`/admin/indicator-analysis?id=${v}`)}
          options={indicators.map((i) => ({ value: i.id, label: `${i.id} ${i.name}` }))}
        />
      </div>

      {/* 结论 */}
      <div data-spec="indicator-analysis" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm px-2 py-0.5 rounded" style={{ color: dim.color, backgroundColor: dim.bg }}>
                {ind.id}
              </span>
              <h1 className="text-xl font-bold text-slate-800 m-0">{ind.name}</h1>
              <SourceTag source={sourceOf(ind.id)} full />
            </div>
            <div className="text-sm text-slate-500">
              {DEMO_MAJOR.name} · 权重 {ind.weight}% · 支撑「{core.name} → {link.name}」(该环节 {linkResult.score} 分,{linkResult.ok ? '达标' : '是断点'})
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-black ${score >= 85 ? 'text-emerald-600' : 'text-red-600'}`}>{score}</div>
            <div className="text-xs text-slate-400 mt-1">{detail?.grade ?? '材料未提交'}</div>
          </div>
        </div>
        {detail?.intro && <p className="text-sm text-slate-600 leading-relaxed mt-4 mb-0">{detail.intro}</p>}
      </div>

      {detail ? (
        <>
          {detail.metrics && detail.metrics.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {detail.metrics.map((m) => (
                <div key={m.label} className="rounded-xl bg-white border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">{m.label}</div>
                  <div className="text-2xl font-black text-slate-800 mt-1">{m.value}</div>
                  {m.threshold && <div className="text-xs text-slate-400 mt-0.5">{m.threshold}</div>}
                </div>
              ))}
            </div>
          )}
          <Block title="评分理由" icon={<CheckCircleFilled className="text-emerald-500" />} items={detail.rationale} />
          <Block title="扣分点" icon={<MinusCircleFilled className="text-red-500" />} items={detail.deductions} />
          <Block title="证据链" icon={<FileSearchOutlined className="text-sky-500" />} items={detail.evidence} />
        </>
      ) : (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-sm text-amber-800">
          本指标的核心材料尚未提交,无法形成评分理由与证据链,按 {score} 分计入;已作为问题推送给负责教师。
        </div>
      )}

      {issue && (
        <div className="rounded-2xl bg-white border border-red-200 p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-red-600 mb-1">
            <AimOutlined /> 由此产生的整改问题
          </div>
          <div className="font-bold text-slate-800">{issue.title}</div>
          <div className="text-sm text-slate-600 mt-1">{issue.action}</div>
          <div className="text-xs text-slate-400 mt-1">
            {issue.level === 'TEACHER' ? '教师层面' : '管理层面'} · {issue.owner} · {issue.due} 前
          </div>
        </div>
      )}

      <Collapse
        className="bg-white"
        items={[
          {
            key: 'std',
            label: <span className="text-slate-600">指标定义、评分标准与填报说明(填报侧内容)</span>,
            children: (
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                <p className="m-0">{ind.definition}</p>
                <div>
                  <b className="text-slate-700">评分标准:</b>
                  {ind.scoringCriteria}
                </div>
                <ul className="m-0 pl-5">
                  {ind.scoringTiers.map((t) => (
                    <li key={t.tier}>
                      <b>{t.tier}</b>:{t.criteria}
                    </li>
                  ))}
                </ul>
                <div>
                  <b className="text-slate-700">所需材料:</b>
                  {ind.materialRequirements}
                </div>
                <Button size="small" onClick={() => router.push(`/metrics/detail?id=${ind.id}`)}>
                  查看完整填报说明
                </Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

function Block({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
      <div className="flex items-center gap-2 font-bold text-slate-800 mb-3">
        {icon}
        {title}
      </div>
      <ul className="m-0 pl-0 list-none space-y-2">
        {items.map((t, i) => (
          <li key={i} className="text-sm text-slate-700 leading-relaxed pl-3 border-l-2 border-slate-100">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
