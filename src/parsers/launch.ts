import * as cheerio from "cheerio";
import {
  collectRecords,
  collectStringArray,
  deriveProjectRef,
  extractProjectLinks,
  getPath,
  isRecord,
  parseMetricFromText,
  pickNumber,
  pickString,
  uniqStrings,
} from "./shared.js";
import type { LaunchProject } from "../models/index.js";

interface LaunchParseContext {
  week?: number;
  year?: number;
}

export function parseLaunchProjectsFromHydration(
  payload: unknown,
  context: LaunchParseContext = {},
): LaunchProject[] {
  const projects = new Map<string, LaunchProject>();

  for (const candidate of collectRecords(payload)) {
    const project = parseLaunchCandidate(candidate, context);
    if (!project) {
      continue;
    }

    if (!projects.has(project.ref)) {
      projects.set(project.ref, project);
    }
  }

  return [...projects.values()];
}

export function parseLaunchProjectsFromHtml(
  html: string,
  context: LaunchParseContext = {},
): LaunchProject[] {
  const $ = cheerio.load(html);
  const projects = new Map<string, LaunchProject>();

  for (const projectRef of extractProjectLinks($)) {
    const anchor = $(
      `a[href$="/${projectRef.username}/project/${projectRef.projectSlug}"], a[href="/${projectRef.username}/project/${projectRef.projectSlug}"]`,
    ).first();
    const container = anchor.closest("article, li, section, div");
    const containerText = container.text().replace(/\s+/g, " ").trim();

    const name = pickString(
      container.find("h1, h2, h3, h4, h5, h6").first().text(),
      anchor.text(),
      projectRef.projectSlug.replace(/-/g, " "),
    );

    if (!name || containerText.length < 3) {
      continue;
    }

    const tagline = pickString(
      container.find("p").first().text(),
      container.find("span").first().text(),
    );
    const categories = uniqStrings(
      container
        .find("a[href]")
        .map((_, element) => {
          const href = $(element).attr("href") ?? "";
          const text = $(element).text().trim();
          if (!text || href.includes("/project/")) {
            return undefined;
          }

          return text;
        })
        .get(),
    );

    const project: LaunchProject = {
      ...projectRef,
      name,
      tagline,
      categories: categories.length > 0 ? categories : undefined,
      launchWeek: context.week,
      launchYear: context.year,
      upvotes: parseMetricFromText(containerText, "upvotes"),
      comments: parseMetricFromText(containerText, "comments"),
      views: parseMetricFromText(containerText, "views"),
    };

    projects.set(project.ref, project);
  }

  return [...projects.values()];
}

export function isLaunchpadEmptyState(html: string): boolean {
  const text = getLaunchpadPageText(html);

  if (!text) {
    return false;
  }

  const patterns = [
    /become the first project to launch this week/i,
    /\bno launches yet\b/i,
    /\bno projects launched this week\b/i,
    /\blaunch your project this week\b/i,
  ];

  return patterns.some((pattern) => pattern.test(text));
}

export function extractLaunchpadDisplayedWeek(html: string): number | null {
  const text = getLaunchpadPageText(html);
  if (!text) {
    return null;
  }

  const match = text.match(/\bweek\b[^0-9]{0,5}(\d{1,2})\b/i);
  if (!match?.[1]) {
    return null;
  }

  return Number.parseInt(match[1], 10);
}

function getLaunchpadPageText(html: string): string {
  const $ = cheerio.load(html);
  const parts = [$("main").text(), $("title").text(), $.root().text()]
    .map((value) => value.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return parts.join(" ");
}

function parseLaunchCandidate(
  candidate: Record<string, unknown>,
  context: LaunchParseContext,
): LaunchProject | null {
  const projectRef = deriveProjectRef(candidate);
  if (!projectRef) {
    return null;
  }

  const name = pickString(candidate.name, candidate.title, getPath(candidate, "project", "name"));
  if (!name) {
    return null;
  }

  const categories = collectStringArray(
    candidate.categories,
    candidate.tags,
    getPath(candidate, "project", "categories"),
  );

  return {
    ...projectRef,
    name,
    tagline: pickString(
      candidate.tagline,
      candidate.oneLiner,
      candidate.headline,
      candidate.shortDescription,
      getPath(candidate, "project", "tagline"),
    ),
    websiteUrl: pickString(
      candidate.websiteUrl,
      candidate.website,
      candidate.siteUrl,
      getPath(candidate, "project", "websiteUrl"),
    ),
    coverImageUrl: pickString(
      candidate.coverImageUrl,
      candidate.imageUrl,
      candidate.thumbnailUrl,
      getPath(candidate, "project", "coverImageUrl"),
    ),
    categories,
    launchWeek:
      pickNumber(candidate.launchWeek, candidate.week, getPath(candidate, "launch", "week")) ??
      context.week,
    launchYear:
      pickNumber(candidate.launchYear, candidate.year, getPath(candidate, "launch", "year")) ??
      context.year,
    position: pickNumber(candidate.position, candidate.rank),
    score: pickNumber(candidate.score, candidate.points),
    upvotes: pickNumber(
      candidate.upvotes,
      candidate.voteCount,
      getPath(candidate, "stats", "upvotes"),
    ),
    comments: pickNumber(
      candidate.comments,
      candidate.commentCount,
      getPath(candidate, "stats", "comments"),
    ),
    views: pickNumber(candidate.views, candidate.viewCount, getPath(candidate, "stats", "views")),
    isStaffPick:
      candidate.isStaffPick === true ||
      candidate.staffPick === true ||
      getPath(candidate, "badges", "staffPick") === true,
    isFeatured: candidate.isFeatured === true || candidate.featured === true,
  };
}
