export const SITE_URL = "https://peerlist.io";

export const URLS = {
  home: SITE_URL,
  launchpad: `${SITE_URL}/launchpad`,
  launchpadWeek: (year: number, week: number) => `${SITE_URL}/launchpad/${year}/week/${week}`,
  project: (username: string, projectSlug: string) =>
    `${SITE_URL}/${username}/project/${projectSlug}`,
} as const;

export const DEFAULTS = {
  limit: 20,
  delay: 1500,
  timeout: 10_000,
  retries: 3,
  userAgent: "peerlist-cli/0.1",
  cacheTTL: {
    latest: 300,
    project: 3600,
    categories: 86_400,
    leaderboard: 3600,
  },
  cacheDir: "~/.peerlist-cli/cache",
  configDir: "~/.peerlist-cli",
} as const;
