/**
 * The settings schema, in display order: each setting's id, snapshot key, dialog
 * text, type, options or range, default, dialog group, and how the panel shows
 * it. Each extension registers its own settings from it, and their onChange
 * keeps the live snapshots L (links) and N (nodes) current. The panel previews
 * values into the snapshots, commits them through one write queue, and hears
 * of every change through watch().
 *
 * Until the first-run picker is answered (Look is ''), a value stored before
 * the page loaded that equals its v2.0.1 default counts as unset, so the
 * defaults show, until someone sets it: the v2 panel's Reset saved every
 * default into users' files.
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

/** Setting values by id. */
export type Values = Readonly<Record<string, unknown>>;

/**
 * What a setting needs to take effect, while that is missing: why, and the setting and value that give it, ours or
 * one of ComfyUI's, which the panel has no name for and so comes with the label its fix shows.
 */
interface Need {
    reason: string;
    id: string;
    value: unknown;
    label?: string;
}

/** What the panel shows: its tab, whether Advanced is open, and what is searched for. */
interface PanelState {
    tab: string;
    advanced: boolean;
    search: string;
}

type Shown = {
    group: string;
    /** Shown once the panel's Advanced is open. */
    advanced?: true;
    /** False for a setting looks leave alone: how you work rather than how it looks. */
    look?: false;
    /** Whether the setting applies; the panel hides it while it does not. */
    showIf?: () => boolean;
    /** What it needs from another section to take effect; the panel disables it with the reason and the fix. */
    needs?: () => Need | undefined;
} & (
    | { type: 'boolean'; default: boolean }
    | { type: 'slider'; default: number; min: number; max: number; step: number }
    /** `snap`: numeric presets, so a number between them stands for the nearest. */
    | { type: 'combo'; default: number | string; options: readonly Option[]; snap?: true }
    | { type: 'color'; default: string }
);

/** A hidden setting is saved like any other, but the settings dialog leaves it out. */
export type Setting = { id: string; key: string; name: string; tooltip?: string } & (Shown | { type: 'hidden'; default: string | PanelState });

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
    { value: 'spline', text: 'Same as ComfyUI' },
    { value: 'straight', text: 'Direct' },
    { value: 'linear', text: 'Right-angle' },
    { value: 'hidden', text: 'Effect only' },
    { value: 'dotted', text: 'Dotted' },
    { value: 'dashed', text: 'Dashed' },
    { value: 'double', text: 'Double' },
    { value: 'stepped', text: 'Stepped' },
    { value: 'zigzag', text: 'Wave' },
    { value: 'coil', text: 'Coil' },
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
    { value: 'merkaba', text: 'Merkaba' },
] as const;

const MARKER_EFFECT_OPTIONS = [
    { value: 'none', text: 'None' },
    { value: 'pulse', text: 'Pulse' },
    { value: 'fade', text: 'Fade' },
    { value: 'rainbow', text: 'Rainbow' },
] as const;

