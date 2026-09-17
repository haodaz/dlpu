// 产业白皮书生成 — 三步流水线（搜索素材 → 结构化提取 → 图表与正文组装）
// 说明：当前为前端演示实现，网络搜索与大模型提取以确定性模拟数据代替，
// 真实接入时替换 runSearch / extractStructured 两个函数即可，其余结构不变。

export type WhitepaperModuleKey = 'lifecycle' | 'chain' | 'jobs';

export interface SearchMaterial {
  module: WhitepaperModuleKey;
  title: string;
  url: string;
  snippet: string;
}

export interface LifecyclePoint {
  year: string;
  growthRate: number;
}

export interface EnterprisePoint {
  year: string;
  count: number;
}

export interface LifecycleData {
  growthTrend: LifecyclePoint[];
  enterpriseTrend: EnterprisePoint[];
  verdict: '成长期' | '成熟期' | '转型期';
  verdictReason: string;
}

export interface ChainNode {
  level: '上游' | '中游' | '下游';
  nodeName: string;
  description: string;
  companies: string[];
}

export interface ChainData {
  nodes: ChainNode[];
  cr5: number;
  concentrationNote: string;
}

export interface JobItem {
  jobTitle: string;
  demandHeat: number;
  salaryMin: number;
  salaryMax: number;
  skills: string[];
}

export interface JobData {
  jobs: JobItem[];
  skillFrequencies: { skill: string; freq: number }[];
}

export interface WhitepaperResult {
  majorName: string;
  industryName: string;
  region: string;
  generatedAt: string;
  lifecycle: LifecycleData;
  chain: ChainData;
  jobs: JobData;
  sources: string[];
}

export interface WhitepaperInput {
  majorName: string;
  industryName: string;
  region: string;
}

// ---------- Step 1：搜索查询构造 ----------

export function buildSearchQueries(industryName: string, region: string): Record<WhitepaperModuleKey, string[]> {
  return {
    lifecycle: [`${industryName} 产业 市场规模 增长率 ${region}`, `${industryName} 行业 企业数量 变化趋势`],
    chain: [`${industryName} 产业链 上游 中游 下游 企业`, `${industryName} 行业 上市公司 产业链 结构`],
    jobs: [`${industryName} 招聘 岗位 薪资 能力要求`, `${industryName} 关键岗位 人才需求 报告`],
  };
}

interface IndustryProfile {
  keywords: RegExp;
  lifecycle: LifecycleData;
  chain: ChainData;
  jobs: JobData;
}

