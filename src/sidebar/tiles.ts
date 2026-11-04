/**
 * The live tiles of the panel's galleries: small scenes that the real renderers
 * draw at the user's settings, but for the link animation, the node effect or
 * the look a tile stands for. A scene is drawn in graph units and scaled to its
 * tile, as the canvas zoomed out shows it. The tiles move on a clock of their
 * own, at up to 30 fps and a look's at 15, only while on screen, and show the
 * still frame where the canvas would; none draws once the panel or the picker
 * that shows it stops it.
 *
 * @module sidebar/tiles
 */

import { app } from '/scripts/app.js';
import { L, N, wired } from '@/core/settings';
import { STILL_PHASE, advance, clock, env, heldByRun } from '@/core/engine';
import { nodePalette, palette } from '@/core/colors';
import { Segment } from '@/links/pipeline';
import { Wire, rest } from '@/links/physics';
import { MOVING } from '@/links/animations';
import { STILL } from '@/links/stills';
import { drawBase, drawMarkers } from '@/links/styles';
import { OVER, UNDER, drawNodeFx, type Part } from '@/nodes/effects';
import { drawTile, releaseTiles, timeOf } from '@/nodes/shader';
import { drawLook, type Look } from '@/ui/looks';

type Clock = typeof clock;
type Point = [number, number];

/** What a tile shows, drawn in scene units at clock k. */
export type Scene = (ctx: CanvasRenderingContext2D, k: Clock) => void;

/** A scene is WIDTH × HEIGHT graph units, a tile's 16:10. */
const WIDTH = 320;
const HEIGHT = 200;
const FRAME_MS = 1000 / 30;
/** A look's tile draws a link and two nodes with their effects, which costs the canvas frames, so it moves at half the rate. */
const LOOK_MS = 1000 / 15;
/** LiteGraph's SPLINE_LINK, and LinkDirection's RIGHT and LEFT: the way a link leaves an output and enters an input. */
const SPLINE = 2;
const RIGHT = 4;
const LEFT = 3;
/** Classic Flow, whose only motion is its markers. */
const CLASSIC = 9;
/** LiteGraph.LINK_COLOR, for a canvas whose default link colour the canvas would not take. */
const LINK_COLOR = '#9A9';

/** Everything on a tile moves. */
const MOVING_ALL = { links: 1, nodes: 1, particles: 1, bursts: 0, marks: 0, flows: 0, rings: 0, wires: 0, assist: 0 };
/** The tiles' clock. */
const k: Clock = { ...clock };

const segment = new Segment();
/** What a link hangs as with wire physics on: at rest, as the canvas shows it once still. */
const wire = new Wire();

/** Whether links show still, as the link pass decides it. */
const linksStill = () => L.staticMode || heldByRun(L.pauseDuringRender) || env.reducedMotion;

/**
 * A link from an output at `a` to an input at `b` with link animation `animate`, in the palette's IMAGE colours; None
 * draws it as native does. With wire physics on it hangs at rest from native's path.
 */
function link(ctx: CanvasRenderingContext2D, animate: number, a: Point, b: Point, k: Clock): void {
    segment.pal = palette(LGraphCanvas.link_type_colors.IMAGE) ?? palette(app.canvas.default_link_color) ?? palette(LINK_COLOR)!;
    ctx.save();
    if (!animate) {
        segment.path.set(a, b, RIGHT, LEFT, app.canvas.links_render_mode);
        if (wired()) rest(wire, segment.path);
        segment.path.draw(ctx, segment.pal.native, app.canvas.connections_width);
    } else {
        segment.lay(a, b, RIGHT, LEFT, SPLINE);
        if (wired()) {
            segment.path.set(a, b, RIGHT, LEFT, SPLINE);
            rest(wire, segment.path);
            segment.len = segment.path.length;
        }
        segment.chain = segment.len;
        const still = linksStill();
        segment.isStatic = still;
        drawBase(ctx, segment, animate, still);
        if (still) STILL[animate]?.(ctx, segment, STILL_PHASE);
        else MOVING[animate]?.(ctx, segment, k);
        if (animate === CLASSIC || L.markerAll) drawMarkers(ctx, segment, still ? STILL_PHASE : k.linkPhase, still ? undefined : k.linkFlow);
    }
    ctx.restore();
}

/** Both sides of the node's edge, so an effect draws every element, in v1's order. */
const part: Part = { sides: UNDER | OVER, x0: 0, y0: 0, x1: 0, y1: 0, round: 0 };
const node = { id: 0, title: '', size: [0, 0] as [number, number], selected: false };

