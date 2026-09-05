const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T05 教案 (Lesson Plan) data...');

  const t05Data = {
    courseName: '包装机械设计',
    chapter: '第五章 灌装设备控制系统',
    duration: 2,
    teachingMethods: ['案例教学', '项目驱动', '翻转课堂'],
    objectives: '1. 知识目标：掌握灌装设备的总线控制原理及常见通信协议。\n2. 能力目标：能够根据故障现象，独立排查总线掉线及电气连接故障。\n3. 重点与难点：重点在于PLC总线配置与网络拓扑分析；难点在于实际排故中的信号追踪。',
    logicalProgression: '在前四章掌握了机械结构与传动原理的基础上，本章转向电气与控制系统。基于学生在先修课《机电传动控制》中的PLC基础，进一步深入到工业现场的总线级应用。',
    industryIntegration: '引入大连某食品厂真实的“灌装线总线掉线排故实训箱”作为横向课题衍生的教学案例。学生需要在还原的工业场景中，诊断因电磁干扰导致的总线间歇性掉线问题。',
    studentDeliverables: '学生需在课后提交：\n1. 故障排查逻辑思维导图\n2. 修复后的总线通信参数配置截图及说明\n(将作为过程性评价的重要组成部分)',
    aiUsage: '使用AI智能学伴辅助生成电气接线图及常见故障代码手册，学生可通过扫描二维码随时查询工业标准文档，提高排故效率。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T05' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t05Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T05',
        sourceType: '教案 (典型)',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t05Data)
      }
    });
  }

  console.log('✅ T05 Seed completed:', record.name);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
