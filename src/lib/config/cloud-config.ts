import { mcpTools } from '@/lib/mcp/generated-tools';
import { cacheGetOrSet, cacheDel, registerPrefetch } from '@/lib/redis';
import type { CloudConfigData, DashSearchResponse, Theme } from './types';

const CLOUD_CONFIG_KEY = 'cloud_config:default';
const CLOUD_CONFIG_TTL = 300; // 5 min

/** 原始回源函数：不依赖用户 token，供后台预刷新使用 */
async function rawFetchCloudConfig(): Promise<{ config: Partial<CloudConfigData>; id: number }> {
  const token = process.env.FLORA_AUTH_BEARER || '';

  let id = 0;
  try {
    const res = await mcpTools.dashGenericSearch({
      model: 'ZhiJiCompanionConfig',
      fields: ['id', 'flora_external_id', 'data'],
      condition: JSON.stringify({
        logic_operator: "&",
        children: [{
          leaf: {
            field: "flora_external_id",
            comparator: "=",
            value: "config_default_yida"
          }
        }]
      }),
    }, token) as DashSearchResponse;

    if (res && res.items && res.items.length > 0) {
      id = res.items[0].id;
      const dataStr = res.items[0].data;
      if (dataStr) {
        return { config: JSON.parse(dataStr), id };
      }
    }
  } catch (e) {
    console.warn('[ZhiJiCompanionConfig] 预刷新失败:', (e as Error).message);
  }

  return { config: {}, id };
}

// 模块加载时自动注册后台预刷新
registerPrefetch(CLOUD_CONFIG_KEY, rawFetchCloudConfig, CLOUD_CONFIG_TTL);

/**
 * 将 theme_id 统一规范化为 ID：
 * - 如果已是合法的 theme ID（存在于 themes 列表中），直接返回
 * - 如果是 theme 名称，根据当前 themes 列表反向查找到对应的 ID 并返回
 * - 都不匹配则原样返回
 */
export async function normalizeThemeId(themeId: string | undefined | null): Promise<string | undefined> {
  if (!themeId) return themeId ?? undefined;

  const { config } = await getCloudConfig();
  const themes: Theme[] = config.themes ?? [];
  if (themes.length === 0) return themeId;

  // 先检查是否已经是已知 ID
  const knownIds = new Set(themes.map(t => t.id));
  if (knownIds.has(themeId)) return themeId;

  // 再尝试按名称反查（大小写不敏感）
  const lower = themeId.toLowerCase();
  for (const t of themes) {
    if (t.name.toLowerCase() === lower) return t.id;
  }

  // 无匹配，原样返回
  return themeId;
}

/**
 * 从云端获取智己公共配置（ZhiJiCompanionConfig）
 * 
 * 使用系统服务 Token（FLORA_AUTH_BEARER）读取公共配置，
 * 因为 home_config 是运营级公共数据，不应依赖单个用户权限。
 */
export async function getCloudConfig(_userBearerToken?: string): Promise<{ config: Partial<CloudConfigData>; id: number }> {
  return cacheGetOrSet(CLOUD_CONFIG_KEY, rawFetchCloudConfig, CLOUD_CONFIG_TTL);
}

/**
 * 保存配置到云端 ZhiJiCompanionConfig
 * 内部通过 flora_external_id='config_default_yida' 自动查找已有记录，无则创建
 */
export async function saveCloudConfig(
  configData: Partial<CloudConfigData>,
  userBearerToken?: string,
) {
  const serviceToken = process.env.FLORA_AUTH_BEARER;
  const bearerToken = serviceToken || userBearerToken;

  if (!bearerToken || bearerToken.startsWith('local_')) {
    throw new Error('No valid cloud token');
  }

  // 自行查询已有记录的 id
  const { id: existingId } = await getCloudConfig(bearerToken);

  const values: Record<string, unknown> = {
    flora_external_id: 'config_default_yida',
    data: JSON.stringify(configData),
  };
  if (existingId > 0) values.id = existingId;

  const result = await mcpTools.dashGenericSave({
    model: 'ZhiJiCompanionConfig',
    values: JSON.stringify(values),
  }, bearerToken);

  if (result.status !== 200) {
    throw new Error(result.error || 'Failed to save cloud config');
  }

  // 写入成功后失效缓存，下次读取自动拉取最新数据
  await cacheDel(CLOUD_CONFIG_KEY);

  return result;
}