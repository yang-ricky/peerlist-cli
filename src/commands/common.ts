import type { OutputOptions } from "../output.js";
import { CLIError, ExitCode } from "../errors.js";
import { createErrorOutput, getOutputFormat } from "../output.js";
import { serialize } from "../serializer.js";

export function parsePositiveInteger(value: string, fieldName: string): number {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new CLIError(
      `${fieldName} must be a positive integer`,
      ExitCode.ArgumentError,
      "argument_error",
    );
  }

  return parsed;
}

export function handleCommandError(error: unknown, options: OutputOptions): never {
  const cliError =
    error instanceof CLIError
      ? error
      : new CLIError(
          error instanceof Error ? error.message : "Unknown error",
          ExitCode.GeneralError,
          "general_error",
        );

  const format = getOutputFormat(options);

  if (format === "table") {
    console.error(`Error: ${cliError.message}`);
  } else {
    const output = createErrorOutput(cliError.code, cliError.message, cliError.exitCode);
    console.log(serialize(output, format));
  }

  process.exit(cliError.exitCode);
}
