/**
 * Each stored setting reaches what it drives. The traces store v1's inputs,
 * where many settings share a value (Thickness and Marker.Size are both 3,
 * the node particle settings mostly 1), so they cannot tell two snapshot keys
 * apart; these give each setting its own value.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STILL_PHASE } from '@/core/engine';
import { preview } from '@/core/settings';
import { STILL } from '@/links/stills';
import { frames, offscreens, start, type FakeCanvas } from '../../helpers/fake-litegraph';

beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', () => 0);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const PARTICLES = {
    '📦 Enhanced Nodes.Particle.Show': true,
    '📦 Enhanced Nodes.Particle.Density': 2,
    '📦 Enhanced Nodes.Particle.Speed': 3.1,
    '📦 Enhanced Nodes.Particle.Intensity': 0.4,
    '📦 Enhanced Nodes.Particle.Size': 2.6,
    '📦 Enhanced Nodes.Particle.Glow': 0.9,
    '📦 Enhanced Nodes.Quality': 3,
    '📦 Enhanced Nodes.Animation.Size': 1.7,
    '📦 Enhanced Nodes.Direction': -1,
};

/** A 220×120 KSampler node's first frame, hovered or not, with link effects off. */
async function drawNode(settings: Record<string, unknown>, hovered = false): Promise<FakeCanvas> {
    const canvas = await start({ ...settings, '🔗 Enhanced Links.Animate': 0 }, { nodes: [{ pos: [100, 100], size: [220, 120], title: 'KSampler' }] });
    canvas.graph._nodes[0].mouseOver = hovered;
    frames(1);
    return canvas;
}

/** The paints of a frame in a colour, or in a gradient. */
const inColour = (canvas: FakeCanvas, style: string) => canvas.front.paints.filter((p) => p.style === style);

