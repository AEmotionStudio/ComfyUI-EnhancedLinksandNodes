/**
 * The settings schema (src/core/settings.ts): the 64 v2.0.1 settings with their
 * defaults, options and ranges, the settings v3 adds, the migrations the
 * frontend applies to stored and set values, registration through the fake
 * frontend, and the writes the sidebar makes.
 */

import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { L, LOOK, N, SETTINGS, commit, commitAll, customised, drawWith, linkSettings, nodeSettings, preview, reset, restore, revision, shown, watch } from '@/core/settings';
import { app, fake, resetFakeApp } from '../helpers/fake-app';
import { start } from '../helpers/fake-litegraph';

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

/** The settings v3 adds, by the milestone that adds them, with their defaults and options. */
const V3_DEFAULTS: Record<string, unknown> = {
    // M3
    '🔗 Enhanced Links.Coexist': 'auto',
    // M4
    '🔗 Enhanced Links.Marker.All': false,
    '🔗 Enhanced Links.Shadow.Style': 'halo',
    '📦 Enhanced Nodes.Selection.Glow': true,
    // M5
    '🔗 Enhanced Links.Enabled': true,
    '📦 Enhanced Nodes.Enabled': true,
    '🔗 Enhanced Links.Perf.MaxFps': 60,
    '🔗 Enhanced Links.Motion': 'system',
    '🔗 Enhanced Links.Look': '',
    '🔗 Enhanced Links.Panel.State': { tab: 'looks', advanced: false, search: '' },
    '🔗 Enhanced Links.WhatsNew.Seen': '',
    // M7
    '🔗 Enhanced Links.Focus.Enabled': true,
    '🔗 Enhanced Links.Focus.Mode': 'highlight',
    '🔗 Enhanced Links.Focus.Color': 'native',
    '🔗 Enhanced Links.Focus.Depth': 'direct',
    '🔗 Enhanced Links.Focus.OnTop': true,
    '🔗 Enhanced Links.Focus.Hover': false,
    '🔗 Enhanced Links.Focus.Dim': 20,
    '🔗 Enhanced Links.Navigate.DoubleClick': true,
    '🔗 Enhanced Links.Navigate.Follow': false,
    '🔗 Enhanced Links.Pause.Mode': 'spotlight',
    '🔗 Enhanced Links.Flow.River': true,
    '🔗 Enhanced Links.Flow.Trail': true,
    '🔗 Enhanced Links.Flow.Trail.Fade': 8,
    '📦 Enhanced Nodes.Run.Ring': true,
    '📦 Enhanced Nodes.Run.Error': true,
    '📦 Enhanced Nodes.Completion.Anchor': 'outputs',
};
const V3_OPTIONS: Record<string, unknown[]> = {
    '🔗 Enhanced Links.Coexist': ['auto', 'ours', 'defer'],
    '🔗 Enhanced Links.Shadow.Style': ['halo', 'drop'],
    '🔗 Enhanced Links.Perf.MaxFps': [30, 60, 0],
    '🔗 Enhanced Links.Motion': ['system', 'reduce', 'full'],
    '🔗 Enhanced Links.Focus.Mode': ['highlight', 'animate', 'dim', 'hide'],
    '🔗 Enhanced Links.Focus.Color': ['native', 'accent', 'type'],
    '🔗 Enhanced Links.Focus.Depth': ['direct', 'upstream', 'downstream', 'chain'],
    '🔗 Enhanced Links.Pause.Mode': ['pause', 'calm', 'spotlight', 'ignore'],
    '📦 Enhanced Nodes.Completion.Anchor': ['outputs', 'primary', 'viewport'],
};
const V3_RANGES: Record<string, [min: number, max: number, step: number]> = {
    '🔗 Enhanced Links.Focus.Dim': [5, 60, 5],
    '🔗 Enhanced Links.Flow.Trail.Fade': [2, 30, 1],
};

/** The v2.0.1 defaults v3 changes, by the milestone that changes them. */
const V3_CHANGED_DEFAULTS: Record<string, unknown> = {
    // M4: v1's shadows, on by default, and v1's custom node colours.
    '🔗 Enhanced Links.Link.Shadow.Enabled': true,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': true,
    '📦 Enhanced Nodes.Color.Primary': '#ffb300',
    '📦 Enhanced Nodes.Color.Secondary': '#fb00ff',
    '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
    '📦 Enhanced Nodes.Color.Particle': '#ffb300',
    // M4: v1's fireworks, which v2 had no code for.
    '📦 Enhanced Nodes.End Animation.Enabled': true,
};

