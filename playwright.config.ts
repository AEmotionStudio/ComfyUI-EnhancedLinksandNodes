import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
import type { LegOptions } from './tests/e2e/helpers';

// Each leg is an isolated ComfyUI started by tests/e2e/serve.mjs. Every leg serves a `default` user
// (extensions enabled) and a `native` one (both disabled), so a project is a leg plus a profile.
interface Leg {
    port: number;
    frontend: string;
}

const legs: Record<string, Leg> = JSON.parse(readFileSync(new URL('./tests/e2e/legs.json', import.meta.url), 'utf8'));

// @perf baselines are slow and want the CPU to themselves, so they only run with ELN_PERF=1 (pnpm e2e:perf),
// which also runs every test in one worker.
const perf = process.env.ELN_PERF === '1';

// The reference builds and interop only run the tests tagged for them.
const projects: { name: string; leg: string; profile: string; only?: string }[] = [
    { name: 'fe157-native', leg: 'fe157', profile: 'native' },
    { name: 'fe157', leg: 'fe157', profile: 'default' },
    { name: 'fe1395-native', leg: 'fe1395', profile: 'native' },
    { name: 'fe1395', leg: 'fe1395', profile: 'default' },
    { name: 'v2-ref', leg: 'v2-ref', profile: 'default', only: '@perf' },
    { name: 'v1-ref', leg: 'v1-ref', profile: 'default', only: '@perf' },
    { name: 'interop', leg: 'interop', profile: 'default', only: '@interop' },
];

// Playwright starts every webServer regardless of --project, so only start the legs the selected projects use.
function requestedProjects(argv: string[]): RegExp[] {
    const names: string[] = [];
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith('--project=')) names.push(argv[i].slice('--project='.length));
        else if (argv[i] === '--project') while (argv[i + 1] && !argv[i + 1].startsWith('-')) names.push(argv[++i]);
    }
    return names.map((name) => new RegExp(`^${name.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*')}$`, 'i'));
}

// Without --project, a tagged project only counts when its tests can run; there are no @interop tests yet.
const requested = requestedProjects(process.argv);
const selected = projects.filter((p) =>
    requested.length ? requested.some((r) => r.test(p.name)) : !p.only || (p.only === '@perf' && perf),
);
const chromium = '/usr/bin/chromium';

export default defineConfig<LegOptions>({
    testDir: './tests/e2e',
    outputDir: './test-results',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    workers: perf ? 1 : undefined,
    forbidOnly: !!process.env.CI,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }], ['./tests/e2e/baseline-reporter.ts']],
    use: {
        browserName: 'chromium',
        launchOptions: {
            ...(existsSync(chromium) ? { executablePath: chromium } : {}),
            // The page is already held to the leg by ComfyUI's --offline CSP; this keeps the browser's own
            // background fetches (optimization guides, component updates) off the network too.
            args: ['--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=127.0.0.1'],
        },
        viewport: { width: 1600, height: 900 },
        deviceScaleFactor: 1,
        locale: 'en-US',
        // Archiving a trace of the app page stalls until the test timeout with Playwright 1.57 and Chromium 153.
        trace: 'off',
        screenshot: 'only-on-failure',
    },
    projects: projects.map(({ name, leg, profile, only }) => {
        const skipped = [profile === 'native' ? '' : '@native', perf ? '' : '@perf'].filter(Boolean);
        return {
            name,
            workers: 1,
            grep: only ? new RegExp(only) : undefined,
            grepInvert: skipped.length ? new RegExp(skipped.join('|')) : undefined,
            use: { baseURL: `http://127.0.0.1:${legs[leg].port}`, profile, frontend: legs[leg].frontend },
        };
    }),
    webServer: [...new Set(selected.map((p) => p.leg))].map((leg) => ({
        name: leg,
        command: `node tests/e2e/serve.mjs ${leg}`,
        url: `http://127.0.0.1:${legs[leg].port}/`,
        env: { ELN_E2E_PARENT: String(process.pid) },
        // A server already on the port is only used if it passes the isolation check in helpers.ts.
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        gracefulShutdown: { signal: 'SIGTERM', timeout: 15_000 },
        stdout: 'pipe',
    })),
});
