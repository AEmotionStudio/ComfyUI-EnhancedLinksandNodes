/**
 * The title styles (src/nodes/text.ts drawTitle) beyond what v1's traces and
 * the deviations show: each style's resting pose, Typewriter's and Decode's
 * cycles, the letters the letter-by-letter styles draw, and the colours each
 * takes. The recorder measures every character half the font size wide, so a
 * 14 px "KSampler" is 56 px.
 */

import { describe, it, expect } from 'vitest';
import { TURN } from '@/core/engine';
import { SETTINGS } from '@/core/settings';
import { drawTitle } from '@/nodes/text';
import { CanvasRecorder } from '../helpers/recording-context';
import { canonical } from '../helpers/canonical';
import { storeSettings } from './characterize/v1-inputs';

const STYLES = SETTINGS.flatMap((s) => (s.id === '📦 Enhanced Nodes.Text.Style' && s.type === 'combo' ? s.options.map((o) => o.value) : []));
const REST = Math.PI / 4;
/** The node phase `u` into a cycle that runs `rate` times a turn of it. */
const at = (u: number, rate: number) => REST + (u * 2 * Math.PI) / rate;

function title(style: string, phase: number, text = 'KSampler', settings: Record<string, unknown> = {}): CanvasRecorder {
    storeSettings({ '📦 Enhanced Nodes.Text.Style': style, ...settings });
    const rec = new CanvasRecorder();
    drawTitle(rec.ctx, { text, width: [...text].length * 7 }, 30, -15, '#123456', phase, 1);
    return rec;
}

/** The texts a recording fills, in order. */
const texts = (rec: CanvasRecorder) => rec.lines.flatMap((line) => /^fillText\("(.*)", /.exec(line)?.[1] ?? []);

describe('title styles', () => {
    it('come in v1\'s five and eight of our own', () => {
        expect(STYLES).toEqual(['neon', 'cyberpunk', 'retro', 'pulse', 'minimal', 'rainbow', 'bounce', 'typewriter', 'decode', 'molten', 'chrome', 'groovy', 'hologram']);
    });

    it('each leave the context as they found it, turned and circled too', () => {
        for (const style of STYLES) {
            for (const phase of [0, REST, 1, 2.5, 4]) {
                const rec = title(style, phase, 'KSampler', { '📦 Enhanced Nodes.Text.Rotation.Angle': 30, '📦 Enhanced Nodes.Text.Rotation.Radius': 5 });
                expect(() => rec.assertBalanced(), `${style} at ${phase}`).not.toThrow();
            }
        }
    });

    it('show the whole title at rest', () => {
        for (const style of STYLES) {
            const drawn = texts(title(style, REST));
            expect(drawn.includes('KSampler') || drawn.join('') === 'KSampler', `${style}: ${drawn}`).toBe(true);
        }
    });

    it('Typewriter backspaces the title, waits, and types it again, its caret after the last letter', () => {
        const typed = [0.51, 0.575, 0.78, 0.99].map((u) => {
            const rec = title('typewriter', at(u, 2));
            return [texts(rec), rec.lines.filter((line) => line.startsWith('fillRect('))];
        });
        expect(typed).toEqual([
            [['KSam'], ['fillRect(59, -21.3, 1.5, 12.6)']],
            [[], ['fillRect(31, -21.3, 1.5, 12.6)']],
            [['KSam'], ['fillRect(59, -21.3, 1.5, 12.6)']],
            [['KSampler'], ['fillRect(87, -21.3, 1.5, 12.6)']],
        ]);
        // Resting, the caret blinks: lit or not by the phase.
        const blinks = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4].map((u) => title('typewriter', at(u, 2)).lines.some((line) => line.startsWith('fillRect(')));
        expect(new Set(blinks)).toEqual(new Set([true, false]));
    });

    it('Decode scrambles each letter through glyphs in one colour and alpha, then locks them left to right', () => {
        const paints = (rec: CanvasRecorder) => rec.paints.filter((p) => p.op === 'fillText').map((p) => [p.style, p.globalAlpha]);
        // One glyph step apart, every letter scrambled: their shapes change, their colour and alpha do not.
        const [a, b] = [0.52, 0.555].map((u) => title('decode', at(u, 2)));
        expect(texts(a)).not.toEqual(texts(b));
        expect(texts(a).every((glyph) => '01#$%&*+=<>/\\?@ABCDEFXZ'.includes(glyph))).toBe(true);
        expect(paints(a)).toEqual(paints(b));
        expect(new Set(paints(a).map(String))).toEqual(new Set(['#123456,0.7']));
        // Four fifths into the cycle, the first four letters have locked; the fourth only just, so it shines white.
        const half = texts(title('decode', at(0.8, 2)));
        expect(half.slice(0, 3)).toEqual(['K', 'S', 'a']);
        expect(paints(title('decode', at(0.8, 2)))[3]).toEqual(['#ffffff', 1]);
        expect(half.slice(4).some((glyph, i) => glyph !== 'pler'[i])).toBe(true);
    });

    it('draw letter by letter in whole graphemes, measured once a title', () => {
        storeSettings({ '📦 Enhanced Nodes.Text.Style': 'rainbow' });
        const shown = { text: 'Ok 👩‍💻📌', width: 0 };
        const first = new CanvasRecorder();
        drawTitle(first.ctx, shown, 30, -15, '#123456', 1, 1);
        // The whole title as its glow, then each letter.
        expect(texts(first)).toEqual(['Ok 👩‍💻📌', 'O', 'k', ' ', '👩‍💻', '📌']);
        const again = new CanvasRecorder();
        drawTitle(again.ctx, shown, 30, -15, '#123456', 2, 1);
        expect(first.lines.filter((line) => line.startsWith('measureText('))).toHaveLength(5);
        expect(again.lines.filter((line) => line.startsWith('measureText('))).toEqual([]);
    });

    it('take Title color, but for Rainbow wave, Molten and Chrome shine, which have their own', () => {
        const fills = (style: string) => canonical(title(style, 1).trace()).split('\n').filter((line) => line.startsWith('fillText') || line.startsWith('fillRect'));
        for (const style of ['bounce', 'typewriter', 'decode', 'groovy', 'hologram']) {
            expect(fills(style).some((line) => line.includes('style=#123456')), style).toBe(true);
        }
        expect(fills('rainbow').some((line) => line.includes('style=#123456'))).toBe(false);
        // Molten burns gold to red top to bottom, in Ember Crown's colours whatever the node colours.
        expect(fills('molten')).toEqual([expect.stringContaining('[0 #ffd166, 0.5 #ff7a1a, 1 #ff3d00]')]);
        expect(fills('chrome')[0]).toContain('[0 #f4f6f8, 0.45 #9aa3ad, 0.55 #e9edf1, 1 #5d6670]');
    });

    it("Hologram's lines pass a point less than three times a second at Node effect speed 3", () => {
        const top = (phase: number) => Number(/^rect\([^,]+, ([-\d.]+)/.exec(title('hologram', phase).lines.find((line) => line.startsWith('rect('))!)![1]);
        const step = TURN * 3 / 60;
        // Lines 4 px apart drifting up: a point sees a line pass each 4 px they drift.
        const drift = Math.abs(top(1.1 + step) - top(1.1)) * 60;
        expect(drift / 4).toBeLessThan(3);
        expect(drift).toBeGreaterThan(0);
    });
});
