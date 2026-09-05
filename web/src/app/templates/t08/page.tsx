'use client';
import React from 'react';
import { Form, Input, Button, Card, Divider, message, Breadcrumb, InputNumber, Alert } from 'antd';
import { HomeOutlined, FormOutlined, BarChartOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function T08Page() {
  const [form] = Form.useForm();
  const router = useRouter();

  // 模拟从 T11 提取出的课程目标
  const courseObjectives = [
    { id: 'Obj-1', text: '掌握工业机器人运动学建模方法。' },
    { id: 'Obj-2', text: '能够使用 ROS 框架完成机器人轨迹规划。' },
    { id: 'Obj-3', text: '具备在真实工厂环境中排查通信故障的能力。' },
  ];

  const onFinish = async (values: any) => {
    try {
      const res = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateCode: 'T08',
          sourceType: 'MANUAL',
          rawPayload: values
        })
      });
      const data = await res.json();
      if (data.success) {
        message.success('T08 考核分析报告已成功归档入全景 Hub！');
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
            { title: 'T08 考核分析 (结果层)' },
          ]}
          className="mb-4 cursor-pointer"
        />
        <h1 className="text-2xl font-bold text-gray-800">T08 课程目标达成度评价分析</h1>
        <p className="text-gray-500 mt-2">评价教学周期的实际效果。这里的“持续改进措施”将成为下一版 T11 课程大纲修改时，AI 进行穿透核对的“铁证”。</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        className="flex flex-col gap-6"
      >
        <Card className="shadow-sm border-t-4 border-t-blue-500">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="courseName" label="受评课程" rules={[{ required: true }]}>
              <Input placeholder="如：工业机器人控制技术" />
            </Form.Item>
            <Form.Item name="semester" label="授课学期" rules={[{ required: true }]}>
              <Input placeholder="如：2025-2026-1" />
            </Form.Item>
          </div>
        </Card>

        <Card title={<><BarChartOutlined className="mr-2 text-blue-500" />课程目标达成度诊断</>} className="shadow-sm border border-blue-100">
          <Alert 
            message="诊断判定规则" 
            description="当达成度计算值低于 0.68 (即 68%) 时，AI 引擎将强制介入，要求你对薄弱原因进行详细的【问题诊断】。" 
            type="info" 
            showIcon 
            className="mb-6"
          />
          
          <div className="flex flex-col gap-6">
            {courseObjectives.map((obj, index) => (
              <div key={obj.id} className="bg-gray-50 p-4 rounded border border-gray-200 relative">
                <div className="font-semibold text-gray-700 mb-3">
                  <span className="text-blue-600 mr-2">目标 {index + 1}:</span>
                  {obj.text}
                </div>
                
                {/* 强制使用 Form.Item 的数组嵌套结构存储 */}
                <Form.Item name={['achievements', index, 'objectiveId']} initialValue={obj.id} hidden>
                  <Input />
                </Form.Item>

                <div className="flex gap-4 items-start">
                  <Form.Item
                    name={['achievements', index, 'value']}
                    label="达成度评价值 (0-1)"
                    rules={[{ required: true, type: 'number', min: 0, max: 1, message: '请输入0-1之间的小数' }]}
                    style={{ width: '180px' }}
                    className="mb-0"
                  >
                    <InputNumber step={0.01} placeholder="如：0.75" className="w-full" />
                  </Form.Item>

                  {/* 为了简单起见，这里不写复杂的联动表单逻辑（低于0.68必填），而是在 placeholder 里暗示 */}
                  <Form.Item
                    name={['achievements', index, 'diagnosis']}
                    label="问题诊断分析 (低达成度必填)"
                    className="mb-0 flex-1"
                  >
                    <Input.TextArea rows={2} placeholder="若达成度低于阈值，请分析学生丢分或未能掌握能力的原因..." />
                  </Form.Item>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={<span className="text-red-500">🎯 持续改进措施 (闭环核对锚点)</span>} className="shadow-sm border-t-4 border-t-red-500 bg-red-50/20">
          <p className="text-sm text-gray-500 mb-4">
            针对上述诊断出的薄弱环节，本课程在下一学期将采取什么具体措施？（注意：这些文字将被 AI 引擎记录，并在审核下学期的新版大纲时，查验是否真正落实。）
          </p>
          <Form.Item
            name="improvementMeasures"
            rules={[{ required: true, message: '持续改进措施是工程认证的灵魂，不能为空。' }]}
            className="mb-0"
          >
            <Input.TextArea 
              rows={5} 
              placeholder="例如：针对 Obj-3 达成度过低的问题，下学期的大纲中将增加 4 个学时的‘工业总线故障排查’综合实战演练..." 
              className="border-red-200"
            />
          </Form.Item>
        </Card>

        <Form.Item className="mt-4 text-center">
          <Button type="primary" htmlType="submit" size="large" className="w-64 font-bold tracking-widest h-14 text-lg shadow-lg">
            定稿并闭环至全景 Hub
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
