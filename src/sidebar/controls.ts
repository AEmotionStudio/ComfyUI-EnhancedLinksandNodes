/**
 * Reusable UI controls for the sidebar settings panel.
 * Creates slider, toggle, select, and color picker elements
 * with live preview and persistence support.
 *
 * @module sidebar/controls
 */

// =============================================================================
// Icons
// =============================================================================

const Icons = {
    chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
};

// =============================================================================
// Slider Control
// =============================================================================

/**
 * Creates a slider control with label, value display, and live preview:
 * onInput gets every step of a drag, onChange the value where it ends.
 */
export function createSlider(
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
    onInput: (value: number) => void,
    onChange: (value: number) => void,
    tooltip?: string
): HTMLElement {
    const row = document.createElement('div');
    row.className = 'enh-control-row';
    if (tooltip) row.title = tooltip;

    const sliderId = `enh-slider-${Math.random().toString(36).substr(2, 9)}`;

    const labelRow = document.createElement('div');
    labelRow.className = 'enh-control-label-row';

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = sliderId;

    const valueEl = document.createElement('span');
    valueEl.className = 'enh-control-value';
    valueEl.textContent = `${value}${unit}`;

    labelRow.appendChild(labelEl);
    labelRow.appendChild(valueEl);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = sliderId;
    slider.className = 'enh-slider';
    slider.min = String(min);
    slider.max = String(max);
    slider.step = String(step);
    slider.value = String(value);
    slider.setAttribute('aria-valuetext', `${value}${unit}`);

    // Prevent ComfyUI from capturing mouse events during drag
    slider.addEventListener('mousedown', (e) => e.stopPropagation());
    slider.addEventListener('touchstart', (e) => e.stopPropagation());
    slider.addEventListener('pointerdown', (e) => e.stopPropagation());

    slider.addEventListener('input', (e) => {
        e.stopPropagation();
        const newValue = parseFloat(slider.value);
        valueEl.textContent = `${newValue}${unit}`;
        slider.setAttribute('aria-valuetext', `${newValue}${unit}`);
        // Live preview — apply immediately
        onInput(newValue);
    });

    slider.addEventListener('change', () => onChange(parseFloat(slider.value)));

    row.appendChild(labelRow);
    row.appendChild(slider);

    return row;
}

// =============================================================================
// Toggle Control
// =============================================================================

/**
 * Creates a toggle switch with label.
 */
export function createToggle(
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    tooltip?: string
): HTMLElement {
    const row = document.createElement('div');
    row.className = 'enh-toggle-row';
    if (tooltip) row.title = tooltip;

    const toggleId = `enh-toggle-${Math.random().toString(36).substr(2, 9)}`;
    const labelId = `${toggleId}-label`;

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.id = labelId;
    labelEl.style.cursor = 'pointer';

    const toggle = document.createElement('div');
    toggle.className = `enh-toggle${checked ? ' active' : ''}`;
    toggle.id = toggleId;
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', String(checked));
    toggle.setAttribute('aria-labelledby', labelId);
    toggle.tabIndex = 0;

    const handleToggle = (e?: Event) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const isActive = toggle.classList.toggle('active');
        toggle.setAttribute('aria-checked', String(isActive));
        onChange(isActive);
    };

    toggle.addEventListener('click', handleToggle);
    labelEl.addEventListener('click', handleToggle);

    toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleToggle(e);
        }
    });

    row.appendChild(labelEl);
    row.appendChild(toggle);

    return row;
}

// =============================================================================
// Select Control
// =============================================================================

/** Option with value and display text */
export interface SelectOption {
    value: unknown;
    text: string;
}

/**
 * Creates a select dropdown from { value, text } options.
 */
