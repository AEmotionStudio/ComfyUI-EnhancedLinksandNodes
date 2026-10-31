/**
 * Link effects on ComfyUI's own link pass. drawConnections keeps its native
 * traversal, and every renderLink call still runs natively: the ones we draw
 * ourselves run on a 1×1 canvas nobody sees, so hit testing, reroutes, the
 * link menu and other extensions' wrappers get exactly the native calls. Each
 * such call records its segment. Still links (Static.Mode, a paused run,
 * reduced motion) are drawn into the background right there; moving ones are
 * drawn over it in every front pass, under the nodes. When another extension
 * draws links too, Coexist can leave every link to it.
 *
 * @module links/pipeline
 */

import type { CanvasColour, LLink, Point } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L } from '@/core/settings';
import { clock, dummy, env, guard, layers, live, wake } from '@/core/engine';
import { renderAnimatedStyle, type RenderItem } from '@/effects/animated-renderers';
import { renderStaticStyle } from '@/effects/static-renderers';
import { getLinkRenderer } from '@/renderers/link-renderers';
import { enableAntiAliasing } from '@/renderers/render-utils';
import { LinkPath } from './geometry';

type Canvas = InstanceType<typeof LGraphCanvas>;
type RenderLink = Parameters<Canvas['renderLink']>;

/** The guard's key, and what its toast calls the links when it turns them off. */
const LINKS = 'Link animation';

/** Below this zoom links are native: an effect's details are a few pixels across at most. Above it they keep their effects in LiteGraph's low quality too, as in v1 and v2. */
const LOD_SCALE = 0.25;

/** How far past its path an effect draws at most: Crystal Stream's crystals at the thickest setting, with their glow. */
const REACH = 120;

/** LinkMarkerShape.Arrow; None (0) draws no centre marker and any other shape a circle (litegraphLinkAdapter.ts L105-108). */
const ARROW = 2;

/** A segment native drew for a link, as the effects take it. */
class Segment implements RenderItem {
    readonly native = new LinkPath();
    readonly start = this.native.a;
    readonly end = this.native.b;
    path: RenderItem['path'] = this.native;
    defaultColor = '';
    linkStyle = '';
    isStatic = false;
}

/** The segments of the last pass are pool[0, count); the pool only grows. */
const pool: Segment[] = [];
let count = 0;
/** The ones the last front pass drew. */
const shown: Segment[] = [];
/** A still segment, as the renderers take items. */
const one: Segment[] = [];
/** What renderAnimatedStyle reads the clock from. */
const moment = { direction: 1, totalTime: 0, phase: 0 };

/**
 * The link pass: its context while drawConnections runs, whether we draw its links, whether they are still,
 * how many renderLink calls it saw, and the highlighted links (the selected nodes' links).
 */
const pass = { ctx: undefined as CanvasRenderingContext2D | undefined, on: false, still: false, calls: 0, highlighted: {} as Record<string, boolean> };

/**
 * v2's still pose: still frames draw at `phase`, which moves to the other of π/4 and 9π/4 on the first still
 * frame, and on the first one after Animate, Link.Style, Quality or Particle.Density changed.
 */
const pose = { phase: Math.PI / 4, stale: true, animate: 0, linkStyle: '', quality: 0, particleDensity: 0 };

/** Whether this page warned that another extension draws links without calling renderLink. */
let warned = false;

/** Whether another extension drew links when the link setup() ran, which Coexist 'auto' leaves them to, and whether this page said so. */
let foreign = false;
let told = false;

