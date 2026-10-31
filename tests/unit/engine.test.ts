/**
 * The engine (src/core/engine.ts) through both extensions on the fake
 * LiteGraph: the clock keeps v2's 60 Hz rates at any frame rate, the ticker
 * asks for front paints only while something animated is on screen and at most
 * 60 a second, onRender and onDrawForeground stay chained when other
 * extensions take them over, and the guard turns off what keeps failing.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock, guard, install, live } from '@/core/engine';
import { preview } from '@/core/settings';
import { app, fake } from '../helpers/fake-app';
import { frames, page, queue, start, type FakeCanvas, type GraphSpec } from '../helpers/fake-litegraph';

const TURN = (2 * Math.PI) / 15;

/** Two nodes on screen and an IMAGE link between them. */
const PAIR: GraphSpec = { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1, type: 'IMAGE' }] };
const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0 };
const NODES_ON = { '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true };
const TITLES = { '📦 Enhanced Nodes.Text.Animation.Enabled': true };

afterEach(() => {
    vi.restoreAllMocks();
});

const count = (canvas: FakeCanvas, call: string) => canvas.calls.filter((c) => c === call).length;
const strokes = (canvas: FakeCanvas) => canvas.front.paints.filter((p) => p.op === 'stroke').length;

/** Runs a few frames so the ticker is past its first one, then forgets what was asked for so far. */
function warmUp(canvas: FakeCanvas) {
    frames(5);
    page.requests = 0;
    canvas.calls = [];
    return vi.spyOn(canvas, 'setDirty');
}

describe('clock', () => {
    it("moves at v2's per-second rates at 60 Hz, and at 144 Hz within 1% of them", async () => {
        const settings = {
            ...NODES_ON,
            '🔗 Enhanced Links.Animation.Speed': 2,
            '🔗 Enhanced Links.Direction': -1,
            '📦 Enhanced Nodes.Animation.Speed': 1.5,
            '📦 Enhanced Nodes.Particle.Speed': 3,
            '📦 Enhanced Nodes.Direction': -1,
        };
        // v2.0.1 per second at 60 Hz: AnimationState.update, its node renderLoop and ParticleController each added
        // (2π/15) × speed × direction × the frame delta; drawConnections and the link rAF loop each added the delta to the flow time.
        const v2 = { linkPhase: -TURN * 2, linkTime: 2, nodePhase: -TURN * 1.5, particlePhase: -TURN * 3 };
        const rates: Record<number, typeof v2> = {};
        for (const hz of [60, 144]) {
            warmUp(await start(settings, PAIR));
            const before = { ...clock };
            frames(hz, hz);
            rates[hz] = {
                linkPhase: clock.linkPhase - before.linkPhase,
                linkTime: clock.linkTime - before.linkTime,
                nodePhase: clock.nodePhase - before.nodePhase,
                particlePhase: clock.particlePhase - before.particlePhase,
            };
        }
        for (const key of Object.keys(v2) as (keyof typeof v2)[]) {
            expect(rates[60][key], key).toBeCloseTo(v2[key], 6);
            expect(Math.abs(rates[144][key] / rates[60][key] - 1), key).toBeLessThan(0.01);
        }
    });

    it('moves by at most 0.1 s across a long frame', async () => {
        warmUp(await start({}, PAIR));
        const phase = clock.linkPhase;
        // One frame 2 s after the last.
        frames(1, 0.5);
        expect(clock.linkPhase - phase).toBeCloseTo(TURN * 0.1, 9);
    });

    it('moves only the clocks of what animates', async () => {
        for (const [settings, moving] of [
            [{}, ['linkPhase', 'linkTime']],
            [{ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 1 }, ['nodePhase']],
            [{ ...LINKS_OFF, '📦 Enhanced Nodes.Particle.Show': true }, ['particlePhase']],
        ] as const) {
            warmUp(await start(settings, PAIR));
            const before = { ...clock };
            frames(60);
            expect((Object.keys(clock) as (keyof typeof clock)[]).filter((key) => clock[key] !== before[key]), JSON.stringify(settings)).toEqual(moving);
        }
    });

    it('never moves in a draw, even one made inside a frame', async () => {
        const canvas = await start(NODES_ON, PAIR);
        frames(10);
        const before = { ...clock };
        canvas.calls = [];
        // MagnifyGlass draws the canvas again within a frame, here from inside another extension's onDrawForeground.
        canvas.onDrawForeground = () => {
            canvas.onDrawForeground = undefined;
            canvas.draw(true, true);
        };
        canvas.draw(true, true);
        canvas.draw(true, true);
        expect(count(canvas, 'drawFrontCanvas')).toBe(3);
        expect(clock).toEqual(before);
    });
});

describe('ticker', () => {
    it('asks for no frames and no paints while nothing animates', async () => {
        const canvas = await start(LINKS_OFF, PAIR);
        const setDirty = vi.spyOn(canvas, 'setDirty');
        frames(120);
        expect(page.requests).toBe(0);
        expect(setDirty).not.toHaveBeenCalled();
        // Only the first frame paints.
        expect(count(canvas, 'drawFrontCanvas')).toBe(1);
    });

    it('stops while the tab is hidden and starts again from where it was', async () => {
        const canvas = await start({}, PAIR);
        const setDirty = warmUp(canvas);
        page.hidden = true;
        document.dispatchEvent(new Event('visibilitychange'));
        frames(2);
        const [requests, phase] = [page.requests, clock.linkPhase];
        frames(60);
        expect(page.requests).toBe(requests);
        expect(page.waiting).toEqual([]);

        setDirty.mockClear();
        page.now += 5000;
        page.hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
        // The first frame back starts the clock; the second moves it by one frame, not by the time away.
        frames(1);
        expect(clock.linkPhase).toBe(phase);
        frames(1);
        expect(clock.linkPhase - phase).toBeCloseTo(TURN / 60, 9);
        expect(setDirty).toHaveBeenCalledTimes(1);
    });

    it('starts the clock afresh when the tab comes back, though no frame ran while it was hidden', async () => {
        warmUp(await start({}, PAIR));
        const phase = clock.linkPhase;
        // A browser runs no requestAnimationFrame callbacks in a hidden tab.
        page.hidden = true;
        document.dispatchEvent(new Event('visibilitychange'));
        page.now += 5000;
        page.hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
        frames(1);
        expect(clock.linkPhase).toBe(phase);
        frames(1);
        expect(clock.linkPhase - phase).toBeCloseTo(TURN / 60, 9);
    });

    // Animated titles move with the node effect's phase, so they stop with it.
    for (const [why, settings, still] of [
        ['in Static mode', { ...NODES_ON, ...TITLES, '🔗 Enhanced Links.Static.Mode': true, '📦 Enhanced Nodes.Static.Mode': true, '📦 Enhanced Nodes.Particle.Show': false }, () => {}],
        ['while a run pauses links and nodes', { ...TITLES, '📦 Enhanced Nodes.Animate': 1 }, () => queue(1)],
        ['with reduced motion', { ...NODES_ON, ...TITLES }, () => {
            fake.reducedMotion.matches = true;
            fake.reducedMotion.dispatchEvent(new Event('change'));
        }],
    ] as const) {
        it(`stops ${why}`, async () => {
            const canvas = await start(settings, PAIR);
            frames(5);
            still();
            const setDirty = warmUp(canvas);
            const before = { ...clock };
            frames(120);
            expect(page.requests).toBe(0);
            expect(setDirty).not.toHaveBeenCalled();
            expect(canvas.calls).toEqual([]);
            expect(clock).toEqual(before);
        });
    }

    it('stops for the disable-animations class 1.57.1 puts on the body', async () => {
        await start({}, PAIR);
        frames(5);
        document.body.classList.add('disable-animations');
        await Promise.resolve();
        frames(5);
        page.requests = 0;
        frames(60);
        document.body.classList.remove('disable-animations');
        await Promise.resolve();
        expect(page.requests).toBe(0);
        frames(5);
        expect(page.requests).toBeGreaterThan(0);
    });

    it('repaints only the front canvas while only nodes animate', async () => {
        const canvas = await start({ ...LINKS_OFF, ...NODES_ON }, PAIR);
        const setDirty = warmUp(canvas);
        frames(60);
        expect(setDirty).toHaveBeenCalledTimes(60);
        expect(setDirty.mock.calls.every(([front, back]) => front && !back)).toBe(true);
        expect([count(canvas, 'drawFrontCanvas'), count(canvas, 'drawBackCanvas')]).toEqual([60, 0]);
    });

    it('repaints only the front canvas while links animate', async () => {
        const canvas = await start({}, PAIR);
        const setDirty = warmUp(canvas);
        frames(60);
        expect(setDirty).toHaveBeenCalledTimes(60);
        expect(setDirty.mock.calls.every(([front, back]) => front && !back)).toBe(true);
        expect([count(canvas, 'drawFrontCanvas'), count(canvas, 'drawBackCanvas')]).toEqual([60, 0]);
    });

    it('asks for at most 60 paints a second at 144 Hz', async () => {
        const setDirty = warmUp(await start(NODES_ON, PAIR));
        frames(144, 144);
        expect(setDirty.mock.calls.length).toBeLessThanOrEqual(60);
        expect(setDirty.mock.calls.length).toBeGreaterThanOrEqual(48);
    });

    it('stops when nothing animated is on screen, and starts again when a pass draws some', async () => {
        const canvas = await start({ ...NODES_ON, '📦 Enhanced Nodes.Animate': 0 }, PAIR);
        frames(5);
        canvas.ds.offset = [-20000, -20000];
        canvas.setDirty(true, true);
        frames(5);
        page.requests = 0;
        frames(60);
        expect(page.requests).toBe(0);
        expect([live.links, live.nodes, live.particles]).toEqual([0, 0, 0]);

        // A setting change repaints both canvases (settings.ts), and the passes wake the ticker for what they draw.
        canvas.ds.offset = [0, 0];
        preview('📦 Enhanced Nodes.Animate', 2);
        frames(5);
        expect(page.waiting).toHaveLength(1);
        expect(live).toEqual({ links: 1, nodes: 2, particles: 2 });
    });
});

describe('onRender and onDrawForeground', () => {
    /** A front pass with both nodes counts each of them once. */
    const nodesPerPass = () => {
        frames(1);
        return live.nodes;
    };

    it('chains again after a replacement that does not call through', async () => {
        const canvas = await start(NODES_ON, PAIR);
        frames(5);
        expect(nodesPerPass()).toBe(2);
        const replacement = vi.fn();
        canvas.onRender = replacement;
        // The pass it missed keeps the last counts, so the ticker runs on until its next tick chains our onRender again.
        expect(nodesPerPass()).toBe(2);
        expect(canvas.onRender).toBe(replacement);
        frames(2);
        expect(canvas.onRender).not.toBe(replacement);
        expect(nodesPerPass()).toBe(2);
        const calls = replacement.mock.calls.length;
        frames(1);
        expect(replacement).toHaveBeenCalledTimes(calls + 1);
    });

    it('chains onDrawForeground again too, where links on top are drawn', async () => {
        const canvas = await start({}, PAIR);
        canvas.graph.config.links_ontop = true;
        canvas.setDirty(true, true);
        frames(5);
        const strokes = () => canvas.front.paints.filter((p) => p.op === 'stroke').length;
        const drawn = (count: number) => {
            const before = strokes();
            frames(count);
            return strokes() - before;
        };
        expect(drawn(1)).toBe(1);
        const replacement = vi.fn();
        canvas.onDrawForeground = replacement;
        // The link count of the pass it missed runs on, so the ticker chains it again on its next frame.
        expect(drawn(1)).toBe(0);
        frames(2);
        expect(canvas.onDrawForeground).not.toBe(replacement);
        expect(drawn(1)).toBe(1);
        expect(live.links).toBe(1);
    });

    it('runs once a pass when a hook that saved it is wrapped by it again', async () => {
        const canvas = await start(NODES_ON, PAIR);
        // MagnifyGlass's CanvasHighlighter calls the hook it saved, and saves the current one again whenever it finds its own replaced.
        const highlighter = {
            saved: undefined as FakeCanvas['onRender'],
            calls: 0,
            hook(this: FakeCanvas, ...args: Parameters<NonNullable<FakeCanvas['onRender']>>) {
                highlighter.calls++;
                highlighter.saved?.apply(this, args);
            },
            ensure() {
                if (canvas.onRender === highlighter.hook) return;
                highlighter.saved = canvas.onRender;
                canvas.onRender = highlighter.hook;
            },
        };
        frames(5);
        // It wraps a replacement that does not call through, so ours is chained again over it, and it saves ours.
        canvas.onRender = () => {};
        highlighter.ensure();
        frames(3);
        expect(canvas.onRender).not.toBe(highlighter.hook);
        highlighter.ensure();
        frames(5);
        highlighter.calls = 0;
        expect(nodesPerPass()).toBe(2);
        expect(highlighter.calls).toBe(2);
    });

    it('keep calling the handlers from before our first setup() when another extension chains them between our two', async () => {
        const first = await start({}, PAIR);
        // A fresh canvas with a handler on each hook, as Comfy.SelectionBorder's init() leaves onDrawForeground (FE157 selectionBorder.ts L52-68).
        const canvas = new (globalThis as unknown as { LGraphCanvas: typeof FakeCanvas }).LGraphCanvas(first.graph);
        const calls = { onRender: 0, onDrawForeground: 0, wrapper: 0 };
        canvas.onRender = () => calls.onRender++;
        canvas.onDrawForeground = () => calls.onDrawForeground++;
        Object.assign(app, { canvas });
        // ComfyUI imports extension modules in parallel, so another extension's setup() can run between ours (FE157 extensionLoader.ts L28-48).
        install();
        for (const name of ['onRender', 'onDrawForeground'] as const) {
            const previous = canvas[name] as (...args: unknown[]) => void;
            canvas[name] = function (this: unknown, ...args: unknown[]) {
                calls.wrapper++;
                previous.apply(this, args);
            };
        }
        install();
        canvas.draw(true, true);
        expect(calls).toEqual({ onRender: 1, onDrawForeground: 1, wrapper: 2 });
        expect(strokes(canvas)).toBe(1);
    });

    describe('replaced while nothing moved', () => {
        it('onRender, after our setup() and before the first frame', async () => {
            const canvas = await start({}, PAIR);
            const replacement = vi.fn();
            canvas.onRender = replacement;
            // The link pass counts the segments it recorded, so the ticker runs and chains our onRender again.
            frames(5);
            expect(canvas.onRender).not.toBe(replacement);
            const [before, calls] = [strokes(canvas), replacement.mock.calls.length];
            frames(1);
            expect([strokes(canvas) - before, replacement.mock.calls.length - calls, live.links]).toEqual([1, 1, 1]);
        });

        it('onRender, while Static mode kept the ticker off, until links move again', async () => {
            const canvas = await start({ '🔗 Enhanced Links.Static.Mode': true }, PAIR);
            frames(5);
            const replacement = vi.fn();
            canvas.onRender = replacement;
            page.requests = 0;
            frames(30);
            expect(page.requests).toBe(0);
            preview('🔗 Enhanced Links.Static.Mode', false);
            frames(5);
            expect(canvas.onRender).not.toBe(replacement);
            const before = strokes(canvas);
            frames(1);
            expect(strokes(canvas) - before).toBe(1);
        });

        it('onDrawForeground, where links on top are drawn, before the first frame', async () => {
            const canvas = await start({}, PAIR);
            canvas.graph.config.links_ontop = true;
            const replacement = vi.fn();
            canvas.onDrawForeground = replacement;
            frames(5);
            expect(canvas.onDrawForeground).not.toBe(replacement);
            const before = strokes(canvas);
            frames(1);
            expect(strokes(canvas) - before).toBe(1);
        });
    });

    it('leave the canvas as they found it, so the nodes after onRender draw where they belong', async () => {
        const canvas = await start({}, PAIR);
        canvas.ds.scale = 2;
        canvas.ds.offset = [-100, -100];
        frames(1);
        // The first node's body runs from (100, 170) to (320, 320) in the graph.
        const [body] = canvas.front.paints.filter((p) => p.op === 'fill' && p.style === '#353535');
        expect(body.box).toEqual([0, 140, 440, 440]);
    });
});

describe('guard', () => {
    it('logs a key once per 10 s, turns it off after 5 failures within 10 s with one toast, and any setting change turns it on', async () => {
        await start({}, PAIR);
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const fail = (times: number, ms: number) => {
            for (let i = 0; i < times; i++) {
                guard.fail('Test effect', new Error('boom'));
                page.now += ms;
            }
        };
        fail(4, 1000);
        expect(warn).toHaveBeenCalledTimes(1);
        // A fifth failure 20 s after the first is not 5 within 10 s.
        page.now += 16_000;
        fail(1, 0);
        expect([warn.mock.calls.length, guard.off('Test effect'), fake.toasts]).toEqual([2, false, []]);
        fail(4, 2000);
        expect(guard.off('Test effect')).toBe(true);
        expect(guard.off('Other effect')).toBe(false);
        fail(3, 10);
        expect(fake.toasts).toEqual([expect.objectContaining({ severity: 'warn', summary: 'Test effect turned off' })]);
        expect(warn).toHaveBeenCalledTimes(2);

        preview('🔗 Enhanced Links.Thickness', 4);
        expect(guard.off('Test effect')).toBe(false);
    });

    it('turns off a link animation that fails every frame, which then draws natively and stops the ticker', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        // Lava Flow's gradient throws on a colour the canvas cannot parse, here a palette's.
        const canvas = await start({ '🔗 Enhanced Links.Animate': 7 }, { ...PAIR, links: [{ from: 0, to: 1, type: 'INT' }] });
        Object.assign((globalThis as unknown as { LGraphCanvas: { link_type_colors: Record<string, string> } }).LGraphCanvas.link_type_colors, { INT: 'nope' });
        frames(20);
        expect(guard.off('Link animation')).toBe(true);
        expect(fake.toasts).toEqual([expect.objectContaining({ summary: 'Link animation turned off' })]);
        expect(warn).toHaveBeenCalledTimes(1);
        page.requests = 0;
        canvas.calls = [];
        canvas.setDirty(true, true);
        frames(30);
        expect(page.requests).toBe(0);
        expect(count(canvas, 'renderLink')).toBe(1);
        canvas.back.assertBalanced();
    });
});
