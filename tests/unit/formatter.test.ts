import { describe, expect, it } from "vitest";
import { formatLaunchListTable, formatProjectDetail } from "../../src/formatter.js";

describe("formatter", () => {
  it("formats launch list table", () => {
    const output = formatLaunchListTable([
      {
        ref: "yossisegev/launching-today",
        username: "yossisegev",
        projectSlug: "launching-today",
        url: "https://peerlist.io/yossisegev/project/launching-today",
        name: "Launching Today",
        tagline: "A place to launch your next project",
        launchWeek: 14,
        launchYear: 2026,
        upvotes: 22,
      },
    ]);

    expect(output).toContain("Launching Today");
    expect(output).toContain("W14 2026");
  });

  it("formats empty launch list state", () => {
    const output = formatLaunchListTable([]);

    expect(output).toContain("No Launchpad projects found for this week yet.");
  });

  it("formats empty launch list state for a range", () => {
    const output = formatLaunchListTable([], {
      emptyMessage: "No Launchpad projects found for the requested range yet.",
    });

    expect(output).toContain("No Launchpad projects found for the requested range yet.");
  });

  it("formats project detail output", () => {
    const output = formatProjectDetail({
      ref: "yossisegev/launching-today",
      username: "yossisegev",
      projectSlug: "launching-today",
      url: "https://peerlist.io/yossisegev/project/launching-today",
      name: "Launching Today",
      description: "Launching Today helps builders launch projects.",
      builtWith: ["Next.js", "Tailwind CSS"],
    });

    expect(output).toContain("Launching Today");
    expect(output).toContain("Description:");
    expect(output).toContain("Built with:");
  });
});
