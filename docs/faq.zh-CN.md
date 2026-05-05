# MemVault OpenClaw 插件 FAQ

## MemVault 是什么？

MemVault 是给 AI Agent 用的云端长期记忆层。这个仓库维护的是
OpenClaw 插件。

## 安装前必须注册账号吗？

不需要。安装后 Free 套餐会自动可用。只有需要跨设备延续或更多容量时，
再通过 `{/mvstatus}` 连接账户。

## 怎么验证插件可用？

安装插件、重启 OpenClaw gateway 后，在 OpenClaw 里运行：

```text
{/mvstatus}
```

你应该能看到当前套餐、用量和账户连接状态。

## setup 脚本会改什么？

`scripts/setup.sh` 会更新 OpenClaw 的 `plugins.allow` 和 `tools.alsoAllow`
配置，让插件和显式 MemVault 工具可用。

## MemVault 适合记什么？

最适合保存项目路径、端口、配置细节、部署说明和历史决策。这些信息经常在
长对话压缩后被 Agent 忘掉。

## 插件暴露哪些工具？

- `memvault_search`
- `memvault_store`
- `memvault_forget`
- `{/mvstatus}`

默认开启自动召回和自动捕获。

## 当前额度是多少？

Free 套餐包含 3 MB 存储和 500 次/天查询。更高套餐见官网价格页。

## ClawHub 的 Artifact 显示 “Legacy ZIP” 是什么？还能用吗？

能用。安装命令不变，插件正常可用。

ClawHub 的 “Legacy ZIP” 只是指该版本在插件页展示的产物格式；不影响你
安装和使用插件。

同一页面上，ClawHub 的安全检查（如 ClawScan、静态分析）对该版本显示为
`Benign`。

如果你遇到安装/运行问题，先用 npm 安装作为替代：

```text
openclaw plugins install @mornlong/openclaw-memvault
```

## 全球支付可用吗？

价格页已经展示 USD 套餐，但全球支付当前标记为暂不可用。中国大陆支付使用
微信支付或支付宝。

## 安装失败去哪里反馈？

请开 GitHub issue，并附上：

- OpenClaw 版本
- Node.js 版本
- 安装命令输出
- 如果可用，附上 `{/mvstatus}` 输出
- 相关插件日志，先删掉密钥和私人信息

Issue 入口：<https://github.com/MORNLONG/memvault-openclaw-plugin/issues>

## 问题讨论/验证反馈去哪里发？

建议用 GitHub Discussions：提问、排查安装问题，以及快速反馈“成功/失败 +
你验证了什么”，都放在这里集中追踪。

Discussions：<https://github.com/MORNLONG/memvault-openclaw-plugin/discussions>
