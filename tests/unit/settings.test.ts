/**
 * The settings schema (src/core/settings.ts): the 64 v2.0.1 settings with their
 * defaults, options and ranges, the migrations the frontend applies to stored
 * and set values, registration through the fake frontend, and the writes the
 * sidebar makes.
 */

import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { L, N, SETTINGS, commit, linkSettings, nodeSettings, preview, reset } from '@/core/settings';
import { renderSettingsPanel } from '@/sidebar/SidebarSettings';
import { app, fake, resetFakeApp } from '../helpers/fake-app';
import { setupV2 } from './characterize/v2-hooks';

/** HEAD's (v2.0.1's) LINK_DEFAULTS and NODE_DEFAULTS from src/core/config.ts, without the two '... UI & Æmotion Studio About' ids. */
const V2_DEFAULTS: Record<string, unknown> = {
    '🔗 Enhanced Links.Animate': 9,
    '🔗 Enhanced Links.Animation.Speed': 1,
    '🔗 Enhanced Links.Color.Mode': 'default',
    '🔗 Enhanced Links.Color.Accent': '#9d00ff',
    '🔗 Enhanced Links.Color.Secondary': '#fb00ff',
    '🔗 Enhanced Links.Color.Primary': '#ffb300',
    '🔗 Enhanced Links.Color.Scheme': 'default',
    '🔗 Enhanced Links.Direction': 1,
    '🔗 Enhanced Links.Glow.Intensity': 10,
    '🔗 Enhanced Links.Link.Style': 'spline',
    '🔗 Enhanced Links.Marker.Enabled': true,
    '🔗 Enhanced Links.Marker.Effects': 'none',
    '🔗 Enhanced Links.Marker.Glow': 10,
    '🔗 Enhanced Links.Marker.Color': '#00fff7',
    '🔗 Enhanced Links.Marker.Color.Mode': 'default',
    '🔗 Enhanced Links.Marker.Size': 3,
    '🔗 Enhanced Links.Marker.Shape': 'arrow',
    '🔗 Enhanced Links.Particle.Density': 0.5,
    '🔗 Enhanced Links.Quality': 1,
    '🔗 Enhanced Links.Link.Shadow.Enabled': false,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
    '🔗 Enhanced Links.Thickness': 3,
    '🔗 Enhanced Links.Static.Mode': false,
    '🔗 Enhanced Links.Pause.During.Render': true,
    '🔗 Enhanced Links.Shadow.Blur': 5,
    '🔗 Enhanced Links.Shadow.Offset': 3,
    '📦 Enhanced Nodes.Animate': 0,
    '📦 Enhanced Nodes.Animation.Glow': 0.5,
    '📦 Enhanced Nodes.Animation.Size': 1,
    '📦 Enhanced Nodes.Animation.Speed': 1,
    '📦 Enhanced Nodes.Animations.Enabled': true,
    '📦 Enhanced Nodes.Color.Accent': '#0088ff',
    '📦 Enhanced Nodes.Color.Hover': '#00ff15',
    '📦 Enhanced Nodes.Color.Hover.Show': false,
    '📦 Enhanced Nodes.Color.Mode': 'default',
    '📦 Enhanced Nodes.Color.Particle': '#ffff00',
    '📦 Enhanced Nodes.Color.Primary': '#44aaff',
    '📦 Enhanced Nodes.Color.Scheme': 'default',
    '📦 Enhanced Nodes.Color.Secondary': '#88ccff',
    '📦 Enhanced Nodes.Direction': 1,
    '📦 Enhanced Nodes.End Animation.Enabled': false,
    '📦 Enhanced Nodes.Glow': 0.5,
    '📦 Enhanced Nodes.Glow.Show': true,
    '📦 Enhanced Nodes.Intensity': 1.0,
    '📦 Enhanced Nodes.Particle.Color.Mode': 'default',
    '📦 Enhanced Nodes.Particle.Density': 1,
    '📦 Enhanced Nodes.Particle.Glow': 0.5,
    '📦 Enhanced Nodes.Particle.Intensity': 1.0,
    '📦 Enhanced Nodes.Particle.Show': false,
    '📦 Enhanced Nodes.Particle.Size': 1.0,
    '📦 Enhanced Nodes.Particle.Speed': 1,
    '📦 Enhanced Nodes.Quality': 2,
    '📦 Enhanced Nodes.Static.Mode': false,
    '📦 Enhanced Nodes.Pause.During.Render': true,
    '📦 Enhanced Nodes.Text.Animation.Enabled': false,
    '📦 Enhanced Nodes.Text.Color': '#00ffff',
    '📦 Enhanced Nodes.Text.Glow': 0.5,
    '📦 Enhanced Nodes.Text.Size': 14,
    '📦 Enhanced Nodes.Text.Style': 'neon',
    '📦 Enhanced Nodes.Text.Letter.Spacing': 0,
    '📦 Enhanced Nodes.Text.Position.X': 0,
    '📦 Enhanced Nodes.Text.Position.Y': 0,
    '📦 Enhanced Nodes.Text.Rotation.Radius': 0,
    '📦 Enhanced Nodes.Text.Rotation.Angle': 0,
};

