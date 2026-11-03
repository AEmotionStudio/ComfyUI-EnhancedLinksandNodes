/**
 * The four node effects as v1 drew them (old_node_animations.js:1203-1897),
 * at v1's energy, Intensity × 1.5, and with their bloom from Animation.Glow.
 * Gentle Pulse breathes a light over the node with fireflies around it; Neon
 * Nexus wraps the body in a flickering neon tube with a scan line, beside a
 * lattice of spinning hexagons and a dashed energy grid; Cosmic Ripple sends
 * rings out from the centre inside a corona of motes; Sacred Rosette, which v1
 * called Flower of Life, turns a rosette with dots circling its points. A
 * selected node takes v1's glowing frame (:2104-2113), and the hover outline,
 * which in v1 only Gentle Pulse drew, frames the others too. With Show base effect off a style draws its own
 * particles alone, as v1's Particles Only did.
 *
 * An effect is drawn in two parts, one each side of the node's edge: what falls
 * around the body goes under every node, and what falls on it over its fill.
 * Each element is drawn in the parts it reaches, so most are drawn once; both
 * sides at once draw every element, in v1's order. While still (Static mode, a
 * run that holds them, reduced motion) an effect takes v1's still pose.
 *
 * Where v3 draws differently from v1 on purpose: Gentle Pulse's fireflies
 * flicker by a hash of the time instead of Math.random(), so both parts draw a
 * firefly at one size; Cosmic Ripple's rings ripple going Reverse too, where
 * v1's vanished; and Sacred Rosette closes each ring of chords, which v1 left
 * open, draws its chords and each layer's circles of a colour as one path and
 * its dots' glows from sprites, and its particles circle its pattern without
 * the base effect, where v1's fell into its centre.
 *
 * Nodes of one palette and size make the same gradients and colours at one
 * moment, so each side's part makes them once a frame for them all, and once
 * only while the effects hold still. Perf.Adaptive thins the particles out,
 * then holds the effects still.
 *
 * @module nodes/effects
 */

import { N, NODE_ANIMATION_OPTIONS, revision } from '@/core/settings';
import { HELD, THIN, TURN, adaptive, env, heldByRun } from '@/core/engine';
import { nodePalette, particleColour, translucent, type NodePalette } from '@/core/colors';
import { hash, noise, rng } from '@/fx/particles';
import type { ComfyNode } from '@/core/types';

/** Where a node keeps the Node FX style its menu gave it (ui/menus.ts). */
export const OWN_STYLE = 'enhanced_fx_style';

const STYLES = new Set<unknown>(NODE_ANIMATION_OPTIONS.map((option) => option.value));

/** The Node FX style a node was given, if it is one: a workflow may hold anything there. */
export function ownStyle(node: { properties: Record<string, unknown> }): number | undefined {
    const style = node.properties[OWN_STYLE];
    return STYLES.has(style) ? (style as number) : undefined;
}

/** The style a node's effect takes: its own, else Animate. */
export const effectOf = (node: { properties: Record<string, unknown> }): number => ownStyle(node) ?? N.animate;

/** The node clock an effect is drawn at (core/engine.ts). */
interface NodeMoment {
    nodePhase: number;
    particleTime: number;
    nodeTime: number;
}

/** v1's pose for still effects and titles: State.staticPhase (old_node_animations.js:56), at time 0, where v1's first still frame was. */
export const STILL_NODE: NodeMoment = { nodePhase: Math.PI / 4, particleTime: 0, nodeTime: 0 };

/** Whether node effects hold still: in Static mode, while this client's run holds them (Pause.Mode), with reduced motion, and while Perf.Adaptive holds them. */
export const holdsStill = () => N.staticMode || heldByRun(N.pauseDuringRender) || env.reducedMotion || adaptive.level >= HELD;

/** The sides of a node's edge: around its body, drawn under every node, and on it, drawn over its fill. */
export const UNDER = 1;
export const OVER = 2;

/** LGraphEventMode.NEVER (muted) and BYPASS, which fade a node and its effect. */
export const [NEVER, BYPASS] = [2, 4];

/**
 * What a call draws: the elements on `sides` of the node's edge, the edge of the shape native fills, from (x0, y0) to
 * (x1, y1) in node space with corners `round` px round, or -1 for a circle. Both sides draw every element, wherever
 * it falls, as v1 drew an effect.
 */
export interface Part {
    sides: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    round: number;
}

/**
 * The call being drawn: its part; the alpha native draws the node at, which every alpha the effect sets is scaled by;
 * whether it holds still; whether the node is hovered or selected with the hover outline on; and what its particle
 * counts are scaled by, a half while Perf.Adaptive thins them.
 */
let part: Part | undefined;
let fade = 1;
let held = false;
let outlined = false;
let thin = 1;

/**
 * What the effects made on a context for the nodes of a palette and a size at a moment: their gradients and colours, by
 * the sides of the edge a call drew and by slot. Valid while the moment, the pose and the thinning are those they were
 * made at.
 */
interface Made {
    phase: number;
    particles: number;
    time: number;
    held: boolean;
    thin: number;
    slots: (CanvasGradient | string | undefined)[][];
}

/**
 * What was made on each context, by palette, width and height, and the settings it was made for: dropped when a setting
 * changes, or once SIZES are kept, as a node being resized makes a size a frame.
 */
interface Store {
    since: number;
    sizes: number;
    made: Map<NodePalette, Map<number, Map<number, Made>>>;
}
const stores = new WeakMap<CanvasRenderingContext2D, Store>();
const SIZES = 256;
/** What the call being drawn made and keeps. */
let mine: (CanvasGradient | string | undefined)[];

/** Finds or makes what the nodes of `pal` with a w × h body make on ctx at moment k, for the sides of the part drawn. */
function makes(ctx: CanvasRenderingContext2D, pal: NodePalette, w: number, h: number, k: NodeMoment, sides: number): (CanvasGradient | string | undefined)[] {
    let store = stores.get(ctx);
    if (!store) stores.set(ctx, (store = { since: revision, sizes: 0, made: new Map() }));
    if (store.since !== revision || store.sizes > SIZES) {
        store.made.clear();
        store.since = revision;
        store.sizes = 0;
    }
    let byWidth = store.made.get(pal);
    if (!byWidth) store.made.set(pal, (byWidth = new Map()));
    let byHeight = byWidth.get(w);
    if (!byHeight) byWidth.set(w, (byHeight = new Map()));
    let m = byHeight.get(h);
    if (!m) {
        byHeight.set(h, (m = { phase: NaN, particles: NaN, time: NaN, held: false, thin: 1, slots: [[], [], [], []] }));
        store.sizes++;
    }
    if (m.phase !== k.nodePhase || m.particles !== k.particleTime || m.time !== k.nodeTime || m.held !== held || m.thin !== thin) {
        m.phase = k.nodePhase;
        m.particles = k.particleTime;
        m.time = k.nodeTime;
        m.held = held;
        m.thin = thin;
        for (const slots of m.slots) slots.fill(undefined);
    }
    return m.slots[sides];
}

/** What the call being drawn made in `slot`, if anything yet. */
const kept = <T extends CanvasGradient | string>(slot: number) => mine[slot] as T | undefined;

/** Keeps `value` in `slot` for the nodes like the one being drawn. */
function keep<T extends CanvasGradient | string>(slot: number, value: T): T {
    mine[slot] = value;
    return value;
}

/** The slots: the hover outline's colours, then each effect's, its elements' after its fixed ones. */
const [OUTLINE_SHADOW, OUTLINE_STROKE] = [0, 1];
const [LIGHT, HALO, FIREFLY_SHADOW, FIREFLIES] = [2, 3, 4, 5];
const [SCAN, PULSE, PULSE_STROKE, PULSE_SHADOW, HEXAGONS] = [2, 3, 4, 5, 6];
const [RING_SHADOW, RINGS, MOTES] = [2, 3, 8];
const [CORE, DOTS] = [2, 3];
const [SPARKS] = [2];
const [TINT, GLOSS, BUBBLES] = [2, 3, 4];
const [CHIP_SPARKS] = [2];
const [CURTAINS, MOTES_UP] = [2, 5];
const [FLAMES, WARMTH, EMBERS] = [2, 3, 4];

/** The saves an effect has not restored yet, which a failure leaves to drawNodeFx to restore. */
let depth = 0;

function save(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    depth++;
}

function restore(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
    depth--;
}

/** Whether what covers the box from (x0, y0) to (x1, y1) in node space shows in the part being drawn. */
function shows(x0: number, y0: number, x1: number, y1: number): boolean {
    const p = part!;
    if (p.sides !== UNDER && p.sides !== OVER) return true;
    if (p.round < 0) return true;
    if (x1 <= p.x0 || x0 >= p.x1 || y1 <= p.y0 || y0 >= p.y1) return p.sides === UNDER;
    const r = p.round;
    const corner = (x0 < p.x0 + r || x1 > p.x1 - r) && (y0 < p.y0 + r || y1 > p.y1 - r);
    const inside = x0 >= p.x0 && x1 <= p.x1 && y0 >= p.y0 && y1 <= p.y1 && !corner;
    return !inside || p.sides === OVER;
}

