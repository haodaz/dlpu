'use client';
import React, { useEffect, useState } from 'react';
import { MAJORS, VIEW_GROUP_META, type ViewGroup } from '@/lib/diagnosis';
import { useQuotas, useViewVisibility, type Quotas } from '@/lib/diagnosis-state';
import type { RunSummary } from '@/lib/industry-report/runs';
import { Card, Table, Tag, Button, Input, Select, Space, Modal, Form, Row, Col, Statistic, Switch, Progress, InputNumber, Segmented, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, KeyOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined, ApartmentOutlined } from '@ant-design/icons';

// 用户与权限:统筹院校治理工作台的角色体系
//   版本配额:学校版 / 院系版功能完全相同,只差可评价的专业数和可生成报告的产业数(由平台按合同设置)
//   角色:学校管理员看全部专业;院系管理员只看本院系专业;专业负责人与教师只看自己负责的专业
const roleMap: Record<string, { color: string; text: string; scope: string }> = {
  school_admin: { color: 'purple', text: '学校管理员', scope: '全部专业' },
  college_admin: { color: 'geekblue', text: '院系管理员', scope: '本院系专业' },
  major_lead: { color: 'cyan', text: '专业负责人', scope: '负责的专业' },
  teacher: { color: 'blue', text: '教师', scope: '任教的专业' },
  leader: { color: 'default', text: '校领导(只读)', scope: '全部专业 · 只读' },
};
const ROLE_OPTIONS = Object.entries(roleMap).map(([value, r]) => ({ value, label: r.text }));

const mockUsers = [
  { id: 'U001', name: '郝壮', email: 'hao@dlpu.edu.cn', department: '教务处', role: 'school_admin', status: 'active', lastLogin: '2026-10-21 08:30' },
  { id: 'U002', name: '张三', email: 'zhang@dlpu.edu.cn', department: '机械工程与自动化学院', role: 'college_admin', status: 'active', lastLogin: '2026-10-20 14:32' },
  { id: 'U003', name: '李四', email: 'li@dlpu.edu.cn', department: '机械工程与自动化学院 · 智能制造工程', role: 'major_lead', status: 'active', lastLogin: '2026-10-20 10:15' },
  { id: 'U004', name: '王五', email: 'wang@dlpu.edu.cn', department: '机械工程与自动化学院 · 智能制造工程', role: 'teacher', status: 'active', lastLogin: '2026-10-19 09:08' },
  { id: 'U005', name: '赵六', email: 'zhao@dlpu.edu.cn', department: '纺织与材料工程学院', role: 'teacher', status: 'disabled', lastLogin: '2026-08-30 11:42' },
  { id: 'U006', name: '钱七', email: 'qian@dlpu.edu.cn', department: '校办', role: 'leader', status: 'active', lastLogin: '2026-10-18 16:20' },
];

const PERMISSIONS: { key: string; permission: string; roles: string[] }[] = [
  { key: '1', permission: '宏观决策分析', roles: ['school_admin', 'leader'] },
  { key: '2', permission: '创建与管理评价任务', roles: ['school_admin', 'college_admin'] },
  { key: '3', permission: '查看评价结果与诊断', roles: ['school_admin', 'college_admin', 'major_lead', 'teacher', 'leader'] },
  { key: '4', permission: '派发与跟踪整改', roles: ['school_admin', 'college_admin', 'major_lead'] },
  { key: '5', permission: '提交自评资料', roles: ['major_lead', 'teacher'] },
  { key: '6', permission: '生成产业分析报告', roles: ['school_admin', 'college_admin', 'major_lead'] },
  { key: '7', permission: '配置模板与数据源', roles: ['school_admin', 'college_admin'] },
  { key: '8', permission: '数据下载', roles: ['school_admin', 'college_admin'] },
  { key: '9', permission: '管理用户', roles: ['school_admin', 'college_admin'] },
];

