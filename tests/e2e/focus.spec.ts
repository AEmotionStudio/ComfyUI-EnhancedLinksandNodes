// Selection focus and going along the links in ComfyUI: each focus mode on the rerouted fixture and in a subgraph, Hide
// others leaving the hidden links unclickable until nothing is selected, focused links drawn over a node, Go to connected
// node and Back, and double-clicks on slots, which leave ComfyUI's own Primitive on a widget input be. Each mode, the menu,
// a chip and the Focus & Flow tab are attached as screenshots. They come with the extensions, so the -native projects skip them.
import type { Page, TestInfo } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { blankPixels, buildGraph, clickAt, expect, linkCentre, linkColour, lowestContrast, openApp, openSubgraph, pixelAt, redraw, setSetting, slotPoint, test, titleOf, toClient, type Point } from './helpers';

const FOCUS = '🔗 Enhanced Links.Focus.';
const WHITE = [255, 255, 255, 255];

/** Pixels within `tolerance` per channel, which allows for antialiasing. */
const near = (a: number[], b: number[], tolerance = 24) => a.every((v, i) => Math.abs(v - b[i]) <= tolerance);

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'selection focus and the jumps come with the extensions');
    await openApp(page);
});

/** Selects a node as a user does, with a click on its title. */
async function select(page: Page, id: number): Promise<void> {
    await clickAt(page, await titleOf(page, id));
    await expect.poll(() => selected(page)).toEqual([id]);
}

const selected = (page: Page) => page.evaluate(() => [...window.app.canvas.selectedItems].map((item: { id: number }) => Number(item.id)));

/** Attaches a screenshot of the canvas, or of what `clip` holds. */
async function shoot(page: Page, testInfo: TestInfo, name: string, clip?: { x: number; y: number; width: number; height: number }): Promise<void> {
    await page.waitForTimeout(300);
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, clip: clip ?? { x: 0, y: 0, width: 1600, height: 900 } });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** How many times LiteGraph has handed node `id`'s `handler` a slot's double-click, counted from the first time asked on. */
const handled = (page: Page, id: number, handler: 'onInputDblClick' | 'onOutputDblClick') => page.evaluate(([id, handler]) => {
    const counts = ((window as unknown as { __elnDblClicks?: Record<string, number> }).__elnDblClicks ??= {});
    const key = `${id} ${handler}`;
    if (!(key in counts)) {
        counts[key] = 0;
        const node = window.app.canvas.graph.getNodeById(id);
        const type = node[handler];
        node[handler] = function (this: unknown, ...args: unknown[]) {
            counts[key]++;
            return type.apply(this, args);
        };
    }
    return counts[key];
}, [id, handler] as const);

/**
 * Double-clicks node `id`'s first input or output until LiteGraph hands the double-click to the node: its pointer can
 * take a quick one for two clicks (CanvasPointer's 300 ms and drift), so a missed one is tried again half a second on.
 */
async function doubleClick(page: Page, id: number, slot: 'input' | 'output'): Promise<void> {
    const handler = slot === 'input' ? 'onInputDblClick' : 'onOutputDblClick';
    const before = await handled(page, id, handler);
    const point = await page.evaluate(([id, input]) => {
        const node = window.app.canvas.graph.getNodeById(id);
        return (input ? node.getInputPos(0) : node.getOutputPos(0)) as Point;
    }, [id, slot === 'input'] as const);
    await expect.poll(async () => {
        if ((await handled(page, id, handler)) === before) await page.mouse.dblclick(...(await toClient(page, point)));
        return handled(page, id, handler);
    }, { intervals: [500] }).toBe(before + 1);
}

/** Whether a click there opens the link menu; it is closed again. */
async function opensLinkMenu(page: Page, point: Point): Promise<boolean> {
    await clickAt(page, point);
    const menu = page.locator('.litecontextmenu');
    const opened = await menu.first().isVisible({ timeout: 1000 }).catch(() => false) || (await menu.count()) > 0;
    await page.keyboard.press('Escape');
    await page.evaluate(() => document.querySelectorAll('.litecontextmenu').forEach((el) => el.remove()));
    return opened;
}

