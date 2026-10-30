/**
 * Unit tests for configuration constants
 */

import { describe, it, expect } from 'vitest';
import {
    PHI,
    SACRED,
    ANIMATION,
    LINK_DEFAULTS,
    NODE_DEFAULTS,
    CONFIG,
} from '@/core/config';

describe('Mathematical Constants', () => {
    it('should define PHI (golden ratio) correctly', () => {
        expect(PHI).toBeCloseTo(1.618033988749895);
        // Verify it's actually the golden ratio
        expect(PHI).toBeCloseTo((1 + Math.sqrt(5)) / 2);
    });
});

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

describe('ANIMATION constants', () => {
    it('should define timing constants', () => {
        expect(ANIMATION.RAF_THROTTLE).toBeCloseTo(1000 / 60);
        expect(ANIMATION.PARTICLE_POOL_SIZE).toBe(1000);
        expect(ANIMATION.SMOOTH_FACTOR).toBe(0.95);
        expect(ANIMATION.MAX_DELTA).toBeCloseTo(1 / 30);
    });

    it('should define transition speeds', () => {
        expect(ANIMATION.TRANSITION_SPEED).toBeDefined();
        expect(ANIMATION.FAST_TRANSITION_SPEED).toBeDefined();
        expect(ANIMATION.FAST_TRANSITION_SPEED).toBeGreaterThan(ANIMATION.TRANSITION_SPEED);
    });

    it('should be frozen (immutable)', () => {
        expect(Object.isFrozen(ANIMATION)).toBe(true);
    });
});

describe('LINK_DEFAULTS', () => {
    it('should define all required link settings', () => {
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Animate']).toBe(9);
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Animation.Speed']).toBe(1);
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Color.Mode']).toBe('default');
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Link.Style']).toBe('spline');
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Marker.Enabled']).toBe(true);
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Marker.Shape']).toBe('arrow');
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Static.Mode']).toBe(false);
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Pause.During.Render']).toBe(true);
    });

    it('should define valid hex colors', () => {
        const colorKeys = Object.keys(LINK_DEFAULTS).filter(
            (k) => k.includes('Color') && !k.includes('Mode') && !k.includes('Scheme')
        );

        for (const key of colorKeys) {
            const value = LINK_DEFAULTS[key as keyof typeof LINK_DEFAULTS];
            if (typeof value === 'string') {
                expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
            }
        }
    });

    it('should be frozen (immutable)', () => {
        expect(Object.isFrozen(LINK_DEFAULTS)).toBe(true);
    });
});

describe('NODE_DEFAULTS', () => {
    it('should define all required node settings', () => {
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Animate']).toBe(0);
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Animation.Speed']).toBe(1);
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Color.Mode']).toBe('default');
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Particle.Show']).toBe(false);
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Static.Mode']).toBe(false);
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Pause.During.Render']).toBe(true);
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.End Animation.Enabled']).toBe(false);
    });

    it('should define valid hex colors', () => {
        const colorKeys = Object.keys(NODE_DEFAULTS).filter(
            (k) => k.includes('Color') && !k.includes('Mode') && !k.includes('Scheme')
        );

        for (const key of colorKeys) {
            const value = NODE_DEFAULTS[key as keyof typeof NODE_DEFAULTS];
            if (typeof value === 'string') {
                expect(value).toMatch(/^#[0-9a-fA-F]{6}$/);
            }
        }
    });

    it('should be frozen (immutable)', () => {
        expect(Object.isFrozen(NODE_DEFAULTS)).toBe(true);
    });
});

describe('CONFIG', () => {
    it('should contain all sub-configs', () => {
        expect(CONFIG.PHI).toBe(PHI);
        expect(CONFIG.SACRED).toBe(SACRED);
        expect(CONFIG.ANIMATION).toBe(ANIMATION);
    });

    it('should be frozen (immutable)', () => {
        expect(Object.isFrozen(CONFIG)).toBe(true);
    });
});
