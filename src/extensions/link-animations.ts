/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Link Animations Extension
 *
 * Registers the link settings, and the quick toggles of both extensions, here
 * so that menus list them in one order: the EnhancedLinksNodes.* commands,
 * Alt+L for the panel and Alt+K for every effect, View ▸ Enhanced Links &
 * Nodes, a button on the action bar, Enhanced FX in the canvas menu, and the
 * About page's badges. A command says what it did in a short toast. setup()
 * starts the engine, the link pipeline (links/pipeline.ts) on ComfyUI's own link
 * pass, and the panel.
 *
 * @module extensions/link-animations
 */

import type { ComfyExtension, ToastId } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { L, N, checked, commit, linkSettings, setting, shown, type Setting } from '@/core/settings';
import { install } from '@/core/engine';
import { fireworks, type Anchor } from '@/fx/bursts';
import { installLinks } from '@/links/pipeline';
import { showPicker } from '@/sidebar/picker';
import {
    BADGES,
    DISABLED,
    FROZEN,
    LINKS_ON,
    NODES_ON,
    TITLE,
    TOGGLE,
    TOGGLE_ALL,
    commandKeys,
    installPanel,
    installStyle,
    keyName,
    keyText,
    panelShown,
    resetEverything,
    running,
    showPanel,
    surpriseMe,
    toggleLinks,
    toggleNodes,
    toggleStatic,
} from '@/sidebar/sidebar';
import { currentLook } from '@/ui/looks';
import { SELECTION_FX, effects, pick, selectedNodes } from '@/ui/menus';

type Command = NonNullable<ComfyExtension['commands']>[number];

/** How long a command's toast shows, and a hint, which takes longer to read. */
const SAY_MS = 2000;
const HINT_MS = 5000;

/** The toast a command showed last, which the next one replaces where toasts take an id (1.57+). */
let said: ToastId | undefined;

/** Says what a command did, in a toast that shows for `ms`. */
function say(text: string, ms = SAY_MS): void {
    const { toast } = app.extensionManager;
    if ('info' in toast) said = toast.info(text, { id: said, duration: ms });
    else app.extensionManager.toast.add({ severity: 'info', summary: text, life: ms });
}

/**
 * A command's work, done if the extension it needs set up, else a toast that says it is disabled; either extension
 * will do for the commands of both. A disabled extension's commands, menus and buttons show all the same (FE157
 * services/extensionService.ts L39-53, stores/actionBarButtonStore.ts).
 */
const needs = (work: () => void, part?: keyof typeof running) => () => {
    if (part ? running[part] : running.links || running.nodes) work();
    else say(part ? DISABLED[part] : `${TITLE} is disabled in Settings › Extensions.`, HINT_MS);
};

/** Steps a choice setting to its next option, from the last back to the first, and says which. */
function next(id: string): void {
    const { name, options } = setting(id) as Extract<Setting, { type: 'combo' }>;
    const option = options[(options.findIndex((o) => o.value === shown(id)) + 1) % options.length];
    commit(id, option.value);
    say(`${name}: ${option.text}`);
}

/** Turns every effect off if any is on, else all on. */
function toggleAll(): void {
    const on = !(L.enabled || N.enabled);
    if (L.enabled !== on) toggleLinks();
    if (N.enabled !== on) toggleNodes();
    const key = keyName(TOGGLE_ALL);
    say(on ? 'Effects on' : key ? `Effects off — ${key} to restore` : 'Effects off');
}

/** Gives the selected nodes Node FX's next effect, after the one they all have, the first if they differ. */
function stepSelection(): void {
    const nodes = selectedNodes();
    if (!nodes.length) return say('Select a node first');
    const list = effects();
    const effect = list[(list.findIndex((e) => nodes.every(e.has)) + 1) % list.length];
    pick(nodes, effect.choices);
    say(`${nodes.length} ${nodes.length === 1 ? 'node' : 'nodes'}: ${effect.name}`);
}

/** Plays the fireworks now: over the selected nodes, else the output nodes in view, else in the middle of the view. */
function preview(): void {
    const { canvas } = app;
    const area = canvas.visible_area;
    const nodes = selectedNodes();
    const outputs = canvas.visible_nodes.filter((node) => (node.constructor as typeof LGraphNode).nodeData?.output_node);
    const middle: Anchor = { id: 'view', pos: [area[0] + area[2] / 2, area[1] + area[3] / 2], graph: canvas.graph };
    fireworks(nodes.length ? nodes : outputs.length ? outputs : [middle], `preview ${Date.now()}`);
}

async function resetAll(): Promise<void> {
    // execute() leaves a command's confirmation to the command (FE157 stores/commandStore.ts L112-128).
    const sure = await app.extensionManager.dialog.confirm({
        title: `Reset ${TITLE}`,
        message: `Every ${TITLE} setting goes back to its default, and the look to Subtle. You can undo it right after.`,
    });
    if (sure) resetEverything();
}

const ID = 'EnhancedLinksNodes.';

