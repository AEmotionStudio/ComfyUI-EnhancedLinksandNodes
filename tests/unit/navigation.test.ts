/**
 * Going along the links (src/ui/menus.ts) on the fake LiteGraph: Go to
 * connected node in the node menu, the jump with its mark and its chip, Back
 * along the last 20 jumps, GoUpstream and GoDownstream cycling, and
 * Navigate.DoubleClick on output and input slots, which leaves ComfyUI's own
 * handlers be. The commands themselves are tests/unit/commands.test.ts's.
 */

import type { ComfyExtension, IContextMenuValue } from '@comfyorg/comfyui-frontend-types';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { live } from '@/core/engine';
import { goAlong, goBack, navigateOnDoubleClick } from '@/ui/menus';
import { app, fake } from '../helpers/fake-app';
import { FakeNode, frames, page, start, type FakeCanvas, type GraphSpec } from '../helpers/fake-litegraph';

/** Load Image → R → KSampler and Save Image, R a legacy Reroute node, and Seed → KSampler. Link ids 1 to 4 in that order. */
const NAV: GraphSpec = {
    nodes: [
        { pos: [100, 100], title: 'Load Image' }, { pos: [400, 300], title: 'R', type: 'Reroute' }, { pos: [700, 100], title: 'KSampler' },
        { pos: [700, 400], title: 'Save Image' }, { pos: [100, 400], title: 'Seed' }, { pos: [1100, 400], title: 'Note' },
    ],
    links: [{ from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 4, to: 2 }],
};
/** The jump's mark, in the theme accent the canvas has no CSS for here. */
const ACCENT = '#0b8ce9';

const nodeOf = (canvas: FakeCanvas, title: string) => canvas.graph._nodes.find((n) => n.title === title)!;
const nodes = fake.extensions as unknown as ComfyExtension[];
/** The node menu's Go to connected node, and what its submenu lists. */
function goTo(node: FakeNode): [IContextMenuValue, IContextMenuValue[]] {
    const items = nodes.find((e) => e.name === 'enhanced.node.animations')!.getNodeMenuItems!(node as never) as IContextMenuValue[];
    return [items[2], items[2].submenu!.options as IContextMenuValue[]];
}
const selected = (canvas: FakeCanvas) => [...canvas.selectedItems].map((n) => (n as FakeNode).title);
const chipText = () => document.querySelector('.eln-chipbar')?.textContent;
const lastJump = (canvas: FakeCanvas) => canvas.animations.at(-1);

/** A frame's strokes of the mark: their alpha. */
function marks(canvas: FakeCanvas): number[] {
    const from = canvas.front.paints.length;
    frames(1);
    return canvas.front.paints.slice(from).filter((p) => p.op === 'stroke' && p.style === ACCENT).map((p) => p.globalAlpha);
}

afterEach(() => {
    vi.restoreAllMocks();
    LiteGraph.vueNodesMode = false;
    document.querySelector('.eln-chipbar')?.remove();
});

