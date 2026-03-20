import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getPluginDataDir } from "./state_dir.js";
const LINK_FILE = ".memvault-link.json";
function getActivationFilePath() {
    return join(getPluginDataDir(), LINK_FILE);
}
export function loadActivation() {
    const filePath = getActivationFilePath();
    if (!existsSync(filePath))
        return null;
    try {
        return JSON.parse(readFileSync(filePath, "utf-8"));
    }
    catch {
        return null;
    }
}
export function saveActivation(state) {
    const dir = getPluginDataDir();
    mkdirSync(dir, { recursive: true });
    writeFileSync(getActivationFilePath(), JSON.stringify(state), "utf-8");
}
export function clearActivation() {
    const filePath = getActivationFilePath();
    if (!existsSync(filePath))
        return;
    try {
        unlinkSync(filePath);
    }
    catch {
        // ignore
    }
}
