'use client';
import React from 'react';
import { Card, Button, Breadcrumb, Typography, Tag, Alert } from 'antd';
import { ArrowLeftOutlined, AppstoreAddOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function T17StubForm() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T17 教学资源清单与使用台账 (存证)' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T17 教学资源清单与使用台账 (存证)</Title>
          <Paragraph className="text-gray-500 mb-0">
            原定用于对接资产管理系统与实验管理系统的核心模板（指标 3.1.1）。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><AppstoreAddOutlined className="mr-2" /> 架构优化说明：该模板已前置完成</>} 
        className="shadow-sm border-t-4 border-t-teal-500 mb-6"
        extra={<Tag color="teal">核心功能已贯通</Tag>}
      >
        <Alert
          message={<span className="font-bold text-gray-800">T17 业务逻辑已在 T10 模块中得到完美实现</span>}
          description={
            <div className="mt-2 text-gray-700 leading-relaxed">
              <p>在进行架构落地时，我们发现 T17 (指标 3.1.1 资产与系统支撑) 的功能需求极其关键。为了让单门课程画像尽快具备“资源支撑验证”的能力，我们在早前的开发批次中，<strong>已经超前利用 T10 的坑位完成了这一庞大数据的对接</strong>。</p>
              <p><strong>目前的成果：</strong></p>
              <ul className="list-disc pl-5 mb-2">
                <li>已成功模拟并对接了学校资产管理系统。</li>
                <li>完成了实验设备的调用台账追踪（追踪设备是否真的支撑了核心课程）。</li>
                <li>超额完成了 AI 知识图谱与智能学伴渗透率的监测。</li>
              </ul>
              <p>因此，为了避免代码和表单的无效冗余，我们将 T17 设置为存证页，所有数据交互请移步 T10。</p>
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-500 mb-4">您可以直接访问 T10 查看资产与实验系统的调用台账。</div>
          <Button type="primary" onClick={() => router.push('/templates/t10')} className="mr-4">
            跳转至 T10 资产台账表单
          </Button>
          <Button onClick={() => router.push('/panoramic/course/包装机械设计')}>
            查看单门课程大盘演示
          </Button>
        </div>
      </Card>
    </div>
  );
}
