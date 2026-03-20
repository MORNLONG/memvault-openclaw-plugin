export type MemVaultConfig = {
    apiUrl: string | undefined;
    autoRecall: boolean;
    autoCapture: boolean;
    maxRecallResults: number;
    recallTimeoutMs: number;
    scoreThreshold: number;
    debug: boolean;
};
export declare function parseConfig(raw: unknown): MemVaultConfig;
export declare const memvaultConfigSchema: {
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
