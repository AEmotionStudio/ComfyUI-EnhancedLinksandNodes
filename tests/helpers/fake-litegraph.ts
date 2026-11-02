/**
 * A LiteGraph canvas that draws in native frame order, so tests drive the
 * extensions' hooks as ComfyUI calls them. What it paints is a sketch (a body,
 * a title, a bezier per link segment); the calls, their order and the
 * arguments each hook gets follow the frontend sources, cited by line: FE157
 * is 1.57.1 and FE1395 is 1.39.5, in LGraphCanvas.ts unless named.
 *
 * Importing this module gives the page a clock: requestAnimationFrame queues
 * for frames(), performance.now() reads page.now, and document.hidden reads
 * page.hidden. OffscreenCanvas contexts are CanvasRecorders.
 *
 * @module tests/helpers/fake-litegraph
 */

import { vi } from 'vitest';
import { clock, live } from '@/core/engine';
import { LOOK } from '@/core/settings';
import { api, app, fake, resetFakeApp } from './fake-app';
import { CanvasRecorder } from './recording-context';

type Point = [number, number];

const NODE_TITLE_HEIGHT = 30;
const NODE_TITLE_TEXT_Y = 20;
const NODE_FONT = 'Inter';
const NODE_SLOT_HEIGHT = 20;
const NODE_COLLAPSED_WIDTH = 80;
const ROUND_RADIUS = 8;
const LinkDirection = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4, CENTER: 5 };
const LGraphEventMode = { ALWAYS: 0, NEVER: 2, BYPASS: 4 };
const RenderShape = { BOX: 1, ROUND: 2, CIRCLE: 3, CARD: 4 };
const TitleMode = { NORMAL_TITLE: 0, NO_TITLE: 1 };

/** The time, the requestAnimationFrame callbacks waiting for the next frame, how many were requested, and whether the tab is hidden. */
export const page = { now: 1000, waiting: [] as FrameRequestCallback[], requests: 0, hidden: false };

Object.assign(globalThis, {
    requestAnimationFrame: (callback: FrameRequestCallback) => {
        page.requests++;
        return page.waiting.push(callback);
    },
});
Object.defineProperty(performance, 'now', { configurable: true, value: () => page.now });
Object.defineProperty(document, 'hidden', { configurable: true, get: () => page.hidden });

/** What was drawn on each OffscreenCanvas src made (the 1×1 dummy, glow sprites), in order. */
export const offscreens: CanvasRecorder[] = [];

Object.assign(globalThis, {
    OffscreenCanvas: class {
        constructor(readonly width = 1, readonly height = 1) {}

        getContext() {
            const recorder = new CanvasRecorder(this.width, this.height);
            offscreens.push(recorder);
            return recorder.ctx;
        }
    },
});

export interface GraphSpec {
    /** A ghost node is one being placed (1.57); shape is a RenderShape, ROUND unless given; an output node's class is one (nodeData.output_node). */
    nodes: { pos: Point; size?: Point; title?: string; collapsed?: boolean; ghost?: boolean; mode?: number; shape?: number; output?: boolean }[];
    /**
     * `from` and `to` index `nodes`; each link takes the next input of its target. Reroutes are positions from
     * the output on; a floating link is what is left of one whose input was disconnected: the output and its reroutes.
     * A flashing link is an event link triggered within the last second.
     */
    links?: { from: number; to: number; type?: string; reroutes?: Point[]; floating?: boolean; flash?: boolean }[];
}

class Reroute {
    cos = 0;
    sin = 0;
    controlPoint: Point = [0, 0];
    _pos: Point = [0, 0];
    _centreAngle?: number;
    path?: Path2D;
    _colour?: string;

    /** parentId is the reroute before it, on the output side (FE157 Reroute.ts L94-103). */
    constructor(readonly id: number, readonly pos: Point, readonly parentId?: number) {}

    get colour(): string {
        return this._colour ?? '#18184d';
    }

    /** Reroute.calculateAngle (FE157 Reroute.ts L502-568, FE1395 L483-551), with this one link's direction as the average of its links'. */
    aim(previous: Point, next: Point): void {
        const angle = Math.atan2(next[1] - previous[1], next[0] - previous[0]);
        const dist = Math.min(80, Math.hypot(this.pos[0] - previous[0], this.pos[1] - previous[1]) * 0.25);
        [this.cos, this.sin] = [Math.cos(angle), Math.sin(angle)];
        this.controlPoint = [dist * -this.cos, dist * -this.sin];
    }

