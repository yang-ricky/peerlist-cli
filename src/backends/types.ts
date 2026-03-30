import type { LaunchProject, ListOptions, ProjectDetail, Provider } from "../models/index.js";

export interface BackendResult<T> {
  data: T;
  dataSource: Provider;
  providerChain: Provider[];
  cacheHit: boolean;
  degraded: boolean;
  warnings: string[];
}

export interface Backend {
  getLatest(options?: ListOptions): Promise<BackendResult<LaunchProject[]>>;
  getProject(ref: string): Promise<BackendResult<ProjectDetail>>;
}
