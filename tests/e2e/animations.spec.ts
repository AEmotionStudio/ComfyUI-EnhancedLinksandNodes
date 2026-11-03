// v3's own link animations in ComfyUI: Merkaba Beads, DNA Helix 3D and Comet Trails each move along a link and hold
// still in Static mode; the panel's gallery shows a live tile of each; the Sacred Geometry look draws Merkaba Beads and
// Flower of Life; and
// comets fly along a physics wire. They come with the extensions, so the -native projects skip them.
import type { Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, expect, openApp, redraw, setSetting, settingValues, settle, slotPoint, test, type Point } from './helpers';

declare global {
    interface Window {
        __elnHeads: Point[];
    }
}

const ANIMATE = '🔗 Enhanced Links.Animate';
const STATIC = '🔗 Enhanced Links.Static.Mode';
const NEW: [number, string][] = [[10, 'Merkaba Beads'], [11, 'DNA Helix 3D'], [12, 'Comet Trails'], [13, 'Stardust']];

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'the animations are the extension’s');
    await openApp(page);
});

/** A hash of the front canvas's pixels from `a` to `b`, graph points, and 40 px above and below. */
function pixels(page: Page, [a, b]: [Point, Point]): Promise<number> {
    return page.evaluate(([[ax, ay], [bx, by]]) => {
        const { canvas } = window.app;
        const el: HTMLCanvasElement = canvas.canvas;
        const ratio = el.width / el.clientWidth;
        const [x0, y0] = canvas.ds.convertOffsetToCanvas([Math.min(ax, bx), Math.min(ay, by) - 40]);
        const [x1, y1] = canvas.ds.convertOffsetToCanvas([Math.max(ax, bx), Math.max(ay, by) + 40]);
        const { data } = el.getContext('2d')!.getImageData(Math.floor(x0 * ratio), Math.floor(y0 * ratio), Math.ceil((x1 - x0) * ratio), Math.ceil((y1 - y0) * ratio));
        let hash = 0;
        for (let i = 0; i < data.length; i++) hash = (Math.imul(hash, 31) + data[i]) | 0;
        return hash;
    }, [a, b] as const);
}

for (const [animate, name] of NEW) {
    test.describe(name, () => {
        test.use({ settings: { [ANIMATE]: animate } });

        test('moves along the link, and holds still in Static mode', async ({ page }) => {
            const graph = await buildGraph(page, graphs.pair);
            const area = [await slotPoint(page, graph.links.int, 0), await slotPoint(page, graph.links.int, 1)] as [Point, Point];
            await redraw(page);
            const before = await pixels(page, area);
            await expect.poll(() => pixels(page, area), { message: 'the link moves' }).not.toBe(before);
            await setSetting(page, STATIC, true);
            expect(await settle(page)).toBe(true);
            const still = await pixels(page, area);
            await page.waitForTimeout(500);
            expect(await pixels(page, area)).toBe(still);
        });
    });
}

test("the panel's gallery shows a live tile of each", async ({ page }) => {
    await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'links', advanced: false, search: '' });
    await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
    const gallery = page.locator('.eln').getByRole('radiogroup', { name: 'Link animation' });
    for (const [, name] of NEW) {
        const tile = gallery.getByRole('radio', { name, exact: true }).locator('canvas');
        await tile.scrollIntoViewIfNeeded();
        // How many of its pixels differ from its corner's, the stage's colour, and a hash of them all.
        const drawn = () => tile.evaluate((canvas: HTMLCanvasElement) => {
            const { data } = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
            let [count, hash] = [0, 0];
            for (let i = 0; i < data.length; i += 4) {
                if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) count++;
                hash = (Math.imul(hash, 31) + data[i] + data[i + 1] * 7 + data[i + 2] * 13) | 0;
            }
            return { count, hash };
        });
        await expect.poll(async () => (await drawn()).count, { message: name }).toBeGreaterThan(300);
        const { hash } = await drawn();
        await expect.poll(async () => (await drawn()).hash, { message: `${name} moves` }).not.toBe(hash);
    }
});

test.describe('the Sacred Geometry look', () => {
    test.use({ settings: {} });

    test('applied from the panel, draws Merkaba Beads and Flower of Life', async ({ page }) => {
        await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'looks', advanced: false, search: '' });
        await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
        await page.locator('.eln [data-look=sacred-geometry]').click();
        await expect.poll(() => settingValues(page, [ANIMATE, '📦 Enhanced Nodes.Animate', '🔗 Enhanced Links.Look'])).toEqual([10, 5, 'sacred-geometry']);
    });
});

test.describe('Comet Trails on a rope wire', () => {
    test.use({ settings: { [ANIMATE]: 12, '🔗 Enhanced Links.Physics.Profile': 'rope' } });

    test('fly along the wire as it hangs', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        // The middle of the wire, once it hangs still, well below the slots, which are level.
        await expect.poll(() => page.evaluate((id) => window.app.canvas.graph.getLink(id)._pos[1], graph.links.int), { timeout: 10_000 })
            .toBeGreaterThan((await slotPoint(page, graph.links.int, 0.5))[1] + 20);
        // Where the comets' white-hot cores are drawn on the front canvas, in graph units.
        await page.evaluate(() => {
            window.__elnHeads = [];
            const { arc, fill } = CanvasRenderingContext2D.prototype;
            let last: Point = [NaN, NaN];
            CanvasRenderingContext2D.prototype.arc = function (this: CanvasRenderingContext2D, ...args: Parameters<typeof arc>) {
                last = [args[0], args[1]];
                return arc.apply(this, args);
            };
            CanvasRenderingContext2D.prototype.fill = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
                if (this.canvas === window.app.canvas.canvas && this.fillStyle === '#ffffff') window.__elnHeads.push(last);
                return (fill as (...args: unknown[]) => void).apply(this, args);
            };
        });
        await expect.poll(() => page.evaluate(() => window.__elnHeads.length)).toBeGreaterThan(10);
        // Each on the wire: within its hit path stroked 6 px wide.
        const off = await page.evaluate((id) => {
            const { path } = window.app.canvas.graph.getLink(id);
            const ctx = document.createElement('canvas').getContext('2d')!;
            ctx.lineWidth = 6;
            return window.__elnHeads.filter(([x, y]) => !ctx.isPointInStroke(path, x, y));
        }, graph.links.int);
        expect(off).toEqual([]);
    });
});