const PROFILES: IndustryProfile[] = [
  {
    keywords: /机器人|智能制造|自动化|机电|数控/,
    lifecycle: {
      growthTrend: [
        { year: '2021', growthRate: 18.6 },
        { year: '2022', growthRate: 15.2 },
        { year: '2023', growthRate: 21.4 },
        { year: '2024', growthRate: 24.8 },
        { year: '2025', growthRate: 22.1 },
      ],
      enterpriseTrend: [
        { year: '2021', count: 3120 },
        { year: '2022', count: 3680 },
        { year: '2023', count: 4410 },
        { year: '2024', count: 5320 },
        { year: '2025', count: 6180 },
      ],
      verdict: '成长期',
      verdictReason:
        '近五年营收增速维持在 15% 以上且企业数量持续净增，行业尚未出现头部固化，符合成长期特征。',
    },
    chain: {
      nodes: [
        {
          level: '上游',
          nodeName: '核心零部件',
          description: '减速器、伺服电机、控制器等关键部件，占整机成本约 60%。',
          companies: ['绿的谐波', '汇川技术', '双环传动'],
        },
        {
          level: '中游',
          nodeName: '本体制造',
          description: '工业机器人本体组装与整机集成，国产替代加速推进。',
          companies: ['埃斯顿', '新时达', '埃夫特'],
        },
        {
          level: '下游',
          nodeName: '系统集成与应用',
          description: '面向汽车、3C、新能源等场景的产线集成与运维服务。',
          companies: ['拓斯达', '博实股份', '克来机电'],
        },
      ],
      cr5: 42.5,
      concentrationNote: 'CR5 约 42.5%，中游本体集中度高于上游零部件，仍处于竞争性增长格局。',
    },
    jobs: {
      jobs: [
        { jobTitle: '机器人调试工程师', demandHeat: 92, salaryMin: 8, salaryMax: 15, skills: ['PLC', '运动控制', '电气调试'] },
        { jobTitle: '系统集成项目经理', demandHeat: 78, salaryMin: 12, salaryMax: 22, skills: ['方案设计', '项目管理', '客户沟通'] },
        { jobTitle: '机器人运维工程师', demandHeat: 85, salaryMin: 7, salaryMax: 13, skills: ['故障诊断', '预防性维护', '现场服务'] },
        { jobTitle: '视觉算法工程师', demandHeat: 74, salaryMin: 15, salaryMax: 28, skills: ['机器视觉', 'OpenCV', 'Python'] },
        { jobTitle: '电气设计工程师', demandHeat: 69, salaryMin: 9, salaryMax: 16, skills: ['EPLAN', '电气原理', '选型'] },
        { jobTitle: '产线仿真工程师', demandHeat: 61, salaryMin: 10, salaryMax: 18, skills: ['RobotStudio', '离线编程', '仿真'] },
      ],
      skillFrequencies: [
        { skill: 'PLC', freq: 46 },
        { skill: '运动控制', freq: 38 },
        { skill: 'Python', freq: 33 },
        { skill: '机器视觉', freq: 29 },
        { skill: '项目管理', freq: 25 },
        { skill: '电气调试', freq: 24 },
        { skill: '故障诊断', freq: 21 },
        { skill: '方案设计', freq: 18 },
      ],
    },
  },
  {
    keywords: /人工智能|软件|大数据|数字|信息|计算机|网络安全|云计算/,
    lifecycle: {
      growthTrend: [
        { year: '2021', growthRate: 22.4 },
        { year: '2022', growthRate: 18.9 },
        { year: '2023', growthRate: 26.7 },
        { year: '2024', growthRate: 31.2 },
        { year: '2025', growthRate: 28.5 },
      ],
      enterpriseTrend: [
        { year: '2021', count: 5280 },
        { year: '2022', count: 6120 },
        { year: '2023', count: 7460 },
        { year: '2024', count: 9180 },
        { year: '2025', count: 10740 },
      ],
      verdict: '成长期',
      verdictReason:
        '生成式 AI 带动需求高速增长，企业数量两年内接近翻倍，行业处于快速扩张的成长期。',
    },
    chain: {
      nodes: [
        {
          level: '上游',
          nodeName: '算力与基础数据',
          description: '算力芯片、云基础设施与数据标注服务，是模型训练的基础支撑。',
          companies: ['中科曙光', '浪潮信息', '海天瑞声'],
        },
        {
          level: '中游',
          nodeName: '模型与平台',
          description: '大模型研发、算法框架与 MaaS 平台，行业技术壁垒集中环节。',
          companies: ['科大讯飞', '商汤科技', '云从科技'],
        },
        {
          level: '下游',
          nodeName: '行业应用与集成',
          description: '面向制造、政务、医疗等领域的解决方案落地与交付。',
          companies: ['拓尔思', '汉王科技', '佳都科技'],
        },
      ],
      cr5: 38.2,
      concentrationNote: 'CR5 约 38.2%，中游模型层集中度快速提升，下游应用高度分散。',
    },
    jobs: {
      jobs: [
        { jobTitle: '大模型应用工程师', demandHeat: 95, salaryMin: 18, salaryMax: 35, skills: ['LLM', 'Prompt工程', 'Python'] },
        { jobTitle: '算法工程师', demandHeat: 88, salaryMin: 16, salaryMax: 30, skills: ['机器学习', 'PyTorch', '数据分析'] },
        { jobTitle: '数据分析师', demandHeat: 82, salaryMin: 10, salaryMax: 18, skills: ['SQL', 'BI', '数据建模'] },
        { jobTitle: '后端开发工程师', demandHeat: 86, salaryMin: 12, salaryMax: 24, skills: ['Java', '微服务', '数据库'] },
        { jobTitle: '网络安全工程师', demandHeat: 71, salaryMin: 11, salaryMax: 20, skills: ['渗透测试', '等保', '安全加固'] },
        { jobTitle: 'AI产品经理', demandHeat: 76, salaryMin: 15, salaryMax: 28, skills: ['需求分析', '场景设计', '项目管理'] },
      ],
      skillFrequencies: [
        { skill: 'Python', freq: 52 },
        { skill: 'SQL', freq: 41 },
        { skill: '机器学习', freq: 37 },
        { skill: 'LLM', freq: 34 },
        { skill: '微服务', freq: 26 },
        { skill: '数据分析', freq: 25 },
        { skill: 'PyTorch', freq: 22 },
        { skill: '项目管理', freq: 19 },
      ],
    },
  },
  {
    keywords: /新能源|汽车|电池|光伏|储能|电气/,
    lifecycle: {
      growthTrend: [
        { year: '2021', growthRate: 34.8 },
        { year: '2022', growthRate: 41.2 },
        { year: '2023', growthRate: 28.6 },
        { year: '2024', growthRate: 17.4 },
        { year: '2025', growthRate: 12.3 },
      ],
      enterpriseTrend: [
        { year: '2021', count: 2640 },
        { year: '2022', count: 3450 },
        { year: '2023', count: 4120 },
        { year: '2024', count: 4380 },
        { year: '2025', count: 4460 },
      ],
      verdict: '成熟期',
      verdictReason:
        '增速由 40% 以上回落至 12% 左右、企业数量趋于稳定并开始出清，行业由高速扩张转入成熟期。',
    },
    chain: {
      nodes: [
        {
          level: '上游',
          nodeName: '关键材料与部件',
          description: '正负极材料、隔膜、电解液及锂矿资源，成本波动主要来源。',
          companies: ['赣锋锂业', '恩捷股份', '天赐材料'],
        },
        {
          level: '中游',
          nodeName: '电芯与电池系统',
          description: '电芯制造与 Pack 集成，行业集中度最高的环节。',
          companies: ['宁德时代', '亿纬锂能', '国轩高科'],
        },
        {
          level: '下游',
          nodeName: '整车与储能应用',
          description: '新能源整车、储能电站及电池回收利用。',
          companies: ['比亚迪', '阳光电源', '格林美'],
        },
      ],
      cr5: 61.8,
      concentrationNote: 'CR5 约 61.8%，中游电芯环节高度集中，属典型成熟期寡头格局。',
    },
    jobs: {
      jobs: [
        { jobTitle: '电池测试工程师', demandHeat: 84, salaryMin: 9, salaryMax: 16, skills: ['电性能测试', '数据分析', 'GB标准'] },
        { jobTitle: 'BMS软件工程师', demandHeat: 80, salaryMin: 14, salaryMax: 26, skills: ['嵌入式', 'C语言', 'CAN总线'] },
        { jobTitle: '生产工艺工程师', demandHeat: 77, salaryMin: 10, salaryMax: 18, skills: ['工艺优化', 'SPC', '良率提升'] },
        { jobTitle: '储能系统工程师', demandHeat: 73, salaryMin: 12, salaryMax: 22, skills: ['系统集成', '电气设计', 'EMS'] },
        { jobTitle: '质量工程师', demandHeat: 68, salaryMin: 9, salaryMax: 15, skills: ['IQC', 'FMEA', '体系审核'] },
        { jobTitle: '设备维护工程师', demandHeat: 71, salaryMin: 8, salaryMax: 14, skills: ['自动化设备', '点检', '故障排查'] },
      ],
      skillFrequencies: [
        { skill: '数据分析', freq: 39 },
        { skill: '电气设计', freq: 34 },
        { skill: 'C语言', freq: 30 },
        { skill: '嵌入式', freq: 28 },
        { skill: '工艺优化', freq: 27 },
        { skill: '系统集成', freq: 23 },
        { skill: 'GB标准', freq: 21 },
        { skill: 'FMEA', freq: 17 },
      ],
    },
  },
  {
    keywords: /医药|生物|健康|护理|医疗器械|食品/,
    lifecycle: {
      growthTrend: [
        { year: '2021', growthRate: 13.2 },
        { year: '2022', growthRate: 9.8 },
        { year: '2023', growthRate: 11.6 },
        { year: '2024', growthRate: 14.3 },
        { year: '2025', growthRate: 15.7 },
      ],
      enterpriseTrend: [
        { year: '2021', count: 2180 },
        { year: '2022', count: 2340 },
        { year: '2023', count: 2510 },
        { year: '2024', count: 2760 },
        { year: '2025', count: 3040 },
      ],
      verdict: '成长期',
      verdictReason:
        '人口老龄化与国产替代驱动需求稳步扩张，增速回升且企业数量持续净增，判定为成长期。',
    },
    chain: {
      nodes: [
        {
          level: '上游',
          nodeName: '原料与研发服务',
          description: '原料药、生物试剂及 CRO/CDMO 研发外包服务。',
          companies: ['药明康德', '凯莱英', '泰格医药'],
        },
        {
          level: '中游',
          nodeName: '产品制造',
          description: '创新药、仿制药及医疗器械的生产制造环节。',
          companies: ['恒瑞医药', '迈瑞医疗', '联影医疗'],
        },
        {
          level: '下游',
          nodeName: '流通与服务',
          description: '医药流通配送、连锁药房及医疗健康服务。',
          companies: ['国药控股', '九州通', '爱尔眼科'],
        },
      ],
      cr5: 45.3,
      concentrationNote: 'CR5 约 45.3%，器械与流通环节集中度较高，创新药环节仍较分散。',
    },
    jobs: {
      jobs: [
        { jobTitle: '临床研究专员', demandHeat: 81, salaryMin: 10, salaryMax: 18, skills: ['GCP', '方案设计', '数据管理'] },
        { jobTitle: '医疗器械工程师', demandHeat: 78, salaryMin: 11, salaryMax: 20, skills: ['机械设计', '法规', '风险管理'] },
        { jobTitle: '药品注册专员', demandHeat: 74, salaryMin: 9, salaryMax: 17, skills: ['注册法规', '资料撰写', '申报'] },
        { jobTitle: '质量保证工程师', demandHeat: 76, salaryMin: 9, salaryMax: 16, skills: ['GMP', '审计', '验证'] },
        { jobTitle: '生物实验技术员', demandHeat: 72, salaryMin: 7, salaryMax: 12, skills: ['细胞培养', 'PCR', '实验记录'] },
        { jobTitle: '健康管理师', demandHeat: 65, salaryMin: 7, salaryMax: 13, skills: ['健康评估', '慢病管理', '沟通'] },
      ],
      skillFrequencies: [
        { skill: 'GMP', freq: 37 },
        { skill: '数据管理', freq: 33 },
        { skill: '法规', freq: 31 },
        { skill: '风险管理', freq: 26 },
        { skill: '方案设计', freq: 24 },
        { skill: '验证', freq: 22 },
        { skill: '细胞培养', freq: 19 },
        { skill: '沟通', freq: 16 },
      ],
    },
  },
  {
    keywords: /电商|物流|商贸|营销|管理|财经|会计|旅游|酒店/,
    lifecycle: {
      growthTrend: [
        { year: '2021', growthRate: 16.4 },
        { year: '2022', growthRate: 8.6 },
        { year: '2023', growthRate: 12.8 },
        { year: '2024', growthRate: 13.5 },
        { year: '2025', growthRate: 14.2 },
      ],
      enterpriseTrend: [
        { year: '2021', count: 6820 },
        { year: '2022', count: 7010 },
        { year: '2023', count: 7480 },
        { year: '2024', count: 8120 },
        { year: '2025', count: 8940 },
      ],
      verdict: '成熟期',
      verdictReason:
        '增速维持在 8%–16% 的平稳区间，企业数量温和增长但集中度提升，进入成熟期。',
    },
    chain: {
      nodes: [
        {
          level: '上游',
          nodeName: '货源与供应链',
          description: '品牌商、工厂货源及供应链服务商。',
          companies: ['怡亚通', '密尔克卫', '东方嘉盛'],
        },
        {
          level: '中游',
          nodeName: '平台与运营',
          description: '电商平台、代运营与数字化营销服务。',
          companies: ['值得买', '壹网壹创', '若羽臣'],
        },
        {
          level: '下游',
          nodeName: '履约与物流',
          description: '仓储、快递配送及最后一公里服务。',
          companies: ['顺丰控股', '京东物流', '圆通速递'],
        },
      ],
      cr5: 52.6,
      concentrationNote: 'CR5 约 52.6%，下游物流与平台环节集中度高，上游货源高度分散。',
    },
    jobs: {
      jobs: [
        { jobTitle: '电商运营专员', demandHeat: 88, salaryMin: 7, salaryMax: 14, skills: ['店铺运营', '数据分析', '活动策划'] },
        { jobTitle: '数字营销专员', demandHeat: 83, salaryMin: 8, salaryMax: 16, skills: ['投放', '内容运营', '转化优化'] },
        { jobTitle: '供应链专员', demandHeat: 76, salaryMin: 8, salaryMax: 15, skills: ['采购', '库存管理', 'ERP'] },
        { jobTitle: '数据分析师', demandHeat: 79, salaryMin: 10, salaryMax: 19, skills: ['SQL', 'BI', '用户分析'] },
        { jobTitle: '物流规划专员', demandHeat: 68, salaryMin: 8, salaryMax: 15, skills: ['仓储规划', '路径优化', 'WMS'] },
        { jobTitle: '跨境电商运营', demandHeat: 72, salaryMin: 9, salaryMax: 18, skills: ['英语', '平台规则', '选品'] },
      ],
      skillFrequencies: [
        { skill: '数据分析', freq: 43 },
        { skill: '店铺运营', freq: 36 },
        { skill: 'ERP', freq: 29 },
        { skill: '活动策划', freq: 27 },
        { skill: '采购', freq: 24 },
        { skill: '转化优化', freq: 22 },
        { skill: 'WMS', freq: 19 },
        { skill: '英语', freq: 16 },
      ],
    },
  },
];

