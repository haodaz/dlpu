'use client';
import React from 'react';
import { Avatar, Progress, Tag } from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AreaChartOutlined,
  CrownOutlined,
  FileDoneOutlined,
  NodeIndexOutlined,
  AppstoreAddOutlined,
  BookOutlined,
  PartitionOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  UserOutlined,
  DesktopOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { useRouter } from 'next/navigation';

// 实打实跑出来的真实评价数据作为底座 (Mock Default)
const evalData = {
  totalScore: 78,
  grade: "合格 (C)",
  radarData: [
    { item: "产业对齐", score: 70 },
    { item: "目标穿透", score: 90 },
    { item: "师资投入", score: 65 },
    { item: "质量闭环", score: 60 },
    { item: "产教实战", score: 95 },
    { item: "社会反馈", score: 90 }
  ],
  expertTiers: [
    { expert: '产业分析', tier: 2 },
    { expert: '矩阵对齐', tier: 5 },
    { expert: '师资投入', tier: 5 },
    { expert: '过程监测', tier: 2 },
    { expert: '资产效能', tier: 2 },
    { expert: '实践验证', tier: 5 },
    { expert: '产教融合', tier: 1 },
    { expert: '生涯发展', tier: 5 },
    { expert: '校友追踪', tier: 5 }
  ],
  tags: [
    "产业链图谱完整", "平台空转预警", "高价设备闲置", "专家系统崩溃", 
    "真题真做突出", "高管转化率高", "能力清单空泛"
  ]
};

