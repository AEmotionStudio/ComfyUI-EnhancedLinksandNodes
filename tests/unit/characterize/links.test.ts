/**
 * Level A link traces: the v2 renderers (line-for-line v1 ports) driven with
 * v1 inputs, so each file is what v1 drew for three links at fixed times.
 * links-rich/ covers other v1 options, one frame each. v1-crosscheck.test.ts
 * checks every file against v1's own code.
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderAnimatedStyle } from '@/effects/animated-renderers';
import { renderStaticStyle } from '@/effects/static-renderers';
import { LINK_STYLES, V1_LINK_SETTINGS, storeSettings, traceLinkVariants, traceLinks, tracePathStyles, traceStaticLinks, type LinkDraw } from './v1-inputs';

const v2Animated = (style: number): LinkDraw => (ctx, { items, phase, totalTime, direction }) =>
    renderAnimatedStyle(ctx, items, style, phase, { direction, totalTime, phase });
const v2Static = (style: number): LinkDraw => (ctx, { items, phase }) => renderStaticStyle(ctx, items, style, phase);

afterEach(() => {
    vi.restoreAllMocks();
});

function animated(style: number, name: string) {
    storeSettings(V1_LINK_SETTINGS);
    return traceLinks(`${name} (${style}), animated: v2 renderAnimatedStyle with v1 inputs`, v2Animated(style));
}

describe('v1 link traces', () => {
    for (const [style, slug, name] of LINK_STYLES) {
        it(`animated ${style} ${name}`, async () => {
            await expect(animated(style, name).trace()).toMatchFileSnapshot(`../__traces__/v1/links-animated/${style}-${slug}.txt`);
        });
    }

    for (const [style, slug, name] of LINK_STYLES) {
        it(`static ${style} ${name}`, async () => {
            storeSettings(V1_LINK_SETTINGS);
            const rec = traceStaticLinks(`${name} (${style}), static: v2 renderStaticStyle with v1 inputs`, v2Static(style));
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/links-static/${style}-${slug}.txt`);
        });
    }

    for (const [style, slug, name] of LINK_STYLES) {
        it(`animated ${style} ${name} with other v1 settings`, async () => {
            const rec = traceLinkVariants(`${name} (${style}), animated: v2 renderAnimatedStyle with other v1 settings`, style, false, V1_LINK_SETTINGS, v2Animated(style));
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/links-rich/animated/${style}-${slug}.txt`);
        });

        it(`static ${style} ${name} with other v1 settings`, async () => {
            const rec = traceLinkVariants(`${name} (${style}), static: v2 renderStaticStyle with other v1 settings`, style, true, V1_LINK_SETTINGS, v2Static(style));
            await expect(rec.trace()).toMatchFileSnapshot(`../__traces__/v1/links-rich/static/${style}-${slug}.txt`);
        });
    }

    it('Classic Flow in each Link.Style', async () => {
        const rec = tracePathStyles('Classic Flow (9), animated: v2 renderAnimatedStyle per Link.Style', V1_LINK_SETTINGS, v2Animated(9));
        await expect(rec.trace()).toMatchFileSnapshot('../__traces__/v1/links-rich/path-styles.txt');
    });

    it('Classic Flow shadows are a centred halo, not an offset drop shadow', () => {
        const halos = animated(9, 'Classic Flow').paints.filter(p => p.style === 'rgba(0, 0, 0, 0.95)');
        expect(halos.length).toBeGreaterThan(0);
        // NaN offsets are ignored, so they stay at the 0 the glow pass resets them to.
        expect(halos.every(p => p.shadowOffsetX === 0 && p.shadowOffsetY === 0)).toBe(true);
        // NaN blur is ignored too, so each halo keeps the blur set before it: the 10 px marker glow
        // after the first link of a frame. The first one gets the harness's fresh 0; in ComfyUI it
        // inherits whatever LiteGraph left on the context.
        expect(new Set(halos.map(p => p.shadowBlur))).toEqual(new Set([0, 10]));
    });
});
