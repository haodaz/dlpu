'use client';
import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { RobotOutlined } from '@ant-design/icons';

export default function AgentsPage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto pt-20">
      <Result
        icon={<RobotOutlined className="text-purple-500" />}
        title="AI 智能体 (建设中)"
        subTitle="可以通过自然语言对话调用 Tool Calling 进行评价分析或指标诊断。"
        extra={[
          <Button type="primary" key="console" onClick={() => router.push('/')}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
}