const pieData = [
  { name: '已覆盖', value: 85, color: '#1677ff' },
  { name: '待覆盖', value: 15, color: '#e2e8f0' },
];

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="flex-1 flex gap-6 min-h-[calc(100vh-140px)] h-[calc(100vh-140px)]">
      
      {/* ================= 左侧：核心大屏区 (Left: Main Dashboard) ================= */}
      <main className="flex-1 flex flex-col bg-slate-50 rounded-xl shadow-sm border border-slate-100 overflow-y-auto p-8 custom-scrollbar">
        
        {/* Header Title */}
        <div className="flex justify-between items-end mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight m-0">工作台总览</h1>
            <div className="flex items-center gap-3 mt-3">
              <img src="/dlpu_logo.png" alt="DLPU Logo" className="w-8 h-8 object-contain" />
              <p className="text-slate-500 font-medium m-0">大连工业大学 · 智能评价引擎大厅</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg hover:border-blue-600 hover:text-blue-600 transition-colors shadow-sm">
              导出全景报告
            </button>
            <button onClick={() => router.push('/evaluations')} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">
              发起全新评价
            </button>
          </div>
        </div>

        {/* 核心指标卡 (Top Stats) */}
        <div className="grid grid-cols-4 gap-6 mb-8 shrink-0">
          {[
            { label: '全景数据节点', value: '1,128', icon: <DatabaseOutlined /> },
            { label: '智能体诊断总数', value: '436', icon: <CheckCircleOutlined /> },
            { label: '最新 AI 诊断均分', value: evalData.totalScore, icon: <AreaChartOutlined /> },
            { label: '全局安全预警', value: '3', icon: <WarningOutlined />, isWarning: true },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-colors cursor-pointer">
              <div className="text-slate-500 text-sm font-bold mb-4">{stat.label}</div>
              <div className="flex items-center justify-between">
                <span className={`text-3xl font-black ${stat.isWarning ? 'text-red-500' : 'text-slate-800'}`}>{stat.value}</span>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                  stat.isWarning ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                }`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 快捷穿透入口 (Quick Actions) */}
        <div className="mb-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 mb-4">快捷诊断穿透 (Quick Drill-downs)</h2>
          <div className="grid grid-cols-4 gap-6">
            <div onClick={() => router.push('/panoramic')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group">
              <div className="w-10 h-10 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><BookOutlined /></div>
              <h3 className="font-bold text-slate-800 m-0">课程体系穿透评价</h3>
              <p className="text-xs text-slate-500 leading-relaxed">直接从 T11/T12 切入，审查底层教学资产流转与学生达成度监控闭环。</p>
            </div>
            
            <div onClick={() => router.push('/evaluations')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group">
              <div className="w-10 h-10 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><NodeIndexOutlined /></div>
              <h3 className="font-bold text-slate-800 m-0">产业链靶点对齐诊断</h3>
              <p className="text-xs text-slate-500 leading-relaxed">穿透 T03 产业白皮书，直接验证人才输出是否精准命中产业生态圈核心岗位。</p>
            </div>

            <div onClick={() => router.push('/data-flow')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group">
              <div className="w-10 h-10 rounded bg-cyan-50 text-cyan-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><PartitionOutlined /></div>
              <h3 className="font-bold text-slate-800 m-0">全景数据流监控图</h3>
              <p className="text-xs text-slate-500 leading-relaxed">可视化追踪从 T01 到 T19 的数据节点血缘关系与流转状态，发现断点。</p>
            </div>

            <div onClick={() => router.push('/agents')} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col gap-3 group">
              <div className="w-10 h-10 rounded bg-purple-50 text-purple-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform"><AppstoreAddOutlined /></div>
              <h3 className="font-bold text-slate-800 m-0">微专家矩阵统筹配置</h3>
              <p className="text-xs text-slate-500 leading-relaxed">调度 9 位子智能体，调整各专家的性格特征、评判严苛度及考核靶点。</p>
            </div>
          </div>
        </div>

        {/* 诊断全景大屏 (Diagnostic Charts) - 包含新增的两型评估卡片 */}
        <div className="mb-8 shrink-0">
          <h2 className="text-lg font-bold text-slate-800 mb-4">实时诊断大屏 (Diagnostic Insights)</h2>
          <div className="grid grid-cols-4 gap-6">
            {/* 雷达图 */}
            <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-base">系统级六维健康雷达</h3>
              </div>
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={evalData.radarData}>
                    <PolarGrid stroke="#f1f5f9" />
                    <PolarAngleAxis dataKey="item" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="分数" dataKey="score" stroke="#1677ff" strokeWidth={2} fill="#1677ff" fillOpacity={0.4} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 子专家档位直方图 */}
            <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-base">微专家阵列定档追踪 (1-5档)</h3>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evalData.expertTiers} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="expert" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="tier" fill="#1677ff" radius={[4, 4, 0, 0]} barSize={24}>
                      {evalData.expertTiers.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.tier >= 4 ? '#1677ff' : (entry.tier <= 2 ? '#f87171' : '#94a3b8')} />
                      ))}
                      <LabelList dataKey="tier" position="top" fill="#64748b" fontSize={12} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 新增: 使命型 vs 未来型 指标达成度卡片 */}
            <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-base">两型指标体系 达成度</h3>
              </div>
              
              <div className="flex-1 flex flex-col gap-6 justify-center">
                {/* 使命型 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <SafetyCertificateOutlined className="text-blue-500 text-lg" />
                      <span className="font-bold text-slate-700">使命型 17项指标</span>
                    </div>
                    <span className="font-bold text-blue-600">14/17 达标</span>
                  </div>
                  <Progress percent={Math.round((14/17)*100)} showInfo={false} strokeColor="#1677ff" trailColor="#f1f5f9" strokeWidth={8} />
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">基于“一致性+有效性”评价，解决当下产业响应能力。</p>
                </div>

                {/* 未来型 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <RocketOutlined className="text-purple-500 text-lg" />
                      <span className="font-bold text-slate-700">未来型 13项指标</span>
                    </div>
                    <span className="font-bold text-purple-600">3/13 探索</span>
                  </div>
                  <Progress percent={Math.round((3/13)*100)} showInfo={false} strokeColor="#a855f7" trailColor="#f1f5f9" strokeWidth={8} />
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">面向第四代大学形态，评估产业趋势引领与教育重构力。</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 底部细节区 (Bottom Details) */}
        <div className="grid grid-cols-3 gap-6 shrink-0 pb-8">
          
          {/* 判决与高频标签 */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-base">AI 语义识别高频标签</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {evalData.tags.map((tag, i) => {
                const isNegative = tag.includes('缺失') || tag.includes('薄弱') || tag.includes('崩溃') || tag.includes('空泛') || tag.includes('闲置') || tag.includes('预警');
                return (
                  <span key={i} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    isNegative ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {tag}
                  </span>
                )
              })}
            </div>
            <div className="mt-8">
              <h4 className="text-sm font-bold text-slate-700 mb-3">总司令核心判词:</h4>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                “该机械工程专业呈现'两端强劲、中间塌陷'的典型哑铃型发展格局。产业对接端极其精准（90.4%对口率），但核心教学环节资源利用率低下（180万高端设备零使用率）。亟需启动教学环节强化工程...”
              </p>
            </div>
          </div>

          {/* 数据完整度图表 */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 text-base">底层模板覆盖完备度</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-4xl font-black text-slate-800">85%</span>
                  <span className="text-xs text-slate-500 font-bold mt-1">全局覆盖率</span>
                </div>
              </div>
              
              <div className="w-full mt-6 space-y-3 px-4">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{backgroundColor: item.color}}></div>
                      <span className="font-bold text-slate-700">{item.name}</span>
                    </div>
                    <span className="text-slate-500 font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 模板管理中心快捷入口 */}
          <div className="col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-sm text-white flex flex-col relative overflow-hidden group cursor-pointer" onClick={() => router.push('/templates')}>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-bold text-white text-base">底层模板中心</h3>
            </div>
            <div className="flex-1 flex flex-col justify-end relative z-10">
              <p className="text-blue-100 text-sm leading-relaxed mb-6 font-medium">
                集中管理 T01-T19 全景数据模板。这些模板构成了**使命型**与**未来型**两大指标体系共同的数字底座。
              </p>
              <button className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg backdrop-blur-sm transition-colors border border-white/20">
                进入模板管理中心 &rarr;
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* ================= 右侧：用户与系统侧边栏 (Right: Sidebar) ================= */}
      <aside className="w-80 shrink-0 bg-slate-50 rounded-xl overflow-hidden flex flex-col gap-6">
        
        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-5">
            <Avatar size={56} className="bg-blue-600 shadow-md font-bold text-xl">壮</Avatar>
            <div>
              <h2 className="text-lg font-black text-slate-800 m-0 leading-tight">好大壮</h2>
              <Tag color="cyan" className="m-0 mt-1.5 font-bold border-cyan-200 text-cyan-700">权限管理员 (Admin)</Tag>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <DesktopOutlined /> 当前管理专业数
              </div>
              <span className="font-bold text-slate-800 text-base">32 个</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <CheckCircleOutlined /> 累计核准全景数据
              </div>
              <span className="font-bold text-blue-600 text-base">1,845 条</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <TrophyOutlined /> 使命型达标专业
              </div>
              <span className="font-bold text-emerald-600 text-base">5 个</span>
            </div>
          </div>
        </div>

        {/* 系统事件动态日志 */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex-1 overflow-y-auto custom-scrollbar">
          <h3 className="font-bold text-slate-800 text-base mb-6">底层数据变动预警</h3>
          <div className="space-y-6">
            {[
              { title: 'T19 校友数据更新', date: '2 小时前', badge: '验证成功', icon: <CrownOutlined />, color: 'text-blue-600', bg: 'bg-blue-50' },
              { title: 'T04 能力矩阵入库', date: '3 天前', badge: '建档完成', icon: <FileDoneOutlined />, color: 'text-slate-600', bg: 'bg-slate-100' },
              { title: '产教基地状态异常', date: '5 天前', badge: '严重偏离', icon: <WarningOutlined />, color: 'text-red-500', bg: 'bg-red-50' },
              { title: 'T11 教学大纲重构', date: '1 周前', badge: '版本演进', icon: <BookOutlined />, color: 'text-purple-600', bg: 'bg-purple-50' },
            ].map((act, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${act.bg} ${act.color} flex items-center justify-center text-lg shrink-0`}>
                  {act.icon}
                </div>
                <div className="flex-1 border-b border-slate-50 pb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-slate-800 leading-tight">{act.title}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{act.badge}</span>
                    <span className="text-xs text-slate-400 font-medium">{act.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

    </div>
  );
}
