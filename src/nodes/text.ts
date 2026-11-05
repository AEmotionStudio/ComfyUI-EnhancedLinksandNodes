/**
 * The title styles, drawn in place of the native title. v1's five TextAnimator
 * styles (old_node_animations.js:1001-1199), each drawn as v1 drew it and then
 * livened up: Neon pulse's glowing layers under a white highlight, with a surge
 * of current running across them; Glitch's pink, cyan and yellow copies sliding
 * apart, with slices of the title tearing sideways in bursts; Retro's red and
 * cyan ghosts, with a VHS tracking band rolling down; Simple pulse's breathing
 * glow, swelling with each breath; and Minimal's fade over an underline that
 * draws itself in and out. And eight of our own: Rainbow wave, Bounce,
 * Typewriter, Decode, Molten, Chrome shine, Groovy 70s and Hologram.
 *
 * The title is native's own text, with its pin and cut as native cuts it, in
 * Title size of native's font and with Title letter spacing. Title offset X and
 * Y move it, Title orbit radius circles it, and Title rotation turns it about
 * its middle. The node phase turns a radian every 15 / (2π) s at Node effect
 * speed 1, so what swings at k times the phase swings k / 5 times a second at
 * the fastest speed, 3: no style's brightness swings at more than ten times the
 * phase, twice a second, within MAX_FLASH_HZ, and what sweeps over the title
 * lights each point once a cycle. A cycle starts at STILL_NODE's phase on its
 * resting pose, the whole title, so a title held still can be read.
 *
 * @module nodes/text
 */

import type { LGraphNode } from '@comfyorg/comfyui-frontend-types';
import { N, revision } from '@/core/settings';
import { translucent } from '@/core/colors';

/** A title's characters as drawn, each a grapheme, and where each starts from the title's left edge. */
interface Letters {
    chars: string[];
    x: number[];
}

/** The text a title shows, how wide it is in the styled title's font, and its letters once a style drew them one by one. */
interface Title {
    text: string;
    width: number;
    letters?: Letters;
}

const TAU = 2 * Math.PI;

/** Glitch's copies, behind the title: hot pink, cyan and yellow, at their alphas (old_node_animations.js:1128-1134). */
const GLITCH: [colour: string, alpha: number][] = [['#ff0080', 0.7], ['#00ffff', 0.7], ['#ffff00', 0.5]];
/** Groovy 70s' copies stacked behind the title, back to front. */
const GROOVY = ['#7a3b10', '#d9411e', '#f26b1d', '#f2a81d'];
/** Chrome shine's metal, top to bottom: a bright rim, a dark band, a second shine and a dark foot. */
const CHROME: [offset: number, colour: string][] = [[0, '#f4f6f8'], [0.45, '#9aa3ad'], [0.55, '#e9edf1'], [1, '#5d6670']];
/** Molten's heat, top to bottom: Ember Crown's gold, orange and red, whatever the node colours. */
const MOLTEN: [offset: number, colour: string][] = [[0, '#ffd166'], [0.5, '#ff7a1a'], [1, '#ff3d00']];
/** The glyphs Decode's letters scramble through. */
const GLYPHS = '01#$%&*+=<>/\\?@ABCDEFXZ';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

let fontSince = -1;
let family = '';
let font = '';
let spacing = '';

/** Sets the styled title's font: Title size of native's font (LGraphNode.titleFontStyle), and Title letter spacing. */
function setFont(ctx: CanvasRenderingContext2D): void {
    if (fontSince !== revision || family !== LiteGraph.NODE_FONT) {
        [fontSince, family] = [revision, LiteGraph.NODE_FONT];
        font = `${N.textSize}px ${family}`;
        spacing = `${N.textLetterSpacing}px`;
    }
    ctx.font = font;
    ctx.letterSpacing = spacing;
}

/** Native's truncateText (FE157 utils/textUtils.ts L11-49): `text` if it fits `room`, else as much as fits with '...'. */
function cut(ctx: CanvasRenderingContext2D, text: string, room: number): string {
    const width = (part: string) => ctx.measureText(part).width;
    if (room <= 0 || width(text) <= room) return text;
    const left = room - width('...');
    if (left <= 0) return '...';
    let [low, high, fits] = [0, text.length, 0];
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (width(text.substring(0, mid)) <= left) [fits, low] = [mid, mid + 1];
        else high = mid - 1;
    }
    return `${text.substring(0, fits)}...`;
}

