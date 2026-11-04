/**
 * The panel, ComfyUI's sidebar tab for Enhanced Links & Nodes: a quick bar with
 * the master switches, Static, Focus and the look; tabs for the looks and for
 * each part of the settings, which the schema lays out; a search over all of
 * them; notices for what keeps effects from showing, and in Perf how far
 * Perf.Adaptive stepped down. It shows what the canvas shows and keeps in step
 * with the settings dialog through watch(). A change of many settings at once,
 * a look or a section's reset, offers its undo: a toast with an Undo button
 * where the frontend has one (1.57+), else a bar at the foot of the panel, or
 * where the picker shows while the panel is closed; looks applied one after
 * another share one offer, which goes back to before the first. The rail icon's
 * badge says when effects are off or frozen.
 * About tells what the extension is and what is new, the keys bound now, copies
 * diagnostics, shows the first-run look picker again and resets everything. The
 * commands share the quick bar's switches, Surprise me and Reset everything.
 * The panel draws nothing while it is closed.
 *
 * @module sidebar/sidebar
 */

import type { ComfyExtension, ToastId } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L, N, SETTINGS, commit, commitAll, reset, shown, watch, type Setting } from '@/core/settings';
import { adaptive, env, guard, nodes2 } from '@/core/engine';
import { deferring } from '@/links/pipeline';
import { available } from '@/nodes/shader';
import { LOOKS, applyLook, changed, currentLook, deleteLook, exportLook, importLook, light, previewLook, renameLook, saveLook, surprise, userLooks, type Look } from '@/ui/looks';
import { button, check, endHover, h, hover, hovering, iconButton, roving, row, type Row, type Visible } from './controls';
import { installPicker, showPicker, undoBar } from './picker';
import { lookTile, repaint, stopTiles } from './tiles';
import css from './sidebar.css?inline';

/** The tab's id, as v2 registered it, so its toggle command and the keys bound to that carry on. */
const TAB = 'enhanced-links-nodes';
/** The command ComfyUI makes for the tab, which opens and closes the panel (FE157 stores/workspace/sidebarTabStore.ts L59-72). */
export const TOGGLE = `Workspace.ToggleSidebarTab.${TAB}`;
/** The extension's command that turns every effect off, or back on. */
export const TOGGLE_ALL = 'EnhancedLinksNodes.ToggleAll';
export const TITLE = 'Enhanced Links & Nodes';
/** The master switches and Static's two, which the quick bar and the commands turn over. */
export const LINKS_ON = '🔗 Enhanced Links.Enabled';
export const NODES_ON = '📦 Enhanced Nodes.Enabled';
export const FROZEN = ['🔗 Enhanced Links.Static.Mode', '📦 Enhanced Nodes.Static.Mode'];
export const FOCUS_ON = '🔗 Enhanced Links.Focus.Enabled';
const PANEL_STATE = '🔗 Enhanced Links.Panel.State';
const COEXIST = '🔗 Enhanced Links.Coexist';
/** How long an undo is offered. */
export const UNDO_MS = 8000;
/** The panel saves its state this long after it last changed, and as it closes. */
const REMEMBER_MS = 1000;

const VISIBLE = (SETTINGS as readonly Setting[]).filter((s): s is Visible => s.type !== 'hidden');

/** The tabs, with the schema groups each lays out: those whose names start with `part`. */
const TABS: { id: string; name: string; part?: string }[] = [
    { id: 'looks', name: 'Looks' },
    { id: 'links', name: 'Links', part: 'Links' },
    { id: 'nodes', name: 'Nodes', part: 'Nodes' },
    // Saved as runs before selection focus joined it.
    { id: 'runs', name: 'Focus & Flow', part: 'Focus & Flow' },
    { id: 'perf', name: 'Perf', part: 'Performance' },
    { id: 'about', name: 'About' },
];

/** Which extensions' setup() ran: a disabled extension's does not. */
export const running = { links: false, nodes: false };

/** What a disabled extension leaves off, which its notice says, and the commands that need it. */
export const DISABLED = {
    links: 'Link effects are off: the enhanced.link.animations extension is disabled in Settings › Extensions.',
    nodes: 'Node effects are off: the enhanced.node.animations extension is disabled in Settings › Extensions.',
};

/** The rail icon's badge: OFF with both master switches off, ‖ while links or nodes are frozen. */
const badge = () => (!L.enabled && !N.enabled ? 'OFF' : L.staticMode || N.staticMode ? '‖' : '');
const BADGED = new Set([LINKS_ON, NODES_ON, ...FROZEN]);

/** Puts the panel's stylesheet on the page, which draws the brand icon of the commands and the action bar's button too. */
export function installStyle(): void {
    document.head.append(h('style', { id: 'eln-panel' }, css));
}

let installed = false;

/** Each extension's setup() calls this; the first puts the panel's tab on ComfyUI's sidebar. */
export function installPanel(part: keyof typeof running): void {
    running[part] = true;
    if (installed) return;
    installed = true;
    app.extensionManager.registerSidebarTab({ id: TAB, title: TITLE, tooltip: TITLE, label: 'FX', icon: 'eln-icon', iconBadge: badge(), type: 'custom', render, destroy });
    // The rail draws the tab as the sidebar store holds it, which hands out the tab as an object it tracks. The call is
    // deprecated; a frontend without it keeps the badge the tab registered with.
    watch((id) => {
        const tab = BADGED.has(id) ? app.extensionManager.getSidebarTabs?.().find((t) => t.id === TAB) : undefined;
        if (tab) tab.iconBadge = badge();
    });
    installPicker();
}

