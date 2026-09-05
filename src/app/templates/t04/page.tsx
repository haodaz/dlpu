'use client';
import React from 'react';
import { Form, Input, Button, Card, Divider, message, Breadcrumb, Select } from 'antd';
import { HomeOutlined, FormOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function T04Page() {
  const [form] = Form.useForm();
  const router = useRouter();

  // 模拟从全景 Hub 中拉取到的 T03 产业链节点数据，供下拉多选用
  const industryNodesOptions = [
    { label: '上游 - 减速器', value: '上游-减速器' },
    { label: '上游 - 伺服电机', value: '上游-伺服电机' },
    { label: '中游 - 机器视觉系统', value: '中游-机器视觉系统' },
    { label: '中游 - 系统集成控制', value: '中游-系统集成控制' },
    { label: '下游 - 智能产线部署', value: '下游-智能产线部署' },
    { label: '下游 - 售后与维护', value: '下游-售后与维护' },
  ];

  const onFinish = async (values: any) => {
    try {
      const res = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'T04',
          sourceType: 'MANUAL',
          rawPayload: values
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success('T04 映射矩阵数据已成功存入全景 Hub！');
        form.resetFields();
      } else {
        message.error('保存失败：' + data.error);
      }
    } catch (err) {
      message.error('网络请求失败');
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</>, onClick: () => router.push('/') },
            { title: <><FormOutlined /> 模板管理</>, onClick: () => router.push('/templates') },
            { title: 'T04 课程-产业链映射' },
          ]}
          className="mb-4 cursor-pointer"
        />
        <h1 className="text-2xl font-bold text-gray-800">T04 课程-产业链映射矩阵 (解析层)</h1>
        <p className="text-gray-500 mt-2">连接“教育侧课程”与“产业侧需求”。验证所有开设的课程是否都落在了产业链的真实节点上，避免开设“空挡课程”。</p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-blue-500">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ t03Version: '2026-T03-V1' }}
        >
          <Form.Item 
            name="t03Version" 
            label={<span className="font-semibold text-gray-700">所依赖的 T03 产业白皮书版本号</span>} 
            rules={[{ required: true }]} 
            style={{ width: 300 }}
            extra="映射矩阵必须基于确定版本的产业图谱构建。"
          >
            <Input placeholder="例如：2026-T03-V1" />
          </Form.Item>

          <Divider orientation="left" className="!mt-6 !text-blue-600">映射关系配置</Divider>
          <p className="text-sm text-gray-400 mb-4">请逐一添加核心课程，并在下拉列表中勾选它们所支撑的产业链节点。</p>
          
          <Form.List name="mappings">
            {(fields, { add, remove }) => (
              <div className="flex flex-col gap-4">
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex gap-4 items-start bg-gray-50 p-4 rounded border border-gray-200 relative group hover:border-blue-300 transition-colors">
                    
                    <Form.Item
                      {...restField}
                      name={[name, 'courseName']}
                      label="课程名称"
                      rules={[{ required: true, message: '请输入课程名称' }]}
                      className="mb-0"
                      style={{ width: '25%' }}
                    >
                      <Input placeholder="如：工业机器人控制" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'supportedIndustryNodes']}
                      label="支撑的产业链节点 (多选)"
                      rules={[{ required: true, message: '请至少选择一个节点' }]}
                      className="mb-0"
                      style={{ width: '40%' }}
                    >
                      <Select 
                        mode="multiple" 
                        placeholder="请选择 (数据来自 T03)" 
                        options={industryNodesOptions}
                        allowClear
                      />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'supportLogic']}
                      label="映射逻辑简述 (可选)"
                      className="mb-0"
                      style={{ flex: 1 }}
                    >
                      <Input.TextArea rows={1} placeholder="说明是如何支撑该节点的..." />
                    </Form.Item>

                    <MinusCircleOutlined 
                      onClick={() => remove(name)} 
                      className="absolute top-4 right-4 text-gray-300 hover:text-red-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" 
                    />
                  </div>
                ))}
                
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large" className="font-bold text-gray-600 mt-2 bg-gray-50">
                  添加映射课程
                </Button>
              </div>
            )}
          </Form.List>

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
