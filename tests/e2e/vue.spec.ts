// Nodes 2.0 in ComfyUI: what goes over the nodes, focused links on top, the progress ring, the error outline, the jump
// pulse, the completion effects and the bursts as nodes finish, lands on a canvas above the DOM nodes (1.57.1's
// overlayCtx, or ours on 1.39.5) that matches the main canvas's rect and device pixel ratio, and on the DOM node's box;
// our links end at the DOM slot dots; Follow pauses as the user drags a DOM node. Each DOM node carries its effect,
// selection, run and mode as data-eln-* attributes through a select, a move, a collapse and a workflow switch, and glows
// by them, holding still while ComfyUI disables animations, whatever Motion says; the panel says what works and disables
// what needs classic nodes; and turning the mode on and off leaves one overlay, stylesheet and observer at most. What the
// overlay and the glows show is attached as screenshots, on the dark and light palettes. They come with the extensions,
// so the -native projects skip them.
import type { Page, TestInfo } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, expect, openApp, redraw, setSetting, slotPoint, test, vueSlotCentres, type GraphSpec, type Point } from './helpers';

declare global {
    interface Window {
        __elnPaneObservers: Set<MutationObserver>;
        __elnParticles?: { under: Uint8ClampedArray; around: Uint8ClampedArray };
    }
}

const RED = [255, 59, 48];
const PALETTES = ['dark', 'light'];

test.use({ settings: { 'Comfy.VueNodes.Enabled': true } });

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'the overlay comes with the extensions');
    await openApp(page);
});

/** Pixels within `tolerance` per channel. */
const near = (a: number[], b: number[], tolerance = 40) => b.every((v, i) => Math.abs(a[i] - v) <= tolerance);

const queue = (page: Page) => page.evaluate(() => window.app.queuePrompt(0, 1));

const running = (page: Page) => page.evaluate(() => Number(window.app.canvas.graph.nodes.find((node: { progress?: number }) => node.progress !== undefined)?.id ?? 0));

/** The overlay's RGBA at a graph point. */
const overlayAt = (page: Page, point: Point) => page.evaluate(([x, y]) => {
    const el = (window.app.canvas.overlayCanvas ?? document.querySelector('canvas.eln-overlay')) as HTMLCanvasElement;
    const [cx, cy] = window.app.canvas.ds.convertOffsetToCanvas([x, y]);
    const ratio = el.width / el.clientWidth;
    return [...el.getContext('2d')!.getImageData(Math.floor(cx * ratio), Math.floor(cy * ratio), 1, 1).data];
}, point);

/** How many pixels of the overlay within a node's DOM box are drawn on. */
const drawnOver = (page: Page, id: number) => page.evaluate((id) => {
    const el = (window.app.canvas.overlayCanvas ?? document.querySelector('canvas.eln-overlay')) as HTMLCanvasElement;
    const box = document.querySelector(`.lg-node[data-node-id="${id}"]`)!.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const ratio = el.width / el.clientWidth;
    const data = el.getContext('2d')!.getImageData(Math.round((box.left - rect.left) * ratio), Math.round((box.top - rect.top) * ratio), Math.round(box.width * ratio), Math.round(box.height * ratio)).data;
    let drawn = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i]) drawn++;
    return drawn;
}, id);

/** The middle of a node's top edge, `out` px above it, a little clockwise: where its ring and outline cross 12 o'clock. */
const above = (page: Page, id: number, out: number) => page.evaluate(([id, out]) => {
    const [x, y, w] = window.app.canvas.graph.getNodeById(id).boundingRect;
    return [x + w / 2 + 3, y - out] as Point;
}, [id, out] as const);

/** The theme accent the ring takes, as RGB. */
const accent = (page: Page) => page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.color = getComputedStyle(document.body).getPropertyValue('--primary-background') || '#0b8ce9';
    document.body.append(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g)!.slice(0, 3).map(Number);
    probe.remove();
    return rgb;
});

