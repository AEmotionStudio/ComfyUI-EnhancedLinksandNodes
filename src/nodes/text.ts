/**
 * The five title styles of v1's TextAnimator (old_node_animations.js:1001-1199),
 * drawn in place of the native title: Neon pulse's three glowing layers under a
 * white highlight, Glitch's pink, cyan and yellow copies sliding apart, Retro's
 * red and cyan ghosts, Simple pulse's breathing glow, and Minimal's fade over an
 * underline. The title is native's own text, with its pin and cut as native
 * cuts it, in Title size of native's font and with Title letter spacing. Title
 * offset X and Y move it, Title orbit radius circles it, and Title rotation
 * turns it about its middle. Each style flickers at up to ten times the node
 * phase, so at the fastest Node effect speed, 3, nothing swings more than twice
 * a second, within MAX_FLASH_HZ.
 *
 * @module nodes/text
 */

import type { LGraphNode } from '@comfyorg/comfyui-frontend-types';
import { N, revision } from '@/core/settings';
import { translucent } from '@/core/colors';

/** The text a title shows, and how wide it is in the styled title's font. */
interface Title {
    text: string;
    width: number;
}

/** Glitch's copies, behind the title: hot pink, cyan and yellow, at their alphas (old_node_animations.js:1128-1134). */
const GLITCH: [colour: string, alpha: number][] = [['#ff0080', 0.7], ['#00ffff', 0.7], ['#ffff00', 0.5]];

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

const fill = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, style: string) => {
    ctx.fillStyle = style;
    ctx.fillText(text, x, y);
};

/**
 * Draws `title` in Text.Style, left-aligned on (x, y) with v1's middle baseline, in `colour`, at node phase `phase` and
 * at `fade` times each alpha v1 set. Leaves the context as it found it.
 */
export function drawTitle(ctx: CanvasRenderingContext2D, title: Title, x: number, y: number, colour: string, phase: number, fade: number): void {
    const { text } = title;
    const glow = N.textGlow;
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
            const middle = tx + title.width / 2;
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
                break;
            }
            case 'retro': {
                const scan = Math.sin(phase * 5) * 0.5;
                fill(ctx, text, tx - 1, ty + scan, 'rgba(255, 0, 0, 0.5)');
                fill(ctx, text, tx + 1, ty - scan, 'rgba(0, 255, 255, 0.5)');
                ctx.shadowColor = colour;
                ctx.shadowBlur = 3 * glow;
                fill(ctx, text, tx, ty, colour);
                break;
            }
            case 'pulse': {
                const beat = 0.5 + Math.sin(phase * 2) * 0.5;
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
                ctx.beginPath();
                ctx.strokeStyle = colour;
                ctx.lineWidth = 1;
                ctx.globalAlpha = alpha * 0.5 * fade;
                ctx.moveTo(tx, ty + 10);
                ctx.lineTo(tx + title.width, ty + 10);
                ctx.stroke();
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
            }
        }
    } finally {
        ctx.restore();
    }
}
