import { Command } from "commander";
import { PeerlistBackend } from "../backends/index.js";
import { FileCache } from "../cache/index.js";
import { loadConfig } from "../config.js";
import { formatProjectDetail } from "../formatter.js";
import { createOutput, getOutputFormat } from "../output.js";
import { serialize } from "../serializer.js";
import { handleCommandError } from "./common.js";

export const projectCommand = new Command("project")
  .description("Get project details")
  .argument("<ref>", "Project ref (username/project-slug or full URL)")
  .option("--json", "Output as JSON")
  .option("--yaml", "Output as YAML")
  .option("-v, --verbose", "Verbose output")
  .action(async (ref: string, options) => {
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
      const result = await backend.getProject(ref);
      const format = getOutputFormat(options);

      if (format === "table") {
        console.log(formatProjectDetail(result.data));
      } else {
        const output = createOutput(result.data, result);
        console.log(serialize(output, format));
      }
    } catch (error) {
      handleCommandError(error, options);
    }
  });
