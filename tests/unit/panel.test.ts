/**
 * The panel (src/sidebar) through the fake frontend: the tab it registers, the
 * rail badge, and the open panel keeping in step with the settings store until
 * it closes. Its look in a browser is the e2e suite's (tests/e2e/panel.spec.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { L, N } from '@/core/settings';
import { guard } from '@/core/engine';
import { LOOKS } from '@/ui/looks';
import { app, fake } from '../helpers/fake-app';
import { frames, start } from '../helpers/fake-litegraph';

const TAB = 'enhanced-links-nodes';
const PANEL_STATE = '🔗 Enhanced Links.Panel.State';
const LINKS_ON = '🔗 Enhanced Links.Enabled';
const NODES_ON = '📦 Enhanced Nodes.Enabled';
const tab = () => fake.tabs.find((t) => t.id === TAB)!;
/** jsdom's selectors miss attribute values with emoji in them. */
const rowOf = (panel: HTMLElement, id: string) => [...panel.querySelectorAll<HTMLElement>('[data-setting]')].find((el) => el.dataset.setting === id)!;
const settle = () => new Promise((resolve) => setTimeout(resolve));
/** A button by its text or, for an icon, its label. */
const buttonOf = (root: ParentNode, name: string) => [...root.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === name || b.getAttribute('aria-label') === name);
const sectionOf = (panel: HTMLElement, title: string) => [...panel.querySelectorAll<HTMLElement>('.eln-section')].find((s) => s.querySelector('.eln-section-toggle')?.textContent === title)!;
const press = (key: string) => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

/** Opens the panel on `tab`, in an element on the page, as the sidebar's slot is. */
async function open(tab: string, settings: Record<string, unknown> = {}): Promise<HTMLElement> {
    await start({ [PANEL_STATE]: { tab, advanced: false, search: '' }, ...settings });
    const slot = document.body.appendChild(document.createElement('div'));
    fake.tabs.find((t) => t.id === TAB)!.render(slot);
    return slot;
}

/** Closes the panel as the sidebar does: destroy(), then the slot goes. */
function close(slot: HTMLElement): void {
    tab().destroy!();
    slot.remove();
}

