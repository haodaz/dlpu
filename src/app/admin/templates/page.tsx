'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Tag, Button, Row, Col, Statistic, Segmented } from 'antd';
import { ProfileOutlined, EyeOutlined, UserOutlined, CloudServerOutlined, RobotOutlined } from '@ant-design/icons';
import { TEMPLATES, type TemplateEntry } from '@/lib/templates';
import type { SourceType } from '@/lib/diagnosis';
import SourceTag from '@/components/diagnosis/SourceTag';

// 模板与范本(管理员):与教师端「模板库」同一份目录,只在 src/lib/templates.ts 维护
// 教师范本会嵌入教师的填报流程(问题卡片与填报页同屏给出)
export default function AdminTemplatesPage() {
  const router = useRouter();
  const [owner, setOwner] = useState<'all' | SourceType>('all');
  const rows = useMemo(() => TEMPLATES.filter((t) => owner === 'all' || t.owner === owner), [owner]);
  const count = (o: SourceType) => TEMPLATES.filter((t) => t.owner === o).length;

  const columns = [
    { title: '编号', dataIndex: 'id', key: 'id', width: 80, render: (v: string) => <span className="font-mono text-xs text-slate-500">{v}</span> },
    {
      title: '模板',
      key: 'name',
      render: (_: unknown, t: TemplateEntry) => (
        <div>
          <span className="font-bold text-slate-700">{t.name}</span>
          {t.isTeacherSample && (
            <Tag color="orange" className="ml-2">
              教师范本
            </Tag>
          )}
          <div className="text-xs text-slate-400 mt-0.5">{t.desc}</div>
        </div>
      ),
    },
    {
      title: '关联指标',
      dataIndex: 'indicators',
      key: 'indicators',
      width: 200,
      render: (v: string[]) => (
        <span className="text-xs font-mono">
          {v.map((id) => (
            <a key={id} className="mr-2 text-blue-600 hover:underline" onClick={() => router.push(`/admin/indicator-analysis?id=${id}`)}>
              {id}
            </a>
          ))}
        </span>
      ),
    },
    { title: '由谁填', dataIndex: 'owner', key: 'owner', width: 130, render: (v: SourceType) => <SourceTag source={v} full /> },
    {
      title: '',
      key: 'action',
      width: 110,
      render: (_: unknown, t: TemplateEntry) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => router.push(t.path)}>
          打开模板
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="模板总数" value={TEMPLATES.length} prefix={<ProfileOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="教师填报(含范本)" value={count('TEACHER')} styles={{ content: { color: '#d97706' } }} prefix={<UserOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="学校系统导入" value={count('SCHOOL')} styles={{ content: { color: '#0284c7' } }} prefix={<CloudServerOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm">
            <Statistic title="AI 采集" value={count('AI')} styles={{ content: { color: '#7c3aed' } }} prefix={<RobotOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card
        data-spec="tpl-catalog"
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="模板与范本"
        extra={
          <Segmented
            value={owner}
            onChange={(v) => setOwner(v as typeof owner)}
            options={[
              { label: '全部', value: 'all' },
              { label: '教师', value: 'TEACHER' },
              { label: '学校系统', value: 'SCHOOL' },
              { label: 'AI 采集', value: 'AI' },
            ]}
          />
        }
      >
        <Table dataSource={rows} columns={columns} rowKey="id" pagination={false} />
        <p className="text-xs text-slate-400 mt-3 mb-0">
          T16(持续改进与大纲演进)、T17(教学资源台账存证)已并入 AI 自动存证,不再单独维护模板。模板目录只在一处维护:src/lib/templates.ts。
        </p>
      </Card>
    </div>
  );
}
