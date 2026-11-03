/**
 * Physics wires. While Physics.Profile is on, each link segment the link pass
 * lays hangs as a wire between its ends: a Verlet chain of 12 to 16 points,
 * pinned at both ends, its second and second-to-last points held out the way
 * native's path leaves and enters them, so it leaves and enters slots as
 * native's does, and as long as native's path times the profile's slack. Its
 * path is the curve through its points. A wire comes on screen at rest,
 * sagging. It swings once an end moves, which the ticker plays in steps of
 * 1/60 s, and sleeps once it keeps still; one held still (Static, reduced
 * motion, Perf.Adaptive's last step, Perf.StaticAbove) comes to rest at once
 * instead. Physics.Amount scales gravity and slack.
 *
 * Wires are kept by id, since 1.57.1 makes its links anew from its store, and
 * forgotten once their segment has not been laid for a while.
 *
 * @module links/physics
 */

import { L } from '@/core/settings';
import { live, wake } from '@/core/engine';
import type { LinkPath } from './geometry';

interface Profile {
    /** px/s² down. */
    gravity: number;
    /** The share of its speed a point keeps from one step to the next. */
    damping: number;
    /** The wire's length over native's path's. */
    slack: number;
    /** How many times a step pulls the points back to their spacing: more is stiffer. */
    passes: number;
    /** How far a step straightens its bends, as a share of the way: a stiffer wire bends less sharply out of a slot. */
    bend: number;
}

/** Rope hangs heavy and settles in about a second; a whip is taut and springs back; gel sags most and wobbles slowly. */
const PROFILES: Record<string, Profile> = {
    rope: { gravity: 1400, damping: 0.88, slack: 1.06, passes: 6, bend: 0.06 },
    whip: { gravity: 1200, damping: 0.95, slack: 1.02, passes: 10, bend: 0.06 },
    gel: { gravity: 300, damping: 0.93, slack: 1.12, passes: 3, bend: 0.03 },
};

const STEP = 1 / 60;
/** Steps a tick takes at most; time past them is dropped, so a wire never races to catch up. */
const SUBSTEPS = 4;
/** requestAnimationFrame times jitter, so a step this many s early still comes in its frame. */
const EARLY = 0.001;
/** Points a wire has, one more per SPAN px of native's path past the fewest. */
const FEWEST = 12;
const MOST = 16;
const SPAN = 48;
/** px an end moves from where its wire came to rest to wake it; px/s every point stays under for REST_S to sleep. */
const WAKE = 0.5;
const SLEEPY = 0.5;
const REST_S = 0.3;
/** The fastest a point moves, in px/s, so a fast drag or a long wire cannot fling it. */
const FASTEST = 3000;
/** How a wire comes to rest at once: steps at this damping until every point is under SETTLED px/s, at most SETTLE_STEPS. */
const SETTLING = 0.85;
const SETTLED = 1.5;
const SETTLE_STEPS = 240;
/**
 * Passes a wire's segment may go unlaid and the wire keep its points, as while MagnifyGlass draws the links in its lens
 * in passes of its own between the canvas's; and before the wire is forgotten.
 */
const MISSED = 2;
const PRUNE = 120;
/** Points of its path between two of a wire's. */
const BETWEEN = 4;

export class Wire {
    /** Its points now and a step before, as x, y pairs, and how many. */
    readonly p = new Float64Array(2 * MOST);
    readonly q = new Float64Array(2 * MOST);
    n = 0;
    /** How far the held points are from the ends, the length of each span between them, and the profile's. */
    reach = 0;
    span = 0;
    gravity = 0;
    damping = 0;
    passes = 0;
    bend = 0;
    /** The pass that laid it last; whether it swings, and how long its points have kept still. */
    pass = -Infinity;
    awake = false;
    still = 0;
    /** Where its pinned points were as it came to rest, then its span and gravity then. */
    readonly rested = new Float64Array(10);
}

/**
 * Each wire by the key the link pass gives its segment, the pass number, the graph shown, whether this pass holds wires
 * still, and the wires it laid.
 */
const wires = new Map<number, Wire>();
let pass = 0;
let graph: unknown;
let workflow: unknown;
let held = false;
const laid: Wire[] = [];
/** Time the ticker has given and the wires have not stepped yet. */
let due = 0;

/** Starts a link pass over `shown`'s links, which holds its wires at rest if `still`. */
export function startWires(shown: { id: unknown } | null, still: boolean): void {
    // Another graph numbers its links on its own, and so does another workflow loaded into the root graph, which brings
    // its own id (an undo keeps it): their wires start afresh.
    pass += shown === graph && shown?.id === workflow ? 1 : MISSED + 2;
    graph = shown;
    workflow = shown?.id;
    held = still;
    laid.length = 0;
}

/**
 * The wire kept under `key`, a new one if none is; none for a second segment with the key in one pass, as 1.57.1 lays
 * for a hidden link's badge.
 */
