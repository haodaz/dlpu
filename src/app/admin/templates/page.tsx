'use client';
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Row, Col, Statistic, Segmented } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CopyOutlined,
  ProfileOutlined, AppstoreOutlined,
} from '@ant-design/icons';

const categoryMap: Record<string, { color: string; text: string }> = {
  mission: { color: 'blue', text: '使命型' },
  future: { color: 'purple', text: '未来型' },
  shared: { color: 'default', text: '通用' },
};

const statusMap: Record<string, { color: string; text: string }> = {
  published: { color: 'success', text: '已发布' },
  draft: { color: 'default', text: '草稿' },
  deprecated: { color: 'warning', text: '已废弃' },
};

const mockTemplates = [
  { id: 'TPL-01', name: '产业链图谱模板', category: 'mission', indicators: 8, version: 'v2.3', status: 'published', updatedAt: '2026-09-01' },
  { id: 'TPL-02', name: '能力矩阵模板', category: 'shared', indicators: 12, version: 'v3.1', status: 'published', updatedAt: '2026-08-25' },
  { id: 'TPL-03', name: '师资投入模板', category: 'mission', indicators: 6, version: 'v1.5', status: 'published', updatedAt: '2026-08-12' },
  { id: 'TPL-04', name: '产教融合基地模板', category: 'mission', indicators: 7, version: 'v2.0', status: 'published', updatedAt: '2026-07-30' },
  { id: 'TPL-05', name: '校友追踪模板', category: 'shared', indicators: 5, version: 'v1.2', status: 'published', updatedAt: '2026-07-15' },
  { id: 'TPL-06', name: '第四代大学特征模板', category: 'future', indicators: 9, version: 'v0.3', status: 'draft', updatedAt: '2026-09-10' },
  { id: 'TPL-07', name: '教育形态重构力模板', category: 'future', indicators: 6, version: 'v0.1', status: 'draft', updatedAt: '2026-09-08' },
];

export default function AdminTemplatesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: '模板ID', dataIndex: 'id', key: 'id', width: 100,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '模板名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '所属体系', dataIndex: 'category', key: 'category', width: 110,
      render: (v: string) => {
        const c = categoryMap[v];
        return <Tag color={c.color}>{c.text}</Tag>;
      } },
    { title: '指标数', dataIndex: 'indicators', key: 'indicators', width: 90, sorter: true },
    { title: '版本', dataIndex: 'version', key: 'version', width: 100,
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v];
        return <Tag color={s.color}>{s.text}</Tag>;
      } },
    { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 130 },
    { title: '操作', key: 'action', width: 260, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>预览</Button>
          <Button type="link" size="small" icon={<EditOutlined />} disabled={record.status === 'deprecated'}>编辑</Button>
          <Button type="link" size="small" icon={<CopyOutlined />}>克隆</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={record.status === 'published'}>删除</Button>
        </Space>
      )},
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="模板总数" value={7} prefix={<ProfileOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="已发布" value={5} valueStyle={{ color: '#10b981' }} prefix={<AppstoreOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="草稿" value={2} valueStyle={{ color: '#94a3b8' }} prefix={<EditOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="关联指标数" value={53} prefix={<ProfileOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="模板列表"
        extra={
          <Space>
            <Segmented
              options={[
                { label: '全部', value: 'all' },
                { label: '使命型', value: 'mission' },
                { label: '未来型', value: 'future' },
                { label: '通用', value: 'shared' },
              ]}
            />
            <Input placeholder="搜索模板名称" style={{ width: 200 }} allowClear />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新建模板</Button>
          </Space>
        }
      >
        <Table
          dataSource={mockTemplates}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新建指标模板"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => { form.submit(); setModalOpen(false); }}
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="模板名称" name="name" rules={[{ required: true, message: '请输入模板名称' }]}>
            <Input placeholder="例：产业链图谱模板" />
          </Form.Item>
          <Form.Item label="所属体系" name="category" rules={[{ required: true, message: '请选择所属体系' }]}>
            <Segmented
              options={[
                { label: '使命型', value: 'mission' },
                { label: '未来型', value: 'future' },
                { label: '通用', value: 'shared' },
              ]}
            />
          </Form.Item>
          <Form.Item label="版本号" name="version" rules={[{ required: true, message: '请输入版本号' }]}>
            <Input placeholder="例：v1.0" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="模板用途说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
