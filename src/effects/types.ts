/**
 * Animation effect types and interfaces for node animations.
 * These define the structure for animation effects without ComfyUI dependencies.
 *
 * @module effects/types
 */

import type { ComfyNode } from '@/core/types';

// =============================================================================
// Animation Effect Types
// =============================================================================

/** Parameters for animation rendering */
export interface AnimationParams {
    /** Current animation phase (0 to 2π, continuous) */
    phase: number;
    /** Animation intensity multiplier (0-2) */
    intensity: number;
    /** Whether in static mode (no animation) */
    isStaticMode: boolean;
    /** Whether animation should be paused */
    isPaused: boolean;
    /** Animation speed multiplier */
    animSpeed: number;
    /** Animation direction (1 = forward, -1 = reverse) */
    direction: number;
}

/** Quality settings for animation rendering */
export interface QualitySettings {
    /** Quality level (1 = low, 2 = medium, 3 = high) */
    quality: number;
    /** Glow intensity (0-1) */
    glowIntensity: number;
    /** Animation size multiplier */
    animationSize: number;
}

/** Particle settings for effects */
interface ParticleSettings {
    /** Whether to show particles */
    showParticles: boolean;
    /** Particle density multiplier (0.5-2) */
    density: number;
    /** Particle speed multiplier */
    speed: number;
    /** Particle intensity (0.1-2) */
    intensity: number;
    /** Particle size multiplier */
    size: number;
    /** Particle glow intensity */
    glowIntensity: number;
}

/** Color settings for animation */
interface ColorSettings {
    /** Primary color */
    primary: string;
    /** Secondary color */
    secondary: string;
    /** Accent color */
    accent: string;
    /** Hover outline color */
    hoverColor: string;
    /** Whether to show hover effects */
    showHover: boolean;
}

/** Complete settings for node animation effects */
export interface NodeEffectSettings {
    animation: AnimationParams;
    quality: QualitySettings;
    particles: ParticleSettings;
    colors: ColorSettings;
}

// =============================================================================
// Calculation Helpers
// =============================================================================

/**
 * Calculate the effective static mode state.
 */
export function isEffectivelyStatic(params: AnimationParams): boolean {
    return params.isStaticMode || params.isPaused;
}

/**
 * Calculate the scaled animation time.
 */
export function getScaledTime(params: AnimationParams): number {
    return isEffectivelyStatic(params) ? params.phase : params.phase * params.animSpeed;
}

/**
 * Calculate glow radius for a node.
 */
export function calculateGlowRadius(
    node: ComfyNode,
    quality: QualitySettings
): number {
    return (
        Math.max(node.size[0], node.size[1]) *
        (0.5 + quality.quality * 0.1) *
        quality.animationSize
    );
}

/**
 * Calculate breathing effect scale.
 *
 * @param phase - Current animation phase
 * @param direction - Animation direction (1 or -1)
 * @param animSpeed - Animation speed multiplier
 * @param isStatic - Whether in static mode
 * @returns Scale value for breathing effect (0-1)
 */
export function calculateBreatheScale(
    phase: number,
    direction: number,
    animSpeed: number,
    isStatic: boolean
): number {
    const breathePhase = isStatic ? phase : phase * 0.375 * direction * animSpeed;
    return Math.pow(Math.sin(breathePhase), 2);
}

/**
 * Calculate particle position with organic movement.
 *
 * @param index - Particle index
 * @param particleCount - Total particle count
 * @param particleTime - Current particle animation time
 * @param orbitRadius - Base orbit radius
 * @param params - Animation parameters
 * @returns Position {x, y} and size factor
 */
export function calculateParticlePosition(
    index: number,
    particleCount: number,
    particleTime: number,
    orbitRadius: number,
    settings: {
        particleSpeed: number;
        particleIntensity: number;
        isStatic: boolean;
        phase: number;
        quality: number;
    }
): { x: number; y: number; sizeFactor: number } {
    const { particleSpeed, particleIntensity, isStatic, phase, quality } = settings;

    const particleOffset = index * ((Math.PI * 2) / particleCount);
    const individualSpeed = isStatic
        ? 1
        : (0.5 + Math.sin(index) * 0.25) * particleIntensity * particleSpeed;

    const particlePhase = isStatic
        ? phase + particleOffset
        : particleTime * individualSpeed + particleOffset;

    // Calculate dynamic orbit radius
    const dynamicOrbit =
        orbitRadius *
        (0.8 +
            Math.sin(isStatic ? phase + index : particleTime * 0.2 * particleSpeed + index) * 0.25 +
            Math.cos(isStatic ? phase + index * 0.7 : particleTime * 0.3 * particleSpeed + index * 0.7) * 0.25);

    const angle = particlePhase + (index * Math.PI * 2) / particleCount;
    const randomFactor = quality > 1 ? 12 : 6;

    // Enhanced organic movement
    const torusEffect = particleIntensity * 2.0;
    const orbitOffset = Math.sin(particleTime * 0.3 * particleSpeed + index) * torusEffect;

    // Jitter for natural movement
    const jitterX = isStatic
        ? 0
        : Math.sin(particleTime * 3 * particleSpeed + index) * 1.2 * particleIntensity +
        Math.cos(particleTime * 2 * particleSpeed + index * 0.5) * 0.5 * particleIntensity;

    const jitterY = isStatic
        ? 0
        : Math.cos(particleTime * 2.5 * particleSpeed + index) * 1.2 * particleIntensity +
        Math.sin(particleTime * 1.5 * particleSpeed + index * 0.7) * 0.5 * particleIntensity;

    const verticalOffset = -dynamicOrbit * 0.3;

    const x =
        Math.cos(angle) * (dynamicOrbit + orbitOffset) +
        Math.sin(isStatic ? phase + index : particleTime * 0.2 * particleSpeed + index) * randomFactor +
        jitterX;

    const y =
        Math.sin(angle) * (dynamicOrbit + orbitOffset) +
        verticalOffset +
        Math.cos(isStatic ? phase + index : particleTime * 0.15 * particleSpeed + index) * randomFactor +
        jitterY;

    // Size variation
    const sizeFactor = isStatic
        ? 1
        : 0.7 + Math.sin(particleTime * 0.5 * particleSpeed + index) * 0.4 + Math.random() * 0.3;

    return { x, y, sizeFactor };
}

/**
 * Calculate particle blink factor for twinkling effect.
 */
export function calculateBlinkFactor(
    index: number,
    particleTime: number,
    particleSpeed: number,
    isStatic: boolean
): number {
    if (isStatic) return 0.8;

    const blinkOffset = Math.abs((Math.sin(index * 12.9898) * 43758.5453) % (2 * Math.PI));
    const blinkSpeed = 1.2 + Math.sin(index * 0.7) * 0.6;

    return 0.4 + 0.8 * Math.pow(Math.sin(particleTime * blinkSpeed * particleSpeed + blinkOffset), 2);
}
