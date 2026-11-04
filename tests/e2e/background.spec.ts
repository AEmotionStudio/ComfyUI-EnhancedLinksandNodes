// Node backgrounds in ComfyUI: a pattern from the GPU on each node's body below its title bar, under what native draws
// there, left off a node given None, a collapsed one and a node too far zoomed out; dimmed with a bypassed node;
// never flashing more than three times a second; back after a lost WebGL context; and none at all, with the panel
// saying why, where the browser has no WebGL. The e2e browser draws on the CPU, whose WebGL the backgrounds would turn
// down as slow, so these tests let it count. They come with the extensions, so the -native projects skip them.
import type { Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, expect, openApp, pageErrors, pixelAt, redraw, setSetting, test, type Point } from './helpers';

declare global {
    interface Window {
        /** The WebGL contexts the page made, through softwareGl(). */
        __elnGl?: WebGLRenderingContext[];
    }
}

/** Lets WebGL on the browser's software renderer count, and keeps each WebGL context the page makes. */
function softwareGl(): void {
    const { getContext } = OffscreenCanvas.prototype;
    OffscreenCanvas.prototype.getContext = function (this: OffscreenCanvas, kind: string, attributes?: WebGLContextAttributes) {
        const context = getContext.call(this, kind as '2d', kind === 'webgl' ? { ...attributes, failIfMajorPerformanceCaveat: false } : attributes);
        if (kind === 'webgl' && context) (window.__elnGl ??= []).push(context as unknown as WebGLRenderingContext);
        return context;
    } as typeof getContext;
}

/** A browser without WebGL. */
function noGl(): void {
    const { getContext } = OffscreenCanvas.prototype;
    OffscreenCanvas.prototype.getContext = function (this: OffscreenCanvas, kind: string, attributes?: unknown) {
        return kind === 'webgl' ? null : getContext.call(this, kind as '2d', attributes);
    } as typeof getContext;
}

