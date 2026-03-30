import { describe, expect, it } from "vitest";
import { ArgumentError } from "../../src/errors.js";
import {
  extractYearWeekFromText,
  getUtcWeekInfo,
  listRecentMonths,
  listRecentWeeks,
  resolveWeek,
} from "../../src/utils/week.js";

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

  it("lists recent weeks from an anchor week", () => {
    expect(listRecentWeeks({ anchor: { week: 2, year: 2026 }, count: 3 })).toEqual([
      { week: 2, year: 2026 },
      { week: 1, year: 2026 },
      { week: 52, year: 2025 },
    ]);
  });

  it("lists recent months as trailing calendar months", () => {
    expect(listRecentMonths({ anchor: { week: 14, year: 2026 }, count: 4 })).toEqual([
      { week: 14, year: 2026 },
      { week: 13, year: 2026 },
      { week: 12, year: 2026 },
      { week: 11, year: 2026 },
      { week: 10, year: 2026 },
      { week: 9, year: 2026 },
      { week: 8, year: 2026 },
      { week: 7, year: 2026 },
      { week: 6, year: 2026 },
      { week: 5, year: 2026 },
      { week: 4, year: 2026 },
      { week: 3, year: 2026 },
      { week: 2, year: 2026 },
      { week: 1, year: 2026 },
      { week: 52, year: 2025 },
      { week: 51, year: 2025 },
      { week: 50, year: 2025 },
      { week: 49, year: 2025 },
    ]);
  });
});
