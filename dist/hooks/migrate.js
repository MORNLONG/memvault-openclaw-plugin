import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, } from "node:fs";
import { join } from "node:path";
const MIGRATE_MARKER = ".memvault-migrated";
const SESSION_MIGRATE_MARKER = ".memvault-sessions-migrated";
const SESSION_FILE_RE = /^(?<sessionId>[0-9a-z_-]+)\.jsonl(?:\.(?<state>reset|deleted)\..+)?$/i;
function fileMtimeSeconds(path) {
    try {
        return Math.floor(statSync(path).mtimeMs / 1000);
    }
    catch {
        return;
    }
}
function findWorkspace() {
    const candidates = [
        process.env.OPENCLAW_WORKSPACE,
        join(process.env.HOME ?? "/root", "clawd"),
        join(process.env.HOME ?? "/root", ".openclaw", "workspace"),
    ];
    for (const dir of candidates) {
        if (dir && existsSync(dir))
            return dir;
    }
    return null;
}
function readSource(path, relativePath) {
    if (!existsSync(path))
        return null;
    try {
        const content = readFileSync(path, "utf-8");
        if (!content.trim())
            return null;
        return {
            path: relativePath,
            content,
            modified_at: fileMtimeSeconds(path),
        };
    }
    catch {
        return null;
    }
}
function collectDailyLogs(memoryDir) {
    if (!existsSync(memoryDir))
        return [];
    const sources = [];
    const files = readdirSync(memoryDir).filter((f) => /^\d{4}-\d{2}-\d{2}/.test(f) && f.endsWith(".md"));
    for (const file of files) {
        const filePath = join(memoryDir, file);
        const source = readSource(filePath, `memory/${file}`);
        if (source)
            sources.push(source);
    }
    return sources;
}
function findSessionsDir() {
    const home = process.env.HOME ?? "/root";
    const candidates = [join(home, ".openclaw", "agents", "main", "sessions")];
    for (const dir of candidates) {
        if (existsSync(dir))
            return dir;
    }
    return null;
}
function getSessionState(file) {
    const match = SESSION_FILE_RE.exec(file);
    if (!match)
        return null;
    const state = match.groups?.state?.toLowerCase();
    if (state === "reset" || state === "deleted")
        return state;
    return "active";
}
function collectSessionLogs(sessionsDir) {
    const sources = [];
    const files = readdirSync(sessionsDir).filter((file) => getSessionState(file) !== null);
    for (const file of files) {
        const source = readSource(join(sessionsDir, file), file);
        if (source)
            sources.push(source);
    }
    return sources;
}
function summarizeSessionStates(sources) {
    const counts = {
        active: 0,
        reset: 0,
        deleted: 0,
    };
    for (const source of sources) {
        const state = getSessionState(source.path);
        if (state)
            counts[state] += 1;
    }
    return `active=${counts.active}, reset=${counts.reset}, deleted=${counts.deleted}`;
}
export async function runMigration(client, cfg, logger, _deviceId) {
    const workspace = findWorkspace();
    if (!workspace) {
        logger.info("memvault migration: workspace not found, skipping");
        return;
    }
    const memoryDir = join(workspace, "memory");
    const markerPath = join(memoryDir, MIGRATE_MARKER);
    const sessionMarkerPath = join(memoryDir, SESSION_MIGRATE_MARKER);
    const needMemoryMigration = !existsSync(markerPath);
    const needSessionMigration = !existsSync(sessionMarkerPath);
    if (!needMemoryMigration && !needSessionMigration) {
        if (cfg.debug)
            logger.info("memvault migration: all migrations completed, skipping");
        return;
    }
    let memoryMd;
    let dailyLogs = [];
    let sessionLogs = [];
    if (needMemoryMigration) {
        logger.info("memvault migration: importing memory files...");
        const memoryMdPath = join(workspace, "MEMORY.md");
        memoryMd = readSource(memoryMdPath, "MEMORY.md") ?? undefined;
        logger.info(`  MEMORY.md: ${memoryMd ? "1 file" : "0 file"}`);
        dailyLogs = collectDailyLogs(memoryDir);
        logger.info(`  Daily logs: ${dailyLogs.length} files`);
    }
    if (needSessionMigration) {
        const sessionsDir = findSessionsDir();
        if (sessionsDir) {
            logger.info("memvault migration: importing session history (active/reset/deleted)...");
            sessionLogs = collectSessionLogs(sessionsDir);
            logger.info(`  Session logs: ${sessionLogs.length} files (${summarizeSessionStates(sessionLogs)})`);
        }
        else {
            logger.info("memvault migration: sessions directory not found, skipping");
        }
    }
    if (!memoryMd && dailyLogs.length === 0 && sessionLogs.length === 0) {
        logger.info("memvault migration: no new data to import");
        if (needMemoryMigration)
            writeFileSync(markerPath, new Date().toISOString());
        if (needSessionMigration)
            writeFileSync(sessionMarkerPath, new Date().toISOString());
        return;
    }
    let result;
    try {
        result = await client.migrate({
            agent_id: "openclaw",
            memory_md: memoryMd,
            daily_logs: dailyLogs,
            session_logs: sessionLogs,
        });
    }
    catch (err) {
        logger.error("memvault migration: request failed", err);
        return;
    }
    logger.info(`memvault migration: done — ${result.imported} imported, ${result.failed} failed`);
    const markerData = JSON.stringify({
        migratedAt: new Date().toISOString(),
        imported: result.imported,
        failed: result.failed,
    });
    if (needMemoryMigration)
        writeFileSync(markerPath, markerData);
    if (needSessionMigration)
        writeFileSync(sessionMarkerPath, markerData);
}
