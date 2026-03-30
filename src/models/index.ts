export type Provider = "hydration" | "html";

export interface ProjectRef {
  ref: string;
  username: string;
  projectSlug: string;
  url: string;
}

export interface LaunchProject extends ProjectRef {
  name: string;

  tagline?: string;
  websiteUrl?: string;
  coverImageUrl?: string;
  categories?: string[];

  launchWeek?: number;
  launchYear?: number;
  position?: number;
  score?: number;
  upvotes?: number;
  comments?: number;
  views?: number;

  isStaffPick?: boolean;
  isFeatured?: boolean;
}

export interface ProjectCollaborator {
  name: string;
  username?: string;
  profileUrl?: string;
}

export interface ProjectDetail extends LaunchProject {
  description: string;
  makerName?: string;
  makerUsername?: string;
  collaborators?: ProjectCollaborator[];
  builtWith?: string[];
  images?: string[];
  benefits?: string[];
  keyFeatures?: string[];
  useCases?: string[];
}

export interface CacheKey {
  provider: Provider;
  schemaVersion: string;
  entityType: string;
  entityKey: string;
}

export interface CLIOutput<T> {
  ok: boolean;
  schemaVersion: string;
  dataSource: Provider;
  providerChain: Provider[];
  fetchedAt: string;
  cacheHit: boolean;
  degraded: boolean;
  warnings: string[];
  data: T | null;
  error: {
    code: string;
    message: string;
    exitCode: number;
  } | null;
}

export interface ListOptions {
  limit?: number;
  week?: number;
  year?: number;
}

export interface YearWeek {
  year: number;
  week: number;
}
