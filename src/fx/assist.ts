/**
 * Connection assist, after nodezator's hands and eyes (issue #3; ideas only,
 * no assets): while a link is dragged, from an output or an input, as a new
 * link or links moved off a slot or a reroute, it shows where the link can go.
 * The candidate is the slot nearest the link's end within RANGE px,
 * on a node on screen other than the one the link comes from, or on a
 * subgraph's input or output node, whose type LiteGraph.isValidConnection takes
 * in the drag's direction; where native holds the end on a slot or a reroute,
 * that.
 *
 * - Guide line: dashes from the end to the candidate, in the link's colour,
 *   and a ring on it.
 * - Reaching hands: a glove at the end and one at the candidate, which
 *   reaches out on its arm for the end's as it nears; they clasp, as 🤝 does,
 *   within CLASP px, and with Assist.Shine light bursts from the clasp. The
 *   end's glove sways while nothing is in reach. Both are right hands, turned
 *   but never mirrored, the end's back to us and the slot's palm.
 * - Hands & eyes: the gloves, and a pair of eyes on the node dragged from for
 *   as long as the drag lasts, and on the candidate's node, that look at the
 *   end and blink now and then, and smile while the hands clasp.
 *
 * With reduced motion or links frozen nothing pops in, waves, marches, bursts
 * or blinks, and the ticker rests. It is drawn over the nodes in its own px: a
 * graph unit zoomed in, so that it grows with the nodes as at zoom 1, and a px on
 * screen zoomed out, so that it stays as large as there. Native connects a link let go on a slot, a node or a reroute as
 * it always does; one let go on nothing connects to the candidate as if let go
 * on it, with Assist.AutoConnect wherever the guide line points or once the
 * hands clasp, and with Assist.SnapKey held anywhere in reach, while the hands
 * draw clasped. Else native's link-release search shows, and assist draws none.
 *
 * @module fx/assist
 */

import { app } from '/scripts/app.js';
import { L } from '@/core/settings';
import { MAX_FLASH_HZ, clock, env, guard, layers, live, wake } from '@/core/engine';
import { dark, darker, translucent } from '@/core/colors';

type Canvas = typeof app.canvas;
type Node = InstanceType<typeof LGraphNode> | NonNullable<Canvas['subgraph']>['inputNode' | 'outputNode'];
type Link = Canvas['linkConnector']['renderLinks'][number];
type Drop = Parameters<Canvas['linkConnector']['dropOnNothing']>[0];

/** The guard's key, which its toast names when it turns assist off. */
const ASSIST = 'Connection assist';

/** How far from the link's end a slot is in reach, and how near the hands clasp, in px as unitOf() has them. */
const RANGE = 200;
const CLASP = 120;
/** How far out of its node's box a slot may lie, in graph units: Nodes 2.0's dots sit on its edge. */
const SLACK = 10;
/** How large a reaching glove is while the end is still RANGE away: it grows as the end nears, to HAND px from wrist to fingertips at CLASP. */
const SMALL = 0.75;
const HAND = 36;
/** How far the slot's glove stretches out on its arm, in px, at CLASP: as far as has the fingertips meet there. */
const ARM = CLASP - 2 * HAND;
/** How far the clasp's cuffs are from its middle, in px, and where in them an arm goes. */
const HALF = 26.7;
const WRISTS = [[-26.9, -3.2], [27, -5.2]];
/** How far past upright the cosine of the clasp's heading goes before it turns round, so a drag about the vertical keeps it still. */
const FLIP = 0.3;
/** How long a glove, the clasp or the ring takes to pop in, in s. */
const POP_S = 0.18;
/** How long the light bursts from the clasp, in s; it starts again no sooner than MAX_FLASH_HZ allows. */
const SHINE_S = 0.8;
/** How far the end's glove turns either way as it sways with nothing in reach, and how often a second. */
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
/** The gloves' and eyes' white and their outline, which read on dark and light palettes alike, in px, and the happy eyes' blush. */
const WHITE = '#fdfdfd';
const INK = '#1d1d24';
const OUTLINE = 1.6;
const BLUSH = 'rgba(255, 110, 150, 0.55)';

/**
 * The glove, in px with the wrist at 0, 0 and the fingers toward +x, together, thumb up, one outline: as is, a right
 * hand's back, with the seams between the fingers and the stitches on its back; mirrored, a right hand's palm, with
 * the seams running on to the crease across it. And the cuff. The clasp, laid out as 🤝 is, about its middle: the
 * hands, the fingers curled under, the creases and the cuffs. Built once.
 */
