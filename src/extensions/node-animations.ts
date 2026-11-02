/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Node Animations Extension
 *
 * Registers the node settings, and draws the node effects (nodes/effects.ts),
 * v1's halo, the styled titles (nodes/text.ts) and the fireworks
 * (fx/bursts.ts) on LiteGraph's own node pass. The halo, and what an effect
 * draws around a node over it, go under every node, in onRender before the link
 * motion; what falls on the node goes over its body, from drawNodeShape, under
 * its slots and widgets.
 * The styled title takes the native title's place, over the effect. Effects
 * fade with the node's mode, as native draws the node; collapsed nodes, nodes
 * in Vue mode, and every node with Node effects off, get none. The node menu's Node FX and Completion FX set a
 * node's own effect and fireworks, which it keeps in its properties (ui/menus.ts); while node effects are on, the
 * selection toolbox has a button that steps the selected nodes through the effects.
 *
 * @module extensions/node-animations
 */

import type { ComfyExtension } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { api } from '/scripts/api.js';
import { N, nodeSettings } from '@/core/settings';
import { clock, dummy, guard, install, layers, live, wake } from '@/core/engine';
import { nodePalette } from '@/core/colors';
import { OVER, STILL_NODE, UNDER, drawNodeFx, holdsStill, reach as effectReach, type Part } from '@/nodes/effects';
import { drawTitle, titleOf } from '@/nodes/text';
import { drawBursts, fireworks } from '@/fx/bursts';
import { startSprites, stopSprites } from '@/fx/particles';
import { installPanel } from '@/sidebar/sidebar';
import { OWN_COMPLETION, SELECTION_FX, nodeMenu, ownStyle, particlesOnly as chosenParticlesOnly } from '@/ui/menus';

/** The guard's keys, which its toast names when it turns one off. */
const EFFECT = 'Node effect';
const PARTICLES = 'Node particles';
const TITLES = 'Animated titles';
const FIREWORKS = 'Fireworks';

type Canvas = InstanceType<typeof LGraphCanvas>;
type Node = InstanceType<typeof LGraphNode>;
type TitleOptions = Parameters<Node['drawTitleText']>[1];

/** RenderShape.ROUND, CIRCLE and CARD (litegraph types/globalEnums.ts); a node of any other shape is a box. */
const [ROUND, CIRCLE, CARD] = [2, 3, 4];
/** LGraphEventMode.NEVER (muted) and BYPASS. */
const [NEVER, BYPASS] = [2, 4];
/** TitleMode.NO_TITLE, for which drawNodeShape draws no title (FE157 LGraphCanvas.ts L5917, FE1395 L5537). */
const NO_TITLE = 1;

/** The style a node's effect takes: its own, else Animate. */
const styleWanted = (node: Node) => ownStyle(node) ?? N.animate;

/**
 * The effect a node shows: its style, 0 for the fireflies of a node with particles and no effect, or none. A node given
 * None shows nothing, and a collapsed one none.
 */
function styleOf(node: Node): number | undefined {
    if (!N.enabled || node.flags.collapsed) return undefined;
    const style = styleWanted(node);
    if (style > 0) return style;
    return ownStyle(node) === undefined && N.particleShow ? 0 : undefined;
}

/** Whether a node draws its style's particles alone: without an effect, and with its Particles only or Show base effect off. */
const particlesOnly = (node: Node, style: number): boolean => style === 0 || chosenParticlesOnly(node);

/** Whether a node draws more than its halo: its base effect or its particles. */
const draws = (only: boolean) => N.particleShow || !only;

/** The guard's key for what a node draws. */
const keyOf = (style: number) => (style ? EFFECT : PARTICLES);

/** The alpha native draws a node at: getNodeModeAlpha (FE157 LGraphCanvas.ts L6234-6241, FE1395 L5789-5795; 1.39.5 has no ghost nodes). */
function modeAlpha(canvas: Canvas, node: Node): number {
    if (node.flags.ghost) return 0.3;
    return node.mode === BYPASS ? 0.2 : node.mode === NEVER ? 0.4 : canvas.editor_alpha;
}

