/**
 * Checks the committed v1/ traces against v1's own code (v1-code.ts) on the
 * same inputs: each link trace must be what v1 drew, and each node trace in
 * nodes/ and nodes-rich/ too, but where they are v2's port of v1's effects,
 * which M0 drew them with: Neon Nexus without a redundant beginPath(), Gentle
 * Pulse in colours read right, and Flower of Life's dots shrunk and dimmed.
 * The files are read directly rather than snapshotted, so `vitest -u` cannot
 * rewrite the reference. v1 reads its own registered defaults plus the stored
 * values of each variant. Without the git history it skips; the committed
 * traces stay the reference.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Segment } from '@/links/pipeline';
import { parseColor, type CanvasRecorder } from '../../helpers/recording-context';
import { fake } from '../../helpers/fake-app';
import { HAVE_V1, drawV1Effect, setupV1 } from './v1-code';
import {
    LINK_STYLES, NODE_EFFECTS, V1_NODE_RICH_SETTINGS, V1_PARTICLE_TIME,
    traceLinkVariants, traceLinks, traceNodes, tracePathStyles, traceStaticLinks,
    type LinkDraw,
} from './v1-inputs';

type Locals = Record<string, any>;
/** The fake LGraphCanvas with the dispatcher v1's setup() adds to its prototype. */
type V1Canvas = InstanceType<typeof fake.LGraphCanvas> & {
    renderAnimationStyle(ctx: CanvasRenderingContext2D, items: Segment[], style: number, phase: number, isStatic: boolean): void;
};

let links: Locals;
let nodes: Locals;

/** A trace without its title line, which only names the code that drew it. */
const body = (trace: string) => trace.slice(trace.indexOf('\n') + 1);
const committed = (file: string) => body(readFileSync(resolve(__dirname, '../__traces__/v1', file), 'utf8'));

/** v1 on an empty settings file, so it reads its own registered defaults. */
function v1Body(draw: () => CanvasRecorder): string {
    fake.settings = new Map();
    return body(draw().trace());
}

// v1's renderers read AnimationState.direction, which only its own clock sets.
const v1Animated = (style: number): LinkDraw => (ctx, { items, phase, totalTime, direction }) => {
    links.State.totalTime = totalTime;
    links.AnimationState.direction = direction;
    (fake.LGraphCanvas.prototype as V1Canvas).renderAnimationStyle.call(new fake.LGraphCanvas(), ctx, items, style, phase, false);
};
const v1Static = (style: number): LinkDraw => (ctx, { items, phase, direction }) => {
    links.AnimationState.direction = direction;
    links.StaticRenderers[style].render(ctx, items, phase);
};

/** v1's own drawing of an effect, and the committed trace of it. */
function nodeTraces(effect: string, rich = false): [v1: string, committed: string] {
    const v1 = traceNodes('', V1_PARTICLE_TIME[effect], (ctx, { node, clock, particleColorMode }) => {
        const stored = rich ? { ...V1_NODE_RICH_SETTINGS, '📦 Enhanced Nodes.Particle.Color.Mode': particleColorMode } : {};
        fake.settings = new Map(Object.entries(stored));
        drawV1Effect(nodes, effect, ctx, node, clock);
    }, rich).trace();
    const [, slug] = NODE_EFFECTS.find(([name]) => name === effect)!;
    return [body(v1), committed(`${rich ? 'nodes-rich' : 'nodes'}/${slug}.txt`)];
}

beforeAll(async () => {
    if (HAVE_V1) ({ links, nodes } = await setupV1());
});

