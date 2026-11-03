/**
 * Link effects on ComfyUI's own link pass. drawConnections keeps its native
 * traversal, and every renderLink call still runs natively: the ones we draw
 * ourselves run on a 1×1 canvas nobody sees, so hit testing, reroutes, the
 * link menu and other extensions' wrappers get exactly the native calls. Each
 * such call records its segment along the path its Link.Style gives it, and
 * draws what does not move where native would have drawn the link: the
 * animation's base with its glow and shadow, or the whole still frame
 * (Static.Mode, a run that holds them, reduced motion, more animated links on
 * screen than Perf.StaticAbove, or a look with nothing that moves). Where many
 * glow, the bases go on a layer of their own, kept while nothing changes and
 * moved along as the view pans, so only what comes into view is drawn again;
 * where the layer cannot move along, as the view zooms or nodes are dragged,
 * they are drawn again in place, or with Perf.KeepGlow off go without their
 * glow until it all keeps still. What moves is drawn over the background in
 * every front pass, under the nodes, adding up where it crosses with Blend's
 * additive glow on a dark palette. A shape of our own takes the segment's hit data with it, so
 * clicks and the link menu follow what is drawn. With Physics.Profile on, each
 * segment hangs as a wire (links/physics.ts) whatever its Link.Style's shape,
 * and everything is drawn along the wire: with Animation None, the body native
 * would draw, as for floating links and the links focus dims or hides. When
 * another extension draws links too, Coexist can leave every link to it; Link
 * effects off leaves every link to native.
 *
 * Selection focus (links/focus.ts) works on the same calls, with link effects
 * on or off: the links it leaves out are drawn natively, dimmed or not at all,
 * and the ones it holds take the focus colour and, with Focus.OnTop, are drawn
 * again over the nodes. Where it has nothing to do, a call native draws goes
 * straight through. The links this client's run flows along (fx/execution.ts)
 * are drawn whole while its visuals show, whatever focus does to the rest, and
 * with link effects on the river and the trail go over them: over their motion,
 * or along native's path where native draws them, as with Animation None.
 *
 * @module links/pipeline
 */

import type { CanvasColour, LLink, Point, Reroute } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L, revision, wired } from '@/core/settings';
import { CALM_ALPHA, HELD, PLAIN, STILL_PHASE, THIN, adaptive, clock, dummy, during, env, guard, heldByRun, layers, live, offscreen, steps, wake, zoomedOut } from '@/core/engine';
import { HIGHLIGHT, dark, palette, type Palette } from '@/core/colors';
import { drawFlows, flowsShown, linkPass, stepInto, syncRuns, type Step } from '@/fx/execution';
import { startSprites, stopSprites } from '@/fx/particles';
import { MOVING, STROKES, moving } from './animations';
import { focus, focusPalette, focuses, focusing, syncFocus } from './focus';
import { LinkPath, stub } from './geometry';
import { endWires, hang, startWires, stepWires, wireOf, type Wire } from './physics';
import { STILL } from './stills';
import { LINK_STYLES, centreMarker, drawBase, drawMarkers } from './styles';

type Canvas = InstanceType<typeof LGraphCanvas>;
type RenderLink = Parameters<Canvas['renderLink']>;

/** The guard's key, and what its toast calls the links when it turns them off. */
const LINKS = 'Link animation';

/** How far past its path an effect draws at most: Crystal Stream's crystals at the thickest setting, with their glow. */
const REACH = 120;

/** Classic Flow, whose only motion is its markers. */
const CLASSIC = 9;
/** The Link.Style that keeps native's path. */
const NATIVE = 'spline';

/**
 * A segment native drew for a link, as the effects take it. Native draws a link's segments one after another, from
 * its output through each reroute to its input (FE157 LGraphCanvas.ts L6355-6444, FE1395 L5903-5990), and a stretch
 * that several links share through the same reroutes once, for the first of them; so a segment knows where along its
 * link it starts and how long the link is, and the link's motion can run on across its reroutes.
 */
export class Segment {
    path = new LinkPath();
    /** The link native drew the segment for. */
    link?: LLink;
    /** Whether its path is not the one native drew for it, so the hit data must follow ours. */
    custom = false;
    /** The colours it is drawn in, and the colour native draws its link in, but for the white of a highlighted one. */
    pal: Palette = HIGHLIGHT;
    colour = '';
    linkStyle = '';
    isStatic = false;
    /** Whether selection focus holds it, and how much wider than Thickness its base is drawn. */
    focused = false;
    width = 1;
    /** The run's step of the node its link leads into, while the run's visuals show. */
    flow?: Step;
    /** Whether the pass before did not record it: it came on screen since, as native skips the links off it; and the pass that recorded it last. */
    fresh = false;
    pass = 0;
    /**
     * px along the link to the segment's start, the segment's own length and the link's whole length, along the
     * segments native drew for it: the paths Link.Style takes, before a wave or a coil winds around them.
     */
    u0 = 0;
    len = 0;
    chain = 0;
    /** The fractions of the link where the segment starts and ends. */
    t0 = 0;
    t1 = 1;

    /** Whether the segment is a point on a longer link, where two reroutes, or a reroute and a slot, are on one spot: nothing of the link is on it. */
    get empty(): boolean {
        return this.t0 === this.t1;
    }

    get start(): LinkPath['a'] {
        return this.path.a;
    }

    get end(): LinkPath['b'] {
        return this.path.b;
    }

    /** The segment's own parameter, which its path takes for a point, at fraction T of the whole link: in [0, 1] where T falls on this segment. */
    local(T: number): number {
        return (T - this.t0) / (this.t1 - this.t0);
    }

    /** Whether the segment draws what is at its own parameter u: what its start holds, up to its end, which only the link's last segment draws. */
    within(u: number): boolean {
        return u >= 0 && (u < 1 || (u === 1 && this.t1 === 1));
    }

