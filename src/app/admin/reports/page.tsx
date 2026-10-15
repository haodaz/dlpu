'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Button, Input, Row, Col, Statistic, Segmented, Tooltip } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined, SearchOutlined, EyeOutlined, BarsOutlined } from '@ant-design/icons';
import { MAJORS, verdictMeta, DEMO_MAJOR, schoolAvg, type Major, type Verdict } from '@/lib/diagnosis';

// 评价结果:全校各专业的诊断结论(与宏观决策页的红绿灯同一份数据,保证同一专业只有一个分)
// 演示环境只有示例专业有完整诊断数据,其余专业可看结论、不可下钻
const overall = (m: Major) => Math.round(((m.consistency + m.effectiveness) / 2) * 10) / 10;

export default function AdminReportsPage() {
  const router = useRouter();
  const [verdict, setVerdict] = useState<'all' | Verdict>('all');
  const [search, setSearch] = useState('');

  const rows = useMemo(
    () =>
      MAJORS.filter((m) => (verdict === 'all' || m.verdict === verdict) && (!search.trim() || m.name.includes(search.trim()) || m.college.includes(search.trim()))),
    [verdict, search],
  );
  const count = (v: Verdict) => MAJORS.filter((m) => m.verdict === v).length;
  const scoreCell = (v: number) => <span style={{ color: v >= 85 ? '#10b981' : v >= 75 ? '#f59e0b' : '#ef4444' }} className="font-bold">{v}</span>;

  const columns = [
    { title: '专业', dataIndex: 'name', key: 'name', render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
    { title: '所属学院', dataIndex: 'college', key: 'college', width: 190 },
    { title: '一致性', dataIndex: 'consistency', key: 'consistency', width: 90, sorter: (a: Major, b: Major) => a.consistency - b.consistency, render: scoreCell },
    { title: '有效性', dataIndex: 'effectiveness', key: 'effectiveness', width: 90, sorter: (a: Major, b: Major) => a.effectiveness - b.effectiveness, render: scoreCell },
    { title: '综合', key: 'overall', width: 80, sorter: (a: Major, b: Major) => overall(a) - overall(b), render: (_: unknown, m: Major) => scoreCell(overall(m)) },
    {
      title: '结论',
      dataIndex: 'verdict',
      key: 'verdict',
      width: 90,
      render: (v: Verdict) => (
        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: verdictMeta[v].color, backgroundColor: verdictMeta[v].bg }}>
          {verdictMeta[v].label}
        </span>
      ),
    },
    { title: '布局建议', dataIndex: 'layout', key: 'layout', width: 90 },
    { title: '主要原因', dataIndex: 'reason', key: 'reason', render: (v: string) => <span className="text-xs text-slate-500">{v}</span> },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: unknown, m: Major) =>
        m.name === DEMO_MAJOR.name ? (
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push('/admin')}>
            查看诊断
          </Button>
        ) : (
          <Tooltip title="演示环境只有示例专业(智能制造工程)有完整诊断数据">
            <span className="text-xs text-slate-300 px-2">仅示例可下钻</span>
          </Tooltip>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title={`诊断专业 · 全校均分 ${schoolAvg}`} value={MAJORS.length} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="可办" value={count('GO')} styles={{ content: { color: '#10b981' } }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="有风险" value={count('RISK')} styles={{ content: { color: '#f59e0b' } }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="不可办" value={count('NO')} styles={{ content: { color: '#ef4444' } }} prefix={<CloseCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="各专业诊断结果"
        extra={
          <div className="flex items-center gap-2">
            <Segmented
              value={verdict}
              onChange={(v) => setVerdict(v as typeof verdict)}
              options={[
                { label: '全部', value: 'all' },
                { label: '可办', value: 'GO' },
                { label: '有风险', value: 'RISK' },
                { label: '不可办', value: 'NO' },
              ]}
            />
            <Input placeholder="搜索专业 / 学院" prefix={<SearchOutlined />} style={{ width: 200 }} allowClear value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button icon={<BarsOutlined />} onClick={() => router.push('/admin/indicators')}>
              全校指标明细
            </Button>
          </div>
        }
      >
        <Table dataSource={rows} columns={columns} rowKey="name" scroll={{ x: 1200 }} pagination={false} />
        <p className="text-xs text-slate-400 mt-3 mb-0">演示数据 · 判定依据:一致性(是否对准产业需求)+ 有效性(培养是否真正达成)</p>
      </Card>
    </div>
  );
}
