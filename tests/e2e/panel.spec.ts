// The panel, the extensions' sidebar tab: its keys, its text contrast on ComfyUI's dark and light palettes, its sync
// with the settings dialog, the master switches and the rail badge, looks and their undo, About, hover previews, and
// that it draws nothing once closed. It comes with the extensions, so the -native projects skip it.
import type { Locator, Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, drawnNatively, expect, lowestContrast, nativeTargets, openApp, ours, setSetting, settingPosts, settingValues, settle, test } from './helpers';

declare global {
    interface Window {
        __elnEscapes: number;
        __elnTileFills: number;
    }
}

const LINKS_ON = '🔗 Enhanced Links.Enabled';
const NODES_ON = '📦 Enhanced Nodes.Enabled';
const STATIC = ['🔗 Enhanced Links.Static.Mode', '📦 Enhanced Nodes.Static.Mode'];
const ANIMATE = '🔗 Enhanced Links.Animate';
const LOOK = '🔗 Enhanced Links.Look';

test.beforeEach(async ({ page, profile }) => {
    test.skip(profile === 'native', 'the panel comes with the extensions');
    await openApp(page);
});

const rail = (page: Page) => page.getByRole('button', { name: /^Enhanced Links & Nodes/ }).first();

/** Opens the panel on `tab`. */
async function openPanel(page: Page, tab = 'looks'): Promise<Locator> {
    await setSetting(page, '🔗 Enhanced Links.Panel.State', { tab, advanced: false, search: '' });
    await rail(page).click();
    const panel = page.locator('.eln');
    await expect(panel).toBeVisible();
    return panel;
}

const row = (panel: Locator, id: string) => panel.locator(`[data-setting="${id}"]`);

/** From now on, counts the frames gallery tiles draw: each starts with the tile's stage, 320 × 200 scene units. */
async function tileFrames(page: Page): Promise<() => Promise<number>> {
    await page.evaluate(() => {
        window.__elnTileFills = 0;
        const { fillRect } = CanvasRenderingContext2D.prototype;
        CanvasRenderingContext2D.prototype.fillRect = function (this: CanvasRenderingContext2D, ...args: [number, number, number, number]) {
            if ((this.canvas as HTMLCanvasElement).classList?.contains('eln-tile-canvas') && args[2] === 320 && args[3] === 200) window.__elnTileFills++;
            return fillRect.apply(this, args);
        };
    });
    return () => page.evaluate(() => window.__elnTileFills);
}

test('the tabs take the arrow keys, Home and End; a gallery moves its focus with them and picks with Enter; Escape clears the search and goes no further', async ({ page }) => {
    const panel = await openPanel(page);
    const tab = (name: string) => panel.getByRole('tab', { name, exact: true });
    await tab('Looks').focus();
    await page.keyboard.press('ArrowRight');
    await expect(tab('Links')).toBeFocused();
    await expect(tab('Links')).toHaveAttribute('aria-selected', 'true');
    await expect(row(panel, LINKS_ON)).toBeVisible();
    await page.keyboard.press('End');
    await expect(tab('About')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(tab('Looks')).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Home');
    await expect(tab('Looks')).toBeFocused();
    await expect(panel.getByRole('tab', { selected: true })).toHaveCount(1);

    await tab('Links').click();
    const gallery = panel.getByRole('radiogroup', { name: 'Link animation' });
    await gallery.getByRole('radio', { name: 'Classic Flow' }).focus();
    await page.keyboard.press('ArrowRight');
    const sacred = gallery.getByRole('radio', { name: 'Sacred Flow' });
    await expect(sacred).toBeFocused();
    await expect(sacred).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Enter');
    await expect(sacred).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => settingValues(page, [ANIMATE])).toEqual([1]);

    // ComfyUI's own Escape leaves a subgraph; the panel's search keeps it.
    await page.evaluate(() => {
        window.__elnEscapes = 0;
        window.addEventListener('keydown', (event) => event.key === 'Escape' && window.__elnEscapes++);
    });
    const search = panel.getByRole('searchbox', { name: 'Search settings and looks' });
    await search.fill('glow');
    await expect(panel.locator('.eln-crumb').first()).toBeVisible();
    await search.press('Escape');
    await expect(search).toHaveValue('');
    await expect(row(panel, LINKS_ON)).toBeVisible();
    expect(await page.evaluate(() => window.__elnEscapes)).toBe(0);
});

