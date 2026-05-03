# OpenClaw 使用 MemVault 快速开始

MemVault 为 OpenClaw 增加云端长期记忆层。用这份指南完成安装，并验证记忆能力是否可用。

## 1. 安装

```bash
# 方式 A（ClawHub）
openclaw plugins install clawhub:@mornlong/openclaw-memvault

# 方式 B（npm）
openclaw plugins install @mornlong/openclaw-memvault

# 然后（两种安装方式都需要执行一次）
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

`setup.sh` 会更新 OpenClaw 的 allow list，让 MemVault 工具能被模型看到。

## 2. 检查状态

在 OpenClaw 里运行：

```text
{/mvstatus}
```

你应该能看到当前套餐、用量和账户连接状态。

安装后 Free 套餐会自动可用。只有需要跨设备延续或更多容量时，才需要连接账户。

## 3. 试一个召回场景

先告诉 OpenClaw 一个以后会用到的项目细节，例如：

```text
记住这个项目的前端本地开发服务使用 5173 端口。
```

继续工作几轮后，再问：

```text
这个项目的前端开发服务端口是多少？
```

MemVault 可以帮助 OpenClaw 召回已经保存的项目细节。连接账户后，这些记忆可以跨设备延续。

## 工具

插件提供：

- 回复前自动召回
- Agent 运行后自动捕获
- `memvault_search`
- `memvault_store`
- `memvault_forget`
- `{/mvstatus}`

## 排查

- 如果找不到 `{/mvstatus}`，请重新执行 `setup.sh` 并重启 gateway：

```bash
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart
```

## 分享（可复制）

如果你觉得有用，可以把“安装 + 验证”片段分享出去：

```text
MemVault 给 OpenClaw 增加云端长期记忆。

openclaw plugins install clawhub:@mornlong/openclaw-memvault
bash ~/.openclaw/extensions/openclaw-memvault/scripts/setup.sh
openclaw gateway restart

{/mvstatus}
```

## 相关链接

- 官网：<https://mv.mornlong.com/>
- 套餐：<https://mv.mornlong.com/pricing>
- 问题反馈：<https://github.com/MORNLONG/memvault-openclaw-plugin/issues>
