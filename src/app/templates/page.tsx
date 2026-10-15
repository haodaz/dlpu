'use client';
import React from 'react';
import { Button } from 'antd';
import { useRouter } from 'next/navigation';
import { FormOutlined, LayoutOutlined } from '@ant-design/icons';
import { TEMPLATES } from '@/lib/templates';
import SourceTag from '@/components/diagnosis/SourceTag';

// 模板目录统一在 src/lib/templates.ts 维护(与管理员「模板与范本」同一份)
const templates = TEMPLATES;

export default function TemplatesPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      
      {/* 极简 CRM 风格 Header */}
      <div className="px-8 py-8 flex items-center gap-4 shrink-0 max-w-6xl mx-auto w-full">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-sm">
          <LayoutOutlined />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">模板库</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">全部 {templates.length} 个模板;标「教师范本」的会在你的待办与填报页里同屏给出,照着填即可。</p>
        </div>
      </div>

      {/* 核心内容区：无边框包裹，卡片直铺，超大内部留白 */}
      <main className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          {templates.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-between hover:border-blue-400 hover:shadow-md transition-all duration-300 border-l-[6px] ${item.isTeacherSample ? 'border-l-orange-400' : 'border-l-blue-500'}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3 flex-wrap">
                  <span className="font-bold text-slate-800 text-xl tracking-tight">{item.id} <span className="ml-1 text-slate-700">{item.name}</span></span>
                  {item.isTeacherSample && (
                    <span className="px-2 py-0.5 rounded text-[12px] font-bold border bg-orange-50 border-orange-200 text-orange-700">教师范本</span>
                  )}
                  <SourceTag source={item.owner} full />
                  <span className="text-[12px] text-slate-400 font-mono">关联指标 {item.indicators.join(' / ')}</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-sm m-0 max-w-3xl">{item.desc}</p>
              </div>
              
              <div className="shrink-0 ml-8">
                <Button
                  type="primary"
                  icon={<FormOutlined />}
                  size="large"
                  className="font-bold px-6 h-12 shadow-sm bg-blue-600 hover:bg-blue-500"
                  onClick={() => router.push(item.path)}
                >
                  打开模板
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}
