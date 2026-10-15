// 模板与范本:全站唯一的模板目录(教师端「模板库」与管理员「模板与范本」都从这里读)
// T16(持续改进与大纲演进)、T17(教学资源台账存证)已并入 AI 自动存证,不再作为模板维护
import { templateMapping } from './data-management';
import { TEACHER_ITEMS, sourceOf, type SourceType } from './diagnosis';

export interface TemplateEntry {
  id: string; // T01
  path: string; // /templates/t01
  name: string;
  desc: string;
  indicators: string[]; // 关联指标
  owner: SourceType; // 由谁填:教师 / 学校系统导入 / AI 采集
  isTeacherSample: boolean; // 是否作为教师填报的范本(嵌入填报流程)
}

const RAW: { id: string; name: string; desc: string }[] = [
  { id: 'T01', name: '专业建设规划与方案', desc: '设定专业发展总体规划与建设路径。' },
  { id: 'T02', name: '毕业要求', desc: '聚焦宏观行业趋势,为专业定位提供支撑。' },
  { id: 'T03', name: '产业白皮书', desc: '解构产业链图谱、节点企业及关键岗位需求。' },
  { id: 'T04', name: '课程-产业链映射矩阵', desc: '验证课程体系与产业节点的对应关联,防止悬空课程。' },
  { id: 'T05', name: '教案(典型)', desc: '体现教师对每堂课的总体设计、重点、案例引入及逻辑递进。' },
  { id: 'T06', name: '过程性评价记录', desc: '填补期末一张卷与能力达成之间的断层,记录日常测验与项目表现。' },
  { id: 'T07', name: '学情分析报告', desc: '纵向对比历届数据,诊断能力短板,为后续课程提供交接棒。' },
  { id: 'T08', name: '考核分析', desc: '评价课程目标达成情况并制定持续改进措施。' },
  { id: 'T09', name: '学习行为数据', desc: '轻量对接课程平台,自动获取出勤、作业提交、在线交互等客观行为特征。' },
  { id: 'T10', name: '教学资源清单与使用台账', desc: '读取资产与实验系统台账,验证设备是否真正在支撑核心课程。' },
  { id: 'T11', name: '课程大纲(典型)', desc: '定义单门课程的教学目标、内容与考核方式。' },
  { id: 'T12', name: '毕业设计选题与成果记录', desc: '验证毕业设计真题真做比例与企业验收签章。' },
  { id: 'T13', name: '企业项目驱动清单', desc: '验证核心课程是否使用带企业签章和合同编号的真实生产项目。' },
  { id: 'T14', name: '产教融合与校企合作协议', desc: '产学研合作项目、基地建设及成果转化。' },
  { id: 'T15', name: '教学投入记录', desc: '提取教师在传道、授业、解惑三方面的投入数据。' },
  { id: 'T18', name: '行业就业率与用人单位满意度', desc: '验证毕业生对口就业率及起薪、满意度。' },
  { id: 'T19', name: '毕业生职业发展与校友追踪', desc: '追踪 3-5 年后毕业生的持续成长与行业贡献。' },
];

const teacherTemplateIds = new Set(TEACHER_ITEMS.map((t) => t.templateId.toUpperCase()));

// 模板由谁填:作为教师范本的归教师;否则看关联指标的主要来源
function ownerOf(id: string, indicators: string[]): SourceType {
  if (teacherTemplateIds.has(id)) return 'TEACHER';
  const layers = indicators.map(sourceOf);
  if (layers.includes('SCHOOL')) return 'SCHOOL';
  if (layers.includes('AI')) return 'AI';
  return 'TEACHER';
}

export const TEMPLATES: TemplateEntry[] = RAW.map((t) => {
  const indicators = templateMapping[t.id]?.relatedIndicators ?? [];
  return {
    ...t,
    path: `/templates/${t.id.toLowerCase()}`,
    indicators,
    owner: ownerOf(t.id, indicators),
    isTeacherSample: teacherTemplateIds.has(t.id),
  };
});
