/**
 * Connection assist, after nodezator's hands and eyes (issue #3; ideas only,
 * no assets): while a link is dragged, from an output or an input, as a new
 * link or links moved off a slot or a reroute, it shows where the link can go.
 * The candidate is the slot nearest the link's end within RANGE px on screen,
 * on a node on screen other than the one the link comes from, or on a
 * subgraph's input or output node, whose type LiteGraph.isValidConnection takes
 * in the drag's direction; where native holds the end on a slot or a reroute,
 * that.
 *
 * - Guide line: dashes from the end to the candidate, in the link's colour,
 *   and a ring on it.
 * - Reaching hands: a glove at the end and one at the candidate, which reach
 *   for each other as the end nears and clasp within CLASP px; an open hand
 *   waves at the end while nothing is in reach.
 * - Hands & eyes: the gloves, and a pair of eyes on the candidate's node, else
 *   on the node dragged from, that look at the end and blink now and then.
 *
 * With reduced motion or links frozen nothing pops in, waves, marches or
 * blinks, and the ticker rests. It is drawn over the nodes, as large on screen
 * at any zoom, and only draws: native connects as it always does. A link
 * dropped on the canvas draws none, though native keeps it while the
 * link-release search shows.
 *
 * @module fx/assist
 */

import { app } from '/scripts/app.js';
import { L } from '@/core/settings';
import { clock, env, guard, layers, live, wake } from '@/core/engine';
import { dark, darker } from '@/core/colors';

type Canvas = typeof app.canvas;
type Node = InstanceType<typeof LGraphNode> | NonNullable<Canvas['subgraph']>['inputNode' | 'outputNode'];
type Link = Canvas['linkConnector']['renderLinks'][number];

/** The guard's key, which its toast names when it turns assist off. */
const ASSIST = 'Connection assist';

/** In px on screen: how far from the link's end a slot is in reach, and how near the hands clasp. */
const RANGE = 150;
const CLASP = 75;
/** How far out of its node's box a slot may lie, in graph units: Nodes 2.0's dots sit on its edge. */
const SLACK = 10;
/** How large a reaching glove is while the end is still RANGE away: it grows as the end nears, to 35 px from wrist to fingertips at CLASP. */
const SMALL = 0.75;
/** How far past upright the cosine of the gloves' heading goes before they turn over, so a drag about the vertical keeps them still. */
const FLIP = 0.3;
/** How long a glove, the clasp or the ring takes to pop in, in s. */
const POP_S = 0.18;
/** How far the open hand turns either way as it waves, and how often a second. */
const WAVE = 0.22;
const WAVE_HZ = 0.7;
/** The eyes in px: their radius, how far apart their middles are, their pupils' radius and how far a pupil looks. */
const EYE = 8;
const EYES = 20;
const PUPIL = 3.6;
const LOOK = 3.6;
/** Two blinks every BLINKS s, BLINK_GAP s apart, each BLINK_S long, the first FIRST_BLINK s into a drag. */
const BLINKS = 7.4;
const BLINK_GAP = 4.3;
const BLINK_S = 0.18;
const FIRST_BLINK = 2.6;
/** The guide line's dashes in px, marching toward the slot at 2 a second, under MAX_FLASH_HZ, and its ring's radius. */
const DASH = [6, 6];
const NO_DASH: number[] = [];
const MARCH = 24;
const RING = 9;
/** The gloves' and eyes' white and their outline, which read on dark and light palettes alike, in px. */
const WHITE = '#fdfdfd';
const INK = '#1d1d24';
const OUTLINE = 1.6;

/**
 * The gloves, in px with the wrist at 0, 0 and the fingers toward +x, thumb up, each a stack of shapes inked in turn:
 * the open hand, its fingers spread; the reaching hand, fingers together, and the creases between them; the clasp,
 * about its middle; and the cuffs. Built once.
 */
interface Shapes {
    open: Path2D[];
    reach: Path2D;
    creases: Path2D;
    clasp: Path2D[];
    cuff: Path2D;
    cuffs: Path2D;
}

