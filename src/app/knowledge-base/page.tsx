'use client';
import React from 'react';
import { ReadOutlined } from '@ant-design/icons';

export default function KnowledgeBasePage() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      <div className="px-8 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl bg-cyan-600 flex items-center justify-center text-white text-xl shadow-sm">
            <ReadOutlined />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0 leading-tight">知识库</h1>
            <p className="text-sm text-slate-500 m-0 mt-0.5">指标解读、填报指南、常见问题与最佳实践</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-2xl mb-3">📘</div>
            <h2 className="font-bold text-slate-800 text-base m-0 mb-1">指标解读手册</h2>
            <p className="text-sm text-slate-500 m-0">17 项指标的详细定义、计算公式、数据要求与评分规则</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-2xl mb-3">📝</div>
            <h2 className="font-bold text-slate-800 text-base m-0 mb-1">填报操作指南</h2>
            <p className="text-sm text-slate-500 m-0">上传材料格式要求、AI 填报确认流程、常见操作问题</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-2xl mb-3">🤖</div>
            <h2 className="font-bold text-slate-800 text-base m-0 mb-1">AI 能力说明</h2>
            <p className="text-sm text-slate-500 m-0">AI 预填的工作原理、置信度含义、外部数据源说明</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-2xl mb-3">❓</div>
            <h2 className="font-bold text-slate-800 text-base m-0 mb-1">常见问题 FAQ</h2>
            <p className="text-sm text-slate-500 m-0">数据不匹配、置信度低、异常检测等高频问题解答</p>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 text-base m-0 mb-3">📌 快速链接</h2>
          <div className="flex flex-wrap gap-2">
            {['1.1.1 产业深度解析', '1.1.2 课程-产业链对应性', '2.3.1 学习行为数据', '4.1.1 对口就业率', '置信度说明', '异常检测规则'].map((t) => (
              <span key={t} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer transition-colors">
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          知识库内容持续建设中，敬请期待
        </div>
      </div>
    </div>
  );
}

