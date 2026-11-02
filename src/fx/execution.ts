/**
 * This client's runs, as the execution events ComfyUI sends only to the client
 * that queued a run tell them (execution.py, comfy_execution/progress.py): it
 * starts, its nodes run, each as far as its progress says, some come from the
 * cache, and it succeeds, fails or is interrupted. The 'status' event, which
 * every client hears of every queue, plays no part, so another user's run
 * leaves the effects here be. env.running holds from the run's start to its
 * end, or until the socket reconnects, after which that may never come.
 *
 * In the graph shown a node stands for each that runs: the node itself, or the
 * one holding the subgraph it runs in. The link pass draws the data river into
 * the nodes running and the trail into those that ran (drawFlows), whole
 * whatever selection focus dims or hides, until the trail has faded; the nodes
 * get a progress ring while they run and a red outline where the run failed,
 * until the next run or an edit of that node, and with Completion.PerNode a
 * burst as each finishes (fx/bursts.ts pop()). A run that succeeds plays its
 * completion effect at its anchors: a path trace runs a comet along the links
 * of the trail, in the order their nodes ran, in the link pass. What the run is
 * running and where it failed are there to go to (ui/menus.ts).
 *
 * @module fx/execution
 */

import type { NodeId } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { api } from '/scripts/api.js';
import { L, N } from '@/core/settings';
import { clock, during, env, guard, layers, live, overlaps, wake } from '@/core/engine';
import { accent, lighter } from '@/core/colors';
import { COMPLETION, STYLES, drawPops, endBursts, play, pop, surprise, tracing, type Anchor, type Style } from '@/fx/bursts';
import { disc, startSprites, stopSprites } from '@/fx/particles';
import type { Segment } from '@/links/pipeline';

type Canvas = typeof app.canvas;
type Graph = NonNullable<Canvas['graph']>;
type Node = InstanceType<typeof LGraphNode>;

/** The guard's key, and what its toast calls the run's visuals when it turns them off. */
const RUNS = 'Run visuals';

/**
 * The river: how long a node runs before it shows, and how long it takes to come and to go once the node stops, in s;
 * how much wider than Thickness it is, and how far apart its sparks are, in px; and how fast they flow, in px/s: along
 * a 320 px link in 0.8 s, and a frame at 20 fps moves them a third of the way to the next, so that on no link do they
 * seem to stand still or run back.
 */
const RIVER_DELAY = 0.15;
const RIVER_IN = 0.15;
const RIVER_OUT = 0.6;
const RIVER_WIDTH = 1.4;
const SPACING = 60;
const RIVER_SPEED = 400;
/** The trail's alpha, and how much wider than Thickness it is. */
const TRAIL = 0.35;
const TRAIL_WIDTH = 3;
/**
 * The ring and the error outline: how wide, and how far outside the node's shape, in px, clear of ComfyUI's own running
 * and error outlines, 6 px out and up to 3 px wide (FE157 services/litegraphService.ts L264-281); how much of its way
 * round the ring's comet covers, and how many times a second it goes round.
 */
const RING_WIDTH = 3;
const RING_OUT = 9;
const COMET = 0.2;
const COMET_HZ = 0.5;
/** The error outline's pulses, how many a second and how many, and its shake: how far and how long. */
const PULSE_HZ = 1;
const PULSES = 3;
const SHAKE_PX = 3;
const SHAKE_S = 0.3;
export const RED = '#ff3b30';
/** Completion: the most anchors; a run that starts this soon after a show ends it, and shows start at least this far apart, in ms. */
const ANCHORS = 3;
const BATCH_MS = 1500;
const SHOWS_MS = 3000;
/** RenderShape.BOX and CIRCLE (litegraph types/globalEnums.ts); any other shape is round. */
const [BOX, CIRCLE] = [1, 3];

/**
 * The path trace's comet: the least of the show its run along a link takes, and how much of a run after it its tail
 * takes to go into the node and fade; and in px on screen, the length of its tail, the discs it is drawn with, and how
 * wide its head is.
 */
const LEG = 0.25;
const FADE = 0.5;
const TAIL = 120;
const TAIL_DISCS = 16;
const HEAD = 6;

