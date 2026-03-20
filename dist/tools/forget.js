import { Type } from "@sinclair/typebox";
export function registerForgetTool(api, getClient, cfg) {
    api.registerTool({
        name: "memvault_forget",
        label: "Memory Forget",
        description: "Forget/delete a specific memory. Can delete by ID or search for the closest match and remove it.",
        parameters: Type.Object({
            query: Type.Optional(Type.String({ description: "Describe the memory to forget" })),
            memoryId: Type.Optional(Type.String({ description: "Direct memory ID to delete" })),
        }),
        async execute(_toolCallId, params) {
            if (params.memoryId) {
                await getClient().delete(params.memoryId);
                return {
                    content: [
                        { type: "text", text: "Memory forgotten." },
                    ],
                    details: undefined,
                };
            }
            if (params.query) {
                const result = await getClient().forgetByQuery(params.query, cfg.scoreThreshold);
                const text = result.deleted
                    ? `Forgot: "${result.content_preview}"`
                    : "No matching memory found to forget.";
                return {
                    content: [{ type: "text", text }],
                    details: undefined,
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: "Provide a query or memoryId to forget.",
                    },
                ],
                details: undefined,
            };
        },
    });
}
