/**
 * The node layers (src/extensions/node-animations.ts) on the fake LiteGraph:
 * each effect draws its part on its node's body once native filled it, clipped
 * to the body and under the widgets, and its part around the body under every
 * node, for every node whose effect reaches the screen. The body casts v1's
 * halo. The styled title takes the native title's place. Node modes fade the
 * effects as native fades the node; collapsed nodes get none, and Vue mode the
 * particles alone. A failing effect leaves the canvas as it found it, and the
 * guard turns it off.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock, dummy, guard, layers, live } from '@/core/engine';
import { N, preview } from '@/core/settings';
import * as colors from '@/core/colors';
import { OVER, UNDER, drawNodeFx, type Part } from '@/nodes/effects';
import { app, fake } from '../helpers/fake-app';
import { CanvasRecorder, fmt, parseColor } from '../helpers/recording-context';
import { FakeCanvas, FakeNode, frames, page, progress, run, send, start, type GraphSpec } from '../helpers/fake-litegraph';
import { WHOLE } from './characterize/v1-inputs';

/**
 * Each call to drawNodeFx: its context, node and sides, and where its lines and paints start and end on `rec`.
 * With `fail` set the calls move the canvas and throw instead of drawing.
 */
const probe = vi.hoisted(() => ({
    rec: undefined as CanvasRecorder | undefined,
    calls: [] as { ctx: CanvasRenderingContext2D; node: unknown; sides: number; only: boolean; line: number; from: number; to: number }[],
    fail: false,
}));

vi.mock('@/nodes/effects', async (importOriginal) => {
    const effects = await importOriginal<typeof import('@/nodes/effects')>();
    return {
        ...effects,
        drawNodeFx: (...args: Parameters<typeof effects.drawNodeFx>) => {
            const [ctx, , node, , , , part, , only] = args;
            const [line, from] = [probe.rec?.lines.length ?? 0, probe.rec?.paints.length ?? 0];
            if (probe.fail) {
                ctx.translate(1, 1);
                ctx.globalAlpha = 0.5;
                throw new Error('boom');
            }
            effects.drawNodeFx(...args);
            probe.calls.push({ ctx, node, sides: part.sides, only, line, from, to: probe.rec?.paints.length ?? 0 });
        },
    };
});

afterEach(() => {
    vi.restoreAllMocks();
    probe.fail = false;
});

const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0 };
const PARTICLE_SHOW = '📦 Enhanced Nodes.Particle.Show';
const PARTICLES = { [PARTICLE_SHOW]: true };
const TITLES = { '📦 Enhanced Nodes.Text.Animation.Enabled': true };
const KSAMPLER: GraphSpec['nodes'][number] = { pos: [300, 300], size: [220, 120], title: 'KSampler' };

/** Each node effect by its Animate value, and the particles of a node without one. */
const EFFECTS: [name: string, animate: number][] = [['Gentle Pulse', 1], ['Neon Nexus', 2], ['Cosmic Ripple', 3], ['Sacred Rosette', 4], ['Flower of Life', 5], ['Jelly', 6], ['Circuit Trace', 7], ['Aurora Veil', 8], ['Ember Crown', 9], ['Particles alone', 0]];

/** One frame on the front canvas: its lines, and the effect calls it made, with their lines' indexes among those. */
function frame(canvas: FakeCanvas) {
    probe.rec = canvas.front;
    probe.calls = [];
    const first = canvas.front.lines.length;
    frames(1);
    return { lines: canvas.front.lines.slice(first), calls: probe.calls.map((call) => ({ ...call, line: call.line - first })) };
}

/** Where the fake fills a node's body in a frame's lines: the fill() after drawNodeShape sets its colours. */
const bodyFill = (lines: string[], from = 0) => lines.indexOf('fill()', lines.indexOf('strokeStyle = #333333', from));

/** The bodies native fills, in its colour; and the halos, fills off to the side whose shadow alone lands on their node. */
const bodies = (paints: CanvasRecorder['paints']) => paints.filter((p) => p.op === 'fill' && p.style === '#353535' && p.shadowOffsetX >= 0);
const halos = (paints: CanvasRecorder['paints']) => paints.filter((p) => p.op === 'fill' && p.shadowOffsetX < 0);

/**
 * How far paints reach past a box (left, top, right, bottom) on each of those sides: their boxes with half
 * their line, and their shadow moved by its offset and grown by its blur; but for a shape filled far off the canvas
 * that only its shadow lands from, as Sacred Rosette's dots cast their glow, its shadow alone.
 */
function overhang(paints: CanvasRecorder['paints'], [left, top, right, bottom]: number[]): number[] {
    const out = [-Infinity, -Infinity, -Infinity, -Infinity];
    for (const p of paints) {
        if (!p.box) continue;
        const line = p.op.startsWith('stroke') ? p.lineWidth / 2 : 0;
        const blur = parseColor(p.shadowColor)![3] > 0 ? p.shadowBlur : -Infinity;
        const [x0, y0, x1, y1] = p.box;
        const [sx0, sy0, sx1, sy1] = [x0 + p.shadowOffsetX - blur, y0 + p.shadowOffsetY - blur, x1 + p.shadowOffsetX + blur, y1 + p.shadowOffsetY + blur];
        const alone = Math.abs(p.shadowOffsetX) >= 1e4;
        out[0] = Math.max(out[0], line + left - (alone ? sx0 : Math.min(x0, sx0)));
        out[1] = Math.max(out[1], line + top - (alone ? sy0 : Math.min(y0, sy0)));
        out[2] = Math.max(out[2], line + (alone ? sx1 : Math.max(x1, sx1)) - right);
        out[3] = Math.max(out[3], line + (alone ? sy1 : Math.max(y1, sy1)) - bottom);
    }
    return out;
}

