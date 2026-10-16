// 自动生成,勿手改:npx tsx --env-file=.env.local scripts/prefetch-industry-base.ts
// 代码内预查底库:各省重点产业的区域画像(规模、企业分布、研发、投融资、政策、岗位)
import type { RegionalProfile } from '../types';
import p0 from './21_biomedicine.json';
import p1 from './21_fine-chemicals.json';
import p2 from './21_food.json';
import p3 from './21_new-materials.json';
import p4 from './21_paper-packaging.json';
import p5 from './21_smart-manufacturing.json';
import p6 from './21_software-it.json';
import p7 from './21_textile-apparel.json';

export const BASE_PROFILES: RegionalProfile[] = [p0, p1, p2, p3, p4, p5, p6, p7] as RegionalProfile[];