/** What each node's title showed last, and what that came from. */
const shown = new WeakMap<LGraphNode, Title & { title: string; pinned: boolean; collapsed: boolean; room: number; since: number }>();

/**
 * The title `node` shows, as native's drawTitleText makes it (FE157 LGraphNode.ts L4067-4106, FE1395 L3735-3774): its
 * title with a pin while pinned, cut to 20 characters on a collapsed node, else to the title bar less a title height
 * each side and the room of its title buttons, here measured in the styled title's font. Kept until one of those
 * changes. Sets the context's font.
 */
export function titleOf(ctx: CanvasRenderingContext2D, node: LGraphNode): Title {
    setFont(ctx);
    let room = node.renderingSize[0] - LiteGraph.NODE_TITLE_HEIGHT * 2;
    let buttons = 0;
    for (const button of node.title_buttons) if (button.visible) buttons += button.getWidth(ctx) + 2;
    if (buttons > 0) room -= buttons - 20;
    const { title, pinned } = node;
    const collapsed = Boolean(node.flags.collapsed);
    let last = shown.get(node);
    if (!last || last.title !== title || last.pinned !== pinned || last.collapsed !== collapsed || last.room !== room || last.since !== revision) {
        const full = title + (pinned ? '📌' : '');
        const text = collapsed ? full.substring(0, 20) : cut(ctx, full, room);
        shown.set(node, (last = { text, width: ctx.measureText(text).width, title, pinned, collapsed, room, since: revision }));
    }
    return last;
}

/** `title`'s letters, measured in the styled title's font the first time a style asks, and kept with the title. */
function lettersOf(ctx: CanvasRenderingContext2D, title: Title): Letters {
    if (!title.letters) {
        const chars = Array.from(graphemes.segment(title.text), (part) => part.segment);
        const x: number[] = [];
        let before = '';
        for (const char of chars) {
            x.push(ctx.measureText(before).width);
            before += char;
        }
        title.letters = { chars, x };
    }
    return title.letters;
}

/** How far into a cycle that runs `rate` times a turn of the node phase `phase` is, from 0, its resting pose at STILL_NODE's phase, to 1. */
function cycle(phase: number, rate: number): number {
    const u = (((phase - Math.PI / 4) * rate) / TAU) % 1;
    return u < 0 ? u + 1 : u;
}

/** A well-mixed 32-bit number from two integers, which picks Glitch's tears and Decode's glyphs. */
function hash(a: number, b: number): number {
    let h = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(b + 0x632be5ab, 0xc2b2ae35);
    h ^= h >>> 15;
    h = Math.imul(h, 0x2c1b3c6d);
    return (h ^ (h >>> 12)) >>> 0;
}

const fill = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: string | CanvasGradient) => {
    ctx.fillStyle = style;
    ctx.fillText(text, x, y);
};

/** Clips to the rectangle x, y, w, h. */
function clipTo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
}

/**
 * Draws `title` in Text.Style, left-aligned on (x, y) with v1's middle baseline, in `colour`, at node phase `phase` and
 * at `fade` times each alpha it sets. Leaves the context as it found it.
 */
