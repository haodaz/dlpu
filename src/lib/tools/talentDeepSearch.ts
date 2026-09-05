import { TalentAuditService } from '@/lib/mcp/talent';
import { searchWeb } from '@/lib/search';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from "openai";
import pinyin from 'pinyin';
import { talentJournal } from '@/lib/mcp/talent-journal';
import type { TalentJournalEntry } from '@/lib/mcp/talent-journal-shared';

const talentService = new TalentAuditService();

function getOpenAIClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY 未配置');
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  });
}


// --- ORCID Functions Copied from verify/route.ts ---
let _orcidTokenCache: { token: string; expiresAt: number } | null = null;

async function getOrcidToken(): Promise<string | null> {
  // 检查缓存（Token 有效期 ~20 年，基本永不过期）
  if (_orcidTokenCache && Date.now() < _orcidTokenCache.expiresAt) {
    return _orcidTokenCache.token;
  }

  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials&scope=/read-public`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    _orcidTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 600000) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * ORCID 三步降级搜索：精准 → 去机构 → 全文
 * 每步正序 + 反序都搜一遍，取合集去重
 */
async function orcidSearch(
  token: string,
  givenNames: string,
  familyName: string,
  institution?: string
): Promise<Array<{ path: string }>> {
  const BASE = 'https://pub.orcid.org/v3.0/search/';
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

  const doSearch = async (q: string): Promise<Array<{ path: string }>> => {
    try {
      const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}&rows=5`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.result || []).map((r: any) => ({ path: r['orcid-identifier']?.path })).filter((r: any) => r.path);
    } catch { return []; }
  };

  const dedupe = (arr: Array<{ path: string }>): Array<{ path: string }> => {
    const seen = new Set<string>();
    return arr.filter(r => { if (seen.has(r.path)) return false; seen.add(r.path); return true; });
  };

  // Step 1: 精准搜（正序 + 反序 + 机构）
  if (institution) {
    const q1 = `given-names:${givenNames} AND family-name:${familyName} AND affiliation-org-name:${institution}`;
    const q2 = `given-names:${familyName} AND family-name:${givenNames} AND affiliation-org-name:${institution}`;
    const [r1, r2] = await Promise.all([doSearch(q1), doSearch(q2)]);
    const results = dedupe([...r1, ...r2]);
    if (results.length > 0) return results;
  }

  // Step 2: 去掉机构（正序 + 反序）
  const q3 = `given-names:${givenNames} AND family-name:${familyName}`;
  const q4 = `given-names:${familyName} AND family-name:${givenNames}`;
  const [r3, r4] = await Promise.all([doSearch(q3), doSearch(q4)]);
  const step2 = dedupe([...r3, ...r4]);
  if (step2.length > 0 && step2.length <= 20) return step2.slice(0, 5);

  // Step 3: 全文搜索（杀手锏）
  const fullName = `${givenNames} ${familyName}`;
  const q5 = institution
    ? `text:"${fullName}" AND text:${institution}`
    : `text:"${fullName}"`;
  const r5 = await doSearch(q5);
  if (r5.length > 0) return r5;

  // Step 2 结果太多但 Step 3 没结果，返回 Step 2 前 5 个
  return step2.slice(0, 5);
}

/**
 * 从 ORCID 拉取学者的 employments，用于消歧
 */
async function orcidGetEmployments(token: string, orcidId: string): Promise<Array<{ org: string; role: string; dept: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/employments`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data['affiliation-group'] || []).map((g: any) => {
      const s = g.summaries?.[0]?.['employment-summary'] || {};
      return {
        org: s.organization?.name || '',
        role: s['role-title'] || '',
        dept: s['department-name'] || '',
      };
    });
  } catch { return []; }
}

/**
 * 从 ORCID 拉取教育经历
 */
async function orcidGetEducations(token: string, orcidId: string): Promise<Array<{ org: string; role: string; dept: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/educations`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data['affiliation-group'] || []).map((g: any) => {
      const s = g.summaries?.[0]?.['education-summary'] || {};
      return {
        org: s.organization?.name || '',
        role: s['role-title'] || '',
        dept: s['department-name'] || '',
      };
    });
  } catch { return []; }
}

/**
 * 从 ORCID 拉取论文（前 N 篇）
 */
async function orcidGetWorks(token: string, orcidId: string, limit = 10): Promise<Array<{ title: string; type: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.group || []).slice(0, limit).map((g: any) => {
      const s = g['work-summary']?.[0] || {};
      return {
        title: s.title?.title?.value || 'N/A',
        type: s.type || '',
      };
    });
  } catch { return []; }
}

// ------------------------------------------------
// 中文姓名 → 英文拼音变体生成
// ------------------------------------------------

function generatePinyinVariants(chineseName: string): string[] {
  const chars = chineseName.replace(/[^一-龥]/g, '');
  if (chars.length < 2) return [];
  const py = (pinyin as any)(chars, { style: 'normal' }) as string[][];
  const flat = py.map((arr: string[]) => arr[0]);
  const variants = new Set<string>();
  const family = flat[0].charAt(0).toUpperCase() + flat[0].slice(1);
  const givenParts = flat.slice(1).map(s => s.charAt(0).toUpperCase() + s.slice(1));
  const givenConcat = givenParts.join('');
  const givenSpaced = givenParts.join(' ');

  variants.add(`${family} ${givenConcat}`);          // Li Feifei
  variants.add(`${family} ${givenSpaced}`);          // Li Fei Fei
  variants.add(`${family},${givenConcat}`);          // Li,Feifei ← 平方库 name_en 常见格式
  variants.add(`${family}, ${givenConcat}`);         // Li, Feifei
  variants.add(`${givenConcat} ${family}`);          // Feifei Li
  variants.add(`${givenConcat}${family}`);           // FeifeiLi
  variants.add(`${givenConcat}, ${family}`);         // Feifei, Li
  variants.add(flat.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')); // Lifeifei

  return Array.from(variants);
}

// ------------------------------------------------
// 平方库同名消歧工具函数
// 决策流程文档: docs/ai/knowledge/talent-deep-search-disambiguation.md
// ------------------------------------------------

const WEIGHTS = {
  INST_CURRENT: 30,
  INST_HISTORY_WORK: 25,
  INST_HISTORY_EDU: 20,
  RESEARCH_FIELD: 15,
  DATA_RICHNESS: 10,
} as const;

const ABBREV_MAP: Record<string, string> = {
  mit: 'massachusetts institute of technology',
  ucla: 'university of california los angeles',
  ucsf: 'university of california san francisco',
  ucb: 'university of california berkeley',
  cmu: 'carnegie mellon university',
  caltech: 'california institute of technology',
  oxford: 'university of oxford',
  cambridge: 'university of cambridge',
  tsinghua: 'tsinghua university',
  peking: 'peking university',
};

const CN_ABBREV_MAP: Record<string, string> = {
  '中科院': '中国科学院',
  '社科院': '中国社会科学院',
  '中科大': '中国科学技术大学',
  '中科院大学': '中国科学院大学',
  '央财': '中央财经大学',
  '央财大': '中央财经大学',
  '北航': '北京航空航天大学',
  '北理工': '北京理工大学',
  '北邮': '北京邮电大学',
  '北医': '北京医科大学',
  '北师': '北京师范大学',
  '北外': '北京外国语大学',
  '北体': '北京体育大学',
  '北化工': '北京化工大学',
  '北交大': '北京交通大学',
  '北科大': '北京科技大学',
  '北林大': '北京林业大学',
  '北民大': '北京民族大学',
  '北大': '北京大学',
  '清华': '清华大学',
  '复旦': '复旦大学',
  '上交': '上海交通大学',
  '交沪': '上海交通大学',
  '华科': '华中科技大学',
  '武大': '武汉大学',
  '中大': '中山大学',
  '川大': '四川大学',
  '浙大': '浙江大学',
  '南大': '南京大学',
  '天大': '天津大学',
  '哈工大': '哈尔滨工业大学',
  '西工大': '西北工业大学',
  '西交大': '西安交通大学',
  '同济': '同济大学',
  '厦大': '厦门大学',
  '山大': '山东大学',
  '吉大': '吉林大学',
  '兰大': '兰州大学',
  '中南大': '中南大学',
  '湖大': '湖南大学',
  '云大': '云南大学',
  '贵大': '贵州大学',
  '重大': '重庆大学',
  '暨大': '暨南大学',
  '华师大': '华东师范大学',
  '东师大': '华东师范大学',
};

function normalizeInstName(s: string): string {
  return s.toLowerCase().replace(/[\s,、\-()（）··]/g, '').replace(/university/gi, 'uni').replace(/institute/gi, 'inst');
}

function tokenizeInst(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[\s,、\-()（）·]+/)
    .filter(w => w.length >= 2);
}

function expandAbbrev(s: string): string {
  if (!s) return s;
  const lower = s.toLowerCase();
  if (CN_ABBREV_MAP[s]) return CN_ABBREV_MAP[s];
  if (ABBREV_MAP[lower]) return ABBREV_MAP[lower];
  return s;
}

