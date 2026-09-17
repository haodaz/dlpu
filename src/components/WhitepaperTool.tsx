'use client';
import React, { useMemo, useRef, useState } from 'react';
import { Button, Input, Tooltip } from 'antd';
import {
  CheckOutlined,
  CheckCircleOutlined,
  DownOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  ReloadOutlined,
  RobotOutlined,
  SearchOutlined,
  DownloadOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { indicators, type Indicator } from '@/lib/indicators';
import { WHITEPAPER_REFERENCES, type FilingStatus } from '@/lib/filing';
import {
  assembleMarkdown,
  buildNarrative,
  buildSalaryStats,
  buildSearchQueries,
  buildVerdictRows,
  extractStructured,
  runSearch,
  type ChainNode,
  type SalaryStat,
  type SearchMaterial,
  type WhitepaperModuleKey,
  type WhitepaperResult,
} from '@/lib/whitepaper';

type Stage = 1 | 2 | 3;

const MODULE_META: Record<WhitepaperModuleKey, { label: string; desc: string; color: string }> = {
  lifecycle: { label: '模块一 · 产业生命周期', desc: '增长率趋势与企业数量变化，判定成长/成熟/转型期', color: '#2563eb' },
  chain: { label: '模块二 · 产业链图谱', desc: '上游/中游/下游节点与核心企业清单，估算 CR5 集中度', color: '#7c3aed' },
  jobs: { label: '模块三 · 关键岗位清单', desc: '岗位名称、需求热度、薪资水平与能力要求', color: '#059669' },
};

// ---------- 报告版式组件 ----------

function ChapterCard({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 bg-slate-50/60">
        <span className="w-6 h-6 rounded-md bg-slate-800 text-white text-xs font-bold flex items-center justify-center">
          {num}
        </span>
        <span className="font-bold text-slate-800 text-base">{title}</span>
      </div>
      <div className="px-5 py-4 space-y-5">{children}</div>
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
        <span className="w-0.5 h-3.5 bg-slate-300 rounded" />
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Narrative({ text }: { text: string }) {
  return <p className="text-sm text-slate-700 leading-7 m-0 text-justify">{text}</p>;
}

function FigureFrame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
        {caption}
      </div>
      <div className="px-3 py-3">{children}</div>
    </div>
  );
}

function TableFrame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600">
        {caption}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function SalaryBoxPlot({ data }: { data: SalaryStat[] }) {
  const maxValue = Math.max(...data.map((d) => d.max));
  const chartHeight = 220;
  const labelWidth = 132;
  const chartWidth = 420;
  const rowGap = 30;
  const totalHeight = data.length * rowGap + 34;

  return (
    <svg width="100%" height={totalHeight} viewBox={`0 0 ${labelWidth + chartWidth + 40} ${totalHeight}`} role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={labelWidth}
          x2={labelWidth + chartWidth}
          y1={chartHeight * t + 12}
          y2={chartHeight * t + 12}
          stroke="#eef2f7"
        />
      ))}
      {[0, 0.5, 1].map((t) => (
        <text
          key={t}
          x={labelWidth + chartWidth + 6}
          y={chartHeight * t + 16}
          fontSize={10}
          fill="#94a3b8"
        >
          {Math.round(maxValue * (1 - t))}
        </text>
      ))}
      {data.map((d, i) => {
        const top = i * rowGap + 12;
        const cx = labelWidth;
        const w = chartWidth;
        const x = (v: number) => cx + (v / maxValue) * w;
        const midY = top + 10;
        return (
          <g key={d.jobTitle}>
            <text x={0} y={midY + 3} fontSize={10} fill="#475569">
              {d.jobTitle}
            </text>
            <line x1={x(d.min)} x2={x(d.max)} y1={midY} y2={midY} stroke="#c4b5fd" strokeWidth={1.5} />
            <line x1={x(d.min)} x2={x(d.min)} y1={midY - 5} y2={midY + 5} stroke="#8b5cf6" strokeWidth={1.5} />
            <line x1={x(d.max)} x2={x(d.max)} y1={midY - 5} y2={midY + 5} stroke="#8b5cf6" strokeWidth={1.5} />
            <rect
              x={x(d.q1)}
              y={midY - 6}
              width={Math.max(1, x(d.q3) - x(d.q1))}
              height={12}
              fill="#ddd6fe"
              stroke="#8b5cf6"
              strokeWidth={1}
            />
            <line x1={x(d.median)} x2={x(d.median)} y1={midY - 6} y2={midY + 6} stroke="#6d28d9" strokeWidth={2} />
            <text x={x(d.median)} y={midY - 9} fontSize={9} fill="#6d28d9" textAnchor="middle">
              {d.median}
            </text>
          </g>
        );
      })}
      <text x={labelWidth} y={totalHeight - 4} fontSize={10} fill="#94a3b8">
        单位：千元/月（箱体为 Q1—Q3，中线为中位数，须线为下限—上限）
      </text>
    </svg>
  );
}

