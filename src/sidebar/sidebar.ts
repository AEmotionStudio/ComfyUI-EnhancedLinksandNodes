/**
 * ComfyUI Enhanced Links & Nodes — Sidebar Entry Point
 *
 * Registers the sidebar tab with ComfyUI's extension manager.
 *
 * @module sidebar/sidebar
 */

import { app } from '/scripts/app.js';

import { renderSettingsPanel } from './SidebarSettings';
import sidebarCSS from './sidebar.css?inline';

// =============================================================================
// Sidebar Icon
// =============================================================================

/** Link/chain icon SVG for the sidebar tab */
const SIDEBAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

// =============================================================================
// CSS Injection
// =============================================================================

let cssInjected = false;

function injectStyles(): void {
    if (cssInjected) return;

    const style = document.createElement('style');
    style.id = 'enhanced-links-sidebar-styles';
    style.textContent = sidebarCSS;
    document.head.appendChild(style);

    cssInjected = true;
}

// =============================================================================
// Sidebar Rendering
// =============================================================================

let sidebarRegistered = false;

/**
 * Render the sidebar content into the given container element.
 */
function renderSidebar(container: HTMLElement): void {
    // Prevent duplicate renders
    if (container.querySelector('.enh-sidebar')) {
        return;
    }

    container.innerHTML = '';

    // Main container
    const sidebar = document.createElement('div');
    sidebar.className = 'enh-sidebar';

    // Header
    const header = document.createElement('div');
    header.className = 'enh-sidebar-header';
    header.innerHTML = `${SIDEBAR_ICON}<h2>Enhanced Links & Nodes</h2>`;
    sidebar.appendChild(header);

    // Content area
    const content = document.createElement('div');
    content.className = 'enh-sidebar-content';

    // Render all settings panels
    renderSettingsPanel(content);

    sidebar.appendChild(content);
    container.appendChild(sidebar);
}

// =============================================================================
// Registration
// =============================================================================

/**
 * Register the sidebar tab with ComfyUI.
 */
function registerSidebar(): void {
    if (sidebarRegistered) return;

    if (!app.extensionManager) {
        console.warn('[EnhancedLinks] extensionManager not available, sidebar registration skipped');
        return;
    }

    try {
        // Inject CSS before rendering
        injectStyles();

        app.extensionManager.registerSidebarTab({
            id: 'enhanced-links-nodes',
            icon: 'pi pi-link',
            title: 'Enhanced',
            tooltip: 'Enhanced Links & Nodes Settings',
            type: 'custom',
            render: (el: HTMLElement) => {
                renderSidebar(el);
            },
        });

        sidebarRegistered = true;
        console.log('[EnhancedLinks] Sidebar registered');
    } catch (e) {
        console.warn('[EnhancedLinks] Failed to register sidebar:', e);
    }
}

/**
 * Initialize the sidebar (called after app setup).
 * Uses a short delay to ensure extensionManager is ready.
 */
export function initSidebar(): void {
    setTimeout(() => {
        registerSidebar();
    }, 100);
}
