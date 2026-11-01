/**
 * Each deliberate deviation from v1 (v1-deviations.ts) draws what it says it
 * draws, and names only frames the v1 traces have. The Level A tests
 * (links.test.ts, nodes.test.ts) check that the traces differ from v1's only
 * where one of them says so.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, relative, resolve } from 'path';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { DEVIATIONS } from '../v1-deviations';

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

const ROOT = resolve(__dirname, '../__traces__/v1');

function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]));
}

/** Every frame of the v1 traces, as the Level A tests name them: `<file>: <header>`. */
const FRAMES = files(ROOT).flatMap((file) => readFileSync(file, 'utf8').split('\n').slice(1)
    .filter((line) => line.startsWith('# ') && !line.startsWith('# gradients='))
    .map((header) => `${relative(ROOT, file)}: ${header}`));

describe('v1 deviations', () => {
    for (const deviation of DEVIATIONS) it(deviation.title, deviation.proof);

    it('name only frames the v1 traces have', () => {
        expect(DEVIATIONS.filter((d) => d.frames && !FRAMES.some((frame) => d.frames!.test(frame))).map((d) => d.title)).toEqual([]);
    });

    it('hide what they change in the frames they name, so that the rest of each frame is compared', () => {
        expect(DEVIATIONS.filter((d) => Boolean(d.frames) !== Boolean(d.mask)).map((d) => d.title)).toEqual([]);
    });
});
