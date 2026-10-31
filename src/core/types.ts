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
