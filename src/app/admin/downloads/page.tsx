'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Table, Button, Select, Tag, Progress, Alert, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { MAJORS } from '@/lib/diagnosis';
import { TEMPLATES } from '@/lib/templates';
import { EVAL_TASKS, CURRENT_TASK, VERDICT_TEXT, majorProgress, taskResults, taskById, majorSlug, type MajorProgress } from '@/lib/eval-tasks';
import type { RunSummary } from '@/lib/industry-report/runs';

// 数据下载(管理员):
//   各专业上传的资料 —— 单个专业下载 / 按专业分表批量下载 / 并成一张表下载(Excel)
//   评价结果 —— 当次任务各专业得分与结论(Excel)
//   报告 —— 产业分析报告、专业诊断与整改报告,单份打开即可下载 PDF / Word,也可批量导出清单
// 学校内部数据为演示数据;原始附件打包下载需接入文件存储后提供

const MATERIALS = TEMPLATES.filter((t) => t.owner !== 'AI');
const today = () => new Date().toISOString().slice(0, 10);

function materialRows(taskId: string, p: MajorProgress) {
  const task = taskById(taskId)!;
  return MATERIALS.map((t, i) => ({
    专业: p.major,
    学院: p.college,
    评价任务: task.name,
    资料编号: t.id,
    资料名称: t.name,
    提交方: t.owner === 'TEACHER' ? '教师填报' : '学校系统导入',
    关联指标: t.indicators.join('、'),
    状态: i < p.uploaded ? '已提交' : '未提交',
    更新时间: i < p.uploaded ? p.updatedAt : '',
  }));
}

function save(book: XLSX.WorkBook, name: string) {
  XLSX.writeFile(book, `${name}_${today()}.xlsx`);
}

