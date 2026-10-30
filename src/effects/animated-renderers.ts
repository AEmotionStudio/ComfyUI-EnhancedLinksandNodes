/**
 * Animated Link Renderers — 9 animation effects for link connections.
 *
 * Each function renders one animation style onto the canvas, using
 * LinkRenderers for path geometry and ColorManager for color resolution.
 *
 * Ported from original link_animations.js renderSacredFlow..renderClassicFlow
 * (lines 2553–3359).
 *
 * @module effects/animated-renderers
 */

import { app } from '/scripts/app.js';
import { getLinkRenderer, type LinkPoint } from '@/renderers/link-renderers';
import { MarkerShapes, shapeNeedsFill } from '@/renderers/marker-shapes';
import { createFlowField } from '@/renderers/render-utils';
import { getLinkColor, getSecondaryColor, getAccentColor, enhanceColor, validateHexColor, getCustomLinkColors } from '@/utils/color-manager';
import { SACRED } from '@/core/config';

// =============================================================================
// Types
// =============================================================================

export interface RenderItem {
    start: LinkPoint;
    end: LinkPoint;
    color: string;
    defaultColor: string;
    linkStyle: string;
    linkId: string;
    isStatic: boolean;
}

interface AnimationState {
    direction: number;
    totalTime: number;
    phase: number;
}

// =============================================================================
// Helpers
// =============================================================================

function setting<T>(key: string, def: T): T {
    return (app.ui.settings.getSettingValue(key) ?? def) as T;
}

// =============================================================================
// 1. Sacred Flow
// =============================================================================

function renderSacredFlow(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    phase: number,
    state: AnimationState,
): void {
    const direction = state.direction;
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const particleDensity = setting('🔗 Enhanced Links.Particle.Density', 1);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const colorScheme = setting<string>('🔗 Enhanced Links.Color.Scheme', 'default');
    const speedReductionFactor = 0.25;
    const continuousPhase = (state.totalTime || 0) * animSpeed * speedReductionFactor;

    ctx.shadowBlur = glowIntensity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const baseColor = getCustomLinkColors() ? getLinkColor(defaultColor) : defaultColor;
        const primaryColor = enhanceColor(baseColor, colorScheme);
        const accentColor = enhanceColor(getAccentColor(defaultColor), colorScheme);

        // Draw flow path
        ctx.beginPath();
        const points = Math.floor(SACRED.TRINITY * quality * particleDensity);
        for (let i = 0; i <= points; i++) {
            const baseT = i / points;
            const t = direction > 0 ? baseT : (1 - baseT);
            const flow = createFlowField(t, continuousPhase);
            const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
            const x = pos[0] + flow.x * Math.sin(t * Math.PI + continuousPhase) * 0.5;
            const y = pos[1] + flow.y * Math.sin(t * Math.PI + continuousPhase) * 0.5;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = thickness;
        ctx.shadowColor = primaryColor;
        ctx.shadowBlur = glowIntensity;
        ctx.globalAlpha = 1;
        ctx.stroke();

        // Draw particles
        const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity);
        const particleSize = thickness * 0.75;
        for (let i = 0; i < particleCount; i++) {
            const baseT = i / particleCount;
            const t = direction > 0
                ? ((baseT + continuousPhase * 0.5) % 1)
                : (1 - ((baseT + continuousPhase * 0.5) % 1));
            const boundedT = Math.max(0, Math.min(1, t));
            const flow = createFlowField(boundedT, continuousPhase);
            const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
            const x = pos[0] + flow.x * Math.sin(boundedT * Math.PI + continuousPhase) * 0.5;
            const y = pos[1] + flow.y * Math.sin(boundedT * Math.PI + continuousPhase) * 0.5;

            ctx.beginPath();
            ctx.arc(x, y, particleSize, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.shadowColor = accentColor;
            ctx.shadowBlur = glowIntensity;
            ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    });

    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.shadowBlur = 0;
}

// =============================================================================
// 2. Crystal Stream
// =============================================================================