interface Shapes {
    reach: Path2D;
    knuckles: Path2D;
    creases: Path2D;
    cuff: Path2D;
    clasp: Path2D[];
    clasped: Path2D;
    cuffs: Path2D;
}

let shapes: Shapes | undefined;

/** Adds a finger from x1, y1 to x2, y2, r either side, to `path`, turning as roundRect does, so that what overlaps fills as one. */
function finger(path: Path2D, x1: number, y1: number, x2: number, y2: number, r: number): void {
    const turn = Math.atan2(y2 - y1, x2 - x1);
    path.moveTo(x1 + r * Math.sin(turn), y1 - r * Math.cos(turn));
    path.arc(x2, y2, r, turn - Math.PI / 2, turn + Math.PI / 2);
    path.arc(x1, y1, r, turn + Math.PI / 2, turn + 1.5 * Math.PI);
    path.closePath();
}

function build(): Shapes {
    const reach = new Path2D();
    reach.roundRect(-1, -9, 20, 19, 7);
    const tips = [[-6.3, 31], [-1.7, 34], [2.9, 32], [7.3, 28]];
    for (const [y, tip] of tips) finger(reach, 14, y, tip, y, 2.55);
    finger(reach, 7, -6.5, 19, -11.5, 3);
    // Seen from the back the seams stop at the knuckles; from the palm they run on to the crease across it.
    const knuckles = new Path2D();
    for (const y of [-4, 0.5, 5]) {
        knuckles.moveTo(2.5, 0.9 * y);
        knuckles.lineTo(9, y);
    }
    const creases = new Path2D();
    for (let i = 1; i < tips.length; i++) {
        const y = (tips[i - 1][0] + tips[i][0]) / 2;
        const tip = Math.min(tips[i - 1][1], tips[i][1]) - 2.5;
        knuckles.moveTo(23, y);
        knuckles.lineTo(tip, y);
        creases.moveTo(19, y);
        creases.lineTo(tip, y);
    }
    creases.moveTo(10, -6.4);
    creases.quadraticCurveTo(14, -7.4, 17.5, -9.2);
    const cuff = new Path2D();
    cuff.roundRect(-10, -9.5, 10.5, 19, 4);
    const hands = new Path2D('M-25.6-12.5C-17.2-12-8.1-10.7-0.3-8.8C8.8-10.1 17.9-11.4 24.4-13.3C26.8-7.8 28.1-1.3 26.8 2.9C24.4 6.5 21.8 9.8 19.2 13C15.3 18.9 8.8 24.7 1.3 25C-1.6 25-3.5 24.1-4.8 23.1L-18.5 13.7C-21.1 11.7-23.7 9.1-27.6 6.2C-27.8 0-27.3-6.5-25.6-12.5Z');
    const curled = [[-6, 20.9, -3.9, 22.5, 2.5], [-9.8, 18.1, -7.7, 19.6, 2.7], [-13.9, 15, -11.8, 16.5, 2.9], [-18.3, 11.6, -16.2, 13.1, 2.9]].map(([x1, y1, x2, y2, r]) => {
        const path = new Path2D();
        finger(path, x1, y1, x2, y2, r);
        return path;
    });
    const clasped = new Path2D('M0-6.8C-6.1-5.9-10.9-4.5-11.3-2.3C-11.6-0.5-8.7-0.1-5.2-0.5C2.3-1.3 10.8-0.3 17.7 2.9L19.5 11.4M2.3 15.9L7 20.8M6.9 10.7L14 17.7');
    const cuffs = new Path2D('M-25.6-12.5C-23-12.3-21.1-12.2-19.8-12L-20.8 8.1C-23 7.5-25.6 6.8-27.6 6.2C-27.8 0-27.3-6.5-25.6-12.5ZM19.2-12C21.2-12.5 22.9-12.9 24.4-13.3C26.8-7.8 28.1-1.3 26.8 2.9C25.5 4.2 24.2 5.2 22.9 6.2C22.5 0 20.8-6.5 19.2-12Z');
    return { reach, knuckles, creases, cuff, clasp: [hands, ...curled], clasped, cuffs };
}

/** Fills `path` in `colour` over its outline, which shows outside it only: one outline round shapes that overlap. */
function inked(ctx: CanvasRenderingContext2D, path: Path2D, colour: string): void {
    ctx.lineWidth = 2 * OUTLINE;
    ctx.strokeStyle = INK;
    ctx.stroke(path);
    ctx.fillStyle = colour;
    ctx.fill(path);
}

