/**
 * Looks (src/ui/looks.ts) through the fake frontend: the curated looks, what
 * applying one writes and its undo, the first-run picker's choices, previews,
 * the user's looks in their user data, look files, and Surprise me.
 */

import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { L, LOOK, N, SETTINGS, commit, normalize, preview, setting, shown } from '@/core/settings';
import { LOOKS, applyLook, changed, currentLook, deleteLook, exportLook, importLook, previewLook, renameLook, saveLook, surprise, userLooks, type Look } from '@/ui/looks';
import { app, fake, resetFakeApp } from '../helpers/fake-app';
import { V1_LINK_SETTINGS, V1_NODE_SETTINGS } from './characterize/v1-inputs';

const FILE = 'enhanced-links-nodes/looks.json';
const THICKNESS = '🔗 Enhanced Links.Thickness';

/** The settings looks leave alone, away from their defaults. */
const ALONE: Record<string, unknown> = {
    '🔗 Enhanced Links.Enabled': false,
    '📦 Enhanced Nodes.Enabled': false,
    '🔗 Enhanced Links.Perf.MaxFps': 30,
    '🔗 Enhanced Links.Motion': 'reduce',
    '🔗 Enhanced Links.Coexist': 'ours',
    '🔗 Enhanced Links.Panel.State': { tab: 'nodes', advanced: true, search: 'glow' },
    '🔗 Enhanced Links.WhatsNew.Seen': '3.0.0',
};

/** The v2.0.1 defaults v3 changed, which the v2 panel's Reset saved into users' settings. */
const V2_CHANGED: Record<string, unknown> = {
    '🔗 Enhanced Links.Link.Shadow.Enabled': false,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
    '📦 Enhanced Nodes.Color.Primary': '#44aaff',
    '📦 Enhanced Nodes.Color.Secondary': '#88ccff',
    '📦 Enhanced Nodes.Color.Accent': '#0088ff',
    '📦 Enhanced Nodes.Color.Particle': '#ffff00',
    '📦 Enhanced Nodes.End Animation.Enabled': false,
};

