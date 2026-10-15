// 外部数据源(学校系统 / 公共数据接口)的演示初始清单,首次建库时写入 DataSource 表
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
  { id: 'DS-01', name: '教育部学科评估数据', type: 'rest', endpoint: 'https://api.moe.gov.cn/csa/v1', indicatorId: '1.1.1', status: 'online', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每日' },
  { id: 'DS-02', name: '科技部项目库', type: 'rest', endpoint: 'https://api.most.gov.cn/projects', indicatorId: '2.1.1', status: 'online', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每日' },
  { id: 'DS-03', name: '专利数据库 (CNIPA)', type: 'database', endpoint: 'jdbc:postgresql://cnipa.internal', indicatorId: '1.3.1', status: 'online', lastSync: '2026-09-15T22:00:00+08:00', frequency: '每日' },
  { id: 'DS-04', name: '企业工商信息', type: 'rest', endpoint: 'https://api.qcc.com/v2/company', indicatorId: '3.1.2', status: 'degraded', lastSync: '2026-09-16T03:00:00+08:00', frequency: '每日' },
  { id: 'DS-05', name: '校友职业轨迹 (LinkedIn)', type: 'webhooks', endpoint: 'webhook://linkedin/in/trajectory', indicatorId: '4.1.2', status: 'offline', lastSync: '2026-09-10T03:00:00+08:00', frequency: '每周' },
  { id: 'DS-06', name: '高德人才地图', type: 'file', endpoint: 's3://talent-map/daily.json', indicatorId: '4.1.1', status: 'online', lastSync: '2026-09-16T06:00:00+08:00', frequency: '每日' },
];

export const IMPORT_LOG_SEED = [
  { createdAt: '2026-09-16T03:00:00+08:00', sourceId: 'DS-01', sourceSystem: '教育部学科评估数据', rowCount: 1240, successCount: 1240 },
  { createdAt: '2026-09-16T03:00:00+08:00', sourceId: 'DS-04', sourceSystem: '企业工商信息', rowCount: 860, successCount: 702, errorDetail: '158 条企业统一信用代码校验失败,已降级为上次同步结果' },
  { createdAt: '2026-09-10T03:00:00+08:00', sourceId: 'DS-05', sourceSystem: '校友职业轨迹 (LinkedIn)', rowCount: 0, successCount: 0, errorDetail: '接口鉴权过期,连接失败' },
];
