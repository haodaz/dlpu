'use client';
import React from 'react';
import { Form, Input, Button, Card, Select, Divider, Space, message } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

export default function T03Page() {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const res = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'T03',
          sourceType: 'MANUAL',
          rawPayload: values
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success('T03 产业白皮书数据已成功存入全景 Hub！');
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
        <h1 className="text-2xl font-bold text-gray-800">T03 产业白皮书 (全景字段填报)</h1>
        <p className="text-gray-500 mt-2">将产业链图谱、岗位清单等核心字段抽取并结构化存入数据 Hub。</p>
      </div>

      <Card className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ lifecycle: '成长' }}
        >
          <Divider titlePlacement="left" className="!mt-0 !text-blue-600">一、产业生命周期判定</Divider>
          <Form.Item name="industryName" label="产业方向名称" rules={[{ required: true }]}>
            <Input placeholder="例如：智能制造 / 新能源汽车" />
          </Form.Item>
          <Form.Item name="lifecycle" label="生命周期阶段" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="萌芽">萌芽期</Select.Option>
              <Select.Option value="成长">成长期</Select.Option>
              <Select.Option value="成熟">成熟期</Select.Option>
              <Select.Option value="衰退">衰退/转型期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="lifecycleBasis" label="判定依据 (可简述市场规模增长率等)">
            <Input.TextArea rows={3} placeholder="AI 可根据此处文本验证生命周期阶段" />
          </Form.Item>

          <Divider titlePlacement="left" className="!mt-6 !text-blue-600">二、产业链图谱与节点企业</Divider>
          
          <Form.List name="chainNodes">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline" className="bg-gray-50 p-3 rounded border border-gray-100 relative">
                    <Form.Item
                      {...restField}
                      name={[name, 'position']}
                      rules={[{ required: true, message: '请选择位置' }]}
                      className="mb-0"
                    >
                      <Select placeholder="位置" style={{ width: 100 }}>
                        <Select.Option value="上游">上游</Select.Option>
                        <Select.Option value="中游">中游</Select.Option>
                        <Select.Option value="下游">下游</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'nodeName']}
                      rules={[{ required: true, message: '请输入节点名称' }]}
                      className="mb-0"
                    >
                      <Input placeholder="节点名称 (如: 电机电控)" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'companies']}
                      className="mb-0"
                    >
                      <Input placeholder="典型企业 (逗号分隔)" style={{ width: 300 }} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 absolute top-3 right-3" />
                  </Space>
                ))}
                <Form.Item className="mt-4">
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加产业链节点
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider titlePlacement="left" className="!mt-6 !text-blue-600">三、关键岗位与能力清单</Divider>

          <Form.List name="jobPositions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card size="small" key={key} className="mb-4 bg-blue-50 border-blue-100">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-gray-700">岗位 {name + 1}</span>
                      <MinusCircleOutlined onClick={() => remove(name)} className="text-red-500 cursor-pointer text-lg hover:text-red-700" />
                    </div>
                    <Form.Item
                      {...restField}
                      name={[name, 'jobTitle']}
                      label="岗位名称"
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="例如：自动化调试工程师" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'abilities']}
                      label="核心能力要求 (分号隔开)"
                    >
                      <Input.TextArea rows={2} placeholder="如：掌握PLC编程；熟悉机器视觉算法；具备现场抗压能力" />
                    </Form.Item>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加关键岗位
                  </Button>
                </Form.Item>
              </>
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
