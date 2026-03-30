import { describe, expect, it } from "vitest";
import { createErrorOutput, createOutput, getOutputFormat } from "../../src/output.js";

describe("output helpers", () => {
  it("defaults to json in non-tty mode", () => {
    expect(getOutputFormat({})).toBe("json");
  });

  it("prefers json when both json and yaml are set", () => {
    expect(getOutputFormat({ json: true, yaml: true })).toBe("json");
  });

  it("uses yaml when yaml is explicitly requested", () => {
    expect(getOutputFormat({ yaml: true })).toBe("yaml");
  });

  it("creates success output metadata", () => {
    const output = createOutput({ ok: true }, { dataSource: "hydration", degraded: true });

    expect(output.ok).toBe(true);
    expect(output.dataSource).toBe("hydration");
    expect(output.degraded).toBe(true);
  });

  it("creates error output metadata", () => {
    const output = createErrorOutput("boom", "Something failed", 1);

    expect(output.ok).toBe(false);
    expect(output.error?.code).toBe("boom");
  });
});
