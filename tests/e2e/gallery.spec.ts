// Screenshots of how links and nodes look, for people to compare by eye: they check nothing. Local only:
//   pnpm e2e:gallery
// The scenes are attached to the HTML report (playwright-report) and saved in the test's test-results folder.
//
// The page runs on Playwright's clock. Links start with Animate 0 and node effects are off, so the extension's
// clock stands still while the page loads; each scene then changes its settings with the clock paused and runs it
// for SCENE_MS. That keeps the screenshots close from run to run, not identical: the paused clock stops between
// two of its 16 ms frames, so a scene runs 62 or 63 of them.
//
// The contact sheets put v3 beside v1 on the 1.39.5 leg: each row is one effect, shot 0.6, 1.2 and 2.4 s after it
// starts (the fireworks sooner), in v1 (the v1-ref project), in v3 with v1's settings (Classic) and in v3 with its
// own defaults. Each row starts on a freshly loaded page, so both clocks start from nothing. Each project writes its
// frames and a manifest of them (title, what to look for, settings, times, files) to ELN_SHEETS, or
// test-results/sheets.
import fs from 'node:fs';
import path from 'node:path';
import type { Page, TestInfo } from '@playwright/test';
import * as graphs from './fixtures/graphs';
import { buildGraph, openApp, setSetting, test, type GraphSpec } from './helpers';

const SCENE_MS = 1000;

/** The part of the gallery graph the link screenshots show, in graph coordinates: left, top, right, bottom. */
const LINK_AREA = [150, 60, 900, 760];

interface Scene {
    name: string;
    /** Over the defaults and the default look's link animation. */
    settings: Record<string, unknown>;
    /** What it shows, when that is not the test's area. */
    area?: number[];
}

const LINK_SCENES: Scene[] = [
    { name: 'default look (Classic Flow)', settings: {} },
    { name: 'Sacred Flow', settings: { '🔗 Enhanced Links.Animate': 1 } },
    { name: 'DNA Helix', settings: { '🔗 Enhanced Links.Animate': 6 } },
    { name: 'Lava Flow', settings: { '🔗 Enhanced Links.Animate': 7 } },
    { name: 'Static mode', settings: { '🔗 Enhanced Links.Static.Mode': true } },
    { name: 'native Straight render mode', settings: { 'Comfy.LinkRenderMode': 0 } },
    { name: 'Link Style dotted', settings: { '🔗 Enhanced Links.Link.Style': 'dotted' } },
    { name: 'Link Style stepped', settings: { '🔗 Enhanced Links.Link.Style': 'stepped' } },
    { name: 'Link Style Wave', settings: { '🔗 Enhanced Links.Link.Style': 'zigzag' } },
    { name: 'Link Style Coil', settings: { '🔗 Enhanced Links.Link.Style': 'coil' } },
    { name: 'Link Style dashed', settings: { '🔗 Enhanced Links.Link.Style': 'dashed' } },
    { name: 'rerouted link', settings: {}, area: [300, 560, 760, 780] },
];

/** The nodeStates graph: a node of each type on the left, and on the right a collapsed, a bypassed and a muted one. */
const NODE_AREA = [180, 60, 1180, 780];

const NODE_SCENES: Scene[] = [
    { name: 'Gentle Pulse', settings: { '📦 Enhanced Nodes.Animate': 1 } },
    { name: 'Neon Nexus', settings: { '📦 Enhanced Nodes.Animate': 2 } },
    { name: 'Cosmic Ripple', settings: { '📦 Enhanced Nodes.Animate': 3 } },
    { name: 'Sacred Rosette', settings: { '📦 Enhanced Nodes.Animate': 4 } },
    { name: 'Flower of Life', settings: { '📦 Enhanced Nodes.Animate': 5 } },
    { name: 'Jelly', settings: { '📦 Enhanced Nodes.Animate': 6 } },
    { name: 'Circuit Trace', settings: { '📦 Enhanced Nodes.Animate': 7 } },
    { name: 'Aurora Veil', settings: { '📦 Enhanced Nodes.Animate': 8 } },
    { name: 'Ember Crown', settings: { '📦 Enhanced Nodes.Animate': 9 } },
    { name: 'Gentle Pulse with particles', settings: { '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Particle.Show': true } },
    {
        name: 'Cosmic Ripple at full energy with particles',
        settings: { '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Intensity': 2, '📦 Enhanced Nodes.Animation.Glow': 1, '📦 Enhanced Nodes.Particle.Show': true },
    },
    { name: 'particles alone', settings: { '📦 Enhanced Nodes.Particle.Show': true } },
    { name: 'animated titles', settings: { '📦 Enhanced Nodes.Animate': 1, '📦 Enhanced Nodes.Text.Animation.Enabled': true } },
];

