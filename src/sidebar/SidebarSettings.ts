/**
 * Sidebar Settings Panel — renders all link and node animation settings.
 *
 * Each control takes its range or options from the settings schema and its
 * value from the live snapshots. Sliders and colour wells preview while they
 * move and commit where they stop; the other controls commit at once.
 *
 * @module sidebar/SidebarSettings
 */

import { SETTINGS, commit, preview, reset, snapshotOf } from '@/core/settings';

import { createSlider, createToggle, createSelect, createColorPicker, createSection } from './controls';

// =============================================================================
// Helpers
// =============================================================================

/** The control for a setting, of the kind its schema type asks for. */
function control(label: string, id: string, tooltip: string, unit = ''): HTMLElement {
    const s = SETTINGS.find((e) => e.id === id)!;
    const value = snapshotOf(id)[s.key];
    switch (s.type) {
        case 'slider':
            return createSlider(label, value as number, s.min, s.max, s.step, unit, (v) => preview(id, v), (v) => commit(id, v), tooltip);
        case 'boolean':
            return createToggle(label, value as boolean, (v) => commit(id, v), tooltip);
        case 'combo':
            return createSelect(label, value, s.options, (v) => commit(id, v), tooltip);
        case 'color':
            return createColorPicker(label, value as string, (v) => preview(id, v), (v) => commit(id, v), tooltip);
    }
}

// =============================================================================
// Link Settings Sections
// =============================================================================

function renderLinkAnimationSection(container: HTMLElement): void {
    const { section, body } = createSection('🎬 Animation', true);

    body.appendChild(control(
        'Animation Style',
        '🔗 Enhanced Links.Animate',
        'Select the animation effect for link connections'
    ));

    body.appendChild(control(
        'Static Mode',
        '🔗 Enhanced Links.Static.Mode',
        'Display a static snapshot of the animation'
    ));

    body.appendChild(control(
        'Speed',
        '🔗 Enhanced Links.Animation.Speed',
        'Animation playback speed',
        'x'
    ));

    body.appendChild(control(
        'Direction',
        '🔗 Enhanced Links.Direction',
        'Flow direction along links'
    ));

    body.appendChild(control(
        'Pause During Render',
        '🔗 Enhanced Links.Pause.During.Render',
        'Pause animations while ComfyUI is processing'
    ));

    container.appendChild(section);
}

function renderLinkStyleSection(container: HTMLElement): void {
    const { section, body } = createSection('🔗 Link Style', true);

    body.appendChild(control(
        'Link Style',
        '🔗 Enhanced Links.Link.Style',
        'Visual style for link connections'
    ));

    body.appendChild(control(
        'Thickness',
        '🔗 Enhanced Links.Thickness',
        'Link line thickness',
        'px'
    ));

    body.appendChild(control(
        'Quality',
        '🔗 Enhanced Links.Quality',
        'Rendering quality — higher uses more GPU'
    ));

    container.appendChild(section);
}

function renderLinkColorSection(container: HTMLElement): void {
    const { section, body } = createSection('🎨 Colors', true);

    body.appendChild(control(
        'Color Mode',
        '🔗 Enhanced Links.Color.Mode',
        'How colors are determined for link animations'
    ));

    body.appendChild(control(
        'Color Scheme',
        '🔗 Enhanced Links.Color.Scheme',
        'Preset color scheme for link types'
    ));

    body.appendChild(control(
        'Primary Color',
        '🔗 Enhanced Links.Color.Primary',
        'Primary animation color'
    ));

    body.appendChild(control(
        'Secondary Color',
        '🔗 Enhanced Links.Color.Secondary',
        'Secondary animation color'
    ));

    body.appendChild(control(
        'Accent Color',
        '🔗 Enhanced Links.Color.Accent',
        'Accent animation color'
    ));

    container.appendChild(section);
}

