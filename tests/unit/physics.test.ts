/**
 * Physics wires (src/links/physics.ts) and how the link pass lays its segments
 * along them (src/links/pipeline.ts): a wire comes on screen at rest, sagging,
 * pinned at its ends and leaving and entering along the slot directions; it
 * wakes once an end moves and sleeps once it keeps still, the ticker stepping
 * it meanwhile and stopping after; held still, it comes to rest at once; it
 * stays finite through fast moves, long links and Amount 2, and is forgotten
 * once long unlaid. Everything draws along the wire, the hit data follows it,
 * Animation None draws native's body along it, and Amount 0 keeps native's path.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { HELD, adaptive, live, steps } from '@/core/engine';
import { preview } from '@/core/settings';
import { LinkPath } from '@/links/geometry';
import { Wire, endWires, hang, rest, startWires, stepWires, wireOf } from '@/links/physics';
import { fake } from '../helpers/fake-app';
import { mulberry32 } from '../helpers/rng';
import { type FakeCanvas, frames, page, send, start, type GraphSpec } from '../helpers/fake-litegraph';

const [LEFT, RIGHT, SPLINE] = [3, 4, 2];
const PROFILE = '🔗 Enhanced Links.Physics.Profile';
const AMOUNT = '🔗 Enhanced Links.Physics.Amount';
const ANIMATE = '🔗 Enhanced Links.Animate';
const ROPE = { [PROFILE]: 'rope', [ANIMATE]: 0 };

/** Two nodes on screen and a link from (311, 214) to (610, 214), new for each test, which moves its nodes. */
const pair = (): GraphSpec => ({ nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1 }] });
/** The pair's link through a reroute at (460, 330), and a floating link from the first node to a reroute at (300, 420). */
const REROUTED: GraphSpec = {
    nodes: [{ pos: [100, 200] }, { pos: [600, 200] }],
    links: [{ from: 0, to: 1, reroutes: [[460, 330]] }, { from: 0, to: 1, reroutes: [[300, 420]], floating: true }],
};

const graph = { id: 'a' };
const here = new Float64Array(4);

/** Native's spline from a to b, as a link pass hands it to a wire. */
function native(a: [number, number], b: [number, number]): LinkPath {
    const path = new LinkPath();
    path.set(a, b, RIGHT, LEFT, SPLINE);
    return path;
}

/** One link pass that hangs `wire` from native's path from a to b, held still if `held`. */
function pass(wire: Wire, a: [number, number], b: [number, number], held = false): LinkPath {
    const path = native(a, b);
    startWires(graph, held);
    hang(wire, path);
    endWires();
    return path;
}

/** The points a path runs through, every px along it to its end. */
function points(path: LinkPath): [number, number][] {
    const out: [number, number][] = [];
    for (let d = 0; d < path.length + 1; d++) {
        path.find(d, here);
        out.push([here[0], here[1]]);
    }
    return out;
}

const lowest = (path: LinkPath) => Math.max(...points(path).map(([, y]) => y));
/** How far apart two paths are at most, px by px along each. */
function apart(a: LinkPath, b: LinkPath): number {
    const other = points(b);
    return Math.max(...points(a).map(([x, y], i) => Math.hypot(x - other[Math.min(i, other.length - 1)][0], y - other[Math.min(i, other.length - 1)][1])));
}

/** The points of a hit path the recorder made. */
const hitPoints = (path: unknown) => (path as { ops: string[] }).ops.map((op) => op.slice(op.indexOf('(') + 1, -1).split(', ').map(Number));

afterEach(() => {
    vi.restoreAllMocks();
    adaptive.level = 0;
    preview(PROFILE, 'off');
    preview(AMOUNT, 1);
});

