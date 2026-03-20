export type UsageInfo = {
    storage_used_bytes: number;
    storage_limit_bytes: number;
    storage_pct: number;
    queries_today: number;
    queries_limit: number;
    queries_pct: number;
    is_read_only: boolean;
};
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
export declare function checkAndEmitWarning(usage: UsageInfo | null, activationMessage?: string | null): string | null;
