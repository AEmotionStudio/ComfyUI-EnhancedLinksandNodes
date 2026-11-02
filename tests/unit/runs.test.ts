/**
 * This client's runs (src/fx/execution.ts) on the fake LiteGraph: the run is
 * the one this client's execution events tell of, never the queue every client
 * hears of, and one whose end never comes is over once the socket reconnects;
 * the river, the trail, the progress ring and the error outline at fixed times,
 * through a subgraph too, and over native's links with Animation None;
 * selection focus leaving the run's links whole; what each Pause.Mode does to
 * the effects, link and node parts apart; the fireworks' anchors; and
 * Navigate.Follow. The commands that go to the run are
 * tests/unit/commands.test.ts's, and the flash test is in v1-deviations.ts.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { L, preview } from '@/core/settings';
import { clock, env, live } from '@/core/engine';
import { lighter } from '@/core/colors';
import { RED } from '@/fx/execution';
import { endBursts, fireworks, type Anchor } from '@/fx/bursts';
import * as particles from '@/fx/particles';
import { app, fake } from '../helpers/fake-app';
import { frames, page, progress, queue, send, start, type FakeCanvas, type FakeNode, type GraphSpec } from '../helpers/fake-litegraph';

vi.mock('@/fx/bursts', async (importOriginal) => {
    const bursts = await importOriginal<typeof import('@/fx/bursts')>();
    return { ...bursts, fireworks: vi.fn(bursts.fireworks) };
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(fireworks).mockClear();
    fake.reducedMotion.matches = false;
    fake.reducedMotion.dispatchEvent(new Event('change'));
    document.querySelector('.eln-chipbar')?.remove();
});

/** Load → Sample → Save, Save an output node: link 1 leads into Sample, link 2 into Save. */
const CHAIN: GraphSpec = {
    nodes: [{ pos: [100, 200], title: 'Load' }, { pos: [500, 200], title: 'Sample' }, { pos: [900, 200], title: 'Save', output: true }],
    links: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
};
/** The theme accent the canvas has no CSS for here, and the INT links' colour, lightened for the river. */
const ACCENT = '#0b8ce9';
const RIVER = lighter('#99aa99');

const begin = (prompt: string) => send('execution_start', { prompt_id: prompt, timestamp: 0 });
const succeed = (prompt: string) => send('execution_success', { prompt_id: prompt, timestamp: 0 });
const fail = (prompt: string, id: string) =>
    send('execution_error', { prompt_id: prompt, node_id: id, node_type: 'ELNInt', executed: [], exception_message: 'boom', exception_type: 'RuntimeError', traceback: [], timestamp: 0 });

/** What one frame paints, and the lines it writes. */
function frame(canvas: FakeCanvas) {
    const [paints, lines] = [canvas.front.paints.length, canvas.front.lines.length];
    frames(1);
    return { paints: canvas.front.paints.slice(paints), lines: canvas.front.lines.slice(lines) };
}

/** A frame that paints the front canvas, whether or not anything asked for it. */
function painted(canvas: FakeCanvas) {
    canvas.setDirty(true, false);
    return frame(canvas);
}

/** The alpha of the river's link in each of `count` painted frames, 0 in one that draws none. */
const rivers = (canvas: FakeCanvas, count: number) =>
    Array.from({ length: count }, () => painted(canvas).paints.find((p) => p.op === 'stroke' && p.style === RIVER && p.lineWidth === L.thickness * 1.4)?.globalAlpha ?? 0);

/** The strokes a painted frame makes in `style`, `width` wide. */
const strokes = (canvas: FakeCanvas, style: string, width: number) => painted(canvas).paints.filter((p) => p.op === 'stroke' && p.style === style && p.lineWidth === width);

