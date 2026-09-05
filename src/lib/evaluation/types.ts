export interface ExpertResult {
  status: string;
  indicator: string;
  criteria: string;
  grade: '优秀' | '良好' | '合格' | '不合格' | string;
  analysis: string;
  suggestions: string;
  chartData?: {
    tags: string[];
    tier: {
      totalTiers: number;
      currentTier: number;
      label: string;
    };
  };
}

export interface EvaluationContext {
  panoramicData: Record<string, any>; // T01-T19 的原始全景数据
}

export interface EvaluationExpert {
  id: string;
  name: string;
  icon: string;
  /**
   * 专家的专属诊断方法
   * @param context 评价上下文（包含所有的全景数据）
   * @param onLog 回调函数，用于实时抛出当前专家的进度状态到前端
   * @returns 返回符合 ExpertResult JSON 结构的判定
   */
  evaluate: (context: EvaluationContext, onLog: (msg: string) => void) => Promise<ExpertResult>;
}
