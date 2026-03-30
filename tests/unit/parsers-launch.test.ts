import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractNextData,
  parseLaunchProjectsFromHtml,
  parseLaunchProjectsFromHydration,
} from "../../src/parsers/index.js";

const fixturesDir = join(__dirname, "../fixtures/html");

describe("launch parser", () => {
  it("parses launch projects from hydration payload", () => {
    const html = readFileSync(join(fixturesDir, "launchpad-week.html"), "utf-8");
    const payload = extractNextData(html);
    const projects = parseLaunchProjectsFromHydration(payload, { week: 14, year: 2026 });

    expect(projects).toHaveLength(2);
    expect(projects[0]).toMatchObject({
      ref: "yossisegev/launching-today",
      name: "Launching Today",
      launchWeek: 14,
      launchYear: 2026,
    });
  });

  it("parses launch projects from html fallback", () => {
    const html = readFileSync(join(fixturesDir, "launchpad-week.html"), "utf-8");
    const projects = parseLaunchProjectsFromHtml(html, { week: 14, year: 2026 });

    expect(projects).toHaveLength(2);
    expect(projects[1]).toMatchObject({
      ref: "sara/build-log",
      name: "Build Log",
      upvotes: 18,
    });
  });
});
