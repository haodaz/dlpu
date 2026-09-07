'use client';
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Row, Col, Breadcrumb, Typography, Spin, Alert, Table } from 'antd';
import { HomeOutlined, UserOutlined, DatabaseOutlined, RadarChartOutlined, BulbOutlined, ExperimentOutlined, InteractionOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import mockFaculty from '@/lib/mockFaculty.json';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const { Title, Paragraph } = Typography;

export default function FacultyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState<any>(null);

  useEffect(() => {
    params.then(p => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (resolvedParams?.id) {
      const f = mockFaculty.find((item: any) => item.id === resolvedParams.id);
      if (f) {
        setFaculty(f);
      }
      setLoading(false);
    }
  }, [resolvedParams]);

  if (loading) return <div className="p-20 text-center"><Spin size="large" description="正在加载教师人才画像..." /></div>;

  if (!faculty) {
    return (
      <div className="p-20 max-w-2xl mx-auto">
        <Alert
          message="数据读取错误"
          description={`无法找到编号为 ${resolvedParams?.id} 的人才实体记录。`}
          type="error"
          showIcon
        />
        <div className="mt-4 text-center">
          <a onClick={() => router.push('/panoramic')} className="text-blue-500 hover:underline">返回全景数据 Hub</a>
        </div>
      </div>
    );
  }

  const radarData = [
    { subject: '传道 (职业与产业指引)', A: faculty.t15Metrics.careerGuidanceScore, fullMark: 100 },
    { subject: '授业 (学情与教案闭环)', A: faculty.t15Metrics.learningPlanScore, fullMark: 100 },
    { subject: '解惑 (平台与线下答疑)', A: faculty.t15Metrics.qaScore, fullMark: 100 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50">
      <div className="px-8 py-6 bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm flex items-center justify-between">
        <div>
          <Breadcrumb
            items={[
              { href: '/', title: <HomeOutlined /> },
              { href: '/panoramic', title: <><DatabaseOutlined /> 全景数据 Hub</> },
              { title: <><UserOutlined /> 人才实体画像</> },
              { title: faculty.name }
            ]}
          />
          <h1 className="text-2xl font-bold text-slate-800 mt-4 mb-0 flex items-center gap-3">
            {faculty.name} 
            <Tag color="blue" className="text-sm border-blue-200 text-blue-700 bg-blue-50">{faculty.team}</Tag>
          </h1>
          <div className="text-slate-500 mt-1">{faculty.department} · {faculty.title}</div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
        <Row gutter={[24, 24]}>
          <Col span={24} md={10}>
            <Card title={<><RadarChartOutlined className="text-blue-500 mr-2" />T15 教学三维投入模型</>} className="h-full shadow-sm rounded-xl border-blue-100">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="投入得分"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.4}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-sm font-bold text-slate-700 mb-2">综合诊断 (AI 生成)</div>
                <div className="text-sm text-slate-600 leading-relaxed">{faculty.diagnosis}</div>
              </div>
            </Card>
          </Col>

          <Col span={24} md={14}>
            <Card title={<><UserOutlined className="text-purple-500 mr-2" />实体底座数据</>} className="h-full shadow-sm rounded-xl border-purple-100">
              <Descriptions column={2} bordered size="small" className="mb-6 bg-white">
                <Descriptions.Item label="实体编号" span={2}><span className="font-mono text-slate-500">{faculty.id}</span></Descriptions.Item>
                <Descriptions.Item label="主要负责课程" span={2}>
                  <div className="flex gap-2">
                    {faculty.courses.map((c: string, i: number) => (
                      <Tag color="cyan" key={i} className="border-cyan-200 text-cyan-700 bg-cyan-50 cursor-pointer hover:bg-cyan-100" onClick={() => router.push(`/panoramic/course/${encodeURIComponent(c)}`)}>{c}</Tag>
                    ))}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="传道 (指导力)">{faculty.t15Metrics.careerGuidanceScore} 分</Descriptions.Item>
                <Descriptions.Item label="授业 (教学力)">{faculty.t15Metrics.learningPlanScore} 分</Descriptions.Item>
                <Descriptions.Item label="解惑 (互动率)">{faculty.t15Metrics.qaScore} 分</Descriptions.Item>
                <Descriptions.Item label="平均答疑响应">{faculty.t15Metrics.avgResponseTime}</Descriptions.Item>
              </Descriptions>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700">
                  <InteractionOutlined className="text-orange-500" /> T15 高光投入明细
                </div>
                <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100 text-sm text-slate-700 leading-relaxed">
                  {faculty.details}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </div>
  );
}
