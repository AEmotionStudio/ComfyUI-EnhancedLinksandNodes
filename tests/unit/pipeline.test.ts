/**
 * The link pipeline (src/links/pipeline.ts) on the fake LiteGraph: native
 * traversal and renderLink calls stay native, the links we draw take their
 * colours in native order and their Link.Style's path, what does not move is
 * drawn into the background where native draws the link, the motion layer
 * draws what is on screen and stamps what native drew over it, our own shapes
 * take the hit data, a link's segments know their place along it, another
 * extension replacing renderLink is noticed, and Coexist leaves links to
 * another extension that draws them.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock, guard, live } from '@/core/engine';
import { palette } from '@/core/colors';
import { preview } from '@/core/settings';
import { STILL } from '@/links/stills';
import { drawMarkers } from '@/links/styles';
import { fake } from '../helpers/fake-app';
import { CanvasRecorder, fmt } from '../helpers/recording-context';
import type { Segment } from '@/links/pipeline';
import { FakeCanvas, frames, page, start, type GraphSpec } from '../helpers/fake-litegraph';

vi.mock('@/links/styles', async (importOriginal) => {
    const styles = await importOriginal<typeof import('@/links/styles')>();
    return { ...styles, drawMarkers: vi.fn(styles.drawMarkers) };
});

/** The segments the motion layer drew Classic Flow's markers on, in order, in one more frame. */
function moving(): Segment[] {
    vi.mocked(drawMarkers).mockClear();
    frames(1);
    return vi.mocked(drawMarkers).mock.calls.map(([, segment]) => segment);
}

const [LEFT, RIGHT] = [3, 4];

/** Two nodes on screen and a link from (311, 214) to (610, 214). */
const PAIR: GraphSpec = { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1 }] };

/** A link through a reroute, a link to a collapsed node, and a floating link. */
const GRAPH: GraphSpec = {
    nodes: [{ pos: [100, 100] }, { pos: [600, 100] }, { pos: [600, 400], collapsed: true }],
    links: [
        { from: 0, to: 1, reroutes: [[350, 300]] },
        { from: 0, to: 2 },
        { from: 0, to: 1, reroutes: [[350, 500]], floating: true },
    ],
};

const typeColors = (colors: Record<string, string>) =>
    Object.assign((globalThis as unknown as { LGraphCanvas: { link_type_colors: Record<string, string> } }).LGraphCanvas.link_type_colors, colors);

/** What one frame painted on each canvas. */
function frame(canvas: FakeCanvas) {
    const [front, back] = [canvas.front.paints.length, canvas.back.paints.length];
    const lines = canvas.front.lines.length;
    frames(1);
    return { front: canvas.front.paints.slice(front), back: canvas.back.paints.slice(back), lines: canvas.front.lines.slice(lines) };
}

/** The dark halo Classic Flow draws under its links and markers by default. */
const HALO = 'rgba(0, 0, 0, 0.95)';
/** What was stroked, past the halos under it. */
const strokes = (paints: { op: string; style: string }[]) => paints.filter((p) => p.op === 'stroke' && p.style !== HALO).map((p) => p.style);
/** Classic Flow's markers and the centre markers, in the default link colour. */
const marks = (paints: { op: string; style: string }[]) => paints.filter((p) => p.op === 'fill' && p.style === '#99aa99').length;

/** What the frontend's renderLink hands its link adapter for these renderLink arguments (FE157 LGraphCanvas.ts L6535-6556), past the context. */
function handed(args: unknown[]): unknown[] {
    const { startControl, endControl, reroute, num_sublines = 1, disabled = false } = (args[9] ?? {}) as Record<string, unknown>;
    return [...args.slice(1, 9), { reroute, startControl, endControl, num_sublines, disabled }];
}

/** What a renderLinkDirect call got, in the same terms: past the context, and without the canvas the fake hands it. */
const received = (args: unknown[]) => [...args.slice(1, 9), args[10]];

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('drawConnections', () => {
    it('reaches the original once a pass with every argument', async () => {
        const original = vi.spyOn(FakeCanvas.prototype, 'drawConnections');
        const canvas = await start({}, PAIR);
        frames(1);
        expect(original).toHaveBeenCalledOnce();
        const [ctx, nodes, graph] = original.mock.calls[0];
        expect([ctx === canvas.bgctx, nodes === canvas.graph._nodes, graph === canvas.graph]).toEqual([true, true, true]);
    });
});

