/**
 * Self-checks for the characterization harness: the recording context must
 * behave like a browser canvas where traces depend on it.
 */

import { describe, it, expect } from 'vitest';
import { CanvasRecorder, parseColor } from '../../helpers/recording-context';
import { app, api, fake, resetFakeApp } from '../../helpers/fake-app';
import { mulberry32 } from '../../helpers/rng';

function thrown(fn: () => unknown): string {
    try {
        fn();
    } catch (error) {
        return (error as Error).name;
    }
    return 'nothing';
}

describe('recording context', () => {
    it('parses CSS colours like canvas', () => {
        expect(parseColor('#fff')).toEqual([255, 255, 255, 1]);
        expect(parseColor('#F008')).toEqual([255, 0, 0, 136 / 255]);
        expect(parseColor('#64B5F6')).toEqual([100, 181, 246, 1]);
        expect(parseColor('#ffb30080')).toEqual([255, 179, 0, 128 / 255]);
        expect(parseColor('rgba(255,0,0,0.5)')).toEqual([255, 0, 0, 0.5]);
        expect(parseColor('rgb(100%, 50%, 0%)')).toEqual([255, 128, 0, 1]);
        expect(parseColor('rgb(255 0 0 / 25%)')).toEqual([255, 0, 0, 0.25]);
        expect(parseColor('hsl(120, 100%, 50%)')).toEqual([0, 255, 0, 1]);
        expect(parseColor('hsla(300, 90%, 75%, 0.5)')).toEqual([249, 134, 249, 0.5]);
        expect(parseColor('hsl(0.5turn 100% 50% / 0.2)')).toEqual([0, 255, 255, 0.2]);
        expect(parseColor('transparent')).toEqual([0, 0, 0, 0]);
        expect(parseColor('RebeccaPurple')).toEqual([102, 51, 153, 1]);
        for (const bad of ['', 'ffb300', '#ffb30', 'rgb(255, 0)', 'rgb(255, 50%, 0)', 'hsl(120, 100, 50)', '[object Object]', 'glow', 'var(--x)']) {
            expect(parseColor(bad), bad).toBeNull();
        }
    });

    it('refuses colour syntax Chrome accepts but it cannot parse, in the trace too', () => {
        for (const css of ['oklch(70% 0.1 200)', 'color-mix(in srgb, red, blue)', 'rgb(from red r g b)', 'CanvasText']) {
            expect(() => parseColor(css), css).toThrow(/unsupported colour syntax/);
        }
        const rec = new CanvasRecorder();
        expect(() => { rec.ctx.fillStyle = 'hwb(120 0% 0%)'; }).toThrow();
        expect(rec.lines).toEqual(['fillStyle = "hwb(120 0% 0%)" threw recording-context: unsupported colour syntax "hwb(120 0% 0%)"']);
    });

    it('keeps three decimals for alphas and gradient offsets, two elsewhere', () => {
        const rec = new CanvasRecorder();
        rec.ctx.globalAlpha = 0.0125;
        rec.ctx.fillStyle = 'rgba(0, 0, 0, 0.0125)';
        rec.ctx.createLinearGradient(0, 0, 1, 0).addColorStop(0.3333, '#fff');
        rec.ctx.lineWidth = 0.0125;
        expect(rec.lines).toEqual([
            'globalAlpha = 0.013',
            'fillStyle = rgba(0, 0, 0, 0.013)',
            'grad1 = createLinearGradient(0, 0, 1, 0)',
            'grad1.addColorStop(0.333, #ffffff)',
            'lineWidth = 0.01',
        ]);
    });

    it('serializes accepted colours and ignores invalid values, keeping the previous one', () => {
        const rec = new CanvasRecorder();
        const ctx = rec.ctx;
        ctx.fillStyle = 'RED';
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = '';
        ctx.strokeStyle = { input_off: '#778899' } as unknown as string;
        ctx.shadowBlur = NaN;
        ctx.lineWidth = 0;
        ctx.globalAlpha = 2;
        ctx.lineTo(NaN, 1);
        expect([ctx.fillStyle, ctx.strokeStyle, ctx.shadowBlur, ctx.lineWidth, ctx.globalAlpha]).toEqual(['#ff0000', 'rgba(0, 0, 0, 0.5)', 0, 1, 1]);
        expect(rec.lines).toEqual([
            'fillStyle = #ff0000',
            'strokeStyle = rgba(0, 0, 0, 0.5)',
            'strokeStyle = "" [ignored, keeps rgba(0, 0, 0, 0.5)]',
            'strokeStyle = [object Object] [ignored, keeps rgba(0, 0, 0, 0.5)]',
            'shadowBlur = NaN [ignored, keeps 0]',
            'lineWidth = 0 [ignored, keeps 1]',
            'globalAlpha = 2 [ignored, keeps 1]',
            'lineTo(NaN, 1) [ignored]',
        ]);
    });

    it('throws where the browser throws', () => {
        const ctx = new CanvasRecorder().ctx;
        const gradient = ctx.createLinearGradient(0, 0, 1, 0);
        expect(thrown(() => gradient.addColorStop(0, ''))).toBe('SyntaxError');
        expect(thrown(() => gradient.addColorStop(0, {} as string))).toBe('SyntaxError');
        expect(thrown(() => gradient.addColorStop(1.5, '#fff'))).toBe('IndexSizeError');
        expect(thrown(() => gradient.addColorStop(NaN, '#fff'))).toBe('TypeError');
        expect(thrown(() => gradient.addColorStop(0.5, 'hsl(120, 50%, 50%)'))).toBe('nothing');
        expect(thrown(() => ctx.createLinearGradient(NaN, 0, 1, 0))).toBe('TypeError');
        expect(thrown(() => ctx.createRadialGradient(0, 0, -1, 0, 0, 1))).toBe('IndexSizeError');
        expect(thrown(() => ctx.arc(0, 0, -1, 0, 1))).toBe('IndexSizeError');
    });

    it('restores state and checks save/restore balance', () => {
        const rec = new CanvasRecorder();
        rec.ctx.save();
        rec.ctx.lineWidth = 5;
        rec.ctx.translate(10, 20);
        expect(rec.depth).toBe(1);
        expect(() => rec.assertBalanced()).toThrow(/depth 1/);
        rec.ctx.restore();
        expect(rec.ctx.lineWidth).toBe(1);
        expect(rec.ctx.getTransform()).toMatchObject({ e: 0, f: 0 });
        rec.assertBalanced();
        rec.ctx.restore();
        expect(rec.lines.at(-1)).toBe('restore() [ignored]');
        expect(() => rec.assertBalanced()).toThrow(/1 restore\(\) on an empty stack/);
    });

    it('counts gradients, shadowBlur sets and Path2D creations and records paints', () => {
        const rec = new CanvasRecorder();
        const ctx = rec.ctx;
        const path = new Path2D();
        path.rect(0, 0, 10, 10);
        ctx.shadowBlur = 4;
        ctx.shadowBlur = -1;
        ctx.fillStyle = ctx.createRadialGradient(0, 0, 0, 0, 0, 5);
        ctx.fill(path);
        ctx.font = '14px Arial';
        expect(ctx.measureText('abcd').width).toBe(28);
        expect(rec.counts()).toEqual({ gradients: 1, patterns: 0, shadowBlurSets: 2, path2d: 1 });
        expect(rec.lines.slice(-4, -2)).toEqual(['path1 = Path2D[rect(0, 0, 10, 10)]', 'fill(path1)']);
        expect(rec.paints).toEqual([expect.objectContaining({ op: 'fill', style: 'grad1', shadowBlur: 4 })]);
    });
});

describe('fake app', () => {
    it('is what /scripts/app.js and /scripts/api.js resolve to', async () => {
        expect((await import('/scripts/app.js')).app).toBe(app);
        expect((await import('/scripts/api.js')).api).toBe(api);
    });

    it('serves stored values, then registered defaults, ignores the deprecated default and counts reads', () => {
        resetFakeApp({ 'a.stored': 3 });
        app.ui.settings.addSetting({ id: 'a.registered', defaultValue: 'x' });
        expect(app.ui.settings.getSettingValue('a.stored', 9)).toBe(3);
        expect(app.extensionManager.setting.get('a.registered')).toBe('x');
        expect(app.ui.settings.getSettingValue('a.missing', 5)).toBeUndefined();
        expect(fake.reads).toBe(3);
    });
});

describe('mulberry32', () => {
    it('is deterministic per seed', () => {
        const a = mulberry32(42);
        const b = mulberry32(42);
        const values = Array.from({ length: 5 }, () => a());
        expect(Array.from({ length: 5 }, () => b())).toEqual(values);
        expect(values.every(v => v >= 0 && v < 1)).toBe(true);
        expect(mulberry32(43)()).not.toBe(values[0]);
    });
});