describe("this client's run", () => {
    it('is the one its own events tell of: the queue every client hears of, and another run interrupted, leave it be', async () => {
        await start({}, CHAIN);
        queue(1);
        expect(env.running).toBe(false);
        begin('mine');
        expect(env.running).toBe(true);
        // ComfyUI tells every client of an interrupted run (execution.py add_message, broadcast).
        send('execution_interrupted', { prompt_id: 'theirs', node_id: '1', node_type: 'ELNInt', executed: [], timestamp: 0 });
        queue(0);
        expect(env.running).toBe(true);
        succeed('mine');
        expect(env.running).toBe(false);
        begin('again');
        send('execution_interrupted', { prompt_id: 'again', node_id: '1', node_type: 'ELNInt', executed: [], timestamp: 0 });
        expect(env.running).toBe(false);
    });

    it('is over, without fireworks, once the socket reconnects, as its end may never come: the server restarted, or the socket dropped as it ended', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false }, CHAIN);
        frames(1);
        begin('lost');
        progress('lost', { 3: 'running' });
        frames(10);
        expect([env.running, live.rings]).toEqual([true, 1]);
        send('reconnecting', null);
        queue(0);
        expect(env.running).toBe(true);
        send('reconnected', null);
        expect(env.running).toBe(false);
        frames(1);
        expect([live.rings, strokes(canvas, ACCENT, 3)]).toEqual([0, []]);
        // The trail into Save fades as after any run, then the ticker stops.
        frames(8 * 60);
        page.requests = 0;
        frames(10);
        expect([page.requests, vi.mocked(fireworks).mock.calls.length]).toEqual([0, 0]);
    });

    it('draws a river into the running node: its link 1.4 × as wide in its colour lightened, from 150 ms after the node starts, with sparks flowing toward it, fading over 600 ms once it stops', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false }, CHAIN);
        frames(1);
        const sparks = vi.spyOn(particles, 'disc');
        begin('river');
        progress('river', { 2: 'running' });
        // In from 150 ms to 300 ms, then whole.
        const coming = rivers(canvas, 24);
        expect(coming.slice(0, 9).every((alpha) => alpha === 0)).toBe(true);
        expect(coming.slice(11, 17).every((alpha) => alpha > 0 && alpha < 1)).toBe(true);
        expect(coming.slice(21)).toEqual([1, 1, 1]);
        // Its sparks go toward Sample on link 1, 199 px long, 60 px apart at 400 px/s: 6.7 px along it a frame.
        const sparksAt = () => {
            sparks.mockClear();
            frames(1);
            return sparks.mock.calls.map(([, x]) => x).sort((a, b) => a - b);
        };
        const before = sparksAt();
        const after = sparksAt();
        expect(before.length).toBeGreaterThanOrEqual(3);
        // Each has one a frame before it 4 to 9 px back, but one that came in at the output.
        expect(after.filter((x) => before.some((b) => x - b > 4 && x - b < 9)).length).toBeGreaterThanOrEqual(after.length - 1);
        expect(Math.max(...after)).toBeLessThanOrEqual(canvas.graph._nodes[1].getInputPos(0)[0]);
        progress('river', { 2: 'finished' });
        const going = rivers(canvas, 44);
        expect(going[10]).toBeLessThan(1);
        expect(going.slice(40)).toEqual([0, 0, 0, 0]);
    });

    it('goes over the links native draws with Animation None, along their path whatever Link.Style says, while link effects are on', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '🔗 Enhanced Links.Link.Style': 'stepped' }, CHAIN);
        frames(1);
        begin('native');
        progress('native', { 2: 'running' });
        frames(20);
        canvas.setDirty(true, true);
        const from = canvas.back.paints.length;
        const [river] = strokes(canvas, RIVER, L.thickness * 1.4);
        // Native drew link 1 on the background, and the river follows it.
        const drawn = canvas.back.paints.slice(from).filter((p) => p.op === 'stroke' && p.style === '#99aa99');
        expect(drawn.map((p) => p.box)).toContainEqual(river.box);
        expect(river.globalAlpha).toBe(1);
        progress('native', { 2: 'finished', 3: 'running' });
        frames(60);
        expect(strokes(canvas, ACCENT, L.thickness * 3)).toHaveLength(1);
        preview('🔗 Enhanced Links.Enabled', false);
        frames(1);
        expect([strokes(canvas, RIVER, L.thickness * 1.4), strokes(canvas, ACCENT, L.thickness * 3)]).toEqual([[], []]);
    });

    it('leaves a trail into the nodes that ran, not those it took from the cache: the accent at 35 % through the run, then fading over Trail.Fade', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false, '🔗 Enhanced Links.Flow.Trail.Fade': 4 }, CHAIN);
        frames(1);
        begin('trail');
        send('execution_cached', { prompt_id: 'trail', nodes: ['2'], timestamp: 0 });
        progress('trail', { 2: 'finished', 3: 'running' });
        frames(20);
        // Sample came from the cache: no trail on link 1. Save runs: a river on link 2, no trail yet.
        const trails = () => strokes(canvas, ACCENT, L.thickness * 3);
        expect(trails()).toEqual([]);
        progress('trail', { 2: 'finished', 3: 'finished' });
        frames(60);
        expect(trails().map((p) => p.globalAlpha)).toEqual([0.35]);
        // Linear over 4 s once the run is over: half at 2 s.
        succeed('trail');
        frames(119);
        expect(trails()[0].globalAlpha).toBeCloseTo(0.35 / 2, 2);
        // Just past 4 s: at 4 s to the frame, what is left of it can round to a hair above 0.
        frames(121);
        expect(trails()).toEqual([]);
        // Gone, and the ticker with it.
        page.requests = 0;
        frames(10);
        expect(page.requests).toBe(0);
    });

    it('turns the links into a node that failed red, and outlines it in red: pulsing once a second, three times, shaking once, then holding until the next run or an edit of the node', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false }, CHAIN);
        frames(1);
        begin('failing');
        progress('failing', { 2: 'finished', 3: 'running' });
        fail('failing', '3');
        const first = frame(canvas);
        const red = first.paints.filter((p) => p.style === RED);
        // The link into Save, wider, and Save's outline, 9 px out from its title bar and body: no fill.
        expect(red.map((p) => [p.op, p.lineWidth])).toEqual([['stroke', L.thickness * 1.4], ['stroke', 3]]);
        const [, , save] = canvas.graph._nodes;
        const [x, y, w, h] = save.boundingRect;
        expect(red[1].box).toEqual([x - 10.5, y - 10.5, x + w + 10.5, y + h + 10.5]);
        // It shakes ±3 px for 300 ms, as its outline alone moves.
        const shakes: number[] = [];
        for (let i = 0; i < 24; i++) {
            // The move of the outline: the last before its stroke.
            const { lines } = painted(canvas);
            const outline = lines.lastIndexOf(`strokeStyle = ${RED}`);
            const shake = lines.slice(0, outline).reverse().find((line) => line.startsWith('translate('));
            shakes.push(shake?.endsWith(', 0)') ? Number(shake.slice('translate('.length, shake.indexOf(','))) : 0);
        }
        expect(Math.max(...shakes.map(Math.abs))).toBeLessThanOrEqual(3);
        expect(shakes.slice(0, 15).some((dx) => dx > 0.5) && shakes.slice(0, 15).some((dx) => dx < -0.5)).toBe(true);
        expect(shakes.slice(20)).toEqual([0, 0, 0, 0]);
        frames(170);
        const outlines = () => strokes(canvas, RED, 3);
        expect(outlines().map((p) => p.globalAlpha)).toEqual([1]);
        expect(live.rings).toBe(0);
        // Moving another node is no edit of it; turning it to bypass is.
        canvas.graph._nodes[0].pos[0] += 50;
        send('graphChanged', {});
        expect(outlines()).toHaveLength(1);
        save.mode = 4;
        send('graphChanged', {});
        expect(outlines()).toEqual([]);
        // The next run ends an outline too.
        save.mode = 0;
        begin('again');
        progress('again', { 3: 'running' });
        fail('again', '3');
        expect(outlines()).toHaveLength(1);
        begin('third');
        expect(outlines()).toEqual([]);
    });

    it('holds the error outline steady, unshaken, with reduced motion', async () => {
        const canvas = await start({}, CHAIN);
        fake.reducedMotion.matches = true;
        fake.reducedMotion.dispatchEvent(new Event('change'));
        begin('still');
        fail('still', '3');
        const { paints, lines } = frame(canvas);
        expect(paints.filter((p) => p.style === RED && p.lineWidth === 3).map((p) => p.globalAlpha)).toEqual([1]);
        expect(lines.some((line) => /^translate\([^,]+, 0\)$/.test(line) && line !== 'translate(0, 0)')).toBe(false);
        expect(live.rings).toBe(0);
    });

    it("rings a running node, 3 px wide 9 px outside it, clear of ComfyUI's own outline, filling clockwise from 12 o'clock with its progress, a pill for a collapsed one, else a comet going round twice in 4 s", async () => {
        const canvas = await start({}, { nodes: [{ pos: [100, 200] }, { pos: [500, 200], collapsed: true }] });
        frames(1);
        begin('ring');
        progress('ring', { 1: [5, 20], 2: 'running' });
        const { paints, lines } = frame(canvas);
        const rings = paints.filter((p) => p.op === 'stroke' && p.style === ACCENT && p.lineWidth === 3);
        // A quarter of the way round, and the collapsed one's comet: its four pieces, its head brightest.
        expect(rings.map((p) => p.globalAlpha)).toEqual([1, 0.25, 0.5, 0.75, 1]);
        const [open, collapsed] = canvas.graph._nodes;
        const ring = (node: FakeNode) => {
            const [x, y, w, h] = node.boundingRect;
            const r = node.flags.collapsed ? h / 2 + 10.5 : 8 + 10.5;
            return { line: `roundRect(${x - 10.5}, ${y - 10.5}, ${w + 21}, ${h + 21}, ${r})`, length: 2 * (w + 21 + h + 21) - 8 * r + 2 * Math.PI * r, top: (w + 21) / 2 - r };
        };
        expect(lines).toContain(ring(open).line);
        expect(lines).toContain(ring(collapsed).line);
        const dashes = lines.filter((line) => line.startsWith('setLineDash([')).map((line) => line.slice(13, line.indexOf(']')).split(', ').map(Number));
        const { length, top } = ring(open);
        expect(dashes[0].map((d) => Math.round(d))).toEqual([Math.round(length / 4), Math.round((length * 3) / 4)]);
        // From 12 o'clock: the dash starts that far along the ring.
        expect(Number(lines.find((line) => line.startsWith('lineDashOffset = '))!.slice(17))).toBeCloseTo(length - top, 1);
        // The comet's head goes round at half a turn a second.
        const head = () => {
            const offsets = painted(canvas).lines.filter((line) => line.startsWith('lineDashOffset = ')).map((line) => Number(line.slice(17)));
            return offsets.at(-1)!;
        };
        const at = head();
        frames(29);
        const later = head();
        const comet = ring(collapsed);
        expect((((at - later) % comet.length) + comet.length) % comet.length).toBeCloseTo(comet.length / 4, 0);
    });

    it('holds the comet as a whole ring with reduced motion, and the river’s sparks where they are as it comes in', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false }, CHAIN);
        fake.reducedMotion.matches = true;
        fake.reducedMotion.dispatchEvent(new Event('change'));
        frames(1);
        const sparks = vi.spyOn(particles, 'disc');
        begin('still');
        progress('still', { 2: 'running' });
        frames(12);
        // While the river comes in, its sparks keep their places.
        const places = Array.from({ length: 6 }, () => {
            sparks.mockClear();
            const alpha = rivers(canvas, 1)[0];
            return [alpha, JSON.stringify(sparks.mock.calls.map(([, x, y]) => [x, y]))] as const;
        });
        expect(new Set(places.map(([alpha]) => alpha)).size).toBeGreaterThan(1);
        expect(new Set(places.map(([, at]) => at)).size).toBe(1);
        frames(30);
        expect(strokes(canvas, ACCENT, 3).map((p) => p.globalAlpha)).toEqual([0.6]);
        expect(live.rings + live.flows).toBe(0);
    });

    it('has the node holding the subgraph a node runs in stand for it, and once the subgraph shows, the node itself', async () => {
        const inner: GraphSpec = { nodes: [{ pos: [100, 100], title: 'Inner' }] };
        const canvas = await start({ '🔗 Enhanced Links.Marker.Enabled': false }, { nodes: [{ pos: [100, 200] }, { pos: [500, 200], title: 'Group', subgraph: inner }], links: [{ from: 0, to: 1 }] });
        frames(1);
        begin('nested');
        progress('nested', { '2:1': 'running' });
        frames(30);
        const group = canvas.graph._nodes[1];
        const ringed = () => strokes(canvas, ACCENT, 3).map((p) => [p.box![0], p.box![1]]);
        expect(ringed()).toContainEqual([group.boundingRect[0] - 10.5, group.boundingRect[1] - 10.5]);
        expect(rivers(canvas, 1)).toEqual([1]);
        // Opened: the node in it is ringed.
        Object.assign(canvas, { graph: group.subgraph });
        canvas.setDirty(true, true);
        frames(2);
        const [node] = group.subgraph!._nodes;
        expect(ringed()).toContainEqual([node.boundingRect[0] - 10.5, node.boundingRect[1] - 10.5]);
    });

    it('keeps the links it flows along whole, clickable and drawn, whatever selection focus hides, until its trail has faded', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Focus.Mode': 'hide', '🔗 Enhanced Links.Flow.Trail.Fade': 2 }, CHAIN);
        const [load] = canvas.graph._nodes;
        canvas.selectItems([load]);
        frames(2);
        const link = canvas.graph.links[2];
        // Hidden: no hit path, and its centre gone.
        expect(Number.isNaN(link._pos[0])).toBe(true);
        begin('focus');
        progress('focus', { 3: 'running' });
        frames(2);
        expect(Number.isNaN(link._pos[0])).toBe(false);
        progress('focus', { 3: 'finished' });
        succeed('focus');
        frames(60);
        expect(Number.isNaN(link._pos[0])).toBe(false);
        frames(80);
        expect(Number.isNaN(link._pos[0])).toBe(true);
    });
});

