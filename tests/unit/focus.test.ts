/**
 * Selection focus (src/links/focus.ts and its part of src/links/pipeline.ts) on
 * the fake LiteGraph: which links each reach holds, through native reroutes,
 * legacy Reroute nodes and groups, in a subgraph and up to its cap; that it is
 * built again only when what it is built from changes, and reads no settings;
 * Focus.Hover; and what each mode draws with link effects on and off, in the
 * focus colour, a stretch links share through a native reroute, Hide others'
 * hit data and stubs, the links drawn again over the nodes, and what Coexist
 * leaves of it.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { live } from '@/core/engine';
import { focus } from '@/links/focus';
import { app, fake } from '../helpers/fake-app';
import { FakeCanvas, FakeGroup, frames, start, type FakeNode, type GraphSpec } from '../helpers/fake-litegraph';

const FOCUS = '🔗 Enhanced Links.Focus.';
const LINKS_ON = '🔗 Enhanced Links.Enabled';
const [WHITE, LINK] = ['#ffffff', '#99aa99'];
/** The dark halo Classic Flow draws under its links and markers by default. */
const HALO = 'rgba(0, 0, 0, 0.95)';

/**
 * H → A → R → B → C → F, with R a legacy Reroute node, and D → B; B → E through a native reroute; and G → K, apart.
 * Link ids: H→A 1, A→R 2, R→B 3, D→B 4, B→C 5, B→E 6, C→F 7, G→K 8.
 */
const REACH: GraphSpec = {
    nodes: [
        { pos: [0, 0], title: 'H' }, { pos: [250, 0], title: 'A' }, { pos: [500, 0], title: 'R', type: 'Reroute' }, { pos: [750, 0], title: 'B' },
        { pos: [500, 250], title: 'D' }, { pos: [1000, 0], title: 'C' }, { pos: [1000, 250], title: 'E' }, { pos: [1250, 0], title: 'F' },
        { pos: [0, 500], title: 'G' }, { pos: [250, 500], title: 'K' },
    ],
    links: [
        { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 4, to: 3 }, { from: 3, to: 5 },
        { from: 3, to: 6, reroutes: [[900, 200]] }, { from: 5, to: 7 }, { from: 8, to: 9 },
    ],
};

/** Link 1 from (311, 114) to (610, 114), A → B; link 2 from (311, 414) to (610, 414), C → D, through a reroute at (450, 520). */
const TWO: GraphSpec = {
    nodes: [{ pos: [100, 100] }, { pos: [600, 100] }, { pos: [100, 400] }, { pos: [600, 400] }],
    links: [{ from: 0, to: 1 }, { from: 2, to: 3, reroutes: [[450, 520]] }],
};

/** A → B through a native reroute at (450, 300), and A → C; the test has link 2 pass that reroute too. */
const SHARED: GraphSpec = {
    nodes: [{ pos: [100, 100] }, { pos: [600, 100] }, { pos: [600, 400] }],
    links: [{ from: 0, to: 1, reroutes: [[450, 300]] }, { from: 0, to: 2 }],
};

const nodeOf = (canvas: FakeCanvas, title: string) => canvas.graph._nodes.find((n) => n.title === title)!;
const ids = () => [...focus.links].sort((a, b) => a - b);

/** Selects `items` as a click does, and draws a frame. */
function select(canvas: FakeCanvas, ...items: (FakeNode | FakeGroup)[]): void {
    canvas.selectItems(items);
    canvas.setDirty(true, true);
    frames(1);
}

interface Call {
    on: 'background' | 'front' | 'hidden';
    color: unknown;
    width: number;
    alpha: number;
}

/** What native's renderLinkDirect got for each link in the next frame, with both canvases drawn: where it drew, in which colour, how wide and at what alpha. */
function natives(canvas: FakeCanvas): Record<number, Call[]> {
    const calls: Record<number, Call[]> = {};
    const native = canvas.linkRenderer.renderLinkDirect;
    const spy = vi.spyOn(canvas.linkRenderer, 'renderLinkDirect').mockImplementation((...args) => {
        const [ctx, , , link, , , color] = args;
        const on = ctx === canvas.bgctx ? 'background' : ctx === canvas.ctx ? 'front' : 'hidden';
        (calls[link!.id] ??= []).push({ on, color, width: canvas.connections_width, alpha: ctx.globalAlpha });
        native(...args);
    });
    canvas.setDirty(true, true);
    frames(1);
    spy.mockRestore();
    return calls;
}

