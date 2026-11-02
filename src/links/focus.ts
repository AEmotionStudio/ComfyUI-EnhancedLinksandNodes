/**
 * Selection focus: the links that stand out. The focus holds the links touching
 * the selected nodes, which ComfyUI highlights (a selected group counts as the
 * nodes in it), and with Focus.Hover those of the node the pointer rests on;
 * Focus.Depth adds everything feeding them, all they feed, or both. It goes on
 * through legacy Reroute nodes, as a native reroute is part of its link
 * already, and keeps the native reroutes its links pass, whose segments native
 * draws once, for the first link through them. It stays in the graph shown,
 * subgraph IO links included, and stops at 2000 links. The link pass asks for
 * it in every pass, and it is built again only when the selection, the node
 * hovered, the graph or a setting changed, which a look at a few values tells.
 *
 * @module links/focus
 */

import type { LLink } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L, revision } from '@/core/settings';
import { HIGHLIGHT, accent, lighter, solid, type Palette } from '@/core/colors';

type Canvas = InstanceType<typeof LGraphCanvas>;
type Graph = NonNullable<Canvas['graph']>;
type Node = InstanceType<typeof LGraphNode>;

/** The most links a focus holds. */
const MOST = 2000;
/** How long the pointer rests on a node before Focus.Hover takes it, and how long it keeps it once the pointer left, in ms. */
const HOVER_MS = 150;
const LEAVE_MS = 100;

/** The ids of the links focused, and of the native reroutes they pass. */
export const focus = { links: new Set<number>(), reroutes: new Set<number>() };

/** Whether a segment native draws for `link` is focused: one into `reroute` if a focused link passes that reroute, any other if the link is focused. */
export const focuses = (link: { id: number }, reroute?: { id: number }): boolean => (reroute ? focus.reroutes.has(reroute.id) : focus.links.has(link.id));

/** Whether anything is focused. */
export const focusing = (): boolean => focus.links.size > 0;

/**
 * What the focus was built from: the graph, its version and how many reroutes it has, the settings' revision, the node
 * hovered, the canvas background, which a palette changes along with the accent, and the items selected, in order.
 */
const built = { graph: undefined as Graph | undefined, version: 0, reroutes: 0, revision: 0, hovered: undefined as Node | undefined, background: '', items: [] as unknown[] };

/** The accent as the focus was built, for Focus.Color's Theme accent. */
let themeAccent = '';

/** The node Focus.Hover takes; the one the pointer was over when last looked at; and the timers that change the first. */
let resting: Node | undefined;
let under: Node | undefined;
let adding = 0;
let dropping = 0;

function settle(node: Node | undefined): void {
    resting = node;
    app.canvas.setDirty(true, true);
}

/** Follows the node the pointer is over, as Focus.Hover takes it: none while something is dragged or connected. */
function hover(canvas: Canvas): void {
    const over = L.focusEnabled && L.focusHover && !canvas.isDragging && !canvas.dragging_canvas && !canvas.linkConnector.isConnecting ? canvas.node_over : undefined;
    if (over === under) return;
    under = over;
    clearTimeout(adding);
    clearTimeout(dropping);
    if (resting && over !== resting) dropping = window.setTimeout(settle, LEAVE_MS, undefined);
    if (over && over !== resting) adding = window.setTimeout(settle, HOVER_MS, over);
}

/** Whether what the focus is built from changed since it was built. */
function changed(canvas: Canvas, graph: Graph): boolean {
    const items = canvas.selectedItems;
    if (built.graph !== graph || built.version !== graph._version || built.reroutes !== graph.reroutes.size || built.revision !== revision
        || built.hovered !== resting || built.background !== canvas.clear_background_color || built.items.length !== items.size) return true;
    let i = 0;
    for (const item of items) if (built.items[i++] !== item) return true;
    return false;
}

/** The nodes whose links are focused, and while one reach is built, the nodes it goes on from and those it went through. */
const seeds: Node[] = [];
const stack: Node[] = [];
const visited = new Set<Node>();

/** Focuses a link and the reroutes it passes; false once the focus is full. */
function add(graph: Graph, link: LLink): boolean {
    if (focus.links.size >= MOST) return false;
    focus.links.add(link.id);
    // A reroute already focused had the ones before it focused too.
    for (let r = graph.getReroute(link.parentId); r && !focus.reroutes.has(r.id); r = graph.getReroute(r.parentId)) focus.reroutes.add(r.id);
    return true;
}

/** Focuses a link from the side it was reached on, and goes on from its far end where `far`, or where that is a legacy Reroute node. */
function through(graph: Graph, link: LLink | null | undefined, up: boolean, far: boolean): boolean {
    if (!link) return true;
    if (!add(graph, link)) return false;
    // Not on from a subgraph's input or output, which is no node.
    const next = graph.getNodeById(up ? link.origin_id : link.target_id);
    if (next && (far || next.type === 'Reroute')) stack.push(next);
    return true;
}

/** Focuses the links into the seeds (`up`) or out of them, and on through those of the nodes it goes on to. */
function spread(graph: Graph, up: boolean, far: boolean): void {
    stack.length = 0;
    stack.push(...seeds);
    visited.clear();
    for (let node = stack.pop(); node; node = stack.pop()) {
        if (visited.has(node)) continue;
        visited.add(node);
        if (up) {
            for (let i = 0; i < node.inputs.length; i++) if (!through(graph, node.getInputLink(i), true, far)) return;
        } else {
            for (const output of node.outputs) for (const id of output.links ?? []) if (!through(graph, graph.getLink(id), false, far)) return;
        }
    }
}

function build(canvas: Canvas, graph: Graph): void {
    focus.links.clear();
    focus.reroutes.clear();
    Object.assign(built, { graph, version: graph._version, reroutes: graph.reroutes.size, revision, hovered: resting, background: canvas.clear_background_color });
    built.items.length = seeds.length = 0;
    for (const item of canvas.selectedItems) {
        built.items.push(item);
        if (item instanceof LGraphNode) seeds.push(item);
        else if (item instanceof LGraphGroup) for (const child of item.children) if (child instanceof LGraphNode) seeds.push(child);
    }
    if (resting?.graph === graph) seeds.push(resting);
    if (L.focusColor === 'accent') themeAccent = accent();
    const { focusDepth: depth } = L;
    spread(graph, true, depth === 'upstream' || depth === 'chain');
    spread(graph, false, depth === 'downstream' || depth === 'chain');
}

/** Builds the focus again if what it is built from changed; whether it did. */
export function syncFocus(canvas: Canvas): boolean {
    hover(canvas);
    const { graph } = canvas;
    if (!L.focusEnabled || !graph) {
        if (!built.graph) return false;
        focus.links.clear();
        focus.reroutes.clear();
        built.graph = undefined;
        return true;
    }
    if (!changed(canvas, graph)) return false;
    build(canvas, graph);
    return true;
}

/** The palette focused links are drawn in, for a link native draws in `colour`: Focus.Color's. */
export function focusPalette(colour: string): Palette {
    return L.focusColor === 'type' ? solid(lighter(colour)) : L.focusColor === 'accent' ? solid(themeAccent) : HIGHLIGHT;
}
