/**
 * The completion effects (src/fx/bursts.ts) on the fake LiteGraph: the ticker
 * runs while a show plays and stops once it is over; a show draws only over
 * nodes of the graph on screen; and a show that keeps failing to draw is turned
 * off by the guard, which leaves the canvas as it found it and starts no more.
 * Each style plays as Completion.Style says, a third of a second apart over
 * several anchors, Surprise never twice alike, a path trace a shockwave where
 * the links cannot run it, and every style one soft glow with reduced motion.
 * The bursts as nodes finish pop on screen alone, six a second at most, 8 to 12
 * sparks each, and the ticker stops once they are over. The
 * fireworks' faithfulness to v1 is in the Level A and B tests and
 * v1-deviations.ts, the flash test there too, and the new styles' traces in
 * v3-traces.test.ts.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { guard, live } from '@/core/engine';
import { preview } from '@/core/settings';
import { endBursts } from '@/fx/bursts';
import * as particles from '@/fx/particles';
import { app, fake } from '../helpers/fake-app';
import { frames, page, progress, run, send, start, type FakeCanvas, type GraphSpec } from '../helpers/fake-litegraph';

afterEach(() => {
    vi.restoreAllMocks();
    fake.reducedMotion.matches = false;
    fake.reducedMotion.dispatchEvent(new Event('change'));
});

const STYLE = '📦 Enhanced Nodes.Completion.Style';
const PER_NODE = '📦 Enhanced Nodes.Completion.PerNode';

const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Completion.Style': 'fireworks' };
const OUTPUT: GraphSpec = { nodes: [{ pos: [300, 400], output: true }] };

/** The fills a front pass made with the 'lighter' composite the fireworks draw with. */
const lit = (paints: { composite: string; op: string }[]) => paints.filter((p) => p.composite === 'lighter' && p.op !== 'drawImage').length;

describe('fireworks', () => {
    it('keep the ticker running while they play, and stop it once they are over', async () => {
        const canvas = await start(LINKS_OFF, OUTPUT);
        frames(5);
        expect(page.requests).toBe(0);
        run('ticker', [1]);
        frames(60);
        expect(page.requests).toBeGreaterThanOrEqual(60);
        expect(live.bursts).toBeGreaterThan(0);
        frames(20);
        expect(live.bursts).toBe(0);
        page.requests = 0;
        const from = canvas.front.paints.length;
        frames(30);
        expect(page.requests).toBe(0);
        expect(canvas.front.paints.length).toBe(from);
    });

    it("go off over the output nodes this client's run reached, ran or taken from the cache, in the workflow it ran in", async () => {
        await start(LINKS_OFF, { nodes: [{ pos: [300, 400], output: true }, { pos: [900, 400], output: true }, { pos: [600, 700] }] });
        /** How many nodes a run's show goes off over, each three bursts of a core, 250 sparks and 40 sparkles; then it ends, and the next can start 3 s after it. */
        const anchors = (prompt: string, ran: number[], cached: number[] = []) => {
            run(prompt, ran, cached);
            const count = live.bursts / (3 * (1 + 250 + 40));
            frames(100);
            return count;
        };
        expect(anchors('first', [1, 3])).toBe(1);
        // Not over the first run's output node, which the second did not reach.
        expect(anchors('second', [3])).toBe(0);
        expect(anchors('cached', [3], [1, 2])).toBe(2);
        // A run that succeeds once another workflow shows, whose nodes have the same ids: 3 s after the last show, which a show waits for.
        frames(90);
        const workflow = app.extensionManager.workflow.activeWorkflow;
        send('execution_start', { prompt_id: 'switched', timestamp: 0 });
        progress('switched', { 1: 'running' });
        app.extensionManager.workflow.activeWorkflow = {};
        send('execution_success', { prompt_id: 'switched', timestamp: 0 });
        expect(live.bursts).toBe(0);
        app.extensionManager.workflow.activeWorkflow = workflow;
        expect(anchors('back', [1])).toBe(1);
    });

    it('draw only over nodes of the graph on screen', async () => {
        const canvas = await start(LINKS_OFF, OUTPUT);
        run('elsewhere', [1]);
        const [node] = canvas.graph._nodes;
        // As when a subgraph is opened, or the node removed.
        node.graph = null;
        const from = canvas.front.paints.length;
        frames(20);
        expect(lit(canvas.front.paints.slice(from))).toBe(0);
        // The show still ends on time.
        expect(live.bursts).toBeGreaterThan(0);
        frames(60);
        expect(live.bursts).toBe(0);
    });

    it('leave the canvas as they found it when they fail, and the guard turns them off', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const canvas = await start(LINKS_OFF, OUTPUT);
        vi.spyOn(particles, 'disc').mockImplementation(() => {
            throw new Error('boom');
        });
        run('failing', [1]);
        frames(10);
        canvas.front.assertBalanced();
        expect(guard.off('Completion effect')).toBe(true);
        expect(fake.toasts).toEqual([expect.objectContaining({ summary: 'Completion effect turned off' })]);
        expect(warn).toHaveBeenCalledOnce();
        // Off: the show ends, and the next run starts none.
        frames(80);
        expect(live.bursts).toBe(0);
        run('after', [1]);
        expect(live.bursts).toBe(0);
    });
});

