// The settings as ComfyUI handles them: the native dialog, stored values and their migrations, the
// sidebar's writes, and each extension's settings with the other disabled. A disabled extension's
// settings stay registered, so the -native projects run the dialog and migration tests too.
import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, expect, openApp, readProbe, redraw, resetProbe, test } from './helpers';

const locale = (file: string) => JSON.parse(readFileSync(new URL(`../../locales/en/${file}`, import.meta.url), 'utf8'));
const MAIN = locale('main.json');
/** The settings in display order, keyed as the dialog looks them up: by id with dots as underscores. */
const SETTINGS: Record<string, { name: string }> = locale('settings.json');
/** The dialog panel, then each of its groups, in display order. */
const [PANEL, ...GROUPS]: string[] = Object.values(MAIN.settingsCategories);

/** The vue-i18n key of every string in a locale file. */
const messageKeys = (messages: object, prefix = ''): string[] =>
    Object.entries(messages).flatMap(([key, value]) => (typeof value === 'string' ? [prefix + key] : messageKeys(value, `${prefix}${key}.`)));

const ours = (id: string) => id.startsWith('🔗 Enhanced Links.') || id.startsWith('📦 Enhanced Nodes.');

/** From now on, the ids of the settings the page POSTs, once for each id a POST writes. */
function settingPosts(page: Page): string[] {
    const ids: string[] = [];
    page.on('request', (request) => {
        if (request.method() !== 'POST') return;
        const path = new URL(request.url()).pathname;
        if (path.startsWith('/api/settings/')) ids.push(decodeURIComponent(path.slice('/api/settings/'.length)));
        else if (path === '/api/settings') ids.push(...Object.keys(request.postDataJSON()));
    });
    return ids;
}

function settingValues(page: Page, ids: string[]): Promise<unknown[]> {
    return page.evaluate((ids) => ids.map((id) => window.app.extensionManager.setting.get(id)), ids);
}

/** The registered settings, keyed like {@link SETTINGS}. */
function registered(page: Page): Promise<string[]> {
    return page.evaluate(() => Object.keys(window.app.extensionManager.setting.settings).map((id) => id.replaceAll('.', '_')));
}

test('the frontend has every locales/en string under the key its settings dialog looks up', async ({ page }) => {
    await openApp(page);
    // The dialog falls back to the same English text, so only vue-i18n can tell whether it found ours.
    const missing = await page.evaluate((keys) => {
        const { $te } = (document.getElementById('vue-app') as any).__vue_app__.config.globalProperties;
        return keys.filter((key) => !$te(key));
    }, [...messageKeys(SETTINGS, 'settings.'), ...messageKeys(MAIN)]);
    expect(missing).toEqual([]);
});

test('the settings dialog shows every group and setting, in schema order', async ({ page }) => {
    await openApp(page);
    // The Settings shortcut in both frontends.
    await page.keyboard.press('Control+Comma');
    const dialog = page.getByRole('dialog');
    await dialog.getByText(PANEL, { exact: true }).first().click();
    await expect(dialog.locator('.setting-group h3').first()).toHaveText(GROUPS[0]);
    const shown = await dialog.locator('.setting-group').evaluateAll((groups) => groups.map((group) => ({
        group: group.querySelector('h3')!.textContent!.trim(),
        names: [...group.querySelectorAll('.setting-item')].map((item) => item.querySelector('span[id$="-label"]')!.textContent!.trim()),
    })));
    expect(shown.map((g) => g.group)).toEqual(GROUPS);
    expect(shown.flatMap((g) => g.names)).toEqual(Object.values(SETTINGS).map((s) => s.name));
});

test.describe('with stored values that need migrating', () => {
    const stored = {
        // v2.0.1's dialog showed this choice as a 0-20 slider.
        '🔗 Enhanced Links.Marker.Effects': 3,
        '🔗 Enhanced Links.Thickness': '2',
        '📦 Enhanced Nodes.Text.Color': 'ffff00',
        '📦 Enhanced Nodes.Glow': 7,
    };
    test.use({ settings: stored });

    test('startup migrates them in memory and saves nothing', async ({ page, request, user }) => {
        const posts = settingPosts(page);
        await openApp(page);
        await page.waitForTimeout(3000);
        expect(posts.filter(ours)).toEqual([]);
        const saved = await (await request.get('/settings', { headers: { 'comfy-user': user } })).json();
        expect(saved).toMatchObject(stored);
        expect(await settingValues(page, Object.keys(stored))).toEqual(['none', 2, '#ffff00', 2]);
    });
});

