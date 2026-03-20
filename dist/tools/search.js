import { Type } from "@sinclair/typebox";
export function registerSearchTool(api, getClient, cfg) {
    api.registerTool({
        name: "memvault_search",
        label: "Memory Search",
        description: "Search through long-term memories for relevant information.",
        parameters: Type.Object({
            query: Type.String({ description: "Search query" }),
            limit: Type.Optional(Type.Number({ description: "Max results (default: 5)" })),
            tags: Type.Optional(Type.Array(Type.String(), {
                description: "Filter by tags",
            })),
        }),
        async execute(_toolCallId, params) {
            const limit = params.limit ?? 5;
            const filter = params.tags ? { tags: params.tags } : undefined;
            const results = await getClient().search(params.query, limit, cfg.scoreThreshold, filter);
            if (results.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: "No relevant memories found.",
                        },
                    ],
                    details: undefined,
                };
            }
            const text = results
                .map((r, i) => {
                const score = `(${(r.score * 100).toFixed(0)}%)`;
                const tags = r.tags?.length ? ` [${r.tags.join(", ")}]` : "";
                return `${i + 1}. ${r.content} ${score}${tags}`;
            })
                .join("\n");
            return {
                content: [
                    {
                        type: "text",
                        text: `Found ${results.length} memories:\n\n${text}`,
                    },
                ],
                details: undefined,
            };
        },
    });
}
