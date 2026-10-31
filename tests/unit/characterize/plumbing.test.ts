/**
 * Each stored setting reaches what it drives. The traces store v1's inputs,
 * where many settings share a value (Thickness and Marker.Size are both 3,
 * the node particle settings mostly 1), so they cannot tell two snapshot keys
 * apart; these give each setting its own value.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { preview } from '@/core/settings';
import { renderAnimatedStyle } from '@/effects/animated-renderers';
import { renderStaticStyle } from '@/effects/static-renderers';
import { frames, start, type FakeCanvas } from '../../helpers/fake-litegraph';

/** The settings the node layers hand the node effect or the particles. */
const handed = vi.hoisted(() => ({ effect: [] as unknown[], particles: [] as unknown[] }));

vi.mock('@/effects/node-effects', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/effects/node-effects')>()),
    getNodeEffect: () => (_ctx: unknown, _node: unknown, settings: unknown) => void handed.effect.push(settings),
    drawParticles: (_ctx: unknown, _node: unknown, settings: unknown) => void handed.particles.push(settings),
}));

vi.mock('@/effects/animated-renderers', async (importOriginal) => {
    const renderers = await importOriginal<typeof import('@/effects/animated-renderers')>();
    return { ...renderers, renderAnimatedStyle: vi.fn(renderers.renderAnimatedStyle) };
});

vi.mock('@/effects/static-renderers', async (importOriginal) => {
    const renderers = await importOriginal<typeof import('@/effects/static-renderers')>();
    return { ...renderers, renderStaticStyle: vi.fn(renderers.renderStaticStyle) };
});

