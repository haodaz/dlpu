// 专业建设专家 AI:结合区域产业(客观重点产业 + 已查的区域画像)与各专业评价结果,回答专业布局类问题
//   POST {messages:[{role:'user'|'assistant', content}]} → {reply}
import { guard, denied } from '@/lib/api-guard';
import { callChat } from '@/lib/industry-report/llm';
import { MAJORS, verdictMeta } from '@/lib/diagnosis';
import { REGION_BASE } from '@/lib/industry-report/region-base';
import { BASE_PROFILES } from '@/lib/industry-report/base';
import { TENANT_NAME, TENANT_REGION } from '@/lib/brand';
import { regionInfo } from '@/lib/industry-report/pingfang';

export const maxDuration = 120;

function context(): string {
  const { provinceName, city } = regionInfo(TENANT_REGION);
  const region = REGION_BASE.find((r) => r.province === provinceName && (!city || r.city === city));
  const majors = MAJORS.map((m) => `- ${m.name}(${m.college}):${verdictMeta[m.verdict].label},一致性 ${m.consistency},有效性 ${m.effectiveness},区域产业匹配度 ${m.industryMatch};${m.reason}`).join('\n');
  const keyInd = region
    ? region.industries.map((i) => `- ${i.name}(${i.scope} · ${i.level}${i.scale ? ` · ${i.scale}` : ''}):${i.desc}`).join('\n') +
      (region.clusters.length ? `\n平方产业集群库:${region.clusters.map((c) => `${c.name}(${c.type})`).join(';')}` : '')
    : '(暂无)';
  const profiles = BASE_PROFILES.filter((p) => p.province === provinceName)
    .map((p) => {
      const scale = p.scale.slice(0, 2).map((s) => `${s.scope}${s.metric} ${s.value}${s.unit && !s.value.includes(s.unit) ? s.unit : ''}(${s.year})`).join(';');
      const gap = p.demand[0]?.text ?? '';
      return `- ${p.industry}:${scale || '规模数据缺'};细分方向 ${p.segments.slice(0, 4).map((x) => x.name).join('、') || '—'}${gap ? `;人才:${gap}` : ''}`;
    })
    .join('\n');
  return `【学校】${TENANT_NAME}(${TENANT_REGION})
【各专业最近一次评价结果(演示数据)】
${majors}
【区域客观重点产业(来自省市规划与政府工作报告)】
${keyInd}
【已检索的${provinceName}产业画像(与学校专业相关的产业)】
${profiles}`;
}

const SYSTEM = `你是高校专业建设专家,为学校领导班子和教务处提供专业布局建议。规则:
1. 只依据下面提供的数据作答;数据里没有的,明确说「目前数据未覆盖」,不要编造数字、政策或企业;
2. 引用数据时说明出处类型,如「据区域重点产业清单」「据该专业评价结果」;
3. 涉及缩减招生、停招、撤并等敏感建议,措辞审慎:给出需要进一步论证的方向和依据,不直接下结论;
4. 回答先给结论(2-3 句),再分点说明依据和可执行的下一步,总长度不超过 500 字;用中文。`;

export async function POST(request: Request) {
  const g = await guard(request, 'user');
  if (denied(g)) return g;
  const body = await request.json().catch(() => null);
  const history = (Array.isArray(body?.messages) ? body.messages : [])
    .filter((m: { role?: string; content?: unknown }) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-10)
    .map((m: { role: 'user' | 'assistant'; content: string }) => ({ role: m.role, content: m.content.slice(0, 2000) }));
  if (!history.length || history[history.length - 1].role !== 'user') return Response.json({ success: false, error: '缺少问题' }, { status: 400 });
  try {
    const reply = await callChat([{ role: 'system', content: `${SYSTEM}\n\n${context()}` }, ...history]);
    return Response.json({ success: true, reply });
  } catch (e) {
    return Response.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