describe('renderLink', () => {
    it('reaches the original once per segment with every argument, whether native draws the link or we do', async () => {
        const runs: Record<string, { called: unknown[][]; native: unknown[][]; background: unknown }> = {};
        for (const [run, settings] of [['native', { '🔗 Enhanced Links.Animate': 0 }], ['ours', {}]] as const) {
            const canvas = await start(settings, GRAPH);
            const called = vi.spyOn(canvas, 'renderLink');
            const native = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
            frames(1);
            runs[run] = { called: called.mock.calls, native: native.mock.calls, background: canvas.bgctx };
        }
        // Into the reroute, out of it, to the collapsed node, and the floating link.
        expect(runs.ours.native).toHaveLength(4);
        expect(runs.ours.native.map(received)).toEqual(runs.ours.called.map(handed));
        expect(runs.ours.native.map(received)).toEqual(runs.native.native.map(received));
        expect(runs.native.native.map(([ctx]) => ctx === runs.native.background)).toEqual([true, true, true, true]);
        // The segments we draw run natively on one hidden 1×1 canvas; native draws the floating one.
        const [ctx] = runs.ours.native[0];
        expect(runs.ours.native.map(([c]) => c === ctx)).toEqual([true, true, true, false]);
        expect(ctx).not.toBe(runs.ours.background);
        expect(runs.ours.native[3][0]).toBe(runs.ours.background);
    });

    it("passes on calls outside our pass or on another context, KJNodes' virtual links and a triggered link's flash", async () => {
        const other = new CanvasRecorder().ctx;
        const drawConnections = FakeCanvas.prototype.drawConnections;
        vi.spyOn(FakeCanvas.prototype, 'drawConnections').mockImplementation(function (this: FakeCanvas, ctx) {
            drawConnections.call(this, ctx);
            const link = this.graph.links[1];
            this.renderLink(ctx, [0, 0], [50, 50], null, false, null, '#abcdef', RIGHT, LEFT);
            this.renderLink(other, [0, 0], [50, 50], link, false, 0, null, RIGHT, LEFT);
        });
        const canvas = await start({}, { ...PAIR, links: [{ from: 0, to: 1, flash: true }] });
        const original = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        // KJNodes draws its Set/Get links in onDrawBackground, before drawConnections.
        canvas.onDrawBackground = (ctx) => canvas.renderLink(ctx, [10, 10], [90, 90], null, false, null, '#FFF', RIGHT, LEFT);
        frames(1);
        const where = (ctx: unknown) => (ctx === canvas.bgctx ? 'background' : ctx === other ? 'other' : 'hidden');
        const calls = () => original.mock.calls.map(([ctx, , , link, skipBorder, , color]) => [where(ctx), link?.id ?? null, skipBorder, color]);
        expect(calls()).toEqual([
            ['background', null, false, '#FFF'],
            ['hidden', 1, false, null],
            ['background', 1, true, 'white'],
            ['background', null, false, '#abcdef'],
            ['other', 1, false, null],
        ]);
        // A link drawn before the next pass's drawConnections is outside our pass too.
        canvas.onDrawBackground = (ctx) => canvas.renderLink(ctx, [10, 10], [90, 90], canvas.graph.links[1], false, 0, null, RIGHT, LEFT);
        original.mockClear();
        canvas.setDirty(true, true);
        frames(1);
        expect(calls()[0]).toEqual(['background', 1, false, null]);
    });

    for (const [why, settings, change] of [
        ['with Animate 0', { '🔗 Enhanced Links.Animate': 0 }, () => {}],
        ['below 25% zoom', {}, (canvas: FakeCanvas) => { canvas.ds.scale = 0.2; }],
    ] as const) {
        it(`leaves links to native ${why}`, async () => {
            const canvas = await start(settings, PAIR);
            const original = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
            change(canvas);
            const painted = frame(canvas);
            expect(original.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([true]);
            expect(strokes(painted.front)).toEqual([]);
            expect(live.links).toBe(0);
        });
    }

    it("draws links in LiteGraph's low quality too, as v1 and v2 did", async () => {
        const canvas = await start({}, PAIR);
        const original = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        [canvas.low_quality, canvas.ds.scale] = [true, 0.5];
        const painted = frame(canvas);
        expect(original.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([false]);
        // The body where native would have drawn it, the two markers over it. Below 60% zoom there is no centre marker.
        expect(strokes(painted.back)).toEqual(['#99aa99']);
        expect(marks(painted.front)).toBe(2);
        expect(live.links).toBe(1);
        // Down to 25% zoom.
        canvas.ds.scale = 0.3;
        canvas.setDirty(true, true);
        frame(canvas);
        expect(original.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([false, false]);
    });

    it('leaves links to native once the guard turned them off, until a setting changes', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start({}, PAIR);
        const original = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        for (let i = 0; i < 5; i++) guard.fail('Link animation', new Error('boom'));
        expect(marks(frame(canvas).front)).toBe(0);
        expect(original.mock.lastCall?.[0]).toBe(canvas.bgctx);
        preview('🔗 Enhanced Links.Thickness', 4);
        expect(marks(frame(canvas).front)).toBe(3);
        expect(original.mock.lastCall?.[0]).not.toBe(canvas.bgctx);
    });

    it('leaves the hit data to the native call', async () => {
        const canvas = await start({}, PAIR);
        const link = canvas.graph.links[1];
        link._pos = [NaN, NaN];
        frames(1);
        // The fake's native renderLink keeps the middle of the segment's ends.
        expect(link._pos).toEqual([460.5, 214]);
    });
});

describe('the links we draw', () => {
    it('take their colours as native does: white when highlighted, else the colour argument, the type colour or the default', async () => {
        const drawConnections = FakeCanvas.prototype.drawConnections;
        vi.spyOn(FakeCanvas.prototype, 'drawConnections').mockImplementation(function (this: FakeCanvas, ctx) {
            drawConnections.call(this, ctx);
            this.renderLink(ctx, [100, 800], [500, 800], this.graph.links[1], false, 0, '#00ff00', RIGHT, LEFT);
        });
        const canvas = await start({}, {
            nodes: [0, 1, 2, 3].flatMap((row) => [{ pos: [100, 100 + 150 * row] as [number, number] }, { pos: [600, 100 + 150 * row] as [number, number] }]),
            links: [{ from: 0, to: 1, type: 'IMAGE' }, { from: 2, to: 3, type: 'INT' }, { from: 4, to: 5, type: 'MY_TYPE' }, { from: 6, to: 7, type: 'IMAGE' }],
        });
        // The palette has '' for INT; ComfyUI's renderer leaves link.color out.
        typeColors({ IMAGE: '#64B5F6', INT: '' });
        canvas.graph.links[2].color = '#ff0000';
        canvas.highlighted_links = { 4: true };
        expect(strokes(frame(canvas).back)).toEqual(['#64b5f6', '#99aa99', '#99aa99', '#ffffff', '#00ff00']);
        // The canvas default, as a palette sets it; LiteGraph's own where the canvas would not take that.
        for (const [fallback, drawn] of [['#335', '#333355'], ['', '#99aa99']]) {
            canvas.default_link_color = fallback;
            canvas.setDirty(true, true);
            expect(strokes(frame(canvas).back), fallback).toEqual(['#64b5f6', drawn, drawn, '#ffffff', '#00ff00']);
        }
        // Color.Scheme takes that one too.
        preview('🔗 Enhanced Links.Color.Scheme', 'bright');
        canvas.setDirty(true, true);
        const bright = palette('#9A9')!.primary;
        expect(bright).not.toBe('#99aa99');
        expect(strokes(frame(canvas).back).slice(1, 3)).toEqual([bright, bright]);
    });

    it('follow the native render mode as Same as ComfyUI, and take its Linear and Straight rules as Direct and Right-angle', async () => {
        const canvas = await start({}, { nodes: [{ pos: [100, 200] }, { pos: [600, 300] }], links: [{ from: 0, to: 1 }] });
        // The body Classic Flow draws where native would have drawn the link, after its halo along the same path.
        const path = () => {
            const from = canvas.back.lines.length;
            canvas.setDirty(true, true);
            frames(1);
            const drawn = canvas.back.lines.slice(from).filter((line) => /^(moveTo|lineTo|bezierCurveTo)/.test(line));
            const [halo, body] = [drawn.slice(0, drawn.length / 2), drawn.slice(drawn.length / 2)];
            expect(halo).toEqual(body);
            return body;
        };
        // LINEAR: 15 px out of the output (311, 214), across, and 15 px into the input (610, 314).
        const linear = ['moveTo(311, 214)', 'lineTo(326, 214)', 'lineTo(595, 314)', 'lineTo(610, 314)'];
        // STRAIGHT: 10 px stubs joined across at right angles halfway.
        const straight = ['moveTo(311, 214)', 'lineTo(321, 214)', 'lineTo(460.5, 214)', 'lineTo(460.5, 314)', 'lineTo(600, 314)', 'lineTo(610, 314)'];
        canvas.links_render_mode = 1;
        expect(path()).toEqual(linear);
        for (const mode of [0, 2]) {
            canvas.links_render_mode = mode;
            preview('🔗 Enhanced Links.Link.Style', 'straight');
            expect(path(), `Direct in mode ${mode}`).toEqual(linear);
            preview('🔗 Enhanced Links.Link.Style', 'linear');
            expect(path(), `Right-angle in mode ${mode}`).toEqual(straight);
        }
        preview('🔗 Enhanced Links.Link.Style', 'spline');
        // Each control a quarter of the 315.28 px between the ends out along its slot.
        expect(path()).toEqual(['moveTo(311, 214)', 'bezierCurveTo(389.82, 214, 531.18, 314, 610, 314)']);
    });

    it('are drawn and counted only on screen, or close enough for an effect to reach it, and the ticker stops when none is', async () => {
        // y 214 on screen, 1000 within reach of its bottom edge (900), 1100 not.
        const canvas = await start({}, {
            nodes: [200, 986, 1086].flatMap((y) => [{ pos: [100, y] as [number, number] }, { pos: [600, y] as [number, number] }]),
            links: [{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 4, to: 5 }],
        });
        frames(4);
        expect(moving().map((segment) => segment.start[1])).toEqual([214, 1000]);
        expect(live.links).toBe(2);
        canvas.ds.offset = [-20000, -20000];
        canvas.setDirty(true, true);
        frames(5);
        expect(live.links).toBe(0);
        page.requests = 0;
        frames(60);
        expect(page.requests).toBe(0);
    });

    it('are drawn in graph space under the nodes, or over them when the graph puts links on top', async () => {
        const canvas = await start({}, PAIR);
        const order = (painted: { op: string }[]) => painted.map((p) => p.op).filter((op) => op === 'stroke' || op === 'fill').join(' ');
        // The link's two markers, each on its halo, and the centre marker over its body in the background; then each node's body.
        expect(order(frame(canvas).front)).toBe('fill fill fill fill fill fill fill');
        // onRender runs in screen space: the layer takes the view's transform, as the nodes after it do.
        canvas.ds.scale = 2;
        canvas.ds.offset = [-100, -100];
        canvas.setDirty(true, true);
        const { lines } = frame(canvas);
        const transforms = lines.flatMap((line, i) => (line === 'scale(2, 2)' && lines[i + 1] === 'translate(-100, -100)' ? [i] : []));
        expect(transforms).toHaveLength(2);
        expect(lines.indexOf('fill()')).toBeGreaterThan(transforms[0]);
        expect(lines.indexOf('fill()')).toBeLessThan(transforms[1]);
        [canvas.ds.scale, canvas.ds.offset] = [1, [0, 0]];
        // Native draws links over the nodes again in the front pass: the body on its halo there, then the motion over it.
        canvas.graph.config.links_ontop = true;
        canvas.setDirty(true, true);
        expect(order(frame(canvas).front)).toBe('fill fill stroke stroke fill fill fill fill fill');
        expect(live.links).toBe(1);
    });

    it('have the reroutes and centre markers stamped over them', async () => {
        const rerouted = await start({}, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[400, 320]] }] });
        const { lines } = frame(rerouted);
        const lastStroke = lines.reduce((last, line, i) => (line.startsWith('stroke(') ? i : last), -1);
        const reroute = lines.indexOf('arc(400, 320, 10, 0, 6.28)');
        const markers = lines.flatMap((line, i) => (/^arc\(.*, 5, 0, 6\.28\)$/.test(line) ? [i] : []));
        expect(reroute).toBeGreaterThan(lastStroke);
        // A circle on each segment, in the link colour, under the reroute, as native draws the reroutes after every segment.
        expect(markers).toHaveLength(2);
        expect(markers.every((i) => i > lastStroke && i < reroute && lines[i + 1] === 'fillStyle = #99aa99' && lines[i + 2] === 'fill()')).toBe(true);
        // At the editor's alpha.
        rerouted.editor_alpha = 0.5;
        rerouted.setDirty(true, true);
        const faded = frame(rerouted).lines;
        const stamps = faded.slice(faded.indexOf('globalAlpha = 0.5'), faded.indexOf('arc(400, 320, 10, 0, 6.28)') + 1);
        expect(stamps.filter((line) => line.startsWith('globalAlpha') || line.startsWith('arc('))).toEqual([
            'globalAlpha = 0.5', 'arc(355.5, 267, 5, 0, 6.28)', 'arc(505, 267, 5, 0, 6.28)', 'arc(400, 320, 10, 0, 6.28)',
        ]);

        // An arrow along the link, when the native markers are arrows; none below 60% zoom, as native.
        const canvas = await start({}, PAIR);
        canvas.linkMarkerShape = 2;
        const arrow = ['moveTo(457.3, 209)', 'lineTo(467.5, 214)', 'lineTo(457.3, 219)', 'fillStyle = #99aa99', 'fill()'];
        const drawn = frame(canvas).lines;
        expect(drawn.slice(drawn.indexOf(arrow[0]), drawn.indexOf(arrow[0]) + 5)).toEqual(arrow);
        canvas.ds.scale = 0.5;
        canvas.setDirty(true, true);
        expect(frame(canvas).lines).not.toContain(arrow[0]);
        // None for LinkMarkerShape None, nor without high-quality rendering, as native.
        canvas.ds.scale = 1;
        for (const [shape, highQuality] of [[0, true], [1, false]] as const) {
            [canvas.linkMarkerShape, canvas.highquality_render] = [shape, highQuality];
            canvas.setDirty(true, true);
            expect(frame(canvas).lines.filter((line) => line === arrow[0] || /^arc\(.*, 5, 0, 6\.28\)$/.test(line))).toEqual([]);
        }
    });

    it('are baked into the background while still, with the ticker off', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Static.Mode': true }, PAIR);
        const still = frame(canvas);
        // The link and its centre marker, where native would have drawn it.
        expect(strokes(still.back)).toEqual(['#99aa99']);
        expect(still.back.filter((p) => p.op === 'fill').at(-1)?.style).toBe('#99aa99');
        canvas.back.assertBalanced();
        expect(strokes(still.front)).toEqual([]);
        page.requests = 0;
        frames(60);
        expect(page.requests).toBe(0);

        // The first tick after the setting change only starts the clock.
        preview('🔗 Enhanced Links.Static.Mode', false);
        frames(2);
        const moving = frame(canvas);
        expect([strokes(moving.front), marks(moving.front)]).toEqual([[], 3]);
        expect(moving.back).toEqual([]);
        expect(live.links).toBe(1);
    });

    it('leave a still segment they fail to bake to native, and the guard counts the failure', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start({ '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Animate': 7 }, PAIR);
        // A colour the canvas cannot parse no longer makes Lava Flow's gradient throw (every colour has a palette), so it throws itself.
        vi.spyOn(STILL, 7).mockImplementation(() => {
            throw new Error('boom');
        });
        const original = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        frames(1);
        expect(original.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([true]);
        expect(warn).toHaveBeenCalledOnce();
        canvas.back.assertBalanced();
    });

    it('draw nothing in the Hidden render mode', async () => {
        const canvas = await start({}, PAIR);
        canvas.links_render_mode = -1;
        const painted = frame(canvas);
        expect([strokes(painted.front), strokes(painted.back), live.links]).toEqual([[], [], 0]);
    });

    it('reuse their segments from pass to pass', async () => {
        const canvas = await start({}, GRAPH);
        const segments = moving();
        expect(segments).toHaveLength(3);
        for (let i = 0; i < 5; i++) {
            canvas.setDirty(true, true);
            frames(1);
        }
        canvas.setDirty(true, true);
        const again = moving();
        expect(again.every((segment, i) => segment === segments[i])).toBe(true);
    });

    it('come back the same after the canvas is drawn at another zoom between frames, as MagnifyGlass does', async () => {
        const canvas = await start({}, GRAPH);
        frames(5);
        const draw = () => {
            const lines = canvas.front.lines.length;
            canvas.draw(true, true);
            return canvas.front.lines.slice(lines);
        };
        const plain = draw();
        const moment = { ...clock };
        // Its virtual zoom draws both canvases closer in, then again at the user's zoom.
        canvas.ds.scale = 2;
        draw();
        canvas.ds.scale = 1;
        expect(draw()).toEqual(plain);
        expect(clock).toEqual(moment);
        expect(live.links).toBe(3);
    });
});

