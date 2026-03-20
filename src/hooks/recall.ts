import { QuotaExceededError, type MemVaultClient } from "../client.ts"
import type { MemVaultConfig } from "../config.ts"
import { checkAndEmitWarning } from "../usage_state.ts"

const DEDUP_TTL_MS = 10_000 // 10s window to deduplicate identical queries
const MEMVAULT_CONTEXT_RE = /<memvault-context>[\s\S]*?<\/memvault-context>/gi
const METADATA_BLOCK_RE =
	/(?:^|\n)(?:Conversation info|Sender) \(untrusted metadata\):\s*```json[\s\S]*?```/gi
const STARTUP_PROMPT_RE =
	/A new session was started via \/new or \/reset[\s\S]*?Do not mention internal steps, files, tools, or reasoning\./i
const CURRENT_TIME_RE = /(?:^|\n)Current time:[^\n]*/gi
const COMMAND_ONLY_RE = /^\s*(?:\{\/|\/)[a-z0-9_-]+\s*$/i

function normalizeWhitespace(text: string): string {
	return text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim()
}

function extractRecallQuery(rawPrompt: string): string | null {
	if (STARTUP_PROMPT_RE.test(rawPrompt)) return null

	let cleaned = rawPrompt
		.replace(MEMVAULT_CONTEXT_RE, "\n")
		.replace(METADATA_BLOCK_RE, "\n")
		.replace(CURRENT_TIME_RE, "\n")
	cleaned = normalizeWhitespace(cleaned)
	if (!cleaned) return null

	const blocks = cleaned
		.split(/\n\s*\n/)
		.map((part) => normalizeWhitespace(part))
		.filter(Boolean)

	for (let i = blocks.length - 1; i >= 0; i--) {
		const block = blocks[i]
		if (
			block.includes("```") ||
			block.startsWith("The following is background context") ||
			block.startsWith("Do not proactively bring up memories.") ||
			block.startsWith("## Relevant Memories")
		) {
			continue
		}
		if (COMMAND_ONLY_RE.test(block)) return null
		if (block.length >= 5) return block.slice(-1200)
	}

	const fallback = cleaned.slice(-1200).trim()
	if (!fallback || COMMAND_ONLY_RE.test(fallback)) return null
	return fallback
}

export function buildRecallHandler(
	getClient: () => MemVaultClient,
	cfg: MemVaultConfig,
) {
	let lastQuery = ""
	let lastQueryTime = 0
	let lastResult: { prependContext: string } | undefined
	let pendingQuery = ""
	let pendingResult: Promise<{ prependContext: string } | undefined> | null = null

	return async (event: Record<string, unknown>) => {
		const rawPrompt = event.prompt as string | undefined
		if (!rawPrompt || rawPrompt.length < 5) return
		const query = extractRecallQuery(rawPrompt)
		if (!query) {
			if (cfg.debug) console.log("[memvault] recall: skipped (no meaningful user query)")
			return
		}

		// Deduplicate repeated prompt builds for the same user turn.
		const now = Date.now()
		if (query === lastQuery && now - lastQueryTime < DEDUP_TTL_MS) {
			if (cfg.debug) console.log("[memvault] recall: dedup hit")
			return lastResult
		}
		if (query === pendingQuery && pendingResult) {
			if (cfg.debug) console.log("[memvault] recall: reusing in-flight request")
			return pendingResult
		}

		const currentQuery = query
		pendingQuery = currentQuery
		const currentRequest = (async () => {
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), cfg.recallTimeoutMs)
			const cl = getClient()
			try {
				const result = await cl.recall(
					currentQuery,
					cfg.maxRecallResults,
					cfg.scoreThreshold,
					controller.signal,
				)

				lastQuery = currentQuery
				lastQueryTime = Date.now()

				// Build context, prepend usage warning if threshold crossed
				const warning = checkAndEmitWarning(cl.lastUsage)
				const parts: string[] = []
				if (warning) parts.push(warning)
				if (result.context) parts.push(result.context)

				if (parts.length === 0) {
					if (cfg.debug) console.log("[memvault] recall: no relevant memories")
					lastResult = undefined
					return
				}

				if (cfg.debug) {
					console.log(
						`[memvault] recall: injecting ${result.result_count} memories`,
					)
				}

				lastResult = { prependContext: parts.join("\n\n") }
				return lastResult
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err)
				if (err instanceof Error && err.name === "AbortError") {
					if (cfg.debug) {
						console.log(
							`[memvault] recall: skipped (timeout after ${cfg.recallTimeoutMs}ms)`,
						)
					}
				} else if (msg.includes("circuit breaker")) {
					if (cfg.debug) console.log("[memvault] recall: skipped (server unreachable)")
				} else if (!(err instanceof QuotaExceededError)) {
					console.error("[memvault] recall failed:", err)
				}
				return
			} finally {
				clearTimeout(timeoutId)
			}
		})()
		pendingResult = currentRequest

		try {
			return await currentRequest
		} finally {
			if (pendingResult === currentRequest) {
				pendingQuery = ""
				pendingResult = null
			}
		}
	}
}
