/**
 * Sidebar Settings Panel — renders all link and node animation settings.
 *
 * Each control reads/writes via app.ui.settings and triggers
 * canvas redraws for live preview.
 *
 * @module sidebar/SidebarSettings
 */

import { app } from '/scripts/app.js';

import { LINK_DEFAULTS, NODE_DEFAULTS } from '@/core/config';
import {
    LINK_ANIMATION_OPTIONS,
    LINK_STYLE_OPTIONS,
    MARKER_SHAPE_OPTIONS,
    NODE_ANIMATION_OPTIONS,
    COLOR_SCHEME_OPTIONS,
    COLOR_MODE_OPTIONS,
    QUALITY_OPTIONS,
    DIRECTION_OPTIONS,
} from '@/ui/settings';

import { createSlider, createToggle, createSelect, createColorPicker, createSection } from './controls';

// =============================================================================
// Helpers
// =============================================================================

/** Get a setting value with fallback to defaults */
function getLinkSetting<T>(key: string): T {
    const defaultValue = LINK_DEFAULTS[key as keyof typeof LINK_DEFAULTS];
    const val = app.ui.settings.getSettingValue(key);
    return (val ?? defaultValue) as T;
}

function getNodeSetting<T>(key: string): T {
    const defaultValue = NODE_DEFAULTS[key as keyof typeof NODE_DEFAULTS];
    const val = app.ui.settings.getSettingValue(key);
    return (val ?? defaultValue) as T;
}

/** Set a setting value and force canvas redraw */
function setSetting(key: string, value: unknown): void {
    app.ui.settings.setSettingValue(key, value);
    forceCanvasRedraw();
}

/** Force the ComfyUI canvas to redraw */
function forceCanvasRedraw(): void {
    if (app.graph && app.graph.canvas) {
        app.graph.canvas.dirty_canvas = true;
        app.graph.canvas.dirty_bgcanvas = true;
        app.graph.canvas.draw(true, true);
    }
}

/** Marker effect options */
const MARKER_EFFECT_OPTIONS = [
    { value: 'none', text: '⭘️ None' },
    { value: 'pulse', text: '💓 Pulse' },
    { value: 'fade', text: '🌫️ Fade' },
    { value: 'rainbow', text: '🌈 Rainbow' },
] as const;

/** Particle color mode options for nodes */
const PARTICLE_COLOR_MODE_OPTIONS = [
    { value: 'default', text: '🎨 Default' },
    { value: 'rainbow', text: '🌈 Rainbow' },
    { value: 'complementary', text: '🔄 Complementary' },
    { value: 'energy', text: '⚡ Energy' },
    { value: 'quantum', text: '🔬 Quantum' },
    { value: 'aurora', text: '🌌 Aurora' },
] as const;

// =============================================================================
// Link Settings Sections
// =============================================================================

function renderLinkAnimationSection(container: HTMLElement): void {
    const { section, body } = createSection('🎬 Animation', true);

    body.appendChild(createSelect(
        'Animation Style',
        getLinkSetting<number>('🔗 Enhanced Links.Animate'),
        LINK_ANIMATION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Animate', v),
        'Select the animation effect for link connections'
    ));

    body.appendChild(createToggle(
        'Static Mode',
        getLinkSetting<boolean>('🔗 Enhanced Links.Static.Mode'),
        (v) => setSetting('🔗 Enhanced Links.Static.Mode', v),
        'Display a static snapshot of the animation'
    ));

    body.appendChild(createSlider(
        'Speed',
        getLinkSetting<number>('🔗 Enhanced Links.Animation.Speed'),
        0.1, 5, 0.1, 'x',
        (v) => setSetting('🔗 Enhanced Links.Animation.Speed', v),
        'Animation playback speed'
    ));

    body.appendChild(createSelect(
        'Direction',
        getLinkSetting<number>('🔗 Enhanced Links.Direction'),
        DIRECTION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Direction', v),
        'Flow direction along links'
    ));

    body.appendChild(createToggle(
        'Pause During Render',
        getLinkSetting<boolean>('🔗 Enhanced Links.Pause.During.Render'),
        (v) => setSetting('🔗 Enhanced Links.Pause.During.Render', v),
        'Pause animations while ComfyUI is processing'
    ));

    container.appendChild(section);
}

