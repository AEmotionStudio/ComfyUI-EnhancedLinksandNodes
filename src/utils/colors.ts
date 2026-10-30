/**
 * Color utility functions for the ComfyUI Enhanced Links and Nodes extension.
 * This module provides hex/HSL conversion, color validation, alpha handling,
 * and color scheme enhancements.
 *
 * @module utils/colors
 */

import type { Color, ColorScheme, HexColor } from '@/core/types';

// =============================================================================
// Configuration
// =============================================================================

/** Pre-defined color palettes for different animation styles */
export const ANIMATION_COLORS = Object.freeze({
    gentlePulse: Object.freeze({
        primary: '#44aaff', // Bright blue
        secondary: '#88ccff', // Light blue
        accent: '#0088ff', // Deep blue
    }),
    neonNexus: Object.freeze({
        primary: '#00ff88', // Neon green
        secondary: '#00ffcc', // Cyan
        accent: '#00ff44', // Bright green
    }),
    cosmicRipple: Object.freeze({
        primary: '#ff00ff', // Magenta
        secondary: '#aa00ff', // Purple
        accent: '#ff40ff', // Light magenta
    }),
    flowerOfLife: Object.freeze({
        primary: '#ffcc00', // Golden
        secondary: '#ff8800', // Orange
        accent: '#ffaa00', // Amber
    }),
});

export type AnimationStyle = keyof typeof ANIMATION_COLORS;

// =============================================================================
// Validation
// =============================================================================

/**
 * Validates and normalizes a hex color string.
 *
 * @param color - The color string to validate
 * @returns The validated hex color with # prefix, or null if invalid
 *
 * @example
 * validateHexColor('#ff0000') // '#ff0000'
 * validateHexColor('ff0000')  // '#ff0000'
 * validateHexColor('#fff')    // null (shorthand not supported)
 * validateHexColor(null)      // null
 */
export function validateHexColor(color: unknown): HexColor | null {
    if (!color || typeof color !== 'string') return null;

    // Add # prefix if missing
    const normalized = color.startsWith('#') ? color : `#${color}`;

    // Validate 6-digit hex format
    if (!/^#[0-9A-Fa-f]{6}$/i.test(normalized)) return null;

    return normalized.toLowerCase() as HexColor;
}

// =============================================================================
// HSL Conversion
// =============================================================================

/**
 * Converts a hex color to HSL values.
 *
 * @param hex - A valid hex color string (with or without #)
 * @returns Tuple of [hue (0-360), saturation (0-100), lightness (0-100)]
 *
 * @example
 * hex2Hsl('#ff0000') // [0, 100, 50] (red)
 * hex2Hsl('#00ff00') // [120, 100, 50] (green)
 */
export function hex2Hsl(hex: string): [number, number, number] {
    const validated = validateHexColor(hex);
    if (!validated) {
        console.warn('Invalid hex color for HSL conversion:', hex);
        return [0, 0, 50]; // Default to gray
    }

    const r = parseInt(validated.slice(1, 3), 16) / 255;
    const g = parseInt(validated.slice(3, 5), 16) / 255;
    const b = parseInt(validated.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}

/**
 * Converts HSL values to a hex color string.
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string with # prefix
 *
 * @example
 * hsl2Hex(0, 100, 50)   // '#ff0000' (red)
 * hsl2Hex(120, 100, 50) // '#00ff00' (green)
 */
export function hsl2Hex(h: number, s: number, l: number): HexColor {
    // Normalize lightness to 0-1 range
    const lNorm = l / 100;
    const a = (s * Math.min(lNorm, 1 - lNorm)) / 100;

    const f = (n: number): string => {
        const k = (n + h / 30) % 12;
        const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, '0');
    };

    return `#${f(0)}${f(8)}${f(4)}` as HexColor;
}

// =============================================================================
// Cache
// =============================================================================

const HEX_RGB_CACHE = new Map<string, { r: number; g: number; b: number } | null>();
const MAX_CACHE_SIZE = 1000;

/**
 * Converts a hex color to RGB values.
 *
 * @param hex - A valid hex color string
 * @returns Object with r, g, b values (0-255) or null if invalid
 */
export function hexToRgb(
    hex: string
): { r: number; g: number; b: number } | null {
    if (HEX_RGB_CACHE.has(hex)) {
        const cached = HEX_RGB_CACHE.get(hex);
        return cached ? { ...cached } : null;
    }

    const validated = validateHexColor(hex);
    let result: { r: number; g: number; b: number } | null = null;

    if (validated) {
        result = {
            r: parseInt(validated.slice(1, 3), 16),
            g: parseInt(validated.slice(3, 5), 16),
            b: parseInt(validated.slice(5, 7), 16),
        };
    }

    // Limit cache size
    if (HEX_RGB_CACHE.size >= MAX_CACHE_SIZE) {
        HEX_RGB_CACHE.clear();
    }

    HEX_RGB_CACHE.set(hex, result);
    return result ? { ...result } : null;
}

// =============================================================================
// Alpha Handling
// =============================================================================

/**
 * Adds an alpha (transparency) value to a color.
 *
 * Handles hex colors, HSL colors, and already-rgba colors.
 * Returns a CSS rgba() or hsla() string.
 *
 * @param color - The base color (hex, hsl, or rgba)
 * @param alpha - Alpha value from 0 (transparent) to 1 (opaque)
 * @returns CSS color string with alpha applied
 *
 * @example
 * withAlpha('#ff0000', 0.5)       // 'rgba(255, 0, 0, 0.5)'
 * withAlpha('hsl(0, 100%, 50%)', 0.5) // 'hsla(0, 100%, 50%, 0.5)'
 * withAlpha(null, 0.5)            // 'rgba(0, 255, 255, 0.5)' (default cyan)
 */
export function withAlpha(color: Color | null | undefined, alpha: number): string {
    // Clamp alpha to valid range
    const validAlpha = Math.max(0, Math.min(1, alpha));

    // Handle null/undefined - return default cyan
    if (!color) {
        return `rgba(0, 255, 255, ${validAlpha})`;
    }

    // Handle hex colors
    if (typeof color === 'string' && color.startsWith('#')) {
        const rgb = hexToRgb(color);
        if (rgb) {
            return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${validAlpha})`;
        }
        // Invalid hex - return default
        return `rgba(0, 255, 255, ${validAlpha})`;
    }

    // Handle HSL colors
    if (typeof color === 'string' && color.startsWith('hsl(')) {
        return color.replace(/hsl\((.*)\)/, `hsla($1, ${validAlpha})`);
    }

    // Handle HSLA colors - update existing alpha
    if (typeof color === 'string' && color.startsWith('hsla(')) {
        return color.replace(/hsla\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `hsla($1,$2,$3, ${validAlpha})`);
    }

    // Handle existing RGBA - update alpha
    if (typeof color === 'string' && color.startsWith('rgba(')) {
        return color.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3, ${validAlpha})`);
    }

    // Return as-is for other formats
    return color;
}

