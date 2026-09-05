'use client';
import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Space, Breadcrumb, Typography, Checkbox, Select } from 'antd';
import { SaveOutlined, SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function T05LessonPlanForm() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<any>(null);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // API call to the unified panoramic endpoint for processing
      const response = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'T05',
          data: values,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const result = await response.json();
      message.success('教案提交成功，AI已生成分析报告！');
      
      // Setup the AI output for demonstration
      setAiOutput({
        coherenceCheck: '通过',
        suggestions: '该教案的产业案例（食品工厂包装线）与前序课程逻辑连接顺畅。建议在学生产出物环节明确要求学生提交代码逻辑框图，以便更好地追踪达成度。',
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
          { title: 'T05 教案 (典型)' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T05 教案 (典型课次设计)</Title>
          <Paragraph className="text-gray-500 mb-0">
            教案不是讲稿，需体现教师对每堂课的总体设计——讲什么、重点是什么、引入什么产业案例、与前序课程的逻辑递进、横向项目如何落地以及对学生产出物的要求。
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
            chapter: '第五章 灌装设备控制系统',
            duration: 2,
            teachingMethods: ['案例教学', '项目驱动'],
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="所属课程" name="courseName" rules={[{ required: true }]}>
              <Input placeholder="例如：包装机械设计" />
            </Form.Item>
            <Form.Item label="授课章节 / 课次" name="chapter" rules={[{ required: true }]}>
              <Input placeholder="例如：第五章 灌装设备控制系统" />
            </Form.Item>
            <Form.Item label="教学学时" name="duration" rules={[{ required: true }]}>
              <Input type="number" suffix="学时" />
            </Form.Item>
            <Form.Item label="主要教学方法" name="teachingMethods">
              <Select mode="multiple" placeholder="请选择教学方法">
                <Select.Option value="案例教学">案例教学</Select.Option>
                <Select.Option value="项目驱动">项目驱动</Select.Option>
                <Select.Option value="翻转课堂">翻转课堂</Select.Option>
                <Select.Option value="实验实训">实验实训</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label="教学目标与重点难点" name="objectives" rules={[{ required: true }]}>
            <TextArea 
              rows={4} 
              placeholder="列出本节课的核心知识、能力目标，以及教学中的重点与难点..." 
            />
          </Form.Item>

          <Form.Item label="前序课程/知识点逻辑递进" name="logicalProgression">
            <TextArea 
              rows={3} 
              placeholder="说明本节课内容如何基于前置知识展开（例如：基于前期学习的PLC原理进行系统应用）..." 
            />
          </Form.Item>

          <Form.Item label="产业案例 / 横向项目落地引入" name="industryIntegration" rules={[{ required: true }]}>
            <TextArea 
              rows={4} 
              placeholder="详述引入了哪个真实的产业案例或横向课题？（例如：大连某食品厂灌装线总线掉线排故实训）" 
            />
          </Form.Item>

          <Form.Item label="学生产出物要求 (过程性评价依据)" name="studentDeliverables" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="明确本节课要求学生提交的产出物是什么？（例如：排故流程图、控制程序代码片段等）" 
            />
          </Form.Item>

          <Form.Item label="AI工具运用与教学组织" name="aiUsage">
            <TextArea 
              rows={3} 
              placeholder="本节课是否运用了AI智能助手、知识图谱辅助教学？是如何组织的？" 
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
        <Card title="🤖 AI 教学设计一致性诊断" className="bg-blue-50 border-blue-200">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">设计连贯性判定：</span>
            <span className="text-green-600 font-medium text-lg">{aiOutput.coherenceCheck}</span>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">AI 改进建议：</span>
            <Paragraph className="text-gray-600">
              {aiOutput.suggestions}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
