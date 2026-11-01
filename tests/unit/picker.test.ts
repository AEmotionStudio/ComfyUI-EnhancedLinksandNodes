/**
 * The first-run look picker (src/sidebar/picker.ts) through the fake frontend,
 * whose toasts take no action, as 1.39.5's do: when it shows, what each answer
 * saves, a pick's undo, Escape, and What's new for upgraders. The profiles it
 * meets in a browser, its keys and its look are the e2e suite's
 * (tests/e2e/picker.spec.ts).
 */

import { describe, it, expect, vi } from 'vitest';
import { L, LOOK, N, commit, setting } from '@/core/settings';
import { fake } from '../helpers/fake-app';
import { queue, start } from '../helpers/fake-litegraph';

const SEEN = '🔗 Enhanced Links.WhatsNew.Seen';
const THICKNESS = '🔗 Enhanced Links.Thickness';
const LINK_SHADOW = '🔗 Enhanced Links.Link.Shadow.Enabled';

/** The v2.0.1 defaults v3 changed, which the v2 panel saved into users' settings, in schema order. */
const V2_CHANGED: Record<string, unknown> = {
    '🔗 Enhanced Links.Link.Shadow.Enabled': false,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
    '📦 Enhanced Nodes.Color.Primary': '#44aaff',
    '📦 Enhanced Nodes.Color.Secondary': '#88ccff',
    '📦 Enhanced Nodes.Color.Accent': '#0088ff',
    '📦 Enhanced Nodes.Color.Particle': '#ffff00',
    '📦 Enhanced Nodes.End Animation.Enabled': false,
};

const card = () => document.querySelector<HTMLElement>('.eln-picker');
/** A button by its text or, for an icon, its label. */
const buttonOf = (root: ParentNode, name: string) => [...root.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === name || b.getAttribute('aria-label') === name);
/** Lets the write queue drain: the fake store's writes finish within microtasks. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

/** Shows the picker again, as About's button does. */
function fromAbout(): HTMLElement {
    const tab = fake.tabs.find((t) => t.id === 'enhanced-links-nodes')!;
    const panel = document.createElement('div');
    tab.render(panel);
    buttonOf(panel, 'Show the look picker')!.click();
    tab.destroy!();
    return card()!;
}

/** A page with `settings` stored and the look unanswered, with the picker showing. */
async function firstRun(settings: Record<string, unknown> = {}): Promise<HTMLElement> {
    await start({ [LOOK]: '', '🔗 Enhanced Links.Panel.State': { tab: 'about', advanced: false, search: '' }, ...settings });
    return fromAbout();
}