type Clip = { x: number; y: number; width: number; height: number };

/** The page rectangle that shows a graph area at the current view. */
function clipOf(page: Page, [left, top, right, bottom]: number[]): Promise<Clip> {
    return page.evaluate(([left, top, right, bottom]) => {
        const { canvas } = window.app;
        const rect = canvas.canvas.getBoundingClientRect();
        const [x0, y0] = canvas.ds.convertOffsetToCanvas([left, top]);
        const [x1, y1] = canvas.ds.convertOffsetToCanvas([right, bottom]);
        return { x: rect.left + x0, y: rect.top + y0, width: x1 - x0, height: y1 - y0 };
    }, [left, top, right, bottom]);
}

async function shoot(page: Page, testInfo: TestInfo, index: number, name: string, area: number[]): Promise<void> {
    const path = testInfo.outputPath(`${String(index).padStart(2, '0')}-${name.replace(/\W+/g, '-')}.png`);
    await page.screenshot({ path, clip: await clipOf(page, area) });
    await testInfo.attach(name, { path, contentType: 'image/png' });
}

/** Opens a graph on Playwright's paused clock, then shoots each scene after running it, putting back what it set. */
async function shootScenes(page: Page, testInfo: TestInfo, graph: GraphSpec, scenes: Scene[], area: number[]): Promise<void> {
    await page.clock.install();
    await openApp(page);
    await buildGraph(page, graph);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    for (const [i, scene] of scenes.entries()) {
        const settings: Record<string, unknown> = { '🔗 Enhanced Links.Animate': 9, ...scene.settings };
        const ids = Object.keys(settings);
        const before = await page.evaluate((ids) => ids.map((id) => window.app.extensionManager.setting.get(id)), ids);
        for (const id of ids) await setSetting(page, id, settings[id]);
        await page.clock.runFor(SCENE_MS);
        await shoot(page, testInfo, i + 1, scene.name, scene.area ?? area);
        // Back to nothing that moves, for the next scene.
        for (const [j, id] of ids.entries()) await setSetting(page, id, before[j]);
    }
}

test.describe('gallery', { tag: '@gallery' }, () => {
    test.use({ settings: { '🔗 Enhanced Links.Animate': 0 } });
    test.beforeEach(({}, testInfo) => {
        test.skip(testInfo.project.name === 'v1-ref', "v3's own scenes");
    });

    test('links', async ({ page }, testInfo) => {
        test.setTimeout(180_000);
        await shootScenes(page, testInfo, graphs.gallery, LINK_SCENES, LINK_AREA);
    });

    test('nodes', async ({ page }, testInfo) => {
        test.setTimeout(180_000);
        await shootScenes(page, testInfo, graphs.nodeStates, NODE_SCENES, NODE_AREA);
    });
});

// =============================================================================
// Contact sheets
// =============================================================================

/** When each row is shot, in ms after its settings are in; a still row once, at the first. */
const TIMES = [600, 1200, 2400];

/** What every page loads with: nothing moves, so the clocks start with each row. v1's node effects are on by default. */
const QUIET = { '🔗 Enhanced Links.Animate': 0, '📦 Enhanced Nodes.Animate': 0, '📦 Enhanced Nodes.Particle.Show': false };

/** v1's link settings with an empty settings file (old_link_animations.js:19-45), with node effects off so link rows show links alone. */
const CLASSIC: Record<string, unknown> = {
    '🔗 Enhanced Links.Animate': 9,
    '🔗 Enhanced Links.Animation.Speed': 1,
    '🔗 Enhanced Links.Direction': 1,
    '🔗 Enhanced Links.Static.Mode': false,
    '🔗 Enhanced Links.Link.Style': 'spline',
    '🔗 Enhanced Links.Thickness': 3,
    '🔗 Enhanced Links.Quality': 1,
    '🔗 Enhanced Links.Particle.Density': 0.5,
    '🔗 Enhanced Links.Color.Mode': 'default',
    '🔗 Enhanced Links.Color.Primary': '#ffb300',
    '🔗 Enhanced Links.Color.Secondary': '#fb00ff',
    '🔗 Enhanced Links.Color.Accent': '#9d00ff',
    '🔗 Enhanced Links.Color.Scheme': 'default',
    '🔗 Enhanced Links.Glow.Intensity': 10,
    '🔗 Enhanced Links.Marker.Enabled': true,
    '🔗 Enhanced Links.Marker.Shape': 'arrow',
    '🔗 Enhanced Links.Marker.Size': 3,
    '🔗 Enhanced Links.Marker.Color.Mode': 'default',
    '🔗 Enhanced Links.Marker.Color': '#00fff7',
    '🔗 Enhanced Links.Marker.Glow': 10,
    '🔗 Enhanced Links.Marker.Effects': 'none',
    '🔗 Enhanced Links.Link.Shadow.Enabled': true,
    '🔗 Enhanced Links.Marker.Shadow.Enabled': true,
    '🔗 Enhanced Links.Pause.During.Render': true,
    '📦 Enhanced Nodes.Animate': 0,
    '📦 Enhanced Nodes.Particle.Show': false,
};