test('each mode, with a node selected on the rerouted fixture', async ({ page }, testInfo) => {
    const graph = await buildGraph(page, graphs.focus);
    await select(page, graph.nodes.target);
    for (const mode of ['highlight', 'animate', 'dim', 'hide']) {
        await setSetting(page, `${FOCUS}Mode`, mode);
        await redraw(page);
        await shoot(page, testInfo, `focus-${mode}`, { x: 200, y: 150, width: 1300, height: 650 });
    }
});

test.describe('selection focus', () => {
    // Markers glide along the links and could pass under a point sampled.
    test.use({ settings: { '🔗 Enhanced Links.Marker.Enabled': false } });

    test('each mode draws the selection’s links through the reroute, and dims or hides the link apart', async ({ page }) => {
        const graph = await buildGraph(page, graphs.focus);
        await redraw(page);
        const [apart, focused] = [await slotPoint(page, graph.links.int, 0.3), await linkCentre(page, graph.links.float)];
        const blank = await blankPixels(page, [apart, focused]);
        const built = await buildGraph(page, graphs.focus);
        await redraw(page);
        const colour = await linkColour(page, built.links.int);
        await select(page, built.nodes.target);
        const expectDrawn = async (mode: string, drawn: (pixel: number[]) => boolean) => {
            await setSetting(page, `${FOCUS}Mode`, mode);
            await redraw(page);
            const [atApart, atFocused] = [await pixelAt(page, apart), await pixelAt(page, focused)];
            expect(drawn(atApart), `${mode}: apart ${atApart}, link ${colour}, blank ${blank[0]}`).toBe(true);
            expect(near(atFocused, blank[1], 4), `${mode}: focused ${atFocused}`).toBe(false);
        };
        // Highlight and Animate only these leave the link apart as it was; Dim others dims it, Hide others leaves it out.
        await expectDrawn('highlight', (pixel) => near(pixel, colour));
        await expectDrawn('animate', (pixel) => near(pixel, colour));
        await expectDrawn('dim', (pixel) => !near(pixel, colour, 8) && !near(pixel, blank[0], 4));
        await expectDrawn('hide', (pixel) => near(pixel, blank[0], 4));
    });

    test('Hide others leaves the hidden links unclickable, the focused ones clickable, and shows them all again once nothing is selected', async ({ page }) => {
        const graph = await buildGraph(page, graphs.focus);
        await setSetting(page, `${FOCUS}Mode`, 'hide');
        await redraw(page);
        const [apart, focused] = [await linkCentre(page, graph.links.int), await linkCentre(page, graph.links.next)];
        await select(page, graph.nodes.target);
        await redraw(page);
        expect(await opensLinkMenu(page, apart)).toBe(false);
        expect(await opensLinkMenu(page, focused)).toBe(true);
        // A click on the canvas away from everything selects nothing.
        await clickAt(page, [1300, 750]);
        await expect.poll(() => selected(page)).toEqual([]);
        await redraw(page);
        expect(await opensLinkMenu(page, apart)).toBe(true);
    });

    test('keeps the IO links of a node selected in a subgraph', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, graphs.subgraph);
        test.skip(graph.subgraph === null, 'this frontend cannot convert to a subgraph');
        await setSetting(page, `${FOCUS}Mode`, 'hide');
        await openSubgraph(page, graph.subgraph!);
        const [inner, io] = await page.evaluate(() => {
            const { canvas } = window.app;
            const node = canvas.graph.nodes[0];
            return [Number(node.id), node.inputs[0].link] as [number, number];
        });
        await redraw(page);
        const point = await linkCentre(page, io);
        // The subgraph opens on a view of its own, which can leave the link's centre under ComfyUI's controls.
        await page.evaluate(([x, y]) => {
            const { canvas } = window.app;
            canvas.ds.scale = 1;
            canvas.ds.offset = [canvas.canvas.clientWidth / 2 - x, canvas.canvas.clientHeight / 2 - y];
        }, point);
        await redraw(page);
        await select(page, inner);
        await redraw(page);
        expect(await page.evaluate((id) => window.app.canvas.graph.getLink(id)._pos.every(Number.isFinite), io)).toBe(true);
        expect(await opensLinkMenu(page, point)).toBe(true);
        await shoot(page, testInfo, 'focus-subgraph');
    });

    test('draws the focused link again over a node it passes under', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, { nodes: { source: { type: 'ELNInt', pos: [200, 300] }, cover: { type: 'ELNInt', pos: [600, 250] }, target: { type: 'ELNInt', pos: [1100, 300] } }, links: { int: { from: 'source', to: 'target' } } });
        // The cover node sits over the middle of the link.
        const middle = await slotPoint(page, graph.links.int, 0.5);
        await page.evaluate(([id, x, y]) => {
            const node = window.app.canvas.graph.getNodeById(id);
            node.pos = [x - node.size[0] / 2, y - node.size[1] / 2];
        }, [graph.nodes.cover, ...middle] as const);
        const under = [middle[0] + 30, middle[1]] as Point;
        await redraw(page);
        const body = await pixelAt(page, under);
        await select(page, graph.nodes.source);
        await redraw(page);
        expect(near(await pixelAt(page, under), WHITE), 'over the node').toBe(true);
        await shoot(page, testInfo, 'focus-on-top');
        await setSetting(page, `${FOCUS}OnTop`, false);
        await redraw(page);
        expect(near(await pixelAt(page, under), body, 8), 'under the node').toBe(true);
    });
});