/** The corners of a round and a card body, which body() sets to ROUND_RADIUS as it uses them. */
const ROUND_CORNERS = [0];
const CARD_CORNERS = [0, 0, 0, 0];

/** Adds a node's body, title bar included, to the path as drawNodeShape fills it (FE157 LGraphCanvas.ts L5880-5904, FE1395 L5500-5524). */
function body(canvas: Canvas, ctx: CanvasRenderingContext2D, node: Node): void {
    const box = node.boundingRect;
    const left = box[0] - node.pos[0];
    const top = box[1] - node.pos[1];
    const shape: number = node.renderingShape;
    ROUND_CORNERS[0] = CARD_CORNERS[0] = CARD_CORNERS[1] = LiteGraph.ROUND_RADIUS;
    if (canvas.low_quality) ctx.rect(left, top, box[2], box[3]);
    else if (shape === ROUND || shape === CARD) ctx.roundRect(left, top, box[2], box[3], shape === CARD ? CARD_CORNERS : ROUND_CORNERS);
    else if (shape === CIRCLE) ctx.arc(node.size[0] / 2, node.size[1] / 2, node.size[0] / 2, 0, Math.PI * 2);
    else ctx.rect(left, top, box[2], box[3]);
}

/** The part of a node's effect a layer draws, filled for each node in turn. */
const part: Part = { sides: UNDER, x0: 0, y0: 0, x1: 0, y1: 0, round: 0 };

/** The part of a node's effect on `sides` of the shape body() traces. */
function partOf(canvas: Canvas, node: Node, sides: number): Part {
    const box = node.boundingRect;
    const shape: number = node.renderingShape;
    part.sides = sides;
    part.x0 = box[0] - node.pos[0];
    part.y0 = box[1] - node.pos[1];
    part.x1 = part.x0 + box[2];
    part.y1 = part.y0 + box[3];
    part.round = canvas.low_quality || (shape !== ROUND && shape !== CARD && shape !== CIRCLE) ? 0 : shape === CIRCLE ? -1 : LiteGraph.ROUND_RADIUS;
    return part;
}

/** Whether a node with effect `style` casts v1's halo: any with an effect, with Show base effect off too, as v1 lit them, but not in low quality, where native casts no shadow. */
const lit = (canvas: Canvas, style: number | undefined): style is number => style !== undefined && style > 0 && N.glowShow && !canvas.low_quality && !guard.off(keyOf(style));

/**
 * v1's halo (old_node_animations.js:2066-2075), the shadow native's body fill casts (FE157 LGraphCanvas.ts L5669-5674,
 * FE1395 L5289-5294) in the effect's primary colour and 10 × Glow soft, at the node's alpha. It is cast here, before
 * the node's effect, which v1 drew over it: the body is filled off to the right of anything on screen, `shift` px on the
 * canvas, with its shadow offset back onto the node, so that only the shadow lands. The body then casts none.
 */
function halo(canvas: Canvas, ctx: CanvasRenderingContext2D, node: Node, style: number, scale: number): void {
    // A whole number of canvas px, so the shadow lands on the pixels native's would.
    const shift = Math.ceil((canvas.visible_area[2] + node.boundingRect[2]) * scale) + 64;
    ctx.translate(shift / scale, 0);
    ctx.beginPath();
    body(canvas, ctx, node);
    ctx.translate(-shift / scale, 0);
    ctx.fillStyle = node.renderingBgColor;
    ctx.shadowColor = nodePalette(style).primary;
    ctx.shadowBlur = 10 * N.glow;
    ctx.shadowOffsetX = 2 * canvas.ds.scale - shift;
    ctx.shadowOffsetY = 2 * canvas.ds.scale;
    ctx.globalAlpha = modeAlpha(canvas, node);
    ctx.fill();
}

/** Whether `box` grown by `margin` on each side overlaps `area`. */
const overlaps = (box: ArrayLike<number>, area: ArrayLike<number>, margin: number) =>
    box[0] - margin <= area[0] + area[2] && box[0] + box[2] + margin >= area[0] && box[1] - margin <= area[1] + area[3] && box[1] + box[3] + margin >= area[1];

