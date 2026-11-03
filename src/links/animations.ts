/**
 * The link animations while they move, drawn segment by segment along each
 * segment's real path. A link's elements and strokes are counted per link, at
 * its own fractions, so they carry on across its reroutes. Classic Flow moves
 * only its markers (styles.ts).
 *
 * Ported from v1's renderers (old_link_animations.js:2554-3359) on v1's clock:
 * where v1 took its time × speed, they take the flow, which is signed, so
 * Reverse plays them backwards instead of mirroring where they are. Sacred
 * Flow's ribbon follows the curve and its wobble, and Lava Flow's ripples
 * across the path, travel downstream; Cosmic Weave, DNA Helix and Stellar
 * Plasma follow the link's own path rather than a curve from its other end;
 * Energy Pulse's orbs fade along their trip; Stellar Plasma's sparks stream
 * instead of piling up at one end; and every count is at least one.
 *
 * v3's own three keep their pace in px along the path: Merkaba Beads, DNA
 * Helix 3D and Comet Trails.
 *
 * @module links/animations
 */

import { L } from '@/core/settings';
import { lighter } from '@/core/colors';
import { DOT, glow, noise, shine, type Shape } from '@/fx/particles';
import type { Segment } from './pipeline';

/** v1's pattern counts (old_link_animations.js:8-17). */
export const SACRED = { TRINITY: 3, HARMONY: 7, COMPLETION: 12, QUANTUM: 5 };

/**
 * What the motion layer scales what it draws by (links/pipeline.ts), 1 elsewhere: every alpha it sets, a half while a Calm
 * run plays (core/engine.ts); every glow, none while Perf.Adaptive draws them plain; and its particle counts, half while
 * it thins them.
 */
export const moving = { alpha: 1, glow: 1, density: 1 };

/** The clock the motion is drawn at (src/core/engine.ts). */
interface Moment {
    linkPhase: number;
    quantumPhase: number;
    linkFlow: number;
    linkDir: number;
}

/** x % 1 in [0, 1), below 0 too: where along its link an element that flows is. */
export function wrap(x: number): number {
    const r = x % 1;
    return r < 0 ? r + 1 : r;
}

/** The point and direction at() writes. */
const here = new Float64Array(4);
/** The fractions of the link vertices() finds for a stroke. */
export let ts = new Float64Array(64);

/**
 * Where a stroke of `n` steps along a link has its vertices on segment s, as fractions of the link in `ts`: each
 * i / n on the segment, and its ends between them, so the strokes of a link's segments meet. Returns how many.
 */
export function vertices(s: Segment, n: number): number {
    const first = Math.ceil(s.t0 * n);
    const last = Math.floor(s.t1 * n);
    if (ts.length < last - first + 3) ts = new Float64Array(2 * (last - first + 3));
    let m = 0;
    if (first / n > s.t0) ts[m++] = s.t0;
    for (let i = first; i <= last; i++) ts[m++] = i / n;
    if (last / n < s.t1) ts[m++] = s.t1;
    return m;
}

/** A heptagon outline `size` across from its centre, its first corner at `angle`. */
const HEPTAGON: Shape = {
    path(ctx, x, y, size, angle) {
        ctx.beginPath();
        for (let i = 0; i < SACRED.HARMONY; i++) {
            const corner = angle + (i / SACRED.HARMONY) * Math.PI * 2;
            const px = x + Math.cos(corner) * size;
            const py = y + Math.sin(corner) * size;
            if (i) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
        }
        ctx.closePath();
    },
    stroked: true,
    turn: (Math.PI * 2) / SACRED.HARMONY,
};

/**
 * v1's RenderUtils.createCrystal (old_link_animations.js:1474-1491): a heptagon `size` across from its centre, turned
 * by `rotation`, stroked in `color` at the context's line width and glowing `blur` px in `glowColor`.
 */
