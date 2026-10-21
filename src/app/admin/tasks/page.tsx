'use client';
import React, { Suspense, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, DatePicker, Drawer, Form, Input, Modal, Progress, Segmented, Select, Table, Tag, Tooltip, message } from 'antd';
import { PlusOutlined, TeamOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, CloudUploadOutlined, CalendarOutlined, BarChartOutlined, FundViewOutlined, FileDoneOutlined } from '@ant-design/icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Cell, LabelList } from 'recharts';
import { MAJORS, DEMO_MAJOR } from '@/lib/diagnosis';
import { useMyWorks, workDone } from '@/lib/teacher-work';
import { useCustomTasks } from '@/lib/diagnosis-state';
import { TEMPLATES } from '@/lib/templates';
import { CURRENT_TASK, EVAL_TASKS, TASK_STATE_META, majorProgress, type EvalTask, type MajorProgress } from '@/lib/eval-tasks';
import { TaskHeader, HistoryTasks, useTaskParam } from '@/components/eval/TaskBar';

// 评价任务:设置评价任务、管理评价进程——各专业自评进度与资料上传情况,并可跳到该任务的评价结果 / 诊断分析 / 整改与跟踪
// 学校版与院系版共用:「评价范围」即本账号可评价的专业
export default function Page() {
  return (
    <Suspense fallback={null}>
      <TasksPage />
    </Suspense>
  );
}

const MATERIALS = TEMPLATES.filter((t) => t.owner !== 'AI'); // 每个专业需提交的资料(教师填报 + 学校系统导入)
const zh = (a: string, b: string) => a.localeCompare(b, 'zh-Hans-CN-u-co-pinyin');