let shapes: Shapes | undefined;

/** Adds an ellipse about x, y turned by `turn` to `path` as a shape of its own. */
function oval(path: Path2D, x: number, y: number, rx: number, ry: number, turn = 0): void {
    path.moveTo(x + rx * Math.cos(turn), y + rx * Math.sin(turn));
    path.ellipse(x, y, rx, ry, turn, 0, 2 * Math.PI);
}

/** Fingers as [turn, x, y, length, width] halves, every other one in each, so that each outlines the next. */
function fingers(spec: number[][]): Path2D[] {
    const halves = [new Path2D(), new Path2D()];
    spec.forEach(([turn, x, y, rx, ry], i) => oval(halves[i % 2], x, y, rx, ry, turn));
    return halves;
}

function build(): Shapes {
    const open = new Path2D();
    oval(open, 9, 0.5, 10.5, 10);
    oval(open, 10 + 10 * Math.cos(-1.25), 10 * Math.sin(-1.25), 6.5, 3.4, -1.25);
    const spread = [[-0.62, 8.5], [-0.21, 10], [0.2, 9.5], [0.6, 7.5]].map(([turn, length]) => [turn, 10 + 13 * Math.cos(turn), 0.5 + 13 * Math.sin(turn), length, 3.1]);
    const reach = new Path2D();
    oval(reach, 9, 1, 11, 9.5);
    oval(reach, 12.5, -8.6, 7.8, 3.6, -0.55);
    for (const [y, tip, turn] of [[-6.1, 33, -0.05], [-0.8, 35, -0.01], [4.5, 33, 0.03], [9.3, 28.5, 0.08]]) oval(reach, (12 + tip) / 2, y, (tip - 12) / 2, 2.9, turn);
    const creases = new Path2D();
    for (const y of [-3.45, 1.85, 6.9]) {
        creases.moveTo(17, y);
        creases.lineTo(26, y * 1.03);
    }
    // The right hand's fingers wrap the left's palm, under the left's thumb.
    const palms = new Path2D();
    oval(palms, -12, 1, 12.5, 10);
    oval(palms, 12, -0.5, 12.5, 10);
    const wrapped = [[-7.4, -15], [-2.5, -17], [2.4, -16.5], [7.2, -13]].map(([y, tip], i) => [0.1 * i - 0.1, (5 + tip) / 2, y, (5 - tip) / 2, 2.7]);
    const thumb = new Path2D();
    oval(thumb, 2, -9.6, 10, 3.5, -0.14);
    const cuff = new Path2D();
    cuff.roundRect(-10, -9.5, 10.5, 19, 4);
    const cuffs = new Path2D();
    cuffs.roundRect(-35, -9.5, 10.5, 19, 4);
    cuffs.roundRect(24.5, -9.5, 10.5, 19, 4);
    return { open: [open, ...fingers(spread)], reach, creases, clasp: [palms, ...fingers(wrapped), thumb], cuff, cuffs };
}

/** Fills `path` in `colour` over its outline, which shows outside it only: one outline round shapes that overlap. */
function inked(ctx: CanvasRenderingContext2D, path: Path2D, colour: string): void {
    ctx.lineWidth = 2 * OUTLINE;
    ctx.strokeStyle = INK;
    ctx.stroke(path);
    ctx.fillStyle = colour;
    ctx.fill(path);
}

/** Sets the context to draw in px about x, y along `turn`, `size` graph units a px, mirrored with `flip`. */
function place(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number, size: number, flip: boolean): void {
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.scale(size, flip ? -size : size);
}

/** The open hand, or with `reaching` the reaching one, with its wrist at x, y and its fingers toward `turn`, its cuff in `cuff`. */
function glove(ctx: CanvasRenderingContext2D, s: Shapes, reaching: boolean, x: number, y: number, turn: number, size: number, flip: boolean, cuff: string): void {
    ctx.save();
    place(ctx, x, y, turn, size, flip);
    if (reaching) {
        inked(ctx, s.reach, WHITE);
        ctx.lineWidth = 1.2;
        ctx.stroke(s.creases);
    } else for (const part of s.open) inked(ctx, part, WHITE);
    inked(ctx, s.cuff, cuff);
    ctx.restore();
}

