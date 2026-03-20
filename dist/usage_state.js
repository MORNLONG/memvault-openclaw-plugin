import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
const STATE_FILE = ".memvault-usage-state.json";
function getPluginDataDir() {
    return (process.env.OPENCLAW_DATA_DIR ??
        join(process.env.HOME ?? "/root", ".openclaw", "extensions", "openclaw-memvault"));
}
function readState() {
    const filePath = join(getPluginDataDir(), STATE_FILE);
    if (!existsSync(filePath)) {
        return { warn_80_fired: false, warn_100_fired: false };
    }
    try {
        return JSON.parse(readFileSync(filePath, "utf-8"));
    }
    catch {
        return { warn_80_fired: false, warn_100_fired: false };
    }
}
function writeState(state) {
    const dir = getPluginDataDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, STATE_FILE), JSON.stringify(state), "utf-8");
}
/**
 * Check usage levels and return a one-shot warning message if a threshold
 * was just crossed. Returns null if no warning is needed.
 *
 * Each threshold (80%, 100%) fires exactly once — the flag is persisted
 * to disk so it survives plugin restarts.
 *
 * @param activationMessage - If provided, appended to the 100% warning
 *   (typically the activation code instructions).
 */
export function checkAndEmitWarning(usage, activationMessage) {
    if (!usage)
        return null;
    const maxPct = Math.max(usage.storage_pct, usage.queries_pct);
    const state = readState();
    if (maxPct >= 1.0 && !state.warn_100_fired) {
        writeState({ ...state, warn_100_fired: true });
        if (activationMessage) {
            return activationMessage;
        }
        return ("[MemVault] 当前套餐已用完，新增记忆暂时停止写入。\n" +
            "输入 `{/mvstatus}` 获取连接码，连接到账户后即可继续扩容或升级。\n" +
            "输入 `{/mvstatus}` 查看当前状态。");
    }
    if (maxPct >= 0.8 && !state.warn_80_fired) {
        writeState({ ...state, warn_80_fired: true });
        return ("[MemVault] Free 套餐已用约 80%，当前仍可继续使用。\n" +
            "如果你打算换设备，建议先输入 `{/mvstatus}` 把当前安装连接到账户。\n" +
            "输入 `{/mvstatus}` 查看当前状态。");
    }
    return null;
}
