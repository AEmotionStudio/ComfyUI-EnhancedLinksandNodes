import type { GraphSpec } from '../helpers';

// Nodes in a pair share a height, so the link between their first slots is a straight line.

export const pair: GraphSpec = {
    nodes: {
        source: { type: 'ELNInt', pos: [300, 300] },
        target: { type: 'ELNInt', pos: [800, 300] },
    },
    links: { int: { from: 'source', to: 'target' } },
};

/** The input sits 300 px below the output, so each link render mode takes a different path. */
export const diagonal: GraphSpec = {
    nodes: {
        source: { type: 'ELNInt', pos: [300, 250] },
        target: { type: 'ELNInt', pos: [800, 550] },
    },
    links: { int: { from: 'source', to: 'target' } },
};

/** INT, FLOAT and STRING have no palette colour. They are linked after IMAGE, whose colour a renderer could carry over. */
export const typed: GraphSpec = {
    nodes: {
        image: { type: 'ELNImage', pos: [300, 100] },
        imageTarget: { type: 'ELNImage', pos: [800, 100] },
        int: { type: 'ELNInt', pos: [300, 250] },
        intTarget: { type: 'ELNInt', pos: [800, 250] },
        float: { type: 'ELNFloat', pos: [300, 400] },
        floatTarget: { type: 'ELNFloat', pos: [800, 400] },
        string: { type: 'ELNString', pos: [300, 550] },
        stringTarget: { type: 'ELNString', pos: [800, 550] },
        latent: { type: 'ELNLatent', pos: [300, 700] },
        latentTarget: { type: 'ELNLatent', pos: [800, 700] },
    },
    links: {
        image: { from: 'image', to: 'imageTarget' },
        int: { from: 'int', to: 'intTarget' },
        float: { from: 'float', to: 'floatTarget' },
        string: { from: 'string', to: 'stringTarget' },
        latent: { from: 'latent', to: 'latentTarget' },
    },
};

export const rerouted: GraphSpec = {
    nodes: {
        source: { type: 'ELNFloat', pos: [300, 300] },
        target: { type: 'ELNFloat', pos: [800, 300] },
    },
    links: { float: { from: 'source', to: 'target', reroute: [640, 460] } },
};

export const floating: GraphSpec = {
    nodes: {
        source: { type: 'ELNInt', pos: [300, 300] },
        target: { type: 'ELNInt', pos: [800, 300] },
    },
    links: { int: { from: 'source', to: 'target', reroute: [640, 460], floating: true } },
};

export const nodeStates: GraphSpec = {
    nodes: {
        string: { type: 'ELNString', pos: [300, 200] },
        collapsed: { type: 'ELNString', pos: [800, 200], collapsed: true },
        image: { type: 'ELNImage', pos: [300, 400] },
        bypassed: { type: 'ELNImage', pos: [800, 400], mode: 'bypass' },
        latent: { type: 'ELNLatent', pos: [300, 600] },
        muted: { type: 'ELNLatent', pos: [800, 600], mode: 'mute' },
    },
    links: {
        collapsed: { from: 'string', to: 'collapsed' },
        bypassed: { from: 'image', to: 'bypassed' },
        muted: { from: 'latent', to: 'muted' },
    },
};

export const subgraph: GraphSpec = {
    nodes: {
        source: { type: 'ELNFloat', pos: [250, 300] },
        inner: { type: 'ELNFloat', pos: [650, 300] },
        target: { type: 'ELNFloat', pos: [1050, 300] },
    },
    links: {
        in: { from: 'source', to: 'inner' },
        out: { from: 'inner', to: 'target' },
    },
    subgraph: ['inner'],
};

/** Every link type the test nodes carry, with reroutes, a floating link and each node state. */
export const mixed: GraphSpec = {
    nodes: {
        int: { type: 'ELNInt', pos: [300, 160] },
        intTarget: { type: 'ELNInt', pos: [800, 160] },
        float: { type: 'ELNFloat', pos: [300, 280] },
        floatTarget: { type: 'ELNFloat', pos: [800, 280] },
        string: { type: 'ELNString', pos: [300, 400] },
        stringTarget: { type: 'ELNString', pos: [800, 400], collapsed: true },
        image: { type: 'ELNImage', pos: [300, 520] },
        imageTarget: { type: 'ELNImage', pos: [800, 520], mode: 'bypass' },
        latent: { type: 'ELNLatent', pos: [300, 640] },
        latentTarget: { type: 'ELNLatent', pos: [800, 640], mode: 'mute' },
        floatingSource: { type: 'ELNInt', pos: [1100, 160] },
        floatingTarget: { type: 'ELNInt', pos: [1100, 400] },
    },
    links: {
        int: { from: 'int', to: 'intTarget' },
        float: { from: 'float', to: 'floatTarget', reroute: [640, 340] },
        string: { from: 'string', to: 'stringTarget' },
        image: { from: 'image', to: 'imageTarget' },
        latent: { from: 'latent', to: 'latentTarget' },
        floating: { from: 'floatingSource', to: 'floatingTarget', reroute: [1300, 300], floating: true },
    },
};

/** A legacy Reroute node, the frontend's node from before native reroutes, between two IMAGE links. */
export const legacyReroute: GraphSpec = {
    nodes: {
        source: { type: 'ELNImage', pos: [300, 300] },
        reroute: { type: 'Reroute', pos: [600, 400] },
        target: { type: 'ELNImage', pos: [900, 300] },
    },
    links: {
        in: { from: 'source', to: 'reroute' },
        out: { from: 'reroute', to: 'target' },
    },
};

/** KJNodes' Set and Get nodes under one name, which its Show links setting joins with a virtual link (interop leg only). */
export const setGet: GraphSpec = {
    nodes: {
        source: { type: 'ELNFloat', pos: [200, 200] },
        set: { type: 'SetNode', pos: [450, 200], widgets: ['eln'] },
        get: { type: 'GetNode', pos: [850, 500], widgets: ['eln'] },
        target: { type: 'ELNFloat', pos: [1150, 500] },
    },
    links: {
        set: { from: 'source', to: 'set' },
        get: { from: 'get', to: 'target' },
    },
};

/** For the gallery: an IMAGE link, a diagonal LATENT link and an INT link through a reroute. */
export const gallery: GraphSpec = {
    nodes: {
        image: { type: 'ELNImage', pos: [200, 120] },
        imageTarget: { type: 'ELNImage', pos: [700, 120] },
        latent: { type: 'ELNLatent', pos: [200, 300] },
        latentTarget: { type: 'ELNLatent', pos: [700, 420] },
        int: { type: 'ELNInt', pos: [200, 580] },
        intTarget: { type: 'ELNInt', pos: [700, 580] },
    },
    links: {
        image: { from: 'image', to: 'imageTarget' },
        latent: { from: 'latent', to: 'latentTarget' },
        int: { from: 'int', to: 'intTarget', reroute: [500, 720] },
    },
};

/** For the node rows of the contact sheets: two nodes of different sizes and a Sleep node, an output node, without links. */
export const nodeScene: GraphSpec = {
    nodes: {
        image: { type: 'ELNImage', pos: [220, 180] },
        latent: { type: 'ELNLatent', pos: [640, 300] },
        sleep: { type: 'ELNSleep', pos: [380, 540] },
    },
};
