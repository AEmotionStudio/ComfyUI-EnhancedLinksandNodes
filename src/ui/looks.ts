/**
 * Looks: named values for the settings that change how links and nodes look.
 * A look sets every such setting, the ones it leaves out to their defaults, so
 * Subtle, the defaults, is the empty look. Applying one commits only the values
 * that differ from what is saved, through the settings' write queue, sets Look,
 * and hands back its undo. Looks never touch how you work: the master
 * switches, Perf, Motion, Coexist and the hidden settings.
 *
 * Besides the curated looks there are the user's own, kept in their ComfyUI
 * user data; look files to share, read and written as JSON; and Surprise me.
 *
 * @module ui/looks
 */

import { api } from '/scripts/api.js';
import { L, LOOK, SETTINGS, commitAll, drawWith, normalize, preview, restore, setting, shown, type Setting, type Values } from '@/core/settings';
import { fromHsl } from '@/core/colors';
import { rng } from '@/fx/particles';

export interface Look {
    id: string;
    name: string;
    /** What the look shows, in a sentence. */
    description: string;
    /** Values by setting id. */
    values: Values;
}

const lookable = (s: Setting) => s.type !== 'hidden' && s.look !== false;

/** The default of each setting looks set. */
const DEFAULTS: Values = Object.fromEntries(SETTINGS.filter(lookable).map((s) => [s.id, s.default]));

