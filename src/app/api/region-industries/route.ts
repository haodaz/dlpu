// 区域重点产业:GET ?region=辽宁省大连市 → 客观的省 / 市重点产业清单(底库 → 知识库 → 现查)
import { guard, denied } from '@/lib/api-guard';
import { getRegionIndustries } from '@/lib/industry-report/region-industries';
import { Flywheel } from '@/lib/industry-report/flywheel';

export const maxDuration = 120;

export async function GET(request: Request) {
  const g = await guard(request, 'user');
  if (denied(g)) return g;
  const region = new URL(request.url).searchParams.get('region') ?? '';
  if (!region) return Response.json({ success: false, error: '缺少 region' }, { status: 400 });
  try {
    const fw = new Flywheel();
    const p = await getRegionIndustries(region, (q) => fw.search(q), () => {});
    if (!p) return Response.json({ success: false, error: '未识别出省份' }, { status: 400 });
    return Response.json({ success: true, ...p });
  } catch (e) {
    return Response.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}
