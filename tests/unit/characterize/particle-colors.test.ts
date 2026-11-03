/**
 * v3's particle colours (core/colors.ts particleColour) against the colours of
 * the nodes-rich traces: v1's getParticleColor in its custom colour mode
 * (v1-inputs.ts v1ParticleColor), in each Particle.Color.Mode, for every
 * particle and particle time those frames draw, in every effect's palette.
 * With Style colors the particles take the style's primary colour.
 */

import { describe, it, expect } from 'vitest';
import { TURN } from '@/core/engine';
import { nodePalette, particleColour } from '@/core/colors';
import { parseColor } from '../../helpers/recording-context';
import { V1_NODE_RICH_SETTINGS, V1_NODE_SETTINGS, storeSettings, v1ParticleColor } from './v1-inputs';

const MODES = ['default', 'rainbow', 'complementary', 'energy', 'quantum', 'aurora'];
/** The nodes-rich frames' times, and the particle times the effects take at them: TURN × it, and the time itself for Cosmic Ripple. */
const RICH_NODE_TIMES = [1.5, 3.7, 6.1, 8.3, 10.9, 13.4];
const TIMES = RICH_NODE_TIMES.flatMap((t) => [TURN * t, t]);
/** Sacred Rosette's 127 points at Quality 3 with two dots each number the most particles. */
const PARTICLES = 127 * 2;

describe('particle colours', () => {
    for (const mode of MODES) {
        it(`${mode} are v1's, in every effect's palette`, () => {
            storeSettings({ ...V1_NODE_SETTINGS, ...V1_NODE_RICH_SETTINGS, '📦 Enhanced Nodes.Particle.Color.Mode': mode });
            const v1 = v1ParticleColor(mode);
            for (let style = 0; style <= 4; style++) {
                for (const t of TIMES) {
                    for (let i = 0; i < PARTICLES; i++) expect(parseColor(particleColour(nodePalette(style), i, t, 0)), `style ${style}, t ${t}, particle ${i}`).toEqual(parseColor(v1(i, t, PARTICLES)));
                }
            }
        });
    }

    it("take the style's primary colour, through the scheme, with Style colors", () => {
        storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Color.Mode': 'default' });
        expect([1, 2, 3, 4].map((style) => particleColour(nodePalette(style), 0, 1, 0))).toEqual(['#44aaff', '#00ff88', '#ff00ff', '#ffcc00']);
        // Particles alone take Gentle Pulse's.
        expect(particleColour(nodePalette(0), 0, 1, 0)).toBe('#44aaff');
        storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Color.Mode': 'default', '📦 Enhanced Nodes.Color.Scheme': 'muted' });
        expect(particleColour(nodePalette(2), 0, 1, 0)).toBe(nodePalette(2).primary);
        expect(nodePalette(2).primary).not.toBe('#00ff88');
    });
});