describe('what node effects make', () => {
    /** `n` nodes of one size, all on screen. */
    const row = (n: number): GraphSpec => ({ nodes: Array.from({ length: n }, (_, i) => ({ pos: [60 + (i % 5) * 300, 80 + Math.floor(i / 5) * 260], size: [220, 120] as [number, number] })) });

    /** The gradients the front passes of five frames made, from the same moment on; with `still`, frames whose front is dirty though nothing moves. */
    function gradients(canvas: FakeCanvas, still = false): number {
        [clock.nodePhase, clock.particleTime, clock.nodeTime] = [2.1, 3.3, 3.3];
        const from = canvas.front.lines.length;
        for (let i = 0; i < 5; i++) {
            if (still) canvas.setDirty(true, false);
            frames(1);
        }
        return canvas.front.lines.slice(from).filter((line) => /= create(Radial|Linear)Gradient\(/.test(line)).length;
    }

    for (const [name, animate] of EFFECTS) {
        it(`${name} makes its gradients once a frame for all the nodes of a palette and size, and none more while it holds still`, async () => {
            const settings = { ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': animate, '📦 Enhanced Nodes.Particle.Color.Mode': 'rainbow' };
            const made: number[] = [];
            for (const n of [1, 10]) {
                const canvas = await start(settings, row(n));
                frames(2);
                made.push(gradients(canvas));
            }
            expect(made[1], name).toBe(made[0]);
            // Flower of Life and Circuit Trace stroke and fill in their colours alone.
            if (animate !== 5 && animate !== 7) expect(made[0], name).toBeGreaterThan(0);
            preview('📦 Enhanced Nodes.Static.Mode', true);
            const canvas = app.canvas as unknown as FakeCanvas;
            frames(2);
            expect(gradients(canvas, true), `${name}, still`).toBe(0);
        });
    }
});

describe('node effects', () => {
    for (const [name, animate] of EFFECTS) {
        it(`${name} draws on the body after its fill, clipped to it, under the widgets, and around it before any node`, async () => {
            const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': animate }, { nodes: [KSAMPLER] });
            const { lines, calls } = frame(canvas);
            const fill = bodyFill(lines);
            const under = calls.filter((call) => call.line < fill);
            const [over, ...more] = calls.filter((call) => call.line > fill);
            expect(more).toEqual([]);
            expect(over.sides).toBe(OVER);
            expect(over.line).toBeLessThan(lines.indexOf('fillRect(10, 10, 200, 20)'));
            // Clipped to the path native filled the body with.
            expect(lines[lines.lastIndexOf('clip()', over.line) - 1]).toBe(lines[fill - 1]);
            // Around the body only where the whole effect reaches past it: within the screen, without the body.
            const whole = new CanvasRecorder();
            drawNodeFx(whole.ctx, animate, canvas.graph._nodes[0], 220, 120, clock, WHOLE, 1, animate === 0);
            // Jelly and Aurora Veil draw on their body alone, but for the selection frame, which reach() counts whether or not the node is selected.
            const reaches = Math.max(...overhang(whole.paints, [0, -30, 220, 120])) > 0 || animate === 6 || animate === 8;
            expect(under).toHaveLength(reaches ? 1 : 0);
            if (!reaches) return;
            expect(under[0].sides).toBe(UNDER);
            const clip = lines.lastIndexOf('clip("evenodd")', under[0].line);
            expect(lines.slice(clip - 2, clip)).toEqual(['rect(-300, -300, 1600, 900)', lines[fill - 1]]);
            expect(under[0].ctx).toBe(canvas.ctx);
        });
    }

    it('draw between their two parts what they draw whole, each element in the parts it reaches', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Color.Hover.Show': true }, { nodes: [KSAMPLER] });
        const [node] = canvas.graph._nodes;
        [node.selected, node.mouseOver] = [true, true];
        for (const [name, animate] of EFFECTS) {
            preview('📦 Enhanced Nodes.Animate', animate);
            const paints = (sides: number) => {
                const rec = new CanvasRecorder();
                const part = { sides, x0: 0, y0: -30, x1: 220, y1: 120, round: 8 };
                drawNodeFx(rec.ctx, animate, node, 220, 120, clock, sides === (UNDER | OVER) ? WHOLE : part, 1, animate === 0);
                // A gradient's label counts the gradients made before it, which a part makes fewer of.
                return rec.paints.map((p) => JSON.stringify({ ...p, style: p.style.replace(/^grad\d+$/, 'gradient') }));
            };
            if (animate === 4 || animate === 5 || animate === 7 || animate === 9) {
                // Sacred Rosette strokes its chords, and each layer's circles of a colour, as one path, Flower of Life
                // its circles and its rings, Circuit Trace its pins, traces and pulses, and Ember Crown fills its
                // flames: the parts draw the pieces of those paths that reach them.
                const pieces = (sides: number) => {
                    const rec = new CanvasRecorder();
                    const part = { sides, x0: 0, y0: -30, x1: 220, y1: 120, round: 8 };
                    drawNodeFx(rec.ctx, animate, node, 220, 120, clock, sides === (UNDER | OVER) ? WHOLE : part, 1, false);
                    return new Set(rec.lines.filter((line) => /^(arc|lineTo|bezierCurveTo)\(/.test(line)));
                };
                const [whole, under, over] = [UNDER | OVER, UNDER, OVER].map(pieces);
                for (const piece of [...under, ...over]) expect(whole.has(piece), `${name}: ${piece}`).toBe(true);
                expect(new Set([...under, ...over]), name).toEqual(whole);
                continue;
            }
            const [whole, under, over] = [UNDER | OVER, UNDER, OVER].map(paints);
            // Each part draws only what the whole does, in its order, and together they draw all of it.
            const within = (part: string[]) => {
                let at = 0;
                for (const p of part) {
                    at = whole.indexOf(p, at) + 1;
                    if (!at) return false;
                }
                return true;
            };
            expect(within(under), `${name}, under`).toBe(true);
            expect(within(over), `${name}, over`).toBe(true);
            expect(new Set([...under, ...over]), name).toEqual(new Set(whole));
            expect(under.length + over.length, name).toBeLessThan(2 * whole.length);
        }
    });

    it('clip to the body in its shape, and to a box in low quality, as native fills it', async () => {
        const paths: string[] = [];
        for (const [shape, lowQuality] of [[1, false], [2, false], [3, false], [4, false], [2, true]] as const) {
            const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 4 }, { nodes: [{ ...KSAMPLER, shape }] });
            canvas.low_quality = lowQuality;
            const { lines, calls } = frame(canvas);
            const fill = bodyFill(lines);
            const over = calls.find((call) => call.sides === OVER)!;
            expect(lines[lines.lastIndexOf('clip()', over.line) - 1]).toBe(lines[fill - 1]);
            paths.push(lines[fill - 1]);
        }
        expect(paths).toEqual([
            'rect(0, -30, 220, 150)', 'roundRect(0, -30, 220, 150, [8])', 'arc(110, 60, 110, 0, 6.28)', 'roundRect(0, -30, 220, 150, [8, 8, 0, 0])',
            'rect(0, -30, 220, 150)',
        ]);
    });

    it('cast v1\'s halo under the effect: the body\'s shadow in the effect\'s primary colour, 10 × Glow, on native\'s offset', async () => {
        for (const scale of [1, 0.5]) {
            const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 4, '📦 Enhanced Nodes.Glow': 0.8 }, { nodes: [KSAMPLER] });
            canvas.ds.scale = scale;
            const { calls } = frame(canvas);
            const [halo] = halos(canvas.front.paints);
            const [body] = bodies(canvas.front.paints);
            // Filled in the body's colour, at the node's alpha, past the right of the screen, so that only its shadow shows, and lands where the body's would.
            expect([halo.style, halo.globalAlpha, halo.shadowColor, halo.shadowBlur], `zoom ${scale}`).toEqual(['#353535', 1, '#ffcc00', 8]);
            expect(halo.box![0], `zoom ${scale}`).toBeGreaterThan(1600);
            expect([halo.box![0] + halo.shadowOffsetX, halo.box![1] + halo.shadowOffsetY, halo.box![2] + halo.shadowOffsetX, halo.box![3] + halo.shadowOffsetY].map((x) => fmt(x)))
                .toEqual([body.box![0] + 2 * scale, body.box![1] + 2 * scale, body.box![2] + 2 * scale, body.box![3] + 2 * scale].map((x) => fmt(x)));
            // Before the effect draws round the body, which the body then casts no shadow over.
            expect(canvas.front.paints.indexOf(halo)).toBeLessThan(calls[0].from);
            expect(body.shadowColor).toBe('rgba(0, 0, 0, 0)');
        }
    });

    it('cast the halo and draw the effect down to Perf.MinZoom, in low quality too, and neither below it', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 4 }, { nodes: [KSAMPLER] });
        canvas.low_quality = true;
        for (const [scale, drawn] of [[0.4, true], [0.2, false]] as const) {
            canvas.ds.scale = scale;
            const paints = canvas.front.paints.length;
            const { calls } = frame(canvas);
            expect([halos(canvas.front.paints.slice(paints)).length > 0, calls.length > 0], `zoom ${scale}`).toEqual([drawn, drawn]);
        }
    });

    it('draw their glows centred, whatever offset native left', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 3, ...PARTICLES }, { nodes: [KSAMPLER] });
        frame(canvas);
        const over = probe.calls.at(-1)!;
        // Native drawNode offset the shadows by 2; the corona glows around each particle.
        const glows = canvas.front.paints.slice(over.from, over.to).filter((p) => p.shadowBlur > 0);
        expect(glows.length).toBeGreaterThan(0);
        expect(glows.every((p) => p.shadowOffsetX === 0 && p.shadowOffsetY === 0)).toBe(true);
    });

    it('fade with the node as native fades it: bypassed, muted and ghost nodes, with the styled title', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, ...TITLES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Color.Hover.Show': true }, {
            nodes: [{ pos: [100, 100] }, { pos: [400, 100], mode: 4 }, { pos: [100, 400], mode: 2 }, { pos: [400, 400], ghost: true }],
        });
        for (const node of canvas.graph._nodes) [node.mouseOver, node.selected] = [true, true];
        const alphas = [1, 0.2, 0.4, 0.3];
        const { calls } = frame(canvas);
        const paints = canvas.front.paints;
        const scaled = (painted: CanvasRecorder['paints'], alpha: number) => painted.map((p) => p.globalAlpha * alpha);
        // Native draws each body at that alpha.
        expect(bodies(paints).map((p) => p.globalAlpha)).toEqual(alphas);
        expect(halos(paints).map((p) => p.globalAlpha)).toEqual(alphas);
        // Under the nodes and on them, the same drawing as on the node at full alpha, with each of its alphas scaled.
        expect(calls.map((call) => canvas.graph._nodes.indexOf(call.node as FakeNode))).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
        const drawn = (i: number) => paints.slice(calls[i].from, calls[i].to);
        expect(new Set(drawn(4).map((p) => p.globalAlpha)).size).toBeGreaterThan(5);
        for (const layer of [0, 4]) {
            for (const [i, alpha] of alphas.entries()) {
                drawn(layer + i).forEach((p, j) => expect(p.globalAlpha, `call ${layer + i}, paint ${j}`).toBeCloseTo(scaled(drawn(layer), alpha)[j], 9));
            }
        }
        // Gentle Pulse's hover outline and v1's frame among them.
        expect(drawn(4).filter((p) => p.op === 'strokeRect').map((p) => p.style)).toEqual(['rgba(255, 255, 21, 0.7)', '#88ccff']);
        // Neon draws each title four times, the last at an alpha of its own.
        const titles = paints.filter((p) => p.op === 'fillText');
        expect(titles.map((p) => p.globalAlpha)).toEqual(alphas.flatMap((alpha) => scaled(titles.slice(0, 4), alpha)));
    });

    it('draw nothing on a collapsed node, nor its halo', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Color.Hover.Show': true }, {
            nodes: [{ pos: [300, 300], collapsed: true }],
        });
        canvas.graph._nodes[0].mouseOver = true;
        const { lines, calls } = frame(canvas);
        expect(calls).toEqual([]);
        expect(lines.filter((line) => line.startsWith('strokeRect('))).toEqual([]);
        expect(canvas.front.paints.find((p) => p.op === 'fill' && p.style === '#353535')!.shadowColor).toBe('rgba(0, 0, 0, 0.5)');
        expect([live.nodes, live.particles]).toEqual([0, 0]);
    });

    it('draw nothing, nor halos, styled titles or fireworks, with Node effects off, which keeps every node setting', async () => {
        const spec: GraphSpec = { nodes: [{ ...KSAMPLER, output: true }] };
        const selected = async (settings: Record<string, unknown>) => {
            const canvas = await start(settings, spec);
            canvas.graph._nodes[0].selected = canvas.graph._nodes[0].mouseOver = true;
            return canvas;
        };
        const native = frame(await selected(LINKS_OFF)).lines;
        const canvas = await selected({ ...LINKS_OFF, ...PARTICLES, ...TITLES, '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Color.Hover.Show': true, '📦 Enhanced Nodes.Enabled': false });
        const off = frame(canvas);
        expect(off.calls).toEqual([]);
        expect(off.lines).toEqual(native);
        run('off', [1]);
        frames(1);
        expect([live.nodes, live.particles, live.bursts]).toEqual([0, 0, 0]);
        expect([N.animate, N.particleShow, N.textAnimationEnabled]).toEqual([2, true, true]);
        preview('📦 Enhanced Nodes.Enabled', true);
        expect(frame(canvas).calls).toHaveLength(2);
        expect(fake.posts).toEqual([]);
    });

    it('draw particles only, and only the halo with no particles, with Show base effect off', async () => {
        for (const [particles, drawn] of [[true, 2], [false, 0]] as const) {
            const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Animations.Enabled': false, '📦 Enhanced Nodes.Particle.Show': particles }, { nodes: [KSAMPLER] });
            // Nor v1's selection frame, which belongs to the base effect.
            canvas.graph._nodes[0].selected = true;
            const { calls, lines } = frame(canvas);
            expect(calls, `particles ${particles}`).toHaveLength(drawn);
            expect(lines.filter((line) => line.startsWith('strokeRect(')), `particles ${particles}`).toEqual([]);
            expect(canvas.front.paints.find((p) => p.op === 'fill' && p.style === '#353535')!.shadowColor, `particles ${particles}`).toBe('#00ff88');
        }
    });
});

