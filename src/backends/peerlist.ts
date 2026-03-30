import type { Cache } from "../cache/types.js";
import { DEFAULTS, URLS } from "../constants.js";
import { NetworkError, ParseError, RateLimitError } from "../errors.js";
import type {
  LaunchProject,
  ListOptions,
  ProjectDetail,
  Provider,
  ProjectRef,
} from "../models/index.js";
import {
  extractNextData,
  extractStructuredData,
  parseLaunchProjectsFromHtml,
  parseLaunchProjectsFromHydration,
  parseProjectDetailFromHtml,
  parseProjectDetailFromHydration,
} from "../parsers/index.js";
import { parseProjectRef } from "../utils/project-ref.js";
import { getUtcWeekInfo, resolveWeek } from "../utils/week.js";
import type { Backend, BackendResult } from "./types.js";

const SCHEMA_VERSION = "1";

export class PeerlistBackend implements Backend {
  private lastRequestTime = 0;

  constructor(
    private readonly cache: Cache,
    private readonly config: {
      delay: number;
      timeout: number;
      retries: number;
      userAgent?: string;
      cacheTTL?: {
        latest: number;
        project: number;
      };
    } = {
      delay: DEFAULTS.delay,
      timeout: DEFAULTS.timeout,
      retries: DEFAULTS.retries,
    },
  ) {}

  async getLatest(options: ListOptions = {}): Promise<BackendResult<LaunchProject[]>> {
    const resolvedWeek = resolveWeek({
      week: options.week,
      year: options.year,
    });
    const limit = options.limit ?? DEFAULTS.limit;

    const hydrationKey = this.makeCacheKey(
      "hydration",
      "latest",
      `${resolvedWeek.year}:w${resolvedWeek.week}`,
    );
    const htmlKey = this.makeCacheKey(
      "html",
      "latest",
      `${resolvedWeek.year}:w${resolvedWeek.week}`,
    );

    const cached =
      this.getCachedResult<LaunchProject[]>(hydrationKey) ??
      this.getCachedResult<LaunchProject[]>(htmlKey);
    if (cached) {
      return {
        ...cached,
        data: cached.data.slice(0, limit),
        cacheHit: true,
      };
    }

    const urls = this.buildLaunchpadUrls(resolvedWeek.year, resolvedWeek.week);
    const providerChain: Provider[] = ["hydration"];
    const warnings: string[] = [];
    let html = "";

    for (const url of urls) {
      try {
        html = await this.fetchWithRetry(url);
        break;
      } catch (error) {
        if (url === urls[urls.length - 1]) {
          throw error;
        }
      }
    }

    const machinePayloads = [extractNextData(html), ...extractStructuredData(html)].filter(Boolean);
    for (const payload of machinePayloads) {
      const launches = parseLaunchProjectsFromHydration(payload, {
        week: resolvedWeek.week,
        year: resolvedWeek.year,
      });
      if (launches.length > 0) {
        const result: BackendResult<LaunchProject[]> = {
          data: launches.slice(0, limit),
          dataSource: "hydration",
          providerChain,
          cacheHit: false,
          degraded: false,
          warnings,
        };
        this.cache.set(
          hydrationKey,
          result,
          this.config.cacheTTL?.latest ?? DEFAULTS.cacheTTL.latest,
        );
        return result;
      }
    }

    providerChain.push("html");
    warnings.push("Hydration parser failed; fell back to HTML parsing.");
    const launches = parseLaunchProjectsFromHtml(html, {
      week: resolvedWeek.week,
      year: resolvedWeek.year,
    });

    if (launches.length === 0) {
      throw new ParseError(
        `Failed to parse launch list for week ${resolvedWeek.week}, ${resolvedWeek.year}`,
      );
    }

    const result: BackendResult<LaunchProject[]> = {
      data: launches.slice(0, limit),
      dataSource: "html",
      providerChain,
      cacheHit: false,
      degraded: true,
      warnings,
    };
    this.cache.set(htmlKey, result, this.config.cacheTTL?.latest ?? DEFAULTS.cacheTTL.latest);
    return result;
  }

  async getProject(ref: string): Promise<BackendResult<ProjectDetail>> {
    const normalizedRef = parseProjectRef(ref);
    const hydrationKey = this.makeCacheKey("hydration", "project", normalizedRef.ref);
    const htmlKey = this.makeCacheKey("html", "project", normalizedRef.ref);

    const cached =
      this.getCachedResult<ProjectDetail>(hydrationKey) ??
      this.getCachedResult<ProjectDetail>(htmlKey);
    if (cached) {
      return {
        ...cached,
        cacheHit: true,
      };
    }

    const html = await this.fetchWithRetry(normalizedRef.url);
    const providerChain: Provider[] = ["hydration"];
    const warnings: string[] = [];

    const machinePayloads = [extractNextData(html), ...extractStructuredData(html)].filter(Boolean);
    for (const payload of machinePayloads) {
      const detail = parseProjectDetailFromHydration(payload, normalizedRef);
      if (detail) {
        const result: BackendResult<ProjectDetail> = {
          data: detail,
          dataSource: "hydration",
          providerChain,
          cacheHit: false,
          degraded: false,
          warnings,
        };
        this.cache.set(
          hydrationKey,
          result,
          this.config.cacheTTL?.project ?? DEFAULTS.cacheTTL.project,
        );
        return result;
      }
    }

    providerChain.push("html");
    warnings.push("Hydration parser failed; fell back to HTML parsing.");
    const detail = parseProjectDetailFromHtml(html, normalizedRef);
    const result: BackendResult<ProjectDetail> = {
      data: detail,
      dataSource: "html",
      providerChain,
      cacheHit: false,
      degraded: true,
      warnings,
    };
    this.cache.set(htmlKey, result, this.config.cacheTTL?.project ?? DEFAULTS.cacheTTL.project);
    return result;
  }

  private makeCacheKey(provider: Provider, entityType: string, entityKey: string) {
    return {
      provider,
      schemaVersion: SCHEMA_VERSION,
      entityType,
      entityKey,
    };
  }

  private getCachedResult<T>(
    key: ReturnType<PeerlistBackend["makeCacheKey"]>,
  ): BackendResult<T> | null {
    return this.cache.get<BackendResult<T>>(key)?.data ?? null;
  }

  private buildLaunchpadUrls(year: number, week: number): string[] {
    const currentWeek = getUtcWeekInfo(new Date());
    const isCurrentWeek = currentWeek.year === year && currentWeek.week === week;

    return isCurrentWeek
      ? [URLS.launchpadWeek(year, week), URLS.launchpad]
      : [URLS.launchpadWeek(year, week)];
  }

  private async fetchWithRetry(url: string): Promise<string> {
    await this.rateLimit();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": this.config.userAgent ?? DEFAULTS.userAgent,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          throw new RateLimitError("Rate limited by Peerlist");
        }

        if (!response.ok) {
          throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;

        if (error instanceof RateLimitError || error instanceof NetworkError) {
          if (attempt === this.config.retries - 1) {
            throw error;
          }
        }

        await this.sleep(2 ** attempt * 250);
      }
    }

    throw new NetworkError(lastError?.message ?? "Network request failed");
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;

    if (elapsed < this.config.delay) {
      await this.sleep(this.config.delay - elapsed);
    }

    this.lastRequestTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