const panel = {
    id: `${ID}ShowPanel`, label: `Show ${TITLE} panel`, menubarLabel: 'Panel', category: 'view-controls', icon: 'eln-icon',
    active: panelShown,
    function: needs(showPanel),
} satisfies Command;
const all = {
    id: TOGGLE_ALL, label: 'Toggle all effects', menubarLabel: 'All effects', category: 'essentials', icon: 'pi pi-sparkles',
    active: () => checked(LINKS_ON) || checked(NODES_ON),
    function: needs(toggleAll),
} satisfies Command;
const links = {
    id: `${ID}ToggleLinks`, label: 'Toggle link effects', menubarLabel: 'Link effects', category: 'view-controls', icon: 'pi pi-link',
    active: () => checked(LINKS_ON),
    function: needs(() => {
        toggleLinks();
        say(L.enabled ? 'Link effects on' : 'Link effects off');
    }, 'links'),
} satisfies Command;
const nodes = {
    id: `${ID}ToggleNodes`, label: 'Toggle node effects', menubarLabel: 'Node effects', category: 'view-controls', icon: 'pi pi-objects-column',
    active: () => checked(NODES_ON),
    function: needs(() => {
        toggleNodes();
        say(N.enabled ? 'Node effects on' : 'Node effects off');
    }, 'nodes'),
} satisfies Command;
const frozen = {
    id: `${ID}ToggleStatic`, label: 'Freeze / unfreeze animation', menubarLabel: 'Freeze animation', category: 'view-controls', icon: 'pi pi-pause',
    active: () => FROZEN.every(checked),
    function: needs(() => {
        toggleStatic();
        say(L.staticMode ? 'Animation frozen' : 'Animation unfrozen');
    }),
} satisfies Command;
const look = {
    id: `${ID}ChooseLook`, label: 'Choose a look…', menubarLabel: 'Choose look…', category: 'view-controls', icon: 'pi pi-palette',
    function: needs(showPicker),
} satisfies Command;
const surprise = {
    id: `${ID}SurpriseMe`, label: 'Surprise me (random look)', menubarLabel: 'Surprise me', icon: 'pi pi-star',
    function: needs(surpriseMe),
} satisfies Command;

const commands: Command[] = [
    panel, all, links, nodes, frozen,
    {
        id: `${ID}NextLinkStyle`, label: 'Next link animation', category: 'view-controls', icon: 'pi pi-forward',
        function: needs(() => next('🔗 Enhanced Links.Animate'), 'links'),
    },
    {
        id: `${ID}NextNodeStyle`, label: 'Next node effect', category: 'view-controls', icon: 'pi pi-forward',
        function: needs(() => next('📦 Enhanced Nodes.Animate'), 'nodes'),
    },
    look, surprise,
    { id: SELECTION_FX, label: 'Cycle node effect for selection', icon: 'pi pi-sparkles', mutatesGraph: true, function: needs(stepSelection, 'nodes') },
    { id: `${ID}PreviewCompletion`, label: 'Preview completion effect', icon: 'pi pi-play', function: needs(preview, 'nodes') },
    { id: `${ID}ResetAll`, label: `Reset all ${TITLE} settings…`, icon: 'pi pi-refresh', function: needs(() => void resetAll()) },
];

/** Alt+L opens and closes the panel and Alt+K toggles every effect, with the characters macOS's Option types for them too. */
const KEYS = [
    { commandId: TOGGLE, combo: { key: 'l', alt: true } },
    { commandId: TOGGLE, combo: { key: '¬', alt: true } },
    { commandId: TOGGLE_ALL, combo: { key: 'k', alt: true } },
    { commandId: TOGGLE_ALL, combo: { key: '˚', alt: true } },
];

/** Runs a command as ComfyUI does, which toasts what it throws. */
const run = (command: Command) => () => void app.extensionManager.command.execute(command.id);

const ext: ComfyExtension = {
    name: 'enhanced.link.animations',
    settings: linkSettings,
    commands,

    // Read once as the extension registers, after ComfyUI's own keys and those of the extensions registered before
    // it. A key bound twice is an error toast (FE157 platform/keybindings/keybindingStore.ts L121-140, wrapped at
    // services/extensionService.ts L42-49), so the keys a command has already are left out.
    get keybindings() {
        const taken = new Set(commandKeys().values());
        return KEYS.filter(({ combo }) => !taken.has(keyText(combo)));
    },

    // Two groups, which the menu parts with a separator (FE157 stores/menuItemStore.ts L61-65); checks come from active().
    menuCommands: [
        { path: ['View', TITLE], commands: [panel.id, look.id, surprise.id] },
        { path: ['View', TITLE], commands: [all.id, links.id, nodes.id, frozen.id] },
    ],

    // Drawn as it was given, so its icon stays as it is; the tooltip is read whenever the bar draws.
    actionBarButtons: [{
        icon: 'eln-icon',
        get tooltip() {
            const key = keyName(TOGGLE_ALL);
            return key ? `${all.label} (${key})` : all.label;
        },
        onClick: run(all),
    }],

    aboutPageBadges: BADGES,

    // One item with one submenu level. The switches show their state in their text: the canvas menu has no checks.
    getCanvasMenuItems: () => [{
        content: 'Enhanced FX',
        has_submenu: true,
        submenu: {
            options: [
                ...[links, nodes, frozen].map((c) => ({ content: `${c.active() ? '☑' : '☐'} ${c.menubarLabel}`, callback: run(c) })),
                { content: `Look: ${currentLook()?.name ?? 'Custom'}…`, callback: run(look) },
                { content: surprise.menubarLabel, callback: run(surprise) },
                { content: 'Open panel', callback: run(panel) },
            ],
        },
    }],

    async setup() {
        install();
        installPanel('links');
        installLinks();

        console.log('[EnhancedLinks] Extension registered with full batched rendering pipeline.');
    },
};

// The commands, the View menu and the action bar show the brand icon whether or not the extensions set up.
installStyle();
app.registerExtension(ext);