async function shoot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: 1600, height: 900 } });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** The largest gap, in graph px, between a node's boundingRect and its DOM element's box. */
const boxGap = (page: Page, id: number) => page.evaluate((id) => {
    const { canvas } = window.app;
    const rect = canvas.canvas.getBoundingClientRect();
    const r = document.querySelector(`.lg-node[data-node-id="${id}"]`)!.getBoundingClientRect();
    const [left, top] = canvas.ds.convertCanvasToOffset([r.left - rect.left, r.top - rect.top]);
    const [right, bottom] = canvas.ds.convertCanvasToOffset([r.right - rect.left, r.bottom - rect.top]);
    const [x, y, w, h] = canvas.graph.getNodeById(id).boundingRect;
    return Math.max(Math.abs(left - x), Math.abs(top - y), Math.abs(right - x - w), Math.abs(bottom - y - h));
}, id);

/** Where the overlay is: its rect and the main canvas's, both their sizes in device pixels, and whether it stacks after the transform pane. */
const placement = (page: Page) => page.evaluate(() => {
    const el = (window.app.canvas.overlayCanvas ?? document.querySelector('canvas.eln-overlay')) as HTMLCanvasElement;
    const main: HTMLCanvasElement = window.app.canvas.canvas;
    const pane = document.querySelector('[data-testid="transform-pane"]')!;
    const rect = (e: Element) => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; };
    return {
        rect: rect(el), mainRect: rect(main), size: [el.width, el.height], mainSize: [main.width, main.height], dpr: devicePixelRatio,
        abovePane: !!(pane.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING), pointerEvents: getComputedStyle(el).pointerEvents,
    };
});

for (const scale of [1, 2]) {
    test.describe(`at a device pixel ratio of ${scale}`, () => {
        test.use({ deviceScaleFactor: scale });

        test('the overlay matches the main canvas and stacks above the DOM nodes', async ({ page }) => {
            await buildGraph(page, graphs.pair);
            await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(2);
            await redraw(page);
            const where = await placement(page);
            expect(where).toEqual({ rect: where.mainRect, mainRect: where.mainRect, size: where.mainSize, mainSize: where.mainSize, dpr: scale, abovePane: true, pointerEvents: 'none' });
            expect(where.size[0]).toBe(Math.round(where.rect[2] * scale));
        });
    });
}

for (const palette of PALETTES) {
    test.describe(`focus on the ${palette} palette`, () => {
        test.use({ settings: { 'Comfy.VueNodes.Enabled': true, 'Comfy.ColorPalette': palette } });

        test('focused links go over the DOM node they pass under', async ({ page }, testInfo) => {
            const graph = await buildGraph(page, { nodes: { source: { type: 'ELNInt', pos: [200, 300] }, cover: { type: 'ELNInt', pos: [560, 260] }, target: { type: 'ELNInt', pos: [1100, 300] } }, links: { int: { from: 'source', to: 'target' } } });
            await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(3);
            const middle = await slotPoint(page, graph.links.int, 0.5);
            const covered = await page.evaluate(([x, y]) => {
                const { canvas } = window.app;
                const rect = canvas.canvas.getBoundingClientRect();
                const [cx, cy] = canvas.ds.convertOffsetToCanvas([x, y]);
                return Number(document.elementFromPoint(rect.left + cx, rect.top + cy)?.closest('.lg-node')?.getAttribute('data-node-id'));
            }, middle);
            expect(covered, 'the cover node lies over the link').toBe(graph.nodes.cover);
            await redraw(page);
            expect((await overlayAt(page, middle))[3]).toBe(0);
            await page.locator(`.lg-node[data-node-id="${graph.nodes.source}"]`).click({ position: { x: 40, y: 10 } });
            await redraw(page);
            await expect.poll(async () => near(await overlayAt(page, middle), [255, 255, 255, 255], 30)).toBe(true);
            await shoot(page, testInfo, `vue-focus-on-top-${palette}`);
        });
    });
}

