'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Descriptions, Spin, Tag, List, Badge } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, BuildOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function T14IntegrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setData({
        entityLevel: '专业/学院级',
        majorName: '机械工程 / 包装工程方向',
        syncDate: new Date().toLocaleDateString(),
        metrics: {
          activeAgreements: 12,
          jointProjects: 5,
          totalFunding: '320万元',
        },
        agreements: [
          {
            id: 'AGR-2026-001',
            title: '大连工业大学-辽宁黄海实验室 研究生联合培养框架协议',
            partner: '辽宁黄海实验室',
            type: '联合培养与技术攻关',
            date: '2026-08',
            status: '执行中',
            highlight: '聚焦高端装备制造'
          },
          {
            id: 'AGR-2025-014',
            title: '教育部产学合作协同育人项目：现代包装装备实践基地建设',
            partner: '大连达意科技有限公司',
            type: '教育部协同育人',
            date: '2025-11',
            status: '执行中',
            highlight: '获批国家级立项'
          },
          {
            id: 'AGR-2024-008',
            title: '辽宁省轻工纺织产业校企联盟组建协议',
            partner: '大杨集团等多家龙头企业',
            type: '省级校企联盟',
            date: '2024-05',
            status: '常态化运行',
            highlight: '牵头组建单位'
          }
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
          templateId: 'T14',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('产教融合协议库已同步，生态验证完成！');
      
      setAiOutput({
        diagnosis: '产教融发生态系统高度成熟',
        details: '系统自动比对学校科研处与技术转移中心合同库：机械工程（包装工程）专业深度参与辽宁省轻工纺织产业校企联盟，并与黄海实验室等顶尖科研平台建立正式联合培养机制，教育部产学合作项目稳步增加。',
        impact: '证实了该专业并非“闭门造车”。通过高质量的协议、项目与资金投入，证明了其人才培养体系拥有强大的外部产业支撑与真实课题来源，形成“验证层”的关键闭环。',
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
        <Spin size="large" tip="正在通过 API 对接科研处、技术转移中心与教育部产学合作平台提取合同数据..." />
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
          { title: 'T14 产教融合与校企合作协议' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T14 产教融合与校企合作协议</Title>
          <Paragraph className="text-gray-500 mb-0">
            从宏观专业维度验证产教融合的厚度：是否有真协议、真联盟、真项目、真资金作为人才培养的“土壤”。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><BuildOutlined className="mr-2" /> 校企合作与横向科研数据仓</>} 
        className="shadow-sm border-t-4 border-t-purple-500 mb-6"
        extra={<Tag color="green">已同步</Tag>}
      >
        <Descriptions bordered column={3} className="mb-6">
          <Descriptions.Item label="分析实体" span={2}>{data.majorName}</Descriptions.Item>
          <Descriptions.Item label="同步日期">{data.syncDate}</Descriptions.Item>
          <Descriptions.Item label="活跃校企协议数"><span className="text-purple-600 font-bold text-lg">{data.metrics.activeAgreements} 项</span></Descriptions.Item>
          <Descriptions.Item label="部级/省级协同育人项目"><span className="text-blue-600 font-bold text-lg">{data.metrics.jointProjects} 项</span></Descriptions.Item>
          <Descriptions.Item label="合作资金盘"><span className="text-red-500 font-bold text-lg">{data.metrics.totalFunding}</span></Descriptions.Item>
        </Descriptions>

        <Title level={5} className="mb-4">核心合作协议抽样核验 (Top 3)</Title>
        <List
          itemLayout="vertical"
          dataSource={data.agreements}
          renderItem={(item: any) => (
            <List.Item className="bg-gray-50 mb-4 border border-gray-200 rounded px-6 py-4">
              <List.Item.Meta
                title={<div className="font-bold text-gray-800 text-base flex justify-between">
                  <span>{item.title}</span>
                  <Tag color="purple">{item.type}</Tag>
                </div>}
                description={
                  <div className="mt-2 space-y-1">
                    <div><span className="text-gray-500 mr-2">合作方:</span> <Text strong>{item.partner}</Text></div>
                    <div><span className="text-gray-500 mr-2">协议编号:</span> {item.id}</div>
                    <div><span className="text-gray-500 mr-2">签署时间:</span> {item.date}</div>
                    <div><span className="text-gray-500 mr-2">当前状态:</span> <Badge status="processing" text={item.status} /></div>
                  </div>
                }
              />
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-600">核心亮点: </span>
                <span className="text-xs text-purple-700 bg-purple-100 px-2 py-1 rounded">{item.highlight}</span>
              </div>
            </List.Item>
          )}
        />

        <div className="text-right pt-2">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认协议清单并入库验证
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 产教融发生态评估" className="bg-purple-50 border-purple-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">评估结论：</span>
            <span className="text-purple-700 font-medium text-lg flex items-center gap-2">
              <CheckCircleOutlined /> {aiOutput.diagnosis}
            </span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">数据支撑：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的影响：</span>
            <Paragraph className="text-purple-800 font-medium bg-purple-100 p-2 rounded border border-purple-200">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