describe("a link's segments", () => {
    const at = (s: Segment, T: number) => {
        const out = new Float64Array(4);
        s.path.at(s.local(T), out);
        return [out[0], out[1]];
    };

    it('know where along their link they are, so its motion runs on across a reroute', async () => {
        await start({}, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[400, 320]] }] });
        const [into, out] = moving();
        expect([into.u0, out.u0]).toEqual([0, into.len]);
        expect([into.chain, out.chain]).toEqual([into.len + out.len, into.len + out.len]);
        expect([into.t0, into.t1, out.t0, out.t1]).toEqual([0, into.len / into.chain, into.len / into.chain, 1]);
        // Both meet at the reroute, at the same fraction of the link.
        expect(at(into, into.t1)).toEqual([400, 320]);
        expect(at(out, out.t0)[0]).toBeCloseTo(400, 9);
        expect(at(out, out.t0)[1]).toBeCloseTo(320, 9);
        // Just either side of it, the link's points are a step apart, not a jump back to a start.
        const step = 1e-4;
        const [before, after] = [at(into, into.t1 - step), at(out, out.t0 + step)];
        expect(Math.hypot(after[0] - before[0], after[1] - before[1])).toBeLessThan(2 * step * into.chain);
        expect([at(into, 0), at(out, 1)]).toEqual([[311, 214], [610, 214]]);
    });

    it('take each of the link\'s elements once between them, so counts are per link', async () => {
        await start({}, { nodes: [{ pos: [100, 200] }, { pos: [600, 400] }], links: [{ from: 0, to: 1, reroutes: [[300, 500], [450, 150]] }] });
        const parts = moving();
        expect(parts).toHaveLength(3);
        for (let i = 0; i < 101; i++) {
            const T = (i + 0.5) / 101;
            const on = parts.filter((s) => s.local(T) >= 0 && s.local(T) <= 1);
            expect(on, `T ${T}`).toHaveLength(1);
        }
    });

    it('take a link without reroutes as v1 took its links: at the link\'s own fractions', async () => {
        await start({}, PAIR);
        const [whole] = moving();
        expect([whole.u0, whole.t0, whole.t1, whole.chain]).toEqual([0, 0, 1, whole.len]);
        for (const T of [0, 0.1, 1 / 3, 0.7, 0.99, 1]) expect(whole.local(T)).toBe(T);
    });

    it('draw nothing on a stretch of no length, and every animation keeps going', async () => {
        // Snapping to the grid can put two reroutes, or a reroute and a slot, on one spot.
        for (const reroutes of [[[400, 300], [400, 300]], [[311, 214], [450, 330]]] as [number, number][][]) {
            for (const still of [false, true]) {
                for (let animate = 1; animate <= 9; animate++) {
                    const canvas = await start({ '🔗 Enhanced Links.Animate': animate, '🔗 Enhanced Links.Static.Mode': still }, { ...PAIR, links: [{ from: 0, to: 1, reroutes }] });
                    frames(30);
                    const label = `reroutes ${JSON.stringify(reroutes)}, Animate ${animate}${still ? ', still' : ''}`;
                    expect(fake.toasts, label).toEqual([]);
                    expect([...canvas.back.lines, ...canvas.front.lines].filter((line) => line.includes('NaN')), label).toEqual([]);
                }
            }
        }
    });

    it('carry on from a stretch another link drew for both of them', async () => {
        const canvas = await start({}, {
            nodes: [{ pos: [100, 200] }, { pos: [600, 100] }, { pos: [600, 400] }],
            links: [{ from: 0, to: 1, reroutes: [[400, 320]] }, { from: 0, to: 2 }],
        });
        // The second link runs through the first one's reroute, as links from one output can (LLink.getReroutes).
        const [first, second] = [canvas.graph.links[1], canvas.graph.links[2]];
        Object.assign(second, { reroutes: first.reroutes, parentId: first.parentId });
        canvas.setDirty(true, true);
        // Native draws the stretch to the reroute once, for the first link.
        const [shared, firstOwn, secondOwn] = moving();
        expect([shared.link, firstOwn.link, secondOwn.link]).toEqual([first, first, second]);
        expect(secondOwn.u0).toBe(shared.len);
        expect(secondOwn.chain).toBe(shared.len + secondOwn.len);
        expect(secondOwn.t0).toBeGreaterThan(0);
    });
});

