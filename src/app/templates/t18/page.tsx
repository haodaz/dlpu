'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, Table, Progress } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, FundProjectionScreenOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function T18EmploymentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setData({
        majorName: '机械工程 (包装工程方向)',
        cohort: '2024届',
        syncDate: new Date().toLocaleDateString(),
        metrics: {
          totalGraduates: 120,
          employed: 115,
          matchedIndustry: 104, // 行业对口数
          avgSalary: '¥7,500',
          employerSatisfaction: 94.5 // 满意度百分比
        },
        samples: [
          {
            id: 'STU-001',
            company: '大连达意科技有限公司',
            position: '机械结构工程师',
            salary: '8k-10k',
            matchStatus: '高度对口',
            satisfaction: '非常满意'
          },
          {
            id: 'STU-002',
            company: '大杨集团有限责任公司',
            position: '智能制造助理工程师',
            salary: '7k-9k',
            matchStatus: '高度对口',
            satisfaction: '满意'
          },
          {
            id: 'STU-003',
            company: '新东方教育科技集团',
            position: '高中物理教师',
            salary: '8k-12k',
            matchStatus: '跨行就业',
            satisfaction: '不适用'
          }
        ],
      });
      setLoading(false);
    }, 1500);
  }, []);

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'T18',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('就业质量数据已同步，对口率验证完成！');
      
      setAiOutput({
        diagnosis: '行业对口就业率达标 (90.4%)',
        details: '系统自动比对就业管理系统岗位信息与 T03 产业白皮书靶点词库：2024届 115 名已就业学生中，104 人去向精准匹配“智能装备”、“包装机械”等核心产业节点，整体对口率达 90.4%。用人单位问卷回溯满意度达 94.5%。',
        impact: '作为评价链“验证层”的终极输出，此数据直接证明了“定位层（目标）→结构层（指标）→解析层（大纲）→执行层（教学）”这条冗长传导链的正确性。闭环达成。',
      });
    } catch (error) {
      console.error(error);
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-10 pt-20 text-center">
        <Spin size="large" tip="正在通过 API 对接省级就业管理系统与校友追踪问卷..." />
      </div>
    );
  }

  const employmentRate = Math.round((data.metrics.employed / data.metrics.totalGraduates) * 100);
  const matchRate = Math.round((data.metrics.matchedIndustry / data.metrics.employed) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T18 行业就业率与用人单位满意度' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T18 行业就业率与满意度验证</Title>
          <Paragraph className="text-gray-500 mb-0">
            提取真实毕业去向，利用 AI 比对产业白皮书，验证专业培养与产业真实需求的最终契合度。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><FundProjectionScreenOutlined className="mr-2" /> 终端就业质量雷达</>} 
        className="shadow-sm border-t-4 border-t-indigo-500 mb-6"
        extra={<Tag color="green">数据已获取</Tag>}
      >
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="分析实体">{data.majorName}</Descriptions.Item>
          <Descriptions.Item label="届次">{data.cohort}</Descriptions.Item>
          <Descriptions.Item label="初次就业率"><span className="font-bold">{employmentRate}%</span> ({data.metrics.employed}/{data.metrics.totalGraduates})</Descriptions.Item>
          <Descriptions.Item label="平均起薪 (去极值)"><span className="text-indigo-600 font-bold">{data.metrics.avgSalary}</span></Descriptions.Item>
        </Descriptions>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <div className="text-gray-600 mb-2 font-bold">行业精准对口率 (AI比对)</div>
            <div className="flex items-center gap-4">
              <Progress type="circle" percent={matchRate} strokeColor="#4f46e5" size={60} />
              <div>
                <div className="text-2xl font-bold text-indigo-700">{matchRate}%</div>
                <div className="text-xs text-gray-500">匹配产业白皮书靶点 (104/115)</div>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-gray-600 mb-2 font-bold">用人单位综合满意度</div>
            <div className="flex items-center gap-4">
              <Progress type="circle" percent={data.metrics.employerSatisfaction} strokeColor="#10b981" size={60} />
              <div>
                <div className="text-2xl font-bold text-green-700">{data.metrics.employerSatisfaction}%</div>
                <div className="text-xs text-gray-500">基于近3个月的追溯问卷反馈</div>
              </div>
            </div>
          </div>
        </div>

        <Title level={5} className="mb-4">就业样本与白皮书靶点验证抽样</Title>
        <Table 
          dataSource={data.samples} 
          pagination={false}
          rowKey="id"
          size="small"
          className="mb-6"
          columns={[
            { title: '学生脱敏编号', dataIndex: 'id' },
            { title: '签约企业', dataIndex: 'company', width: '25%' },
            { title: '岗位名称', dataIndex: 'position', width: '25%' },
            { 
              title: '对口诊断', 
              dataIndex: 'matchStatus',
              render: (status) => <Tag color={status === '高度对口' ? 'indigo' : 'default'}>{status}</Tag>
            },
            { title: '企业满意度', dataIndex: 'satisfaction' },
          ]}
        />

        <div className="text-right border-t pt-4 border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认结果并闭环验证
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 终极培养验证报告" className="bg-indigo-50 border-indigo-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">诊断结论：</span>
            <span className="text-indigo-700 font-medium text-lg flex items-center gap-2">
              <CheckCircleOutlined /> {aiOutput.diagnosis}
            </span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">底层数据流溯源：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-white font-medium bg-indigo-600 p-3 rounded shadow-inner">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
