/**
 * The built bundle (js/), as ComfyUI loads it: settings reach it only through
 * the onChange of its ComfyExtension.settings, so it never reads the settings
 * store and never calls the deprecated app.ui.settings API.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const JS = resolve(__dirname, '../../js');

const scripts = (dir: string) => readdirSync(resolve(JS, dir)).filter((f) => f.endsWith('.js')).map((f) => `${dir}${f}`);

describe('js/', () => {
    it('reads no settings and makes no deprecated settings calls', () => {
        const files = [...scripts(''), ...scripts('chunks/')];
        expect(files).toEqual(expect.arrayContaining(['link_animations.js', 'node_animations.js']));
        for (const file of files) {
            expect(readFileSync(resolve(JS, file), 'utf8'), file).not.toMatch(/getSettingValue|setSettingValue|addSetting|ui\.settings|setting\??\.get\b/);
        }
    });
});
