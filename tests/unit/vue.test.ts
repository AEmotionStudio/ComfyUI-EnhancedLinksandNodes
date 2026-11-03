/**
 * Nodes 2.0 on the fake LiteGraph. What goes over the nodes, focused links and
 * the run's rings and outlines here, is drawn on the frontend's overlayCtx
 * where it has one (1.57.1+), else on a canvas of ours after the transform
 * pane, sized to the main canvas in device pixels and gone in classic mode
 * (src/core/engine.ts). Each DOM node is marked with its effect, whether as
 * its particles alone and collapsed, its selection, run and mode as it mounts
 * and as they change, and one stylesheet draws them, holding still or calm
 * with the canvas effects and still while ComfyUI disables animations
 * (src/nodes/vue.ts). Follow hears the drags over the DOM nodes.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { preview } from '@/core/settings';
import { nodePalette } from '@/core/colors';
import { fake } from '../helpers/fake-app';
import { CanvasRecorder } from '../helpers/recording-context';
import { frames, progress, send, start, type FakeCanvas, type GraphSpec } from '../helpers/fake-litegraph';

const ACCENT = '#0b8ce9';
/** LGraphEventMode.NEVER (muted) and BYPASS. */
const [NEVER, BYPASS] = [2, 4];
const WHITE = '#ffffff';

/** Load → Sample → Save. */
const CHAIN: GraphSpec = {
    nodes: [{ pos: [100, 200], title: 'Load' }, { pos: [500, 200], title: 'Sample' }, { pos: [900, 200], title: 'Save', output: true }],
    links: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
};

afterEach(() => {
    vi.restoreAllMocks();
    LiteGraph.vueNodesMode = false;
    // A classic pass takes the stylesheet and the root's pace off again.
    frames(1);
    document.querySelector('.container')?.remove();
});

const begin = (prompt: string) => send('execution_start', { prompt_id: prompt, timestamp: 0 });

/** Whether `recorder` got a ring in the next frame. */
function rings(canvas: FakeCanvas, recorder: CanvasRecorder): boolean {
    const from = recorder.paints.length;
    canvas.setDirty(true, true);
    frames(1);
    return recorder.paints.slice(from).some((p) => p.op === 'stroke' && p.style === ACCENT && p.lineWidth === 3);
}

/** A transform pane in a container, as GraphCanvas.vue mounts it. */
function mountPane(): HTMLElement {
    const pane = Object.assign(document.createElement('div'), { className: 'pane' });
    pane.dataset.testid = 'transform-pane';
    const container = document.querySelector('.container') ?? document.body.appendChild(Object.assign(document.createElement('div'), { className: 'container' }));
    container.append(pane);
    return pane;
}

