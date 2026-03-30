import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import yaml from "js-yaml";
import { DEFAULTS } from "./constants.js";
import { ConfigError } from "./errors.js";

export interface Config {
  cache: {
    enabled: boolean;
    dir: string;
    ttl: {
      latest: number;
      project: number;
      categories: number;
      leaderboard: number;
    };
    cacheErrors: boolean;
  };
  request: {
    delay: number;
    timeout: number;
    retries: number;
    userAgent: string;
  };
}

const DEFAULT_CONFIG: Config = {
  cache: {
    enabled: true,
    dir: path.join(os.homedir(), ".peerlist-cli", "cache"),
    ttl: { ...DEFAULTS.cacheTTL },
    cacheErrors: false,
  },
  request: {
    delay: DEFAULTS.delay,
    timeout: DEFAULTS.timeout,
    retries: DEFAULTS.retries,
    userAgent: DEFAULTS.userAgent,
  },
};

export function getConfigDir(): string {
  return path.join(os.homedir(), ".peerlist-cli");
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), "config.yaml");
}

function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

function loadConfigFile(): Partial<Config> {
  const configPath = getConfigPath();

  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const content = fs.readFileSync(configPath, "utf-8");
    return (yaml.load(content) as Partial<Config>) ?? {};
  } catch {
    throw new ConfigError(`Failed to parse config file: ${configPath}`);
  }
}

function loadEnvConfig(): Partial<Config> {
  const env: Partial<Config> = {};

  if (process.env.PL_CACHE_ENABLED) {
    env.cache = {
      ...DEFAULT_CONFIG.cache,
      enabled: process.env.PL_CACHE_ENABLED !== "false",
    };
  }

  if (process.env.PL_CACHE_DIR) {
    env.cache = {
      ...(env.cache ?? DEFAULT_CONFIG.cache),
      dir: process.env.PL_CACHE_DIR,
    };
  }

  if (process.env.PL_REQUEST_DELAY) {
    env.request = {
      ...DEFAULT_CONFIG.request,
      delay: Number.parseInt(process.env.PL_REQUEST_DELAY, 10),
    };
  }

  if (process.env.PL_REQUEST_TIMEOUT) {
    env.request = {
      ...(env.request ?? DEFAULT_CONFIG.request),
      timeout: Number.parseInt(process.env.PL_REQUEST_TIMEOUT, 10),
    };
  }

  return env;
}

function deepMerge(target: Config, ...sources: Partial<Config>[]): Config {
  const result = structuredClone(target);

  for (const source of sources) {
    if (source.cache) {
      result.cache = {
        ...result.cache,
        ...source.cache,
        ttl: {
          ...result.cache.ttl,
          ...source.cache.ttl,
        },
      };
    }

    if (source.request) {
      result.request = {
        ...result.request,
        ...source.request,
      };
    }
  }

  return result;
}

function parseConfigValue(value: string): boolean | number | string {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  return value;
}

export function loadConfig(): Config {
  return deepMerge(DEFAULT_CONFIG, loadConfigFile(), loadEnvConfig());
}

export function setConfigValue(key: string, value: string): void {
  ensureConfigDir();

  const configPath = getConfigPath();
  let config: Record<string, unknown> = {};

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      config = (yaml.load(content) as Record<string, unknown>) ?? {};
    } catch {
      config = {};
    }
  }

  const keys = key.split(".");
  let current = config;

  for (let index = 0; index < keys.length - 1; index += 1) {
    const currentKey = keys[index];

    if (!(currentKey in current) || typeof current[currentKey] !== "object") {
      current[currentKey] = {};
    }

    current = current[currentKey] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = parseConfigValue(value);

  const yamlContent = yaml.dump(config);
  fs.writeFileSync(configPath, yamlContent, { mode: 0o600 });
}

export function getConfigDisplay(config: Config): Record<string, unknown> {
  return structuredClone(config) as unknown as Record<string, unknown>;
}

export function clearCache(config: Config): void {
  const cacheDir = config.cache.dir.replace(/^~/, os.homedir());

  if (!fs.existsSync(cacheDir)) {
    return;
  }

  for (const file of fs.readdirSync(cacheDir)) {
    fs.unlinkSync(path.join(cacheDir, file));
  }
}
