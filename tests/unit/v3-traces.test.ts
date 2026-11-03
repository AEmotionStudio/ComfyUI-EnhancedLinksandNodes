/**
 * Traces of what v3 draws that v1 had no trace of: the merkaba marker and the
 * stroked spiral, markers over another animation (Marker.All), v2's drop
 * shadow (Shadow.Style drop), Classic Flow on Wave and Coil links, and a node
 * effect on a bypassed node beside a collapsed one, and the completion styles
 * after the fireworks: confetti, the shockwave and the path trace's comet,
 * along a link through a reroute too; rope and whip wires at rest; v3's own
 * link animations, Merkaba Beads, DNA Helix 3D and Comet Trails; and connection
 * assist's guide line, gloves and eyes over a dragged link. They are v3's own
 * snapshots, in __traces__/v3: `vitest -u` on this file rewrites them, after a
 * change to what they show has been checked.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock, layers } from '@/core/engine';
import { drawBursts, endBursts, play, type Anchor, type Style } from '@/fx/bursts';
import { drawFlows, stepInto } from '@/fx/execution';
import { palette } from '@/core/colors';
import { MOVING } from '@/links/animations';
import { Segment } from '@/links/pipeline';
import { Wire, rest } from '@/links/physics';
import { STILL } from '@/links/stills';
import { drawBase, drawMarkers } from '@/links/styles';
import { frames, run, start } from '../helpers/fake-litegraph';
import { CanvasRecorder } from '../helpers/recording-context';
import { V1_LINK_SETTINGS, V1_NODE_SETTINGS, storeSettings, traceFrames } from './characterize/v1-inputs';

const [LEFT, RIGHT, SPLINE] = [3, 4, 2];
const PHI2 = ((1 + Math.sqrt(5)) / 2) ** 2;
const TIMES = [0, 0.4, 0.9, 1.9];
/** Two frames are enough where most of what is drawn holds still: long paths, many-point markers. */
const FEW = [0, 0.9];

/** v1's two short and long links, along native's spline, as the pipeline records them for the Link.Style. */
function links(linkStyle = 'spline'): Segment[] {
    return ([[[100, 100], [260, 100], '#64B5F6'], [[100, 220], [760, 520], '#FF9CF9']] as const).map(([a, b, colour]) => {
        const s = new Segment();
        s.path.set(a, b, RIGHT, LEFT, SPLINE);
        s.len = s.chain = s.path.length;
        if (linkStyle === 'zigzag' || linkStyle === 'coil') s.path.bend(linkStyle === 'coil', 0, true, true);
        s.pal = palette(colour)!;
        s.linkStyle = linkStyle;
        return s;
    });
}

/** Frames at `times` going Forward at speed 1, each drawing the links' bases, the animation and the markers. */
function moving(title: string, animate: number, { linkStyle = 'spline', markers = animate === 9, times = TIMES } = {}) {
    return traceFrames(title, times.map((t) => [`t=${t}s`, (ctx) => {
        const k = { linkPhase: -PHI2 * t, quantumPhase: -PHI2 * t, linkFlow: 2 * t, linkDir: 1 };
        for (const s of links(linkStyle)) {
            drawBase(ctx, s, animate, false);
            MOVING[animate]?.(ctx, s, k);
            if (markers) drawMarkers(ctx, s, k.linkPhase, k.linkFlow);
        }
    }]));
}

function still(title: string, animate: number, markers = animate === 9) {
    return traceFrames(title, [['phase=9pi/4', (ctx) => {
        for (const s of links()) {
            drawBase(ctx, s, animate, true);
            STILL[animate]?.(ctx, s, (9 * Math.PI) / 4);
            if (markers) drawMarkers(ctx, s, (9 * Math.PI) / 4);
        }
    }]]);
}

/** The view the completion styles are drawn on: 1600 × 900 at zoom 1, a node on it and the view's middle. */
const graph = {};
const VIEW = { visible_area: new Float32Array([0, 0, 1600, 900]), ds: { scale: 1 }, graph } as unknown as Parameters<typeof drawBursts>[0];
const NODE: Anchor = { id: 1, pos: [600, 400], graph, boundingRect: [600, 370, 240, 130] } as unknown as Anchor;
const MIDDLE: Anchor = { id: 'view', pos: [800, 450], graph } as unknown as Anchor;

