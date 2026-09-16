'use client';
import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Input, Select, Space, Segmented } from 'antd';
import {
  ApartmentOutlined, TeamOutlined, TrophyOutlined, WarningOutlined,
  SearchOutlined, EyeOutlined, DownloadOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';

const mockUniversities = [
  { id: 'DLPU', name: '大连工业大学', majors: 32, submitted: 186, avgScore: 78.4, qualifiedRate: 75.0, status: 'normal' },
  { id: 'DLUT', name: '大连理工大学', majors: 56, submitted: 52, avgScore: 85.2, qualifiedRate: 92.8, status: 'normal' },
  { id: 'DLU', name: '大连大学', majors: 40, submitted: 38, avgScore: 76.8, qualifiedRate: 73.5, status: 'normal' },
  { id: 'DLJU', name: '大连交通大学', majors: 35, submitted: 30, avgScore: 72.1, qualifiedRate: 65.7, status: 'warning' },
  { id: 'DNU', name: '大连海洋大学', majors: 38, submitted: 28, avgScore: 68.5, qualifiedRate: 52.3, status: 'warning' },
  { id: 'DLNU', name: '辽宁师范大学', majors: 42, submitted: 20, avgScore: 0, qualifiedRate: 0, status: 'pending' },
];

const scoreDistribution = [
  { name: '大连工业大学', score: 78.4 },
  { name: '大连理工大学', score: 85.2 },
  { name: '大连大学', score: 76.8 },
  { name: '大连交通大学', score: 72.1 },
  { name: '大连海洋大学', score: 68.5 },
];

const statusTagMap: Record<string, { color: string; text: string }> = {
  normal: { color: 'success', text: '正常' },
  warning: { color: 'warning', text: '关注' },
  pending: { color: 'default', text: '未启动' },
};

export default function AdminUniversitiesPage() {
  const [search, setSearch] = useState('');

  const columns = [
    { title: '院校代码', dataIndex: 'id', key: 'id', width: 100,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '院校名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '专业数', dataIndex: 'majors', key: 'majors', width: 90, sorter: true },
    { title: '已提交', dataIndex: 'submitted', key: 'submitted', width: 100,
      render: (v: number, r: any) => {
        const rate = r.majors ? Math.round((v / r.majors) * 100) : 0;
        return <span><span className="font-bold text-blue-600">{v}</span> <span className="text-xs text-slate-400">({rate}%)</span></span>;
      } },
    { title: '平均得分', dataIndex: 'avgScore', key: 'avgScore', width: 110, sorter: true,
      render: (v: number) => v > 0
        ? <span style={{ color: v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444' }} className="font-bold">{v}</span>
        : <span className="text-slate-300">-</span> },
    { title: '合格率', dataIndex: 'qualifiedRate', key: 'qualifiedRate', width: 100, sorter: true,
      render: (v: number) => v > 0 ? <span className="font-bold">{v}%</span> : <span className="text-slate-300">-</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const s = statusTagMap[v];
        return <Tag color={s.color}>{s.text}</Tag>;
      } },
    { title: '操作', key: 'action', width: 150, fixed: 'right' as const,
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<DownloadOutlined />}>导出</Button>
        </Space>
      )},
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="接入院校" value={6} prefix={<ApartmentOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="覆盖专业" value={243} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="平均合格率" value={68.2} suffix="%" valueStyle={{ color: '#10b981' }} prefix={<TrophyOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="预警院校" value={2} valueStyle={{ color: '#f59e0b' }} prefix={<WarningOutlined />} /></Card>
        </Col>
      </Row>

      <Card title="院校平均得分对比" className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scoreDistribution} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
              <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => [`${v} 分`, '平均分']} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={40}>
                {scoreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 70 ? '#1677ff' : '#f59e0b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="院校列表"
        extra={
          <Space>
            <Input
              placeholder="搜索院校名称/代码"
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Select
              placeholder="状态筛选"
              style={{ width: 140 }}
              allowClear
              options={[
                { value: 'normal', label: '正常' },
                { value: 'warning', label: '关注' },
                { value: 'pending', label: '未启动' },
              ]}
            />
          </Space>
        }
      >
        <Table
          dataSource={mockUniversities}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}