/** The curated looks, in the order the panel shows them. */
export const LOOKS: readonly Look[] = [
    {
        id: 'off',
        name: 'Off',
        description: 'Native links and nodes, but for nodes given effects of their own in the node menu, with no run visuals or fireworks.',
        values: {
            '🔗 Enhanced Links.Animate': 0,
            '🔗 Enhanced Links.Flow.River': false,
            '🔗 Enhanced Links.Flow.Trail': false,
            '📦 Enhanced Nodes.Run.Ring': false,
            '📦 Enhanced Nodes.Run.Error': false,
            '📦 Enhanced Nodes.End Animation.Enabled': false,
        },
    },
    {
        id: 'subtle',
        name: 'Subtle',
        description: "Classic Flow links with gliding arrows and v1's dark halo, plain nodes, and fireworks over your outputs when a run finishes.",
        values: {},
    },
    {
        id: 'showcase',
        name: 'Showcase',
        description: 'Cosmic Weave links and Neon Nexus nodes with aurora particles, in more detail and glow, calmer while your runs play.',
        // TODO(M9c, M9e): rope physics at 0.6 and hands & eyes. TODO(M9b): a burst per node.
        values: {
            '🔗 Enhanced Links.Animate': 4,
            '🔗 Enhanced Links.Quality': 2,
            '🔗 Enhanced Links.Particle.Density': 2,
            '🔗 Enhanced Links.Glow.Intensity': 14,
            '🔗 Enhanced Links.Blend': 'additive',
            '📦 Enhanced Nodes.Animate': 2,
            '📦 Enhanced Nodes.Intensity': 1.2,
            '📦 Enhanced Nodes.Glow': 1,
            '📦 Enhanced Nodes.Particle.Show': true,
            '📦 Enhanced Nodes.Particle.Glow': 1,
            '📦 Enhanced Nodes.Particle.Color.Mode': 'aurora',
            '🔗 Enhanced Links.Pause.Mode': 'calm',
        },
    },
    {
        id: 'performance',
        name: 'Performance',
        description: 'Still Classic Flow links with less glow and no shadows, plain nodes, runs shown still without a trail, and no fireworks.',
        values: {
            '🔗 Enhanced Links.Static.Mode': true,
            '🔗 Enhanced Links.Glow.Intensity': 6,
            '🔗 Enhanced Links.Link.Shadow.Enabled': false,
            '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
            '🔗 Enhanced Links.Pause.Mode': 'pause',
            '🔗 Enhanced Links.Flow.Trail': false,
            '📦 Enhanced Nodes.End Animation.Enabled': false,
        },
    },
    {
        // v1's defaults (old_link_animations.js:19-45, old_node_animations.js:146-178); its links are v3's.
        id: 'classic-v1',
        name: 'Classic v1',
        description: "v1 out of the box: Classic Flow links with their dark halo, Neon Nexus nodes with particles in v1's colors, and none of 3.0's run visuals or fireworks.",
        values: {
            '📦 Enhanced Nodes.Animate': 2,
            '📦 Enhanced Nodes.Quality': 1,
            '📦 Enhanced Nodes.Glow': 1,
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Particle.Show': true,
            '📦 Enhanced Nodes.Particle.Density': 0.5,
            '📦 Enhanced Nodes.Particle.Glow': 1,
            '🔗 Enhanced Links.Pause.Mode': 'pause',
            '🔗 Enhanced Links.Flow.River': false,
            '🔗 Enhanced Links.Flow.Trail': false,
            '📦 Enhanced Nodes.Run.Ring': false,
            '📦 Enhanced Nodes.Run.Error': false,
            '📦 Enhanced Nodes.End Animation.Enabled': false,
        },
    },
    {
        id: 'neon-night',
        name: 'Neon Night',
        description: 'Energy Pulse links and Neon Nexus nodes in electric cyan and magenta, with color-cycling particles.',
        // TODO(M9b): confetti.
        values: {
            '🔗 Enhanced Links.Animate': 5,
            '🔗 Enhanced Links.Quality': 2,
            '🔗 Enhanced Links.Color.Mode': 'custom',
            '🔗 Enhanced Links.Color.Primary': '#00e5ff',
            '🔗 Enhanced Links.Color.Secondary': '#ff2bd6',
            '🔗 Enhanced Links.Color.Accent': '#7c4dff',
            '🔗 Enhanced Links.Glow.Intensity': 16,
            '🔗 Enhanced Links.Blend': 'additive',
            '📦 Enhanced Nodes.Animate': 2,
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Color.Primary': '#00e5ff',
            '📦 Enhanced Nodes.Color.Secondary': '#ff2bd6',
            '📦 Enhanced Nodes.Color.Accent': '#7c4dff',
            '📦 Enhanced Nodes.Particle.Show': true,
            '📦 Enhanced Nodes.Particle.Color.Mode': 'energy',
        },
    },
    {
        id: 'lava-lamp',
        name: 'Lava Lamp',
        description: 'Lava Flow links and Cosmic Ripple nodes in molten reds and ambers, with color-cycling particles.',
        values: {
            '🔗 Enhanced Links.Animate': 7,
            '🔗 Enhanced Links.Quality': 2,
            '🔗 Enhanced Links.Particle.Density': 1,
            '🔗 Enhanced Links.Color.Mode': 'custom',
            '🔗 Enhanced Links.Color.Primary': '#ff4d00',
            '🔗 Enhanced Links.Color.Secondary': '#ffb300',
            '🔗 Enhanced Links.Color.Accent': '#ff006e',
            '📦 Enhanced Nodes.Animate': 3,
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Color.Primary': '#ff4d00',
            '📦 Enhanced Nodes.Color.Secondary': '#ffb300',
            '📦 Enhanced Nodes.Color.Accent': '#ff006e',
            '📦 Enhanced Nodes.Particle.Show': true,
            '📦 Enhanced Nodes.Particle.Color.Mode': 'energy',
        },
    },
    {
        id: 'sacred-geometry',
        name: 'Sacred Geometry',
        description: 'Sacred Flow links and Flower of Life nodes in gold.',
        // TODO(M9d): Merkaba Beads links. TODO(M9b): a path trace when a run finishes.
        values: {
            '🔗 Enhanced Links.Animate': 1,
            '🔗 Enhanced Links.Color.Mode': 'custom',
            '🔗 Enhanced Links.Color.Primary': '#ffcc00',
            '🔗 Enhanced Links.Color.Secondary': '#ff8800',
            '🔗 Enhanced Links.Color.Accent': '#fff3b0',
            '📦 Enhanced Nodes.Animate': 4,
            '📦 Enhanced Nodes.Color.Mode': 'custom',
            '📦 Enhanced Nodes.Color.Primary': '#ffcc00',
            '📦 Enhanced Nodes.Color.Secondary': '#ff8800',
            '📦 Enhanced Nodes.Color.Accent': '#fff3b0',
        },
    },
    {
        id: 'presenter',
        name: 'Presenter',
        description: 'Thicker, high-contrast Classic Flow links with larger markers, for streams and screenshots.',
        values: {
            '🔗 Enhanced Links.Thickness': 5,
            '🔗 Enhanced Links.Color.Scheme': 'contrast',
            '🔗 Enhanced Links.Glow.Intensity': 12,
            '🔗 Enhanced Links.Marker.Size': 4,
        },
    },
    {
        id: 'blueprint',
        name: 'Blueprint',
        description: 'Muted right-angle links with small square markers and no shadows, and plain nodes.',
        // TODO(M9b): a path trace when a run finishes.
        values: {
            '🔗 Enhanced Links.Link.Style': 'linear',
            '🔗 Enhanced Links.Color.Scheme': 'muted',
            '🔗 Enhanced Links.Glow.Intensity': 4,
            '🔗 Enhanced Links.Marker.Shape': 'square',
            '🔗 Enhanced Links.Marker.Size': 2,
            '🔗 Enhanced Links.Link.Shadow.Enabled': false,
            '🔗 Enhanced Links.Marker.Shadow.Enabled': false,
        },
    },
];

