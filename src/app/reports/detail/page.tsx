'use client';
import React, { useState, useEffect } from 'react';
import { FileTextOutlined, ProfileOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface HistoryReport {
  id: number;
  date: string;
  grade: string;
  score: number;
  data: any;
}

const getGradeColor = (grade: string) => {
  if (!grade) return 'bg-gray-100 text-gray-700 border-gray-200';
  if (grade.includes('卓越') || grade.includes('优秀')) return 'bg-green-100 text-green-700 border-green-200';
  if (grade.includes('良好')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (grade.includes('合格')) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-red-100 text-red-700 border-red-200';
};

export default function ReportListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<HistoryReport[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('dlpu_eval_history');
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        setReports([]);
      }
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      <div className="px-8 py-8 flex items-center gap-4 shrink-0 max-w-6xl mx-auto w-full">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-2xl shadow-sm">
          <ProfileOutlined />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 m-0 leading-tight">报告列表</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">查看历史生成的 AI 评价报告，点击进入报告详情。</p>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          {reports.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-16 text-center">
              <div className="text-slate-400 text-base mb-2">暂无报告</div>
              <p className="text-slate-500 text-sm mb-6">前往评价引擎生成第一份 AI 评价报告。</p>
              <button
                onClick={() => router.push('/evaluations')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium"
              >
                去生成报告
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => router.push(`/evaluations?reportId=${report.id}`)}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="text-slate-400 text-sm mb-6 font-mono bg-slate-50 inline-block px-3 py-1 rounded-full">
                      {report.date}
                    </div>
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-5xl font-black text-slate-800">{report.score}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeColor(report.grade)}`}>
                        {report.grade}
                      </span>
                    </div>
                    <div className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                      {report.data?.diagnosis || '暂无诊断摘要'}
                    </div>
                  </div>
                  <div className="mt-6 text-blue-500 text-sm font-bold flex items-center gap-1 group">
                    查看详情 <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
