import { describe, expect, it } from "vitest";
import { ArgumentError } from "../../src/errors.js";
import { extractYearWeekFromText, getUtcWeekInfo, resolveWeek } from "../../src/utils/week.js";

describe("week utils", () => {
  it("uses explicit week/year when both are provided", () => {
    expect(resolveWeek({ week: "14", year: "2026" })).toEqual({
      week: 14,
      year: 2026,
      source: "explicit",
    });
  });

  it("falls back to page week info before utc fallback", () => {
    expect(resolveWeek({ page: { week: 12, year: 2026 } })).toEqual({
      week: 12,
      year: 2026,
      source: "page",
    });
  });

  it("falls back to utc week info when explicit and page values are missing", () => {
    expect(getUtcWeekInfo(new Date(Date.UTC(2026, 2, 30)))).toEqual({
      week: 14,
      year: 2026,
    });
  });

  it("extracts year/week from text", () => {
    expect(extractYearWeekFromText("Launchpad 2026 week 14")).toEqual({
      week: 14,
      year: 2026,
    });
  });

  it("rejects partial explicit input", () => {
    expect(() => resolveWeek({ week: 14 })).toThrow(ArgumentError);
  });
});