export function createCrystal(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string, glowColor: string, blur: number): void {
    glow(ctx, HEPTAGON, x, y, size, rotation, color, glowColor, blur);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    HEPTAGON.path(ctx, 0, 0, size, 0);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

/** A DNA rung: a line `size` out to each side of its centre, along `angle`. */
const RUNG: Shape = {
    path(ctx, x, y, size, angle) {
        const dx = Math.cos(angle) * size;
        const dy = Math.sin(angle) * size;
        ctx.beginPath();
        ctx.moveTo(x + dx, y + dy);
        ctx.lineTo(x - dx, y - dy);
    },
    stroked: true,
    turn: Math.PI,
};

/** A triangle `size` from its centre to each corner, its first corner at `angle`. */
function triangle(ctx: CanvasRenderingContext2D, size: number, angle: number): void {
    for (let i = 0; i <= SACRED.TRINITY; i++) {
        const a = angle + (i / SACRED.TRINITY) * Math.PI * 2;
        if (i) ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        else ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
    }
}

/** v1's createMerkaba (old_link_animations.js:1493-1520), which it never drew: two triangles, a sixth of a turn apart, turned by `angle`. */
export const MERKABA: Shape = {
    path(ctx, x, y, size, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        triangle(ctx, size, 0);
        triangle(ctx, size, Math.PI / SACRED.TRINITY);
        ctx.restore();
    },
    stroked: true,
    turn: Math.PI / SACRED.TRINITY,
};

/**
 * How far Sacred Flow's flow field (RenderUtils.createFlowField, old_link_animations.js:1467-1472) moves its point at
 * T across x (`turn` Math.sin) or y (Math.cos) at flow phase cp, travelling downstream where v1's travelled upstream.
 */
const moved = (turn: (x: number) => number, T: number, cp: number) => turn(T * Math.PI * SACRED.TRINITY - cp) * 10 * Math.sin(T * Math.PI - cp) * 0.5;

/** 1. Sacred Flow: a glowing ribbon that wobbles in a rotating flow field, and twinkling beads drifting along it. */
function sacredFlow(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { thickness } = L;
    const glowIntensity = L.glowIntensity * moving.glow;
    const { primary, accent } = s.pal;
    const cp = k.linkFlow * 0.25;
    // v1 drew the ribbon through floor(3 × Quality × Particle.Density) + 1 points, which at its defaults made a straight
    // line between two points off the curve; one every 8 px follows it.
    const m = vertices(s, Math.max(12, Math.round(s.chain / 8)));
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
        const T = ts[j];
        s.path.at(s.local(T), here);
        const x = here[0] + moved(Math.sin, T, cp);
        const y = here[1] + moved(Math.cos, T, cp);
        if (j) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
    }
    ctx.strokeStyle = primary;
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = primary;
    ctx.shadowBlur = glowIntensity;
    ctx.globalAlpha = moving.alpha;
    ctx.stroke();

    const count = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.particleDensity * moving.density));
    for (let i = 0; i < count; i++) {
        const T = wrap(i / count + cp * 0.5);
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        const x = here[0] + moved(Math.sin, T, cp);
        const y = here[1] + moved(Math.cos, T, cp);
        DOT.path(ctx, x, y, thickness * 0.75, 0);
        ctx.globalAlpha = (0.4 + Math.sin(k.linkPhase + T * Math.PI * 2) * 0.2) * moving.alpha;
        shine(ctx, DOT, x, y, thickness * 0.75, 0, accent, accent, glowIntensity);
    }
}

/** 2. Crystal Stream: heptagon outlines racing along the link, spinning and growing and shrinking as they go. */
function crystalStream(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { thickness } = L;
    const { primary, secondary } = s.pal;
    const cp = k.linkFlow;
    const count = Math.max(1, Math.floor(SACRED.HARMONY * L.quality * L.particleDensity * moving.density));
    for (let i = 0; i < count; i++) {
        const T = wrap(i / count + cp);
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        // v1's crystals took the width of the base drawn before them.
        ctx.lineWidth = thickness * 0.8;
        ctx.globalAlpha = moving.alpha;
        createCrystal(ctx, here[0], here[1], 5 * thickness * (1 + Math.sin(cp + T * Math.PI)), T * Math.PI * 2 + cp, primary, secondary, L.glowIntensity * moving.glow);
    }
}