function renderLinkStyleSection(container: HTMLElement): void {
    const { section, body } = createSection('🔗 Link Style', true);

    body.appendChild(createSelect(
        'Link Style',
        getLinkSetting<string>('🔗 Enhanced Links.Link.Style'),
        LINK_STYLE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Link.Style', v),
        'Visual style for link connections'
    ));

    body.appendChild(createSlider(
        'Thickness',
        getLinkSetting<number>('🔗 Enhanced Links.Thickness'),
        1, 10, 0.5, 'px',
        (v) => setSetting('🔗 Enhanced Links.Thickness', v),
        'Link line thickness'
    ));

    body.appendChild(createSelect(
        'Quality',
        getLinkSetting<number>('🔗 Enhanced Links.Quality'),
        QUALITY_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Quality', v),
        'Rendering quality — higher uses more GPU'
    ));

    container.appendChild(section);
}

function renderLinkColorSection(container: HTMLElement): void {
    const { section, body } = createSection('🎨 Colors', true);

    body.appendChild(createSelect(
        'Color Mode',
        getLinkSetting<string>('🔗 Enhanced Links.Color.Mode'),
        COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Color.Mode', v),
        'How colors are determined for link animations'
    ));

    body.appendChild(createSelect(
        'Color Scheme',
        getLinkSetting<string>('🔗 Enhanced Links.Color.Scheme'),
        COLOR_SCHEME_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Color.Scheme', v),
        'Preset color scheme for link types'
    ));

    body.appendChild(createColorPicker(
        'Primary Color',
        getLinkSetting<string>('🔗 Enhanced Links.Color.Primary'),
        (v) => setSetting('🔗 Enhanced Links.Color.Primary', v),
        'Primary animation color'
    ));

    body.appendChild(createColorPicker(
        'Secondary Color',
        getLinkSetting<string>('🔗 Enhanced Links.Color.Secondary'),
        (v) => setSetting('🔗 Enhanced Links.Color.Secondary', v),
        'Secondary animation color'
    ));

    body.appendChild(createColorPicker(
        'Accent Color',
        getLinkSetting<string>('🔗 Enhanced Links.Color.Accent'),
        (v) => setSetting('🔗 Enhanced Links.Color.Accent', v),
        'Accent animation color'
    ));

    container.appendChild(section);
}

function renderLinkEffectsSection(container: HTMLElement): void {
    const { section, body } = createSection('✨ Effects', true);

    body.appendChild(createSlider(
        'Glow Intensity',
        getLinkSetting<number>('🔗 Enhanced Links.Glow.Intensity'),
        0, 20, 1, '',
        (v) => setSetting('🔗 Enhanced Links.Glow.Intensity', v),
        'Intensity of the glow effect around links'
    ));

    body.appendChild(createSlider(
        'Particle Density',
        getLinkSetting<number>('🔗 Enhanced Links.Particle.Density'),
        0, 2, 0.1, '',
        (v) => setSetting('🔗 Enhanced Links.Particle.Density', v),
        'Number of particles along links'
    ));

    container.appendChild(section);
}

function renderLinkMarkerSection(container: HTMLElement): void {
    const { section, body } = createSection('➤ Markers', true);

    body.appendChild(createToggle(
        'Enabled',
        getLinkSetting<boolean>('🔗 Enhanced Links.Marker.Enabled'),
        (v) => setSetting('🔗 Enhanced Links.Marker.Enabled', v),
        'Show flow direction markers on links'
    ));

    body.appendChild(createSelect(
        'Shape',
        getLinkSetting<string>('🔗 Enhanced Links.Marker.Shape'),
        MARKER_SHAPE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Marker.Shape', v),
        'Shape of the flow markers'
    ));

    body.appendChild(createSlider(
        'Size',
        getLinkSetting<number>('🔗 Enhanced Links.Marker.Size'),
        1, 5, 0.5, '',
        (v) => setSetting('🔗 Enhanced Links.Marker.Size', v),
        'Size of flow markers'
    ));

    body.appendChild(createSelect(
        'Color Mode',
        getLinkSetting<string>('🔗 Enhanced Links.Marker.Color.Mode'),
        COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Marker.Color.Mode', v),
        'How marker colors are determined'
    ));

    body.appendChild(createColorPicker(
        'Custom Color',
        getLinkSetting<string>('🔗 Enhanced Links.Marker.Color'),
        (v) => setSetting('🔗 Enhanced Links.Marker.Color', v),
        'Custom marker color (when Color Mode is Custom)'
    ));

    body.appendChild(createSlider(
        'Glow',
        getLinkSetting<number>('🔗 Enhanced Links.Marker.Glow'),
        0, 20, 1, '',
        (v) => setSetting('🔗 Enhanced Links.Marker.Glow', v),
        'Glow intensity for markers'
    ));

    body.appendChild(createSelect(
        'Effects',
        getLinkSetting<string>('🔗 Enhanced Links.Marker.Effects'),
        MARKER_EFFECT_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('🔗 Enhanced Links.Marker.Effects', v),
        'Additional marker animation effects'
    ));

    container.appendChild(section);
}

