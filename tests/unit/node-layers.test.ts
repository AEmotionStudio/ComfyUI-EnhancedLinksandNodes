/**
 * The node layers (src/extensions/node-animations.ts) on the fake LiteGraph:
 * each v2 effect draws on its node's body once native filled it, clipped to the
 * body and under the widgets, and what it draws around the body under every
 * node, for every node whose effect reaches the screen. The styled title takes
 * the native title's place. Node modes fade the effects as native fades the
 * node; collapsed nodes, and Vue mode, get none. A failing effect leaves the
 * canvas as it found it, and the guard turns it off.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock, dummy, guard, layers, live } from '@/core/engine';
import { preview } from '@/core/settings';
import { fake } from '../helpers/fake-app';
import { CanvasRecorder, parseColor } from '../helpers/recording-context';
import { mulberry32 } from '../helpers/rng';
import { FakeCanvas, FakeNode, frames, page, start, type GraphSpec } from '../helpers/fake-litegraph';

/**
 * Each call to a node effect or to drawParticles: its context and node, and where its lines and paints start
 * and end on `rec`. With `fail` set the calls move the canvas and throw instead of drawing.
 */
const probe = vi.hoisted(() => ({
    rec: undefined as CanvasRecorder | undefined,
    calls: [] as { ctx: CanvasRenderingContext2D; node: unknown; line: number; from: number; to: number }[],
    fail: false,
}));

vi.mock('@/effects/node-effects', async (importOriginal) => {
    const effects = await importOriginal<typeof import('@/effects/node-effects')>();
    type Effect = typeof effects.gentlePulse;
    const watch = (draw: Effect): Effect => (...args) => {
        const [ctx, node] = args;
        const [line, from] = [probe.rec?.lines.length ?? 0, probe.rec?.paints.length ?? 0];
        if (probe.fail) {
            ctx.translate(1, 1);
            ctx.globalAlpha = 0.5;
            throw new Error('boom');
        }
        draw(...args);
        probe.calls.push({ ctx, node, line, from, to: probe.rec?.paints.length ?? 0 });
    };
    return { ...effects, getNodeEffect: (style: number) => watch(effects.getNodeEffect(style)), drawParticles: watch(effects.drawParticles) };
});

afterEach(() => {
    vi.restoreAllMocks();
    probe.fail = false;
});

const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0 };
const PARTICLES = { '📦 Enhanced Nodes.Particle.Show': true };
const TITLES = { '📦 Enhanced Nodes.Text.Animation.Enabled': true };
const KSAMPLER: GraphSpec['nodes'][number] = { pos: [300, 300], size: [220, 120], title: 'KSampler' };

/** Each node effect by its Animate value, and the particles of a node without one. */
const EFFECTS: [name: string, animate: number][] = [['Gentle Pulse', 1], ['Neon Nexus', 2], ['Cosmic Ripple', 3], ['Flower of Life', 4], ['Particles alone', 0]];

/** One frame on the front canvas: its lines, and the effect calls it made, with their lines' indexes among those. */
function frame(canvas: FakeCanvas) {
    probe.rec = canvas.front;
    probe.calls = [];
    const first = canvas.front.lines.length;
    frames(1);
    return { lines: canvas.front.lines.slice(first), calls: probe.calls.map((call) => ({ ...call, line: call.line - first })) };
}

/** Where the fake fills a node's body in a frame's lines: the fill() after native sets the body colour. */
const bodyFill = (lines: string[], from = 0) => lines.indexOf('fill()', lines.indexOf('fillStyle = #353535', from));

/**
 * How far paints reach past a box (left, top, right, bottom) on each of those sides: their boxes with half
 * their line, and their shadow moved by its offset and grown by its blur.
 */
