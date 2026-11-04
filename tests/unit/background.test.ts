/**
 * Node backgrounds (nodes/shader.ts): the atlas the slots are packed into, the patterns' pace against MAX_FLASH_HZ,
 * what a browser without WebGL draws, where a background goes in the node's own drawing, and its clock. The shaders
 * themselves run in the browser (tests/e2e/background.spec.ts).
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { MAX_FLASH_HZ, advance, clock, live } from '@/core/engine';
import { BACKGROUND_OPTIONS, SETTINGS, preview } from '@/core/settings';
import { PATTERNS, available, pack, type Placed } from '@/nodes/shader';
import { fake } from '../helpers/fake-app';
import { frames, start, type FakeCanvas, type FakeNode } from '../helpers/fake-litegraph';

/** With `on`, every node has a background this pass, which draws a 10 × 10 image over its body. */
const probe = vi.hoisted(() => ({ on: false }));

vi.mock('@/nodes/shader', async (importOriginal) => {
    const shader = await importOriginal<typeof import('@/nodes/shader')>();
    return {
        ...shader,
        hasBackground: (node: Parameters<typeof shader.hasBackground>[0]) => probe.on || shader.hasBackground(node),
        drawBackground: (...args: Parameters<typeof shader.drawBackground>) => {
            if (!probe.on) return shader.drawBackground(...args);
            const [ctx, , w, h] = args;
            ctx.drawImage(new OffscreenCanvas(10, 10) as unknown as CanvasImageSource, 0, 0, 10, 10, 0, 0, w, h);
            return true;
        },
    };
});

afterEach(() => {
    probe.on = false;
});

const LINKS_OFF = { '🔗 Enhanced Links.Animate': 0 };
const KSAMPLER = { pos: [300, 300] as [number, number], size: [220, 120] as [number, number], title: 'KSampler' };

describe('the atlas', () => {
    it('lays slots out in shelves, tallest first, as they are, while they fit', () => {
        const out: Placed[] = [];
        expect(pack([{ w: 100, h: 50 }, { w: 120, h: 80 }, { w: 90, h: 60 }], 300, 300, out)).toBe(1);
        // 80 tall, then 60, then the 50 that no longer fits beside them, on a shelf of its own.
        expect(out).toEqual([{ x: 0, y: 80, w: 100, h: 50 }, { x: 0, y: 0, w: 120, h: 80 }, { x: 120, y: 0, w: 90, h: 60 }]);
    });

    it('shrinks them all alike so that together they take no more than it, and by 0.85 until the shelves hold them all', () => {
        const out: Placed[] = [];
        // Five 150 px squares fit 400 × 300 by area, but two to a shelf need three shelves: at 0.85, three to a shelf need two.
        const shrink = pack(Array.from({ length: 5 }, () => ({ w: 150, h: 150 })), 400, 300, out);
        expect(shrink).toBeCloseTo(0.85, 9);
        expect(out.map((p) => [p.x, p.y, p.w, p.h])).toEqual([[0, 0, 128, 128], [128, 0, 128, 128], [256, 0, 128, 128], [0, 128, 128, 128], [128, 128, 128, 128]]);
    });

    it('shrinks one larger than the atlas, as a node filling the view makes, until it fits', () => {
        const out: Placed[] = [];
        // The view and its margin, 1600 + 32 by 900 + 32 at Balanced, on an atlas half the view.
        expect(pack([{ w: 816, h: 466 }], 800, 450, out)).toBeCloseTo(450 / 466, 9);
        expect(out[0]).toEqual({ x: 0, y: 0, w: Math.ceil((816 * 450) / 466), h: 450 });
    });
});