/**
 * v1's node settings with an empty settings file (old_node_animations.js:146-178, 209-690), which the node rows start
 * from (tests/unit/characterize/v1-inputs.ts has them as V1_NODE_SETTINGS).
 */
const V1_NODES: Record<string, unknown> = {
    '📦 Enhanced Nodes.Animate': 2,
    '📦 Enhanced Nodes.Animations.Enabled': true,
    '📦 Enhanced Nodes.End Animation.Enabled': false,
    '📦 Enhanced Nodes.Completion.Style': 'fireworks',
    '📦 Enhanced Nodes.Static.Mode': false,
    '📦 Enhanced Nodes.Direction': 1,
    '📦 Enhanced Nodes.Animation.Speed': 1,
    '📦 Enhanced Nodes.Quality': 1,
    '📦 Enhanced Nodes.Particle.Density': 0.5,
    '📦 Enhanced Nodes.Intensity': 1,
    '📦 Enhanced Nodes.Glow': 1,
    '📦 Enhanced Nodes.Animation.Glow': 0.5,
    '📦 Enhanced Nodes.Glow.Show': true,
    '📦 Enhanced Nodes.Color.Mode': 'custom',
    '📦 Enhanced Nodes.Color.Scheme': 'default',
    '📦 Enhanced Nodes.Color.Primary': '#ffb300',
    '📦 Enhanced Nodes.Color.Secondary': '#fb00ff',
    '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
    '📦 Enhanced Nodes.Color.Hover': '#00ff15',
    '📦 Enhanced Nodes.Color.Particle': '#ffb300',
    '📦 Enhanced Nodes.Particle.Glow': 1,
    '📦 Enhanced Nodes.Particle.Intensity': 1,
    '📦 Enhanced Nodes.Particle.Color.Mode': 'default',
    '📦 Enhanced Nodes.Particle.Size': 1,
    '📦 Enhanced Nodes.Particle.Speed': 1,
    '📦 Enhanced Nodes.Color.Hover.Show': false,
    '📦 Enhanced Nodes.Particle.Show': true,
    '📦 Enhanced Nodes.Pause.During.Render': true,
    '📦 Enhanced Nodes.Animation.Size': 1,
    '📦 Enhanced Nodes.Text.Animation.Enabled': false,
    '📦 Enhanced Nodes.Text.Color': '#00ffff',
    '📦 Enhanced Nodes.Text.Glow': 0.5,
    '📦 Enhanced Nodes.Text.Size': 14,
    '📦 Enhanced Nodes.Text.Style': 'neon',
    '📦 Enhanced Nodes.Text.Letter.Spacing': 0,
    '📦 Enhanced Nodes.Text.Position.Y': 0,
    '📦 Enhanced Nodes.Text.Position.X': 0,
    '📦 Enhanced Nodes.Text.Rotation.Radius': 0,
    '📦 Enhanced Nodes.Text.Rotation.Angle': 0,
};

interface Row {
    slug: string;
    title: string;
    /** What to compare across the columns. */
    look: string;
    /** Under the row's own settings in its Classic column only: the v1 settings it starts from, beyond the links'. */
    base?: Record<string, unknown>;
    settings: Record<string, unknown>;
    /** New in v3: v1 has no frame of it. */
    v3?: boolean;
    /** Held still: shot once. */
    still?: boolean;
    /** One of the four scenes of v1's README previews, on ComfyUI's default workflow: the preview it recreates. */
    preview?: string;
    /** On the node scene, not the links' gallery graph. */
    nodes?: boolean;
    /** The type of the scene's node selected as the row starts. */
    select?: string;
    /** Whether a run finishes as the row starts, which v1 took from the queue emptying and v3 from the run's own events. */
    run?: boolean;
    /** Whether the menu of the scene's first node is open on its Node FX (v1: Node Animation Style) submenu. */
    menu?: boolean;
    /** When it is shot, if not at TIMES. */
    times?: number[];
}

const ANIMATE = '🔗 Enhanced Links.Animate';
const STYLE = '🔗 Enhanced Links.Link.Style';
const SHAPE = '🔗 Enhanced Links.Marker.Shape';
const NODE_ANIMATE = '📦 Enhanced Nodes.Animate';
const PARTICLES = '📦 Enhanced Nodes.Particle.Show';

