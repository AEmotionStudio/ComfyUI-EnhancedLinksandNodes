/**
 * What v1 (git 1ecca1d:js/*.js) fed its renderers, and the frame drivers that
 * turn a renderer into a Level A trace. The v3 Classic config must reproduce
 * the traces from the same inputs.
 *
 * @module tests/unit/characterize/v1-inputs
 */

import { LinkPath } from '@/links/geometry';
import { Segment } from '@/links/pipeline';
import { OVER, UNDER, drawNodeFx, type Part } from '@/nodes/effects';
import { drawTitle } from '@/nodes/text';
import { drawBursts, play } from '@/fx/bursts';
import { SETTINGS, preview } from '@/core/settings';
import { clock, live } from '@/core/engine';
import { nodePalette, palette } from '@/core/colors';
import type { ComfyNode } from '@/core/types';
import { CanvasRecorder, fmt } from '../../helpers/recording-context';
import { fake } from '../../helpers/fake-app';
import { freezeTimeAndRandom } from '../../helpers/rng';

const PHI = 1.618033988749895;
const SEED = 0x5eed;
const NOW_MS = 1000;
/**
 * One v1 link phase cycle is 2π/PHI² ≈ 2.40 s, so the design's 2.4 s (§2a) repeated t=0 and its
 * 1.2 s sat at −π, where a sign-flipped phase draws the same. These phases are 0°, −60°, −135° and −285°.
 */
const TIMES = [0, 0.4, 0.9, 1.9];
/** The time of every frame in the traces with other settings. */
const RICH_TIME = 1.9;

type Draw = (ctx: CanvasRenderingContext2D) => void;

// =============================================================================
// Links
// =============================================================================

export const LINK_STYLES: Array<[style: number, slug: string, name: string]> = [
    [1, 'sacred-flow', 'Sacred Flow'],
    [2, 'crystal-stream', 'Crystal Stream'],
    [3, 'quantum-field', 'Quantum Field'],
    [4, 'cosmic-weave', 'Cosmic Weave'],
    [5, 'energy-pulse', 'Energy Pulse'],
    [6, 'dna-helix', 'DNA Helix'],
    [7, 'lava-flow', 'Lava Flow'],
    [8, 'stellar-plasma', 'Stellar Plasma'],
    [9, 'classic-flow', 'Classic Flow'],
];

interface LinkFrame {
    items: Segment[];
    phase: number;
    totalTime: number;
    direction: number;
}

export type LinkDraw = (ctx: CanvasRenderingContext2D, frame: LinkFrame) => void;

/**
 * v1 link clock at `t` seconds at speed 1 (old_link_animations.js:260-303, 2457-2459, 3186-3190).
 * Phase steps by -PHI²·delta·dir with delta already scaled by speed, wrapped by %.
 * totalTime gains delta twice per frame (drawConnections and animate()), and
 * the renderers multiply it by speed again.
 */
function linkClock(t: number, direction = 1): { phase: number; totalTime: number } {
    return { phase: -(PHI * PHI * t * direction) % (Math.PI * 2), totalTime: 2 * t };
}

/** Static mode starts at π/4 and every style/quality/density change adds 2π mod 4π (:2440-2456). */
const STATIC_POSES: Array<[label: string, phase: number]> = [
    ['9pi/4 (first static frame)', (9 * Math.PI) / 4],
    ['pi/4 (after one style change)', Math.PI / 4],
];

/**
 * The values v1 read with an empty settings file: the defaultValue of each
 * addSetting, which is DEFAULT_SETTINGS (:19-45) for every link setting.
 */
export const V1_LINK_SETTINGS: Record<string, unknown> = {
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
    '🔗 Enhanced Links.Link.Shadow.Enabled': true,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': true,
    '🔗 Enhanced Links.Thickness': 3,
    '🔗 Enhanced Links.Static.Mode': false,
    '🔗 Enhanced Links.Pause.During.Render': true,
    // Never registered in v1, so getSettingValue returned undefined and the shadow
    // math gave NaN, which canvas ignores (a centred halo). v2's `?? default` would
    // turn undefined into 5/3, so feed the NaN v1 computed.
    '🔗 Enhanced Links.Shadow.Blur': NaN,
    '🔗 Enhanced Links.Shadow.Offset': NaN,
};

/**
 * Stores `settings` for v1, which reads them through getSettingValue, and shows them in v3's snapshots as the settings
 * store would hand them over; every other setting shows its default. v3 reads no Shadow.Blur or Shadow.Offset for v1's
 * centred halo, so V1_LINK_SETTINGS' NaN shadows become the defaults there.
 */
