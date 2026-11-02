/**
 * The panel's controls: a row per setting, of the kind its schema entry asks
 * for. A switch; a slider with its number; a few choices as buttons, more as a
 * list; a colour with its hex code; and for the link animation and the node
 * effect, a gallery of live tiles that preview on the canvas while hovered.
 * Each row marks a value that is not the default and offers to reset it, hides
 * while the setting cannot apply, and says what it needs from another section,
 * or classic nodes, with a button that sets it. Sliders and colour wells
 * preview while they move and commit where they stop; everything else commits
 * at once.
 *
 * @module sidebar/controls
 */

import { app } from '/scripts/app.js';
import { HEX, commit, preview, restore, setting, shown, type Setting } from '@/core/settings';
import { linkScene, nodeScene, tile, type Scene } from './tiles';

export type Visible = Exclude<Setting, { type: 'hidden' }>;
type Of<T extends Visible['type']> = Extract<Visible, { type: T }>;

/** An element with `attrs` as its attributes, true ones empty and false or undefined ones left out, holding `children`. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | number | boolean | undefined> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [name, value] of Object.entries(attrs)) {
        if (value !== undefined && value !== false) el.setAttribute(name, value === true ? '' : String(value));
    }
    el.append(...children);
    return el;
}

/** A button with a PrimeIcons icon, named by `label`. */
export function iconButton(icon: string, label: string, onClick: () => void, attrs: Record<string, string | boolean> = {}): HTMLButtonElement {
    const button = h('button', { type: 'button', class: 'eln-tool', 'aria-label': label, title: label, ...attrs }, h('i', { class: `pi ${icon}`, 'aria-hidden': 'true' }));
    button.addEventListener('click', onClick);
    return button;
}

/** A text button, in the panel's style unless `attrs` give it a class of its own. */
export function button(label: string, onClick: () => void, attrs: Record<string, string> = {}): HTMLButtonElement {
    const el = h('button', { type: 'button', class: 'eln-button', ...attrs }, label);
    el.addEventListener('click', onClick);
    return el;
}

const STEP: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/**
 * Moves the focus through `items` with the arrow keys, Home and End, so the group takes one Tab stop, and hands `move`
 * the item it lands on.
 */
export function roving(group: HTMLElement, items: HTMLElement[], move?: (item: HTMLElement) => void): void {
    group.addEventListener('keydown', (event) => {
        const at = items.indexOf(event.target as HTMLElement);
        if (at < 0) return;
        const to = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key in STEP ? (at + STEP[event.key] + items.length) % items.length : -1;
        if (to < 0) return;
        event.preventDefault();
        for (const item of items) item.tabIndex = item === items[to] ? 0 : -1;
        items[to].focus();
        move?.(items[to]);
    });
}

/** Ticks item `at` of a radio group, which takes the group's Tab stop; the first takes it while none is ticked. */
export function check(items: HTMLElement[], at: number): void {
    items.forEach((item, i) => {
        item.setAttribute('aria-checked', String(i === at));
        item.tabIndex = i === at || (at < 0 && i === 0) ? 0 : -1;
    });
}

/** Ends the hover preview on the canvas, if one shows. */
let unhover: (() => void) | undefined;

/** Whether a hover preview shows: the panel keeps still under the pointer meanwhile. */
export const hovering = (): boolean => unhover !== undefined;

/**
 * While a mouse is over `el`, what `start` shows on the canvas; it returns what ends that. A click ends it too, before
 * the handlers added after this one pick what it showed, so the panel follows the pick.
 */
export function hover(el: HTMLElement, start: () => () => void): void {
    el.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        endHover();
        // Marked before the preview shows, so the panel already keeps still for the changes it makes.
        unhover = () => {};
        unhover = start();
    });
    el.addEventListener('pointerleave', endHover);
    el.addEventListener('click', endHover);
}

/** Ends the hover preview, if one shows, so what the store holds shows again. */
export function endHover(): void {
    const end = unhover;
    unhover = undefined;
    end?.();
}

/** A control: its element, whether it takes the row's whole width, and what shows a value in it. */
interface Control {
    el: HTMLElement;
    wide?: boolean;
    update(value: unknown): void;
}

const GALLERIES: Partial<Record<string, (value: number) => Scene>> = {
    '🔗 Enhanced Links.Animate': linkScene,
    '📦 Enhanced Nodes.Animate': nodeScene,
};

function toggle(s: Of<'boolean'>, id: string): Control {
    const el = h('button', { type: 'button', role: 'switch', id, class: 'eln-switch' });
    el.addEventListener('click', () => commit(s.id, !shown(s.id)));
    return { el, update: (value) => el.setAttribute('aria-checked', String(value)) };
}

function slider(s: Of<'slider'>, id: string): Control {
    const range = h('input', { type: 'range', id, min: s.min, max: s.max, step: s.step, class: 'eln-range' });
    const number = h('input', { type: 'number', min: s.min, max: s.max, step: s.step, class: 'eln-number', 'aria-label': `${s.name}, value` });
    range.addEventListener('input', () => {
        number.value = range.value;
        preview(s.id, Number(range.value));
    });
    range.addEventListener('change', () => commit(s.id, Number(range.value)));
    number.addEventListener('change', () => {
        if (number.value === '') number.value = String(shown(s.id));
        else commit(s.id, Number(number.value));
    });
    return {
        el: h('div', { class: 'eln-slider' }, range, number),
        wide: true,
        update(value) {
            range.value = number.value = String(value);
        },
    };
}

/** Choices whose names fit on one line as buttons. */
const fits = (s: Of<'combo'>) => s.options.length <= 3 && s.options.reduce((n, o) => n + o.text.length, 0) <= 28;