export function wireOf(key: number): Wire | undefined {
    let wire = wires.get(key);
    if (!wire) wires.set(key, (wire = new Wire()));
    return wire.pass === pass ? undefined : wire;
}

const forget = (wire: Wire, key: number) => {
    if (pass - wire.pass > PRUNE) wires.delete(key);
};

/** Counts the wires the last pass laid that swing: they keep the ticker going. */
function swinging(): number {
    let awake = 0;
    for (const wire of laid) if (wire.awake) awake++;
    return (live.wires = awake);
}

/** Ends a link pass: wakes the ticker for the wires it laid that swing, and forgets those long unlaid. */
export function endWires(): void {
    if (swinging()) wake();
    wires.forEach(forget);
}

/** The point and direction a path writes. */
const here = new Float64Array(4);

/** Puts point i of `p` at (x, y); how far that is from point j of `from`, by default where it was. */
function put(p: Float64Array, i: number, x: number, y: number, from = p, j = i): number {
    const moved = Math.sqrt((x - from[j]) ** 2 + (y - from[j + 1]) ** 2);
    p[i] = x;
    p[i + 1] = y;
    return moved;
}

/**
 * Takes the profile and Physics.Amount, sizes the wire to native's path and pins it there: its ends, and the points
 * next to them held out along the path's direction at each end. How far, in px, a pinned point is from where it came to
 * rest or the wire's length from what it was; any distance once its gravity changed.
 */
function pin(wire: Wire, path: LinkPath): number {
    const { gravity, damping, slack, passes, bend } = PROFILES[L.physicsProfile];
    const { p, n, rested } = wire;
    const length = path.length;
    wire.gravity = gravity * L.physicsAmount;
    wire.damping = damping;
    wire.passes = passes;
    wire.bend = bend;
    wire.reach = length / (n - 1);
    wire.span = (length * (1 + (slack - 1) * L.physicsAmount) - 2 * wire.reach) / (n - 3);
    const last = 2 * (n - 1);
    const [ax, ay] = path.a;
    const [bx, by] = path.b;
    let moved = wire.gravity === rested[9] ? Math.abs(wire.span - rested[8]) * (n - 3) : Infinity;
    path.find(0, here);
    moved = Math.max(moved, put(p, 0, ax, ay, rested, 0), put(p, 2, ax + here[2] * wire.reach, ay + here[3] * wire.reach, rested, 2));
    path.find(length, here);
    return Math.max(moved, put(p, last - 2, bx - here[2] * wire.reach, by - here[3] * wire.reach, rested, 4), put(p, last, bx, by, rested, 6));
}

/**
 * Pulls each span between the held points back to its length, the free point of a pair all the way and two free ones
 * half each: from the start to the end, or `back` from the end, so a pull from either end goes all the way along.
 */
function relax(wire: Wire, back: boolean): void {
    const { p, n, span } = wire;
    for (let k = 1; k < n - 2; k++) {
        const j = back ? n - 2 - k : k;
        const i = 2 * j;
        const dx = p[i + 2] - p[i];
        const dy = p[i + 3] - p[i + 1];
        const d = Math.sqrt(dx * dx + dy * dy);
        if (!d) continue;
        const from = j > 1 ? 1 : 0;
        const to = j < n - 3 ? 1 : 0;
        const f = (d - span) / d / (from + to);
        p[i] += dx * f * from;
        p[i + 1] += dy * f * from;
        p[i + 2] -= dx * f * to;
        p[i + 3] -= dy * f * to;
    }
}

/** How sharply the wire bends at each point, as x, y pairs: the second difference of its points. */
const bends = new Float64Array(2 * MOST);

/**
 * Straightens the wire's bends a little: moves each free point down the slope of the sum of its bends squared, which
 * counts the bends at the held points too, so the wire carries on out of a slot before it curves.
 */
function straighten(wire: Wire): void {
    const { p, n, bend } = wire;
    for (let i = 2; i < 2 * n - 2; i++) bends[i] = p[i - 2] - 2 * p[i] + p[i + 2];
    bends[0] = bends[1] = bends[2 * n - 2] = bends[2 * n - 1] = 0;
    for (let i = 4; i < 2 * n - 4; i++) p[i] -= bend * (bends[i - 2] - 2 * bends[i] + bends[i + 2]);
}