/** Whether Coexist leaves the links to native and other extensions; the first time 'auto' does, it says so. */
function defers(): boolean {
    if (L.coexist === 'ours' || (L.coexist === 'auto' && !foreign)) return false;
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

function begin(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    count = 0;
    pass.ctx = ctx;
    pass.calls = 0;
    pass.on = L.animate !== 0 && !defers() && !guard.off(LINKS) && canvas.ds.scale >= LOD_SCALE;
    pass.still = L.staticMode || (L.pauseDuringRender && env.running) || env.reducedMotion;
    pass.highlighted = canvas.highlighted_links;
    if (L.animate !== pose.animate || L.linkStyle !== pose.linkStyle || L.quality !== pose.quality || L.particleDensity !== pose.particleDensity) {
        Object.assign(pose, { animate: L.animate, linkStyle: L.linkStyle, quality: L.quality, particleDensity: L.particleDensity, stale: true });
    }
    if (pass.still && pose.stale) {
        pose.phase = (pose.phase + Math.PI * 2) % (Math.PI * 4);
        pose.stale = false;
    }
}

function end(canvas: Canvas): void {
    pass.ctx = undefined;
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

/** Records the segment of a renderLink call we draw ourselves, from the arguments native gets. */
function record(canvas: Canvas, link: LLink, a: Readonly<Point>, b: Readonly<Point>, color: CanvasColour | null,
    startDir: number, endDir: number, extras: RenderLink[9]): Segment {
    const segment = (pool[count++] ??= new Segment());
    segment.native.set(a, b, startDir, endDir, canvas.links_render_mode, extras?.startControl, extras?.endControl);
    // pathRenderer.ts determineLinkColor (L168-183) with what litegraphLinkAdapter.ts hands it (L226-235), which leaves out link.color.
    segment.defaultColor = pass.highlighted[link.id] ? '#FFF' : String(color || LGraphCanvas.link_type_colors[String(link.type)] || canvas.default_link_color);
    segment.linkStyle = L.linkStyle;
    segment.path = L.linkStyle === 'spline' ? segment.native : getLinkRenderer(L.linkStyle);
    segment.isStatic = pass.still;
    return segment;
}

/** Draws a still segment into the background where native would have, with its centre marker. False if it failed. */
function bake(canvas: Canvas, ctx: CanvasRenderingContext2D, segment: Segment): boolean {
    ctx.save();
    try {
        enableAntiAliasing(ctx);
        one[0] = segment;
        renderStaticStyle(ctx, one, L.animate, pose.phase);
    } catch (error) {
        guard.fail(LINKS, error);
        return false;
    } finally {
        ctx.restore();
    }
    // In the state native left, as it draws its own marker.
    ctx.save();
    marker(canvas, ctx, segment);
    ctx.restore();
    return true;
}

/** The centre marker native draws on a segment (pathRenderer.ts L149-156, L798-837). */
function marker(canvas: Canvas, ctx: CanvasRenderingContext2D, segment: Segment): void {
    const shape: number = canvas.linkMarkerShape;
    if (!shape || canvas.ds.scale < 0.6 || !canvas.highquality_render) return;
    const { cx, cy, angle } = segment.native;
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
    ctx.fillStyle = segment.defaultColor;
    ctx.fill();
}

/** Draws the moving segments on screen, then what native drew over them: the centre markers and the reroutes. Returns how many it drew. */
function motion(canvas: Canvas, ctx: CanvasRenderingContext2D): number {
    if (pass.still) return 0;
    const area = canvas.visible_area;
    let n = 0;
    for (let i = 0; i < count; i++) {
        const { box } = pool[i].native;
        if (box[2] + REACH >= area[0] && box[0] - REACH <= area[0] + area[2] && box[3] + REACH >= area[1] && box[1] - REACH <= area[1] + area[3]) shown[n++] = pool[i];
    }
    shown.length = n;
    if (!n) return 0;
    ctx.save();
    try {
        enableAntiAliasing(ctx);
        moment.direction = L.direction;
        moment.totalTime = clock.linkTime;
        moment.phase = clock.linkPhase;
        renderAnimatedStyle(ctx, shown, L.animate, clock.linkPhase, moment);
    } catch (error) {
        guard.fail(LINKS, error);
        // Turned off: the next background pass draws the links natively.
        if (guard.off(LINKS)) canvas.setDirty(true, true);
    } finally {
        ctx.restore();
    }
    // Native draws each marker with its segment, and the reroutes after every segment (FE157 LGraphCanvas.ts L6186-6205, FE1395 L5766-5785).
    ctx.globalAlpha = canvas.editor_alpha;
    for (const segment of shown) marker(canvas, ctx, segment);
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
            // A still segment we failed to draw is left to native.
            if (!pass.still || bake(this, ctx, segment)) args[0] = dummy();
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
