// Baselines for native ComfyUI (-native projects), the checkout (fe157 and fe1395), v2.0.1 (v2-ref)
// and v1 (v1-ref), the last two built from git. A test fails only if the page breaks, but the run
// fails when the checkout's default look adds more than its budget to native's front paint, or its
// animated frames leave more than theirs on the heap. baseline-reporter.ts writes them to
// perf-baselines/perf-baseline.json and prints a table, with each look's front-paint overhead over
// native. They only run with ELN_PERF=1, which also runs every test in one worker, so the projects do
// not share the CPU:
//   pnpm e2e:perf
// Chromium draws with SwiftShader unless ELN_GPU=1 hands it the GPU, for frame rates that mean something:
//   ELN_GPU=1 ELN_PERF=1 pnpm e2e --grep "frame rate"
import type { Page, TestInfo } from '@playwright/test';
import type { FrameRateRow, PerfRow } from './baseline-reporter';
import * as graphs from './fixtures/graphs';
import { perfGraph } from './fixtures/perf';
import {
    buildGraph,
    connectionPosEnds,
    distance,
    expect,
    linkColour,
    openApp,
    pixelAt,
    readProbe,
    recordConnectionPos,
    redraw,
    resetProbe,
    setSetting,
    slotPoint,
    test,
    vueSlotCentres,
    type LogMessage,
    type Point,
} from './helpers';

/** Settings over the profile's defaults; the -native projects only measure `native`. */
const LOOKS: Record<string, Record<string, unknown>> = {
    default: {},
    off: { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 0 },
};

/** The looks whose frame rate is measured, each over the defaults: the default look without its glow, and three animations whose strokes glow. */
const ANIMATED: Record<string, Record<string, unknown>> = {
    default: {},
    'default without glow': { '🔗 Enhanced Links.Glow.Intensity': 0, '🔗 Enhanced Links.Marker.Glow': 0 },
    'Sacred Flow': { '🔗 Enhanced Links.Animate': 1 },
    'DNA Helix': { '🔗 Enhanced Links.Animate': 6 },
    'Lava Flow': { '🔗 Enhanced Links.Animate': 7 },
};

interface Sample {
    /** How long the sample really took: a slow frame stretches it past the requested time. */
    seconds: number;
    front: number;
    back: number;
    frontMs: number[];
    backMs: number[];
    dirty: { setDirty: number; setDirtyCanvas: number };
    reads: number;
    readsInPaint: number;
    renderLink: number;
    longTasks: number;
}

const round = (value: number) => Math.round(value * 10) / 10;

function percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    return round(sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? NaN);
}