test('the sidebar saves a slider drag and a select change with one POST each', async ({ page, profile }) => {
    test.skip(profile === 'native', 'the sidebar comes with the link extension');
    const THICKNESS = '🔗 Enhanced Links.Thickness';
    const LINK_STYLE = '🔗 Enhanced Links.Link.Style';
    await openApp(page);
    const posts = settingPosts(page);
    await page.getByRole('button', { name: /^Enhanced Links & Nodes Settings/ }).click();
    const sidebar = page.locator('.enh-sidebar');
    await sidebar.getByText('🔗 Link Style', { exact: true }).click();
    const control = (label: string) => sidebar.locator('.enh-control-row').filter({ has: page.getByText(label, { exact: true }) });

    const slider = control('Thickness').locator('input[type=range]');
    await slider.evaluate((el) => el.addEventListener('input', () => {
        el.dataset.steps = String(Number(el.dataset.steps ?? 0) + 1);
    }));
    const box = (await slider.boundingBox())!;
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.1, y);
    await page.mouse.down();
    for (let i = 1; i <= 16; i++) await page.mouse.move(box.x + box.width * (0.1 + i * 0.05), y);
    await page.mouse.up();
    expect(Number(await slider.getAttribute('data-steps'))).toBeGreaterThan(10);
    await expect.poll(() => posts.filter(ours)).toEqual([THICKNESS]);

    await control('Link Style').locator('select').selectOption('dotted');
    await expect.poll(() => posts.filter(ours)).toEqual([THICKNESS, LINK_STYLE]);
    // A late or repeated save would show up by now.
    await page.waitForTimeout(1000);
    expect(posts.filter(ours)).toEqual([THICKNESS, LINK_STYLE]);
    expect(await settingValues(page, [THICKNESS, LINK_STYLE])).toEqual([Number(await slider.inputValue()), 'dotted']);
});

test.describe('with the link extension disabled', () => {
    test.use({
        settings: {
            'Comfy.Extension.Disabled': ['enhanced.link.animations'],
            '📦 Enhanced Nodes.Animate': 1,
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Color.Primary': '#ff0000',
        },
    });

    test('every setting stays registered and node effects use the stored values', async ({ page, profile }) => {
        test.skip(profile === 'native', 'the test chooses which extension is disabled');
        await openApp(page);
        expect(await registered(page)).toEqual(expect.arrayContaining(Object.keys(SETTINGS)));
        await buildGraph(page, graphs.pair);
        // Gentle Pulse fills its glow with gradients from the primary colour.
        const colours = await page.evaluate(() => new Promise<string[]>((resolve) => {
            const proto = CanvasGradient.prototype;
            const addColorStop = proto.addColorStop;
            const added: string[] = [];
            proto.addColorStop = function (offset, colour) {
                added.push(colour);
                addColorStop.call(this, offset, colour);
            };
            const probe = window.__eln;
            const painted = probe.front;
            window.app.canvas.setDirty(true, true);
            const check = () => {
                if (probe.front === painted) {
                    requestAnimationFrame(check);
                    return;
                }
                proto.addColorStop = addColorStop;
                resolve(added);
            };
            requestAnimationFrame(check);
        }));
        expect(colours.filter((c) => c.startsWith('rgba(255, 0, 0,'))).not.toEqual([]);
    });
});

test.describe('with the node extension disabled', () => {
    test.use({ settings: { 'Comfy.Extension.Disabled': ['enhanced.node.animations'], '🔗 Enhanced Links.Animate': 0 } });

    test('every setting stays registered and links use the stored values', async ({ page, profile }) => {
        test.skip(profile === 'native', 'the test chooses which extension is disabled');
        await openApp(page);
        expect(await registered(page)).toEqual(expect.arrayContaining(Object.keys(SETTINGS)));
        const graph = await buildGraph(page, graphs.pair);
        await resetProbe(page);
        await redraw(page);
        // With Animate 0 the link extension hands links to native drawing, which goes through renderLink.
        expect((await readProbe(page)).segments.map((s) => s.link)).toContain(graph.links.int);
    });
});
