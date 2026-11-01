/**
 * Level A node traces: v3's node effects (nodes/effects.ts) drawn whole, its
 * titles (nodes/text.ts) and its fireworks (fx/bursts.ts), in the Classic
 * config of v1's settings and at v1's clock (v1-inputs.ts), against what v1
 * drew, compared as level-a.ts says: nodes/, nodes-rich/ (Quality 3, the hover
 * outline, half the particle glow and each particle colour mode),
 * nodes-particles-only/ (Show base effect off), text/ and nodes/fireworks.txt. The committed Gentle Pulse and
 * Flower of Life traces in nodes/ and nodes-rich/ are v2's port of them, which
 * v1-crosscheck.test.ts shows: v3 draws v1's own, as their deviations say.
 * Each deviation that names these frames must change at least one.
 */

import { describe, it, expect, afterAll, vi } from 'vitest';
import { compare, stale } from './level-a';
import { NODE_EFFECTS, V1_NODE_RICH_SETTINGS, V1_PARTICLE_TIME, traceFireworks, traceNodes, v3NodeEffect, v3Title } from './v1-inputs';

const TEXT_STYLES = ['neon', 'cyberpunk', 'retro', 'pulse', 'minimal'];

afterAll(() => {
    vi.restoreAllMocks();
});

describe('v1 node traces', () => {
    NODE_EFFECTS.forEach(([effect, slug, name], i) => {
        const style = i + 1;

        it(name, () => {
            compare(`nodes/${slug}.txt`, traceNodes('', V1_PARTICLE_TIME[effect], v3NodeEffect(style)).trace());
        });

        it(`${name} with other v1 settings`, () => {
            compare(`nodes-rich/${slug}.txt`, traceNodes('', V1_PARTICLE_TIME[effect], v3NodeEffect(style, V1_NODE_RICH_SETTINGS), true).trace());
        });

        it(`${name}, particles only`, () => {
            compare(`nodes-particles-only/${slug}.txt`, traceNodes('', V1_PARTICLE_TIME[effect], v3NodeEffect(style, { '📦 Enhanced Nodes.Animations.Enabled': false }, true)).trace());
        });
    });

    for (const style of TEXT_STYLES) {
        it(`title text ${style}`, () => {
            compare(`text/${style}.txt`, traceNodes('', (c) => c.phase, v3Title(style)).trace());
        });
    }

    it('completion fireworks', () => {
        compare('nodes/fireworks.txt', traceFireworks('').trace());
    });

    it('lists only deviations that change a frame, or that the traces cannot show', () => {
        expect(stale()).toEqual([]);
    });
});
