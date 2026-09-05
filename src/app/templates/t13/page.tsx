'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, Table } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function T13EnterpriseProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setData({
        courseName: '包装机械设计',
        syncDate: new Date().toLocaleDateString(),
        metrics: {
          totalProjects: 3,
          realEnterpriseProjects: 2,
        },
        projects: [
          { 
            id: 'PROJ-2024-001', 
            name: '高速灌装线故障排查实训', 
            source: '大连达意科技', 
            contractNo: 'HT-24-0019',
            signOff: '已签章',
            status: '真题真做' 
          },
          { 
            id: 'PROJ-2024-002', 
            name: '贴标机传动模块优化设计', 
            source: '哈工大机器人集团', 
            contractNo: 'HT-24-0102',
            signOff: '已签章',
            status: '真题真做' 
          },
          { 
            id: 'PROJ-2024-003', 
            name: '基础凸轮机构运动学分析', 
            source: '校内自建', 
            contractNo: '--',
            signOff: '--',
            status: '虚拟课题' 
          },
        ],
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
          templateId: 'T13',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('企业项目驱动清单已入库，AI已完成有效性诊断！');
      
      setAiOutput({
        diagnosis: '核心课程真题驱动验证通过',
        details: '系统比对教务系统与企业合同库：本学期《包装机械设计》的3个核心实训项目中，有2个具备真实的企业合同编号与企业验收签章。',
        impact: '拒绝“请企业来做个讲座”的形式主义。合同+签章的双重验证确保了课程实训环节真正深入产业一线，强力支撑了Obj-1/Obj-2的工程实践要求。',
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
        <Spin size="large" description="正在从教务系统及企业合同管理库提取项目信息 (L4 自动化对接)..." />
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
          { title: 'T13 企业项目驱动清单' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T13 企业项目驱动清单</Title>
          <Paragraph className="text-gray-500 mb-0">
            通过合同编号与签章双重验证，识别核心课程中“真题真做”的生产性项目比例。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><ApartmentOutlined className="mr-2" /> 课程项目与合同库交叉比对</>} 
        className="shadow-sm border-t-4 border-t-blue-500 mb-6"
        extra={<Tag color="green">已同步</Tag>}
      >
        <Descriptions bordered column={2} className="mb-6">
          <Descriptions.Item label="所属课程">{data.courseName}</Descriptions.Item>
          <Descriptions.Item label="同步时间">{data.syncDate}</Descriptions.Item>
          <Descriptions.Item label="总实训项目数">{data.metrics.totalProjects}</Descriptions.Item>
          <Descriptions.Item label="企业真题数"><span className="text-green-600 font-bold">{data.metrics.realEnterpriseProjects} 个</span></Descriptions.Item>
        </Descriptions>

        <Title level={5} className="mb-4">实训项目清单溯源验证</Title>
        <Table 
          dataSource={data.projects} 
          pagination={false}
          rowKey="id"
          size="small"
          className="mb-6"
          columns={[
            { title: '项目编号', dataIndex: 'id', width: '15%' },
            { title: '项目名称', dataIndex: 'name', width: '30%' },
            { title: '项目来源', dataIndex: 'source', width: '20%' },
            { 
              title: '合同编号', 
              dataIndex: 'contractNo', 
              width: '15%',
              render: (text) => text === '--' ? <span className="text-gray-400">无</span> : <span className="font-mono">{text}</span>
            },
            { 
              title: '结论', 
              dataIndex: 'status',
              render: (text) => (
                <Tag color={text === '真题真做' ? 'green' : 'default'}>{text}</Tag>
              )
            }
          ]}
        />

        <div className="text-right border-t pt-4 border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认清单无误并入库诊断
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 真题真做有效性诊断" className="bg-green-50 border-green-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">诊断结论：</span>
            <span className="text-green-700 font-medium text-lg flex items-center gap-2">
              <CheckCircleOutlined /> {aiOutput.diagnosis}
            </span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">问题详情：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-green-800 font-medium bg-green-100 p-2 rounded border border-green-200">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