export function createSelect(
    label: string,
    currentValue: unknown,
    options: readonly SelectOption[] | SelectOption[],
    onChange: (value: unknown) => void,
    tooltip?: string
): HTMLElement {
    const row = document.createElement('div');
    row.className = 'enh-control-row';
    if (tooltip) row.title = tooltip;

    const selectId = `enh-select-${Math.random().toString(36).substr(2, 9)}`;

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = selectId;

    const select = document.createElement('select');
    select.id = selectId;
    select.className = 'enh-select';

    // Prevent ComfyUI event capturing
    select.addEventListener('mousedown', (e) => e.stopPropagation());
    select.addEventListener('pointerdown', (e) => e.stopPropagation());

    (options as SelectOption[]).forEach((opt) => {
        const option = document.createElement('option');
        option.value = String(opt.value);
        option.textContent = opt.text;
        // eslint-disable-next-line eqeqeq
        if (String(opt.value) == String(currentValue)) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener('change', () => {
        // Parse back to the original type
        const rawValue = select.value;
        // Try to get the original typed value from the options array
        const matchedOpt = (options as SelectOption[]).find(
            (o) => String(o.value) === rawValue
        );
        onChange(matchedOpt ? matchedOpt.value : rawValue);
    });

    row.appendChild(labelEl);
    row.appendChild(select);

    return row;
}

// =============================================================================
// Color Picker Control
// =============================================================================

/**
 * Creates a color picker with hex text input. onInput gets each colour the
 * picker passes through, onChange the one it closes on and each valid hex code.
 */
export function createColorPicker(
    label: string,
    value: string,
    onInput: (value: string) => void,
    onChange: (value: string) => void,
    tooltip?: string
): HTMLElement {
    const row = document.createElement('div');
    row.className = 'enh-control-row enh-color-row';
    if (tooltip) row.title = tooltip;

    const colorId = `enh-color-${Math.random().toString(36).substr(2, 9)}`;

    const labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.htmlFor = colorId;

    const colorWrapper = document.createElement('div');
    colorWrapper.className = 'enh-color-wrapper';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.id = colorId;
    colorInput.className = 'enh-color-input';
    colorInput.value = value;

    const colorPreview = document.createElement('input');
    colorPreview.type = 'text';
    colorPreview.className = 'enh-color-preview';
    colorPreview.value = value;
    colorPreview.maxLength = 7;
    colorPreview.setAttribute('aria-label', `Hex code for ${label}`);

    // Prevent ComfyUI hotkey capture while typing
    colorPreview.addEventListener('keydown', (e) => e.stopPropagation());
    colorPreview.addEventListener('focus', () => colorPreview.select());

    const updateFromText = () => {
        let val = colorPreview.value;
        if (!val.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(val)) {
            val = '#' + val;
        }

        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            colorPreview.value = val;
            colorInput.value = val;
            onChange(val);
        } else {
            colorPreview.value = colorInput.value;
        }
    };

    colorPreview.addEventListener('change', updateFromText);

    colorInput.addEventListener('input', () => {
        colorPreview.value = colorInput.value;
        onInput(colorInput.value);
    });
    colorInput.addEventListener('change', () => onChange(colorInput.value));

    colorWrapper.appendChild(colorInput);
    colorWrapper.appendChild(colorPreview);

    row.appendChild(labelEl);
    row.appendChild(colorWrapper);

    return row;
}

// =============================================================================
// Collapsible Section
// =============================================================================

/**
 * Creates a collapsible section with header and body.
 */
export function createSection(
    title: string,
    defaultCollapsed: boolean = true
): { section: HTMLElement; body: HTMLElement } {
    const section = document.createElement('div');
    section.className = 'enh-sidebar-section';

    const collapsed = defaultCollapsed;

    const header = document.createElement('div');
    header.className = `enh-sidebar-section-header${collapsed ? ' collapsed' : ''}`;

    const sectionId = `enh-section-${Math.random().toString(36).substr(2, 9)}`;
    const bodyId = `${sectionId}-body`;

    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', String(!collapsed));
    header.setAttribute('aria-controls', bodyId);

    // Icon + title
    header.innerHTML = Icons.chevronDown;
    const titleSpan = document.createElement('span');
    titleSpan.textContent = title;
    header.appendChild(titleSpan);

    const body = document.createElement('div');
    body.className = `enh-sidebar-section-body${collapsed ? ' collapsed' : ''}`;
    body.id = bodyId;
    body.setAttribute('role', 'region');

    if (collapsed) {
        body.style.display = 'none';
    }

    const toggleSection = () => {
        const isCollapsed = header.classList.toggle('collapsed');
        body.classList.toggle('collapsed');
        body.style.display = isCollapsed ? 'none' : '';
        header.setAttribute('aria-expanded', String(!isCollapsed));
    };

    header.addEventListener('click', toggleSection);
    header.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSection();
        }
    });

    section.appendChild(header);
    section.appendChild(body);

    return { section, body };
}
