/**
 * Node effects in Nodes 2.0, ComfyUI's Vue node renderer, whose nodes are DOM
 * elements over the main canvas, so that none of the node hooks run. Each
 * node's element is marked with what it shows, as a MutationObserver sees it
 * mount and as the node layer finds that changed: data-eln-fx its effect,
 * data-eln-only where it shows its particles alone, data-eln-collapsed where it
 * is collapsed, data-eln-sel its selection glow, data-eln-run where this
 * client's run is running or failed, data-eln-mode bypassed or muted. One
 * stylesheet draws them as a glow behind the node, from just outside ComfyUI's
 * own outlines: Gentle Pulse's breathes, Neon Nexus holds a neon edge, Cosmic
 * Ripple sends a ring out and Flower of Life's turns about the node, in the
 * effects' own colours, with the halo, which is all that shows with the
 * particles alone; a selected, running or failed node glows steadily, and a
 * collapsed one, which classic mode draws no effect on, only with its run. They
 * hold still or go calm with the canvas effects, as an attribute on the page's
 * root says, hold still while ComfyUI disables animations, and while more of
 * them move on screen than a quarter of Perf.StaticAbove, as 1.57.1 paints the
 * drop shadow under each node again for each glow that moves; zoomed out below
 * Perf.MinZoom only a run's glows show. The particles
 * stay on the main canvas, under the DOM nodes; the patterns inside a node, the
 * hover outline and the styled titles need classic nodes.
 *
 * @module nodes/vue
 */

import type { NodeId } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L, N, revision } from '@/core/settings';
import { during, overlaps, transformPane, zoomedOut } from '@/core/engine';
import { nodePalette } from '@/core/colors';
import { BYPASS, NEVER, holdsStill } from '@/nodes/effects';
import { stepOf, syncRuns } from '@/fx/execution';
import { effectOf, particlesOnly } from '@/ui/menus';

type Canvas = typeof app.canvas;
type Node = InstanceType<typeof LGraphNode>;

/** data-eln-fx by Animate value. */
const FX = ['', 'gentle', 'neon', 'cosmic', 'flower'];
/** What a node's element shows, as a number: its effect in the low three bits, 0 for none, and these. */
const SELECTED = 8;
const RUNNING = 16;
const FAILED = 32;
const BYPASSED = 64;
const MUTED = 128;
const ONLY = 256;
const COLLAPSED = 512;
/** What shows a steady glow, if any, whatever its effect; and the effects whose glow moves: Gentle Pulse's, Cosmic Ripple's and Flower of Life's. */
const STEADY = ONLY | COLLAPSED | SELECTED | RUNNING | FAILED;
const MOVES = [false, true, false, true, true];
const ATTRIBUTES = ['data-eln-fx', 'data-eln-only', 'data-eln-collapsed', 'data-eln-sel', 'data-eln-run', 'data-eln-mode'];

/** The pane observed, the stylesheet and the settings it was written for, and what the page's root says of the effects' pace. */
let observed: Element | null = null;
let observer: MutationObserver | undefined;
let sheet: HTMLStyleElement | undefined;
let written = -1;
let pace = '';
/** What each node of the graph `shown` was given; Vue keeps an element for a node id across graphs, so a graph shown anew starts over. */
let given = new WeakMap<Node, number>();
let shown: unknown;

/** What a node's element shows: its effect, as its particles alone or not, whether it is collapsed, its selection glow, among `selected`, where its effect shows more than its particles, and its run and mode. */
function lookOf(node: Node, selected: ReadonlySet<unknown>): number {
    const fx = effectOf(node);
    const only = fx > 0 && particlesOnly(node);
    const step = stepOf(node);
    return fx
        | (only ? ONLY : 0)
        | (fx && node.flags.collapsed ? COLLAPSED : 0)
        | (fx && !only && N.selectionGlow && selected.has(node) ? SELECTED : 0)
        | (step?.end === Infinity ? (N.runRing ? RUNNING : 0) : step?.failed && N.runError ? FAILED : 0)
        | (node.mode === BYPASS ? BYPASSED : node.mode === NEVER ? MUTED : 0);
}

const put = (el: Element, name: string, value: string) => (value ? el.setAttribute(name, value) : el.removeAttribute(name));