describe('Pause.Mode', () => {
    /** How far the link phase and the node phase move over 60 frames, and how many paints the front canvas gets, with this client's run going. */
    async function during(settings: Record<string, unknown>) {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1, ...settings }, CHAIN);
        frames(5);
        begin('paused');
        progress('paused', { 2: 'running' });
        frames(5);
        const before = { ...clock };
        const painted = canvas.calls.length;
        frames(60);
        const paints = canvas.calls.slice(painted).filter((call) => call === 'drawFrontCanvas').length;
        return { links: clock.linkPhase - before.linkPhase, nodes: clock.nodePhase - before.nodePhase, paints, run: clock.runTime - before.runTime };
    }

    it('Freeze effects holds every effect still, the run’s visuals too, which change only as its events come', async () => {
        const held = await during({ '🔗 Enhanced Links.Pause.Mode': 'pause' });
        expect(held).toEqual({ links: 0, nodes: 0, paints: 0, run: 0 });
        // The river shows still, whole.
        expect(rivers(app.canvas as unknown as FakeCanvas, 1)).toEqual([1]);
    });

    it('Calm slows the effects to a quarter and halves what moves on the links, while the run’s visuals move, at 20 fps at most', async () => {
        const ignored = await during({ '🔗 Enhanced Links.Pause.Mode': 'ignore' });
        const calm = await during({ '🔗 Enhanced Links.Pause.Mode': 'calm' });
        expect(calm.links / ignored.links).toBeCloseTo(0.25, 1);
        expect(calm.nodes / ignored.nodes).toBeCloseTo(0.25, 1);
        expect(calm.paints).toBeLessThanOrEqual(21);
        expect(calm.paints).toBeGreaterThanOrEqual(18);
        expect(calm.run).toBeGreaterThan(0.9);
        // Classic Flow's markers at half their alpha, where native draws no marker of its own in the middle of each link.
        const canvas = app.canvas as unknown as FakeCanvas;
        canvas.linkMarkerShape = 0;
        const markers = painted(canvas).paints.filter((p) => p.op === 'fill' && p.style === '#99aa99');
        expect(markers.length).toBeGreaterThan(0);
        expect(new Set(markers.map((p) => p.globalAlpha))).toEqual(new Set([0.5]));
    });

    it('Spotlight holds the effects still, and paints while the river or a ring shows, no more', async () => {
        const spotlight = await during({});
        expect([spotlight.links, spotlight.nodes]).toEqual([0, 0]);
        expect(spotlight.paints).toBeGreaterThan(50);
        // Off screen, nothing paints.
        const canvas = app.canvas as unknown as FakeCanvas;
        canvas.ds.offset[0] = -5000;
        canvas.setDirty(true, true);
        frames(3);
        page.requests = 0;
        frames(30);
        expect(page.requests).toBe(0);
    });

    it('Keep animating changes nothing, nor does any mode for a part whose Pause.During.Render is off', async () => {
        const ignored = await during({ '🔗 Enhanced Links.Pause.Mode': 'ignore' });
        expect(ignored.links).toBeLessThan(0);
        expect(ignored.nodes).toBeGreaterThan(0);
        const links = await during({ '🔗 Enhanced Links.Pause.Mode': 'pause', '🔗 Enhanced Links.Pause.During.Render': false });
        expect(links.links).toBeCloseTo(ignored.links, 6);
        expect(links.nodes).toBe(0);
        const nodes = await during({ '🔗 Enhanced Links.Pause.Mode': 'calm', '📦 Enhanced Nodes.Pause.During.Render': false });
        expect(nodes.nodes).toBeCloseTo(ignored.nodes, 6);
        expect(nodes.links / ignored.links).toBeCloseTo(0.25, 1);
        // Once the run is over, the links move at their own pace again.
        succeed('paused');
        frames(5);
        const before = clock.linkPhase;
        frames(60);
        expect(clock.linkPhase - before).toBeCloseTo(ignored.links, 6);
    });
});