function renderCrystalStream(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    _phase: number,
    state: AnimationState,
): void {
    const direction = state.direction;
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const particleDensity = setting('🔗 Enhanced Links.Particle.Density', 1);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const continuousPhase = (state.totalTime || 0) * animSpeed;

    // Import createCrystal inline to avoid circular deps
    const createCrystal = (cx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, color: string) => {
        cx.save();
        cx.translate(x, y);
        cx.rotate(rotation);
        cx.beginPath();
        for (let i = 0; i < SACRED.HARMONY; i++) {
            const angle = (i / SACRED.HARMONY) * Math.PI * 2;
            const px = Math.cos(angle) * size;
            const py = Math.sin(angle) * size;
            i === 0 ? cx.moveTo(px, py) : cx.lineTo(px, py);
        }
        cx.closePath();
        cx.strokeStyle = color;
        cx.stroke();
        cx.restore();
    };

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0.3;
            r.draw(ctx, start, end, primaryColor, thickness, isStatic);
            ctx.globalAlpha = 1;
        }

        const crystals = Math.floor(SACRED.HARMONY * quality * particleDensity);
        for (let i = 0; i < crystals; i++) {
            const baseT = i / crystals;
            const t = direction > 0
                ? ((baseT + continuousPhase) % 1)
                : (1 - ((baseT + continuousPhase) % 1));
            const boundedT = Math.max(0, Math.min(1, t));
            const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
            const size = 5 * thickness * (1 + Math.sin(continuousPhase + boundedT * Math.PI));

            ctx.shadowColor = secondaryColor;
            ctx.shadowBlur = glowIntensity;
            createCrystal(ctx, pos[0], pos[1], size, boundedT * Math.PI * 2 + continuousPhase, primaryColor);
        }
    });
}

// =============================================================================
// 3. Quantum Field
// =============================================================================