afterAll(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe.skipIf(!HAVE_V1)('v1 code draws the v1 traces', () => {
    for (const [style, slug, name] of LINK_STYLES) {
        it(`animated ${style} ${name}`, () => {
            expect(v1Body(() => traceLinks('', v1Animated(style)))).toBe(committed(`links-animated/${style}-${slug}.txt`));
        });

        it(`static ${style} ${name}`, () => {
            expect(v1Body(() => traceStaticLinks('', v1Static(style)))).toBe(committed(`links-static/${style}-${slug}.txt`));
        });

        it(`animated ${style} ${name} with other v1 settings`, () => {
            expect(v1Body(() => traceLinkVariants('', style, false, {}, v1Animated(style)))).toBe(committed(`links-rich/animated/${style}-${slug}.txt`));
        });

        it(`static ${style} ${name} with other v1 settings`, () => {
            expect(v1Body(() => traceLinkVariants('', style, true, {}, v1Static(style)))).toBe(committed(`links-rich/static/${style}-${slug}.txt`));
        });
    }

    it('Classic Flow in each Link.Style', () => {
        expect(v1Body(() => tracePathStyles('', {}, v1Animated(9)))).toBe(committed('links-rich/path-styles.txt'));
    });

    for (const rich of [false, true]) {
        const settings = rich ? ' with other v1 settings' : '';

        it(`cosmicRipple${settings}`, () => {
            const [v1, file] = nodeTraces('cosmicRipple', rich);
            expect(v1).toBe(file);
        });

        it(`neonNexus${settings}, apart from a redundant beginPath() before each hologram outline`, () => {
            const [v1, file] = nodeTraces('neonNexus', rich);
            expect(v1.replace(/^beginPath\(\)\n(?=beginPath\(\)\n)/gm, '')).toBe(file);
        });

        it(`gentlePulse${settings}, apart from v1's withAlpha`, () => {
            // v1's gentlePulse had its own withAlpha (old_node_animations.js:1231-1247) that read every colour as hex with
            // `parseInt(...) || 255`: the custom #ffb300/#fb00ff/#9d00ff glows and the #00ff15 hover outline came out as
            // #ffb3ff/#fbffff/#9dffff/#ffff15, and hsl() particle colours as rgba(255, 255, x), where the port read them right.
            const [v1, file] = nodeTraces('gentlePulse', rich);
            expect(v1).not.toBe(file);
            const pale = (line: string) => line.replace(/rgba\((\d+), (\d+), (\d+), /g, (_, r, g, b) => `rgba(${Number(r) || 255}, ${Number(g) || 255}, ${Number(b) || 255}, `);
            // The stops of a firefly's glow, in the frames whose particles take hsl() colours.
            const hsl = (frame: string) => /particles=(?!default)/.test(frame);
            const halo = /^(grad\d+)\.addColorStop\((0|0\.4|1), rgba\(/;
            const frames = (trace: string) => trace.split(/^(?=# )/m);
            const [mine, theirs] = [frames(v1), frames(file)];
            expect(mine.length).toBe(theirs.length);
            mine.forEach((frame, i) => {
                const lines = (text: string) => text.split('\n').map((line) => (hsl(text) && halo.test(line) && !line.includes('255, 255, 255') ? line.replace(/rgba\(.*\)\)$/, 'rgba(*))') : pale(line)));
                expect(lines(frame), frame.slice(0, frame.indexOf('\n'))).toEqual(lines(theirs[i]));
            });
        });

        it(`flowerOfLife${settings}, apart from the orbiting dots v2 shrank and dimmed`, () => {
            // v1 (old_node_animations.js:1885-1890): radius 2 × quality × size, blur 10 × glow, alpha 0.7 × glow and the
            // particle colour as shadow. The port ignored quality in the radius (6 px against at most 1.8 px at Quality 3),
            // used blur 5 × glow and alpha 0.6 × glow, and shadowed with withAlpha(colour, glow), which only matches at
            // Particle.Glow 1. It also set globalAlpha = 1 after its final restore(), which changes nothing.
            const [v1Trace, fileTrace] = nodeTraces('flowerOfLife', rich);
            const v1 = v1Trace.split('\n');
            const port = fileTrace.replace(/^restore\(\)\nglobalAlpha = 1\n(?=restore\(\)\n# )/gm, 'restore()\n').split('\n');
            expect(v1.length).toBe(port.length);
            const quality = rich ? 3 : 1;
            const glow = rich ? 0.5 : 1;
            const centre = (line: string) => line.replace(/, [^,]+, 0, 6\.28\)$/, '');
            const shadow = (line: string) => (line.startsWith('shadowColor = ') ? parseColor(line.slice('shadowColor = '.length)) : null);
            const dotChange = (a: string, b: string) => {
                const [sa, sb] = [shadow(a), shadow(b)];
                return (a === `shadowBlur = ${10 * glow}` && b === `shadowBlur = ${5 * glow}`) ||
                    (a === `globalAlpha = ${0.7 * glow}` && b === `globalAlpha = ${0.6 * glow}`) ||
                    (!!sa && !!sb && sa.slice(0, 3).join() === sb.slice(0, 3).join() && sa[3] === 1 && sb[3] === glow) ||
                    (a.startsWith('arc(') && a.endsWith(`, ${2 * quality}, 0, 6.28)`) && b.startsWith('arc(') && centre(a) === centre(b));
            };
            const changed = v1.map((line, i) => [line, port[i]]).filter(([a, b]) => a !== b);
            expect(changed.length).toBeGreaterThan(0);
            expect(changed.filter(([a, b]) => !dotChange(a, b))).toEqual([]);
        });
    }
});