for (const palette of PALETTES) {
    test.describe(`a run on the ${palette} palette`, () => {
        test.use({ settings: { 'Comfy.VueNodes.Enabled': true, 'Comfy.ColorPalette': palette, '📦 Enhanced Nodes.Completion.Style': 'fireworks' } });

        test('a run rings the running DOM node on the overlay, on its box, and the fireworks go off over the DOM nodes', async ({ page }, testInfo) => {
            const graph = await buildGraph(page, graphs.sleepChain(1.5));
            await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(3);
            await redraw(page);
            expect(await boxGap(page, graph.nodes.second)).toBeLessThanOrEqual(2);
            const colour = await accent(page);
            await queue(page);
            await expect.poll(() => running(page), { timeout: 20_000, intervals: [50] }).toBe(graph.nodes.second);
            await expect(page.locator(`.lg-node[data-node-id="${graph.nodes.second}"]`)).toHaveAttribute('data-eln-run', 'running');
            const ring = await above(page, graph.nodes.second, 10.5);
            await expect.poll(async () => near(await overlayAt(page, ring), colour), { timeout: 3000, intervals: [50] }).toBe(true);
            await shoot(page, testInfo, `vue-run-ring-${palette}`);
            await expect.poll(() => drawnOver(page, graph.nodes.third), { timeout: 20_000, intervals: [50] }).toBeGreaterThan(50);
            await shoot(page, testInfo, `vue-fireworks-${palette}`);
        });

        test('a node that fails is outlined red over the DOM nodes, and Alt+J pulses it', async ({ page }, testInfo) => {
            const graph = await buildGraph(page, graphs.failing);
            await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(2);
            await queue(page);
            await page.waitForTimeout(1500);
            await page.keyboard.press('Escape');
            await page.waitForTimeout(2500);
            expect(await boxGap(page, graph.nodes.fail)).toBeLessThanOrEqual(2);
            const outline = await above(page, graph.nodes.fail, 10.5);
            await expect.poll(async () => near(await overlayAt(page, outline), RED), { timeout: 3000 }).toBe(true);
            await expect(page.locator(`.lg-node[data-node-id="${graph.nodes.fail}"]`)).toHaveAttribute('data-eln-run', 'failed');
            await expect(page.locator(`.lg-node[data-node-id="${graph.nodes.sleep}"]`)).not.toHaveAttribute('data-eln-run');
            await shoot(page, testInfo, `vue-run-error-${palette}`);
            await page.keyboard.press('Alt+j');
            // The pulse 6 px out, inside the outline.
            const mark = await above(page, graph.nodes.fail, 6);
            await expect.poll(async () => (await overlayAt(page, mark))[3], { timeout: 2000, intervals: [30] }).toBeGreaterThan(100);
            await shoot(page, testInfo, `vue-jump-pulse-${palette}`);
        });
    });
}

test.describe('completion effects', () => {
    test.use({ settings: { 'Comfy.VueNodes.Enabled': true, '📦 Enhanced Nodes.Run.Ring': false, '📦 Enhanced Nodes.Completion.Style': 'confetti', '📦 Enhanced Nodes.Completion.PerNode': true } });

    test('a burst pops from each DOM node as it finishes, and confetti falls over them when the run is done, on the overlay', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, graphs.sleepChain(0.5));
        await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(3);
        await redraw(page);
        // How many pixels of the overlay round the first node's top-right corner are drawn on.
        const corner = await page.evaluate((id) => {
            const [x, y, w] = window.app.canvas.graph.getNodeById(id).boundingRect;
            return [x + w, y] as Point;
        }, graph.nodes.first);
        const around = () => page.evaluate(([x, y]) => {
            const el = (window.app.canvas.overlayCanvas ?? document.querySelector('canvas.eln-overlay')) as HTMLCanvasElement;
            const [cx, cy] = window.app.canvas.ds.convertOffsetToCanvas([x, y]);
            const ratio = el.width / el.clientWidth;
            const data = el.getContext('2d')!.getImageData(Math.floor((cx - 50) * ratio), Math.floor((cy - 50) * ratio), Math.ceil(100 * ratio), Math.ceil(100 * ratio)).data;
            let drawn = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i]) drawn++;
            return drawn;
        }, corner);
        expect(await around()).toBe(0);
        await queue(page);
        await expect.poll(around, { timeout: 20_000, intervals: [30] }).toBeGreaterThan(10);
        await shoot(page, testInfo, 'vue-node-burst');
        await expect.poll(() => drawnOver(page, graph.nodes.third), { timeout: 20_000, intervals: [50] }).toBeGreaterThan(50);
        await shoot(page, testInfo, 'vue-confetti');
    });
});

