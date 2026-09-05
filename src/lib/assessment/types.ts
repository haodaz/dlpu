/**
 * 测评功能共享类型
 * 前端组件与后端 API 均引用此文件，禁止各自重复定义
 */

/** 单个测评类型（与 v1 server.js ASSESSMENT_TYPES 的键名对应） */
export interface AssessmentType {
  /** 测评唯一 ID，如 'career_major' */
  id: string;
  /** 显示名称，如 '专业选择测评' */
  name: string;
  /** emoji 图标 */
  icon: string;
  /** 简短介绍（Picker 里显示） */
  intro: string;
}

/** 每只猫猫支持的测评类型映射 */
export type CatAssessmentTypes = Record<string, AssessmentType[]>;

/** v1 /api/assessment-intro/:typeId 的响应结构 */
export interface AssessmentIntroResponse {
  typeId: string;
  name: string;
  icon: string;
  intro: string;
  /** 引导卡片的完整介绍文案（可被后台管理员覆盖） */
  openingIntro: string;
}

/** <zj_report> 标签解析后的报告数据结构 */
export interface AssessmentReportData {
  type: string;
  title: string;
  /** AI 生成的 JSON 报告内容（结构因测评类型而异） */
  content: Record<string, unknown>;
}

/** 解析 <zj_report> 标签的返回值 */
export interface ParsedDashTags {
  /** 去掉 zj_report 标签后的纯文本 */
  html: string;
  /** 解析到的报告数据（可能为空） */
  report: AssessmentReportData | null;
}
