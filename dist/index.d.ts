import type { OpenClawPluginApi } from "openclaw/plugin-sdk/memory-core";
import { parseConfig } from "./config.ts";
declare const _default: {
    id: string;
    name: string;
    description: string;
    kind: "memory";
    configSchema: {
        jsonSchema: {
            type: string;
            additionalProperties: boolean;
            properties: {
                apiUrl: {
                    type: string;
                };
                autoRecall: {
                    type: string;
                };
                autoCapture: {
                    type: string;
                };
                maxRecallResults: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
                recallTimeoutMs: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
                scoreThreshold: {
                    type: string;
                    minimum: number;
                    maximum: number;
                };
                debug: {
                    type: string;
                };
            };
        };
        parse: typeof parseConfig;
    };
    register(api: OpenClawPluginApi): void;
};
export default _default;