const STILL = { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Background.Speed': 0, '📦 Enhanced Nodes.Background.Strength': 1 };
const BACKGROUND = '📦 Enhanced Nodes.Background';

/** Where to look on a node: low on its body, right of its slots, and on its title bar. */
function spots(page: Page, id: number): Promise<{ body: Point; title: Point }> {
    return page.evaluate((id) => {
        const node = window.app.canvas.graph.getNodeById(id);
        const [x, y] = node.pos;
        const [w, h] = node.size;
        return { body: [x + w - 12, y + h - 4] as Point, title: [x + w - 12, y - 8] as Point };
    }, id);
}

/** How far apart two colours are, channel by channel. */
const apart = (a: number[], b: number[]) => Math.max(...a.slice(0, 3).map((v, i) => Math.abs(v - b[i])));

test.beforeEach(async ({ profile }) => {
    test.skip(profile === 'native', 'node backgrounds are the extension’s');
});

test.describe('with WebGL', () => {
    test.use({ settings: STILL });
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(softwareGl);
        await openApp(page);
    });

    test('a pattern lies on each body below its title bar, not on a node given None, and fainter on a bypassed one', async ({ page, log }) => {
        const graph = await buildGraph(page, graphs.nodeStates);
        const ids = [graph.nodes.string, graph.nodes.image, graph.nodes.bypassed];
        const where = await Promise.all(ids.map((id) => spots(page, id)));
        await redraw(page);
        const native = await Promise.all(where.map(async (s) => [await pixelAt(page, s.body), await pixelAt(page, s.title)]));
        await page.evaluate((id) => (window.app.canvas.graph.getNodeById(id).properties.enhanced_fx_background = 'none'), graph.nodes.image);
        await setSetting(page, BACKGROUND, 'plasma');
        await redraw(page);
        const now = await Promise.all(where.map(async (s) => [await pixelAt(page, s.body), await pixelAt(page, s.title)]));
        const [string, none, bypassed] = now.map(([body, title], i) => ({ body: apart(body, native[i][0]), title: apart(title, native[i][1]) }));
        expect(string.body, 'a body with a background').toBeGreaterThan(20);
        expect([string.title, none.body, none.title, bypassed.title], 'title bars and a node given None').toEqual([0, 0, 0, 0]);
        // At the bypassed node's 0.2.
        expect(bypassed.body).toBeGreaterThan(0);
        expect(bypassed.body).toBeLessThan(string.body);
        expect(await page.evaluate(() => window.__elnGl?.length)).toBe(1);
        expect(pageErrors(log)).toEqual([]);
    });

    test('a collapsed node and one zoomed out below Perf.MinZoom draw none', async ({ page }) => {
        const graph = await buildGraph(page, graphs.nodeStates);
        const collapsed = await page.evaluate((id) => {
            const node = window.app.canvas.graph.getNodeById(id);
            return [node.pos[0] + 20, node.pos[1] - 15] as Point;
        }, graph.nodes.collapsed);
        await redraw(page);
        const before = await pixelAt(page, collapsed);
        await setSetting(page, BACKGROUND, 'grid');
        await redraw(page);
        expect(await pixelAt(page, collapsed)).toEqual(before);
        const { body } = await spots(page, graph.nodes.string);
        await page.evaluate(() => {
            window.app.canvas.ds.scale = 0.2;
            window.app.canvas.setDirty(true, true);
        });
        await redraw(page);
        const far = await pixelAt(page, body);
        await setSetting(page, BACKGROUND, 'none');
        await redraw(page);
        expect(await pixelAt(page, body)).toEqual(far);
    });

    test('no pattern flashes more than three times a second at the fastest speed', async ({ page }) => {
        test.setTimeout(120_000);
        await page.clock.install();
        await openApp(page);
        const graph = await buildGraph(page, graphs.nodeStates);
        await setSetting(page, '📦 Enhanced Nodes.Background.Speed', 3);
        await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
        const box = await page.evaluate((id) => {
            const { canvas } = window.app;
            const node = canvas.graph.getNodeById(id);
            const [x0, y0] = canvas.ds.convertOffsetToCanvas([node.pos[0], node.pos[1]]);
            const [x1, y1] = canvas.ds.convertOffsetToCanvas([node.pos[0] + node.size[0], node.pos[1] + node.size[1]]);
            return [x0, y0, x1, y1].map(Math.round);
        }, graph.nodes.string);
        for (const name of ['plasma', 'aurora', 'starfield', 'liquid', 'smoke', 'grid', 'lava', 'caustics']) {
            await setSetting(page, BACKGROUND, name);
            const light: number[] = [];
            for (let i = 0; i <= 60; i++) {
                await page.clock.runFor(1000 / 30);
                light.push(await page.evaluate(([x0, y0, x1, y1]) => {
                    const el: HTMLCanvasElement = window.app.canvas.canvas;
                    const ratio = el.width / el.clientWidth;
                    const data = el.getContext('2d')!.getImageData(Math.ceil(x0 * ratio), Math.ceil(y0 * ratio), Math.floor((x1 - x0) * ratio), Math.floor((y1 - y0) * ratio)).data;
                    let sum = 0;
                    for (let p = 0; p < data.length; p += 4) sum += 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
                    return sum / (data.length / 4);
                }, box));
            }
            // Turns of 10 % or more of the brightest: two make a flash.
            const least = 0.1 * Math.max(...light);
            for (let second = 0; second < 2; second++) {
                const run = light.slice(second * 30, second * 30 + 31);
                let [turns, way, extreme] = [0, 0, run[0]];
                for (const value of run) {
                    if ((value - extreme) * way > 0) extreme = value;
                    else if (Math.abs(value - extreme) >= least) {
                        if (way) turns++;
                        way = Math.sign(value - extreme);
                        extreme = value;
                    }
                }
                expect(turns / 2, `${name}, second ${second + 1}`).toBeLessThanOrEqual(3);
            }
        }
    });

    test('a lost WebGL context draws none for that pass, then the backgrounds come back', async ({ page, log }) => {
        const graph = await buildGraph(page, graphs.nodeStates);
        const { body } = await spots(page, graph.nodes.string);
        await redraw(page);
        const native = await pixelAt(page, body);
        await setSetting(page, BACKGROUND, 'lava');
        await redraw(page);
        expect(apart(await pixelAt(page, body), native)).toBeGreaterThan(0);
        await page.evaluate(() => window.__elnGl![0].getExtension('WEBGL_lose_context')!.loseContext());
        await redraw(page);
        expect(await pixelAt(page, body)).toEqual(native);
        await redraw(page);
        expect(apart(await pixelAt(page, body), native)).toBeGreaterThan(0);
        expect(await page.evaluate(() => window.__elnGl?.length)).toBe(2);
        expect(pageErrors(log)).toEqual([]);
    });
});

test.describe('without WebGL', () => {
    test.use({ settings: STILL });

    test('no node draws one, and the panel says why', async ({ page, log }) => {
        await page.addInitScript(noGl);
        await openApp(page);
        const graph = await buildGraph(page, graphs.nodeStates);
        const { body } = await spots(page, graph.nodes.string);
        await redraw(page);
        const native = await pixelAt(page, body);
        await setSetting(page, BACKGROUND, 'plasma');
        await redraw(page);
        expect(await pixelAt(page, body)).toEqual(native);
        await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'nodes', advanced: false, search: '' });
        await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
        await expect(page.locator('.eln .eln-notice').filter({ hasText: 'Node backgrounds need WebGL on a GPU' })).toBeVisible();
        expect(pageErrors(log)).toEqual([]);
    });
});
