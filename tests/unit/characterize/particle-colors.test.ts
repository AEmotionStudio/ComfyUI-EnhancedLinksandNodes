/**
 * v2's node particle colours through the real drawNode hook: Gentle Pulse with
 * particles on, in each Particle.Color.Mode, with the style's colours and with
 * custom ones (v1's, so they differ from Gentle Pulse's palette). v2's
 * complementary is the accent colour's opposite hue, where v1 took the
 * particle colour's. These pin getParticleColor before M2 moves its reads.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { CanvasRecorder } from '../../helpers/recording-context';
import { fake } from '../../helpers/fake-app';
import { freezeTimeAndRandom } from '../../helpers/rng';
import { setupV2 } from './v2-hooks';

const SEED = 0x5eed;
const MODES = ['default', 'rainbow', 'complementary', 'energy', 'quantum', 'aurora'];
const CUSTOM = { '📦 Enhanced Nodes.Color.Primary': '#ffb300', '📦 Enhanced Nodes.Color.Secondary': '#fb00ff', '📦 Enhanced Nodes.Color.Accent': '#9d00ff' };

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

/** Sets up both extensions, runs the node loop for a second at 60 Hz on a frozen clock, so its phases are past 0, then draws one node. */
async function drawAfterOneSecond(title: string, settings: Record<string, unknown>): Promise<CanvasRecorder> {
    const ticks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (tick: FrameRequestCallback) => ticks.push(tick));
    freezeTimeAndRandom(1000, SEED);
    await setupV2(settings);
    // setup() queued the link loop, then the node loop, which queues itself again on every tick.
    for (let frame = 1; frame <= 60; frame++) {
        const now = 1000 + (frame * 1000) / 60;
        vi.mocked(performance.now).mockReturnValue(now);
        ticks[ticks.length - 1](now);
    }
    freezeTimeAndRandom(2000, SEED);
    const rec = new CanvasRecorder();
    rec.note(title);
    rec.note('after 60 node-loop ticks at 60 Hz, node=220x120');
    new fake.LGraphCanvas().drawNode({ id: 1, title: 'KSampler', size: [220, 120], flags: {} }, rec.ctx);
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
                expect(fake.native).toEqual(['drawNode']);
                await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v2/particle-colors/${mode}-${colorMode}.txt`);
            });
        }
    }
});