export function storeSettings(settings: Record<string, unknown>): void {
    fake.settings = new Map(Object.entries(settings));
    for (const s of SETTINGS) preview(s.id, s.id in settings ? settings[s.id] : s.default);
}

/**
 * Other v1 options, one frame each in the links-rich traces: custom colour roles (the default
 * mode gives every role the link colour), the quality > 1 and density branches, marker effects
 * and shapes, the other native render modes and Reverse. Markers only draw in Classic Flow.
 */
const LINK_VARIANTS: Array<{ label: string; settings: Record<string, unknown>; markersOnly?: boolean }> = [
    {
        label: 'custom colours, Divine quality, Dense particles, pulse markers',
        settings: {
            '🔗 Enhanced Links.Color.Mode': 'custom',
            '🔗 Enhanced Links.Quality': 3,
            '🔗 Enhanced Links.Particle.Density': 2,
            '🔗 Enhanced Links.Marker.Effects': 'pulse',
        },
    },
    {
        label: 'rainbow star markers',
        settings: { '🔗 Enhanced Links.Marker.Effects': 'rainbow', '🔗 Enhanced Links.Marker.Shape': 'star' },
        markersOnly: true,
    },
    { label: 'straight links', settings: { '🔗 Enhanced Links.Link.Style': 'straight' } },
    { label: 'linear links', settings: { '🔗 Enhanced Links.Link.Style': 'linear' } },
    { label: 'reverse direction', settings: { '🔗 Enhanced Links.Direction': -1 } },
];

/** v1's 14 Link.Style values (:990-1015). */
const PATH_STYLES = [
    'spline', 'straight', 'linear', 'hidden', 'dotted', 'dashed', 'double',
    'stepped', 'zigzag', 'rope', 'glowpath', 'chain', 'pulse', 'holographic',
];

/** Short horizontal, long S-curve and steep backwards links, in the dark palette's colours. */
const LINKS: Array<[start: [number, number], end: [number, number], color: string]> = [
    [[100, 100], [260, 100], '#64B5F6'], // IMAGE
    [[100, 220], [760, 520], '#FF9CF9'], // LATENT
    [[420, 140], [380, 660], '#B39DDB'], // MODEL
];

const dist = (a: ArrayLike<number>, b: ArrayLike<number>) => Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
const [LEFT, RIGHT, SPLINE] = [3, 4, 2];

/**
 * v1's own path for a link (old_link_animations.js:406-586, as v2.0.1's renderers/link-renderers.ts ported it), so the
 * animations take v1's points: its spline, native's with both controls min(0.5 × length, 100) px out along x; its
 * straight line; and its three legs at right angles, a third of t each. v3 draws the other Link.Style decorations
 * along the spline. Its length is v1's, measured along 40 chords of the spline.
 */
class V1Path extends LinkPath {
    constructor(private readonly style: string, start: ArrayLike<number>, end: ArrayLike<number>) {
        super();
        const bend = Math.min(dist(start, end) * 0.5, 100);
        this.set(start, end, RIGHT, LEFT, SPLINE, [bend, 0], [-bend, 0]);
        const midX = (start[0] + end[0]) / 2;
        if (style === 'straight') this.length = dist(start, end);
        else if (style === 'linear') this.length = Math.abs(midX - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[0] - midX);
        else {
            const [point, prev] = [new Float64Array(4), new Float64Array(4)];
            this.length = 0;
            super.at(0, prev);
            for (let i = 1; i <= 40; i++) {
                super.at(i / 40, point);
                this.length += dist(prev, point);
                prev.set(point);
            }
        }
    }

    at(t: number, out: Float64Array): void {
        const [start, end] = [this.a, this.b];
        const midX = (start[0] + end[0]) / 2;
        let leg: number[];
        if (this.style === 'straight') {
            [out[0], out[1]] = [start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t];
            leg = [end[0] - start[0], end[1] - start[1]];
        } else if (this.style === 'linear') {
            if (t <= 0.33) [out[0], out[1], leg] = [start[0] + (midX - start[0]) * (t / 0.33), start[1], [midX - start[0], 0]];
            else if (t <= 0.67) [out[0], out[1], leg] = [midX, start[1] + (end[1] - start[1]) * ((t - 0.33) / 0.34), [0, end[1] - start[1]]];
            else [out[0], out[1], leg] = [midX + (end[0] - midX) * ((t - 0.67) / 0.33), end[1], [end[0] - midX, 0]];
        } else {
            super.at(t, out);
            return;
        }
        const norm = Math.hypot(leg[0], leg[1]) || 1;
        [out[2], out[3]] = [leg[0] / norm, leg[1] / norm];
    }

