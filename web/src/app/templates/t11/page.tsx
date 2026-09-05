'use client';
import React from 'react';
import { Form, Input, Button, Card, Divider, message, Breadcrumb, Space, Checkbox, Select, Collapse } from 'antd';
import { HomeOutlined, FormOutlined, PlusOutlined, MinusCircleOutlined, ThunderboltOutlined, BookOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Panel } = Collapse;

export default function T11Page() {
  const [form] = Form.useForm();
  const router = useRouter();

  // 模拟从 T03 读取的岗位能力编号供下拉选择
  const competencyOptions = [
    { label: 'C-01: 掌握PLC编程与底层通信协议', value: 'C-01' },
    { label: 'C-02: 具备机器视觉算法二次开发能力', value: 'C-02' },
    { label: 'C-03: 熟悉工业机器人本体运动学原理', value: 'C-03' },
    { label: 'C-04: 具备现场抗压与复杂故障排查能力', value: 'C-04' },
  ];

  const onFinish = async (values: any) => {
    try {
      const res = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'T11',
          sourceType: 'MANUAL',
          rawPayload: values
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success('T11 课程大纲数据已成功存入全景 Hub！');
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
            { title: 'T11 课程大纲' },
          ]}
          className="mb-4 cursor-pointer"
        />
        <h1 className="text-2xl font-bold text-gray-800">T11 课程大纲 (典型)</h1>
        <p className="text-gray-500 mt-2">不仅是文字大纲，更是课程对“产业前沿、岗位要求、AI能力”支撑度的硬核取证库。</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="flex flex-col gap-6"
      >
        {/* 区块 A: 基础信息 */}
        <Card className="shadow-sm border-t-4 border-t-blue-500" title={<><BookOutlined className="mr-2" />基础信息</>}>
          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="courseName" label="课程名称" rules={[{ required: true }]}>
              <Input placeholder="如：工业机器人控制技术" />
            </Form.Item>
            <Form.Item name="courseCode" label="课程代码" rules={[{ required: true }]}>
              <Input placeholder="如：ROB302" />
            </Form.Item>
            <Form.Item name="credits" label="学分 / 学时" rules={[{ required: true }]}>
              <Input placeholder="如：3 / 48" />
            </Form.Item>
          </div>
        </Card>

        <Collapse defaultActiveKey={['1', '2', '3', '4']} className="bg-white shadow-sm" expandIconPosition="end">
          
          {/* 区块 B: 课程目标与岗位能力映射 */}
          <Panel header={<span className="font-bold text-gray-700">1. 课程目标映射 (对应指标 1.1.3)</span>} key="1">
            <p className="text-sm text-gray-400 mb-4">每个课程目标必须显式挂钩 T03 中的“岗位能力编号”，不能凭空捏造。</p>
            <Form.List name="objectives">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-4 items-start bg-blue-50 p-3 rounded border border-blue-100">
                      <Form.Item
                        {...restField}
                        name={[name, 'text']}
                        label={`目标 ${name + 1}`}
                        rules={[{ required: true, message: '输入目标' }]}
                        className="mb-0 flex-1"
                      >
                        <Input.TextArea rows={2} placeholder="阐述该课程目标的内容..." />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'competencyId']}
                        label="支撑的岗位能力 (源自 T03)"
                        rules={[{ required: true, message: '必须选择支撑能力' }]}
                        className="mb-0"
                        style={{ width: '280px' }}
                      >
                        <Select options={competencyOptions} placeholder="选择岗位能力编号" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} className="mt-8 text-red-400 hover:text-red-600 cursor-pointer" />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="text-blue-500 border-blue-200">
                    添加课程目标
                  </Button>
                </div>
              )}
            </Form.List>
          </Panel>

          {/* 区块 C: 行业前沿技术融入 */}
          <Panel header={<span className="font-bold text-gray-700">2. 行业前沿技术溯源 (对应指标 1.2.1)</span>} key="2">
            <p className="text-sm text-gray-400 mb-4">必须提供明确的 DOI/专利号/行业标准号，AI 将进行防伪去重验真。</p>
            <Form.List name="frontierTech">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} align="start" className="w-full flex">
                      <Form.Item
                        {...restField}
                        name={[name, 'techName']}
                        rules={[{ required: true, message: '技术点' }]}
                        className="mb-0 flex-1"
                      >
                        <Input placeholder="引入的前沿技术点 (如: ROS2 DDS通信)" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'sourceType']}
                        rules={[{ required: true, message: '来源类型' }]}
                        className="mb-0"
                      >
                        <Select style={{ width: 120 }} placeholder="来源类型">
                          <Select.Option value="DOI">论文 DOI</Select.Option>
                          <Select.Option value="PATENT">专利号</Select.Option>
                          <Select.Option value="STD">行业标准编号</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'sourceId']}
                        rules={[{ required: true, message: '请输入对应的编号' }]}
                        className="mb-0"
                      >
                        <Input placeholder="如: 10.1109/TRO.2023..." style={{ width: 250 }} />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} className="mt-2 text-gray-400 hover:text-red-500 cursor-pointer" />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="text-purple-500 border-purple-200 bg-purple-50">
                    添加前沿技术佐证
                  </Button>
                </div>
              )}
            </Form.List>
          </Panel>

          {/* 区块 D: AI 时代新三维能力 */}
          <Panel header={<span className="font-bold text-gray-700">3. AI 时代新三维能力 (对应指标 1.3.1)</span>} key="3">
            <p className="text-sm text-gray-400 mb-4">本课程的教学设计中，是否实质性融入了以下 AI 时代的必备能力素养？</p>
            <Form.Item name="aiCapabilities" className="mb-0">
              <Checkbox.Group className="flex flex-col gap-3">
                <Checkbox value="asking">
                  <span className="font-semibold text-gray-700">提出问题 (Asking Questions)</span> — 培养学生利用 AI 辅助提问和提示工程 (Prompt Engineering) 的能力
                </Checkbox>
                <Checkbox value="judging">
                  <span className="font-semibold text-gray-700">信息判断 (Information Judgment)</span> — 培养学生对 AI 生成内容进行交叉验证、甄别真伪的批判性思维
                </Checkbox>
                <Checkbox value="creation">
                  <span className="font-semibold text-gray-700">创造意义 (Meaning Creation)</span> — 结合 AI 产出跨学科、带有独特人文或商业价值的创新方案
                </Checkbox>
              </Checkbox.Group>
            </Form.Item>
          </Panel>

          {/* 区块 E: 横向课题与教学案例 */}
          <Panel header={<span className="font-bold text-gray-700">4. 横向课题科研转化 (对应指标 2.1.1)</span>} key="4">
            <p className="text-sm text-gray-400 mb-4">企业愿意出钱请你解决的问题，转化为教学案例，学生学到的就是活的知识。</p>
            <Form.List name="researchCases">
              {(fields, { add, remove }) => (
                <div className="flex flex-col gap-3">
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-4 items-start bg-green-50 p-3 rounded border border-green-100">
                      <Form.Item
                        {...restField}
                        name={[name, 'projectId']}
                        label="横向课题编号 (验真用)"
                        rules={[{ required: true }]}
                        className="mb-0"
                        style={{ width: '30%' }}
                      >
                        <Input placeholder="横向合同编号" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'caseName']}
                        label="转化为了什么教学案例？"
                        rules={[{ required: true }]}
                        className="mb-0 flex-1"
                      >
                        <Input placeholder="如：基于XX工厂的自动化分拣线缺陷检测案例" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} className="mt-8 text-red-400 hover:text-red-600 cursor-pointer" />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="text-green-600 border-green-200 bg-green-50/50">
                    添加横向转化记录
                  </Button>
                </div>
              )}
            </Form.List>
          </Panel>
        </Collapse>

        <Form.Item className="mt-6 text-center">
          <Button type="primary" htmlType="submit" size="large" icon={<ThunderboltOutlined />} className="w-80 font-bold tracking-widest h-14 text-lg shadow-lg">
            全量提交至全景 Hub
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
