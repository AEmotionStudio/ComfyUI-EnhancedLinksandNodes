/**
 * Unit tests for configuration constants
 */

import { describe, it, expect } from 'vitest';
import { SACRED } from '@/core/config';

describe('SACRED constants', () => {
    it('should define pattern constants', () => {
        expect(SACRED.TRINITY).toBe(3);
        expect(SACRED.HARMONY).toBe(7);
        expect(SACRED.COMPLETION).toBe(12);
        expect(SACRED.QUANTUM).toBe(5);
        expect(SACRED.INFINITY).toBe(8);
    });

    it('should have correct Fibonacci sequence', () => {
        expect(SACRED.FIBONACCI).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);

        // Verify it's actually Fibonacci
        const fib = SACRED.FIBONACCI;
        for (let i = 2; i < fib.length; i++) {
            expect(fib[i]).toBe(fib[i - 1] + fib[i - 2]);
        }
    });

    it('should be frozen (immutable)', () => {
        expect(Object.isFrozen(SACRED)).toBe(true);
        expect(Object.isFrozen(SACRED.FIBONACCI)).toBe(true);
    });
});
