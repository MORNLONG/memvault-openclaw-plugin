/**
 * Device link flow.
 *
 * Each OpenClaw installation uses a hidden device ID to talk to MemVault.
 * When the user wants to connect this installation to an email account,
 * the plugin requests a short-lived link code and the portal claims it.
 */

import {
	type ActivationState,
	clearActivation,
	loadActivation,
	saveActivation,
} from "./activation_state.ts"

const LINK_TTL_MS = 24 * 3600 * 1000

export { clearActivation, loadActivation, type ActivationState } from "./activation_state.ts"

export type PollResult =
	| { status: "pending" }
	| { status: "linked" }
	| { status: "expired" }
	| { status: "error" }

export function isActivationExpired(activation: ActivationState): boolean {
	return Date.now() - activation.created_at > LINK_TTL_MS
}

export async function requestActivationCode(
	baseUrl: string,
	deviceId: string,
): Promise<ActivationState | null> {
	const existing = loadActivation()
	if (existing) {
		if (isActivationExpired(existing)) {
			clearActivation()
		} else {
			return existing
		}
	}

	try {
		const res = await fetch(`${baseUrl}/v1/activate/request`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${deviceId}`,
				"Content-Type": "application/json",
			},
		})
		if (!res.ok) return null

		const data = (await res.json()) as {
			code: string
			expires_in: number
			connect_url: string
		}
		const state: ActivationState = {
			code: data.code,
			connect_url: data.connect_url,
			created_at: Date.now(),
		}
		saveActivation(state)
		return state
	} catch {
		return null
	}
}

export async function pollActivationStatus(
	baseUrl: string,
	code: string,
	deviceId: string,
): Promise<PollResult> {
	try {
		const res = await fetch(
			`${baseUrl}/v1/activate/${encodeURIComponent(code)}/status`,
			{
				headers: { Authorization: `Bearer ${deviceId}` },
			},
		)

		if (!res.ok) {
			if (res.status === 404) {
				clearActivation()
				return { status: "expired" }
			}
			return { status: "error" }
		}

		const data = (await res.json()) as { status: string }
		if (data.status === "linked") {
			clearActivation()
			return { status: "linked" }
		}
		if (data.status === "expired") {
			clearActivation()
			return { status: "expired" }
		}
		return { status: "pending" }
	} catch {
		return { status: "error" }
	}
}

export function buildActivationMessage(
	activation: ActivationState,
	intro = "[MemVault] 当前这台 OpenClaw 还没有连接到账户。",
): string {
	return (
		`${intro}\n\n` +
		`1. 打开 ${activation.connect_url}\n` +
		`2. 绑定邮箱或登录已有账户\n` +
		`3. 连接这台 OpenClaw，之后新设备也能继续同一份记忆\n` +
		`如页面没有自动带入，再手动输入连接码：**${activation.code}**\n\n` +
		`输入 \`{/mvstatus}\` 可再次查看当前状态`
	)
}