test('our links end at the DOM slot dots', async ({ page }) => {
    const graph = await buildGraph(page, graphs.pair);
    await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(2);
    // The path our segment wrote for hit tests passes within 3 px of each dot.
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
    }, { message: 'px between our link path and the slot dots', timeout: 5000 }).toBeLessThanOrEqual(3);
});

test.describe('Follow', () => {
    test.use({ settings: { 'Comfy.VueNodes.Enabled': true, '🔗 Enhanced Links.Navigate.Follow': true } });

    test('pauses while the user drags a DOM node', async ({ page }) => {
        const graph = await buildGraph(page, graphs.sleepChain(1.5, 4000));
        await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(3);
        await queue(page);
        await expect.poll(() => running(page), { timeout: 20_000, intervals: [50] }).toBe(graph.nodes.first);
        const box = (await page.locator(`.lg-node[data-node-id="${graph.nodes.first}"]`).boundingBox())!;
        await page.mouse.move(box.x + 60, box.y + 10);
        await page.mouse.down();
        await page.mouse.move(box.x + 100, box.y + 40, { steps: 4 });
        await page.mouse.up();
        await expect(page.locator('.eln-chipbar')).toHaveText('Following pausedResume');
    });
});

/** One node for each effect, one without, and a bypassed and a muted one, which get Neon Nexus. */
const EFFECTS: GraphSpec = {
    nodes: {
        gentle: { type: 'ELNInt', pos: [140, 240] },
        neon: { type: 'ELNInt', pos: [520, 240] },
        cosmic: { type: 'ELNInt', pos: [900, 240] },
        flower: { type: 'ELNInt', pos: [1280, 240] },
        plain: { type: 'ELNInt', pos: [140, 600] },
        bypassed: { type: 'ELNInt', pos: [520, 600], mode: 'bypass' },
        muted: { type: 'ELNInt', pos: [900, 600], mode: 'mute' },
    },
};

/** Builds EFFECTS and gives its nodes their Node FX, as the node menu does. */
async function effects(page: Page): Promise<Record<string, number>> {
    const { nodes } = await buildGraph(page, EFFECTS);
    await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(7);
    await giveFx(page, { [nodes.gentle]: 1, [nodes.neon]: 2, [nodes.cosmic]: 3, [nodes.flower]: 4, [nodes.bypassed]: 2, [nodes.muted]: 2 });
    return nodes;
}

/** Gives nodes, by id, their own Node FX style. */
const giveFx = (page: Page, styles: Record<number, number>) => page.evaluate((styles) => {
    for (const [id, style] of Object.entries(styles)) window.app.canvas.graph.getNodeById(Number(id)).properties.enhanced_fx_style = style;
    window.app.canvas.setDirty(true, true);
}, styles);

const node = (page: Page, id: number) => page.locator(`.lg-node[data-node-id="${id}"]`);

/** A DOM node's data-eln-* attributes, without the prefix. */
const marks = (page: Page, id: number) => node(page, id).evaluate((el) =>
    Object.fromEntries([...el.attributes].filter((a) => a.name.startsWith('data-eln-')).map((a) => [a.name.slice('data-eln-'.length), a.value])));

/** The mean colour of the band 8 to 14 px right of each DOM node, over the middle third of its height, as the page shows it. */
async function besides(page: Page, ids: number[]): Promise<number[][]> {
    const png = (await page.screenshot()).toString('base64');
    return page.evaluate(async ([png, ids]) => {
        const bytes = Uint8Array.from(atob(png), (c) => c.charCodeAt(0));
        const image = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
        const ctx = new OffscreenCanvas(image.width, image.height).getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        const ratio = image.width / innerWidth;
        return ids.map((id) => {
            const box = document.querySelector(`.lg-node[data-node-id="${id}"]`)!.getBoundingClientRect();
            const data = ctx.getImageData(...([box.right + 8, box.top + box.height / 3, 6, box.height / 3].map((v) => Math.round(v * ratio)) as [number, number, number, number])).data;
            const sum = [0, 0, 0];
            for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += data[i + c];
            return sum.map((v) => (v * 4) / data.length);
        });
    }, [png, ids] as const);
}

