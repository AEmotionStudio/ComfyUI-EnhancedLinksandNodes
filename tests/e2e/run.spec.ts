// This client's runs in ComfyUI: a chain of Sleep nodes queued from one page while a second page on the same server
// watches, where the river, the progress ring and the fireworks show only in the page that queued the run, the watching
// page's effects keep animating, and Alt+J goes to the running node; Follow pans to a running node off screen and pauses
// while the user drags; a node that fails pulses red, and Alt+J goes to it. The river and ring mid-run, the trail after
// it, the error outline, the Follow chip and the During a run settings are attached as screenshots. They come with the
// extensions, so the -native projects skip them.
import type { Page, TestInfo } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, expect, linkColour, openApp, pixelAt, pointOnLink, readProbe, redraw, resetProbe, setSetting, test, type BuiltGraph, type Point } from './helpers';

const RED = [255, 59, 48];

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'the run visuals come with the extensions');
    await openApp(page);
});

/** Queues the graph shown, as the Run button does. */
const queue = (page: Page) => page.evaluate(() => window.app.queuePrompt(0, 1));

/** The node the frontend shows running: the one it gives a progress (FE157 components/graph/nodeProgressCanvasSync.ts, FE1395 GraphCanvas.vue). */
const running = (page: Page) => page.evaluate(() => Number(window.app.canvas.graph.nodes.find((node: { progress?: number }) => node.progress !== undefined)?.id ?? 0));

const selected = (page: Page) => page.evaluate(() => [...window.app.canvas.selectedItems].map((item: { id: number }) => Number(item.id)));

/** The middle of a node's title bar's top edge, `out` px above it: where its ring and outline cross 12 o'clock, a little clockwise. */
const above = (page: Page, id: number, out: number) => page.evaluate(([id, out]) => {
    const [x, y, w] = window.app.canvas.graph.getNodeById(id).boundingRect;
    return [x + w / 2 + 3, y - out] as Point;
}, [id, out] as const);

/** The theme accent the ring and trail take, as RGB. */
const accent = (page: Page) => page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.color = getComputedStyle(document.body).getPropertyValue('--primary-background') || '#0b8ce9';
    document.body.append(probe);
    const rgb = getComputedStyle(probe).color.match(/\d+/g)!.slice(0, 3).map(Number);
    probe.remove();
    return rgb;
});

/** From now on, counts the radial gradients the page's 2D canvases make: the fireworks' cores, a show at a time. */
const countGradients = (page: Page) => page.evaluate(() => {
    const proto = CanvasRenderingContext2D.prototype;
    const original = proto.createRadialGradient;
    (window as unknown as { __elnGradients: number }).__elnGradients = 0;
    proto.createRadialGradient = function (this: CanvasRenderingContext2D, ...args: Parameters<typeof original>) {
        (window as unknown as { __elnGradients: number }).__elnGradients++;
        return original.apply(this, args);
    };
});
const gradients = (page: Page) => page.evaluate(() => (window as unknown as { __elnGradients: number }).__elnGradients);

/** Pixels within `tolerance` per channel. */
const near = (a: number[], b: number[], tolerance = 24) => b.every((v, i) => Math.abs(a[i] - v) <= tolerance);

/** Attaches a screenshot of the canvas, or of `clip`. */
async function shoot(page: Page, testInfo: TestInfo, name: string, clip = { x: 0, y: 0, width: 1600, height: 900 }): Promise<void> {
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, clip });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** Waits until the frontend shows node `id` running. */
async function untilRunning(page: Page, id: number): Promise<void> {
    await expect.poll(() => running(page), { timeout: 20_000, intervals: [50] }).toBe(id);
}

test('a run shows its river, ring and fireworks in the page that queued it alone, and the page watching keeps animating', async ({ page }, testInfo) => {
    const watcher = await page.context().newPage();
    await openApp(watcher);
    const [graph] = await Promise.all([buildGraph(page, graphs.sleepChain()), buildGraph(watcher, graphs.sleepChain())]);
    await Promise.all([countGradients(page), countGradients(watcher), redraw(page), redraw(watcher)]);
    // A third of the way along the link, away from the marker native draws in its middle.
    const [ringColour, link] = [await accent(page), await pointOnLink(page, graph.links.first, 0.3)];
    // The river's colour: the link's lightened 20 %, which goes over whatever the link shows there, a flow marker too.
    const river = (await linkColour(page, graph.links.first)).slice(0, 3).map((c) => Math.round(c + (255 - c) * 0.2));
    await queue(page);
    await untilRunning(page, graph.nodes.second);
    await expect.poll(async () => near(await pixelAt(page, link), river, 6), { timeout: 3000, intervals: [50] }).toBe(true);
    const ring = await above(page, graph.nodes.second, 10.5);
    expect(near(await pixelAt(page, ring), ringColour, 40), `ring ${await pixelAt(page, ring)}`).toBe(true);
    await shoot(page, testInfo, 'run-river-ring');
    await shoot(page, testInfo, 'run-river-ring-close', { x: 300, y: 180, width: 900, height: 360 });
    // The watching page knows of no run: no ring, no river, and its effects keep moving.
    expect(near(await pixelAt(watcher, ring), ringColour, 40)).toBe(false);
    expect(near(await pixelAt(watcher, link), river, 6)).toBe(false);
    expect(await running(watcher)).toBe(0);
    await resetProbe(watcher);
    await watcher.waitForTimeout(1000);
    expect((await readProbe(watcher)).front).toBeGreaterThan(20);
    await watcher.keyboard.press('Alt+j');
    await expect(watcher.locator('[data-testid=toast], .p-toast-message').filter({ hasText: 'Nothing is running' }).first()).toBeVisible();
    // Done: the fireworks go off in the page that queued the run, over its output nodes.
    await expect.poll(() => gradients(page), { timeout: 20_000 }).toBeGreaterThan(0);
    await page.waitForTimeout(500);
    expect(await gradients(watcher)).toBe(0);
    await page.waitForTimeout(1500);
    await shoot(page, testInfo, 'run-trail');
    await watcher.close();
});