/** A show of `style` over `anchors`, drawn `times` s in. */
function completion(title: string, style: Style, anchors: Anchor[], times: number[]) {
    storeSettings({});
    endBursts();
    play(style, anchors, 'v3 trace');
    const rec = traceFrames(title, times.map((t) => [`t=${t}s`, (ctx) => {
        clock.burstTime = t;
        drawBursts(VIEW, ctx);
    }]));
    endBursts();
    return rec;
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('v3 traces', () => {
    for (const shape of ['merkaba', 'spiral']) {
        it(`${shape} markers, with each effect`, async () => {
            const traces = ['none', 'pulse', 'fade', 'rainbow'].map((effect) => {
                storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Marker.Shape': shape, '🔗 Enhanced Links.Marker.Effects': effect });
                return moving(`Classic Flow, ${shape} markers, ${effect}`, 9, { times: FEW }).trace() + still(`Classic Flow still, ${shape} markers, ${effect}`, 9).trace();
            });
            await expect(traces.join('')).toMatchFileSnapshot(`__traces__/v3/markers-${shape}.txt`);
        });
    }

    it('markers over Crystal Stream and over a still Quantum Field (Marker.All)', async () => {
        storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Marker.All': true, '🔗 Enhanced Links.Marker.Shape': 'diamond' });
        await expect(moving('Crystal Stream with markers', 2, { markers: true }).trace() + still('Quantum Field still with markers', 3, true).trace())
            .toMatchFileSnapshot('__traces__/v3/marker-all.txt');
    });

    it("Classic Flow's drop shadow (Shadow.Style drop)", async () => {
        storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Shadow.Style': 'drop', '🔗 Enhanced Links.Shadow.Blur': 5, '🔗 Enhanced Links.Shadow.Offset': 3 });
        await expect(moving('Classic Flow, drop shadow', 9).trace()).toMatchFileSnapshot('__traces__/v3/shadow-drop.txt');
    });

    for (const [style, name] of [['zigzag', 'wave'], ['coil', 'coil']]) {
        it(`Classic Flow along ${name} links`, async () => {
            storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Link.Style': style });
            await expect(moving(`Classic Flow, Link.Style ${style}`, 9, { linkStyle: style, times: FEW }).trace()).toMatchFileSnapshot(`__traces__/v3/path-${name}.txt`);
        });
    }

    it('confetti over a node', async () => {
        await expect(completion('Confetti over a node', 'confetti', [NODE], [0.3, 1, 1.8]).trace()).toMatchFileSnapshot('__traces__/v3/completion-confetti.txt');
    });

    it('a shockwave over a node, and over the middle of the view a third of a second later', async () => {
        await expect(completion('Shockwave over a node, then the middle', 'shockwave', [NODE, MIDDLE], [0.1, 0.4, 0.65, 0.9]).trace())
            .toMatchFileSnapshot('__traces__/v3/completion-shockwave.txt');
    });

    it("the path trace's comet along the links into the nodes that ran, the second through a reroute, in the order they ran", async () => {
        await start({ '🔗 Enhanced Links.Animate': 0, '🔗 Enhanced Links.Flow.River': false, '🔗 Enhanced Links.Flow.Trail': false, '📦 Enhanced Nodes.Completion.Style': 'trace' }, {
            nodes: [{ pos: [100, 100] }, { pos: [400, 100] }, { pos: [800, 500], output: true }],
            links: [{ from: 0, to: 1 }, { from: 1, to: 2 }],
        });
        frames(1);
        run('v3 trace', [1, 2, 3]);
        frames(1);
        // Into the second node, then into the third through a reroute at (500, 400).
        const segments = ([[[100, 100], [260, 100], 2], [[260, 220], [500, 400], 3], [[500, 400], [760, 520], 3]] as const).map(([a, b, target]) => {
            const s = new Segment();
            s.path.set(a, b, RIGHT, LEFT, SPLINE);
            s.len = s.path.length;
            s.flow = stepInto({ target_id: target });
            return s;
        });
        segments[0].chain = segments[0].len;
        segments[2].u0 = segments[1].len;
        segments[1].chain = segments[2].chain = segments[1].len + segments[2].len;
        await expect(traceFrames('Path trace', [0.2, 0.45, 0.7, 0.95].map((p) => [`p=${p}`, (ctx) => {
            clock.burstTime = p * 1.5;
            drawFlows(ctx, segments);
        }])).trace()).toMatchFileSnapshot('__traces__/v3/completion-trace.txt');
        endBursts();
    });

    it('a rope and a whip wire at rest, drawn with Animation None and with Classic Flow held still', async () => {
        const traces: string[] = [];
        for (const profile of ['rope', 'whip']) {
            for (const animate of [0, 9]) {
                const canvas = await start({ '🔗 Enhanced Links.Physics.Profile': profile, '🔗 Enhanced Links.Animate': animate, '🔗 Enhanced Links.Static.Mode': true }, {
                    nodes: [{ pos: [100, 100] }, { pos: [500, 260] }],
                    links: [{ from: 0, to: 1 }],
                });
                const from = canvas.back.lines.length;
                frames(1);
                traces.push(`# ${profile}, ${animate ? 'Classic Flow' : 'Animation None'}: the background pass\n${canvas.back.lines.slice(from).join('\n')}\n`);
            }
        }
        await expect(traces.join('')).toMatchFileSnapshot('__traces__/v3/physics-wires.txt');
    });

    it('Merkaba Beads, DNA Helix 3D and Comet Trails, moving and still, along a spline, a link through a reroute and a rope wire', async () => {
        storeSettings({ '🔗 Enhanced Links.Physics.Profile': 'rope' });
        /** v1's short link, a link through a reroute at (300, 560) and a rope wire at rest, as the pipeline lays them. */
        const laid = () => {
            const segment = (a: [number, number], b: [number, number], colour: string) => {
                const s = new Segment();
                s.path.set(a, b, RIGHT, LEFT, SPLINE);
                s.len = s.chain = s.path.length;
                s.pal = palette(colour)!;
                s.linkStyle = 'spline';
                return s;
            };
            const [into, out] = [segment([100, 460], [300, 560], '#FF9CF9'), segment([300, 560], [480, 500], '#FF9CF9')];
            out.u0 = into.len;
            into.chain = out.chain = into.len + out.len;
            into.t1 = out.t0 = into.len / into.chain;
            const wire = segment([560, 100], [860, 220], '#64B5F6');
            rest(new Wire(), wire.path);
            wire.len = wire.chain = wire.path.length;
            return [segment([100, 100], [260, 100], '#64B5F6'), into, out, wire];
        };
        const traces = [[10, 'Merkaba Beads'], [11, 'DNA Helix 3D'], [12, 'Comet Trails']].map(([animate, name]) => traceFrames(name as string, [
            ...[0.4, 1.9].map((t): Parameters<typeof traceFrames>[1][number] => [`t=${t}s`, (ctx) => {
                const k = { linkPhase: -PHI2 * t, quantumPhase: -PHI2 * t, linkFlow: 2 * t, linkDir: 1 };
                for (const s of laid()) {
                    drawBase(ctx, s, animate as number, false);
                    MOVING[animate as number](ctx, s, k);
                }
            }]),
            ['still, phase=9pi/4', (ctx) => {
                for (const s of laid()) {
                    drawBase(ctx, s, animate as number, true);
                    STILL[animate as number](ctx, s, (9 * Math.PI) / 4);
                }
            }],
        ]).trace());
        await expect(traces.join('')).toMatchFileSnapshot('__traces__/v3/animations-v3.txt');
    });

    it('connection assist over a link dragged from an IMAGE output: the guide line, the open, reaching and clasped hands, and the eyes', async () => {
        type Point = [number, number];
        /** The end far off, 133 px from the IMAGE input at (510, 214), 60 px from it, and held on it by native with the pointer by it. */
        const poses: [string, Point, Point?][] = [['far', [200, 400]], ['133 px', [400, 140]], ['60 px', [460, 180]], ['snapped', [470, 230], [510, 214]]];
        const traces: string[] = [];
        for (const mode of ['line', 'hands', 'hands-eyes']) {
            const canvas = await start({ '🔗 Enhanced Links.Animate': 0, '🔗 Enhanced Links.Assist.Mode': mode }, { nodes: [{ pos: [100, 100] }, { pos: [500, 200] }] });
            const [source, target] = canvas.graph._nodes;
            source.outputs = [{ name: 'out', links: [], type: 'IMAGE' }];
            target.inputs = [{ name: 'image', link: null, type: 'IMAGE' }];
            LGraphCanvas.link_type_colors.IMAGE = '#64B5F6';
            frames(1);
            Object.assign(canvas.linkConnector, { isConnecting: true, state: { connectingTo: 'input' } });
            canvas.linkConnector.renderLinks.push({ node: source, fromSlot: source.outputs[0] as { type: string }, fromPos: source.getOutputPos(0) });
            traces.push(traceFrames(`Assist ${mode}`, poses.map(([name, at, held]) => [`${name}, 0.6 s in`, (ctx) => {
                [canvas.graph_mouse, canvas._highlight_pos] = [at, held];
                // The pose starts at 10 s, as the drag did, and has popped in by 10.6 s.
                clock.assistTime = 10;
                layers.assist!(canvas as never, new CanvasRecorder().ctx);
                clock.assistTime = 10.6;
                layers.assist!(canvas as never, ctx);
            }])).trace());
        }
        await expect(traces.join('')).toMatchFileSnapshot('__traces__/v3/assist.txt');
    });

    it('Cosmic Ripple on a bypassed node, and on a collapsed one, which draws neither its effect nor its halo', async () => {
        const canvas = await start({ ...V1_NODE_SETTINGS, '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 3 }, {
            nodes: [{ pos: [100, 100], mode: 4, title: 'Bypassed' }, { pos: [500, 100], collapsed: true, title: 'Collapsed' }],
        });
        [clock.nodePhase, clock.particleTime, clock.nodeTime] = [2.1, 3.3, 3.3];
        const from = canvas.front.lines.length;
        frames(1);
        await expect(`# One front pass: the bypassed node at 0.2, the collapsed one native\n${canvas.front.lines.slice(from).join('\n')}\n`)
            .toMatchFileSnapshot('__traces__/v3/nodes-bypassed-collapsed.txt');
    });
});