for (const palette of ['dark', 'light']) {
    test.describe(`on the ${palette} palette`, () => {
        // With a notice to read, too.
        test.use({ settings: { 'Comfy.ColorPalette': palette, '🔗 Enhanced Links.Coexist': 'defer' } });

        test('the panel keeps its text at 4.5:1 or more against what is behind it', async ({ page }) => {
            const panel = await openPanel(page);
            await expect(panel.locator('.eln-notice').first()).toBeVisible();
            const worst: { ratio: number; text: string; where: string }[] = [];
            const measure = async (where: string) => {
                await page.waitForTimeout(300);
                worst.push(...(await lowestContrast(page)).map((r) => ({ ...r, where })));
            };
            await measure('Looks');
            await panel.getByRole('button', { name: 'Advanced settings' }).click();
            for (const name of ['Links', 'Nodes', 'Runs', 'Perf']) {
                await panel.getByRole('tab', { name, exact: true }).click();
                // A section none of whose settings applies hides.
                const closed = panel.locator('.eln-section-toggle[aria-expanded=false]').filter({ visible: true });
                while (await closed.count()) await closed.first().click();
                await measure(name);
            }
            await panel.getByRole('tab', { name: 'About', exact: true }).click();
            await panel.getByText('About Æmotion Studio').click();
            await measure('About');
            await panel.getByRole('searchbox').fill('color');
            await measure('search');
            worst.sort((a, b) => a.ratio - b.ratio);
            expect(worst[0].ratio, JSON.stringify(worst.slice(0, 5))).toBeGreaterThanOrEqual(4.5);
        });
    });
}

test('the panel and the settings dialog show each other’s changes', async ({ page }) => {
    const panel = await openPanel(page, 'links');
    const item = (dialog: Locator, name: string) => dialog.locator('.setting-item').filter({ hasText: name }).getByRole('switch');
    await row(panel, STATIC[0]).getByRole('switch').click();
    await expect(panel.getByRole('button', { name: 'Static' })).toHaveAttribute('aria-pressed', 'mixed');

    await page.keyboard.press('Control+Comma');
    const dialog = page.getByRole('dialog');
    await dialog.getByText('Enhanced Links & Nodes', { exact: true }).first().click();
    await expect(item(dialog, 'Freeze link animation')).toBeChecked();
    await item(dialog, 'Flow markers').click();
    await expect(item(dialog, 'Flow markers')).not.toBeChecked();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await panel.getByRole('button', { name: 'Markers', exact: true }).click();
    await expect(row(panel, '🔗 Enhanced Links.Marker.Enabled').getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    await expect(row(panel, '🔗 Enhanced Links.Marker.Shape')).toBeHidden();
});

test('Link FX and Node FX hand links and nodes to native drawing, change nothing else, and badge the rail OFF; Static badges it ‖', async ({ page }) => {
    await buildGraph(page, graphs.pair);
    await nativeTargets(page);
    const panel = await openPanel(page);
    const posts = settingPosts(page);
    const badge = rail(page).locator('.sidebar-icon-badge');
    const chip = (name: string) => panel.getByRole('button', { name, exact: true });
    await expect(badge).toHaveCount(0);
    expect(await drawnNatively(page)).toBe(false);

    await chip('Static').click();
    await expect(badge).toHaveText('‖');
    await expect(chip('Static')).toHaveAttribute('aria-pressed', 'true');
    await chip('Static').click();
    await expect(badge).toHaveCount(0);

    await chip('Node FX').click();
    await expect(chip('Node FX')).toHaveAttribute('aria-pressed', 'false');
    await expect(badge).toHaveCount(0);
    await chip('Link FX').click();
    await expect(badge).toHaveText('OFF');
    expect(await drawnNatively(page)).toBe(true);
    await expect.poll(() => posts.filter(ours)).toEqual([...STATIC, ...STATIC, NODES_ON, LINKS_ON]);
    // The look and every other setting stay as they were.
    expect(await settingValues(page, [ANIMATE, LOOK, ...STATIC])).toEqual([9, 'subtle', false, false]);

    await chip('Link FX').click();
    await expect(badge).toHaveCount(0);
    expect(await drawnNatively(page)).toBe(false);
});

test('a look applied from the panel saves only what differs, and its undo puts every setting back', async ({ page }) => {
    const panel = await openPanel(page);
    const posts = settingPosts(page);
    const before = await settingValues(page, [ANIMATE, '📦 Enhanced Nodes.Animate', '🔗 Enhanced Links.Glow.Intensity', LOOK]);
    await panel.locator('[data-look=showcase]').click();
    await expect(panel.locator('[data-look=showcase]')).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => settingValues(page, [ANIMATE, '📦 Enhanced Nodes.Animate', '🔗 Enhanced Links.Glow.Intensity', LOOK])).toEqual([4, 2, 14, 'showcase']);
    await expect(panel.locator('#eln-look .eln-look-name')).toHaveText('Showcase');
    await expect.poll(() => posts.filter(ours).length).toBe(11);
    expect(posts).not.toEqual(expect.arrayContaining([LINKS_ON]));

    // A toast's Undo on 1.57+, the panel's own on 1.39.5.
    await page.getByTestId('toast').or(panel.locator('.eln-undo')).getByRole('button', { name: 'Undo', exact: true }).click();
    await expect.poll(() => settingValues(page, [ANIMATE, '📦 Enhanced Nodes.Animate', '🔗 Enhanced Links.Glow.Intensity', LOOK])).toEqual(before);
    await expect(panel.locator('[data-look=subtle]')).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => posts.filter(ours).length).toBe(22);
});

