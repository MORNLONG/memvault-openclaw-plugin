import { createHash } from "node:crypto";
import { QuotaExceededError } from "../client.js";
import { checkAndEmitWarning } from "../usage_state.js";
const SKIPPED_PROVIDERS = ["exec-event", "cron-event", "heartbeat"];
function toUnixSeconds(value) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
        return;
    return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
}
function extractVisibleText(role, content) {
    if (typeof content === "string")
        return content.trim();
    if (!Array.isArray(content))
        return "";
    const parts = [];
    for (const item of content) {
        if (item?.type !== "text")
            continue;
        let text = item.text ?? "";
        if (role === "assistant") {
            text = text.replace(/<think>[\s\S]*?<\/think>/g, "");
            text = text.replace(/<\/?final>/g, "");
            text = text.replace(/\[\[reply_to_\w+\]\]\s*/g, "");
        }
        text = text.trim();
        if (text)
            parts.push(text);
    }
    return parts.join("\n").trim();
}
function buildEventId(parts) {
    const h = createHash("sha256");
    for (const part of parts) {
        h.update(String(part ?? ""));
        h.update("\u241f");
    }
    return `turn_${h.digest("hex").slice(0, 32)}`;
}
function buildLiveCaptureProvenance(messages, deviceId, sessionKey, ctx) {
    const typed = messages.filter(Boolean);
    let assistant = null;
    let assistantText = "";
    for (let i = typed.length - 1; i >= 0; i--) {
        const candidate = typed[i];
        if (candidate?.role !== "assistant")
            continue;
        const visible = extractVisibleText(candidate.role, candidate.content);
        if (!visible)
            continue;
        assistant = candidate;
        assistantText = visible;
        break;
    }
    if (!assistant)
        return null;
    let user = null;
    let userText = "";
    const assistantIndex = typed.lastIndexOf(assistant);
    for (let i = assistantIndex - 1; i >= 0; i--) {
        const candidate = typed[i];
        if (candidate?.role !== "user")
            continue;
        const visible = extractVisibleText(candidate.role, candidate.content);
        if (!visible)
            continue;
        user = candidate;
        userText = visible;
        break;
    }
    const assistantTs = toUnixSeconds(assistant.timestamp) ?? Math.floor(Date.now() / 1000);
    const userTs = toUnixSeconds(user?.timestamp);
    const messageProvider = typeof ctx.messageProvider === "string" ? ctx.messageProvider : undefined;
    const channelId = typeof ctx.channelId === "string" ? ctx.channelId : undefined;
    const trigger = typeof ctx.trigger === "string" ? ctx.trigger : undefined;
    const eventId = buildEventId([
        "live-turn",
        deviceId,
        sessionKey,
        messageProvider,
        channelId,
        userTs,
        assistantTs,
        userText,
        assistantText,
    ]);
    return {
        eventId,
        timestamp: assistantTs,
        metadata: {
            source_kind: "live_capture",
            source_ref: sessionKey ?? "live",
            device_id: deviceId,
            message_provider: messageProvider,
            channel: channelId ?? messageProvider,
            trigger,
            user_timestamp: userTs,
            assistant_timestamp: assistantTs,
            model_provider: assistant.provider,
            model_id: assistant.model,
            model_api: assistant.api,
        },
    };
}
export function buildCaptureHandler(getClient, cfg, getSessionKey, deviceId, onQuotaExceeded, queueNotice) {
    return async (event, ctx) => {
        const provider = ctx.messageProvider;
        if (SKIPPED_PROVIDERS.includes(provider))
            return;
        if (!event.success ||
            !Array.isArray(event.messages) ||
            event.messages.length === 0)
            return;
        try {
            const sessionKey = getSessionKey() ?? (typeof ctx.sessionKey === "string" ? ctx.sessionKey : undefined);
            const provenance = buildLiveCaptureProvenance(event.messages, deviceId, sessionKey, ctx);
            const result = await getClient().ingest(event.messages, {
                agent_id: "openclaw",
                session_id: sessionKey,
                source: "openclaw_auto",
                timestamp: provenance?.timestamp,
                event_id: provenance?.eventId,
                metadata: provenance?.metadata,
            });
            // Check usage warning after successful ingest
            const warning = checkAndEmitWarning(getClient().lastUsage);
            if (warning) {
                queueNotice?.(warning);
                if (cfg.debug)
                    console.log(`[memvault] ${warning}`);
            }
            if (cfg.debug) {
                if (result.stored) {
                    console.log(`[memvault] capture: stored ${result.content_length} chars`);
                }
                else {
                    console.log(`[memvault] capture: skipped (${result.skipped_reason})`);
                }
            }
        }
        catch (err) {
            if (err instanceof QuotaExceededError) {
                if (cfg.debug)
                    console.log("[memvault] capture: quota exceeded");
                if (onQuotaExceeded)
                    await onQuotaExceeded(err);
                else
                    queueNotice?.(err.message);
                return;
            }
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes("circuit breaker")) {
                if (cfg.debug)
                    console.log("[memvault] capture: skipped (server unreachable)");
            }
            else {
                console.error("[memvault] capture failed:", err);
            }
        }
    };
}
