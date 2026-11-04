// Upgrading from 2.0.1, and rolling back, beyond what the other specs cover: picker.spec.ts (a fresh install, the 27 keys
// v2's panel saved, the author's v2 values and a v1 user's), settings.spec.ts (either extension disabled keeps every
// setting registered and the other half drawing) and interaction.spec.ts (a workflow holding node choices loads clean).
// Here: the author's own settings file as 2.0.1 left it (fixtures/author-profile.ts) shows the picker and Subtle and is
// not written until a choice; an extension disabled before the upgrade stays disabled through the picker; a workflow
// saved by an older ComfyUI is not marked modified while the busiest look plays on it; and 2.0.1 itself (the v2-ref leg)
// loads cleanly on settings 3.0 wrote.
import type { APIRequestContext, Page } from '@playwright/test';
import { AUTHOR_V2, AUTHOR_V3 } from './fixtures/author-profile';
import * as graphs from './fixtures/graphs';
import { buildGraph, drawnNatively, expect, nativeTargets, openApp, ours, pageErrors, settingPosts, settingValues, test } from './helpers';

const LOOK = '🔗 Enhanced Links.Look';
const SEEN = '🔗 Enhanced Links.WhatsNew.Seen';
const DISABLED = 'Comfy.Extension.Disabled';
/** The settings of AUTHOR_V2 whose 2.0.1 default 3.0 changed, which show 3.0's until the picker is answered, and their 3.0 defaults. */
const OVERLAID = {
    '🔗 Enhanced Links.Link.Shadow.Enabled': true,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': true,
    '📦 Enhanced Nodes.Color.Primary': '#ffb300',
    '📦 Enhanced Nodes.Color.Secondary': '#fb00ff',
    '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
    '📦 Enhanced Nodes.End Animation.Enabled': true,
};

/** What `user`'s settings file holds: the extension's settings, and the disabled extensions. */
async function stored(request: APIRequestContext, user: string): Promise<Record<string, unknown>> {
    const settings: Record<string, unknown> = await (await request.get('/settings', { headers: { 'comfy-user': user } })).json();
    return Object.fromEntries(Object.entries(settings).filter(([id]) => ours(id) || id === DISABLED));
}

/** Whether the workflow shown counts as changed, once its change tracker has looked. */
const modified = (page: Page) => page.evaluate(() => {
    const workflow = window.app.extensionManager.workflow.activeWorkflow;
    const tracker = workflow.changeTracker;
    (tracker.captureCanvasState ?? tracker.checkState).call(tracker);
    return Boolean(workflow.isModified);
});