    /** Reroute.draw (FE157 Reroute.ts L576-617, FE1395 L559-600). */
    draw(ctx: CanvasRenderingContext2D, _backgroundPattern?: CanvasPattern): void {
        ctx.beginPath();
        ctx.arc(this.pos[0], this.pos[1], 10, 0, 2 * Math.PI);
        ctx.fillStyle = this.colour;
        ctx.fill();
    }

    /** Reroute.drawSlots (FE157 Reroute.ts L623-626, FE1395 L606-609): the slot rings show while hovered. */
    drawSlots(_ctx: CanvasRenderingContext2D): void {}
}

interface Link {
    id: number;
    origin_id: number;
    origin_slot: number;
    target_id: number;
    target_slot: number;
    type: string;
    color?: string;
    reroutes: Reroute[];
    /** The last of its reroutes, the one its segment into the input starts from (FE157 LLink.ts L319-325). */
    parentId?: number;
    _pos: Point;
    _centreAngle?: number;
    path?: Path2D;
    _last_time?: number;
    /** Set on a link whose end is being dragged, and on a floating link (FE157 L6295, FE1395 L5847). */
    _dragging?: boolean;
}

interface StrokeStyle {
    padding?: number;
    color?: string;
    lineWidth?: number;
}

/** LGraphButton (FE157 LGraphButton.ts L19-30): an icon on the title bar, as wide as its text in its own font. */
interface TitleButton {
    visible: boolean;
    getWidth(ctx: CanvasRenderingContext2D): number;
}

/** truncateText (FE157 utils/textUtils.ts L11-49). */
function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    const width = (part: string) => ctx.measureText(part).width;
    if (width(text) <= maxWidth || maxWidth <= 0) return text;
    const available = maxWidth - width('...');
    if (available <= 0) return '...';
    let [low, high, bestFit] = [0, text.length, 0];
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (width(text.substring(0, mid)) <= available) [bestFit, low] = [mid, mid + 1];
        else high = mid - 1;
    }
    return `${text.substring(0, bestFit)}...`;
}

export class FakeNode {
    title: string;
    pos: Point;
    size: Point;
    flags: { collapsed?: boolean; ghost?: boolean; pinned?: boolean };
    mode: number;
    shape?: number;
    title_mode = TitleMode.NORMAL_TITLE;
    title_buttons: TitleButton[] = [];
    properties: Record<string, unknown> = {};
    /** The graph that holds it (FE157 LGraphNode.ts L345), set when it is added. */
    graph: unknown = null;
    selected = false;
    mouseOver = false;
    inputs: { link: number | null; dir?: number }[] = [];
    outputs: { links: number[]; dir?: number }[] = [{ links: [] }];
    /** FE157 LGraphNode.ts L1156-1159, FE1395 L788-791: the selection outline (and an error one, never shown here). */
    strokeStyles: Record<string, (this: FakeNode) => StrokeStyle | undefined> = {
        selected() {
            return this.selected ? {} : undefined;
        },
    };
    onDrawTitleText?: (...args: unknown[]) => void;
    /** Where the node and its title bar are, and that with room for its shadow; updateArea() sets both each frame. */
    readonly boundingRect: number[] = [0, 0, 0, 0];
    readonly renderArea: number[] = [0, 0, 0, 0];

    constructor(readonly id: number, spec: GraphSpec['nodes'][number]) {
        this.title = spec.title ?? `Node ${id}`;
        this.pos = spec.pos;
        this.size = spec.size ?? [220, 120];
        this.flags = { collapsed: spec.collapsed, ghost: spec.ghost };
        this.mode = spec.mode ?? LGraphEventMode.ALWAYS;
        this.shape = spec.shape;
    }

    /** LGraphNode.renderingSize (FE157 LGraphNode.ts L858-871): a collapsed node is its title bar. */
    get renderingSize(): Point {
        return this.flags.collapsed ? [NODE_COLLAPSED_WIDTH, 0] : this.size;
    }

    /** LGraphNode.renderingBgColor (FE157 LGraphNode.ts L616-630, FE1395 L324-338): its body's colour, here the default's. */
    get renderingBgColor(): string {
        return '#353535';
    }

    /** FE157 LGraphNode.ts L3842-3844, FE1395 L3510-3512. */
    get pinned(): boolean {
        return !!this.flags.pinned;
    }

    /** LGraphNode.renderingShape (FE157 LGraphNode.ts L888-894, FE1395 L547-549): ROUND is LiteGraph.NODE_DEFAULT_SHAPE. */
    get renderingShape(): number {
        return this.shape || RenderShape.ROUND;
    }

