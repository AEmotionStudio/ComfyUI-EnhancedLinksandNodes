/**
 * Glows from sprites. shadowBlur blurs every shape it is set for, which is
 * most of what a glowing particle costs a frame. A sprite is the glow of one
 * shape, in one colour, at one size, turn and blur on screen: the canvas casts
 * it once, with that very shadowBlur, onto a small canvas of its own, and
 * stamping it under the shape costs one drawImage. The shape is still painted
 * as a path over it, so only the soft glow is reused, cast from the shape at
 * the nearest of eight sizes an octave (the stamp is stretched the rest of the
 * way) and the nearest of 32 turns. Stamps are never turned on the canvas,
 * which costs software rendering as much as the blur. Sprites are kept up to a
 * budget of pixels, the ones stamped longest ago going first, and dropped when
 * a setting changes.
 *
 * glow() stamps between startSprites() and stopSprites(), as the link motion
 * layer draws; anywhere else, as in still frames and the traces, it sets
 * shadowBlur as before. disc() fills discs the same way, from sprites of the
 * disc itself. noise() is a particle's flicker, the same however often a frame
 * is drawn, and rng() the seeded stream a burst draws its particles from, into
 * the pool.
 *
 * @module fx/particles
 */

import { offscreen } from '@/core/engine';
import { revision } from '@/core/settings';
import { translucent } from '@/core/colors';

/**
 * A shape that glows. path() traces it around (x, y), `size` out from there and turned by `angle`; a shape that
 * turns looks the same again after `turn`, and one that reaches further from its centre than its size says how far,
 * in sizes. A stroked one is stroked at the context's line width, with the round caps and joins the link layers
 * stroke with; the rest are filled.
 */
export interface Shape {
    path(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number): void;
    stroked?: boolean;
    turn?: number;
    reach?: number;
}

