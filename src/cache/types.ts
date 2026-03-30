import type { CacheKey } from "../models/index.js";

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  fetchedAt: string;
}

export interface Cache {
  get<T>(key: CacheKey): CacheEntry<T> | null;
  set<T>(key: CacheKey, value: T, ttlSeconds: number): void;
  clear(): void;
  getLastSuccessfulFetch(): string | null;
  isWritable(): boolean;
}