/** Whether a paint falls between the slots of the links, above (link 1) or below (link 2) y = 250. */
const onLink = (box: number[] | undefined, link: 1 | 2) => !!box && box[0] >= 300 && box[2] <= 620 && (box[1] < 250) === (link === 1);

/** The strokes of one frame on a canvas along link 1 or link 2, past the halos: colour and width. */
function strokes(canvas: FakeCanvas, side: 'back' | 'front', link: 1 | 2): [string, number][] {
    const recorder = canvas[side];
    const from = recorder.paints.length;
    canvas.setDirty(true, true);
    frames(1);
    return recorder.paints.slice(from).filter((p) => p.op === 'stroke' && p.style !== HALO && onLink(p.box, link)).map((p) => [p.style, Math.round(p.lineWidth * 100) / 100]);
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    LiteGraph.vueNodesMode = false;
});

describe('the focus', () => {
    it('holds the links touching the selection, and with each reach everything feeding in, all it feeds or both, through reroutes of both kinds', async () => {
        const reach = async (depth: string) => {
            const canvas = await start({ [`${FOCUS}Depth`]: depth }, REACH);
            select(canvas, nodeOf(canvas, 'B'));
            return [ids(), [...focus.reroutes]];
        };
        // Into B through the legacy Reroute node R, from A; D's; and B's own, one through the native reroute 1. G → K never.
        expect(await reach('direct')).toEqual([[2, 3, 4, 5, 6], [1]]);
        expect(await reach('upstream')).toEqual([[1, 2, 3, 4, 5, 6], [1]]);
        expect(await reach('downstream')).toEqual([[2, 3, 4, 5, 6, 7], [1]]);
        expect(await reach('chain')).toEqual([[1, 2, 3, 4, 5, 6, 7], [1]]);
    });

    it('takes a selected group as the nodes in it, and holds nothing with nothing selected or with focus off', async () => {
        const canvas = await start({}, REACH);
        const group = new FakeGroup();
        group.children.add(nodeOf(canvas, 'A')).add(nodeOf(canvas, 'D')).add(group);
        select(canvas, group);
        // A's own, on through R into B; and D's.
        expect(ids()).toEqual([1, 2, 3, 4]);
        select(canvas);
        expect(ids()).toEqual([]);
        select(canvas, nodeOf(canvas, 'B'));
        expect(ids()).not.toEqual([]);
        await app.extensionManager.setting.set(`${FOCUS}Enabled`, false);
        frames(2);
        expect([ids(), [...focus.reroutes]]).toEqual([[], []]);
    });

    it('stays in the graph shown, where a subgraph input or output is no node to go on from', async () => {
        const canvas = await start({ [`${FOCUS}Depth`]: 'chain' }, { nodes: [{ pos: [300, 100] }, { pos: [700, 100] }] });
        const [inner, next] = canvas.graph._nodes;
        const input = canvas.graph.connect(undefined, inner);
        const link = canvas.graph.connect(inner, next);
        select(canvas, next);
        expect(ids()).toEqual([input.id, link.id]);
    });

    it('stops at 2000 links', async () => {
        const canvas = await start({}, { nodes: [{ pos: [100, 100] }, { pos: [600, 100] }], links: Array.from({ length: 2100 }, () => ({ from: 0, to: 1 })) });
        select(canvas, canvas.graph._nodes[0]);
        expect(focus.links.size).toBe(2000);
    });

    it('is built again only when the selection, the graph or a setting changes, never per frame, and reads no settings', async () => {
        const canvas = await start({}, REACH);
        select(canvas, nodeOf(canvas, 'B'));
        const getLink = vi.spyOn(canvas.graph, 'getLink');
        const reads = fake.reads;
        frames(60);
        canvas.setDirty(true, true);
        frames(60);
        expect([getLink.mock.calls.length, fake.reads - reads]).toEqual([0, 0]);
        // The selection, a link made and a setting each build it once more.
        canvas.selectItems([nodeOf(canvas, 'C')]);
        frames(2);
        expect(getLink.mock.calls.length).toBeGreaterThan(0);
        expect(ids()).toEqual([5, 7]);
        canvas.graph.connect(nodeOf(canvas, 'G'), nodeOf(canvas, 'C'));
        frames(2);
        expect(ids()).toEqual([5, 7, 9]);
        await app.extensionManager.setting.set(`${FOCUS}Depth`, 'upstream');
        frames(2);
        expect(ids()).toEqual([1, 2, 3, 4, 5, 7, 9]);
        getLink.mockClear();
        frames(60);
        expect([getLink.mock.calls.length, fake.reads - reads]).toEqual([0, 0]);
    });

    it('with Focus.Hover takes the node the pointer rests on for 150 ms, until 100 ms after it left, but not while dragging or connecting', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const canvas = await start({ [`${FOCUS}Hover`]: true }, TWO);
        const [a] = canvas.graph._nodes;
        const after = (ms: number) => {
            vi.advanceTimersByTime(ms);
            frames(1);
            return ids();
        };
        canvas.node_over = a;
        frames(1);
        expect([after(149), after(1)]).toEqual([[], [1]]);
        canvas.node_over = undefined;
        frames(1);
        expect([after(99), after(1)]).toEqual([[1], []]);
        // Dragging, or a link being connected, hovers nothing.
        for (const busy of ['isDragging', 'isConnecting'] as const) {
            if (busy === 'isDragging') canvas.isDragging = true;
            else canvas.linkConnector.isConnecting = true;
            canvas.node_over = a;
            frames(1);
            expect(after(500)).toEqual([]);
            canvas.isDragging = canvas.linkConnector.isConnecting = false;
            canvas.node_over = undefined;
            frames(1);
        }
    });
});

