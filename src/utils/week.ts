import { ArgumentError } from "../errors.js";

export interface YearWeek {
  year: number;
  week: number;
}

export interface ResolvedYearWeek extends YearWeek {
  source: "explicit" | "page" | "utc-fallback";
}

export interface ResolveWeekOptions {
  week?: number | string;
  year?: number | string;
  page?: YearWeek | null;
  now?: Date;
}

export function getUtcWeekInfo(date: Date): YearWeek {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayOfWeek = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayOfWeek);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utcDate.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);

  return {
    year: utcDate.getUTCFullYear(),
    week,
  };
}

export function extractYearWeekFromText(value: string): YearWeek | null {
  const patterns = [
    /(\d{4})\s*\/\s*week\s*\/\s*(\d{1,2})/i,
    /(\d{4}).{0,20}\bweek\b[^0-9]{0,5}(\d{1,2})/i,
    /\bweek\b[^0-9]{0,5}(\d{1,2}).{0,20}(\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (!match) {
      continue;
    }

    const first = Number.parseInt(match[1], 10);
    const second = Number.parseInt(match[2], 10);
    const year = first > 1000 ? first : second;
    const week = first > 1000 ? second : first;

    validateYearWeek(week, year);
    return { year, week };
  }

  return null;
}

export function resolveWeek(options: ResolveWeekOptions): ResolvedYearWeek {
  const explicitWeek = parseOptionalPositiveInteger(options.week, "week");
  const explicitYear = parseOptionalPositiveInteger(options.year, "year");

  if ((explicitWeek === undefined) !== (explicitYear === undefined)) {
    throw new ArgumentError("Both week and year must be provided together");
  }

  if (explicitWeek !== undefined && explicitYear !== undefined) {
    validateYearWeek(explicitWeek, explicitYear);

    return {
      week: explicitWeek,
      year: explicitYear,
      source: "explicit",
    };
  }

  if (options.page) {
    validateYearWeek(options.page.week, options.page.year);

    return {
      ...options.page,
      source: "page",
    };
  }

  return {
    ...getUtcWeekInfo(options.now ?? new Date()),
    source: "utc-fallback",
  };
}

function parseOptionalPositiveInteger(
  value: number | string | undefined,
  fieldName: string,
): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ArgumentError(`${fieldName} must be a positive integer`);
  }

  return parsed;
}

function validateYearWeek(week: number, year: number): void {
  if (week < 1 || week > 53) {
    throw new ArgumentError("week must be between 1 and 53");
  }

  if (year < 2000 || year > 9999) {
    throw new ArgumentError("year must be between 2000 and 9999");
  }
}
