'use client';
import React from 'react';
import { LinkOutlined } from '@ant-design/icons';

export default function ExternalDataPage() {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      <div className="px-8 py-8 flex items-center gap-4 shrink-0 max-w-6xl mx-auto w-full">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-sm">
          <LinkOutlined />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">外部数据引用</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">对接外部系统数据源（教务/资产/招生等），统一引用与同步。</p>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="text-slate-400 text-base mb-2">模块建设中</div>
            <p className="text-slate-500 text-sm">该页面将管理外部数据源接入与引用记录。</p>
          </div>
        </div>
      </main>
    </div>
  );
}
