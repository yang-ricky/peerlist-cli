import * as cheerio from "cheerio";
import {
  collectRecords,
  collectStringArray,
  deriveProjectRef,
  getPath,
  isRecord,
  parseMetricFromText,
  parseProjectRefFromUrl,
  pickNumber,
  pickString,
  uniqStrings,
} from "./shared.js";
import type { ProjectCollaborator, ProjectDetail, ProjectRef } from "../models/index.js";
import { ParseError } from "../errors.js";

export function parseProjectDetailFromHydration(
  payload: unknown,
  expectedRef?: ProjectRef,
): ProjectDetail | null {
  for (const candidate of collectRecords(payload)) {
    const detail = parseProjectCandidate(candidate, expectedRef);
    if (detail) {
      return detail;
    }
  }

  return null;
}

export function parseProjectDetailFromHtml(html: string, expectedRef?: ProjectRef): ProjectDetail {
  const $ = cheerio.load(html);
  const canonicalUrl = pickString(
    $('link[rel="canonical"]').attr("href"),
    $('meta[property="og:url"]').attr("content"),
  );
  const projectRef = expectedRef ?? (canonicalUrl ? parseProjectRefFromUrl(canonicalUrl) : null);

  if (!projectRef) {
    throw new ParseError("Failed to determine project ref from HTML");
  }

  const pageText = $("body").text().replace(/\s+/g, " ").trim();
  const name = pickString(
    $("h1").first().text(),
    $('meta[property="og:title"]')
      .attr("content")
      ?.replace(/\s*\|\s*Peerlist$/, ""),
  );
  const description = pickString(
    $('meta[name="description"]').attr("content"),
    $('meta[property="og:description"]').attr("content"),
    $(".description, [data-description]").first().text(),
    $("p")
      .toArray()
      .map((element) => $(element).text().trim())
      .find((text) => text.length > 40),
  );

  if (!name || !description) {
    throw new ParseError(`Failed to parse project detail for ref: ${projectRef.ref}`);
  }

  const categories = uniqStrings(
    $("a[href]")
      .toArray()
      .map((element) => {
        const href = $(element).attr("href") ?? "";
        const text = $(element).text().trim();
        if (!text || href.includes("/project/") || href.startsWith("http")) {
          return undefined;
        }

        return text;
      }),
  );

  return {
    ...projectRef,
    name,
    description,
    tagline: pickString(
      $("h2").first().text(),
      $('meta[property="og:description"]').attr("content"),
    ),
    websiteUrl: $('a[href^="http"]')
      .toArray()
      .map((element) => $(element).attr("href") ?? "")
      .find((href) => href && !href.includes("peerlist.io")),
    categories: categories.length > 0 ? categories : undefined,
    builtWith: extractSectionList($, "Built with"),
    benefits: extractSectionList($, "Benefits"),
    keyFeatures: extractSectionList($, "Key Features"),
    useCases: extractSectionList($, "Use Case"),
    launchWeek: parseWeekYear(pageText)?.week,
    launchYear: parseWeekYear(pageText)?.year,
    upvotes: parseMetricFromText(pageText, "upvotes"),
    comments: parseMetricFromText(pageText, "comments"),
    views: parseMetricFromText(pageText, "views"),
  };
}