function TasksPage() {
  const router = useRouter();
  const [custom, setCustom] = useCustomTasks();
  const drafts: EvalTask[] = custom.map((c) => ({ id: c.id, name: c.name, period: c.period, start: c.start, end: c.end, state: 'draft', hasResults: false }));
  const all = [...drafts, ...EVAL_TASKS];
  const [picked, setTask] = useTaskParam(CURRENT_TASK);
  const task = all.find((t) => t.id === picked.id) ?? picked;
  const [sort, setSort] = useState<'college' | 'major' | 'progress'>('college');
  const [viewing, setViewing] = useState<MajorProgress | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, holder] = message.useMessage();
  const [now] = useState(() => Date.now());

  const scope = custom.find((c) => c.id === task.id)?.majors;
  // 示例专业的本次任务:教师填报的几项取教师端真实填报状态(老师上传后这里同步可见)
  const works = useMyWorks(CURRENT_TASK);
  const liveTeacher = new Map(works.map((w) => [w.templateId.toUpperCase(), workDone(w)]));
  const isLive = (major: string) => task.id === CURRENT_TASK.id && major === DEMO_MAJOR.name;
  const uploadedOf = (major: string, uploaded: number) =>
    isLive(major) ? MATERIALS.filter((t, i) => (liveTeacher.has(t.id) ? liveTeacher.get(t.id) : i < uploaded)).length : uploaded;
  const rows = useMemo(() => {
    const list = MAJORS.filter((m) => !scope || scope.includes(m.name)).map((m) => {
      const p = majorProgress(task, m);
      if (!isLive(m.name)) return p;
      const uploaded = uploadedOf(m.name, p.uploaded);
      const progress = Math.round((uploaded / p.required) * 100);
      return { ...p, uploaded, progress, status: progress >= 100 ? '已提交' : progress > 0 ? '自评中' : '未开始' } as MajorProgress;
    });
    return list.sort((a, b) => (sort === 'progress' ? b.progress - a.progress : sort === 'major' ? zh(a.major, b.major) : zh(a.college, b.college) || zh(a.major, b.major)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, sort, scope, works]);

  const n = (s: MajorProgress['status']) => rows.filter((r) => r.status === s).length;
  const uploadRate = rows.length ? Math.round((rows.reduce((s, r) => s + r.uploaded, 0) / rows.reduce((s, r) => s + r.required, 0)) * 100) : 0;
  const daysLeft = Math.ceil((new Date(`${task.end}T23:59:59`).getTime() - now) / 86400000);
  const byCollege = Object.values(
    rows.reduce<Record<string, { name: string; sum: number; n: number }>>((acc, r) => {
      (acc[r.college] ??= { name: r.college, sum: 0, n: 0 }).sum += r.progress;
      acc[r.college].n++;
      return acc;
    }, {}),
  )
    .map((c) => ({ name: c.name.replace(/学院$/, ''), rate: Math.round(c.sum / c.n) }))
    .sort((a, b) => a.rate - b.rate);

  const go = (path: string) => router.push(`${path}?task=${task.id}`);

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      {holder}
      <TaskHeader
        title="评价任务"
        desc="设置评价任务、管理评价进程:各专业的自评进度与资料上传情况"
        task={task}
        onTask={setTask}
        tasks={all}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreating(true)}>
            新建评价任务
          </Button>
        }
      />

      {/* 看板 */}
      <div data-spec="task-board" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: '参评专业', value: rows.length, unit: '个', icon: <TeamOutlined />, color: '#1677ff' },
          { label: '已提交自评', value: n('已提交'), unit: '个', icon: <CheckCircleOutlined />, color: '#10b981' },
          { label: '自评中', value: n('自评中'), unit: '个', icon: <SyncOutlined />, color: '#f59e0b' },
          { label: '未开始', value: n('未开始'), unit: '个', icon: <ClockCircleOutlined />, color: '#94a3b8' },
          { label: '资料上传完成率', value: uploadRate, unit: '%', icon: <CloudUploadOutlined />, color: '#7c3aed' },
          {
            label: '自评截止',
            value: task.state === 'ended' ? '已结束' : daysLeft > 0 ? daysLeft : '已截止',
            unit: task.state !== 'ended' && daysLeft > 0 ? '天后' : '',
            icon: <CalendarOutlined />,
            color: '#0ea5e9',
          },
        ].map((k) => (
          <div key={k.label} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              {k.label}
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${k.color}15`, color: k.color }}>
                {k.icon}
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800">{k.value}</span>
              <span className="text-xs text-slate-400">{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 跳转:该任务的评价结果 / 诊断分析 / 整改与跟踪 */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500">
          {task.name} · {TASK_STATE_META[task.state].label} · {task.start} ~ {task.end}
        </span>
        <span className="ml-auto flex gap-2 flex-wrap">
          {[
            { label: '评价结果', path: '/admin/reports', icon: <BarChartOutlined /> },
            { label: '诊断分析', path: '/admin', icon: <FundViewOutlined /> },
            { label: '整改与跟踪', path: '/rectification', icon: <FileDoneOutlined /> },
          ].map((b) => (
            <Tooltip key={b.label} title={task.hasResults ? '' : '自评结束、AI 评价完成后才有结果'}>
              <Button icon={b.icon} disabled={!task.hasResults} onClick={() => go(b.path)}>
                {b.label}
              </Button>
            </Tooltip>
          ))}
        </span>
      </div>

      {task.state !== 'draft' && (
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <h3 className="text-base font-bold text-slate-800 m-0 mb-2">各院系自评进度</h3>
          <div style={{ height: Math.max(160, byCollege.length * 30) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCollege} layout="vertical" margin={{ top: 4, right: 40, left: 20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={120} tick={{ fill: '#475569', fontSize: 12 }} />
                <RTooltip formatter={(v) => [`${v}%`, '平均自评进度']} />
                <Bar dataKey="rate" barSize={14} radius={[0, 4, 4, 0]}>
                  {byCollege.map((c) => (
                    <Cell key={c.name} fill={c.rate >= 90 ? '#10b981' : c.rate >= 60 ? '#1677ff' : '#f59e0b'} />
                  ))}
                  <LabelList dataKey="rate" position="right" formatter={(v) => `${v}%`} style={{ fontSize: 11, fill: '#64748b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 专业列表 */}
      <div data-spec="task-majors" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-800 m-0">各专业自评与资料上传</h3>
          <Segmented
            value={sort}
            onChange={(v) => setSort(v as typeof sort)}
            options={[
              { value: 'college', label: '按院系' },
              { value: 'major', label: '按专业' },
              { value: 'progress', label: '按进度' },
            ]}
          />
        </div>
        <Table
          rowKey="major"
          scroll={{ x: 900 }}
          dataSource={rows}
          pagination={false}
          size="middle"
          onRow={(r) => ({ onClick: () => setViewing(r), style: { cursor: 'pointer' } })}
          columns={[
            { title: '专业', dataIndex: 'major', width: 170, fixed: 'left' as const, render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
            { title: '所属院系', dataIndex: 'college', width: 190 },
            { title: '评价进度', dataIndex: 'progress', width: 200, render: (v: number) => <Progress percent={v} size="small" strokeColor={v >= 100 ? '#10b981' : '#1677ff'} /> },
            {
              title: '资料上传',
              width: 120,
              render: (_: unknown, r: MajorProgress) => (
                <span className="text-blue-600 hover:underline">
                  {r.uploaded}/{r.required} 份
                </span>
              ),
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (v: MajorProgress['status']) => <Tag color={v === '已提交' ? 'success' : v === '自评中' ? 'processing' : 'default'}>{v}</Tag>,
            },
            { title: '最近更新', dataIndex: 'updatedAt', width: 120, render: (v: string) => <span className="text-xs text-slate-400">{v}</span> },
          ]}
        />
      </div>

      <HistoryTasks
        title="全部评价任务"
        tasks={all}
        current={task.id}
        onPick={setTask}
        meta={(t) => {
          if (t.state === 'draft') return <span className="text-xs text-slate-400">尚未开始</span>;
          const ps = MAJORS.map((m) => majorProgress(t, m));
          return <span className="text-xs text-slate-400">已提交 {ps.filter((p) => p.status === '已提交').length}/{ps.length}</span>;
        }}
      />

      <Drawer title={viewing ? `${viewing.major} · 资料上传情况` : ''} open={!!viewing} onClose={() => setViewing(null)} size={460}>
        {viewing && (
          <>
            <div className="text-sm text-slate-500 mb-3">
              {viewing.college} · 已上传 {viewing.uploaded}/{viewing.required} 份 · 自评进度 {viewing.progress}%
            </div>
            <div className="divide-y divide-slate-100">
              {MATERIALS.map((t, i) => {
                const done = isLive(viewing.major) && liveTeacher.has(t.id) ? liveTeacher.get(t.id)! : i < majorProgress(task, MAJORS.find((m) => m.name === viewing.major)!).uploaded;
                return (
                  <div key={t.id} className="py-2.5 flex items-center gap-3 text-sm">
                    <span className="font-mono text-xs text-slate-400 w-8">{t.id}</span>
                    <span className="flex-1 text-slate-700">{t.name}</span>
                    <Tag>{t.owner === 'TEACHER' ? '教师填报' : '学校系统'}</Tag>
                    <Tag color={done ? 'success' : 'default'}>{done ? '已上传' : '未上传'}</Tag>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Drawer>

      <CreateTask
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(t) => {
          setCustom([t, ...custom]);
          setCreating(false);
          setTask(t.id);
          msg.success('评价任务已创建;发布后各专业即可开始自评');
        }}
      />
    </div>
  );
}

function CreateTask({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (t: { id: string; name: string; period: string; start: string; end: string; majors: string[] }) => void }) {
  const [form] = Form.useForm();
  return (
    <Modal title="新建评价任务" open={open} onCancel={onClose} onOk={() => form.submit()} okText="创建" cancelText="取消" width={600}>
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{ majors: MAJORS.map((m) => m.name) }}
        onFinish={(v: { name: string; period: string; range: [{ format: (f: string) => string }, { format: (f: string) => string }]; majors: string[] }) => {
          onCreate({ id: `C${Date.now()}`, name: v.name, period: v.period, start: v.range[0].format('YYYY-MM-DD'), end: v.range[1].format('YYYY-MM-DD'), majors: v.majors });
          form.resetFields();
        }}
      >
        <Form.Item label="任务名称" name="name" rules={[{ required: true, message: '请输入任务名称' }]}>
          <Input placeholder="例:2027-2028 学年专业评价" />
        </Form.Item>
        <Form.Item label="评价学年" name="period" rules={[{ required: true, message: '请输入评价学年' }]}>
          <Input placeholder="例:2027-2028 学年" />
        </Form.Item>
        <Form.Item label="自评起止日期" name="range" rules={[{ required: true, message: '请选择起止日期' }]}>
          <DatePicker.RangePicker className="w-full" />
        </Form.Item>
        <Form.Item label="参评专业" name="majors" rules={[{ required: true, message: '至少选择一个专业' }]} extra="可评价的专业数受账号配额限制">
          <Select mode="multiple" options={MAJORS.map((m) => ({ value: m.name, label: `${m.name}(${m.college})` }))} maxTagCount={6} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
