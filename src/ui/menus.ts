/**
 * What a node is given in its menu: its Node FX, an effect of its own or Use
 * global, Particles only, and its Completion FX, which makes it a primary node
 * the completion effect plays over or keeps it off it, kept as flat keys in its
 * properties. Node FX sets every selected node when the node is one of them,
 * and the selection toolbox's button steps the selection through the same
 * effects. Each pick is one change the workflow's history can undo.
 *
 * And going along the links: Go to connected node in the node menu, a
 * double-click on a connected slot, and the commands that go to what feeds the
 * selected node or what it feeds, each through legacy Reroute nodes to the
 * node at the other end. A jump pans there, keeping the zoom, selects the node
 * and pulses its outline, in the accent or an error's red; a chip offers to go
 * back, as GoBack does, along the last 20 jumps.
 *
 * And to this client's run (fx/execution.ts): GoToRunning goes to the node it
 * runs, and once it is over NextError to the nodes with errors; with
 * Navigate.Follow the view pans to each node it reaches off screen, until a
 * pan, zoom or drag of the user's pauses that.
 *
 * @module ui/menus
 */

import type { IContextMenuValue, LLink, LinkId } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { api } from '/scripts/api.js';
import { L, N, NODE_ANIMATION_OPTIONS } from '@/core/settings';
import { PANE, clock, env, layers, live, overlaps, wake } from '@/core/engine';
import { accent } from '@/core/colors';
import { OWN_COMPLETION, RED, errorNodes, running, shownAs, trace } from '@/fx/execution';
import { CHIP_MS, chip } from '@/sidebar/picker';

type Node = InstanceType<typeof LGraphNode>;
type Canvas = InstanceType<typeof LGraphCanvas>;
type Graph = NonNullable<Canvas['graph']>;

/** Where a node keeps what its menu set: its Node FX style and Particles only; its Completion FX is fx/execution.ts's. */
const OWN_STYLE = 'enhanced_fx_style';
const OWN_ONLY = 'enhanced_fx_particles_only';

/** The command the selection toolbox shows for nodes. */
export const SELECTION_FX = 'EnhancedLinksNodes.SelectionNodeFX';

const STYLES = new Set<unknown>(NODE_ANIMATION_OPTIONS.map((option) => option.value));

/** The Node FX style a node was given, if it is one: a workflow may hold anything there. */
export function ownStyle(node: Node): number | undefined {
    const style = node.properties[OWN_STYLE];
    return STYLES.has(style) ? (style as number) : undefined;
}

/** The style a node's effect takes: its own, else Animate. */
export const effectOf = (node: Node): number => ownStyle(node) ?? N.animate;

type Choices = Record<string, string | number | boolean | undefined>;

/** Sets what a menu picked on `nodes`, deleting what is undefined, as one change the workflow's history can undo. */
export function pick(nodes: readonly Node[], choices: Choices): void {
    app.canvas.emitBeforeChange();
    for (const node of nodes) {
        for (const [key, value] of Object.entries(choices)) {
            if (value === undefined) delete node.properties[key];
            else node.properties[key] = value;
        }
    }
    app.canvas.emitAfterChange();
    app.canvas.setDirty(true, false);
}

/** The nodes among what is selected on the canvas. */
export const selectedNodes = (): Node[] => [...app.canvas.selectedItems].filter((item): item is Node => item instanceof LGraphNode);

/** The one node selected, if one alone is. */
function selected(): Node | undefined {
    const nodes = selectedNodes();
    return nodes.length === 1 ? nodes[0] : undefined;
}

interface Effect {
    name: string;
    choices: Choices;
    /** Whether a node has it. */
    has(node: Node): boolean;
}