/** Moves the wire's free points on by a step with `damping`; how fast the fastest went, in px/s. */
function step(wire: Wire, damping: number): number {
    const { p, q } = wire;
    const end = 2 * (wire.n - 2);
    const fall = wire.gravity * STEP * STEP;
    const most = FASTEST * STEP;
    for (let i = 4; i < end; i += 2) {
        let vx = (p[i] - q[i]) * damping;
        let vy = (p[i + 1] - q[i + 1]) * damping + fall;
        const v = Math.sqrt(vx * vx + vy * vy);
        if (v > most) {
            vx *= most / v;
            vy *= most / v;
        }
        q[i] = p[i];
        q[i + 1] = p[i + 1];
        p[i] += vx;
        p[i + 1] += vy;
    }
    straighten(wire);
    for (let k = 0; k < wire.passes; k++) relax(wire, k % 2 === 1);
    let fastest = 0;
    for (let i = 4; i < end; i += 2) fastest = Math.max(fastest, (p[i] - q[i]) ** 2 + (p[i + 1] - q[i + 1]) ** 2);
    return Math.sqrt(fastest) / STEP;
}

/** Notes where the wire came to rest, and sleeps. */
function sleep(wire: Wire): void {
    const { p, n, rested } = wire;
    const last = 2 * (n - 1);
    rested.set(p.subarray(0, 4));
    rested.set(p.subarray(last - 2, last + 2), 4);
    rested[8] = wire.span;
    rested[9] = wire.gravity;
    wire.awake = false;
}

/** The curve through a wire's points, as x, y pairs: Catmull-Rom splines, BETWEEN points to a span. */
const curve = new Float64Array(2 * ((MOST - 1) * BETWEEN + 1));

/** Lays `path` along the curve through the wire's points. */
function shape(wire: Wire, path: LinkPath): void {
    const { p, n } = wire;
    let m = 0;
    for (let j = 0; j < n - 1; j++) {
        const a = 2 * Math.max(0, j - 1);
        const b = 2 * j;
        const d = 2 * Math.min(n - 1, j + 2);
        for (let s = 0; s < BETWEEN; s++, m += 2) {
            const t = s / BETWEEN;
            for (let k = 0; k < 2; k++) {
                const p0 = p[a + k];
                const p1 = p[b + k];
                const p2 = p[b + 2 + k];
                const p3 = p[d + k];
                curve[m + k] = p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)));
            }
        }
    }
    curve[m] = p[2 * n - 2];
    curve[m + 1] = p[2 * n - 1];
    path.follow(curve, m / 2 + 1);
}

/**
 * Lays the wire anew from native's `path`, brings it to rest and lays the path along it: as it comes on screen, while a
 * pass holds it still, and for a gallery tile. It starts as the parabola under its held points as long as its spans,
 * which takes a few dozen steps to come to rest where falling from native's curve took hundreds, and falls from there,
 * heavily damped, until it keeps still.
 */
export function rest(wire: Wire, path: LinkPath): void {
    const n = Math.min(MOST, Math.max(FEWEST, Math.ceil(path.length / SPAN)));
    wire.n = n;
    pin(wire, path);
    const { p, span } = wire;
    const x = p[2];
    const y = p[3];
    const dx = p[2 * n - 4] - x;
    const dy = p[2 * n - 3] - y;
    const chord = Math.sqrt(dx * dx + dy * dy);
    const sag = Math.sqrt((3 * chord * Math.max(0, span * (n - 3) - chord)) / 8);
    for (let j = 2; j < n - 2; j++) {
        const u = (j - 1) / (n - 3);
        put(p, 2 * j, x + dx * u, y + dy * u + 4 * sag * u * (1 - u));
    }
    wire.q.set(p);
    for (let i = 0; i < SETTLE_STEPS && step(wire, SETTLING) >= SETTLED; i++);
    wire.q.set(p);
    sleep(wire);
    shape(wire, path);
}

/**
 * Hangs a segment's wire from native's `path` for this pass, and lays the path along the wire. A wire laid in one of
 * the last MISSED + 1 passes keeps its points; one come on screen since comes to rest at once. It wakes once an end, its length or its
 * gravity changed since it came to rest, unless the pass holds it still, which lays it anew at rest, as a slow gel
 * could take seconds to settle from where an end jumped.
 */
export function hang(wire: Wire, path: LinkPath): void {
    const fresh = pass - wire.pass > MISSED + 1;
    wire.pass = pass;
    laid.push(wire);
    if (fresh) return rest(wire, path);
    const moved = pin(wire, path) > WAKE;
    if (held && (moved || wire.awake)) return rest(wire, path);
    if (moved && !wire.awake) {
        wire.awake = true;
        wire.still = 0;
    }
    shape(wire, path);
}

/** The ticker's step: moves the swinging wires the last pass laid on by `dt` s, in steps of 1/60 s, and puts those that kept still to sleep. */
export function stepWires(dt: number): void {
    due = Math.min(due + dt, SUBSTEPS * STEP);
    for (; due >= STEP - EARLY; due -= STEP) {
        for (const wire of laid) {
            if (!wire.awake) continue;
            wire.still = step(wire, wire.damping) < SLEEPY ? wire.still + STEP : 0;
            if (wire.still >= REST_S) sleep(wire);
        }
    }
    swinging();
}
