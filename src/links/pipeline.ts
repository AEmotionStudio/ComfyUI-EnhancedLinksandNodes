/**
 * Link effects on ComfyUI's own link pass. drawConnections keeps its native
 * traversal, and every renderLink call still runs natively: the ones we draw
 * ourselves run on a 1×1 canvas nobody sees, so hit testing, reroutes, the
 * link menu and other extensions' wrappers get exactly the native calls. Each
 * such call records its segment along the path its Link.Style gives it, and
 * draws what does not move where native would have drawn the link: the
 * animation's base with its glow and shadow, or the whole still frame
 * (Static.Mode, a paused run, reduced motion, or a look with nothing that
 * moves). Where that is slow, the bases go without their glow while the view
 * or the graph moves. What moves is drawn over the background in every front
 * pass, under the nodes. A shape of our own takes the segment's hit data with
 * it, so clicks and the link menu follow what is drawn. When another extension
 * draws links too, Coexist can leave every link to it; Link effects off
 * leaves every link to native.
 *
 * @module links/pipeline
 */

import type { CanvasColour, LLink, Point, Reroute } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L } from '@/core/settings';
import { STILL_PHASE, clock, dummy, env, guard, layers, live, wake } from '@/core/engine';
import { HIGHLIGHT, palette, type Palette } from '@/core/colors';
import { startSprites, stopSprites } from '@/fx/particles';
import { MOVING, STROKES } from './animations';
import { LinkPath } from './geometry';
import { STILL } from './stills';
import { LINK_STYLES, centreMarker, drawBase, drawMarkers } from './styles';

type Canvas = InstanceType<typeof LGraphCanvas>;
type RenderLink = Parameters<Canvas['renderLink']>;

/** The guard's key, and what its toast calls the links when it turns them off. */
const LINKS = 'Link animation';

/** Below this zoom links are native: an effect's details are a few pixels across at most. Above it they keep their effects in LiteGraph's low quality too, as in v1 and v2. */
const LOD_SCALE = 0.25;

/** How far past its path an effect draws at most: Crystal Stream's crystals at the thickest setting, with their glow. */
const REACH = 120;

/** Classic Flow, whose only motion is its markers. */
const CLASSIC = 9;

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
    /** The colours it is drawn in. */
    pal: Palette = HIGHLIGHT;
    linkStyle = '';
    isStatic = false;
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
     * Lays the segment from a to b on the path Link.Style gives it, the render mode's `mode` where that keeps native's:
     * `u0` px along its link, from a slot if `fromSlot` and to one if `toSlot`, where a wave or a coil starts and ends.
     */
    lay(a: Readonly<ArrayLike<number>>, b: Readonly<ArrayLike<number>>, startDir: number, endDir: number, mode: number, u0 = 0, fromSlot = true,
        toSlot = true, startControl?: Readonly<ArrayLike<number>>, endControl?: Readonly<ArrayLike<number>>): void {
        const style = LINK_STYLES[L.linkStyle];
        this.u0 = u0;
        this.path.set(a, b, startDir, endDir, style.mode ?? mode, startControl, endControl);
        if (style.shape === 'step') this.path.step(endDir);
        this.len = this.path.length;
        if (style.shape === 'wave' || style.shape === 'coil') this.path.bend(style.shape === 'coil', u0, fromSlot, toSlot);
        this.custom = Boolean(style.shape) || (style.mode ?? mode) !== mode;
        this.linkStyle = L.linkStyle;
    }
}

/** The segments of the last pass are pool[0, count); the pool only grows. */
const pool: Segment[] = [];
let count = 0;
/** Where the current link's segments start in the pool, and whether its last segment is still to come. */
let first = 0;
let open = false;
/** Where along its link each reroute's segment ended in this pass. */
const ends = new Map<Reroute, number>();
/** The ones the last front pass drew. */
const shown: Segment[] = [];

/**
 * The link pass: its context while drawConnections runs, whether we draw its links, whether they are still, whether
 * their bases go without their glows and halos, how many renderLink calls it saw, how many bases it drew, and the
 * highlighted links (the selected nodes' links).
 */
const pass = { ctx: undefined as CanvasRenderingContext2D | undefined, on: false, still: false, plain: false, calls: 0, bases: 0, highlighted: {} as Record<string, boolean> };

/**
 * A pass with glows that drew more bases than this is too slow to repeat while the view or the graph moves: Chromium
 * spends about 0.8 ms of each frame on a base's glow and halo, with or without a GPU, and does it outside JavaScript.
 */
