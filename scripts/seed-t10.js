const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T10 教学资源清单与使用台账 (Teaching Resource Ledger) data...');

  const t10Data = {
    courseName: '包装机械设计',
    syncDate: new Date().toLocaleDateString(),
    equipments: [
      { name: '多功能灌装机实训台', id: 'EQ-88102', value: '45.0万', status: '正常', usageHours: 32, supportTarget: 'Obj-2' },
      { name: '西门子S7-1200 PLC试验箱', id: 'EQ-77314', value: '12.5万', status: '正常', usageHours: 48, supportTarget: 'Obj-1, Obj-2' },
      { name: '高性能伺服系统综合测控台', id: 'EQ-99211', value: '180.0万', status: '正常', usageHours: 0, supportTarget: 'Obj-3' }
    ],
    aiInfrastructure: {
      knowledgeGraph: '已接入 (覆盖率85%)',
      aiTutor: '未启用'
    },
    diagnosis: '设备闲置预警',
    details: '系统自动比对发现，资产号 EQ-99211（高性能伺服系统综合测控台，账面价值180万）本学期在《包装机械设计》课程中的实际实验开出学时为 0。',
    impact: '“设备有不等于用得好”。昂贵资产的闲置不仅导致资源浪费，同时表明支撑课程目标 Obj-3 的硬件条件处于空转状态。已生成资产利用率优化追踪工单。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T10' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t10Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T10',
        sourceType: '教学资源清单与使用台账',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t10Data)
      }
    });
  }

  console.log('✅ T10 Seed completed for course:', t10Data.courseName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