describe('the patterns', () => {
    it("are one for each of Background's choices but None, each with three colours of its own", () => {
        expect(Object.keys(PATTERNS)).toEqual(BACKGROUND_OPTIONS.map((option) => option.value).filter((value) => value !== 'none'));
        for (const pattern of Object.values(PATTERNS)) for (const colour of pattern.colours) expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('swing at most MAX_FLASH_HZ times a second at the fastest Background.Speed', () => {
        const fastest = SETTINGS.find((s) => s.id === '📦 Enhanced Nodes.Background.Speed') as { max: number };
        for (const [name, pattern] of Object.entries(PATTERNS)) expect(pattern.hz * fastest.max, name).toBeLessThanOrEqual(MAX_FLASH_HZ);
    });
});

describe('a node background', () => {
    it('without WebGL draws none, and the nodes are drawn as native draws them', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Background': 'plasma' }, { nodes: [KSAMPLER] });
        frames(2);
        expect(available()).toBe(false);
        expect(canvas.front.lines.some((line) => line.startsWith('drawImage(image(10x10)'))).toBe(false);
        expect(live.nodes).toBe(0);
    });

    it("lies on the body over its fill, under what native draws there: the fill ours, native's see-through", async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Background': 'plasma' }, { nodes: [KSAMPLER] });
        probe.on = true;
        const from = canvas.front.lines.length;
        canvas.setDirty(true, true);
        frames(1);
        const lines = canvas.front.lines.slice(from);
        const image = lines.findIndex((line) => line.startsWith('drawImage(image(10x10)'));
        const fill = lines.lastIndexOf('fillStyle = #353535', image);
        // Ours: the body in its colour, with the shadow native casts, then the image clipped to the body; then native's
        // own drawing, its fill see-through.
        expect(lines.slice(fill - 4, fill)).toContain('shadowColor = rgba(0, 0, 0, 0.5)');
        expect(lines.slice(fill, image + 4)).toEqual([
            'fillStyle = #353535', 'beginPath()', 'roundRect(0, -30, 220, 150, [8])', 'fill()',
            'save()', 'beginPath()', 'roundRect(0, -30, 220, 150, [8])', 'clip()', 'drawImage(image(10x10), 0, 0, 10, 10, 0, 0, 220, 120)', 'restore()',
            'strokeStyle = #333333', 'fillStyle = rgba(0, 0, 0, 0)',
        ]);
    });

    it('is the node\'s own when its menu gave it one, None for none, and ignores what is not a background', async () => {
        const canvas = await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Background': 'plasma' }, { nodes: [KSAMPLER] });
        const [node] = canvas.graph._nodes as FakeNode[];
        type Item = { content: string; submenu?: { options: ({ content: string; callback?: () => void } | null)[] } };
        const menu = () => (fake.extensions.find((e) => e.name === 'enhanced.node.animations') as unknown as { getNodeMenuItems(node: FakeNode): Item[] }).getNodeMenuItems(node);
        const ticked = () => menu().find((item) => item.content === 'Node background')!.submenu!.options.filter((o) => o?.content.startsWith('✓')).map((o) => o!.content);
        expect(ticked()).toEqual(['✓ Use global (Plasma)']);
        menu().find((item) => item.content === 'Node background')!.submenu!.options.find((o) => o?.content === 'None')!.callback!();
        expect([node.properties.enhanced_fx_background, ticked()]).toEqual(['none', ['✓ None']]);
        node.properties.enhanced_fx_background = 'sparkles';
        expect(ticked()).toEqual(['✓ Use global (Plasma)']);
        // Nodes 2.0 draws the bodies itself, so its menu has none.
        LiteGraph.vueNodesMode = true;
        expect(menu().some((item) => item.content === 'Node background')).toBe(false);
        LiteGraph.vueNodesMode = false;
        (canvas as FakeCanvas).setDirty(true, true);
    });
});

describe('the background clock', () => {
    it('runs Background.Speed seconds a second while the nodes move, without a jump as Speed changes, round each hour', async () => {
        await start({ ...LINKS_OFF, '📦 Enhanced Nodes.Background': 'plasma' }, { nodes: [KSAMPLER] });
        const k = { ...clock, backgroundTime: 0 };
        const moving = { ...live, nodes: 1 };
        advance(k, 1, moving);
        expect(k.backgroundTime).toBeCloseTo(1, 9);
        preview('📦 Enhanced Nodes.Background.Speed', 2);
        advance(k, 0.5, moving);
        expect(k.backgroundTime).toBeCloseTo(2, 9);
        advance(k, 1, { ...live, nodes: 0 });
        expect(k.backgroundTime).toBeCloseTo(2, 9);
        // Round each hour.
        k.backgroundTime = 3599.5;
        advance(k, 0.5, moving);
        expect(k.backgroundTime).toBeCloseTo(0.5, 9);
    });
});
