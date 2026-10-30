/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Link Animations Extension
 *
 * Overrides LGraphCanvas.prototype.drawConnections to batch-render all links
 * with configurable animation effects. Dispatches to animated or static
 * renderers based on user settings.
 *
 * Ported from original link_animations.js drawConnections (lines 2403–2518)
 * and animate() loop (lines 3163–3194).
 *
 * @module extensions/link-animations
 */

import type { ComfyExtension, LLink, Point } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { api } from '/scripts/api.js';
import { L, linkSettings } from '@/core/settings';
import { enableAntiAliasing } from '@/renderers/render-utils';
import { renderAnimatedStyle, type RenderItem } from '@/effects/animated-renderers';
import { renderStaticStyle } from '@/effects/static-renderers';
import { initSidebar } from '@/sidebar/sidebar';

// =============================================================================
// Animation State
// =============================================================================

const AnimationState = {
    direction: 1,
    targetPhase: 0,
    smoothFactor: 0.95,
    lastPhaseUpdate: 0,
    transitionSpeed: (2 * Math.PI) / (10 * 1.5),

    update(delta: number): number {
        const dir = L.direction;
        const speed = Math.max(0.01, L.animationSpeed);
        this.direction = dir;
        return State.phase + (this.transitionSpeed * delta * speed * this.direction);
    },
};

// =============================================================================
// State
// =============================================================================

const TimingManager = {
    smoothDelta: 0,
    lastTime: performance.now(),

    update(): number {
        const now = performance.now();
        const rawDelta = Math.min((now - this.lastTime) / 1000, 1 / 30);
        this.lastTime = now;
        this.smoothDelta = this.smoothDelta * 0.9 + rawDelta * 0.1;
        return this.smoothDelta;
    },
};

const State = {
    isRunning: false,
    phase: 0,
    totalTime: 0,
    lastFrame: performance.now(),
    animationFrame: null as number | null,
    staticPhase: Math.PI / 4,
    lastSettings: null as string | null,
    lastAnimStyle: null as number | null,
    forceUpdate: false,
    forceRedraw: false,
    lastRenderState: null as { phase: number; totalTime: number } | null,
    speedMultiplier: 1,
    linkPositions: new Map(),
    particlePool: new Map(),
    activeParticles: new Set(),
};

// =============================================================================
// Extension
// =============================================================================

/**
 * Asserted, not checked: the override assumes a graph (native drawConnections throws without one) and indexes
 * graph.links with for...in's string keys, which the links Map's deprecated indexed access takes.
 */
type LinksCanvas = InstanceType<typeof LGraphCanvas> & { graph: { links: Record<string, LLink | undefined> } };

