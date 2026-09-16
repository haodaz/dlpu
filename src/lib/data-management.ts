// 数据管理 — 材料类型映射与统计
// 复用 mockDb.json，将 T01-T19 数据映射到 8 类材料类型

import mockData from './mockDb.json';

// ---------- 8 类材料类型 ----------
export type MaterialCategoryKey =
  | 'course-doc'    // 课程文档类
  | 'academic'      // 教务数据类
  | 'research'      // 科研类
  | 'platform-log'  // 平台日志类
  | 'asset'         // 资产设备类
  | 'enterprise'    // 校企合作类
  | 'employment'    // 就业校友类
  | 'training-ai';  // 培训与AI产出类

export interface MaterialCategory {
  key: MaterialCategoryKey;
  name: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}

export const materialCategories: MaterialCategory[] = [
  { key: 'course-doc', name: '课程文档类', color: '#1677ff', bg: '#eff6ff', border: '#bfdbfe', icon: 'FileTextOutlined' },
  { key: 'academic', name: '教务数据类', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', icon: 'ReadOutlined' },
  { key: 'research', name: '科研类', color: '#dc2626', bg: '#fef2f2', border: '#fecaca', icon: 'ExperimentOutlined' },
  { key: 'platform-log', name: '平台日志类', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: 'DashboardOutlined' },
  { key: 'asset', name: '资产设备类', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', icon: 'DatabaseOutlined' },
  { key: 'enterprise', name: '校企合作类', color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: ' ApartmentOutlined' },
  { key: 'employment', name: '就业校友类', color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8', icon: 'TeamOutlined' },
  { key: 'training-ai', name: '培训与AI产出类', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe', icon: 'RobotOutlined' },
];

// ---------- T01-T19 → 材料类型 + 关联指标 + 字段用途映射 ----------
type TemplateMapping = {
  category: MaterialCategoryKey;
  relatedIndicators: string[]; // 关联的指标编号
  displayName: string; // 数据名称
  indicatorUsages: { indicatorId: string; usedFields: string[] }[]; // 每个指标用到哪些字段
};

export const templateMapping: Record<string, TemplateMapping> = {
  T01: {
    category: 'course-doc', relatedIndicators: ['1.1.1', '1.1.2'], displayName: '专业培养方案',
    indicatorUsages: [
      { indicatorId: '1.1.1', usedFields: ['专业名称', '服务产业方向'] },
      { indicatorId: '1.1.2', usedFields: ['课程名称', '课程类型', '开课学期'] },
    ],
  },
  T02: {
    category: 'course-doc', relatedIndicators: ['1.3.1'], displayName: '毕业要求矩阵',
    indicatorUsages: [{ indicatorId: '1.3.1', usedFields: ['毕业要求条目', '国际标准编号'] }],
  },
  T03: {
    category: 'course-doc', relatedIndicators: ['1.1.1'], displayName: '产业白皮书',
    indicatorUsages: [{ indicatorId: '1.1.1', usedFields: ['产业生命周期', '产业链节点', '关键岗位清单'] }],
  },
  T04: {
    category: 'course-doc', relatedIndicators: ['1.1.2'], displayName: '课程-产业链映射矩阵',
    indicatorUsages: [{ indicatorId: '1.1.2', usedFields: ['课程名称', 'AI建议对应产业链节点'] }],
  },
  T05: {
    category: 'course-doc', relatedIndicators: ['1.2.1', '1.2.2', '2.1.2'], displayName: '课程教案',
    indicatorUsages: [
      { indicatorId: '1.2.1', usedFields: ['前沿技术来源', '学生产出物要求'] },
      { indicatorId: '1.2.2', usedFields: ['实践教学环节'] },
      { indicatorId: '2.1.2', usedFields: ['AI 相关内容', '产出物要求'] },
    ],
  },
  T06: {
    category: 'academic', relatedIndicators: ['2.3.2'], displayName: '过程性评价记录',
    indicatorUsages: [{ indicatorId: '2.3.2', usedFields: ['考核任务', '达成度', '改进措施'] }],
  },
  T07: {
    category: 'academic', relatedIndicators: ['2.3.1', '2.3.2'], displayName: '学情分析报告',
    indicatorUsages: [
      { indicatorId: '2.3.1', usedFields: ['出勤率', '作业提交率'] },
      { indicatorId: '2.3.2', usedFields: ['薄弱环节', '改进闭环'] },
    ],
  },
  T08: {
    category: 'academic', relatedIndicators: ['2.3.2'], displayName: '考核达成度报告',
    indicatorUsages: [{ indicatorId: '2.3.2', usedFields: ['目标得分', '薄弱环节', '改进措施'] }],
  },
  T09: {
    category: 'platform-log', relatedIndicators: ['2.3.1'], displayName: '学习行为数据',
    indicatorUsages: [{ indicatorId: '2.3.1', usedFields: ['出勤打卡', '作业提交', '资源访问', '平台登录'] }],
  },
  T10: {
    category: 'asset', relatedIndicators: ['3.1.1'], displayName: '教学资源清单与使用台账',
    indicatorUsages: [{ indicatorId: '3.1.1', usedFields: ['设备台账', '实验开出记录', 'AI平台接入'] }],
  },
  T11: {
    category: 'course-doc', relatedIndicators: ['1.1.3', '1.2.1', '1.3.1', '2.1.1'], displayName: '课程大纲',
    indicatorUsages: [
      { indicatorId: '1.1.3', usedFields: ['课程目标', '目标来源标注'] },
      { indicatorId: '1.2.1', usedFields: ['前沿技术来源(DOI/专利号)'] },
      { indicatorId: '1.3.1', usedFields: ['国际标准编号', 'AI三维能力勾选'] },
      { indicatorId: '2.1.1', usedFields: ['案例引用记录'] },
    ],
  },
  T12: {
    category: 'enterprise', relatedIndicators: ['1.2.3'], displayName: '毕业设计选题清单',
    indicatorUsages: [{ indicatorId: '1.2.3', usedFields: ['选题名称', '选题来源', '企业导师', '验收签章'] }],
  },
  T13: {
    category: 'enterprise', relatedIndicators: ['3.1.2'], displayName: '企业项目驱动清单',
    indicatorUsages: [{ indicatorId: '3.1.2', usedFields: ['项目来源标记', '合同编号', '签章'] }],
  },
  T14: {
    category: 'enterprise', relatedIndicators: ['3.1.2'], displayName: '产教融合与校企合作协议',
    indicatorUsages: [{ indicatorId: '3.1.2', usedFields: ['合同编号', '企业名称', '合作内容'] }],
  },
  T15: {
    category: 'platform-log', relatedIndicators: ['2.2.1'], displayName: '教学投入深度记录',
    indicatorUsages: [{ indicatorId: '2.2.1', usedFields: ['职业指引帖文', '学习计划', '问答响应'] }],
  },
  T18: {
    category: 'employment', relatedIndicators: ['4.1.1', '4.1.3'], displayName: '毕业生就业质量反馈',
    indicatorUsages: [
      { indicatorId: '4.1.1', usedFields: ['就业单位', '岗位名称'] },
      { indicatorId: '4.1.3', usedFields: ['用人单位满意度', '复招率'] },
    ],
  },
  T19: {
    category: 'employment', relatedIndicators: ['4.1.2'], displayName: '校友库追踪数据',
    indicatorUsages: [{ indicatorId: '4.1.2', usedFields: ['校友职位', '职称', '创业情况'] }],
  },
  EVAL_FINAL: {
    category: 'training-ai', relatedIndicators: [], displayName: 'AI评价报告',
    indicatorUsages: [],
  },
};

// ---------- 按材料类型生成预填项细节 ----------
// 每个 templateCode 对应若干预填项（带内容、来源、置信度）
const prefillDetails: Record<string, {
  items: Omit<PrefillItem, 'status'>[];
  explanation: string;
  external?: ExternalVerification[];
  evaluation?: AIPreEvaluation;
  panoramic?: PanoramicLink[];
}> = {
  T01: {
    items: [
      { id: 'T01-1', name: '专业基本信息', content: '专业名称：机械设计制造及其自动化\n学位类型：工学学士\n学制：4年', contentType: 'text', source: 'AI 搜索（教育公开数据）', confidence: 'high', confidenceScore: 0.92 },
      { id: 'T01-2', name: '培养目标文本', content: '培养适应社会主义现代化建设需求，德智体美劳全面发展的应用型高层次工程技术人才，掌握机械领域扎实基础理论，能够胜任机械领域某一方向的工程设计、产品开发、项目实施与管理等工作。', contentType: 'text', source: 'AI 搜索（教育公开数据）', confidence: 'high', confidenceScore: 0.88 },
    ],
    explanation: '基于教育公开数据搜索该校该专业的培养方案，提取专业基本信息和培养目标文本。建议教师核对培养目标是否与学校最新版本一致。',
    panoramic: [{ name: '专业画像', relation: '更新专业基本信息' }],
  },
  T03: {
    items: [
      { id: 'T03-1', name: '产业生命周期判定', content: '产业：轻工包装自动化装备产业\n阶段：成长期（年增长率 8.5%）\n依据：行业协会 2024 年度报告', contentType: 'text', source: 'AI 搜索（行业协会官网+统计年鉴）', confidence: 'medium', confidenceScore: 0.72 },
      { id: 'T03-2', name: '产业链图谱', content: '上游（核心零部件）：伺服电机与驱动系统、精密减速器、工业传感器与PLC\n中游（本体制造与集成）：包装机械本体装配、机电系统集成与调试\n下游（应用与服务）：食品饮料产线应用、售后技术支持', contentType: 'list', source: 'AI 搜索（上市企业年报+行业协会）', confidence: 'medium', confidenceScore: 0.68 },
      { id: 'T03-3', name: '关键岗位清单', content: '上游：电机驱动控制工程师、传动结构设计工程师、底层逻辑编程工程师\n中游：机械本体装配工程师、系统集成调试工程师\n下游：产线运维工程师、技术支持工程师', contentType: 'list', source: 'AI 搜索（招聘网站公开数据）', confidence: 'low', confidenceScore: 0.55 },
    ],
    explanation: '基于政府统计年鉴、行业协会官网、上市企业年报、招聘网站公开数据搜索整理。AI 搜到的是全国数据，教师需补充本地产业链特点。',
    panoramic: [{ name: '产业图谱', relation: '更新产业链节点与关键岗位' }],
  },
  T04: {
    items: [
      { id: 'T04-1', name: '课程-产业链映射矩阵', content: '| 课程名称 | 课程类型 | AI建议对应产业链节点 |\n|---|---|---|\n| 机电传动控制 | 核心 | 上游-伺服电机与驱动系统 |\n| 工业机器人控制技术 | 核心 | 中游-机电系统集成与调试 |\n| 包装机械设计 | 核心 | 中游-包装机械本体装配 |\n| 智能制造导论 | 核心 | 上游-智能装备（匹配度 0.62）|', contentType: 'table', source: '1.1.1 产业白皮书（内部）', confidence: 'medium', confidenceScore: 0.68 },
    ],
    explanation: '基于 1.1.1 产业白皮书中的产业链节点清单，对您上传的课程列表中的核心课程，用关键词匹配和语义相似度自动配对。匹配结果可能存在误配，建议逐门核对。',
    evaluation: {
      currentValue: '覆盖率 78%（有对应节点的核心课程 14 / 核心课程 18）',
      rating: '合格',
      suggestions: ['还有 4 门核心课程未匹配到产业链节点', '建议补充这 4 门课的对应节点，或标注"不直接对应"', '覆盖率达到 85% 可评为"良好"'],
    },
    panoramic: [{ name: '课程资源', relation: '更新课程列表' }, { name: '产业图谱', relation: '更新课程-产业链映射' }],
  },
  T11: {
    items: [
      { id: 'T11-1', name: '课程目标-岗位能力映射', content: '| 课程目标 | AI建议岗位能力编号 |\n|---|---|\n| Obj-1 掌握包装机械机构学原理 | HC-03 机械结构设计 |\n| Obj-2 完成机械传动结构设计 | HC-05 传动系统设计 |\n| Obj-3 现场联调及故障处理 | HC-08 系统集成调试 |', contentType: 'table', source: '1.1.1 产业白皮书岗位清单（内部）', confidence: 'medium', confidenceScore: 0.72 },
      { id: 'T11-2', name: '前沿技术来源', content: 'DOI: 10.1109/xxx.2024.xxx（机器视觉缺陷检测）\n专利号：CN202410123456.7（柔性包装智能识别）', contentType: 'text', source: 'AI 搜索（Crossref+知识产权局）', confidence: 'high', confidenceScore: 0.85 },
      { id: 'T11-3', name: 'AI 三维能力勾选', content: '提问能力：✓（大纲含"讨论""探究"）\n信息判断：✓（大纲含"信息甄别"）\n意义创造：✗（未检测到"创造""构建"）', contentType: 'text', source: 'AI 文本分析', confidence: 'medium', confidenceScore: 0.65 },
    ],
    explanation: '从课程大纲文本提取课程目标，与 1.1.1 白皮书岗位能力做语义匹配；搜索相关论文/专利建议作为前沿来源；分析大纲文本检测 AI 三维能力覆盖。',
    external: [
      { type: 'DOI', value: '10.1109/xxx.2024.xxx', status: 'verified', detail: 'Robotics Control... 2024 期刊' },
      { type: '专利号', value: 'CN202410123456.7', status: 'verified', detail: '一种工业机器人控制方法' },
    ],
    evaluation: {
      currentValue: '目标来源标注 60%，前沿课 40%，AI 维度覆盖 2/3',
      rating: '合格',
      suggestions: ['3 条课程目标未标注来源', '意义创造维度未检测到，建议增加"设计""构建"类内容'],
    },
    panoramic: [{ name: '课程资源', relation: '更新课程大纲' }],
  },
  T08: {
    items: [
      { id: 'T08-1', name: '目标-考核映射矩阵', content: '| 课程目标 | 关联考核任务 | 覆盖 |\n|---|---|---|\n| Obj-1 | 期末试卷(50%) | ✓ |\n| Obj-2 | 项目答辩(30%) | ✓ |\n| Obj-3 | 平时作业(20%) | ✓ |', contentType: 'table', source: '课程管理平台数据解析', confidence: 'high', confidenceScore: 0.88 },
      { id: 'T08-2', name: '达成度报告', content: 'Obj-1: 0.85（掌握良好）\nObj-2: 0.72（空间构型想象力不足）\nObj-3: 0.65（真实项目排故经验缺失）', contentType: 'text', source: '教师填写+AI统计', confidence: 'high', confidenceScore: 0.90 },
      { id: 'T08-3', name: '改进措施闭环', content: '改进1：增加 CAD 强化装配练习 → 新版大纲已增加 2 学时 ✓\n改进2：引入排故实训箱 → 新版大纲已引入 ✓\n改进3：总线排故考核 → 未检测到落实 ✗', contentType: 'text', source: 'AI 版本对比（语义匹配）', confidence: 'medium', confidenceScore: 0.70 },
    ],
    explanation: '构建目标-考核映射矩阵并算覆盖率，统计考核种类，计算反馈时间差，对比达成度改进措施与新版大纲检测闭环落实率。',
    evaluation: {
      currentValue: '映射 100%，考核 3 种，闭环 67%',
      rating: '合格',
      suggestions: ['改进3"总线排故考核"未在新版大纲落实', '建议补充该考核环节以达到闭环 ≥ 70% 的良好档'],
    },
    panoramic: [{ name: '考核档案', relation: '更新考核达成度' }],
  },
  T09: {
    items: [
      { id: 'T09-1', name: '学习行为四项数值', content: '出勤率：96%\n作业提交率：82%\n视频完播率：45%\n论坛生均互动：12 次', contentType: 'text', source: '课程平台行为日志统计', confidence: 'high', confidenceScore: 0.95 },
      { id: 'T09-2', name: '异常检测', content: '⚠ 平台空转预警：视频完播率仅 45%，论坛互动仅 12 次，平台可能"建而不用"', contentType: 'text', source: 'AI 异常检测', confidence: 'high', confidenceScore: 0.92 },
    ],
    explanation: '直接统计四项数值并做异常检测。平台空转会导致教学投入失真，预示期末深层次能力考核可能不达标。',
    evaluation: {
      currentValue: '出勤 96%，作业 82%',
      rating: '良好',
      suggestions: ['视频完播率 45% 偏低，建议提升视频互动性', '论坛互动 12 次偏低，建议设置讨论任务'],
    },
    panoramic: [{ name: '学情档案', relation: '更新学习行为数据' }],
  },
};

// 为没有专门配置的 AI 预填数据生成默认预填项
function getDefaultPrefill(code: string, displayName: string): {
  items: Omit<PrefillItem, 'status'>[];
  explanation: string;
} {
  return {
    items: [
      {
        id: `${code}-1`,
        name: `${displayName} - 自动解析内容`,
        content: `AI 已从上传文件中解析${displayName}相关字段，请逐项核对。`,
        contentType: 'text',
        source: 'AI 文件解析',
        confidence: 'medium',
        confidenceScore: 0.70,
      },
    ],
    explanation: `AI 根据上传的${displayName}文件做关键词匹配和语义分析，自动填写模板字段。建议核对预填内容准确性。`,
  };
}

// ---------- AI 预填 vs 用户上传 判断 ----------
export type DataSourceType = 'ai-prefill' | 'user-upload';

function isAIPrefill(sourceType: string): boolean {
  return sourceType === 'AI_SEARCH' || sourceType === 'MULTI_AGENT_AI';
}

// ---------- 处理后的数据条目 ----------
// 指标用途：每个关联指标用到了材料的哪些字段
export interface IndicatorUsage {
  indicatorId: string;
  usedFields: string[]; // 如 ['课程名称', '课程类型']
}

// 预填项：AI 预填的一个独立内容单元
export interface PrefillItem {
  id: string;
  name: string; // 预填项名称
  content: string; // 预填内容（可含表格 markdown 或文本）
  contentType: 'table' | 'text' | 'list'; // 内容形式
  source: string; // 预填来源
  confidence: 'high' | 'medium' | 'low'; // 置信度
  confidenceScore: number; // 0-1
  status: 'pending' | 'confirmed' | 'modified' | 'deleted'; // 项级状态
}

// 外部数据验证结果
export interface ExternalVerification {
  type: string; // DOI / 专利号 / 标准号 / ISBN
  value: string; // 具体编号
  status: 'verified' | 'failed' | 'pending';
  detail: string; // 验证详情
  action?: string; // 失败时的建议操作
}

// AI 预评价
export interface AIPreEvaluation {
  currentValue: string; // 当前数值
  rating: '合格' | '良好' | '优秀' | '未达标';
  suggestions: string[]; // 改进建议
}

// 关联全景数据
export interface PanoramicLink {
  name: string;
  relation: string; // 关系说明
}

export interface ProcessedDataItem {
  id: string;
  templateCode: string;
  sourceType: string; // 原始 sourceType
  displayName: string;
  category: MaterialCategoryKey;
  relatedIndicators: string[];
  indicatorUsages: IndicatorUsage[]; // 每个关联指标用到的字段
  dataSource: DataSourceType; // ai-prefill | user-upload
  aiPrefillStatus: 'full' | 'partial' | 'none'; // AI预填状态
  processStatus: 'pending' | 'modified' | 'confirmed'; // 我的处理状态
  confidence: number; // 置信度 0-100
  prefillSource: string; // 预填来源
  status: string; // 原始 status
  createdAt: string;
  updatedAt: string;
  // 详情页扩展字段
  prefillItems?: PrefillItem[]; // 预填项列表
  externalVerifications?: ExternalVerification[]; // 外部验证结果
  aiPreEvaluation?: AIPreEvaluation; // AI预评价
  panoramicLinks?: PanoramicLink[]; // 关联全景数据
  aiExplanation?: string; // AI预填说明
  rawPayload?: any; // 原始数据内容（评价引擎直接消费）
}

// 简单确定性伪随机（根据 id 生成稳定的置信度）
function hashConfidence(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0x7fffffff;
  return 60 + (h % 39); // 60-98
}

// 处理单条 mockDb 数据
function processItem(raw: any): ProcessedDataItem | null {
  const code = raw.templateCode;
  if (!code) return null;
  const mapping = templateMapping[code];
  if (!mapping) return null;

  const ds: DataSourceType = isAIPrefill(raw.sourceType) ? 'ai-prefill' : 'user-upload';

  // AI 预填状态：PENDING → full（已预填待确认），COMPLETED → confirmed
  // 对于 user-upload，aiPrefillStatus 设为 none
  let aiPrefillStatus: 'full' | 'partial' | 'none' = 'none';
  let processStatus: 'pending' | 'modified' | 'confirmed' = 'pending';

  if (ds === 'ai-prefill') {
    aiPrefillStatus = raw.status === 'PENDING' ? 'full' : 'full';
    processStatus = raw.status === 'PENDING' ? 'pending' : 'confirmed';
  } else {
    // 用户上传：状态为 COMPLETED 视为已确认
    processStatus = raw.status === 'COMPLETED' ? 'confirmed' : 'pending';
  }

  // 加载预填项细节
  const detail = ds === 'ai-prefill' ? (prefillDetails[code] || getDefaultPrefill(code, mapping.displayName)) : null;
  const prefillItems: PrefillItem[] | undefined = detail
    ? detail.items.map((it) => ({ ...it, status: processStatus === 'confirmed' ? 'confirmed' : 'pending' as const }))
    : undefined;

  return {
    id: raw.id,
    templateCode: code,
    sourceType: raw.sourceType,
    displayName: mapping.displayName,
    category: mapping.category,
    relatedIndicators: mapping.relatedIndicators,
    indicatorUsages: mapping.indicatorUsages,
    dataSource: ds,
    aiPrefillStatus,
    processStatus,
    confidence: ds === 'ai-prefill' ? hashConfidence(raw.id) : 100,
    prefillSource: ds === 'ai-prefill'
      ? (raw.sourceType === 'AI_SEARCH' ? 'AI 搜索' : '多智能体生成')
      : '用户上传',
    status: raw.status,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    prefillItems,
    externalVerifications: detail?.external,
    aiPreEvaluation: detail?.evaluation,
    panoramicLinks: detail?.panoramic,
    aiExplanation: detail?.explanation,
    rawPayload: (() => {
      try { return JSON.parse(raw.rawPayload); } catch { return raw.rawPayload; }
    })(),
  };
}

// ---------- 公共 API ----------
export function getAllProcessedData(): ProcessedDataItem[] {
  return (mockData as any[])
    .map(processItem)
    .filter((x): x is ProcessedDataItem => x !== null);
}

export function getAIPrefillData(): ProcessedDataItem[] {
  return getAllProcessedData().filter((d) => d.dataSource === 'ai-prefill');
}

export function getUserUploadData(): ProcessedDataItem[] {
  return getAllProcessedData().filter((d) => d.dataSource === 'user-upload');
}

// ---------- 统计 ----------
export interface CategoryStat {
  category: MaterialCategory;
  total: number;
  aiPrefill: number;
  userUpload: number;
  pendingCount: number;
  relatedIndicatorCount: number;
}

export function getCategoryStats(): CategoryStat[] {
  const all = getAllProcessedData();
  return materialCategories.map((cat) => {
    const items = all.filter((d) => d.category === cat.key);
    const aiCount = items.filter((d) => d.dataSource === 'ai-prefill').length;
    const uploadCount = items.filter((d) => d.dataSource === 'user-upload').length;
    const pending = items.filter((d) => d.processStatus === 'pending').length;
    const indicators = new Set<string>();
    items.forEach((d) => d.relatedIndicators.forEach((i) => indicators.add(i)));
    return {
      category: cat,
      total: items.length,
      aiPrefill: aiCount,
      userUpload: uploadCount,
      pendingCount: pending,
      relatedIndicatorCount: indicators.size,
    };
  });
}

export interface GlobalStat {
  totalData: number;
  aiPrefillCount: number;
  userUploadCount: number;
  aiPrefillRatio: number; // 0-100
  userUploadRatio: number; // 0-100
  coveredIndicatorCount: number;
  totalIndicatorCount: number;
  coverageRatio: number; // 0-100
  pendingCount: number;
}

export function getGlobalStat(): GlobalStat {
  const all = getAllProcessedData();
  const ai = all.filter((d) => d.dataSource === 'ai-prefill').length;
  const upload = all.filter((d) => d.dataSource === 'user-upload').length;
  const indicators = new Set<string>();
  all.forEach((d) => d.relatedIndicators.forEach((i) => indicators.add(i)));
  const total = 17; // 使命型 17 项
  return {
    totalData: all.length,
    aiPrefillCount: ai,
    userUploadCount: upload,
    aiPrefillRatio: all.length ? Math.round((ai / all.length) * 100) : 0,
    userUploadRatio: all.length ? Math.round((upload / all.length) * 100) : 0,
    coveredIndicatorCount: indicators.size,
    totalIndicatorCount: total,
    coverageRatio: Math.round((indicators.size / total) * 100),
    pendingCount: all.filter((d) => d.processStatus === 'pending').length,
  };
}

// ---------- 评价引擎上下文构建 ----------
// 从「填报成果」的已确认数据构建评价上下文，替代旧的 T01-T19 直接读取
export interface EvaluationDataContext {
  panoramicData: Record<string, any>;          // T-code → 原始内容（兼容旧专家）
  confirmedItems: ProcessedDataItem[];          // 所有已确认/已修改的填报项
  indicatorData: Record<string, ProcessedDataItem[]>; // 指标ID → 关联的已确认项
  pendingIndicators: string[];                  // 仍有待确认数据的指标
}

export function buildEvaluationContext(): EvaluationDataContext {
  const all = getAllProcessedData();
  // 只取已确认或已修改的填报数据作为评价输入
  const confirmed = all.filter((d) => d.processStatus === 'confirmed' || d.processStatus === 'modified');

  const panoramicData: Record<string, any> = {};
  confirmed.forEach((item) => {
    if (item.rawPayload && !panoramicData[item.templateCode]) {
      panoramicData[item.templateCode] = item.rawPayload;
    }
  });

  const indicatorData: Record<string, ProcessedDataItem[]> = {};
  confirmed.forEach((item) => {
    item.relatedIndicators.forEach((ind) => {
      if (!indicatorData[ind]) indicatorData[ind] = [];
      indicatorData[ind].push(item);
    });
  });

  // 仍有待确认项的指标
  const pendingSet = new Set<string>();
  all.filter((d) => d.processStatus === 'pending').forEach((d) => {
    d.relatedIndicators.forEach((ind) => pendingSet.add(ind));
  });

  return {
    panoramicData,
    confirmedItems: confirmed,
    indicatorData,
    pendingIndicators: Array.from(pendingSet),
  };
}

// 工具：根据 key 获取 MaterialCategory
export function getCategory(key: MaterialCategoryKey): MaterialCategory {
  return materialCategories.find((c) => c.key === key)!;
}

// 按材料类型分组数据（含每份材料列表）
export interface CategoryGroup extends CategoryStat {
  items: ProcessedDataItem[];
}

export function getCategoryGroups(): CategoryGroup[] {
  const all = getAllProcessedData();
  return materialCategories.map((cat) => {
    const items = all.filter((d) => d.category === cat.key);
    const aiCount = items.filter((d) => d.dataSource === 'ai-prefill').length;
    const uploadCount = items.filter((d) => d.dataSource === 'user-upload').length;
    const pending = items.filter((d) => d.processStatus === 'pending').length;
    const indicators = new Set<string>();
    items.forEach((d) => d.relatedIndicators.forEach((i) => indicators.add(i)));
    return {
      category: cat,
      total: items.length,
      aiPrefill: aiCount,
      userUpload: uploadCount,
      pendingCount: pending,
      relatedIndicatorCount: indicators.size,
      items,
    };
  });
}

// 根据材料 id 获取单条数据
export function getProcessedItemById(id: string): ProcessedDataItem | undefined {
  return getAllProcessedData().find((d) => d.id === id);
}

// ---------- 操作记录（数据日志） ----------
export type ActionType = 'upload' | 'ai-prefill' | 'confirm' | 'modify' | 'supplement' | 'delete' | 'revoke' | 're-submit';
export type RecordStatus = 'completed' | 'pending' | 'failed' | 'revoked';

export interface DataRecordChange {
  field: string;
  before: string;
  after: string;
}

export interface DataRecordVersion {
  version: number;
  timestamp: string;
  action: ActionType;
  summary: string;
  changes?: DataRecordChange[];
}

export interface DataRecord {
  id: string;
  timestamp: string;
  materialName: string;
  materialCode?: string; // 如 T01
  category: MaterialCategoryKey;
  action: ActionType;
  status: RecordStatus;
  summary: string; // 内容摘要
  operator: string;
  relatedIndicators: string[];
  payloadSummary: string; // JSON 探针摘要
  // 详情
  changes?: DataRecordChange[];
  versions?: DataRecordVersion[];
  aiOriginal?: string; // AI 预填原文（用于对比）
  myModified?: string; // 我的修改
}

// action 展示配置
export const actionConfig: Record<ActionType, { label: string; color: string; bg: string }> = {
  'upload': { label: '上传', color: '#7c3aed', bg: '#f5f3ff' },
  'ai-prefill': { label: 'AI 预填', color: '#0891b2', bg: '#ecfeff' },
  'confirm': { label: '确认', color: '#059669', bg: '#ecfdf5' },
  'modify': { label: '修改', color: '#1677ff', bg: '#eff6ff' },
  'supplement': { label: '补充', color: '#9333ea', bg: '#faf5ff' },
  'delete': { label: '删除', color: '#dc2626', bg: '#fef2f2' },
  'revoke': { label: '撤回', color: '#d97706', bg: '#fffbeb' },
  're-submit': { label: '重新提交', color: '#4338ca', bg: '#eef2ff' },
};

export const statusConfig: Record<RecordStatus, { label: string; color: string; bg: string }> = {
  'completed': { label: '已完成', color: '#059669', bg: '#ecfdf5' },
  'pending': { label: '进行中', color: '#d97706', bg: '#fffbeb' },
  'failed': { label: '失败', color: '#dc2626', bg: '#fef2f2' },
  'revoked': { label: '已撤回', color: '#64748b', bg: '#f1f5f9' },
};

// 生成确定性 mock 记录
function genRecords(): DataRecord[] {
  const now = new Date('2026-09-15T10:00:00');
  const mk = (offset: number, r: Partial<DataRecord>): DataRecord => {
    const t = new Date(now.getTime() - offset * 3600000);
    const ts = t.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-');
    return {
      id: `R-${offset}`,
      timestamp: ts,
      materialName: '',
      category: 'academic',
      action: 'upload',
      status: 'completed',
      summary: '',
      operator: '郝壮',
      relatedIndicators: [],
      payloadSummary: '',
      ...r,
    };
  };

  return [
    mk(1, { materialName: '课程列表.xlsx', materialCode: 'T01', category: 'academic', action: 'upload', status: 'completed',
      summary: '从教务系统导出 2026 春季课程列表，38 门课程',
      relatedIndicators: ['1.1.2'],
      payloadSummary: '{"totalCourses":38,"coreCourses":18}',
    }),
    mk(2, { materialName: '课程列表.xlsx', materialCode: 'T01', category: 'academic', action: 'ai-prefill', status: 'completed',
      summary: 'AI 自动解析课程-产业链映射，匹配 14/18 核心课程',
      relatedIndicators: ['1.1.2'],
      payloadSummary: '{"mapped":14,"unmapped":4,"confidence":"medium"}',
      aiOriginal: '机电传动控制→中游-运动控制系统；工业机器人控制技术→中游-机电系统集成与调试；智能制造导论→上游-智能装备',
      changes: [
        { field: '智能制造导论 对应节点', before: '上游-智能装备（AI建议）', after: '中游-机电系统集成与调试（人工修正）' },
      ],
    }),
    mk(3, { materialName: '课程列表.xlsx', materialCode: 'T01', category: 'academic', action: 'modify', status: 'completed',
      summary: '修改 4 门课程的产业链映射，其中 1 门标注"不直接对应"',
      relatedIndicators: ['1.1.2'],
      payloadSummary: '{"modified":3,"markNotApplicable":1}',
      aiOriginal: '智能制造导论→上游-智能装备',
      myModified: '智能制造导论→中游-机电系统集成与调试',
      changes: [
        { field: '智能制造导论 对应节点', before: '上游-智能装备', after: '中游-机电系统集成与调试' },
        { field: '机械制图 对应节点', before: '上游-核心零部件', after: '不直接对应' },
      ],
    }),
    mk(4, { materialName: '教材使用清单.xlsx', materialCode: 'T02', category: 'academic', action: 'upload', status: 'completed',
      summary: '上传 2026 春季教材清单，含 28 本 ISBN',
      relatedIndicators: ['1.2.1'],
      payloadSummary: '{"totalBooks":28,"recent3years":20}',
    }),
    mk(5, { materialName: '教材使用清单.xlsx', materialCode: 'T02', category: 'academic', action: 'ai-prefill', status: 'completed',
      summary: 'AI 验证 ISBN，发现 2 本已停版',
      relatedIndicators: ['1.2.1'],
      payloadSummary: '{"verified":26,"failed":2,"recent":20}',
      changes: [
        { field: 'ISBN 978-7-111-2019-0', before: '2019 出版（AI 标记近 3 年）', after: '已停版，不计入近 3 年教材' },
      ],
    }),
    mk(6, { materialName: '产业白皮书（轻工包装）', materialCode: 'T03', category: 'course-doc', action: 'ai-prefill', status: 'pending',
      summary: 'AI 生成产业白皮书初稿，三段结构待审核',
      relatedIndicators: ['1.1.1'],
      payloadSummary: '{"lifecycle":"成长期","upstream":5,"midstream":4,"downstream":3,"jobs":28}',
    }),
    mk(7, { materialName: '培养方案 / 教学计划.xlsx', materialCode: 'T03b', category: 'academic', action: 'upload', status: 'completed',
      summary: '上传 2026 版培养方案，含 4 学年教学计划',
      relatedIndicators: ['1.2.2', '2.2.1'],
      payloadSummary: '{"years":4,"totalCourses":126,"practiceCourses":18}',
    }),
    mk(8, { materialName: '课程大纲.docx', materialCode: 'T11', category: 'course-doc', action: 'upload', status: 'completed',
      summary: '上传 3 门核心课程大纲（V2 版）',
      relatedIndicators: ['1.1.3', '1.2.1', '1.3.1', '2.1.1', '2.1.2'],
      payloadSummary: '{"courses":3,"totalObjectives":12}',
    }),
    mk(9, { materialName: '课程大纲.docx', materialCode: 'T11', category: 'course-doc', action: 'modify', status: 'completed',
      summary: '补充前沿技术来源标注（2 个 DOI + 1 个专利号）',
      relatedIndicators: ['1.2.1'],
      payloadSummary: '{"addedDOI":2,"addedPatent":1}',
      changes: [
        { field: '课程-机器视觉技术 前沿来源', before: '无', after: 'DOI: 10.1109/xxx.2024.xxx' },
        { field: '课程-柔性包装 前沿来源', before: '无', after: '专利号：CN202410123456.7' },
      ],
    }),
    mk(10, { materialName: '教学案例-视觉检测.docx', materialCode: 'T11b', category: 'course-doc', action: 'confirm', status: 'completed',
      summary: '确认"视觉检测教学案例"关联横向课题 HY-2024-001',
      relatedIndicators: ['2.1.1'],
      payloadSummary: '{"linkedProject":"HY-2024-001","usedInCourses":["机器视觉技术"]}',
    }),
    mk(11, { materialName: '横向课题清单.xlsx', materialCode: 'T13', category: 'research', action: 'upload', status: 'completed',
      summary: '上传科研管理系统横向课题清单，6 项课题',
      relatedIndicators: ['2.1.1', '1.2.3'],
      payloadSummary: '{"totalProjects":6,"relatedCoreIndustry":4}',
    }),
    mk(12, { materialName: 'AI教学平台使用日志.xlsx', materialCode: 'T14', category: 'platform-log', action: 'upload', status: 'completed',
      summary: '上传 AI 教学平台 2026 春季使用日志',
      relatedIndicators: ['2.1.2'],
      payloadSummary: '{"activeTeachers":12,"avgSessions":45,"aiOutputs":28}',
    }),
    mk(13, { materialName: '课程平台行为日志.xlsx', materialCode: 'T16', category: 'platform-log', action: 'ai-prefill', status: 'completed',
      summary: 'AI 统计四项数值 + 异常检测',
      relatedIndicators: ['2.3.1'],
      payloadSummary: '{"attendance":0.96,"submission":0.82,"videoCompletion":0.45,"anomalyDetected":true}',
      changes: [
        { field: '视频完播率', before: '45%（AI 标记正常）', after: '45%（AI 标记偏低，建议提升互动性）' },
      ],
    }),
    mk(14, { materialName: '课程平台行为日志.xlsx', materialCode: 'T16', category: 'platform-log', action: 'modify', status: 'completed',
      summary: '标记"视频完播率"数据可能异常（平台 bug）',
      relatedIndicators: ['2.3.1'],
      payloadSummary: '{"flaggedAnomaly":true,"reason":"平台统计 bug，部分课程完播率数据缺失"}',
    }),
    mk(15, { materialName: '设备台账.xlsx', materialCode: 'T17', category: 'asset', action: 'upload', status: 'completed',
      summary: '上传资产管理系统设备台账，102 台设备',
      relatedIndicators: ['3.1.1'],
      payloadSummary: '{"totalDevices":102,"normal":96,"idle":4,"scrapped":2}',
    }),
    mk(16, { materialName: '实验开出记录.xlsx', materialCode: 'T18', category: 'asset', action: 'ai-prefill', status: 'completed',
      summary: 'AI 自动统计实验开出率 90%，标记 2 项无设备使用记录',
      relatedIndicators: ['3.1.1'],
      payloadSummary: '{"planned":20,"actual":18,"rate":0.9,"missingRecords":2}',
      changes: [
        { field: '实验"工业机器人编程实操"', before: '已开出（AI 标记）', after: '无设备使用记录，需人工核对' },
      ],
    }),
    mk(17, { materialName: '企业合作合同清单.xlsx', materialCode: 'T20', category: 'enterprise', action: 'upload', status: 'completed',
      summary: '上传合同管理系统清单，8 份校企合作合同',
      relatedIndicators: ['3.1.2', '1.2.3'],
      payloadSummary: '{"totalContracts":8,"valid":7,"expired":1}',
    }),
    mk(18, { materialName: '企业合作合同清单.xlsx', materialCode: 'T20', category: 'enterprise', action: 'ai-prefill', status: 'completed',
      summary: 'AI 自动匹配毕业设计选题与企业合同',
      relatedIndicators: ['1.2.3'],
      payloadSummary: '{"matchedTheses":6,"totalTheses":9}',
    }),
    mk(19, { materialName: '企业验收签章文件.pdf', materialCode: 'T21', category: 'enterprise', action: 'upload', status: 'completed',
      summary: '上传 6 份企业验收签章扫描件',
      relatedIndicators: ['3.1.2', '1.2.3'],
      payloadSummary: '{"totalSignatures":6,"verified":6}',
    }),
    mk(20, { materialName: '企业验收签章文件.pdf', materialCode: 'T21', category: 'enterprise', action: 'confirm', status: 'completed',
      summary: '确认 6 份签章文件全部真实有效',
      relatedIndicators: ['3.1.2'],
      payloadSummary: '{"allVerified":true}',
    }),
    mk(21, { materialName: '毕业生就业数据.xlsx', materialCode: 'T25', category: 'employment', action: 'upload', status: 'completed',
      summary: '上传就业指导中心 2026 届就业数据',
      relatedIndicators: ['4.1.1'],
      payloadSummary: '{"totalGraduates":112,"employed":98,"industryMatch":78}',
    }),
    mk(22, { materialName: '毕业生就业数据.xlsx', materialCode: 'T25', category: 'employment', action: 'ai-prefill', status: 'completed',
      summary: 'AI 匹配产业白皮书方向，对口就业率 79%',
      relatedIndicators: ['4.1.1'],
      payloadSummary: '{"matchedToWhitepaper":78,"rate":0.79}',
      changes: [
        { field: '岗位"销售工程师"', before: 'AI 标记非对口', after: '人工判定对口（服务核心产业产品）' },
      ],
    }),
    mk(23, { materialName: '校友职业发展数据.xlsx', materialCode: 'T26', category: 'employment', action: 'upload', status: 'completed',
      summary: '上传校友会职业追踪数据，200 名校友',
      relatedIndicators: ['4.1.2'],
      payloadSummary: '{"tracked":200,"backbone":35,"management":20,"entrepreneur":8,"advancedCert":12}',
    }),
    mk(24, { materialName: '企业导师指导记录.docx', materialCode: 'T22', category: 'enterprise', action: 'upload', status: 'completed',
      summary: '上传 6 份企业导师指导记录',
      relatedIndicators: ['1.2.3'],
      payloadSummary: '{"totalRecords":6,"verified":5}',
    }),
    mk(25, { materialName: '课程目标列表 + 考核任务列表.xlsx', materialCode: 'T05', category: 'academic', action: 'upload', status: 'completed',
      summary: '上传课程管理平台导出的目标-考核映射',
      relatedIndicators: ['2.3.2'],
      payloadSummary: '{"courses":5,"objectives":22,"mappingCoverage":1.0}',
    }),
    mk(26, { materialName: '课程目标列表 + 考核任务列表.xlsx', materialCode: 'T05', category: 'academic', action: 'modify', status: 'revoked',
      summary: '撤回上一步修改（撤回映射覆盖率标注）',
      relatedIndicators: ['2.3.2'],
      payloadSummary: '{"revokeReason":"数据有误，需重新核对"}',
    }),
    mk(27, { materialName: '达成度报告.docx', materialCode: 'T10', category: 'course-doc', action: 'upload', status: 'failed',
      summary: '上传失败：文件格式不正确',
      relatedIndicators: ['2.3.2'],
      payloadSummary: '{"error":"format_not_supported"}',
    }),
    mk(28, { materialName: '教学案例-产线视觉检测.docx', materialCode: 'T11b-2', category: 'course-doc', action: 'upload', status: 'completed',
      summary: '上传新教学案例',
      relatedIndicators: ['2.1.1'],
      payloadSummary: '{"linkedProject":"HY-2024-003","usedInCourses":["机器视觉技术"]}',
    }),
    mk(29, { materialName: '用人单位联系人清单.xlsx', materialCode: 'T24', category: 'enterprise', action: 'upload', status: 'completed',
      summary: '上传 35 家用人单位联系人信息',
      relatedIndicators: ['4.1.3'],
      payloadSummary: '{"totalCompanies":35,"contacts":42}',
    }),
    mk(30, { materialName: '教学投入深度记录.xlsx', materialCode: 'T15', category: 'platform-log', action: 'ai-prefill', status: 'pending',
      summary: 'AI 正在解析课程平台互动数据，检测职业指引内容',
      relatedIndicators: ['2.2.1'],
      payloadSummary: '{"status":"processing","progress":0.6}',
    }),
    mk(31, { materialName: '课程大纲文档', materialCode: 'T04', category: 'course-doc', action: 'supplement', status: 'completed',
      summary: '补充 3 门课程大纲中缺失的 AI 三维能力训练描述',
      relatedIndicators: ['1.3.1', '2.1.2'],
      payloadSummary: '{"supplementedCourses":3,"fieldsAdded":["AI能力训练"]}',
      aiOriginal: '课程目标：掌握机械制图基础知识',
      myModified: '课程目标：掌握机械制图基础知识；融入 AI 三维能力——借助 AI 工具进行尺寸标注与工程图快速生成（提问能力+信息判断）',
      changes: [
        { field: '机械制图 课程目标', before: '掌握机械制图基础知识', after: '掌握机械制图基础知识；融入 AI 三维能力训练' },
        { field: '互换性测量 课程目标', before: '掌握公差配合基本概念', after: '掌握公差配合基本概念；使用 AI 辅助公差查询与选择' },
      ],
    }),
    mk(32, { materialName: '横向课题清单.xlsx', materialCode: 'T11', category: 'research', action: 'confirm', status: 'completed',
      summary: '确认 2 项横向课题与核心产业相关，可用于教学转化',
      relatedIndicators: ['2.1.1'],
      payloadSummary: '{"confirmedProjects":2,"industryRelated":true}',
    }),
    mk(33, { materialName: '实验开出记录.xlsx', materialCode: 'T17', category: 'asset', action: 'supplement', status: 'completed',
      summary: '补充 AI 平台课程接入清单，新增 5 门课程接入记录',
      relatedIndicators: ['3.1.1'],
      payloadSummary: '{"newCourses":5,"totalConnected":18}',
      aiOriginal: 'AI 平台接入课程 13 门',
      myModified: 'AI 平台接入课程 18 门（补充 5 门：机器视觉、工业机器人编程等）',
    }),
    mk(34, { materialName: '选题清单.xlsx', materialCode: 'T12', category: 'enterprise', action: 'confirm', status: 'completed',
      summary: '确认 9 个毕业设计选题全部来自企业真实项目',
      relatedIndicators: ['1.2.3'],
      payloadSummary: '{"confirmedTheses":9,"allFromEnterprise":true}',
    }),
  ];
}

let cachedRecords: DataRecord[] | null = null;
export function getAllDataRecords(): DataRecord[] {
  if (!cachedRecords) cachedRecords = genRecords();
  return cachedRecords;
}

export function getDataRecordById(id: string): DataRecord | undefined {
  return getAllDataRecords().find((r) => r.id === id);
}

export function getRecordsByCategory(cat: MaterialCategoryKey): DataRecord[] {
  return getAllDataRecords().filter((r) => r.category === cat);
}