describe('node settings', () => {
    it("reach Neon Nexus: v1's energy, its bloom, the particles and their colours", async () => {
        const canvas = await drawNode({
            ...PARTICLES,
            '📦 Enhanced Nodes.Animate': 2,
            '📦 Enhanced Nodes.Intensity': 1.3,
            '📦 Enhanced Nodes.Animation.Glow': 0.7,
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Color.Primary': '#102030',
            '📦 Enhanced Nodes.Color.Particle': '#405060',
        });
        // The tube's first layer glows 12 × Intensity × 1.5 × Animation.Glow, and its bright line 20 ×, on each side of
        // the body's edge; the energy grid's lines in the same colour do not glow.
        const tube = inColour(canvas, '#102030').filter((p) => p.op === 'stroke' && p.shadowBlur > 0).map((p) => p.shadowBlur);
        expect(tube).toHaveLength(4);
        [12, 20, 12, 20].forEach((f, i) => expect(tube[i]).toBeCloseTo(f * 1.3 * 1.5 * 0.7, 9));
        // Its 70 hexagons in the particle colour, glowing 5 × Particle.Glow, each drawn once or on both sides.
        const hexes = inColour(canvas, '#405060');
        expect(hexes.length).toBeGreaterThanOrEqual(70);
        expect(new Set(hexes.map((p) => p.shadowBlur))).toEqual(new Set([5 * 0.9]));
    });

    it('reach the particles of a node without an effect: Gentle Pulse\'s fireflies', async () => {
        const canvas = await drawNode(PARTICLES);
        // floor((8 + 2 × Quality) × Density) fireflies, each a glow and a core in Gentle Pulse's primary colour; some on both sides.
        const cores = inColour(canvas, '#44aaff');
        expect(cores.length).toBeGreaterThanOrEqual(28);
        expect(cores.length).toBeLessThan(2 * 28);
        // Their core is 0.6 of (4 + Quality) × Animation.Size × Particle.Size, flickering by up to 0.7 + 0.4 + 0.3 of it.
        for (const p of cores) expect((p.box![2] - p.box![0]) / 2).toBeLessThanOrEqual(0.6 * 7 * 1.7 * 2.6 * 1.4 + 1e-9);
    });

    it("light the node with v1's halo and frame it while selected", async () => {
        const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Glow': 0.6, '📦 Enhanced Nodes.Color.Mode': 'custom', '📦 Enhanced Nodes.Color.Primary': '#102030', '📦 Enhanced Nodes.Color.Secondary': '#203040', '📦 Enhanced Nodes.Color.Accent': '#304050' }, { nodes: [{ pos: [100, 100] }] });
        canvas.graph._nodes[0].selected = true;
        frames(1);
        const body = inColour(canvas, '#353535')[0];
        expect([body.shadowColor, body.shadowBlur]).toEqual(['#102030', 10 * 0.6]);
        expect(canvas.front.paints.filter((p) => p.op === 'strokeRect').map((p) => [p.style, p.shadowColor, p.shadowBlur])).toEqual([['#203040', '#304050', 45 * 0.6], ['#203040', '#304050', 45 * 0.6]]);
        preview('📦 Enhanced Nodes.Selection.Glow', false);
        canvas.setDirty(true, true);
        const from = canvas.front.paints.length;
        frames(1);
        expect(canvas.front.paints.slice(from).filter((p) => p.op === 'strokeRect')).toEqual([]);
    });

    // Colours are stored without '#', as both frontends' colour pickers save them. v2.0.1 passed such a
    // value to the canvas as is, which ignored it, for the hover outline and every title style but neon.
    it('outline a hovered node', async () => {
        const canvas = await drawNode({
            '📦 Enhanced Nodes.Animate': 2,
            '📦 Enhanced Nodes.Color.Hover.Show': true,
            '📦 Enhanced Nodes.Color.Hover': '00ff00',
            '📦 Enhanced Nodes.Animation.Glow': 0.8,
        }, true);
        const outlines = canvas.front.paints.filter((p) => p.op === 'strokeRect');
        expect(outlines.map((p) => [p.style, p.shadowColor, p.shadowBlur])).toEqual([['rgba(0, 255, 0, 0.7)', 'rgba(0, 255, 0, 0.5)', 15 * 0.8], ['rgba(0, 255, 0, 0.7)', 'rgba(0, 255, 0, 0.5)', 15 * 0.8]]);
    });

    it('style and place the animated title', async () => {
        const canvas = await drawNode({
            '📦 Enhanced Nodes.Text.Animation.Enabled': true,
            '📦 Enhanced Nodes.Text.Style': 'retro',
            // Title color is for custom node colours, as in v1.
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Text.Color': 'ff0000',
            '📦 Enhanced Nodes.Text.Size': 18,
            '📦 Enhanced Nodes.Text.Glow': 0.8,
            '📦 Enhanced Nodes.Text.Letter.Spacing': 1.5,
            '📦 Enhanced Nodes.Text.Position.X': 7,
            '📦 Enhanced Nodes.Text.Position.Y': -4,
        });
        const trace = canvas.front.trace();
        expect(trace).toContain('font = 18px Inter');
        expect(trace).toContain('letterSpacing = 1.5px');
        // Retro draws two offset copies, then the title itself: where native's starts, on the title bar's middle, moved by the offsets.
        expect(trace).toContain('fillText("KSampler", 37, -19)');
        expect(canvas.front.paints.filter((p) => p.op === 'fillText').at(-1)).toMatchObject({ style: '#ff0000', shadowColor: '#ff0000', shadowBlur: 3 * 0.8 });
    });
});

/** An IMAGE link from (311, 94) to (410, 94), its first frame drawn. */
async function drawLink(settings: Record<string, unknown>): Promise<FakeCanvas> {
    const canvas = await start(settings, { nodes: [{ pos: [100, 80] }, { pos: [400, 80] }], links: [{ from: 0, to: 1, type: 'IMAGE' }] });
    Object.assign((globalThis as unknown as { LGraphCanvas: { link_type_colors: Record<string, string> } }).LGraphCanvas.link_type_colors, { IMAGE: '#64B5F6' });
    frames(1);
    return canvas;
}