describe('titles', () => {
    /** The texts of a frame's fillText calls, and where it drew them. */
    const texts = (lines: string[]) => lines.filter((line) => line.startsWith('fillText('));

    it("take the native title's place, over the node's effect, while native draws its own on the hidden canvas", async () => {
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES, '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Text.Style': 'retro' }, {
            nodes: [KSAMPLER, { pos: [700, 300], collapsed: true, title: 'Load' }],
        });
        clock.nodePhase = 0;
        const { lines, calls } = frame(canvas);
        // Retro draws a copy a pixel either side, then the title: after the title box, on the bar's middle, in native's font; on a collapsed node too.
        expect(texts(lines)).toEqual([
            'fillText("KSampler", 29, -15)', 'fillText("KSampler", 31, -15)', 'fillText("KSampler", 30, -15)',
            'fillText("Load", 29, -15)', 'fillText("Load", 31, -15)', 'fillText("Load", 30, -15)',
        ]);
        expect(lines).toEqual(expect.arrayContaining(['font = 14px Inter', 'textAlign = left', 'textBaseline = middle']));
        expect(native.mock.calls.map(([ctx]) => ctx === dummy())).toEqual([true, true]);
        // KSampler's, the first text the frame paints, after its effect's part on the body.
        const over = calls.find((call) => call.sides === OVER)!;
        expect(canvas.front.paints.findIndex((p, i) => i >= calls[0].from && p.op === 'fillText')).toBeGreaterThanOrEqual(over.to);
    });

    it("show native's text: with the pin, cut to the room the title bar leaves, and to 20 characters when collapsed", async () => {
        const canvas = await start(LINKS_OFF, {
            nodes: [
                { pos: [100, 100], size: [140, 80], title: 'A long title for a narrow node' }, { pos: [100, 400], collapsed: true, title: 'Another title that runs on and on' },
                { pos: [500, 100], title: 'KSampler' },
            ],
        });
        canvas.graph._nodes[0].flags.pinned = true;
        canvas.graph._nodes[2].flags.pinned = true;
        const natives = texts(frame(canvas).lines).map((line) => /"(.*)"/.exec(line)![1]);
        expect(natives).toEqual(['A long t...', 'Another title that r', 'KSampler📌']);
        preview('📦 Enhanced Nodes.Text.Animation.Enabled', true);
        canvas.setDirty(true, true);
        // Neon draws the title four times.
        expect(texts(frame(canvas).lines).map((line) => /"(.*)"/.exec(line)![1])).toEqual(natives.flatMap((text) => [text, text, text, text]));
        // Title buttons take their room too.
        canvas.graph._nodes[0].size = [400, 80];
        canvas.graph._nodes[0].title_buttons = [{ visible: true, getWidth: () => 200 }];
        canvas.setDirty(true, true);
        expect(texts(frame(canvas).lines)[0]).toBe('fillText("A long title for a ...", 30, -15)');
    });

    it("take Title color with custom node colours, else the accent of their node's effect", async () => {
        const canvas = await start({ ...LINKS_OFF, ...TITLES, '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Text.Style': 'retro', '📦 Enhanced Nodes.Text.Color': '#123456' }, { nodes: [KSAMPLER] });
        const colour = () => {
            const from = canvas.front.paints.length;
            canvas.setDirty(true, true);
            frames(1);
            return canvas.front.paints.slice(from).filter((p) => p.op === 'fillText').at(-1)!.style;
        };
        expect(colour()).toBe('#ff40ff');
        canvas.graph._nodes[0].properties.enhanced_fx_style = 2;
        expect(colour()).toBe('#00ff44');
        preview('📦 Enhanced Nodes.Color.Mode', 'custom');
        expect(colour()).toBe('#123456');
    });

    it("move on nodes without an effect, and hold v1's still pose when node effects do", async () => {
        const canvas = await start({ ...LINKS_OFF, ...TITLES, '📦 Enhanced Nodes.Text.Style': 'retro' }, { nodes: [KSAMPLER] });
        frames(3);
        expect(live.nodes).toBe(1);
        preview('📦 Enhanced Nodes.Static.Mode', true);
        const { lines } = frame(canvas);
        // Retro's copies sit sin(5 × phase) / 2 px off the title, at v1's still phase, π/4.
        expect(texts(lines)[0]).toBe(`fillText("KSampler", 29, ${fmt(-15 + Math.sin((5 * Math.PI) / 4) * 0.5)})`);
        expect(live.nodes).toBe(0);
    });

    it('are left to native for a node that draws its own, one without a title, in low quality and with Animated titles off', async () => {
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES }, { nodes: [{ pos: [100, 100], title: '' }, { pos: [400, 100], title: 'Own' }] });
        const own = vi.fn();
        const [untitled] = canvas.graph._nodes;
        canvas.graph._nodes[1].onDrawTitleText = own;
        expect(texts(frame(canvas).lines)).toEqual(['fillText("", 30, -10)']);
        expect(own).toHaveBeenCalledTimes(1);
        // Native draws no title in low quality, titled or not.
        [canvas.low_quality, untitled.title] = [true, 'Titled'];
        canvas.setDirty(true, true);
        expect(texts(frame(canvas).lines)).toEqual([]);
        [canvas.low_quality, untitled.title] = [false, ''];
        canvas.graph._nodes[1].onDrawTitleText = undefined;
        preview('📦 Enhanced Nodes.Text.Animation.Enabled', false);
        expect(texts(frame(canvas).lines)).toEqual(['fillText("", 30, -10)', 'fillText("Own", 30, -10)']);
        expect(native.mock.calls.every(([ctx]) => ctx === canvas.ctx)).toBe(true);
    });

    it('are native where the styled title fails, and once the guard turns it off', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES }, { nodes: [KSAMPLER] });
        // The styled title fails as it starts, reading Title glow, which nothing else reads.
        let tries = 0;
        Object.defineProperty(N, 'textGlow', { configurable: true, get: () => { tries++; throw new Error('boom'); } });
        try {
            for (let i = 0; i < 6; i++) {
                canvas.setDirty(true, false);
                frames(1);
            }
        } finally {
            Object.defineProperty(N, 'textGlow', { configurable: true, enumerable: true, writable: true, value: 0.5 });
        }
        // Each frame shows native's title: drawn again on the canvas after the styled one failed, then alone.
        expect(native.mock.calls.map(([ctx]) => (ctx === canvas.ctx ? 'canvas' : 'hidden'))).toEqual([...Array(5).fill(['hidden', 'canvas']).flat(), 'canvas']);
        expect([tries, guard.off('Animated titles')]).toEqual([5, true]);
        expect(warn).toHaveBeenCalledOnce();
        canvas.front.assertBalanced();
    });

    it('count as moving only where the styled title is drawn', async () => {
        const canvas = await start({ ...LINKS_OFF, ...TITLES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Animations.Enabled': false }, {
            nodes: [{ pos: [100, 100] }, { pos: [400, 100] }],
        });
        const [own, bare] = canvas.graph._nodes;
        own.onDrawTitleText = vi.fn();
        // As a legacy Reroute node has: TitleMode.NO_TITLE.
        bare.title_mode = 1;
        frames(5);
        expect(live.nodes).toBe(0);
        page.requests = 0;
        frames(30);
        expect(page.requests).toBe(0);
        bare.title_mode = 0;
        canvas.setDirty(true, true);
        frames(1);
        expect(live.nodes).toBe(1);
        // In low quality native draws no title, so none moves.
        canvas.low_quality = true;
        canvas.setDirty(true, true);
        frames(1);
        expect(live.nodes).toBe(0);
    });
});

