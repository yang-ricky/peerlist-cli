import { Command } from "commander";
import { CLIError, ExitCode } from "../errors.js";
import { getOutputFormat } from "../output.js";
import { parseProjectRef } from "../utils/project-ref.js";
import { handleCommandError } from "./common.js";

export const projectCommand = new Command("project")
  .description("Get project details")
  .argument("<ref>", "Project ref (username/project-slug or full URL)")
  .option("--json", "Output as JSON")
  .option("--yaml", "Output as YAML")
  .option("-v, --verbose", "Verbose output")
  .action(async (ref: string, options) => {
    try {
      parseProjectRef(ref);

      if (getOutputFormat(options) === "table") {
        console.log("`pl project` is not implemented yet.");
        console.log("Next step: wire project detail parser + backend.");
      } else {
        throw new CLIError(
          "`pl project` is not implemented yet",
          ExitCode.GeneralError,
          "not_implemented",
        );
      }
    } catch (error) {
      handleCommandError(error, options);
    }
  });
