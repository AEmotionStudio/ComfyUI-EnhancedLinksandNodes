/**
 * What plays when a run finishes, over each anchor of it (fx/execution.ts),
 * seeded by the run and the node, as large on screen at any zoom as at zoom 1:
 *
 * - Fireworks, as v1's renderCompleteFireworks drew them
 *   (old_node_animations.js:1900-2021): three bursts in rose, cyan and gold, a
 *   tenth of the show apart, each a white-hot core, 250 sparks thrown out and
 *   pulled down, the fastest with trails, and a shower of sparkles as it opens.
 *   A show lasts 1 / 0.84 s, as v1's 0.014 a frame did at 60 Hz. v1 placed and
 *   sized the bursts by the canvas in its node's space; here they stand over
 *   their node in graph space, at the size they took on screen at zoom 1. Each
 *   spark's speed, colour and trail are drawn once from a seeded stream, where
 *   v1 drew new ones every frame.
 * - Confetti: 60 to 120 pieces in the node palette's colours fall from above
 *   the node, slowed by the air, swaying, turning and flipping, for 2 s, and
 *   fade out at the end.
 * - Shockwave: one ring from the node's edge out to twice its size, fading, in
 *   0.7 s; from a point, a ring of a set size.
 * - Path trace: a comet along the links the run took, which the link pass
 *   draws (fx/execution.ts drawFlows); its show here only keeps the time.
 *
 * Where a show of the new styles has several anchors, each starts a third of a
 * second after the one before, so no more than three flash in a second;
 * fireworks keep v1's timing. With reduced motion every style is one soft glow
 * over each anchor. One show plays at a time, and a show can be cut short.
 *
 * As a node of the run finishes, sparks can pop from its top-right corner
 * (pop()), on the run's clock: six bursts a second at most, a node's next once
 * its last is over, and none off screen. With reduced motion a ring fades
 * there instead.
 *
 * @module fx/bursts
 */

import type { LGraphNode } from '@comfyorg/comfyui-frontend-types';
import type { app } from '/scripts/app.js';
import { N } from '@/core/settings';
import { MAX_FLASH_HZ, clock, env, live, overlaps, wake } from '@/core/engine';
import { dark, darker, nodePalette, translucent } from '@/core/colors';
import { CAP, disc, noise, pool, rng } from '@/fx/particles';

type Canvas = typeof app.canvas;

/** The guard's key for what plays when a run finishes, which its toast names when it turns it off. */
export const COMPLETION = 'Completion effect';

/** The styles a show plays, which Completion.Style names; its Surprise picks one (surprise()). */
export const STYLES = ['fireworks', 'confetti', 'shockwave', 'trace'] as const;
export type Style = (typeof STYLES)[number];

/** v1's bursts: where each stands, as fractions of the view off its node, when it goes off in the show, its colour and size. */
const BURSTS = [
    { x: 0.05, y: -0.2, delay: 0, colour: '#FF3366', size: 3.2 },
    { x: 0.03, y: -0.15, delay: 0.1, colour: '#33EEFF', size: 2.9 },
    { x: 0.06, y: -0.15, delay: 0.2, colour: '#FFEE33', size: 3 },
];
/** How far a show gets a second. */
const RATE = 0.84;
const SPARKS = 250;
const SPARKLES = 40;
const [CORE, SPARK, SPARKLE, GLOW, PIECE, RING, COMET] = [0, 1, 2, 3, 4, 5, 6];
/** The particles of one anchor's show. */
const SHOW = BURSTS.length * (1 + SPARKS + SPARKLES);

/**
 * The new styles: how long each plays at one anchor, in s, and how long after the one before each further anchor
 * starts, so that at most MAX_FLASH_HZ start in a second; and the most anchors they play at, as many as fireworks fit.
 */
