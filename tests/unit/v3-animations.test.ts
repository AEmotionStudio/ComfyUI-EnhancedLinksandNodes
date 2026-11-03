/**
 * v3's own link animations (src/links/animations.ts): Merkaba Beads, DNA
 * Helix 3D and Comet Trails. Each keeps its pace in px along the link and
 * carries on across its reroutes, and plays backwards going Reverse. Merkaba
 * Beads and Comet Trails count their elements by the link's length, Quality
 * and Particle.Density, one a link at least, and half as many while
 * Perf.Adaptive thins them, as DNA Helix 3D does its rungs. Each glows as
 * Glow says in its link's colours, none while Adaptive draws plain, and holds
 * a pose of its own while still, whatever the clock. Their traces are in
 * v3-traces.test.ts, and the flash test in v1-deviations.ts.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { STILL_PHASE, clock } from '@/core/engine';
import { lighter, palette } from '@/core/colors';
import { preview } from '@/core/settings';
import { noise } from '@/fx/particles';
import { MOVING, moving } from '@/links/animations';
import { Segment } from '@/links/pipeline';
import { STILL } from '@/links/stills';
import { CanvasRecorder } from '../helpers/recording-context';
import { storeSettings } from './characterize/v1-inputs';

const [LEFT, RIGHT, SPLINE] = [3, 4, 2];
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
type Moment = Parameters<(typeof MOVING)[number]>[2];
const [BEADS, HELIX, COMETS] = [10, 11, 12];
const DENSITY = '🔗 Enhanced Links.Particle.Density';
/** Custom colours, the defaults, so that each role is told apart. */
const CUSTOM = { '🔗 Enhanced Links.Color.Mode': 'custom' };
const [PRIMARY, SECONDARY, ACCENT, WHITE] = ['#ffb300', '#fb00ff', '#9d00ff', '#ffffff'];

/** The clock at speed 1, `t` seconds in, the way Direction runs. */
const at = (t: number, direction = 1): Moment => ({ linkPhase: -PHI2 * t * direction, quantumPhase: -PHI2 * t * direction, linkFlow: 2 * t * direction, linkDir: direction });

/** A level link from x 100 to x `to`, which native's spline draws straight, in segments split at reroutes at `reroutes` x, laid as the pipeline lays them. */
function level(to = 900, reroutes: number[] = []): Segment[] {
    const xs = [100, ...reroutes, to];
    const segments = xs.slice(1).map((x, i) => {
        const s = new Segment();
        s.path.set([xs[i], 100], [x, 100], RIGHT, LEFT, SPLINE);
        s.len = s.path.length;
        s.pal = palette('#64b5f6')!;
        return s;
    });
    const chain = segments.reduce((sum, s) => sum + s.len, 0);
    let u0 = 0;
    for (const s of segments) {
        Object.assign(s, { u0, chain, t0: u0 / chain, t1: (u0 + s.len) / chain });
        u0 += s.len;
    }
    return segments;
}

function draw(animate: number, k: Moment, segments = level()): CanvasRecorder {
    const rec = new CanvasRecorder();
    for (const s of segments) MOVING[animate](rec.ctx, s, k);
    return rec;
}

/** Where along x the beads are, as each is turned about its middle, or the comets' heads, by their white cores. */
const beads = (rec: CanvasRecorder) => rec.lines.filter((line) => line.startsWith('translate(')).map((line) => Number(line.slice(10, line.indexOf(','))));
const heads = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && p.style === WHITE).map((p) => (p.box![0] + p.box![2]) / 2);
const WHERE: Record<number, (rec: CanvasRecorder) => number[]> = { [BEADS]: beads, [COMETS]: heads };

/** Each path a trace strokes: its points, with its paint. */
function strokes(rec: CanvasRecorder) {
    const painted = rec.paints.filter((p) => p.op === 'stroke');
    const out: { points: [number, number][]; style: string; alpha: number; width: number; blur: number }[] = [];
    let points: [number, number][] = [];
    for (const line of rec.lines) {
        const call = /^(moveTo|lineTo)\(([^,]+), ([^)]+)\)$/.exec(line);
        if (line === 'beginPath()') points = [];
        else if (call) points.push([Number(call[2]), Number(call[3])]);
        else if (line === 'stroke()') {
            const { style, globalAlpha: alpha, lineWidth: width, shadowBlur: blur } = painted[out.length];
            out.push({ points, style, alpha, width, blur });
        }
    }
    return out;
}

