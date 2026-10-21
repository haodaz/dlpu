// 预查「区域重点产业」:地区(省 + 市)客观的重点产业清单,存成 JSON 放进代码(src/lib/industry-report/region-base/)
// 用法:npx tsx --env-file=.env.local scripts/prefetch-region-industries.ts 辽宁省大连市,江苏省苏州市
import { readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { collectRegionIndustries } from '../src/lib/industry-report/region-industries';
import { Flywheel } from '../src/lib/industry-report/flywheel';
import { regionInfo } from '../src/lib/industry-report/pingfang';

const DIR = path.join(process.cwd(), 'src/lib/industry-report/region-base');

function writeIndex() {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  writeFileSync(
    path.join(DIR, 'index.ts'),
    `// 自动生成,勿手改:npx tsx --env-file=.env.local scripts/prefetch-region-industries.ts 辽宁省大连市
// 代码内预查底库:各地区客观的重点产业清单
import type { RegionIndustryProfile } from '../region-industries';
${files.map((f, i) => `import r${i} from './${f}';`).join('\n')}

export const REGION_BASE: RegionIndustryProfile[] = [${files.map((_, i) => `r${i}`).join(', ')}] as RegionIndustryProfile[];
`,
  );
  return files.length;
}

async function main() {
  const regions = (process.argv[2] ?? '辽宁省大连市').split(',').map((s) => s.trim()).filter(Boolean);
  const fw = new Flywheel();
  for (const region of regions) {
    const { provinceCode, city } = regionInfo(region);
    if (!provinceCode) {
      console.error(`未识别的地区:${region}`);
      continue;
    }
    console.log(`\n=== ${region} ===`);
    const p = await collectRegionIndustries(region, (q) => fw.search(q), (m) => console.log('  ' + m));
    const file = path.join(DIR, `${provinceCode}${city ? `_${encodeURIComponent(city).replace(/%/g, '')}` : ''}.json`);
    writeFileSync(file, JSON.stringify({ ...p, origin: 'base' }, null, 1));
    console.log(`  已写入 ${path.relative(process.cwd(), file)}`);
  }
  console.log(`\n底库共 ${writeIndex()} 个地区`);
}

main().then(() => process.exit(0));
