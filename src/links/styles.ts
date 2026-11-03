/**
 * What Link.Style draws along a segment; what each animation draws under its
 * motion, as v1's renderers drew it first: nothing, a ghost of the link at
 * 30 %, the link with its glow, or Classic Flow's link with its shadow and
 * glow; the flow markers over the motion; and the centre marker native draws
 * on a segment, which sits on our path. Every decoration follows the segment's
 * real path and is spaced from the start of its link, so it carries on across
 * reroutes; dotted and dashed links march with the flow.
 *
 * Ported from v1's LinkRenderers and MarkerShapes (old_link_animations.js:94-257,
 * 406-986) and Classic Flow's markers (:3197-3359), whose decorations ran
 * along a straight line from start to end.
 *
 * @module links/styles
 */

import { clock } from '@/core/engine';
import { L } from '@/core/settings';
import { rainbow } from '@/core/colors';
import { shine, type Shape } from '@/fx/particles';
import { LINEAR_LINK, STRAIGHT_LINK } from './geometry';
import { SACRED, moving, wrap } from './animations';
import type { Segment } from './pipeline';

type Canvas = InstanceType<typeof LGraphCanvas>;

/**
 * The path each Link.Style takes, when it is not Comfy.LinkRenderMode's: another native rule, or a shape of our
 * own; and whether its body moves. Direct is ComfyUI's Linear rule and Right-angle its Straight rule.
 */
export const LINK_STYLES: Record<string, { mode?: number; shape?: 'step' | 'wave' | 'coil'; moving?: boolean }> = {
    spline: {},
    straight: { mode: LINEAR_LINK },
    linear: { mode: STRAIGHT_LINK },
    hidden: {},
    dotted: { moving: true },
    dashed: { moving: true },
    double: {},
    stepped: { shape: 'step' },
    zigzag: { shape: 'wave' },
    coil: { shape: 'coil' },
    rope: {},
    glowpath: {},
    chain: {},
    pulse: {},
    holographic: {},
};

/** Dots and dashes march this many px per unit of flow: 24 px a second at speed 1. */
const MARCH = 12;
/** Rope twists 3 px to each side every 30 px, which gives a 300 px link v1's 10 twists. */
const TWIST = 3;
const TWIST_LENGTH = 30;

const WHITE = 'rgba(255, 255, 255, 0.3)';
const SHADOW = 'rgba(0, 0, 0, 0.95)';

const dash = [0, 0];
const solid: number[] = [];
/** The point and direction every() and the offset lines read from the path. */
const here = new Float64Array(4);

/** Strokes the path dashed, the pattern counted from the start of the link; a marching one moves with the flow, toward the input going Forward. */
function dashes(ctx: CanvasRenderingContext2D, s: Segment, color: string, thickness: number, on: number, off: number, march: boolean): void {
    dash[0] = on;
    dash[1] = off;
    ctx.setLineDash(dash);
    ctx.lineDashOffset = s.u0 - (march ? clock.linkFlow * MARCH : 0);
    s.path.draw(ctx, color, thickness);
    ctx.setLineDash(solid);
    ctx.lineDashOffset = 0;
}

/** Runs `each` at every `gap` px along the link that falls on the segment, with the point and the path's direction there in `here`. */
function every(s: Segment, gap: number, each: () => void): void {
    const { path } = s;
    for (let d = Math.ceil(s.u0 / gap) * gap - s.u0; d < path.length; d += gap) {
        path.find(d, here);
        each();
    }
}

/** Traces a line beside the path, `across(D)` px off it at D px along the link (negative to the other side), sampled every `step` px. */
function beside(ctx: CanvasRenderingContext2D, s: Segment, step: number, across: (D: number) => number): void {
    const { path } = s;
    const count = Math.max(2, Math.ceil(path.length / step) + 1);
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
        const d = (path.length * i) / (count - 1);
        path.find(d, here);
        const off = across(s.u0 + d);
        const x = here[0] - here[3] * off;
        const y = here[1] + here[2] * off;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
    }
}

