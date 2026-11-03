/**
 * The link animations held still: Static Mode, a paused run, reduced motion.
 * v1's nine are each v1's own still design, posed at a fixed phase, and drawn
 * segment by segment along the real path, counted per link like the moving
 * ones (animations.ts). Classic Flow's still markers are drawn by styles.ts.
 * v3's own three hold their motion's pose at that phase, nothing flowed.
 *
 * Ported from v1's StaticRenderers (old_link_animations.js:1820-2401). Cosmic
 * Weave follows the link's own path rather than a curve from its other end,
 * Lava Flow's core ripples across the path, and every count is at least one.
 *
 * @module links/stills
 */

import { L } from '@/core/settings';
import { MOVING, SACRED, createCrystal, linkGradient, ts, vertices } from './animations';
import type { Segment } from './pipeline';

/** The point and direction at() writes. */
const here = new Float64Array(4);

/** Runs `each` for each of a link's `count` elements at fractions i / count that falls on segment s, at its point. */
function elements(s: Segment, count: number, last: boolean, each: (T: number, i: number) => void): void {
    for (let i = 0; i < count + (last ? 1 : 0); i++) {
        const T = i / count;
        const u = s.local(T);
        if (!s.within(u)) continue;
        s.path.at(u, here);
        each(T, i);
    }
}

/** 1. Sacred Flow: glowing pearls strung along the link, nudged off it by the flow field. */
function sacredFlow(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { thickness, glowIntensity } = L;
    const { primary, accent } = s.pal;
    const hidden = s.linkStyle === 'hidden';
    elements(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality)), true, (T) => {
        ctx.beginPath();
        ctx.arc(
            here[0] + Math.sin(T * Math.PI * SACRED.TRINITY + phase) * 10 * Math.sin(T * Math.PI + phase) * 0.3,
            here[1] + Math.cos(T * Math.PI * SACRED.TRINITY + phase) * 10 * Math.sin(T * Math.PI + phase) * 0.3,
            thickness * 0.8, 0, Math.PI * 2,
        );
        ctx.fillStyle = accent;
        ctx.shadowColor = hidden ? accent : primary;
        ctx.shadowBlur = hidden ? glowIntensity * 0.7 : glowIntensity;
        ctx.globalAlpha = 0.4 + Math.sin(phase + T * Math.PI * 2) * 0.2;
        ctx.fill();
    });
}

/** 2. Crystal Stream: heptagon outlines threaded along the link, each turned a little more. */
function crystalStream(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { thickness } = L;
    const { primary, secondary } = s.pal;
    elements(s, Math.max(1, Math.floor(SACRED.HARMONY * L.quality)), false, (T) => {
        // v1's crystals took the width of the base drawn before them.
        ctx.lineWidth = thickness * 0.8;
        ctx.globalAlpha = 1;
        createCrystal(ctx, here[0], here[1], thickness * 3 * (1 + Math.sin(phase + T * Math.PI * 2) * 0.2), T * Math.PI * 2 + phase * 0.2, primary, secondary, L.glowIntensity);
    });
}

/** 3. Quantum Field: the five faint filaments, frozen. */
function quantumField(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { primary, secondary } = s.pal;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
    for (let f = 0; f < SACRED.QUANTUM; f++) {
        const fieldPhase = phase + (f * Math.PI * 2) / SACRED.QUANTUM;
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            const uncertainty = 8 * Math.sin(T * Math.PI * 2 + fieldPhase);
            const x = here[0] + uncertainty * Math.cos(fieldPhase);
            const y = here[1] + uncertainty * Math.sin(fieldPhase);
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        const color = f % 2 === 0 ? primary : secondary;
        ctx.strokeStyle = color;
        ctx.lineWidth = L.thickness * 0.5;
        ctx.shadowColor = color;
        ctx.shadowBlur = L.glowIntensity;
        ctx.globalAlpha = 0.3;
        ctx.stroke();
    }
}

/** 4. Cosmic Weave: the three threads frozen mid-twist, their weave counted from the input and turned by Direction. */
function cosmicWeave(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const colors = [s.pal.primary, s.pal.secondary, s.pal.accent];
    const dir = L.direction;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality)));
    for (let strand = 0; strand < SACRED.TRINITY; strand++) {
        const strandPhase = phase + (strand * Math.PI * 2) / SACRED.TRINITY;
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            const weave = Math.sin((1 - T) * Math.PI * 6 + strandPhase * dir) * 10;
            const x = here[0] + weave * Math.cos(strandPhase);
            const y = here[1] + weave * Math.sin(strandPhase);
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        ctx.strokeStyle = colors[strand];
        ctx.lineWidth = L.thickness * 0.7;
        ctx.shadowColor = colors[strand];
        ctx.shadowBlur = L.glowIntensity;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
    }
}

/** 5. Energy Pulse: evenly spaced glowing orbs of nearly one size. */
function energyPulse(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { secondary } = s.pal;
    elements(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality)), false, (T) => {
        ctx.beginPath();
        ctx.arc(here[0], here[1], L.thickness * 2 * (1 + Math.sin(phase + T * Math.PI * 2) * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = secondary;
        ctx.shadowColor = secondary;
        ctx.shadowBlur = L.glowIntensity * 2;
        ctx.globalAlpha = 0.4 + Math.sin(phase + T * Math.PI * 2) * 0.2;
        ctx.fill();
    });
}

