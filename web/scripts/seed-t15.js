const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T15 教学投入记录 (Teaching Investment Depth) data...');

  const t15Data = {
    courseName: '包装机械设计',
    teacher: '李教授 / 张讲师',
    syncDate: new Date().toLocaleDateString(),
    metrics: {
      careerGuidanceScore: 92,
      learningPlanScore: 88,
      qaResponseRate: 98,
      avgResponseTime: '2.4小时',
    },
    qaSamples: [
      {
        id: 'QA-102',
        question: '关于灌装机凸轮机构的死点位置，视频里提到的避开方法在实际企业中常用吗？',
        student: '张* (学号: 240***12)',
        replyTime: '1.2小时',
        replyContent: '非常好的问题。企业中通常会串联一个辅助机构，或者使用飞轮来增加惯性度过死点。我把你这个问题补充到了第二章的难点库中。',
        isIncorporated: true
      },
      {
        id: 'QA-105',
        question: '老师，期末考核的项目中，企业合同验收标准我们去哪里查？',
        student: '李* (学号: 240***45)',
        replyTime: '0.8小时',
        replyContent: '已经上传到超星平台的“扩展资源”模块，文件名为《HT-24-0019 达意科技设备验收国标》。',
        isIncorporated: false
      }
    ],
    diagnosis: '三维教学投入（传道、授业、解惑）极其饱满',
    details: '系统通过课程平台行为日志分析：本课程在职业指引和学习计划维度的内容覆盖度超过90%。更重要的是，答疑响应率高达98%，平均响应时间2.4小时，且部分高质量答疑已被AI标记为“已纳入大纲/题库滚动修订”。',
    impact: '证实了任课教师不仅是“念PPT”，而是深度介入了学生的知识重构过程。高频高质量的“解惑”互动强力支撑了 2.3.2 达成度评估的真实性。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T15' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t15Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T15',
        sourceType: '教学投入深度',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t15Data)
      }
    });
  }

  console.log('✅ T15 Seed completed for course:', t15Data.courseName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