/** Where DNA Helix 3D's strand in `colour` first crosses the level link going down the screen, past x 200. */
function crossing(rec: CanvasRecorder, colour: string): number {
    const points = strokes(rec).filter((s) => s.style === colour).flatMap((s) => s.points).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < points.length; i++) {
        const [[x0, y0], [x1, y1]] = [points[i - 1], points[i]];
        if (x0 > 200 && y0 < 100 && y1 >= 100) return x0 + ((x1 - x0) * (100 - y0)) / (y1 - y0);
    }
    return NaN;
}

afterEach(() => {
    moving.alpha = moving.glow = moving.density = 1;
});

describe("v3's own link animations", () => {
    it('count beads and comets by the length of the link, Quality and Density, one at least, as many along a link through reroutes', () => {
        storeSettings(CUSTOM);
        for (const quality of [1, 2]) {
            preview('🔗 Enhanced Links.Quality', quality);
            for (const density of [0.5, 1, 2, 3]) {
                preview(DENSITY, density);
                for (const [animate, px] of [[BEADS, 60], [COMETS, 120]]) {
                    const count = Math.floor((800 * quality * density) / px);
                    expect(WHERE[animate](draw(animate, at(0.3))), `${animate} at ${quality}, ${density}`).toHaveLength(count);
                    expect(WHERE[animate](draw(animate, at(0.3), level(900, [300, 650]))), `${animate} at ${quality}, ${density}`).toHaveLength(count);
                    // One on a link 30 px long, at the least.
                    expect(WHERE[animate](draw(animate, at(0.3), level(130)))).toHaveLength(Math.max(1, Math.floor((30 * quality * density) / px)));
                }
            }
        }
    });

    it('keep their pace in px, on across reroutes without a jump, but where they come out of the output again', () => {
        storeSettings(CUSTOM);
        const chain = level(900, [300, 650]);
        // Going Forward at speed 1, a bead glides 0.1 of the link and a comet 0.125 for each unit of flow, 2 a second.
        for (const [animate, pace] of [[BEADS, 0.2 * 800], [COMETS, 0.25 * 800]]) {
            let before = WHERE[animate](draw(animate, at(0), chain));
            for (let frame = 1; frame <= 120; frame++) {
                const now = WHERE[animate](draw(animate, at(frame / 60), chain));
                expect(now).toHaveLength(before.length);
                for (const x of now) {
                    if (x < 100 + pace / 60) continue;
                    const moved = Math.min(...before.map((b) => (x - b < 0 ? Infinity : x - b)));
                    // Within what a spline's table of lengths gives.
                    expect(Math.abs(moved - pace / 60), `${animate} at x ${x}`).toBeLessThan(0.1);
                }
                before = now;
            }
        }
    });

    it("wind DNA Helix 3D's strands on across a reroute, with its rungs every 12 px from the start of the link", () => {
        storeSettings(CUSTOM);
        const [into, out] = level(900, [403]);
        const k = at(0.7);
        const ends = (s: Segment) => [...new Set(strokes(draw(HELIX, k, [s])).filter((p) => p.style !== ACCENT)
            .flatMap((p) => p.points).filter(([x]) => Math.abs(x - 403) < 0.01).map(([, y]) => y))].sort();
        expect(ends(into)).toHaveLength(2);
        expect(ends(out)).toEqual(ends(into));
        const rungs = strokes(draw(HELIX, k, [into, out])).filter((p) => p.style === ACCENT).flatMap((p) => p.points.filter((_, i) => i % 2 === 0));
        expect(rungs).toHaveLength(2 * 67);
        for (const [x] of rungs) expect(Math.abs(((x - 94) % 12) - 6)).toBeLessThan(0.1);
    });

    it("run backwards going Reverse, a comet's tail behind its head either way", () => {
        storeSettings(CUSTOM);
        for (const direction of [1, -1]) {
            preview('🔗 Enhanced Links.Direction', direction);
            for (const animate of [BEADS, COMETS]) {
                const [now, next] = [0.31, 0.33].map((t) => WHERE[animate](draw(animate, at(t, direction))));
                const moved = now.map((x, i) => next[i] - x).filter((dx) => Math.abs(dx) < 50);
                expect(moved.length, `${animate}`).toBeGreaterThan(0);
                for (const dx of moved) expect(Math.sign(dx), `${animate}, direction ${direction}`).toBe(direction);
            }
            const [now, next] = [0.31, 0.33].map((t) => crossing(draw(HELIX, at(t, direction)), PRIMARY));
            expect(Math.sign(next - now), `helix, direction ${direction}`).toBe(direction);
            // The longest layer of the first comet's tail, in the primary colour, lies on the side of its head it came from.
            const rec = draw(COMETS, at(0.31, direction), level(900));
            const [head] = heads(rec);
            const tail = rec.paints.find((p) => p.op === 'fill' && p.style === PRIMARY)!.box!;
            expect(Math.sign((tail[0] + tail[2]) / 2 - head), `direction ${direction}`).toBe(-direction);
        }
    });

    it('trail a comet that flew into the input on into it, as the next lap comes out of the output', () => {
        storeSettings(CUSTOM);
        // The first of the 3 comets just out of the output, 8 px along the link.
        const flow = (0.01 - (0.5 + 0.4 * (noise(0) - 0.5)) / 3) / 0.125 + 8;
        const rec = draw(COMETS, { ...at(0), linkFlow: flow });
        expect(Math.min(...heads(rec))).toBeCloseTo(108, 0);
        // Its tail, 100 px long, trails back into the input, 92 px of it on the link.
        const tails = rec.paints.filter((p) => p.op === 'fill' && p.style === PRIMARY).map((p) => p.box!);
        expect(tails.some(([left, , right]) => Math.abs(left - 808) < 0.5 && Math.abs(right - 900) < 0.5)).toBe(true);
    });

    it('trail no comet longer than its link, so that none pops off a short link as the comets come round again', () => {
        storeSettings(CUSTOM);
        const tails = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && [PRIMARY, SECONDARY, ACCENT].includes(p.style))
            .reduce((sum, p) => sum + p.globalAlpha * (p.box![2] - p.box![0]), 0);
        for (const to of [140, 170, 300]) {
            // A comet flies round the link in 4 s at speed 1; a frame at 60 Hz moves it a 240th of the link.
            let before = tails(draw(COMETS, at(0), level(to)));
            for (let frame = 1; frame <= 250; frame++) {
                const now = tails(draw(COMETS, at(frame / 60), level(to)));
                expect(Math.abs(now - before), `${to - 100} px link, frame ${frame}`).toBeLessThan(0.02 * (to - 100));
                before = now;
            }
        }
    });

    it('grow beads and comet heads out of the output over their first 12 px, and back into the input over their last', () => {
        storeSettings(CUSTOM);
        // 6 beads and 3 comets on the 800 px link, the first at T0; at Thickness 3 a bead's core is 4.5 px across, a comet's head 12.
        const first = { [BEADS]: [0.5 / 6, 0.1, ACCENT, 4.5], [COMETS]: [(0.5 + 0.4 * (noise(0) - 0.5)) / 3, 0.125, lighter(ACCENT), 12] } as const;
        for (const animate of [BEADS, COMETS]) {
            const [T0, rate, style, full] = first[animate];
            for (const d of [1, 4, 8, 12, 30]) {
                for (const T of [d / 800, 1 - d / 800]) {
                    const x = 100 + 800 * T;
                    const fills = draw(animate, { ...at(0), linkFlow: (T - T0) / rate }).paints.filter((p) => p.op === 'fill' && p.style === style);
                    const [box] = fills.map((p) => p.box!).sort((a, b) => Math.abs(a[0] + a[2] - 2 * x) - Math.abs(b[0] + b[2] - 2 * x));
                    expect(Math.abs((box[0] + box[2]) / 2 - x)).toBeLessThan(0.1);
                    expect(box[2] - box[0], `${animate}, ${d} px from an end`).toBeCloseTo(full * Math.min(1, d / 12), 6);
                }
            }
        }
    });

    it('thin out by half while Perf.Adaptive thins them, and so do the rungs of DNA Helix 3D', () => {
        storeSettings({ ...CUSTOM, [DENSITY]: 2 });
        const rungs = () => strokes(draw(HELIX, at(0.3))).filter((p) => p.style === ACCENT).reduce((n, p) => n + p.points.length / 2, 0);
        const counts = () => [beads(draw(BEADS, at(0.3))).length, heads(draw(COMETS, at(0.3))).length, rungs()];
        expect(counts()).toEqual([26, 13, 134]);
        moving.density = 0.5;
        expect(counts()).toEqual([13, 6, 68]);
    });

    it("draw DNA Helix 3D's far side faint and fine, then its rungs, the far halves fainter, then its near side bright, along the path's normals", () => {
        storeSettings(CUSTOM);
        const drawn = strokes(draw(HELIX, at(0.4)));
        expect(drawn.map((p) => [p.style, p.alpha, Number(p.width.toFixed(2))])).toEqual([
            [SECONDARY, 0.4, 1], [ACCENT, 0.3, 1], [ACCENT, 0.7, 1], [PRIMARY, 1, 3.3], [SECONDARY, 1, 3.3],
        ]);
        // Each strand on the near side where the other is on the far side.
        const [far, , , nearA, nearB] = drawn;
        expect(far.points.length).toBeGreaterThan(0);
        expect(nearA.points.length + nearB.points.length).toBeGreaterThan(0);
        // 10 px to each side of the level link at most, the radius at Thickness 3.
        for (const [, y] of drawn.flatMap((p) => p.points)) expect(Math.abs(y - 100)).toBeLessThanOrEqual(10 + 1e-9);
        // The near side of both strands in one stroke where they are one colour, as they are but for custom colours.
        storeSettings({});
        const plain = strokes(draw(HELIX, at(0.4)));
        expect(plain.map((p) => [p.alpha, Number(p.width.toFixed(2))])).toEqual([[0.4, 1], [0.3, 1], [0.7, 1], [1, 3.3]]);
        expect(plain[3].points).toHaveLength(nearA.points.length + nearB.points.length);
    });

    it("glow as Glow says, in the link's colours: a bead's outline, DNA Helix 3D's near side alone, a comet's head and not its tail; none while Adaptive draws plain or with Glow 0", () => {
        const glows = (animate: number) => [...new Set(draw(animate, at(0.4)).paints.map((p) => `${p.op} ${p.style} ${p.shadowColor} ${p.shadowBlur}`))].sort();
        storeSettings(CUSTOM);
        expect(glows(BEADS)).toEqual([`fill ${ACCENT} ${SECONDARY} 0`, `stroke ${PRIMARY} ${SECONDARY} 10`]);
        expect(glows(HELIX).filter((glow) => !glow.endsWith(' 0'))).toEqual([`stroke ${SECONDARY} ${SECONDARY} 10`, `stroke ${PRIMARY} ${PRIMARY} 10`]);
        const core = lighter(ACCENT);
        expect(glows(COMETS).filter((glow) => !glow.endsWith(' 0'))).toEqual([`fill ${core} ${ACCENT} 20`]);
        expect(new Set(glows(COMETS).map((glow) => glow.split(' ')[1]))).toEqual(new Set([PRIMARY, SECONDARY, ACCENT, core, WHITE]));
        // The link type colour in every role but the comets' white-hot cores, by default.
        storeSettings({});
        expect(new Set([BEADS, HELIX, COMETS].flatMap((animate) => draw(animate, at(0.4)).paints.map((p) => p.style)))).toEqual(new Set(['#64b5f6', lighter('#64b5f6'), WHITE]));
        moving.glow = 0;
        for (const animate of [BEADS, HELIX, COMETS]) expect(draw(animate, at(0.4)).paints.every((p) => !p.shadowBlur), `${animate} plain`).toBe(true);
        moving.glow = 1;
        storeSettings({ '🔗 Enhanced Links.Glow.Intensity': 0 });
        for (const animate of [BEADS, HELIX, COMETS]) expect(draw(animate, at(0.4)).paints.every((p) => !p.shadowBlur), `${animate} at Glow 0`).toBe(true);
    });

    it("hold their motion's pose at the still phase while still, whatever the clock or the speed, a comet's tail behind it as Direction says", () => {
        storeSettings(CUSTOM);
        const still = (animate: number) => {
            const rec = new CanvasRecorder();
            for (const s of level(900, [450])) STILL[animate](rec.ctx, s, STILL_PHASE);
            return rec.trace();
        };
        for (const animate of [BEADS, HELIX, COMETS]) {
            const before = still(animate);
            Object.assign(clock, { linkPhase: -12.3, quantumPhase: -4.5, linkFlow: 77.7, linkDir: -0.4 });
            preview('🔗 Enhanced Links.Animation.Speed', 3);
            expect(still(animate), `${animate}`).toBe(before);
            expect(draw(animate, { linkPhase: STILL_PHASE, quantumPhase: STILL_PHASE, linkFlow: 0, linkDir: 1 }, level(900, [450])).trace()).toBe(before);
            preview('🔗 Enhanced Links.Animation.Speed', 1);
        }
        const forward = still(COMETS);
        preview('🔗 Enhanced Links.Direction', -1);
        expect(still(COMETS)).not.toBe(forward);
        expect(still(BEADS)).toBe(draw(BEADS, { linkPhase: STILL_PHASE, quantumPhase: STILL_PHASE, linkFlow: 0, linkDir: -1 }, level(900, [450])).trace());
    });
});
