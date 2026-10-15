// 数据来源字段(PanoramicData.sourceType)全域唯一取值
// 历史上并存过三套写法:schema 注释 MANUAL/SYSTEM/EXTERNAL、AI 预填写入 AI_SEARCH/MULTI_AGENT_AI、
// 以及部分数据误把模板名(如「教案 (典型)」)写进了 sourceType。读写时一律经 normalizeSourceType 归一。
import type { SourceType as SourceLayer } from './diagnosis';

export const SOURCE_TYPE_CODES = ['MANUAL', 'SYSTEM', 'AI_SEARCH', 'MULTI_AGENT_AI'] as const;
export type SourceTypeCode = (typeof SOURCE_TYPE_CODES)[number];

export const SOURCE_TYPE_LABEL: Record<SourceTypeCode, string> = {
  MANUAL: '教师上传',
  SYSTEM: '学校系统导入',
  AI_SEARCH: 'AI 搜索',
  MULTI_AGENT_AI: '多智能体生成',
};

// 每个取值只属于三层来源中的一层
export const SOURCE_TYPE_LAYER: Record<SourceTypeCode, SourceLayer> = {
  MANUAL: 'TEACHER',
  SYSTEM: 'SCHOOL',
  AI_SEARCH: 'AI',
  MULTI_AGENT_AI: 'AI',
};

export function normalizeSourceType(raw: unknown): SourceTypeCode {
  const v = String(raw ?? '').trim().toUpperCase();
  if ((SOURCE_TYPE_CODES as readonly string[]).includes(v)) return v as SourceTypeCode;
  if (v === 'EXTERNAL') return 'SYSTEM'; // 旧写法:外部系统对接
  return 'MANUAL'; // 其余(含误写的模板名)都是人工上传的材料
}

export const isAISource = (raw: unknown) => SOURCE_TYPE_LAYER[normalizeSourceType(raw)] === 'AI';
