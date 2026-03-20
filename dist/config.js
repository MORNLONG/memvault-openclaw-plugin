function resolveEnvVars(value) {
    return value.replace(/\$\{([^}]+)\}/g, (_, envVar) => {
        const envValue = process.env[envVar];
        if (!envValue) {
            throw new Error(`Environment variable ${envVar} is not set`);
        }
        return envValue;
    });
}
export function parseConfig(raw) {
    const cfg = raw && typeof raw === "object" && !Array.isArray(raw)
        ? raw
        : {};
    const DEFAULT_API_URL = "https://api.mv.mornlong.com:8443";
    let apiUrl;
    try {
        apiUrl =
            typeof cfg.apiUrl === "string" && cfg.apiUrl.length > 0
                ? resolveEnvVars(cfg.apiUrl)
                : process.env.MEMVAULT_API_URL ?? DEFAULT_API_URL;
    }
    catch {
        apiUrl = DEFAULT_API_URL;
    }
    return {
        apiUrl,
        autoRecall: cfg.autoRecall ?? true,
        autoCapture: cfg.autoCapture ?? true,
        maxRecallResults: cfg.maxRecallResults ?? 5,
        recallTimeoutMs: cfg.recallTimeoutMs ?? 3500,
        scoreThreshold: cfg.scoreThreshold ?? 0.4,
        debug: cfg.debug ?? false,
    };
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
};
