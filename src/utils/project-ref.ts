import { URLS } from "../constants.js";
import { ArgumentError } from "../errors.js";
import type { ProjectRef } from "../models/index.js";

const BARE_PROJECT_REF_PATTERN = /^@?([A-Za-z0-9_-]+)\/([A-Za-z0-9_-]+)$/;

export function parseProjectRef(input: string): ProjectRef {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new ArgumentError("Project ref is required");
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return parseProjectUrl(trimmed);
  }

  const match = trimmed.match(BARE_PROJECT_REF_PATTERN);
  if (!match) {
    throw new ArgumentError(
      "Invalid project ref. Expected username/project-slug or a full Peerlist project URL.",
    );
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

export function normalizeProjectRef(input: string): string {
  return parseProjectRef(input).ref;
}

function parseProjectUrl(input: string): ProjectRef {
  let url: URL;

  try {
    url = new URL(input);
  } catch {
    throw new ArgumentError("Invalid project URL");
  }

  if (!(url.hostname === "peerlist.io" || url.hostname === "www.peerlist.io")) {
    throw new ArgumentError("Project URL must point to peerlist.io");
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3 || segments[1] !== "project") {
    throw new ArgumentError("Project URL must match /:username/project/:projectSlug");
  }

  const username = segments[0];
  const projectSlug = segments[2];

  if (!username || !projectSlug) {
    throw new ArgumentError("Project URL must include both username and project slug");
  }

  return {
    ref: `${username}/${projectSlug}`,
    username,
    projectSlug,
    url: URLS.project(username, projectSlug),
  };
}
