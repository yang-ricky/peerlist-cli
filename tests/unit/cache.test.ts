import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FileCache } from "../../src/cache/index.js";
import type { CacheKey } from "../../src/models/index.js";

const tempDirs: string[] = [];

function createTempCacheDir(): string {
  const dir = path.join(os.tmpdir(), `peerlist-cli-cache-${Date.now()}-${Math.random()}`);
  fs.mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("file cache", () => {
  const cacheKey: CacheKey = {
    provider: "html",
    schemaVersion: "1",
    entityType: "latest",
    entityKey: "2026:w14",
  };

  it("stores and retrieves cached entries", () => {
    const cache = new FileCache(createTempCacheDir());

    cache.set(cacheKey, { value: 1 }, 60);

    expect(cache.get<{ value: number }>(cacheKey)?.data).toEqual({ value: 1 });
    expect(cache.getLastSuccessfulFetch()).toBeTruthy();
  });

  it("drops expired entries", () => {
    const cache = new FileCache(createTempCacheDir());

    cache.set(cacheKey, { value: 1 }, -1);

    expect(cache.get(cacheKey)).toBeNull();
  });

  it("reports the cache directory as writable", () => {
    const cache = new FileCache(createTempCacheDir());

    expect(cache.isWritable()).toBe(true);
  });
});
