// 专业建设知识库 = 平方高教知识库(一答「官方知识库 · 专家智库」同一份数据)
// 取数方式与一答相同:MCP assist_repository_search(location=common)+ dash_generic_get(AssistRepository 详情)
// 该库在一答主站,需要登录用户的令牌;本项目目前只有数据平台令牌,查不到 → 需技术接入:
//   配置 HIGHER_ED_KB_ENDPOINT(一答主站 MCP 地址)与 HIGHER_ED_KB_TOKEN 后自动改为实时检索;未配置时返回示例条目(页面标注「示例」)
import { mcpTools } from '@/lib/mcp/generated-tools';

export interface KbDoc {
  id: string;
  title: string;
  date: string;
  scene: string; // 政策文件 / 专业布局 / 课程建设 / 专业认证 等
  summary: string;
  url?: string;
}

export interface KbResult {
  source: 'live' | 'sample';
  docs: KbDoc[];
  note?: string;
}

// 示例条目:标题与日期取自一答 prod「专家智库」中的真实文件;摘要只写文件公开的主旨
const SAMPLE: KbDoc[] = [
  {
    id: 'S1',
    title: '教育部办公厅关于实施一流本科专业建设「双万计划」的通知',
    date: '2023-11-15',
    scene: '政策文件',
    summary: '分批建设国家级和省级一流本科专业点,引导高校优化专业结构、提升专业建设质量;是本科专业建设与评价的主要政策依据。',
  },
  {
    id: 'S2',
    title: '教育部 财政部关于实施中国特色高水平高职学校和专业建设计划的意见',
    date: '2023-11-02',
    scene: '政策文件',
    summary: '集中力量建设一批高水平高职学校和专业群,强调专业群对接区域重点产业、校企协同育人。',
  },
  {
    id: 'S3',
    title: '如何做好学科专业调整和布点?',
    date: '2025-04-07',
    scene: '专业布局',
    summary: '围绕学科专业设置与调整的思路和方法,讨论如何结合社会需求与办学基础进行专业布点。',
  },
  {
    id: 'S4',
    title: '本科专业设置如何改革?哈佛、耶鲁、MIT 等世界一流大学的做法',
    date: '2025-04-07',
    scene: '专业布局',
    summary: '介绍国外一流大学本科专业设置与动态调整的做法,供国内高校专业改革参考。',
  },
  {
    id: 'S5',
    title: '教育部办公厅关于公布 2023 年通过普通高等学校师范类专业认证专业名单及中期审核专业名单的通知',
    date: '2023-12-25',
    scene: '专业认证',
    summary: '公布通过师范类专业认证与中期审核的专业名单,并对认证结论的使用与持续改进提出要求。',
  },
  {
    id: 'S6',
    title: '张雾声 | 专业课程融入思政工作的教学设计理念与方法',
    date: '2023-10-09',
    scene: '课程建设',
    summary: '从教学设计角度讨论专业课程如何融入课程思政,涉及目标设定、内容组织与评价。',
  },
  {
    id: 'S7',
    title: '苏长和 | 复旦大学政治学专业课程思政建设经验谈',
    date: '2023-10-09',
    scene: '课程建设',
    summary: '以复旦大学政治学专业为例,分享专业层面推进课程思政建设的经验。',
  },
];

const live = () => !!(process.env.HIGHER_ED_KB_ENDPOINT && process.env.HIGHER_ED_KB_TOKEN);

export async function searchKnowledge(query: string, size = 8): Promise<KbResult> {
  const q = query.trim();
  if (live()) {
    try {
      const r = await mcpTools.assistRepositorySearch({ query: q || '专业建设', offset: 0, size, location: 'common' } as never, process.env.HIGHER_ED_KB_TOKEN, process.env.HIGHER_ED_KB_ENDPOINT);
      const docs = ((r.items ?? []) as Record<string, unknown>[]).map((i) => ({
        id: String(i.id ?? ''),
        title: String(i.name ?? i.title ?? ''),
        date: String(i.publish_date ?? i.create_date ?? '').slice(0, 10),
        scene: String(i.scene_key ?? i.kind_key ?? '知识库'),
        summary: String(i.summary ?? i.description ?? '').slice(0, 200),
        url: String(i['relevant_files_ids.download_url'] ?? '') || undefined,
      }));
      return { source: 'live', docs: docs.filter((d) => d.title) };
    } catch (e) {
      return { source: 'sample', docs: filterSample(q, size), note: `高教知识库查询失败(${(e as Error).message}),以下为示例条目` };
    }
  }
  return { source: 'sample', docs: filterSample(q, size), note: '高教知识库需技术接入(一答主站令牌),以下为示例条目' };
}

function filterSample(q: string, size: number) {
  if (!q) return SAMPLE.slice(0, size);
  const words = q.split(/[\s,，、]+/).filter(Boolean);
  const hit = SAMPLE.filter((d) => words.some((w) => `${d.title}${d.summary}${d.scene}`.includes(w)));
  return (hit.length ? hit : SAMPLE).slice(0, size);
}