const FALLBACK_PROFILE: IndustryProfile = {
  keywords: /.*/,
  lifecycle: {
    growthTrend: [
      { year: '2021', growthRate: 14.2 },
      { year: '2022', growthRate: 11.6 },
      { year: '2023', growthRate: 15.8 },
      { year: '2024', growthRate: 17.3 },
      { year: '2025', growthRate: 16.1 },
    ],
    enterpriseTrend: [
      { year: '2021', count: 2860 },
      { year: '2022', count: 3120 },
      { year: '2023', count: 3480 },
      { year: '2024', count: 3910 },
      { year: '2025', count: 4360 },
    ],
    verdict: '成长期',
    verdictReason: '近五年增速保持在 10% 以上且企业数量持续净增，整体处于成长期。',
  },
  chain: {
    nodes: [
      {
        level: '上游',
        nodeName: '原材料与基础服务',
        description: '上游原材料供应与基础技术/服务支撑。',
        companies: ['上游企业A', '上游企业B', '上游企业C'],
      },
      {
        level: '中游',
        nodeName: '产品制造与加工',
        description: '中游核心产品或服务的生产制造环节。',
        companies: ['中游企业A', '中游企业B', '中游企业C'],
      },
      {
        level: '下游',
        nodeName: '应用与流通',
        description: '下游行业应用、渠道流通与终端服务。',
        companies: ['下游企业A', '下游企业B', '下游企业C'],
      },
    ],
    cr5: 47.4,
    concentrationNote: 'CR5 约 47.4%，中游环节集中度相对较高。',
  },
  jobs: {
    jobs: [
      { jobTitle: '技术工程师', demandHeat: 86, salaryMin: 9, salaryMax: 18, skills: ['专业技术', '现场实施', '问题解决'] },
      { jobTitle: '工艺工程师', demandHeat: 79, salaryMin: 9, salaryMax: 16, skills: ['工艺优化', '数据分析', '标准规范'] },
      { jobTitle: '质量工程师', demandHeat: 74, salaryMin: 8, salaryMax: 15, skills: ['质量体系', '检验', '改进'] },
      { jobTitle: '项目管理专员', demandHeat: 71, salaryMin: 10, salaryMax: 18, skills: ['项目管理', '沟通协调', '计划'] },
      { jobTitle: '销售工程师', demandHeat: 68, salaryMin: 8, salaryMax: 20, skills: ['客户开发', '方案讲解', '商务'] },
      { jobTitle: '运维工程师', demandHeat: 72, salaryMin: 8, salaryMax: 14, skills: ['设备维护', '巡检', '故障排查'] },
    ],
    skillFrequencies: [
      { skill: '数据分析', freq: 38 },
      { skill: '工艺优化', freq: 32 },
      { skill: '项目管理', freq: 29 },
      { skill: '质量体系', freq: 26 },
      { skill: '沟通协调', freq: 23 },
      { skill: '设备维护', freq: 21 },
      { skill: '标准规范', freq: 18 },
      { skill: '客户开发', freq: 15 },
    ],
  },
};

