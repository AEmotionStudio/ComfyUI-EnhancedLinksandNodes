// Connection assist in ComfyUI: dragging a link from an output toward an input of its type puts a glove on the input
// within 150 px and clasps the hands within 75 px, an input of another type gets none, and dropping the link connects it
// as native does, then leaves nothing drawn and the canvas still, as cancelling with Escape leaves nothing drawn;
// dragging from an input reaches for an output; a link dropped on the canvas opens the link-release search with
// nothing drawn; it works inside a subgraph, toward its output node too, and, in Nodes 2.0, on the canvas above the DOM
// nodes at device pixel ratios 1 and 2; and Showcase and Living Wires turn it on. The gloves are the only near-white on
// the dark palette's canvas. Drops connect natively in the -native projects too; the rest comes with the extensions, so
// they skip it.
import type { Locator, Page } from '@playwright/test';
import { buildGraph, expect, openApp, openSubgraph, readProbe, resetProbe, setSetting, settingValues, settle, test, vueSlotCentres, type GraphSpec, type Point } from './helpers';

const MODE = '🔗 Enhanced Links.Assist.Mode';

/** Two IMAGE nodes side by side, and an INT one under the second. */
const scene: GraphSpec = {
    nodes: {
        source: { type: 'ELNImage', pos: [200, 300] },
        target: { type: 'ELNImage', pos: [800, 300] },
        ints: { type: 'ELNInt', pos: [800, 600] },
    },
};

test.use({ settings: { '🔗 Enhanced Links.Animate': 0, [MODE]: 'hands' } });

test.beforeEach(async ({ page }) => {
    await openApp(page);
});

const ours = (profile: string) => test.skip(profile === 'native', 'connection assist is the extension’s');

/** Where a node's slot is on the page: in classic mode where native puts it, in Nodes 2.0 its DOM dot. */
async function slot(page: Page, id: number, input: boolean, vue = false): Promise<Point> {
    if (vue) {
        const dots = await vueSlotCentres(page, id);
        const [x, y] = input ? dots.inputs[0] : dots.outputs[0];
        return client(page, [x, y]);
    }
    const at = await page.evaluate(([id, input]) => {
        const node = window.app.canvas.graph.getNodeById(id);
        return [...(input ? node.getInputPos(0) : node.getOutputPos(0))] as Point;
    }, [id, input] as const);
    return client(page, at);
}

/** A graph point on the page, whatever covers it there. */
const client = (page: Page, [x, y]: Point) => page.evaluate(([x, y]) => {
    const { canvas } = window.app;
    const rect = canvas.canvas.getBoundingClientRect();
    const [cx, cy] = canvas.ds.convertOffsetToCanvas([x, y]);
    return [rect.left + cx, rect.top + cy] as Point;
}, [x, y] as Point);

/** How many near-white pixels a `w` × `h` box of the page about `at` holds, on the main canvas or, with `overlay`, on the one above the DOM nodes. */
const whites = (page: Page, [x, y]: Point, [w, h]: Point, overlay = false) => page.evaluate(({ x, y, w, h, overlay }) => {
    const el = (overlay ? window.app.canvas.overlayCanvas ?? document.querySelector('canvas.eln-overlay') : window.app.canvas.canvas) as HTMLCanvasElement;
    const rect = el.getBoundingClientRect();
    const ratio = el.width / el.clientWidth;
    const data = el.getContext('2d')!.getImageData(Math.round((x - w / 2 - rect.left) * ratio), Math.round((y - h / 2 - rect.top) * ratio), Math.round(w * ratio), Math.round(h * ratio)).data;
    let n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245 && data[i + 3] > 200) n++;
    return n;
}, { x, y, w, h, overlay });

/** `px` from `to` toward `from`. */
const toward = (from: Point, to: Point, px: number): Point => {
    const d = Math.hypot(from[0] - to[0], from[1] - to[1]);
    return [to[0] + ((from[0] - to[0]) * px) / d, to[1] + ((from[1] - to[1]) * px) / d];
};

/** Polls the whites of a box until they are `none` or some. */
const expectWhites = (page: Page, at: Point, box: Point, some: boolean, overlay = false, message = '') =>
    expect.poll(() => whites(page, at, box, overlay), { message, timeout: 3000 })[some ? 'toBeGreaterThan' : 'toBe'](some ? 20 : 0);