    /**
     * Lays the segment from a to b on the path `linkStyle` gives it, Link.Style's unless given, the render mode's `mode`
     * where that keeps native's: `u0` px along its link, from a slot if `fromSlot` and to one if `toSlot`, where a wave
     * or a coil starts and ends. A `wire` hangs from native's path instead, whatever the shape, and the path follows it.
     */
    lay(a: Readonly<ArrayLike<number>>, b: Readonly<ArrayLike<number>>, startDir: number, endDir: number, mode: number, u0 = 0, fromSlot = true,
        toSlot = true, startControl?: Readonly<ArrayLike<number>>, endControl?: Readonly<ArrayLike<number>>, linkStyle = L.linkStyle, wire?: Wire): void {
        const style = LINK_STYLES[wire ? NATIVE : linkStyle];
        this.u0 = u0;
        this.path.set(a, b, startDir, endDir, style.mode ?? mode, startControl, endControl);
        if (wire) hang(wire, this.path);
        if (style.shape === 'step') this.path.step(endDir);
        this.len = this.path.length;
        if (style.shape === 'wave' || style.shape === 'coil') this.path.bend(style.shape === 'coil', u0, fromSlot, toSlot);
        this.custom = Boolean(wire || style.shape) || (style.mode ?? mode) !== mode;
        this.linkStyle = linkStyle;
    }
}

/** Each segment as last recorded, by the reroute it leads into, else its link. */
const segments = new WeakMap<LLink | Reroute, Segment>();
/** The segments of the last pass are pool[0, count), and those of the pass before it before[0, counted). */
let pool: Segment[] = [];
let before: Segment[] = [];
let count = 0;
let counted = 0;
/** Where the current link's segments start in the pool, and whether its last segment is still to come. */
let first = 0;
let open = false;
/** Where along its link each reroute's segment ended in this pass. */
const ends = new Map<Reroute, number>();
/** How many passes there were. */
let passes = 0;
/** The ones a layer of the last front pass drew. */
const shown: Segment[] = [];
/** The calls of the focused links native drew in the last pass, to draw again over the nodes. */
const raised: RenderLink[] = [];
/** The segments of the last pass that the run's visuals draw on. */
const flowing: Segment[] = [];

/**
 * The link pass: its context while drawConnections runs, whether we draw its links, whether they are still, whether
 * they hang as physics wires, whether their bases go without their glows and halos, whether they go on the glow layer,
 * whether it keeps the layer as it is and whether a segment changed since the pass before, how many renderLink calls it
 * saw, how many bases it drew, the highlighted links (the selected nodes' links), what selection focus does in it
 * (focusIn()), whether the focused links take the focus colour, and whether the run's visuals show on its links.
 */
const pass = {
    ctx: undefined as CanvasRenderingContext2D | undefined, on: false, still: false, wires: false, plain: false, layered: false, kept: false, changed: false,
    calls: 0, bases: 0, highlighted: {} as Record<string, boolean>, focus: '' as '' | 'highlight' | 'animate' | 'dim' | 'hide', tinted: false, runs: false,
};

/** Whether the last pass had more animated segments on screen than Perf.StaticAbove, which holds the links still. */
let crowded = false;

/** Native's renderLink, or what another extension put in its place before ours. */
let original: (this: Canvas, ...args: RenderLink) => void;

/**
 * A pass with glows that drew more bases than this is too slow to repeat while the view or the graph moves: Chromium
 * spends about 0.8 ms of each frame on a base's glow and halo, with or without a GPU, and does it outside JavaScript.
 */
const BUSY = 12;
/** How long after the last pass drawn plain or panned, in ms, one drawn whole comes back. */
const SETTLE_MS = 150;

/**
 * The passes with glows: how many bases the last one drawn whole drew, and whether the next one must be drawn whole;
 * where the view was at the last pass; and the timer that asks for one once the view and the graph keep still.
 */
const glows = { bases: 0, due: false, scale: 0, x: 0, y: 0, timer: 0 };

function settle(): void {
    glows.due = true;
    app.canvas.setDirty(true, true);
}

/**
 * The glow layer, where a pass with glows that drew more than BUSY bases draws its bases, unless the links are still: a
 * canvas the size of the background, copied onto it once native has drawn the links. A pass drawn whole draws it in the
 * background's transform `at`, at offset (x0, y0). A pass where the view only panned since moves it along, by whole
 * pixels, and draws only the strips that came into view, in the transform `at` moved to (e, f) for offset (x, y), so the
 * glows stay; one where nothing moved keeps it as it is. Either draws it whole again where a segment changed, and again
 * where one native left out lay. What the links looked like as it was drawn whole, which those passes must find
 * unchanged: the graph and its version, the settings, the highlighted links and the palette's background; and the pass
 * that drew it last, which must be the pass before theirs.
 */
const layer = {
    ctx: undefined as CanvasRenderingContext2D | undefined, at: undefined as DOMMatrix | undefined, scale: 0, x0: 0, y0: 0, e: 0, f: 0, x: 0, y: 0,
    graph: undefined as unknown, version: 0, revision: 0, highlighted: undefined as unknown, background: '', pass: 0,
};
/** The strips of the layer's pixels the pan of this pass brought into view, from (x0, y0) to (x1, y1), and how many; none while it is drawn whole. */
const strips = [new Float64Array(4), new Float64Array(4)];
let stripCount = 0;

/**
 * Readies the layer to be drawn whole in the background's transform. It is kept in memory rather than on the GPU, where
 * Chromium keeps LiteGraph's background canvas too, even with a GPU: copying a GPU canvas onto it reads its pixels back.
 */
function paintWhole(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    const { width, height } = ctx.canvas;
    if (!layer.ctx || layer.ctx.canvas.width !== width || layer.ctx.canvas.height !== height) {
        layer.ctx = offscreen(width, height).getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    }
    const { ds, graph } = canvas;
    const at = ctx.getTransform();
    const own = layer.ctx;
    own.setTransform(1, 0, 0, 1, 0, 0);
    own.clearRect(0, 0, width, height);
    own.setTransform(at);
    own.globalAlpha = canvas.editor_alpha;
    Object.assign(layer, {
        at, scale: ds.scale, x0: ds.offset[0], y0: ds.offset[1], e: at.e, f: at.f, x: ds.offset[0], y: ds.offset[1],
        graph, version: graph?._version, revision, highlighted: canvas.highlighted_links, background: canvas.clear_background_color,
    });
}