function renderLinkShadowSection(container: HTMLElement): void {
    const { section, body } = createSection('🌑 Shadows', true);

    body.appendChild(createToggle(
        'Link Shadows',
        getLinkSetting<boolean>('🔗 Enhanced Links.Link.Shadow.Enabled'),
        (v) => setSetting('🔗 Enhanced Links.Link.Shadow.Enabled', v),
        'Enable drop shadows on links'
    ));

    body.appendChild(createToggle(
        'Marker Shadows',
        getLinkSetting<boolean>('🔗 Enhanced Links.Marker.Shadow.Enabled'),
        (v) => setSetting('🔗 Enhanced Links.Marker.Shadow.Enabled', v),
        'Enable drop shadows on markers'
    ));

    container.appendChild(section);
}

// =============================================================================
// Node Settings Sections
// =============================================================================

function renderNodeAnimationSection(container: HTMLElement): void {
    const { section, body } = createSection('🎬 Animation', true);

    body.appendChild(createSelect(
        'Animation Style',
        getNodeSetting<number>('📦 Enhanced Nodes.Animate'),
        NODE_ANIMATION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('📦 Enhanced Nodes.Animate', v),
        'Select the animation effect for nodes'
    ));

    body.appendChild(createToggle(
        'Animations Enabled',
        getNodeSetting<boolean>('📦 Enhanced Nodes.Animations.Enabled'),
        (v) => setSetting('📦 Enhanced Nodes.Animations.Enabled', v),
        'Master toggle for all node animations'
    ));

    body.appendChild(createSlider(
        'Speed',
        getNodeSetting<number>('📦 Enhanced Nodes.Animation.Speed'),
        0.1, 5, 0.1, 'x',
        (v) => setSetting('📦 Enhanced Nodes.Animation.Speed', v),
        'Animation playback speed'
    ));

    body.appendChild(createSelect(
        'Direction',
        getNodeSetting<number>('📦 Enhanced Nodes.Direction'),
        DIRECTION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('📦 Enhanced Nodes.Direction', v),
        'Animation direction'
    ));

    body.appendChild(createToggle(
        'Static Mode',
        getNodeSetting<boolean>('📦 Enhanced Nodes.Static.Mode'),
        (v) => setSetting('📦 Enhanced Nodes.Static.Mode', v),
        'Display a static snapshot of the animation'
    ));

    body.appendChild(createToggle(
        'End Animation',
        getNodeSetting<boolean>('📦 Enhanced Nodes.End Animation.Enabled'),
        (v) => setSetting('📦 Enhanced Nodes.End Animation.Enabled', v),
        'Play completion animation when a node finishes processing'
    ));

    body.appendChild(createToggle(
        'Pause During Render',
        getNodeSetting<boolean>('📦 Enhanced Nodes.Pause.During.Render'),
        (v) => setSetting('📦 Enhanced Nodes.Pause.During.Render', v),
        'Pause animations while ComfyUI is processing'
    ));

    body.appendChild(createSlider(
        'Animation Size',
        getNodeSetting<number>('📦 Enhanced Nodes.Animation.Size'),
        0.5, 3, 0.1, 'x',
        (v) => setSetting('📦 Enhanced Nodes.Animation.Size', v),
        'Scale of the animation effect area'
    ));

    container.appendChild(section);
}

