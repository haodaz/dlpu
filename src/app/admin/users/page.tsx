'use client';
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Modal, Form, Row, Col, Statistic, Segmented, Switch } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
  UserOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined,
} from '@ant-design/icons';

const roleMap: Record<string, { color: string; text: string }> = {
  admin: { color: 'purple', text: '管理员' },
  reviewer: { color: 'cyan', text: '复核员' },
  submitter: { color: 'blue', text: '填报员' },
  viewer: { color: 'default', text: '只读者' },
};

const mockUsers = [
  { id: 'U001', name: '郝壮', email: 'hao@dlpu.edu.cn', department: '教务处', role: 'admin', status: 'active', lastLogin: '2026-09-16 08:30' },
  { id: 'U002', name: '张三', email: 'zhang@dlpu.edu.cn', department: '机械工程学院', role: 'submitter', status: 'active', lastLogin: '2026-09-13 14:32' },
  { id: 'U003', name: '李四', email: 'li@dlpu.edu.cn', department: '信息工程学院', role: 'reviewer', status: 'active', lastLogin: '2026-09-13 10:15' },
  { id: 'U004', name: '王五', email: 'wang@dlpu.edu.cn', department: '纺织服装学院', role: 'submitter', status: 'disabled', lastLogin: '2026-08-30 09:08' },
  { id: 'U005', name: '赵六', email: 'zhao@dlpu.edu.cn', department: '材料科学与工程学院', role: 'viewer', status: 'active', lastLogin: '2026-09-11 11:42' },
];

export default function AdminUsersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: '用户ID', dataIndex: 'id', key: 'id', width: 100,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 100,
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '所属部门', dataIndex: 'department', key: 'department', width: 180 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 110,
      render: (v: string) => {
        const r = roleMap[v];
        return <Tag color={r.color}>{r.text}</Tag>;
      } },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => v === 'active'
        ? <Tag color="success">启用</Tag>
        : <Tag color="default">禁用</Tag> },
    { title: '最近登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 160 },
    { title: '操作', key: 'action', width: 240, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" icon={<KeyOutlined />}>权限</Button>
          <Button
            type="link"
            size="small"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
          >
            {record.status === 'active' ? '禁用' : '启用'}
          </Button>
        </Space>
      )},
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="用户总数" value={5} prefix={<UserOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="管理员" value={1} valueStyle={{ color: '#7c3aed' }} prefix={<KeyOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="复核员" value={1} valueStyle={{ color: '#06b6d4' }} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="填报员" value={2} valueStyle={{ color: '#1677ff' }} prefix={<UserOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="用户列表"
        extra={
          <Space>
            <Input
              placeholder="搜索姓名/邮箱"
              prefix={<UserOutlined />}
              style={{ width: 220 }}
              allowClear
            />
            <Select
              placeholder="角色筛选"
              style={{ width: 140 }}
              allowClear
              options={[
                { value: 'admin', label: '管理员' },
                { value: 'reviewer', label: '复核员' },
                { value: 'submitter', label: '填报员' },
                { value: 'viewer', label: '只读者' },
              ]}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增用户</Button>
          </Space>
        }
      >
        <Table
          dataSource={mockUsers}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 角色权限矩阵 */}
      <Card title="角色权限矩阵" className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <Table
          size="small"
          pagination={false}
          dataSource={[
            { key: '1', permission: '查看大屏', admin: true, reviewer: true, submitter: true, viewer: true },
            { key: '2', permission: '管理任务', admin: true, reviewer: false, submitter: false, viewer: false },
            { key: '3', permission: '复核报告', admin: true, reviewer: true, submitter: false, viewer: false },
            { key: '4', permission: '提交填报', admin: true, reviewer: true, submitter: true, viewer: false },
            { key: '5', permission: '管理用户', admin: true, reviewer: false, submitter: false, viewer: false },
            { key: '6', permission: '导出报告', admin: true, reviewer: true, submitter: false, viewer: false },
          ]}
          columns={[
            { title: '权限', dataIndex: 'permission', key: 'permission', width: 200,
              render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
            { title: '管理员', dataIndex: 'admin', key: 'admin', width: 120, render: (v: boolean) => v ? <Tag color="purple">允许</Tag> : <span className="text-slate-300">-</span> },
            { title: '复核员', dataIndex: 'reviewer', key: 'reviewer', width: 120, render: (v: boolean) => v ? <Tag color="cyan">允许</Tag> : <span className="text-slate-300">-</span> },
            { title: '填报员', dataIndex: 'submitter', key: 'submitter', width: 120, render: (v: boolean) => v ? <Tag color="blue">允许</Tag> : <span className="text-slate-300">-</span> },
            { title: '只读者', dataIndex: 'viewer', key: 'viewer', width: 120, render: (v: boolean) => v ? <Tag>允许</Tag> : <span className="text-slate-300">-</span> },
          ]}
        />
      </Card>

      <Modal
        title="新增用户"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => { form.submit(); setModalOpen(false); }}
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
            <Input placeholder="example@dlpu.edu.cn" />
          </Form.Item>
          <Form.Item label="所属部门" name="department" rules={[{ required: true, message: '请选择部门' }]}>
            <Select options={[
              { value: 'jwc', label: '教务处' },
              { value: 'mechanical', label: '机械工程学院' },
              { value: 'info', label: '信息工程学院' },
            ]} />
          </Form.Item>
          <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
            <Select options={[
              { value: 'admin', label: '管理员' },
              { value: 'reviewer', label: '复核员' },
              { value: 'submitter', label: '填报员' },
              { value: 'viewer', label: '只读者' },
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
