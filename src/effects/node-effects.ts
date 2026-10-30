/**
 * Node animation effects — faithful port from node_animations.js
 *
 * 4 effects:
 *  1. Gentle Pulse  — soft breathing glow with firefly particles
 *  2. Neon Nexus    — holographic rounded-rect outlines, scanning light, hex particles
 *  3. Cosmic Ripple — expanding rings with linear-gradient strokes, corona particles
 *  4. Flower of Life — sacred geometry circles + connecting lines + hexagonal overlay
 *
 * @module effects/node-effects
 */

import type { ComfyNode } from '@/core/types';
import type { NodeEffectSettings } from './types';
import { withAlpha } from '@/utils/colors';
import {
    isEffectivelyStatic,
    calculateGlowRadius,
    calculateParticlePosition,
    calculateBlinkFactor,
} from './types';

// =============================================================================
// Shared helpers
// =============================================================================

function roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    r: number,
): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawHoverOutline(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
): void {
    if (!settings.colors.showHover) return;
    if (!node.selected && !node.mouseOver) return;

    const { hoverColor } = settings.colors;
    const { glowIntensity } = settings.quality;
    const outlineGlowSize = 15 * glowIntensity;

    ctx.save();
    ctx.shadowColor = withAlpha(hoverColor, 0.5);
    ctx.shadowBlur = node.selected ? outlineGlowSize * 1.5 : outlineGlowSize;
    ctx.strokeStyle = withAlpha(hoverColor, 0.7);
    ctx.lineWidth = 2;
    ctx.strokeRect(-node.size[0] / 2, -node.size[1] / 2, node.size[0], node.size[1]);
    ctx.restore();
}

// Generic particle system (used by gentlePulse)
export function drawParticles(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string,
): void {
    const { particles, quality, animation } = settings;
    if (!particles.showParticles) return;

    const isStatic = isEffectivelyStatic(animation);
    const glowRadius = calculateGlowRadius(node, quality);
    const baseParticleCount = 8 + quality.quality * 2;
    const particleCount = Math.floor(baseParticleCount * particles.density);

    for (let i = 0; i < particleCount; i++) {
        const position = calculateParticlePosition(i, particleCount, particleTime, glowRadius, {
            particleSpeed: particles.speed,
            particleIntensity: particles.intensity,
            isStatic,
            phase: animation.phase,
            quality: quality.quality,
        });

        const baseParticleSize = (4 + quality.quality) * quality.animationSize * particles.size;
        const particleSize = baseParticleSize * position.sizeFactor;
        const particleColor = getParticleColor(i, particleTime * particles.speed, particleCount);

        const particleGlow = ctx.createRadialGradient(
            position.x, position.y, 0,
            position.x, position.y, particleSize * 2.0,
        );
        particleGlow.addColorStop(0, withAlpha(particleColor, 0.8 * particles.glowIntensity));
        particleGlow.addColorStop(0.4, withAlpha(particleColor, 0.4 * particles.glowIntensity));
        particleGlow.addColorStop(1, withAlpha(particleColor, 0));

        const blinkFactor = calculateBlinkFactor(i, particleTime, particles.speed, isStatic);
        const particleAlpha = Math.min(blinkFactor, 1) * particles.glowIntensity;

        ctx.beginPath();
        ctx.arc(position.x, position.y, particleSize * 2.0, 0, Math.PI * 2);
        ctx.fillStyle = particleGlow;
        ctx.globalAlpha = particleAlpha * 0.8;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(position.x, position.y, particleSize * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = Math.min(particleAlpha * 1.5, 1);
        ctx.fill();
    }
}

// =============================================================================
// 1. Gentle Pulse — faithful port of original gentlePulse
// =============================================================================

export function gentlePulse(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string,
): void {
    const isStatic = isEffectivelyStatic(settings.animation);
    const glowRadius = calculateGlowRadius(node, settings.quality);
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, quality } = settings.quality;
    const { phase, direction, animSpeed, intensity } = settings.animation;

    const breathePhase = isStatic ? phase : phase * 0.375 * direction * animSpeed;
    const breatheScale = Math.pow(Math.sin(breathePhase), 2);
    const modifiedIntensity = intensity * 0.75;
    const pulseScale = 0.4 + 0.4 * breatheScale * modifiedIntensity;

    ctx.save();
    ctx.translate(node.size[0] / 2, node.size[1] / 2);

    drawHoverOutline(ctx, node, settings);

    // Inner glow
    const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius * pulseScale);
    const innerAlpha = 0.2 * glowIntensity * (0.5 + breatheScale * 0.5);
    innerGlow.addColorStop(0, withAlpha('#ffffff', Math.min(innerAlpha + 0.15, 1)));
    innerGlow.addColorStop(0.3, withAlpha(primary, innerAlpha));
    innerGlow.addColorStop(0.7, withAlpha(secondary, innerAlpha * 0.6));
    innerGlow.addColorStop(1, withAlpha(accent, 0));

    // Outer glow
    const outerGlow = ctx.createRadialGradient(
        0, 0, glowRadius * 0.6 * pulseScale,
        0, 0, glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale,
    );
    const outerAlpha = 0.1 * glowIntensity * (0.5 + breatheScale * 0.5);
    outerGlow.addColorStop(0, withAlpha(secondary, outerAlpha));
    outerGlow.addColorStop(0.6, withAlpha(accent, outerAlpha * 0.5));
    outerGlow.addColorStop(1, withAlpha(accent, 0));

    ctx.beginPath();
    ctx.arc(0, 0, glowRadius * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = innerGlow;
    ctx.globalAlpha = Math.min(0.2 + Math.abs(breatheScale) * 0.3 + glowIntensity * 0.2, 1);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0, 0, glowRadius * (1.2 + glowIntensity * 0.4) * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = outerGlow;
    ctx.globalAlpha = Math.min(0.15 + Math.abs(breatheScale) * 0.2 + glowIntensity * 0.15, 1);
    ctx.fill();

    if (quality > 1) {
        ctx.shadowColor = withAlpha(secondary, 0.3);
        ctx.shadowBlur = 10 * glowIntensity * (quality * 0.5);
    }

    drawParticles(ctx, node, settings, particleTime, getParticleColor);

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.restore();
}

