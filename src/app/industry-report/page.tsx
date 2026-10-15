'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { Button, Input, Checkbox } from 'antd';
import { ExperimentOutlined, PrinterOutlined } from '@ant-design/icons';
import { useSearchParams } from 'next/navigation';
import type { IndustryReport } from '@/lib/industry-report/types';
import { ReportView, readJSON, writeJSON } from '@/components/industry-report/ReportView';
import { Progress, useReportGenerator } from '@/components/industry-report/Generator';

// AI-native 产业分析报告
// 可解释:数值由公开数据按公式计算;大模型只做检索式拆分、信息抽取与解读,且解读中的数字由程序逐个校验
// 鲁棒:量化数据不足时整章跳过或转入"早期弱信号",不用模型补数
// 飞轮:先查检索日志与知识库,有历史时只检索变化;所有生成都记入管理员的产业检索日志

const STORE_KEY = 'industry_report_last';

export default function IndustryReportPage() {
  return (
    <Suspense fallback={null}>
      <IndustryReportContent />
    </Suspense>
  );
}

function IndustryReportContent() {
  const runParam = useSearchParams().get('run');
  const [industry, setIndustry] = useState('智能制造');
  const [region, setRegion] = useState('辽宁省大连市');
  const [major, setMajor] = useState('智能制造工程');
  const [forceFull, setForceFull] = useState(false);
  const [report, setReport] = useState<IndustryReport | null>(null);
  const [loadError, setLoadError] = useState('');
  const { running, steps, logs, error, generate } = useReportGenerator();

  // 指定 ?run= 时加载检索日志中的历史报告;否则载入本机上次生成的报告(避免演示时重复等待)
  useEffect(() => {
    if (runParam) {
      fetch(`/api/industry-log?id=${encodeURIComponent(runParam)}`)
        .then((r) => r.json())
        .then((run) => {
          if (run.report) {
            setReport(run.report);
            setIndustry(run.input.industry);
            setRegion(run.input.region);
            setMajor(run.input.major);
          } else setLoadError(run.error || '该次检索没有生成报告');
        })
        .catch(() => setLoadError('加载失败'));
      return;
    }
    const last = readJSON<IndustryReport>(STORE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (last) setReport(last);
  }, [runParam]);

  const run = async () => {
    const r = await generate({ industry, region, major, forceFull }, 'industry-report');
    if (r) {
      setReport(r);
      writeJSON(STORE_KEY, r);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="no-print flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xl shadow-sm">
            <ExperimentOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">产业分析报告</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">数值来自公开数据并按公式计算 · 大模型只做检索、抽取与解读,每条结论都能追溯来源</p>
          </div>
        </div>
        {report && !running && (
          <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
            打印 / 导出 PDF
          </Button>
        )}
      </div>

      <div data-spec="ir-form" className="no-print rounded-2xl bg-white border border-slate-200 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
          <Field label="产业方向">
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} disabled={running} />
          </Field>
          <Field label="区域">
            <Input value={region} onChange={(e) => setRegion(e.target.value)} disabled={running} />
          </Field>
          <Field label="服务专业">
            <Input value={major} onChange={(e) => setMajor(e.target.value)} disabled={running} />
          </Field>
          <Button type="primary" size="large" loading={running} disabled={!industry.trim()} onClick={run}>
            {report ? '重新生成' : '生成报告'}
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
          <p className="text-xs text-slate-400 m-0">
            先查历史检索沉淀,有历史时只检索变化;论文统计来自 OpenAlex,政策、产业集群、专业就业方向优先取平方数据,其余来自阿里云联网检索。
          </p>
          <Checkbox checked={forceFull} onChange={(e) => setForceFull(e.target.checked)} disabled={running}>
            <span className="text-xs text-slate-500">忽略历史,全量检索</span>
          </Checkbox>
        </div>
      </div>

      {(running || error) && <Progress steps={steps} logs={logs} error={error} running={running} />}
      {loadError && <div className="text-sm text-red-500 mb-4">{loadError}</div>}
      {report && !running && <ReportView report={report} />}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-500 mb-1">{label}</span>
      {children}
    </label>
  );
}
