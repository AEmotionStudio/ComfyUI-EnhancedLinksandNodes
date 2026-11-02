/**
 * Colours. A CSS colour is read as the canvas reads it (#rgb, #rgba, #rrggbb,
 * #rrggbbaa, rgb() and hsl()) and Color.Scheme filters it as v1 did. Each link
 * colour gets a palette, the colours an animation draws its segments in, kept
 * until a setting changes, so frames build no colour strings. Each node
 * effect style gets one too, with its particles' colour; the node effects'
 * colours at alphas of their own, and the particle colour modes that change
 * over time, are written as they are drawn, as v1 wrote them.
 *
 * Ported from v1's ColorManager (old_link_animations.js:1614-1749), which read
 * 6-digit hex only and left any other colour, and every colour in a scheme it
 * could not read, as it was.
 *
 * @module core/colors
 */

import { L, N, revision } from '@/core/settings';
import { MAX_FLASH_HZ, dummy } from '@/core/engine';

/** Red, green and blue from 0 to 255, alpha from 0 to 1. */
type Rgba = [number, number, number, number];

/** The colours an animation draws a segment in, by role, and the colour native draws it in, for the centre marker. */
export interface Palette {
    native: string;
    primary: string;
    secondary: string;
    accent: string;
    /** The flow markers' colour. */
    marker: string;
}

/** Native's white for the links of selected nodes, which neither Color.Mode nor Color.Scheme changes. */
export const HIGHLIGHT: Palette = { native: '#ffffff', primary: '#ffffff', secondary: '#ffffff', accent: '#ffffff', marker: '#ffffff' };

const HEX = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const NUMBER = '([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?)';
/** rgb() and hsl(), with or without the a, commas or spaces between the values, and an alpha after a comma or a slash. */
const FUNCTION = new RegExp(`^(rgb|hsl)a?\\(\\s*${NUMBER}(%|deg)?\\s*,?\\s*${NUMBER}(%)?\\s*,?\\s*${NUMBER}(%)?\\s*(?:[,/]\\s*${NUMBER}(%)?\\s*)?\\)$`, 'i');

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** The red, green and blue (0-255) of hue h (degrees from 0 to 360), saturation s and lightness l (0-100), as v1's hsl2Hex rounds them. */
export function fromHsl(h: number, s: number, l: number): [number, number, number] {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        return Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));
    };
    return [f(0), f(8), f(4)];
}

/** A colour the canvas would take, or null. */
function parse(colour: string): Rgba | null {
    const text = colour.trim();
    const hex = HEX.exec(text);
    if (hex) {
        const digits = hex[1].length < 6 ? [...hex[1]].map((d) => d + d).join('') : hex[1];
        const byte = (i: number) => parseInt(digits.slice(i, i + 2), 16);
        return [byte(0), byte(2), byte(4), digits.length === 8 ? byte(6) / 255 : 1];
    }
    const fn = FUNCTION.exec(text);
    if (!fn) return null;
    const [, kind, x, xUnit, y, yUnit, z, zUnit, a, aUnit] = fn;
    const alpha = a === undefined ? 1 : clamp(Number(a) / (aUnit ? 100 : 1), 0, 1);
    if (kind.toLowerCase() === 'hsl') {
        const hue = Number(x) % 360;
        return [...fromHsl(hue < 0 ? hue + 360 : hue, clamp(Number(y), 0, 100), clamp(Number(z), 0, 100)), alpha];
    }
    const channel = (v: string, unit?: string) => Math.round(clamp(unit ? (Number(v) * 255) / 100 : Number(v), 0, 255));
    return [channel(x, xUnit), channel(y, yUnit), channel(z, zUnit), alpha];
}

/** A colour as the canvas writes it back: #rrggbb, or rgba() while it is translucent. */
function show([r, g, b, a]: Rgba): string {
    if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** v1's hex2Hsl (old_link_animations.js:1631-1655): the hue in degrees, and the saturation and lightness in %, of red, green and blue from 0 to 255. */
function toHsl(r: number, g: number, b: number): [number, number, number] {
    const [R, G, B] = [r / 255, g / 255, b / 255];
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
        else if (max === G) h = (B - R) / d + 2;
        else h = (R - G) / d + 4;
        h /= 6;
    }
    return [h * 360, s * 100, l * 100];
}

/** v1's enhanceColor (old_link_animations.js:1625-1700): the scheme's change to the colour's saturation and lightness. */
function filter([r, g, b, alpha]: Rgba, scheme: string): Rgba {
    if (scheme === 'default') return [r, g, b, alpha];
    const [h, s, L100] = toHsl(r, g, b);
    switch (scheme) {
        case 'saturated':
            return [...fromHsl(h, Math.min(s * 1.3, 100), L100), alpha];
        case 'vivid':
            return [...fromHsl(h, Math.min(s * 1.4, 100), Math.min(L100 * 1.1, 100)), alpha];
        case 'contrast':
            return [...fromHsl(h, Math.min(s * 1.2, 100), L100 > 50 ? Math.min(L100 * 1.2, 100) : Math.max(L100 * 0.8, 0)), alpha];
        case 'bright':
            return [...fromHsl(h, s, Math.min(L100 * 1.25, 100)), alpha];
        case 'muted':
            return [...fromHsl(h, Math.max(s * 0.7, 0), Math.min(L100 * 1.1, 100)), alpha];
        default:
            return [r, g, b, alpha];
    }
}