/** An arm from the slot, at `from` along the x axis, to a cuff at x, y, thinner at the slot. */
function arm(ctx: CanvasRenderingContext2D, from: number, x: number, y: number, colour: string): void {
    const d = Math.hypot(x - from, y);
    const nx = -y / d;
    const ny = (x - from) / d;
    const path = new Path2D();
    path.moveTo(from + 3 * nx, 3 * ny);
    path.lineTo(x + 5.5 * nx, y + 5.5 * ny);
    path.lineTo(x - 5.5 * nx, y - 5.5 * ny);
    path.lineTo(from - 3 * nx, -3 * ny);
    path.closePath();
    inked(ctx, path, colour);
}

/** Sets the context to draw in px about x, y along `turn`, `size` graph units a px, mirrored with `flip`. */
function place(ctx: CanvasRenderingContext2D, x: number, y: number, turn: number, size: number, flip: boolean): void {
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.scale(size, flip ? -size : size);
}

/**
 * A right glove with its wrist at x, y and its fingers toward `turn`, its cuff in `cuff`: the end's, its back to us,
 * or with `palm` the slot's, its palm to us, on an arm `stretch` px long behind it.
 */
function glove(ctx: CanvasRenderingContext2D, s: Shapes, palm: boolean, x: number, y: number, turn: number, size: number, cuff: string, stretch = 0): void {
    ctx.save();
    place(ctx, x, y, turn, size, palm);
    if (stretch > 8) arm(ctx, -stretch, -8, 0, cuff);
    inked(ctx, s.reach, WHITE);
    ctx.lineWidth = 1.2;
    ctx.stroke(palm ? s.creases : s.knuckles);
    inked(ctx, s.cuff, cuff);
    ctx.restore();
}

/**
 * The hands clasped about x, y along `turn`, upright, the end's on the left: mirrored with `flip`, the scene turns
 * round instead. The slot's arm comes from `slot` px along `turn`.
 */
function clasp(ctx: CanvasRenderingContext2D, s: Shapes, x: number, y: number, turn: number, size: number, flip: boolean, cuff: string, slot: number): void {
    ctx.save();
    place(ctx, x, y, flip ? turn + Math.PI : turn, size, false);
    const [wx, wy] = WRISTS[flip ? 0 : 1];
    const from = flip ? -slot : slot;
    if (Math.abs(from) > Math.abs(wx)) arm(ctx, from, wx, wy, cuff);
    for (const part of s.clasp) inked(ctx, part, WHITE);
    ctx.lineWidth = 1.2;
    ctx.stroke(s.clasped);
    inked(ctx, s.cuffs, cuff);
    ctx.restore();
}

/**
 * The light about the clasp at x, y, `unit` graph units a px: `p` of the way through its burst, rays and sparkles
 * flying out of an aura that grows; from 1 on the aura alone, faint. With `lit`, added light in white, for dark
 * palettes; else in `tint`.
 */
function shine(ctx: CanvasRenderingContext2D, x: number, y: number, unit: number, p: number, tint: string, lit: boolean): void {
    const grown = 1 - (1 - p) ** 3;
    const core = lit ? WHITE : tint;
    const glow = 0.3 + 0.5 * (1 - p);
    const r = (30 + 40 * grown) * unit;
    ctx.save();
    if (lit) ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(x, y, 0, x, y, r);
    aura.addColorStop(0, translucent(core, glow));
    aura.addColorStop(0.45, translucent(tint, glow * 0.6));
    aura.addColorStop(1, translucent(tint, 0));
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    if (p < 1) {
        ctx.globalAlpha = 1 - p;
        ctx.fillStyle = core;
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const turn = (i * Math.PI) / 5 + 0.35 * grown;
            const [c, s] = [Math.cos(turn), Math.sin(turn)];
            const from = (18 + 6 * grown) * unit;
            const to = from + (i % 2 ? 22 : 34) * grown * unit;
            const w = 3 * unit;
            ctx.moveTo(x + c * from - s * w, y + s * from + c * w);
            ctx.lineTo(x + c * to, y + s * to);
            ctx.lineTo(x + c * from + s * w, y + s * from - c * w);
            ctx.closePath();
        }
        ctx.fill();
        const k = 4 * Math.sin(Math.PI * Math.min(1, 1.4 * p)) * unit;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const turn = (i * Math.PI) / 3 + 0.5;
            const far = (26 + 44 * grown) * unit;
            const sx = x + far * Math.cos(turn);
            const sy = y + far * Math.sin(turn);
            ctx.moveTo(sx, sy - 1.6 * k);
            ctx.quadraticCurveTo(sx, sy, sx + k, sy);
            ctx.quadraticCurveTo(sx, sy, sx, sy + 1.6 * k);
            ctx.quadraticCurveTo(sx, sy, sx - k, sy);
            ctx.quadraticCurveTo(sx, sy, sx, sy - 1.6 * k);
        }
        ctx.fill();
    }
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
 * title than at zoom 1, open by `open`, their pupils turned to x, y; or, `happy` of the way popped in, smiling shut
 * over blushing cheeks.
 */