    /** LGraphNode.updateArea and measure (FE157 LGraphNode.ts L2426-2490, FE1395 L2036-2099), with a collapsed node NODE_COLLAPSED_WIDTH wide. */
    updateArea(): void {
        const [width, height] = this.flags.collapsed ? [NODE_COLLAPSED_WIDTH, NODE_TITLE_HEIGHT] : [this.size[0], this.size[1] + NODE_TITLE_HEIGHT];
        this.boundingRect.splice(0, 4, this.pos[0], this.pos[1] - NODE_TITLE_HEIGHT, width, height);
        this.renderArea.splice(0, 4, this.pos[0] - 4, this.pos[1] - NODE_TITLE_HEIGHT - 4, width + 10, height + 9);
    }

    /** LGraphNode.getConnectionPos (FE157 LGraphNode.ts L3599-3650, FE1395 L3289-3338): a collapsed node's slots sit at the ends of its title bar. */
    getConnectionPos(isInput: boolean, slot: number, out: Point = [0, 0]): Point {
        const [x, y] = this.pos;
        if (this.flags.collapsed) {
            out[0] = isInput ? x : x + this.renderingSize[0];
            out[1] = y - NODE_TITLE_HEIGHT * 0.5;
            return out;
        }
        out[0] = isInput ? x + NODE_SLOT_HEIGHT * 0.5 : x + this.size[0] + 1 - NODE_SLOT_HEIGHT * 0.5;
        out[1] = y + (slot + 0.7) * NODE_SLOT_HEIGHT;
        return out;
    }

    getInputPos(slot: number): Point {
        return this.getConnectionPos(true, slot);
    }

    getOutputPos(slot: number): Point {
        return this.getConnectionPos(false, slot);
    }

    /** LGraphNode.drawTitleText (FE157 LGraphNode.ts L4039-4115, FE1395 L3707-3783): the title with its pin, cut to fit, in titleFontStyle. */
    drawTitleText(ctx: CanvasRenderingContext2D, { default_title_color, low_quality = false }: { scale: number; default_title_color: string; low_quality?: boolean }): void {
        if (this.onDrawTitleText) {
            this.onDrawTitleText(ctx, NODE_TITLE_HEIGHT, this.renderingSize);
            return;
        }
        if (low_quality) return;
        ctx.font = `14px ${NODE_FONT}`;
        const title = this.title + (this.pinned ? '📌' : '');
        ctx.fillStyle = this.selected ? '#FFF' : default_title_color;
        let availableWidth = this.renderingSize[0] - NODE_TITLE_HEIGHT * 2;
        let buttonsWidth = 0;
        for (const button of this.title_buttons) if (button.visible) buttonsWidth += button.getWidth(ctx) + 2;
        if (buttonsWidth > 0) availableWidth -= buttonsWidth - 20;
        const displayTitle = this.flags.collapsed ? title.substr(0, 20) : availableWidth > 0 ? truncateText(ctx, title, availableWidth) : title;
        ctx.textAlign = 'left';
        ctx.fillText(displayTitle, NODE_TITLE_HEIGHT, NODE_TITLE_TEXT_Y - NODE_TITLE_HEIGHT);
    }
}

/** strokeShape (FE157 draw.ts L69-148, FE1395 L68-147) for a box: `padding` out from the area at alpha 0.8, after which callers find alpha 1. */
function strokeShape(ctx: CanvasRenderingContext2D, [x, y, w, h]: number[], { padding = 6, color = '#FFF', lineWidth: thickness = 1 }: StrokeStyle): void {
    const { lineWidth, strokeStyle } = ctx;
    ctx.lineWidth = thickness;
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.rect(x - padding, y - padding, w + 2 * padding, h + 2 * padding);
    ctx.stroke();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
    ctx.globalAlpha = 1;
}

class Graph {
    _nodes: FakeNode[] = [];
    _nodes_by_id: Record<number, FakeNode> = {};
    /** By id, which v2's drawConnections walks with for...in; FE157's links map takes such indexes too. */
    links: Record<number, Link> = {};
    floatingLinks = new Map<number, Link>();
    reroutes = new Map<number, Reroute>();
    config = { links_ontop: false };

    get nodes(): FakeNode[] {
        return this._nodes;
    }

    /** FE157 LGraph.ts L1979-1983. */
    getReroute(id: number | undefined): Reroute | undefined {
        return id == null ? undefined : this.reroutes.get(id);
    }