/** 3. Quantum Field: five faint filaments around the path, each bent along its own turning axis. */
function quantumField(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { primary, secondary } = s.pal;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * L.particleDensity)));
    for (let f = 0; f < SACRED.QUANTUM; f++) {
        const fieldPhase = k.quantumPhase + (f * Math.PI * 2) / SACRED.QUANTUM;
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            const uncertainty = 8 * Math.sin(T * Math.PI * 2 + fieldPhase);
            const x = here[0] + uncertainty * Math.cos(fieldPhase);
            const y = here[1] + uncertainty * Math.sin(fieldPhase);
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        const color = f % 2 === 0 ? primary : secondary;
        ctx.strokeStyle = color;
        ctx.lineWidth = L.thickness * 0.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = L.glowIntensity * moving.glow;
        ctx.globalAlpha = 0.3 * moving.alpha;
        ctx.stroke();
    }
}

/** 4. Cosmic Weave: three threads braiding around the path, rolling toward the input. */
function cosmicWeave(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const colors = [s.pal.primary, s.pal.secondary, s.pal.accent];
    const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
    for (let strand = 0; strand < SACRED.TRINITY; strand++) {
        const strandPhase = k.linkFlow + (strand * Math.PI * 2) / SACRED.TRINITY;
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            // Counted from the input, as v1 counted it.
            const weave = Math.sin((1 - T) * Math.PI * 6 + strandPhase) * 10;
            const x = here[0] + weave * Math.cos(strandPhase);
            const y = here[1] + weave * Math.sin(strandPhase);
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = colors[strand];
        ctx.lineWidth = L.thickness * 0.7;
        ctx.shadowColor = colors[strand];
        ctx.shadowBlur = L.glowIntensity * moving.glow;
        ctx.globalAlpha = 0.5 * moving.alpha;
        ctx.stroke();
    }
}

/** 5. Energy Pulse: orbs launched from the output that shrink and fade out by the end of their trip. */
function energyPulse(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { secondary } = s.pal;
    const cp = k.linkFlow * 0.25;
    const count = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * moving.density));
    for (let i = 0; i < count; i++) {
        const T = wrap(i / count + cp);
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        // How far along its trip the orb is, which runs the other way going Reverse.
        const trip = L.direction > 0 ? T : 1 - T;
        const r = L.thickness * 2 * (1 - trip);
        DOT.path(ctx, here[0], here[1], r, 0);
        ctx.globalAlpha = 0.5 * (1 - trip) * moving.alpha;
        shine(ctx, DOT, here[0], here[1], r, 0, secondary, secondary, L.glowIntensity * moving.glow * 2);
    }
}

/** 6. DNA Helix: two strands winding four turns around the path, joined by sixteen rungs, the twist screwing toward the input. */
function dnaHelix(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { primary, secondary, accent } = s.pal;
    const { thickness } = L;
    const glowIntensity = L.glowIntensity * moving.glow;
    const radius = 10;
    const rotations = 4;
    // Its angles are counted from the input, as v1 counted them.
    const angle = (T: number) => (1 - T) * Math.PI * rotations * 2 + k.linkFlow;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * 2)));
    for (let strand = 0; strand < 2; strand++) {
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            const side = strand ? -1 : 1;
            const x = here[0] + side * Math.cos(angle(T)) * radius;
            const y = here[1] + side * Math.sin(angle(T)) * radius;
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        const color = strand ? secondary : primary;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity;
        ctx.globalAlpha = moving.alpha;
        ctx.stroke();
    }
    const bonds = rotations * 4;
    for (let b = 0; b < bonds; b++) {
        const T = 1 - b / bonds;
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        ctx.lineWidth = thickness;
        ctx.globalAlpha = 0.6 * moving.alpha;
        RUNG.path(ctx, here[0], here[1], radius, angle(T));
        shine(ctx, RUNG, here[0], here[1], radius, angle(T), accent, accent, glowIntensity * 0.5);
    }
}

/**
 * A gradient along a segment that shows its share of one along the whole link: from the segment's start, stretched
 * back by the link before it, to its end, stretched on by the link after it, the other way round going Reverse.
 */
export function linkGradient(ctx: CanvasRenderingContext2D, s: Segment, dir: number): CanvasGradient {
    const { start, end, t0, t1 } = s;
    const dx = (end[0] - start[0]) / (t1 - t0);
    const dy = (end[1] - start[1]) / (t1 - t0);
    const x0 = start[0] - dx * t0;
    const y0 = start[1] - dy * t0;
    const x1 = end[0] + dx * (1 - t1);
    const y1 = end[1] + dy * (1 - t1);
    return dir > 0 ? ctx.createLinearGradient(x0, y0, x1, y1) : ctx.createLinearGradient(x1, y1, x0, y0);
}

