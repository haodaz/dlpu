'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Tag, Button, Input, Select, Space, Tree, Row, Col, Statistic } from 'antd';
import {
  SearchOutlined, BarsOutlined, ProfileOutlined, EyeOutlined,
  CheckCircleOutlined, ClockCircleOutlined, ArrowLeftOutlined,
} from '@ant-design/icons';
import { indicators, dimensions } from '@/lib/indicators';
import { MOCK_REPORT } from '@/lib/mock-evaluation-report';
import { sourceOf } from '@/lib/diagnosis';
import SourceTag from '@/components/diagnosis/SourceTag';

// 指标体系统一使用 src/lib/indicators.ts 的 17 项(编号 1.1.1 ~ 4.1.3),
// 此页不再维护独立的指标清单。全校平均得分/合格率为演示数据,
// 由示例评价报告的单项得分按固定规则推导,保证每次刷新一致。
const round1 = (n: number) => Math.round(n * 10) / 10;

const rows = indicators.map((ind, idx) => {
  const reportScore = MOCK_REPORT.indicators?.find((i) => i.id === ind.id)?.score ?? 80;
  const avgScore = round1(reportScore - 11 + (idx % 3));
  const qualifiedRate = round1(Math.max(20, Math.min(98, avgScore - 5 + (idx % 4) * 2)));
  const dim = dimensions.find((d) => d.key === ind.dimension)!;
  return {
    code: ind.id,
    name: ind.name,
    dimension: ind.dimension,
    dimensionName: dim.name,
    dimensionColor: dim.color,
    subCategoryId: ind.subCategoryId,
    subCategoryName: ind.subCategoryName,
    weight: ind.weight,
    avgScore,
    qualifiedRate,
    status: avgScore >= 70 ? 'normal' : 'weak',
  };
});

const treeData = [
  {
    title: `使命型指标体系 (${indicators.length}项)`,
    key: 'root',
    children: dimensions.map((d) => ({
      title: `${d.key} ${d.name} (${indicators.filter((i) => i.dimension === d.key).length}项)`,
      key: `dim-${d.key}`,
      children: d.subCategories.map((s) => ({
        title: `${s.id} ${s.name}`,
        key: `sub-${s.id}`,
        children: indicators
          .filter((i) => i.subCategoryId === s.id)
          .map((i) => ({ title: `${i.id} ${i.name}`, key: `ind-${i.id}` })),
      })),
    })),
  },
];

const statusTagMap: Record<string, { color: string; text: string }> = {
  normal: { color: 'success', text: '达标' },
  weak: { color: 'error', text: '薄弱' },
};

export default function AdminIndicatorsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [node, setNode] = useState('root');

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (node.startsWith('dim-') && r.dimension !== node.slice(4)) return false;
        if (node.startsWith('sub-') && r.subCategoryId !== node.slice(4)) return false;
        if (node.startsWith('ind-') && r.code !== node.slice(4)) return false;
        if (statusFilter && r.status !== statusFilter) return false;
        const kw = search.trim();
        if (kw && !r.code.includes(kw) && !r.name.includes(kw)) return false;
        return true;
      }),
    [node, statusFilter, search],
  );

  const weakCount = rows.filter((r) => r.status === 'weak').length;

  const columns = [
    { title: '编号', dataIndex: 'code', key: 'code', width: 90,
      render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    { title: '指标名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '所属维度', dataIndex: 'dimensionName', key: 'dimensionName', width: 180,
      render: (v: string, r: (typeof rows)[number]) => <Tag color={r.dimensionColor}>{v}</Tag> },
    { title: '二级分类', dataIndex: 'subCategoryName', key: 'subCategoryName', width: 150 },
    { title: '数据来源', key: 'source', width: 120,
      render: (_: unknown, r: (typeof rows)[number]) => <SourceTag source={sourceOf(r.code)} full /> },
    { title: '权重', dataIndex: 'weight', key: 'weight', width: 80, sorter: (a: (typeof rows)[number], b: (typeof rows)[number]) => a.weight - b.weight,
      render: (v: number) => <span className="text-slate-700">{v}%</span> },
    { title: '平均得分', dataIndex: 'avgScore', key: 'avgScore', width: 110, sorter: (a: (typeof rows)[number], b: (typeof rows)[number]) => a.avgScore - b.avgScore,
      render: (v: number) => <span style={{ color: v >= 75 ? '#10b981' : v >= 70 ? '#f59e0b' : '#ef4444' }} className="font-bold">{v}</span> },
    { title: '合格率', dataIndex: 'qualifiedRate', key: 'qualifiedRate', width: 100, sorter: (a: (typeof rows)[number], b: (typeof rows)[number]) => a.qualifiedRate - b.qualifiedRate,
      render: (v: number) => <span className="font-bold">{v}%</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (v: string) => {
        const s = statusTagMap[v];
        return <Tag color={s.color}>{s.text}</Tag>;
      } },
    { title: '操作', key: 'action', width: 100, fixed: 'right' as const,
      render: (_: unknown, r: (typeof rows)[number]) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(`/admin/indicator-analysis?id=${r.code}`)}>详情</Button>
      ) },
  ];

  return (
    <div className="space-y-4">
      {/* 下钻页:指标不再是菜单入口,从评价结果下钻而来 */}
      <div className="flex items-center gap-3">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>返回</Button>
        <span className="text-sm text-slate-500">指标分析 · 这个结论背后的分析逻辑</span>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="指标总数" value={indicators.length} prefix={<BarsOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="评价维度" value={dimensions.length} styles={{ content: { color: '#1677ff' } }} prefix={<ProfileOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="达标指标" value={rows.length - weakCount} styles={{ content: { color: '#10b981' } }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="薄弱指标" value={weakCount} styles={{ content: { color: '#ef4444' } }} prefix={<ClockCircleOutlined />} /></Card>
        </Col>
      </Row>

      <div data-spec="indicators-table" className="flex gap-4">
        {/* 左侧指标树:点击节点筛选右侧列表 */}
        <Card title="指标体系结构" className="shadow-sm w-80 shrink-0" styles={{ body: { padding: 12 } }}>
          <Tree
            treeData={treeData}
            defaultExpandedKeys={['root', ...dimensions.map((d) => `dim-${d.key}`)]}
            selectedKeys={[node]}
            onSelect={(keys) => setNode((keys[0] as string) ?? 'root')}
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
                placeholder="搜索指标编号/名称"
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
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: 'normal', label: '达标' },
                  { value: 'weak', label: '薄弱' },
                ]}
              />
            </Space>
          }
        >
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="code"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10, showTotal: (t) => `共 ${t} 项` }}
          />
        </Card>
      </div>
    </div>
  );
}
