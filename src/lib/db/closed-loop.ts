// 闭环:评价轮次 + 整改任务(服务端)
import type { PrismaClient } from '@prisma/client';
import { ISSUES, ANNUAL_FOCUS, DEMO_MAJOR, teacherItemOf } from '@/lib/diagnosis';

export const periodOf = (cycleNo: number) => `${2024 + cycleNo}-${2025 + cycleNo} 学年`;

/** 为轮次生成整改任务(由当轮诊断问题派生;已存在的不重复生成) */
export async function createTasksForCycle(db: PrismaClient, cycleId: string) {
  for (const issue of ISSUES) {
    const tpl = teacherItemOf(issue.indicatorId);
    await db.rectificationTask.upsert({
      where: { cycleId_issueId: { cycleId, issueId: issue.id } },
      update: {},
      create: {
        cycleId,
        issueId: issue.id,
        majorId: DEMO_MAJOR.name,
        indicatorId: issue.indicatorId,
        issueDesc: `${issue.title}:${issue.detail}`,
        ownerRole: issue.level,
        assignee: issue.owner,
        standard: issue.action,
        templateUrl: tpl ? `/templates/${tpl.templateId.toLowerCase()}` : null,
        dueDate: issue.due,
      },
    });
  }
}

export async function activeCycle(db: PrismaClient) {
  const c = await db.evaluationCycle.findFirst({ where: { status: 'ACTIVE' }, orderBy: { cycleNo: 'desc' } });
  if (c) return c;
  const last = await db.evaluationCycle.findFirst({ orderBy: { cycleNo: 'desc' } });
  const cycleNo = (last?.cycleNo ?? 0) + 1;
  const created = await db.evaluationCycle.create({
    data: { cycleNo, period: periodOf(cycleNo), focusDimension: ANNUAL_FOCUS, parentCycleId: last?.id ?? null },
  });
  await createTasksForCycle(db, created.id);
  return created;
}

/** 归档当前轮次(记录两大核心指标与整改完成情况),发起下一轮 */
export async function startNextCycle(db: PrismaClient, scores: { consistency?: number; effectiveness?: number }) {
  const cur = await activeCycle(db);
  const tasks = await db.rectificationTask.findMany({ where: { cycleId: cur.id } });
  await db.evaluationCycle.update({
    where: { id: cur.id },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
      consistencyScore: scores.consistency ?? null,
      effectivenessScore: scores.effectiveness ?? null,
      resolvedCount: tasks.filter((t) => t.status === 'done').length,
      totalCount: tasks.length,
    },
  });
  return activeCycle(db);
}
