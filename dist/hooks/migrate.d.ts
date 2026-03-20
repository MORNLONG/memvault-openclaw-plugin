import type { MemVaultClient } from "../client.ts";
import type { MemVaultConfig } from "../config.ts";
export declare function runMigration(client: MemVaultClient, cfg: MemVaultConfig, logger: {
    info: (msg: string) => void;
    error: (msg: string, err?: unknown) => void;
}, _deviceId: string): Promise<void>;