/** A setting's colour, which the settings keep valid, through Color.Scheme. */
const tint = (colour: string) => show(filter(parse(colour)!, L.colorScheme));

const palettes = new Map<string, Palette | null>();
let palettesSince = -1;

/**
 * The palette of a segment native draws in `colour`, or undefined if the canvas would not take it as a colour: in
 * Color.Mode default each role takes the colour, in custom the custom colours; the marker takes the colour, the link's
 * primary (inherit) or its own (custom). Color.Scheme filters each once, where v1 filtered some twice.
 */
export function palette(colour: unknown): Palette | undefined {
    if (typeof colour !== 'string') return undefined;
    if (palettesSince !== revision) {
        palettes.clear();
        palettesSince = revision;
    }
    let p = palettes.get(colour);
    if (p === undefined) {
        const rgba = parse(colour);
        if (rgba) {
            const own = show(filter(rgba, L.colorScheme));
            const [primary, secondary, accent] = L.colorMode === 'custom' ? [tint(L.colorPrimary), tint(L.colorSecondary), tint(L.colorAccent)] : [own, own, own];
            const marker = L.markerColorMode === 'custom' ? tint(L.markerColor) : L.markerColorMode === 'inherit' ? primary : own;
            p = { native: show(rgba), primary, secondary, accent, marker };
        } else p = null;
        palettes.set(colour, p);
    }
    return p ?? undefined;
}

const solids = new Map<string, Palette>();
const lifted = new Map<string, string>();
let solidsSince = -1;

/** solids and lifted, emptied when a setting changes. */
function solidCaches(): void {
    if (solidsSince === revision) return;
    solids.clear();
    lifted.clear();
    solidsSince = revision;
}

/** A palette with `colour` in every role, as the focus colours draw links: neither Color.Mode nor Color.Scheme changes it. */
export function solid(colour: string): Palette {
    solidCaches();
    let p = solids.get(colour);
    if (!p) solids.set(colour, (p = { native: colour, primary: colour, secondary: colour, accent: colour, marker: colour }));
    return p;
}

/** A channel a fifth of the way to white. */
const lift = (v: number) => Math.round(v + (255 - v) * 0.2);

/** `colour` lightened 20 %, a fifth of the way to white; a colour the canvas would not take stays as it is. */
export function lighter(colour: string): string {
    solidCaches();
    let light = lifted.get(colour);
    if (light === undefined) {
        const rgba = parse(colour);
        light = rgba ? show([lift(rgba[0]), lift(rgba[1]), lift(rgba[2]), rgba[3]]) : colour;
        lifted.set(colour, light);
    }
    return light;
}

/** The theme's accent, as the frontend's own controls take it (--primary-background, 1.39.5 to 1.60), and the panel does. */
export function accent(): string {
    const rgba = parse(getComputedStyle(document.body).getPropertyValue('--primary-background'));
    return rgba ? show(rgba) : '#0b8ce9';
}

/** The WCAG relative luminance of mid grey, CIE L* 50. */
const MID_GREY = 0.184;
let background = '';
let darkBackground = true;

/** A channel from 0 to 255 in linear light (WCAG 2's relative luminance). */
const linear = (v: number) => (v <= 10 ? v / 3294.6 : ((v / 255 + 0.055) / 1.055) ** 2.4);

/**
 * Whether a canvas background is darker than mid grey. The canvas reads it, as palettes name colours too: the light
 * palette's is lightgray. One that shows what is behind it is not, as with Comfy.Canvas.BackgroundImage, which makes it
 * transparent whatever the palette (FE157 colorPaletteService.ts L153-157, FE1395 L156-160).
 */
export function dark(colour: string): boolean {
    if (colour === background) return darkBackground;
    background = colour;
    const ctx = dummy();
    ctx.fillStyle = '#000';
    ctx.fillStyle = colour;
    const [r, g, b, a] = parse(String(ctx.fillStyle))!;
    darkBackground = a === 1 && 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b) < MID_GREY;
    return darkBackground;
}

const hues: string[] = [];
let huesSince = -1;

/** A rainbow marker's colour: hsl(hue, 100%, 50%) to the nearest degree, through Color.Scheme. */
export function rainbow(hue: number): string {
    if (huesSince !== revision) {
        for (let h = 0; h < 360; h++) hues[h] = show(filter([...fromHsl(h, 100, 50), 1], L.colorScheme));
        huesSince = revision;
    }
    return hues[((Math.round(hue) % 360) + 360) % 360];
}

// =============================================================================
// Node colours
// =============================================================================

