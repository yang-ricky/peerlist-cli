import { createRequire } from "node:module";
import { Command } from "commander";
import { configCommand, latestCommand, projectCommand } from "./commands/index.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

const program = new Command();

program.name("peerlist").description("Unofficial CLI for Peerlist Launchpad").version(pkg.version);

program.addCommand(latestCommand);
program.addCommand(projectCommand);
program.addCommand(configCommand);

program.parse();
