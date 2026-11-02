/**
 * Fireworks when a run finishes, as v1's renderCompleteFireworks drew them
 * (old_node_animations.js:1900-2021): over each anchor node, three bursts in
 * rose, cyan and gold, a tenth of the show apart, each a white-hot core, 250
 * sparks thrown out and pulled down, the fastest with trails, and a shower of
 * sparkles as it opens. A show lasts 1 / 0.84 s, as v1's 0.014 a frame did at
 * 60 Hz. v1 placed and sized the bursts by the canvas in its node's space; here
 * they stand over their node in graph space, at the size they took on screen at
 * zoom 1, whatever the zoom. Each spark's speed, colour and trail are drawn once
 * from a seeded stream, where v1 drew new ones every frame. With reduced motion
 * a show is one soft glow over each anchor. One show plays at a time; a show
 * can be cut short.
 *
 * @module fx/bursts
 */

import type { LGraphNode } from '@comfyorg/comfyui-frontend-types';
import type { app } from '/scripts/app.js';
import { N } from '@/core/settings';
import { clock, env, live, wake } from '@/core/engine';
import { nodePalette, translucent } from '@/core/colors';
import { CAP, disc, pool, rng } from '@/fx/particles';

type Canvas = typeof app.canvas;

/** The guard's key for the fireworks, which its toast names when it turns them off. */
export const FIREWORKS = 'Fireworks';

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
const [CORE, SPARK, SPARKLE, GLOW] = [0, 1, 2, 3];
/** The particles of one anchor's show. */
const SHOW = BURSTS.length * (1 + SPARKS + SPARKLES);

/** What a show goes off over: a node, or a point of the graph it is in, where a `small` show's bursts are half their size; its id seeds the show. */
export type Anchor = Pick<LGraphNode, 'pos' | 'graph'> & { id: unknown; small?: boolean };

interface Burst {
    node: Anchor;
    x: number;
    y: number;
    delay: number;
    size: number;
    /** Its own colour, the secondary and accent colours of Animate's effect, as v1 took them, and white. */
    colours: string[];
}

/** The bursts of the show playing, which its particles' owner indexes. */
const bursts: Burst[] = [];

/** How far the show has got, from 0 as it starts to 1 as it ends: clock.burstTime runs from 0 at its start. */
const progress = () => clock.burstTime * RATE;

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

/** Starts the show of run `run` over `nodes`, unless one is playing; nodes past what the pool holds, the fifth on, get none. */
export function fireworks(nodes: Anchor[], run: string): void {
    if ((pool.count && progress() < 1) || !nodes.length) return;
    pool.count = bursts.length = 0;
    clock.burstTime = 0;
    const { secondary, accent } = nodePalette(N.animate);
    for (const node of nodes) {
        if (pool.count + SHOW > CAP) break;
        const random = rng(hash(run) ^ hash(String(node.id)));
        for (const { x, y, delay, size, colour } of BURSTS) {
            const owner = bursts.push({ node, x, y, delay, size: node.small ? size / 2 : size, colours: [colour, secondary, accent, '#FFFFFF'] }) - 1;
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
    live.bursts = pool.count;
    wake();
}

/** Ends the show playing at once. */
export function endBursts(): void {
    pool.count = bursts.length = 0;
    live.bursts = 0;
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
    ctx.save();
    try {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < pool.count; i++) {
            const burst = bursts[pool.owner[i]];
            // Where its burst has got, as v1 worked it out (its adjustedPhase).
            const t = phase - burst.delay;
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
                default: {
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
