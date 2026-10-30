import { ComfyApp, ComfyAPI } from './core/types';

declare module "/scripts/app.js" {
    // TODO(M2): use the frontend types' ComfyApp, whose getSettingValue takes only core ids, once M2 drops getSettingValue.
    export const app: ComfyApp;
}

declare module "/scripts/api.js" {
    export const api: ComfyAPI;
}

declare global {
    const LGraphCanvas: typeof import('@comfyorg/comfyui-frontend-types').LGraphCanvas;
}

export { };