// =============================================================================
// 2. Neon Nexus — faithful port of original neonNexus
// =============================================================================

export function neonNexus(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string,
): void {
    const isStatic = isEffectivelyStatic(settings.animation);
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, animationSize } = settings.quality;
    const { phase, direction, intensity } = settings.animation;

    const rectWidth = node.size[0];
    const rectHeight = node.size[1];
    const radius = Math.min(rectWidth, rectHeight) * 0.08;
    const baseLineWidth = Math.max(rectWidth, rectHeight) * 0.0075 * animationSize;
    const hologramDepth = 3;
    const gridSize = Math.min(rectWidth, rectHeight) * 0.4 * animationSize;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'transparent';

    // 1. Holographic base layers
    for (let i = 0; i < hologramDepth; i++) {
        ctx.save();
        ctx.globalAlpha = 0.2 - (i * 0.05);
        ctx.strokeStyle = `hsl(${(i * 60) % 360}, 80%, 75%)`;
        ctx.lineWidth = baseLineWidth * 0.4;
        roundedRect(ctx, -i * 2, -i * 2, rectWidth + i * 4, rectHeight + i * 4, radius + i);
        ctx.stroke();
        ctx.restore();
    }

    // 2. Main neon tube layers (4 layers of glowing outlines)
    const neonFlicker = isStatic ? 1.0 : 0.95 + 0.05 * Math.sin(phase * 0.3 * direction);
    const layers = 4;
    for (let i = 0; i < layers; i++) {
        ctx.save();
        ctx.lineWidth = baseLineWidth * (1 + i * 0.3);

        const layerColor = i === 0 ? primary :
                           i === 1 ? secondary :
                           i === 2 ? accent :
                           'rgba(255, 255, 255, 0.4)';

        ctx.strokeStyle = layerColor;
        ctx.shadowColor = layerColor;
        ctx.shadowBlur = (i + 1) * 12 * intensity * glowIntensity;

        const baseOpacity = 0.95 - i * 0.15;
        ctx.globalAlpha = isStatic ? baseOpacity : baseOpacity * neonFlicker;

        roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
        ctx.stroke();

        if (i === 0) {
            ctx.globalAlpha = isStatic ? 0.3 : 0.3 * neonFlicker;
            ctx.lineWidth = baseLineWidth * 0.8;
            ctx.shadowBlur = 20 * intensity * glowIntensity;
            roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
            ctx.stroke();
        }

        ctx.restore();
    }

    // 3. Scanning light effect (animated only)
    if (!isStatic) {
        ctx.save();
        const scanY = rectHeight * (Math.sin(phase * 2) * 0.5 + 0.5);
        const scanLineGradient = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
        scanLineGradient.addColorStop(0, 'rgba(255,255,255,0)');
        scanLineGradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        scanLineGradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = scanLineGradient;
        ctx.fillRect(0, scanY - 10, rectWidth, 20);
        ctx.restore();
    }

    // 4. Hexagonal particles in grid pattern
    if (settings.particles.showParticles) {
        const particleSz = settings.particles.size;
        const particleGlowInt = settings.particles.glowIntensity;
        const particleCount = 40 + Math.floor(30);

        for (let i = 0; i < particleCount; i++) {
            ctx.save();

            const col = i % 5;
            const row = Math.floor(i / 5);
            const gridSpacing = gridSize / 4;
            const x = (col - 2) * gridSpacing + Math.cos(phase + col) * 2;
            const y = (row - 2) * gridSpacing + Math.sin(phase + row) * 2;

            const baseSize = 2 * particleSz;
            const sizeVariation = baseSize * 0.3;
            const particleSize = baseSize + Math.sin(phase * 2 + i) * sizeVariation;

            const rotation = phase + (i * Math.PI / 8);
            const alpha = (0.4 + Math.sin(phase * 3 + i) * 0.2) * particleGlowInt;
            const particleColor = getParticleColor(i, particleTime * settings.particles.speed, particleCount);

            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillStyle = particleColor;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = particleColor;
            ctx.shadowBlur = 5 * particleGlowInt;

            // Draw hexagonal particle
            ctx.beginPath();
            for (let s = 0; s < 6; s++) {
                const angle = (s * Math.PI / 3) + phase;
                const currentSize = particleSize * (0.8 + Math.sin(phase * 5 + s) * 0.2);
                ctx.lineTo(Math.cos(angle) * currentSize, Math.sin(angle) * currentSize);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        // 5. Energy grid effect
        ctx.save();
        ctx.strokeStyle = primary;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2 * settings.particles.glowIntensity;
        ctx.setLineDash([5, 3]);
        ctx.lineDashOffset = phase * 10;

        const verticalCenter = rectHeight / 5;
        const leftOffset = -gridSize * 0.5;

        for (let i = -1; i <= 1; i += 0.5) {
            ctx.beginPath();
            ctx.moveTo(leftOffset + (i * gridSize), verticalCenter - gridSize);
            ctx.lineTo(leftOffset + (i * gridSize), verticalCenter + gridSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(leftOffset - gridSize, verticalCenter + (i * gridSize));
            ctx.lineTo(leftOffset + gridSize, verticalCenter + (i * gridSize));
            ctx.stroke();
        }
        ctx.restore();
    }

    // 6. Interactive energy pulse on hover/select
    if (node.selected || node.mouseOver) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const pulse = 0.5 + 0.5 * Math.sin(phase * 3);

        const pulseGradient = ctx.createRadialGradient(
            rectWidth / 2, rectHeight / 2, 0,
            rectWidth / 2, rectHeight / 2, Math.max(rectWidth, rectHeight) * 0.7,
        );
        pulseGradient.addColorStop(0, `rgba(255,255,255,${0.15 * pulse})`);
        pulseGradient.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = pulseGradient;
        roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
        ctx.fill();

        ctx.strokeStyle = `rgba(255,255,255,${0.7 * pulse})`;
        ctx.lineWidth = baseLineWidth * 2;
        ctx.shadowColor = `rgba(255,255,255,${0.5 * pulse})`;
        ctx.shadowBlur = 15 * intensity;
        roundedRect(ctx, 0, 0, rectWidth, rectHeight, radius);
        ctx.stroke();
        ctx.restore();
    }

    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
}

// =============================================================================
// 3. Cosmic Ripple — faithful port of original cosmicRipple
// =============================================================================

export function cosmicRipple(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string,
): void {
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, animationSize } = settings.quality;
    const { phase, direction, intensity } = settings.animation;

    const centerX = node.size[0] / 2;
    const centerY = node.size[1] / 2;
    const rings = 5;
    const maxRadius = Math.max(1, Math.min(node.size[0], node.size[1]) * 0.7 * animationSize);
    const rippleSpeed = 0.8;
    const scaledTime = phase;

    // Draw ripple rings
    for (let i = 0; i < rings; i++) {
        const ripplePhase = (scaledTime * rippleSpeed - i * 0.2) % 1;
        const ringRadius = Math.max(5, maxRadius * ripplePhase);

        if (ringRadius > 5 && ringRadius < maxRadius) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);

            const gradient = ctx.createLinearGradient(
                centerX - ringRadius, centerY,
                centerX + ringRadius, centerY,
            );

            const alpha = Math.max(0, 1 - ripplePhase);
            gradient.addColorStop(0, withAlpha(secondary, alpha * 0.8));
            gradient.addColorStop(0.5, withAlpha(primary, alpha));
            gradient.addColorStop(1, withAlpha(accent, alpha * 0.8));

            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(1, 3 * intensity * (1 - ripplePhase));
            ctx.shadowColor = withAlpha(secondary, 0.5);
            ctx.shadowBlur = Math.max(2, 15 * (1 - ripplePhase) * glowIntensity);
            ctx.stroke();
        }
    }

    // Corona particles
    if (settings.particles.showParticles) {
        const pIntensity = settings.particles.intensity;
        const pDensity = settings.particles.density;
        const pSize = settings.particles.size;
        const pGlow = settings.particles.glowIntensity;
        const pSpeed = settings.particles.speed;
        const baseParticleCount = Math.min(100, 30 + Math.floor(pIntensity * 20));
        const particleCount = Math.floor(baseParticleCount * pDensity);
        const coronaRadius = Math.max(1, Math.max(node.size[0], node.size[1]) * 0.7);

        for (let i = 0; i < particleCount; i++) {
            ctx.save();
            const angle = ((i / particleCount) * Math.PI * 2) + (particleTime * pSpeed * direction);
            const spread = Math.max(0.1, 0.8 + Math.sin(particleTime * 0.5 + i) * 0.2 * pIntensity);
            const x = (Math.cos(angle) * coronaRadius * spread) + centerX;
            const y = (Math.sin(angle) * coronaRadius * spread) + centerY;
            const baseSize = 2 * pSize;
            const size = Math.max(1, baseSize + Math.sin(particleTime * 1.5 + i) * 1.5 * pIntensity);
            const particleColor = getParticleColor(i, particleTime, particleCount);

            // Trail glow
            const trailSize = Math.max(1, size * 2);
            const trailGradient = ctx.createRadialGradient(x, y, 0, x, y, trailSize);
            trailGradient.addColorStop(0, withAlpha(particleColor, 0.7 * pGlow));
            trailGradient.addColorStop(1, withAlpha(particleColor, 0));

            ctx.fillStyle = trailGradient;
            ctx.shadowColor = withAlpha(particleColor, pGlow * 0.5);
            ctx.shadowBlur = 10 * pGlow;
            ctx.beginPath();
            ctx.arc(x, y, trailSize, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = withAlpha(particleColor, 0.7);
            ctx.shadowColor = withAlpha(particleColor, pGlow);
            ctx.shadowBlur = 15 * pGlow;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }

    ctx.globalAlpha = 1;
}

// =============================================================================
// 4. Flower of Life — faithful port of original flowerOfLife
// =============================================================================

export function flowerOfLife(
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    settings: NodeEffectSettings,
    particleTime: number,
    getParticleColor: (index: number, time: number, count: number) => string,
): void {
    const { primary, secondary, accent } = settings.colors;
    const { glowIntensity, quality, animationSize } = settings.quality;
    const { phase, intensity } = settings.animation;

    const centerX = node.size[0] / 2;
    const centerY = node.size[1] / 2;

    const baseRadius = Math.min(node.size[0], node.size[1]) * 0.056 * intensity * animationSize;
    const layers = Math.max(2, Math.floor(quality * 2));
    const rotationSpeed = 0.2;
    const pulseSpeed = 1.5;

    ctx.save();

    // Calculate all pattern points
    const rotation = phase * rotationSpeed;
    const pulse = 0.8 + Math.sin(phase * pulseSpeed) * 0.2;

    interface PatternPoint { x: number; y: number; layer?: number; index?: number }
    const patternPoints: PatternPoint[] = [{ x: centerX, y: centerY }];

    for (let layer = 1; layer <= layers; layer++) {
        const numCircles = layer * 6;
        const layerRadius = baseRadius * 2;

        for (let i = 0; i < numCircles; i++) {
            const angle = (i / numCircles) * Math.PI * 2 + rotation;
            const x = centerX + Math.cos(angle) * layerRadius * layer;
            const y = centerY + Math.sin(angle) * layerRadius * layer;
            patternPoints.push({ x, y, layer, index: i });
        }
    }

    // Draw central circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = primary;
    ctx.lineWidth = 2;
    ctx.shadowColor = primary;
    ctx.shadowBlur = 15 * intensity * glowIntensity;
    ctx.stroke();

    // Draw Flower of Life pattern
    for (let i = 1; i < patternPoints.length; i++) {
        const point = patternPoints[i]!;
        const layer = point.layer!;
        const index = point.index!;

        // Connecting lines
        if (i > 1 && index > 0) {
            const prevPoint = patternPoints[i - 1]!;
            ctx.beginPath();
            ctx.moveTo(prevPoint.x, prevPoint.y);
            ctx.lineTo(point.x, point.y);
            ctx.strokeStyle = secondary;
            ctx.globalAlpha = 0.3 * pulse;
            ctx.stroke();
        }

        // Circle at each point
        ctx.beginPath();
        ctx.arc(point.x, point.y, baseRadius * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = index % 2 === 0 ? secondary : accent;
        ctx.globalAlpha = 1 - (layer / (layers + 1));
        ctx.stroke();
    }

    // Sacred geometry hexagonal overlay
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + rotation;
        const x = centerX + Math.cos(angle) * baseRadius * layers * 2;
        const y = centerY + Math.sin(angle) * baseRadius * layers * 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = primary;
    ctx.globalAlpha = 0.3;
    ctx.stroke();

    // Central energy core
    const coreGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, baseRadius * 2,
    );
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 * pulse})`);
    coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${0.2 * pulse})`);
    coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = coreGradient;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Per-point particles
    if (settings.particles.showParticles) {
        const pDensity = settings.particles.density;
        const pIntensity = settings.particles.intensity;
        const pSize = settings.particles.size;
        const pGlow = settings.particles.glowIntensity;
        const pSpeed = settings.particles.speed;

        patternPoints.forEach((point, pi) => {
            const particleCount = Math.floor(5 * pDensity * pIntensity);
            for (let p = 0; p < particleCount; p++) {
                const particleAngle = (p / particleCount) * Math.PI * 2 + particleTime * 2 * pIntensity;
                const px = point.x + Math.cos(particleAngle) * (baseRadius * 0.5 * pIntensity);
                const py = point.y + Math.sin(particleAngle) * (baseRadius * 0.5 * pIntensity);

                const particleColor = getParticleColor(
                    pi * particleCount + p,
                    particleTime * pSpeed,
                    patternPoints.length * particleCount,
                );

                const dotSize = Math.max(0.5, 1.5 * pSize * (0.8 + Math.sin(particleTime * 3 + p) * 0.2));
                ctx.beginPath();
                ctx.arc(px, py, dotSize, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.shadowColor = withAlpha(particleColor, pGlow);
                ctx.shadowBlur = 5 * pGlow;
                ctx.globalAlpha = 0.6 * pGlow;
                ctx.fill();
            }
        });
    }

    ctx.restore();
    ctx.globalAlpha = 1;
}

// =============================================================================
// Exports
// =============================================================================

export function getNodeEffect(style: number): typeof gentlePulse {
    switch (style) {
        case 1: return gentlePulse;
        case 2: return neonNexus;
        case 3: return cosmicRipple;
        case 4: return flowerOfLife;
        default: return gentlePulse;
    }
}