/**
 * The under-layer, before the link motion and every node: each node's halo, and what its effect draws around its body.
 * It takes the nodes whose box, grown by their effect's reach, is on screen, and counts what moves.
 */
function under(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    const { graph } = canvas;
    // In Vue mode the DOM draws the nodes and none of the node hooks run; Nodes 2.0 comes with M8.
    if (!graph || LiteGraph.vueNodesMode) return;
    const moving = !holdsStill();
    const titles = N.enabled && N.textAnimationEnabled && moving && !canvas.low_quality && !guard.off(TITLES);
    const area = canvas.visible_area;
    // Canvas px to a graph unit: the canvas is only scaled and moved.
    const scale = ctx.getTransform().a;
    for (const node of graph.nodes) {
        const style = styleOf(node);
        const only = style !== undefined && particlesOnly(node, style);
        const shown = style !== undefined && draws(only) && !guard.off(keyOf(style));
        const glows = lit(canvas, style);
        const reach = shown ? effectReach(style, node.size[0], node.size[1], only) : 0;
        if (!overlaps(node.renderArea, area, Math.max(0, reach))) continue;
        // Where drawTitleText draws the styled title: not for a node that draws its own, nor one without a title bar.
        if (titles && node.title && !node.onDrawTitleText && node.title_mode !== NO_TITLE) live.nodes++;
        if (shown && moving) {
            if (style) live.nodes++;
            if (N.particleShow) live.particles++;
        }
        if (!glows && (!shown || reach <= 0)) continue;
        ctx.save();
        try {
            ctx.translate(node.pos[0], node.pos[1]);
            if (glows) halo(canvas, ctx, node, style, scale);
            if (shown && reach > 0) {
                // Around the body only: the over-layer draws what falls on it.
                ctx.beginPath();
                ctx.rect(area[0] - node.pos[0], area[1] - node.pos[1], area[2], area[3]);
                body(canvas, ctx, node);
                ctx.clip('evenodd');
                drawNodeFx(ctx, style, node, node.size[0], node.size[1], clock, partOf(canvas, node, UNDER), modeAlpha(canvas, node), only);
            }
        } catch (error) {
            guard.fail(keyOf(style), error);
        } finally {
            ctx.restore();
        }
    }
    if (live.nodes || live.particles) wake();
}

/**
 * Draws a node's styled title where native draws its title: left-aligned after the title box, on the title bar's
 * middle, where native's alphabetic baseline at NODE_TITLE_TEXT_Y - NODE_TITLE_HEIGHT puts its 14 px text (FE157
 * LGraphNode.ts L4108-4113), at the alpha native draws the node at. False if it failed.
 */
function styledTitle(canvas: Canvas, ctx: CanvasRenderingContext2D, node: Node): boolean {
    ctx.save();
    try {
        const height = LiteGraph.NODE_TITLE_HEIGHT;
        const phase = (holdsStill() ? STILL_NODE : clock).nodePhase;
        drawTitle(ctx, titleOf(ctx, node), height, -height / 2, nodePalette(styleWanted(node)).title, phase, modeAlpha(canvas, node));
        return true;
    } catch (error) {
        guard.fail(TITLES, error);
        return false;
    } finally {
        ctx.restore();
    }
}

/** The node whose shape the drawNodeShape wrapper is drawing, and the options native's title had, once it went to the dummy for the styled one. */
let shaping: Node | undefined;
let titled: TitleOptions | undefined;

/**
 * The nodes this client's run reached, by id: the ones it ran and the ones it took from the cache; and the graph on
 * screen as the run started, whose ids those are.
 */
const reached = new Set<string>();
let ranOn: unknown;

/** Whether a node's run ends with fireworks: as its Completion FX says, else if it is an output node the run reached, with End Animation on. */
function celebrates(node: Node): boolean {
    const own = node.properties[OWN_COMPLETION];
    if (own === 'fireworks') return true;
    if (own === 'off') return false;
    return N.endAnimationEnabled && reached.has(String(node.id)) && Boolean((node.constructor as typeof LGraphNode).nodeData?.output_node);
}

// =============================================================================
// Extension
// =============================================================================