function parseProjectCandidate(
  candidate: Record<string, unknown>,
  expectedRef?: ProjectRef,
): ProjectDetail | null {
  const nestedProject = getPath(candidate, "project");
  const source = isRecord(nestedProject) ? nestedProject : candidate;
  const derivedRef = deriveProjectRef(source) ?? deriveProjectRef(candidate);
  const projectRef = derivedRef ?? expectedRef ?? null;
  if (!projectRef) {
    return null;
  }

  if (expectedRef && derivedRef && projectRef.ref !== expectedRef.ref) {
    return null;
  }

  const name = pickString(source.name, source.title, candidate.name, candidate.title);
  const description = pickString(source.description, source.longDescription, candidate.description);

  if (!name || !description) {
    return null;
  }

  return {
    ...projectRef,
    name,
    description,
    tagline: pickString(source.tagline, source.oneLiner, source.headline, candidate.tagline),
    websiteUrl: pickString(source.websiteUrl, source.website, source.siteUrl, candidate.websiteUrl),
    coverImageUrl: pickString(
      source.coverImageUrl,
      source.imageUrl,
      source.thumbnailUrl,
      candidate.coverImageUrl,
    ),
    categories: collectStringArray(
      source.categories,
      source.tags,
      candidate.categories,
      candidate.tags,
    ),
    launchWeek: pickNumber(
      source.launchWeek,
      source.week,
      candidate.launchWeek,
      candidate.week,
      getPath(candidate, "launch", "week"),
    ),
    launchYear: pickNumber(
      source.launchYear,
      source.year,
      candidate.launchYear,
      candidate.year,
      getPath(candidate, "launch", "year"),
    ),
    upvotes: pickNumber(
      source.upvotes,
      source.voteCount,
      candidate.upvotes,
      candidate.voteCount,
      getPath(candidate, "stats", "upvotes"),
    ),
    comments: pickNumber(
      source.comments,
      source.commentCount,
      candidate.comments,
      candidate.commentCount,
      getPath(candidate, "stats", "comments"),
    ),
    views: pickNumber(
      source.views,
      source.viewCount,
      candidate.views,
      getPath(candidate, "stats", "views"),
    ),
    builtWith: collectStringArray(source.builtWith, source.stack, candidate.builtWith),
    benefits: collectStringArray(source.benefits, candidate.benefits),
    keyFeatures: collectStringArray(source.keyFeatures, source.features, candidate.keyFeatures),
    useCases: collectStringArray(source.useCases, source.useCase, candidate.useCases),
    makerName: pickString(
      source.makerName,
      getPath(source, "maker", "name"),
      getPath(source, "user", "name"),
      getPath(source, "author", "name"),
      candidate.makerName,
      getPath(candidate, "maker", "name"),
      getPath(candidate, "user", "name"),
      getPath(candidate, "author", "name"),
    ),
    makerUsername: pickString(
      source.makerUsername,
      getPath(source, "maker", "username"),
      getPath(source, "user", "username"),
      getPath(source, "author", "username"),
      candidate.makerUsername,
      getPath(candidate, "maker", "username"),
      getPath(candidate, "user", "username"),
      getPath(candidate, "author", "username"),
    ),
    collaborators: parseCollaborators(source.collaborators ?? candidate.collaborators),
  };
}

function parseCollaborators(value: unknown): ProjectCollaborator[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const collaborators = value
    .map((item) => {
      if (typeof item === "string") {
        return { name: item.trim() };
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const name = pickString(
        (item as Record<string, unknown>).name,
        (item as Record<string, unknown>).title,
      );
      if (!name) {
        return null;
      }

      return {
        name,
        username: pickString((item as Record<string, unknown>).username),
        profileUrl: pickString(
          (item as Record<string, unknown>).profileUrl,
          (item as Record<string, unknown>).url,
        ),
      };
    })
    .filter((item): item is ProjectCollaborator => Boolean(item));

  return collaborators.length > 0 ? collaborators : undefined;
}

function extractSectionList($: cheerio.CheerioAPI, heading: string): string[] | undefined {
  const headingElement = $("h1, h2, h3, h4, h5, h6")
    .filter((_, element) => $(element).text().trim().toLowerCase() === heading.toLowerCase())
    .first();

  if (!headingElement.length) {
    return undefined;
  }

  const section = headingElement.parent();
  const listItems = uniqStrings(
    section
      .find("li")
      .toArray()
      .map((element) => $(element).text().trim()),
  );

  if (listItems.length > 0) {
    return listItems;
  }

  const text = section.text();
  const withoutHeading = text.replace(headingElement.text(), "");
  const items = withoutHeading
    .split(/[•\n]/)
    .map((item) => item.trim())
    .filter((item) => item && item.toLowerCase() !== heading.toLowerCase());

  return items.length > 0 ? [...new Set(items)] : undefined;
}

function parseWeekYear(text: string): { week: number; year: number } | null {
  const match = text.match(/Week\s+(\d{1,2})\s*•\s*(\d{4})/i);
  if (!match) {
    return null;
  }

  return {
    week: Number(match[1]),
    year: Number(match[2]),
  };
}