// =============================================================================
// The open panel
// =============================================================================

/** What the panel shows: its tab, whether Advanced is open, and the search. Saved as Panel.State. */
let state = { ...L.panelState };
/** The open panel; undefined while it is closed. */
let root: HTMLElement | undefined;
let body: HTMLElement;
let tabs: HTMLElement[] = [];
let search: HTMLInputElement;
let advanced: HTMLElement;
let panelUndo: HTMLElement;
let undoText: HTMLElement;
let undoButton: HTMLElement;
let undoTimer = 0;
/** The undo on offer for the looks applied one after another: what goes back to before the first, its toast, and when the offer ends. */
let applied: { undo: () => void; toast?: ToastId; until: number } = { undo: () => {}, until: 0 };
let remembering = 0;
let unwatch: (() => void) | undefined;
/** What shows the quick bar's state, and the rows and other parts of the body, which fill() builds. */
let quick = () => {};
let rows: Row[] = [];
let parts: (() => void)[] = [];
/** The user's looks once read, or why they could not be. */
let mine: readonly Look[] = [];
let unread = '';
/** Shows the user's looks as they are now, where the panel lists them. */
let relist = () => {};
/** The sections opened or closed this page load, by group, and those that show their advanced settings. */
const opened = new Map<string, boolean>();
const revealed = new Set<string>();
let ids = 0;

function render(container: HTMLElement): void {
    // The slot hands the same element over again whenever it renders again.
    if (root?.parentElement === container) return;
    // The sidebar switched to another tab without destroy(), and that tab, if an extension's, may have drawn in here.
    if (root) destroy();
    container.replaceChildren();
    container.style.height = '100%';
    state = { ...L.panelState };
    if (!TABS.some((t) => t.id === state.tab)) state.tab = 'looks';

    advanced = iconButton('pi-sliders-h', 'Advanced settings', () => {
        state = { ...state, advanced: !state.advanced };
        remember();
        refresh();
    }, { 'aria-pressed': 'false' });
    const close = iconButton('pi-times', 'Close', () => void app.extensionManager.command.execute(TOGGLE));
    const header = h('header', { class: 'eln-head' }, h('span', { class: 'eln-icon eln-mark', 'aria-hidden': 'true' }), h('h2', { class: 'eln-title' }, TITLE), advanced, close);

    tabs = TABS.map((t) => {
        const tab = h('button', { type: 'button', role: 'tab', id: `eln-tab-${t.id}`, class: 'eln-tab', 'aria-controls': 'eln-body' }, t.name);
        tab.addEventListener('click', () => go(t.id));
        return tab;
    });
    const tablist = h('div', { role: 'tablist', class: 'eln-tabs', 'aria-label': TITLE }, ...tabs);
    roving(tablist, tabs, (tab) => tab.click());

    search = h('input', { type: 'search', class: 'eln-search', placeholder: 'Search settings and looks', 'aria-label': 'Search settings and looks', autocomplete: 'off' });
    search.value = state.search;
    search.addEventListener('input', () => {
        state = { ...state, search: search.value };
        remember();
        fill();
    });
    search.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !search.value) return;
        // Escape clears the search, and goes no further: ComfyUI's own leaves the subgraph open.
        event.preventDefault();
        event.stopPropagation();
        search.value = '';
        search.dispatchEvent(new Event('input'));
    });

    body = h('div', { id: 'eln-body', role: 'tabpanel', class: 'eln-body scrollbar-custom' });
    undoText = h('span');
    undoButton = h('button', { type: 'button', class: 'eln-button' }, 'Undo');
    panelUndo = h('div', { class: 'eln-undo', role: 'status', hidden: true }, undoText, undoButton);

    const colours = LGraphCanvas.link_type_colors;
    root = h('div', { class: 'eln' }, header, quickBar(), tablist, h('div', { class: 'eln-find' }, h('i', { class: 'pi pi-search', 'aria-hidden': 'true' }), search), body, panelUndo);
    // The living underline takes the palette's colours of the main link types.
    ['IMAGE', 'LATENT', 'MODEL'].forEach((type, i) => colours[type] && root!.style.setProperty(`--eln-link-${i + 1}`, colours[type]));
    container.append(root);
    unwatch = watch(heard);
    guard.onTrip = nodes2.onFlip = adaptive.onStep = refresh;
    go(state.tab, false);
    void userData(async () => {});
}

function destroy(): void {
    endHover();
    if (root) stopTiles(root);
    unwatch?.();
    guard.onTrip = nodes2.onFlip = adaptive.onStep = undefined;
    clearTimeout(undoTimer);
    applied.until = 0;
    keep();
    root = undefined;
    rows = [];
    parts = [];
}

/** Whether the panel shows: the sidebar may have switched to another tab without destroy(). */
export const panelShown = (): boolean => root?.isConnected === true;

