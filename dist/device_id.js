import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { getPluginDataDir } from "./state_dir.js";
const DEVICE_ID_FILE = ".memvault-device-id";
const LEGACY_ANON_ID_FILE = ".memvault-anon-id";
function normalizeLegacyId(raw) {
    const value = raw.trim();
    if (value.startsWith("mv_device_"))
        return value;
    if (!value.startsWith("mv_anon_"))
        return null;
    const uuid = value.slice("mv_anon_".length);
    return uuid ? `mv_device_${uuid}` : null;
}
export function getOrCreateDeviceId() {
    const dir = getPluginDataDir();
    const devicePath = join(dir, DEVICE_ID_FILE);
    if (existsSync(devicePath)) {
        const id = readFileSync(devicePath, "utf-8").trim();
        if (id.startsWith("mv_device_"))
            return id;
    }
    const legacyPath = join(dir, LEGACY_ANON_ID_FILE);
    if (existsSync(legacyPath)) {
        const migrated = normalizeLegacyId(readFileSync(legacyPath, "utf-8"));
        if (migrated) {
            mkdirSync(dir, { recursive: true });
            writeFileSync(devicePath, migrated, { encoding: "utf-8", mode: 0o600 });
            return migrated;
        }
    }
    mkdirSync(dir, { recursive: true });
    const id = `mv_device_${randomUUID()}`;
    writeFileSync(devicePath, id, { encoding: "utf-8", mode: 0o600 });
    return id;
}