/** Marks a node's element with `look`, never touching the class and style Vue binds (FE157 and FE1395 LGraphNode.vue). */
function mark(el: Element, look: number): void {
    put(el, 'data-eln-fx', FX[look & 7]);
    el.toggleAttribute('data-eln-only', (look & ONLY) > 0);
    el.toggleAttribute('data-eln-collapsed', (look & COLLAPSED) > 0);
    el.toggleAttribute('data-eln-sel', (look & SELECTED) > 0);
    put(el, 'data-eln-run', look & RUNNING ? 'running' : look & FAILED ? 'failed' : '');
    put(el, 'data-eln-mode', look & BYPASSED ? 'bypass' : look & MUTED ? 'muted' : '');
}

/** The node elements Vue mounts in the pane, its children, are marked as they come. */
function mounted(records: MutationRecord[]): void {
    const { canvas } = app;
    for (const record of records) {
        for (const el of record.addedNodes) {
            if (!(el instanceof HTMLElement)) continue;
            const node = canvas.graph?.getNodeById(el.dataset.nodeId as NodeId | undefined);
            if (!node) continue;
            const look = lookOf(node, canvas.selectedItems);
            given.set(node, look);
            mark(el, look);
        }
    }
}

/** The shortest an effect takes to breathe or ripple, in s, well within MAX_FLASH_HZ's three flashes a second. */
const SHORTEST = 0.8;

/** An effect's period, `seconds` at speed 1 and never under SHORTEST, four times as long while a Calm run plays. */
const period = (seconds: number) => `calc(${Math.max(SHORTEST, seconds / N.animationSpeed).toFixed(2)}s * var(--eln-slow, 1))`;

/**
 * The stylesheet, for the settings as they are. Each element's glow is a box 6 px outside its node, out of the way of
 * ComfyUI's own selection, running and error outlines, behind the node (z-index -1 in the stacking context the node's
 * isolate class, 1.57.1, or its transform, 1.39.5, makes) and only around it: box shadows are drawn outside their box
 * alone, which is no fill. The root's ::before is 1.39.5's bypass and mute overlay, so the glow takes ::after. Only
 * opacity and transform move, on the compositor; Vue's own opacity of 0.5 for bypassed and muted nodes is taken to
 * the alpha classic mode draws them at, 0.2 and 0.4. 1.57.1's Disable animations, a class on the body, holds them
 * still whatever Motion says: its own rule cuts every animation to 0.001 ms, which would stop them mid-way.
 */
function stylesheet(): string {
    const { glow, animationGlow, animationSize: size, intensity } = N;
    const bloom = Math.round((6 + 24 * animationGlow) * size);
    const light = `color-mix(in srgb, var(--eln-c2) ${Math.round(Math.min(100, 45 * intensity))}%, transparent)`;
    const halo = N.glowShow && glow > 0 ? `0 0 ${Math.round(36 * glow)}px color-mix(in srgb, var(--eln-c1) 60%, transparent)` : '';
    const withHalo = (shadows: string) => (halo ? `${halo}, ${shadows}` : shadows);
    const r = Math.round(4 * size);
    const turn = Array.from({ length: 9 }, (_, i) => `${i * 12.5}%{transform:translate(${(r * Math.cos((i * Math.PI) / 4)).toFixed(1)}px,${(r * Math.sin((i * Math.PI) / 4)).toFixed(1)}px)}`).join('');
    const colours = FX.slice(1).map((fx, i) => {
        const { primary, secondary, accent } = nodePalette(i + 1);
        return `.lg-node[data-eln-fx=${fx}]{--eln-c1:${primary};--eln-c2:${secondary};--eln-c3:${accent}}`;
    });
    return [
        ...colours,
        '.lg-node:is([data-eln-fx],[data-eln-run])::after{content:"";position:absolute;inset:-6px;z-index:-1;border-radius:18px;pointer-events:none;--eln-a:calc(var(--eln-mode, 1) * var(--eln-calm, 1));opacity:var(--eln-a)}',
        `.lg-node[data-eln-fx=gentle]::after{box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-breathe ${period(3)} ease-in-out infinite alternate}`,
        `.lg-node[data-eln-fx=neon]::after{border:1.5px solid var(--eln-c1);box-shadow:${withHalo(`0 0 4px var(--eln-c1), 0 0 ${bloom}px ${light}`)}}`,
        `.lg-node[data-eln-fx=cosmic]::after{border:1.5px solid var(--eln-c1);box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-ripple ${period(3)} ease-out infinite}`,
        `.lg-node[data-eln-fx=flower]::after{box-shadow:${withHalo(`0 0 ${bloom}px ${light}`)};animation:eln-turn ${period(12)} linear infinite ${N.direction < 0 ? 'reverse' : 'normal'}}`,
        `.lg-node[data-eln-sel]::after{border:0;box-shadow:${withHalo(`0 0 ${Math.round(12 + 36 * glow)}px 2px color-mix(in srgb, var(--eln-c3) 75%, transparent)`)};animation:none}`,
        `.lg-node[data-eln-only]::after{border:0;box-shadow:${halo || 'none'};animation:none}`,
        '.lg-node[data-eln-collapsed]:not([data-eln-run])::after{content:none}',
        '.lg-node[data-eln-run=running]::after{border:0;box-shadow:0 0 16px 2px color-mix(in srgb, var(--primary-background) 60%, transparent);animation:none;opacity:1}',
        '.lg-node[data-eln-run=failed]::after{border:0;box-shadow:0 0 16px 2px rgb(255 59 48 / 55%);animation:none;opacity:1}',
        '.lg-node[data-eln-mode=bypass]{--eln-mode:0.4}',
        '.lg-node[data-eln-mode=muted]{--eln-mode:0.8}',
        ':root[data-eln-pace=still] .lg-node::after, .disable-animations .lg-node::after{animation:none}',
        ':root[data-eln-pace=calm]{--eln-calm:0.5;--eln-slow:4}',
        ':root[data-eln-pace=far] .lg-node:not([data-eln-run])::after{content:none}',
        '@keyframes eln-breathe{from{opacity:calc(var(--eln-a) * 0.35)}}',
        `@keyframes eln-ripple{0%{opacity:0;transform:scale(0.98)}20%{opacity:var(--eln-a);transform:none}100%{opacity:0;transform:scale(${(1 + 0.08 * size).toFixed(2)})}}`,
        `@keyframes eln-turn{${turn}}`,
    ].join('\n');
}