function pickProfile(industryName: string): IndustryProfile {
  return PROFILES.find((p) => p.keywords.test(industryName)) || FALLBACK_PROFILE;
}

function shift(value: number, seed: number, amplitude: number): number {
  const delta = ((seed * 37) % (amplitude * 2 + 1)) - amplitude;
  return value + delta;
}

// ---------- Step 1：素材采集（模拟搜索 API） ----------

export function runSearch(input: WhitepaperInput): Record<WhitepaperModuleKey, SearchMaterial[]> {
  const queries = buildSearchQueries(input.industryName, input.region);
  const profile = pickProfile(input.industryName);
  const result = {} as Record<WhitepaperModuleKey, SearchMaterial[]>;

  (Object.keys(queries) as WhitepaperModuleKey[]).forEach((module) => {
    const items: SearchMaterial[] = [];
    queries[module].forEach((q, qi) => {
      for (let i = 0; i < 3; i += 1) {
        const idx = qi * 3 + i;
        items.push({
          module,
          title:
            module === 'lifecycle'
              ? `${input.industryName}行业市场研究报告（${2025 - i}）`
              : module === 'chain'
                ? `${input.industryName}产业链全景图与重点企业梳理`
                : `${input.industryName}人才需求与岗位薪酬调查报告`,
          url:
            module === 'lifecycle'
              ? `https://www.stats.gov.cn/report/${encodeURIComponent(input.industryName)}-${2025 - i}`
              : module === 'chain'
                ? `https://www.cninfo.com.cn/chain/${encodeURIComponent(input.industryName)}-${idx}`
                : `https://www.zhaopin.com/insight/${encodeURIComponent(input.industryName)}-${idx}`,
          snippet:
            module === 'lifecycle'
              ? `报告显示${input.industryName}产业 ${profile.lifecycle.growthTrend[i].year} 年规模增速约 ${shift(
                  profile.lifecycle.growthTrend[i].growthRate,
                  idx,
                  3,
                ).toFixed(1)}%，企业数量约 ${shift(profile.lifecycle.enterpriseTrend[i].count, idx, 220)} 家。`
              : module === 'chain'
                ? `${input.industryName}产业链${profile.chain.nodes[i % 3].level}环节以${profile.chain.nodes[i % 3].nodeName}为主，代表企业包括${profile.chain.nodes[i % 3].companies.join('、')}等。`
                : `${input.industryName}领域招聘需求集中岗位为${profile.jobs.jobs[i % profile.jobs.jobs.length].jobTitle}，月薪区间约 ${profile.jobs.jobs[i % profile.jobs.jobs.length].salaryMin}-${profile.jobs.jobs[i % profile.jobs.jobs.length].salaryMax}K。`,
        });
      }
    });
    result[module] = items;
  });

  return result;
}