function hex(rgba: number[]): string {
    return `#${rgba.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function record(testInfo: TestInfo, values: Record<string, unknown>): Promise<void> {
    return testInfo.attach('baseline', { body: JSON.stringify(values), contentType: 'application/json' });
}

/**
 * Counts paints, settings reads and long tasks for `ms`, optionally marking canvases dirty every frame, as setDirty(front, back),
 * and panning the view a pixel a frame.
 */
async function sample(page: Page, ms: number, dirty?: [front: boolean, back: boolean], pan = false): Promise<Sample> {
    await resetProbe(page);
    return page.evaluate(async ([ms, dirty, pan]) => {
        let longTasks = 0;
        const observer = new PerformanceObserver((list) => {
            longTasks += list.getEntries().length;
        });
        observer.observe({ type: 'longtask' });
        const start = performance.now();
        const end = start + ms;
        await new Promise<void>((resolve) => {
            const frame = () => {
                if (performance.now() >= end) return resolve();
                if (pan) window.app.canvas.ds.offset[0] -= 1;
                if (dirty) window.app.canvas.setDirty(...dirty);
                requestAnimationFrame(frame);
            };
            frame();
        });
        longTasks += observer.takeRecords().length;
        observer.disconnect();
        const seconds = (performance.now() - start) / 1000;
        const { front, back, frontMs, backMs, dirty: requests, reads, renderLink } = window.__eln;
        return { seconds, front, back, frontMs, backMs, dirty: requests, reads: reads.getSettingValue + reads.settingGet, readsInPaint: reads.inPaint, renderLink, longTasks };
    }, [ms, dirty, pan] as const);
}

/**
 * Paints and redraw requests over 3 s without input, then paint costs over 2 s with every frame dirty and 2 s with only the
 * front dirty, then the front paints a second over 2 s of panning, which leaves the view a little off where it was.
 */
async function measure(page: Page): Promise<Omit<PerfRow, 'frontend' | 'graph' | 'view' | 'look'>> {
    await page.waitForTimeout(1000);
    const idle = await sample(page, 3000);
    const forced = await sample(page, 2000, [true, true]);
    const frontOnly = await sample(page, 2000, [true, false]);
    const panned = await sample(page, 2000, [true, true], true);
    return {
        idleFront: round(idle.front / idle.seconds),
        idleBack: round(idle.back / idle.seconds),
        idleSetDirty: round(idle.dirty.setDirty / idle.seconds),
        idleSetDirtyCanvas: round(idle.dirty.setDirtyCanvas / idle.seconds),
        idleReads: Math.round(idle.reads / idle.seconds),
        idleLongTasks: idle.longTasks,
        front: { p50: percentile(forced.frontMs, 0.5), p95: percentile(forced.frontMs, 0.95) },
        back: { p50: percentile(forced.backMs, 0.5), p95: percentile(forced.backMs, 0.95) },
        frontOnly: { p50: percentile(frontOnly.frontMs, 0.5), p95: percentile(frontOnly.frontMs, 0.95) },
        fps: round(forced.front / forced.seconds),
        panFps: round(panned.front / panned.seconds),
        readsPerFrame: forced.front ? Math.round(forced.readsInPaint / forced.front) : 0,
        renderLinkPerFrame: forced.back ? Math.round(forced.renderLink / forced.back) : 0,
    };
}

/** `zoom 1` shows the top-left corner of the graph at scale 1; `fit` scales the whole graph into view. */
function setView(page: Page, view: string): Promise<void> {
    return page.evaluate((view) => {
        const { canvas } = window.app;
        const { LiteGraph } = window;
        if (view === 'fit') {
            let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity];
            for (const node of canvas.graph._nodes) {
                left = Math.min(left, node.pos[0]);
                top = Math.min(top, node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT);
                right = Math.max(right, node.pos[0] + node.size[0]);
                bottom = Math.max(bottom, node.pos[1] + node.size[1]);
            }
            const { clientWidth: width, clientHeight: height } = canvas.canvas;
            const scale = 0.95 * Math.min(width / (right - left), height / (bottom - top));
            canvas.ds.scale = scale;
            canvas.ds.offset = [width / 2 / scale - (left + right) / 2, height / 2 / scale - (top + bottom) / 2];
        } else {
            canvas.ds.scale = 1;
            canvas.ds.offset = [0, 0];
        }
        canvas.setDirty(true, true);
    }, view);
}

test.describe('baselines', { tag: '@perf' }, () => {
    test.beforeEach(async ({ page }) => {
        // v1 passes a default to every getSettingValue and the frontend warns about each one: over 10k
        // messages a frame, each serialised to Playwright, which would dominate v1's paint times.
        await page.addInitScript(() => {
            const warn = console.warn;
            console.warn = (...args: unknown[]) => {
                if (!String(args[0]).startsWith('Parameter defaultValue is deprecated')) warn(...args);
            };
        });
        await openApp(page);
    });

    for (const { nodes, links, views } of [
        { nodes: 200, links: 500, views: ['zoom 1', 'fit'] },
        { nodes: 40, links: 100, views: ['fit'] },
    ]) {
        test(`paints with ${links} links and ${nodes} nodes`, async ({ page, profile, frontend }, testInfo) => {
            test.setTimeout(300_000);
            await buildGraph(page, perfGraph(nodes, links));
            const rows: PerfRow[] = [];
            for (const look of profile === 'native' ? ['native'] : Object.keys(LOOKS)) {
                for (const [id, value] of Object.entries(LOOKS[look] ?? {})) await setSetting(page, id, value);
                for (const view of views) {
                    await setView(page, view);
                    rows.push({ frontend, graph: `${links}x${nodes}`, view, look, ...(await measure(page)) });
                }
            }
            await record(testInfo, { perf: rows });
        });
    }

    // How fast each look animates by itself on the big graph at zoom 1: the front paints a second the ticker asks for over
    // 5 s without input, the long tasks in that time, and the renderer Chromium draws with (see ELN_GPU in playwright.config.ts).
    test('frame rate while animating', async ({ page, profile }, testInfo) => {
        test.skip(profile === 'native', 'native ComfyUI paints only on input');
        test.setTimeout(300_000);
        await buildGraph(page, perfGraph(200, 500));
        await setView(page, 'zoom 1');
        const renderer = await page.evaluate(() => {
            const gl = document.createElement('canvas').getContext('webgl');
            const info = gl?.getExtension('WEBGL_debug_renderer_info');
            return info ? String(gl!.getParameter(info.UNMASKED_RENDERER_WEBGL)) : 'unknown';
        });
        const rows: FrameRateRow[] = [];
        for (const [look, settings] of Object.entries(ANIMATED)) {
            const ids = Object.keys(settings);
            const before = await page.evaluate((ids) => ids.map((id) => window.app.extensionManager.setting.get(id)), ids);
            for (const id of ids) await setSetting(page, id, settings[id]);
            await page.waitForTimeout(1000);
            const s = await sample(page, 5000);
            rows.push({
                renderer,
                look,
                fps: round(s.front / s.seconds),
                backPerSecond: round(s.back / s.seconds),
                front: { p50: percentile(s.frontMs, 0.5), p95: percentile(s.frontMs, 0.95) },
                longTasks: s.longTasks,
            });
            for (const [i, id] of ids.entries()) await setSetting(page, id, before[i]);
        }
        await record(testInfo, { frameRate: rows });
    });

    // What 120 frames of DNA Helix on every link on screen leave on the heap once garbage is collected (budget 2 MB, judged
    // by the median of three runs), and how much it grew before that collection, which minor collections during the frames
    // make a lower bound.
    test('heap after 120 animated frames', async ({ page, profile }, testInfo) => {
        test.setTimeout(300_000);
        await buildGraph(page, perfGraph(200, 500));
        if (profile !== 'native') await setSetting(page, '🔗 Enhanced Links.Animate', 6);
        await setView(page, 'zoom 1');
        await page.waitForTimeout(1000);
        const cdp = await page.context().newCDPSession(page);
        const heap = async (collect: boolean) => {
            if (collect) await cdp.send('HeapProfiler.collectGarbage');
            return (await cdp.send('Runtime.getHeapUsage')).usedSize / 2 ** 20;
        };
        const runs: { seconds: number; beforeMB: number; grownMB: number; retainedMB: number }[] = [];
        for (let run = 0; run < 3; run++) {
            const before = await heap(true);
            // Both canvases dirty every frame until the front one has painted 120 times.
            const seconds = await page.evaluate(() => new Promise<number>((resolve) => {
                const probe = window.__eln;
                const [painted, start] = [probe.front + 120, performance.now()];
                const frame = () => {
                    if (probe.front >= painted) return resolve((performance.now() - start) / 1000);
                    window.app.canvas.setDirty(true, true);
                    requestAnimationFrame(frame);
                };
                frame();
            }));
            const grown = await heap(false);
            const after = await heap(true);
            runs.push({ seconds: round(seconds), beforeMB: round(before), grownMB: round(grown - before), retainedMB: round(after - before) });
        }
        const retainedMB = [...runs].sort((a, b) => a.retainedMB - b.retainedMB)[1].retainedMB;
        await record(testInfo, { heap: { look: profile === 'native' ? 'native' : 'Animate 6', retainedMB, runs } });
    });

    test('link colours', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, graphs.typed);
        await redraw(page);
        const colours: Record<string, { native: string; drawn: string }> = {};
        for (const [name, id] of Object.entries(graph.links)) {
            // The most common of three samples, so a decoration passing one of them does not count.
            const drawn: string[] = [];
            for (const t of [0.3, 0.5, 0.7]) drawn.push(hex(await pixelAt(page, await slotPoint(page, id, t))));
            const mode = drawn.find((c) => drawn.filter((d) => d === c).length > 1) ?? drawn.join(' ');
            colours[name] = { native: hex(await linkColour(page, id)), drawn: mode };
        }
        await record(testInfo, { linkColours: colours });
    });

    test('styles that build gradients from link colours', async ({ page, profile, log }, testInfo) => {
        test.skip(profile === 'native', 'needs the extension');
        await buildGraph(page, graphs.typed);
        const styles: Record<string, Record<string, unknown>> = {
            'Lava Flow': { '🔗 Enhanced Links.Animate': 7, '🔗 Enhanced Links.Link.Style': 'spline' },
            Pulse: { '🔗 Enhanced Links.Animate': 9, '🔗 Enhanced Links.Link.Style': 'pulse' },
            Holographic: { '🔗 Enhanced Links.Animate': 9, '🔗 Enhanced Links.Link.Style': 'holographic' },
        };
        const ours = (m: LogMessage) => m.type === 'error' && m.url.includes('/extensions/');
        const results: Record<string, object> = {};
        for (const [name, settings] of Object.entries(styles)) {
            for (const [id, value] of Object.entries(settings)) await setSetting(page, id, value);
            await page.waitForTimeout(500);
            const before = log.counts.map((m) => m.count);
            const { back, renderLink } = await sample(page, 1000);
            const errors = log.counts.flatMap((m, i) => (ours(m) && m.count > (before[i] ?? 0) ? [{ text: m.text, count: m.count - (before[i] ?? 0) }] : []));
            results[name] = {
                backPaints: back,
                renderLinkPerPaint: back ? round(renderLink / back) : 0,
                errors: errors.reduce((sum, e) => sum + e.count, 0),
                error: errors[0]?.text.slice(0, 160) ?? null,
            };
        }
        await record(testInfo, { gradientStyles: results });
    });

    test('canvas colour parsing', async ({ page }, testInfo) => {
        const parsing = await page.evaluate(() => {
            const ctx = document.createElement('canvas').getContext('2d')!;
            const gradient = ctx.createLinearGradient(0, 0, 1, 1);
            const addColorStop = (colour: unknown) => {
                try {
                    gradient.addColorStop(0, colour as string);
                    return 'accepted';
                } catch (error) {
                    return (error as Error).name;
                }
            };
            ctx.strokeStyle = '#123456';
            ctx.strokeStyle = '';
            return {
                addColorStopEmpty: addColorStop(''),
                addColorStopObject: addColorStop({ input_off: '#778' }),
                addColorStopHex: addColorStop('#9A9'),
                strokeStyleAfterEmpty: ctx.strokeStyle,
            };
        });
        await record(testInfo, { canvasColourParsing: parsing });
    });

    test.describe('Vue nodes', () => {
        test.use({ settings: { 'Comfy.VueNodes.Enabled': true } });

        test('where link ends are drawn', async ({ page }, testInfo) => {
            const graph = await buildGraph(page, graphs.pair);
            await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(2);
            await recordConnectionPos(page);
            const dots = async (): Promise<[Point, Point]> => [
                (await vueSlotCentres(page, graph.nodes.source)).outputs[0],
                (await vueSlotCentres(page, graph.nodes.target)).inputs[0],
            ];
            // Wait until the layout store has the DOM positions.
            await expect.poll(async () => {
                const [output] = await dots();
                const layout = await page.evaluate((id) => [...window.app.canvas.graph.getNodeById(id).getOutputPos(0)] as Point, graph.nodes.source);
                return distance(output, layout) < 1;
            }).toBe(true);
            await resetProbe(page);
            await redraw(page);
            const [output, input] = await dots();
            const segment = (await readProbe(page)).segments.find((s) => s.link === graph.links.int);
            const offsets = (ends: Point[] | null | undefined) => ends?.map((end, i) => {
                const dot = [output, input][i];
                return { dx: round(end[0] - dot[0]), dy: round(end[1] - dot[1]), distance: round(distance(end, dot)) };
            }) ?? null;
            await record(testInfo, {
                vueLinkEnds: { renderLink: offsets(segment && [segment.a, segment.b]), getConnectionPos: offsets(await connectionPosEnds(page, graph.links.int)) },
            });
        });
    });
});