/** The two hands clasped about x, y along `turn`. */
function clasp(ctx: CanvasRenderingContext2D, s: Shapes, x: number, y: number, turn: number, size: number, flip: boolean, cuff: string): void {
    ctx.save();
    place(ctx, x, y, turn, size, flip);
    for (const part of s.clasp) inked(ctx, part, WHITE);
    inked(ctx, s.cuffs, cuff);
    ctx.restore();
}

/** How open the eyes are `t` s into a drag: shut halfway through each blink, never quite. */
function lid(t: number): number {
    const p = (t + BLINKS - FIRST_BLINK) % BLINKS;
    const u = p < BLINK_S ? p : p - BLINK_GAP;
    return u >= 0 && u < BLINK_S ? Math.max(0.1, Math.abs(Math.cos((Math.PI * u) / BLINK_S))) : 1;
}

/**
 * A pair of eyes on the middle of the top of `box`, raised as the view zooms out so that they cover no more of its
 * title than at zoom 1, open by `open`, their pupils turned to x, y.
 */
function eyes(ctx: CanvasRenderingContext2D, box: ArrayLike<number>, x: number, y: number, unit: number, open: number): void {
    const cy = box[1] - Math.max(0, unit - 1) * EYE;
    for (let side = -0.5; side <= 0.5; side++) {
        const cx = box[0] + box[2] / 2 + side * EYES * unit;
        ctx.beginPath();
        ctx.ellipse(cx, cy, EYE * unit, EYE * unit * open, 0, 0, 2 * Math.PI);
        ctx.fillStyle = WHITE;
        ctx.fill();
        ctx.lineWidth = OUTLINE * unit;
        ctx.strokeStyle = INK;
        ctx.stroke();
        if (open < 0.5) continue;
        const dx = x - cx;
        const dy = y - cy;
        const far = Math.hypot(dx, dy);
        const k = far ? Math.min(LOOK * unit, far) / far : 0;
        const px = cx + dx * k;
        const py = cy + dy * k * open;
        ctx.beginPath();
        ctx.arc(px, py, PUPIL * unit, 0, 2 * Math.PI);
        ctx.fillStyle = INK;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px - 1.1 * unit, py - 1.1 * unit, 1.1 * unit, 0, 2 * Math.PI);
        ctx.fillStyle = WHITE;
        ctx.fill();
    }
}

/** A dashed line from x, y to the candidate `d` px off along `turn`, stopping at its ring, both popping in by `pop`. */
function line(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number, d: number, unit: number, colour: string, pop: number, march: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.scale(unit, unit);
    ctx.strokeStyle = colour;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.max(0, d - RING), 0);
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2;
    ctx.setLineDash(DASH);
    ctx.lineDashOffset = -march;
    ctx.stroke();
    ctx.setLineDash(NO_DASH);
    ctx.beginPath();
    ctx.arc(d, 0, RING * (SMALL + (1 - SMALL) * pop), 0, 2 * Math.PI);
    ctx.globalAlpha = 0.3 * pop;
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.globalAlpha = pop;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
}

/** 0 to 1 as x goes from 0 to 1, easing in and out. */
const smooth = (x: number) => x * x * (3 - 2 * x);

/** The candidate of the last search: the node and slot, if a node's slot, where it is in graph space, and how far from the end, squared. */
const found = { node: undefined as Node | undefined, slot: -1, x: 0, y: 0, d: 0 };

/** Makes slot `i` of `node`, at sx, sy, the candidate if it is nearer x, y than the one so far. */
function take(node: Node, i: number, sx: number, sy: number, x: number, y: number): void {
    const d = (sx - x) ** 2 + (sy - y) ** 2;
    if (d >= found.d) return;
    found.node = node;
    found.slot = i;
    found.x = sx;
    found.y = sy;
    found.d = d;
}

