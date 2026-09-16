'use client';
import React, { useState } from 'react';
import { Card, Table, Tag, Button, Input, Select, Space, Tree, Row, Col, Statistic } from 'antd';
import {
  SearchOutlined, BarsOutlined, ProfileOutlined, EyeOutlined,
  CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';

const treeData = [
  {
    title: '使命型指标体系 (17项)',
    key: 'mission',
    children: [
      { title: '产业对齐 (4项)', key: 'alignment', children: [
        { title: 'M01 产业链图谱完整度', key: 'm01' },
        { title: 'M02 课程对接产业率', key: 'm02' },
        { title: 'M03 行业导师占比', key: 'm03' },
        { title: 'M04 共建基地活跃度', key: 'm04' },
      ] },
      { title: '师资投入 (3项)', key: 'faculty', children: [
        { title: 'M05 双师型教师比例', key: 'm05' },
        { title: 'M06 行业导师占比', key: 'm06' },
        { title: 'M07 教师产业实践时长', key: 'm07' },
      ] },
    ],
  },
  {
    title: '未来型指标体系 (13项)',
    key: 'future',
    children: [
      { title: '前瞻布局 (4项)', key: 'foresight', children: [
        { title: 'F01 产业趋势引领度', key: 'f01' },
        { title: 'F02 教育形态重构力', key: 'f02' },
        { title: 'F03 跨界融合度', key: 'f03' },
        { title: 'F04 第四代大学特征', key: 'f04' },
      ] },
    ],
  },
];

const mockIndicators = [
  { code: 'M01', name: '产业链图谱完整度', category: '使命型-产业对齐', unit: '%', target: 85, avgScore: 72.5, qualifiedRate: 68.2, status: 'normal' },
  { code: 'M02', name: '课程对接产业率', category: '使命型-产业对齐', unit: '%', target: 80, avgScore: 58.2, qualifiedRate: 42.3, status: 'weak' },
  { code: 'M03', name: '行业导师占比', category: '使命型-产业对齐', unit: '%', target: 30, avgScore: 52.1, qualifiedRate: 38.7, status: 'weak' },
  { code: 'M05', name: '双师型教师比例', category: '使命型-师资投入', unit: '%', target: 50, avgScore: 67.8, qualifiedRate: 71.5, status: 'normal' },
  { code: 'F01', name: '产业趋势引领度', category: '未来型-前瞻布局', unit: '分', target: 80, avgScore: 45.6, qualifiedRate: 18.2, status: 'weak' },
  { code: 'F02', name: '教育形态重构力', category: '未来型-前瞻布局', unit: '分', target: 75, avgScore: 38.9, qualifiedRate: 8.5, status: 'weak' },
];

const statusTagMap: Record<string, { color: string; text: string }> = {
  normal: { color: 'success', text: '达标' },
  weak: { color: 'error', text: '薄弱' },
  pending: { color: 'default', text: '未启动' },
};

export default function AdminIndicatorsPage() {
  const [search, setSearch] = useState('');

  const columns = [
    { title: '指标代码', dataIndex: 'code', key: 'code', width: 100,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '指标名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '所属分类', dataIndex: 'category', key: 'category', width: 180,
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
    { title: '目标值', dataIndex: 'target', key: 'target', width: 90,
      render: (v: number) => <span className="text-slate-700">{v}</span> },
    { title: '平均得分', dataIndex: 'avgScore', key: 'avgScore', width: 110, sorter: true,
      render: (v: number) => <span style={{ color: v >= 70 ? '#10b981' : v >= 50 ? '#f59e0b' : '#ef4444' }} className="font-bold">{v}</span> },
    { title: '合格率', dataIndex: 'qualifiedRate', key: 'qualifiedRate', width: 100, sorter: true,
      render: (v: number) => <span className="font-bold">{v}%</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const s = statusTagMap[v];
        return <Tag color={s.color}>{s.text}</Tag>;
      } },
    { title: '操作', key: 'action', width: 100, fixed: 'right' as const,
      render: () => <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button> },
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="指标总数" value={30} prefix={<BarsOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="使命型" value={17} valueStyle={{ color: '#1677ff' }} prefix={<ProfileOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="未来型" value={13} valueStyle={{ color: '#a855f7' }} prefix={<ProfileOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="薄弱指标" value={12} valueStyle={{ color: '#ef4444' }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
      </Row>

      <div className="flex gap-4">
        {/* 左侧指标树 */}
        <Card title="指标体系结构" className="shadow-sm w-72 shrink-0" styles={{ body: { padding: 12 } }}>
          <Tree
            treeData={treeData}
            defaultExpandAll
            showLine
            className="text-sm"
          />
        </Card>

        {/* 右侧指标列表 */}
        <Card
          className="shadow-sm flex-1"
          styles={{ body: { padding: 20 } }}
          title={
            <Space>
              <Input
                placeholder="搜索指标代码/名称"
                prefix={<SearchOutlined />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: 240 }}
                allowClear
              />
              <Select
                placeholder="分类筛选"
                style={{ width: 180 }}
                allowClear
                options={[
                  { value: 'mission', label: '使命型' },
                  { value: 'future', label: '未来型' },
                ]}
              />
            </Space>
          }
        >
          <Table
            dataSource={mockIndicators}
            columns={columns}
            rowKey="code"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </div>
  );
}
