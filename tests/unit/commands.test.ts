/**
 * The quick toggles (src/extensions/link-animations.ts) through the fake
 * frontend, whose toasts take no action, as 1.39.5's do: each command's work,
 * check, toast and POSTs; Alt+L and Alt+K, and the keys they leave to others;
 * View ▸ Enhanced Links & Nodes; the action bar's button; the canvas menu's
 * Enhanced FX; the selection toolbox; the About page's badges; and the keys
 * About and the picker tell. How they look and work in ComfyUI is the e2e
 * suite's (tests/e2e/commands.spec.ts).
 */

import type { ComfyExtension, IContextMenuValue } from '@comfyorg/comfyui-frontend-types';
import { describe, it, expect, vi } from 'vitest';
import { L, LOOK, N, commit, preview, restore } from '@/core/settings';
import { live } from '@/core/engine';
import { play } from '@/fx/bursts';
import { DISABLED, running } from '@/sidebar/sidebar';
import { app, fake } from '../helpers/fake-app';
import { frames, progress, send, start, type FakeCanvas, type FakeNode } from '../helpers/fake-litegraph';

vi.mock('@/fx/bursts', async (importOriginal) => {
    const bursts = await importOriginal<typeof import('@/fx/bursts')>();
    return { ...bursts, play: vi.fn(bursts.play) };
});

const ID = 'EnhancedLinksNodes.';
const TOGGLE = 'Workspace.ToggleSidebarTab.enhanced-links-nodes';
const LINKS_ON = '🔗 Enhanced Links.Enabled';
const NODES_ON = '📦 Enhanced Nodes.Enabled';
const LINKS_STATIC = '🔗 Enhanced Links.Static.Mode';
const NODES_STATIC = '📦 Enhanced Nodes.Static.Mode';
const THICKNESS = '🔗 Enhanced Links.Thickness';
const FOCUS_ON = '🔗 Enhanced Links.Focus.Enabled';
const FOCUS_MODE = '🔗 Enhanced Links.Focus.Mode';
const FOLLOW = '🔗 Enhanced Links.Navigate.Follow';
const KEYS = '🔗 Enhanced Links.Keys';

const extension = (name: string) => fake.extensions.find((e) => e.name === name) as unknown as ComfyExtension;
const links = () => extension('enhanced.link.animations');
const command = (name: string) => links().commands!.find((c) => c.id === `${ID}${name}`)!;
const run = (name: string) => app.extensionManager.command.execute(`${ID}${name}`);
/**
 * Starts as a page loaded with Shortcut keys `set` does: the extension's keys bound as it registers, which reads the set
 * saved then. The fake registers it once, as the first test imports it, so its keys are bound again here.
 */
async function startWith(set: string, settings: Record<string, unknown> = {}) {
    await start({ [KEYS]: set, ...settings });
    fake.keybindings = fake.keybindings.filter((k) => k.commandId !== TOGGLE && !k.commandId.startsWith(ID));
    fake.keybindings.push(...links().keybindings!);
}

/** Lets the write queue drain: the fake store's writes finish within microtasks. */
const settle = () => new Promise((resolve) => setTimeout(resolve));
const said = () => (fake.toasts.at(-1) as { summary: string } | undefined)?.summary;
const posted = () => fake.posts.map(([id]) => id);
/** A button by its text. */
const buttonOf = (root: ParentNode, name: string) => [...root.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === name);
const changes = (canvas: FakeCanvas) => canvas.calls.filter((call) => call === 'emitAfterChange').length;

function select(canvas: FakeCanvas, nodes: FakeNode[]): void {
    for (const node of nodes) {
        node.selected = true;
        canvas.selectedItems.add(node);
    }
}

/** The canvas menu's Enhanced FX item, and what its submenu lists. */
function enhancedFx(canvas: FakeCanvas): [IContextMenuValue, IContextMenuValue[]] {
    const [item] = links().getCanvasMenuItems!(canvas as never) as IContextMenuValue[];
    return [item, item.submenu!.options as IContextMenuValue[]];
}

/** Runs `test` with `part`'s extension as if disabled: its setup() never ran. */
async function disabled(parts: (keyof typeof running)[], test: () => Promise<void>): Promise<void> {
    for (const part of parts) running[part] = false;
    try {
        await test();
    } finally {
        for (const part of parts) running[part] = true;
    }
}

