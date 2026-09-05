'use client';
import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Breadcrumb } from 'antd';
import { SwapOutlined, HomeOutlined, EyeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function DataFlowPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/panoramic')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
      });
  }, []);

  const columns = [
    { title: '模板编号', dataIndex: 'templateCode', key: 'templateCode', render: (t: string) => <Tag color="blue" className="font-bold">{t}</Tag> },
    { title: '数据来源', dataIndex: 'sourceType', key: 'sourceType' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === '入库成功' ? 'success' : 'processing'}>{s}</Tag> },
    { 
      title: 'Payload 探针 (摘要)', 
      dataIndex: 'rawPayload', 
      key: 'rawPayload',
      render: (text: string) => <div className="max-w-xs truncate text-gray-500 font-mono text-xs">{text}</div>
    },
    { title: '发生时间', dataIndex: 'createdAt', key: 'createdAt', render: (d: string) => new Date(d).toLocaleString() },
    { title: '操作', key: 'action', render: () => <a className="text-blue-600"><EyeOutlined /> 查阅源码</a> },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { title: <><HomeOutlined /> 首页</>, onClick: () => router.push('/') },
            { title: <><SwapOutlined /> 数据流</> },
          ]}
          className="mb-4 cursor-pointer"
        />
        <h1 className="text-2xl font-bold text-gray-800">数据流 (Data Flow)</h1>
        <p className="text-gray-500 mt-2">这里记录了每一次通过模板填报、API对接或AI检索产生的数据抓取日志。所有数据流均汇入全景 Hub。</p>
      </div>

      <Card variant="borderless" className="shadow-sm border-t-4 border-t-blue-500">
        <Table dataSource={data} columns={columns} pagination={false} rowKey="id" />
      </Card>
    </div>
  );
}