describe('the panel', () => {
    it('registers its tab once, whichever extension sets up first, as v2 named it, with an FX label and the brand icon', async () => {
        await start();
        await start();
        expect(fake.tabs.filter((t) => t.id === TAB)).toHaveLength(1);
        expect(tab()).toMatchObject({ title: 'Enhanced Links & Nodes', label: 'FX', icon: 'eln-icon', type: 'custom' });
        expect(document.head.querySelectorAll('style#eln-panel')).toHaveLength(1);
    });

    it('badges the rail OFF with both master switches off and ‖ while links or nodes are frozen', async () => {
        await start();
        const set = (id: string, value: unknown) => app.extensionManager.setting.set(id, value);
        expect(tab().iconBadge).toBe('');
        await set('📦 Enhanced Nodes.Static.Mode', true);
        expect(tab().iconBadge).toBe('‖');
        await set('🔗 Enhanced Links.Enabled', false);
        await set('📦 Enhanced Nodes.Enabled', false);
        expect(tab().iconBadge).toBe('OFF');
        await set('🔗 Enhanced Links.Enabled', true);
        await set('📦 Enhanced Nodes.Static.Mode', false);
        expect(tab().iconBadge).toBe('');
    });

    it('shows a change from the settings dialog while open, a notice for an effect the guard turned off, and once closed listens no more', async () => {
        await start({ '🔗 Enhanced Links.Panel.State': { tab: 'links', advanced: false, search: '' } });
        const panel = document.createElement('div');
        tab().render(panel);
        const toggle = () => rowOf(panel, '🔗 Enhanced Links.Static.Mode').querySelector('[role=switch]')!;
        expect(toggle().getAttribute('aria-checked')).toBe('false');
        await app.extensionManager.setting.set('🔗 Enhanced Links.Static.Mode', true);
        expect(toggle().getAttribute('aria-checked')).toBe('true');
        expect(panel.querySelector('.eln-chip:nth-child(3)')!.getAttribute('aria-pressed')).toBe('mixed');

        vi.spyOn(console, 'warn').mockImplementation(() => {});
        for (let i = 0; i < 5; i++) guard.fail('Link animation', new Error('boom'));
        const notice = panel.querySelector<HTMLElement>('.eln-notice')!;
        expect(notice.textContent).toContain('Link animation kept failing');
        notice.querySelector<HTMLElement>('button')!.click();
        expect(guard.off('Link animation')).toBe(false);
        expect(panel.querySelector('.eln-notice')).toBeNull();

        tab().destroy!();
        await app.extensionManager.setting.set('🔗 Enhanced Links.Static.Mode', false);
        expect(toggle().getAttribute('aria-checked')).toBe('true');
        expect(L.staticMode).toBe(false);
        await settle();
        expect(fake.posts.map(([id]) => id)).toEqual(['🔗 Enhanced Links.Static.Mode', '🔗 Enhanced Links.Static.Mode']);
    });

    it('says what works in Nodes 2.0 as the mode turns on, and disables the titles with a fix that turns classic nodes back on through ComfyUI, as ours go through our store', async () => {
        const slot = await open('nodes', { '📦 Enhanced Nodes.Text.Animation.Enabled': true });
        const canvas = app.canvas as unknown as { setDirty(fg: boolean, bg: boolean): void };
        const titles = rowOf(slot, '📦 Enhanced Nodes.Text.Animation.Enabled');
        const need = titles.querySelector<HTMLElement>('.eln-need')!;
        expect([slot.querySelector('.eln-notice'), need.hidden]).toEqual([null, true]);
        // The pass after the frontend flips the mode.
        LiteGraph.vueNodesMode = true;
        canvas.setDirty(true, true);
        frames(1);
        try {
            expect(slot.querySelector('.eln-notice')!.textContent).toBe('Nodes 2.0 is on: glows, selection and run outlines, particles, selection focus, run visuals and fireworks work. ' +
                'The patterns inside nodes, the hover outline, focus on hover, double-click jumps and animated titles need classic nodes.Use classic nodes');
            expect([need.hidden, need.textContent, titles.querySelector('[role=switch]')!.hasAttribute('inert')]).toEqual([false, 'Classic nodes only. Use classic nodes', true]);
            buttonOf(need, 'Use classic nodes')!.click();
            await settle();
            expect(fake.posts).toEqual([['Comfy.VueNodes.Enabled', false]]);
        } finally {
            LiteGraph.vueNodesMode = false;
        }
        canvas.setDirty(true, true);
        frames(1);
        expect([slot.querySelector('.eln-notice'), need.hidden, titles.querySelector('[role=switch]')!.hasAttribute('inert')]).toEqual([null, true, false]);
        // The title colour's fix sets one of ours, through our store, which shows it at once.
        buttonOf(rowOf(slot, '📦 Enhanced Nodes.Text.Color'), 'Use Custom')!.click();
        expect(N.colorMode).toBe('custom');
        close(slot);
    });

    it('Link FX and Node FX save their master switches alone, and leave the animations as they are', async () => {
        const slot = await open('looks', { '🔗 Enhanced Links.Animate': 4, '📦 Enhanced Nodes.Animate': 2 });
        buttonOf(slot, 'Link FX')!.click();
        buttonOf(slot, 'Node FX')!.click();
        expect([L.enabled, N.enabled, L.animate, N.animate]).toEqual([false, false, 4, 2]);
        await settle();
        buttonOf(slot, 'Link FX')!.click();
        await settle();
        expect(fake.posts).toEqual([[LINKS_ON, false], [NODES_ON, false], [LINKS_ON, true]]);
        expect([L.enabled, N.enabled, L.animate, N.animate]).toEqual([true, false, 4, 2]);
        close(slot);
    });

    it('the quick bar’s Focus chip turns selection focus over; Focus & Flow, which a panel saved on its Runs tab opens on, lays out its four sections', async () => {
        const slot = await open('runs');
        const focus = buttonOf(slot, 'Focus')!;
        expect(focus.getAttribute('aria-pressed')).toBe('true');
        focus.click();
        expect([L.focusEnabled, focus.getAttribute('aria-pressed')]).toEqual([false, 'false']);
        expect(slot.querySelector('[role=tab][aria-selected=true]')!.textContent).toBe('Focus & Flow');
        expect([...slot.querySelectorAll('.eln-section-toggle')].map((t) => t.textContent)).toEqual(['Selection focus', 'Navigation', 'During a run', 'Completion']);
        await settle();
        expect(fake.posts).toEqual([['🔗 Enhanced Links.Focus.Enabled', false]]);
        close(slot);
    });

    it("the quick bar's Look menu moves with the arrows and applies only the look picked; looks applied one after another undo together", async () => {
        const slot = await open('about', { '🔗 Enhanced Links.Thickness': 6, '📦 Enhanced Nodes.Animate': 3 });
        const choose = slot.querySelector<HTMLElement>('#eln-look')!;
        expect([choose.textContent, choose.getAttribute('aria-expanded')]).toEqual([expect.stringContaining('Custom'), 'false']);
        choose.click();
        const items = [...slot.querySelectorAll<HTMLElement>('[role=menu] [role=menuitemradio]')];
        expect(items.map((item) => item.textContent)).toEqual(LOOKS.map((look) => look.name));
        // The user's settings are no look: none is ticked, and the focus starts on the first.
        expect(items.filter((item) => item.getAttribute('aria-checked') === 'true')).toEqual([]);
        expect([document.activeElement, choose.getAttribute('aria-expanded')]).toEqual([items[0], 'true']);
        press('ArrowDown');
        press('ArrowDown');
        expect(document.activeElement).toBe(items[2]);
        press('End');
        expect(document.activeElement).toBe(items.at(-1));
        const escapes = vi.fn();
        window.addEventListener('keydown', escapes);
        press('Escape');
        window.removeEventListener('keydown', escapes);
        expect(escapes).not.toHaveBeenCalled();
        expect([slot.querySelector('[role=menu]'), document.activeElement]).toEqual([null, choose]);
        await settle();
        expect(fake.posts).toEqual([]);

        const pick = (name: string) => {
            choose.click();
            buttonOf(slot.querySelector('[role=menu]')!, name)!.click();
        };
        pick('Showcase');
        expect([L.animate, N.animate, L.look, slot.querySelector('[role=menu]'), document.activeElement]).toEqual([4, 2, 'showcase', null, choose]);
        expect(choose.textContent).toContain('Showcase');
        pick('Presenter');
        expect([L.thickness, L.animate, L.look]).toEqual([5, 9, 'presenter']);
        // Toasts take no action here, so the panel's bar offers the undo: one Undo goes back to before both.
        const bar = slot.querySelector<HTMLElement>('.eln-undo')!;
        expect([bar.hidden, bar.textContent]).toEqual([false, 'Presenter appliedUndo']);
        buttonOf(bar, 'Undo')!.click();
        expect([L.thickness, L.animate, N.animate, L.look]).toEqual([6, 9, 3, 'custom']);
        await settle();
        expect(fake.settings.get('🔗 Enhanced Links.Thickness')).toBe(6);
        close(slot);
    });

    it("comes back in the sidebar's element after another extension's tab drew in it, and in a new one after a built-in tab, which the frontend switches to without destroy()", async () => {
        const slot = await open('links');
        const panel = slot.querySelector('.eln');
        // The frontend renders the slot again.
        tab().render(slot);
        expect(slot.querySelector('.eln')).toBe(panel);
        // Another extension's tab drew in the same element; ours is picked again.
        slot.innerHTML = '<p class="other">Another tab</p>';
        tab().render(slot);
        expect(slot.querySelector('.other')).toBeNull();
        expect(slot.querySelector('.eln [aria-selected=true]')?.textContent).toBe('Links');

        // A built-in tab takes the element away. The panel left behind neither offers an undo nor turns its tabs.
        buttonOf(slot, 'About')!.click();
        buttonOf(slot, 'Show the look picker')!.click();
        slot.remove();
        const card = document.querySelector<HTMLElement>('.eln-picker')!;
        card.querySelector<HTMLElement>('[data-look=showcase]')!.click();
        expect(L.look).toBe('showcase');
        // Toasts take no action here, so the undo shows where the card was.
        const bar = document.querySelector<HTMLElement>('.eln-picker-undo')!;
        expect(bar.isConnected).toBe(true);
        buttonOf(bar, 'Undo')!.click();
        expect(L.look).toBe('custom');
        buttonOf(document.querySelector('.eln-picker')!, 'More looks…')!.click();
        expect(fake.commands).toEqual([`Workspace.ToggleSidebarTab.${TAB}`]);
        expect(L.panelState).toEqual({ tab: 'looks', advanced: false, search: '' });
        const again = document.body.appendChild(document.createElement('div'));
        tab().render(again);
        expect(again.querySelector('.eln [aria-selected=true]')?.textContent).toBe('Looks');
        await settle();
        close(again);
    });

    it('saves its state a second after the search keeps still, and takes the fields a state saved elsewhere lacks at their defaults', async () => {
        const slot = await open('nodes');
        vi.useFakeTimers({ toFake: ['setTimeout'] });
        const search = slot.querySelector<HTMLInputElement>('input[type=search]')!;
        for (const value of ['g', 'gl', 'glo', 'glow']) {
            search.value = value;
            search.dispatchEvent(new Event('input'));
        }
        vi.advanceTimersByTime(999);
        expect(L.panelState.search).toBe('');
        vi.advanceTimersByTime(1);
        vi.useRealTimers();
        expect(L.panelState).toEqual({ tab: 'nodes', advanced: false, search: 'glow' });
        await settle();
        expect(fake.posts).toEqual([[PANEL_STATE, { tab: 'nodes', advanced: false, search: 'glow' }]]);
        close(slot);

        await start({ [PANEL_STATE]: { tab: 'perf' } });
        expect(L.panelState).toEqual({ tab: 'perf', advanced: false, search: '' });
    });

    it('hides a section while none of its settings applies, and moves the focus from a reset that hides to what it reset', async () => {
        const slot = await open('nodes');
        // Node effect None: the glow and the effect colours apply to none.
        expect(['Effect', 'Glow & hover', 'Color', 'Particles', 'Titles'].map((title) => sectionOf(slot, title).hidden)).toEqual([false, true, true, false, false]);
        await app.extensionManager.setting.set('📦 Enhanced Nodes.Animate', 2);
        expect(['Glow & hover', 'Color'].map((title) => sectionOf(slot, title).hidden)).toEqual([false, false]);

        const row = rowOf(slot, '📦 Enhanced Nodes.Animate');
        const reset = row.querySelector<HTMLElement>('.eln-reset')!;
        reset.focus();
        reset.click();
        expect([N.animate, reset.hidden]).toEqual([0, true]);
        expect(document.activeElement).toBe(row.querySelector('[role=radio][aria-checked=true]'));
        await app.extensionManager.setting.set('📦 Enhanced Nodes.Animate', 2);
        const effect = sectionOf(slot, 'Effect');
        const sectionReset = effect.querySelector<HTMLElement>('.eln-section-head .eln-tool')!;
        sectionReset.focus();
        sectionReset.click();
        expect([N.animate, sectionReset.hidden]).toEqual([0, true]);
        expect(document.activeElement).toBe(effect.querySelector('.eln-section-toggle'));
        await settle();
        close(slot);
    });
});