describe('a wire', () => {
    it('comes on screen at rest, sagging, pinned at its ends and leaving and entering along the slot directions', () => {
        for (const profile of ['rope', 'whip', 'gel']) {
            preview(PROFILE, profile);
            const path = pass(new Wire(), [100, 100], [400, 100]);
            expect(live.wires, profile).toBe(0);
            expect([...path.a, ...path.b]).toEqual([100, 100, 400, 100]);
            const ends = points(path);
            expect(ends[0], profile).toEqual([100, 100]);
            expect(ends.at(-1)![0], profile).toBeCloseTo(400, 6);
            expect(lowest(path), profile).toBeGreaterThan(115);
            // Within 6° of the slots' direction, along their first and last px.
            for (const d of [0, path.length]) {
                path.find(d, here);
                expect(here[2], profile).toBeGreaterThan(0.99);
                expect(Math.abs(here[3]), profile).toBeLessThan(0.1);
            }
        }
    });

    it('rests in the same shape every time, sagging more with Amount, rope most and gel more again', () => {
        const sag: Record<string, number[]> = {};
        for (const profile of ['rope', 'whip', 'gel']) {
            preview(PROFILE, profile);
            sag[profile] = [0.6, 1, 2].map((amount) => {
                preview(AMOUNT, amount);
                const first = native([100, 100], [500, 160]);
                const again = native([100, 100], [500, 160]);
                rest(new Wire(), first);
                rest(new Wire(), again);
                expect(points(again)).toEqual(points(first));
                return lowest(first) - 160;
            });
            expect(sag[profile][0], profile).toBeLessThan(sag[profile][1]);
            expect(sag[profile][1], profile).toBeLessThan(sag[profile][2]);
        }
        expect(sag.whip[1]).toBeLessThan(sag.rope[1]);
        expect(sag.rope[1]).toBeLessThan(sag.gel[1]);
    });

    it('wakes once an end has moved over 0.5 px from where it came to rest, and sleeps once it keeps still for 0.3 s', () => {
        preview(PROFILE, 'rope');
        const wire = new Wire();
        pass(wire, [100, 100], [400, 100]);
        const still = points(pass(wire, [100, 100], [400.3, 100]));
        expect(live.wires).toBe(0);
        // Laid again and again without a step it does not move.
        expect(points(pass(wire, [100, 100], [400.3, 100]))).toEqual(still);
        pass(wire, [100, 100], [400.6, 100]);
        expect(live.wires).toBe(1);
        pass(wire, [100, 100], [520, 180]);
        // Awake, it moves only in the ticker's steps, not as it is laid.
        const laid = [...wire.p];
        pass(wire, [100, 100], [520, 180]);
        expect([...wire.p]).toEqual(laid);
        let steps = 0;
        for (; live.wires && steps < 600; steps++) {
            stepWires(1 / 60);
            pass(wire, [100, 100], [520, 180]);
        }
        expect(steps / 60).toBeGreaterThan(0.5);
        expect(steps / 60).toBeLessThan(3);
        // At rest where a wire laid there anew rests.
        const anew = native([100, 100], [520, 180]);
        rest(new Wire(), anew);
        expect(apart(pass(wire, [100, 100], [520, 180]), anew)).toBeLessThan(1.5);
    });

    it('steps at most four times a tick, however long the tick', () => {
        preview(PROFILE, 'gel');
        /** A wire woken by a move, then stepped by ticks `dt` s long. */
        const after = (...dts: number[]) => {
            const wire = new Wire();
            pass(wire, [100, 100], [400, 100]);
            pass(wire, [100, 100], [500, 200]);
            for (const dt of dts) stepWires(dt);
            return [...wire.p];
        };
        const four = after(1 / 60, 1 / 60, 1 / 60, 1 / 60);
        expect(after(1)).toEqual(four);
        expect(after(1 / 60, 1 / 60, 1 / 60)).not.toEqual(four);
    });

    it('stays finite and near its ends through fast moves of an end, on a very long link and at Amount 2', () => {
        const random = mulberry32(9);
        for (const profile of ['rope', 'whip', 'gel']) {
            preview(PROFILE, profile);
            preview(AMOUNT, 2);
            for (const far of [400, 6000]) {
                const wire = new Wire();
                let b: [number, number] = [100 + far, 100];
                pass(wire, [100, 100], b);
                for (let i = 0; i < 200; i++) {
                    b = [100 + far + (random() - 0.5) * 3000, 100 + (random() - 0.5) * 3000];
                    const path = pass(wire, [100, 100], b);
                    stepWires(1 / 15);
                    const reach = path.length * 1.5 + 100;
                    for (let j = 0; j < 2 * wire.n; j++) expect(Number.isFinite(wire.p[j]), `${profile} ${far}`).toBe(true);
                    for (let j = 0; j < wire.n; j++) {
                        const [x, y] = [wire.p[2 * j], wire.p[2 * j + 1]];
                        expect(Math.min(Math.hypot(x - 100, y - 100), Math.hypot(x - b[0], y - b[1])), `${profile} ${far}`).toBeLessThan(reach);
                    }
                }
                // And it comes to rest.
                for (let i = 0; i < 1200 && live.wires; i++) {
                    stepWires(1 / 60);
                    pass(wire, [100, 100], b);
                }
                expect(live.wires, `${profile} ${far}`).toBe(0);
            }
        }
    });

    it('follows an end that drops 3000 px at once down to where it comes to rest, and no further', () => {
        const deepest = (wire: Wire) => Math.max(...Array.from({ length: wire.n }, (_, j) => wire.p[2 * j + 1]));
        for (const profile of ['rope', 'whip', 'gel']) {
            preview(PROFILE, profile);
            const anew = new Wire();
            rest(anew, native([100, 100], [400, 3100]));
            const wire = new Wire();
            pass(wire, [100, 100], [400, 100]);
            let low = -Infinity;
            for (let i = 0; i < 600; i++) {
                pass(wire, [100, 100], [400, 3100]);
                stepWires(1 / 60);
                low = Math.max(low, deepest(wire));
            }
            expect(low - deepest(anew), profile).toBeLessThan(20);
        }
    });

    it('comes to rest at once while held still, without a step', () => {
        preview(PROFILE, 'rope');
        const wire = new Wire();
        pass(wire, [100, 100], [400, 100]);
        const path = pass(wire, [100, 100], [520, 220], true);
        expect(live.wires).toBe(0);
        const anew = native([100, 100], [520, 220]);
        rest(new Wire(), anew);
        expect(apart(path, anew)).toBeLessThan(1.5);
        // One that swings comes to rest at once too.
        pass(wire, [100, 100], [300, 50]);
        stepWires(1 / 60);
        expect(live.wires).toBe(1);
        pass(wire, [100, 100], [300, 50], true);
        expect(live.wires).toBe(0);
    });

    it('comes to rest at once while held still after a jump of any size, gel too, and keeps still once let go', () => {
        // An input 400 px up, a link 300 px shorter, a long link much shorter and higher, and 1000 px longer.
        const jumps: [number, number][][] = [[[500, 500], [500, 100]], [[800, 100], [500, 100]], [[1500, 700], [700, 220]], [[500, 100], [1500, 100]]];
        for (const profile of ['rope', 'whip', 'gel']) {
            preview(PROFILE, profile);
            for (const [from, to] of jumps) {
                const wire = new Wire();
                pass(wire, [100, 100], from, true);
                const path = pass(wire, [100, 100], to, true);
                const anew = native([100, 100], to);
                rest(new Wire(), anew);
                expect(apart(path, anew), `${profile} ${from} ${to}`).toBeLessThan(1.5);
                expect(points(pass(wire, [100, 100], to)), `${profile} ${from} ${to}`).toEqual(points(path));
                expect(live.wires).toBe(0);
            }
        }
    });

    it('keeps swinging through two passes that leave it out, as MagnifyGlass draws its lens in, and comes back at rest after three', () => {
        preview(PROFILE, 'rope');
        for (const missed of [2, 3]) {
            const wire = new Wire();
            pass(wire, [100, 100], [400, 100]);
            pass(wire, [100, 100], [500, 250]);
            stepWires(1 / 60);
            for (let i = 0; i < missed; i++) {
                startWires(graph, false);
                endWires();
            }
            pass(wire, [100, 100], [500, 250]);
            expect(live.wires, String(missed)).toBe(missed === 2 ? 1 : 0);
        }
    });

    it('is forgotten 120 passes after it was last laid, and laid once a pass', () => {
        preview(PROFILE, 'rope');
        startWires(graph, false);
        const wire = wireOf(7)!;
        hang(wire, native([100, 100], [400, 100]));
        // A second segment with its key in a pass, as 1.57.1's hidden-link badge, takes none.
        expect(wireOf(7)).toBeUndefined();
        endWires();
        for (let i = 0; i < 120; i++) {
            startWires(graph, false);
            endWires();
        }
        startWires(graph, false);
        expect(wireOf(7)).toBe(wire);
        endWires();
        startWires(graph, false);
        expect(wireOf(7)).not.toBe(wire);
        endWires();
    });

    it('starts afresh at rest in another graph, whose links are numbered on their own', () => {
        preview(PROFILE, 'rope');
        const wire = new Wire();
        pass(wire, [100, 100], [400, 100]);
        startWires({ id: 'a' }, false);
        const path = native([100, 100], [400, 300]);
        hang(wire, path);
        endWires();
        expect(live.wires).toBe(0);
        const anew = native([100, 100], [400, 300]);
        rest(new Wire(), anew);
        expect(points(path)).toEqual(points(anew));
    });

    it('starts afresh at rest when another workflow is loaded into the same graph, and swings through an undo, which keeps its id', () => {
        preview(PROFILE, 'rope');
        const root = { id: 'a' };
        for (const id of ['b', 'a']) {
            const wire = new Wire();
            root.id = 'a';
            startWires(root, false);
            hang(wire, native([100, 100], [400, 100]));
            endWires();
            root.id = id;
            startWires(root, false);
            const path = native([100, 100], [400, 300]);
            hang(wire, path);
            endWires();
            expect(live.wires, id).toBe(id === 'a' ? 1 : 0);
            if (id === 'a') continue;
            const anew = native([100, 100], [400, 300]);
            rest(new Wire(), anew);
            expect(points(path)).toEqual(points(anew));
        }
    });
});

