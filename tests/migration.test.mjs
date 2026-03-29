import assert from "node:assert/strict"
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { runMigration } from "../dist/hooks/migrate.js"

function writeSessionFile(dir, name, userText, assistantText) {
	const lines = [
		JSON.stringify({
			type: "message",
			id: `${name}-user`,
			message: {
				role: "user",
				timestamp: "2026-03-29T15:00:00Z",
				content: [{ type: "text", text: userText }],
			},
		}),
		JSON.stringify({
			type: "message",
			id: `${name}-assistant`,
			message: {
				role: "assistant",
				stopReason: "stop",
				timestamp: "2026-03-29T15:00:05Z",
				content: [{ type: "text", text: assistantText }],
			},
		}),
	]
	writeFileSync(join(dir, name), `${lines.join("\n")}\n`, "utf-8")
}

test("migration uploads active, reset, and deleted session files", async () => {
	const home = mkdtempSync(join(tmpdir(), "memvault-migrate-"))
	const workspace = join(home, "clawd")
	const memoryDir = join(workspace, "memory")
	const sessionsDir = join(home, ".openclaw", "agents", "main", "sessions")
	mkdirSync(memoryDir, { recursive: true })
	mkdirSync(sessionsDir, { recursive: true })

	writeSessionFile(sessionsDir, "active-1.jsonl", "active user", "active assistant")
	writeSessionFile(
		sessionsDir,
		"archived-1.jsonl.reset.2026-03-29T15-00-00.000Z",
		"reset user",
		"reset assistant",
	)
	writeSessionFile(
		sessionsDir,
		"archived-2.jsonl.deleted.2026-03-29T15-00-00.000Z",
		"deleted user",
		"deleted assistant",
	)

	const previousHome = process.env.HOME
	const previousWorkspace = process.env.OPENCLAW_WORKSPACE
	process.env.HOME = home
	process.env.OPENCLAW_WORKSPACE = workspace

	let payload = null
	const client = {
		async migrate(input) {
			payload = input
			return { imported: 3, failed: 0, total_entries: 3 }
		},
	}
	const logger = { info() {}, error() {} }

	try {
		await runMigration(client, { debug: false }, logger, "device-1")
		assert.ok(payload, "migration payload should be sent")
		assert.deepEqual(
			payload.session_logs.map((item) => item.path).sort(),
			[
				"active-1.jsonl",
				"archived-1.jsonl.reset.2026-03-29T15-00-00.000Z",
				"archived-2.jsonl.deleted.2026-03-29T15-00-00.000Z",
			],
		)
		assert.ok(
			readFileSync(join(memoryDir, ".memvault-sessions-migrated"), "utf-8").includes(
				'"imported":3',
			),
		)
	} finally {
		if (previousHome === undefined) {
			delete process.env.HOME
		} else {
			process.env.HOME = previousHome
		}
		if (previousWorkspace === undefined) {
			delete process.env.OPENCLAW_WORKSPACE
		} else {
			process.env.OPENCLAW_WORKSPACE = previousWorkspace
		}
		rmSync(home, { recursive: true, force: true })
	}
})
