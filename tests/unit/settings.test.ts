/**
 * Unit tests for settings and UI utilities
 */

import { describe, it, expect } from 'vitest';
import {
    LINK_ANIMATION_OPTIONS,
    LINK_STYLE_OPTIONS,
    MARKER_SHAPE_OPTIONS,
    NODE_ANIMATION_OPTIONS,
    ENABLED_DISABLED_OPTIONS,
    COLOR_SCHEME_OPTIONS,
    QUALITY_OPTIONS,
} from '@/ui/settings';
import { LINK_DEFAULTS, NODE_DEFAULTS } from '@/core/config';

describe('Link Animation Options', () => {
    it('should have "Off" as first option', () => {
        expect(LINK_ANIMATION_OPTIONS[0].value).toBe(0);
        expect(LINK_ANIMATION_OPTIONS[0].text).toContain('Off');
    });

    it('should have Classic Flow option', () => {
        const classicFlow = LINK_ANIMATION_OPTIONS.find((o) => o.value === 9);
        expect(classicFlow).toBeDefined();
        expect(classicFlow?.text).toContain('Classic Flow');
    });

    it('should have all expected animation styles', () => {
        expect(LINK_ANIMATION_OPTIONS.length).toBeGreaterThanOrEqual(9);
    });
});

describe('Link Style Options', () => {
    it('should have spline as first option', () => {
        expect(LINK_STYLE_OPTIONS[0].value).toBe('spline');
    });

    it('should include all basic styles', () => {
        const values = LINK_STYLE_OPTIONS.map((o) => o.value);
        expect(values).toContain('straight');
        expect(values).toContain('linear');
        expect(values).toContain('hidden');
        expect(values).toContain('dotted');
        expect(values).toContain('dashed');
    });
});

describe('Marker Shape Options', () => {
    it('should have "none" option', () => {
        expect(MARKER_SHAPE_OPTIONS[0].value).toBe('none');
    });

    it('should have arrow option', () => {
        const arrow = MARKER_SHAPE_OPTIONS.find((o) => o.value === 'arrow');
        expect(arrow).toBeDefined();
    });

    it('should have all expected shapes', () => {
        const expectedShapes = [
            'none',
            'arrow',
            'diamond',
            'circle',
            'square',
            'triangle',
            'star',
            'heart',
        ];
        const values = MARKER_SHAPE_OPTIONS.map((o) => o.value);
        for (const shape of expectedShapes) {
            expect(values).toContain(shape);
        }
    });
});

describe('Node Animation Options', () => {
    it('should have "Off" as first option', () => {
        expect(NODE_ANIMATION_OPTIONS[0].value).toBe(0);
        expect(NODE_ANIMATION_OPTIONS[0].text).toContain('Off');
    });

    it('should have all 4 animation styles plus off', () => {
        expect(NODE_ANIMATION_OPTIONS.length).toBe(5);
        expect(NODE_ANIMATION_OPTIONS[1].value).toBe(1); // Gentle Pulse
        expect(NODE_ANIMATION_OPTIONS[2].value).toBe(2); // Neon Nexus
        expect(NODE_ANIMATION_OPTIONS[3].value).toBe(3); // Cosmic Ripple
        expect(NODE_ANIMATION_OPTIONS[4].value).toBe(4); // Flower of Life
    });
});

describe('Common Option Sets', () => {
    it('should have enabled/disabled options', () => {
        expect(ENABLED_DISABLED_OPTIONS.length).toBe(2);
        expect(ENABLED_DISABLED_OPTIONS[0].value).toBe(true);
        expect(ENABLED_DISABLED_OPTIONS[1].value).toBe(false);
    });

    it('should have color scheme options', () => {
        const values = COLOR_SCHEME_OPTIONS.map((o) => o.value);
        expect(values).toContain('default');
        expect(values).toContain('saturated');
        expect(values).toContain('vivid');
    });

    it('should have quality options', () => {
        expect(QUALITY_OPTIONS.length).toBe(3);
        expect(QUALITY_OPTIONS[0].value).toBe(1); // Basic
        expect(QUALITY_OPTIONS[1].value).toBe(2); // Balanced
        expect(QUALITY_OPTIONS[2].value).toBe(3); // Enhanced
    });
});

describe('Default Settings', () => {
    it('should have link defaults', () => {
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Animate']).toBeDefined();
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Link.Style']).toBe('spline');
        expect(LINK_DEFAULTS['🔗 Enhanced Links.Marker.Shape']).toBe('arrow');
    });

    it('should have node defaults', () => {
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Animate']).toBe(0);
        expect(NODE_DEFAULTS['📦 Enhanced Nodes.Animation.Speed']).toBe(1);
    });
});