test('Alt+J goes to the node running, and selects it', async ({ page }) => {
    const graph = await buildGraph(page, graphs.sleepChain(1.5));
    await queue(page);
    await untilRunning(page, graph.nodes.second);
    await page.keyboard.press('Alt+j');
    await expect.poll(() => selected(page)).toEqual([graph.nodes.second]);
    // In the middle of the view, at its zoom.
    await expect.poll(() => page.evaluate((id) => {
        const { canvas } = window.app;
        const [x, y, w, h] = canvas.graph.getNodeById(id).boundingRect;
        const area = canvas.visible_area;
        return [Math.round(x + w / 2 - (area[0] + area[2] / 2)), Math.round(y + h / 2 - (area[1] + area[3] / 2)), canvas.ds.scale];
    }, graph.nodes.second)).toEqual([0, 0, 1]);
});

test.describe('Follow execution', () => {
    test.use({ settings: { '🔗 Enhanced Links.Navigate.Follow': true } });

    /** Whether any of node `id` is in the view. */
    const inView = (page: Page, id: number) => page.evaluate((id) => {
        const { canvas } = window.app;
        const [x, y, w, h] = canvas.graph.getNodeById(id).boundingRect;
        const area = canvas.visible_area;
        return x <= area[0] + area[2] && x + w >= area[0] && y <= area[1] + area[3] && y + h >= area[1];
    }, id);

    test('pans to a running node off screen, keeping the zoom', async ({ page }) => {
        const graph = await buildGraph(page, graphs.sleepChain(0.8, 4000));
        await redraw(page);
        expect(await inView(page, graph.nodes.third)).toBe(false);
        await queue(page);
        await expect.poll(() => inView(page, graph.nodes.third), { timeout: 20_000 }).toBe(true);
        expect(await page.evaluate(() => window.app.canvas.ds.scale)).toBe(1);
    });

    test('pauses while the user drags the view, with a chip that resumes it', async ({ page }, testInfo) => {
        const graph: BuiltGraph = await buildGraph(page, graphs.sleepChain(1.5, 4000));
        await queue(page);
        await untilRunning(page, graph.nodes.first);
        // A drag across empty canvas pans the view.
        await page.mouse.move(800, 750);
        await page.mouse.down();
        await page.mouse.move(760, 740, { steps: 4 });
        await page.mouse.up();
        const chip = page.locator('.eln-chipbar');
        await expect(chip).toHaveText('Following pausedResume');
        await expect(chip).toHaveAttribute('role', 'status');
        const box = (await chip.boundingBox())!;
        await shoot(page, testInfo, 'follow-chip', { x: box.x - 60, y: box.y - 40, width: box.width + 120, height: box.height + 80 });
        await untilRunning(page, graph.nodes.third);
        await page.waitForTimeout(500);
        expect(await inView(page, graph.nodes.third)).toBe(false);
        await chip.getByRole('button', { name: 'Resume' }).click();
        await expect.poll(() => inView(page, graph.nodes.third)).toBe(true);
    });
});

test('a node that fails pulses red and holds, its links into it red, and Alt+J goes to it', async ({ page }, testInfo) => {
    const graph = await buildGraph(page, graphs.failing);
    await queue(page);
    // The failure's own report, a dialog or ComfyUI's error panel, is closed again.
    await page.waitForTimeout(1500);
    await page.keyboard.press('Escape');
    await shoot(page, testInfo, 'run-error-pulse');
    await page.waitForTimeout(2500);
    const outline = await above(page, graph.nodes.fail, 10.5);
    expect(near(await pixelAt(page, outline), RED, 40), `outline ${await pixelAt(page, outline)}`).toBe(true);
    await shoot(page, testInfo, 'run-error');
    await page.keyboard.press('Alt+j');
    await expect.poll(() => selected(page)).toEqual([graph.nodes.fail]);
});

test('the Focus & Flow tab lays out what a run does, and where its fireworks go', async ({ page }, testInfo) => {
    await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab: 'runs', advanced: true, search: '' });
    await page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first().click();
    const panel = page.locator('.eln');
    for (const section of ['Selection focus', 'During a run', 'Completion']) await panel.locator('.eln-section-toggle', { hasText: section }).click();
    await panel.locator('.eln-section-toggle', { hasText: 'During a run' }).scrollIntoViewIfNeeded();
    await expect(panel.getByRole('switch', { name: 'Data river' })).toBeVisible();
    await expect(panel.getByRole('combobox', { name: 'Completion anchor' }).or(panel.getByRole('radiogroup', { name: 'Completion anchor' }))).toBeVisible();
    const box = (await panel.boundingBox())!;
    await shoot(page, testInfo, 'focus-flow-runs', { x: box.x, y: box.y, width: box.width, height: box.height });
});
