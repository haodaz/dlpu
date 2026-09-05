'use client';
import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Space, Breadcrumb, Typography, Select } from 'antd';
import { SaveOutlined, SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function T07AcademicAnalysisForm() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<any>(null);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'T07',
          data: values,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('学情分析报告提交成功，已生成下游交接棒！');
      
      setAiOutput({
        trend: '能力短板存在跨届延续特征',
        analysis: '经过与过去两届（2022级、2023级）历史数据纵向对比，发现该专业学生在“系统级排故”与“电磁干扰分析”能力上均存在普遍短板。',
        handover: '已自动向后续课程《机电系统综合设计》的主讲教师发送“交接棒”预警，建议在该课程初期的工程实训中，针对性增设抗干扰设计专题。',
      });
    } catch (error) {
      console.error(error);
      message.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T07 学情分析报告' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T07 学情分析报告</Title>
          <Paragraph className="text-gray-500 mb-0">
            纵向对比历届数据，梳理本届学生在各项课程目标上的基础优势与能力短板，并为后续课程提供精准的“交接棒”建议。
          </Paragraph>
        </div>
      </div>

      <Card className="shadow-sm border-t-4 border-t-blue-500 mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            courseName: '包装机械设计',
            cohort: '2024级 秋季学期',
            overallEvaluation: '整体学习态度端正，但对复杂工程问题的系统级分析能力略显欠缺。',
            strengths: '对机械结构与传动原理（Obj-1）掌握较好，能熟练完成三维建模。',
            weaknesses: '在涉及电气控制与总线通信（Obj-2）的跨学科排故实训中，排查逻辑不够严密，尤其是对弱电干扰和接地规范缺乏工程概念。',
            handoverSuggestions: '建议后续课程《机电系统综合设计》在开课前两周，增加强弱电隔离及抗干扰布线的专项先导实训，以弥补本届学生在该项能力上的结构性短板。',
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="所属课程" name="courseName" rules={[{ required: true }]}>
              <Input placeholder="例如：包装机械设计" />
            </Form.Item>
            <Form.Item label="学期 / 届次" name="cohort" rules={[{ required: true }]}>
              <Input placeholder="例如：2024级 秋季学期" />
            </Form.Item>
          </div>

          <Form.Item label="总体学情评价" name="overallEvaluation" rules={[{ required: true }]}>
            <TextArea 
              rows={2} 
              placeholder="概括本届学生在该课程中的整体表现..." 
            />
          </Form.Item>

          <Form.Item label="已建立的能力基础 (优势)" name="strengths" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="学生在哪些知识点或能力指标上表现突出？（例如：机械建模能力扎实）..." 
            />
          </Form.Item>

          <Form.Item label="暴露的能力短板 (劣势)" name="weaknesses" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="学生在哪些方面存在普遍短板或理解偏差？（例如：排故逻辑混乱、缺乏规范）..." 
            />
          </Form.Item>

          <Form.Item label="向下游课程的交接棒 / 建议" name="handoverSuggestions" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="针对短板，向后续课程提出哪些具体的承接建议？（例如：建议在《综合设计》中增设抗干扰专题）..." 
            />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button icon={<SaveOutlined />}>保存草稿</Button>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={loading}>
                提交并由 AI 分析
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 历届学情纵向追踪分析" className="bg-purple-50 border-purple-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">历史数据纵向对比：</span>
            <span className="text-orange-600 font-medium text-lg">{aiOutput.trend}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">AI 归因分析：</span>
            <Paragraph className="text-gray-600">
              {aiOutput.analysis}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">交接棒传递状态：</span>
            <Paragraph className="text-green-700 font-medium bg-green-50 p-2 rounded border border-green-200">
              {aiOutput.handover}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
