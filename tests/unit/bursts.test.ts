/**
 * The fireworks (src/fx/bursts.ts) on the fake LiteGraph: the ticker runs
 * while a show plays and stops once it is over; a show draws only over nodes of
 * the graph on screen; and a show that keeps failing to draw is turned off by
 * the guard, which leaves the canvas as it found it and starts no more. Their
 * faithfulness to v1 is in the Level A and B tests and v1-deviations.ts.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { guard, live } from '@/core/engine';
import * as particles from '@/fx/particles';
import { api, fake } from '../helpers/fake-app';
import { frames, page, run, start, type GraphSpec } from '../helpers/fake-litegraph';

afterEach(() => {
    vi.restoreAllMocks();
});

const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0 };
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

    it("go off over the output nodes this client's run reached, ran or taken from the cache, on the graph it started on", async () => {
        const canvas = await start(LINKS_OFF, { nodes: [{ pos: [300, 400], output: true }, { pos: [900, 400], output: true }, { pos: [600, 700] }] });
        /** How many nodes a run's show goes off over, each three bursts of a core, 250 sparks and 40 sparkles; then it ends. */
        const anchors = (prompt: string, ran: number[], cached: number[] = []) => {
            run(prompt, ran, cached);
            const count = live.bursts / (3 * (1 + 250 + 40));
            frames(90);
            return count;
        };
        expect(anchors('first', [1, 3])).toBe(1);
        // Not over the first run's output node, which the second did not reach.
        expect(anchors('second', [3])).toBe(0);
        expect(anchors('cached', [3], [1, 2])).toBe(2);
        // A run that succeeds once another graph is on screen, with nodes of the same ids: another workflow, or a subgraph.
        const send = (type: string, detail: unknown) => api.dispatchEvent(new CustomEvent(type, { detail }));
        send('execution_start', { prompt_id: 'switched', timestamp: 0 });
        send('executing', '1');
        Object.assign(canvas, { graph: { nodes: canvas.graph.nodes } });
        send('execution_success', { prompt_id: 'switched', timestamp: 0 });
        expect(live.bursts).toBe(0);
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
        expect(guard.off('Fireworks')).toBe(true);
        expect(fake.toasts).toEqual([expect.objectContaining({ summary: 'Fireworks turned off' })]);
        expect(warn).toHaveBeenCalledOnce();
        // Off: the show ends, and the next run starts none.
        frames(80);
        expect(live.bursts).toBe(0);
        run('after', [1]);
        expect(live.bursts).toBe(0);
    });
});