/**
 * Whether the layer shows the links as they look now, but for where the view is: drawn by the pass before, as big as the
 * background, at its zoom, for the graph as it is, the settings, the highlighted links and the palette; nor are nodes
 * dragged, nor wires swinging, nor did selection focus change.
 */
function shows(canvas: Canvas, ctx: CanvasRenderingContext2D, refocused: boolean): boolean {
    const own = layer.ctx;
    return own !== undefined && layer.pass === passes - 1 && own.canvas.width === ctx.canvas.width && own.canvas.height === ctx.canvas.height
        && canvas.ds.scale === layer.scale
        && !canvas.isDragging && !live.wires && !refocused && layer.graph === canvas.graph && layer.version === canvas.graph?._version && layer.revision === revision
        && layer.highlighted === canvas.highlighted_links && layer.background === canvas.clear_background_color;
}

/**
 * Moves the layer along with the view, which only panned since the last pass, and readies it to draw the strips that
 * came into view. False where it cannot: the links look otherwise than as it was drawn (shows()), or the view moved by
 * part of a pixel or by the screen's width or height.
 */
function pan(canvas: Canvas, ctx: CanvasRenderingContext2D, refocused: boolean): boolean {
    if (!shows(canvas, ctx, refocused)) return false;
    const own = layer.ctx!;
    const at = layer.at!;
    const { width, height } = ctx.canvas;
    const { offset } = canvas.ds;
    const dx = at.a * (offset[0] - layer.x);
    const dy = at.d * (offset[1] - layer.y);
    const x = Math.round(dx);
    const y = Math.round(dy);
    if (Math.abs(dx - x) > 0.01 || Math.abs(dy - y) > 0.01 || Math.abs(x) >= width || Math.abs(y) >= height) return false;
    // A hundredth of a pixel or less: the layer does as it is.
    if (!x && !y) return (pass.kept = true);
    own.setTransform(1, 0, 0, 1, 0, 0);
    own.globalCompositeOperation = 'copy';
    own.drawImage(own.canvas, x, y);
    own.globalCompositeOperation = 'source-over';
    // The columns that came in, then the rows that came in beside them.
    stripCount = 0;
    if (x) strip(x > 0 ? 0 : width + x, 0, x > 0 ? x : width, height);
    if (y) strip(x > 0 ? x : 0, y > 0 ? 0 : height + y, x < 0 ? width + x : width, y > 0 ? y : height);
    layer.x = offset[0];
    layer.y = offset[1];
    layer.e = at.e + at.a * (offset[0] - layer.x0);
    layer.f = at.f + at.d * (offset[1] - layer.y0);
    own.setTransform(at.a, 0, 0, at.d, layer.e, layer.f);
    return true;
}

function strip(x0: number, y0: number, x1: number, y1: number): void {
    const s = strips[stripCount++];
    s[0] = x0;
    s[1] = y0;
    s[2] = x1;
    s[3] = y1;
}

/** Whether a segment's base reaches a strip of the layer. */
function reaches(s: Segment, within: Float64Array): boolean {
    const { box } = s.path;
    const { a, d } = layer.at!;
    const { e, f } = layer;
    return box[2] + REACH >= (within[0] - e) / a && box[0] - REACH <= (within[2] - e) / a && box[3] + REACH >= (within[1] - f) / d && box[1] - REACH <= (within[3] - f) / d;
}

/** Clips ctx, the layer's, to a strip of its pixels. */
function clipTo(ctx: CanvasRenderingContext2D, within: Float64Array): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.rect(within[0], within[1], within[2] - within[0], within[3] - within[1]);
    ctx.clip();
    ctx.setTransform(layer.at!.a, 0, 0, layer.at!.d, layer.e, layer.f);
}

/** Draws the layer whole again, at the end of a pass that kept or panned it and found a segment changed: the bases of what it recorded. */
function repaint(canvas: Canvas): void {
    const own = layer.ctx!;
    own.setTransform(1, 0, 0, 1, 0, 0);
    own.clearRect(0, 0, own.canvas.width, own.canvas.height);
    own.setTransform(layer.at!.a, 0, 0, layer.at!.d, layer.e, layer.f);
    pass.kept = false;
    for (let i = 0; i < count; i++) if (!LINK_STYLES[pool[i].linkStyle].moving) draw(canvas, own, pool[i], false);
}

/** The pixels of the layer that mend() draws again. */
const mended = new Float64Array(4);

/**
 * Draws the layer again, at the end of a pass that kept or panned it, where the base of a segment native left out of
 * the pass can be: native leaves out a link whose ends are off screen even where its curve is still on it.
 */
function mend(canvas: Canvas, gone: Segment): void {
    const own = layer.ctx!;
    const { a, d } = layer.at!;
    const { box } = gone.path;
    mended[0] = Math.max(0, Math.floor((box[0] - REACH) * a + layer.e));
    mended[1] = Math.max(0, Math.floor((box[1] - REACH) * d + layer.f));
    mended[2] = Math.min(own.canvas.width, Math.ceil((box[2] + REACH) * a + layer.e));
    mended[3] = Math.min(own.canvas.height, Math.ceil((box[3] + REACH) * d + layer.f));
    if (mended[0] >= mended[2] || mended[1] >= mended[3]) return;
    own.setTransform(1, 0, 0, 1, 0, 0);
    own.clearRect(mended[0], mended[1], mended[2] - mended[0], mended[3] - mended[1]);
    for (let i = 0; i < count; i++) if (reaches(pool[i], mended)) draw(canvas, own, pool[i], false, mended);
}

/** What a segment a pass that keeps or pans the layer records again was in the pass before: its box, length, start along its link and width. */
const held = new Float64Array(7);

function hold(s: Segment): void {
    held.set(s.path.box);
    held[4] = s.path.length;
    held[5] = s.u0;
    held[6] = s.width;
}

const holds = (s: Segment) => {
    const { box, length } = s.path;
    return held[0] === box[0] && held[1] === box[1] && held[2] === box[2] && held[3] === box[3] && held[4] === length && held[5] === s.u0 && held[6] === s.width;
};

