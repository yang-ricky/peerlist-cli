import yaml from "js-yaml";
import type { CLIOutput } from "./models/index.js";

export function toJSON<T>(output: CLIOutput<T>): string {
  return JSON.stringify(output, null, 2);
}

export function toYAML<T>(output: CLIOutput<T>): string {
  return yaml.dump(output, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });
}

export function serialize<T>(output: CLIOutput<T>, format: "json" | "yaml"): string {
  if (format === "yaml") {
    return toYAML(output);
  }

  return toJSON(output);
}