/** The v2.0.1 options and ranges v3 changes, by the milestone that changes them. */
const V3_CHANGED_OPTIONS: Record<string, unknown[]> = {
    // M4: the Coil path, the merkaba marker, v1's Same as link marker colour, and v1's density presets for v2's sliders.
    '🔗 Enhanced Links.Link.Style': ['spline', 'straight', 'linear', 'hidden', 'dotted', 'dashed', 'double', 'stepped', 'zigzag', 'coil', 'rope', 'glowpath', 'chain', 'pulse', 'holographic'],
    '🔗 Enhanced Links.Marker.Shape': ['none', 'arrow', 'diamond', 'circle', 'square', 'triangle', 'star', 'heart', 'cross', 'hexagon', 'flower', 'spiral', 'merkaba'],
    '🔗 Enhanced Links.Marker.Color.Mode': ['default', 'inherit', 'custom'],
    '🔗 Enhanced Links.Particle.Density': [0.5, 1, 2, 3],
    '📦 Enhanced Nodes.Particle.Density': [0.5, 1, 2, 3],
};
const V3_CHANGED_RANGES: Record<string, [min: number, max: number, step: number]> = {
    // M4: v1's speed works quadratically, so 3× moves effects 9× as fast.
    '🔗 Enhanced Links.Animation.Speed': [0.1, 3, 0.05],
    // M4: the UX design's node speed, and v1's ranges for the node glows (0 to 1) and energies (0.1 to 2).
    '📦 Enhanced Nodes.Animation.Speed': [0.1, 3, 0.1],
    '📦 Enhanced Nodes.Intensity': [0.1, 2, 0.1],
    '📦 Enhanced Nodes.Animation.Glow': [0, 1, 0.05],
    '📦 Enhanced Nodes.Glow': [0, 1, 0.05],
    '📦 Enhanced Nodes.Particle.Intensity': [0.1, 2, 0.1],
    '📦 Enhanced Nodes.Particle.Glow': [0, 1, 0.05],
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
    it('defines the 64 v2.0.1 settings and the ones v3 adds, each once', () => {
        const ids = SETTINGS.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(Object.keys(V2_DEFAULTS)).toHaveLength(64);
        expect([...ids].sort()).toEqual([...Object.keys(V2_DEFAULTS), ...Object.keys(V3_DEFAULTS)].sort());
    });

    it('keeps the v2.0.1 defaults, but for what v3 changes', () => {
        expect(Object.fromEntries(SETTINGS.map((s) => [s.id, s.default]))).toEqual({ ...V2_DEFAULTS, ...V3_CHANGED_DEFAULTS, ...V3_DEFAULTS });
    });

    it('keeps the v2.0.1 options and the sidebar ranges, but for what v3 changes', () => {
        expect(Object.fromEntries(SETTINGS.flatMap((s) => s.type === 'combo' ? [[s.id, s.options.map((o) => o.value)]] : []))).toEqual({ ...V2_OPTIONS, ...V3_CHANGED_OPTIONS, ...V3_OPTIONS });
        // The sliders v3 turns into presets are combos now.
        const sliders = Object.fromEntries(Object.entries(V2_RANGES).filter(([id]) => !(id in V3_CHANGED_OPTIONS)));
        expect(Object.fromEntries(SETTINGS.flatMap((s) => s.type === 'slider' ? [[s.id, [s.min, s.max, s.step]]] : []))).toEqual({ ...sliders, ...V3_CHANGED_RANGES, ...V3_RANGES });
        // Every v2.0.1 Link.Style, Marker.Shape and Marker.Color.Mode value is still an option.
        for (const id of ['🔗 Enhanced Links.Link.Style', '🔗 Enhanced Links.Marker.Shape', '🔗 Enhanced Links.Marker.Color.Mode']) {
            expect(V3_CHANGED_OPTIONS[id], id).toEqual(expect.arrayContaining(V2_OPTIONS[id]));
        }
    });

    it('types each setting by its default, so no slider has a string default', () => {
        const kinds = { boolean: 'boolean', slider: 'number', color: 'string' } as const;
        for (const s of SETTINGS) {
            // The hidden settings hold text, but for the panel's state.
            if (s.type === 'hidden') expect(typeof s.default, s.id).toBe(s.id === '🔗 Enhanced Links.Panel.State' ? 'object' : 'string');
            else expect(typeof s.default, s.id).toBe(s.type === 'combo' ? typeof s.options[0].value : kinds[s.type]);
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
        const texts = SETTINGS.flatMap((s) => [s.name, 'group' in s ? s.group : '', 'tooltip' in s ? s.tooltip : '', ...(s.type === 'combo' ? s.options.map((o) => o.text) : [])]);
        for (const text of texts) expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
    });

    it('keys each snapshot value by the id after its prefix, in camelCase', () => {
        const camel = (id: string) => id.slice(id.indexOf('.') + 1).split(/[. ]/).map((w, i) => (i ? w[0].toUpperCase() : w[0].toLowerCase()) + w.slice(1)).join('');
        for (const s of SETTINGS) expect(s.key, s.id).toBe(camel(s.id));
        expect(Object.keys(L)).toHaveLength(linkSettings.length);
        expect(Object.keys(N)).toHaveLength(nodeSettings.length);
    });

    it('gives each setting its own three-level dialog category, ordered as the schema, and the hidden ones none', () => {
        const shown = SETTINGS.filter((s) => s.type !== 'hidden');
        expect(SETTINGS.length - shown.length).toBe(3);
        expect(new Set(PARAMS.flatMap((p) => (p.category ? [p.category.join('/')] : []))).size).toBe(shown.length);
        for (const s of SETTINGS) expect(params(s.id).category, s.id).toEqual('group' in s ? ['Enhanced Links & Nodes', s.group, s.id] : undefined);
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

// These show values by preview(): the extensions register in the tests after them.
describe('how the panel shows each setting', () => {
    const shownSettings = () => SETTINGS.filter((s) => s.type !== 'hidden');
    /** Shows `values` over the defaults. */
    const showing = (values: Record<string, unknown> = {}) => {
        for (const s of SETTINGS) preview(s.id, s.id in values ? values[s.id] : s.default);
    };

    afterEach(() => {
        showing();
    });

    it('shows 50 settings before Advanced opens', () => {
        expect(shownSettings().filter((s) => !('advanced' in s))).toHaveLength(50);
    });

    it('lets looks set every setting but the master switches, selection focus, navigation, Perf, Motion, Coexist and the hidden ones', () => {
        const alone = SETTINGS.filter((s) => s.type === 'hidden' || ('look' in s && s.look === false)).map((s) => s.id);
        expect(alone).toEqual([
            '🔗 Enhanced Links.Enabled', '📦 Enhanced Nodes.Enabled',
            ...['Enabled', 'Mode', 'Color', 'Depth', 'OnTop', 'Hover', 'Dim'].map((key) => `🔗 Enhanced Links.Focus.${key}`),
            '🔗 Enhanced Links.Navigate.DoubleClick', '🔗 Enhanced Links.Navigate.Follow', '🔗 Enhanced Links.Flow.Trail.Fade', '📦 Enhanced Nodes.Completion.Anchor',
            '🔗 Enhanced Links.Perf.MaxFps', '🔗 Enhanced Links.Motion', '🔗 Enhanced Links.Coexist',
            LOOK, '🔗 Enhanced Links.Panel.State', '🔗 Enhanced Links.WhatsNew.Seen',
        ]);
    });

    it('hides what cannot apply: the link settings with link effects off or Animate None, markers without Classic Flow or Marker.All, custom colours without Custom', () => {
        const visible = () => shownSettings().filter((s) => !('showIf' in s) || s.showIf()).map((s) => s.id.replace(/^\S+ Enhanced \w+\./, (p) => (p.startsWith('🔗') ? 'L.' : 'N.')));
        // The defaults: Classic Flow links with markers and shadows; no node effect, particles or titles.
        expect(visible()).toEqual([
            'L.Enabled', 'L.Animate', 'L.Animation.Speed', 'L.Direction', 'L.Static.Mode', 'L.Link.Style', 'L.Thickness', 'L.Quality', 'L.Particle.Density',
            'L.Color.Mode', 'L.Color.Scheme', 'L.Glow.Intensity', 'L.Marker.Enabled', 'L.Marker.Shape', 'L.Marker.Size', 'L.Marker.Color.Mode',
            'L.Marker.Glow', 'L.Marker.Effects', 'L.Link.Shadow.Enabled', 'L.Marker.Shadow.Enabled', 'L.Shadow.Style',
            'N.Enabled', 'N.Animate', 'N.Particle.Show', 'N.Text.Animation.Enabled',
            'L.Focus.Enabled', 'L.Focus.Mode', 'L.Focus.Color', 'L.Focus.Depth', 'L.Focus.OnTop', 'L.Focus.Hover', 'L.Navigate.DoubleClick', 'L.Navigate.Follow',
            'L.Pause.Mode', 'L.Pause.During.Render', 'N.Pause.During.Render', 'L.Flow.River', 'L.Flow.Trail', 'L.Flow.Trail.Fade', 'N.Run.Ring', 'N.Run.Error',
            'N.End Animation.Enabled', 'N.Completion.Anchor', 'L.Perf.MaxFps', 'L.Motion', 'L.Coexist',
        ]);
        showing({
            '🔗 Enhanced Links.Animate': 6, '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Glow.Show': false, '📦 Enhanced Nodes.Selection.Glow': false,
            '📦 Enhanced Nodes.Particle.Show': true, '📦 Enhanced Nodes.Particle.Color.Mode': 'aurora',
        });
        // DNA Helix carries no particles or markers, and draws no shadow; frozen, its speed does nothing.
        expect(visible()).toEqual(expect.arrayContaining(['L.Color.Primary', 'L.Color.Secondary', 'L.Color.Accent', 'L.Marker.All', 'N.Animations.Enabled', 'N.Color.Mode', 'N.Particle.Glow']));
        expect(visible()).not.toEqual(expect.arrayContaining(['L.Animation.Speed']));
        for (const id of ['L.Animation.Speed', 'L.Particle.Density', 'L.Marker.Enabled', 'L.Marker.Shape', 'L.Link.Shadow.Enabled', 'L.Shadow.Style', 'N.Glow', 'N.Color.Particle', 'N.Text.Style']) {
            expect(visible(), id).not.toContain(id);
        }
        preview('🔗 Enhanced Links.Marker.All', true);
        expect(visible()).toEqual(expect.arrayContaining(['L.Particle.Density', 'L.Marker.Enabled', 'L.Marker.Shape', 'L.Marker.Shadow.Enabled', 'L.Shadow.Style']));
        preview('🔗 Enhanced Links.Focus.Mode', 'dim');
        expect(visible()).toContain('L.Focus.Dim');
        preview('🔗 Enhanced Links.Enabled', false);
        preview('📦 Enhanced Nodes.Enabled', false);
        // Selection focus, navigation and what a run does to the effects work with the effects off; the run's own visuals need them.
        const focus = ['L.Focus.Enabled', 'L.Focus.Mode', 'L.Focus.Color', 'L.Focus.Depth', 'L.Focus.OnTop', 'L.Focus.Hover', 'L.Focus.Dim', 'L.Navigate.DoubleClick', 'L.Navigate.Follow'];
        const during = ['L.Pause.Mode', 'L.Pause.During.Render', 'N.Pause.During.Render'];
        expect(visible()).toEqual(['L.Enabled', 'N.Enabled', ...focus, ...during, 'L.Perf.MaxFps', 'L.Motion', 'L.Coexist']);
        preview('🔗 Enhanced Links.Focus.Enabled', false);
        preview('🔗 Enhanced Links.Pause.Mode', 'ignore');
        expect(visible()).toEqual(['L.Enabled', 'N.Enabled', 'L.Focus.Enabled', 'L.Navigate.DoubleClick', 'L.Navigate.Follow', 'L.Pause.Mode', 'L.Perf.MaxFps', 'L.Motion', 'L.Coexist']);
    });

    it('points the title and particle colours at Custom node colours, which they need, until it is set', () => {
        showing({ '📦 Enhanced Nodes.Text.Animation.Enabled': true, '📦 Enhanced Nodes.Particle.Show': true });
        const needs = (id: string) => {
            const s = SETTINGS.find((e) => e.id === id)!;
            return 'needs' in s ? s.needs() : undefined;
        };
        const fix = { reason: 'Used when Node effect colors is Custom.', id: '📦 Enhanced Nodes.Color.Mode', value: 'custom' };
        expect([needs('📦 Enhanced Nodes.Text.Color'), needs('📦 Enhanced Nodes.Color.Particle')]).toEqual([fix, fix]);
        preview(fix.id, fix.value);
        expect([needs('📦 Enhanced Nodes.Text.Color'), needs('📦 Enhanced Nodes.Color.Particle')]).toEqual([undefined, undefined]);
        expect(SETTINGS.filter((s) => 'needs' in s).map((s) => s.id)).toEqual(['📦 Enhanced Nodes.Color.Particle', '📦 Enhanced Nodes.Text.Color']);
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
        ['a numeric string out of range is clamped', '📦 Enhanced Nodes.Animation.Speed', '100', 3],
        ["a link speed v2's slider allowed past 3 is clamped to it", '🔗 Enhanced Links.Animation.Speed', 5, 3],
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
        // M4
        ["v1's link Color.Mode off, which no option offered, becomes the default", '🔗 Enhanced Links.Color.Mode', 'off', 'default'],
        ["v1's Same as link marker colour is an option again", '🔗 Enhanced Links.Marker.Color.Mode', 'inherit', 'inherit'],
        ['a density between presets takes the nearest', '🔗 Enhanced Links.Particle.Density', 0.7, 0.5],
        ['a density nearer Balanced takes it', '🔗 Enhanced Links.Particle.Density', 0.8, 1],
        ['a density halfway between presets takes the lower', '🔗 Enhanced Links.Particle.Density', 1.5, 1],
        ['a density past halfway takes the higher', '📦 Enhanced Nodes.Particle.Density', 2.6, 3],
        ["a density of 0, which made v2's styles vanish, becomes Minimal", '🔗 Enhanced Links.Particle.Density', 0, 0.5],
        ['a negative density becomes Minimal', '📦 Enhanced Nodes.Particle.Density', -1, 0.5],
        ["a density past Ultra from v2's dialog becomes Ultra", '🔗 Enhanced Links.Particle.Density', 20, 3],
        ['a numeric string density takes the nearest preset', '📦 Enhanced Nodes.Particle.Density', '2.2', 2],
        ['a density that is not a number becomes the default', '📦 Enhanced Nodes.Particle.Density', 'lots', 1],
        ['a shadow style v3 does not know becomes the halo', '🔗 Enhanced Links.Shadow.Style', 'soft', 'halo'],
        ["a node glow v2's slider took past 1 takes v1's 1", '📦 Enhanced Nodes.Glow', 1.8, 1],
        ["an effect bloom v2's slider took past 1 takes v1's 1", '📦 Enhanced Nodes.Animation.Glow', 2, 1],
        ["a particle glow v2's slider took past 1 takes v1's 1", '📦 Enhanced Nodes.Particle.Glow', 1.5, 1],
        ["an energy v2's slider took past 2 takes v1's 2", '📦 Enhanced Nodes.Intensity', 3, 2],
        ["an energy of 0, which v2's slider allowed, takes v1's 0.1", '📦 Enhanced Nodes.Intensity', 0, 0.1],
        ["a particle motion of 0 takes v1's 0.1", '📦 Enhanced Nodes.Particle.Intensity', 0, 0.1],
        ["a node speed v2's slider took past 3 is clamped to it", '📦 Enhanced Nodes.Animation.Speed', 4.5, 3],
    ])('%s', (_rule, id, stored, migrated) => {
        expect(migrate(id, stored)).toBe(migrated);
    });

    it('returns every default and every valid value unchanged', () => {
        for (const s of SETTINGS) {
            const valid = s.type === 'combo' ? s.options.map((o) => o.value)
                : s.type === 'slider' ? [s.min, s.default, s.max]
                : s.type === 'boolean' ? [true, false]
                : [s.default];
            // The panel's state comes back as a copy.
            for (const value of valid) expect(migrate(s.id, value), s.id)[typeof value === 'object' ? 'toEqual' : 'toBe'](value);
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
        // With a look picked, so the first-run overlay (tested below) shows the stored v2.0.1 defaults as they are.
        preview(LOOK, 'custom');
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
        preview(LOOK, '');
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
        await start({ [THICKNESS]: '4.5', '🔗 Enhanced Links.Marker.Effects': 3 });
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
        await start({ '🔗 Enhanced Links.Panel.State': { tab: 'links', advanced: false, search: '' } });
        const setDirty = vi.spyOn(app.canvas, 'setDirty');
        const tab = fake.tabs.find((t) => t.id === 'enhanced-links-nodes')!;
        // In the page, as the sidebar's slot is.
        const panel = document.body.appendChild(document.createElement('div'));
        tab.render(panel);
        // jsdom's selectors miss attribute values with emoji in them.
        const control = (id: string) => [...panel.querySelectorAll<HTMLElement>('[data-setting]')].find((el) => el.dataset.setting === id)!;
        const fire = (el: HTMLInputElement, type: string, value: string) => {
            el.value = value;
            el.dispatchEvent(new Event(type));
        };

        const slider = control(THICKNESS).querySelector<HTMLInputElement>('input[type=range]')!;
        expect([slider.min, slider.max, slider.step, slider.value]).toEqual(['1', '10', '0.5', '3']);
        for (const value of ['3.5', '4', '4.5', '5']) fire(slider, 'input', value);
        expect(L.thickness).toBe(5);
        // Shown once Marker color is Custom; its row is there all the same.
        const well = control('🔗 Enhanced Links.Marker.Color').querySelector<HTMLInputElement>('input[type=color]')!;
        for (const value of ['#102030', '#123456']) fire(well, 'input', value);
        expect(L.markerColor).toBe('#123456');
        await settle();
        expect(fake.posts).toEqual([]);

        slider.dispatchEvent(new Event('change'));
        well.dispatchEvent(new Event('change'));
        fire(control('🔗 Enhanced Links.Color.Primary').querySelector<HTMLInputElement>('input[type=text]')!, 'change', 'ABCDEF');
        control('🔗 Enhanced Links.Link.Shadow.Enabled').querySelector<HTMLElement>('[role=switch]')!.click();
        await settle();
        // Link shadows are on by default since M4, so the toggle turns them off.
        const changed = [
            [THICKNESS, 5],
            ['🔗 Enhanced Links.Marker.Color', '#123456'],
            ['🔗 Enhanced Links.Color.Primary', '#abcdef'],
            ['🔗 Enhanced Links.Link.Shadow.Enabled', false],
        ];
        expect(fake.posts).toEqual(changed);
        // One redraw per value shown: four slider steps, two colours, the hex code and the toggle.
        expect(setDirty).toHaveBeenCalledTimes(8);
        expect(control(THICKNESS).classList.contains('eln-row--modified')).toBe(true);

        // The Path section's reset saves only what changed there, and offers its undo.
        control(THICKNESS).closest('section')!.querySelector<HTMLElement>('.eln-section-head .eln-tool')!.click();
        await settle();
        expect(fake.posts.slice(changed.length)).toEqual([[THICKNESS, 3]]);
        expect(slider.value).toBe('3');
        panel.querySelector<HTMLElement>('.eln-undo button')!.click();
        await settle();
        expect(fake.posts.slice(changed.length + 1)).toEqual([[THICKNESS, 5]]);
        expect(slider.value).toBe('5');
        tab.destroy!();
        panel.remove();
        await settle();
        expect(fake.posts).toHaveLength(changed.length + 2);
    });

    it('Reset leaves the hidden settings as they are, and its undo puts back what it changed', async () => {
        resetFakeApp({ [THICKNESS]: 6, [LOOK]: 'showcase', '🔗 Enhanced Links.Panel.State': { tab: 'nodes', advanced: true, search: '' } });
        const undo = reset('🔗 Enhanced Links.');
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 3]]);
        undo();
        await settle();
        expect(fake.posts).toEqual([[THICKNESS, 3], [THICKNESS, 6]]);
        expect(L.thickness).toBe(6);
    });

    it('commitAll commits only what differs from what is saved or queued, in order, and its undo puts that back', async () => {
        resetFakeApp({ [THICKNESS]: 6 });
        commit(NODE_GLOW, 1);
        const undo = commitAll({ [NODE_GLOW]: 1, '🔗 Enhanced Links.Animate': 9, [THICKNESS]: '4', '🔗 Enhanced Links.Marker.Shape': 'star' });
        await settle();
        expect(fake.posts).toEqual([[NODE_GLOW, 1], [THICKNESS, 4], ['🔗 Enhanced Links.Marker.Shape', 'star']]);
        undo();
        await settle();
        expect(fake.posts.slice(3)).toEqual([[THICKNESS, 6], ['🔗 Enhanced Links.Marker.Shape', 'arrow']]);
        expect([L.thickness, L.markerShape, N.glow]).toEqual([6, 'arrow', 1]);
    });

    it('restore() ends previews with what is saved or queued', async () => {
        resetFakeApp({ [THICKNESS]: 6 });
        commit(NODE_GLOW, 0.8);
        preview(THICKNESS, 2);
        preview(NODE_GLOW, 0.1);
        restore([THICKNESS, NODE_GLOW]);
        expect([L.thickness, N.glow]).toEqual([6, 0.8]);
        await settle();
        expect(fake.posts).toEqual([[NODE_GLOW, 0.8]]);
    });

    it('drawWith lends values to L and N for one draw alone: nothing redraws or hears of them, and the revision is one of their own', () => {
        resetFakeApp({ [THICKNESS]: 6 });
        const setDirty = vi.spyOn(app.canvas, 'setDirty');
        const heard: string[] = [];
        const stop = watch((id) => heard.push(id));
        const own = revision;
        let seen: number[] = [];
        drawWith({ [THICKNESS]: 9, [NODE_GLOW]: 0.2 }, () => {
            seen = [L.thickness, N.glow, revision];
        });
        drawWith({}, () => seen.push(revision));
        stop();
        expect(seen.slice(0, 2)).toEqual([9, 0.2]);
        // Below 0, and another for each draw, so no cache mistakes one draw's values for another's.
        expect(seen[2]).toBeLessThan(0);
        expect(seen[3]).toBeLessThan(seen[2]);
        expect([L.thickness, N.glow, revision]).toEqual([6, 0.5, own]);
        expect(heard).toEqual([]);
        expect(setDirty).not.toHaveBeenCalled();
    });

    it('tells watchers of every change shown, from a preview, a commit or the settings dialog, until they stop; hidden ones redraw nothing', async () => {
        resetFakeApp();
        const setDirty = vi.spyOn(app.canvas, 'setDirty');
        const heard: string[] = [];
        const stop = watch((id) => heard.push(id));
        preview(THICKNESS, 5);
        preview(THICKNESS, 5);
        commit(NODE_GLOW, 1);
        await app.extensionManager.setting.set('🔗 Enhanced Links.Marker.Shape', 'star');
        commit('🔗 Enhanced Links.Panel.State', { tab: 'perf', advanced: false, search: '' });
        await settle();
        expect(heard).toEqual([THICKNESS, NODE_GLOW, '🔗 Enhanced Links.Marker.Shape', '🔗 Enhanced Links.Panel.State']);
        expect(setDirty).toHaveBeenCalledTimes(3);
        expect(L.panelState).toEqual({ tab: 'perf', advanced: false, search: '' });
        stop();
        preview(THICKNESS, 6);
        expect(heard).toHaveLength(4);
    });
});

/** v1's DEFAULT_SETTINGS (old_link_animations.js:19-45, old_node_animations.js:146-178), which v1 saved for everyone who ran it. */
const V1_SAVED: Record<string, unknown> = {
    ...Object.fromEntries(Object.entries(V2_DEFAULTS).filter(([id]) => id.startsWith('🔗'))),
    '🔗 Enhanced Links.Link.Shadow.Enabled': true,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': true,
    '🔗 Enhanced Links.UI & Æmotion Studio About': 0,
    '📦 Enhanced Nodes.Animate': 2,
    '📦 Enhanced Nodes.Color.Mode': 'custom',
    '📦 Enhanced Nodes.Color.Primary': '#ffb300',
    '📦 Enhanced Nodes.Color.Secondary': '#fb00ff',
    '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
    '📦 Enhanced Nodes.Color.Particle': '#ffb300',
    '📦 Enhanced Nodes.Glow': 1,
    '📦 Enhanced Nodes.Particle.Glow': 1,
    '📦 Enhanced Nodes.Particle.Density': 0.5,
    '📦 Enhanced Nodes.Particle.Show': true,
    '📦 Enhanced Nodes.Quality': 1,
    '📦 Enhanced Nodes.Text.Glow': 1,
    '📦 Enhanced Nodes.End Animation.Enabled': false,
    '📦 Enhanced Nodes.UI & Æmotion Studio About': 0,
};

describe('the first-run overlay', () => {
    beforeAll(async () => {
        await import('@/extensions/link-animations');
        await import('@/extensions/node-animations');
    });

    const DEFAULTS = Object.fromEntries(SETTINGS.map((s) => [s.id, s.default]));
    const showing = () => Object.fromEntries(SETTINGS.map((s) => [s.id, shown(s.id)]));
    const LINK_SHADOW = '🔗 Enhanced Links.Link.Shadow.Enabled';

    // The four profiles a first run can meet: none, the 64 defaults the v2 panel's Reset saved, those with the user's
    // own changes, and what v1 saved.
    for (const [profile, stored, own, shows] of [
        ['a fresh install', {}, false, {}],
        ["v2.0.1's defaults", V2_DEFAULTS, false, {}],
        ['v2 settings of their own', { ...V2_DEFAULTS, [THICKNESS]: 6, '📦 Enhanced Nodes.Animate': 3 }, true, { [THICKNESS]: 6, '📦 Enhanced Nodes.Animate': 3 }],
        // v1's own fireworks default is v2.0.1's, so it counts as unset too.
        ["v1's saved defaults", V1_SAVED, true, Object.fromEntries(Object.entries(V1_SAVED).filter(([id]) => id in DEFAULTS && id !== '📦 Enhanced Nodes.End Animation.Enabled'))],
    ] as const) {
        it(`shows the defaults for ${profile}, but for values that differ from v2.0.1's, and writes nothing`, async () => {
            resetFakeApp({ ...stored });
            expect(showing()).toEqual({ ...DEFAULTS, ...shows });
            expect(customised()).toBe(own);
            await settle();
            expect(fake.posts).toEqual([]);
            expect(Object.fromEntries(fake.settings)).toEqual(stored);
        });
    }

    it("counts a saved value that differs from v2.0.1's default as the user's own, though it is v3's default, and an unsaved one not", () => {
        resetFakeApp({ [LINK_SHADOW]: true });
        expect(customised()).toBe(true);
        resetFakeApp({ [LINK_SHADOW]: false, '🔗 Enhanced Links.Coexist': 'auto', [LOOK]: 'showcase' });
        expect(customised()).toBe(false);
    });

    it('shows the stored v2.0.1 defaults once Look is answered, as Keep my settings does', async () => {
        resetFakeApp({ ...V2_DEFAULTS, [THICKNESS]: 6 });
        expect(L.linkShadowEnabled).toBe(true);
        commit(LOOK, 'custom');
        expect([L.linkShadowEnabled, L.markerShadowEnabled, N.colorPrimary, N.endAnimationEnabled, L.thickness]).toEqual([false, false, '#44aaff', false, 6]);
        await settle();
        expect(fake.posts).toEqual([[LOOK, 'custom']]);
        // As the page loads again.
        resetFakeApp(Object.fromEntries(fake.settings));
        expect([L.linkShadowEnabled, N.colorPrimary]).toEqual([false, '#44aaff']);
    });

    it("keeps a v2.0.1 default the user sets in the panel through a reload, answering the picker with what shows", async () => {
        const END = '📦 Enhanced Nodes.End Animation.Enabled';
        resetFakeApp(V2_DEFAULTS);
        commit(END, false);
        expect([N.endAnimationEnabled, L.markerShadowEnabled, L.look]).toEqual([false, true, 'custom']);
        await settle();
        // The store held End Animation's false already; the other overlaid settings save the defaults they show.
        expect(fake.posts.at(-1)).toEqual([LOOK, 'custom']);
        const overlaid = Object.keys(V2_DEFAULTS).filter((id) => V2_DEFAULTS[id] !== DEFAULTS[id] && id !== END);
        expect(overlaid).toHaveLength(6);
        expect(new Map(fake.posts)).toEqual(new Map<string, unknown>([...overlaid.map((id) => [id, DEFAULTS[id]] as const), [LOOK, 'custom']]));
        resetFakeApp(Object.fromEntries(fake.settings));
        expect(showing()).toEqual({ ...DEFAULTS, [END]: false, [LOOK]: 'custom' });
    });

    it('keeps a v2.0.1 default the user sets in the settings dialog through a reload; a v3 value needs no answer', async () => {
        resetFakeApp(V2_DEFAULTS);
        await app.extensionManager.setting.set(LINK_SHADOW, true);
        expect([L.linkShadowEnabled, L.look]).toEqual([true, '']);
        await app.extensionManager.setting.set(LINK_SHADOW, false);
        expect([L.linkShadowEnabled, L.markerShadowEnabled, L.look]).toEqual([false, true, 'custom']);
        await settle();
        resetFakeApp(Object.fromEntries(fake.settings));
        expect([L.linkShadowEnabled, L.markerShadowEnabled, L.look]).toEqual([false, true, 'custom']);
    });
});