// workplace_current 可能是 "value1、value2" 多值，拆成数组统一处理
// 主体一致性校验：用锚点人（anchor, 来自 Pingfang 高置信度消歧）验证候选数据
// 是否指向同一个学者。返回 { pass: boolean, score: number, reasons: string[] }。
// 校验维度（任一命中即通过，因为单个数据源可能缺某维度）：
//   1. 机构重叠：candidate 的机构列表 与 anchor 的 workplace/history 有交叉
//   2. 研究领域重叠：candidate 的 concepts/fields 与 anchor 的 research_field 有语义关键词交叉
//   3. 名字高度相似：candidate 名字 与 anchor 的 name_en/拼音 有 >=80% 相似度
// 当 pfConfidence !== 'high' 时，不做一致性校验（锚点本身就不可信）。
function subjectConsistencyCheck(anchor: any, candidate: any, pfConfidence: 'high' | 'low' | 'none'): { pass: boolean; score: number; reasons: string[] } {
  if (pfConfidence !== 'high' || !anchor || !candidate) {
    return { pass: true, score: 0, reasons: ['pfConfidence !== high, skip check'] };
  }

  const reasons: string[] = [];
  let score = 0;

  // ── 1. 机构重叠 ──
  const anchorInsts: string[] = [];
  splitWpValues(anchor.workplace_current).forEach((v: string) => anchorInsts.push(v));
  if (anchor.work_experiences?.length) {
    anchor.work_experiences.forEach((w: any) => { if (w?.employer) anchorInsts.push(String(w.employer)); });
  }
  if (anchor.education_backgrounds?.length) {
    anchor.education_backgrounds.forEach((e: any) => {
      if (e?.school_name_en) anchorInsts.push(String(e.school_name_en));
      if (e?.school_name_cn) anchorInsts.push(String(e.school_name_cn));
    });
  }

  let candidateInsts: string[] = [];
  if (Array.isArray(candidate.last_known_institutions)) {
    candidateInsts = candidate.last_known_institutions.map((i: any) => i?.display_name || '').filter(Boolean);
  } else if (Array.isArray(candidate.employments)) {
    candidateInsts = candidate.employments.map((e: any) => e?.org || '').filter(Boolean);
  } else if (candidate.current_org) {
    candidateInsts = [String(candidate.current_org)];
  }

  let bestInstMatch = 0;
  for (const ai of anchorInsts) {
    for (const ci of candidateInsts) {
      const m = calcInstMatchScore(ai, ci);
      if (m > bestInstMatch) bestInstMatch = m;
    }
  }
  if (bestInstMatch > 0.5) {
    score += 50;
    reasons.push(`机构重叠 (最高匹配=${bestInstMatch.toFixed(2)})`);
  }

  // ── 2. 研究领域重叠 ──
  const anchorFields = String(anchor.research_field || anchor.introduction || '')
    .toLowerCase().split(/[^a-z一-龥]+/).filter((w: string) => w.length >= 2);

  let candidateFields: string[] = [];
  if (Array.isArray(candidate.concepts)) {
    candidateFields = candidate.concepts.map((c: any) => c?.display_name || c?.name || '').filter(Boolean);
  } else if (Array.isArray(candidate.fields)) {
    candidateFields = candidate.fields.map((f: any) => typeof f === 'string' ? f : f?.name || '').filter(Boolean);
  }
  candidateFields = candidateFields.map((s: string) => s.toLowerCase());

  let fieldHit = 0;
  for (const af of anchorFields) {
    for (const cf of candidateFields) {
      if (cf.includes(af) || af.includes(cf)) { fieldHit++; break; }
    }
  }
  if (fieldHit > 0) {
    score += 30;
    reasons.push(`研究领域重叠 (命中 ${fieldHit} 个关键词)`);
  }

  // ── 3. 名字高度相似 ──
  const anchorEn = String(anchor.name_en || '').toLowerCase().replace(/[^a-z]/g, '');
  const candName = String(candidate.display_name || candidate.name || '').toLowerCase().replace(/[^a-z]/g, '');
  if (anchorEn && candName && (anchorEn === candName || anchorEn.includes(candName) || candName.includes(anchorEn))) {
    score += 20;
    reasons.push(`名字高度相似 (${anchorEn} ≈ ${candName})`);
  }

  const pass = score >= 30; // 任一维度中等以上命中即通过
  return { pass, score, reasons };
}

function splitWpValues(raw: any): string[] {
  if (!raw) return [];
  const s = String(raw);
  return s.split(/[、,，|;；]/).map(v => v.trim()).filter(Boolean);
}

// 对一个可能多值的 workplace_current 跑 calcInstMatchScore，取最高分
function calcWpMatchScore(query: string, rawWp: any): number {
  const values = splitWpValues(rawWp);
  if (values.length === 0) return 0;
  return Math.max(...values.map(v => calcInstMatchScore(query, v)));
}

function calcInstMatchScore(query: string, target: string): number {
  if (!query || !target) return 0;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (q.length > 0 && t.includes(q)) return 1.0;
  if (t.length > 0 && q.includes(t)) return 1.0;

  const qExpanded = expandAbbrev(q);
  if (qExpanded !== q) {
    if (t.includes(qExpanded)) return 1.0;
    if (qExpanded.includes(t)) return 1.0;
  }
  const tExpanded = expandAbbrev(t);
  if (tExpanded !== t) {
    if (tExpanded.includes(q)) return 1.0;
    if (q.includes(tExpanded)) return 1.0;
  }

  const qTokens = tokenizeInst(q);
  if (qTokens.length === 0) return 0;

  let hit = 0;
  for (const tok of qTokens) {
    if (t.includes(tok)) { hit++; continue; }
    const abbrevFull = ABBREV_MAP[tok] || CN_ABBREV_MAP[tok];
    if (abbrevFull && t.includes(abbrevFull)) { hit++; continue; }
    const nTok = normalizeInstName(tok);
    const nT = normalizeInstName(t);
    if (nTok.length >= 3 && nT.includes(nTok)) { hit++; continue; }
  }

  return hit / qTokens.length;
}

function tokenizeKeywords(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[\s,、\-，。；;：:·\/\\&]+/)
    .filter(w => w.length >= 2);
}

function ngramOverlapScore(keyword: string, text: string): number {
  if (!keyword || keyword.length < 2) return 0;
  const k = keyword.toLowerCase();
  const t = text.toLowerCase().replace(/[\s,、\-()（）··]/g, '');

  if (t.includes(k)) return 1.0;

  const kBigrams = new Set<string>();
  for (let i = 0; i < k.length - 1; i++) kBigrams.add(k.slice(i, i + 2));
  if (kBigrams.size === 0) return 0;

  const tBigrams = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) tBigrams.add(t.slice(i, i + 2));

  let overlap = 0;
  for (const bg of kBigrams) if (tBigrams.has(bg)) overlap++;
  return overlap / kBigrams.size;
}

function calcTextFieldMatch(queryKeywords: string, text: string): number {
  if (!queryKeywords || !text) return 0;
  const kws = tokenizeKeywords(queryKeywords);
  if (kws.length === 0) return 0;
  let totalScore = 0;
  for (const kw of kws) {
    const ov = ngramOverlapScore(kw, text);
    if (ov >= 0.6) totalScore += 1;
    else if (ov >= 0.3) totalScore += 0.5;
  }
  return totalScore / kws.length;
}

interface DisambiguationOptions {
  institution?: string;
  researchField?: string;
}

interface CandidateScore {
  candidate: any;
  score: number;
  instScore: number;
  breakdown: string[];
}

function scoreCandidate(candidate: any, opts: DisambiguationOptions): CandidateScore {
  const breakdown: string[] = [];
  let total = 0;
  let instScore = 0;

  const instQuery = opts.institution?.trim();
  const fieldQuery = opts.researchField?.trim();

  // ── 1. 机构-当前命中 (30) ──
  if (instQuery) {
    let instCurrentScore = 0;
    const s1 = calcWpMatchScore(instQuery, candidate.workplace_current);
    instCurrentScore = Math.round(WEIGHTS.INST_CURRENT * s1);
    if (instCurrentScore > 0) breakdown.push(`当前机构命中 +${instCurrentScore} (workplace match=${s1.toFixed(2)})`);
    total += instCurrentScore;
    instScore += instCurrentScore;

    // ── 2. 机构-历史工作 (25) ──
    let instWorkHistScore = 0;
    const workList = (candidate.work_experiences as any[]) || [];
    if (workList.length > 0) {
      let maxMatch = 0;
      for (const w of workList) {
        const employer = (w?.employer as string) || '';
        if (!employer) continue;
        const m = calcInstMatchScore(instQuery, employer);
        if (m > maxMatch) maxMatch = m;
      }
      instWorkHistScore = Math.round(WEIGHTS.INST_HISTORY_WORK * maxMatch);
      if (instWorkHistScore > 0) breakdown.push(`历史工作命中 +${instWorkHistScore} (最高匹配=${maxMatch.toFixed(2)})`);
    }
    total += instWorkHistScore;
    instScore += instWorkHistScore;

    // ── 3. 机构-历史教育 (20) ──
    let instEduHistScore = 0;
    const eduList = (candidate.education_backgrounds as any[]) || [];
    if (eduList.length > 0) {
      let maxMatch = 0;
      for (const e of eduList) {
        const cn = (e?.school_name_cn as string) || '';
        const en = (e?.school_name_en as string) || '';
        const m = Math.max(calcInstMatchScore(instQuery, cn), calcInstMatchScore(instQuery, en));
        if (m > maxMatch) maxMatch = m;
      }
      instEduHistScore = Math.round(WEIGHTS.INST_HISTORY_EDU * maxMatch);
      if (instEduHistScore > 0) breakdown.push(`历史教育命中 +${instEduHistScore} (最高匹配=${maxMatch.toFixed(2)})`);
    }
    total += instEduHistScore;
    instScore += instEduHistScore;
  }

  // ── 4. 研究领域关键词重叠 (15) ──
  if (fieldQuery) {
    const rf = (candidate.research_field as string) || '';
    const intro = (candidate.introduction as string) || '';
    const combined = `${rf} ${intro}`;
    const fieldMatch = calcTextFieldMatch(fieldQuery, combined);
    const fieldScore = Math.round(WEIGHTS.RESEARCH_FIELD * fieldMatch);
    if (fieldScore > 0) breakdown.push(`研究领域命中 +${fieldScore} (重叠度=${fieldMatch.toFixed(2)})`);
    total += fieldScore;
  }

  // ── 5. 数据完整度 (10) ──
  const patentCount = (candidate as any)._patent_count ?? (candidate.patents as any[])?.length ?? 0;
  const paperCount = (candidate as any)._paper_count ?? (candidate.papers as any[])?.length ?? 0;
  const workExpCount = (candidate.work_experiences as any[])?.length || 0;
  const richness = patentCount + paperCount + workExpCount;
  const richnessScore = Math.min(WEIGHTS.DATA_RICHNESS, Math.floor(richness / 5));
  if (richnessScore > 0) breakdown.push(`数据完整度 +${richnessScore} (专利${patentCount} + 论文${paperCount} + 工作${workExpCount})`);
  else breakdown.push(`数据完整度 +${richnessScore} (专利${patentCount} + 论文${paperCount} + 工作${workExpCount})`);
  total += richnessScore;

  return { candidate, score: total, instScore, breakdown };
}

interface DisambiguationResult {
  top: any;
  allScores: CandidateScore[];
  confidence: 'high' | 'low' | 'fallback';
  usedFallback: boolean;
}

function runPingfangDisambiguation(candidates: any[], opts: DisambiguationOptions): DisambiguationResult {
  const scored = candidates.map(c => scoreCandidate(c, opts));
  scored.sort((a, b) => b.score - a.score);

  const top = scored[0];
  let confidence: DisambiguationResult['confidence'] = 'high';
  let usedFallback = false;

  if (opts.institution) {
    const anyInstHit = scored.some(s => s.instScore > 0);
    if (!anyInstHit) {
      confidence = 'low';
      usedFallback = true;
    }
  }

  return { top: top.candidate, allScores: scored, confidence, usedFallback };
}

// ------------------------------------------------