/** Where a node keeps its Completion FX, which the node menu sets: 'primary' to anchor the completion effect, 'exclude' to keep it off it. */
export const OWN_COMPLETION = 'enhanced_fx_completion';

/** A node of the run: when it started and stopped running on clock.runTime, its end Infinity while it runs; its progress, NaN while it reports none; and whether it failed. */
export interface Step {
    start: number;
    end: number;
    progress: number;
    failed: boolean;
}

/** This client's last run: its prompt, the workflow it ran in, and when it ended on clock.runTime, Infinity while it runs. */
const run = { prompt: '', workflow: undefined as unknown, end: -Infinity };
/** Its nodes that ran, by execution id, in the order they started; those it took from the cache; and the theme accent as it started. */
const steps = new Map<string, Step>();
const cached = new Set<string>();
let tint = '';
/** What a failed node held as it failed, by execution id: its mode, widget values and input links, which an edit changes. */
const held = new Map<string, string>();
/** Counts the changes to steps, which the graph shown takes up. */
let changes = 0;

/** Whether the node extension set up, which draws the rings and plays the completion effects, and whether the events are listened to. */
let celebrating = false;
let listening = false;

/** A node of the graph shown and the step it shows: its own, or for a node holding a subgraph, those of the nodes in it merged. */
interface Shown {
    node: Node;
    step: Step;
}
const shown: Shown[] = [];
/** shown by node id, for the links into those nodes. */
const into = new Map<number, Shown>();
/** The steps of the nodes shown that links lead into, numbered in the order they ran, which the path trace takes; and how many. */
const rank = new Map<Step, number>();
let ranks = 0;
/** What shown was taken from: the graph, its version and the changes to steps. */
const taken = { graph: undefined as Graph | null | undefined, version: -1, changes: -1 };

/** The nodes an execution id names, from the root graph's on down through the subgraphs that hold the one it runs (FE157 utils/graphTraversalUtil.ts getNodeByExecutionId). */
function path(id: string): Node[] {
    const nodes: Node[] = [];
    let graph: Graph | undefined = app.rootGraph;
    for (const part of id.split(':')) {
        const node: Node | null | undefined = graph?.getNodeById(part as NodeId);
        if (!node) return [];
        nodes.push(node);
        graph = (node as { subgraph?: Graph }).subgraph;
    }
    return nodes;
}

/** The node of `graph` that stands for the node an execution id runs: that node, or the one holding the subgraph it runs in. */
const standIn = (graph: Graph, id: string) => path(id).find((node) => node.graph === graph);

/** Whether the workflow shown is the one the run ran in: another may have nodes of the same ids. */
const here = () => app.extensionManager.workflow.activeWorkflow === run.workflow;

/** Takes up in shown what changed in the run, or that another graph shows: a look at a few values while nothing did. */
export function syncRuns(canvas: Canvas): void {
    const { graph } = canvas;
    if (graph === taken.graph && graph?._version === taken.version && changes === taken.changes) return;
    Object.assign(taken, { graph, version: graph?._version ?? -1, changes });
    shown.length = ranks = 0;
    into.clear();
    rank.clear();
    if (!graph || !steps.size || !here()) return;
    for (const [id, step] of steps) {
        const node = standIn(graph, id);
        if (!node) continue;
        const seen = into.get(Number(node.id));
        if (!seen) {
            const entry = { node, step };
            shown.push(entry);
            into.set(Number(node.id), entry);
            continue;
        }
        // A node holding a subgraph shows what runs in it: from the first start to the last end, the progress of the one running, failed if one failed.
        const { start, end, progress, failed } = seen.step;
        seen.step = { start: Math.min(start, step.start), end: Math.max(end, step.end), progress: step.end === Infinity ? step.progress : progress, failed: failed || step.failed };
    }
    for (const { node, step } of shown) if (node.inputs.some((input) => input.link != null)) rank.set(step, ranks++);
}

/** The step of the node a link of the graph shown leads into, if the run reached it. */
export const stepInto = (link: { target_id: unknown }): Step | undefined => into.get(Number(link.target_id))?.step;

