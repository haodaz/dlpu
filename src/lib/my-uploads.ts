// 我的上传 — 学校需上传的 33 种材料清单
// 数据来源：用户整理的指标所需材料表
// 每种材料有：序号、名称、来源系统、关联指标、上传状态（mock）

export type UploadStatus = 'pending' | 'uploaded' | 'processing' | 'completed';

// 上传页面独立的 8 大分类（与数据管理模块的分类不同，此处按用户需求定义）
export type UploadCategoryKey =
  | 'major-industry'      // 专业与产业
  | 'course-teaching'     // 课程与教学
  | 'graduation-enterprise'// 毕业设计与企业合作
  | 'research-case'       // 科研与案例
  | 'ai-teaching-training'// AI教学与培训
  | 'platform-learning'   // 课程平台与学习行为
  | 'resource-experiment' // 资源与实验
  | 'employment-alumni';  // 就业与校友

export interface UploadMaterial {
  id: string; // 序号如 M01
  no: number; // 1-33
  name: string; // 材料名称
  sourceSystem: string; // 来源系统
  relatedIndicators: string[]; // 关联指标
  category: UploadCategoryKey; // 8 大类之一
  format: string; // Excel / Word+PDF / 签章文件等
  status: UploadStatus;
  uploadedAt?: string; // 上传时间
  fileName?: string; // 已上传的文件名
  notes?: string; // 备注
}

// ---------- 8 大类分组定义 ----------
export interface UploadCategory {
  key: UploadCategoryKey;
  name: string;
  color: string;
  bg: string;
  border: string;
}

