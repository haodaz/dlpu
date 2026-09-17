'use client';
import React, { useState } from 'react';
import {
  Card, Progress, Button, Select, DatePicker, Tag,
  Table, Segmented, Space,
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, PercentageOutlined,
  TrophyOutlined, WarningOutlined, ReloadOutlined, FullscreenOutlined,
  TeamOutlined, BarChartOutlined, FunnelPlotOutlined,
  AlertOutlined, FireOutlined,
  RobotOutlined, EyeOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, Legend,
  AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  FunnelChart, Funnel, LabelList as FunnelLabelList,
} from 'recharts';

const { RangePicker } = DatePicker;

// ============ 第一层：核心数字卡片数据 ============
const coreStats = [
  { title: '应提交报告数', value: 248, icon: <FileTextOutlined />, color: '#1677ff', suffix: '份' },
  { title: '已提交报告数', value: 186, icon: <CheckCircleOutlined />, color: '#10b981', suffix: '份' },
  { title: '未提交报告数', value: 62, icon: <CloseCircleOutlined />, color: '#ef4444', suffix: '份' },
  { title: '提交完成率', value: 75, icon: <PercentageOutlined />, color: '#7c3aed', suffix: '%', isProgress: true },
  { title: '平均综合得分', value: 78.4, icon: <TrophyOutlined />, color: '#f59e0b', suffix: '分' },
  { title: '异常/待复核数', value: 14, icon: <WarningOutlined />, color: '#f97316', suffix: '份', isWarning: true },
];

// ============ 第二层：提交进度可视化 ============
const funnelData = [
  { value: 248, name: '未开始', fill: '#e2e8f0' },
  { value: 212, name: '进行中', fill: '#fbbf24' },
  { value: 186, name: '已提交', fill: '#1677ff' },
  { value: 142, name: '已评价', fill: '#10b981' },
];

const departmentData = [
  { name: '机械工程学院', submitted: 28, total: 30, rate: 93.3 },
  { name: '信息工程学院', submitted: 24, total: 30, rate: 80.0 },
  { name: '材料科学与工程学院', submitted: 22, total: 28, rate: 78.6 },
  { name: '艺术设计学院', submitted: 18, total: 25, rate: 72.0 },
  { name: '纺织服装学院', submitted: 19, total: 28, rate: 67.9 },
  { name: '生物工程学院', submitted: 16, total: 27, rate: 59.3 },
  { name: '管理学院', submitted: 14, total: 25, rate: 56.0 },
  { name: '外语学院', submitted: 12, total: 25, rate: 48.0 },
  { name: '食品学院', submitted: 10, total: 20, rate: 50.0 },
  { name: '数理学院', submitted: 8, total: 20, rate: 40.0 },
];

const timeTrendData = [
  { date: '09-01', submitted: 12, cumulative: 12 },
  { date: '09-03', submitted: 18, cumulative: 30 },
  { date: '09-05', submitted: 25, cumulative: 55 },
  { date: '09-07', submitted: 32, cumulative: 87 },
  { date: '09-09', submitted: 28, cumulative: 115 },
  { date: '09-11', submitted: 22, cumulative: 137 },
  { date: '09-13', submitted: 49, cumulative: 186 },
];

// ============ 第三层：提交结果质量分析 ============
const indicatorDistribution = [
  { name: '产业对齐', min: 55, median: 72, max: 95 },
  { name: '目标穿透', min: 60, median: 80, max: 98 },
  { name: '师资投入', min: 45, median: 65, max: 88 },
  { name: '质量闭环', min: 40, median: 60, max: 85 },
  { name: '产教实战', min: 50, median: 78, max: 96 },
  { name: '社会反馈', min: 55, median: 75, max: 92 },
  { name: '资产效能', min: 38, median: 58, max: 80 },
  { name: '过程监测', min: 42, median: 62, max: 88 },
];

const scoreHistogram = [
  { range: '优秀 (≥90)', count: 18, color: '#10b981' },
  { range: '良好 (80-89)', count: 62, color: '#1677ff' },
  { range: '合格 (60-79)', count: 78, color: '#f59e0b' },
  { range: '不合格 (<60)', count: 28, color: '#ef4444' },
];

