/**
 * Where v3 draws differently from v1 on purpose, each with why and a proof that
 * v3 draws what it says (characterize/deviations.test.ts runs them). The Level
 * A test (characterize/links.test.ts) lets a v1 trace frame differ only where
 * a deviation here names it: `frames` is tested against `<file>: <header>`, and
 * `mask`, run over the canonical lines of v1's frame and v3's alike, hides what
 * the deviation changes and only that, so that the rest of the frame must still
 * match. A deviation the traces cannot show names no frames and has no mask. The node effects' deviations follow the
 * links' (characterize/nodes.test.ts).
 *
 * @module tests/unit/v1-deviations
 */

import { expect, vi } from 'vitest';
import { STILL_PHASE, TURN, clock, dummy, env, live } from '@/core/engine';
import { HIGHLIGHT, nodePalette, palette, particleColour, rainbow } from '@/core/colors';
import { L, preview } from '@/core/settings';
import { MOVING, wrap } from '@/links/animations';
import { Segment } from '@/links/pipeline';
import { STILL } from '@/links/stills';
import { drawBase, drawMarkers } from '@/links/styles';
import { OVER, UNDER, drawNodeFx, type Part } from '@/nodes/effects';
import { drawTitle } from '@/nodes/text';
import { pool } from '@/fx/particles';
import { RED, drawFlows, stepInto } from '@/fx/execution';
import { drawBursts, endBursts, play, type Anchor, type Style } from '@/fx/bursts';
import { fake } from '../helpers/fake-app';
import { CanvasRecorder, fmt, parseColor } from '../helpers/recording-context';
import { canonical } from '../helpers/canonical';
import { frames, offscreens, progress, queue, run, send, start, type FakeCanvas, type GraphSpec } from '../helpers/fake-litegraph';
import { HAVE_V1, drawV1Effect, setupV1 } from './characterize/v1-code';
import {
    FIREWORK_PHASES, NODE_EFFECTS, V1_LINK_SETTINGS, V1_NODE_RICH_SETTINGS, V1_NODE_SETTINGS, V1_PARTICLE_TIME, WHOLE,
    storeSettings, traceFireworks, traceFrames, traceNodes, v3NodeEffect,
} from './characterize/v1-inputs';

export interface Deviation {
    title: string;
    why: string;
    frames?: RegExp;
    mask?: (lines: string[]) => string[];
    proof: () => void | Promise<void>;
}

const [UP, DOWN, LEFT, RIGHT, SPLINE] = [1, 2, 3, 4, 2];
/** The clocks the link animations and the node effects are drawn at. */
type Moment = Parameters<(typeof MOVING)[number]>[2];
type NodeMoment = Parameters<typeof drawNodeFx>[5];
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
const SHADOW = /shadow=(?:none|(?:rgba\([^)]*\)|#[\da-f]+)\/\S+)/;
/** A stroke of a whole link: one spline, or v1's straight line or three legs. */
const WHOLE_LINK = /^stroke \[\] moveTo\([^)]*\) (?:bezierCurveTo\([^)]*\)|lineTo\([^)]*\)(?: lineTo\([^)]*\)){0,2}) style=/;

/** A mask that runs `f` over each line of a frame, and drops the lines it maps to ''. */
const each = (f: (line: string) => string) => (lines: string[]) => lines.map(f).filter((line) => line !== '');

/**
 * A Sacred Rosette frame as the circles it strokes, whatever strokes them together: each stroke's circles one a line
 * with its paint, sorted, after the rest, which loses the chords and the hexagon; and its dots without their glows,
 * which v1 cast and v3 stamps from sprites.
 */
const ROSETTE = (lines: string[]) => {
    const rest: string[] = [];
    const circles: string[] = [];
    for (const line of lines) {
        // The glows its dots cast together, off the canvas.
        if (line.startsWith('drawImage ') || line.startsWith('fill [] moveTo(')) continue;
        if (!line.startsWith('stroke ')) {
            rest.push(line.startsWith('fill [] arc(') && !line.includes('style=radial') ? line.replace(/ shadow=\S+$/, ' shadow=*') : line);
            continue;
        }
        const paint = line.slice(line.indexOf(' style='));
        for (const arc of line.match(/arc\([^)]*\)/g) ?? []) circles.push(`stroke ${arc}${paint}`);
    }
    return [...rest, ...circles.sort()];
};

/** The calls that put a path's points somewhere. */
const POINTS = /\b(moveTo|lineTo|bezierCurveTo|quadraticCurveTo)\([^)]*\)/g;

/**
 * A canonical line without where it paints: the points of what it draws in graph space, the centres of its arcs and
 * ellipses and the turn of an ellipse, where its transforms move and turn it, and the ends of its gradients; a run of
 * lines to points becomes one. What it paints stays: the sizes of its shapes, as radii and as the points it draws
 * about a transform's origin, its widths, colours, alphas and shadows, and the order of its paints.
 */
function unplaced(line: string): string {
    return line
        .replace(/\[([^\]]*)\]((?: \w+\([^)]*\))*)/g, (_, transform: string, calls: string) => (transform
            ? `[${transform.replace(/\b(translate|rotate)\([^)]*\)/g, '$1(*)')}]${calls}`
            : `[]${calls.replace(POINTS, '$1(*)').replace(/\barc\((?!\*)[^,]+, [^,]+, /g, 'arc(*, ').replace(/\bellipse\((?!\*)[^,]+, [^,]+, ([^,]+), ([^,]+), [^,]+, /g, 'ellipse(*, $1, $2, *, ').replace(/( lineTo\(\*\))+/g, ' lineTo(*)')}`))
        .replace(/\blinear\([^)]*\)/g, 'linear(*)')
        .replace(/\bradial\((?!\*)[^,]+, [^,]+, ([^,]+), [^,]+, [^,]+, ([^)]+)\)/g, 'radial(*, $1, $2)');
}

/** The mask of a deviation that moves what is drawn, and only that: unplaced() on each line. */
const WHERE = each(unplaced);

/** A frame's lines without a repeat of the line before. */
const once = (lines: string[]) => lines.filter((line, i) => line !== lines[i - 1]);

/**
 * Dotted's body as one line: v1's, a fill for each dot, thickness × 0.4 round and thickness × 3 apart; v3's, one stroke
 * dashed into dots by round caps, its width the dots' and its gaps their spacing. Where a march has got to does not show.
 */