export const uploadCategories: UploadCategory[] = [
  { key: 'major-industry',       name: '专业与产业',         color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'course-teaching',      name: '课程与教学',         color: '#1677ff', bg: '#eff6ff', border: '#bfdbfe' },
  { key: 'graduation-enterprise',name: '毕业设计与企业合作', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  { key: 'research-case',        name: '科研与案例',         color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  { key: 'ai-teaching-training', name: 'AI教学与培训',       color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
  { key: 'platform-learning',    name: '课程平台与学习行为', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  { key: 'resource-experiment',  name: '资源与实验',         color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'employment-alumni',    name: '就业与校友',         color: '#be185d', bg: '#fdf2f8', border: '#fbcfe8' },
];

// ---------- 33 种材料 ----------
// mock 状态规则：根据 no 取模决定状态（确定性，刷新不变）
function mockStatus(no: number): UploadStatus {
  const r = no % 4;
  if (r === 0) return 'completed';
  if (r === 1) return 'pending';
  if (r === 2) return 'uploaded';
  return 'processing';
}

function mockUploadedAt(no: number): string | undefined {
  const s = mockStatus(no);
  if (s === 'pending') return undefined;
  const day = 5 + (no % 10);
  const month = no % 2 === 0 ? 8 : 9;
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${10 + (no % 8)}:${String((no * 7) % 60).padStart(2, '0')}`;
}

function mockFileName(name: string, no: number): string | undefined {
  const s = mockStatus(no);
  if (s === 'pending') return undefined;
  // 根据材料名决定扩展名
  const n = name;
  let ext = 'xlsx';
  if (/大纲|方案|案例|教案|说明|记录|报告/.test(n)) ext = 'docx';
  if (/签章/.test(n)) ext = 'pdf';
  if (/PDF/.test(n)) ext = 'pdf';
  return `${n}.${ext}`;
}

function inferFormat(name: string): string {
  if (/签章/.test(name)) return '签章文件';
  if (/大纲|方案|案例|教案|说明|记录|报告/.test(name)) return 'Word/PDF';
  return 'Excel';
}

// 来源系统推断
function inferSource(name: string, category: UploadCategoryKey): string {
  if (/课程列表|培养方案|教学计划|选题清单|教学环节/.test(name)) return '教务系统';
  if (/大纲|教案|案例|产业调研|专业建设方案/.test(name)) return '教师上传';
  if (/横向课题/.test(name)) return '科研管理系统';
  if (/AI平台/.test(name)) return 'AI教学平台';
  if (/课程平台/.test(name)) return '课程平台';
  if (/设备台账|实验开出/.test(name)) return '资产管理/实验系统';
  if (/企业合作合同|企业验收/.test(name)) return '合同/签章系统';
  if (/毕业生就业/.test(name)) return '就业指导中心';
  if (/校友职业/.test(name)) return '校友会';
  if (/用人单位/.test(name)) return '学校提供';
  if (/教材ISBN/.test(name)) return '教务系统';
  if (/课程目标|考核任务|达成度/.test(name)) return '课程管理平台';
  if (/企业导师指导/.test(name)) return '毕业设计系统/教师上传';
  if (/培训记录|AI产出物/.test(name)) return '教师上传';
  if (/专业信息/.test(name)) return '教师/管理员上传';
  return '教师上传';
}

export const uploadMaterials: UploadMaterial[] = [
  // 1. 专业与产业
  { id: 'M01', no: 1, name: '专业信息',       relatedIndicators: ['1.1.1'],                category: 'major-industry' },
  { id: 'M02', no: 2, name: '产业调研材料',   relatedIndicators: ['1.1.1'],                category: 'major-industry' },
  { id: 'M03', no: 3, name: '专业建设方案',   relatedIndicators: ['1.3.1'],                category: 'major-industry' },
  // 2. 课程与教学
  { id: 'M04', no: 4, name: '课程列表',       relatedIndicators: ['1.1.2'],                category: 'course-teaching' },
  { id: 'M05', no: 5, name: '课程大纲文档',   relatedIndicators: ['1.1.3','1.2.1','1.3.1','2.1.1','2.1.2','2.3.2'], category: 'course-teaching' },
  { id: 'M06', no: 6, name: '教材ISBN清单',   relatedIndicators: ['1.2.1'],                category: 'course-teaching' },
  { id: 'M07', no: 7, name: '培养方案',       relatedIndicators: ['1.2.2','2.2.1'],        category: 'course-teaching' },
  { id: 'M08', no: 8, name: '教学计划',       relatedIndicators: ['1.2.2'],                category: 'course-teaching' },
  { id: 'M09', no: 9, name: '课程目标列表',   relatedIndicators: ['2.3.2'],                category: 'course-teaching' },
  { id: 'M10', no: 10, name: '考核任务列表',  relatedIndicators: ['2.3.2'],                category: 'course-teaching' },
  { id: 'M11', no: 11, name: '达成度报告',    relatedIndicators: ['2.3.2'],                category: 'course-teaching' },
  // 3. 毕业设计与企业合作
  { id: 'M12', no: 12, name: '选题清单',              relatedIndicators: ['1.2.3'],          category: 'graduation-enterprise' },
  { id: 'M13', no: 13, name: '企业导师指导记录',      relatedIndicators: ['1.2.3'],          category: 'graduation-enterprise' },
  { id: 'M14', no: 14, name: '企业验收签章',          relatedIndicators: ['1.2.3'],          category: 'graduation-enterprise' },
  { id: 'M15', no: 15, name: '教学环节清单',          relatedIndicators: ['3.1.2'],          category: 'graduation-enterprise' },
  { id: 'M16', no: 16, name: '企业合作合同清单',      relatedIndicators: ['3.1.2'],          category: 'graduation-enterprise' },
  { id: 'M17', no: 17, name: '企业验收签章文件',      relatedIndicators: ['3.1.2'],          category: 'graduation-enterprise' },
  // 4. 科研与案例
  { id: 'M18', no: 18, name: '横向课题清单',  relatedIndicators: ['2.1.1'],                category: 'research-case' },
  { id: 'M19', no: 19, name: '教学案例',      relatedIndicators: ['2.1.1'],                category: 'research-case' },
  // 5. AI教学与培训
  { id: 'M20', no: 20, name: 'AI平台日志',    relatedIndicators: ['2.1.2'],                category: 'ai-teaching-training' },
  { id: 'M21', no: 21, name: '教案',          relatedIndicators: ['2.1.2'],                category: 'ai-teaching-training' },
  { id: 'M22', no: 22, name: '培训记录',      relatedIndicators: ['2.1.2'],                category: 'ai-teaching-training' },
  { id: 'M23', no: 23, name: 'AI产出物',      relatedIndicators: ['2.1.2'],                category: 'ai-teaching-training' },
  { id: 'M24', no: 24, name: 'AI平台建设说明',relatedIndicators: ['3.1.1'],                category: 'ai-teaching-training' },
  { id: 'M25', no: 25, name: 'AI平台课程接入清单', relatedIndicators: ['3.1.1'],            category: 'ai-teaching-training' },
  // 6. 课程平台与学习行为
  { id: 'M26', no: 26, name: '课程平台互动数据', relatedIndicators: ['2.2.1'],             category: 'platform-learning' },
  { id: 'M27', no: 27, name: '课程平台行为日志', relatedIndicators: ['2.3.1'],             category: 'platform-learning' },
  // 7. 资源与实验
  { id: 'M28', no: 28, name: '设备台账',      relatedIndicators: ['3.1.1'],                category: 'resource-experiment' },
  { id: 'M29', no: 29, name: '实验开出记录',  relatedIndicators: ['3.1.1'],                category: 'resource-experiment' },
  // 8. 就业与校友
  { id: 'M30', no: 30, name: '毕业生就业数据',   relatedIndicators: ['4.1.1'],             category: 'employment-alumni' },
  { id: 'M31', no: 31, name: '校友职业发展数据', relatedIndicators: ['4.1.2'],             category: 'employment-alumni' },
  { id: 'M32', no: 32, name: '用人单位联系人清单', relatedIndicators: ['4.1.3'],           category: 'employment-alumni' },
].map((m) => ({
  ...m,
  format: inferFormat(m.name),
  sourceSystem: inferSource(m.name, m.category),
  status: mockStatus(m.no),
  uploadedAt: mockUploadedAt(m.no),
  fileName: mockFileName(m.name, m.no),
}));

// ---------- 公共 API ----------
export function getAllUploadMaterials(): UploadMaterial[] {
  return uploadMaterials;
}

export function getUploadMaterialsByCategory(): { category: UploadCategory; items: UploadMaterial[] }[] {
  return uploadCategories.map((cat) => ({
    category: cat,
    items: uploadMaterials.filter((m) => m.category === cat.key),
  }));
}

export interface UploadStat {
  total: number;
  completed: number;
  uploaded: number;
  processing: number;
  pending: number;
  coveredIndicators: number;
  completionRate: number; // 0-100
}

export function getUploadStat(): UploadStat {
  const total = uploadMaterials.length;
  const completed = uploadMaterials.filter((m) => m.status === 'completed').length;
  const uploaded = uploadMaterials.filter((m) => m.status === 'uploaded').length;
  const processing = uploadMaterials.filter((m) => m.status === 'processing').length;
  const pending = uploadMaterials.filter((m) => m.status === 'pending').length;
  const indicators = new Set<string>();
  uploadMaterials.forEach((m) => m.relatedIndicators.forEach((i) => indicators.add(i)));
  return {
    total, completed, uploaded, processing, pending,
    coveredIndicators: indicators.size,
    completionRate: Math.round(((completed + uploaded) / total) * 100),
  };
}

// ---------- 上传记录 ----------
export interface UploadRecord {
  id: string;
  materialId: string;
  materialName: string;
  fileName: string;
  uploadedAt: string;
  status: UploadStatus;
  mappedIndicators: string[];
  fileSize: string;
  fileType: string;
}

// 生成上传记录（从已上传材料派生）
export function getUploadRecords(): UploadRecord[] {
  return uploadMaterials
    .filter((m) => m.status !== 'pending' && m.fileName && m.uploadedAt)
    .map((m) => ({
      id: `R-${m.id}`,
      materialId: m.id,
      materialName: m.name,
      fileName: m.fileName!,
      uploadedAt: m.uploadedAt!,
      status: m.status,
      mappedIndicators: m.relatedIndicators,
      fileSize: `${(m.no % 5 + 1)}.${m.no % 9} MB`,
      fileType: m.fileName!.split('.').pop()!.toUpperCase(),
    }))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}
