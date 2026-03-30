import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatLaunchListTable } from "../../src/formatter.js";
import { createOutput } from "../../src/output.js";
import { extractNextData, parseLaunchProjectsFromHydration } from "../../src/parsers/index.js";

const fixturesDir = join(__dirname, "../fixtures/html");

describe("latest snapshots", () => {
  it("matches launch list table snapshot", () => {
    const html = readFileSync(join(fixturesDir, "launchpad-week.html"), "utf-8");
    const payload = extractNextData(html);
    const projects = parseLaunchProjectsFromHydration(payload, { week: 14, year: 2026 });

    expect(formatLaunchListTable(projects)).toMatchSnapshot();
  });

  it("matches latest json envelope snapshot", () => {
    const html = readFileSync(join(fixturesDir, "launchpad-week.html"), "utf-8");
    const payload = extractNextData(html);
    const projects = parseLaunchProjectsFromHydration(payload, { week: 14, year: 2026 });
    const output = createOutput(projects, {
      dataSource: "hydration",
      providerChain: ["hydration"],
      cacheHit: false,
    });

    expect({
      ...output,
      fetchedAt: "<redacted>",
    }).toMatchSnapshot();
  });
});
