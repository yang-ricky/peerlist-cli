<div align="center">
  <h1>peerlist-cli</h1>
  <p><strong>Browse Peerlist Launchpad from your terminal.</strong></p>
  <p>No login required · Public pages only · JSON/YAML output · Project refs or full URLs</p>
  <p>
    <a href="./README.zh-CN.md">中文文档</a> ·
    <a href="https://www.npmjs.com/package/peerlist-cli">npm</a>
  </p>
  <p>
    <img alt="npm version" src="https://img.shields.io/npm/v/peerlist-cli">
    <img alt="node version" src="https://img.shields.io/node/v/peerlist-cli">
    <img alt="license" src="https://img.shields.io/npm/l/peerlist-cli">
  </p>
</div>

A CLI for public [Peerlist](https://peerlist.io) Launchpad data.

Read the current week's launches, inspect project pages, and work with machine-readable JSON or YAML directly from your shell.

No login, token, or API key is required.

Current `v0.1` scope: `latest`, `project`, and `config`.

## Install

```bash
npm install -g peerlist-cli
```

Requires **Node.js >= 20**.

After installation:

```bash
pl --help
peerlist --help
```

## Quick Start

```bash
pl latest
pl latest --limit 5 --json
pl latest --week 14 --year 2026 --yaml
pl project yossisegev/launching-today
pl project https://peerlist.io/yossisegev/project/launching-today --json
pl config show
```

## Commands

| Command | Description |
|---|---|
| `pl latest` | Show Launchpad projects for the current or specified week |
| `pl project <ref>` | Show a project page using `username/project-slug` or a full URL |
| `pl config show` | Show resolved config values |
| `pl config set <key> <value>` | Update config |
| `pl config cache-clear` | Clear local cache |

## Output

| Scenario | Default |
|---|---|
| Interactive terminal | Human-readable table / text |
| Pipe / redirect | JSON |
| `--json` | JSON |
| `--yaml` | YAML |

The CLI respects `NO_COLOR` and `FORCE_COLOR`.

Structured output includes metadata such as:

- `schemaVersion`
- `dataSource`
- `providerChain`
- `fetchedAt`
- `cacheHit`
- `degraded`
- `warnings`

## Project Refs

`pl project <ref>` accepts:

```bash
pl project yossisegev/launching-today
pl project @yossisegev/launching-today
pl project https://peerlist.io/yossisegev/project/launching-today
```

All forms normalize to the same internal project ref: `username/project-slug`.

## Configuration

Configuration is optional. The default setup works out of the box.

If you want to tweak behavior:

```bash
pl config show
pl config set request.retries 5
pl config set request.delay 2500
pl config set cache.enabled false
pl config cache-clear
```

The config file lives at:

```bash
~/.peerlist-cli/config.yaml
```

You can also override settings with environment variables such as:

- `PL_CACHE_ENABLED=false`
- `PL_CACHE_DIR=/tmp/peerlist-cli-cache`
- `PL_REQUEST_DELAY=2500`
- `PL_REQUEST_TIMEOUT=15000`

## Notes

- This project uses public Peerlist pages only.
- The CLI does not rely on an official public Peerlist API. It reads page hydration data first and falls back to HTML parsing.
- Scraper-derived fields are best-effort and may change if Peerlist updates page structure.
- `latest --category`, `categories`, `doctor`, and `leaderboard` are not part of `v0.1`.
- This is an unofficial project and is not affiliated with Peerlist.

## License

[MIT](LICENSE)
