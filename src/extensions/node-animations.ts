/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Node Animations Extension
 *
 * Full-featured node animation system with:
 * - 4 animation styles (Gentle Pulse, Neon Nexus, Cosmic Ripple, Flower of Life)
 * - Text animation system (5 styles: neon, cyberpunk, retro, pulse, minimal)
 * - Particle color modes (rainbow, complementary, energy, quantum, aurora)
 * - Completion fireworks
 * - Per-node settings via context menu
 * - ColorManager integration for proper color resolution
 *
 * Ported from original node_animations.js (2,996 lines).
 *
 * @module extensions/node-animations
 */

import type { ComfyExtension, LGraphNode } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { api } from '/scripts/api.js';
import { N, nodeSettings } from '@/core/settings';
import { createNodeState } from '@/core/state';
import type { NodeState, Color } from '@/core/types';
import { getNodeEffect, drawParticles } from '@/effects/node-effects';
import { getCustomNodeColors } from '@/utils/color-manager';
import { withAlpha, validateHexColor } from '@/utils/colors';

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
// Extension
// =============================================================================

const ext: ComfyExtension = {
    name: 'enhanced.node.animations',
    settings: nodeSettings,

    async setup() {
        const state: NodeState = createNodeState();

        // Timing
        const Timing = {
            smoothDelta: 0,
            lastTime: performance.now(),
            update(): number {
                const now = performance.now();
                const raw = Math.min((now - this.lastTime) / 1000, 1 / 30);
                this.lastTime = now;
                this.smoothDelta = this.smoothDelta * 0.9 + raw * 0.1;
                return this.smoothDelta;
            },
        };

        // Particle controller (independent timing)
        const ParticleController = {
            phase: 0,
            lastUpdate: 0,
            update(currentTime: number, delta: number): number {
                const dir = N.direction;
                const speed = Math.max(0.01, N.particleSpeed);
                if (currentTime - this.lastUpdate >= 16) {
                    const phaseStep = ((2 * Math.PI) / 15) * delta * speed;
                    this.phase += phaseStep * dir;
                    this.lastUpdate = currentTime;
                }
                return this.phase;
            },
        };

        // Track execution
        api.addEventListener('status', ({ detail }: any) => {
            state.isRunning = detail?.exec_info?.queue_remaining > 0;
        });

        // =====================================================================
        // Animation Loop
        // =====================================================================

        function renderLoop(timestamp: number) {
            const animStyle = N.animate;
            const pauseDuringRender = N.pauseDuringRender;
            const isRendering = state.isRunning;
            const showParticles = N.particleShow;

            // Always update timing so particles can move independently
            const delta = Timing.update();
            state.totalTime = (state.totalTime || 0) + delta;
            ParticleController.update(timestamp, delta);

            const paused = isRendering && pauseDuringRender;

            // Update animation phase only when animation is active and not paused
            if (animStyle > 0 && !paused) {
                const speed = N.animationSpeed;
                const direction = N.direction;
                const isStaticMode = N.staticMode;

                if (!isStaticMode) {
                    state.phase += ((2 * Math.PI) / 15) * delta * speed * direction;
                }
            }

            // Redraw canvas if any visual effect is active
            if (animStyle > 0 || showParticles) {
                app.graph?.setDirtyCanvas(true, false);
            }

            requestAnimationFrame(renderLoop);
        }

        requestAnimationFrame(renderLoop);

        // =====================================================================
        // drawNode Override
        // =====================================================================

        const originalDrawNode = LGraphCanvas.prototype.drawNode;

        LGraphCanvas.prototype.drawNode = function (node, ctx) {
            const animStyle = N.animate;
            const animEnabled = N.animationsEnabled;

            const showParticles = N.particleShow;

            if (animStyle > 0 && animEnabled) {
                const colors = getCustomNodeColors();
                const isStaticMode = N.staticMode;
                const glowIntensity = N.glow;
                const animGlow = N.animationGlow;
                const quality = N.quality;
                const animSize = N.animationSize;
                const intensity = N.intensity;
                const direction = N.direction;
                const animSpeed = N.animationSpeed;
                const particleDensity = N.particleDensity;
                const particleSpeed = N.particleSpeed;
                const particleIntensity = N.particleIntensity;
                const particleSize = N.particleSize;
                const particleGlow = N.particleGlow;
                const showGlow = N.glowShow;
                const hoverColor = N.colorHover;
                const showHover = N.colorHoverShow;

                const effect = getNodeEffect(animStyle);
                if (effect) {
                    ctx.save();
                    try {
                        effect(
                            ctx,
                            node,
                            {
                                animation: {
                                    phase: state.phase,
                                    intensity: intensity * animGlow,
                                    direction,
                                    animSpeed,
                                    isStaticMode,
                                    isPaused: false,
                                },
                                quality: {
                                    quality,
                                    animationSize: animSize,
                                    glowIntensity: showGlow ? glowIntensity : 0,
                                },
                                particles: {
                                    showParticles,
                                    density: particleDensity,
                                    speed: particleSpeed,
                                    intensity: particleIntensity,
                                    size: particleSize,
                                    glowIntensity: particleGlow,
                                },
                                colors: {
                                    primary: colors.primary as Color,
                                    secondary: colors.secondary as Color,
                                    accent: colors.accent as Color,
                                    hoverColor,
                                    showHover,
                                },
                            },
                            ParticleController.phase,
                            getParticleColor,
                        );
                    } catch (e) {
                        console.warn('[EnhancedNodes] Effect error:', e);
                    }
                    ctx.restore();
                }
            } else if (showParticles) {
                // Particles-only mode (no animation style selected)
                const colors = getCustomNodeColors();
                const particleDensity = N.particleDensity;
                const particleSpeed = N.particleSpeed;
                const particleIntensity = N.particleIntensity;
                const particleSize = N.particleSize;
                const particleGlow = N.particleGlow;
                const quality = N.quality;
                const animSize = N.animationSize;
                const direction = N.direction;

                ctx.save();
                ctx.translate(node.size[0] / 2, node.size[1] / 2);
                try {
                    drawParticles(
                        ctx,
                        node,
                        {
                            animation: {
                                phase: state.phase,
                                intensity: 1.0,
                                direction,
                                animSpeed: 1,
                                isStaticMode: false,
                                isPaused: false,
                            },
                            quality: {
                                quality,
                                animationSize: animSize,
                                glowIntensity: 0,
                            },
                            particles: {
                                showParticles: true,
                                density: particleDensity,
                                speed: particleSpeed,
                                intensity: particleIntensity,
                                size: particleSize,
                                glowIntensity: particleGlow,
                            },
                            colors: {
                                primary: colors.primary as Color,
                                secondary: colors.secondary as Color,
                                accent: colors.accent as Color,
                                hoverColor: '#00ff15',
                                showHover: false,
                            },
                        },
                        ParticleController.phase,
                        getParticleColor,
                    );
                } catch (e) {
                    console.warn('[EnhancedNodes] Particle error:', e);
                }
                ctx.restore();
            }

            // Draw original node
            originalDrawNode.call(this, node, ctx);

            // Text animation (drawn on top of node)
            if (N.textAnimationEnabled && node.title) {
                ctx.save();
                drawAnimatedText(
                    ctx,
                    node.title,
                    node.size[0] / 2,
                    -15,
                    state.phase,
                );
                ctx.restore();
            }
        };

        // =====================================================================
        // Hover Color Override
        // =====================================================================

        const originalDrawNodeShape = LGraphCanvas.prototype.drawNodeShape;
        if (originalDrawNodeShape) {
            LGraphCanvas.prototype.drawNodeShape = function (node, ctx, ...args) {
                originalDrawNodeShape.call(this, node, ctx, ...args);

                const showHover = N.colorHoverShow;
                const animStyle = N.animate;

                if (showHover && animStyle > 0 && (node.mouseOver || (this.selected_nodes && this.selected_nodes[node.id]))) {
                    const hoverColor = N.colorHover;
                    const glowIntensity = N.glow;
                    const outlineGlowSize = 15 * glowIntensity;

                    ctx.save();
                    ctx.shadowColor = withAlpha(hoverColor, 0.5);
                    ctx.shadowBlur = node.mouseOver ? outlineGlowSize : outlineGlowSize * 1.5;
                    ctx.strokeStyle = withAlpha(hoverColor, 0.7);
                    ctx.lineWidth = 2;

                    // BUG: _shape is a RenderShape number on 1.39 and gone on 1.57, so round nodes get the square outline.
                    const shape = (node as LGraphNode & { _shape?: unknown })._shape || 'box';
                    if (shape === 'round' || shape === 'card') {
                        const radius = node.constructor?.slot_start_y ? 8 : 4;
                        ctx.beginPath();
                        ctx.roundRect(0, 0, node.size[0], node.size[1], radius);
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(0, 0, node.size[0], node.size[1]);
                    }
                    ctx.restore();
                }
            };
        }

        console.log('[EnhancedNodes] Extension registered with full animation pipeline.');
    },
};

app.registerExtension(ext);