/** Each node effect's own primary, secondary and accent colours (old_node_animations.js:695-716); particles alone (0) take Gentle Pulse's. */
const STYLE_COLOURS = [
    ['#44aaff', '#88ccff', '#0088ff'],
    ['#44aaff', '#88ccff', '#0088ff'],
    ['#00ff88', '#00ffcc', '#00ff44'],
    ['#ff00ff', '#aa00ff', '#ff40ff'],
    ['#ffcc00', '#ff8800', '#ffaa00'],
];

/** The colours a node effect draws in by role, its particles' in the default and complementary Particle.Color.Mode, and its nodes' styled titles'. */
export interface NodePalette {
    primary: string;
    secondary: string;
    accent: string;
    particle: string;
    complement: string;
    title: string;
}

/** A node colour through Color.Scheme. */
const nodeTint = (colour: string) => show(filter(parse(colour)!, N.colorScheme));

const nodePalettes: NodePalette[] = [];
let nodePalettesSince = -1;

/**
 * Node effect `style`'s palette, kept until a setting changes: the style's colours, or the custom ones in Color.Mode
 * custom, through Color.Scheme. Its particles take Color.Particle in custom, else the primary colour, which is what v1's
 * showed: they were to take the node's colour, but v1 read only 6-digit hex and fell back to the style's primary, and
 * native hands drawNodeShape '#333' (litegraph 0.8) or an hsla() colour (1.39.5 and 1.57.1, LGraphNode.renderingColor).
 * The complementary colour is the particle colour's opposite hue, at its own saturation (old_node_animations.js:852-928).
 * Titles take Text.Color in custom, else the accent, as v1's getTextColor did (:930-939).
 */
export function nodePalette(style: number): NodePalette {
    if (nodePalettesSince !== revision) {
        nodePalettes.length = 0;
        nodePalettesSince = revision;
    }
    let p = nodePalettes[style];
    if (!p) {
        const custom = N.colorMode === 'custom';
        const [primary, secondary, accent] = (custom ? [N.colorPrimary, N.colorSecondary, N.colorAccent] : STYLE_COLOURS[style]).map(nodeTint);
        // v1 took the opposite of the particle colour as set, before the scheme.
        const [r, g, b] = parse(custom ? N.colorParticle : primary)!;
        const [h, s, l] = toHsl(r, g, b);
        p = nodePalettes[style] = {
            primary,
            secondary,
            accent,
            particle: custom ? nodeTint(N.colorParticle) : primary,
            complement: `hsl(${(h + 180) % 360}, ${s}%, ${l}%)`,
            title: custom ? nodeTint(N.textColor) : accent,
        };
    }
    return p;
}

/** How much slower a lightness that swings at `w` radians a second must swing to stay within MAX_FLASH_HZ. */
const calm = (w: number) => Math.min(1, (2 * Math.PI * MAX_FLASH_HZ) / w);

/**
 * Particle `i`'s colour at particle time `t`, which runs `rate` a second, in Particle.Color.Mode: v1's getParticleColor
 * (old_node_animations.js:852-901). Quantum and Aurora take their hue around the circle below 0 too, which v1's % did not,
 * so going Reverse they keep their colours; and the lightness they swing for every particle at once swings at most
 * MAX_FLASH_HZ times a second.
 */
export function particleColour(pal: NodePalette, i: number, t: number, rate: number): string {
    switch (N.particleColorMode) {
        case 'rainbow':
            return `hsl(${(i * 30 + t * 50) % 360}, 90%, 75%)`;
        case 'complementary':
            return pal.complement;
        case 'energy':
            return `hsl(${(t * 100 + i * 20) % 360}, 90%, 75%)`;
        case 'quantum': {
            const q = (t * 2 + i * 0.1) % 1;
            return `hsl(${280 + (q < 0 ? q + 1 : q) * 80}, 90%, ${60 + Math.sin(t * 5 * calm(5 * rate)) * 20}%)`;
        }
        case 'aurora': {
            const a = (t * 3 + i * 0.2) % 1;
            return `hsl(${120 + (a < 0 ? a + 1 : a) * 60}, ${80 + Math.sin(t * 3) * 20}%, ${70 + Math.sin(t * 4 * calm(4 * rate)) * 20}%)`;
        }
        default:
            return pal.particle;
    }
}

const prefixes = new Map<string, string>();
let prefixesSince = -1;

/** `colour` at `alpha`: an hsl() colour, which the particle colour modes make anew each frame, as hsla(); a palette's as rgba(), read once per setting change. */
export function translucent(colour: string, alpha: number): string {
    if (colour.startsWith('hsl(')) return `hsla(${colour.slice(4, -1)}, ${alpha})`;
    if (prefixesSince !== revision) {
        prefixes.clear();
        prefixesSince = revision;
    }
    let start = prefixes.get(colour);
    if (start === undefined) {
        const [r, g, b] = parse(colour)!;
        prefixes.set(colour, (start = `rgba(${r}, ${g}, ${b}, `));
    }
    return `${start}${alpha})`;
}