const NODE_EFFECTS: [number, string, string][] = [
    [1, 'Gentle Pulse', 'A light breathing over each node, white at its core, with fireflies about it. v3 draws it over the body as v1 did, and what falls outside the node under the other nodes.'],
    [2, 'Neon Nexus', "v1's default look: a flickering neon tube round each node, a scan line, and a lattice of spinning hexagons with a marching grid down its left side."],
    [3, 'Cosmic Ripple', 'Rings rippling out from the centre of each node, in a corona of motes circling it.'],
    [4, 'Sacred Rosette', "v1's Flower of Life, renamed: a rosette of circles turning on each node, each ring now closed, with dots circling its points."],
    [5, 'Flower of Life', 'New in v3: the true Flower of Life, nineteen circles drawing themselves in round each node, the Seed of Life first, then turning slowly in bloom, with sparks running round them.'],
    [6, 'Jelly', 'New in v3: a gel tint and gloss on each node, bubbles rising through it, and the node itself wobbling as it is dragged, dropped, selected or finished by a run.'],
    [7, 'Circuit Trace', 'New in v3: each node a chip, pins out of its sides and foot wired in by faint traces to pads, a pulse racing along each trace and lighting its pad, with sparks trailing it.'],
    [8, 'Aurora Veil', 'New in v3: curtains of light hanging from the title bar into each node, their hems waving as they drift and shimmer, with motes rising through the body.'],
    [9, 'Ember Crown', 'New in v3: a crown of flames licking up from each title bar, swaying and flickering, gold to red, a warmth under the title, and embers rising and dying out.'],
];

const TITLE_NAMES = { neon: 'Neon pulse', cyberpunk: 'Glitch', retro: 'Retro', pulse: 'Simple pulse', minimal: 'Minimal' };
const TITLE_LOOKS = {
    neon: 'Three glowing layers under a white highlight, breathing.',
    cyberpunk: 'Pink, cyan and yellow copies sliding apart behind the glowing title.',
    retro: 'Red and cyan ghosts a pixel either side, rolling up and down.',
    pulse: 'The title breathing its glow in and out.',
    minimal: 'The title fading in and out over a faint underline.',
};

const ANIMATIONS: [number, string, string][] = [
    [1, 'Sacred Flow', "A glowing ribbon with twinkling beads. v3's ribbon follows the curve (v1's ran straight between two points at its defaults) and its wobble travels downstream, toward the input."],
    [2, 'Crystal Stream', 'Heptagons racing along a faint link, spinning and swelling. Same count, size and pace as v1; the ghost link glows in its own colour.'],
    [3, 'Quantum Field', 'Five faint filaments swaying around the path at v1\'s rate (a 2.4 s cycle).'],
    [4, 'Cosmic Weave', 'Three threads braiding toward the input. v3 keeps them on the visible link; v1 drew them along a curve from the other end that overshot the slots.'],
    [5, 'Energy Pulse', 'Orbs leaving the output, shrinking and fading by the input, over a faint link.'],
    [6, 'DNA Helix', 'Two strands and sixteen rungs screwing toward the input, on the link\'s own path in v3.'],
    [7, 'Lava Flow', 'A molten core in a glowing sheath with embers. v3\'s ripples run downstream and across the path (v1\'s ran upstream, up and down only); the sheath glows in its own colour.'],
    [8, 'Stellar Plasma', 'Plasma beads on a rolling wave, in two colour halves, and sparks. v3\'s sparks stream along the link; v1\'s piled up at the input.'],
    [9, 'Classic Flow', 'Arrows gliding toward the input over a link with v1\'s dark halo: the default look.'],
    [10, 'Merkaba Beads', 'New in v3: star tetrahedra turning as they glide along a faint link, grown out of the output and back into the input.'],
    [11, 'DNA Helix 3D', 'New in v3: a helix with depth screwing toward the input, its far side faint and fine behind the rungs, its near side bright and glowing.'],
    [12, 'Comet Trails', 'New in v3: bright heads flying along a faint link, their tails tapering and fading behind them along the path.'],
    [13, 'Stardust', 'New in v3: star dust drifting along a faint link, swelling and twinkling toward the middle, the brightest flashing a sparkle.'],
];

const MARKER_SHAPES = ['diamond', 'circle', 'square', 'triangle', 'star', 'heart', 'cross', 'hexagon', 'flower', 'spiral', 'none'];