/** Node FX's effects, in the order its menu lists them and the toolbox steps through them: Use global, named after Animate's effect, Off, then each style. */
export function effects(): Effect[] {
    const global = N.animate ? NODE_ANIMATION_OPTIONS.find((option) => option.value === N.animate)!.text : 'Off';
    return [
        {
            name: `Use global (${global})`,
            choices: { [OWN_STYLE]: undefined, [OWN_ONLY]: undefined },
            has: (node) => ownStyle(node) === undefined && typeof node.properties[OWN_ONLY] !== 'boolean',
        },
        ...NODE_ANIMATION_OPTIONS.map((option): Effect => ({ name: option.value ? option.text : 'Off', choices: { [OWN_STYLE]: option.value }, has: (node) => ownStyle(node) === option.value })),
    ];
}

/** Whether a node draws its effect's particles alone: as its Particles only says, else as Show base effect does. */
export function particlesOnly(node: Node): boolean {
    const own = node.properties[OWN_ONLY];
    return typeof own === 'boolean' ? own : !N.animationsEnabled;
}

/** A menu entry, ticked when it is the node's. */
const entry = (content: string, ticked: boolean, callback: () => void): IContextMenuValue => ({ content: ticked ? `✓ ${content}` : content, callback });

/**
 * The node menu's Node FX, Completion FX and Go to connected node, one submenu level each, with has_submenu, so the Vue node menu shows them
 * too (FE157 composables/graph/contextMenuConverter.ts L428-447). For a node among others selected, as right-clicking
 * keeps it (FE157 LGraphCanvas.ts L2615, FE1395 L2242), Node FX sets them all, and ticks what they all have.
 */
export function nodeMenu(node: Node): IContextMenuValue[] {
    const connected = connections(node).slice(0, LISTED);
    const selection = selectedNodes();
    const nodes = node.selected && selection.length > 1 ? selection : [node];
    const only = nodes.every(particlesOnly);
    const completion = node.properties[OWN_COMPLETION];
    return [
        {
            content: nodes.length > 1 ? `Node FX (${nodes.length} selected)` : 'Node FX',
            has_submenu: true,
            submenu: {
                options: [
                    ...effects().map((effect) => entry(effect.name, nodes.every(effect.has), () => pick(nodes, effect.choices))),
                    null,
                    entry('Particles only', only, () => pick(nodes, { [OWN_ONLY]: !only })),
                ],
            },
        },
        {
            content: 'Completion FX',
            has_submenu: true,
            submenu: {
                options: [
                    entry('Use global', completion !== 'primary' && completion !== 'exclude', () => pick([node], { [OWN_COMPLETION]: undefined })),
                    entry('Primary (anchor here)', completion === 'primary', () => pick([node], { [OWN_COMPLETION]: 'primary' })),
                    entry('Exclude', completion === 'exclude', () => pick([node], { [OWN_COMPLETION]: 'exclude' })),
                ],
            },
        },
        {
            content: 'Go to connected node',
            has_submenu: true,
            submenu: {
                options: connected.length
                    ? connected.map((c) => ({ content: `${c.up ? '←' : '→'} ${c.slot} · ${c.node.title} #${c.node.id}`, callback: () => jump(c.node, node) }))
                    : [{ content: 'No connections', disabled: true }],
            },
        },
    ];
}

// =============================================================================
// Going along the links
// =============================================================================

/** How far a connection is followed through legacy Reroute nodes, which a loop of them would otherwise never leave. */
const HOPS = 100;
/** How many connections Go to connected node lists, and how many jumps Back goes back along. */
const LISTED = 15;
const HISTORY = 20;
/** How long a jump pans for, and how tall on screen a node shows at the least before the jump zooms to fit it, in px. */
const JUMP_MS = 350;
const SMALL = 40;
/** How long the outline of the node jumped to pulses, twice, or under reduced motion holds still, in s, and how far outside the node it is, in px. */
const PULSE_S = 1.2;
const STEADY_S = 1.5;
const MARK_OUT = 6;

