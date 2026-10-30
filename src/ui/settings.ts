/**
 * Option lists for the settings combos, shared by the settings registration and the sidebar.
 *
 * @module ui/settings
 */

// =============================================================================
// Link Animation Styles
// =============================================================================

/** Link animation style options */
export const LINK_ANIMATION_OPTIONS = [
    { value: 0, text: '⭘️ Off' },
    { value: 9, text: '🔄 Classic Flow' },
    { value: 1, text: '✨ Sacred Flow' },
    { value: 2, text: '💎 Crystal Stream' },
    { value: 3, text: '🔬 Quantum Field' },
    { value: 4, text: '🌌 Cosmic Weave' },
    { value: 5, text: '⚡ Energy Pulse' },
    { value: 6, text: '🧬 DNA Helix' },
    { value: 7, text: '🌋 Lava Flow' },
    { value: 8, text: '🌠 Stellar Plasma' },
] as const;

/** Link style options */
export const LINK_STYLE_OPTIONS = [
    { value: 'spline', text: '🔗 Spline (Default)' },
    { value: 'straight', text: '📏 Straight' },
    { value: 'linear', text: '📐 Linear (Right Angle)' },
    { value: 'hidden', text: '👻 Hidden' },
    { value: 'dotted', text: '⚪ Dotted' },
    { value: 'dashed', text: '➖ Dashed' },
    { value: 'double', text: '= Double' },
    { value: 'stepped', text: '📶 Stepped' },
    { value: 'zigzag', text: '⚡ Zigzag' },
    { value: 'rope', text: '🧵 Rope' },
    { value: 'glowpath', text: '✨ Glow Path' },
    { value: 'chain', text: '⛓️ Chain' },
    { value: 'pulse', text: '💓 Pulse' },
    { value: 'holographic', text: '🌈 Holographic' },
] as const;

/** Marker shape options */
export const MARKER_SHAPE_OPTIONS = [
    { value: 'none', text: '⭘️ None' },
    { value: 'arrow', text: '➤ Arrow' },
    { value: 'diamond', text: '◇ Diamond' },
    { value: 'circle', text: '● Circle' },
    { value: 'square', text: '■ Square' },
    { value: 'triangle', text: '▲ Triangle' },
    { value: 'star', text: '★ Star' },
    { value: 'heart', text: '♥ Heart' },
    { value: 'cross', text: '✚ Cross' },
    { value: 'hexagon', text: '⬡ Hexagon' },
    { value: 'flower', text: '✿ Flower' },
    { value: 'spiral', text: '🌀 Spiral' },
] as const;

// =============================================================================
// Node Animation Styles
// =============================================================================

/** Node animation style options */
export const NODE_ANIMATION_OPTIONS = [
    { value: 0, text: '⭘️ Off' },
    { value: 1, text: '💫 Gentle Pulse' },
    { value: 2, text: '⚡ Neon Nexus' },
    { value: 3, text: '🌌 Cosmic Ripple' },
    { value: 4, text: '✿ Flower of Life' },
] as const;

// =============================================================================
// Common Option Sets
// =============================================================================

/** Enabled/Disabled toggle */
export const ENABLED_DISABLED_OPTIONS = [
    { value: true, text: '✅ Enabled' },
    { value: false, text: '❌ Disabled' },
] as const;

/** Direction options */
export const DIRECTION_OPTIONS = [
    { value: 1, text: '➡️ Forward' },
    { value: -1, text: '⬅️ Reverse' },
] as const;

/** Color mode options */
export const COLOR_MODE_OPTIONS = [
    { value: 'default', text: '🎨 Default' },
    { value: 'custom', text: '🖌️ Custom' },
] as const;

/** Color scheme options */
export const COLOR_SCHEME_OPTIONS = [
    { value: 'default', text: '🎨 Original' },
    { value: 'saturated', text: '🌈 Saturated' },
    { value: 'vivid', text: '💥 Vivid' },
    { value: 'contrast', text: '⚡ High Contrast' },
    { value: 'bright', text: '☀️ Bright' },
    { value: 'muted', text: '🌙 Muted' },
] as const;

/** Quality options */
export const QUALITY_OPTIONS = [
    { value: 1, text: '🚀 Basic (Fast)' },
    { value: 2, text: '⚖️ Balanced' },
    { value: 3, text: '💎 Enhanced' },
] as const;