/** How far apart two colours are: the sum of their channels' differences. */
const apart = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0);

test('marks each DOM node with its effect, selection and mode, through a select, a move, a collapse and a workflow switch', async ({ page }) => {
    const nodes = await effects(page);
    const expected: Record<number, Record<string, string>> = {
        [nodes.gentle]: { fx: 'gentle' }, [nodes.neon]: { fx: 'neon' }, [nodes.cosmic]: { fx: 'cosmic' }, [nodes.flower]: { fx: 'flower' },
        [nodes.plain]: {}, [nodes.bypassed]: { fx: 'neon', mode: 'bypass' }, [nodes.muted]: { fx: 'neon', mode: 'muted' },
    };
    const all = async () => Object.fromEntries(await Promise.all(Object.keys(expected).map(async (id) => [id, await marks(page, Number(id))])));
    await expect.poll(all).toEqual(expected);
    // The pane's own children, which its observer sees mount.
    await expect(page.locator('[data-testid="transform-pane"] > .lg-node[data-node-id]')).toHaveCount(7);

    await node(page, nodes.gentle).click({ position: { x: 40, y: 10 } });
    await expect.poll(() => marks(page, nodes.gentle)).toEqual({ fx: 'gentle', sel: '' });
    const box = (await node(page, nodes.neon).boundingBox())!;
    await page.mouse.move(box.x + 60, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 100, box.y + 40, { steps: 4 });
    await page.mouse.up();
    await expect.poll(() => node(page, nodes.neon).boundingBox().then((moved) => moved!.x - box.x)).toBeGreaterThan(30);
    await expect.poll(() => marks(page, nodes.neon)).toEqual({ fx: 'neon', sel: '' });
    await expect.poll(() => marks(page, nodes.gentle)).toEqual({ fx: 'gentle' });
    // Collapsed, it keeps its effect and shows no glow, as classic mode draws none on a collapsed node; expanded, it glows again.
    const glow = () => node(page, nodes.cosmic).evaluate((el) => getComputedStyle(el, '::after').content);
    await page.evaluate((id) => window.app.canvas.graph.getNodeById(id).collapse(), nodes.cosmic);
    await expect.poll(() => node(page, nodes.cosmic).boundingBox().then((collapsed) => collapsed!.height)).toBeLessThan(50);
    await expect.poll(() => marks(page, nodes.cosmic)).toEqual({ fx: 'cosmic', collapsed: '' });
    expect(await glow()).toBe('none');
    await page.evaluate((id) => window.app.canvas.graph.getNodeById(id).collapse(), nodes.cosmic);
    await expect.poll(() => marks(page, nodes.cosmic)).toEqual({ fx: 'cosmic' });
    expect(await glow()).toBe('""');

    // Another workflow, whose node takes the first one's id and element; and back.
    const shown = () => page.evaluate(() => window.app.extensionManager.workflow.activeWorkflow.path);
    const first = await shown();
    const other = await buildGraph(page, { nodes: { one: { type: 'ELNInt', pos: [300, 300] } } });
    expect(other.nodes.one).toBe(nodes.gentle);
    await giveFx(page, { [other.nodes.one]: 3 });
    await expect.poll(() => marks(page, other.nodes.one)).toEqual({ fx: 'cosmic' });
    await page.evaluate(() => window.app.extensionManager.command.execute('Workspace.PreviousOpenedWorkflow'));
    await expect.poll(shown).toBe(first);
    await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(7);
    await expect.poll(all).toEqual({ ...expected, [nodes.neon]: { fx: 'neon' } });
});

