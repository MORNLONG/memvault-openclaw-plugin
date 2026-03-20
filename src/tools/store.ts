import { createHash } from "node:crypto"
import { Type } from "@sinclair/typebox"
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/memory-core"
import type { MemVaultClient } from "../client.ts"

export function registerStoreTool(
	api: OpenClawPluginApi,
	getClient: () => MemVaultClient,
	deviceId: string,
): void {
	api.registerTool(
		{
			name: "memvault_store",
			label: "Memory Store",
			description: "Save important information to long-term memory.",
			parameters: Type.Object({
				text: Type.String({ description: "Information to remember" }),
				tags: Type.Optional(
					Type.Array(Type.String(), {
						description: "Tags to categorize the memory",
					}),
				),
				importance: Type.Optional(
					Type.Number({
						description: "Importance score from 0 to 1 (default: 0.5)",
						minimum: 0,
						maximum: 1,
					}),
				),
			}),
			async execute(
				toolCallId: string,
				params: { text: string; tags?: string[]; importance?: number },
			) {
				const timestamp = Math.floor(Date.now() / 1000)
				const eventId = `manual_${createHash("sha256")
					.update([deviceId, toolCallId, params.text, ...(params.tags ?? [])].join("\u241f"))
					.digest("hex")
					.slice(0, 32)}`
				const result = await getClient().store(params.text, {
					tags: params.tags,
					importance: params.importance,
					agent_id: "openclaw",
					timestamp,
					event_id: eventId,
					metadata: {
						source: "openclaw_tool",
						source_kind: "manual_store",
						device_id: deviceId,
					},
				})

				const preview =
					params.text.length > 80
						? `${params.text.slice(0, 80)}...`
						: params.text

				return {
					content: [
						{
							type: "text" as const,
							text: `Stored memory (${result.id}): "${preview}"`,
						},
					],
					details: undefined,
				}
			},
		},
	)
}