export async function runTalentDeepSearchStream(query: string, institution: string, en_name?: string, cn_name?: string, userToken?: string) {
    if (!query) {
      throw new Error('Missing query');
    }

    let cleanQuery = query.trim().replace(/(?:特聘|客座|兼职|荣誉|终身|资深|首席)?(?:教授|副教授|助理教授|讲师|博士|硕士|研究员|副研究员|助理研究员|院士|博士生导师|硕士生导师|博导|硕导|主任医师|副主任医师|主治医师|先生|女士|同学|老师|主任|副主任|所长|副所长|院长|副院长|校长|副校长)$/g, '').trim();
    let searchName = cn_name || en_name || cleanQuery;

    return new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        };

        try {
          const allGatheredData: Record<string, any> = {};

          // Stage 0: Journal Memory — 快速匹配人才日志
          let journalEntry: TalentJournalEntry | null = null;
          try {
            journalEntry = await talentJournal.findByName(searchName, institution, userToken);
            // Journal 有效条件：有数据源记录 OR 有 structured_data OR 有 ai_report
            // （Admin 工具台保存时 ai_report 为空字符串，不能仅靠 ai_report 判断）
            const journalValid = journalEntry && (
              (journalEntry.data_sources && journalEntry.data_sources.length > 0) ||
              journalEntry.structured_data ||
              journalEntry.ai_report
            );
            if (journalValid) {
              sendEvent('log', { step: 'journal', message: `📚 发现历史档案（已被搜索 ${journalEntry!.search_count} 次，数据源: ${(journalEntry!.data_sources || []).join('、')}）` });
            } else {
              journalEntry = null;
              sendEvent('log', { step: 'journal', message: `📝 暂无历史档案，将完整检索` });
            }
          } catch (e) {
            sendEvent('log', { step: 'journal', message: `⚠️ 日志查询跳过` });
          }

          // Stage 0.5: AI Think (Pre-check)
          let aiThinkResult: { chinese_name?: string; english_name?: string; research_fields?: string; fallback_queries?: string[]; scholar_queries?: string[]; orcid_queries?: string[]; wiki_queries?: string[] } = {};
          try {
            sendEvent('log', { step: 'ai_think', message: `🧠 [大脑预检] 正在分析实体身份: ${searchName} ${institution || ''}...` });
            const client = getOpenAIClient();
            const prompt = `调用方已经确认了目标对象的身份：姓名"${searchName}"，机构"${institution || '未知'}"。
请你作为一个学术情报专家，推断并输出该学者的标准中英文名和研究领域。
返回严格的JSON，格式如下：
{
  "chinese_name": "中文名（如果有，否则为空）",
  "english_name": "标准英文名（如 Andrew Ng, Fei-Fei Li，如果没有常用英文名，请输出最标准的拼音格式如 San Zhang）",
  "research_fields": "核心研究领域关键词（中英文皆可）",
  "scholar_queries": ["用于 Google Scholar 的搜索词，如 'Andrew Ng'，最多2个"],
  "orcid_queries": ["用于 ORCID 的英文搜索词，如 'Andrew Ng'，最多2个"],
  "wiki_queries": ["用于 Wikipedia/百科 的搜索词，如 'Andrew Ng' 或 '吴恩达'，最多2个"],
  "fallback_queries": ["如果首选名字搜不到，应该尝试的英文名或别名搜索词，比如 ['Andrew Ng', 'Ng Andrew']。最多3个。"]
}`;
            const aiRes = await client.chat.completions.create({
              model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
              messages: [{ role: 'user', content: prompt }],
              response_format: { type: 'json_object' },
            });
            const content = aiRes.choices[0]?.message?.content || '{}';
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            aiThinkResult = JSON.parse(cleanContent);
            sendEvent('log', { step: 'ai_think', message: `✅ [大脑预检] 身份解析完成: 中文名=${aiThinkResult.chinese_name || '无'}, 英文名=${aiThinkResult.english_name || '无'}, 领域=${aiThinkResult.research_fields || '无'}` });
          } catch (e) {
            sendEvent('log', { step: 'ai_think', message: `⚠️ [大脑预检] 解析失败，将使用原始输入继续检索` });
          }

          // ════════════════════════════════════════════════════════════════════
          // Stage 1-4 并行化改造
          // Pingfang / Scholar / ORCID / Wikipedia / Internet 五个联网检索阶段
          // 互不依赖，用 Promise.allSettled 同时启动，总耗时从"各阶段之和"
          // 降为"最慢阶段"。原依赖 pfConfidence / Scholar 结果的消歧与主体
          // 一致性校验，统一放到并行完成后的"合并阶段"处理。
          // ════════════════════════════════════════════════════════════════════

          // ── Stage 1: Pingfang ──
          async function runPingfangStage(): Promise<{ top: any; pfConfidence: 'high' | 'low' | 'none' }> {
            // 优先使用 chinese_name，如果没有则使用 english_name，兜底原名
            const pingfangQuery = aiThinkResult.chinese_name || aiThinkResult.english_name || searchName;
            let pingfangCandidates: any[] = [];
            let topPingfangRecord: any = null;
            let pfConfidence: 'high' | 'low' | 'none' = 'none';
            let pingfangSkippedByJournal = false;

            // Journal 短路：如果历史档案中有平方数据，直接复用，跳过整个 Pingfang 搜索
            // 条件1: structured_data.pingfang 存在（最新版保存的原始数据）
            // 条件2: pingfang_id 存在（旧版保存的记录，虽然没存 raw 但有 ID，可用于后续匹配）
            const journalHasPingfang = journalEntry?.structured_data?.pingfang || journalEntry?.pingfang_id;
            if (journalHasPingfang) {
              if (journalEntry?.structured_data?.pingfang) {
                topPingfangRecord = journalEntry.structured_data.pingfang;
              }
              pfConfidence = 'high';
              pingfangSkippedByJournal = true;
              sendEvent('log', { step: 'pingfang', message: `✅ 已匹配到人才数据基础设施` });
              sendEvent('log', { step: 'pingfang', message: `📋 [Journal] 复用历史平方数据，ID=${topPingfangRecord?.id || journalEntry?.pingfang_id || '无'}, 跳过 Pingfang 搜索` });
              if (topPingfangRecord) allGatheredData['pingfang'] = topPingfangRecord;
            } else {
              // 正常 Pingfang 搜索流程
              sendEvent('log', { step: 'pingfang', message: `🔍 [第一阶段] 正在平方数据基础设施检索学者图谱...` });

              try {
                pingfangCandidates = await talentService.searchTalentsLite(pingfangQuery, 5);
                sendEvent('log', { step: 'pingfang', message: `📋 正在拉取教育经历与工作履历...` });
              } catch (e) {
                sendEvent('log', { step: 'pingfang', message: `⚠️ 平方检索异常，将尝试其他数据源...` });
              }

              // 智能变体兜底：仅使用 AI Think 推荐的 fallback_queries（不再使用机械拼音变体）
              if (pingfangQuery && aiThinkResult.fallback_queries && aiThinkResult.fallback_queries.length > 0) {
                let needFallback = pingfangCandidates.length === 0;
                if (!needFallback && institution) {
                  const preCheck = runPingfangDisambiguation(pingfangCandidates, { institution, researchField: aiThinkResult.research_fields });
                  if (!preCheck.allScores.some(s => s.instScore > 0)) needFallback = true;
                }
                if (needFallback) {
                  const variants = aiThinkResult.fallback_queries.slice(0, 3); // 最多 3 个 AI 推荐变体

                  sendEvent('log', { step: 'pingfang', message: `↪️ 检索无结果或机构未命中，尝试 AI 推荐变体: ${variants.join(', ')}` });
                  const existingIds = new Set(pingfangCandidates.map((c: any) => (c as any).id));
                  for (const variant of variants) {
                    try {
                      const alt = await talentService.searchTalentsLite(variant, 5);
                      if (alt.length > 0) {
                        const newOnes = alt.filter((c: any) => !existingIds.has((c as any).id));
                        if (newOnes.length > 0) {
                          newOnes.forEach((c: any) => existingIds.add((c as any).id));
                          sendEvent('log', { step: 'pingfang', message: `✅ 用变体 "${variant}" 找到 ${alt.length} 条候选 (新增 ${newOnes.length} 条)` });
                          pingfangCandidates = [...pingfangCandidates, ...newOnes];
                          sendEvent('log', { step: 'pingfang', message: `🔀 当前共 ${pingfangCandidates.length} 条候选` });
                        } else {
                          sendEvent('log', { step: 'pingfang', message: `↩️ 变体 "${variant}" 命中但无新增候选，继续下一个...` });
                        }
                      }
                    } catch (e) { /* 单个变体失败继续 */ }
                  }
                }
              }

              if (pingfangCandidates.length === 0 && !pingfangSkippedByJournal) {
                sendEvent('log', { step: 'pingfang', message: `❌ 未找到匹配结果。` });
                pfConfidence = 'none';
              } else if (!pingfangSkippedByJournal && pingfangCandidates.length > 0) {
                sendEvent('log', { step: 'pingfang', message: `🔀 正在进行智能身份匹配...` });
                const disResult = runPingfangDisambiguation(pingfangCandidates, { institution, researchField: aiThinkResult.research_fields });

                // ── 详细日志（仅 Admin 测试台可见，Chat 模式会被 sanitizeToolLog 过滤） ──
                const instLabel = institution ? ` (机构线索: "${institution}")` : ' (无机构线索)';
                if (pingfangCandidates.length === 1) {
                  sendEvent('log', { step: 'pingfang', message: `✅ 找到 1 条候选${instLabel}，验证机构匹配...` });
                } else {
                  sendEvent('log', { step: 'pingfang', message: `⚠️ 发现 ${pingfangCandidates.length} 位同名学者${instLabel}，开始智能消歧...` });
                }

                for (let i = 0; i < disResult.allScores.length; i++) {
                  const s = disResult.allScores[i];
                  const c = s.candidate;
                  const cName = (c.name as string) || '';
                  const cInst = splitWpValues(c.workplace_current).join('、') || '无机构';
                  const cField = (c.research_field as string)?.substring(0, 30) || '';
                  const marker = i === 0 ? '⬅️ 选中' : '   ';
                  sendEvent('log', {
                    step: 'pingfang',
                    message: `   ${marker} [${s.score}分] ${cName} | ${cInst}${cField ? ' | ' + cField : ''}${i === 0 ? '' : ''}`,
                  });
                  if (s.breakdown.length > 0 && i === 0) {
                    sendEvent('log', { step: 'pingfang', message: `      评分明细: ${s.breakdown.join('; ')}` });
                  }
                }

                if (disResult.confidence === 'high') {
                  sendEvent('log', { step: 'pingfang', message: `✅ 消歧完成，已选定最优匹配（置信度：高）` });
                  pfConfidence = 'high';
                } else if (disResult.confidence === 'low') {
                  sendEvent('log', { step: 'pingfang', message: `⚠️ 消歧完成，但无候选命中机构线索（置信度：低），可能需要人工确认` });
                  pfConfidence = 'low';
                } else {
                  sendEvent('log', { step: 'pingfang', message: `⚠️ 消歧完成（纯数据完整度兜底，置信度：最低）` });
                  pfConfidence = 'low';
                }

                topPingfangRecord = disResult.top;

                // 消歧选出 top1 后，拉取完整的专利/论文/基金项目详情
                if (topPingfangRecord) {
                  sendEvent('log', { step: 'pingfang', message: `📄 正在拉取学术成果（论文/专利）...` });
                  try {
                    topPingfangRecord = await talentService.enrichTalentFull(topPingfangRecord);
                  } catch (e) {
                    sendEvent('log', { step: 'pingfang', message: `⚠️ 学术成果拉取部分失败，继续...` });
                  }
                }
                if (topPingfangRecord) {
                  allGatheredData['pingfang'] = topPingfangRecord;
                }
              }
            } // end if/else: Journal short-circuit vs normal Pingfang flow
            sendEvent('log', { step: 'pingfang', message: `✅ 学者档案检索完成` });
            return { top: topPingfangRecord, pfConfidence };
          }

          // ── Stage 2: Scholar ──
          async function runScholarStage(): Promise<{ topScholar: any; topScholarInstScore: number }> {
            let topScholarInstScore = 0;
            let scholarQuery: string;
            // 并行化：不再依赖 Pingfang 置信度，优先预检 Query，其次英文名，最后兜底拼音
            if (aiThinkResult.scholar_queries && aiThinkResult.scholar_queries.length > 0) {
              scholarQuery = aiThinkResult.scholar_queries[0];
            } else if (aiThinkResult.english_name) {
              scholarQuery = aiThinkResult.english_name;
            } else {
              scholarQuery = en_name || searchName;
              if (!en_name && /^[\u4e00-\u9fa5]+$/.test(searchName.trim())) {
                const pyVars = generatePinyinVariants(searchName);
                if (pyVars.length > 0) scholarQuery = pyVars[0]; // Li Feifei 格式
              }
            }
            sendEvent('log', { step: 'scholar', message: `🔍 [第二阶段] 正在检索 Google Scholar 学术主页: ${scholarQuery}...` });
            const serpApiKey = process.env.SERPAPI_KEY;
            if (!serpApiKey) {
              sendEvent('log', { step: 'scholar', message: `⚠️ 未配置 SERPAPI_KEY，跳过 Google Scholar 检索。` });
              return { topScholar: null, topScholarInstScore: 0 };
            }
            try {
              // 使用 SerpAPI Google Scholar Profiles
              const gsSearchQuery = institution ? `${scholarQuery} ${institution}` : scholarQuery;
              const gsProfileUrl = `https://serpapi.com/search.json?engine=google_scholar_profiles&mauthors=${encodeURIComponent(gsSearchQuery)}&api_key=${serpApiKey}`;
              const scholarRes = await fetch(gsProfileUrl);
              if (scholarRes.ok) {
                const scholarData = await scholarRes.json();
                const gsProfiles = scholarData?.profiles || [];
                if (gsProfiles.length > 0) {

                  // 构造交叉验证线索
                  const clueInsts: string[] = [];
                  const clueFields: string[] = [];
                  if (institution) clueInsts.push(institution);
                  // 并行化：研究领域线索改用 AI 预检结果（Pingfang 结果此时尚未就绪）
                  const pfField = (aiThinkResult.research_fields as string) || '';
                  if (pfField) clueFields.push(pfField);

                  // 对每个 Google Scholar Profile 打分
                  const scholarScored = gsProfiles.map((s: any) => {
                    const breakdown: string[] = [];
                    let score = 0;
                    let scholarInstScore = 0;

                    // 机构匹配（30分）— Google Scholar 的 affiliations 是学者自填的单字符串
                    const gsAffiliation = (s.affiliations || '').toLowerCase();
                    if (clueInsts.length > 0 && gsAffiliation) {
                      let maxInstMatch = 0;
                      for (const clue of clueInsts) {
                        if (!clue) continue;
                        const m = calcInstMatchScore(clue, gsAffiliation);
                        if (m > maxInstMatch) maxInstMatch = m;
                      }
                      scholarInstScore = Math.round(30 * maxInstMatch);
                      score += scholarInstScore;
                      if (scholarInstScore > 0) breakdown.push(`机构交叉命中 +${scholarInstScore}`);
                    }

                    // 研究方向匹配（15分）— interests 数组
                    const gsInterests: string = (s.interests || []).map((i: any) => i.title || i).join(' ');
                    if (clueFields.length > 0 && gsInterests) {
                      const fieldQuery = clueFields.join(' ');
                      const fm = calcTextFieldMatch(fieldQuery, gsInterests);
                      const fieldScore = Math.round(15 * fm);
                      score += fieldScore;
                      if (fieldScore > 0) breakdown.push(`领域交叉命中 +${fieldScore}`);
                    }

                    // 引用量加成（最多5分）
                    const citedBy = s.cited_by || 0;
                    score += Math.min(5, Math.floor(citedBy / 5000));

                    // 标准化为兼容下游的结构
                    const normalized = {
                      display_name: s.name || '',
                      cited_by_count: citedBy,
                      affiliations: s.affiliations || '',
                      last_known_institutions: s.affiliations ? [{ display_name: s.affiliations }] : [],
                      interests: (s.interests || []).map((i: any) => ({ title: i.title || i })),
                      summary_stats: { h_index: null as number | null },
                      works_count: 0,
                      author_id: s.author_id || '',
                      scholar_url: s.link || '',
                    };

                    return { scholar: normalized, score, scholarInstScore, breakdown };
                  });

                  scholarScored.sort((a: any, b: any) => b.score - a.score);
                  const topScholar = scholarScored[0];
                  topScholarInstScore = topScholar.scholarInstScore;

                  // 如果有 author_id，拉取详细信息（h-index）
                  if (topScholar.scholar.author_id) {
                    try {
                      const authorDetailUrl = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${topScholar.scholar.author_id}&api_key=${serpApiKey}&num=5`;
                      const detailRes = await fetch(authorDetailUrl);
                      if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        const citedByTable = detailData?.cited_by?.table;
                        if (citedByTable) {
                          for (const row of citedByTable) {
                            if (row.citations) topScholar.scholar.cited_by_count = row.citations.all || topScholar.scholar.cited_by_count;
                            if (row.h_index) topScholar.scholar.summary_stats.h_index = row.h_index.all;
                          }
                        }
                        topScholar.scholar.works_count = (detailData?.articles || []).length;
                      }
                    } catch { /* h-index 拉取失败不影响主流程 */ }
                  }

                  // 日志：展示消歧过程
                  if (scholarScored.length > 1) {
                    sendEvent('log', { step: 'scholar', message: `⚠️ Google Scholar 返回 ${scholarScored.length} 条候选，用机构/领域线索消歧...` });
                    for (let i = 0; i < Math.min(scholarScored.length, 3); i++) {
                      const sc = scholarScored[i];
                      const marker = i === 0 ? '⬅️ 选中' : '   ';
                      sendEvent('log', {
                        step: 'scholar',
                        message: `   ${marker} [${sc.score}分 机构${sc.scholarInstScore}] ${sc.scholar.display_name} | affil=${sc.scholar.affiliations || '?'} | h=${sc.scholar.summary_stats?.h_index ?? '?'} | cited=${sc.scholar.cited_by_count}`,
                      });
                      if (sc.breakdown.length > 0 && i === 0) {
                        sendEvent('log', { step: 'scholar', message: `      ${sc.breakdown.join('; ')}` });
                      }
                    }
                  }

                  // 用独立 scholarInstScore 判定机构命中
                  const anyInstHit = scholarScored.some((s: any) => s.scholarInstScore > 0);
                  if (!anyInstHit && clueInsts.length > 0) {
                    sendEvent('log', { step: 'scholar', message: `⚠️ 无 Scholar 候选命中机构线索，可能拿错人，谨慎参考` });
                  }

                  // 主体一致性校验移到并行完成后的"合并阶段"（需要 pfConfidence）
                  return { topScholar: topScholar.scholar, topScholarInstScore };
                } else {
                  sendEvent('log', { step: 'scholar', message: `❌ Google Scholar Profiles 未找到匹配结果。` });
                }
              }
            } catch (e) {
              sendEvent('log', { step: 'scholar', message: `⚠️ Google Scholar 检索失败: ${e}` });
            }
            return { topScholar: null, topScholarInstScore: 0 };
          }

          // ── Stage 2.5: ORCID ──
          async function runOrcidStage(): Promise<any> {
            // 并行化：不再依赖 Scholar 短路路径（pfConfidence / Scholar 结果并行后才就绪），
            // 直接用 AI 预检结果走完整搜索；若 Scholar 最终命中高置信度 ORCID，
            // 由"合并阶段"做短路复用兜底，避免重复请求。
            const orcidInstClue = institution || '';
            try {
              const orcidToken = await getOrcidToken();
              if (!orcidToken) {
                sendEvent('log', { step: 'orcid', message: `⚠️ 未配置 ORCID API 密钥。` });
                return null;
              }
              sendEvent('log', { step: 'orcid', message: `🔍 [第二阶段.5] 正在执行 ORCID 完整搜索...` });
              const result = await runOrcidFullSearch(orcidToken, {
                pfConfidence: 'none' as const, orcidInstClue, institution,
                topPingfangRecord: null, en_name, searchName, aiThinkResult,
              });
              if (result) {
                allGatheredData['orcid'] = result;
                return result;
              }
              return null;
            } catch (e) {
              sendEvent('log', { step: 'orcid', message: `⚠️ ORCID 检索失败: ${e}` });
              return null;
            }
          }

          // ── 完整搜索的内部实现（抽出来避免 Stage 2.5 块太长）──
          async function runOrcidFullSearch(
            token: string,
            ctx: {
              pfConfidence: 'high' | 'low' | 'none';
              orcidInstClue: string;
              institution: string;
              topPingfangRecord: any;
              en_name?: string;
              searchName: string;
              scholarName?: string;
              aiThinkResult?: any;
            },
          ): Promise<any> {
            const { pfConfidence, orcidInstClue, en_name, searchName, scholarName, aiThinkResult } = ctx;

            // Step 1: 构造 orcidQuery（优先使用预检专属 Query）
            let orcidQuery: string;
            if (aiThinkResult?.orcid_queries && aiThinkResult.orcid_queries.length > 0) {
              orcidQuery = aiThinkResult.orcid_queries[0];
            } else if (pfConfidence === 'high') {
              orcidQuery = (ctx.topPingfangRecord?.name_en as string) || scholarName || en_name || searchName;
            } else {
              orcidQuery = en_name || searchName;
            }
            // 中文 → 统一用 generatePinyinVariants
            if (/^[\u4e00-\u9fa5]+$/.test(orcidQuery.trim())) {
              const pyVars = generatePinyinVariants(orcidQuery);
              if (pyVars.length > 0) {
                orcidQuery = pyVars[0];
                sendEvent('log', { step: 'orcid', message: `   中文名自动转为拼音: ${orcidQuery}` });
              }
            }

            // Step 2: 拆 given + family
            let englishName = orcidQuery.replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').trim();
            englishName = englishName.replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim();
            const nameParts = englishName.split(/\s+/);
            const givenNames = nameParts.slice(0, -1).join(' ') || nameParts[0];
            const familyName = nameParts[nameParts.length - 1];

            // Step 3: 机构关键词
            const instKeyword = orcidInstClue
              ? (orcidInstClue.split(/\s+/).find((w: string) => w.length > 3 && /^[A-Z]/.test(w))
                 || orcidInstClue.split(' ')[0] || '')
              : '';

            sendEvent('log', { step: 'orcid', message: `   查询: ${givenNames} ${familyName}${instKeyword ? ' | 机构: ' + instKeyword : ''}` });

            const candidates = await orcidSearch(token, givenNames, familyName, instKeyword || undefined);
            if (candidates.length === 0) {
              sendEvent('log', { step: 'orcid', message: `❌ 未找到匹配的 ORCID 记录。` });
              return null;
            }

            let bestOrcidId = candidates[0].path;
            let bestEmployments: any[] = [];

            // Step 4: 多候选消歧（用 calcInstMatchScore）
            if (candidates.length > 1 && orcidInstClue) {
              sendEvent('log', { step: 'orcid', message: `⚠️ ORCID 返回 ${candidates.length} 条候选，用机构线索消歧...` });
              const empResults = await Promise.all(
                candidates.slice(0, 3).map(async (c: any) => ({
                  path: c.path,
                  employments: await orcidGetEmployments(token, c.path),
                })),
              );
              let bestScore = 0;
              for (const r of empResults) {
                let maxMatch = 0;
                for (const e of r.employments) {
                  const m = calcInstMatchScore(orcidInstClue, e.org);
                  if (m > maxMatch) maxMatch = m;
                }
                if (maxMatch > bestScore) {
                  bestScore = maxMatch;
                  bestOrcidId = r.path;
                  bestEmployments = r.employments;
                }
              }
              sendEvent('log', {
                step: 'orcid',
                message: `   ⬅️ 选中 [机构匹配度 ${bestScore.toFixed(2)}] ${bestOrcidId}${bestEmployments[0]?.org ? ' | ' + bestEmployments[0].org : ''}`,
              });
              if (bestEmployments.length === 0) bestEmployments = await orcidGetEmployments(token, bestOrcidId);
            } else {
              bestEmployments = await orcidGetEmployments(token, bestOrcidId);
            }

            // Step 5: 拉详情
            sendEvent('log', { step: 'orcid', message: `✅ 成功定位 ORCID 档案: ${bestOrcidId}` });
            const [educations, works] = await Promise.all([
              orcidGetEducations(token, bestOrcidId),
              orcidGetWorks(token, bestOrcidId, 10),
            ]);
            return {
              orcid_id: bestOrcidId, employments: bestEmployments, educations, works,
              url: `https://orcid.org/${bestOrcidId}`,
            };
          }


          // ── Stage 3: Wikipedia / 百度百科 ──
          // 并行化：不再依赖 pfConfidence / topPingfangRecord / Scholar 结果
          //（这些数据由并行阶段产出，此时尚未就绪），改用 AI 预检结果作为
          // 查询与交叉验证线索；合并阶段会基于平方/Scholar 机构线索做二次校验。
          async function runWikiStage(): Promise<{ foundWiki: boolean }> {
            // ── 优先使用 AI 预检专属 Query，其次预检英文名，最后兜底 ──
            let osintQuery: string;
            if (aiThinkResult.wiki_queries && aiThinkResult.wiki_queries.length > 0) {
              osintQuery = aiThinkResult.wiki_queries[0];
            } else {
              osintQuery = aiThinkResult.english_name || en_name || searchName;
            }
            const bkQuery = aiThinkResult.chinese_name || cn_name || searchName;

            // ── 交叉验证线索（并行化：机构 + AI 预检领域词代替平方/Scholar 机构）──
            const clueInsts: string[] = [];
            if (institution) clueInsts.push(institution);
            const pfField = (aiThinkResult.research_fields as string) || '';
            if (pfField) {
              pfField.split(/[、,，;；]/).forEach((f: string) => {
                const t = f.trim();
                if (t) clueInsts.push(t);
              });
            }
            const uniqueClueInsts = [...new Set(clueInsts.filter(Boolean))];

            sendEvent('log', { step: 'wikipedia', message: `🔍 [第三阶段] 正在检索维基百科 (Wikipedia): ${osintQuery}...` });
            let foundWiki = false;
            try {
              // ── 【修复 2】从 srlimit=1 改为 srlimit=5 ──
              const wikiQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(osintQuery)}&srlimit=5&utf8=&format=json&origin=*`;
              const wikiRes = await fetch(wikiQueryUrl);
              if (wikiRes.ok) {
                const wikiData = await wikiRes.json();
                if (wikiData.query?.search?.length > 0) {
                  const wikiResults = wikiData.query.search;

                  // ── 【修复 3】多条候选 → 拉 extract + 机构交叉验证 ──
                  const wikiScored: Array<{ pageid: number; title: string; url: string; biography: string; score: number; instScore: number }> = [];
                  for (const w of wikiResults) {
                    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${w.pageid}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
                    try {
                      const contentRes = await fetch(contentUrl);
                      if (!contentRes.ok) continue;
                      const contentData = await contentRes.json();
                      const pageObj = contentData.query?.pages?.[w.pageid];
                      if (!pageObj?.extract) continue;
                      const bio = pageObj.extract.substring(0, 2000);

                      // 机构交叉验证：extract 里搜 clueInsts
                      let instScore = 0;
                      for (const clue of uniqueClueInsts) {
                        if (bio.toLowerCase().includes(clue.toLowerCase())) {
                          instScore += 1;
                        } else {
                          // 尝试关键词重叠
                          const clueWords = clue.split(/\s+/).filter(ww => ww.length > 2);
                          const hitWords = clueWords.filter(ww => bio.toLowerCase().includes(ww.toLowerCase()));
                          if (hitWords.length > 0) instScore += 0.3 * hitWords.length;
                        }
                      }

                      wikiScored.push({
                        pageid: w.pageid,
                        title: w.title,
                        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(w.title.replace(/ /g, '_'))}`,
                        biography: bio.substring(0, 1500),
                        score: instScore,
                        instScore,
                      });
                    } catch { /* skip one failed page */ }
                  }

                  if (wikiScored.length > 0) {
                    wikiScored.sort((a, b) => b.score - a.score);
                    const topWiki = wikiScored[0];

                    if (topWiki.instScore > 0) {
                      sendEvent('log', { step: 'wikipedia', message: `✅ 成功提取维基百科词条 (机构匹配 ${topWiki.instScore.toFixed(1)}): ${topWiki.title}` });
                    } else {
                      sendEvent('log', { step: 'wikipedia', message: `⚠️ Wikipedia 返回 ${wikiResults.length} 条候选，但无机构匹配，降级用第一条: ${topWiki.title}` });
                    }
                    allGatheredData['wikipedia'] = {
                      biography: topWiki.biography,
                      url: topWiki.url,
                      _wikiScore: topWiki.instScore,
                    };
                    foundWiki = true;
                  }
                }
              }
            } catch (e) {
              sendEvent('log', { step: 'wikipedia', message: `⚠️ Wiki检索失败: ${e}` });
            }

            if (!foundWiki) {
              sendEvent('log', { step: 'wikipedia', message: `⚠️ Wikipedia 未找到（返回 0 条），降级检索百度百科...` });
              // ── 【修复 4】百度百科变体查询 ──
              const bkVariants = [bkQuery];
              if (institution) bkVariants.push(`${bkQuery} ${institution.split(' ')[0]}`);
              bkVariants.push(`${bkQuery} 教授`);
              bkVariants.push(`${bkQuery} 学者`);

              let bkAccepted = false;
              for (const bkV of bkVariants) {
                if (bkAccepted) break;
                try {
                  const bkUrl = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=${encodeURIComponent(bkV)}&bk_length=1500`;
                  const bkRes = await fetch(bkUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                  const bkData = await bkRes.json();
                  if (bkData && bkData.id && bkData.abstract) {
                    const bio = bkData.abstract.replace(/<[^>]+>/g, '').substring(0, 1500);
                    // 机构交叉验证
                    let bkInstScore = 0;
                    for (const clue of uniqueClueInsts) {
                      if (bio.toLowerCase().includes(clue.toLowerCase())) { bkInstScore += 1; break; }
                    }
                    allGatheredData['baike'] = {
                      biography: bio,
                      url: bkData.url || `https://baike.baidu.com/item/${encodeURIComponent(bkV)}`,
                      _bkScore: bkInstScore,
                    };
                    if (bkInstScore > 0) {
                      sendEvent('log', { step: 'wikipedia', message: `✅ 成功提取百度百科词条 (机构匹配 ${bkInstScore.toFixed(1)})。` });
                    } else {
                      sendEvent('log', { step: 'wikipedia', message: `⚠️ 百度百科词条无机构匹配，降级接受 (查询词: ${bkV})。` });
                    }
                    bkAccepted = true;
                  }
                } catch (e) { /* skip one variant */ }
              }
              if (!bkAccepted) {
                sendEvent('log', { step: 'wikipedia', message: `❌ 百度百科亦未找到匹配词条。` });
              }
            }
            return { foundWiki };
          }

          // ── Stage 4: Internet ──
          // 并行化：queryEN 无法再依赖 pfConfidence / topPingfangRecord / Scholar
          //（这些数据由并行阶段产出，此时尚未就绪），改用 AI 预检的英文名兜底。
          async function runInternetStage(): Promise<void> {
            sendEvent('log', { step: 'internet', message: `🔍 [第四阶段] 正在执行全网深度检索 (Search Internet)...` });
            const queryCN = cn_name || searchName;
            const queryEN = en_name || aiThinkResult.english_name || '';
            try {
              const searchQueries = [queryCN, queryEN].filter(Boolean);
              let internetFound = false;

              const geminiKey = process.env.GEMINI_API_KEY;
              if (geminiKey) {
                sendEvent('log', { step: 'internet', message: `🚀 启动 Gemini Search Grounding (Google 搜索直连)...` });
                const genAI = new GoogleGenerativeAI(geminiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} }] as any });
                const query = `Please use Google Search to find detailed biography and academic achievements for "${searchQueries.join(' OR ')}" ${institution ? 'at ' + institution : ''}. Provide a detailed summary in Chinese.`;
                
                const result = await model.generateContent(query);
                const text = result.response.text();
                if (text && text.length > 50) {
                   sendEvent('log', { step: 'internet', message: `✅ Gemini 全网检索成功。` });
                   allGatheredData['internet'] = text;
                   internetFound = true;
                }
              }
              
              if (!internetFound) {
                sendEvent('log', { step: 'internet', message: `⚠️ ${geminiKey ? 'Gemini 结果不足' : '未配置 Gemini'}，降级使用 阿里云/Bocha 综合检索...` });
                const query1 = queryEN ? `${queryCN} OR ${queryEN}` : queryCN;
                const webRes = await searchWeb(`${query1} ${institution || ''}`.trim());
                if (webRes && webRes.AbstractText && webRes.AbstractText.length > 20) {
                   sendEvent('log', { step: 'internet', message: `✅ 综合全网检索获得数据补充。` });
                   allGatheredData['internet'] = webRes.AbstractText;
                } else {
                   sendEvent('log', { step: 'internet', message: `❌ 全网检索无有效信息。` });
                   allGatheredData['internet'] = '无额外有效信息';
                }
              }
            } catch (e) {
              sendEvent('log', { step: 'internet', message: `⚠️ 全网检索失败: ${e}` });
              sendEvent('log', { step: 'internet', message: `⚠️ Gemini 检索异常，降级使用 阿里云/Bocha 综合检索...` });
              try {
                const query1 = queryEN ? `${queryCN} OR ${queryEN}` : queryCN;
                const webRes = await searchWeb(`${query1} ${institution || ''}`.trim());
                if (webRes && webRes.AbstractText && webRes.AbstractText.length > 20) {
                   sendEvent('log', { step: 'internet', message: `✅ 综合全网检索获得数据补充。` });
                   allGatheredData['internet'] = webRes.AbstractText;
                } else {
                   sendEvent('log', { step: 'internet', message: `❌ 全网检索无有效信息。` });
                   allGatheredData['internet'] = '无额外有效信息';
                }
              } catch (fallbackError) {
                 sendEvent('log', { step: 'internet', message: `⚠️ Bocha 降级检索也失败: ${fallbackError}` });
                 allGatheredData['internet'] = '检索异常';
              }
            }
          }

          // ════════════════════════════════════════════════════════════════════
          // 并行执行：5 个联网检索阶段同时启动，总耗时 ≈ 最慢阶段
          //（串行版总耗时 = 各阶段之和，两者差距可达数倍）
          // ════════════════════════════════════════════════════════════════════
          const [pfResult, scholarResult, orcidResult, wikiResult, internetResult] = await Promise.allSettled([
            runPingfangStage(),
            runScholarStage(),
            runOrcidStage(),
            runWikiStage(),
            runInternetStage(),
          ]);

          // ════════════════════════════════════════════════════════════════════
          // 合并阶段：汇总并行结果，恢复串行模式下依赖的校验与短路逻辑
          // ════════════════════════════════════════════════════════════════════

          // 1) 汇总各阶段结果（任一阶段失败不阻塞主流程）
          const pfData = pfResult.status === 'fulfilled'
            ? pfResult.value
            : { top: null as any, pfConfidence: 'none' as const };
          const scholarData = scholarResult.status === 'fulfilled'
            ? scholarResult.value
            : { topScholar: null as any, topScholarInstScore: 0 };

          // 2) 重新赋值外层变量，供 Stage 4.5 / Gap-Filling / AI Assemble 使用
          let topPingfangRecord: any = pfData.top;
          let pfConfidence: 'high' | 'low' | 'none' = pfData.pfConfidence;

          // 3) Scholar 主体一致性校验（原串行逻辑，依赖 pfConfidence，只能放合并阶段）
          if (scholarData.topScholar) {
            if (pfConfidence === 'high') {
              const consistency = subjectConsistencyCheck(topPingfangRecord, scholarData.topScholar, pfConfidence);
              if (consistency.pass) {
                sendEvent('log', { step: 'scholar', message: `✅ 成功定位学术档案 (H-index: ${scholarData.topScholar.summary_stats?.h_index || '未知'}) — 主体一致性校验通过 (得分=${consistency.score}, ${consistency.reasons.join('; ') || '名字匹配'})` });
                allGatheredData['scholar'] = scholarData.topScholar;
              } else {
                sendEvent('log', { step: 'scholar', message: `❌ Scholar 主体一致性校验失败 (得分=${consistency.score}，阈值 30)，疑似同名不同人，丢弃 Scholar 数据。详情: ${consistency.reasons.join('; ') || '机构/领域均未命中'}` });
              }
            } else {
              sendEvent('log', { step: 'scholar', message: `✅ 成功定位学术档案 (H-index: ${scholarData.topScholar.summary_stats?.h_index || '未知'})` });
              allGatheredData['scholar'] = scholarData.topScholar;
            }
          }

          // 4) ORCID 短路兜底：并行阶段已执行完整搜索；若未命中，且 Scholar 提供
          //    高置信度 ORCID（平方锚点 + 机构命中），则复用 Scholar 的 ORCID。
          if (pfConfidence === 'high' && !allGatheredData['orcid'] && allGatheredData['scholar']) {
            const scholarOrcidUrl: string | undefined = allGatheredData['scholar']?.orcid
              || allGatheredData['scholar']?.ids?.orcid;
            const scholarOrcidId = scholarOrcidUrl ? String(scholarOrcidUrl).replace(/^https?:\/\/orcid\.org\//, '').trim() : '';
            if (scholarOrcidId && scholarData.topScholarInstScore > 0) {
              try {
                const orcidToken = await getOrcidToken();
                if (orcidToken) {
                  sendEvent('log', { step: 'orcid', message: `🔍 [合并兜底] 完整搜索未命中，复用 Scholar 高置信度 ORCID: ${scholarOrcidId}` });
                  const [employments, educations, works] = await Promise.all([
                    orcidGetEmployments(orcidToken, scholarOrcidId),
                    orcidGetEducations(orcidToken, scholarOrcidId),
                    orcidGetWorks(orcidToken, scholarOrcidId, 10),
                  ]);
                  sendEvent('log', { step: 'orcid', message: `✅ 成功定位 ORCID 档案（Scholar 复用）: ${scholarOrcidId}` });
                  allGatheredData['orcid'] = {
                    orcid_id: scholarOrcidId, employments, educations, works,
                    url: `https://orcid.org/${scholarOrcidId}`,
                  };
                }
              } catch (e) { /* 兜底失败不影响主流程 */ }
            }
          }

          // 5) Wikipedia/百科 二次交叉验证补偿：并行时 Wiki 阶段无法使用平方/Scholar
          //    机构线索，这里用合并后的线索复查词条是否与锚点同一人。
          if (pfConfidence === 'high' && topPingfangRecord) {
            const mergedInsts = splitWpValues(topPingfangRecord.workplace_current);
            const bioSource = allGatheredData['wikipedia']?.biography || allGatheredData['baike']?.biography || '';
            if (mergedInsts.length > 0 && bioSource) {
              const hit = mergedInsts.some((v: string) => v && bioSource.toLowerCase().includes(v.toLowerCase()));
              if (!hit) {
                sendEvent('log', { step: 'wikipedia', message: `⚠️ [合并校验] 平方机构线索与百科词条无重叠，词条可能为同名他人，仅供参考` });
              }
            }
          }

          sendEvent('log', {
            step: 'engine',
            message: `⚡ 并行检索完成 — 平方=${pfData.top ? (pfConfidence === 'high' ? '✅' : '⚠️') : '❌'} | Scholar=${allGatheredData['scholar'] ? '✅' : '❌'} | ORCID=${allGatheredData['orcid'] ? '✅' : '—'} | Wiki=${wikiResult.status === 'fulfilled' && wikiResult.value.foundWiki ? '✅' : '—'} | 全网=${allGatheredData['internet'] ? '✅' : '—'}`,
          });

                    // ── Stage 4.5: 人名纠错回退 ──────────────────────────────────────
          // 当 pfConfidence !== 'high' 时触发纠错：
          //   - pfConfidence === 'none' → 平方和 Scholar 都没找到任何数据
          //   - pfConfidence === 'low'  → 平方和 Scholar 找到了但消歧置信度低（搜偏了人名）
          // 这两种情况都极有可能是用户打错了名字，尝试 AI 纠错。
          if (pfConfidence !== 'high') {
            sendEvent('log', { step: 'name_correction', message: `🔎 [纠错阶段] 核心学术库置信度不足，正在尝试人名纠错...` });
            try {
              // 1. 用 searchWeb（阿里云 qwen-plus + enable_search）搜一次纠错
              const correctionQuery = `"${searchName}" ${institution || ''} 教授 学者 "你是不是要找"`.trim();
              const correctionRes = await searchWeb(correctionQuery);
              const correctionText = correctionRes?.AbstractText || '';

              // 2. 用已有的 DashScope AI 从搜索结果中提取可能的正确人名
              if (correctionText.length > 20) {
                const correctionClient = getOpenAIClient();
                const correctionAIRes = await correctionClient.chat.completions.create({
                  model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
                  messages: [{
                    role: 'user',
                    content: `用户搜索了学者"${searchName}"${institution ? `（${institution}相关）` : ''}，但在平方数据库、Google Scholar、Wikipedia、百度百科和全网搜索中均未找到此人。

以下是全网搜索返回的参考信息：
${correctionText.substring(0, 2000)}

请判断：是否存在一位姓名与"${searchName}"非常相似（同音不同字、少一个字、错别字等）且确实存在的知名学者/教授？

回答规则：
- 如果找到了姓名相似且其他要素（研究领域、所属机构等）也吻合的学者，请只返回纠正后的正确姓名（纯文本，不加任何多余解释）
- 如果没有找到、或找到的人其他要素完全不同（比如不是同一领域、不是同一类型的人），请只返回空字符串
- 绝对不要为了给出答案而胡乱推荐名字仅仅相似但完全不相关的人`
                  }],
                  max_tokens: 50,
                });

                const correctedName = (correctionAIRes.choices[0]?.message?.content || '').trim();
                
                // 3. 如果 AI 给出了纠正后的人名，且确实和原名不同，用纠正后的人名重跑四阶段
                if (correctedName && correctedName.length >= 2 && correctedName.length <= 20 && correctedName !== searchName) {
                  sendEvent('log', { step: 'name_correction', message: `✅ 系统推测您可能要找的是「${correctedName}」，正在重新检索...` });

                  // 标记纠错信息，供 AI Assemble 在报告开头提示用户
                  allGatheredData['_name_correction'] = {
                    original: searchName,
                    corrected: correctedName,
                  };

                  // 用纠正后的名字重新执行 Stage 1-3（使用完整消歧 + 覆盖旧数据）
                  const correctedClean = correctedName.trim().replace(/(?:特聘|客座|兼职|荣誉|终身|资深|首席)?(?:教授|副教授|助理教授|讲师|博士|硕士|研究员|副研究员|助理研究员|院士|博士生导师|硕士生导师|博导|硕导|主任医师|副主任医师|主治医师|先生|女士|同学|老师|主任|副主任|所长|副所长|院长|副院长|校长|副校长)$/g, '').trim();

                  sendEvent('log', { step: 'name_correction', message: `🔍 [纠错重跑] 正在用纠正后的名字重跑核心阶段...` });

                  // ── Stage 1 平方库（完整消歧 + 拼音兜底）──
                  let corrTopPf: any = null;
                  try {
                    let corrCandidates = await talentService.searchTalents(correctedClean, 5);
                    // 拼音兜底（如果纠正后是中文且直接搜不到）
                    if (corrCandidates.length === 0 && /^[\u4e00-\u9fa5]+$/.test(correctedClean)) {
                      const pyVars = generatePinyinVariants(correctedClean);
                      for (const pyV of pyVars) {
                        corrCandidates = await talentService.searchTalents(pyV, 5);
                        if (corrCandidates.length > 0) {
                          sendEvent('log', { step: 'name_correction', message: `   平方库拼音兜底命中: ${pyV}` });
                          break;
                        }
                      }
                    }
                    if (corrCandidates.length > 0) {
                      // 完整消歧
                      const corrDisCtx = { name: correctedClean, institution, topPingfangRecord: null, pfConfidence: 'none' as const };
                      const corrDisResult = runPingfangDisambiguation(corrCandidates, corrDisCtx);
                      corrTopPf = corrDisResult.top;
                      allGatheredData['pingfang'] = corrTopPf; // 【修复】强制覆盖
                      sendEvent('log', { step: 'name_correction', message: `   Stage 1 ✅ 平方库消歧完成（覆盖旧数据）` });
                    }
                  } catch { /* skip */ }

                  // ── Stage 2 Scholar（Google Scholar 完整消歧）──
                  let corrScholarHit = false;
                  const corrSerpApiKey = process.env.SERPAPI_KEY;
                  if (corrSerpApiKey) {
                  try {
                    const corrScholarQuery = corrTopPf?.name_en || correctedClean;
                    const corrGsQuery = institution ? `${corrScholarQuery} ${institution}` : corrScholarQuery;
                    const corrScholarRes = await fetch(`https://serpapi.com/search.json?engine=google_scholar_profiles&mauthors=${encodeURIComponent(corrGsQuery)}&api_key=${corrSerpApiKey}`);
                    if (corrScholarRes.ok) {
                      const corrScholarData = await corrScholarRes.json();
                      const corrGsProfiles = corrScholarData?.profiles || [];
                      if (corrGsProfiles.length > 0) {
                        // 完整 Scholar 消歧（用修正后的线索）
                        const corrClueInsts = [institution].filter(Boolean);
                        const corrClueFields = (corrTopPf?.research_field as string) ? [corrTopPf.research_field as string] : [];
                        const corrScored = corrGsProfiles.map((o: any) => {
                          let instScore = 0;
                          const gsAffil = (o.affiliations || '').toLowerCase();
                          for (const inst of corrClueInsts) {
                            if (gsAffil) {
                              const m = calcInstMatchScore(inst, gsAffil);
                              if (m > instScore) instScore = m;
                            }
                          }
                          let fieldScore = 0;
                          const gsInterests = (o.interests || []).map((i: any) => i.title || i).join(' ');
                          if (corrClueFields.length > 0 && gsInterests) {
                            fieldScore = calcTextFieldMatch(corrClueFields.join(' '), gsInterests);
                          }
                          const score = instScore * 30 + fieldScore * 15 + Math.min(5, Math.floor((o.cited_by || 0) / 5000));
                          // 标准化为兼容下游的结构
                          return {
                            display_name: o.name || '',
                            cited_by_count: o.cited_by || 0,
                            affiliations: o.affiliations || '',
                            last_known_institutions: o.affiliations ? [{ display_name: o.affiliations }] : [],
                            interests: (o.interests || []).map((i: any) => ({ title: i.title || i })),
                            summary_stats: { h_index: null },
                            works_count: 0,
                            author_id: o.author_id || '',
                            scholar_url: o.link || '',
                            score, instScore,
                          };
                        });
                        corrScored.sort((a: any, b: any) => b.score - a.score);
                        allGatheredData['scholar'] = corrScored[0]; // 【修复】强制覆盖
                        corrScholarHit = true;
                        sendEvent('log', { step: 'name_correction', message: `   Stage 2 ✅ Google Scholar 消歧完成（覆盖旧数据）` });
                      }
                    }
                  } catch { /* skip */ }
                  }

                  // ── Stage 3 百度百科（快速覆盖，不走完整 Wiki 流程省时间）──
                  try {
                    const corrBkUrl = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=${encodeURIComponent(correctedClean)}&bk_length=1500`;
                    const corrBkRes = await fetch(corrBkUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const corrBkData = await corrBkRes.json();
                    if (corrBkData?.id && corrBkData.abstract) {
                      allGatheredData['baike'] = {
                        biography: corrBkData.abstract.replace(/<[^>]+>/g, '').substring(0, 1500),
                        url: corrBkData.url || `https://baike.baidu.com/item/${encodeURIComponent(correctedClean)}`
                      };
                      // 清掉旧的 Wikipedia 数据（纠正后大概率不适用）
                      delete allGatheredData['wikipedia'];
                      sendEvent('log', { step: 'name_correction', message: `   Stage 3 ✅ 百科重跑完成（覆盖旧数据）` });
                    }
                  } catch { /* skip */ }

                  // 不重跑 Stage 4（全网搜索耗时最长，大模型总结对名字微调不敏感）
                  // 不重跑 Stage 2.5 ORCID（省时间，而且纠正后数据 pfConfidence 重置后续也能走短路）

                  // 【修复】pfConfidence 重置：纠正后如果 Scholar 命中 → 高置信度
                  if (corrTopPf && corrScholarHit) {
                    pfConfidence = 'high';
                  } else if (corrTopPf || corrScholarHit) {
                    pfConfidence = 'low';
                  }

                  // 更新 searchName 以便 AI Assemble 使用纠正后的名字
                  searchName = correctedClean;

                  sendEvent('log', { step: 'name_correction', message: `✅ 纠正完成，所有核心数据已刷新。` });
                } else {
                  sendEvent('log', { step: 'name_correction', message: `❌ 未找到可信的近似学者，保持原始结果。` });
                }
              } else {
                sendEvent('log', { step: 'name_correction', message: `❌ 联网纠错也无有效信息。` });
              }
            } catch (corrErr) {
              sendEvent('log', { step: 'name_correction', message: `⚠️ 纠错阶段异常: ${corrErr}` });
            }
          }

          // Stage +0.5: Gap-Filling (查漏补缺)
          try {
            sendEvent('log', { step: 'gap_filling', message: `🎯 [查漏补缺] 正在盘点已收集数据，检查核心履历（教育/工作经历）是否缺失...` });
            const diagnosticClient = getOpenAIClient();
            const diagnosticPrompt = `你是一个严谨的数据质检员。请检查以下已收集到的人才数据，判断是否**明显缺失**以下两项核心硬指标：
1. 本科/博士教育经历（毕业院校）
2. 过往工作经历或当前任职机构

目标学者：姓名"${searchName}"，已知机构"${institution || '未知'}"。

如果两项在数据中都很完整清晰，请输出空数组 search_queries: []。
如果有缺失，请针对缺失的项，生成 1-2 个用于搜索引擎（如Google/Bing）的高效检索词（Query），尽量用"姓名+机构+可能的相关词"（如 "${searchName} 本科 毕业院校"）。
请返回严格的JSON格式：
{
  "missing_aspects": ["缺失的维度说明，如 '缺少本科学历'"],
  "search_queries": ["query1", "query2"]
}

已收集数据摘录：
${JSON.stringify(allGatheredData).substring(0, 3000)}
`;
            
            const diagRes = await diagnosticClient.chat.completions.create({
              model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
              messages: [{ role: 'user', content: diagnosticPrompt }],
              response_format: { type: 'json_object' },
            });
            const diagContent = diagRes.choices[0]?.message?.content || '{}';
            // 健壮 JSON 提取：DeepSeek 有时输出带 markdown code fence 或多余文字
            let diagJson: any = { search_queries: [] };
            try {
              const cleaned = diagContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
              // 尝试从文本中提取第一个 JSON 对象
              const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                diagJson = JSON.parse(jsonMatch[0]);
              } else {
                diagJson = JSON.parse(cleaned);
              }
            } catch (jsonErr) {
              sendEvent('log', { step: 'gap_filling', message: `⚠️ [查漏补缺] AI 返回格式异常，跳过补缺` });
            }

            if (diagJson.search_queries && diagJson.search_queries.length > 0) {
              sendEvent('log', { step: 'gap_filling', message: `🔍 [查漏补缺] 发现数据缺失: ${diagJson.missing_aspects.join(', ')}。开始定向搜索...` });
              let gapFilledText = "";
              for (const q of diagJson.search_queries) {
                 sendEvent('log', { step: 'gap_filling', message: `   - 正在网页搜索: "${q}"` });
                 try {
                   const searchRes = await searchWeb(q);
                   if (searchRes && searchRes.AbstractText) {
                     gapFilledText += `搜索词【${q}】的结果片段：\n${searchRes.AbstractText}\n`;
                   }
                 } catch (e) { /* ignore search error */ }
              }
              
              if (gapFilledText) {
                sendEvent('log', { step: 'gap_filling', message: `🧠 [查漏补缺] 搜索完毕，正在从网页片段中提纯事实...` });
                const extractPrompt = `你是一个信息提取助手。请在以下网页文本片段中，寻找目标学者（${searchName}，${institution || '未知机构'}）的缺失信息：${diagJson.missing_aspects.join(', ')}。
如果文本中没有明确提到，或者看起来像同名其他人的信息，请坚决回答“未找到相关信息”，绝对不要编造。
提取要求：简洁、只说事实，不要 Markdown 代码块。

网页文本：
${gapFilledText.substring(0, 4000)}
`;
                const extractRes = await diagnosticClient.chat.completions.create({
                  model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
                  messages: [{ role: 'user', content: extractPrompt }],
                });
                const extractedInfo = extractRes.choices[0]?.message?.content || '';
                
                if (extractedInfo && !extractedInfo.includes('未找到相关信息')) {
                  allGatheredData['gap_filled'] = extractedInfo;
                  sendEvent('log', { step: 'gap_filling', message: `✅ [查漏补缺] 成功定点补齐数据！提取的信息将并入最终报告。` });
                } else {
                  sendEvent('log', { step: 'gap_filling', message: `⚠️ [查漏补缺] 定向网页搜索未能找到有效事实，保持原样。` });
                }
              } else {
                sendEvent('log', { step: 'gap_filling', message: `⚠️ [查漏补缺] 网页搜索未返回有效文本。` });
              }
            } else {
              sendEvent('log', { step: 'gap_filling', message: `✅ [查漏补缺] 核心履历（教育/工作）数据已足够完整，无需额外搜索。` });
            }
          } catch (e) {
            sendEvent('log', { step: 'gap_filling', message: `⚠️ [查漏补缺] 模块执行异常，跳过: ${String(e).substring(0, 100)}` });
          }

          // Stage +1: AI Assemble
          sendEvent('log', { step: 'ai_assemble', message: `🧠 [最终整合] 数据收集完毕，开始交由大模型组装合并报告...` });
          if (pfConfidence === 'low' || pfConfidence === 'none') {
            sendEvent('log', { step: 'ai_assemble', message: `⚠️⚠️⚠️ 本次检索置信度极低，极可能未找到您要找的学者。以下数据来自多位同名但可能不同的学者，仅供参考，请勿直接使用。` });
          }

          const client = getOpenAIClient();
          const sourcesFound = Object.keys(allGatheredData).filter(k => !k.startsWith('_')).join('、') || '暂无结构化数据';

          // ── 构造数据源可信度说明 ──
          // pingfang 永远可信（它是主体锚点，通过了消歧）
          // scholar/orcid 如果存在，说明通过了 subjectConsistencyCheck（与锚点人一致）
          // 只有 wikipedia/baike/internet 可能是"同名不同人"的噪音
          const trustedList: string[] = [];
          const suspectList: string[] = [];
          if (allGatheredData['pingfang']) trustedList.push('pingfang');
          if (allGatheredData['scholar']) trustedList.push('scholar');
          if (allGatheredData['orcid']) trustedList.push('orcid');
          if (allGatheredData['wikipedia'] || allGatheredData['baike']) suspectList.push('wikipedia/baike (可能同名不同人)');
          if (allGatheredData['internet'] || allGatheredData['search_internet']) suspectList.push('internet (可能同名不同人)');
          const trustedNote = trustedList.length > 0
            ? `

【数据源可信度】以下数据源与平方库锚点人确认为同一个学者，可以自由合并使用：${trustedList.join('、')}。`
            : '';
          const suspectNote = suspectList.length > 0 && pfConfidence === 'high'
            ? `
【🚨 人一致性警告】以下数据源**很可能包含同名但不同的学者**，**绝对禁止**与可信数据源互相补充或合并：${suspectList.join('、')}。对于这些可疑数据源中的人物简介、论文、机构信息，如果与可信数据源存在任何差异（如研究领域完全不同、供职机构不在同一机构），请**完全丢弃**可疑数据源的该条信息。如果可疑数据源的简介与可信数据源明显对不上，也请丢弃整个可疑数据源。`
            : '';

          const nameCorrectionNote = allGatheredData['_name_correction']
            ? `\n\n【⚠️ 人名纠错提示】用户原始搜索的是"${allGatheredData['_name_correction'].original}"，但未找到此人。系统根据多渠道数据推测用户可能要找的是"${allGatheredData['_name_correction'].corrected}"。请在报告最开头用一句话自然地提示用户（例如："您搜索的'${allGatheredData['_name_correction'].original}'未找到精确匹配，根据检索结果，为您匹配到相似学者**${allGatheredData['_name_correction'].corrected}**，以下是相关信息："），然后正常输出报告。`
            : '';

          const lowConfidenceNote = (pfConfidence === 'low' || pfConfidence === 'none')
            ? `

【🚨 置信度警告】系统检索时使用了机构线索"${institution || '（未提供）'}"，但**平方库和 Scholar/OpenAlex 中没有任何一个候选的机构命中该线索**。这意味着：
- 当前 JSON 中的数据极有可能来自**与搜索目标同名但不同的人**
- 不同数据源的人可能互相矛盾（如研究领域、供职机构完全不同）
- **绝对禁止**将来自不同人的数据互相补充、强行合并成"完整履历"

请务必仅按数据源分别列出各自的结果，**不要合并**。如果 JSON 中还有 internet 或 search_internet 的线索，也请列出。`
            : '';          const assemblePrompt = `你是一位专业的学者情报分析师。请根据多渠道采集的原始数据，撰写一份关于「${searchName}」的专业情报简报（实际获取到数据的渠道：${sourcesFound}）。
${nameCorrectionNote}
${trustedNote}
${suspectNote}
${lowConfidenceNote}

【写作规范】

1. 开篇人物概述：报告开头必须有一段 3-5 句话的人物综合概述，包括姓名、现任职位、研究领域、核心成就和学术影响力，让读者 10 秒内建立对这个人的整体认知。

2. 翔实度原则：原始数据有几条就写几条，宁多勿少。绝对禁止使用“多项”“若干”“等”“多篇高水平论文”“曾在多所知名高校任教”这种吞没细节的表述。每条教育经历、工作经历、奖项、论文都必须逐条列出。

3. 结构化呈现：为了生成一份极具专业度的高端智库级别人物图谱报告，请严格包含以下板块，且在呈现学术成果时，【必须强制保留并显式输出底层数据中的所有高阶字段】：
   - 核心档案（中英文姓名、现任职位、研究领域、学术指标如H-index/Citations等）
   - 百科简介（提取核心履历精华，如果有）
   - 教育经历（时间、学校、专业学位）
   - 工作经历（时间、雇主机构、职位）
   - 重点学术成果（请按类型分类呈现）：
     * 论文 (Papers)：对于提取出的代表性论文，【必须】清晰列出完整的作者列表 (authors)、发表年份、收录情况 (indexed_by) 以及影响因子 (impact_factor，如果有)。不要只写孤立的标题！
     * 专利 (Patents)：对于提取出的核心专利，【必须】清晰列出专利类型 (patent_type)、所有发明人 (inventors)、公开号/申请号 (application_number)，并必须附上简短的技术摘要 (abstract)。
   - 荣誉与基金 (Honors & Grants)
   - 产业转化与社会影响

4. 叙述 + 实证结合：不要写成干巴巴的数据拉取结果，也不要写成空洞的散文。在用bulletin方式列出具体条目后，自然地用 2-4 句话说明这些条目背后的意义或规律（直接融入正文，不要用“小结”“总结”等标签）。例如：列完教育经历后直接写“从普林斯顿物理本科到加州理工学院电子工程博士，这条跨学科路径为其后来在计算机视觉领域的突破奠定了独特的基础”。

5. 无数据则跳过：如果某个维度在原始数据中完全没有信息，直接不写，不要留空标题，不要写“暂无数据”“未找到相关信息”。

6. 充分利用所有数据源：原始 JSON 中包含多个渠道的数据（pingfang、scholar、orcid、wikipedia、baike、internet、gap_filled 等），你必须充分利用每一个渠道的数据。如果有百科简介，必须融入人物概述。如果有论文列表，必须逐条列出。如果有 H-index、引用数，必须写上。禁止丢失任何渠道的有效数据。

7. 冲突处理：不同来源数据冲突时，以「平方学者库」或「权威 API (Scholar/Wiki)」为准。某项内容为空则谁有信息用谁的。

8. 标明来源：每一块核心信息必须在括号里加上真实的数据来源标注，例如：(来源：pingfang) 或 (来源：scholar)。如果原始 JSON 中没有 pingfang 数据，绝对禁止伪造或标注“平方数据”的来源！

【绝对禁止】
- 丢失数据：原始 JSON 中有的信息（百科简介、论文高阶字段、专利摘要、奖项、工作经历等）不得遗漏
- 归纳吞没：“发表了多篇论文”“曾在多所高校任教”“获得多项荣誉”——必须逐条列出
- 空模块：“暂无数据”“未找到相关信息”——直接不写
- 使用“小结”“总结”等标签词——归纳性叙述直接融入正文
- 写完上面的维度就停笔——你必须执行下面的完整性自检

【完整性自检——写完报告后必须执行】
写完以上维度后，你必须逐一检查原始 JSON 中每个数据源（pingfang、scholar、orcid、wikipedia、baike、internet、search_internet 等），确认其中每一条有效信息是否已被写入报告。如果发现任何尚未涵盖的数据（比如论文列表、专利列表、基金项目、合作关系、媒体报道、详细的百科内容等），必须继续补充到报告中，直到原始数据被完整覆盖。宁可报告很长，也绝不允许丢失数据。

【以下是各渠道返回的原始数据JSON】：
${JSON.stringify(allGatheredData, null, 2)}
${journalEntry?.ai_report ? `