beforeEach(() => {
    handed.effect = [];
    handed.particles = [];
    vi.stubGlobal('requestAnimationFrame', () => 0);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const PARTICLES = {
    '📦 Enhanced Nodes.Particle.Show': true,
    '📦 Enhanced Nodes.Particle.Density': 2.2,
    '📦 Enhanced Nodes.Particle.Speed': 3.1,
    '📦 Enhanced Nodes.Particle.Intensity': 0.4,
    '📦 Enhanced Nodes.Particle.Size': 2.6,
    '📦 Enhanced Nodes.Particle.Glow': 1.9,
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

describe('node settings', () => {
    it('reach the node effect', async () => {
        await drawNode({
            ...PARTICLES,
            '📦 Enhanced Nodes.Animate': 2,
            '📦 Enhanced Nodes.Intensity': 1.3,
            '📦 Enhanced Nodes.Animation.Glow': 0.7,
            '📦 Enhanced Nodes.Animation.Speed': 2.5,
            '📦 Enhanced Nodes.Static.Mode': true,
            '📦 Enhanced Nodes.Glow': 1.2,
            '📦 Enhanced Nodes.Color.Hover': '#123456',
            '📦 Enhanced Nodes.Color.Hover.Show': true,
        });
        const settings = {
            animation: { intensity: 1.3 * 0.7, direction: -1, animSpeed: 2.5, isStaticMode: true },
            quality: { quality: 3, animationSize: 1.7, glowIntensity: 1.2 },
            particles: { showParticles: true, density: 2.2, speed: 3.1, intensity: 0.4, size: 2.6, glowIntensity: 1.9 },
            colors: { hoverColor: '#123456', showHover: true },
        };
        // Around the node and on it.
        expect(handed.effect).toMatchObject([settings, settings]);
    });

    it('reach the particles of a node without an effect', async () => {
        await drawNode(PARTICLES);
        const settings = {
            animation: { direction: -1 },
            quality: { quality: 3, animationSize: 1.7 },
            particles: { density: 2.2, speed: 3.1, intensity: 0.4, size: 2.6, glowIntensity: 1.9 },
        };
        expect(handed.particles).toMatchObject([settings, settings]);
    });

    // Colours are stored without '#', as both frontends' colour pickers save them. v2.0.1 passed such a
    // value to the canvas as is, which ignored it, for the hover outline and every title style but neon.
    it('outline a hovered node', async () => {
        const canvas = await drawNode({
            '📦 Enhanced Nodes.Animate': 1,
            '📦 Enhanced Nodes.Color.Hover.Show': true,
            '📦 Enhanced Nodes.Color.Hover': '00ff00',
            '📦 Enhanced Nodes.Glow': 1.2,
        }, true);
        const outlines = canvas.front.paints.filter((p) => p.op === 'strokeRect');
        expect(outlines.map((p) => [p.style, p.shadowColor, p.shadowBlur])).toEqual([['rgba(0, 255, 0, 0.7)', 'rgba(0, 255, 0, 0.5)', 15 * 1.2]]);
    });

    it('style and place the animated title', async () => {
        const canvas = await drawNode({
            '📦 Enhanced Nodes.Text.Animation.Enabled': true,
            '📦 Enhanced Nodes.Text.Style': 'retro',
            '📦 Enhanced Nodes.Text.Color': 'ff0000',
            '📦 Enhanced Nodes.Text.Size': 18,
            '📦 Enhanced Nodes.Text.Glow': 0.8,
            '📦 Enhanced Nodes.Text.Position.X': 7,
            '📦 Enhanced Nodes.Text.Position.Y': -4,
        });
        const trace = canvas.front.trace();
        expect(trace).toContain('font = 18px Arial');
        // Retro draws two offset copies, then the title itself: centred over the node, 15 px above it.
        expect(trace).toContain('fillText("KSampler", 117, -19)');
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
            const canvas = await drawLink({
                '🔗 Enhanced Links.Static.Mode': still,
                '🔗 Enhanced Links.Direction': -1,
                '🔗 Enhanced Links.Animation.Speed': 2,
                '🔗 Enhanced Links.Thickness': 2.5,
                '🔗 Enhanced Links.Glow.Intensity': 7,
                '🔗 Enhanced Links.Link.Shadow.Enabled': true,
                '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
                '🔗 Enhanced Links.Shadow.Blur': 2,
                '🔗 Enhanced Links.Shadow.Offset': 6,
                '🔗 Enhanced Links.Marker.Size': 4.5,
                '🔗 Enhanced Links.Marker.Glow': 13,
                '🔗 Enhanced Links.Marker.Color.Mode': 'custom',
                '🔗 Enhanced Links.Marker.Color': '#123456',
            });
            // Still links are drawn into the background, moving ones over it; the node bodies are #353535.
            const paints = (still ? canvas.back : canvas.front).paints;
            const strokes = paints.filter((p) => p.op === 'stroke').map((p) => [p.style, p.lineWidth, p.shadowBlur, p.shadowOffsetX]);
            const marks = paints.filter((p) => p.op === 'fill' && p.style !== '#353535').map((p) => [p.style, p.shadowBlur, p.shadowOffsetX]);
            // The path strokes at 0.8 × the width it is handed; floor(3 × Quality × Marker.Size × density × 0.5) markers, then the native centre marker.
            expect(strokes).toEqual([['rgba(0, 0, 0, 0.95)', 2.5 * 1.2 * 0.8, 2 * 4, 6 * 3], ['#64b5f6', 2.5 * 0.8, 7, 0]]);
            expect(marks).toEqual([...Array(3).fill(['#123456', 13, 0]), ['#64b5f6', 0, 0]]);
            if (!still) expect(vi.mocked(renderAnimatedStyle).mock.lastCall?.[4].direction).toBe(-1);
        });
    }

    it("hold v2's still pose, which moves when Animate, Link.Style, Quality or Particle.Density changed", async () => {
        const canvas = await drawLink({ '🔗 Enhanced Links.Static.Mode': true });
        const draw = () => {
            canvas.setDirty(true, true);
            frames(1);
        };
        const pose = () => {
            draw();
            return vi.mocked(renderStaticStyle).mock.lastCall?.[3];
        };
        const [first, again] = [pose(), pose()];
        preview('🔗 Enhanced Links.Thickness', 5);
        const afterThickness = pose();
        preview('🔗 Enhanced Links.Quality', 2);
        const afterQuality = pose();
        // A change that a moving frame saw still moves the next still pose.
        preview('🔗 Enhanced Links.Static.Mode', false);
        preview('🔗 Enhanced Links.Link.Style', 'dotted');
        draw();
        preview('🔗 Enhanced Links.Static.Mode', true);
        const afterStyle = pose();
        // In eighths of a turn: the pose is π/4 or 9π/4, depending on how often it moved before.
        const eighths = [first, again, afterThickness, afterQuality, afterStyle].map((phase) => Math.round(phase! / (Math.PI / 4)));
        const [held, moved] = eighths[0] === 9 ? [9, 1] : [1, 9];
        expect(eighths).toEqual([held, held, held, moved, held]);
    });
});