/** A node with its title bar above (x, y), w × h below it, with `background` and node effect `style` and its halo, as the node layers draw them. */
function box(ctx: CanvasRenderingContext2D, style: number, x: number, y: number, w: number, h: number, k: Clock, background = 'none'): void {
    const title = LiteGraph.NODE_TITLE_HEIGHT;
    const round = LiteGraph.ROUND_RADIUS;
    ctx.save();
    ctx.translate(x, y);
    if (style && N.glowShow) {
        ctx.shadowColor = nodePalette(style).primary;
        ctx.shadowBlur = 10 * N.glow;
        ctx.shadowOffsetX = ctx.shadowOffsetY = 2;
    }
    ctx.beginPath();
    ctx.roundRect(0, -title, w, h + title, round);
    ctx.fillStyle = LiteGraph.NODE_DEFAULT_BGCOLOR;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    if (background !== 'none') {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, [0, 0, round, round]);
        ctx.clip();
        ctx.globalAlpha = N.backgroundStrength;
        drawTile(ctx, background, w, h, timeOf(k.backgroundTime));
        ctx.restore();
    }
    ctx.beginPath();
    ctx.roundRect(0, -title, w, title, [round, round, 0, 0]);
    ctx.fillStyle = LiteGraph.NODE_DEFAULT_COLOR;
    ctx.fill();
    // A style's particles alone, or the fireflies of a node with particles and no effect.
    const only = !style || !N.animationsEnabled;
    if (N.particleShow || !only) {
        node.size[0] = w;
        node.size[1] = h;
        Object.assign(part, { x0: 0, y0: -title, x1: w, y1: h, round });
        drawNodeFx(ctx, style, node, w, h, k, part, 1, only);
    }
    ctx.restore();
}

/** Link animation `animate` along a link across the tile. */
export const linkScene = (animate: number): Scene => (ctx, k) => link(ctx, animate, [24, 150], [296, 50], k);

/** Node background `name` on a node in the middle of the tile, with no effect. */
export const backgroundScene = (name: string): Scene => (ctx, k) => box(ctx, 0, 70, 75, 180, 100, k, name);

/** Node effect `style` on a node in the middle of the tile. */
export const nodeScene = (style: number): Scene => (ctx, k) => box(ctx, style, 70, 75, 180, 100, k);

/** A look: its link animation from one node to another, both with its node effect. */
const lookScene = (look: Look): Scene => (ctx, k) =>
    drawLook(look, () => {
        link(ctx, L.animate, [104, 70], [216, 130], k);
        box(ctx, N.animate, 20, 55, 84, 90, k, N.background);
        box(ctx, N.animate, 216, 115, 84, 70, k, N.background);
    });

// =============================================================================
// Drawing
// =============================================================================

interface Tile {
    canvas: HTMLCanvasElement;
    scene: Scene;
    /** How often it moves, and when it last did. */
    ms: number;
    drawn: number;
}

const tiles = new WeakMap<Element, Tile>();
/** The tiles on screen. */
const shown = new Set<Tile>();
const observer = new IntersectionObserver(seen);
let frame = 0;
/** When the tiles last moved; 0 while stopped. */
let last = 0;

/** A canvas that shows `scene` while it is on screen, moving every `ms`. */
export function tile(scene: Scene, ms = FRAME_MS): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.className = 'eln-tile-canvas';
    tiles.set(canvas, { canvas, scene, ms, drawn: 0 });
    observer.observe(canvas);
    return canvas;
}

/** A canvas that shows a look while it is on screen. */
export const lookTile = (look: Look): HTMLCanvasElement => tile(lookScene(look), LOOK_MS);

function seen(entries: IntersectionObserverEntry[]): void {
    for (const entry of entries) {
        const t = tiles.get(entry.target)!;
        // An entry queued before its tile was stopped can still come in, after the tile left the page.
        if (!entry.isIntersecting || !entry.target.isConnected) shown.delete(t);
        else if (!shown.has(t)) {
            shown.add(t);
            paint(t);
        }
    }
    frame ||= requestAnimationFrame(tick);
}

/** Draws the tiles on screen again at the next frame, for a setting that changed. */
export function repaint(): void {
    frame ||= requestAnimationFrame(tick);
}

/** Stops the tiles in `within`: the panel closed or builds that part again, or the picker closed. */
export function stopTiles(within: Element): void {
    for (const canvas of within.querySelectorAll('.eln-tile-canvas')) {
        observer.unobserve(canvas);
        shown.delete(tiles.get(canvas)!);
    }
}

function tick(now: number): void {
    frame = 0;
    if (!shown.size) {
        last = 0;
        releaseTiles();
        return;
    }
    // With reduced motion each tile shows its still frame, drawn again only when something changes.
    if (env.reducedMotion) {
        last = 0;
        for (const t of shown) paint(t);
        return;
    }
    if (now - last >= FRAME_MS - 1) {
        advance(k, last ? Math.min((now - last) / 1000, 0.1) : 0, MOVING_ALL);
        last = now;
        for (const t of shown) {
            if (now - t.drawn < t.ms - 1) continue;
            t.drawn = now;
            paint(t);
        }
    }
    frame = requestAnimationFrame(tick);
}

function paint(t: Tile): void {
    const { canvas, scene } = t;
    const width = Math.round(canvas.clientWidth * devicePixelRatio);
    const height = Math.round(canvas.clientHeight * devicePixelRatio);
    if (!width || !height) return;
    if (canvas.width !== width || canvas.height !== height) Object.assign(canvas, { width, height });
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(width / WIDTH, 0, 0, height / HEIGHT, 0, 0);
    ctx.fillStyle = app.canvas.clear_background_color;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.save();
    try {
        scene(ctx, k);
    } catch (error) {
        // The tile keeps what it drew; the canvas's guard deals with the renderer.
        shown.delete(t);
        console.warn('[Enhanced Links & Nodes] A gallery tile failed:', error);
    } finally {
        ctx.restore();
    }
}