const BUSY = 12;
/** How long after the last pass drawn plain, in ms, one with the glows comes back. */
const SETTLE_MS = 150;

/**
 * The passes with glows: how many bases the last one drew, and whether the next one must be one; where the view was at
 * the last pass; and the timer that asks for one once the view and the graph keep still.
 */
const glows = { bases: 0, due: false, scale: 0, x: 0, y: 0, timer: 0 };

function settle(): void {
    glows.due = true;
    app.canvas.setDirty(true, true);
}

/** Whether this page warned that another extension draws links without calling renderLink. */
let warned = false;

/** Whether another extension drew links when the link setup() ran, which Coexist 'auto' leaves them to, and whether this page said so. */
let foreign = false;
let told = false;

/** Whether Coexist leaves the links to native and other extensions. */
export const deferring = (): boolean => L.coexist === 'defer' || (L.coexist === 'auto' && foreign);

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

/** RenderUtils.enableAntiAliasing (old_link_animations.js:1604-1610), which v1 set before drawing links. */
function enableAntiAliasing(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;
}

/** Whether the look has anything that moves: Classic Flow moves only its markers, and dotted and dashed links march. */
function moves(): boolean {
    return L.animate !== CLASSIC || (L.markerEnabled && L.markerShape !== 'none') || Boolean(LINK_STYLES[L.linkStyle].moving);
}

function begin(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    count = 0;
    open = false;
    ends.clear();
    pass.ctx = ctx;
    pass.calls = pass.bases = 0;
    pass.on = L.enabled && L.animate !== 0 && !defers() && !guard.off(LINKS) && canvas.ds.scale >= LOD_SCALE;
    pass.still = L.staticMode || (L.pauseDuringRender && env.running) || env.reducedMotion || !moves();
    pass.highlighted = canvas.highlighted_links;
    // While a graph with many glowing links on screen is panned, zoomed or has nodes dragged, its bases go plain.
    const { scale, offset } = canvas.ds;
    const moving = scale !== glows.scale || offset[0] !== glows.x || offset[1] !== glows.y || canvas.isDragging;
    [glows.scale, glows.x, glows.y] = [scale, offset[0], offset[1]];
    pass.plain = pass.on && !glows.due && glows.bases > BUSY && moving;
    glows.due = false;
    if (pass.plain) {
        clearTimeout(glows.timer);
        glows.timer = window.setTimeout(settle, SETTLE_MS);
    }
}