/**
 * Finds the slot of a node on screen, other than the one `link` comes from, nearest x, y within RANGE px on screen,
 * that the link may connect to: an input of a type LiteGraph takes from its output's, or the other way about. A node
 * whose box is no nearer than the nearest slot so far is passed over.
 */
function seek(canvas: Canvas, link: Link, x: number, y: number): boolean {
    const reach = RANGE / canvas.ds.scale;
    const inputs = canvas.linkConnector.state.connectingTo === 'input';
    const type = link.fromSlot.type;
    found.node = undefined;
    found.slot = -1;
    found.d = reach * reach;
    for (const node of canvas.visible_nodes) {
        const box = node.boundingRect;
        const dx = Math.max(0, box[0] - SLACK - x, x - box[0] - box[2] - SLACK);
        const dy = Math.max(0, box[1] - SLACK - y, y - box[1] - box[3] - SLACK);
        if (node === link.node || dx * dx + dy * dy >= found.d) continue;
        const slots = inputs ? node.inputs : node.outputs;
        for (let i = 0; i < slots.length; i++) {
            if (!LiteGraph.isValidConnection(inputs ? type : slots[i].type, inputs ? slots[i].type : type)) continue;
            const [sx, sy] = inputs ? node.getInputPos(i) : node.getOutputPos(i);
            take(node, i, sx, sy, x, y);
        }
    }
    // A subgraph's output node takes links as inputs do and its input node gives them as outputs do, each with an empty
    // slot of any type after its own; native links neither to the other.
    const { subgraph } = canvas;
    if (subgraph && link.node !== subgraph.inputNode && link.node !== subgraph.outputNode) {
        const io = inputs ? subgraph.outputNode : subgraph.inputNode;
        const { slots } = io;
        for (let i = 0; i <= slots.length; i++) {
            const slot = slots[i] ?? io.emptySlot;
            if (LiteGraph.isValidConnection(inputs ? type : slot.type, inputs ? slot.type : type)) take(io, i, slot.pos[0], slot.pos[1], x, y);
        }
    }
    return found.node !== undefined;
}

/**
 * The link being dragged, as its first render link, and the one dropped on the canvas, which native keeps while the
 * link-release search or menu shows. As a drag starts: when on clock.assistTime, and the colour its link is drawn in.
 * Whether the gloves are mirrored, to keep their thumbs up as the drag heads left. The candidate shown, and when it last
 * changed, or the hands clasped or let go, on clock.assistTime.
 */
let dragged: Link | undefined;
let released: Link | undefined;
let began = 0;
let tint = '';
let mirrored = false;
const shown = { node: undefined as Node | undefined, slot: -1, there: false, clasped: false, since: 0 };

/**
 * Draws Assist.Mode over the link being dragged on `canvas`, in graph space, and keeps the ticker going while anything
 * of it moves: nothing once no link is dragged, or the one dragged was dropped on the canvas.
 */
