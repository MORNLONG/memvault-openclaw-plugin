<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/MORNLONG/memvault-openclaw-plugin/main/assets/memvault-logo.svg" alt="MemVault" width="560" />
</p>

<p align="center">
  AI Agent 的外接大脑。跨会话、跨设备的长期记忆与记忆力增强。
</p>

<p align="center">
  <a href="https://github.com/MORNLONG/memvault-openclaw-plugin/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/MORNLONG/memvault-openclaw-plugin/ci.yml?branch=main&label=CI&style=flat-square"></a>
  <a href="https://mv.mornlong.com/"><img alt="Website" src="https://img.shields.io/badge/website-mv.mornlong.com-ff7357?style=flat-square"></a>
  <img alt="OpenClaw Plugin" src="https://img.shields.io/badge/OpenClaw-plugin-241b16?style=flat-square">
  <img alt="Node 22+" src="https://img.shields.io/badge/node-22%2B-2d8b57?style=flat-square">
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-5e5ce6?style=flat-square"></a>
</p>

## 概览

MemVault 插件 是 OpenClaw 的长期记忆层，上下文压缩导致的记忆问题是AI Agent的致命弱点，接入 MemVault 可以轻松化解。

它为 OpenClaw 提供一个云端持久记忆空间，可以跨越：

- 新会话
- 进程重启
- 设备切换
- 安装后再连接账户

当前这个公开仓库只维护 OpenClaw 插件。OpenClaw 是首个正式落地的
客户端，后续还会扩展到更多 Agent 客户端。

## 用户流程

MemVault 的设计目标是低门槛接入：

1. 安装插件
2. 立即使用 Free 套餐
3. 需要时再通过 `{/mvstatus}` 连接账户
4. 在多台设备之间继续使用同一份长期记忆

## 插件能力

- 在 OpenClaw 构建下一次提示词前自动召回记忆
- 在每轮 Agent 运行结束后自动捕获重要内容并全量保存
- 首次启动自动迁移：
  - `MEMORY.md`
  - `memory/*.md`
  - OpenClaw `active`、`reset`、`deleted` 下的会话归档
- 连接账户后支持跨设备延续
- 提供显式搜索、存储、遗忘工具
- 带有 Free 套餐额度感知，以及连接账户 / 升级引导

## 常见使用场景

- 长对话压缩后，找回项目背景
- 记住端口、配置路径、部署说明和历史决策
- 连接账户后，在另一台设备继续同一个 OpenClaw 项目
- 用语义检索和明确提示找回旧上下文

## 安装

推荐安装方式：

```bash
# 方式 A（ClawHub）
openclaw plugins install clawhub:@mornlong/openclaw-memvault

# 方式 B（npm）
openclaw plugins install @mornlong/openclaw-memvault
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

安装后会发生这些事：

- 插件会在本地创建一个设备身份
- Free 套餐立即可用
- 只有在你需要跨设备延续或更多容量时，才需要连接账户
- `{/mvstatus}` 可以查看套餐、用量和连接状态

`scripts/setup.sh` 会一次性补齐 `plugins.allow` 和 `tools.alsoAllow`，
确保显式的 MemVault 工具能被模型看到。

如果需要一步步验证安装结果，见
[OpenClaw 使用 MemVault 快速开始](./docs/quickstart.zh-CN.md)。

## 命令与工具

### Slash 命令

- `{/mvstatus}`：查看当前套餐、用量和账户连接状态

### Agent 工具

- `memvault_search`
- `memvault_store`
- `memvault_forget`

## 默认配置

插件默认走“安装即用”的配置：

| 选项 | 默认值 | 作用 |
| --- | --- | --- |
| `apiUrl` | `https://api.mv.mornlong.com:8443` | MemVault API 地址 |
| `autoRecall` | `true` | 回复前自动召回记忆 |
| `autoCapture` | `true` | 自动保存重要对话内容 |
| `maxRecallResults` | `5` | 每轮最大召回条数 |
| `recallTimeoutMs` | `3500` | 召回过慢时直接跳过 |
| `scoreThreshold` | `0.4` | 最低相似度阈值 |
| `debug` | `false` | 输出详细调试日志 |

环境变量回退：

| 变量 | 对应配置 |
| --- | --- |
| `MEMVAULT_API_URL` | `apiUrl` |

## 套餐与计费

插件当前可用的容量档位：

| 套餐 | 存储 | 查询 |
| --- | --- | --- |
| Free | 3 MB | 500 / 天 |
| Plus | 20 MB | 5,000 / 天 |
| Pro | 100 MB | 20,000 / 天 |
| Team | 2 GB | 100,000 / 天 |

支付方式包括：

- 中国大陆：`CNY`，使用微信支付或支付宝
- 全球：`USD` 套餐已在价格页展示；全球支付当前标记为暂不可用

价格与账户入口：

- 官网：<https://mv.mornlong.com/>
- 套餐页：<https://mv.mornlong.com/pricing>
- 账户页：<https://mv.mornlong.com/dashboard>

## 仓库结构

```text
.
├── src/                   # TypeScript 源码
├── dist/                  # OpenClaw 使用的构建产物
├── tests/                 # 冒烟测试
├── scripts/setup.sh       # 信任列表初始化脚本
├── openclaw.plugin.json   # OpenClaw 插件清单
└── .github/workflows/     # CI 与发布工作流
```

`dist/` 会保留在仓库里，这样本地路径安装时不需要额外依赖 TypeScript 构建步骤。

## 开发

```bash
npm ci
npm run build
npm test
```

贡献和发布细节见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 相关链接

- 官网：<https://mv.mornlong.com/>
- 公开仓库：<https://github.com/MORNLONG/memvault-openclaw-plugin>
- ClawHub：<https://clawhub.ai/plugins/%40mornlong%2Fopenclaw-memvault>
- 问题反馈：<https://github.com/MORNLONG/memvault-openclaw-plugin/issues>
- 快速开始：[docs/quickstart.zh-CN.md](./docs/quickstart.zh-CN.md)
- FAQ：[docs/faq.zh-CN.md](./docs/faq.zh-CN.md)
- 更新日志：[CHANGELOG.md](./CHANGELOG.md)
- 贡献指南：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 安全策略：[SECURITY.md](./SECURITY.md)

## 许可证

MIT