/** The node a link comes from, through legacy Reroute nodes; none from a subgraph's input, which is no node. */
function sourceOf(graph: Graph, link: LLink | null | undefined): Node | undefined {
    for (let hops = 0; link && hops < HOPS; hops++) {
        const node = graph.getNodeById(link.origin_id);
        if (node?.type !== 'Reroute') return node ?? undefined;
        link = node.getInputLink(0);
    }
}

/** The nodes the links `ids` lead to, through legacy Reroute nodes, in order. */
function targetsOf(graph: Graph, ids: readonly LinkId[] | null | undefined, into: Node[] = [], hops = 0): Node[] {
    for (const id of ids ?? []) {
        const link = graph.getLink(id);
        const node = link && graph.getNodeById(link.target_id);
        if (node?.type !== 'Reroute') {
            if (node) into.push(node);
        } else if (hops < HOPS) targetsOf(graph, node.outputs[0].links, into, hops + 1);
    }
    return into;
}

/** A slot's name, as native draws it (NodeSlot.renderingLabel). */
const slotName = (slot: { label?: string; localized_name?: string; name: string }) => slot.label || slot.localized_name || slot.name;

interface Connection {
    /** Whether it feeds the node, through `slot`, rather than being fed through it. */
    up: boolean;
    slot: string;
    node: Node;
}

/** A node's connections in the graph shown: the node each input comes from, then those each output feeds. */
function connections(node: Node): Connection[] {
    const graph = app.canvas.graph!;
    const list: Connection[] = [];
    node.inputs.forEach((input, i) => {
        const source = sourceOf(graph, node.getInputLink(i));
        if (source) list.push({ up: true, slot: slotName(input), node: source });
    });
    for (const output of node.outputs) {
        for (const target of targetsOf(graph, output.links)) list.push({ up: false, slot: slotName(output), node: target });
    }
    return list;
}

/** Where the jumps came from, the last last. */
const back: { node: Node; graph: Graph }[] = [];

/** The node the last jump came from, which Back goes to, dropping first the jumps from other graphs or from nodes since removed. */
function backTo(): Node | undefined {
    const { graph } = app.canvas;
    while (back.length && (back.at(-1)!.graph !== graph || graph.getNodeById(back.at(-1)!.node.id) !== back.at(-1)!.node)) back.pop();
    return back.at(-1)?.node;
}

/** The node the last jump marked, and the colour it is marked in. */
let marked: Node | undefined;
let markColour = '';

/** Draws the mark over the nodes: an outline that pulses twice, or under reduced motion holds still, then goes. */
function drawMark(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    if (!marked) return;
    const steady = env.reducedMotion;
    const t = clock.markTime / (steady ? STEADY_S : PULSE_S);
    if (t >= 1) {
        marked = undefined;
        live.marks = 0;
        return;
    }
    if (marked.graph !== canvas.graph) return;
    ctx.save();
    ctx.globalAlpha = steady ? 1 : 0.5 - 0.5 * Math.cos(4 * Math.PI * t);
    ctx.strokeStyle = markColour;
    // As wide on screen at any zoom.
    ctx.lineWidth = 3 / canvas.ds.scale;
    trace(ctx, marked, MARK_OUT);
    ctx.stroke();
    ctx.restore();
}

/** Pans to `node` over JUMP_MS, at once under reduced motion, keeping the zoom, but that with `fit` a node that would show under SMALL px tall is zoomed to fit. */
function pan(node: Node, fit: boolean): void {
    const { canvas } = app;
    const bounds = node.boundingRect;
    // A duration of 0 throws (FE157 DragAndScale.ts L253-262, FE1395 L231-240).
    canvas.ds.animateToBounds(bounds, () => canvas.setDirty(true, true), { duration: env.reducedMotion ? 1 : JUMP_MS, zoom: fit && bounds[3] * canvas.ds.scale < SMALL ? 0.75 : 0 });
}

/**
 * Pans to `node`, keeping the zoom unless the node would show under SMALL px tall, which zooms to fit it, selects it and
 * pulses its outline in `colour`. A jump `from` a node can be gone back on, which a chip offers, after `text` if given.
 */