/** Opens the panel, unless it shows. */
export function showPanel(): void {
    if (!panelShown()) void app.extensionManager.command.execute(TOGGLE);
}

/** Opens the panel on `tab`, or turns the open panel to it: for the picker's More looks and What's new. */
export function showTab(tab: string): void {
    if (panelShown()) return go(tab);
    // A panel left behind by a switch to another tab would save its own tab over this one as it went.
    if (root) destroy();
    commit(PANEL_STATE, { ...L.panelState, tab, search: '' });
    void app.extensionManager.command.execute(TOGGLE);
}

/** Shows a tab: the one clicked, which clears the search, or the one the panel opens on. */
function go(id: string, clicked = true): void {
    if (clicked) {
        state = { ...state, tab: id, search: '' };
        search.value = '';
        remember();
    }
    tabs.forEach((tab, i) => {
        const selected = TABS[i].id === id;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
    });
    body.setAttribute('aria-labelledby', `eln-tab-${id}`);
    fill();
}

/** Builds the body: the search's results, else the tab's content. */
function fill(): void {
    endHover();
    stopTiles(body);
    rows = [];
    parts = [];
    relist = () => quick();
    const tab = TABS.find((t) => t.id === state.tab)!;
    const query = state.search.trim();
    body.replaceChildren(...(query ? results(query) : tab.id === 'looks' ? looksTab() : tab.part ? settingsTab(tab.id, tab.part) : aboutTab()));
    body.scrollTop = 0;
    refresh();
}

/** Every change shown, from anywhere. A hover preview leaves the panel as it is, which would otherwise move under the pointer. */
function heard(): void {
    if (!hovering()) refresh();
}

/** Shows what is shown now in every part of the open panel. */
function refresh(): void {
    if (!root) return;
    advanced.setAttribute('aria-pressed', String(state.advanced));
    for (const r of rows) r.update();
    quick();
    for (const part of parts) part();
    root.classList.toggle('eln--still', L.motion === 'reduce');
    root.classList.toggle('eln--full', L.motion === 'full');
    repaint();
}

/** Saves the panel's state once it keeps still for REMEMBER_MS. */
function remember(): void {
    clearTimeout(remembering);
    remembering = window.setTimeout(keep, REMEMBER_MS);
}

function keep(): void {
    clearTimeout(remembering);
    if (JSON.stringify(state) !== JSON.stringify(L.panelState)) commit(PANEL_STATE, state);
}

/**
 * Offers to undo a change of many settings for UNDO_MS. A look applied while the undo of looks applied before is on
 * offer takes that offer over, so its Undo goes back to before the first.
 */
export function offerUndo(title: string, undo: () => void, look = false): void {
    const { toast } = app.extensionManager;
    const earlier = look && Date.now() < applied.until ? applied : undefined;
    const all = () => {
        undo();
        earlier?.undo();
    };
    const run = () => {
        applied.until = 0;
        all();
    };
    if ('success' in toast) {
        const id = toast.success(title, {
            id: earlier?.toast,
            duration: UNDO_MS,
            action: {
                label: 'Undo',
                onClick() {
                    toast.dismiss(id);
                    run();
                },
            },
        });
        if (look) applied = { undo: all, toast: id, until: Date.now() + UNDO_MS };
        return;
    }
    // 1.39.5's toasts take no action, so the panel's bar offers it while the panel shows, else a bar where the picker shows.
    if (panelShown()) {
        undoText.textContent = title;
        undoButton.onclick = () => {
            panelUndo.hidden = true;
            run();
        };
        panelUndo.hidden = false;
        clearTimeout(undoTimer);
        undoTimer = window.setTimeout(() => (panelUndo.hidden = true), UNDO_MS);
    } else {
        undoBar(title, run);
    }
    if (look) applied = { undo: all, until: Date.now() + UNDO_MS };
}

function apply(look: Look): void {
    offerUndo(`${look.name} applied`, applyLook(look), true);
}

/** Surprise me: applies a surprise look, with its undo. */
export const surpriseMe = (): void => apply(surprise());

/** Puts every setting back to its default and the look to Subtle, with one undo. */
export function resetEverything(): void {
    const undoValues = reset('');
    const undoLook = applyLook(LOOKS.find((look) => look.id === 'subtle')!);
    offerUndo('Every setting reset', () => {
        undoLook();
        undoValues();
    });
}

// =============================================================================
// Keys
// =============================================================================

type Combo = NonNullable<ComfyExtension['keybindings']>[number]['combo'];

/** How a key reads: Alt+K, say. */
export const keyText = (combo: Combo): string =>
    [combo.ctrl && 'Ctrl', combo.alt && 'Alt', combo.shift && 'Shift', combo.key.length === 1 ? combo.key.toUpperCase() : combo.key].filter(Boolean).join('+');

/**
 * The key each command has now, as it reads, by command: the first of its keys, as the user may have changed them in
 * Settings › Keybinding (FE157 stores/commandStore.ts L80-82, FE1395 L69-71).
 */
export const commandKeys = (): Map<string, string> =>
    new Map((app.extensionManager.command.commands as { id: string; keybinding?: { combo: Combo } | null }[]).flatMap((c) => (c.keybinding ? [[c.id, keyText(c.keybinding.combo)]] : [])));

