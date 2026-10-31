/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Node Animations Extension
 *
 * Registers the node settings, and draws v2's node effects (Gentle Pulse, Neon
 * Nexus, Cosmic Ripple, Flower of Life), their particles and the animated
 * titles on LiteGraph's own node pass. What an effect draws around a node goes
 * under every node, in onRender before the link motion; what falls on the node
 * goes over its body, from drawNodeShape, under its slots and widgets. The
 * styled title takes the native title's place. Effects fade with the node's
 * mode, as native draws the node; collapsed nodes, and nodes in Vue mode, get
 * none.
 *
 * @module extensions/node-animations
 */

import type { ComfyExtension } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { N, nodeSettings } from '@/core/settings';
import { clock, dummy, env, guard, install, layers, live, wake } from '@/core/engine';
import type { NodeEffectSettings } from '@/effects/types';
import { getNodeEffect, drawParticles } from '@/effects/node-effects';
import { getCustomNodeColors } from '@/utils/color-manager';
import { withAlpha, validateHexColor } from '@/utils/colors';

/** The guard's keys, which its toast names when it turns one off. */
const EFFECT = 'Node effect';
const PARTICLES = 'Node particles';
const TITLES = 'Animated titles';
const OUTLINE = 'Hover outline';

// =============================================================================
// Text Animation System
// =============================================================================

function hexToRGB(hex: string): [number, number, number] {
    const validated = validateHexColor(hex) || '#00ffff';
    return [
        parseInt(validated.slice(1, 3), 16),
        parseInt(validated.slice(3, 5), 16),
        parseInt(validated.slice(5, 7), 16),
    ];
}

