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

/** The point at() finds at u, and the direction there. */
function at(path: LinkPath, u: number): { point: Point; tangent: Point } {
    const out = new Float64Array(4);
    path.at(u, out);
    return { point: [out[0], out[1]], tangent: [out[2], out[3]] };
}
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
    const where = `mode ${mode}, directions ${startDir} → ${endDir}, ${a} → ${b}`;
    for (const t of T) {
        const { point, tangent } = at(path, t);
        expect(gap(point, nativeAt(oracle, t)), `${where}, t ${t}`).toBeLessThan(0.5);
        // The direction there, a unit step toward where the path goes next.
        expect(Math.hypot(...tangent), `${where}, t ${t}`).toBeCloseTo(1, 9);
        const ahead = nativeAt(oracle, Math.min(1, t + 0.01));
        if (t < 1 && gap(ahead, point) > 0.5) expect(tangent[0] * (ahead[0] - point[0]) + tangent[1] * (ahead[1] - point[1]), `${where}, t ${t}`).toBeGreaterThan(0);
        const [left, top, right, bottom] = path.box;
        expect(point[0] >= left - 1e-9 && point[0] <= right + 1e-9 && point[1] >= top - 1e-9 && point[1] <= bottom + 1e-9, `${where}: in the box`).toBe(true);
    }
    expect(gap([path.cx, path.cy], oracle.centre), `${where}: centre`).toBeLessThan(0.5);
    expect(Math.abs(path.angle - oracle.angle), `${where}: arrow angle`).toBeLessThan(1e-6);

    // draw() strokes the native path: the same moveTo, then the bezier's controls and end, or each polyline point.
    const rec = new CanvasRecorder();
    path.draw(rec.ctx, '#fff', 3);
    const drawn = rec.lines.filter((line) => /^(moveTo|lineTo|bezierCurveTo)/.test(line)).flatMap((line) => line.slice(line.indexOf('(') + 1, -1).split(', ').map(Number));
    const expected = oracle.points.flat();
    expect(drawn.length, where).toBe(expected.length);
    drawn.forEach((value, i) => expect(Math.abs(value - expected[i]), `${where}: drawn coordinate ${i}`).toBeLessThan(0.5));
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
        expect(path.length).toBeCloseTo(100, 9);
        path.set([0, 0], [100, 100], RIGHT, LEFT, STRAIGHT_LINK);
        // 10 + 40 + 100 + 40 + 10.
        expect(path.length).toBeCloseTo(200, 9);
        path.set([0, 0], [300, 0], RIGHT, LEFT, SPLINE_LINK);
        expect(path.length).toBeCloseTo(300, 6);
    });
});

/** The points a polyline path is drawn through. */
function vertices(path: LinkPath): Point[] {
    const points: Point[] = [];
    const add = (x: number, y: number) => void points.push([x, y]);
    path.trace({ moveTo: add, lineTo: add } as unknown as CanvasPath);
    return points;
}

const smooth = (x: number) => (x >= 1 ? 1 : x <= 0 ? 0 : x * x * (3 - 2 * x));

