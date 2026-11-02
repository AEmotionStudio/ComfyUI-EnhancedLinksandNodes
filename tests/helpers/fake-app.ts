/**
 * Test double for ComfyUI's '/scripts/app.js' and '/scripts/api.js' (both are
 * aliased to this file in vitest.config.ts) and for the LiteGraph globals that
 * src code expects, plus matchMedia, which jsdom lacks. Settings behave like
 * the frontend's settingStore (platform/settings/settingStore.ts, the same in
 * 1.39.5 and 1.57.1) where M2 relies on it; tests can also fill the stored
 * values directly. Commands and keys behave like its commandStore and
 * keybindingStore: an extension's keys and commands go in as it registers, and
 * each command hands out its first key. The workflow store holds one workflow
 * open, which tests may swap for another.
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

interface Command {
    id: string;
    function: () => unknown;
}

interface Keybinding {
    commandId: string;
    combo: { key: string; ctrl?: boolean; alt?: boolean; shift?: boolean };
}

interface Extension {
    name: string;
    settings?: Setting[];
    commands?: Command[];
    keybindings?: Keybinding[];
    setup?: (app: unknown) => unknown;
    beforeRegisterNodeDef?: (nodeType: unknown, nodeData: unknown, app: unknown) => unknown;
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
    /** The commands registered, by id: each extension's, a sidebar tab's toggle, and any a test adds. */
    registeredCommands: new Map<string, Command>(),
    /** The keys bound, in the order the keybinding store got them. */
    keybindings: [] as Keybinding[],
    /** The options of each dialog.confirm, in order, and what the user answers. */
    confirms: [] as unknown[],
    confirmed: true,
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
        // The sidebar store makes the tab's toggle command (FE157 stores/workspace/sidebarTabStore.ts L59-72); here it toggles nothing.
        registerSidebarTab: (tab: SidebarTab) => {
            fake.tabs.push(tab);
            fake.registeredCommands.set(`Workspace.ToggleSidebarTab.${tab.id}`, { id: `Workspace.ToggleSidebarTab.${tab.id}`, function: () => {} });
        },
        getSidebarTabs: () => fake.tabs,
        workflow: { activeWorkflow: {} as unknown },
        toast: { add: (message: unknown) => void fake.toasts.push(message) },
        dialog: {
            confirm: async (options: unknown) => {
                fake.confirms.push(options);
                return fake.confirmed;
            },
        },
        command: {
            /** Each command with the first key bound to it, as ComfyCommandImpl.keybinding hands it out (FE157 stores/commandStore.ts L80-82). */
            get commands() {
                return [...fake.registeredCommands.values()].map((command) => ({ ...command, keybinding: fake.keybindings.find((k) => k.commandId === command.id) ?? null }));
            },
            execute: async (id: string) => {
                fake.commands.push(id);
                await fake.registeredCommands.get(id)?.function();
            },
        },
    },
    canvas,
    graph: {
        canvas,
        setDirtyCanvas: () => {},
    },
    /** The workflow's own graph, which every subgraph is in (FE157 scripts/app.ts L391-396). */
    rootGraph: undefined as unknown,
    // extensionService.registerExtension registers an extension's keys, commands and settings whether or not it is
    // disabled (FE157 services/extensionService.ts L39-53).
    registerExtension: (extension: Extension) => {
        fake.extensions.push(extension);
        fake.keybindings.push(...(extension.keybindings ?? []));
        for (const command of extension.commands ?? []) fake.registeredCommands.set(command.id, command);
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
    fake.confirms = [];
    fake.confirmed = true;
    fake.LGraphCanvas = installLiteGraph();
    fake.registered.forEach(load);
}
