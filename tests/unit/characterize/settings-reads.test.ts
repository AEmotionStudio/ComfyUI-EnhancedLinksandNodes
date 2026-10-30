/**
 * BUG: v2 reads its settings through the deprecated getSettingValue inside
 * every paint, per link and per particle, and again on every animation tick
 * (ComfyUI's getSettingValue then calls the settings store, which deep-clones
 * the value). These pin today's counts; expect 0 inside paints after M2.
 * Each paint must also draw, so a hook that hands off to the fake LiteGraph's
 * empty originals cannot pass with 0 reads.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NODE_DEFAULTS } from '@/core/config';
import { CanvasRecorder } from '../../helpers/recording-context';
import { fake } from '../../helpers/fake-app';
import { freezeTimeAndRandom } from '../../helpers/rng';
import { V1_LINK_SETTINGS } from './v1-inputs';
import { canvasWithLinks, setupV2 } from './v2-hooks';

let ticks: FrameRequestCallback[];

beforeEach(() => {
    freezeTimeAndRandom(1000, 1);
    ticks = [];
    vi.stubGlobal('requestAnimationFrame', (tick: FrameRequestCallback) => ticks.push(tick));
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function reads(paint: () => void): number {
    const before = fake.reads;
    paint();
    return fake.reads - before;
}

const links = (count: number) => canvasWithLinks(Array.from({ length: count }, (_, i) => ({ start: [100, 10 + i], end: [500, 10 + i], type: 'IMAGE' })));

describe('settings reads (BUG: expect 0 inside paints after M2)', () => {
    it('Classic Flow at v1 defaults reads 23 per drawConnections and 8 more per link', async () => {
        await setupV2(V1_LINK_SETTINGS);
        const rec = new CanvasRecorder();
        expect(reads(() => links(3).drawConnections(rec.ctx))).toBe(47);
        expect(reads(() => links(500).drawConnections(rec.ctx))).toBe(4023);
        expect(rec.paints.filter((p) => p.op === 'stroke').length).toBeGreaterThanOrEqual(503);
    });

    it('each node effect reads per drawNode, most of it per particle', async () => {
        const counts: Record<number, number> = {};
        for (const style of [1, 2, 3, 4]) {
            await setupV2({ ...NODE_DEFAULTS, '📦 Enhanced Nodes.Animate': style, '📦 Enhanced Nodes.Particle.Show': true });
            const node = { id: 1, title: 'KSampler', size: [220, 120], flags: {} };
            const rec = new CanvasRecorder();
            counts[style] = reads(() => new LGraphCanvas().drawNode(node, rec.ctx));
            expect(rec.paints.length, `style ${style}`).toBeGreaterThan(0);
        }
        expect(counts).toEqual({ 1: 83, 2: 373, 3: 273, 4: 1548 });
    });

    it('the animation loops read on every tick', async () => {
        await setupV2({ ...V1_LINK_SETTINGS, ...NODE_DEFAULTS, '📦 Enhanced Nodes.Animate': 1 });
        // setup() ran the link loop's first tick and queued the next, then queued the node loop.
        const [linkTick, nodeTick] = ticks;
        expect([reads(() => linkTick(1016)), reads(() => nodeTick(1016))]).toEqual([3, 8]);
    });
});
