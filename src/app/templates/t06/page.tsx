'use client';
import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Space, Breadcrumb, Typography, Select, Table } from 'antd';
import { SaveOutlined, SendOutlined, ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function T06ProcessEvaluationForm() {
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
          templateId: 'T06',
          data: values,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('过程性评价记录提交成功，AI已生成诊断！');
      
      setAiOutput({
        crossValidation: '存在预警',
        analysis: '通过交叉验证发现：本次过程性评价（排故实训）成绩整体偏高（优秀率65%），但在历史的期末终结性考核中，相关知识点的得分率仅为45%。提示：当前过程性评价命题可能缺乏挑战度，或者只考核了短期记忆，未触及深层能力转化。',
        suggestedAction: '建议在下一次过程性评价中，增加“异常工况干扰”变量，提高实战诊断难度。',
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
          { title: 'T06 过程性评价记录' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T06 过程性评价记录</Title>
          <Paragraph className="text-gray-500 mb-0">
            填补“期末一张卷”与“能力达成”之间的断层。记录日常测验、实验报告或项目表现，以便系统将其与终结性考核进行交叉验证。
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
            evaluationType: '项目实训答辩',
            evaluationBatch: '第10周 - 灌装线排故项目',
            mappedObjectives: ['Obj-2: 独立排查总线掉线故障'],
            averageScore: 88,
            passRate: 95,
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="所属课程" name="courseName" rules={[{ required: true }]}>
              <Input placeholder="例如：包装机械设计" />
            </Form.Item>
            <Form.Item label="评价批次 / 周期" name="evaluationBatch" rules={[{ required: true }]}>
              <Input placeholder="例如：第10周 - 灌装线排故项目" />
            </Form.Item>
            <Form.Item label="评价类型" name="evaluationType" rules={[{ required: true }]}>
              <Select>
                <Select.Option value="随堂小测验">随堂小测验</Select.Option>
                <Select.Option value="实验报告">实验报告</Select.Option>
                <Select.Option value="项目实训答辩">项目实训答辩</Select.Option>
                <Select.Option value="大作业 / 论文">大作业 / 论文</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="支撑的课程目标" name="mappedObjectives" rules={[{ required: true }]}>
              <Select mode="tags" placeholder="输入或选择对应的课程目标 (如 Obj-2)" />
            </Form.Item>
            <Form.Item label="本次评价平均分" name="averageScore" rules={[{ required: true }]}>
              <Input type="number" suffix="分" />
            </Form.Item>
            <Form.Item label="及格率" name="passRate" rules={[{ required: true }]}>
              <Input type="number" suffix="%" />
            </Form.Item>
          </div>

          <Form.Item label="评价内容描述" name="contentDescription" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="简述本次过程性评价的具体考核内容（例如：给定电磁干扰工况，要求学生利用万用表和示波器定位总线断点并恢复通信）..." 
            />
          </Form.Item>

          <Form.Item label="学情预警与发现的问题" name="academicWarning" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="记录本次评价中暴露出的共性问题（例如：约30%的学生对屏蔽层接地的概念模糊，导致排故耗时过长）..." 
            />
          </Form.Item>

          <Form.Item label="教师干预与反馈措施" name="teacherIntervention" rules={[{ required: true }]}>
            <TextArea 
              rows={3} 
              placeholder="针对发现的问题，采取了哪些干预措施？（例如：下节课集中串讲接地规范，并补充了接地不良的对比实验）..." 
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
        <Card title="🤖 AI 终结性考核交叉验证" className="bg-yellow-50 border-yellow-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">交叉验证结论：</span>
            <span className="text-red-600 font-medium text-lg">{aiOutput.crossValidation}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">问题追溯分析：</span>
            <Paragraph className="text-gray-600">
              {aiOutput.analysis}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">改进工单建议：</span>
            <Paragraph className="text-gray-600 font-medium">
              {aiOutput.suggestedAction}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