/** The keys bound for macOS, whose Option types these for L, K and J, with Shift too: other keyboards cannot type them. */
const MAC_ONLY = new Set(['Alt+¬', 'Alt+˚', 'Alt+∆', 'Alt+Shift+Ò', 'Alt+Shift+\uf8ff', 'Alt+Shift+Ô']);

/** The key a command has now, as the texts name it: its first, unless only macOS types that one. */
export function keyName(id: string): string | undefined {
    const key = commandKeys().get(id);
    return key && !MAC_ONLY.has(key) ? key : undefined;
}

// =============================================================================
// Quick bar
// =============================================================================

/** The quick bar's switches, which the commands share. */
export const toggleLinks = (): void => commit(LINKS_ON, !L.enabled);
export const toggleNodes = (): void => commit(NODES_ON, !N.enabled);
export const toggleFocus = (): void => commit(FOCUS_ON, !L.focusEnabled);

/** Static: freezes links and nodes, or with both frozen frees both. */
export function toggleStatic(): void {
    const on = !(L.staticMode && N.staticMode);
    for (const id of FROZEN) commit(id, on);
}

function quickBar(): HTMLElement {
    const chip = (label: string, click: () => void) => {
        const button = h('button', { type: 'button', class: 'eln-chip' }, label);
        button.addEventListener('click', click);
        return button;
    };
    const links = chip('Link FX', toggleLinks);
    const nodes = chip('Node FX', toggleNodes);
    const frozen = chip('Static', toggleStatic);
    const focus = chip('Focus', toggleFocus);

    // A menu button rather than a list box, whose arrow keys would apply every look they pass.
    const name = h('span', { class: 'eln-look-name' });
    const dot = h('span', { class: 'eln-dot', title: 'Changed since the look was applied' }, h('span', { class: 'eln-sr' }, 'Changed since the look was applied'));
    const choose = h('button', { type: 'button', id: 'eln-look', class: 'eln-select', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-labelledby': 'eln-look-label eln-look' },
        name, dot, h('i', { class: 'pi pi-chevron-down', 'aria-hidden': 'true' }));
    /** The looks to pick from while their menu is open; it closes as the pointer goes down outside it. */
    let menu: HTMLElement | undefined;
    const away = (event: Event) => {
        if (!menu?.contains(event.target as Node) && !choose.contains(event.target as Node)) shut();
    };
    const shut = (refocus = false) => {
        menu?.remove();
        menu = undefined;
        choose.setAttribute('aria-expanded', 'false');
        document.removeEventListener('pointerdown', away, true);
        if (refocus) choose.focus();
    };
    choose.addEventListener('click', () => {
        if (menu) return shut();
        const current = currentLook();
        const items = [...LOOKS, ...mine].map((look) => {
            const item = h('button', { type: 'button', role: 'menuitemradio', class: 'eln-menu-item', 'aria-checked': look.id === current?.id ? 'true' : 'false', tabindex: -1 },
                look.name, h('i', { class: 'pi pi-check', 'aria-hidden': 'true' }));
            item.addEventListener('click', () => {
                shut(true);
                apply(look);
            });
            return item;
        });
        menu = h('div', { role: 'menu', class: 'eln-menu', 'aria-labelledby': 'eln-look-label' }, ...items.slice(0, LOOKS.length));
        if (mine.length) menu.append(h('div', { role: 'group', 'aria-label': 'My looks' }, ...items.slice(LOOKS.length)));
        // The arrows move through the looks; Enter, Space or a click applies one.
        roving(menu, items);
        menu.addEventListener('keydown', (event) => {
            // Tab closes the menu and goes on from the button.
            if (event.key === 'Tab') shut(true);
            if (event.key !== 'Escape') return;
            // Escape closes the menu, and goes no further: ComfyUI's own leaves the subgraph open.
            event.preventDefault();
            event.stopPropagation();
            shut(true);
        });
        choose.after(menu);
        choose.setAttribute('aria-expanded', 'true');
        document.addEventListener('pointerdown', away, true);
        (items.find((item) => item.getAttribute('aria-checked') === 'true') ?? items[0]).focus();
    });
    quick = () => {
        links.setAttribute('aria-pressed', String(L.enabled));
        nodes.setAttribute('aria-pressed', String(N.enabled));
        frozen.setAttribute('aria-pressed', L.staticMode === N.staticMode ? String(L.staticMode) : 'mixed');
        focus.setAttribute('aria-pressed', String(L.focusEnabled));
        // Look names none for the user's settings, or a look of theirs not read yet.
        const look = currentLook();
        name.textContent = look?.name ?? 'Custom';
        dot.hidden = !look || !changed(look);
    };
    return h('div', { class: 'eln-quick', role: 'group', 'aria-label': 'Quick bar' }, links, nodes, frozen, focus,
        h('div', { class: 'eln-look' }, h('span', { id: 'eln-look-label', class: 'eln-look-label' }, 'Look'), choose));
}

// =============================================================================
// Settings tabs
// =============================================================================

function settingsTab(tab: string, part: string): HTMLElement[] {
    const groups = new Map<string, Visible[]>();
    for (const s of VISIBLE) if (s.group.startsWith(`${part} · `)) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);
    // A tab of a few sections opens them all, a longer one its first, until the user opens or closes them.
    return [notices(tab), ...(tab === 'perf' ? [quality()] : []), ...[...groups].map(([group, settings], i) => section(group, settings, i === 0 || groups.size <= 3))];
}

