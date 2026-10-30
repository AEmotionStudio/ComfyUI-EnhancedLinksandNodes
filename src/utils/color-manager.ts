/**
 * Color Management — HSL-based color manipulation for link/node effects.
 *
 * Provides color validation, enhancement schemes (saturated, vivid, contrast,
 * bright, muted), and custom/default color mode resolution.
 *
 * Ported from original link_animations.js ColorManager (lines 1613–1748).
 *
 * @module utils/color-manager
 */

import { L, N } from '@/core/settings';

// =============================================================================
// HSL ↔ Hex conversion
// =============================================================================

function hex2Hsl(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

function hsl2Hex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

// =============================================================================
// Validation
// =============================================================================

export function validateHexColor(color: unknown): string | null {
    if (!color || typeof color !== 'string') return null;
    let c = color;
    if (c[0] !== '#') c = '#' + c;
    if (!/^#[0-9A-Fa-f]{6}$/.test(c)) return null;
    return c;
}

// =============================================================================
// Enhancement
// =============================================================================

export function enhanceColor(color: string, scheme: string): string {
    if (!color || scheme === 'default') return color;

    const valid = validateHexColor(color);
    if (!valid) return color;

    try {
        const [h, s, l] = hex2Hsl(valid);
        switch (scheme) {
            case 'saturated':
                return hsl2Hex(h, Math.min(s * 1.3, 100), l);
            case 'vivid':
                return hsl2Hex(h, Math.min(s * 1.4, 100), Math.min(l * 1.1, 100));
            case 'contrast':
                return hsl2Hex(h, Math.min(s * 1.2, 100), l > 50 ? Math.min(l * 1.2, 100) : Math.max(l * 0.8, 0));
            case 'bright':
                return hsl2Hex(h, s, Math.min(l * 1.25, 100));
            case 'muted':
                return hsl2Hex(h, Math.max(s * 0.7, 0), Math.min(l * 1.1, 100));
            default:
                return valid;
        }
    } catch {
        return color;
    }
}

// =============================================================================
// Color Mode Resolution (reads the settings snapshots)
// =============================================================================

/**
 * Returns custom colors if the user has set Color Mode to "custom",
 * or null if using defaults.
 */
export function getCustomLinkColors(): { primary: string; secondary: string; accent: string } | null {
    const colorMode = L.colorMode;
    const colorScheme = L.colorScheme;

    if (colorMode === 'custom') {
        const primary = L.colorPrimary;
        const secondary = L.colorSecondary;
        const accent = L.colorAccent;

        return {
            primary: enhanceColor(validateHexColor(primary) || '#ffffff', colorScheme),
            secondary: enhanceColor(validateHexColor(secondary) || '#ff6600', colorScheme),
            accent: enhanceColor(validateHexColor(accent) || '#ff8800', colorScheme),
        };
    }

    return null;
}

/** Get primary link color (custom or enhanced default) */
export function getLinkColor(defaultColor: string): string {
    const colors = getCustomLinkColors();
    const scheme = L.colorScheme;
    return colors ? colors.primary : enhanceColor(defaultColor, scheme);
}

/** Get secondary link color (custom or enhanced default) */
export function getSecondaryColor(defaultColor: string): string {
    const colors = getCustomLinkColors();
    const scheme = L.colorScheme;
    return colors ? colors.secondary : enhanceColor(defaultColor, scheme);
}

/** Get accent/particle link color (custom or enhanced default) */
export function getAccentColor(defaultColor: string): string {
    const colors = getCustomLinkColors();
    const scheme = L.colorScheme;
    return colors ? colors.accent : enhanceColor(defaultColor, scheme);
}

// =============================================================================
// Node Color Resolution
// =============================================================================

/** Animation-specific default colors for node effects */
const NODE_ANIMATION_COLORS = Object.freeze({
    gentlePulse: Object.freeze({ primary: '#44aaff', secondary: '#88ccff', accent: '#0088ff' }),
    neonNexus: Object.freeze({ primary: '#00ff88', secondary: '#00ffcc', accent: '#00ff44' }),
    cosmicRipple: Object.freeze({ primary: '#ff00ff', secondary: '#aa00ff', accent: '#ff40ff' }),
    flowerOfLife: Object.freeze({ primary: '#ffcc00', secondary: '#ff8800', accent: '#ffaa00' }),
});

/** Get custom node colors (respects custom mode + per-animation fallback colors) */
export function getCustomNodeColors(): { primary: string; secondary: string; accent: string } {
    const colorMode = N.colorMode;
    const colorScheme = N.colorScheme;
    const animStyle = N.animate;

    // Get animation-specific defaults
    const animColors = (() => {
        switch (animStyle) {
            case 2: return NODE_ANIMATION_COLORS.neonNexus;
            case 3: return NODE_ANIMATION_COLORS.cosmicRipple;
            case 4: return NODE_ANIMATION_COLORS.flowerOfLife;
            default: return NODE_ANIMATION_COLORS.gentlePulse;
        }
    })();

    if (colorMode === 'custom') {
        const primary = N.colorPrimary;
        const secondary = N.colorSecondary;
        const accent = N.colorAccent;

        return {
            primary: enhanceColor(validateHexColor(primary) || animColors.primary, colorScheme),
            secondary: enhanceColor(validateHexColor(secondary) || animColors.secondary, colorScheme),
            accent: enhanceColor(validateHexColor(accent) || animColors.accent, colorScheme),
        };
    }

    // Default mode — use animation-specific colors
    return {
        primary: enhanceColor(animColors.primary, colorScheme),
        secondary: enhanceColor(animColors.secondary, colorScheme),
        accent: enhanceColor(animColors.accent, colorScheme),
    };
}
