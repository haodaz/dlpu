'use client';
import React from 'react';
import { Form, Input, Button, Card, Divider, message, Breadcrumb, Space } from 'antd';
import { HomeOutlined, FormOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function T02Page() {
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = async (values: any) => {
    try {
      const res = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'T02',
          sourceType: 'MANUAL',
          rawPayload: values
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success('T02 毕业要求数据已成功存入全景 Hub！');
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
            { title: 'T02 毕业要求' },
          ]}
          className="mb-4 cursor-pointer"
        />
        <h1 className="text-2xl font-bold text-gray-800">T02 毕业要求 (结构层解构)</h1>
        <p className="text-gray-500 mt-2">将宏观的培养目标（T01）解构为可执行、可评价的具体指标大项与子指标点。</p>
      </div>

      <Card className="shadow-sm border-t-4 border-t-blue-500">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ version: '2026版' }}
        >
          <div className="flex gap-4">
            <Form.Item name="version" label="版本年份" rules={[{ required: true }]} style={{ width: 200 }}>
              <Input placeholder="例如：2026版" />
            </Form.Item>
            <Form.Item name="targetT01Version" label="支撑的培养目标版本" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="说明本毕业要求支撑的是哪一版的培养目标" />
            </Form.Item>
          </div>

          <Divider orientation="left" className="!mt-2 !text-blue-600">毕业要求大项与指标点</Divider>
          
          <Form.List name="requirements">
            {(fields, { add, remove }) => (
              <div className="flex flex-col gap-6">
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key} 
                    size="small" 
                    className="bg-gray-50 border-gray-200"
                    title={<span className="font-bold text-gray-700">要求大项 {name + 1}</span>}
                    extra={<MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 text-lg hover:text-red-700" />}
                  >
                    <div className="flex gap-4">
                      <Form.Item
                        {...restField}
                        name={[name, 'title']}
                        label="大项名称"
                        rules={[{ required: true, message: '请输入名称' }]}
                        style={{ width: 200 }}
                      >
                        <Input placeholder="如：工程知识" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'description']}
                        label="大项描述"
                        rules={[{ required: true, message: '请输入描述' }]}
                        style={{ flex: 1 }}
                      >
                        <Input.TextArea rows={2} placeholder="能够将数学、自然科学、工程基础和专业知识用于解决复杂工程问题。" />
                      </Form.Item>
                    </div>

                    <div className="bg-white p-4 rounded border border-dashed border-gray-300">
                      <div className="font-semibold text-gray-600 mb-4 text-sm">解构子指标点 (支撑课程大纲落地)</div>
                      <Form.List name={[name, 'subIndicators']}>
                        {(subFields, subOpt) => (
                          <div className="flex flex-col gap-3">
                            {subFields.map((subField) => (
                              <Space key={subField.key} align="start" className="w-full flex">
                                <Form.Item
                                  {...subField}
                                  name={[subField.name, 'subIndex']}
                                  rules={[{ required: true, message: '指标编号' }]}
                                  className="mb-0"
                                >
                                  <Input placeholder={`如：${name + 1}.1`} style={{ width: 100 }} />
                                </Form.Item>
                                <Form.Item
                                  {...subField}
                                  name={[subField.name, 'content']}
                                  rules={[{ required: true, message: '请输入子指标描述' }]}
                                  className="mb-0 flex-1 w-full"
                                  style={{ minWidth: '400px' }}
                                >
                                  <Input placeholder="掌握微积分、线性代数等数学基础知识..." />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => subOpt.remove(subField.name)} className="mt-2 text-gray-400 hover:text-red-500" />
                              </Space>
                            ))}
                            <Button type="dashed" onClick={() => subOpt.add()} icon={<PlusOutlined />} className="mt-2 text-blue-500 border-blue-200 bg-blue-50">
                              添加子指标点
                            </Button>
                          </div>
                        )}
                      </Form.List>
                    </div>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="large" className="font-bold text-gray-600">
                  添加毕业要求大项
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
