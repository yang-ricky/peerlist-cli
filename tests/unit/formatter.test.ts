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