function drawAnimatedText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number, y: number,
    phase: number,
): void {
    const textAnimEnabled = N.textAnimationEnabled;
    if (!textAnimEnabled) return;

    const baseColor = N.textColor;
    const style = N.textStyle;
    const size = N.textSize;
    const glow = N.textGlow;
    const letterSpacing = N.textLetterSpacing;
    const offsetY = N.textPositionY;
    const offsetX = N.textPositionX;
    const rotationRadius = N.textRotationRadius;
    const rotationAngle = N.textRotationAngle;

    let finalX = x + offsetX;
    let finalY = y + offsetY;

    if (rotationRadius > 0) {
        const orbitAngle = phase * 2;
        finalX += Math.cos(orbitAngle) * rotationRadius;
        finalY += Math.sin(orbitAngle) * rotationRadius;
    }

    const [r, g, b] = hexToRGB(baseColor);

    ctx.save();
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (rotationAngle !== 0) {
        ctx.translate(finalX, finalY);
        ctx.rotate((rotationAngle * Math.PI) / 180);
        ctx.translate(-finalX, -finalY);
    }

    const drawText = (tx: number, ty: number, fillStyle: string) => {
        ctx.fillStyle = fillStyle;
        if (letterSpacing === 0) {
            ctx.fillText(text, tx, ty);
        } else {
            const spaced = text.split('').join('\u200A'.repeat(Math.max(1, Math.floor(Math.abs(letterSpacing) * 2))));
            ctx.fillText(spaced, tx, ty);
        }
    };

    try {
        switch (style) {
            case 'neon': {
                const pulseIntensity = 0.7 + Math.sin(phase * 3) * 0.3;
                const neonAlpha = 0.8 * glow * pulseIntensity;
                ctx.shadowColor = `rgba(${r},${g},${b},${neonAlpha * 0.5})`;
                ctx.shadowBlur = 20 * glow;
                drawText(finalX, finalY, `rgba(${r},${g},${b},${neonAlpha * 0.3})`);
                ctx.shadowBlur = 10 * glow;
                drawText(finalX, finalY, `rgba(${r},${g},${b},${neonAlpha * 0.6})`);
                ctx.shadowBlur = 5 * glow;
                drawText(finalX, finalY, `rgb(${r},${g},${b})`);
                ctx.shadowBlur = 3;
                ctx.globalAlpha = 0.5 * pulseIntensity;
                drawText(finalX, finalY, '#ffffff');
                break;
            }
            case 'cyberpunk': {
                const glitchOffset = Math.sin(phase * 10) * 2;
                const glitchAlpha = 0.7 * glow;
                const glitchColors = [
                    { r: 255, g: 0, b: 128, o: 0.7 },
                    { r: 0, g: 255, b: 255, o: 0.7 },
                    { r: 255, g: 255, b: 0, o: 0.5 },
                ];
                glitchColors.forEach((c, i) => {
                    const off = glitchOffset * (i - 1);
                    ctx.shadowColor = `rgba(${c.r},${c.g},${c.b},${glitchAlpha})`;
                    ctx.shadowBlur = 5 * glow;
                    drawText(finalX + off, finalY, `rgba(${c.r},${c.g},${c.b},${c.o})`);
                });
                ctx.shadowColor = `rgba(${r},${g},${b},${glitchAlpha})`;
                ctx.shadowBlur = 10 * glow;
                drawText(finalX, finalY, baseColor);
                break;
            }
            case 'retro': {
                const scanOff = Math.sin(phase * 5) * 0.5;
                drawText(finalX - 1, finalY + scanOff, 'rgba(255,0,0,0.5)');
                drawText(finalX + 1, finalY - scanOff, 'rgba(0,255,255,0.5)');
                ctx.shadowColor = baseColor;
                ctx.shadowBlur = 3 * glow;
                drawText(finalX, finalY, baseColor);
                break;
            }
            case 'pulse': {
                const simplePulse = 0.5 + Math.sin(phase * 2) * 0.5;
                ctx.globalAlpha = 0.8 + simplePulse * 0.2;
                ctx.shadowColor = baseColor;
                ctx.shadowBlur = 10 * glow * simplePulse;
                drawText(finalX, finalY, baseColor);
                break;
            }
            case 'minimal': {
                const fadeAlpha = 0.7 + Math.sin(phase * 2) * 0.3;
                ctx.globalAlpha = fadeAlpha;
                ctx.shadowColor = baseColor;
                ctx.shadowBlur = 3 * glow;
                drawText(finalX, finalY, baseColor);
                ctx.beginPath();
                ctx.strokeStyle = baseColor;
                ctx.lineWidth = 1;
                ctx.globalAlpha = fadeAlpha * 0.5;
                const textWidth = ctx.measureText(text).width * (1 + letterSpacing * 0.1);
                ctx.moveTo(finalX - textWidth / 2, finalY + 10);
                ctx.lineTo(finalX + textWidth / 2, finalY + 10);
                ctx.stroke();
                break;
            }
            default:
                drawText(finalX, finalY, baseColor);
        }
    } catch {
        drawText(finalX, finalY, baseColor);
    }

    ctx.restore();
}

// =============================================================================
// Particle Color Resolver
// =============================================================================

function getParticleColor(index: number, time: number, _count: number): string {
    const particleColorMode = N.particleColorMode;
    const colors = getCustomNodeColors();

    switch (particleColorMode) {
        case 'rainbow':
            return `hsl(${(index * 30 + time * 50) % 360}, 90%, 75%)`;
        case 'complementary': {
            const validColor = validateHexColor(colors.accent);
            if (validColor) {
                const r2 = parseInt(validColor.slice(1, 3), 16) / 255;
                const g2 = parseInt(validColor.slice(3, 5), 16) / 255;
                const b2 = parseInt(validColor.slice(5, 7), 16) / 255;
                const max = Math.max(r2, g2, b2), min = Math.min(r2, g2, b2);
                let h = 0;
                const s = max === min ? 0 : (max - min) / (2 * (((max + min) / 2) > 0.5 ? (2 - max - min) : (max + min)));
                const l = (max + min) / 2;
                if (max !== min) {
                    const d = max - min;
                    if (max === r2) h = (g2 - b2) / d + (g2 < b2 ? 6 : 0);
                    else if (max === g2) h = (b2 - r2) / d + 2;
                    else h = (r2 - g2) / d + 4;
                    h = (h / 6) * 360;
                }
                return `hsl(${(h + 180) % 360}, ${s * 100}%, ${l * 100}%)`;
            }
            return colors.accent;
        }
        case 'energy':
            return `hsl(${(time * 100 + index * 20) % 360}, 90%, 75%)`;
        case 'quantum': {
            const qp = (time * 2 + index * 0.1) % 1;
            return `hsl(${280 + qp * 80}, 90%, ${60 + Math.sin(time * 5) * 20}%)`;
        }
        case 'aurora': {
            const ap = (time * 3 + index * 0.2) % 1;
            return `hsl(${120 + ap * 60}, ${80 + Math.sin(time * 3) * 20}%, ${70 + Math.sin(time * 4) * 20}%)`;
        }
        default: {
            const customParticle = N.colorParticle;
            return validateHexColor(customParticle) || colors.accent;
        }
    }
}