/** A look's value for every setting looks set. */
const valuesOf = (look: Look): Values => ({ ...DEFAULTS, ...look.values });

/** Calls `draw` with what a look sets in L and N, for its tile alone. */
export const drawLook = (look: Look, draw: () => void): void => drawWith(valuesOf(look), draw);

/** Shows a look without saving it, for a tile being hovered, and returns what ends that. */
export function previewLook(look: Look): () => void {
    const values = valuesOf(look);
    for (const [id, value] of Object.entries(values)) preview(id, value);
    return () => restore(Object.keys(values));
}

/** Applies a look: commits the values that differ from what is saved, sets Look to it, and returns what undoes both. */
export function applyLook(look: Look): () => void {
    return commitAll({ ...valuesOf(look), [LOOK]: look.id });
}

/** Whether what shows differs from a look's values; the panel marks the applied look with a dot then. */
export const changed = (look: Look): boolean => Object.entries(valuesOf(look)).some(([id, value]) => shown(id) !== value);

/** Keeps what shows as the user's own settings: saves what the first-run overlay shows in place of what is saved, and sets Look to 'custom'. */
export function keepShown(): void {
    commitAll({ ...Object.fromEntries(Object.keys(DEFAULTS).map((id) => [id, shown(id)])), [LOOK]: 'custom' });
}

/** The look Look names: Subtle until the first-run picker is answered, none for settings kept as they were ('custom'). */
export function currentLook(): Look | undefined {
    const id = L.look || 'subtle';
    if (id.startsWith(SURPRISE)) return mix(Number(id.slice(SURPRISE.length)));
    return LOOKS.find((look) => look.id === id) ?? mine?.find((look) => look.id === id);
}

// =============================================================================
// The user's looks and look files
// =============================================================================

const FILE = 'enhanced-links-nodes/looks.json';
const APP = 'comfyui-enhancedlinksandnodes';
/** A whole hex colour, as normalize() writes one. */
const COLOUR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/;