describe('link settings', () => {
    for (const still of [false, true]) {
        it(`reach Classic Flow ${still ? 'held still' : 'animated'}`, async () => {
            const made = offscreens.length;
            const canvas = await drawLink({
                '🔗 Enhanced Links.Static.Mode': still,
                '🔗 Enhanced Links.Direction': -1,
                '🔗 Enhanced Links.Animation.Speed': 2,
                '🔗 Enhanced Links.Thickness': 2.5,
                '🔗 Enhanced Links.Glow.Intensity': 7,
                '🔗 Enhanced Links.Link.Shadow.Enabled': true,
                '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
                '🔗 Enhanced Links.Shadow.Style': 'drop',
                '🔗 Enhanced Links.Shadow.Blur': 2,
                '🔗 Enhanced Links.Shadow.Offset': 6,
                '🔗 Enhanced Links.Marker.Size': 4.5,
                '🔗 Enhanced Links.Marker.Glow': 13,
                '🔗 Enhanced Links.Marker.Color.Mode': 'custom',
                '🔗 Enhanced Links.Marker.Color': '#123456',
            });
            // The link's body is drawn into the background, and its markers too while still, else over it; the node bodies are #353535.
            const strokes = canvas.back.paints.filter((p) => p.op === 'stroke').map((p) => [p.style, p.lineWidth, p.shadowBlur, p.shadowOffsetX]);
            const marks = (still ? canvas.back : canvas.front).paints.filter((p) => p.op === 'fill' && p.style !== '#353535').map((p) => [p.style, p.shadowBlur, p.shadowOffsetX]);
            // The path strokes at 0.8 × the width it is handed; floor(3 × Quality × Marker.Size × density × 0.5) markers, then the native centre marker.
            expect(strokes).toEqual([['rgba(0, 0, 0, 0.95)', 2.5 * 1.2 * 0.8, 2 * 4, 6 * 3], ['#64b5f6', 2.5 * 0.8, 7, 0]]);
            // Moving markers glow from a sprite stamped under each, which the canvas cast with that glow (fx/particles.ts).
            const glow = still ? 13 : 0;
            expect(marks).toEqual([...Array(3).fill(['#123456', glow, 0]), ['#64b5f6', 0, 0]]);
            // Past the front pass's copy of the background.
            expect(canvas.front.paints.filter((p) => p.op === 'drawImage')).toHaveLength(still ? 1 : 4);
            const cast = offscreens.slice(made).flatMap((sprite) => sprite.paints).map((p) => [p.op, p.shadowColor, p.shadowBlur]);
            expect(cast).toEqual(still ? [] : [['fill', '#123456', 13]]);
            // Going Reverse, the arrows along the level link point back toward its output.
            const turns = (still ? canvas.back : canvas.front).lines.filter((line) => line.startsWith('rotate('));
            expect(turns).toEqual(Array(3).fill('rotate(3.14)'));
        });
    }

    it("hold v1's first still pose, whatever changed before", async () => {
        const still = vi.spyOn(STILL, 2);
        const canvas = await drawLink({ '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Animate': 2 });
        const pose = () => {
            canvas.setDirty(true, true);
            frames(1);
            return still.mock.lastCall?.[2];
        };
        const poses = [pose(), pose()];
        // v2 moved its pose by 2π on the first still frame after Animate, Link.Style, Quality or Particle.Density changed.
        preview('🔗 Enhanced Links.Quality', 2);
        poses.push(pose());
        preview('🔗 Enhanced Links.Static.Mode', false);
        preview('🔗 Enhanced Links.Link.Style', 'dotted');
        frames(3);
        preview('🔗 Enhanced Links.Static.Mode', true);
        poses.push(pose());
        expect(poses).toEqual(Array(4).fill(STILL_PHASE));
        expect(STILL_PHASE).toBe((9 * Math.PI) / 4);
    });
});