describe('the commands', () => {
    it('are the link extension’s, labelled for the Keybinding settings and the menus, and only the selection’s changes the graph', async () => {
        await start();
        expect(links().commands!.map((c) => [c.id.slice(ID.length), c.label, c.menubarLabel, c.category, c.icon])).toEqual([
            ['ShowPanel', 'Show Enhanced Links & Nodes panel', 'Panel', 'view-controls', 'eln-icon'],
            ['ToggleAll', 'Toggle all effects', 'All effects', 'essentials', 'pi pi-sparkles'],
            ['ToggleLinks', 'Toggle link effects', 'Link effects', 'view-controls', 'pi pi-link'],
            ['ToggleNodes', 'Toggle node effects', 'Node effects', 'view-controls', 'pi pi-objects-column'],
            ['ToggleStatic', 'Freeze / unfreeze animation', 'Freeze animation', 'view-controls', 'pi pi-pause'],
            ['ToggleFocus', 'Toggle selection focus', 'Selection focus', 'view-controls', 'pi pi-bullseye'],
            ['NextFocusMode', 'Next selection focus mode', undefined, 'view-controls', 'pi pi-filter'],
            ['NextLinkStyle', 'Next link animation', undefined, 'view-controls', 'pi pi-forward'],
            ['NextNodeStyle', 'Next node effect', undefined, 'view-controls', 'pi pi-forward'],
            ['ChooseLook', 'Choose a look…', 'Choose look…', 'view-controls', 'pi pi-palette'],
            ['SurpriseMe', 'Surprise me (random look)', 'Surprise me', undefined, 'pi pi-star'],
            ['GoToRunning', 'Go to running node (or next error)', 'Go to running node', 'essentials', 'pi pi-directions'],
            ['NextError', 'Go to next error', 'Next error', 'essentials', 'pi pi-exclamation-triangle'],
            ['ToggleFollow', 'Toggle follow execution', 'Follow execution', 'view-controls', 'pi pi-eye'],
            ['GoUpstream', 'Go to input node', undefined, 'view-controls', 'pi pi-arrow-left'],
            ['GoDownstream', 'Go to output node', undefined, 'view-controls', 'pi pi-arrow-right'],
            ['GoBack', 'Go back', undefined, 'view-controls', 'pi pi-undo'],
            ['SelectionNodeFX', 'Cycle node effect for selection', undefined, undefined, 'pi pi-sparkles'],
            ['PreviewCompletion', 'Preview completion effect', undefined, undefined, 'pi pi-play'],
            ['ResetAll', 'Reset all Enhanced Links & Nodes settings…', undefined, undefined, 'pi pi-refresh'],
        ]);
        expect(links().commands!.filter((c) => c.mutatesGraph).map((c) => c.id)).toEqual([`${ID}SelectionNodeFX`]);
        expect(extension('enhanced.node.animations').commands).toBeUndefined();
    });

    it('ToggleAll turns every effect off while any is on, else all on, with a POST for each switch it changes, and names Alt+K while it is bound', async () => {
        await startWith('alt', { [NODES_ON]: false });
        const all = command('ToggleAll');
        expect(all.active!()).toBe(true);
        await run('ToggleAll');
        await settle();
        expect([L.enabled, N.enabled, all.active!(), posted(), said()]).toEqual([false, false, false, [LINKS_ON], 'Effects off — Alt+K to restore']);
        await run('ToggleAll');
        await settle();
        expect([L.enabled, N.enabled, all.active!(), posted(), said()]).toEqual([true, true, true, [LINKS_ON, LINKS_ON, NODES_ON], 'Effects on']);

        // With Alt+K taken by the user for another command, its first key is the one macOS's Option types, which it does not name.
        const kept = fake.keybindings;
        fake.keybindings = kept.filter((k) => k.commandId !== all.id || k.combo.key !== 'k');
        try {
            await run('ToggleAll');
            expect([said(), links().actionBarButtons![0].tooltip]).toEqual(['Effects off', 'Toggle all effects']);
        } finally {
            fake.keybindings = kept;
        }
    });

    it('the checks show what the snapshots hold, and read the switches from the store too, for the menus’ render to track', async () => {
        await start({ [LINKS_STATIC]: true });
        const reads = vi.spyOn(app.extensionManager.setting, 'get');
        const checks = () => ['ToggleAll', 'ToggleLinks', 'ToggleNodes', 'ToggleStatic'].map((name) => command(name).active!());
        expect(checks()).toEqual([true, true, true, false]);
        expect(new Set(reads.mock.calls.map(([id]) => id))).toEqual(new Set([LINKS_ON, NODES_ON, LINKS_STATIC, NODES_STATIC]));
        // A value previewed, not saved, is what they show.
        preview(LINKS_ON, false);
        expect([checks(), app.extensionManager.setting.get(LINKS_ON)]).toEqual([[true, false, true, false], true]);
        restore([LINKS_ON]);
        reads.mockRestore();
    });

    it('ToggleLinks and ToggleNodes turn one master switch over; ToggleStatic freezes both, or with both frozen frees both, as the quick bar’s chips do', async () => {
        await start({ [LINKS_STATIC]: true });
        await run('ToggleLinks');
        await run('ToggleNodes');
        await settle();
        expect([L.enabled, N.enabled, command('ToggleLinks').active!(), command('ToggleNodes').active!(), posted(), said()]).toEqual([false, false, false, false, [LINKS_ON, NODES_ON], 'Node effects off']);
        await run('ToggleLinks');
        await settle();
        expect([L.enabled, said()]).toEqual([true, 'Link effects on']);

        // Links alone are frozen, which counts as not frozen: both freeze, and only the nodes' switch is written.
        fake.posts = [];
        const frozen = command('ToggleStatic');
        expect(frozen.active!()).toBe(false);
        await run('ToggleStatic');
        await settle();
        expect([L.staticMode, N.staticMode, frozen.active!(), posted(), said()]).toEqual([true, true, true, [NODES_STATIC], 'Animation frozen']);
        await run('ToggleStatic');
        await settle();
        expect([L.staticMode, N.staticMode, frozen.active!(), posted(), said()]).toEqual([false, false, false, [NODES_STATIC, LINKS_STATIC, NODES_STATIC], 'Animation unfrozen']);
    });

    it('NextLinkStyle and NextNodeStyle step Animate through its options in the panel’s order, the last on to the first, one POST each', async () => {
        await start({ '📦 Enhanced Nodes.Animate': 6 });
        const step = async (name: string) => {
            await run(name);
            await settle();
        };
        await step('NextLinkStyle');
        expect([L.animate, said()]).toEqual([1, 'Link animation: Sacred Flow']);
        await step('NextLinkStyle');
        expect([L.animate, said()]).toEqual([10, 'Link animation: Merkaba Beads']);
        await step('NextNodeStyle');
        expect([N.animate, said()]).toEqual([0, 'Node effect: None']);
        await step('NextNodeStyle');
        expect([N.animate, said()]).toEqual([1, 'Node effect: Gentle Pulse']);
        expect(posted()).toEqual(['🔗 Enhanced Links.Animate', '🔗 Enhanced Links.Animate', '📦 Enhanced Nodes.Animate', '📦 Enhanced Nodes.Animate']);

        // Comet Trails after Energy Pulse, and DNA Helix 3D after DNA Helix.
        await start({ '🔗 Enhanced Links.Animate': 5 });
        const order: number[] = [];
        for (let i = 0; i < 4; i++) {
            await step('NextLinkStyle');
            order.push(L.animate);
        }
        expect(order).toEqual([12, 6, 11, 7]);

        await start({ '🔗 Enhanced Links.Animate': 8 });
        await run('NextLinkStyle');
        expect([L.animate, said()]).toEqual([13, 'Link animation: Stardust']);
        await run('NextLinkStyle');
        expect([L.animate, said()]).toEqual([0, 'Link animation: None']);
        await run('NextLinkStyle');
        expect(L.animate).toBe(9);
    });

    it('ToggleFocus turns selection focus over, named with its mode, and checked while on; NextFocusMode steps the mode, turning focus on', async () => {
        await start();
        const focus = command('ToggleFocus');
        expect(focus.active!()).toBe(true);
        await run('ToggleFocus');
        await settle();
        expect([L.focusEnabled, focus.active!(), posted(), said()]).toEqual([false, false, [FOCUS_ON], 'Selection focus off']);
        await run('NextFocusMode');
        await settle();
        expect([L.focusEnabled, L.focusMode, posted(), said()]).toEqual([true, 'animate', [FOCUS_ON, FOCUS_ON, FOCUS_MODE], 'Selection focus mode: Animate only these']);
        for (const mode of ['dim', 'hide', 'highlight']) {
            await run('NextFocusMode');
            expect(L.focusMode).toBe(mode);
        }
        await run('ToggleFocus');
        await run('ToggleFocus');
        expect(said()).toBe('Selection focus: Highlight');
    });

    it('GoUpstream and GoDownstream go from the node selected, and say why when they cannot; GoBack goes back, or says there is nowhere to go', async () => {
        const canvas = await start({}, { nodes: [{ pos: [100, 100], title: 'Seed' }, { pos: [600, 100], title: 'KSampler' }], links: [{ from: 0, to: 1 }] });
        frames(1);
        await run('GoUpstream');
        expect(said()).toBe('Select one node first');
        select(canvas, [canvas.graph._nodes[1]]);
        await run('GoUpstream');
        expect([...canvas.selectedItems]).toEqual([canvas.graph._nodes[0]]);
        await run('GoUpstream');
        expect(said()).toBe('Nothing feeds Seed');
        await run('GoDownstream');
        expect([...canvas.selectedItems]).toEqual([canvas.graph._nodes[1]]);
        await run('GoBack');
        await run('GoBack');
        await run('GoBack');
        expect([[...canvas.selectedItems], said()]).toEqual([[canvas.graph._nodes[1]], 'Nothing to go back to']);
    });

    it('GoToRunning goes to the node this client’s run runs, or to the one holding the subgraph it runs in, saying so; once the run failed, NextError and it cycle its errors with a red pulse', async () => {
        const canvas = await start({}, {
            nodes: [{ pos: [100, 100], title: 'Load' }, { pos: [600, 100], title: 'Group', subgraph: { nodes: [{ pos: [100, 100], title: 'Inner' }] } }, { pos: [1100, 100], title: 'Save' }],
        });
        const [load, group, save] = canvas.graph._nodes;
        frames(1);
        await run('GoToRunning');
        expect(said()).toBe('Nothing is running');
        await run('NextError');
        expect(said()).toBe('No errors');
        send('execution_start', { prompt_id: 'go', timestamp: 0 });
        progress('go', { 1: 'running' });
        await run('GoToRunning');
        expect([[...canvas.selectedItems], canvas.animations.at(-1)?.bounds]).toEqual([[load], [...load.boundingRect]]);
        progress('go', { 1: 'finished', '2:1': 'running' });
        fake.toasts = [];
        await run('GoToRunning');
        expect([[...canvas.selectedItems], said()]).toEqual([[group], 'Running inside Group']);
        expect(document.querySelector('.eln-chipbar')?.textContent).toBe('↩ Back to Load');
        // Failed: Alt+J goes to the error, marked in red.
        send('execution_error', { prompt_id: 'go', node_id: '2:1', node_type: 'ELNInt', executed: [], exception_message: '', exception_type: '', traceback: [], timestamp: 0 });
        canvas.selectItems([save]);
        await run('GoToRunning');
        frames(3);
        const marks = canvas.front.paints.filter((p) => p.op === 'stroke' && p.style === '#ff3b30' && p.box?.[0] === group.boundingRect[0] - 6);
        expect([[...canvas.selectedItems], marks.length > 0]).toEqual([[group], true]);
        expect(enhancedFx(canvas)[1][5].content).toBe('Next error (1)');
        // 1.57.1 keeps this client's errors on the workspace store, the prompt's own too.
        Object.assign(app.extensionManager, { lastNodeErrors: { 3: { errors: [] } }, lastExecutionError: { node_id: '1' } });
        try {
            await run('NextError');
            expect([[...canvas.selectedItems], document.querySelector('.eln-chipbar')?.textContent]).toEqual([[save], '1/2 · Save↩ Back to Group']);
            await run('NextError');
            expect([...canvas.selectedItems]).toEqual([load]);
            expect(enhancedFx(canvas)[1][5].content).toBe('Next error (2)');
        } finally {
            delete (app.extensionManager as { lastNodeErrors?: unknown }).lastNodeErrors;
            delete (app.extensionManager as { lastExecutionError?: unknown }).lastExecutionError;
        }
        document.querySelector('.eln-chipbar')?.remove();
    });

    it('ToggleFollow turns Navigate.Follow over, checked while on, and the canvas menu shows it', async () => {
        const canvas = await start();
        const follow = command('ToggleFollow');
        expect(follow.active!()).toBe(false);
        await run('ToggleFollow');
        await settle();
        expect([L.navigateFollow, follow.active!(), posted(), said()]).toEqual([true, true, [FOLLOW], 'Follow execution on']);
        expect(enhancedFx(canvas)[1][4].content).toBe('☑ Follow execution');
        enhancedFx(canvas)[1][4].callback!.call(undefined as never);
        await settle();
        expect([L.navigateFollow, said()]).toEqual([false, 'Follow execution off']);
    });

    it('ShowPanel opens the panel unless it shows, and is checked while it shows; ChooseLook shows the look picker', async () => {
        await start();
        await run('ShowPanel');
        expect(fake.commands).toEqual([`${ID}ShowPanel`, TOGGLE]);
        const slot = document.body.appendChild(document.createElement('div'));
        const tab = fake.tabs.find((t) => t.id === 'enhanced-links-nodes')!;
        tab.render(slot);
        expect(command('ShowPanel').active!()).toBe(true);
        await run('ShowPanel');
        expect(fake.commands).toEqual([`${ID}ShowPanel`, TOGGLE, `${ID}ShowPanel`]);
        tab.destroy!();
        slot.remove();
        expect(command('ShowPanel').active!()).toBe(false);

        await run('ChooseLook');
        const card = document.querySelector<HTMLElement>('.eln-picker')!;
        expect(card.querySelector('h2')!.textContent).toBe('Choose your look');
        buttonOf(card, 'Done')!.click();
        expect(document.querySelector('.eln-picker')).toBeNull();
        expect(fake.posts).toEqual([]);
    });

    it('SurpriseMe applies a surprise, whose undo shows where the picker does while the panel is closed', async () => {
        await start({ [THICKNESS]: 6 });
        await run('SurpriseMe');
        expect(L.look).not.toBe('custom');
        const bar = document.querySelector<HTMLElement>('.eln-picker-undo')!;
        expect(bar.textContent).toMatch(/ appliedUndo$/);
        buttonOf(bar, 'Undo')!.click();
        expect([L.look, L.thickness]).toEqual(['custom', 6]);
        expect(document.querySelector('.eln-picker-undo')).toBeNull();
        await settle();
    });

    it('ResetAll asks ComfyUI’s confirm dialog first, then resets everything as About does, with one undo', async () => {
        await start({ [THICKNESS]: 6, '📦 Enhanced Nodes.Animate': 2 });
        fake.confirmed = false;
        await run('ResetAll');
        await settle();
        expect([fake.confirms, L.thickness, fake.posts]).toEqual([[{ title: 'Reset Enhanced Links & Nodes', message: expect.stringContaining('the look to Subtle') }], 6, []]);

        fake.confirmed = true;
        await run('ResetAll');
        await settle();
        expect([L.thickness, N.animate, L.look]).toEqual([3, 0, 'subtle']);
        expect(new Set(posted()).size).toBe(fake.posts.length);
        buttonOf(document.querySelector('.eln-picker-undo')!, 'Undo')!.click();
        expect([L.thickness, N.animate, L.look]).toEqual([6, 2, 'custom']);
    });

    it('SelectionNodeFX steps the selected nodes through Use global, Off and each effect, from the first where they differ, one change each', async () => {
        const canvas = await start({ '📦 Enhanced Nodes.Animate': 2 }, { nodes: [{ pos: [100, 100] }, { pos: [400, 100] }, { pos: [100, 400] }] });
        const [first, second, other] = canvas.graph._nodes;
        await run('SelectionNodeFX');
        expect([said(), changes(canvas)]).toEqual(['Select a node first', 0]);

        select(canvas, [first, second]);
        await run('SelectionNodeFX');
        // The selected nodes only.
        expect([said(), first.properties, second.properties, other.properties]).toEqual(['2 nodes: Off', { enhanced_fx_style: 0 }, { enhanced_fx_style: 0 }, {}]);
        const steps: string[] = [];
        for (let i = 0; i < 7; i++) {
            await run('SelectionNodeFX');
            steps.push(said()!);
        }
        expect(steps).toEqual(['2 nodes: Gentle Pulse', '2 nodes: Neon Nexus', '2 nodes: Cosmic Ripple', '2 nodes: Sacred Rosette', '2 nodes: Flower of Life', '2 nodes: Jelly', '2 nodes: Use global (Neon Nexus)']);
        expect([first.properties, second.properties, other.properties, changes(canvas)]).toEqual([{}, {}, {}, 8]);

        first.properties = { enhanced_fx_style: 3, enhanced_fx_particles_only: true };
        await run('SelectionNodeFX');
        expect([said(), first.properties, second.properties]).toEqual(['2 nodes: Use global (Neon Nexus)', {}, {}]);
        canvas.selectedItems.delete(second);
        await run('SelectionNodeFX');
        expect([said(), first.properties]).toEqual(['1 node: Off', { enhanced_fx_style: 0 }]);
    });

    it('PreviewCompletion plays the completion style over the selected nodes, else the output nodes in view, else in the middle of the view', async () => {
        const shown = () => vi.mocked(play).mock.calls.at(-1)![1];
        const canvas = await start({}, { nodes: [{ pos: [100, 100] }, { pos: [400, 100], output: true }, { pos: [5000, 5000], output: true }] });
        const [plain, output] = canvas.graph._nodes;
        frames(1);
        await run('PreviewCompletion');
        expect(shown()).toEqual([output]);
        expect(live.bursts).toBeGreaterThan(0);

        const again = await start({}, { nodes: [{ pos: [100, 100] }, { pos: [400, 100], output: true }] });
        select(again, [again.graph._nodes[0]]);
        await run('PreviewCompletion');
        expect(shown()).toEqual([again.graph._nodes[0]]);

        const empty = await start();
        empty.ds.offset = [-200, -100];
        frames(1);
        await run('PreviewCompletion');
        const area = empty.visible_area;
        expect(shown()).toEqual([{ id: 'view', pos: [area[0] + area[2] / 2, area[1] + area[3] / 2], graph: empty.graph }]);
        expect(plain.properties).toEqual({});
    });

    it('those of a disabled extension say so instead of acting, for long enough to read, the commands of both only with both disabled, the action bar’s button too', async () => {
        await start();
        const shows = vi.mocked(play).mock.calls.length;
        await disabled(['nodes'], async () => {
            for (const name of ['ToggleNodes', 'NextNodeStyle', 'SelectionNodeFX', 'PreviewCompletion']) {
                await run(name);
                expect([said(), (fake.toasts.at(-1) as { life: number }).life], name).toEqual([DISABLED.nodes, 5000]);
            }
            await run('ToggleAll');
            expect([L.enabled, N.enabled]).toEqual([false, false]);
        });
        expect([N.animate, vi.mocked(play).mock.calls.length]).toEqual([0, shows]);
        await disabled(['links'], async () => {
            await run('NextLinkStyle');
            expect([said(), L.animate]).toEqual([DISABLED.links, 9]);
        });
        await disabled(['links', 'nodes'], async () => {
            fake.commands = [];
            links().actionBarButtons![0].onClick();
            await settle();
            await run('ShowPanel');
            expect([said(), L.enabled, fake.commands]).toEqual(['Enhanced Links & Nodes is disabled in Settings › Extensions.', false, [`${ID}ToggleAll`, `${ID}ShowPanel`]]);
        });
    });
});