function renderNodeColorSection(container: HTMLElement): void {
    const { section, body } = createSection('🎨 Colors', true);

    body.appendChild(createSelect(
        'Color Mode',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Mode'),
        COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('📦 Enhanced Nodes.Color.Mode', v),
        'How colors are determined for node animations'
    ));

    body.appendChild(createSelect(
        'Color Scheme',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Scheme'),
        COLOR_SCHEME_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('📦 Enhanced Nodes.Color.Scheme', v),
        'Preset color scheme'
    ));

    body.appendChild(createColorPicker(
        'Primary Color',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Primary'),
        (v) => setSetting('📦 Enhanced Nodes.Color.Primary', v),
        'Primary animation color'
    ));

    body.appendChild(createColorPicker(
        'Secondary Color',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Secondary'),
        (v) => setSetting('📦 Enhanced Nodes.Color.Secondary', v),
        'Secondary animation color'
    ));

    body.appendChild(createColorPicker(
        'Accent Color',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Accent'),
        (v) => setSetting('📦 Enhanced Nodes.Color.Accent', v),
        'Accent animation color'
    ));

    body.appendChild(createColorPicker(
        'Hover Color',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Hover') ?? '#ffffff',
        (v) => setSetting('📦 Enhanced Nodes.Color.Hover', v),
        'Color shown on node hover'
    ));

    body.appendChild(createToggle(
        'Show Hover Effect',
        getNodeSetting<boolean>('📦 Enhanced Nodes.Color.Hover.Show') ?? true,
        (v) => setSetting('📦 Enhanced Nodes.Color.Hover.Show', v),
        'Show hover highlight on nodes'
    ));

    container.appendChild(section);
}

function renderNodeGlowSection(container: HTMLElement): void {
    const { section, body } = createSection('✨ Glow', true);

    body.appendChild(createSlider(
        'Glow Level',
        getNodeSetting<number>('📦 Enhanced Nodes.Glow'),
        0, 2, 0.1, '',
        (v) => setSetting('📦 Enhanced Nodes.Glow', v),
        'Base glow intensity'
    ));

    body.appendChild(createSlider(
        'Animation Glow',
        getNodeSetting<number>('📦 Enhanced Nodes.Animation.Glow'),
        0, 2, 0.1, '',
        (v) => setSetting('📦 Enhanced Nodes.Animation.Glow', v),
        'Glow intensity during animation'
    ));

    body.appendChild(createToggle(
        'Show Glow',
        getNodeSetting<boolean>('📦 Enhanced Nodes.Glow.Show'),
        (v) => setSetting('📦 Enhanced Nodes.Glow.Show', v),
        'Toggle glow effect visibility'
    ));

    body.appendChild(createSlider(
        'Intensity',
        getNodeSetting<number>('📦 Enhanced Nodes.Intensity'),
        0, 3, 0.1, '',
        (v) => setSetting('📦 Enhanced Nodes.Intensity', v),
        'Overall effect intensity'
    ));

    body.appendChild(createSelect(
        'Quality',
        getNodeSetting<number>('📦 Enhanced Nodes.Quality'),
        QUALITY_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('📦 Enhanced Nodes.Quality', v),
        'Rendering quality — higher uses more GPU'
    ));

    container.appendChild(section);
}

function renderNodeParticleSection(container: HTMLElement): void {
    const { section, body } = createSection('🌠 Particles', true);

    body.appendChild(createToggle(
        'Show Particles',
        getNodeSetting<boolean>('📦 Enhanced Nodes.Particle.Show'),
        (v) => setSetting('📦 Enhanced Nodes.Particle.Show', v),
        'Toggle particle display'
    ));

    body.appendChild(createSlider(
        'Density',
        getNodeSetting<number>('📦 Enhanced Nodes.Particle.Density'),
        0, 3, 0.1, '',
        (v) => setSetting('📦 Enhanced Nodes.Particle.Density', v),
        'Number of particles per node'
    ));

    body.appendChild(createSlider(
        'Speed',
        getNodeSetting<number>('📦 Enhanced Nodes.Particle.Speed'),
        0.1, 5, 0.1, 'x',
        (v) => setSetting('📦 Enhanced Nodes.Particle.Speed', v),
        'Particle movement speed'
    ));

    body.appendChild(createSlider(
        'Intensity',
        getNodeSetting<number>('📦 Enhanced Nodes.Particle.Intensity'),
        0, 3, 0.1, '',
        (v) => setSetting('📦 Enhanced Nodes.Particle.Intensity', v),
        'Particle brightness/opacity'
    ));

    body.appendChild(createSlider(
        'Size',
        getNodeSetting<number>('📦 Enhanced Nodes.Particle.Size'),
        0.1, 3, 0.1, 'x',
        (v) => setSetting('📦 Enhanced Nodes.Particle.Size', v),
        'Particle size'
    ));

    body.appendChild(createSlider(
        'Glow',
        getNodeSetting<number>('📦 Enhanced Nodes.Particle.Glow'),
        0, 2, 0.1, '',
        (v) => setSetting('📦 Enhanced Nodes.Particle.Glow', v),
        'Particle glow intensity'
    ));

    body.appendChild(createSelect(
        'Color Mode',
        getNodeSetting<string>('📦 Enhanced Nodes.Particle.Color.Mode'),
        PARTICLE_COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
        (v) => setSetting('📦 Enhanced Nodes.Particle.Color.Mode', v),
        'How particle colors are determined'
    ));

    body.appendChild(createColorPicker(
        'Particle Color',
        getNodeSetting<string>('📦 Enhanced Nodes.Color.Particle'),
        (v) => setSetting('📦 Enhanced Nodes.Color.Particle', v),
        'Custom particle color'
    ));

    container.appendChild(section);
}