const CHAIN_LEVELS = [
  { key: '上游' as const, label: '上游', sub: '原材料 · 核心部件', color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', bar: '#06b6d4' },
  { key: '中游' as const, label: '中游', sub: '制造 · 集成', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', bar: '#8b5cf6' },
  { key: '下游' as const, label: '下游', sub: '应用 · 市场', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0', bar: '#10b981' },
];

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 shrink-0 py-1 md:py-0 md:px-1">
      <svg width="64" height="18" viewBox="0 0 64 18" className="rotate-90 md:rotate-0" aria-hidden="true">
        <line x1="2" y1="9" x2="48" y2="9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" />
        <polygon points="46,3 58,9 46,15" fill="#94a3b8" />
      </svg>
      <span className="text-[10px] text-slate-400 whitespace-nowrap">{label}</span>
    </div>
  );
}

function ChainFlow({ nodes }: { nodes: ChainNode[] }) {
  const stages = CHAIN_LEVELS.map((lv) => ({ ...lv, items: nodes.filter((n) => n.level === lv.key) }));

  return (
    <div className="flex flex-col md:flex-row md:items-stretch">
      {stages.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <FlowArrow label={`${stages[i - 1].label} → ${s.label}`} />}
          <div className="flex-1 min-w-0 rounded-lg border" style={{ borderColor: s.border, backgroundColor: s.bg }}>
            <div className="px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: s.border }}>
              <span className="text-xs font-bold text-white px-2 py-0.5 rounded" style={{ backgroundColor: s.bar }}>
                {s.label}
              </span>
              <span className="text-xs font-semibold" style={{ color: s.color }}>
                {s.sub}
              </span>
              <span className="ml-auto text-[11px] text-slate-400 shrink-0">{s.items.length} 个节点</span>
            </div>
            <div className="p-3 space-y-2">
              {s.items.map((n) => (
                <div key={n.nodeName} className="bg-white rounded-md border border-slate-200 p-2.5">
                  <div className="text-sm font-bold text-slate-800 mb-1">{n.nodeName}</div>
                  <p className="text-[11px] text-slate-600 leading-relaxed m-0 mb-2">{n.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {n.companies.map((c) => (
                      <span key={c} className="text-[11px] rounded px-1.5 py-0.5" style={{ backgroundColor: s.bg, color: s.color }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {s.items.length === 0 && <div className="text-[11px] text-slate-400">暂无节点</div>}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function WhitepaperTool({
  indicator,
  status,
  onSubmitted,
}: {
  indicator: Indicator;
  status: FilingStatus;
  onSubmitted: () => void;
}) {
  const [stage, setStage] = useState<Stage>(1);
  const [progress, setProgress] = useState(0);
  const [logIdx, setLogIdx] = useState(0);
  const [seed, setSeed] = useState(0);

  // 演示用预填值，便于直接测试生成效果
  const [majorName, setMajorName] = useState('工业机器人技术');
  const [industryName, setIndustryName] = useState('智能制造');
  const [region, setRegion] = useState('全国');

  const [materials, setMaterials] = useState<Record<WhitepaperModuleKey, SearchMaterial[]> | null>(null);
  const [result, setResult] = useState<WhitepaperResult | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  // 提交修改：用户把下载后本地修改好的白皮书文档回传上来
  const [revisedFiles, setRevisedFiles] = useState<string[]>([]);
  const revisedInputRef = useRef<HTMLInputElement>(null);

  const handleRevisedPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []).map((f) => f.name);
    if (picked.length) setRevisedFiles((prev) => [...prev, ...picked]);
    e.target.value = '';
  };
  const removeRevised = (idx: number) => setRevisedFiles((prev) => prev.filter((_, i) => i !== idx));

  const isSubmitted = status === 'submitted';
  const input = { majorName, industryName, region };
  const canSearch = majorName.trim().length > 0 && industryName.trim().length > 0;

  const queries = useMemo(
    () => buildSearchQueries(industryName || '目标产业', region),
    [industryName, region],
  );

  // 引用本白皮书的后续指标（以 filing.ts 的权威登记表为准，不再按文本猜测）
  const dependentIndicators = useMemo(
    () =>
      WHITEPAPER_REFERENCES.map((r) => ({
        ...r,
        indicator: indicators.find((i) => i.id === r.indicatorId),
      })).filter((r) => r.indicator),
    [],
  );

  const stageLogs = useMemo(
    () => [
      '正在解析专业与产业方向…',
      '正在生成结构化搜索查询…',
      '正在执行联网搜索（分模块采集）…',
      '正在提取产业生命周期数据…',
      '正在构建产业链上中下游节点…',
      '正在汇总关键岗位与能力要求…',
      '正在生成图表并组装白皮书正文…',
      '白皮书初稿生成完成，请审核。',
    ],
    [],
  );

  const runPipeline = (nextSeed: number) => {
    setStage(2);
    setProgress(0);
    setLogIdx(0);
    setShowJson(false);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          const founded = runSearch(input);
          setMaterials(founded);
          setResult(extractStructured(input, nextSeed));
          setStage(3);
          return 100;
        }
        const next = prev + 8;
        setLogIdx(Math.min(Math.floor(next / 13), stageLogs.length - 1));
        return next;
      });
    }, 260);
  };

  const regenerate = () => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    setResult(null);
    setMaterials(null);
    setProgress(0);
    setStage(1);
  };

  const markdown = useMemo(() => (result ? assembleMarkdown(result) : ''), [result]);
  const narrative = useMemo(() => (result ? buildNarrative(result) : null), [result]);
  const verdictRows = useMemo(() => (result ? buildVerdictRows(result) : []), [result]);
  const salaryStats = useMemo(() => (result ? buildSalaryStats(result) : []), [result]);

  const downloadMarkdown = () => {
    if (!result) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${industryName}-产业白皮书.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${industryName}-白皮书结构化数据.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stageMeta = [
    { num: 1 as const, label: '联网搜索素材' },
    { num: 2 as const, label: 'AI 结构化提取' },
    { num: 3 as const, label: '白皮书预览确认' },
  ];

  return (
    <>
      {/* 起点指标说明 */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <ExperimentOutlined className="text-amber-600 text-lg mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-amber-800 text-sm">白皮书生成工具 · 生成后需你确认才提交</div>
            <div className="text-xs text-amber-700 mt-1 leading-relaxed">
              本工具按「{indicator.name}」要求，联网采集公开数据并由 AI 起草产业白皮书初稿（三模块：生命周期 / 产业链图谱 / 关键岗位）。
              生成结果为<strong className="text-amber-800">全国公开数据</strong>，需你补充学校所服务区域产业特点与企业信息后方可提交。
            </div>
          </div>
        </div>
      </div>

      {/* 步骤条 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {stageMeta.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    stage >= s.num ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {stage > s.num ? <CheckOutlined /> : s.num}
                </div>
                <span className={`text-sm font-bold ${stage >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < stageMeta.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 ${stage > s.num ? 'bg-purple-500' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Stage 1：输入 + 联网搜索 ===== */}
      {stage === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <SearchOutlined className="text-blue-500" />
            <span className="font-bold text-slate-800 text-sm">输入服务方向并采集素材</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">
                  专业名称 <span className="text-red-500">*</span>
                </div>
                <Input
                  value={majorName}
                  onChange={(e) => setMajorName(e.target.value)}
                  placeholder="如：工业机器人技术"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">
                  服务产业方向 <span className="text-red-500">*</span>
                </div>
                <Input
                  value={industryName}
                  onChange={(e) => setIndustryName(e.target.value)}
                  placeholder="如：智能制造 / 工业机器人"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1.5">区域范围</div>
                <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="如：江苏省 / 全国" />
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-100 p-3">
              <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                <LinkOutlined /> 将执行的搜索查询（分模块）
              </div>
              <div className="space-y-1.5">
                {(Object.keys(queries) as WhitepaperModuleKey[]).map((m) => (
                  <div key={m} className="flex items-start gap-2">
                    <span className="shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded" style={{ color: MODULE_META[m].color, backgroundColor: '#fff' }}>
                      {MODULE_META[m].label.split(' · ')[0]}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {queries[m].map((q, i) => (
                        <span key={i} className="text-[11px] text-slate-600 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              素材越充分，AI 提取的结构化数据越准确。
            </span>
            <Button type="primary" icon={<ThunderboltOutlined />} disabled={!canSearch} onClick={() => runPipeline(seed)}>
              开始搜索并生成
            </Button>
          </div>
        </div>
      )}

      {/* ===== Stage 2：搜索 + 结构化提取进度 ===== */}
      {stage === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
            <RobotOutlined className="text-purple-500" />
            <span className="font-bold text-slate-800 text-sm">AI 正在采集素材并提取结构化数据</span>
          </div>
          <div className="px-5 py-8">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 flex items-center justify-center text-2xl text-purple-500 mx-auto mb-4">
                <LoadingOutlined />
              </div>
              <div className="text-sm font-bold text-slate-700 mb-1">{stageLogs[logIdx]}</div>
              <div className="text-xs text-slate-400 mb-4">
                分模块执行「{industryName}」的搜索查询与大模型提取…
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-2">{progress}%</div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 grid grid-cols-3 gap-3">
            {(Object.keys(MODULE_META) as WhitepaperModuleKey[]).map((m) => (
              <div key={m} className="text-center text-xs text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ backgroundColor: MODULE_META[m].color }} />
                {MODULE_META[m].label.split(' · ')[1]}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Stage 3：白皮书预览与确认 ===== */}
      {stage === 3 && result && (
        <>
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-green-700">
            <CheckCircleOutlined />
            <span>
              白皮书初稿已生成（{result.generatedAt}）。报告含 5 个章节、7 张图表与 3 张数据表，请逐章审核后提交，未确认不会自动提交。
            </span>
          </div>

          {/* ===== 1. 产业概况 ===== */}
          <ChapterCard num="1" title="产业概况">
            <Narrative text={narrative?.overview || ''} />
          </ChapterCard>

          {/* ===== 2. 产业生命周期判定 ===== */}
          <ChapterCard num="2" title="产业生命周期判定">
            <SubSection title="2.1 增长率分析">
              <Narrative text={narrative?.lifecycleGrowth || ''} />
              <FigureFrame caption="图1 · 营收增速折线图（%）">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.lifecycle.growthTrend} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="growthRate" name="增长率(%)" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </FigureFrame>
            </SubSection>

            <SubSection title="2.2 企业数量变化">
              <Narrative text={narrative?.lifecycleEnterprise || ''} />
              <FigureFrame caption="图2 · 企业数量柱状图（家）">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.lifecycle.enterpriseTrend} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="count" name="企业数量" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </FigureFrame>
            </SubSection>

            <SubSection title="2.3 生命周期判定结论">
              <Narrative text={narrative?.lifecycleVerdict || ''} />
              <TableFrame caption="表1 · 判定指标汇总">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2 font-semibold w-28">判定指标</th>
                      <th className="text-left px-3 py-2 font-semibold w-44">表现</th>
                      <th className="text-left px-3 py-2 font-semibold">判定依据</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verdictRows.map((row) => (
                      <tr key={row.metric} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2 font-medium text-slate-700">{row.metric}</td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-blue-700">{row.performance}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 leading-relaxed">{row.basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableFrame>
            </SubSection>
          </ChapterCard>

          {/* ===== 3. 产业链图谱 ===== */}
          <ChapterCard num="3" title="产业链图谱">
            <SubSection title="3.1 上中下游结构">
              <Narrative text={narrative?.chainStructure || ''} />
              <FigureFrame caption="图3 · 产业链上中下游流向图">
                <ChainFlow nodes={result.chain.nodes} />
              </FigureFrame>
            </SubSection>

            <SubSection title="3.2 核心企业清单">
              <Narrative text={narrative?.chainCompanies || ''} />
              <TableFrame caption="表2 · 企业矩阵表">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2 font-semibold w-20">层级</th>
                      <th className="text-left px-3 py-2 font-semibold w-44">节点</th>
                      <th className="text-left px-3 py-2 font-semibold">核心企业</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.chain.nodes.map((n) => (
                      <tr key={n.nodeName} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2">
                          <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                            {n.level}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-700">{n.nodeName}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {n.companies.map((c) => (
                              <span key={c} className="bg-violet-50 text-violet-700 rounded px-1.5 py-0.5">
                                {c}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableFrame>
            </SubSection>

            <SubSection title="3.3 集中度分析">
              <Narrative text={narrative?.concentration || ''} />
              <FigureFrame caption="图4 · CR5 集中度柱状图（%）">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[{ name: 'CR5 集中度', value: result.chain.cr5 }]}
                      margin={{ top: 16, right: 24, bottom: 0, left: -16 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="CR5(%)" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={80} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </FigureFrame>
            </SubSection>
          </ChapterCard>

          {/* ===== 4. 关键岗位清单 ===== */}
          <ChapterCard num="4" title="关键岗位清单">
            <SubSection title="4.1 岗位需求热度">
              <Narrative text={narrative?.jobHeat || ''} />
              <FigureFrame caption="图5 · 岗位热度柱状图（1—100）">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={result.jobs.jobs} margin={{ top: 8, right: 16, bottom: 40, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis dataKey="jobTitle" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="demandHeat" name="需求热度" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </FigureFrame>
            </SubSection>

            <SubSection title="4.2 薪资水平">
              <Narrative text={narrative?.salary || ''} />
              <FigureFrame caption="图6 · 薪资箱线图">
                <SalaryBoxPlot data={salaryStats} />
              </FigureFrame>
            </SubSection>

            <SubSection title="4.3 能力要求">
              <Narrative text={narrative?.skills || ''} />
              <FigureFrame caption="图7 · 技能频次图">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={result.jobs.skillFrequencies}
                      layout="vertical"
                      margin={{ top: 4, right: 24, bottom: 0, left: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="skill" tick={{ fontSize: 11 }} width={80} />
                      <RechartsTooltip />
                      <Bar dataKey="freq" name="提及次数" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </FigureFrame>
            </SubSection>

            <SubSection title="4.4 岗位清单">
              <Narrative text={narrative?.jobSummary || ''} />
              <TableFrame caption="表3 · 结构化岗位表">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600">
                      <th className="text-left px-3 py-2 font-semibold">岗位名称</th>
                      <th className="text-left px-3 py-2 font-semibold">需求热度</th>
                      <th className="text-left px-3 py-2 font-semibold">薪资范围</th>
                      <th className="text-left px-3 py-2 font-semibold">核心能力要求</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.jobs.jobs.map((j) => (
                      <tr key={j.jobTitle} className="border-t border-slate-100 align-top">
                        <td className="px-3 py-2 font-medium text-slate-700">{j.jobTitle}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden inline-block">
                              <span className="block h-full bg-green-400 rounded-full" style={{ width: `${j.demandHeat}%` }} />
                            </span>
                            {j.demandHeat}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                          {j.salaryMin}-{j.salaryMax}K
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {j.skills.map((s) => (
                              <span key={s} className="bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5">
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableFrame>
            </SubSection>
          </ChapterCard>

          {/* 采集素材清单 */}
          {materials && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setShowMaterials((v) => !v)}
                className="w-full px-5 py-3 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors"
              >
                <SearchOutlined className="text-blue-500" />
                <span className="font-bold text-slate-800 text-sm">素材采集清单（带来源片段）</span>
                <span className="text-xs text-slate-400 ml-1">
                  共 {Object.values(materials).reduce((n, arr) => n + arr.length, 0)} 条
                </span>
                <DownOutlined
                  className={`ml-auto text-slate-400 text-xs transition-transform ${showMaterials ? 'rotate-180' : ''}`}
                />
              </button>
              {showMaterials && (
                <div className="px-5 py-4 border-t border-slate-100 space-y-4">
                  {(Object.keys(materials) as WhitepaperModuleKey[]).map((m) => (
                    <div key={m}>
                      <div className="text-xs font-semibold mb-2" style={{ color: MODULE_META[m].color }}>
                        {MODULE_META[m].label}
                      </div>
                      <div className="space-y-2">
                        {materials[m].map((item, i) => (
                          <div key={i} className="border border-slate-100 rounded-lg p-3 bg-slate-50/60">
                            <div className="text-xs font-bold text-slate-700 mb-1">{item.title}</div>
                            <div className="text-xs text-slate-600 leading-relaxed mb-1.5">{item.snippet}</div>
                            <div className="text-[11px] text-blue-500 truncate flex items-center gap-1">
                              <LinkOutlined /> {item.url}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== 5. 数据来源与计算说明 ===== */}
          <ChapterCard num="5" title="数据来源与计算说明">
            <SubSection title="5.1 数据源清单">
              <Narrative text={narrative?.sourceNote || ''} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                {result.sources.map((u, i) => (
                  <a
                    key={i}
                    href={u}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate flex items-center gap-1"
                  >
                    <LinkOutlined /> {u}
                  </a>
                ))}
              </div>
            </SubSection>

            <SubSection title="5.2 计算公式">
              <ul className="text-sm text-slate-700 leading-7 m-0 pl-5 list-disc">
                <li>营收增长率 =（本期营收 − 上期营收）/ 上期营收 × 100%</li>
                <li>企业数量净增率 =（末期企业数 − 基期企业数）/ 基期企业数 × 100%</li>
                <li>CR5 = 前五大企业市占率之和</li>
                <li>需求热度 = 基于招聘平台岗位数量归一化后的相对值（1—100）</li>
                <li>薪资四分位 = 依据岗位薪资下限与上限线性插值估算（Q1 取 25%、中位取 50%、Q3 取 75%）</li>
              </ul>
            </SubSection>

            <SubSection title="5.3 可追溯记录">
              <Narrative text={narrative?.traceNote || ''} />
            </SubSection>
          </ChapterCard>

          {/* 结构化数据（可追溯） */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowJson((v) => !v)}
              className="w-full px-5 py-3 flex items-center gap-2 text-left hover:bg-slate-50 transition-colors"
            >
              <FileTextOutlined className="text-slate-500" />
              <span className="font-bold text-slate-800 text-sm">结构化数据（JSON，可下载用于其他指标引用）</span>
              <DownOutlined className={`ml-auto text-slate-400 text-xs transition-transform ${showJson ? 'rotate-180' : ''}`} />
            </button>
            {showJson && (
              <div className="px-5 py-4 border-t border-slate-100">
                <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-[11px] leading-relaxed overflow-x-auto max-h-80">
                  {JSON.stringify(
                    {
                      lifecycle: result.lifecycle,
                      chain: result.chain,
                      jobs: result.jobs,
                      sources: result.sources,
                    },
                    null,
                    2,
                  )}
                </pre>
                <Button size="small" className="mt-3" icon={<DownloadOutlined />} onClick={downloadJson}>
                  下载 JSON
                </Button>
              </div>
            )}
          </div>

          {/* 引用关系说明 */}
          <div className="bg-blue-50/60 rounded-xl border border-blue-100 px-5 py-4">
            <div className="text-xs font-semibold text-blue-700 mb-2 flex items-center gap-1">
              <InfoCircleOutlined /> 该白皮书将被以下 {dependentIndicators.length} 项指标引用为依据
            </div>
            <div className="flex flex-wrap gap-2">
              {dependentIndicators.map((d) => (
                <span
                  key={d.indicatorId}
                  className="inline-flex items-center gap-1 text-xs bg-white border border-blue-200 text-slate-700 rounded-md px-2 py-1"
                >
                  <span className="font-mono text-[10px] text-slate-400">{d.indicatorId}</span>
                  {d.indicator?.name}
                  <span className="text-blue-500">· {d.usedModule}</span>
                </span>
              ))}
            </div>
            <div className="text-[11px] text-blue-600 mt-2">
              指标之间不锁定、不强制：其他指标即使不引用白皮书，也可独立填报并提交。
            </div>
          </div>

          {/* 提交修改：把本地修改好的白皮书文档回传 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
              <CloudUploadOutlined className="text-purple-500" />
              <span className="font-bold text-slate-800 text-sm">提交修改</span>
              <span className="text-xs text-slate-400 ml-1">上传本地修改后的白皮书，提交时以此为准</span>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-3">
                <InfoCircleOutlined className="text-slate-400 mt-0.5" />
                <span className="leading-relaxed">
                  流程：点<strong className="text-slate-700">下载白皮书</strong>导出 Markdown → 在本地修改 →
                  在此<strong className="text-slate-700">上传修改稿</strong> → 点底部<strong className="text-slate-700">提交</strong>。
                  上传后提交即以修改稿为准，AI 生成的白皮书仅作为底稿留存。
                </span>
              </div>

              {revisedFiles.length === 0 ? (
                <button
                  onClick={() => revisedInputRef.current?.click()}
                  disabled={isSubmitted}
                  className="w-full border-2 border-dashed border-slate-200 rounded-lg py-7 text-center hover:border-purple-300 hover:bg-purple-50/30 transition-colors disabled:opacity-50"
                >
                  <CloudUploadOutlined className="text-3xl text-slate-300 mb-2" />
                  <div className="text-sm text-slate-400">点击上传修改后的白皮书（文档/表格）</div>
                  <div className="text-xs text-slate-300 mt-1">支持 .md/.doc/.docx/.xls/.xlsx/.pdf/.csv，可多选</div>
                </button>
              ) : (
                <div className="space-y-2">
                  {revisedFiles.map((f, i) => (
                    <div key={`${f}-${i}`} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                      <FileTextOutlined className="text-purple-500" />
                      <span className="flex-1 text-sm text-slate-700 truncate">{f}</span>
                      <span className="shrink-0 text-[11px] px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">
                        修改稿
                      </span>
                      {!isSubmitted && (
                        <button
                          onClick={() => removeRevised(i)}
                          className="shrink-0 text-red-500 hover:text-red-600 text-xs flex items-center gap-1"
                        >
                          <DeleteOutlined /> 移除
                        </button>
                      )}
                    </div>
                  ))}
                  {!isSubmitted && (
                    <button
                      onClick={() => revisedInputRef.current?.click()}
                      className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 pt-1"
                    >
                      <PlusOutlined /> 继续添加
                    </button>
                  )}
                </div>
              )}

              <div className="text-xs mt-3 leading-relaxed">
                {revisedFiles.length === 0 ? (
                  <span className="text-amber-600">
                    尚未上传修改稿：提交时将直接采用上方 AI 生成的白皮书。
                  </span>
                ) : (
                  <span className="text-green-600">
                    已上传 {revisedFiles.length} 份修改稿：提交时以修改稿为准。
                  </span>
                )}
              </div>

              <input
                ref={revisedInputRef}
                type="file"
                multiple
                accept=".md,.markdown,.doc,.docx,.xls,.xlsx,.pdf,.csv"
                className="hidden"
                onChange={handleRevisedPick}
              />
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="fixed bottom-0 left-[220px] right-0 bg-white border-t border-slate-200 px-8 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] z-20">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  生命周期：<span className="font-bold text-blue-600">{result.lifecycle.verdict}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  产业链节点：<span className="font-bold text-purple-600">{result.chain.nodes.length}</span> 个
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  关键岗位：<span className="font-bold text-green-600">{result.jobs.jobs.length}</span> 个
                </span>
              </div>
              <div className="flex items-center gap-3 flex-wrap justify-end">
                <div className="flex items-center gap-2">
                  <Tooltip title="导出 Markdown 白皮书，可本地修改后回传">
                    <Button icon={<DownloadOutlined />} onClick={downloadMarkdown} disabled={isSubmitted}>
                      下载白皮书
                    </Button>
                  </Tooltip>
                  <Button
                    icon={<CloudUploadOutlined />}
                    onClick={() => revisedInputRef.current?.click()}
                    disabled={isSubmitted}
                  >
                    提交修改
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={regenerate} disabled={isSubmitted}>
                    重新生成
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  {revisedFiles.length > 0 && (
                    <span className="text-xs font-bold text-purple-600">将提交 {revisedFiles.length} 份修改稿</span>
                  )}
                  <Button type="primary" icon={<CheckOutlined />} disabled={isSubmitted} onClick={onSubmitted}>
                    {isSubmitted ? '已提交' : revisedFiles.length > 0 ? '提交修改稿' : '提交'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}