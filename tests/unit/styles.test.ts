/**
 * Link.Style bodies (src/links/styles.ts): every Link.Style option has one,
 * and each decoration follows the segment's real path, spaced from the start
 * of its link, where v1 drew it along a straight line from start to end
 * (old_link_animations.js:609-986). Dotted and dashed links march with the
 * flow while they move. Each animation's base is the one v1's renderers drew.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clock } from '@/core/engine';
import { palette } from '@/core/colors';
import { SETTINGS, preview } from '@/core/settings';
import { Segment } from '@/links/pipeline';
import { LINK_STYLES, drawBase } from '@/links/styles';
import { CanvasRecorder } from '../helpers/recording-context';

type Point = [number, number];
type Call = [name: string, ...args: unknown[]];

const [LEFT, RIGHT, SPLINE] = [3, 4, 2];
const THICKNESS = 3;
/** The width v1's bodies stroke at. */
const WIDTH = THICKNESS * 0.8;

/** A context that keeps each call and property set as it was made, with its arguments. */
function spy(): { ctx: CanvasRenderingContext2D; calls: Call[] } {
    const calls: Call[] = [];
    const props: Record<string, unknown> = { globalAlpha: 1 };
    const gradient = { addColorStop: (...args: unknown[]) => void calls.push(['addColorStop', ...args]) };
    const ctx = new Proxy({}, {
        get: (_, key: string) => (key in props ? props[key] : (...args: unknown[]) => {
            calls.push([key, ...args]);
            return key.startsWith('create') ? gradient : undefined;
        }),
        set: (_, key: string, value) => {
            props[key] = value;
            calls.push([`${key} =`, value]);
            return true;
        },
    });
    return { ctx: ctx as CanvasRenderingContext2D, calls };
}

/** A curved segment from (100, 100) to (500, 300), `u0` px along its link. */
function segment(linkStyle: string, u0 = 0, isStatic = true): Segment {
    const s = new Segment();
    s.path.set([100, 100], [500, 300], RIGHT, LEFT, SPLINE);
    Object.assign(s, { linkStyle, u0, len: s.path.length, isStatic, pal: palette('#64b5f6') });
    return s;
}

/** The distance from a point to the segment's path, and how far along the path the nearest point is. */
function nearest(s: Segment, [x, y]: Point): { off: number; at: number } {
    const out = new Float64Array(4);
    let best = { off: Infinity, at: 0 };
    for (let d = 0; d <= s.path.length; d += 0.05) {
        s.path.find(d, out);
        const off = Math.hypot(out[0] - x, out[1] - y);
        if (off < best.off) best = { off, at: d };
    }
    return best;
}

const points = (calls: Call[], names: string[]) => calls.filter(([name]) => names.includes(name)).map(([, x, y]) => [x, y] as Point);
/** What Crystal Stream's still base sets before its body: the link's own glow, and 1.5 × the thickness, which the body overrides. */
const GLOW_BASE: Call[] = [
    ['globalAlpha =', 1], ['shadowColor =', '#64b5f6'], ['shadowBlur =', 10], ['shadowOffsetY =', 0], ['shadowOffsetX =', 0],
    ['strokeStyle =', '#64b5f6'], ['lineWidth =', THICKNESS * 1.5],
];
/** A segment's body alone, in its link colour and the default thickness: what Crystal Stream draws under its still crystals, past the state it sets for it. */
const drawn = (linkStyle: string, u0 = 0, isStatic = true) => {
    const s = segment(linkStyle, u0, isStatic);
    const { ctx, calls } = spy();
    drawBase(ctx, s, 2, true);
    if (linkStyle === 'hidden') return { s, calls };
    expect(calls.slice(0, GLOW_BASE.length)).toEqual(GLOW_BASE);
    expect(calls.at(-1)).toEqual(['globalAlpha =', 1]);
    return { s, calls: calls.slice(GLOW_BASE.length, -1) };
};
/** The spline's controls, a quarter of the 447 px between the ends out along each slot. */
const SPLINE_CALL = ['bezierCurveTo', 100 + Math.hypot(400, 200) / 4, 100, 500 - Math.hypot(400, 200) / 4, 300, 500, 300];

beforeEach(() => {
    clock.linkFlow = 0;
});

