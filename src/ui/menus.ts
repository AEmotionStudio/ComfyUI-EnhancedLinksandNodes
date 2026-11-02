/**
 * What a node is given in its menu: its Node FX, an effect of its own or Use
 * global, Particles only, and its Completion FX, kept as flat keys in its
 * properties. Node FX sets every selected node when the node is one of them,
 * and the selection toolbox's button steps the selection through the same
 * effects. Each pick is one change the workflow's history can undo.
 *
 * @module ui/menus
 */

import type { IContextMenuValue } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { N, NODE_ANIMATION_OPTIONS } from '@/core/settings';

type Node = InstanceType<typeof LGraphNode>;

/** Where a node keeps what its menu set: its Node FX style and Particles only, and its Completion FX. */
const OWN_STYLE = 'enhanced_fx_style';
const OWN_ONLY = 'enhanced_fx_particles_only';
export const OWN_COMPLETION = 'enhanced_fx_completion';

/** The command the selection toolbox shows for nodes. */
export const SELECTION_FX = 'EnhancedLinksNodes.SelectionNodeFX';

const STYLES = new Set<unknown>(NODE_ANIMATION_OPTIONS.map((option) => option.value));

/** The Node FX style a node was given, if it is one: a workflow may hold anything there. */
export function ownStyle(node: Node): number | undefined {
    const style = node.properties[OWN_STYLE];
    return STYLES.has(style) ? (style as number) : undefined;
}

type Choices = Record<string, string | number | boolean | undefined>;

/** Sets what a menu picked on `nodes`, deleting what is undefined, as one change the workflow's history can undo. */
export function pick(nodes: readonly Node[], choices: Choices): void {
    app.canvas.emitBeforeChange();
    for (const node of nodes) {
        for (const [key, value] of Object.entries(choices)) {
            if (value === undefined) delete node.properties[key];
            else node.properties[key] = value;
        }
    }
    app.canvas.emitAfterChange();
    app.canvas.setDirty(true, false);
}

/** The nodes among what is selected on the canvas. */
export const selectedNodes = (): Node[] => [...app.canvas.selectedItems].filter((item): item is Node => item instanceof LGraphNode);

interface Effect {
    name: string;
    choices: Choices;
    /** Whether a node has it. */
    has(node: Node): boolean;
}

/** Node FX's effects, in the order its menu lists them and the toolbox steps through them: Use global, named after Animate's effect, Off, then each style. */
export function effects(): Effect[] {
    const global = N.animate ? NODE_ANIMATION_OPTIONS.find((option) => option.value === N.animate)!.text : 'Off';
    return [
        {
            name: `Use global (${global})`,
            choices: { [OWN_STYLE]: undefined, [OWN_ONLY]: undefined },
            has: (node) => ownStyle(node) === undefined && typeof node.properties[OWN_ONLY] !== 'boolean',
        },
        ...NODE_ANIMATION_OPTIONS.map((option): Effect => ({ name: option.value ? option.text : 'Off', choices: { [OWN_STYLE]: option.value }, has: (node) => ownStyle(node) === option.value })),
    ];
}

/** Whether a node draws its effect's particles alone: as its Particles only says, else as Show base effect does. */
export function particlesOnly(node: Node): boolean {
    const own = node.properties[OWN_ONLY];
    return typeof own === 'boolean' ? own : !N.animationsEnabled;
}

/** A menu entry, ticked when it is the node's. */
const entry = (content: string, ticked: boolean, callback: () => void): IContextMenuValue => ({ content: ticked ? `✓ ${content}` : content, callback });

/**
 * The node menu's Node FX and Completion FX, one submenu level each, with has_submenu, so the Vue node menu shows them
 * too (FE157 composables/graph/contextMenuConverter.ts L428-447). For a node among others selected, as right-clicking
 * keeps it (FE157 LGraphCanvas.ts L2615, FE1395 L2242), Node FX sets them all, and ticks what they all have.
 */
export function nodeMenu(node: Node): IContextMenuValue[] {
    const selection = selectedNodes();
    const nodes = node.selected && selection.length > 1 ? selection : [node];
    const only = nodes.every(particlesOnly);
    const completion = node.properties[OWN_COMPLETION];
    return [
        {
            content: nodes.length > 1 ? `Node FX (${nodes.length} selected)` : 'Node FX',
            has_submenu: true,
            submenu: {
                options: [
                    ...effects().map((effect) => entry(effect.name, nodes.every(effect.has), () => pick(nodes, effect.choices))),
                    null,
                    entry('Particles only', only, () => pick(nodes, { [OWN_ONLY]: !only })),
                ],
            },
        },
        {
            content: 'Completion FX',
            has_submenu: true,
            submenu: {
                options: [
                    entry('Use global', completion !== 'fireworks' && completion !== 'off', () => pick([node], { [OWN_COMPLETION]: undefined })),
                    entry('Fireworks', completion === 'fireworks', () => pick([node], { [OWN_COMPLETION]: 'fireworks' })),
                    entry('Off', completion === 'off', () => pick([node], { [OWN_COMPLETION]: 'off' })),
                ],
            },
        },
    ];
}