const ROWS: Row[] = [
    ...ANIMATIONS.map(([n, name, look]): Row => ({ slug: `animate-${n}`, title: name, look, settings: { [ANIMATE]: n }, v3: n > 9 })),
    ...ANIMATIONS.map(([n, name]): Row => ({
        slug: `still-${n}`,
        title: `${name}, still`,
        look: n > 9 ? "Static Mode's pose: its motion's, held at the still phase." : "Static Mode's pose. v3 always shows v1's first still pose; v1 switched between two after some setting changes.",
        settings: { [ANIMATE]: n, '🔗 Enhanced Links.Static.Mode': true },
        still: true,
        v3: n > 9,
    })),
    ...MARKER_SHAPES.map((shape): Row => ({
        slug: `marker-${shape}`,
        title: `Classic Flow, ${shape} markers`,
        look: shape === 'spiral'
            ? "v1 had a spiral in its code but not in its options, and filled it, which closed it into a blob; v3 offers it and strokes it."
            : 'The marker shape, its glow and its halo, as v1 drew them.',
        settings: { [SHAPE]: shape },
    })),
    { slug: 'marker-merkaba', title: 'Classic Flow, merkaba markers', look: 'New in v3: two triangles turning with the phase.', settings: { [SHAPE]: 'merkaba' }, v3: true },
    { slug: 'marker-pulse', title: 'Classic Flow, pulsing markers', look: 'Markers fading in and out along the link with the phase.', settings: { '🔗 Enhanced Links.Marker.Effects': 'pulse' } },
    { slug: 'marker-fade', title: 'Classic Flow, fading markers', look: 'Markers fading out toward the input.', settings: { '🔗 Enhanced Links.Marker.Effects': 'fade' } },
    { slug: 'marker-rainbow', title: 'Classic Flow, rainbow markers', look: 'Markers running through the hues; v3 never jumps when the phase wraps.', settings: { '🔗 Enhanced Links.Marker.Effects': 'rainbow' } },
    {
        slug: 'marker-inherit',
        title: 'Classic Flow, markers the colour of custom links',
        look: "Marker colour 'Same as link' (v1's inherit, restored) with custom link colours: markers in the primary colour.",
        settings: { '🔗 Enhanced Links.Color.Mode': 'custom', '🔗 Enhanced Links.Marker.Color.Mode': 'inherit' },
    },
    { slug: 'marker-custom', title: 'Classic Flow, custom marker colour', look: 'Markers in the custom cyan.', settings: { '🔗 Enhanced Links.Marker.Color.Mode': 'custom' } },
    {
        slug: 'marker-all',
        title: 'Energy Pulse with markers',
        look: 'New in v3 (Markers on every animation): circle markers over Energy Pulse.',
        settings: { [ANIMATE]: 5, '🔗 Enhanced Links.Marker.All': true, [SHAPE]: 'circle' },
        v3: true,
    },
    {
        slug: 'shadow-drop',
        title: 'Classic Flow, drop shadow',
        look: "New in v3 as an option: v2's offset drop shadow (Shadow style). v1 drew only the centred halo of the first row.",
        settings: { '🔗 Enhanced Links.Shadow.Style': 'drop' },
        v3: true,
    },
    {
        slug: 'shadow-off',
        title: 'Classic Flow without shadows',
        look: 'No halo under the link or the markers.',
        settings: { '🔗 Enhanced Links.Link.Shadow.Enabled': false, '🔗 Enhanced Links.Marker.Shadow.Enabled': false },
    },
    ...([
        ['straight', 'Direct', "ComfyUI's Linear path, with its slot stubs (v1 drew a plain diagonal)."],
        ['linear', 'Right-angle', "ComfyUI's Straight path (v1 drew its own three legs)."],
        ['hidden', 'Effect only', 'No link body; the markers still run.'],
        ['dotted', 'Dotted', 'Dots that march with the flow; along the curve in v3, along a straight line in v1.'],
        ['dashed', 'Dashed', 'Dashes that march with the flow, along the curve.'],
        ['double', 'Double', 'Two rails beside the curve.'],
        ['stepped', 'Stepped', 'Steps with rounded corners and a stub into the input.'],
        ['zigzag', 'Wave', "A tapered sine wave in v3; v1's zigzag."],
        ['rope', 'Rope', 'A twisted line along the curve.'],
        ['glowpath', 'Glow path', 'The link with a soft white sheen along the curve.'],
        ['chain', 'Chain', 'Rings along the curve.'],
        ['pulse', 'Pulse', 'Dashes with soft blobs along the curve.'],
        ['holographic', 'Holographic', 'A sheen and scanlines across the curve.'],
    ] as const).map(([style, name, look]): Row => ({ slug: `style-${style}`, title: `Link path ${name}`, look, settings: { [STYLE]: style } })),
    { slug: 'style-coil', title: 'Link path Coil', look: 'New in v3: tapered loops along the link.', settings: { [STYLE]: 'coil' }, v3: true },
    ...NODE_EFFECTS.map(([n, name, look]): Row => ({ slug: `node-${n}`, title: `${name}, with particles`, look, base: V1_NODES, settings: { [NODE_ANIMATE]: n, [PARTICLES]: true }, nodes: true, v3: n > 4 })),
    {
        slug: 'node-particles-only',
        title: 'Neon Nexus, particles only',
        look: "Show base effect off: the hexagon lattice and its grid alone, as v1's Particles Only drew them for Neon Nexus.",
        base: V1_NODES,
        settings: { [NODE_ANIMATE]: 2, [PARTICLES]: true, '📦 Enhanced Nodes.Animations.Enabled': false },
        nodes: true,
    },
    {
        slug: 'node-selected',
        title: 'Neon Nexus on a selected node: halo and frame',
        look: "v1's halo, the node's shadow in the effect's primary colour, round every node with an effect, and its frame round the selected one (the top left node): a line in the secondary colour glowing in the accent.",
        base: V1_NODES,
        settings: { [NODE_ANIMATE]: 2, [PARTICLES]: false },
        nodes: true,
        select: 'ELNImage',
    },
    ...(['neon', 'cyberpunk', 'retro', 'pulse', 'minimal'] as const).map((style): Row => ({
        slug: `title-${style}`,
        title: `Title style ${TITLE_NAMES[style]}`,
        look: `${TITLE_LOOKS[style]} v1 drew its title centred 16 px into the node in Arial, over the native title, which still showed in the title bar; v3 restyles the native title in its place, in ComfyUI's font. Over Gentle Pulse, as v1 drew titles only on nodes with an effect.`,
        base: V1_NODES,
        settings: { [NODE_ANIMATE]: 1, [PARTICLES]: false, '📦 Enhanced Nodes.Text.Animation.Enabled': true, '📦 Enhanced Nodes.Text.Style': style },
        nodes: true,
    })),
    {
        slug: 'fireworks',
        title: 'Fireworks when a run finishes',
        look: "Three bursts in rose, cyan and gold, each a white-hot core and glittering sparks pulled down, over a show of 1.2 s. v1 burst over every node when the queue emptied, the sparks jumping about each frame; v3 bursts over the run's output node (the Sleep node) and each spark flies out on its own path. Shot 0.2, 0.5 and 0.9 s in.",
        base: V1_NODES,
        settings: { '📦 Enhanced Nodes.End Animation.Enabled': true },
        nodes: true,
        run: true,
        times: [200, 500, 900],
    },
    {
        slug: 'node-menu',
        title: 'The node menu',
        look: "v1's Node Animation Style submenu (Use Global, Off and the four styles) beside v3's Node FX (Use global, Off, the four styles and Particles only); Completion FX sits beside it.",
        base: V1_NODES,
        settings: {},
        nodes: true,
        menu: true,
        still: true,
    },
];

