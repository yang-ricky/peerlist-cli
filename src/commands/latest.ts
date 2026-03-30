import { Command } from "commander";
import { CLIError, ExitCode } from "../errors.js";
import { getOutputFormat } from "../output.js";
import { resolveWeek } from "../utils/week.js";
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
      parsePositiveInteger(options.limit, "limit");
      resolveWeek({
        week: options.week,
        year: options.year,
      });

      if (getOutputFormat(options) === "table") {
        console.log("`pl latest` is not implemented yet.");
        console.log("Next step: wire parser + backend for Launchpad week pages.");
      } else {
        throw new CLIError(
          "`pl latest` is not implemented yet",
          ExitCode.GeneralError,
          "not_implemented",
        );
      }
    } catch (error) {
      handleCommandError(error, options);
    }
  });
