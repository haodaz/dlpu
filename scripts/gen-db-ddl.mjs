// 由 prisma/schema.prisma 生成建表 SQL(幂等),写入 src/lib/db/ddl.ts
// 改了 schema 之后运行:npm run db:ddl
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const sql = execSync('npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script', {
  env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'file:./data/app.db' },
}).toString();
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.replace(/^--.*$/gm, '').trim())
  .filter(Boolean)
  .map((s) =>
    s
      .replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ')
      .replace(/^CREATE UNIQUE INDEX /, 'CREATE UNIQUE INDEX IF NOT EXISTS ')
      .replace(/^CREATE INDEX /, 'CREATE INDEX IF NOT EXISTS '),
  );
writeFileSync(
  'src/lib/db/ddl.ts',
  `// 自动生成,勿手改:npm run db:ddl(来源 prisma/schema.prisma)\nexport const DDL: string[] = ${JSON.stringify(statements, null, 2)};\n`,
);
console.log(`ddl.ts: ${statements.length} 条语句`);