describe('LinkPath shapes of our own', () => {
    /** A horizontal spline from (100, 100) to (500, 100): its controls lie on the line, so it is the line, and x is the length along it. */
    const level = () => {
        const path = new LinkPath();
        path.set([100, 100], [500, 100], RIGHT, LEFT, SPLINE_LINK);
        return path;
    };

    it('finds points by length, with the direction of the path there', () => {
        const out = new Float64Array(4);
        const path = new LinkPath();
        path.set([0, 0], [100, 100], RIGHT, LEFT, STRAIGHT_LINK);
        // 10 out, 40 across, 100 down, 40 across, 10 in.
        for (const [d, x, y, tx, ty] of [[0, 0, 0, 1, 0], [30, 30, 0, 1, 0], [100, 50, 50, 0, 1], [195, 95, 100, 1, 0], [999, 100, 100, 1, 0]]) {
            path.find(d, out);
            expect([...out].map((v) => Math.round(v * 1e9) / 1e9), `at ${d}`).toEqual([x, y, tx, ty]);
        }
        // Along a spline, consecutive points 10 px apart by length are 10 px apart.
        path.set([100, 100], [500, 300], RIGHT, LEFT, SPLINE_LINK);
        let last: Point | undefined;
        for (let d = 0; d <= path.length; d += 10) {
            path.find(d, out);
            expect(Math.hypot(out[2], out[3])).toBeCloseTo(1, 9);
            if (last) expect(gap(last, [out[0], out[1]])).toBeCloseTo(10, 0);
            last = [out[0], out[1]];
        }
    });

    describe('stepped', () => {
        it('runs across at the output, rounds both corners and enters the input along its 10 px stub', () => {
            const path = new LinkPath();
            path.set([100, 100], [400, 300], RIGHT, LEFT, SPLINE_LINK);
            path.step(LEFT);
            const points = vertices(path);
            expect(points[0]).toEqual([100, 100]);
            expect(points.at(-1)).toEqual([400, 300]);
            expect(at(path, 0).point).toEqual([100, 100]);
            expect(at(path, 1).point).toEqual([400, 300]);
            // Corners of radius 8 at (390, 100) and (390, 300): the stub leaves the input 10 px out.
            const onArc = ([x, y]: Point, [cx, cy]: Point) => Math.abs(Math.hypot(x - cx, y - cy) - 8) < 1e-9;
            for (const point of points) {
                const [x, y] = point;
                const across = y === 100 && x >= 100 && x <= 382;
                const down = x === 390 && y >= 108 && y <= 292;
                const stub = y === 300 && x >= 398 && x <= 400;
                expect(across || down || stub || onArc(point, [382, 108]) || onArc(point, [398, 292]), `${point}`).toBe(true);
            }
            expect(points.filter((p) => onArc(p, [382, 108]))).toHaveLength(5);
            expect(points.filter((p) => onArc(p, [398, 292]))).toHaveLength(5);
            // Its length is the legs' and the corners' four chords each; the centre marker sits halfway along it, pointing along its leg.
            const quarter = 4 * 2 * 8 * Math.sin(Math.PI / 16);
            expect(path.length).toBeCloseTo(290 + 200 + 10 - 4 * 8 + 2 * quarter, 9);
            expect([path.cx, path.cy, path.angle]).toEqual([100 + path.length / 2, 100, 0]);
        });

        it('keeps a level link straight, takes no stub into a reroute and limits a corner to half the rise', () => {
            const path = new LinkPath();
            path.set([100, 100], [400, 100], RIGHT, LEFT, SPLINE_LINK);
            path.step(LEFT);
            expect(vertices(path)).toEqual([[100, 100], [390, 100], [400, 100]]);
            // Into a reroute (CENTER): across, then straight down onto it.
            path.set([100, 100], [400, 300], RIGHT, CENTER, SPLINE_LINK);
            path.step(CENTER);
            const into = vertices(path);
            expect([into[0], into.at(-1), into.at(-2)]).toEqual([[100, 100], [400, 300], [400, 108]]);
            // A rise of 6 px: corners of 3 px.
            path.set([100, 100], [400, 106], RIGHT, LEFT, SPLINE_LINK);
            path.step(LEFT);
            const low = vertices(path);
            expect(low.slice(0, 2)).toEqual([[100, 100], [387, 100]]);
            expect(low.at(-1)).toEqual([400, 106]);
        });
    });

    for (const [coil, name, reach] of [[false, 'wave', 10], [true, 'coil', 6 * Math.hypot(1, 0.6)]] as const) {
        describe(name, () => {
            it('starts and ends exactly on the slots, and grows from nothing over 15 px to its full size', () => {
                const path = level();
                path.bend(coil, 0, true, true);
                const points = vertices(path);
                expect(points[0]).toEqual([100, 100]);
                expect(points.at(-1)).toEqual([500, 100]);
                expect(at(path, 0).point).toEqual([100, 100]);
                expect(at(path, 1).point).toEqual([500, 100]);
                // Around the level path, d px along it: a wave 10 px across every 60 px, or loops 6 px across and 3.6 px
                // along it every 12 px, tapered by smoothstep over 15 px at both slots.
                const shape = (d: number): Point => {
                    const fade = smooth(d / 15) * smooth((400 - d) / 15);
                    const turn = (2 * Math.PI * d) / (coil ? 12 : 60);
                    return coil ? [100 + d + 3.6 * Math.cos(turn) * fade, 100 + 6 * Math.sin(turn) * fade] : [100 + d, 100 + 10 * Math.sin(turn) * fade];
                };
                for (const point of points) {
                    let nearest = Infinity;
                    for (let d = Math.max(0, point[0] - 105); d <= Math.min(400, point[0] - 95); d += 0.005) nearest = Math.min(nearest, gap(shape(d), point));
                    // Within the 0.05 px a point's place along a spline is found to, from its 40 chords.
                    expect(nearest, `${point}`).toBeLessThan(0.05);
                }
                expect(Math.max(...points.map(([, y]) => Math.abs(y - 100)))).toBeCloseTo(coil ? 6 : 10, 1);
                expect(Math.max(...points.map(([x, y]) => Math.hypot(x - Math.min(500, Math.max(100, x)), y - 100)))).toBeLessThanOrEqual(reach);
            });

            it(name === 'wave' ? 'swings across the path every 30 px' : 'loops back along the path', () => {
                const path = level();
                path.bend(coil, 0, true, true);
                const points = vertices(path);
                if (!coil) {
                    // It crosses the path every 30 px from the start: at 130, 160, ... 490.
                    const crossings = points.slice(1).flatMap(([x, y], i) => ((y - 100) * (points[i][1] - 100) < 0 ? [100 + Math.round((x - 100) / 30) * 30] : []));
                    expect(crossings).toEqual(Array.from({ length: 13 }, (_, i) => 130 + 30 * i));
                } else {
                    // It runs backwards where its loops turn: x falls between some points.
                    expect(points.slice(1).filter(([x], i) => x < points[i][0]).length).toBeGreaterThan(20);
                }
            });

            it('carries on across a reroute, from how far along its link the segment starts', () => {
                // One link from (100, 100) through a reroute at (300, 100) to (500, 100).
                const [first, second] = [new LinkPath(), new LinkPath()];
                first.set([100, 100], [300, 100], RIGHT, CENTER, SPLINE_LINK, undefined, [-50, 0]);
                second.set([300, 100], [500, 100], CENTER, LEFT, SPLINE_LINK, [50, 0]);
                // The second starts 200 px along the link: the first's length along its path, before it was wound.
                const along = first.length;
                first.bend(coil, 0, true, false);
                second.bend(coil, along, false, true);
                const [end, start] = [vertices(first).at(-1)!, vertices(second)[0]];
                expect(gap(end, start)).toBeLessThan(1e-9);
                // Not pinched to the path there.
                expect(Math.abs(end[1] - 100) + Math.abs(end[0] - 300)).toBeGreaterThan(1);
                // Both halves of the wave are the one sine a single segment draws along the whole path, tapered at the slots.
                if (!coil) {
                    for (const [x, y] of [...vertices(first), ...vertices(second)]) {
                        const fade = smooth((x - 100) / 15) * smooth((500 - x) / 15);
                        expect(y - 100, `${x}`).toBeCloseTo(10 * Math.sin((2 * Math.PI * (x - 100)) / 60) * fade, 1);
                    }
                }
            });
        });
    }

    it('lets effects ride a wave, but keep to the path inside a coil', () => {
        const [plain, wave, coil] = [level(), level(), level()];
        wave.bend(false, 0, true, true);
        coil.bend(true, 0, true, true);
        const [inside, along] = [new Float64Array(4), new Float64Array(4)];
        expect(coil.length).toBe(plain.length);
        for (const t of [0.1, 0.3, 0.5, 0.75]) {
            expect(at(coil, t)).toEqual(at(plain, t));
            coil.find(t * plain.length, inside);
            plain.find(t * plain.length, along);
            expect([...inside]).toEqual([...along]);
        }
        // A wave's points are its own: off the level path, along a line longer than it.
        expect(wave.length).toBeGreaterThan(plain.length * 1.2);
        const off = [0.2, 0.4, 0.6].map((t) => Math.abs(at(wave, t).point[1] - 100));
        expect(Math.max(...off)).toBeGreaterThan(1);
    });

    it('gives our shapes to hit testing as a Path2D of the same points', () => {
        const path = new LinkPath();
        path.set([100, 100], [400, 300], RIGHT, LEFT, SPLINE_LINK);
        path.step(LEFT);
        const ops = (path.hit() as unknown as { ops: string[] }).ops;
        const rec = new CanvasRecorder();
        path.trace(rec.ctx);
        expect(ops).toEqual(rec.lines);
    });
});
