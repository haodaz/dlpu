'use client';
import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { CheckCircleOutlined } from '@ant-design/icons';

export default function EvaluationsPage() {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto pt-20">
      <Result
        icon={<CheckCircleOutlined className="text-blue-500" />}
        title="评价管理模块 (建设中)"
        subTitle="这里将用于下发评价任务、查看 AI 诊断进度，以及输出终版的《专业建设质量诊断报告》。"
        extra={[
          <Button type="primary" key="console" onClick={() => router.push('/')}>
            返回首页
          </Button>,
        ]}
      />
    </div>
  );
}
