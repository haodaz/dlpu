'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Card, Tabs, Descriptions, Tag, Row, Col, Empty, Button } from 'antd';
import {
  BuildOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  CloudUploadOutlined,
  GlobalOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import mockFaculty from '@/lib/mockFaculty.json';
import { getAllProcessedData, getGlobalStat } from '@/lib/data-management';
import { indicators } from '@/lib/indicators';

export default function PanoramicPage() {
  const router = useRouter();
  const [t01Data, setT01Data] = useState<any>(null);
  const [t02Data, setT02Data] = useState<any>(null);
  const [t03Data, setT03Data] = useState<any>(null);
  const [t04Data, setT04Data] = useState<any>(null);
  const [t11Data, setT11Data] = useState<any>(null);
  const [t08Data, setT08Data] = useState<any>(null);
  const [t12Data, setT12Data] = useState<any>(null);
  const [t14Data, setT14Data] = useState<any>(null);
  const [t18Data, setT18Data] = useState<any>(null);
  const [t19Data, setT19Data] = useState<any>(null);

  const global = useMemo(() => getGlobalStat(), []);
  const allData = useMemo(() => getAllProcessedData(), []);

  // 统计：已确认的数据条数、完整度
  const confirmedCount = useMemo(
    () => allData.filter((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified').length,
    [allData]
  );
  const coverageRatio = global.totalData > 0 ? Math.round((confirmedCount / global.totalData) * 100) : 0;

  // 5 个板块 → 关联指标
  const sectionIndicators: Record<string, string[]> = {
    '1': ['1.1.1'],           // 机构基本信息
    '2': ['1.1.2', '1.2.1', '1.2.2', '1.3.1'], // 课程资源
    '3': ['1.1.1'],           // 产业图谱
    '4': ['2.1.2', '2.2.1'],  // 师资团队
    '5': ['1.2.3', '3.1.2', '4.1.1', '4.1.2', '4.1.3'], // 实践成果
  };

  // 每个板块的完整度统计
  const sectionStats = useMemo(() => {
    const stats: Record<string, { confirmed: number; total: number; pending: number; missingIndicators: string[] }> = {};
    Object.entries(sectionIndicators).forEach(([key, indIds]) => {
      const items = allData.filter((d) => indIds.some((id) => d.relatedIndicators.includes(id)));
      const confirmed = items.filter((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified').length;
      const pending = items.filter((d) => d.processStatus === 'pending').length;
      // 找出没有任何已确认数据的指标
      const missingIndicators = indIds.filter((id) => {
        const indItems = items.filter((d) => d.relatedIndicators.includes(id));
        return !indItems.some((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified');
      });
      stats[key] = { confirmed, total: items.length, pending, missingIndicators };
    });
    return stats;
  }, [allData]);

  // 板块完整度组件
  const SectionHeader = ({ sectionKey, name }: { sectionKey: string; name: string }) => {
    const s = sectionStats[sectionKey];
    const ratio = s.total > 0 ? Math.round((s.confirmed / s.total) * 100) : 0;
    return (
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-slate-800">{name}</span>
          <span className="text-xs text-slate-400">数据完整度 {ratio}%</span>
          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${ratio}%` }} />
          </div>
          <span className="text-xs text-slate-500">{s.confirmed}/{s.total} 项已确认</span>
        </div>
        {s.pending > 0 && (
          <span className="text-xs text-amber-600 font-bold">{s.pending} 项待确认</span>
        )}
      </div>
    );
  };

  // 缺失项提示组件
  const MissingItems = ({ sectionKey }: { sectionKey: string }) => {
    const s = sectionStats[sectionKey];
    if (s.missingIndicators.length === 0 && s.pending === 0) return null;
    return (
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <ClockCircleOutlined className="text-amber-600" />
            <span className="text-amber-700">
              {s.missingIndicators.length > 0 && `缺 ${s.missingIndicators.length} 项指标数据`}
              {s.missingIndicators.length > 0 && s.pending > 0 && '，'}
              {s.pending > 0 && `${s.pending} 项待确认`}
            </span>
            {s.missingIndicators.length > 0 && (
              <div className="flex items-center gap-1 ml-2">
                {s.missingIndicators.map((iid) => {
                  const ind = indicators.find((x) => x.id === iid);
                  return (
                    <span key={iid} className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-amber-200 text-amber-600 font-mono">
                      {iid} {ind?.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <button
            onClick={() => router.push('/data-management/ai-prefill')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5"
          >
            <PlusOutlined /> 去补充
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetch('/api/panoramic')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const data = result.data;
          const find = (code: string) => data.find((item: any) => item.templateCode === code);
          const parse = (item: any) => (item ? JSON.parse(item.rawPayload) : null);
          setT01Data(parse(find('T01')));
          setT02Data(parse(find('T02')));
          setT03Data(parse(find('T03')));
          setT04Data(parse(find('T04')));
          setT11Data(parse(find('T11')));
          setT08Data(parse(find('T08')));
          setT12Data(parse(find('T12')));
          setT14Data(parse(find('T14')));
          setT18Data(parse(find('T18')));
          setT19Data(parse(find('T19')));
        }
      });
  }, []);

  // 给每个 Card 的元信息：来源 + 状态 + 关联指标
  const cardMeta = {
    profile: {
      sources: [{ type: 'ai-prefill', label: 'AI 预填' }, { type: 'upload', label: '我上传' }],
      status: 'confirmed' as const,
      indicators: ['1.1.1'],
    },
    courses: {
      sources: [{ type: 'upload', label: '我上传：2024年课程列表.xlsx' }, { type: 'ai-prefill', label: 'AI 预填映射矩阵' }],
      status: 'confirmed' as const,
      indicators: ['1.1.2', '1.2.2', '1.3.1'],
    },
    industry: {
      sources: [{ type: 'ai-prefill', label: 'AI 预填：行业白皮书' }, { type: 'external', label: '外部数据：上市企业年报' }],
      status: 'confirmed' as const,
      indicators: ['1.1.1'],
    },
    outcomes: {
      sources: [{ type: 'ai-prefill', label: 'AI 预填' }, { type: 'upload', label: '我上传：校企合同/就业数据' }],
      status: 'pending' as const,
      indicators: ['1.2.3', '3.1.2', '4.1.1', '4.1.2', '4.1.3'],
    },
  };

  const tabItems = [
    {
      key: '1',
      label: '机构基本信息',
      children: (
        <div className="flex flex-col gap-5 mt-4">
          <SectionHeader sectionKey="1" name="机构基本信息" />
          <MissingItems sectionKey="1" />
          <Card size="small" title="实体标定" variant="borderless" className="bg-gray-50 border border-gray-100">
            <Descriptions column={2}>
              <Descriptions.Item label="院校名称">大连工业大学 (DLPU)</Descriptions.Item>
              <Descriptions.Item label="实体类型"><Tag color="blue">公办本科</Tag></Descriptions.Item>
              <Descriptions.Item label="所在地">辽宁省 大连市</Descriptions.Item>
              <Descriptions.Item label="主管部门">辽宁省教育厅</Descriptions.Item>
            </Descriptions>
          </Card>

          {t01Data && (
            <MetaCard
              title="培养目标"
              meta={cardMeta.profile}
              indicatorId="1.1.1"
              router={router}
            >
              <Descriptions column={3} className="mb-4">
                <Descriptions.Item label="当前分析专业"><span className="font-bold">{t01Data.majorName}</span></Descriptions.Item>
                <Descriptions.Item label="学位类型">{t01Data.degreeType}</Descriptions.Item>
                <Descriptions.Item label="学制">{t01Data.duration}</Descriptions.Item>
              </Descriptions>
              <div className="bg-blue-50/50 p-4 rounded text-gray-700 leading-relaxed border border-blue-50">
                {t01Data.objectiveText.split('\n').map((para: string, idx: number) => (
                  <p key={idx} className="mb-2 last:mb-0 indent-8">{para}</p>
                ))}
              </div>
            </MetaCard>
          )}

          {t02Data && (
            <MetaCard
              title="毕业要求"
              meta={{ ...cardMeta.profile, indicators: ['1.3.1'] }}
              indicatorId="1.3.1"
              router={router}
            >
              <div className="text-xs text-gray-400 mb-4">版本: {t02Data.version} | 支撑: {t02Data.targetT01Version}</div>
              <div className="flex flex-col gap-4">
                {t02Data.requirements.map((req: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded p-4">
                    <h3 className="font-bold text-gray-800 mb-2">{index + 1}. {req.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{req.description}</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <div className="text-xs font-bold text-gray-500 mb-2">分解指标点：</div>
                      {req.subIndicators.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className="text-sm text-gray-700 mb-1 flex items-start">
                          <span className="text-green-600 font-medium mr-2 w-6">{sub.subIndex}</span>
                          <span>{sub.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </MetaCard>
          )}
        </div>
      ),
    },
    {
      key: '2',
      label: '课程资源',
      children: (
        <div className="mt-4 space-y-5">
          <SectionHeader sectionKey="2" name="课程资源" />
          <MissingItems sectionKey="2" />
          {/* 课程列表 */}
          <MetaCard title="课程列表" meta={cardMeta.courses} indicatorId="1.1.2" router={router}>
            <div className="flex items-center gap-6 mb-4 text-sm">
              <div><span className="text-slate-500">课程总数：</span><span className="font-bold text-slate-800">45 门</span></div>
              <div><span className="text-slate-500">核心课程：</span><span className="font-bold text-blue-600">18 门</span></div>
            </div>
          </MetaCard>

          {/* 课程-产业链映射 */}
          <MetaCard
            title="课程-产业链映射"
            meta={{
              sources: [{ type: 'ai-prefill', label: 'AI 预填（1.1.1 产业白皮书）' }, { type: 'upload', label: '我上传确认' }],
              status: 'confirmed' as const,
              indicators: ['1.1.2'],
            }}
            indicatorId="1.1.2"
            router={router}
          >
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">覆盖率：</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-xs">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '78%' }} />
                </div>
                <span className="font-bold text-blue-600">78%</span>
              </div>
            </div>
            {t04Data && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-slate-200 rounded-lg">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-3 py-2 text-left font-bold text-slate-600">课程名称</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-600">课程类型</th>
                      <th className="px-3 py-2 text-left font-bold text-slate-600">对应产业链节点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {t04Data.mappings.slice(0, 6).map((m: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-bold text-slate-700">{m.courseName}</td>
                        <td className="px-3 py-2 text-slate-500">{m.courseType || '核心'}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <div className="flex flex-wrap gap-1">
                            {(m.matchedNodes || []).slice(0, 2).map((n: string, nIdx: number) => (
                              <Tag key={nIdx} color="blue" className="m-0">{n}</Tag>
                            ))}
                            {(m.matchedNodes || []).length > 2 && (
                              <span className="text-xs text-slate-400">+{(m.matchedNodes || []).length - 2}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </MetaCard>

          {/* 前沿课比例 */}
          <MetaCard
            title="前沿课比例"
            meta={{
              sources: [{ type: 'ai-prefill', label: 'AI 预填（DOI/专利验证）' }, { type: 'upload', label: '我确认' }],
              status: 'confirmed' as const,
              indicators: ['1.2.1'],
            }}
            indicatorId="1.2.1"
            router={router}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                <div className="text-xs text-purple-600 mb-1">前沿课比例</div>
                <div className="text-2xl font-bold text-purple-700">25%</div>
                <div className="text-[10px] text-slate-400 mt-1">含验证通过的论文/专利/标准</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                <div className="text-xs text-blue-600 mb-1">近3年教材比例</div>
                <div className="text-2xl font-bold text-blue-700">60%</div>
                <div className="text-[10px] text-slate-400 mt-1">基于 ISBN 查询出版年份</div>
              </div>
            </div>
          </MetaCard>

          {/* 综合验证课程 */}
          <MetaCard
            title="综合验证课程"
            meta={{
              sources: [{ type: 'ai-prefill', label: 'AI 预填（培养方案识别）' }, { type: 'upload', label: '我确认' }],
              status: 'confirmed' as const,
              indicators: ['1.2.2'],
            }}
            indicatorId="1.2.2"
            router={router}
          >
            <div className="flex items-center gap-2 text-sm mb-3">
              <span className="text-slate-500">综合验证课：</span>
              <span className="font-bold text-slate-800">4 门</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">递进阶段：</span>
              <span className="inline-flex items-center gap-1">
                {['基础', '进阶', '综合', '实战'].map((p, i) => (
                  <React.Fragment key={p}>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-50 text-green-700 border border-green-200">{p}</span>
                    {i < 3 && <ArrowRightOutlined className="text-slate-300 text-[10px]" />}
                  </React.Fragment>
                ))}
              </span>
            </div>
          </MetaCard>

          {/* 国际标准对标 */}
          <MetaCard
            title="国际标准对标课程"
            meta={{
              sources: [{ type: 'ai-prefill', label: 'AI 预填（标准编号提取+能力检测）' }, { type: 'upload', label: '我确认' }],
              status: 'confirmed' as const,
              indicators: ['1.3.1'],
            }}
            indicatorId="1.3.1"
            router={router}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-xs text-slate-600 mb-1">有标准编号的课程</div>
                <div className="text-2xl font-bold text-slate-800">8 门</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <div className="text-xs text-slate-600 mb-1">AI 三维能力覆盖</div>
                <div className="text-2xl font-bold text-indigo-600">60%</div>
              </div>
            </div>
          </MetaCard>
        </div>
      ),
    },
    {
      key: '3',
      label: '产业图谱',
      children: (
        <div className="mt-4">
          <SectionHeader sectionKey="3" name="产业图谱" />
          <MissingItems sectionKey="3" />
          {t03Data ? (
            <MetaCard
              title={t03Data.industryTitle}
              meta={cardMeta.industry}
              indicatorId="1.1.1"
              router={router}
            >
              <div className="flex flex-col gap-6">
                {t03Data.nodes.map((layer: any, index: number) => (
                  <div key={index} className="relative">
                    <div className="font-bold text-gray-700 mb-3 bg-purple-50 inline-block px-3 py-1 rounded text-sm">{layer.layer}</div>
                    <Row gutter={[16, 16]}>
                      {layer.items.map((item: any, iIdx: number) => (
                        <Col span={8} key={iIdx}>
                          <div className="border border-purple-200 p-4 rounded bg-white hover:shadow-md transition-shadow">
                            <div className="font-semibold text-gray-800 mb-1">{item.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Tag color="purple" className="m-0 border-0 bg-purple-100 text-purple-700">{item.coreRole}</Tag>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                ))}
              </div>
            </MetaCard>
          ) : (
            <Empty description="暂未找到产业图谱数据" />
          )}
        </div>
      ),
    },
    {
      key: '4',
      label: '师资团队',
      children: (
        <div className="mt-4">
          <SectionHeader sectionKey="4" name="师资团队" />
          <MissingItems sectionKey="4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockFaculty.map((faculty: any) => (
              <Card key={faculty.id} className="border border-gray-200 hover:shadow-lg transition-shadow bg-white rounded-xl overflow-hidden" bodyStyle={{ padding: '0' }}>
                <div className="flex p-6 gap-6 items-start">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-100 flex-shrink-0">
                    <img src={faculty.avatar} alt={faculty.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 m-0 leading-tight">{faculty.name}</h3>
                        <div className="text-sm text-gray-500 mt-1">{faculty.title}</div>
                      </div>
                      <Tag color="blue" className="m-0 font-bold border-blue-200 text-blue-700 bg-blue-50">{faculty.team}</Tag>
                    </div>

                    <div className="flex gap-2 flex-wrap mt-3 mb-4">
                      {faculty.courses.map((c: string, idx: number) => (
                        <Tag key={idx} className="bg-gray-50 border-gray-200 text-gray-600 m-0">{c}</Tag>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 font-medium">教学三维投入深度</span>
                        <span className="font-bold text-blue-600">
                          {Math.round((faculty.t15Metrics.careerGuidanceScore + faculty.t15Metrics.learningPlanScore + faculty.t15Metrics.qaScore) / 3)} 分
                        </span>
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-400 mb-1">传道</div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${faculty.t15Metrics.careerGuidanceScore}%` }} /></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-400 mb-1">授业</div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${faculty.t15Metrics.learningPlanScore}%` }} /></div>
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-400 mb-1">解惑</div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${faculty.t15Metrics.qaScore}%` }} /></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="primary" className="bg-blue-600 font-semibold" onClick={() => router.push(`/panoramic/faculty/${faculty.id}`)}>
                        查看人才画像
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: '5',
      label: '实践成果',
      children: (
        <div className="mt-4 space-y-5">
          <SectionHeader sectionKey="5" name="实践成果" />
          <MissingItems sectionKey="5" />
          {t12Data && (
            <MetaCard
              title="毕业设计真题真做验证"
              meta={{ ...cardMeta.outcomes, indicators: ['1.2.3'] }}
              indicatorId="1.2.3"
              router={router}
            >
              <Descriptions column={3} className="mb-6">
                <Descriptions.Item label="当前分析届次"><span className="font-bold">{t12Data.cohort}</span></Descriptions.Item>
                <Descriptions.Item label="总课题数">{t12Data.metrics.totalProjects}</Descriptions.Item>
                <Descriptions.Item label="参与企业导师"><span className="font-bold text-blue-600">{t12Data.metrics.enterpriseMentors} 人</span></Descriptions.Item>
              </Descriptions>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-700">真题真做比例</span>
                  <span className="font-bold text-blue-600">
                    {t12Data.metrics.realProjects} / {t12Data.metrics.totalProjects} (
                    {Math.round((t12Data.metrics.realProjects / t12Data.metrics.totalProjects) * 100)}%)
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${Math.round((t12Data.metrics.realProjects / t12Data.metrics.totalProjects) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">AI 成果验证结论：</div>
              <div className="bg-blue-50/50 p-4 rounded text-blue-800 leading-relaxed border border-blue-100 mb-6">
                {t12Data.diagnosis}: {t12Data.details}
                <br /><br />
                <strong>系统影响追踪：</strong>{t12Data.impact}
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">底层抽样数据清单：</div>
              <table className="w-full text-xs border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-bold text-gray-600">课题编号</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">课题名称</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">类型</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">指导教师</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {t12Data.projects.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-gray-500">{p.id}</td>
                      <td className="px-3 py-2 text-gray-800">{p.title}</td>
                      <td className="px-3 py-2">
                        <Tag color={p.type === '企业真题' ? 'green' : 'default'}>{p.type}</Tag>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{p.mentor}</td>
                      <td className="px-3 py-2 text-gray-600">{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </MetaCard>
          )}

          {t14Data && (
            <MetaCard
              title="产教融合与校企合作验证"
              meta={{ ...cardMeta.outcomes, indicators: ['3.1.2'] }}
              indicatorId="3.1.2"
              router={router}
            >
              <Descriptions column={3} className="mb-6">
                <Descriptions.Item label="活跃校企协议数"><span className="font-bold text-purple-600">{t14Data.metrics.activeAgreements} 项</span></Descriptions.Item>
                <Descriptions.Item label="部级/省级协同育人"><span className="font-bold text-blue-600">{t14Data.metrics.jointProjects} 项</span></Descriptions.Item>
                <Descriptions.Item label="合作资金盘"><span className="font-bold text-red-500">{t14Data.metrics.totalFunding}</span></Descriptions.Item>
              </Descriptions>

              <div className="text-sm font-bold text-gray-700 mb-2">AI 产教融发生态评估结论：</div>
              <div className="bg-purple-50/50 p-4 rounded text-purple-800 leading-relaxed border border-purple-100 mb-6">
                {t14Data.diagnosis}: {t14Data.details}
                <br /><br />
                <strong>系统影响追踪：</strong>{t14Data.impact}
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">核心合作协议抽样验证：</div>
              <table className="w-full text-xs border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-bold text-gray-600">协议编号</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">协议名称</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">合作方</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">类型</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {t14Data.agreements.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-gray-500">{a.id}</td>
                      <td className="px-3 py-2 text-gray-800">{a.title}</td>
                      <td className="px-3 py-2 text-gray-600">{a.partner}</td>
                      <td className="px-3 py-2"><Tag color="purple">{a.type}</Tag></td>
                      <td className="px-3 py-2 text-gray-600">{a.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </MetaCard>
          )}

          {t18Data && (
            <MetaCard
              title="毕业生就业质量验证"
              meta={{ ...cardMeta.outcomes, indicators: ['4.1.1', '4.1.3'] }}
              indicatorId="4.1.1"
              router={router}
            >
              <Descriptions column={4} className="mb-6">
                <Descriptions.Item label="分析届次"><span className="font-bold">{t18Data.cohort}</span></Descriptions.Item>
                <Descriptions.Item label="初次就业率"><span className="font-bold text-gray-700">{Math.round((t18Data.metrics.employed / t18Data.metrics.totalGraduates) * 100)}%</span></Descriptions.Item>
                <Descriptions.Item label="用人单位满意度"><span className="font-bold text-green-600">{t18Data.metrics.employerSatisfaction}%</span></Descriptions.Item>
                <Descriptions.Item label="平均起薪"><span className="font-bold text-indigo-600">{t18Data.metrics.avgSalary}</span></Descriptions.Item>
              </Descriptions>

              <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-gray-700">精准对口率（匹配产业白皮书）</span>
                  <span className="font-bold text-indigo-600">
                    {Math.round((t18Data.metrics.matchedIndustry / t18Data.metrics.employed) * 100)}% (
                    {t18Data.metrics.matchedIndustry}/{t18Data.metrics.employed})
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${Math.round((t18Data.metrics.matchedIndustry / t18Data.metrics.employed) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-sm font-bold text-gray-700 mb-2">AI 终极培养验证报告：</div>
              <div className="bg-indigo-50/50 p-4 rounded text-indigo-800 leading-relaxed border border-indigo-100">
                {t18Data.diagnosis}: {t18Data.details}
                <br /><br />
                <strong>闭环达成验证：</strong>{t18Data.impact}
              </div>
            </MetaCard>
          )}

          {t19Data && (
            <MetaCard
              title="毕业生影响力追踪"
              meta={{ ...cardMeta.outcomes, indicators: ['4.1.2'] }}
              indicatorId="4.1.2"
              router={router}
            >
              <div className="text-sm font-bold text-gray-700 mb-4">全网工商库爬虫匹配结果（企业创始人/高管身份验证）：</div>
              <table className="w-full text-xs border border-gray-200 rounded mb-4">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-bold text-gray-600">校友姓名</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">社会职务</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">创立/管理企业</th>
                    <th className="px-3 py-2 text-left font-bold text-gray-600">产业链定位</th>
                  </tr>
                </thead>
                <tbody>
                  {t19Data.alumniList.map((a: any) => (
                    <tr key={a.name} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-bold text-gray-800">{a.name}</td>
                      <td className="px-3 py-2"><Tag color="gold">{a.title}</Tag></td>
                      <td className="px-3 py-2 text-gray-600">{a.company}</td>
                      <td className="px-3 py-2 font-bold text-gray-700">{a.matchType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-yellow-50 p-4 rounded text-yellow-800 leading-relaxed border border-yellow-200">
                <strong>{t19Data.diagnosis}</strong><br />
                {t19Data.details}
                <br /><br />
                <strong>专业终极价值闭环：</strong>{t19Data.impact}
              </div>
            </MetaCard>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-8 py-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center text-blue-600 text-lg">
              <BuildOutlined />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800 m-0 leading-tight">按板块查看</h1>
              <p className="text-sm text-slate-500 m-0 mt-0.5">按 5 个板块展示机构画像 — 确认后正式数据的整合展示</p>
            </div>
          </div>
          {/* 提示条 */}
          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2 text-sm">
            <InfoCircleOutlined className="text-purple-600" />
            <span className="text-purple-700">这是<strong>正式数据的整合展示</strong>，与
              <button onClick={() => router.push('/filling-results/by-indicator')} className="text-blue-600 hover:underline font-bold mx-1">【按指标查看】</button>
              是同一批数据的两种视角。
            </span>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">数据完整度</span>
              <span className="font-bold text-blue-600">{coverageRatio}%</span>
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: `${coverageRatio}%` }} />
              </div>
            </div>
            <div className="text-slate-300">|</div>
            <div className="text-slate-500">已确认数据 <span className="font-bold text-green-600">{confirmedCount}</span> 项</div>
            <div className="text-slate-300">|</div>
            <div className="text-slate-500">覆盖指标 <span className="font-bold text-amber-600">{global.coveredIndicatorCount}</span>/{indicators.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs 内容 */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        <Tabs defaultActiveKey="1" items={tabItems} size="large" />
      </div>
    </div>
  );
}

// ---------- 带 Meta 的 Card ----------
interface CardMeta {
  sources: { type: 'ai-prefill' | 'upload' | 'external'; label: string }[];
  status: 'confirmed' | 'pending' | 'modified';
  indicators: string[];
}

function MetaCard({
  title,
  meta,
  indicatorId,
  router,
  children,
}: {
  title: string;
  meta: CardMeta;
  indicatorId?: string;
  router: any;
  children: React.ReactNode;
}) {
  const statusConfig = {
    confirmed: { text: '已确认', color: '#059669', bg: '#ecfdf5' },
    pending: { text: '待确认', color: '#d97706', bg: '#fffbeb' },
    modified: { text: '已修改', color: '#1677ff', bg: '#eff6ff' },
  }[meta.status];

  const sourceIcon = {
    'ai-prefill': <RobotOutlined className="text-purple-500" />,
    upload: <CloudUploadOutlined className="text-green-500" />,
    external: <GlobalOutlined className="text-cyan-500" />,
  };
  const sourceTypeLabel = {
    'ai-prefill': 'AI 预填',
    upload: '我上传',
    external: '外部数据',
  };

  return (
    <Card
      size="small"
      title={title}
      bordered={false}
      className="bg-white shadow-sm"
      styles={{ body: { padding: 0 } }}
    >
      {/* 来源 + 状态 + 操作 — 卡片底部的 Meta 区 */}
      <div className="px-5 pt-5">
        {children}
      </div>

      <div className="mt-4 border-t border-slate-100 px-5 py-3 flex items-center justify-between text-xs bg-slate-50/60 rounded-b-lg">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-slate-400">来源：</span>
          {meta.sources.map((s, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {sourceIcon[s.type]}
              <span className="font-medium" style={{ color: s.type === 'ai-prefill' ? '#7c3aed' : s.type === 'upload' ? '#059669' : '#0891b2' }}>
                {sourceTypeLabel[s.type]}
              </span>
              <span className="text-slate-500">· {s.label.split('：').slice(1).join('：') || s.label}</span>
              {i < meta.sources.length - 1 && <span className="text-slate-300 mx-1">+</span>}
            </span>
          ))}
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1">
            {meta.status === 'pending' ? <ClockCircleOutlined style={{ color: statusConfig.color }} /> : <CheckCircleOutlined style={{ color: statusConfig.color }} />}
            <span className="font-bold" style={{ color: statusConfig.color }}>状态：{statusConfig.text}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {meta.indicators.slice(0, 2).map((iid) => (
            <Tag key={iid} className="m-0 text-[10px] font-mono">{iid}</Tag>
          ))}
          {indicatorId && (
            <button
              onClick={() => router.push(`/data-management/ai-prefill/detail?indicator=${indicatorId}`)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
            >
              查看 AI 预填 <ArrowRightOutlined />
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
