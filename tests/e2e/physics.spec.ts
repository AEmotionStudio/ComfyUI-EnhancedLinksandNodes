// Wire physics in ComfyUI: with a profile on, links sag as wires from their slots, through reroutes and inside
// subgraphs; what native does on a link works on the wire, as the hit data follows it: the link menu at its middle,
// shift-drag, alt-click for a reroute, and dropping a moved input link on the canvas; a node dragged swings its wires,
// and the canvas goes still once they settle; in Nodes 2.0 the wires end at the DOM slot dots; and the Living Wires
// look hangs native-looking wires. They come with the extensions, so the -native projects skip them.
import type { Locator, Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import {
    buildGraph,
    clickAt,
    drawnNatively,
    expect,
    nativeTargets,
    openApp,
    openSubgraph,
    readProbe,
    redraw,
    resetProbe,
    setSetting,
    settingValues,
    settle,
    slotPoint,
    test,
    titleOf,
    toClient,
    vueSlotCentres,
    type Point,
} from './helpers';

const PROFILE = '🔗 Enhanced Links.Physics.Profile';
const ANIMATE = '🔗 Enhanced Links.Animate';

test.use({ settings: { [PROFILE]: 'rope' } });

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'wire physics is the extension’s');
    await openApp(page);
});

/**
 * The middle of a segment once its wire is at rest, as its hit data has it, which the link menu opens at, and how far it
 * hangs below the straight line between the segment's ends as the last pass drew them: the link's segment into its input,
 * or the one into `reroute`. A wire first drawn before its nodes reached their places swings on for a moment.
 */
async function middle(page: Page, link: number, reroute: number | null = null): Promise<{ centre: Point; sag: number }> {
    const centreOf = () => page.evaluate(([link, reroute]) => {
        const { graph } = window.app.canvas;
        const owner = reroute === null ? graph.getLink(link) : graph.reroutes.get(reroute);
        return [owner._pos[0], owner._pos[1]] as Point;
    }, [link, reroute] as const);
    await redraw(page);
    await expect.poll(async () => {
        const before = await centreOf();
        await page.waitForTimeout(300);
        const now = await centreOf();
        return Math.hypot(now[0] - before[0], now[1] - before[1]);
    }, { message: 'the wire comes to rest', timeout: 10_000 }).toBe(0);
    await resetProbe(page);
    await redraw(page);
    const { a, b } = (await readProbe(page)).segments.find((s) => s.link === link && s.reroute === reroute)!;
    const centre = await centreOf();
    return { centre, sag: centre[1] - (a[1] + ((b[1] - a[1]) * (centre[0] - a[0])) / (b[0] - a[0])) };
}

async function expectLinkMenu(page: Page): Promise<void> {
    const menu = page.locator('.litecontextmenu');
    await expect(menu).toBeVisible({ timeout: 3000 });
    await expect(menu).toContainText('Add Reroute');
    await expect(menu).toContainText('Delete');
}

/** Front and background paints during `ms`. */
function paints(page: Page, ms: number): Promise<{ front: number; back: number }> {
    return page.evaluate(async (ms) => {
        const probe = window.__eln;
        const [front, back] = [probe.front, probe.back];
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { front: probe.front - front, back: probe.back - back };
    }, ms);
}

test.describe('on a wire', () => {
    test('the link sags, and clicking its middle opens the link menu', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        const { centre, sag } = await middle(page, graph.links.int);
        expect(sag).toBeGreaterThan(20);
        await clickAt(page, centre);
        await expectLinkMenu(page);
    });

    test('shift-dragging starts a connection', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        const [x, y] = await toClient(page, (await middle(page, graph.links.int)).centre);
        await page.mouse.move(x, y);
        await page.keyboard.down('Shift');
        await page.mouse.down();
        await page.mouse.move(x + 120, y + 40, { steps: 8 });
        const connecting = await page.evaluate(() => window.app.canvas.linkConnector.isConnecting);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        expect(connecting).toBe(true);
    });

    test('alt-clicking adds a reroute where the wire is', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        const { centre } = await middle(page, graph.links.int);
        const [x, y] = await toClient(page, centre);
        await page.keyboard.down('Alt');
        await page.mouse.click(x, y);
        await page.keyboard.up('Alt');
        const reroutes = await page.evaluate(() => [...window.app.graph.reroutes.values()].map((r) => ({ id: r.id, pos: [...r.pos] })));
        expect(reroutes).toHaveLength(1);
        expect(Math.hypot(reroutes[0].pos[0] - centre[0], reroutes[0].pos[1] - centre[1])).toBeLessThan(2);
        expect(await page.evaluate((id) => window.app.graph.getLink(id).parentId, graph.links.int)).toBe(reroutes[0].id);
    });

    test('dropping a moved input link on the canvas opens the search box', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        // 1.57 opens a dialog, 1.39.5 a search popup.
        const searchBox = page.getByRole('dialog').or(page.getByRole('search')).first();
        await expect(searchBox).toBeHidden();
        const [x, y] = await toClient(page, await slotPoint(page, graph.links.int, 1));
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x - 150, y + 250, { steps: 20 });
        await page.mouse.up();
        await expect(searchBox).toBeVisible({ timeout: 3000 });
        expect(await page.evaluate((id) => !!window.app.graph.getLink(id), graph.links.int)).toBe(true);
    });

    test('through a reroute both stretches sag, and clicking the middle of the one into the input opens the link menu', async ({ page }) => {
        const graph = await buildGraph(page, graphs.rerouted);
        const [into, out] = [await middle(page, graph.links.float, graph.reroutes.float), await middle(page, graph.links.float)];
        expect(into.sag).toBeGreaterThan(5);
        expect(out.sag).toBeGreaterThan(5);
        await clickAt(page, out.centre);
        await expectLinkMenu(page);
    });

    test('through a reroute, shift-dragging the stretch into the reroute starts a connection', async ({ page }) => {
        const graph = await buildGraph(page, graphs.rerouted);
        const [x, y] = await toClient(page, (await middle(page, graph.links.float, graph.reroutes.float)).centre);
        await page.mouse.move(x, y);
        await page.keyboard.down('Shift');
        await page.mouse.down();
        await page.mouse.move(x + 100, y + 60, { steps: 8 });
        const connecting = await page.evaluate(() => window.app.canvas.linkConnector.isConnecting);
        await page.mouse.up();
        await page.keyboard.up('Shift');
        expect(connecting).toBe(true);
    });

    test('a subgraph input link sags inside the subgraph, and clicking its middle opens the link menu', async ({ page }) => {
        const graph = await buildGraph(page, graphs.subgraph);
        test.skip(graph.subgraph === null, 'this frontend cannot convert to subgraphs');
        await openSubgraph(page, graph.subgraph!);
        await resetProbe(page);
        await redraw(page);
        const io = (await readProbe(page)).segments.find((s) => s.origin === -10)!;
        // The subgraph opens on a view of its own: the link's middle goes to the middle of the canvas.
        await page.evaluate(([[ax, ay], [bx, by]]) => {
            const { canvas } = window.app;
            canvas.ds.scale = 1;
            canvas.ds.offset = [canvas.canvas.clientWidth / 2 - (ax + bx) / 2, canvas.canvas.clientHeight / 2 - (ay + by) / 2];
        }, [io.a, io.b] as const);
        const { centre, sag } = await middle(page, io.link!);
        expect(sag).toBeGreaterThan(10);
        await clickAt(page, centre);
        await expectLinkMenu(page);
    });
});

