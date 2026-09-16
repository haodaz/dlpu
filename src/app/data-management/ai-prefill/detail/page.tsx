'use client';
import React, { Suspense, useState, useMemo } from 'react';
import { Button, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  RobotOutlined,
  GlobalOutlined,
  CloudUploadOutlined,
  InfoCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import { indicators, getDimension, getAIActionsByIndicator } from '@/lib/indicators';

// ---------- 数据结构 ----------
type ActionSourceType = 'upload' | 'ai-prefill' | 'external';
type ActionContentType = 'table' | 'list' | 'text' | 'kv';
type ActionStatus = 'pending' | 'confirmed' | 'modified' | 'skipped';

interface ActionSource {
  type: ActionSourceType;
  label: string; // 如 "我的上传：2024年课程列表.xlsx"
}

interface AIActionDetail {
  id: string;
  name: string;
  sources: ActionSource[];
  confidence: 'high' | 'medium' | 'low';
  confidenceNote?: string; // 置信度说明，如 "关键词匹配，可能误配"
  contentType: ActionContentType;
  content: string; // markdown 文本
  aiExplanation: string; // AI预填说明
  actions: ('confirm' | 'modify' | 'delete' | 'supplement' | 'adopt' | 'skip' | 'explain')[];
  defaultStatus?: ActionStatus;
}

interface IndicatorActionsData {
  indicatorId: string;
  confirmRole: '教师确认' | '管理员确认' | '管理员确认异常';
  actions: AIActionDetail[];
}

// ---------- Mock 数据：17 项指标的 AI 预填动作 ----------
const indicatorActionsData: Record<string, IndicatorActionsData> = {
  '1.1.2': {
    indicatorId: '1.1.2',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.1.2-1',
        name: '课程-产业链映射矩阵生成',
        sources: [
          { type: 'upload', label: '我的上传：2026年课程列表.xlsx' },
          { type: 'ai-prefill', label: 'AI预填：1.1.1 产业白皮书（产业链节点清单）' },
        ],
        confidence: 'medium',
        confidenceNote: '关键词匹配，可能误配',
        contentType: 'table',
        content:
          '| 课程名称 | 课程类型 | AI建议对应产业链节点 |\n|---|---|---|\n| 机器人控制技术 | 核心 | 中游-运动控制系统 |\n| PLC应用技术 | 核心 | 中游-自动化控制 |\n| 工业机器人编程 | 核心 | 中游-机器人本体 |\n| 智能制造导论 | 核心 | 上游-智能装备（低置信度）|\n| 机械制图 | 非核心 | 不直接对应 |\n| 液压与气动 | 核心 | 上游-传动系统 |',
        aiExplanation:
          '基于 1.1.1 产业白皮书中的产业链节点清单，对您上传的课程列表中的核心课程，用关键词匹配和语义相似度自动配对。匹配结果可能存在误配，建议逐门核对。',
        actions: ['confirm', 'modify', 'delete', 'supplement'],
      },
    ],
  },

  '1.2.1': {
    indicatorId: '1.2.1',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.2.1-1',
        name: '前沿来源建议',
        sources: [{ type: 'external', label: '外部数据（Crossref / 知识产权局 / 国家标准网）' }],
        confidence: 'medium',
        confidenceNote: 'AI 主动搜索建议，未经验证',
        contentType: 'list',
        content:
          '论文 DOI：10.1234/abcd.2024.001\n专利号：CN202410123456.7\n标准号：GB/T 12345-2024',
        aiExplanation:
          'AI 基于专业方向和课程大纲关键词，从 Crossref、国家知识产权局、国家标准网搜索最新论文、专利和标准，作为前沿技术来源建议。',
        actions: ['adopt', 'skip'],
      },
      {
        id: '1.2.1-2',
        name: '前沿来源验证',
        sources: [{ type: 'external', label: '外部数据（Crossref / 知识产权局 / 国家标准网）' }],
        confidence: 'high',
        contentType: 'list',
        content:
          'DOI：10.1234/abcd.2024.001 → ✅ 验证通过\n  论文：Robotics Control... 2024\n专利号：CN202410123456.7 → ✅ 验证通过\n  专利：一种工业机器人控制方法\n标准号：GB/T 12345-2010 → ❌ 已废止\n  说明：已被 GB/T 12345-2024 替代',
        aiExplanation:
          '对您填写或采纳的前沿来源编号，逐一调外部数据库验证真实性。验证失败的编号不计入"前沿课"比例。',
        actions: ['confirm', 'modify', 'supplement'],
        defaultStatus: 'pending',
      },
      {
        id: '1.2.1-3',
        name: '教材 ISBN 出版年份查询',
        sources: [
          { type: 'upload', label: '我的上传：教材使用清单.xlsx' },
          { type: 'external', label: '外部数据（ISBN查询）' },
        ],
        confidence: 'high',
        contentType: 'list',
        content:
          '教材《工业机器人技术》ISBN 978-7-111-12345-6 → 2023年出版（近3年）✅\n教材《PLC编程基础》ISBN 978-7-111-67890-1 → 2018年出版（超3年）❌',
        aiExplanation:
          '拿您上传的教材清单中的 ISBN 号，查询国家新闻出版总署数据库获取出版年份。近 3 年出版的教材计入"近3年教材"比例。',
        actions: ['confirm', 'modify'],
        defaultStatus: 'confirmed',
      },
    ],
  },

  '2.3.1': {
    indicatorId: '2.3.1',
    confirmRole: '管理员确认异常',
    actions: [
      {
        id: '2.3.1-1',
        name: '出勤率统计',
        sources: [{ type: 'upload', label: '我的上传：课程平台行为日志.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '出勤率：88%（应到 1200 人次，实到 1056）',
        aiExplanation: '直接从课程平台行为日志统计，无需 AI 推断。',
        actions: ['confirm'],
        defaultStatus: 'confirmed',
      },
      {
        id: '2.3.1-2',
        name: '作业提交率统计',
        sources: [{ type: 'upload', label: '我的上传：课程平台行为日志.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '作业提交率：85%（应提交 800 份，实提交 680 份）',
        aiExplanation: '直接从课程平台行为日志统计。',
        actions: ['confirm'],
        defaultStatus: 'confirmed',
      },
      {
        id: '2.3.1-3',
        name: '资源访问频次统计',
        sources: [{ type: 'upload', label: '我的上传：课程平台行为日志.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '平均每人每周访问资源：3.2 次',
        aiExplanation: '直接从课程平台行为日志统计。',
        actions: ['confirm'],
        defaultStatus: 'confirmed',
      },
      {
        id: '2.3.1-4',
        name: '平台活跃度统计',
        sources: [{ type: 'upload', label: '我的上传：课程平台行为日志.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '平均每人每周登录 4.5 次 × 在线 30 分钟',
        aiExplanation: '直接从课程平台行为日志统计。',
        actions: ['confirm'],
        defaultStatus: 'confirmed',
      },
      {
        id: '2.3.1-5',
        name: '异常检测',
        sources: [{ type: 'upload', label: '我的上传：课程平台行为日志.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content:
          '⚠ 异常：每周出勤率精确到 95.0%，真实打卡数据应有波动，标记存疑\n⚠ 异常：某班 45 人，38 人提交作业时间集中在 22:58-23:00',
        aiExplanation:
          '自动检测数据异常：出勤率精确不变疑似手动填报、批量提交时间集中疑似代做、跨数据矛盾。异常数据标记"存疑"不参与评分，管理员需说明原因。',
        actions: ['explain'],
        defaultStatus: 'pending',
      },
    ],
  },

  '1.1.1': {
    indicatorId: '1.1.1',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.1.1-1',
        name: '产业生命周期判定',
        sources: [
          { type: 'ai-prefill', label: 'AI预填：行业协会 2024 年度报告' },
          { type: 'external', label: '外部数据：政府统计年鉴' },
        ],
        confidence: 'medium',
        confidenceNote: 'AI 基于公开数据推断，教师需核对本地产业阶段',
        contentType: 'kv',
        content:
          '产业：轻工包装自动化装备产业\n阶段：成长期（全国年增长率 8.5%）\n依据：中国包装联合会 2024 年度报告',
        aiExplanation: 'AI 搜索全国公开数据推断产业阶段。全国数据可能与本地产业阶段不一致，教师需修正为学校服务区域的实际情况。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '1.1.1-2',
        name: '产业链图谱整理',
        sources: [
          { type: 'external', label: '外部数据：上市企业年报' },
          { type: 'external', label: '外部数据：行业协会官网' },
        ],
        confidence: 'medium',
        confidenceNote: '全国产业链节点，需补充本地企业',
        contentType: 'list',
        content:
          '上游（核心零部件）：伺服电机与驱动系统、精密减速器、工业传感器与 PLC\n中游（本体制造与集成）：包装机械本体装配、机电系统集成与调试\n下游（应用与服务）：食品饮料产线应用、售后技术支持',
        aiExplanation: '从上市企业年报、行业协会整理全国产业链节点结构。教师需补充本地产业链特点和本地合作企业。',
        actions: ['confirm', 'modify', 'supplement'],
      },
      {
        id: '1.1.1-3',
        name: '岗位清单提取',
        sources: [{ type: 'external', label: '外部数据：招聘网站公开数据（猎聘/智联）' }],
        confidence: 'low',
        confidenceNote: '基于关键词匹配，岗位名称可能不准',
        contentType: 'list',
        content:
          '上游：电机驱动控制工程师、传动结构设计工程师、底层逻辑编程工程师\n中游：机械本体装配工程师、系统集成调试工程师\n下游：产线运维工程师、技术支持工程师',
        aiExplanation: '从招聘网站用关键词匹配提取岗位清单。可能漏匹配或误匹配，建议逐岗核对并补充本地企业特有岗位。',
        actions: ['confirm', 'modify', 'supplement', 'delete'],
      },
    ],
  },

  '1.1.3': {
    indicatorId: '1.1.3',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.1.3-1',
        name: '课程目标-岗位能力匹配',
        sources: [
          { type: 'upload', label: '我的上传：课程大纲.docx' },
          { type: 'ai-prefill', label: 'AI预填：1.1.1 产业白皮书（岗位能力清单）' },
        ],
        confidence: 'medium',
        confidenceNote: '语义匹配，可能存在歧义',
        contentType: 'table',
        content:
          '| 课程目标 | AI建议岗位能力编号 | 匹配度 |\n|---|---|---|\n| Obj-1 掌握包装机械机构学原理 | HC-03 机械结构设计 | 92% |\n| Obj-2 完成机械传动结构设计 | HC-05 传动系统设计 | 88% |\n| Obj-3 现场联调及故障处理 | HC-08 系统集成调试 | 85% |\n| Obj-4 阅读英文技术文档 | HC-12 技术文档阅读 | 75% |',
        aiExplanation: '从课程大纲用 NLP 提取课程目标条目，与 1.1.1 白皮书岗位能力清单做语义匹配，建议每条目标对应的岗位能力编号。',
        actions: ['confirm', 'modify', 'delete', 'supplement'],
      },
    ],
  },

  '1.2.2': {
    indicatorId: '1.2.2',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.2.2-1',
        name: '综合验证课程识别',
        sources: [{ type: 'upload', label: '我的上传：培养方案.xlsx' }],
        confidence: 'medium',
        confidenceNote: '基于课程名称关键词，可能漏识别',
        contentType: 'table',
        content:
          '| 课程名称 | AI判定类型 | 判定依据 |\n|---|---|---|\n| 电子实训 | 综合验证课 | 含"实训"关键词 |\n| 课程设计（包装机械） | 综合验证课 | 含"课程设计"关键词 |\n| 综合实训 | 综合验证课 | 含"综合实训"关键词 |\n| 毕业设计 | 综合验证课 | 含"毕业设计"关键词 |\n| 机械设计 | 非验证课 | 无匹配关键词 |',
        aiExplanation: '扫描培养方案中的课程列表，根据课程类型和名称模式（实训/课程设计/毕业设计/项目实践等关键词）识别综合验证课程。可能漏识别或误识别。',
        actions: ['confirm', 'modify', 'supplement', 'delete'],
      },
      {
        id: '1.2.2-2',
        name: '递进阶段推断',
        sources: [{ type: 'upload', label: '我的上传：培养方案.xlsx' }],
        confidence: 'medium',
        confidenceNote: '根据开课学期推断，可能不准',
        contentType: 'table',
        content:
          '| 课程名称 | 开课学期 | AI推断阶段 |\n|---|---|---|\n| 电子实训 | 第2学期 | 基础 |\n| 课程设计（包装机械） | 第4学期 | 进阶 |\n| 综合实训 | 第6学期 | 综合 |\n| 毕业设计 | 第8学期 | 实战 |',
        aiExplanation: '根据综合验证课的开课学期和前置课程信息，推断递进阶段（基础→进阶→综合→实战）。',
        actions: ['confirm', 'modify'],
      },
    ],
  },

  '1.2.3': {
    indicatorId: '1.2.3',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.2.3-1',
        name: '选题来源真实性验证',
        sources: [
          { type: 'upload', label: '我的上传：毕业设计选题清单.xlsx' },
          { type: 'upload', label: '我的上传：校企横向课题清单.xlsx' },
        ],
        confidence: 'high',
        contentType: 'table',
        content:
          '| 选题名称 | 选题来源标记 | 合同验证结果 |\n|---|---|---|\n| XX企业产线视觉检测系统 | 企业项目 | ✅ 匹配合同 HY-2024-001 |\n| 柔性包装智能识别算法研究 | 自拟 | ⚠ 建议核实 |\n| 工业机器人运维系统开发 | 科研项目 | ✅ 匹配纵向课题 ZK-2023-005 |',
        aiExplanation: '拿选题清单中标记"企业项目"的选题，在横向课题库中按项目名称关键词匹配，验证真实性。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '1.2.3-2',
        name: '真题真做标注',
        sources: [{ type: 'ai-prefill', label: 'AI预填：基于选题来源验证结果' }],
        confidence: 'high',
        contentType: 'kv',
        content: '真题真做比例：6/9 = 67%',
        aiExplanation: '根据上一步选题来源验证结果，自动计算"真题真做"比例。',
        actions: ['confirm'],
      },
      {
        id: '1.2.3-3',
        name: '企业导师/验收签章统计',
        sources: [
          { type: 'upload', label: '我的上传：企业导师指导记录.docx' },
          { type: 'upload', label: '我的上传：企业验收签章.pdf' },
        ],
        confidence: 'high',
        contentType: 'kv',
        content: '企业导师参与率：5/6 = 83%\n企业验收覆盖率：6/6 = 100%',
        aiExplanation: '扫描上传的指导记录和签章文件，统计企业导师参与率和验收覆盖率。',
        actions: ['confirm', 'modify'],
      },
    ],
  },

  '1.3.1': {
    indicatorId: '1.3.1',
    confirmRole: '教师确认',
    actions: [
      {
        id: '1.3.1-1',
        name: '国际标准编号提取',
        sources: [{ type: 'upload', label: '我的上传：专业建设方案.docx' }],
        confidence: 'high',
        contentType: 'list',
        content: 'ABET EAC 2024-2025\nCDIO Syllabus 2.0',
        aiExplanation: '从专业建设方案中提取具体的国际标准名称和编号。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '1.3.1-2',
        name: '标准编号验证',
        sources: [{ type: 'external', label: '外部数据：ABET 官网 / CDIO 官网' }],
        confidence: 'high',
        contentType: 'list',
        content: 'ABET EAC 2024-2025 → ✅ 验证通过\nCDIO Syllabus 2.0 → ✅ 验证通过',
        aiExplanation: '在国际标准官网验证提取的标准编号是否真实存在。',
        actions: ['confirm'],
      },
      {
        id: '1.3.1-3',
        name: 'AI三维能力覆盖检测',
        sources: [{ type: 'upload', label: '我的上传：课程大纲.docx' }],
        confidence: 'medium',
        confidenceNote: '基于关键词检测，可能误判',
        contentType: 'table',
        content:
          '| 课程名称 | 提问能力 | 信息判断 | 意义创造 |\n|---|---|---|---|\n| 控制系统工程 | ✓ 含"讨论""探究" | ✓ 含"信息甄别" | ✓ 含"设计" |\n| 工业机器人编程 | ✓ 含"案例讨论" | ✗ 未检测到 | ✓ 含"项目设计" |\n| 机械制图 | ✗ 未检测到 | ✗ 未检测到 | ✗ 未检测到 |',
        aiExplanation: '通过大纲文本关键词检测 AI 三维能力覆盖：提问能力（讨论/探究）、信息判断（信息甄别/多源比对）、意义创造（创造/设计/构建）。可能误判关键词含义。',
        actions: ['confirm', 'modify'],
      },
    ],
  },

  '2.1.1': {
    indicatorId: '2.1.1',
    confirmRole: '教师确认',
    actions: [
      {
        id: '2.1.1-1',
        name: '课题与产业方向匹配',
        sources: [
          { type: 'upload', label: '我的上传：横向课题清单.xlsx' },
          { type: 'ai-prefill', label: 'AI预填：1.1.1 产业白皮书（核心产业方向）' },
        ],
        confidence: 'medium',
        confidenceNote: '关键词匹配，可能漏匹配',
        contentType: 'table',
        content:
          '| 课题名称 | 负责人 | 与核心产业相关 |\n|---|---|---|\n| XX企业视觉检测系统开发 | 张老师 | ✅ 核心产业 |\n| 工业机器人控制算法优化 | 李老师 | ✅ 核心产业 |\n| 智能物流系统设计 | 王老师 | ⚠ 需确认是否属于核心产业 |',
        aiExplanation: '从横向课题清单提取领域关键词，与 1.1.1 白皮书核心产业方向匹配，判断课题是否聚焦核心产业链。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '2.1.1-2',
        name: '转化案例搜索',
        sources: [{ type: 'upload', label: '我的上传：教学案例文档.docx' }],
        confidence: 'medium',
        contentType: 'list',
        content: '匹配到 2 份署名案例：\n视觉检测教学案例（张老师）\n工业机器人调试案例（李老师）',
        aiExplanation: '在教学案例库搜索教师署名的案例文档。',
        actions: ['confirm', 'supplement'],
      },
      {
        id: '2.1.1-3',
        name: '案例引用检测',
        sources: [{ type: 'upload', label: '我的上传：课程大纲.docx' }],
        confidence: 'medium',
        contentType: 'list',
        content: '张老师 → 案例引用 ✓（机器视觉技术大纲第3章）\n李老师 → 案例引用 ✓（工业机器人编程大纲第5章）\n王老师 → 有课题无转化案例 ⚠',
        aiExplanation: '在课程大纲中搜索案例名称或相关关键词，检测是否被引用。',
        actions: ['confirm'],
      },
    ],
  },

  '2.1.2': {
    indicatorId: '2.1.2',
    confirmRole: '教师确认',
    actions: [
      {
        id: '2.1.2-1',
        name: '大纲版本 diff 检测',
        sources: [{ type: 'upload', label: '我的上传：课程大纲 v1 / v2' }],
        confidence: 'high',
        contentType: 'table',
        content:
          '| 课程名称 | v2 新增/修改内容 | AI相关 |\n|---|---|---|\n| 机器视觉技术 | 新增"AI 缺陷检测"章节 | ✅ |\n| 工业机器人编程 | 修改第3章案例，引入"AI 辅助调试" | ✅ |\n| 机械制图 | 无 AI 相关修改 | ❌ |',
        aiExplanation: '对比新旧两版课程大纲，检测 AI 相关关键词的新增或修改。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '2.1.2-2',
        name: 'AI 平台使用统计',
        sources: [{ type: 'upload', label: '我的上传：AI 教学平台教师使用日志.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '有 AI 平台使用记录的教师：12/15 = 80%\n平均每人登录 45 次，使用 12 个 AI 功能',
        aiExplanation: '统计 AI 教学平台教师登录次数和功能使用类型。',
        actions: ['confirm'],
      },
      {
        id: '2.1.2-3',
        name: '教案产出物检查',
        sources: [{ type: 'upload', label: '我的上传：教案文档.docx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '有学生 AI 产出物要求的教案：8/12 = 67%',
        aiExplanation: '检查教案中是否有明确的学生 AI 产出物要求。',
        actions: ['confirm', 'supplement'],
      },
      {
        id: '2.1.2-4',
        name: '培训统计',
        sources: [{ type: 'upload', label: '我的上传：AI 培训完成记录.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '完成 AI 培训并产出实际成果的教师：10/15 = 67%\n产出物：智能助手配置 6 份、知识图谱 3 份、课程改造方案 1 份',
        aiExplanation: '统计教师 AI 培训完成比例和实际产出情况。',
        actions: ['confirm'],
      },
    ],
  },

  '2.2.1': {
    indicatorId: '2.2.1',
    confirmRole: '教师确认',
    actions: [
      {
        id: '2.2.1-1',
        name: '职业指引帖文识别',
        sources: [{ type: 'upload', label: '我的上传：课程平台互动数据.xlsx' }],
        confidence: 'medium',
        confidenceNote: '基于语义分类，通知和指引可能混淆',
        contentType: 'table',
        content:
          '| 教师 | 帖文数量 | AI判定"职业指引" | 示例 |\n|---|---|---|---|\n| 王老师 | 12 | 4 | "智能制造行业职业路径" |\n| 李老师 | 8 | 1 | "实验室安全须知"（通知类）|\n| 张老师 | 15 | 5 | "从技术员到工程师的成长" |',
        aiExplanation: '用语义分类检测教师帖文内容，区分"职业指引"类内容与普通通知。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '2.2.1-2',
        name: '学习计划提交率统计',
        sources: [{ type: 'upload', label: '我的上传：课程平台互动数据.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '提交学习计划的学生比例：92%（110/120）',
        aiExplanation: '直接统计，无需 AI 推断。',
        actions: ['confirm'],
      },
      {
        id: '2.2.1-3',
        name: '课程依赖矩阵校验',
        sources: [{ type: 'upload', label: '我的上传：培养方案.xlsx' }],
        confidence: 'medium',
        contentType: 'kv',
        content: '课程依赖矩阵完整性：基本完整，2 门课程前置关系待确认',
        aiExplanation: '从培养方案提取课程前置关系，校验依赖矩阵完整性。',
        actions: ['confirm', 'supplement'],
      },
      {
        id: '2.2.1-4',
        name: '问答响应率计算',
        sources: [{ type: 'upload', label: '我的上传：课程平台互动数据.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '学生提问 85 次 / 教师回复 72 次 → 响应率 85%',
        aiExplanation: '直接统计问答区提问和回复数量。',
        actions: ['confirm'],
      },
      {
        id: '2.2.1-5',
        name: '学生问题纳入修订 diff 检测',
        sources: [
          { type: 'upload', label: '我的上传：课程大纲 v1 / v2' },
          { type: 'ai-prefill', label: 'AI预填：基于问答区高频问题' },
        ],
        confidence: 'medium',
        confidenceNote: '语义改写可能检测不到',
        contentType: 'kv',
        content: '检测到 3 条学生高频问题在新版大纲中被回应',
        aiExplanation: '对比新版大纲内容与上学期问答区高频问题，用语义匹配检测学生问题是否纳入修订。',
        actions: ['confirm', 'supplement'],
      },
    ],
  },

  '2.3.2': {
    indicatorId: '2.3.2',
    confirmRole: '教师确认',
    actions: [
      {
        id: '2.3.2-1',
        name: '目标-考核映射矩阵构建',
        sources: [{ type: 'upload', label: '我的上传：课程目标列表 + 考核任务列表.xlsx' }],
        confidence: 'high',
        contentType: 'table',
        content:
          '| 课程目标 | 关联考核任务 | 覆盖 |\n|---|---|---|\n| Obj-1 掌握机构学原理 | 期末试卷(50%) | ✓ |\n| Obj-2 完成传动设计 | 项目答辩(30%) | ✓ |\n| Obj-3 现场联调排故 | 平时作业(20%) | ✓ |',
        aiExplanation: '自动构建课程目标与考核任务的映射矩阵。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '2.3.2-2',
        name: '映射覆盖率计算',
        sources: [{ type: 'ai-prefill', label: '基于上一步映射矩阵' }],
        confidence: 'high',
        contentType: 'kv',
        content: '映射覆盖率：100%（5 条目标全部关联考核任务）',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
      {
        id: '2.3.2-3',
        name: '考核种类统计',
        sources: [{ type: 'upload', label: '我的上传：考核任务列表.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '考核种类：3 种（考试 / 报告 / 项目答辩）',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
      {
        id: '2.3.2-4',
        name: '反馈时间差计算',
        sources: [{ type: 'upload', label: '我的上传：考核任务列表.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '平均反馈时间差：5 天（≤ 7 天合格线）',
        aiExplanation: '直接统计提交时间和反馈时间差。',
        actions: ['confirm'],
      },
      {
        id: '2.3.2-5',
        name: '闭环检测',
        sources: [{ type: 'upload', label: '我的上传：达成度报告 + 新版大纲' }],
        confidence: 'medium',
        confidenceNote: '语义匹配，可能检测不到改写',
        contentType: 'kv',
        content: '改进措施闭环率：2/3 = 67%\n→ 改进1、2已在新版大纲落实\n→ 改进3"总线排故考核"未检测到落实',
        aiExplanation: '对比达成度报告的改进措施与新版大纲，用语义匹配+关键词检测闭环落实率。',
        actions: ['confirm', 'supplement'],
      },
    ],
  },

  '3.1.1': {
    indicatorId: '3.1.1',
    confirmRole: '管理员确认异常',
    actions: [
      {
        id: '3.1.1-1',
        name: '实验开出率计算',
        sources: [
          { type: 'upload', label: '我的上传：设备台账.xlsx' },
          { type: 'upload', label: '我的上传：实验开出记录.xlsx' },
        ],
        confidence: 'high',
        contentType: 'kv',
        content: '实验开出率：90%（培养方案要求 20 个，实际开出 18 个）',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
      {
        id: '3.1.1-2',
        name: '设备完好率计算',
        sources: [{ type: 'upload', label: '我的上传：设备台账.xlsx' }],
        confidence: 'high',
        contentType: 'kv',
        content: '设备完好率：96%（100 台设备中 96 台正常）',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
      {
        id: '3.1.1-3',
        name: '课程支撑率计算',
        sources: [
          { type: 'upload', label: '我的上传：设备台账.xlsx' },
          { type: 'upload', label: '我的上传：实验开出记录.xlsx' },
        ],
        confidence: 'high',
        contentType: 'kv',
        content: '课程支撑率：89%（需设备的 18 个实验中，16 个有对应设备）',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
      {
        id: '3.1.1-4',
        name: 'AI 平台核心课程接入率统计',
        sources: [{ type: 'upload', label: '我的上传：AI 平台建设说明 + 课程接入清单' }],
        confidence: 'high',
        contentType: 'kv',
        content: '核心课程接入 AI 平台比例：75%（15/20）',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
      {
        id: '3.1.1-5',
        name: '异常检测',
        sources: [
          { type: 'upload', label: '我的上传：设备台账.xlsx' },
          { type: 'upload', label: '我的上传：实验开出记录.xlsx' },
        ],
        confidence: 'high',
        contentType: 'list',
        content:
          '⚠ 异常：50 台设备在实验使用记录中出现次数为 0（疑似闲置或台账未更新）\n⚠ 异常：实验"工业机器人编程实操"标记"已开出"但无设备使用记录',
        aiExplanation: '自动检测：设备有台账但从未使用；实验标记开出但无设备记录；设备购入超 10 年仍标"正常"。',
        actions: ['explain'],
      },
    ],
  },

  '3.1.2': {
    indicatorId: '3.1.2',
    confirmRole: '教师确认',
    actions: [
      {
        id: '3.1.2-1',
        name: '项目来源检查',
        sources: [{ type: 'upload', label: '我的上传：教学环节清单.xlsx' }],
        confidence: 'medium',
        confidenceNote: '教师自标，可能不准',
        contentType: 'table',
        content:
          '| 教学环节 | 项目来源标记 | 合同编号 |\n|---|---|---|\n| 视觉检测系统设计 | 企业项目 | HY-2024-001 |\n| 自动化产线集成 | 企业项目 | HY-2024-003 |\n| 液压系统实训 | 无 | - |',
        aiExplanation: '检查教学环节的项目来源标记和合同编号填写情况。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '3.1.2-2',
        name: '合同验证',
        sources: [{ type: 'upload', label: '我的上传：企业合作合同清单.xlsx' }],
        confidence: 'high',
        contentType: 'list',
        content:
          'HY-2024-001 → ✅ 合同真实有效\nHY-2024-002 → ✅ 合同真实有效\nHY-2023-005 → ⚠ 已过期',
        aiExplanation: '用项目编号在合同清单中验证合同真实性和有效性。',
        actions: ['confirm'],
      },
      {
        id: '3.1.2-3',
        name: '签章检查',
        sources: [{ type: 'upload', label: '我的上传：企业验收签章文件.pdf' }],
        confidence: 'high',
        contentType: 'kv',
        content: '有交付物签章的环节：6/8 = 75%',
        aiExplanation: '检查上传的签章文件是否覆盖所有标记"企业项目"的教学环节。',
        actions: ['confirm', 'supplement'],
      },
      {
        id: '3.1.2-4',
        name: '真实项目比例计算',
        sources: [{ type: 'ai-prefill', label: '基于前三步检查结果' }],
        confidence: 'high',
        contentType: 'kv',
        content: '有合同+签章+企业指导 = 真实项目：6/10 = 60%',
        aiExplanation: '综合合同验证、签章检查、企业指导记录计算真实项目比例。',
        actions: ['confirm'],
      },
    ],
  },

  '4.1.1': {
    indicatorId: '4.1.1',
    confirmRole: '管理员确认',
    actions: [
      {
        id: '4.1.1-1',
        name: '岗位与白皮书信息匹配',
        sources: [
          { type: 'upload', label: '我的上传：毕业生就业数据.xlsx' },
          { type: 'ai-prefill', label: 'AI预填：1.1.1 产业白皮书（核心岗位关键词）' },
        ],
        confidence: 'medium',
        confidenceNote: '边界岗位需人工判断',
        contentType: 'table',
        content:
          '| 毕业生 | 岗位 | 就业单位 | AI判定对口 |\n|---|---|---|---|\n| 张三 | 调试工程师 | XX机器人公司 | ✅ 对口 |\n| 李四 | 运维工程师 | XX包装机械 | ✅ 对口 |\n| 王五 | 销售工程师 | XX自动化 | ⚠ 边界 |\n| 赵六 | 技术员 | XX物流公司 | ❌ 非对口 |',
        aiExplanation: '把每个毕业生的岗位+单位，与 1.1.1 白皮书的核心产业方向和关键岗位关键词匹配，判断是否对口就业。销售工程师等边界岗位需管理员人工判断。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '4.1.1-2',
        name: '对口就业率计算',
        sources: [{ type: 'ai-prefill', label: '基于上一步匹配结果' }],
        confidence: 'high',
        contentType: 'kv',
        content: '对口就业率：78/98 = 79.6%',
        aiExplanation: '直接统计。',
        actions: ['confirm'],
      },
    ],
  },

  '4.1.2': {
    indicatorId: '4.1.2',
    confirmRole: '管理员确认',
    actions: [
      {
        id: '4.1.2-1',
        name: '职位关键词匹配',
        sources: [{ type: 'upload', label: '我的上传：校友职业发展数据.xlsx' }],
        confidence: 'medium',
        confidenceNote: '关键词匹配，可能漏匹配',
        contentType: 'table',
        content:
          '| 校友 | 当前职位 | AI分类 |\n|---|---|---|\n| 陈XX | 主任工程师 | 技术骨干 |\n| 刘XX | 项目经理 | 管理岗 |\n| 周XX | CEO | 创业 |\n| 吴XX | PMP | 高级认证 |\n| 孙XX | 销售 | 未匹配 |',
        aiExplanation: '用关键词匹配校友职位文本：技术骨干、管理岗、创业、高级认证。',
        actions: ['confirm', 'modify'],
      },
      {
        id: '4.1.2-2',
        name: '校友比例计算',
        sources: [{ type: 'ai-prefill', label: '基于上一步分类结果' }],
        confidence: 'high',
        contentType: 'kv',
        content: '骨干/管理/创业/高级认证校友比例：75/200 = 37.5%\n校友数据覆盖率：200/350 = 57%',
        aiExplanation: '直接统计。覆盖率低于 50% 时标注"数据基础不足"。',
        actions: ['confirm'],
      },
    ],
  },

  '4.1.3': {
    indicatorId: '4.1.3',
    confirmRole: '管理员确认',
    actions: [
      {
        id: '4.1.3-1',
        name: '样本量检查',
        sources: [{ type: 'ai-prefill', label: '平台自动发送问卷' }],
        confidence: 'high',
        contentType: 'kv',
        content: '有效问卷 35 份 / 应发送 112 份 → 样本率 31%（≥ 30% 合格）',
        aiExplanation: '检查有效问卷样本量是否满足 ≥ 毕业生总数 30% 的最低要求。',
        actions: ['confirm'],
      },
      {
        id: '4.1.3-2',
        name: '无效问卷剔除',
        sources: [{ type: 'ai-prefill', label: 'AI 自动检测' }],
        confidence: 'high',
        contentType: 'list',
        content:
          '检测到 2 份无效问卷（作答时间 < 60 秒）\n检测到 1 份异常问卷（同 IP + 全选同一选项）\n实际有效问卷：35 份',
        aiExplanation: 'AI 自动剔除作答时间过短、全选同一选项、同 IP 重复提交的无效问卷。',
        actions: ['confirm'],
      },
      {
        id: '4.1.3-3',
        name: '5 维度平均分计算',
        sources: [{ type: 'ai-prefill', label: '基于有效问卷' }],
        confidence: 'high',
        contentType: 'table',
        content:
          '| 维度 | 平均分 |\n|---|---|\n| 专业基础 | 4.2 |\n| 实践能力 | 4.0 |\n| 沟通协作 | 4.1 |\n| 学习能力 | 4.3 |\n| 职业素养 | 4.4 |\n| **综合** | **4.2** |',
        aiExplanation: '计算 5 个维度的平均分和综合平均分。',
        actions: ['confirm'],
      },
    ],
  },
};

// ---------- 工具函数 ----------
function getIndicatorActionsData(indicatorId: string): IndicatorActionsData {
  if (indicatorActionsData[indicatorId]) return indicatorActionsData[indicatorId];

  // 默认：基于 aiPrefillActions 的 actionCount 和 actions 生成占位
  const aiAct = getAIActionsByIndicator(indicatorId);
  const indicator = indicators.find((i) => i.id === indicatorId);
  if (!indicator) return { indicatorId, confirmRole: '教师确认', actions: [] };

  const defaultActions: AIActionDetail[] = (aiAct?.actions || []).map((name, idx) => ({
    id: `${indicatorId}-${idx + 1}`,
    name,
    sources: [
      { type: 'upload', label: '我的上传：相关材料' },
      { type: 'ai-prefill', label: 'AI 自动预填' },
    ],
    confidence: 'medium',
    confidenceNote: 'AI 自动生成，建议核对',
    contentType: 'text',
    content: `AI 已完成「${name}」的预填，请核对内容。`,
    aiExplanation: indicator.dataSourceExplanation || 'AI 基于上传材料自动预填。',
    actions: ['confirm', 'modify', 'supplement'],
  }));

  return {
    indicatorId,
    confirmRole: '教师确认',
    actions: defaultActions,
  };
}

// ---------- 渲染内容 ----------
function renderContent(action: AIActionDetail) {
  if (action.contentType === 'table') {
    const lines = action.content.split('\n');
    const rows = lines.filter((l) => l.trim() && !l.trim().startsWith('|---'));
    const parsedRows = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
    if (parsedRows.length >= 1) {
      const header = parsedRows[0];
      const body = parsedRows.slice(1);
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-slate-50">
                {header.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left font-bold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, i) => (
                <tr key={i} className="hover:bg-blue-50/40">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-2 text-slate-700 border-b border-slate-100">{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }
  if (action.contentType === 'list') {
    const lines = action.content.split('\n').filter((l) => l.trim());
    return (
      <ul className="text-sm text-slate-700 space-y-1.5 m-0 pl-4 list-disc marker:text-purple-400">
        {lines.map((l, i) => (
          <li key={i} className="leading-relaxed">{l}</li>
        ))}
      </ul>
    );
  }
  if (action.contentType === 'kv') {
    const lines = action.content.split('\n').filter((l) => l.trim());
    return (
      <div className="text-sm text-slate-700 space-y-1.5">
        {lines.map((l, i) => {
          const isWarning = l.startsWith('⚠');
          return (
            <div
              key={i}
              className={`${isWarning ? 'bg-amber-50 border-l-2 border-amber-400 pl-3 py-1 -ml-1' : 'leading-relaxed'}`}
            >
              {l}
            </div>
          );
        })}
      </div>
    );
  }
  return <pre className="text-sm text-slate-700 whitespace-pre-wrap m-0 font-sans leading-relaxed">{action.content}</pre>;
}

// ---------- 来源图标 ----------
const sourceIconMap: Record<ActionSourceType, React.ReactNode> = {
  upload: <CloudUploadOutlined className="text-amber-500" />,
  'ai-prefill': <RobotOutlined className="text-purple-500" />,
  external: <GlobalOutlined className="text-cyan-500" />,
};
const sourceColorMap: Record<ActionSourceType, string> = {
  upload: '#d97706',
  'ai-prefill': '#7c3aed',
  external: '#0891b2',
};

// ---------- 动作按钮渲染 ----------
function ActionButton({ type, onClick }: { type: string; onClick: () => void }) {
  const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    confirm: { label: '确认', icon: <CheckCircleOutlined />, className: 'text-green-600 border-green-200 hover:bg-green-50' },
    modify: { label: '修改', icon: <EditOutlined />, className: 'text-blue-600 border-blue-200 hover:bg-blue-50' },
    delete: { label: '删除', icon: <DeleteOutlined />, className: 'text-red-600 border-red-200 hover:bg-red-50' },
    supplement: { label: '补充', icon: <PlusOutlined />, className: 'text-slate-600 border-slate-200 hover:bg-slate-50' },
    adopt: { label: '采用', icon: <CheckCircleOutlined />, className: 'text-green-600 border-green-200 hover:bg-green-50' },
    skip: { label: '不用', icon: <CloseCircleOutlined />, className: 'text-slate-500 border-slate-200 hover:bg-slate-50' },
    explain: { label: '说明原因', icon: <InfoCircleOutlined />, className: 'text-amber-600 border-amber-200 hover:bg-amber-50' },
  };
  const c = config[type];
  if (!c) return null;
  return (
    <button
      onClick={onClick}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${c.className}`}
    >
      {c.icon} {c.label}
    </button>
  );
}

// ---------- 置信度 badge ----------
function ConfidenceBadge({ level, note }: { level: 'high' | 'medium' | 'low'; note?: string }) {
  const config = {
    high: { text: '高', color: '#059669', bg: '#ecfdf5', full: '高（高可信）' },
    medium: { text: '中', color: '#d97706', bg: '#fffbeb', full: note || '中（可能误配）' },
    low: { text: '低', color: '#dc2626', bg: '#fef2f2', full: note || '低（建议重点核对）' },
  }[level];
  return (
    <Tooltip title={config.full}>
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color: config.color, backgroundColor: config.bg }}>
        {level === 'high' ? '🟢' : level === 'medium' ? '🟡' : '🔴'} 置信度 {config.text}
      </span>
    </Tooltip>
  );
}

// ---------- 主内容 ----------
function DetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const indicatorId = searchParams.get('indicator') || '';

  const indicator = useMemo(() => indicators.find((i) => i.id === indicatorId), [indicatorId]);
  const dim = useMemo(() => (indicator ? getDimension(indicator.dimension) : null), [indicator]);
  const data = useMemo(() => getIndicatorActionsData(indicatorId), [indicatorId]);

  // 本地状态
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>(() => {
    const map: Record<string, ActionStatus> = {};
    data.actions.forEach((a) => {
      map[a.id] = a.defaultStatus || 'pending';
    });
    return map;
  });

  const setActionStatus = (actionId: string, status: ActionStatus) => {
    setStatuses((prev) => ({ ...prev, [actionId]: status }));
  };

  // 统计
  const stats = useMemo(() => {
    const pending = Object.values(statuses).filter((s) => s === 'pending').length;
    const confirmed = Object.values(statuses).filter((s) => s === 'confirmed' || s === 'modified').length;
    return {
      total: data.actions.length,
      pending,
      confirmed,
      progress: data.actions.length ? Math.round((confirmed / data.actions.length) * 100) : 0,
    };
  }, [statuses, data.actions.length]);

  if (!indicator || !dim) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50">
        <div className="text-center">
          <div className="text-slate-400 text-base mb-2">未找到该指标</div>
          <button onClick={() => router.push('/data-management/ai-prefill')} className="text-blue-600 text-sm font-bold">
            ← 返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-140px)] bg-slate-50">
      {/* ===== 顶部栏 ===== */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm shrink-0">
        <div className="max-w-6xl mx-auto">
          {/* 第一行：返回 + 指标名 + 权重/维度/确认角色 + 状态 */}
          <div className="flex items-center gap-3 flex-wrap mb-2.5">
            <button onClick={() => router.push('/data-management/ai-prefill')} className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-medium">
              <ArrowLeftOutlined /> 返回
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <span className="font-mono text-xs text-slate-400">{indicator.id}</span>
            <h1 className="font-bold text-xl text-slate-800 m-0">{indicator.name}</h1>
          </div>

          {/* 第二行：meta tags + 动作统计 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              权重 <span className="font-bold text-slate-800 ml-1">{indicator.weight}%</span>
            </span>
            <span
              className="inline-flex items-center text-xs px-2.5 py-1 rounded-md border"
              style={{ backgroundColor: dim.bg, color: dim.color, borderColor: dim.border }}
            >
              <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: dim.color }} />
              维度{dim.key} · {dim.name}
            </span>
            <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              👤 {data.confirmRole}
            </span>

            <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                <ThunderboltOutlined className="mr-1" /> AI预填动作 <span className="font-bold ml-0.5">{stats.total}</span> 个
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                待确认 <span className="font-bold ml-0.5">{stats.pending}</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-green-50 text-green-700 border border-green-200">
                已确认 <span className="font-bold ml-0.5">{stats.confirmed}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== 动作卡片列表 ===== */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-8 py-6 space-y-4 pb-24">
        {data.actions.map((action, idx) => {
          const status = statuses[action.id] || 'pending';
          return (
            <div
              key={action.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* 卡片头部 */}
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                  {idx + 1}
                </div>
                <span className="font-bold text-slate-800 text-base">{action.name}</span>
                <ConfidenceBadge level={action.confidence} note={action.confidenceNote} />
                <span className="ml-auto inline-flex items-center text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    color: status === 'confirmed' ? '#059669' : status === 'modified' ? '#1677ff' : status === 'skipped' ? '#64748b' : '#d97706',
                    backgroundColor: status === 'confirmed' ? '#ecfdf5' : status === 'modified' ? '#eff6ff' : status === 'skipped' ? '#f1f5f9' : '#fffbeb',
                  }}>
                  {status === 'confirmed' ? '已确认' : status === 'modified' ? '已修改' : status === 'skipped' ? '已跳过' : '待确认'}
                </span>
              </div>

              {/* 卡片内容 */}
              <div className="px-5 py-4 space-y-4">
                {/* 来源 */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">来源：</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {action.sources.map((s, i) => (
                      <div key={i} className="inline-flex items-center gap-1.5 text-xs">
                        {sourceIconMap[s.type]}
                        <span className="font-medium" style={{ color: sourceColorMap[s.type] }}>
                          {s.type === 'upload' ? '我的上传' : s.type === 'ai-prefill' ? 'AI预填' : '外部数据'}
                        </span>
                        <span className="text-slate-600">{s.label.split('：').slice(1).join('：') || s.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI 预填内容 */}
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">
                    <span className="inline-flex items-center gap-1">
                      <RobotOutlined className="text-purple-500" /> AI 预填内容
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    {renderContent(action)}
                  </div>
                </div>

                {/* AI 预填说明 */}
                <div className="bg-blue-50/60 rounded-lg p-3 border border-blue-100">
                  <div className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                    <InfoCircleOutlined /> AI 预填说明
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed m-0">{action.aiExplanation}</p>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {action.actions.map((act) => (
                    <ActionButton
                      key={act}
                      type={act}
                      onClick={() => {
                        if (act === 'confirm' || act === 'adopt') setActionStatus(action.id, 'confirmed');
                        else if (act === 'modify') setActionStatus(action.id, 'modified');
                        else if (act === 'delete' || act === 'skip') setActionStatus(action.id, 'skipped');
                        else if (act === 'supplement') setActionStatus(action.id, 'modified');
                        else if (act === 'explain') {
                          // 弹出说明弹窗 TODO
                          setActionStatus(action.id, 'modified');
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== 底部操作栏（sticky） ===== */}
      <div className="fixed bottom-0 left-[220px] right-0 bg-white border-t border-slate-200 px-8 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all" style={{ width: `${stats.progress}%` }} />
              </div>
              <span className="font-bold text-slate-700">{stats.progress}%</span>
            </div>
            <span>
              已处理 <span className="font-bold text-green-600">{stats.confirmed}</span> / {stats.total}，
              待处理 <span className="font-bold text-amber-600">{stats.pending}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => {
              const allConfirmed: Record<string, ActionStatus> = {};
              data.actions.forEach((a) => { allConfirmed[a.id] = 'confirmed'; });
              setStatuses(allConfirmed);
            }}>全部确认</Button>
            <Button icon={<SaveOutlined />}>保存草稿</Button>
            <Button type="primary" icon={<CheckOutlined />}>提交</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIPrefillDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50"><div className="text-slate-400">加载中…</div></div>}>
      <DetailContent />
    </Suspense>
  );
}