const DIRECTION = [1, -1];
const QUALITY = [1, 2, 3];
const COLOR_MODE = ['default', 'custom'];
const COLOR_SCHEME = ['default', 'saturated', 'vivid', 'contrast', 'bright', 'muted'];

/** v2.0.1's option values: src/ui/settings.ts and the sidebar's own lists, and for Text.Style the cases drawAnimatedText draws. */
const V2_OPTIONS: Record<string, unknown[]> = {
    '🔗 Enhanced Links.Animate': [0, 9, 1, 2, 3, 4, 5, 6, 7, 8],
    '🔗 Enhanced Links.Direction': DIRECTION,
    '🔗 Enhanced Links.Link.Style': ['spline', 'straight', 'linear', 'hidden', 'dotted', 'dashed', 'double', 'stepped', 'zigzag', 'rope', 'glowpath', 'chain', 'pulse', 'holographic'],
    '🔗 Enhanced Links.Quality': QUALITY,
    '🔗 Enhanced Links.Color.Mode': COLOR_MODE,
    '🔗 Enhanced Links.Color.Scheme': COLOR_SCHEME,
    '🔗 Enhanced Links.Marker.Shape': ['none', 'arrow', 'diamond', 'circle', 'square', 'triangle', 'star', 'heart', 'cross', 'hexagon', 'flower', 'spiral'],
    '🔗 Enhanced Links.Marker.Color.Mode': COLOR_MODE,
    '🔗 Enhanced Links.Marker.Effects': ['none', 'pulse', 'fade', 'rainbow'],
    '📦 Enhanced Nodes.Animate': [0, 1, 2, 3, 4],
    '📦 Enhanced Nodes.Direction': DIRECTION,
    '📦 Enhanced Nodes.Quality': QUALITY,
    '📦 Enhanced Nodes.Color.Mode': COLOR_MODE,
    '📦 Enhanced Nodes.Color.Scheme': COLOR_SCHEME,
    '📦 Enhanced Nodes.Particle.Color.Mode': ['default', 'rainbow', 'complementary', 'energy', 'quantum', 'aurora'],
    '📦 Enhanced Nodes.Text.Style': ['neon', 'cyberpunk', 'retro', 'pulse', 'minimal'],
};