function renderQuantumField(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    phase: number,
    _state: AnimationState,
): void {
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const particleDensity = setting('🔗 Enhanced Links.Particle.Density', 1);

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0.3;
            r.draw(ctx, start, end, primaryColor, thickness, isStatic);
            ctx.globalAlpha = 1;
        }

        const fieldLines = SACRED.QUANTUM;
        const points = Math.floor(SACRED.COMPLETION * quality * particleDensity);

        for (let f = 0; f < fieldLines; f++) {
            ctx.beginPath();
            const fieldPhase = phase + (f * Math.PI * 2) / fieldLines;

            for (let i = 0; i <= points; i++) {
                const t = i / points;
                const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
                const uncertainty = 8 * Math.sin(t * Math.PI * 2 + fieldPhase);
                const x = pos[0] + uncertainty * Math.cos(fieldPhase);
                const y = pos[1] + uncertainty * Math.sin(fieldPhase);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }

            ctx.strokeStyle = f % 2 === 0 ? primaryColor : secondaryColor;
            ctx.lineWidth = thickness * 0.5;
            ctx.shadowColor = f % 2 === 0 ? primaryColor : secondaryColor;
            ctx.shadowBlur = glowIntensity;
            ctx.globalAlpha = 0.3;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 4. Cosmic Weave
// =============================================================================

function renderCosmicWeave(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    _phase: number,
    state: AnimationState,
): void {
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const continuousPhase = (state.totalTime || 0) * animSpeed;
    const direction = state.direction;

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0;
            r.draw(ctx, end, start, primaryColor, thickness, isStatic);
            ctx.globalAlpha = 1;
        }

        const strands = SACRED.TRINITY;
        const points = Math.floor(SACRED.COMPLETION * quality);

        for (let s = 0; s < strands; s++) {
            ctx.beginPath();
            const strandPhase = continuousPhase + (s * Math.PI * 2) / strands;

            for (let i = 0; i <= points; i++) {
                const t = direction > 0 ? i / points : 1 - (i / points);
                const pos = r.getPoint(end, start, t, isStatic ? 0.3 : 0.5);
                const weave = Math.sin(t * Math.PI * 6 + strandPhase * direction) * 10;
                const x = pos[0] + weave * Math.cos(strandPhase);
                const y = pos[1] + weave * Math.sin(strandPhase);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }

            const strandColor = [primaryColor, secondaryColor, accentColor][s % 3]!;
            ctx.strokeStyle = strandColor;
            ctx.lineWidth = thickness * 0.7;
            ctx.shadowColor = strandColor;
            ctx.shadowBlur = glowIntensity;
            ctx.globalAlpha = 0.5;
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 5. Energy Pulse
// =============================================================================

function renderEnergyPulse(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    _phase: number,
    state: AnimationState,
): void {
    const direction = state.direction;
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const speedReductionFactor = 0.25;
    const continuousPhase = (state.totalTime || 0) * animSpeed * speedReductionFactor;

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0.3;
            r.draw(ctx, start, end, primaryColor, thickness, isStatic);
            ctx.globalAlpha = 1;
        }

        const pulseCount = Math.floor(SACRED.TRINITY * quality);
        for (let i = 0; i < pulseCount; i++) {
            const baseT = i / pulseCount;
            const t = direction > 0
                ? ((baseT + continuousPhase) % 1)
                : (1 - ((baseT + continuousPhase) % 1));
            const boundedT = Math.max(0, Math.min(1, t));
            const pulseSize = thickness * 2 * (1 - boundedT);
            const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);

            ctx.beginPath();
            ctx.arc(pos[0], pos[1], pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = secondaryColor;
            ctx.shadowColor = secondaryColor;
            ctx.shadowBlur = glowIntensity * 2;
            ctx.globalAlpha = 0.5 * (1 - boundedT);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 6. DNA Helix
// =============================================================================

function renderDNAHelix(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    _phase: number,
    state: AnimationState,
): void {
    const direction = -state.direction; // Negate to reverse flow
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const continuousPhase = (state.totalTime || 0) * animSpeed;

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const points = Math.floor(SACRED.COMPLETION * quality * 2);
        const helixRadius = 10;
        const rotations = 4;

        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        const actualStart = direction > 0 ? start : end;
        const actualEnd = direction > 0 ? end : start;

        const strand1Points: { x: number; y: number }[] = [];
        const strand2Points: { x: number; y: number }[] = [];

        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const baseAngle = t * Math.PI * rotations * 2 + continuousPhase;
            const pos = r.getPoint(actualStart, actualEnd, t, isStatic ? 0.3 : 0.5);
            const hx = Math.cos(baseAngle) * helixRadius;
            const hy = Math.sin(baseAngle) * helixRadius;
            strand1Points.push({ x: pos[0] + hx, y: pos[1] + hy });
            strand2Points.push({ x: pos[0] - hx, y: pos[1] - hy });
        }

        // Draw strands
        [strand1Points, strand2Points].forEach((strandPoints, index) => {
            ctx.beginPath();
            strandPoints.forEach((point, i) => {
                i === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
            });
            ctx.strokeStyle = index === 0 ? primaryColor : secondaryColor;
            ctx.lineWidth = thickness;
            ctx.shadowColor = index === 0 ? primaryColor : secondaryColor;
            ctx.shadowBlur = glowIntensity;
            ctx.stroke();
        });

        // Draw connecting bonds
        const bonds = rotations * 4;
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.globalAlpha = 0.6;

        for (let b = 0; b < bonds; b++) {
            const t = b / bonds;
            const baseAngle = t * Math.PI * rotations * 2 + continuousPhase;
            const pos = r.getPoint(actualStart, actualEnd, t, isStatic ? 0.3 : 0.5);
            const x1 = pos[0] + Math.cos(baseAngle) * helixRadius;
            const y1 = pos[1] + Math.sin(baseAngle) * helixRadius;
            const x2 = pos[0] - Math.cos(baseAngle) * helixRadius;
            const y2 = pos[1] - Math.sin(baseAngle) * helixRadius;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 7. Lava Flow
// =============================================================================

function renderLavaFlow(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    phase: number,
    state: AnimationState,
): void {
    const direction = state.direction;
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const particleDensity = setting('🔗 Enhanced Links.Particle.Density', 1);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const continuousPhase = (state.totalTime || 0) * animSpeed;

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0;
            r.draw(ctx, start, end, primaryColor, thickness, isStatic);
            ctx.globalAlpha = 1;
        }

        const tubeWidth = thickness * 7;
        const flowWidth = thickness * 5;
        const turbulenceScale = 20;
        const pts = Math.floor(SACRED.TRINITY * quality * 12);

        // Outer tube
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
            const t = i / pts;
            const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
            const noise = Math.sin(t * Math.PI * 3 + continuousPhase) * turbulenceScale;
            const x = pos[0];
            const y = pos[1] + noise * Math.sin(continuousPhase * 0.8 + t * Math.PI * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = secondaryColor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = tubeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Lava flow
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
            const t = i / pts;
            const pos = r.getPoint(start, end, t, isStatic ? 0.3 : 0.5);
            const noise = Math.sin(t * Math.PI * 3 + continuousPhase * 1.2) * (turbulenceScale * 0.7);
            const x = pos[0];
            const y = pos[1] + noise * Math.sin(continuousPhase * 0.6 + t * Math.PI * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        const gradient = ctx.createLinearGradient(
            direction > 0 ? start[0] : end[0],
            direction > 0 ? start[1] : end[1],
            direction > 0 ? end[0] : start[0],
            direction > 0 ? end[1] : start[1],
        );
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondaryColor);
        gradient.addColorStop(1, accentColor);

        ctx.globalAlpha = 1;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = flowWidth;
        ctx.lineCap = 'round';
        ctx.shadowColor = secondaryColor;
        ctx.shadowBlur = glowIntensity * 1.5;
        ctx.stroke();

        // Particles
        const particleCount = Math.floor(SACRED.TRINITY * quality * particleDensity * 3);
        for (let i = 0; i < particleCount; i++) {
            const baseT = i / particleCount;
            const t = direction > 0
                ? ((baseT + continuousPhase * 0.5) % 1)
                : (1 - ((baseT + continuousPhase * 0.5) % 1));
            const boundedT = Math.max(0, Math.min(1, t));
            const pos = r.getPoint(start, end, boundedT, isStatic ? 0.3 : 0.5);
            const noise = Math.sin(boundedT * Math.PI * 3 + continuousPhase) * (turbulenceScale * 0.3);
            const x = pos[0] + Math.sin(boundedT * Math.PI * 2) * (tubeWidth * 0.15);
            const y = pos[1] + noise * Math.sin(continuousPhase + boundedT * Math.PI * 2) +
                Math.cos(boundedT * Math.PI * 3) * (tubeWidth * 0.15);
            const particleSize = thickness * (0.5 + Math.sin(continuousPhase + i) * 0.2);

            ctx.beginPath();
            ctx.arc(x, y, particleSize, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = 0.6 + Math.sin(continuousPhase + i) * 0.4;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 8. Stellar Plasma
// =============================================================================

function renderStellarPlasma(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    _phase: number,
    state: AnimationState,
): void {
    const direction = state.direction;
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const particleDensity = setting('🔗 Enhanced Links.Particle.Density', 1);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const continuousPhase = -(state.totalTime || 0) * animSpeed;

    items.forEach(({ start, end, defaultColor, linkStyle, isStatic }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        const actualStart = direction > 0 ? end : start;
        const actualEnd = direction > 0 ? start : end;
        const length = r.getLength(start, end);
        const segments = Math.floor(length / 20) * quality * particleDensity;

        ctx.save();

        for (let i = 0; i <= segments; i++) {
            const baseT = i / segments;
            const t = baseT;
            const pos = r.getPoint(actualStart, actualEnd, t, isStatic ? 0.3 : 0.5);
            const wavePhase = t * Math.PI * 4 - continuousPhase * direction;
            const wave = Math.sin(wavePhase) * 15;
            const sizePhase = t * Math.PI * 2 - continuousPhase * direction;
            const size = thickness * (0.5 + Math.sin(sizePhase) * 0.5);

            ctx.beginPath();
            ctx.arc(pos[0], pos[1] + wave, size, 0, Math.PI * 2);
            ctx.fillStyle = t < 0.5 ? primaryColor : secondaryColor;
            ctx.shadowColor = t < 0.5 ? primaryColor : secondaryColor;
            ctx.shadowBlur = glowIntensity;
            ctx.globalAlpha = 0.7 - Math.abs(t - 0.5) * 0.3;
            ctx.fill();

            if (i % 3 === 0) {
                const particleT = ((baseT + continuousPhase * 0.5) % 1);
                const boundedPT = Math.max(0, Math.min(1, particleT));
                const particlePos = r.getPoint(actualStart, actualEnd, boundedPT, isStatic ? 0.3 : 0.5);
                const pWavePhase = boundedPT * Math.PI * 4 - continuousPhase * direction;
                const pWave = Math.sin(pWavePhase) * 15;

                ctx.beginPath();
                ctx.arc(particlePos[0], particlePos[1] + pWave, size * 0.5, 0, Math.PI * 2);
                ctx.fillStyle = accentColor;
                ctx.shadowColor = accentColor;
                ctx.shadowBlur = glowIntensity * 0.5;
                ctx.globalAlpha = 0.6 - Math.abs(boundedPT - 0.5) * 0.4;
                ctx.fill();
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 9. Classic Flow (with markers, shadows, effects)
// =============================================================================

function renderClassicFlow(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    phase: number,
    state: AnimationState,
): void {
    const direction = state.direction;
    const quality = setting('🔗 Enhanced Links.Quality', 2);
    const thickness = setting('🔗 Enhanced Links.Thickness', 2);
    const glowIntensity = setting('🔗 Enhanced Links.Glow.Intensity', 10);
    const particleDensity = setting('🔗 Enhanced Links.Particle.Density', 1);
    const animSpeed = setting('🔗 Enhanced Links.Animation.Speed', 1);
    const markerEnabled = setting('🔗 Enhanced Links.Marker.Enabled', true);
    const markerShape = setting<string>('🔗 Enhanced Links.Marker.Shape', 'diamond');
    const markerSize = setting('🔗 Enhanced Links.Marker.Size', 1.5);
    const markerColorMode = setting<string>('🔗 Enhanced Links.Marker.Color.Mode', 'inherit');
    const markerColor = setting<string>('🔗 Enhanced Links.Marker.Color', '#ffffff');
    const markerGlow = setting('🔗 Enhanced Links.Marker.Glow', 10);
    const markerEffect = setting<string>('🔗 Enhanced Links.Marker.Effects', 'none');
    const colorScheme = setting<string>('🔗 Enhanced Links.Color.Scheme', 'default');
    const shadowBlur = setting('🔗 Enhanced Links.Shadow.Blur', 5);
    const shadowOffset = setting('🔗 Enhanced Links.Shadow.Offset', 3);
    const continuousPhase = (state.totalTime || 0) * animSpeed;

    items.forEach(({ start, end, defaultColor, linkStyle }) => {
        const r = getLinkRenderer(linkStyle);
        const primaryColor = enhanceColor(getLinkColor(defaultColor), colorScheme);

        // Draw base link
        if (linkStyle !== 'hidden') {
            const linkColor = getCustomLinkColors() ? getLinkColor(defaultColor) : defaultColor;
            const enhancedColor = enhanceColor(linkColor, colorScheme);
            ctx.lineWidth = thickness;

            // Shadow
            const linkShadowEnabled = setting('🔗 Enhanced Links.Link.Shadow.Enabled', false);
            if (linkShadowEnabled) {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                ctx.shadowBlur = shadowBlur * 4;
                ctx.shadowOffsetX = shadowOffset * 3;
                ctx.shadowOffsetY = shadowOffset * 3;
                ctx.lineWidth = thickness * 1.2;
                r.draw(ctx, start, end, 'rgba(0, 0, 0, 0.95)', thickness * 1.2, true);
            }

            ctx.shadowColor = enhancedColor;
            ctx.shadowBlur = glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.strokeStyle = enhancedColor;
            ctx.lineWidth = thickness;
            r.draw(ctx, start, end, enhancedColor, thickness, true);
        }

        // Draw markers
        if (markerEnabled && markerShape !== 'none') {
            let effectiveMarkerColor: string;
            if (markerColorMode === 'custom') {
                effectiveMarkerColor = enhanceColor(
                    validateHexColor(markerColor) || primaryColor, colorScheme,
                );
            } else if (markerColorMode === 'default') {
                effectiveMarkerColor = enhanceColor(defaultColor, colorScheme);
            } else {
                effectiveMarkerColor = primaryColor;
            }

            const numMarks = Math.floor(SACRED.TRINITY * quality * markerSize * particleDensity * 0.5);
            const markSize = 3 * markerSize;

            for (let i = 0; i < numMarks; i++) {
                const baseT = i / numMarks;
                const t = direction > 0
                    ? ((baseT + continuousPhase * 0.1) % 1)
                    : (1 - ((baseT + continuousPhase * 0.1) % 1));
                const pos = r.getPoint(start, end, t, true);

                let angle = 0;
                if (markerShape === 'arrow') {
                    const nextT = Math.min(t + 0.01, 1);
                    const nextPos = r.getPoint(start, end, nextT, true);
                    angle = Math.atan2(nextPos[1] - pos[1], nextPos[0] - pos[0]);
                }

                let effectColor = effectiveMarkerColor;
                let opacity = 1;

                switch (markerEffect) {
                    case 'pulse':
                        opacity = 0.5 + Math.sin(phase + t * Math.PI * 2) * 0.5;
                        break;
                    case 'fade':
                        opacity = 1 - t;
                        break;
                    case 'rainbow': {
                        const hue = ((t * 360) + (phase * 50)) % 360;
                        effectColor = enhanceColor(`hsl(${hue}, 100%, 50%)`, colorScheme);
                        break;
                    }
                }

                const shapeFn = MarkerShapes[markerShape];
                if (shapeFn) {
                    // Shadow
                    const markerShadowEnabled = setting('🔗 Enhanced Links.Marker.Shadow.Enabled', false);
                    if (markerShadowEnabled) {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
                        ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
                        ctx.shadowBlur = shadowBlur * 4;
                        ctx.shadowOffsetX = shadowOffset * 3;
                        ctx.shadowOffsetY = shadowOffset * 3;
                        ctx.globalAlpha = opacity;
                        shapeFn(ctx, pos[0], pos[1], markSize * 1.2, angle);
                        if (shapeNeedsFill(markerShape)) ctx.fill();
                    }

                    ctx.shadowColor = markerEffect === 'rainbow' ? primaryColor : effectColor;
                    ctx.shadowBlur = markerGlow;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;

                    if (markerShape === 'cross') ctx.strokeStyle = effectColor;
                    ctx.fillStyle = effectColor;
                    ctx.globalAlpha = opacity;
                    shapeFn(ctx, pos[0], pos[1], markSize, angle);
                    if (shapeNeedsFill(markerShape)) ctx.fill();
                }
            }
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// Dispatcher
// =============================================================================

const ANIMATED_RENDERERS: Record<number, typeof renderSacredFlow> = {
    1: renderSacredFlow,
    2: renderCrystalStream,
    3: renderQuantumField,
    4: renderCosmicWeave,
    5: renderEnergyPulse,
    6: renderDNAHelix,
    7: renderLavaFlow,
    8: renderStellarPlasma,
    9: renderClassicFlow,
};

/** Dispatch to the correct animated renderer by style number */
export function renderAnimatedStyle(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    style: number,
    phase: number,
    state: AnimationState,
): void {
    const renderer = ANIMATED_RENDERERS[style];
    if (renderer) {
        renderer(ctx, items, phase, state);
    }
}