describe('the link pass with wire physics', () => {
    /** The stroke paints of the next background pass. */
    function background(canvas: FakeCanvas) {
        const from = canvas.back.paints.length;
        canvas.setDirty(true, true);
        frames(1);
        return canvas.back.paints.slice(from).filter((p) => p.op === 'stroke');
    }

    it('lays every segment along its wire whatever the shape or render mode, and hands it the hit data', async () => {
        for (const [style, mode] of [['stepped', 2], ['zigzag', 2], ['spline', 1], ['spline', 0]] as const) {
            const canvas = await start({ [PROFILE]: 'rope', '🔗 Enhanced Links.Link.Style': style }, REROUTED);
            canvas.links_render_mode = mode;
            canvas.setDirty(true, true);
            frames(1);
            const reroute = canvas.graph.reroutes.get(1)!;
            const link = canvas.graph.links[1];
            for (const [owner, [a, b]] of [[reroute, [[311, 214], [460, 330]]], [link, [[460, 330], [610, 214]]]] as const) {
                const hit = hitPoints(owner.path);
                // From slot or reroute to reroute or slot, through the wire's curve, below the straight line between.
                expect(hit[0], `${style} ${mode}`).toEqual(a);
                expect(Math.hypot(hit.at(-1)![0] - b[0], hit.at(-1)![1] - b[1]), `${style} ${mode}`).toBeLessThan(0.01);
                expect(hit.length, `${style} ${mode}`).toBeGreaterThan(40);
                const [cx, cy] = owner._pos;
                expect(cy, `${style} ${mode}`).toBeGreaterThan(a[1] + ((b[1] - a[1]) * (cx - a[0])) / (b[0] - a[0]) + 5);
                // The centre is on the curve.
                expect(Math.min(...hit.map(([x, y]) => Math.hypot(x - cx, y - cy))), `${style} ${mode}`).toBeLessThan(2);
            }
        }
    });

    it("keeps native's path at Amount 0, as with physics off", async () => {
        for (const settings of [{ [PROFILE]: 'rope', [AMOUNT]: 0 }, { [PROFILE]: 'off' }]) {
            const canvas = await start(settings, pair());
            const native = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
            frames(1);
            const link = canvas.graph.links[1];
            // The fake's native renderer keeps the middle of the segment's ends and no path.
            expect([link.path, link._pos]).toEqual([undefined, [460.5, 214]]);
            expect(native).toHaveBeenCalledTimes(1);
        }
    });

    it('leaves links to native, without wires, zoomed out below 0.25 and while Coexist steps aside', async () => {
        for (const [settings, scale] of [[{ [PROFILE]: 'rope' }, 0.2], [{ [PROFILE]: 'rope', '🔗 Enhanced Links.Coexist': 'defer' }, 1]] as const) {
            const canvas = await start(settings, pair());
            canvas.ds.scale = scale;
            const native = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
            frames(1);
            expect(canvas.graph.links[1].path).toBeUndefined();
            expect(native.mock.calls[0][0]).toBe(canvas.bgctx);
        }
    });

    it('draws the body native would along the wire with Animation None: a border 4 px wider, then the link in its colour, white while selected', async () => {
        const canvas = await start(ROPE, pair());
        const renderLink = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect');
        canvas.connections_width = 4;
        const strokes = background(canvas);
        expect(strokes.map((p) => [p.style, p.lineWidth])).toEqual([['rgba(0, 0, 0, 0.5)', 8], ['#99aa99', 4]]);
        // Native draws it where nobody sees it.
        expect(renderLink.mock.calls[0][0].canvas.width).toBe(1);
        // Along the wire, below the straight line between the slots.
        expect(strokes[1].box![3]).toBeGreaterThan(240);
        canvas.highlighted_links[1] = true;
        expect(background(canvas).map((p) => [p.style, p.lineWidth])).toEqual([['rgba(0, 0, 0, 0.5)', 8], ['#ffffff', 4]]);
        canvas.low_quality = true;
        expect(background(canvas).map((p) => p.style)).toEqual(['#ffffff']);
        // Nothing moves: the ticker stays off.
        frames(2);
        expect(page.waiting).toHaveLength(0);
    });

    it('hangs floating links too, drawn as native draws them, at the alpha native gives them', async () => {
        const canvas = await start(ROPE, REROUTED);
        const strokes = background(canvas);
        const floating = strokes.filter((p) => p.globalAlpha < 1);
        expect(floating.map((p) => [p.style, p.globalAlpha])).toEqual([['rgba(0, 0, 0, 0.5)', 0.33], ['#99aa99', 0.33]]);
        expect(hitPoints(canvas.graph.reroutes.get(2)!.path).length).toBeGreaterThan(40);
    });

    it('hangs a floating link into an input apart from the link whose number it shares, as 1.39.5 numbers floating links on their own', async () => {
        const canvas = await start(ROPE, { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1 }, { from: 0, to: 1, reroutes: [[400, 420]], floating: 'input', id: 1 }] });
        frames(1);
        for (const link of [canvas.graph.links[1], canvas.graph.floatingLinks.get(1)!]) {
            const hit = hitPoints(link.path);
            const [[ax, ay], [bx, by]] = [hit[0], hit.at(-1)!];
            const [cx, cy] = link._pos;
            expect(cy, String(hit[0])).toBeGreaterThan(ay + ((by - ay) * (cx - ax)) / (bx - ax) + 5);
        }
    });

    it('swings a wire whose node moves, stepping it in the ticker and redrawing the background each frame until it sleeps, then stops', async () => {
        const canvas = await start({ ...ROPE, '🔗 Enhanced Links.Perf.MaxFps': 60 }, pair());
        const step = vi.spyOn(steps, 'wires');
        frames(2);
        expect([page.waiting.length, live.wires]).toEqual([0, 0]);
        const before = hitPoints(canvas.graph.links[1].path);
        canvas.graph._nodes[1].pos[1] += 120;
        canvas.setDirty(true, true);
        frames(1);
        expect(live.wires).toBe(1);
        const backs: number[] = [];
        let count = 0;
        for (; page.waiting.length && count < 300; count++) {
            const from = canvas.back.paints.length;
            frames(1);
            backs.push(canvas.back.paints.length - from);
        }
        expect(step).toHaveBeenCalled();
        expect(count / 60).toBeLessThan(3);
        // A background pass each frame while it swung.
        // From the frame after the one that woke the ticker.
        expect(backs.slice(1, -1).every((n) => n > 0)).toBe(true);
        expect(hitPoints(canvas.graph.links[1].path)).not.toEqual(before);
        const paints = canvas.front.paints.length + canvas.back.paints.length;
        frames(60);
        expect(canvas.front.paints.length + canvas.back.paints.length).toBe(paints);
    });

    it('draws the links focus dims along their wires, as native would at Focus.Dim, and the stubs of those it hides', async () => {
        // Link 1 from A to B, link 2 from C to D, which selecting A leaves out.
        const spec: GraphSpec = { nodes: [{ pos: [100, 100] }, { pos: [600, 100] }, { pos: [100, 400] }, { pos: [600, 400] }], links: [{ from: 0, to: 1 }, { from: 2, to: 3 }] };
        const below = (p: { box?: number[] }) => p.box![3] > 430;
        let canvas = await start({ ...ROPE, '🔗 Enhanced Links.Focus.Mode': 'dim' }, spec);
        canvas.selectItems([canvas.graph._nodes[0]]);
        const dimmed = background(canvas).filter((p) => p.box![1] > 300);
        expect(dimmed.map((p) => [p.style, p.globalAlpha])).toEqual([['rgba(0, 0, 0, 0.5)', 0.2], ['#99aa99', 0.2]]);
        expect(dimmed.every(below)).toBe(true);
        expect(hitPoints(canvas.graph.links[2].path).length).toBeGreaterThan(40);
        canvas = await start({ ...ROPE, '🔗 Enhanced Links.Focus.Mode': 'hide' }, spec);
        canvas.selectItems([canvas.graph._nodes[0]]);
        const from = canvas.back.lines.length;
        background(canvas);
        const lines = canvas.back.lines.slice(from);
        // The stubs at both slots run along the wire, in 2 px steps.
        const stub = lines.slice(lines.lastIndexOf('beginPath()'), lines.indexOf('stroke()', lines.lastIndexOf('beginPath()')));
        expect(stub.filter((line) => line.startsWith('lineTo(')).length).toBeGreaterThan(14);
        expect(canvas.graph.links[2]._pos.every(Number.isNaN)).toBe(true);
    });

    for (const why of ['Static mode', 'reduced motion', 'Adaptive quality at its last step', 'more segments on screen than Perf.StaticAbove']) {
        it(`rests a wire whose node moves at once, without a step, with ${why}`, async () => {
            // The pair's one segment is more than Perf.StaticAbove at 0.5.
            const canvas = await start({ ...ROPE, '🔗 Enhanced Links.Static.Mode': why === 'Static mode', ...(why.endsWith('StaticAbove') && { '🔗 Enhanced Links.Perf.StaticAbove': 0.5 }) }, pair());
            if (why === 'reduced motion') {
                fake.reducedMotion.matches = true;
                fake.reducedMotion.dispatchEvent(new Event('change'));
            }
            if (why.startsWith('Adaptive')) adaptive.level = HELD;
            const step = vi.spyOn(steps, 'wires');
            frames(2);
            canvas.graph._nodes[1].pos[1] += 120;
            canvas.setDirty(true, true);
            frames(3);
            expect([live.wires, page.waiting.length]).toEqual([0, 0]);
            expect(step).not.toHaveBeenCalled();
            const hit = hitPoints(canvas.graph.links[1].path);
            const anew = native([311, 214], [610, 334]);
            rest(new Wire(), anew);
            const [x, y] = canvas.graph.links[1]._pos;
            expect(Math.hypot(x - anew.cx, y - anew.cy)).toBeLessThan(1.5);
            expect(hit.at(-1)).toEqual([610, 334]);
        });
    }

    it('swings a wire whose node moves through a run whose Pause.Mode holds the links still, as only your drags move it', async () => {
        for (const mode of ['pause', 'spotlight']) {
            const canvas = await start({ ...ROPE, '🔗 Enhanced Links.Pause.Mode': mode }, pair());
            send('execution_start', { prompt_id: 'run', timestamp: 0 });
            const step = vi.spyOn(steps, 'wires');
            frames(2);
            canvas.graph._nodes[1].pos[1] += 120;
            canvas.setDirty(true, true);
            frames(4);
            expect(live.wires, mode).toBe(1);
            expect(step, mode).toHaveBeenCalled();
            step.mockRestore();
        }
    });
});
