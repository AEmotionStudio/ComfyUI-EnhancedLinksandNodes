/**
 * The link colour fallback bug, shared by v1 and v2. ComfyUI's palette service
 * stores '' in LGraphCanvas.link_type_colors for every type the palette lacks
 * (INT, FLOAT, STRING...) and drawConnections keeps it. A type with no entry at
 * all gets undefined in v1 and, through v2's `??`, the default_connection_color
 * object. Canvas ignores all three as styles and addColorStop throws on them.
 * Each BUG expectation pins today's behaviour: flip it when M4 fixes the resolver.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CanvasRecorder } from '../../helpers/recording-context';
import { fake } from '../../helpers/fake-app';
import { freezeTimeAndRandom } from '../../helpers/rng';
import { V1_LINK_SETTINGS, linkItems } from './v1-inputs';
import { canvasWithLinks, setupV2 } from './v2-hooks';

const SHADOW = 'rgba(0, 0, 0, 0.95)';

// A palette colour, a palette gap ('') and a type with no entry (object fallback).
const canvas = () => canvasWithLinks(linkItems(false).map(({ start, end }, i) => ({ start, end, type: ['IMAGE', 'INT', 'MY_CUSTOM_TYPE'][i] })));

beforeEach(() => {
    // TimingManager reads performance.now() when the module loads; a frozen clock keeps phase at 0.
    freezeTimeAndRandom(1000, 1);
    vi.stubGlobal('requestAnimationFrame', () => 0);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('link colour fallback (BUG in v1 and v2)', () => {
    it('Classic Flow strokes "" and object-coloured links with a stale colour', async () => {
        await setupV2({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Link.Shadow.Enabled': false, '🔗 Enhanced Links.Marker.Shadow.Enabled': false });
        const rec = new CanvasRecorder();
        canvas().drawConnections(rec.ctx);
        rec.assertBalanced();
        expect(rec.lines).toContain('strokeStyle = "" [ignored, keeps #64b5f6]');
        expect(rec.lines).toContain('strokeStyle = [object Object] [ignored, keeps #64b5f6]');
        // BUG: INT and MY_CUSTOM_TYPE reuse IMAGE's colour. Expect default_link_color (#99aa99) for both after M4.
        expect(rec.paints.filter(p => p.op === 'stroke').map(p => p.style)).toEqual(['#64b5f6', '#64b5f6', '#64b5f6']);

        // With v1's default shadows on, the stale colour is the black shadow pass, so these links drew black.
        await setupV2(V1_LINK_SETTINGS);
        const v1 = new CanvasRecorder();
        canvas().drawConnections(v1.ctx);
        // Link bodies are 3 × 0.8 wide; the shadow passes under them are 3.6 × 0.8.
        const bodies = v1.paints.filter(p => p.op === 'stroke' && Math.abs(p.lineWidth - 2.4) < 0.01);
        // BUG: expect the IMAGE colour, then #99aa99 twice, after M4.
        expect(bodies.map(p => p.style)).toEqual(['#64b5f6', SHADOW, SHADOW]);
    });

    it('Lava Flow throws on "" and falls back to native drawing with a leaked save()', async () => {
        await setupV2({ ...V1_LINK_SETTINGS, '🔗 Enhanced Links.Animate': 7 });
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const rec = new CanvasRecorder();
        canvas().drawConnections(rec.ctx);
        expect(rec.lines).toContain('grad2.addColorStop(0, "") threw SyntaxError');
        expect(error).toHaveBeenCalledWith('[EnhancedLinks] Error in drawConnections:', expect.objectContaining({ name: 'SyntaxError' }));
        // BUG: the catch path skips the restore() for the save() that opens drawConnections, then the
        // native fallback redraws every link over the half-drawn frame. Expect no throw and depth 0 after M4.
        expect(fake.native).toEqual(['drawConnections']);
        expect(rec.depth).toBe(1);
    });
});
