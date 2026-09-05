'use client';
import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { DatabaseOutlined, FileTextOutlined, VerifiedOutlined } from '@ant-design/icons';

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">智能评价工作台 - 大盘总览</h1>
          <p className="text-gray-500 mt-1">监控全校专业建设数据的入库进度与 AI 诊断的总体健康度。</p>
        </div>
      </div>
      
      <Row gutter={24} className="mb-6">
        <Col span={8}>
          <Card bordered={false} className="shadow-sm border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
            <Statistic title="已入库数据总量 (项)" value={1128} prefix={<DatabaseOutlined className="text-blue-500" />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
            <Statistic title="P0 核心模板点亮进度" value={4} prefix={<FileTextOutlined className="text-green-500" />} suffix="/ 6" />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="shadow-sm border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
            <Statistic title="触发 AI 诊断次数" value={436} prefix={<VerifiedOutlined className="text-purple-500" />} />
          </Card>
        </Col>
      </Row>

      <div className="grid grid-cols-2 gap-6">
        <Card title={<span className="text-gray-700 font-bold">待办评价任务 (Evaluations)</span>} bordered={false} className="shadow-sm">
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p>目前没有需要人工干预的待办任务。</p>
            <p className="text-xs">各项数据正通过数据流平稳汇入全景 Hub...</p>
          </div>
        </Card>
        <Card title={<span className="text-gray-700 font-bold">最近诊断预警 (Alerts)</span>} bordered={false} className="shadow-sm">
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p>一切健康</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