/** Draws the body Link.Style gives the segment in `color`, at v1's widths for `thickness`: the path itself 0.8 × as wide. */
function drawBody(ctx: CanvasRenderingContext2D, s: Segment, color: string, thickness: number): void {
    const { path } = s;
    const alpha = ctx.globalAlpha;
    switch (s.linkStyle) {
        case 'dotted':
            // Round caps on dashes of no length draw v1's dots, 0.8 × thickness across and 3 × thickness apart.
            ctx.lineCap = 'round';
            dashes(ctx, s, color, thickness, 0, thickness * 3, !s.isStatic);
            return;
        case 'dashed':
            dashes(ctx, s, color, thickness, thickness * 4, thickness * 2, !s.isStatic);
            return;
        case 'double':
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness * 0.4;
            for (const side of [1, -1]) {
                beside(ctx, s, 6, () => side * thickness * 0.8);
                ctx.stroke();
            }
            return;
        case 'rope': {
            const twist = (D: number) => TWIST * Math.sin((2 * Math.PI * D) / TWIST_LENGTH);
            beside(ctx, s, 3, twist);
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness * 1.2;
            ctx.lineCap = 'round';
            ctx.stroke();
            beside(ctx, s, 3, twist);
            ctx.strokeStyle = WHITE;
            ctx.lineWidth = thickness * 0.4;
            ctx.stroke();
            return;
        }
        case 'glowpath': {
            path.draw(ctx, color, thickness);
            const glow = ctx.createLinearGradient(s.start[0], s.start[1], s.end[0], s.end[1]);
            glow.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            glow.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
            glow.addColorStop(1, 'rgba(255, 255, 255, 0.5)');
            ctx.beginPath();
            path.trace(ctx);
            ctx.strokeStyle = glow;
            ctx.lineWidth = thickness * 2;
            ctx.globalAlpha = alpha * 0.5;
            ctx.stroke();
            ctx.globalAlpha = alpha;
            return;
        }
        case 'chain':
            // Rings every 4 × thickness, along the path.
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness * 0.4;
            every(s, thickness * 4, () => {
                ctx.beginPath();
                ctx.ellipse(here[0], here[1], thickness * 2, thickness * 1.2, Math.atan2(here[3], here[2]), 0, Math.PI * 2);
                ctx.stroke();
            });
            return;
        case 'pulse':
            dashes(ctx, s, color, thickness, thickness * 4, thickness * 4, false);
            // A soft blob where each dash starts.
            ctx.globalAlpha = alpha * 0.3;
            every(s, thickness * 8, () => {
                const blob = ctx.createRadialGradient(here[0], here[1], 0, here[0], here[1], thickness * 3);
                blob.addColorStop(0, color);
                blob.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.beginPath();
                ctx.arc(here[0], here[1], thickness * 3, 0, Math.PI * 2);
                ctx.fillStyle = blob;
                ctx.fill();
            });
            ctx.globalAlpha = alpha;
            return;
        case 'holographic': {
            const sheen = ctx.createLinearGradient(s.start[0], s.start[1], s.end[0], s.end[1]);
            sheen.addColorStop(0, color);
            sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
            sheen.addColorStop(1, color);
            ctx.beginPath();
            path.trace(ctx);
            ctx.strokeStyle = sheen;
            ctx.lineWidth = thickness * 1.2;
            ctx.stroke();
            // Scanlines across the path every 2 × thickness.
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            every(s, thickness * 2, () => {
                ctx.beginPath();
                ctx.moveTo(here[0] - here[3] * thickness, here[1] + here[2] * thickness);
                ctx.lineTo(here[0] + here[3] * thickness, here[1] - here[2] * thickness);
                ctx.stroke();
            });
            return;
        }
        default:
            path.draw(ctx, color, thickness);
    }
}

/** What each animation draws under its motion, moving and still: nothing, a ghost of the link at 30 %, the link with its glow, or Classic Flow's. */
type Base = 'none' | 'ghost' | 'glow' | 'classic';

/** v1's (old_link_animations.js:1823-2400, 2554-3359), but that Crystal Stream's still link glows as Sacred Flow's does. */
const BASES: Record<number, [moving: Base, still: Base]> = {
    1: ['none', 'glow'],
    2: ['ghost', 'glow'],
    3: ['ghost', 'ghost'],
    4: ['none', 'none'],
    5: ['ghost', 'ghost'],
    6: ['none', 'none'],
    7: ['none', 'none'],
    8: ['none', 'ghost'],
    9: ['classic', 'classic'],
};

/**
 * How soft the shadow under a Classic Flow link or a marker is, and how far it falls, by Shadow.Style: the dark halo
 * v1 drew, centred and as soft as the glow `blur` (it read Shadow.Blur and Shadow.Offset without registering them, so
 * they came out NaN, which the canvas ignores), or v2's drop shadow.
 */
const shadowBlur = (blur: number) => (L.shadowStyle === 'drop' ? L.shadowBlur * 4 : blur);
const shadowOffset = () => (L.shadowStyle === 'drop' ? L.shadowOffset * 3 : 0);

/**
 * Draws the segment's base for the animation in its primary colour, as wide as its width takes Thickness, with its glow
 * and Classic Flow's shadow unless it is `plain`. Each base sets the glow it is drawn with, where v1's ghosts and Crystal Stream's still link took whatever
 * glow the link before them left. Whether the animation has a base to draw.
 */