function renderLinkEffectsSection(container: HTMLElement): void {
    const { section, body } = createSection('✨ Effects', true);

    body.appendChild(control(
        'Glow Intensity',
        '🔗 Enhanced Links.Glow.Intensity',
        'Intensity of the glow effect around links'
    ));

    body.appendChild(control(
        'Particle Density',
        '🔗 Enhanced Links.Particle.Density',
        'Number of particles along links'
    ));

    container.appendChild(section);
}

function renderLinkMarkerSection(container: HTMLElement): void {
    const { section, body } = createSection('➤ Markers', true);

    body.appendChild(control(
        'Enabled',
        '🔗 Enhanced Links.Marker.Enabled',
        'Show flow direction markers on links'
    ));

    body.appendChild(control(
        'On Every Animation',
        '🔗 Enhanced Links.Marker.All',
        'Show the markers over every animation, not only Classic Flow'
    ));

    body.appendChild(control(
        'Shape',
        '🔗 Enhanced Links.Marker.Shape',
        'Shape of the flow markers'
    ));

    body.appendChild(control(
        'Size',
        '🔗 Enhanced Links.Marker.Size',
        'Size of flow markers'
    ));

    body.appendChild(control(
        'Color Mode',
        '🔗 Enhanced Links.Marker.Color.Mode',
        'How marker colors are determined'
    ));

    body.appendChild(control(
        'Custom Color',
        '🔗 Enhanced Links.Marker.Color',
        'Custom marker color (when Color Mode is Custom)'
    ));

    body.appendChild(control(
        'Glow',
        '🔗 Enhanced Links.Marker.Glow',
        'Glow intensity for markers'
    ));

    body.appendChild(control(
        'Effects',
        '🔗 Enhanced Links.Marker.Effects',
        'Additional marker animation effects'
    ));

    container.appendChild(section);
}

function renderLinkShadowSection(container: HTMLElement): void {
    const { section, body } = createSection('🌑 Shadows', true);

    body.appendChild(control(
        'Link Shadows',
        '🔗 Enhanced Links.Link.Shadow.Enabled',
        'Dark outline under Classic Flow links'
    ));

    body.appendChild(control(
        'Marker Shadows',
        '🔗 Enhanced Links.Marker.Shadow.Enabled',
        'Dark outline under markers'
    ));

    body.appendChild(control(
        'Shadow Style',
        '🔗 Enhanced Links.Shadow.Style',
        'Halo as in v1, or an offset drop shadow as in v2'
    ));

    container.appendChild(section);
}

// =============================================================================
// Node Settings Sections
// =============================================================================

function renderNodeAnimationSection(container: HTMLElement): void {
    const { section, body } = createSection('🎬 Animation', true);

    body.appendChild(control(
        'Animation Style',
        '📦 Enhanced Nodes.Animate',
        'Select the animation effect for nodes'
    ));

    body.appendChild(control(
        'Animations Enabled',
        '📦 Enhanced Nodes.Animations.Enabled',
        'Master toggle for all node animations'
    ));

    body.appendChild(control(
        'Speed',
        '📦 Enhanced Nodes.Animation.Speed',
        'Animation playback speed',
        'x'
    ));

    body.appendChild(control(
        'Direction',
        '📦 Enhanced Nodes.Direction',
        'Animation direction'
    ));

    body.appendChild(control(
        'Static Mode',
        '📦 Enhanced Nodes.Static.Mode',
        'Display a static snapshot of the animation'
    ));

    body.appendChild(control(
        'End Animation',
        '📦 Enhanced Nodes.End Animation.Enabled',
        'Fireworks over the output nodes when a run finishes'
    ));

    body.appendChild(control(
        'Pause During Render',
        '📦 Enhanced Nodes.Pause.During.Render',
        'Pause animations while ComfyUI is processing'
    ));

    body.appendChild(control(
        'Animation Size',
        '📦 Enhanced Nodes.Animation.Size',
        'Scale of the animation effect area',
        'x'
    ));

    container.appendChild(section);
}