/** Lava Flow's sheath and its core: how far each ripples across the path and how fast its two waves run. */
const LAVA = [
    { ripple: 20, rate: 1, swell: 0.8 },
    { ripple: 20 * 0.7, rate: 1.2, swell: 0.6 },
];

/** 7. Lava Flow: a molten core in a glowing sheath, both rippling across the path downstream, and flickering embers. */
function lavaFlow(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { primary, secondary, accent } = s.pal;
    const { thickness } = L;
    const glowIntensity = L.glowIntensity * moving.glow;
    const cp = k.linkFlow;
    const tube = thickness * 7;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality * 12)));
    // The sheath, then the core, each offset across the path by its ripple at T.
    for (const layer of LAVA) {
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            const across = Math.sin(T * Math.PI * 3 - cp * layer.rate) * layer.ripple * Math.sin(T * Math.PI * 2 - cp * layer.swell);
            const x = here[0] - here[3] * across;
            const y = here[1] + here[2] * across;
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        ctx.lineCap = 'round';
        ctx.shadowColor = secondary;
        ctx.shadowBlur = glowIntensity * 1.5;
        if (layer === LAVA[0]) {
            ctx.strokeStyle = secondary;
            ctx.globalAlpha = 0.3 * moving.alpha;
            ctx.lineWidth = tube;
        } else {
            const gradient = linkGradient(ctx, s, L.direction);
            gradient.addColorStop(0, primary);
            gradient.addColorStop(0.4 + Math.sin(k.linkPhase) * 0.1, secondary);
            gradient.addColorStop(1, accent);
            ctx.strokeStyle = gradient;
            ctx.globalAlpha = moving.alpha;
            ctx.lineWidth = thickness * 5;
        }
        ctx.stroke();
    }

    const count = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.particleDensity * moving.density * 3));
    for (let i = 0; i < count; i++) {
        const T = wrap(i / count + cp * 0.5);
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        const along = Math.sin(T * Math.PI * 2) * (tube * 0.15);
        const across = Math.sin(T * Math.PI * 3 - cp) * (20 * 0.3) * Math.sin(T * Math.PI * 2 - cp) + Math.cos(T * Math.PI * 3) * (tube * 0.15);
        const x = here[0] + here[2] * along - here[3] * across;
        const y = here[1] + here[3] * along + here[2] * across;
        const r = thickness * (0.5 + Math.sin(cp + i) * 0.2);
        DOT.path(ctx, x, y, r, 0);
        ctx.globalAlpha = (0.6 + Math.sin(cp + i) * 0.4) * moving.alpha;
        shine(ctx, DOT, x, y, r, 0, accent, secondary, glowIntensity * 1.5);
    }
}

/** 8. Stellar Plasma: a snaking chain of plasma beads on a wave rolling toward the input, and sparks streaming along it. */
function stellarPlasma(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { primary, secondary, accent } = s.pal;
    const { thickness } = L;
    const glowIntensity = L.glowIntensity * moving.glow;
    const f = k.linkFlow;
    // A bead every 20 px or so; one at least, where v1 drew none under 20 px. Counted from the input, as v1 counted them.
    const segments = Math.floor(s.chain / 20) * L.quality * L.particleDensity * moving.density || 1;
    const first = (t: number) => (L.direction > 0 ? t < 0.5 : t > 0.5);
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const size = thickness * (0.5 + Math.sin(t * Math.PI * 2 + f) * 0.5);
        let u = s.local(1 - t);
        if (s.within(u)) {
            s.path.at(u, here);
            const y = here[1] + Math.sin(t * Math.PI * 4 + f) * 15;
            const color = first(t) ? primary : secondary;
            DOT.path(ctx, here[0], y, size, 0);
            ctx.globalAlpha = (0.7 - Math.abs(t - 0.5) * 0.3) * moving.alpha;
            shine(ctx, DOT, here[0], y, size, 0, color, color, glowIntensity);
        }
        if (i % 3) continue;
        const spark = wrap(t - f * 0.5);
        u = s.local(1 - spark);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        const y = here[1] + Math.sin(spark * Math.PI * 4 + f) * 15;
        DOT.path(ctx, here[0], y, size * 0.5, 0);
        ctx.globalAlpha = (0.6 - Math.abs(spark - 0.5) * 0.4) * moving.alpha;
        shine(ctx, DOT, here[0], y, size * 0.5, 0, accent, accent, glowIntensity * 0.5);
    }
}

