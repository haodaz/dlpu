// 使命型 17 项指标 — 标准数据
// 数据来源：使命型17项指标数据流详解.html
// 本文件只描述"指标标准"，不含个人进度/填报记录。

export type DimensionKey = 'A' | 'B' | 'C' | 'D';

export type ScoringMethod = '定量评分' | '定性评价' | '混合评价';

export type MaterialType = string; // 所需材料名称（自由文本）

export interface ScoringTier {
  tier: '合格' | '良好' | '优秀';
  criteria: string;
}

export interface FAQItem {
  q: string;
  a: string;
}

export interface Indicator {
  id: string; // 编号 1.1.1
  name: string; // 指标名称
  dimension: DimensionKey; // 一级维度 A/B/C/D
  subCategoryId: string; // 二级编号 如 1.1
  subCategoryName: string; // 二级名称 如 课程产业对接
  hierarchy: '三级'; // 本层指标层级（17 项均为三级）
  weight: number; // 该指标在总评价中的权重(%)
  oneLineSummary: string; // 极简摘要
  definition: string; // 指标定义与说明
  materialTypes: MaterialType[]; // 所需材料类型标签
  materialRequirements: string; // 所需材料类型与数量要求
  materialFormat: string; // 材料格式要求
  needsExternalData: boolean; // 是否需外部数据
  externalDataSources: string; // 外部数据源
  dataSourceExplanation: string; // 数据来源说明
  scoringMethod: ScoringMethod; // 评分方式
  scoringCriteria: string; // 评分标准/达标要求总述
  scoringTiers: ScoringTier[]; // 各档标准
  filingInstructions: string; // 填报说明
  commonQuestions: FAQItem[]; // 常见问题
  example: string; // 填写示例
  tag?: string; // 特殊标记 如 关键破局点
}

// ---------- 维度定义 ----------
export interface Dimension {
  key: DimensionKey;
  name: string;
  weight: number;
  color: string;
  bg: string;
  border: string;
  subCategories: { id: string; name: string }[];
}

export const dimensions: Dimension[] = [
  {
    key: 'A',
    name: '课程与需求适配性',
    weight: 30,
    color: '#1677ff',
    bg: '#eff6ff',
    border: '#bfdbfe',
    subCategories: [
      { id: '1.1', name: '产业导向' },
      { id: '1.2', name: '课程时效与贯通' },
      { id: '1.3', name: '前瞻视野与能力重构' },
    ],
  },
  {
    key: 'B',
    name: '教学实施有效性',
    weight: 30,
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    subCategories: [
      { id: '2.1', name: '教师能力' },
      { id: '2.2', name: '教学投入深度' },
      { id: '2.3', name: '学生学习与考核' },
    ],
  },
  {
    key: 'C',
    name: '运行保障支撑度',
    weight: 20,
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    subCategories: [{ id: '3.1', name: '资源与平台' }],
  },
  {
    key: 'D',
    name: '产出与贡献',
    weight: 20,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    subCategories: [{ id: '4.1', name: '就业与影响' }],
  },
];

