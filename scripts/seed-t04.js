const payload = {
  templateCode: "T04",
  sourceType: "AI_SEARCH",
  rawPayload: {
    targetT03Version: "2026-T03-轻工机械",
    mappings: [
      {
        courseName: "机电传动控制",
        matchedNodes: ["伺服电机与驱动系统", "精密减速器"],
        logic: "培养学生针对驱动组件的选型与底层控制能力。"
      },
      {
        courseName: "工业机器人控制技术",
        matchedNodes: ["机电系统集成与调试", "售后技术支持"],
        logic: "培养学生在自动化产线中对工业机器人进行现场系统集成的实战技能。"
      },
      {
        courseName: "包装机械设计",
        matchedNodes: ["包装机械本体装配", "食品饮料产线应用"],
        logic: "专门针对轻工食品行业的复杂包装工艺，培养本体结构设计与下游运维能力。"
      }
    ]
  }
};

async function seed() {
  try {
    console.log("Seeding T04 data to API...");
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
