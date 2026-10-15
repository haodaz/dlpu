'use client';
import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Tag, Button, Input, Space, Modal, Form, Row, Col, Statistic, Segmented, Badge, Select, message } from 'antd';
import {
  PlusOutlined, DeleteOutlined, LinkOutlined,
  CloudServerOutlined, ApiOutlined, DatabaseOutlined, CheckCircleOutlined, SyncOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { indicators } from '@/lib/indicators';
import { sourceMeta, sourceOf, useDataImported } from '@/lib/diagnosis';

const typeMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  rest: { color: 'blue', text: 'REST API', icon: <ApiOutlined /> },
  database: { color: 'green', text: '数据库', icon: <DatabaseOutlined /> },
  file: { color: 'orange', text: '文件接口', icon: <CloudServerOutlined /> },
  webhooks: { color: 'purple', text: 'Webhook', icon: <LinkOutlined /> },
};

type DataSource = { id: string; name: string; type: string; endpoint: string; indicator: string; status: string; lastSync: string; frequency: string };

const initialDataSources: DataSource[] = [
  { id: 'DS-01', name: '教育部学科评估数据', type: 'rest', endpoint: 'https://api.moe.gov.cn/csa/v1', indicator: '1.1.1 产业深度解析', status: 'online', lastSync: '2026-09-16 03:00', frequency: '每日' },
  { id: 'DS-02', name: '科技部项目库', type: 'rest', endpoint: 'https://api.most.gov.cn/projects', indicator: '2.1.1 横向科研转化', status: 'online', lastSync: '2026-09-16 03:00', frequency: '每日' },
  { id: 'DS-03', name: '专利数据库 (CNIPA)', type: 'database', endpoint: 'jdbc:postgresql://cnipa.internal', indicator: '1.3.1 国际标准对标 + AI 能力融入', status: 'online', lastSync: '2026-09-15 22:00', frequency: '每日' },
  { id: 'DS-04', name: '企业工商信息', type: 'rest', endpoint: 'https://api.qcc.com/v2/company', indicator: '3.1.2 企业真实项目驱动率', status: 'degraded', lastSync: '2026-09-16 03:00', frequency: '每日' },
  { id: 'DS-05', name: '校友职业轨迹 (LinkedIn)', type: 'webhooks', endpoint: 'webhook://linkedin/in/trajectory', indicator: '4.1.2 毕业生影响力', status: 'offline', lastSync: '2026-09-10 03:00', frequency: '每周' },
  { id: 'DS-06', name: '高德人才地图', type: 'file', endpoint: 's3://talent-map/daily.json', indicator: '4.1.1 行业就业率', status: 'online', lastSync: '2026-09-16 06:00', frequency: '每日' },
];

const statusMap: Record<string, { status: 'success' | 'processing' | 'error' | 'default'; text: string }> = {
  online: { status: 'success', text: '正常' },
  degraded: { status: 'processing', text: '降级' },
  offline: { status: 'error', text: '离线' },
};

const freqText: Record<string, string> = { hourly: '每小时', daily: '每日', weekly: '每周', manual: '手动' };

const nowText = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

interface ImportLog {
  time: string;
  source: string;
  rows: number;
  success: number;
  error?: string;
}

