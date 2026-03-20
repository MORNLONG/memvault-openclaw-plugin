import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { getPluginDataDir } from "./state_dir.ts"

const LINK_FILE = ".memvault-link.json"

export type ActivationState = {
	code: string
	connect_url: string
	created_at: number
}

function getActivationFilePath(): string {
	return join(getPluginDataDir(), LINK_FILE)
}

export function loadActivation(): ActivationState | null {
	const filePath = getActivationFilePath()
	if (!existsSync(filePath)) return null
	try {
		return JSON.parse(readFileSync(filePath, "utf-8")) as ActivationState
	} catch {
		return null
	}
}

export function saveActivation(state: ActivationState): void {
	const dir = getPluginDataDir()
	mkdirSync(dir, { recursive: true })
	writeFileSync(getActivationFilePath(), JSON.stringify(state), "utf-8")
}

export function clearActivation(): void {
	const filePath = getActivationFilePath()
	if (!existsSync(filePath)) return
	try {
		unlinkSync(filePath)
	} catch {
		// ignore
	}
}
