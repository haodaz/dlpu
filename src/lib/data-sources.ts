// 学校系统数据源的演示初始清单,首次建库时写入 DataSource 表
// 只列学校自己的业务系统(教务 / 学工 / 资产 / 实践教学 / 课程平台);公共数据(政策、企业、论文等)由平台 AI 采集,不在这里接入
export interface DataSourceSeed {
  id: string;
  name: string;
  type: string;
  endpoint: string;
  indicatorId: string;
  frequency: string;
  status: string;
  lastSync: string;
}

export const DATA_SOURCE_SEED: DataSourceSeed[] = [
  { id: 'DS-01', name: '教务管理系统 · 课程与教材', type: 'rest', endpoint: 'https://jwxt.dlpu.edu.cn/api/courses', indicatorId: '1.2.1', status: 'online', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每日' },
  { id: 'DS-02', name: '教务管理系统 · 毕业设计', type: 'rest', endpoint: 'https://jwxt.dlpu.edu.cn/api/thesis', indicatorId: '1.2.3', status: 'online', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每周' },
  { id: 'DS-03', name: '课程教学平台 · 学习行为', type: 'file', endpoint: 'sftp://lms.dlpu.edu.cn/export/daily.csv', indicatorId: '2.2.1', status: 'online', lastSync: '2026-09-15T22:00:00+08:00', frequency: '每日' },
  { id: 'DS-04', name: '实验室与资产管理系统', type: 'database', endpoint: 'jdbc:mysql://zcgl.dlpu.edu.cn/assets(只读视图)', indicatorId: '3.1.1', status: 'degraded', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每周' },
  { id: 'DS-05', name: '实践教学管理平台 · 校企项目', type: 'rest', endpoint: 'https://sjjx.dlpu.edu.cn/api/projects', indicatorId: '3.1.2', status: 'online', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每周' },
  { id: 'DS-06', name: '学工系统 · 毕业去向', type: 'file', endpoint: '每年 9 月由招生就业处上传 Excel', indicatorId: '4.1.1', status: 'offline', lastSync: '2025-09-10T03:00:00+08:00', frequency: '每年' },
];

export const IMPORT_LOG_SEED = [
  { createdAt: '2026-09-16T03:00:00+08:00', sourceId: 'DS-01', sourceSystem: '教务管理系统 · 课程与教材', rowCount: 1240, successCount: 1240 },
  { createdAt: '2026-09-16T03:00:00+08:00', sourceId: 'DS-04', sourceSystem: '实验室与资产管理系统', rowCount: 860, successCount: 702, errorDetail: '158 条设备记录缺少所属实验室编号,已沿用上次同步结果' },
  { createdAt: '2025-09-10T03:00:00+08:00', sourceId: 'DS-06', sourceSystem: '学工系统 · 毕业去向', rowCount: 0, successCount: 0, errorDetail: '本年度毕业去向表尚未上传' },
];

// 早期演示清单里混入了外部公共数据(企业工商信息、LinkedIn 等),容易让人误以为要学校上传;已有库检测到时替换为上面的清单
export const LEGACY_SOURCE_NAMES = ['教育部学科评估数据', '科技部项目库', '专利数据库 (CNIPA)', '企业工商信息', '校友职业轨迹 (LinkedIn)', '高德人才地图'];
