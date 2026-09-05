const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding T19 毕业生职业发展与校友追踪 (Alumni Tracking) data...');

  const t19Data = {
    majorName: '机械工程 (包装工程等方向)',
    syncDate: new Date().toLocaleDateString(),
    alumniList: [
      {
        name: '张伟',
        title: '董事长、总经理',
        company: '大连吉瑞刀具技术股份有限公司',
        achievement: '深耕机械制造切削工具领域，带领企业实现高端刀具国产化替代。',
        matchType: '产业链上游核心骨干'
      },
      {
        name: '李琳',
        title: '董事长兼总经理',
        company: '大连优联智能装备股份有限公司',
        achievement: '专注于智能装备研发与制造，为区域智能制造产业升级提供关键设备支持。',
        matchType: '产业链中游核心骨干'
      },
      {
        name: '薛晓彤',
        title: '董事长 (大连工业大学沈阳校友会会长)',
        company: '辽宁博联过滤有限公司',
        achievement: '环保与过滤装备制造领军人物，积极推动校企合作与产教融合。',
        matchType: '产业链配套骨干'
      }
    ],
    diagnosis: '毕业生影响力极强，完美印证产业定位',
    details: '系统通过爬虫全网回溯“大连工业大学 机械/智能装备 董事长/创始人”关键字，成功定位张伟、李琳等多位杰出校友。他们创办的大连吉瑞刀具、优联智能装备等企业，全部高度集中于辽宁区域的“智能装备制造”产业链。',
    impact: '作为评价链“验证层”的最后一块拼图（T19），这证明了该专业不仅能解决学生初次就业（T18），更能在毕业 10 年以上的长周期内，持续为地方核心产业链输送领军型创始人与高管。定位层（T01 支撑地方经济）彻底闭环。'
  };

  let record = await prisma.panoramicData.findFirst({
    where: { templateCode: 'T19' }
  });

  if (record) {
    record = await prisma.panoramicData.update({
      where: { id: record.id },
      data: {
        rawPayload: JSON.stringify(t19Data),
        status: 'COMPLETED'
      }
    });
  } else {
    record = await prisma.panoramicData.create({
      data: {
        templateCode: 'T19',
        sourceType: '互联网工商数据爬虫与校友库追踪',
        status: 'COMPLETED',
        rawPayload: JSON.stringify(t19Data)
      }
    });
  }

  console.log('✅ T19 Seed completed for major:', t19Data.majorName);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
