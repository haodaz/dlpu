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
import p8 from './32_biomedicine.json';
import p9 from './32_fine-chemicals.json';
import p10 from './32_food.json';
import p11 from './32_new-materials.json';
import p12 from './32_paper-packaging.json';
import p13 from './32_smart-manufacturing.json';
import p14 from './32_software-it.json';
import p15 from './32_textile-apparel.json';
import p16 from './33_biomedicine.json';
import p17 from './33_fine-chemicals.json';
import p18 from './33_food.json';
import p19 from './33_new-materials.json';
import p20 from './33_paper-packaging.json';
import p21 from './33_smart-manufacturing.json';
import p22 from './33_software-it.json';
import p23 from './33_textile-apparel.json';

export const BASE_PROFILES: RegionalProfile[] = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21, p22, p23] as RegionalProfile[];
