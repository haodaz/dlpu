'use client';
import React, { useEffect, useState } from 'react';
import { Card, Tabs, Descriptions, Tag, Row, Col, Badge, Empty, Breadcrumb, Typography, Table, Button } from 'antd';
import { DatabaseOutlined, HomeOutlined, BuildOutlined, CheckCircleOutlined, ClusterOutlined, TrophyOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function PanoramicPage() {
  const router = useRouter();
  const [t01Data, setT01Data] = useState<any>(null);
  const [t02Data, setT02Data] = useState<any>(null);
  const [t03Data, setT03Data] = useState<any>(null);
  const [t04Data, setT04Data] = useState<any>(null);
  const [t11Data, setT11Data] = useState<any>(null);
  const [t08Data, setT08Data] = useState<any>(null);
  const [t12Data, setT12Data] = useState<any>(null);
  const [t14Data, setT14Data] = useState<any>(null);
  const [t18Data, setT18Data] = useState<any>(null);
  const [t19Data, setT19Data] = useState<any>(null);

  useEffect(() => {
    fetch('/api/panoramic')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const data = result.data;
          const t01 = data.find((item: any) => item.templateCode === 'T01');
          const t02 = data.find((item: any) => item.templateCode === 'T02');
          const t03 = data.find((item: any) => item.templateCode === 'T03');
          const t04 = data.find((item: any) => item.templateCode === 'T04');
          const t11 = data.find((item: any) => item.templateCode === 'T11');
          const t08 = data.find((item: any) => item.templateCode === 'T08');
          const t12 = data.find((item: any) => item.templateCode === 'T12');
          const t14 = data.find((item: any) => item.templateCode === 'T14');
          const t18 = data.find((item: any) => item.templateCode === 'T18');
          const t19 = data.find((item: any) => item.templateCode === 'T19');

          if (t01) setT01Data(JSON.parse(t01.rawPayload));
          if (t02) setT02Data(JSON.parse(t02.rawPayload));
          if (t03) setT03Data(JSON.parse(t03.rawPayload));
          if (t04) setT04Data(JSON.parse(t04.rawPayload));
          if (t11) setT11Data(JSON.parse(t11.rawPayload));
          if (t08) setT08Data(JSON.parse(t08.rawPayload));
          if (t12) setT12Data(JSON.parse(t12.rawPayload));
          if (t14) setT14Data(JSON.parse(t14.rawPayload));
          if (t18) setT18Data(JSON.parse(t18.rawPayload));
          if (t19) setT19Data(JSON.parse(t19.rawPayload));
        }
      });
  }, []);

  const tabItems = [
    {
      key: '1',
      label: '基本信息 (Profile)',
      children: (
        <div className="flex flex-col gap-6 mt-4">
          <Card size="small" title="实体标定" variant="borderless" className="bg-gray-50 border border-gray-100">
            <Descriptions column={2}>
              <Descriptions.Item label="院校名称">大连工业大学 (DLPU)</Descriptions.Item>
              <Descriptions.Item label="实体类型"><Tag color="blue">公办本科</Tag></Descriptions.Item>
              <Descriptions.Item label="所在地">辽宁省 大连市</Descriptions.Item>
              <Descriptions.Item label="主管部门">辽宁省教育厅</Descriptions.Item>
            </Descriptions>
          </Card>

          {t01Data && (
            <Card size="small" title={<><CheckCircleOutlined className="text-blue-500 mr-2" />培养目标 (T01 数据接入)</>} bordered={false} className="border border-blue-100">
              <Descriptions column={3} className="mb-4">
                <Descriptions.Item label="当前分析专业"><span className="font-bold">{t01Data.majorName}</span></Descriptions.Item>
                <Descriptions.Item label="学位类型">{t01Data.degreeType}</Descriptions.Item>
                <Descriptions.Item label="学制">{t01Data.duration}</Descriptions.Item>
              </Descriptions>
              <div className="bg-blue-50/50 p-4 rounded text-gray-700 leading-relaxed border border-blue-50">
                {t01Data.objectiveText.split('\n').map((para: string, idx: number) => (
                  <p key={idx} className="mb-2 last:mb-0 indent-8">{para}</p>
                ))}
              </div>
            </Card>
          )}

          {t02Data && (
            <Card size="small" title={<><CheckCircleOutlined className="text-green-500 mr-2" />毕业要求 (T02 数据接入)</>} bordered={false} className="border border-green-100">
              <div className="text-xs text-gray-400 mb-4">版本: {t02Data.version} | 支撑: {t02Data.targetT01Version}</div>
              <div className="flex flex-col gap-4">
                {t02Data.requirements.map((req: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded p-4">
                    <h3 className="font-bold text-gray-800 mb-2">{index + 1}. {req.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{req.description}</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs font-bold text-gray-500 mb-2">分解指标点：</div>
                      {req.subIndicators.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className="text-sm text-gray-700 mb-1 flex items-start">
                          <span className="text-green-600 font-medium mr-2 w-6">{sub.subIndex}</span>
                          <span>{sub.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: '课程资源 (Courses)',
      children: (
        <div className="mt-4">
          {t04Data ? (
            <Table 
              dataSource={t04Data.mappings.map((m: any, idx: number) => ({ ...m, key: idx }))}
              pagination={false}
              className="border border-gray-100 rounded-lg shadow-sm"
              columns={[
                { 
                  title: '课程名称', 
                  dataIndex: 'courseName', 
                  key: 'courseName',
                  width: '20%',
                  render: (text) => <span className="font-bold text-gray-800">{text}</span>
                },
                { 
                  title: '关联产业节点 (T04)', 
                  dataIndex: 'matchedNodes', 
                  key: 'matchedNodes',
                  width: '30%',
                  render: (nodes: string[]) => (
                    <div className="flex flex-wrap gap-1">
                      {nodes.map((n, idx) => <Tag key={idx} color="blue">{n}</Tag>)}
                    </div>
                  )
                },
                { 
                  title: '设计逻辑', 
                  dataIndex: 'logic', 
                  key: 'logic',
                  ellipsis: true
                },
                {
                  title: '操作',
                  key: 'action',
                  width: '12%',
                  render: (_, record: any) => {
                    const isTargetCourse = t11Data && record.courseName === t11Data.courseName;
                    const hasAlert = t08Data && isTargetCourse && t08Data.achievements.some((a:any) => a.value < 0.68);
                    return (
                      <div className="flex items-center gap-2">
                        <Button 
                          type="primary" 
                          size="small"
                          onClick={() => router.push(`/panoramic/course/${encodeURIComponent(record.courseName)}`)}
                        >
                          查看画像
                        </Button>
                        {hasAlert && <Badge status="error" title="存在未达标项" />}
                      </div>
                    );
                  }
                }
              ]}
            />
          ) : (
            <Empty description="暂未找到课程映射数据，请先填报 T04 模板..." />
          )}
        </div>
      ),
    },
    {
      key: '3',
      label: '产业图谱 (Industry)',
      children: (
        <div className="mt-4">
          {t03Data ? (
            <Card title={<><ClusterOutlined className="text-purple-500 mr-2" />{t03Data.industryTitle}</>} bordered={false} className="border border-purple-100 shadow-sm">
              <div className="flex flex-col gap-6">
                {t03Data.nodes.map((layer: any, index: number) => (
                  <div key={index} className="relative">
                    <div className="font-bold text-gray-700 mb-3 bg-purple-50 inline-block px-3 py-1 rounded text-sm">{layer.layer}</div>
                    <Row gutter={[16, 16]}>
                      {layer.items.map((item: any, iIdx: number) => (
                        <Col span={8} key={iIdx}>
                          <div className="border border-purple-200 p-4 rounded bg-white hover:shadow-md transition-shadow">
                            <div className="font-semibold text-gray-800 mb-1">{item.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Tag color="purple" className="m-0 border-0 bg-purple-100 text-purple-700">{item.coreRole}</Tag>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Empty description="暂未找到产业图谱数据，请先填报 T03 模板..." />
          )}
        </div>
      ),
    },
    {
      key: '4',
      label: '师资队伍 (Faculty)',
      children: (
        <div className="mt-4">
          <Empty description="暂未录入教师底层数据" />
        </div>
      ),
    },
    {
      key: '5',
      label: '实践与毕业成果 (Outcomes)',
      children: (
        <div className="mt-4">
          {t12Data ? (
            <Card title={<><CheckCircleOutlined className="text-blue-500 mr-2" />毕业设计真题真做验证 (T12 数据接入)</>} bordered={false} className="border border-blue-100 shadow-sm">
              <Descriptions column={3} className="mb-6">
                <Descriptions.Item label="当前分析届次"><span className="font-bold">{t12Data.cohort}</span></Descriptions.Item>
                <Descriptions.Item label="总课题数">{t12Data.metrics.totalProjects}</Descriptions.Item>
                <Descriptions.Item label="参与企业导师"><span className="font-bold text-blue-600">{t12Data.metrics.enterpriseMentors} 人</span></Descriptions.Item>
              </Descriptions>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-700">真题真做比例 (企业真题数 / 总课题数)</span>
                  <span className="font-bold text-blue-600">{t12Data.metrics.realProjects} / {t12Data.metrics.totalProjects} ({Math.round((t12Data.metrics.realProjects/t12Data.metrics.totalProjects)*100)}%)</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-green-500" style={{ width: `${Math.round((t12Data.metrics.realProjects/t12Data.metrics.totalProjects)*100)}%` }}></div>
                </div>
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">AI 成果验证结论：</div>
              <div className="bg-blue-50/50 p-4 rounded text-blue-800 leading-relaxed border border-blue-100 mb-6">
                {t12Data.diagnosis}: {t12Data.details}
                <br /><br />
                <strong>系统影响追踪：</strong>{t12Data.impact}
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">底层抽样数据清单：</div>
              <Table 
                dataSource={t12Data.projects} 
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  { title: '课题编号', dataIndex: 'id' },
                  { title: '课题名称', dataIndex: 'title' },
                  { title: '类型', dataIndex: 'type', render: (type) => <Tag color={type === '企业真题' ? 'green' : 'default'}>{type}</Tag> },
                  { title: '指导教师', dataIndex: 'mentor' },
                  { title: '状态', dataIndex: 'status' },
                ]}
              />
            </Card>
          ) : (
            <Empty description="暂未录入毕业设计等实践成果底层数据" className="mb-6" />
          )}

          {t14Data ? (
            <Card title={<><BuildOutlined className="text-purple-500 mr-2" />产教融合与校企合作验证 (T14 数据接入)</>} bordered={false} className="border border-purple-100 shadow-sm mt-6">
              <Descriptions column={3} className="mb-6">
                <Descriptions.Item label="活跃校企协议数"><span className="font-bold text-purple-600">{t14Data.metrics.activeAgreements} 项</span></Descriptions.Item>
                <Descriptions.Item label="部级/省级协同育人"><span className="font-bold text-blue-600">{t14Data.metrics.jointProjects} 项</span></Descriptions.Item>
                <Descriptions.Item label="合作资金盘"><span className="font-bold text-red-500">{t14Data.metrics.totalFunding}</span></Descriptions.Item>
              </Descriptions>

              <div className="text-sm font-bold text-gray-700 mb-2">AI 产教融发生态评估结论：</div>
              <div className="bg-purple-50/50 p-4 rounded text-purple-800 leading-relaxed border border-purple-100 mb-6">
                {t14Data.diagnosis}: {t14Data.details}
                <br /><br />
                <strong>系统影响追踪：</strong>{t14Data.impact}
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">核心合作协议抽样验证：</div>
              <Table 
                dataSource={t14Data.agreements} 
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  { title: '协议编号', dataIndex: 'id', width: '15%' },
                  { title: '协议名称', dataIndex: 'title', width: '35%' },
                  { title: '合作方', dataIndex: 'partner', width: '20%' },
                  { title: '类型', dataIndex: 'type', width: '15%', render: (type) => <Tag color="purple">{type}</Tag> },
                  { title: '状态', dataIndex: 'status', width: '15%' },
                ]}
              />
            </Card>
          ) : (
            <Empty description="暂未录入校企合作协议数据" className="mb-6" />
          )}

          {t18Data ? (
            <Card title={<><CheckCircleOutlined className="text-indigo-500 mr-2" />毕业生就业质量验证 (T18 数据接入)</>} bordered={false} className="border border-indigo-100 shadow-sm mt-6">
              <Descriptions column={4} className="mb-6">
                <Descriptions.Item label="分析届次"><span className="font-bold">{t18Data.cohort}</span></Descriptions.Item>
                <Descriptions.Item label="初次就业率"><span className="font-bold text-gray-700">{Math.round((t18Data.metrics.employed/t18Data.metrics.totalGraduates)*100)}%</span></Descriptions.Item>
                <Descriptions.Item label="用人单位满意度"><span className="font-bold text-green-600">{t18Data.metrics.employerSatisfaction}%</span></Descriptions.Item>
                <Descriptions.Item label="平均起薪"><span className="font-bold text-indigo-600">{t18Data.metrics.avgSalary}</span></Descriptions.Item>
              </Descriptions>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-700">AI 计算：靶点行业精准对口率 (精准匹配白皮书)</span>
                  <span className="font-bold text-indigo-600">{Math.round((t18Data.metrics.matchedIndustry/t18Data.metrics.employed)*100)}% ({t18Data.metrics.matchedIndustry}/{t18Data.metrics.employed})</span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.round((t18Data.metrics.matchedIndustry/t18Data.metrics.employed)*100)}%` }}></div>
                </div>
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">AI 终极培养验证报告：</div>
              <div className="bg-indigo-50/50 p-4 rounded text-indigo-800 leading-relaxed border border-indigo-100 mb-6">
                {t18Data.diagnosis}: {t18Data.details}
                <br /><br />
                <strong>闭环达成验证：</strong>{t18Data.impact}
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">就业去向抽样与诊断匹配：</div>
              <Table 
                dataSource={t18Data.samples} 
                pagination={false}
                rowKey="id"
                size="small"
                columns={[
                  { title: '脱敏编号', dataIndex: 'id' },
                  { title: '签约企业', dataIndex: 'company' },
                  { title: '岗位', dataIndex: 'position' },
                  { title: '起薪', dataIndex: 'salary' },
                  { title: '对口诊断', dataIndex: 'matchStatus', render: (status) => <Tag color={status === '高度对口' ? 'indigo' : 'default'}>{status}</Tag> },
                ]}
              />
            </Card>
          ) : (
            <Empty description="暂未录入毕业生就业与反馈数据" />
          )}

          {t19Data ? (
            <Card title={<><TrophyOutlined className="text-yellow-500 mr-2" />毕业生影响力追踪 (T19 长周期验证)</>} bordered={false} className="border border-yellow-200 shadow-sm mt-6">
              <div className="text-sm font-bold text-gray-700 mb-4">全网工商库爬虫匹配结果 (企业创始人/高管身份验证)：</div>
              <Table 
                dataSource={t19Data.alumniList} 
                pagination={false}
                rowKey="name"
                size="small"
                className="mb-6"
                columns={[
                  { title: '校友姓名', dataIndex: 'name', width: '15%' },
                  { title: '社会职务', dataIndex: 'title', width: '25%', render: (title) => <Tag color="gold">{title}</Tag> },
                  { title: '创立/管理企业', dataIndex: 'company', width: '30%' },
                  { title: 'AI 产业链定位', dataIndex: 'matchType', width: '30%', render: (type) => <span className="font-bold text-gray-600">{type}</span> },
                ]}
              />
              <div className="bg-yellow-50 p-4 rounded text-yellow-800 leading-relaxed border border-yellow-200">
                <strong>{t19Data.diagnosis}</strong><br/>
                {t19Data.details}
                <br /><br />
                <strong>专业终极价值闭环：</strong>{t19Data.impact}
              </div>
            </Card>
          ) : null}
        </div>
      ),
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</>, onClick: () => router.push('/') },
            { title: <><DatabaseOutlined /> 全景数据</> },
          ]}
          className="mb-4 cursor-pointer"
        />
      </div>
      {/* 极简 CRM 风格 Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
          <BuildOutlined />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 m-0 leading-tight">大连工业大学 Entity Profile</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">这里汇聚了所有通过底层模板填报、API对接沉淀而来的院校底座真实数据。</p>
        </div>
      </div>

      <Card variant="borderless" className="shadow-sm border-t-4 border-t-blue-500">
        <Tabs defaultActiveKey="1" items={tabItems} size="large" />
      </Card>
    </div>
  );
}
