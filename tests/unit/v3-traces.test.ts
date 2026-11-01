/**
 * Traces of what v3 draws that v1 had no trace of: the merkaba marker and the
 * stroked spiral, markers over another animation (Marker.All), v2's drop
 * shadow (Shadow.Style drop), Classic Flow on Wave and Coil links, and a node
 * effect on a bypassed node beside a collapsed one. They are v3's own
 * snapshots, in __traces__/v3: `vitest -u` on this file rewrites them, after a
 * change to what they show has been checked.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { clock } from '@/core/engine';
import { palette } from '@/core/colors';
import { MOVING } from '@/links/animations';
import { Segment } from '@/links/pipeline';
import { STILL } from '@/links/stills';
import { drawBase, drawMarkers } from '@/links/styles';
import { frames, start } from '../helpers/fake-litegraph';
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
        const k = { linkPhase: -PHI2 * t, quantumPhase: -PHI2 * t, linkFlow: 2 * t };
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