test('the quick bar’s Look menu moves with the arrow keys and saves nothing until Enter picks a look; looks picked one after another undo together', async ({ page }) => {
    const panel = await openPanel(page, 'links');
    const posts = settingPosts(page);
    const looked = [ANIMATE, '🔗 Enhanced Links.Thickness', LOOK];
    const before = await settingValues(page, looked);
    await page.evaluate(() => {
        window.__elnEscapes = 0;
        window.addEventListener('keydown', (event) => event.key === 'Escape' && window.__elnEscapes++);
    });
    const choose = panel.locator('#eln-look');
    const menu = panel.getByRole('menu');
    const item = (name: string) => menu.getByRole('menuitemradio', { name, exact: true });
    await choose.focus();
    await page.keyboard.press('Enter');
    await expect(item('Subtle')).toBeFocused();
    await expect(item('Subtle')).toHaveAttribute('aria-checked', 'true');
    for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowDown');
    await expect(item('Classic v1')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(choose).toBeFocused();
    expect(await page.evaluate(() => window.__elnEscapes)).toBe(0);
    await page.waitForTimeout(500);
    expect(posts.filter(ours)).toEqual([]);

    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect.poll(() => settingValues(page, looked)).toEqual([4, 3, 'showcase']);
    await choose.click();
    await item('Presenter').click();
    await expect.poll(() => settingValues(page, looked)).toEqual([9, 5, 'presenter']);
    // A toast's Undo on 1.57+, the panel's own on 1.39.5: one offer, which goes back to before both.
    const undo = page.getByTestId('toast').or(panel.locator('.eln-undo')).getByRole('button', { name: 'Undo', exact: true });
    await expect(undo).toHaveCount(1);
    await undo.click();
    await expect.poll(() => settingValues(page, looked)).toEqual(before);
});

test('the panel shows again after the sidebar switched to another tab, an extension’s or a built-in one, and the picker opens it from there', async ({ page }) => {
    await page.evaluate(() => {
        window.app.extensionManager.registerSidebarTab({
            id: 'eln-test-other', icon: 'pi pi-star', title: 'Other tab', tooltip: 'Other tab', label: 'Other', type: 'custom',
            render: (el: HTMLElement) => (el.innerHTML = '<p class="eln-test-other">Another tab</p>'),
        });
    });
    await openPanel(page, 'links');
    // The picker's card is an .eln too.
    const panel = page.locator('.eln').filter({ has: page.locator('.eln-tabs') });
    const selected = (name: string) => expect(panel.getByRole('tab', { name, exact: true })).toHaveAttribute('aria-selected', 'true');
    // Another extension's tab draws in the element ours drew in.
    await page.getByRole('button', { name: /^Other tab/ }).first().click();
    await expect(page.locator('.eln-test-other')).toBeVisible();
    await rail(page).click();
    await selected('Links');
    await expect(page.locator('.eln-test-other')).toHaveCount(0);

    await panel.getByRole('tab', { name: 'About', exact: true }).click();
    await panel.getByRole('button', { name: 'Show the look picker' }).click();
    const picker = page.locator('.eln-picker');
    await expect(picker).toBeVisible();
    await page.getByRole('button', { name: /^Workflows/ }).first().click();
    await expect(panel).toHaveCount(0);
    await picker.getByRole('button', { name: 'More looks…' }).click();
    await selected('Looks');
    await expect(picker).toHaveCount(0);
});

test.describe('with a setting changed', () => {
    const THICKNESS = '🔗 Enhanced Links.Thickness';
    test.use({ settings: { [THICKNESS]: 6 } });

    test('About tells the version and what is new, links out in tabs of their own, copies diagnostics, shows the picker again and resets everything with undo', async ({ page, context, baseURL }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL });
        const panel = await openPanel(page, 'about');
        const posts = settingPosts(page);
        await expect(panel.getByRole('heading', { name: /^Enhanced Links & Nodes \d+\.\d+\.\d+$/ })).toBeVisible();
        await expect(panel.getByRole('heading', { name: "What's new in 3.0" })).toBeVisible();
        const away = await panel.locator('a[href]').all();
        expect(away.length).toBe(6);
        for (const link of away) {
            expect(await link.getAttribute('target')).toBe('_blank');
            expect(await link.getAttribute('rel')).toContain('noopener');
        }
        await panel.getByRole('button', { name: 'Copy diagnostics' }).click();
        await expect(panel.getByText(/^Copied/)).toBeVisible();
        const report = await page.evaluate(() => navigator.clipboard.readText());
        for (const line of ['Look: subtle, changed since', 'Nodes 2.0: off', `${THICKNESS}: 6`]) expect(report).toContain(line);

        // Shown again, the picker offers another look and closes without saving one.
        await panel.getByRole('button', { name: 'Show the look picker' }).click();
        const picker = page.locator('.eln-picker');
        await expect(picker).toBeVisible();
        await expect(picker.getByRole('button', { name: 'Keep Subtle' })).toHaveCount(0);
        await picker.getByRole('button', { name: 'Close' }).click();
        await expect(picker).toHaveCount(0);

        await panel.getByRole('button', { name: 'Reset everything…' }).click();
        await panel.getByRole('button', { name: 'Reset everything', exact: true }).click();
        await expect.poll(() => settingValues(page, [THICKNESS])).toEqual([3]);
        await page.getByTestId('toast').or(panel.locator('.eln-undo')).getByRole('button', { name: 'Undo', exact: true }).click();
        await expect.poll(() => settingValues(page, [THICKNESS])).toEqual([6]);
        expect(posts.filter(ours)).toEqual([THICKNESS, THICKNESS]);
    });
});

