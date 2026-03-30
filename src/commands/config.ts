import { Command } from "commander";
import { clearCache, getConfigDisplay, loadConfig, setConfigValue } from "../config.js";

export const configCommand = new Command("config").description("Manage CLI configuration");

configCommand
  .command("show")
  .description("Show current configuration")
  .action(() => {
    console.log(JSON.stringify(getConfigDisplay(loadConfig()), null, 2));
  });

configCommand
  .command("set")
  .description("Set a configuration value")
  .argument("<key>", "Configuration key")
  .argument("<value>", "Configuration value")
  .action((key: string, value: string) => {
    setConfigValue(key, value);
    console.log(`Set ${key} = ${value}`);
  });

configCommand
  .command("cache-clear")
  .description("Clear local cache")
  .action(() => {
    clearCache(loadConfig());
    console.log("Cache cleared successfully");
  });
