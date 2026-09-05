'use client';
import React from 'react';
import { Avatar } from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AreaChartOutlined,
  CrownOutlined,
  FileDoneOutlined,
  RadarChartOutlined
} from '@ant-design/icons';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';

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
    { expert: '产业白皮书', tier: 2 },
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
  { name: 'Completed', value: 85, color: '#1677ff' },
  { name: 'Pending', value: 15, color: '#e2e8f0' },
];

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50 rounded-xl overflow-hidden shadow-sm border border-slate-100">
      
      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        
        {/* Header Title */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight m-0">Dashboard</h1>
            <div className="flex items-center gap-3 mt-3">
              <img src="/dlpu_logo.png" alt="DLPU Logo" className="w-8 h-8 object-contain" />
              <p className="text-slate-500 font-medium m-0">Dalian Polytechnic University - Smart Evaluation Center</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: '全景数据节点 (Nodes)', value: '1,128', icon: <DatabaseOutlined /> },
            { label: '智能体诊断数 (Diagnoses)', value: '436', icon: <CheckCircleOutlined /> },
            { label: 'AI诊断总分 (Total Score)', value: evalData.totalScore, icon: <AreaChartOutlined /> },
            { label: '评级档位 (Grade)', value: evalData.grade, icon: <CrownOutlined /> },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-colors cursor-pointer">
              <div className="text-slate-500 text-sm font-bold mb-4">{stat.label}</div>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-slate-800">{stat.value}</span>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Radar Chart */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Holistic Health Radar</h3>
              <span className="text-xs font-bold text-slate-500 border border-slate-200 rounded px-3 py-1">六维模型</span>
            </div>
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={evalData.radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="item" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Score" dataKey="score" stroke="#1677ff" strokeWidth={2} fill="#1677ff" fillOpacity={0.4} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart for Expert Tiers */}
          <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Micro-Experts Tier Distribution</h3>
              <span className="text-xs font-bold text-slate-500 border border-slate-200 rounded px-3 py-1">档位: 1-5</span>
            </div>
            <div className="h-64">
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
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* AI Constructive Tags */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">AI 诊断高频标签</h3>
              <span className="text-sm font-bold text-blue-600 cursor-pointer hover:underline">View All</span>
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
              <h4 className="text-sm font-bold text-slate-700 mb-3">总司令判决要点:</h4>
              <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                “该机械工程专业呈现'两端强劲、中间塌陷'的典型哑铃型发展格局。产业对接端极其精准（90.4%对口率），但核心教学环节资源利用率低下（180万高端设备零使用率）。亟需启动教学环节强化工程...”
              </p>
            </div>
          </div>

          {/* Donut Chart */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-800 text-lg">Data Completeness</h3>
              <span className="text-slate-400 font-bold text-xl leading-none">...</span>
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
                  <span className="text-xs text-slate-500 font-bold mt-1">Total Coverage</span>
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

          {/* Activities */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Recent Activities</h3>
              <span className="text-sm font-bold text-blue-600 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="space-y-6 mt-4">
              {[
                { title: 'Evaluation Engine', date: '2 hours ago', badge: 'Completed', icon: <CrownOutlined />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'T04 Upload', date: '3 days ago', badge: 'Success', icon: <FileDoneOutlined />, color: 'text-slate-600', bg: 'bg-slate-100' },
                { title: 'Asset Expert Alert', date: '5 days ago', badge: 'Warning', icon: <WarningOutlined />, color: 'text-red-500', bg: 'bg-red-50' }
              ].map((act, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${act.bg} ${act.color} flex items-center justify-center text-lg shrink-0`}>
                    {act.icon}
                  </div>
                  <div className="flex-1 border-b border-slate-50 pb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm text-slate-800">{act.title}</span>
                      <span className="text-xs text-slate-400 font-medium">{act.date}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{act.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
