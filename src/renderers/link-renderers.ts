/**
 * Link Style Renderers — 12 link drawing styles.
 *
 * Each renderer provides:
 *  - getLength(start, end): total path length
 *  - getNormalizedT(start, end, targetDist, totalLength): arc-length parameterization
 *  - getPoint(start, end, t): point at parameter t ∈ [0,1]
 *  - draw(ctx, start, end, color, thickness, isStatic?): render the link
 *
 * Ported from original link_animations.js (lines 406–986).
 *
 * @module renderers/link-renderers
 */

export type LinkPoint = [number, number] | Float32Array;

export interface LinkRenderer {
    getLength(start: LinkPoint, end: LinkPoint): number;
    getNormalizedT(start: LinkPoint, end: LinkPoint, targetDist: number, totalLength: number): number;
    getPoint(start: LinkPoint, end: LinkPoint, t: number, ...extra: unknown[]): [number, number];
    draw(ctx: CanvasRenderingContext2D, start: LinkPoint, end: LinkPoint, color: string, thickness: number, isStatic?: boolean): void;
}

// =============================================================================
// Helpers
// =============================================================================

function dist(a: LinkPoint, b: LinkPoint): number {
    return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}

// =============================================================================
// Spline
// =============================================================================

const spline: LinkRenderer = {
    getLength(start, end) {
        const samples = 40;
        let length = 0;
        let prev = this.getPoint(start, end, 0);
        for (let i = 1; i <= samples; i++) {
            const p = this.getPoint(start, end, i / samples);
            length += dist(prev as LinkPoint, p as LinkPoint);
            prev = p;
        }
        return length;
    },

    getNormalizedT(start, end, targetDist, _totalLength) {
        const samples = 40;
        let acc = 0;
        let prev = this.getPoint(start, end, 0);
        for (let i = 1; i <= samples; i++) {
            const t = i / samples;
            const p = this.getPoint(start, end, t);
            const seg = dist(prev as LinkPoint, p as LinkPoint);
            acc += seg;
            if (acc >= targetDist) {
                const prevT = (i - 1) / samples;
                const excess = acc - targetDist;
                return prevT + (t - prevT) * (1 - excess / seg);
            }
            prev = p;
        }
        return 1;
    },

    getPoint(start, end, t) {
        const d = dist(start, end);
        const bend = Math.min(d * 0.5, 100);

        const p0x = start[0], p0y = start[1];
        const p1x = start[0] + bend, p1y = start[1];
        const p2x = end[0] - bend, p2y = end[1];
        const p3x = end[0], p3y = end[1];

        const cx = 3 * (p1x - p0x);
        const bx = 3 * (p2x - p1x) - cx;
        const ax = p3x - p0x - cx - bx;

        const cy = 3 * (p1y - p0y);
        const by = 3 * (p2y - p1y) - cy;
        const ay = p3y - p0y - cy - by;

        return [
            ax * t ** 3 + bx * t ** 2 + cx * t + p0x,
            ay * t ** 3 + by * t ** 2 + cy * t + p0y,
        ];
    },

    draw(ctx, start, end, color, thickness) {
        const d = dist(start, end);
        const bend = Math.min(d * 0.5, 100);
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.bezierCurveTo(
            start[0] + bend, start[1],
            end[0] - bend, end[1],
            end[0], end[1],
        );
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Straight
// =============================================================================

const straight: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, s, e, color, thickness) {
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Linear (3-segment right-angle path)
// =============================================================================

const linear: LinkRenderer = {
    getLength(start, end) {
        const midX = (start[0] + end[0]) / 2;
        return Math.abs(midX - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[0] - midX);
    },

    getNormalizedT(start, end, targetDist, totalLength) {
        const midX = (start[0] + end[0]) / 2;
        const h1 = Math.abs(midX - start[0]);
        const v = Math.abs(end[1] - start[1]);
        const s1p = h1 / totalLength;
        const s2p = v / totalLength;
        const h2 = Math.abs(end[0] - midX);
        const nd = targetDist / totalLength;

        if (nd <= s1p) return (nd / s1p) * 0.33;
        if (nd <= s1p + s2p) return 0.33 + ((nd - s1p) / s2p) * 0.34;
        return 0.67 + ((nd - s1p - s2p) / (h2 / totalLength)) * 0.33;
    },

    getPoint(start, end, t) {
        const midX = (start[0] + end[0]) / 2;
        if (t <= 0.33) {
            const st = t / 0.33;
            return [start[0] + (midX - start[0]) * st, start[1]];
        }
        if (t <= 0.67) {
            const st = (t - 0.33) / 0.34;
            return [midX, start[1] + (end[1] - start[1]) * st];
        }
        const st = (t - 0.67) / 0.33;
        return [midX + (end[0] - midX) * st, end[1]];
    },

    draw(ctx, start, end, color, thickness) {
        const midX = (start[0] + end[0]) / 2;
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(midX, start[1]);
        ctx.lineTo(midX, end[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Hidden
// =============================================================================

const hidden: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw() { /* intentionally empty */ },
};

// =============================================================================
// Dotted
// =============================================================================

const dotted: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, start, end, color, thickness) {
        const len = dist(start, end);
        const spacing = thickness * 3;
        const num = Math.floor(len / spacing);
        for (let i = 0; i <= num; i++) {
            const t = i / num;
            const x = start[0] + (end[0] - start[0]) * t;
            const y = start[1] + (end[1] - start[1]) * t;
            ctx.beginPath();
            ctx.arc(x, y, thickness * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    },
};

// =============================================================================
// Dashed
// =============================================================================

const dashed: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, s, e, color, thickness) {
        ctx.beginPath();
        ctx.setLineDash([thickness * 4, thickness * 2]);
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
        ctx.setLineDash([]);
    },
};

// =============================================================================
// Double
// =============================================================================

const double: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, s, e, color, thickness) {
        const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
        const off = thickness * 0.8;
        const dx = Math.cos(angle + Math.PI / 2) * off;
        const dy = Math.sin(angle + Math.PI / 2) * off;

        ctx.beginPath();
        ctx.moveTo(s[0] + dx, s[1] + dy);
        ctx.lineTo(e[0] + dx, e[1] + dy);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s[0] - dx, s[1] - dy);
        ctx.lineTo(e[0] - dx, e[1] - dy);
        ctx.stroke();
    },
};

