// The quick toggles in ComfyUI: every command run through the command store; with Shortcut keys at Alt, Alt+L and
// Alt+K, with a text field focused too, and at Alt+Shift, Alt+Shift+L and Alt+Shift+K; off, as by default, no keys,
// and Alt+K left to the browser; no error toast as the page loads; View ▸ Enhanced Links & Nodes with its checks; the canvas menu's
// Enhanced FX; the node menu with a selection of nodes (ComfyUI's own menu on both frontends, and 1.57's Vue menu from
// the selection toolbox); the toolbox's button; the action bar's button; and the About page's badges. Each menu and
// button is attached as a screenshot. The -native projects check only that the keys register without an error toast,
// as a disabled extension's do; the rest comes with the extensions.
import type { Locator, Page, TestInfo } from '@playwright/test';
import { buildGraph, expect, openApp, ours, readProbe, resetProbe, setSetting, settingPosts, settingValues, settle, test, titleOf, toClient, type GraphSpec } from './helpers';

const ID = 'EnhancedLinksNodes.';
const LINKS_ON = '🔗 Enhanced Links.Enabled';
const NODES_ON = '📦 Enhanced Nodes.Enabled';
const STATIC = ['🔗 Enhanced Links.Static.Mode', '📦 Enhanced Nodes.Static.Mode'];
const ANIMATE = ['🔗 Enhanced Links.Animate', '📦 Enhanced Nodes.Animate'];
const THICKNESS = '🔗 Enhanced Links.Thickness';
const LOOK = '🔗 Enhanced Links.Look';
const FOCUS_ON = '🔗 Enhanced Links.Focus.Enabled';
const FOCUS_MODE = '🔗 Enhanced Links.Focus.Mode';
const FOLLOW = '🔗 Enhanced Links.Navigate.Follow';
const SWITCHES = [LINKS_ON, NODES_ON];
const KEYS = '🔗 Enhanced Links.Keys';
const KEYED = ['Workspace.ToggleSidebarTab.enhanced-links-nodes', 'EnhancedLinksNodes.ToggleAll', 'EnhancedLinksNodes.GoToRunning'];

test.use({ settings: { [KEYS]: 'alt' } });

/** Three nodes in a row, the last an output node. */
const ROW: GraphSpec = {
    nodes: {
        first: { type: 'ELNInt', pos: [300, 300] },
        second: { type: 'ELNInt', pos: [650, 300] },
        sleep: { type: 'ELNSleep', pos: [1000, 300] },
    },
};

function execute(page: Page, id: string): Promise<void> {
    return page.evaluate((id) => window.app.extensionManager.command.execute(id), id);
}

/** A toast on either frontend: 1.57's, or 1.39.5's PrimeVue one. */
const toasts = (page: Page) => page.locator('[data-testid=toast], .p-toast-message');

/** Attaches a screenshot of what `locators` show, with some room around them, once menus have faded in. */
async function shoot(page: Page, testInfo: TestInfo, name: string, locators: Locator[]): Promise<void> {
    await page.waitForTimeout(400);
    const boxes = (await Promise.all(locators.map((l) => l.boundingBox()))).filter((b) => b !== null);
    const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - 24);
    const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - 24);
    const right = Math.max(...boxes.map((b) => b.x + b.width)) + 24;
    const bottom = Math.max(...boxes.map((b) => b.y + b.height)) + 24;
    const path = testInfo.outputPath(`${name}.png`);
    await page.screenshot({ path, clip: { x, y, width: right - x, height: bottom - y } });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** Selects nodes as a user does: a click on the first one's title, and Shift and a click on the others'. */
async function select(page: Page, ids: number[]): Promise<void> {
    for (const [i, id] of ids.entries()) {
        const [x, y] = await toClient(page, await titleOf(page, id));
        if (i) await page.keyboard.down('Shift');
        await page.mouse.click(x, y);
        if (i) await page.keyboard.up('Shift');
    }
    expect(await page.evaluate(() => [...window.app.canvas.selectedItems].length)).toBe(ids.length);
}

