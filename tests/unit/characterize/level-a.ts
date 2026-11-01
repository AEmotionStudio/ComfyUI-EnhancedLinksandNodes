/**
 * The Level A comparison: a v3 trace against the committed v1 one, frame by
 * frame, both reduced by canonical() to what they paint. Every frame must
 * match, but where a deviation in v1-deviations.ts says it does not: then the
 * frame must match once the masks of the deviations that name it hide what
 * they change in both, and the deviations' own proofs show what v3 draws
 * there instead. The files are read, never snapshotted, so `vitest -u` cannot
 * rewrite them.
 *
 * @module tests/unit/characterize/level-a
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { expect } from 'vitest';
import { canonical } from '../../helpers/canonical';
import { DEVIATIONS, type Deviation } from '../v1-deviations';

/** A trace without its title line, which only names the code that drew it. */
const body = (trace: string) => trace.slice(trace.indexOf('\n') + 1);
const committed = (file: string) => body(readFileSync(resolve(__dirname, '../__traces__/v1', file), 'utf8'));

/** A canonical trace's frames, each with the lines under its header. */
function frames(trace: string): Map<string, string[]> {
    const byHeader = new Map<string, string[]>();
    let lines: string[] = [];
    for (const line of trace.split('\n')) {
        if (line.startsWith('# ')) byHeader.set(line, (lines = []));
        else if (line) lines.push(line);
    }
    return byHeader;
}

/** The frames this test file compared, as `<file>: <header>`, and how many each deviation changed, by its title. */
const compared: string[] = [];
const changed = new Map<string, number>(DEVIATIONS.map((d) => [d.title, 0]));

/** Compares a v3 trace with the committed v1 one, as the module comment says. */
export function compare(file: string, v3: string): void {
    const want = frames(canonical(committed(file)));
    const got = frames(canonical(body(v3)));
    expect([...got.keys()], file).toEqual([...want.keys()]);
    for (const [header, lines] of want) {
        const frame = `${file}: ${header}`;
        compared.push(frame);
        const theirs = got.get(header)!;
        if (theirs.join('\n') === lines.join('\n')) continue;
        const apply: Deviation[] = DEVIATIONS.filter((d) => d.frames?.test(frame));
        expect(apply.map((d) => d.title), `${frame} differs from v1 for no listed reason`).not.toEqual([]);
        for (const d of apply) changed.set(d.title, changed.get(d.title)! + 1);
        const mask = (frameLines: string[]) => apply.reduce((masked, d) => d.mask!(masked), frameLines);
        expect(mask(theirs), `${frame}, past ${apply.map((d) => d.title).join('; ')}`).toEqual(mask(lines));
    }
}

/** The deviations that name frames this test file compared, yet changed none of them. */
export const stale = () => DEVIATIONS.filter((d) => d.frames && compared.some((frame) => d.frames!.test(frame)) && !changed.get(d.title)).map((d) => d.title);
