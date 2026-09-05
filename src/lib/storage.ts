import { crmManager, CRMProfileData, ProfileFragment, ReportRecord, KbFileItem, RoundtableRecord, ConversationRecord } from './mcp/crm';
import { kbManager } from './mcp/kb';
import { mcpConversations } from './mcp/conversations';
import { mcpRoundtables } from './mcp/roundtables';
import { RoomMessage } from '@/lib/characters/types';
import { Conversation } from '@/lib/conversations';

function mergeProfileContent(oldContent: string, newContent: string): string {
  oldContent = oldContent.replace(/\\n/g, '\n');
  newContent = newContent.replace(/\\n/g, '\n');

  const oldFactsMatch = oldContent.match(/###\s*📝\s*客观事实记录\s*([\s\S]*?)(?=###|$)/i);
  const oldInsightsMatch = oldContent.match(/###\s*💡\s*知己洞察与建议\s*([\s\S]*?)(?=###|$)/i);
  
  const newFactsMatch = newContent.match(/###\s*📝\s*客观事实记录\s*([\s\S]*?)(?=###|$)/i);
  const newInsightsMatch = newContent.match(/###\s*💡\s*知己洞察与建议\s*([\s\S]*?)(?=###|$)/i);

  if (!oldFactsMatch && !oldInsightsMatch && !newFactsMatch && !newInsightsMatch) {
    return oldContent + '\n\n' + newContent;
  }

  const mergedFacts = [
    oldFactsMatch ? oldFactsMatch[1].trim() : '',
    newFactsMatch ? newFactsMatch[1].trim() : ''
  ].filter(Boolean).join('\n');

  const mergedInsights = [
    oldInsightsMatch ? oldInsightsMatch[1].trim() : '',
    newInsightsMatch ? newInsightsMatch[1].trim() : ''
  ].filter(Boolean).join('\n');

  let merged = '';
  if (mergedFacts) merged += `### 📝 客观事实记录\n${mergedFacts}\n\n`;
  if (mergedInsights) merged += `### 💡 知己洞察与建议\n${mergedInsights}\n`;

  return merged.trim() || (oldContent + '\n\n' + newContent);
}

export interface ConversationEntry {
  id: string;
  charId?: string;
  charName?: string;
  title?: string;
  updatedAt?: string;
}

export interface RoundtableEntry {
  id: string;
  name: string;
  characters: string[];
  messages: RoomMessage[];
  updatedAt: string;
}

export interface ProfileData {
  fragments?: ProfileFragment[];
  categories?: string[];
  totalFragments?: number;
  username?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  updatedAt?: string;
}

export const storage = {
  // ── 用户资料相关 ───────────────────────────────────────────────────────────

  async getProfile(token?: string) {
    if (!token) return null;
    const profileRes = await crmManager.getClientProfile(token);
    return profileRes.data?.profile || null;
  },

  async saveProfile(profile: Record<string, unknown>, token?: string) {
    if (!token) return null;
    const profileRes = await crmManager.getClientProfile(token);
    const resumeData: CRMProfileData = profileRes.data || { version: '1.0' };
    
    resumeData.profile = {
      ...resumeData.profile,
      ...profile,
      updatedAt: new Date().toISOString()
    };

    await crmManager.updateClientProfile(token, resumeData);
    return resumeData.profile;
  },

  /**
   * 追加一条碎片记录到用户档案 timeline（student_profile add 实际落地）
   */
  async addProfileFragment(category: string, content: string, token?: string, charName?: string, convId?: string, title?: string) {
    if (!token) return false;
    try {
      const profileRes = await crmManager.getClientProfile(token);
      const resumeData: CRMProfileData = profileRes.data || { version: '1.0' };

      if (!resumeData.profile) resumeData.profile = {};
      if (!resumeData.profile.fragments) resumeData.profile.fragments = [];
      if (!resumeData.profile.categories) resumeData.profile.categories = [];

      const existingFrag = convId ? resumeData.profile.fragments.find(
        (f: any) => f.convId === convId && f.source === 'chat'
      ) : null;

      if (existingFrag) {
        // Append to existing fragment
        existingFrag.content = mergeProfileContent(existingFrag.content, content);
        existingFrag.updatedAt = new Date().toISOString();
        if (title && !existingFrag.title) existingFrag.title = title;
        if (existingFrag.category !== category && existingFrag.category !== '综合档案') {
          existingFrag.category = '综合档案';
        }
      } else {
        // Create new fragment
        resumeData.profile.fragments.unshift({
          id: Date.now().toString() + Math.floor(Math.random() * 1000).toString(),
          title,
          category,
          content: content.replace(/\\n/g, '\n'),
          createdAt: new Date().toISOString(),
          source: 'chat',
          ai_name: charName || 'AI 记录',
          convId,
        });
      }

      resumeData.profile.totalFragments = resumeData.profile.fragments.length;

      if (!resumeData.profile.categories.includes(category)) {
        resumeData.profile.categories.push(category);
      }

      return await crmManager.updateClientProfile(token, resumeData);
    } catch (e) {
      console.error('[storage.addProfileFragment] failed:', e);
      return false;
    }
  },

  // ── 1v1 对话相关 ───────────────────────────────────────────────────────────

  async getConversations(token?: string) {
    return await mcpConversations.getConversations(token);
  },

  async getConversationById(id: string, token?: string) {
    return await mcpConversations.getConversation(id, token);
  },

  async saveConversation(conv: ConversationEntry, token?: string) {
    const conversation: Conversation = {
      id: conv.id,
      charId: conv.charId || '',
      charName: conv.charName || '',
      title: conv.title || '',
      updatedAt: conv.updatedAt || '',
      history: [],
      lastMsg: '',
    };
    const result = await mcpConversations.saveConversationMetadata(conversation, token);
    await mcpConversations.invalidateConversationListCache(token);
    return result;
  },

  async deleteConversation(id: string, token?: string) {
    return await mcpConversations.deleteConversation(id, token);
  },

  // ── 报告相关 ───────────────────────────────────────────────────────────────
  
  async getReports(token?: string) {
    if (!token) return [];
    const res = await crmManager.getClientProfile(token);
    return res.data?.reports?.reports || [];
  },

  async getReportById(id: string, token?: string) {
    const reports = await this.getReports(token);
    return reports.find((r: ReportRecord) => r.id === id);
  },

  async saveReport(report: ReportRecord, token?: string) {
    if (!token) return null;
    const profileRes = await crmManager.getClientProfile(token);
    const resumeData: CRMProfileData = profileRes.data || { version: '1.0' };
    
    if (!resumeData.reports) {
      resumeData.reports = { count: 0, reports: [] };
    }

    const existingIndex = report.id ? resumeData.reports.reports.findIndex(r => r.id === report.id) : -1;

    let savedReport;
    if (existingIndex !== -1) {
      savedReport = {
        ...resumeData.reports.reports[existingIndex],
        ...report,
        updatedAt: new Date().toISOString(),
      };
      resumeData.reports.reports[existingIndex] = savedReport;
    } else {
      savedReport = {
        ...report,
        id: report.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      resumeData.reports.reports.unshift(savedReport);
    }

    resumeData.reports.count = resumeData.reports.reports.length;

    await crmManager.updateClientProfile(token, resumeData);
    return savedReport;
  },

  async deleteReport(id: string, token?: string) {
    if (!token) return false;
    const profileRes = await crmManager.getClientProfile(token);
    if (!profileRes.success || !profileRes.data) return false;

    const resumeData = profileRes.data;
    if (!resumeData.reports) return false;

    resumeData.reports.reports = resumeData.reports.reports.filter((r: ReportRecord) => r.id !== id);
    resumeData.reports.count = resumeData.reports.reports.length;

    return await crmManager.updateClientProfile(token, resumeData);
  },

  // ── 知识库相关 ─────────────────────────────────────────────────────────────

  async getKbFiles(token?: string) {
    if (!token) return [];
    return await kbManager.getFiles(token);
  },

  async saveKbFile(filename: string, content: Buffer, token?: string) {
    if (!token) return null;
    return await kbManager.saveFile(token, filename, content);
  },

  async deleteKbFile(idOrName: string | number, token?: string) {
    if (!token) return false;
    // 如果传入的是数字，直接按 ID 删除；否则需要先查询 ID
    let fileId: number | undefined;
    if (typeof idOrName === 'number') {
      fileId = idOrName;
    } else {
      const files = await this.getKbFiles(token);
      const file = files.find((f: KbFileItem) => f.name === idOrName || String(f.id) === idOrName);
      if (file) fileId = file.id;
    }

    if (!fileId) return false;
    return await kbManager.deleteFile(token, fileId);
  },

  // ── 圆桌会议相关 ───────────────────────────────────────────────────────────

  async getRoundtables(token?: string) {
    return await mcpRoundtables.getRoundtables(token);
  },

  async getBroadcastRooms() {
    return await mcpRoundtables.getBroadcastRooms();
  },

  async getRoundtableById(id: string, token?: string) {
    return await mcpRoundtables.getRoundtableById(id, token);
  },

  async saveRoundtable(room: RoundtableRecord, token?: string) {
    return await mcpRoundtables.createRoundtable(room, token);
  },

  async deleteRoundtable(id: string, token?: string) {
    return await mcpRoundtables.deleteRoundtable(id, token);
  },

  async pushRoundtableMessage(roomId: string, message: Record<string, unknown>, token?: string) {
    return await mcpRoundtables.pushMessage(roomId, message, token);
  }
};
