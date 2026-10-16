// 预查区域产业底库:把「省份 × 重点产业」的区域画像查好,存成 JSON 放进代码(src/lib/industry-report/base/)
// 报告生成时命中底库直接调用;底库没有的再现查并回流飞轮(基建 + 飞轮)
//
// 用法:
//   npx tsx --env-file=.env.local scripts/prefetch-industry-base.ts                 # 默认:辽宁 × 全部产业
//   npx tsx --env-file=.env.local scripts/prefetch-industry-base.ts 辽宁,江苏 food   # 指定省份与产业(slug,逗号分隔)
//   加 --force 重新查已存在的条目
import { existsSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { collectRegionalProfile } from '../src/lib/industry-report/regional';
import { Flywheel } from '../src/lib/industry-report/flywheel';
import { regionInfo } from '../src/lib/industry-report/pingfang';

// 与学校专业对应的重点产业:terms 为统计口径名(检索用,不同省份叫法不同),别名用于匹配用户在报告页输入的产业名
const INDUSTRIES = [
  { slug: 'smart-manufacturing', terms: ['装备制造业', '智能制造'], name: '智能制造与高端装备', aliases: ['智能制造', '高端装备', '装备制造', '工业机器人', '机器人', '数控机床', '机械'] },
  { slug: 'food', terms: ['农产品加工业', '食品工业', '食品制造业'], name: '食品加工', aliases: ['食品', '食品制造', '农产品加工', '预制菜', '海洋食品'] },
  { slug: 'textile-apparel', terms: ['纺织服装业', '纺织工业', '服装产业'], name: '纺织服装', aliases: ['纺织', '服装', '服饰', '时尚'] },
  { slug: 'paper-packaging', terms: ['包装产业', '造纸和纸制品业', '印刷业'], name: '造纸与包装印刷', aliases: ['包装', '印刷', '造纸', '轻工'] },
  { slug: 'fine-chemicals', terms: ['精细化工', '石化和化学工业'], name: '精细化工', aliases: ['化工', '石化', '精细化学品', '日化', '轻化工'] },
  { slug: 'new-materials', terms: ['新材料产业', '先进材料'], name: '新材料', aliases: ['材料', '高分子材料', '先进材料', '功能材料'] },
  { slug: 'software-it', terms: ['软件和信息技术服务业', '数字经济'], name: '软件和信息技术服务', aliases: ['软件', '信息技术', '数字经济', '大数据', '人工智能', '计算机'] },
  { slug: 'biomedicine', terms: ['生物医药产业', '医药工业'], name: '生物医药', aliases: ['医药', '生物', '生物制药', '生物技术'] },
];

const DIR = path.join(process.cwd(), 'src/lib/industry-report/base');

function writeIndex() {
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();
  const imports = files.map((f, i) => `import p${i} from './${f}';`).join('\n');
  writeFileSync(
    path.join(DIR, 'index.ts'),
    `// 自动生成,勿手改:npx tsx --env-file=.env.local scripts/prefetch-industry-base.ts
// 代码内预查底库:各省重点产业的区域画像(规模、企业分布、研发、投融资、政策、岗位)
import type { RegionalProfile } from '../types';
${imports}

export const BASE_PROFILES: RegionalProfile[] = [${files.map((_, i) => `p${i}`).join(', ')}] as RegionalProfile[];
`,
  );
  return files.length;
}

async function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const force = process.argv.includes('--force');
  const provinces = (args[0] ?? '辽宁').split(',').map((s) => s.trim()).filter(Boolean);
  const slugs = args[1]?.split(',');
  const industries = INDUSTRIES.filter((i) => !slugs || slugs.includes(i.slug));
  const fw = new Flywheel();

  for (const province of provinces) {
    const code = regionInfo(province).provinceCode;
    if (!code) {
      console.error(`未识别的省份:${province}`);
      continue;
    }
    for (const ind of industries) {
      const file = path.join(DIR, `${code}_${ind.slug}.json`);
      if (existsSync(file) && !force) {
        console.log(`跳过(已存在):${province} · ${ind.name}`);
        continue;
      }
      const t0 = Date.now();
      console.log(`\n=== ${province} · ${ind.name} ===`);
      try {
        const p = await collectRegionalProfile(ind.name, province, (q) => fw.search(q), (m) => console.log('  ' + m), ind.terms);
        writeFileSync(file, JSON.stringify({ ...p, aliases: ind.aliases, origin: 'base' }, null, 1));
        console.log(`  已写入 ${path.relative(process.cwd(), file)}(${Math.round((Date.now() - t0) / 1000)} 秒)`);
      } catch (e) {
        console.error(`  失败:${(e as Error).message}`);
      }
      writeIndex();
    }
  }
  console.log(`\n底库共 ${writeIndex()} 条;检索缓存命中 ${fw.stats.searchHit},新检索 ${fw.stats.searchMiss}`);
}

main().then(() => process.exit(0));
