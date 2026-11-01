/**
 * Glow sprites (src/fx/particles.ts): outside a stamping pass a glow is the
 * canvas's shadowBlur, exactly as before; inside one it is a sprite the canvas
 * cast once with that shadowBlur, stamped unturned under the shape at the
 * shape's own size and the paint's alpha, and the shape is painted without a
 * shadow. In the browser the two composite alike (shots and pixel differences
 * in the M4 L3 notes); here the calls are checked.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { preview } from '@/core/settings';
import { DOT, shine, startSprites, stopSprites, type Shape } from '@/fx/particles';
import { offscreens } from '../helpers/fake-litegraph';
import { CanvasRecorder } from '../helpers/recording-context';

/** An arrow-like shape that turns once a full turn, which notes the turns it was traced at. */
const turns: number[] = [];
const ARROW: Shape = {
    path(ctx, x, y, size, angle) {
        turns.push(angle);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(angle) * size, y + Math.sin(angle) * size);
        ctx.lineTo(x - Math.cos(angle) * size, y - Math.sin(angle) * size);
        ctx.closePath();
    },
    turn: Math.PI * 2,
};

/** The sprites cast since `since`: what each one painted. */
const cast = (since: number) => offscreens.slice(since).map((sprite) => sprite.paints);

/** The drawImage calls a trace made, as their numbers. */
const stamps = (rec: CanvasRecorder) => rec.lines.filter((line) => line.startsWith('drawImage(')).map((line) => line.slice(line.indexOf(')') + 3, -1).split(', ').map(Number));

let rec: CanvasRecorder;

beforeEach(() => {
    // A setting change drops the sprites the last test cast.
    preview('🔗 Enhanced Links.Glow.Intensity', 9);
    preview('🔗 Enhanced Links.Glow.Intensity', 10);
    rec = new CanvasRecorder();
    turns.length = 0;
});

afterEach(() => {
    stopSprites();
});

