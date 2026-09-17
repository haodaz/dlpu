'use client';
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Row, Col, Statistic, Segmented, Badge } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, LinkOutlined,
  CloudServerOutlined, ApiOutlined, DatabaseOutlined, CheckCircleOutlined, SyncOutlined,
} from '@ant-design/icons';

const typeMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  rest: { color: 'blue', text: 'REST API', icon: <ApiOutlined /> },
  database: { color: 'green', text: '数据库', icon: <DatabaseOutlined /> },
  file: { color: 'orange', text: '文件接口', icon: <CloudServerOutlined /> },
  webhooks: { color: 'purple', text: 'Webhook', icon: <LinkOutlined /> },
};

const mockDataSources = [
  { id: 'DS-01', name: '教育部学科评估数据', type: 'rest', endpoint: 'https://api.moe.gov.cn/csa/v1', indicator: 'M01 产业链图谱', status: 'online', lastSync: '2026-09-16 03:00', frequency: '每日' },
  { id: 'DS-02', name: '科技部项目库', type: 'rest', endpoint: 'https://api.most.gov.cn/projects', indicator: 'M07 教师产业实践', status: 'online', lastSync: '2026-09-16 03:00', frequency: '每日' },
  { id: 'DS-03', name: '专利数据库 (CNIPA)', type: 'database', endpoint: 'jdbc:postgresql://cnipa.internal', indicator: 'F03 跨界融合度', status: 'online', lastSync: '2026-09-15 22:00', frequency: '每日' },
  { id: 'DS-04', name: '企业工商信息', type: 'rest', endpoint: 'https://api.qcc.com/v2/company', indicator: 'M02 课程对接产业率', status: 'degraded', lastSync: '2026-09-16 03:00', frequency: '每日' },
  { id: 'DS-05', name: '校友职业轨迹 (LinkedIn)', type: 'webhooks', endpoint: 'webhook://linkedin/in/trajectory', indicator: 'M09 校友追踪', status: 'offline', lastSync: '2026-09-10 03:00', frequency: '每周' },
  { id: 'DS-06', name: '高德人才地图', type: 'file', endpoint: 's3://talent-map/daily.json', indicator: 'F01 产业趋势引领度', status: 'online', lastSync: '2026-09-16 06:00', frequency: '每日' },
];

const statusMap: Record<string, { status: 'success' | 'processing' | 'error' | 'default'; text: string }> = {
  online: { status: 'success', text: '正常' },
  degraded: { status: 'processing', text: '降级' },
  offline: { status: 'error', text: '离线' },
};

export default function AdminDataSourcesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    { title: '数据源ID', dataIndex: 'id', key: 'id', width: 100,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '数据源名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', width: 130,
      render: (v: string) => {
        const t = typeMap[v];
        return <Tag color={t.color} icon={t.icon}>{t.text}</Tag>;
      } },
    { title: '接入端点', dataIndex: 'endpoint', key: 'endpoint', width: 280,
      render: (v: string) => <span className="font-mono text-xs text-slate-500 break-all">{v}</span> },
    { title: '关联指标', dataIndex: 'indicator', key: 'indicator', width: 180,
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v];
        return <Badge status={s.status} text={s.text} />;
      } },
    { title: '同步频率', dataIndex: 'frequency', key: 'frequency', width: 90 },
    { title: '最近同步', dataIndex: 'lastSync', key: 'lastSync', width: 160 },
    { title: '操作', key: 'action', width: 220, fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<SyncOutlined />}>同步</Button>
          <Button type="link" size="small" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={record.status === 'online'}>删除</Button>
        </Space>
      )},
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="数据源总数" value={6} prefix={<CloudServerOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="正常" value={4} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="降级/离线" value={2} valueStyle={{ color: '#f59e0b' }} prefix={<SyncOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="同步任务/日" value={6} prefix={<ApiOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="外部数据源列表"
        extra={
          <Space>
            <Segmented
              options={[
                { label: '全部', value: 'all' },
                { label: 'REST API', value: 'rest' },
                { label: '数据库', value: 'database' },
                { label: '文件', value: 'file' },
                { label: 'Webhook', value: 'webhooks' },
              ]}
            />
            <Input placeholder="搜索数据源名称" style={{ width: 200 }} allowClear />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>接入数据源</Button>
          </Space>
        }
      >
        <Table
          dataSource={mockDataSources}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="接入外部数据源"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => { form.submit(); setModalOpen(false); }}
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="数据源名称" name="name" rules={[{ required: true, message: '请输入数据源名称' }]}>
            <Input placeholder="例：教育部学科评估数据" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
            <Segmented
              options={[
                { label: 'REST API', value: 'rest' },
                { label: '数据库', value: 'database' },
                { label: '文件', value: 'file' },
                { label: 'Webhook', value: 'webhooks' },
              ]}
            />
          </Form.Item>
          <Form.Item label="接入端点" name="endpoint" rules={[{ required: true, message: '请输入接入端点' }]}>
            <Input placeholder="https://api.example.com/v1 或 jdbc:postgresql://host/db" />
          </Form.Item>
          <Form.Item label="关联指标" name="indicator" rules={[{ required: true, message: '请输入关联指标' }]}>
            <Input placeholder="例：M01 产业链图谱完整度" />
          </Form.Item>
          <Form.Item label="同步频率" name="frequency" rules={[{ required: true, message: '请选择同步频率' }]}>
            <Segmented
              options={[
                { label: '每小时', value: 'hourly' },
                { label: '每日', value: 'daily' },
                { label: '每周', value: 'weekly' },
                { label: '手动', value: 'manual' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
