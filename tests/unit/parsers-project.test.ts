import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseProjectRef } from "../../src/utils/project-ref.js";
import {
  extractNextData,
  parseProjectDetailFromHtml,
  parseProjectDetailFromHydration,
} from "../../src/parsers/index.js";

const fixturesDir = join(__dirname, "../fixtures/html");

describe("project parser", () => {
  it("parses project detail from hydration payload", () => {
    const html = readFileSync(join(fixturesDir, "project-detail.html"), "utf-8");
    const payload = extractNextData(html);
    const detail = parseProjectDetailFromHydration(
      payload,
      parseProjectRef("yossisegev/launching-today"),
    );

    expect(detail).toMatchObject({
      ref: "yossisegev/launching-today",
      name: "Launching Today",
      makerUsername: "yossisegev",
      launchWeek: 46,
      launchYear: 2024,
    });
  });

  it("parses project detail from html fallback", () => {
    const html = readFileSync(join(fixturesDir, "project-detail.html"), "utf-8");
    const detail = parseProjectDetailFromHtml(html, parseProjectRef("yossisegev/launching-today"));

    expect(detail).toMatchObject({
      ref: "yossisegev/launching-today",
      name: "Launching Today",
      websiteUrl: "https://www.launchingtoday.dev",
      upvotes: 32,
      comments: 4,
      views: 210,
    });
    expect(detail.builtWith).toEqual(["Next.js", "Tailwind CSS"]);
  });
});