const LASTS = { confetti: 2, shockwave: 0.7, trace: 1.5 };
const STAGGER = 1 / MAX_FLASH_HZ;
const MOST = Math.floor(CAP / SHOW);
/**
 * Confetti, in px on screen and s: how many pieces at least and at most; how wide the band they fall from, how high
 * above the node a piece starts at least and at most, and how fast at most it is thrown; the pull down, and the air's
 * drag, which holds them to GRAVITY / DRAG; how far and how often a piece sways, how fast at most it turns, how often at
 * least and at most it flips (showing its face twice a flip, under MAX_FLASH_HZ), how long at least and at most it is,
 * and how long it takes to come and to go. Each piece takes PARAMS numbers of its anchor's stream.
 */
const PIECES = [60, 120];
const SPREAD = 260;
const ABOVE = [30, 200];
const THROW = 120;
const GRAVITY = 600;
const DRAG = 3;
const SWAY = 10;
const SWAY_HZ = 0.8;
const SPIN = 4;
const FLIPS = [0.4, 1.2];
const LENGTH = [5, 9];
const COME = 0.1;
const GO = 0.5;
const PARAMS = 11;
/**
 * Shockwave: how wide its ring is, and its glow, and how far a point's ring reaches, in px on screen; the corners of a
 * node's ring, in graph units; and how long it takes to come, in s.
 */
const RING_PX = 3;
const RING_GLOW_PX = 12;
const POINT_RING = 160;
const RING_CORNER = 8;
const RING_IN = 0.06;

/** What a show goes off over: a node, or a point of the graph it is in, where a `small` show is half its size; its id seeds the show. */
export type Anchor = Pick<LGraphNode, 'pos' | 'graph'> & Partial<Pick<LGraphNode, 'boundingRect'>> & { id: unknown; small?: boolean };

interface Burst {
    node: Anchor;
    /** Where it stands, as fractions of the view off its node, and when it goes off: as a fraction of a fireworks show, else in s. */
    x: number;
    y: number;
    delay: number;
    size: number;
    /** The seed of its stream. */
    seed: number;
    /** Fireworks: its own colour, the secondary and accent colours of Animate's effect, as v1 took them, and white. Else the primary, secondary and accent. */
    colours: string[];
}

/** The bursts of the show playing, which its particles' owner indexes. */
const bursts: Burst[] = [];
/** The style of the show playing, how far it gets a second, and the style the last show played, which Surprise does not pick next. */
const show = { style: 'fireworks' as Style, rate: RATE };
let played: Style | undefined;

/** How far the show has got, from 0 as it starts to 1 as it ends: clock.burstTime runs from 0 at its start. */
const progress = () => clock.burstTime * show.rate;

/** FNV-1a, which seeds a show from its run and its node. */
function hash(text: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
    return h;
}

function add(kind: number, owner: number, angle = 0, speed = 0, size = 0, colour = 0, trail = 0, seq = 0): void {
    const i = pool.count++;
    pool.kind[i] = kind;
    pool.owner[i] = owner;
    pool.angle[i] = angle;
    pool.speed[i] = speed;
    pool.size[i] = size;
    pool.colour[i] = colour;
    pool.trail[i] = trail;
    pool.seq[i] = seq;
}

/** The `n`th number of the seeded stream rng(seed) gives, which a particle that keeps none of its own takes again each frame. */
const nth = (seed: number, n: number) => noise(seed + n * 0x6d2b79f5);