/** Copies the layer onto the background, then draws the reroutes on screen over it again, as native drew them over the links. */
function blit(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowColor = 'transparent';
    ctx.drawImage(layer.ctx!.canvas, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = canvas.editor_alpha;
    drawReroutes(canvas, ctx, false);
    ctx.restore();
}

/** Whether this page warned that another extension draws links without calling renderLink. */
let warned = false;

/** Whether another extension drew links when the link setup() ran, which Coexist 'auto' leaves them to, and whether this page said so. */
let foreign = false;
let told = false;

/** Whether Coexist leaves the links to native and other extensions. */
export const deferring = (): boolean => L.coexist === 'defer' || (L.coexist === 'auto' && foreign);

/** With link effects on, the run's visuals go over the links, those native draws too, as with Animation None. */
const drawsRuns = (canvas: Canvas): boolean => L.enabled && !defers() && !zoomedOut(canvas);

/** deferring(), and the first time 'auto' defers, a toast that says so. */
function defers(): boolean {
    if (!deferring()) return false;
    if (L.coexist === 'auto' && !told) {
        told = true;
        app.extensionManager.toast.add({
            severity: 'info',
            summary: 'Link effects left to another extension',
            detail: 'Another extension draws links, so Enhanced link effects step aside. Node effects keep working. To keep Enhanced link effects, change Other link extensions in the settings.',
            life: 10_000,
        });
    }
    return true;
}

/** LiteGraph.LINK_COLOR (FE157 LiteGraphGlobal.ts L117), for a canvas whose default link colour the canvas would not take. */
const LINK_COLOR = '#9A9';

/** How far the stubs of a link Hide others leaves out show past their nodes. */
const STUB = 8;
/** Native's default slot directions (litegraphLinkAdapter.ts L218-219). */
const [LEFT, RIGHT] = [3, 4];

/** The hit path of a link Hide others leaves out, which nothing is in. */
let unhit: Path2D | undefined;
/** The reroutes of the links Hide others leaves out in this pass, and what they draw until it ends. */
const unseen: Reroute[] = [];
const nothing = (): void => {};

/** RenderUtils.enableAntiAliasing (old_link_animations.js:1604-1610), which v1 set before drawing links. */
function enableAntiAliasing(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;
}

/** Whether the look has anything that moves: None nothing, Classic Flow only its markers, and dotted and dashed links march. */
function moves(): boolean {
    return L.animate !== 0 && (L.animate !== CLASSIC || (L.markerEnabled && L.markerShape !== 'none') || Boolean(LINK_STYLES[L.linkStyle].moving));
}

/**
 * What selection focus does in a pass: nothing without a focus, but that Animate only these animates nothing then; while
 * native draws the links, Animate only these highlights them; and while Coexist leaves them to another extension, only
 * what keeps its drawing, dimming and hiding.
 */
function focusIn(): typeof pass.focus {
    const mode = (L.focusEnabled ? L.focusMode : '') as typeof pass.focus;
    if (!focusing()) return pass.on && mode === 'animate' ? mode : '';
    if (deferring()) return mode === 'dim' || mode === 'hide' ? mode : '';
    return !pass.on && mode === 'animate' ? 'highlight' : mode;
}

function begin(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    passes++;
    const last = before;
    before = pool;
    pool = last;
    counted = count;
    count = 0;
    open = false;
    ends.clear();
    raised.length = flowing.length = 0;
    pass.ctx = ctx;
    pass.calls = pass.bases = 0;
    pass.on = L.enabled && (L.animate !== 0 || wired()) && !defers() && !guard.off(LINKS) && !zoomedOut(canvas);
    // Native's links never move. Wires swing through a run, which only holds what the user did not move.
    const held = L.staticMode || env.reducedMotion || crowded || adaptive.level >= HELD;
    pass.still = !pass.on || held || heldByRun(L.pauseDuringRender) || !moves();
    pass.wires = pass.on && wired();
    startWires(canvas.graph, held);
    pass.highlighted = canvas.highlighted_links;
    syncRuns(canvas);
    pass.runs = flowsShown() && drawsRuns(canvas);
    const refocused = syncFocus(canvas);
    pass.focus = focusIn();
    pass.tinted = (pass.focus === 'highlight' || pass.focus === 'dim' || pass.focus === 'hide') && !deferring();
    // A graph with many glowing links on screen draws them on the glow layer, which a pan moves along. While it is
    // zoomed, has nodes dragged or wires swinging, or otherwise cannot pan the layer, the bases are drawn in place, and
    // with Perf.KeepGlow off go plain, as they do while Perf.Adaptive draws glows plain. A pass drawn on the layer
    // follows once the view and the graph keep still.
    const { scale, offset } = canvas.ds;
    const moving = scale !== glows.scale || offset[0] !== glows.x || offset[1] !== glows.y || canvas.isDragging || live.wires > 0;
    glows.scale = scale;
    glows.x = offset[0];
    glows.y = offset[1];
    pass.plain = pass.on && adaptive.level >= PLAIN;
    const glowing = L.glowIntensity > 0 || (L.animate === CLASSIC && L.linkShadowEnabled);
    const busy = pass.on && glowing && glows.bases > BUSY;
    // Still links are drawn once, as they were, in place.
    if (!busy || pass.plain || pass.still) layer.ctx = undefined;
    // Not over the nodes (links_ontop), nor where another extension draws the links again, as MagnifyGlass does.
    const layered = busy && !pass.plain && !pass.still && ctx === canvas.bgctx;
    stripCount = 0;
    pass.kept = pass.changed = false;
    if (busy && moving && !glows.due) {
        pass.layered = layered && pan(canvas, ctx, refocused);
        pass.plain ||= !pass.layered && !L.perfKeepGlow;
        clearTimeout(glows.timer);
        glows.timer = window.setTimeout(settle, SETTLE_MS);
    } else {
        pass.layered = layered;
        // Where nothing moved, the layer may do as it is: end() finds whether a segment changed.
        pass.kept = layered && !moving && !glows.due && layer.x === offset[0] && layer.y === offset[1] && shows(canvas, ctx, refocused);
        if (layered && !pass.kept) paintWhole(canvas, ctx);
    }
    glows.due = false;
}

function end(canvas: Canvas): void {
    const ctx = pass.ctx!;
    pass.ctx = undefined;
    if (open) close();
    endWires();
    if (pass.changed) repaint(canvas);
    else if (pass.kept || stripCount) for (let i = 0; i < counted; i++) if (before[i].pass !== passes) mend(canvas, before[i]);
    if (!pass.plain && !stripCount && !pass.kept) glows.bases = pass.bases;
    // Moving segments show only once the motion layer draws them, and it counts those on screen. Until then they count,
    // so the ticker runs and chains its hook again if another extension replaced it.
    if (count && !pass.still) {
        live.links = count;
        wake();
    }
    if (flowing.length) {
        live.flows = flowing.length;
        wake();
    }
    // The reroutes Hide others left out drew nothing; nor can they be clicked, out of those native drew, where it looks
    // for what the pointer is on.
    for (const reroute of unseen) {
        delete (reroute as Partial<Reroute>).draw;
        delete (reroute as Partial<Reroute>).drawSlots;
        canvas._visibleReroutes.delete(reroute);
    }
    unseen.length = 0;
    if (pass.layered) {
        layer.pass = passes;
        blit(canvas, ctx);
    }
    // More animated segments on screen than Perf.StaticAbove hold the links still, as Static would, from the next pass.
    const crowd = L.perfStaticAbove > 0 && cull(canvas, all) > L.perfStaticAbove;
    if (crowd !== crowded) {
        crowded = crowd;
        canvas.setDirty(true, true);
    }
    if (pass.calls || warned) return;
    // Native calls renderLink for every link and reroute it lists here, unless that end is being dragged.
    for (const segment of canvas.renderedPaths) {
        if ((segment as { _dragging?: boolean })._dragging) continue;
        warned = true;
        console.warn('[Enhanced Links & Nodes] Another extension draws links without calling renderLink, so links are not animated.');
        return;
    }
}

/** Gives the current link's segments, pool[first, count), the link's length and their share of it. */
function close(): void {
    const last = pool[count - 1];
    const chain = last.u0 + last.len;
    for (let i = first; i < count; i++) {
        const s = pool[i];
        s.chain = chain;
        // A segment that is its whole link takes the link's fractions as they are, as v1's links took theirs.
        s.t0 = s.len === chain ? 0 : s.u0 / chain;
        s.t1 = s.len === chain ? 1 : (s.u0 + s.len) / chain;
    }
    open = false;
}

/**
 * The palette of the colour native draws a segment in, but for the white of a highlighted one: pathRenderer.ts
 * determineLinkColor (L168-183) with what litegraphLinkAdapter.ts hands it (L226-235), which leaves out link.color: the
 * colour handed in, the type's or the canvas default, the first the canvas takes.
 */
const own = (canvas: Canvas, link: LLink, color: CanvasColour | null): Palette =>
    palette(color) ?? palette(LGraphCanvas.link_type_colors[String(link.type)]) ?? palette(canvas.default_link_color) ?? palette(LINK_COLOR)!;

/**
 * The key of a segment's wire: the reroute it leads into, else its link, a floating one apart, as 1.39.5 numbers
 * floating links on their own (LGraph.ts L1307).
 */
const keyOf = (link: LLink, extras: RenderLink[9]): number => (extras?.reroute ? 3 * extras.reroute.id + 1 : 3 * link.id + (extras?.disabled ? 2 : 0));

/**
 * Records the segment of a renderLink call from the arguments native gets, along native's path where native draws it;
 * `focused` if selection focus holds it, with the run's `flow` into its node.
 */
function record(canvas: Canvas, link: LLink, a: Readonly<Point>, b: Readonly<Point>, color: CanvasColour | null,
    startDir: number, endDir: number, extras: RenderLink[9], focused: boolean, flow: Step | undefined): Segment {
    if (open && pool[count - 1].link !== link) close();
    if (!open) first = count;
    const reroute = extras?.reroute;
    let segment = segments.get(reroute ?? link);
    if (!segment) segments.set(reroute ?? link, (segment = new Segment()));
    pool[count++] = segment;
    segment.fresh = segment.pass !== passes - 1;
    segment.pass = passes;
    // What the segment was in the pass before, which a pass that keeps or pans the layer compares it with.
    const compared = pass.kept || stripCount > 0;
    const heldPal = segment.pal;
    const heldStyle = segment.linkStyle;
    if (compared) hold(segment);
    // The reroute the segment starts from (LinkSegment.parentId), where the segment into it ended; none where the link starts.
    const from = canvas.graph?.getReroute((reroute ?? link).parentId);
    segment.link = link;
    segment.lay(a, b, startDir, endDir, canvas.links_render_mode, (from && ends.get(from)) || 0, !from, !reroute, extras?.startControl, extras?.endControl,
        pass.on ? L.linkStyle : NATIVE, pass.wires ? wireOf(keyOf(link, extras)) : undefined);
    if (reroute) ends.set(reroute, segment.u0 + segment.len);
    // The segment into the input is the link's last.
    open = Boolean(reroute);
    if (!open) close();
    // A focused link takes the focus colour, a selected node's too, and Highlight widens it; else white while
    // highlighted, as native draws it.
    const colours = own(canvas, link, color);
    segment.pal = focused && pass.tinted ? focusPalette(colours.native) : pass.highlighted[link.id] ? HIGHLIGHT : colours;
    segment.colour = colours.native;
    segment.focused = focused;
    segment.width = focused && pass.focus === 'highlight' ? 1.5 : 1;
    segment.isStatic = pass.still;
    segment.flow = flow;
    if (flow) flowing.push(segment);
    // One come on screen since is not on the layer a pass keeps, and one a pan brings in is drawn whole on it.
    if (compared) pass.changed ||= segment.fresh ? pass.kept : heldPal !== segment.pal || heldStyle !== segment.linkStyle || !holds(segment);
    return segment;
}

/** Whether the look draws flow markers: Classic Flow's, or every animation's with Marker.All, of which None is none. */
const marked = () => L.animate === CLASSIC || (L.markerAll && L.animate !== 0);

/**
 * Draws what does not move where native would have drawn the segment, or on the glow layer: the animation's base, unless
 * it marches. While still, the link's last segment also draws the still animation and markers of all its segments, which
 * are counted along the whole link, and then their centre markers. A pass that panned the layer draws a base that was on
 * screen before in the strips that came into view alone, and one that keeps it draws nothing. False if it failed.
 */
function place(canvas: Canvas, ctx: CanvasRenderingContext2D, segment: Segment): boolean {
    if (!pass.still && LINK_STYLES[segment.linkStyle].moving) return true;
    const whole = pass.still && !open;
    if (!pass.layered) return draw(canvas, ctx, segment, whole);
    if (pass.kept) return true;
    if (!stripCount || segment.fresh) return draw(canvas, layer.ctx!, segment, false);
    for (let i = 0; i < stripCount; i++) if (reaches(segment, strips[i]) && !draw(canvas, layer.ctx!, segment, false, strips[i])) return false;
    return true;
}

/** Draws what place() draws on ctx, in `within`, a strip of the glow layer, alone if given. False if it failed. */
function draw(canvas: Canvas, ctx: CanvasRenderingContext2D, segment: Segment, whole: boolean, within?: Float64Array): boolean {
    ctx.save();
    try {
        if (within) clipTo(ctx, within);
        enableAntiAliasing(ctx);
        if (body(canvas, ctx, segment, pass.still, pass.plain)) pass.bases++;
        for (let i = first; whole && i < count; i++) {
            if (pool[i].empty) continue;
            STILL[L.animate]?.(ctx, pool[i], STILL_PHASE);
            if (marked()) drawMarkers(ctx, pool[i], STILL_PHASE);
        }
    } catch (error) {
        guard.fail(LINKS, error);
        return false;
    } finally {
        ctx.restore();
    }
    // In the state native left, as it draws its own marker; moving segments get theirs over the motion.
    if (whole) {
        ctx.save();
        for (let i = first; i < count; i++) centreMarker(canvas, ctx, pool[i]);
        ctx.restore();
    }
    return true;
}

/** Native's border under a link (pathRenderer.ts drawLink, L118-128). */
const BORDER = 'rgba(0,0,0,0.5)';

/**
 * Draws a segment's body as native's renderLink draws a link (pathRenderer.ts drawLink, L93-162): a border 4 px wider
 * unless the canvas draws none or draws in low quality, then the link in its colour, as wide as the canvas draws links
 * and Highlight widens them, at the alpha the context has.
 */
function nativeBody(canvas: Canvas, ctx: CanvasRenderingContext2D, s: Segment): void {
    const width = canvas.connections_width * s.width;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.beginPath();
    s.path.trace(ctx);
    if (canvas.render_connections_border && !canvas.low_quality) {
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = width + 4;
        ctx.stroke();
    }
    ctx.strokeStyle = s.pal.native;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.restore();
}

/** Draws a segment's base, or with Animation None the body native would draw. Whether it drew a base. */
function body(canvas: Canvas, ctx: CanvasRenderingContext2D, s: Segment, still: boolean, plain: boolean): boolean {
    if (L.animate) return drawBase(ctx, s, L.animate, still, plain);
    nativeBody(canvas, ctx, s);
    return false;
}

/**
 * The segment of a call kept out of the pass's segments, laid along its wire in native's colours: a floating link's, or
 * one focus dims or hides.
 */
function hung(canvas: Canvas, [, a, b, link, , , color, startDir, endDir, extras]: RenderLink): Segment {
    const owner = extras?.reroute ?? link!;
    let segment = segments.get(owner);
    if (!segment) segments.set(owner, (segment = new Segment()));
    segment.lay(a, b, startDir, endDir, canvas.links_render_mode, 0, true, true, extras?.startControl, extras?.endControl, NATIVE, wireOf(keyOf(link!, extras)));
    segment.pal = pass.highlighted[link!.id] ? HIGHLIGHT : own(canvas, link!, color);
    segment.width = 1;
    return segment;
}

/**
 * Draws a call native would draw, as native does but along its wire, with its centre marker, in the disabled pattern
 * at 0.75 for a floating link (pathRenderer.ts L825-835); native's call goes where nobody sees it.
 */
function alongWire(canvas: Canvas, args: RenderLink): void {
    const [ctx, , , link, , , , , , extras] = args;
    const segment = hung(canvas, args);
    nativeBody(canvas, ctx, segment);
    ctx.save();
    if (extras?.disabled && canvas._pattern) {
        ctx.globalAlpha = 0.75;
        centreMarker(canvas, ctx, segment, canvas._pattern);
    } else centreMarker(canvas, ctx, segment);
    ctx.restore();
    args[0] = dummy();
    original.apply(canvas, args);
    hit(extras?.reroute ?? link!, segment.path);
}

/**
 * Hands a segment's hit data to our path: what native tests clicks against and opens the link menu at, kept on the
 * reroute the segment leads into, or else on the link (litegraphLinkAdapter.ts L306-323).
 */
function hit(owner: LLink | Reroute, path: LinkPath): void {
    owner.path = path.hit();
    owner._pos[0] = path.cx;
    owner._pos[1] = path.cy;
    owner._centreAngle = path.angle;
}

/** Which recorded segments a layer draws: all, the focused ones, or those the run's visuals are on. */
const all = () => true;
const isFocused = (segment: Segment) => segment.focused;
const isFlowing = (segment: Segment) => segment.flow !== undefined;

/** Puts the recorded segments that `keep` takes and whose effects reach the screen in `shown`; how many. */
function cull(canvas: Canvas, keep: (segment: Segment) => boolean): number {
    const area = canvas.visible_area;
    let n = 0;
    for (let i = 0; i < count; i++) {
        const { box } = pool[i].path;
        if (keep(pool[i]) && box[2] + REACH >= area[0] && box[0] - REACH <= area[0] + area[2] && box[3] + REACH >= area[1] && box[1] - REACH <= area[1] + area[3]) shown[n++] = pool[i];
    }
    shown.length = n;
    return n;
}

/**
 * Draws what moves on the segments shown, and their flow markers: at half their alpha while a Calm run plays, without
 * glows or with half the particles as Perf.Adaptive steps down, and adding up where they cross with Blend's additive
 * glow on a dark palette, but for the markers, whose dark shadows would vanish.
 */
function moveShown(ctx: CanvasRenderingContext2D): void {
    const animation = MOVING[L.animate];
    const additive = L.blend === 'additive' && dark(app.canvas.clear_background_color);
    moving.alpha = during(L.pauseDuringRender) === 'calm' ? CALM_ALPHA : 1;
    moving.glow = adaptive.level >= PLAIN ? 0 : 1;
    moving.density = adaptive.level >= THIN ? 0.5 : 1;
    try {
        for (const segment of shown) {
            if (segment.empty) continue;
            if (additive) ctx.globalCompositeOperation = 'lighter';
            animation?.(ctx, segment, clock);
            ctx.globalCompositeOperation = 'source-over';
            if (marked()) drawMarkers(ctx, segment, clock.linkPhase, clock.linkFlow);
        }
    } finally {
        moving.alpha = moving.glow = moving.density = 1;
    }
}

/**
 * Draws again what native drew over the segments shown: their centre markers, as native draws each with its segment,
 * then the reroutes on screen, the focused ones alone if `focused`, as native draws them after every segment (FE157
 * LGraphCanvas.ts L6186-6205, FE1395 L5766-5785).
 */
function overShown(canvas: Canvas, ctx: CanvasRenderingContext2D, focused: boolean): void {
    ctx.globalAlpha = canvas.editor_alpha;
    for (const segment of shown) centreMarker(canvas, ctx, segment);
    drawReroutes(canvas, ctx, focused);
}

/** Draws the reroutes on screen, the focused ones alone if `focused`, as native draws them after every segment. */
function drawReroutes(canvas: Canvas, ctx: CanvasRenderingContext2D, focused: boolean): void {
    for (const reroute of canvas._visibleReroutes) {
        if (focused && !focus.reroutes.has(reroute.id)) continue;
        reroute.draw(ctx, canvas._pattern);
        if (!canvas.pointer.isDown) reroute.drawSlots(ctx);
    }
}

/** Draws the moving segments on screen, then what native drew over them. Returns how many it drew. */
function motion(canvas: Canvas, ctx: CanvasRenderingContext2D): number {
    if (pass.still) return 0;
    const n = cull(canvas, all);
    if (!n) return 0;
    ctx.save();
    try {
        enableAntiAliasing(ctx);
        // What moves glows from sprites, unless strokes in the same pass cast their own: stamped between shadowed
        // strokes, sprites keep the GPU from batching those shadows and cost more than they save.
        if (!STROKES.has(L.animate) && !LINK_STYLES[L.linkStyle].moving) startSprites(ctx);
        // Dotted and dashed links march, so their bodies are drawn here rather than in the background.
        if (LINK_STYLES[L.linkStyle].moving) for (const segment of shown) drawBase(ctx, segment, L.animate, false);
        moveShown(ctx);
    } catch (error) {
        guard.fail(LINKS, error);
        // Turned off: the next background pass draws the links natively.
        if (guard.off(LINKS)) canvas.setDirty(true, true);
    } finally {
        stopSprites();
        ctx.restore();
    }
    overShown(canvas, ctx, false);
    return n;
}

/** Draws the run's visuals on the segments on screen they are on, then what native drew over those. Returns how many move. */
function flows(canvas: Canvas, ctx: CanvasRenderingContext2D): number {
    if (!flowing.length || !cull(canvas, isFlowing)) return 0;
    ctx.save();
    let n = 0;
    try {
        n = drawFlows(ctx, shown);
    } finally {
        ctx.restore();
    }
    overShown(canvas, ctx, false);
    return n;
}

/**
 * Native draws a focused link's call in the colour handed in, which ComfyUI's white for a selected node's links would
 * take the place of (pathRenderer.ts determineLinkColor, L173-175), and Highlight's 1.5 × as wide.
 */
function widened(canvas: Canvas, args: RenderLink): void {
    const width = canvas.connections_width;
    const lit = canvas.highlighted_links;
    const { id } = args[3]!;
    const highlighted = lit[id];
    if (pass.focus === 'highlight') canvas.connections_width = width * 1.5;
    delete lit[id];
    try {
        original.apply(canvas, args);
    } finally {
        canvas.connections_width = width;
        if (highlighted) lit[id] = highlighted;
    }
}

/** A focused link native draws, in the focus colour, kept to draw again over the nodes. */
function tint(canvas: Canvas, args: RenderLink): void {
    args[6] = focusPalette(own(canvas, args[3]!, args[6]).native).native;
    raised.push(args);
    widened(canvas, args);
}

/** Dim others: native draws a link focus leaves out at Focus.Dim, along its wire where it has one. */
function dim(canvas: Canvas, args: RenderLink): void {
    const ctx = args[0];
    const alpha = ctx.globalAlpha;
    ctx.globalAlpha = (alpha * L.focusDim) / 100;
    try {
        if (pass.wires) alongWire(canvas, args);
        else original.apply(canvas, args);
    } finally {
        ctx.globalAlpha = alpha;
    }
}

/**
 * Hide others: native draws a link focus leaves out where nobody sees it, so other wrappers still get their call, and
 * its hit data goes, so it cannot be clicked (the 8×8 centre test and isPointInStroke, FE157 canvas/resolvePointerTarget.ts
 * L91-112, FE1395 LGraphCanvas.ts L2452-2512). Its reroutes go too: native draws each after every segment (FE157
 * LGraphCanvas.ts L6186-6205, FE1395 L5766-5785), where they draw nothing. Stubs at its slots, along its wire where it
 * has one, show that it is there.
 */
function hide(canvas: Canvas, args: RenderLink): void {
    const [ctx, a, b, link, , , color, startDir, endDir, extras] = args;
    const path = pass.wires ? hung(canvas, args).path : undefined;
    args[0] = dummy();
    original.apply(canvas, args);
    const owner = extras?.reroute ?? link!;
    owner.path = unhit ??= new Path2D();
    owner._pos[0] = owner._pos[1] = NaN;
    if (extras?.reroute) {
        extras.reroute.draw = extras.reroute.drawSlots = nothing;
        unseen.push(extras.reroute);
    }
    // A segment starts at a slot unless a reroute comes before it, and ends at one unless it leads into a reroute.
    const fromSlot = !canvas.graph?.getReroute(owner.parentId);
    if (!fromSlot && extras?.reroute) return;
    // A slot is half its height inside the node (LGraphNode.getConnectionPos, FE157 L3637, FE1395 L3327).
    const reach = LiteGraph.NODE_SLOT_HEIGHT * 0.5 + STUB;
    ctx.save();
    ctx.beginPath();
    if (fromSlot) {
        if (path) along(ctx, path, 0, reach);
        else stub(ctx, a, startDir || RIGHT, reach);
    }
    if (!extras?.reroute) {
        if (path) along(ctx, path, path.length, path.length - reach);
        else stub(ctx, b, endDir || LEFT, reach);
    }
    ctx.strokeStyle = own(canvas, link!, color).native;
    ctx.lineWidth = canvas.connections_width;
    ctx.stroke();
    ctx.restore();
}

/** The point and direction a path writes. */
const here = new Float64Array(4);

/** Adds the stretch of `path` from `from` px along it to `to` to the context's path, in 2 px steps. */
function along(ctx: CanvasRenderingContext2D, path: LinkPath, from: number, to: number): void {
    const n = Math.ceil(Math.abs(to - from) / 2);
    for (let i = 0; i <= n; i++) {
        path.find(from + ((to - from) * i) / n, here);
        if (i) ctx.lineTo(here[0], here[1]);
        else ctx.moveTo(here[0], here[1]);
    }
}

/**
 * Focus.OnTop: draws the focused links again over the nodes as their pass drew them: native's calls, or our segments
 * with what moves on them and their bases, plain, as glows drawn in every front pass would cost each frame what the
 * background pass paid once. Then the run's visuals on them, and the focused reroutes over them.
 */
function raise(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    if (!L.focusOnTop || !pass.focus) return;
    if (!cull(canvas, isFocused) && !raised.length) return;
    for (const args of raised) {
        args[0] = ctx;
        widened(canvas, args);
    }
    // While native draws the links, the segments recorded are those the run's visuals are on.
    if (pass.on) {
        ctx.save();
        try {
            enableAntiAliasing(ctx);
            if (!pass.still && !STROKES.has(L.animate) && !LINK_STYLES[L.linkStyle].moving) startSprites(ctx);
            for (const segment of shown) {
                body(canvas, ctx, segment, pass.still, true);
                if (!pass.still || segment.empty) continue;
                STILL[L.animate]?.(ctx, segment, STILL_PHASE);
                if (marked()) drawMarkers(ctx, segment, STILL_PHASE);
            }
            if (!pass.still) moveShown(ctx);
        } catch (error) {
            guard.fail(LINKS, error);
            if (guard.off(LINKS)) canvas.setDirty(true, true);
        } finally {
            stopSprites();
            ctx.restore();
        }
    }
    if (pass.runs) {
        ctx.save();
        drawFlows(ctx, shown);
        ctx.restore();
    }
    overShown(canvas, ctx, true);
}

/** The link setup(): wraps drawConnections and renderLink, and puts the motion layer in place. */
export function installLinks(): void {
    const proto = LGraphCanvas.prototype;
    const drawConnections = proto.drawConnections;
    original = proto.renderLink;
    // Both frontends' own renderLink hands each segment to linkRenderer.renderLinkDirect (FE157 LGraphCanvas.ts L6537,
    // FE1395 L6083). LinkFX wraps renderLink in its init(), before any setup(), and marks that it booted.
    foreign = !String(original).includes('renderLinkDirect') || Boolean((globalThis as { __LINKFX_V2_BOOTED__?: unknown }).__LINKFX_V2_BOOTED__);
    warned = told = false;
    glows.bases = 0;
    linkPass.drawsRuns = drawsRuns;
    steps.wires = stepWires;

    proto.drawConnections = function (this: Canvas, ...args: Parameters<Canvas['drawConnections']>) {
        begin(this, args[0]);
        try {
            return drawConnections.apply(this, args);
        } finally {
            end(this);
        }
    };

    proto.renderLink = function (this: Canvas, ...args: RenderLink) {
        const [ctx, a, b, link, skipBorder, flow, color, startDir, endDir, extras] = args;
        pass.calls++;
        // Native draws the calls outside our pass or on another context, KJNodes' virtual links (no link) and the
        // flash of a triggered link (skip_border and flow).
        if (ctx !== pass.ctx || !link || (skipBorder && flow)) return original.apply(this, args);
        // Native draws floating links (disabled) too, which selection focus and runs never hold.
        const disabled = Boolean(extras?.disabled);
        const focused = pass.focus !== '' && !disabled && focuses(link, extras?.reroute);
        const step = pass.runs && !disabled ? stepInto(link) : undefined;
        if (pass.focus === 'dim' && !focused && !step) return dim(this, args);
        if (pass.focus === 'hide' && !focused && !step) return hide(this, args);
        // Animate only these leaves the rest to native.
        if (pass.on && !disabled && (focused || step || pass.focus !== 'animate')) {
            const segment = record(this, link, a, b, color, startDir, endDir, extras, focused, step);
            // A segment we failed to draw is left to native.
            if (place(this, ctx, segment)) {
                args[0] = dummy();
                original.apply(this, args);
                if (segment.custom) hit(extras?.reroute ?? link, segment.path);
                return;
            }
        } else {
            // A floating link hangs too, drawn as native draws it.
            if (disabled && pass.wires) return alongWire(this, args);
            // Native draws it, with the run's visuals over it.
            if (step) record(this, link, a, b, color, startDir, endDir, extras, focused, step);
            if (focused && pass.tinted) return tint(this, args);
        }
        return original.apply(this, args);
    };

    // Over the background and under the nodes, unless the graph puts links over the nodes (links_ontop), with the run's
    // visuals over them. A focus built again, or a run's visuals gone, since the background was drawn draws it again;
    // focused links come over the nodes.
    layers.links = (canvas, ctx, over) => {
        const ontop = Boolean(canvas.graph?.config.links_ontop);
        if (!over && (syncFocus(canvas) || (pass.runs && !flowsShown()))) canvas.setDirty(true, true);
        if (over && !ontop) raise(canvas, ctx);
        if (over !== ontop) return;
        live.links = motion(canvas, ctx);
        live.flows = flows(canvas, ctx);
        if (live.links || live.flows) wake();
    };
}
