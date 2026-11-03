/**
 * The Comfy Registry archive. `comfy node publish` zips the files git tracks
 * minus those .comfyignore matches with gitignore rules (comfy-cli's
 * file_utils.zip_files); git applies the same rules here. Untracked files that
 * .gitignore lets through count as tracked, as the commit that adds them will.
 * The archive holds what ComfyUI loads (__init__.py, js/, locales/), the
 * example workflow, the metadata and the user docs, and nothing else.
 */

import { execFileSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(__dirname, '../..');

const git = (...args: string[]) => execFileSync('git', ['-C', ROOT, ...args], { encoding: 'utf8' }).split('\n').filter(Boolean);

const ROOT_FILES = ['__init__.py', 'pyproject.toml', 'LICENSE', 'README.md', 'CHANGELOG.md'];
const DIRS = ['js/', 'locales/', 'example_workflows/'];

describe('the Registry archive', () => {
    const tracked = git('ls-files', '-c');
    const added = git('ls-files', '-o', '--exclude-standard');
    const ignored = new Set([
        ...git('ls-files', '-c', '-i', '--exclude-from=.comfyignore'),
        // Without paths, -o lists every ignored file, node_modules too.
        ...(added.length ? git('ls-files', '-o', '-i', '--exclude-from=.comfyignore', '--', ...added) : []),
    ]);
    const files = [...tracked, ...added].filter((file) => existsSync(resolve(ROOT, file)));
    const packed = files.filter((file) => !ignored.has(file)).sort();

    it('holds only what ComfyUI loads, the example workflow, the metadata and the user docs', () => {
        expect(packed.filter((file) => !ROOT_FILES.includes(file) && !DIRS.some((dir) => file.startsWith(dir)))).toEqual([]);
    });

    it('holds all of it', () => {
        expect(packed).toEqual(expect.arrayContaining([
            ...ROOT_FILES,
            'js/link_animations.js',
            'js/node_animations.js',
            'locales/en/settings.json',
            'locales/en/commands.json',
            'locales/en/main.json',
            'example_workflows/showcase.json',
        ]));
        expect(packed).toEqual(expect.arrayContaining(files.filter((file) => DIRS.some((dir) => file.startsWith(dir)))));
    });
});