describe('the over-layer and the title', () => {
    it('hand the originals every argument, once each', async () => {
        const shape = vi.spyOn(FakeCanvas.prototype, 'drawNodeShape');
        const title = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES, '📦 Enhanced Nodes.Animate': 2 }, { nodes: [KSAMPLER] });
        frame(canvas);
        const [node] = canvas.graph._nodes;
        expect(shape.mock.calls).toEqual([[node, canvas.ctx, [220, 120], '#333', '#353535', false]]);
        expect(title.mock.calls).toEqual([[dummy(), { scale: 1, default_title_color: '#999', low_quality: false }]]);
    });

    it('leave the canvas as they found it when an effect fails, which the guard turns off after 5 failures in 10 s', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 1 }, { nodes: [KSAMPLER] });
        probe.fail = true;
        frame(canvas);
        // Under and on the body it failed; the widget is still drawn where it belongs, at full alpha.
        canvas.front.assertBalanced();
        expect(canvas.front.paints.at(-1)).toMatchObject({ op: 'fillRect', box: [310, 310, 510, 330], globalAlpha: 1 });
        frames(3);
        expect(guard.off('Node effect')).toBe(true);
        expect(fake.toasts).toEqual([expect.objectContaining({ summary: 'Node effect turned off' })]);
        expect(warn).toHaveBeenCalledTimes(1);

        // Off: the nodes are native, halo and all, nothing moves and the ticker stops, until a setting changes.
        probe.fail = false;
        canvas.setDirty(true, true);
        expect(frame(canvas).calls).toEqual([]);
        expect(canvas.front.paints.filter((p) => p.op === 'fill' && p.style === '#353535').at(-1)!.shadowColor).toBe('rgba(0, 0, 0, 0.5)');
        expect(live.nodes).toBe(0);
        page.requests = 0;
        frames(30);
        expect(page.requests).toBe(0);
        preview('📦 Enhanced Nodes.Glow', 0.7);
        expect(frame(canvas).calls).toHaveLength(2);
    });

    it('restore what an effect saved when it fails inside its own save', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Color.Particle': '#ffb300' }, { nodes: [KSAMPLER] });
        // A colour the canvas would not take, for the fireflies Gentle Pulse draws after its save().
        vi.spyOn(colors, 'particleColour').mockReturnValue('nothing');
        frame(canvas);
        canvas.front.assertBalanced();
        expect(canvas.front.paints.at(-1)).toMatchObject({ op: 'fillRect', box: [310, 310, 510, 330], globalAlpha: 1 });
    });
});

