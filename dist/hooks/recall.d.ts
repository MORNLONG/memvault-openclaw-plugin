import { type MemVaultClient } from "../client.ts";
import type { MemVaultConfig } from "../config.ts";
export declare function buildRecallHandler(getClient: () => MemVaultClient, cfg: MemVaultConfig): (event: Record<string, unknown>) => Promise<{
    prependContext: string;
} | undefined>;
