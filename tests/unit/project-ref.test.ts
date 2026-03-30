import { describe, expect, it } from "vitest";
import { ArgumentError } from "../../src/errors.js";
import { normalizeProjectRef, parseProjectRef } from "../../src/utils/project-ref.js";

describe("project-ref utils", () => {
  it("normalizes a bare username/project-slug ref", () => {
    expect(normalizeProjectRef("alice/my-product")).toBe("alice/my-product");
  });

  it("normalizes a ref with a leading @", () => {
    expect(normalizeProjectRef("@alice/my-product")).toBe("alice/my-product");
  });

  it("parses a full Peerlist project URL", () => {
    const projectRef = parseProjectRef("https://peerlist.io/alice/project/my-product?x=1");

    expect(projectRef).toMatchObject({
      ref: "alice/my-product",
      username: "alice",
      projectSlug: "my-product",
      url: "https://peerlist.io/alice/project/my-product",
    });
  });

  it("rejects non-Peerlist URLs", () => {
    expect(() => parseProjectRef("https://example.com/alice/project/my-product")).toThrow(
      ArgumentError,
    );
  });
});
