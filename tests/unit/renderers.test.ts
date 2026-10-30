/**
 * Unit tests for the link path renderers and marker shapes
 */

import { describe, it, expect } from 'vitest';
import { getLinkRenderer } from '@/renderers/link-renderers';
import { MarkerShapes, shapeNeedsFill } from '@/renderers/marker-shapes';
import { LINK_STYLE_OPTIONS, MARKER_SHAPE_OPTIONS } from '@/ui/settings';
import { CanvasRecorder } from '../helpers/recording-context';

describe('MarkerShapes', () => {
    it('has a shape for each Marker.Shape option', () => {
        expect(Object.keys(MarkerShapes).sort()).toEqual(MARKER_SHAPE_OPTIONS.map((o) => o.value).sort());
        for (const shape of Object.values(MarkerShapes)) {
            expect(typeof shape).toBe('function');
        }
    });

    it('has no entry for unknown names', () => {
        expect(MarkerShapes['unknown']).toBeUndefined();
        expect(MarkerShapes['']).toBeUndefined();
    });

    it('draws the named shape', () => {
        const rec = new CanvasRecorder();
        MarkerShapes.diamond(rec.ctx, 10, 20, 5);
        MarkerShapes.circle(rec.ctx, 10, 20, 5);
        MarkerShapes.arrow(rec.ctx, 10, 20, 5, Math.PI / 2);
        expect(rec.lines).toEqual([
            'beginPath()', 'moveTo(10, 15)', 'lineTo(15, 20)', 'lineTo(10, 25)', 'lineTo(5, 20)', 'closePath()',
            'beginPath()', 'arc(10, 20, 5, 0, 6.28)', 'closePath()',
            'save()', 'translate(10, 20)', 'rotate(1.57)',
            'beginPath()', 'moveTo(5, 0)', 'lineTo(-5, 5)', 'lineTo(-2.5, 0)', 'lineTo(-5, -5)', 'closePath()',
            'restore()',
        ]);
    });

    it('fills every shape but cross, which strokes itself, and none', () => {
        expect(Object.keys(MarkerShapes).filter((name) => !shapeNeedsFill(name))).toEqual(['none', 'cross']);
    });
});

describe('getLinkRenderer', () => {
    it('gives each Link.Style option its own renderer', () => {
        const styles = LINK_STYLE_OPTIONS.map((o) => o.value);
        expect(new Set(styles.map(getLinkRenderer)).size).toBe(styles.length);
    });

    it('falls back to spline for unknown styles', () => {
        expect(getLinkRenderer('unknown')).toBe(getLinkRenderer('spline'));
        expect(getLinkRenderer('')).toBe(getLinkRenderer('spline'));
    });
});

describe('spline', () => {
    const spline = getLinkRenderer('spline');

    it('measures the path length', () => {
        // A horizontal link's control points lie on the line, so its curve is the straight segment.
        expect(spline.getLength([0, 0], [100, 0])).toBe(100);
        expect(spline.getLength([0, 0], [300, 100])).toBeCloseTo(319.126023060036, 9);
    });

    it('gets points along the path', () => {
        expect([0, 0.25, 0.5, 0.75, 1].map((t) => spline.getPoint([0, 0], [300, 100], t))).toEqual([
            [0, 0], [75, 15.625], [150, 50], [225, 84.375], [300, 100],
        ]);
    });

    it('maps a distance along the path to t, clamped to 1 past the end', () => {
        const length = spline.getLength([0, 0], [300, 100]);
        const t = (fraction: number) => spline.getNormalizedT([0, 0], [300, 100], length * fraction, length);
        expect(t(0.25)).toBeCloseTo(0.258579142689, 9);
        expect(t(0.5)).toBeCloseTo(0.5, 9);
        expect(t(0.75)).toBeCloseTo(0.741420857311, 9);
        expect(t(2)).toBe(1);
    });
});

describe('straight', () => {
    const straight = getLinkRenderer('straight');

    it('measures the distance between the ends', () => {
        expect(straight.getLength([0, 0], [100, 0])).toBe(100);
        expect(straight.getLength([0, 0], [30, 40])).toBe(50);
    });

    it('gets points along the line', () => {
        expect(straight.getPoint([0, 0], [100, 0], 0.5)).toEqual([50, 0]);
        expect(straight.getPoint([0, 0], [100, 0], 0.25)).toEqual([25, 0]);
    });

    it('maps a distance to t linearly', () => {
        expect(straight.getNormalizedT([0, 0], [100, 0], 50, 100)).toBe(0.5);
    });
});

describe('linear', () => {
    const linear = getLinkRenderer('linear');

    it('measures the horizontal, vertical and horizontal segments', () => {
        expect(linear.getLength([0, 0], [100, 100])).toBe(200);
    });

    it('spends a third of t on each segment', () => {
        expect(linear.getPoint([0, 0], [100, 100], 0.16)).toEqual([expect.closeTo(24.242424242424, 9), 0]);
        expect(linear.getPoint([0, 0], [100, 100], 0.5)).toEqual([50, expect.closeTo(50, 9)]);
        expect(linear.getPoint([0, 0], [100, 100], 0.84)).toEqual([expect.closeTo(75.757575757576, 9), 100]);
    });

    it('maps a distance to the t of that point on its segment', () => {
        const t = [0, 25, 50, 100, 150, 175, 200].map((distance) => linear.getNormalizedT([0, 0], [100, 100], distance, 200));
        expect(t).toEqual([0, 0.165, 0.33, 0.5, 0.67, expect.closeTo(0.835, 9), 1]);
    });
});