/** The middle of a node's body, where a right click opens its menu. */
function bodyOf(page: Page, id: number): Promise<[number, number]> {
    return page.evaluate((id) => {
        const { canvas } = window.app;
        const node = canvas.graph.getNodeById(id);
        const rect = canvas.canvas.getBoundingClientRect();
        const [x, y] = canvas.ds.convertOffsetToCanvas([node.pos[0] + node.size[0] / 2, node.pos[1] + node.size[1] / 2]);
        return [rect.left + x, rect.top + y] as [number, number];
    }, id);
}

/** What the extension keeps in each node's properties. */
const properties = (page: Page, ids: number[]) =>
    page.evaluate((ids) => ids.map((id) => Object.fromEntries(Object.entries(window.app.canvas.graph.getNodeById(id).properties).filter(([key]) => key.startsWith('enhanced_fx')))), ids);

test('registers Alt+L, Alt+K and Alt+J as the page loads without an error toast, a disabled extension too', async ({ page, profile, log }) => {
    await openApp(page);
    await page.waitForTimeout(1500);
    const keys = await page.evaluate(() =>
        ['Workspace.ToggleSidebarTab.enhanced-links-nodes', 'EnhancedLinksNodes.ToggleAll', 'EnhancedLinksNodes.GoToRunning'].map((id) => {
            const combo = window.app.extensionManager.command.commands.find((c: { id: string }) => c.id === id)?.keybinding?.combo;
            return combo && `${combo.alt ? 'Alt+' : ''}${combo.key}`;
        }));
    // A disabled extension's keys and commands register, but no panel, so no toggle command for it.
    expect(keys).toEqual([profile === 'native' ? undefined : 'Alt+l', 'Alt+k', 'Alt+j']);
    await expect(toasts(page)).toHaveCount(0);
    expect(log.counts.filter((m) => m.text.includes('already exists'))).toEqual([]);
});

test.describe('with Shortcut keys off, as by default', () => {
    test.use({ settings: {} });

    test('binds no keys, and leaves Alt+K to the browser', async ({ page }) => {
        await openApp(page);
        await page.waitForTimeout(1500);
        const keys = await page.evaluate((ids) => ids.map((id) => window.app.extensionManager.command.commands.find((c: { id: string }) => c.id === id)?.keybinding ?? null), KEYED);
        expect(keys).toEqual([null, null, null]);
        // Heard after ComfyUI's own handler, on the window too, which cancels the keys it acts on.
        await page.evaluate(() => {
            const seen: boolean[] = [];
            (window as unknown as { seen: boolean[] }).seen = seen;
            window.addEventListener('keydown', (e) => {
                if (e.key === 'k') setTimeout(() => seen.push(e.defaultPrevented));
            });
        });
        await page.keyboard.press('Alt+k');
        await expect.poll(() => page.evaluate(() => (window as unknown as { seen: boolean[] }).seen)).toEqual([false]);
        expect(await settingValues(page, SWITCHES)).toEqual([true, true]);
    });
});

test.describe('with Shortcut keys at Alt+Shift', () => {
    test.use({ settings: { [KEYS]: 'alt-shift' } });

    test('Alt+Shift+L opens the panel and Alt+Shift+K toggles every effect; Alt+K does nothing', async ({ page, profile }) => {
        test.skip(profile === 'native', 'the commands act through the extensions');
        await openApp(page);
        await page.keyboard.press('Alt+k');
        await page.waitForTimeout(300);
        expect(await settingValues(page, SWITCHES)).toEqual([true, true]);
        await page.keyboard.press('Alt+Shift+L');
        await expect(page.locator('.eln')).toBeVisible();
        await page.keyboard.press('Alt+Shift+K');
        await expect.poll(() => settingValues(page, SWITCHES)).toEqual([false, false]);
        await expect(toasts(page).filter({ hasText: 'Effects off — Alt+Shift+K to restore' })).toBeVisible();
    });
});

