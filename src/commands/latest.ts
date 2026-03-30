import { Command } from "commander";
import { PeerlistBackend } from "../backends/index.js";
import { FileCache } from "../cache/index.js";
import { loadConfig } from "../config.js";
import { formatLaunchListTable } from "../formatter.js";
import { createOutput, getOutputFormat } from "../output.js";
import { serialize } from "../serializer.js";
import { handleCommandError, parsePositiveInteger } from "./common.js";

export const latestCommand = new Command("latest")
  .description("Get current week Launchpad projects")
  .option("-l, --limit <n>", "Limit number of results", "20")
  .option("-w, --week <n>", "Specify week number")
  .option("-y, --year <n>", "Specify year")
  .option("--json", "Output as JSON")
  .option("--yaml", "Output as YAML")
  .option("-v, --verbose", "Verbose output")
  .action(async (options) => {
    try {
      const config = loadConfig();
      const backend = new PeerlistBackend(new FileCache(config.cache.dir), {
        delay: config.request.delay,
        timeout: config.request.timeout,
        retries: config.request.retries,
        userAgent: config.request.userAgent,
        cacheTTL: {
          latest: config.cache.ttl.latest,
          project: config.cache.ttl.project,
        },
      });
      const limit = parsePositiveInteger(options.limit, "limit");
      const week = options.week ? parsePositiveInteger(options.week, "week") : undefined;
      const year = options.year ? parsePositiveInteger(options.year, "year") : undefined;
      const result = await backend.getLatest({ limit, week, year });
      const format = getOutputFormat(options);

      if (format === "table") {
        console.log(formatLaunchListTable(result.data));
      } else {
        const output = createOutput(result.data, result);
        console.log(serialize(output, format));
      }
    } catch (error) {
      handleCommandError(error, options);
    }
  });