/** The user's looks once read, and their writes, one at a time. */
let mine: Look[] | undefined;
let reading: Promise<Look[]> | undefined;
let storing: Promise<unknown> = Promise.resolve();

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** The values a look may set, normalised; `errors` gets what was dropped or changed. */
function clean(values: Record<string, unknown>, errors: string[]): Values {
    const kept: Record<string, unknown> = {};
    for (const [id, value] of Object.entries(values)) {
        if (!Object.hasOwn(DEFAULTS, id)) {
            errors.push(SETTINGS.some((s) => s.id === id) ? `Looks leave ${setting(id).name} alone, so it was left out.` : `${id} is not a setting looks know, so it was left out.`);
            continue;
        }
        const s = setting(id);
        const normal = normalize(s, value);
        if (s.type === 'color' && !(typeof normal === 'string' && COLOUR.test(normal))) {
            errors.push(`${s.name}: ${JSON.stringify(value)} is no color, so it was left out.`);
            continue;
        }
        if (normal !== value) errors.push(`${s.name}: ${JSON.stringify(value)} became ${JSON.stringify(normal)}.`);
        kept[id] = normal;
    }
    return kept;
}

async function read(): Promise<Look[]> {
    const response = await api.getUserData(FILE);
    // None saved yet.
    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`Could not read ${FILE}: ${response.status} ${response.statusText}`);
    const data: unknown = await response.json();
    const looks = isObject(data) && Array.isArray(data.looks) ? data.looks : [];
    return looks.flatMap((look: unknown) =>
        isObject(look) && typeof look.id === 'string' && typeof look.name === 'string' && isObject(look.values)
            ? [{ id: look.id, name: look.name, description: '', values: clean(look.values, []) }]
            : []);
}

/** The user's own looks, read from their user data the first time. */
export async function userLooks(): Promise<readonly Look[]> {
    reading ??= read().catch((error: unknown) => {
        reading = undefined;
        throw error;
    });
    return (mine ??= await reading);
}

/** Saves the user's looks, after the writes before. */
function store(looks: Look[]): Promise<void> {
    const write = storing.then(() => api.storeUserData(FILE, { schema: 1, looks }, { overwrite: true, stringify: true, throwOnError: true }));
    storing = write.catch(() => {});
    return write.then(() => {});
}

