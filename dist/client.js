export class QuotaExceededError extends Error {
    action;
    url;
    constructor(opts) {
        super(opts?.message ?? "MemVault quota exceeded");
        this.action = opts?.action ?? null;
        this.url = opts?.url ?? null;
    }
}
const MAX_RETRIES = 3;
const RETRY_BASE_MS = 200;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
function isRetryable(err) {
    if (err instanceof TypeError)
        return true; // network errors (fetch throws TypeError)
    if (err instanceof Error && err.message.includes("MemVault API error 5"))
        return true; // 5xx
    return false;
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export class MemVaultClient {
    baseUrl;
    token;
    debug;
    consecutiveFailures = 0;
    circuitOpenUntil = 0;
    lastUsage = null;
    lastConnection = null;
    constructor(baseUrl, token, debug = false) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.token = token;
        this.debug = debug;
    }
    get isCircuitOpen() {
        if (this.circuitOpenUntil === 0)
            return false;
        if (Date.now() >= this.circuitOpenUntil) {
            // Cooldown expired, allow a probe request
            this.circuitOpenUntil = 0;
            return false;
        }
        return true;
    }
    onSuccess() {
        this.consecutiveFailures = 0;
        this.circuitOpenUntil = 0;
    }
    onFailure() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
            this.circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
            if (this.debug) {
                console.log(`[memvault] circuit breaker open — skipping requests for ${CIRCUIT_COOLDOWN_MS / 1000}s`);
            }
        }
    }
    async request(method, path, body, signal) {
        if (this.isCircuitOpen) {
            throw new Error("MemVault circuit breaker open — server unreachable");
        }
        const url = `${this.baseUrl}${path}`;
        const headers = {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
        };
        if (this.debug) {
            console.log(`[memvault] ${method} ${path}`, body ? JSON.stringify(body).slice(0, 200) : "");
        }
        let lastErr;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
                    if (this.debug)
                        console.log(`[memvault] retry #${attempt} after ${delay}ms`);
                    await sleep(delay);
                }
                const res = await fetch(url, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    signal,
                });
                if (!res.ok) {
                    let errorJson = null;
                    let text = "";
                    try {
                        errorJson = (await res.json());
                        text = JSON.stringify(errorJson);
                    }
                    catch {
                        text = await res.text();
                    }
                    const detail = errorJson && typeof errorJson.detail === "object"
                        ? errorJson.detail
                        : null;
                    const errorCode = typeof detail?.error === "string" ? detail.error : "";
                    if ((res.status === 403 || res.status === 429) &&
                        (errorCode === "quota_exceeded" || errorCode === "rate_limit_exceeded")) {
                        this.onSuccess();
                        throw new QuotaExceededError({
                            message: typeof detail?.message === "string"
                                ? detail.message
                                : "MemVault quota exceeded",
                            action: detail?.action === "connect_account" || detail?.action === "upgrade_plan"
                                ? detail.action
                                : null,
                            url: typeof detail?.connect_url === "string"
                                ? detail.connect_url
                                : typeof detail?.upgrade_url === "string"
                                    ? detail.upgrade_url
                                    : null,
                        });
                    }
                    const err = new Error(`MemVault API error ${res.status}: ${text}`);
                    if (res.status >= 500 && attempt < MAX_RETRIES) {
                        lastErr = err;
                        continue;
                    }
                    throw err;
                }
                this.onSuccess();
                if (res.status === 204)
                    return undefined;
                const json = (await res.json());
                if (json.usage && typeof json.usage === "object") {
                    this.lastUsage = json.usage;
                }
                if (json.connection && typeof json.connection === "object") {
                    this.lastConnection = json.connection;
                }
                return json;
            }
            catch (err) {
                lastErr = err;
                if (err instanceof QuotaExceededError)
                    throw err;
                if (!isRetryable(err) || attempt >= MAX_RETRIES) {
                    this.onFailure();
                    throw err;
                }
            }
        }
        this.onFailure();
        throw lastErr;
    }
    async store(content, opts) {
        return this.request("POST", "/v1/memories", {
            content,
            ...opts,
        });
    }
    async search(query, limit = 5, scoreThreshold = 0.4, filter) {
        const body = {
            query,
            limit,
            score_threshold: scoreThreshold,
        };
        if (filter)
            body.filter = filter;
        const res = await this.request("POST", "/v1/memories/search", body);
        return res.results;
    }
    async recall(query, maxResults = 10, scoreThreshold = 0.4, signal) {
        return this.request("POST", "/v1/recall", {
            query,
            max_results: maxResults,
            score_threshold: scoreThreshold,
        }, signal);
    }
    async ingest(messages, opts) {
        return this.request("POST", "/v1/ingest", {
            messages,
            ...opts,
        });
    }
    async migrate(payload) {
        return this.request("POST", "/v1/migrate", payload);
    }
    async forgetByQuery(query, scoreThreshold = 0.4) {
        return this.request("POST", "/v1/memories/forget", {
            query,
            score_threshold: scoreThreshold,
        });
    }
    async get(memoryId) {
        return this.request("GET", `/v1/memories/${memoryId}`);
    }
    async delete(memoryId) {
        await this.request("DELETE", `/v1/memories/${memoryId}`);
    }
    async stats() {
        return this.request("GET", "/v1/memories/stats");
    }
}