/** mulberry32's output for state `seed`: a number in [0, 1) that `seed` alone decides, for flicker that a frame draws twice alike. */
export function noise(seed: number): number {
    let t = (seed + 0x6d2b79f5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** mulberry32: a stream of numbers in [0, 1), the same ones for the same `seed`. */
export function rng(seed: number): () => number {
    let state = seed | 0;
    return () => {
        const value = noise(state);
        state = (state + 0x6d2b79f5) | 0;
        return value;
    };
}

/** The most particles the pool holds. */
export const CAP = 4096;

/**
 * The particles of the bursts playing (fx/bursts.ts), as a struct of arrays, the first `count` in use: each one's kind
 * and the burst it belongs to; its heading in radians, and its speed and size as fractions of what its burst scales
 * them by; the index of its colour among its burst's; how many sparks trail behind it; and its place among its burst's
 * particles of its kind.
 */
export const pool = {
    count: 0,
    kind: new Uint8Array(CAP),
    owner: new Uint16Array(CAP),
    angle: new Float64Array(CAP),
    speed: new Float64Array(CAP),
    size: new Float64Array(CAP),
    colour: new Uint8Array(CAP),
    trail: new Uint8Array(CAP),
    seq: new Uint16Array(CAP),
};

/** A disc of radius `size`. */
export const DOT: Shape = {
    path(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
    },
};

/** Sprites are cast for sizes and line widths this many steps an octave apart, and for this many turns of a shape that turns. */
const STEPS = 8;
const TURNS = 32;
/** The smallest size cast, in px on screen: a filled shape smaller than this glows too faintly to show (under 1 % at a 10 px blur). */
const LEAST = 0.25;
/** The widest sprite, in px: a shape that needs a wider one is rare on screen, and casts its own glow. */
const WIDEST = 256;
/** How many pixels the sprites may take together: 16 MB. */
const BUDGET = 4 * 2 ** 20;

interface Sprite {
    image: OffscreenCanvas | HTMLCanvasElement;
    /** The size its shape was cast at, and half its width from the centre the shape was cast at, in px. */
    size: number;
    half: number;
    /** The pass that last stamped it. */
    used: number;
}

/** The sprites by shape, glow colour, then blur, size, line width and turn (sprite()). */
const sprites = new Map<Shape, Map<string, Map<number, Sprite>>>();
/** The sprites of discs by colour, then size and softness (disc()); they are few and small, so they are kept until a setting changes. */
const discs = new Map<string, Map<number, Sprite>>();
let pixels = 0;
let since = -1;
/** Counts the passes that stamped, which date the sprites. */
let pass = 0;
/** While stamping, how many px on screen a unit of the context's transform is; 0 while glow() sets shadowBlur. */
let scale = 0;

/** From now until stopSprites(), glow() stamps glows on ctx at the scale of its current transform. */
export function startSprites(ctx: CanvasRenderingContext2D): void {
    if (since !== revision) {
        sprites.clear();
        discs.clear();
        pixels = 0;
        since = revision;
    }
    const { a, b, c, d } = ctx.getTransform();
    scale = Math.sqrt(Math.abs(a * d - b * c));
    // Bilinear: a soft glow needs no better, and the 'high' quality v1's links asked for makes each stamp cost software
    // rendering as much as the shadowBlur it replaces.
    ctx.imageSmoothingQuality = 'low';
    pass++;
}

export function stopSprites(): void {
    scale = 0;
}

const alphas = new Map<string, number>();

/** The alpha of a colour as core/colors.ts writes it: 1 for #rrggbb, else the last number of rgba(). */
function opacity(colour: string): number {
    if (colour.charCodeAt(0) === 35) return 1;
    let alpha = alphas.get(colour);
    if (alpha === undefined) alphas.set(colour, (alpha = Number(colour.slice(colour.lastIndexOf(',') + 1, -1))));
    return alpha;
}

/** The step of the octaves a size is cast at. */
const step = (size: number) => Math.round(Math.log2(Math.max(size, LEAST)) * STEPS);

/** Casts the glow of `shape` at `size` and `angle`, stroked `width` wide or filled when 0, in `colour` with shadowBlur `blur`. */
function cast(shape: Shape, size: number, angle: number, width: number, colour: string, blur: number, half: number): Sprite {
    const image = offscreen(2 * half, 2 * half);
    const ctx = image.getContext('2d') as CanvasRenderingContext2D;
    // The shape lies a sprite's width off to the left, in the default opaque black, so only its glow lands here.
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
    ctx.shadowOffsetX = 4 * half;
    ctx.lineWidth = width;
    ctx.lineCap = ctx.lineJoin = 'round';
    shape.path(ctx, -3 * half, half, size, angle);
    if (shape.stroked) ctx.stroke();
    else ctx.fill();
    pixels += 4 * half * half;
    return { image, size, half, used: pass };
}

/** Drops the sprites stamped longest ago, until they take three quarters of the budget. */
function evict(): void {
    const all: [Map<number, Sprite>, number, Sprite][] = [];
    for (const byColour of sprites.values()) {
        for (const byKey of byColour.values()) for (const [key, sprite] of byKey) all.push([byKey, key, sprite]);
    }
    all.sort((x, y) => x[2].used - y[2].used);
    for (const [byKey, key, sprite] of all) {
        if (pixels <= BUDGET * 0.75) return;
        byKey.delete(key);
        pixels -= 4 * sprite.half * sprite.half;
    }
}

/** The sprite for this glow, cast if it is new; none if it would be wider than WIDEST. Sizes and widths are in px on screen. */
function sprite(shape: Shape, size: number, angle: number, width: number, colour: string, blur: number): Sprite | undefined {
    const s = step(size);
    const w = width && step(width);
    const [cs, cw] = [2 ** (s / STEPS), width && 2 ** (w / STEPS)];
    // The glow reaches three standard deviations (half the blur each) past the shape.
    const half = Math.ceil((shape.reach ?? 1) * cs + cw / 2 + 1.5 * blur) + 1;
    if (2 * half > WIDEST) return undefined;
    const { turn } = shape;
    const t = turn ? Math.round(((((angle % turn) + turn) % turn) / turn) * TURNS) % TURNS : 0;
    // Blurs come in whole or half px; below WIDEST the steps, from -16 at LEAST, stay under 112, so no field runs into the next. Fills take width 0.
    const key = ((Math.round(blur * 2) * 128 + s + 16) * 128 + (width && w + 17)) * TURNS + t;
    let byColour = sprites.get(shape);
    if (!byColour) sprites.set(shape, (byColour = new Map()));
    let byKey = byColour.get(colour);
    if (!byKey) byColour.set(colour, (byKey = new Map()));
    let found = byKey.get(key);
    if (!found) {
        byKey.set(key, (found = cast(shape, cs, turn ? (t / TURNS) * turn : 0, cw, colour, blur, half)));
        if (pixels > BUDGET) evict();
    }
    found.used = pass;
    return found;
}

/** Stamps the glow of `shape` at the context's alpha times the paint's. False if it is too wide for a sprite. */
function stamp(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number, angle: number, paint: string, colour: string, blur: number, offset: number): boolean {
    // A stroked shape smaller than LEAST still glows as a dot as wide as its line.
    const d = shape.stroked ? Math.max(size * scale, LEAST) : size * scale;
    if (d < LEAST) return true;
    const found = sprite(shape, d, angle, shape.stroked ? ctx.lineWidth * scale : 0, colour, blur);
    if (!found) return false;
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha * opacity(paint);
    // Stretched by the little the size is off the one it was cast at, so the glow hugs the shape; a shadow's offset is on screen.
    const h = (found.half * d) / found.size / scale;
    const o = offset / scale;
    ctx.drawImage(found.image, x + o - h, y + o - h, 2 * h, 2 * h);
    ctx.globalAlpha = alpha;
    return true;
}

/**
 * Gives `shape` at (x, y), `size` and `angle`, which is painted next in `paint`, the glow shadowBlur `blur` in `colour`
 * would give it, offset by `offset` px on screen. While stamping, its sprite is stamped now and the shadow turned off;
 * otherwise the shadow is set for the paint to cast.
 */
export function glow(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number, angle: number,
    paint: string, colour: string, blur: number, offset = 0): void {
    if (scale && (blur || offset) && stamp(ctx, shape, x, y, size, angle, paint, colour, blur, offset)) {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    } else {
        ctx.shadowColor = colour;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = ctx.shadowOffsetY = offset;
    }
}

/** Fills the current path, which must be `shape` as path() traces it with these arguments, in `paint`, or strokes it if the shape is stroked, with its glow(). */
export function shine(ctx: CanvasRenderingContext2D, shape: Shape, x: number, y: number, size: number, angle: number,
    paint: string, colour: string, blur: number, offset = 0): void {
    glow(ctx, shape, x, y, size, angle, paint, colour, blur, offset);
    if (shape.stroked) {
        ctx.strokeStyle = paint;
        ctx.stroke();
    } else {
        ctx.fillStyle = paint;
        ctx.fill();
    }
}

/** Paints a disc as disc() describes, here as a path. */
function paintDisc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, alpha: number, soft: boolean): void {
    if (soft) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
        gradient.addColorStop(0, translucent(colour, alpha));
        gradient.addColorStop(0.4, translucent(colour, alpha * 0.5));
        gradient.addColorStop(1, translucent(colour, 0));
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = translucent(colour, alpha);
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Fills a disc of radius `r` round (x, y) in `colour` at `alpha`: flat, or soft as v1's firework sparks were
 * (old_node_animations.js:1975-1983), a gradient that falls to half the alpha at the rim. While stamping, it is a
 * sprite of the disc painted once at the nearest of eight sizes an octave and stretched the rest of the way, at the
 * context's alpha times `alpha`; otherwise it is painted as a path.
 */
export function disc(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, colour: string, alpha: number, soft: boolean): void {
    if (!scale) {
        paintDisc(ctx, x, y, r, colour, alpha, soft);
        return;
    }
    const d = r * scale;
    if (d < LEAST) return;
    const s = step(d);
    let byKey = discs.get(colour);
    if (!byKey) discs.set(colour, (byKey = new Map()));
    const key = (s + 16) * 2 + Number(soft);
    let found = byKey.get(key);
    if (!found) {
        const size = 2 ** (s / STEPS);
        const half = Math.ceil(size) + 1;
        const image = offscreen(2 * half, 2 * half);
        paintDisc(image.getContext('2d') as CanvasRenderingContext2D, half, half, size, colour, 1, soft);
        byKey.set(key, (found = { image, size, half, used: pass }));
    }
    const before = ctx.globalAlpha;
    ctx.globalAlpha = before * alpha;
    const h = (found.half * d) / found.size / scale;
    ctx.drawImage(found.image, x - h, y - h, 2 * h, 2 * h);
    ctx.globalAlpha = before;
}
