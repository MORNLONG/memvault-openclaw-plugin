import { QuotaExceededError, type MemVaultClient } from "../client.ts";
import type { MemVaultConfig } from "../config.ts";
export declare function buildCaptureHandler(getClient: () => MemVaultClient, cfg: MemVaultConfig, getSessionKey: () => string | undefined, deviceId: string, onQuotaExceeded?: (err: QuotaExceededError) => Promise<string | null>, queueNotice?: (notice: string) => void): (event: Record<string, unknown>, ctx: Record<string, unknown>) => Promise<void>;
