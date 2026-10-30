/**
 * Test double for ComfyUI's '/scripts/app.js' and '/scripts/api.js' (both are
 * aliased to this file in vitest.config.ts) and for the LiteGraph globals that
 * src code expects. Settings are a plain Map that tests fill directly.
 *
 * @module tests/helpers/fake-app
 */

interface Extension {
    name: string;
    setup?: (app: unknown) => unknown;
}

export const fake = {
    /** Stored setting values, as in the user's comfy.settings.json. */
    settings: new Map<string, unknown>(),
    /** Defaults registered through addSetting. */
    defaults: new Map<string, unknown>(),
    /** Settings reads through either settings API. */
    reads: 0,
    /** Calls that reached the fake LiteGraph originals. */
    native: [] as string[],
    extensions: [] as Extension[],
    /** The LGraphCanvas global, a new class after every resetFakeApp(). */
    LGraphCanvas: installLiteGraph(),
};

function read(id: string): unknown {
    fake.reads++;
    return fake.settings.has(id) ? fake.settings.get(id) : fake.defaults.get(id);
}

const canvas = {
    dirty_canvas: false,
    dirty_bgcanvas: false,
    ds: { scale: 1, offset: [0, 0] },
    setDirty(): void {},
    draw(): void {},
};

export const app = {
    ui: {
        settings: {
            // Frontends since 1.8.14 ignore the deprecated default argument.
            getSettingValue: (id: string, _defaultValue?: unknown) => read(id),
            setSettingValue: (id: string, value: unknown) => {
                fake.settings.set(id, value);
            },
            addSetting: (setting: { id: string; defaultValue?: unknown }) => {
                fake.defaults.set(setting.id, setting.defaultValue);
            },
        },
    },
    extensionManager: {
        setting: {
            get: (id: string) => read(id),
            set: async (id: string, value: unknown) => {
                fake.settings.set(id, value);
            },
        },
        registerSidebarTab: () => {},
    },
    canvas,
    graph: {
        canvas,
        setDirtyCanvas: () => {},
    },
    registerExtension: (extension: Extension) => {
        fake.extensions.push(extension);
    },
};

export const api = {
    addEventListener(): void {},
    removeEventListener(): void {},
};

/** Installs fresh LiteGraph globals and returns their LGraphCanvas; a new class drops prototype patches from earlier setups. */
function installLiteGraph() {
    const LiteGraph = { STRAIGHT_LINK: 0, LINEAR_LINK: 1, SPLINE_LINK: 2, LINK_COLOR: '#9A9', EVENT_LINK_COLOR: '#A86' };

    class LGraphCanvas {
        static link_type_colors: Record<string, string> = { '-1': LiteGraph.EVENT_LINK_COLOR, number: '#AAA', node: '#DCA' };
        default_link_color = LiteGraph.LINK_COLOR;
        default_connection_color = { input_off: '#778899', input_on: '#7F7F7F', output_off: '#778899', output_on: '#7F7F7F' };
        graph: unknown = null;

        drawConnections(_ctx: CanvasRenderingContext2D): void {
            fake.native.push('drawConnections');
        }

        drawNode(_node: unknown, _ctx: CanvasRenderingContext2D): void {
            fake.native.push('drawNode');
        }

        drawNodeShape(..._args: unknown[]): void {
            fake.native.push('drawNodeShape');
        }
    }

    Object.assign(globalThis, { LiteGraph, LGraphCanvas });
    return LGraphCanvas;
}

/**
 * Store exactly the given setting values, zero the counters and reinstall the
 * LiteGraph globals. Registered extensions and setting definitions persist,
 * as they do for a page session.
 */
export function resetFakeApp(settings: Record<string, unknown> = {}): void {
    fake.settings = new Map(Object.entries(settings));
    fake.reads = 0;
    fake.native = [];
    fake.LGraphCanvas = installLiteGraph();
}