describe('the overlay', () => {
    it("draws the ring and the focused links on the frontend's overlayCtx in Nodes 2.0, scaled as core scales it, and on the main canvas in classic mode", async () => {
        const canvas = await start({}, CHAIN);
        const overlay = new CanvasRecorder();
        Object.assign(overlay.ctx.canvas, { clientWidth: 800 });
        Object.assign(canvas, { overlayCtx: overlay.ctx, overlayCanvas: overlay.ctx.canvas });
        begin('ring');
        progress('ring', { 2: 'running' });
        expect([rings(canvas, canvas.front), rings(canvas, overlay)]).toEqual([true, false]);
        LiteGraph.vueNodesMode = true;
        expect([rings(canvas, canvas.front), rings(canvas, overlay)]).toEqual([false, true]);
        // Device pixels over CSS pixels, then the view.
        expect(overlay.lines).toContain('setTransform(2, 0, 0, 2, 0, 0)');

        canvas.selectItems([canvas.graph._nodes[0]]);
        const from = overlay.paints.length;
        canvas.setDirty(true, true);
        frames(1);
        expect(overlay.paints.slice(from).some((p) => p.op === 'stroke' && p.style === WHITE)).toBe(true);
    });

    it('is ours where the frontend has none: after the transform pane, sized to the main canvas in device pixels, cleared each pass and gone in classic mode, leaving nothing behind', async () => {
        const canvas = await start({}, CHAIN);
        const drawn = new CanvasRecorder();
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(drawn.ctx as never);
        begin('ring');
        progress('ring', { 2: 'running' });
        LiteGraph.vueNodesMode = true;
        // Until the pane mounts the layers stay on the main canvas.
        expect(rings(canvas, canvas.front)).toBe(true);

        let pane = mountPane();
        expect(rings(canvas, drawn)).toBe(true);
        const own = document.querySelector<HTMLCanvasElement>('canvas.eln-overlay')!;
        expect([own.previousElementSibling, own.width, own.height, own.style.pointerEvents]).toEqual([pane, 1600, 900, 'none']);
        const from = drawn.lines.length;
        frames(1);
        canvas.setDirty(true, false);
        frames(1);
        expect(drawn.lines.slice(from)).toContain('clearRect(0, 0, 1600, 900)');
        // A device pixel ratio of 2, and a pane Vue made anew.
        Object.assign(canvas.canvas, { width: 3200, height: 1800 });
        pane.remove();
        pane = mountPane();
        rings(canvas, drawn);
        expect([own.previousElementSibling, own.width, own.height]).toEqual([pane, 3200, 1800]);

        const listeners = vi.spyOn(EventTarget.prototype, 'addEventListener');
        const observers = vi.spyOn(globalThis, 'MutationObserver');
        for (let i = 0; i < 5; i++) {
            LiteGraph.vueNodesMode = true;
            rings(canvas, drawn);
            expect(document.querySelectorAll('canvas')).toHaveLength(1);
            LiteGraph.vueNodesMode = false;
            expect(rings(canvas, canvas.front)).toBe(true);
            expect(document.querySelectorAll('canvas')).toHaveLength(0);
        }
        expect([listeners.mock.calls.length, observers.mock.calls.length]).toEqual([0, 0]);
    });
});

describe('Navigate.Follow in Nodes 2.0', () => {
    it('pauses as the user drags or wheels over a DOM node, not over the rest of the page', async () => {
        await start({ '🔗 Enhanced Links.Navigate.Follow': true }, CHAIN);
        LiteGraph.vueNodesMode = true;
        const node = document.createElement('div');
        mountPane().append(node);
        begin('follow');
        document.body.dispatchEvent(Object.assign(new Event('pointermove', { bubbles: true }), { buttons: 1 }));
        expect(document.querySelector('.eln-chipbar')).toBeNull();
        node.dispatchEvent(Object.assign(new Event('pointermove', { bubbles: true }), { buttons: 1 }));
        expect(document.querySelector('.eln-chipbar')?.textContent).toBe('Following pausedResume');
    });
});

/** Vue's node element for each of `ids`, in the pane, with the class and style Vue binds. */
function mountNodes(pane: HTMLElement, ...ids: number[]): HTMLElement[] {
    return ids.map((id) => {
        const el = Object.assign(document.createElement('div'), { className: 'lg-node absolute isolate' });
        el.setAttribute('style', 'transform: translate(0px, 0px);');
        el.dataset.nodeId = String(id);
        return pane.appendChild(el);
    });
}

/** A node element's data-eln-* attributes, without the prefix. */
const marks = (el: Element) => Object.fromEntries([...el.attributes].filter((a) => a.name.startsWith('data-eln-')).map((a) => [a.name.slice('data-eln-'.length), a.value]));

const sheets = () => document.querySelectorAll('style#eln-vue');
const pace = () => document.documentElement.getAttribute('data-eln-pace');
/** The observer's records come in a microtask. */
const mutations = () => new Promise((resolve) => setTimeout(resolve));

