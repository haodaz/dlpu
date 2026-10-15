// 产业检索飞轮的存储层
// 现阶段落本地文件(INDUSTRY_DATA_DIR,默认 ./data/industry-flywheel);
// 上云时只需另写一个实现 FlywheelStore 接口的类(对象存储 / 数据库),在 getStore() 里切换。
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface FlywheelStore {
  /** 读 JSON;不存在返回 null */
  get<T>(collection: string, key: string): Promise<T | null>;
  put(collection: string, key: string, value: unknown): Promise<void>;
  /** 追加一行到日志型集合 */
  append(collection: string, value: unknown): Promise<void>;
  /** 读日志型集合的全部行(新的在后) */
  readLog<T>(collection: string): Promise<T[]>;
  list(collection: string): Promise<string[]>;
}

const safeKey = (key: string) => (/^[\w.-]{1,80}$/.test(key) ? key : crypto.createHash('sha1').update(key).digest('hex'));

class FileStore implements FlywheelStore {
  constructor(private root: string) {}

  private file(collection: string, key: string) {
    return path.join(this.root, collection, `${safeKey(key)}.json`);
  }

  async get<T>(collection: string, key: string): Promise<T | null> {
    try {
      return JSON.parse(await fs.readFile(this.file(collection, key), 'utf-8')) as T;
    } catch {
      return null;
    }
  }

  async put(collection: string, key: string, value: unknown) {
    const f = this.file(collection, key);
    await fs.mkdir(path.dirname(f), { recursive: true });
    // 先写临时文件再改名,避免并发写出半个文件
    const tmp = `${f}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(value), 'utf-8');
    await fs.rename(tmp, f);
  }

  async append(collection: string, value: unknown) {
    const f = path.join(this.root, `${collection}.jsonl`);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.appendFile(f, JSON.stringify(value) + '\n', 'utf-8');
  }

  async readLog<T>(collection: string): Promise<T[]> {
    try {
      const raw = await fs.readFile(path.join(this.root, `${collection}.jsonl`), 'utf-8');
      return raw
        .split('\n')
        .filter(Boolean)
        .flatMap((l) => {
          try {
            return [JSON.parse(l) as T];
          } catch {
            return [];
          }
        });
    } catch {
      return [];
    }
  }

  async list(collection: string): Promise<string[]> {
    try {
      return (await fs.readdir(path.join(this.root, collection))).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
    } catch {
      return [];
    }
  }
}

let store: FlywheelStore | null = null;

export function getStore(): FlywheelStore {
  if (!store) store = new FileStore(process.env.INDUSTRY_DATA_DIR || path.join(process.cwd(), 'data', 'industry-flywheel'));
  return store;
}

export const hashKey = (s: string) => crypto.createHash('sha1').update(s).digest('hex');