// ---------- 17 项指标 ----------
export const indicators: Indicator[] = [
  {
    id: '1.1.1',
    name: '产业深度解析',
    dimension: 'A',
    subCategoryId: '1.1',
    subCategoryName: '产业导向',
    hierarchy: '三级',
    weight: 5,
    oneLineSummary: '梳理专业服务的产业链图谱与关键岗位清单，形成产业白皮书。',
    definition:
      '对专业所服务的产业进行深度解析，形成产业白皮书，包含三个模块：① 产业生命周期判定（成长/成熟/转型期）② 产业链图谱（上中下游节点与企业清单）③ 关键岗位清单（岗位名称、能力要求、薪资水平）。该指标是后续课程对接产业链的基础前置数据。',
    materialTypes: ['专业信息', '产业调研材料'],
    materialRequirements: '1 份产业白皮书（覆盖三模块），建议每 2 年更新一次；可附已有产业调研材料、校企合作清单、区域产业规划文件作为参考。',
    materialFormat: '平台模板在线填写（结构化字段）；附件可上传 Word/PDF/Excel。',
    needsExternalData: true,
    externalDataSources: '政府统计年鉴（stats.gov.cn）、行业协会官网、巨潮资讯网（上市企业年报）、招聘网站公开数据（猎聘/智联等）、产业研报。',
    dataSourceExplanation:
      '教师填写专业名称和服务产业方向后，AI 搜索公开数据起草白皮书初稿。教师需补充本地产业链特点（AI 搜到的是全国数据，学校可能服务区域产业）和校企合作企业信息。',
    scoringMethod: '混合评价',
    scoringCriteria: '三模块完整性 + 岗位清单结构化程度 + 白皮书时效性 + 区域企业认可度。',
    scoringTiers: [
      { tier: '合格', criteria: '完成 1 份白皮书，覆盖核心产业方向，三模块齐全。' },
      { tier: '良好', criteria: '覆盖所有服务产业方向，每 2 年更新，岗位清单含结构化字段。' },
      { tier: '优秀', criteria: '获区域头部企业认可引用，产业预判准确率 ≥ 70%。' },
    ],
    filingInstructions:
      '这是起点数据，不需要上传已有文件。教师在平台模板内直接填写专业名称和服务产业方向，AI 起草白皮书初稿后逐模块审核：确认生命周期判断、补充本地产业链特点、确认岗位清单覆盖核心岗位、补充校企合作企业信息。',
    commonQuestions: [
      { q: 'AI 搜到的产业数据不准怎么办？', a: 'AI 搜到的是全国公开数据，教师必须补充学校所在区域的本地产业链特点，修正生命周期判断。' },
      { q: '白皮书多久更新一次？', a: '建议每 2 年更新。超过 2 年未更新会被标记为过期。' },
    ],
    example: '示例：某机器人技术专业 → 白皮书三模块：① 工业机器人产业处于成长期 ② 上游减速器/控制器，中游本体制造，下游系统集成 ③ 关键岗位：调试工程师/运维工程师/系统集成项目经理。',
    tag: '起点指标',
  },
  {
    id: '1.1.2',
    name: '课程-产业链对应性',
    dimension: 'A',
    subCategoryId: '1.1',
    subCategoryName: '产业导向',
    hierarchy: '三级',
    weight: 4,
    oneLineSummary: '核心课程与产业链节点建立映射关系，衡量课程覆盖产业链的程度。',
    definition:
      '将核心课程与 1.1.1 产业白皮书中的产业链节点建立对应关系，生成"课程-产业链映射矩阵"，衡量核心课程覆盖产业链各节点的能力。该指标依赖 1.1.1 白皮书数据。',
    materialTypes: ['课程列表'],
    materialRequirements: '教务系统导出的课程列表 Excel 1 份（课程名称、课程类型、学分、学时、开课学期）。',
    materialFormat: 'Excel（.xlsx），字段：课程名称、课程类型（核心/非核心）、学分、学时、开课学期。',
    needsExternalData: false,
    externalDataSources: '不需要，依赖 1.1.1 白皮书内部数据。',
    dataSourceExplanation:
      '上传课程列表后，AI 从 1.1.1 白皮书提取产业链节点，用关键词+语义匹配把每门核心课自动配对到节点，生成映射矩阵草稿。',
    scoringMethod: '定量评分',
    scoringCriteria: '有对应产业链节点的核心课程数 / 核心课程总数 = 覆盖率。',
    scoringTiers: [
      { tier: '合格', criteria: '覆盖率 ≥ 60%。' },
      { tier: '良好', criteria: '覆盖率 ≥ 85%。' },
      { tier: '优秀', criteria: '覆盖率 ≥ 95% 且有动态更新记录。' },
    ],
    filingInstructions:
      '从教务系统"课程设置"或"教学计划"表导出课程列表 Excel 上传即可。AI 自动生成映射矩阵草稿后，教师逐门核心课程查看配对是否正确，修正错误配对，给没配上节点的课程手动指定或标注"不直接对应"。',
    commonQuestions: [
      { q: 'AI 匹配错了怎么办？', a: '关键词匹配会有误配，教师必须逐门课确认。修正后的矩阵作为正式证据。' },
      { q: '不是所有课程都对应产业链节点吧？', a: '正确。可标注"该课程不直接对应产业链节点"，如公共基础课。' },
    ],
    example: '示例：课程"机器人控制技术" → 匹配产业链中游"运动控制系统"节点；课程"高等数学" → 标注"不直接对应"。',
  },
  {
    id: '1.1.3',
    name: '课程目标与岗位能力匹配',
    dimension: 'A',
    subCategoryId: '1.1',
    subCategoryName: '产业导向',
    hierarchy: '三级',
    weight: 3,
    oneLineSummary: '课程目标追溯到白皮书中的岗位能力项，建立目标-能力对应关系。',
    definition:
      '从课程大纲中提取每条课程目标，与 1.1.1 白皮书的岗位能力清单做语义匹配，在大纲"目标来源"字段标注每条目标对应的岗位能力编号，实现课程目标可追溯到岗位需求。',
    materialTypes: ['课程大纲文档'],
    materialRequirements: '各核心课程的课程大纲文档（每门 1 份）。',
    materialFormat: 'Word/PDF；如有大纲管理系统可直接导出。大纲需包含"课程目标"条目。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation: '上传课程大纲后，AI 用 NLP 提取课程目标，从 1.1.1 白皮书提取岗位能力项，语义匹配后在大纲"目标来源"字段填入建议岗位能力编号。',
    scoringMethod: '定量评分',
    scoringCriteria: '有来源标注的课程目标数 / 总目标数 = 覆盖率；大纲修订时间须在白皮书更新之后（时间戳校验）。',
    scoringTiers: [
      { tier: '合格', criteria: '60% 以上课程目标标注来源。' },
      { tier: '良好', criteria: '覆盖率 ≥ 85%，匹配度 ≥ 70%。' },
      { tier: '优秀', criteria: '覆盖率 ≥ 95%，匹配度 ≥ 85%。' },
    ],
    filingInstructions: '上传各核心课程的大纲文档。AI 自动提取目标并配对后，教师查看配对是否正确，修正错误，给没配上能力的课程目标手动指定来源。',
    commonQuestions: [
      { q: '什么是"目标来源"字段？', a: '大纲中标注每条课程目标对应的岗位能力编号，使目标可追溯到岗位需求。' },
    ],
    example: '示例：课程目标"掌握 PLC 编程" → 目标来源标注岗位能力编号"HC-03 自动化设备编程调试"。',
  },
  {
    id: '1.2.1',
    name: '行业前沿课比例 + 教材时效',
    dimension: 'A',
    subCategoryId: '1.2',
    subCategoryName: '课程时效与贯通',
    hierarchy: '三级',
    weight: 5,
    oneLineSummary: '核心课程是否引入验证通过的前沿技术来源，教材是否在近 3 年出版。',
    definition:
      '衡量核心课程引入行业前沿技术的程度（通过验证的论文 DOI/专利号/标准号）以及教材时效性（出版年份距今 ≤ 3 年）。前沿技术来源须经外部数据库验证真实性。',
    materialTypes: ['课程大纲', '教材ISBN清单'],
    materialRequirements: '① 课程大纲文档（需标注前沿技术来源：论文 DOI / 专利号 / 标准编号）② 教务系统导出的教材使用清单 Excel 1 份。',
    materialFormat: '大纲 Word/PDF；教材清单 Excel（字段：课程名称、教材名称、ISBN）。',
    needsExternalData: true,
    externalDataSources: 'Crossref API（论文 DOI）、国家知识产权局专利检索系统（专利号）、国家标准网 openstd.samr.gov.cn（标准号）、新闻出版总署 ISBN 查询系统（教材）。',
    dataSourceExplanation:
      'AI 自动搜索相关最新论文/专利/标准建议给教师；拿教师填的编号去外部数据库验证真实性；拿教材 ISBN 查询出版年份。验证失败（编号不存在、标准已废止）标记为无效，不计入前沿课。',
    scoringMethod: '定量评分',
    scoringCriteria: '① 前沿课比例 = 有验证通过前沿来源的课程数 / 总核心课程数 ② 近 3 年教材比例 = 出版年份距今 ≤ 3 年的教材数 / 总教材数。',
    scoringTiers: [
      { tier: '合格', criteria: '前沿课 ≥ 20%，近 3 年教材 ≥ 50%。' },
      { tier: '良好', criteria: '前沿课 ≥ 40%，近 3 年教材 ≥ 70%。' },
      { tier: '优秀', criteria: '前沿课 ≥ 60%，近 3 年教材 ≥ 85%。' },
    ],
    filingInstructions:
      '教师在课程大纲中填写前沿技术来源（DOI/专利号/标准号），上传大纲和教材清单。如果 AI 验证发现编号无效，需更正或补充新来源。确认教材名和 ISBN 对得上。',
    commonQuestions: [
      { q: '编号验证失败怎么办？', a: '需更正编号或补充新的来源。验证失败的编号不计入"前沿课"。' },
      { q: '教材 ISBN 在哪查？', a: '教材封底条码下方，或教务系统教材订购记录。' },
    ],
    example: '示例：课程"机器视觉技术" → 前沿来源标注论文 DOI: 10.1109/xxx.2024.xxx（Crossref 验证通过）；教材 ISBN 978-7-xxx-2023（出版年份 2023，距今 ≤ 3 年）。',
  },
  {
    id: '1.2.2',
    name: '综合验证课程设计',
    dimension: 'A',
    subCategoryId: '1.2',
    subCategoryName: '课程时效与贯通',
    hierarchy: '三级',
    weight: 3,
    oneLineSummary: '每学年开设综合验证课（课程设计/实训/项目实践），覆盖基础→进阶→综合→实战递进。',
    definition:
      '识别培养方案中的综合验证课程（课程设计、综合实训、项目实践、毕业设计等），判断递进阶段（基础→进阶→综合→实战）是否完整覆盖，衡量实践教学体系设计的合理性。',
    materialTypes: ['培养方案', '教学计划'],
    materialRequirements: '培养方案文档 1 份 或 教务系统导出的教学计划表 Excel 1 份。',
    materialFormat: 'Word/PDF（培养方案）或 Excel（教学计划表，含课程名称、类型、学分、开课学期）。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation: 'AI 扫描培养方案/教学计划，根据课程类型和名称模式识别综合验证课，根据前置课程信息推断递进阶段。',
    scoringMethod: '定量评分',
    scoringCriteria: '① 每学年 ≥ 1 门综合验证课 ② 全周期 ≥ 3 门 ③ 递进阶段覆盖基础→进阶→综合→实战。',
    scoringTiers: [
      { tier: '合格', criteria: '≥ 2 门，覆盖 2 个学年。' },
      { tier: '良好', criteria: '≥ 3 门，覆盖全部学年。' },
      { tier: '优秀', criteria: '≥ 4 门，有企业真实项目。' },
    ],
    filingInstructions: '上传培养方案或教学计划表。AI 识别后，教师确认识别出的课程确实是综合验证课（有些课名带"实践"但不一定是），补充 AI 漏识别的课程，确认递进阶段标注。',
    commonQuestions: [
      { q: '哪些课算"综合验证课"？', a: '课程设计、综合实训、项目实践、毕业设计等含综合性实践环节的课程。' },
    ],
    example: '示例：大一"电子实训"(基础) → 大二"课程设计"(进阶) → 大三"综合实训"(综合) → 大四"毕业设计"(实战)。',
  },
  {
    id: '1.2.3',
    name: '毕业设计',
    dimension: 'A',
    subCategoryId: '1.2',
    subCategoryName: '课程时效与贯通',
    hierarchy: '三级',
    weight: 4,
    oneLineSummary: '毕业设计选题是否来自企业真实项目，企业导师是否参与指导并验收。',
    definition:
      '衡量毕业设计选题的真实性和企业参与度。选题来源需可追溯到企业项目或横向课题，有企业导师指导记录和企业验收签章，实现"真题真做"。',
    materialTypes: ['选题清单', '企业导师指导记录', '验收签章'],
    materialRequirements: '① 选题清单 Excel 1 份 ② 企业导师指导记录（文档/截图）③ 企业验收签章文件（电子签章截图/扫描件）。',
    materialFormat: '选题清单 Excel（学生姓名、选题名称、指导教师、选题来源）；签章文件 图片/PDF。',
    needsExternalData: false,
    externalDataSources: '不需要外部数据，但需学校提供企业合同编号以便交叉验证选题来源真实性。',
    dataSourceExplanation:
      'AI 拿选题清单后，选题来源标记为"企业"的在横向课题库匹配项目名称验证；标记"科研"的匹配纵向/横向课题记录；自动标注真题真做、企业导师参与率、验收覆盖率。',
    scoringMethod: '定量评分',
    scoringCriteria: '① 真题真做比例 = 可追溯企业项目/横向课题的选题数 / 总选题数 ② 企业导师参与率 ③ 企业验收覆盖率。',
    scoringTiers: [
      { tier: '合格', criteria: '真题真做 ≥ 40%。' },
      { tier: '良好', criteria: '真题真做 ≥ 70%。' },
      { tier: '优秀', criteria: '真题真做 ≥ 90% 且成果被企业采纳 ≥ 30%。' },
    ],
    filingInstructions:
      '从毕业设计管理系统导出选题清单上传，上传企业导师指导记录和验收签章。AI 标注后，教师确认"真题真做"判定准确，上传缺失材料，更正来源标记错误的选题。',
    commonQuestions: [
      { q: '选题来源标"自拟"但实际来自企业怎么办？', a: '需手动更正为"企业"来源，并提供企业合同编号交叉验证。' },
    ],
    example: '示例：选题"XX企业产线视觉检测系统" → 选题来源标"企业" → AI 在横向课题库匹配到项目编号 HY-2024-001 → 标注"真题真做"。',
  },
  {
    id: '1.3.1',
    name: '国际标准对标 + AI 能力融入',
    dimension: 'A',
    subCategoryId: '1.3',
    subCategoryName: '前瞻视野与能力重构',
    hierarchy: '三级',
    weight: 6,
    oneLineSummary: '课程是否对标国际标准（ABET/CDIO），是否融入 AI 三维能力训练。',
    definition:
      '衡量核心课程对标国际工程教育标准（ABET、CDIO、华盛顿协议等）的程度，以及课程是否融入 AI 三维能力训练：① 提问能力 ② 信息判断 ③ 意义创造。不接受"参照国际标准"等模糊表述，须有具体标准编号。',
    materialTypes: ['专业建设方案', '课程大纲'],
    materialRequirements: '① 专业建设方案文档 1 份（列出参考的国际标准名称和编号）② 课程大纲文档。',
    materialFormat: 'Word/PDF。专业建设方案须包含国际标准名称和编号；课程大纲须包含课程目标内容。',
    needsExternalData: true,
    externalDataSources: '可查 ABET 官网、CDIO 官网验证标准编号是否真实存在（很多标准编号格式固定，格式校验即可，不一定需调外部 API）。',
    dataSourceExplanation:
      'AI 扫描专业建设方案提取标准名称和编号，检测课程大纲是否引用标准具体条款，分析大纲文本检测 AI 三维能力覆盖（出现"讨论""探究""信息甄别""创造""设计"等关键词）。',
    scoringMethod: '混合评价',
    scoringCriteria: '① 有具体标准编号的核心课程数 / 总核心课程数 ② 覆盖 AI 三维能力的课程比例。',
    scoringTiers: [
      { tier: '合格', criteria: '≥ 1 门借鉴国际标准 + 30% 课程覆盖 AI ≥ 1 维度。' },
      { tier: '良好', criteria: '50% 借鉴 + 60% 覆盖 2 维度。' },
      { tier: '优秀', criteria: '80% 借鉴 + 80% 覆盖 3 维度。' },
    ],
    filingInstructions: '上传专业建设方案和课程大纲。AI 提取标准编号和分析三维能力后，教师确认编号准确，修正 AI 对三维能力的自动勾选（可能误判关键词含义），补充 AI 漏掉的内容。',
    commonQuestions: [
      { q: '"参照国际标准"算数吗？', a: '不算。必须有具体的国际标准名称和编号（如 ABET EAC 2024-2025）。' },
      { q: 'AI 三维能力怎么检测？', a: 'AI 通过大纲文本关键词检测：提问能力("讨论""探究")、信息判断("信息甄别""多源比对")、意义创造("创造""设计""构建")。' },
    ],
    example: '示例：课程"控制系统工程" → 对标 ABET EAC Standard 2024 → AI 三维能力勾选：提问能力✓ 信息判断✓ 意义创造✓（覆盖 3 维度）。',
  },
  {
    id: '2.1.1',
    name: '横向科研转化',
    dimension: 'B',
    subCategoryId: '2.1',
    subCategoryName: '教师能力',
    hierarchy: '三级',
    weight: 6,
    oneLineSummary: '横向课题是否转化为教学案例并引入课程大纲，形成完整转化链条。',
    definition:
      '衡量教师横向科研转化为教学的完整链条：有横向课题 + 课题与核心产业相关 + 有转化案例 + 案例在课程大纲中被引用。该指标是教学实施有效性的关键破局点。',
    materialTypes: ['横向课题清单', '教学案例', '课程大纲'],
    materialRequirements: '① 横向课题清单 Excel 1 份 ② 教师上传的教学案例文档 ③ 课程大纲。',
    materialFormat: '课题清单 Excel（课题名称、企业名称、金额、负责人、起止时间、课题领域关键词）；案例文档 Word/PDF；大纲 Word/PDF。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      'AI 从横向课题清单提取领域关键词与 1.1.1 白皮书核心产业方向匹配，判断课题是否聚焦核心产业链；在教学案例库搜索教师署名案例；在课程大纲搜索案例引用。',
    scoringMethod: '定量评分',
    scoringCriteria: '有横向课题 + 课题与核心产业相关 + 有转化案例 + 案例在课程大纲中被引用 = 完整转化链条。相关教师数 / 专业教师总数。',
    scoringTiers: [
      { tier: '合格', criteria: '相关教师比例 ≥ 20%。' },
      { tier: '良好', criteria: '相关教师比例 ≥ 40%。' },
      { tier: '优秀', criteria: '相关教师比例 ≥ 60%。' },
    ],
    filingInstructions:
      '上传横向课题清单、教学案例文档和课程大纲。AI 匹配后，教师确认"课题与核心产业相关"判断准确，补充 AI 没搜到的教学案例，确认案例确实用在课程教学中。有课题无转化的教师会被提示"有课题无转化"。',
    commonQuestions: [
      { q: '有横向课题但没转化为教学案例怎么办？', a: '系统会提示"有课题无转化"，建议教师将课题成果整理为教学案例并引入大纲。' },
    ],
    example: '示例：教师张某 → 横向课题"XX企业视觉检测系统"(与核心产业相关) → 转化案例"视觉检测教学案例" → 大纲引用 ✓ = 完整转化链条。',
    tag: '关键破局点',
  },
  {
    id: '2.1.2',
    name: 'AI 时代教师能力',
    dimension: 'B',
    subCategoryId: '2.1',
    subCategoryName: '教师能力',
    hierarchy: '三级',
    weight: 4,
    oneLineSummary: '教师是否在课程中融入 AI 相关修改，是否有 AI 平台使用和培训产出。',
    definition:
      '衡量教师在 AI 时代的能力提升：① 课程大纲是否有 AI 相关内容的新增或修改 ② 是否有 AI 教学平台使用记录 ③ 是否完成 AI 培训并有实际产出物。',
    materialTypes: ['课程大纲', 'AI平台日志', '教案', '培训记录', '产出物'],
    materialRequirements:
      '① 课程大纲多个版本（≥ 2 学期）② AI 教学平台教师使用日志 Excel ③ 教案文档（含学生产出物要求）④ AI 培训完成记录 Excel ⑤ AI 应用产出物（课程改造方案、智能助手配置、知识图谱等）。',
    materialFormat: '大纲 Word/PDF 多版本；日志/培训记录 Excel；教案 Word/PDF；产出物文档/配置文件。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      'AI 对比新旧版课程大纲提取差异，检测 AI 相关内容新增/修改（"AI""智能""人机协同"等关键词）；统计 AI 平台登录次数和功能类型；检查教案产出物要求；统计培训完成比例。',
    scoringMethod: '定量评分',
    scoringCriteria: '① 有 AI 相关修改的课程数 / 总课程数 ② 有 AI 平台使用记录的教师数 / 总教师数 ③ 完成培训且有实际产出的教师数 / 总教师数。',
    scoringTiers: [
      { tier: '合格', criteria: '30% 课程有 AI 调整 + 30% 教师有 AI 产出。' },
      { tier: '良好', criteria: '60% 课程有 AI 调整 + 60% 教师有 AI 产出。' },
      { tier: '优秀', criteria: '90% 课程有 AI 调整 + 90% 教师有 AI 产出。' },
    ],
    filingInstructions:
      '上传大纲多版本、AI 平台日志、教案、培训记录和产出物。AI 分析后，教师确认版本 diff 标记的"AI 相关修改"准确（可能误标），确认教案有产出物要求，上传缺失的 AI 产出物。',
    commonQuestions: [
      { q: '大纲在平台内写的，版本历史怎么上传？', a: '平台内编写的大纲自动保存版本历史，无需手动上传。上传的文档需至少两个学期版本。' },
    ],
    example: '示例：教师李某 → 大纲 v2 新增"人机协同编程"章节(AI修改✓) → AI 平台登录 15 次 → 培训完成 → 产出物：智能助手配置 1 份 = 完整达标。',
  },
  {
    id: '2.2.1',
    name: '教学投入深度',
    dimension: 'B',
    subCategoryId: '2.2',
    subCategoryName: '教学投入深度',
    hierarchy: '三级',
    weight: 8,
    oneLineSummary: '教师"传道授业解惑"三维投入：职业指引、课程依赖、问答响应与纳入修订。',
    definition:
      '从"传道、授业、解惑"三个维度衡量教师教学投入深度：① 传道：职业指引帖文+学习计划提交率 ② 授业：课程依赖矩阵完整性 ③ 解惑：问答响应率+学生问题纳入教案修订。',
    materialTypes: ['课程平台互动数据', '培养方案'],
    materialRequirements: '① 课程平台导出的互动数据 Excel 1 份 ② 培养方案（用于课程依赖矩阵）。',
    materialFormat: '互动数据 Excel（教师帖文/公告、学生学习计划/职业锚点、问答区提问和回复）；培养方案 Word/PDF 或 Excel。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      'AI 扫描教师帖文检测职业指引内容，统计学习计划提交率；从培养方案提取课程依赖关系校验矩阵完整性；统计问答响应率（回复/提问）；对比新旧版大纲检测学生问题是否纳入修订。',
    scoringMethod: '混合评价',
    scoringCriteria: '① 是否有职业指引内容 ② 学习计划提交率 ③ 课程依赖矩阵完整性 ④ 问答响应率 = 回复数/提问数 ⑤ 学生问题纳入修订次数。',
    scoringTiers: [
      { tier: '合格', criteria: '有传道+授业+解惑，回复率 ≥ 50%。' },
      { tier: '良好', criteria: '100% 有传道+回复率 ≥ 80%。' },
      { tier: '优秀', criteria: '个性化传道+回复率 ≥ 95%。' },
    ],
    filingInstructions:
      '上传课程平台互动数据和培养方案。AI 分析后，教师确认"职业指引帖文"标记准确（有些帖文是通知不是指引），确认课程依赖矩阵合理。学生提问纳入修订但 AI 没检测到的（语义改写），教师手动标注。',
    commonQuestions: [
      { q: '什么是"传道"？', a: '教师在课程平台发布的职业指引、行业前景、方向引导类帖文，区别于普通通知。' },
    ],
    example: '示例：教师王某 → 帖文"智能制造行业职业路径" (传道✓) → 课程依赖矩阵完整(授业✓) → 提问 20 次/回复 18 次(解惑 响应率 90%) → 学生问题 3 条纳入新大纲。',
  },
  {
    id: '2.3.1',
    name: '学习行为数据',
    dimension: 'B',
    subCategoryId: '2.3',
    subCategoryName: '学生学习与考核',
    hierarchy: '三级',
    weight: 6,
    oneLineSummary: '出勤率、作业提交率、资源访问频次、平台活跃度四项客观数据统计。',
    definition:
      '从课程平台行为日志直接统计四项数值：① 出勤率 ② 作业提交率 ③ 资源访问频次 ④ 平台活跃度。同时做异常检测（数据不合逻辑、模式可疑、跨数据矛盾），异常数据标记"存疑"不参与评分。',
    materialTypes: ['课程平台行为日志'],
    materialRequirements: '课程平台导出的行为日志 Excel 1 份。',
    materialFormat: 'Excel（出勤打卡、作业提交、资源访问、平台登录日志，含时间戳）。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      '不需要 AI 预填，直接统计四项数值。异常检测：出勤率 > 100%、提交次数异常高、每周精确不变（疑似手动填报）、批量提交时间、跨数据矛盾（选课 60 人但仅 5 人有登录记录）。',
    scoringMethod: '定量评分',
    scoringCriteria: '直接算四个数值（出勤率、作业提交率、资源访问频次、平台活跃度）。',
    scoringTiers: [
      { tier: '合格', criteria: '出勤 ≥ 85%，作业提交 ≥ 80%。' },
      { tier: '良好', criteria: '出勤 ≥ 90%，作业 ≥ 90%。' },
      { tier: '优秀', criteria: '四个维度都接入且呈上升趋势。' },
    ],
    filingInstructions: '从课程平台导出行为日志 Excel 上传即可，不需要教师确认。管理员需检查异常标记，数据确实异常需说明原因。',
    commonQuestions: [
      { q: '数据被标记"存疑"怎么办？', a: '管理员需检查原因：系统数据不同步、平台没人用、或手动填报。说明原因后可申请复核。' },
    ],
    example: '示例：某课程 → 出勤率 92%、作业提交率 88%、平均每周访问 3.2 次、平均每周登录 5 次 × 2.1 小时 → 良好档。',
  },
  {
    id: '2.3.2',
    name: '考核与达成度闭环',
    dimension: 'B',
    subCategoryId: '2.3',
    subCategoryName: '学生学习与考核',
    hierarchy: '三级',
    weight: 6,
    oneLineSummary: '课程目标-考核任务映射覆盖率、反馈时间、达成度报告、改进措施落实闭环。',
    definition:
      '衡量课程考核的闭环管理：① 课程目标-考核任务映射矩阵覆盖率 ② 考核种类数 ③ 反馈时间差 ④ 达成度报告三字段完整性（得分/薄弱环节/改进措施）⑤ 闭环率（改进措施在新版大纲中可验证落实的比例）。',
    materialTypes: ['课程目标列表', '考核任务列表', '达成度报告', '课程大纲'],
    materialRequirements: '① 课程目标列表和考核任务列表 Excel 1 份 ② 教师填写的达成度报告 ③ 下一轮课程大纲（用于版本对比）。',
    materialFormat: '目标/考核列表 Excel（课程目标条目、考核任务名称、关联目标、提交时间、反馈时间）；达成度报告 平台填写；大纲 Word/PDF。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      'AI 构建目标-考核映射矩阵并算覆盖率，统计考核种类，计算反馈时间差，对比达成度改进措施与新版大纲检测闭环落实率（语义匹配+关键词检测）。',
    scoringMethod: '混合评价',
    scoringCriteria: '① 映射覆盖率 ② 考核种类数（≥ 3 种合格）③ 反馈时间差（≤ 7 天合格）④ 达成度报告三字段完整性 ⑤ 闭环率。',
    scoringTiers: [
      { tier: '合格', criteria: '映射 ≥ 70%，考核 ≥ 3 种，达成度完整率 ≥ 60%。' },
      { tier: '良好', criteria: '映射 ≥ 90%，考核 ≥ 4 种，达成度 ≥ 80%，闭环 ≥ 70%。' },
      { tier: '优秀', criteria: '映射 100%，考核 ≥ 5 种，AI 辅助，闭环 ≥ 90%。' },
    ],
    filingInstructions:
      '上传目标列表和考核任务列表，填写达成度报告三字段（教师必做，AI 不能替代），上传下一版大纲。AI 构建映射后，教师确认映射准确（一个考核任务可对应多个目标），确认改进措施已落实。',
    commonQuestions: [
      { q: '达成度报告三字段是什么？', a: '每个课程目标的：得分、薄弱环节说明、改进措施。三字段必须都填。' },
      { q: '闭环率怎么算？', a: 'AI 对比达成度报告"改进措施"与新版大纲，检测改进措施是否在新版中体现（语义匹配+关键词检测）。' },
    ],
    example: '示例：课程目标 5 条 → 考核任务 4 种(考试/报告/项目/展示) → 映射覆盖率 100% → 反馈 5 天 → 三字段齐全 → 改进措施 3 条均在新版落实(闭环 100%) → 优秀档。',
  },
  {
    id: '3.1.1',
    name: '资源对教学的有效支撑',
    dimension: 'C',
    subCategoryId: '3.1',
    subCategoryName: '资源与平台',
    hierarchy: '三级',
    weight: 10,
    oneLineSummary: '实验开出率、设备完好率、课程支撑率三项数值。',
    definition:
      '衡量教学资源对课程的有效支撑程度：① 实验开出率 = 实际开出实验数 / 培养方案要求 ② 设备完好率 = 正常设备数 / 总设备数 ③ 课程支撑率 = 有对应设备的实验数 / 需设备的实验数。同时做异常检测。',
    materialTypes: ['设备台账', '实验开出记录', 'AI平台建设说明', 'AI平台课程接入清单'],
    materialRequirements: '① 设备台账 Excel 1 份 ② 实验开出记录 Excel 1 份 ③ AI 教学平台建设说明文档+课程接入清单。',
    materialFormat: '设备台账 Excel（设备名称、编号、数量、购入日期、状态、所属实验室）；实验记录 Excel（实验名称、所属课程、开出时间、使用设备、使用时长）。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      'AI 自动计算三项数值。异常检测：设备台账有 50 台但实验使用记录为 0（设备闲置）；某实验标记"已开出"但无设备使用记录（虚报）；设备购入超 10 年仍标"正常"（数据未更新）。',
    scoringMethod: '定量评分',
    scoringCriteria: '实验开出率 + 设备完好率 + 课程支撑率。',
    scoringTiers: [
      { tier: '合格', criteria: '开出率 ≥ 80%，完好率 ≥ 85%。' },
      { tier: '良好', criteria: '开出率 ≥ 90%，完好率 ≥ 95%，支撑率 ≥ 80%。' },
      { tier: '优秀', criteria: '开出率 ≥ 95%，完好率 ≥ 98%，支撑率 ≥ 95%。' },
    ],
    filingInstructions: '从资产管理系统导出设备台账，从实验管理系统导出实验开出记录，上传 AI 平台建设说明和课程接入清单。管理员确认数据准确，特别是设备状态和实验开出记录真实。',
    commonQuestions: [
      { q: '设备被标记"闲置"怎么办？', a: '管理员需说明设备闲置原因（报废流程未完成/新购未验收/确实闲置），并给出处理计划。' },
    ],
    example: '示例：培养方案要求开出 20 个实验 → 实际开出 18 个(90%) → 设备 100 台/正常 96 台(96%) → 需设备实验 18 个/有对应设备 16 个(89%) → 良好档。',
  },
  {
    id: '3.1.2',
    name: '企业真实项目驱动率',
    dimension: 'C',
    subCategoryId: '3.1',
    subCategoryName: '资源与平台',
    hierarchy: '三级',
    weight: 10,
    oneLineSummary: '核心课程教学环节中来自企业真实项目的比例（有合同+签章+指导）。',
    definition:
      '衡量核心课程教学环节中企业真实项目的驱动率。真实项目需同时满足：有合同编号验证 + 有交付物签章 + 有企业人员指导。真实项目教学环节数 / 核心课程总教学环节数。',
    materialTypes: ['教学环节清单', '企业合作合同清单', '企业验收签章文件'],
    materialRequirements: '① 教学环节清单 Excel 1 份 ② 企业合作合同清单 Excel 1 份 ③ 企业验收签章文件。',
    materialFormat: '教学环节 Excel（课程、环节名称、项目来源标记、项目编号）；合同 Excel（合同编号、企业名称、合作内容、金额、期限）；签章图片/PDF。',
    needsExternalData: true,
    externalDataSources: '可查国家企业信用信息公示系统核实企业真实性。',
    dataSourceExplanation:
      'AI 逐环节检查项目来源标记，"企业项目"用项目编号在合同清单查询验证合同真实性，检查企业验收签章，计算有合同+签章+企业指导的教学环节比例。',
    scoringMethod: '定量评分',
    scoringCriteria: '有合同编号 + 有交付物签章 + 有企业人员指导 = 真实项目。真实项目教学环节数 / 核心课程总教学环节数。',
    scoringTiers: [
      { tier: '合格', criteria: '≥ 30%。' },
      { tier: '良好', criteria: '≥ 60% 且有完整合同+签章。' },
      { tier: '优秀', criteria: '≥ 80% 覆盖所有核心课程。' },
    ],
    filingInstructions:
      '上传教学环节清单、合同清单和签章文件。AI 验证后，教师确认教学环节用的确实是企业真实项目，上传缺失的合同编号或签章文件，确认企业人员参与指导。',
    commonQuestions: [
      { q: '没有企业合同只有合作协议算吗？', a: '不算。必须有合同编号可查证，且有交付物签章和企业人员指导记录。' },
    ],
    example: '示例：核心课程 5 门共 10 个教学环节 → 标记"企业项目" 8 个 → 合同验证通过 7 个 → 有签章 6 个 → 有企业指导 6 个 → 真实项目 6 个 = 60% → 良好档。',
  },
  {
    id: '4.1.1',
    name: '行业就业率',
    dimension: 'D',
    subCategoryId: '4.1',
    subCategoryName: '就业与影响',
    hierarchy: '三级',
    weight: 8,
    oneLineSummary: '毕业生岗位匹配产业白皮书方向的对口就业率。',
    definition:
      '衡量毕业生在产业白皮书对口行业就业的比例。AI 从 1.1.1 白皮书提取核心产业方向和关键岗位关键词，把毕业生岗位+单位与白皮书关键词匹配，判断是否对口就业。',
    materialTypes: ['毕业生就业数据'],
    materialRequirements: '就业指导中心导出的毕业生就业数据 Excel 1 份。',
    materialFormat: 'Excel（学生姓名、专业、就业单位名称、岗位名称、就业类型）。',
    needsExternalData: true,
    externalDataSources: '可查国家企业信用信息公示系统获取毕业生就业单位的行业分类信息，辅助判断是否对口。',
    dataSourceExplanation:
      'AI 从 1.1.1 白皮书提取核心产业方向和关键岗位关键词，把每个毕业生岗位+单位与白皮书关键词匹配，判断是否对口就业，计算对口就业率。',
    scoringMethod: '定量评分',
    scoringCriteria: '对口就业率 = 岗位匹配产业白皮书方向的毕业生数 / 总就业人数。',
    scoringTiers: [
      { tier: '合格', criteria: '≥ 50%。' },
      { tier: '良好', criteria: '≥ 70%。' },
      { tier: '优秀', criteria: '≥ 85% 且就业质量高于同类均值。' },
    ],
    filingInstructions: '从就业指导中心导出就业数据 Excel 上传。AI 匹配后，管理员抽查匹配结果准确性（如"销售工程师"是否算对口，边界情况需人工判断），修正后确认。',
    commonQuestions: [
      { q: '"销售工程师"算对口就业吗？', a: '边界情况需管理员人工判断。如果该岗位服务的产品与专业核心产业相关，可算对口；否则不算。' },
    ],
    example: '示例：某机器人专业 100 名毕业生 → 岗位匹配白皮书"调试工程师/运维工程师/系统集成" 78 人 → 对口就业率 78% → 良好档。',
  },
  {
    id: '4.1.2',
    name: '毕业生影响力',
    dimension: 'D',
    subCategoryId: '4.1',
    subCategoryName: '就业与影响',
    hierarchy: '三级',
    weight: 6,
    oneLineSummary: '毕业生中技术骨干/管理岗/创业/高级认证四类人才比例。',
    definition:
      '衡量毕业生在行业内的职业发展影响力。通过关键词匹配校友职位文本，分为四类：技术骨干、管理岗、创业、高级认证。匹配到任一类别的校友数 / 追踪到的校友数。',
    materialTypes: ['校友职业发展数据'],
    materialRequirements: '校友会导出的校友职业发展数据 Excel 1 份（每年更新一次）。',
    materialFormat: 'Excel（校友姓名、毕业年份、当前职位、职称、所在企业、专业认证、创业情况）。',
    needsExternalData: false,
    externalDataSources: '不需要。理论上可查 LinkedIn 交叉验证，但不现实（覆盖率低且数据不可控）。',
    dataSourceExplanation: 'AI 用关键词匹配校友职位文本：技术骨干("核心工程师""主任工程师")、管理岗("项目经理""总监")、创业("创始人""CEO")、高级认证("高级工程师""PMP""注册XX师")。',
    scoringMethod: '定量评分',
    scoringCriteria: '骨干/管理岗/创业/高级认证校友数 / 追踪到的校友数。注：校友追踪覆盖率低于 50% 时标注"数据基础不足"。',
    scoringTiers: [
      { tier: '合格', criteria: '≥ 15%。' },
      { tier: '良好', criteria: '≥ 30%。' },
      { tier: '优秀', criteria: '≥ 45% 且有行业标杆人物。' },
    ],
    filingInstructions: '从校友会导出校友职业发展数据 Excel 上传。AI 匹配后，管理员确认匹配结果合理，说明校友数据覆盖率。',
    commonQuestions: [
      { q: '校友数据覆盖率低怎么办？', a: '覆盖率低于 50% 时标注"数据基础不足"，该指标参考价值有限。建议加强校友系统建设。' },
    ],
    example: '示例：追踪到 200 名校友 → 技术骨干 35 + 管理岗 20 + 创业 8 + 高级认证 12 = 75 人 → 37.5% → 良好档。',
  },
  {
    id: '4.1.3',
    name: '用人单位满意度',
    dimension: 'D',
    subCategoryId: '4.1',
    subCategoryName: '就业与影响',
    hierarchy: '三级',
    weight: 6,
    oneLineSummary: '用人单位对毕业生 5 维度满意度平均分（问卷直达）。',
    definition:
      '通过平台直接向用人单位发送问卷，衡量 5 个维度满意度：专业基础、实践能力、沟通协作、学习能力、职业素养。AI 自动检查样本量、剔除无效问卷、计算平均分。',
    materialTypes: ['用人单位联系人清单'],
    materialRequirements: '不需要上传材料。学校只需提供用人单位联系人清单（企业名称、联系人、联系方式），平台发送问卷链接。',
    materialFormat: '学校提供联系人清单 Excel（企业名称、联系人、联系方式）；问卷由平台直接发送。',
    needsExternalData: false,
    externalDataSources: '不需要。',
    dataSourceExplanation:
      'AI 对回收问卷做自动处理：检查样本量（有效问卷 ≥ 毕业生总数 30%），剔除无效问卷（作答 < 60 秒、全选同一选项），计算 5 维度平均分，多年数据计算趋势。',
    scoringMethod: '定量评分',
    scoringCriteria: '5 维度平均分（专业基础/实践能力/沟通协作/学习能力/职业素养）。',
    scoringTiers: [
      { tier: '合格', criteria: '≥ 3.5/5 分。' },
      { tier: '良好', criteria: '≥ 4.0/5 分。' },
      { tier: '优秀', criteria: '≥ 4.5/5 分且复招率 ≥ 80%。' },
    ],
    filingInstructions: '不需要上传材料。提供用人单位联系人清单后平台自动发送问卷。管理员检查刷票行为（同 IP 多次提交、同一企业多份相同问卷）。',
    commonQuestions: [
      { q: '有效问卷不够 30% 怎么办？', a: '样本量不足则该指标无效，需扩大用人单位覆盖面重新发送问卷。' },
      { q: '怎么判断刷票？', a: 'AI 检测同 IP 多次提交、同一企业多份相同问卷，异常问卷会被剔除。' },
    ],
    example: '示例：毕业生 100 人 → 发送问卷 → 回收有效 35 份(35%) → 5 维度平均分：专业 4.2/实践 4.0/沟通 4.1/学习 4.3/素养 4.4 → 均分 4.2 → 良好档。',
  },
];

