import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import plugin from "../dist/index.js"

test("plugin registers commands, tools, and hooks with a minimal runtime", () => {
	const dataDir = mkdtempSync(join(tmpdir(), "memvault-plugin-"))
	const previousDataDir = process.env.OPENCLAW_DATA_DIR
	process.env.OPENCLAW_DATA_DIR = dataDir

	const tools = []
	const commands = []
	const hooks = []
	const logs = []

	const api = {
		id: "openclaw-memvault",
		name: "MemVault",
		source: "test",
		config: { tools: { alsoAllow: ["openclaw-memvault"] } },
		pluginConfig: {
			autoRecall: true,
			autoCapture: true,
			debug: false,
		},
		runtime: {},
		logger: {
			info: (...args) => logs.push(["info", ...args]),
			warn: (...args) => logs.push(["warn", ...args]),
			error: (...args) => logs.push(["error", ...args]),
			debug: (...args) => logs.push(["debug", ...args]),
		},
		registerTool(tool) {
			tools.push(tool.name)
		},
		registerCommand(command) {
			commands.push(command.name)
		},
		registerHook() {},
		registerHttpRoute() {},
		registerChannel() {},
		registerGatewayMethod() {},
		registerCli() {},
		registerService() {},
		registerProvider() {},
		registerContextEngine() {},
		resolvePath(input) {
			return input
		},
		on(hookName) {
			hooks.push(hookName)
		},
	}

	try {
		plugin.register(api)

		assert.equal(plugin.id, "openclaw-memvault")
		assert.equal(plugin.kind, "memory")
		assert.deepEqual(commands, ["mvstatus"])
		assert.deepEqual(tools.sort(), [
			"memvault_forget",
			"memvault_search",
			"memvault_store",
		])
		assert.deepEqual(hooks.sort(), [
			"agent_end",
			"before_prompt_build",
			"message_sending",
		])
		assert.equal(
			logs.some(([level]) => level === "warn"),
			false,
			"trusted tool setup should not warn during registration",
		)
	} finally {
		if (previousDataDir === undefined) {
			delete process.env.OPENCLAW_DATA_DIR
		} else {
			process.env.OPENCLAW_DATA_DIR = previousDataDir
		}
		rmSync(dataDir, { recursive: true, force: true })
	}
})
