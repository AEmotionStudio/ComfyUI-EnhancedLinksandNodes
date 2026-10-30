/**
 * Shared type definitions for the ComfyUI Enhanced Links and Nodes extension
 * @module types
 */

import type { LGraphNode, NodeId } from '@comfyorg/comfyui-frontend-types';

// =============================================================================
// Color Types
// =============================================================================

/** Hex color string in the format #RRGGBB */
export type HexColor = `#${string}`;

/** RGBA color string */
type RgbaColor = `rgba(${number}, ${number}, ${number}, ${number})`;

/** HSL color string */
type HslColor = `hsl(${number}, ${number}%, ${number}%)`;

/** Any valid CSS color value */
export type Color = HexColor | RgbaColor | HslColor | string;

/** Color enhancement schemes */
export type ColorScheme =
    | 'default'
    | 'saturated'
    | 'vivid'
    | 'contrast'
    | 'bright'
    | 'muted';

// =============================================================================
// Link Types
// =============================================================================

/** Available link rendering styles */
type LinkStyle =
    | 'spline'
    | 'straight'
    | 'linear'
    | 'hidden'
    | 'dotted'
    | 'dashed'
    | 'double'
    | 'stepped'
    | 'zigzag'
    | 'rope'
    | 'glowpath'
    | 'chain'
    | 'pulse'
    | 'holographic';

/** Link animation style (0 = off, 1-9 = animation styles) */
type LinkAnimationStyle = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

// =============================================================================
// Node Types
// =============================================================================

/** Node animation style (0 = off, 1-4 = animation styles) */
type NodeAnimationStyle = 0 | 1 | 2 | 3 | 4;

// =============================================================================
// State Types
// =============================================================================

/** Base animation state shared by link and node animations */
interface BaseAnimationState {
    isRunning: boolean;
    phase: number;
    lastFrame: number;
    animationFrame: number | null;
    totalTime: number;
    speedMultiplier: number;
    staticPhase: number;
    forceUpdate: boolean;
    forceRedraw: boolean;
    lastRenderState: unknown | null;
}

/** State specific to link animations */
export interface LinkState extends BaseAnimationState {
    particlePool: Map<number, unknown>;
    activeParticles: Set<unknown>;
    linkPositions: Map<number, unknown>;
    lastNodePositions: Map<number, unknown>;
    lastAnimStyle: LinkAnimationStyle | null;
    lastLinkStyle: LinkStyle | null;
    lastSettings: unknown | null;
}

/** State specific to node animations */
export interface NodeState extends BaseAnimationState {
    particlePhase: number;
    lastRAFTime: number;
    nodeEffects: Map<number, unknown>;
    isAnimating: boolean;
    frameSkipCount: number;
    maxFrameSkips: number;
    lastAnimStyle: NodeAnimationStyle | null;
    particlePool: Map<number, unknown>;
    activeParticles: Set<unknown>;
    playCompletionAnimation: boolean;
    completionPhase: number;
    completingNodes: Set<number>;
    disabledCompletionNodes: Set<number>;
    primaryCompletionNode: number | null;
}

// =============================================================================
// ComfyUI Types (External API)
// =============================================================================

/** ComfyUI node object */
export interface ComfyNode {
    id: NodeId | number;
    title: string;
    size: [number, number];
    selected?: boolean;
    /** LiteGraph's hover data; the test fixtures set true. */
    mouseOver?: LGraphNode['mouseOver'] | boolean;
}