export default function AdminUsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const count = (r: string) => mockUsers.filter((u) => u.role === r).length;

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id', width: 90, render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 90, render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 190 },
    { title: '所属部门 / 专业', dataIndex: 'department', key: 'department', width: 260 },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (v: string) => <Tag color={roleMap[v].color}>{roleMap[v].text}</Tag>,
    },
    { title: '数据范围', dataIndex: 'role', key: 'scope', width: 140, render: (v: string) => <span className="text-xs text-slate-500">{roleMap[v].scope}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (v: string) => (v === 'active' ? <Tag color="success">启用</Tag> : <Tag>禁用</Tag>) },
    { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 150 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, record: (typeof mockUsers)[number]) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" size="small" danger={record.status === 'active'} icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}>
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <QuotaCard />
      <ViewVisibilityCard />
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="用户总数" value={mockUsers.length} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="学校 / 院系管理员" value={count('school_admin') + count('college_admin')} styles={{ content: { color: '#7c3aed' } }} prefix={<KeyOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="专业负责人" value={count('major_lead')} styles={{ content: { color: '#06b6d4' } }} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="教师" value={count('teacher')} styles={{ content: { color: '#1677ff' } }} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="用户列表"
        extra={
          <Space wrap>
            <Input placeholder="搜索姓名/邮箱" prefix={<UserOutlined />} style={{ width: 200 }} allowClear />
            <Select placeholder="角色筛选" style={{ width: 150 }} allowClear options={ROLE_OPTIONS} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              新增用户
            </Button>
          </Space>
        }
      >
        <Table dataSource={mockUsers} columns={columns} rowKey="id" scroll={{ x: 1300 }} pagination={{ pageSize: 10 }} />
        <p className="text-xs text-slate-400 mt-3 mb-0">账号与院校治理工作台统一;接入统一身份认证后,用户从学校账号体系同步,这里只分配角色与数据范围。</p>
      </Card>

      <Card title="角色权限矩阵" className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <Table
          size="small"
          pagination={false}
          scroll={{ x: 820 }}
          dataSource={PERMISSIONS}
          columns={[
            { title: '权限', dataIndex: 'permission', key: 'permission', width: 180, fixed: 'left', render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
            ...Object.entries(roleMap).map(([k, r]) => ({
              title: r.text,
              key: k,
              width: 120,
              render: (_: unknown, row: (typeof PERMISSIONS)[number]) => (row.roles.includes(k) ? <Tag color={r.color}>允许</Tag> : <span className="text-slate-300">-</span>),
            })),
          ]}
        />
      </Card>

      <Modal title="新增用户" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => { form.submit(); setModalOpen(false); }} width={500}>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
            <Input placeholder="example@dlpu.edu.cn" />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item label="数据范围(院系 / 专业)" name="scope">
            <Select
              mode="multiple"
              placeholder="学校管理员与校领导可不选"
              options={Array.from(new Set(MAJORS.map((m) => m.college))).map((c) => ({
                label: c,
                options: MAJORS.filter((m) => m.college === c).map((m) => ({ value: m.name, label: m.name })),
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 版本配额:学校版 / 院系版功能相同,只差可评价专业数与可生成报告的产业数
function QuotaCard() {
  const [quotas, setQuotas] = useQuotas();
  const [industries, setIndustries] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Quotas>(quotas);
  useEffect(() => {
    fetch('/api/industry-log')
      .then((r) => (r.ok ? r.json() : { runs: [] }))
      .then((d) => setIndustries(new Set(((d.runs ?? []) as RunSummary[]).filter((r) => r.status === 'done').map((r) => r.input.industry)).size))
      .catch(() => setIndustries(0));
  }, []);
  const majors = MAJORS.length;
  const bar = (used: number, limit: number) => <Progress percent={Math.min(100, Math.round((used / limit) * 100))} status={used > limit ? 'exception' : 'normal'} format={() => `${used} / ${limit}`} />;

  return (
    <Card
      data-spec="quota"
      className="shadow-sm"
      title={
        <span>
          <ApartmentOutlined /> 版本与配额
        </span>
      }
      extra={
        <Tooltip title="配额由平台按合同设置;演示环境可直接修改">
          <Button
            size="small"
            onClick={() => {
              setDraft(quotas);
              setEditing(true);
            }}
          >
            调整配额
          </Button>
        </Tooltip>
      }
      styles={{ body: { padding: 20 } }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
        <div>
          <div className="text-xs text-slate-500">当前版本</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{quotas.edition === 'school' ? '学校版' : '院系版'}</div>
          <div className="text-xs text-slate-400 mt-1">学校版与院系版功能完全相同,只差下面两项配额</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">可评价的专业数</div>
          {bar(majors, quotas.majors)}
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-1">可生成报告的产业数</div>
          {industries === null ? <span className="text-xs text-slate-400">统计中…</span> : bar(industries, quotas.industries)}
        </div>
      </div>
      <Modal title="调整版本与配额" open={editing} onCancel={() => setEditing(false)} onOk={() => { setQuotas(draft); setEditing(false); }}>
        <div className="space-y-4 mt-4">
          <div>
            <div className="text-sm text-slate-600 mb-1">版本</div>
            <Segmented
              value={draft.edition}
              onChange={(v) => setDraft({ ...draft, edition: v as Quotas['edition'] })}
              options={[
                { label: '学校版', value: 'school' },
                { label: '院系版', value: 'college' },
              ]}
            />
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">可评价的专业数</div>
            <InputNumber min={1} max={500} value={draft.majors} onChange={(v) => setDraft({ ...draft, majors: Number(v) || 1 })} />
          </div>
          <div>
            <div className="text-sm text-slate-600 mb-1">可生成报告的产业数</div>
            <InputNumber min={1} max={200} value={draft.industries} onChange={(v) => setDraft({ ...draft, industries: Number(v) || 1 })} />
          </div>
        </div>
      </Modal>
    </Card>
  );
}

// 三视角可见范围:管理员内部的三类页面视角由教务部门自行开关(先做前端显隐,后接权限)
function ViewVisibilityCard() {
  const [visible, setVisible] = useViewVisibility();
  const groups = Object.keys(VIEW_GROUP_META) as ViewGroup[];
  return (
    <Card data-spec="view-visibility" className="shadow-sm" title="管理员视角可见范围" styles={{ body: { padding: 16 } }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {groups.map((g) => (
          <div key={g} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div>
              <div className="font-bold text-slate-700">{VIEW_GROUP_META[g].label}</div>
              <div className="text-xs text-slate-400">面向 {VIEW_GROUP_META[g].audience}</div>
            </div>
            <Switch checked={visible[g]} disabled={visible[g] && groups.filter((x) => visible[x]).length === 1} onChange={(v) => setVisible({ ...visible, [g]: v })} />
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-3 mb-0">关闭后,该视角从管理员菜单中隐藏(至少保留一个)。当前为前端显隐,接入统一权限后按账号生效。</p>
    </Card>
  );
}
