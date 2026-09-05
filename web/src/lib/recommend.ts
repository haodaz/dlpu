/**
 * Recommend Resources — 从云端配置读取推荐资源（页面 + 应用）
 */
import { getCloudConfig } from '@/lib/config/cloud-config';

export type {
  RecommendPage,
  RecommendApp,
  RecommendResources,
} from '@/lib/config/types';

export async function getRecommendResources() {
  const { config } = await getCloudConfig();
  return config.recommendResources ?? { pages: [], apps: [] };
}

/** 构建注入 system prompt 的推荐规范段落（与 v1 的 buildRecommendResourcesRule 对应） */
export async function buildRecommendResourcesRule(): Promise<string> {
  const data = await getRecommendResources();
  const enabledPages = (data.pages || []).filter((p: any) => p.enabled !== false);
  const enabledApps  = (data.apps  || []).filter((a: any) => a.enabled !== false);

  if (!enabledPages.length && !enabledApps.length) return '';

  let rule = '\n\n## 【资源推荐规范】（全体角色适用）\n' +
    '你可以在对话中向用户推荐以下资源。每次对话最多推荐 **2次**，仅在用户需求高度匹配时使用，不要强行插入。\n';

  if (enabledPages.length) {
    rule += '\n**[可推荐页面]**\n';
    enabledPages.forEach((p: any) => {
      rule += `- ${p.name}（ID: ${p.id}）\n`;
      rule += `  介绍: ${p.description || ''}\n`;
      if (p.trigger_scenarios) rule += `  触发场景: ${p.trigger_scenarios}\n`;
    });
  }

  if (enabledApps.length) {
    rule += '\n**[可推荐应用/工具]**\n';
    enabledApps.forEach((a: any) => {
      rule += `- ${a.name}（ID: ${a.id}）\n`;
      rule += `  介绍: ${a.description || ''}\n`;
      if (a.trigger_scenarios) rule += `  触发场景: ${a.trigger_scenarios}\n`;
    });
  }

  rule += '\n**推荐输出格式（必须使用此格式，不可省略）：**\n';
  rule += '<zj_recommend type="page|app" id="资源ID">你对用户的推荐理由（1-2句话）</zj_recommend>\n';
  rule += '不要把推荐标签单独放一段，要自然地嵌入你的回复中。';
  return rule;
}