/** 6. DNA Helix: a frozen double helix with bolder strands and seventeen rungs, one at each end. */
function dnaHelix(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { primary, secondary, accent } = s.pal;
    const { thickness, glowIntensity } = L;
    const radius = 10;
    const rotations = 4;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.COMPLETION * L.quality * 2)));
    for (let strand = 0; strand < 2; strand++) {
        const side = strand === 0 ? 1 : -1;
        ctx.beginPath();
        for (let j = 0; j < m; j++) {
            const T = ts[j];
            s.path.at(s.local(T), here);
            const angle = T * Math.PI * rotations * 2 + phase;
            const x = here[0] + Math.cos(angle) * radius * side;
            const y = here[1] + Math.sin(angle) * radius * side;
            if (j) ctx.lineTo(x, y);
            else ctx.moveTo(x, y);
        }
        const color = strand === 0 ? primary : secondary;
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 1.2;
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity;
        ctx.globalAlpha = 1;
        ctx.stroke();
    }
    elements(s, rotations * 4, true, (T) => {
        const angle = T * Math.PI * rotations * 2 + phase;
        ctx.strokeStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.lineWidth = thickness * 0.8;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(here[0] + Math.cos(angle) * radius, here[1] + Math.sin(angle) * radius);
        ctx.lineTo(here[0] - Math.cos(angle) * radius, here[1] - Math.sin(angle) * radius);
        ctx.stroke();
    });
}

/** 7. Lava Flow: the glowing molten core alone, rippling gently across the path, its colours along the whole link; v1 stroked its sheath at alpha 0. */
function lavaFlow(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { primary, secondary, accent } = s.pal;
    const m = vertices(s, Math.max(1, Math.floor(SACRED.TRINITY * L.quality * 12)));
    ctx.beginPath();
    for (let j = 0; j < m; j++) {
        const T = ts[j];
        s.path.at(s.local(T), here);
        const across = Math.sin(T * Math.PI * 3 + phase * 1.2) * (15 * 0.7) * Math.sin(phase * 0.6 + T * Math.PI * 2);
        const x = here[0] - here[3] * across;
        const y = here[1] + here[2] * across;
        if (j) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
    }
    const gradient = linkGradient(ctx, s, 1);
    gradient.addColorStop(0, primary);
    gradient.addColorStop(0.4 + Math.sin(phase) * 0.1, secondary);
    gradient.addColorStop(1, accent);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = gradient;
    ctx.lineWidth = L.thickness * 5;
    ctx.lineCap = 'round';
    ctx.shadowColor = secondary;
    ctx.shadowBlur = L.glowIntensity * 1.5;
    ctx.stroke();
}

/** 8. Stellar Plasma: one frozen wave of plasma beads, the halves in two colours, with sparks at Quality above 1. */
function stellarPlasma(ctx: CanvasRenderingContext2D, s: Segment, phase: number): void {
    const { primary, secondary, accent } = s.pal;
    const { thickness, glowIntensity, quality } = L;
    const segments = Math.max(5, Math.floor(Math.min(Math.floor(s.chain / 30), 20) * quality * 0.5));
    elements(s, segments, true, (T, i) => {
        const wave = Math.sin(T * Math.PI * 2 + phase * 0.5) * 8;
        const size = thickness * (0.8 + Math.sin(phase + T * Math.PI) * 0.2);
        const color = T < 0.5 ? primary : secondary;
        ctx.beginPath();
        ctx.arc(here[0], here[1] + wave, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = glowIntensity;
        ctx.globalAlpha = 0.6;
        ctx.fill();
        if (i % 3 !== 0 || quality <= 1) return;
        ctx.beginPath();
        ctx.arc(here[0], here[1] + wave * 1.2, size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = glowIntensity * 0.5;
        ctx.globalAlpha = 0.4;
        ctx.fill();
    });
}

/** The moment v3's own animations hold still at: the phase, nothing flowed, and facing the way Direction says. */
const held = { linkPhase: 0, quantumPhase: 0, linkFlow: 0, linkDir: 1 };

/** Animation `animate` as it moves, held at `phase`. */
const posed = (animate: number) => (ctx: CanvasRenderingContext2D, s: Segment, phase: number) => {
    held.linkPhase = held.quantumPhase = phase;
    held.linkDir = L.direction;
    MOVING[animate](ctx, s, held);
};

/** What each animation draws over its base while still, but Classic Flow, whose markers are all it draws. */
export const STILL: Record<number, (ctx: CanvasRenderingContext2D, s: Segment, phase: number) => void> = {
    1: sacredFlow,
    2: crystalStream,
    3: quantumField,
    4: cosmicWeave,
    5: energyPulse,
    6: dnaHelix,
    7: lavaFlow,
    8: stellarPlasma,
    10: posed(10),
    11: posed(11),
    12: posed(12),
};
