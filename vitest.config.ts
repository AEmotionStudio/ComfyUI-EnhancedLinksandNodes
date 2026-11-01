import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import vite from './vite.config';

export default defineConfig({
    define: vite.define,
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['tests/unit/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.d.ts',
                'src/**/types.ts',
                'src/extensions/**', // Entry points are integration, not unit
            ],
        },
    },
    resolve: {
        alias: [
            { find: '@', replacement: resolve(__dirname, 'src') },
            // ComfyUI serves these at runtime; tests get the fake.
            { find: /^\/scripts\/(app|api)\.js$/, replacement: resolve(__dirname, 'tests/helpers/fake-app.ts') },
        ],
    },
});
