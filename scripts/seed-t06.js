const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T06 过程性评价记录 (Process Evaluation) data...');

  const t06Data = {
    courseName: '包装机械设计',
    evaluationType: '项目实训答辩',
    evaluationBatch: '第10周 - 灌装线排故项目',
    mappedObjectives: ['Obj-2: 独立排查总线掉线故障'],
    averageScore: 88,
    passRate: 95,
    contentDescription: '给定电磁干扰工况，要求学生利用万用表和示波器定位总线断点并恢复通信，最后通过答辩说明排故逻辑。',
    academicWarning: '发现部分学生（约30%）对屏蔽层接地的概念模糊，仅靠尝试法盲目更换接线，导致排故耗时过长，未能体现出理论指导实践的能力。',
    teacherIntervention: '在第11周的理论课上集中串讲了工业现场的接地规范，并补充了接地不良的对比实验，要求之前排故耗时过长的学生重新撰写排故逻辑报告。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T06' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t06Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T06',
        sourceType: '过程性评价记录',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t06Data)
      }
    });
  }

  console.log('✅ T06 Seed completed for course:', t06Data.courseName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
