/**
 * Static Link Renderers — 9 non-animated (phase-frozen) effects.
 *
 * Each static renderer draws the same visual patterns as its animated
 * counterpart but uses a fixed phase for positioning instead of time-based
 * animation.
 *
 * Ported from original link_animations.js StaticRenderers (lines 1820–2401).
 *
 * @module effects/static-renderers
 */

import { MarkerShapes, shapeNeedsFill } from '@/renderers/marker-shapes';
import { createFlowField, createCrystal } from '@/renderers/render-utils';
import { getLinkColor, getSecondaryColor, getAccentColor, enhanceColor, validateHexColor, getCustomLinkColors } from '@/utils/color-manager';
import { SACRED } from '@/core/config';
import { L } from '@/core/settings';
import type { RenderItem } from './animated-renderers';

// =============================================================================
// 1. Sacred Flow Static
// =============================================================================

function renderStatic1(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness * 1.5;
            ctx.shadowColor = primaryColor;
            ctx.shadowBlur = glowIntensity;
            r.draw(ctx, start, end, primaryColor, thickness, true);
        }

        const points = Math.floor(SACRED.TRINITY * quality);
        for (let i = 0; i <= points; i++) {
            const t = i / points;
            const pos = r.getPoint(start, end, t, true);
            const flow = createFlowField(t, phase);
            const x = pos[0] + flow.x * Math.sin(t * Math.PI + phase) * 0.3;
            const y = pos[1] + flow.y * Math.sin(t * Math.PI + phase) * 0.3;

            ctx.beginPath();
            ctx.arc(x, y, thickness * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = accentColor;
            ctx.shadowColor = linkStyle === 'hidden' ? accentColor : primaryColor;
            ctx.shadowBlur = linkStyle === 'hidden' ? glowIntensity * 0.7 : glowIntensity;
            ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 2. Crystal Stream Static
// =============================================================================

function renderStatic2(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);

        if (linkStyle !== 'hidden') {
            r.draw(ctx, start, end, primaryColor, thickness, true);
        }

        const crystals = Math.floor(SACRED.HARMONY * quality);
        for (let i = 0; i < crystals; i++) {
            const t = i / crystals;
            const pos = r.getPoint(start, end, t, true);
            const size = thickness * 3 * (1 + Math.sin(phase + t * Math.PI * 2) * 0.2);

            ctx.shadowColor = secondaryColor;
            ctx.shadowBlur = glowIntensity;
            createCrystal(ctx, pos[0], pos[1], size, t * Math.PI * 2 + phase * 0.2, primaryColor);
        }
    });
}

// =============================================================================
// 3. Quantum Field Static
// =============================================================================