/** [min, max, step] of v2.0.1's sidebar sliders; the Shadow and Text settings, which it has no slider for, take the v3 design's ranges. */
const V2_RANGES: Record<string, [min: number, max: number, step: number]> = {
    '🔗 Enhanced Links.Animation.Speed': [0.1, 5, 0.1],
    '🔗 Enhanced Links.Thickness': [1, 10, 0.5],
    '🔗 Enhanced Links.Particle.Density': [0, 2, 0.1],
    '🔗 Enhanced Links.Glow.Intensity': [0, 20, 1],
    '🔗 Enhanced Links.Marker.Size': [1, 5, 0.5],
    '🔗 Enhanced Links.Marker.Glow': [0, 20, 1],
    '🔗 Enhanced Links.Shadow.Blur': [0, 10, 0.5],
    '🔗 Enhanced Links.Shadow.Offset': [0, 10, 0.5],
    '📦 Enhanced Nodes.Animation.Speed': [0.1, 5, 0.1],
    '📦 Enhanced Nodes.Intensity': [0, 3, 0.1],
    '📦 Enhanced Nodes.Animation.Size': [0.5, 3, 0.1],
    '📦 Enhanced Nodes.Animation.Glow': [0, 2, 0.1],
    '📦 Enhanced Nodes.Glow': [0, 2, 0.1],
    '📦 Enhanced Nodes.Particle.Density': [0, 3, 0.1],
    '📦 Enhanced Nodes.Particle.Size': [0.1, 3, 0.1],
    '📦 Enhanced Nodes.Particle.Speed': [0.1, 5, 0.1],
    '📦 Enhanced Nodes.Particle.Intensity': [0, 3, 0.1],
    '📦 Enhanced Nodes.Particle.Glow': [0, 2, 0.1],
    '📦 Enhanced Nodes.Text.Size': [8, 24, 1],
    '📦 Enhanced Nodes.Text.Glow': [0, 1, 0.05],
    '📦 Enhanced Nodes.Text.Letter.Spacing': [-2, 10, 0.25],
    '📦 Enhanced Nodes.Text.Position.X': [-50, 50, 1],
    '📦 Enhanced Nodes.Text.Position.Y': [-50, 50, 1],
    '📦 Enhanced Nodes.Text.Rotation.Radius': [0, 50, 1],
    '📦 Enhanced Nodes.Text.Rotation.Angle': [-180, 180, 5],
};

type Entry = (typeof SETTINGS)[number];

const PARAMS = [...linkSettings, ...nodeSettings];
const params = (id: string) => PARAMS.find((p) => p.id === id)!;
const migrate = (id: string, value: unknown) => params(id).migrateDeprecatedValue!(value);

