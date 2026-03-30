import * as cheerio from "cheerio";
import { URLS } from "../constants.js";
import type { ProjectRef } from "../models/index.js";

interface RecordLike {
  [key: string]: unknown;
}

const PROJECT_URL_PATTERN =
  /^https?:\/\/(?:www\.)?peerlist\.io\/([^/]+)\/project\/([^/?#]+)(?:[/?#].*)?$/i;

export function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function collectRecords(root: unknown): RecordLike[] {
  const records: RecordLike[] = [];
  const seen = new Set<unknown>();

  function visit(value: unknown): void {
    if (value === null || value === undefined || seen.has(value)) {
      return;
    }

    if (typeof value !== "object") {
      return;
    }

    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item);
      }
      return;
    }

    records.push(value as RecordLike);

    for (const child of Object.values(value)) {
      visit(child);
    }
  }

  visit(root);

  return records;
}

export function pickString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return undefined;
}

export function pickNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/,/g, "").trim();
      if (/^-?\d+(\.\d+)?$/.test(normalized)) {
        return Number(normalized);
      }
    }
  }

  return undefined;
}

export function getPath(value: unknown, ...path: string[]): unknown {
  let current = value;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

export function collectStringArray(...values: unknown[]): string[] | undefined {
  for (const value of values) {
    const items = toStringArray(value);
    if (items.length > 0) {
      return items;
    }
  }

  return undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (isRecord(item)) {
          return pickString(item.name, item.label, item.title);
        }

        return undefined;
      })
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    return value
      .split(/[•,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function parseProjectRefFromUrl(url: string): ProjectRef | null {
  const match = url.match(PROJECT_URL_PATTERN);
  if (!match) {
    return null;
  }

  const username = match[1];
  const projectSlug = match[2];

  return {
    ref: `${username}/${projectSlug}`,
    username,
    projectSlug,
    url: URLS.project(username, projectSlug),
  };
}

export function deriveProjectRef(candidate: unknown): ProjectRef | null {
  if (!isRecord(candidate)) {
    return null;
  }

  const url = pickString(
    candidate.url,
    candidate.permalink,
    candidate.projectUrl,
    getPath(candidate, "project", "url"),
  );
  if (url) {
    const fromUrl = parseProjectRefFromUrl(url);
    if (fromUrl) {
      return fromUrl;
    }
  }

  const username = pickString(
    candidate.username,
    candidate.handle,
    candidate.ownerUsername,
    getPath(candidate, "user", "username"),
    getPath(candidate, "user", "handle"),
    getPath(candidate, "maker", "username"),
    getPath(candidate, "author", "username"),
    getPath(candidate, "project", "username"),
  );
  const projectSlug = pickString(
    candidate.projectSlug,
    candidate.slug,
    getPath(candidate, "project", "slug"),
  );

  if (!username || !projectSlug) {
    return null;
  }

  return {
    ref: `${username}/${projectSlug}`,
    username,
    projectSlug,
    url: URLS.project(username, projectSlug),
  };
}

export function extractProjectLinks($: cheerio.CheerioAPI): ProjectRef[] {
  const refs = new Map<string, ProjectRef>();

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) {
      return;
    }

    const absoluteUrl = toAbsoluteUrl(href);
    const projectRef = parseProjectRefFromUrl(absoluteUrl);

    if (projectRef) {
      refs.set(projectRef.ref, projectRef);
    }
  });

  return [...refs.values()];
}

export function toAbsoluteUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${URLS.home}${url}`;
  }

  return `${URLS.home}/${url}`;
}

export function parseMetricFromText(text: string, label: string): number | undefined {
  const compact = text.replace(/\s+/g, " ");
  const patterns = [
    new RegExp(`(\\d[\\d,]*)\\s+${label}`, "i"),
    new RegExp(`${label}\\s*[:•-]?\\s*(\\d[\\d,]*)`, "i"),
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern);
    if (match?.[1]) {
      return Number(match[1].replace(/,/g, ""));
    }
  }

  return undefined;
}

export function uniqStrings(values: Array<string | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}