/** Writes the point at segment s's own parameter u into `here`, by length along its path, so what flows keeps its pace in px. */
const along = (s: Segment, u: number) => s.path.find(u * s.path.length, here);

/** What grows out of the output and back into the input does so over its last px. */
const SLOT_PX = 12;
/** How far grown an element at fraction T of the link is: nothing at either end of the link, whole SLOT_PX in. */
const grown = (s: Segment, T: number) => Math.min(1, (T * s.chain) / SLOT_PX, ((1 - T) * s.chain) / SLOT_PX);

/** Merkaba Beads: px of link for each bead at Quality 1 and Density 1, and how fast they glide, in links per unit of flow. */
const BEAD_PX = 60;
const BEAD_RATE = 0.1;

/** 10. Merkaba Beads: glowing star tetrahedra with a core gliding along the link, each turning with the phase, grown out of the output and back into the input. */
function merkabaBeads(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { primary, secondary, accent } = s.pal;
    const glowIntensity = L.glowIntensity * moving.glow;
    const count = Math.max(1, Math.floor((s.chain * L.quality * L.particleDensity * moving.density) / BEAD_PX));
    ctx.globalAlpha = moving.alpha;
    for (let i = 0; i < count; i++) {
        const T = wrap((i + 0.5) / count + k.linkFlow * BEAD_RATE);
        const u = s.local(T);
        if (!s.within(u)) continue;
        along(s, u);
        const size = L.thickness * 3 * grown(s, T);
        ctx.lineWidth = size * 0.18;
        MERKABA.path(ctx, here[0], here[1], size, k.linkPhase);
        shine(ctx, MERKABA, here[0], here[1], size, k.linkPhase, primary, secondary, glowIntensity);
        ctx.shadowBlur = 0;
        DOT.path(ctx, here[0], here[1], size * 0.25, 0);
        ctx.fillStyle = accent;
        ctx.fill();
    }
}

/** DNA Helix 3D: a turn of the helix every PITCH radii along the link, and a rung every RUNG_PX px. */
const PITCH = 6.4;
const RUNG_PX = 12;
/** Each point of the strands along a segment: strand A's x and y, strand B's, and A's depth, from -1 at the back to 1 at the front, B's being its opposite. */
let helix = new Float64Array(5 * 128);
/** Each rung's middle and how far its half toward strand A reaches, and A's depth there. */
let rungs = new Float64Array(5 * 64);

/** Adds the stretches of the first `n` points of strand `strand` (0 or 1) on the near side if `near`, else the far side, to the current path. */
function strandPath(ctx: CanvasRenderingContext2D, n: number, strand: number, near: boolean): void {
    let open = false;
    for (let j = 0; j + 1 < n; j++) {
        if ((helix[5 * j + 4] + helix[5 * j + 9]) * (strand ? -1 : 1) > 0 !== near) {
            open = false;
            continue;
        }
        const o = 5 * j + 2 * strand;
        if (!open) ctx.moveTo(helix[o], helix[o + 1]);
        ctx.lineTo(helix[o + 5], helix[o + 6]);
        open = true;
    }
}

/**
 * 11. DNA Helix 3D: two strands winding round the path along its normals and turning with the phase; their far side
 * faint and fine, then rungs every RUNG_PX px whose halves are as deep as the strand each reaches, then their near side
 * bright and glowing most where it crosses the path in front. The far side and the rungs are a third of Thickness wide,
 * hairlines at the default.
 */