describe('Link.Style', () => {
    it('has a body for every option, and no other', () => {
        const options = SETTINGS.flatMap((s) => (s.id === '🔗 Enhanced Links.Link.Style' && s.type === 'combo' ? s.options.map((o) => o.value) : []));
        expect(Object.keys(LINK_STYLES).sort()).toEqual([...options].sort());
    });

    it('strokes the path itself, 0.8 × the thickness wide, for the path styles', () => {
        for (const style of ['spline', 'straight', 'linear', 'stepped', 'zigzag', 'coil']) {
            const { calls } = drawn(style);
            expect(calls, style).toEqual([['beginPath'], ['moveTo', 100, 100], SPLINE_CALL, ['strokeStyle =', '#64b5f6'], ['lineWidth =', WIDTH], ['stroke']]);
        }
    });

    it('draws nothing for Effect only', () => {
        expect(drawn('hidden').calls).toEqual([]);
    });

    it('dots and dashes the real path, from the start of the link, and marches them toward the input while moving', () => {
        for (const [style, dash] of [['dotted', [0, 9]], ['dashed', [12, 6]]] as const) {
            const still = drawn(style, 40).calls;
            expect(still.slice(-10), style).toEqual([
                ['setLineDash', dash], ['lineDashOffset =', 40],
                ['beginPath'], ['moveTo', 100, 100], SPLINE_CALL, ['strokeStyle =', '#64b5f6'], ['lineWidth =', WIDTH], ['stroke'],
                ['setLineDash', []], ['lineDashOffset =', 0],
            ]);
            // Going Forward the flow grows, so the offset falls: the pattern moves toward the input, 12 px per unit of flow.
            clock.linkFlow = 2.5;
            expect(drawn(style, 40, false).calls.find(([name]) => name === 'lineDashOffset =')).toEqual(['lineDashOffset =', 40 - 30]);
            clock.linkFlow = 0;
        }
        // Dots are round caps on dashes of no length.
        expect(drawn('dotted').calls[0]).toEqual(['lineCap =', 'round']);
    });

    it('runs Double rails 0.8 × the thickness to each side of the path', () => {
        const { s, calls } = drawn('double');
        expect(calls.filter(([name]) => name === 'stroke')).toHaveLength(2);
        const rails = points(calls, ['moveTo', 'lineTo']);
        expect(rails.length).toBeGreaterThan(100);
        for (const point of rails) expect(nearest(s, point).off, `${point}`).toBeCloseTo(2.4, 1);
    });

    it('twists Rope 3 px around the path, then lays its highlight on the same twist', () => {
        const { s, calls } = drawn('rope');
        const twist = points(calls, ['moveTo', 'lineTo']);
        const [main, highlight] = [twist.slice(0, twist.length / 2), twist.slice(twist.length / 2)];
        expect(highlight).toEqual(main);
        // Sampled every 3 px, a tenth of a twist, so the crests come within 5% of 3 px.
        const offsets = main.map((point) => nearest(s, point).off);
        expect(Math.max(...offsets)).toBeLessThanOrEqual(3 + 0.01);
        expect(Math.max(...offsets)).toBeGreaterThan(2.85);
        expect(Math.min(...offsets)).toBeLessThan(0.1);
        expect(calls.filter(([name]) => name === 'strokeStyle =').map(([, value]) => value)).toEqual(['#64b5f6', 'rgba(255, 255, 255, 0.3)']);
        // A quarter twist along its link, a segment starts at the twist's crest, so the twist runs on across a reroute.
        const [start] = points(drawn('rope', 7.5).calls, ['moveTo']);
        expect(nearest(s, start).off).toBeCloseTo(3, 2);
    });

    it('hangs Chain rings along the path every 4 × the thickness from the start of the link, turned with it', () => {
        // 5 px along its link, so its first ring is 7 px in.
        const { s, calls } = drawn('chain', 5);
        const rings = calls.filter(([name]) => name === 'ellipse') as [string, number, number, number, number, number][];
        expect(rings.length).toBe(Math.ceil((s.path.length - 7) / 12));
        const out = new Float64Array(4);
        rings.forEach(([, x, y, rx, ry, rotation], i) => {
            s.path.find(7 + 12 * i, out);
            expect(Math.hypot(x - out[0], y - out[1]), `ring ${i}`).toBeLessThan(1e-9);
            expect([rx, ry, rotation]).toEqual([THICKNESS * 2, THICKNESS * 1.2, Math.atan2(out[3], out[2])]);
        });
    });

    it('puts a Pulse blob where each of its dashes starts, and Holographic scanlines across the path', () => {
        const pulse = drawn('pulse');
        expect(pulse.calls.find(([name]) => name === 'setLineDash')).toEqual(['setLineDash', [12, 12]]);
        const blobs = points(pulse.calls, ['arc']);
        blobs.forEach((point, i) => {
            const { off, at } = nearest(pulse.s, point);
            expect(off).toBeLessThan(0.05);
            expect(at).toBeCloseTo(24 * i, 0);
        });
        const holo = drawn('holographic');
        // Past the sheen's own moveTo.
        const ends = points(holo.calls, ['moveTo', 'lineTo']).slice(1);
        expect(ends.length / 2).toBe(Math.ceil(holo.s.path.length / 6));
        for (let i = 0; i < ends.length; i += 2) {
            const [a, b] = [ends[i], ends[i + 1]];
            const middle: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            // 2 × thickness long, centred on the path, at right angles to it.
            expect(Math.hypot(b[0] - a[0], b[1] - a[1])).toBeCloseTo(6, 9);
            expect(nearest(holo.s, middle).off).toBeLessThan(0.05);
            expect(nearest(holo.s, a).off).toBeCloseTo(3, 1);
        }
    });

    it('strokes Glow path along the real path twice, the white glow 2 × the thickness wide at half the alpha', () => {
        const { calls } = drawn('glowpath');
        expect(calls.filter(([name]) => name === 'bezierCurveTo')).toEqual([SPLINE_CALL, SPLINE_CALL]);
        expect(calls.filter(([name]) => name === 'lineWidth =')).toEqual([['lineWidth =', WIDTH], ['lineWidth =', THICKNESS * 2]]);
        expect(calls.filter(([name]) => name === 'globalAlpha =')).toEqual([['globalAlpha =', 0.5], ['globalAlpha =', 1]]);
    });

    it('draws every body and base in colours and arguments a canvas takes', () => {
        for (const style of Object.keys(LINK_STYLES)) {
            for (const animate of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
                for (const still of [false, true]) {
                    const rec = new CanvasRecorder();
                    preview('🔗 Enhanced Links.Link.Shadow.Enabled', true);
                    drawBase(rec.ctx, segment(style, 17, still), animate, still);
                    expect(rec.lines.filter((line) => /ignored|threw/.test(line)), `${style}, animation ${animate}${still ? ', still' : ''}`).toEqual([]);
                }
            }
        }
        preview('🔗 Enhanced Links.Link.Shadow.Enabled', false);
    });
});