describe('the keys', () => {
    it('are none until Shortcut keys is on, and say a change needs a reload', async () => {
        await startWith('off');
        expect(fake.keybindings.filter((k) => k.commandId === TOGGLE || k.commandId.startsWith(ID))).toEqual([]);
        expect(links().actionBarButtons![0].tooltip).toBe('Toggle all effects');
        commit(KEYS, 'alt');
        await settle();
        expect(said()).toBe('Reload the page to use the new shortcut keys');
    });

    it('bind Alt+L to the panel’s toggle, Alt+K to ToggleAll and Alt+J to GoToRunning, with the characters macOS’s Option types too', async () => {
        await startWith('alt');
        const ours = fake.keybindings.filter((k) => k.commandId === TOGGLE || k.commandId.startsWith(ID));
        expect(ours).toEqual([
            { commandId: TOGGLE, combo: { key: 'l', alt: true } },
            { commandId: TOGGLE, combo: { key: '¬', alt: true } },
            { commandId: `${ID}ToggleAll`, combo: { key: 'k', alt: true } },
            { commandId: `${ID}ToggleAll`, combo: { key: '˚', alt: true } },
            { commandId: `${ID}GoToRunning`, combo: { key: 'j', alt: true } },
            { commandId: `${ID}GoToRunning`, combo: { key: '∆', alt: true } },
        ]);
    });

    it('bind Alt+Shift+L, Alt+Shift+K and Alt+Shift+J with the Alt+Shift set, naming them but not the ones macOS’s Option types', async () => {
        await startWith('alt-shift');
        const ours = fake.keybindings.filter((k) => k.commandId === TOGGLE || k.commandId.startsWith(ID));
        expect(ours.map((k) => [k.commandId, k.combo.key, k.combo.alt, k.combo.shift])).toEqual([
            [TOGGLE, 'l', true, true], [TOGGLE, 'Ò', true, true],
            [`${ID}ToggleAll`, 'k', true, true], [`${ID}ToggleAll`, '\uf8ff', true, true],
            [`${ID}GoToRunning`, 'j', true, true], [`${ID}GoToRunning`, 'Ô', true, true],
        ]);
        expect(links().actionBarButtons![0].tooltip).toBe('Toggle all effects (Alt+Shift+K)');
        const kept = fake.keybindings;
        fake.keybindings = kept.filter((k) => k.combo.key !== 'k');
        try {
            expect(links().actionBarButtons![0].tooltip).toBe('Toggle all effects');
        } finally {
            fake.keybindings = kept;
        }
    });

    it('leave out a key that ComfyUI or an extension before them has as they register, which would be an error toast', async () => {
        await start({ [KEYS]: 'alt' });
        const [kept, commands] = [fake.keybindings, fake.registeredCommands];
        // As the extension registers: a command of another extension's on Alt+K, typed as Shift would give it.
        fake.keybindings = [{ commandId: 'Other.Command', combo: { key: 'K', alt: true } }];
        fake.registeredCommands = new Map([['Other.Command', { id: 'Other.Command', function: () => {} }]]);
        try {
            expect(links().keybindings!.map((k) => [k.commandId, k.combo.key])).toEqual([[TOGGLE, 'l'], [TOGGLE, '¬'], [`${ID}ToggleAll`, '˚'], [`${ID}GoToRunning`, 'j'], [`${ID}GoToRunning`, '∆']]);
        } finally {
            [fake.keybindings, fake.registeredCommands] = [kept, commands];
        }
    });

    it('are the ones About tells, as they are bound now, and the picker names the panel’s', async () => {
        await startWith('alt', { '🔗 Enhanced Links.Panel.State': { tab: 'about', advanced: false, search: '' } });
        const about = () => {
            const slot = document.createElement('div');
            const tab = fake.tabs.find((t) => t.id === 'enhanced-links-nodes')!;
            tab.render(slot);
            const keys = [...slot.querySelectorAll('.eln-keys > dt')].map((dt) => [dt.textContent, dt.nextElementSibling!.textContent]);
            tab.destroy!();
            return keys.slice(0, 3);
        };
        const RUNNING = 'Goes to the node your run is running, or once it failed, to the next error.';
        expect(about()).toEqual([['Alt+L', 'Opens and closes this panel.'], ['Alt+K', 'Turns every effect off, or back on.'], ['Alt+J', RUNNING]]);
        await run('ChooseLook');
        expect(document.querySelector('.eln-picker-foot .eln-hint')!.textContent).toBe('Change it any time in the FX panel (Alt+L).');
        buttonOf(document.querySelector('.eln-picker')!, 'Done')!.click();

        // Left with the keys macOS's Option types alone, which other keyboards cannot, they name none.
        const kept = fake.keybindings;
        fake.keybindings = kept.filter((k) => k.combo.key === '¬' || k.combo.key === '˚' || k.combo.key === '∆');
        try {
            expect(about()).toEqual([
                ['Toggle Enhanced Links & Nodes Sidebar', 'Opens and closes this panel. Turn on Shortcut keys under Perf, or give it a key in Settings › Keybinding.'],
                ['Toggle all effects', 'Turns every effect off, or back on. Turn on Shortcut keys under Perf, or give it a key in Settings › Keybinding.'],
                ['Go to running node (or next error)', `${RUNNING} Turn on Shortcut keys under Perf, or give it a key in Settings › Keybinding.`],
            ]);
            await run('ChooseLook');
            expect(document.querySelector('.eln-picker-foot .eln-hint')!.textContent).toBe('Change it any time in the FX panel.');
            buttonOf(document.querySelector('.eln-picker')!, 'Done')!.click();
        } finally {
            fake.keybindings = kept;
        }
    });
});

