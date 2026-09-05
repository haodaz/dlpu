'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, Table, Progress } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function T12GraduationDesignForm() {
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
          totalStudents: 120,
          totalProjects: 120,
          realProjects: 102,
          enterpriseMentors: 68
        },
        projects: [
          { id: 'GD24-001', title: '基于PLC的高速灌装封口一体机控制系统设计', type: '企业真题', mentor: '王建国 (校内) / 李强 (企业)', status: '已验收签章' },
          { id: 'GD24-002', title: '智能包装码垛机器人末端执行器结构优化', type: '企业真题', mentor: '张丽 (校内) / 刘海波 (企业)', status: '已验收签章' },
          { id: 'GD24-003', title: '常规齿轮减速器三维建模与仿真', type: '虚拟课题', mentor: '赵铁柱 (校内)', status: '已完成' },
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
          templateId: 'T12',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('毕业设计清单已入库，AI已完成产教融合深度验证！');
      
      setAiOutput({
        diagnosis: '真题真做比例达标',
        details: '系统比对毕业设计库与企业签章库：2024届共120个课题，其中102个（占比85.0%）为带有企业导师签章的真实生产项目，超过专业认证要求的60%基线。',
        impact: '作为评价链“结果验证层”的核心依据，该数据强力证明了本专业的产教融合并未停留在纸面（大纲层），而是切实落地到了学生解决复杂工程问题的最终成果中。',
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
        <Spin size="large" tip="正在从毕设管理系统与校企电子签章库同步数据 (L4 自动化对接)..." />
      </div>
    );
  }

  const realProjectRatio = Math.round((data.metrics.realProjects / data.metrics.totalProjects) * 100);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T12 毕业设计选题与成果记录' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T12 毕业设计选题与成果记录</Title>
          <Paragraph className="text-gray-500 mb-0">
            自动对比毕设清单与企业签章，计算“真题真做”比例，从成果终端验证产教融合的深度。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><SafetyCertificateOutlined className="mr-2" /> 毕设系统同步结果</>} 
        className="shadow-sm border-t-4 border-t-blue-500 mb-6"
        extra={<Tag color="green">已同步</Tag>}
      >
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="所属专业">{data.majorName}</Descriptions.Item>
          <Descriptions.Item label="届次">{data.cohort}</Descriptions.Item>
          <Descriptions.Item label="同步时间">{data.syncDate}</Descriptions.Item>
          <Descriptions.Item label="参与企业导师数"><Text className="text-blue-600 font-bold">{data.metrics.enterpriseMentors} 人</Text></Descriptions.Item>
        </Descriptions>

        <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-gray-700">真题真做比例 (企业真题数 / 总课题数)</span>
            <span className="font-bold text-blue-600">{data.metrics.realProjects} / {data.metrics.totalProjects} ({realProjectRatio}%)</span>
          </div>
          <Progress percent={realProjectRatio} strokeColor={realProjectRatio > 60 ? "#52c41a" : "#faad14"} />
          <div className="text-xs text-gray-500 mt-2">注：真题必须同时包含【企业真实项目来源】与【企业导师验收签章】方可认定。</div>
        </div>

        <Title level={5} className="mb-4">抽样课题清单校验</Title>
        <Table 
          dataSource={data.projects} 
          pagination={false}
          rowKey="id"
          size="small"
          className="mb-6"
          columns={[
            { title: '课题编号', dataIndex: 'id', width: '15%' },
            { title: '课题名称', dataIndex: 'title', width: '35%' },
            { 
              title: '类型', 
              dataIndex: 'type', 
              width: '15%',
              render: (type) => (
                <Tag color={type === '企业真题' ? 'green' : 'default'}>{type}</Tag>
              )
            },
            { title: '指导教师 (双导师)', dataIndex: 'mentor', width: '20%' },
            { title: '验收状态', dataIndex: 'status', width: '15%' },
          ]}
        />

        <div className="text-right border-t pt-4 border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认清单无误并入库诊断
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 产教融合深度验证" className="bg-blue-50 border-blue-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">诊断结论：</span>
            <span className="text-blue-700 font-medium text-lg flex items-center gap-2">
              <CheckCircleOutlined /> {aiOutput.diagnosis}
            </span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">验证详情：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-blue-800 font-medium bg-blue-100 p-2 rounded border border-blue-200">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