describe('the under-layer', () => {
    it('draws the particles alone in Vue mode, around the DOM node, without the halo or titles, and nothing without them, so the ticker stops', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, ...TITLES, '📦 Enhanced Nodes.Animate': 1 }, { nodes: [KSAMPLER] });
        frames(5);
        (globalThis as unknown as { LiteGraph: { vueNodesMode: boolean } }).LiteGraph.vueNodesMode = true;
        canvas.setDirty(true, true);
        // The halo is cast before the effect is drawn, so the whole frame is looked at.
        const from = canvas.front.paints.length;
        const { calls } = frame(canvas);
        expect(calls.map(({ sides, only }) => [sides, only])).toEqual([[UNDER, true]]);
        expect([halos(canvas.front.paints.slice(from)), live.nodes, live.particles]).toEqual([[], 1, 1]);
        preview(PARTICLE_SHOW, false);
        expect(frame(canvas).calls).toEqual([]);
        expect([live.nodes, live.particles]).toEqual([0, 0]);
        page.requests = 0;
        frames(60);
        expect(page.requests).toBe(0);
    });

    // Every slider at its top, with the node selected and hovered, gives each effect its widest drawing.
    const RANGES: Record<string, Record<string, unknown>> = {
        defaults: {},
        smallest: { '📦 Enhanced Nodes.Animation.Size': 0.5, '📦 Enhanced Nodes.Quality': 1, '📦 Enhanced Nodes.Particle.Size': 0.1, '📦 Enhanced Nodes.Glow': 0 },
        largest: {
            '📦 Enhanced Nodes.Intensity': 2, '📦 Enhanced Nodes.Animation.Glow': 1, '📦 Enhanced Nodes.Glow': 1, '📦 Enhanced Nodes.Animation.Size': 3,
            '📦 Enhanced Nodes.Quality': 3, '📦 Enhanced Nodes.Particle.Size': 3, '📦 Enhanced Nodes.Particle.Intensity': 2, '📦 Enhanced Nodes.Particle.Glow': 1,
            '📦 Enhanced Nodes.Color.Hover.Show': true,
        },
    };

    it('takes every node whose effect reaches the screen, however far off it its body is', async () => {
        for (const [name, animate] of EFFECTS) {
            for (const [range, settings] of Object.entries(RANGES)) {
                const canvas = await start({ ...LINKS_OFF, ...PARTICLES, ...settings, '📦 Enhanced Nodes.Animate': animate }, { nodes: [{ pos: [0, 0] }] });
                const [node] = canvas.graph._nodes;
                [node.selected, node.mouseOver] = [true, true];
                for (const [w, h] of [[140, 46], [220, 120], [320, 260]]) {
                    node.size = [w, h];
                    canvas.setDirty(true, true);
                    frames(1);
                    // How far the whole effect reaches past the node's box, title bar included, at a few moments.
                    const reach = [-Infinity, -Infinity, -Infinity, -Infinity];
                    for (const phase of [0.7, 2.1, 3.6, 5.2]) {
                        const rec = new CanvasRecorder();
                        drawNodeFx(rec.ctx, animate, node, w, h, { nodePhase: phase, particleTime: phase * 1.7, nodeTime: phase * 1.3 }, WHOLE, 1, animate === 0);
                        overhang(rec.paints, [0, -30, w, h]).forEach((r, side) => (reach[side] = Math.max(reach[side], r)));
                    }
                    // With the body off screen, its drawing one pixel onto it from each side it reaches past the area native draws the node in:
                    // renderArea is 4 px wider on the left, 6 on the right, 5 taller at the bottom, and 4 at the top.
                    for (const [side, r] of reach.entries()) {
                        if (r <= [4, 4, 6, 5][side]) continue;
                        const [x, y] = [[-r + 1 - 1600, h / 2 - 450], [w / 2 - 800, -30 - r + 1 - 900], [w + r - 1, h / 2 - 450], [w / 2 - 800, h + r - 1]][side];
                        canvas.ds.offset = [-x, -y];
                        canvas.setDirty(true, true);
                        frames(1);
                        expect(canvas.visible_nodes, `${name}, ${range}, ${w}x${h}, side ${side}: its body is off screen`).toEqual([]);
                        probe.rec = new CanvasRecorder();
                        probe.calls = [];
                        layers.nodes!(canvas as never, probe.rec.ctx);
                        expect(probe.calls, `${name}, ${range}, ${w}x${h}, side ${side} reaches ${r.toFixed(1)} px`).toHaveLength(1);
                    }
                    canvas.ds.offset = [0, 0];
                }
            }
        }
    });

    it('leaves out a node whose effect stays off screen', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': 1 }, { nodes: [{ pos: [5000, 5000] }] });
        expect(frame(canvas).calls).toEqual([]);
        expect([live.nodes, live.particles]).toEqual([0, 0]);
    });
});

describe('the node menu', () => {
    type Item = { content: string; has_submenu?: boolean; submenu?: { options: (Item | null)[] }; callback?: () => void };
    const menu = (node: FakeNode) => (fake.extensions.find((e) => e.name === 'enhanced.node.animations') as unknown as { getNodeMenuItems(node: FakeNode): Item[] }).getNodeMenuItems(node);
    const labels = (item: Item) => item.submenu!.options.map((option) => option?.content ?? null);
    const pick = (node: FakeNode, menuName: string, label: string) => menu(node).find((item) => item.content === menuName)!.submenu!.options.find((option) => option?.content.replace('✓ ', '') === label)!.callback!();

    it('offers Node FX, Node background and Completion FX, each one submenu level, with the choice ticked and Use global naming the global one', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 2 }, { nodes: [KSAMPLER] });
        const [node] = canvas.graph._nodes;
        const items = menu(node);
        // Then Go to connected node (tests/unit/navigation.test.ts).
        expect(items.map((item) => [item.content, item.has_submenu])).toEqual([['Node FX', true], ['Node background', true], ['Completion FX', true], ['Go to connected node', true]]);
        expect(labels(items[0])).toEqual(['✓ Use global (Neon Nexus)', 'Off', 'Gentle Pulse', 'Neon Nexus', 'Cosmic Ripple', 'Sacred Rosette', 'Flower of Life', 'Jelly', 'Circuit Trace', 'Aurora Veil', 'Ember Crown', null, 'Particles only']);
        expect(labels(items[1])).toEqual(['✓ Use global (None)', 'None', 'Plasma', 'Aurora', 'Starfield', 'Liquid', 'Smoke', 'Grid', 'Lava', 'Caustics']);
        expect(labels(items[2])).toEqual(['✓ Use global', 'Primary (anchor here)', 'Exclude']);
        for (const item of items) expect(item.submenu!.options.every((option) => !option?.has_submenu && !option?.submenu)).toBe(true);
        node.properties = { enhanced_fx_style: 3, enhanced_fx_particles_only: true, enhanced_fx_completion: 'exclude', enhanced_fx_background: 'lava' };
        expect(labels(menu(node)[0])).toEqual(['Use global (Neon Nexus)', 'Off', 'Gentle Pulse', 'Neon Nexus', '✓ Cosmic Ripple', 'Sacred Rosette', 'Flower of Life', 'Jelly', 'Circuit Trace', 'Aurora Veil', 'Ember Crown', null, '✓ Particles only']);
        expect(labels(menu(node)[1])).toEqual(['Use global (None)', 'None', 'Plasma', 'Aurora', 'Starfield', 'Liquid', 'Smoke', 'Grid', 'Lava', 'Caustics'].map((label) => (label === 'Lava' ? '✓ Lava' : label)));
        expect(labels(menu(node)[2])).toEqual(['Use global', 'Primary (anchor here)', '✓ Exclude']);
    });

    it('write a pick to the node as one change the history can undo, and Use global takes it back out', async () => {
        const canvas = await start(LINKS_OFF, { nodes: [KSAMPLER] });
        const [node] = canvas.graph._nodes;
        pick(node, 'Node FX', 'Neon Nexus');
        pick(node, 'Node FX', 'Particles only');
        pick(node, 'Completion FX', 'Primary (anchor here)');
        expect(node.properties).toEqual({ enhanced_fx_style: 2, enhanced_fx_particles_only: true, enhanced_fx_completion: 'primary' });
        expect(canvas.calls.filter((call) => call.startsWith('emit'))).toEqual(Array(3).fill(['emitBeforeChange', 'emitAfterChange']).flat());
        pick(node, 'Node FX', 'Use global (Off)');
        pick(node, 'Completion FX', 'Use global');
        expect(node.properties).toEqual({});
    });

    it('set Node FX for every selected node, in one change, when the node is one of them, and tick what they all have', async () => {
        const canvas = await start(LINKS_OFF, { nodes: [KSAMPLER, { pos: [700, 300] }, { pos: [300, 700] }] });
        const [first, second, other] = canvas.graph._nodes;
        for (const node of [first, second]) {
            node.selected = true;
            canvas.selectedItems.add(node);
        }
        second.properties.enhanced_fx_style = 2;
        const [fx, background, completion] = menu(first);
        expect([fx.content, background.content]).toEqual(['Node FX (2 selected)', 'Node background (2 selected)']);
        // They have no effect in common, and both draw their whole effect.
        expect(labels(fx).filter((label) => label?.startsWith('✓'))).toEqual([]);
        pick(first, 'Node FX (2 selected)', 'Cosmic Ripple');
        pick(first, 'Node FX (2 selected)', 'Particles only');
        expect([first.properties, second.properties, other.properties]).toEqual([{ enhanced_fx_style: 3, enhanced_fx_particles_only: true }, { enhanced_fx_style: 3, enhanced_fx_particles_only: true }, {}]);
        expect(canvas.calls.filter((call) => call.startsWith('emit'))).toEqual(Array(2).fill(['emitBeforeChange', 'emitAfterChange']).flat());
        expect(labels(menu(second)[0])).toEqual(['Use global (Off)', 'Off', 'Gentle Pulse', 'Neon Nexus', '✓ Cosmic Ripple', 'Sacred Rosette', 'Flower of Life', 'Jelly', 'Circuit Trace', 'Aurora Veil', 'Ember Crown', null, '✓ Particles only']);
        // Completion FX is the node's own, and a node outside the selection gets a menu of its own.
        completion.submenu!.options.find((option) => option?.content === 'Exclude')!.callback!();
        expect([first.properties.enhanced_fx_completion, second.properties.enhanced_fx_completion]).toEqual(['exclude', undefined]);
        expect(menu(other)[0].content).toBe('Node FX');
    });

    it('give a node its own effect: its style, None for nothing, and its Particles only', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': 1 }, { nodes: [KSAMPLER, { pos: [700, 300] }, { pos: [300, 700] }] });
        const [own, none, only] = canvas.graph._nodes;
        own.properties.enhanced_fx_style = 3;
        none.properties.enhanced_fx_style = 0;
        only.properties.enhanced_fx_particles_only = true;
        const calls = frame(canvas).calls.filter((call) => call.sides === OVER);
        expect(calls.map((call) => [canvas.graph._nodes.indexOf(call.node as FakeNode), call.only])).toEqual([[0, false], [2, true]]);
        // Cosmic Ripple's halo on the first, native's shadow on the second, Gentle Pulse's halo on the third.
        expect(halos(canvas.front.paints).map((p) => p.shadowColor)).toEqual(['#ff00ff', '#44aaff']);
        expect(bodies(canvas.front.paints).map((p) => p.shadowColor)).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0)']);
    });

    it('ignore what a workflow holds there that is not a choice, and write nothing as nodes are drawn or the menu is built', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 2 }, { nodes: [KSAMPLER, { pos: [700, 300] }, { pos: [300, 700] }] });
        const [odd, kept, bare] = canvas.graph._nodes;
        odd.properties = { enhanced_fx_style: 99, enhanced_fx_particles_only: 'yes', enhanced_fx_completion: 'loud' };
        kept.properties = { enhanced_fx_style: 4, enhanced_fx_completion: 'primary', other: 1 };
        const before = JSON.stringify([odd.properties, kept.properties]);
        const from = canvas.front.paints.length;
        const { calls } = frame(canvas);
        // The odd one draws Animate's Neon Nexus, whole; the other its Sacred Rosette; the one loaded with nothing set Animate's too.
        expect(halos(canvas.front.paints.slice(from)).map((p) => p.shadowColor)).toEqual(['#00ff88', '#ffcc00', '#00ff88']);
        expect(calls.filter((call) => call.sides === OVER).map((call) => call.only)).toEqual([false, false, false]);
        menu(odd);
        menu(kept);
        menu(bare);
        frames(3);
        expect(JSON.stringify([odd.properties, kept.properties])).toBe(before);
        expect(bare.properties).toEqual({});
        expect(canvas.calls.filter((call) => call.startsWith('emit'))).toEqual([]);
        expect(labels(menu(odd)[0])[0]).toBe('✓ Use global (Neon Nexus)');
    });
});