describe('the menus and buttons', () => {
    it('View ▸ Enhanced Links & Nodes lists the extension’s own commands in three groups', async () => {
        await start();
        const groups = links().menuCommands!;
        expect(groups).toEqual([
            { path: ['View', 'Enhanced Links & Nodes'], commands: [`${ID}ShowPanel`, `${ID}ChooseLook`, `${ID}SurpriseMe`] },
            { path: ['View', 'Enhanced Links & Nodes'], commands: [`${ID}ToggleAll`, `${ID}ToggleLinks`, `${ID}ToggleNodes`, `${ID}ToggleStatic`] },
            { path: ['View', 'Enhanced Links & Nodes'], commands: [`${ID}ToggleFocus`, `${ID}ToggleFollow`, `${ID}GoToRunning`, `${ID}NextError`] },
        ]);
        // The menu leaves out ids that are not the extension's (FE157 stores/menuItemStore.ts L94-110).
        const own = new Set(links().commands!.map((c) => c.id));
        expect(groups.flatMap((g) => g.commands).every((id) => own.has(id))).toBe(true);
    });

    it('the canvas menu’s Enhanced FX shows the switches’ state in their text, selection focus with its mode and the look by name, one submenu level, and runs the commands', async () => {
        const canvas = await start({ [LOOK]: 'showcase', [FOCUS_MODE]: 'dim' });
        const [item, options] = enhancedFx(canvas);
        expect([item.content, item.has_submenu]).toEqual(['Enhanced FX', true]);
        expect(options.map((o) => o.content)).toEqual(['☑ Link effects', '☑ Node effects', '☐ Freeze animation', '☑ Selection focus: Dim others', '☐ Follow execution', 'Go to running node', 'Look: Showcase…', 'Surprise me', 'Open panel']);
        expect(options.every((o) => !o.has_submenu && !o.submenu)).toBe(true);
        const click = (content: string) => enhancedFx(canvas)[1].find((o) => o.content === content)!.callback!.call(undefined as never);
        click('☑ Link effects');
        click('☐ Freeze animation');
        await settle();
        expect(enhancedFx(canvas)[1].slice(0, 3).map((o) => o.content)).toEqual(['☐ Link effects', '☑ Node effects', '☑ Freeze animation']);
        expect([said(), posted()]).toEqual(['Animation frozen', [LINKS_ON, LINKS_STATIC, NODES_STATIC]]);
        click('☑ Selection focus: Dim others');
        await settle();
        expect([enhancedFx(canvas)[1][3].content, said()]).toEqual(['☐ Selection focus: Dim others', 'Selection focus off']);
        click('Open panel');
        click('Look: Showcase…');
        expect(fake.commands).toEqual([`${ID}ToggleLinks`, `${ID}ToggleStatic`, `${ID}ToggleFocus`, `${ID}ShowPanel`, TOGGLE, `${ID}ChooseLook`]);
        expect(document.querySelector('.eln-picker')).not.toBeNull();
        buttonOf(document.querySelector('.eln-picker')!, 'Done')!.click();

        await start({ [LOOK]: 'custom' });
        expect(enhancedFx(canvas)[1][6].content).toBe('Look: Custom…');
    });

    it('the action bar’s button toggles every effect, named with Alt+K; the About page shows the project at its version, the studio’s Discord and Ko-fi', async () => {
        await startWith('alt');
        const [button] = links().actionBarButtons!;
        expect([button.icon, button.tooltip]).toEqual(['eln-icon', 'Toggle all effects (Alt+K)']);
        button.onClick();
        expect([L.enabled, N.enabled]).toEqual([false, false]);
        expect(links().aboutPageBadges).toEqual([
            { label: `Enhanced Links & Nodes ${__ELN_VERSION__}`, url: 'https://github.com/AEmotionStudio/ComfyUI-EnhancedLinksandNodes', icon: 'pi pi-github' },
            { label: 'Æmotion Studio Discord', url: 'https://discord.gg/UzC9353mfp', icon: 'pi pi-discord' },
            { label: 'Ko-fi', url: 'https://ko-fi.com/aemotionstudio', icon: 'pi pi-heart' },
        ]);
    });

    it('the selection toolbox has the selection’s node effect button for a node while node effects are on', async () => {
        const canvas = await start({}, { nodes: [{ pos: [100, 100] }] });
        const toolbox = (item: unknown) => extension('enhanced.node.animations').getSelectionToolboxCommands!(item as never);
        expect([toolbox(canvas.graph._nodes[0]), toolbox({ pos: [0, 0] })]).toEqual([[`${ID}SelectionNodeFX`], []]);
        await run('ToggleNodes');
        expect(toolbox(canvas.graph._nodes[0])).toEqual([]);
    });
});