// ---------- 工具函数 ----------
export function getIndicatorById(id: string): Indicator | undefined {
  return indicators.find((i) => i.id === id);
}

export function getDimension(key: DimensionKey): Dimension {
  return dimensions.find((d) => d.key === key)!;
}

export function getSubCategoryName(subId: string): string {
  for (const dim of dimensions) {
    const sc = dim.subCategories.find((s) => s.id === subId);
    if (sc) return sc.name;
  }
  return '';
}

// ---------- AI 预填动作映射（按指标） ----------
export interface AIPrefillAction {
  indicatorId: string;
  indicatorName: string;
  actionCount: number;
  actions: string[];
}

export const aiPrefillActions: AIPrefillAction[] = [
  { indicatorId: '1.1.1', indicatorName: '产业深度解析', actionCount: 3, actions: ['产业生命周期判定', '产业链图谱整理', '岗位清单提取'] },
  { indicatorId: '1.1.2', indicatorName: '课程-产业链对应性', actionCount: 1, actions: ['课程-产业链映射矩阵生成'] },
  { indicatorId: '1.1.3', indicatorName: '课程目标匹配', actionCount: 1, actions: ['课程目标-岗位能力匹配'] },
  { indicatorId: '1.2.1', indicatorName: '前沿课比例', actionCount: 3, actions: ['前沿来源建议', '前沿来源验证', '教材ISBN出版年份查询'] },
  { indicatorId: '1.2.2', indicatorName: '综合验证课程', actionCount: 2, actions: ['综合验证课程识别', '递进阶段推断'] },
  { indicatorId: '1.2.3', indicatorName: '毕业设计', actionCount: 3, actions: ['选题来源真实性验证', '真题真做标注', '企业导师/验收签章统计'] },
  { indicatorId: '1.3.1', indicatorName: '国际标准+AI融入', actionCount: 3, actions: ['国际标准编号提取', '标准编号验证', 'AI三维能力覆盖检测'] },
  { indicatorId: '2.1.1', indicatorName: '横向科研转化', actionCount: 3, actions: ['课题与产业方向匹配', '转化案例搜索', '案例引用检测'] },
  { indicatorId: '2.1.2', indicatorName: 'AI时代教师能力', actionCount: 4, actions: ['大纲版本diff检测', 'AI平台使用统计', '教案产出物检查', '培训统计'] },
  { indicatorId: '2.2.1', indicatorName: '教学投入深度', actionCount: 5, actions: ['职业指引帖文识别', '学习计划提交率统计', '课程依赖矩阵校验', '问答响应率计算', '学生问题纳入修订diff检测'] },
  { indicatorId: '2.3.1', indicatorName: '学习行为数据', actionCount: 5, actions: ['出勤率统计', '作业提交率统计', '资源访问频次统计', '平台活跃度统计', '异常检测'] },
  { indicatorId: '2.3.2', indicatorName: '考核与达成度闭环', actionCount: 5, actions: ['目标-考核映射矩阵构建', '映射覆盖率计算', '考核种类统计', '反馈时间差计算', '闭环检测'] },
  { indicatorId: '3.1.1', indicatorName: '资源有效支撑', actionCount: 5, actions: ['实验开出率计算', '设备完好率计算', '课程支撑率计算', 'AI平台核心课程接入率统计', '异常检测'] },
  { indicatorId: '3.1.2', indicatorName: '企业项目驱动率', actionCount: 4, actions: ['项目来源检查', '合同验证', '签章检查', '真实项目比例计算'] },
  { indicatorId: '4.1.1', indicatorName: '行业就业率', actionCount: 2, actions: ['岗位与白皮书信息匹配', '对口就业率计算'] },
  { indicatorId: '4.1.2', indicatorName: '毕业生影响力', actionCount: 2, actions: ['职位关键词匹配', '校友比例计算'] },
  { indicatorId: '4.1.3', indicatorName: '用人单位满意度', actionCount: 3, actions: ['样本量检查', '无效问卷剔除', '5维度平均分计算'] },
];

export function getAIActionsByIndicator(indicatorId: string): AIPrefillAction | undefined {
  return aiPrefillActions.find((a) => a.indicatorId === indicatorId);
}
