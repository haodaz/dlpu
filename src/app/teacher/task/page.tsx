'use client';
import React, { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Tag, Upload, message } from 'antd';
import { CheckCircleFilled, CloudUploadOutlined, EditOutlined, FileTextOutlined, InboxOutlined, PaperClipOutlined, RobotOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { DEMO_TEACHER } from '@/lib/diagnosis';
import { setFilingStatus } from '@/lib/filing';
import { CURRENT_TASK, EVAL_TASKS } from '@/lib/eval-tasks';
import { useMyWorks, useUploads, workDone, WORK_STATUS, type MyWork } from '@/lib/teacher-work';
import { TaskHeader, useTaskParam } from '@/components/eval/TaskBar';

// 教师 · 评价任务:列出这次评价需要本人提交的全部资料,各自的进度与审核意见;可查看要求与范本、上传、按意见修改后再上传
export default function Page() {
  return (
    <Suspense fallback={null}>
      <TeacherTask />
    </Suspense>
  );
}

function TeacherTask() {
  const [task, setTask] = useTaskParam(CURRENT_TASK);
  const works = useMyWorks(task);
  const editable = task.id === CURRENT_TASK.id;
  const done = works.filter(workDone).length;
  const fix = works.filter((w) => w.status === 'supplement').length;
  const major = DEMO_TEACHER.majors[0];

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-5">
      <TaskHeader
        title="评价任务"
        desc={`${major.name} · ${major.role} · 这次评价需要您本人提交 ${works.length} 份资料,其余由学校系统与 AI 准备`}
        task={task}
        onTask={setTask}
        tasks={EVAL_TASKS.filter((t) => t.state !== 'draft')}
      />

      <div data-spec="teacher-progress" className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 flex items-center gap-6 flex-wrap">
        <div>
          <div className="text-xs text-slate-400">我的完成进度</div>
          <div className="text-3xl font-black text-slate-800 mt-1">
            {done}
            <span className="text-base text-slate-400 font-normal">/{works.length}</span>
          </div>
        </div>
        <div className="flex-1 min-w-[12rem]">
          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden flex">
            {works.map((w) => (
              <div key={w.indicatorId} className="h-full border-r border-white last:border-0" style={{ width: `${100 / works.length}%`, backgroundColor: w.status === 'submitted' ? '#10b981' : w.status === 'pending' ? '#22d3ee' : w.status === 'supplement' ? '#f87171' : w.status === 'in-progress' ? '#93c5fd' : '#e2e8f0' }} />
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500 flex-wrap">
            {(['submitted', 'pending', 'supplement', 'in-progress', 'not-started'] as const).map((s) => {
              const n = works.filter((w) => w.status === s).length;
              return n ? (
                <span key={s}>
                  {WORK_STATUS[s].label} {n}
                </span>
              ) : null;
            })}
          </div>
        </div>
        <div className="text-sm text-slate-500">
          {editable ? (
            <>
              自评截止 <b className="text-slate-700">{task.end}</b>
              {fix > 0 && <div className="text-red-500 font-bold mt-1">{fix} 份需按意见修改</div>}
            </>
          ) : (
            '已结束 · 只读'
          )}
        </div>
      </div>

      <div data-spec="teacher-task" className="space-y-3">
        {works.map((w, i) => (
          <WorkCard key={w.indicatorId} no={i + 1} work={w} editable={editable} />
        ))}
      </div>
    </div>
  );
}

function WorkCard({ no, work, editable }: { no: number; work: MyWork; editable: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(work.status === 'supplement');
  const [uploading, setUploading] = useState(false);
  const [uploads, addUploads] = useUploads();
  const files = uploads[work.indicatorId] ?? [];
  const st = WORK_STATUS[work.status];
  const canUpload = editable && work.status !== 'submitted';

  return (
    <div className={`rounded-2xl bg-white border shadow-sm overflow-hidden ${work.status === 'supplement' ? 'border-red-200' : 'border-slate-200'}`}>
      <div className="p-5 flex items-start gap-4 flex-wrap">
        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center shrink-0">
          {work.status === 'submitted' ? <CheckCircleFilled className="text-emerald-500 text-lg" /> : no}
        </span>
        <div className="flex-1 min-w-[14rem]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-slate-800">{work.kind}</span>
            <Tag color={st.color}>{st.label}</Tag>
            <span className="text-xs text-slate-400">预计 {work.effort}</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">范本:{work.templateName}</div>
          {work.feedback && (
            <div className={`mt-2 text-sm rounded-lg px-3 py-2 ${work.status === 'supplement' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-600'}`}>
              <b>审核意见:</b>
              {work.feedback}
            </div>
          )}
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((f, k) => (
                <span key={k} className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                  <PaperClipOutlined /> {f.name} <span className="text-slate-400">· {f.at}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button icon={open ? <UpOutlined /> : <DownOutlined />} onClick={() => setOpen((v) => !v)}>
            要求与范本
          </Button>
          {canUpload && (
            <Button icon={<CloudUploadOutlined />} type={work.status === 'not-started' || work.status === 'supplement' ? 'primary' : 'default'} onClick={() => setUploading(true)}>
              {work.status === 'supplement' ? '修改后重新上传' : files.length ? '继续上传' : '上传资料'}
            </Button>
          )}
          {canUpload && (
            <Button icon={<EditOutlined />} onClick={() => router.push(`/data-management/ai-prefill/detail?indicator=${work.indicatorId}`)}>
              在线填写
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50/60 p-5 grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-5">
          <div>
            <div className="text-sm font-bold text-slate-700 mb-2">做到这几点算达标</div>
            <ul className="m-0 pl-0 list-none space-y-2">
              {work.standard.map((s) => (
                <li key={s} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircleFilled className="mt-1 shrink-0" style={{ color: '#10b981' }} />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <button onClick={() => router.push(`/templates/${work.templateId}`)} className="w-full text-left rounded-xl border border-slate-200 bg-white p-3 hover:border-blue-400">
              <div className="text-sm font-bold text-slate-800">
                <FileTextOutlined className="text-blue-600" /> {work.templateName}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">填写示例 + 往届优秀范本</div>
            </button>
            <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3 text-xs text-violet-800 leading-relaxed">
              <RobotOutlined className="mr-1" />
              {work.aiAssist}
            </div>
          </div>
        </div>
      )}
      <UploadModal
        open={uploading}
        title={`上传 · ${work.kind}`}
        onClose={() => setUploading(false)}
        onDone={(names) => {
          addUploads(work.indicatorId, names);
          setFilingStatus(work.indicatorId, 'pending');
          setUploading(false);
        }}
      />
    </div>
  );
}

function UploadModal({ open, title, onClose, onDone }: { open: boolean; title: string; onClose: () => void; onDone: (names: string[]) => void }) {
  const [names, setNames] = useState<string[]>([]);
  const [msg, holder] = message.useMessage();
  return (
    <Modal
      title={title}
      open={open}
      onCancel={() => {
        setNames([]);
        onClose();
      }}
      okText="提交审核"
      cancelText="取消"
      okButtonProps={{ disabled: !names.length }}
      onOk={() => {
        onDone(names);
        setNames([]);
        msg.success('已提交,等待专业负责人审核');
      }}
    >
      {holder}
      <Upload.Dragger
        multiple
        beforeUpload={(f) => {
          setNames((n) => [...n, f.name]);
          return false;
        }}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到这里</p>
        <p className="ant-upload-hint">支持 Word / PDF / Excel / 图片,可一次选多个</p>
      </Upload.Dragger>
      {names.length > 0 && (
        <div className="mt-3 space-y-1">
          {names.map((n, i) => (
            <div key={i} className="text-sm text-slate-600">
              <PaperClipOutlined /> {n}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400 mt-3 mb-0">演示环境:只记录文件名,文件不会上传到服务器。</p>
    </Modal>
  );
}
