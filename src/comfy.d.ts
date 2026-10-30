import type { ComfyApi, ComfyApp } from '@comfyorg/comfyui-frontend-types';

declare module "/scripts/app.js" {
    export const app: ComfyApp;
}

declare module "/scripts/api.js" {
    export const api: ComfyApi;
}

declare global {
    const LGraphCanvas: typeof import('@comfyorg/comfyui-frontend-types').LGraphCanvas;
}

export { };