function dnaHelix3d(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { primary, secondary, accent } = s.pal;
    const { thickness } = L;
    const { path, u0, len } = s;
    const radius = 4 + thickness * 2;
    const pitch = PITCH * radius;
    const n = Math.max(2, Math.ceil((len * L.quality) / 8) + 1);
    if (helix.length < 5 * n) helix = new Float64Array(10 * n);
    for (let j = 0; j < n; j++) {
        path.find((j / (n - 1)) * path.length, here);
        const angle = (2 * Math.PI * (u0 + (j / (n - 1)) * len)) / pitch + k.linkPhase;
        const off = radius * Math.sin(angle);
        helix[5 * j] = here[0] - here[3] * off;
        helix[5 * j + 1] = here[1] + here[2] * off;
        helix[5 * j + 2] = here[0] + here[3] * off;
        helix[5 * j + 3] = here[1] - here[2] * off;
        helix[5 * j + 4] = Math.cos(angle);
    }
    const gap = RUNG_PX / moving.density;
    const first = Math.ceil(u0 / gap);
    const m = Math.max(0, Math.ceil((u0 + len) / gap) - first);
    if (rungs.length < 5 * m) rungs = new Float64Array(10 * m);
    for (let r = 0; r < m; r++) {
        const D = (first + r) * gap;
        path.find(((D - u0) / len) * path.length, here);
        const angle = (2 * Math.PI * D) / pitch + k.linkPhase;
        const off = radius * Math.sin(angle);
        rungs[5 * r] = here[0];
        rungs[5 * r + 1] = here[1];
        rungs[5 * r + 2] = -here[3] * off;
        rungs[5 * r + 3] = here[2] * off;
        rungs[5 * r + 4] = Math.cos(angle);
    }
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    strandPath(ctx, n, 0, false);
    strandPath(ctx, n, 1, false);
    ctx.strokeStyle = secondary;
    ctx.lineWidth = thickness / 3;
    ctx.globalAlpha = 0.4 * moving.alpha;
    ctx.stroke();
    ctx.strokeStyle = accent;
    for (let near = 0; near < 2; near++) {
        ctx.beginPath();
        for (let r = 0; r < m; r++) {
            const side = (rungs[5 * r + 4] > 0 ? 1 : -1) * (near ? 1 : -1);
            ctx.moveTo(rungs[5 * r], rungs[5 * r + 1]);
            ctx.lineTo(rungs[5 * r] + side * rungs[5 * r + 2], rungs[5 * r + 1] + side * rungs[5 * r + 3]);
        }
        ctx.globalAlpha = (near ? 0.7 : 0.3) * moving.alpha;
        ctx.stroke();
    }
    // The near side's glow, round each spot where strand A (at even half turns) or B crosses the path in front, each
    // strand's together: stamped from sprites in the motion layer, else cast by the near side's strokes, which glow()
    // leaves the shadow to.
    ctx.lineWidth = thickness * 1.1;
    ctx.globalAlpha = moving.alpha;
    const front = Math.ceil((2 * u0) / pitch + k.linkPhase / Math.PI);
    for (let from = front; from < front + 2; from++) {
        const color = from & 1 ? secondary : primary;
        for (let half = from; ; half += 2) {
            const D = ((half * Math.PI - k.linkPhase) * pitch) / (2 * Math.PI);
            if (D >= u0 + len) break;
            path.find(((D - u0) / len) * path.length, here);
            glow(ctx, DOT, here[0], here[1], radius * 0.4, 0, color, color, L.glowIntensity * moving.glow);
        }
    }
    ctx.beginPath();
    strandPath(ctx, n, 0, true);
    // B in the same stroke when it is A's colour, as it is but for custom colours.
    if (secondary !== primary) {
        ctx.strokeStyle = ctx.shadowColor = primary;
        ctx.stroke();
        ctx.beginPath();
    }
    strandPath(ctx, n, 1, true);
    ctx.strokeStyle = ctx.shadowColor = secondary;
    ctx.stroke();
}

/**
 * Comet Trails: px of link for each comet at Quality 1 and Density 1, how fast they fly, in links per unit of flow, and
 * how far a comet strays from even spacing, in spaces; how long their tails are in px, on links as long at least, and
 * the tails' layers, the longest and faintest first: the share of the tail each covers, its width at the head × the
 * head's, and its alpha.
 */
const COMET_PX = 120;
const COMET_RATE = 0.125;
const STRAY = 0.4;
const TAIL_PX = 100;
const LAYERS = [[1, 1, 0.2], [0.6, 0.75, 0.3], [0.3, 0.5, 0.5]];
/** The palette colour each layer takes. */
const LAYER_COLORS = ['primary', 'secondary', 'accent'] as const;
/** A comet head's hot core. */
const WHITE = '#ffffff';
/** A tail's points along a segment and the normal there: x, y, nx, ny each. */
let tail = new Float64Array(4 * 32);