const ext: ComfyExtension = {
    name: 'enhanced.link.animations',
    settings: linkSettings,

    async setup() {
        // Monitor execution status
        api.addEventListener('status', ({ detail }: any) => {
            State.isRunning = detail?.exec_info?.queue_remaining > 0;
            app.graph?.setDirtyCanvas(true, true);
        });

        // Register sidebar
        initSidebar();

        // =====================================================================
        // drawConnections Override (batched rendering)
        // =====================================================================

        const origDrawConnections = LGraphCanvas.prototype.drawConnections;

        LGraphCanvas.prototype.drawConnections = function (this: LinksCanvas, ctx: CanvasRenderingContext2D) {
            try {
                ctx.save();
                enableAntiAliasing(ctx);

                const animStyle = L.animate;
                const linkStyle = L.linkStyle;
                const shouldPauseDuringRender = L.pauseDuringRender;
                const isStaticMode = L.staticMode;
                const quality = L.quality;
                const particleDensity = L.particleDensity;

                // Style 0 = off — fall through to original
                if (animStyle === 0) {
                    origDrawConnections.call(this, ctx);
                    ctx.restore();
                    return;
                }

                // Force static mode when paused during render
                const isPaused = shouldPauseDuringRender && State.isRunning;
                const effectiveStaticMode = isStaticMode || isPaused;

                // Detect settings changes
                const currentSettings = `${animStyle}-${linkStyle}-${quality}-${particleDensity}`;
                if (State.lastSettings !== currentSettings || State.forceRedraw) {
                    State.forceUpdate = true;
                    State.lastSettings = currentSettings;
                    State.lastAnimStyle = animStyle;
                    State.forceRedraw = false;
                }

                const delta = TimingManager.update();

                // Update phase based on mode
                let phase: number;
                if (effectiveStaticMode) {
                    if (State.forceUpdate || State.lastAnimStyle !== animStyle) {
                        State.staticPhase = (State.staticPhase + Math.PI * 2) % (Math.PI * 4);
                        State.forceUpdate = false;
                        State.lastAnimStyle = animStyle;
                    }
                    phase = State.staticPhase;
                } else {
                    phase = AnimationState.update(delta);
                    State.phase = phase;
                    State.totalTime += delta;
                }

                State.activeParticles.clear();

                // Build render queue
                const renderQueue = new Map<number, RenderItem[]>();

                for (const linkId in this.graph.links) {
                    const linkData = this.graph.links[linkId];
                    if (!linkData) continue;

                    const originNode = this.graph._nodes_by_id[linkData.origin_id];
                    const targetNode = this.graph._nodes_by_id[linkData.target_id];

                    if (!originNode || !targetNode ||
                        originNode.flags?.collapsed || targetNode.flags?.collapsed) continue;

                    // getConnectionPos fills any array-like `out`, though its types ask for a Point.
                    const startPos = new Float32Array(2) as Float32Array & Point;
                    const endPos = new Float32Array(2) as Float32Array & Point;

                    originNode.getConnectionPos(false, linkData.origin_slot, startPos);
                    targetNode.getConnectionPos(true, linkData.target_slot, endPos);

                    // BUG: without a link_type_colors entry this is the default_connection_color object (color-fallback.test.ts).
                    const defaultColor = (linkData.type
                        ? (LGraphCanvas.link_type_colors?.[linkData.type as string] ?? this.default_connection_color)
                        : this.default_connection_color) as string;

                    if (!renderQueue.has(animStyle)) {
                        renderQueue.set(animStyle, []);
                    }
                    renderQueue.get(animStyle)!.push({
                        start: startPos,
                        end: endPos,
                        color: defaultColor,
                        defaultColor: defaultColor,
                        linkId: linkId,
                        linkStyle: linkStyle,
                        isStatic: effectiveStaticMode,
                    });
                }

                // Dispatch to renderers
                if (effectiveStaticMode) {
                    const items = renderQueue.get(animStyle);
                    if (items) {
                        renderStaticStyle(ctx, items, animStyle, phase);
                    }
                } else {
                    renderQueue.forEach((items, style) => {
                        renderAnimatedStyle(ctx, items, style, phase, {
                            direction: AnimationState.direction,
                            totalTime: State.totalTime,
                            phase: State.phase,
                        });
                    });
                }

                ctx.restore();

                // Always request next frame for continuous animation
                app.graph?.setDirtyCanvas(true, true);

            } catch (error) {
                console.error('[EnhancedLinks] Error in drawConnections:', error);
                origDrawConnections.call(this, ctx);
            }
        };

        // =====================================================================
        // Animation Loop
        // =====================================================================

        function animate() {
            const isStaticMode = L.staticMode;
            const animStyle = L.animate;
            const shouldPauseDuringRender = L.pauseDuringRender;

            // Pause during rendering
            if (shouldPauseDuringRender && State.isRunning) {
                if (!State.lastRenderState) {
                    State.lastRenderState = {
                        phase: State.phase,
                        totalTime: State.totalTime,
                    };
                }
                requestAnimationFrame(animate);
                return;
            } else if (State.lastRenderState) {
                State.phase = State.lastRenderState.phase;
                State.totalTime = State.lastRenderState.totalTime;
                State.lastRenderState = null;
            }

            // Update timing when animations are active
            if ((isStaticMode && animStyle > 0) || (animStyle > 0 && !isStaticMode)) {
                State.totalTime += TimingManager.smoothDelta * State.speedMultiplier;
                app.graph?.setDirtyCanvas(true, true);
            }

            State.animationFrame = requestAnimationFrame(animate);
        }

        // Start animation loop
        animate();

        console.log('[EnhancedLinks] Extension registered with full batched rendering pipeline.');
    },
};

app.registerExtension(ext);