/** Takes it all off: the stylesheet, the observer, the marks and the root's pace. */
function off(): void {
    observer?.disconnect();
    sheet?.remove();
    sheet = undefined;
    for (const el of observed?.querySelectorAll(ATTRIBUTES.map((name) => `[${name}]`).join()) ?? []) for (const name of ATTRIBUTES) el.removeAttribute(name);
    observed = null;
    shown = undefined;
    pace = '';
    document.documentElement.removeAttribute('data-eln-pace');
}

/**
 * The node layer's part in each front pass. In Nodes 2.0 with node effects on, once the transform pane mounts: the
 * stylesheet for the settings as they are, the pace of the effects on the page's root, and each node's element marked
 * with what changed for it; else none of it.
 */
export function vueNodes(canvas: Canvas): void {
    const { graph } = canvas;
    const pane = LiteGraph.vueNodesMode && N.enabled ? transformPane() : null;
    if (!graph || !pane) {
        if (sheet || observed) off();
        return;
    }
    if (pane !== observed) {
        observed = pane;
        observer ??= new MutationObserver(mounted);
        observer.disconnect();
        observer.observe(pane, { childList: true });
        shown = undefined;
    }
    if (!sheet) {
        sheet = Object.assign(document.createElement('style'), { id: 'eln-vue' });
        document.head.append(sheet);
        written = -1;
    }
    if (written !== revision) {
        written = revision;
        const css = stylesheet();
        if (sheet.textContent !== css) sheet.textContent = css;
    }
    if (graph !== shown) {
        shown = graph;
        given = new WeakMap();
    }
    syncRuns(canvas);
    const selected = canvas.selectedItems;
    let moving = 0;
    for (const node of graph.nodes) {
        const look = lookOf(node, selected);
        if (MOVES[look & 7] && !(look & STEADY) && overlaps(node.boundingRect, canvas.visible_area, 0)) moving++;
        if (given.get(node) === look) continue;
        given.set(node, look);
        const el = pane.querySelector(`.lg-node[data-node-id="${node.id}"]`);
        if (el) mark(el, look);
    }
    const crowded = L.perfStaticAbove > 0 && moving > L.perfStaticAbove / 4;
    const now = zoomedOut(canvas) ? 'far' : holdsStill() || crowded ? 'still' : during(N.pauseDuringRender) === 'calm' ? 'calm' : '';
    if (now !== pace) {
        pace = now;
        put(document.documentElement, 'data-eln-pace', pace);
    }
}
