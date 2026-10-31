import type { ComfyApi, ComfyApp } from '@comfyorg/comfyui-frontend-types';

declare module "/scripts/app.js" {
    export const app: ComfyApp;
}

declare module "/scripts/api.js" {
    export const api: ComfyApi;
}

// The frontend puts LiteGraph's classes on window for extensions (useGlobalLitegraph.ts, in 1.39.5 and 1.57.1).
declare global {
    const LGraphCanvas: typeof import('@comfyorg/comfyui-frontend-types').LGraphCanvas;
    const LGraphNode: typeof import('@comfyorg/comfyui-frontend-types').LGraphNode;
    const LiteGraph: import('@comfyorg/comfyui-frontend-types').LiteGraphGlobal;
}

export { };
