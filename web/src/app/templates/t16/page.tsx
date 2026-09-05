'use client';
import React from 'react';
import { Card, Button, Breadcrumb, Typography, Tag, Alert } from 'antd';
import { ArrowLeftOutlined, MergeCellsOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function T16StubForm() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T16 持续改进与大纲演进 (存证)' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T16 持续改进与大纲演进 (存证)</Title>
          <Paragraph className="text-gray-500 mb-0">
            原定用于监控“质量保障体系与制度”执行情况的模板。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><MergeCellsOutlined className="mr-2" /> 架构优化说明：该模板已被合并废除</>} 
        className="shadow-sm border-t-4 border-t-gray-500 mb-6"
        extra={<Tag color="gray">无需填报</Tag>}
      >
        <Alert
          message={<span className="font-bold text-gray-800">T16 已与 T11 (课程大纲) 合并运作</span>}
          description={
            <div className="mt-2 text-gray-700 leading-relaxed">
              <p>在早期的系统设计中，T16 被设想为一个独立的填报表单，用于收集教师的持续改进记录和质量保证报告。</p>
              <p><strong>新的架构决策：</strong>为了给教师减负并实现“无感评估”，我们移除了 T16 的独立填报环节。取而代之的是，AI 诊断引擎现在会直接读取 <strong>T11 课程大纲</strong> 的历史版本（Version Diff）以及 <strong>T15 答疑记录的纳入情况</strong>。</p>
              <p>如果 AI 发现大纲的考核方式、教学内容或难点库随着学期发生了迭代，就会自动判定“持续改进机制已生效”。这种自动化（L4）机制比人为填写长篇报告更具真实性和说服力。</p>
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />

        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <div className="text-gray-500 mb-2">请直接访问 T11 查看大纲版本演进记录。</div>
          <Button type="primary" onClick={() => router.push('/templates/t11')}>
            跳转至 T11 课程大纲
          </Button>
        </div>
      </Card>
    </div>
  );
}
