import { Type } from "@sinclair/typebox"
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/memory-core"
import type { MemVaultClient } from "../client.ts"
import type { MemVaultConfig } from "../config.ts"

export function registerForgetTool(
	api: OpenClawPluginApi,
	getClient: () => MemVaultClient,
	cfg: MemVaultConfig,
): void {
	api.registerTool(
		{
			name: "memvault_forget",
			label: "Memory Forget",
			description:
				"Forget/delete a specific memory. Can delete by ID or search for the closest match and remove it.",
			parameters: Type.Object({
				query: Type.Optional(
					Type.String({ description: "Describe the memory to forget" }),
				),
				memoryId: Type.Optional(
					Type.String({ description: "Direct memory ID to delete" }),
				),
			}),
			async execute(
				_toolCallId: string,
				params: { query?: string; memoryId?: string },
			) {
				if (params.memoryId) {
					await getClient().delete(params.memoryId)
					return {
						content: [
							{ type: "text" as const, text: "Memory forgotten." },
						],
						details: undefined,
					}
				}

				if (params.query) {
					const result = await getClient().forgetByQuery(
						params.query,
						cfg.scoreThreshold,
					)
					const text = result.deleted
						? `Forgot: "${result.content_preview}"`
						: "No matching memory found to forget."
					return {
						content: [{ type: "text" as const, text }],
						details: undefined,
					}
				}

				return {
					content: [
						{
							type: "text" as const,
							text: "Provide a query or memoryId to forget.",
						},
					],
					details: undefined,
				}
			},
		},
	)
}