// =============================================================================
// Main Render Function
// =============================================================================

/**
 * Renders the complete settings panel into the given container.
 */
export function renderSettingsPanel(container: HTMLElement): void {
    // --- Link Settings ---
    const linkHeader = document.createElement('div');
    linkHeader.className = 'enh-section-divider';
    linkHeader.textContent = '🔗 Link Settings';
    container.appendChild(linkHeader);

    renderLinkAnimationSection(container);
    renderLinkStyleSection(container);
    renderLinkColorSection(container);
    renderLinkEffectsSection(container);
    renderLinkMarkerSection(container);
    renderLinkShadowSection(container);
    container.appendChild(createResetButton('Reset Link Settings to Defaults', LINK_DEFAULTS, container));

    // --- Node Settings ---
    const nodeHeader = document.createElement('div');
    nodeHeader.className = 'enh-section-divider';
    nodeHeader.textContent = '📦 Node Settings';
    container.appendChild(nodeHeader);

    renderNodeAnimationSection(container);
    renderNodeColorSection(container);
    renderNodeGlowSection(container);
    renderNodeParticleSection(container);
    container.appendChild(createResetButton('Reset Node Settings to Defaults', NODE_DEFAULTS, container));

    // --- About ---
    const about = document.createElement('div');
    about.className = 'enh-about';
    about.innerHTML = `
        <strong>Enhanced Links & Nodes</strong><br>
        by <a href="https://github.com/AEmotionStudio" target="_blank">ÆmotionStudio</a><br>
        <br>
        Beautiful animations and effects for your ComfyUI workflow.<br>
        Changes apply instantly — adjust to taste!
    `;
    container.appendChild(about);
}

// =============================================================================
// Reset Button
// =============================================================================

function createResetButton(
    label: string,
    defaults: Record<string, unknown>,
    panelContainer: HTMLElement,
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex;justify-content:center;padding:8px 12px;';

    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText = [
        'background: linear-gradient(135deg, rgba(220,50,50,0.25), rgba(180,40,40,0.15))',
        'border: 1px solid rgba(220,80,80,0.4)',
        'color: #ff9999',
        'padding: 8px 20px',
        'border-radius: 6px',
        'cursor: pointer',
        'font-size: 12px',
        'font-weight: 600',
        'letter-spacing: 0.5px',
        'transition: all 0.2s ease',
        'width: 100%',
    ].join(';');

    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'linear-gradient(135deg, rgba(220,50,50,0.45), rgba(180,40,40,0.3))';
        btn.style.borderColor = 'rgba(220,80,80,0.7)';
        btn.style.color = '#ffbbbb';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.background = 'linear-gradient(135deg, rgba(220,50,50,0.25), rgba(180,40,40,0.15))';
        btn.style.borderColor = 'rgba(220,80,80,0.4)';
        btn.style.color = '#ff9999';
    });

    btn.addEventListener('click', () => {
        for (const [key, defaultValue] of Object.entries(defaults)) {
            // Skip non-setting entries
            if (key.includes('About')) continue;
            app.ui.settings.setSettingValue(key, defaultValue);
        }

        // Rebuild panel so controls reflect the reset values
        panelContainer.innerHTML = '';
        renderSettingsPanel(panelContainer);
        forceCanvasRedraw();
    });

    wrapper.appendChild(btn);
    return wrapper;
}