// =============================================================================
// Node layers
// =============================================================================

type Canvas = InstanceType<typeof LGraphCanvas>;
type Node = InstanceType<typeof LGraphNode>;

/** RenderShape.ROUND, CIRCLE and CARD (litegraph types/globalEnums.ts); a node of any other shape is a box. */
const [ROUND, CIRCLE, CARD] = [2, 3, 4];
/** LGraphEventMode.NEVER (muted) and BYPASS. */
const [NEVER, BYPASS] = [2, 4];
/** TitleMode.NO_TITLE, for which drawNodeShape draws no title (FE157 LGraphCanvas.ts L5917, FE1395 L5537). */
const NO_TITLE = 1;

/** What v2's drawNode handed the node effect. */
function effectSettings(): NodeEffectSettings {
    const colors = getCustomNodeColors();
    return {
        animation: {
            phase: clock.nodePhase,
            intensity: N.intensity * N.animationGlow,
            direction: N.direction,
            animSpeed: N.animationSpeed,
            isStaticMode: N.staticMode,
            isPaused: false,
        },
        quality: { quality: N.quality, animationSize: N.animationSize, glowIntensity: N.glowShow ? N.glow : 0 },
        particles: {
            showParticles: N.particleShow,
            density: N.particleDensity,
            speed: N.particleSpeed,
            intensity: N.particleIntensity,
            size: N.particleSize,
            glowIntensity: N.particleGlow,
        },
        colors: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent, hoverColor: N.colorHover, showHover: N.colorHoverShow },
    };
}

/** What it handed the particles of a node without an effect. */
function particleSettings(): NodeEffectSettings {
    const colors = getCustomNodeColors();
    return {
        animation: { phase: clock.nodePhase, intensity: 1.0, direction: N.direction, animSpeed: 1, isStaticMode: false, isPaused: false },
        quality: { quality: N.quality, animationSize: N.animationSize, glowIntensity: 0 },
        particles: {
            showParticles: true,
            density: N.particleDensity,
            speed: N.particleSpeed,
            intensity: N.particleIntensity,
            size: N.particleSize,
            glowIntensity: N.particleGlow,
        },
        colors: { primary: colors.primary, secondary: colors.secondary, accent: colors.accent, hoverColor: '#00ff15', showHover: false },
    };
}

/**
 * How far from a node's centre the fireflies of drawParticles reach at most: they orbit up to 1.3 glow radii
 * (calculateGlowRadius) and drift up by 0.3 of that, then wander and glow.
 */
function fireflies(w: number, h: number): number {
    const radius = Math.max(w, h) * (0.5 + N.quality * 0.1) * N.animationSize;
    return 1.7 * radius + 4.5 * N.particleIntensity + 17 + 20 * N.animationSize * N.particleSize;
}

/**
 * How far past a node's body the effect draws at most, from its code in node-effects.ts: Neon Nexus measured
 * from the body's edges, the others from its centre. A shadow counts as far as its blur.
 */
