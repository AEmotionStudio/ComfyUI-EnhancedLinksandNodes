/**
 * The built bundle (js/), as ComfyUI loads it: settings reach it only through
 * the onChange of its ComfyExtension.settings, so it never takes a value from
 * the settings store and never calls the deprecated app.ui.settings API. The
 * commands' checks read the store only for the menus' render to track it, and
 * show the snapshot (core/settings.ts checked()).
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const JS = resolve(__dirname, '../../js');

const scripts = (dir: string) => readdirSync(resolve(JS, dir)).filter((f) => f.endsWith('.js')).map((f) => `${dir}${f}`);

/** The checks' read, whose value they drop. */
const TRACKED = /function checked\(id\) \{\s*app\.extensionManager\.setting\.get\(id\);/;

describe('js/', () => {
    it('reads no settings and makes no deprecated settings calls', () => {
        const files = [...scripts(''), ...scripts('chunks/')];
        expect(files).toEqual(expect.arrayContaining(['link_animations.js', 'node_animations.js']));
        const code = files.map((file) => readFileSync(resolve(JS, file), 'utf8'));
        expect(code.filter((text) => TRACKED.test(text))).toHaveLength(1);
        for (const [i, file] of files.entries()) {
            expect(code[i].replace(TRACKED, ''), file).not.toMatch(/getSettingValue|setSettingValue|addSetting|ui\.settings|setting\??\.get\b/);
        }
    });
});
