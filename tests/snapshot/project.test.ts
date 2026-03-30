import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { formatProjectDetail } from "../../src/formatter.js";
import { createOutput } from "../../src/output.js";
import { extractNextData, parseProjectDetailFromHydration } from "../../src/parsers/index.js";
import { parseProjectRef } from "../../src/utils/project-ref.js";

const fixturesDir = join(__dirname, "../fixtures/html");

describe("project snapshots", () => {
  it("matches project detail table snapshot", () => {
    const html = readFileSync(join(fixturesDir, "project-detail.html"), "utf-8");
    const payload = extractNextData(html);
    const project = parseProjectDetailFromHydration(
      payload,
      parseProjectRef("yossisegev/launching-today"),
    );

    expect(formatProjectDetail(project!)).toMatchSnapshot();
  });

  it("matches project json envelope snapshot", () => {
    const html = readFileSync(join(fixturesDir, "project-detail.html"), "utf-8");
    const payload = extractNextData(html);
    const project = parseProjectDetailFromHydration(
      payload,
      parseProjectRef("yossisegev/launching-today"),
    );
    const output = createOutput(project, {
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