/** Whether a disc that reaches `r` from (x, y) shows. A glow reaches three standard deviations, 1.5 × its blur, past its shape. */
const circle = (x: number, y: number, r: number) => shows(x - r, y - r, x + r, y + r);

const pales = new Map<string, string>();
let palesSince = -1;

/**
 * A colour at `alpha` as v1's Gentle Pulse drew it (old_node_animations.js:1231-1247): its own withAlpha read a hex
 * colour's digits two by two and took a pair that read 0 as 255, so its #ffb300 glowed #ffb3ff and its #fb00ff #fbffff.
 * Kept, as it is what v1 showed. Particle colours in hsl() keep their own hue, which v1 misread as yellow.
 */
function pale(colour: string, alpha: number): string {
    if (colour.charCodeAt(0) !== 35) return translucent(colour, alpha);
    if (palesSince !== revision) {
        pales.clear();
        palesSince = revision;
    }
    let start = pales.get(colour);
    if (start === undefined) {
        const pair = (i: number) => parseInt(colour.slice(i, i + 2), 16) || 255;
        pales.set(colour, (start = `rgba(${pair(1)}, ${pair(3)}, ${pair(5)}, `));
    }
    return `${start}${alpha})`;
}

/** The hover outline, Gentle Pulse's in v1 (old_node_animations.js:1254-1264): a rectangle round the body, glowing more while selected. */
function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, selected: boolean | undefined, colour: (colour: string, alpha: number) => string): void {
    save(ctx);
    const blur = 15 * N.animationGlow;
    ctx.shadowColor = kept<string>(OUTLINE_SHADOW) ?? keep(OUTLINE_SHADOW, colour(N.colorHover, 0.5));
    ctx.shadowBlur = selected ? blur * 1.5 : blur;
    ctx.strokeStyle = kept<string>(OUTLINE_STROKE) ?? keep(OUTLINE_STROKE, colour(N.colorHover, 0.7));
    ctx.lineWidth = 2;
    ctx.globalAlpha = fade;
    ctx.strokeRect(x, y, w, h);
    restore(ctx);
}

/** 1. Gentle Pulse (old_node_animations.js:1203-1398): a light breathing on the node, white at its core, and fireflies about it. */
function gentlePulse(ctx: CanvasRenderingContext2D, node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { quality, animationGlow: glow, animationSize: size, particleSpeed: speed, particleIntensity: motion } = N;
    const phase = k.nodePhase;
    // v1's ParticleController phase.
    const time = held ? phase : TURN * k.particleTime;
    const radius = Math.max(w, h) * (0.5 + quality * 0.1) * size;
    const cx = w / 2;
    const cy = h / 2;
    save(ctx);
    ctx.translate(cx, cy);

    if (outlined) outline(ctx, -cx, -cy, w, h, node.selected, pale);

    let blur = 0;
    if (!only) {
        // Speed counts twice, as in v1.
        const breathe = Math.pow(Math.sin(held ? phase : phase * 0.375 * N.direction * N.animationSpeed), 2);
        const pulse = 0.4 + 0.4 * breathe * (N.intensity * 1.5 * 0.75);
        const inner = radius * pulse;
        const outer = radius * (1.2 + glow * 0.4) * pulse;
        if (circle(cx, cy, inner)) {
            const alpha = 0.2 * glow * (0.5 + breathe * 0.5);
            const gradient = kept<CanvasGradient>(LIGHT) ?? keep(LIGHT, light(ctx, inner, alpha, pal));
            ctx.beginPath();
            ctx.arc(0, 0, inner, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = Math.min(0.2 + Math.abs(breathe) * 0.3 + glow * 0.2, 1) * fade;
            ctx.fill();
        }
        if (circle(cx, cy, outer)) {
            const alpha = 0.1 * glow * (0.5 + breathe * 0.5);
            const gradient = kept<CanvasGradient>(HALO) ?? keep(HALO, halo(ctx, radius * 0.6 * pulse, outer, alpha, pal));
            ctx.beginPath();
            ctx.arc(0, 0, outer, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = Math.min(0.15 + Math.abs(breathe) * 0.2 + glow * 0.15, 1) * fade;
            ctx.fill();
        }
        // Above Fast quality the fireflies glow.
        if (quality > 1) {
            ctx.shadowColor = kept<string>(FIREFLY_SHADOW) ?? keep(FIREFLY_SHADOW, pale(pal.secondary, 0.3));
            ctx.shadowBlur = blur = 10 * glow * (quality * 0.5);
        }
    }

    if (N.particleShow) {
        const { particleGlow: dotGlow } = N;
        const count = Math.floor((8 + quality * 2) * N.particleDensity * thin);
        const base = (4 + quality) * size * N.particleSize;
        const wobble = quality > 1 ? 12 : 6;
        const rate = held ? 0 : TURN * speed * speed;
        // v1 took Math.random() for each firefly's flicker on each frame it drew, about 30 a second.
        const tick = Math.floor(k.nodeTime * 30) * 4096;
        for (let i = 0; i < count; i++) {
            const offset = i * (Math.PI * 2 / count);
            const pace = held ? 1 : (0.5 + Math.sin(i) * 0.25) * motion * speed;
            const turned = held ? phase + offset : time * pace + offset;
            const orbit = radius * (0.8 +
                Math.sin(held ? phase + i : time * 0.2 * speed + i) * 0.25 +
                Math.cos(held ? phase + i * 0.7 : time * 0.3 * speed + i * 0.7) * 0.25);
            const angle = turned + (i * Math.PI * 2 / count);
            const torus = Math.sin(time * 0.3 * speed + i) * (motion * 2.0);
            const jitterX = held ? 0 : Math.sin(time * 3 * speed + i) * 1.2 * motion + Math.cos(time * 2 * speed + i * 0.5) * 0.5 * motion;
            const jitterY = held ? 0 : Math.cos(time * 2.5 * speed + i) * 1.2 * motion + Math.sin(time * 1.5 * speed + i * 0.7) * 0.5 * motion;
            const x = Math.cos(angle) * (orbit + torus) + Math.sin(held ? phase + i : time * 0.2 * speed + i) * wobble + jitterX;
            // Drifting up by 0.3 of its orbit.
            const y = Math.sin(angle) * (orbit + torus) - orbit * 0.3 + Math.cos(held ? phase + i : time * 0.15 * speed + i) * wobble + jitterY;
            const s = held ? base : base * (0.7 + Math.sin(time * 0.5 * speed + i) * 0.4 + noise(tick + i) * 0.3);
            if (!circle(cx + x, cy + y, s * 2.0 + 1.5 * blur)) continue;

            const colour = kept<string>(FIREFLIES + 2 * i) ?? keep(FIREFLIES + 2 * i, particleColour(pal, i, time * speed, rate));
            const gradient = kept<CanvasGradient>(FIREFLIES + 2 * i + 1) ?? keep(FIREFLIES + 2 * i + 1, firefly(ctx, x, y, s * 2.0, colour, dotGlow));
            const blinkOffset = Math.abs((Math.sin(i * 12.9898) * 43758.5453) % (2 * Math.PI));
            const blinkSpeed = 1.2 + Math.sin(i * 0.7) * 0.6;
            const blink = held ? 0.8 : 0.4 + 0.8 * Math.pow(Math.sin(time * blinkSpeed * speed + blinkOffset), 2);
            const alpha = Math.min(blink, 1) * dotGlow;

            ctx.beginPath();
            ctx.arc(x, y, s * 2.0, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.globalAlpha = alpha * 0.8 * fade;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = colour;
            ctx.globalAlpha = Math.min(alpha * 1.5, 1) * fade;
            ctx.fill();
        }
    }
    restore(ctx);
}

/** Gentle Pulse's light, `r` out: white at its core, then the effect's colours, at `alpha`. */
function light(ctx: CanvasRenderingContext2D, r: number, alpha: number, pal: NodePalette): CanvasGradient {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    gradient.addColorStop(0, pale('#ffffff', Math.min(alpha + 0.15, 1)));
    gradient.addColorStop(0.3, pale(pal.primary, alpha));
    gradient.addColorStop(0.7, pale(pal.secondary, alpha * 0.6));
    gradient.addColorStop(1, pale(pal.accent, 0));
    return gradient;
}

/** The halo round Gentle Pulse's light, from `r0` out to `r1`, at `alpha`. */
function halo(ctx: CanvasRenderingContext2D, r0: number, r1: number, alpha: number, pal: NodePalette): CanvasGradient {
    const gradient = ctx.createRadialGradient(0, 0, r0, 0, 0, r1);
    gradient.addColorStop(0, pale(pal.secondary, alpha));
    gradient.addColorStop(0.6, pale(pal.accent, alpha * 0.5));
    gradient.addColorStop(1, pale(pal.accent, 0));
    return gradient;
}

/** A firefly's glow about (x, y), `r` out, in `colour` at `alpha`. */
function firefly(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, alpha: number): CanvasGradient {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, pale(colour, 0.8 * alpha));
    gradient.addColorStop(0.4, pale(colour, 0.4 * alpha));
    gradient.addColorStop(1, pale(colour, 0));
    return gradient;
}

/** Neon Nexus's scan line, a band of white 20 px tall about y. */
function scanLine(ctx: CanvasRenderingContext2D, y: number): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, y - 10, 0, y + 10);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    return gradient;
}

