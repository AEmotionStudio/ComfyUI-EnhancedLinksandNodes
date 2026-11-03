/**
 * Jelly, node effect 6: the node itself wobbles like gel, then settles and is
 * drawn as native draws it. Each jelly node has a spring while it moves: it
 * leans against the way it is dragged and sways back as it is let go, and it
 * squashes, keeping its area, as it is dropped, selected and finished by this
 * client's run. The node's drawing takes its shape about the middle of its box
 * (extensions/node-animations.ts), and so do the ends of its links while the
 * link pass draws them (links/pipeline.ts). In Nodes 2.0, where the DOM draws
 * the nodes, each of those kicks bounces the node instead (nodes/vue.ts). It
 * keeps still in Static mode, with reduced motion, while Perf.Adaptive holds the
 * effects, zoomed out below Perf.MinZoom, and through a run that freezes the
 * node effects; Spotlight leaves it be, as it only answers what you and the run do.
 *
 * @module nodes/jelly
 */

import { N } from '@/core/settings';
import { HELD, adaptive, during, env, zoomedOut } from '@/core/engine';
import { stepOf, syncRuns } from '@/fx/execution';

type Node = InstanceType<typeof LGraphNode>;
type Canvas = InstanceType<typeof LGraphCanvas>;

export const JELLY = 6;

/** The spring: about three wobbles a second, settling in about one. */
const OMEGA = 2 * Math.PI * 3;
const DAMPING = 0.25;
/** The most it squashes, as a share of its height, and leans, in its width a unit of height; how far a speed of a graph unit a second leans it. */
const SQUASH = 0.06;
const LEAN = 0.1;
const LEAN_PER_SPEED = 0.0004;
/** How hard a drop, a selection and the end of its run kick its squash, a second; and how long it keeps still before it counts as dropped, in ms. */
const DROP = -0.6;
const SELECT = 0.5;
const FINISH = 0.8;
const DROP_MS = 120;
/** Below this its spring is at rest. */
const REST = 1e-3;

interface Wobble {
    squash: number;
    squashSpeed: number;
    lean: number;
    leanSpeed: number;
    /** Where it was, how fast it went across, smoothed, and when it last moved; whether it moves since it was still, is selected and runs. */
    x: number;
    y: number;
    across: number;
    movedAt: number;
    moving: boolean;
    selected: boolean;
    running: boolean;
    /** Whether something kicked it since Nodes 2.0 last bounced it. */
    kicked: boolean;
}

const springs = new WeakMap<Node, Wobble>();

/** The pass that shakes the nodes: when it is, how long since the last, and whether the springs keep still. */
const shaking = { now: 0, dt: 0, still: false, vue: false };

/** How many nodes the last pass found wobbling. */
export let wobbling = 0;

/** Starts a front pass's shaking of the jelly nodes of `canvas`, with the run's steps as they are now. */
export function startShaking(canvas: Canvas): void {
    syncRuns(canvas);
    const now = performance.now();
    shaking.dt = Math.min(0.05, (now - shaking.now) / 1000);
    shaking.now = now;
    shaking.still = N.staticMode || env.reducedMotion || adaptive.level >= HELD || during(N.pauseDuringRender) === 'pause' || zoomedOut(canvas);
    shaking.vue = LiteGraph.vueNodesMode;
    wobbling = 0;
}

/** Moves the spring of a jelly node on by the pass, as what it did since the last kicks it: whether it wobbles. Nodes 2.0's are kicked alone. */
export function shake(node: Node): boolean {
    const { now, dt, still, vue } = shaking;
    const [x, y] = node.pos;
    const selected = Boolean(node.selected);
    const running = stepOf(node)?.end === Infinity;
    let w = springs.get(node);
    if (!w) {
        springs.set(node, { squash: 0, squashSpeed: 0, lean: 0, leanSpeed: 0, x, y, across: 0, movedAt: 0, moving: false, selected, running, kicked: false });
        return false;
    }
    let kick = 0;
    if (x !== w.x || y !== w.y) {
        w.across += ((dt ? (x - w.x) / dt : 0) - w.across) * Math.min(1, dt * 12);
        w.movedAt = now;
        w.moving = true;
    } else {
        w.across -= w.across * Math.min(1, dt * 12);
        if (w.moving && now - w.movedAt > DROP_MS) {
            w.moving = false;
            kick += DROP;
        }
    }
    if (selected && !w.selected) kick += SELECT;
    if (w.running && !running) kick += FINISH;
    Object.assign(w, { x, y, selected, running });
    if (still) {
        Object.assign(w, { squash: 0, squashSpeed: 0, lean: 0, leanSpeed: 0, across: 0, kicked: false });
        return false;
    }
    if (kick) w.kicked = true;
    if (vue) return false;
    w.squashSpeed += kick + (-OMEGA * OMEGA * w.squash - 2 * DAMPING * OMEGA * w.squashSpeed) * dt;
    w.squash = Math.max(-SQUASH, Math.min(SQUASH, w.squash + w.squashSpeed * dt));
    const lean = Math.max(-LEAN, Math.min(LEAN, -w.across * LEAN_PER_SPEED));
    w.leanSpeed += (OMEGA * OMEGA * (lean - w.lean) - 2 * DAMPING * OMEGA * w.leanSpeed) * dt;
    w.lean = Math.max(-LEAN, Math.min(LEAN, w.lean + w.leanSpeed * dt));
    if (!w.moving && Math.max(Math.abs(w.squash), Math.abs(w.squashSpeed), Math.abs(w.lean), Math.abs(w.leanSpeed)) < REST) {
        Object.assign(w, { squash: 0, squashSpeed: 0, lean: 0, leanSpeed: 0 });
        return false;
    }
    wobbling++;
    return true;
}

/** Whether something kicked a jelly node since this was last asked, which Nodes 2.0 bounces it for. */
export function kicked(node: Node): boolean {
    const w = springs.get(node);
    if (!w?.kicked) return false;
    w.kicked = false;
    return true;
}

/** The middle of a node's box, title bar included, in its own space. */
const middle = (node: Node) => [node.size[0] / 2, (node.size[1] - LiteGraph.NODE_TITLE_HEIGHT) / 2];

/** Whether a node is out of its shape at rest. */
export function wobbles(node: Node): boolean {
    const w = springs.get(node);
    return Boolean(w && (w.squash || w.lean));
}

/** Gives `ctx`, in a node's own space, the node's shape now. False while it is at rest. */
export function shapeNode(ctx: CanvasRenderingContext2D, node: Node): boolean {
    const w = springs.get(node);
    if (!w || (!w.squash && !w.lean)) return false;
    const [cx, cy] = middle(node);
    const tall = 1 + w.squash;
    ctx.translate(cx, cy);
    ctx.transform(1 / tall, 0, -w.lean, tall, 0, 0);
    ctx.translate(-cx, -cy);
    return true;
}

/** Writes where a node's shape now puts its point `p`, in graph space, into `out`. False while it is at rest. */
export function moved(node: Node, p: Readonly<ArrayLike<number>>, out: Float64Array): boolean {
    const w = springs.get(node);
    if (!w || (!w.squash && !w.lean)) return false;
    const [mx, my] = middle(node);
    const [dx, dy] = [p[0] - node.pos[0] - mx, p[1] - node.pos[1] - my];
    const tall = 1 + w.squash;
    out[0] = node.pos[0] + mx + dx / tall - w.lean * dy;
    out[1] = node.pos[1] + my + dy * tall;
    return true;
}
