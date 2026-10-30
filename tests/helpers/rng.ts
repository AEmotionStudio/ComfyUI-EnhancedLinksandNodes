/**
 * Seeded randomness and a frozen clock for deterministic traces.
 *
 * @module tests/helpers/rng
 */

import { vi } from 'vitest';

export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** Freeze Date.now and performance.now at `nowMs` and reseed Math.random. Undo with vi.restoreAllMocks(). */
export function freezeTimeAndRandom(nowMs: number, seed: number): void {
    vi.spyOn(Date, 'now').mockReturnValue(nowMs);
    vi.spyOn(performance, 'now').mockReturnValue(nowMs);
    vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed));
}
