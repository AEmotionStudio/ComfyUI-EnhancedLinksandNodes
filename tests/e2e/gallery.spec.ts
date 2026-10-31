// Screenshots of how links and nodes look, for people to compare by eye: they check nothing. Local only, on both frontends:
//   pnpm e2e:gallery
// Each one is attached to the HTML report (playwright-report) and saved in the test's test-results folder.
//
// The page runs on Playwright's clock. Links start with Animate 0 and node effects are off, so the extension's
// clock stands still while the page loads; each scene then changes its settings with the clock paused and runs it
// for SCENE_MS. That keeps the screenshots close from run to run, not identical: the paused clock stops between
// two of its 16 ms frames, so a scene runs 62 or 63 of them, and v2's particle sizes use Math.random.
import type { Page, TestInfo } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, openApp, setSetting, test, type GraphSpec } from './helpers';

const SCENE_MS = 1000;

/** The part of the gallery graph the link screenshots show, in graph coordinates: left, top, right, bottom. */
const LINK_AREA = [150, 60, 900, 760];

interface Scene {
    name: string;
    /** Over the defaults and the default look's link animation. */
    settings: Record<string, unknown>;
    /** What it shows, when that is not the test's area. */
    area?: number[];
}

const LINK_SCENES: Scene[] = [
    { name: 'default look (Classic Flow)', settings: {} },
    { name: 'Sacred Flow', settings: { '🔗 Enhanced Links.Animate': 1 } },
    { name: 'DNA Helix', settings: { '🔗 Enhanced Links.Animate': 6 } },
    { name: 'Lava Flow', settings: { '🔗 Enhanced Links.Animate': 7 } },
    { name: 'Static mode', settings: { '🔗 Enhanced Links.Static.Mode': true } },
    { name: 'native Straight render mode', settings: { 'Comfy.LinkRenderMode': 0 } },
    { name: 'Link Style dotted', settings: { '🔗 Enhanced Links.Link.Style': 'dotted' } },
    { name: 'Link Style stepped', settings: { '🔗 Enhanced Links.Link.Style': 'stepped' } },
    { name: 'Link Style zigzag', settings: { '🔗 Enhanced Links.Link.Style': 'zigzag' } },
    { name: 'rerouted link', settings: {}, area: [300, 560, 760, 780] },
];

/** The nodeStates graph: a node of each type on the left, and on the right a collapsed, a bypassed and a muted one. */
const NODE_AREA = [180, 60, 1180, 780];

const NODE_SCENES: Scene[] = [
    { name: 'Gentle Pulse', settings: { '📦 Enhanced Nodes.Animate': 1 } },
    { name: 'Neon Nexus', settings: { '📦 Enhanced Nodes.Animate': 2 } },
    { name: 'Cosmic Ripple', settings: { '📦 Enhanced Nodes.Animate': 3 } },
    { name: 'Flower of Life', settings: { '📦 Enhanced Nodes.Animate': 4 } },
    { name: 'Gentle Pulse with particles', settings: { '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true } },
    {
        name: 'Cosmic Ripple at full energy with particles',
        settings: { '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Intensity': 3, '📦 Enhanced Nodes.Animation.Glow': 2, '📦 Enhanced Nodes.Particle.Show': true },
    },
    { name: 'particles alone', settings: { '📦 Enhanced Nodes.Particle.Show': true } },
    { name: 'animated titles', settings: { '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Text.Animation.Enabled': true } },
];

/** The page rectangle that shows a graph area at the current view. */
function clipOf(page: Page, [left, top, right, bottom]: number[]): Promise<{ x: number; y: number; width: number; height: number }> {
    return page.evaluate(([left, top, right, bottom]) => {
        const { canvas } = window.app;
        const rect = canvas.canvas.getBoundingClientRect();
        const [x0, y0] = canvas.ds.convertOffsetToCanvas([left, top]);
        const [x1, y1] = canvas.ds.convertOffsetToCanvas([right, bottom]);
        return { x: rect.left + x0, y: rect.top + y0, width: x1 - x0, height: y1 - y0 };
    }, [left, top, right, bottom]);
}

async function shoot(page: Page, testInfo: TestInfo, index: number, name: string, area: number[]): Promise<void> {
    const path = testInfo.outputPath(`${String(index).padStart(2, '0')}-${name.replace(/\W+/g, '-')}.png`);
    await page.screenshot({ path, clip: await clipOf(page, area) });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** Opens a graph on Playwright's paused clock, then shoots each scene after running it, putting back what it set. */
async function shootScenes(page: Page, testInfo: TestInfo, graph: GraphSpec, scenes: Scene[], area: number[]): Promise<void> {
    await page.clock.install();
    await openApp(page);
    await buildGraph(page, graph);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    for (const [i, scene] of scenes.entries()) {
        const settings: Record<string, unknown> = { '🔗 Enhanced Links.Animate': 9, ...scene.settings };
        const ids = Object.keys(settings);
        const before = await page.evaluate((ids) => ids.map((id) => window.app.extensionManager.setting.get(id)), ids);
        for (const id of ids) await setSetting(page, id, settings[id]);
        await page.clock.runFor(SCENE_MS);
        await shoot(page, testInfo, i + 1, scene.name, scene.area ?? area);
        // Back to nothing that moves, for the next scene.
        for (const [j, id] of ids.entries()) await setSetting(page, id, before[j]);
    }
}

test.describe('gallery', { tag: '@gallery' }, () => {
    test.use({ settings: { '🔗 Enhanced Links.Animate': 0 } });

    test('links', async ({ page }, testInfo) => {
        test.setTimeout(180_000);
        await shootScenes(page, testInfo, graphs.gallery, LINK_SCENES, LINK_AREA);
    });

    test('nodes', async ({ page }, testInfo) => {
        test.setTimeout(180_000);
        await shootScenes(page, testInfo, graphs.nodeStates, NODE_SCENES, NODE_AREA);
    });
});