/** The four README previews (git show 1ecca1d:images/preview*.webp) on ComfyUI's default workflow, with the settings they appear to use. */
const PREVIEWS: Row[] = [
    {
        slug: 'preview-look',
        title: 'README preview: the overall look',
        look: 'Recreates frame 92 of preview.webp: Crystal Stream links and Cosmic Ripple nodes in yellow and green.',
        preview: 'preview',
        settings: {
            [ANIMATE]: 2, '🔗 Enhanced Links.Color.Mode': 'custom', '🔗 Enhanced Links.Color.Primary': '#ffd900', '🔗 Enhanced Links.Color.Secondary': '#00ff84', '🔗 Enhanced Links.Color.Accent': '#00ff0d',
            '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Color.Mode': 'custom', '📦 Enhanced Nodes.Color.Primary': '#ffd900', '📦 Enhanced Nodes.Color.Secondary': '#00ff84', '📦 Enhanced Nodes.Color.Accent': '#00ff0d',
        },
    },
    {
        slug: 'preview-menu',
        title: 'README preview: the node menu',
        look: "Recreates preview2.webp: Classic Flow links and v1's default Neon Nexus nodes in amber and pink, with particles, and the first node's menu open on its effect submenu.",
        preview: 'preview2',
        menu: true,
        settings: {
            '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Color.Mode': 'custom', '📦 Enhanced Nodes.Color.Primary': '#ffb300', '📦 Enhanced Nodes.Color.Secondary': '#fb00ff', '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
            '📦 Enhanced Nodes.Particle.Show': true,
        },
    },
    {
        slug: 'preview-completion',
        title: 'README preview: the completion effect',
        look: "Recreates preview3.webp: Sacred Flow links in custom orange and pink, green Cosmic Ripple nodes, and the fireworks of a run finishing: v1 over every node, v3 over the workflow's output node.",
        preview: 'preview3',
        run: true,
        settings: {
            [ANIMATE]: 1, '🔗 Enhanced Links.Color.Mode': 'custom', '📦 Enhanced Nodes.End Animation.Enabled': true, '📦 Enhanced Nodes.Completion.Style': 'fireworks',
            '📦 Enhanced Nodes.Animate': 3, '📦 Enhanced Nodes.Color.Mode': 'custom', '📦 Enhanced Nodes.Color.Primary': '#00ff0d', '📦 Enhanced Nodes.Color.Secondary': '#00ff84', '📦 Enhanced Nodes.Color.Accent': '#ffd900',
            '📦 Enhanced Nodes.Color.Scheme': 'vivid', '📦 Enhanced Nodes.Particle.Show': true,
        },
    },
    {
        slug: 'preview-titles',
        title: 'README preview: the title styles',
        look: 'Recreates the end of preview4.webp: right-angle links with heart markers, and large neon titles over amber and pink nodes, which v1 drew 84 px above the body and v3 lifts 100 px from the title bar.',
        preview: 'preview4',
        settings: {
            [STYLE]: 'linear', [SHAPE]: 'heart', '🔗 Enhanced Links.Thickness': 1.5,
            '📦 Enhanced Nodes.Animate': 2, '📦 Enhanced Nodes.Color.Mode': 'custom', '📦 Enhanced Nodes.Color.Primary': '#ffb300', '📦 Enhanced Nodes.Color.Secondary': '#fb00ff', '📦 Enhanced Nodes.Color.Accent': '#9d00ff',
            '📦 Enhanced Nodes.Particle.Show': true, '📦 Enhanced Nodes.Text.Animation.Enabled': true, '📦 Enhanced Nodes.Text.Size': 32, '📦 Enhanced Nodes.Text.Position.Y': -100,
        },
    },
];

