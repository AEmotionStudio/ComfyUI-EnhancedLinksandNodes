/**
 * The link pipeline (src/links/pipeline.ts) on the fake LiteGraph: native
 * traversal and renderLink calls stay native, the links we draw take their
 * colours in native order, the motion layer draws what is on screen and
 * stamps what native drew over it, still links are baked into the background,
 * another extension replacing renderLink is noticed, and Coexist leaves links
 * to another extension that draws them.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock, guard, live } from '@/core/engine';
import { preview } from '@/core/settings';
import { renderAnimatedStyle } from '@/effects/animated-renderers';
import { fake } from '../helpers/fake-app';
import { CanvasRecorder } from '../helpers/recording-context';
import { FakeCanvas, frames, page, start, type GraphSpec } from '../helpers/fake-litegraph';

vi.mock('@/effects/animated-renderers', async (importOriginal) => {
    const renderers = await importOriginal<typeof import('@/effects/animated-renderers')>();
    return { ...renderers, renderAnimatedStyle: vi.fn(renderers.renderAnimatedStyle) };
});

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

const strokes = (paints: { op: string; style: string }[]) => paints.filter((p) => p.op === 'stroke').map((p) => p.style);

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
        expect(strokes(painted.front)).toEqual(['#99aa99']);
        expect(live.links).toBe(1);
    });

    it('leaves links to native once the guard turned them off, until a setting changes', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start({}, PAIR);
        const original = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        for (let i = 0; i < 5; i++) guard.fail('Link animation', new Error('boom'));
        expect(strokes(frame(canvas).front)).toEqual([]);
        expect(original.mock.lastCall?.[0]).toBe(canvas.bgctx);
        preview('🔗 Enhanced Links.Thickness', 4);
        expect(strokes(frame(canvas).front)).toEqual(['#99aa99']);
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
        expect(strokes(frame(canvas).front)).toEqual(['#64b5f6', '#99aa99', '#99aa99', '#ffffff', '#00ff00']);
    });

    it("follow the native render mode with the 'spline' Link.Style, and other styles keep their own paths", async () => {
        const canvas = await start({}, PAIR);
        canvas.links_render_mode = 1;
        const path = (lines: string[]) => lines.filter((line) => /^(moveTo|lineTo|bezierCurveTo)/.test(line)).slice(0, 4);
        // LINEAR: 15 px out of the output, across, and 15 px into the input.
        expect(path(frame(canvas).lines)).toEqual(['moveTo(311, 214)', 'lineTo(326, 214)', 'lineTo(595, 214)', 'lineTo(610, 214)']);
        preview('🔗 Enhanced Links.Link.Style', 'straight');
        expect(path(frame(canvas).lines).slice(0, 2)).toEqual(['moveTo(311, 214)', 'lineTo(610, 214)']);
        canvas.links_render_mode = 2;
        preview('🔗 Enhanced Links.Link.Style', 'spline');
        expect(path(frame(canvas).lines).slice(0, 2)).toEqual(['moveTo(311, 214)', 'bezierCurveTo(385.75, 214, 535.25, 214, 610, 214)']);
    });

    it('are drawn and counted only on screen, or close enough for an effect to reach it, and the ticker stops when none is', async () => {
        // y 214 on screen, 1000 within reach of its bottom edge (900), 1100 not.
        const canvas = await start({}, {
            nodes: [200, 986, 1086].flatMap((y) => [{ pos: [100, y] as [number, number] }, { pos: [600, y] as [number, number] }]),
            links: [{ from: 0, to: 1 }, { from: 2, to: 3 }, { from: 4, to: 5 }],
        });
        frames(5);
        expect(live.links).toBe(2);
        expect(vi.mocked(renderAnimatedStyle).mock.lastCall?.[1].map((item) => item.start[1])).toEqual([214, 1000]);
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
        // The link: its body, two markers and the centre marker; then each node's body.
        expect(order(frame(canvas).front)).toBe('stroke fill fill fill fill fill');
        // onRender runs in screen space: the layer takes the view's transform, as the nodes after it do.
        canvas.ds.scale = 2;
        canvas.ds.offset = [-100, -100];
        canvas.setDirty(true, true);
        const { lines } = frame(canvas);
        const transforms = lines.flatMap((line, i) => (line === 'scale(2, 2)' && lines[i + 1] === 'translate(-100, -100)' ? [i] : []));
        expect(transforms).toHaveLength(2);
        expect(lines.findIndex((line) => line.startsWith('stroke('))).toBeGreaterThan(transforms[0]);
        expect(lines.findIndex((line) => line.startsWith('stroke('))).toBeLessThan(transforms[1]);
        [canvas.ds.scale, canvas.ds.offset] = [1, [0, 0]];
        canvas.graph.config.links_ontop = true;
        canvas.setDirty(true, true);
        expect(order(frame(canvas).front)).toBe('fill fill stroke fill fill fill');
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
        expect(strokes(moving.front)).toEqual(['#99aa99']);
        expect(moving.back).toEqual([]);
        expect(live.links).toBe(1);
    });

    it('leave a still segment they fail to bake to native, and the guard counts the failure', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // Lava Flow's still gradient throws on a colour the canvas cannot parse, here a palette's.
        const canvas = await start({ '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Animate': 7 }, PAIR);
        typeColors({ INT: 'nope' });
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
        frames(1);
        const items = vi.mocked(renderAnimatedStyle).mock.lastCall![1];
        const segments = [...items];
        for (let i = 0; i < 5; i++) {
            canvas.setDirty(true, true);
            frames(1);
        }
        const again = vi.mocked(renderAnimatedStyle).mock.lastCall![1];
        expect(again).toBe(items);
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
        vi.mocked(renderAnimatedStyle).mockClear();
        const seen = wrapFirst();
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1 }, PAIR);
        const native = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        frames(3);
        canvas.setDirty(true, true);
        frames(1);
        // Each background pass hands the link to the other extension and native on the background canvas.
        expect(seen.map((ctx) => ctx === canvas.bgctx)).toEqual([true, true]);
        expect(native.mock.calls.map(([ctx]) => ctx === canvas.bgctx)).toEqual([true, true]);
        expect(renderAnimatedStyle).not.toHaveBeenCalled();
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
