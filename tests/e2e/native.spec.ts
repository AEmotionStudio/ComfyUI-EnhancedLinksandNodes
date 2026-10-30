// Native baseline: the behaviours the extension must keep, measured with both extensions disabled.
import * as graphs from './fixtures/graphs';
import {
    buildGraph,
    clickAt,
    expect,
    linkCentre,
    openApp,
    openSubgraph,
    pixelAt,
    pointOnLink,
    readProbe,
    redraw,
    reroutePos,
    resetProbe,
    setSetting,
    settle,
    test,
    titleOf,
    toClient,
} from './helpers';

const WHITE = [255, 255, 255, 255];

test.describe('native baseline', { tag: '@native' }, () => {
    test.beforeEach(async ({ page }) => {
        await openApp(page);
    });

    test('serves the leg frontend with both extensions disabled', async ({ page, frontend, log }) => {
        expect(await page.evaluate(() => window.__COMFYUI_FRONTEND_VERSION__)).toBe(frontend);
        const messages = log.counts.map((m) => m.text);
        expect(messages).toContain('Extension enhanced.link.animations is disabled.');
        expect(messages).toContain('Extension enhanced.node.animations is disabled.');
    });

    test('clicking a link centre opens the link menu', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        await clickAt(page, await linkCentre(page, graph.links.int));
        const menu = page.locator('.litecontextmenu');
        await expect(menu).toBeVisible();
        await expect(menu).toContainText('Add Reroute');
        await expect(menu).toContainText('Delete');
    });

    test('shift-dragging a link starts a connection', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const [x, y] = await toClient(page, await pointOnLink(page, graph.links.int, 0.25));
        expect(await page.evaluate(() => window.app.canvas.linkConnector.isConnecting)).toBe(false);
        await page.mouse.move(x, y);
        await page.keyboard.down('Shift');
        await page.mouse.down();
        await page.mouse.move(x + 120, y + 40, { steps: 8 });
        expect(await page.evaluate(() => window.app.canvas.linkConnector.isConnecting)).toBe(true);
        await page.mouse.up();
        await page.keyboard.up('Shift');
    });

    test('alt-clicking a link adds a reroute on it', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const point = await pointOnLink(page, graph.links.int, 0.25);
        const [x, y] = await toClient(page, point);
        await page.keyboard.down('Alt');
        await page.mouse.click(x, y);
        await page.keyboard.up('Alt');
        const reroutes = await page.evaluate(() => [...window.app.graph.reroutes.values()].map((r) => ({ id: r.id, pos: [...r.pos] })));
        expect(reroutes).toHaveLength(1);
        expect(Math.hypot(reroutes[0].pos[0] - point[0], reroutes[0].pos[1] - point[1])).toBeLessThan(2);
        expect(await page.evaluate((id) => window.app.graph.getLink(id).parentId, graph.links.int)).toBe(reroutes[0].id);
    });

    test('dragging a reroute moves it', async ({ page }) => {
        const graph = await buildGraph(page, graphs.rerouted);
        await redraw(page);
        const before = await reroutePos(page, graph.reroutes.float);
        const [x, y] = await toClient(page, before);
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 60, y + 40, { steps: 8 });
        await page.mouse.up();
        const after = await reroutePos(page, graph.reroutes.float);
        expect(after[0] - before[0]).toBeCloseTo(60, 0);
        expect(after[1] - before[1]).toBeCloseTo(40, 0);
    });

    test('a floating link renders as a disabled segment to its reroute', async ({ page }) => {
        const graph = await buildGraph(page, graphs.floating);
        expect(await page.evaluate(() => window.app.graph.floatingLinks.size)).toBe(1);
        await resetProbe(page);
        await redraw(page);
        const { back, segments } = await readProbe(page);
        const floating = segments.filter((s) => s.disabled);
        expect(floating).toHaveLength(back);
        expect(floating[0].b).toEqual(await reroutePos(page, graph.reroutes.int));
    });

    test('subgraph IO links render inside the subgraph', async ({ page }) => {
        const graph = await buildGraph(page, graphs.subgraph);
        test.skip(graph.subgraph === null, 'this frontend cannot convert to subgraphs');
        await openSubgraph(page, graph.subgraph!);
        await resetProbe(page);
        await redraw(page);
        const { back, segments } = await readProbe(page);
        expect(segments.filter((s) => s.origin === -10)).toHaveLength(back);
        expect(segments.filter((s) => s.target === -20)).toHaveLength(back);
    });

    test('Hidden link render mode makes no renderLink calls', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await resetProbe(page);
        await redraw(page);
        const { back, renderLink } = await readProbe(page);
        expect(renderLink).toBe(back);
        const centre = await linkCentre(page, graph.links.int);
        const shown = await pixelAt(page, centre);

        await setSetting(page, 'Comfy.LinkRenderMode', -1);
        await expect.poll(() => page.evaluate(() => window.app.canvas.links_render_mode)).toBe(-1);
        await resetProbe(page);
        await redraw(page);
        expect((await readProbe(page)).renderLink).toBe(0);
        expect(await pixelAt(page, centre)).not.toEqual(shown);
    });

    test('selecting a node paints its links white', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        const centre = await linkCentre(page, graph.links.int);
        expect(await pixelAt(page, centre)).not.toEqual(WHITE);

        await clickAt(page, await titleOf(page, graph.nodes.target));
        await expect.poll(() => page.evaluate((id) => !!window.app.canvas.highlighted_links[id], graph.links.int)).toBe(true);
        await redraw(page);
        expect(await pixelAt(page, centre)).toEqual(WHITE);
    });

    test('links to collapsed, bypassed and muted nodes render', async ({ page }) => {
        const graph = await buildGraph(page, graphs.nodeStates);
        await resetProbe(page);
        await redraw(page);
        const drawn = (await readProbe(page)).segments.map((s) => s.link);
        expect(drawn).toEqual(expect.arrayContaining([graph.links.collapsed, graph.links.bypassed, graph.links.muted]));
    });

    test('an idle canvas does not repaint', async ({ page }) => {
        await buildGraph(page, graphs.mixed);
        expect(await settle(page)).toBe(true);
        await resetProbe(page);
        await page.waitForTimeout(3000);
        const { front, back } = await readProbe(page);
        expect({ front, back }).toEqual({ front: 0, back: 0 });
    });
});