describe('Flower of Life', () => {
    const FLOWER = 5;
    /** The node clock `t` s in at speed 1. */
    const at = (t: number) => ({ nodePhase: ((2 * Math.PI) / 15) * t, particleTime: t, nodeTime: t });
    /** What Flower of Life draws whole on the KSampler, 220 × 120, `t` s into its cycle. */
    async function drawn(t: number, settings: Record<string, unknown> = {}) {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': FLOWER, ...settings }, { nodes: [KSAMPLER] });
        const rec = new CanvasRecorder();
        drawNodeFx(rec.ctx, FLOWER, canvas.graph._nodes[0], 220, 120, at(t), WHOLE, 1, false);
        return rec;
    }
    /** The arcs it strokes, as centre, radius and sweep. */
    const arcs = (rec: CanvasRecorder) => rec.lines.flatMap((line) => {
        const m = /^arc\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,)]+)\)$/.exec(line);
        return m ? [{ x: Number(m[1]), y: Number(m[2]), r: Number(m[3]), sweep: Number(m[5]) - Number(m[4]) }] : [];
    });
    /** Its circles' radius on the KSampler at Animation.Size 1: 0.14 of the shorter side. */
    const R = 0.14 * 120;

    it("draws nineteen circles a radius across, each through the middles of those beside it, inside a ring at Balanced, the Seed of Life's seven at Fast", async () => {
        const circles = (rec: CanvasRecorder) => arcs(rec).filter((a) => Math.abs(a.r - R) < 0.01);
        const flower = circles(await drawn(8));
        expect(flower).toHaveLength(19);
        const near = (a: { x: number; y: number }) => flower.filter((b) => b !== a && Math.abs(Math.hypot(a.x - b.x, a.y - b.y) - R) < 0.05).length;
        // The middle circle and the Seed of Life's six have six neighbours a radius off; of the outer twelve, those between
        // two others four, and the six at its corners three.
        expect(flower.map(near).sort((a, b) => b - a)).toEqual([6, 6, 6, 6, 6, 6, 6, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3]);
        expect(arcs(await drawn(8)).filter((a) => Math.abs(a.r - 3 * R) < 0.01)).toHaveLength(1);
        expect(arcs(await drawn(8, { '📦 Enhanced Nodes.Quality': 3 })).filter((a) => a.r > 2 * R).map((a) => a.r)).toEqual([3 * R, 3.12 * R].map((r) => Number(r.toFixed(2))));
        expect(circles(await drawn(8, { '📦 Enhanced Nodes.Quality': 1 }))).toHaveLength(7);
        expect(arcs(await drawn(8, { '📦 Enhanced Nodes.Quality': 1 })).filter((a) => a.r > 2 * R)).toEqual([]);
    });

    it('draws itself in, the Seed of Life over the first 1.5 s, the rest and the ring by 4 s, and fades out over the last second of 16', async () => {
        const sweeps = async (t: number) => arcs(await drawn(t)).filter((a) => Math.abs(a.r - R) < 0.01).map((a) => a.sweep);
        const [start, seed, later, whole] = await Promise.all([0.1, 1.5, 3, 4].map(sweeps));
        expect(start).toHaveLength(1);
        expect(start[0]).toBeLessThan(2 * Math.PI - 0.1);
        // Whole turns, but for the trace's rounding of each angle.
        const whole360 = (sweep: number) => Math.abs(sweep - 2 * Math.PI) < 0.02;
        expect(seed.filter(whole360)).toHaveLength(7);
        expect(later.length).toBeGreaterThan(7);
        expect(later.length).toBeLessThan(19);
        expect(whole.filter(whole360)).toHaveLength(19);
        const alpha = async (t: number) => (await drawn(t)).paints.find((p) => p.op === 'stroke')!.globalAlpha;
        expect(await alpha(15.5)).toBeCloseTo((await alpha(8)) / 2, 6);
        // Then round again, from nothing.
        expect(await sweeps(16.1)).toEqual(await sweeps(0.1));
    });

    it('holds still in full bloom, whatever the clock, without its shimmer', async () => {
        const still = async (t: number) => {
            const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': FLOWER, '📦 Enhanced Nodes.Static.Mode': true, '📦 Enhanced Nodes.Quality': 3 }, { nodes: [KSAMPLER] });
            const rec = new CanvasRecorder();
            drawNodeFx(rec.ctx, FLOWER, canvas.graph._nodes[0], 220, 120, at(t), WHOLE, 1, false);
            return rec;
        };
        const pose = (await still(0.3)).trace();
        expect((await still(9.7)).trace()).toBe(pose);
        expect(arcs(await still(0.3)).filter((a) => Math.abs(a.r - R) < 0.01)).toHaveLength(19);
        expect((await still(9.7)).paints.filter((p) => p.op === 'fill')).toEqual([]);
    });

    it('shimmers through its petals in bloom at Rich alone, a wave out from the middle', async () => {
        const petals = async (t: number, quality: number) => (await drawn(t, { '📦 Enhanced Nodes.Quality': quality })).paints.filter((p) => p.op === 'fill');
        expect(await petals(8, 2)).toEqual([]);
        expect(await petals(2, 3)).toEqual([]);
        // Near the middle as the wave starts, farther out later.
        const middle = async (t: number) => {
            const lit = await petals(t, 3);
            expect(lit.length, `${t} s`).toBeGreaterThan(0);
            return Math.max(...lit.map((p) => Math.hypot((p.box![0] + p.box![2]) / 2 - 110, (p.box![1] + p.box![3]) / 2 - 60)));
        };
        expect(await middle(4.2)).toBeLessThan(await middle(6));
    });

    it('runs its sparks round the circles drawn in, and none round those still drawing', async () => {
        const sparks = async (t: number) => (await drawn(t, PARTICLES)).paints.filter((p) => p.op === 'fill' && Math.abs((p.box![2] - p.box![0]) / 2 - 1.2) < 0.01);
        // Two a circle at Density 1: the Seed of Life's seven at 1.5 s, all nineteen at 4 s.
        expect(await sparks(1.5)).toHaveLength(14);
        expect(await sparks(4)).toHaveLength(38);
        expect(await sparks(0.2)).toHaveLength(0);
    });
});