/** The step a node of the graph shown shows, if the run reached it. */
export const stepOf = (node: Node): Step | undefined => into.get(Number(node.id))?.step;

/** Whether the run's visuals are on links of the graph shown: from the first node's start until the trail, or else the last river, is gone, and while a path trace plays. */
export const flowsShown = (): boolean =>
    shown.length > 0 && !guard.off(RUNS) && (tracing() >= 0 || ((L.flowRiver || L.flowTrail) && clock.runTime < run.end + (L.flowTrail ? L.flowTrailFade : RIVER_OUT)));

/** Whether the link pass draws the run's visuals on a canvas's links now; the link part's setup() puts its own in place. */
export const linkPass: { drawsRuns: (canvas: Canvas) => boolean } = { drawsRuns: () => false };

/** The river's alpha into a node with `step` at `t`: in once the node has run RIVER_DELAY, out once it stops; while nothing moves between events, whole while it runs. */
function riverAlpha(step: Step, t: number, still: boolean): number {
    if (still) return step.end === Infinity ? 1 : 0;
    return Math.max(0, Math.min(1, (Math.min(t, step.end) - step.start - RIVER_DELAY) / RIVER_IN, 1 - (t - step.end) / RIVER_OUT));
}

/** How much of the trail into a node with `step` is left at `t`: all of it once the node stopped, through the run, then less and less over Flow.Trail.Fade. */
const trailLeft = (step: Step, t: number) => (step.end > t ? 0 : Math.max(0, Math.min(1, 1 - (t - run.end) / L.flowTrailFade)));

/** The point and direction a segment's path writes. */
const point = new Float64Array(4);

/**
 * The path trace's comet on segment `s`, `p` of the way through the show, where `unit` is a px on screen: each link's
 * run takes a stretch of the show, the stretches one after another in the order the nodes they lead into ran, as many
 * as overlap at LEG of the show each. Its head, white in a glow of the accent, crosses the link in its run and leads a
 * fading tail, which goes on into the node and fades as the next run starts. Whether it is on the link.
 */
function comet(ctx: CanvasRenderingContext2D, s: Segment, order: number, p: number, unit: number): boolean {
    const leg = Math.max(1 / (ranks + FADE), LEG);
    const f = (p - (ranks > 1 ? (order * (1 - leg * (1 + FADE))) / (ranks - 1) : 0)) / leg;
    if (f <= 0 || f >= 1 + FADE) return false;
    const tail = TAIL * unit;
    const head = f * s.chain;
    const fade = Math.min(1, (1 + FADE - f) / FADE);
    for (let i = TAIL_DISCS - 1; i >= 0; i--) {
        const d = head - (i / TAIL_DISCS) * tail;
        if (d < s.u0 || d >= s.u0 + s.len) continue;
        // px along the path Link.Style lays, which a wave makes longer.
        s.path.find(((d - s.u0) / s.len) * s.path.length, point);
        const left = 1 - i / TAIL_DISCS;
        disc(ctx, point[0], point[1], HEAD * unit * (0.4 + 0.6 * left), tint, left * fade, true);
        if (i) continue;
        disc(ctx, point[0], point[1], 2 * HEAD * unit, tint, 0.4, true);
        disc(ctx, point[0], point[1], 0.75 * HEAD * unit, '#ffffff', 1, false);
    }
    return true;
}

/**
 * Draws the run's visuals on `segments`, those with a step: the trail into a node that ran, a wider red link into one
 * that failed, and the river into one running, a wider link in its colour lightened, with sparks flowing toward the
 * node; then the path trace's comet over them. Pause.Mode's Freeze holds the river still, as reduced motion holds its
 * sparks. How many move.
 */
