'use client';
import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Row, Col, Breadcrumb, Typography, Spin, Alert, Tabs, Table } from 'antd';
import { HomeOutlined, UserOutlined, DatabaseOutlined, RadarChartOutlined, InteractionOutlined, ProfileOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import mockFaculty from '@/lib/mockFaculty.json';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

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

  if (loading) return <div className="p-20 text-center"><Spin size="large" description="正在加载人才实体完整数据..." /></div>;

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
    { subject: '传道 (职业与产业指引)', A: faculty.t15Metrics?.careerGuidanceScore || 0, fullMark: 100 },
    { subject: '授业 (学情与教案闭环)', A: faculty.t15Metrics?.learningPlanScore || 0, fullMark: 100 },
    { subject: '解惑 (平台与线下答疑)', A: faculty.t15Metrics?.qaScore || 0, fullMark: 100 },
  ];

  const eduColumns = [
    { title: '学位', dataIndex: 'degree', key: 'degree' },
    { title: '学校名称', dataIndex: 'school', key: 'school' },
    { title: '专业', dataIndex: 'major', key: 'major' },
    { title: '开始时间', dataIndex: 'start', key: 'start' },
    { title: '结束时间', dataIndex: 'end', key: 'end' },
  ];

  const workColumns = [
    { title: '工作单位', dataIndex: 'unit', key: 'unit' },
    { title: '二级工作单位', dataIndex: 'subUnit', key: 'subUnit' },
    { title: '职务', dataIndex: 'title', key: 'title' },
    { title: '开始时间', dataIndex: 'start', key: 'start' },
    { title: '结束时间', dataIndex: 'end', key: 'end' },
    { title: '工作内容', dataIndex: 'content', key: 'content' },
  ];

  const awardsColumns = [
    { title: '获奖时间', dataIndex: 'year', key: 'year', width: 100 },
    { title: '级别', dataIndex: 'level', key: 'level', width: 100 },
    { title: '奖项名称', dataIndex: 'name', key: 'name' },
    { title: '获奖理由', dataIndex: 'reason', key: 'reason' },
  ];

  const patentsColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 120 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '专利号', dataIndex: 'no', key: 'no', width: 150 },
    { title: '专利名称', dataIndex: 'name', key: 'name' },
    { title: '所有发明人', dataIndex: 'inventors', key: 'inventors' },
    { title: '本人角色', dataIndex: 'role', key: 'role', width: 120 },
  ];

  const papersColumns = [
    { title: '发表时间', dataIndex: 'time', key: 'time', width: 100 },
    { title: '作者', dataIndex: 'authors', key: 'authors', width: 150 },
    { title: '论文标题', dataIndex: 'title', key: 'title' },
    { title: '期刊/会议', dataIndex: 'journal', key: 'journal' },
    { title: '收录情况', dataIndex: 'indexing', key: 'indexing', width: 100 },
    { title: '影响因子', dataIndex: 'impactFactor', key: 'impactFactor', width: 100 },
  ];

  const tabItems = [
    {
      key: '1',
      label: <><ProfileOutlined /> 基本信息 (Profile)</>,
      children: (
        <div className="flex flex-col gap-6 mt-4">
          <Card size="small" title="基础底座档案" variant="borderless" className="bg-gray-50 border border-gray-100 shadow-sm">
            <Descriptions column={3} bordered size="small" className="bg-white">
              <Descriptions.Item label="中文名"><span className="font-bold">{faculty.basicInfo?.chineseName || faculty.name}</span></Descriptions.Item>
              <Descriptions.Item label="英文名">{faculty.basicInfo?.englishName || '-'}</Descriptions.Item>
              <Descriptions.Item label="First Name">{faculty.basicInfo?.firstName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Last Name">{faculty.basicInfo?.lastName || '-'}</Descriptions.Item>
              <Descriptions.Item label="性别">{faculty.basicInfo?.gender || '-'}</Descriptions.Item>
              <Descriptions.Item label="国籍">{faculty.basicInfo?.nationality || '-'}</Descriptions.Item>
              <Descriptions.Item label="是否华裔">{faculty.basicInfo?.isChineseDescent || '-'}</Descriptions.Item>
              <Descriptions.Item label="籍贯">{faculty.basicInfo?.hometown || '-'}</Descriptions.Item>
              <Descriptions.Item label="出生日期">{faculty.basicInfo?.birthDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="电子邮箱" span={2}><a href={`mailto:${faculty.basicInfo?.email}`}>{faculty.basicInfo?.email || '-'}</a></Descriptions.Item>
              <Descriptions.Item label="人才主页"><a href={faculty.basicInfo?.homepage} target="_blank" rel="noreferrer" className="text-blue-500">主页链接</a></Descriptions.Item>
              <Descriptions.Item label="BRID">{faculty.basicInfo?.brid || '-'}</Descriptions.Item>
              <Descriptions.Item label="ORCID">{faculty.basicInfo?.orcid || '-'}</Descriptions.Item>
              <Descriptions.Item label="Researcher ID">{faculty.basicInfo?.researcherId || '-'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="当前工作经历" className="shadow-sm border-blue-100 border">
            <Descriptions column={2} className="mb-0">
              <Descriptions.Item label="开始时间">{faculty.currentWork?.time || '-'}</Descriptions.Item>
              <Descriptions.Item label="工作单位"><span className="font-bold">{faculty.currentWork?.unit || '-'}</span></Descriptions.Item>
              <Descriptions.Item label="职务" span={2}><Tag color="blue">{faculty.currentWork?.title || '-'}</Tag></Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="简介 (Bio)" className="shadow-sm border-gray-100">
            <Paragraph className="text-gray-700 leading-relaxed indent-8 mb-0">
              {faculty.bio || '-'}
            </Paragraph>
          </Card>

          <Card size="small" title="研究领域 / 突出贡献" className="shadow-sm border-gray-100">
            <Paragraph className="text-gray-700 leading-relaxed mb-0">
              {faculty.researchFields || '-'}
            </Paragraph>
          </Card>
        </div>
      ),
    },
    {
      key: '2',
      label: <><TrophyOutlined /> 学术与成就 (Achievements)</>,
      children: (
        <div className="flex flex-col gap-6 mt-4">
          <Card size="small" title="🎓 教育背景" className="shadow-sm border-gray-200">
            <Table dataSource={faculty.education || []} columns={eduColumns} pagination={false} rowKey={(record, index) => String(index)} size="small" />
          </Card>
          
          <Card size="small" title="💼 历史工作经历" className="shadow-sm border-gray-200">
            <Table dataSource={faculty.workExperience || []} columns={workColumns} pagination={false} rowKey={(record, index) => String(index)} size="small" />
          </Card>

          <Card size="small" title="🏆 获奖经历" className="shadow-sm border-yellow-200">
            <Table dataSource={faculty.awards || []} columns={awardsColumns} pagination={false} rowKey={(record, index) => String(index)} size="small" />
          </Card>

          <Card size="small" title="💡 专利" className="shadow-sm border-green-200">
            <Table dataSource={faculty.patents || []} columns={patentsColumns} pagination={false} rowKey={(record, index) => String(index)} size="small" />
          </Card>

          <Card size="small" title="📄 学术论文" className="shadow-sm border-indigo-200">
            <Table dataSource={faculty.papers || []} columns={papersColumns} pagination={false} rowKey={(record, index) => String(index)} size="small" />
          </Card>
        </div>
      ),
    },
    {
      key: '3',
      label: <><RadarChartOutlined /> 教学投入与 AI 诊断 (T15)</>,
      children: (
        <div className="mt-4">
          <Row gutter={[24, 24]}>
            <Col span={24} md={10}>
              <Card title={<><RadarChartOutlined className="text-blue-500 mr-2" />T15 教学三维投入模型</>} className="h-full shadow-sm rounded-xl border-blue-100">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="投入得分" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
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
              <Card title={<><BookOutlined className="text-purple-500 mr-2" />教学画像数据</>} className="h-full shadow-sm rounded-xl border-purple-100">
                <Descriptions column={2} bordered size="small" className="mb-6 bg-white">
                  <Descriptions.Item label="主要负责课程" span={2}>
                    <div className="flex gap-2">
                      {faculty.courses?.map((c: string, i: number) => (
                        <Tag color="cyan" key={i} className="border-cyan-200 text-cyan-700 bg-cyan-50 cursor-pointer hover:bg-cyan-100" onClick={() => router.push(`/panoramic/course/${encodeURIComponent(c)}`)}>{c}</Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="传道 (指导力)">{faculty.t15Metrics?.careerGuidanceScore || 0} 分</Descriptions.Item>
                  <Descriptions.Item label="授业 (教学力)">{faculty.t15Metrics?.learningPlanScore || 0} 分</Descriptions.Item>
                  <Descriptions.Item label="解惑 (互动率)">{faculty.t15Metrics?.qaScore || 0} 分</Descriptions.Item>
                  <Descriptions.Item label="平均答疑响应">{faculty.t15Metrics?.avgResponseTime || '-'}</Descriptions.Item>
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
        </div>
      ),
    }
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
            <Tag color="blue" className="text-sm border-blue-200 text-blue-700 bg-blue-50">{faculty.title}</Tag>
          </h1>
          <div className="text-slate-500 mt-1">{faculty.department} · {faculty.team}</div>
        </div>
        <div className="hidden md:flex flex-col items-end">
           <div className="text-xs text-gray-400">人才实体编号</div>
           <div className="font-mono text-gray-600">{faculty.id}</div>
        </div>
      </div>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <Tabs defaultActiveKey="1" items={tabItems} size="large" className="bg-transparent" />
      </main>
    </div>
  );
}