export function drawBase(ctx: CanvasRenderingContext2D, s: Segment, animate: number, still: boolean, plain = false): boolean {
    const base = BASES[animate]?.[still ? 1 : 0];
    if (!base || base === 'none' || s.linkStyle === 'hidden') return false;
    const thickness = L.thickness * s.width;
    const color = s.pal.primary;
    ctx.globalAlpha = 1;
    if (base === 'classic' && L.linkShadowEnabled && !plain) {
        ctx.shadowColor = SHADOW;
        ctx.shadowBlur = shadowBlur(L.glowIntensity);
        ctx.shadowOffsetX = ctx.shadowOffsetY = shadowOffset();
        ctx.strokeStyle = SHADOW;
        ctx.lineWidth = thickness * 1.2;
        drawBody(ctx, s, SHADOW, thickness * 1.2);
    }
    ctx.shadowColor = color;
    ctx.shadowBlur = plain ? 0 : L.glowIntensity;
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    ctx.strokeStyle = color;
    ctx.lineWidth = base === 'glow' ? thickness * 1.5 : thickness;
    if (base === 'ghost') ctx.globalAlpha = 0.3;
    drawBody(ctx, s, color, thickness);
    ctx.globalAlpha = 1;
    return true;
}

/** A triangle `size` from its centre to each corner, its first corner at `angle`. */
function triangle(ctx: CanvasRenderingContext2D, size: number, angle: number): void {
    for (let i = 0; i <= SACRED.TRINITY; i++) {
        const a = angle + (i / SACRED.TRINITY) * Math.PI * 2;
        if (i) ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
        else ctx.moveTo(Math.cos(a) * size, Math.sin(a) * size);
    }
}

/**
 * The marker shapes: each traces its path, centred on (x, y) and `size` out from there, and is filled, or stroked
 * `width` times its size wide. An arrow points along `angle`; a merkaba turns by it.
 */
const MARKERS: Record<string, Shape & { width?: number }> = {
    diamond: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y);
            ctx.lineTo(x, y + size);
            ctx.lineTo(x - size, y);
            ctx.closePath();
        },
    },
    circle: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.closePath();
        },
    },
    arrow: {
        path(ctx, x, y, size, angle) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(size, 0);
            ctx.lineTo(-size, size);
            ctx.lineTo(-size * 0.5, 0);
            ctx.lineTo(-size, -size);
            ctx.closePath();
            ctx.restore();
        },
        turn: Math.PI * 2,
        reach: Math.SQRT2,
    },
    square: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            ctx.rect(x - size, y - size, size * 2, size * 2);
            ctx.closePath();
        },
    },
    triangle: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + size, y + size);
            ctx.lineTo(x - size, y + size);
            ctx.closePath();
        },
    },
    star: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? size : size * 0.4;
                const a = (i * Math.PI) / 5;
                if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
                else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
            }
            ctx.closePath();
        },
    },
    heart: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(size * 0.7, size * 0.7);
            ctx.moveTo(0, 0.4);
            ctx.bezierCurveTo(0, 0.3, -0.5, -0.4, -1, -0.4);
            ctx.bezierCurveTo(-1.5, -0.4, -1.5, 0.2, -1.5, 0.2);
            ctx.bezierCurveTo(-1.5, 0.6, -0.5, 1.4, 0, 2);
            ctx.bezierCurveTo(0.5, 1.4, 1.5, 0.6, 1.5, 0.2);
            ctx.bezierCurveTo(1.5, 0.2, 1.5, -0.4, 1, -0.4);
            ctx.bezierCurveTo(0.5, -0.4, 0, 0.3, 0, 0.4);
            ctx.restore();
            ctx.closePath();
        },
        // Its point is 2 × 0.7 sizes down.
        reach: 1.4,
    },
    cross: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x, y + size);
            ctx.moveTo(x - size, y);
            ctx.lineTo(x + size, y);
            ctx.closePath();
        },
        stroked: true,
        width: 0.3,
    },
    hexagon: {
        path(ctx, x, y, size) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI) / 3;
                if (i) ctx.lineTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
                else ctx.moveTo(x + Math.cos(a) * size, y + Math.sin(a) * size);
            }
            ctx.closePath();
        },
    },
    flower: {
        path(ctx, x, y, size) {
            const inner = size * 0.3;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (i * Math.PI * 2) / 6;
                const next = ((i + 1) * Math.PI * 2) / 6;
                const mid = (a + next) / 2;
                if (i) ctx.lineTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
                else ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
                ctx.quadraticCurveTo(x + Math.cos(mid) * size * 1.5, y + Math.sin(mid) * size * 1.5, x + Math.cos(next) * inner, y + Math.sin(next) * inner);
            }
            ctx.closePath();
            ctx.moveTo(x + inner, y);
            ctx.arc(x, y, inner, 0, Math.PI * 2);
        },
    },
    spiral: {
        // Three turns out from the centre: an open line, which filling would close into a blob.
        path(ctx, x, y, size) {
            ctx.beginPath();
            for (let i = 0; i <= 40; i++) {
                const t = i / 40;
                const [r, a] = [size * t, t * 3 * Math.PI * 2];
                if (i) ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
                else ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
            }
        },
        stroked: true,
        width: 0.2,
    },
    merkaba: {
        // v1's createMerkaba (old_link_animations.js:1493-1520), which it never drew: two triangles, a sixth of a turn apart.
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
        width: 0.15,
        turn: Math.PI / SACRED.TRINITY,
    },
};

