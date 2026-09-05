const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T07 学情分析报告 (Academic Analysis) data...');

  const t07Data = {
    courseName: '包装机械设计',
    cohort: '2024级 秋季学期',
    overallEvaluation: '整体学习态度端正，出勤率及作业提交率达98%，但在面对真实的、包含噪声干扰的工程环境时，将书本理论转化为解决实际问题路径的能力明显不足。',
    strengths: '对核心机械机构的运动学分析、三维数字孪生建模（支撑Obj-1）掌握较好，部分学生能利用仿真软件进行运动干涉检验。',
    weaknesses: '在涉及弱电信号干扰、接地网络布局等跨学科知识点时，普遍存在理论短板（支撑Obj-2的达成度偏低）。排故逻辑过度依赖随机尝试，缺乏系统性的信号追踪意识。',
    handoverSuggestions: '向后续核心课《机电系统综合设计》发出的交接棒：建议该课程在首周增设“复杂电磁环境下的信号干扰与屏蔽实操”，将“接地抗干扰”作为必考指标，以修复本届学生的系统性短板。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T07' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t07Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T07',
        sourceType: '学情分析报告',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t07Data)
      }
    });
  }

  console.log('✅ T07 Seed completed for course:', t07Data.courseName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