// =============================================================================
// Color Enhancement
// =============================================================================

/**
 * Applies a color scheme enhancement to a base color.
 *
 * @param color - The base color to enhance
 * @param scheme - The enhancement scheme to apply
 * @returns Enhanced color as hex string
 *
 * @example
 * enhanceColor('#808080', 'saturated') // More saturated gray
 * enhanceColor('#ff0000', 'bright')    // Brighter red
 * enhanceColor('#00ff00', 'muted')     // Muted green
 */
export function enhanceColor(color: Color, scheme: ColorScheme): Color {
    // Default scheme returns the color unchanged
    if (scheme === 'default') return color;

    // Validate the input color
    const validated = validateHexColor(color);
    if (!validated) return color;

    // Convert to HSL for manipulation
    const [h, s, l] = hex2Hsl(validated);

    // Apply enhancement based on scheme
    switch (scheme) {
        case 'saturated':
            return hsl2Hex(h, Math.min(s * 1.3, 100), l);

        case 'vivid':
            return hsl2Hex(h, Math.min(s * 1.4, 100), Math.min(l * 1.1, 100));

        case 'contrast':
            return hsl2Hex(
                h,
                Math.min(s * 1.2, 100),
                l > 50 ? Math.min(l * 1.2, 100) : Math.max(l * 0.8, 0)
            );

        case 'bright':
            return hsl2Hex(h, s, Math.min(l * 1.25, 100));

        case 'muted':
            return hsl2Hex(h, Math.max(s * 0.7, 0), Math.min(l * 1.1, 100));

        default:
            return validated;
    }
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Gets the complementary color (180 degrees opposite on the color wheel).
 *
 * @param color - Base hex color
 * @returns Complementary hex color
 */
export function getComplementaryColor(color: string): HexColor {
    const [h, s, l] = hex2Hsl(color);
    return hsl2Hex((h + 180) % 360, s, l);
}

/**
 * Creates an HSL color string for use in CSS.
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns CSS hsl() color string
 */
export function hsl(h: number, s: number, l: number): string {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

/**
 * Creates an HSLA color string for use in CSS.
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @param a - Alpha (0-1)
 * @returns CSS hsla() color string
 */
export function hsla(h: number, s: number, l: number, a: number): string {
    return `hsla(${h}, ${s}%, ${l}%, ${Math.max(0, Math.min(1, a))})`;
}

/**
 * Gets the animation colors for a specific animation style.
 *
 * @param style - Animation style name or number (1-4)
 * @returns Color palette for the animation style
 */
export function getAnimationColors(
    style: AnimationStyle | number
): (typeof ANIMATION_COLORS)[AnimationStyle] {
    if (typeof style === 'number') {
        switch (style) {
            case 1:
                return ANIMATION_COLORS.gentlePulse;
            case 2:
                return ANIMATION_COLORS.neonNexus;
            case 3:
                return ANIMATION_COLORS.cosmicRipple;
            case 4:
                return ANIMATION_COLORS.flowerOfLife;
            default:
                return ANIMATION_COLORS.gentlePulse;
        }
    }
    return ANIMATION_COLORS[style] || ANIMATION_COLORS.gentlePulse;
}
