/**
 * The settings schema, in display order: each setting's id, snapshot key, dialog
 * text, type, options or range, default and dialog group. Each extension
 * registers its own settings from it, and their onChange keeps the live
 * snapshots L (links) and N (nodes) current. The sidebar previews values into
 * the snapshots and commits them through one write queue.
 *
 * @module core/settings
 */

import type { ComfyExtension } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';

type SettingParams = NonNullable<ComfyExtension['settings']>[number];

interface Option {
    value: number | string;
    text: string;
}

type Setting = { id: string; key: string; name: string; tooltip?: string; group: string } & (
    | { type: 'boolean'; default: boolean }
    | { type: 'slider'; default: number; min: number; max: number; step: number }
    | { type: 'combo'; default: number | string; options: readonly Option[] }
    | { type: 'color'; default: string }
);

// =============================================================================
// Options
// =============================================================================

const LINK_ANIMATION_OPTIONS = [
    { value: 0, text: 'None' },
    { value: 9, text: 'Classic Flow' },
    { value: 1, text: 'Sacred Flow' },
    { value: 2, text: 'Crystal Stream' },
    { value: 3, text: 'Quantum Field' },
    { value: 4, text: 'Cosmic Weave' },
    { value: 5, text: 'Energy Pulse' },
    { value: 6, text: 'DNA Helix' },
    { value: 7, text: 'Lava Flow' },
    { value: 8, text: 'Stellar Plasma' },
] as const;

const LINK_STYLE_OPTIONS = [
    { value: 'spline', text: 'Spline' },
    { value: 'straight', text: 'Direct (diagonal)' },
    { value: 'linear', text: 'Right-angle' },
    { value: 'hidden', text: 'Effect only' },
    { value: 'dotted', text: 'Dotted' },
    { value: 'dashed', text: 'Dashed' },
    { value: 'double', text: 'Double' },
    { value: 'stepped', text: 'Stepped' },
    { value: 'zigzag', text: 'Zigzag' },
    { value: 'rope', text: 'Rope' },
    { value: 'glowpath', text: 'Glow path' },
    { value: 'chain', text: 'Chain' },
    { value: 'pulse', text: 'Pulse' },
    { value: 'holographic', text: 'Holographic' },
] as const;

const MARKER_SHAPE_OPTIONS = [
    { value: 'none', text: 'None' },
    { value: 'arrow', text: 'Arrow' },
    { value: 'diamond', text: 'Diamond' },
    { value: 'circle', text: 'Circle' },
    { value: 'square', text: 'Square' },
    { value: 'triangle', text: 'Triangle' },
    { value: 'star', text: 'Star' },
    { value: 'heart', text: 'Heart' },
    { value: 'cross', text: 'Cross' },
    { value: 'hexagon', text: 'Hexagon' },
    { value: 'flower', text: 'Flower' },
    { value: 'spiral', text: 'Spiral' },
] as const;

const MARKER_EFFECT_OPTIONS = [
    { value: 'none', text: 'None' },
    { value: 'pulse', text: 'Pulse' },
    { value: 'fade', text: 'Fade' },
    { value: 'rainbow', text: 'Rainbow' },
] as const;

const NODE_ANIMATION_OPTIONS = [
    { value: 0, text: 'None' },
    { value: 1, text: 'Gentle Pulse' },
    { value: 2, text: 'Neon Nexus' },
    { value: 3, text: 'Cosmic Ripple' },
    { value: 4, text: 'Flower of Life' },
] as const;

const PARTICLE_COLOR_MODE_OPTIONS = [
    { value: 'default', text: 'Particle color' },
    { value: 'rainbow', text: 'Rainbow' },
    { value: 'complementary', text: 'Complementary' },
    { value: 'energy', text: 'Energy' },
    { value: 'quantum', text: 'Quantum' },
    { value: 'aurora', text: 'Aurora' },
] as const;

const TEXT_STYLE_OPTIONS = [
    { value: 'neon', text: 'Neon pulse' },
    { value: 'cyberpunk', text: 'Glitch' },
    { value: 'retro', text: 'Retro' },
    { value: 'pulse', text: 'Simple pulse' },
    { value: 'minimal', text: 'Minimal' },
] as const;

const LINK_COLOR_MODE_OPTIONS = [
    { value: 'default', text: 'Link type colors' },
    { value: 'custom', text: 'Custom' },
] as const;

