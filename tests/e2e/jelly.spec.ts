// Jelly nodes in ComfyUI: a node dragged and let go wobbles, then settles still, drawn as native draws it and taking
// clicks where it shows; in Nodes 2.0 it bounces its DOM node, alike both ways, and leaves its slots where they were.
// They come with the extensions, so the -native projects skip them.
import * as graphs from './fixtures/graphs';
import { buildGraph, clickAt, expect, openApp, readProbe, resetProbe, settle, test, toClient, vueSlotCentres, type Point } from './helpers';

const JELLY = { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 6 };

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'Jelly is the extension’s');
    await openApp(page);
});

test.describe('classic nodes', () => {
    test.use({ settings: JELLY });

    test('a node let go wobbles, then settles still and takes clicks where it shows', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, graphs.pair);
        const title = (id: number) => page.evaluate((id) => {
            const node = window.app.canvas.graph.getNodeById(id);
            return [node.pos[0] + 40, node.pos[1] - 15] as Point;
        }, id);
        expect(await settle(page)).toBe(true);
        const [x, y] = await toClient(page, await title(graph.nodes.source));
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 160, y, { steps: 8 });
        await page.mouse.up();
        // Nothing else moves: the paints after the drop are its wobble.
        await resetProbe(page);
        await page.waitForTimeout(250);
        const path = testInfo.outputPath('jelly-wobble.png');
        await page.screenshot({ path, clip: { x: x - 120, y: y - 40, width: 480, height: 220 } });
        await testInfo.attach('jelly-wobble', { path, contentType: 'image/png' });
        expect((await readProbe(page)).front).toBeGreaterThan(5);
        expect(await settle(page, 500, 5000)).toBe(true);
        // Still, a click on its title selects it, and one on the other node's the other.
        await clickAt(page, await title(graph.nodes.target));
        await expect.poll(() => page.evaluate(() => [...window.app.canvas.selectedItems].map((n: { id: number }) => Number(n.id)))).toEqual([graph.nodes.target]);
        await clickAt(page, await title(graph.nodes.source));
        await expect.poll(() => page.evaluate(() => [...window.app.canvas.selectedItems].map((n: { id: number }) => Number(n.id)))).toEqual([graph.nodes.source]);
    });
});

test.describe('in Nodes 2.0', () => {
    test.use({ settings: { ...JELLY, 'Comfy.VueNodes.Enabled': true } });

    test('a node let go bounces, alike both ways, and leaves its slots where they were', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        const el = page.locator(`.lg-node[data-node-id="${graph.nodes.source}"]`);
        await expect(el).toBeVisible();
        // Every bounce asked of an element: its keyframes' scales.
        await page.evaluate(() => {
            const bounces: string[][] = ((window as unknown as { bounces: string[][] }).bounces = []);
            const { animate } = HTMLElement.prototype;
            HTMLElement.prototype.animate = function (this: HTMLElement, keyframes, options) {
                if (Array.isArray(keyframes) && keyframes.some((k) => 'scale' in k)) bounces.push(keyframes.map((k) => String(k.scale)));
                return animate.call(this, keyframes, options);
            };
        });
        const box = (await el.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + 12);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 140, box.y + 12, { steps: 8 });
        await page.mouse.up();
        await expect.poll(() => page.evaluate(() => (window as unknown as { bounces: string[][] }).bounces.length)).toBeGreaterThan(0);
        for (const scales of await page.evaluate(() => (window as unknown as { bounces: string[][] }).bounces)) expect(scales).toEqual(['1', '1.045', '0.98', '1.012', '1']);
        await page.waitForTimeout(1000);
        const dots = await vueSlotCentres(page, graph.nodes.source);
        const layout = await page.evaluate((id) => [...window.app.canvas.graph.getNodeById(id).getOutputPos(0)] as Point, graph.nodes.source);
        expect(Math.hypot(dots.outputs[0][0] - layout[0], dots.outputs[0][1] - layout[1])).toBeLessThan(1);
    });
});