test('hovering a gallery tile shows it on the canvas without saving it, and leaving the tile shows the setting again', async ({ page }) => {
    await buildGraph(page, graphs.pair);
    await nativeTargets(page);
    const panel = await openPanel(page, 'links');
    const posts = settingPosts(page);
    const none = panel.getByRole('radiogroup', { name: 'Link animation' }).getByRole('radio', { name: 'None' });
    await none.hover();
    expect(await drawnNatively(page)).toBe(true);
    // The panel keeps still under the pointer: Animate None would hide the link settings.
    await expect(row(panel, '🔗 Enhanced Links.Animation.Speed')).toBeVisible();
    await panel.getByRole('heading', { name: 'Effect' }).hover();
    expect(await drawnNatively(page)).toBe(false);
    expect(posts.filter(ours)).toEqual([]);
    expect(await settingValues(page, [ANIMATE])).toEqual([9]);
});

test.describe('with the canvas idle', () => {
    test.use({ settings: { [ANIMATE]: 0 } });

    test('the open panel draws its tiles without repainting the canvas, and once closed draws nothing', async ({ page }) => {
        await buildGraph(page, graphs.pair);
        expect(await settle(page)).toBe(true);
        const fills = await tileFrames(page);
        const panel = await openPanel(page, 'links');
        await expect(panel.locator('.eln-gallery').first()).toBeVisible();
        await expect.poll(fills).toBeGreaterThan(10);
        expect(await settle(page)).toBe(true);
        // Tiles move at 30 fps at most: in a second, a frame or two more than that for each tile on screen.
        const shown = await panel.locator('.eln-tile-canvas').evaluateAll((tiles) => tiles.filter((t) => {
            const r = t.getBoundingClientRect();
            return r.bottom > 0 && r.top < innerHeight && r.height > 0;
        }).length);
        const [from, start] = [await fills(), Date.now()];
        await page.waitForTimeout(1000);
        expect((await fills() - from) / shown / ((Date.now() - start) / 1000)).toBeLessThanOrEqual(32);

        await rail(page).click();
        await expect(panel).toBeHidden();
        const closed = await fills();
        await page.waitForTimeout(1000);
        expect(await fills()).toBe(closed);
        expect(await settle(page)).toBe(true);
    });
});

test.describe('with reduced motion', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    test('each tile shows a still frame, drawn again only for a change', async ({ page }) => {
        const fills = await tileFrames(page);
        const panel = await openPanel(page, 'links');
        await expect.poll(fills).toBeGreaterThan(0);
        await page.waitForTimeout(300);
        const still = await fills();
        await page.waitForTimeout(1000);
        expect(await fills()).toBe(still);
        const speed = row(panel, '🔗 Enhanced Links.Animation.Speed').locator('input[type=number]');
        await speed.fill('2');
        await speed.press('Enter');
        await expect.poll(fills).toBeGreaterThan(still);
    });
});
