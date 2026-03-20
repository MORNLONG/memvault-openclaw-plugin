import type { OpenClawPluginApi } from "openclaw/plugin-sdk/memory-core";
import type { MemVaultClient } from "../client.ts";
import type { MemVaultConfig } from "../config.ts";
export declare function registerSearchTool(api: OpenClawPluginApi, getClient: () => MemVaultClient, cfg: MemVaultConfig): void;
