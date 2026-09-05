'use client';
import React from 'react';
import { Avatar } from 'antd';
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  AreaChartOutlined,
  CrownOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar,
  PieChart, Pie, Cell
} from 'recharts';

// Mock Data
const performanceData = [
  { term: '2022-2023 (1)', score: 65 },
  { term: '2022-2023 (2)', score: 72 },
  { term: '2023-2024 (1)', score: 70 },
  { term: '2023-2024 (2)', score: 85 },
  { term: '2024-2025 (1)', score: 78 },
  { term: '2024-2025 (2)', score: 89 },
  { term: '2025-2026 (1)', score: 92 },
];

const coverageData = [
  { module: 'T01-T04', pending: 2, completed: 8 },
  { module: 'T05-T08', pending: 4, completed: 6 },
  { module: 'T09-T12', pending: 1, completed: 9 },
  { module: 'T13-T16', pending: 3, completed: 7 },
  { module: 'T17-T19', pending: 0, completed: 10 },
];

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
            <p className="text-slate-500 mt-2 font-medium">Dalian Polytechnic University - Smart Evaluation Center</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: '全景数据节点 (Nodes)', value: '1,128', icon: <DatabaseOutlined /> },
            { label: '智能体诊断数 (Diagnoses)', value: '436', icon: <CheckCircleOutlined /> },
            { label: '平均健康度 (Avg Score)', value: '87.5', icon: <AreaChartOutlined /> },
            { label: '待处理预警 (Alerts)', value: '3', icon: <WarningOutlined /> },
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
          {/* Line Chart */}
          <div className="col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Evaluation Performance</h3>
              <span className="text-xs font-bold text-slate-500 border border-slate-200 rounded px-3 py-1">Last 4 Years</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="term" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="score" stroke="#1677ff" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" activeDot={{ r: 6, fill: '#1677ff', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">Template Coverage</h3>
              <span className="text-xs font-bold text-slate-500 border border-slate-200 rounded px-3 py-1">T01-T19</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coverageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="module" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="completed" fill="#1677ff" radius={[4, 4, 0, 0]} barSize={14} />
                  <Bar dataKey="pending" fill="#bae0ff" radius={[4, 4, 0, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Logs List */}
          <div className="col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg">System Logs</h3>
              <span className="text-sm font-bold text-blue-600 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="space-y-6">
              {[
                { title: 'Industry Expert Completed', time: '2:00 PM', desc: 'T03 report processed successfully.' },
                { title: 'Alignment Engine Started', time: '11:15 AM', desc: 'Running matrix verification against T04 and T11.' },
                { title: 'New Data Ingested', time: '10:00 AM', desc: 'T06 student logs uploaded from external API.' }
              ].map((log, i) => (
                <div key={i} className="flex gap-4">
                  <Avatar src={`https://api.dicebear.com/7.x/identicon/svg?seed=${i}`} className="bg-slate-100" />
                  <div>
                    <div className="flex justify-between items-center mb-1 w-48">
                      <span className="font-bold text-sm text-slate-800">{log.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 mb-1">{log.time}</div>
                    <div className="text-sm text-slate-500 leading-tight">{log.desc}</div>
                  </div>
                </div>
              ))}
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
                { title: 'Evaluation Engine', date: '2 days ago', badge: 'Completed', icon: <CrownOutlined />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { title: 'T04 Upload', date: '3 days ago', badge: 'Success', icon: <FileDoneOutlined />, color: 'text-slate-600', bg: 'bg-slate-100' },
                { title: 'Asset Expert Alert', date: '5 days ago', badge: 'Warning', icon: <WarningOutlined />, color: 'text-slate-500', bg: 'bg-slate-100' }
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