function renderNodeColorSection(container: HTMLElement): void {
    const { section, body } = createSection('🎨 Colors', true);

    body.appendChild(control(
        'Color Mode',
        '📦 Enhanced Nodes.Color.Mode',
        'How colors are determined for node animations'
    ));

    body.appendChild(control(
        'Color Scheme',
        '📦 Enhanced Nodes.Color.Scheme',
        'Preset color scheme'
    ));

    body.appendChild(control(
        'Primary Color',
        '📦 Enhanced Nodes.Color.Primary',
        'Primary animation color'
    ));

    body.appendChild(control(
        'Secondary Color',
        '📦 Enhanced Nodes.Color.Secondary',
        'Secondary animation color'
    ));

    body.appendChild(control(
        'Accent Color',
        '📦 Enhanced Nodes.Color.Accent',
        'Accent animation color'
    ));

    body.appendChild(control(
        'Hover Color',
        '📦 Enhanced Nodes.Color.Hover',
        'Color shown on node hover'
    ));

    body.appendChild(control(
        'Show Hover Effect',
        '📦 Enhanced Nodes.Color.Hover.Show',
        'Show hover highlight on nodes'
    ));

    container.appendChild(section);
}

function renderNodeGlowSection(container: HTMLElement): void {
    const { section, body } = createSection('✨ Glow', true);

    body.appendChild(control(
        'Glow Level',
        '📦 Enhanced Nodes.Glow',
        'Base glow intensity'
    ));

    body.appendChild(control(
        'Animation Glow',
        '📦 Enhanced Nodes.Animation.Glow',
        'Glow intensity during animation'
    ));

    body.appendChild(control(
        'Show Glow',
        '📦 Enhanced Nodes.Glow.Show',
        'Toggle glow effect visibility'
    ));

    body.appendChild(control(
        'Intensity',
        '📦 Enhanced Nodes.Intensity',
        'Overall effect intensity'
    ));

    body.appendChild(control(
        'Quality',
        '📦 Enhanced Nodes.Quality',
        'Rendering quality — higher uses more GPU'
    ));

    container.appendChild(section);
}

function renderNodeParticleSection(container: HTMLElement): void {
    const { section, body } = createSection('🌠 Particles', true);

    body.appendChild(control(
        'Show Particles',
        '📦 Enhanced Nodes.Particle.Show',
        'Toggle particle display'
    ));

    body.appendChild(control(
        'Density',
        '📦 Enhanced Nodes.Particle.Density',
        'Number of particles per node'
    ));

    body.appendChild(control(
        'Speed',
        '📦 Enhanced Nodes.Particle.Speed',
        'Particle movement speed',
        'x'
    ));

    body.appendChild(control(
        'Intensity',
        '📦 Enhanced Nodes.Particle.Intensity',
        'Particle brightness/opacity'
    ));

    body.appendChild(control(
        'Size',
        '📦 Enhanced Nodes.Particle.Size',
        'Particle size',
        'x'
    ));

    body.appendChild(control(
        'Glow',
        '📦 Enhanced Nodes.Particle.Glow',
        'Particle glow intensity'
    ));

    body.appendChild(control(
        'Color Mode',
        '📦 Enhanced Nodes.Particle.Color.Mode',
        'How particle colors are determined'
    ));

    body.appendChild(control(
        'Particle Color',
        '📦 Enhanced Nodes.Color.Particle',
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
    container.appendChild(createResetButton('Reset Link Settings to Defaults', '🔗 Enhanced Links.', container));

    // --- Node Settings ---
    const nodeHeader = document.createElement('div');
    nodeHeader.className = 'enh-section-divider';
    nodeHeader.textContent = '📦 Node Settings';
    container.appendChild(nodeHeader);

    renderNodeAnimationSection(container);
    renderNodeColorSection(container);
    renderNodeGlowSection(container);
    renderNodeParticleSection(container);
    container.appendChild(createResetButton('Reset Node Settings to Defaults', '📦 Enhanced Nodes.', container));

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
    prefix: string,
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
        reset(prefix);

        // Rebuild panel so controls reflect the reset values
        panelContainer.innerHTML = '';
        renderSettingsPanel(panelContainer);
    });

    wrapper.appendChild(btn);
    return wrapper;
}