test.describe('dragging from an output', () => {
    test('reaches for an input of its type from 150 px and clasps within 75 px; one of another type gets none', async ({ page, profile }) => {
        ours(profile);
        const graph = await buildGraph(page, scene);
        const [from, to, ints] = [await slot(page, graph.nodes.source, false), await slot(page, graph.nodes.target, true), await slot(page, graph.nodes.ints, true)];
        await page.mouse.move(...from);
        await page.mouse.down();
        // Out of reach: nothing at the input.
        await page.mouse.move(...toward(from, to, 250), { steps: 10 });
        await expectWhites(page, toward(from, to, 15), [40, 24], false);
        // In reach: a glove on the input, reaching out of it; the hands' fingertips are still apart halfway.
        await page.mouse.move(...toward(from, to, 110), { steps: 10 });
        await expectWhites(page, toward(from, to, 15), [40, 24], true, false, 'glove at the input');
        await page.mouse.move(...toward(from, to, 90), { steps: 4 });
        await expectWhites(page, toward(from, to, 45), [10, 10], false, false, 'nothing between the hands');
        // Clasped between the end and the input.
        await page.mouse.move(...toward(from, to, 60), { steps: 4 });
        await expectWhites(page, toward(from, to, 30), [10, 10], true, false, 'clasped hands');
        // The INT input takes no IMAGE: an open hand at the end, 80 px off, and none on it.
        await page.mouse.move(ints[0] - 80, ints[1], { steps: 10 });
        await expectWhites(page, ints, [30, 24], false, false, 'nothing at the INT input');
        await expectWhites(page, [ints[0] - 70, ints[1]], [30, 30], true, false, 'the open hand at the end');
        await page.mouse.up();
    });

    test('dropped on an input, connects it as native does; then nothing is drawn and the canvas goes still', async ({ page, profile }) => {
        const graph = await buildGraph(page, scene);
        const [from, to] = [await slot(page, graph.nodes.source, false), await slot(page, graph.nodes.target, true)];
        await page.mouse.move(...from);
        await page.mouse.down();
        await page.mouse.move(...toward(from, to, 60), { steps: 12 });
        await page.mouse.move(...to, { steps: 4 });
        if (profile !== 'native') await expectWhites(page, to, [40, 24], true, false, 'clasped on the input');
        await page.mouse.up();
        const link = await page.evaluate((target) => {
            const graph = window.app.canvas.graph;
            const link = graph.getLink(graph.getNodeById(target).inputs[0].link);
            return link && [Number(link.origin_id), link.origin_slot, Number(link.target_id), link.target_slot, link.type];
        }, graph.nodes.target);
        expect(link).toEqual([graph.nodes.source, 0, graph.nodes.target, 0, 'IMAGE']);
        expect(await page.evaluate(() => window.app.canvas.linkConnector.isConnecting)).toBe(false);
        if (profile === 'native') return;
        await expectWhites(page, toward(from, to, 30), [80, 40], false);
        expect(await settle(page, 500, 5000)).toBe(true);
        await resetProbe(page);
        await page.waitForTimeout(1500);
        expect(await readProbe(page)).toMatchObject({ front: 0, back: 0 });
    });

    test('cancelled with Escape, draws nothing', async ({ page, profile }) => {
        ours(profile);
        const graph = await buildGraph(page, scene);
        const [from, to] = [await slot(page, graph.nodes.source, false), await slot(page, graph.nodes.target, true)];
        await page.mouse.move(...from);
        await page.mouse.down();
        await page.mouse.move(...toward(from, to, 110), { steps: 12 });
        await expectWhites(page, toward(from, to, 15), [40, 24], true, false, 'glove at the input');
        await page.keyboard.press('Escape');
        expect(await page.evaluate(() => window.app.canvas.linkConnector.isConnecting)).toBe(false);
        await expectWhites(page, toward(from, to, 60), [160, 40], false, false, 'nothing once cancelled');
        await page.mouse.up();
    });

    test('dropped on the canvas, opens the link-release search, with nothing drawn', async ({ page, profile }) => {
        ours(profile);
        const graph = await buildGraph(page, scene);
        const [from, to] = [await slot(page, graph.nodes.source, false), await slot(page, graph.nodes.target, true)];
        // 1.57 opens a dialog, 1.39.5 a search popup.
        const searchBox = page.getByRole('dialog').or(page.getByRole('search')).first();
        await page.mouse.move(...from);
        await page.mouse.down();
        await page.mouse.move(...toward(from, to, 200), { steps: 12 });
        await expectWhites(page, toward(from, to, 200), [40, 40], true, false, 'the open hand');
        await page.mouse.up();
        await expect(searchBox).toBeVisible({ timeout: 3000 });
        await expectWhites(page, toward(from, to, 200), [80, 80], false, false, 'nothing once dropped');
        await page.keyboard.press('Escape');
    });
});

test('dragging from an input reaches for an output of its type', async ({ page, profile }) => {
    ours(profile);
    const graph = await buildGraph(page, scene);
    const [from, to] = [await slot(page, graph.nodes.target, true), await slot(page, graph.nodes.source, false)];
    await page.mouse.move(...from);
    await page.mouse.down();
    await page.mouse.move(...toward(from, to, 110), { steps: 12 });
    expect(await page.evaluate(() => window.app.canvas.linkConnector.state.connectingTo)).toBe('output');
    await expectWhites(page, toward(from, to, 15), [40, 24], true, false, 'glove at the output');
    await page.mouse.up();
});