const look = (id: string) => LOOKS.find((l) => l.id === id)!;
const lookable = SETTINGS.filter((s) => s.type !== 'hidden' && !('look' in s)).map((s) => s.id);
const showing = () => Object.fromEntries(SETTINGS.map((s) => [s.id, shown(s.id)]));
/** Lets the write queue drain: the fake store's writes finish within microtasks. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

beforeAll(async () => {
    await import('@/extensions/link-animations');
    await import('@/extensions/node-animations');
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('curated looks', () => {
    it('are the ten of the design, Subtle the defaults, each setting only what differs from them and looks may set, to valid values', () => {
        expect(LOOKS.map((l) => l.id)).toEqual(['off', 'subtle', 'showcase', 'performance', 'classic-v1', 'neon-night', 'lava-lamp', 'sacred-geometry', 'presenter', 'blueprint']);
        expect(look('subtle').values).toEqual({});
        for (const l of LOOKS) {
            expect(l.name, l.id).not.toBe('');
            expect(l.description, l.id).toMatch(/^\S.*\.$/);
            for (const [id, value] of Object.entries(l.values)) {
                expect(lookable, `${l.id}: ${id}`).toContain(id);
                expect(normalize(setting(id), value), `${l.id}: ${id}`).toBe(value);
                expect(value, `${l.id}: ${id}`).not.toBe(setting(id).default);
            }
        }
    });

    it("Classic v1 shows v1's settings, those the v1 traces draw", async () => {
        resetFakeApp();
        applyLook(look('classic-v1'));
        // v1 read Shadow.Blur and Shadow.Offset without registering them; its halo takes neither.
        const v1 = Object.entries({ ...V1_LINK_SETTINGS, ...V1_NODE_SETTINGS }).filter(([, value]) => !Number.isNaN(value));
        expect(v1.filter(([id, value]) => shown(id) !== value)).toEqual([]);
        await settle();
    });

    it("play the design's completion effects: the default shockwave, fireworks and a burst per node in Showcase, Classic v1's fireworks off", () => {
        const completion = (l: Look) => [
            l.values['📦 Enhanced Nodes.End Animation.Enabled'] ?? true,
            l.values['📦 Enhanced Nodes.Completion.Style'] ?? 'shockwave',
            l.values['📦 Enhanced Nodes.Completion.PerNode'] ?? false,
        ];
        expect(Object.fromEntries(LOOKS.map((l) => [l.id, completion(l)]))).toEqual({
            off: [false, 'shockwave', false],
            subtle: [true, 'shockwave', false],
            showcase: [true, 'fireworks', true],
            performance: [false, 'shockwave', false],
            'classic-v1': [false, 'fireworks', false],
            'neon-night': [true, 'confetti', false],
            'lava-lamp': [true, 'fireworks', false],
            'sacred-geometry': [true, 'trace', false],
            presenter: [true, 'shockwave', false],
            blueprint: [true, 'trace', false],
        });
    });

    it('Off leaves links, nodes and runs native', async () => {
        resetFakeApp();
        applyLook(look('off'));
        expect([L.animate, N.animate, N.particleShow, N.textAnimationEnabled, N.endAnimationEnabled]).toEqual([0, 0, false, false, false]);
        expect([L.flowRiver, L.flowTrail, N.runRing, N.runError]).toEqual([false, false, false, false]);
        await settle();
    });
});

describe('applying a look', () => {
    it('commits only the values that differ from what is saved, then Look, and its undo puts every one back', async () => {
        resetFakeApp({ ...ALONE, '🔗 Enhanced Links.Animate': 4, [THICKNESS]: 7 });
        const before = showing();
        const undo = applyLook(look('showcase'));
        await settle();
        // Showcase's link animation is saved already, and its node quality is the default; the thickness goes back to it.
        expect(fake.posts).toEqual([
            [THICKNESS, 3],
            ['🔗 Enhanced Links.Quality', 2],
            ['🔗 Enhanced Links.Particle.Density', 2],
            ['🔗 Enhanced Links.Glow.Intensity', 14],
            ['🔗 Enhanced Links.Blend', 'additive'],
            ['📦 Enhanced Nodes.Animate', 2],
            ['📦 Enhanced Nodes.Intensity', 1.2],
            ['📦 Enhanced Nodes.Glow', 1],
            ['📦 Enhanced Nodes.Particle.Show', true],
            ['📦 Enhanced Nodes.Particle.Glow', 1],
            ['📦 Enhanced Nodes.Particle.Color.Mode', 'aurora'],
            ['🔗 Enhanced Links.Pause.Mode', 'calm'],
            ['📦 Enhanced Nodes.Completion.Style', 'fireworks'],
            ['📦 Enhanced Nodes.Completion.PerNode', true],
            [LOOK, 'showcase'],
        ]);
        expect(currentLook()?.id).toBe('showcase');

        fake.posts = [];
        undo();
        await settle();
        expect(fake.posts.map(([id]) => id)).toEqual([THICKNESS, '🔗 Enhanced Links.Quality', '🔗 Enhanced Links.Particle.Density', '🔗 Enhanced Links.Glow.Intensity', '🔗 Enhanced Links.Blend',
            '📦 Enhanced Nodes.Animate', '📦 Enhanced Nodes.Intensity', '📦 Enhanced Nodes.Glow', '📦 Enhanced Nodes.Particle.Show', '📦 Enhanced Nodes.Particle.Glow',
            '📦 Enhanced Nodes.Particle.Color.Mode', '🔗 Enhanced Links.Pause.Mode', '📦 Enhanced Nodes.Completion.Style', '📦 Enhanced Nodes.Completion.PerNode', LOOK]);
        expect(showing()).toEqual(before);
    });

    it('never writes the master switches, Perf, Motion, Coexist or the hidden settings but Look, whatever the look', async () => {
        resetFakeApp(ALONE);
        for (const l of LOOKS) applyLook(l);
        await settle();
        expect(fake.posts.filter(([id]) => id in ALONE)).toEqual([]);
        for (const [id, value] of Object.entries(ALONE)) expect(app.extensionManager.setting.get(id), id).toEqual(value);
        // Looks set every setting they may, so the last one shows as it would on its own.
        expect(changed(look('blueprint'))).toBe(false);
    });

    it('names the look applied, marks it changed once a value differs, and names none for settings kept as they were', async () => {
        resetFakeApp();
        expect(currentLook()?.id).toBe('subtle');
        expect(changed(currentLook()!)).toBe(false);
        applyLook(look('blueprint'));
        expect([currentLook()?.id, changed(look('blueprint'))]).toEqual(['blueprint', false]);
        commit(THICKNESS, 6);
        expect(changed(look('blueprint'))).toBe(true);
        commit(LOOK, 'custom');
        expect(currentLook()).toBeUndefined();
        await settle();
    });

    it('previews a look without saving it, and ends the preview with what is saved', async () => {
        resetFakeApp({ [THICKNESS]: 7 });
        const before = showing();
        const end = previewLook(look('neon-night'));
        expect([L.animate, L.thickness, L.colorPrimary, N.particleColorMode]).toEqual([5, 3, '#00e5ff', 'energy']);
        end();
        expect(showing()).toEqual(before);
        await settle();
        expect(fake.posts).toEqual([]);
    });
});

describe("the first-run picker's choices", () => {
    it("Keep Subtle on v2.0.1's defaults saves the values that keep Subtle showing, and Look, and nothing shown changes", async () => {
        resetFakeApp(V2_CHANGED);
        const before = showing();
        applyLook(look('subtle'));
        await settle();
        expect(fake.posts).toEqual([...Object.keys(V2_CHANGED).map((id) => [id, setting(id).default]), [LOOK, 'subtle']]);
        expect(showing()).toEqual({ ...before, [LOOK]: 'subtle' });
    });

    it("Keep Subtle on a fresh install saves Look alone", async () => {
        resetFakeApp();
        applyLook(look('subtle'));
        await settle();
        expect(fake.posts).toEqual([[LOOK, 'subtle']]);
    });

    it('a pick undone shows the first run again as it was, the overlay too', async () => {
        resetFakeApp(V2_CHANGED);
        const before = showing();
        const undo = applyLook(look('performance'));
        expect([L.linkShadowEnabled, L.staticMode]).toEqual([false, true]);
        undo();
        expect(showing()).toEqual(before);
        // Undone before its writes reached the store, the pick writes nothing at all.
        await settle();
        expect(fake.posts).toEqual([]);
        expect(Object.fromEntries(fake.settings)).toEqual(V2_CHANGED);

        // And once they did.
        const again = applyLook(look('performance'));
        await settle();
        again();
        expect(showing()).toEqual(before);
        await settle();
        expect(Object.fromEntries(fake.settings)).toEqual({
            ...V2_CHANGED, '🔗 Enhanced Links.Static.Mode': false, '🔗 Enhanced Links.Glow.Intensity': 10, '🔗 Enhanced Links.Pause.Mode': 'spotlight', '🔗 Enhanced Links.Flow.Trail': true, [LOOK]: '',
        });
    });
});

describe("the user's looks", () => {
    it('save what shows, rename and delete, and a delete undone puts the look back where it was', async () => {
        fake.userData.clear();
        resetFakeApp({ [THICKNESS]: 6 });
        preview('🔗 Enhanced Links.Marker.Shape', 'star');
        const first = await saveLook('Stars');
        const second = await saveLook('Again');
        expect(first.id).not.toBe(second.id);
        expect(first).toMatchObject({ name: 'Stars', values: { [THICKNESS]: 6, '🔗 Enhanced Links.Marker.Shape': 'star' } });
        const saved = () => JSON.parse(fake.userData.get(FILE)!);
        expect(saved()).toEqual({ schema: 1, looks: [first, second] });

        await renameLook(first.id, 'Starry');
        expect(saved().looks.map((l: Look) => l.name)).toEqual(['Starry', 'Again']);
        const undo = await deleteLook(first.id);
        await deleteLook(first.id);
        expect(saved().looks.map((l: Look) => l.id)).toEqual([second.id]);
        await undo();
        expect(saved().looks.map((l: Look) => l.id)).toEqual([first.id, second.id]);
        expect(await userLooks()).toEqual(saved().looks);

        // Applied, a look of the user's is the current one.
        resetFakeApp();
        applyLook(first);
        expect(currentLook()).toBe(first);
        await settle();
    });
});

describe('look files', () => {
    it('import only the values a look may set, normalised, and list what was wrong', async () => {
        const { look, errors } = await importLook(JSON.stringify({
            app: 'comfyui-enhancedlinksandnodes', kind: 'look', schema: 1, name: '  Shared  ',
            values: {
                '🔗 Enhanced Links.Animate': '5',
                [THICKNESS]: 40,
                '🔗 Enhanced Links.Marker.Shape': 'blob',
                '🔗 Enhanced Links.Color.Primary': 'FF0000',
                '📦 Enhanced Nodes.Color.Primary': 'red',
                '📦 Enhanced Nodes.Glow': 0.8,
                '🔗 Enhanced Links.Enabled': false,
                [LOOK]: 'showcase',
                'Comfy.LinkRenderMode': 2,
                // Names every object has, which no setting is.
                constructor: 1,
                toString: 1,
            },
        }));
        expect(look).toMatchObject({ name: 'Shared', description: '' });
        expect(look!.values).toEqual({
            '🔗 Enhanced Links.Animate': 5, [THICKNESS]: 10, '🔗 Enhanced Links.Marker.Shape': 'arrow', '🔗 Enhanced Links.Color.Primary': '#ff0000', '📦 Enhanced Nodes.Glow': 0.8,
        });
        expect(errors).toEqual([
            'Link animation: "5" became 5.',
            'Link thickness: 40 became 10.',
            'Marker shape: "blob" became "arrow".',
            'Link primary color: "FF0000" became "#ff0000".',
            'Node primary color: "red" is no color, so it was left out.',
            'Looks leave Link effects alone, so it was left out.',
            'Looks leave Current look alone, so it was left out.',
            'Comfy.LinkRenderMode is not a setting looks know, so it was left out.',
            'constructor is not a setting looks know, so it was left out.',
            'toString is not a setting looks know, so it was left out.',
        ]);
        expect((await userLooks()).at(-1)).toBe(look);
    });

    it('import nothing from a file that holds no look', async () => {
        const count = (await userLooks()).length;
        expect(await importLook('{"values": ')).toEqual({ errors: ['The file is not JSON.'] });
        for (const text of ['[]', '{"name": "No values"}', '{"kind": "workflow", "values": {}}']) {
            expect(await importLook(text), text).toEqual({ errors: ['The file holds no look.'] });
        }
        expect(await userLooks()).toHaveLength(count);
    });

    it('export what import reads back unchanged', async () => {
        const text = exportLook(look('neon-night'));
        expect(JSON.parse(text)).toEqual({ app: 'comfyui-enhancedlinksandnodes', kind: 'look', schema: 1, name: 'Neon Night', values: look('neon-night').values });
        const { look: imported, errors } = await importLook(text);
        expect(errors).toEqual([]);
        expect(imported).toMatchObject({ name: 'Neon Night', values: look('neon-night').values });
    });
});

describe('Surprise me', () => {
    /** The mix a seed makes, as Look names it. */
    const mix = (seed: number) => {
        preview(LOOK, `surprise-${seed}`);
        return currentLook()!;
    };

    afterEach(() => {
        preview(LOOK, '');
    });

    it('mixes within the bounds, valid values for settings looks set, the same for the same seed', () => {
        for (let seed = 0; seed < 200; seed++) {
            const { id, values } = mix(seed);
            expect(id).toBe(`surprise-${seed}`);
            expect(mix(seed).values).toEqual(values);
            for (const [key, value] of Object.entries(values)) {
                expect(lookable, key).toContain(key);
                expect(normalize(setting(key), value), key).toBe(value);
            }
            expect(values['🔗 Enhanced Links.Animate']).not.toBe(0);
            for (const key of ['🔗 Enhanced Links.Animation.Speed', '📦 Enhanced Nodes.Animation.Speed']) {
                expect(values[key]).toBeGreaterThanOrEqual(0.6);
                expect(values[key]).toBeLessThanOrEqual(1.4);
            }
            expect(values['🔗 Enhanced Links.Glow.Intensity']).toBeGreaterThanOrEqual(6);
            expect(values['🔗 Enhanced Links.Glow.Intensity']).toBeLessThanOrEqual(16);
            expect([1, 2]).toContain(values['🔗 Enhanced Links.Quality']);
            expect([0.5, 1, 2]).toContain(values['🔗 Enhanced Links.Particle.Density']);
            expect(['fireworks', 'confetti', 'shockwave', 'trace']).toContain(values['📦 Enhanced Nodes.Completion.Style']);
        }
        expect(new Set(Array.from({ length: 200 }, (_, seed) => mix(seed).values['📦 Enhanced Nodes.Completion.Style'])).size).toBe(4);
        // Darker colours for a light palette, which the seed's lowest bit marks.
        const lightness = (seed: number) => {
            const colour = String(mix(seed).values['🔗 Enhanced Links.Color.Primary']);
            const [r, g, b] = [1, 3, 5].map((i) => parseInt(colour.slice(i, i + 2), 16));
            return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
        };
        expect(lightness(1)).toBeCloseTo(0.4, 1);
        expect(lightness(2)).toBeCloseTo(0.6, 1);
    });

    it('never mixes the link animation showing, and now and then picks a curated look other than Off and the one applied', () => {
        resetFakeApp({ '🔗 Enhanced Links.Animate': 4, [LOOK]: 'showcase' });
        const picks = Array.from({ length: 200 }, () => surprise());
        const mixes = picks.filter((l) => l.id.startsWith('surprise-'));
        expect(mixes.length).toBeGreaterThan(100);
        expect(mixes.filter((l) => l.values['🔗 Enhanced Links.Animate'] === 4)).toEqual([]);
        const curated = picks.filter((l) => !l.id.startsWith('surprise-'));
        expect(curated.length).toBeGreaterThan(0);
        expect(curated.every((l) => LOOKS.includes(l) && l.id !== 'off' && l.id !== 'showcase')).toBe(true);
    });
});

// Last, as each reads the file afresh in a new page, whose LiteGraph globals the rest of this file would get.
describe("the user's looks, read from their file", () => {
    /** The looks module of a new page, whose user data holds `file`. */
    async function page(file?: string) {
        vi.resetModules();
        const { fake } = await import('../helpers/fake-app');
        if (file !== undefined) fake.userData.set(FILE, file);
        return import('@/ui/looks');
    }

    it('are none while the file is not there', async () => {
        expect(await (await page()).userLooks()).toEqual([]);
    });

    it('keep what a look may set, and skip what is no look', async () => {
        const looks = await page(JSON.stringify({ schema: 1, looks: [
            { id: 'user-a', name: 'Mine', values: { '🔗 Enhanced Links.Animate': 5, '🔗 Enhanced Links.Enabled': false, 'Comfy.LinkRenderMode': 2, toString: 1 } },
            { name: 'No id' },
            'nonsense',
        ] }));
        expect(await looks.userLooks()).toEqual([{ id: 'user-a', name: 'Mine', description: '', values: { '🔗 Enhanced Links.Animate': 5 } }]);
    });
});
