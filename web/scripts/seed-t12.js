const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T12 毕业设计选题与成果记录 (Graduation Design) data...');

  const t12Data = {
    majorName: '机械工程 (包装工程方向)',
    cohort: '2024届',
    syncDate: new Date().toLocaleDateString(),
    metrics: {
      totalStudents: 120,
      totalProjects: 120,
      realProjects: 102, // 真题
      enterpriseMentors: 68
    },
    projects: [
      { id: 'GD24-001', title: '基于PLC的高速灌装封口一体机控制系统设计', type: '企业真题', mentor: '王建国 (校内) / 李强 (哈工大机器人集团)', status: '已验收签章' },
      { id: 'GD24-002', title: '智能包装码垛机器人末端执行器结构优化', type: '企业真题', mentor: '张丽 (校内) / 刘海波 (大连达意科技)', status: '已验收签章' },
      { id: 'GD24-003', title: '常规齿轮减速器三维建模与仿真', type: '虚拟课题', mentor: '赵铁柱 (校内)', status: '已完成' },
    ],
    diagnosis: '真题真做比例达标验证',
    details: '系统自动拉取毕业设计管理系统与企业签章系统：2024届机械工程专业共120名毕业生，其中102人的毕设题目源于企业真实生产项目，真题真做比例达85%。',
    impact: '符合产教融合“解决复杂工程问题”的验证要求，具备实质性的校企联合培养深度。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T12' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t12Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T12',
        sourceType: '毕业设计清单',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t12Data)
      }
    });
  }

  console.log('✅ T12 Seed completed for major:', t12Data.majorName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
