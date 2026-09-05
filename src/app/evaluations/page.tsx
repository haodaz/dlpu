'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Tag, Divider, Spin, Table } from 'antd';
import { PlayCircleOutlined, SyncOutlined, CheckOutlined, FileTextOutlined, DatabaseOutlined, HomeOutlined } from '@ant-design/icons';
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
  
  // History state
  const [historyReports, setHistoryReports] = useState<any[]>([]);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('dlpu_eval_history');
    if (saved) {
      try {
        setHistoryReports(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

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
                setLogs(prev => [...prev, { agentId: event.agentId || 'system', message: event.message, status: 'done' }]);
              } else if (event.type === 'agent') {
                setAgents(prev => ({ ...prev, [event.data.id]: event.data }));
              } else if (event.type === 'result') {
                setFinalReport(event.data);
                setIsFinished(true);
                
                // Save to history
                const newReport = {
                  id: Date.now(),
                  date: new Date().toLocaleString(),
                  grade: event.data.grade,
                  score: event.data.totalScore,
                  data: event.data
                };
                setHistoryReports(prev => {
                  const updated = [newReport, ...prev].slice(0, 10);
                  localStorage.setItem('dlpu_eval_history', JSON.stringify(updated));
                  return updated;
                });

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
    if (!grade) return 'bg-gray-100 text-gray-700 border-gray-200';
    if (grade.includes('卓越') || grade.includes('优秀')) return 'bg-green-100 text-green-700 border-green-200';
    if (grade.includes('良好')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (grade.includes('合格')) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getTraceabilityData = (expertResults: any) => {
    if (!expertResults) return [];
    
    const mapping = [
      { template: 'T03 产业白皮书', expertKey: 'expert_industry' },
      { template: 'T04 课程体系矩阵', expertKey: 'expert_alignment' },
      { template: 'T06 过程性评价', expertKey: 'expert_student' },
      { template: 'T09 平台行为日志', expertKey: 'expert_student' },
      { template: 'T10 资产台账', expertKey: 'expert_asset' },
      { template: 'T12 综合验证课程', expertKey: 'expert_practice' },
      { template: 'T13 毕业设计', expertKey: 'expert_practice' },
      { template: 'T14 产教合作协议', expertKey: 'expert_integration' },
      { template: 'T15 师资投入深度', expertKey: 'expert_teacher' },
      { template: 'T18 初次就业质量', expertKey: 'expert_career' },
      { template: 'T19 校友追踪', expertKey: 'expert_alumni' }
    ];

    return mapping.map((m, idx) => {
      const res = expertResults[m.expertKey];
      return {
        key: idx,
        template: m.template,
        expert: res ? res.indicator : '无数据',
        grade: res ? res.grade : 'N/A'
      };
    });
  };

  // --- 报告渲染 ---
  if (isFinished && finalReport) {
    const expertKeys = Object.keys(finalReport.expertResults);
    
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center">
        {/* 固定顶部导航 */}
        <div className="sticky top-0 w-full bg-white border-b border-gray-200 shadow-sm z-50 flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <span className="text-blue-600 text-xl"><FileTextOutlined /></span>
            <span className="font-bold text-gray-800 text-lg">方略一答报告引擎</span>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => window.print()}>导出 PDF</Button>
            <Button onClick={() => { setIsFinished(false); setFinalReport(null); }} icon={<HomeOutlined />}>返回报告大厅</Button>
            <Button type="primary" onClick={() => router.push('/panoramic')}>返回工作台</Button>
          </div>
        </div>

        {/* 报告正文 (模仿 zhiji-yida) */}
        <div className="w-full max-w-4xl bg-white shadow-xl my-10 relative print:shadow-none print:my-0">
          
          {/* Cover Page */}
          <div className="min-h-screen flex flex-col items-center justify-center p-20 relative">
            <div className="flex items-center gap-2 text-blue-500 font-bold mb-10 self-start absolute top-20 left-20">
              <span className="text-xl">✨</span>
              <span>方略一答 · 专业建设全景智能评估报告 (Mission-Driven Intelligence)</span>
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
            <div className="text-blue-600 font-bold text-xl mb-10">01. 综合诊断与全局战略画像</div>
            
            <div className="flex flex-col items-center mb-16 gap-12">
              <div className="w-full max-w-2xl h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={finalReport.radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="item" tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{fill: '#9ca3af'}} />
                    <Radar name="能力值" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full">
                <div className="text-center mb-10">
                  <div className="text-sm text-gray-400 mb-2 font-bold tracking-widest uppercase">综合评级与得分</div>
                  <div className="text-6xl font-black text-gray-900 mb-4 flex justify-center items-baseline gap-4">
                    {finalReport.grade} <span className="text-5xl text-blue-600">{finalReport.totalScore}</span>
                  </div>
                </div>
                <div className="text-gray-700 leading-loose text-justify text-lg bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-sm">
                  {finalReport.diagnosis}
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-8 rounded-2xl border border-blue-100 mb-16">
              <h3 className="text-lg font-bold text-blue-800 mb-4">全局战略改进建议</h3>
              <div className="text-gray-700 leading-loose whitespace-pre-wrap">
                {finalReport.suggestions}
              </div>
            </div>

            {/* T-Module Traceability Table */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <DatabaseOutlined className="text-blue-500" />
                底层数据追溯表 (Data Traceability Matrix)
              </h3>
              <Table 
                dataSource={getTraceabilityData(finalReport.expertResults)}
                columns={[
                  { title: '底层 T 模板数据源', dataIndex: 'template', key: 'template', width: '25%', render: (t) => <Tag color="blue" className="font-mono text-sm py-1 px-2">{t}</Tag> },
                  { title: '上层评估维度 (主责微专家)', dataIndex: 'expert', key: 'expert', width: '50%', render: (e) => <span className="font-bold text-slate-700">{e}</span> },
                  { title: '评级追溯', dataIndex: 'grade', key: 'grade', align: 'center', render: (g) => <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeColor(g)}`}>{g}</span> }
                ]}
                pagination={false}
                size="middle"
                className="border border-gray-100 rounded-xl overflow-hidden shadow-sm"
              />
            </div>
          </div>

          {/* Expert Reports (02 - 10) */}
          {expertKeys.map((expertId, idx) => {
            const exp = finalReport.expertResults[expertId];
            if (!exp) return null;
            const sectionNumber = String(idx + 2).padStart(2, '0');
            
            return (
              <div key={expertId} className="p-20 border-b border-gray-100 min-h-screen relative group">
                <div className="mb-10">
                  <div className="text-blue-600 font-bold text-xl mb-4">
                    {sectionNumber}. {exp.indicator} 深度剖析
                  </div>
                  {exp.chartData && exp.chartData.tags && (
                    <div className="flex flex-wrap gap-2">
                      {exp.chartData.tags.map((tag: string) => (
                        <Tag key={tag} color="blue" className="rounded-full px-3 py-0.5 shadow-sm border border-blue-200">{tag}</Tag>
                      ))}
                    </div>
                  )}
                </div>

                <div className="absolute top-20 right-20 flex flex-col items-end gap-4">
                  <div className={`px-4 py-2 rounded-full border text-sm font-bold shadow-sm ${getGradeColor(exp.grade)}`}>
                    专项评级：{exp.grade}
                  </div>
                  
                  {exp.chartData && exp.chartData.tier && (
                    <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 flex flex-col items-end gap-2 shadow-sm">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{exp.chartData.tier.label}</div>
                      <div className="flex gap-1">
                        {Array.from({ length: exp.chartData.tier.totalTiers }).map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-6 h-6 rounded-sm flex items-center justify-center font-bold text-xs ${
                              i < exp.chartData!.tier.currentTier 
                                ? 'bg-indigo-500 text-white shadow-inner' 
                                : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative border-l-2 border-gray-200 ml-4 pl-10 space-y-12 py-4">
                  
                  {/* Status & Facts */}
                  <div className="relative">
                    <div className="absolute -left-[45px] top-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white ring-4 ring-gray-50 shadow-sm"></div>
                    <h4 className="text-gray-400 text-sm font-bold tracking-widest mb-4 uppercase">Status & Facts</h4>
                    <div className="text-gray-800 text-lg leading-relaxed bg-gray-50 p-6 border-l-4 border-gray-300 rounded-r-lg shadow-sm">
                      {exp.status}
                    </div>
                  </div>

                  {/* Criteria */}
                  <div className="relative">
                    <div className="absolute -left-[45px] top-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white ring-4 ring-gray-50 shadow-sm"></div>
                    <h4 className="text-gray-400 text-sm font-bold tracking-widest mb-4 uppercase">Evaluation Criteria</h4>
                    <div className="text-gray-600 leading-relaxed font-medium bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                      <span className="font-bold text-gray-700 mr-2">标准：</span>{exp.criteria}
                    </div>
                  </div>

                  {/* Analysis */}
                  <div className="relative">
                    <div className="absolute -left-[45px] top-1 w-3 h-3 bg-blue-300 rounded-full border-2 border-white ring-4 ring-blue-50 shadow-sm"></div>
                    <h4 className="text-blue-500 text-sm font-bold tracking-widest mb-4 uppercase">Deep Analysis</h4>
                    <div className="text-gray-700 leading-loose text-justify whitespace-pre-wrap">
                      {exp.analysis}
                    </div>
                  </div>

                  {/* Suggestions (Light mode) */}
                  <div className="relative">
                    <div className="absolute -left-[45px] top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white ring-4 ring-blue-100 animate-pulse shadow-sm"></div>
                    <div className="bg-blue-50/70 p-8 rounded-2xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                      <h4 className="text-blue-700 text-sm font-bold tracking-widest mb-4 uppercase">
                        Intervention Suggestions
                      </h4>
                      <div className="text-gray-800 leading-loose whitespace-pre-wrap font-medium">
                        {exp.suggestions}
                      </div>
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-start py-20 px-4">
      
      {!isRunning && !isFinished && !hasError && (
        <div className="w-full max-w-5xl">
          {/* Start Engine Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-16 text-center mb-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <Title level={1} className="!text-slate-800 !mb-6 !font-black">专业建设协同评价引擎</Title>
            <Paragraph className="text-slate-500 text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
              即将并行唤醒 9 位细分领域专属微专家，穿透全景数据并执行互联网级深度核验。<br/>
              完成评价后，将由「总司令」统筹生成万字长卷宗报告。
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlayCircleOutlined />} 
              onClick={startEvaluation}
              className="bg-blue-600 hover:bg-blue-500 border-none px-12 h-16 text-xl font-bold shadow-[0_8px_20px_rgba(37,99,235,0.3)] rounded-full transition-transform hover:scale-105"
            >
              启动多智能体并发评估
            </Button>
          </div>

          {/* History List */}
          {historyReports.length > 0 && (
            <div className="animate-fade-in-up">
              <Title level={3} className="!text-slate-700 !mb-8 flex items-center gap-3">
                <FileTextOutlined className="text-blue-500" /> 历史评级大厅 (最近报告)
              </Title>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {historyReports.map(report => (
                  <div 
                    key={report.id} 
                    className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all duration-300 flex flex-col justify-between"
                    onClick={() => {
                      setFinalReport(report.data);
                      setIsFinished(true);
                    }}
                  >
                    <div>
                      <div className="text-slate-400 text-sm mb-6 font-mono bg-slate-50 inline-block px-3 py-1 rounded-full">{report.date}</div>
                      <div className="flex items-baseline gap-4 mb-4">
                        <span className="text-5xl font-black text-slate-800">{report.score}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeColor(report.grade)}`}>
                          {report.grade}
                        </span>
                      </div>
                      <div className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                        {report.data.diagnosis}
                      </div>
                    </div>
                    <div className="mt-6 text-blue-500 text-sm font-bold flex items-center gap-1 group">
                      查看详情 <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

          <div className="max-w-4xl mx-auto min-h-[300px] max-h-[500px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-50 rounded-xl p-6 border border-slate-100 shadow-inner">
            {Object.keys(
              logs.reduce((acc, log) => {
                const id = log.agentId || 'system';
                if (!acc[id]) acc[id] = [];
                acc[id].push(log);
                return acc;
              }, {} as Record<string, typeof logs>)
            ).map(agentId => {
              const agentLogs = logs.filter(l => (l.agentId || 'system') === agentId);
              const agentInfo = agents[agentId] || { name: agentId === 'system' ? '系统调度总线' : agentId, icon: agentId === 'system' ? '⚙️' : '🤖' };
              
              return (
                <div key={agentId} className="mb-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-fade-in-up">
                  <div className="flex items-center gap-3 mb-4 font-bold text-slate-700 text-lg border-b border-slate-100 pb-3">
                    <span className="text-2xl">{agentInfo.icon}</span> {agentInfo.name}
                  </div>
                  <div className="relative pl-6">
                    <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-slate-200 rounded-full"></div>
                    {agentLogs.map((log, i) => (
                      <div key={i} className="relative flex items-start mb-4 animate-fade-in-up">
                        <div className={`absolute -left-[22px] mt-1.5 w-2 h-2 rounded-full ring-4 ring-white z-10 ${
                          log.status === 'error' ? 'bg-red-400' : 'bg-blue-400'
                        }`}></div>
                        <div className={`text-sm leading-relaxed ${log.status === 'error' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {log.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
          
          {hasError && (
             <div className="mt-8 text-center">
               <Button onClick={startEvaluation} type="primary" size="large" className="mr-4">
                 重新尝试
               </Button>
               <Button onClick={() => { setHasError(false); setIsRunning(false); }} size="large">
                 返回报告大厅
               </Button>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