describe('the first-run picker', () => {
    // First, as the page that loads first sets the picker up.
    it('shows once the page is idle and no run is going, on a page that loads with the look unanswered, and saves nothing', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout'] });
        await start({ [LOOK]: '' });
        queue(1);
        vi.advanceTimersByTime(1500);
        expect(card()).toBeNull();
        queue(0);
        vi.advanceTimersByTime(1500);
        vi.useRealTimers();
        const picker = card()!;
        expect(picker.querySelector('[aria-checked=true]')?.getAttribute('data-look')).toBe('subtle');
        expect(buttonOf(picker, 'Keep my settings')).toBeUndefined();
        await settle();
        expect(fake.posts).toEqual([]);
        buttonOf(picker, 'Close')!.click();
    });

    it("Keep Subtle on v2.0.1's defaults saves the v3 defaults that show, Look, and that What's new was told, and tells nothing", async () => {
        const picker = await firstRun(V2_CHANGED);
        expect(buttonOf(picker, 'Keep my settings')).toBeUndefined();
        buttonOf(picker, 'Keep Subtle')!.click();
        expect(card()).toBeNull();
        await settle();
        expect(fake.posts).toEqual([...Object.keys(V2_CHANGED).map((id) => [id, setting(id).default]), [LOOK, 'subtle'], [SEEN, '3.0.0']]);
        expect(fake.toasts).toEqual([]);
    });

    it("Keep my settings saves Look alone, an upgrader who customised hears what is new once, and the picker shown again offers another look", async () => {
        const picker = await firstRun({ ...V2_CHANGED, [THICKNESS]: 6 });
        // Their own settings show, which no look is.
        expect(picker.querySelector('[aria-checked=true]')).toBeNull();
        buttonOf(picker, 'Keep my settings')!.click();
        expect(card()).toBeNull();
        expect([L.linkShadowEnabled, L.thickness]).toEqual([false, 6]);
        await settle();
        expect(fake.posts).toEqual([[LOOK, 'custom'], [SEEN, '3.0.0']]);
        expect(fake.toasts).toEqual([expect.objectContaining({ severity: 'info', summary: 'Enhanced Links & Nodes 3.0' })]);

        const again = fromAbout();
        expect([buttonOf(again, 'Keep Subtle'), buttonOf(again, 'Keep my settings')]).toEqual([undefined, undefined]);
        again.querySelector<HTMLElement>('[data-look=performance]')!.click();
        expect([L.staticMode, L.look]).toEqual([true, 'performance']);
        await settle();
        expect(fake.toasts).toHaveLength(1);
        document.querySelector<HTMLElement>('.eln-picker-undo button')!.click();
        expect([L.staticMode, L.look]).toEqual([false, 'custom']);
        buttonOf(card()!, 'Done')!.click();
        expect(card()).toBeNull();
        await settle();
    });

    it('a pick that changes what shows offers its undo where the card was, here where toasts take no action and the panel is closed, and the undo asks again', async () => {
        const picker = await firstRun();
        picker.querySelector<HTMLElement>('[data-look=showcase]')!.click();
        expect(card()).toBeNull();
        expect([L.animate, L.look]).toEqual([4, 'showcase']);
        const bar = document.querySelector<HTMLElement>('.eln-picker-undo')!;
        expect(bar.textContent).toContain('Showcase applied');
        buttonOf(bar, 'Undo')!.click();
        expect(document.querySelector('.eln-picker-undo')).toBeNull();
        expect([L.animate, L.look]).toEqual([9, '']);
        expect(buttonOf(card()!, 'Keep Subtle')).toBeDefined();
        buttonOf(card()!, 'Close')!.click();
        expect(L.look).toBe('subtle');
        await settle();
        // Told once, though answered twice.
        expect(fake.posts.filter(([id]) => id === SEEN)).toEqual([[SEEN, '3.0.0']]);
    });

    it('Close keeps a change made in the panel before the answer, and saves only Look and that What’s new was told besides', async () => {
        const picker = await firstRun();
        commit(THICKNESS, 5);
        buttonOf(picker, 'Close')!.click();
        expect(card()).toBeNull();
        expect([L.thickness, L.look]).toEqual([5, 'custom']);
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 5], [LOOK, 'custom'], [SEEN, '3.0.0']]);
        expect(document.querySelector('.eln-picker-undo')).toBeNull();
    });

    it("Escape keeps link shadows turned off before the answer on v2.0.1's defaults, and saves the rest as the overlay showed it", async () => {
        const picker = await firstRun(V2_CHANGED);
        commit(LINK_SHADOW, false);
        picker.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        expect(card()).toBeNull();
        expect([L.linkShadowEnabled, L.markerShadowEnabled, N.endAnimationEnabled, L.look]).toEqual([false, true, true, 'custom']);
        await settle();
        const rest = Object.keys(V2_CHANGED).filter((id) => id !== LINK_SHADOW);
        expect(fake.posts).toEqual([...rest.map((id) => [id, setting(id).default]), [LOOK, 'custom'], [SEEN, '3.0.0']]);
    });

    it('an upgrader who customised hears what is new once, though the look is picked, undone and answered again', async () => {
        const picker = await firstRun({ ...V2_CHANGED, [THICKNESS]: 6 });
        picker.querySelector<HTMLElement>('[data-look=showcase]')!.click();
        await settle();
        document.querySelector<HTMLElement>('.eln-picker-undo button')!.click();
        expect(L.look).toBe('');
        buttonOf(card()!, 'Keep my settings')!.click();
        await settle();
        expect(L.look).toBe('custom');
        expect(fake.toasts).toEqual([expect.objectContaining({ summary: 'Enhanced Links & Nodes 3.0' })]);
    });

    it('Escape keeps what shows and goes no further; on the picker shown again it only closes', async () => {
        const picker = await firstRun();
        expect(document.activeElement).toBe(picker);
        const escapes = vi.fn();
        window.addEventListener('keydown', escapes);
        const escape = () => document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        escape();
        expect(card()).toBeNull();
        expect(L.look).toBe('subtle');
        await settle();
        expect(fake.posts).toEqual([[LOOK, 'subtle'], [SEEN, '3.0.0']]);

        fromAbout().focus();
        escape();
        expect(card()).toBeNull();
        await settle();
        expect(fake.posts).toHaveLength(2);
        expect(escapes).not.toHaveBeenCalled();
        window.removeEventListener('keydown', escapes);
    });
});
