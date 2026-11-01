// The first-run look picker on the profiles it meets (tests/e2e/serve.mjs): a fresh install; the 27 keys v2's panel
// saved for the author, at v2.0.1's defaults; the same keys as the author left them, with link animation None; and a
// v1 user's. Until a choice nothing is saved, and the settings file keeps what it held; then only what the choice
// needs. It comes with the extensions, so the -native projects skip it.
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, drawnNatively, expect, lowestContrast, nativeTargets, openApp, ours, settingPosts, settingValues, test } from './helpers';

declare global {
    interface Window {
        __elnEscapes: number;
    }
}

const LOOK = '🔗 Enhanced Links.Look';
const SEEN = '🔗 Enhanced Links.WhatsNew.Seen';
const ANIMATE = '🔗 Enhanced Links.Animate';
const SHADOWS = ['🔗 Enhanced Links.Link.Shadow.Enabled', '🔗 Enhanced Links.Marker.Shadow.Enabled'];

test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name.endsWith('-native'), 'the picker comes with the extensions');
});

/** The extension's settings in the settings file of `user`. */
async function stored(request: APIRequestContext, user: string): Promise<Record<string, unknown>> {
    const settings: Record<string, unknown> = await (await request.get('/settings', { headers: { 'comfy-user': user } })).json();
    return Object.fromEntries(Object.entries(settings).filter(([id]) => ours(id)));
}

/** Opens the app and waits for the picker; a second later nothing is saved yet, and the file holds what `profile` held. */
async function openPicker(page: Page, request: APIRequestContext, user: string, profile: string, posts: string[]): Promise<Locator> {
    await openApp(page);
    const picker = page.locator('.eln-picker');
    await expect(picker).toBeVisible();
    await page.waitForTimeout(1000);
    expect(posts.filter(ours)).toEqual([]);
    expect(await stored(request, user)).toEqual(await stored(request, profile));
    return picker;
}

/** From now on, counts the Escape keys that reach the window, where ComfyUI's own Escape listens. */
function countEscapes(page: Page): Promise<void> {
    return page.evaluate(() => {
        window.__elnEscapes = 0;
        window.addEventListener('keydown', (event) => event.key === 'Escape' && window.__elnEscapes++);
    });
}

const news = (page: Page) => page.getByText(/^Links stay clickable/);