describe('the fireworks', () => {
    /**
     * The anchors a run that reaches `ran` and succeeds sets the fireworks off at, by title, or the view's middle; its show
     * is ended then, and the next can start, as shows start 3 s apart.
     */
    function anchors(ran: (number | string)[], cached: (number | string)[] = []): string[] {
        frames(1);
        vi.mocked(fireworks).mockClear();
        const prompt = `run ${page.now}`;
        begin(prompt);
        send('execution_cached', { prompt_id: prompt, nodes: cached.map(String), timestamp: 0 });
        for (const id of ran) progress(prompt, { [id]: 'running' as const });
        succeed(prompt);
        const shows = vi.mocked(fireworks).mock.calls.flatMap(([list]) => list as Anchor[]);
        endBursts();
        page.now += 4000;
        return shows.map((a) => (a.id === 'view' ? (a.small ? 'small middle' : 'middle') : (a as FakeNode).title));
    }

    /** Six output nodes round the view's middle, (800, 450), nearest first by number, and one plain node. */
    const OUTPUTS: GraphSpec = {
        nodes: [
            { pos: [700, 450], title: 'one', output: true }, { pos: [1000, 450], title: 'two', output: true }, { pos: [300, 500], title: 'three', output: true },
            { pos: [1300, 300], title: 'four', output: true }, { pos: [100, 800], title: 'five', output: true }, { pos: [4000, 400], title: 'far', output: true },
            { pos: [800, 100], title: 'plain' },
        ],
    };

    it('go off over the output nodes the run reached, three at most, nearest the middle of the view first, with a smaller show there for those off screen', async () => {
        await start({}, OUTPUTS);
        expect(anchors([2, 1, 7])).toEqual(['one', 'two']);
        expect(anchors([5, 4, 3, 2, 1])).toEqual(['one', 'two', 'three']);
        expect(anchors([6, 1], [7])).toEqual(['one', 'small middle']);
        // A plain node reached is no anchor.
        expect(anchors([7])).toEqual([]);
    });

    it('go off over the node holding the subgraph an output node ran in, and smaller in the middle for outputs in no node of the graph shown', async () => {
        const inner: GraphSpec = { nodes: [{ pos: [100, 100], title: 'Inner save', output: true }] };
        const canvas = await start({}, { nodes: [{ pos: [700, 450], title: 'Group', subgraph: inner }, { pos: [300, 450], title: 'Save', output: true }] });
        const [group] = canvas.graph._nodes;
        expect(anchors(['1:1'])).toEqual(['Group']);
        expect(anchors([], ['1:1', 2])).toEqual(['Group', 'Save']);
        group.subgraph!._nodes[0].properties.enhanced_fx_completion = 'exclude';
        expect(anchors(['1:1'])).toEqual([]);
        // Opened, the subgraph holds no node standing for Save.
        Object.assign(canvas, { graph: group.subgraph });
        expect(anchors([2])).toEqual(['small middle']);
        delete group.subgraph!._nodes[0].properties.enhanced_fx_completion;
        expect(anchors(['1:1', 2])).toEqual(['Inner save']);
    });

    it('go off over the primary nodes first, never over those excluded; over the primary nodes alone for Primary nodes, else as for Output nodes; and in the middle for Center of screen', async () => {
        const canvas = await start({}, OUTPUTS);
        const [one, , , , , , plain] = canvas.graph._nodes;
        plain.properties.enhanced_fx_completion = 'primary';
        one.properties.enhanced_fx_completion = 'exclude';
        expect(anchors([1, 2, 3])).toEqual(['plain', 'two', 'three']);
        preview('📦 Enhanced Nodes.Completion.Anchor', 'primary');
        expect(anchors([1, 2, 3])).toEqual(['plain']);
        delete plain.properties.enhanced_fx_completion;
        expect(anchors([1, 2, 3])).toEqual(['two', 'three']);
        preview('📦 Enhanced Nodes.Completion.Anchor', 'viewport');
        expect(anchors([])).toEqual(['middle']);
    });

    it('go off on success alone, start 3 s apart at least, and end early as the next run starts within 1.5 s', async () => {
        await start({}, OUTPUTS);
        begin('failed');
        progress('failed', { 1: 'running' });
        fail('failed', '1');
        begin('stopped');
        send('execution_interrupted', { prompt_id: 'stopped', node_id: '1', node_type: 'ELNInt', executed: [], timestamp: 0 });
        expect(fireworks).not.toHaveBeenCalled();
        begin('first');
        progress('first', { 1: 'running' });
        succeed('first');
        expect(live.bursts).toBeGreaterThan(0);
        frames(30);
        begin('second');
        expect(live.bursts).toBe(0);
        progress('second', { 1: 'running' });
        succeed('second');
        expect(vi.mocked(fireworks).mock.calls).toHaveLength(1);
        frames(160);
        expect(anchors([1])).toEqual(['one']);
    });
});