test('works inside a subgraph', async ({ page, profile }) => {
    ours(profile);
    const graph = await buildGraph(page, { ...scene, subgraph: ['source', 'target'] });
    test.skip(graph.subgraph === null, 'this frontend cannot make subgraphs');
    await openSubgraph(page, graph.subgraph!);
    const [source, target] = await page.evaluate(() => window.app.canvas.graph.nodes.filter((n: { type: string }) => n.type === 'ELNImage').sort((a: { pos: number[] }, b: { pos: number[] }) => a.pos[0] - b.pos[0]).map((n: { id: number }) => Number(n.id)));
    const [from, to] = [await slot(page, source, false), await slot(page, target, true)];
    await page.mouse.move(...from);
    await page.mouse.down();
    await page.mouse.move(...toward(from, to, 110), { steps: 12 });
    await expectWhites(page, toward(from, to, 15), [40, 24], true, false, 'glove at the input');
    await page.mouse.up();
});

test("reaches for the empty slot of a subgraph's output node", async ({ page, profile }) => {
    ours(profile);
    const graph = await buildGraph(page, { ...scene, subgraph: ['source', 'target'] });
    test.skip(graph.subgraph === null, 'this frontend cannot make subgraphs');
    await openSubgraph(page, graph.subgraph!);
    // The output node sits by the origin, the nodes far right of it: zoomed out, both are in view.
    const [out, empty] = await page.evaluate(() => {
        const { canvas } = window.app;
        canvas.ds.scale = 0.7;
        canvas.ds.offset[0] = 300;
        canvas.ds.offset[1] = 250;
        canvas.setDirty(true, true);
        const target = canvas.graph.nodes.reduce((a: { pos: number[] }, b: { pos: number[] }) => (b.pos[0] > a.pos[0] ? b : a));
        return [[...target.getOutputPos(0)], [...canvas.subgraph.outputNode.emptySlot.pos]] as Point[];
    });
    const [from, to] = [await client(page, out), await client(page, empty)];
    await page.mouse.move(...from);
    await page.mouse.down();
    await page.mouse.move(...toward(from, to, 110), { steps: 12 });
    await expectWhites(page, toward(from, to, 15), [40, 24], true, false, 'glove at the empty slot');
    await page.keyboard.press('Escape');
    await page.mouse.up();
});

for (const scale of [1, 2]) {
    test.describe(`in Nodes 2.0 at a device pixel ratio of ${scale}`, () => {
        test.use({ deviceScaleFactor: scale, settings: { 'Comfy.VueNodes.Enabled': true, '🔗 Enhanced Links.Animate': 0, [MODE]: 'hands-eyes' } });

        test('draws over the DOM nodes, on the canvas above them, at the DOM slot dots', async ({ page, profile }) => {
            ours(profile);
            const graph = await buildGraph(page, scene);
            await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(3);
            // The layout store has the DOM slot positions once they mount.
            await expect.poll(async () => {
                const dots = await vueSlotCentres(page, graph.nodes.target);
                const layout = await page.evaluate((id) => [...window.app.canvas.graph.getNodeById(id).getInputPos(0)] as Point, graph.nodes.target);
                return Math.hypot(dots.inputs[0][0] - layout[0], dots.inputs[0][1] - layout[1]);
            }).toBeLessThan(1);
            const [from, to] = [await slot(page, graph.nodes.source, false, true), await slot(page, graph.nodes.target, true, true)];
            await page.mouse.move(...from);
            await page.mouse.down();
            await page.mouse.move(...toward(from, to, 110), { steps: 12 });
            await expectWhites(page, toward(from, to, 15), [40, 24], true, true, 'glove at the input dot');
            await page.mouse.move(...toward(from, to, 60), { steps: 4 });
            await expectWhites(page, toward(from, to, 30), [10, 10], true, true, 'clasped hands');
            await page.mouse.move(...to, { steps: 4 });
            await page.mouse.up();
            expect(await page.evaluate((id) => window.app.canvas.graph.getNodeById(id).inputs[0].link != null, graph.nodes.target)).toBe(true);
            await expectWhites(page, toward(from, to, 30), [80, 40], false, true, 'nothing once dropped');
        });
    });
}

test.describe('looks', () => {
    test.use({ settings: {} });

    test('Showcase gives hands and eyes, Living Wires hands', async ({ page, profile }) => {
        ours(profile);
        await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'looks', advanced: false, search: '' });
        await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
        const panel: Locator = page.locator('.eln');
        for (const [look, mode] of [['showcase', 'hands-eyes'], ['living-wires', 'hands']]) {
            await panel.locator(`[data-look=${look}]`).click();
            await expect.poll(() => settingValues(page, [MODE, '🔗 Enhanced Links.Look'])).toEqual([mode, look]);
        }
    });
});