test.describe('going along the links', () => {
    test('Go to connected node jumps to the node, selects it, and a chip goes back', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, graphs.focus);
        await redraw(page);
        const [x, y] = await toClient(page, await titleOf(page, graph.nodes.target));
        await page.mouse.click(x, y, { button: 'right' });
        await page.locator('.litecontextmenu .litemenu-entry', { hasText: 'Go to connected node' }).click();
        const submenu = page.locator('.litecontextmenu').last();
        await expect(submenu.locator('.litemenu-entry')).toHaveText([`← value · ELN FLOAT #${graph.nodes.source}`, `→ FLOAT · ELN FLOAT #${graph.nodes.next}`]);
        const menu = await page.locator('.litecontextmenu').first().boundingBox();
        const sub = await submenu.boundingBox();
        await shoot(page, testInfo, 'go-to-menu', { x: menu!.x - 24, y: menu!.y - 24, width: sub!.x + sub!.width - menu!.x + 48, height: Math.max(menu!.height, sub!.y + sub!.height - menu!.y) + 48 });
        await submenu.locator('.litemenu-entry', { hasText: '→' }).click();
        await expect.poll(() => selected(page)).toEqual([graph.nodes.next]);
        const chip = page.locator('.eln-chipbar');
        await expect(chip).toHaveText('↩ Back to ELN FLOAT');
        await expect(chip).toHaveAttribute('role', 'status');
        await shoot(page, testInfo, 'go-to-chip');
        const box = await chip.boundingBox();
        await shoot(page, testInfo, 'chip', { x: box!.x - 40, y: box!.y - 40, width: box!.width + 80, height: box!.height + 80 });
        // The node is in the middle of the view, at the zoom it had.
        await expect.poll(() => page.evaluate((id) => {
            const { canvas } = window.app;
            const [x, y, w, h] = canvas.graph.getNodeById(id).boundingRect;
            const area = canvas.visible_area;
            return [Math.round(x + w / 2 - (area[0] + area[2] / 2)), Math.round(y + h / 2 - (area[1] + area[3] / 2)), canvas.ds.scale];
        }, graph.nodes.next)).toEqual([0, 0, 1]);
        await chip.getByRole('button').click();
        await expect.poll(() => selected(page)).toEqual([graph.nodes.target]);
        await expect(chip).toHaveCount(0);
    });

    test('a double-click on an output goes to each node it feeds in turn; on an input to where it comes from, unless ComfyUI adds a Primitive there', async ({ page }) => {
        const graph = await buildGraph(page, graphs.fanOut);
        await redraw(page);
        const chip = page.locator('.eln-chipbar');
        await doubleClick(page, graph.nodes.source, 'output');
        await expect.poll(() => selected(page)).toEqual([graph.nodes.first]);
        await expect(chip).toHaveText('1/2 · ELN IMAGE↩ Back to ELN IMAGE');
        await page.waitForTimeout(500);
        await doubleClick(page, graph.nodes.source, 'output');
        await expect.poll(() => selected(page)).toEqual([graph.nodes.second]);
        await expect(chip).toHaveText('2/2 · ELN IMAGE↩ Back to ELN IMAGE');

        await page.waitForTimeout(500);
        await doubleClick(page, graph.nodes.second, 'input');
        await expect.poll(() => selected(page)).toEqual([graph.nodes.source]);

        // The INT input takes a widget: ComfyUI links a new Primitive to it, which is no jump.
        await page.waitForTimeout(500);
        const before = await page.evaluate(() => window.app.canvas.graph.nodes.length);
        await doubleClick(page, graph.nodes.intTarget, 'input');
        await expect.poll(() => page.evaluate(() => window.app.canvas.graph.nodes.length)).toBe(before + 1);
        expect(await selected(page)).not.toEqual([graph.nodes.int]);
    });

    test('GoUpstream, GoDownstream and GoBack walk the links from the node selected', async ({ page }) => {
        const graph = await buildGraph(page, graphs.focus);
        await redraw(page);
        const execute = (id: string) => page.evaluate((id) => window.app.extensionManager.command.execute(id), `EnhancedLinksNodes.${id}`);
        await select(page, graph.nodes.target);
        await execute('GoUpstream');
        await expect.poll(() => selected(page)).toEqual([graph.nodes.source]);
        await execute('GoBack');
        await expect.poll(() => selected(page)).toEqual([graph.nodes.target]);
        await execute('GoDownstream');
        await expect.poll(() => selected(page)).toEqual([graph.nodes.next]);
    });
});

