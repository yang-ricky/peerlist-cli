import chalk from "chalk";
import Table from "cli-table3";
import type { LaunchProject, ProjectDetail } from "./models/index.js";
import { useColors } from "./output.js";

const c = useColors() ? chalk : chalk;

export function formatLaunchListTable(projects: LaunchProject[]): string {
  const table = new Table({
    head: [c.bold("Name"), c.bold("Tagline"), c.bold("Week"), c.bold("Upvotes")],
    style: {
      head: [],
      border: [],
    },
    wordWrap: true,
    colWidths: [24, 44, 12, 10],
  });

  for (const project of projects) {
    table.push([
      c.cyan(project.name),
      project.tagline ?? "-",
      project.launchWeek && project.launchYear
        ? `W${project.launchWeek} ${project.launchYear}`
        : "-",
      project.upvotes?.toString() ?? "-",
    ]);
  }

  return table.toString();
}

export function formatProjectDetail(project: ProjectDetail): string {
  const lines: string[] = [];

  lines.push(c.bold.cyan(`\n${project.name}`));
  if (project.tagline) {
    lines.push(c.dim(project.tagline));
  }
  lines.push("");
  lines.push(c.bold("Description:"));
  lines.push(project.description);

  if (project.websiteUrl) {
    lines.push("");
    lines.push(`${c.bold("Website:")} ${c.underline(project.websiteUrl)}`);
  }

  lines.push(`${c.bold("Peerlist:")} ${c.underline(project.url)}`);

  if (project.categories?.length) {
    lines.push(`${c.bold("Categories:")} ${project.categories.join(", ")}`);
  }

  if (project.builtWith?.length) {
    lines.push(`${c.bold("Built with:")} ${project.builtWith.join(", ")}`);
  }

  if (project.launchWeek && project.launchYear) {
    lines.push(`${c.bold("Launched:")} Week ${project.launchWeek} • ${project.launchYear}`);
  }

  const metrics = [
    project.upvotes ? `${project.upvotes} upvotes` : undefined,
    project.comments !== undefined ? `${project.comments} comments` : undefined,
    project.views !== undefined ? `${project.views} views` : undefined,
  ].filter(Boolean);

  if (metrics.length > 0) {
    lines.push(`${c.bold("Metrics:")} ${metrics.join(" • ")}`);
  }

  return lines.join("\n");
}
