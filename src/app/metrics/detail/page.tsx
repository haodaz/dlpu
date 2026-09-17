'use client';
import React, { Suspense } from 'react';
import { Tag, Select, Divider } from 'antd';
import {
  ProfileOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  TrophyOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  CheckCircleOutlined,
  EditOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { indicators, dimensions, getIndicatorById } from '@/lib/indicators';

function DetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || indicators[0].id;

  const current = getIndicatorById(id) || indicators[0];
  const currentIndex = indicators.findIndex((i) => i.id === current.id);
  const prev = currentIndex > 0 ? indicators[currentIndex - 1] : null;
  const next = currentIndex < indicators.length - 1 ? indicators[currentIndex + 1] : null;

  const dim = dimensions.find((d) => d.key === current.dimension)!;
  const scoringColor =
    current.scoringMethod === '定量评分' ? '#059669' : current.scoringMethod === '定性评价' ? '#d97706' : '#1677ff';

  const goFiling = () => router.push(`/data-management/ai-prefill?indicator=${current.id}`);
  const goBack = () => router.push('/metrics');

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部：指标基本信息 ===== */}
      <div className="px-8 py-8 shrink-0 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-sm"
            style={{ backgroundColor: dim.color }}
          >
            <ProfileOutlined />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <span
                className="font-mono font-bold text-sm px-2 py-0.5 rounded"
                style={{ backgroundColor: dim.bg, color: dim.color, border: `1px solid ${dim.border}` }}
              >
                {current.id}
              </span>
              <h1 className="text-2xl font-bold text-slate-800 m-0">{current.name}</h1>
              {current.tag && (
                <Tag color="blue" className="m-0 font-bold">
                  {current.tag}
                </Tag>
              )}
            </div>
            <p className="text-sm text-slate-500 m-0">{current.oneLineSummary}</p>
          </div>
        </div>

        {/* 基本信息卡 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-slate-100">
            <InfoCell label="指标分类" value={`${dim.key} · ${dim.name}`} color={dim.color} />
            <InfoCell label="二级分类" value={current.subCategoryName} color={dim.color} />
            <InfoCell label="指标层级" value={current.hierarchy} />
            <InfoCell label="权重" value={`${current.weight}%`} highlight />
            <InfoCell label="评分方式" value={current.scoringMethod} color={scoringColor} />
          </div>
        </div>

        {/* 指标切换器 */}
        <div className="flex items-center gap-3 mt-4">
          <span className="text-sm text-slate-400 whitespace-nowrap">切换指标：</span>
          <Select
            value={current.id}
            onChange={(v) => router.push(`/metrics/detail?id=${v}`)}
            className="flex-1 max-w-md"
            showSearch
            optionFilterProp="label"
            options={indicators.map((i) => ({
              value: i.id,
              label: `${i.id} ${i.name}`,
            }))}
          />
        </div>
      </div>

      {/* ===== 中部：指标标准说明 ===== */}
      <div className="px-8 shrink-0 max-w-5xl mx-auto w-full pb-8">
        {/* 指标定义与说明 */}
        <Section
          icon={<BookOutlined className="text-blue-500" />}
          title="指标定义与说明"
          desc="这个指标是什么、为什么设"
        >
          <p className="text-sm text-slate-700 leading-relaxed m-0">{current.definition}</p>
        </Section>

        {/* 评分标准 / 达标要求 */}
        <Section
          icon={<TrophyOutlined className="text-amber-500" />}
          title="评分标准 / 达标要求"
          desc="具体怎么打分，达标线是什么"
        >
          <p className="text-sm text-slate-600 leading-relaxed m-0 mb-4">{current.scoringCriteria}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {current.scoringTiers.map((t) => {
              const tierColor = t.tier === '合格' ? '#059669' : t.tier === '良好' ? '#1677ff' : '#d97706';
              const tierBg = t.tier === '合格' ? '#ecfdf5' : t.tier === '良好' ? '#eff6ff' : '#fffbeb';
              const tierBorder = t.tier === '合格' ? '#a7f3d0' : t.tier === '良好' ? '#bfdbfe' : '#fde68a';
              return (
                <div
                  key={t.tier}
                  className="rounded-lg p-4 border"
                  style={{ backgroundColor: tierBg, borderColor: tierBorder }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: tierColor }}
                    >
                      {t.tier === '合格' ? 'C' : t.tier === '良好' ? 'B' : 'A'}
                    </span>
                    <span className="font-bold text-sm" style={{ color: tierColor }}>
                      {t.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed m-0">{t.criteria}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {/* 所需材料 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section
            icon={<DatabaseOutlined className="text-cyan-500" />}
            title="所需材料"
            desc="要交什么、交几份"
          >
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {current.materialTypes.map((mt) => (
                <Tag key={mt} color="blue" className="m-0">
                  {mt}
                </Tag>
              ))}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed m-0">{current.materialRequirements}</p>
          </Section>

          <Section
            icon={<FileTextOutlined className="text-purple-500" />}
            title="材料格式要求"
            desc="文档/图片/视频/链接"
          >
            <p className="text-sm text-slate-700 leading-relaxed m-0">{current.materialFormat}</p>
          </Section>
        </div>

        {/* 外部数据 + 数据来源 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Section
            icon={<GlobalOutlined className={current.needsExternalData ? 'text-amber-500' : 'text-slate-300'} />}
            title="是否需外部数据"
            desc="需要的话，可引用哪些数据源"
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{
                  color: current.needsExternalData ? '#d97706' : '#64748b',
                  backgroundColor: current.needsExternalData ? '#fffbeb' : '#f8fafc',
                }}
              >
                {current.needsExternalData ? '需要外部数据' : '不需要外部数据'}
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed m-0">{current.externalDataSources}</p>
          </Section>

          <Section
            icon={<DatabaseOutlined className="text-green-500" />}
            title="数据来源说明"
            desc="数据从哪来、怎么采集"
          >
            <p className="text-sm text-slate-700 leading-relaxed m-0">{current.dataSourceExplanation}</p>
          </Section>
        </div>

        {/* ===== 填报指引区 ===== */}
        <Divider className="my-6" />

        <Section
          icon={<EditOutlined className="text-blue-500" />}
          title="填报指引"
          desc="怎么填、注意什么"
        >
          <p className="text-sm text-slate-700 leading-relaxed m-0 mb-5 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
            {current.filingInstructions}
          </p>

          {/* 常见问题 */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <QuestionCircleOutlined className="text-slate-400" />
              <span className="text-sm font-bold text-slate-600">常见问题</span>
            </div>
            <div className="space-y-2">
              {current.commonQuestions.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold text-sm shrink-0">Q{idx + 1}.</span>
                    <div>
                      <p className="text-sm font-bold text-slate-700 m-0 mb-1">{faq.q}</p>
                      <p className="text-sm text-slate-500 m-0">{faq.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 填写示例 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircleOutlined className="text-green-500" />
              <span className="text-sm font-bold text-slate-600">填写示例</span>
            </div>
            <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
              <p className="text-sm text-slate-700 leading-relaxed m-0">{current.example}</p>
            </div>
          </div>
        </Section>
      </div>

      {/* ===== 底部操作栏 ===== */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 px-8 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          {/* 上一项/下一项 */}
          <div className="flex items-center gap-2">
            {prev ? (
              <button
                onClick={() => router.push(`/metrics/detail?id=${prev.id}`)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-50"
              >
                <ArrowLeftOutlined /> {prev.id} {prev.name}
              </button>
            ) : (
              <span className="text-xs text-slate-300 px-2">已是第一项</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={goBack}
              className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeftOutlined /> 返回总览
            </button>
            <button
              onClick={goFiling}
              className="flex items-center gap-1 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2 rounded-lg shadow-sm"
            >
              去填报 <RightOutlined />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {next ? (
              <button
                onClick={() => router.push(`/metrics/detail?id=${next.id}`)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded hover:bg-slate-50"
              >
                {next.id} {next.name} <ArrowRightOutlined />
              </button>
            ) : (
              <span className="text-xs text-slate-300 px-2">已是最后一项</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MetricsDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50">
          <div className="text-slate-400">加载中…</div>
        </div>
      }
    >
      <DetailContent />
    </Suspense>
  );
}

// ---------- 子组件：信息单元格 ----------
function InfoCell({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className="p-4 text-center">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div
        className={`text-sm font-bold ${highlight ? 'text-lg text-blue-600' : 'text-slate-700'}`}
        style={color ? { color } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

// ---------- 子组件：区块 ----------
function Section({
  icon,
  title,
  desc,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <span className="text-lg">{icon}</span>
        <div>
          <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">{title}</h3>
          <p className="text-xs text-slate-400 m-0 mt-0.5">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