describe('Go to connected node', () => {
    it('is the node menu’s third item, one submenu level, listing where each input comes from, then where each output goes, through reroutes', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        const [item, options] = goTo(nodeOf(canvas, 'KSampler'));
        expect([item.content, item.has_submenu]).toEqual(['Go to connected node', true]);
        expect(options.map((o) => o.content)).toEqual(['← in 0 · Load Image #1', '← in 1 · Seed #5']);
        expect(goTo(nodeOf(canvas, 'Load Image'))[1].map((o) => o.content)).toEqual(['→ out · KSampler #3', '→ out · Save Image #4']);
        expect(goTo(nodeOf(canvas, 'Note'))[1]).toEqual([{ content: 'No connections', disabled: true }]);
        expect(options.every((o) => !o.has_submenu && !o.submenu)).toBe(true);
    });

    it('lists 15 at most', async () => {
        const canvas = await start({}, { nodes: [{ pos: [100, 100] }, { pos: [600, 100] }], links: Array.from({ length: 20 }, () => ({ from: 0, to: 1 })) });
        expect(goTo(canvas.graph._nodes[0])[1]).toHaveLength(15);
    });

    it('pans to the node keeping the zoom, selects it, pulses its outline twice over 1.2 s, and offers to go back to the node right-clicked', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        const target = nodeOf(canvas, 'KSampler');
        goTo(nodeOf(canvas, 'Load Image'))[1][0].callback!.call(undefined as never);
        expect(lastJump(canvas)).toEqual({ bounds: [...target.boundingRect], duration: 350, zoom: 0 });
        expect(selected(canvas)).toEqual(['KSampler']);
        expect(chipText()).toBe('↩ Back to Load Image');
        expect(document.querySelector('.graph-canvas-panel > .eln-chipbar')?.getAttribute('role')).toBe('status');
        // Two pulses, at most three luminance swings a second: up, down, up and down again.
        const alphas = Array.from({ length: 80 }, () => marks(canvas)[0] ?? 0);
        const peaks = alphas.filter((a, i) => i > 0 && a > 0.95 && a >= alphas[i - 1] && a >= (alphas[i + 1] ?? 0));
        expect(peaks).toHaveLength(2);
        expect(alphas.slice(75)).toEqual([0, 0, 0, 0, 0]);
        expect(live.marks).toBe(0);
    });

    it('zooms to fit a node that would show under 40 px tall, and under reduced motion moves at once and holds a steady outline for 1.5 s', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        canvas.ds.scale = 0.2;
        goTo(nodeOf(canvas, 'Load Image'))[1][0].callback!.call(undefined as never);
        expect(lastJump(canvas)).toMatchObject({ duration: 350, zoom: 0.75 });
        canvas.ds.scale = 1;
        fake.reducedMotion.matches = true;
        fake.reducedMotion.dispatchEvent(new Event('change'));
        goTo(nodeOf(canvas, 'Load Image'))[1][1].callback!.call(undefined as never);
        expect(lastJump(canvas)).toMatchObject({ duration: 1, zoom: 0 });
        const alphas = Array.from({ length: 100 }, () => marks(canvas)[0] ?? 0);
        expect(alphas.slice(2, 85).every((a) => a === 1)).toBe(true);
        expect(alphas.slice(95)).toEqual([0, 0, 0, 0, 0]);
    });
});

describe('Back', () => {
    it('goes back along the jumps, 20 at most, past nodes since removed, and says when there is nowhere to go', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        const [load, sampler, save] = ['Load Image', 'KSampler', 'Save Image'].map((title) => nodeOf(canvas, title));
        goTo(load)[1][0].callback!.call(undefined as never);
        goTo(sampler)[1][1].callback!.call(undefined as never);
        expect([selected(canvas), chipText()]).toEqual([['Seed'], '↩ Back to KSampler']);
        // The chip's button goes back, and offers the jump before.
        document.querySelector<HTMLElement>('.eln-chipbar button')!.click();
        expect([selected(canvas), chipText()]).toEqual([['KSampler'], '↩ Back to Load Image']);
        expect(goBack()).toBe(true);
        expect([selected(canvas), chipText()]).toEqual([['Load Image'], undefined]);
        expect(goBack()).toBe(false);

        for (let i = 0; i < 25; i++) goTo(i % 2 ? save : load)[1][0].callback!.call(undefined as never);
        let back = 0;
        while (goBack()) back++;
        // Jumps from one node in a row count once.
        expect(back).toBe(20);
        goTo(load)[1][0].callback!.call(undefined as never);
        delete canvas.graph._nodes_by_id[load.id];
        expect(goBack()).toBe(false);
    });
});

