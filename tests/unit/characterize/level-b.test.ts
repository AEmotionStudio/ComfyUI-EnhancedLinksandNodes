/**
 * Level B, behavioural (the v3 delivery plan's faithfulness gate). For links:
 * each animation repeats every 2.40 s of v1's phase at speed 1, flows toward
 * the input going Forward and back going Reverse, and moves four times as far
 * at twice the speed; each draws v1's counts of elements at each Quality and
 * Particle.Density preset; Classic Flow's halo is centred; the Same as link
 * marker colour exists; and the Marker settings reach only Classic Flow
 * unless Marker.All brings markers to every animation. For nodes: the effect
 * lies over the body after its fill, at v1's energy; the body casts v1's halo
 * and a selected node takes v1's frame, as v1's own drawNodeShape drew them;
 * with Show base effect off each style draws its own particles; the five
 * title styles draw five ways, each node's title once; a successful run plays
 * v1's three bursts; and the particles run at v1's 60 Hz speed at any frame
 * rate. The clock's own pins
 * (2.40 s a turn, the signed flow, the turnaround) are in engine.test.ts.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { TURN, clock, live } from '@/core/engine';
import { pool } from '@/fx/particles';
import { palette } from '@/core/colors';
import { SETTINGS, preview } from '@/core/settings';
import { MOVING } from '@/links/animations';
import { Segment } from '@/links/pipeline';
import { drawMarkers } from '@/links/styles';
import { CanvasRecorder } from '../../helpers/recording-context';
import { canonical } from '../../helpers/canonical';
import { fake } from '../../helpers/fake-app';
import { FakeNode, frames, run, start, type FakeCanvas, type GraphSpec } from '../../helpers/fake-litegraph';
import { HAVE_V1, setupV1 } from './v1-code';
import { V1_LINK_SETTINGS, V1_NODE_SETTINGS, storeSettings } from './v1-inputs';

const [LEFT, RIGHT, SPLINE] = [3, 4, 2];
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
/** The clock the animations are drawn at. */
type Moment = Parameters<(typeof MOVING)[number]>[2];
const HALO = 'rgba(0, 0, 0, 0.95)';
const CUSTOM = { '🔗 Enhanced Links.Color.Mode': 'custom' };

/** A level link from x 100 to x 900, which native's spline draws as a straight line. */
function level(): Segment {
    const s = new Segment();
    s.path.set([100, 100], [900, 100], RIGHT, LEFT, SPLINE);
    s.len = s.chain = s.path.length;
    s.pal = palette('#64b5f6')!;
    return s;
}

/** v1's clock at speed 1, `t` seconds in, the way Direction runs. */
const at = (t: number, direction = 1): Moment => ({ linkPhase: -PHI2 * t * direction, quantumPhase: -PHI2 * t * direction, linkFlow: 2 * t * direction, linkDir: direction });

function draw(style: number, k: Moment, s = level()): CanvasRecorder {
    const rec = new CanvasRecorder();
    if (style === 9) drawMarkers(rec.ctx, s, k.linkPhase, k.linkFlow);
    else MOVING[style](rec.ctx, s, k);
    return rec;
}

/** The points of each path a trace strokes. */
function strokes(rec: CanvasRecorder): [number, number][][] {
    const out: [number, number][][] = [];
    let path: [number, number][] = [];
    for (const line of rec.lines) {
        const call = /^(?:moveTo|lineTo)\(([^,]+), ([^)]+)\)$/.exec(line);
        if (line === 'beginPath()') path = [];
        else if (line === 'stroke()') out.push(path);
        else if (call) path.push([Number(call[1]), Number(call[2])]);
    }
    return out;
}

/** The middles of what a trace fills in `colour`, or of everything but the halos. */
const fills = (rec: CanvasRecorder, colour?: string) => rec.paints
    .filter((p) => p.op === 'fill' && (colour ? p.style === colour : p.style !== HALO))
    .map((p) => (p.box![0] + p.box![2]) / 2);

/** The middles of Stellar Plasma's beads, in its primary and secondary colours, from the output on. */
const beads = (rec: CanvasRecorder) => rec.paints
    .filter((p) => p.op === 'fill' && (p.style === '#ffb300' || p.style === '#fb00ff'))
    .map((p) => [(p.box![0] + p.box![2]) / 2, (p.box![1] + p.box![3]) / 2] as [number, number])
    .sort((a, b) => a[0] - b[0]);