export function collectSources(materials: Record<WhitepaperModuleKey, SearchMaterial[]>): string[] {
  const urls: string[] = [];
  Object.values(materials).forEach((items) => {
    items.forEach((m) => {
      if (!urls.includes(m.url)) urls.push(m.url);
    });
  });
  return urls;
}

// ---------- Step 2：大模型结构化提取（模拟 LLM） ----------

export function extractStructured(input: WhitepaperInput, seed = 0): WhitepaperResult {
  const profile = pickProfile(input.industryName);
  const lifecycle: LifecycleData = {
    growthTrend: profile.lifecycle.growthTrend.map((p) => ({
      year: p.year,
      growthRate: Number(shift(p.growthRate, seed + Number(p.year), 2).toFixed(1)),
    })),
    enterpriseTrend: profile.lifecycle.enterpriseTrend.map((p) => ({
      year: p.year,
      count: shift(p.count, seed + Number(p.year), 180),
    })),
    verdict: profile.lifecycle.verdict,
    verdictReason: profile.lifecycle.verdictReason,
  };

  const chain: ChainData = {
    nodes: profile.chain.nodes.map((n) => ({ ...n, companies: [...n.companies] })),
    cr5: Number(shift(profile.chain.cr5, seed, 4).toFixed(1)),
    concentrationNote: profile.chain.concentrationNote.replace(
      /CR5\s*约\s*[\d.]+%/,
      `CR5 约 ${Number(shift(profile.chain.cr5, seed, 4).toFixed(1))}%`,
    ),
  };

  const jobs: JobData = {
    jobs: profile.jobs.jobs.map((j) => ({
      ...j,
      demandHeat: Math.max(40, Math.min(100, shift(j.demandHeat, seed, 5))),
      skills: [...j.skills],
    })),
    skillFrequencies: profile.jobs.skillFrequencies.map((s) => ({
      skill: s.skill,
      freq: Math.max(5, shift(s.freq, seed, 4)),
    })),
  };

  const materials = runSearch(input);

  return {
    majorName: input.majorName,
    industryName: input.industryName,
    region: input.region,
    generatedAt: new Date().toLocaleString('zh-CN'),
    lifecycle,
    chain,
    jobs,
    sources: collectSources(materials),
  };
}

