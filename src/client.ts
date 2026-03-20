import type { UsageInfo } from "./usage_state.ts"

export type MemVaultMemory = {
	id: string
	content: string
	score?: number
	role?: string
	session_id?: string | null
	agent_id?: string
	tags?: string[]
	importance?: number
	timestamp?: number
	metadata?: Record<string, unknown> | null
}

export type SearchResult = {
	id: string
	content: string
	score: number
	timestamp: number
	session_id?: string | null
	agent_id?: string
	tags?: string[]
	importance?: number
	metadata?: Record<string, unknown> | null
}

export class QuotaExceededError extends Error {
	action: "connect_account" | "upgrade_plan" | null
	url: string | null

	constructor(opts?: {
		message?: string
		action?: "connect_account" | "upgrade_plan" | null
		url?: string | null
	}) {
		super(opts?.message ?? "MemVault quota exceeded")
		this.action = opts?.action ?? null
		this.url = opts?.url ?? null
	}
}

const MAX_RETRIES = 3
const RETRY_BASE_MS = 200
const CIRCUIT_FAILURE_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 2 * 60 * 1000 // 2 minutes

function isRetryable(err: unknown): boolean {
	if (err instanceof TypeError) return true // network errors (fetch throws TypeError)
	if (err instanceof Error && err.message.includes("MemVault API error 5")) return true // 5xx
	return false
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MemVaultClient {
	private baseUrl: string
	private token: string
	private debug: boolean
	private consecutiveFailures = 0
	private circuitOpenUntil = 0

	lastUsage: UsageInfo | null = null
	lastConnection: {
		linked: boolean
		plan: string
		plan_label: string
	} | null = null

	constructor(baseUrl: string, token: string, debug = false) {
		this.baseUrl = baseUrl.replace(/\/+$/, "")
		this.token = token
		this.debug = debug
	}

	get isCircuitOpen(): boolean {
		if (this.circuitOpenUntil === 0) return false
		if (Date.now() >= this.circuitOpenUntil) {
			// Cooldown expired, allow a probe request
			this.circuitOpenUntil = 0
			return false
		}
		return true
	}

	private onSuccess(): void {
		this.consecutiveFailures = 0
		this.circuitOpenUntil = 0
	}

	private onFailure(): void {
		this.consecutiveFailures++
		if (this.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
			this.circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS
			if (this.debug) {
				console.log(
					`[memvault] circuit breaker open — skipping requests for ${CIRCUIT_COOLDOWN_MS / 1000}s`,
				)
			}
		}
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
		signal?: AbortSignal,
	): Promise<T> {
		if (this.isCircuitOpen) {
			throw new Error("MemVault circuit breaker open — server unreachable")
		}

		const url = `${this.baseUrl}${path}`
		const headers: Record<string, string> = {
			Authorization: `Bearer ${this.token}`,
			"Content-Type": "application/json",
		}

		if (this.debug) {
			console.log(`[memvault] ${method} ${path}`, body ? JSON.stringify(body).slice(0, 200) : "")
		}

		let lastErr: unknown
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			try {
				if (attempt > 0) {
					const delay = RETRY_BASE_MS * 2 ** (attempt - 1)
					if (this.debug) console.log(`[memvault] retry #${attempt} after ${delay}ms`)
					await sleep(delay)
				}

				const res = await fetch(url, {
					method,
					headers,
					body: body ? JSON.stringify(body) : undefined,
					signal,
				})

				if (!res.ok) {
					let errorJson: Record<string, unknown> | null = null
					let text = ""
					try {
						errorJson = (await res.json()) as Record<string, unknown>
						text = JSON.stringify(errorJson)
					} catch {
						text = await res.text()
					}

					const detail =
						errorJson && typeof errorJson.detail === "object"
							? (errorJson.detail as Record<string, unknown>)
							: null
					const errorCode = typeof detail?.error === "string" ? detail.error : ""
					if (
						(res.status === 403 || res.status === 429) &&
						(errorCode === "quota_exceeded" || errorCode === "rate_limit_exceeded")
					) {
						this.onSuccess()
						throw new QuotaExceededError({
							message:
								typeof detail?.message === "string"
									? detail.message
									: "MemVault quota exceeded",
							action:
								detail?.action === "connect_account" || detail?.action === "upgrade_plan"
									? detail.action
									: null,
							url:
								typeof detail?.connect_url === "string"
									? detail.connect_url
									: typeof detail?.upgrade_url === "string"
										? detail.upgrade_url
										: null,
						})
					}

					const err = new Error(`MemVault API error ${res.status}: ${text}`)
					if (res.status >= 500 && attempt < MAX_RETRIES) {
						lastErr = err
						continue
					}
					throw err
				}

				this.onSuccess()

				if (res.status === 204) return undefined as T

				const json = (await res.json()) as Record<string, unknown>

				if (json.usage && typeof json.usage === "object") {
					this.lastUsage = json.usage as UsageInfo
				}
				if (json.connection && typeof json.connection === "object") {
					this.lastConnection = json.connection as {
						linked: boolean
						plan: string
						plan_label: string
					}
				}

				return json as T
			} catch (err) {
				lastErr = err
				if (err instanceof QuotaExceededError) throw err
				if (!isRetryable(err) || attempt >= MAX_RETRIES) {
					this.onFailure()
					throw err
				}
			}
		}

		this.onFailure()
		throw lastErr
	}

	async store(
		content: string,
		opts?: {
			role?: string
			session_id?: string
			agent_id?: string
			timestamp?: number
			event_id?: string
			tags?: string[]
			importance?: number
			metadata?: Record<string, unknown>
		},
	): Promise<MemVaultMemory> {
		return this.request<MemVaultMemory>("POST", "/v1/memories", {
			content,
			...opts,
		})
	}

	async search(
		query: string,
		limit = 5,
		scoreThreshold = 0.4,
		filter?: { agent_id?: string; tags?: string[]; session_id?: string },
	): Promise<SearchResult[]> {
		const body: Record<string, unknown> = {
			query,
			limit,
			score_threshold: scoreThreshold,
		}
		if (filter) body.filter = filter

		const res = await this.request<{ results: SearchResult[] }>(
			"POST",
			"/v1/memories/search",
			body,
		)
		return res.results
	}

	async recall(
		query: string,
		maxResults = 10,
		scoreThreshold = 0.4,
		signal?: AbortSignal,
	): Promise<{ context: string | null; result_count: number }> {
		return this.request("POST", "/v1/recall", {
			query,
			max_results: maxResults,
			score_threshold: scoreThreshold,
		}, signal)
	}

	async ingest(
		messages: unknown[],
		opts: {
			agent_id?: string
			session_id?: string
			source?: string
			timestamp?: number
			event_id?: string
			metadata?: Record<string, unknown>
		},
	): Promise<{ stored: boolean; memory_id?: string; content_length?: number; skipped_reason?: string }> {
		return this.request("POST", "/v1/ingest", {
			messages,
			...opts,
		})
	}

	async migrate(payload: {
		agent_id?: string
		memory_md?: {
			path: string
			content: string
			modified_at?: number
		}
		daily_logs?: Array<{
			path: string
			content: string
			modified_at?: number
		}>
		session_logs?: Array<{
			path: string
			content: string
			modified_at?: number
		}>
	}): Promise<{ imported: number; failed: number; total_entries: number }> {
		return this.request("POST", "/v1/migrate", payload)
	}

	async forgetByQuery(
		query: string,
		scoreThreshold = 0.4,
	): Promise<{ deleted: boolean; memory_id?: string; content_preview?: string }> {
		return this.request("POST", "/v1/memories/forget", {
			query,
			score_threshold: scoreThreshold,
		})
	}

	async get(memoryId: string): Promise<MemVaultMemory> {
		return this.request<MemVaultMemory>("GET", `/v1/memories/${memoryId}`)
	}

	async delete(memoryId: string): Promise<void> {
		await this.request<void>("DELETE", `/v1/memories/${memoryId}`)
	}

	async stats(): Promise<{
		total_memories: number
		storage_used_mb: number
		usage?: UsageInfo | null
		connection?: {
			linked: boolean
			plan: string
			plan_label: string
		} | null
	}> {
		return this.request("GET", "/v1/memories/stats")
	}
}