    constructor(spec: GraphSpec, Node: typeof FakeNode) {
        const Output = class extends Node {
            static nodeData = { output_node: true };
        };
        spec.nodes.forEach((n, i) => {
            const node = new (n.output ? Output : Node)(i + 1, n);
            node.graph = this;
            this._nodes.push(node);
            this._nodes_by_id[node.id] = node;
        });
        let reroutes = 0;
        spec.links?.forEach((l, i) => {
            const [origin, target] = [this._nodes[l.from], this._nodes[l.to]];
            const chain: Reroute[] = [];
            for (const pos of l.reroutes ?? []) chain.push(new Reroute(++reroutes, pos, chain.at(-1)?.id));
            for (const reroute of chain) this.reroutes.set(reroute.id, reroute);
            const link: Link = {
                id: i + 1,
                origin_id: origin.id,
                origin_slot: 0,
                target_id: target.id,
                target_slot: target.inputs.length,
                type: l.type ?? 'INT',
                reroutes: chain,
                parentId: chain.at(-1)?.id,
                _pos: [0, 0],
                _last_time: l.flash ? page.now : undefined,
            };
            const points = [origin.getOutputPos(0), ...link.reroutes.map((r) => r.pos), target.getInputPos(link.target_slot)];
            link.reroutes.forEach((r, j) => r.aim(points[j], points[j + 2]));
            if (l.floating) {
                this.floatingLinks.set(link.id, link);
                return;
            }
            this.links[link.id] = link;
            target.inputs.push({ link: link.id });
            origin.outputs[0].links.push(link.id);
        });
    }
}

const overlaps = (a: ArrayLike<number>, b: ArrayLike<number>) =>
    a[0] <= b[0] + b[2] && a[0] + a[2] >= b[0] && a[1] <= b[1] + b[3] && a[1] + a[3] >= b[1];

interface LinkExtras {
    startControl?: Point;
    endControl?: Point;
    reroute?: Reroute;
    num_sublines?: number;
    disabled?: boolean;
}

/**
 * LitegraphLinkAdapter.renderLinkDirect (litegraphLinkAdapter.ts L198-323), here with the canvas as its render context: strokes
 * the segment in its native colour (pathRenderer.ts L168-183: white when highlighted, else the colour argument, the type's
 * colour or the default; L226-235 leave out link.color) and keeps its centre on the reroute or link (L306-323). Splines take
 * the given controls, else a quarter of the length along each direction (L172-192, L241-295).
 */
