import type { UsageInfo } from "./usage_state.ts";
export type MemVaultMemory = {
    id: string;
    content: string;
    score?: number;
    role?: string;
    session_id?: string | null;
    agent_id?: string;
    tags?: string[];
    importance?: number;
    timestamp?: number;
    metadata?: Record<string, unknown> | null;
};
export type SearchResult = {
    id: string;
    content: string;
    score: number;
    timestamp: number;
    session_id?: string | null;
    agent_id?: string;
    tags?: string[];
    importance?: number;
    metadata?: Record<string, unknown> | null;
};
export declare class QuotaExceededError extends Error {
    action: "connect_account" | "upgrade_plan" | null;
    url: string | null;
    constructor(opts?: {
        message?: string;
        action?: "connect_account" | "upgrade_plan" | null;
        url?: string | null;
    });
}
export declare class MemVaultClient {
    private baseUrl;
    private token;
    private debug;
    private consecutiveFailures;
    private circuitOpenUntil;
    lastUsage: UsageInfo | null;
    lastConnection: {
        linked: boolean;
        plan: string;
        plan_label: string;
    } | null;
    constructor(baseUrl: string, token: string, debug?: boolean);
    get isCircuitOpen(): boolean;
    private onSuccess;
    private onFailure;
    private request;
    store(content: string, opts?: {
        role?: string;
        session_id?: string;
        agent_id?: string;
        timestamp?: number;
        event_id?: string;
        tags?: string[];
        importance?: number;
        metadata?: Record<string, unknown>;
    }): Promise<MemVaultMemory>;
    search(query: string, limit?: number, scoreThreshold?: number, filter?: {
        agent_id?: string;
        tags?: string[];
        session_id?: string;
    }): Promise<SearchResult[]>;
    recall(query: string, maxResults?: number, scoreThreshold?: number, signal?: AbortSignal): Promise<{
        context: string | null;
        result_count: number;
    }>;
    ingest(messages: unknown[], opts: {
        agent_id?: string;
        session_id?: string;
        source?: string;
        timestamp?: number;
        event_id?: string;
        metadata?: Record<string, unknown>;
    }): Promise<{
        stored: boolean;
        memory_id?: string;
        content_length?: number;
        skipped_reason?: string;
    }>;
    migrate(payload: {
        agent_id?: string;
        memory_md?: {
            path: string;
            content: string;
            modified_at?: number;
        };
        daily_logs?: Array<{
            path: string;
            content: string;
            modified_at?: number;
        }>;
        session_logs?: Array<{
            path: string;
            content: string;
            modified_at?: number;
        }>;
    }): Promise<{
        imported: number;
        failed: number;
        total_entries: number;
    }>;
    forgetByQuery(query: string, scoreThreshold?: number): Promise<{
        deleted: boolean;
        memory_id?: string;
        content_preview?: string;
    }>;
    get(memoryId: string): Promise<MemVaultMemory>;
    delete(memoryId: string): Promise<void>;
    stats(): Promise<{
        total_memories: number;
        storage_used_mb: number;
        usage?: UsageInfo | null;
        connection?: {
            linked: boolean;
            plan: string;
            plan_label: string;
        } | null;
    }>;
}