describe('node effects in Nodes 2.0', () => {
    it('marks each node element as it mounts and as its effect, selection, run, mode and collapse change, and never its class or style', async () => {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1 }, CHAIN);
        const [load, sample, save] = canvas.graph._nodes;
        LiteGraph.vueNodesMode = true;
        const pane = mountPane();
        const [first, second] = mountNodes(pane, 1, 2);
        frames(1);
        expect([marks(first), marks(second)]).toEqual([{ fx: 'gentle' }, { fx: 'gentle' }]);
        // Mounted between passes, as Vue mounts a node, it is marked at once.
        const [third] = mountNodes(pane, 3);
        await mutations();
        expect(marks(third)).toEqual({ fx: 'gentle' });

        // Node FX, its particles alone, which glow with the halo alone and never selected, a bypass and a mute, the
        // selection and a run, each as the next pass finds it.
        sample.properties.enhanced_fx_style = 3;
        save.properties.enhanced_fx_style = 2;
        load.properties.enhanced_fx_particles_only = true;
        save.mode = BYPASS;
        canvas.selectItems([sample, load]);
        begin('marks');
        progress('marks', { 3: 'running' });
        frames(1);
        expect([marks(first), marks(second), marks(third)]).toEqual([{ fx: 'gentle', only: '' }, { fx: 'cosmic', sel: '' }, { fx: 'neon', run: 'running', mode: 'bypass' }]);
        preview('📦 Enhanced Nodes.Run.Ring', false);
        frames(1);
        expect(marks(third)).toEqual({ fx: 'neon', mode: 'bypass' });
        preview('📦 Enhanced Nodes.Run.Ring', true);
        send('execution_error', { prompt_id: 'marks', node_id: '3', node_type: 'ELNInt', executed: [], exception_message: '', exception_type: '', traceback: [], current_inputs: {}, current_outputs: {}, timestamp: 0 });
        save.mode = NEVER;
        canvas.selectItems([]);
        frames(1);
        expect([marks(second), marks(third)]).toEqual([{ fx: 'cosmic' }, { fx: 'neon', run: 'failed', mode: 'muted' }]);
        // The settings that turn each off.
        canvas.selectItems([sample]);
        preview('📦 Enhanced Nodes.Selection.Glow', false);
        preview('📦 Enhanced Nodes.Run.Error', false);
        frames(1);
        expect([marks(second), marks(third)]).toEqual([{ fx: 'cosmic' }, { fx: 'neon', mode: 'muted' }]);
        // Collapsed, as classic mode draws no effect on it, which only its run shows through.
        sample.flags.collapsed = true;
        canvas.setDirty(true, true);
        frames(1);
        expect(marks(second)).toEqual({ fx: 'cosmic', collapsed: '' });
        expect([...third.classList, third.getAttribute('style')]).toEqual(['lg-node', 'absolute', 'isolate', 'transform: translate(0px, 0px);']);
    });

    it('marks a graph shown anew afresh, as Vue keeps the elements of node ids both graphs have', async () => {
        const inner: GraphSpec = { nodes: [{ pos: [100, 100] }] };
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 2 }, { nodes: [{ pos: [100, 200], subgraph: inner }] });
        const [holder] = canvas.graph._nodes;
        holder.properties.enhanced_fx_style = 4;
        LiteGraph.vueNodesMode = true;
        const [el] = mountNodes(mountPane(), 1);
        frames(1);
        expect(marks(el)).toEqual({ fx: 'rosette' });
        const root = canvas.graph;
        Object.assign(canvas, { graph: holder.subgraph });
        canvas.setDirty(true, true);
        frames(1);
        expect(marks(el)).toEqual({ fx: 'neon' });
        Object.assign(canvas, { graph: root });
        canvas.setDirty(true, true);
        frames(1);
        expect(marks(el)).toEqual({ fx: 'rosette' });
    });

    it('writes one stylesheet in the effects own colours, which a setting writes anew, and takes it and the marks off with node effects or the mode', async () => {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 3 }, CHAIN);
        LiteGraph.vueNodesMode = true;
        const [el] = mountNodes(mountPane(), 1);
        frames(1);
        expect(sheets()).toHaveLength(1);
        const { primary, secondary, accent } = nodePalette(3);
        expect(sheets()[0].textContent).toContain(`.lg-node[data-eln-fx=cosmic]{--eln-c1:${primary};--eln-c2:${secondary};--eln-c3:${accent}}`);
        preview('📦 Enhanced Nodes.Color.Mode', 'custom');
        preview('📦 Enhanced Nodes.Color.Primary', '#123456');
        frames(1);
        expect(sheets()[0].textContent).toContain('.lg-node[data-eln-fx=cosmic]{--eln-c1:#123456;');
        // The halo alone for the particles alone, and on a collapsed node no glow but its run's.
        expect(sheets()[0].textContent).toContain('.lg-node[data-eln-only]::after{border:0;box-shadow:0 0 18px color-mix(in srgb, var(--eln-c1) 60%, transparent);animation:none}');
        expect(sheets()[0].textContent).toContain('.lg-node[data-eln-collapsed]:not([data-eln-run])::after{content:none}');
        // Glow.Show takes the halo out.
        preview('📦 Enhanced Nodes.Glow.Show', false);
        frames(1);
        expect(sheets()[0].textContent).not.toContain('color-mix(in srgb, var(--eln-c1) 60%');
        expect(sheets()[0].textContent).toContain('.lg-node[data-eln-only]::after{border:0;box-shadow:none;animation:none}');

        const [node] = canvas.graph._nodes;
        node.properties.enhanced_fx_particles_only = true;
        node.flags.collapsed = true;
        canvas.setDirty(true, true);
        frames(1);
        expect(marks(el)).toEqual({ fx: 'cosmic', only: '', collapsed: '' });
        preview('📦 Enhanced Nodes.Enabled', false);
        canvas.setDirty(true, true);
        frames(1);
        expect([sheets().length, marks(el)]).toEqual([0, {}]);
        preview('📦 Enhanced Nodes.Enabled', true);
        frames(1);
        expect([sheets().length, marks(el)]).toEqual([1, { fx: 'cosmic', only: '', collapsed: '' }]);
        LiteGraph.vueNodesMode = false;
        frames(1);
        expect([sheets().length, marks(el)]).toEqual([0, {}]);
    });

    it('holds the effects still with Static, reduced motion, a run that freezes the nodes and Disable animations whatever Motion says, and calms them with a Calm run', async () => {
        await start({ '📦 Enhanced Nodes.Animate': 1 }, CHAIN);
        LiteGraph.vueNodesMode = true;
        mountNodes(mountPane(), 1);
        frames(1);
        expect(pace()).toBeNull();
        preview('📦 Enhanced Nodes.Static.Mode', true);
        frames(1);
        expect(pace()).toBe('still');
        preview('📦 Enhanced Nodes.Static.Mode', false);
        fake.reducedMotion.matches = true;
        fake.reducedMotion.dispatchEvent(new Event('change'));
        frames(1);
        expect(pace()).toBe('still');
        fake.reducedMotion.matches = false;
        fake.reducedMotion.dispatchEvent(new Event('change'));
        const paces: (string | null)[] = [];
        for (const mode of ['pause', 'spotlight', 'calm', 'ignore']) {
            preview('🔗 Enhanced Links.Pause.Mode', mode);
            begin(mode);
            frames(1);
            paces.push(pace());
            send('execution_success', { prompt_id: mode, timestamp: 0 });
        }
        expect(paces).toEqual(['still', 'still', 'calm', null]);
        // Not with Apply run behavior to nodes off.
        preview('🔗 Enhanced Links.Pause.Mode', 'calm');
        preview('📦 Enhanced Nodes.Pause.During.Render', false);
        begin('nodes');
        frames(1);
        expect(pace()).toBeNull();
        const css = sheets()[0].textContent!;
        expect(css).toContain(':root[data-eln-pace=still] .lg-node::after, .disable-animations .lg-node::after{animation:none}');
        expect(css).toContain(':root[data-eln-pace=calm]{--eln-calm:0.5;--eln-slow:4}');
    });

    it('glows a running node in the ring\'s colour where it holds still: the accent, a custom colour, or the node\'s effect colour', async () => {
        const css = async (mode: string) => {
            await start({ '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Run.Ring.Color.Mode': mode, '📦 Enhanced Nodes.Run.Ring.Color': '#ff0000' }, CHAIN);
            LiteGraph.vueNodesMode = true;
            mountNodes(mountPane(), 1);
            frames(1);
            return sheets()[0].textContent!.split('\n').find((rule) => rule.startsWith('.lg-node[data-eln-run=running]'));
        };
        const glow = (colour: string) => `.lg-node[data-eln-run=running]::after{border:0;box-shadow:0 0 16px 2px color-mix(in srgb, ${colour} 60%, transparent);animation:none;opacity:1}`;
        expect(await css('accent')).toBe(glow('var(--primary-background)'));
        expect(await css('rainbow')).toBe(glow('var(--primary-background)'));
        expect(await css('custom')).toBe(glow('#ff0000'));
        expect(await css('effect')).toBe(glow('var(--eln-c1, var(--primary-background))'));
    });

    it('blooms Flower of Life\'s glow with its 16 s cycle, in its own colours', async () => {
        await start({ '📦 Enhanced Nodes.Animate': 5 }, CHAIN);
        LiteGraph.vueNodesMode = true;
        const [el] = mountNodes(mountPane(), 1);
        frames(1);
        expect(marks(el)).toEqual({ fx: 'flower' });
        const css = sheets()[0].textContent!;
        expect(css).toContain('.lg-node[data-eln-fx=flower]{--eln-c1:#ffd36b;--eln-c2:#fff3c4;--eln-c3:#b48cff}');
        expect(css).toMatch(/\.lg-node\[data-eln-fx=flower\]::after\{[^}]*animation:eln-bloom calc\(16\.00s \* var\(--eln-slow, 1\)\) ease-in-out infinite normal\}/);
        expect(css).toContain('@keyframes eln-bloom{');
    });

    it('hides the glows but a run\'s while zoomed out below Perf.MinZoom', async () => {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1 }, CHAIN);
        LiteGraph.vueNodesMode = true;
        mountNodes(mountPane(), 1);
        canvas.ds.scale = 0.2;
        frames(1);
        expect(pace()).toBe('far');
        canvas.ds.scale = 1;
        canvas.setDirty(true, true);
        frames(1);
        expect(pace()).toBeNull();
        expect(sheets()[0].textContent).toContain(':root[data-eln-pace=far] .lg-node:not([data-eln-run])::after{content:none}');
    });

    it('holds the glows still while more nodes whose glow moves are on screen than a quarter of Perf.StaticAbove, but for steady glows and nodes off screen', async () => {
        const STATIC_ABOVE = '🔗 Enhanced Links.Perf.StaticAbove';
        // Twelve Gentle Pulse nodes on screen and four off it.
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1, [STATIC_ABOVE]: 40 }, {
            nodes: Array.from({ length: 16 }, (_, i) => ({ pos: [i < 12 ? 100 + (i % 6) * 250 : 5000, i < 12 ? 100 + Math.floor(i / 6) * 300 : 100] })),
        });
        LiteGraph.vueNodesMode = true;
        mountNodes(mountPane(), ...canvas.graph._nodes.map((n) => Number(n.id)));
        frames(1);
        expect(pace()).toBe('still');
        preview(STATIC_ABOVE, 48);
        frames(1);
        expect(pace()).toBeNull();
        preview(STATIC_ABOVE, 44);
        frames(1);
        expect(pace()).toBe('still');
        // Neon Nexus holds a steady edge, which moves nothing.
        preview('📦 Enhanced Nodes.Animate', 2);
        frames(1);
        expect(pace()).toBeNull();
        preview('📦 Enhanced Nodes.Animate', 1);
        preview(STATIC_ABOVE, 0);
        frames(1);
        expect(pace()).toBeNull();
    });

    it('leaves one stylesheet and one pane observed at most after five times on and off, the root without its pace, and no listener', async () => {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Static.Mode': true }, CHAIN);
        const pane = mountPane();
        const [el] = mountNodes(pane, 1);
        LiteGraph.vueNodesMode = true;
        frames(1);
        const listeners = vi.spyOn(EventTarget.prototype, 'addEventListener');
        const observed = new Set<MutationObserver>();
        const { observe, disconnect } = MutationObserver.prototype;
        vi.spyOn(MutationObserver.prototype, 'observe').mockImplementation(function (this: MutationObserver, ...args) {
            observed.add(this);
            return observe.apply(this, args);
        });
        vi.spyOn(MutationObserver.prototype, 'disconnect').mockImplementation(function (this: MutationObserver) {
            observed.delete(this);
            return disconnect.apply(this);
        });
        for (let i = 0; i < 5; i++) {
            LiteGraph.vueNodesMode = false;
            canvas.setDirty(true, true);
            frames(1);
            expect([sheets().length, observed.size, pace(), marks(el)]).toEqual([0, 0, null, {}]);
            LiteGraph.vueNodesMode = true;
            frames(1);
            expect([sheets().length, observed.size, pace(), marks(el)]).toEqual([1, 1, 'still', { fx: 'gentle' }]);
        }
        expect(listeners).not.toHaveBeenCalled();
    });
});
