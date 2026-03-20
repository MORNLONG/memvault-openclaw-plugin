export type MemVaultConfig = {
	apiUrl: string | undefined
	autoRecall: boolean
	autoCapture: boolean
	maxRecallResults: number
	recallTimeoutMs: number
	scoreThreshold: number
	debug: boolean
}

function resolveEnvVars(value: string): string {
	return value.replace(/\$\{([^}]+)\}/g, (_, envVar: string) => {
		const envValue = process.env[envVar]
		if (!envValue) {
			throw new Error(`Environment variable ${envVar} is not set`)
		}
		return envValue
	})
}

export function parseConfig(raw: unknown): MemVaultConfig {
	const cfg =
		raw && typeof raw === "object" && !Array.isArray(raw)
			? (raw as Record<string, unknown>)
			: {}

	const DEFAULT_API_URL = "https://api.mv.mornlong.com:8443"

	let apiUrl: string | undefined
	try {
		apiUrl =
			typeof cfg.apiUrl === "string" && cfg.apiUrl.length > 0
				? resolveEnvVars(cfg.apiUrl)
				: process.env.MEMVAULT_API_URL ?? DEFAULT_API_URL
	} catch {
		apiUrl = DEFAULT_API_URL
	}

	return {
		apiUrl,
		autoRecall: (cfg.autoRecall as boolean) ?? true,
		autoCapture: (cfg.autoCapture as boolean) ?? true,
		maxRecallResults: (cfg.maxRecallResults as number) ?? 5,
		recallTimeoutMs: (cfg.recallTimeoutMs as number) ?? 3500,
		scoreThreshold: (cfg.scoreThreshold as number) ?? 0.4,
		debug: (cfg.debug as boolean) ?? false,
	}
}

export const memvaultConfigSchema = {
	jsonSchema: {
		type: "object",
		additionalProperties: false,
		properties: {
			apiUrl: { type: "string" },
			autoRecall: { type: "boolean" },
			autoCapture: { type: "boolean" },
			maxRecallResults: { type: "number", minimum: 1, maximum: 50 },
			recallTimeoutMs: { type: "number", minimum: 500, maximum: 10000 },
			scoreThreshold: { type: "number", minimum: 0, maximum: 1 },
			debug: { type: "boolean" },
		},
	},
	parse: parseConfig,
}
