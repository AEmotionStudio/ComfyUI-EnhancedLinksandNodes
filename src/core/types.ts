/**
 * Shared type definitions for the ComfyUI Enhanced Links and Nodes extension
 * @module types
 */

import type { LGraphNode, NodeId } from '@comfyorg/comfyui-frontend-types';

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
