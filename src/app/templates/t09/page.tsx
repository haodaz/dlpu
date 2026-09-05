'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, Progress } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function T09BehaviorDataForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  // Simulate pulling data from external LMS
  useEffect(() => {
    setTimeout(() => {
      setData({
        courseName: '包装机械设计',
        platform: '雨课堂 / 超星泛雅',
        syncDate: new Date().toLocaleDateString(),
        metrics: {
          attendanceRate: 96,
          assignmentCompletion: 82,
          videoWatchRate: 45, // Alert!
          forumInteractions: 12,
        },
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
          templateId: 'T09',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('行为数据已入库，AI已完成诊断！');
      
      setAiOutput({
        platformStatus: '平台空转预警',
        diagnosis: '检测到《包装机械设计》在课程平台上的建设完整，但学生的“视频完播率”仅为45%，“论坛生均互动”仅为12次。这表明平台可能存在“建而不用”的空转现象。',
        impact: '学习行为是教学效果的前置指标。平台空转会导致教学投入失真，同时预示着期末深层次能力考核可能面临大面积不达标。',
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
        <Spin size="large" tip="正在从教务系统/课程平台同步学习行为数据 (L4 自动化对接)..." />
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
          { title: 'T09 学习行为数据' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T09 学习行为数据</Title>
          <Paragraph className="text-gray-500 mb-0">
            纯客观行为数据（L4级自动获取），无需教师额外填写。系统自动轻量对接课程平台，识别“建而不用”的空转现象。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><CloudDownloadOutlined className="mr-2" /> 平台数据同步结果</>} 
        className="shadow-sm border-t-4 border-t-blue-500 mb-6"
        extra={<Tag color="green">已同步</Tag>}
      >
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="所属课程">{data.courseName}</Descriptions.Item>
          <Descriptions.Item label="数据源">{data.platform}</Descriptions.Item>
          <Descriptions.Item label="同步时间">{data.syncDate}</Descriptions.Item>
          <Descriptions.Item label="数据完整度">100%</Descriptions.Item>
        </Descriptions>

        <Title level={5} className="mb-4">客观行为指标提取</Title>
        <div className="grid grid-cols-2 gap-8 mb-6 px-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">到课率 (线下+线上)</span>
              <span className="font-bold">{data.metrics.attendanceRate}%</span>
            </div>
            <Progress percent={data.metrics.attendanceRate} strokeColor="#52c41a" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">作业准时提交率</span>
              <span className="font-bold">{data.metrics.assignmentCompletion}%</span>
            </div>
            <Progress percent={data.metrics.assignmentCompletion} strokeColor="#1890ff" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600 font-bold text-red-500">线上资源完播率</span>
              <span className="font-bold text-red-500">{data.metrics.videoWatchRate}%</span>
            </div>
            <Progress percent={data.metrics.videoWatchRate} status="exception" />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">生均讨论互动次数</span>
              <span className="font-bold">{data.metrics.forumInteractions} 次</span>
            </div>
            <Progress percent={Math.min((data.metrics.forumInteractions / 30) * 100, 100)} showInfo={false} strokeColor="#faad14" />
          </div>
        </div>

        <div className="text-right border-t pt-4 border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认数据无误并入库诊断
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 行为前置预警诊断" className="bg-red-50 border-red-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">异常发现：</span>
            <span className="text-red-600 font-medium text-lg">{aiOutput.platformStatus}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">诊断详情：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.diagnosis}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-red-700 font-medium bg-red-100 p-2 rounded border border-red-200">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
