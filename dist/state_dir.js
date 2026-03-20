import { join } from "node:path";
export function getPluginDataDir() {
    return (process.env.OPENCLAW_DATA_DIR ??
        join(process.env.HOME ?? "/root", ".openclaw", "extensions", "openclaw-memvault"));
}