const MARKER_COLOR_MODE_OPTIONS = [
    { value: 'default', text: 'Link type color' },
    { value: 'custom', text: 'Custom' },
] as const;

const NODE_COLOR_MODE_OPTIONS = [
    { value: 'default', text: 'Style colors' },
    { value: 'custom', text: 'Custom' },
] as const;

const COLOR_SCHEME_OPTIONS = [
    { value: 'default', text: 'Off' },
    { value: 'saturated', text: 'Saturated' },
    { value: 'vivid', text: 'Vivid' },
    { value: 'contrast', text: 'High contrast' },
    { value: 'bright', text: 'Bright' },
    { value: 'muted', text: 'Muted' },
] as const;

const QUALITY_OPTIONS = [
    { value: 1, text: 'Fast' },
    { value: 2, text: 'Balanced' },
    { value: 3, text: 'Rich' },
] as const;

const DIRECTION_OPTIONS = [
    { value: 1, text: 'Forward' },
    { value: -1, text: 'Reverse' },
] as const;

const COEXIST_OPTIONS = [
    { value: 'auto', text: 'Step aside if one is found' },
    { value: 'ours', text: 'Keep Enhanced link effects' },
    { value: 'defer', text: 'Always step aside' },
] as const;

// =============================================================================
// Schema
// =============================================================================

const LINKS = '🔗 Enhanced Links.';
const NODES = '📦 Enhanced Nodes.';

