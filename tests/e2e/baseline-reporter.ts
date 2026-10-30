import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * One measured configuration from perf.spec.ts. `idle*` cover at least 3 s without input (an animated
 * look still paints then); the paint costs at least 2 s each with both canvases marked dirty on every
 * frame, then only the front one. Rates use the time a sample really took.
 */
export interface PerfRow {
    graph: string;
    view: string;
    look: string;
    /** Paints per second. */
    idleFront: number;
    idleBack: number;
    /** Settings reads per second, inside paints or not. */
    idleReads: number;
    /** Tasks over 50 ms. */
    idleLongTasks: number;
    /** Paint durations in ms. The front paint includes rasterising the background canvas it copies. */
    front: { p50: number; p95: number };
    back: { p50: number; p95: number };
    /** Front paint durations in ms over an unchanged background, as in an animation frame: what the frame budgets measure. */
    frontOnly: { p50: number; p95: number };
    fps: number;
    /** Settings reads inside paints, per front paint. */
    readsPerFrame: number;
    renderLinkPerFrame: number;
}

/**
 * Merges the `baseline` attachments of perf.spec.ts into perf-baselines/perf-baseline.json, keyed by
 * project, and prints the perf rows. It sits outside test-results/, which every run clears; runs that
 * record nothing leave it alone.
 */
export default class BaselineReporter implements Reporter {
    private config!: FullConfig;
    private projects: Record<string, Record<string, unknown>> = {};

    onBegin(config: FullConfig): void {
        this.config = config;
    }

    onTestEnd(test: TestCase, result: TestResult): void {
        const project = test.parent.project()!.name;
        for (const attachment of result.attachments) {
            if (attachment.name !== 'baseline' || !attachment.body) continue;
            const record = (this.projects[project] ??= {});
            for (const [key, value] of Object.entries(JSON.parse(attachment.body.toString()))) {
                const previous = record[key];
                record[key] = Array.isArray(previous) && Array.isArray(value) ? [...previous, ...value] : value;
            }
        }
    }

    onEnd(): void {
        const names = Object.keys(this.projects).sort();
        if (!names.length) return;
        const file = path.join(path.dirname(this.config.configFile ?? ''), 'perf-baselines', 'perf-baseline.json');
        const projects = Object.fromEntries(names.map((name) => [name, this.projects[name]]));
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JSON.stringify({ date: new Date().toISOString(), workers: this.config.workers, projects }, null, 2));

        const header = ['project', 'graph', 'view', 'look', 'idle fg/s', 'idle bg/s', 'idle reads/s', 'idle long tasks',
            'dirty fps', 'front ms p50/p95', 'back ms p50/p95', 'front-only ms p50/p95', 'reads/frame', 'renderLink/frame'];
        const rows = names.flatMap((name) => ((this.projects[name].perf ?? []) as PerfRow[]).map((r) => [
            name, r.graph, r.view, r.look, r.idleFront, r.idleBack, r.idleReads, r.idleLongTasks, r.fps,
            `${r.front.p50} / ${r.front.p95}`, `${r.back.p50} / ${r.back.p95}`, `${r.frontOnly.p50} / ${r.frontOnly.p95}`,
            r.readsPerFrame, r.renderLinkPerFrame,
        ].map(String)));
        const widths = header.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)));
        const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join('  ');
        console.log(`\nPerf baseline (${file}, ${this.config.workers} worker${this.config.workers === 1 ? '' : 's'}):`);
        console.log([line(header), ...rows.map(line)].join('\n'));
        for (const name of names) {
            const other = Object.entries(this.projects[name]).filter(([key]) => key !== 'perf');
            if (other.length) console.log(`${name}: ${JSON.stringify(Object.fromEntries(other))}`);
        }
    }
}