// ---------- 判定汇总表 / 薪资四分位 数据 ----------

export interface VerdictRow {
  metric: string;
  performance: string;
  basis: string;
}

export function buildVerdictRows(r: WhitepaperResult): VerdictRow[] {
  const g = r.lifecycle.growthTrend;
  const e = r.lifecycle.enterpriseTrend;
  const first = g[0];
  const last = g[g.length - 1];
  const entFirst = e[0];
  const entLast = e[e.length - 1];
  const trendText =
    last.growthRate > first.growthRate ? '上行' : last.growthRate < first.growthRate ? '回落' : '基本持平';
  const entChange = (((entLast.count - entFirst.count) / entFirst.count) * 100).toFixed(1);
  const peak = g.reduce((a, b) => (b.growthRate > a.growthRate ? b : a), g[0]);
  return [
    {
      metric: '营收增长率',
      performance: `${first.growthRate}% → ${last.growthRate}%`,
      basis: `整体${trendText}，年均约 ${(g.reduce((s, p) => s + p.growthRate, 0) / g.length).toFixed(1)}%，峰值 ${peak.year} 年（${peak.growthRate}%）`,
    },
    {
      metric: '企业数量',
      performance: `${entFirst.count} → ${entLast.count} 家`,
      basis: `累计净增 ${entChange}%，产业主体持续集聚`,
    },
    {
      metric: '综合判定',
      performance: r.lifecycle.verdict,
      basis: r.lifecycle.verdictReason,
    },
  ];
}

export interface SalaryStat {
  jobTitle: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
}

export function buildSalaryStats(r: WhitepaperResult): SalaryStat[] {
  return r.jobs.jobs.map((j) => {
    const span = j.salaryMax - j.salaryMin;
    return {
      jobTitle: j.jobTitle,
      min: j.salaryMin,
      q1: Number((j.salaryMin + span * 0.25).toFixed(1)),
      median: Number(((j.salaryMin + j.salaryMax) / 2).toFixed(1)),
      q3: Number((j.salaryMin + span * 0.75).toFixed(1)),
      max: j.salaryMax,
    };
  });
}

// ---------- 文字旁白（模拟大模型撰写） ----------

export interface WhitepaperNarrative {
  overview: string;
  lifecycleGrowth: string;
  lifecycleEnterprise: string;
  lifecycleVerdict: string;
  chainStructure: string;
  chainCompanies: string;
  concentration: string;
  jobHeat: string;
  salary: string;
  skills: string;
  jobSummary: string;
  sourceNote: string;
  traceNote: string;
}

