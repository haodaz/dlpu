'use client';
import React from 'react';
import { Tag, Button, Table } from 'antd';
import { useRouter } from 'next/navigation';
import { FormOutlined, ClockCircleOutlined, LayoutOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const templates = [
  { id: 'T01', name: '专业建设规划与方案', status: 'active', desc: '设定专业发展总体规划与建设路径。', tags: ['使命型核心', '未来型基础'] },
  { id: 'T02', name: '毕业要求', status: 'active', desc: '聚焦宏观行业趋势，为专业定位提供支撑。', tags: ['使命型核心'] },
  { id: 'T03', name: '产业白皮书', status: 'active', desc: '解构产业链图谱、节点企业及关键岗位需求。', tags: ['使命型核心', '未来型(前瞻引领)'] },
  { id: 'T04', name: '课程-产业链映射矩阵', status: 'active', desc: '验证课程体系与产业节点的对应关联，防止悬空课程。', tags: ['使命型核心'] },
  { id: 'T05', name: '教案 (典型)', status: 'active', desc: '体现教师对每堂课的总体设计、重点、案例引入及逻辑递进。', tags: ['使命型支撑'] },
  { id: 'T06', name: '过程性评价记录', status: 'active', desc: '填补期末一张卷与能力达成之间的断层，记录日常测验与项目表现。', tags: ['使命型核心'] },
  { id: 'T07', name: '学情分析报告', status: 'active', desc: '纵向对比历届数据，诊断能力短板，为后续课程提供交接棒。', tags: ['使命型支撑'] },
  { id: 'T08', name: '考核分析', status: 'active', desc: '评价课程目标达成情况并制定持续改进措施。', tags: ['使命型核心'] },
  { id: 'T09', name: '学习行为数据', status: 'active', desc: '轻量对接课程平台，自动获取出勤、作业提交、在线交互等纯客观行为特征。', tags: ['使命型核心', '未来型(个性化学习)'] },
  { id: 'T10', name: '教学资源清单与使用台账', status: 'active', desc: '自动读取资产与实验系统台账，验证设备是否真正在支撑核心课程。', tags: ['使命型核心'] },
  { id: 'T11', name: '课程大纲 (典型)', status: 'active', desc: '详细定义单门课程的教学目标、内容与考核方式。', tags: ['使命型核心', '未来型(AI重构)'] },
  { id: 'T12', name: '毕业设计选题与成果记录', status: 'active', desc: '验证毕业设计真题真做比例与企业验收签章。', tags: ['使命型核心'] },
  { id: 'T13', name: '企业项目驱动清单', status: 'active', desc: '验证核心课程是否使用带有企业签章和合同编号的真实生产项目。', tags: ['使命型核心'] },
  { id: 'T14', name: '产教融合与校企合作协议', status: 'active', desc: '产学研合作项目、基地建设及成果转化。', tags: ['使命型核心', '未来型(生态编排)'] },
  { id: 'T15', name: '教学投入记录', status: 'active', desc: '提取教师在传道（职业指引）、授业（学习计划）、解惑（平台答疑）的三维投入数据。', tags: ['使命型核心'] },
  { id: 'T16', name: '持续改进与大纲演进 (存证)', status: 'active', desc: '不再要求填报，由 AI 对比历史版本自动生成。', tags: ['底层自动存证'] },
  { id: 'T17', name: '教学资源清单与使用台账 (存证)', status: 'active', desc: '在搭建 T10 时已超前完成，资产验证已打通。', tags: ['底层自动存证'] },
  { id: 'T18', name: '行业就业率与用人单位满意度', status: 'active', desc: '验证毕业生对口就业率及起薪、满意度。', tags: ['使命型核心'] },
  { id: 'T19', name: '毕业生职业发展与校友追踪', status: 'active', desc: '追踪3-5年后毕业生的持续成长力与行业贡献。', tags: ['使命型核心', '未来型(终身学习)'] },
];

export default function TemplatesPage() {
  const router = useRouter();

  const columns: ColumnsType<any> = [
    {
      title: '模板标识',
      dataIndex: 'id',
      key: 'id',
      width: '30%',
      render: (text, record) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 text-sm">{record.id}</span>
            <span className="font-medium text-slate-800 text-sm">{record.name}</span>
          </div>
          <div className="text-xs text-slate-500 line-clamp-1" title={record.desc}>{record.desc}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: '15%',
      render: (status) => (
        status === 'active' 
          ? <Tag color="blue" className="m-0 border-blue-200 text-blue-700 bg-blue-50">已挂载引擎</Tag> 
          : <Tag color="default" className="m-0 text-slate-500"><ClockCircleOutlined className="mr-1" />待开发</Tag>
      )
    },
    {
      title: '指标域支持',
      key: 'tags',
      dataIndex: 'tags',
      width: '35%',
      render: (_, { tags }) => (
        <div className="flex flex-wrap gap-1.5">
          {tags?.map((tag: string) => {
            let colorClass = 'bg-slate-50 border-slate-200 text-slate-600';
            if (tag.includes('使命型')) colorClass = 'bg-cyan-50 border-cyan-200 text-cyan-700';
            if (tag.includes('未来型')) colorClass = 'bg-purple-50 border-purple-200 text-purple-700';
            return (
              <span key={tag} className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colorClass}`}>
                {tag}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: '20%',
      render: (_, record) => (
        <Button 
          type="text"
          disabled={record.status !== 'active'}
          className={record.status === 'active' ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium' : ''}
          onClick={() => router.push(`/templates/${record.id.toLowerCase()}`)}
        >
          {record.status === 'active' ? '录入数据' : '待联调'}
        </Button>
      ),
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50 rounded-xl overflow-hidden shadow-sm border border-slate-100">
      
      {/* 极简 CRM 风格 Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex items-center gap-4 shrink-0">
        <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
          <LayoutOutlined />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 m-0 leading-tight">底层模板管理中心</h1>
          <p className="text-sm text-slate-500 m-0 mt-1">管理“使命型”与“未来型”19项核心模板数据规范，统一调度填报。</p>
        </div>
      </div>

      {/* 核心内容区 */}
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <Table 
              columns={columns} 
              dataSource={templates} 
              pagination={false}
              rowKey="id"
              size="middle"
              className="crm-table"
            />
          </div>
        </div>
      </main>

    </div>
  );
}
