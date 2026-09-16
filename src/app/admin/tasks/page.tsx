'use client';
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Modal, Form, DatePicker, Row, Col, Statistic, Segmented } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ScheduleOutlined, ClockCircleOutlined, CheckCircleOutlined, PlayCircleOutlined,
} from '@ant-design/icons';

const statusMap: Record<string, { color: string; text: string }> = {
  draft: { color: 'default', text: '草稿' },
  published: { color: 'processing', text: '进行中' },
  ended: { color: 'success', text: '已结束' },
  archived: { color: 'default', text: '已归档' },
};

const mockTasks = [
  { id: 'TASK-2026-S01', name: '2026 春季专业评价任务', period: '2026-03 ~ 2026-09', targetUsers: 248, submitted: 186, status: 'published', deadline: '2026-09-15' },
  { id: 'TASK-2025-A01', name: '2025 秋季专业评价任务', period: '2025-09 ~ 2026-01', targetUsers: 232, submitted: 224, status: 'ended', deadline: '2026-01-15' },
  { id: 'TASK-2025-S01', name: '2025 春季专业评价任务', period: '2025-03 ~ 2025-09', targetUsers: 220, submitted: 218, status: 'archived', deadline: '2025-09-15' },
  { id: 'TASK-2026-S02', name: '2026 春季专项诊断（试点）', period: '2026-04 ~ 2026-06', targetUsers: 30, submitted: 0, status: 'draft', deadline: '2026-06-30' },
];

export default function AdminTasksPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: '任务ID', dataIndex: 'id', key: 'id', width: 150,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '任务名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '评价周期', dataIndex: 'period', key: 'period', width: 200 },
    { title: '覆盖用户', dataIndex: 'targetUsers', key: 'targetUsers', width: 100,
      render: (v: number) => <span className="text-slate-700">{v} 人</span> },
    { title: '已提交', dataIndex: 'submitted', key: 'submitted', width: 110,
      render: (v: number, record: any) => {
        const rate = record.targetUsers ? Math.round((v / record.targetUsers) * 100) : 0;
        return (
          <div>
            <span className="font-bold text-blue-600">{v}</span>
            <span className="text-slate-400 mx-1">/</span>
            <span className="text-xs text-slate-500">{rate}%</span>
          </div>
        );
      } },
    { title: '截止时间', dataIndex: 'deadline', key: 'deadline', width: 130 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v];
        return <Tag color={s.color}>{s.text}</Tag>;
      } },
    { title: '操作', key: 'action', width: 200, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} disabled={record.status === 'archived'}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={record.status !== 'draft'}>删除</Button>
        </Space>
      )},
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="任务总数" value={4} prefix={<ScheduleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="进行中" value={1} valueStyle={{ color: '#1677ff' }} prefix={<PlayCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="已结束" value={2} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="草稿" value={1} valueStyle={{ color: '#94a3b8' }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title={
          <div className="flex items-center justify-between">
            <span>任务列表</span>
            <Space>
              <Segmented
                options={[
                  { label: '全部', value: 'all' },
                  { label: '进行中', value: 'published' },
                  { label: '已结束', value: 'ended' },
                  { label: '草稿', value: 'draft' },
                ]}
              />
            </Space>
          </div>
        }
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建任务</Button>}
      >
        <Table
          dataSource={mockTasks}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建评价任务"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => {
          form.submit();
          setModalOpen(false);
        }}
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="任务名称" name="name" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input placeholder="例：2026 秋季专业评价任务" />
          </Form.Item>
          <Form.Item label="评价周期" name="period" rules={[{ required: true, message: '请选择评价周期' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="截止时间" name="deadline" rules={[{ required: true, message: '请选择截止时间' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="覆盖范围" name="scope">
            <Select
              mode="multiple"
              placeholder="选择参与的学院/用户组"
              options={[
                { value: 'mechanical', label: '机械工程学院' },
                { value: 'info', label: '信息工程学院' },
                { value: 'textile', label: '纺织服装学院' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