// =============================================================================
// Stepped
// =============================================================================

const stepped: LinkRenderer = {
    getLength(s, e) {
        return Math.abs(e[0] - s[0]) + Math.abs(e[1] - s[1]);
    },
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint(s, e, t) {
        const midX = s[0] + (e[0] - s[0]) * (t < 0.5 ? t * 2 : 1);
        const midY = s[1] + (e[1] - s[1]) * (t >= 0.5 ? (t - 0.5) * 2 : 0);
        return [midX, midY];
    },
    draw(ctx, s, e, color, thickness) {
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(s[0] + (e[0] - s[0]), s[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Zigzag
// =============================================================================

const zigzag: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint(s, e, t) {
        const bx = s[0] + (e[0] - s[0]) * t;
        const by = s[1] + (e[1] - s[1]) * t;
        const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
        const amp = 10, freq = 10;
        return [
            bx + Math.cos(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp,
            by + Math.sin(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp,
        ];
    },
    draw(ctx, s, e, color, thickness) {
        ctx.beginPath();
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const p = this.getPoint(s, e, i / steps);
            i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    },
};

// =============================================================================
// Rope
// =============================================================================

const rope: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint(s, e, t) {
        const bx = s[0] + (e[0] - s[0]) * t;
        const by = s[1] + (e[1] - s[1]) * t;
        const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);
        const amp = 3, freq = 20;
        return [
            bx + Math.cos(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp,
            by + Math.sin(angle + Math.PI / 2) * Math.sin(t * Math.PI * freq) * amp,
        ];
    },
    draw(ctx, s, e, color, thickness) {
        const steps = 100;
        // Main rope
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const p = this.getPoint(s, e, i / steps);
            i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 1.2;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Highlight
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const p = this.getPoint(s, e, i / steps);
            i === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = thickness * 0.4;
        ctx.stroke();
    },
};

// =============================================================================
// Glowpath
// =============================================================================

const glowpath: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, s, e, color, thickness) {
        // Base line
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();

        // Outer glow
        const gradient = ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.5)');

        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = thickness * 2;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
    },
};

// =============================================================================
// Chain
// =============================================================================

const chain: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, start, end, color, thickness) {
        const len = dist(start, end);
        const linkSize = thickness * 2;
        const numLinks = Math.floor(len / (linkSize * 2));
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

        for (let i = 0; i < numLinks; i++) {
            const t = i / numLinks;
            const x = start[0] + (end[0] - start[0]) * t;
            const y = start[1] + (end[1] - start[1]) * t;
            ctx.beginPath();
            ctx.ellipse(x, y, linkSize, linkSize * 0.6, angle, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness * 0.4;
            ctx.stroke();
        }
    },
};

