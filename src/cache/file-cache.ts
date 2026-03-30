import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { CacheKey } from "../models/index.js";
import type { Cache, CacheEntry } from "./types.js";

export class FileCache implements Cache {
  private readonly cacheDir: string;
  private readonly metaFile: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir
      ? cacheDir.replace(/^~/, os.homedir())
      : path.join(os.homedir(), ".peerlist-cli", "cache");
    this.metaFile = path.join(this.cacheDir, "_meta.json");
    this.ensureDir();
  }

  get<T>(key: CacheKey): CacheEntry<T> | null {
    const filePath = this.keyToFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const entry = JSON.parse(content) as CacheEntry<T>;

      if (Date.now() > entry.expiresAt) {
        fs.unlinkSync(filePath);
        return null;
      }

      return entry;
    } catch {
      return null;
    }
  }

  set<T>(key: CacheKey, value: T, ttlSeconds: number): void {
    const filePath = this.keyToFilePath(key);
    const now = new Date().toISOString();
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      fetchedAt: now,
    };

    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
    this.updateLastSuccessfulFetch(now);
  }

  clear(): void {
    if (!fs.existsSync(this.cacheDir)) {
      return;
    }

    for (const file of fs.readdirSync(this.cacheDir)) {
      fs.unlinkSync(path.join(this.cacheDir, file));
    }
  }

  getLastSuccessfulFetch(): string | null {
    if (!fs.existsSync(this.metaFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(this.metaFile, "utf-8");
      const meta = JSON.parse(content) as { lastSuccessfulFetch?: string };
      return meta.lastSuccessfulFetch ?? null;
    } catch {
      return null;
    }
  }

  isWritable(): boolean {
    try {
      this.ensureDir();
      const testFile = path.join(this.cacheDir, "_write_test");
      fs.writeFileSync(testFile, "ok");
      fs.unlinkSync(testFile);
      return true;
    } catch {
      return false;
    }
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private serializeKey(key: CacheKey): string {
    return `${key.provider}:${key.schemaVersion}:${key.entityType}:${key.entityKey}`;
  }

  private keyToFilePath(key: CacheKey): string {
    const safeKey = this.serializeKey(key).replace(/[/:]/g, "_");
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  private updateLastSuccessfulFetch(timestamp: string): void {
    fs.writeFileSync(this.metaFile, JSON.stringify({ lastSuccessfulFetch: timestamp }, null, 2));
  }
}
