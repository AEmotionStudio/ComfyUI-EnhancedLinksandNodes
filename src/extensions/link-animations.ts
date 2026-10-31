/// <reference path="../comfy.d.ts" />
/**
 * ComfyUI Enhanced Link Animations Extension
 *
 * Registers the link settings. setup() starts the engine, the link pipeline
 * (links/pipeline.ts) on ComfyUI's own link pass, and the sidebar.
 *
 * @module extensions/link-animations
 */

import type { ComfyExtension } from '@comfyorg/comfyui-frontend-types';
import { app } from '/scripts/app.js';
import { linkSettings } from '@/core/settings';
import { install } from '@/core/engine';
import { installLinks } from '@/links/pipeline';
import { initSidebar } from '@/sidebar/sidebar';

const ext: ComfyExtension = {
    name: 'enhanced.link.animations',
    settings: linkSettings,

    async setup() {
        install();
        initSidebar();
        installLinks();

        console.log('[EnhancedLinks] Extension registered with full batched rendering pipeline.');
    },
};

app.registerExtension(ext);
