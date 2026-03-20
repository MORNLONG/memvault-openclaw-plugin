/**
 * Device link flow.
 *
 * Each OpenClaw installation uses a hidden device ID to talk to MemVault.
 * When the user wants to connect this installation to an email account,
 * the plugin requests a short-lived link code and the portal claims it.
 */
import { type ActivationState } from "./activation_state.ts";
export { clearActivation, loadActivation, type ActivationState } from "./activation_state.ts";
export type PollResult = {
    status: "pending";
} | {
    status: "linked";
} | {
    status: "expired";
} | {
    status: "error";
};
export declare function isActivationExpired(activation: ActivationState): boolean;
export declare function requestActivationCode(baseUrl: string, deviceId: string): Promise<ActivationState | null>;
export declare function pollActivationStatus(baseUrl: string, code: string, deviceId: string): Promise<PollResult>;
export declare function buildActivationMessage(activation: ActivationState, intro?: string): string;
