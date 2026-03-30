import { describe, expect, it, vi } from "vitest";
import { loadConfig } from "../../src/config.js";

describe("config", () => {
  it("loads env overrides", () => {
    vi.stubEnv("PL_CACHE_ENABLED", "false");
    vi.stubEnv("PL_REQUEST_DELAY", "2500");
    vi.stubEnv("PL_REQUEST_TIMEOUT", "9000");

    const config = loadConfig();

    expect(config.cache.enabled).toBe(false);
    expect(config.request.delay).toBe(2500);
    expect(config.request.timeout).toBe(9000);
  });
});