/** The part of the node scene the node rows show, in graph coordinates, with room above its nodes for the fireworks. */
const NODE_SCENE_AREA = [100, 0, 1000, 720];

/** Puts the row's graph on the page and returns what to shoot: the gallery graph's link area, the node scene, or the whole default workflow. */
async function stage(page: Page, row: Row): Promise<Clip> {
    if (row.preview) await page.evaluate(() => window.app.loadGraphData());
    else await buildGraph(page, row.nodes ? graphs.nodeScene : graphs.gallery);
    // The workflow restored as the page loaded can fit the view in a frame to come (app.ts loadGraphData): let it, then set ours.
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    if (!row.preview) {
        await page.evaluate(() => {
            const { canvas } = window.app;
            canvas.ds.scale = 1;
            canvas.ds.offset = [0, 0];
            canvas.setDirty(true, true);
        });
        return clipOf(page, row.nodes ? NODE_SCENE_AREA : LINK_AREA);
    }
    return page.evaluate(() => {
        const { app, LiteGraph } = window;
        const { canvas } = app;
        let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity];
        for (const node of canvas.graph._nodes) {
            left = Math.min(left, node.pos[0]);
            top = Math.min(top, node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT);
            right = Math.max(right, node.pos[0] + node.size[0]);
            bottom = Math.max(bottom, node.pos[1] + node.size[1]);
        }
        const { clientWidth: width, clientHeight: height } = canvas.canvas;
        const scale = 0.85 * Math.min(width / (right - left), height / (bottom - top));
        canvas.ds.scale = scale;
        canvas.ds.offset = [width / 2 / scale - (left + right) / 2, height / 2 / scale - (top + bottom) / 2];
        canvas.setDirty(true, true);
        const rect = canvas.canvas.getBoundingClientRect();
        return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    });
}

/**
 * Loads a fresh page with the row's graph, sets `settings` on Playwright's paused clock, then shoots the row's times
 * into `file(ms)` and puts back what it set.
 */
async function shootRow(page: Page, row: Row, settings: Record<string, unknown>, file: (ms: number) => string): Promise<Record<number, string>> {
    await page.clock.resume();
    await openApp(page);
    const clip = await stage(page, row);
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    const ids = Object.keys(settings);
    const before = await page.evaluate((ids) => ids.map((id) => window.app.extensionManager.setting.get(id)), ids);
    for (const id of ids) await setSetting(page, id, settings[id]);
    if (row.select) {
        await page.evaluate((type) => {
            const { canvas } = window.app;
            canvas.selectNode(canvas.graph.nodes.find((node: { type: string }) => node.type === type));
            canvas.setDirty(true, true);
        }, row.select);
    }
    if (row.run) await finishRun(page);
    if (row.menu) await openNodeMenu(page);
    const files: Record<number, string> = {};
    let ran = 0;
    for (const ms of row.still ? (row.times ?? TIMES).slice(0, 1) : (row.times ?? TIMES)) {
        await page.clock.runFor(ms - ran);
        ran = ms;
        await page.screenshot({ path: file(ms), clip });
        files[ms] = file(ms);
    }
    for (const [j, id] of ids.entries()) await setSetting(page, id, before[j]);
    return files;
}

