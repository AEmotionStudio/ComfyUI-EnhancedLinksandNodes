/**
 * The first-run look picker: on a page that loads with Look '', a card over the
 * bottom-left of the canvas asks for a look once the page is idle. Its live
 * tiles show a look on the canvas while hovered and apply it when picked, with
 * undo. Keep Subtle applies Subtle, which already shows unless the user's own
 * settings do; an upgrader who customised can keep those instead, which saves
 * Look alone. Escape and the close button keep what shows, as the Keep button
 * does, and a change made in the panel meanwhile with it. Until one of these,
 * nothing is saved but such changes. Once the look is answered, here
 * or in the panel, an upgrader who customised hears what is new in 3.0, once; a
 * fresh install just notes that it was told. About shows the picker again, to
 * choose another look.
 *
 * @module sidebar/picker
 */

import { app } from '/scripts/app.js';
import { L, LOOK, commit, customised, watch } from '@/core/settings';
import { env } from '@/core/engine';
import { LOOKS, applyLook, changed, currentLook, keepShown, previewLook, type Look } from '@/ui/looks';
import { button, check, endHover, h, hover, iconButton, roving } from './controls';
import { lookTile, stopTiles } from './tiles';
import { UNDO_MS, offerUndo, showTab } from './sidebar';

const SEEN = '🔗 Enhanced Links.WhatsNew.Seen';
/** The version whose news the What's new toast tells. */
const NEWS = '3.0.0';
/** How long the page keeps still before the picker shows, and how often it looks again while it is busy. */
const IDLE_MS = 1500;
const NEWS_MS = 10_000;

const byId = (id: string) => LOOKS.find((look) => look.id === id)!;
const SUBTLE = byId('subtle');

/** The card while it shows, and whether it asks for the first look rather than another. */
let card: HTMLElement | undefined;
let asking = false;
/** Where the focus was before the card took it. */
let before: Element | null = null;

/** The canvas's part of the page, beside the sidebar and above the bottom panel, in 1.39.5 and 1.57.1. */
const host = (): Element => document.querySelector('.graph-canvas-panel')!;

/** The panel's install calls this once: on a page that loads with the look unanswered, the picker shows once it is idle. */
export function installPicker(): void {
    if (L.look !== '') return;
    const wait = () => {
        if (L.look !== '' || card) return;
        // A run, a dialog or ComfyUI's own first-run screens come first; some pages keep hidden dialogs around.
        if (env.running || [...document.querySelectorAll('[role=dialog]')].some((el) => el.checkVisibility())) setTimeout(wait, IDLE_MS);
        else showPicker();
    };
    setTimeout(wait, IDLE_MS);
    let unanswered = true;
    watch((id) => {
        if (id !== LOOK || unanswered === (L.look === '')) return;
        unanswered = !unanswered;
        if (unanswered) return;
        // Answered, on the card or in the panel. What's new waits for the answer's write to queue, so Look saves first.
        if (asking) close();
        queueMicrotask(whatsNew);
    });
}

