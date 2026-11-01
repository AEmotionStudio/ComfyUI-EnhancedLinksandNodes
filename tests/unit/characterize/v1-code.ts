/**
 * v1's own code run against the fakes: git 1ecca1d:js/link_animations.js and
 * js/node_animations.js (old_*.js in the author's checkout are byte-identical).
 * Without that history, e.g. in a shallow clone, HAVE_V1 is false and the v1
 * tests skip; with CI set, importing this module throws instead.
 *
 * @module tests/unit/characterize/v1-code
 */

import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { vi } from 'vitest';
import type { ComfyNode } from '@/core/types';
import { app, api, fake, resetFakeApp } from '../../helpers/fake-app';
import type { NodeClock } from './v1-inputs';

const V1_COMMIT = '1ecca1d3f25d000f71edf0ef38db5c72df1157d7';
let gitError = '';

function show(file: string): string | null {
    try {
        return execFileSync('git', ['-C', resolve(__dirname, '../../..'), 'show', `${V1_COMMIT}:js/${file}`], {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (error) {
        gitError ||= String((error as { stderr?: string }).stderr || error).trim();
        return null;
    }
}

const LINKS = show('link_animations.js');
const NODES = show('node_animations.js');
export const HAVE_V1 = LINKS !== null && NODES !== null;
if (!HAVE_V1 && process.env.CI) {
    throw new Error(`git show ${V1_COMMIT} failed, so the v1 tests cannot run (a CI checkout needs fetch-depth: 0): ${gitError}`);
}

type Locals = Record<string, any>;

/**
 * Evaluate a v1 extension file against the fakes and expose some closure locals of its setup().
 * Its registration is taken back out, so fake.extensions only ever lists the v2 extensions.
 */
async function run(source: string, name: string, anchor: string, locals: string): Promise<Locals> {
    const registered = fake.extensions.length;
    new Function('app', 'api', source
        .replace(/^import .*$/gm, '')
        .replace(/^export /gm, '')
        .replace(anchor, `globalThis.__v1 = { ${locals} };\n${anchor}`))(app, api);
    await fake.extensions.splice(registered).find(e => e.name === name)?.setup?.(app);
    return (globalThis as unknown as { __v1: Locals }).__v1;
}

/**
 * Both v1 extensions set up on an empty settings file, so v1 reads its own registered defaults.
 * Stubs requestAnimationFrame and console.log; undo with vi.restoreAllMocks() and vi.unstubAllGlobals().
 */
export async function setupV1(): Promise<{ links: Locals; nodes: Locals }> {
    resetFakeApp({});
    // v1's node extension wraps drawNodeShape, as native fills the node's body, title bar included, in the shadow its
    // drawNode set, then turns the shadow off (FE157 LGraphCanvas.ts L5880-5911).
    Object.assign(fake.LGraphCanvas.prototype, {
        drawNodeShape(_node: unknown, ctx: CanvasRenderingContext2D, size: [number, number], _fgcolor: string, bgcolor: string) {
            ctx.fillStyle = bgcolor;
            ctx.beginPath();
            ctx.rect(0, -30, size[0], size[1] + 30);
            ctx.fill();
            ctx.shadowColor = 'transparent';
        },
    });
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    return {
        links: await run(LINKS!, 'enhanced.link.animations', '// 🚀 Initialize Animation System', 'State, AnimationState, StaticRenderers'),
        nodes: await run(NODES!, 'enhanced.node.animations', '// Enhanced animation loop', 'State, ParticleController, AnimationEffects, TextAnimator'),
    };
}

/**
 * A v1 node effect the way its drawNodeShape called it (:2054-2101): node.color is the title
 * colour, which custom colour mode ignores; particles-only nodes get intensity 0.
 */
export function drawV1Effect(
    nodes: Locals,
    effect: string,
    ctx: CanvasRenderingContext2D,
    node: ComfyNode,
    clock: NodeClock,
    particlesOnly = false,
): void {
    nodes.State.totalTime = clock.totalTime;
    nodes.ParticleController.phase = clock.particlePhase;
    nodes.ParticleController.lastUpdate = performance.now(); // the 16 ms gate holds the phase
    nodes.AnimationEffects[effect](ctx, { ...node, color: '#353535', particlesOnly }, clock.phase, particlesOnly ? 0 : 1.0 * 1.5);
}