for (const palette of ['dark', 'light']) {
    test.describe(`on the ${palette} palette`, () => {
        test.use({ settings: { 'Comfy.ColorPalette': palette } });

        test('a chip keeps its text at 4.5:1 or more against what is behind it', async ({ page }, testInfo) => {
            const graph = await buildGraph(page, graphs.focus);
            await redraw(page);
            await select(page, graph.nodes.target);
            await page.evaluate(() => window.app.extensionManager.command.execute('EnhancedLinksNodes.GoDownstream'));
            const chip = page.locator('.eln-chipbar');
            await expect(chip).toBeVisible();
            const box = await chip.boundingBox();
            await shoot(page, testInfo, `chip-${palette}`, { x: box!.x - 40, y: box!.y - 40, width: box!.width + 80, height: box!.height + 80 });
            const worst = await lowestContrast(page, '.eln-chipbar');
            expect(worst[0].ratio, JSON.stringify(worst)).toBeGreaterThanOrEqual(4.5);
        });
    });
}

test('the panel’s Focus & Flow tab and its Focus chip', async ({ page }, testInfo) => {
    await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'runs', advanced: true, search: '' });
    await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
    const panel = page.locator('.eln');
    await expect(panel.getByRole('tab', { name: 'Focus & Flow', exact: true })).toHaveAttribute('aria-selected', 'true');
    const chip = panel.getByRole('button', { name: 'Focus', exact: true });
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    const box = await panel.boundingBox();
    await shoot(page, testInfo, 'focus-flow-tab', { x: box!.x, y: box!.y, width: box!.width, height: box!.height });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => page.evaluate(() => window.app.extensionManager.setting.get('🔗 Enhanced Links.Focus.Enabled'))).toBe(false);
});