export function drawFlows(ctx: CanvasRenderingContext2D, segments: readonly Segment[]): number {
    const t = clock.runTime;
    const still = during(L.pauseDuringRender) === 'pause';
    const flowing = !still && !env.reducedMotion;
    let moving = 0;
    ctx.lineCap = 'round';
    startSprites(ctx);
    try {
        for (const s of segments) {
            const step = s.flow;
            if (!step || s.empty) continue;
            const left = L.flowTrail ? trailLeft(step, t) : 0;
            if (left > 0) {
                ctx.globalAlpha = step.failed ? left : left * TRAIL;
                ctx.strokeStyle = step.failed ? RED : tint;
                ctx.lineWidth = L.thickness * (step.failed ? RIVER_WIDTH : TRAIL_WIDTH);
                ctx.beginPath();
                s.path.trace(ctx);
                ctx.stroke();
                // It fades once the run is over.
                if (run.end !== Infinity) moving++;
            }
            if (!L.flowRiver || step.failed) continue;
            const alpha = riverAlpha(step, t, still);
            // It moves while its sparks flow, and as it comes and goes.
            if (!still && t < step.end + RIVER_OUT && (flowing || alpha < 1)) moving++;
            if (alpha <= 0) continue;
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = lighter(s.colour);
            ctx.lineWidth = L.thickness * RIVER_WIDTH;
            ctx.beginPath();
            s.path.trace(ctx);
            ctx.stroke();
            // SPACING px apart along the whole link, so they flow on across its reroutes.
            const shift = flowing ? (t * RIVER_SPEED) % SPACING : 0;
            for (let d = s.u0 + ((((shift - s.u0) % SPACING) + SPACING) % SPACING); d < s.u0 + s.len; d += SPACING) {
                s.path.at((d - s.u0) / s.len, point);
                disc(ctx, point[0], point[1], L.thickness, '#ffffff', 1, true);
            }
        }
        const p = tracing();
        if (p >= 0) {
            ctx.globalAlpha = 1;
            const unit = 1 / app.canvas.ds.scale;
            for (const s of segments) {
                const order = s.flow && rank.get(s.flow);
                if (order !== undefined && !s.empty && comet(ctx, s, order, p, unit)) moving++;
            }
        }
    } catch (error) {
        guard.fail(RUNS, error);
    } finally {
        stopSprites();
    }
    return moving;
}

/** The length of the outline trace() added last, and how far along it, from where it starts, 12 o'clock is. */
const round = { length: 0, top: 0 };
const dash = [0, 0];

/** Adds the outline `out` px outside a node's shape, title bar included, to a new path: round, a box or a circle, and a pill for a collapsed node. */
export function trace(ctx: CanvasRenderingContext2D, node: Node, out: number): void {
    const box = node.boundingRect;
    const shape: number = node.renderingShape;
    ctx.beginPath();
    if (shape === CIRCLE && !node.flags.collapsed) {
        const r = node.size[0] / 2 + out;
        ctx.arc(node.pos[0] + node.size[0] / 2, node.pos[1] + node.size[1] / 2, r, -Math.PI / 2, 1.5 * Math.PI);
        round.length = 2 * Math.PI * r;
        round.top = 0;
        return;
    }
    const w = box[2] + 2 * out;
    const h = box[3] + 2 * out;
    const r = node.flags.collapsed ? h / 2 : shape === BOX ? 0 : LiteGraph.ROUND_RADIUS + out;
    ctx.roundRect(box[0] - out, box[1] - out, w, h, r);
    round.length = 2 * (w + h) - 8 * r + 2 * Math.PI * r;
    round.top = w / 2 - r;
}

/** Strokes the stretch of the outline trace() added that starts `from` px clockwise of 12 o'clock and is `length` px long. */
function stretch(ctx: CanvasRenderingContext2D, from: number, length: number): void {
    dash[0] = length;
    dash[1] = round.length - length;
    ctx.setLineDash(dash);
    ctx.lineDashOffset = round.length - round.top - from;
    ctx.stroke();
}

/**
 * A running node's ring, in the accent, filling clockwise from 12 o'clock as its progress says, or else a comet going
 * round; `still` holds the comet as a whole ring. Whether it moves.
 */