for (const palette of PALETTES) {
    test.describe(`on the ${palette} palette`, () => {
        // Held still, so each glow shows its resting pose.
        test.use({ settings: { 'Comfy.VueNodes.Enabled': true, 'Comfy.ColorPalette': palette, '📦 Enhanced Nodes.Static.Mode': true } });

        test('each effect glows around its DOM node, bypassed and muted ones fainter, and a selected one more', async ({ page }, testInfo) => {
            const nodes = await effects(page);
            await expect.poll(() => marks(page, nodes.flower)).toEqual({ fx: 'flower' });
            const ids = ['plain', 'gentle', 'neon', 'cosmic', 'flower', 'bypassed', 'muted'].map((name) => nodes[name]);
            const [plain, ...glows] = await besides(page, ids);
            const [gentle, neon, cosmic, flower, bypassed, muted] = glows.map((colour) => apart(colour, plain));
            for (const [name, glow] of Object.entries({ gentle, neon, cosmic, flower })) expect(glow, `${name}'s glow`).toBeGreaterThan(24);
            expect(bypassed).toBeLessThan(muted);
            expect(muted).toBeLessThan(neon);
            await shoot(page, testInfo, `vue-effects-${palette}`);

            await node(page, nodes.neon).click({ position: { x: 40, y: 10 } });
            await expect.poll(() => marks(page, nodes.neon)).toEqual({ fx: 'neon', sel: '' });
            const [selected] = await besides(page, [nodes.neon]);
            expect(apart(selected, plain)).toBeGreaterThan(neon);
            await shoot(page, testInfo, `vue-selection-${palette}`);
        });

        test("the panel says what works in Nodes 2.0, and turns classic nodes back on for what needs them", async ({ page }, testInfo) => {
            await setSetting(page, '📦 Enhanced Nodes.Text.Animation.Enabled', true);
            await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'nodes', advanced: false, search: '' });
            await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
            const panel = page.locator('.eln');
            const notice = panel.locator('.eln-notice').filter({ hasText: 'Nodes 2.0 is on' });
            await expect(notice).toContainText('need classic nodes');
            const sidebar = (await panel.boundingBox())!;
            const shot = async (name: string) => {
                const path = testInfo.outputPath(`${name}.png`);
                await page.screenshot({ path, clip: sidebar });
                await testInfo.attach(name, { path, contentType: 'image/png' });
            };
            await shot(`vue-notice-${palette}`);
            await panel.locator('.eln-section-toggle', { hasText: 'Titles' }).click();
            const titles = panel.locator('[data-setting="📦 Enhanced Nodes.Text.Animation.Enabled"]');
            await expect(titles.locator('.eln-need')).toHaveText('Classic nodes only. Use classic nodes');
            await expect(titles.getByRole('switch')).toHaveAttribute('inert', '');
            await titles.scrollIntoViewIfNeeded();
            await shot(`vue-classic-only-${palette}`);

            await titles.getByRole('button', { name: 'Use classic nodes' }).click();
            await expect.poll(() => page.evaluate(() => window.app.extensionManager.setting.get('Comfy.VueNodes.Enabled'))).toBe(false);
            await expect(notice).toHaveCount(0);
            await expect(titles.locator('.eln-need')).toBeHidden();
            await expect(titles.getByRole('switch')).not.toHaveAttribute('inert');
        });
    });
}

test.describe('with Disable animations on and Motion at Full', () => {
    test.use({ settings: { 'Comfy.VueNodes.Enabled': true, 'Comfy.Appearance.DisableAnimations': true, '🔗 Enhanced Links.Motion': 'full' } });

    test("the glows rest as they do held still, which ComfyUI's cut to 0.001 ms would freeze mid-animation", async ({ page, frontend }) => {
        test.skip(frontend === '1.39.5', 'the setting arrived in 1.43');
        const nodes = await effects(page);
        await expect.poll(() => marks(page, nodes.flower)).toEqual({ fx: 'flower' });
        expect(await page.evaluate(() => [document.body.classList.contains('disable-animations'), document.documentElement.getAttribute('data-eln-pace')])).toEqual([true, null]);
        const pose = (id: number) => node(page, id).evaluate((el) => {
            const glow = getComputedStyle(el, '::after');
            return [glow.animationName, glow.opacity, glow.transform];
        });
        for (const id of [nodes.gentle, nodes.cosmic, nodes.flower]) expect(await pose(id)).toEqual(['none', '1', 'none']);
    });
});