/** Perf.Adaptive's steps down, by level. */
const STEPS = ['full quality', 'link glows plain', 'fewer particles', 'effects held still'];

/** How far Perf.Adaptive stepped down now. */
const adaptiveNow = () => (L.perfAdaptive ? `Adaptive quality: ${STEPS[adaptive.level]}` : 'Adaptive quality: off');

/** The Perf tab's line that says how far Perf.Adaptive stepped down. */
function quality(): HTMLElement {
    const line = h('p', { class: 'eln-hint eln-adaptive', role: 'status' });
    parts.push(() => {
        line.textContent = `${adaptiveNow()}.`;
    });
    return line;
}

/**
 * A section of a tab: a group's settings, open as `open` says until opened or closed, its advanced ones on demand. It
 * hides while none of them applies.
 */
function section(group: string, settings: Visible[], open: boolean): HTMLElement {
    const title = group.slice(group.indexOf(' · ') + 3);
    const id = `eln-section-${++ids}`;
    open = opened.get(group) ?? open;
    const toggle = h('button', { type: 'button', id: `${id}-title`, class: 'eln-section-toggle', 'aria-expanded': String(open), 'aria-controls': id },
        h('i', { class: 'pi pi-chevron-down', 'aria-hidden': 'true' }), title);
    const region = h('div', { id, role: 'region', class: 'eln-section-body', 'aria-labelledby': `${id}-title`, hidden: !open });
    toggle.addEventListener('click', () => {
        region.hidden = !region.hidden;
        toggle.setAttribute('aria-expanded', String(!region.hidden));
        opened.set(group, !region.hidden);
    });
    const count = h('span', { class: 'eln-count' });
    const reset = iconButton('pi-undo', `Reset ${title} to the defaults`, () => {
        offerUndo(`${title} reset`, commitAll(Object.fromEntries(settings.map((s) => [s.id, s.default]))));
        // The reset hides once nothing is changed, so the focus goes to the section rather than the page.
        toggle.focus();
    });
    const own = settings.map((s) => row(s));
    rows.push(...own);
    const more = h('button', { type: 'button', class: 'eln-link eln-more' });
    more.addEventListener('click', () => {
        revealed.add(group);
        refresh();
    });
    region.append(...own.map((r) => r.el), more);
    const el = h('section', { class: 'eln-section' }, h('div', { class: 'eln-section-head' }, h('h3', {}, toggle), count, reset), region);
    parts.push(() => {
        const changes = settings.filter((s) => shown(s.id) !== s.default).length;
        count.textContent = changes ? `${changes} changed` : '';
        count.hidden = reset.hidden = !changes;
        // Advanced settings show once Advanced is open, or this section's are asked for.
        let held = 0;
        for (const r of own) {
            if (r.el.hidden || !('advanced' in r.setting) || state.advanced || revealed.has(group)) continue;
            r.el.hidden = true;
            held++;
        }
        more.textContent = `+ ${held} advanced`;
        more.hidden = !held;
        el.hidden = !held && own.every((r) => r.el.hidden);
    });
    return el;
}

/** The settings and looks a search finds, by every word in their names, text, choices, groups or ids. */
function results(query: string): HTMLElement[] {
    const words = query.toLowerCase().split(/\s+/);
    const finds = (...texts: string[]) => {
        const text = texts.join(' ').toLowerCase();
        return words.every((word) => text.includes(word));
    };
    const looks = [...LOOKS, ...mine].filter((look) => finds(look.name, look.description));
    const groups = new Map<string, Visible[]>();
    for (const s of VISIBLE) {
        if (finds(s.name, s.tooltip ?? '', s.group, s.id, ...(s.type === 'combo' ? s.options.map((o) => o.text) : []))) groups.set(s.group, [...(groups.get(s.group) ?? []), s]);
    }
    if (!looks.length && !groups.size) return [h('p', { class: 'eln-hint' }, `Nothing matches “${query}”.`)];
    const found = looks.length ? [h('section', { class: 'eln-section' }, h('h3', { class: 'eln-crumb' }, 'Looks'), lookGrid(looks))] : [];
    for (const [group, settings] of groups) {
        const own = settings.map((s) => row(s, true));
        rows.push(...own);
        found.push(h('section', { class: 'eln-section' }, h('h3', { class: 'eln-crumb' }, group.replace(' · ', ' › ')), h('div', { class: 'eln-section-body' }, ...own.map((r) => r.el))));
    }
    return found;
}

// =============================================================================
// Notices
// =============================================================================

interface Notice {
    text: string;
    action?: [label: string, run: () => void];
}