function overhang(paints: CanvasRecorder['paints'], [left, top, right, bottom]: number[]): number[] {
    const out = [-Infinity, -Infinity, -Infinity, -Infinity];
    for (const p of paints) {
        if (!p.box) continue;
        const line = p.op.startsWith('stroke') ? p.lineWidth / 2 : 0;
        const blur = parseColor(p.shadowColor)![3] > 0 ? p.shadowBlur : -Infinity;
        const [x0, y0, x1, y1] = p.box;
        out[0] = Math.max(out[0], line + left - Math.min(x0, x0 + p.shadowOffsetX - blur));
        out[1] = Math.max(out[1], line + top - Math.min(y0, y0 + p.shadowOffsetY - blur));
        out[2] = Math.max(out[2], line + Math.max(x1, x1 + p.shadowOffsetX + blur) - right);
        out[3] = Math.max(out[3], line + Math.max(y1, y1 + p.shadowOffsetY + blur) - bottom);
    }
    return out;
}

describe('node effects', () => {
    for (const [name, animate] of EFFECTS) {
        it(`${name} draws on the body after its fill, clipped to it, under the widgets, and around it before any node`, async () => {
            const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': animate }, { nodes: [KSAMPLER] });
            const { lines, calls } = frame(canvas);
            const fill = bodyFill(lines);
            const under = calls.filter((call) => call.line < fill);
            const [over, ...more] = calls.filter((call) => call.line > fill);
            expect(more).toEqual([]);
            expect(over.line).toBeLessThan(lines.indexOf('fillRect(10, 10, 200, 20)'));
            // Clipped to the path native filled the body with.
            expect(lines[lines.lastIndexOf('clip()', over.line) - 1]).toBe(lines[fill - 1]);
            // Around the body only where its drawing reaches past it: within the screen, without the body.
            const reaches = Math.max(...overhang(canvas.front.paints.slice(over.from, over.to), [300, 300, 520, 420])) > 0;
            expect(under).toHaveLength(reaches ? 1 : 0);
            if (!reaches) return;
            const clip = lines.lastIndexOf('clip("evenodd")', under[0].line);
            expect(lines.slice(clip - 2, clip)).toEqual(['rect(-300, -300, 1600, 900)', lines[fill - 1]]);
            expect(under[0].ctx).toBe(canvas.ctx);
        });
    }

    it('clip to the body in its shape, and to a box in low quality, as native fills it', async () => {
        const paths: string[] = [];
        for (const [shape, lowQuality] of [[1, false], [2, false], [3, false], [4, false], [2, true]] as const) {
            const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 4 }, { nodes: [{ ...KSAMPLER, shape }] });
            canvas.low_quality = lowQuality;
            const { lines, calls } = frame(canvas);
            const fill = bodyFill(lines);
            expect(lines[lines.lastIndexOf('clip()', calls[0].line) - 1]).toBe(lines[fill - 1]);
            paths.push(lines[fill - 1]);
        }
        expect(paths).toEqual([
            'rect(0, -30, 220, 150)', 'roundRect(0, -30, 220, 150, [8])', 'arc(110, 60, 110, 0, 6.28)', 'roundRect(0, -30, 220, 150, [8, 8, 0, 0])',
            'rect(0, -30, 220, 150)',
        ]);
    });

    it('start from the state v2 drew them in: shadows not offset, whatever native left', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 3, ...PARTICLES }, { nodes: [KSAMPLER] });
        frame(canvas);
        const over = probe.calls.at(-1)!;
        // Native drawNode offset the shadows by 2; the corona glows around each particle.
        const glows = canvas.front.paints.slice(over.from, over.to).filter((p) => p.shadowBlur > 0);
        expect(glows.length).toBeGreaterThan(0);
        expect(glows.every((p) => p.shadowOffsetX === 0 && p.shadowOffsetY === 0)).toBe(true);
    });

    it('fade with the node as native fades it: bypassed, muted and ghost nodes, the styled title and the hover outline too', async () => {
        // At full glow v2 sets alphas above 1, which the browser ignores, faded or not.
        const canvas = await start({
            ...LINKS_OFF, ...PARTICLES, ...TITLES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Color.Hover.Show': true,
            '📦 Enhanced Nodes.Glow': 2, '📦 Enhanced Nodes.Particle.Glow': 2,
        }, {
            nodes: [{ pos: [100, 100] }, { pos: [400, 100], mode: 4 }, { pos: [100, 400], mode: 2 }, { pos: [400, 400], ghost: true }],
        });
        // Selected too, so native's selection outline leaves the alpha at 1 before ours.
        for (const node of canvas.graph._nodes) [node.mouseOver, node.selected] = [true, true];
        const alphas = [1, 0.2, 0.4, 0.3];
        const { calls } = frame(canvas);
        const paints = canvas.front.paints;
        const scaled = (painted: CanvasRecorder['paints'], alpha: number) => painted.map((p) => p.globalAlpha * alpha);
        // Native draws each body at that alpha.
        expect(paints.filter((p) => p.op === 'fill' && p.style === '#353535').map((p) => p.globalAlpha)).toEqual(alphas);
        // Under the nodes and on them, the same drawing as on the node at full alpha, which sets alphas of its own, with each one scaled.
        expect(calls.map((call) => canvas.graph._nodes.indexOf(call.node as FakeNode))).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
        const drawn = (i: number) => paints.slice(calls[i].from, calls[i].to);
        expect(new Set(drawn(4).map((p) => p.globalAlpha)).size).toBeGreaterThan(5);
        for (const layer of [0, 4]) {
            for (const [i, alpha] of alphas.entries()) {
                expect(drawn(layer + i).map((p) => p.globalAlpha), `call ${layer + i}`).toEqual(scaled(drawn(layer), alpha));
            }
        }
        // Neon draws each title four times, the last at an alpha of its own; the outline is the hover colour's rectangle.
        const titles = paints.filter((p) => p.op === 'fillText');
        expect(titles.map((p) => p.globalAlpha)).toEqual(alphas.flatMap((alpha) => scaled(titles.slice(0, 4), alpha)));
        const outlines = paints.filter((p, i) => p.op === 'strokeRect' && !calls.some((call) => i >= call.from && i < call.to));
        expect(outlines.map((p) => [p.style, p.globalAlpha])).toEqual(alphas.map((alpha) => ['rgba(0, 255, 21, 0.7)', alpha]));
    });

    it('draw nothing on a collapsed node, not even the hover outline', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Color.Hover.Show': true }, {
            nodes: [{ pos: [300, 300], collapsed: true }],
        });
        canvas.graph._nodes[0].mouseOver = true;
        const { lines, calls } = frame(canvas);
        expect(calls).toEqual([]);
        expect(lines.filter((line) => line.startsWith('strokeRect('))).toEqual([]);
        expect([live.nodes, live.particles]).toEqual([0, 0]);
    });
});