function effectReach(w: number, h: number): number {
    const long = Math.max(w, h);
    const short = Math.min(w, h);
    const size = N.animationSize;
    const intensity = N.intensity * N.animationGlow;
    const glow = N.glowShow ? N.glow : 0;
    const { particleShow: particles, particleIntensity: motion, particleSize: dot, particleGlow: dotGlow } = N;
    switch (N.animate) {
        case 2: {
            // The widest tube's glow, the hover pulse's, the scan line, and the hex lattice and energy grid off the left edge.
            const line = long * 0.0075 * size;
            return Math.max(10, line + 48 * intensity * glow, line + 15 * intensity, particles ? 1.1 * short * size + 3 * dot + 5 * dotGlow + 2 : 0);
        }
        case 3: {
            // The rings, and the corona of particles around them.
            const rings = 0.7 * short * size + 1.5 * intensity + 1 + Math.max(2, 15 * glow);
            const corona = 0.7 * long * (0.8 + 0.2 * motion) + 4 * dot + 3 * motion + 2 + 15 * dotGlow;
            return Math.max(rings, particles ? corona : 0) - short / 2;
        }
        case 4: {
            // The rings of circles, and the dots that circle each one.
            const radius = short * 0.056 * intensity * size;
            const rings = 2 * radius * Math.max(2, Math.floor(N.quality * 2));
            const dots = rings + 0.5 * radius * motion + 1.5 * dot + 0.5 + 5 * dotGlow;
            return Math.max(rings + radius + 1 + 15 * intensity * glow, particles ? dots : 0) - short / 2;
        }
        default: {
            // Gentle Pulse: its outer glow and its fireflies, and its hover outline's glow off the edges.
            const radius = long * (0.5 + N.quality * 0.1) * size;
            const halo = Math.max(radius * (1.2 + 0.4 * glow) * (0.4 + 0.3 * intensity), particles ? fireflies(w, h) + 15 * glow : 0);
            return Math.max(halo - short / 2, N.colorHoverShow ? 1 + 22.5 * glow : 0);
        }
    }
}

/** How far past a node's body its particles reach when it has no effect. */
const particlesReach = (w: number, h: number) => fireflies(w, h) - Math.min(w, h) / 2;

type Draw = (ctx: CanvasRenderingContext2D, node: Node, settings: NodeEffectSettings) => void;

const drawEffect: Draw = (ctx, node, settings) => getNodeEffect(N.animate)(ctx, node, settings, clock.particlePhase, getParticleColor);

const drawParticlesAlone: Draw = (ctx, node, settings) => {
    ctx.translate(node.size[0] / 2, node.size[1] / 2);
    drawParticles(ctx, node, settings, clock.particlePhase, getParticleColor);
};

/** What v2 drew for each node, as its drawNode chose: with the guard's key, what it handed the drawing, and how far past the body that reaches. */
interface Fx {
    key: string;
    draw: Draw;
    settings: NodeEffectSettings;
    reach(w: number, h: number): number;
}

/** What every node gets now: the effect when Animate and Show base effect are on, else the particles alone, if either is. */
function fx(): Fx | undefined {
    if (N.animate > 0 && N.animationsEnabled) {
        return guard.off(EFFECT) ? undefined : { key: EFFECT, draw: drawEffect, settings: effectSettings(), reach: effectReach };
    }
    if (!N.particleShow || guard.off(PARTICLES)) return undefined;
    return { key: PARTICLES, draw: drawParticlesAlone, settings: particleSettings(), reach: particlesReach };
}

/** The alpha native draws a node at: getNodeModeAlpha (FE157 LGraphCanvas.ts L6234-6241, FE1395 L5789-5795; 1.39.5 has no ghost nodes). */
function modeAlpha(canvas: Canvas, node: Node): number {
    if (node.flags.ghost) return 0.3;
    return node.mode === BYPASS ? 0.2 : node.mode === NEVER ? 0.4 : canvas.editor_alpha;
}

/**
 * The context to draw v2's drawing with on a node native draws at `alpha`. v2 sets globalAlpha itself, so below
 * full alpha every alpha it sets is scaled, as native's own drawing of a faded node is; one outside [0, 1], which
 * v2 sets at high Glow settings, is ignored as the browser ignores it. (A canvas filter would do it too, but draws
 * each call through a layer the size of the clip: hundreds of ms a frame.)
 */