/** Where a stroke along y = 100 first crosses it going up, past x 200. */
function crossing(points: [number, number][]): number {
    for (let i = 1; i < points.length; i++) {
        const [[x0, y0], [x1, y1]] = [points[i - 1], points[i]];
        if (x0 > 200 && y0 < 100 && y1 >= 100) return x0 + ((x1 - x0) * (100 - y0)) / (y1 - y0);
    }
    return NaN;
}

/** Where along the level link each animation's motion is, at a moment: its elements, or where a wave of it crosses the link. */
const WHERE: Record<number, (rec: CanvasRecorder) => number[]> = {
    1: (rec) => fills(rec),
    2: (rec) => rec.lines.filter((line) => line.startsWith('translate(')).map((line) => Number(line.slice(10, line.indexOf(',')))),
    3: (rec) => [crossing(strokes(rec)[0])],
    4: (rec) => [crossing(strokes(rec)[0])],
    5: (rec) => fills(rec),
    6: (rec) => [crossing(strokes(rec)[0])],
    7: (rec) => fills(rec),
    8: (rec) => [crossing(beads(rec))],
    9: (rec) => fills(rec),
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('Level B: links', () => {
    it("repeat every turn of v1's phase, 2.40 s at speed 1, where the phase alone drives them", () => {
        storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Animate': 3 });
        const turn = (2 * Math.PI) / PHI2;
        expect(turn).toBeCloseTo(2.4, 4);
        // Quantum Field moves by its phase only.
        for (const t of [0.3, 1.7]) {
            const k = (s: number): Moment => ({ ...at(s), linkFlow: 0 });
            expect(canonical(draw(3, k(t + turn)).trace())).toBe(canonical(draw(3, k(t)).trace()));
            expect(canonical(draw(3, k(t + turn * 0.3)).trace())).not.toBe(canonical(draw(3, k(t)).trace()));
        }
    });

    it('flow toward the input going Forward and toward the output going Reverse', () => {
        for (let style = 1; style <= 9; style++) {
            storeSettings({ ...V1_LINK_SETTINGS, ...CUSTOM, '🔗 Enhanced Links.Quality': 2 });
            for (const direction of [1, -1]) {
                preview('🔗 Enhanced Links.Direction', direction);
                const [now, next] = [0.31, 0.33].map((t) => WHERE[style](draw(style, at(t, direction))));
                const moved = now.map((x, i) => next[i] - x).filter((dx) => Math.abs(dx) < 100);
                expect(moved.length, `style ${style}`).toBeGreaterThan(0);
                // The input is at x 900.
                for (const dx of moved) expect(Math.sign(dx), `style ${style}, direction ${direction}`).toBe(direction);
            }
        }
    });

    it('move four times as far at twice the speed', async () => {
        const moved: number[] = [];
        for (const speed of [1, 2]) {
            // Direct, so that along the level link x runs with the fraction of the link, as a spline's x does not.
            const canvas = await start({ '🔗 Enhanced Links.Animation.Speed': speed, '🔗 Enhanced Links.Link.Style': 'straight' }, { nodes: [{ pos: [100, 200] }, { pos: [900, 200] }], links: [{ from: 0, to: 1 }] });
            frames(3);
            // The first marker's arrow along the level link, at y 214, a tenth of a second apart.
            const where = () => {
                const from = canvas.front.lines.length;
                frames(1);
                return Number(/^translate\(([\d.]+), 214\)$/.exec(canvas.front.lines.slice(from).find((line) => /^translate\(.*, 214\)$/.test(line))!)![1]);
            };
            const before = where();
            frames(5);
            moved.push(where() - before);
        }
        expect(moved[1] / moved[0]).toBeCloseTo(4, 1);
    });

    it("draw v1's counts at each Quality and Particle.Density preset", () => {
        const presets = SETTINGS.find((s) => s.id === '🔗 Enhanced Links.Particle.Density')!;
        expect(presets.type === 'combo' && presets.options.map((o) => o.value)).toEqual([0.5, 1, 2, 3]);
        for (const Q of [1, 2, 3]) {
            for (const D of [0.5, 1, 2, 3]) {
                storeSettings({ ...V1_LINK_SETTINGS, ...CUSTOM, '🔗 Enhanced Links.Quality': Q, '🔗 Enhanced Links.Particle.Density': D });
                const s = level();
                const counts = (style: number) => draw(style, at(0.37), s);
                const at1 = (n: number) => Math.max(1, Math.floor(n));
                const where = `Q ${Q}, D ${D}`;
                expect(fills(counts(1)), where).toHaveLength(at1(3 * Q * D));
                expect(counts(2).paints, where).toHaveLength(at1(7 * Q * D));
                expect(strokes(counts(3)).map((p) => p.length), where).toEqual(Array(5).fill(at1(12 * Q * D) + 1));
                expect(strokes(counts(4)).map((p) => p.length), where).toEqual(Array(3).fill(12 * Q + 1));
                expect(fills(counts(5)), where).toHaveLength(3 * Q);
                const dna = strokes(counts(6)).map((p) => p.length);
                expect(dna, where).toEqual([24 * Q + 1, 24 * Q + 1, ...Array(16).fill(2)]);
                expect(strokes(counts(7)).map((p) => p.length), where).toEqual([36 * Q + 1, 36 * Q + 1]);
                expect(fills(counts(7)), where).toHaveLength(at1(9 * Q * D));
                // A bead every 20 px or so, each third with a spark.
                const beads = Math.floor(Math.floor(s.chain / 20) * Q * D) + 1;
                expect(fills(counts(8), '#ffb300').length + fills(counts(8), '#fb00ff').length, where).toBe(beads);
                expect(fills(counts(8), '#9d00ff'), where).toHaveLength(Math.ceil(beads / 3));
                // Classic Flow: 1.5 × Quality × Marker.Size × Particle.Density markers.
                expect(fills(counts(9)), where).toHaveLength(at1(1.5 * Q * 3 * D));
            }
        }
    });

    it('sit Classic Flow on a centred halo, whose blur is the glow', () => {
        storeSettings(V1_LINK_SETTINGS);
        const rec = draw(9, at(0.5));
        const halos = rec.paints.filter((p) => p.style === HALO);
        expect(halos.length).toBeGreaterThan(0);
        expect(halos.every((p) => p.shadowOffsetX === 0 && p.shadowOffsetY === 0 && p.shadowBlur === 10 && p.shadowColor === HALO)).toBe(true);
    });

    it('offer the Same as link marker colour', () => {
        const mode = SETTINGS.find((s) => s.id === '🔗 Enhanced Links.Marker.Color.Mode')!;
        expect(mode.type === 'combo' && mode.options.map((o) => o.value)).toContain('inherit');
    });

    it('take the Marker settings in Classic Flow only, unless Marker.All brings markers to every animation', async () => {
        const graph: GraphSpec = { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1, type: 'IMAGE' }] };
        const diamonds = async (settings: Record<string, unknown>) => {
            const canvas = await start({ '🔗 Enhanced Links.Marker.Shape': 'diamond', '🔗 Enhanced Links.Marker.Color': '#123456', '🔗 Enhanced Links.Marker.Color.Mode': 'custom', ...settings }, graph);
            frames(3);
            return canvas.front.paints.filter((p) => p.style === '#123456').length;
        };
        expect(await diamonds({})).toBeGreaterThan(0);
        for (let style = 1; style <= 8; style++) {
            expect(await diamonds({ '🔗 Enhanced Links.Animate': style }), `style ${style}`).toBe(0);
            expect(await diamonds({ '🔗 Enhanced Links.Animate': style, '🔗 Enhanced Links.Marker.All': true }), `style ${style} with Marker.All`).toBeGreaterThan(0);
        }
    });
});

