'use client';
import React from 'react';
import { Form, Input, Button, Card, Divider, message, Breadcrumb } from 'antd';
import { HomeOutlined, FormOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function T01Page() {
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      const res = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'T01',
          sourceType: 'MANUAL',
          rawPayload: values
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success('T01 培养目标数据已成功存入全景 Hub！');
        form.resetFields();
      } else {
        message.error('保存失败：' + data.error);
      }
    } catch (err) {
      message.error('网络请求失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</>, onClick: () => router.push('/') },
            { title: <><FormOutlined /> 模板管理</>, onClick: () => router.push('/templates') },
            { title: 'T01 培养目标文本' },
          ]}
          className="mb-4 cursor-pointer"
        />
        <h1 className="text-2xl font-bold text-gray-800">T01 培养目标文本 (定位层起点)</h1>
        <p className="text-gray-500 mt-2">这是专业评价链条的最源头。提交的文本将经过 AI 解析，校验是否与后续课程体系具有一致性。</p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-blue-500">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Divider orientation="left" className="!mt-0 !text-blue-600">一、基本信息</Divider>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="majorName" label="专业名称" rules={[{ required: true }]}>
              <Input placeholder="例如：机械设计制造及其自动化" />
            </Form.Item>
            <Form.Item name="degree" label="授予学位" rules={[{ required: true }]}>
              <Input placeholder="例如：工学学士" />
            </Form.Item>
          </div>
          <Form.Item name="schoolingLength" label="标准学制 (年)" rules={[{ required: true }]}>
            <Input type="number" placeholder="例如：4" style={{ width: '200px' }} />
          </Form.Item>

          <Divider orientation="left" className="!mt-6 !text-blue-600">二、培养目标长文本</Divider>
          
          <Form.Item 
            name="objectiveText" 
            label={<span className="font-semibold text-gray-700">原始培养目标（请完整粘贴专业培养方案中的文本）</span>}
            rules={[{ required: true, message: '请输入培养目标文本' }]}
            extra="AI 将从这段文本中自动提取出：专业定位、服务面向群体、毕业生5年内的核心职业能力等。"
          >
            <Input.TextArea 
              rows={8} 
              placeholder="本专业培养德智体美劳全面发展，适应地方经济建设需要，具备扎实的专业理论知识..." 
              className="font-serif leading-relaxed"
            />
          </Form.Item>

          <Form.Item className="mt-10 text-center">
            <Button type="primary" htmlType="submit" size="large" className="w-64 font-bold tracking-widest h-12 text-lg">
              提交至全景数据 Hub
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