// 数据上传视角:只要求学校把现有系统数据交出来,不改动原系统(中台)
// 三层来源:AI 自动采集 / 学校系统导入 / 教师仅填无源项
export default function AdminDataSourcesPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [msg, msgHolder] = message.useMessage();
  const [form] = Form.useForm();
  const [sources, setSources] = useState<DataSource[]>(initialDataSources);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<ImportLog[]>([
    { time: '2026-09-16 03:00', source: '教育部学科评估数据', rows: 1240, success: 1240 },
    { time: '2026-09-16 03:00', source: '企业工商信息', rows: 860, success: 702, error: '158 条企业统一信用代码校验失败,已降级为上次同步结果' },
    { time: '2026-09-10 03:00', source: '校友职业轨迹 (LinkedIn)', rows: 0, success: 0, error: '接口鉴权过期,连接失败' },
  ]);
  const [, setImported] = useDataImported();

  const shown = useMemo(
    () =>
      sources.filter(
        (d) => (typeFilter === 'all' || d.type === typeFilter) && (!search.trim() || d.name.includes(search.trim())),
      ),
    [sources, typeFilter, search],
  );

  const sync = (d: DataSource) => {
    const time = nowText();
    const ok = d.status !== 'offline';
    const rows = 200 + d.name.length * 37;
    setSources((list) => list.map((x) => (x.id === d.id ? { ...x, lastSync: time, status: ok ? 'online' : 'offline' } : x)));
    setLogs((l) => [
      { time, source: d.name, rows: ok ? rows : 0, success: ok ? rows : 0, error: ok ? undefined : '连接失败,请检查接入端点' },
      ...l,
    ]);
    if (ok) msg.success(`${d.name} 同步完成`);
    else msg.error(`${d.name} 同步失败`);
  };

  const onFinish = (v: { name: string; type: string; endpoint: string; indicator: string; frequency: string }) => {
    const ind = indicators.find((i) => i.id === v.indicator);
    const id = `DS-${String(sources.length + 1).padStart(2, '0')}`;
    setSources((list) => [
      ...list,
      { id, name: v.name, type: v.type, endpoint: v.endpoint, indicator: `${ind?.id} ${ind?.name}`, status: 'online', lastSync: nowText(), frequency: freqText[v.frequency] },
    ]);
    setLogs((l) => [{ time: nowText(), source: v.name, rows: 320, success: 320 }, ...l]);
    form.resetFields();
    setModalOpen(false);
    msg.success('数据源已接入并完成首次同步');
  };

  const online = sources.filter((d) => d.status === 'online').length;

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
    { title: '关联指标', dataIndex: 'indicator', key: 'indicator', width: 200,
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (v: string) => {
        const s = statusMap[v];
        return <Badge status={s.status} text={s.text} />;
      } },
    { title: '同步频率', dataIndex: 'frequency', key: 'frequency', width: 90 },
    { title: '最近同步', dataIndex: 'lastSync', key: 'lastSync', width: 160 },
    { title: '操作', key: 'action', width: 160, fixed: 'right' as const,
      render: (_: unknown, record: DataSource) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SyncOutlined />} onClick={() => sync(record)}>同步</Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            disabled={record.status === 'online'}
            onClick={() => setSources((list) => list.filter((x) => x.id !== record.id))}
          >
            移除
          </Button>
        </Space>
      )},
  ];

  // 三层来源统计(按 17 项指标归属,每项只归一类,合计 = 100%)
  const layerCount = (['AI', 'SCHOOL', 'TEACHER'] as const).map((k) => ({
    key: k,
    n: indicators.filter((i) => sourceOf(i.id) === k).length,
  }));

  return (
    <div className="space-y-4">
      {msgHolder}
      <Card data-spec="ds-layers" className="shadow-sm" styles={{ body: { padding: 20 } }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-base font-bold text-slate-800">数据从哪里来</div>
            <p className="text-sm text-slate-500 mt-1 mb-3">不改动学校原有系统,只需把现有系统数据交出来;教师只填 4 类无源数据。</p>
            <div className="flex gap-3 flex-wrap">
              {layerCount.map(({ key, n }) => {
                const m = sourceMeta[key];
                return (
                  <div key={key} className="rounded-lg px-4 py-2 border" style={{ backgroundColor: m.bg, borderColor: `${m.color}33` }}>
                    <div className="text-xs font-bold" style={{ color: m.color }}>{m.label}</div>
                    <div className="text-lg font-black text-slate-800">
                      {n} 项 <span className="text-xs font-normal text-slate-500">/ {Math.round((n / indicators.length) * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            onClick={() => {
              setImported(true);
              router.push('/decision');
            }}
          >
            导入完成,查看诊断结论 <ArrowRightOutlined />
          </Button>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="数据源总数" value={sources.length} prefix={<CloudServerOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="正常" value={online} styles={{ content: { color: '#10b981' } }} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="降级/离线" value={sources.length - online} styles={{ content: { color: '#f59e0b' } }} prefix={<SyncOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="shadow-sm"><Statistic title="导入记录" value={logs.length} prefix={<ApiOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        data-spec="ds-table"
        className="shadow-sm"
        styles={{ body: { padding: 20 } }}
        title="学校系统数据源"
        extra={
          <Space>
            <Segmented
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as string)}
              options={[
                { label: '全部', value: 'all' },
                { label: 'REST API', value: 'rest' },
                { label: '数据库', value: 'database' },
                { label: '文件', value: 'file' },
                { label: 'Webhook', value: 'webhooks' },
              ]}
            />
            <Input placeholder="搜索数据源名称" style={{ width: 200 }} allowClear value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>接入数据源</Button>
          </Space>
        }
      >
        <Table dataSource={shown} columns={columns} rowKey="id" scroll={{ x: 1300 }} pagination={{ pageSize: 10 }} />
      </Card>

      <Card data-spec="ds-log" className="shadow-sm" title="导入日志" styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={logs.map((l, i) => ({ ...l, key: i }))}
          size="small"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: '时间', dataIndex: 'time', width: 160 },
            { title: '数据源', dataIndex: 'source' },
            { title: '行数', dataIndex: 'rows', width: 90 },
            { title: '成功', dataIndex: 'success', width: 90 },
            {
              title: '结果',
              dataIndex: 'error',
              render: (e?: string) => (e ? <span className="text-red-500 text-xs">{e}</span> : <Tag color="success">成功</Tag>),
            },
          ]}
        />
      </Card>

      <Modal
        title="接入学校系统数据源"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="接入并同步"
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4" onFinish={onFinish} initialValues={{ type: 'rest', frequency: 'daily' }}>
          <Form.Item label="数据源名称" name="name" rules={[{ required: true, message: '请输入数据源名称' }]}>
            <Input placeholder="例:教务管理系统 · 课程与培养方案" />
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
            <Input placeholder="https://jwxt.example.edu.cn/api 或 jdbc:postgresql://host/db" />
          </Form.Item>
          <Form.Item label="关联指标" name="indicator" rules={[{ required: true, message: '请选择关联指标' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="选择该数据源支撑的指标"
              options={indicators
                .filter((i) => sourceOf(i.id) !== 'TEACHER')
                .map((i) => ({ value: i.id, label: `${i.id} ${i.name}` }))}
            />
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