describe('Jelly', () => {
    const JELLY = { ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 6 };
    /** The shape a front pass gives the node: each transform() it sets, as its numbers. */
    const shapes = (canvas: FakeCanvas) => {
        canvas.setDirty(true, true);
        return frame(canvas).lines.filter((line) => line.startsWith('transform(')).map((line) => line.slice(10, -1).split(', ').map(Number));
    };
    /** Front passes until the node keeps still, at most `most`: how many it took, and the shapes on the way. */
    const settle = (canvas: FakeCanvas, most = 240) => {
        const seen: number[][] = [];
        for (let i = 0; i < most; i++) {
            const now = shapes(canvas);
            if (!now.length) return { passes: i, seen };
            seen.push(now[0]);
        }
        return { passes: most, seen };
    };

    it('draws the node as native does while it keeps still', async () => {
        const canvas = await start(JELLY, { nodes: [KSAMPLER] });
        frames(2);
        expect(shapes(canvas)).toEqual([]);
        expect(live.nodes).toBe(0);
    });

    it('leans against a drag, keeping its area, sways back as it is let go, and settles still within two seconds', async () => {
        const canvas = await start(JELLY, { nodes: [KSAMPLER] });
        const [node] = canvas.graph._nodes;
        frames(2);
        // Dragged right, 300 px a second: its top lags behind, to the left.
        let shape: number[] = [];
        for (let i = 0; i < 30; i++) {
            node.pos[0] += 5;
            [shape] = shapes(canvas);
        }
        const [a, b, c, d] = shape;
        expect(c).toBeGreaterThan(0.02);
        expect(b).toBe(0);
        expect(a * d).toBeCloseTo(1, 3);
        // Let go, it swings past upright the other way before it settles.
        const { passes, seen } = settle(canvas);
        expect(seen.some(([, , lean]) => lean < 0)).toBe(true);
        expect(passes).toBeLessThan(120);
        expect(live.nodes).toBe(0);
    });

    it("squashes as it is selected, and as this client's run finishes it, but not while node effects hold still", async () => {
        const canvas = await start(JELLY, { nodes: [KSAMPLER] });
        const [node] = canvas.graph._nodes;
        frames(2);
        node.selected = true;
        const { seen } = settle(canvas);
        expect(seen.length).toBeGreaterThan(10);
        // Taller and narrower, then wider, its area kept.
        expect(seen.some(([, , , d]) => d > 1.005)).toBe(true);
        expect(seen.some(([, , , d]) => d < 0.995)).toBe(true);
        for (const [a, , , d] of seen) expect(a * d).toBeCloseTo(1, 3);
        // A run through it: kicked as it stops running.
        send('execution_start', { prompt_id: 'jelly', timestamp: 0 });
        progress('jelly', { [node.id]: 'running' });
        expect(shapes(canvas)).toEqual([]);
        progress('jelly', { [node.id]: 'finished' });
        expect(settle(canvas).seen.length).toBeGreaterThan(10);
        send('execution_success', { prompt_id: 'jelly', timestamp: 0 });
        // Static.
        preview('📦 Enhanced Nodes.Static.Mode', true);
        node.selected = false;
        frames(1);
        node.selected = true;
        expect(settle(canvas).seen).toEqual([]);
        preview('📦 Enhanced Nodes.Static.Mode', false);
    });

    it('moves the ends of its links with it as it wobbles, and puts them back as it settles', async () => {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 6 }, { nodes: [{ pos: [100, 100] }, { pos: [500, 100] }], links: [{ from: 0, to: 1 }] });
        const [, target] = canvas.graph._nodes;
        frames(2);
        /** Where the background pass begins and ends the link's path. */
        const ends = () => {
            canvas.setDirty(true, true);
            const from = canvas.back.lines.length;
            frames(1);
            return canvas.back.lines.slice(from).filter((line) => /^(moveTo|bezierCurveTo)\(/.test(line)).join(' ');
        };
        const rest = ends();
        target.selected = true;
        frames(1);
        let wobbled = false;
        for (let i = 0; i < 10; i++) wobbled ||= ends() !== rest;
        expect(wobbled).toBe(true);
        settle(canvas);
        expect(ends()).toBe(rest);
    });
});

