/**
 * Colour parsing (src/core/colors.ts): a link colour is read as the canvas
 * reads it, in every syntax the frontends and palettes hand over, and written
 * back as the canvas writes it; what it does not read gets no palette, so the
 * link takes the next colour in native's order.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { palette } from '@/core/colors';
import { V1_LINK_SETTINGS, storeSettings } from './characterize/v1-inputs';

beforeEach(() => {
    storeSettings(V1_LINK_SETTINGS);
});

describe('a link colour', () => {
    // #64b5f6 is hsl(207, 89%, 68%) to the nearest degree and percent, which is #65b5f6.
    const READ: Array<[colour: string, canvas: string]> = [
        ['#9a9', '#99aa99'],
        ['#9A98', `rgba(153, 170, 153, ${0x88 / 255})`],
        ['#64b5f6', '#64b5f6'],
        ['#64B5F680', `rgba(100, 181, 246, ${0x80 / 255})`],
        ['rgb(100, 181, 246)', '#64b5f6'],
        ['rgba(100, 181, 246, 0.5)', 'rgba(100, 181, 246, 0.5)'],
        ['rgb(100 181 246 / 50%)', 'rgba(100, 181, 246, 0.5)'],
        ['rgb(50%, 0%, 100%)', '#8000ff'],
        ['rgb(300, -20, 128)', '#ff0080'],
        ['hsl(207, 89%, 68%)', '#65b5f6'],
        ['hsl(-153deg 89% 68%)', '#65b5f6'],
        ['hsl(567, 89%, 68%)', '#65b5f6'],
        ['hsla(207, 89%, 68%, 0.25)', 'rgba(101, 181, 246, 0.25)'],
        [' HSL(0, 100%, 50%) ', '#ff0000'],
    ];

    for (const [colour, canvas] of READ) {
        it(`reads ${colour} as the canvas does`, () => {
            expect(palette(colour)?.native).toBe(canvas);
        });
    }

    // Colour names too, which no ComfyUI palette uses.
    for (const colour of ['#12', '#12345', '#ggg', 'rgb(1, 2)', 'hsl(1, 2%, 3%, 4%, 5%)', 'var(--link)', '', 'white', 'transparent']) {
        it(`gets no palette from ${JSON.stringify(colour)}`, () => {
            expect(palette(colour)).toBeUndefined();
        });
    }
});