describe('glow sprites', () => {
    it("outside a stamping pass, a glow is the canvas's shadow", () => {
        const made = offscreens.length;
        DOT.path(rec.ctx, 10, 20, 3, 0);
        shine(rec.ctx, DOT, 10, 20, 3, 0, '#ff0000', '#00ff00', 8, 2);
        expect(rec.paints.map((p) => [p.op, p.style, p.shadowColor, p.shadowBlur, p.shadowOffsetX])).toEqual([['fill', '#ff0000', '#00ff00', 8, 2]]);
        expect(offscreens.length).toBe(made);
    });

    it('while stamping, a glow is a sprite cast once with that shadowBlur, stamped under the shape, which casts none', () => {
        rec.ctx.scale(2, 2);
        const made = offscreens.length;
        startSprites(rec.ctx);
        for (const [x, y] of [[10, 20], [40, 50]]) {
            DOT.path(rec.ctx, x, y, 3, 0);
            shine(rec.ctx, DOT, x, y, 3, 0, '#ff0000', '#00ff00', 8);
        }
        expect(rec.paints.map((p) => [p.op, p.shadowBlur])).toEqual([['drawImage', 0], ['fill', 0], ['drawImage', 0], ['fill', 0]]);
        // One sprite, cast with the same shadow from a shape that lies off it, to its left.
        const [sprite] = cast(made);
        expect(cast(made)).toHaveLength(1);
        expect(sprite.map((p) => [p.op, p.shadowColor, p.shadowBlur])).toEqual([['fill', '#00ff00', 8]]);
        expect(sprite[0].box![2]).toBeLessThan(0);
        expect(sprite[0].shadowOffsetX).toBeGreaterThan(-sprite[0].box![0]);
        // Each stamp is centred on its shape, 2 px of screen to a unit, and the disc of 6 px glows 12 px past it.
        for (const [i, [x, y, w, h]] of stamps(rec).entries()) {
            expect([x + w / 2, y + h / 2]).toEqual([[10, 20], [40, 50]][i].map((v) => expect.closeTo(v, 1)));
            expect(w * 2).toBeGreaterThanOrEqual(2 * (6 + 12));
        }
    });

    it("stamps at the context's alpha times the paint's", () => {
        startSprites(rec.ctx);
        rec.ctx.globalAlpha = 0.5;
        DOT.path(rec.ctx, 10, 20, 3, 0);
        shine(rec.ctx, DOT, 10, 20, 3, 0, 'rgba(0, 0, 0, 0.95)', 'rgba(0, 0, 0, 0.95)', 8);
        expect(rec.paints.map((p) => [p.op, p.globalAlpha])).toEqual([['drawImage', 0.475], ['fill', 0.5]]);
    });

    it('casts sizes at eight steps an octave and stretches each stamp to the size it is for', () => {
        const made = offscreens.length;
        startSprites(rec.ctx);
        for (const size of [3, 3.05, 4]) {
            DOT.path(rec.ctx, 100, 100, size, 0);
            shine(rec.ctx, DOT, 100, 100, size, 0, '#ff0000', '#ff0000', 10);
        }
        expect(cast(made)).toHaveLength(2);
        const [a, b] = stamps(rec);
        expect(b[2] / a[2]).toBeCloseTo(3.05 / 3, 3);
    });

    it('stamps a turned shape unturned, cast at the nearest of 32 turns', () => {
        const made = offscreens.length;
        startSprites(rec.ctx);
        for (const angle of [0.1, 0.12, 0.3, 0.1 + Math.PI * 2]) {
            ARROW.path(rec.ctx, 50, 50, 9, angle);
            shine(rec.ctx, ARROW, 50, 50, 9, angle, '#ff0000', '#ff0000', 10);
        }
        // Turns 1 and 2 of 32: the third angle needs its own sprite, the last is the first again.
        expect(cast(made)).toHaveLength(2);
        expect(turns.filter((t) => !([0.1, 0.12, 0.3, 0.1 + Math.PI * 2].includes(t)))).toEqual([(Math.PI * 2) / 32, (Math.PI * 4) / 32]);
        expect(rec.lines.filter((line) => /^(rotate|setTransform|transform)\(/.test(line))).toEqual([]);
    });

    it('lets a shape too wide for a sprite cast its own glow, and gives a filled one too small to see none', () => {
        const made = offscreens.length;
        startSprites(rec.ctx);
        for (const size of [200, 0.1]) {
            DOT.path(rec.ctx, 100, 100, size, 0);
            shine(rec.ctx, DOT, 100, 100, size, 0, '#ff0000', '#ff0000', 10);
        }
        expect(rec.paints.map((p) => [p.op, p.shadowBlur])).toEqual([['fill', 10], ['fill', 0]]);
        expect(offscreens.length).toBe(made);
    });

    it('drops its sprites when a setting changes', () => {
        const made = offscreens.length;
        for (const change of [false, true]) {
            if (change) preview('🔗 Enhanced Links.Thickness', 4);
            startSprites(rec.ctx);
            DOT.path(rec.ctx, 100, 100, 3, 0);
            shine(rec.ctx, DOT, 100, 100, 3, 0, '#ff0000', '#ff0000', 10);
            stopSprites();
        }
        expect(cast(made)).toHaveLength(2);
        preview('🔗 Enhanced Links.Thickness', 3);
    });

    it('keeps within its budget of pixels, dropping the sprites stamped longest ago', () => {
        const colour = (i: number) => `#${i.toString(16).padStart(6, '0')}`;
        const glow = (i: number) => {
            DOT.path(rec.ctx, 100, 100, 3, 0);
            shine(rec.ctx, DOT, 100, 100, 3, 0, '#ff0000', colour(i), 40);
        };
        // Each sprite of a 3 px disc glowing 40 px is 2 × (3 + 60 + 1) px across: 400 of them are over 16 MB.
        startSprites(rec.ctx);
        for (let i = 0; i < 400; i++) glow(i);
        stopSprites();
        startSprites(rec.ctx);
        const made = offscreens.length;
        glow(399);
        expect(offscreens.length).toBe(made);
        glow(0);
        expect(offscreens.length).toBe(made + 1);
    });
});
