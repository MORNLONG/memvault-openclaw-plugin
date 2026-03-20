import { loadActivation, clearActivation, isActivationExpired, requestActivationCode, pollActivationStatus, buildActivationMessage, } from "./activation.js";
import { getOrCreateDeviceId } from "./device_id.js";
import { MemVaultClient } from "./client.js";
import { parseConfig, memvaultConfigSchema } from "./config.js";
import { buildCaptureHandler } from "./hooks/capture.js";
import { runMigration } from "./hooks/migrate.js";
import { buildRecallHandler } from "./hooks/recall.js";
import { registerForgetTool } from "./tools/forget.js";
import { registerSearchTool } from "./tools/search.js";
import { registerStoreTool } from "./tools/store.js";
const PLAN_LABELS = {
    free: "Free",
    basic: "Plus",
    pro: "Pro",
    team: "Team",
};
function formatQuotaNotice(err) {
    if (err.url) {
        return `[MemVault] ${err.message}\n${err.url}`;
    }
    return `[MemVault] ${err.message}`;
}
export default {
    id: "openclaw-memvault",
    name: "MemVault",
    description: "Persistent long-term memory backed by MemVault vector search",
    kind: "memory",
    configSchema: memvaultConfigSchema,
    register(api) {
        const cfg = parseConfig(api.pluginConfig);
        if (!cfg.apiUrl) {
            api.logger.info("memvault: apiUrl not configured");
            return;
        }
        const deviceId = getOrCreateDeviceId();
        const client = new MemVaultClient(cfg.apiUrl, deviceId, cfg.debug);
        const getClient = () => client;
        let pendingActivation = loadActivation();
        let linkedThisSession = false;
        let sessionKey;
        const getSessionKey = () => sessionKey;
        let pendingNotices = [];
        if (pendingActivation && isActivationExpired(pendingActivation)) {
            clearActivation();
            pendingActivation = null;
            api.logger.info("memvault: cleared expired link code on startup");
        }
        function queueNotice(notice) {
            const normalized = notice.trim();
            if (!normalized || pendingNotices.includes(normalized))
                return;
            pendingNotices.push(normalized);
        }
        async function refreshLinkStatus() {
            if (!pendingActivation)
                return;
            if (isActivationExpired(pendingActivation)) {
                clearActivation();
                pendingActivation = null;
                api.logger.info("memvault: link code expired locally");
                return;
            }
            const result = await pollActivationStatus(cfg.apiUrl, pendingActivation.code, deviceId);
            if (result.status === "linked") {
                pendingActivation = null;
                linkedThisSession = true;
                queueNotice("✅ **MemVault 已连接到账户。**以后新设备也可以通过 `{/mvstatus}` 接入同一份长期记忆。");
                api.logger.info("memvault: device linked to account");
            }
            else if (result.status === "expired") {
                pendingActivation = null;
                api.logger.info("memvault: link code expired");
            }
        }
        async function ensureLinkCode() {
            if (pendingActivation) {
                if (isActivationExpired(pendingActivation)) {
                    clearActivation();
                    pendingActivation = null;
                }
                else {
                    return pendingActivation;
                }
            }
            try {
                const stats = await client.stats();
                if (stats.connection?.linked)
                    return null;
            }
            catch {
                // Ignore status check failure and try requesting directly.
            }
            const activation = await requestActivationCode(cfg.apiUrl, deviceId);
            if (activation) {
                pendingActivation = activation;
                api.logger.info("memvault: link code requested");
            }
            return pendingActivation;
        }
        async function handleQuotaExceeded(err) {
            if (err.action === "connect_account") {
                const activation = await ensureLinkCode();
                if (activation) {
                    const notice = buildActivationMessage(activation, "[MemVault] 当前套餐已用完，新增记忆已暂停。");
                    queueNotice(notice);
                    return notice;
                }
            }
            const notice = formatQuotaNotice(err);
            queueNotice(notice);
            return notice;
        }
        registerStoreTool(api, getClient, deviceId);
        registerSearchTool(api, getClient, cfg);
        registerForgetTool(api, getClient, cfg);
        api.registerCommand({
            name: "mvstatus",
            description: "查看 MemVault 当前套餐、用量和设备连接状态",
            requireAuth: false,
            handler: async () => {
                try {
                    await refreshLinkStatus();
                    const stats = await client.stats();
                    const usage = stats.usage ?? client.lastUsage;
                    const connection = stats.connection ?? client.lastConnection;
                    if (connection)
                        linkedThisSession = Boolean(connection.linked);
                    const linked = Boolean(connection?.linked);
                    const lines = ["📊 **MemVault 状态**", ""];
                    lines.push(`当前套餐：${PLAN_LABELS[connection?.plan ?? "free"] ?? connection?.plan_label ?? "Free"}`);
                    lines.push(`设备状态：${linked ? "已连接到账户" : "未连接账户"}`);
                    lines.push(`记忆条数：${stats.total_memories}`);
                    lines.push(`已存储：${stats.storage_used_mb.toFixed(2)} MB`);
                    if (usage) {
                        const storageUsed = (usage.storage_used_bytes / 1024 / 1024).toFixed(2);
                        const storageLimit = (usage.storage_limit_bytes / 1024 / 1024).toFixed(0);
                        lines.push(`当前额度：${storageUsed} / ${storageLimit} MB`);
                        lines.push(`今日查询：${usage.queries_today} / ${usage.queries_limit}`);
                        if (usage.is_read_only) {
                            lines.push("\n⚠️ 当前套餐额度已触顶，新增写入会暂停。");
                        }
                    }
                    if (!linked) {
                        const activation = pendingActivation ?? (await ensureLinkCode());
                        lines.push("\n连接提示：这台设备还没有连接到账户。");
                        if (activation) {
                            lines.push(`连接码：${activation.code}`);
                            lines.push(`连接入口：${activation.connect_url}`);
                        }
                        lines.push("先把当前安装连接到账户，之后新设备就能继续同一份记忆。");
                    }
                    lines.push("\n网站查看：https://mv.mornlong.com/dashboard");
                    return { text: lines.join("\n") };
                }
                catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    return { text: `❌ 无法获取状态：${msg}`, isError: true };
                }
            },
        });
        const alsoAllow = api.config?.tools;
        const list = Array.isArray(alsoAllow?.alsoAllow)
            ? alsoAllow.alsoAllow
            : [];
        if (!list.includes("openclaw-memvault")) {
            api.logger.warn('memvault: tools.alsoAllow does not include "openclaw-memvault". ' +
                "The model will NOT see memvault_* tools. " +
                'Fix: openclaw config set tools.alsoAllow \'["openclaw-memvault"]\' ' +
                "or run: bash <plugin-dir>/scripts/setup.sh");
        }
        if (cfg.autoRecall) {
            const recallHandler = buildRecallHandler(getClient, cfg);
            api.on("before_prompt_build", async (event, ctx) => {
                if (ctx.sessionKey)
                    sessionKey = ctx.sessionKey;
                await refreshLinkStatus();
                return recallHandler(event);
            });
        }
        if (cfg.autoCapture) {
            api.on("agent_end", buildCaptureHandler(getClient, cfg, getSessionKey, deviceId, handleQuotaExceeded, queueNotice));
        }
        api.on("message_sending", (event) => {
            if (pendingNotices.length === 0)
                return;
            const notice = pendingNotices.join("\n\n---\n");
            pendingNotices = [];
            return { content: `${event.content}\n\n---\n${notice}` };
        });
        api.registerService({
            id: "openclaw-memvault",
            start: async () => {
                api.logger.info(`memvault: connected to ${cfg.apiUrl} with hidden device identity`);
                await runMigration(client, cfg, api.logger, deviceId);
            },
            stop: () => {
                api.logger.info("memvault: stopped");
            },
        });
    },
};
