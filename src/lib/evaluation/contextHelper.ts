import type { EvaluationContext } from './types';

/**
 * 根据指标 ID 列表，构建专家使用的指标上下文文本
 * 包含：指标定义（名称、权重）、已确认的填报材料清单及内容摘要
 */
export function buildIndicatorContext(
  context: EvaluationContext,
  indicatorIds: string[]
): { indicatorInfo: string; confirmedMaterials: string; hasData: boolean } {
  const indicators = indicatorIds
    .map((id) => context.indicators.find((i) => i.id === id))
    .filter(Boolean);

  const indicatorInfo = indicators
    .map((ind: any) => `【${ind.id} ${ind.name}】权重 ${ind.weight}%，维度 ${ind.dimension}`)
    .join('\n');

  const items: any[] = [];
  indicatorIds.forEach((id) => {
    (context.indicatorData[id] || []).forEach((item) => {
      if (!items.find((i) => i.id === item.id)) items.push(item);
    });
  });

  const confirmedMaterials = items
    .map((item) => {
      const fields = item.indicatorUsages
        ?.filter((u: any) => indicatorIds.includes(u.indicatorId))
        .flatMap((u: any) => u.usedFields) || [];
      const fieldStr = fields.length > 0 ? `，用到字段：${fields.join('、')}` : '';
      return `- ${item.displayName}（来源：${item.dataSource === 'ai-prefill' ? 'AI 预填' : '我上传'}${fieldStr}）`;
    })
    .join('\n');

  return {
    indicatorInfo,
    confirmedMaterials: confirmedMaterials || '（无已确认数据）',
    hasData: items.length > 0,
  };
}

/** 把评级转换为分数（用于加权计算） */
export function gradeToScore(grade: string): number {
  if (grade.includes('优秀') || grade.includes('卓越')) return 90;
  if (grade.includes('良好')) return 78;
  if (grade.includes('合格')) return 65;
  return 40;
}