function end(canvas: Canvas): void {
    pass.ctx = undefined;
    if (open) close();
    if (!pass.plain) glows.bases = pass.bases;
    // Moving segments show only once the motion layer draws them, and it counts those on screen. Until then they count,
    // so the ticker runs and chains its hook again if another extension replaced it.
    if (count && !pass.still) {
        live.links = count;
        wake();
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

/** Records the segment of a renderLink call we draw ourselves, from the arguments native gets. */
function record(canvas: Canvas, link: LLink, a: Readonly<Point>, b: Readonly<Point>, color: CanvasColour | null,
    startDir: number, endDir: number, extras: RenderLink[9]): Segment {
    if (open && pool[count - 1].link !== link) close();
    if (!open) first = count;
    const segment = (pool[count++] ??= new Segment());
    const reroute = extras?.reroute;
    // The reroute the segment starts from (LinkSegment.parentId), where the segment into it ended; none where the link starts.
    const from = canvas.graph?.getReroute((reroute ?? link).parentId);
    segment.link = link;
    segment.lay(a, b, startDir, endDir, canvas.links_render_mode, (from && ends.get(from)) || 0, !from, !reroute, extras?.startControl, extras?.endControl);
    if (reroute) ends.set(reroute, segment.u0 + segment.len);
    // The segment into the input is the link's last.
    open = Boolean(reroute);
    if (!open) close();
    // pathRenderer.ts determineLinkColor (L168-183) with what litegraphLinkAdapter.ts hands it (L226-235), which leaves out
    // link.color: white while highlighted, else the colour handed in, the type's or the canvas default, the first the canvas takes.
    segment.pal = pass.highlighted[link.id] ? HIGHLIGHT : palette(color) ?? palette(LGraphCanvas.link_type_colors[String(link.type)])
        ?? palette(canvas.default_link_color) ?? palette(LINK_COLOR)!;
    segment.isStatic = pass.still;
    return segment;
}

/** Whether the look draws flow markers: Classic Flow's, or every animation's with Marker.All. */
const marked = () => L.animate === CLASSIC || L.markerAll;

/**
 * Draws what does not move where native would have drawn the segment: the animation's base, unless it marches. While
 * still, the link's last segment also draws the still animation and markers of all its segments, which are counted
 * along the whole link, and then their centre markers. False if it failed.
 */
function place(canvas: Canvas, ctx: CanvasRenderingContext2D, segment: Segment): boolean {
    if (!pass.still && LINK_STYLES[segment.linkStyle].moving) return true;
    const whole = pass.still && !open;
    ctx.save();
    try {
        enableAntiAliasing(ctx);
        if (drawBase(ctx, segment, L.animate, pass.still, pass.plain)) pass.bases++;
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

/** Draws the moving segments on screen, then what native drew over them: the centre markers and the reroutes. Returns how many it drew. */
function motion(canvas: Canvas, ctx: CanvasRenderingContext2D): number {
    if (pass.still) return 0;
    const area = canvas.visible_area;
    let n = 0;
    for (let i = 0; i < count; i++) {
        const { box } = pool[i].path;
        if (box[2] + REACH >= area[0] && box[0] - REACH <= area[0] + area[2] && box[3] + REACH >= area[1] && box[1] - REACH <= area[1] + area[3]) shown[n++] = pool[i];
    }
    shown.length = n;
    if (!n) return 0;
    ctx.save();
    try {
        enableAntiAliasing(ctx);
        // What moves glows from sprites, unless strokes in the same pass cast their own: stamped between shadowed
        // strokes, sprites keep the GPU from batching those shadows and cost more than they save.
        if (!STROKES.has(L.animate) && !LINK_STYLES[L.linkStyle].moving) startSprites(ctx);
        // Dotted and dashed links march, so their bodies are drawn here rather than in the background.
        if (LINK_STYLES[L.linkStyle].moving) for (const segment of shown) drawBase(ctx, segment, L.animate, false);
        const draw = MOVING[L.animate];
        for (const segment of shown) {
            if (segment.empty) continue;
            draw?.(ctx, segment, clock);
            if (marked()) drawMarkers(ctx, segment, clock.linkPhase, clock.linkFlow);
        }
    } catch (error) {
        guard.fail(LINKS, error);
        // Turned off: the next background pass draws the links natively.
        if (guard.off(LINKS)) canvas.setDirty(true, true);
    } finally {
        stopSprites();
        ctx.restore();
    }
    // Native draws each marker with its segment, and the reroutes after every segment (FE157 LGraphCanvas.ts L6186-6205, FE1395 L5766-5785).
    ctx.globalAlpha = canvas.editor_alpha;
    for (const segment of shown) centreMarker(canvas, ctx, segment);
    for (const reroute of canvas._visibleReroutes) {
        reroute.draw(ctx, canvas._pattern);
        if (!canvas.pointer.isDown) reroute.drawSlots(ctx);
    }
    return n;
}

/** The link setup(): wraps drawConnections and renderLink, and puts the motion layer in place. */
export function installLinks(): void {
    const proto = LGraphCanvas.prototype;
    const drawConnections = proto.drawConnections;
    const renderLink = proto.renderLink;
    // Both frontends' own renderLink hands each segment to linkRenderer.renderLinkDirect (FE157 LGraphCanvas.ts L6537,
    // FE1395 L6083). LinkFX wraps renderLink in its init(), before any setup(), and marks that it booted.
    foreign = !String(renderLink).includes('renderLinkDirect') || Boolean((globalThis as { __LINKFX_V2_BOOTED__?: unknown }).__LINKFX_V2_BOOTED__);
    warned = told = false;
    glows.bases = 0;

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
        // Native draws the calls outside our pass or on another context, KJNodes' virtual links (no link),
        // the flash of a triggered link (skip_border and flow) and floating links (disabled).
        if (pass.on && ctx === pass.ctx && link && !(skipBorder && flow) && !extras?.disabled) {
            const segment = record(this, link, a, b, color, startDir, endDir, extras);
            // A segment we failed to draw is left to native.
            if (place(this, ctx, segment)) {
                args[0] = dummy();
                renderLink.apply(this, args);
                if (segment.custom) hit(extras?.reroute ?? link, segment.path);
                return;
            }
        }
        return renderLink.apply(this, args);
    };

    // Over the background and under the nodes, unless the graph puts links over the nodes (links_ontop).
    layers.links = (canvas, ctx, over) => {
        if (over !== Boolean(canvas.graph?.config.links_ontop)) return;
        live.links = motion(canvas, ctx);
        if (live.links) wake();
    };
}