function ring(ctx: CanvasRenderingContext2D, node: Node, step: Step, t: number, still: boolean): boolean {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = tint;
    ctx.lineWidth = RING_WIDTH;
    trace(ctx, node, RING_OUT + RING_WIDTH / 2);
    if (!Number.isNaN(step.progress)) {
        stretch(ctx, 0, step.progress * round.length);
        return false;
    }
    if (still) {
        ctx.globalAlpha = 0.6;
        ctx.stroke();
        return false;
    }
    // Its head brightest, its tail fading behind it.
    const piece = (COMET * round.length) / 4;
    const head = ((t * COMET_HZ) % 1) * round.length;
    for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = (i + 1) / 4;
        stretch(ctx, head - (4 - i) * piece, piece);
    }
    return true;
}

/** A failed node's red outline: it pulses PULSES times, then holds; it shakes once as it comes. Reduced motion holds it still. Whether it moves. */
function failure(ctx: CanvasRenderingContext2D, node: Node, step: Step, t: number): boolean {
    const age = t - step.end;
    const steady = env.reducedMotion || age >= PULSES / PULSE_HZ;
    ctx.globalAlpha = steady ? 1 : 0.6 + 0.4 * Math.cos(2 * Math.PI * PULSE_HZ * age);
    if (!env.reducedMotion && age < SHAKE_S) ctx.translate(SHAKE_PX * Math.sin((age / SHAKE_S) * 6 * Math.PI) * (1 - age / SHAKE_S), 0);
    ctx.strokeStyle = RED;
    ctx.lineWidth = RING_WIDTH;
    trace(ctx, node, RING_OUT + RING_WIDTH / 2);
    ctx.stroke();
    return !steady;
}

/** Over the nodes on screen, with node effects on: each running node's ring and each failed node's outline, as Run.Ring and Run.Error say, and the bursts as nodes finish. */
function drawSteps(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    syncRuns(canvas);
    live.rings = 0;
    if (!N.enabled || !shown.length || guard.off(RUNS)) return;
    const t = clock.runTime;
    const still = env.reducedMotion || during(N.pauseDuringRender) === 'pause';
    const area = canvas.visible_area;
    for (const { node, step } of shown) {
        if (!overlaps(node.boundingRect, area, RING_OUT + RING_WIDTH)) continue;
        ctx.save();
        try {
            const moves = step.end === Infinity ? N.runRing && ring(ctx, node, step, t, still) : step.failed && N.runError && failure(ctx, node, step, t);
            if (moves) live.rings++;
        } catch (error) {
            guard.fail(RUNS, error);
        } finally {
            ctx.restore();
        }
    }
    try {
        live.rings += drawPops(canvas, ctx);
    } catch (error) {
        guard.fail(RUNS, error);
    }
    if (live.rings) wake();
}

/** When the last show started, on performance.now(). */
let celebrated = -Infinity;

/**
 * Where the completion effect plays as Completion.Anchor says: over the primary nodes and the output nodes the run reached,
 * the primary ones first, else, for Primary nodes, over those alone; the ANCHORS of them nearest the middle of the view,
 * with a smaller show there for those off screen, or for outputs in another graph when none of them shows; or there,
 * for Center of screen. An output node in a subgraph anchors at the node holding it. Excluded nodes never.
 */
function anchors(canvas: Canvas, graph: Graph): Anchor[] {
    const area = canvas.visible_area;
    const [x, y] = [area[0] + area[2] / 2, area[1] + area[3] / 2];
    const middle: Anchor = { id: 'view', pos: [x, y], graph };
    if (N.completionAnchor === 'viewport') return [middle];
    if (!here()) return [];
    const choice = (node: Node) => node.properties[OWN_COMPLETION];
    // The output nodes the run reached, as the nodes of the graph shown that stand for them, and whether one has none.
    const reached = new Set<Node>();
    let elsewhere = false;
    for (const id of [...steps.keys(), ...cached]) {
        const nodes = path(id);
        const node = nodes.at(-1);
        if (!node || choice(node) === 'exclude' || !(node.constructor as typeof LGraphNode).nodeData?.output_node) continue;
        const stand = nodes.find((n) => n.graph === graph);
        if (stand) reached.add(stand);
        else elsewhere = true;
    }
    const distance = ({ boundingRect: box }: Node) => Math.hypot(box[0] + box[2] / 2 - x, box[1] + box[3] / 2 - y);
    const near = (a: Node, b: Node) => distance(a) - distance(b);
    const primary = graph.nodes.filter((node) => choice(node) === 'primary').sort(near);
    const outputs = [...reached].filter((node) => choice(node) !== 'primary' && choice(node) !== 'exclude').sort(near);
    const list = (N.completionAnchor === 'primary' && primary.length ? primary : [...primary, ...outputs]).slice(0, ANCHORS);
    const shows: Anchor[] = list.filter((node) => overlaps(node.boundingRect, area, 0));
    if (shows.length < list.length || (elsewhere && !list.length)) shows.push({ ...middle, small: true });
    return shows;
}

