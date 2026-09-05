'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Tag, Divider, Spin } from 'antd';
import { PlayCircleOutlined, SyncOutlined, CheckOutlined, FileTextOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const { Title, Paragraph } = Typography;

export default function SmartEvaluationEngine() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [logs, setLogs] = useState<{message: string, icon?: string, status?: string}[]>([]);
  const [agents, setAgents] = useState<Record<string, any>>({});
  const [finalReport, setFinalReport] = useState<any>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFinished) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isFinished]);

  const startEvaluation = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setHasError(false);
    setLogs([]);
    setAgents({});
    setFinalReport(null);
    
    try {
      const response = await fetch('/api/evaluation', { method: 'POST' });
      if (!response.body) return;
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const event = JSON.parse(dataStr);
              if (event.type === 'log') {
                setLogs(prev => [...prev, { message: event.message, status: 'done' }]);
              } else if (event.type === 'agent') {
                setAgents(prev => ({ ...prev, [event.data.id]: event.data }));
              } else if (event.type === 'result') {
                setFinalReport(event.data);
                setIsFinished(true);
              } else if (event.type === 'error') {
                setLogs(prev => [...prev, { message: `[ERROR] ${event.message}`, status: 'error' }]);
                setHasError(true);
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error(e);
      setLogs(prev => [...prev, { message: '[SYSTEM ERROR] 连接引擎失败', status: 'error' }]);
      setHasError(true);
    } finally {
      setIsRunning(false);
    }
  };

  const getAgentStyle = (status: string) => {
    if (status === 'working') return 'bg-blue-50 border-blue-200';
    if (status === 'done') return 'bg-green-50 border-green-200';
    if (status === 'error') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getAgentText = (status: string) => {
    if (status === 'working') return <span className="text-blue-500 text-xs font-bold"><SyncOutlined spin className="mr-1" />撰写中</span>;
    if (status === 'done') return <span className="text-green-500 text-xs font-bold"><CheckOutlined className="mr-1" />完成</span>;
    if (status === 'error') return <span className="text-red-500 text-xs font-bold">崩溃</span>;
    return <span className="text-gray-400 text-xs font-bold">等待中</span>;
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('卓越') || grade.includes('优秀')) return 'bg-green-100 text-green-700 border-green-200';
    if (grade.includes('良好')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (grade.includes('合格')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // --- 报告渲染 ---
  if (isFinished && finalReport) {
    const expertKeys = Object.keys(finalReport.expertResults);
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        {/* 固定顶部导航 */}
        <div className="sticky top-0 w-full bg-white border-b border-gray-200 shadow-sm z-50 flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-xl"><FileTextOutlined /></span>
            <span className="font-bold text-gray-800 text-lg">知己智库报告引擎</span>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => window.print()}>导出 PDF</Button>
            <Button type="primary" onClick={() => router.push('/panoramic')}>返回工作台</Button>
          </div>
        </div>

        {/* 报告正文 (模仿 zhiji-yida) */}
        <div className="w-full max-w-4xl bg-white shadow-xl my-10 relative print:shadow-none print:my-0">
          
          {/* Cover Page */}
          <div className="min-h-screen flex flex-col items-center justify-center p-20 relative">
            <div className="flex items-center gap-2 text-blue-500 font-bold mb-10 self-start absolute top-20 left-20">
              <span className="text-xl">✨</span>
              <span>知己 · 专业建设全景智能评估报告 (Mission-Driven Intelligence)</span>
            </div>
            
            <div className="text-center w-full mt-20">
              <h1 className="text-5xl font-black text-gray-900 leading-[1.3] mb-8 tracking-tight">
                使命型指标体系与全景数据：<br/>专业建设跨维协同生态报告
              </h1>
              <div className="w-16 h-1 bg-blue-600 mx-auto mb-8"></div>
              <p className="text-xl text-gray-500 font-light tracking-widest">
                高难技术需求下全域资源匹配及产研合作建议书
              </p>
            </div>

            <div className="absolute bottom-20 text-center w-full tracking-[0.5em] text-gray-300 font-medium text-sm">
              C O N F I D E N T I A L R E P O R T
            </div>
          </div>

          <Divider className="my-0 border-gray-200" />

          {/* Chief Summary (01) */}
          <div className="p-20 border-b border-gray-100 min-h-screen">
            <div className="text-blue-600 font-bold text-xl mb-6">01. 综合诊断与全局战略画像</div>
            
            <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
              <div className="flex-1">
                <div className="text-sm text-gray-400 mb-2">综合评级与得分</div>
                <div className="text-6xl font-black text-gray-900 mb-4">
                  {finalReport.grade} <span className="text-4xl text-blue-600">{finalReport.totalScore}</span>
                </div>
                <div className="text-gray-700 leading-loose text-justify text-base">
                  {finalReport.diagnosis}
                </div>
              </div>
              <div className="w-full md:w-1/2 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={finalReport.radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="item" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#9ca3af'}} />
                    <Radar name="能力值" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-blue-50/50 p-8 rounded-2xl border border-blue-100">
              <h3 className="text-lg font-bold text-blue-800 mb-4">全局战略改进建议</h3>
              <div className="text-gray-700 leading-loose whitespace-pre-wrap">
                {finalReport.suggestions}
              </div>
            </div>
          </div>

          {/* Expert Reports (02 - 10) */}
          {expertKeys.map((expertId, idx) => {
            const exp = finalReport.expertResults[expertId];
            if (!exp) return null;
            const sectionNumber = String(idx + 2).padStart(2, '0');
            
            return (
              <div key={expertId} className="p-20 border-b border-gray-100 min-h-screen relative group">
                <div className="text-blue-600 font-bold text-xl mb-10">
                  {sectionNumber}. {exp.indicator} 深度剖析
                </div>

                <div className="absolute top-20 right-20">
                  <div className={`px-4 py-2 rounded-full border text-sm font-bold shadow-sm ${getGradeColor(exp.grade)}`}>
                    专项评级：{exp.grade}
                  </div>
                </div>

                <div className="space-y-12">
                  <div>
                    <h4 className="text-gray-400 text-sm font-bold tracking-widest mb-4 uppercase">Status & Facts</h4>
                    <div className="text-gray-800 text-lg leading-relaxed bg-gray-50 p-6 border-l-4 border-gray-300 rounded-r-lg">
                      {exp.status}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-bold tracking-widest mb-4 uppercase">Evaluation Criteria</h4>
                    <div className="text-gray-600 leading-relaxed font-medium">
                      标准：{exp.criteria}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-bold tracking-widest mb-4 uppercase">Deep Analysis</h4>
                    <div className="text-gray-700 leading-loose text-justify whitespace-pre-wrap">
                      {exp.analysis}
                    </div>
                  </div>

                  <div className="bg-slate-800 p-8 rounded-2xl text-slate-100 shadow-xl">
                    <h4 className="text-blue-400 text-sm font-bold tracking-widest mb-4 uppercase flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block animate-pulse"></span>
                      Intervention Suggestions
                    </h4>
                    <div className="text-slate-300 leading-loose whitespace-pre-wrap">
                      {exp.suggestions}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- 初始状态 & 加载状态 (Engine Dashboard) ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-10 px-4">
      
      {!isRunning && !isFinished && !hasError && (
        <div className="text-center mt-20">
          <Title level={2} className="!text-slate-800 !mb-6">专业建设协同评价引擎</Title>
          <Paragraph className="text-slate-500 text-lg mb-12 max-w-2xl mx-auto">
            即将并行唤醒 9 位细分领域专属微专家，穿透全景数据并执行互联网级深度核验。
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            icon={<PlayCircleOutlined />} 
            onClick={startEvaluation}
            className="bg-blue-600 hover:bg-blue-500 border-none px-12 h-14 text-lg font-bold shadow-[0_4px_15px_rgba(37,99,235,0.3)] rounded-full transition-transform hover:scale-105"
          >
            启动多智能体并发评估
          </Button>
        </div>
      )}

      {(isRunning || hasError) && (
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-slate-200 p-8 md:p-12">
          <div className="text-center mb-12">
            <Title level={3} className="!text-slate-800 !mb-2">
              {hasError ? '诊断过程中断' : 'AI 集群深度评估中'}
            </Title>
            <div className="text-slate-500 text-sm flex justify-center items-center gap-2">
              {!hasError && <Spin indicator={<SyncOutlined spin className="text-blue-500" />} />}
              {hasError ? '系统捕获到异常，请查看日志并重试' : 'Promise.allSettled 防御性并发调度运行中...'}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {Object.values(agents).map((agent: any) => (
              <div key={agent.id} className={`w-40 flex flex-col items-center justify-center p-5 rounded-2xl border ${
                  agent.status === 'working' ? 'bg-blue-50 border-blue-200 shadow-sm' : 
                  agent.status === 'done' ? 'bg-green-50 border-green-200' : 
                  agent.status === 'error' ? 'bg-red-50 border-red-200' :
                  'bg-slate-50 border-slate-200'
                } transition-all duration-500`}>
                <div className="text-3xl mb-3">{agent.icon}</div>
                <div className="font-bold text-slate-700 text-xs text-center mb-3 h-8 flex items-center justify-center">{agent.name}</div>
                <div>{getAgentText(agent.status)}</div>
              </div>
            ))}
          </div>

          <div className="relative pl-6 max-w-4xl mx-auto min-h-[300px] max-h-[400px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50 rounded-xl p-6 border border-slate-100 shadow-inner">
            <div className="absolute left-[34px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-300 to-purple-300 rounded-full"></div>
            {logs.map((log, i) => (
              <div key={i} className="relative flex items-start mb-4 animate-fade-in-up">
                <div className={`absolute -left-[35px] mt-1 bg-white rounded-full p-1 z-10 ${
                  log.status === 'error' ? 'text-red-500' : 'text-blue-500'
                }`}>
                  {log.status === 'working' ? <SyncOutlined spin /> : <CheckOutlined />}
                </div>
                <div className={`text-sm leading-relaxed ${log.status === 'error' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                  <span className="text-slate-400 mr-3 font-mono opacity-60 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200">{String(i+1).padStart(2, '0')}</span>
                  {log.message}
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
          
          {hasError && (
             <div className="mt-8 text-center">
               <Button onClick={startEvaluation} type="primary" size="large" className="mr-4">
                 重新尝试
               </Button>
               <Button onClick={() => router.push('/panoramic')} size="large">
                 返回工作台
               </Button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