function faded(ctx: CanvasRenderingContext2D, alpha: number): CanvasRenderingContext2D {
    ctx.globalAlpha = alpha;
    if (alpha === 1) return ctx;
    return new Proxy(ctx, {
        get: (target, key) => {
            const value = Reflect.get(target, key);
            if (key === 'globalAlpha') return value / alpha;
            return typeof value === 'function' ? value.bind(target) : value;
        },
        set: (target, key, value) => {
            if (key !== 'globalAlpha') return Reflect.set(target, key, value);
            if (value >= 0 && value <= 1) target.globalAlpha = value * alpha;
            return true;
        },
    });
}

/** Adds a node's body, title bar included, to the path as drawNodeShape fills it (FE157 LGraphCanvas.ts L5880-5904, FE1395 L5500-5524). */
function body(canvas: Canvas, ctx: CanvasRenderingContext2D, node: Node): void {
    const box = node.boundingRect;
    const left = box[0] - node.pos[0];
    const top = box[1] - node.pos[1];
    const shape: number = node.renderingShape;
    const r = LiteGraph.ROUND_RADIUS;
    if (canvas.low_quality) ctx.rect(left, top, box[2], box[3]);
    else if (shape === ROUND || shape === CARD) ctx.roundRect(left, top, box[2], box[3], shape === CARD ? [r, r, 0, 0] : [r]);
    else if (shape === CIRCLE) ctx.arc(node.size[0] / 2, node.size[1] / 2, node.size[0] / 2, 0, Math.PI * 2);
    else ctx.rect(left, top, box[2], box[3]);
}

/** Draws what v2 drew for a node in the state it drew in, before the node (without the shadow offset native drawNode sets), faded with the node. */
function drawFx(canvas: Canvas, ctx: CanvasRenderingContext2D, node: Node, f: Fx): void {
    ctx.shadowOffsetX = ctx.shadowOffsetY = 0;
    f.draw(faded(ctx, modeAlpha(canvas, node)), node, f.settings);
}

/** Whether `box` grown by `margin` on each side overlaps `area`. */
const overlaps = (box: ArrayLike<number>, area: ArrayLike<number>, margin: number) =>
    box[0] - margin <= area[0] + area[2] && box[0] + box[2] + margin >= area[0] && box[1] - margin <= area[1] + area[3] && box[1] + box[3] + margin >= area[1];

/**
 * The under-layer, before the link motion and every node: what each node's effect draws around its body, the part
 * of it that showed in v2, which drew it all before the body. It takes the nodes whose area, grown by the effect's
 * reach, is on screen, and counts what moves.
 */
function under(canvas: Canvas, ctx: CanvasRenderingContext2D): void {
    const { graph } = canvas;
    // In Vue mode the DOM draws the nodes and none of the node hooks run; Nodes 2.0 comes with M8.
    if (!graph || LiteGraph.vueNodesMode) return;
    const f = fx();
    // As in v2, the effect phase holds still in Static mode and while a run pauses it; particles keep moving.
    const moves = N.animate > 0 && !N.staticMode && !(N.pauseDuringRender && env.running) && !env.reducedMotion;
    const titles = N.textAnimationEnabled && moves && !canvas.low_quality && !guard.off(TITLES);
    if (!f && !titles) return;
    const particles = N.particleShow && !env.reducedMotion;
    const area = canvas.visible_area;
    for (const node of graph.nodes) {
        const shown = node.flags.collapsed ? undefined : f;
        const reach = shown ? shown.reach(node.size[0], node.size[1]) : 0;
        if (!overlaps(node.renderArea, area, Math.max(0, reach))) continue;
        // Where drawTitleText draws the styled title: not for a node that draws its own, nor one without a title bar.
        if (titles && node.title && !node.onDrawTitleText && node.title_mode !== NO_TITLE) live.nodes++;
        if (!shown) continue;
        if (shown.key === EFFECT && moves) live.nodes++;
        if (particles) live.particles++;
        if (reach <= 0) continue;
        ctx.save();
        try {
            ctx.translate(node.pos[0], node.pos[1]);
            // Around the body only: the over-layer draws what falls on it.
            ctx.beginPath();
            ctx.rect(area[0] - node.pos[0], area[1] - node.pos[1], area[2], area[3]);
            body(canvas, ctx, node);
            ctx.clip('evenodd');
            drawFx(canvas, ctx, node, shown);
        } catch (error) {
            guard.fail(shown.key, error);
        } finally {
            ctx.restore();
        }
    }
    if (live.nodes || live.particles) wake();
}