describe('our own shapes', () => {
    /** The ops of a Path2D the recorder made. */
    const ops = (path: unknown) => (path as { ops: string[] } | undefined)?.ops;

    for (const style of ['stepped', 'zigzag', 'coil', 'straight', 'linear']) {
        it(`take the hit data and the centre marker along with them: ${style}`, async () => {
            const canvas = await start({ '🔗 Enhanced Links.Link.Style': style }, { nodes: [{ pos: [100, 200] }, { pos: [600, 400] }], links: [{ from: 0, to: 1, reroutes: [[350, 500]] }] });
            const before = canvas.front.paints.length;
            const [into, out] = moving();
            const front = canvas.front.paints.slice(before);
            const reroute = canvas.graph.reroutes.get(1)!;
            const link = canvas.graph.links[1];
            // What native tests clicks against and opens the link menu at: the reroute's segment's on the reroute, the last one's on the link.
            for (const [owner, segment] of [[reroute, into], [link, out]] as const) {
                expect(ops(owner.path)).toEqual(ops(segment.path.hit()));
                expect([...owner._pos, owner._centreAngle]).toEqual([segment.path.cx, segment.path.cy, segment.path.angle]);
            }
            // The centre markers sit there.
            const lines = canvas.front.lines.filter((line) => /^arc\(.*, 5, 0, 6\.28\)$/.test(line));
            expect(lines.slice(-2)).toEqual([into, out].map(({ path }) => `arc(${fmt(path.cx)}, ${fmt(path.cy)}, 5, 0, 6.28)`));
            expect(front.length).toBeGreaterThan(0);
        });
    }

    for (const style of ['zigzag', 'coil']) {
        it(`carry on across a reroute without a break: ${style}`, async () => {
            // A level link through a reroute on its way: the wave or coil runs on from where the link has got to.
            await start({ '🔗 Enhanced Links.Link.Style': style }, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[460, 214]] }] });
            const ends = moving().map((s) => {
                const rec = new CanvasRecorder();
                s.path.trace(rec.ctx);
                return rec.lines.filter((line) => /^(moveTo|lineTo)\(/.test(line)).map((line) => line.slice(line.indexOf('(') + 1, -1).split(', ').map(Number));
            });
            const [into, out] = [ends[0].at(-1)!, ends[1][0]];
            expect(Math.hypot(out[0] - into[0], out[1] - into[1])).toBeLessThan(1e-6);
            // Not where a fresh wave or coil would start, on the path.
            expect(Math.hypot(into[0] - 460, into[1] - 214)).toBeGreaterThan(1);
        });
    }

    it('are only Link.Style values with a path native does not draw', async () => {
        for (const style of ['spline', 'dotted', 'rope', 'holographic']) {
            const canvas = await start({ '🔗 Enhanced Links.Link.Style': style }, PAIR);
            const link = canvas.graph.links[1];
            frames(1);
            // The fake's native renderer keeps the middle of the segment's ends and no path.
            expect([link.path, link._pos], style).toEqual([undefined, [460.5, 214]]);
        }
        // Direct is ComfyUI's Linear rule, so in the Linear render mode native has the same path.
        const canvas = await start({ '🔗 Enhanced Links.Link.Style': 'straight' }, PAIR);
        canvas.links_render_mode = 1;
        frames(1);
        expect(canvas.graph.links[1].path).toBeUndefined();
    });
});