async function add(name: string, values: Values): Promise<Look> {
    const looks = (await userLooks()) as Look[];
    const look = { id: `user-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, description: '', values };
    looks.push(look);
    await store(looks);
    return look;
}

/** Saves what shows now as a look of the user's, called `name`. */
export function saveLook(name: string): Promise<Look> {
    return add(name, Object.fromEntries(Object.entries(DEFAULTS).flatMap(([id, value]) => (shown(id) === value ? [] : [[id, shown(id)]]))));
}

/** Renames a look of the user's. */
export async function renameLook(id: string, name: string): Promise<void> {
    const looks = (await userLooks()) as Look[];
    const look = looks.find((l) => l.id === id);
    if (!look) return;
    look.name = name;
    await store(looks);
}

/** Deletes a look of the user's, and returns what puts it back where it was. */
export async function deleteLook(id: string): Promise<() => Promise<void>> {
    const looks = (await userLooks()) as Look[];
    const at = looks.findIndex((l) => l.id === id);
    // Deleted already, by a second click say.
    if (at < 0) return async () => {};
    const [look] = looks.splice(at, 1);
    await store(looks);
    return () => {
        looks.splice(Math.min(at, looks.length), 0, look);
        return store(looks);
    };
}

/** A look as a file to share, in the form importLook reads. */
export function exportLook(look: Look): string {
    return JSON.stringify({ app: APP, kind: 'look', schema: 1, name: look.name, values: look.values }, null, 2);
}

/**
 * Reads a look file and adds its look to the user's, keeping only the values a look may set, normalised. Returns the
 * look, unless the file holds none, and what was wrong with the file.
 */
export async function importLook(text: string): Promise<{ look?: Look; errors: string[] }> {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        return { errors: ['The file is not JSON.'] };
    }
    if (!isObject(data) || !isObject(data.values) || (data.kind !== undefined && data.kind !== 'look')) return { errors: ['The file holds no look.'] };
    const errors: string[] = [];
    const values = clean(data.values, errors);
    const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : 'Imported look';
    return { look: await add(name, values), errors };
}

// =============================================================================
// Surprise me
// =============================================================================

const SURPRISE = 'surprise-';
const LINK_ANIMATE = '🔗 Enhanced Links.Animate';
const NODE_ANIMATE = '📦 Enhanced Nodes.Animate';

const optionsOf = (id: string) => {
    const s = setting(id);
    return s.type === 'combo' ? s.options : [];
};

const hex = (rgb: readonly number[]) => `#${rgb.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

/** Whether ComfyUI shows a light palette: it marks dark ones (1.57.1 on the root element, 1.39.5 on the body; GraphView.vue). */
export const light = () => !document.documentElement.classList.contains('dark-theme') && !document.body.classList.contains('dark-theme');

/**
 * The mix `seed` alone decides: a link animation and a node effect (or none), in custom colours at hues h, h + 40° and
 * h + 180°, lighter for a dark palette and darker for a light one as the seed's lowest bit says, at speeds from 0.6 to
 * 1.4, a glow from 6 to 16, and quality and density up to Balanced and Dense; half of them with node particles.
 */
function mix(seed: number): Look {
    const random = rng(seed);
    const pick = <T>(items: readonly T[]): T => items[Math.floor(random() * items.length)];
    const between = (lo: number, hi: number, step: number) => Number((Math.round((lo + random() * (hi - lo)) / step) * step).toFixed(2));
    const links = pick(optionsOf(LINK_ANIMATE).filter((o) => o.value !== 0));
    const nodes = pick(optionsOf(NODE_ANIMATE));
    const hue = random() * 360;
    const [primary, secondary, accent] = [0, 40, 180].map((turn) => hex(fromHsl((hue + turn) % 360, 90, seed & 1 ? 40 : 60)));
    // TODO(M9b): a completion style.
    const values = {
        [LINK_ANIMATE]: links.value,
        '🔗 Enhanced Links.Animation.Speed': between(0.6, 1.4, 0.05),
        '🔗 Enhanced Links.Quality': pick([1, 2]),
        '🔗 Enhanced Links.Particle.Density': pick([0.5, 1, 2]),
        '🔗 Enhanced Links.Glow.Intensity': between(6, 16, 1),
        '🔗 Enhanced Links.Color.Mode': 'custom',
        '🔗 Enhanced Links.Color.Primary': primary,
        '🔗 Enhanced Links.Color.Secondary': secondary,
        '🔗 Enhanced Links.Color.Accent': accent,
        [NODE_ANIMATE]: nodes.value,
        '📦 Enhanced Nodes.Animation.Speed': between(0.6, 1.4, 0.1),
        '📦 Enhanced Nodes.Quality': pick([1, 2]),
        '📦 Enhanced Nodes.Color.Mode': 'custom',
        '📦 Enhanced Nodes.Color.Primary': primary,
        '📦 Enhanced Nodes.Color.Secondary': secondary,
        '📦 Enhanced Nodes.Color.Accent': accent,
        '📦 Enhanced Nodes.Particle.Show': random() < 0.5,
        '📦 Enhanced Nodes.Particle.Density': pick([0.5, 1, 2]),
    };
    const description = `${links.text} links and ${nodes.value ? `${nodes.text} nodes` : 'plain nodes'} in colors of their own.`;
    return { id: `${SURPRISE}${seed}`, name: 'Surprise', description, values };
}

/** Surprise me: one time in four a curated look other than Off and the one applied, else a mix with another link animation than the one showing. */
export function surprise(): Look {
    if (Math.random() < 0.25) {
        const looks = LOOKS.filter((look) => look.id !== 'off' && look.id !== L.look);
        return looks[Math.floor(Math.random() * looks.length)];
    }
    for (;;) {
        const look = mix((Math.floor(Math.random() * 2 ** 30) * 2) | (light() ? 1 : 0));
        if (look.values[LINK_ANIMATE] !== L.animate) return look;
    }
}
