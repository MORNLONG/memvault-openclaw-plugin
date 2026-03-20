import type { OpenClawPluginApi } from "openclaw/plugin-sdk/memory-core";
import type { MemVaultClient } from "../client.ts";
export declare function registerStoreTool(api: OpenClawPluginApi, getClient: () => MemVaultClient, deviceId: string): void;