describe('moving bodies', () => {
    const offsets = (lines: string[]) => lines.filter((line) => line.startsWith('lineDashOffset = ') && line !== 'lineDashOffset = 0').map((line) => Number(line.slice(17)));

    it('march dotted and dashed links over the background, toward the input going Forward and back going Reverse', async () => {
        for (const style of ['dotted', 'dashed']) {
            for (const direction of [1, -1]) {
                const canvas = await start({ '🔗 Enhanced Links.Link.Style': style, '🔗 Enhanced Links.Direction': direction }, PAIR);
                const first = frame(canvas);
                // Not in the background, where it would stand still.
                expect(strokes(first.back), style).toEqual([]);
                // Past the first tick, which only starts the clock.
                frames(2);
                // The halo's pattern and the body's, together.
                const marched = [frame(canvas), frame(canvas), frame(canvas)].map(({ lines }) => offsets(lines));
                expect(marched.map((o) => o.length), style).toEqual([2, 2, 2]);
                expect(marched.every(([halo, body]) => halo === body), style).toBe(true);
                const [a, b, c] = marched.map(([o]) => o);
                // 12 px per unit of flow, which grows 2 a second at speed 1: 0.4 px a frame.
                expect(b - a).toBeCloseTo(-0.4 * direction, 1);
                expect(c - b).toBeCloseTo(-0.4 * direction, 1);
            }
        }
    });

    it('hold still in the background while links are still, the pattern from the start of the link', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Link.Style': 'dashed', '🔗 Enhanced Links.Static.Mode': true }, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[400, 320]] }] });
        const { front } = frame(canvas);
        expect(strokes(front)).toEqual([]);
        // The second segment's pattern, its halo's and its body's, goes on from where the first one's stopped, wherever the flow has got.
        const set = offsets(canvas.back.lines);
        expect(set).toHaveLength(2);
        expect(set[0]).toBeGreaterThan(100);
        expect(set[1]).toBe(set[0]);
        expect(canvas.back.lines.filter((line) => line === 'setLineDash([12, 6])')).toHaveLength(2);
        clock.linkFlow += 7.3;
        const from = canvas.back.lines.length;
        canvas.setDirty(true, true);
        frame(canvas);
        expect(offsets(canvas.back.lines.slice(from))).toEqual(set);
        // Dotted links' dots too.
        const dotted = await start({ '🔗 Enhanced Links.Link.Style': 'dotted', '🔗 Enhanced Links.Static.Mode': true }, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[400, 320]] }] });
        frame(dotted);
        const held = offsets(dotted.back.lines);
        expect(held).toEqual(set);
        clock.linkFlow += 7.3;
        const later = dotted.back.lines.length;
        dotted.setDirty(true, true);
        frame(dotted);
        expect(offsets(dotted.back.lines.slice(later))).toEqual(held);
        page.requests = 0;
        frames(30);
        expect(page.requests).toBe(0);
    });
});

