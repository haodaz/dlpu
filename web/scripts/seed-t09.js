const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T09 学习行为数据 (Learning Behavior Data) data...');

  const t09Data = {
    courseName: '包装机械设计',
    platform: '雨课堂 / 超星泛雅',
    syncDate: new Date().toLocaleDateString(),
    metrics: {
      attendanceRate: 96,
      assignmentCompletion: 82,
      videoWatchRate: 45, // Platform idling warning
      forumInteractions: 12,
    },
    platformStatus: '平台空转预警',
    diagnosis: '检测到《包装机械设计》在课程平台上的建设完整，但学生的“视频完播率”仅为45%，“论坛生均互动”仅为12次。这表明平台可能存在“建而不用”的空转现象。',
    impact: '学习行为是教学效果的前置指标。平台空转会导致教学投入失真，同时预示着期末深层次能力考核可能面临大面积不达标。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T09' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t09Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T09',
        sourceType: '学习行为数据',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t09Data)
      }
    });
  }

  console.log('✅ T09 Seed completed for course:', t09Data.courseName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
