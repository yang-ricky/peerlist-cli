// All HTML selectors should live here.
// For peerlist-cli v0.1, selectors are fallback-only and should not be treated as the primary
// extraction strategy.

export const LAUNCH_SELECTORS = {
  listItem: "",
  name: "",
  tagline: "",
  link: "",
} as const;

export const PROJECT_SELECTORS = {
  name: "",
  description: "",
  categories: "",
  websiteLink: "",
} as const;