export function buildNarrative(r: WhitepaperResult): WhitepaperNarrative {
  const g = r.lifecycle.growthTrend;
  const e = r.lifecycle.enterpriseTrend;
  const first = g[0];
  const last = g[g.length - 1];
  const avgGrowth = (g.reduce((s, p) => s + p.growthRate, 0) / g.length).toFixed(1);
  const peak = g.reduce((a, b) => (b.growthRate > a.growthRate ? b : a), g[0]);
  const lowest = g.reduce((a, b) => (b.growthRate < a.growthRate ? b : a), g[0]);
  const trendText =
    last.growthRate > first.growthRate ? '稳步上行' : last.growthRate < first.growthRate ? '高位回落' : '基本持平';
  const rising = last.growthRate >= first.growthRate;

  const entFirst = e[0];
  const entLast = e[e.length - 1];
  const entGrowth = (((entLast.count - entFirst.count) / entFirst.count) * 100).toFixed(0);
  const entAnnual = Math.round((entLast.count - entFirst.count) / Math.max(1, e.length - 1));

  const jobsByHeat = [...r.jobs.jobs].sort((a, b) => b.demandHeat - a.demandHeat);
  const topJob = jobsByHeat[0];
  const secondJob = jobsByHeat[1];
  const salMin = Math.min(...r.jobs.jobs.map((j) => j.salaryMin));
  const salMax = Math.max(...r.jobs.jobs.map((j) => j.salaryMax));
  const highestPaid = r.jobs.jobs.reduce((a, b) => (b.salaryMax > a.salaryMax ? b : a), r.jobs.jobs[0]);
  const medianAvg = (
    r.jobs.jobs.reduce((s, j) => s + (j.salaryMin + j.salaryMax) / 2, 0) / r.jobs.jobs.length
  ).toFixed(1);

  const skills = [...r.jobs.skillFrequencies].sort((a, b) => b.freq - a.freq);
  const topSkills = skills.slice(0, 3);
  const skillTotal = skills.reduce((s, x) => s + x.freq, 0);

  const up = r.chain.nodes.filter((n) => n.level === '上游');
  const mid = r.chain.nodes.filter((n) => n.level === '中游');
  const down = r.chain.nodes.filter((n) => n.level === '下游');
  const companyCount = r.chain.nodes.reduce((s, n) => s + n.companies.length, 0);
  const concLevel = r.chain.cr5 >= 60 ? '高' : r.chain.cr5 >= 40 ? '中高' : r.chain.cr5 >= 25 ? '中等' : '较低';

  return {
    overview: `${r.industryName}是「${r.majorName}」专业重点服务的产业方向。本报告基于 ${r.sources.length} 条公开来源数据，从产业生命周期、产业链结构、关键岗位三个维度对该产业进行深度解析。综合判定：${r.industryName}产业当前处于「${r.lifecycle.verdict}」。${r.lifecycle.verdictReason}`,
    lifecycleGrowth: `${first.year}—${last.year} 年，${r.industryName}产业营收增长率由 ${first.growthRate}% 变动至 ${last.growthRate}%，期间年均增速约 ${avgGrowth}%，整体呈${trendText}态势；峰值出现在 ${peak.year} 年（${peak.growthRate}%），低点为 ${lowest.year} 年（${lowest.growthRate}%）。${
      rising
        ? '增速中枢有所抬升，说明下游需求仍在持续释放，产业规模扩张动能较强。'
        : '增速较基期有所回落，表明产业正由高速扩张阶段向质量提升阶段过渡。'
    }`,
    lifecycleEnterprise: `${first.year}—${last.year} 年，${r.industryName}产业企业数量由 ${entFirst.count} 家增至 ${entLast.count} 家，累计净增约 ${entGrowth}%，年均新增约 ${entAnnual} 家。企业主体的持续进入反映出该领域仍具备进入吸引力，尚未出现明显的存量出清特征。`,
    lifecycleVerdict: `综合增长率与企业数量两方面的表现，判定${r.industryName}产业当前处于「${r.lifecycle.verdict}」。${r.lifecycle.verdictReason}`,
    chainStructure: `${r.industryName}产业链可拆分为上游、中游、下游共 ${r.chain.nodes.length} 个环节。上游为${up.map((n) => n.nodeName).join('、')}，主要提供原材料与核心部件；中游为${mid.map((n) => n.nodeName).join('、')}，是产业技术壁垒与价值集中的关键环节；下游为${down.map((n) => n.nodeName).join('、')}，直接面向行业应用与终端市场。三个环节的成本与议价能力逐级传导，其中中游环节对全产业链的带动作用最为显著。`,
    chainCompanies: `各环节共梳理核心企业 ${companyCount} 家。上游以${up.flatMap((n) => n.companies).slice(0, 3).join('、')}等为代表；中游以${mid.flatMap((n) => n.companies).slice(0, 3).join('、')}等为代表；下游以${down.flatMap((n) => n.companies).slice(0, 3).join('、')}等为代表。上述企业可作为专业开展课程对接、实习基地建设与校企合作的优先合作对象。`,
    concentration: `行业 CR5 集中度约为 ${r.chain.cr5}%，属于${concLevel}集中度行业。${r.chain.concentrationNote}`,
    jobHeat: `结合招聘公开数据，共梳理出 ${r.jobs.jobs.length} 个关键岗位。其中需求热度最高的为「${topJob.jobTitle}」（${topJob.demandHeat}/100）${
      secondJob ? `，其次为「${secondJob.jobTitle}」（${secondJob.demandHeat}/100）` : ''
    }。热度分布显示，产业对能够直接承接现场实施与交付的岗位需求最为迫切。`,
    salary: `岗位月薪区间整体分布在 ${salMin}—${salMax} 千元/月，其中「${highestPaid.jobTitle}」薪资上限最高（${highestPaid.salaryMax}K），全部岗位中位月薪平均约 ${medianAvg}K。薪资梯度与技术门槛基本吻合，技术密集型岗位的薪酬溢价更为明显。`,
    skills: `能力要求维度共出现 ${skillTotal} 次技能提及，频次最高的三项为${topSkills
      .map((s) => `${s.skill}（${s.freq} 次）`)
      .join('、')}。这表明${r.industryName}产业对${topSkills.map((s) => s.skill).join('、')}等能力的需求最为集中，可作为课程目标与实训项目设置的直接依据。`,
    jobSummary: `从岗位结构看，${r.industryName}产业既需要掌握${topSkills[0]?.skill}等核心技术的研发与工程人员，也需要具备现场实施能力的实施与运维人员。建议专业在课程体系中同时覆盖技术基础与工程实践两条主线，并以「${topJob.jobTitle}」等高频岗位的能力要求作为课程目标的校准基准。`,
    sourceNote: `本报告数据来自 ${r.sources.length} 条公开来源，涵盖政府统计、上市公司公开披露、行业协会及招聘平台数据，原始链接见下方清单。`,
    traceNote: `报告中的每一项结构化字段均可回溯至本节所列来源，经大模型提取与归类后生成。生成结果为全国范围公开数据，学校需结合所服务区域产业特点与校企合作企业信息进行本地化校正后方可提交。`,
  };
}

// ---------- Step 3：正文组装（模拟模板引擎） ----------