describe('Circuit Trace', () => {
    const CIRCUIT = 7;
    /** The node clock `t` s in at speed 1. */
    const at = (t: number) => ({ nodePhase: ((2 * Math.PI) / 15) * t, particleTime: t, nodeTime: t });
    /** What Circuit Trace draws whole on a 220 × 120 node with id `id`, `t` s in. */
    async function drawn(t: number, settings: Record<string, unknown> = {}, id = 1) {
        await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': CIRCUIT, ...settings }, { nodes: [KSAMPLER] });
        const rec = new CanvasRecorder();
        drawNodeFx(rec.ctx, CIRCUIT, { id, title: 'KSampler', size: [220, 120] }, 220, 120, at(t), WHOLE, 1, false);
        return rec;
    }
    /** Its pads, where they are: the rings of 2.2 px it strokes at Animation.Size 1. */
    const pads = (rec: CanvasRecorder) => rec.lines.flatMap((line) => {
        const m = /^arc\(([^,]+), ([^,]+), 2\.2, /.exec(line);
        return m ? [`${m[1]}, ${m[2]}`] : [];
    });
    /** How brightly each pad is lit: the fills in its accent, by where they are. */
    const lit = (rec: CanvasRecorder) => new Map(rec.paints.filter((p) => p.op === 'fill' && p.style === '#ffd54f').map((p) => [`${fmt((p.box![0] + p.box![2]) / 2)}, ${fmt((p.box![1] + p.box![3]) / 2)}`, p.globalAlpha]));

    it('lays a trace in from a pin for each 100 px of its sides and foot at Balanced, more at Rich, fewer at Fast, the same for a node every frame and its own for each node', async () => {
        const balanced = pads(await drawn(1));
        // 1.6 a 100 px of 2 × 120 + 220.
        expect(balanced).toHaveLength(7);
        expect(pads(await drawn(1, { '📦 Enhanced Nodes.Quality': 3 }))).toHaveLength(11);
        expect(pads(await drawn(1, { '📦 Enhanced Nodes.Quality': 1 }))).toHaveLength(5);
        expect(pads(await drawn(2.3))).toEqual(balanced);
        expect(pads(await drawn(1, {}, 2))).not.toEqual(balanced);
        // Each pad inside the body, clear of its edges.
        for (const pad of balanced) {
            const [x, y] = pad.split(', ').map(Number);
            expect(x >= 6 && x <= 214 && y >= 6 && y <= 114, pad).toBe(true);
        }
    });

    it('lights each pad once a pulse, as the pulse gets to it, every 2.4 s at speed 1', async () => {
        const seen = new Map<string, number[]>();
        const frames = 72;
        for (let i = 0; i < frames; i++) {
            const rec = await drawn((2.4 * i) / frames);
            for (const pad of pads(rec)) if (!seen.has(pad)) seen.set(pad, []);
            const now = lit(rec);
            for (const [pad, alphas] of seen) alphas.push(now.get(pad) ?? 0);
        }
        expect(seen.size).toBe(7);
        for (const [pad, alphas] of seen) {
            // Once round, the glow up to full and down to nothing.
            expect(Math.max(...alphas), pad).toBeGreaterThan(0.85);
            const rises = alphas.filter((a, i) => a > 0 && !(alphas[(i + frames - 1) % frames] > 0)).length;
            expect(rises, pad).toBe(1);
        }
    });

    it('holds still in one pose, whatever the clock', async () => {
        const still = async (t: number) => (await drawn(t, { '📦 Enhanced Nodes.Static.Mode': true, [PARTICLE_SHOW]: true })).trace();
        expect(await still(9.7)).toBe(await still(0.3));
    });

    it('stands its pins out of the edges, which the under part draws', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': CIRCUIT }, { nodes: [KSAMPLER] });
        const rec = new CanvasRecorder();
        drawNodeFx(rec.ctx, CIRCUIT, canvas.graph._nodes[0], 220, 120, at(1), { sides: UNDER, x0: 0, y0: -30, x1: 220, y1: 120, round: 8 }, 1, false);
        const pins = rec.lines.filter((line) => /^lineTo\((-5|225), /.test(line) || /^lineTo\([^,]+, 125\)$/.test(line));
        expect(pins).toHaveLength(7);
    });
});

describe('Aurora Veil', () => {
    const AURORA = 8;
    /** The node clock `t` s in at speed 1. */
    const at = (t: number) => ({ nodePhase: ((2 * Math.PI) / 15) * t, particleTime: t, nodeTime: t });
    /** What Aurora Veil draws on a 220 × 120 node, `t` s in: whole, or one side of its edge. */
    async function drawn(t: number, settings: Record<string, unknown> = {}, part: Part = WHOLE) {
        await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': AURORA, ...settings }, { nodes: [KSAMPLER] });
        const rec = new CanvasRecorder();
        drawNodeFx(rec.ctx, AURORA, { id: 1, title: 'KSampler', size: [220, 120] }, 220, 120, at(t), part, 1, false);
        return rec;
    }
    /** Its curtains' washes and rays: where each hangs across the body, and how far down, × the 0.8 of the body the longest reaches. */
    const rays = (rec: CanvasRecorder) => {
        const out: { x: number; long: number }[] = [];
        for (let i = 0; i < rec.lines.length; i++) {
            const m = /^translate\(([^,]+), 0\)$/.exec(rec.lines[i]);
            const n = /^scale\(1, ([^)]+)\)$/.exec(rec.lines[i + 1] ?? '');
            if (m && n) out.push({ x: Number(m[1]), long: Number(n[1]) });
        }
        return out;
    };

    it('hangs four curtains of eight rays over a wash from the title bar at Balanced, three of six at Fast and five of ten at Rich, across the body', async () => {
        const balanced = rays(await drawn(1));
        expect(balanced).toHaveLength(4 + 32);
        expect(rays(await drawn(1, { '📦 Enhanced Nodes.Quality': 1 }))).toHaveLength(3 + 18);
        expect(rays(await drawn(1, { '📦 Enhanced Nodes.Quality': 3 }))).toHaveLength(5 + 50);
        for (const ray of balanced) {
            expect(ray.x).toBeGreaterThan(0);
            expect(ray.x).toBeLessThan(220);
            expect(ray.long).toBeGreaterThanOrEqual(0.55);
            expect(ray.long).toBeLessThanOrEqual(1);
        }
        // From the top of the body, under the title bar.
        expect((await drawn(1)).lines.filter((line) => line.startsWith('fillRect(')).every((line) => /^fillRect\([^,]+, 0, /.test(line))).toBe(true);
    });

    it('waves its hems and drifts with the clock, and holds still in one pose', async () => {
        expect(rays(await drawn(2))).not.toEqual(rays(await drawn(1)));
        const still = async (t: number) => (await drawn(t, { '📦 Enhanced Nodes.Static.Mode': true, [PARTICLE_SHOW]: true })).trace();
        expect(await still(9.7)).toBe(await still(0.3));
    });

    it('draws nothing round the body', async () => {
        const under = await drawn(1, { [PARTICLE_SHOW]: true, '📦 Enhanced Nodes.Selection.Glow': false }, { sides: UNDER, x0: 0, y0: -30, x1: 220, y1: 120, round: 8 });
        expect(under.paints).toEqual([]);
    });
});

describe('Ember Crown', () => {
    const EMBER = 9;
    /** The node clock `t` s in at speed 1. */
    const at = (t: number) => ({ nodePhase: ((2 * Math.PI) / 15) * t, particleTime: t, nodeTime: t });
    /** What Ember Crown draws on a 220 × 120 node, `t` s in: whole, or one side of its edge. */
    async function drawn(t: number, settings: Record<string, unknown> = {}, part: Part = WHOLE) {
        await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': EMBER, ...settings }, { nodes: [KSAMPLER] });
        const rec = new CanvasRecorder();
        drawNodeFx(rec.ctx, EMBER, { id: 1, title: 'KSampler', size: [220, 120] }, 220, 120, at(t), part, 1, false);
        return rec;
    }
    /** Its flames: each one's root, from moveTo(), and its tip, where its first curve ends. */
    const flames = (rec: CanvasRecorder) => {
        const out: { root: number; tipX: number; tipY: number }[] = [];
        for (let i = 0; i < rec.lines.length; i++) {
            const m = /^moveTo\(([^,]+), -30\)$/.exec(rec.lines[i]);
            const c = /^bezierCurveTo\(.*, ([^,]+), ([^,)]+)\)$/.exec(rec.lines[i + 1] ?? '');
            if (m && c) out.push({ root: Number(m[1]), tipX: Number(c[1]), tipY: Number(c[2]) });
        }
        return out;
    };
    const SHORT = { [PARTICLE_SHOW]: false };

    it('stands a crown of flames on the top of the title bar, about one each 18 px at Balanced, closer at Rich, rising no more than 27.5 px', async () => {
        // 220 / 18 × (0.6 + 0.2 × Quality).
        expect(flames(await drawn(1, SHORT))).toHaveLength(12);
        expect(flames(await drawn(1, { ...SHORT, '📦 Enhanced Nodes.Quality': 3 }))).toHaveLength(15);
        expect(flames(await drawn(1, { ...SHORT, '📦 Enhanced Nodes.Quality': 1 }))).toHaveLength(10);
        for (const f of flames(await drawn(1, SHORT))) {
            expect(f.tipY).toBeLessThan(-30);
            expect(f.tipY).toBeGreaterThanOrEqual(-30 - 27.5);
        }
    });

    it('flickers and sways with the clock, holds still in one pose, and draws its flames round the body and its warmth on it', async () => {
        expect(flames(await drawn(1.3, SHORT))).not.toEqual(flames(await drawn(1, SHORT)));
        const still = async (t: number) => (await drawn(t, { '📦 Enhanced Nodes.Static.Mode': true, [PARTICLE_SHOW]: true })).trace();
        expect(await still(9.7)).toBe(await still(0.3));
        const side = (sides: number) => ({ sides, x0: 0, y0: -30, x1: 220, y1: 120, round: 8 });
        const [under, over] = await Promise.all([drawn(1, SHORT, side(UNDER)), drawn(1, SHORT, side(OVER))]);
        expect(flames(under)).toHaveLength(12);
        expect(under.lines.some((line) => line.startsWith('fillRect('))).toBe(false);
        expect(over.lines.filter((line) => line.startsWith('fillRect('))).toEqual(['fillRect(0, 0, 220, 48)']);
    });

    it('sends embers up from the flames, rising up to 45 px over the title bar and fading out as they go', async () => {
        const embers = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && !p.style.startsWith('grad'));
        const rec = await drawn(1, { [PARTICLE_SHOW]: true });
        expect(embers(rec).length).toBeGreaterThan(0);
        for (const e of embers(rec)) {
            expect(e.box![3]).toBeLessThan(-30);
            expect(e.box![1]).toBeGreaterThan(-30 - 4 - 45 - 2.2);
        }
    });
});