/** Load → Sample → Save, Save an output node, its links still. */
const CHAIN: GraphSpec = {
    nodes: [{ pos: [100, 300] }, { pos: [500, 300] }, { pos: [900, 300], output: true }],
    links: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
};
const STILL = { '🔗 Enhanced Links.Animate': 0 };
/** Three output nodes on screen. */
const OUTPUTS: GraphSpec = { nodes: [{ pos: [100, 400], output: true }, { pos: [600, 400], output: true }, { pos: [1100, 400], output: true }] };

/** The particles of the show playing, how many of each kind: CORE (0) and the rest for fireworks, GLOW 3, PIECE 4, RING 5, COMET 6. */
function kinds(): Record<number, number> {
    const counts: Record<number, number> = {};
    for (const kind of particles.pool.kind.subarray(0, particles.pool.count)) counts[kind] = (counts[kind] ?? 0) + 1;
    return counts;
}

/** The style of the show playing, by its particles. */
const style = () => ({ 0: 'fireworks', 3: 'glow', 4: 'confetti', 5: 'shockwave', 6: 'trace' })[particles.pool.kind[0]];

describe('the completion styles', () => {
    it('play confetti as 60 to 120 pieces over each anchor and a shockwave as a ring each, the anchors a third of a second apart', async () => {
        for (const [chosen, kind] of [['confetti', 4], ['shockwave', 5]] as const) {
            const canvas = await start({ ...STILL, [STYLE]: chosen }, OUTPUTS);
            frames(1);
            run(chosen, [1, 2, 3]);
            const counts = kinds();
            expect(Object.keys(counts), chosen).toEqual([String(kind)]);
            if (chosen === 'confetti') expect(counts[kind] >= 180 && counts[kind] <= 360, `${counts[kind]} pieces`).toBe(true);
            else expect(counts[kind]).toBe(3);
            // The frames each anchor's show first paints on: its node's middle, which its pieces or ring are round.
            const firsts = new Map<number, number>();
            for (let frame = 0; frame < 60; frame++) {
                const from = canvas.front.paints.length;
                frames(1);
                for (const { op, box, style: paint } of canvas.front.paints.slice(from)) {
                    if ((op !== 'fill' && op !== 'stroke') || !box || !['#44aaff', '#88ccff', '#0088ff'].includes(paint)) continue;
                    const anchor = Math.round(((box[0] + box[2]) / 2 - 210) / 500);
                    if (!firsts.has(anchor)) firsts.set(anchor, frame);
                }
            }
            // Nearest the middle of the view first.
            const starts = [1, 2, 0].map((anchor) => firsts.get(anchor)!);
            expect(starts[1] - starts[0], chosen).toBeGreaterThanOrEqual(19);
            expect(starts[2] - starts[1], chosen).toBeGreaterThanOrEqual(19);
            frames(120);
            expect(live.bursts, chosen).toBe(0);
        }
    });

    it('Surprise plays each of the four styles, never the one it played last, the same for the same runs', async () => {
        await start({ [STYLE]: 'random' }, CHAIN);
        frames(1);
        const surprises = () => {
            preview(STYLE, 'fireworks');
            run('before', [1, 2, 3]);
            const seen: unknown[] = [];
            for (let i = 0; i < 24; i++) {
                endBursts();
                page.now += 4000;
                preview(STYLE, 'random');
                run(`surprise ${i}`, [1, 2, 3]);
                seen.push(style());
            }
            endBursts();
            page.now += 4000;
            return seen;
        };
        const seen = surprises();
        expect(new Set(seen)).toEqual(new Set(['fireworks', 'confetti', 'shockwave', 'trace']));
        expect(['fireworks', ...seen].filter((s, i, all) => s === all[i - 1])).toEqual([]);
        expect(surprises()).toEqual(seen);
    });

    it('play a shockwave for a path trace with link effects off, links left to another extension, zoomed out past their floor, no link into a node the run reached, or the run visuals turned off', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const trace = async (settings: Record<string, unknown>, spec = CHAIN, scale = 1, tripped = false) => {
            const canvas = await start({ [STYLE]: 'trace', ...settings }, spec);
            canvas.ds.scale = scale;
            frames(1);
            // As when they failed too often, which the guard turns them off for.
            if (tripped) for (let i = 0; i < 5; i++) guard.fail('Run visuals', new Error('boom'));
            run(`trace ${scale}`, [1, 2, 3]);
            return style();
        };
        expect(await trace({})).toBe('trace');
        expect(await trace(STILL)).toBe('trace');
        expect(await trace({ '🔗 Enhanced Links.Enabled': false })).toBe('shockwave');
        expect(await trace({ '🔗 Enhanced Links.Coexist': 'defer' })).toBe('shockwave');
        expect(await trace({}, CHAIN, 0.2)).toBe('shockwave');
        expect(await trace({}, OUTPUTS)).toBe('shockwave');
        expect(await trace({}, CHAIN, 1, true)).toBe('shockwave');
    });

    it("show every style as the fireworks' one soft glow over each anchor with reduced motion", async () => {
        for (const chosen of ['fireworks', 'confetti', 'shockwave', 'trace']) {
            await start({ [STYLE]: chosen }, { ...CHAIN, nodes: [...CHAIN.nodes, { pos: [1300, 300], output: true }] });
            fake.reducedMotion.matches = true;
            fake.reducedMotion.dispatchEvent(new Event('change'));
            frames(1);
            run(`calm ${chosen}`, [1, 2, 3, 4]);
            expect(kinds(), chosen).toEqual({ 3: 2 });
        }
    });
});