function renderStatic3(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0.3;
            r.draw(ctx, start, end, primaryColor, thickness, true);
            ctx.globalAlpha = 1;
        }

        const fieldLines = SACRED.QUANTUM;
        const points = Math.floor(SACRED.COMPLETION * quality);

        for (let f = 0; f < fieldLines; f++) {
            ctx.beginPath();
            const fieldPhase = phase + (f * Math.PI * 2) / fieldLines;

            for (let i = 0; i <= points; i++) {
                const t = i / points;
                const pos = r.getPoint(start, end, t, true);
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
// 4. Cosmic Weave Static
// =============================================================================

function renderStatic4(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;
    const direction = L.direction;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0;
            r.draw(ctx, end, start, primaryColor, thickness, true);
            ctx.globalAlpha = 1;
        }

        const strands = SACRED.TRINITY;
        const points = Math.floor(SACRED.COMPLETION * quality);

        for (let s = 0; s < strands; s++) {
            ctx.beginPath();
            const strandPhase = phase + (s * Math.PI * 2) / strands;

            for (let i = 0; i <= points; i++) {
                const t = direction > 0 ? i / points : 1 - (i / points);
                const pos = r.getPoint(end, start, t, true);
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
// 5. Energy Pulse Static
// =============================================================================

function renderStatic5(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0.3;
            r.draw(ctx, start, end, primaryColor, thickness, true);
            ctx.globalAlpha = 1;
        }

        const pulseCount = Math.floor(SACRED.TRINITY * quality);
        for (let i = 0; i < pulseCount; i++) {
            const t = i / pulseCount;
            const pulseSize = thickness * 2 * (1 + Math.sin(phase + t * Math.PI * 2) * 0.3);
            const pos = r.getPoint(start, end, t, true);

            ctx.beginPath();
            ctx.arc(pos[0], pos[1], pulseSize, 0, Math.PI * 2);
            ctx.fillStyle = secondaryColor;
            ctx.shadowColor = secondaryColor;
            ctx.shadowBlur = glowIntensity * 2;
            ctx.globalAlpha = 0.4 + Math.sin(phase + t * Math.PI * 2) * 0.2;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 6. DNA Helix Static
// =============================================================================

function renderStatic6(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        const points = Math.floor(SACRED.COMPLETION * quality * 2);
        const helixRadius = 10;
        const rotations = 4;

        for (let strand = 0; strand < 2; strand++) {
            ctx.beginPath();
            for (let i = 0; i <= points; i++) {
                const t = i / points;
                const baseAngle = t * Math.PI * rotations * 2 + phase;
                const pos = r.getPoint(start, end, t, true);
                const hx = Math.cos(baseAngle) * helixRadius * (strand === 0 ? 1 : -1);
                const hy = Math.sin(baseAngle) * helixRadius * (strand === 0 ? 1 : -1);
                const x = pos[0] + hx;
                const y = pos[1] + hy;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = strand === 0 ? primaryColor : secondaryColor;
            ctx.lineWidth = thickness * 1.2;
            ctx.shadowColor = strand === 0 ? primaryColor : secondaryColor;
            ctx.shadowBlur = glowIntensity;
            ctx.stroke();
        }

        // Connecting bonds
        const bonds = rotations * 4;
        ctx.strokeStyle = accentColor;
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.lineWidth = thickness * 0.8;
        ctx.globalAlpha = 0.8;

        for (let b = 0; b <= bonds; b++) {
            const t = b / bonds;
            const baseAngle = t * Math.PI * rotations * 2 + phase;
            const pos = r.getPoint(start, end, t, true);
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
// 7. Lava Flow Static
// =============================================================================

function renderStatic7(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        const tubeWidth = thickness * 7;
        const flowWidth = thickness * 5;
        const turbulenceScale = 15;
        const pts = Math.floor(SACRED.TRINITY * quality * 12);

        // Outer tube
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
            const t = i / pts;
            const pos = r.getPoint(start, end, t, true);
            const noise = Math.sin(t * Math.PI * 3 + phase) * turbulenceScale;
            const x = pos[0];
            const y = pos[1] + noise * Math.sin(phase * 0.8 + t * Math.PI * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = secondaryColor;
        ctx.globalAlpha = 0;
        ctx.lineWidth = tubeWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Lava flow
        ctx.beginPath();
        for (let i = 0; i <= pts; i++) {
            const t = i / pts;
            const pos = r.getPoint(start, end, t, true);
            const noise = Math.sin(t * Math.PI * 3 + phase * 1.2) * (turbulenceScale * 0.7);
            const x = pos[0];
            const y = pos[1] + noise * Math.sin(phase * 0.6 + t * Math.PI * 2);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }

        const gradient = ctx.createLinearGradient(start[0], start[1], end[0], end[1]);
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
    });
}

// =============================================================================
// 8. Stellar Plasma Static
// =============================================================================

function renderStatic8(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = getLinkColor(defaultColor);
        const secondaryColor = getSecondaryColor(defaultColor);
        const accentColor = getAccentColor(defaultColor);

        if (linkStyle !== 'hidden') {
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = thickness;
            ctx.globalAlpha = 0.3;
            r.draw(ctx, start, end, primaryColor, thickness, true);
            ctx.globalAlpha = 1;
        }

        const length = r.getLength(start, end);
        const maxSegments = Math.min(Math.floor(length / 30), 20);
        const segments = Math.max(5, Math.floor(maxSegments * quality * 0.5));
        const waveAmplitude = 8;
        const phaseOffset = phase * 0.5;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pos = r.getPoint(start, end, t, true);
            const wave = Math.sin(t * Math.PI * 2 + phaseOffset) * waveAmplitude;
            const size = thickness * (0.8 + Math.sin(phase + t * Math.PI) * 0.2);

            ctx.beginPath();
            ctx.arc(pos[0], pos[1] + wave, size, 0, Math.PI * 2);
            ctx.fillStyle = t < 0.5 ? primaryColor : secondaryColor;
            ctx.shadowColor = t < 0.5 ? primaryColor : secondaryColor;
            ctx.shadowBlur = glowIntensity;
            ctx.globalAlpha = 0.6;
            ctx.fill();

            if (i % 3 === 0 && quality > 1) {
                const particleSize = size * 0.4;
                ctx.beginPath();
                ctx.arc(pos[0], pos[1] + wave * 1.2, particleSize, 0, Math.PI * 2);
                ctx.fillStyle = accentColor;
                ctx.shadowColor = accentColor;
                ctx.shadowBlur = glowIntensity * 0.5;
                ctx.globalAlpha = 0.4;
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    });
}

// =============================================================================
// 9. Classic Flow Static (with markers)
// =============================================================================

function renderStatic9(ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number): void {
    const thickness = L.thickness;
    const glowIntensity = L.glowIntensity;
    const quality = L.quality;
    const markerEnabled = L.markerEnabled;
    const markerShape = L.markerShape;
    const markerSize = L.markerSize;
    const markerColorMode = L.markerColorMode;
    const markerColor = L.markerColor;
    const markerGlow = L.markerGlow;
    const markerEffect = L.markerEffects;
    const colorScheme = L.colorScheme;
    const particleDensity = L.particleDensity;
    const shadowBlur = L.shadowBlur;
    const shadowOffset = L.shadowOffset;

    items.forEach(({ start, end, defaultColor, linkStyle, path: r }) => {
        const primaryColor = enhanceColor(getLinkColor(defaultColor), colorScheme);

        if (linkStyle !== 'hidden') {
            const linkColor = getCustomLinkColors() ? getLinkColor(defaultColor) : defaultColor;
            const enhancedColor = enhanceColor(linkColor, colorScheme);
            ctx.lineWidth = thickness;

            const linkShadowEnabled = L.linkShadowEnabled;
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

        if (markerEnabled && markerShape !== 'none') {
            let effectiveMarkerColor: string;
            if (markerColorMode === 'custom') {
                effectiveMarkerColor = enhanceColor(validateHexColor(markerColor) || primaryColor, colorScheme);
            } else if (markerColorMode === 'default') {
                effectiveMarkerColor = enhanceColor(defaultColor, colorScheme);
            } else {
                effectiveMarkerColor = primaryColor;
            }

            const numMarks = Math.floor(SACRED.TRINITY * quality * markerSize * particleDensity * 0.5);
            const markSize = 3 * markerSize;

            for (let i = 0; i < numMarks; i++) {
                const baseT = i / numMarks;
                const t = baseT;
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
                    const markerShadowEnabled = L.markerShadowEnabled;
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

const STATIC_RENDERERS: Record<number, (ctx: CanvasRenderingContext2D, items: RenderItem[], phase: number) => void> = {
    1: renderStatic1,
    2: renderStatic2,
    3: renderStatic3,
    4: renderStatic4,
    5: renderStatic5,
    6: renderStatic6,
    7: renderStatic7,
    8: renderStatic8,
    9: renderStatic9,
};

/** Dispatch to the correct static renderer by style number */
export function renderStaticStyle(
    ctx: CanvasRenderingContext2D,
    items: RenderItem[],
    style: number,
    phase: number,
): void {
    const renderer = STATIC_RENDERERS[style];
    if (renderer) {
        renderer(ctx, items, phase);
    }
}