test.describe('on a fresh install', () => {
    test.use({ profile: 'fresh' });

    test('the picker shows Subtle, and Keep Subtle saves Look and that What’s new was told, and tells nothing', async ({ page, request, user, profile }) => {
        const posts = settingPosts(page);
        const picker = await openPicker(page, request, user, profile, posts);
        await expect(picker.getByRole('radio', { name: /^Subtle/ })).toHaveAttribute('aria-checked', 'true');
        await expect(picker.getByRole('button', { name: 'Keep my settings' })).toHaveCount(0);
        await picker.getByRole('button', { name: 'Keep Subtle' }).click();
        await expect(picker).toHaveCount(0);
        await expect.poll(() => posts.filter(ours)).toEqual([LOOK, SEEN]);
        expect(await stored(request, user)).toEqual({ [LOOK]: 'subtle', [SEEN]: '3.0.0' });
        await page.waitForTimeout(500);
        await expect(news(page)).toHaveCount(0);
    });

    test('the picker takes the focus once; Tab reaches the looks, arrows move through them, and Escape keeps Subtle and goes no further', async ({ page, request, user, profile }) => {
        const posts = settingPosts(page);
        const picker = await openPicker(page, request, user, profile, posts);
        await countEscapes(page);
        await expect(picker).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(picker.getByRole('radio', { name: /^Subtle/ })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(picker.getByRole('radio', { name: /^Showcase/ })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(picker).toHaveCount(0);
        expect(await page.evaluate(() => window.__elnEscapes)).toBe(0);
        await expect.poll(() => posts.filter(ours)).toEqual([LOOK, SEEN]);
        expect(await settingValues(page, [LOOK])).toEqual(['subtle']);
    });

    for (const palette of ['dark', 'light']) {
        test.describe(`on the ${palette} palette`, () => {
            test.use({ settings: { 'Comfy.ColorPalette': palette } });

            test('the picker keeps its text at 4.5:1 or more against what is behind it', async ({ page }) => {
                await openApp(page);
                await expect(page.locator('.eln-picker')).toBeVisible();
                const worst = await lowestContrast(page, '.eln-picker');
                expect(worst[0].ratio, JSON.stringify(worst)).toBeGreaterThanOrEqual(4.5);
            });
        });
    }
});

test.describe('on v2.0.1’s defaults, as v2’s panel saved them', () => {
    test.use({ profile: 'v2-defaults' });

    test('a hovered look shows on the canvas until left; a pick saves only what differs, and its undo brings the picker back; Close keeps Subtle', async ({ page, request, user, profile }) => {
        const posts = settingPosts(page);
        const picker = await openPicker(page, request, user, profile, posts);
        await buildGraph(page, graphs.pair);
        await nativeTargets(page);
        // Subtle shows over the defaults v2 saved, which v3 changed.
        await expect(picker.getByRole('radio', { name: /^Subtle/ })).toHaveAttribute('aria-checked', 'true');
        await expect(picker.getByRole('button', { name: 'Keep my settings' })).toHaveCount(0);
        expect(await drawnNatively(page)).toBe(false);
        await picker.locator('[data-look=off]').hover();
        expect(await drawnNatively(page)).toBe(true);
        await picker.getByRole('heading', { name: 'Choose your look' }).hover();
        expect(await drawnNatively(page)).toBe(false);
        expect(posts.filter(ours)).toEqual([]);

        const looked = [ANIMATE, '📦 Enhanced Nodes.Animate', ...SHADOWS, '🔗 Enhanced Links.Thickness', LOOK];
        const before = await settingValues(page, looked);
        await picker.locator('[data-look=showcase]').click();
        await expect(picker).toHaveCount(0);
        await expect.poll(() => settingValues(page, looked)).toEqual([4, 2, true, true, 3, 'showcase']);
        await expect.poll(() => posts.filter(ours)).toContain(SEEN);
        // One POST for each value that differs: v2's thickness is Showcase's.
        const saved = posts.filter(ours);
        expect(new Set(saved).size).toBe(saved.length);
        expect(saved).toEqual(expect.arrayContaining([ANIMATE, ...SHADOWS, LOOK]));
        expect(saved).not.toContain('🔗 Enhanced Links.Thickness');

        // The toast's Undo on 1.57+, else the bar where the picker was.
        await page.getByTestId('toast').or(page.locator('.eln-picker-undo')).getByRole('button', { name: 'Undo', exact: true }).click();
        await expect(picker).toBeVisible();
        await expect.poll(() => settingValues(page, looked)).toEqual(before);
        await picker.getByRole('button', { name: 'Close' }).click();
        await expect(picker).toHaveCount(0);
        await expect.poll(() => settingValues(page, [LOOK, ...SHADOWS])).toEqual(['subtle', true, true]);
    });
});

test.describe('on the author’s v2 settings', () => {
    test.use({ profile: 'v2-custom' });

    test('link animation None shows until a choice; Keep my settings saves Look alone, What’s new is told once, and the picker is answered for good', async ({ page, request, user, profile, frontend }) => {
        const posts = settingPosts(page);
        const picker = await openPicker(page, request, user, profile, posts);
        await buildGraph(page, graphs.pair);
        await nativeTargets(page);
        expect(await drawnNatively(page)).toBe(true);
        // Their own settings show, which no look is.
        await expect(picker.getByRole('radio', { checked: true })).toHaveCount(0);
        await picker.getByRole('button', { name: 'Keep my settings' }).click();
        await expect(picker).toHaveCount(0);
        await expect.poll(() => posts.filter(ours)).toEqual([LOOK, SEEN]);
        expect(await stored(request, user)).toEqual({ ...(await stored(request, profile)), [LOOK]: 'custom', [SEEN]: '3.0.0' });
        await expect(news(page)).toBeVisible();
        // 1.39.5's toasts take no action.
        if (frontend !== '1.39.5') {
            await page.getByRole('button', { name: "What's new", exact: true }).click();
            await expect(page.getByRole('tab', { name: 'About', exact: true })).toHaveAttribute('aria-selected', 'true');
            await expect(page.getByRole('heading', { name: "What's new in 3.0" })).toBeVisible();
        }

        await openApp(page);
        await page.waitForTimeout(2500);
        await expect(picker).toHaveCount(0);
        await expect(news(page)).toHaveCount(0);
        expect(posts.filter(ours).filter((id) => id !== '🔗 Enhanced Links.Panel.State')).toEqual([LOOK, SEEN]);
    });
});

test.describe('on a v1 user’s settings', () => {
    test.use({ profile: 'v1-era' });

    test('they stay saved as v1 left them until a choice; Escape keeps them, saving Look alone, and What’s new is told', async ({ page, request, user, profile }) => {
        const posts = settingPosts(page);
        const picker = await openPicker(page, request, user, profile, posts);
        await countEscapes(page);
        await expect(picker.getByRole('button', { name: 'Keep my settings' })).toBeVisible();
        await expect(picker).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(picker).toHaveCount(0);
        expect(await page.evaluate(() => window.__elnEscapes)).toBe(0);
        await expect.poll(() => posts.filter(ours)).toEqual([LOOK, SEEN]);
        expect(await stored(request, user)).toEqual({ ...(await stored(request, profile)), [LOOK]: 'custom', [SEEN]: '3.0.0' });
        await expect(news(page)).toBeVisible();
    });
});
