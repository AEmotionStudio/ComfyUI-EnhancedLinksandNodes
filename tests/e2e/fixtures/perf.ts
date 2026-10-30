import type { GraphSpec, LinkSpec, NodeSpec } from '../helpers';

/** Input and output order of the ELNMix test node (fixtures/nodes/eln_e2e). */
export const MIX_TYPES = ['IMAGE', 'LATENT', 'MODEL', 'INT', 'FLOAT', 'STRING', 'ELN_CUSTOM'];

const ROWS = 8;
/** How many nodes back a link may start, which keeps links a few columns long. */
const REACH = 24;

function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * A seeded grid of ELNMix nodes, column by column. Each link joins an output to the input of the
 * same type on a later node, so links run left to right and every link type appears.
 */
export function perfGraph(nodeCount: number, linkCount: number, seed = 1): GraphSpec {
    const random = mulberry32(seed);
    const nodes: Record<string, NodeSpec> = {};
    for (let i = 0; i < nodeCount; i++) {
        nodes[`n${i}`] = { type: 'ELNMix', pos: [100 + Math.floor(i / ROWS) * 260, 100 + (i % ROWS) * 200] };
    }

    const inputs: [number, number][] = [];
    for (let node = 1; node < nodeCount; node++) {
        for (let slot = 0; slot < MIX_TYPES.length; slot++) inputs.push([node, slot]);
    }
    if (linkCount > inputs.length) throw new Error(`${nodeCount} nodes take at most ${inputs.length} links`);
    for (let i = inputs.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [inputs[i], inputs[j]] = [inputs[j], inputs[i]];
    }

    const links: Record<string, LinkSpec> = {};
    for (const [i, [target, slot]] of inputs.slice(0, linkCount).entries()) {
        const source = target - 1 - Math.floor(random() * Math.min(REACH, target));
        links[`l${i}`] = { from: `n${source}`, to: `n${target}`, output: slot, input: slot };
    }
    return { nodes, links };
}