describe('still links', () => {
    it("draw a link's still elements along the whole link, once its last segment is drawn, and their centre markers over them", async () => {
        const canvas = await start({ '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Animate': 5 }, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[400, 320]] }] });
        const into = vi.spyOn(canvas, 'renderLink');
        const before = canvas.back.lines.length;
        frames(1);
        const lines = canvas.back.lines.slice(before);
        // Energy Pulse's three still orbs over the link, past both segments' ghosts, then the centre markers, then native's reroute.
        const orbs = lines.flatMap((line, i) => (/^arc\(.*, 0, 6\.28\)$/.test(line) && !/, (5|10), 0, 6\.28\)$/.test(line) ? [i] : []));
        const centres = lines.flatMap((line, i) => (/^arc\(.*, 5, 0, 6\.28\)$/.test(line) ? [i] : []));
        const ghosts = lines.flatMap((line, i) => (line.startsWith('bezierCurveTo(') ? [i] : []));
        expect([orbs.length, centres.length, ghosts.length]).toEqual([3, 2, 2]);
        expect(Math.min(...orbs)).toBeGreaterThan(Math.max(...ghosts));
        expect(Math.min(...centres)).toBeGreaterThan(Math.max(...orbs));
        expect(lines.indexOf('arc(400, 320, 10, 0, 6.28)')).toBeGreaterThan(Math.max(...centres));
        // Counted along the link: v1's first orb at its output, the next ones a third and two thirds along it.
        expect(lines[orbs[0]]).toMatch(/^arc\(311, 214, /);
        expect(into).toHaveBeenCalledTimes(2);
        canvas.back.assertBalanced();
    });

    it("run Lava Flow's core colours once along the whole link, as it moves too", async () => {
        // A level link through a reroute on its way, so the whole link's gradient runs from its output to its input.
        for (const still of [true, false]) {
            const canvas = await start({ '🔗 Enhanced Links.Static.Mode': still, '🔗 Enhanced Links.Animate': 7 }, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[460, 214]] }] });
            frames(2);
            const made = (still ? canvas.back : canvas.front).lines.filter((line) => line.includes('createLinearGradient('));
            expect(made.slice(-2).map((line) => line.slice(line.indexOf('(')).split(', ').map((n) => fmt(Number(n.replace(/[()]/g, '')))).join(', ')), `still ${still}`)
                .toEqual(['311, 214, 610, 214', '311, 214, 610, 214']);
        }
    });
});

