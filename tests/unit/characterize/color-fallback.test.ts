/**
 * The link colour fallback. ComfyUI's palette service stores '' in
 * LGraphCanvas.link_type_colors for every type the palette lacks (INT, FLOAT,
 * STRING...). v1 and v2 drew with that '' and, for a type with no entry at all,
 * v2 with the default_connection_color object: the canvas ignored both as
 * styles, so those links took the previous link's colour, and addColorStop
 * threw on them. Links now take each segment's colour in native order
 * (pathRenderer.ts determineLinkColor): the type's colour if it has one, else
 * default_link_color.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { V1_LINK_SETTINGS } from './v1-inputs';
import { frames, start, type FakeCanvas, type GraphSpec } from '../../helpers/fake-litegraph';

const SHADOW = 'rgba(0, 0, 0, 0.95)';

// A palette colour, a palette gap ('') and a type with no entry.
const GRAPH: GraphSpec = {
    nodes: [{ pos: [100, 100] }, { pos: [600, 100] }, { pos: [100, 300] }, { pos: [600, 300] }, { pos: [100, 500] }, { pos: [600, 500] }],
    links: [{ from: 0, to: 1, type: 'IMAGE' }, { from: 2, to: 3, type: 'INT' }, { from: 4, to: 5, type: 'MY_CUSTOM_TYPE' }],
};

async function draw(settings: Record<string, unknown>): Promise<FakeCanvas> {
    const canvas = await start(settings, GRAPH);
    Object.assign((globalThis as unknown as { LGraphCanvas: { link_type_colors: Record<string, string> } }).LGraphCanvas.link_type_colors, { IMAGE: '#64B5F6', INT: '' });
    frames(1);
    return canvas;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('link colour fallback', () => {
    it('Classic Flow strokes "" and unknown types in the default link colour', async () => {
        const canvas = await draw({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Link.Shadow.Enabled': false, '🔗 Enhanced Links.Marker.Shadow.Enabled': false });
        for (const layer of [canvas.back, canvas.front]) expect(layer.lines.filter((line) => line.includes('[ignored'))).toEqual([]);
        expect(canvas.back.paints.filter((p) => p.op === 'stroke').map((p) => p.style)).toEqual(['#64b5f6', '#99aa99', '#99aa99']);

        // With v1's default shadows on, v2 drew those links in the black of the shadow pass before them.
        const v1 = await draw(V1_LINK_SETTINGS);
        // Link bodies are 3 × 0.8 wide; the shadow passes under them are 3.6 × 0.8.
        const bodies = v1.back.paints.filter((p) => p.op === 'stroke' && Math.abs(p.lineWidth - 2.4) < 0.01);
        expect(bodies.map((p) => p.style)).toEqual(['#64b5f6', '#99aa99', '#99aa99']);
        expect(v1.back.paints.filter((p) => p.op === 'stroke' && p.style === SHADOW)).toHaveLength(3);
    });

    it('Lava Flow draws "" links without throwing', async () => {
        const warn = vi.spyOn(console, 'warn');
        const canvas = await draw({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Animate': 7 });
        expect(canvas.front.lines.filter((line) => line.includes('threw'))).toEqual([]);
        expect(canvas.front.lines.filter((line) => line.includes('addColorStop(0,'))).toEqual([
            'grad1.addColorStop(0, #64b5f6)', 'grad2.addColorStop(0, #99aa99)', 'grad3.addColorStop(0, #99aa99)',
        ]);
        expect(warn).not.toHaveBeenCalled();
        canvas.front.assertBalanced();
    });
});