    draw(ctx: CanvasRenderingContext2D, color: string, thickness: number): void {
        if (this.style !== 'straight' && this.style !== 'linear') {
            super.draw(ctx, color, thickness);
            return;
        }
        const [start, end] = [this.a, this.b];
        const midX = (start[0] + end[0]) / 2;
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        if (this.style === 'linear') {
            ctx.lineTo(midX, start[1]);
            ctx.lineTo(midX, end[1]);
        }
        ctx.lineTo(end[0], end[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness * 0.8;
        ctx.stroke();
    }
}

/**
 * The queue items v1's drawConnections built, with getConnectionPos's Float32Array ends, as whole links along v1's own
 * path for the style, in the palettes of their colours. v1's own renderers read `defaultColor`, `color` and `linkId`.
 */
function linkItems(isStatic: boolean, linkStyle = 'spline'): Segment[] {
    return LINKS.map(([start, end, color], i) => {
        const segment = new Segment();
        segment.path = new V1Path(linkStyle, Float32Array.from(start), Float32Array.from(end));
        segment.len = segment.chain = segment.path.length;
        segment.pal = palette(color)!;
        Object.assign(segment, { linkStyle, isStatic, defaultColor: color, color, linkId: String(i + 1) });
        return segment;
    });
}

/** One frame per time in TIMES, each drawing all three links in one renderer call. */
export function traceLinks(title: string, draw: LinkDraw): CanvasRecorder {
    return traceFrames(title, TIMES.map((t) => {
        const clock = linkClock(t);
        return [`t=${t}s phase=${fmt(clock.phase)} totalTime=${fmt(clock.totalTime)}`, linkPass((ctx) => draw(ctx, { items: linkItems(false), ...clock, direction: 1 }))];
    }));
}

/** One frame per static pose. */
export function traceStaticLinks(title: string, draw: LinkDraw): CanvasRecorder {
    return traceFrames(title, STATIC_POSES.map(([label, phase]) => [
        `phase=${label}`,
        linkPass((ctx) => draw(ctx, { items: linkItems(true), phase, totalTime: 0, direction: 1 })),
    ]));
}

/**
 * One frame per LINK_VARIANTS entry at RICH_TIME (static: the first pose), with `base` plus the
 * variant as the stored settings. v1 gets `{}` (its registered defaults), the v2 ports V1_LINK_SETTINGS.
 */
export function traceLinkVariants(
    title: string,
    style: number,
    isStatic: boolean,
    base: Record<string, unknown>,
    draw: LinkDraw,
): CanvasRecorder {
    const variants = LINK_VARIANTS.filter(v => style === 9 || !v.markersOnly);
    return traceSettings(title, isStatic, base, variants.map(v => [v.label, v.settings]), draw);
}

/** Classic Flow at RICH_TIME once per Link.Style. */
export function tracePathStyles(title: string, base: Record<string, unknown>, draw: LinkDraw): CanvasRecorder {
    return traceSettings(title, false, base, PATH_STYLES.map(s => [`Link.Style ${s}`, { '🔗 Enhanced Links.Link.Style': s }]), draw);
}

function traceSettings(
    title: string,
    isStatic: boolean,
    base: Record<string, unknown>,
    overlays: Array<[label: string, settings: Record<string, unknown>]>,
    draw: LinkDraw,
): CanvasRecorder {
    return traceFrames(title, overlays.map(([label, overlay]) => {
        const direction = Number(overlay['🔗 Enhanced Links.Direction'] ?? 1);
        const linkStyle = String(overlay['🔗 Enhanced Links.Link.Style'] ?? 'spline');
        const clock = isStatic ? { phase: STATIC_POSES[0][1], totalTime: 0 } : linkClock(RICH_TIME, direction);
        const when = isStatic ? `phase=${STATIC_POSES[0][0]}` : `t=${RICH_TIME}s phase=${fmt(clock.phase)} totalTime=${fmt(clock.totalTime)}`;
        return [`${label}: ${when}`, linkPass((ctx) => {
            storeSettings({ ...base, ...overlay });
            draw(ctx, { items: linkItems(isStatic, linkStyle), ...clock, direction });
        })];
    }));
}

/** RenderUtils.enableAntiAliasing, applied at the start of every v1 drawConnections pass. */
function linkPass(draw: Draw): Draw {
    return (ctx) => {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.miterLimit = 2;
        draw(ctx);
    };
}

// =============================================================================
// Nodes
// =============================================================================

export interface NodeClock {
    phase: number;
    particlePhase: number;
    totalTime: number;
}

/**
 * v1 node clocks at `t` seconds on a 60 Hz display at speed and direction 1
 * (old_node_animations.js:71-127, 2953-2956): one (2π/15)·delta step per frame
 * for the effect phase and the particle phase, no wrap; State.totalTime sums
 * the unscaled deltas.
 */
function nodeClock(t: number): NodeClock {
    const rate = (2 * Math.PI) / 15;
    return { phase: rate * t, particlePhase: rate * t, totalTime: t };
}

/** The particle clock each v1 effect took, which the traces' frame headers name. */
export const V1_PARTICLE_TIME: Record<string, (clock: NodeClock) => number> = {
    gentlePulse: (c) => c.particlePhase, // :1225 ParticleController.update
    neonNexus: (c) => c.phase, // :1416 phase * particleSpeed
    cosmicRipple: (c) => c.totalTime, // :1709-1720 State.totalTime
    flowerOfLife: (c) => c.phase, // :1770 phase * particleSpeed
};

/** The settings the nodes-rich traces store over v1's defaults; each frame adds its Particle.Color.Mode. */
export const V1_NODE_RICH_SETTINGS: Record<string, unknown> = {
    '📦 Enhanced Nodes.Quality': 3,
    '📦 Enhanced Nodes.Color.Hover.Show': true,
    '📦 Enhanced Nodes.Particle.Glow': 0.5,
};

/**
 * The values v1's node extension read with an empty settings file: the defaultValue of each addSetting
 * (old_node_animations.js:209-690), DEFAULT_SETTINGS (:146-178) for most. Its effects took energy Intensity × 1.5 and
 * their bloom from Animation.Glow (:2088-2099); Glow drove the halo and the frame of its drawNodeShape. Its completion
 * effect was the fireworks.
 */
export const V1_NODE_SETTINGS: Record<string, unknown> = {
    '📦 Enhanced Nodes.Animate': 2,
    '📦 Enhanced Nodes.Animations.Enabled': true,
    '📦 Enhanced Nodes.End Animation.Enabled': false,
    '📦 Enhanced Nodes.Completion.Style': 'fireworks',
    '📦 Enhanced Nodes.Static.Mode': false,
    '📦 Enhanced Nodes.Direction': 1,
    '📦 Enhanced Nodes.Animation.Speed': 1,
    '📦 Enhanced Nodes.Quality': 1,
    '📦 Enhanced Nodes.Particle.Density': 0.5,
    '📦 Enhanced Nodes.Intensity': 1,
    '📦 Enhanced Nodes.Glow': 1,
    '📦 Enhanced Nodes.Animation.Glow': 0.5,
    '📦 Enhanced Nodes.Glow.Show': true,
    '📦 Enhanced Nodes.Color.Mode': 'custom',
    '📦 Enhanced Nodes.Color.Scheme': 'default',
    '📦 Enhanced Nodes.Color.Primary': '#ffb300',
    '📦 Enhanced Nodes.Color.Secondary': '#fb00ff',
    '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
    '📦 Enhanced Nodes.Color.Hover': '#00ff15',
    '📦 Enhanced Nodes.Color.Particle': '#ffb300',
    '📦 Enhanced Nodes.Particle.Glow': 1,
    '📦 Enhanced Nodes.Particle.Intensity': 1,
    '📦 Enhanced Nodes.Particle.Color.Mode': 'default',
    '📦 Enhanced Nodes.Particle.Size': 1,
    '📦 Enhanced Nodes.Particle.Speed': 1,
    '📦 Enhanced Nodes.Color.Hover.Show': false,
    '📦 Enhanced Nodes.Particle.Show': true,
    '📦 Enhanced Nodes.Pause.During.Render': true,
    '📦 Enhanced Nodes.Animation.Size': 1,
    '📦 Enhanced Nodes.Text.Animation.Enabled': false,
    '📦 Enhanced Nodes.Text.Color': '#00ffff',
    '📦 Enhanced Nodes.Text.Glow': 0.5,
    '📦 Enhanced Nodes.Text.Size': 14,
    '📦 Enhanced Nodes.Text.Style': 'neon',
    '📦 Enhanced Nodes.Text.Letter.Spacing': 0,
    '📦 Enhanced Nodes.Text.Position.Y': 0,
    '📦 Enhanced Nodes.Text.Position.X': 0,
    '📦 Enhanced Nodes.Text.Rotation.Radius': 0,
    '📦 Enhanced Nodes.Text.Rotation.Angle': 0,
};

const PARTICLE_COLOR_MODES = ['default', 'rainbow', 'complementary', 'energy', 'quantum', 'aurora'];

/**
 * v1's ColorManager.getParticleColor (:852-901) in its default custom colour mode, where the
 * base colour is Color.Particle (#ffb300: hue 60·179/255°, saturation 100%, lightness 50%).
 */
export function v1ParticleColor(mode = 'default'): (index: number, time: number, count: number) => string {
    return (i, t) => {
        switch (mode) {
            case 'rainbow':
                return `hsl(${(i * 30 + t * 50) % 360}, 90%, 75%)`;
            case 'complementary':
                return `hsl(${(60 * 179) / 255 + 180}, 100%, 50%)`;
            case 'energy':
                return `hsl(${(t * 100 + i * 20) % 360}, 90%, 75%)`;
            case 'quantum':
                return `hsl(${280 + ((t * 2 + i * 0.1) % 1) * 80}, 90%, ${60 + Math.sin(t * 5) * 20}%)`;
            case 'aurora':
                return `hsl(${120 + ((t * 3 + i * 0.2) % 1) * 60}, ${80 + Math.sin(t * 3) * 20}%, ${70 + Math.sin(t * 4) * 20}%)`;
            default:
                return '#ffb300';
        }
    };
}

/** Node rects drawn in turn: one per frame keeps Neon's 70-hex lattice to ~1.4k lines a frame. */
const NODE_RECTS: ComfyNode[] = [
    { id: 1, title: 'Load Image', size: [140, 46] },
    { id: 2, title: 'KSampler', size: [220, 120], selected: true },
    { id: 3, title: 'Save Image', size: [320, 260] },
    { id: 4, title: 'CLIP Text Encode', size: [400, 80], mouseOver: true },
];

/** The nodes-rich frames sit later in the 15 s node cycle, frame i with particle colour mode i. */
const RICH_NODE_TIMES = [1.5, 3.7, 6.1, 8.3, 10.9, 13.4];

interface NodeFrame {
    node: ComfyNode;
    clock: NodeClock;
    particleTime: number;
    particleColorMode: string;
}

type NodeDraw = (ctx: CanvasRenderingContext2D, frame: NodeFrame) => void;

/** The v1 node effects: [effect, trace file, name], in Animate order from 1. */
export const NODE_EFFECTS: Array<[effect: string, slug: string, name: string]> = [
    ['gentlePulse', '1-gentle-pulse', 'Gentle Pulse'],
    ['neonNexus', '2-neon-nexus', 'Neon Nexus'],
    ['cosmicRipple', '3-cosmic-ripple', 'Cosmic Ripple'],
    ['flowerOfLife', '4-flower-of-life', 'Flower of Life'],
];

/** Both sides of a node's edge at once: every element of an effect, in v1's order. */
export const WHOLE: Part = { sides: UNDER | OVER, x0: 0, y0: 0, x1: 0, y1: 0, round: -1 };

/**
 * v3's effect `style` drawn whole, as v1 drew its effects, in the Classic config: v1's settings with `settings` over
 * them and the frame's particle colour mode, at v1's clock. v3's particle time is v1's time at speed 1, of which
 * Gentle Pulse takes TURN × it, as v1's ParticleController did. The traces are of v1's effects alone, so the frame
 * v1's drawNodeShape drew round them (Selection.Glow) is off.
 */
export function v3NodeEffect(style: number, settings: Record<string, unknown> = {}, only = false): NodeDraw {
    return (ctx, { node, clock, particleColorMode }) => {
        storeSettings({ ...V1_NODE_SETTINGS, ...settings, '📦 Enhanced Nodes.Particle.Color.Mode': particleColorMode, '📦 Enhanced Nodes.Selection.Glow': false });
        drawNodeFx(ctx, style, node, node.size[0], node.size[1], { nodePhase: clock.phase, particleTime: clock.totalTime, nodeTime: clock.totalTime }, WHOLE, 1, only);
    };
}

/**
 * v3's title in Text.Style `style`, in the Classic config, where v1's drawNodeShape drew its own (old_node_animations.js:
 * 2116-2121): centred 16 px into the node, here left-aligned from where that text begins.
 */
export function v3Title(style: string): NodeDraw {
    return (ctx, { node, clock: v1 }) => {
        storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Text.Style': style });
        ctx.font = `14px ${LiteGraph.NODE_FONT}`;
        const width = ctx.measureText(node.title).width;
        drawTitle(ctx, { text: node.title, width }, node.size[0] / 2 - width / 2, 16, nodePalette(2).title, v1.phase, 1);
    };
}

/** The view v1's fireworks trace drew on: a 1600 × 900 canvas at zoom 1, and a node at its origin, as v1's drawNodeShape drew them in the node's space. */
function fireworksView(): { canvas: Parameters<typeof drawBursts>[0]; node: Parameters<typeof play>[1][number] } {
    const graph = {};
    return {
        canvas: { visible_area: new Float32Array([0, 0, 1600, 900]), ds: { scale: 1 }, graph } as unknown as Parameters<typeof drawBursts>[0],
        node: { id: 1, pos: [0, 0], graph } as unknown as Parameters<typeof play>[1][number],
    };
}

/** v1's completionPhase frames (old_node_animations.js:2921-2923), on clock.burstTime: 0.014 a frame at 60 Hz, 0.84 a second. */
export const FIREWORK_PHASES = [0.15, 0.5, 0.9];

/** The time on the burst clock, which starts at 0 with each show, at which a show has got exactly to v1's `phase`. */
function showTime(phase: number): number {
    const time = phase / 0.84;
    const ulp = Number.EPSILON * time;
    return [0, 1, -1, 2, -2].map((n) => time + n * ulp).find((t) => t * 0.84 === phase) ?? time;
}

/** v3's fireworks in the Classic config, a show over fireworksView()'s node, drawn at each of FIREWORK_PHASES. */
export function traceFireworks(title: string): CanvasRecorder {
    storeSettings(V1_NODE_SETTINGS);
    const { canvas, node } = fireworksView();
    // Past the end of any show before.
    clock.burstTime += 1000;
    play('fireworks', [node], 'run');
    const rec = traceFrames(title, FIREWORK_PHASES.map((phase) => [`completionPhase=${phase}`, (ctx) => {
        clock.burstTime = showTime(phase);
        drawBursts(canvas, ctx);
    }]));
    // The show is over, though its particles stay in the pool until the next.
    clock.burstTime = 1 / 0.84;
    live.bursts = 0;
    return rec;
}

/**
 * Frame i draws NODE_RECTS[i] at TIMES[i] (rich: RICH_NODE_TIMES[i] with particle colour mode i)
 * with the state v1's drawNodeShape handed to each effect: shadows cleared after the body (:2081-2085).
 */
export function traceNodes(
    title: string,
    particleTime: (clock: NodeClock) => number,
    draw: NodeDraw,
    rich = false,
): CanvasRecorder {
    const times = rich ? RICH_NODE_TIMES : TIMES;
    return traceFrames(title, times.map((t, i) => {
        const node = NODE_RECTS[i % NODE_RECTS.length];
        const clock = nodeClock(t);
        const pt = particleTime(clock);
        const particleColorMode = rich ? PARTICLE_COLOR_MODES[i] : 'default';
        const state = node.selected ? ' selected' : node.mouseOver ? ' hover' : '';
        const mode = rich ? ` particles=${particleColorMode}` : '';
        return [`t=${t}s phase=${fmt(clock.phase)} particleTime=${fmt(pt)} node=${node.size[0]}x${node.size[1]}${state}${mode}`, (ctx) => {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            draw(ctx, { node, clock, particleTime: pt, particleColorMode });
        }];
    }));
}

// =============================================================================
// Frames
// =============================================================================

/** Each frame runs between save() and restore() on a frozen clock and a reseeded Math.random. */
export function traceFrames(title: string, frames: Array<[header: string, draw: Draw]>): CanvasRecorder {
    const rec = new CanvasRecorder();
    rec.note(title);
    for (const [header, draw] of frames) {
        freezeTimeAndRandom(NOW_MS, SEED);
        rec.note(header);
        const before = rec.counts();
        rec.ctx.save();
        draw(rec.ctx);
        rec.ctx.restore();
        rec.assertBalanced();
        const after = rec.counts();
        rec.note(
            `gradients=${after.gradients - before.gradients} shadowBlurSets=${after.shadowBlurSets - before.shadowBlurSets} ` +
            `path2d=${after.path2d - before.path2d}`,
        );
    }
    return rec;
}