/** What keeps effects from showing, on the tabs it concerns; the Looks tab tells them all. */
function noticesOf(tab: string): Notice[] {
    const all = tab === 'looks';
    const list: Notice[] = [];
    if ((all || tab === 'links') && !running.links) list.push({ text: DISABLED.links });
    if ((all || tab === 'nodes') && !running.nodes) list.push({ text: DISABLED.nodes });
    if ((all || tab === 'nodes') && LiteGraph.vueNodesMode) {
        list.push({
            text: 'Nodes 2.0 is on: glows, selection and run outlines, particles, selection focus, run visuals and completion effects work. The patterns inside nodes, the hover outline, focus on hover, double-click jumps and animated titles need classic nodes.',
            action: ['Use classic nodes', () => void app.extensionManager.setting.set('Comfy.VueNodes.Enabled', false)],
        });
    }
    if ((all || tab === 'nodes') && N.enabled && N.background !== 'none' && !LiteGraph.vueNodesMode && !available()) {
        list.push({ text: 'Node backgrounds need WebGL on a GPU, which this browser does not offer here, so none show.' });
    }
    if ((all || tab === 'links') && deferring()) list.push({ text: L.coexist === 'defer' ? 'Link effects are set to always step aside for other link extensions.' : 'Another extension draws links, so link effects step aside for it.', action: ['Keep Enhanced link effects', () => commit(COEXIST, 'ours')] });
    for (const key of tab === 'perf' ? [] : guard.tripped()) {
        list.push({ text: `${key} kept failing, so it was turned off.`, action: ['Retry', () => {
            guard.retry();
            refresh();
        }] });
    }
    return list;
}

function notices(tab: string): HTMLElement {
    const box = h('div', { class: 'eln-notices' });
    let showing = '';
    parts.push(() => {
        const list = noticesOf(tab);
        const key = list.map((n) => n.text).join('\n');
        if (key === showing) return;
        showing = key;
        box.replaceChildren(...list.map(({ text, action }) => {
            const notice = h('div', { class: 'eln-notice', role: 'note' }, h('i', { class: 'pi pi-info-circle', 'aria-hidden': 'true' }), h('span', {}, text));
            if (action) {
                const button = h('button', { type: 'button', class: 'eln-link' }, action[0]);
                button.addEventListener('click', action[1]);
                notice.append(button);
            }
            return notice;
        }));
    });
    return box;
}

// =============================================================================
// Looks
// =============================================================================

/** Live tiles of `looks` that preview on the canvas while hovered and apply when picked; the look Look names is ticked. */
function lookGrid(looks: readonly Look[]): HTMLElement {
    const dots: HTMLElement[] = [];
    const items = looks.map((look) => {
        const dot = h('span', { class: 'eln-dot', title: 'Changed since the look was applied' }, h('span', { class: 'eln-sr' }, 'Changed since applied'));
        dots.push(dot);
        const item = h('button', { type: 'button', role: 'radio', class: 'eln-tile', 'data-look': look.id, title: look.description },
            lookTile(look), h('span', { class: 'eln-tile-name' }, look.name, dot), h('span', { class: 'eln-tile-text' }, look.description));
        hover(item, () => previewLook(look));
        item.addEventListener('click', () => apply(look));
        return item;
    });
    const grid = h('div', { role: 'radiogroup', class: 'eln-looks', 'aria-label': 'Looks' }, ...items);
    roving(grid, items);
    parts.push(() => {
        const current = currentLook();
        const at = looks.findIndex((look) => look.id === current?.id);
        check(items, at);
        dots.forEach((dot, i) => (dot.hidden = i !== at || !changed(current!)));
    });
    return grid;
}

function looksTab(): HTMLElement[] {
    const list = h('div');
    const note = h('div', { role: 'status' });
    const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    file.addEventListener('change', () => {
        const picked = file.files?.[0];
        file.value = '';
        if (picked) void userData(async () => {
            const { look, errors } = await importLook(await picked.text());
            note.replaceChildren(...(look ? [h('p', { class: 'eln-hint' }, `${look.name} is among your looks now.`)] : []),
                ...(errors.length ? [h('ul', { class: 'eln-errors' }, ...errors.map((error) => h('li', {}, error)))] : []));
        });
    });
    relist = () => {
        const hint = unread ? `Your looks could not be read: ${unread}` : 'Save what you have now as a look of your own, or import a look file.';
        list.replaceChildren(...(mine.length ? mine.map(mineRow) : [h('p', { class: 'eln-hint' }, hint)]));
        quick();
    };
    relist();
    return [
        notices('looks'),
        h('section', { class: 'eln-section' }, h('h3', { class: 'eln-heading' }, 'Looks'), lookGrid(LOOKS)),
        h('section', { class: 'eln-section' }, h('h3', { class: 'eln-heading' }, 'My looks'), list,
            h('div', { class: 'eln-actions' }, button('Save current as look…', () => void saveCurrent()), button('Import…', () => file.click()), button('Surprise me', surpriseMe)),
            note, file),
    ];
}

/** Runs a change of the user's looks and shows them as they are then; a failure to read or save them shows in a toast. */
async function userData(change: () => Promise<unknown>): Promise<void> {
    try {
        await change();
        mine = await userLooks();
        unread = '';
    } catch (error) {
        unread = String(error);
        app.extensionManager.toast.add({ severity: 'error', summary: 'Your looks could not be read or saved', detail: unread, life: UNDO_MS });
    }
    if (root) relist();
}

