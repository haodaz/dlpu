'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Typography, Tag, Space, Divider, Row, Col, Progress, Alert } from 'antd';
import { PlayCircleOutlined, SyncOutlined, CheckOutlined, DashboardOutlined, TrophyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function SmartEvaluationEngine() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [logs, setLogs] = useState<{message: string, icon?: string, status?: string}[]>([]);
  const [agents, setAgents] = useState<Record<string, any>>({});
  const [finalReport, setFinalReport] = useState<any>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startEvaluation = async () => {
    setIsRunning(true);
    setIsFinished(false);
    setLogs([]);
    setAgents({});
    setFinalReport(null);
    
    try {
      const response = await fetch('/api/evaluation', {
        method: 'POST',
      });
      
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
                setAgents(prev => ({
                  ...prev,
                  [event.data.id]: event.data
                }));
              } else if (event.type === 'result') {
                setFinalReport(event.data);
                setIsFinished(true);
              } else if (event.type === 'error') {
                setLogs(prev => [...prev, { message: `[ERROR] ${event.message}`, status: 'error' }]);
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.error(e);
      setLogs(prev => [...prev, { message: '[SYSTEM ERROR] 连接引擎失败', status: 'error' }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getAgentStyle = (status: string) => {
    if (status === 'working') return 'bg-blue-50 border-blue-200';
    if (status === 'done') return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getAgentText = (status: string) => {
    if (status === 'working') return <span className="text-blue-500 text-xs font-bold"><SyncOutlined spin className="mr-1" />撰写中</span>;
    if (status === 'done') return <span className="text-green-500 text-xs font-bold"><CheckOutlined className="mr-1" />完成</span>;
    return <span className="text-gray-400 text-xs font-bold">等待中</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      
      {!isRunning && !isFinished && (
        <div className="text-center mt-20">
          <Title level={2} className="!text-slate-800 !mb-4">大连工业大学 专业建设全景智能评价</Title>
          <Paragraph className="text-slate-500 text-lg mb-8 max-w-2xl mx-auto">
            调用十余个细分领域专属微专家，并发进行数据穿透与互联网核验。
          </Paragraph>
          <Button 
            type="primary" 
            size="large" 
            icon={<PlayCircleOutlined />} 
            onClick={startEvaluation}
            className="bg-blue-600 hover:bg-blue-500 border-none px-8 h-12 text-lg shadow-lg shadow-blue-200"
          >
            启动全栈并发评估
          </Button>
        </div>
      )}

      {(isRunning || isFinished) && (
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 md:p-12 mb-8">
          <div className="text-center mb-10">
            <Title level={3} className="!text-slate-800 !mb-2">AI 正在生成专业评价智能报告...</Title>
            <div className="text-slate-400 text-sm">多智能体协作撰写中，各子智能体并行工作后由主智能体整合</div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {Object.values(agents).map((agent: any) => (
              <div key={agent.id} className={`w-36 flex flex-col items-center justify-center p-4 rounded-xl border ${getAgentStyle(agent.status)} transition-all duration-300`}>
                <div className="text-2xl mb-2">{agent.icon}</div>
                <div className="font-bold text-slate-700 text-xs text-center mb-2">{agent.name}</div>
                <div>{getAgentText(agent.status)}</div>
              </div>
            ))}
          </div>

          {!isFinished && (
            <div className="relative pl-6 max-w-3xl mx-auto min-h-[200px]">
              <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-gradient-to-b from-green-300 to-blue-200 rounded-full"></div>
              {logs.map((log, i) => (
                <div key={i} className="relative flex items-start mb-3 animate-fade-in">
                  <div className={`absolute -left-[23px] mt-1 bg-white rounded-full ${log.status === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                    {log.status === 'working' ? <SyncOutlined spin className="text-blue-400" /> : <CheckOutlined />}
                  </div>
                  <div className="text-slate-600 text-sm leading-relaxed">
                    <span className="text-slate-400 mr-2">↳</span>
                    {log.message}
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}

          {isFinished && finalReport && (
            <div className="mt-8 animate-fade-in">
              <Divider className="my-10" />
              <div className="text-center mb-8">
                <Title level={2} className="!text-slate-800"><TrophyOutlined className="text-yellow-500 mr-2" /> 专业建设综合评价报告</Title>
                <div className="text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent my-4">
                  {finalReport.totalScore} 分 / {finalReport.grade}
                </div>
              </div>

              <Alert
                message="总司令诊断结论"
                description={<div className="text-base text-slate-700 mt-2 leading-relaxed">{finalReport.diagnosis}</div>}
                type="success"
                showIcon
                className="mb-10 bg-emerald-50 border-emerald-200"
              />

              <div className="mb-6"><span className="text-lg font-bold text-slate-800 border-b-2 border-blue-500 pb-1">各领域专家审查存证</span></div>
              
              <div className="space-y-6">
                {finalReport.evidence.map((ev: any) => (
                  <Card key={ev.id} size="small" title={<span className="font-bold text-slate-700">{ev.name}</span>} className="bg-slate-50 border-slate-200">
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <div className="flex">
                          <div className="w-24 shrink-0 text-slate-500 text-sm">现状</div>
                          <div className="font-medium text-slate-800">{ev.report?.status || '暂无'}</div>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div className="flex">
                          <div className="w-24 shrink-0 text-slate-500 text-sm">对应指标</div>
                          <div className="font-bold text-blue-600">{ev.report?.indicator || '暂无'}</div>
                        </div>
                      </Col>
                      <Col span={24}>
                        <div className="flex">
                          <div className="w-24 shrink-0 text-slate-500 text-sm">专家分析</div>
                          <div className="text-slate-700">{ev.report?.analysis || '暂无'}</div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {(isRunning || isFinished) && (
        <Button onClick={() => router.push('/panoramic')} size="large" className="bg-white">
          停止并返回全景大盘
        </Button>
      )}
    </div>
  );
}