/** Neon Nexus's white pulse about (x, y), `r` out, at `pulse`. */
function pulseLight(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pulse: number): CanvasGradient {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(255,255,255,${0.15 * pulse})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    return gradient;
}

/** Neon Nexus's three faint hologram outlines. */
const HOLOGRAM = [0, 1, 2].map((i) => `hsl(${(i * 60) % 360}, 80%, 75%)`);
/** Its energy grid's dashes. */
const DASH = [5, 3];

/** A rectangle with quadratic corners, as a new path: v1's roundedRect (old_node_animations.js:1630-1642). */
function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

/**
 * 2. Neon Nexus (old_node_animations.js:1400-1643): a four-layer neon tube round the body in a faint hologram, a scan
 * line sweeping it, a lattice of spinning hexagons down its left edge beside a marching energy grid, and a white pulse
 * while hovered or selected.
 */
function neonNexus(ctx: CanvasRenderingContext2D, node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { primary, secondary, accent } = pal;
    const { animationGlow: glow, animationSize: size, particleGlow: dotGlow, particleSpeed: speed } = N;
    const intensity = N.intensity * 1.5;
    const phase = k.nodePhase;
    const time = held ? phase : phase * speed;
    const radius = Math.min(w, h) * 0.08;
    const line = Math.max(w, h) * 0.0075 * size;
    const grid = Math.min(w, h) * 0.4 * size;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'transparent';

    if (!only) {
        for (let i = 0; i < 3; i++) {
            save(ctx);
            ctx.globalAlpha = (0.2 - i * 0.05) * fade;
            ctx.strokeStyle = HOLOGRAM[i];
            ctx.lineWidth = line * 0.4;
            roundedRect(ctx, -i * 2, -i * 2, w + i * 4, h + i * 4, radius + i * 1);
            ctx.stroke();
            restore(ctx);
        }

        const flicker = held ? 1.0 : 0.95 + 0.05 * Math.sin(phase * 0.3 * N.direction);
        for (let i = 0; i < 4; i++) {
            save(ctx);
            ctx.lineWidth = line * (1 + i * 0.3);
            const colour = i === 0 ? primary : i === 1 ? secondary : i === 2 ? accent : 'rgba(255, 255, 255, 0.4)';
            ctx.strokeStyle = colour;
            ctx.shadowColor = colour;
            ctx.shadowBlur = (i + 1) * 12 * intensity * glow;
            const opacity = 0.95 - i * 0.15;
            ctx.globalAlpha = (held ? opacity : opacity * flicker) * fade;
            roundedRect(ctx, 0, 0, w, h, radius);
            ctx.stroke();
            if (i === 0) {
                ctx.globalAlpha = (held ? 0.3 : 0.3 * flicker) * fade;
                ctx.lineWidth = line * 0.8;
                ctx.shadowBlur = 20 * intensity * glow;
                roundedRect(ctx, 0, 0, w, h, radius);
                ctx.stroke();
            }
            restore(ctx);
        }

        const scan = h * (Math.sin(phase * 2) * 0.5 + 0.5);
        if (!held && shows(0, scan - 10, w, scan + 10)) {
            ctx.fillStyle = kept<CanvasGradient>(SCAN) ?? keep(SCAN, scanLine(ctx, scan));
            ctx.fillRect(0, scan - 10, w, 20);
        }
    }

    if (N.particleShow) {
        const spacing = grid / 4;
        const base = 2 * N.particleSize;
        const rate = held ? 0 : TURN * N.animationSpeed * speed;
        for (let i = 0; i < 70; i++) {
            const col = i % 5;
            const row = Math.floor(i / 5);
            const x = (col - 2) * spacing + Math.cos(phase + col) * 2;
            const y = (row - 2) * spacing + Math.sin(phase + row) * 2;
            const s = base + Math.sin(phase * 2 + i) * (base * 0.3);
            if (!circle(x, y, s + 1.5 * 5 * dotGlow)) continue;
            const colour = kept<string>(HEXAGONS + i) ?? keep(HEXAGONS + i, particleColour(pal, i, time, rate));
            save(ctx);
            ctx.translate(x, y);
            ctx.rotate(phase + (i * Math.PI / 8));
            ctx.fillStyle = colour;
            ctx.globalAlpha = (0.4 + Math.sin(phase * 3 + i) * 0.2) * dotGlow * fade;
            ctx.shadowColor = colour;
            ctx.shadowBlur = 5 * dotGlow;
            ctx.beginPath();
            for (let side = 0; side < 6; side++) {
                const angle = (side * Math.PI / 3) + phase;
                const corner = s * (0.8 + Math.sin(phase * 5 + side) * 0.2);
                ctx.lineTo(Math.cos(angle) * corner, Math.sin(angle) * corner);
            }
            ctx.closePath();
            ctx.fill();
            restore(ctx);
        }

        if (!only) {
            save(ctx);
            ctx.strokeStyle = primary;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2 * dotGlow * fade;
            ctx.setLineDash(DASH);
            ctx.lineDashOffset = phase * 10;
            const middle = h / 5;
            const left = -grid * 0.5;
            for (let i = -1; i <= 1; i += 0.5) {
                if (shows(left + i * grid - 0.5, middle - grid, left + i * grid + 0.5, middle + grid)) {
                    ctx.beginPath();
                    ctx.moveTo(left + (i * grid), middle - grid);
                    ctx.lineTo(left + (i * grid), middle + grid);
                    ctx.stroke();
                }
                if (shows(left - grid, middle + i * grid - 0.5, left + grid, middle + i * grid + 0.5)) {
                    ctx.beginPath();
                    ctx.moveTo(left - grid, middle + (i * grid));
                    ctx.lineTo(left + grid, middle + (i * grid));
                    ctx.stroke();
                }
            }
            restore(ctx);
        }
    }

    if ((node.selected || node.mouseOver) && !only) {
        save(ctx);
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 0.5 + 0.5 * Math.sin(phase * 3);
        ctx.fillStyle = kept<CanvasGradient>(PULSE) ?? keep(PULSE, pulseLight(ctx, w / 2, h / 2, Math.max(w, h) * 0.7, pulse));
        roundedRect(ctx, 0, 0, w, h, radius);
        ctx.fill();
        ctx.strokeStyle = kept<string>(PULSE_STROKE) ?? keep(PULSE_STROKE, `rgba(255,255,255,${0.7 * pulse})`);
        ctx.lineWidth = line * 2;
        ctx.shadowColor = kept<string>(PULSE_SHADOW) ?? keep(PULSE_SHADOW, `rgba(255,255,255,${0.5 * pulse})`);
        ctx.shadowBlur = 15 * intensity;
        roundedRect(ctx, 0, 0, w, h, radius);
        ctx.stroke();
        restore(ctx);
    }
}