export function drawTitle(ctx: CanvasRenderingContext2D, title: Title, x: number, y: number, colour: string, phase: number, fade: number): void {
    const { text, width } = title;
    const glow = N.textGlow;
    const size = N.textSize;
    let tx = x + N.textPositionX;
    let ty = y + N.textPositionY;
    if (N.textRotationRadius > 0) {
        tx += Math.cos(phase * 2) * N.textRotationRadius;
        ty += Math.sin(phase * 2) * N.textRotationRadius;
    }
    ctx.save();
    try {
        setFont(ctx);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
        ctx.globalAlpha = fade;
        if (N.textRotationAngle !== 0) {
            const middle = tx + width / 2;
            ctx.translate(middle, ty);
            ctx.rotate((N.textRotationAngle * Math.PI) / 180);
            ctx.translate(-middle, -ty);
        }
        switch (N.textStyle) {
            case 'cyberpunk': {
                const offset = Math.sin(phase * 10) * 2;
                const alpha = 0.7 * glow;
                for (let i = 0; i < GLITCH.length; i++) {
                    const [copy, opacity] = GLITCH[i];
                    ctx.shadowColor = translucent(copy, alpha);
                    ctx.shadowBlur = 5 * glow;
                    fill(ctx, text, tx + offset * (i - 1), ty, translucent(copy, opacity));
                }
                ctx.shadowColor = translucent(colour, alpha);
                ctx.shadowBlur = 10 * glow;
                fill(ctx, text, tx, ty, colour);
                // Two bursts a cycle, each tearing two slices of the title sideways for an eighth of the half cycle.
                const bursts = cycle(phase, 3) * 2;
                const burst = Math.floor(bursts);
                if (bursts - burst < 0.125) {
                    ctx.shadowBlur = 0;
                    const seed = Math.floor(((phase - Math.PI / 4) * 3) / TAU) * 2 + burst;
                    for (let j = 0; j < 2; j++) {
                        const h = hash(seed, j);
                        const shift = (3 + (h % 3)) * ((h >>> 2) & 1 ? 1 : -1);
                        ctx.save();
                        clipTo(ctx, tx - 8, ty - size / 2 + ((h >>> 3) % 80) * size * 0.01, width + 16, 2 + ((h >>> 10) % 3));
                        fill(ctx, text, tx + shift, ty, j ? GLITCH[1][0] : colour);
                        ctx.restore();
                    }
                }
                break;
            }
            case 'retro': {
                const scan = Math.sin(phase * 5) * 0.5;
                fill(ctx, text, tx - 1, ty + scan, 'rgba(255, 0, 0, 0.5)');
                fill(ctx, text, tx + 1, ty - scan, 'rgba(0, 255, 255, 0.5)');
                ctx.shadowColor = colour;
                ctx.shadowBlur = 3 * glow;
                fill(ctx, text, tx, ty, colour);
                // A tracking band rolls down through the title once a cycle, showing it brighter and pushed aside.
                clipTo(ctx, tx - 4, ty - size * 0.7 + cycle(phase, 3) * size * 1.4, width + 8, 3);
                ctx.shadowBlur = 6 * glow;
                fill(ctx, text, tx + 1.5, ty, '#ffffff');
                break;
            }
            case 'pulse': {
                const beat = 0.5 + Math.sin(phase * 2) * 0.5;
                const middle = tx + width / 2;
                ctx.translate(middle, ty);
                ctx.scale(1 + beat * 0.04, 1 + beat * 0.04);
                ctx.translate(-middle, -ty);
                ctx.globalAlpha = (0.8 + beat * 0.2) * fade;
                ctx.shadowColor = colour;
                ctx.shadowBlur = 10 * glow * beat;
                fill(ctx, text, tx, ty, colour);
                break;
            }
            case 'minimal': {
                const alpha = 0.7 + Math.sin(phase * 2) * 0.3;
                ctx.globalAlpha = alpha * fade;
                ctx.shadowColor = colour;
                ctx.shadowBlur = 3 * glow;
                fill(ctx, text, tx, ty, colour);
                // Whole for half the cycle, then it slides off to the right, and draws itself in again from the left.
                const u = cycle(phase, 2);
                const [from, to] = u < 0.5 ? [0, 1] : u < 0.65 ? [(u - 0.5) / 0.15, 1] : u < 0.7 ? [1, 1] : [0, (u - 0.7) / 0.3];
                if (to > from) {
                    ctx.beginPath();
                    ctx.strokeStyle = colour;
                    ctx.lineWidth = 1;
                    ctx.globalAlpha = alpha * 0.5 * fade;
                    ctx.moveTo(tx + width * from, ty + 10);
                    ctx.lineTo(tx + width * to, ty + 10);
                    ctx.stroke();
                }
                break;
            }
            case 'rainbow': {
                const { chars, x: at } = lettersOf(ctx, title);
                ctx.shadowColor = translucent('#ffffff', 0.5 * glow);
                ctx.shadowBlur = 8 * glow;
                fill(ctx, text, tx, ty, translucent('#ffffff', 0.2 * glow));
                ctx.shadowBlur = 0;
                const turn = (phase * 3 * 180) / Math.PI;
                for (let i = 0; i < chars.length; i++) {
                    const hue = Math.round(i * 25 + turn) % 360;
                    fill(ctx, chars[i], tx + at[i], ty + Math.sin(phase * 10 - i * 0.6) * 3, `hsl(${hue < 0 ? hue + 360 : hue}, 100%, 65%)`);
                }
                break;
            }
            case 'bounce': {
                const { chars, x: at } = lettersOf(ctx, title);
                ctx.shadowColor = colour;
                ctx.shadowBlur = 6 * glow;
                fill(ctx, text, tx, ty, translucent(colour, 0.15 * glow));
                ctx.shadowBlur = 0;
                ctx.fillStyle = colour;
                const foot = ty + size * 0.35;
                for (let i = 0; i < chars.length; i++) {
                    const lift = Math.abs(Math.sin(phase * 6 - i * 0.5));
                    if (lift >= 0.15) {
                        ctx.fillText(chars[i], tx + at[i], ty - lift * 5);
                        continue;
                    }
                    // Landing: squashed wide and flat about the middle of its foot.
                    const middle = tx + (at[i] + (at[i + 1] ?? width)) / 2;
                    ctx.save();
                    ctx.translate(middle, foot);
                    ctx.scale(1.1, 0.88);
                    ctx.fillText(chars[i], tx + at[i] - middle, ty - foot);
                    ctx.restore();
                }
                break;
            }
            case 'typewriter': {
                const { chars, x: at } = lettersOf(ctx, title);
                const n = chars.length;
                // Holds the whole title, backspaces it, waits, and types it again.
                const u = cycle(phase, 2);
                const typed = u < 0.45 ? n : u < 0.55 ? Math.ceil((n * (0.55 - u)) / 0.1) : u < 0.6 ? 0 : Math.min(n, Math.ceil((n * (u - 0.6)) / 0.4));
                ctx.shadowColor = colour;
                ctx.shadowBlur = 6 * glow;
                if (typed > 0) fill(ctx, typed === n ? text : chars.slice(0, typed).join(''), tx, ty, colour);
                // The caret blinks while the title rests and stays lit while it types.
                if (u >= 0.45 || Math.sin(phase * 10) > 0) ctx.fillRect(tx + (typed < n ? at[typed] : width) + 1, ty - size * 0.45, Math.max(1.5, size * 0.1), size * 0.9);
                break;
            }
            case 'decode': {
                ctx.shadowColor = colour;
                ctx.shadowBlur = 6 * glow;
                // Resolved for half the cycle, then every letter scrambles, and they lock left to right.
                const u = cycle(phase, 2);
                if (u < 0.5) {
                    fill(ctx, text, tx, ty, colour);
                    break;
                }
                const { chars, x: at } = lettersOf(ctx, title);
                const n = chars.length;
                const step = Math.floor((phase * 60) / TAU);
                ctx.shadowBlur = 0;
                for (let i = 0; i < n; i++) {
                    if (!chars[i].trim()) continue;
                    const lockAt = 0.6 + (0.4 * (i + 1)) / n;
                    if (u < lockAt) {
                        ctx.globalAlpha = 0.7 * fade;
                        fill(ctx, GLYPHS[hash(i, step) % GLYPHS.length], tx + at[i], ty, colour);
                        continue;
                    }
                    const popping = u - lockAt < 0.05;
                    ctx.globalAlpha = fade;
                    ctx.shadowBlur = popping ? 8 * glow : 0;
                    fill(ctx, chars[i], tx + at[i], ty, popping ? '#ffffff' : colour);
                }
                break;
            }
            case 'molten': {
                const drift = Math.sin(phase * 4) * 2;
                const heat = ctx.createLinearGradient(0, ty - size / 2 + drift, 0, ty + size / 2 + drift);
                for (const [offset, shade] of MOLTEN) heat.addColorStop(offset, shade);
                ctx.shadowColor = 'rgba(255, 61, 0, 0.8)';
                ctx.shadowBlur = 8 * glow * (0.85 + (0.15 * (Math.sin(phase * 7) + 0.5 * Math.sin(phase * 10.3))) / 1.5);
                fill(ctx, text, tx, ty, heat);
                break;
            }
            case 'chrome': {
                const metal = ctx.createLinearGradient(0, ty - size / 2, 0, ty + size / 2);
                for (const [offset, shade] of CHROME) metal.addColorStop(offset, shade);
                ctx.shadowColor = translucent(colour, 0.6 * glow);
                ctx.shadowBlur = 4 * glow;
                ctx.strokeStyle = 'rgba(20, 24, 30, 0.8)';
                ctx.lineWidth = 1;
                ctx.strokeText(text, tx, ty);
                fill(ctx, text, tx, ty, metal);
                // A sheen sweeps across in the first 30% of the cycle and is off the title the rest.
                const u = cycle(phase, 3);
                if (u < 0.3) {
                    const band = size * 1.7;
                    const at = tx - band + ((width + 2 * band) * u) / 0.3;
                    const sheen = ctx.createLinearGradient(at - band / 2, 0, at + band / 2, 0);
                    sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
                    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
                    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.shadowBlur = 0;
                    fill(ctx, text, tx, ty, sheen);
                }
                break;
            }
            case 'groovy': {
                const sway = 1 + 0.4 * Math.sin(phase * 6);
                for (let i = 0; i < GROOVY.length; i++) {
                    const step = (GROOVY.length - i) * 1.6;
                    fill(ctx, text, tx + step * sway, ty + step, GROOVY[i]);
                }
                ctx.shadowColor = translucent(colour, 0.6 * glow);
                ctx.shadowBlur = 3 * glow;
                fill(ctx, text, tx, ty, colour);
                break;
            }
            case 'hologram': {
                ctx.shadowColor = translucent(colour, 0.6 * glow);
                ctx.shadowBlur = 6 * glow;
                ctx.globalAlpha = 0.35 * fade;
                fill(ctx, text, tx, ty, colour);
                // Bright 2 px lines every 4 px drifting up, no line passing a point more than 2.5 times a second; a
                // jolt sideways and back once a cycle.
                const u = cycle(phase, 3);
                const drift = (((-phase * 8) % 4) + 4) % 4;
                ctx.beginPath();
                for (let line = ty - size / 2 - 4 + drift; line < ty + size / 2 + 2; line += 4) ctx.rect(tx - 4, line, width + 8, 2);
                ctx.clip();
                ctx.globalAlpha = (0.75 + 0.2 * Math.sin(phase * 8)) * fade;
                fill(ctx, text, tx + (u >= 0.5 && u < 0.55 ? (u < 0.525 ? 1.5 : -1.5) : 0), ty, colour);
                break;
            }
            default: {
                const pulse = 0.7 + Math.sin(phase * 3) * 0.3;
                const alpha = 0.8 * glow * pulse;
                ctx.shadowColor = translucent(colour, alpha * 0.5);
                ctx.shadowBlur = 20 * glow;
                fill(ctx, text, tx, ty, translucent(colour, alpha * 0.3));
                ctx.shadowBlur = 10 * glow;
                fill(ctx, text, tx, ty, translucent(colour, alpha * 0.6));
                ctx.shadowBlur = 5 * glow;
                fill(ctx, text, tx, ty, colour);
                ctx.shadowBlur = 3;
                ctx.globalAlpha = 0.5 * pulse * fade;
                fill(ctx, text, tx, ty, '#ffffff');
                // A surge of current runs across the tube in the first 30% of the cycle.
                const u = cycle(phase, 2);
                if (u < 0.3) {
                    clipTo(ctx, tx - 1.5 * size + ((width + 2 * size) * u) / 0.3, ty - size, size, size * 2);
                    ctx.shadowColor = colour;
                    ctx.shadowBlur = 8 * glow;
                    ctx.globalAlpha = 0.9 * fade;
                    fill(ctx, text, tx, ty, '#ffffff');
                }
            }
        }
    } finally {
        ctx.restore();
    }
}