describe('a burst as each node finishes', () => {
    /** Ten nodes on screen, the last taken from the cache, and one far off. */
    const ROW: GraphSpec = { nodes: [...Array.from({ length: 10 }, (_, i) => ({ pos: [40 + i * 150, 300] as [number, number], size: [120, 80] as [number, number] })), { pos: [5000, 5000] }] };

    /** The nodes whose top-right corner the front passes from `from` on drew sparks round, discs of a few px, and how many round each. */
    function popping(canvas: FakeCanvas, from: number): Map<number, number> {
        const sparks = canvas.front.lines.slice(from).flatMap((line) => {
            const at = /^arc\(([^,]+), ([^,]+), ([^,]+), 0, 6\.28\)$/.exec(line);
            return at && Number(at[3]) < 6 ? [[Number(at[1]), Number(at[2])]] : [];
        });
        return new Map(canvas.graph._nodes.flatMap(({ id, boundingRect: [x, y, w] }) => {
            const round = sparks.filter(([sx, sy]) => Math.hypot(sx - x - w, sy - y) < 60).length;
            return round ? [[id, round] as const] : [];
        }));
    }

    /** Runs `ran` in turn, a frame each, and returns the nodes that popped, in the order they first did; `sparks` gets how many sparks each first drew. */
    function finishing(canvas: FakeCanvas, prompt: string, ran: number[], cached: number[] = [], sparks: number[] = []): number[] {
        const popped = new Set<number>();
        const states: Parameters<typeof progress>[1] = Object.fromEntries(cached.map((id) => [id, 'finished']));
        send('execution_start', { prompt_id: prompt, timestamp: 0 });
        send('execution_cached', { prompt_id: prompt, nodes: cached.map(String), timestamp: 0 });
        progress(prompt, states);
        for (const id of ran) {
            progress(prompt, Object.assign(states, { [id]: 'running' }));
            progress(prompt, Object.assign(states, { [id]: 'finished' }));
            const from = canvas.front.lines.length;
            frames(1);
            for (const [node, round] of popping(canvas, from)) {
                if (!popped.has(node)) sparks.push(round);
                popped.add(node);
            }
        }
        return [...popped];
    }

    it('pops from each node of the run that finishes on screen, none from those taken from the cache or off screen, six a second at most', async () => {
        const canvas = await start({ ...STILL, [PER_NODE]: true }, ROW);
        frames(1);
        expect(finishing(canvas, 'first', [1, 2, 3, 4, 5, 6, 7, 8], [10])).toEqual([1, 2, 3, 4, 5, 6]);
        frames(60);
        expect(finishing(canvas, 'second', [9, 11, 1])).toEqual([9, 1]);
        // Off: none.
        frames(60);
        preview(PER_NODE, false);
        expect(finishing(canvas, 'off', [1, 2])).toEqual([]);
    });

    it("pops sparks 3 to 4 px in radius, in the palette's primary and secondary colours, darker on a light canvas", async () => {
        for (const [background, colours, others] of [['#222', ['#44aaff', '#88ccff'], ['#296699', '#527a99']], ['lightgray', ['#296699', '#527a99'], ['#44aaff', '#88ccff']]] as [string, string[], string[]][]) {
            const canvas = await start({ ...STILL, [PER_NODE]: true }, ROW);
            canvas.clear_background_color = background;
            frames(1);
            const [lines, paints] = [canvas.front.lines.length, canvas.front.paints.length];
            expect(finishing(canvas, background, [1])).toEqual([1]);
            const radii = canvas.front.lines.slice(lines).flatMap((line) => /^arc\([^,]+, [^,]+, ([^,]+), 0, 6\.28\)$/.exec(line)?.[1] ?? []).map(Number);
            expect(radii.length, background).toBeGreaterThanOrEqual(8);
            expect(radii.filter((r) => r < 3 || r > 4), background).toEqual([]);
            const fills = canvas.front.paints.slice(paints).filter((p) => p.op === 'fill').map((p) => p.style);
            expect(fills, background).toEqual(expect.arrayContaining(colours));
            for (const colour of others) expect(fills, background).not.toContain(colour);
        }
    });

    it('pops 8 to 12 sparks a burst, as many as its run and node draw', async () => {
        const canvas = await start({ ...STILL, [PER_NODE]: true }, ROW);
        frames(1);
        const sparks: number[] = [];
        for (let i = 0; i < 10; i++) {
            finishing(canvas, `sparks ${i}`, [1, 2, 3, 4, 5, 6], [], sparks);
            frames(60);
        }
        expect(sparks).toHaveLength(60);
        expect(new Set(sparks)).toEqual(new Set([8, 9, 10, 11, 12]));
    });

    it('keep the ticker running while they play, and stop it once they are over, with the ring, the river and the trail off', async () => {
        const canvas = await start({
            ...STILL, [PER_NODE]: true, '📦 Enhanced Nodes.Run.Ring': false, '🔗 Enhanced Links.Flow.River': false, '🔗 Enhanced Links.Flow.Trail': false,
            '📦 Enhanced Nodes.End Animation.Enabled': false,
        }, ROW);
        frames(1);
        expect(finishing(canvas, 'ticker', [1])).toEqual([1]);
        send('execution_success', { prompt_id: 'ticker', timestamp: 0 });
        page.requests = 0;
        frames(10);
        expect(page.requests).toBeGreaterThanOrEqual(10);
        frames(30);
        page.requests = 0;
        const from = canvas.front.paints.length;
        frames(30);
        expect(page.requests).toBe(0);
        expect(canvas.front.paints.length).toBe(from);
    });

    it('pop while Spotlight or Calm play, as the progress ring does, but not while Freeze holds the node effects; with reduced motion a ring fades instead', async () => {
        for (const mode of ['spotlight', 'calm', 'pause']) {
            const canvas = await start({ ...STILL, [PER_NODE]: true, '🔗 Enhanced Links.Pause.Mode': mode }, ROW);
            frames(1);
            expect(finishing(canvas, mode, [1, 2]), mode).toEqual(mode === 'pause' ? [] : [1, 2]);
        }
        const canvas = await start({ ...STILL, [PER_NODE]: true }, ROW);
        fake.reducedMotion.matches = true;
        fake.reducedMotion.dispatchEvent(new Event('change'));
        frames(1);
        expect(finishing(canvas, 'calm', [1])).toEqual([]);
        const [x, y, w] = canvas.graph._nodes[0].boundingRect;
        expect(canvas.front.lines).toContain(`arc(${x + w}, ${y}, 10, 0, 6.28)`);
    });
});