export function assembleMarkdown(r: WhitepaperResult): string {
  const n = buildNarrative(r);
  const verdictRows = buildVerdictRows(r);
  const salaryStats = buildSalaryStats(r);
  const lines: string[] = [];

  lines.push(`# ${r.industryName}产业白皮书`);
  lines.push('');
  lines.push(`> 服务专业：${r.majorName}　｜　区域：${r.region}　｜　生成时间：${r.generatedAt}`);
  lines.push('');

  lines.push('## 1. 产业概况');
  lines.push(n.overview);
  lines.push('');

  lines.push('## 2. 产业生命周期判定');
  lines.push('### 2.1 增长率分析');
  lines.push(n.lifecycleGrowth);
  lines.push('');
  lines.push('> 图1：营收增速折线图');
  lines.push('| 年份 | 增长率 |');
  lines.push('|------|--------|');
  r.lifecycle.growthTrend.forEach((p) => lines.push(`| ${p.year} | ${p.growthRate}% |`));
  lines.push('');
  lines.push('### 2.2 企业数量变化');
  lines.push(n.lifecycleEnterprise);
  lines.push('');
  lines.push('> 图2：企业数量柱状图');
  lines.push('| 年份 | 企业数量(家) |');
  lines.push('|------|--------------|');
  r.lifecycle.enterpriseTrend.forEach((p) => lines.push(`| ${p.year} | ${p.count} |`));
  lines.push('');
  lines.push('### 2.3 生命周期判定结论');
  lines.push(n.lifecycleVerdict);
  lines.push('');
  lines.push('> 表1：判定指标汇总');
  lines.push('| 判定指标 | 表现 | 判定依据 |');
  lines.push('|----------|------|----------|');
  verdictRows.forEach((row) => lines.push(`| ${row.metric} | ${row.performance} | ${row.basis} |`));
  lines.push('');

  lines.push('## 3. 产业链图谱');
  lines.push('### 3.1 上中下游结构');
  lines.push(n.chainStructure);
  lines.push('');
  lines.push('> 图3：产业链上中下游流向图');
  r.chain.nodes.forEach((x) => lines.push(`- **${x.level} · ${x.nodeName}**：${x.description}`));
  lines.push('');
  lines.push('### 3.2 核心企业清单');
  lines.push(n.chainCompanies);
  lines.push('');
  lines.push('> 表2：企业矩阵表');
  lines.push('| 层级 | 节点 | 核心企业 |');
  lines.push('|------|------|----------|');
  r.chain.nodes.forEach((x) => lines.push(`| ${x.level} | ${x.nodeName} | ${x.companies.join('、')} |`));
  lines.push('');
  lines.push('### 3.3 集中度分析');
  lines.push(n.concentration);
  lines.push('');
  lines.push('> 图4：CR5 柱状图');
  lines.push(`- CR5 集中度：${r.chain.cr5}%`);
  lines.push('');

  lines.push('## 4. 关键岗位清单');
  lines.push('### 4.1 岗位需求热度');
  lines.push(n.jobHeat);
  lines.push('');
  lines.push('> 图5：岗位热度柱状图');
  lines.push('| 岗位 | 需求热度 |');
  lines.push('|------|----------|');
  r.jobs.jobs.forEach((j) => lines.push(`| ${j.jobTitle} | ${j.demandHeat}/100 |`));
  lines.push('');
  lines.push('### 4.2 薪资水平');
  lines.push(n.salary);
  lines.push('');
  lines.push('> 图6：薪资箱线图（千元/月）');
  lines.push('| 岗位 | 下限 | Q1 | 中位 | Q3 | 上限 |');
  lines.push('|------|------|----|------|----|------|');
  salaryStats.forEach((s) =>
    lines.push(`| ${s.jobTitle} | ${s.min} | ${s.q1} | ${s.median} | ${s.q3} | ${s.max} |`),
  );
  lines.push('');
  lines.push('### 4.3 能力要求');
  lines.push(n.skills);
  lines.push('');
  lines.push('> 图7：技能频次图');
  lines.push('| 技能 | 提及次数 |');
  lines.push('|------|----------|');
  r.jobs.skillFrequencies.forEach((s) => lines.push(`| ${s.skill} | ${s.freq} |`));
  lines.push('');
  lines.push('### 4.4 岗位清单');
  lines.push(n.jobSummary);
  lines.push('');
  lines.push('> 表3：结构化岗位表');
  lines.push('| 岗位名称 | 需求热度 | 薪资范围(千元/月) | 核心能力要求 |');
  lines.push('|----------|----------|-------------------|--------------|');
  r.jobs.jobs.forEach((j) =>
    lines.push(`| ${j.jobTitle} | ${j.demandHeat} | ${j.salaryMin}-${j.salaryMax} | ${j.skills.join('、')} |`),
  );
  lines.push('');

  lines.push('## 5. 数据来源与计算说明');
  lines.push('### 5.1 数据源清单');
  lines.push(n.sourceNote);
  lines.push('');
  r.sources.forEach((u) => lines.push(`- ${u}`));
  lines.push('');
  lines.push('### 5.2 计算公式');
  lines.push('- 营收增长率 =（本期营收 − 上期营收）/ 上期营收 × 100%');
  lines.push('- 企业数量净增率 =（末期企业数 − 基期企业数）/ 基期企业数 × 100%');
  lines.push('- CR5 = 前五大企业市占率之和');
  lines.push('- 需求热度 = 基于招聘平台岗位数量归一化后的相对值（1—100）');
  lines.push('- 薪资四分位 = 依据岗位薪资下限与上限线性插值估算（Q1 取 25%、中位取 50%、Q3 取 75%）');
  lines.push('');
  lines.push('### 5.3 可追溯记录');
  lines.push(n.traceNote);
  return lines.join('\n');
}