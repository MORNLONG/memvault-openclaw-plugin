import { createHash } from "node:crypto"
import { QuotaExceededError, type MemVaultClient } from "../client.ts"
import type { MemVaultConfig } from "../config.ts"
import { checkAndEmitWarning } from "../usage_state.ts"

const SKIPPED_PROVIDERS = ["exec-event", "cron-event", "heartbeat"]

type TextBlock = { type?: string; text?: string }
type AgentMessage = {
	role?: string
	content?: unknown
	timestamp?: number
	provider?: string
	model?: string
	api?: string
}

function toUnixSeconds(value: unknown): number | undefined {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return
	return value > 1_000_000_000_000 ? Math.floor(value / 1000) : Math.floor(value)
}

function extractVisibleText(role: string | undefined, content: unknown): string {
	if (typeof content === "string") return content.trim()
	if (!Array.isArray(content)) return ""

	const parts: string[] = []
	for (const item of content as TextBlock[]) {
		if (item?.type !== "text") continue
		let text = item.text ?? ""
		if (role === "assistant") {
			text = text.replace(/<think>[\s\S]*?<\/think>/g, "")
			text = text.replace(/<\/?final>/g, "")
			text = text.replace(/\[\[reply_to_\w+\]\]\s*/g, "")
		}
		text = text.trim()
		if (text) parts.push(text)
	}
	return parts.join("\n").trim()
}

function buildEventId(parts: Array<string | number | undefined>): string {
	const h = createHash("sha256")
	for (const part of parts) {
		h.update(String(part ?? ""))
		h.update("\u241f")
	}
	return `turn_${h.digest("hex").slice(0, 32)}`
}

function buildLiveCaptureProvenance(
	messages: unknown[],
	deviceId: string,
	sessionKey: string | undefined,
	ctx: Record<string, unknown>,
): { eventId: string; timestamp: number; metadata: Record<string, unknown> } | null {
	const typed = messages.filter(Boolean) as AgentMessage[]
	let assistant: AgentMessage | null = null
	let assistantText = ""

	for (let i = typed.length - 1; i >= 0; i--) {
		const candidate = typed[i]
		if (candidate?.role !== "assistant") continue
		const visible = extractVisibleText(candidate.role, candidate.content)
		if (!visible) continue
		assistant = candidate
		assistantText = visible
		break
	}
	if (!assistant) return null

	let user: AgentMessage | null = null
	let userText = ""
	const assistantIndex = typed.lastIndexOf(assistant)
	for (let i = assistantIndex - 1; i >= 0; i--) {
		const candidate = typed[i]
		if (candidate?.role !== "user") continue
		const visible = extractVisibleText(candidate.role, candidate.content)
		if (!visible) continue
		user = candidate
		userText = visible
		break
	}

	const assistantTs = toUnixSeconds(assistant.timestamp) ?? Math.floor(Date.now() / 1000)
	const userTs = toUnixSeconds(user?.timestamp)
	const messageProvider =
		typeof ctx.messageProvider === "string" ? ctx.messageProvider : undefined
	const channelId = typeof ctx.channelId === "string" ? ctx.channelId : undefined
	const trigger = typeof ctx.trigger === "string" ? ctx.trigger : undefined

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
	])

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
	}
}

export function buildCaptureHandler(
	getClient: () => MemVaultClient,
	cfg: MemVaultConfig,
	getSessionKey: () => string | undefined,
	deviceId: string,
	onQuotaExceeded?: (err: QuotaExceededError) => Promise<string | null>,
	queueNotice?: (notice: string) => void,
) {
	return async (
		event: Record<string, unknown>,
		ctx: Record<string, unknown>,
	) => {
		const provider = ctx.messageProvider as string
		if (SKIPPED_PROVIDERS.includes(provider)) return
		if (
			!event.success ||
			!Array.isArray(event.messages) ||
			event.messages.length === 0
		)
			return

		try {
			const sessionKey =
				getSessionKey() ?? (typeof ctx.sessionKey === "string" ? ctx.sessionKey : undefined)
			const provenance = buildLiveCaptureProvenance(
				event.messages,
				deviceId,
				sessionKey,
				ctx,
			)
			const result = await getClient().ingest(event.messages, {
				agent_id: "openclaw",
				session_id: sessionKey,
				source: "openclaw_auto",
				timestamp: provenance?.timestamp,
				event_id: provenance?.eventId,
				metadata: provenance?.metadata,
			})

			// Check usage warning after successful ingest
			const warning = checkAndEmitWarning(getClient().lastUsage)
			if (warning) {
				queueNotice?.(warning)
				if (cfg.debug) console.log(`[memvault] ${warning}`)
			}

			if (cfg.debug) {
				if (result.stored) {
					console.log(
						`[memvault] capture: stored ${result.content_length} chars`,
					)
				} else {
					console.log(
						`[memvault] capture: skipped (${result.skipped_reason})`,
					)
				}
			}
		} catch (err) {
			if (err instanceof QuotaExceededError) {
				if (cfg.debug) console.log("[memvault] capture: quota exceeded")
				if (onQuotaExceeded) await onQuotaExceeded(err)
				else queueNotice?.(err.message)
				return
			}
			const msg = err instanceof Error ? err.message : String(err)
			if (msg.includes("circuit breaker")) {
				if (cfg.debug)
					console.log("[memvault] capture: skipped (server unreachable)")
			} else {
				console.error("[memvault] capture failed:", err)
			}
		}
	}
}