/** Shows the picker: the first-run card while the look is unanswered, else to choose another. */
export function showPicker(): void {
    if (card) return;
    asking = L.look === '';
    const looks = ['off', 'subtle', 'showcase', 'performance'].map(byId);
    const items = looks.map((look) => {
        const item = h('button', { type: 'button', role: 'radio', class: 'eln-tile', 'data-look': look.id, title: look.description },
            lookTile(look), h('span', { class: 'eln-tile-name' }, look.name), h('span', { class: 'eln-tile-text' }, look.description));
        hover(item, () => previewLook(look));
        item.addEventListener('click', () => pick(look));
        return item;
    });
    const grid = h('div', { role: 'radiogroup', class: 'eln-looks', 'aria-label': 'Looks' }, ...items);
    roving(grid, items);
    // The look that shows is ticked: none while an upgrader's own settings show.
    const shown = currentLook();
    check(items, shown && !changed(shown) ? looks.indexOf(shown) : -1);

    const classic = h('button', { type: 'button', class: 'eln-link' }, 'Classic v1');
    hover(classic, () => previewLook(byId('classic-v1')));
    classic.addEventListener('click', () => pick(byId('classic-v1')));
    const more = h('button', { type: 'button', class: 'eln-link' }, 'More looks…');
    more.addEventListener('click', () => {
        close();
        showTab('looks');
    });
    const primary = { class: 'eln-button eln-button--primary' };
    const keeps = !asking ? [button('Done', close, primary)]
        : customised() ? [button('Keep Subtle', () => pick(SUBTLE)), button('Keep my settings', keepMine, primary)]
        : [button('Keep Subtle', () => pick(SUBTLE), primary)];

    // Close comes last, so Tab reaches the looks first; it shows at the top.
    card = h('section', { class: 'eln eln-picker', tabindex: -1, 'aria-labelledby': 'eln-picker-title' },
        h('header', { class: 'eln-picker-head' }, h('span', { class: 'eln-icon eln-mark', 'aria-hidden': 'true' }), h('h2', { id: 'eln-picker-title', class: 'eln-title' }, 'Choose your look')),
        grid,
        h('p', { class: 'eln-picker-more' }, 'The original look? ', classic, ' · ', more),
        h('footer', { class: 'eln-picker-foot' }, h('span', { class: 'eln-hint' }, 'Change it any time in the FX panel.'), ...keeps),
        iconButton('pi-times', 'Close', dismiss, { class: 'eln-tool eln-picker-close' }));
    card.classList.toggle('eln--still', L.motion === 'reduce');
    card.classList.toggle('eln--full', L.motion === 'full');
    card.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        // Escape goes no further: ComfyUI's own leaves the subgraph open.
        event.preventDefault();
        event.stopPropagation();
        dismiss();
    });
    before = document.activeElement;
    host().append(card);
    // The focus moves in once, unless it is in a field or widget of the user's.
    if (before === document.body || before === app.canvas.canvas) card.focus();
}

function close(): void {
    if (!card) return;
    endHover();
    stopTiles(card);
    if (card.contains(document.activeElement) && before instanceof HTMLElement) before.focus();
    card.remove();
    card = undefined;
}

/** Applies a look and closes; a look that changes what shows offers its undo, which shows the picker again. */
function pick(look: Look): void {
    const visible = changed(look);
    const undo = applyLook(look);
    close();
    if (!visible) return;
    const again = () => {
        undo();
        showPicker();
    };
    if (!offerUndo(`${look.name} applied`, again)) undoBar(`${look.name} applied`, again);
}

/** Keeps the user's own settings: Look is all it saves, and the answer closes the card. */
function keepMine(): void {
    commit(LOOK, 'custom');
}

/** Escape and the close button: on the first run they keep what shows, a change made meanwhile too; else they just close. */
function dismiss(): void {
    if (!asking) close();
    else if (customised()) keepMine();
    else if (changed(SUBTLE)) keepShown();
    else pick(SUBTLE);
}

/** A pick's undo where the toasts take no action (1.39.5) and the panel is closed: a bar where the card was. */
function undoBar(title: string, undo: () => void): void {
    const bar = h('div', { class: 'eln eln-picker-undo', role: 'status' }, h('span', {}, title), button('Undo', () => {
        clearTimeout(timer);
        bar.remove();
        undo();
    }));
    const timer = setTimeout(() => bar.remove(), UNDO_MS);
    host().append(bar);
}

/** What is new in 3.0, told once to an upgrader who customised; a fresh install just notes it was told. */
function whatsNew(): void {
    if (L.whatsNewSeen === NEWS) return;
    commit(SEEN, NEWS);
    if (!customised()) return;
    const title = 'Enhanced Links & Nodes 3.0';
    const text = "Links stay clickable, v1's look is back, and a new FX panel brings looks with live previews.";
    const { toast } = app.extensionManager;
    if ('info' in toast) {
        const id = toast.info(title, {
            description: text,
            duration: NEWS_MS,
            action: {
                label: "What's new",
                onClick() {
                    toast.dismiss(id);
                    showTab('about');
                },
            },
        });
        return;
    }
    // 1.39.5's toasts take no action.
    app.extensionManager.toast.add({ severity: 'info', summary: title, detail: `${text} About, in the FX panel, tells more.`, life: NEWS_MS });
}
