import type { ListOptions, ProjectDetail, LaunchProject } from "../models/index.js";

export interface Backend {
  getLatest(options?: ListOptions): Promise<LaunchProject[]>;
  getProject(ref: string): Promise<ProjectDetail>;
}