test.describe('particles', () => {
    test.use({ settings: { 'Comfy.VueNodes.Enabled': true, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true, '📦 Enhanced Nodes.Static.Mode': true } });

    test('stay on the main canvas, around the DOM node and none under it', async ({ page }, testInfo) => {
        const { nodes } = await buildGraph(page, { nodes: { node: { type: 'ELNInt', pos: [600, 360] } } });
        await expect(node(page, nodes.node)).toHaveAttribute('data-eln-fx', 'gentle');
        /** How many of the main canvas's pixels under the DOM node, clear of its corners, and within 60 px of it changed since the last look. */
        const changed = async () => {
            await redraw(page);
            return page.evaluate((id) => {
                const main: HTMLCanvasElement = window.app.canvas.canvas;
                const rect = main.getBoundingClientRect();
                const box = document.querySelector(`.lg-node[data-node-id="${id}"]`)!.getBoundingClientRect();
                const ratio = main.width / rect.width;
                const ctx = main.getContext('2d')!;
                const read = (inset: number) => ctx.getImageData(...([box.left + inset - rect.left, box.top + inset - rect.top, box.width - 2 * inset, box.height - 2 * inset].map((v) => Math.round(v * ratio)) as [number, number, number, number])).data;
                const now = { under: read(16), around: read(-60) };
                const before = window.__elnParticles;
                window.__elnParticles = now;
                const differ = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
                    let n = 0;
                    for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++;
                    return n;
                };
                return before && { under: differ(before.under, now.under), around: differ(before.around, now.around) };
            }, nodes.node);
        };
        await changed();
        await shoot(page, testInfo, 'vue-particles');
        await setSetting(page, '📦 Enhanced Nodes.Particle.Show', false);
        const off = await changed();
        expect(off!.under).toBe(0);
        expect(off!.around).toBeGreaterThan(100);
    });
});

test('turning Nodes 2.0 on and off five times leaves one overlay, stylesheet and pane observer at most', async ({ page }) => {
    // Counts the MutationObservers that watch a transform pane, from the page's start.
    await page.addInitScript(() => {
        const watching = (window.__elnPaneObservers = new Set());
        const { observe, disconnect } = MutationObserver.prototype;
        MutationObserver.prototype.observe = function (this: MutationObserver, target: globalThis.Node, options?: MutationObserverInit) {
            if (target instanceof Element && target.matches('[data-testid="transform-pane"]')) watching.add(this);
            return observe.call(this, target, options);
        };
        MutationObserver.prototype.disconnect = function (this: MutationObserver) {
            watching.delete(this);
            return disconnect.call(this);
        };
    });
    await openApp(page);
    const nodes = await effects(page);
    const ours = () => page.locator('canvas.eln-overlay').count();
    const native = await page.evaluate(() => 'overlayCtx' in window.app.canvas);
    const left = () => page.evaluate(() => [document.querySelectorAll('style#eln-vue').length, window.__elnPaneObservers.size]);
    for (let i = 0; i < 5; i++) {
        await setSetting(page, 'Comfy.VueNodes.Enabled', false);
        await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(0);
        await redraw(page);
        expect(await ours()).toBe(0);
        expect(await left()).toEqual([0, 0]);
        await setSetting(page, 'Comfy.VueNodes.Enabled', true);
        await expect(page.locator('.lg-node[data-node-id]')).toHaveCount(7);
        await redraw(page);
        expect(await ours()).toBe(native ? 0 : 1);
        await expect.poll(left).toEqual([1, 1]);
        await expect.poll(() => marks(page, nodes.cosmic)).toEqual({ fx: 'cosmic' });
    }
    expect((await placement(page)).abovePane).toBe(true);
});
