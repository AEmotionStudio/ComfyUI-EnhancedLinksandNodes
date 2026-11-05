/**
 * Connection assist (fx/assist.ts): while a link is dragged it finds the slot
 * the link can go to, the nearest valid one within 200 px on screen, a
 * subgraph's input or output node's too, or what native snaps to, and draws
 * the guide line, the gloves, the slot's reaching out on its arm, which clasp
 * within 120 px, upright, with a burst of light, and keep their thumbs on one
 * side about the vertical, and the eyes over it, which smile at the clasp; it
 * draws nothing once the
 * drag ends or the link is dropped on the canvas, and asks for one paint to
 * clear it then, holds still with reduced motion, keeps the ticker going only
 * while something of it moves, and reads no settings as it does.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { MAX_FLASH_HZ, clock, layers, live } from '@/core/engine';
import { fake } from '../helpers/fake-app';
import { frames, page, start, type FakeCanvas, type FakeNode } from '../helpers/fake-litegraph';
import { CanvasRecorder } from '../helpers/recording-context';

type Point = [number, number];

const MODE = '🔗 Enhanced Links.Assist.Mode';
const WHITE = '#fdfdfd';

afterEach(() => {
    vi.restoreAllMocks();
});

/**
 * The source at (100, 100) with an IMAGE output and an IMAGE input of its own; to its right a node with an INT input
 * at (410, 114) and an IMAGE one at (410, 134) and an INT output at (611, 114); below it one with an IMAGE input at
 * (410, 414) and an IMAGE output at (611, 414); and far right one with an IMAGE output at (911, 114). Nodes are
 * 220 × 120 under a 30 px title.
 */
async function scene(mode: string, settings: Record<string, unknown> = {}): Promise<{ canvas: FakeCanvas; nodes: FakeNode[] }> {
    const canvas = await start({ '🔗 Enhanced Links.Animate': 0, [MODE]: mode, ...settings }, {
        nodes: [{ pos: [100, 100] }, { pos: [400, 100] }, { pos: [400, 400] }, { pos: [700, 100] }],
    });
    const nodes = canvas.graph._nodes;
    const slot = (type: string) => ({ name: type, link: null, type });
    nodes[0].inputs = [slot('IMAGE')];
    nodes[0].outputs = [{ name: 'out', links: [], type: 'IMAGE' }];
    nodes[1].inputs = [slot('INT'), slot('IMAGE')];
    nodes[1].outputs = [{ name: 'out', links: [], type: 'INT' }];
    nodes[2].inputs = [slot('IMAGE')];
    nodes[2].outputs = [{ name: 'out', links: [], type: 'IMAGE' }];
    nodes[3].outputs = [{ name: 'out', links: [], type: 'IMAGE' }];
    frames(1);
    return { canvas, nodes };
}

/** Starts dragging a new link from `node`'s output, or with `input` from its first input, the end at `at`. */
function drag(canvas: FakeCanvas, node: FakeNode, at: Point, input = false): void {
    const { linkConnector } = canvas;
    linkConnector.isConnecting = true;
    linkConnector.state.connectingTo = input ? 'output' : 'input';
    linkConnector.renderLinks.splice(0, Infinity, input
        ? { node, fromSlot: node.inputs[0] as { type: string }, fromPos: node.getInputPos(0) }
        : { node, fromSlot: node.outputs[0] as { type: string }, fromPos: node.getOutputPos(0) });
    canvas.graph_mouse = at;
    canvas.setDirty(true);
}

/** Ends the drag, as LinkConnector.reset does: it tells its listeners, then clears its state, and asks for no paint. */
function drop(canvas: FakeCanvas): void {
    const { linkConnector } = canvas;
    linkConnector.events.dispatchEvent(new Event('reset'));
    linkConnector.isConnecting = false;
    linkConnector.state.connectingTo = linkConnector.state.snapLinksPos = undefined;
    linkConnector.renderLinks.length = 0;
    canvas._highlight_pos = undefined;
}

/** What assist draws over `canvas` now, alone, `t` s on clock.assistTime from its last draw. */
function drawn(canvas: FakeCanvas, t = 0): CanvasRecorder {
    clock.assistTime += t;
    const rec = new CanvasRecorder();
    layers.assist!(canvas as never, rec.ctx);
    return rec;
}