describe('settings schema', () => {
    it('defines exactly the 64 v2.0.1 settings, each once', () => {
        const ids = SETTINGS.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect([...ids].sort()).toEqual(Object.keys(V2_DEFAULTS).sort());
    });

    it('keeps the v2.0.1 defaults', () => {
        expect(Object.fromEntries(SETTINGS.map((s) => [s.id, s.default]))).toEqual(V2_DEFAULTS);
    });

    it('keeps the v2.0.1 options and the sidebar ranges', () => {
        expect(Object.fromEntries(SETTINGS.flatMap((s) => s.type === 'combo' ? [[s.id, s.options.map((o) => o.value)]] : []))).toEqual(V2_OPTIONS);
        expect(Object.fromEntries(SETTINGS.flatMap((s) => s.type === 'slider' ? [[s.id, [s.min, s.max, s.step]]] : []))).toEqual(V2_RANGES);
    });

    it('types each setting by its default, so no slider has a string default', () => {
        const kinds = { boolean: 'boolean', slider: 'number', color: 'string' } as const;
        for (const s of SETTINGS) {
            const kind = s.type === 'combo' ? typeof s.options[0].value : kinds[s.type];
            expect(typeof s.default, s.id).toBe(kind);
        }
    });

    it('allows every default by its options or range', () => {
        for (const s of SETTINGS) {
            if (s.type === 'slider') expect(s.min <= s.default && s.default <= s.max, s.id).toBe(true);
            if (s.type === 'combo') expect(s.options.map((o) => o.value), s.id).toContain(s.default);
            if (s.type === 'color') expect(s.default, s.id).toMatch(/^#[0-9a-f]{6}$/);
        }
    });

    it('names every setting uniquely, in text without emoji', () => {
        expect(new Set(SETTINGS.map((s) => s.name)).size).toBe(SETTINGS.length);
        const texts = SETTINGS.flatMap((s) => [s.name, s.group, 'tooltip' in s ? s.tooltip : '', ...(s.type === 'combo' ? s.options.map((o) => o.text) : [])]);
        for (const text of texts) expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    });

    it('keys each snapshot value by the id after its prefix, in camelCase', () => {
        const camel = (id: string) => id.slice(id.indexOf('.') + 1).split(/[. ]/).map((w, i) => (i ? w[0].toUpperCase() : w[0].toLowerCase()) + w.slice(1)).join('');
        for (const s of SETTINGS) expect(s.key, s.id).toBe(camel(s.id));
        expect(Object.keys(L)).toHaveLength(linkSettings.length);
        expect(Object.keys(N)).toHaveLength(nodeSettings.length);
    });

    it('gives each setting its own three-level dialog category, ordered as the schema', () => {
        expect(new Set(PARAMS.map((p) => p.category!.join('/'))).size).toBe(SETTINGS.length);
        for (const s of SETTINGS) expect(params(s.id).category, s.id).toEqual(['Enhanced Links & Nodes', s.group, s.id]);
        // The dialog sorts settings, and groups by their first setting, by descending sortOrder.
        expect(SETTINGS.map((s) => params(s.id).sortOrder)).toEqual(SETTINGS.map((_, i) => SETTINGS.length - i));
    });

    it('registers the link ids with the link extension and the node ids with the node extension', () => {
        expect(linkSettings.every((p) => p.id.startsWith('🔗 Enhanced Links.'))).toBe(true);
        expect(nodeSettings.every((p) => p.id.startsWith('📦 Enhanced Nodes.'))).toBe(true);
        expect(PARAMS).toHaveLength(SETTINGS.length);
    });

    it('hands the dialog each type with its range or options', () => {
        for (const s of SETTINGS) {
            const p = params(s.id);
            expect(p, s.id).toMatchObject({ name: s.name, type: s.type, defaultValue: s.default });
            expect(p.tooltip, s.id).toBe('tooltip' in s ? s.tooltip : undefined);
            expect(p.attrs, s.id).toEqual(s.type === 'slider' ? { min: s.min, max: s.max, step: s.step } : undefined);
            expect(p.options, s.id).toEqual(s.type === 'combo' ? s.options : undefined);
        }
    });
});

describe('migrateDeprecatedValue', () => {
    it.each<[rule: string, id: string, stored: unknown, migrated: unknown]>([
        ['a number the 0-20 slider stored in Marker.Effects becomes the default', '🔗 Enhanced Links.Marker.Effects', 3, 'none'],
        ['a number the 0-20 slider stored in Particle.Color.Mode becomes the default', '📦 Enhanced Nodes.Particle.Color.Mode', 2, 'default'],
        ['a number the 0-20 slider stored in Text.Style becomes the default', '📦 Enhanced Nodes.Text.Style', 0.5, 'neon'],
        ['any other value outside the options becomes the default', '🔗 Enhanced Links.Link.Style', 'wave', 'spline'],
        ['a numeric string becomes its option', '🔗 Enhanced Links.Animate', '7', 7],
        ['a negative numeric string becomes its option', '📦 Enhanced Nodes.Direction', '-1', -1],
        ['a numeric string matching no option becomes the default', '🔗 Enhanced Links.Marker.Shape', '3', 'arrow'],
        ['a numeric string becomes a number on a slider', '🔗 Enhanced Links.Thickness', '4.5', 4.5],
        ['a value above the range is clamped', '🔗 Enhanced Links.Glow.Intensity', 25, 20],
        ['a value below the range is clamped', '🔗 Enhanced Links.Marker.Size', 0, 1],
        ['a numeric string out of range is clamped', '📦 Enhanced Nodes.Animation.Speed', '100', 5],
        ['NaN becomes the default', '🔗 Enhanced Links.Shadow.Blur', NaN, 5],
        ['null becomes the default', '📦 Enhanced Nodes.Text.Size', null, 14],
        ['a non-numeric string becomes the default', '📦 Enhanced Nodes.Glow', 'bright', 0.5],
        ['an empty string becomes the default', '🔗 Enhanced Links.Thickness', '', 3],
        ['a colour without # gets one', '🔗 Enhanced Links.Color.Primary', '12ab34', '#12ab34'],
        ['upper-case hex is lower-cased', '📦 Enhanced Nodes.Text.Color', '#00FF00', '#00ff00'],
        ['8-digit hex keeps its alpha', '🔗 Enhanced Links.Marker.Color', 'FFB300CC', '#ffb300cc'],
        ['3-digit hex is kept as typed: it may be the start of a 6-digit colour', '📦 Enhanced Nodes.Color.Hover', '#ABC', '#ABC'],
        ['a half-typed colour is kept as typed', '📦 Enhanced Nodes.Color.Particle', '#ffb3', '#ffb3'],
        ['"true" becomes true', '📦 Enhanced Nodes.Particle.Show', 'true', true],
        ['"false" becomes false', '🔗 Enhanced Links.Marker.Enabled', 'false', false],
        ['any other non-boolean becomes the default', '🔗 Enhanced Links.Static.Mode', 1, false],
    ])('%s', (_rule, id, stored, migrated) => {
        expect(migrate(id, stored)).toBe(migrated);
    });

    it('returns every default and every valid value unchanged', () => {
        for (const s of SETTINGS) {
            const valid = s.type === 'combo' ? s.options.map((o) => o.value)
                : s.type === 'slider' ? [s.min, s.default, s.max]
                : s.type === 'boolean' ? [true, false]
                : [s.default];
            for (const value of valid) expect(migrate(s.id, value), s.id).toBe(value);
        }
    });
});

/** A valid value other than the setting's default. */
function otherThanDefault(s: Entry): unknown {
    switch (s.type) {
        case 'boolean':
            return !s.default;
        case 'slider':
            return s.default === s.max ? s.min : s.max;
        case 'combo':
            return s.options.find((o) => o.value !== s.default)!.value;
        case 'color':
            return '#123456';
    }
}

// The extensions register when imported, which these tests do first, in order.
describe('registration through the fake frontend', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('registers every node setting with the node extension alone and feeds N its stored value', async () => {
        const nodes = SETTINGS.filter((s) => s.id.startsWith('📦 Enhanced Nodes.'));
        resetFakeApp(Object.fromEntries(nodes.map((s) => [s.id, otherThanDefault(s)])));
        const { canvas } = app;
        Object.assign(app, { canvas: undefined }); // the frontend creates its canvas after the extensions register
        await import('@/extensions/node-animations');
        Object.assign(app, { canvas });
        expect(fake.extensions.find((x) => x.name === 'enhanced.node.animations')?.settings).toBe(nodeSettings);
        expect([...fake.registered.keys()]).toEqual(nodeSettings.map((p) => p.id));
        expect(N).toEqual(Object.fromEntries(nodes.map((s) => [s.key, otherThanDefault(s)])));
        expect(fake.posts).toEqual([]);
    });

    it('feeds L the migrated stored values when the link extension registers, and writes nothing', async () => {
        resetFakeApp({
            '🔗 Enhanced Links.Marker.Effects': 3,
            '🔗 Enhanced Links.Thickness': '4.5',
            '🔗 Enhanced Links.Color.Primary': 'FFB300',
            '🔗 Enhanced Links.Static.Mode': 'true',
        });
        await import('@/extensions/link-animations');
        expect(fake.extensions.find((x) => x.name === 'enhanced.link.animations')?.settings).toBe(linkSettings);
        expect(L).toMatchObject({ markerEffects: 'none', thickness: 4.5, colorPrimary: '#ffb300', staticMode: true, animate: 9 });
        // Migrated in memory only, as settingStore.addSetting does.
        expect(fake.settings.get('🔗 Enhanced Links.Marker.Effects')).toBe('none');
        expect(fake.posts).toEqual([]);
    });

    it('feeds a set to the snapshot with one redraw and one POST; an equal set costs nothing', async () => {
        await import('@/extensions/link-animations');
        resetFakeApp();
        const setDirty = vi.spyOn(app.canvas, 'setDirty');
        await app.extensionManager.setting.set('🔗 Enhanced Links.Thickness', '6');
        expect(L.thickness).toBe(6);
        expect(setDirty.mock.calls).toEqual([[true, true]]);
        expect(fake.posts).toEqual([['🔗 Enhanced Links.Thickness', 6]]);

        await app.extensionManager.setting.set('🔗 Enhanced Links.Thickness', 6);
        await app.extensionManager.setting.set('🔗 Enhanced Links.Thickness', '6');
        expect(setDirty).toHaveBeenCalledTimes(1);
        expect(fake.posts).toHaveLength(1);
    });

    it('keeps the default in the snapshot until a typed colour parses', async () => {
        await import('@/extensions/node-animations');
        resetFakeApp();
        await app.extensionManager.setting.set('📦 Enhanced Nodes.Text.Color', '#0f0');
        expect(fake.settings.get('📦 Enhanced Nodes.Text.Color')).toBe('#0f0');
        expect(N.textColor).toBe('#00ffff');
        await app.extensionManager.setting.set('📦 Enhanced Nodes.Text.Color', '#00FF00');
        expect(N.textColor).toBe('#00ff00');
    });
});