/** The fireworks of run `run` over `nodes`; nodes past what the pool holds, the fifth on, get none. */
function fireworks(nodes: Anchor[], run: string): void {
    show.rate = RATE;
    const { secondary, accent } = nodePalette(N.animate);
    for (const node of nodes) {
        if (pool.count + SHOW > CAP) break;
        const seed = hash(run) ^ hash(String(node.id));
        const random = rng(seed);
        for (const { x, y, delay, size, colour } of BURSTS) {
            const owner = bursts.push({ node, x, y, delay, size: node.small ? size / 2 : size, seed, colours: [colour, secondary, accent, '#FFFFFF'] }) - 1;
            if (env.reducedMotion) {
                add(GLOW, owner);
                break;
            }
            add(CORE, owner);
            for (let i = 0; i < SPARKS; i++) {
                // v1's order: the speed, which sizes it too, its colour, and whether it trails.
                const speed = 0.3 + random() * 0.7;
                const shade = Math.floor(random() * 4);
                add(SPARK, owner, (i / SPARKS) * Math.PI * 2, speed, speed, shade, random() < speed * 0.7 ? Math.floor(speed * 3) + 1 : 0, i);
            }
            for (let j = 0; j < SPARKLES; j++) add(SPARKLE, owner, random() * Math.PI * 2, random(), random(), 3, 0, j);
        }
    }
}

/**
 * Starts a show of `style` for run `run` over `nodes`, unless one is playing; with reduced motion, fireworks' glows. The
 * new styles play over the first MOST nodes, a path trace once.
 */
export function play(style: Style, nodes: Anchor[], run: string): void {
    if ((pool.count && progress() < 1) || !nodes.length) return;
    played = style;
    pool.count = bursts.length = 0;
    clock.burstTime = 0;
    const drawn = (show.style = env.reducedMotion ? 'fireworks' : style);
    if (drawn === 'fireworks') fireworks(nodes, run);
    else {
        const { primary, secondary, accent } = nodePalette(N.animate);
        const anchors = drawn === 'trace' ? 1 : Math.min(nodes.length, MOST);
        show.rate = 1 / (LASTS[drawn] + (anchors - 1) * STAGGER);
        for (let k = 0; k < anchors; k++) {
            const node = nodes[k];
            const seed = hash(run) ^ hash(String(node.id));
            const owner = bursts.push({ node, x: 0, y: 0, delay: k * STAGGER, size: node.small ? 0.5 : 1, seed, colours: [primary, secondary, accent] }) - 1;
            if (drawn !== 'confetti') add(drawn === 'shockwave' ? RING : COMET, owner);
            else {
                const count = Math.round((PIECES[0] + noise(seed) * (PIECES[1] - PIECES[0])) * bursts[owner].size);
                for (let i = 0; i < count; i++) add(PIECE, owner, 0, 0, 0, 0, 0, i);
            }
        }
    }
    live.bursts = pool.count;
    wake();
}

/** Surprise for run `run`: one of `styles` other than the one played last, the same for the same run. */
export function surprise(run: string, styles: readonly Style[]): Style {
    const others = styles.filter((style) => style !== played);
    return others[Math.floor(noise(hash(run)) * others.length)];
}

/** How far the path trace playing has got, from 0 as it starts to 1 as it ends; -1 while none plays. */
export function tracing(): number {
    const p = progress();
    return show.style === 'trace' && pool.count && p < 1 ? p : -1;
}

/** Ends the show playing at once. */
export function endBursts(): void {
    pool.count = bursts.length = 0;
    live.bursts = 0;
}

/** Where a burst's node stands in graph space, which anchor() writes: the middle of its top edge, title included, else a point's own place. */
const where = new Float64Array(2);

/** Writes where `node` stands, and returns its box; a point has none. */
function anchor(node: Anchor): ArrayLike<number> | undefined {
    const box = node.boundingRect;
    where[0] = box ? box[0] + box[2] / 2 : node.pos[0];
    where[1] = box ? box[1] : node.pos[1];
    return box;
}

