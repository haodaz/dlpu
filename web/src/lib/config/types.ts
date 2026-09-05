export interface Banner {
  id: string
  img: string
  title?: string
  linkType?: 'ai' | 'theme' | 'url' | 'all'
  linkValue?: string
}

export interface HomePlatformConfig {
  banners: Banner[]
  recommendedIds: string[]
  themes: string[]
  themeOrder: string[]
}

export interface H5PlatformConfig extends HomePlatformConfig {
  broadcastRoomIds: string[]
}

export interface HomeConfig {
  web: HomePlatformConfig
  h5: H5PlatformConfig
  recommendedIds: string[]
}

export interface Theme {
  id: string
  name: string
  description?: string
  icon?: string
}

export interface GlobalConfigItem {
  id: string
  name: string
  description: string
  content: string
  useCases?: string
  constraints?: string
  outputFormat?: string
  examples?: string
}

export interface GlobalConfig {
  rules: GlobalConfigItem[]
  skills: GlobalConfigItem[]
}

export interface CharacterSnapshot {
  id: string
  name: string
  intro: string
  persona: string
  quick_prompts: string[]
  skills: string[]
  skills_preview: string[]
  tagline: string
  tools: string | string[]
  updatedAt: string
}

export interface UIFeatures {
  avatar_animation: boolean
  quick_chips: boolean
}

export interface CharacterConfig {
  chat_input_placeholder: string
  extra_system_prompt: string
  notes: string
  snapshot: CharacterSnapshot
  ui_features: UIFeatures
  ui_theme: string
}

export type OfficialCharsConfig = Record<string, CharacterConfig>

export interface RecommendPage {
  id: string
  name: string
  description?: string
  url: string
  icon?: string
  enabled?: boolean
  trigger_scenarios?: string
}

export interface RecommendApp {
  id: string
  name: string
  description?: string
  url: string
  icon?: string
  enabled?: boolean
  trigger_scenarios?: string
}

export interface RecommendResources {
  pages: RecommendPage[]
  apps: RecommendApp[]
}

export interface HandoffCharProfile {
  charId: string
  name: string
  tagline: string
  capabilities: string[]
  handoffIn: string[]
  handoffOut: Record<string, string>
  tags: string[]
  teamIds: string[]
  enabled: boolean
}

export interface HandoffTeam {
  teamId: string
  name: string
  description: string
  members: string[]
  entryPoint: string
  color: string
}

export interface HandoffDirectory {
  version: number
  updatedAt: string
  globalRules: string[]
  characters: HandoffCharProfile[]
  teams: HandoffTeam[]
}

export interface Lead {
  id: string
  createdAt: string
  updatedAt: string
  status: 'pending' | 'contacted' | 'converted' | 'closed'
  statusNote: string
  sourceCharId: string
  sourceCharName: string
  sourceConvId: string
  name: string
  phone: string
  wechat: string
  grade: string
  education: string
  province: string
  resourceTypes: string[]
  conversationSummary: string
  aiAssessment: string
  notes: string
}

export interface AppCenterBanner {
  id: string
  img: string
  title?: string
  linkType?: 'url'
  linkValue?: string
}

export interface AppCenterCustomApp {
  id: string
  name: string
  description?: string
  icon?: string
  url: string
  category: string
  sort: number
}

export interface AppCenterAppDetail {
  desc?: string
  screenshots?: string[]
}

export interface AppCenterConfig {
  banners: { web: AppCenterBanner[]; h5: AppCenterBanner[] }
  hiddenAppIds: number[]
  customApps: AppCenterCustomApp[]
  appDetails?: Record<string, AppCenterAppDetail>
}

export interface WeworkCharConfig {
  charId: string;
  enabled: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CloudConfigData {
  home_config: HomeConfig
  themes: Theme[]
  global_config: GlobalConfig
  officialCharsConfig: OfficialCharsConfig
  recommendResources: RecommendResources
  handoffDirectory: HandoffDirectory
  leads: Lead[]
  posterUrls: Record<string, string>
  app_center_config?: AppCenterConfig
  weworkCharsConfig?: Record<string, WeworkCharConfig>
}

export interface ConfigItem {
  id: number
  flora_external_id: string
  data: string
}

export interface DashSearchResponse {
  items: ConfigItem[]
  status: number
  total: number
}
