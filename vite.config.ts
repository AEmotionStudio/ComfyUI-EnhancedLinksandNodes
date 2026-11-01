import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/** The extension's version, which pyproject.toml gives the Comfy Registry; About shows it. */
const version = readFileSync(resolve(__dirname, 'pyproject.toml'), 'utf8').match(/^version = "(.+)"$/m)![1];

export default defineConfig({
    define: { __ELN_VERSION__: JSON.stringify(version) },
    build: {
        lib: {
            entry: {
                link_animations: resolve(__dirname, 'src/extensions/link-animations.ts'),
                node_animations: resolve(__dirname, 'src/extensions/node-animations.ts'),
            },
            formats: ['es'],
            fileName: (_, entryName) => `${entryName}.js`,
        },
        // Output to js/ for ComfyUI consumption
        outDir: 'js',
        emptyOutDir: true,
        minify: false, // Keep readable for debugging
        sourcemap: true,
        rollupOptions: {
            external: [
                // ComfyUI imports - these are resolved at runtime
                /^\/scripts\/.*/,
            ],
            output: {
                // Preserve the import paths for ComfyUI
                paths: {
                    '/scripts/app.js': '/scripts/app.js',
                    '/scripts/api.js': '/scripts/api.js',
                },
                chunkFileNames: 'chunks/[name]-[hash].js',
            },
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src'),
        },
    },
});
