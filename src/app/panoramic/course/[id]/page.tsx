'use client';
import React, { useEffect, useState, use } from 'react';
import { Card, Tag, Badge, Breadcrumb, Typography, Spin, Descriptions, Table, Alert, Tabs, Empty, Row, Col } from 'antd';
import { HomeOutlined, DatabaseOutlined, BookOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Text } = Typography;

export default function CourseProfilePage({ params }: { params: any }) {
  const router = useRouter();
  
  // Resolve params safely (works for Next.js 14 and 15)
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const courseName = resolvedParams?.id && resolvedParams.id !== 'undefined' 
    ? decodeURIComponent(resolvedParams.id) 
    : '';

  const [loading, setLoading] = useState(true);
  const [t04Data, setT04Data] = useState<any>(null);
  const [t11Data, setT11Data] = useState<any>(null);
  const [t08Data, setT08Data] = useState<any>(null);
  const [t05Data, setT05Data] = useState<any>(null);
  const [t06Data, setT06Data] = useState<any>(null);
  const [t07Data, setT07Data] = useState<any>(null);
  const [t09Data, setT09Data] = useState<any>(null);
  const [t10Data, setT10Data] = useState<any>(null);
  const [t13Data, setT13Data] = useState<any>(null);
  const [t15Data, setT15Data] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!courseName) {
      setError('无法读取课程名称，请返回全景列表重新点击进入。');
      setLoading(false);
      return;
    }
    
    fetch('/api/panoramic')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const data = result.data;
          
          const t04Item = data.find((item: any) => item.templateCode === 'T04');
          if (t04Item) {
            const parsed = JSON.parse(t04Item.rawPayload);
            const mapping = parsed.mappings.find((m: any) => m.courseName === courseName);
            if (mapping) setT04Data(mapping);
          }

          const getTemplateData = (code: string) => {
            const matches = data.filter((item: any) => item.templateCode === code);
            for (const match of matches) {
              try {
                const parsed = JSON.parse(match.rawPayload);
                if (parsed.courseName === courseName) return parsed;
              } catch(e) {}
            }
            return null;
          };

          setT11Data(getTemplateData('T11'));
          setT08Data(getTemplateData('T08'));
          setT05Data(getTemplateData('T05'));
          setT06Data(getTemplateData('T06'));
          setT07Data(getTemplateData('T07'));
          setT09Data(getTemplateData('T09'));
          setT10Data(getTemplateData('T10'));
          setT13Data(getTemplateData('T13'));
          setT15Data(getTemplateData('T15'));
        }
        setLoading(false);
      })
      .catch(() => {
        setError('数据加载失败');
        setLoading(false);
      });
  }, [courseName]);

  if (loading) return <div className="p-20 text-center"><Spin size="large" description="正在加载子实体关联数据..." /></div>;

  if (error) {
    return (
      <div className="p-20 max-w-2xl mx-auto">
        <Alert
          message="数据读取错误"
          description={error}
          type="error"
          showIcon
          action={<a onClick={() => router.push('/panoramic')}>返回列表</a>}
        />
      </div>
    );
  }

  const hasAlert = t08Data && t08Data.achievements.some((a:any) => a.value < 0.68);

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</>, onClick: () => router.push('/') },
            { title: <><DatabaseOutlined /> 全景数据</>, onClick: () => router.push('/panoramic') },
            { title: <><BookOutlined /> 课程画像</> },
            { title: courseName }
          ]}
          className="mb-4 cursor-pointer"
        />
        
        {/* 极简 CRM 风格 Header */}
        <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 text-lg">
              <BookOutlined />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800 m-0 leading-tight">{courseName}</h1>
              <div className="text-sm text-slate-500 m-0 mt-1">子实体数据透视 (Course Sub-Entity Profile)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tag color="blue" className="text-sm px-3 py-1 font-bold">必修课</Tag>
            <Tag color="green" className="text-sm px-3 py-1 font-bold border-green-200">达成度 82%</Tag>
          </div>
        </div>

        <div className="bg-white p-6 shadow-sm border border-gray-100">
            <Descriptions size="small" column={3} className="max-w-3xl">
              <Descriptions.Item label="学分">{t11Data?.credits || '--'}</Descriptions.Item>
              <Descriptions.Item label="学时">{t11Data?.hours || '--'}</Descriptions.Item>
              <Descriptions.Item label="考核期">{t08Data?.semester || '--'}</Descriptions.Item>
              <Descriptions.Item label="考核形式" span={3}>{t08Data?.assessmentType || '--'}</Descriptions.Item>
            </Descriptions>
          
          <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">关联产业靶点</div>
            <div className="flex gap-1 justify-end flex-wrap max-w-[200px]">
              {t04Data?.matchedNodes ? (
                t04Data.matchedNodes.map((n:string, idx:number) => <Tag color="blue" key={idx}>{n}</Tag>)
              ) : (
                <Text type="secondary">暂无映射</Text>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasAlert && (
        <Alert
          message="发现持续改进阻滞点"
          description="系统检测到本课程在最新一次质量评价中存在未达标项，已自动生成追踪工单。请关注下方红色预警详情。"
          type="error"
          showIcon
          className="mb-6"
        />
      )}

      <Tabs 
        defaultActiveKey="1" 
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
        items={[
          {
            key: '1',
            label: '定位与大纲 (T04/T11)',
            children: (
              <div className="pt-4">
                <Card title="教学特色与产业连接" variant="borderless" className="shadow-sm border-t-2 border-blue-400">
                  <Descriptions column={1} bordered size="middle">
                    <Descriptions.Item label="T04 设计逻辑">
                      {t04Data?.logic || '暂无数据'}
                    </Descriptions.Item>
                    <Descriptions.Item label="T11 前沿技术融入">
                      {t11Data?.features?.techTraceability || '暂无数据'}
                    </Descriptions.Item>
                    <Descriptions.Item label="T11 科研横向转化">
                      {t11Data?.features?.researchTransfer || '暂无数据'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </div>
            )
          },
          {
            key: '2',
            label: '目标考核与达成度 (T08)',
            children: (
              <div className="pt-4">
                <Card title="目标考核与达成度闭环" variant="borderless" className="shadow-sm border-t-2 border-green-500">
                  {t11Data?.objectives ? (
                    <Table 
                      dataSource={t11Data.objectives.map((obj: any, idx: number) => {
                        const ach = t08Data?.achievements?.find((a: any) => a.objectiveId === obj.id);
                        return { key: idx, ...obj, achievement: ach };
                      })}
                      pagination={false}
                      columns={[
                        { title: '课程目标 (T11)', dataIndex: 'id', width: '12%', render: (id) => <span className="font-bold">{id}</span> },
                        { title: '目标描述', dataIndex: 'desc', width: '25%' },
                        { title: '对应毕业要求', dataIndex: 'mappedRequirement', width: '25%', render: (text) => <Text type="secondary" className="text-xs">{text}</Text> },
                        { 
                          title: '达成度 (T08)', 
                          dataIndex: 'achievement', 
                          width: '38%', 
                          render: (ach) => {
                            if (!ach) return <Text type="secondary">未考核</Text>;
                            const isAlert = ach.value < 0.68;
                            return (
                              <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                  <span className="text-gray-500 text-xs">实测得分:</span>
                                  <span className={`text-lg font-bold ${isAlert ? 'text-red-500' : 'text-green-500'}`}>
                                    {ach.value.toFixed(2)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  <span className="font-semibold">诊断：</span>{ach.diagnosis}
                                </div>
                                {isAlert && (
                                  <div className="text-xs text-red-700 bg-red-50 p-2 border border-red-200 rounded mt-1">
                                    <span className="font-bold">追踪工单：</span>{ach.improvement}
                                  </div>
                                )}
                              </div>
                            );
                          } 
                        }
                      ]}
                    />
                  ) : (
                    <Empty description="暂无目标考核数据" />
                  )}
                </Card>
              </div>
            )
          },
          {
            key: '3',
            label: '教学过程执行 (T05/T06)',
            children: (
              <div className="pt-4">
                {t05Data ? (
                  <Card title="T05 教案 (典型课次设计)" variant="borderless" className="shadow-sm mb-6 border-t-2 border-indigo-500">
                    <Descriptions column={2} bordered size="middle">
                      <Descriptions.Item label="授课章节">{t05Data.chapter}</Descriptions.Item>
                      <Descriptions.Item label="主要教学方法">{t05Data.teachingMethods?.join('、')}</Descriptions.Item>
                      <Descriptions.Item label="产业案例/项目" span={2}>{t05Data.industryIntegration}</Descriptions.Item>
                      <Descriptions.Item label="学生产出物要求" span={2}>{t05Data.studentDeliverables}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                ) : (
                  <Empty description="暂无T05教案数据" className="mb-6" />
                )}

                {t06Data ? (
                  <Card title="T06 过程性评价记录" variant="borderless" className="shadow-sm border-t-2 border-orange-500">
                    <Descriptions column={2} bordered size="middle">
                      <Descriptions.Item label="评价批次">{t06Data.evaluationBatch}</Descriptions.Item>
                      <Descriptions.Item label="评价类型">{t06Data.evaluationType}</Descriptions.Item>
                      <Descriptions.Item label="平均分 / 及格率">{t06Data.averageScore}分 / {t06Data.passRate}%</Descriptions.Item>
                      <Descriptions.Item label="支撑目标">{t06Data.mappedObjectives?.join(', ')}</Descriptions.Item>
                      <Descriptions.Item label="学情预警" span={2} labelStyle={{color: '#d9363e', fontWeight: 'bold'}}>{t06Data.academicWarning}</Descriptions.Item>
                      <Descriptions.Item label="干预措施" span={2}>{t06Data.teacherIntervention}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                ) : (
                  <Empty description="暂无T06过程评价数据" />
                )}
              </div>
            )
          },
          {
            key: '4',
            label: '师生行为与投入 (T07/T09/T15)',
            children: (
              <div className="pt-4">
                {t07Data ? (
                  <Card title="T07 学情分析报告 (历届交接棒)" variant="borderless" className="shadow-sm mb-6 border-t-2 border-purple-500">
                    <Descriptions column={1} bordered size="middle">
                      <Descriptions.Item label="学期 / 届次"><Tag color="purple">{t07Data.cohort}</Tag></Descriptions.Item>
                      <Descriptions.Item label="已建立的能力基础 (优势)"><span className="text-green-700">{t07Data.strengths}</span></Descriptions.Item>
                      <Descriptions.Item label="暴露的能力短板 (劣势)"><span className="text-red-600 font-medium">{t07Data.weaknesses}</span></Descriptions.Item>
                      <Descriptions.Item label="向下游课程发出的交接棒" className="bg-purple-50"><span className="font-bold text-purple-700">{t07Data.handoverSuggestions}</span></Descriptions.Item>
                    </Descriptions>
                  </Card>
                ) : (
                  <Empty description="暂无T07学情分析数据" className="mb-6" />
                )}

                {t09Data ? (
                  <Card title="T09 学习行为数据 (平台客观抓取)" variant="borderless" className="shadow-sm border-t-2 border-red-500">
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded text-center">
                        <div className="text-gray-500 text-xs mb-1">到课率</div>
                        <div className="text-xl font-bold">{t09Data.metrics?.attendanceRate}%</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-center">
                        <div className="text-gray-500 text-xs mb-1">作业提交率</div>
                        <div className="text-xl font-bold">{t09Data.metrics?.assignmentCompletion}%</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded text-center border border-red-200">
                        <div className="text-red-500 text-xs mb-1 font-bold">资源完播率 (异常)</div>
                        <div className="text-xl font-bold text-red-600">{t09Data.metrics?.videoWatchRate}%</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-center">
                        <div className="text-gray-500 text-xs mb-1">生均讨论互动</div>
                        <div className="text-xl font-bold">{t09Data.metrics?.forumInteractions} 次</div>
                      </div>
                    </div>
                    <Alert
                      message={<span className="font-bold text-red-600">{t09Data.platformStatus}</span>}
                      description={
                        <>
                          <p className="mb-1">{t09Data.diagnosis}</p>
                          <p className="m-0 text-red-700"><strong>系统影响追踪：</strong>{t09Data.impact}</p>
                        </>
                      }
                      type="error"
                      showIcon
                    />
                  </Card>
                ) : (
                  <Empty description="暂无T09行为数据" className="mb-6" />
                )}

                {t15Data ? (
                  <Card title="T15 教学三维投入深度" variant="borderless" className="shadow-sm border-t-2 border-orange-500 mb-6">
                    <Row gutter={16} className="mb-4">
                      <Col span={8}>
                        <Card type="inner" title="传道 (职业指引覆盖)" className="bg-blue-50 border-blue-100 text-center">
                          <span className="text-2xl font-bold text-blue-600">{t15Data.metrics?.careerGuidanceScore}%</span>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card type="inner" title="授业 (学习计划清晰度)" className="bg-cyan-50 border-cyan-100 text-center">
                          <span className="text-2xl font-bold text-cyan-600">{t15Data.metrics?.learningPlanScore}%</span>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card type="inner" title="解惑 (答疑响应率)" className="bg-orange-50 border-orange-100 text-center">
                          <span className="text-2xl font-bold text-orange-600">{t15Data.metrics?.qaResponseRate}%</span>
                        </Card>
                      </Col>
                    </Row>
                    <div className="font-bold text-gray-700 mb-2">解惑日志抽样 (是否纳入题库)：</div>
                    <Table 
                      dataSource={t15Data.qaSamples} 
                      pagination={false}
                      rowKey="id"
                      size="small"
                      className="mb-4"
                      columns={[
                        { title: '学生提问', dataIndex: 'question', width: '40%' },
                        { title: '教师答疑内容', dataIndex: 'replyContent', width: '40%' },
                        { 
                          title: '知识库沉淀', 
                          dataIndex: 'isIncorporated',
                          render: (inc) => <Tag color={inc ? 'orange' : 'default'}>{inc ? '纳入修订' : '常规'}</Tag>
                        }
                      ]}
                    />
                    <Alert
                      message={<span className="font-bold text-orange-700">{t15Data.diagnosis}</span>}
                      description={
                        <>
                          <p className="mb-1">{t15Data.details}</p>
                          <p className="m-0 text-orange-800"><strong>系统影响追踪：</strong>{t15Data.impact}</p>
                        </>
                      }
                      type="warning" 
                      showIcon
                    />
                  </Card>
                ) : (
                  <Empty description="暂无T15教学投入数据" />
                )}
              </div>
            )
          },
          {
            key: '5',
            label: '教学资源支撑 (T10/T13)',
            children: (
              <div className="pt-4">
                {t10Data ? (
                  <Card title="T10 教学资源清单与使用台账 (资产与实验系统台账)" variant="borderless" className="shadow-sm border-t-2 border-teal-500">
                    <Descriptions column={2} bordered size="middle" className="mb-4">
                      <Descriptions.Item label="AI 知识图谱渗透">{t10Data.aiInfrastructure?.knowledgeGraph}</Descriptions.Item>
                      <Descriptions.Item label="AI 智能学伴渗透">
                        <span className="text-orange-500">{t10Data.aiInfrastructure?.aiTutor}</span>
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <div className="font-bold text-gray-700 mb-2">核心设备调用台账：</div>
                    <Table 
                      dataSource={t10Data.equipments} 
                      pagination={false}
                      rowKey="id"
                      size="small"
                      className="mb-4"
                      columns={[
                        { title: '资产编号', dataIndex: 'id', width: '15%' },
                        { title: '设备名称', dataIndex: 'name', width: '35%' },
                        { title: '支撑目标', dataIndex: 'supportTarget', width: '25%' },
                        { 
                          title: '调用学时', 
                          dataIndex: 'usageHours',
                          render: (hours) => (
                            <span className={`font-bold ${hours === 0 ? 'text-red-500' : 'text-green-600'}`}>
                              {hours} 学时
                            </span>
                          )
                        }
                      ]}
                    />
                    <Alert
                      message={<span className="font-bold text-red-600">{t10Data.diagnosis}</span>}
                      description={
                        <>
                          <p className="mb-1">{t10Data.details}</p>
                          <p className="m-0 text-red-700"><strong>系统影响追踪：</strong>{t10Data.impact}</p>
                        </>
                      }
                      type="error"
                      showIcon
                    />
                  </Card>
                ) : (
                  <Empty description="暂无T10资源支撑数据" className="mb-6" />
                )}

                {t13Data ? (
                  <Card title="T13 企业项目驱动清单 (合同签章验证)" variant="borderless" className="shadow-sm border-t-2 border-green-500">
                    <Descriptions column={2} bordered size="middle" className="mb-4">
                      <Descriptions.Item label="总实训项目数">{t13Data.metrics?.totalProjects}</Descriptions.Item>
                      <Descriptions.Item label="企业真题数">
                        <span className="text-green-600 font-bold">{t13Data.metrics?.realEnterpriseProjects} 个</span>
                      </Descriptions.Item>
                    </Descriptions>
                    
                    <div className="font-bold text-gray-700 mb-2">实训项目溯源台账：</div>
                    <Table 
                      dataSource={t13Data.projects} 
                      pagination={false}
                      rowKey="id"
                      size="small"
                      className="mb-4"
                      columns={[
                        { title: '项目编号', dataIndex: 'id', width: '15%' },
                        { title: '项目名称', dataIndex: 'name', width: '30%' },
                        { title: '项目来源', dataIndex: 'source', width: '20%' },
                        { 
                          title: '合同编号', 
                          dataIndex: 'contractNo', 
                          width: '20%',
                          render: (text) => text === '--' ? <span className="text-gray-400">无</span> : <span className="font-mono">{text}</span>
                        },
                        { 
                          title: '结论', 
                          dataIndex: 'status',
                          render: (text) => <Tag color={text === '真题真做' ? 'green' : 'default'}>{text}</Tag>
                        }
                      ]}
                    />
                    <Alert
                      message={<span className="font-bold text-green-700">{t13Data.diagnosis}</span>}
                      description={
                        <>
                          <p className="mb-1">{t13Data.details}</p>
                          <p className="m-0 text-green-800"><strong>系统影响追踪：</strong>{t13Data.impact}</p>
                        </>
                      }
                      type="success"
                      showIcon
                    />
                  </Card>
                ) : (
                  <Empty description="暂无T13企业项目驱动数据" />
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
