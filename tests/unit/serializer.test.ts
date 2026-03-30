import { describe, expect, it } from "vitest";
import { createOutput } from "../../src/output.js";
import { toJSON, toYAML } from "../../src/serializer.js";

describe("serializer", () => {
  it("serializes output to json", () => {
    const output = createOutput({ hello: "world" }, { dataSource: "html" });
    const json = toJSON(output);

    expect(json).toContain('"ok": true');
    expect(json).toContain('"hello": "world"');
  });

  it("serializes output to yaml", () => {
    const output = createOutput({ hello: "world" }, { dataSource: "hydration" });
    const yaml = toYAML(output);

    expect(yaml).toContain("ok: true");
    expect(yaml).toContain("dataSource: hydration");
  });
});