function renderLinkDirect(ctx: CanvasRenderingContext2D, a: Readonly<Point>, b: Readonly<Point>, link: Link | null, _skipBorder: boolean,
    _flow: number | null, color: string | null, startDir: number, endDir: number, canvas: FakeCanvas, { startControl, endControl, reroute }: LinkExtras = {}): void {
    const dist = Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.25;
    const offset = (dir: number): Point => [dir === LinkDirection.LEFT ? -dist : dir === LinkDirection.RIGHT ? dist : 0,
        dir === LinkDirection.UP ? -dist : dir === LinkDirection.DOWN ? dist : 0];
    const [c1x, c1y] = startControl ?? offset(startDir);
    const [c2x, c2y] = endControl ?? offset(endDir);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.bezierCurveTo(a[0] + c1x, a[1] + c1y, b[0] + c2x, b[1] + c2y, b[0], b[1]);
    ctx.strokeStyle = (link && canvas.highlighted_links[link.id] && '#FFF') || color ||
        (link && (canvas.constructor as typeof FakeCanvas & { link_type_colors: Record<string, string> }).link_type_colors[link.type]) || canvas.default_link_color;
    ctx.stroke();
    const owner = reroute ?? link;
    if (owner) owner._pos = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export class FakeCanvas {
    default_link_color = '#9A9';
    /** FE157 links_render_mode (L1293), linkMarkerShape (L811), highquality_render (L1250); FE1395 L952, L579, L909. */
    links_render_mode = 2;
    linkMarkerShape = 1;
    highquality_render = true;
    /** FE1395 keeps this dict (L666); FE157 derives it from the selection (L919-922). */
    highlighted_links: Record<number, boolean> = {};
    /** The reroutes the last drawConnections drew (FE157 L970, FE1395 L668). */
    _visibleReroutes = new Set<Reroute>();
    _pattern?: CanvasPattern;
    pointer = { isDown: false };
    /** Whether nodes or other items are being dragged (FE157 L625-627, FE1395 L404-406). */
    isDragging = false;
    ds = {
        scale: 1,
        offset: [0, 0] as Point,
        // DragAndScale.toCanvasContext (FE157 DragAndScale.ts L151-154, FE1395 L123).
        toCanvasContext(ctx: CanvasRenderingContext2D) {
            ctx.scale(this.scale, this.scale);
            ctx.translate(this.offset[0], this.offset[1]);
        },
    };
    visible_area = new Float32Array(4);
    visible_nodes: FakeNode[] = [];
    /** What is selected: nodes, groups and reroutes (FE157 L895-897, FE1395 L652). */
    selectedItems = new Set<unknown>();
    renderedPaths = new Set<Link | Reroute>();
    /** FE157 L1050, L1152, FE1395 L733, L813: tests spy on its renderLinkDirect to see what native drew. */
    readonly linkRenderer = { renderLinkDirect };
    dirty_canvas = true;
    dirty_bgcanvas = true;
    low_quality = false;
    /** FE157 L1282, FE1395 L941. */
    render_shadows = true;
    editor_alpha = 1;
    node_title_color = '#999';
    front = new CanvasRecorder();
    back = new CanvasRecorder();
    canvas = this.front.ctx.canvas;
    ctx = this.front.ctx;
    bgctx = this.back.ctx;
    /** Each native step a frame took, in order, with the hooks it called. */
    calls: string[] = [];
    onRender?: (canvas: unknown, ctx: CanvasRenderingContext2D) => void;
    onDrawForeground?: (ctx: CanvasRenderingContext2D, visibleArea: Float32Array) => void;
    /** Where KJNodes draws its Set/Get links. */
    onDrawBackground?: (ctx: CanvasRenderingContext2D, visibleArea: Float32Array) => void;

    constructor(readonly graph: Graph) {}

    /** FE157 L4334-4345, FE1395 L3873-3884: the change tracker's before-change and after-change events, here a step each in calls. */
    emitBeforeChange(): void {
        this.calls.push('emitBeforeChange');
    }

    emitAfterChange(): void {
        this.calls.push('emitAfterChange');
    }

    /** FE157 L2364-2367, FE1395 L2032-2035. */
    setDirty(fgcanvas: boolean, bgcanvas?: boolean): void {
        if (fgcanvas) this.dirty_canvas = true;
        if (bgcanvas) this.dirty_bgcanvas = true;
    }

    /** FE157 L4986-5066, FE1395 L4698-4739: the visible area and nodes, the background pass if it is dirty, then the front pass. */
    draw(force_canvas?: boolean, force_bgcanvas?: boolean): void {
        // DragAndScale.computeVisibleArea (FE157 DragAndScale.ts L100-122).
        const { scale, offset } = this.ds;
        this.visible_area.set([-offset[0], -offset[1], this.canvas.width / scale, this.canvas.height / scale]);
        // computeVisibleNodes (FE157 L4958-4972, FE1395 L4670-4684).
        if (this.dirty_canvas || force_canvas) {
            this.visible_nodes = this.graph._nodes.filter((n) => {
                n.updateArea();
                return overlaps(n.renderArea, this.visible_area);
            });
        }
        if (this.dirty_bgcanvas || force_bgcanvas) this.drawBackCanvas();
        if (this.dirty_canvas || force_canvas) this.drawFrontCanvas();
    }

    /** FE157 L5493-5643, FE1395 L5117-5263. FE157 clears the dirty flag first, FE1395 last. */
    drawBackCanvas(): void {
        this.calls.push('drawBackCanvas');
        const ctx = this.bgctx;
        this.dirty_bgcanvas = false;
        ctx.save();
        this.ds.toCanvasContext(ctx);
        // FE157 L5613, FE1395 L5231.
        this.onDrawBackground?.(ctx, this.visible_area);
        // FE157 L5634 hands it the frame's nodes and graph; FE1395 L5252 only the context.
        this.drawConnections(ctx, this.graph._nodes, this.graph);
        ctx.restore();
        this.dirty_canvas = true;
    }

    /** FE157 L5071-5212, FE1395 L4744-4927. */
    drawFrontCanvas(): void {
        this.calls.push('drawFrontCanvas');
        this.dirty_canvas = false;
        const { ctx } = this;
        ctx.drawImage(this.back.ctx.canvas as unknown as CanvasImageSource, 0, 0);
        // Screen space, between the background and the nodes (FE157 L5131, FE1395 L4794).
        this.calls.push('onRender');
        this.onRender?.(this.canvas, ctx);
        ctx.save();
        this.ds.toCanvasContext(ctx);
        for (const node of this.visible_nodes) {
            ctx.save();
            ctx.translate(node.pos[0], node.pos[1]);
            this.drawNode(node, ctx);
            ctx.restore();
        }
        // FE157 L5191-5194, FE1395 L4843-4845.
        if (this.graph.config.links_ontop) this.drawConnections(ctx, this.graph._nodes, this.graph);
        // Graph space, over the nodes (FE157 L5204, FE1395 L4919).
        this.calls.push('onDrawForeground');
        this.onDrawForeground?.(ctx, this.visible_area);
        ctx.restore();
    }

    /** FE157 L6022-6232, FE1395 L5638-5787: links into each node's inputs, then floating links, then the reroutes. */
    drawConnections(ctx: CanvasRenderingContext2D, nodesInFrameOrder?: FakeNode[], nodesGraph: Graph = this.graph): void {
        this.calls.push('drawConnections');
        this.renderedPaths.clear();
        // The Hidden render mode (FE157 L6029, FE1395 L5640).
        if (this.links_render_mode === -1) return;
        const { graph } = this;
        const reroutes: Reroute[] = [];
        ctx.globalAlpha = this.editor_alpha;
        // FE157 L6050-6053: the nodes it was handed when they are the canvas graph's.
        for (const node of (graph === nodesGraph && nodesInFrameOrder) || graph._nodes) {
            node.inputs.forEach((input, slot) => {
                const link = input.link === null ? undefined : graph.links[input.link];
                if (!link) return;
                const origin = graph._nodes_by_id[link.origin_id];
                this.renderSegments(ctx, link, origin.getOutputPos(link.origin_slot), node.getInputPos(slot), reroutes, origin.outputs[link.origin_slot].dir, input.dir);
            });
        }
        // FE157 L6243-6311, FE1395 L5797-5862: a third of the alpha, the output-side case (the input was disconnected).
        const { globalAlpha } = ctx;
        ctx.globalAlpha = globalAlpha * 0.33;
        for (const link of graph.floatingLinks.values()) {
            const origin = graph._nodes_by_id[link.origin_id];
            link._dragging = true;
            this.renderSegments(ctx, link, origin.getOutputPos(link.origin_slot), link.reroutes[link.reroutes.length - 1].pos, reroutes,
                origin.outputs[link.origin_slot].dir, LinkDirection.CENTER, true);
        }
        ctx.globalAlpha = globalAlpha;
        // FE157 L6186-6205, FE1395 L5766-5785.
        this._visibleReroutes.clear();
        for (const reroute of reroutes) {
            this._visibleReroutes.add(reroute);
            reroute.draw(ctx, this._pattern);
            if (!this.pointer.isDown) reroute.drawSlots(ctx);
        }
        ctx.globalAlpha = 1;
    }

    /**
     * _renderAllLinkSegments (FE157 L6313-6464, FE1395 L5864-6010): one renderLink per segment, through each reroute. A
     * reroute's segment is drawn once a pass, for the first link through it, so links that share reroutes share those segments.
     */
    private renderSegments(ctx: CanvasRenderingContext2D, link: Link, start: Point, end: Point, reroutes: Reroute[],
        startDirection?: number, endDirection?: number, disabled = false): void {
        const startDir = startDirection || LinkDirection.RIGHT;
        const endDir = endDirection || LinkDirection.LEFT;
        let from = start;
        let startControl: Point | undefined;
        link.reroutes.forEach((reroute, j) => {
            if (!this.renderedPaths.has(reroute)) {
                this.renderedPaths.add(reroute);
                reroutes.push(reroute);
                // FE157 L6365-6368, FE1395 L5912-5915.
                reroute._colour = link.color || (this.constructor as typeof FakeCanvas & { link_type_colors: Record<string, string> }).link_type_colors[link.type] || this.default_link_color;
                this.renderLink(ctx, from, reroute.pos, link, false, 0, null, startControl ? LinkDirection.CENTER : startDir, LinkDirection.CENTER,
                    { startControl, endControl: reroute.controlPoint, reroute, disabled });
            }
            const next = link.reroutes[j + 1]?.pos ?? end;
            const dist = Math.min(80, Math.hypot(next[0] - reroute.pos[0], next[1] - reroute.pos[1]) * 0.25);
            startControl = [dist * reroute.cos, dist * reroute.sin];
            from = reroute.pos;
        });
        // The last segment, unless its end is being dragged: a floating link ends at its last reroute (FE157 L6411-6444, FE1395 L5957-5990).
        if (link.reroutes.length) {
            if (link._dragging) return;
            this.renderLink(ctx, from, end, link, false, 0, null, LinkDirection.CENTER, endDir, { startControl, disabled });
        } else if (!link._dragging) {
            this.renderLink(ctx, start, end, link, false, 0, null, startDir, endDir);
        }
        this.renderedPaths.add(link);
        // A triggered event link flashes over itself for a second (FE157 L6446-6463, FE1395 L5992-6009).
        if (link._last_time !== undefined && page.now - link._last_time < 1000) {
            const f = 2 - (page.now - link._last_time) * 0.002;
            this.renderLink(ctx, start, end, link, true, f, 'white', startDir, endDir);
        }
    }

    /** FE157 L6506-6557, FE1395 L6052-6103: the frontend's own renderLink hands each segment to its link adapter. */
    renderLink(ctx: CanvasRenderingContext2D, a: Readonly<Point>, b: Readonly<Point>, link: Link | null, skipBorder: boolean, flow: number | null,
        color: string | null, startDir: number, endDir: number, { startControl, endControl, reroute, num_sublines = 1, disabled = false }: LinkExtras = {}): void {
        this.calls.push('renderLink');
        this.linkRenderer.renderLinkDirect(ctx, a, b, link, skipBorder, flow, color, startDir, endDir, this, { reroute, startControl, endControl, num_sublines, disabled });
    }

    /** FE157 L5648-5778, FE1395 L5268-5392: the node at its mode's alpha with a shadow, its shape, then its slots and widgets. */
    drawNode(node: FakeNode, ctx: CanvasRenderingContext2D): void {
        this.calls.push('drawNode');
        // FE157 L5654-5662, FE1395 L5274-5282: in Vue mode the DOM draws the node.
        if ((globalThis as unknown as { LiteGraph: { vueNodesMode: boolean } }).LiteGraph.vueNodesMode) return;
        // getNodeModeAlpha (FE157 L6234-6241, FE1395 L5789-5795; ghost nodes are 1.57's).
        ctx.globalAlpha = node.flags.ghost ? 0.3 : node.mode === LGraphEventMode.BYPASS ? 0.2 : node.mode === LGraphEventMode.NEVER ? 0.4 : this.editor_alpha;
        // FE157 L5669-5677, FE1395 L5289-5297: LiteGraph.DEFAULT_SHADOW_COLOR.
        if (this.render_shadows && !this.low_quality) {
            ctx.shadowColor = 'rgba(0,0,0,0.5)';
            ctx.shadowOffsetX = 2 * this.ds.scale;
            ctx.shadowOffsetY = 2 * this.ds.scale;
            ctx.shadowBlur = 3 * this.ds.scale;
        } else {
            ctx.shadowColor = 'transparent';
        }
        const size: Point = [node.renderingSize[0], node.renderingSize[1]];
        this.drawNodeShape(node, ctx, size, '#333', node.renderingBgColor, node.selected);
        ctx.shadowColor = 'transparent';
        // The slots and widgets (FE157 L5755-5768, FE1395 L5367-5382), here a widget's box.
        if (!node.flags.collapsed) {
            this.calls.push('drawWidgets');
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#222';
            ctx.fillRect(10, 10, node.size[0] - 20, 20);
        }
        ctx.globalAlpha = 1;
    }

    /** FE157 L5854-5964, FE1395 L5474-5584: the body in its shape, the title text at the alpha it started with, then the stroke styles. */
    drawNodeShape(node: FakeNode, ctx: CanvasRenderingContext2D, size: Point, fgcolor: string, bgcolor: string, _selected: boolean): void {
        this.calls.push('drawNodeShape');
        ctx.strokeStyle = fgcolor;
        ctx.fillStyle = bgcolor;
        const [x, y, w, h] = node.boundingRect;
        const area = [x - node.pos[0], y - node.pos[1], w, h];
        const oldAlpha = ctx.globalAlpha;
        const shape = node.renderingShape;
        ctx.beginPath();
        if (shape === RenderShape.BOX || this.low_quality) ctx.rect(area[0], area[1], area[2], area[3]);
        else if (shape === RenderShape.ROUND || shape === RenderShape.CARD) {
            ctx.roundRect(area[0], area[1], area[2], area[3], shape === RenderShape.CARD ? [ROUND_RADIUS, ROUND_RADIUS, 0, 0] : [ROUND_RADIUS]);
        } else if (shape === RenderShape.CIRCLE) ctx.arc(size[0] * 0.5, size[1] * 0.5, size[0] * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.globalAlpha = oldAlpha;
        // FE157 L5917, FE1395 L5537: no title for a node without a title bar.
        if (node.title_mode !== TitleMode.NO_TITLE) {
            this.calls.push('drawTitleText');
            node.drawTitleText(ctx, { scale: this.ds.scale, default_title_color: this.node_title_color, low_quality: this.low_quality });
        }
        for (const getStyle of Object.values(node.strokeStyles)) {
            const style = getStyle.call(node);
            if (style) strokeShape(ctx, area, style);
        }
    }
}

/** Runs `count` browser frames at `hz`: the requestAnimationFrame callbacks, then LiteGraph's own, which draws (FE157 L2417-2443, FE1395 L2067-2093). */
export function frames(count: number, hz = 60): void {
    for (let i = 0; i < count; i++) {
        page.now += 1000 / hz;
        const due = page.waiting;
        page.waiting = [];
        for (const callback of due) callback(page.now);
        (app.canvas as unknown as FakeCanvas).draw();
    }
}

/** Reports the queue as running or idle the way ComfyUI does, with a global 'status' event. */
export function queue(remaining: number): void {
    api.dispatchEvent(new CustomEvent('status', { detail: { exec_info: { queue_remaining: remaining } } }));
}

/**
 * A run of this client's, as ComfyUI tells the client that queued it (execution.py): it starts, takes the nodes `cached`
 * from the cache, runs the nodes `ran` in turn (the frontend's api.ts hands 'executing' on as the node's id), and succeeds.
 */
export function run(prompt: string, ran: number[], cached: number[] = []): void {
    const send = (type: string, detail: unknown) => api.dispatchEvent(new CustomEvent(type, { detail }));
    send('execution_start', { prompt_id: prompt, timestamp: 0 });
    send('execution_cached', { nodes: cached.map(String), prompt_id: prompt, timestamp: 0 });
    for (const id of ran) send('executing', String(id));
    send('executing', null);
    send('execution_success', { prompt_id: prompt, timestamp: 0 });
}

/**
 * A fresh page with exactly `settings` stored, and Look 'custom' unless they hold one: new LiteGraph globals, a canvas
 * over `spec` as app.canvas, then both extensions' setup(), as ComfyUI runs
 * them, and the graph loaded as a workflow. The page shows the canvas, motion is not reduced, the queue is idle and
 * no fireworks play.
 */
export async function start(settings: Record<string, unknown> = {}, spec: GraphSpec = { nodes: [] }): Promise<FakeCanvas> {
    // A ticker left running by the last test sees a hidden tab and stops.
    page.hidden = true;
    for (const callback of page.waiting.splice(0)) callback(page.now);
    page.hidden = false;
    if (fake.reducedMotion.matches) {
        fake.reducedMotion.matches = false;
        fake.reducedMotion.dispatchEvent(new Event('change'));
    }
    queue(0);
    // The first-run picker answered, so stored values draw as they are; the first-run overlay's tests store Look ''.
    resetFakeApp({ [LOOK]: 'custom', ...settings });
    // Nor fireworks: past the end of any show, which fireworks() and the next pass then clear.
    clock.burstTime += 3600;
    live.bursts = 0;

    const LGraphCanvas = class extends FakeCanvas {
        static link_type_colors: Record<string, string> = { '-1': '#A86', number: '#AAA', node: '#DCA' };
    };
    const LGraphNode = class extends FakeNode {};
    Object.assign(globalThis, { LiteGraph: { NODE_TITLE_HEIGHT, NODE_TITLE_TEXT_Y, NODE_FONT, ROUND_RADIUS, vueNodesMode: false }, LGraphCanvas, LGraphNode });
    const canvas = new LGraphCanvas(new Graph(spec, LGraphNode));
    Object.assign(app, { canvas });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    await import('@/extensions/link-animations');
    await import('@/extensions/node-animations');
    for (const name of ['enhanced.link.animations', 'enhanced.node.animations']) {
        await fake.extensions.find((e) => e.name === name)?.setup?.(app);
    }
    // The graph is a workflow loaded: every extension hears of each node made (FE157 services/litegraphService.ts L460,
    // FE1395 likewise) and then loaded (FE157 scripts/app.ts L1573, FE1395 L1299).
    for (const extension of fake.extensions) {
        for (const node of canvas.graph._nodes) {
            extension.nodeCreated?.(node, app);
            extension.loadedGraphNode?.(node, app);
        }
    }
    page.requests = 0;
    canvas.calls = [];
    return canvas;
}
