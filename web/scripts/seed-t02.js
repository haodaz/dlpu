const payload = {
  templateCode: "T02",
  sourceType: "AI_SEARCH",
  rawPayload: {
    version: "2026版",
    targetT01Version: "2026-T01-机械工程",
    requirements: [
      {
        title: "工程知识",
        description: "能够将数学、自然科学、工程基础和专业知识用于解决复杂工程问题。",
        subIndicators: [
          { subIndex: "1.1", content: "掌握数学、自然科学知识，能将其用于机械工程复杂问题的表述和建模。" },
          { subIndex: "1.2", content: "掌握机械工程基础知识，能用于机械系统及零部件的分析与计算。" }
        ]
      },
      {
        title: "问题分析",
        description: "能够应用数学、自然科学和工程科学的基本原理，识别、表达、并通过文献研究分析复杂工程问题，以获得有效结论。",
        subIndicators: [
          { subIndex: "2.1", content: "能应用基本科学原理，识别和判断自动化机械装备运行中的关键工程问题。" },
          { subIndex: "2.2", content: "能结合轻工行业（如食品包装机械）文献研究，分析复杂机械装备工程问题的影响因素并获得有效结论。" }
        ]
      },
      {
        title: "设计/开发解决方案",
        description: "能够设计针对复杂工程问题的解决方案，设计满足特定需求的系统、单元（部件）或工艺流程，并能够在设计环节中体现创新意识，考虑社会、健康、安全、法律、文化以及环境等因素。",
        subIndicators: [
          { subIndex: "3.1", content: "掌握机械产品全生命周期设计方法，能够设计满足轻工制造特定需求的系统或工艺流程。" },
          { subIndex: "3.2", content: "在机电一体化装备设计中，能够综合考虑社会、健康、安全、法律、文化及环境等制约因素。" }
        ]
      }
    ]
  }
};

async function seed() {
  try {
    console.log("Seeding T02 data to API...");
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
