import { describe, expect, it } from "vitest";
import {
  extractNextData,
  extractRscPayload,
  extractStructuredData,
} from "../../src/parsers/hydration.js";

describe("hydration parser", () => {
  it("extracts __NEXT_DATA__", () => {
    const html =
      '<script id="__NEXT_DATA__" type="application/json">{"page":"/launchpad"}</script>';

    expect(extractNextData(html)).toEqual({ page: "/launchpad" });
  });

  it("extracts next rsc payload chunks", () => {
    const html = '<script>self.__next_f.push([1,"hello"])</script>';

    expect(extractRscPayload(html)).toEqual(['[1,"hello"]']);
  });

  it("extracts json-ld payloads", () => {
    const html =
      '<script type="application/ld+json">{"@type":"SoftwareApplication","name":"My App"}</script>';

    expect(extractStructuredData(html)).toEqual([
      {
        "@type": "SoftwareApplication",
        name: "My App",
      },
    ]);
  });
});