/** v1's settings, with node effects only. */
const V1_NODES = { ...V1_NODE_SETTINGS, '🔗 Enhanced Links.Animate': 0 };
const KSAMPLER: GraphSpec = { nodes: [{ pos: [100, 100], size: [220, 120], title: 'KSampler' }] };

/**
 * One frame of `canvas`'s front pass: its paints, where native filled each node's body among them, and the halos, fills
 * off to the side whose shadow alone lands on their node.
 */
function nodeFrame(canvas: FakeCanvas) {
    const from = canvas.front.paints.length;
    frames(1);
    const paints = canvas.front.paints.slice(from);
    return {
        paints,
        bodies: paints.flatMap((p, i) => (p.op === 'fill' && p.style === '#353535' && p.shadowOffsetX >= 0 ? [i] : [])),
        halos: paints.filter((p) => p.op === 'fill' && p.shadowOffsetX < 0),
    };
}

describe('Level B: nodes', () => {
    it("lie over the body after its fill, at v1's energy: Intensity × 1.5", async () => {
        for (const intensity of [1, 1.6]) {
            const canvas = await start({ ...V1_NODES, '📦 Enhanced Nodes.Intensity': intensity, '📦 Enhanced Nodes.Particle.Show': false }, KSAMPLER);
            const { paints, bodies } = nodeFrame(canvas);
            // Neon Nexus's tube on the body: its four layers glow (i + 1) × 12 × the energy × Animation.Glow (0.5), as v1's did.
            const tube = paints.slice(bodies[0]).filter((p) => p.op === 'stroke' && p.shadowBlur > 0 && p.style !== 'rgba(255, 255, 255, 0.4)').map((p) => p.shadowBlur);
            const energy = intensity * 1.5;
            [12, 20, 24, 36].forEach((f, i) => expect(tube[i], `intensity ${intensity}`).toBeCloseTo(f * energy * 0.5, 9));
        }
    });

    it("cast v1's halo and frame a selected node as v1's own drawNodeShape did", async () => {
        const canvas = await start({ ...V1_NODES, '📦 Enhanced Nodes.Particle.Show': false }, KSAMPLER);
        canvas.graph._nodes[0].selected = true;
        const { paints, halos } = nodeFrame(canvas);
        const [halo] = halos;
        const frame = paints.filter((p) => p.op === 'strokeRect').map((p) => [p.style, p.shadowColor, p.shadowBlur, p.lineWidth, p.box]);
        // v1's settings: Glow 1, custom colours.
        expect([halo.shadowColor, halo.shadowBlur]).toEqual(['#ffb300', 10]);
        expect(frame).toEqual([['#fb00ff', '#9d00ff', 45, 2, [100, 100, 320, 220]], ['#fb00ff', '#9d00ff', 45, 2, [100, 100, 320, 220]]]);
        if (!HAVE_V1) return;
        await setupV1();
        fake.settings = new Map(Object.entries(V1_NODE_SETTINGS));
        const rec = new CanvasRecorder();
        rec.ctx.translate(100, 100);
        (fake.LGraphCanvas.prototype as unknown as { drawNodeShape: (...args: unknown[]) => void }).drawNodeShape.call(new fake.LGraphCanvas(), { id: 1, size: [220, 120] }, rec.ctx, [220, 120], '#333', '#353535', true);
        const v1Body = rec.paints.find((p) => p.style === '#353535')!;
        expect([v1Body.shadowColor, v1Body.shadowBlur]).toEqual([halo.shadowColor, halo.shadowBlur]);
        expect(rec.paints.filter((p) => p.op === 'strokeRect').map((p) => [p.style, p.shadowColor, p.shadowBlur, p.lineWidth, p.box])).toEqual(frame.slice(0, 1));
    });

    it("draw each style's own particles with Show base effect off", async () => {
        const drawn: Record<number, string[]> = {};
        for (let style = 1; style <= 4; style++) {
            const canvas = await start({ ...V1_NODES, '📦 Enhanced Nodes.Animate': style, '📦 Enhanced Nodes.Animations.Enabled': false }, KSAMPLER);
            const { paints, bodies, halos } = nodeFrame(canvas);
            // Past what native draws, the background, the body, its title and its widget, and the halo.
            const ours = paints.filter((p, i) => !bodies.includes(i) && !halos.includes(p) && !['drawImage', 'fillText', 'fillRect'].includes(p.op));
            drawn[style] = [...new Set(ours.map((p) => `${p.op} ${p.style.replace(/^grad\d+$/, 'gradient')}`))].sort();
        }
        expect(drawn).toEqual({
            // Gentle Pulse's fireflies: a glow and a core each, in the particle colour.
            1: ['fill #ffb300', 'fill gradient'],
            // Neon Nexus's hexagons, without its tube, scan line or grid.
            2: ['fill #ffb300'],
            // Cosmic Ripple's corona, without its rings.
            3: ['fill gradient', 'fill rgba(255, 179, 0, 0.7)'],
            // Sacred Rosette's dots, without its pattern.
            4: ['fill #ffb300'],
        });
    });

    it('draw five distinct title styles, each node its title once', async () => {
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const drawn = new Set<string>();
        for (const style of ['neon', 'cyberpunk', 'retro', 'pulse', 'minimal']) {
            const canvas = await start({ ...V1_NODES, '📦 Enhanced Nodes.Text.Animation.Enabled': true, '📦 Enhanced Nodes.Text.Style': style }, KSAMPLER);
            native.mockClear();
            const from = canvas.front.lines.length;
            frames(1);
            const shown = canonical(canvas.front.lines.slice(from).join('\n')).split('\n').filter((line) => line.startsWith('fillText') || /^stroke \[[^\]]*\] moveTo\(30, -5\)/.test(line));
            drawn.add(shown.join('\n'));
            // Native's title, once, where nobody sees it; the frame shows ours.
            expect(native.mock.calls.map(([ctx]) => ctx === canvas.ctx), style).toEqual([false]);
            expect(shown.every((line) => line.includes('"KSampler"') || line.startsWith('stroke')), style).toBe(true);
        }
        expect(drawn.size).toBe(5);
    });

    it("play v1's fireworks when this client's run succeeds: three bursts in v1's colours, sizes and delays, 250 sparks each, for 1.2 s", async () => {
        // v1 had End Animation off by default.
        const canvas = await start({ ...V1_NODES, '📦 Enhanced Nodes.End Animation.Enabled': true }, { nodes: [{ pos: [100, 400], output: true }] });
        run('level b', [1]);
        // 250 sparks a burst.
        expect([0, 1, 2].map((burst) => Array.from(pool.kind.subarray(0, pool.count)).filter((kind, i) => kind === 1 && pool.owner[i] === burst).length)).toEqual([250, 250, 250]);
        // Each frame's cores: where each burst's centre is, its radius and its colour, drawn again at that moment.
        const seen: [number, number, number, string][][] = [];
        for (frames(1); live.bursts; frames(1)) {
            const from = canvas.front.lines.length;
            canvas.setDirty(true, false);
            canvas.draw();
            const lines = canvas.front.lines.slice(from);
            seen.push(lines.flatMap((line, i) => {
                const core = /^grad\d+ = createRadialGradient\(([^,]+), ([^,]+), 0, \1, \2, ([^)]+)\)$/.exec(line);
                if (!core || Number(core[3]) < 30) return [];
                return [[Number(core[1]), Number(core[2]), Number(core[3]), /rgba\((\d+, \d+, \d+)/.exec(lines[i + 2])![1]] as [number, number, number, string]];
            }));
        }
        expect(seen.length / 60).toBeCloseTo(1 / 0.84, 1);
        // Rose at (5 %, -20 %) of the view off the node, cyan at (3 %, -15 %) and gold at (6 %, -15 %), each a tenth of the show after the one before.
        const firsts = [0, 1, 2].map((burst) => seen.findIndex((cores) => cores.length > burst));
        expect(seen[firsts[2]].map(([x, y, , colour]) => [x, y, colour])).toEqual([[180, 220, '255, 51, 102'], [148, 265, '51, 238, 255'], [196, 265, '255, 238, 51']]);
        // The clock starts on the frame after the run, so frame k is k / 60 s into the show.
        expect(firsts.map((frame) => Math.round((frame / 60) * 0.84 * 10) / 10)).toEqual([0, 0.1, 0.2]);
        // Each core grows from a tenth of 0.2 × the view's height × the burst's size to six tenths.
        const sizes = [3.2, 2.9, 3];
        const frame = firsts[2] + 3;
        const phase = (frame / 60) * 0.84;
        seen[frame].forEach(([, , r], burst) => expect(r, `burst ${burst}`).toBeCloseTo(900 * 0.2 * sizes[burst] * (0.1 + 0.5 * (phase - burst * 0.1)), 0));
    });

    it("run the particles at v1's speed at 60 Hz, and at 144 Hz too", async () => {
        for (const hz of [60, 144]) {
            for (const speed of [1, 2.5]) {
                await start({ ...V1_NODES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Speed': speed }, KSAMPLER);
                frames(5, hz);
                const before = clock.particleTime;
                frames(hz, hz);
                // v1's ParticleController stepped (2π/15) × Particle.Speed a second at 60 Hz, which Gentle Pulse takes as TURN × this time.
                expect(TURN * (clock.particleTime - before), `${hz} Hz, speed ${speed}`).toBeCloseTo(((2 * Math.PI) / 15) * speed, 6);
            }
        }
    });
});