describe('titles', () => {
    it("are v2's styled title in place of the native one, which runs on the hidden canvas", async () => {
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES, '📦 Enhanced Nodes.Text.Style': 'retro' }, {
            nodes: [KSAMPLER, { pos: [700, 300], collapsed: true, title: 'Load' }],
        });
        clock.nodePhase = 0;
        const { lines } = frame(canvas);
        // Retro draws two offset copies, then the title: centred on the title bar, 15 px above the body; on a collapsed node's 80 px bar too.
        expect(lines.filter((line) => line.startsWith('fillText('))).toEqual([
            'fillText("KSampler", 109, -15)', 'fillText("KSampler", 111, -15)', 'fillText("KSampler", 110, -15)',
            'fillText("Load", 39, -15)', 'fillText("Load", 41, -15)', 'fillText("Load", 40, -15)',
        ]);
        expect(native.mock.calls.map(([ctx]) => ctx === dummy())).toEqual([true, true]);
    });

    it('are left to native for a node that draws its own, one without a title, in low quality and with Animated titles off', async () => {
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES }, { nodes: [{ pos: [100, 100], title: '' }, { pos: [400, 100], title: 'Own' }] });
        const own = vi.fn();
        const [untitled] = canvas.graph._nodes;
        canvas.graph._nodes[1].onDrawTitleText = own;
        const texts = () => frame(canvas).lines.filter((line) => line.startsWith('fillText('));
        expect(texts()).toEqual(['fillText("", 30, -10)']);
        expect(own).toHaveBeenCalledTimes(1);
        // Native draws no title in low quality, titled or not.
        [canvas.low_quality, untitled.title] = [true, 'Titled'];
        canvas.setDirty(true, true);
        expect(texts()).toEqual([]);
        [canvas.low_quality, untitled.title] = [false, ''];
        canvas.graph._nodes[1].onDrawTitleText = undefined;
        preview('📦 Enhanced Nodes.Text.Animation.Enabled', false);
        expect(texts()).toEqual(['fillText("", 30, -10)', 'fillText("Own", 30, -10)']);
        expect(native.mock.calls.every(([ctx]) => ctx === canvas.ctx)).toBe(true);
    });

    it('are native where the styled title fails, and once the guard turns it off', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const native = vi.spyOn(FakeNode.prototype, 'drawTitleText');
        const canvas = await start({ ...LINKS_OFF, ...TITLES }, { nodes: [KSAMPLER] });
        // The styled title fails as it starts, reading the clock.
        let tries = 0;
        Object.defineProperty(clock, 'nodePhase', { configurable: true, get: () => { tries++; throw new Error('boom'); } });
        try {
            for (let i = 0; i < 6; i++) {
                canvas.setDirty(true, false);
                frames(1);
            }
        } finally {
            Object.defineProperty(clock, 'nodePhase', { configurable: true, enumerable: true, writable: true, value: 0 });
        }
        expect(native.mock.calls.map(([ctx]) => ctx === canvas.ctx)).toEqual([true, true, true, true, true, true]);
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

        // Off: the nodes are native, nothing moves and the ticker stops, until a setting changes.
        probe.fail = false;
        canvas.setDirty(true, true);
        expect(frame(canvas).calls).toEqual([]);
        expect(live.nodes).toBe(0);
        page.requests = 0;
        frames(30);
        expect(page.requests).toBe(0);
        preview('📦 Enhanced Nodes.Glow', 0.7);
        expect(frame(canvas).calls).toHaveLength(2);
    });
});

