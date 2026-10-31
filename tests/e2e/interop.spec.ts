// Other extensions next to ours, on the interop leg (1.57.1 with KJNodes and MagnifyGlass): a stand-in for LinkFX
// wrapping renderLink before and after us, KJNodes' Set/Get links, a legacy Reroute node, and MagnifyGlass held
// over links. They run only on that leg:
//   pnpm e2e --project interop
import type { Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import {
    blankPixels,
    buildGraph,
    expect,
    linkColour,
    openApp,
    pixelAt,
    redraw,
    setSetting,
    settle,
    slotPoint,
    test,
    toClient,
    type PageLog,
    type Point,
} from './helpers';

declare global {
    interface Window {
        __fakeLinkFX: Drawn;
        __native: Drawn;
        __magnified: number;
        __magnifyGlassCapturing?: boolean;
    }
}

/** The segments that reached a renderLink wrapper or the link adapter, as `link:reroute`, and how many of them were drawn on the background canvas. */
interface Drawn {
    segments: string[];
    onBackground: number;
}

/** graphs.mixed's segments: one per link, two through the reroute, and the floating one. */
const MIXED_SEGMENTS = 7;

const STEP_ASIDE = 'Link effects left to another extension';

/** Pixels within `tolerance` per channel, which allows for antialiasing. */
const near = (a: number[], b: number[], tolerance = 16) => a.every((v, i) => Math.abs(v - b[i]) <= tolerance);

/**
 * A stand-in for LinkFX, which wraps renderLink in its init(), before any setup(), and leaves drawConnections native:
 * each call notes its segment, then goes on. 'first' puts it in place when the frontend publishes LGraphCanvas, before
 * any extension loads; 'last' over ours, on the loaded page.
 */
function fakeLinkFX(order: 'first' | 'last'): void {
    const drawn: Drawn = (window.__fakeLinkFX = { segments: [], onBackground: 0 });
    const wrap = (proto: any) => {
        const renderLink = proto.renderLink;
        proto.renderLink = function (this: any, ...args: any[]) {
            drawn.segments.push(`${args[3]?.id ?? null}:${args[9]?.reroute?.id ?? ''}`);
            if (args[0] === this.bgctx) drawn.onBackground++;
            return renderLink.apply(this, args);
        };
    };
    if (order === 'last') return wrap(window.LGraphCanvas.prototype);
    let LGraphCanvas: any;
    Object.defineProperty(window, 'LGraphCanvas', {
        configurable: true,
        get: () => LGraphCanvas,
        set(value) {
            if (!LGraphCanvas) wrap(value.prototype);
            LGraphCanvas = value;
        },
    });
}

/** From now on, notes each segment the frontend's link adapter draws, as fakeLinkFX does. */
function watchNative(page: Page): Promise<void> {
    return page.evaluate(() => {
        const { canvas } = window.app;
        const drawn: Drawn = (window.__native = { segments: [], onBackground: 0 });
        // The prototype, since the canvas makes a new adapter for each graph it shows.
        const adapter = Object.getPrototypeOf(canvas.linkRenderer);
        const renderLinkDirect = adapter.renderLinkDirect;
        adapter.renderLinkDirect = function (this: unknown, ...args: any[]) {
            drawn.segments.push(`${args[3]?.id ?? null}:${args[10]?.reroute?.id ?? ''}`);
            if (args[0] === canvas.bgctx) drawn.onBackground++;
            return renderLinkDirect.apply(this, args);
        };
    });
}

/**
 * Redraws both canvases, then returns what the background passes since then handed renderLink (the probe sees each call
 * first, as it wraps ours), the fake LinkFX if it is there, and the link adapter. All three start counting at once.
 */
function drawnOnce(page: Page): Promise<{ back: number; renderLink: string[]; linkFX?: Drawn; native: Drawn }> {
    return page.evaluate(() => new Promise((resolve) => {
        const probe = window.__eln;
        const watched = [window.__fakeLinkFX, window.__native].filter(Boolean);
        for (const drawn of watched) {
            drawn.segments = [];
            drawn.onBackground = 0;
        }
        probe.segments = [];
        probe.back = 0;
        window.app.canvas.setDirty(true, true);
        const check = () => {
            if (!probe.back) return requestAnimationFrame(check);
            const renderLink = probe.segments.map((s) => `${s.link}:${s.reroute ?? ''}`);
            resolve({ back: probe.back, renderLink, linkFX: window.__fakeLinkFX, native: window.__native });
        };
        requestAnimationFrame(check);
    }));
}

/** Paints of each canvas during `ms`. */
function paints(page: Page, ms: number): Promise<{ front: number; back: number }> {
    return page.evaluate(async (ms) => {
        const probe = window.__eln;
        const [front, back] = [probe.front, probe.back];
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { front: probe.front - front, back: probe.back - back };
    }, ms);
}

/**
 * What this leg logs as errors without us: KJNodes registers its spline and point editors twice on 1.57.1, the
 * frontend asks for optional user files that are not there, and --offline blocks the startup template's model downloads.
 */
const NOISE = [/Extension named 'KJNodes\.\w+' already registered/, /Failed to load resource: the server responded with a status of 404/, /Content Security Policy|Refused to connect/];

/** Every error the page threw or logged, but the leg's own noise. */
function errors(log: PageLog): string[] {
    return [...log.errors, ...log.counts.filter((m) => m.type === 'error').map((m) => `${m.url}: ${m.text}`)]
        .filter((e) => !NOISE.some((noise) => noise.test(e)));
}

/** Toasts on screen that say `text`: 1.57 renders them with reka-ui, 1.39.5 with PrimeVue. */
const toasts = (page: Page, text: string) => page.locator('[data-testid=toast], .p-toast-message').filter({ hasText: text });

test.describe('other extensions', { tag: '@interop' }, () => {
    test.describe('a LinkFX-like renderLink wrapper put in place before ours', () => {
        // Link effects start off, so we would first draw links, and step aside, when a test turns them on.
        test.use({ settings: { '🔗 Enhanced Links.Animate': 0 } });

        test.beforeEach(async ({ page }) => {
            await page.addInitScript(fakeLinkFX, 'first' as const);
            await openApp(page);
            await buildGraph(page, graphs.mixed);
            await watchNative(page);
        });

        test('is left to draw every link, once per segment, and we say so once', async ({ page, log }) => {
            await setSetting(page, '🔗 Enhanced Links.Animate', 9);
            await expect(toasts(page, STEP_ASIDE)).toHaveCount(1);
            const drawn = await drawnOnce(page);
            expect(new Set(drawn.native.segments).size).toBe(MIXED_SEGMENTS);
            expect(drawn.native.segments).toHaveLength(MIXED_SEGMENTS * drawn.back);
            // Each renderLink call reached it once and native once, on the background canvas.
            expect(drawn.linkFX!.segments).toEqual(drawn.renderLink);
            expect(drawn.native.segments).toEqual(drawn.renderLink);
            expect([drawn.linkFX!.onBackground, drawn.native.onBackground]).toEqual([drawn.renderLink.length, drawn.renderLink.length]);
            // Nothing of ours moves, so the canvas goes idle.
            expect(await settle(page, 500, 5000)).toBe(true);
            expect(await paints(page, 2000)).toEqual({ front: 0, back: 0 });
            expect(errors(log)).toEqual([]);
        });

        test('draws ours anyway with Keep Enhanced link effects, through it once per segment', async ({ page, log }) => {
            await setSetting(page, '🔗 Enhanced Links.Coexist', 'ours');
            await setSetting(page, '🔗 Enhanced Links.Animate', 9);
            const drawn = await drawnOnce(page);
            expect(new Set(drawn.native.segments).size).toBe(MIXED_SEGMENTS);
            expect(drawn.linkFX!.segments).toEqual(drawn.renderLink);
            expect(drawn.native.segments).toEqual(drawn.renderLink);
            // Only the floating segment reaches it and native on the background; the calls for the segments we draw run on a canvas nobody sees.
            expect([drawn.linkFX!.onBackground, drawn.native.onBackground]).toEqual([drawn.back, drawn.back]);
            await page.waitForTimeout(500);
            const animated = await paints(page, 1000);
            expect(animated.front).toBeGreaterThan(0);
            expect(animated.back).toBe(0);
            await expect(toasts(page, STEP_ASIDE)).toHaveCount(0);
            expect(errors(log)).toEqual([]);
        });
    });

    test('a LinkFX-like renderLink wrapper put in place after ours draws next to it, once per segment', async ({ page, log }) => {
        await openApp(page);
        await page.evaluate(fakeLinkFX, 'last' as const);
        await buildGraph(page, graphs.mixed);
        await watchNative(page);
        const drawn = await drawnOnce(page);
        expect(new Set(drawn.native.segments).size).toBe(MIXED_SEGMENTS);
        expect(drawn.linkFX!.segments).toEqual(drawn.renderLink);
        expect(drawn.native.segments).toEqual(drawn.renderLink);
        // It wraps ours, so it gets every call on the background canvas; native draws only the floating segment there.
        expect([drawn.linkFX!.onBackground, drawn.native.onBackground]).toEqual([drawn.renderLink.length, drawn.back]);
        await page.waitForTimeout(500);
        const animated = await paints(page, 1000);
        expect(animated.front).toBeGreaterThan(0);
        expect(animated.back).toBe(0);
        await expect(toasts(page, STEP_ASIDE)).toHaveCount(0);
        expect(errors(log)).toEqual([]);
    });

    test.describe('with KJNodes showing every Set/Get link', () => {
        test.use({ settings: { 'KJNodes.showSetGetLinks': 'always' } });

        test('its virtual links are drawn natively next to ours', async ({ page, log }) => {
            await openApp(page);
            const graph = await buildGraph(page, graphs.setGet);
            await watchNative(page);
            const drawn = await drawnOnce(page);
            // Per background pass: the virtual link (no link) on the background canvas, and our two links on the hidden one.
            const perPass = ['null:', `${graph.links.set}:`, `${graph.links.get}:`];
            expect([...drawn.native.segments].sort()).toEqual(Array.from({ length: drawn.back }, () => perPass).flat().sort());
            expect(drawn.native.onBackground).toBe(drawn.back);
            // KJNodes joins the Set node's output to the Get node's first slot; a spline with mirrored controls passes their midpoint.
            const middle = await page.evaluate(({ set, get }) => {
                const graph = window.app.canvas.graph;
                const a = graph.getNodeById(set).getConnectionPos(false, 0);
                const b = graph.getNodeById(get).getConnectionPos(true, 0);
                return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Point;
            }, graph.nodes);
            const shown = await pixelAt(page, middle);
            const [blank] = await blankPixels(page, [middle]);
            expect(shown).not.toEqual(blank);
            expect(errors(log)).toEqual([]);
        });
    });

    test('links through a legacy Reroute node are ours and keep their native colour', async ({ page, log }) => {
        await openApp(page);
        const graph = await buildGraph(page, graphs.legacyReroute);
        await watchNative(page);
        const drawn = await drawnOnce(page);
        expect(new Set(drawn.native.segments)).toEqual(new Set([`${graph.links.in}:`, `${graph.links.out}:`]));
        expect(drawn.native.onBackground).toBe(0);
        const wrong: string[] = [];
        for (const [name, id] of Object.entries(graph.links)) {
            const [shown, colour] = [await pixelAt(page, await slotPoint(page, id, 0.5)), await linkColour(page, id)];
            if (!near(shown, colour)) wrong.push(`${name}: drawn ${shown}, link colour ${colour}`);
        }
        expect(wrong).toEqual([]);
        expect(errors(log)).toEqual([]);
    });

    test('MagnifyGlass held over links draws the canvas again without breaking ours', async ({ page, log }) => {
        await openApp(page);
        const graph = await buildGraph(page, graphs.pair);
        // Below 100% its glass draws the canvas again at 100%, then at the view's zoom (OffscreenRenderer.js renderVirtualZoom).
        // With links on top, only our onDrawForeground draws the moving link, and MagnifyGlass's highlighter wraps that hook.
        await page.evaluate(() => {
            const { canvas } = window.app;
            canvas.graph.config.links_ontop = true;
            canvas.ds.scale = 0.8;
            canvas.ds.offset = [100, 100];
            canvas.setDirty(true, true);
            window.__magnified = 0;
            const draw = canvas.draw;
            canvas.draw = function (this: unknown, ...args: unknown[]) {
                if (window.__magnifyGlassCapturing) window.__magnified++;
                return draw.apply(this, args);
            };
        });
        const centre = await slotPoint(page, graph.links.int, 0.5);
        const [x, y] = await toClient(page, centre);
        await page.mouse.move(x, y);
        // Its activation key; the glass stays on until the key is pressed again.
        await page.keyboard.press('x');
        await page.mouse.move(x + 40, y, { steps: 10 });
        await page.waitForTimeout(1500);
        await page.keyboard.press('x');
        expect(await page.evaluate(() => window.__magnified)).toBeGreaterThan(0);
        expect(await page.evaluate(() => String(window.app.canvas.onDrawForeground))).toContain('updateHighlightPosition');

        await redraw(page);
        const [shown, colour] = [await pixelAt(page, centre), await linkColour(page, graph.links.int)];
        expect(near(shown, colour), `drawn ${shown}, link colour ${colour}`).toBe(true);
        await page.waitForTimeout(500);
        const animated = await paints(page, 1000);
        expect(animated.front).toBeGreaterThan(0);
        expect(animated.back).toBe(0);
        await expect(toasts(page, 'turned off')).toHaveCount(0);

        await setSetting(page, '🔗 Enhanced Links.Animate', 0);
        expect(await settle(page, 500, 5000)).toBe(true);
        expect(await paints(page, 2000)).toEqual({ front: 0, back: 0 });
        expect(errors(log)).toEqual([]);
    });
});
