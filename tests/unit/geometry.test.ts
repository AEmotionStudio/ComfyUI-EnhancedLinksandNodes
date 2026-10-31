/**
 * LinkPath against an oracle written from the frontend sources: renderLink
 * hands its arguments to litegraphLinkAdapter.ts renderLinkDirect, which turns
 * them into pathRenderer.ts link data, and drawLink builds the path from that
 * (src/renderer/core/canvas/, the same in 1.57.1 and 1.39.5). Every pair of
 * start and end directions, each render mode, and the controls of reroute
 * segments.
 */

import { describe, it, expect } from 'vitest';
import { LinkPath } from '@/links/geometry';
import { CanvasRecorder } from '../helpers/recording-context';

type Point = [number, number];
type Direction = 'left' | 'right' | 'up' | 'down' | 'none';

// LinkDirection and LinkRenderType (lib/litegraph/src/types/globalEnums.ts L46-64).
const [NONE, UP, DOWN, LEFT, RIGHT, CENTER] = [0, 1, 2, 3, 4, 5];
const [STRAIGHT_LINK, LINEAR_LINK, SPLINE_LINK] = [0, 1, 2];
const DIRECTIONS = [NONE, UP, DOWN, LEFT, RIGHT, CENTER];

interface Native {
    /** A cubic bezier (start, two controls, end) or a polyline. */
    curve: boolean;
    points: Point[];
    centre: Point;
    angle: number;
}

/** litegraphLinkAdapter.ts convertDirection (L60-76). */
function convertDirection(dir: number): Direction {
    switch (dir) {
        case LEFT: return 'left';
        case RIGHT: return 'right';
        case UP: return 'up';
        case DOWN: return 'down';
        case CENTER:
        case NONE: return 'none';
        default: return 'right';
    }
}

/** pathRenderer.ts: the offsets buildLinearPath (L245-277) and buildStraightPath (L300-332) give a direction. */
function inner(point: Point, dir: Direction, l: number): Point {
    const [x, y] = point;
    return dir === 'left' ? [x - l, y] : dir === 'right' ? [x + l, y] : dir === 'up' ? [x, y - l] : dir === 'down' ? [x, y + l] : [x, y];
}

/** pathRenderer.ts findPointOnBezier (L553-570). */
function bezierAt(t: number, [p0, p1, p2, p3]: Point[]): Point {
    const mt = 1 - t;
    const at = (i: 0 | 1) => mt ** 3 * p0[i] + 3 * mt ** 2 * t * p1[i] + 3 * mt * t ** 2 * p2[i] + t ** 3 * p3[i];
    return [at(0), at(1)];
}

/** The native path of one renderLink call. */
function native(a: Point, b: Point, start_dir: number, end_dir: number, mode: number, startControl?: Point, endControl?: Point): Native {
    // litegraphLinkAdapter.ts L218-219.
    const startDir = start_dir || RIGHT;
    const endDir = end_dir || LEFT;
    if (mode === LINEAR_LINK || mode === STRAIGHT_LINK) {
        // pathRenderer.ts buildLinearPath (L231-284) and buildStraightPath (L286-344), from the converted directions (adapter L229-230).
        const l = mode === LINEAR_LINK ? 15 : 10;
        const innerA = inner(a, convertDirection(startDir), l);
        const innerB = inner(b, convertDirection(endDir), l);
        if (mode === LINEAR_LINK) {
            // calculateCenterPoint (L683-727).
            const centre: Point = [(innerA[0] + innerB[0]) * 0.5, (innerA[1] + innerB[1]) * 0.5];
            return { curve: false, points: [a, innerA, innerB, b], centre, angle: Math.atan2(innerB[1] - innerA[1], innerB[0] - innerA[0]) };
        }
        const midX = (innerA[0] + innerB[0]) * 0.5;
        // calculateCenterPoint (L728-781).
        const diff = innerB[1] - innerA[1];
        const angle = Math.abs(diff) < 4 ? 0 : diff > 0 ? Math.PI * 0.5 : -(Math.PI * 0.5);
        return { curve: false, points: [a, innerA, [midX, innerA[1]], [midX, innerB[1]], innerB, b], centre: [midX, (innerA[1] + innerB[1]) * 0.5], angle };
    }
    // litegraphLinkAdapter.ts L241-295 in spline mode: a given control is an offset from its end, and applySplineOffset
    // (L172-192) moves the other a quarter of the length along its LinkDirection; CENTER and NONE do not move it.
    const dist = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
    const offset = (point: Point, dir: number): Point => {
        const d = dist * 0.25;
        return dir === LEFT ? [point[0] - d, point[1]] : dir === RIGHT ? [point[0] + d, point[1]] : dir === UP ? [point[0], point[1] - d] : dir === DOWN ? [point[0], point[1] + d] : [point[0], point[1]];
    };
    const c1: Point = startControl ? [a[0] + (startControl[0] || 0), a[1] + (startControl[1] || 0)] : offset(a, startDir);
    const c2: Point = endControl ? [b[0] + (endControl[0] || 0), b[1] + (endControl[1] || 0)] : offset(b, endDir);
    // pathRenderer.ts buildSplinePath (L346-377) draws bezierCurveTo; calculateCenterPoint (L654-682) takes t = 0.5, and 0.51 for the angle.
    const points = [a, c1, c2, b];
    const centre = bezierAt(0.5, points);
    const past = bezierAt(0.51, points);
    return { curve: true, points, centre, angle: Math.atan2(past[1] - centre[1], past[0] - centre[0]) };
}

