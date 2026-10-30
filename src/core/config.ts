/**
 * Configuration constants for the ComfyUI Enhanced Links and Nodes extension.
 * Contains sacred geometry constants, animation timing, and default settings.
 *
 * @module core/config
 */

// =============================================================================
// Mathematical Constants
// =============================================================================

/** The golden ratio (φ) - used for aesthetically pleasing proportions */
export const PHI = 1.618033988749895;

/** Sacred geometry constants for pattern generation */
export const SACRED = Object.freeze({
    /** Base pattern foundation - used for trinity-based patterns */
    TRINITY: 3,
    /** Flow and crystalline structures */
    HARMONY: 7,
    /** Complex pattern completion cycles */
    COMPLETION: 12,
    /** Fibonacci sequence for growth patterns */
    FIBONACCI: Object.freeze([1, 1, 2, 3, 5, 8, 13, 21]),
    /** Quantum effects base */
    QUANTUM: 5,
    /** Infinite pattern cycles */
    INFINITY: 8,
});

// =============================================================================
// Animation Configuration
// =============================================================================

/** Animation timing and performance constants */
export const ANIMATION = Object.freeze({
    /** Target frame interval in ms (~60fps) */
    RAF_THROTTLE: 1000 / 60,
    /** Maximum size of particle pool */
    PARTICLE_POOL_SIZE: 1000,
    /** Smoothing factor for delta time */
    SMOOTH_FACTOR: 0.95,
    /** Maximum delta time cap (seconds) */
    MAX_DELTA: 1 / 30,
    /** Default transition speed for phase animations */
    TRANSITION_SPEED: (2 * Math.PI) / 15,
    /** Faster transition speed for more responsive animations */
    FAST_TRANSITION_SPEED: (2 * Math.PI) / 10,
});

// =============================================================================
// Default Settings
// =============================================================================

/** Default settings for link animations */
export const LINK_DEFAULTS = Object.freeze({
    '🔗 Enhanced Links.Animate': 9, // Classic Flow
    '🔗 Enhanced Links.Animation.Speed': 1, // Normal speed
    '🔗 Enhanced Links.Color.Mode': 'default', // Default colors
    '🔗 Enhanced Links.Color.Accent': '#9d00ff', // Purple
    '🔗 Enhanced Links.Color.Secondary': '#fb00ff', // Pink
    '🔗 Enhanced Links.Color.Primary': '#ffb300', // Orange
    '🔗 Enhanced Links.Color.Scheme': 'default', // Original colors
    '🔗 Enhanced Links.Direction': 1, // Forward
    '🔗 Enhanced Links.Glow.Intensity': 10, // Medium glow
    '🔗 Enhanced Links.Link.Style': 'spline', // Spline style
    '🔗 Enhanced Links.Marker.Enabled': true, // Markers enabled
    '🔗 Enhanced Links.Marker.Effects': 'none', // No effects
    '🔗 Enhanced Links.Marker.Glow': 10, // Medium glow
    '🔗 Enhanced Links.Marker.Color': '#00fff7', // Cyan
    '🔗 Enhanced Links.Marker.Color.Mode': 'default', // Default colors
    '🔗 Enhanced Links.Marker.Size': 3, // Large size
    '🔗 Enhanced Links.Marker.Shape': 'arrow', // Arrow shape
    '🔗 Enhanced Links.Particle.Density': 0.5, // Minimal
    '🔗 Enhanced Links.Quality': 1, // Basic (Fast)
    '🔗 Enhanced Links.Link.Shadow.Enabled': false, // Link shadows off by default
    '🔗 Enhanced Links.Marker.Shadow.Enabled': false, // Marker shadows off by default
    '🔗 Enhanced Links.Thickness': 3, // Medium thickness
    '🔗 Enhanced Links.UI & Æmotion Studio About': 0, // Closed panel
    '🔗 Enhanced Links.Static.Mode': false, // Animated mode
    '🔗 Enhanced Links.Pause.During.Render': true, // Pause during render
    '🔗 Enhanced Links.Shadow.Blur': 5, // Shadow blur
    '🔗 Enhanced Links.Shadow.Offset': 3, // Shadow offset
});

/** Default settings for node animations */
export const NODE_DEFAULTS = Object.freeze({
    '📦 Enhanced Nodes.Animate': 0, // None (off by default)
    '📦 Enhanced Nodes.Animation.Glow': 0.5, // Medium glow
    '📦 Enhanced Nodes.Animation.Size': 1, // Normal size
    '📦 Enhanced Nodes.Animation.Speed': 1, // Normal speed
    '📦 Enhanced Nodes.Animations.Enabled': true, // Animations on
    '📦 Enhanced Nodes.Color.Accent': '#0088ff', // Deep blue
    '📦 Enhanced Nodes.Color.Hover': '#00ff15', // Green hover outline
    '📦 Enhanced Nodes.Color.Hover.Show': false, // Hide hover outline
    '📦 Enhanced Nodes.Color.Mode': 'default', // Default colors
    '📦 Enhanced Nodes.Color.Particle': '#ffff00', // Yellow
    '📦 Enhanced Nodes.Color.Primary': '#44aaff', // Bright blue
    '📦 Enhanced Nodes.Color.Scheme': 'default', // Original colors
    '📦 Enhanced Nodes.Color.Secondary': '#88ccff', // Light blue
    '📦 Enhanced Nodes.Direction': 1, // Forward
    '📦 Enhanced Nodes.End Animation.Enabled': false, // No end animation
    '📦 Enhanced Nodes.Glow': 0.5, // Medium glow
    '📦 Enhanced Nodes.Glow.Show': true, // Show glow
    '📦 Enhanced Nodes.Intensity': 1.0, // Normal intensity
    '📦 Enhanced Nodes.Particle.Color.Mode': 'default', // Default particle colors
    '📦 Enhanced Nodes.Particle.Density': 1, // Normal density
    '📦 Enhanced Nodes.Particle.Glow': 0.5, // Medium particle glow
    '📦 Enhanced Nodes.Particle.Intensity': 1.0, // Normal intensity
    '📦 Enhanced Nodes.Particle.Show': false, // Particles off by default
    '📦 Enhanced Nodes.Particle.Size': 1.0, // Normal size
    '📦 Enhanced Nodes.Particle.Speed': 1, // Normal speed
    '📦 Enhanced Nodes.Quality': 2, // Balanced
    '📦 Enhanced Nodes.Static.Mode': false, // Animated mode
    '📦 Enhanced Nodes.Pause.During.Render': true, // Pause during render
    '📦 Enhanced Nodes.Text.Animation.Enabled': false, // No text animation
    '📦 Enhanced Nodes.Text.Color': '#00ffff', // Cyan
    '📦 Enhanced Nodes.Text.Glow': 0.5, // Medium text glow
    '📦 Enhanced Nodes.Text.Size': 14, // 14px text
    '📦 Enhanced Nodes.Text.Style': 'neon', // Neon style
    '📦 Enhanced Nodes.Text.Letter.Spacing': 0, // Normal spacing
    '📦 Enhanced Nodes.Text.Position.X': 0, // Centered X
    '📦 Enhanced Nodes.Text.Position.Y': 0, // Centered Y
    '📦 Enhanced Nodes.Text.Rotation.Radius': 0, // No orbit
    '📦 Enhanced Nodes.Text.Rotation.Angle': 0, // No rotation
    '📦 Enhanced Nodes.UI & Æmotion Studio About': 0, // Closed panel
});

/** Combined configuration object for backward compatibility */
export const CONFIG = Object.freeze({
    PHI,
    SACRED,
    ANIMATION,
});
