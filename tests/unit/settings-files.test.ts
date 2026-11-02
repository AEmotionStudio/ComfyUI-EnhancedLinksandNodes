/**
 * The files generated from the settings schema and the commands: the English
 * text that ComfyUI's settings dialog, its keybinding settings, the selection
 * toolbox and the canvas menu look up (locales/en, which the server hands the
 * frontend through /i18n) and docs/SETTINGS.md. They are file snapshots, so CI
 * fails when one is stale; `pnpm gen:settings` rewrites them.
 */

import type { ComfyExtension, IContextMenuValue } from '@comfyorg/comfyui-frontend-types';
import { describe, it, expect } from 'vitest';
import { SETTINGS, linkSettings, nodeSettings, preview } from '@/core/settings';
import '@/extensions/link-animations';
import { app, fake } from '../helpers/fake-app';

type Entry = (typeof SETTINGS)[number];

/** The settings the dialog shows, and the hidden ones the panel and the picker keep. */
const SHOWN = SETTINGS.filter((s) => s.type !== 'hidden');
const HIDDEN = SETTINGS.filter((s) => s.type === 'hidden');

/** The frontend's normalizeI18nKey: dots become underscores, so an id or a label is a single key. */
const key = (text: string) => text.replaceAll('.', '_');

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/** settings.<id>.name, .tooltip and .options.<option text>, which SettingItem.vue looks up in both frontends. */
const settings = json(Object.fromEntries(SHOWN.map((s) => [key(s.id), {
    name: s.name,
    tooltip: 'tooltip' in s ? s.tooltip : undefined,
    options: s.type === 'combo' ? Object.fromEntries(s.options.map((o) => [key(o.text), o.text])) : undefined,
}])));

/** The dialog's two category levels in display order: the panel, then each group. */
const categories = [...new Set([...linkSettings, ...nodeSettings]
    .filter((p) => p.category)
    .sort((a, b) => b.sortOrder! - a.sortOrder!)
    .flatMap((p) => p.category!.slice(0, 2)))];

/** The link extension, which declares the commands for both (src/extensions/link-animations.ts). */
const links = fake.extensions.find((e) => e.name === 'enhanced.link.animations') as unknown as ComfyExtension;

/** commands.<id>.label, which the selection toolbox's buttons, the Keybinding settings and the Shortcuts panel look up (FE157 ExtensionCommandButton.vue, KeybindingPanel.vue, ShortcutsList.vue). */
const commands = json(Object.fromEntries(links.commands!.map((c) => [key(c.id), { label: c.label }])));

/**
 * The canvas menu's Enhanced FX and its items, as they read with the switches on and off, which ComfyUI looks up in
 * main.json's contextMenu by their whole text (FE157 composables/useContextMenuTranslation.ts L85-90): but the look's,
 * whose text names the look, selection focus's, which names its mode, and Next error's, which counts the errors.
 */
function canvasMenu(): string[] {
    const SWITCHES = ['🔗 Enhanced Links.Enabled', '📦 Enhanced Nodes.Enabled', '🔗 Enhanced Links.Static.Mode', '📦 Enhanced Nodes.Static.Mode', '🔗 Enhanced Links.Navigate.Follow'];
    const read = (on: boolean) => {
        SWITCHES.forEach((id, i) => preview(id, i < 2 ? on : !on));
        const [item] = links.getCanvasMenuItems!(app.canvas as never) as IContextMenuValue[];
        return [item, ...(item.submenu!.options as IContextMenuValue[])].map((o) => o.content!);
    };
    // Off, then on as they start, so they end as they were.
    const [off, on] = [read(false), read(true)];
    return [...new Set(on.flatMap((label, i) => [label, off[i]]))].filter((label) => !label.startsWith('Look: ') && !label.includes('Selection focus: '));
}

/** settingsCategories.<label>, which the dialog's navigation and group headings look up at the top of main.json, and contextMenu.<text>. */
const main = json({ settingsCategories: Object.fromEntries(categories.map((c) => [key(c), c])), contextMenu: Object.fromEntries(canvasMenu().map((label) => [label, label])) });

function optionsOrRange(s: Exclude<Entry, { type: 'hidden' }>): string {
    switch (s.type) {
        case 'boolean':
            return '`true`, `false`';
        case 'slider':
            return `${s.min} to ${s.max}, step ${s.step}`;
        case 'combo':
            return s.options.map((o) => `\`${o.value}\` ${o.text}`).join(', ');
        case 'color':
            return '`#rrggbb`';
    }
}

function defaultOf(s: Exclude<Entry, { type: 'hidden' }>): string {
    const text = s.type === 'combo' ? ` ${s.options.find((o) => o.value === s.default)!.text}` : '';
    return `\`${s.default}\`${text}`;
}

const docs = [
    '# Settings',
    '',
    '<!-- Generated from src/core/settings.ts by `pnpm gen:settings`. -->',
    '',
    `ComfyUI's settings dialog lists every setting under **${categories[0]}**, in the groups below. The id is the key ComfyUI saves the value under, in the user's \`comfy.settings.json\`.`,
    ...categories.slice(1).flatMap((group) => [
        '',
        `## ${group}`,
        '',
        '| Name | Id | Type | Options or range | Default | Tooltip |',
        '| --- | --- | --- | --- | --- | --- |',
        ...SHOWN.filter((s) => s.group === group).map((s) =>
            `| ${s.name} | \`${s.id}\` | ${s.type} | ${optionsOrRange(s)} | ${defaultOf(s)} | ${'tooltip' in s ? s.tooltip : ''} |`),
    ]),
    '',
    '## Kept by the panel',
    '',
    'The panel and the first-run picker save these in the same file. The settings dialog does not show them.',
    '',
    '| Name | Id | Default | What it holds |',
    '| --- | --- | --- | --- |',
    ...HIDDEN.map((s) => `| ${s.name} | \`${s.id}\` | \`${JSON.stringify(s.default)}\` | ${s.tooltip} |`),
    '',
].join('\n');

describe('files generated from the settings schema', () => {
    it('locales/en/settings.json', async () => {
        await expect(settings).toMatchFileSnapshot('../../locales/en/settings.json');
    });

    it('locales/en/main.json', async () => {
        await expect(main).toMatchFileSnapshot('../../locales/en/main.json');
    });

    it('locales/en/commands.json', async () => {
        await expect(commands).toMatchFileSnapshot('../../locales/en/commands.json');
    });

    it('docs/SETTINGS.md', async () => {
        await expect(docs).toMatchFileSnapshot('../../docs/SETTINGS.md');
    });

    it('holds only text vue-i18n shows as written, under keys it resolves', () => {
        const keys: string[] = [];
        const texts: string[] = [];
        const walk = (value: unknown): void => {
            if (typeof value === 'string') {
                texts.push(value);
                return;
            }
            for (const [k, v] of Object.entries(value as object)) {
                keys.push(k);
                walk(v);
            }
        };
        walk({ settings: JSON.parse(settings), commands: JSON.parse(commands), ...JSON.parse(main) });
        // Both frontends compile each locale string as a vue-i18n message, whose syntax uses these (escapeI18nMessage, 1.57.1 formatUtil.ts).
        for (const text of texts) expect(text).not.toMatch(/[@${}|%\\]/);
        // vue-i18n's path parser splits a key at these, or gives up on it.
        for (const k of keys) expect(k).not.toMatch(/[.[\]'"\t\n\r\u00a0\ufeff\u2028\u2029]/);
    });
});