/** Each key is the id after its prefix in camelCase. */
export const SETTINGS = [
    { id: '🔗 Enhanced Links.Animate', key: 'animate', name: 'Link animation', type: 'combo', options: LINK_ANIMATION_OPTIONS, default: 9, group: 'Links · Effect', tooltip: 'Effect drawn along every link.' },
    { id: '🔗 Enhanced Links.Animation.Speed', key: 'animationSpeed', name: 'Link animation speed', type: 'slider', min: 0.1, max: 5, step: 0.1, default: 1, group: 'Links · Effect' },
    { id: '🔗 Enhanced Links.Direction', key: 'direction', name: 'Link flow direction', type: 'combo', options: DIRECTION_OPTIONS, default: 1, group: 'Links · Effect', tooltip: 'Which way effects travel.' },
    { id: '🔗 Enhanced Links.Static.Mode', key: 'staticMode', name: 'Freeze link animation', type: 'boolean', default: false, group: 'Links · Effect', tooltip: 'Keep the look but stop the motion.' },

    { id: '🔗 Enhanced Links.Link.Style', key: 'linkStyle', name: 'Link path shape', type: 'combo', options: LINK_STYLE_OPTIONS, default: 'spline', group: 'Links · Path' },
    { id: '🔗 Enhanced Links.Thickness', key: 'thickness', name: 'Link thickness', type: 'slider', min: 1, max: 10, step: 0.5, default: 3, group: 'Links · Path' },
    { id: '🔗 Enhanced Links.Quality', key: 'quality', name: 'Link effect quality', type: 'combo', options: QUALITY_OPTIONS, default: 1, group: 'Links · Path', tooltip: 'More detail, more GPU.' },
    { id: '🔗 Enhanced Links.Particle.Density', key: 'particleDensity', name: 'Link particle density', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.5, group: 'Links · Path', tooltip: 'How many particles or markers each link carries.' },

    { id: '🔗 Enhanced Links.Color.Mode', key: 'colorMode', name: 'Link colors', type: 'combo', options: LINK_COLOR_MODE_OPTIONS, default: 'default', group: 'Links · Color', tooltip: 'Type colors follow your palette.' },
    { id: '🔗 Enhanced Links.Color.Primary', key: 'colorPrimary', name: 'Link primary color', type: 'color', default: '#ffb300', group: 'Links · Color', tooltip: 'Used when Link colors is Custom.' },
    { id: '🔗 Enhanced Links.Color.Secondary', key: 'colorSecondary', name: 'Link secondary color', type: 'color', default: '#fb00ff', group: 'Links · Color', tooltip: 'Used when Link colors is Custom.' },
    { id: '🔗 Enhanced Links.Color.Accent', key: 'colorAccent', name: 'Link accent color', type: 'color', default: '#9d00ff', group: 'Links · Color', tooltip: 'Used when Link colors is Custom.' },
    { id: '🔗 Enhanced Links.Color.Scheme', key: 'colorScheme', name: 'Link color boost', type: 'combo', options: COLOR_SCHEME_OPTIONS, default: 'default', group: 'Links · Color', tooltip: 'Filter applied on top of the colors.' },
    { id: '🔗 Enhanced Links.Glow.Intensity', key: 'glowIntensity', name: 'Link glow', type: 'slider', min: 0, max: 20, step: 1, default: 10, group: 'Links · Color' },

    { id: '🔗 Enhanced Links.Marker.Enabled', key: 'markerEnabled', name: 'Flow markers', type: 'boolean', default: true, group: 'Links · Markers', tooltip: 'Shapes gliding along links in Classic Flow.' },
    { id: '🔗 Enhanced Links.Marker.Shape', key: 'markerShape', name: 'Marker shape', type: 'combo', options: MARKER_SHAPE_OPTIONS, default: 'arrow', group: 'Links · Markers' },
    { id: '🔗 Enhanced Links.Marker.Size', key: 'markerSize', name: 'Marker size', type: 'slider', min: 1, max: 5, step: 0.5, default: 3, group: 'Links · Markers' },
    { id: '🔗 Enhanced Links.Marker.Color.Mode', key: 'markerColorMode', name: 'Marker color', type: 'combo', options: MARKER_COLOR_MODE_OPTIONS, default: 'default', group: 'Links · Markers' },
    { id: '🔗 Enhanced Links.Marker.Color', key: 'markerColor', name: 'Marker custom color', type: 'color', default: '#00fff7', group: 'Links · Markers', tooltip: 'Used when Marker color is Custom.' },
    { id: '🔗 Enhanced Links.Marker.Glow', key: 'markerGlow', name: 'Marker glow', type: 'slider', min: 0, max: 20, step: 1, default: 10, group: 'Links · Markers' },
    { id: '🔗 Enhanced Links.Marker.Effects', key: 'markerEffects', name: 'Marker effect', type: 'combo', options: MARKER_EFFECT_OPTIONS, default: 'none', group: 'Links · Markers' },

    { id: '🔗 Enhanced Links.Link.Shadow.Enabled', key: 'linkShadowEnabled', name: 'Link shadow', type: 'boolean', default: false, group: 'Links · Shadows', tooltip: 'Drop shadow under links in Classic Flow.' },
    { id: '🔗 Enhanced Links.Marker.Shadow.Enabled', key: 'markerShadowEnabled', name: 'Marker shadow', type: 'boolean', default: false, group: 'Links · Shadows', tooltip: 'Drop shadow under flow markers.' },
    { id: '🔗 Enhanced Links.Shadow.Blur', key: 'shadowBlur', name: 'Drop shadow blur', type: 'slider', min: 0, max: 10, step: 0.5, default: 5, group: 'Links · Shadows' },
    { id: '🔗 Enhanced Links.Shadow.Offset', key: 'shadowOffset', name: 'Drop shadow offset', type: 'slider', min: 0, max: 10, step: 0.5, default: 3, group: 'Links · Shadows' },

    { id: '🔗 Enhanced Links.Coexist', key: 'coexist', name: 'Other link extensions', type: 'combo', options: COEXIST_OPTIONS, default: 'auto', group: 'Links · Compatibility', tooltip: 'When another extension, such as LinkFX, draws links too. Stepping aside leaves the links to it; node effects keep working.' },

    { id: '📦 Enhanced Nodes.Animate', key: 'animate', name: 'Node effect', type: 'combo', options: NODE_ANIMATION_OPTIONS, default: 0, group: 'Nodes · Effect', tooltip: 'Effect drawn on and around every node.' },
    { id: '📦 Enhanced Nodes.Animations.Enabled', key: 'animationsEnabled', name: 'Show base effect', type: 'boolean', default: true, group: 'Nodes · Effect', tooltip: 'Off hides the effect but keeps node particles.' },
    { id: '📦 Enhanced Nodes.Animation.Speed', key: 'animationSpeed', name: 'Node effect speed', type: 'slider', min: 0.1, max: 5, step: 0.1, default: 1, group: 'Nodes · Effect' },
    { id: '📦 Enhanced Nodes.Direction', key: 'direction', name: 'Node effect direction', type: 'combo', options: DIRECTION_OPTIONS, default: 1, group: 'Nodes · Effect' },
    { id: '📦 Enhanced Nodes.Static.Mode', key: 'staticMode', name: 'Freeze node effects', type: 'boolean', default: false, group: 'Nodes · Effect' },
    { id: '📦 Enhanced Nodes.Intensity', key: 'intensity', name: 'Node effect energy', type: 'slider', min: 0, max: 3, step: 0.1, default: 1, group: 'Nodes · Effect' },
    { id: '📦 Enhanced Nodes.Animation.Size', key: 'animationSize', name: 'Node effect size', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1, group: 'Nodes · Effect' },
    { id: '📦 Enhanced Nodes.Animation.Glow', key: 'animationGlow', name: 'Node effect bloom', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.5, group: 'Nodes · Effect', tooltip: 'Multiplies Node effect energy.' },
    { id: '📦 Enhanced Nodes.Quality', key: 'quality', name: 'Node effect quality', type: 'combo', options: QUALITY_OPTIONS, default: 2, group: 'Nodes · Effect', tooltip: 'More detail, more GPU.' },

    { id: '📦 Enhanced Nodes.Glow.Show', key: 'glowShow', name: 'Node effect glow', type: 'boolean', default: true, group: 'Nodes · Glow & hover', tooltip: 'Off draws node effects without glow.' },
    { id: '📦 Enhanced Nodes.Glow', key: 'glow', name: 'Node glow strength', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.5, group: 'Nodes · Glow & hover', tooltip: 'Glow of node effects and the hover outline.' },
    { id: '📦 Enhanced Nodes.Color.Hover.Show', key: 'colorHoverShow', name: 'Hover outline', type: 'boolean', default: false, group: 'Nodes · Glow & hover', tooltip: 'Outlines animated nodes while hovered or selected.' },
    { id: '📦 Enhanced Nodes.Color.Hover', key: 'colorHover', name: 'Hover outline color', type: 'color', default: '#00ff15', group: 'Nodes · Glow & hover' },

    { id: '📦 Enhanced Nodes.Color.Mode', key: 'colorMode', name: 'Node effect colors', type: 'combo', options: NODE_COLOR_MODE_OPTIONS, default: 'default', group: 'Nodes · Color' },
    { id: '📦 Enhanced Nodes.Color.Primary', key: 'colorPrimary', name: 'Node primary color', type: 'color', default: '#44aaff', group: 'Nodes · Color', tooltip: 'Used when Node effect colors is Custom.' },
    { id: '📦 Enhanced Nodes.Color.Secondary', key: 'colorSecondary', name: 'Node secondary color', type: 'color', default: '#88ccff', group: 'Nodes · Color', tooltip: 'Used when Node effect colors is Custom.' },
    { id: '📦 Enhanced Nodes.Color.Accent', key: 'colorAccent', name: 'Node accent color', type: 'color', default: '#0088ff', group: 'Nodes · Color', tooltip: 'Used when Node effect colors is Custom.' },
    { id: '📦 Enhanced Nodes.Color.Scheme', key: 'colorScheme', name: 'Node color boost', type: 'combo', options: COLOR_SCHEME_OPTIONS, default: 'default', group: 'Nodes · Color', tooltip: 'Filter applied on top of the colors.' },

    { id: '📦 Enhanced Nodes.Particle.Show', key: 'particleShow', name: 'Node particles', type: 'boolean', default: false, group: 'Nodes · Particles', tooltip: 'Also drawn when Node effect is None.' },
    { id: '📦 Enhanced Nodes.Particle.Density', key: 'particleDensity', name: 'Node particle density', type: 'slider', min: 0, max: 3, step: 0.1, default: 1, group: 'Nodes · Particles' },
    { id: '📦 Enhanced Nodes.Particle.Size', key: 'particleSize', name: 'Node particle size', type: 'slider', min: 0.1, max: 3, step: 0.1, default: 1, group: 'Nodes · Particles' },
    { id: '📦 Enhanced Nodes.Particle.Speed', key: 'particleSpeed', name: 'Node particle speed', type: 'slider', min: 0.1, max: 5, step: 0.1, default: 1, group: 'Nodes · Particles' },
    { id: '📦 Enhanced Nodes.Particle.Intensity', key: 'particleIntensity', name: 'Node particle motion', type: 'slider', min: 0, max: 3, step: 0.1, default: 1, group: 'Nodes · Particles', tooltip: 'How energetic the motion is.' },
    { id: '📦 Enhanced Nodes.Particle.Glow', key: 'particleGlow', name: 'Node particle glow', type: 'slider', min: 0, max: 2, step: 0.1, default: 0.5, group: 'Nodes · Particles' },
    { id: '📦 Enhanced Nodes.Particle.Color.Mode', key: 'particleColorMode', name: 'Node particle colors', type: 'combo', options: PARTICLE_COLOR_MODE_OPTIONS, default: 'default', group: 'Nodes · Particles', tooltip: 'Complementary is the opposite hue of the node accent color.' },
    { id: '📦 Enhanced Nodes.Color.Particle', key: 'colorParticle', name: 'Node particle color', type: 'color', default: '#ffff00', group: 'Nodes · Particles', tooltip: 'Used when Node particle colors is Particle color.' },

    { id: '📦 Enhanced Nodes.Text.Animation.Enabled', key: 'textAnimationEnabled', name: 'Animated titles', type: 'boolean', default: false, group: 'Nodes · Titles', tooltip: 'Draws each node title in the chosen style.' },
    { id: '📦 Enhanced Nodes.Text.Style', key: 'textStyle', name: 'Title style', type: 'combo', options: TEXT_STYLE_OPTIONS, default: 'neon', group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Color', key: 'textColor', name: 'Title color', type: 'color', default: '#00ffff', group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Size', key: 'textSize', name: 'Title size', type: 'slider', min: 8, max: 24, step: 1, default: 14, group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Glow', key: 'textGlow', name: 'Title glow', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Letter.Spacing', key: 'textLetterSpacing', name: 'Title letter spacing', type: 'slider', min: -2, max: 10, step: 0.25, default: 0, group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Position.X', key: 'textPositionX', name: 'Title offset X', type: 'slider', min: -50, max: 50, step: 1, default: 0, group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Position.Y', key: 'textPositionY', name: 'Title offset Y', type: 'slider', min: -50, max: 50, step: 1, default: 0, group: 'Nodes · Titles' },
    { id: '📦 Enhanced Nodes.Text.Rotation.Radius', key: 'textRotationRadius', name: 'Title orbit radius', type: 'slider', min: 0, max: 50, step: 1, default: 0, group: 'Nodes · Titles', tooltip: 'Circles the title around its position.' },
    { id: '📦 Enhanced Nodes.Text.Rotation.Angle', key: 'textRotationAngle', name: 'Title rotation', type: 'slider', min: -180, max: 180, step: 5, default: 0, group: 'Nodes · Titles' },

    { id: '🔗 Enhanced Links.Pause.During.Render', key: 'pauseDuringRender', name: 'Pause link animation during runs', type: 'boolean', default: true, group: 'Runs · During a run', tooltip: 'Links hold a still frame while the queue is running.' },
    { id: '📦 Enhanced Nodes.Pause.During.Render', key: 'pauseDuringRender', name: 'Pause node effects during runs', type: 'boolean', default: true, group: 'Runs · During a run', tooltip: 'Node effects hold still while the queue is running; their particles keep moving.' },
    { id: '📦 Enhanced Nodes.End Animation.Enabled', key: 'endAnimationEnabled', name: 'Completion effect', type: 'boolean', default: false, group: 'Runs · Completion', tooltip: 'Has no effect yet.' },
] as const satisfies readonly Setting[];

// =============================================================================
// Migrations
// =============================================================================

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * migrateDeprecatedValue for every setting, by type. v2.0.1 registered every
 * number, and the strings Marker.Effects, Particle.Color.Mode and Text.Style, as
 * 0-20 sliders, so a combo value outside its options becomes the default and
 * numbers are clamped to range; text that is a number counts as that number.
 * Valid values come back unchanged.
 */
function normalize(s: Setting, value: unknown): unknown {
    const numeric = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    switch (s.type) {
        case 'boolean':
            if (typeof value === 'boolean') return value;
            return value === 'true' ? true : value === 'false' ? false : s.default;
        case 'slider':
            return typeof numeric === 'number' && !Number.isNaN(numeric) ? Math.min(s.max, Math.max(s.min, numeric)) : s.default;
        case 'combo':
            return s.options.find((o) => o.value === value || o.value === numeric)?.value ?? s.default;
        case 'color':
            // Whole hex colours only: 1.39.5's hex field stores every keystroke, and '#abc' may be how '#abcdef' starts.
            return typeof value === 'string' && HEX.test(value) ? `#${value.replace('#', '').toLowerCase()}` : value;
    }
}

// =============================================================================
// Snapshots and registration
// =============================================================================

type Entry = (typeof SETTINGS)[number];

/** The values of the settings whose ids start with P, by key. */
type Snapshot<P extends string> = {
    [E in Entry as E['id'] extends `${P}${string}` ? E['key'] : never]: E['default'] extends boolean ? boolean : E['default'] extends number ? number : string;
};

function snapshot(prefix: string): Record<string, unknown> {
    return Object.fromEntries(SETTINGS.filter((s) => s.id.startsWith(prefix)).map((s) => [s.key, s.default] as const));
}

/** The link settings' live values. Only onChange and preview() write them, so reading them costs nothing per frame, unlike the settings store. */
export const L = snapshot(LINKS) as Snapshot<typeof LINKS>;
/** The node settings' live values, kept like L. */
export const N = snapshot(NODES) as Snapshot<typeof NODES>;

/** Counts the changes to L and N, so what any setting can affect can tell that one changed. */
export let revision = 0;

/** The snapshot that holds a setting's live value: L for link ids, N for node ids. */
export function snapshotOf(id: string): Record<string, unknown> {
    return id.startsWith(LINKS) ? L : N;
}

/** Puts a value in its snapshot and, if that changed it, asks for one redraw. A colour still being typed leaves the default there until it parses. */
function show(s: Setting, value: unknown): void {
    const values = snapshotOf(s.id);
    const shown = s.type !== 'color' || HEX.test(String(value)) ? value : s.default;
    // commit() shows a value before the store hands it back through onChange.
    if (values[s.key] === shown) return;
    values[s.key] = shown;
    revision++;
    // app.canvas does not exist yet while the extensions register.
    app.canvas?.setDirty(true, true);
}

/** What an extension registers for the settings whose ids start with `prefix`. */
function params(prefix: string): SettingParams[] {
    return SETTINGS.flatMap((s: Setting, i): SettingParams[] => s.id.startsWith(prefix) ? [{
        // The package types id as keyof Settings, the core ids only; the settings store takes any string.
        id: s.id as SettingParams['id'],
        name: s.name,
        tooltip: s.tooltip,
        category: ['Enhanced Links & Nodes', s.group, s.id],
        sortOrder: SETTINGS.length - i,
        type: s.type,
        attrs: s.type === 'slider' ? { min: s.min, max: s.max, step: s.step } : undefined,
        options: s.type === 'combo' ? [...s.options] : undefined,
        defaultValue: s.default,
        migrateDeprecatedValue: (value: unknown) => normalize(s, value),
        onChange: (value: unknown) => show(s, value),
    }] : []);
}

export const linkSettings = params(LINKS);
export const nodeSettings = params(NODES);

// =============================================================================
// Writes
// =============================================================================

/** Committed values not yet handed to the settings store, by id. */
const unsaved = new Map<string, unknown>();
/** The store's writes, one at a time, in commit order. */
let saving = Promise.resolve();

/** Shows a value without saving it, for a control that is still moving. It is migrated as the store would, so a commit's onChange finds it shown. */
export function preview(id: string, value: unknown): void {
    const s = SETTINGS.find((e) => e.id === id)!;
    show(s, normalize(s, value));
}

/**
 * Shows a value and queues it for the settings store, which saves it with one
 * POST. The store gets one write at a time; a commit to an id that is still
 * waiting its turn replaces the value it will write.
 */
export function commit(id: string, value: unknown): void {
    preview(id, value);
    if (!unsaved.has(id)) saving = saving.then(() => save(id));
    unsaved.set(id, value);
}

async function save(id: string): Promise<void> {
    const value = unsaved.get(id);
    unsaved.delete(id);
    try {
        // set() returns the store's promise, though the package types it as void.
        await app.extensionManager.setting.set(id, value);
    } catch (error) {
        // A failed POST (the server restarting, say) must not stop the writes queued behind it.
        console.warn(`[EnhancedLinks] Could not save ${id}:`, error);
    }
}

/** Commits the default of every setting whose id starts with `prefix` and whose value is not the default. */
export function reset(prefix: string): void {
    for (const s of SETTINGS) {
        if (s.id.startsWith(prefix) && snapshotOf(s.id)[s.key] !== s.default) commit(s.id, s.default);
    }
}