/** Fills or strokes a marker in `color`, glowing `blur` px in `glow`, `offset` px off on screen. */
function mark(ctx: CanvasRenderingContext2D, shape: (typeof MARKERS)[string], x: number, y: number, size: number, angle: number,
    color: string, glow: string, blur: number, offset = 0): void {
    shape.path(ctx, x, y, size, angle);
    if (shape.stroked) {
        ctx.lineWidth = size * shape.width!;
        ctx.lineCap = 'round';
    }
    shine(ctx, shape, x, y, size, angle, color, glow, blur, offset);
}

/**
 * The flow markers on a segment, over its motion: Classic Flow's, or every animation's with Marker.All. A link carries
 * floor(3 × Quality × Marker.Size × Particle.Density × 0.5) of them, at least one; they glide toward the input going
 * Forward at a tenth of the flow, or hold their places while still (`flow` undefined). An arrow points the way they
 * flow, a merkaba turns with the phase. Each has its shadow under it and its glow; Pulse fades it in and out with the
 * phase along the link, Fade toward the input, and Rainbow runs it through the hues.
 */
export function drawMarkers(ctx: CanvasRenderingContext2D, s: Segment, phase: number, flow?: number): void {
    const shape = MARKERS[L.markerShape];
    if (!L.markerEnabled || !shape) return;
    const size = 3 * L.markerSize;
    const count = Math.max(1, Math.floor(SACRED.TRINITY * L.quality * L.markerSize * L.particleDensity * moving.density * 0.5));
    const { pal } = s;
    for (let i = 0; i < count; i++) {
        const T = flow === undefined ? i / count : wrap(i / count + flow * 0.1);
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        const angle = L.markerShape === 'arrow' ? Math.atan2(here[3], here[2]) + (L.direction < 0 ? Math.PI : 0) : L.markerShape === 'merkaba' ? phase : 0;
        let color = pal.marker;
        let alpha = 1;
        if (L.markerEffects === 'pulse') alpha = 0.5 + Math.sin(phase + T * Math.PI * 2) * 0.5;
        else if (L.markerEffects === 'fade') alpha = 1 - T;
        else if (L.markerEffects === 'rainbow') color = rainbow(T * 360 + phase * 50);
        ctx.globalAlpha = alpha * moving.alpha;
        if (L.markerShadowEnabled) mark(ctx, shape, here[0], here[1], size * 1.2, angle, SHADOW, SHADOW, shadowBlur(L.markerGlow * moving.glow), shadowOffset());
        // A rainbow marker glows in the link's colour.
        mark(ctx, shape, here[0], here[1], size, angle, color, L.markerEffects === 'rainbow' ? pal.primary : color, L.markerGlow * moving.glow);
    }
}

/** LinkMarkerShape.Arrow; None (0) draws no centre marker and any other shape a circle (litegraphLinkAdapter.ts L105-108). */
const ARROW = 2;

/** The centre marker native draws on a segment (pathRenderer.ts L149-156, L798-837), in native's colour unless given a fill, at the centre of our path. */
export function centreMarker(canvas: Canvas, ctx: CanvasRenderingContext2D, s: Segment, fill: string | CanvasPattern = s.pal.native): void {
    const shape: number = canvas.linkMarkerShape;
    if (!shape || canvas.ds.scale < 0.6 || !canvas.highquality_render) return;
    const { cx, cy, angle } = s.path;
    ctx.beginPath();
    if (shape === ARROW) {
        // (-3.2, -5), (7, 0), (-3.2, 5), turned to the angle around the centre.
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.moveTo(cx - 3.2 * cos + 5 * sin, cy - 3.2 * sin - 5 * cos);
        ctx.lineTo(cx + 7 * cos, cy + 7 * sin);
        ctx.lineTo(cx - 3.2 * cos - 5 * sin, cy - 3.2 * sin + 5 * cos);
    } else {
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    }
    ctx.fillStyle = fill;
    ctx.fill();
}