const THICKNESS = '🔗 Enhanced Links.Thickness';
const NODE_GLOW = '📦 Enhanced Nodes.Glow';

/** Lets the write queue drain: the fake store's writes finish within microtasks. */
const settle = () => new Promise((resolve) => setTimeout(resolve));

/** Wraps the store's set() to record the most writes in flight at once. */
function trackWrites(): { most: number } {
    const set = app.extensionManager.setting.set;
    const writes = { inFlight: 0, most: 0 };
    vi.spyOn(app.extensionManager.setting, 'set').mockImplementation(async (id: string, value: unknown) => {
        writes.most = Math.max(writes.most, ++writes.inFlight);
        await set(id, value);
        writes.inFlight--;
    });
    return writes;
}

describe('writes', () => {
    beforeAll(async () => {
        await import('@/extensions/link-animations');
        await import('@/extensions/node-animations');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('setup() saves nothing, not even migrated values, and registers no setting again', async () => {
        vi.stubGlobal('requestAnimationFrame', () => 0);
        await setupV2({ [THICKNESS]: '4.5', '🔗 Enhanced Links.Marker.Effects': 3 });
        await settle();
        expect(fake.posts).toEqual([]);
        expect(fake.duplicates).toEqual([]);
    });

    it('previews redraw without saving; a drag of 50 previews and one commit costs one POST', async () => {
        resetFakeApp();
        const setDirty = vi.spyOn(app.canvas, 'setDirty');
        const drag = Array.from({ length: 50 }, (_, i) => 1 + (i % 10) * 0.5);
        for (const value of drag) preview(THICKNESS, value);
        await settle();
        expect(L.thickness).toBe(5.5);
        expect(fake.posts).toEqual([]);

        commit(THICKNESS, 5.5);
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 5.5]]);
        // One redraw per preview; the commit and the store's onChange add none for the value already shown.
        expect(setDirty).toHaveBeenCalledTimes(50);
    });

    it('rapid commits to one id coalesce, and the last value wins', async () => {
        resetFakeApp();
        for (const value of [2, 4, 6, 8]) commit(THICKNESS, value);
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 8]]);

        // The queue hands 3.5 to the store on the next microtask; what follows waits for that write.
        commit(THICKNESS, 3.5);
        await Promise.resolve();
        commit(THICKNESS, 4.5);
        commit(THICKNESS, 5);
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 8], [THICKNESS, 3.5], [THICKNESS, 5]]);
    });

    it('commits to different ids keep their order, one write at a time', async () => {
        resetFakeApp();
        const writes = trackWrites();
        commit(THICKNESS, 6);
        commit(NODE_GLOW, 1);
        commit('🔗 Enhanced Links.Animate', 3);
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 6], [NODE_GLOW, 1], ['🔗 Enhanced Links.Animate', 3]]);
        expect(writes.most).toBe(1);
    });

    it('a failed write does not hold up the writes behind it', async () => {
        resetFakeApp();
        vi.spyOn(app.extensionManager.setting, 'set').mockRejectedValueOnce(new Error('Failed to fetch'));
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        commit(THICKNESS, 6);
        commit(NODE_GLOW, 1);
        await settle();
        expect(fake.posts).toEqual([[NODE_GLOW, 1]]);
        expect(warn).toHaveBeenCalledOnce();
    });

    it('Reset commits only the settings whose value is not the default', async () => {
        resetFakeApp({ [THICKNESS]: 6, '🔗 Enhanced Links.Animate': 3, [NODE_GLOW]: 1 });
        const set = vi.spyOn(app.extensionManager.setting, 'set');
        reset('🔗 Enhanced Links.');
        await settle();
        // The store skips a set to the value it holds, so only the calls show what Reset left alone.
        expect(set.mock.calls).toEqual([['🔗 Enhanced Links.Animate', 9], [THICKNESS, 3]]);
        expect(fake.posts).toEqual([['🔗 Enhanced Links.Animate', 9], [THICKNESS, 3]]);
        expect(L).toMatchObject({ animate: 9, thickness: 3 });
        expect(N.glow).toBe(1);
    });

    it('the sidebar saves a slider drag, a colour pick, a typed hex code and a toggle once each, and Reset only what changed', async () => {
        resetFakeApp();
        const setDirty = vi.spyOn(app.canvas, 'setDirty');
        const panel = document.createElement('div');
        renderSettingsPanel(panel);
        const control = (label: string) => [...panel.querySelectorAll('.enh-control-row, .enh-toggle-row')].find((row) => row.querySelector('label')?.textContent === label)!;
        const fire = (el: HTMLInputElement, type: string, value: string) => {
            el.value = value;
            el.dispatchEvent(new Event(type));
        };

        const slider = control('Thickness').querySelector('input')!;
        expect([slider.min, slider.max, slider.step, slider.value]).toEqual(['1', '10', '0.5', '3']);
        for (const value of ['3.5', '4', '4.5', '5']) fire(slider, 'input', value);
        expect(L.thickness).toBe(5);
        const well = control('Custom Color').querySelector<HTMLInputElement>('input[type=color]')!;
        for (const value of ['#102030', '#123456']) fire(well, 'input', value);
        expect(L.markerColor).toBe('#123456');
        await settle();
        expect(fake.posts).toEqual([]);

        slider.dispatchEvent(new Event('change'));
        well.dispatchEvent(new Event('change'));
        fire(control('Hover Color').querySelector<HTMLInputElement>('input[type=text]')!, 'change', 'ABCDEF');
        control('Link Shadows').querySelector<HTMLElement>('.enh-toggle')!.click();
        await settle();
        const changed = [
            [THICKNESS, 5],
            ['🔗 Enhanced Links.Marker.Color', '#123456'],
            ['📦 Enhanced Nodes.Color.Hover', '#abcdef'],
            ['🔗 Enhanced Links.Link.Shadow.Enabled', true],
        ];
        expect(fake.posts).toEqual(changed);
        // One redraw per value shown: four slider steps, two colours, the hex code and the toggle.
        expect(setDirty).toHaveBeenCalledTimes(8);

        [...panel.querySelectorAll('button')].find((b) => b.textContent === 'Reset Link Settings to Defaults')!.click();
        await settle();
        expect(fake.posts.slice(changed.length)).toEqual([[THICKNESS, 3], ['🔗 Enhanced Links.Marker.Color', '#00fff7'], ['🔗 Enhanced Links.Link.Shadow.Enabled', false]]);
        expect(control('Thickness').querySelector('input')!.value).toBe('3');
    });
});