/** Draws v2's styled title where native draws the title, at the alpha native set for it. False if it failed. */
function styledTitle(ctx: CanvasRenderingContext2D, node: Node): boolean {
    // drawNodeShape sets the node's alpha just before the title (FE157 LGraphCanvas.ts L5930, FE1395 L5550).
    const alpha = ctx.globalAlpha;
    ctx.save();
    try {
        // Centred on the title bar, which on a collapsed node is renderingSize wide too.
        drawAnimatedText(faded(ctx, alpha), node.title, node.renderingSize[0] / 2, -15, clock.nodePhase);
        return true;
    } catch (error) {
        guard.fail(TITLES, error);
        return false;
    } finally {
        ctx.restore();
    }
}

// =============================================================================
// Extension
// =============================================================================

const ext: ComfyExtension = {
    name: 'enhanced.node.animations',
    settings: nodeSettings,

    async setup() {
        install();
        layers.nodes = under;

        // The node's body, then the over-layer: what the effect draws on the body (the under-layer drew the rest), then v2's hover outline.
        const drawNodeShape = LGraphCanvas.prototype.drawNodeShape;
        LGraphCanvas.prototype.drawNodeShape = function (this: Canvas, ...args: Parameters<Canvas['drawNodeShape']>) {
            drawNodeShape.apply(this, args);
            const [node, ctx] = args;
            if (node.flags.collapsed) return;
            const f = fx();
            if (f) {
                ctx.save();
                try {
                    ctx.beginPath();
                    body(this, ctx, node);
                    ctx.clip();
                    drawFx(this, ctx, node, f);
                } catch (error) {
                    guard.fail(f.key, error);
                } finally {
                    ctx.restore();
                }
            }

            if (N.colorHoverShow && N.animate > 0 && (node.mouseOver || (this.selected_nodes && this.selected_nodes[node.id])) && !guard.off(OUTLINE)) {
                const hoverColor = N.colorHover;
                const outlineGlowSize = 15 * N.glow;

                ctx.save();
                try {
                    ctx.globalAlpha = modeAlpha(this, node);
                    ctx.shadowColor = withAlpha(hoverColor, 0.5);
                    ctx.shadowBlur = node.mouseOver ? outlineGlowSize : outlineGlowSize * 1.5;
                    ctx.strokeStyle = withAlpha(hoverColor, 0.7);
                    ctx.lineWidth = 2;

                    // BUG: _shape is a RenderShape number on 1.39 and gone on 1.57, so round nodes get the square outline.
                    const shape = (node as Node & { _shape?: unknown })._shape || 'box';
                    if (shape === 'round' || shape === 'card') {
                        const radius = node.constructor?.slot_start_y ? 8 : 4;
                        ctx.beginPath();
                        ctx.roundRect(0, 0, node.size[0], node.size[1], radius);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(0, 0, node.size[0], node.size[1]);
                    }
                } catch (error) {
                    guard.fail(OUTLINE, error);
                } finally {
                    ctx.restore();
                }
            }
        };

        // With Animated titles on, v2's styled title in place of the native one.
        const drawTitleText = LGraphNode.prototype.drawTitleText;
        LGraphNode.prototype.drawTitleText = function (this: Node, ...args: Parameters<Node['drawTitleText']>) {
            // Left to native: a node that draws its own title, an untitled one (v2 styled only titles), and low quality, which draws none.
            if (!N.textAnimationEnabled || !this.title || this.onDrawTitleText || args[1].low_quality || guard.off(TITLES)) return drawTitleText.apply(this, args);
            // Native still draws its title, where nobody sees it, so other wrappers get their call; if ours failed, native's is the one shown.
            if (styledTitle(args[0], this)) args[0] = dummy();
            return drawTitleText.apply(this, args);
        };

        console.log('[EnhancedNodes] Extension registered with full animation pipeline.');
    },
};

app.registerExtension(ext);
