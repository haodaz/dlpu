'use client';
import React from 'react';
import { Tag, Button, List, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { FormOutlined, ClockCircleOutlined, LayoutOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const templates = [
  { id: 'T01', name: '专业建设规划与方案', status: 'active', desc: '设定专业发展总体规划与建设路径。' },
  { id: 'T02', name: '毕业要求', status: 'active', desc: '聚焦宏观行业趋势，为专业定位提供支撑。' },
  { id: 'T03', name: '产业白皮书', status: 'active', desc: '解构产业链图谱、节点企业及关键岗位需求。' },
  { id: 'T04', name: '课程-产业链映射矩阵', status: 'active', desc: '验证课程体系与产业节点的对应关联，防止悬空课程。' },
  { id: 'T05', name: '教案 (典型)', status: 'active', desc: '体现教师对每堂课的总体设计、重点、案例引入及逻辑递进。' },
  { id: 'T06', name: '过程性评价记录', status: 'active', desc: '填补期末一张卷与能力达成之间的断层，记录日常测验与项目表现。' },
  { id: 'T07', name: '学情分析报告', status: 'active', desc: '纵向对比历届数据，诊断能力短板，为后续课程提供交接棒。' },
  { id: 'T08', name: '考核分析', status: 'active', desc: '评价课程目标达成情况并制定持续改进措施。' },
  { id: 'T09', name: '学习行为数据', status: 'active', desc: '轻量对接课程平台，自动获取出勤、作业提交、在线交互等纯客观行为特征。' },
  { id: 'T10', name: '教学资源清单与使用台账', status: 'active', desc: '自动读取资产与实验系统台账，验证设备是否真正在支撑核心课程。' },
  { id: 'T11', name: '课程大纲 (典型)', status: 'active', desc: '详细定义单门课程的教学目标、内容与考核方式。' },
  { id: 'T12', name: '毕业设计选题与成果记录', status: 'active', desc: '验证毕业设计真题真做比例与企业验收签章。' },
  { id: 'T13', name: '企业项目驱动清单', status: 'active', desc: '验证核心课程是否使用带有企业签章和合同编号的真实生产项目。' },
  { id: 'T14', name: '产教融合与校企合作协议', status: 'active', desc: '产学研合作项目、基地建设及成果转化。' },
  { id: 'T15', name: '教学投入记录', status: 'active', desc: '提取教师在传道（职业指引）、授业（学习计划）、解惑（平台答疑）的三维投入数据。' },
  { id: 'T16', name: '持续改进与大纲演进 (存证)', status: 'active', desc: '根据架构设计决策，本项不再要求填报，由 AI 直接对比 T11(课程大纲) 的历史版本自动生成。' },
  { id: 'T17', name: '教学资源清单与使用台账 (存证)', status: 'active', desc: '根据最新架构梳理，该项已在我们搭建 T10 时超前完成，核心资产验证已全面打通。' },
  { id: 'T18', name: '行业就业率与用人单位满意度', status: 'active', desc: '基于就业系统与爬虫，验证毕业生对口就业率及起薪、满意度。' },
  { id: 'T19', name: '毕业生职业发展与校友追踪', status: 'active', desc: '追踪3-5年后毕业生的持续成长力与行业贡献。' },
];

export default function TemplatesPage() {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-140px)] flex flex-col">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
        <div>
          <Title level={3} className="!text-slate-800 !m-0 mb-1 flex items-center gap-2">
            <LayoutOutlined className="text-blue-500" />
            底层模板管理中心
          </Title>
          <Paragraph className="text-slate-500 m-0 text-sm">
            管理“使命型”与“未来型”19项核心模板数据规范，统一调度填报。
          </Paragraph>
        </div>
      </div>

      <div className="p-8 flex-1 bg-slate-50/30">
        <div className="max-w-5xl mx-auto">
          <List
            itemLayout="horizontal"
            dataSource={templates}
            renderItem={(item) => (
              <List.Item
                className={`bg-white mb-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 ${item.status === 'active' ? 'border-l-[6px] border-l-blue-500' : 'border-l-[6px] border-l-slate-300 opacity-80'} px-6 py-5`}
                actions={[
                  <Button 
                    type={item.status === 'active' ? 'primary' : 'default'}
                    disabled={item.status !== 'active'}
                    icon={<FormOutlined />}
                    onClick={() => router.push(`/templates/${item.id.toLowerCase()}`)}
                    className={item.status === 'active' ? 'font-bold shadow-sm' : ''}
                    size="large"
                  >
                    {item.status === 'active' ? '进入填报大厅' : '模块待联调'}
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-3 mb-2 mt-1">
                      <span className="font-bold text-slate-800 text-lg tracking-tight">{item.id} <span className="ml-1 text-slate-700">{item.name}</span></span>
                      {item.status === 'active' 
                        ? <Tag color="blue" className="m-0 border-blue-200 font-bold px-2">已挂载引擎</Tag> 
                        : <Tag color="default" className="m-0"><ClockCircleOutlined className="mr-1" />待开发</Tag>
                      }
                    </div>
                  }
                  description={<span className="text-slate-500 leading-relaxed text-sm">{item.desc}</span>}
                />
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
}