describe('the base under each animation', () => {
    /** The strokes of an animation's base, as [colour, alpha, width, blur]. */
    function base(animate: number, still: boolean, style = 'spline'): unknown[][] {
        const rec = new CanvasRecorder();
        drawBase(rec.ctx, segment(style), animate, still);
        return rec.paints.map((p) => [p.style, p.globalAlpha, p.lineWidth, p.shadowBlur]);
    }

    it("is v1's: a ghost at 30% under Crystal Stream, Quantum Field and Energy Pulse, the link under Classic Flow, nothing under the rest", () => {
        // Each glowing in its own colour, where v1's ghosts took the glow of the link before them.
        const ghost = [['#64b5f6', 0.3, WIDTH, 10]];
        const moving = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((animate) => base(animate, false));
        expect(moving).toEqual([[], ghost, ghost, [], ghost, [], [], [], [['#64b5f6', 1, WIDTH, 10]]]);
    });

    it("is v1's still: the link with its glow under Sacred Flow and Crystal Stream, a ghost under Quantum, Energy and Stellar", () => {
        const ghost = [['#64b5f6', 0.3, WIDTH, 10]];
        const still = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((animate) => base(animate, true));
        const glow = [['#64b5f6', 1, WIDTH, 10]];
        expect(still).toEqual([glow, glow, ghost, [], ghost, [], [], ghost, glow]);
    });

    it('is nothing for Effect only', () => {
        for (const animate of [1, 2, 3, 4, 5, 6, 7, 8, 9]) for (const still of [false, true]) expect(base(animate, still, 'hidden')).toEqual([]);
    });
});
