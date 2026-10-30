/**
 * Drives the v2 extensions' real hooks (drawConnections, drawNode) against the
 * fakes, the way ComfyUI loads them.
 *
 * @module tests/unit/characterize/v2-hooks
 */

import { vi } from 'vitest';
import { app, fake, resetFakeApp } from '../../helpers/fake-app';

/** Stores exactly `settings` and runs both extensions' setup() on fresh LiteGraph globals. */
export async function setupV2(settings: Record<string, unknown>): Promise<void> {
    resetFakeApp(settings);
    vi.useFakeTimers({ toFake: ['setTimeout'] }); // initSidebar's delayed registration never fires
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await import('@/extensions/link-animations');
    await import('@/extensions/node-animations');
    for (const name of ['enhanced.link.animations', 'enhanced.node.animations']) {
        await fake.extensions.find(e => e.name === name)?.setup?.(app);
    }
    vi.useRealTimers();
}

interface LinkSpec {
    start: ArrayLike<number>;
    end: ArrayLike<number>;
    type: string;
}

/** An LGraphCanvas over a graph of these links, in the dark palette, which has '' for INT. */
export function canvasWithLinks(specs: LinkSpec[]): { drawConnections(ctx: CanvasRenderingContext2D): void } {
    Object.assign(LGraphCanvas.link_type_colors, { IMAGE: '#64B5F6', INT: '' });
    const node = (id: number, pos: ArrayLike<number>) => ({
        id,
        flags: {},
        getConnectionPos: (_isInput: boolean, _slot: number, out: Float32Array) => out.set(pos),
    });
    const nodes: Record<number, unknown> = {};
    const links: Record<number, unknown> = {};
    specs.forEach(({ start, end, type }, i) => {
        nodes[2 * i + 1] = node(2 * i + 1, start);
        nodes[2 * i + 2] = node(2 * i + 2, end);
        links[i + 1] = { id: i + 1, origin_id: 2 * i + 1, origin_slot: 0, target_id: 2 * i + 2, target_slot: 0, type };
    });
    const canvas = new LGraphCanvas();
    canvas.graph = { links, _nodes_by_id: nodes };
    return canvas;
}
