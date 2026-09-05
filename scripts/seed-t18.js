const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T18 行业就业率与用人单位满意度 (Employment & Satisfaction) data...');

  const t18Data = {
    majorName: '机械工程 (包装工程方向)',
    cohort: '2024届',
    syncDate: new Date().toLocaleDateString(),
    metrics: {
      totalGraduates: 120,
      employed: 115,
      matchedIndustry: 104,
      avgSalary: '¥7,500',
      employerSatisfaction: 94.5
    },
    samples: [
      { id: 'STU-001', company: '大连达意科技有限公司', position: '机械结构工程师', salary: '8k-10k', matchStatus: '高度对口', satisfaction: '非常满意' },
      { id: 'STU-002', company: '大杨集团有限责任公司', position: '智能制造助理工程师', salary: '7k-9k', matchStatus: '高度对口', satisfaction: '满意' },
      { id: 'STU-003', company: '新东方教育科技集团', position: '高中物理教师', salary: '8k-12k', matchStatus: '跨行就业', satisfaction: '不适用' }
    ],
    diagnosis: '行业对口就业率达标 (90.4%)',
    details: '系统自动比对就业管理系统岗位信息与 T03 产业白皮书靶点词库：2024届 115 名已就业学生中，104 人去向精准匹配“智能装备”、“包装机械”等核心产业节点，整体对口率达 90.4%。用人单位问卷回溯满意度达 94.5%。',
    impact: '作为评价链“验证层”的终极输出，此数据直接证明了“定位层（目标）→结构层（指标）→解析层（大纲）→执行层（教学）”这条冗长传导链的正确性。闭环达成。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T18' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t18Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T18',
        sourceType: '毕业生就业质量与用人单位反馈',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t18Data)
      }
    });
  }

  console.log('✅ T18 Seed completed for major:', t18Data.majorName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