const middle = (box: number[]): Point => [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2];

/** Where the guide line's ring is: the middle of its last stroke. */
function ring(rec: CanvasRecorder): Point | undefined {
    const box = rec.paints.filter((p) => p.op === 'stroke').at(-1)?.box;
    return box && middle(box);
}

/** Where each glove, the clasp or the guide line is placed, in order: each translate. */
function gloves(rec: CanvasRecorder): Point[] {
    return rec.lines.flatMap((line) => {
        const m = /^translate\((\S+), (\S+)\)$/.exec(line);
        return m ? [[Number(m[1]), Number(m[2])] as Point] : [];
    });
}

/** The middle of each eye's white, not of its pupil's glint or the light from the clasp. */
const eyes = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && p.style === WHITE && p.composite !== 'lighter' && p.box && p.box[2] - p.box[0] > 10).map((p) => middle(p.box!));

/** How open each eye is: its white's height over its width. */
const open = (rec: CanvasRecorder) => rec.lines.flatMap((line) => {
    const m = /^ellipse\(\S+, \S+, (\S+), (\S+),/.exec(line);
    return m ? [Number(m[2]) / Number(m[1])] : [];
});

describe('the candidate', () => {
    it('is the nearest slot within 200 px on screen that the link can connect to: an input of its type from an output', async () => {
        const { canvas, nodes } = await scene('line');
        // The INT input at (410, 114) is nearer, but takes no IMAGE.
        drag(canvas, nodes[0], [360, 110]);
        expect(ring(drawn(canvas))).toEqual([410, 134]);
        drag(canvas, nodes[0], [400, 320]);
        expect(ring(drawn(canvas))).toEqual([410, 414]);
        // 201 px from the nearest, and nearer the source's own IMAGE input, which the link cannot take.
        drag(canvas, nodes[0], [209, 134]);
        expect(ring(drawn(canvas))).toBeUndefined();
        drag(canvas, nodes[0], [211, 134]);
        expect(ring(drawn(canvas))).toEqual([410, 134]);
    });

    it('is an output from an input, never one of the node dragged from', async () => {
        const { canvas, nodes } = await scene('line');
        // From the lower node's IMAGE input: its own IMAGE output is 16 px off, the far right one out of reach.
        drag(canvas, nodes[2], [620, 400], true);
        expect(ring(drawn(canvas))).toBeUndefined();
        // The INT output at (611, 114) is nearer, but gives no IMAGE.
        drag(canvas, nodes[2], [780, 114], true);
        expect(ring(drawn(canvas))).toEqual([911, 114]);
    });

    it('is 200 px on screen at any zoom', async () => {
        const { canvas, nodes } = await scene('line');
        canvas.ds.scale = 2;
        frames(1);
        drag(canvas, nodes[0], [309, 134]);
        expect(ring(drawn(canvas))).toBeUndefined();
        drag(canvas, nodes[0], [311, 134]);
        expect(ring(drawn(canvas))).toEqual([410, 134]);
    });

    it("is what native snaps to: a slot held under the pointer, a reroute, or the slot Nodes 2.0 holds the end on", async () => {
        const { canvas, nodes } = await scene('line');
        // Native holds the end on the lower IMAGE input while the pointer is nearer the upper one.
        drag(canvas, nodes[0], [400, 134]);
        canvas._highlight_pos = [410, 414];
        let rec = drawn(canvas);
        expect(ring(rec)).toEqual([410, 414]);
        // The line starts at the held end.
        expect(gloves(rec)[0]).toEqual([410, 414]);
        canvas._highlight_pos = [600, 600];
        expect(ring(drawn(canvas))).toEqual([600, 600]);
        canvas._highlight_pos = undefined;
        canvas.linkConnector.state.snapLinksPos = [410, 414];
        expect(ring(drawn(canvas))).toEqual([410, 414]);
        // Nodes 2.0 holds it at the pointer where nothing takes it.
        canvas.linkConnector.state.snapLinksPos = [380, 120];
        expect(ring(drawn(canvas))).toEqual([410, 134]);
    });

    it("is a slot just out of its node's box, where Nodes 2.0 puts its dot", async () => {
        const { canvas, nodes } = await scene('line');
        // The upper node's IMAGE input 8 px left of its box, 193 px from the end, which is 201 px from the box.
        nodes[1].getInputPos = (i) => [392, 114 + 20 * i];
        drag(canvas, nodes[0], [199, 134]);
        expect(ring(drawn(canvas))).toEqual([392, 134]);
    });

    it("is a slot of a subgraph's output node from an output, of its input node from an input, empty ones too, never from one to the other", async () => {
        const { canvas, nodes } = await scene('line');
        const io = (x: number, types: string[]) => ({
            boundingRect: [x, 100, 80, 200],
            slots: types.map((type, i) => ({ type, pos: [x + 10, 120 + 20 * i] })),
            emptySlot: { type: '', pos: [x + 10, 120 + 20 * types.length] },
        });
        const subgraph = { inputNode: io(-200, ['IMAGE']), outputNode: io(1000, ['INT', 'IMAGE']) };
        Object.assign(canvas, { subgraph });
        // The INT output at (1010, 120) is nearer, but takes no IMAGE.
        drag(canvas, nodes[0], [1000, 120]);
        expect(ring(drawn(canvas))).toEqual([1010, 140]);
        canvas.graph_mouse = [1000, 175];
        expect(ring(drawn(canvas))).toEqual([1010, 160]);
        drag(canvas, nodes[2], [-150, 120], true);
        expect(ring(drawn(canvas))).toEqual([-190, 120]);
        canvas.linkConnector.state.connectingTo = 'input';
        canvas.linkConnector.renderLinks.splice(0, 1, { node: subgraph.inputNode, fromSlot: subgraph.inputNode.slots[0], fromPos: [-190, 120] });
        canvas.graph_mouse = [1000, 140];
        expect(ring(drawn(canvas))).toBeUndefined();
    });
});

describe('the gloves', () => {
    it('reach from the end and the slot, clasp within 120 px, the end\'s cuff at the end, and the end\'s glove waits at the end with nothing in reach', async () => {
        const { canvas, nodes } = await scene('hands');
        drag(canvas, nodes[0], [270, 134]);
        expect(gloves(drawn(canvas))).toEqual([[270, 134], [410, 134]]);
        // 110 px off, the clasp's middle 26.7 px on from the end once it has popped in; 40 px off, halfway.
        drag(canvas, nodes[0], [300, 134]);
        drawn(canvas);
        expect(gloves(drawn(canvas, 0.2))).toEqual([[326.7, 134]]);
        drag(canvas, nodes[0], [370, 134]);
        expect(gloves(drawn(canvas))).toEqual([[390, 134]]);
        canvas._highlight_pos = [410, 134];
        expect(gloves(drawn(canvas))).toEqual([[410, 134]]);
        canvas._highlight_pos = undefined;
        drag(canvas, nodes[0], [200, 300]);
        expect(gloves(drawn(canvas))).toEqual([[200, 300]]);
    });

    it('reach from the pointer for the slot native would snap to while links do not snap to slots', async () => {
        const { canvas, nodes } = await scene('hands');
        LiteGraph.snaps_for_comfy = false;
        drag(canvas, nodes[0], [550, 140]);
        canvas._highlight_pos = [410, 134];
        expect(gloves(drawn(canvas))).toEqual([[550, 140], [410, 134]]);
    });

    it("stay right hands whichever way the drag heads: turned, never mirrored but for the slot's palm", async () => {
        const { canvas, nodes } = await scene('hands');
        /** Whether each glove is mirrored. */
        const flips = () => drawn(canvas).lines.filter((line) => line.startsWith('scale(')).map((line) => line.includes(', -'));
        // Reaching from the left, then above, below and to the right of the slot, and with nothing in reach.
        for (const at of [[270, 134], [409, 290], [409, 10], [560, 134]] as Point[]) {
            drag(canvas, nodes[0], at);
            expect(flips(), String(at)).toEqual([false, true]);
        }
        drag(canvas, nodes[0], [200, 300]);
        expect(flips()).toEqual([false]);
        canvas.graph_mouse = [0, 300];
        expect(flips()).toEqual([false]);
    });

    it('keep the clasp from turning round while a drag wavers about the vertical, and upright once it heads the other way', async () => {
        const { canvas, nodes } = await scene('hands');
        const turn = () => Number(/^rotate\((\S+)\)$/.exec(drawn(canvas).lines.find((line) => line.startsWith('rotate('))!)![1]);
        // Clasped 50 px above the lower IMAGE input at (410, 414), a px either side of straight up.
        drag(canvas, nodes[0], [409, 364]);
        const first = turn();
        for (const x of [411, 409, 411, 409]) {
            canvas.graph_mouse = [x, 364];
            expect(Math.abs(turn() - first), String(x)).toBeLessThan(0.1);
        }
        // To the input's right, heading left to it, and to its left, heading right: upright, a little tilted, both.
        canvas.graph_mouse = [460, 400];
        expect(Math.cos(turn())).toBeGreaterThan(0.9);
        drag(canvas, nodes[0], [360, 400]);
        expect(Math.cos(turn())).toBeGreaterThan(0.9);
    });

    it("are right hands meeting: the end's with the stitches on its back, the slot's with the crease across its palm", async () => {
        const { canvas, nodes } = await scene('hands');
        /** Each glove's line work over its white: the stitches on a back, or the crease across a palm. */
        const sides = (rec: CanvasRecorder) => rec.lines.filter((line) => /^path\d+ = Path2D\[moveTo\(/.test(line))
            .map((line) => (line.includes('moveTo(2.5, -3.6)') ? 'back' : line.includes('quadraticCurveTo(14, -7.4, 17.5, -9.2)') ? 'palm' : line));
        drag(canvas, nodes[0], [270, 134]);
        expect(sides(drawn(canvas))).toEqual(['back', 'palm']);
        drag(canvas, nodes[0], [200, 300]);
        expect(sides(drawn(canvas))).toEqual(['back']);
    });

    it('clasp upright: heading left, the clasp turns round rather than over', async () => {
        const { canvas, nodes } = await scene('hands');
        const turns = () => drawn(canvas).lines.filter((line) => /^(rotate|scale)\(/.test(line));
        drag(canvas, nodes[0], [360, 134]);
        expect(turns()).toEqual(['rotate(0)', 'scale(1.05, 1.05)']);
        // Heading left, a half turn more: a whole one.
        drag(canvas, nodes[0], [460, 134]);
        expect(turns()).toEqual(['rotate(6.28)', 'scale(1.05, 1.05)']);
    });

    it("reach out on the slot's arm as the end nears, as far as has the fingertips meet at 120 px, and hold on to the clasp by it", async () => {
        const { canvas, nodes } = await scene('hands', { '🔗 Enhanced Links.Assist.Shine': false });
        /** The fills not in white: the cuffs and the arm. */
        const cuffs = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && p.style !== WHITE).length;
        // 160 px off, the slot's wrist is half of 48 px out; 140 px off, 84 % of it; it pops in from the slot.
        drag(canvas, nodes[0], [250, 134]);
        expect(gloves(drawn(canvas))[1]).toEqual([410, 134]);
        let rec = drawn(canvas, 0.2);
        expect([gloves(rec)[1], cuffs(rec)]).toEqual([[386, 134], 3]);
        canvas.graph_mouse = [270, 134];
        expect(gloves(drawn(canvas))[1]).toEqual([369.5, 134]);
        // Clasped 110 px off, the arm reaches the clasp's cuff; 50 px off, there is no room for it.
        drag(canvas, nodes[0], [300, 134]);
        expect(cuffs(drawn(canvas, 0.2))).toBe(2);
        drag(canvas, nodes[0], [360, 134]);
        rec = drawn(canvas, 0.2);
        expect(cuffs(rec)).toBe(1);
    });

    it('stay as large on screen at any zoom', async () => {
        const { canvas, nodes } = await scene('hands');
        const scales = () => drawn(canvas).lines.filter((line) => line.startsWith('scale('));
        drag(canvas, nodes[0], [340, 134]);
        const one = scales();
        canvas.ds.scale = 0.5;
        expect(scales()).toEqual(one.map((line) => line.replace(/[\d.]+/g, (n) => String(Number(n) * 2))));
    });

    it('pop in as a slot comes in reach, sway and blink, and with reduced motion are where they go at once and hold still', async () => {
        for (const motion of ['full', 'reduce']) {
            const { canvas, nodes } = await scene('hands-eyes', { '🔗 Enhanced Links.Motion': motion });
            drag(canvas, nodes[0], [270, 134]);
            const alphas = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && p.style === WHITE && !p.box).map((p) => p.globalAlpha);
            // The slot's glove, after the end's.
            const first = alphas(drawn(canvas));
            const later = alphas(drawn(canvas, 0.1));
            const settled = alphas(drawn(canvas, 0.2));
            if (motion === 'full') expect([first.at(-1), later.at(-1)! > 0 && later.at(-1)! < 1, settled.at(-1)]).toEqual([0, true, 1]);
            else expect([first, later]).toEqual([settled, settled]);
            drag(canvas, nodes[0], [200, 300]);
            const turns = new Set<string>();
            const lids = new Set<number>();
            for (let i = 0; i < 300; i++) {
                const rec = drawn(canvas, 0.05);
                turns.add(rec.lines.find((line) => line.startsWith('rotate('))!);
                for (const lid of open(rec)) lids.add(lid);
            }
            expect([turns.size > 1, lids.size > 1], motion).toEqual(motion === 'full' ? [true, true] : [false, false]);
        }
    });
});

describe('the eyes', () => {
    it("sit on the node dragged from all the drag, and on the candidate's node too, and look at the end", async () => {
        const { canvas, nodes } = await scene('hands-eyes');
        drag(canvas, nodes[0], [230, 320]);
        // On the middle of the source's top edge, 20 px apart, then on the node with the candidate as well.
        expect(eyes(drawn(canvas))).toEqual([[200, 70], [220, 70]]);
        drag(canvas, nodes[0], [380, 150]);
        expect(eyes(drawn(canvas))).toEqual([[200, 70], [220, 70], [500, 70], [520, 70]]);
        // Their pupils look at the end: down and right, then down and left.
        const pupils = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && p.style !== WHITE && p.box).map((p) => middle(p.box!));
        drag(canvas, nodes[0], [230, 320]);
        const [left] = pupils(drawn(canvas));
        expect([left[0] > 200, left[1] > 70]).toEqual([true, true]);
        // Held on a reroute 12 px from the upper node's IMAGE input, they stay on the source.
        drag(canvas, nodes[0], [380, 150]);
        canvas._highlight_pos = [400, 140];
        expect(eyes(drawn(canvas))).toEqual([[200, 70], [220, 70]]);
        canvas._highlight_pos = undefined;
        // Zoomed out to a half, they are twice as large in graph units and rise by an eye.
        canvas.ds.scale = 0.5;
        frames(1);
        drag(canvas, nodes[0], [100, 700]);
        expect(eyes(drawn(canvas))).toEqual([[190, 62], [230, 62]]);
    });

    it('blink at most once in 3 s, each over within a flash', async () => {
        const { canvas, nodes } = await scene('hands-eyes');
        drag(canvas, nodes[0], [300, 300]);
        let shut = false;
        const blinks: number[] = [];
        for (let i = 0; i < 1800; i++) {
            const t = i / 60;
            const closing = open(drawn(canvas, i ? 1 / 60 : 0))[0] < 0.95;
            if (closing && !shut) blinks.push(t);
            shut = closing;
        }
        expect(blinks.length).toBeGreaterThanOrEqual(6);
        const gaps = blinks.slice(1).map((t, i) => t - blinks[i]);
        expect(Math.min(...gaps)).toBeGreaterThanOrEqual(3);
        expect(blinks[0]).toBeGreaterThan(1 / MAX_FLASH_HZ);
    });

    it('smile on both nodes while the hands clasp, and look again once they let go', async () => {
        const { canvas, nodes } = await scene('hands-eyes');
        /** The eyes' smiles and blushes: the arcs in ink that are no pupils, and the fills in neither white nor ink. */
        const smiles = (rec: CanvasRecorder) => rec.lines.filter((line) => /^arc\(.*, 3\.59, 5\.83\)$/.test(line)).length;
        const blushes = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && /^rgba\(255, 110, 150/.test(p.style)).length;
        drag(canvas, nodes[0], [300, 134]);
        drawn(canvas);
        let rec = drawn(canvas, 0.2);
        expect([smiles(rec), blushes(rec), eyes(rec)]).toEqual([4, 4, [[200, 70], [220, 70], [500, 70], [520, 70]]]);
        canvas.graph_mouse = [270, 134];
        rec = drawn(canvas);
        expect([smiles(rec), blushes(rec)]).toEqual([0, 0]);
    });
});

describe('the light from the clasp', () => {
    /** The light added over the dark palette: the aura, then while it bursts the rays and the sparkles, at what alpha. */
    const light = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fill' && p.composite === 'lighter').map((p) => Math.round(p.globalAlpha * 1000) / 1000);

    it('bursts as the hands clasp and fades over 0.8 s, leaving a faint aura, and rests the ticker then', async () => {
        const { canvas, nodes } = await scene('hands');
        // Well past the last burst of the tests before, and with the hands apart first.
        drag(canvas, nodes[0], [200, 300]);
        drawn(canvas, 10);
        canvas.graph_mouse = [300, 134];
        expect(light(drawn(canvas))).toEqual([1, 1, 1]);
        expect(light(drawn(canvas, 0.4))).toEqual([1, 0.5, 0.5]);
        frames(60);
        expect([light(drawn(canvas)), live.assist, page.waiting.length]).toEqual([[1], 0, 0]);
    });

    it('bursts again no more than MAX_FLASH_HZ times a second, however fast the hands clasp and let go', async () => {
        const { canvas, nodes } = await scene('hands');
        drag(canvas, nodes[0], [300, 134]);
        drawn(canvas);
        const starts: number[] = [];
        for (let i = 0; i < 120; i++) {
            canvas.graph_mouse = i % 2 ? [300, 134] : [270, 134];
            const rays = light(drawn(canvas, 1 / 30))[1];
            if (rays === 1) starts.push(i / 30);
        }
        const gaps = starts.slice(1).map((t, i) => t - starts[i]);
        expect(starts.length).toBeGreaterThan(1);
        expect(Math.min(...gaps)).toBeGreaterThanOrEqual(1 / MAX_FLASH_HZ - 1e-9);
    });

    it('is the aura alone with reduced motion or links frozen, and none with Assist.Shine off', async () => {
        for (const [settings, expected] of [
            [{ '🔗 Enhanced Links.Motion': 'reduce' }, [1]],
            [{ '🔗 Enhanced Links.Static.Mode': true }, [1]],
            [{ '🔗 Enhanced Links.Assist.Shine': false }, []],
        ] as [Record<string, unknown>, number[]][]) {
            const { canvas, nodes } = await scene('hands', settings);
            drag(canvas, nodes[0], [300, 134]);
            expect(light(drawn(canvas)), JSON.stringify(settings)).toEqual(expected);
        }
    });
});

describe('the guide line', () => {
    it('marches toward the slot slower than MAX_FLASH_HZ, and holds still with links frozen', async () => {
        for (const frozen of [false, true]) {
            const { canvas, nodes } = await scene('line', { '🔗 Enhanced Links.Static.Mode': frozen });
            drag(canvas, nodes[0], [300, 134]);
            const offsets: number[] = [];
            let dash: number[] = [];
            for (let i = 0; i < 6; i++) {
                const rec = drawn(canvas, 0.01);
                offsets.push(Number(/^lineDashOffset = (\S+)$/.exec(rec.lines.find((line) => line.startsWith('lineDashOffset'))!)![1]));
                dash = JSON.parse(/^setLineDash\((.*)\)$/.exec(rec.lines.find((line) => line.startsWith('setLineDash('))!)![1]);
            }
            const speed = Math.abs(offsets[5] - offsets[0]) / 0.05;
            if (frozen) expect(speed).toBe(0);
            else expect(speed / (dash[0] + dash[1])).toBeLessThanOrEqual(MAX_FLASH_HZ);
        }
    });
});

describe('drawing', () => {
    it('draws nothing with assist or link effects off, without a drag, after it, or once the link is dropped on the canvas, and leaves native its state', async () => {
        const { canvas, nodes } = await scene('off');
        drag(canvas, nodes[0], [340, 134]);
        expect(drawn(canvas).lines).toEqual([]);
        const { canvas: plain, nodes: theirs } = await scene('hands-eyes', { '🔗 Enhanced Links.Enabled': false });
        drag(plain, theirs[0], [340, 134]);
        expect([drawn(plain).lines, live.assist]).toEqual([[], 0]);
        const { canvas: on, nodes: others } = await scene('hands-eyes');
        expect(drawn(on).lines).toEqual([]);
        drag(on, others[0], [340, 134]);
        on._highlight_pos = [410, 134];
        const state = JSON.stringify([on.linkConnector.state, on.graph_mouse, on._highlight_pos]);
        expect(drawn(on).lines.length).toBeGreaterThan(0);
        expect(JSON.stringify([on.linkConnector.state, on.graph_mouse, on._highlight_pos])).toBe(state);
        // The link-release search keeps the drag going natively.
        on.linkConnector.events.dispatchEvent(new Event('dropped-on-canvas'));
        expect([drawn(on).lines, live.assist]).toEqual([[], 0]);
        drag(on, others[0], [340, 134]);
        expect(drawn(on).lines.length).toBeGreaterThan(0);
        drop(on);
        expect([drawn(on).lines, live.assist]).toEqual([[], 0]);
    });

    it('keeps the ticker going only while it draws, and reads no settings', async () => {
        const { canvas, nodes } = await scene('hands-eyes');
        frames(5);
        expect(page.waiting).toHaveLength(0);
        drag(canvas, nodes[0], [340, 134]);
        frames(1);
        expect([live.assist, page.waiting.length]).toEqual([1, 1]);
        const time = clock.assistTime;
        const reads = fake.reads;
        frames(30);
        expect(fake.reads - reads).toBe(0);
        // The first tick starts the clock, the next 29 move it.
        expect(clock.assistTime - time).toBeCloseTo(29 / 60, 6);
        drop(canvas);
        frames(3);
        page.requests = 0;
        frames(60);
        expect([live.assist, page.requests]).toEqual([0, 0]);
    });

    it('rests the ticker while nothing of it moves: with reduced motion, links frozen, a guide line with nothing in reach, or the gloves popped in', async () => {
        const cases: [string, Record<string, unknown>, Point][] = [
            ['hands-eyes', { '🔗 Enhanced Links.Motion': 'reduce' }, [340, 134]],
            ['hands-eyes', { '🔗 Enhanced Links.Static.Mode': true }, [200, 300]],
            ['line', {}, [200, 300]],
            ['hands', {}, [270, 134]],
        ];
        for (const [mode, settings, at] of cases) {
            const { canvas, nodes } = await scene(mode, settings);
            drag(canvas, nodes[0], at);
            frames(1);
            // The slot's glove pops in over 0.18 s, then stays; the rest hold still from the first paint.
            if (mode === 'hands') {
                expect([live.assist, page.waiting.length]).toEqual([1, 1]);
                frames(15);
                expect(drawn(canvas).paints.filter((p) => p.op === 'fill' && p.style === WHITE).at(-1)?.globalAlpha).toBe(1);
            }
            expect([live.assist, page.waiting.length], mode).toEqual([0, 0]);
            expect(drawn(canvas).lines.length > 0, mode).toBe(mode !== 'line');
        }
    });

    it('clears what it drew with one paint as the drag ends or the link is dropped on the canvas, and asks for none with assist off', async () => {
        for (const mode of ['hands', 'off']) {
            const { canvas, nodes } = await scene(mode, { '🔗 Enhanced Links.Motion': 'reduce' });
            drag(canvas, nodes[0], [270, 134]);
            frames(1);
            drop(canvas);
            expect(canvas.dirty_canvas, mode).toBe(mode === 'hands');
            const before = canvas.front.lines.length;
            frames(1);
            expect(canvas.front.lines.slice(before), mode).not.toContain('translate(270, 134)');
            drag(canvas, nodes[0], [200, 300]);
            frames(1);
            canvas.linkConnector.events.dispatchEvent(new Event('dropped-on-canvas'));
            expect(canvas.dirty_canvas, mode).toBe(mode === 'hands');
        }
    });

    it('draws over the nodes, after everything else over them', async () => {
        const { canvas, nodes } = await scene('hands');
        drag(canvas, nodes[0], [370, 134]);
        const before = canvas.front.lines.length;
        frames(1);
        const pass = canvas.front.lines.slice(before);
        const titles = pass.reduce((last, line, i) => (line.startsWith('fillText(') ? i : last), -1);
        expect(titles).toBeGreaterThan(0);
        expect(pass.indexOf('translate(390, 134)')).toBeGreaterThan(titles);
    });
});
