import {
	existsSync,
	readFileSync,
	readdirSync,
	statSync,
	writeFileSync,
} from "node:fs"
import { join } from "node:path"
import type { MemVaultClient } from "../client.ts"
import type { MemVaultConfig } from "../config.ts"

const MIGRATE_MARKER = ".memvault-migrated"
const SESSION_MIGRATE_MARKER = ".memvault-sessions-migrated"

type RawMigrationSource = {
	path: string
	content: string
	modified_at?: number
}

function fileMtimeSeconds(path: string): number | undefined {
	try {
		return Math.floor(statSync(path).mtimeMs / 1000)
	} catch {
		return
	}
}

function findWorkspace(): string | null {
	const candidates = [
		process.env.OPENCLAW_WORKSPACE,
		join(process.env.HOME ?? "/root", "clawd"),
		join(process.env.HOME ?? "/root", ".openclaw", "workspace"),
	]
	for (const dir of candidates) {
		if (dir && existsSync(dir)) return dir
	}
	return null
}

function readSource(path: string, relativePath: string): RawMigrationSource | null {
	if (!existsSync(path)) return null
	try {
		const content = readFileSync(path, "utf-8")
		if (!content.trim()) return null
		return {
			path: relativePath,
			content,
			modified_at: fileMtimeSeconds(path),
		}
	} catch {
		return null
	}
}

function collectDailyLogs(memoryDir: string): RawMigrationSource[] {
	if (!existsSync(memoryDir)) return []
	const sources: RawMigrationSource[] = []
	const files = readdirSync(memoryDir).filter(
		(f) => /^\d{4}-\d{2}-\d{2}/.test(f) && f.endsWith(".md"),
	)
	for (const file of files) {
		const filePath = join(memoryDir, file)
		const source = readSource(filePath, `memory/${file}`)
		if (source) sources.push(source)
	}
	return sources
}

function findSessionsDir(): string | null {
	const home = process.env.HOME ?? "/root"
	const candidates = [join(home, ".openclaw", "agents", "main", "sessions")]
	for (const dir of candidates) {
		if (existsSync(dir)) return dir
	}
	return null
}

function isActiveSessionFile(file: string): boolean {
	return /^[0-9a-f-]+\.jsonl$/i.test(file)
}

function collectSessionLogs(sessionsDir: string): RawMigrationSource[] {
	const sources: RawMigrationSource[] = []
	const files = readdirSync(sessionsDir).filter(isActiveSessionFile)
	for (const file of files) {
		const source = readSource(join(sessionsDir, file), file)
		if (source) sources.push(source)
	}
	return sources
}

export async function runMigration(
	client: MemVaultClient,
	cfg: MemVaultConfig,
	logger: { info: (msg: string) => void; error: (msg: string, err?: unknown) => void },
	_deviceId: string,
): Promise<void> {
	const workspace = findWorkspace()
	if (!workspace) {
		logger.info("memvault migration: workspace not found, skipping")
		return
	}

	const memoryDir = join(workspace, "memory")
	const markerPath = join(memoryDir, MIGRATE_MARKER)
	const sessionMarkerPath = join(memoryDir, SESSION_MIGRATE_MARKER)

	const needMemoryMigration = !existsSync(markerPath)
	const needSessionMigration = !existsSync(sessionMarkerPath)

	if (!needMemoryMigration && !needSessionMigration) {
		if (cfg.debug) logger.info("memvault migration: all migrations completed, skipping")
		return
	}

	let memoryMd: RawMigrationSource | undefined
	let dailyLogs: RawMigrationSource[] = []
	let sessionLogs: RawMigrationSource[] = []

	if (needMemoryMigration) {
		logger.info("memvault migration: importing memory files...")
		const memoryMdPath = join(workspace, "MEMORY.md")
		memoryMd = readSource(memoryMdPath, "MEMORY.md") ?? undefined
		logger.info(`  MEMORY.md: ${memoryMd ? "1 file" : "0 file"}`)

		dailyLogs = collectDailyLogs(memoryDir)
		logger.info(`  Daily logs: ${dailyLogs.length} files`)
	}

	if (needSessionMigration) {
		const sessionsDir = findSessionsDir()
		if (sessionsDir) {
			logger.info("memvault migration: importing active session history...")
			sessionLogs = collectSessionLogs(sessionsDir)
			logger.info(`  Session logs: ${sessionLogs.length} active .jsonl files`)
		} else {
			logger.info("memvault migration: sessions directory not found, skipping")
		}
	}

	if (!memoryMd && dailyLogs.length === 0 && sessionLogs.length === 0) {
		logger.info("memvault migration: no new data to import")
		if (needMemoryMigration) writeFileSync(markerPath, new Date().toISOString())
		if (needSessionMigration) writeFileSync(sessionMarkerPath, new Date().toISOString())
		return
	}

	let result: { imported: number; failed: number; total_entries: number }
	try {
		result = await client.migrate({
			agent_id: "openclaw",
			memory_md: memoryMd,
			daily_logs: dailyLogs,
			session_logs: sessionLogs,
		})
	} catch (err) {
		logger.error("memvault migration: request failed", err)
		return
	}

	logger.info(
		`memvault migration: done — ${result.imported} imported, ${result.failed} failed`,
	)

	const markerData = JSON.stringify({
		migratedAt: new Date().toISOString(),
		imported: result.imported,
		failed: result.failed,
	})
	if (needMemoryMigration) writeFileSync(markerPath, markerData)
	if (needSessionMigration) writeFileSync(sessionMarkerPath, markerData)
}
