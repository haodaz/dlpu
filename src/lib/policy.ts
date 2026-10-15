// 双优政策解读内容(获客钩子的唯一载体)
// freeLevel 0 = 无数据也免费露出;1 = 导入专业数据后解锁
// ⚠️ 以下为占位文案,权威口径与独到理解待李校侧提供后替换,演示时请勿当作正式政策引用。

export interface PolicyPoint {
  id: string;
  title: string;
  summary: string;
  meaning: string; // 对学校意味着什么
  freeLevel: 0 | 1;
}

export const POLICY_SOURCE_NOTE = '解读口径待专家审定 · 演示版';

export const POLICY_POINTS: PolicyPoint[] = [
  {
    id: 'P1',
    title: '专业建设从"有没有"转向"对不对、好不好"',
    summary: '评价重点不再是专业是否开齐、材料是否齐全,而是专业与区域产业需求是否一致、培养过程是否真正有效。',
    meaning: '同质化、与学校定位不符的专业将面临调整压力,"一致性"成为专业存续的第一道门槛。',
    freeLevel: 0,
  },
  {
    id: 'P2',
    title: '专业动态调整进入常态化',
    summary: '专业布局需根据产业变化持续优化,"新增—优化—缩减—停招"成为常规管理动作。',
    meaning: '学校需要每年拿出有证据的专业布局结论,而不是等评估临近再准备材料。',
    freeLevel: 0,
  },
  {
    id: 'P3',
    title: '培养方案必须能追溯到产业需求',
    summary: '培养目标、课程设置需逐条对应岗位能力与产业链节点,悬空课程将被视为短板。',
    meaning: '需要一份可核验的"产业需求 → 课程"映射证据链。',
    freeLevel: 1,
  },
  {
    id: 'P4',
    title: '过程性评价与达成度闭环成为硬要求',
    summary: '期末一张卷不足以证明能力达成,需要形成性评价与持续改进记录。',
    meaning: '教师层面的教案、学情分析、形成性评价将被重点核查。',
    freeLevel: 1,
  },
  {
    id: 'P5',
    title: '结果端证据:就业质量与毕业生发展',
    summary: '毕业生就业对口率、用人单位评价、校友中长期发展将纳入专业成效判断。',
    meaning: '学校需要建立可持续的毕业生追踪数据,而不是一次性调查。',
    freeLevel: 1,
  },
];

// 区域产业匹配预览(无数据态模糊展示)
export const REGION_PREVIEW = [
  { industry: '高端装备制造', demand: '高' },
  { industry: '海洋食品与生物', demand: '高' },
  { industry: '新材料与功能纺织', demand: '中' },
  { industry: '数字经济与软件', demand: '中' },
  { industry: '现代服务业', demand: '低' },
];
