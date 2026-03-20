export type ActivationState = {
    code: string;
    connect_url: string;
    created_at: number;
};
export declare function loadActivation(): ActivationState | null;
export declare function saveActivation(state: ActivationState): void;
export declare function clearActivation(): void;