/** Confetti piece `n` of `burst`, `t` s into its fall, where `unit` is a px on screen: a turning, flipping rectangle. */
function piece(ctx: CanvasRenderingContext2D, burst: Burst, n: number, t: number, unit: number): void {
    const alpha = Math.min(1, t / COME, (LASTS.confetti - t) / GO);
    if (alpha <= 0) return;
    const { seed, size } = burst;
    const at = 1 + n * PARAMS;
    anchor(burst.node);
    // Thrown any way from its place above the node, then falling at GRAVITY / DRAG as the air slows it.
    const heading = nth(seed, at + 2) * 2 * Math.PI;
    const speed = nth(seed, at + 3) * THROW;
    const slowed = (1 - Math.exp(-DRAG * t)) / DRAG;
    const sway = SWAY * Math.sin(2 * Math.PI * (SWAY_HZ * t + nth(seed, at + 8)));
    const x = where[0] + unit * ((nth(seed, at) - 0.5) * SPREAD * size + Math.cos(heading) * speed * slowed + sway);
    const y = where[1] + unit * (Math.sin(heading) * speed * slowed + (GRAVITY / DRAG) * (t - slowed) - (ABOVE[0] + nth(seed, at + 1) * (ABOVE[1] - ABOVE[0])) * size);
    const turn = nth(seed, at + 4) * 2 * Math.PI + (2 * nth(seed, at + 5) - 1) * SPIN * t;
    const flip = Math.cos(2 * Math.PI * ((FLIPS[0] + nth(seed, at + 6) * (FLIPS[1] - FLIPS[0])) * t + nth(seed, at + 7)));
    // Half its length along the turn, and half its width, half that, across it as the flip shows it.
    const half = (unit * (LENGTH[0] + nth(seed, at + 9) * (LENGTH[1] - LENGTH[0]))) / 2;
    const lx = Math.cos(turn) * half;
    const ly = Math.sin(turn) * half;
    const wx = -ly * 0.5 * flip;
    const wy = lx * 0.5 * flip;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = burst.colours[Math.floor(nth(seed, at + 10) * 3)];
    ctx.beginPath();
    ctx.moveTo(x + lx + wx, y + ly + wy);
    ctx.lineTo(x - lx + wx, y - ly + wy);
    ctx.lineTo(x - lx - wx, y - ly - wy);
    ctx.lineTo(x + lx - wx, y + ly - wy);
    ctx.closePath();
    ctx.fill();
}

/**
 * The shockwave of `burst`, `t` s in, where `unit` is a px on screen: the outline of its node grown from its own size
 * to twice it about its middle, or a circle out to POINT_RING px, easing out as it fades, in its primary colour over a
 * glow in its accent.
 */
function wave(ctx: CanvasRenderingContext2D, burst: Burst, t: number, unit: number): void {
    const p = t / LASTS.shockwave;
    if (p >= 1) return;
    const grown = 1 - (1 - p) ** 3;
    const box = anchor(burst.node);
    ctx.beginPath();
    if (box) {
        const w = box[2] * (1 + grown);
        const h = box[3] * (1 + grown);
        ctx.roundRect(where[0] - w / 2, where[1] + (box[3] - h) / 2, w, h, RING_CORNER * (1 + grown));
    } else {
        ctx.arc(where[0], where[1], POINT_RING * burst.size * unit * (0.1 + 0.9 * grown), 0, Math.PI * 2);
    }
    const alpha = Math.min(1, t / RING_IN) * (1 - p) ** 2;
    ctx.globalAlpha = alpha * 0.35;
    ctx.strokeStyle = burst.colours[2];
    ctx.lineWidth = RING_GLOW_PX * unit;
    ctx.stroke();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = burst.colours[0];
    ctx.lineWidth = RING_PX * unit;
    ctx.stroke();
}

/**
 * Draws the show playing over `canvas`'s view, in graph space, ending it once it is over: each burst over its node,
 * while that is in the graph shown. Its bursts and sparks are as large on screen at any zoom as v1's at zoom 1.
 */