export default function DownloadsPage() {
  const [taskId, setTaskId] = useState(CURRENT_TASK.id);
  const [picked, setPicked] = useState<React.Key[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [msg, holder] = message.useMessage();
  const task = taskById(taskId)!;
  const progress = useMemo(() => MAJORS.map((m) => majorProgress(task, m)), [task]);
  const results = useMemo(() => (task.hasResults ? taskResults(task.id) : []), [task]);

  useEffect(() => {
    fetch('/api/industry-log')
      .then((r) => (r.ok ? r.json() : { runs: [] }))
      .then((d) => setRuns(((d.runs ?? []) as RunSummary[]).filter((r) => r.status === 'done')))
      .catch(() => {});
  }, []);

  const selected = progress.filter((p) => picked.includes(p.major));
  const scope = selected.length ? selected : progress;

  const downloadOne = (p: MajorProgress) => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(materialRows(taskId, p)), '资料清单');
    save(book, `${p.major}_${task.name}_资料`);
  };
  const downloadSheets = () => {
    const book = XLSX.utils.book_new();
    scope.forEach((p) => XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(materialRows(taskId, p)), p.major.slice(0, 31)));
    save(book, `${task.name}_各专业资料_分表`);
    msg.success(`已导出 ${scope.length} 个专业,每个专业一个工作表`);
  };
  const downloadMerged = () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(scope.flatMap((p) => materialRows(taskId, p))), '各专业资料汇总');
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(scope.map((p) => ({ 专业: p.major, 学院: p.college, 进度: `${p.progress}%`, 已提交: p.uploaded, 应提交: p.required, 状态: p.status, 更新时间: p.updatedAt }))),
      '提交进度',
    );
    save(book, `${task.name}_各专业资料_并表`);
    msg.success(`已导出 ${scope.length} 个专业的并表`);
  };
  const downloadResults = () => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet(results.map((r) => ({ 专业: r.major, 学院: r.college, 一致性: r.consistency, 有效性: r.effectiveness, 综合得分: r.overall, 评价结论: VERDICT_TEXT[r.verdict] }))),
      '评价结果',
    );
    save(book, `${task.name}_评价结果`);
  };
  const downloadReportList = () => {
    const origin = window.location.origin;
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.json_to_sheet([
        ...runs.map((r) => ({ 类型: '产业分析报告', 名称: `${r.input.region}${r.input.industry}产业分析报告`, 服务专业: r.input.major, 生成时间: r.startedAt.slice(0, 16).replace('T', ' '), 链接: `${origin}/industry-report?run=${r.id}` })),
        ...(task.hasResults
          ? MAJORS.map((m) => ({ 类型: '专业诊断与整改报告', 名称: `${m.name} · ${task.name}`, 服务专业: m.name, 生成时间: task.end, 链接: `${origin}/rectification/report?major=${majorSlug(m.name)}&task=${task.id}` }))
          : []),
      ]),
      '报告清单',
    );
    save(book, '报告清单');
  };

  return (
    <div className="space-y-4">
      {holder}
      <Card className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-base font-bold text-slate-800">数据下载</div>
            <p className="text-sm text-slate-500 mt-1 mb-0">按评价任务导出各专业上传的资料、评价结果,以及产业分析报告与专业诊断报告。</p>
          </div>
          <Select
            value={taskId}
            onChange={(v) => {
              setTaskId(v);
              setPicked([]);
            }}
            style={{ width: 220 }}
            options={EVAL_TASKS.filter((t) => t.state !== 'draft').map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
      </Card>

      <Card
        data-spec="dl-materials"
        className="shadow-sm"
        title="各专业上传的资料"
        extra={
          <div className="flex gap-2 flex-wrap">
            <Button icon={<FileExcelOutlined />} onClick={downloadSheets}>
              {selected.length ? `所选 ${selected.length} 个` : '全部'}专业 · 分表下载
            </Button>
            <Button type="primary" icon={<FileExcelOutlined />} onClick={downloadMerged}>
              {selected.length ? `所选 ${selected.length} 个` : '全部'}专业 · 并表下载
            </Button>
          </div>
        }
      >
        <Table<MajorProgress>
          rowKey="major"
          size="small"
          dataSource={progress}
          rowSelection={{ selectedRowKeys: picked, onChange: setPicked }}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          scroll={{ x: 720 }}
          columns={[
            { title: '专业', dataIndex: 'major', width: 170, fixed: 'left', render: (v: string) => <b>{v}</b> },
            { title: '学院', dataIndex: 'college', width: 160 },
            { title: '资料提交', key: 'p', width: 200, render: (_, p) => <Progress percent={p.progress} size="small" format={() => `${p.uploaded}/${p.required}`} /> },
            { title: '状态', dataIndex: 'status', width: 90, render: (v: string) => <Tag color={v === '已提交' ? 'success' : v === '自评中' ? 'processing' : 'default'}>{v}</Tag> },
            {
              title: '',
              key: 'op',
              width: 120,
              render: (_, p) => (
                <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => downloadOne(p)}>
                  下载
                </Button>
              ),
            },
          ]}
        />
        <p className="text-xs text-slate-400 mt-3 mb-0">导出的是资料清单与提交状态(Excel);原始附件按专业打包下载需接入学校文件存储后提供。</p>
      </Card>

      <Card
        data-spec="dl-results"
        className="shadow-sm"
        title="评价结果"
        extra={
          <Button icon={<FileExcelOutlined />} disabled={!results.length} onClick={downloadResults}>
            导出 Excel
          </Button>
        }
      >
        {results.length ? (
          <p className="text-sm text-slate-600 m-0">
            「{task.name}」共 {results.length} 个专业的一致性、有效性、综合得分与评价结论(重点发展 / 优化整改 / 风险关注)。
          </p>
        ) : (
          <Alert type="info" showIcon title="该评价任务还在进行中,结果出来后可以导出。" />
        )}
      </Card>

      <Card
        data-spec="dl-reports"
        className="shadow-sm"
        title="报告下载"
        extra={
          <Button icon={<FileExcelOutlined />} onClick={downloadReportList}>
            批量导出报告清单
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="font-bold text-slate-700 mb-2">
              <FileTextOutlined /> 产业分析报告({runs.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {runs.slice(0, 20).map((r) => (
                <div key={r.id} className="py-2 flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">
                    {r.input.region}
                    {r.input.industry}产业分析报告
                  </span>
                  <span className="text-xs text-slate-400">{r.startedAt.slice(5, 10)}</span>
                  <Link href={`/industry-report?run=${r.id}`}>
                    <Button size="small" type="link" icon={<FilePdfOutlined />}>
                      PDF / Word
                    </Button>
                  </Link>
                </div>
              ))}
              {!runs.length && <div className="py-2 text-sm text-slate-400">还没有生成过产业分析报告</div>}
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-700 mb-2">
              <FileTextOutlined /> 专业诊断与整改报告({task.hasResults ? MAJORS.length : 0})
            </div>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {task.hasResults ? (
                MAJORS.map((m) => (
                  <div key={m.name} className="py-2 flex items-center gap-2 text-sm">
                    <span className="flex-1 truncate">{m.name}</span>
                    <Link href={`/rectification/report?major=${majorSlug(m.name)}&task=${task.id}`}>
                      <Button size="small" type="link" icon={<FilePdfOutlined />}>
                        打开并打印
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="py-2 text-sm text-slate-400">该评价任务还没有出结果</div>
              )}
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3 mb-0">单份报告打开后可下载 PDF / Word;批量导出的清单里带每份报告的链接。</p>
      </Card>
    </div>
  );
}