describe('the modes', () => {
    it('Highlight draws the focused links in the focus colour 1.5 × as wide, effects and all, and the others as they were, with link effects on or off', async () => {
        const canvas = await start({}, TWO);
        select(canvas, canvas.graph._nodes[0]);
        // Classic Flow's base, 0.8 × Thickness wide; link 2's two segments.
        expect([strokes(canvas, 'back', 1), strokes(canvas, 'back', 2)]).toEqual([[[WHITE, 3.6]], [[LINK, 2.4], [LINK, 2.4]]]);
        await start({ [LINKS_ON]: false }, TWO);
        const off = app.canvas as unknown as FakeCanvas;
        select(off, off.graph._nodes[0]);
        const calls = natives(off);
        // And again over the nodes.
        expect(calls[1]).toEqual([{ on: 'background', color: WHITE, width: 4.5, alpha: 1 }, { on: 'front', color: WHITE, width: 4.5, alpha: 1 }]);
        expect(calls[2]).toEqual([{ on: 'background', color: null, width: 3, alpha: 1 }, { on: 'background', color: null, width: 3, alpha: 1 }]);
    });

    it('takes the theme accent, or the link type colour lightened 20 %, on the selected node’s own links too, which ComfyUI draws white, with link effects on or off', async () => {
        document.body.style.setProperty('--primary-background', '#123456');
        const canvas = await start({ [`${FOCUS}Color`]: 'accent' }, TWO);
        select(canvas, canvas.graph._nodes[0]);
        // ComfyUI highlights the selected node's links.
        canvas.highlighted_links[1] = true;
        expect(strokes(canvas, 'back', 1)).toEqual([['#123456', 3.6]]);
        await app.extensionManager.setting.set(`${FOCUS}Color`, 'type');
        // #99aa99 a fifth of the way to white.
        expect(strokes(canvas, 'back', 1)).toEqual([['#adbbad', 3.6]]);
        await app.extensionManager.setting.set(`${FOCUS}Color`, 'native');
        expect(strokes(canvas, 'back', 1)).toEqual([[WHITE, 3.6]]);

        await start({ [`${FOCUS}Color`]: 'type', [LINKS_ON]: false }, TWO);
        const off = app.canvas as unknown as FakeCanvas;
        select(off, off.graph._nodes[0]);
        off.highlighted_links[1] = true;
        // Native draws it in that colour, in the background and again over the nodes, and it stays highlighted.
        expect([strokes(off, 'back', 1).map(([style]) => style), strokes(off, 'front', 1).map(([style]) => style)]).toEqual([['#adbbad'], ['#adbbad']]);
        expect(off.highlighted_links).toEqual({ 1: true });
        document.body.style.removeProperty('--primary-background');
    });

    it('Animate only these animates the focused links alone and leaves the rest to native, nothing with nothing selected; with link effects off it highlights', async () => {
        const canvas = await start({ [`${FOCUS}Mode`]: 'animate' }, TWO);
        select(canvas, canvas.graph._nodes[0]);
        const calls = natives(canvas);
        expect([calls[1].map((c) => c.on), calls[2].map((c) => c.on)]).toEqual([['hidden'], ['background', 'background']]);
        // Classic Flow's markers glide on link 1 alone, in its own colour; link 2's reroute is stamped again over them.
        const marks = (link: 1 | 2) => {
            const from = canvas.front.paints.length;
            frames(1);
            return canvas.front.paints.slice(from).filter((p) => p.op === 'fill' && p.style === LINK && onLink(p.box, link) && p.box![1] < 500).length;
        };
        expect([marks(1) > 0, marks(2)]).toEqual([true, 0]);
        select(canvas);
        expect(Object.values(natives(canvas)).flat().map((c) => c.on)).toEqual(['background', 'background', 'background']);
        frames(3);
        expect([live.links, marks(1)]).toEqual([0, 0]);

        await start({ [`${FOCUS}Mode`]: 'animate', [LINKS_ON]: false }, TWO);
        const off = app.canvas as unknown as FakeCanvas;
        select(off, off.graph._nodes[0]);
        expect(natives(off)[1]).toEqual([{ on: 'background', color: WHITE, width: 4.5, alpha: 1 }, { on: 'front', color: WHITE, width: 4.5, alpha: 1 }]);
    });

    it('Dim others draws the rest natively at Focus.Dim without effects, and the focused links in the focus colour, with link effects on or off', async () => {
        for (const on of [true, false]) {
            const canvas = await start({ [`${FOCUS}Mode`]: 'dim', [`${FOCUS}Dim`]: 40, [LINKS_ON]: on }, TWO);
            select(canvas, canvas.graph._nodes[0]);
            const calls = natives(canvas);
            // Drawn again over the nodes too, ours or native's.
            const focused = { color: on ? null : WHITE, width: 3, alpha: 1 };
            expect(calls[1], String(on)).toEqual(on ? [{ ...focused, on: 'hidden' }] : [{ ...focused, on: 'background' }, { ...focused, on: 'front' }]);
            expect(calls[2], String(on)).toEqual([{ on: 'background', color: null, width: 3, alpha: 0.4 }, { on: 'background', color: null, width: 3, alpha: 0.4 }]);
        }
    });

    it('keeps the stretch a focused link shares with another through a native reroute focused, which native draws once, for the first link through it', async () => {
        for (const on of [true, false]) {
            const canvas = await start({ [`${FOCUS}Mode`]: 'dim', [LINKS_ON]: on }, SHARED);
            const [one, two] = [canvas.graph.links[1], canvas.graph.links[2]];
            Object.assign(two, { reroutes: one.reroutes, parentId: one.parentId });
            select(canvas, canvas.graph._nodes[2]);
            const calls = natives(canvas);
            const at = (link: 1 | 2) => calls[link].map((c) => [c.on, c.alpha]);
            // Link 1 draws the stretch to the reroute, focused, then its own into B, dimmed; link 2 its own into C. Ours on
            // the canvas nobody sees, or native's, and again over the nodes.
            if (on) expect([at(1), at(2)]).toEqual([[['hidden', 1], ['background', 0.2]], [['hidden', 1]]]);
            else expect([at(1), at(2)]).toEqual([[['background', 1], ['background', 0.2], ['front', 1]], [['background', 1], ['front', 1]]]);
        }
    });

    it('Hide others leaves the rest out, their reroutes too, with nothing to click on them and 8 px stubs at their slots, and draws them again once nothing is selected', async () => {
        const canvas = await start({ [`${FOCUS}Mode`]: 'hide' }, TWO);
        const hidden = canvas.graph.links[2];
        const reroute = canvas.graph.reroutes.get(1)!;
        select(canvas, canvas.graph._nodes[0]);
        const [lines, paints] = [canvas.back.lines.length, canvas.back.paints.length];
        const calls = natives(canvas);
        expect([calls[1].map((c) => c.on), calls[2].map((c) => c.on)]).toEqual([['hidden'], ['hidden', 'hidden']]);
        for (const owner of [hidden, reroute]) {
            expect((owner.path as unknown as { ops: string[] }).ops).toEqual([]);
            expect(owner._pos).toEqual([NaN, NaN]);
        }
        // Into the reroute, from the output, and out of it, into the input: one stub each, none at the reroute, 8 px past
        // the nodes, whose slots are 10 px inside them.
        const stubs = canvas.back.lines.slice(lines).filter((line) => /^(moveTo|lineTo)\((311|329|592|610), 414\)$/.test(line));
        expect(stubs).toEqual(['moveTo(311, 414)', 'lineTo(329, 414)', 'moveTo(610, 414)', 'lineTo(592, 414)']);
        expect(canvas.back.paints.slice(paints).filter((p) => p.op === 'stroke' && p.box?.[1] === 414 && p.box[3] === 414).map((p) => [p.style, p.lineWidth])).toEqual([[LINK, 3], [LINK, 3]]);
        // Its reroute goes too, from both canvases and from those native looks for what the pointer is on.
        const dot = (recorder: FakeCanvas['back'], from: number) => recorder.paints.slice(from).some((p) => p.op === 'fill' && p.box?.[0] === 440 && p.box[1] === 510);
        const front = canvas.front.paints.length;
        frames(1);
        expect([dot(canvas.back, paints), dot(canvas.front, front), canvas._visibleReroutes.has(reroute), Object.hasOwn(reroute, 'draw')]).toEqual([false, false, false, false]);

        select(canvas);
        const back = canvas.back.paints.length;
        expect(natives(canvas)[2].map((c) => c.on)).toEqual(['hidden', 'hidden']);
        expect(reroute._pos).not.toEqual([NaN, NaN]);
        expect(hidden._pos).not.toEqual([NaN, NaN]);
        expect([dot(canvas.back, back), canvas._visibleReroutes.has(reroute)]).toEqual([true, true]);
    });

    it('draws the focused links again over the nodes, ours without their glow, or native, unless OnTop is off, in Vue mode, or the graph puts links over the nodes', async () => {
        /** The stroke of link 1's base a frame draws on the front canvas after the nodes' bodies, if any. */
        const over = (canvas: FakeCanvas) => {
            const from = canvas.front.paints.length;
            canvas.setDirty(true, true);
            frames(1);
            const paints = canvas.front.paints.slice(from);
            const bodies = paints.map((p) => p.op === 'fill' && p.style === '#353535').lastIndexOf(true);
            return paints.slice(bodies + 1).find((p) => p.op === 'stroke' && p.style === WHITE && onLink(p.box, 1));
        };
        const canvas = await start({}, TWO);
        select(canvas, canvas.graph._nodes[0]);
        // Drawn in every front pass, it goes without the glow the background drew once.
        expect(over(canvas)?.shadowBlur).toBe(0);
        expect(canvas.back.paints.filter((p) => p.op === 'stroke' && p.style === WHITE && onLink(p.box, 1)).at(-1)?.shadowBlur).toBe(10);
        LiteGraph.vueNodesMode = true;
        expect(over(canvas)).toBeUndefined();
        LiteGraph.vueNodesMode = false;
        canvas.graph.config.links_ontop = true;
        expect(strokes(canvas, 'front', 1).filter(([style]) => style === WHITE)).toHaveLength(1);
        canvas.graph.config.links_ontop = false;
        await app.extensionManager.setting.set(`${FOCUS}OnTop`, false);
        expect(over(canvas)).toBeUndefined();

        await start({ [LINKS_ON]: false }, TWO);
        const off = app.canvas as unknown as FakeCanvas;
        select(off, off.graph._nodes[0]);
        expect(natives(off)[1]).toEqual([{ on: 'background', color: WHITE, width: 4.5, alpha: 1 }, { on: 'front', color: WHITE, width: 4.5, alpha: 1 }]);
    });

    it('stays out of the way where it has nothing to do, and while Coexist leaves links to another extension only dims and hides', async () => {
        const plain = { on: 'background', color: null, width: 3, alpha: 1 };
        const canvas = await start({ [LINKS_ON]: false }, TWO);
        expect(natives(canvas)).toEqual({ 1: [plain], 2: [plain, plain] });

        const deferred = await start({ '🔗 Enhanced Links.Coexist': 'defer' }, TWO);
        select(deferred, deferred.graph._nodes[0]);
        expect(natives(deferred)).toEqual({ 1: [plain], 2: [plain, plain] });
        await app.extensionManager.setting.set(`${FOCUS}Mode`, 'dim');
        expect(natives(deferred)).toEqual({ 1: [plain], 2: [{ ...plain, alpha: 0.2 }, { ...plain, alpha: 0.2 }] });
        await app.extensionManager.setting.set(`${FOCUS}Mode`, 'hide');
        expect(natives(deferred)).toEqual({ 1: [plain], 2: [{ ...plain, on: 'hidden' }, { ...plain, on: 'hidden' }] });
    });
});