test.describe('with Animation None', () => {
    test.use({ settings: { [PROFILE]: 'rope', [ANIMATE]: 0 } });

    test('dragging a node swings its wires, and the canvas goes still once they settle', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await redraw(page);
        expect(await settle(page)).toBe(true);
        const [x, y] = await toClient(page, await titleOf(page, graph.nodes.target));
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 60, y + 160, { steps: 6 });
        await page.mouse.up();
        // The wire swings on after the node stops: its middle keeps moving, and the background is drawn again for it.
        const sampled = await page.evaluate(async (id) => {
            const link = window.app.canvas.graph.getLink(id);
            const ys: number[] = [];
            const back = window.__eln.back;
            for (let i = 0; i < 8; i++) {
                ys.push(link._pos[1]);
                await new Promise((resolve) => setTimeout(resolve, 40));
            }
            return { ys, back: window.__eln.back - back };
        }, graph.links.int);
        expect(new Set(sampled.ys.map((v) => v.toFixed(1))).size).toBeGreaterThan(2);
        expect(sampled.back).toBeGreaterThan(3);
        expect(await settle(page, 1000, 15_000)).toBe(true);
        expect(await paints(page, 1000)).toEqual({ front: 0, back: 0 });
    });
});

test.describe('in Nodes 2.0', () => {
    test.use({ settings: { [PROFILE]: 'rope', 'Comfy.VueNodes.Enabled': true } });

    test('wires end within 3 px of the DOM slot dots', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(2);
        await expect.poll(async () => {
            await redraw(page);
            const [source, target] = [await vueSlotCentres(page, graph.nodes.source), await vueSlotCentres(page, graph.nodes.target)];
            return page.evaluate(([id, a, b]) => {
                const link = window.app.canvas.graph.getLink(id);
                if (!link.path) return Infinity;
                const ctx = document.createElement('canvas').getContext('2d')!;
                ctx.lineWidth = 1;
                const gap = ([x, y]: number[]) => {
                    for (let r = 0; r <= 6; r += 0.5) {
                        for (let t = 0; t < 32; t++) if (ctx.isPointInStroke(link.path, x + r * Math.cos(t * Math.PI / 16), y + r * Math.sin(t * Math.PI / 16))) return r;
                    }
                    return Infinity;
                };
                return Math.max(gap(a), gap(b));
            }, [graph.links.int, source.outputs[0], target.inputs[0]] as const);
        }, { message: 'px between the wire and the slot dots', timeout: 5000 }).toBeLessThanOrEqual(3);
        expect((await middle(page, graph.links.int)).sag).toBeGreaterThan(20);
    });
});

test.describe('the Living Wires look', () => {
    test.use({ settings: {} });

    test('applied from the panel, hangs native-looking wires', async ({ page }) => {
        const graph = await buildGraph(page, graphs.pair);
        expect((await middle(page, graph.links.int)).sag).toBeLessThan(1);
        await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'looks', advanced: false, search: '' });
        await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
        const panel: Locator = page.locator('.eln');
        await panel.locator('[data-look=living-wires]').click();
        await expect.poll(() => settingValues(page, [ANIMATE, PROFILE, '🔗 Enhanced Links.Look'])).toEqual([0, 'rope', 'living-wires']);
        await expect(panel.locator('#eln-look .eln-look-name')).toHaveText('Living Wires');
        expect((await middle(page, graph.links.int)).sag).toBeGreaterThan(20);
        // Ours, along the wire: native draws where nobody sees it.
        await nativeTargets(page);
        expect(await drawnNatively(page)).toBe(false);
    });
});