function mineRow(look: Look): HTMLElement {
    const use = h('button', { type: 'button', class: 'eln-button' }, 'Apply');
    use.addEventListener('click', () => apply(look));
    return h('div', { class: 'eln-mine-row' }, h('span', { class: 'eln-mine-name' }, look.name), use,
        iconButton('pi-pencil', `Rename ${look.name}`, () => void rename(look)),
        iconButton('pi-download', `Export ${look.name}`, () => download(look)),
        iconButton('pi-trash', `Delete ${look.name}`, () => void userData(async () => {
            const undo = await deleteLook(look.id);
            offerUndo(`${look.name} deleted`, () => void userData(undo));
        })));
}

async function saveCurrent(): Promise<void> {
    const name = (await app.extensionManager.dialog.prompt({ title: 'Save look', message: 'Name the look', defaultValue: 'My look' }))?.trim();
    // Applying what shows changes nothing on screen: it names the look, and saves what the first-run overlay shows.
    if (name) await userData(async () => applyLook(await saveLook(name)));
}

async function rename(look: Look): Promise<void> {
    const name = (await app.extensionManager.dialog.prompt({ title: 'Rename look', message: 'Name the look', defaultValue: look.name }))?.trim();
    if (name && name !== look.name) await userData(() => renameLook(look.id, name));
}

/** Hands a look's file to the browser to save. */
function download(look: Look): void {
    const url = URL.createObjectURL(new Blob([exportLook(look)], { type: 'application/json' }));
    h('a', { href: url, download: `${look.name.replace(/[^\w-]+/g, '-')}.json` }).click();
    setTimeout(() => URL.revokeObjectURL(url));
}

// =============================================================================
// About
// =============================================================================

const REPO = 'https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes';
const DISCORD = 'https://discord.gg/UzC9353mfp';
const KOFI = 'https://ko-fi.com/aemotionstudio';
const AWAY = { target: '_blank', rel: 'noopener noreferrer' };

/** What is new in 3.0, as far as it has shipped. */
const NEWS = [
    "Effects draw on ComfyUI's own links and nodes, so links stay clickable, and reroutes, subgraphs and every link render mode work.",
    "v1's look is back: Classic Flow with its halo, and the link animations on v1's clock, moving along the real path across reroutes.",
    'This panel: looks with live previews, search, undo, and two-way sync with the settings dialog, which now has readable names and groups.',
    'Link FX and Node FX switches, a frame-rate cap, a Motion setting, and an effect over your outputs when a run finishes: fireworks, confetti, a shockwave or a comet along the links it took.',
    'Quick toggles: View ▸ Enhanced Links & Nodes, Enhanced FX in the canvas menu, buttons on the action bar and the selection toolbox, and keys for this panel, every effect and the running node, which Shortcut keys under Perf turns on.',
    "Selection focus makes the selected nodes' links stand out, or alone animate, with the rest dimmed or hidden if you like; Go to connected node in the node menu, a double-click on a slot and Back take you along the links; your own runs show light flowing into the running node, a progress ring, a fading trail and a red pulse on errors, which Go to running node goes to.",
    'Wire physics: links hang and swing like a cable, a spring or syrup, with any link animation or none, as in the Living Wires look.',
    'Four new link animations: Merkaba Beads, DNA Helix 3D, Comet Trails and Stardust.',
    "New node effects: Flower of Life, which draws itself in and blooms; Jelly, which wobbles the node itself like gel; Circuit Trace, pulses racing along etched traces; Aurora Veil, curtains of light hanging from the title bar; and Ember Crown, flames licking up from it. v1's Flower of Life is now Sacred Rosette, its rings closed and much lighter.",
    "Node backgrounds: Plasma, Aurora, Starfield and five more patterns drawn on the GPU on each node's body, under its widgets and any node effect.",
    'Connection assist: while you drag a link, a guide line, or hands and eyes, show the nearest slot it can connect to, as in the Showcase look.',
    'Much lighter than 2.x on big graphs.',
];

/** The project's and the studio's places, each opening in a tab of its own. */
const PLACES = [
    ['pi-github', 'Report an issue', `${REPO}/issues`],
    ['pi-discord', 'Discord', DISCORD],
    ['pi-youtube', 'YouTube', 'https://www.youtube.com/@aemotionstudio/videos'],
    ['pi-heart', 'Ko-fi', KOFI],
];

/** ComfyUI's About page shows these: the project at its version, the studio's Discord, named apart from ComfyUI's own beside it, and Ko-fi. */
export const BADGES = [
    { label: `${TITLE} ${__ELN_VERSION__}`, url: REPO, icon: 'pi pi-github' },
    { label: 'Æmotion Studio Discord', url: DISCORD, icon: 'pi pi-discord' },
    { label: 'Ko-fi', url: KOFI, icon: 'pi pi-heart' },
];

/** The commands whose keys About tells, by what ComfyUI calls them, and the keys of the panel itself. */
const COMMANDS = [
    [TOGGLE, 'Toggle Enhanced Links & Nodes Sidebar', 'Opens and closes this panel.'],
    [TOGGLE_ALL, 'Toggle all effects', 'Turns every effect off, or back on.'],
    ['EnhancedLinksNodes.GoToRunning', 'Go to running node (or next error)', 'Goes to the node your run is running, or once it failed, to the next error.'],
];
const KEYS = [
    ['← → Home End', 'Move between the tabs.'],
    ['Arrows, Enter, Space', 'Move through a gallery or the looks, and pick one.'],
    ['Esc', 'Clears the search, or closes the Look menu. On the look picker, keeps the look that shows.'],
];

