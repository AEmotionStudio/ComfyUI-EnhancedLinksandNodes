/**
 * Settings Registration — registers all settings with ComfyUI's addSetting()
 * so that getSettingValue/setSettingValue work correctly.
 *
 * This is required because ComfyUI silently drops get/set calls for
 * unregistered settings. The sidebar provides the visible UI; this
 * module only needs to make sure the backing store knows about each key.
 *
 * @module ui/register-settings
 */

import { app } from '/scripts/app.js';

import { LINK_DEFAULTS, NODE_DEFAULTS } from '@/core/config';
import {
    LINK_ANIMATION_OPTIONS,
    LINK_STYLE_OPTIONS,
    MARKER_SHAPE_OPTIONS,
    NODE_ANIMATION_OPTIONS,
    COLOR_SCHEME_OPTIONS,
    COLOR_MODE_OPTIONS,
    QUALITY_OPTIONS,
    DIRECTION_OPTIONS,
} from '@/ui/settings';

// =============================================================================
// Setting type inference
// =============================================================================

type SettingType = 'combo' | 'slider' | 'boolean' | 'color' | 'text';

/** Infer the ComfyUI setting type from a default value */
function inferType(value: unknown): SettingType {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'string') {
        if (value.startsWith('#')) return 'color';
        return 'combo';
    }
    return 'slider';
}

/** Map setting keys to their option lists where applicable */
const OPTION_MAP: Record<string, ReadonlyArray<{ value: unknown; text: string }>> = {
    '🔗 Enhanced Links.Animate': LINK_ANIMATION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Link.Style': LINK_STYLE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Marker.Shape': MARKER_SHAPE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Quality': QUALITY_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Direction': DIRECTION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Color.Mode': COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Color.Scheme': COLOR_SCHEME_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '🔗 Enhanced Links.Marker.Color.Mode': COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '📦 Enhanced Nodes.Animate': NODE_ANIMATION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '📦 Enhanced Nodes.Quality': QUALITY_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '📦 Enhanced Nodes.Direction': DIRECTION_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '📦 Enhanced Nodes.Color.Mode': COLOR_MODE_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
    '📦 Enhanced Nodes.Color.Scheme': COLOR_SCHEME_OPTIONS as unknown as Array<{ value: unknown; text: string }>,
};

// =============================================================================
// Registration
// =============================================================================

let registered = false;

/**
 * Register all link + node settings with ComfyUI.
 *
 * Each setting uses `category: ['Enhanced Links & Nodes']` and is hidden
 * from the native ComfyUI settings dialog by using type `hidden` so
 * that the sidebar is the only visible UI.
 *
 * NOTE: We register with the real type (combo/slider/boolean) rather
 * than 'hidden' so that ComfyUI properly serialises and deserialises
 * the values. The settings will appear in the ComfyUI dialog too,
 * but that's acceptable — users can use either UI.
 */
export function registerAllSettings(): void {
    if (registered) return;
    registered = true;

    const allDefaults: Record<string, unknown> = {
        ...LINK_DEFAULTS,
        ...NODE_DEFAULTS,
    };

    for (const [id, defaultValue] of Object.entries(allDefaults)) {
        // Skip the info panel entries — they're not real settings
        if (id.includes('UI & Æmotion Studio About')) continue;

        const type = inferType(defaultValue);
        const options = OPTION_MAP[id];

        try {
            if (type === 'boolean') {
                app.ui.settings.addSetting({
                    id,
                    name: id,
                    type: 'boolean',
                    defaultValue: defaultValue as boolean,
                    category: ['Enhanced Links & Nodes'],
                });
            } else if (options) {
                app.ui.settings.addSetting({
                    id,
                    name: id,
                    type: 'combo',
                    options: options as Array<{ value: unknown; text: string }>,
                    defaultValue,
                    category: ['Enhanced Links & Nodes'],
                });
            } else if (type === 'color') {
                app.ui.settings.addSetting({
                    id,
                    name: id,
                    type: 'color',
                    defaultValue: defaultValue as string,
                    category: ['Enhanced Links & Nodes'],
                });
            } else {
                // Numeric slider — we don't know the exact min/max/step
                // so use generous ranges. The sidebar provides the precise UI.
                app.ui.settings.addSetting({
                    id,
                    name: id,
                    type: 'slider',
                    defaultValue: defaultValue as number,
                    attrs: {
                        min: 0,
                        max: 20,
                        step: 0.1,
                    },
                    category: ['Enhanced Links & Nodes'],
                });
            }
        } catch (e) {
            console.warn(`[EnhancedLinks] Failed to register setting: ${id}`, e);
        }
    }

    console.log(`[EnhancedLinks] Registered ${Object.keys(allDefaults).length} settings`);
}
