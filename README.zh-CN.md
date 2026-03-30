<div align="center">
  <h1>peerlist-cli</h1>
  <p><strong>在终端里浏览 Peerlist Launchpad。</strong></p>
  <p>无需登录 · 仅使用公开页面 · 支持 JSON/YAML 输出 · 支持项目引用和完整 URL</p>
  <p>
    <a href="./README.md">English</a> ·
    <a href="https://www.npmjs.com/package/peerlist-cli">npm</a>
  </p>
  <p>
    <img alt="npm version" src="https://img.shields.io/npm/v/peerlist-cli">
    <img alt="node version" src="https://img.shields.io/node/v/peerlist-cli">
    <img alt="license" src="https://img.shields.io/npm/l/peerlist-cli">
  </p>
</div>

一个面向公开 [Peerlist](https://peerlist.io) Launchpad 数据的命令行工具。

你可以直接在 shell 里读取当前周项目、查看单个项目详情，并输出为终端友好的文本、JSON 或 YAML。

不需要登录、Token 或 API Key。

当前 `v0.1` 范围只包含：`latest`、`project`、`config`。

## 安装

```bash
npm install -g peerlist-cli
```

需要 **Node.js >= 20**。

安装后可以这样用：

```bash
pl --help
peerlist --help
```

## 快速开始

```bash
pl latest
pl latest --limit 5 --json
pl latest --week 14 --year 2026 --yaml
pl project yossisegev/launching-today
pl project https://peerlist.io/yossisegev/project/launching-today --json
pl config show
```

## 命令

| 命令 | 说明 |
|---|---|
| `pl latest` | 查看当前周或指定周的 Launchpad 项目 |
| `pl project <ref>` | 用 `username/project-slug` 或完整 URL 查看项目详情 |
| `pl config show` | 显示当前生效配置 |
| `pl config set <key> <value>` | 更新配置 |
| `pl config cache-clear` | 清空本地缓存 |

## 输出格式

| 场景 | 默认输出 |
|---|---|
| 交互式终端 | 人类可读的表格 / 文本 |
| 管道 / 重定向 | JSON |
| `--json` | JSON |
| `--yaml` | YAML |

CLI 会遵守 `NO_COLOR` 和 `FORCE_COLOR`。

结构化输出会包含这些元信息：

- `schemaVersion`
- `dataSource`
- `providerChain`
- `fetchedAt`
- `cacheHit`
- `degraded`
- `warnings`

## 项目引用格式

`pl project <ref>` 支持以下输入：

```bash
pl project yossisegev/launching-today
pl project @yossisegev/launching-today
pl project https://peerlist.io/yossisegev/project/launching-today
```

这些写法最终都会被规范化成同一个内部引用：`username/project-slug`。

## 配置

配置不是必需的，默认就能直接使用。

如果你想调整行为：

```bash
pl config show
pl config set request.retries 5
pl config set request.delay 2500
pl config set cache.enabled false
pl config cache-clear
```

配置文件路径：

```bash
~/.peerlist-cli/config.yaml
```

也可以通过环境变量覆盖，例如：

- `PL_CACHE_ENABLED=false`
- `PL_CACHE_DIR=/tmp/peerlist-cli-cache`
- `PL_REQUEST_DELAY=2500`
- `PL_REQUEST_TIMEOUT=15000`

## 说明

- 当前版本只使用 Peerlist 的公开页面。
- 当前实现不依赖官方公开 API，而是优先读取页面 hydration 数据，失败时再回退到 HTML 解析。
- 依赖抓取得到的字段都属于 best-effort，Peerlist 页面结构变化时可能需要更新。
- `latest --category`、`categories`、`doctor`、`leaderboard` 还不属于 `v0.1`。
- 这是一个非官方项目，与 Peerlist 无官方关联。

## License

[MIT](LICENSE)