describe('the under-layer', () => {
    it('draws and counts nothing in Vue mode, so the ticker stops', async () => {
        const canvas = await start({ ...LINKS_OFF, ...PARTICLES, ...TITLES, '📦 Enhanced Nodes.Animate': 1 }, { nodes: [KSAMPLER] });
        frames(5);
        (globalThis as unknown as { LiteGraph: { vueNodesMode: boolean } }).LiteGraph.vueNodesMode = true;
        canvas.setDirty(true, true);
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
            '📦 Enhanced Nodes.Intensity': 3, '📦 Enhanced Nodes.Animation.Glow': 2, '📦 Enhanced Nodes.Glow': 2, '📦 Enhanced Nodes.Animation.Size': 3,
            '📦 Enhanced Nodes.Quality': 3, '📦 Enhanced Nodes.Particle.Size': 3, '📦 Enhanced Nodes.Particle.Intensity': 3, '📦 Enhanced Nodes.Particle.Glow': 2,
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
                    // How far its drawing on the body reaches past it, at a few moments.
                    const reach = [-Infinity, -Infinity, -Infinity, -Infinity];
                    for (const phase of [0.7, 2.1, 3.6, 5.2]) {
                        [clock.nodePhase, clock.particlePhase] = [phase, phase * 1.7];
                        vi.spyOn(Math, 'random').mockImplementation(mulberry32(phase * 10));
                        probe.rec = new CanvasRecorder();
                        probe.calls = [];
                        canvas.drawNodeShape(node, probe.rec.ctx, [w, h], '#333', '#353535', true);
                        const [{ from, to }] = probe.calls;
                        overhang(probe.rec.paints.slice(from, to), [0, 0, w, h]).forEach((r, side) => (reach[side] = Math.max(reach[side], r)));
                    }
                    // With the body off screen, its drawing one pixel onto it from each side it reaches past the area native draws the node in:
                    // renderArea is 4 px wider on the left, 6 on the right, 5 taller at the bottom, and 34 at the top, with the title bar.
                    for (const [side, r] of reach.entries()) {
                        if (r <= [4, 34, 6, 5][side]) continue;
                        const [x, y] = [[-r + 1 - 1600, h / 2 - 450], [w / 2 - 800, -r + 1 - 900], [w + r - 1, h / 2 - 450], [w / 2 - 800, h + r - 1]][side];
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