const ext: ComfyExtension = {
    name: 'enhanced.node.animations',
    settings: nodeSettings,

    async setup() {
        install();
        installPanel('nodes');
        layers.nodes = under;
        layers.bursts = (canvas, ctx) => {
            if (!live.bursts) return;
            startSprites(ctx);
            try {
                drawBursts(canvas, ctx);
            } catch (error) {
                guard.fail(FIREWORKS, error);
            } finally {
                stopSprites();
            }
        };

        const { drawNodeShape } = LGraphCanvas.prototype;
        const { drawTitleText } = LGraphNode.prototype;

        // The node's body, which casts no shadow where the under-layer cast its halo in native's stead. Then the over-layer:
        // what the effect draws on the body, clipped to it, under the slots and widgets; the under-layer drew the rest.
        // Then the styled title, over the effect as v1 drew it (old_node_animations.js:2116-2121).
        LGraphCanvas.prototype.drawNodeShape = function (this: Canvas, ...args: Parameters<Canvas['drawNodeShape']>) {
            const [node, ctx, size] = args;
            const style = styleOf(node);
            const fx = style !== undefined && !guard.off(keyOf(style));
            if (lit(this, style)) ctx.shadowColor = 'transparent';
            shaping = node;
            titled = undefined;
            try {
                drawNodeShape.apply(this, args);
            } finally {
                shaping = undefined;
            }
            const only = fx && particlesOnly(node, style);
            if (fx && draws(only)) {
                ctx.save();
                try {
                    ctx.beginPath();
                    body(this, ctx, node);
                    ctx.clip();
                    drawNodeFx(ctx, style, node, size[0], size[1], clock, partOf(this, node, OVER), modeAlpha(this, node), only);
                } catch (error) {
                    guard.fail(keyOf(style), error);
                } finally {
                    ctx.restore();
                }
            }
            // Native drew its title on the dummy; if ours fails, native's is drawn after all.
            if (titled && !styledTitle(this, ctx, node)) drawTitleText.call(node, ctx, titled);
        };

        // With Animated titles on, the styled title in place of the native one.
        LGraphNode.prototype.drawTitleText = function (this: Node, ...args: Parameters<Node['drawTitleText']>) {
            // Left to native: a node that draws its own title, an untitled one (v2 styled only titles), and low quality, which draws none.
            if (!N.enabled || !N.textAnimationEnabled || !this.title || this.onDrawTitleText || args[1].low_quality || guard.off(TITLES)) return drawTitleText.apply(this, args);
            // Drawn after the node's effect by the drawNodeShape wrapper, or at once by a drawNodeShape that replaced it.
            if (shaping === this) titled = args[1];
            else if (!styledTitle(app.canvas, args[0], this)) return drawTitleText.apply(this, args);
            // Native still draws its title, where nobody sees it, so other wrappers get their call.
            args[0] = dummy();
            return drawTitleText.apply(this, args);
        };

        // Fireworks over the output nodes this client's run reached, once it succeeds; the execution events come only to the client that queued it.
        api.addEventListener('execution_start', () => {
            reached.clear();
            ranOn = app.canvas?.graph;
        });
        api.addEventListener('executing', ({ detail }) => {
            if (detail != null) reached.add(String(detail));
        });
        api.addEventListener('execution_cached', ({ detail }) => {
            for (const id of detail.nodes) reached.add(String(id));
        });
        // Not over another workflow's nodes, or a subgraph's, that have the same ids.
        api.addEventListener('execution_success', ({ detail }) => {
            const graph = app.canvas?.graph;
            if (N.enabled && graph && graph === ranOn && !guard.off(FIREWORKS)) fireworks(graph.nodes.filter(celebrates), detail.prompt_id);
        });

        console.log('[EnhancedNodes] Extension registered with full animation pipeline.');
    },

    getNodeMenuItems: nodeMenu,

    // Per selected item; the toolbox shows each command once (FE157 components/graph/SelectionToolbox.vue L86-99).
    getSelectionToolboxCommands: (item) => (item instanceof LGraphNode && N.enabled ? [SELECTION_FX] : []),
};

app.registerExtension(ext);
