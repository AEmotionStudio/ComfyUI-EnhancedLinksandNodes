/**
 * v2.0.1 read its settings through the deprecated getSettingValue inside every
 * paint, per link and per particle, and again on every tick of its two
 * animation loops (ComfyUI's getSettingValue then calls the settings store,
 * which deep-clones the value). Now paints and the engine's one ticker read the
 * snapshots that onChange keeps, and nothing calls app.ui.settings at all. Each
 * paint must also draw the effects, so a hook that leaves everything to native
 * drawing cannot pass with 0 reads.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { clock, live } from '@/core/engine';
import { preview } from '@/core/settings';
import { fake } from '../../helpers/fake-app';
import { frames, start, type GraphSpec } from '../../helpers/fake-litegraph';
import { freezeTimeAndRandom } from '../../helpers/rng';
import { V1_LINK_SETTINGS } from './v1-inputs';

beforeEach(() => {
    freezeTimeAndRandom(1000, 1);
});

afterEach(() => {
    vi.restoreAllMocks();
});

function reads(paint: () => void): number {
    const before = fake.reads;
    paint();
    return fake.reads - before;
}

/** `count` IMAGE links on screen, from 50 nodes on the left to 50 on the right. */
const links = (count: number): GraphSpec => ({
    nodes: Array.from({ length: 100 }, (_, i) => ({ pos: [i < 50 ? 100 : 900, (i % 50) * 13] })),
    links: Array.from({ length: count }, (_, i) => ({ from: i % 50, to: 50 + (i % 50), type: 'IMAGE' })),
});

/** A context that keeps what is set on it and draws nothing, so the plan's full size runs in seconds. */
function nothing(): CanvasRenderingContext2D {
    const gradient = { addColorStop() {} };
    const state: Record<PropertyKey, unknown> = {
        createLinearGradient: () => gradient,
        createRadialGradient: () => gradient,
        measureText: () => ({ width: 0 }),
    };
    const noop = () => {};
    return new Proxy({}, {
        get: (_, key) => (key in state ? state[key] : noop),
        set: (_, key, value) => ((state[key] = value), true),
    }) as CanvasRenderingContext2D;
}

describe('settings reads', () => {
    it('Classic Flow at v1 defaults reads nothing per link pass or per link', async () => {
        const canvas = await start(V1_LINK_SETTINGS, links(500));
        const strokes = () => canvas.front.paints.filter((p) => p.op === 'stroke').length;
        expect(reads(() => frames(1))).toBe(0);
        // A shadow and a body per link.
        expect(strokes()).toBe(1000);
        canvas.setDirty(true, true);
        expect(reads(() => frames(2))).toBe(0);
        expect(strokes()).toBe(3000);
        // Since start()'s reset: both extensions' setup() and these paints.
        expect(fake.legacyCalls).toBe(0);
    });

    it('the node layers read nothing per node, per particle or per title', async () => {
        const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Particle.Show': true, '📦 Enhanced Nodes.Text.Animation.Enabled': true }, {
            nodes: Array.from({ length: 20 }, (_, i) => ({ pos: [100 + (i % 5) * 300, 100 + Math.floor(i / 5) * 200] })),
        });
        // Past what the fake draws for each node: its body, its widget and its title.
        const effects = () => canvas.front.paints.filter((p) => p.op !== 'fillText' && p.style !== '#353535' && p.style !== '#222222').length;
        const counts: Record<number, number> = {};
        // Each effect, and particles alone (Animate 0).
        for (const style of [1, 2, 3, 4, 0]) {
            preview('📦 Enhanced Nodes.Animate', style);
            const painted = effects();
            counts[style] = reads(() => frames(2));
            expect(effects() - painted, `style ${style}`).toBeGreaterThan(20);
        }
        expect(counts).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
        expect(fake.legacyCalls).toBe(0);
    });

    it('500 segments and 200 nodes read nothing over 120 frames', async () => {
        // 450 links, 50 of them through a reroute, between two stacks of 100 nodes.
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true, '📦 Enhanced Nodes.Text.Animation.Enabled': true }, {
            nodes: Array.from({ length: 200 }, (_, i) => ({ pos: [(i < 100 ? 100 : 900) + (i % 10) * 30, (i % 100) * 8] })),
            links: Array.from({ length: 450 }, (_, i) => ({ from: i % 100, to: 100 + ((i * 7) % 100), type: 'IMAGE', reroutes: i < 50 ? [[700, 100 + i * 10]] : undefined })),
        });
        canvas.ctx = canvas.bgctx = nothing();
        expect(reads(() => frames(120))).toBe(0);
        // All of it on screen and moving: each segment, each node's effect and title, and its particles.
        expect(live).toEqual({ links: 500, nodes: 400, particles: 200 });
        expect(fake.legacyCalls).toBe(0);
    }, 30_000);

    it('the ticker reads nothing per tick', async () => {
        await start({ ...V1_LINK_SETTINGS, '📦 Enhanced Nodes.Animate': 1 }, { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1, type: 'IMAGE' }] });
        // Animated links and nodes on screen keep the ticker going: its first tick starts the clock, the next ones move it.
        frames(2);
        const before = { ...clock };
        expect(reads(() => frames(3))).toBe(0);
        expect(clock.linkPhase).toBeGreaterThan(before.linkPhase);
        expect(clock.nodePhase).toBeGreaterThan(before.nodePhase);
        expect(fake.legacyCalls).toBe(0);
    });
});