/** The native path at t: the bezier parameter on a curve, the fraction of the length along a polyline. */
function nativeAt({ curve, points }: Native, t: number): Point {
    if (curve) return bezierAt(t, points);
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
    let left = t * lengths.reduce((sum, l) => sum + l, 0);
    for (const [i, l] of lengths.entries()) {
        if (left <= l || i === lengths.length - 1) {
            const f = l ? Math.min(1, left / l) : 0;
            return [points[i][0] + (points[i + 1][0] - points[i][0]) * f, points[i][1] + (points[i + 1][1] - points[i][1]) * f];
        }
        left -= l;
    }
    return points[0];
}

const gap = (p: Point, q: Point) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const T = Array.from({ length: 21 }, (_, i) => i / 20);

/** Short forward, long backward and straight-down segments. */
const ENDS: Array<[Point, Point]> = [
    [[100, 100], [260, 140]],
    [[700, 220], [120, 560]],
    [[400, 100], [400, 500]],
];

function check(a: Point, b: Point, startDir: number, endDir: number, mode: number, startControl?: Point, endControl?: Point): void {
    const path = new LinkPath();
    path.set(a, b, startDir, endDir, mode, startControl, endControl);
    const oracle = native(a, b, startDir, endDir, mode, startControl, endControl);
    const at = `mode ${mode}, directions ${startDir} → ${endDir}, ${a} → ${b}`;
    for (const t of T) {
        const point = path.getPoint(path.a, path.b, t);
        expect(gap(point, nativeAt(oracle, t)), `${at}, t ${t}`).toBeLessThan(0.5);
        // Counted from the end, the same path backwards.
        expect(gap(path.getPoint(path.b, path.a, 1 - t), point), `${at}, from the end, t ${t}`).toBeLessThan(1e-9);
        const [left, top, right, bottom] = path.box;
        expect(point[0] >= left - 1e-9 && point[0] <= right + 1e-9 && point[1] >= top - 1e-9 && point[1] <= bottom + 1e-9, `${at}: in the box`).toBe(true);
    }
    expect(gap([path.cx, path.cy], oracle.centre), `${at}: centre`).toBeLessThan(0.5);
    expect(Math.abs(path.angle - oracle.angle), `${at}: arrow angle`).toBeLessThan(1e-6);

    // draw() strokes the native path: the same moveTo, then the bezier's controls and end, or each polyline point.
    const rec = new CanvasRecorder();
    path.draw(rec.ctx, path.a, path.b, '#fff', 3);
    const drawn = rec.lines.filter((line) => /^(moveTo|lineTo|bezierCurveTo)/.test(line)).flatMap((line) => line.slice(line.indexOf('(') + 1, -1).split(', ').map(Number));
    const expected = oracle.points.flat();
    expect(drawn.length, at).toBe(expected.length);
    drawn.forEach((value, i) => expect(Math.abs(value - expected[i]), `${at}: drawn coordinate ${i}`).toBeLessThan(0.5));
}

describe('LinkPath follows the native path', () => {
    for (const [mode, name] of [[SPLINE_LINK, 'spline'], [LINEAR_LINK, 'linear'], [STRAIGHT_LINK, 'straight']] as const) {
        it(`in ${name} mode for every pair of directions`, () => {
            for (const [a, b] of ENDS) {
                for (const startDir of DIRECTIONS) {
                    for (const endDir of DIRECTIONS) check(a, b, startDir, endDir, mode);
                }
            }
        });
    }

    it('with the controls of reroute segments', () => {
        // Into a reroute: the link's start direction and the reroute's control; out of it: the control it sets and the input's direction
        // (FE157 LGraphCanvas.ts L6377-6441); between reroutes, both controls.
        for (const [a, b] of ENDS) {
            check(a, b, RIGHT, CENTER, SPLINE_LINK, undefined, [-40, 25]);
            check(a, b, CENTER, LEFT, SPLINE_LINK, [60, -10]);
            check(a, b, CENTER, CENTER, SPLINE_LINK, [30, 30], [-30, 0]);
            // A floating link's input side starts with a zero control (L6395-6397).
            check(a, b, CENTER, UP, SPLINE_LINK, [0, 0]);
            // Polylines take no controls.
            check(a, b, CENTER, LEFT, LINEAR_LINK, [60, -10], [-40, 25]);
            check(a, b, RIGHT, CENTER, STRAIGHT_LINK, [60, -10], [-40, 25]);
        }
    });

    it('measures a spline along 40 chords, as v2 did, and a polyline exactly', () => {
        const path = new LinkPath();
        path.set([0, 0], [100, 0], RIGHT, LEFT, LINEAR_LINK);
        // 15 out, 70 across, 15 in.
        expect(path.getLength()).toBeCloseTo(100, 9);
        path.set([0, 0], [100, 100], RIGHT, LEFT, STRAIGHT_LINK);
        // 10 + 40 + 100 + 40 + 10.
        expect(path.getLength()).toBeCloseTo(200, 9);
        path.set([0, 0], [300, 0], RIGHT, LEFT, SPLINE_LINK);
        expect(path.getLength()).toBeCloseTo(300, 6);
    });
});