/**
 * A run of this page's finishing, as each version heard of it: v1 from the global 'status' event, the queue going busy
 * then empty; v3 from the events ComfyUI sends the client that queued the run, which ran every node and succeeded.
 */
function finishRun(page: Page): Promise<void> {
    return page.evaluate(() => {
        const { api, graph } = window.app;
        api.dispatchCustomEvent('status', { exec_info: { queue_remaining: 1 } });
        api.dispatchCustomEvent('execution_start', { prompt_id: 'sheet', timestamp: 0 });
        for (const node of graph.nodes) {
            const id = String(node.id);
            api.dispatchCustomEvent('progress_state', { prompt_id: 'sheet', nodes: { [id]: { value: 0, max: 1, state: 'running', node_id: id, display_node_id: id, prompt_id: 'sheet' } } });
            api.dispatchCustomEvent('executing', id);
        }
        api.dispatchCustomEvent('execution_success', { prompt_id: 'sheet', timestamp: 0 });
        api.dispatchCustomEvent('executing', null);
        api.dispatchCustomEvent('status', { exec_info: { queue_remaining: 0 } });
    });
}

/** Opens the first node's menu on its effect submenu: v3's Node FX, v1's Node Animation Style. */
async function openNodeMenu(page: Page): Promise<void> {
    const [x, y] = await page.evaluate(() => {
        const { app, LiteGraph } = window;
        const { canvas } = app;
        const [node] = canvas.graph.nodes;
        const rect = canvas.canvas.getBoundingClientRect();
        const [cx, cy] = canvas.ds.convertOffsetToCanvas([node.pos[0] + node.size[0] / 2, node.pos[1] - LiteGraph.NODE_TITLE_HEIGHT / 2]);
        return [rect.left + cx, rect.top + cy];
    });
    await page.mouse.click(x, y, { button: 'right' });
    await page.locator('.litecontextmenu .litemenu-entry').filter({ hasText: /^(Node FX|Node Animation Style)$/ }).click();
}

test.describe('contact sheets', { tag: '@gallery' }, () => {
    test.use({ settings: QUIET });

    test('v1 beside v3', async ({ page, frontend }, testInfo) => {
        const v1 = testInfo.project.name === 'v1-ref';
        test.skip(!v1 && testInfo.project.name !== 'fe1395', 'shot on the 1.39.5 leg, beside v1 on the same frontend');
        test.setTimeout(3_600_000);
        const dir = process.env.ELN_SHEETS ?? path.join(testInfo.project.outputDir, 'sheets');
        const source = v1 ? 'v1' : 'v3';
        fs.mkdirSync(path.join(dir, source), { recursive: true });
        await page.clock.install();
        await openApp(page);
        // v3's defaults, for its default column; the 1.39.5 settings API still hands them out.
        const ids = [...new Set([...ROWS, ...PREVIEWS].flatMap((row) => [...Object.keys(CLASSIC), ...Object.keys(row.base ?? {}), ...Object.keys(row.settings)]))];
        const defaults: Record<string, unknown> = v1 ? {} : Object.fromEntries(await page.evaluate((ids) => ids.map((id) => [id, window.app.ui.settings.getSettingDefaultValue(id)]), ids));
        const manifest = [];
        for (const row of [...ROWS, ...PREVIEWS]) {
            if (v1 && row.v3) continue;
            const classic = { ...CLASSIC, ...row.base, ...row.settings };
            const name = (column: string) => (ms: number) => path.join(dir, source, `${row.slug}-${column}-${ms}.png`);
            const columns: Record<string, Record<number, string> | string> = { [v1 ? 'v1' : 'v3-classic']: await shootRow(page, row, classic, name(v1 ? 'v1' : 'classic')) };
            if (!v1 && !row.preview) {
                // v3 as it ships, but for what the row is about.
                const own = { ...Object.fromEntries(Object.keys(classic).map((id) => [id, defaults[id]])), ...row.settings };
                const same = Object.keys(classic).every((id) => own[id] === classic[id]);
                columns['v3-default'] = same ? 'v3-classic' : await shootRow(page, row, own, name('default'));
            }
            manifest.push({ slug: row.slug, title: row.title, look: row.look, still: Boolean(row.still), v3: Boolean(row.v3), preview: row.preview ?? null, times: row.times ?? TIMES, settings: classic, columns });
        }
        fs.writeFileSync(path.join(dir, `${source}.json`), JSON.stringify({ source, frontend, times: TIMES, rows: manifest }, null, 2));
    });
});