describe('Navigate.Follow', () => {
    /** Load and Sample on screen, Save far off to the right. */
    const FAR: GraphSpec = { nodes: [{ pos: [100, 200], title: 'Load' }, { pos: [500, 200], title: 'Sample' }, { pos: [5000, 200], title: 'Save', output: true }] };
    const executing = (id: string) => send('executing', id);
    const pointer = (canvas: FakeCanvas, type: string, buttons: number) => canvas.canvas.dispatchEvent(Object.assign(new Event(type), { buttons }));

    it('pans to each node the run reaches off screen, keeping the zoom, at most once in 1.5 s, and never with it off or for another run', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Navigate.Follow': true }, FAR);
        frames(1);
        executing('3');
        expect(canvas.animations).toEqual([]);
        begin('follow');
        executing('2');
        expect(canvas.animations).toEqual([]);
        executing('3');
        expect(canvas.animations).toEqual([{ bounds: [...canvas.graph._nodes[2].boundingRect], duration: 350, zoom: 0 }]);
        page.now += 1000;
        executing('3');
        expect(canvas.animations).toHaveLength(1);
        page.now += 600;
        executing('3');
        expect(canvas.animations).toHaveLength(2);
        page.now += 2000;
        preview('🔗 Enhanced Links.Navigate.Follow', false);
        executing('3');
        expect(canvas.animations).toHaveLength(2);
    });

    it('pauses for 10 s when the user pans, zooms or drags, with a chip that resumes it; a pointer moving with no button pressed is no pan', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Navigate.Follow': true }, FAR);
        frames(1);
        begin('paused');
        pointer(canvas, 'pointermove', 0);
        expect(document.querySelector('.eln-chipbar')).toBeNull();
        pointer(canvas, 'pointermove', 1);
        const chip = document.querySelector('.graph-canvas-panel > .eln-chipbar')!;
        expect([chip.textContent, chip.getAttribute('role')]).toEqual(['Following pausedResume', 'status']);
        executing('3');
        expect(canvas.animations).toEqual([]);
        page.now += 9000;
        canvas.canvas.dispatchEvent(new Event('wheel'));
        // Going on pauses it again with the chip again, so that the chip shows as long as the pause, once a second at most.
        const again = document.querySelector('.eln-chipbar');
        expect([again === chip, again?.textContent]).toEqual([false, 'Following pausedResume']);
        pointer(canvas, 'pointermove', 1);
        expect(document.querySelector('.eln-chipbar')).toBe(again);
        page.now += 9000;
        executing('3');
        expect(canvas.animations).toEqual([]);
        // Resume follows at once.
        progress('paused', { 3: 'running' });
        [...document.querySelectorAll<HTMLElement>('.eln-chipbar button')].find((b) => b.textContent === 'Resume')!.click();
        expect(canvas.animations).toHaveLength(1);
        page.now += 2000;
        canvas.ds.offset[0] = -4700;
        canvas.setDirty(true, true);
        frames(1);
        executing('3');
        // On screen now, so no pan.
        expect(canvas.animations).toHaveLength(1);
    });
});