test.describe('upgrading from 2.0.1', () => {
    test.beforeEach(({}, testInfo) => {
        test.skip(testInfo.project.name.endsWith('-native'), 'the picker comes with the extensions');
    });

    test.describe('on the author’s settings as 2.0.1 left them', () => {
        test.use({ profile: 'fresh', settings: AUTHOR_V2 });

        test('the picker shows Subtle and nothing is saved, across a reload, until Keep Subtle saves what Subtle changes', async ({ page, request, user }) => {
            const posts = settingPosts(page);
            const before = await stored(request, user);
            expect(before).toEqual({ ...AUTHOR_V2, [DISABLED]: [] });
            for (const load of [1, 2]) {
                await openApp(page);
                const picker = page.locator('.eln-picker');
                await expect(picker, `load ${load}`).toBeVisible();
                await expect(picker.getByRole('radio', { name: /^Subtle/ })).toHaveAttribute('aria-checked', 'true');
                await expect(picker.getByRole('button', { name: 'Keep my settings' })).toHaveCount(0);
                await buildGraph(page, graphs.pair);
                await nativeTargets(page);
                expect(await drawnNatively(page)).toBe(false);
                await page.waitForTimeout(1000);
                expect(posts.filter(ours)).toEqual([]);
                expect(await stored(request, user)).toEqual(before);
            }
            await page.locator('.eln-picker').getByRole('button', { name: 'Keep Subtle' }).click();
            await expect.poll(() => posts.filter(ours).sort()).toEqual([...Object.keys(OVERLAID), LOOK, SEEN].sort());
            expect(await stored(request, user)).toEqual({ ...before, ...OVERLAID, [LOOK]: 'subtle', [SEEN]: '3.0.0' });
        });
    });

    for (const off of ['enhanced.link.animations', 'enhanced.node.animations']) {
        test.describe(`with ${off} disabled`, () => {
            test.use({ profile: 'fresh', settings: { ...AUTHOR_V2, [DISABLED]: [off] } });

            test('it stays disabled through the picker and a reload, and the links show which half runs', async ({ page, request, user, log }) => {
                const posts = settingPosts(page);
                await openApp(page);
                const picker = page.locator('.eln-picker');
                await expect(picker).toBeVisible();
                await page.waitForTimeout(1000);
                expect(posts.filter(ours)).toEqual([]);
                await picker.getByRole('button', { name: 'Keep Subtle' }).click();
                await expect(picker).toHaveCount(0);
                await expect.poll(() => posts.filter(ours)).toContain(LOOK);
                await page.waitForTimeout(500);
                expect(posts).not.toContain(DISABLED);

                await openApp(page);
                expect(await settingValues(page, [DISABLED])).toEqual([[off]]);
                expect((await stored(request, user))[DISABLED]).toEqual([off]);
                expect(log.counts.map((m) => m.text)).toContain(`Extension ${off} is disabled.`);
                await page.waitForTimeout(2500);
                await expect(picker).toHaveCount(0);
                await buildGraph(page, graphs.pair);
                await nativeTargets(page);
                // Subtle's links are the link extension's; with it off they are ComfyUI's.
                expect(await drawnNatively(page)).toBe(off === 'enhanced.link.animations');
                expect(pageErrors(log)).toEqual([]);
            });
        });
    }
});

test.describe('a workflow saved by an older ComfyUI', () => {
    // As frontends of early 2025 saved one: links as arrays, a legacy Reroute node, a group, no revision or reroutes.
    const OLD = {
        last_node_id: 4,
        last_link_id: 3,
        nodes: [
            { id: 1, type: 'EmptyImage', pos: [100, 100], size: [315, 130], flags: {}, order: 0, mode: 0, inputs: [], outputs: [{ name: 'IMAGE', type: 'IMAGE', links: [1], slot_index: 0 }], properties: { 'Node name for S&R': 'EmptyImage' }, widgets_values: [512, 512, 1, 0] },
            { id: 2, type: 'Reroute', pos: [520, 300], size: [75, 26], flags: {}, order: 1, mode: 0, inputs: [{ name: '', type: '*', link: 1 }], outputs: [{ name: '', type: 'IMAGE', links: [2], slot_index: 0 }], properties: { showOutputText: false, horizontal: false } },
            { id: 3, type: 'ImageInvert', pos: [700, 100], size: [210, 26], flags: {}, order: 2, mode: 0, inputs: [{ name: 'image', type: 'IMAGE', link: 2 }], outputs: [{ name: 'IMAGE', type: 'IMAGE', links: [3], slot_index: 0 }], properties: { 'Node name for S&R': 'ImageInvert' } },
            { id: 4, type: 'PreviewImage', pos: [1000, 100], size: [210, 246], flags: {}, order: 3, mode: 0, inputs: [{ name: 'images', type: 'IMAGE', link: 3 }], outputs: [], properties: { 'Node name for S&R': 'PreviewImage' } },
        ],
        links: [[1, 1, 0, 2, 0, '*'], [2, 2, 0, 3, 0, 'IMAGE'], [3, 3, 0, 4, 0, 'IMAGE']],
        groups: [{ title: 'Group', bounding: [80, 20, 1160, 360], color: '#3f789e', font_size: 24, flags: {} }],
        config: {},
        extra: { ds: { scale: 1, offset: [0, 0] } },
        version: 0.4,
    };

    // The look that moves the most: swinging wires, particles, Neon Nexus nodes.
    test.use({ settings: { [LOOK]: 'showcase', '🔗 Enhanced Links.Animate': 4, '🔗 Enhanced Links.Physics.Profile': 'rope', '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Particle.Show': true } });

    test('loads, animates and is not marked modified', async ({ page, log }) => {
        await openApp(page);
        await page.evaluate(async (workflow) => {
            await window.app.loadGraphData(workflow, true, true, 'old.json');
        }, OLD);
        // Drag nothing, but let the wires settle and the effects play.
        await page.waitForTimeout(2000);
        expect(await page.evaluate(() => window.app.canvas.graph.nodes.length)).toBe(4);
        expect(await modified(page)).toBe(false);
        expect(pageErrors(log)).toEqual([]);
    });
});

