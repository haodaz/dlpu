const payload = {
  templateCode: "T11",
  sourceType: "AI_SEARCH",
  rawPayload: {
    courseName: "包装机械设计",
    credits: 3,
    hours: 48,
    objectives: [
      {
        id: "Obj-1",
        desc: "掌握包装机械机构学原理及常见包装工艺方法。",
        mappedRequirement: "1.2 掌握机械工程基础知识，能用于机械系统及零部件的分析与计算。"
      },
      {
        id: "Obj-2",
        desc: "能针对特定食品包装需求，完成机械传动与执行机构的结构设计。",
        mappedRequirement: "3.1 掌握机械产品全生命周期设计方法，能够设计满足轻工制造特定需求的系统或工艺流程。"
      },
      {
        id: "Obj-3",
        desc: "具备包装装备现场联调及处理突发工程故障的能力。",
        mappedRequirement: "2.1 能应用基本科学原理，识别和判断自动化机械装备运行中的关键工程问题。"
      }
    ],
    features: {
      techTraceability: "引入了‘柔性包装智能识别算法’及‘机器视觉在线缺陷检测’等产业最新前沿技术。",
      researchTransfer: "将教师承担的‘辽宁省某食品厂包装线自动化升级项目’剥离出的真实工程难题，转化为大纲中的 6 课时综合实战项目。"
    }
  }
};

async function seed() {
  try {
    console.log("Seeding T11 data to API...");
    const res = await fetch("http://localhost:8848/api/panoramic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log("Success:", data);
    } else {
      console.error("Failed to seed data. Status:", res.status);
      const text = await res.text();
      console.error(text);
    }
  } catch (error) {
    console.error("Error during fetch:", error);
  }
}

seed();
