const payload = {
  templateCode: "T03",
  sourceType: "AI_SEARCH",
  rawPayload: {
    industryTitle: "轻工包装自动化装备产业链",
    nodes: [
      {
        layer: "上游 (核心零部件)",
        items: [
          { name: "伺服电机与驱动系统", coreRole: "电机驱动控制工程师" },
          { name: "精密减速器", coreRole: "传动结构设计工程师" },
          { name: "工业传感器与PLC", coreRole: "底层逻辑编程工程师" }
        ]
      },
      {
        layer: "中游 (本体制造与集成)",
        items: [
          { name: "包装机械本体装配", coreRole: "机械本体装配工程师" },
          { name: "机电系统集成与调试", coreRole: "系统集成调试工程师" }
        ]
      },
      {
        layer: "下游 (应用与服务)",
        items: [
          { name: "食品饮料产线应用", coreRole: "产线运维工程师" },
          { name: "售后技术支持", coreRole: "技术支持工程师" }
        ]
      }
    ]
  }
};

async function seed() {
  try {
    console.log("Seeding T03 data to API...");
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