【历史档案参考】以下是该学者之前的检索报告（上次更新: ${journalEntry.last_searched_at}，累计被搜索 ${journalEntry.search_count} 次）。本次搜索已重新获取了最新数据，请以上方的原始数据JSON为主。但历史报告中的详细内容（如具体论文列表、专利列表、完整工作经历等）若本次数据中未覆盖到，应保留并融入新报告，标注(来源：历史档案)。如有新变化请更新。

--- 历史报告 ---
${journalEntry.ai_report.substring(0, 4000)}
--- 历史报告结束 ---` : ''}

特别注意：你只需输出纯 Markdown 文本，绝对禁止将内容包裹在 XML 标签中。不需要写标题，直接从人物概述开始。报告要尽可能长和详尽，把原始数据中的每一条有效信息都写进去。
`;

          const aiStream = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
            messages: [{ role: 'user', content: assemblePrompt }],
            stream: true,
            max_tokens: 8192,
          });

          for await (const chunk of aiStream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              sendEvent('ai_chunk', text);
            }
          }

          // 将四阶段原始数据传给 route.ts，供人才日志 (Talent Journal) 保存
          sendEvent('raw_data', { gatheredData: allGatheredData, talentName: searchName, institution: institution || '' });

          sendEvent('done', { message: '报告生成完毕' });
          controller.close();
        } catch (e) {
          sendEvent('error', { message: String(e) });
          controller.close();
        }
      }
    });
}
