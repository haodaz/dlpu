// 专业建设知识库检索(平方高教知识库;未接入时返回示例条目)
//   GET ?q=关键词 → {source:'live'|'sample', docs, note}
import { guard, denied } from '@/lib/api-guard';
import { searchKnowledge } from '@/lib/knowledge';

export async function GET(request: Request) {
  const g = await guard(request, 'user');
  if (denied(g)) return g;
  const q = new URL(request.url).searchParams.get('q') ?? '';
  return Response.json(await searchKnowledge(q.slice(0, 100)));
}
