/**
 * The flow markers (src/links/styles.ts drawMarkers): every Marker.Shape and
 * every Marker.Effects value together, on Classic Flow and, with Marker.All,
 * on the other animations; their shadows by Shadow.Style; and their colours by
 * Marker.Color.Mode.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { palette, rainbow } from '@/core/colors';
import { L, SETTINGS, preview } from '@/core/settings';
import { Segment } from '@/links/pipeline';
import { drawMarkers } from '@/links/styles';
import { CanvasRecorder } from '../helpers/recording-context';
import { V1_LINK_SETTINGS, storeSettings } from './characterize/v1-inputs';

const [LEFT, RIGHT, SPLINE] = [3, 4, 2];
const SHADOW = 'rgba(0, 0, 0, 0.95)';

/** The option values of a combo setting. */
const options = (id: string) => SETTINGS.flatMap((s) => (s.id === id && s.type === 'combo' ? s.options.map((o) => String(o.value)) : []));

function link(colour = '#64b5f6'): Segment {
    const s = new Segment();
    s.path.set([100, 100], [500, 300], RIGHT, LEFT, SPLINE);
    s.len = s.chain = s.path.length;
    s.pal = palette(colour)!;
    return s;
}

/** The markers drawn at the phase and flow, or held still without a flow. */
function markers(phase: number, flow?: number): CanvasRecorder {
    const rec = new CanvasRecorder();
    drawMarkers(rec.ctx, link(), phase, flow);
    return rec;
}

beforeEach(() => {
    storeSettings({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Marker.Size': 5, '🔗 Enhanced Links.Quality': 2 });
});

describe('markers', () => {
    it('come in every Marker.Shape but None: filled, or stroked where a shape is a line', () => {
        const stroked = ['cross', 'spiral', 'merkaba'];
        for (const shape of options('🔗 Enhanced Links.Marker.Shape')) {
            preview('🔗 Enhanced Links.Marker.Shape', shape);
            const { paints } = markers(-1, 0.4);
            if (shape === 'none') {
                expect(paints, shape).toEqual([]);
                continue;
            }
            // floor(3 × Quality 2 × Size 5 × density 0.5 × 0.5) markers, each its shadow then itself.
            expect(paints.map((p) => p.op), shape).toEqual(Array(14).fill(stroked.includes(shape) ? 'stroke' : 'fill'));
            expect(paints.map((p) => p.style), shape).toEqual(Array(7).fill([SHADOW, '#64b5f6']).flat());
        }
    });

    it('take each effect with each shape: Pulse with the phase along the link, Fade toward the input, Rainbow through the hues', () => {
        const count = 7;
        const phase = -2.2;
        const flow = 1.3;
        for (const shape of options('🔗 Enhanced Links.Marker.Shape').filter((s) => s !== 'none')) {
            for (const effect of options('🔗 Enhanced Links.Marker.Effects')) {
                preview('🔗 Enhanced Links.Marker.Shape', shape);
                preview('🔗 Enhanced Links.Marker.Effects', effect);
                const rec = markers(phase, flow);
                const at = `${shape}, ${effect}`;
                expect(rec.lines.filter((line) => /ignored|threw|NaN/.test(line)), at).toEqual([]);
                const glows = rec.paints.filter((p) => p.style !== SHADOW);
                const shadows = rec.paints.filter((p) => p.style === SHADOW);
                expect(glows, at).toHaveLength(count);
                glows.forEach((p, i) => {
                    const T = (i / count + flow * 0.1) % 1;
                    const alpha = effect === 'pulse' ? 0.5 + Math.sin(phase + T * Math.PI * 2) * 0.5 : effect === 'fade' ? 1 - T : 1;
                    expect(p.globalAlpha, `${at}, marker ${i}`).toBeCloseTo(alpha, 9);
                    // A shadow as faint as its marker.
                    expect(shadows[i].globalAlpha, `${at}, marker ${i}`).toBe(p.globalAlpha);
                    // Rainbow glows in the link's colour.
                    expect([p.style, p.shadowColor], `${at}, marker ${i}`).toEqual(effect === 'rainbow'
                        ? [rainbow(T * 360 + phase * 50), '#64b5f6']
                        : ['#64b5f6', '#64b5f6']);
                });
            }
        }
    });

    it('hold their places while still, at the start of the link and evenly after it', () => {
        const fills = markers(9 * Math.PI / 4).paints.filter((p) => p.style !== SHADOW);
        const centres = fills.map((p) => [(p.box![0] + p.box![2]) / 2, (p.box![1] + p.box![3]) / 2]);
        expect(centres[0][0]).toBeCloseTo(100, 0);
        expect(centres).toHaveLength(7);
    });

    it('turn a merkaba with the phase', () => {
        preview('🔗 Enhanced Links.Marker.Shape', 'merkaba');
        const turn = (phase: number) => markers(phase, 0).lines.find((line) => line.startsWith('rotate('));
        expect(turn(0)).toBe('rotate(0)');
        expect(turn(-1.25)).toBe('rotate(-1.25)');
    });

    it('take the link type colour, the link colour (Same as link) or their own, each through Color.Scheme once', () => {
        const colours = () => [...new Set(markers(0, 0).paints.filter((p) => p.style !== SHADOW).map((p) => p.style))];
        preview('🔗 Enhanced Links.Color.Mode', 'custom');
        expect(options('🔗 Enhanced Links.Marker.Color.Mode')).toEqual(['default', 'inherit', 'custom']);
        preview('🔗 Enhanced Links.Marker.Color.Mode', 'default');
        expect(colours()).toEqual(['#64b5f6']);
        preview('🔗 Enhanced Links.Marker.Color.Mode', 'inherit');
        expect(colours()).toEqual([L.colorPrimary]);
        preview('🔗 Enhanced Links.Marker.Color.Mode', 'custom');
        expect(colours()).toEqual([L.markerColor]);
        preview('🔗 Enhanced Links.Color.Scheme', 'muted');
        expect(colours()).toEqual([palette('#64b5f6')!.marker]);
        expect(colours()).not.toEqual([L.markerColor]);
    });

    it('sit on a halo as soft as their glow, or on v2\'s drop shadow', () => {
        preview('🔗 Enhanced Links.Marker.Glow', 12);
        preview('🔗 Enhanced Links.Shadow.Blur', 2);
        preview('🔗 Enhanced Links.Shadow.Offset', 4);
        const shadows = () => [...new Set(markers(0, 0).paints.filter((p) => p.style === SHADOW).map((p) => [p.shadowBlur, p.shadowOffsetX, p.shadowOffsetY].join()))];
        expect(shadows()).toEqual(['12,0,0']);
        preview('🔗 Enhanced Links.Shadow.Style', 'drop');
        expect(shadows()).toEqual([[2 * 4, 4 * 3, 4 * 3].join()]);
        preview('🔗 Enhanced Links.Marker.Shadow.Enabled', false);
        expect(shadows()).toEqual([]);
    });

    it('draw nothing when turned off', () => {
        preview('🔗 Enhanced Links.Marker.Enabled', false);
        expect(markers(0, 0).paints).toEqual([]);
    });
});