/** 3. Cosmic Ripple (old_node_animations.js:1645-1748): five rings blooming from the centre, inside a turning corona of motes. */
function cosmicRipple(ctx: CanvasRenderingContext2D, _node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { animationGlow: glow, particleGlow: dotGlow, particleIntensity: motion } = N;
    const cx = w / 2;
    const cy = h / 2;

    if (!only) {
        const most = Math.max(1, Math.min(w, h) * 0.7 * N.animationSize);
        const intensity = N.intensity * 1.5;
        // v1's % kept the phase's sign, so going Reverse, which takes the phase below 0, every ring vanished.
        const ripple = Math.abs(k.nodePhase) * 0.8;
        for (let i = 0; i < 5; i++) {
            const at = (ripple - i * 0.2) % 1;
            const r = Math.max(5, most * at);
            if (!(r > 5 && r < most)) continue;
            const blur = Math.max(2, 15 * (1 - at) * glow);
            const line = Math.max(1, 3 * intensity * (1 - at));
            if (!circle(cx, cy, r + line / 2 + 1.5 * blur)) continue;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = kept<CanvasGradient>(RINGS + i) ?? keep(RINGS + i, ring(ctx, cx, cy, r, Math.max(0, 1 - at), pal));
            ctx.lineWidth = line;
            ctx.shadowColor = kept<string>(RING_SHADOW) ?? keep(RING_SHADOW, translucent(pal.secondary, 0.5));
            ctx.shadowBlur = blur;
            ctx.stroke();
        }
    }

    if (N.particleShow) {
        const count = Math.floor(Math.min(100, 30 + Math.floor(motion * 20)) * N.particleDensity * thin);
        const corona = Math.max(1, Math.max(w, h) * 0.7);
        const time = k.nodeTime;
        for (let i = 0; i < count; i++) {
            // v1 turned the corona by its time × Particle.Speed × Direction: the particle time.
            const angle = ((i / count) * Math.PI * 2) + k.particleTime;
            const spread = Math.max(0.1, 0.8 + Math.sin(time * 0.5 + i) * 0.2 * motion);
            const x = (Math.cos(angle) * corona * spread) + cx;
            const y = (Math.sin(angle) * corona * spread) + cy;
            const s = Math.max(1, 2 * N.particleSize + Math.sin(time * 1.5 + i) * 1.5 * motion);
            const trail = Math.max(1, s * 2);
            if (!circle(x, y, trail + 1.5 * 15 * dotGlow)) continue;
            const slot = MOTES + 5 * i;
            const colour = kept<string>(slot) ?? keep(slot, particleColour(pal, i, time, 1));

            ctx.fillStyle = kept<CanvasGradient>(slot + 1) ?? keep(slot + 1, mote(ctx, x, y, trail, colour, dotGlow));
            ctx.shadowColor = kept<string>(slot + 2) ?? keep(slot + 2, translucent(colour, dotGlow * 0.5));
            ctx.shadowBlur = 10 * dotGlow;
            ctx.beginPath();
            ctx.arc(x, y, trail, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = kept<string>(slot + 3) ?? keep(slot + 3, translucent(colour, 0.7));
            ctx.shadowColor = kept<string>(slot + 4) ?? keep(slot + 4, translucent(colour, dotGlow));
            ctx.shadowBlur = 15 * dotGlow;
            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/** A ripple of Cosmic Ripple about (x, y), `r` out, at `alpha`. */
function ring(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number, pal: NodePalette): CanvasGradient {
    const gradient = ctx.createLinearGradient(x - r, y, x + r, y);
    gradient.addColorStop(0, translucent(pal.secondary, alpha * 0.8));
    gradient.addColorStop(0.5, translucent(pal.primary, alpha));
    gradient.addColorStop(1, translucent(pal.accent, alpha * 0.8));
    return gradient;
}

/** A mote's glow about (x, y), `r` out, in `colour` at `alpha`. */
function mote(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, alpha: number): CanvasGradient {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, translucent(colour, 0.7 * alpha));
    gradient.addColorStop(1, translucent(colour, 0));
    return gradient;
}

/** Sacred Rosette's white core about (x, y), `r` out, at `pulse`. */
function core(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, pulse: number): CanvasGradient {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`);
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return gradient;
}

/** Sacred Rosette's points: its centre, then each ring's circles, 6 to a ring more than the ring inside it; 127 at Quality 3. */
const xs = new Float64Array(127);
const ys = new Float64Array(127);
/** Where its dots are, which they are kept in to glow together; and the same array, twice as long. */
let dotX = new Float64Array(1024);
let dotY = new Float64Array(1024);
const grown = (a: Float64Array) => {
    const b = new Float64Array(2 * a.length);
    b.set(a);
    return b;
};

/**
 * 4. Sacred Rosette, v1's Flower of Life (old_node_animations.js:1750-1897): a pulsing circle in the centre ringed by
 * layers of smaller circles, each layer's joined round by faint chords, framed by a turning hexagon round a white core,
 * with dots circling every circle. Every chord is one stroke, and each layer's circles of a colour another.
 */
function sacredRosette(ctx: CanvasRenderingContext2D, _node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { primary, secondary, accent } = pal;
    const { quality, particleGlow: dotGlow, particleIntensity: motion, particleSpeed: speed } = N;
    const intensity = N.intensity * 1.5;
    const cx = w / 2;
    const cy = h / 2;
    const phase = k.nodePhase;
    const time = held ? phase : phase * speed;
    const radius = Math.min(w, h) * 0.056 * intensity * N.animationSize;
    const layers = Math.max(2, Math.floor(quality * 2));
    const rotation = phase * 0.2;
    const pulse = 0.8 + Math.sin(phase * 1.5) * 0.2;

    xs[0] = cx;
    ys[0] = cy;
    let n = 1;
    for (let layer = 1; layer <= layers; layer++) {
        const circles = layer * 6;
        for (let i = 0; i < circles; i++, n++) {
            const angle = (i / circles) * Math.PI * 2 + rotation;
            xs[n] = cx + Math.cos(angle) * (radius * 2) * layer;
            ys[n] = cy + Math.sin(angle) * (radius * 2) * layer;
        }
    }

    if (!only) {
        const blur = 15 * intensity * N.animationGlow;
        const reach = 1 + 1.5 * blur;
        // Every line glows in the primary colour, and the core too.
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2;
        ctx.shadowColor = primary;
        ctx.shadowBlur = blur;
        if (circle(cx, cy, radius * pulse + reach)) {
            ctx.beginPath();
            ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Each circle to the one before it round its layer, the first to the last.
        let drawn = false;
        ctx.beginPath();
        for (let layer = 1, first = 1; layer <= layers; first += 6 * layer, layer++) {
            for (let index = 0; index < layer * 6; index++) {
                const [from, to] = [first + (index ? index - 1 : layer * 6 - 1), first + index];
                if (!shows(Math.min(xs[from], xs[to]) - reach, Math.min(ys[from], ys[to]) - reach, Math.max(xs[from], xs[to]) + reach, Math.max(ys[from], ys[to]) + reach)) continue;
                ctx.moveTo(xs[from], ys[from]);
                ctx.lineTo(xs[to], ys[to]);
                drawn = true;
            }
        }
        if (drawn) {
            ctx.strokeStyle = secondary;
            ctx.globalAlpha = 0.3 * pulse * fade;
            ctx.stroke();
        }
        // Then the circles, every other one of a layer in the secondary colour and the rest in the accent, fainter outward.
        for (let layer = 1, first = 1; layer <= layers; first += 6 * layer, layer++) {
            for (let odd = 0; odd < 2; odd++) {
                drawn = false;
                ctx.beginPath();
                for (let j = first + odd; j < first + 6 * layer; j += 2) {
                    if (!circle(xs[j], ys[j], radius * pulse + reach)) continue;
                    ctx.moveTo(xs[j] + radius * pulse, ys[j]);
                    ctx.arc(xs[j], ys[j], radius * pulse, 0, Math.PI * 2);
                    drawn = true;
                }
                if (!drawn) continue;
                ctx.strokeStyle = odd ? accent : secondary;
                ctx.globalAlpha = (1 - (layer / (layers + 1))) * fade;
                ctx.stroke();
            }
        }

        if (circle(cx, cy, radius * layers * 2 + reach)) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + rotation;
                const x = cx + Math.cos(angle) * radius * layers * 2;
                const y = cy + Math.sin(angle) * radius * layers * 2;
                if (i) ctx.lineTo(x, y);
                else ctx.moveTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = primary;
            ctx.globalAlpha = 0.3 * fade;
            ctx.stroke();
        }

        if (circle(cx, cy, radius * 2 + 1.5 * blur)) {
            ctx.fillStyle = kept<CanvasGradient>(CORE) ?? keep(CORE, core(ctx, cx, cy, radius * 2, pulse));
            ctx.globalAlpha = 0.3 * fade;
            ctx.beginPath();
            ctx.arc(cx, cy, radius * 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (N.particleShow) {
        const count = Math.floor(5 * N.particleDensity * motion * thin);
        const dot = 2 * quality * N.particleSize;
        const rate = held ? 0 : TURN * N.animationSpeed * speed;
        // Each run of dots of a colour casts one glow for them all, a few hundred dots each casting its own being the
        // costliest of any effect: their shapes are filled far off the canvas, so only their shadows land, as the halo
        // does. Then each dot is filled without one, so that they stack as v1's did.
        const shift = 1e5 / ctx.getTransform().a;
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.7 * dotGlow * fade;
        let run = '';
        let from = 0;
        const glowRun = (to: number) => {
            if (from === to) return;
            save(ctx);
            ctx.beginPath();
            for (let i = from; i < to; i++) {
                ctx.moveTo(dotX[i] + dot + shift, dotY[i]);
                ctx.arc(dotX[i] + shift, dotY[i], dot, 0, Math.PI * 2);
            }
            ctx.shadowColor = ctx.fillStyle = run;
            ctx.shadowBlur = 10 * dotGlow;
            ctx.shadowOffsetX = -1e5;
            ctx.fill();
            restore(ctx);
            ctx.fillStyle = run;
            for (let i = from; i < to; i++) {
                ctx.beginPath();
                ctx.arc(dotX[i], dotY[i], dot, 0, Math.PI * 2);
                ctx.fill();
            }
            from = to;
        };
        let m = 0;
        for (let j = 0; j < n; j++) {
            for (let p = 0; p < count; p++) {
                const angle = (p / count) * Math.PI * 2 + time * 2 * motion;
                const x = xs[j] + Math.cos(angle) * (radius * 0.5 * motion);
                const y = ys[j] + Math.sin(angle) * (radius * 0.5 * motion);
                if (!circle(x, y, dot + 1.5 * 10 * dotGlow)) continue;
                const colour = kept<string>(DOTS + j * count + p) ?? keep(DOTS + j * count + p, particleColour(pal, j * count + p, time, rate));
                if (colour !== run) {
                    glowRun(m);
                    run = colour;
                }
                if (m === dotX.length) [dotX, dotY] = [grown(dotX), grown(dotY)];
                dotX[m] = x;
                dotY[m++] = y;
            }
        }
        glowRun(m);
    }
}

/**
 * Flower of Life: its 19 circles' centres, in radii from its middle, each a radius from those beside it, in the order it
 * draws them in: the middle, the six of the Seed of Life a radius out, then the twelve round them, two radii out and √3
 * between.
 */
const FLOWER: readonly (readonly [number, number])[] = [
    [0, 0],
    ...Array.from({ length: 6 }, (_, i) => [Math.cos((i * Math.PI) / 3), Math.sin((i * Math.PI) / 3)] as const),
    ...Array.from({ length: 12 }, (_, i) => {
        const d = i % 2 ? Math.sqrt(3) : 2;
        return [d * Math.cos((i * Math.PI) / 6), d * Math.sin((i * Math.PI) / 6)] as const;
    }),
];
/** Its petals, the lenses where circles a radius apart overlap: the two circles, and how far its middle is from the flower's, in radii. */
const PETALS = FLOWER.flatMap(([ax, ay], a) => FLOWER.slice(a + 1).flatMap(([bx, by], i) =>
    (Math.abs(Math.hypot(bx - ax, by - ay) - 1) < 1e-9 ? [[a, a + 1 + i, Math.hypot((ax + bx) / 2, (ay + by) / 2)] as const] : [])));
/**
 * Its cycle at speed 1, in s: drawn in over DRAWN_S, the Seed of Life over the first SEED_S and the ring from RING_S; in
 * bloom, a shimmer running out through the petals every SHIMMER_S; fading out over the last FADE_S.
 */
const CYCLE_S = 16;
const DRAWN_S = 4;
const SEED_S = 1.5;
const RING_S = 3.3;
const SHIMMER_S = 2.75;
const FADE_S = 1;
/** Its circles' radius at Animation.Size 1, × the body's shorter side, and its ring's, × that: doubled at Rich. */
const PETAL = 0.14;
const FLOWER_RINGS = [[3], [3], [3], [3, 3.12]];
/** Where its circles are, turned. */
const fx = new Float64Array(FLOWER.length);
const fy = new Float64Array(FLOWER.length);

/** 0 to 1 as x goes from 0 to 1, easing in and out; 0 below, 1 above. */
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** How much of circle `i` is drawn `s` seconds into the cycle: the Seed of Life's seven one after another, then the twelve. */
const drawnOf = (i: number, s: number) =>
    i < 7 ? ease((s - (i * SEED_S) / 8) / (SEED_S / 4)) : ease((s - SEED_S - ((i - 7) * (DRAWN_S - SEED_S - 0.5)) / 12) / 0.5);

/**
 * 5. Flower of Life: nineteen circles, each through the middles of those beside it, drawing themselves in round from
 * where they meet the middle of the flower, the Seed of Life first, inside a ring, Balanced up, doubled at Rich; then in
 * bloom as it slowly turns, at Rich with a shimmer running out through its petals; then fading out to draw itself in
 * again. Its particles are sparks running round the circles drawn. Fast draws the Seed of Life alone.
 */
function flowerOfLife(ctx: CanvasRenderingContext2D, _node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { primary, secondary, accent } = pal;
    const { quality, particleGlow: dotGlow, particleSpeed: speed } = N;
    const intensity = N.intensity * 1.5;
    const [cx, cy] = [w / 2, h / 2];
    const r = Math.min(w, h) * PETAL * N.animationSize;
    const turn = k.nodePhase * 0.1;
    // Where in its cycle it is, the way the phase runs; still, in bloom without its shimmer.
    const s = held ? DRAWN_S : ((((k.nodePhase / TURN) % CYCLE_S) + CYCLE_S) % CYCLE_S);
    const out = held ? 1 : Math.min(1, (CYCLE_S - s) / FADE_S);
    const circles = quality > 1 ? FLOWER.length : 7;
    const blur = 12 * intensity * N.animationGlow;
    const reach = 1 + 1.5 * blur;
    const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
    for (let i = 0; i < circles; i++) {
        fx[i] = cx + r * (FLOWER[i][0] * cos - FLOWER[i][1] * sin);
        fy[i] = cy + r * (FLOWER[i][0] * sin + FLOWER[i][1] * cos);
    }

    if (!only) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = ctx.shadowColor = primary;
        ctx.shadowBlur = blur;
        ctx.globalAlpha = 0.9 * out * fade;
        let drawn = false;
        ctx.beginPath();
        for (let i = 0; i < circles; i++) {
            const p = drawnOf(i, s);
            if (!p || !circle(fx[i], fy[i], r + reach)) continue;
            const from = i ? Math.atan2(fy[i] - cy, fx[i] - cx) + Math.PI : turn - Math.PI / 2;
            ctx.moveTo(fx[i] + r * Math.cos(from), fy[i] + r * Math.sin(from));
            ctx.arc(fx[i], fy[i], r, from, from + 2 * Math.PI * p);
            drawn = true;
        }
        if (drawn) ctx.stroke();
        const ring = ease((s - RING_S) / (DRAWN_S - RING_S));
        if (quality > 1 && ring && circle(cx, cy, FLOWER_RINGS[quality].at(-1)! * r + reach)) {
            ctx.beginPath();
            for (const at of FLOWER_RINGS[quality]) {
                ctx.moveTo(cx + at * r * Math.cos(turn - Math.PI / 2), cy + at * r * Math.sin(turn - Math.PI / 2));
                ctx.arc(cx, cy, at * r, turn - Math.PI / 2, turn - Math.PI / 2 + 2 * Math.PI * ring);
            }
            ctx.strokeStyle = ctx.shadowColor = accent;
            ctx.stroke();
        }
        if (quality > 2 && !held && s >= DRAWN_S) {
            // The shimmer: the petals as far out as the wave lit, fading over 0.6 radii to each side of it.
            const wave = (((s - DRAWN_S) % SHIMMER_S) / SHIMMER_S) * 2.6;
            ctx.shadowBlur = 0;
            ctx.fillStyle = secondary;
            for (const [a, b, d] of PETALS) {
                const lit = 1 - Math.abs(d - wave) / 0.6;
                if (lit <= 0 || !circle((fx[a] + fx[b]) / 2, (fy[a] + fy[b]) / 2, r)) continue;
                const along = Math.atan2(fy[b] - fy[a], fx[b] - fx[a]);
                ctx.beginPath();
                ctx.arc(fx[a], fy[a], r, along - Math.PI / 3, along + Math.PI / 3);
                ctx.arc(fx[b], fy[b], r, along + (2 * Math.PI) / 3, along + (4 * Math.PI) / 3);
                ctx.closePath();
                ctx.globalAlpha = 0.35 * lit * out * fade;
                ctx.fill();
            }
        }
    }

    if (N.particleShow) {
        const count = Math.max(1, Math.round(2 * N.particleDensity * thin));
        const spark = 1.2 * N.particleSize;
        const time = held ? 0 : k.particleTime;
        const rate = held ? 0 : TURN * N.animationSpeed * speed;
        ctx.shadowBlur = 8 * dotGlow;
        ctx.globalAlpha = 0.85 * dotGlow * out * fade;
        for (let i = 0; i < circles; i++) {
            if (drawnOf(i, s) < 1) continue;
            for (let p = 0; p < count; p++) {
                // Round each circle, every other one the other way.
                const angle = turn + (i % 2 ? 1.5 : -1.5) * time * speed + (p / count) * Math.PI * 2 + i;
                const x = fx[i] + r * Math.cos(angle);
                const y = fy[i] + r * Math.sin(angle);
                if (!circle(x, y, spark + 1.5 * 8 * dotGlow)) continue;
                const colour = kept<string>(SPARKS + i * count + p) ?? keep(SPARKS + i * count + p, particleColour(pal, i * count + p, time, rate));
                ctx.beginPath();
                ctx.arc(x, y, spark, 0, Math.PI * 2);
                ctx.fillStyle = ctx.shadowColor = colour;
                ctx.fill();
            }
        }
    }
}

/**
 * 6. Jelly: a gel's tint over the body, in the effect's colours, and a gloss toward its top left; with Node particles,
 * bubbles rising through it. The wobble is nodes/jelly.ts's.
 */
function jelly(ctx: CanvasRenderingContext2D, _node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const top = -LiteGraph.NODE_TITLE_HEIGHT;
    const tall = h - top;
    if (!only && shows(0, top, w, h)) {
        ctx.globalAlpha = (0.6 + 0.4 * N.animationGlow) * fade;
        ctx.fillStyle = kept<CanvasGradient>(TINT) ?? keep(TINT, tint(ctx, top, h, pal));
        ctx.fillRect(0, top, w, tall);
        ctx.fillStyle = kept<CanvasGradient>(GLOSS) ?? keep(GLOSS, gloss(ctx, w * 0.28, top + tall * 0.16, Math.min(w, tall) * 0.5));
        ctx.fillRect(0, top, w, tall);
    }
    if (N.particleShow) {
        const { particleSize: size, particleGlow: dotGlow } = N;
        const count = Math.max(1, Math.floor(6 * N.particleDensity * thin));
        const time = held ? 0 : k.particleTime;
        const rate = held ? 0 : TURN * N.animationSpeed * N.particleSpeed;
        ctx.lineWidth = 1;
        for (let i = 0; i < count; i++) {
            // As wide as the body lets them be, inside it: Jelly draws nothing round its node.
            const r = Math.min((1.5 + 2 * noise(i + 11)) * size, w / 4, tall / 4);
            const [low, high] = [h - r - 1, top + r + 1];
            // Up through the body and in again at its foot, wavering as they go, fading in and out at each end.
            const span = low - high;
            const y = low - ((((time * 18 + noise(i) * span) % span) + span) % span);
            const x = Math.max(r + 1, Math.min(w - r - 1, w * (0.12 + 0.76 * noise(i + 5)) + Math.sin(time * 2 + i) * 3 * N.particleIntensity));
            if (!circle(x, y, r + 1)) continue;
            ctx.globalAlpha = 0.55 * dotGlow * fade * Math.min(1, (low - y) / (4 * r), (y - high) / (4 * r));
            ctx.strokeStyle = kept<string>(BUBBLES + i) ?? keep(BUBBLES + i, particleColour(pal, i, time, rate));
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

/** Jelly's tint from `top` down to `bottom`: its primary colour, clearer toward the foot, in its secondary. */
function tint(ctx: CanvasRenderingContext2D, top: number, bottom: number, pal: NodePalette): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, top, 0, bottom);
    gradient.addColorStop(0, translucent(pal.primary, 0.2));
    gradient.addColorStop(1, translucent(pal.secondary, 0.08));
    return gradient;
}

/** Jelly's gloss about (x, y), `r` out: white, fading to nothing. */
function gloss(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): CanvasGradient {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return gradient;
}

/**
 * Circuit Trace: its traces for each 100 px of the body's sides and foot at Quality 1, 2 and 3; how long a pulse takes
 * from its pin to its pad, in s at speed 1; how long about its arrival its pad glows, × that; and in px at Animation.Size
 * 1, a pulse's run along its trace, how far a pin stands out, a pad's radius, and how far in from the edges the traces keep.
 */
const TRACES = [0, 1, 1.6, 2.4];
const PULSE_S = 2.4;
const LIT = 0.12;
const RUN = 14;
const PIN = 5;
const PAD = 2.2;
const INSET = 6;

/** A trace: its corners from its pin on the edge to its pad, how far along it each is, its length, its box with its pad's, and the way its pin points out. */
interface Trace {
    x: number[];
    y: number[];
    at: number[];
    length: number;
    box: [number, number, number, number];
    dx: number;
    dy: number;
}

/** Each node's traces, and the body, Quality and Animation.Size they were laid for. */
const boards = new WeakMap<object, { w: number; h: number; quality: number; size: number; traces: Trace[] }>();

/**
 * The traces of `node`'s w × h body, laid the same each time from its id: each in from a pin on its left, its right or its
 * foot, a run, a jog at 45° toward the middle and a run, to a pad, the side ones in their own half.
 */
function board(node: ComfyNode, w: number, h: number): Trace[] {
    const { quality, animationSize: size } = N;
    const laid = boards.get(node);
    if (laid && laid.w === w && laid.h === h && laid.quality === quality && laid.size === size) return laid.traces;
    const random = rng(hash(String(node.id)));
    const count = Math.max(2, Math.min(16, Math.round((TRACES[quality] * (2 * h + w)) / 100)));
    const traces: Trace[] = [];
    for (let i = 0; i < count; i++) {
        const pick = random() * (2 * h + w);
        let x: number[];
        let y: number[];
        let dx = 0;
        let dy = 0;
        if (pick < 2 * h) {
            // A side: across, a jog up or down toward the middle, across.
            const y0 = INSET + (h - 2 * INSET) * (0.1 + 0.8 * random());
            const x1 = w * (0.06 + 0.14 * random());
            const way = y0 < h / 2 ? 1 : -1;
            const jog = Math.min(h * (0.06 + 0.14 * random()), way > 0 ? h - INSET - y0 : y0 - INSET);
            const x3 = Math.min(w * 0.46, x1 + jog + w * (0.05 + 0.15 * random()));
            x = [0, x1, x1 + jog, Math.max(x1 + jog, x3)];
            y = [y0, y0, y0 + way * jog, y0 + way * jog];
            dx = -1;
            if (pick >= h) {
                x = x.map((at) => w - at);
                dx = 1;
            }
        } else {
            // The foot: up, a jog toward the middle, up.
            const x0 = INSET + (w - 2 * INSET) * (0.1 + 0.8 * random());
            const y1 = h - h * (0.08 + 0.18 * random());
            const way = x0 < w / 2 ? 1 : -1;
            const jog = Math.min(w * (0.04 + 0.1 * random()), way > 0 ? w - INSET - x0 : x0 - INSET);
            const y3 = Math.max(INSET, y1 - jog - h * (0.05 + 0.15 * random()));
            x = [x0, x0, x0 + way * jog, x0 + way * jog];
            y = [h, y1, y1 - jog, Math.min(y1 - jog, y3)];
            dy = 1;
        }
        const at = [0];
        for (let j = 1; j < x.length; j++) at.push(at[j - 1] + Math.hypot(x[j] - x[j - 1], y[j] - y[j - 1]));
        const pad = (PAD + 1) * size;
        traces.push({ x, y, at, length: at.at(-1)!, box: [Math.min(...x, x[3] - pad), Math.min(...y, y[3] - pad), Math.max(...x, x[3] + pad), Math.max(...y, y[3] + pad)], dx, dy });
    }
    boards.set(node, { w, h, quality, size, traces });
    return traces;
}

/** The point `d` along trace `t`, kept in (atX, atY). */
let atX = 0;
let atY = 0;
function locate(t: Trace, d: number): void {
    let j = 1;
    while (j < t.at.length - 1 && t.at[j] < d) j++;
    const span = t.at[j] - t.at[j - 1];
    const f = span > 0 ? Math.max(0, Math.min(1, (d - t.at[j - 1]) / span)) : 1;
    atX = t.x[j - 1] + (t.x[j] - t.x[j - 1]) * f;
    atY = t.y[j - 1] + (t.y[j] - t.y[j - 1]) * f;
}

/** Adds the stretch of trace `t` from `d0` to `d1` along it to the path. */
function stretch(ctx: CanvasRenderingContext2D, t: Trace, d0: number, d1: number): void {
    locate(t, d0);
    ctx.moveTo(atX, atY);
    for (let j = 1; j < t.at.length - 1; j++) if (t.at[j] > d0 && t.at[j] < d1) ctx.lineTo(t.x[j], t.y[j]);
    locate(t, d1);
    ctx.lineTo(atX, atY);
}

/**
 * 7. Circuit Trace: the node as a chip, pins standing out of its sides and foot, each wired in by a trace etched faintly
 * in the body to a pad; a pulse runs along each, from pin to pad going Forward, and lights the pad as it gets there, once
 * every 2.4 s at speed 1 for each trace. Its particles are sparks trailing the pulses. Quality lays more traces.
 */
function circuitTrace(ctx: CanvasRenderingContext2D, node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { primary, secondary, accent } = pal;
    const { animationGlow: glow, animationSize: size } = N;
    const intensity = N.intensity * 1.5;
    const traces = board(node, w, h);
    const blur = 10 * intensity * glow;
    const reach = 1 + 1.5 * blur;
    const pulse = RUN * size;
    const pad = PAD * size;
    // Seconds at speed 1, back going Reverse; still, at its start.
    const s = held ? 0 : k.nodePhase / TURN;
    const where = (j: number) => {
        const u = s / PULSE_S + noise(j + 1);
        return u - Math.floor(u);
    };
    ctx.lineJoin = 'round';

    if (!only) {
        // Pins and traces end square, so that a pin falls around the body alone and a trace on it alone.
        let drawn = false;
        ctx.strokeStyle = secondary;
        ctx.lineWidth = 2 * size;
        ctx.globalAlpha = 0.8 * fade;
        ctx.beginPath();
        for (const t of traces) {
            const [x0, y0] = [t.x[0], t.y[0]];
            const [x1, y1] = [x0 + t.dx * PIN * size, y0 + t.dy * PIN * size];
            if (!shows(Math.min(x0, x1) - t.dy * size, Math.min(y0, y1) - t.dx * t.dx * size, Math.max(x0, x1) + t.dy * size, Math.max(y0, y1) + t.dx * t.dx * size)) continue;
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            drawn = true;
        }
        if (drawn) ctx.stroke();

        drawn = false;
        ctx.lineWidth = 1.2 * size;
        ctx.globalAlpha = Math.min(1, 0.3 * intensity) * fade;
        ctx.beginPath();
        for (const t of traces) {
            if (!shows(...t.box)) continue;
            ctx.moveTo(t.x[0], t.y[0]);
            for (let j = 1; j < t.x.length; j++) ctx.lineTo(t.x[j], t.y[j]);
            ctx.moveTo(t.x[3] + pad, t.y[3]);
            ctx.arc(t.x[3], t.y[3], pad, 0, Math.PI * 2);
            drawn = true;
        }
        if (drawn) ctx.stroke();

        drawn = false;
        ctx.lineCap = 'round';
        ctx.strokeStyle = ctx.shadowColor = primary;
        ctx.shadowBlur = blur;
        ctx.lineWidth = 2 * size;
        ctx.globalAlpha = 0.95 * fade;
        ctx.beginPath();
        for (let j = 0; j < traces.length; j++) {
            const t = traces[j];
            const head = where(j) * t.length;
            locate(t, head);
            if (!circle(atX, atY, pulse + reach)) continue;
            stretch(ctx, t, Math.max(0, head - pulse), head);
            drawn = true;
        }
        if (drawn) ctx.stroke();

        ctx.fillStyle = ctx.shadowColor = accent;
        for (let j = 0; j < traces.length; j++) {
            const t = traces[j];
            const u = where(j);
            const lit = 1 - Math.min(u, 1 - u) / LIT;
            if (lit <= 0 || !circle(t.x[3], t.y[3], 1.4 * pad + reach)) continue;
            ctx.globalAlpha = lit * fade;
            ctx.beginPath();
            ctx.arc(t.x[3], t.y[3], 1.4 * pad, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    if (N.particleShow) {
        const { particleSize: dot, particleGlow: dotGlow, particleSpeed: speed } = N;
        const count = Math.max(1, Math.round(3 * N.particleDensity * thin));
        const time = held ? 0 : k.particleTime;
        const rate = held ? 0 : TURN * N.animationSpeed * speed;
        ctx.shadowBlur = 6 * dotGlow;
        for (let j = 0; j < traces.length; j++) {
            const t = traces[j];
            const head = where(j) * t.length;
            for (let p = 0; p < count; p++) {
                // Behind the pulse, smaller and fainter the further back.
                const back = (p + 1) / count;
                const d = head - pulse - back * 2.5 * pulse;
                if (d <= 0) continue;
                locate(t, d);
                const r = dot * (1.2 - 0.6 * back);
                if (!circle(atX, atY, r + 1.5 * 6 * dotGlow)) continue;
                const colour = kept<string>(CHIP_SPARKS + j * count + p) ?? keep(CHIP_SPARKS + j * count + p, particleColour(pal, j * count + p, time, rate));
                ctx.fillStyle = ctx.shadowColor = colour;
                ctx.globalAlpha = 0.9 * dotGlow * (1 - 0.7 * back) * fade;
                ctx.beginPath();
                ctx.arc(atX, atY, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

/** Aurora Veil: its curtains at Quality 1, 2 and 3, the rays in each, and the longest a ray hangs, × the body's height. */
const VEILS = [0, 3, 4, 5];
const RAYS = [0, 6, 8, 10];
const DROP = 0.8;

/** A curtain's light from the top of the body down `drop` px: brightest just under the title bar, gone at its hem. */
function veil(ctx: CanvasRenderingContext2D, drop: number, colour: string): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, drop);
    gradient.addColorStop(0, translucent(colour, 0.55));
    gradient.addColorStop(0.08, translucent(colour, 1));
    gradient.addColorStop(0.6, translucent(colour, 0.45));
    gradient.addColorStop(1, translucent(colour, 0));
    return gradient;
}

/**
 * 8. Aurora Veil: curtains of light hanging from the title bar into the body, each a row of rays in one of the effect's
 * colours, brightest in its middle; their hems wave and the curtains drift and sway, and each ray shimmers, under a
 * flicker a second at speed 3. Its particles are motes rising through the body. Quality hangs more curtains of more rays.
 */
function auroraVeil(ctx: CanvasRenderingContext2D, _node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { quality } = N;
    const intensity = N.intensity * 1.5;
    const s = held ? 0 : k.nodePhase / TURN;
    const drop = DROP * h;
    if (!only) {
        const veils = VEILS[quality];
        const rays = RAYS[quality];
        const width = w * 0.36;
        // Each ray spans more than two rays' room, so that they blend into a curtain.
        const ray = Math.min(width, (width / rays) * 2.4);
        const colours = [pal.primary, pal.secondary, pal.accent];
        for (let i = 0; i < veils; i++) {
            const slot = CURTAINS + (i % 3);
            const fill = kept<CanvasGradient>(slot) ?? keep(slot, veil(ctx, drop, colours[i % 3]));
            const middle = Math.max(width / 2, Math.min(w - width / 2, w * (0.12 + (0.76 * (i + 0.5)) / veils) + Math.sin(s * 0.35 + i * 1.7) * w * 0.08));
            // A faint wash the width of the curtain, under its rays.
            if (shows(middle - width / 2, 0, middle + width / 2, 0.7 * drop)) {
                ctx.globalAlpha = Math.min(1, 0.1 * intensity) * fade;
                ctx.fillStyle = fill;
                save(ctx);
                ctx.translate(middle, 0);
                ctx.scale(1, 0.7);
                ctx.fillRect(-width / 2, 0, width, drop);
                restore(ctx);
            }
            for (let j = 0; j < rays; j++) {
                const x = Math.max(ray / 2, Math.min(w - ray / 2, middle - width / 2 + ((j + 0.5) * width) / rays + Math.sin(s * 0.8 + j * 0.9 + i) * width * 0.04));
                // Its hem waves along the curtain and moves with the clock.
                const long = drop * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(x * 0.035 + s * 0.6 + i)));
                if (!shows(x - ray / 2, 0, x + ray / 2, long)) continue;
                const shimmer = 0.75 + 0.25 * Math.sin(s * 1.3 + j * 2.1 + i * 0.7);
                ctx.globalAlpha = Math.min(1, 0.11 * intensity) * Math.sin((Math.PI * (j + 0.5)) / rays) * shimmer * fade;
                ctx.fillStyle = fill;
                save(ctx);
                ctx.translate(x, 0);
                ctx.scale(1, long / drop);
                ctx.fillRect(-ray / 2, 0, ray, drop);
                restore(ctx);
            }
        }
    }
    if (N.particleShow) {
        const { particleSize: size, particleGlow: dotGlow, particleSpeed: speed } = N;
        const count = Math.max(1, Math.floor(5 * N.particleDensity * thin));
        const time = held ? 0 : k.particleTime;
        const rate = held ? 0 : TURN * N.animationSpeed * speed;
        const r = 1.2 * size;
        // Their glow kept inside the body too: Aurora Veil draws nothing round it.
        const edge = r + 1 + 1.5 * 6 * dotGlow;
        ctx.shadowBlur = 6 * dotGlow;
        for (let i = 0; i < count; i++) {
            // Up through the body and in again at its foot, drifting side to side, fading in and out at each end.
            const [low, high] = [h - edge, edge];
            const span = Math.max(1, low - high);
            const y = low - ((((time * 12 + noise(i + 3) * span) % span) + span) % span);
            const x = Math.max(edge, Math.min(w - edge, w * (0.1 + 0.8 * noise(i + 7)) + Math.sin(time * 0.7 + i) * 4 * N.particleIntensity));
            if (!circle(x, y, edge - 1)) continue;
            ctx.globalAlpha = 0.8 * dotGlow * fade * Math.min(1, (low - y) / (6 * r), (y - high) / (6 * r));
            ctx.fillStyle = ctx.shadowColor = kept<string>(MOTES_UP + i) ?? keep(MOTES_UP + i, particleColour(pal, i, time, rate));
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Ember Crown, in px at Animation.Size 1: about how far apart its flames stand, how tall the tallest is at Intensity 1,
 * and how far its embers rise above the title bar before they die out.
 */
const TONGUE = 18;
const BLAZE = 22;
const RISE = 45;

/** Ember Crown's flame, from the top of the title bar at `base` up to `top`: gold at its root, then its orange, then red, gone at its tip. */
function flame(ctx: CanvasRenderingContext2D, base: number, top: number, pal: NodePalette): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, base, 0, top);
    gradient.addColorStop(0, translucent(pal.accent, 0.95));
    gradient.addColorStop(0.35, translucent(pal.primary, 0.85));
    gradient.addColorStop(0.75, translucent(pal.secondary, 0.5));
    gradient.addColorStop(1, translucent(pal.secondary, 0));
    return gradient;
}

/** Ember Crown's warmth on the body, from under its title bar down `depth` px. */
function warmth(ctx: CanvasRenderingContext2D, depth: number, pal: NodePalette): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, depth);
    gradient.addColorStop(0, translucent(pal.primary, 0.22));
    gradient.addColorStop(1, translucent(pal.primary, 0));
    return gradient;
}

/**
 * 9. Ember Crown: a crown of flames licking up from the top of the title bar, each swaying and flickering on its own
 * under twice a second at speed 3, gold at the root and red at the tip, glowing; and a warmth on the body under the
 * title bar. Its particles are embers rising from the flames and dying out. Quality stands its flames closer.
 */
function emberCrown(ctx: CanvasRenderingContext2D, _node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean): void {
    const { quality, animationGlow: glow, animationSize: size } = N;
    const intensity = N.intensity * 1.5;
    const base = -LiteGraph.NODE_TITLE_HEIGHT;
    const s = held ? 0 : k.nodePhase / TURN;
    const tall = BLAZE * size * Math.min(1.6, 0.5 + 0.5 * intensity);
    const blur = 10 * intensity * glow;
    if (!only) {
        const count = Math.max(3, Math.min(24, Math.round((w / (TONGUE * size)) * (0.6 + 0.2 * quality))));
        const spacing = w / count;
        const wide = spacing * 1.3;
        ctx.fillStyle = kept<CanvasGradient>(FLAMES) ?? keep(FLAMES, flame(ctx, base, base - tall, pal));
        ctx.shadowColor = pal.primary;
        ctx.shadowBlur = blur;
        ctx.globalAlpha = fade;
        let drawn = false;
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
            const x = (i + 0.5 + 0.4 * (noise(i + 13) - 0.5)) * spacing;
            const flicker = 0.8 + 0.2 * (0.6 * Math.sin(s * 2.1 + i * 1.7) + 0.4 * Math.sin(s * 3.3 + i * 0.9));
            const high = tall * (0.6 + 0.4 * noise(i + 9)) * flicker;
            const tip = x + Math.sin(s * 1.4 + i) * wide * 0.25;
            if (!shows(Math.min(x - wide / 2, tip) - 1.5 * blur, base - high - 1.5 * blur, Math.max(x + wide / 2, tip) + 1.5 * blur, base + 1.5 * blur)) continue;
            ctx.moveTo(x - wide / 2, base);
            ctx.bezierCurveTo(x - wide / 2, base - high * 0.45, tip - wide * 0.15, base - high * 0.7, tip, base - high);
            ctx.bezierCurveTo(tip + wide * 0.15, base - high * 0.7, x + wide / 2, base - high * 0.45, x + wide / 2, base);
            ctx.closePath();
            drawn = true;
        }
        if (drawn) ctx.fill();
        ctx.shadowBlur = 0;
        const depth = 0.4 * h;
        if (shows(0, 0, w, depth)) {
            ctx.fillStyle = kept<CanvasGradient>(WARMTH) ?? keep(WARMTH, warmth(ctx, depth, pal));
            ctx.fillRect(0, 0, w, depth);
        }
    }
    if (N.particleShow) {
        const { particleSize: dot, particleGlow: dotGlow, particleSpeed: speed } = N;
        const count = Math.max(1, Math.round((w / 40) * N.particleDensity * thin));
        const time = held ? 0 : k.particleTime;
        const rate = held ? 0 : TURN * N.animationSpeed * speed;
        const rise = RISE * size;
        ctx.shadowBlur = 8 * dotGlow;
        for (let i = 0; i < count; i++) {
            // Up from the flames, swaying more as it goes, fading in at once and out as it dies.
            const age = time * 0.35 + noise(i + 5);
            const life = age - Math.floor(age);
            const x = w * (0.05 + 0.9 * noise(i + 17)) + Math.sin(time * 1.7 + i) * 6 * N.particleIntensity * life;
            const y = base - 4 - life * rise;
            const r = dot * (2.2 - 1.2 * life);
            if (!circle(x, y, r + 1.5 * 8 * dotGlow)) continue;
            ctx.globalAlpha = dotGlow * Math.min(1, life / 0.1) * (1 - life) * fade;
            ctx.fillStyle = ctx.shadowColor = kept<string>(EMBERS + i) ?? keep(EMBERS + i, particleColour(pal, i, time, rate));
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

type Effect = (ctx: CanvasRenderingContext2D, node: ComfyNode, w: number, h: number, k: NodeMoment, pal: NodePalette, only: boolean) => void;

/** By Animate value; 0 stands for the fireflies a node with no effect but particles gets, Gentle Pulse's. */
const EFFECTS: Effect[] = [gentlePulse, gentlePulse, neonNexus, cosmicRipple, sacredRosette, flowerOfLife, jelly, circuitTrace, auroraVeil, emberCrown];

/** v1's frame round a selected node's body (old_node_animations.js:2104-2113): a line in its secondary colour, glowing in its accent. */
function frame(ctx: CanvasRenderingContext2D, w: number, h: number, pal: NodePalette): void {
    const blur = 15 * (N.glow * 2);
    ctx.shadowColor = pal.accent;
    ctx.shadowBlur = blur * 1.5;
    ctx.strokeStyle = pal.secondary;
    ctx.lineWidth = 2;
    ctx.globalAlpha = fade;
    ctx.strokeRect(0, 0, w, h);
}

/**
 * Draws node effect `style` (0: the fireflies of a node with particles and no effect) on `node`, its body `w` × `h` px,
 * at `k`, or in v1's still pose while effects hold still: the elements `p` names, at `alpha` times their own alphas, and
 * with `only` the style's particles alone. Its colours, and its frame and hover outline, are the style's. The caller
 * saves and restores the context around it.
 */
export function drawNodeFx(ctx: CanvasRenderingContext2D, style: number, node: ComfyNode, w: number, h: number, k: NodeMoment, p: Part, alpha: number, only: boolean): void {
    part = p;
    fade = alpha;
    held = holdsStill();
    thin = adaptive.level >= THIN ? 0.5 : 1;
    // Classic nodes only: Nodes 2.0's DOM nodes keep the pointer from the canvas.
    outlined = style > 0 && N.colorHoverShow && !LiteGraph.vueNodesMode && Boolean(node.selected || node.mouseOver);
    const pal = nodePalette(style);
    mine = makes(ctx, pal, w, h, held ? STILL_NODE : k, p.sides);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.globalAlpha = fade;
    const saves = depth;
    try {
        EFFECTS[style](ctx, node, w, h, held ? STILL_NODE : k, pal, only);
        if (outlined && style > 1) outline(ctx, 0, 0, w, h, node.selected, translucent);
        if (style > 0 && !only && N.selectionGlow && node.selected) frame(ctx, w, h, pal);
    } finally {
        while (depth > saves) restore(ctx);
    }
}

/**
 * How far past a node's box, title bar included, its effect draws at most, with its glows: what the under part of
 * a node off screen can still draw on it.
 */
export function reach(style: number, w: number, h: number, only: boolean): number {
    const { quality, animationGlow: glow, animationSize: size, particleShow: dots, particleSize: dotSize, particleGlow: dotGlow, particleIntensity: motion } = N;
    const intensity = N.intensity * 1.5;
    const long = Math.max(w, h);
    const short = Math.min(w, h);
    let r = 0;
    if (style > 0 && N.colorHoverShow) r = 1 + 1.5 * 15 * glow * 1.5;
    if (style > 0 && !only && N.selectionGlow) r = Math.max(r, 1 + 1.5 * 45 * N.glow);
    switch (style) {
        case 2: {
            const line = long * 0.0075 * size;
            if (!only) r = Math.max(r, 4 + line, line + 1.5 * 48 * intensity * glow, line + 1.5 * 15 * intensity, 0.6 * short * size + 0.5);
            // The lattice, which runs down from the body's top left corner.
            if (dots) r = Math.max(r, 1.1 * short * size + 2 + 2.6 * dotSize + 7.5 * dotGlow);
            return r;
        }
        case 3: {
            const rings = 0.7 * short * size + 1.5 * intensity + 1.5 * Math.max(2, 15 * glow);
            const corona = 0.7 * long * (0.8 + 0.2 * motion) + 2 * (2 * dotSize + 1.5 * motion) + 1.5 * 15 * dotGlow;
            return Math.max(r, (only ? 0 : rings) - short / 2, (dots ? corona : 0) - short / 2);
        }
        // Jelly and Aurora Veil draw on the body alone.
        case 6:
        case 8:
            return r;
        case 9: {
            // Its flames over the title bar, and the embers that rise from them.
            const flames = BLAZE * size * Math.min(1.6, 0.5 + 0.5 * intensity) + 1.5 * 10 * intensity * glow;
            const embers = 4 + RISE * size + 2.2 * dotSize + 1.5 * 8 * dotGlow;
            return Math.max(r, only ? 0 : flames, dots ? embers : 0);
        }
        case 7: {
            // Its pins, and its pulses' glow where their traces meet the edge.
            const blur = 10 * intensity * glow;
            const sparks = dots ? 1.2 * dotSize + 1.5 * 6 * dotGlow : 0;
            return Math.max(r, only ? 0 : Math.max((PIN + 1) * size, 1 + size + 1.5 * blur), sparks);
        }
        case 5: {
            const radius = short * PETAL * size;
            const pattern = (quality > 1 ? FLOWER_RINGS[quality].at(-1)! : 2) * radius + 1 + 1.5 * 12 * intensity * glow;
            const sparks = (quality > 1 ? 3 : 2) * radius + 1.2 * dotSize + 1.5 * 8 * dotGlow;
            return Math.max(r, (only ? 0 : pattern) - short / 2, (dots ? sparks : 0) - short / 2);
        }
        case 4: {
            const radius = short * 0.056 * intensity * size;
            const rings = 2 * radius * Math.max(2, Math.floor(quality * 2));
            const pattern = rings + radius + 1 + 1.5 * 15 * intensity * glow;
            const circling = rings + 0.5 * radius * motion + 2 * quality * dotSize + 1.5 * 10 * dotGlow;
            return Math.max(r, (only ? 0 : pattern) - short / 2, (dots ? circling : 0) - short / 2);
        }
        default: {
            const radius = long * (0.5 + quality * 0.1) * size;
            const light = radius * (1.2 + 0.4 * glow) * (0.4 + 0.3 * intensity);
            // The fireflies orbit up to 1.3 radii out and drift up by 0.39 of one, then wander, glow and flicker.
            const blur = !only && quality > 1 ? 1.5 * 10 * glow * quality * 0.5 : 0;
            const fireflies = 1.7 * radius + 4.5 * motion + 12 + 2.8 * (4 + quality) * size * dotSize + blur;
            return Math.max(r, (only ? 0 : light) - short / 2, (dots ? fireflies : 0) - short / 2);
        }
    }
}
