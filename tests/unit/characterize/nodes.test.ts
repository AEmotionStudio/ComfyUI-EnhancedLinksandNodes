/**
 * Level A node traces: the exported v2 node effects driven with v1 inputs.
 * nodes-rich/ adds Quality 3, the hover outline, half particle glow and each
 * particle colour mode, in v1's colours (v1ParticleColor) rather than v2's
 * getParticleColor. v1-crosscheck.test.ts checks these files against v1's own
 * effects and pins where they differ: Gentle Pulse's colours and Flower of
 * Life's orbiting dots are the port's, not v1's. v1-features.test.ts traces
 * what v2 has no port of.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { drawParticles } from '@/effects/node-effects';
import { NODE_EFFECTS, V1_PARTICLE_TIME, traceNodes, v1NodeSettings, v1ParticleColor, v2NodeEffect } from './v1-inputs';

afterEach(() => {
    vi.restoreAllMocks();
});

describe('v1 node traces', () => {
    for (const [effect, slug, name] of NODE_EFFECTS) {
        it(name, async () => {
            const rec = traceNodes(`${name}: v2 node effect with v1 inputs`, V1_PARTICLE_TIME[effect], v2NodeEffect(effect));
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/nodes/${slug}.txt`);
        });

        it(`${name} with other v1 settings`, async () => {
            const rec = traceNodes(`${name}: v2 node effect with Quality 3, the hover outline, Particle.Glow 0.5 and each particle colour mode`, V1_PARTICLE_TIME[effect],
                v2NodeEffect(effect, true),
                true,
            );
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/nodes-rich/${slug}.txt`);
        });
    }
});

describe('v2 node traces', () => {
    // Not a v1 reference: v1 drew each style's own particles (v1/nodes-particles-only/).
    it('particles-only nodes get Gentle Pulse fireflies whatever the style', async () => {
        const rec = traceNodes('v2 particles-only path: drawParticles from the node centre for every style', V1_PARTICLE_TIME.gentlePulse,
            (ctx, { node, clock, particleTime }) => {
                ctx.translate(node.size[0] / 2, node.size[1] / 2);
                drawParticles(ctx, node, v1NodeSettings(clock.phase), particleTime, v1ParticleColor());
            },
        );
        await expect(rec.trace()).toMatchFileSnapshot('../__traces__/v2/particles-only.txt');
    });
});