/** The keys that work now: each command's as it is bound, else its name and where to give it one. */
function keys(): string[][] {
    return [...COMMANDS.map(([id, name, what]) => {
        const key = keyName(id);
        return key ? [key, what] : [name, `${what} Turn on Shortcut keys under Perf, or give it a key in Settings › Keybinding.`];
    }), ...KEYS];
}

/** In the README's words, for the author to edit. */
const STUDIO = 'Developed by Æmotion Studio, Enhanced Links & Nodes adds beautiful, customizable animations to both links and nodes in your ComfyUI workflow. Contributions are welcome!';

function aboutTab(): HTMLElement[] {
    const note = h('p', { class: 'eln-hint', role: 'status' });
    const text = h('textarea', { class: 'eln-diagnostics', rows: 10, readonly: true, hidden: true, 'aria-label': 'Diagnostics' });
    const copy = async () => {
        const report = diagnostics();
        try {
            await navigator.clipboard.writeText(report);
            note.textContent = 'Copied. Paste it into your report: nothing was sent anywhere.';
            text.hidden = true;
        } catch {
            // Browsers keep the clipboard from pages served over plain http, such as ComfyUI opened from another machine.
            note.textContent = 'Copy the text below.';
            text.value = report;
            text.hidden = false;
            text.select();
        }
    };
    const sure = h('div', { class: 'eln-confirm', role: 'group', 'aria-label': 'Reset everything', hidden: true });
    const ask = button('Reset everything…', () => {
        sure.hidden = false;
        yes.focus();
    });
    const yes = button('Reset everything', () => {
        sure.hidden = true;
        resetEverything();
    });
    sure.append(h('p', {}, 'Every Enhanced Links & Nodes setting goes back to its default, and the look to Subtle.'), yes, button('Cancel', () => {
        sure.hidden = true;
        ask.focus();
    }));
    return [
        h('section', { class: 'eln-section eln-brand' }, h('span', { class: 'eln-icon', 'aria-hidden': 'true' }),
            h('div', {}, h('h3', { class: 'eln-heading' }, `${TITLE} ${__ELN_VERSION__}`),
                h('p', { class: 'eln-hint' }, 'by Æmotion Studio · GPL-3.0 · ', h('a', { href: REPO, ...AWAY }, 'Source on GitHub')))),
        h('section', { class: 'eln-section' }, h('h3', { class: 'eln-heading' }, "What's new in 3.0"), h('ul', { class: 'eln-news' }, ...NEWS.map((item) => h('li', {}, item))),
            h('div', { class: 'eln-actions' }, ...PLACES.map(([icon, label, href]) => h('a', { class: 'eln-button', href, ...AWAY }, h('i', { class: `pi ${icon}`, 'aria-hidden': 'true' }), label)))),
        h('section', { class: 'eln-section' }, h('h3', { class: 'eln-heading' }, 'Keys'), h('dl', { class: 'eln-keys' }, ...keys().flatMap(([key, what]) => [h('dt', {}, key), h('dd', {}, what)]))),
        h('section', { class: 'eln-section' }, h('h3', { class: 'eln-heading' }, 'Tools'),
            h('div', { class: 'eln-actions' }, button('Show the look picker', showPicker), button('Copy diagnostics', () => void copy()), ask), sure, note, text),
        h('section', { class: 'eln-section' }, h('details', { class: 'eln-studio' }, h('summary', {}, 'About Æmotion Studio'),
            h('p', {}, STUDIO), h('a', { href: 'https://aemotionstudio.org/', ...AWAY }, 'aemotionstudio.org'))),
    ];
}

/** What the author needs to look into a report. It goes to the clipboard and nowhere else. */
function diagnostics(): string {
    const look = currentLook();
    const changes = VISIBLE.filter((s) => shown(s.id) !== s.default).map((s) => `  ${s.id}: ${JSON.stringify(shown(s.id))}`);
    return [
        `${TITLE} ${__ELN_VERSION__}, ComfyUI frontend ${window.__COMFYUI_FRONTEND_VERSION__}`,
        `Browser: ${navigator.userAgent}; language ${navigator.language}`,
        `Palette: ${light() ? 'light' : 'dark'}, canvas ${app.canvas.clear_background_color}`,
        `Nodes 2.0: ${LiteGraph.vueNodesMode ? 'on' : 'off'}`,
        `Workflow: ${app.rootGraph.nodes.length} nodes, ${app.rootGraph.links.size} links`,
        `Look: ${L.look || 'not chosen yet'}${look && changed(look) ? ', changed since it was applied' : ''}`,
        `Set up: ${Object.entries(running).flatMap(([part, on]) => (on ? [part] : [])).join(', ') || 'neither extension'}`,
        `Coexist: ${L.coexist}${deferring() ? ', stepping aside for another extension' : ''}`,
        `Reduced motion: ${env.reducedMotion ? 'yes' : 'no'}`,
        adaptiveNow(),
        `Turned off after failing: ${guard.tripped().join(', ') || 'nothing'}`,
        `Settings changed from the defaults:${changes.length ? '' : ' none'}`,
        ...changes,
    ].join('\n');
}
