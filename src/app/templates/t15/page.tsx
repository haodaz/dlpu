'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, Statistic, Row, Col, Progress } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, FireOutlined, MessageOutlined, ReadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function T15TeachingInvestmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setData({
        courseName: '包装机械设计',
        teacher: '李教授 / 张讲师',
        syncDate: new Date().toLocaleDateString(),
        metrics: {
          careerGuidanceScore: 92, // 传道：职业指引
          learningPlanScore: 88,   // 授业：学习计划
          qaResponseRate: 98,      // 解惑：平台答疑率
          avgResponseTime: '2.4小时',
        },
        qaSamples: [
          {
            id: 'QA-102',
            question: '关于灌装机凸轮机构的死点位置，视频里提到的避开方法在实际企业中常用吗？',
            student: '张* (学号: 240***12)',
            replyTime: '1.2小时',
            replyContent: '非常好的问题。企业中通常会串联一个辅助机构，或者使用飞轮来增加惯性度过死点。我把你这个问题补充到了第二章的难点库中。',
            isIncorporated: true
          },
          {
            id: 'QA-105',
            question: '老师，期末考核的项目中，企业合同验收标准我们去哪里查？',
            student: '李* (学号: 240***45)',
            replyTime: '0.8小时',
            replyContent: '已经上传到超星平台的“扩展资源”模块，文件名为《HT-24-0019 达意科技设备验收国标》。',
            isIncorporated: false
          }
        ]
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
          templateId: 'T15',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('教学投入记录已同步！');
      
      setAiOutput({
        diagnosis: '三维教学投入（传道、授业、解惑）极其饱满',
        details: '系统通过课程平台行为日志分析：本课程在职业指引和学习计划维度的内容覆盖度超过90%。更重要的是，答疑响应率高达98%，平均响应时间2.4小时，且部分高质量答疑已被AI标记为“已纳入大纲/题库滚动修订”。',
        impact: '证实了任课教师不仅是“念PPT”，而是深度介入了学生的知识重构过程。高频高质量的“解惑”互动强力支撑了 2.3.2 达成度评估的真实性。',
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
        <Spin size="large" description="正在抓取课程平台日志及答疑板块数据..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T15 教学投入记录' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T15 教学投入深度验证</Title>
          <Paragraph className="text-gray-500 mb-0">
            从“传道（职业指引）、授业（学习计划）、解惑（平台答疑）”三个维度，量化教师在课程中的真实投入心血。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><FireOutlined className="mr-2" /> 教学三维投入雷达模型</>} 
        className="shadow-sm border-t-4 border-t-orange-500 mb-6"
        extra={<Tag color="green">已同步课程平台</Tag>}
      >
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="所属课程">{data.courseName}</Descriptions.Item>
          <Descriptions.Item label="任课教师">{data.teacher}</Descriptions.Item>
        </Descriptions>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card type="inner" title={<><ReadOutlined className="text-blue-500 mr-2"/>传道 (职业指引)</>} className="bg-blue-50 border-blue-100">
              <Statistic title="白皮书岗位引导覆盖度" value={data.metrics.careerGuidanceScore} suffix="%" valueStyle={{ color: '#1677ff', fontWeight: 'bold' }} />
              <Progress percent={data.metrics.careerGuidanceScore} showInfo={false} strokeColor="#1677ff" className="mt-2" />
            </Card>
          </Col>
          <Col span={8}>
            <Card type="inner" title={<><ReadOutlined className="text-cyan-500 mr-2"/>授业 (学习计划)</>} className="bg-cyan-50 border-cyan-100">
              <Statistic title="课程依赖矩阵清晰度" value={data.metrics.learningPlanScore} suffix="%" valueStyle={{ color: '#13c2c2', fontWeight: 'bold' }} />
              <Progress percent={data.metrics.learningPlanScore} showInfo={false} strokeColor="#13c2c2" className="mt-2" />
            </Card>
          </Col>
          <Col span={8}>
            <Card type="inner" title={<><MessageOutlined className="text-orange-500 mr-2"/>解惑 (平台答疑)</>} className="bg-orange-50 border-orange-100">
              <Statistic title="学生有效提问响应率" value={data.metrics.qaResponseRate} suffix="%" valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }} />
              <div className="mt-2 text-xs text-gray-500">平均响应：{data.metrics.avgResponseTime}</div>
            </Card>
          </Col>
        </Row>

        <Title level={5} className="mb-4">解惑日志抽样 (自动判别是否纳入滚动修订)</Title>
        <div className="space-y-4 mb-6">
          {data.qaSamples.map((qa: any) => (
            <div key={qa.id} className="p-4 bg-gray-50 border border-gray-200 rounded">
              <div className="flex justify-between mb-2">
                <span className="font-bold text-gray-700">Q: {qa.question}</span>
                <span className="text-gray-400 text-sm">{qa.student}</span>
              </div>
              <div className="text-gray-600 mb-2 pl-4 border-l-2 border-orange-400">
                <span className="font-bold text-orange-600">A ({qa.replyTime}后回复): </span>
                {qa.replyContent}
              </div>
              <div className="text-right">
                {qa.isIncorporated ? (
                  <Tag color="orange">触发知识库滚动修订</Tag>
                ) : (
                  <Tag color="default">常规答疑</Tag>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-right pt-2 border-t border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认投入记录并入库验证
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 教学投入深度评价" className="bg-orange-50 border-orange-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">评价结论：</span>
            <span className="text-orange-700 font-medium text-lg flex items-center gap-2">
              <CheckCircleOutlined /> {aiOutput.diagnosis}
            </span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">行为特征：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-orange-900 font-medium bg-orange-200 p-2 rounded border border-orange-300">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