const indicatorRadar = [
  { item: '产业对齐', score: 72 },
  { item: '目标穿透', score: 80 },
  { item: '师资投入', score: 65 },
  { item: '质量闭环', score: 60 },
  { item: '产教实战', score: 78 },
  { item: '社会反馈', score: 75 },
];

const weakIndicators = [
  { rank: 1, name: '资产效能 - 高端设备利用率', score: 42.3, affectedUsers: 186 },
  { rank: 2, name: '过程监测 - 教学大纲更新频次', score: 48.6, affectedUsers: 186 },
  { rank: 3, name: '师资投入 - 行业导师占比', score: 52.1, affectedUsers: 178 },
  { rank: 4, name: '质量闭环 - 反馈改进闭环率', score: 54.8, affectedUsers: 165 },
  { rank: 5, name: '产业对齐 - 课程对接产业率', score: 58.2, affectedUsers: 142 },
  { rank: 6, name: '产教融合 - 共建基地活跃度', score: 60.5, affectedUsers: 138 },
  { rank: 7, name: '实践验证 - 真题真做率', score: 62.7, affectedUsers: 130 },
  { rank: 8, name: '校友追踪 - 职业发展达成度', score: 65.4, affectedUsers: 118 },
  { rank: 9, name: '师资投入 - 双师型教师比例', score: 67.8, affectedUsers: 102 },
  { rank: 10, name: '社会反馈 - 用人单位满意度', score: 70.2, affectedUsers: 95 },
];

// ============ 第四层：AI 评价概览 ============
const aiEvaluationStats = {
  totalGenerated: 142,
  totalSubmitted: 186,
  completionRate: 76.3,
};

const issueTypeData = [
  { name: '材料缺失', value: 48, color: '#ef4444' },
  { name: '外部数据未引用', value: 36, color: '#f97316' },
  { name: '内容不达标', value: 28, color: '#f59e0b' },
  { name: '数据前后矛盾', value: 18, color: '#eab308' },
  { name: '逻辑断层', value: 12, color: '#a855f7' },
];

const reviewList = [
  { id: 'RPT-2026-001', title: '机械工程 - 2026 春季期中诊断', department: '机械工程学院', score: 52, issue: '资产利用率严重偏离阈值', status: '待复核', time: '10 分钟前' },
  { id: 'RPT-2026-002', title: '通信工程 - 产教融合专评', department: '信息工程学院', score: 48, issue: '关键材料缺失', status: '待复核', time: '35 分钟前' },
  { id: 'RPT-2026-003', title: '纺织工程 - 师资投入评估', department: '纺织服装学院', score: 55, issue: '数据前后矛盾', status: '待复核', time: '1 小时前' },
  { id: 'RPT-2026-004', title: '食品科学 - 社会反馈评估', department: '食品学院', score: 58, issue: '外部数据未引用', status: '待复核', time: '2 小时前' },
  { id: 'RPT-2026-005', title: '材料科学 - 过程监测诊断', department: '材料科学与工程学院', score: 51, issue: '内容不达标', status: '待复核', time: '3 小时前' },
];

