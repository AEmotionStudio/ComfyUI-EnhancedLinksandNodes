/**
 * Test double for ComfyUI's '/scripts/app.js' and '/scripts/api.js' (both are
 * aliased to this file in vitest.config.ts) and for the LiteGraph globals that
 * src code expects. Settings behave like the frontend's settingStore
 * (platform/settings/settingStore.ts, the same in 1.39.5 and 1.57.1) where M2
 * relies on it; tests can also fill the stored values directly.
 *
 * @module tests/helpers/fake-app
 */

interface Setting {
    id: string;
    defaultValue?: unknown;
    migrateDeprecatedValue?: (value: unknown) => unknown;
    onChange?: (newValue: unknown, oldValue?: unknown) => unknown;
}

interface Extension {
    name: string;
    settings?: Setting[];
    setup?: (app: unknown) => unknown;
}

export const fake = {
    /** Stored setting values, as in the user's comfy.settings.json. */
    settings: new Map<string, unknown>(),
    /** Settings registered through ComfyExtension.settings or addSetting. */
    registered: new Map<string, Setting>(),
    /** Ids registered again, which settingStore.addSetting warns about and skips. */
    duplicates: [] as string[],
    /** Settings reads through either settings API. */
    reads: 0,
    /** Calls to the deprecated app.ui.settings API, which only v1 makes. */
    legacyCalls: 0,
    /** The settings each set() sent to the server, in order. */
    posts: [] as Array<[id: string, value: unknown]>,
    /** Calls that reached the fake LiteGraph originals. */
    native: [] as string[],
    extensions: [] as Extension[],
    /** The LGraphCanvas global, a new class after every resetFakeApp(). */
    LGraphCanvas: installLiteGraph(),
};

/** settingStore.get: the stored value, else the registered default. */
function value(id: string): unknown {
    return fake.settings.get(id) ?? fake.registered.get(id)?.defaultValue;
}

function read(id: string): unknown {
    fake.reads++;
    return value(id);
}

function migrate(setting: Setting | undefined, stored: unknown): unknown {
    return setting?.migrateDeprecatedValue?.(stored) ?? stored;
}

/** What settingStore.addSetting does once the definition is in: migrate a stored value in memory only, then call onChange. */
function load(setting: Setting): void {
    const stored = fake.settings.get(setting.id);
    if (stored !== undefined) fake.settings.set(setting.id, migrate(setting, stored));
    void setting.onChange?.(value(setting.id), undefined);
}

function addSetting(setting: Setting): void {
    if (fake.registered.has(setting.id)) {
        fake.duplicates.push(setting.id);
        return;
    }
    fake.registered.set(setting.id, setting);
    load(setting);
}

/** settingStore.set: an equal value after migration changes nothing; any other is stored, reported, then POSTed. */
async function set(id: string, newValue: unknown): Promise<void> {
    const setting = fake.registered.get(id);
    const migrated = migrate(setting, newValue);
    const oldValue = value(id);
    if (migrated === oldValue) return;
    fake.settings.set(id, migrated);
    await setting?.onChange?.(migrated, oldValue);
    fake.posts.push([id, migrated]);
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
            getSettingValue: (id: string, _defaultValue?: unknown) => {
                fake.legacyCalls++;
                return read(id);
            },
            addSetting: (setting: Setting) => {
                fake.legacyCalls++;
                addSetting(setting);
            },
        },
    },
    extensionManager: {
        setting: { get: read, set },
        registerSidebarTab: () => {},
    },
    canvas,
    graph: {
        canvas,
        setDirtyCanvas: () => {},
    },
    // extensionService.registerExtension registers an extension's settings whether or not it is disabled.
    registerExtension: (extension: Extension) => {
        fake.extensions.push(extension);
        extension.settings?.forEach(addSetting);
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
 * LiteGraph globals. Registered extensions and settings persist, as they do for
 * a page session, and take up the new values as a page load would.
 */
export function resetFakeApp(settings: Record<string, unknown> = {}): void {
    fake.settings = new Map(Object.entries(settings));
    fake.reads = 0;
    fake.legacyCalls = 0;
    fake.duplicates = [];
    fake.posts = [];
    fake.native = [];
    fake.LGraphCanvas = installLiteGraph();
    fake.registered.forEach(load);
}
