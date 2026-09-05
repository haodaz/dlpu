const payload = {
  templateCode: "T08",
  sourceType: "AI_SEARCH",
  rawPayload: {
    courseName: "包装机械设计",
    semester: "2025-2026-1",
    assessmentType: "期末试卷(50%) + 项目答辩(30%) + 平时作业(20%)",
    feedbackTimeliness: "考试结束后 7 天内完成系统登分及试卷面批。",
    achievements: [
      { 
        objectiveId: "Obj-1", 
        value: 0.85, 
        diagnosis: "掌握良好，基本概念理解到位。", 
        improvement: "继续保持案例教学。"
      },
      { 
        objectiveId: "Obj-2", 
        value: 0.72, 
        diagnosis: "空间构型想象力不足，图纸标注规范性差。", 
        improvement: "下学期大纲增加 2 学时的 CAD 强化装配练习。"
      },
      { 
        objectiveId: "Obj-3", 
        value: 0.65, 
        diagnosis: "真实项目排故经验缺失，对 PLC 通信时序理解极差。", 
        improvement: "必须引入大连某食品厂真实的“灌装线总线掉线排故实训箱”进行实操考核。"
      }
    ]
  }
};

async function seed() {
  try {
    console.log("Seeding T08 data to API...");
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
