/**
 * Test double for ComfyUI's '/scripts/app.js' and '/scripts/api.js' (both are
 * aliased to this file in vitest.config.ts) and for the LiteGraph globals that
 * src code expects, plus matchMedia, which jsdom lacks. Settings behave like
 * the frontend's settingStore (platform/settings/settingStore.ts, the same in
 * 1.39.5 and 1.57.1) where M2 relies on it; tests can also fill the stored
 * values directly.
 *
 * @module tests/helpers/fake-app
 */

interface Setting {
    id: string;
    defaultValue?: unknown;
    migrateDeprecatedValue?: (value: unknown) => unknown;
    onChange?: (newValue: unknown, oldValue?: unknown) => unknown;
}

/** A sidebar tab as a custom extension registers one. */
interface SidebarTab {
    id: string;
    iconBadge?: string | (() => string | null);
    render: (container: HTMLElement) => void;
    destroy?: () => void;
}

interface Extension {
    name: string;
    settings?: Setting[];
    setup?: (app: unknown) => unknown;
    nodeCreated?: (node: unknown, app: unknown) => unknown;
    loadedGraphNode?: (node: unknown, app: unknown) => unknown;
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
    extensions: [] as Extension[],
    /** The sidebar tabs registered, which registration keeps for the page, as the sidebar store does. */
    tabs: [] as SidebarTab[],
    /** What app.extensionManager.toast.add showed, in order. */
    toasts: [] as unknown[],
    /** The commands run through app.extensionManager.command.execute, in order. */
    commands: [] as string[],
    /** The user's data files by path, as the server's /userdata keeps them. */
    userData: new Map<string, string>(),
    /** What matchMedia('(prefers-reduced-motion: reduce)') returns: tests set matches, then dispatch 'change'. */
    reducedMotion: Object.assign(new EventTarget(), { matches: false }),
    /** The LGraphCanvas global, a new class after every resetFakeApp(). */
    LGraphCanvas: installLiteGraph(),
};

// src asks matchMedia about reduced motion only. jsdom has no IntersectionObserver either: here nothing is ever on screen.
Object.assign(globalThis, {
    matchMedia: () => fake.reducedMotion,
    IntersectionObserver: class {
        observe(): void {}
        unobserve(): void {}
    },
});

// The canvas's part of the page, where the frontends put what floats over the canvas (LiteGraphCanvasSplitterOverlay.vue).
document.body.append(Object.assign(document.createElement('div'), { className: 'graph-canvas-panel' }));

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
        registerSidebarTab: (tab: SidebarTab) => void fake.tabs.push(tab),
        getSidebarTabs: () => fake.tabs,
        toast: { add: (message: unknown) => void fake.toasts.push(message) },
        command: { execute: async (id: string) => void fake.commands.push(id) },
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

/**
 * ComfyApi is an EventTarget; tests dispatch its events, such as 'status', as ComfyUI does. Its user data calls answer
 * as the server's /userdata does (app/user_manager.py): 404 for a file that is not there.
 */
export const api = Object.assign(new EventTarget(), {
    getUserData: async (file: string) => {
        const body = fake.userData.get(file);
        return body === undefined ? new Response(null, { status: 404, statusText: 'Not Found' }) : new Response(body);
    },
    storeUserData: async (file: string, data: unknown, options: { stringify?: boolean }) => {
        fake.userData.set(file, options.stringify ? JSON.stringify(data) : String(data));
        return new Response(null);
    },
});

/** Installs fresh LiteGraph globals and returns their LGraphCanvas; a new class drops prototype patches from earlier setups. */
function installLiteGraph() {
    const LiteGraph = { STRAIGHT_LINK: 0, LINEAR_LINK: 1, SPLINE_LINK: 2, LINK_COLOR: '#9A9', EVENT_LINK_COLOR: '#A86', NODE_TITLE_HEIGHT: 30, NODE_FONT: 'Inter' };

    class LGraphCanvas {
        static link_type_colors: Record<string, string> = { '-1': LiteGraph.EVENT_LINK_COLOR, number: '#AAA', node: '#DCA' };
        default_link_color = LiteGraph.LINK_COLOR;
        default_connection_color = { input_off: '#778899', input_on: '#7F7F7F', output_off: '#778899', output_on: '#7F7F7F' };
        graph: unknown = null;
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
    fake.toasts = [];
    fake.commands = [];
    fake.LGraphCanvas = installLiteGraph();
    fake.registered.forEach(load);
}