function jump(node: Node, from?: Node, text?: string, colour = accent()): void {
    const { canvas } = app;
    if (from && back.at(-1)?.node !== from) {
        back.push({ node: from, graph: canvas.graph! });
        if (back.length > HISTORY) back.shift();
    }
    pan(node, true);
    canvas.selectItems([node]);
    // Over the nodes, from the first jump on.
    layers.marks = drawMark;
    marked = node;
    markColour = colour;
    clock.markTime = 0;
    live.marks = 1;
    wake();
    const previous = backTo();
    chip(text, previous && [`↩ Back to ${previous.title}`, goBack]);
}

/** GoBack: back to where the last jump came from; false if there is nowhere to go back to. */
export function goBack(): boolean {
    const node = backTo();
    if (!node) return false;
    back.pop();
    jump(node);
    return true;
}

/** Where the last step went: from which node, which way, to which of how many nodes it stepped through, to which node, and when. */
let stepped = { from: undefined as Node | undefined, way: '', index: 0, of: 0, to: undefined as Node | undefined, at: 0 };

/** Whether a step `way` steps on through the nodes of the last: while the chip that counts them shows. */
const again = (way: string) => stepped.way === way && stepped.of > 1 && performance.now() - stepped.at < CHIP_MS;

/** Jumps from `from` to the next of `nodes` after the last step's when `next`, else to the first, with a chip that counts them. */
function step(from: Node, way: string, nodes: Node[], next: boolean): void {
    const index = next ? (stepped.index + 1) % nodes.length : 0;
    stepped = { from, way, index, of: nodes.length, to: nodes[index], at: performance.now() };
    jump(nodes[index], from, nodes.length > 1 ? `${index + 1}/${nodes.length} · ${nodes[index].title}` : undefined);
}

/**
 * GoUpstream and GoDownstream: from the one node selected to a node that feeds it, or that it feeds. Again while the
 * node it went to is selected and its chip shows, to the next from the same node. Why it cannot, if it cannot.
 */
export function goAlong(up: boolean): string | undefined {
    const node = selected();
    if (!node) return 'Select one node first';
    const way = up ? 'up' : 'down';
    const next = again(way) && stepped.to === node;
    const from = next ? stepped.from! : node;
    const nodes = connections(from).filter((c) => c.up === up).map((c) => c.node);
    if (!nodes.length) return up ? `Nothing feeds ${from.title}` : `${from.title} feeds nothing`;
    step(from, way, nodes, next);
}

/** Whether a double-click on a slot jumps: Navigate.DoubleClick, on the classic canvas. */
const navigating = () => L.navigateDoubleClick && !LiteGraph.vueNodesMode;

/**
 * Navigate.DoubleClick for a node type: a double-click on a connected output jumps to the node it feeds, the next on a
 * double-click again while its chip shows, and on a connected input to the node it comes from. Both frontends hand a slot's
 * double-click to its node (FE157 LGraphCanvas.ts L3005, L3021; FE1395 L2722, L2740). A type's own output handler is
 * left to act alone. ComfyUI's input handler acts first: on a widget input it adds a Primitive, which takes the link's
 * place, so the double-click goes nowhere (FE157 extensions/core/widgetInputs.ts L625-661).
 */
export function navigateOnDoubleClick(nodeType: typeof LGraphNode): void {
    const { onInputDblClick, onOutputDblClick } = nodeType.prototype;
    nodeType.prototype.onInputDblClick = function (this: Node, slot, e) {
        const link = this.getInputLink(slot);
        onInputDblClick?.call(this, slot, e);
        if (!link || this.getInputLink(slot)?.id !== link.id || !navigating()) return;
        const source = sourceOf(app.canvas.graph!, link);
        if (source) jump(source, this);
    };
    if (onOutputDblClick) return;
    nodeType.prototype.onOutputDblClick = function (this: Node, slot) {
        if (!navigating()) return;
        const nodes = targetsOf(app.canvas.graph!, this.outputs[slot].links);
        const way = `out ${slot}`;
        if (nodes.length) step(this, way, nodes, again(way) && stepped.from === this);
    };
}