export default function AdminDashboard() {
  const [taskFilter, setTaskFilter] = useState('2026-spring');
  const [periodFilter, setPeriodFilter] = useState('week');
  const [deptFilter, setDeptFilter] = useState('all');

  return (
    <div className="space-y-6 pb-8">
      {/* ============ 顶部筛选栏 ============ */}
      <Card size="small" className="shadow-sm" styles={{ body: { padding: '12px 20px' } }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Space size="middle">
              <span className="text-sm font-bold text-slate-700">任务：</span>
              <Select
                value={taskFilter}
                onChange={setTaskFilter}
                style={{ width: 200 }}
                options={[
                  { value: '2026-spring', label: '2026 春季专业评价任务' },
                  { value: '2025-autumn', label: '2025 秋季专业评价任务' },
                  { value: '2025-spring', label: '2025 春季专业评价任务' },
                ]}
              />
              <span className="text-sm font-bold text-slate-700">时间周期：</span>
              <Segmented
                value={periodFilter}
                onChange={setPeriodFilter}
                options={[
                  { label: '日', value: 'day' },
                  { label: '周', value: 'week' },
                  { label: '月', value: 'month' },
                ]}
              />
              <span className="text-sm font-bold text-slate-700">部门：</span>
              <Select
                value={deptFilter}
                onChange={setDeptFilter}
                style={{ width: 180 }}
                options={[
                  { value: 'all', label: '全部学院' },
                  { value: 'mechanical', label: '机械工程学院' },
                  { value: 'info', label: '信息工程学院' },
                  { value: 'textile', label: '纺织服装学院' },
                ]}
              />
              <RangePicker />
            </Space>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button type="primary" icon={<FullscreenOutlined />}>全屏投屏</Button>
          </Space>
        </div>
      </Card>

      {/* ============ 第一层：核心数字卡片 ============ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {coreStats.map((stat, i) => (
          <div key={i}>
            <Card
              className="h-full shadow-sm hover:shadow-md transition-all"
              styles={{ body: { padding: 16, height: '100%', display: 'flex', flexDirection: 'column' } }}
            >
              <div className="flex items-center justify-between mb-2 shrink-0">
                <span className="text-xs font-bold text-slate-500">{stat.title}</span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
                >
                  {stat.icon}
                </div>
              </div>
              {stat.isProgress ? (
                <div className="flex-1 flex flex-col justify-end min-h-[56px]">
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</span>
                    <span className="text-sm text-slate-400">{stat.suffix}</span>
                  </div>
                  <Progress
                    percent={stat.value as number}
                    showInfo={false}
                    strokeColor={stat.color}
                    trailColor="#f1f5f9"
                    strokeWidth={6}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-end min-h-[56px]">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl font-black ${stat.isWarning ? 'animate-pulse' : ''}`}
                      style={{ color: stat.isWarning ? stat.color : '#1e293b' }}
                    >
                      {stat.value}
                    </span>
                    <span className="text-sm text-slate-400">{stat.suffix}</span>
                  </div>
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      {/* ============ 第二层：提交进度可视化 ============ */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <FunnelPlotOutlined className="text-blue-500" />
          提交进度可视化
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_0.8fr] gap-4">
          {/* 提交进度漏斗 */}
          <Card title="提交进度漏斗" className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <FunnelLabelList position="right" fill="#475569" stroke="none" fontSize={12} fontWeight="bold" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 部门提交率对比 */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <span>按学院提交率对比</span>
                <Tag color="blue" className="text-xs">拖后腿</Tag>
              </div>
            }
            className="shadow-sm"
            styles={{ body: { padding: 20 } }}
          >
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} layout="vertical" margin={{ top: 5, right: 30, left: 110, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} width={130} />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, _name: any, props: any) => {
                      const { submitted, total } = props.payload;
                      return [`${value}% (${submitted}/${total})`, '提交率'];
                    }}
                  />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={14}>
                    {departmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.rate >= 80 ? '#10b981' : entry.rate >= 60 ? '#1677ff' : entry.rate >= 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                    <LabelList dataKey="rate" position="right" fill="#64748b" fontSize={11} fontWeight="bold" formatter={(v: any) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 提交时间趋势 */}
          <Card title="提交时间趋势" className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="submitted" name="每日提交" stroke="#1677ff" strokeWidth={2} fill="url(#trendGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 text-xs text-slate-400 text-center">
              截止前 2 天提交量激增 <FireOutlined className="text-red-500" />
            </div>
          </Card>
        </div>
      </div>

      {/* ============ 第三层：提交结果质量分析 ============ */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <BarChartOutlined className="text-blue-500" />
          提交结果质量分析
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-4">
          {/* 各指标得分分布 */}
          <Card title="各指标得分分布" className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={indicatorDistribution} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => {
                      const label = name === 'max' ? '最高分' : name === 'median' ? '中位数' : '最低分';
                      return [value, label];
                    }}
                  />
                  <Bar dataKey="max" fill="#dbeafe" radius={[4, 4, 0, 0]} barSize={32} name="最高分" />
                  <Bar dataKey="median" fill="#1677ff" radius={[4, 4, 0, 0]} barSize={32} name="中位数" />
                  <Bar dataKey="min" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={32} name="最低分" />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 综合得分分布直方图 */}
          <Card title="综合得分分布" className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreHistogram} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any) => [`${v} 人`, '人数']} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                    {scoreHistogram.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="count" position="top" fill="#475569" fontSize={12} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 指标得分雷达图 */}
          <Card title="指标平均分雷达图" className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={indicatorRadar}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="item" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="平均分" dataKey="score" stroke="#1677ff" strokeWidth={2} fill="#1677ff" fillOpacity={0.4} />
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* 薄弱指标排行 */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertOutlined className="text-red-500" />
                薄弱指标排行 Top 10
              </span>
              <Tag color="red" className="text-xs">需重点关注</Tag>
            </div>
          }
          className="shadow-sm mt-4"
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={weakIndicators}
            rowKey="rank"
            size="middle"
            pagination={false}
            columns={[
              { title: '排名', dataIndex: 'rank', key: 'rank', width: 70,
                render: (v: number) => (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: v <= 3 ? '#ef4444' : v <= 6 ? '#f97316' : '#f59e0b' }}
                  >
                    {v}
                  </div>
                ),
              },
              { title: '指标名称', dataIndex: 'name', key: 'name',
                render: (v: string) => <span className="font-bold text-slate-700">{v}</span> },
              { title: '平均得分', dataIndex: 'score', key: 'score', width: 120,
                render: (v: number) => (
                  <span style={{ color: v < 50 ? '#ef4444' : v < 60 ? '#f97316' : '#f59e0b' }} className="font-bold">
                    {v} 分
                  </span>
                ),
              },
              { title: '涉及人数', dataIndex: 'affectedUsers', key: 'affectedUsers', width: 120,
                render: (v: number) => (
                  <span className="flex items-center gap-1 text-slate-600">
                    <TeamOutlined /> {v} 人
                  </span>
                ),
              },
              { title: '操作', key: 'action', width: 120,
                render: () => (
                  <Button type="link" size="small">
                    查看详情 <ArrowRightOutlined />
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>

      {/* ============ 第四层：AI 评价概览 ============ */}
      <div>
        <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <RobotOutlined className="text-purple-500" />
          AI 评价概览
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1fr_1.2fr] gap-4">
          {/* AI 评价完成率 */}
          <Card className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-700">AI 评价完成率</span>
              <RobotOutlined className="text-purple-500 text-lg" />
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <Progress
                type="circle"
                percent={aiEvaluationStats.completionRate}
                size={140}
                strokeColor={{ '0%': '#7c3aed', '100%': '#a855f7' }}
                format={(percent) => (
                  <div className="text-center">
                    <div className="text-2xl font-black text-slate-800">{percent}%</div>
                    <div className="text-xs text-slate-400 mt-1">已完成</div>
                  </div>
                )}
              />
              <div className="flex items-center justify-between w-full mt-6 pt-4 border-t border-slate-100">
                <div>
                  <div className="text-xs text-slate-400">已生成</div>
                  <div className="text-base font-bold text-purple-600">{aiEvaluationStats.totalGenerated} 份</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">已提交</div>
                  <div className="text-base font-bold text-slate-600">{aiEvaluationStats.totalSubmitted} 份</div>
                </div>
              </div>
            </div>
          </Card>

          {/* 常见问题类型分布 */}
          <Card title="AI 标记的常见问题类型分布" className="shadow-sm" styles={{ body: { padding: 20 } }}>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={issueTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    label={(entry: any) => `${entry.name} ${entry.value}`}
                    labelLine={false}
                  >
                    {issueTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v: any, _n: any, p: any) => [`${v} 次 (${((v / 142) * 100).toFixed(1)}%)`, p.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 待人工复核列表入口 */}
          <Card
            title={
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertOutlined className="text-orange-500" />
                  待人工复核列表
                </span>
                <Button type="link" size="small" icon={<ArrowRightOutlined />}>查看全部</Button>
              </div>
            }
            className="shadow-sm"
            styles={{ body: { padding: 0 } }}
          >
            <div className="max-h-[280px] overflow-y-auto">
              {reviewList.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-slate-400">{item.id}</span>
                      <Tag color="warning" className="text-xs">待复核</Tag>
                    </div>
                    <div className="text-sm font-bold text-slate-700 truncate">{item.title}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {item.department} · <span style={{ color: item.score < 60 ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{item.score}分</span> · {item.issue}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 ml-3 shrink-0">{item.time}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