describe('GoUpstream and GoDownstream', () => {
    it('go from the one node selected to what feeds it or what it feeds, through reroutes, the next on each again while the chip that counts them shows', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        expect(goAlong(true)).toBe('Select one node first');
        canvas.selectItems([nodeOf(canvas, 'KSampler')]);
        expect(goAlong(true)).toBeUndefined();
        expect([selected(canvas), chipText()]).toEqual([['Load Image'], '1/2 · Load Image↩ Back to KSampler']);
        goAlong(true);
        expect([selected(canvas), chipText()]).toEqual([['Seed'], '2/2 · Seed↩ Back to KSampler']);
        goAlong(true);
        expect(selected(canvas)).toEqual(['Load Image']);
        // Once the chip has gone, on from the node selected.
        page.now += 6000;
        expect(goAlong(true)).toBe('Nothing feeds Load Image');
        expect(goAlong(false)).toBeUndefined();
        expect(selected(canvas)).toEqual(['KSampler']);
        canvas.selectItems([nodeOf(canvas, 'Note')]);
        expect(goAlong(false)).toBe('Note feeds nothing');
        canvas.selectItems([nodeOf(canvas, 'Seed'), nodeOf(canvas, 'Note')]);
        expect(goAlong(false)).toBe('Select one node first');
    });
});

describe('double-clicking a slot', () => {
    it('on a connected output jumps to the node it feeds, the next on each again; on a connected input to the node it comes from', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        const [load, sampler] = [nodeOf(canvas, 'Load Image'), nodeOf(canvas, 'KSampler')];
        const event = new MouseEvent('dblclick') as never;
        load.onOutputDblClick!(0, event);
        expect([selected(canvas), chipText()]).toEqual([['KSampler'], '1/2 · KSampler↩ Back to Load Image']);
        load.onOutputDblClick!(0, event);
        expect([selected(canvas), chipText()]).toEqual([['Save Image'], '2/2 · Save Image↩ Back to Load Image']);
        page.now += 6000;
        load.onOutputDblClick!(0, event);
        expect(selected(canvas)).toEqual(['KSampler']);
        sampler.onInputDblClick!(1, event);
        expect(selected(canvas)).toEqual(['Seed']);
        sampler.onInputDblClick!(0, event);
        expect(selected(canvas)).toEqual(['Load Image']);
        // Nothing on an unconnected slot, with the setting off, or on Vue nodes.
        const jumps = canvas.animations.length;
        nodeOf(canvas, 'Note').onOutputDblClick!(0, event);
        await app.extensionManager.setting.set('🔗 Enhanced Links.Navigate.DoubleClick', false);
        load.onOutputDblClick!(0, event);
        await app.extensionManager.setting.set('🔗 Enhanced Links.Navigate.DoubleClick', true);
        LiteGraph.vueNodesMode = true;
        sampler.onInputDblClick!(1, event);
        expect(canvas.animations).toHaveLength(jumps);
    });

    it('leaves a node type’s own output handler be, and an input that ComfyUI’s own handler gives a Primitive, which takes the link’s place', async () => {
        const canvas = await start({}, NAV);
        frames(1);
        const sampler = nodeOf(canvas, 'KSampler');
        const own = vi.fn();
        const primitive = vi.fn(function (this: FakeNode, slot: number) {
            this.inputs[slot].link = canvas.graph.connect(nodeOf(canvas, 'Note'), this).id;
            this.inputs.pop();
        });
        // As widgetInputs.ts puts its handler on every type before ours.
        const Typed = class extends FakeNode {};
        Object.assign(Typed.prototype, { onOutputDblClick: own, onInputDblClick: primitive });
        navigateOnDoubleClick(Typed as never);
        const jumps = canvas.animations.length;
        Typed.prototype.onOutputDblClick!.call(nodeOf(canvas, 'Load Image'), 0, undefined as never);
        Typed.prototype.onInputDblClick!.call(sampler, 1, undefined as never);
        expect([own.mock.calls.length, primitive.mock.calls.length, canvas.animations.length]).toEqual([1, 1, jumps]);
        // A handler that leaves the link as it was still jumps.
        primitive.mockImplementation(() => {});
        Typed.prototype.onInputDblClick!.call(sampler, 0, undefined as never);
        expect(selected(canvas)).toEqual(['Load Image']);
    });
});
