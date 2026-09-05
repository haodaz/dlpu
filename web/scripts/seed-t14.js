const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T14 产教融合与校企合作协议 (Integration Agreements) data...');

  const t14Data = {
    entityLevel: '专业/学院级',
    majorName: '机械工程 / 包装工程方向',
    syncDate: new Date().toLocaleDateString(),
    metrics: {
      activeAgreements: 12,
      jointProjects: 5,
      totalFunding: '320万元',
    },
    agreements: [
      {
        id: 'AGR-2026-001',
        title: '大连工业大学-辽宁黄海实验室 研究生联合培养框架协议',
        partner: '辽宁黄海实验室',
        type: '联合培养与技术攻关',
        date: '2026-08',
        status: '执行中',
        highlight: '聚焦高端装备制造'
      },
      {
        id: 'AGR-2025-014',
        title: '教育部产学合作协同育人项目：现代包装装备实践基地建设',
        partner: '大连达意科技有限公司',
        type: '教育部协同育人',
        date: '2025-11',
        status: '执行中',
        highlight: '获批国家级立项'
      },
      {
        id: 'AGR-2024-008',
        title: '辽宁省轻工纺织产业校企联盟组建协议',
        partner: '大杨集团等多家龙头企业',
        type: '省级校企联盟',
        date: '2024-05',
        status: '常态化运行',
        highlight: '牵头组建单位'
      }
    ],
    diagnosis: '产教融发生态系统高度成熟',
    details: '系统自动比对学校科研处与技术转移中心合同库：机械工程（包装工程）专业深度参与辽宁省轻工纺织产业校企联盟，并与黄海实验室等顶尖科研平台建立正式联合培养机制，教育部产学合作项目稳步增加。',
    impact: '证实了该专业并非“闭门造车”。通过高质量的协议、项目与资金投入，证明了其人才培养体系拥有强大的外部产业支撑与真实课题来源，形成“验证层”的关键闭环。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T14' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t14Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T14',
        sourceType: '产教融合与校企合作协议',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t14Data)
      }
    });
  }

  console.log('✅ T14 Seed completed for major:', t14Data.majorName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