export const NODE_ANIMATION_OPTIONS = [
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
    { value: 'inherit', text: 'Same as link' },
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

/** v1's presets (old_link_animations.js:1167-1202). */
const DENSITY_OPTIONS = [
    { value: 0.5, text: 'Minimal' },
    { value: 1, text: 'Balanced' },
    { value: 2, text: 'Dense' },
    { value: 3, text: 'Ultra' },
] as const;

const SHADOW_STYLE_OPTIONS = [
    { value: 'halo', text: 'Halo (v1)' },
    { value: 'drop', text: 'Drop shadow (v2)' },
] as const;

const DIRECTION_OPTIONS = [
    { value: 1, text: 'Forward' },
    { value: -1, text: 'Reverse' },
] as const;

const BLEND_OPTIONS = [
    { value: 'normal', text: 'Normal' },
    { value: 'additive', text: 'Additive glow' },
] as const;

const MAX_FPS_OPTIONS = [
    { value: 30, text: '30 fps' },
    { value: 60, text: '60 fps' },
    { value: 0, text: 'Display rate' },
] as const;

const MOTION_OPTIONS = [
    { value: 'system', text: 'Follow system' },
    { value: 'reduce', text: 'Reduce' },
    { value: 'full', text: 'Full' },
] as const;

const FOCUS_MODE_OPTIONS = [
    { value: 'highlight', text: 'Highlight' },
    { value: 'animate', text: 'Animate only these' },
    { value: 'dim', text: 'Dim others' },
    { value: 'hide', text: 'Hide others' },
] as const;

const FOCUS_COLOR_OPTIONS = [
    { value: 'native', text: 'White (ComfyUI)' },
    { value: 'accent', text: 'Theme accent' },
    { value: 'type', text: 'Link type color' },
] as const;

const FOCUS_DEPTH_OPTIONS = [
    { value: 'direct', text: 'Direct links' },
    { value: 'upstream', text: 'Everything feeding in' },
    { value: 'downstream', text: 'Everything it feeds' },
    { value: 'chain', text: 'Whole chain' },
] as const;

const PAUSE_MODE_OPTIONS = [
    { value: 'pause', text: 'Freeze effects' },
    { value: 'calm', text: 'Calm' },
    { value: 'spotlight', text: 'Spotlight' },
    { value: 'ignore', text: 'Keep animating' },
] as const;

const COMPLETION_STYLE_OPTIONS = [
    { value: 'fireworks', text: 'Fireworks' },
    { value: 'confetti', text: 'Confetti' },
    { value: 'shockwave', text: 'Shockwave' },
    { value: 'trace', text: 'Path trace' },
    { value: 'random', text: 'Surprise' },
] as const;

const COMPLETION_ANCHOR_OPTIONS = [
    { value: 'outputs', text: 'Output nodes' },
    { value: 'primary', text: 'Primary nodes' },
    { value: 'viewport', text: 'Center of screen' },
] as const;

const COEXIST_OPTIONS = [
    { value: 'auto', text: 'Step aside if one is found' },
    { value: 'ours', text: 'Keep Enhanced link effects' },
    { value: 'defer', text: 'Always step aside' },
] as const;

// =============================================================================
// When settings apply
// =============================================================================

/** Classic Flow, whose only motion is its markers. */
const CLASSIC = 9;
/** The link animations whose particles Particle.Density counts: Sacred Flow, Crystal Stream, Quantum Field, Lava Flow and Stellar Plasma. */
const DENSE = new Set<number>([1, 2, 3, 7, 8]);

const linksOn = (): boolean => L.enabled && L.animate !== 0;
/** Whether the links carry flow markers: Classic Flow's, or every animation's with Marker.All. */
const markers = (): boolean => linksOn() && (L.animate === CLASSIC || L.markerAll) && L.markerEnabled;
const shadows = (): boolean => (linksOn() && L.animate === CLASSIC && L.linkShadowEnabled) || (markers() && L.markerShadowEnabled);
/** Whether the node effects draw on every node. Nodes given a style of their own in the node menu use their settings with Animate None too. */
const effects = (): boolean => N.enabled && N.animate !== 0;
/** Whether the nodes draw anything that takes the node colours: an effect, particles or styled titles. */
const nodesDraw = (): boolean => N.enabled && (N.animate !== 0 || N.particleShow || N.textAnimationEnabled);
const particles = (): boolean => N.enabled && N.particleShow;
const focusOn = (): boolean => L.focusEnabled;
/** Whether a run changes anything: Pause.Mode is not Keep animating. */
const runsChange = (): boolean => L.pauseMode !== 'ignore';
const titles = (): boolean => N.enabled && N.textAnimationEnabled;

/** The fix for a node colour that only Custom colours use. */
const customNodes = (): Need | undefined =>
    N.colorMode === 'custom' ? undefined : { reason: 'Used when Node effect colors is Custom.', id: '📦 Enhanced Nodes.Color.Mode', value: 'custom' };

/**
 * The fix for what only classic nodes do, while Nodes 2.0 draws the nodes: the styled titles and the hover outline,
 * and focus on hover and double-click jumps, as the DOM nodes keep the pointer from the canvas.
 */
const classicNodes = (): Need | undefined =>
    LiteGraph.vueNodesMode ? { reason: 'Classic nodes only.', id: 'Comfy.VueNodes.Enabled', value: false, label: 'Use classic nodes' } : undefined;

// =============================================================================
// Schema
// =============================================================================

const LINKS = '🔗 Enhanced Links.';
const NODES = '📦 Enhanced Nodes.';
export const LOOK = '🔗 Enhanced Links.Look';
const PANEL_STATE: PanelState = { tab: 'looks', advanced: false, search: '' };

/** Each key is the id after its prefix in camelCase. */
export const SETTINGS = [
    { id: '🔗 Enhanced Links.Enabled', key: 'enabled', name: 'Link effects', type: 'boolean', default: true, group: 'Links · Effect', look: false, tooltip: 'Off draws native ComfyUI links and leaves every other link setting as it is.' },
    { id: '🔗 Enhanced Links.Animate', key: 'animate', name: 'Link animation', type: 'combo', options: LINK_ANIMATION_OPTIONS, default: 9, group: 'Links · Effect', showIf: (): boolean => L.enabled, tooltip: 'Effect drawn along every link.' },
    { id: '🔗 Enhanced Links.Animation.Speed', key: 'animationSpeed', name: 'Link animation speed', type: 'slider', min: 0.1, max: 3, step: 0.05, default: 1, group: 'Links · Effect', showIf: (): boolean => linksOn() && !L.staticMode },
    { id: '🔗 Enhanced Links.Direction', key: 'direction', name: 'Link flow direction', type: 'combo', options: DIRECTION_OPTIONS, default: 1, group: 'Links · Effect', advanced: true, showIf: linksOn, tooltip: 'Which way effects travel.' },
    { id: '🔗 Enhanced Links.Static.Mode', key: 'staticMode', name: 'Freeze link animation', type: 'boolean', default: false, group: 'Links · Effect', showIf: linksOn, tooltip: 'Keep the look but stop the motion.' },

    { id: '🔗 Enhanced Links.Link.Style', key: 'linkStyle', name: 'Link path shape', type: 'combo', options: LINK_STYLE_OPTIONS, default: 'spline', group: 'Links · Path', showIf: linksOn, tooltip: 'Same as ComfyUI follows the Link Render Mode setting.' },
    { id: '🔗 Enhanced Links.Thickness', key: 'thickness', name: 'Link thickness', type: 'slider', min: 1, max: 10, step: 0.5, default: 3, group: 'Links · Path', showIf: linksOn },
    { id: '🔗 Enhanced Links.Quality', key: 'quality', name: 'Link effect quality', type: 'combo', options: QUALITY_OPTIONS, default: 1, group: 'Links · Path', advanced: true, showIf: linksOn, tooltip: 'More detail, more GPU.' },
    { id: '🔗 Enhanced Links.Particle.Density', key: 'particleDensity', name: 'Link particle density', type: 'combo', options: DENSITY_OPTIONS, snap: true, default: 0.5, group: 'Links · Path', advanced: true, showIf: (): boolean => (linksOn() && DENSE.has(L.animate)) || markers(), tooltip: 'How many particles or markers each link carries.' },

    { id: '🔗 Enhanced Links.Color.Mode', key: 'colorMode', name: 'Link colors', type: 'combo', options: LINK_COLOR_MODE_OPTIONS, default: 'default', group: 'Links · Color', showIf: linksOn, tooltip: 'Type colors follow your palette.' },
    { id: '🔗 Enhanced Links.Color.Primary', key: 'colorPrimary', name: 'Link primary color', type: 'color', default: '#ffb300', group: 'Links · Color', showIf: (): boolean => linksOn() && L.colorMode === 'custom', tooltip: 'Used when Link colors is Custom.' },
    { id: '🔗 Enhanced Links.Color.Secondary', key: 'colorSecondary', name: 'Link secondary color', type: 'color', default: '#fb00ff', group: 'Links · Color', showIf: (): boolean => linksOn() && L.colorMode === 'custom', tooltip: 'Used when Link colors is Custom.' },
    { id: '🔗 Enhanced Links.Color.Accent', key: 'colorAccent', name: 'Link accent color', type: 'color', default: '#9d00ff', group: 'Links · Color', showIf: (): boolean => linksOn() && L.colorMode === 'custom', tooltip: 'Used when Link colors is Custom.' },
    { id: '🔗 Enhanced Links.Color.Scheme', key: 'colorScheme', name: 'Link color boost', type: 'combo', options: COLOR_SCHEME_OPTIONS, default: 'default', group: 'Links · Color', advanced: true, showIf: linksOn, tooltip: 'Filter applied on top of the colors.' },
    { id: '🔗 Enhanced Links.Glow.Intensity', key: 'glowIntensity', name: 'Link glow', type: 'slider', min: 0, max: 20, step: 1, default: 10, group: 'Links · Color', showIf: linksOn },
    { id: '🔗 Enhanced Links.Blend', key: 'blend', name: 'Glow blending', type: 'combo', options: BLEND_OPTIONS, default: 'normal', group: 'Links · Color', advanced: true, showIf: linksOn, tooltip: 'Additive glow lets the moving effects brighten where they cross, on dark palettes; light palettes and canvas background images always use Normal.' },

    { id: '🔗 Enhanced Links.Marker.Enabled', key: 'markerEnabled', name: 'Flow markers', type: 'boolean', default: true, group: 'Links · Markers', showIf: (): boolean => linksOn() && (L.animate === CLASSIC || L.markerAll), tooltip: 'Shapes gliding along links in Classic Flow, and in the other animations with Markers on every animation.' },
    { id: '🔗 Enhanced Links.Marker.All', key: 'markerAll', name: 'Markers on every animation', type: 'boolean', default: false, group: 'Links · Markers', advanced: true, showIf: (): boolean => linksOn() && L.animate !== CLASSIC, tooltip: 'Flow markers over every link animation, not only Classic Flow.' },
    { id: '🔗 Enhanced Links.Marker.Shape', key: 'markerShape', name: 'Marker shape', type: 'combo', options: MARKER_SHAPE_OPTIONS, default: 'arrow', group: 'Links · Markers', showIf: markers },
    { id: '🔗 Enhanced Links.Marker.Size', key: 'markerSize', name: 'Marker size', type: 'slider', min: 1, max: 5, step: 0.5, default: 3, group: 'Links · Markers', showIf: markers },
    { id: '🔗 Enhanced Links.Marker.Color.Mode', key: 'markerColorMode', name: 'Marker color', type: 'combo', options: MARKER_COLOR_MODE_OPTIONS, default: 'default', group: 'Links · Markers', advanced: true, showIf: markers, tooltip: 'Same as link follows custom link colors.' },
    { id: '🔗 Enhanced Links.Marker.Color', key: 'markerColor', name: 'Marker custom color', type: 'color', default: '#00fff7', group: 'Links · Markers', advanced: true, showIf: (): boolean => markers() && L.markerColorMode === 'custom', tooltip: 'Used when Marker color is Custom.' },
    { id: '🔗 Enhanced Links.Marker.Glow', key: 'markerGlow', name: 'Marker glow', type: 'slider', min: 0, max: 20, step: 1, default: 10, group: 'Links · Markers', advanced: true, showIf: markers },
    { id: '🔗 Enhanced Links.Marker.Effects', key: 'markerEffects', name: 'Marker effect', type: 'combo', options: MARKER_EFFECT_OPTIONS, default: 'none', group: 'Links · Markers', advanced: true, showIf: markers },

    { id: '🔗 Enhanced Links.Link.Shadow.Enabled', key: 'linkShadowEnabled', name: 'Link shadow', type: 'boolean', default: true, group: 'Links · Shadows', showIf: (): boolean => linksOn() && L.animate === CLASSIC, tooltip: 'Dark outline under links in Classic Flow, which makes them stand out.' },
    { id: '🔗 Enhanced Links.Marker.Shadow.Enabled', key: 'markerShadowEnabled', name: 'Marker shadow', type: 'boolean', default: true, group: 'Links · Shadows', advanced: true, showIf: markers, tooltip: 'Dark outline under flow markers.' },
    { id: '🔗 Enhanced Links.Shadow.Style', key: 'shadowStyle', name: 'Shadow style', type: 'combo', options: SHADOW_STYLE_OPTIONS, default: 'halo', group: 'Links · Shadows', advanced: true, showIf: shadows, tooltip: 'Halo is the soft dark outline v1 drew; Drop shadow is offset, as in v2.' },
    { id: '🔗 Enhanced Links.Shadow.Blur', key: 'shadowBlur', name: 'Drop shadow blur', type: 'slider', min: 0, max: 10, step: 0.5, default: 5, group: 'Links · Shadows', advanced: true, showIf: (): boolean => shadows() && L.shadowStyle === 'drop', tooltip: 'Used by Drop shadow.' },
    { id: '🔗 Enhanced Links.Shadow.Offset', key: 'shadowOffset', name: 'Drop shadow offset', type: 'slider', min: 0, max: 10, step: 0.5, default: 3, group: 'Links · Shadows', advanced: true, showIf: (): boolean => shadows() && L.shadowStyle === 'drop', tooltip: 'Used by Drop shadow.' },

    { id: '📦 Enhanced Nodes.Enabled', key: 'enabled', name: 'Node effects', type: 'boolean', default: true, group: 'Nodes · Effect', look: false, tooltip: 'Off draws native ComfyUI nodes, with no effects, halos, particles, styled titles or completion effects, and leaves every other node setting as it is.' },
    { id: '📦 Enhanced Nodes.Animate', key: 'animate', name: 'Node effect', type: 'combo', options: NODE_ANIMATION_OPTIONS, default: 0, group: 'Nodes · Effect', showIf: (): boolean => N.enabled, tooltip: 'Effect drawn on and around every node. Node FX in the node menu picks one for a node.' },
    { id: '📦 Enhanced Nodes.Animations.Enabled', key: 'animationsEnabled', name: 'Show base effect', type: 'boolean', default: true, group: 'Nodes · Effect', advanced: true, showIf: effects, tooltip: "Off draws only the effect's own particles." },
    { id: '📦 Enhanced Nodes.Animation.Speed', key: 'animationSpeed', name: 'Node effect speed', type: 'slider', min: 0.1, max: 3, step: 0.1, default: 1, group: 'Nodes · Effect', advanced: true, showIf: (): boolean => effects() && !N.staticMode },
    { id: '📦 Enhanced Nodes.Direction', key: 'direction', name: 'Node effect direction', type: 'combo', options: DIRECTION_OPTIONS, default: 1, group: 'Nodes · Effect', advanced: true, showIf: effects },
    { id: '📦 Enhanced Nodes.Static.Mode', key: 'staticMode', name: 'Freeze node effects', type: 'boolean', default: false, group: 'Nodes · Effect', showIf: nodesDraw },
    { id: '📦 Enhanced Nodes.Intensity', key: 'intensity', name: 'Node effect energy', type: 'slider', min: 0.1, max: 2, step: 0.1, default: 1, group: 'Nodes · Effect', advanced: true, showIf: effects },
    { id: '📦 Enhanced Nodes.Animation.Size', key: 'animationSize', name: 'Node effect size', type: 'slider', min: 0.5, max: 3, step: 0.1, default: 1, group: 'Nodes · Effect', advanced: true, showIf: effects },
    { id: '📦 Enhanced Nodes.Animation.Glow', key: 'animationGlow', name: 'Node effect bloom', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, group: 'Nodes · Effect', advanced: true, showIf: effects, tooltip: "Glow of the effect's lines and light, and of the hover outline." },
    { id: '📦 Enhanced Nodes.Quality', key: 'quality', name: 'Node effect quality', type: 'combo', options: QUALITY_OPTIONS, default: 2, group: 'Nodes · Effect', advanced: true, showIf: effects, tooltip: 'More detail, more GPU.' },

    { id: '📦 Enhanced Nodes.Glow.Show', key: 'glowShow', name: 'Node effect glow', type: 'boolean', default: true, group: 'Nodes · Glow & hover', showIf: effects, tooltip: "A halo in the effect's primary color around each node with an effect." },
    { id: '📦 Enhanced Nodes.Glow', key: 'glow', name: 'Node glow strength', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, group: 'Nodes · Glow & hover', showIf: (): boolean => effects() && (N.glowShow || N.selectionGlow), tooltip: 'How far the halo and the selection frame glow.' },
    { id: '📦 Enhanced Nodes.Selection.Glow', key: 'selectionGlow', name: 'Glowing frame around selected nodes', type: 'boolean', default: true, group: 'Nodes · Glow & hover', showIf: effects, tooltip: 'On nodes with an effect.' },
    { id: '📦 Enhanced Nodes.Color.Hover.Show', key: 'colorHoverShow', name: 'Hover outline', type: 'boolean', default: false, group: 'Nodes · Glow & hover', advanced: true, showIf: effects, needs: classicNodes, tooltip: 'Outlines animated nodes while hovered or selected.' },
    { id: '📦 Enhanced Nodes.Color.Hover', key: 'colorHover', name: 'Hover outline color', type: 'color', default: '#00ff15', group: 'Nodes · Glow & hover', advanced: true, showIf: (): boolean => effects() && N.colorHoverShow, needs: classicNodes },

    { id: '📦 Enhanced Nodes.Color.Mode', key: 'colorMode', name: 'Node effect colors', type: 'combo', options: NODE_COLOR_MODE_OPTIONS, default: 'default', group: 'Nodes · Color', showIf: nodesDraw },
    { id: '📦 Enhanced Nodes.Color.Primary', key: 'colorPrimary', name: 'Node primary color', type: 'color', default: '#ffb300', group: 'Nodes · Color', showIf: (): boolean => nodesDraw() && N.colorMode === 'custom', tooltip: 'Used when Node effect colors is Custom.' },
    { id: '📦 Enhanced Nodes.Color.Secondary', key: 'colorSecondary', name: 'Node secondary color', type: 'color', default: '#fb00ff', group: 'Nodes · Color', showIf: (): boolean => nodesDraw() && N.colorMode === 'custom', tooltip: 'Used when Node effect colors is Custom.' },
    { id: '📦 Enhanced Nodes.Color.Accent', key: 'colorAccent', name: 'Node accent color', type: 'color', default: '#9d00ff', group: 'Nodes · Color', showIf: (): boolean => nodesDraw() && N.colorMode === 'custom', tooltip: 'Used when Node effect colors is Custom.' },
    { id: '📦 Enhanced Nodes.Color.Scheme', key: 'colorScheme', name: 'Node color boost', type: 'combo', options: COLOR_SCHEME_OPTIONS, default: 'default', group: 'Nodes · Color', advanced: true, showIf: nodesDraw, tooltip: 'Filter applied on top of the colors.' },

    { id: '📦 Enhanced Nodes.Particle.Show', key: 'particleShow', name: 'Node particles', type: 'boolean', default: false, group: 'Nodes · Particles', showIf: (): boolean => N.enabled, tooltip: 'Also drawn when Node effect is None.' },
    { id: '📦 Enhanced Nodes.Particle.Density', key: 'particleDensity', name: 'Node particle density', type: 'combo', options: DENSITY_OPTIONS, snap: true, default: 1, group: 'Nodes · Particles', showIf: particles },
    { id: '📦 Enhanced Nodes.Particle.Size', key: 'particleSize', name: 'Node particle size', type: 'slider', min: 0.1, max: 3, step: 0.1, default: 1, group: 'Nodes · Particles', advanced: true, showIf: particles },
    { id: '📦 Enhanced Nodes.Particle.Speed', key: 'particleSpeed', name: 'Node particle speed', type: 'slider', min: 0.1, max: 5, step: 0.1, default: 1, group: 'Nodes · Particles', advanced: true, showIf: particles },
    { id: '📦 Enhanced Nodes.Particle.Intensity', key: 'particleIntensity', name: 'Node particle motion', type: 'slider', min: 0.1, max: 2, step: 0.1, default: 1, group: 'Nodes · Particles', advanced: true, showIf: particles, tooltip: 'How energetic the motion is.' },
    { id: '📦 Enhanced Nodes.Particle.Glow', key: 'particleGlow', name: 'Node particle glow', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, group: 'Nodes · Particles', advanced: true, showIf: particles },
    { id: '📦 Enhanced Nodes.Particle.Color.Mode', key: 'particleColorMode', name: 'Node particle colors', type: 'combo', options: PARTICLE_COLOR_MODE_OPTIONS, default: 'default', group: 'Nodes · Particles', showIf: particles, tooltip: "Particle color takes Node particle color with Custom colors, else the effect's primary color; Complementary takes its opposite hue." },
    { id: '📦 Enhanced Nodes.Color.Particle', key: 'colorParticle', name: 'Node particle color', type: 'color', default: '#ffb300', group: 'Nodes · Particles', showIf: (): boolean => particles() && (N.particleColorMode === 'default' || N.particleColorMode === 'complementary'), needs: customNodes, tooltip: 'Used when Node effect colors is Custom.' },

    { id: '📦 Enhanced Nodes.Text.Animation.Enabled', key: 'textAnimationEnabled', name: 'Animated titles', type: 'boolean', default: false, group: 'Nodes · Titles', showIf: (): boolean => N.enabled, needs: classicNodes, tooltip: 'Draws each node title in the chosen style.' },
    { id: '📦 Enhanced Nodes.Text.Style', key: 'textStyle', name: 'Title style', type: 'combo', options: TEXT_STYLE_OPTIONS, default: 'neon', group: 'Nodes · Titles', showIf: titles, needs: classicNodes },
    { id: '📦 Enhanced Nodes.Text.Color', key: 'textColor', name: 'Title color', type: 'color', default: '#00ffff', group: 'Nodes · Titles', showIf: titles, needs: (): Need | undefined => classicNodes() ?? customNodes(), tooltip: "Used when Node effect colors is Custom; otherwise titles take the effect's accent color." },
    { id: '📦 Enhanced Nodes.Text.Size', key: 'textSize', name: 'Title size', type: 'slider', min: 8, max: 24, step: 1, default: 14, group: 'Nodes · Titles', showIf: titles, needs: classicNodes },
    { id: '📦 Enhanced Nodes.Text.Glow', key: 'textGlow', name: 'Title glow', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.5, group: 'Nodes · Titles', advanced: true, showIf: titles, needs: classicNodes },
    { id: '📦 Enhanced Nodes.Text.Letter.Spacing', key: 'textLetterSpacing', name: 'Title letter spacing', type: 'slider', min: -2, max: 10, step: 0.25, default: 0, group: 'Nodes · Titles', advanced: true, showIf: titles, needs: classicNodes },
    { id: '📦 Enhanced Nodes.Text.Position.X', key: 'textPositionX', name: 'Title offset X', type: 'slider', min: -50, max: 50, step: 1, default: 0, group: 'Nodes · Titles', advanced: true, showIf: titles, needs: classicNodes },
    { id: '📦 Enhanced Nodes.Text.Position.Y', key: 'textPositionY', name: 'Title offset Y', type: 'slider', min: -50, max: 50, step: 1, default: 0, group: 'Nodes · Titles', advanced: true, showIf: titles, needs: classicNodes },
    { id: '📦 Enhanced Nodes.Text.Rotation.Radius', key: 'textRotationRadius', name: 'Title orbit radius', type: 'slider', min: 0, max: 50, step: 1, default: 0, group: 'Nodes · Titles', advanced: true, showIf: titles, needs: classicNodes, tooltip: 'Circles the title around its position.' },
    { id: '📦 Enhanced Nodes.Text.Rotation.Angle', key: 'textRotationAngle', name: 'Title rotation', type: 'slider', min: -180, max: 180, step: 5, default: 0, group: 'Nodes · Titles', advanced: true, showIf: titles, needs: classicNodes },

    { id: '🔗 Enhanced Links.Focus.Enabled', key: 'focusEnabled', name: 'Selection focus', type: 'boolean', default: true, group: 'Focus & Flow · Selection focus', look: false, tooltip: "Make the selection's connections stand out." },
    { id: '🔗 Enhanced Links.Focus.Mode', key: 'focusMode', name: 'Selection focus mode', type: 'combo', options: FOCUS_MODE_OPTIONS, default: 'highlight', group: 'Focus & Flow · Selection focus', look: false, showIf: focusOn },
    { id: '🔗 Enhanced Links.Focus.Color', key: 'focusColor', name: 'Focused link color', type: 'combo', options: FOCUS_COLOR_OPTIONS, default: 'native', group: 'Focus & Flow · Selection focus', look: false, showIf: focusOn },
    { id: '🔗 Enhanced Links.Focus.Depth', key: 'focusDepth', name: 'Focus reach', type: 'combo', options: FOCUS_DEPTH_OPTIONS, default: 'direct', group: 'Focus & Flow · Selection focus', look: false, showIf: focusOn },
    { id: '🔗 Enhanced Links.Focus.OnTop', key: 'focusOnTop', name: 'Bring focused links to front', type: 'boolean', default: true, group: 'Focus & Flow · Selection focus', look: false, showIf: focusOn, tooltip: 'Draws them above nodes.' },
    { id: '🔗 Enhanced Links.Focus.Hover', key: 'focusHover', name: 'Focus on hover', type: 'boolean', default: false, group: 'Focus & Flow · Selection focus', look: false, showIf: focusOn, needs: classicNodes, tooltip: 'Hover a node to focus it without selecting.' },
    { id: '🔗 Enhanced Links.Focus.Dim', key: 'focusDim', name: 'Dimmed link opacity', type: 'slider', min: 5, max: 60, step: 5, default: 20, group: 'Focus & Flow · Selection focus', advanced: true, look: false, showIf: (): boolean => focusOn() && L.focusMode === 'dim' },

    { id: '🔗 Enhanced Links.Navigate.DoubleClick', key: 'navigateDoubleClick', name: 'Double-click a slot to jump', type: 'boolean', default: true, group: 'Focus & Flow · Navigation', look: false, needs: classicNodes, tooltip: 'Fly to the other end; repeat to cycle.' },
    { id: '🔗 Enhanced Links.Navigate.Follow', key: 'navigateFollow', name: 'Follow execution', type: 'boolean', default: false, group: 'Focus & Flow · Navigation', look: false, tooltip: 'Pan to each node as your run reaches it.' },

    { id: '🔗 Enhanced Links.Pause.Mode', key: 'pauseMode', name: 'During a run', type: 'combo', options: PAUSE_MODE_OPTIONS, default: 'spotlight', group: 'Focus & Flow · During a run', tooltip: 'Reacts to your own runs only.' },
    { id: '🔗 Enhanced Links.Pause.During.Render', key: 'pauseDuringRender', name: 'Apply run behavior to links', type: 'boolean', default: true, group: 'Focus & Flow · During a run', advanced: true, showIf: runsChange, tooltip: 'Off = links ignore runs.' },
    { id: '📦 Enhanced Nodes.Pause.During.Render', key: 'pauseDuringRender', name: 'Apply run behavior to nodes', type: 'boolean', default: true, group: 'Focus & Flow · During a run', advanced: true, showIf: runsChange },
    { id: '🔗 Enhanced Links.Flow.River', key: 'flowRiver', name: 'Data river', type: 'boolean', default: true, group: 'Focus & Flow · During a run', showIf: (): boolean => L.enabled, tooltip: 'Light flowing into the running node.' },
    { id: '🔗 Enhanced Links.Flow.Trail', key: 'flowTrail', name: 'Executed-path trail', type: 'boolean', default: true, group: 'Focus & Flow · During a run', showIf: (): boolean => L.enabled, tooltip: "The run's path keeps a fading glow." },
    { id: '🔗 Enhanced Links.Flow.Trail.Fade', key: 'flowTrailFade', name: 'Trail fade time', type: 'slider', min: 2, max: 30, step: 1, default: 8, group: 'Focus & Flow · During a run', advanced: true, look: false, showIf: (): boolean => L.enabled && L.flowTrail },
    { id: '📦 Enhanced Nodes.Run.Ring', key: 'runRing', name: 'Progress ring', type: 'boolean', default: true, group: 'Focus & Flow · During a run', showIf: (): boolean => N.enabled, tooltip: "Ring fills with the node's progress." },
    { id: '📦 Enhanced Nodes.Run.Error', key: 'runError', name: 'Error pulse', type: 'boolean', default: true, group: 'Focus & Flow · During a run', showIf: (): boolean => N.enabled, tooltip: 'Failed node pulses red.' },
    { id: '📦 Enhanced Nodes.End Animation.Enabled', key: 'endAnimationEnabled', name: 'Effect when a run finishes', type: 'boolean', default: true, group: 'Focus & Flow · Completion', showIf: (): boolean => N.enabled, tooltip: 'Plays the Completion style when your run succeeds.' },
    { id: '📦 Enhanced Nodes.Completion.Style', key: 'completionStyle', name: 'Completion style', type: 'combo', options: COMPLETION_STYLE_OPTIONS, default: 'shockwave', group: 'Focus & Flow · Completion', showIf: (): boolean => N.enabled && N.endAnimationEnabled, tooltip: 'Path trace runs a comet along the links your run took; Surprise plays another style each time.' },
    { id: '📦 Enhanced Nodes.Completion.Anchor', key: 'completionAnchor', name: 'Completion anchor', type: 'combo', options: COMPLETION_ANCHOR_OPTIONS, default: 'outputs', group: 'Focus & Flow · Completion', look: false, showIf: (): boolean => N.enabled && N.endAnimationEnabled, tooltip: 'Mark primary nodes in the node menu.' },
    { id: '📦 Enhanced Nodes.Completion.PerNode', key: 'completionPerNode', name: 'Burst when each node finishes', type: 'boolean', default: false, group: 'Focus & Flow · Completion', advanced: true, showIf: (): boolean => N.enabled, tooltip: 'Sparks pop from the corner of each node on screen as your run finishes it.' },

    { id: '🔗 Enhanced Links.Perf.MaxFps', key: 'perfMaxFps', name: 'Effect frame-rate cap', type: 'combo', options: MAX_FPS_OPTIONS, default: 60, group: 'Performance · Budget', look: false, tooltip: 'The most redraws a second that moving effects ask for. Display rate asks for one with every frame the display shows.' },
    { id: '🔗 Enhanced Links.Perf.Adaptive', key: 'perfAdaptive', name: 'Adaptive quality', type: 'boolean', default: true, group: 'Performance · Budget', look: false, tooltip: 'While frames take half as long again as the frame-rate cap or the display allows, link glows go plain, then particles thin out, then effects hold still, a step a second; they come back after 5 seconds or more with room.' },
    { id: '🔗 Enhanced Links.Perf.StaticAbove', key: 'perfStaticAbove', name: 'Freeze above N visible links', type: 'slider', min: 0, max: 5000, step: 50, default: 400, group: 'Performance · Budget', look: false, tooltip: 'Link motion holds still while more animated link segments than this are on screen (a link through reroutes has one per stretch), and Nodes 2.0 glows while more than a quarter as many animated nodes are. 0 never freezes.' },
    { id: '🔗 Enhanced Links.Motion', key: 'motion', name: 'Motion', type: 'combo', options: MOTION_OPTIONS, default: 'system', group: 'Performance · Accessibility', look: false, tooltip: "Follow system shows effects still while the system, or ComfyUI's Disable animations, asks for less motion. Reduce always shows them still; Full always animates them." },
    { id: '🔗 Enhanced Links.Coexist', key: 'coexist', name: 'Other link extensions', type: 'combo', options: COEXIST_OPTIONS, default: 'auto', group: 'Performance · Compatibility', advanced: true, look: false, tooltip: 'When another extension, such as LinkFX, draws links too. Stepping aside leaves the links to it; node effects keep working.' },

    { id: LOOK, key: 'look', name: 'Current look', type: 'hidden', default: '', tooltip: 'The look last picked: empty until the first-run picker is answered, custom for settings kept as they were.' },
    { id: '🔗 Enhanced Links.Panel.State', key: 'panelState', name: 'Panel state', type: 'hidden', default: PANEL_STATE, tooltip: "The panel's tab, whether Advanced is open, and its search." },
    { id: '🔗 Enhanced Links.WhatsNew.Seen', key: 'whatsNewSeen', name: 'Last seen version', type: 'hidden', default: '', tooltip: "The version whose What's new was last shown." },
] as const satisfies readonly Setting[];

/** The v2.0.1 defaults v3 changed: v1's shadows, custom node colours and the completion effect. */
const V2_DEFAULTS: Values = {
    '🔗 Enhanced Links.Link.Shadow.Enabled': false,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
    '📦 Enhanced Nodes.Color.Primary': '#44aaff',
    '📦 Enhanced Nodes.Color.Secondary': '#88ccff',
    '📦 Enhanced Nodes.Color.Accent': '#0088ff',
    '📦 Enhanced Nodes.Color.Particle': '#ffff00',
    '📦 Enhanced Nodes.End Animation.Enabled': false,
};

const byId = new Map<string, Setting>(SETTINGS.map((s) => [s.id, s]));

/** The schema entry of a setting. */
export const setting = (id: string): Setting => byId.get(id)!;

// =============================================================================
// Migrations
// =============================================================================

/** A whole hex colour, with or without its #. */
export const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * migrateDeprecatedValue for every setting, by type. v2.0.1 registered every
 * number, and the strings Marker.Effects, Particle.Color.Mode and Text.Style, as
 * 0-20 sliders, so a combo value outside its options becomes the default and
 * numbers are clamped to range; text that is a number counts as that number.
 * Valid values come back unchanged.
 */
export function normalize(s: Setting, value: unknown): unknown {
    const numeric = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
    switch (s.type) {
        case 'boolean':
            if (typeof value === 'boolean') return value;
            return value === 'true' ? true : value === 'false' ? false : s.default;
        case 'slider':
            return typeof numeric === 'number' && !Number.isNaN(numeric) ? Math.min(s.max, Math.max(s.min, numeric)) : s.default;
        case 'combo': {
            const option = s.options.find((o) => o.value === value || o.value === numeric);
            if (option) return option.value;
            // v2's density sliders stored any number from 0, which takes the nearest preset.
            if (!s.snap || typeof numeric !== 'number' || Number.isNaN(numeric)) return s.default;
            return s.options.reduce((best, o) => (Math.abs(Number(o.value) - numeric) < Math.abs(Number(best.value) - numeric) ? o : best)).value;
        }
        case 'color':
            // Whole hex colours only: 1.39.5's hex field stores every keystroke, and '#abc' may be how '#abcdef' starts.
            return typeof value === 'string' && HEX.test(value) ? `#${value.replace('#', '').toLowerCase()}` : value;
        case 'hidden':
            // A panel state saved by another version keeps the fields this one lacks at their defaults.
            if (typeof s.default !== 'string') return { ...s.default, ...(value as object) };
            return typeof value === 'string' ? value : s.default;
    }
}

// =============================================================================
// Snapshots and registration
// =============================================================================

type Entry = (typeof SETTINGS)[number];

type Value<D> = D extends boolean ? boolean : D extends number ? number : D extends string ? string : D;

/** The values of the settings whose ids start with P, by key. */
type Snapshot<P extends string> = {
    [E in Entry as E['id'] extends `${P}${string}` ? E['key'] : never]: Value<E['default']>;
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
const snapshotOf = (id: string): Record<string, unknown> => (id.startsWith(LINKS) ? L : N);

/** The value a setting shows: its snapshot's. */
export const shown = (id: string): unknown => snapshotOf(id)[setting(id).key];

/**
 * Whether a switch shows on, for a command's check. ComfyUI's menus draw the check in a Vue render, which draws it
 * again only when something it read changes, so the switch is read from the settings store too, for the render to
 * track (FE157 components/ui/menu/MenuItemContent.vue L44-56, FE1395 components/sidebar/ComfyMenuButton.vue L46).
 */
export function checked(id: string): boolean {
    app.extensionManager.setting.get(id);
    return shown(id) as boolean;
}

const listeners = new Set<(id: string) => void>();

/** Calls `listener` with the id of each setting whose shown value changes, from anywhere, until the returned function is called. */
export function watch(listener: (id: string) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Puts a value in its snapshot and, if that changed it, asks for one redraw unless the setting is hidden, and tells the
 * listeners. A colour still being typed leaves the default there until it parses. A new Look shows the overlaid
 * settings again.
 */
function show(s: Setting, value: unknown): void {
    const values = snapshotOf(s.id);
    const next = s.type !== 'color' || HEX.test(String(value)) ? value : s.default;
    // commit() shows a value before the store hands it back through onChange, which gets a copy of an object.
    if (values[s.key] === next || (typeof next === 'object' && JSON.stringify(values[s.key]) === JSON.stringify(next))) return;
    values[s.key] = next;
    if (s.type !== 'hidden') {
        revision++;
        // app.canvas does not exist yet while the extensions register.
        app.canvas?.setDirty(true, true);
    }
    for (const listener of listeners) listener(s.id);
    if (s.id === LOOK) for (const id of overlaid) present(setting(id), saved(id));
}

/**
 * The settings whose value as the page loaded was their v2.0.1 default, and that nobody has set since. While Look is ''
 * they show their default instead: the first-run overlay.
 */
const overlaid = new Set<string>();

/** Shows the store's value of a setting, through the first-run overlay. */
function present(s: Setting, value: unknown): void {
    show(s, L.look === '' && overlaid.has(s.id) && V2_DEFAULTS[s.id] === value ? s.default : value);
}

/** Each setting's value in the settings store, as its onChange last handed it. */
const stored = new Map<string, unknown>();
/** The setting the store last migrated a value for, and the one the write queue is handing the store. */
let migrated: string | undefined;
let writing: string | undefined;
/** The settings whose saved value differed from its v2.0.1 default (the v3 default for a setting v2 lacked) as the page loaded. */
const own = new Set<string>();

/** What an extension registers for the settings whose ids start with `prefix`. */
function params(prefix: string): SettingParams[] {
    return SETTINGS.flatMap((s: Setting, i): SettingParams[] => s.id.startsWith(prefix) ? [{
        // The package types id as keyof Settings, the core ids only; the settings store takes any string.
        id: s.id as SettingParams['id'],
        name: s.name,
        tooltip: s.tooltip,
        category: s.type === 'hidden' ? undefined : ['Enhanced Links & Nodes', s.group, s.id],
        sortOrder: SETTINGS.length - i,
        type: s.type,
        attrs: s.type === 'slider' ? { min: s.min, max: s.max, step: s.step } : undefined,
        options: s.type === 'combo' ? [...s.options] : undefined,
        defaultValue: s.default,
        migrateDeprecatedValue: (value: unknown) => {
            migrated = s.id;
            return normalize(s, value);
        },
        onChange: (value: unknown, old?: unknown) => {
            // Set elsewhere, in the settings dialog say: what the user chose shows.
            const chosen = old !== undefined && writing !== s.id;
            // As a setting registers, the store hands it its value with no old one, having migrated it only if one is
            // saved (FE157 platform/settings/settingStore.ts L337-357, FE1395 L203-224).
            if (old === undefined && s.type !== 'hidden') {
                if (migrated === s.id && value !== (V2_DEFAULTS[s.id] ?? s.default)) own.add(s.id);
                else own.delete(s.id);
                if (s.id in V2_DEFAULTS && value === V2_DEFAULTS[s.id]) overlaid.add(s.id);
                else overlaid.delete(s.id);
            } else if (chosen) overlaid.delete(s.id);
            migrated = undefined;
            stored.set(s.id, value);
            present(s, value);
            if (chosen) answer(s.id, value);
        },
    }] : []);
}

export const linkSettings = params(LINKS);
export const nodeSettings = params(NODES);

/** Whether the user's own settings, saved before this page wrote any, differ from v2.0.1's defaults: an upgrader who customised. */
export const customised = (): boolean => own.size > 0;

// =============================================================================
// Writes
// =============================================================================

/** Committed values not yet handed to the settings store, by id. */
const unsaved = new Map<string, unknown>();
/** The store's writes, one at a time, in commit order. */
let saving = Promise.resolve();

/** The value the store holds for a setting once the writes queued for it are saved. */
function saved(id: string): unknown {
    return unsaved.has(id) ? normalize(setting(id), unsaved.get(id)) : stored.get(id);
}

/** Shows a value without saving it, for a control that is still moving or a look being hovered. It is migrated as the store would, so a commit's onChange finds it shown. */
export function preview(id: string, value: unknown): void {
    const s = setting(id);
    show(s, normalize(s, value));
}

/** Ends the previews of `ids`: each shows the value the store holds again. */
export function restore(ids: Iterable<string>): void {
    for (const id of ids) present(setting(id), saved(id));
}

/** The revisions drawWith() lends, each its own and below 0, so no cache kept by revision takes one draw's values for another's. */
let lent = 0;

/**
 * Calls `draw` with valid `values` in L and N in place of what shows, for a look's tile in the panel, and puts back what
 * showed: nothing redraws or hears of them, and what the caches kept by revision hold for them is dropped afterwards.
 */
export function drawWith(values: Values, draw: () => void): void {
    const kept: [Record<string, unknown>, string, unknown][] = [];
    for (const [id, value] of Object.entries(values)) {
        const snapshot = snapshotOf(id);
        const { key } = setting(id);
        kept.push([snapshot, key, snapshot[key]]);
        snapshot[key] = value;
    }
    const own = revision;
    revision = --lent;
    try {
        draw();
    } finally {
        for (const [snapshot, key, value] of kept) snapshot[key] = value;
        revision = own;
    }
}

/**
 * Shows a value the user chose and queues it for the settings store, which
 * saves it with one POST. The store gets one write at a time; a commit to an id
 * that is still waiting its turn replaces the value it will write.
 */
export function commit(id: string, value: unknown): void {
    overlaid.delete(id);
    write(id, value);
    answer(id, value);
}

/**
 * Before the first-run picker is answered, a setting the user sets to its v2.0.1 default would read as unset on the
 * next load and show v3's again. So that answers the picker as keeping what shows does: the settings still overlaid
 * save the default they show, and Look is 'custom'.
 */
function answer(id: string, value: unknown): void {
    if (L.look !== '' || V2_DEFAULTS[id] !== normalize(setting(id), value)) return;
    commitAll({ ...Object.fromEntries([...overlaid].map((other) => [other, setting(other).default])), [LOOK]: 'custom' });
}

function write(id: string, value: unknown): void {
    const s = setting(id);
    present(s, normalize(s, value));
    if (!unsaved.has(id)) saving = saving.then(() => save(id));
    unsaved.set(id, value);
}

async function save(id: string): Promise<void> {
    const value = unsaved.get(id);
    unsaved.delete(id);
    try {
        // set() hands the value to onChange before it returns (FE157 settingStore.ts L182-201, FE1395 L99-110), and
        // returns the store's promise, though the package types it as void.
        writing = id;
        const done = app.extensionManager.setting.set(id, value);
        writing = undefined;
        await done;
    } catch (error) {
        // A failed POST (the server restarting, say) must not stop the writes queued behind it.
        console.warn(`[EnhancedLinks] Could not save ${id}:`, error);
    }
}

/**
 * Commits each of `values` that differs from what the store holds, in order, and returns what puts the old values
 * back. The first-run overlay stays as it was, so an undo back to Look '' shows what showed before.
 */
export function commitAll(values: Values): () => void {
    const before: Record<string, unknown> = {};
    for (const [id, value] of Object.entries(values)) {
        const old = saved(id);
        if (normalize(setting(id), value) === old) continue;
        before[id] = old;
        write(id, value);
    }
    return () => commitAll(before);
}

/**
 * Commits the default of every setting whose id starts with `prefix` and whose value is not the default, and returns
 * what undoes that. The hidden settings keep their values.
 */
export function reset(prefix: string): () => void {
    return commitAll(Object.fromEntries(SETTINGS.filter((s) => s.id.startsWith(prefix) && s.type !== 'hidden').map((s) => [s.id, s.default])));
}