function eyes(ctx: CanvasRenderingContext2D, box: ArrayLike<number>, x: number, y: number, unit: number, open: number, happy: number): void {
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
        if (happy) {
            ctx.beginPath();
            ctx.arc(cx, cy + 3 * unit, 4.2 * unit * happy, Math.PI + 0.45, 2 * Math.PI - 0.45);
            ctx.lineWidth = 2.2 * unit;
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx + side * 1.5 * EYE * unit, cy + 1.05 * EYE * unit, 4 * unit * happy, 2.2 * unit * happy, 0, 0, 2 * Math.PI);
            ctx.fillStyle = BLUSH;
            ctx.fill();
            continue;
        }
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

/** Graph units to a px of assist: one zoomed in, so it grows with the nodes, and a px on screen zoomed out. */
const unitOf = (canvas: Canvas) => Math.max(1, 1 / canvas.ds.scale);

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
 * Finds the slot of a node on screen, other than the one `link` comes from, nearest x, y within RANGE px,
 * that the link may connect to: an input of a type LiteGraph takes from its output's, or the other way about. A node
 * whose box is no nearer than the nearest slot so far is passed over.
 */
function seek(canvas: Canvas, link: Link, x: number, y: number): boolean {
    const reach = RANGE * unitOf(canvas);
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

/** Whether `event` holds Assist.SnapKey. */
const snapKey = (event: { ctrlKey: boolean; metaKey: boolean; altKey: boolean }): boolean =>
    L.assistSnapKey === 'ctrl' ? event.ctrlKey || event.metaKey : L.assistSnapKey === 'alt' && event.altKey;

/** Whether the snap key is held, as the keyboard last said. */
let snapping = false;

/**
 * Whether letting go `d` px from the candidate connects to it: with the snap key `held`, anywhere in reach;
 * with Assist.AutoConnect, anywhere the guide line points, and once the hands clasp.
 */
const grips = (d: number, held: boolean): boolean => held || (L.assistAutoConnect && (L.assistMode === 'line' || d <= CLASP));

/**
 * Where native lets the link of `canvas` go on nothing at `event`, the drop on the candidate there, if grips() says it
 * connects: native's own drop on its node, or on the subgraph's input or output node, with the event moved onto its slot,
 * so that native's rules connect the links. Whether it dropped them there.
 */
function drop(canvas: Canvas, event: Drop): boolean {
    const { linkConnector } = canvas;
    const link = linkConnector.renderLinks[0];
    if (!link || !L.enabled || L.assistMode === 'off' || guard.off(ASSIST)) return false;
    const { canvasX: x, canvasY: y } = event;
    if (!seek(canvas, link, x, y) || !grips(Math.sqrt(found.d) / unitOf(canvas), snapKey(event))) return false;
    const node = found.node!;
    const at = event as { canvasX: number; canvasY: number };
    at.canvasX = found.x;
    at.canvasY = found.y;
    try {
        if (node instanceof LGraphNode) linkConnector.dropOnNode(node, event);
        else linkConnector.dropOnIoNode(node, event);
    } finally {
        at.canvasX = x;
        at.canvasY = y;
    }
    return true;
}

/**
 * The link being dragged, as its first render link, and the one dropped on the canvas, which native keeps while the
 * link-release search or menu shows. As a drag starts: when on clock.assistTime, and the colour its link is drawn in.
 * Whether the clasp is turned round, to keep it upright as the drag heads left. The candidate shown, and when it last
 * changed, or the hands clasped or let go, on clock.assistTime.
 */
let dragged: Link | undefined;
let released: Link | undefined;
let began = 0;
let tint = '';
let mirrored = false;
/** When the light last burst from the clasp, on clock.assistTime. */
let shone = -Infinity;
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
    const unit = unitOf(canvas);
    const d = Math.hypot(found.x - x, found.y - y) / unit;
    const clasped = there && (d <= CLASP || snapping);
    const t = clock.assistTime;
    const still = env.reducedMotion || L.staticMode;
    if (clasped && !shown.clasped && !still && L.assistShine && t - shone >= 1 / MAX_FLASH_HZ) shone = t;
    if (found.node !== shown.node || found.slot !== shown.slot || there !== shown.there || clasped !== shown.clasped) {
        shown.node = found.node;
        shown.slot = found.slot;
        shown.there = there;
        shown.clasped = clasped;
        shown.since = t;
    }
    const pop = still ? 1 : smooth(Math.min(1, (t - shown.since) / POP_S));
    const burst = clasped && L.assistShine && !still ? (t - shone) / SHINE_S : 1;
    // What moves: the line's dashes, the open hand's wave, a glove, the clasp or the ring popping in, the light bursting
    // from the clasp, and the eyes' blinks.
    const moving = !still && (L.assistMode === 'line' ? there : !there || pop < 1 || burst < 1 || L.assistMode === 'hands-eyes');
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
            glove(ctx, s, false, x, y, heading + (still ? 0 : WAVE * Math.sin(2 * Math.PI * WAVE_HZ * (t - began))), unit, tint);
        } else if (clasped) {
            // The end's cuff stays at the end, and the slot's arm holds on, until they are too near for the hands between.
            const k = 1.05 - 0.05 * pop;
            const off = Math.min(d / 2, HALF * k);
            const cx = x + Math.cos(turn) * off * unit;
            const cy = y + Math.sin(turn) * off * unit;
            if (L.assistShine) shine(ctx, cx, cy, unit, Math.min(1, burst), tint, dark(canvas.clear_background_color));
            clasp(ctx, s, cx, cy, turn, unit * k, mirrored, tint, (d - off) / k);
        } else {
            const near = smooth(Math.min(1, Math.max(0, (RANGE - d) / (RANGE - CLASP))));
            const size = unit * (SMALL + (1 - SMALL) * near);
            glove(ctx, s, false, x, y, turn, size, tint);
            // The slot's glove reaches out on its arm as the end nears, to meet it at CLASP.
            const stretch = ARM * near * pop;
            const grown = size * (SMALL + (1 - SMALL) * pop);
            ctx.globalAlpha = pop;
            glove(ctx, s, true, found.x - Math.cos(turn) * stretch * unit, found.y - Math.sin(turn) * stretch * unit, turn + Math.PI, grown, tint, (stretch * unit) / grown);
            ctx.globalAlpha = 1;
        }
        if (L.assistMode === 'hands-eyes') {
            const open = still || clasped ? 1 : lid(t - began);
            const happy = clasped ? pop : 0;
            eyes(ctx, link.node.boundingRect, x, y, unit, open, happy);
            if (found.node) eyes(ctx, found.node.boundingRect, x, y, unit, open, happy);
        }
    } finally {
        ctx.restore();
    }
}

