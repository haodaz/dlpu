const payload = {
  templateCode: "T01",
  sourceType: "AI_SEARCH",
  rawPayload: {
    majorName: "机械设计制造及其自动化",
    degreeType: "工学学士",
    duration: "4年",
    objectiveText: "本专业旨在培养适应社会主义现代化建设需求，德、智、体、美、劳全面发展，具有良好的工程素养、责任意识、创新精神和人文情怀的应用型高层次工程技术人才和工程管理人才。\n掌握机械领域扎实的基础理论、较宽广的专业知识，能够胜任机械领域某一方向的工程设计、产品开发、项目实施与管理等工作。特别是能够针对行业（如食品、包装、纺织、印刷、造纸、塑料等轻工领域）及其相关产业，利用机电一体化技术解决自动化机械装备设计与制造等复杂工程问题。具备跨学科合作任务的执行能力和良好的团队合作精神。"
  }
};

async function seed() {
  try {
    console.log("Seeding T01 data to API...");
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
