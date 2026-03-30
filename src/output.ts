import type { CLIOutput, Provider } from "./models/index.js";

export type OutputFormat = "table" | "json" | "yaml";

export interface OutputOptions {
  json?: boolean;
  yaml?: boolean;
  verbose?: boolean;
}

export function isTTY(): boolean {
  return process.stdout.isTTY ?? false;
}

export function useColors(): boolean {
  if (process.env.NO_COLOR) {
    return false;
  }

  if (process.env.FORCE_COLOR) {
    return true;
  }

  return isTTY();
}

export function getOutputFormat(options: OutputOptions): OutputFormat {
  if (options.json) {
    if (options.yaml) {
      console.error("Warning: both --json and --yaml were specified, using --json");
    }

    return "json";
  }

  if (options.yaml) {
    return "yaml";
  }

  if (!isTTY()) {
    return "json";
  }

  return "table";
}

export function createOutput<T>(
  data: T,
  options: {
    dataSource: Provider;
    providerChain?: Provider[];
    cacheHit?: boolean;
    degraded?: boolean;
    warnings?: string[];
  },
): CLIOutput<T> {
  return {
    ok: true,
    schemaVersion: "1",
    dataSource: options.dataSource,
    providerChain: options.providerChain ?? [options.dataSource],
    fetchedAt: new Date().toISOString(),
    cacheHit: options.cacheHit ?? false,
    degraded: options.degraded ?? false,
    warnings: options.warnings ?? [],
    data,
    error: null,
  };
}

export function createErrorOutput<T>(
  code: string,
  message: string,
  exitCode: number,
  options?: {
    dataSource?: Provider;
    providerChain?: Provider[];
    warnings?: string[];
  },
): CLIOutput<T> {
  const dataSource = options?.dataSource ?? "html";

  return {
    ok: false,
    schemaVersion: "1",
    dataSource,
    providerChain: options?.providerChain ?? [],
    fetchedAt: new Date().toISOString(),
    cacheHit: false,
    degraded: false,
    warnings: options?.warnings ?? [],
    data: null,
    error: {
      code,
      message,
      exitCode,
    },
  };
}