/**
 * Puts connection assist over the nodes of app.canvas, connects a link let go on nothing to its candidate where drop()
 * says so, and hears when one dragged there is dropped on the canvas or the drag ends, which native need not paint for:
 * then what assist drew goes with one paint. The hands clasp while the snap key is held.
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
    // Classic mode lets a link go on nothing here from dropLinks, Nodes 2.0 from its adapter's dropOnCanvas. Native's
    // drop on a subgraph's input or output node comes back here where it finds no slot, which goes on to native.
    const { dropOnNothing } = linkConnector;
    let dropping = false;
    linkConnector.dropOnNothing = function (event) {
        let dropped = false;
        if (!dropping) {
            dropping = true;
            try {
                dropped = drop(app.canvas, event);
            } catch (error) {
                guard.fail(ASSIST, error);
            } finally {
                dropping = false;
            }
        }
        if (!dropped) dropOnNothing.call(this, event);
    };
    const track = (event: KeyboardEvent) => {
        const held = snapKey(event);
        if (held === snapping) return;
        snapping = held;
        if (dragged) app.canvas.setDirty(true);
    };
    window.addEventListener('keydown', track, { capture: true, passive: true });
    window.addEventListener('keyup', track, { capture: true, passive: true });
    window.addEventListener('blur', () => {
        snapping = false;
    });
}
