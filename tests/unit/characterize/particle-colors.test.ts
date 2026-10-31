/**
 * v2's node particle colours: Gentle Pulse with particles on, in each
 * Particle.Color.Mode, with the style's colours and with custom ones (v1's, so
 * they differ from Gentle Pulse's palette). v2's complementary is the accent
 * colour's opposite hue, where v1 took the particle colour's. The traces are
 * what v2.0.1's drawNode hook drew; the node layers must hand Gentle Pulse the
 * same settings, particle time and colours, under the node and on it, and this
 * draws what they hand it.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock } from '@/core/engine';
import { gentlePulse } from '@/effects/node-effects';
import { CanvasRecorder } from '../../helpers/recording-context';
import { freezeTimeAndRandom } from '../../helpers/rng';
import { frames, start } from '../../helpers/fake-litegraph';

/** What each call to the node effect was handed. */
const handed = vi.hoisted(() => [] as unknown[]);

vi.mock('@/effects/node-effects', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/effects/node-effects')>()),
    getNodeEffect: () => (...args: unknown[]) => void handed.push(args),
}));

const SEED = 0x5eed;
const MODES = ['default', 'rainbow', 'complementary', 'energy', 'quantum', 'aurora'];
const CUSTOM = { '📦 Enhanced Nodes.Color.Primary': '#ffb300', '📦 Enhanced Nodes.Color.Secondary': '#fb00ff', '📦 Enhanced Nodes.Color.Accent': '#9d00ff' };

afterEach(() => {
    vi.restoreAllMocks();
});

/**
 * Where v2's node loop had both node phases after 60 ticks at 60 Hz, from 1000 ms: each tick added
 * (2π/15) × its smoothed frame delta at speed 1, and the delta warmed up from 0, so they moved 0.85 s.
 */
function v2PhaseAfterOneSecond(): number {
    let [phase, delta, last] = [0, 0, 1000];
    for (let frame = 1; frame <= 60; frame++) {
        const now = 1000 + (frame * 1000) / 60;
        delta = delta * 0.9 + Math.min((now - last) / 1000, 1 / 30) * 0.1;
        last = now;
        phase += ((2 * Math.PI) / 15) * delta;
    }
    return phase;
}

/** Puts the engine's node clocks where v2's were after a second at 60 Hz, draws a frame with one node, then draws Gentle Pulse with what it was handed. */
async function drawAfterOneSecond(title: string, settings: Record<string, unknown>): Promise<CanvasRecorder> {
    handed.length = 0;
    await start({ ...settings, '🔗 Enhanced Links.Animate': 0 }, { nodes: [{ pos: [300, 300], size: [220, 120], title: 'KSampler' }] });
    clock.nodePhase = clock.particlePhase = v2PhaseAfterOneSecond();
    frames(1);
    // Around the node and on it, the same node, settings, particle time and colour function.
    expect(handed).toHaveLength(2);
    expect(handed[1]).toEqual(handed[0]);
    const [, ...args] = handed[1] as Parameters<typeof gentlePulse>;
    freezeTimeAndRandom(2000, SEED);
    const rec = new CanvasRecorder();
    rec.note(title);
    rec.note('after 60 node-loop ticks at 60 Hz, node=220x120');
    rec.ctx.save();
    gentlePulse(rec.ctx, ...args);
    rec.ctx.restore();
    rec.assertBalanced();
    return rec;
}

describe('v2 particle colours', () => {
    for (const colorMode of ['default', 'custom']) {
        for (const mode of MODES) {
            it(`${mode} particles with ${colorMode} colours`, async () => {
                const rec = await drawAfterOneSecond(`v2 drawNode hook: Gentle Pulse, Particle.Color.Mode ${mode}, Color.Mode ${colorMode}`, {
                    ...CUSTOM,
                    '📦 Enhanced Nodes.Animate': 1,
                    '📦 Enhanced Nodes.Particle.Show': true,
                    '📦 Enhanced Nodes.Particle.Color.Mode': mode,
                    '📦 Enhanced Nodes.Color.Mode': colorMode,
                });
                await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v2/particle-colors/${mode}-${colorMode}.txt`);
            });
        }
    }
});