function choice(s: Of<'combo'>, id: string, label: string): Control {
    const index = (value: unknown) => s.options.findIndex((o) => o.value === value);
    const scene = GALLERIES[s.id];
    if (scene || fits(s)) {
        const items = s.options.map((o) => {
            const item = scene
                ? h('button', { type: 'button', role: 'radio', class: 'eln-tile' }, tile(scene(Number(o.value))), h('span', { class: 'eln-tile-name' }, o.text))
                : h('button', { type: 'button', role: 'radio', class: 'eln-segment' }, o.text);
            if (scene) hover(item, () => {
                preview(s.id, o.value);
                return () => restore([s.id]);
            });
            item.addEventListener('click', () => commit(s.id, o.value));
            return item;
        });
        const el = h('div', { role: 'radiogroup', id, class: scene ? 'eln-gallery' : 'eln-segments', 'aria-labelledby': label }, ...items);
        // Arrows pick a segment, as they do native radio buttons; in a gallery they move the focus, and Enter or Space picks.
        roving(el, items, scene ? undefined : (item) => item.click());
        return { el, wide: true, update: (value) => check(items, index(value)) };
    }
    const select = h('select', { id, class: 'eln-select' }, ...s.options.map((o, i) => h('option', { value: i }, o.text)));
    select.addEventListener('change', () => commit(s.id, s.options[select.selectedIndex].value));
    return {
        el: select,
        // Choices too long to share a line with the name at the panel's default width take one of their own.
        wide: s.options.some((o) => o.text.length > 20),
        update(value) {
            select.selectedIndex = index(value);
        },
    };
}

function colour(s: Of<'color'>, id: string): Control {
    const well = h('input', { type: 'color', id, class: 'eln-well' });
    const hex = h('input', { type: 'text', class: 'eln-hex', maxlength: 9, spellcheck: 'false', 'aria-label': `${s.name}, hex code` });
    well.addEventListener('input', () => {
        hex.value = well.value;
        preview(s.id, well.value);
    });
    well.addEventListener('change', () => commit(s.id, well.value));
    hex.addEventListener('change', () => {
        if (HEX.test(hex.value)) commit(s.id, hex.value);
        else hex.value = String(shown(s.id));
    });
    return {
        el: h('div', { class: 'eln-colour' }, well, hex),
        update(value) {
            hex.value = String(value);
            // The well takes #rrggbb only.
            well.value = String(value).slice(0, 7);
        },
    };
}

/** How a value reads: an option's text, On or Off, or itself. */
function text(s: Visible, value: unknown): string {
    if (s.type === 'combo') return s.options.find((o) => o.value === value)?.text ?? String(value);
    if (s.type === 'boolean') return value ? 'On' : 'Off';
    return String(value);
}

let ids = 0;

/** A setting's row, and what shows its value and state. */
export interface Row {
    setting: Visible;
    el: HTMLElement;
    update(): void;
}

/**
 * The row of a setting. One among search results shows whether the setting is Advanced, and shows while it cannot
 * apply too, so a search finds every setting.
 */
export function row(s: Visible, found = false): Row {
    const id = `eln-${++ids}`;
    const label = `${id}-label`;
    const control = s.type === 'boolean' ? toggle(s, id) : s.type === 'slider' ? slider(s, id) : s.type === 'combo' ? choice(s, id, label) : colour(s, id);
    const modified = h('span', { class: 'eln-sr' }, ' (modified)');
    const name = h(control.el.getAttribute('role') === 'radiogroup' ? 'span' : 'label', { id: label, class: 'eln-name', for: id, title: s.tooltip }, s.name, modified);
    const reset = h('button', { type: 'button', class: 'eln-reset', 'aria-label': `Reset ${s.name} to ${text(s, s.default)}`, title: `Reset to ${text(s, s.default)}` },
        h('i', { class: 'pi pi-undo', 'aria-hidden': 'true' }));
    reset.addEventListener('click', () => {
        commit(s.id, s.default);
        // The reset hides once the value is the default, so the focus goes to the control rather than the page.
        (control.el.querySelector<HTMLElement>('input, [tabindex="0"]') ?? control.el).focus();
    });
    const reason = h('span');
    const fix = h('button', { type: 'button', class: 'eln-link' });
    const need = h('p', { class: 'eln-need' }, reason, ' ', fix);
    const head = h('div', { class: 'eln-row-head' }, h('span', { class: 'eln-dot', 'aria-hidden': 'true' }), name);
    if (found && 'advanced' in s) head.append(h('span', { class: 'eln-tag' }, 'Advanced'));
    head.append(reset);
    if (!control.wide) head.append(control.el);
    const el = h('div', { class: 'eln-row', 'data-setting': s.id }, head);
    if (control.wide) el.append(control.el);
    el.append(need);
    return {
        setting: s,
        el,
        update() {
            const value = shown(s.id);
            control.update(value);
            const changed = value !== s.default;
            el.classList.toggle('eln-row--modified', changed);
            modified.hidden = reset.hidden = !changed;
            el.hidden = !found && !(s.showIf?.() ?? true);
            const needs = s.needs?.();
            need.hidden = !needs;
            control.el.toggleAttribute('inert', Boolean(needs));
            control.el.classList.toggle('eln-off', Boolean(needs));
            if (needs) {
                // Ours, or one of ComfyUI's, which goes through its own settings store.
                const ours = setting(needs.id) as Setting | undefined;
                reason.textContent = needs.reason;
                fix.textContent = needs.label ?? `Use ${text(ours as Visible, needs.value)}`;
                fix.onclick = () => (ours ? commit(needs.id, needs.value) : void app.extensionManager.setting.set(needs.id, needs.value));
            }
        },
    };
}
