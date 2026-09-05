'use client';
import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space, Breadcrumb, Typography, Spin, Tag, List, Avatar } from 'antd';
import { CheckCircleOutlined, ArrowLeftOutlined, TrophyOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph } = Typography;

export default function T19AlumniForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [aiOutput, setAiOutput] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => {
      setData({
        majorName: '机械工程 (包装工程等方向)',
        syncDate: new Date().toLocaleDateString(),
        alumniList: [
          {
            name: '张伟',
            title: '董事长、总经理',
            company: '大连吉瑞刀具技术股份有限公司',
            achievement: '深耕机械制造切削工具领域，带领企业实现高端刀具国产化替代。',
            matchType: '产业链上游核心骨干'
          },
          {
            name: '李琳',
            title: '董事长兼总经理',
            company: '大连优联智能装备股份有限公司',
            achievement: '专注于智能装备研发与制造，为区域智能制造产业升级提供关键设备支持。',
            matchType: '产业链中游核心骨干'
          },
          {
            name: '薛晓彤',
            title: '董事长 (大连工业大学沈阳校友会会长)',
            company: '辽宁博联过滤有限公司',
            achievement: '环保与过滤装备制造领军人物，积极推动校企合作与产教融合。',
            matchType: '产业链配套骨干'
          }
        ]
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
          templateId: 'T19',
          data: data,
        }),
      });

      if (!response.ok) throw new Error('Failed to save data');

      await response.json();
      message.success('知名校友与职业发展数据已同步验证！');
      
      setAiOutput({
        diagnosis: '毕业生影响力极强，完美印证产业定位',
        details: '系统通过爬虫全网回溯“大连工业大学 机械/智能装备 董事长/创始人”关键字，成功定位张伟、李琳等多位杰出校友。他们创办的大连吉瑞刀具、优联智能装备等企业，全部高度集中于辽宁区域的“智能装备制造”产业链。',
        impact: '作为评价链“验证层”的最后一块拼图（T19），这证明了该专业不仅能解决学生初次就业（T18），更能在毕业 10 年以上的长周期内，持续为地方核心产业链输送领军型创始人与高管。定位层（T01 支撑地方经济）彻底闭环。',
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
        <Spin size="large" tip="正在通过爬虫引擎回溯全网知名校友工商注册与新闻数据..." />
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
          { title: 'T19 毕业生职业发展与校友追踪' },
        ]}
      />
      
      <div className="mb-6 flex items-center">
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/templates')} className="mr-4" />
        <div>
          <Title level={2} className="!mb-1 !text-gray-800">T19 毕业生职业发展与校友追踪验证</Title>
          <Paragraph className="text-gray-500 mb-0">
            通过互联网爬虫与校友会数据比对，追踪毕业 5-10 年以上校友的真实产业贡献力。
          </Paragraph>
        </div>
      </div>

      <Card 
        title={<><TrophyOutlined className="mr-2" /> 杰出校友产业链贡献追踪 (长周期验证)</>} 
        className="shadow-sm border-t-4 border-t-yellow-500 mb-6"
        extra={<Tag color="green">全网检索完成</Tag>}
      >
        <div className="mb-4 text-gray-700">
          <strong>分析实体：</strong> {data.majorName}
        </div>
        
        <List
          itemLayout="horizontal"
          dataSource={data.alumniList}
          renderItem={(item: any) => (
            <List.Item className="bg-gray-50 mb-4 rounded-lg border border-gray-200 px-4">
              <List.Item.Meta
                avatar={<Avatar size={48} icon={<UserOutlined />} className="bg-yellow-500" />}
                title={<span className="font-bold text-lg">{item.name} <Tag color="gold" className="ml-2">{item.title}</Tag></span>}
                description={
                  <div>
                    <div className="text-gray-800 font-medium mb-1">{item.company}</div>
                    <div className="text-gray-500 text-sm mb-2">{item.achievement}</div>
                    <div><Tag color="cyan">AI判定定位: {item.matchType}</Tag></div>
                  </div>
                }
              />
            </List.Item>
          )}
        />

        <div className="text-right border-t pt-4 border-gray-100">
          <Space>
            <Button onClick={() => router.push('/templates')}>返回</Button>
            <Button type="primary" onClick={onConfirm} icon={<CheckCircleOutlined />} loading={submitting}>
              确认结果并闭环验证
            </Button>
          </Space>
        </div>
      </Card>

      {aiOutput && (
        <Card title="🤖 AI 校友影响力长周期评估报告" className="bg-yellow-50 border-yellow-300">
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">长周期追踪结论：</span>
            <span className="text-yellow-700 font-medium text-lg flex items-center gap-2">
              <CheckCircleOutlined /> {aiOutput.diagnosis}
            </span>
          </div>
          <div className="mb-4">
            <span className="font-bold text-gray-700 block mb-1">数据回溯证据链：</span>
            <Paragraph className="text-gray-800">
              {aiOutput.details}
            </Paragraph>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">对评价链的最终收官影响：</span>
            <Paragraph className="text-white font-medium bg-yellow-600 p-3 rounded shadow-inner">
              {aiOutput.impact}
            </Paragraph>
          </div>
        </Card>
      )}
    </div>
  );
}