function drawAssist(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    const { linkConnector } = canvas;
    const link = linkConnector.isConnecting ? linkConnector.renderLinks[0] : undefined;
    if (!link) dragged = released = undefined;
    if (!link || link === released || !L.enabled || L.assistMode === 'off' || guard.off(ASSIST)) {
        live.assist = 0;
        return;
    }
    if (link !== dragged) {
        dragged = link;
        began = clock.assistTime;
        mirrored = false;
        const colour = LGraphCanvas.link_type_colors[String(link.fromSlot.type)] || canvas.default_link_color;
        tint = dark(canvas.clear_background_color) ? colour : darker(colour);
    }
    // Where native draws the link's end: on what it snaps to while it snaps links to slots, else at the pointer (FE157
    // LGraphCanvas.ts _getHighlightPosition). What it would snap to is the candidate all the same.
    const held = canvas._highlight_pos;
    const end = LiteGraph.snaps_for_comfy ? (linkConnector.state.snapLinksPos ?? held ?? canvas.graph_mouse) : canvas.graph_mouse;
    const [x, y] = end;
    const [hx, hy] = held ?? end;
    let there = seek(canvas, link, hx, hy);
    if (held) {
        // A reroute, or a slot this search would not take: the candidate is there all the same, on no node.
        if (!there || Math.abs(found.x - held[0]) + Math.abs(found.y - held[1]) > 1) {
            found.node = undefined;
            found.slot = -1;
        }
        found.x = held[0];
        found.y = held[1];
        there = true;
    }
    const scale = canvas.ds.scale;
    const unit = 1 / scale;
    const d = Math.hypot(found.x - x, found.y - y) * scale;
    const clasped = there && d <= CLASP;
    const t = clock.assistTime;
    if (found.node !== shown.node || found.slot !== shown.slot || there !== shown.there || clasped !== shown.clasped) {
        shown.node = found.node;
        shown.slot = found.slot;
        shown.there = there;
        shown.clasped = clasped;
        shown.since = t;
    }
    const still = env.reducedMotion || L.staticMode;
    const pop = still ? 1 : smooth(Math.min(1, (t - shown.since) / POP_S));
    // What moves: the line's dashes, the open hand's wave, a glove, the clasp or the ring popping in, and the eyes' blinks.
    const moving = !still && (L.assistMode === 'line' ? there : !there || pop < 1 || L.assistMode === 'hands-eyes');
    live.assist = moving ? 1 : 0;
    if (moving) wake();
    if (L.assistMode === 'line' && !there) return;
    const turn = Math.atan2(found.y - y, found.x - x);
    ctx.save();
    try {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (L.assistMode === 'line') return line(ctx, x, y, turn, d, unit, tint, pop, still ? 0 : (MARCH * (t - began)) % (DASH[0] + DASH[1]));
        const s = (shapes ??= build());
        const [fx, fy] = link.fromPos;
        const heading = there ? turn : Math.atan2(y - fy, x - fx);
        mirrored = mirrored ? Math.cos(heading) < FLIP : Math.cos(heading) < -FLIP;
        if (!there) {
            glove(ctx, s, false, x, y, heading + (still ? 0 : WAVE * Math.sin(2 * Math.PI * WAVE_HZ * (t - began))), unit, mirrored, tint);
        } else if (clasped) {
            clasp(ctx, s, (x + found.x) / 2, (y + found.y) / 2, turn, unit * (1.15 - 0.15 * pop), mirrored, tint);
        } else {
            const size = unit * (SMALL + (1 - SMALL) * smooth((RANGE - d) / (RANGE - CLASP)));
            glove(ctx, s, true, x, y, turn, size, mirrored, tint);
            ctx.globalAlpha = pop;
            glove(ctx, s, true, found.x, found.y, turn + Math.PI, size * (SMALL + (1 - SMALL) * pop), !mirrored, tint);
            ctx.globalAlpha = 1;
        }
        if (L.assistMode === 'hands-eyes') eyes(ctx, (found.node ?? link.node).boundingRect, x, y, unit, still ? 1 : lid(t - began));
    } finally {
        ctx.restore();
    }
}

/**
 * Puts connection assist over the nodes of app.canvas, and hears when a link dragged there is dropped on the canvas or
 * the drag ends, which native need not paint for: then what assist drew goes with one paint.
 */
export function installAssist(): void {
    layers.assist = (canvas, ctx) => {
        try {
            drawAssist(canvas, ctx);
        } catch (error) {
            guard.fail(ASSIST, error);
        }
    };
    const { linkConnector } = app.canvas;
    const clear = () => {
        if (dragged) app.canvas.setDirty(true);
    };
    linkConnector.events.addEventListener('dropped-on-canvas', () => {
        released = linkConnector.renderLinks[0];
        clear();
    });
    linkConnector.events.addEventListener('reset', clear);
}
