/**
 * Render Utilities — shared canvas drawing helpers for animation effects.
 *
 * Ported from original link_animations.js RenderUtils (lines 1465–1611).
 *
 * @module renderers/render-utils
 */

import { SACRED } from '@/core/config';

// =============================================================================
// Flow Field
// =============================================================================

/** Create a flow field displacement vector at position t with given phase */
export function createFlowField(t: number, phase: number): { x: number; y: number } {
    return {
        x: Math.sin(t * Math.PI * SACRED.TRINITY + phase) * 10,
        y: Math.cos(t * Math.PI * SACRED.TRINITY + phase) * 10,
    };
}

// =============================================================================
// Sacred Geometry Shapes
// =============================================================================

/** Draw a crystal (regular polygon with HARMONY sides) */
export function createCrystal(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    size: number, rotation: number,
    color: string,
): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.beginPath();
    for (let i = 0; i < SACRED.HARMONY; i++) {
        const angle = (i / SACRED.HARMONY) * Math.PI * 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
}

// =============================================================================
// Canvas Configuration
// =============================================================================

/** Enable high-quality anti-aliased rendering */
export function enableAntiAliasing(ctx: CanvasRenderingContext2D): void {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;
}