describe('the selected nodes\' links', () => {
    it('stay native white in any Color.Mode and Color.Scheme', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Color.Mode': 'custom', '🔗 Enhanced Links.Color.Scheme': 'vivid', '🔗 Enhanced Links.Marker.Color.Mode': 'custom' }, PAIR);
        canvas.highlighted_links = { 1: true };
        const painted = frame(canvas);
        expect(strokes(painted.back)).toEqual(['#ffffff']);
        expect(new Set(painted.front.filter((p) => p.op === 'fill' && p.style !== HALO && p.style !== '#353535').map((p) => p.style))).toEqual(new Set(['#ffffff']));
    });
});

describe('Classic Flow', () => {
    it('without markers has nothing that moves: it is drawn into the background once and the ticker stays off', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false }, PAIR);
        const first = frame(canvas);
        expect(strokes(first.back)).toEqual(['#99aa99']);
        expect(marks(first.back)).toBe(1);
        page.requests = 0;
        frames(30);
        expect([page.requests, live.links, strokes(canvas.front.paints)]).toEqual([0, 0, []]);
    });

    it('moves its markers toward the input going Forward and toward the output going Reverse', async () => {
        for (const direction of [1, -1]) {
            const canvas = await start({ '🔗 Enhanced Links.Direction': direction }, PAIR);
            frames(3);
            // The first marker's arrow, along the level link from x 311 to 610.
            const where = () => Number(/^translate\(([\d.]+), 214\)$/.exec(frame(canvas).lines.find((line) => line.startsWith('translate(') && line.endsWith(', 214)'))!)![1]);
            const [a, b] = [where(), where()];
            expect(Math.sign(b - a), `direction ${direction}`).toBe(direction);
        }
    });
});

describe('glows', () => {
    /** One frame on each canvas: how many glows were stamped from sprites, past the front pass's copy of the background, and the blurs the canvas cast for the link. */
    function glows(canvas: FakeCanvas) {
        const { front, back } = frame(canvas);
        const blurs = (painted: { style: string; shadowBlur: number }[]) => [...new Set(painted.filter((p) => p.style === '#99aa99' || p.style === HALO).map((p) => p.shadowBlur).filter(Boolean))];
        return { stamped: front.filter((p) => p.op === 'drawImage').length - 1, front: blurs(front), back: blurs(back), backStamped: back.filter((p) => p.op === 'drawImage').length };
    }

    it('come from sprites in the motion layer, where nothing else casts a shadow', async () => {
        // Classic Flow's two markers each stamp their halo and their glow; Crystal Stream, Energy Pulse and Stellar Plasma stamp theirs.
        expect(glows(await start({}, PAIR))).toEqual({ stamped: 4, front: [], back: [10], backStamped: 0 });
        for (const animate of [2, 5, 8]) {
            const { stamped, front } = glows(await start({ '🔗 Enhanced Links.Animate': animate }, PAIR));
            expect([stamped > 0, front], `Animate ${animate}`).toEqual([true, []]);
        }
    });

    it('stay the canvas\'s own shadows between glowing strokes, and in still frames', async () => {
        // Sacred Flow's ribbon and Lava Flow's tube cast theirs, and so do the beads and embers between them.
        expect(glows(await start({ '🔗 Enhanced Links.Animate': 1 }, PAIR))).toMatchObject({ stamped: 0, front: [10] });
        expect(glows(await start({ '🔗 Enhanced Links.Animate': 7 }, PAIR))).toMatchObject({ stamped: 0, front: [15] });
        // Classic Flow's dashed bodies march in the motion layer with their glow and halo, so its markers glow alike.
        expect(glows(await start({ '🔗 Enhanced Links.Link.Style': 'dashed' }, PAIR))).toMatchObject({ stamped: 0, front: [10] });
        expect(glows(await start({ '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Animate': 8 }, PAIR))).toEqual({ stamped: 0, front: [], back: [10], backStamped: 0 });
    });
});

