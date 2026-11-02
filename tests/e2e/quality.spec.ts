// What keeps big graphs quick and good-looking: a busy graph's glowing links keep their glow while the view pans, as
// the glow layer moves along with it, and Perf.StaticAbove holds the links of a graph with too many on screen still.
// They come with the extensions, so the -native projects skip them.
import type { Page } from '@playwright/test';
import { perfGraph } from './fixtures/perf';
import { buildGraph, expect, openApp, readProbe, redraw, resetProbe, setSetting, slotPoint, test, type GraphSpec, type Point } from './helpers';

// Slow software rendering would otherwise have Perf.Adaptive draw the glows plain, or hold the links still.
test.use({ settings: { '🔗 Enhanced Links.Perf.Adaptive': false } });

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'the effects come with the extensions');
    await openApp(page);
});

/** Sixteen pairs of nodes one above another, each with a straight link across: more glowing links on screen than M4's 12. */
const rows: GraphSpec = {
    nodes: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [[`a${i}`, { type: 'ELNMix', pos: [100, 60 + 55 * i] }], [`b${i}`, { type: 'ELNMix', pos: [700, 60 + 55 * i] }]]).flat()),
    links: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`l${i}`, { from: `a${i}`, to: `b${i}` }])),
};

/** Draws both canvases now, after panning by (dx, dy) px, and reads the background canvas's RGBA at a graph point, as that frame drew it. */
const backAt = (page: Page, [x, y]: Point, [dx, dy]: Point = [0, 0]) => page.evaluate(([x, y, dx, dy]) => {
    const { canvas } = window.app;
    canvas.ds.offset[0] -= dx;
    canvas.ds.offset[1] -= dy;
    canvas.draw(true, true);
    const [cx, cy] = canvas.ds.convertOffsetToCanvas([x, y]);
    const ratio = canvas.bgcanvas.width / canvas.canvas.clientWidth;
    return [...canvas.bgcanvas.getContext('2d')!.getImageData(Math.floor(cx * ratio), Math.floor(cy * ratio), 1, 1).data];
}, [x, y, dx, dy]);

const furthest = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

test.describe('a busy graph', () => {
    test("keeps its links' glow halos while the view pans", async ({ page }) => {
        const graph = await buildGraph(page, rows);
        const middle = await slotPoint(page, graph.links.l7, 0.5);
        // In the glow, 4 px under the middle row's link, past its line.
        const halo: Point = [middle[0], middle[1] + 4];
        await redraw(page);
        await page.waitForTimeout(300);
        const settled = await backAt(page, halo);
        const panned = await backAt(page, halo, [7, 3]);
        await backAt(page, halo, [-7, -3]);
        // The same pixel without the glows: what M4 drew while the view moved.
        await setSetting(page, '🔗 Enhanced Links.Glow.Intensity', 0);
        await setSetting(page, '🔗 Enhanced Links.Link.Shadow.Enabled', false);
        const plain = await backAt(page, halo);
        expect(furthest(settled, plain), `settled ${settled}, plain ${plain}`).toBeGreaterThan(12);
        expect(furthest(panned, settled), `panned ${panned}, settled ${settled}`).toBeLessThanOrEqual(3);
    });
});

test.describe('Perf.StaticAbove', () => {
    test.setTimeout(120_000);

    /** Front paints a second without input. */
    async function paints(page: Page): Promise<number> {
        await page.waitForTimeout(500);
        await resetProbe(page);
        await page.waitForTimeout(1500);
        return (await readProbe(page)).front / 1.5;
    }

    /** Shows nearly all of the graph, at a zoom where links still animate (0.25 and up), or its top left corner at scale 1. */
    const view = (page: Page, whole: boolean) => page.evaluate((whole) => {
        const { canvas } = window.app;
        canvas.ds.scale = whole ? 0.26 : 1;
        canvas.ds.offset = whole ? [-80, -80] : [-40, -40];
        canvas.setDirty(true, true);
    }, whole);

    test('holds the links of a large graph still with more than 400 animated links on screen, and lets them move again with fewer or at 0', async ({ page }) => {
        await buildGraph(page, perfGraph(200, 500));
        await view(page, true);
        expect(await paints(page)).toBe(0);
        await view(page, false);
        expect(await paints(page)).toBeGreaterThan(5);
        await setSetting(page, '🔗 Enhanced Links.Perf.StaticAbove', 0);
        await view(page, true);
        expect(await paints(page)).toBeGreaterThan(5);
        expect(await page.evaluate(() => window.app.extensionManager.setting.get('🔗 Enhanced Links.Static.Mode'))).toBe(false);
    });
});