/**
 * Fills the part of a comet's tail on segment s: from its head `head` px along the link back `length` px, the other way
 * for a negative length, `width` px to each side at the head and tapering to nothing at the tip.
 */
function trail(ctx: CanvasRenderingContext2D, s: Segment, head: number, length: number, width: number): void {
    const tip = head - length;
    const from = Math.max(Math.min(head, tip), s.u0);
    const to = Math.min(Math.max(head, tip), s.u0 + s.len);
    if (from >= to) return;
    const n = Math.max(2, Math.ceil((to - from) / 4) + 1);
    if (tail.length < 4 * n) tail = new Float64Array(8 * n);
    for (let j = 0; j < n; j++) {
        const D = from + ((to - from) * j) / (n - 1);
        s.path.find(((D - s.u0) / s.len) * s.path.length, here);
        const w = width * Math.sqrt((D - tip) / length);
        tail[4 * j] = here[0];
        tail[4 * j + 1] = here[1];
        tail[4 * j + 2] = -here[3] * w;
        tail[4 * j + 3] = here[2] * w;
    }
    ctx.beginPath();
    for (let j = 0; j < n; j++) ctx.lineTo(tail[4 * j] + tail[4 * j + 2], tail[4 * j + 1] + tail[4 * j + 3]);
    for (let j = n - 1; j >= 0; j--) ctx.lineTo(tail[4 * j] - tail[4 * j + 2], tail[4 * j + 1] - tail[4 * j + 3]);
    ctx.closePath();
    ctx.fill();
}

/**
 * 12. Comet Trails: bright heads flying along the link with tails that taper and fade behind them along the path, as
 * long as they fly fast, each head grown out of the output and back into the input, whose tail trails on into it.
 */
function cometTrails(ctx: CanvasRenderingContext2D, s: Segment, k: Moment): void {
    const { pal } = s;
    const count = Math.max(1, Math.floor((s.chain * L.quality * L.particleDensity * moving.density) / COMET_PX));
    const radius = L.thickness * 2;
    // Behind the heads, the way they fly: toward the output going Forward; no longer than the link, so that only the
    // comet a lap ahead trails onto it too.
    const length = Math.min(TAIL_PX, s.chain) * k.linkDir;
    const ahead = length < 0 ? -1 : 1;
    const core = lighter(pal.accent);
    for (let i = 0; i < count; i++) {
        const T = wrap((i + 0.5 + STRAY * (noise(i) - 0.5)) / count + k.linkFlow * COMET_RATE);
        ctx.shadowBlur = 0;
        // The comet, and the one a lap ahead, which has flown on past the end of the link that its tail trails into.
        for (let lap = 0; lap < 2; lap++) {
            const head = (T + lap * ahead) * s.chain;
            for (let l = 0; l < LAYERS.length; l++) {
                ctx.fillStyle = pal[LAYER_COLORS[l]];
                ctx.globalAlpha = LAYERS[l][2] * moving.alpha;
                trail(ctx, s, head, length * LAYERS[l][0], radius * LAYERS[l][1]);
            }
        }
        const u = s.local(T);
        if (!s.within(u)) continue;
        along(s, u);
        const r = radius * grown(s, T);
        ctx.globalAlpha = moving.alpha;
        DOT.path(ctx, here[0], here[1], r, 0);
        shine(ctx, DOT, here[0], here[1], r, 0, core, pal.accent, L.glowIntensity * moving.glow * 2);
        ctx.shadowBlur = 0;
        DOT.path(ctx, here[0], here[1], r * 0.5, 0);
        ctx.fillStyle = WHITE;
        ctx.fill();
    }
}

/** The animations that stroke glowing lines while they move: Sacred Flow's ribbon, Quantum Field's filaments, Cosmic Weave's and DNA Helix's strands, and Lava Flow's tube. */
export const STROKES = new Set([1, 3, 4, 6, 7]);

/** What each animation draws over its base while it moves, but Classic Flow, which moves only its markers. */
export const MOVING: Record<number, (ctx: CanvasRenderingContext2D, s: Segment, k: Moment) => void> = {
    1: sacredFlow,
    2: crystalStream,
    3: quantumField,
    4: cosmicWeave,
    5: energyPulse,
    6: dnaHelix,
    7: lavaFlow,
    8: stellarPlasma,
    10: merkabaBeads,
    11: dnaHelix3d,
    12: cometTrails,
};