test.describe('with the extensions', () => {
    test.beforeEach(async ({ page, profile }) => {
        test.skip(profile === 'native', 'the commands act through the extensions');
        await openApp(page);
    });

    test('every command runs through the command store and does what it says, one POST for each setting it changes', async ({ page }) => {
        const graph = await buildGraph(page, ROW);
        // From a still canvas, the fireworks over the output node repaint it while they play.
        await setSetting(page, ANIMATE[0], 0);
        expect(await settle(page)).toBe(true);
        await resetProbe(page);
        await execute(page, `${ID}PreviewCompletion`);
        await page.waitForTimeout(500);
        expect((await readProbe(page)).front).toBeGreaterThan(5);

        const posts = settingPosts(page);
        const step = async (command: string, ids: string[], expected: unknown[]) => {
            posts.length = 0;
            await execute(page, `${ID}${command}`);
            await expect.poll(() => settingValues(page, ids), { message: command }).toEqual(expected);
            await expect.poll(() => posts.filter(ours), { message: command }).toEqual(ids);
        };
        await step('ToggleAll', SWITCHES, [false, false]);
        await expect(toasts(page).filter({ hasText: 'Effects off — Alt+K to restore' })).toBeVisible();
        await step('ToggleAll', SWITCHES, [true, true]);
        await step('ToggleLinks', [LINKS_ON], [false]);
        await step('ToggleLinks', [LINKS_ON], [true]);
        await step('ToggleNodes', [NODES_ON], [false]);
        await step('ToggleNodes', [NODES_ON], [true]);
        await step('ToggleStatic', STATIC, [true, true]);
        await step('ToggleStatic', STATIC, [false, false]);
        await step('ToggleFocus', [FOCUS_ON], [false]);
        await expect(toasts(page).filter({ hasText: 'Selection focus off' })).toBeVisible();
        await step('ToggleFocus', [FOCUS_ON], [true]);
        await step('NextFocusMode', [FOCUS_MODE], ['animate']);
        await expect(toasts(page).filter({ hasText: 'Selection focus mode: Animate only these' })).toBeVisible();
        for (const mode of ['dim', 'hide', 'highlight']) await step('NextFocusMode', [FOCUS_MODE], [mode]);
        await step('ToggleFollow', [FOLLOW], [true]);
        await expect(toasts(page).filter({ hasText: 'Follow execution on' })).toBeVisible();
        await step('ToggleFollow', [FOLLOW], [false]);
        await step('NextLinkStyle', [ANIMATE[0]], [9]);
        await expect(toasts(page).filter({ hasText: 'Link animation: Classic Flow' })).toBeVisible();
        await step('NextNodeStyle', [ANIMATE[1]], [1]);

        await select(page, [graph.nodes.first]);
        await execute(page, `${ID}SelectionNodeFX`);
        await expect.poll(() => properties(page, [graph.nodes.first, graph.nodes.second, graph.nodes.sleep])).toEqual([{ enhanced_fx_style: 0 }, {}, {}]);
        await expect(toasts(page).filter({ hasText: '1 node: Off' })).toBeVisible();

        await execute(page, `${ID}ShowPanel`);
        await expect(page.locator('.eln')).toBeVisible();
        await execute(page, `${ID}ShowPanel`);
        await expect(page.locator('.eln')).toBeVisible();
        await execute(page, 'Workspace.ToggleSidebarTab.enhanced-links-nodes');
        await expect(page.locator('.eln')).toHaveCount(0);
        await execute(page, `${ID}ChooseLook`);
        const picker = page.locator('.eln-picker');
        await expect(picker).toBeVisible();
        await picker.getByRole('button', { name: 'Done' }).click();
        await expect(picker).toHaveCount(0);
        await execute(page, `${ID}SurpriseMe`);
        await expect.poll(async () => (await settingValues(page, [LOOK]))[0]).not.toBe('subtle');

        await setSetting(page, THICKNESS, 6);
        // The command waits for the dialog's answer.
        const reset = execute(page, `${ID}ResetAll`);
        const dialog = page.getByRole('dialog').filter({ hasText: 'Reset Enhanced Links & Nodes' });
        await dialog.getByRole('button', { name: 'Confirm' }).click();
        await reset;
        await expect.poll(() => settingValues(page, [THICKNESS, LOOK])).toEqual([3, 'subtle']);
        // A toast's Undo on 1.57+, else the bar over the canvas while the panel is closed.
        await page.getByTestId('toast').filter({ hasText: 'Every setting reset' }).or(page.locator('.eln-picker-undo')).getByRole('button', { name: 'Undo', exact: true }).click();
        await expect.poll(() => settingValues(page, [THICKNESS])).toEqual([6]);
    });

    test('Alt+L opens and closes the panel and Alt+K toggles every effect, also from a text field', async ({ page }) => {
        const panel = page.locator('.eln');
        await page.keyboard.press('Alt+l');
        await expect(panel).toBeVisible();
        await page.keyboard.press('Alt+k');
        await expect.poll(() => settingValues(page, SWITCHES)).toEqual([false, false]);
        await expect(toasts(page).filter({ hasText: 'Effects off — Alt+K to restore' })).toBeVisible();

        const search = panel.getByRole('searchbox');
        await search.fill('glow');
        await search.press('Alt+k');
        await expect.poll(() => settingValues(page, SWITCHES)).toEqual([true, true]);
        await expect(search).toHaveValue('glow');
        await search.press('Alt+l');
        await expect(panel).toBeHidden();
    });

    test('View ▸ Enhanced Links & Nodes lists the commands in three groups, checked as they are on', async ({ page }, testInfo) => {
        // Commands with a check are menuitemcheckboxes on 1.57.
        const item = (name: string) => page.getByRole('menuitem', { name, exact: true }).or(page.getByRole('menuitemcheckbox', { name, exact: true }));
        // Checked as aria-checked on 1.57, with a check icon that shows on 1.39.5.
        const checked = (name: string) => item(name).evaluate((el) => el.getAttribute('aria-checked') === 'true' || !!el.querySelector('.pi-check:not(.invisible)'));
        const NAMES = ['Panel', 'Choose look…', 'Surprise me', 'All effects', 'Link effects', 'Node effects', 'Freeze animation', 'Selection focus', 'Follow execution', 'Go to running node', 'Next error'];
        await page.getByTestId('comfy-menu-button').or(page.locator('.comfy-menu-button-wrapper')).click();
        await item('View').hover();
        await item('Enhanced Links & Nodes').hover();
        await expect(item('Freeze animation')).toBeVisible();
        const group = page.getByRole('menu').filter({ has: item('Freeze animation') }).last();
        await expect(group.locator('[role=menuitem], [role=menuitemcheckbox]')).toHaveText(NAMES.map((name) => new RegExp(`^\\s*${name}`)));
        await expect(group.getByRole('separator')).toHaveCount(2);
        expect(await Promise.all(NAMES.map(checked))).toEqual([false, false, false, true, true, true, false, true, false, false, false]);
        await shoot(page, testInfo, 'view-menu', [group, item('Enhanced Links & Nodes')]);
        // The menu stays open, and its checks follow each click, as ComfyUI's own do.
        await item('Link effects').click();
        await expect.poll(() => settingValues(page, [LINKS_ON])).toEqual([false]);
        await expect.poll(() => Promise.all(NAMES.map(checked))).toEqual([false, false, false, true, false, true, false, true, false, false, false]);
        await item('All effects').click();
        await expect.poll(() => Promise.all(NAMES.map(checked))).toEqual([false, false, false, false, false, false, false, true, false, false, false]);
        await item('Freeze animation').click();
        await expect.poll(() => Promise.all(NAMES.map(checked))).toEqual([false, false, false, false, false, false, true, true, false, false, false]);
        await item('Selection focus').click();
        await expect.poll(() => Promise.all(NAMES.map(checked))).toEqual([false, false, false, false, false, false, true, false, false, false, false]);
        await item('Follow execution').click();
        await expect.poll(() => Promise.all(NAMES.map(checked))).toEqual([false, false, false, false, false, false, true, false, true, false, false]);
        await item('Panel').click();
        await expect(page.locator('.eln')).toBeVisible();
    });

    test('the canvas menu’s Enhanced FX shows the switches and the look, and runs them', async ({ page }, testInfo) => {
        await buildGraph(page, ROW);
        await page.mouse.click(700, 700, { button: 'right' });
        const menu = page.locator('.litecontextmenu');
        await menu.getByText('Enhanced FX', { exact: true }).click();
        const submenu = menu.filter({ hasText: 'Open panel' });
        await expect(submenu.locator('.litemenu-entry')).toHaveText(['☑ Link effects', '☑ Node effects', '☐ Freeze animation', '☑ Selection focus: Highlight', '☐ Follow execution', 'Go to running node', 'Look: Subtle…', 'Surprise me', 'Open panel']);
        await shoot(page, testInfo, 'canvas-menu', [menu.first(), submenu]);
        await submenu.getByText('☐ Freeze animation').click();
        await expect.poll(() => settingValues(page, STATIC)).toEqual([true, true]);
        await expect(menu).toHaveCount(0);
    });

    test('the node menu’s Node FX sets every selected node in one change, and names the global effect', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, ROW);
        await select(page, [graph.nodes.first, graph.nodes.second]);
        await page.mouse.click(...(await bodyOf(page, graph.nodes.second)), { button: 'right' });
        const menu = page.locator('.litecontextmenu');
        await menu.getByText('Node FX (2 selected)', { exact: true }).click();
        const submenu = menu.filter({ hasText: 'Sacred Rosette' });
        await expect(submenu.locator('.litemenu-entry').first()).toHaveText('✓ Use global (Off)');
        await shoot(page, testInfo, 'node-menu', [menu.first(), submenu]);
        await submenu.getByText('Neon Nexus', { exact: true }).click();
        await expect.poll(() => properties(page, [graph.nodes.first, graph.nodes.second, graph.nodes.sleep])).toEqual([{ enhanced_fx_style: 2 }, { enhanced_fx_style: 2 }, {}]);
        await page.keyboard.press('Control+z');
        await expect.poll(() => properties(page, [graph.nodes.first, graph.nodes.second])).toEqual([{}, {}]);
    });

    test('the selection toolbox has the node effect button, which steps the selection through the effects', async ({ page }, testInfo) => {
        const graph = await buildGraph(page, ROW);
        await select(page, [graph.nodes.first]);
        const toolbox = page.locator('.selection-toolbox');
        const button = toolbox.getByRole('button', { name: 'Cycle node effect for selection' });
        await expect(button).toBeVisible();
        await shoot(page, testInfo, 'toolbox', [toolbox]);
        await button.click();
        await expect.poll(() => properties(page, [graph.nodes.first, graph.nodes.second, graph.nodes.sleep])).toEqual([{ enhanced_fx_style: 0 }, {}, {}]);
        await expect(toasts(page).filter({ hasText: '1 node: Off' })).toBeVisible();
    });

    test('the toolbox’s More options, 1.57’s Vue node menu, has Node FX for one node', async ({ page, frontend }, testInfo) => {
        test.skip(frontend === '1.39.5', 'ComfyUI’s own node menu is checked on 1.39.5');
        const graph = await buildGraph(page, ROW);
        await select(page, [graph.nodes.first]);
        await page.locator('.selection-toolbox').getByTestId('more-options-button').click();
        const fx = page.getByRole('menuitem', { name: 'Node FX', exact: true });
        await fx.hover();
        const gentle = page.getByRole('menuitem', { name: 'Gentle Pulse', exact: true });
        await expect(page.getByRole('menuitem', { name: '✓ Use global (Off)', exact: true })).toBeVisible();
        await shoot(page, testInfo, 'vue-node-menu', [page.getByRole('menu').last(), fx]);
        await gentle.click();
        await expect.poll(() => properties(page, [graph.nodes.first])).toEqual([{ enhanced_fx_style: 1 }]);
    });

    test('the action bar’s button toggles every effect', async ({ page }, testInfo) => {
        const button = page.getByRole('button', { name: 'Toggle all effects (Alt+K)' });
        await expect(button).toBeVisible();
        await shoot(page, testInfo, 'action-bar', [button.locator('xpath=../..')]);
        await button.click();
        await expect.poll(() => settingValues(page, SWITCHES)).toEqual([false, false]);
        await button.click();
        await expect.poll(() => settingValues(page, SWITCHES)).toEqual([true, true]);
    });

    test('the About page shows the project at its version, the studio’s Discord and Ko-fi', async ({ page }, testInfo) => {
        await execute(page, 'Comfy.Help.AboutComfyUI');
        const project = page.getByRole('link', { name: /Enhanced Links & Nodes \d+\.\d+\.\d+/ });
        await expect(project).toHaveAttribute('href', 'https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes');
        await expect(page.locator('a[href="https://ko-fi.com/aemotionstudio"]')).toBeVisible();
        await expect(page.getByRole('link', { name: 'Æmotion Studio Discord' })).toHaveAttribute('href', 'https://discord.gg/UzC9353mfp');
        await shoot(page, testInfo, 'about-badges', [project, page.locator('a[href="https://ko-fi.com/aemotionstudio"]')]);
    });
});