const dots = (line: string) => line
    .replace(/^fill \[\] arc\(\*, ([\d.]+), 0, 6\.28\) (style=(?:#[\da-f]+|rgba\([^)]*\))) /, (_, r: string, style: string) => `dots(${r} every ${fmt(Number(r) * 7.5)}) ${style} `)
    .replace(/^stroke \[\] moveTo\(\*\) lineTo\(\*\) (style=\S+(?: [^ =]+)*) width=([\d.]+) cap=round join=round dash=\[0, ([\d.]+)\] offset=\S+ /, (_, style: string, width: string, gap: string) => `dots(${fmt(Number(width) / 2)} every ${gap}) ${style} `);

/** Link.Style's decorations, which v1 drew along a straight line: unplaced on a path of any shape, and each kind of decoration once, as how many there are follows the path's length. */
const DECORATED = (lines: string[]) => once(WHERE(lines).map((line) => dots(line.replace(/\bbezierCurveTo\(\*\)/g, 'lineTo(*)'))));

/** A whole link from a to b along native's path (a spline unless the directions make it a line), in `colour`'s palette. */
function wire(a: [number, number], b: [number, number], colour = '#64b5f6', [startDir, endDir] = [RIGHT, LEFT]): Segment {
    const s = new Segment();
    s.path.set(a, b, startDir, endDir, SPLINE);
    s.len = s.chain = s.path.length;
    s.pal = palette(colour)!;
    s.linkStyle = L.linkStyle;
    return s;
}

const moment = (linkPhase: number, linkFlow: number): Moment => ({ linkPhase, quantumPhase: linkPhase, linkFlow, linkDir: 1 });

function draw(paint: (ctx: CanvasRenderingContext2D) => void): CanvasRecorder {
    const rec = new CanvasRecorder();
    paint(rec.ctx);
    return rec;
}

/** The points a trace's calls name: each moveTo, lineTo and arc centre, as numbers. */
function points(rec: CanvasRecorder, names = ['moveTo', 'lineTo', 'arc']): [number, number][] {
    return rec.lines.flatMap((line) => {
        const call = /^(\w+)\(([^,]+), ([^,)]+)/.exec(line);
        return call && names.includes(call[1]) ? [[Number(call[2]), Number(call[3])] as [number, number]] : [];
    });
}

/** How far a point is from a segment's path: the nearest of its points 1 px apart, then 0.01 px apart around that one. */
function off(s: Segment, [x, y]: [number, number]): number {
    const at = new Float64Array(4);
    const from = (d: number) => {
        s.path.find(d, at);
        return Math.hypot(at[0] - x, at[1] - y);
    };
    let nearest = 0;
    for (let d = 0; d <= s.path.length; d++) if (from(d) < from(nearest)) nearest = d;
    let best = Infinity;
    for (let d = nearest - 1; d <= nearest + 1; d += 0.01) best = Math.min(best, from(d));
    return best;
}

/** The points of each path a trace strokes, from its moveTo and lineTo calls. */
function strokes(rec: CanvasRecorder): [number, number][][] {
    const out: [number, number][][] = [];
    let path: [number, number][] = [];
    for (const line of rec.lines) {
        const call = /^(?:moveTo|lineTo)\(([^,]+), ([^)]+)\)$/.exec(line);
        if (line === 'beginPath()') path = [];
        else if (line === 'stroke()') out.push(path);
        else if (call) path.push([Number(call[1]), Number(call[2])]);
    }
    return out;
}

/** Where the y offset of a stroke along y = 100 first crosses zero going up, past x = from. */
function crossing(stroke: [number, number][], from: number): number {
    for (let i = 1; i < stroke.length; i++) {
        const [[x0, y0], [x1, y1]] = [stroke[i - 1], stroke[i]];
        if (x0 >= from && y0 - 100 < 0 && y1 - 100 >= 0) return x0 + ((x1 - x0) * (100 - y0)) / (y1 - y0);
    }
    return NaN;
}

/** Relative luminance of a canvas colour. */
function luminance(colour: string): number {
    const [r, g, b] = parseColor(colour)!.map((c) => c / 255);
    const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * How many times a sampled signal swings from rising to falling or back by a tenth of its peak or more, which is what
 * WCAG 2.3.1 counts as half a flash; smaller wobbles, such as a trace's rounding, are none.
 */
function swings(values: number[]): number {
    const least = 0.1 * Math.max(...values);
    let count = 0;
    let way = 0;
    let extreme = values[0];
    for (const value of values) {
        if ((value - extreme) * way > 0 || (!way && Math.abs(value - extreme) < least)) {
            if (way) extreme = value;
            continue;
        }
        if (Math.abs(value - extreme) < least) continue;
        if (way) count++;
        way = Math.sign(value - extreme);
        extreme = value;
    }
    return count;
}

/** How many times a sampled signal turns from rising to falling or back, across samples that hold it level. */
function turns(values: number[]): number {
    let count = 0;
    let was = 0;
    for (let i = 1; i < values.length; i++) {
        const step = values[i] - values[i - 1];
        if (!step) continue;
        if (step * was < 0) count++;
        was = step;
    }
    return count;
}

const PAIR: GraphSpec = { nodes: [{ pos: [100, 200] }, { pos: [600, 200] }], links: [{ from: 0, to: 1 }] };

/** How far beside the path a decoration draws at Thickness 3, in Classic Flow's halo 1.2 × as wide: Double's rails, Holographic's scanline ends. */
const BESIDE: Record<string, number> = { double: 0.8 * 3 * 1.2, holographic: 3 * 1.2 };

/** A 220 × 120 node, as the traces' KSampler, which the node deviations draw on. */
const NODE = { id: 2, title: 'KSampler', size: [220, 120] as [number, number] };
/** A moment of the node clock, none of v1's still poses. */
const NOW: NodeMoment = { nodePhase: 1.3, particleTime: 2.1, nodeTime: 2.1 };

/** v3's node effect `style` on `node`, at `k`, in v1's settings with `settings` over them: whole, or the part `part` names. */
function nodeFx(style: number, settings: Record<string, unknown> = {}, { node = NODE as typeof NODE & { selected?: boolean; mouseOver?: boolean }, k = NOW, part = WHOLE, only = false, alpha = 1 } = {}): CanvasRecorder {
    storeSettings({ ...V1_NODE_SETTINGS, ...settings });
    return draw((ctx) => drawNodeFx(ctx, style, node, node.size[0], node.size[1], k, part, alpha, only));
}

/** The side `sides` of a KSampler's shape, title bar included, with ROUND_RADIUS corners. */
const side = (sides: number): Part => ({ sides, x0: 0, y0: -30, x1: 220, y1: 120, round: 8 });

/** The centres and radii of the arcs a trace draws. */
const arcs = (rec: CanvasRecorder) => rec.lines.flatMap((line) => {
    const call = /^arc\(([^,]+), ([^,]+), ([^,]+),/.exec(line);
    return call ? [[Number(call[1]), Number(call[2]), Number(call[3])]] : [];
});

/** A Level A frame's lines, by its header. */
function byFrame(trace: string): Map<string, string[]> {
    const out = new Map<string, string[]>();
    let lines: string[] = [];
    for (const line of canonical(trace).split('\n')) {
        if (line.startsWith('# ')) out.set(line, (lines = []));
        else if (line) lines.push(line);
    }
    return out;
}

/** Gentle Pulse's fireflies in a canonical line: fills of arcs off its centre, with their sizes hidden. */
const unsized = (line: string) => (line.startsWith('fill ') && !line.includes('arc(0, 0, ')
    ? line.replace(/arc\(([^,]+), ([^,]+), [^,]+, /, 'arc($1, $2, *, ').replace(/radial\(([^,]+), ([^,]+), 0, ([^,]+), ([^,]+), [^)]+\)/, 'radial($1, $2, 0, $3, $4, *)')
    : line);

/** v1's own node extension (v1-code.ts), set up once for these proofs. */
let v1Nodes: Promise<Record<string, any>> | undefined;
const ownNodes = () => (v1Nodes ??= setupV1().then(({ nodes }) => nodes));

/** v1's own drawing of an effect on the Level A inputs (rich: V1_NODE_RICH_SETTINGS), given all its settings as stored values. */
async function own(effect: string, rich = false): Promise<string> {
    const nodes = await ownNodes();
    return traceNodes('', V1_PARTICLE_TIME[effect], (ctx, { node, clock, particleColorMode }) => {
        fake.settings = new Map(Object.entries({ ...V1_NODE_SETTINGS, ...(rich ? V1_NODE_RICH_SETTINGS : {}), '📦 Enhanced Nodes.Particle.Color.Mode': particleColorMode }));
        drawV1Effect(nodes, effect, ctx, node, clock);
    }, rich).trace();
}

/** v3's drawing of effect `style` on the Level A inputs. */
const ours = (style: number, rich = false) => traceNodes('', V1_PARTICLE_TIME[NODE_EFFECTS[style - 1][0]], v3NodeEffect(style, rich ? V1_NODE_RICH_SETTINGS : {}), rich).trace();

/** Expects two Level A traces to draw the same frames, once `mask` hides in each line of a frame what it should. */
function sameFrames(v1: string, v3: string, mask: (line: string, header: string) => string): void {
    const [a, b] = [byFrame(v1), byFrame(v3)];
    expect([...b.keys()]).toEqual([...a.keys()]);
    for (const [header, lines] of a) {
        const hide = (frame: string[]) => frame.map((line) => mask(line, header)).filter((line) => line !== '');
        expect(hide(b.get(header)!), header).toEqual(hide(lines));
    }
}

/** A canonical title line, its text measured as the recorder does, half its size a character: left-aligned at its left edge, in no font family. */
function leftAligned(line: string): string {
    const text = /^fillText "(.*)", ([-\d.]+), ([-\d.]+) (.*) font=([\d.]+)px \S+ align=(\w+) (.*)$/.exec(line);
    if (!text) return line;
    const [, words, x, y, paint, size, align, rest] = text;
    const left = align === 'center' ? Number(x) - (Number(size) / 4) * [...words].length : Number(x);
    return `fillText "${words}", ${fmt(left)}, ${y} ${paint} font=${size}px align=left ${rest}`;
}

/** A canonical fill of a firework's core: a disc filled with a gradient out to its rim, which v3 leaves out once it has faded. */
const CORE = /^fill \[\] arc\(([^,]+), ([^,]+), ([^,]+), 0, 6\.28\) style=radial\(\1, \2, 0, \1, \2, \3\)/;
/** A canonical paint whose every colour is transparent. */
const unseen = (line: string) => !/#[\da-f]{6}/.test(line) && [...line.matchAll(/rgba\(\d+, \d+, \d+, ([\d.]+)\)/g)].every((m) => Number(m[1]) === 0);

/** The texts a trace fills, with where. */
const filled = (rec: CanvasRecorder) => rec.lines.filter((line) => line.startsWith('fillText('));

/** A KSampler with an output node's class beside a plain node and another output node, for the fireworks, which play over still links. */
const FIREWORKS = { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Completion.Style': 'fireworks' };
const RUN: GraphSpec = { nodes: [{ pos: [300, 400], output: true }, { pos: [900, 400], output: true }, { pos: [600, 700] }] };

/** The cores of the fireworks a front pass drew, by the centre and radius their gradient was made at, on screen. */
function cores(canvas: FakeCanvas, from = 0): [number, number, number][] {
    return canvas.front.lines.slice(from).flatMap((line) => {
        const made = /^grad\d+ = createRadialGradient\(([^,]+), ([^,]+), 0, ([^,]+), ([^,]+), ([^)]+)\)$/.exec(line);
        return made && made[1] === made[3] && made[2] === made[4] && Number(made[5]) > 30 ? [[Number(made[1]), Number(made[2]), Number(made[5])] as [number, number, number]] : [];
    });
}

export const DEVIATIONS: Deviation[] = [
    {
        title: 'Classic Flow and its markers sit on a centred halo as soft as their glow',
        why: "v1 read Shadow.Blur and Shadow.Offset without registering them, so its shadow maths gave NaN, which the canvas ignores: a centred halo that kept whatever blur the paint before it left, the glow almost always, but nothing for a frame's first link. Shadow.Style 'halo' draws that halo on purpose, as soft as Glow.Intensity under links and Marker.Glow under markers.",
        frames: /9-classic-flow|path-styles/,
        // The halo's shadow; and the first link's halo, drawn before any paint set a blur, in v1 cast none.
        mask(lines) {
            const lit = lines.findIndex((line) => / shadow=(?!none)/.test(line));
            return lines.map((line, i) => (i < lit ? line.replace(' shadow=none', ' shadow=*') : line).replace(/ shadow=rgba\(0, 0, 0, 0\.95\)\/\S+/, ' shadow=*'));
        },
        proof() {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Glow.Intensity': 7, '🔗 Enhanced Links.Marker.Glow': 13 });
            const rec = draw((ctx) => {
                for (const s of [wire([100, 100], [400, 100]), wire([100, 300], [400, 500])]) {
                    drawBase(ctx, s, 9, false);
                    drawMarkers(ctx, s, 0, 0);
                }
            });
            const halos = rec.paints.filter((p) => p.style === 'rgba(0, 0, 0, 0.95)').map((p) => [p.op, p.shadowColor, p.shadowBlur, p.shadowOffsetX, p.shadowOffsetY]);
            const [link, marker] = [['stroke', 'rgba(0, 0, 0, 0.95)', 7, 0, 0], ['fill', 'rgba(0, 0, 0, 0.95)', 13, 0, 0]];
            expect(halos).toEqual([link, marker, marker, link, marker, marker]);
        },
    },
    {
        title: "Classic Flow's arrows point along the path, the way the markers flow",
        why: 'v1 aimed each arrow at the point 0.01 further along t, which turns it off the curve, points it backwards near the input, and points every arrow toward the input even while the markers flow to the output. v3 takes the tangent at the marker, turned round going Reverse.',
        frames: /9-classic-flow|path-styles/,
        mask: each((line) => line.replace(/rotate\([^)]*\)/g, 'rotate(*)')),
        proof() {
            const s = wire([100, 100], [500, 300]);
            const at = new Float64Array(4);
            for (const direction of [1, -1]) {
                storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Direction': direction, '🔗 Enhanced Links.Marker.Size': 5 });
                const rec = draw((ctx) => drawMarkers(ctx, s, 0, 0.7));
                const angles = rec.lines.filter((line) => line.startsWith('rotate(')).map((line) => line.slice(7, -1));
                const count = Math.floor(3 * 1 * 5 * 0.5 * 0.5);
                const want = Array.from({ length: count }, (_, i) => {
                    s.path.at((i / count + 0.07) % 1, at);
                    return fmt(Math.atan2(at[3], at[2]) + (direction < 0 ? Math.PI : 0));
                });
                // Each arrow twice: its shadow, then itself.
                expect(angles, `direction ${direction}`).toEqual(want.flatMap((a) => [a, a]));
            }
        },
    },
    {
        title: 'Bases glow in their own colour',
        why: "v1 drew the 30 % ghost under Crystal Stream, Quantum Field, Energy Pulse and still Stellar Plasma, and Crystal Stream's still link, without setting a glow, so each took the glow of what the link before it drew: none for the first link, another link's colour for the rest. Each base now glows in its own colour at Glow.Intensity, as Sacred Flow's still link always did.",
        frames: /^links-.*\/[235]-|static\/8-/,
        mask: each((line) => (WHOLE_LINK.test(line) ? line.replace(SHADOW, 'shadow=*') : line)),
        proof() {
            storeSettings(V1_LINK_SETTINGS);
            for (const [animate, still] of [[2, false], [3, false], [5, false], [2, true], [3, true], [5, true], [8, true]] as const) {
                const rec = draw((ctx) => {
                    // What the link before it left.
                    ctx.shadowColor = '#123456';
                    ctx.shadowBlur = 20;
                    drawBase(ctx, wire([100, 100], [400, 200], '#ff9cf9'), animate, still);
                });
                expect(rec.paints.map((p) => [p.shadowColor, p.shadowBlur]), `${animate}${still ? ' still' : ''}`).toEqual([['#ff9cf9', 10]]);
            }
        },
    },
    {
        title: 'Reverse plays the motion backwards',
        why: "v1 ran its time forward in both directions and mirrored where elements were (t becomes 1 − t), so changing Direction made them jump, and what its time drove besides (crystal sizes and spin, the braid's axis, ember flicker) ran on forward. The flow is signed and turns round smoothly, so going Reverse is the same motion played backwards, from the same places. What Direction orients besides turns round at once, halfway through: Energy Pulse's orb sizes, Stellar Plasma's colour halves, Lava Flow's gradient and the arrows.",
        frames: /links-rich\/animated\/[124-8]-.*: # reverse direction/,
        // Where it is all drawn, and what the time drives besides: the crystals' sizes, drawn about their centres, and the embers' flicker, Lava Flow's fills that glow 1.5 × Glow.Intensity.
        mask: (lines) => WHERE(lines).map((line) => line
            .replace(/^(stroke \[translate\(\*\) rotate\(\*\)\]).* closePath\(\) style=/, '$1 heptagon(*) style=')
            .replace(/^(fill \[\] arc\(\*, )[^,]+(.* )alpha=\S+( shadow=\S+\/15\/0\/0)$/, '$1*$2alpha=*$3')),
        proof() {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Color.Mode': 'custom' });
            const s = wire([100, 100], [500, 300]);
            // What is drawn where, without how: no styles or sizes.
            const where = (trace: string) => canonical(trace).split('\n').map((line) => line.replace(/ style=.*$/, '').replace(/arc\(([^,]+), ([^,]+), [^)]*\)/g, 'arc($1, $2)'));
            for (let style = 1; style <= 8; style++) {
                const [forward, reverse] = [1, -1].map((direction) => {
                    preview('🔗 Enhanced Links.Direction', direction);
                    return draw((ctx) => MOVING[style](ctx, s, moment(-1.3, 0.83))).trace();
                });
                expect(where(reverse), `style ${style}`).toEqual(where(forward));
            }
        },
    },
    {
        title: "Sacred Flow's ribbon follows the curve",
        why: 'v1 drew the ribbon through floor(3 × Quality × Particle.Density) + 1 points, which at its defaults is a straight line between two points off the curve. v3 draws it through a point every 8 px, at least 12.',
        frames: /animated\/1-sacred-flow/,
        mask: WHERE,
        proof() {
            storeSettings(V1_LINK_SETTINGS);
            const s = wire([100, 100], [500, 300]);
            const [ribbon] = strokes(draw((ctx) => MOVING[1](ctx, s, moment(-2, 1.4))));
            expect(ribbon).toHaveLength(Math.max(12, Math.round(s.chain / 8)) + 1);
            // Each vertex the curve's point at its fraction t, which v1's flow field moves 5 × sin(πt − phase) out along
            // (sin, cos)(3πt − phase), at a quarter of the flow.
            const at = new Float64Array(4);
            const phase = 1.4 * 0.25;
            ribbon.forEach((point, j) => {
                const t = j / (ribbon.length - 1);
                const swell = 10 * Math.sin(t * Math.PI - phase) * 0.5;
                s.path.at(t, at);
                expect(point, `vertex ${j}`).toEqual([Number(fmt(at[0] + Math.sin(t * Math.PI * 3 - phase) * swell)), Number(fmt(at[1] + Math.cos(t * Math.PI * 3 - phase) * swell))]);
            });
        },
    },
    {
        title: "Sacred Flow's wobble travels downstream",
        why: "v1's flow field took sin(3πt + time), a wave that travels upstream, against its beads. v3 turns it round: sin(3πt − flow).",
        frames: /animated\/1-sacred-flow/,
        mask: WHERE,
        proof() {
            storeSettings(V1_LINK_SETTINGS);
            const s = wire([100, 100], [900, 100]);
            const at = (flow: number) => crossing(strokes(draw((ctx) => MOVING[1](ctx, s, moment(0, flow))))[0], 300);
            expect(at(0.2)).toBeGreaterThan(at(0));
            // So does the swell that carries it: where along the link the ribbon swings farthest off the curve.
            const point = new Float64Array(4);
            const swell = (flow: number) => {
                const [ribbon] = strokes(draw((ctx) => MOVING[1](ctx, s, moment(0, flow))));
                const swing = ribbon.map(([x, y], j) => {
                    s.path.at(j / (ribbon.length - 1), point);
                    return Math.hypot(x - point[0], y - point[1]);
                });
                return swing.indexOf(Math.max(...swing)) / (ribbon.length - 1);
            };
            expect(swell(0)).toBeCloseTo(0.5, 1);
            expect(swell(2)).toBeGreaterThan(swell(0) + 0.1);
        },
    },
    {
        title: 'Cosmic Weave, DNA Helix and Stellar Plasma follow the link',
        why: "v1 took their points from the spline drawn from the link's input back to its output, a different curve that overshoots both slots by about 10 px: Cosmic Weave always, DNA Helix and Stellar Plasma going Forward. v3 takes them on the link's own path, counted from the input as v1 counted them.",
        frames: /animated\/[468]-|static\/4-cosmic/,
        mask: WHERE,
        proof() {
            storeSettings(V1_LINK_SETTINGS);
            const s = wire([100, 100], [260, 100]);
            for (const [style, reach] of [[4, 10], [6, 10], [8, 15]]) {
                for (const point of points(draw((ctx) => MOVING[style](ctx, s, moment(-1, 0.6))))) expect(off(s, point), `style ${style}`).toBeLessThanOrEqual(reach + 0.01);
            }
            for (const point of points(draw((ctx) => STILL[4](ctx, s, STILL_PHASE)))) expect(off(s, point), 'still style 4').toBeLessThanOrEqual(10.01);
            // DNA Helix's rungs cross the path at their middles.
            const rec = draw((ctx) => MOVING[6](ctx, s, moment(-1, 0.6)));
            const rungs = points(rec, ['moveTo', 'lineTo']).slice(-32);
            for (let i = 0; i < rungs.length; i += 2) expect(off(s, [(rungs[i][0] + rungs[i + 1][0]) / 2, (rungs[i][1] + rungs[i + 1][1]) / 2])).toBeLessThan(0.01);
            // Each point where v1 moved it off the link's point t along it, counted from the input: Cosmic Weave's strands
            // 10 × sin(6πt + their phase) along their turning axis, moving and at the still pose; DNA Helix's strands 10 px out
            // at 8πt + the flow; Stellar Plasma's beads and sparks 15 × sin(4πt + the flow) down the screen.
            const at = new Float64Array(4);
            const on = (T: number, dx: number, dy: number) => {
                s.path.at(T, at);
                return [Number(fmt(at[0] + dx)), Number(fmt(at[1] + dy))];
            };
            const flow = 0.6;
            const along = (paths: [number, number][][], place: (k: number, T: number) => number[]) => paths.forEach((path, k) => {
                path.forEach((point, j) => expect(point, `path ${k}, point ${j}`).toEqual(place(k, j / (path.length - 1))));
            });
            const weave = (phase: number) => (k: number, T: number) => {
                const strand = phase + (k * 2 * Math.PI) / 3;
                const across = Math.sin((1 - T) * Math.PI * 6 + strand) * 10;
                return on(T, across * Math.cos(strand), across * Math.sin(strand));
            };
            along(strokes(draw((ctx) => MOVING[4](ctx, s, moment(-1, flow)))), weave(flow));
            along(strokes(draw((ctx) => STILL[4](ctx, s, STILL_PHASE))), weave(STILL_PHASE));
            along(strokes(draw((ctx) => MOVING[6](ctx, s, moment(-1, flow)))).slice(0, 2), (k, T) => {
                const angle = (1 - T) * Math.PI * 8 + flow;
                return on(T, (k ? -10 : 10) * Math.cos(angle), (k ? -10 : 10) * Math.sin(angle));
            });
            // A bead every 20 px at Particle.Density 0.5, and a spark at every third.
            const segments = Math.floor(s.chain / 20) * 0.5;
            const plasma = Array.from({ length: segments + 1 }, (_, i) => {
                const t = i / segments;
                const spark = wrap(t - flow * 0.5);
                const bead = on(1 - t, 0, Math.sin(t * Math.PI * 4 + flow) * 15);
                return i % 3 ? [bead] : [bead, on(1 - spark, 0, Math.sin(spark * Math.PI * 4 + flow) * 15)];
            }).flat();
            expect(points(draw((ctx) => MOVING[8](ctx, s, moment(-1, flow))), ['arc'])).toEqual(plasma);
        },
    },
    {
        title: "Stellar Plasma's sparks stream along the link",
        why: 'v1 put its sparks at (i / n + 0.5 × time × speed) % 1 with a negative time, which the clamp after it pinned at 0 within a second: every spark sat in one bobbing glow at the input. v3 wraps them round, so they stream toward the input going Forward, the way the plasma flows.',
        frames: /animated\/8-stellar/,
        mask: each((line) => (/^fill .* shadow=\S+\/5\/0\/0$/.test(line) ? line.replace(/ alpha=\S+/, ' alpha=*') : line)),
        proof() {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Color.Mode': 'custom' });
            const s = wire([100, 100], [700, 100]);
            const sparks = (flow: number) => {
                const rec = draw((ctx) => MOVING[8](ctx, s, moment(0, flow)));
                return rec.paints.filter((p) => p.style === '#9d00ff').map((p) => (p.box![0] + p.box![2]) / 2);
            };
            for (const flow of [3.3, 7.7, 20.1]) {
                const [now, next] = [sparks(flow), sparks(flow + 0.01)];
                expect(Math.max(...now) - Math.min(...now), `flow ${flow}`).toBeGreaterThan(300);
                // Toward the input, x 700, but where a spark wraps round to the output.
                expect(now.filter((x, i) => next[i] > x).length, `flow ${flow}`).toBeGreaterThanOrEqual(now.length - 1);
            }
        },
    },
    {
        title: "Lava Flow's ripples run downstream, across the path",
        why: "v1's turbulence was sin(3πt + time), which travels upstream, and moved points straight down the screen, so a vertical link bunched up instead of rippling. v3 takes sin(3πt − flow) and moves points along the path's normal; its still core ripples across the path too.",
        frames: /\/7-lava-flow/,
        mask: WHERE,
        proof() {
            storeSettings(V1_LINK_SETTINGS);
            const at = new Float64Array(4);
            // On a vertical link the core's 37 vertices are each where the path is at their fraction t of it, moved across by
            // v1's turbulence: moving 14 × sin(3πt − 1.2 × flow) × sin(2πt − 0.6 × flow), still 10.5 × sin(3πt + 1.2 × phase) × sin(2πt + 0.6 × phase).
            const s = wire([300, 100], [300, 600], '#64b5f6', [DOWN, UP]);
            const [flow, phase] = [0.9, (9 * Math.PI) / 4];
            const cores = [
                [draw((ctx) => MOVING[7](ctx, s, moment(-1, flow))), 1, (t: number) => 14 * Math.sin(t * Math.PI * 3 - flow * 1.2) * Math.sin(t * Math.PI * 2 - flow * 0.6)],
                [draw((ctx) => STILL[7](ctx, s, phase)), 0, (t: number) => 10.5 * Math.sin(t * Math.PI * 3 + phase * 1.2) * Math.sin(t * Math.PI * 2 + phase * 0.6)],
            ] as const;
            for (const [rec, core, across] of cores) {
                const vertices = strokes(rec)[core];
                expect(vertices).toHaveLength(37);
                vertices.forEach(([x, y], i) => {
                    s.path.at(i / 36, at);
                    expect([x, y]).toEqual([Number(fmt(300 - across(i / 36))), Number(fmt(at[1]))]);
                });
                expect(new Set(vertices.map(([x]) => x)).size).toBeGreaterThan(30);
            }
            // On a horizontal link the core's ripple moves toward the input as the flow grows.
            const flat = wire([100, 100], [900, 100]);
            const lava = (flow: number) => crossing(strokes(draw((ctx) => MOVING[7](ctx, flat, moment(0, flow))))[1], 300);
            expect(lava(0.2)).toBeGreaterThan(lava(0));
        },
    },
    {
        title: "Lava Flow's sheath glows in its own colour",
        why: "v1 stroked the sheath without setting a glow, so it took the glow of the link drawn before it. It now glows in the link's secondary colour, as its core does.",
        frames: /animated\/7-lava-flow/,
        mask: each((line) => (/^stroke .* alpha=0\.3 /.test(line) ? line.replace(SHADOW, 'shadow=*') : line)),
        proof() {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Color.Mode': 'custom' });
            const rec = draw((ctx) => {
                ctx.shadowColor = '#123456';
                MOVING[7](ctx, wire([100, 100], [500, 300]), moment(0, 0.5));
            });
            const sheath = rec.paints.find((p) => p.op === 'stroke')!;
            expect([sheath.style, sheath.shadowColor, sheath.shadowBlur]).toEqual(['#fb00ff', '#fb00ff', 15]);
        },
    },
    {
        title: "Energy Pulse's orbs shrink and fade along their trip",
        why: 'v1 sized them by where they were, so going Reverse they grew from nothing toward the output and vanished there at full size. v3 sizes them by how far along their trip they are.',
        frames: /links-rich\/animated\/5-energy-pulse\.txt: # reverse/,
        mask: (lines) => WHERE(lines).map((line) => line.replace(/^fill \[\] arc\(\*, [^,]+(.*) alpha=\S+/, 'fill [] arc(*, *$1 alpha=*')),
        proof() {
            const s = wire([100, 100], [700, 100]);
            for (const direction of [1, -1]) {
                storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Direction': direction, '🔗 Enhanced Links.Quality': 3 });
                const orbs = draw((ctx) => MOVING[5](ctx, s, moment(0, 0.37))).paints.map((p) => [(p.box![0] + p.box![2]) / 2, p.box![2] - p.box![0]]);
                // From the output on, smaller and smaller going Forward, larger and larger going Reverse.
                const sizes = orbs.sort((a, b) => a[0] - b[0]).map(([, size]) => size);
                expect(sizes, `direction ${direction}`).toEqual([...sizes].sort((a, b) => (b - a) * direction));
            }
        },
    },
    {
        title: 'Link.Style decorations, and the effects, follow the curve',
        why: "v1's dotted, dashed, double, glow path, chain, pulse, holographic and Effect only links decorated a straight line from end to end, along which every animation drew too; its stepped and zigzag were their own shapes. v3 draws each decoration along the link's real path (styles.ts) and the effects follow that path.",
        frames: /path-styles\.txt: # Link\.Style (?!spline|straight|linear)/,
        mask: DECORATED,
        proof() {
            for (const style of ['hidden', 'dotted', 'dashed', 'double', 'glowpath', 'chain', 'pulse', 'holographic']) {
                storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Link.Style': style });
                const s = wire([100, 100], [500, 300]);
                const marks = points(draw((ctx) => drawMarkers(ctx, s, 0, 0.3)), ['translate']);
                const rec = draw((ctx) => drawBase(ctx, s, 9, false));
                // The markers, each with its shadow; the decoration's points on the path, Double's rails and Holographic's scanline ends beside it.
                expect(marks.length, style).toBe(4);
                const beside = BESIDE[style] ?? 0;
                for (const point of [...marks, ...points(rec)]) expect(off(s, point), style).toBeLessThan(beside + 0.01);
            }
        },
    },
    {
        title: 'Rainbow markers take their hue to the nearest degree',
        why: "v1 built an hsl() string for each marker every frame. v3 takes it from a table of the 360 whole-degree hues, built once per setting change, so frames build no colour strings: at most half a degree off.",
        frames: /9-classic-flow\.txt: # rainbow/,
        mask: each((line) => (line.startsWith('fill ') && !line.includes('style=rgba(0, 0, 0, 0.95)') ? line.replace(/ style=\S+/, ' style=rainbow') : line)),
        proof() {
            storeSettings(V1_LINK_SETTINGS);
            for (const hue of [0.4, 10.6, 123.49, 359.6, -45.2]) {
                const want = parseColor(`hsl(${hue}, 100%, 50%)`)!;
                const got = parseColor(rainbow(hue))!;
                expect(got, `${hue}`).toEqual(parseColor(`hsl(${Math.round(hue)}, 100%, 50%)`));
                for (let c = 0; c < 3; c++) expect(Math.abs(got[c] - want[c])).toBeLessThanOrEqual(3);
            }
        },
    },
    {
        title: 'Links take their colour in native order',
        why: "ComfyUI's palettes store '' for the types they lack, and v1 drew with that '', or for a type with no entry with the default_connection_color object: the canvas ignored both, so such links took the previous link's colour, and gradients threw on them. v3 takes each segment's colour as native does: the one handed to renderLink, the type's, or the canvas default, the first the canvas takes.",
        async proof() {
            const canvas = await start(V1_LINK_SETTINGS, { nodes: [{ pos: [100, 100] }, { pos: [600, 100] }, { pos: [100, 300] }, { pos: [600, 300] }], links: [{ from: 0, to: 1, type: 'IMAGE' }, { from: 2, to: 3, type: 'INT' }] });
            Object.assign((globalThis as unknown as { LGraphCanvas: { link_type_colors: Record<string, string> } }).LGraphCanvas.link_type_colors, { IMAGE: '#64B5F6', INT: '' });
            frames(1);
            expect(canvas.back.paints.filter((p) => p.op === 'stroke' && p.style !== 'rgba(0, 0, 0, 0.95)').map((p) => p.style)).toEqual(['#64b5f6', '#99aa99']);
            expect(palette('')).toBeUndefined();
            expect(palette({})).toBeUndefined();
        },
    },
    {
        title: 'Color.Scheme filters each colour once, every colour',
        why: "v1's Classic Flow and Sacred Flow filtered their colours twice, and so did its styled titles in Style colors (getTextColor enhanced the accent getCustomColors had already, old_node_animations.js:826-832, 938), and v1 filtered only 6-digit hex, so the default link colour (#9A9), rgb() palettes and the rainbow markers never took the scheme. v3 filters each colour once, whatever its syntax; the white of a selected node's links stays white.",
        proof() {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Color.Scheme': 'bright', '🔗 Enhanced Links.Marker.Color.Mode': 'inherit' });
            // #64b5f6 is hsl(207, 89%, 68%); bright takes its lightness to 85%, where twice took it to white.
            const once = palette('#64b5f6')!;
            expect([once.primary, once.marker]).toEqual(['#b6dcfb', '#b6dcfb']);
            expect(palette('#9A9')!.primary).toBe(palette('#99aa99')!.primary);
            expect(palette('#9A9')!.primary).not.toBe('#99aa99');
            expect(palette('rgb(100, 181, 246)')!.primary).toBe(once.primary);
            expect(rainbow(0)).not.toBe('#ff0000');
            expect(HIGHLIGHT.primary).toBe('#ffffff');
            // Neon Nexus's accent #00ff44 is hsl(136, 100%, 50%): bright takes its lightness to 62.5% once, where twice took it to 78%.
            storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Color.Mode': 'default', '📦 Enhanced Nodes.Color.Scheme': 'bright' });
            const { title, accent } = nodePalette(2);
            const [r, g, b] = parseColor(title)!;
            expect(title).toBe(accent);
            expect(((Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255) * 100).toBeCloseTo(62.5, 0);
        },
    },
    {
        title: 'Every count is at least one',
        why: 'v1 counted elements as floor(…) of its settings, which came to 0 at low settings (Classic Flow at Marker.Size 1, Stellar Plasma on a link under 20 px), and 0 / 0 then made every position NaN, which the canvas skips: the style vanished. v3 draws at least one.',
        proof() {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Marker.Size': 1 });
            const s = wire([100, 100], [114, 100]);
            const markers = draw((ctx) => drawMarkers(ctx, s, 0, 0.2));
            expect(markers.paints.filter((p) => p.op === 'fill' && p.style !== 'rgba(0, 0, 0, 0.95)')).toHaveLength(1);
            for (let style = 1; style <= 8; style++) {
                for (const rec of [draw((ctx) => MOVING[style](ctx, s, moment(-1, 0.5))), draw((ctx) => STILL[style](ctx, s, 9 * Math.PI / 4))]) {
                    expect(rec.paints.length, `style ${style}`).toBeGreaterThan(0);
                    expect(rec.lines.filter((line) => /NaN|ignored/.test(line)), `style ${style}`).toEqual([]);
                }
            }
        },
    },
    {
        title: "Links follow native's paths",
        why: "v1 drew every link along its own spline, bent min(0.5 × length, 100) px out along x whatever the slots' directions, and its own straight and right-angle shapes. v3 follows the paths ComfyUI draws, through reroutes, in every render mode (geometry.ts); the Level A traces feed v3 v1's own paths instead.",
        async proof() {
            const canvas = await start({}, PAIR);
            frames(1);
            // The fake's link runs from (311, 214) to (610, 214); native's controls are a quarter of that out along the slots.
            expect(canvas.back.lines).toContain(`bezierCurveTo(${fmt(311 + 299 / 4)}, 214, ${fmt(610 - 299 / 4)}, 214, 610, 214)`);
        },
    },
    {
        title: 'Links of collapsed nodes keep their effect',
        why: "v1 skipped every link to or from a collapsed node (old_link_animations.js:2474), and as it drew the links in native's stead, they vanished. v3 draws them where native does, from the collapsed node's title bar, with their effect.",
        async proof() {
            const canvas = await start({}, { nodes: [{ pos: [100, 100] }, { pos: [600, 100], collapsed: true }], links: [{ from: 0, to: 1 }] });
            frames(1);
            expect(canvas.back.paints.filter((p) => p.op === 'stroke').map((p) => p.style)).toEqual(['rgba(0, 0, 0, 0.95)', '#99aa99']);
            expect(live.links).toBe(1);
        },
    },
    {
        title: 'Reroutes and centre markers stay',
        why: "v1 drew the links in native's stead and drew neither the reroutes nor the markers native puts at each link's centre. v3 keeps both, over the links as native draws them, the markers on the middle of the path the link is drawn along.",
        async proof() {
            const canvas = await start({}, { ...PAIR, links: [{ from: 0, to: 1, reroutes: [[400, 320]] }] });
            frames(1);
            const lines = canvas.front.lines;
            // A centre marker on each of the two segments, then the reroute.
            const centres = lines.flatMap((line, i) => (/^arc\(.*, 5, 0, 6\.28\)$/.test(line) ? [i] : []));
            expect(centres).toHaveLength(2);
            expect(lines.indexOf('arc(400, 320, 10, 0, 6.28)')).toBeGreaterThan(centres[1]);
        },
    },
    {
        title: "A busy graph's links can zoom without their glow",
        why: "v1 drew every link, with its glow and shadow, in every frame. v3 draws what does not move into the background, where native draws the links; where more than 12 of the links on screen have a glowing base, it draws them on a layer of their own, copied onto the background. While the view pans, the layer moves along and only what comes into view is drawn, glows and all; while the view zooms or nodes are dragged, the bases are drawn again in place with their glows, as v1 drew them, or with Perf.KeepGlow off without the bases' glows and Classic Flow's shadow, and with them 150 ms after the last of it.",
        async proof() {
            const canvas = await start({}, {
                nodes: Array.from({ length: 13 }, (_, i) => [{ pos: [-200, 50 + 60 * i] as [number, number] }, { pos: [600, 50 + 60 * i] as [number, number] }]).flat(),
                links: Array.from({ length: 13 }, (_, i) => ({ from: 2 * i, to: 2 * i + 1 })),
            });
            vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
            try {
                // What the pass stroked, once each, on the background and on the layer, the last canvas its size made off screen.
                const bake = () => {
                    canvas.setDirty(true, true);
                    const layer = () => offscreens.filter((rec) => rec.ctx.canvas.width === canvas.back.ctx.canvas.width).at(-1);
                    const [before, back] = [layer(), canvas.back.paints.length];
                    const from = before?.paints.length ?? 0;
                    frames(1);
                    const after = layer();
                    const strokes = [...canvas.back.paints.slice(back), ...(after?.paints.slice(after === before ? from : 0) ?? [])]
                        .filter((p) => p.op === 'stroke').map((p) => JSON.stringify([p.style, p.shadowBlur]));
                    return [...new Set(strokes)].map((stroke) => JSON.parse(stroke));
                };
                const glowing = [['rgba(0, 0, 0, 0.95)', 10], ['#99aa99', 10]];
                bake();
                vi.advanceTimersByTime(150);
                expect(bake()).toEqual(glowing);
                canvas.ds.offset = [40, 0];
                expect(bake()).toEqual(glowing);
                canvas.ds.scale = 0.9;
                expect(bake()).toEqual(glowing);
                preview('🔗 Enhanced Links.Perf.KeepGlow', false);
                canvas.ds.scale = 0.8;
                expect(bake()).toEqual([['#99aa99', 0]]);
                vi.advanceTimersByTime(150);
                expect(bake()).toEqual(glowing);
            } finally {
                vi.useRealTimers();
            }
        },
    },
    {
        title: "Link.Style's decorations fade with a ghost",
        why: "v1 drew Glow path's white halo at alpha 0.5 and Pulse's soft blobs at 0.3 whatever alpha the link was drawn at, so over the 30 % ghosts of Crystal Stream, Quantum Field, Energy Pulse and still Stellar Plasma they shone brighter than the link they decorate. v3 draws them at those fractions of the link's own alpha: v1's 0.5 and 0.3 over a whole link, 0.15 and 0.09 over a ghost.",
        proof() {
            for (const [animate, still, link] of [[9, false, 1], [2, false, 0.3], [3, false, 0.3], [5, false, 0.3], [8, true, 0.3]] as const) {
                for (const [style, alpha] of [['glowpath', 0.5], ['pulse', 0.3]] as const) {
                    storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Link.Style': style });
                    // Both decorations are drawn with gradients: the halo's white along the link, each blob's soft rim.
                    const decorations = draw((ctx) => drawBase(ctx, wire([100, 100], [500, 300]), animate, still)).paints.filter((p) => p.style.startsWith('grad'));
                    expect(decorations.length, `${style}, Animate ${animate}`).toBeGreaterThan(0);
                    expect(new Set(decorations.map((p) => fmt(p.globalAlpha, 3))), `${style}, Animate ${animate}`).toEqual(new Set([fmt(alpha * link, 3)]));
                }
            }
        },
    },
    {
        title: 'Effects move at the same rate at any frame rate',
        why: "v1 stepped its node particles by one 60 Hz step a frame, so they slowed down on faster screens, smoothed its link time, and moved its fireworks on 0.014 a frame, which at 144 Hz ended them in half a second. v3's one clock moves by each frame's real time.",
        async proof() {
            const moved: number[] = [];
            const shows: number[] = [];
            for (const hz of [60, 144]) {
                await start({ '📦 Enhanced Nodes.Particle.Show': true }, PAIR);
                frames(5, hz);
                const before = { ...clock };
                frames(hz, hz);
                moved.push(clock.linkPhase - before.linkPhase, clock.particleTime - before.particleTime);
                // How long a show plays.
                await start(FIREWORKS, RUN);
                run(`rate ${hz}`, [1]);
                let count = 0;
                for (frames(1, hz); live.bursts; frames(1, hz)) count++;
                shows.push(count / hz);
            }
            expect(moved[0]).toBeCloseTo(-PHI2, 6);
            expect(moved[2] / moved[0]).toBeCloseTo(1, 2);
            expect(moved[3] / moved[1]).toBeCloseTo(1, 2);
            for (const seconds of shows) expect(Math.abs(seconds - 1 / 0.84)).toBeLessThan(1 / 30);
        },
    },
    {
        title: 'The phase never wraps',
        why: "v1 wrapped its phase into one turn, so Rainbow markers, whose hue takes 50 × the phase, jumped 314° of hue each turn, and a Direction change held the old direction for up to a turn. v3's phases run on, the links' and the nodes', and Direction turns the links round over 0.3 s.",
        async proof() {
            await start({ '🔗 Enhanced Links.Marker.Effects': 'rainbow', '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true }, PAIR);
            frames(5);
            const before = { ...clock };
            frames(1200);
            expect(clock.linkPhase - before.linkPhase).toBeCloseTo(-PHI2 * 20, 6);
            expect(clock.linkPhase).toBeLessThan(-4 * Math.PI);
            // Nor do the node clocks: past a turn of the node phase, 15 s at speed 1, which Gentle Pulse breathes by.
            expect(clock.nodePhase - before.nodePhase).toBeCloseTo(TURN * 20, 6);
            expect(clock.nodePhase).toBeGreaterThan(2 * Math.PI);
            expect(clock.particleTime - before.particleTime).toBeCloseTo(20, 6);
        },
    },
    {
        title: 'Still links hold one pose',
        why: "v1 posed its still designs at π/4 and moved them by 2π on the first still frame after Animate, Link.Style, Quality or Particle.Density changed, which flipped the poses that take half the phase. v3 always draws v1's first still frame, at 9π/4.",
        async proof() {
            const still = vi.spyOn(STILL, 8);
            const canvas = await start({ '🔗 Enhanced Links.Static.Mode': true, '🔗 Enhanced Links.Animate': 8 }, PAIR);
            for (const [id, value] of [['🔗 Enhanced Links.Quality', 2], ['🔗 Enhanced Links.Link.Style', 'dotted'], ['🔗 Enhanced Links.Particle.Density', 2]] as const) {
                preview(id, value);
                canvas.setDirty(true, true);
                frames(1);
            }
            expect(still.mock.calls.map(([, , phase]) => phase)).toEqual(Array(still.mock.calls.length).fill(STILL_PHASE));
            expect(still.mock.calls.length).toBeGreaterThanOrEqual(3);
            expect(STILL_PHASE).toBe((9 * Math.PI) / 4);
        },
    },
    {
        title: 'Bases lie under all the motion',
        why: "v1 drew each link's base and then its motion, so a link drawn later covered the motion of the links before it. v3 draws every base where native draws the link, in the background, and all the motion over the background, so motion is never under another link's base.",
        async proof() {
            const canvas = await start({ '🔗 Enhanced Links.Animate': 2 }, { nodes: [{ pos: [100, 100] }, { pos: [600, 300] }, { pos: [100, 300] }, { pos: [600, 100] }], links: [{ from: 0, to: 1 }, { from: 2, to: 3 }] });
            frames(3);
            const back = canvas.back.paints.filter((p) => p.op === 'stroke');
            const front = canvas.front.paints.filter((p) => p.op === 'stroke');
            // The two ghosts in the background; only crystals, under transforms, over it.
            expect(back.map((p) => p.globalAlpha)).toEqual([0.3, 0.3]);
            expect(front.length).toBeGreaterThan(0);
            expect(front.every((p) => p.globalAlpha === 1)).toBe(true);
        },
    },
    {
        title: 'Moving particles glow from sprites',
        why: "shadowBlur blurs every shape it is set for, each frame. While links move, Classic Flow's markers and the particles of Crystal Stream, Energy Pulse and Stellar Plasma glow from sprites the canvas cast once with the same shadowBlur, stamped under each shape, which in Chromium differ from shadowBlur by at most 10 of 255 at zoom 0.5, 1 and 2. The animations whose strokes glow keep shadowBlur, as stamps between shadowed strokes cost the GPU more than they save, and so do still frames and these traces.",
        async proof() {
            for (const still of [false, true]) {
                const made = offscreens.length;
                const canvas = await start({ '🔗 Enhanced Links.Static.Mode': still }, PAIR);
                frames(1);
                // Past the front pass's copy of the background: each of the two markers stamps its halo and its glow.
                const stamps = canvas.front.paints.filter((p) => p.op === 'drawImage').length - 1;
                const cast = offscreens.slice(made).flatMap((sprite) => sprite.paints).map((p) => [p.shadowColor, p.shadowBlur]);
                expect([stamps, cast], still ? 'still' : 'moving').toEqual(still ? [0, []] : [4, [['rgba(0, 0, 0, 0.95)', 10], ['#99aa99', 10]]]);
            }
        },
    },
    {
        title: 'Nothing flashes more than three times a second',
        why: "WCAG 2.3.1. Quantum Field's five filaments each sweep round their link once a turn of v1's phase, 6 times a second at speed 3 between them; its phase turns at most three fifths of a turn a second, which only binds above speed 1.44. Markers' Pulse, Fade and Rainbow stay under three flashes a second at the fastest speed. The titles' flicker runs at up to ten times the node phase: Glitch's copies shook 3.3 times a second at v1's top speed, 5; at v3's, 3, they shake twice. A run's fireworks flash three times, once a burst; a run that starts while a show plays ends it, and the next show waits 3 s. A failed node's outline pulses once a second, three times, and the river into a running node fades in and out without flickering. Confetti pieces flip at most 1.2 times a second, showing their faces 2.4 times; each shockwave ring and each link's comet lights once; where a show of these has several anchors, each starts a third of a second after the one before; and a node's burst as it finishes, sparks or with reduced motion a ring, waits a third of a second before its next. Merkaba beads and comet heads grow out of the output and back into the input once a trip, 1.8 and 2.25 trips a second at speed 3, a DNA Helix 3D strand turns from back to front 1.25 times a second, and Stardust's motes twinkle 2.5 times a second.",
        async proof() {
            // Each title style's flicker over two seconds at Node effect speed 3, sampled at 60 Hz: the alpha it fades, the glow it breathes or where it shakes its copies.
            storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Animation.Speed': 3 });
            for (const style of ['neon', 'cyberpunk', 'retro', 'pulse', 'minimal']) {
                preview('📦 Enhanced Nodes.Text.Style', style);
                const seen = Array.from({ length: 121 }, (_, i) => {
                    const rec = draw((ctx) => drawTitle(ctx, { text: 'KSampler', width: 56 }, 30, -15, '#00ffff', TURN * 3 * (i / 60), 1));
                    const [first] = filled(rec);
                    const last = rec.paints.filter((p) => p.op === 'fillText').at(-1)!;
                    return style === 'cyberpunk' ? Number(first.split(', ')[1]) : style === 'retro' ? Number(first.split(', ')[2].slice(0, -1)) : style === 'pulse' ? last.shadowBlur : last.globalAlpha;
                });
                expect(turns(seen) / 2, style).toBeLessThanOrEqual(3 * 2);
                expect(turns(seen), style).toBeGreaterThan(0);
            }
            // A run that starts half a second into a show ends it and starts none; the next show starts 3 s after the last.
            const failing = await start(FIREWORKS, RUN);
            run('first', [1]);
            frames(30);
            expect(live.bursts).toBeGreaterThan(0);
            run('second', [1]);
            expect(live.bursts).toBe(0);
            frames(140);
            run('third', [1]);
            expect(live.bursts).toBe(0);
            frames(12);
            run('fourth', [1]);
            // The burst clock starts from 0 with each show.
            expect([live.bursts > 0, clock.burstTime]).toEqual([true, 0]);
            // A failed node's outline over four seconds: in no second more than three flashes, three pulses, then steady.
            frames(90);
            send('execution_start', { prompt_id: 'failing', timestamp: 0 });
            progress('failing', { 1: 'running' });
            send('execution_error', { prompt_id: 'failing', node_id: '1', node_type: 'ELNInt', executed: [], exception_message: '', exception_type: '', traceback: [], timestamp: 0 });
            // The alpha of a stroke a frame shows: the last frame's again where the frame paints nothing.
            let alpha = 0;
            const strokes = (canvas: FakeCanvas, of: (p: { style: string; lineWidth: number }) => boolean) => {
                const from = canvas.front.paints.length;
                frames(1);
                const paints = canvas.front.paints.slice(from);
                if (paints.length) alpha = paints.find((p) => p.op === 'stroke' && of(p))?.globalAlpha ?? 0;
                return alpha;
            };
            const outline = Array.from({ length: 240 }, () => strokes(failing, (p) => p.style === RED));
            for (let second = 0; second < 4; second++) expect(turns(outline.slice(second * 60, second * 60 + 61)) / 2).toBeLessThanOrEqual(3);
            expect(turns(outline)).toBe(5);
            expect(outline.slice(185).every((alpha) => alpha === 1)).toBe(true);
            // The river into a running node, and its sparks, which take its alpha: up once, then down once the node stops.
            const flowing = await start({}, PAIR);
            send('execution_start', { prompt_id: 'river', timestamp: 0 });
            progress('river', { 2: 'running' });
            const river = Array.from({ length: 120 }, () => strokes(flowing, (p) => p.lineWidth === L.thickness * 1.4));
            progress('river', { 2: 'finished' });
            river.push(...Array.from({ length: 60 }, () => strokes(flowing, (p) => p.lineWidth === L.thickness * 1.4)));
            expect([turns(river), Math.max(...river), river.at(-1)]).toEqual([1, 1, 0]);
            await start({ '🔗 Enhanced Links.Animate': 3, '🔗 Enhanced Links.Animation.Speed': 3 }, PAIR);
            frames(5);
            const before = { ...clock };
            frames(60);
            expect(clock.linkPhase - before.linkPhase).toBeCloseTo(-PHI2 * 3, 6);
            expect(clock.quantumPhase - before.quantumPhase).toBeCloseTo((-2 * Math.PI * 3) / 5, 6);
            // The new completion styles over three nodes and a small show in the middle, at 60 Hz. Each shockwave ring lights
            // once, a third of a second after the one before.
            const graph = {};
            const view = { visible_area: new Float32Array([0, 0, 1600, 900]), ds: { scale: 1 }, graph } as unknown as Parameters<typeof drawBursts>[0];
            const anchors = [200, 700, 1200].map((x, id) => ({ id, pos: [x, 400], graph, boundingRect: [x, 370, 200, 130] }) as unknown as Anchor);
            anchors.push({ id: 'view', pos: [800, 450], graph, small: true } as unknown as Anchor);
            /** The frames of a show of `style` over `over`, each as `of` reads it: a value for each thing that lights, by key. */
            const show = (style: Style, over: Anchor[], of: (rec: CanvasRecorder) => Map<string, number>) => {
                storeSettings({});
                endBursts();
                play(style, over, 'flash');
                const seen = Array.from({ length: 180 }, (_, i) => {
                    clock.burstTime = i / 60;
                    return of(draw((ctx) => drawBursts(view, ctx)));
                });
                endBursts();
                return [...new Set(seen.flatMap((frame) => [...frame.keys()]))].map((key) => seen.map((frame) => frame.get(key) ?? 0));
            };
            const rings = show('shockwave', anchors, (rec) => new Map(rec.paints.filter((p) => p.op === 'stroke' && p.lineWidth === 3).map(({ box, globalAlpha }) => [`${Math.round(box![0] + box![2])}, ${Math.round(box![1] + box![3])}`, globalAlpha])));
            expect(rings.map(swings)).toEqual([1, 1, 1, 1]);
            const lit = rings.map((alphas) => alphas.findIndex(Boolean)).sort((a, b) => a - b);
            for (let i = 1; i < lit.length; i++) expect(lit[i] - lit[i - 1]).toBeGreaterThanOrEqual(19);
            // Each confetti piece: how much of its face shows, at its alpha, in each second.
            const area = (points: number[][]) => Math.abs(points.reduce((sum, [x, y], i) => sum + x * points[(i + 1) % points.length][1] - points[(i + 1) % points.length][0] * y, 0)) / 2;
            const faces = show('confetti', [anchors[0]], (rec) => {
                const shown = new Map<string, number>();
                let points: number[][] = [];
                let alpha = 1;
                for (const line of rec.lines) {
                    const at = /^(?:moveTo|lineTo)\(([^,]+), ([^)]+)\)$/.exec(line);
                    if (at) points.push([Number(at[1]), Number(at[2])]);
                    else if (line.startsWith('globalAlpha = ')) alpha = Number(line.slice(14));
                    else if (line === 'beginPath()') points = [];
                    else if (line === 'fill()') shown.set(String(shown.size), area(points) * alpha);
                }
                return shown;
            });
            expect(faces.length).toBeGreaterThanOrEqual(60);
            for (const face of faces) for (let second = 0; second < 2; second++) expect(swings(face.slice(second * 60, second * 60 + 61)) / 2).toBeLessThanOrEqual(3);
            // A path trace's comet lights each link once: the second through a reroute, with the third, which leads into the same node.
            await start({ '🔗 Enhanced Links.Animate': 0, '🔗 Enhanced Links.Flow.Trail': false, '📦 Enhanced Nodes.Completion.Style': 'trace' }, { ...PAIR, nodes: [...PAIR.nodes, { pos: [1100, 200], output: true }], links: [...PAIR.links!, { from: 1, to: 2 }] });
            frames(1);
            run('flash trace', [1, 2, 3]);
            frames(1);
            const legs = ([[[100, 100], [260, 100], 2], [[260, 220], [500, 400], 3], [[500, 400], [760, 520], 3]] as const).map(([a, b, target]) => {
                const s = new Segment();
                s.path.set(a, b, RIGHT, LEFT, SPLINE);
                s.len = s.chain = s.path.length;
                s.flow = stepInto({ target_id: target });
                return s;
            });
            for (const leg of legs) {
                const light = Array.from({ length: 100 }, (_, i) => {
                    clock.burstTime = i / 60;
                    return draw((ctx) => drawFlows(ctx, [leg])).paints.reduce((sum, p) => sum + p.globalAlpha, 0);
                });
                expect(swings(light)).toBe(1);
            }
            endBursts();
            // A node a loop runs again each frame bursts, a ring with reduced motion, at most three times a second.
            for (const reduced of [false, true]) {
                const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Completion.PerNode': true }, { nodes: [{ pos: [300, 300] }] });
                fake.reducedMotion.matches = reduced;
                fake.reducedMotion.dispatchEvent(new Event('change'));
                frames(1);
                send('execution_start', { prompt_id: 'loop', timestamp: 0 });
                // When the node finished each time, on the run's clock, which the bursts keep time by.
                const finished: number[] = [];
                const bursts = Array.from({ length: 120 }, () => {
                    progress('loop', { 1: 'running' });
                    progress('loop', { 1: 'finished' });
                    finished.push(clock.runTime);
                    const from = canvas.front.paints.length;
                    frames(1);
                    // The sparks in the default palette's primary and secondary colours, or the ring.
                    const paints = canvas.front.paints.slice(from);
                    const lit = paints.filter((p) => (reduced ? p.op === 'stroke' && p.lineWidth === 2 : p.op === 'fill' && (p.style === '#44aaff' || p.style === '#88ccff')));
                    return Math.max(0, ...lit.map((p) => p.globalAlpha));
                });
                send('execution_success', { prompt_id: 'loop', timestamp: 0 });
                // Each burst starts, its alpha up on the frame before's, a third of a second or more after the last.
                const starts = bursts.flatMap((alpha, i) => (alpha > (bursts[i - 1] ?? 0) ? [finished[i]] : []));
                expect(starts.length, reduced ? 'ring' : 'sparks').toBeGreaterThan(4);
                for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1], reduced ? 'ring' : 'sparks').toBeGreaterThanOrEqual(1 / 3);
            }
            fake.reducedMotion.matches = false;
            fake.reducedMotion.dispatchEvent(new Event('change'));
            // A marker's alpha, or its luminance for Rainbow, over two seconds at speed 3, sampled at 60 Hz.
            for (const effect of ['pulse', 'fade', 'rainbow']) {
                storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Marker.Effects': effect, '🔗 Enhanced Links.Marker.Size': 1, '🔗 Enhanced Links.Animation.Speed': 3 });
                const s = wire([100, 100], [700, 100]);
                const seen = Array.from({ length: 121 }, (_, i) => {
                    const p = draw((ctx) => drawMarkers(ctx, s, -PHI2 * 3 * (i / 60), 2 * 9 * (i / 60))).paints.at(-1)!;
                    return effect === 'rainbow' ? luminance(p.style) : p.globalAlpha;
                });
                // Two turns of the signal make a flash.
                expect(turns(seen) / 2, effect).toBeLessThanOrEqual(3 * 2);
            }
            // v3's own link animations at the fastest speed with the most of everything, over two seconds at 30 Hz: where along x
            // each bead and each comet's head is, which grow out of the output and back into the input once a lap, and the alpha
            // DNA Helix 3D's first strand is drawn at, near or far, at x 250.
            storeSettings({ '🔗 Enhanced Links.Animation.Speed': 3, '🔗 Enhanced Links.Quality': 3, '🔗 Enhanced Links.Particle.Density': 3, '🔗 Enhanced Links.Color.Mode': 'custom' });
            const level = wire([100, 100], [400, 100]);
            const each = (animate: number, of: (rec: CanvasRecorder) => number[]) => {
                const seen = Array.from({ length: 61 }, (_, i) => of(draw((ctx) => MOVING[animate](ctx, level, moment(-PHI2 * 3 * (i / 30), 2 * 9 * (i / 30))))));
                return seen[0].map((_, j) => seen.map((frame) => frame[j]));
            };
            const beads = each(10, (rec) => rec.lines.filter((line) => line.startsWith('translate(')).map((line) => Number(line.slice(10, line.indexOf(',')))));
            const heads = each(12, (rec) => rec.paints.filter((p) => p.op === 'fill' && p.style === '#ffffff').map((p) => (p.box![0] + p.box![2]) / 2));
            const strand = each(11, (rec) => {
                const painted = rec.paints.filter((p) => p.op === 'stroke');
                let [xs, n] = [[] as number[], 0];
                for (const line of rec.lines) {
                    const at = /^(?:moveTo|lineTo)\(([^,]+),/.exec(line);
                    if (line === 'beginPath()') xs = [];
                    else if (at) xs.push(Number(at[1]));
                    else if (line === 'stroke()' && painted[n++].style === '#ffb300' && xs.some((x) => Math.abs(x - 250) < 2)) return [painted[n - 1].globalAlpha];
                }
                return [0];
            });
            expect([beads.length, heads.length, strand.length]).toEqual([45, 22, 1]);
            // A lap ends where an element jumps back over half the link to its start.
            const laps = (xs: number[]) => xs.filter((x, i) => i && x < xs[i - 1] - 150).length;
            for (const signal of [...beads, ...heads]) {
                expect(laps(signal)).toBeGreaterThan(0);
                for (let second = 0; second < 2; second++) expect(laps(signal.slice(second * 30, second * 30 + 31))).toBeLessThanOrEqual(3);
            }
            expect(swings(strand[0])).toBeGreaterThan(0);
            for (let second = 0; second < 2; second++) expect(swings(strand[0].slice(second * 30, second * 30 + 31)) / 2).toBeLessThanOrEqual(3);
            // Stardust's mote nearest x 250, the dust held where it is, as it twinkles.
            const star = Array.from({ length: 61 }, (_, i) => {
                const cores = draw((ctx) => MOVING[13](ctx, level, moment(-PHI2 * 3 * (i / 30), 0))).paints.filter((p) => p.op === 'fill' && p.style === '#ffffff');
                return cores.reduce((a, b) => (Math.abs(a.box![0] - 250) < Math.abs(b.box![0] - 250) ? a : b)).globalAlpha;
            });
            expect(turns(star)).toBeGreaterThan(0);
            for (let second = 0; second < 2; second++) expect(turns(star.slice(second * 30, second * 30 + 31)) / 2).toBeLessThanOrEqual(3);
        },
    },
    {
        title: "Gentle Pulse glows in v1's own colours",
        why: "The committed Gentle Pulse traces are v2's port, whose withAlpha read colours right. v1's own Gentle Pulse had a withAlpha of its own (old_node_animations.js:1231-1247) that read a colour's hex digits two by two and took a pair that read 0 as 255, so its amber #ffb300 glowed #ffb3ff, #fb00ff #fbffff, #9d00ff #9dffff, and the #00ff15 hover outline #ffff15. v3 keeps what v1 showed, for the author to judge at sign-off. An hsl() particle colour keeps its own hue, which v1 misread as a yellow.",
        frames: /^nodes(-rich)?\/1-gentle-pulse/,
        mask: each((line) => line.replace(/rgba\((\d+), (\d+), (\d+), /g, (_, r, g, b) => `rgba(${Number(r) || 255}, ${Number(g) || 255}, ${Number(b) || 255}, `)),
        async proof() {
            const rec = nodeFx(1, { '📦 Enhanced Nodes.Quality': 3, '📦 Enhanced Nodes.Color.Hover.Show': true }, { node: { ...NODE, selected: true } });
            const colours = rec.lines.map((line) => /rgba\(\d+, \d+, \d+/.exec(line)?.[0]).filter(Boolean);
            for (const colour of ['rgba(255, 179, 255', 'rgba(251, 255, 255', 'rgba(157, 255, 255', 'rgba(255, 255, 21']) expect(colours).toContain(colour);
            expect(colours.join()).not.toMatch(/rgba\(255, 179, 0|rgba\(251, 0, 255|rgba\(157, 0, 255|rgba\(0, 255, 21/);
            // A rainbow firefly's halo has the hue of its core: the last firefly's.
            const rainbow = nodeFx(1, { '📦 Enhanced Nodes.Particle.Color.Mode': 'rainbow' });
            const halo = rainbow.lines.filter((line) => /^grad\d+\.addColorStop\(0, /.test(line)).at(-1)!;
            const core = rainbow.paints.at(-1)!;
            expect(parseColor(halo.slice(halo.indexOf(', ') + 2, -1))!.slice(0, 3)).toEqual(parseColor(core.style)!.slice(0, 3));
            if (!HAVE_V1) return;
            // Past the fireflies' seeded sizes, and the halos of v1's misread hsl() colours, v3 draws v1's own Gentle Pulse.
            for (const rich of [false, true]) {
                sameFrames(await own('gentlePulse', rich), ours(1, rich), (line, header) => {
                    const sized = unsized(line);
                    return /particles=(?!default)/.test(header) && sized !== line ? sized.replace(/\)\[[^\]]*\]/, ')[*]') : sized;
                });
            }
        },
    },
    {
        title: "Gentle Pulse's fireflies flicker alike wherever they are drawn",
        why: "v1 grew and shrank each firefly by Math.random() on every frame it drew. v3 takes the flicker, in v1's range, from a hash of the firefly and the time, 30 steps a second as v1's redraws were, so the part of a firefly over its node's body and the part around it are one size, and a canvas drawn twice in a frame draws it alike.",
        frames: /^nodes(-rich|-particles-only)?\/1-gentle-pulse/,
        mask: each(unsized),
        proof() {
            const random = vi.spyOn(Math, 'random');
            // Each firefly's glow and core round its place, off the light at the node's centre.
            const fireflies = (part: Part, k = NOW) => {
                const list = arcs(nodeFx(1, {}, { part, k })).filter(([x, y]) => x || y);
                return new Map(list.filter((_, j) => j % 2 === 0).map(([x, y, r], j) => [`${x},${y}`, [r, list[2 * j + 1][2]]]));
            };
            const [whole, under, over] = [WHOLE, side(UNDER), side(OVER)].map((part) => fireflies(part));
            expect(random).not.toHaveBeenCalled();
            // No part draws a firefly at another size; each is in a part, and most in only one.
            for (const [place, sizes] of [...under, ...over]) expect(sizes, place).toEqual(whole.get(place));
            expect(new Set([...under.keys(), ...over.keys()])).toEqual(new Set(whole.keys()));
            expect(under.size + over.size).toBeLessThan(2 * whole.size);
            // In v1's range: 0.7 + sin(time / 2 + i) × 0.4 of the base size, (4 + Quality) px, plus up to 0.3 of it.
            const time = TURN * NOW.particleTime;
            [...whole.values()].forEach(([r], i) => {
                const flicker = r / 2 / 5 - (0.7 + Math.sin(time * 0.5 + i) * 0.4);
                expect(flicker, `firefly ${i}`).toBeGreaterThanOrEqual(-0.01);
                expect(flicker, `firefly ${i}`).toBeLessThan(0.31);
            });
            // A thirtieth of a second later, other sizes.
            const later = fireflies(WHOLE, { ...NOW, nodeTime: NOW.nodeTime + 1 / 30 });
            expect([...later.values()]).not.toEqual([...whole.values()]);
        },
    },
    {
        title: "Sacred Rosette's dots are v1's",
        why: "The committed Flower of Life traces, of the effect v3 calls Sacred Rosette, are v2's port, which shrank and dimmed the dots circling its pattern: 1.2 to 1.8 px with a twinkle, blur 5 × Particle.Glow, alpha 0.6 × it, glowing at that alpha too. v3 draws v1's own (old_node_animations.js:1866-1894): 2 × Quality × Particle.Size px, blur 10 × Particle.Glow and alpha 0.7 × it, glowing in their own colour, each run of a colour casting one glow for all its dots.",
        frames: /^nodes(-rich)?\/4-flower-of-life/,
        mask: each((line) => (line.startsWith('fill ') && line.includes(' arc(') && !line.includes('style=radial')
            ? line.replace(/arc\(([^,]+), ([^,]+), [^,]+, /, 'arc($1, $2, *, ').replace(/ alpha=.*$/, ' alpha=* shadow=*')
            : line)),
        async proof() {
            const rec = nodeFx(4, { '📦 Enhanced Nodes.Quality': 3, '📦 Enhanced Nodes.Particle.Glow': 0.5, '📦 Enhanced Nodes.Particle.Size': 1.5 });
            const dots = rec.paints.filter((p) => p.op === 'fill' && p.style === '#ffb300');
            // 127 points at Quality 3, two dots each, filled one by one, after their glow, which one fill casts for them all
            // from far off to the right.
            const [glow, ...each] = dots;
            expect(each).toHaveLength(127 * 2);
            expect([glow.shadowColor, glow.shadowBlur, glow.shadowOffsetX, glow.globalAlpha]).toEqual(['#ffb300', 5, -1e5, 0.35]);
            for (const dot of each) {
                expect((dot.box![2] - dot.box![0]) / 2).toBeCloseTo(2 * 3 * 1.5, 9);
                expect([dot.shadowBlur, dot.globalAlpha]).toEqual([0, 0.35]);
            }
            if (!HAVE_V1) return;
            // v3 draws v1's own dots, round the circles of v1's own pattern, past the hover outline v3 draws round every effect.
            const circles = (trace: string) => ROSETTE(canonical(trace).split('\n').filter((line) => line && !line.startsWith('strokeRect ')));
            for (const rich of [false, true]) expect(circles(ours(4, rich)), `rich ${rich}`).toEqual(circles(await own('flowerOfLife', rich)));
        },
    },
    {
        title: 'Sacred Rosette closes its rings, and draws its pattern in fewer strokes',
        why: "v1's Flower of Life, which v3 calls Sacred Rosette now that it adds the true Flower of Life, joined each circle of a ring to the one before it, but the first to none, so that every ring stayed open between its last circle and its first; v3 closes them. v1 stroked each circle and each chord on its own, each casting its glow, and gave each of the dots circling its points a glow of its own: some 250 glowing strokes and 635 glowing dots on each node at Quality 3, the costliest of the effects. v3 strokes every chord in one path and each layer's circles of a colour in another, in v1's colours, widths, alphas and glow, and fills each run of dots of a colour once far off the canvas to cast their glow together, then each dot without one, so that they stack as v1's did.",
        frames: /^nodes(-rich|-particles-only)?\/4-flower-of-life/,
        mask: ROSETTE,
        proof() {
            const lines = canonical(nodeFx(4, { '📦 Enhanced Nodes.Quality': 3, '📦 Enhanced Nodes.Particle.Show': false }).trace()).split('\n').filter((line) => line.startsWith('stroke '));
            // The centre circle, every chord, two strokes for each of the 6 layers, and the hexagon.
            expect(lines).toHaveLength(1 + 1 + 2 * 6 + 1);
            const chords = lines[1];
            const ends = [...chords.matchAll(/(moveTo|lineTo)\(([^)]*)\)/g)].map((m) => [m[1], m[2]]);
            // Round each ring of 6, 12, ... 36 circles, from each one to the next, and from the last back to the first.
            expect(ends.filter(([call]) => call === 'lineTo')).toHaveLength(6 * (1 + 2 + 3 + 4 + 5 + 6));
            const from = new Set(ends.filter(([call]) => call === 'moveTo').map(([, at]) => at));
            const to = new Set(ends.filter(([call]) => call === 'lineTo').map(([, at]) => at));
            expect(from).toEqual(to);
            // Each layer's circles alternate in two colours, fainter outward.
            const alpha = (line: string) => Number(/ alpha=([\d.]+)/.exec(line)![1]);
            const layers = lines.slice(2, 14);
            for (let layer = 0; layer < 6; layer++) {
                expect([layers[2 * layer], layers[2 * layer + 1]].map((line) => / style=(\S+)/.exec(line)![1])).toEqual(['#fb00ff', '#9d00ff']);
                expect(alpha(layers[2 * layer])).toBeCloseTo(1 - (layer + 1) / 7, 2);
                expect(layers[2 * layer].match(/arc\(/g)).toHaveLength(3 * (layer + 1));
            }
        },
    },
    {
        title: 'The hover outline frames every effect',
        why: "v1 drew the hover outline round Gentle Pulse only; v2 round every effect, which v3 keeps, the way v1's Gentle Pulse drew it: a rectangle round the body in the hover colour, its glow 15 × Animation.Glow, 1.5 × that while selected.",
        frames: /^nodes-rich\/[234]-.*(selected|hover)/,
        mask: each((line) => (line.startsWith('strokeRect ') ? '' : line)),
        proof() {
            for (let style = 1; style <= 4; style++) {
                // Gentle Pulse in v1's own colours.
                const [stroke, glow] = style === 1 ? ['rgba(255, 255, 21, 0.7)', 'rgba(255, 255, 21, 0.5)'] : ['rgba(0, 255, 21, 0.7)', 'rgba(0, 255, 21, 0.5)'];
                for (const [state, blur] of [['mouseOver', 7.5], ['selected', 11.25]] as const) {
                    const rec = nodeFx(style, { '📦 Enhanced Nodes.Color.Hover.Show': true, '📦 Enhanced Nodes.Selection.Glow': false }, { node: { ...NODE, [state]: true } });
                    const outlines = rec.paints.filter((p) => p.op === 'strokeRect').map((p) => [p.style, p.shadowColor, p.shadowBlur, p.box]);
                    expect(outlines, `style ${style}, ${state}`).toEqual([[stroke, glow, blur, [0, 0, 220, 120]]]);
                }
            }
        },
    },
    {
        title: "Sacred Rosette's particles circle its pattern without the base effect",
        why: "With Show base effect off, v1 handed every effect energy 0 (old_node_animations.js:2088-2099), which only its Flower of Life, v3's Sacred Rosette, read, to size its pattern, so all its dots fell into the node's centre. v3 sizes the pattern as the base effect does, so the dots circle the same points.",
        frames: /^nodes-particles-only\/4-flower-of-life/,
        mask: WHERE,
        proof() {
            const dots = (only: boolean) => nodeFx(4, {}, { only }).paints.filter((p) => p.op === 'fill' && p.style === '#ffb300').map((p) => p.box);
            expect(dots(true)).toEqual(dots(false));
            expect(new Set(dots(true).map((box) => box!.join())).size).toBe(dots(true).length);
        },
    },
    {
        title: 'Neon Nexus begins each hologram outline once',
        why: "v1 began the path of each of its three hologram outlines twice (old_node_animations.js:1438-1452), once itself and once in roundedRect. v3 begins it once, which paints the same.",
        async proof() {
            const v3 = ours(2);
            expect(v3).not.toMatch(/^beginPath\(\)\nbeginPath\(\)$/m);
            if (!HAVE_V1) return;
            const v1 = await own('neonNexus');
            expect(v1.match(/^beginPath\(\)\nbeginPath\(\)$/gm)).toHaveLength(3 * 4);
            expect(canonical(v3)).toBe(canonical(v1));
        },
    },
    {
        title: "Cosmic Ripple's rings ripple going Reverse too",
        why: "v1 placed each ring at (phase × 0.8 − i / 5) % 1 of its way out, and % keeps the sign, so going Reverse, which takes the phase below 0, every ring fell before the centre and none was drawn. v3 takes the phase's size, so the rings ripple out going Reverse as well.",
        async proof() {
            const rings = (phase: number) => nodeFx(3, { '📦 Enhanced Nodes.Particle.Show': false }, { k: { ...NOW, nodePhase: phase } }).trace();
            expect(rings(-2.3)).toBe(rings(2.3));
            expect(rings(-2.3)).toMatch(/^stroke\(\)$/m);
            // Going Reverse, the node phase falls, below 0 from the page's start.
            await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Direction': -1 }, PAIR);
            frames(5);
            const before = clock.nodePhase;
            frames(30);
            expect(clock.nodePhase).toBeLessThan(before);
        },
    },
    {
        title: 'Particle colours keep to their mode',
        why: "With Style colors v1 meant particles to take their node's colour, but it read only 6-digit hex, which native never hands drawNodeShape ('#333' in v1's LiteGraph, an hsla() colour in 1.39.5 and 1.57.1), so they took the style's primary colour as it stood, and Complementary a grey. v3 takes the primary through Color.Scheme, and its opposite hue for Complementary. Quantum and Aurora took their hue from (time × 2 + i / 10) % 1 and (time × 3 + i / 5) % 1, below 0 going Reverse, which turned Quantum's violets blue and Aurora's greens yellow; v3 wraps them round. And the lightness both swing for every particle at once strobed 8 times a second at Particle.Speed 5; v3 swings it at most MAX_FLASH_HZ times.",
        proof() {
            storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Color.Mode': 'default', '📦 Enhanced Nodes.Color.Scheme': 'bright' });
            const pal = nodePalette(2);
            expect(pal.primary).not.toBe('#00ff88');
            expect(pal.particle).toBe(pal.primary);
            const hsl = (colour: string) => /^hsl\(([^,]+), ([^%]+)%, ([^%]+)%\)$/.exec(colour)!.slice(1).map(Number);
            // The primary colour's hue, from its red, green and blue.
            const [r, g, b] = parseColor(pal.primary)!;
            const hue = (Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI;
            expect((((hsl(pal.complement)[0] - hue) % 360) + 360) % 360).toBeCloseTo(180, 0);
            expect(hsl(pal.complement)[1]).toBe(100);
            // At the primary's lightness through the scheme: bright takes Neon Nexus's #00ff88 from 50 % to 62.5 %.
            expect(hsl(pal.complement)[2]).toBeCloseTo(62.5, 0);
            // A custom particle colour's opposite keeps its saturation and lightness as set, as v1's did: #804040 is hsl(0, 33 %, 38 %).
            storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Color.Mode': 'custom', '📦 Enhanced Nodes.Color.Particle': '#804040', '📦 Enhanced Nodes.Color.Scheme': 'bright' });
            const [h, saturation, lightness] = hsl(nodePalette(2).complement);
            expect([h, Number(saturation.toFixed(1)), Number(lightness.toFixed(1))]).toEqual([180, 33.3, 37.6]);
            for (const t of [-0.37, -5.1, -12.6]) {
                storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Particle.Color.Mode': 'quantum' });
                for (let i = 0; i < 20; i++) expect(hsl(particleColour(pal, i, t, 1))[0]).toBeGreaterThanOrEqual(280);
                storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Particle.Color.Mode': 'aurora' });
                for (let i = 0; i < 20; i++) expect(hsl(particleColour(pal, i, t, 1))[0]).toBeGreaterThanOrEqual(120);
            }
            // Gentle Pulse's particles at Particle.Speed 5 run their colour time TURN × 25 a second; two seconds at 60 Hz.
            const rate = TURN * 5 * 5;
            for (const mode of ['quantum', 'aurora']) {
                storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Particle.Color.Mode': mode });
                const lightness = Array.from({ length: 121 }, (_, f) => hsl(particleColour(pal, 0, rate * (f / 60), rate))[2]);
                expect(turns(lightness) / 2, mode).toBeLessThanOrEqual(3 * 2);
            }
        },
    },
    {
        title: 'Still node effects hold one pose',
        why: "v1 posed still effects at phase π/4, but left Cosmic Ripple's corona, and the particle colours that run on its time, wherever its clock stopped. v3 always draws v1's first still frame, at time 0: in Static mode and while a run pauses the node effects, as v1 did, and with reduced motion.",
        async proof() {
            for (let style = 1; style <= 4; style++) {
                const still = (k: NodeMoment) => nodeFx(style, { '📦 Enhanced Nodes.Static.Mode': true }, { k }).trace();
                expect(still(NOW), `style ${style}`).toBe(still({ nodePhase: -7, particleTime: 30, nodeTime: 41 }));
                // v1's own still frame: its static pose, π/4, its time at 0.
                if (HAVE_V1) {
                    const nodes = await ownNodes();
                    fake.settings = new Map(Object.entries({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Static.Mode': true }));
                    const v1 = draw((ctx) => drawV1Effect(nodes, NODE_EFFECTS[style - 1][0], ctx, NODE, { phase: Math.PI / 4, particlePhase: 0, totalTime: 0 }));
                    // Sacred Rosette as the circles it strokes (Sacred Rosette closes its rings, and draws its pattern in fewer strokes).
                    const pose = (trace: string) => (style === 4 ? ROSETTE(canonical(trace).split('\n')).join('\n') : canonical(trace));
                    expect(pose(still(NOW)), `style ${style}`).toBe(pose(v1.trace()));
                }
                try {
                    env.running = true;
                    expect(nodeFx(style, {}, { k: NOW }).trace(), `style ${style}, paused`).toBe(still(NOW));
                    env.running = false;
                    env.reducedMotion = true;
                    expect(nodeFx(style, { '📦 Enhanced Nodes.Pause.During.Render': false }, { k: NOW }).trace(), `style ${style}, reduced motion`).toBe(still(NOW));
                } finally {
                    env.running = env.reducedMotion = false;
                }
            }
        },
    },
    {
        title: 'Node effects fade with their node',
        why: "v1 drew some of each effect at the alpha native left for the node, but set alphas of its own for the rest, so a bypassed or muted node kept most of its effect at full strength. v3 scales every alpha an effect draws by the one native draws the node at: 0.2 bypassed, 0.4 muted, 0.3 for a node being placed.",
        proof() {
            for (let style = 1; style <= 4; style++) {
                const settings = { '📦 Enhanced Nodes.Color.Hover.Show': true };
                const node = { ...NODE, selected: true };
                const [full, faded] = [1, 0.2].map((alpha) => nodeFx(style, settings, { node, alpha }).paints.map((p) => p.globalAlpha));
                expect(faded.length).toBe(full.length);
                faded.forEach((a, i) => expect(a, `style ${style}, paint ${i}`).toBeCloseTo(full[i] * 0.2, 9));
            }
        },
    },
    {
        title: 'What an effect draws around its node lies under the other nodes',
        why: "v1 drew each effect whole over its node's body, so the glow, corona or lattice a node drew round itself, and its halo, covered the nodes drawn before it. v3 draws what falls on the body over it, clipped to it, and the halo and what falls around the body before any node.",
        async proof() {
            const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Particle.Show': true }, { nodes: [{ pos: [100, 100] }, { pos: [250, 150] }] });
            frames(1);
            const lines = canvas.front.lines;
            const bodies = lines.flatMap((line, i) => (line === 'strokeStyle = #333333' ? [i] : []));
            // The corona's motes, each a gradient, before the first body, and on the bodies only within their clips.
            const motes = lines.flatMap((line, i) => (/^grad\d+ = createRadialGradient/.test(line) ? [i] : []));
            expect(motes.filter((i) => i < bodies[0]).length).toBeGreaterThan(0);
            for (const i of motes.filter((m) => m > bodies[0])) expect(lines.lastIndexOf('clip()', i), `line ${i}`).toBeGreaterThan(bodies[0]);
            // Both halos before the first body: fills whose shadow, offset back from off the screen, lands on their node.
            const halos = lines.flatMap((line, i) => (/^shadowOffsetX = -\d+$/.test(line) ? [i] : []));
            expect(halos).toHaveLength(2);
            expect(halos[1]).toBeLessThan(bodies[0]);
        },
    },
    {
        title: "Nodes with no effect but particles get Gentle Pulse's fireflies",
        why: "v1 drew nothing on a node whose style was None. v2 gave such nodes fireflies with Node particles on, which v3 keeps: Gentle Pulse's, without its base effect.",
        async proof() {
            expect(nodeFx(0, { '📦 Enhanced Nodes.Animate': 0, '📦 Enhanced Nodes.Color.Mode': 'default' }, { only: true }).trace())
                .toBe(nodeFx(1, { '📦 Enhanced Nodes.Color.Mode': 'default' }, { only: true }).trace());
            const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 0, '📦 Enhanced Nodes.Particle.Show': true }, { nodes: [{ pos: [100, 100] }] });
            frames(1);
            expect(canvas.front.paints.filter((p) => p.op === 'fill' && p.style === '#44aaff').length).toBeGreaterThan(0);
        },
    },
    {
        title: "The halo and the frame keep to native's node drawing",
        why: "v1 swapped the shadow native gives a node for its halo, but with the halo off it took that shadow away too; v3 leaves native's shadow alone. Like v1, v3 casts the halo zoomed out too, where native draws no shadow, down to Perf.MinZoom. v1's selection frame and its effects' glows took native's shadow offset, 2 × the zoom, as v1 reset only the shadow's colour and blur after the body (old_node_animations.js:2084-2085), and its frame the full alpha native's selection outline leaves behind; v3 centres them all, and the frame fades with its node, as the effects do.",
        async proof() {
            const graph: GraphSpec = { nodes: [{ pos: [100, 100] }, { pos: [500, 100], mode: 4 }] };
            const bodies = async (settings: Record<string, unknown>, lowQuality = false) => {
                const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Particle.Show': false, ...settings }, graph);
                canvas.low_quality = lowQuality;
                for (const node of canvas.graph._nodes) node.selected = true;
                frames(1);
                return canvas.front.paints;
            };
            const fills = (paints: CanvasRecorder['paints']) => paints.filter((p) => p.op === 'fill' && p.style === '#353535').map((p) => [p.shadowColor, p.shadowBlur]);
            // The halos in Neon Nexus's primary colour, 10 × Glow (0.5), under the effects; the bodies cast none.
            expect(fills(await bodies({}))).toEqual([['#00ff88', 5], ['#00ff88', 5], ['rgba(0, 0, 0, 0)', 3], ['rgba(0, 0, 0, 0)', 3]]);
            expect(fills(await bodies({ '📦 Enhanced Nodes.Glow.Show': false }))).toEqual([['rgba(0, 0, 0, 0.5)', 3], ['rgba(0, 0, 0, 0.5)', 3]]);
            expect(fills(await bodies({}, true)).map(([colour]) => colour)).toEqual(['#00ff88', '#00ff88', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)']);
            // The frame: in the secondary colour, glowing 45 × Glow in the accent, centred, at each node's alpha, round each side of its edge.
            const frames_ = (await bodies({})).filter((p) => p.op === 'strokeRect').map((p) => [p.style, p.shadowColor, p.shadowBlur, p.shadowOffsetX, p.shadowOffsetY, p.globalAlpha]);
            expect(frames_).toEqual([['#00ffcc', '#00ff44', 22.5, 0, 0, 1], ['#00ffcc', '#00ff44', 22.5, 0, 0, 0.2], ['#00ffcc', '#00ff44', 22.5, 0, 0, 1], ['#00ffcc', '#00ff44', 22.5, 0, 0, 0.2]]);
            // And every glow the effects draw, past native's body and the halo.
            const glows = (await bodies({})).filter((p) => p.style !== '#353535' && p.shadowBlur > 0 && parseColor(p.shadowColor)![3] > 0);
            expect(glows.length).toBeGreaterThan(10);
            expect(glows.filter((p) => p.shadowOffsetX || p.shadowOffsetY)).toEqual([]);
        },
    },
    {
        title: "A node's own effect takes its own style's colours",
        why: "v1 drew every node in the colours of the style Node effect picks (getCustomColors, old_node_animations.js:795-835), as its nodes had no style of their own. A node given its own in Node FX takes that style's colours in Style colors mode, for its effect, halo, frame, particles and title. The fireworks keep Node effect's, as v1's took them.",
        async proof() {
            const canvas = await start({ ...FIREWORKS, '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Color.Mode': 'default' }, RUN);
            const [, own] = canvas.graph._nodes;
            own.properties.enhanced_fx_style = 3;
            for (const node of canvas.graph._nodes) node.selected = true;
            frames(1);
            const paints = canvas.front.paints;
            // Neon Nexus's halo and frame, then Cosmic Ripple's, then Neon Nexus's again.
            expect(paints.filter((p) => p.op === 'fill' && p.shadowOffsetX < 0).map((p) => p.shadowColor)).toEqual(['#00ff88', '#ff00ff', '#00ff88']);
            expect([...new Set(paints.filter((p) => p.op === 'strokeRect').map((p) => p.style))]).toEqual(['#00ffcc', '#aa00ff']);
            // Over the node with its own effect, Neon Nexus's secondary and accent.
            const made = offscreens.length;
            run('own colours', [2]);
            frames(5);
            const stops = offscreens.slice(made).flatMap((sprite) => sprite.lines.filter((line) => line.includes('.addColorStop(0, ')).map((line) => line.slice(line.indexOf(', ') + 2, -1)));
            expect(stops).toEqual(expect.arrayContaining(['#00ffcc', '#00ff44']));
            expect(stops.filter((stop) => stop === '#aa00ff' || stop === '#ff40ff')).toEqual([]);
        },
    },
    {
        title: 'Collapsed nodes have no effect',
        why: "v1 drew each effect on a collapsed node too, squeezed to the size drawNodeShape hands over for it (its collapsed width by 0), with its halo. v3 leaves a collapsed node as native draws it, shadow and all (__traces__/v3/nodes-bypassed-collapsed.txt).",
        async proof() {
            const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Particle.Show': true }, { nodes: [{ pos: [100, 100], collapsed: true }] });
            frames(1);
            expect(canvas.front.paints.filter((p) => p.op === 'fill').map((p) => [p.style, p.shadowColor])).toEqual([['#353535', 'rgba(0, 0, 0, 0.5)']]);
            expect(canvas.front.lines.filter((line) => line.includes('Gradient('))).toEqual([]);
            expect(live.nodes + live.particles).toBe(0);
        },
    },
    {
        title: 'Titles sit where native draws its title',
        why: "v1 drew its title centred 16 px into the node, in 14 px Arial, over the native title, which still showed in the title bar. v3 draws it in the native title's place, in its stead: native's own text, with its pin and cut to the room native leaves it, left-aligned after the title box and on the title bar's middle, in Title size of native's font (Inter), while native draws its own on a canvas nobody sees. Its glow is never offset, as v1's was not, whatever shadow native set; Title rotation turns it about its middle, as v1's centred title turned.",
        frames: /^text\//,
        mask: each(leftAligned),
        async proof() {
            const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Text.Animation.Enabled': true, '📦 Enhanced Nodes.Text.Style': 'pulse', '📦 Enhanced Nodes.Text.Rotation.Angle': 90 }, {
                nodes: [{ pos: [100, 100], size: [140, 80], title: 'A long title for a narrow node' }],
            });
            canvas.graph._nodes[0].flags.pinned = true;
            frames(1);
            const hidden = offscreens.find((rec) => rec.ctx === dummy())!;
            const before = hidden.lines.length;
            canvas.setDirty(true, true);
            frames(1);
            // One title on screen: native's text, cut as native cuts it with its pin; native's own went to the hidden canvas.
            expect(filled(canvas.front).slice(-1)).toEqual(['fillText("A long t...", 30, -15)']);
            expect(filled(canvas.front).filter((line) => line.endsWith(', -10)'))).toEqual([]);
            expect(hidden.lines.slice(before).filter((line) => line.startsWith('fillText('))).toEqual(['fillText("A long t...", 30, -10)']);
            const title = canvas.front.paints.filter((p) => p.op === 'fillText').at(-1)!;
            expect([title.shadowOffsetX, title.shadowOffsetY]).toEqual([0, 0]);
            const line = canonical(canvas.front.trace()).split('\n').filter((l) => l.startsWith('fillText')).at(-1)!;
            expect(line).toContain('font=14px Inter align=left baseline=middle');
            // Eleven characters, 77 px in the recorder's font: turned about x 68.5.
            expect(line).toContain('translate(68.5, -15) rotate(1.57) translate(-68.5, 15)');
        },
    },
    {
        title: 'Titles keep their style apart from the node effect',
        why: "v1 drew its title in its drawNodeShape along with the node's effect, so a node without one had no styled title, and with Show base effect off it drew the title plainly. v3 restyles the title of every titled node while Animated titles is on, effect or not, and moves it, so the setting works with Node effect None, its default.",
        async proof() {
            for (const settings of [{ '📦 Enhanced Nodes.Animate': 0 }, { '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Animations.Enabled': false }]) {
                const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Text.Animation.Enabled': true, ...settings }, { nodes: [{ pos: [100, 100], title: 'KSampler' }] });
                frames(3);
                // Neon's three glowing layers and its highlight, as Title glow 0.5 has them.
                expect(canvas.front.paints.filter((p) => p.op === 'fillText').slice(-4).map((p) => p.shadowBlur), JSON.stringify(settings)).toEqual([10, 5, 2.5, 3]);
                expect(live.nodes).toBe(1);
            }
        },
    },
    {
        title: "Title letter spacing is the canvas's own",
        why: "v1 spread its title with hair spaces between the characters, more the wider the spacing, so a negative spacing spread it too, and measureText, and so Minimal's underline, left the spaces out. v3 sets the canvas's letterSpacing to Title letter spacing in px: a negative one draws the title tighter, and the room native leaves it and the underline are measured on the text as it is drawn. A canvas without letterSpacing draws the title unspaced.",
        proof() {
            storeSettings({ ...V1_NODE_SETTINGS, '📦 Enhanced Nodes.Text.Style': 'minimal', '📦 Enhanced Nodes.Text.Letter.Spacing': -1.5 });
            const rec = draw((ctx) => drawTitle(ctx, { text: 'KSampler', width: 44 }, 30, -15, '#00ffff', 0, 1));
            expect(rec.lines).toContain('letterSpacing = -1.5px');
            expect(filled(rec)).toEqual(['fillText("KSampler", 30, -15)']);
            expect(rec.lines).toEqual(expect.arrayContaining(['moveTo(30, -5)', 'lineTo(74, -5)']));
        },
    },
    {
        title: "Fireworks are seeded: each spark keeps its speed, colour and trail",
        why: "v1 drew each spark's speed, colour and trail, and each sparkle, from Math.random() anew every frame, so its bursts were a glitter of points jumping about rather than sparks flying out. v3 draws them once a show from a stream seeded by the run and the node, so each spark flies out on its own path, at its own speed and in its own colour, as v1's formulas move it. It leaves out what v1 drew fully transparent.",
        frames: /^nodes\/fireworks/,
        mask: each((line) => (CORE.test(line) && !unseen(line) ? line : '')),
        async proof() {
            // Each node of a run its own show, and the same one each time the run is played.
            const speeds = async (prompt: string) => {
                await start(FIREWORKS, RUN);
                run(prompt, [1, 2]);
                // The sparks of the first burst over each node: its bursts are the owners 0 to 2, the other's 3 to 5.
                return [0, 3].map((owner) => Array.from(pool.speed.subarray(0, pool.count)).filter((_, i) => pool.owner[i] === owner && pool.kind[i] === 1));
            };
            const [first, second] = await speeds('two nodes');
            expect(first).toHaveLength(250);
            expect(first).not.toEqual(second);
            expect(await speeds('two nodes')).toEqual([first, second]);
            const random = vi.spyOn(Math, 'random');
            const v3 = traceFireworks('').trace();
            expect(random).not.toHaveBeenCalled();
            // The show v1 drew: three bursts, each a core, 250 sparks and 40 sparkles, some sparks with up to three trailing.
            const kinds = Array.from(pool.kind.subarray(0, pool.count));
            expect([0, 1, 2].map((kind) => kinds.filter((k) => k === kind).length)).toEqual([3, 750, 120]);
            expect(new Set(pool.trail.subarray(0, pool.count))).toEqual(new Set([0, 1, 2, 3]));
            if (!HAVE_V1) return;
            // v1's own fireworks, with Math.random handing out v3's numbers in the order v1 asks for them each frame: for each
            // burst that has gone off, each spark's speed, colour and whether it trails, then each sparkle's heading, distance and size.
            const sequence = (phase: number) => {
                const values: number[] = [];
                for (let i = 0; i < pool.count; i++) {
                    const t = phase - pool.owner[i] * 0.1;
                    if (t <= 0) continue;
                    if (pool.kind[i] === 1) values.push((pool.speed[i] - 0.3) / 0.7, (pool.colour[i] + 0.5) / 4, pool.trail[i] ? 0 : 0.999);
                    if (pool.kind[i] === 2 && t < 0.3 && pool.seq[i] < Math.floor(40 * (1 - t / 0.3))) values.push(pool.angle[i] / (2 * Math.PI), pool.speed[i], pool.size[i]);
                }
                let next = 0;
                return () => values[next++];
            };
            const nodes = await ownNodes();
            storeSettings(V1_NODE_SETTINGS);
            const v1 = traceFrames('', FIREWORK_PHASES.map((phase) => [`completionPhase=${phase}`, (ctx) => {
                vi.mocked(Math.random).mockImplementation(sequence(phase));
                nodes.AnimationEffects.renderCompleteFireworks(ctx, phase, 1);
            }])).trace();
            const seen = (trace: string) => canonical(trace).split('\n').filter((line) => !unseen(line));
            expect(seen(v3)).toEqual(seen(v1));
        },
    },
    {
        title: "Fireworks play over the run's output nodes, at one size on screen",
        why: "v1 burst over every node whenever the queue emptied, for anyone's run (its 'status' event), from each node's drawNodeShape, so later nodes covered its bursts, and it placed and sized them by the canvas in graph space, so zooming out shrank them. v3 bursts when this client's own run succeeds (execution_success, which ComfyUI sends only to the client that queued it), over the nodes whose Completion FX makes them primary and the output nodes the run reached, but not those it excludes, the three nearest the middle of the view, and over all the nodes. It places and sizes them in the view's terms, so at any zoom they are as large on screen as v1's at zoom 1.",
        async proof() {
            const canvas = await start(FIREWORKS, RUN);
            // The queue emptying, which v1 burst on, is not a run of this client's.
            queue(1);
            queue(0);
            frames(5);
            expect(live.bursts).toBe(0);
            // Output node 1 and plain node 3 ran; output node 2 did not.
            run('reached', [1, 3]);
            // Till the third burst has gone off, a fifth of the show in.
            frames(20);
            const from = canvas.front.lines.length;
            canvas.setDirty(true, false);
            canvas.draw();
            const shown = cores(canvas, from);
            expect(shown.map(([x, y]) => [x, y])).toEqual([[380, 220], [348, 265], [396, 265]]);
            // Over every node: after the last body.
            expect(canvas.front.lines.lastIndexOf('fillStyle = #353535')).toBeLessThan(canvas.front.lines.findIndex((line, i) => i >= from && line.startsWith('grad') && line.includes('createRadialGradient')));
            // The same moment at half the zoom: as far off the node and as large on screen.
            canvas.ds.scale = 0.5;
            const half = canvas.front.lines.length;
            canvas.setDirty(true, false);
            canvas.draw();
            expect(cores(canvas, half).map(([x, y, r]) => [fmt((x - 300) * 0.5), fmt((y - 400) * 0.5), fmt(r * 0.5)])).toEqual(shown.map(([x, y, r]) => [fmt(x - 300), fmt(y - 400), fmt(r)]));
            // Completion FX: over a primary node the run did not reach, none over one excluded; with End Animation off, none.
            for (const ended of [true, false]) {
                // The node excluded stands where no other node does.
                const again = await start({ ...FIREWORKS, '📦 Enhanced Nodes.End Animation.Enabled': ended }, { nodes: [...RUN.nodes, { pos: [1200, 900], output: true }] });
                again.graph._nodes[1].properties.enhanced_fx_completion = 'primary';
                again.graph._nodes[3].properties.enhanced_fx_completion = 'exclude';
                run(`set ${ended}`, [1, 4]);
                frames(5);
                const xs = new Set(cores(again).map(([x]) => x - 80));
                expect([...xs].sort(), `End Animation ${ended}`).toEqual(ended ? [300, 900] : []);
            }
        },
    },
    {
        title: 'Firework sparks are stamped from sprites',
        why: "v1 made a gradient for every spark each frame, 750 a frame with three bursts in the air, and a fill for each of their trails. While a show plays, v3 stamps each spark and trail from a sprite of v1's own disc, painted once a colour and size, at the spark's alpha; the cores, three a show, keep their gradients. The traces draw the discs as v1 did.",
        async proof() {
            const canvas = await start(FIREWORKS, RUN);
            // A setting change drops the sprites earlier shows cast.
            preview('📦 Enhanced Nodes.Glow', 0.4);
            preview('📦 Enhanced Nodes.Glow', 0.5);
            const made = offscreens.length;
            run('sprites', [1]);
            frames(5);
            const from = canvas.front.paints.length;
            const lines = canvas.front.lines.length;
            frames(1);
            const painted = canvas.front.paints.slice(from);
            expect(painted.filter((p) => p.op === 'drawImage').length).toBeGreaterThan(500);
            expect(painted.filter((p) => p.op === 'fill' && p.composite === 'lighter').length).toBe(cores(canvas, lines).length);
            // Each sprite a disc in one colour: soft, falling to half its alpha at the rim, or flat.
            const sprites = offscreens.slice(made).filter((rec) => rec.paints.length === 1 && rec.paints[0].op === 'fill');
            expect(sprites.length).toBeGreaterThan(10);
            for (const sprite of sprites) {
                const stops = sprite.lines.filter((line) => line.includes('.addColorStop(')).map((line) => line.slice(line.indexOf(', ') + 2, -1));
                if (!stops.length) continue;
                const [r, g, b] = parseColor(stops[0])!;
                expect(stops).toEqual([`#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`, `rgba(${r}, ${g}, ${b}, 0.5)`, `rgba(${r}, ${g}, ${b}, 0)`]);
            }
        },
    },
    {
        title: 'With reduced motion, fireworks are one soft glow',
        why: "v1 drew its fireworks whatever the system asked for. With reduced motion (the system's, or ComfyUI's Disable animations) v3 ends a run with one soft glow over each anchor instead, fading in and out once over the show.",
        async proof() {
            const canvas = await start(FIREWORKS, RUN);
            fake.reducedMotion.matches = true;
            fake.reducedMotion.dispatchEvent(new Event('change'));
            run('calm', [1, 2]);
            const alphas: number[] = [];
            for (let i = 0; i < 80; i++) {
                const [from, lines] = [canvas.front.paints.length, canvas.front.lines.length];
                frames(1);
                const glows = canvas.front.paints.slice(from).filter((p) => p.composite === 'lighter');
                if (!glows.length) continue;
                expect(glows.length).toBe(2);
                const stop = canvas.front.lines.slice(lines).find((line) => line.includes('.addColorStop(0, '))!;
                alphas.push(parseColor(stop.slice(stop.indexOf(', ') + 2, -1))![3]);
            }
            expect(alphas.length).toBeGreaterThan(60);
            expect(turns(alphas)).toBe(1);
            expect(Math.max(...alphas)).toBeLessThanOrEqual(0.5);
            expect(live.bursts).toBe(0);
        },
    },
];