// =============================================================================
// Going to this client's run
// =============================================================================

/** Follow pans at most this often, a pan, zoom or drag of the user's pauses it for this long, and one going on pauses it again at most this often, in ms. */
const FOLLOW_MS = 1500;
const PAUSE_MS = 10_000;
const REPAUSE_MS = 1000;

/** The node NextError went to last. */
let lastError: Node | undefined;

/** NextError: to the node with an error after the one it went to last, or else the first, with a red pulse. What to say if there is none. */
export function nextError(): string | undefined {
    const nodes = errorNodes();
    if (!nodes.length) return 'No errors';
    const at = (nodes.indexOf(lastError!) + 1) % nodes.length;
    const node = (lastError = nodes[at]);
    jump(node, selected(), nodes.length > 1 ? `${at + 1}/${nodes.length} · ${node.title}` : undefined, RED);
}

/** GoToRunning: to the node this client's run is running, or the one holding the subgraph it runs in; once the run is over, to the next error. What to say, if anything. */
export function goToRunning(): string | undefined {
    if (!env.running) return errorNodes().length ? nextError() : 'Nothing is running';
    const id = running();
    if (!id) return 'Nothing is running';
    const shown = shownAs(id);
    if (!shown) return 'Running in another graph';
    const [node, inside] = shown;
    jump(node, selected());
    return inside ? `Running inside ${node.title}` : undefined;
}

/** When Follow last panned, and until when the user's pans pause it, on performance.now(); and the canvas whose pans those are. */
let followed = -Infinity;
let pausedUntil = 0;
let watched: Canvas | undefined;

/** Navigate.Follow: pans to the node standing for the run's node `id`, keeping the zoom, if it is off screen, at most once every FOLLOW_MS. */
function follow(id: string): void {
    const now = performance.now();
    if (!L.navigateFollow || now < pausedUntil || now - followed < FOLLOW_MS) return;
    const node = shownAs(id)?.[0];
    if (!node || overlaps(node.boundingRect, app.canvas.visible_area, 0)) return;
    followed = now;
    pan(node, false);
}

function resume(): void {
    pausedUntil = 0;
    followed = -Infinity;
    const id = running();
    if (id) follow(id);
}

/**
 * A pan, zoom or drag of the user's while following pauses it for PAUSE_MS, with a chip that resumes it. One that goes
 * on pauses it again, at most once every REPAUSE_MS, with the chip again, so that the chip shows as long as the pause.
 */
function interrupted(event: MouseEvent): void {
    if (!L.navigateFollow || !env.running || (event.type === 'pointermove' && !event.buttons)) return;
    const now = performance.now();
    if (now < pausedUntil - PAUSE_MS + REPAUSE_MS) return;
    pausedUntil = now + PAUSE_MS;
    chip('Following paused', ['Resume', resume], PAUSE_MS);
}

/** The link extension's setup() calls this: follows each node this client's run starts, and hears the user's pans on the canvas and over the Vue nodes. */
export function installFollow(): void {
    if (watched === app.canvas) return;
    if (!watched) {
        // Sent as each node starts, to the client that queued the run alone.
        api.addEventListener('executing', ({ detail }) => {
            if (detail != null && env.running) follow(String(detail));
        });
        // Nodes 2.0's nodes are DOM elements over the canvas, whose drags and wheels it does not always pass on to it.
        for (const type of ['wheel', 'pointermove']) {
            document.addEventListener(type, (event) => {
                if (env.running && (event.target as Element).closest?.(PANE)) interrupted(event as MouseEvent);
            }, { capture: true, passive: true });
        }
    }
    watched = app.canvas;
    app.canvas.canvas.addEventListener('wheel', interrupted, { passive: true });
    app.canvas.canvas.addEventListener('pointermove', interrupted, { passive: true });
}
