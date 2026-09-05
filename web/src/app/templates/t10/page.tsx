'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, Table } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, ApiOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function T10ResourceDataForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  // Simulate pulling data from Asset & Lab Management Systems
  useEffect(() => {
    setTimeout(() => {
      setData({
        courseName: '包装机械设计',
        syncDate: new Date().toLocaleDateString(),
        equipments: [
          { name: '多功能灌装机实训台', id: 'EQ-88102', value: '45.0万', status: '正常', usageHours: 32, supportTarget: 'Obj-2' },
          { name: '西门子S7-1200 PLC试验箱', id: 'EQ-77314', value: '12.5万', status: '正常', usageHours: 48, supportTarget: 'Obj-1, Obj-2' },
          { name: '高性能伺服系统综合测控台', id: 'EQ-99211', value: '180.0万', status: '正常', usageHours: 0, supportTarget: 'Obj-3' }, // Alert: High value, 0 usage
        ],
        aiInfrastructure: {
          knowledgeGraph: '已接入 (覆盖率85%)',
          aiTutor: '未启用',
        }
      });
      setLoading(false);
    }, 1500);
  }, []);

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/panoramic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'T10',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('教学资源台账已入库，AI已完成有效性诊断！');
      
      setAiOutput({
        diagnosis: '设备闲置预警',
        details: '系统自动比对发现，资产号 EQ-99211（高性能伺服系统综合测控台，账面价值180万）本学期在《包装机械设计》课程中的实际实验开出学时为 0。',
        impact: '“设备有不等于用得好”。昂贵资产的闲置不仅导致资源浪费，同时表明支撑课程目标 Obj-3 的硬件条件处于空转状态。已生成资产利用率优化追踪工单。',
      });
    } catch (error) {
      console.error(error);
      message.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto pb-10 pt-20 text-center">
        <Spin size="large" tip="正在从资产管理系统与实验室排课系统拉取台账 (L4 自动化对接)..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <Breadcrumb
        className="mb-6"
        items={[
          { title: <a onClick={() => router.push('/panoramic')}>全景大盘</a> },
          { title: <a onClick={() => router.push('/templates')}>模板管理中心</a> },
          { title: 'T10 教学资源清单与使用台账' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T10 教学资源清单与使用台账</Title>
          <Paragraph className="text-gray-500 mb-0">
            自动读取资产管理与实验管理系统，比对设备台账与实际使用学时，验证硬件资源和AI基础设施是否真正在支撑课程目标。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><ApiOutlined className="mr-2" /> 资产与实验系统同步结果</>} 
        className="shadow-sm border-t-4 border-t-blue-500 mb-6"
        extra={<Tag color="green">已同步</Tag>}
      >
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="所属课程">{data.courseName}</Descriptions.Item>
          <Descriptions.Item label="同步时间">{data.syncDate}</Descriptions.Item>
          <Descriptions.Item label="AI 知识图谱渗透">{data.aiInfrastructure.knowledgeGraph}</Descriptions.Item>
          <Descriptions.Item label="AI 智能学伴渗透"><Text type="warning">{data.aiInfrastructure.aiTutor}</Text></Descriptions.Item>
        </Descriptions>

        <Title level={5} className="mb-4">本课程核心设备调用台账</Title>
        <Table 
          dataSource={data.equipments} 
          pagination={false}
          rowKey="id"
          className="mb-6"
          columns={[
            { title: '资产编号', dataIndex: 'id', width: '15%' },
            { title: '设备名称', dataIndex: 'name', width: '30%' },
            { title: '账面价值', dataIndex: 'value', width: '15%' },
            { title: '支撑目标', dataIndex: 'supportTarget', width: '20%' },
            { 
              title: '本学期调用学时', 
              dataIndex: 'usageHours',
              render: (hours) => (
                <span className={`font-bold ${hours === 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {hours} 学时
                </span>
              )
            }
          ]}
        />

        <div className="text-right border-t pt-4 border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认台账无误并入库诊断
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 资源有效支撑度诊断" className="bg-red-50 border-red-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">诊断结论：</span>
            <span className="text-red-600 font-medium text-lg">{aiOutput.diagnosis}</span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">问题详情：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-red-700 font-medium bg-red-100 p-2 rounded border border-red-200">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
