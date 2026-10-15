// 数据库(SQLite,表结构与初始数据都在代码里,不依赖外部数据库)
// - 位置:DATABASE_URL,默认 <项目>/data/app.db;服务器上把 data 目录挂成持久卷即可
// - 首次访问时自动建表(DDL 由 prisma/schema.prisma 生成,见 npm run db:ddl),空表写入演示数据
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { DDL } from './ddl';
import { seedDatabase } from './seed';

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'data', 'app.db')}`;
  if (url.startsWith('file:')) fs.mkdirSync(path.dirname(url.slice('file:'.length)), { recursive: true });
  return url;
}

const g = globalThis as unknown as { __prisma?: PrismaClient; __dbReady?: Promise<PrismaClient> };

async function init(): Promise<PrismaClient> {
  const prisma = g.__prisma ?? new PrismaClient({ datasourceUrl: databaseUrl() });
  g.__prisma = prisma;
  for (const sql of DDL) await prisma.$executeRawUnsafe(sql);
  await seedDatabase(prisma);
  return prisma;
}

/** 取得已建好表的数据库连接;失败时抛错,由调用方决定是否降级 */
export function getDb(): Promise<PrismaClient> {
  if (!g.__dbReady) {
    g.__dbReady = init().catch((e) => {
      g.__dbReady = undefined; // 下次请求重试
      throw e;
    });
  }
  return g.__dbReady;
}