/**
 * Plays Completion.Style over `shows` for run `prompt`, or Surprise's pick. A path trace needs links into nodes of the
 * run shown, which the link pass draws the run's visuals on; else it is a shockwave.
 */
export function complete(shows: Anchor[], prompt: string): void {
    const { canvas } = app;
    syncRuns(canvas);
    const styles: readonly Style[] = ranks && !guard.off(RUNS) && linkPass.drawsRuns(canvas) ? STYLES : STYLES.filter((style) => style !== 'trace');
    const chosen = N.completionStyle === 'random' ? surprise(prompt, styles) : (N.completionStyle as Style);
    const style = styles.includes(chosen) ? chosen : 'shockwave';
    // The background pass records the links the trace runs along.
    if (style === 'trace') canvas.setDirty(true, true);
    play(style, shows, prompt);
}

/** A run that succeeded plays its completion effect at its anchors, with End Animation on, unless a show started less than SHOWS_MS before. */
function celebrate(prompt: string): void {
    const { canvas } = app;
    const now = performance.now();
    if (!celebrating || !N.enabled || !N.endAnimationEnabled || guard.off(COMPLETION) || !canvas.graph || now - celebrated < SHOWS_MS) return;
    const shows = anchors(canvas, canvas.graph);
    if (!shows.length) return;
    celebrated = now;
    complete(shows, prompt);
}

/** A burst as node `id` of the run finishes, with Completion.PerNode on: from a node of the graph shown, unless a Freeze holds the node effects. */
function burst(id: string): void {
    const { canvas } = app;
    const node = path(id).at(-1);
    if (!celebrating || !N.enabled || !N.completionPerNode || guard.off(RUNS) || !node || node.graph !== canvas.graph || !here() || during(N.pauseDuringRender) === 'pause') return;
    pop(canvas, node, run.prompt);
}

/** The execution id of the node running that started last. */
export function running(): string | undefined {
    let id: string | undefined;
    for (const [key, step] of steps) if (step.end === Infinity) id = key;
    return id;
}

/** The node of the graph shown that stands for the node `id` of this client's run, and whether it holds the subgraph that one runs in; none in another workflow. */
export function shownAs(id: string): [node: Node, inside: boolean] | undefined {
    const { graph } = app.canvas;
    if (!graph || !here()) return undefined;
    const nodes = path(id);
    const node = nodes.find((n) => n.graph === graph);
    return node && [node, node !== nodes.at(-1)];
}

/**
 * The nodes of the graph shown that stand for those with an error from this client's last run: 1.57.1 keeps them on
 * the workspace store, the prompt's own errors too (FE157 stores/workspaceStore.ts L166-168); elsewhere they are those
 * that failed as this page heard.
 */
export function errorNodes(): Node[] {
    const { canvas, extensionManager: manager } = app;
    const ids = 'lastNodeErrors' in manager
        ? [...Object.keys(manager.lastNodeErrors ?? {}), ...(manager.lastExecutionError?.node_id != null ? [String(manager.lastExecutionError.node_id)] : [])]
        : [...steps].flatMap(([id, step]) => (step.failed ? [id] : []));
    const graph = canvas.graph;
    return graph && here() ? [...new Set(ids.flatMap((id) => standIn(graph, id) ?? []))] : [];
}

/** Counts a change to the run, which asks for a paint, of the background too where a node started or stopped. */
function changed(moved: boolean): void {
    changes++;
    app.canvas.setDirty(true, moved);
}

