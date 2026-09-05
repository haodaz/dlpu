const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T13 企业项目驱动清单 (Enterprise Project Driven List) data...');

  const t13Data = {
    courseName: '包装机械设计',
    syncDate: new Date().toLocaleDateString(),
    metrics: {
      totalProjects: 3,
      realEnterpriseProjects: 2,
    },
    projects: [
      { id: 'PROJ-2024-001', name: '高速灌装线故障排查实训', source: '大连达意科技', contractNo: 'HT-24-0019', signOff: '已签章', status: '真题真做' },
      { id: 'PROJ-2024-002', name: '贴标机传动模块优化设计', source: '哈工大机器人集团', contractNo: 'HT-24-0102', signOff: '已签章', status: '真题真做' },
      { id: 'PROJ-2024-003', name: '基础凸轮机构运动学分析', source: '校内自建', contractNo: '--', signOff: '--', status: '虚拟课题' },
    ],
    diagnosis: '核心课程真题驱动验证通过',
    details: '系统比对教务系统与企业合同库：本学期《包装机械设计》的3个核心实训项目中，有2个具备真实的企业合同编号与企业验收签章。',
    impact: '拒绝“请企业来做个讲座”的形式主义。合同+签章的双重验证确保了课程实训环节真正深入产业一线，强力支撑了Obj-1/Obj-2的工程实践要求。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T13' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t13Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T13',
        sourceType: '企业项目驱动清单',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t13Data)
      }
    });
  }

  console.log('✅ T13 Seed completed for course:', t13Data.courseName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
