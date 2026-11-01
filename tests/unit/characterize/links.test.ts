/**
 * Level A link traces: what v1 drew for three links at fixed times
 * (__traces__/v1, which v1-crosscheck.test.ts checks against v1's own code),
 * against v3's animations, markers and bases driven with v1's inputs along
 * v1's own paths (v1-inputs.ts), compared as level-a.ts says. links-rich/
 * covers other v1 options, one frame each. Each deviation that names these
 * frames must change at least one.
 *
 * v1 drew each link's base and then its motion. The pipeline draws the bases
 * where native draws the links and all the motion over them, so here the two
 * take turns per link, as v1's single pass had them.
 */

import { describe, it, expect, afterAll, vi } from 'vitest';
import { MOVING } from '@/links/animations';
import { STILL } from '@/links/stills';
import { drawBase, drawMarkers } from '@/links/styles';
import { compare, stale } from './level-a';
import { LINK_STYLES, V1_LINK_SETTINGS, storeSettings, traceLinkVariants, traceLinks, tracePathStyles, traceStaticLinks, type LinkDraw } from './v1-inputs';

const CLASSIC = 9;

/** The clock the animations are drawn at. */
type Moment = Parameters<(typeof MOVING)[number]>[2];

/** v1's clock as v3's: its time × speed (1 here) is the flow, signed by the direction. */
const moment = (phase: number, totalTime: number, direction: number): Moment => ({ linkPhase: phase, quantumPhase: phase, linkFlow: totalTime * direction });

const v3Moving = (style: number): LinkDraw => (ctx, { items, phase, totalTime, direction }) => {
    const k = moment(phase, totalTime, direction);
    for (const s of items) {
        drawBase(ctx, s, style, false);
        MOVING[style]?.(ctx, s, k);
        if (style === CLASSIC) drawMarkers(ctx, s, phase, k.linkFlow);
    }
};

const v3Still = (style: number): LinkDraw => (ctx, { items, phase }) => {
    for (const s of items) {
        drawBase(ctx, s, style, true);
        STILL[style]?.(ctx, s, phase);
        if (style === CLASSIC) drawMarkers(ctx, s, phase);
    }
};

afterAll(() => {
    vi.restoreAllMocks();
});

describe('v1 link traces', () => {
    for (const [style, slug, name] of LINK_STYLES) {
        it(`moving ${style} ${name}`, () => {
            storeSettings(V1_LINK_SETTINGS);
            compare(`links-animated/${style}-${slug}.txt`, traceLinks('', v3Moving(style)).trace());
        });

        it(`still ${style} ${name}`, () => {
            storeSettings(V1_LINK_SETTINGS);
            compare(`links-static/${style}-${slug}.txt`, traceStaticLinks('', v3Still(style)).trace());
        });

        it(`moving ${style} ${name} with other v1 settings`, () => {
            compare(`links-rich/animated/${style}-${slug}.txt`, traceLinkVariants('', style, false, V1_LINK_SETTINGS, v3Moving(style)).trace());
        });

        it(`still ${style} ${name} with other v1 settings`, () => {
            compare(`links-rich/static/${style}-${slug}.txt`, traceLinkVariants('', style, true, V1_LINK_SETTINGS, v3Still(style)).trace());
        });
    }

    it('Classic Flow in each Link.Style', () => {
        compare('links-rich/path-styles.txt', tracePathStyles('', V1_LINK_SETTINGS, v3Moving(CLASSIC)).trace());
    });

    it('lists only deviations that change a frame, or that the traces cannot show', () => {
        expect(stale()).toEqual([]);
    });
});
