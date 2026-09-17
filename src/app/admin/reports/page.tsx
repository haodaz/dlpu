'use client';
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Row, Col, Statistic, Segmented } from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  EyeOutlined, DownloadOutlined, ReloadOutlined, SearchOutlined,
} from '@ant-design/icons';

const statusMap: Record<string, { color: string; text: string }> = {
  done: { color: 'success', text: '已完成' },
  reviewing: { color: 'processing', text: '评价中' },
  submitted: { color: 'warning', text: '待评价' },
  abnormal: { color: 'error', text: '异常' },
};

const mockData = [
  { id: 'RPT-2026-001', title: '机械工程 - 2026 春季期中诊断', department: '机械工程学院', user: '张三', score: 78, status: 'done', submittedAt: '2026-09-13 14:32' },
  { id: 'RPT-2026-002', title: '通信工程 - 产教融合专评', department: '信息工程学院', user: '李四', score: 0, status: 'abnormal', submittedAt: '2026-09-13 10:15' },
  { id: 'RPT-2026-003', title: '纺织工程 - 师资投入评估', department: '纺织服装学院', user: '王五', score: 0, status: 'reviewing', submittedAt: '2026-09-12 16:08' },
  { id: 'RPT-2026-004', title: '材料科学 - 过程监测诊断', department: '材料科学与工程学院', user: '赵六', score: 65, status: 'done', submittedAt: '2026-09-11 11:42' },
  { id: 'RPT-2026-005', title: '食品科学 - 社会反馈评估', department: '食品学院', user: '钱七', score: 0, status: 'submitted', submittedAt: '2026-09-10 09:20' },
];

export default function AdminReportsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const columns = [
    { title: '报告ID', dataIndex: 'id', key: 'id', width: 140,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '报告标题', dataIndex: 'title', key: 'title',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '所属学院', dataIndex: 'department', key: 'department', width: 180 },
    { title: '提交人', dataIndex: 'user', key: 'user', width: 100 },
    { title: '综合得分', dataIndex: 'score', key: 'score', width: 100, sorter: true,
      render: (v: number) => v > 0
        ? <span style={{ color: v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444' }} className="font-bold">{v}</span>
        : <span className="text-slate-300">-</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 110,
      render: (v: string) => {
        const s = statusMap[v];
        return <Tag color={s.color}>{s.text}</Tag>;
      } },
    { title: '提交时间', dataIndex: 'submittedAt', key: 'submittedAt', width: 160 },
    { title: '操作', key: 'action', width: 180, fixed: 'right' as const,
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>导出</Button>
        </Space>
      )},
  ];

  return (
    <div className="space-y-4">
      {/* 顶部统计 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="报告总数" value={186} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="已完成评价" value={142} valueStyle={{ color: '#10b981' }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="待评价" value={30} valueStyle={{ color: '#f59e0b' }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="异常报告" value={14} valueStyle={{ color: '#ef4444' }} prefix={<CloseCircleOutlined />} /></Card>
        </Col>
      </Row>

      {/* 筛选 + 列表 */}
      <Card className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <Space wrap>
            <Input
              placeholder="搜索报告ID / 标题 / 提交人"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Segmented
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: '全部', value: 'all' },
                { label: '已完成', value: 'done' },
                { label: '评价中', value: 'reviewing' },
                { label: '待评价', value: 'submitted' },
                { label: '异常', value: 'abnormal' },
              ]}
            />
            <Select
              placeholder="学院"
              style={{ width: 180 }}
              allowClear
              options={[
                { value: 'mechanical', label: '机械工程学院' },
                { value: 'info', label: '信息工程学院' },
                { value: 'textile', label: '纺织服装学院' },
              ]}
            />
          </Space>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button type="primary" icon={<DownloadOutlined />}>批量导出</Button>
          </Space>
        </div>
        <Table
          dataSource={mockData}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  );
}
