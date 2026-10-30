/**
 * Level A traces of what v1 drew and v2 has no port of, drawn by v1's own code:
 * completion fireworks, each style's own particles-only drawing, and the title
 * text styles. v2 ports drawAnimatedText, but its sidebar has no text controls
 * and the dialog shows Text.Style as a numeric slider, so only the default neon
 * is reachable; it also draws at y = -15, above the title bar, where v1's
 * drawNodeShape drew at y = 16, inside the node. The committed files are the
 * reference; without the git history these tests skip and the files stay.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { fake } from '../../helpers/fake-app';
import { HAVE_V1, drawV1Effect, setupV1 } from './v1-code';
import { V1_PARTICLE_TIME, traceFrames, traceNodes } from './v1-inputs';

const TEXT_STYLES = ['neon', 'cyberpunk', 'retro', 'pulse', 'minimal'];
/** State.completionPhase: the first two bursts with sparkles, all three, and fading out. */
const FIREWORK_PHASES = [0.15, 0.5, 0.9];
const EFFECTS: Array<[slug: string, effect: string]> = [
    ['1-gentle-pulse', 'gentlePulse'],
    ['2-neon-nexus', 'neonNexus'],
    ['3-cosmic-ripple', 'cosmicRipple'],
    ['4-flower-of-life', 'flowerOfLife'],
];

type Locals = Record<string, any>;
let nodes: Locals;

beforeAll(async () => {
    if (HAVE_V1) ({ nodes } = await setupV1());
});

afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe.skipIf(!HAVE_V1)('v1-only traces', () => {
    for (const style of TEXT_STYLES) {
        it(`title text ${style}`, async () => {
            fake.settings = new Map(Object.entries({ '📦 Enhanced Nodes.Text.Style': style }));
            // drawNodeShape (:2116-2121) draws the title after the effect, centred 16 px into the node.
            const rec = traceNodes(`v1 TextAnimator.drawAnimatedText, ${style}`, (c) => c.phase, (ctx, { node, clock }) =>
                nodes.TextAnimator.drawAnimatedText(ctx, node.title, node.size[0] / 2, 16, clock.phase),
            );
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/text/${style}.txt`);
        });
    }

    it('completion fireworks', async () => {
        fake.settings = new Map();
        // drawNodeShape (:2048-2052) draws them for each completing node, before the body, with intensity 1.
        const rec = traceFrames('v1 AnimationEffects.renderCompleteFireworks on a 1600x900 canvas', FIREWORK_PHASES.map(phase => [
            `completionPhase=${phase}`,
            (ctx) => nodes.AnimationEffects.renderCompleteFireworks(ctx, phase, 1),
        ]));
        await expect(rec.trace()).toMatchFileSnapshot('../__traces__/v1/nodes/fireworks.txt');
    });

    for (const [slug, effect] of EFFECTS) {
        it(`particles-only ${effect}`, async () => {
            fake.settings = new Map();
            // With Animations.Enabled off, drawNodeShape (:2064) marks the node particles-only and passes intensity 0.
            const rec = traceNodes(`v1 AnimationEffects.${effect}, particles only`, V1_PARTICLE_TIME[effect], (ctx, { node, clock }) =>
                drawV1Effect(nodes, effect, ctx, node, clock, true),
            );
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/nodes-particles-only/${slug}.txt`);
        });
    }
});
