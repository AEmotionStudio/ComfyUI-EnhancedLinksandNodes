// Type declaration for Vite CSS inline imports
declare module '*.css?inline' {
    const content: string;
    export default content;
}

/** The extension's version, from pyproject.toml (vite.config.ts). */
declare const __ELN_VERSION__: string;