describe('a graph with many glowing links on screen', () => {
    /** `n` links one above another, all on screen. */
    function rows(n: number): GraphSpec {
        return {
            nodes: Array.from({ length: n }, (_, i) => [{ pos: [100, 50 + 60 * i] as [number, number] }, { pos: [600, 50 + 60 * i] as [number, number] }]).flat(),
            links: Array.from({ length: n }, (_, i) => ({ from: 2 * i, to: 2 * i + 1 })),
        };
    }

    /** A background pass, and what its link bodies and halos were stroked in, with their blurs, once each. */
    function bake(canvas: FakeCanvas): [string, number][] {
        canvas.setDirty(true, true);
        const strokes = frame(canvas).back.filter((p) => p.op === 'stroke').map((p) => JSON.stringify([p.style, p.shadowBlur]));
        return [...new Set(strokes)].map((stroke) => JSON.parse(stroke));
    }

    /** A canvas for `spec` whose last background pass drew its glows, whatever the tests before it left the view at. */
    async function settled(spec: GraphSpec): Promise<FakeCanvas> {
        const canvas = await start({}, spec);
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        bake(canvas);
        vi.advanceTimersByTime(150);
        bake(canvas);
        return canvas;
    }

    const GLOWING = [[HALO, 10], ['#99aa99', 10]];
    const PLAIN = [['#99aa99', 0]];

    afterEach(() => {
        vi.useRealTimers();
    });

    it('bakes its bases plain while the view moves or nodes are dragged, and with their glows 150 ms after the last of it', async () => {
        const canvas = await settled(rows(13));
        expect(bake(canvas), 'still').toEqual(GLOWING);
        for (const [i, move] of [() => { canvas.ds.offset = [-10, 0]; }, () => { canvas.ds.scale = 0.9; }, () => { canvas.isDragging = true; }].entries()) {
            move();
            expect(bake(canvas), `move ${i}`).toEqual(PLAIN);
            vi.advanceTimersByTime(100);
        }
        // A node held still under the pointer still counts as dragged; what brings the glows back is the time since the last plain pass.
        expect(canvas.dirty_bgcanvas).toBe(false);
        vi.advanceTimersByTime(50);
        expect(canvas.dirty_bgcanvas).toBe(true);
        expect(bake(canvas), 'settled').toEqual(GLOWING);
        canvas.isDragging = false;
        expect(bake(canvas), 'let go').toEqual(GLOWING);
        vi.advanceTimersByTime(1000);
        expect(canvas.dirty_bgcanvas).toBe(false);
    });

    it('is any graph whose last pass with glows drew more than 12 bases; others keep their glows however they move', async () => {
        for (const [n, moving] of [[12, GLOWING], [13, PLAIN]] as const) {
            const canvas = await settled(rows(n));
            canvas.ds.offset = [-10, 0];
            expect(bake(canvas), `${n} links`).toEqual(moving);
        }
    });
});

describe('Coexist', () => {
    /** Another extension's renderLink wrapper, in place before our setup() as LinkFX puts its own in init(): it notes each call's context and calls through. */
    function wrapFirst(): unknown[] {
        const contexts: unknown[] = [];
        const renderLink = FakeCanvas.prototype.renderLink;
        vi.spyOn(FakeCanvas.prototype, 'renderLink').mockImplementation(function (this: FakeCanvas, ...args) {
            contexts.push(args[0]);
            renderLink.apply(this, args);
        });
        return contexts;
    }

    it('steps aside for an extension that wrapped renderLink first, says so once, and node effects keep moving', async () => {
        vi.mocked(drawMarkers).mockClear();
        const seen = wrapFirst();
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1 }, PAIR);
        const native = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        frames(3);
        canvas.setDirty(true, true);
        frames(1);
        // Each background pass hands the link to the other extension and native on the background canvas.
        expect(seen.map((ctx) => ctx === canvas.bgctx)).toEqual([true, true]);
        expect(native.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([true, true]);
        expect(drawMarkers).not.toHaveBeenCalled();
        expect([live.links, live.nodes]).toEqual([0, 2]);
        expect(fake.toasts).toEqual([expect.objectContaining({ severity: 'info', summary: 'Link effects left to another extension' })]);
    });

    it('steps aside when LinkFX says it booted', async () => {
        vi.stubGlobal('__LINKFX_V2_BOOTED__', true);
        await start({}, PAIR);
        frames(2);
        expect(live.links).toBe(0);
        expect(fake.toasts).toHaveLength(1);
    });

    it("keeps Enhanced link effects when told to, through the other extension's wrapper once per segment", async () => {
        const seen = wrapFirst();
        const canvas = await start({ '🔗 Enhanced Links.Coexist': 'ours' }, GRAPH);
        frames(2);
        // Ours on the hidden canvas, the floating link on the background.
        expect(seen.map((ctx) => ctx === canvas.bgctx)).toEqual([false, false, false, true]);
        expect(live.links).toBe(3);
        expect(fake.toasts).toEqual([]);
    });

    it('always steps aside when told to, without a toast', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Coexist': 'defer' }, PAIR);
        const native = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        frames(2);
        expect(native.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([true]);
        expect(live.links).toBe(0);
        expect(fake.toasts).toEqual([]);
    });

    it('says it steps aside the first time it would have drawn links', async () => {
        wrapFirst();
        const canvas = await start({ '🔗 Enhanced Links.Animate': 0 }, PAIR);
        frames(2);
        expect(fake.toasts).toEqual([]);
        preview('🔗 Enhanced Links.Animate', 9);
        frames(2);
        canvas.setDirty(true, true);
        frames(2);
        expect(fake.toasts).toHaveLength(1);
    });
});

describe('another extension replacing renderLink', () => {
    it('without calling ours turns link motion off with one warning', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1 }, PAIR);
        frames(2);
        (globalThis as unknown as { LGraphCanvas: typeof FakeCanvas }).LGraphCanvas.prototype.renderLink = function () {};
        canvas.setDirty(true, true);
        frames(3);
        canvas.setDirty(true, true);
        frames(1);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn.mock.calls[0][0]).toMatch(/renderLink/);
        expect(live.links).toBe(0);
        // The node effects keep moving.
        expect(live.nodes).toBe(2);
    });

    it('is not suspected while the only link is being dragged', async () => {
        const warn = vi.spyOn(console, 'warn');
        const canvas = await start({}, PAIR);
        canvas.graph.links[1]._dragging = true;
        frames(2);
        expect(canvas.renderedPaths.size).toBe(1);
        expect(warn).not.toHaveBeenCalled();
    });
});
