/**
 * The v1 traces are v1's ground truth: nothing may rewrite them, not even
 * `vitest -u`. Their sha256 sums are kept in __traces__/v1.sha256, in
 * sha256sum's format, and every file under __traces__/v1 must match it.
 */

import { createHash } from 'crypto';
import { readFileSync, readdirSync } from 'fs';
import { join, relative, resolve } from 'path';
import { describe, it, expect } from 'vitest';

const ROOT = resolve(__dirname, '../__traces__/v1');

function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]));
}

describe('v1 traces', () => {
    it('are the files their manifest lists, unchanged', () => {
        const manifest = readFileSync(resolve(ROOT, '../v1.sha256'), 'utf8').trim().split('\n').map((line) => line.split('  ').reverse());
        const sums = files(ROOT).map((file) => [relative(ROOT, file), createHash('sha256').update(readFileSync(file)).digest('hex')]);
        expect(Object.fromEntries(sums)).toEqual(Object.fromEntries(manifest));
        expect(manifest).toHaveLength(55);
    });
});