// =============================================================================
// Pulse
// =============================================================================

const pulse: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, s, e, color, thickness) {
        const len = dist(s, e);
        const dashLen = thickness * 4;
        const numDashes = Math.floor(len / (dashLen * 2));

        ctx.beginPath();
        ctx.setLineDash([dashLen, dashLen]);
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(e[0], e[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
        ctx.setLineDash([]);

        const pulseWidth = thickness * 3;
        for (let i = 0; i < numDashes; i++) {
            const t = i / numDashes;
            const x = s[0] + (e[0] - s[0]) * t;
            const y = s[1] + (e[1] - s[1]) * t;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, pulseWidth);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath();
            ctx.arc(x, y, pulseWidth, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.globalAlpha = 0.3;
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    },
};

// =============================================================================
// Holographic
// =============================================================================

const holographic: LinkRenderer = {
    getLength: (s, e) => dist(s, e),
    getNormalizedT: (_s, _e, td, tl) => td / tl,
    getPoint: (s, e, t) => [s[0] + (e[0] - s[0]) * t, s[1] + (e[1] - s[1]) * t],
    draw(ctx, s, e, color, thickness) {
        // Main line with gradient
        ctx.beginPath();
        ctx.moveTo(s[0], s[1]);
        ctx.lineTo(e[0], e[1]);
        const gradient = ctx.createLinearGradient(s[0], s[1], e[0], e[1]);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, color);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = thickness * 1.2;
        ctx.stroke();

        // Scanline effect
        const len = dist(s, e);
        const spacing = thickness * 2;
        const num = Math.floor(len / spacing);
        const angle = Math.atan2(e[1] - s[1], e[0] - s[0]);

        for (let i = 0; i <= num; i++) {
            const t = i / num;
            const x = s[0] + (e[0] - s[0]) * t;
            const y = s[1] + (e[1] - s[1]) * t;
            ctx.beginPath();
            ctx.moveTo(
                x + Math.cos(angle + Math.PI / 2) * thickness,
                y + Math.sin(angle + Math.PI / 2) * thickness,
            );
            ctx.lineTo(
                x + Math.cos(angle - Math.PI / 2) * thickness,
                y + Math.sin(angle - Math.PI / 2) * thickness,
            );
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },
};

// =============================================================================
// Renderer map
// =============================================================================

const LinkRenderers: Record<string, LinkRenderer> = {
    spline,
    straight,
    linear,
    hidden,
    dotted,
    dashed,
    double,
    stepped,
    zigzag,
    rope,
    glowpath,
    chain,
    pulse,
    holographic,
};

/** Get a renderer by name, falling back to spline */
export function getLinkRenderer(name: string): LinkRenderer {
    return LinkRenderers[name] ?? spline;
}