/** Ends the run: the nodes still running stop. */
function finish(): void {
    for (const step of steps.values()) if (step.end === Infinity) step.end = clock.runTime;
    run.end = clock.runTime;
    env.running = false;
    changed(true);
}

/** What an edit of a node changes. */
const signature = (node: Node) => JSON.stringify([node.mode, node.widgets?.map((widget) => widget.value), node.inputs.map((_, i) => node.getInputLink(i)?.id)]);

/** Each extension's setup() calls this with its part; the first listens to this client's runs, and the node part draws their rings and outlines and plays their completion effects. */
export function installRuns(part: 'links' | 'nodes'): void {
    if (part === 'nodes') {
        layers.runs = drawSteps;
        celebrating = true;
    }
    if (listening) return;
    listening = true;
    /** Whether an event is of this client's run while it is active; execution_interrupted goes to every client. */
    const ours = (detail: { prompt_id: string }) => env.running && detail.prompt_id === run.prompt;

    api.addEventListener('execution_start', ({ detail }) => {
        // A batch: the show of the run before ends as this one starts.
        if (performance.now() - celebrated < BATCH_MS) endBursts();
        Object.assign(run, { prompt: detail.prompt_id, workflow: app.extensionManager.workflow.activeWorkflow, end: Infinity });
        steps.clear();
        cached.clear();
        held.clear();
        tint = accent();
        env.running = true;
        changed(true);
    });
    api.addEventListener('execution_cached', ({ detail }) => {
        if (ours(detail)) for (const id of detail.nodes) cached.add(String(id));
    });
    // Sent as each node starts, reports progress and finishes, with every node of the run that is not still to come.
    api.addEventListener('progress_state', ({ detail }) => {
        if (!ours(detail)) return;
        let moved = false;
        for (const { state, value, max, node_id, display_node_id } of Object.values(detail.nodes)) {
            const id = String(display_node_id ?? node_id);
            let step = steps.get(id);
            if (state === 'running') {
                if (!step) {
                    steps.set(id, (step = { start: clock.runTime, end: Infinity, progress: NaN, failed: false }));
                    moved = true;
                } else if (step.end !== Infinity) {
                    // Run again, as the nodes a loop expands into are, under one display id.
                    step.end = Infinity;
                    moved = true;
                }
                // A node starts at 0 of 1, which it keeps unless it reports its progress.
                step.progress = max > 1 || value > 0 ? value / max : NaN;
            } else if (state === 'finished' && step?.end === Infinity) {
                step.end = clock.runTime;
                moved = true;
                burst(id);
            }
        }
        changed(moved);
    });
    api.addEventListener('execution_success', ({ detail }) => {
        if (!ours(detail)) return;
        finish();
        celebrate(detail.prompt_id);
    });
    api.addEventListener('execution_error', ({ detail }) => {
        if (!ours(detail)) return;
        const id = detail.node_id == null ? undefined : String(detail.node_id);
        if (id !== undefined) {
            const step = steps.get(id) ?? { start: clock.runTime, end: Infinity, progress: NaN, failed: false };
            step.failed = true;
            steps.set(id, step);
        }
        finish();
        // Once the run is over: JSON cannot take every widget's value.
        const node = id === undefined ? undefined : path(id).at(-1);
        if (node) held.set(id!, signature(node));
    });
    api.addEventListener('execution_interrupted', ({ detail }) => {
        if (ours(detail)) finish();
    });
    // A run whose end never came, as the server restarted or the socket dropped as it ended, is over once the socket is
    // back (FE157 scripts/api.ts L944, FE1395 L564), without a completion effect.
    api.addEventListener('reconnected', () => {
        if (env.running) finish();
    });
    // The change tracker's, after each change to the workflow: an edit of a failed node ends its outline.
    api.addEventListener('graphChanged', () => {
        let edited = false;
        for (const [id, before] of held) {
            const node = path(id).at(-1);
            if (node && signature(node) === before) continue;
            held.delete(id);
            const step = steps.get(id);
            if (step) step.failed = false;
            edited = true;
        }
        if (edited) changed(true);
    });
}

