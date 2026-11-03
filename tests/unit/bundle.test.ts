/**
 * The built bundle (js/), as ComfyUI loads it: settings reach it only through
 * the onChange of its ComfyExtension.settings, so it never takes a value from
 * the settings store and never calls the deprecated app.ui.settings API. The
 * commands' checks read the store only for the menus' render to track it, and
 * show the snapshot (core/settings.ts checked()).
 *
 * And the release metadata: pyproject.toml holds the one version, which the
 * bundle shows, and package.json, pyproject.toml and the README name the same
 * GPLv3 licence as LICENSE.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../..');
const JS = resolve(ROOT, 'js');

const scripts = (dir: string) => readdirSync(resolve(JS, dir)).filter((f) => f.endsWith('.js')).map((f) => `${dir}${f}`);
const read = (file: string) => readFileSync(resolve(ROOT, file), 'utf8');
const bundle = () => [...scripts(''), ...scripts('chunks/')].map((file) => readFileSync(resolve(JS, file), 'utf8')).join('\n');

/** The checks' read, whose value they drop, and the one read of a value saved before its setting registers. */
const TRACKED = /function checked\(id\) \{\s*app\.extensionManager\.setting\.get\(id\);/;
const EARLY = /function savedEarly\(id\) \{\s*return normalize\(setting\(id\), app\.extensionManager\.setting\.get\(id\)\);/;

describe('js/', () => {
    it('reads no settings and makes no deprecated settings calls', () => {
        const files = [...scripts(''), ...scripts('chunks/')];
        expect(files).toEqual(expect.arrayContaining(['link_animations.js', 'node_animations.js']));
        const code = files.map((file) => readFileSync(resolve(JS, file), 'utf8'));
        expect(code.filter((text) => TRACKED.test(text))).toHaveLength(1);
        expect(code.filter((text) => EARLY.test(text))).toHaveLength(1);
        for (const [i, file] of files.entries()) {
            expect(code[i].replace(TRACKED, '').replace(EARLY, ''), file).not.toMatch(/getSettingValue|setSettingValue|addSetting|ui\.settings|setting\??\.get\b/);
        }
    });
});

/** The licence classifier PyPI has for each SPDX id GPLv3 can be given under. */
const CLASSIFIERS: Record<string, string> = {
    'GPL-3.0-only': 'License :: OSI Approved :: GNU General Public License v3 (GPLv3)',
    'GPL-3.0-or-later': 'License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)',
};

describe('release metadata', () => {
    const pyproject = read('pyproject.toml');
    const pkg = JSON.parse(read('package.json'));

    it('pyproject.toml holds the only version, and the bundle shows it', () => {
        const version = pyproject.match(/^version = "(\d+\.\d+\.\d+)"$/m)?.[1];
        expect(version).toBeDefined();
        expect(pkg.private).toBe(true);
        expect(pkg).not.toHaveProperty('version');
        expect(read('__init__.py')).not.toMatch(/VERSION/);
        // About's heading and badge and Copy diagnostics: `${TITLE} ${__ELN_VERSION__}`, as vite's define writes it.
        const shown = [...bundle().matchAll(/\$\{TITLE\} \$\{"([^"]*)"\}/g)].map((m) => m[1]);
        expect(shown.length).toBeGreaterThan(0);
        expect(new Set(shown)).toEqual(new Set([version]));
    });

    it('package.json, pyproject.toml and the README name the licence LICENSE holds', () => {
        expect(read('LICENSE')).toMatch(/^\s*GNU GENERAL PUBLIC LICENSE\s+Version 3, 29 June 2007/);
        const spdx: string = pkg.license;
        expect(Object.keys(CLASSIFIERS)).toContain(spdx);
        const other = Object.keys(CLASSIFIERS).find((id) => id !== spdx)!;
        expect(pyproject).toMatch(/^license = \{file = "LICENSE"\}$/m);
        expect(pyproject).toContain(`"${CLASSIFIERS[spdx]}"`);
        expect(pyproject).not.toContain(CLASSIFIERS[other]);
        const readme = read('README.md');
        // The badge, which shields.io writes with doubled dashes, and the licence section.
        expect(readme).toContain(`badge/License-${spdx.replaceAll('-', '--')}-`);
        const section = readme.match(/^#+ .*Licen[cs]e\b[^\n]*\n+([^#]+)/m)?.[1];
        expect(section).toContain(spdx);
        expect(section).not.toMatch(/\bMIT\b/);
        for (const text of [readme, pyproject, JSON.stringify(pkg)]) {
            expect(text).not.toContain(other);
            expect(text).not.toContain(other.replaceAll('-', '--'));
        }
        expect(readme).not.toContain('badge/License-MIT');
        expect(`${pyproject}${JSON.stringify(pkg)}`).not.toMatch(/\bMIT\b/);
        // About names the licence without its variant.
        expect(bundle()).toContain('· GPL-3.0 ·');
    });
});
