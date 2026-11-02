/**
 * The engine (src/core/engine.ts) through both extensions on the fake
 * LiteGraph: the clock runs the links and the nodes at v1's rates, which for the
 * nodes are its 60 Hz ones, at any frame rate; the ticker asks for front paints only while
 * something animated is on screen and at most 60 a second; onRender and
 * onDrawForeground stay chained when other extensions take them over; and the
 * guard turns off what keeps failing.
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { HELD, PLAIN, THIN, adaptive, clock, guard, install, live } from '@/core/engine';
import { preview } from '@/core/settings';
import { MOVING } from '@/links/animations';
import { drawNodeFx } from '@/nodes/effects';
import { CanvasRecorder } from '../helpers/recording-context';
import { WHOLE } from './characterize/v1-inputs';
import { app, fake } from '../helpers/fake-app';
import { frames, page, send, start, type FakeCanvas, type GraphSpec } from '../helpers/fake-litegraph';

const TURN = (2 * Math.PI) / 15;
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;

/** Two nodes on screen and an IMAGE link between them. */
const PAIR: GraphSpec = { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1, type: 'IMAGE' }] };
const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0 };
const NODES_ON = { '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true };
const TITLES = { '📦 Enhanced Nodes.Text.Animation.Enabled': true };

afterEach(() => {
    vi.restoreAllMocks();
});

const count = (canvas: FakeCanvas, call: string) => canvas.calls.filter((c) => c === call).length;
/** What the link layer drew in the front passes so far: the IMAGE link's markers and centre marker, in the default link colour. */
const motion = (canvas: FakeCanvas) => canvas.front.paints.filter((p) => p.op === 'fill' && p.style === '#99aa99').length;
/** Classic Flow's two markers and the centre marker, which one front pass draws for the link. */
const PER_PASS = 3;

/** Runs a few frames so the ticker is past its first one, then forgets what was asked for so far. */
function warmUp(canvas: FakeCanvas) {
    frames(5);
    page.requests = 0;
    canvas.calls = [];
    return vi.spyOn(canvas, 'setDirty');
}

describe('clock', () => {
    it("moves the links and the nodes at v1's rates at 60 Hz, and at 144 Hz within 1% of them", async () => {
        const settings = {
            ...NODES_ON,
            '🔗 Enhanced Links.Animation.Speed': 2,
            '🔗 Enhanced Links.Direction': -1,
            '📦 Enhanced Nodes.Animation.Speed': 1.5,
            '📦 Enhanced Nodes.Particle.Speed': 3,
            '📦 Enhanced Nodes.Direction': -1,
        };
        // Per second. v1 (old_link_animations.js:260-303, 2457-2459): phase −= PHI² × speed × direction × Δ, and its time
        // gained speed × Δ twice a frame, which the renderers took times the speed again. Quantum Field's phase turns as
        // the phase does, up to 3/5 of a turn a second. v1's node controllers at 60 Hz (old_node_animations.js:71-127,
        // 2945-2957) added (2π/15) × speed × direction × Δ to the effect phase and to the particles' (here TURN × their
        // time, which runs Particle.Speed seconds a second), and its time Δ.
        const rates = { linkPhase: PHI2 * 2, linkFlow: -2 * 2 * 2, quantumPhase: (2 * Math.PI * 3) / 5, nodePhase: -TURN * 1.5, particleTime: -3, nodeTime: 1 };
        const moved: Record<number, typeof rates> = {};
        for (const hz of [60, 144]) {
            warmUp(await start(settings, PAIR));
            const before = { ...clock };
            frames(hz, hz);
            moved[hz] = {
                linkPhase: clock.linkPhase - before.linkPhase,
                linkFlow: clock.linkFlow - before.linkFlow,
                quantumPhase: clock.quantumPhase - before.quantumPhase,
                nodePhase: clock.nodePhase - before.nodePhase,
                particleTime: clock.particleTime - before.particleTime,
                nodeTime: clock.nodeTime - before.nodeTime,
            };
        }
        for (const key of Object.keys(rates) as (keyof typeof rates)[]) {
            expect(moved[60][key], key).toBeCloseTo(rates[key], 6);
            expect(Math.abs(moved[144][key] / moved[60][key] - 1), key).toBeLessThan(0.01);
        }
    });

    it('turns the link phase once every 2.40 s at speed 1, backwards going Forward, and never wraps it', async () => {
        warmUp(await start({}, PAIR));
        const phase = clock.linkPhase;
        // 2π / PHI² = 2.39996 s; at 60 Hz the 144th frame lands on 2.40 s.
        frames(144);
        expect((clock.linkPhase - phase) / (-2 * Math.PI)).toBeCloseTo(2.4 / ((2 * Math.PI) / PHI2), 9);
        frames(600);
        expect(clock.linkPhase - phase).toBeCloseTo(-PHI2 * 12.4, 6);
    });

    it('flows forward going Forward, backward going Reverse, and four times as far at twice the speed', async () => {
        const flow = async (settings: Record<string, unknown>) => {
            warmUp(await start(settings, PAIR));
            const before = clock.linkFlow;
            frames(60);
            return clock.linkFlow - before;
        };
        const forward = await flow({});
        expect(forward).toBeCloseTo(2, 9);
        expect(await flow({ '🔗 Enhanced Links.Direction': -1 })).toBeCloseTo(-forward, 9);
        expect(await flow({ '🔗 Enhanced Links.Animation.Speed': 2 })).toBeCloseTo(4 * forward, 9);
    });

    it('turns the links around over 0.3 s when Direction changes, and at once while they are still', async () => {
        const canvas = await start({}, PAIR);
        warmUp(canvas);
        preview('🔗 Enhanced Links.Direction', -1);
        // A setting change repaints both canvases; the direction moves by 2 / 0.3 a second from the next tick on.
        const turning: number[] = [];
        for (let i = 0; i < 24; i++) {
            frames(1);
            turning.push(clock.linkDir);
        }
        expect(turning[0]).toBeCloseTo(1 - 2 / 18, 9);
        expect(turning[8]).toBeCloseTo(0, 9);
        // Turned all the way, to within the frames' timing.
        expect(turning.slice(17).map((dir) => Math.round(dir * 1e9) / 1e9)).toEqual(Array(7).fill(-1));
        // Flowing backwards now, at the full rate.
        const flow = clock.linkFlow;
        frames(60);
        expect(clock.linkFlow - flow).toBeCloseTo(-2, 9);

        // Turned while held still, whether the ticker stopped or ran on for the nodes, they set off the new way at once.
        for (const settings of [{}, NODES_ON]) {
            warmUp(await start({ ...settings, '🔗 Enhanced Links.Direction': -1 }, PAIR));
            preview('🔗 Enhanced Links.Static.Mode', true);
            frames(5);
            preview('🔗 Enhanced Links.Direction', 1);
            frames(5);
            preview('🔗 Enhanced Links.Static.Mode', false);
            frames(3);
            const before = clock.linkFlow;
            frames(6);
            expect(clock.linkFlow - before, JSON.stringify(settings)).toBeCloseTo(0.2, 9);
        }
    });

    it('turns the nodes around over 0.3 s when their Direction changes, the effect phase and the particles alike', async () => {
        warmUp(await start({ ...LINKS_OFF, ...NODES_ON }, PAIR));
        preview('📦 Enhanced Nodes.Direction', -1);
        const turning: number[] = [];
        for (let i = 0; i < 24; i++) {
            frames(1);
            turning.push(clock.nodeDir);
        }
        expect(turning[0]).toBeCloseTo(1 - 2 / 18, 9);
        expect(turning[8]).toBeCloseTo(0, 9);
        // Turned all the way, to within the frames' timing.
        expect(turning.slice(17).map((dir) => Math.round(dir * 1e9) / 1e9)).toEqual(Array(7).fill(-1));
        const before = { ...clock };
        frames(60);
        expect(clock.nodePhase - before.nodePhase).toBeCloseTo(-TURN, 9);
        expect(clock.particleTime - before.particleTime).toBeCloseTo(-1, 9);
        // The time Cosmic Ripple's motes wobble by runs on forward.
        expect(clock.nodeTime - before.nodeTime).toBeCloseTo(1, 9);
    });

    it('moves by at most 0.1 s across a long frame', async () => {
        warmUp(await start({}, PAIR));
        const phase = clock.linkPhase;
        // One frame 2 s after the last.
        frames(1, 0.5);
        expect(clock.linkPhase - phase).toBeCloseTo(-PHI2 * 0.1, 9);
    });

    it('moves only the clocks of what animates', async () => {
        for (const [settings, moving] of [
            [{}, ['linkPhase', 'linkFlow', 'quantumPhase']],
            [{ ...LINKS_OFF, '📦 Enhanced Nodes.Animate': 1 }, ['nodePhase']],
            [{ ...LINKS_OFF, '📦 Enhanced Nodes.Particle.Show': true }, ['particleTime', 'nodeTime']],
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
        expect(clock.linkPhase - phase).toBeCloseTo(-PHI2 / 60, 9);
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
        expect(clock.linkPhase - phase).toBeCloseTo(-PHI2 / 60, 9);
    });

    // Animated titles move with the node effect's phase, so they stop with it.
    for (const [why, settings, still] of [
        ['in Static mode', { ...NODES_ON, ...TITLES, '🔗 Enhanced Links.Static.Mode': true, '📦 Enhanced Nodes.Static.Mode': true, '📦 Enhanced Nodes.Particle.Show': false }, () => {}],
        ["while this client's run holds links and nodes still", { ...TITLES, '📦 Enhanced Nodes.Animate': 1 }, () => send('execution_start', { prompt_id: 'held', timestamp: 0 })],
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
        expect(live).toEqual({ links: 1, nodes: 2, particles: 2, bursts: 0, marks: 0, flows: 0, rings: 0 });
    });
});

describe('Perf.MaxFps', () => {
    const MAX_FPS = '🔗 Enhanced Links.Perf.MaxFps';

    /** The paints a second the ticker asks for over 4 s at `hz`. */
    async function rate(settings: Record<string, unknown>, hz: number): Promise<number> {
        const setDirty = warmUp(await start({ ...NODES_ON, ...settings }, PAIR));
        frames(hz * 4, hz);
        return setDirty.mock.calls.length / 4;
    }

    // Paced evenly, 60 gave 37.5 paints a second at 75 Hz and 48 at 144 Hz.
    for (const hz of [60, 75, 120, 144]) {
        it(`averages at least 57 paints a second at 60 on a ${hz} Hz display, and never more than 60`, async () => {
            const paints = await rate({}, hz);
            expect(paints).toBeGreaterThanOrEqual(57);
            expect(paints).toBeLessThanOrEqual(60);
        });
    }

    for (const [fps, hz, paints] of [[30, 60, 30], [30, 144, 30], [0, 75, 75], [0, 144, 144]]) {
        it(`asks for ${paints} paints a second at ${fps || 'Display rate'} on a ${hz} Hz display`, async () => {
            expect(await rate({ [MAX_FPS]: fps }, hz)).toBe(paints);
        });
    }

    it('starts afresh after a long frame instead of catching up', async () => {
        const setDirty = warmUp(await start(NODES_ON, PAIR));
        frames(10, 144);
        setDirty.mockClear();
        page.now += 500;
        frames(3, 144);
        expect(setDirty).toHaveBeenCalledTimes(1);
    });
});

describe('Perf.Adaptive', () => {
    /** Classic Flow links, and Gentle Pulse nodes with their fireflies. */
    const ANIMATED = { ...NODES_ON, '🔗 Enhanced Links.Perf.Adaptive': true };

    /** The glow the next background pass strokes the link with. */
    function glow(canvas: FakeCanvas): number {
        canvas.setDirty(true, true);
        const back = canvas.back.paints.length;
        frames(1);
        return canvas.back.paints.slice(back).filter((p) => p.op === 'stroke' && p.style === '#99aa99').at(-1)?.shadowBlur ?? NaN;
    }

    /**
     * `count` frames of paints that take as long as frames at `paintHz`, where a frame with nothing painted comes as soon
     * as the display at `hz` gives it.
     */
    function heavy(canvas: FakeCanvas, count: number, paintHz = 20, hz = 60): void {
        let painted = true;
        for (let i = 0; i < count; i++) {
            const before = canvas.front.paints.length;
            frames(1, painted ? paintHz : hz);
            painted = canvas.front.paints.length > before;
        }
    }

    /** The fireflies Gentle Pulse draws whole on the first node, each one's core in its particle colour. */
    function fireflies(canvas: FakeCanvas): number {
        const rec = new CanvasRecorder();
        drawNodeFx(rec.ctx, 1, canvas.graph._nodes[0], 220, 120, clock, WHOLE, 1, false);
        return rec.paints.filter((p) => p.op === 'fill' && p.style === '#44aaff').length;
    }

    // A setting changed judges afresh, as the tests before left it.
    beforeEach(() => {
        preview('🔗 Enhanced Links.Perf.Adaptive', false);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("steps down a level a second while every frame takes over 1.5 times the cap's interval: link glows plain, then fewer particles, then still", async () => {
        const canvas = await start(ANIMATED, PAIR);
        frames(5);
        expect([adaptive.level, glow(canvas), fireflies(canvas)]).toEqual([0, 10, 12]);
        // 50 ms paints at the 60 fps cap: each 3 times its 16.7 ms, and the display's.
        heavy(canvas, 30);
        expect([adaptive.level, glow(canvas), fireflies(canvas)]).toEqual([PLAIN, 0, 12]);
        heavy(canvas, 30);
        expect([adaptive.level, fireflies(canvas)]).toEqual([THIN, 6]);
        heavy(canvas, 30);
        expect(adaptive.level).toBe(HELD);
        // Held still, nothing animates: the ticker stops.
        frames(3, 20);
        const requests = page.requests;
        frames(60);
        expect([live.links, live.nodes, page.requests]).toEqual([0, 0, requests]);
    });

    it('leaves a few frames unpainted before each step, and takes frames as slow as the display gives them, as at 30 Hz, for no slow frames', async () => {
        const canvas = await start(ANIMATED, PAIR);
        const setDirty = warmUp(canvas);
        frames(10 * 30, 30);
        expect(adaptive.level).toBe(0);
        // Asked for a paint at each frame but the four after the first slow second.
        expect(setDirty.mock.calls.length).toBe(10 * 30 - 4);
        // 100 ms paints there step down.
        heavy(canvas, 20, 10, 30);
        expect(adaptive.level).toBe(PLAIN);
    });

    it('takes a page busy elsewhere for a while, which makes one long gap between quick frames, for no slow frames', async () => {
        await start(ANIMATED, PAIR);
        for (let i = 0; i < 4; i++) {
            frames(20);
            frames(1, 1.2);
        }
        expect(adaptive.level).toBe(0);
    });

    it("judges no frame while the view pans or zooms or nodes are dragged, which cost what the frontend's own drawing costs", async () => {
        const canvas = await start(ANIMATED, PAIR);
        frames(5);
        for (let i = 0; i < 30; i++) {
            canvas.ds.offset[0] -= 1;
            frames(1, 20);
        }
        canvas.ds.offset[0] = 0;
        canvas.isDragging = true;
        frames(30, 20);
        canvas.isDragging = false;
        expect(adaptive.level).toBe(0);
    });

    it('comes back up a step after 5 s with room, waits twice as long after a step up its frames could not keep, and 5 s again after one they kept', async () => {
        const canvas = await start(ANIMATED, PAIR);
        heavy(canvas, 30);
        expect(adaptive.level).toBe(PLAIN);
        frames(4.5 * 60);
        expect(adaptive.level).toBe(PLAIN);
        let more = 0;
        for (; adaptive.level && more < 2 * 60; more++) frames(1);
        expect(adaptive.level).toBe(0);
        // Slow again at once: the step back down comes a second later.
        heavy(canvas, 30);
        expect(adaptive.level).toBe(PLAIN);
        frames(6.5 * 60);
        expect(adaptive.level).toBe(PLAIN);
        frames(5.5 * 60);
        expect(adaptive.level).toBe(0);
        frames(3 * 60);
        heavy(canvas, 30);
        expect(adaptive.level).toBe(PLAIN);
        frames(4.5 * 60);
        expect(adaptive.level).toBe(PLAIN);
        frames(60);
        expect(adaptive.level).toBe(0);
    });

    it('tries a step up from still once the wait is over, as nothing paints to judge it by', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
        const canvas = await start(ANIMATED, PAIR);
        heavy(canvas, 80);
        expect(adaptive.level).toBe(HELD);
        vi.advanceTimersByTime(4900);
        expect(adaptive.level).toBe(HELD);
        vi.advanceTimersByTime(100);
        expect(adaptive.level).toBe(THIN);
        frames(2);
        expect(live.links).toBeGreaterThan(0);
    });

    it('brings full quality back with any setting changed, Perf.Adaptive off included, and stays there while it is off', async () => {
        const canvas = await start(ANIMATED, PAIR);
        heavy(canvas, 55);
        expect(adaptive.level).toBe(THIN);
        preview('🔗 Enhanced Links.Thickness', 4);
        expect(adaptive.level).toBe(0);
        heavy(canvas, 30);
        expect(adaptive.level).toBe(PLAIN);
        preview('🔗 Enhanced Links.Perf.Adaptive', false);
        frames(70, 20);
        expect(adaptive.level).toBe(0);
    });
});

describe('Motion', () => {
    const MOTION = '🔗 Enhanced Links.Motion';
    const reduced = (matches: boolean) => {
        fake.reducedMotion.matches = matches;
        fake.reducedMotion.dispatchEvent(new Event('change'));
    };
    const animating = () => {
        frames(5);
        page.requests = 0;
        frames(30);
        return page.requests > 0;
    };

    it('Reduce holds effects still though the system asks for full motion, Full animates them though it asks for less, and Follow system does as it asks', async () => {
        await start({ ...NODES_ON, [MOTION]: 'reduce' }, PAIR);
        expect(animating()).toBe(false);
        reduced(true);
        await app.extensionManager.setting.set(MOTION, 'full');
        expect(animating()).toBe(true);
        await app.extensionManager.setting.set(MOTION, 'system');
        expect(animating()).toBe(false);
        reduced(false);
        expect(animating()).toBe(true);
    });

    it('overrides the disable-animations class 1.57.1 puts on the body, both ways', async () => {
        await start({ ...NODES_ON, [MOTION]: 'full' }, PAIR);
        document.body.classList.add('disable-animations');
        await Promise.resolve();
        expect(animating()).toBe(true);
        preview(MOTION, 'system');
        expect(animating()).toBe(false);
        document.body.classList.remove('disable-animations');
        await Promise.resolve();
        preview(MOTION, 'reduce');
        expect(animating()).toBe(false);
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
        const drawn = (count: number) => {
            const before = motion(canvas);
            frames(count);
            return motion(canvas) - before;
        };
        expect(drawn(1)).toBe(PER_PASS);
        const replacement = vi.fn();
        canvas.onDrawForeground = replacement;
        // The link count of the pass it missed runs on, so the ticker chains it again on its next frame.
        expect(drawn(1)).toBe(0);
        frames(2);
        expect(canvas.onDrawForeground).not.toBe(replacement);
        expect(drawn(1)).toBe(PER_PASS);
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
        expect(motion(canvas)).toBe(PER_PASS);
    });

    describe('replaced while nothing moved', () => {
        it('onRender, after our setup() and before the first frame', async () => {
            const canvas = await start({}, PAIR);
            const replacement = vi.fn();
            canvas.onRender = replacement;
            // The link pass counts the segments it recorded, so the ticker runs and chains our onRender again.
            frames(5);
            expect(canvas.onRender).not.toBe(replacement);
            const [before, calls] = [motion(canvas), replacement.mock.calls.length];
            frames(1);
            expect([motion(canvas) - before, replacement.mock.calls.length - calls, live.links]).toEqual([PER_PASS, 1, 1]);
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
            const before = motion(canvas);
            frames(1);
            expect(motion(canvas) - before).toBe(PER_PASS);
        });

        it('onDrawForeground, where links on top are drawn, before the first frame', async () => {
            const canvas = await start({}, PAIR);
            canvas.graph.config.links_ontop = true;
            const replacement = vi.fn();
            canvas.onDrawForeground = replacement;
            frames(5);
            expect(canvas.onDrawForeground).not.toBe(replacement);
            const before = motion(canvas);
            frames(1);
            expect(motion(canvas) - before).toBe(PER_PASS);
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
        const canvas = await start({ '🔗 Enhanced Links.Animate': 7 }, PAIR);
        // Every colour has a palette, so no colour makes Lava Flow's gradient throw any more; here it throws itself.
        vi.spyOn(MOVING, 7).mockImplementation(() => {
            throw new Error('boom');
        });
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
