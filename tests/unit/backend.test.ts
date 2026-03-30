import * as fs from "node:fs";
import * as os from "node:os";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileCache } from "../../src/cache/index.js";
import { PeerlistBackend } from "../../src/backends/index.js";
import { ParseError } from "../../src/errors.js";

const fixturesDir = join(__dirname, "../fixtures/html");
const tempDirs: string[] = [];

function createTempCacheDir(): string {
  const dir = join(os.tmpdir(), `peerlist-cli-backend-${Date.now()}-${Math.random()}`);
  fs.mkdirSync(dir, { recursive: true });
  tempDirs.push(dir);
  return dir;
}

describe("peerlist backend", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();

    for (const dir of tempDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns launch projects from hydration with backend metadata", async () => {
    const html = readFileSync(join(fixturesDir, "launchpad-week.html"), "utf-8");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => html,
      }),
    );

    const backend = new PeerlistBackend(new FileCache(createTempCacheDir()), {
      delay: 0,
      timeout: 1000,
      retries: 1,
    });
    const result = await backend.getLatest({ week: 14, year: 2026, limit: 5 });

    expect(result.dataSource).toBe("hydration");
    expect(result.cacheHit).toBe(false);
    expect(result.data).toHaveLength(2);
  });

  it("returns project detail from hydration with backend metadata", async () => {
    const html = readFileSync(join(fixturesDir, "project-detail.html"), "utf-8");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => html,
      }),
    );

    const backend = new PeerlistBackend(new FileCache(createTempCacheDir()), {
      delay: 0,
      timeout: 1000,
      retries: 1,
    });
    const result = await backend.getProject("yossisegev/launching-today");

    expect(result.dataSource).toBe("hydration");
    expect(result.data.name).toBe("Launching Today");
  });

  it("returns an empty launch list for an empty launchpad week", async () => {
    const html = readFileSync(join(fixturesDir, "launchpad-empty.html"), "utf-8");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => html,
      }),
    );

    const backend = new PeerlistBackend(new FileCache(createTempCacheDir()), {
      delay: 0,
      timeout: 1000,
      retries: 1,
    });
    const result = await backend.getLatest({ week: 14, year: 2026, limit: 5 });

    expect(result.data).toEqual([]);
    expect(result.dataSource).toBe("html");
    expect(result.degraded).toBe(true);
    expect(result.warnings).toContain("No Launchpad projects found for week 14, 2026.");
  });

  it("rejects historical week pages that render the wrong week", async () => {
    const html = readFileSync(join(fixturesDir, "launchpad-empty.html"), "utf-8");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => html,
      }),
    );

    const backend = new PeerlistBackend(new FileCache(createTempCacheDir()), {
      delay: 0,
      timeout: 1000,
      retries: 1,
    });

    await expect(backend.getLatest({ week: 13, year: 2026 })).rejects.toThrow(ParseError);
    await expect(backend.getLatest({ week: 13, year: 2026 })).rejects.toThrow(
      "requested page rendered week 14 instead",
    );
  });
});