export function drawBursts(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    const phase = progress();
    if (phase >= 1) pool.count = bursts.length = 0;
    live.bursts = pool.count;
    if (!pool.count) return;
    const area = canvas.visible_area;
    const unit = 1 / canvas.ds.scale;
    const view = Math.min(area[2], area[3]);
    const fireworks = show.style === 'fireworks';
    ctx.save();
    try {
        if (fireworks) ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < pool.count; i++) {
            const burst = bursts[pool.owner[i]];
            // Where its burst has got, as v1 worked it out (its adjustedPhase); the new styles' in s.
            const t = (fireworks ? phase : clock.burstTime) - burst.delay;
            if (t <= 0 || burst.node.graph !== canvas.graph) continue;
            const x = burst.node.pos[0] + area[2] * burst.x;
            const y = burst.node.pos[1] + area[3] * burst.y;
            const reach = view * 0.2 * burst.size;
            const colour = burst.colours[pool.colour[i]];
            switch (pool.kind[i]) {
                case CORE: {
                    const fade = 1 - t * 1.2;
                    if (fade <= 0) break;
                    const radius = reach * (0.1 + 0.5 * t);
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, translucent('#FFFFFF', 0.95 * fade));
                    gradient.addColorStop(0.5, translucent(colour, 0.8 * fade));
                    gradient.addColorStop(1, translucent(colour, 0));
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case SPARK: {
                    const alpha = 1 - t * 1.2;
                    if (alpha <= 0) break;
                    // As v1 worked it out, in its order: out along its heading, with a wobble, and down.
                    const speed = reach * pool.speed[i];
                    const angle = pool.angle[i] + Math.sin(t * 10 + pool.seq[i]) * 0.05;
                    const gravity = 0.2 * reach;
                    const dy = Math.sin(angle) * speed * t + gravity * t * t;
                    const size = Math.max(1, 3 * (1 - t) * pool.size[i]) * unit;
                    disc(ctx, x + Math.cos(angle) * speed * t, y + dy, size * 1.2, colour, alpha, true);
                    for (let j = 1; j <= pool.trail[i]; j++) {
                        const back = Math.max(0, t - 0.02 * j);
                        disc(ctx, x + Math.cos(angle) * speed * back, y + Math.sin(angle) * speed * back + gravity * back * back, size * (1 - j * 0.2), colour, alpha * (0.7 - j * 0.2), false);
                    }
                    break;
                }
                case SPARKLE: {
                    if (t >= 0.3 || pool.seq[i] >= Math.floor(SPARKLES * (1 - t / 0.3))) break;
                    const dist = reach * 0.7 * t * pool.speed[i];
                    disc(ctx, x + Math.cos(pool.angle[i]) * dist, y + Math.sin(pool.angle[i]) * dist, (1 + pool.size[i] * 4 * (1 - t)) * unit, colour, 0.95 * (1 - t * 3), false);
                    break;
                }
                case PIECE:
                    piece(ctx, burst, pool.seq[i], t, unit);
                    break;
                case RING:
                    wave(ctx, burst, t, unit);
                    break;
                case GLOW: {
                    const radius = reach * 0.4;
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                    gradient.addColorStop(0, translucent(colour, 0.5 * Math.sin(Math.PI * Math.min(t, 1))));
                    gradient.addColorStop(1, translucent(colour, 0));
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    } finally {
        ctx.restore();
    }
}

// =============================================================================
// A burst as each node finishes
// =============================================================================

/**
 * In px on screen and s: how many sparks at least and at most, how far they fly and for how long; how far out the ring
 * that fades instead with reduced motion is, and for how long; and how many bursts pop in a second at most.
 */
const POP_SPARKS = [8, 12];
const POP_REACH = 48;
const POP_S = 0.4;
const POP_RING = 10;
const POP_RING_S = 0.3;
const POPS = 6;

type Finished = Pick<LGraphNode, 'id' | 'graph' | 'boundingRect'>;

/** The bursts kept: the node, when it popped on clock.runTime, and the seed of its sparks. */
const pops: { node: Finished; at: number; seed: number }[] = [];
/** When the last POPS bursts popped, on performance.now(), the oldest at `oldest`. */
const popped = new Float64Array(POPS).fill(-Infinity);
let oldest = 0;

/** How long a burst plays: its sparks, or its ring with reduced motion. */
const popLasts = () => (env.reducedMotion ? POP_RING_S : POP_S);

/** How long a burst is kept: as long as it plays, and at least as long as a node waits to pop again, so that none flashes more than MAX_FLASH_HZ times a second. */
const popKept = () => Math.max(popLasts(), 1 / MAX_FLASH_HZ);

/** Pops a burst from the corner of `node`, which finished in run `run`: while it is on screen, unless its last is kept still or POPS popped in the last second. */
export function pop(canvas: Canvas, node: Finished, run: string): void {
    const now = performance.now();
    if (now - popped[oldest] < 1000 || !overlaps(node.boundingRect, canvas.visible_area, 0) || pops.some((p) => p.node === node && clock.runTime - p.at < popKept())) return;
    popped[oldest] = now;
    oldest = (oldest + 1) % POPS;
    pops.push({ node, at: clock.runTime, seed: hash(run) ^ hash(String(node.id)) });
}

/**
 * Draws the bursts playing over `canvas`'s view, those of nodes in the graph shown, and lets go of those no longer kept:
 * each POP_SPARKS sparks from its node's top-right corner, half in Animate's primary colour and half in its secondary,
 * darker on a light canvas, flying out, shrinking and fading, or with reduced motion a ring fading there. They are plain
 * discs, which cost less than the glow sprites a few sparks would first have to cast. How many are kept.
 */
export function drawPops(canvas: Canvas, ctx: CanvasRenderingContext2D): number {
    let n = 0;
    for (const p of pops) if (clock.runTime - p.at < popKept()) pops[n++] = p;
    pops.length = n;
    if (!n) return 0;
    const lasts = popLasts();
    const area = canvas.visible_area;
    const unit = 1 / canvas.ds.scale;
    const { primary, secondary } = nodePalette(N.animate);
    const light = !dark(canvas.clear_background_color);
    const first = light ? darker(primary) : primary;
    const second = light ? darker(secondary) : secondary;
    ctx.save();
    try {
        for (const p of pops) {
            const f = (clock.runTime - p.at) / lasts;
            const box = p.node.boundingRect;
            if (f >= 1 || p.node.graph !== canvas.graph || !overlaps(box, area, POP_REACH * unit)) continue;
            const x = box[0] + box[2];
            const y = box[1];
            ctx.globalAlpha = 1 - f;
            if (env.reducedMotion) {
                ctx.strokeStyle = first;
                ctx.lineWidth = 2 * unit;
                ctx.beginPath();
                ctx.arc(x, y, POP_RING * unit, 0, Math.PI * 2);
                ctx.stroke();
                continue;
            }
            const out = POP_REACH * unit * (1 - (1 - f) ** 2);
            const sparks = POP_SPARKS[0] + Math.floor(noise(p.seed) * (POP_SPARKS[1] - POP_SPARKS[0] + 1));
            for (let half = 0; half < 2; half++) {
                ctx.fillStyle = half ? second : first;
                ctx.beginPath();
                for (let i = half; i < sparks; i += 2) {
                    // Out from the corner any way but into the node, each as far as its own speed takes it.
                    const heading = -Math.PI + nth(p.seed, 1 + 3 * i) * 1.5 * Math.PI;
                    const reach = out * (0.5 + 0.5 * nth(p.seed, 2 + 3 * i));
                    const sx = x + Math.cos(heading) * reach;
                    const sy = y + Math.sin(heading) * reach;
                    const r = (3 + nth(p.seed, 3 + 3 * i)) * unit * (1 - 0.5 * f);
                    ctx.moveTo(sx + r, sy);
                    ctx.arc(sx, sy, r, 0, Math.PI * 2);
                }
                ctx.fill();
            }
        }
    } finally {
        ctx.restore();
    }
    return n;
}