test.describe('rolling back to 2.0.1', { tag: '@rollback' }, () => {
    test.beforeEach(({}, testInfo) => {
        test.skip(testInfo.project.name !== 'v2-ref', 'the v2-ref leg serves 2.0.1');
    });

    // Values only 3.0 has for settings 2.0.1 has too, and 3.0's own settings away from their defaults.
    const NEW = {
        '🔗 Enhanced Links.Animate': 11,
        '🔗 Enhanced Links.Link.Style': 'coil',
        '🔗 Enhanced Links.Marker.Shape': 'merkaba',
        '🔗 Enhanced Links.Marker.Color.Mode': 'inherit',
        '🔗 Enhanced Links.Particle.Density': 3,
        '📦 Enhanced Nodes.Animate': 9,
        '📦 Enhanced Nodes.Particle.Color.Mode': 'aurora',
        '📦 Enhanced Nodes.End Animation.Enabled': true,
        '📦 Enhanced Nodes.Text.Animation.Enabled': true,
        '📦 Enhanced Nodes.Text.Style': 'retro',
        [LOOK]: 'showcase',
        [SEEN]: '3.0.0',
        '🔗 Enhanced Links.Panel.State': { tab: 'perf', advanced: true, search: 'glow' },
        '🔗 Enhanced Links.Enabled': true,
        '📦 Enhanced Nodes.Enabled': true,
        '🔗 Enhanced Links.Physics.Profile': 'gel',
        '🔗 Enhanced Links.Assist.Mode': 'hands-eyes',
        '🔗 Enhanced Links.Blend': 'additive',
        '🔗 Enhanced Links.Shadow.Style': 'drop',
        '🔗 Enhanced Links.Focus.Mode': 'dim',
        '🔗 Enhanced Links.Pause.Mode': 'calm',
        '🔗 Enhanced Links.Perf.MaxFps': 0,
        '🔗 Enhanced Links.Motion': 'full',
        '📦 Enhanced Nodes.Completion.Style': 'confetti',
        '📦 Enhanced Nodes.Completion.PerNode': true,
        '📦 Enhanced Nodes.Background': 'plasma',
        '📦 Enhanced Nodes.Background.Strength': 0.8,
    };

    for (const [name, settings] of [['the author’s settings as 3.0 left them', AUTHOR_V3], ['values only 3.0 has', NEW]] as const) {
        test.describe(`on ${name}`, () => {
            test.use({ profile: 'fresh', settings });

            test('2.0.1 loads and draws without errors, and leaves 3.0’s settings in the file', async ({ page, request, user, log }) => {
                const before = await stored(request, user);
                await openApp(page);
                await buildGraph(page, graphs.typed);
                await page.waitForTimeout(2000);
                expect(await page.evaluate(() => window.__eln.front)).toBeGreaterThan(0);
                expect(pageErrors(log)).toEqual([]);
                expect(await stored(request, user)).toEqual(before);
            });
        });
    }
});
