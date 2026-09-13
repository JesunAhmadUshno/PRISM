# PRISM Component Specifications

**Owner:** UI and visual design
**Version:** 1.0.0
**Date:** 2026-09-13
**Depends on:** `docs/design/ui/tokens.css`, `docs/design/ui/DESIGN_SYSTEM.md`

---

## 0. How to read this document

Each component has the same six parts.

1. **Purpose.** One sentence. If a component cannot be described in one sentence it is two components.
2. **Anatomy.** The parts, named.
3. **States.** A table covering the full matrix. Every interactive component must specify all nine.
4. **Tokens.** Which tokens, with the measured contrast ratio for any pair that carries text or state.
5. **Accessibility contract.** Roles, names, keyboard, live regions. Non-negotiable.
6. **Current implementation.** What exists in `src/` today and what is wrong with it, with file and line.

Contrast ratios quoted here are measured with the method in `DESIGN_SYSTEM.md` section 1.3. A ratio is a fact about one pair of colours. It is not a conformance claim about the product.

### 0.1 The nine states

Every interactive component specifies all nine. A component that "does not have" one of these has an unhandled case, not an absent state.

| State | Meaning | The question it answers |
|---|---|---|
| **Default** | resting, available | what is this |
| **Hover** | pointer over it | is this interactive |
| **Focus** | keyboard focus | where am I |
| **Active** | being pressed | did my press register |
| **Selected** | persistently chosen | which one is on |
| **Disabled** | present but unavailable | why can I not use this |
| **Loading** | work in progress | is it working, and for how long |
| **Error** | the operation failed | what went wrong and what do I do |
| **Empty** | nothing to show yet | is this broken or just new |

### 0.2 Four rules that apply to every component

**R1. State is never carried by colour alone.** Every state change carries a second signal: a shape, an icon, a border weight, a label, or a position. This is SC 1.4.1, and in Windows forced-colors mode it is the only thing that works.

**R2. Focus is always `--prism-focus-ring`.** No component overrides it, narrows it, or removes it. The ring is two-tone precisely so that no component ever needs to.

**R3. Every asynchronous state is announced.** Loading, success and error each reach a live region. A spinner that only spins does not exist for a screen-reader user.

**R4. Disabled controls stay readable.** Never `opacity` on a whole control. Floor of 5.17:1 light and 5.75:1 dark on the label, measured in `DESIGN_SYSTEM.md` section 4.2.

---

## 1. Button

### 1.1 Purpose

Performs an action. A control that navigates is a Link, not a Button.

### 1.2 Anatomy

`[ leading icon ] label [ trailing icon ]` inside a container with a 44px minimum block size, `--prism-radius-md`, and horizontal padding of `--prism-space-5`.

Icon is `1.25em`, sized in `em` so it scales with the A / A+ / A++ control. It is `aria-hidden` unless it is the only content.

### 1.3 Variants

| Variant | Fill | Label | Border | Use |
|---|---|---|---|---|
| Primary | `accent-solid` | `text-on-accent` | none | one per view, the action the user came for |
| Secondary | `surface-sunken` | `text` | `border` | everything else |
| Ghost | transparent | `text-secondary` | none | tertiary, dense toolbars |
| Danger | `danger-solid` | `text-on-solid` | none | destructive and irreversible only |

### 1.4 States

| State | Primary | Secondary | Ghost | Danger |
|---|---|---|---|---|
| Default | fill `accent-solid`, label **7.56** light / **8.74** dark | fill `surface-sunken`, label **16.30** light | label **9.45** light | fill `danger-solid`, label **8.31** light / **9.86** dark |
| Hover | fill `accent-solid-hover`, label **9.46** light / **11.23** dark | fill steps to `surface`, border to `border-strong` | background `surface-sunken` | one step darker fill |
| Focus | `--prism-focus-ring`, worst measured case **7.56** against any fill in the system | same | same | same |
| Active | `accent-solid-active`; translate `1px` on the block axis; no scale | same pattern | same | same |
| Selected | not applicable. A button that stays on is a Toggle. | | | |
| Disabled | fill `surface-sunken`, label `text-disabled` **5.17** floor, border `border` **3.68** floor, `cursor: not-allowed`, `aria-disabled="true"` | same | same | same |
| Loading | label is replaced by the operation in progress ("Analysing..."), spinner as a leading icon, `aria-busy="true"`, width held at the default-state width so the layout does not jump | same | same | same |
| Error | the button does not hold error state. It returns to Default; the error goes to an Alert or an inline field message, which owns the recovery action. | | | |
| Empty | not applicable | | | |

### 1.5 Why `active:scale-95` is removed

`.btn` currently applies `active:scale-95`. On a 44px control that is a 2.2px shrink on each edge, which reads as the button moving away from the pointer at the moment of contact, and it is a transform that reduced-motion users cannot opt out of because it is instantaneous rather than animated. A 1px downward translation communicates the press without resizing the target.

### 1.6 Accessibility contract

- A real `<button type="button">`. Never a `div` with a click handler.
- Accessible name from the visible label. Icon-only buttons take `aria-label` and are specified in section 2.
- When loading: `aria-busy="true"`, and the changed label is itself the announcement. Do not add a separate live region for something the label already says.
- Prefer `aria-disabled="true"` over the `disabled` attribute wherever the user might reasonably want to know *why* the control is off. `disabled` removes the element from the tab order, so the explanation becomes unreachable by keyboard.

### 1.7 Current implementation

`src/styles/index.css:190-215`.

| Issue | Evidence |
|---|---|
| `.btn-primary` label contrast varies across the button's own width, 3.66:1 at the left edge to 6.37:1 at the right | `--gradient-primary` is `linear-gradient(135deg,#667eea,#764ba2)` |
| `disabled:opacity-50` puts the label at 2.04:1 | composited measurement |
| `active:scale-95` | see 1.5 |
| Focus ring `ring-prism-500` measures 1.32:1 against the button's own fill | `DESIGN_SYSTEM.md` D1 |
| No loading variant exists; callers hand-roll it, for example `Analyzing...` at `DatasetManager.tsx:487` and `Running...` at `AnalyticsWorkspace.tsx:1362` | inconsistent between call sites |

---

## 2. Icon button

### 2.1 Purpose

A button whose entire content is an icon. Used for theme toggle, remove, close.

### 2.2 Spec

44x44px minimum, square, `--prism-radius-md`. Icon at `1.25em` centred.

| State | Treatment |
|---|---|
| Default | transparent fill, icon `text-secondary` **9.45** light / **11.47** dark |
| Hover | fill `surface-sunken`, icon `text` |
| Focus | `--prism-focus-ring` |
| Active | fill one step darker, 1px block translation |
| Disabled | icon `text-disabled` **5.17** floor, `aria-disabled="true"` |
| Loading | icon replaced by spinner, `aria-busy="true"` |
| Destructive hover | fill `danger-bg`, icon `danger-text` **9.16** light / **12.09** dark |

### 2.3 Accessibility contract

- `aria-label` is mandatory and must name the action and its object: `"Remove dataset sales_q3.csv"`, not `"Remove"`.
- A toggle uses `aria-pressed`, not a swapped label. The theme control in `App.tsx` swaps both the icon and the `aria-label`, which works, but `aria-pressed` is the more standard contract.

### 2.4 Current implementation, one specific bug

`DatasetManager.tsx:100` and `:329`:

```
opacity-0 group-hover:opacity-100
```

The remove button is **invisible until the row is hovered**. It is still in the tab order, so a keyboard user can focus a control they cannot see, and there is no `group-focus-within` companion rule to reveal it. A pointer user on a touch device, where there is no hover, cannot discover it at all.

Fix: render it at `text-tertiary` (**7.68** floor light, **8.13** dark) at all times, and raise it to `text` on hover or focus-within. Discoverability is not a hover affordance.

---

## 3. Link

### 3.1 Spec

| State | Treatment | Measured |
|---|---|---|
| Default | `accent-text`, underlined, `text-underline-offset: 0.2em`, thickness `max(1px, 0.06em)` | **8.63** floor light, **10.21** floor dark |
| Hover | same colour, underline thickness doubles | unchanged |
| Focus | `--prism-focus-ring` | |
| Visited | not styled. PRISM has no navigable document set. | |
| External | trailing 0.75em icon plus `rel="noopener noreferrer"` | icon inherits colour |

### 3.2 Rules

- Underline is permanent. It is the second channel for anyone who cannot distinguish the accent from body text.
- Inline links are exempt from the 44px target rule (SC 2.5.5 exempts targets in a sentence). The current `src/styles/index.css:99` rule includes `a` and should not.
- A link never carries `role="button"`, and a button never looks like a link.

### 3.3 Current implementation

`src/styles/index.css:104`. `text-prism-600` measures **4.05:1** on a card, failing AA for body text. Hover (`prism-800`) measures **7.49:1**, so the link is legible only once the pointer is already on it.

---

## 4. Text input and Select

### 4.1 Anatomy

Label (always visible, never a placeholder), optional help text, the control, optional error message. Help text is bound with `aria-describedby`. Error message is bound the same way and additionally sets `aria-invalid="true"`.

### 4.2 States

| State | Border | Fill | Label | Measured |
|---|---|---|---|---|
| Default | `border` 1px | `surface` | `text-secondary` | border **3.68** floor light, **3.45** dark |
| Hover | `border-strong` 1px | `surface` | unchanged | **6.92** light |
| Focus | `border-strong` 2px plus `--prism-focus-ring` | `surface` | unchanged | ring worst case **7.56** |
| Filled | `border` 1px | `surface` | value in `text` | **17.85** light |
| Disabled | `border` 1px | `surface-sunken` | `text-disabled` | **5.17** floor |
| Read-only | no border, `surface-sunken` fill, value in `text` | | | **16.30** light |
| Error | `danger-edge` 2px plus a message with an icon | `danger-bg` | message in `danger-text` | **9.16** light, **12.09** dark |
| Loading | `aria-busy` on the field group, spinner in the trailing slot, field stays interactive if it can be | | | |
| Empty | placeholder in `text-disabled` | | | **5.17** floor |

### 4.3 Placeholders

A placeholder is a hint, never a label. It disappears the moment the user types, which removes the only remaining description of the field from the screen. Every input in PRISM has a persistent visible `<label>`.

The current `.input` uses `placeholder-slate-400`, measured at **2.56:1** on white, which fails AA even for a hint.

### 4.4 Error message pattern

```
[icon]  Column "revenue" contains 412 non numeric values.
        Choose a numeric column or apply "Encode Categorical" first.
```

Two sentences: what happened, what to do. Never "Invalid input". The recovery sentence is the part the user actually needs, and it is the part that is missing everywhere in the current build.

### 4.5 Current implementation

`src/styles/index.css:218`. The `.input` class has no error state, no disabled state and no read-only state. `DatasetManager.tsx:199` and `:217` set the `disabled` attribute on two selects with no corresponding visual treatment, so a disabled select is indistinguishable from an enabled empty one.

---

## 5. Checkbox and Radio

Used heavily in `AnalyticsWorkspace` for column selection, preprocessing selection and test selection.

| State | Treatment | Measured |
|---|---|---|
| Default | 24px box, `border` 2px, `surface` fill | border **3.68** floor |
| Hover | `border-strong`, row background `surface-sunken` | **6.92** light |
| Focus | `--prism-focus-ring` on the box, not the row | |
| Checked | `accent-solid` fill, `text-on-accent` glyph | glyph **7.56** light, **8.74** dark |
| Checked and hovered | `accent-solid-hover` | **9.46** light |
| Indeterminate | `accent-solid` fill, dash glyph | same |
| Disabled | `surface-sunken` fill, `border` border, label `text-disabled` | label **5.17** floor |
| Error | `danger-edge` 2px border plus a group-level message | **7.60** light |

### 5.1 Rules

- The box is 24px, meeting `--prism-target-min`. The **row** is the click target and is 44px tall, meeting `--prism-target`. A `<label>` wrapping both gives this for free.
- Selection count is always shown as text near the group: `"3 of 14 columns selected"`. `AnalyticsWorkspace.tsx:991` disables the run button on `selectedColumns.length === 0`, so the count is the thing that explains why.
- A group of checkboxes lives in a `<fieldset>` with a `<legend>`. Not a `div` with a heading.

---

## 6. Dropzone

The most important component in the product. It is the first thing a user touches and the only place where a wrong action costs them time.

### 6.1 Anatomy

Region (min-height 280px) containing: state icon, primary label, secondary instruction, format chips, and a separate "Select file" button below the region.

### 6.2 States

All nine, because this component genuinely has all nine.

| State | Border | Fill | Icon | Primary label |
|---|---|---|---|---|
| Default | `border-strong` 2px dashed | `surface` | upload, `text-tertiary` | "Drag and drop your data file" |
| Hover | `accent-edge` 2px dashed | `accent-subtle` | upload, `accent-text` | unchanged |
| Focus | `--prism-focus-ring` plus the hover border | `surface` | unchanged | unchanged |
| Drag active | `accent-edge` 2px solid | `accent-subtle` | download-into-tray | "Drop to analyse" |
| Drag accept | `success-edge` 2px solid | `success-bg` | check in a circle | "Release to analyse **sales.csv**" |
| Drag reject | `danger-edge` 2px solid | `danger-bg` | cross in a circle | "**.docx** is not supported" |
| Disabled | `border` 2px dashed | `surface-sunken` | upload, `text-disabled` | "Finish the current analysis first" |
| Loading | `border` 2px solid | `surface-sunken` | spinner | "Parsing sales.csv" plus a determinate progress bar |
| Error | `danger-edge` 2px solid | `surface` | cross | Alert below the zone, with a retry action |

### 6.3 Measured ratios for the state borders

| State | Border | On its own fill | 3:1 |
|---|---|---|---|
| Default | `#475569` on `#ffffff` | **7.58** | pass |
| Drag active | `#075985` on `#e0f2fe` | **6.59** | pass |
| Drag accept | `#065f46` on `#ecfdf5` | **7.29** | pass |
| Drag reject | `#991b1b` on `#fef2f2` | **7.60** | pass |
| Disabled | `#767f8f` on `#f1f5f9` | **3.68** | pass |

Compare the current build, measured in `DESIGN_SYSTEM.md` section 2.2: **1.23**, **2.01**, **1.82**, **2.53**, **1.23**. Every state boundary on the product's front door currently fails 3:1.

### 6.4 Accessibility contract

- `role="button"`, `tabIndex={0}`, and an accessible name from the primary label via `aria-labelledby`. Already correct in `FileUploader.tsx:159-163`.
- Enter and Space open the file picker. Already correct via `react-dropzone`.
- Every state transition reaches `role="status" aria-live="polite"`. Already present at `FileUploader.tsx:241`.
- The accepted format list is bound with `aria-describedby` and states the real maximum size.
- **Do not remove the separate "Select file" button.** A drop target is a discoverability problem for anyone who has never dragged a file, and the button is the accessible fallback.

### 6.5 Current implementation, three specific defects

`src/components/core/FileUploader/FileUploader.tsx`.

**Defect 1, the ratios above.** Every state border fails 3:1. Mitigating fact worth recording: the icon and the label both change with the state (lines 145 and 181), so SC 1.4.1 Use of Color is satisfied even though SC 1.4.11 is not. The state is perceivable, the boundary is not.

**Defect 2, the stated size limit is wrong.** Line 214 renders `Max {MAX_FILE_SIZE / (1024 * 1024)}MB` from `src/security/validator.ts`, where `MAX_FILE_SIZE = 500 * 1024 * 1024` sits directly under a doc comment saying 50MB. The user is told 500MB. Nothing in the product has been measured at that size, and `SCALING_LIMITS.md` says so. Until a real ceiling is measured, the UI should state the enforced limit and nothing more, and should not imply that a file at the limit will succeed.

**Defect 3, the loading state is not a loading state.** Lines 120 and 185 set `disabled` and change the label to "Processing your data..." with no progress, no percentage and no cancel. The progress bar exists but lives in `App.tsx` as a sibling, so the zone the user is looking at reports nothing. Progress belongs inside the zone.

---

## 7. Surface and Card

### 7.1 Spec

| Level | Fill | Border | Elevation | Radius | Use |
|---|---|---|---|---|---|
| Flat | `surface` | `border-subtle` | none | `lg` | in-flow grouping |
| Card | `surface` | `border` | `card` | `lg` | the default panel |
| Interactive card | `surface` | `border` | `card`, `raised` on hover | `lg` | dataset card, insight card |
| Popover | `surface-overlay` | `border` | `popover` | `md` | menu, tooltip |
| Modal | `surface-overlay` | `border-strong` | `modal` | `xl` | dialog |

Padding: `--prism-space-6` for a card, `--prism-space-4` in dense contexts.

### 7.2 Rules

- Every elevated surface has a border **and** a shadow. In forced-colors mode the shadow is dropped and the border is the only thing keeping the card from dissolving into the page.
- A card is never nested inside a card. Nesting means the inner thing should be a section with a heading.
- An interactive card gets `--prism-focus-ring` on the whole card, and exactly one primary action inside it. Two interactive things inside one clickable card is an ambiguous target.

### 7.3 Current implementation

`.glass-card` at `src/styles/index.css:155` is `rgba(255,255,255,0.7)` plus `backdrop-filter: blur(16px)` plus a `rgba(255,255,255,0.4)` border. Three consequences.

The border is invisible on a light background, so the card edge is carried entirely by the shadow, which is dropped in forced-colors mode.

Text contrast on the card is a function of what is behind it: `slate-500` measures **4.71:1** over the plain mesh and **4.32:1** over a gradient hotspot.

`.card` at line 165 uses `shadow-xl`, which is modal-level geometry on a resting card. Elevation has stopped encoding distance.

---

## 8. Badge and Chip

### 8.1 Spec

Small, `--prism-radius-full`, `--prism-text-100` (14px), medium weight, padded `--prism-space-1` by `--prism-space-3`.

| Variant | Fill | Text | Measured light | Measured dark |
|---|---|---|---|---|
| Neutral | `surface-sunken` | `text-secondary` | **9.45** | **11.47** |
| Accent | `accent-subtle` | `accent-text` | **8.24** | **8.33** |
| Success | `success-bg` | `success-text` | **9.23** | **12.00** |
| Warning | `warning-bg` | `warning-text` | **8.75** | **13.18** |
| Danger | `danger-bg` | `danger-text` | **9.16** | **12.09** |

The current `.badge-*` set measures 4.51 to 5.30 (`DESIGN_SYSTEM.md` D7), with `badge-warning` clearing 4.5:1 by 0.01.

### 8.2 Chip with a remove action

A chip carrying a removable value (a selected column, a dataset link) has a 24px remove target inside a 44px chip. The remove control takes its own `aria-label` naming the value.

### 8.3 Rule

A badge is never interactive unless it is a chip with a remove action or a filter toggle. If it is clickable it needs a focus ring, a hover state and a 44px target, at which point it is a Button and should look like one.

---

## 9. Alert and Callout

### 9.1 Anatomy

`[edge bar 4px] [icon] [title] [body] [action]`, `--prism-radius-lg`, padded `--prism-space-4`.

### 9.2 Spec

| Variant | Edge | Fill | Text | Icon shape | Measured text on fill |
|---|---|---|---|---|---|
| Info | `info-edge` | `info-bg` | `info-text` | `i` in a circle | **9.52** light, **11.25** dark |
| Success | `success-edge` | `success-bg` | `success-text` | check in a circle | **9.23** light, **12.00** dark |
| Warning | `warning-edge` | `warning-bg` | `warning-text` | `!` in a triangle | **8.75** light, **13.18** dark |
| Danger | `danger-edge` | `danger-bg` | `danger-text` | `!` in an octagon | **9.16** light, **12.09** dark |

Each edge clears 7:1 against its own fill (see `DESIGN_SYSTEM.md` section 6).

### 9.3 Why the icon shapes differ

Circle, circle-with-check, triangle, octagon. Four distinguishable silhouettes. In forced-colors mode every one of these alerts is `CanvasText` on `Canvas`, and the shape is the only thing left that says which is which.

### 9.4 The tint is not the region

`info-bg` `#eff6ff` against the light canvas `#f8fafc` measures **1.10:1**. The alert is not visible as a distinct region from its fill. The 4px edge bar is what defines it, which is why it is mandatory rather than decorative.

### 9.5 Error alerts carry the recovery action

Every danger alert ends with a control. `App.tsx` already does this correctly with "Try again with a different file", gated on `error.recoverable`. That pattern should be the rule, not the exception.

### 9.6 Accessibility contract

- Danger and warning: `role="alert"`, which implies `aria-live="assertive"`.
- Info and success: `role="status"`, which implies `aria-live="polite"`.
- The container is present in the DOM before the message arrives. A live region inserted at the same moment as its content is frequently not announced.
- The icon is `aria-hidden`. The severity is in the title text, so a screen reader user is not told "triangle".

### 9.7 Current implementation

`src/styles/index.css:250-268` defines all four correctly in structure. `alert-warning` measures **6.84:1**, just under 7. The real gap is that most error paths in `AnalyticsWorkspace` do not use these classes at all: lines 1034, 1192 and 1393 hand-roll a `bg-red-50 dark:bg-red-900/20` box with `text-red-600` body copy measuring **4.41:1**, and none of them carries a recovery action.

---

## 10. Tabs

Used in three places: analysis mode, results view, and the six-tab `AnalyticsWorkspace`.

### 10.1 Spec

| State | Treatment | Measured |
|---|---|---|
| Default | transparent, label `text-secondary`, 44px min height | **9.45** light, **11.47** dark |
| Hover | `surface-sunken` fill, label `text` | **16.30** light |
| Focus | `--prism-focus-ring` | worst case **7.56** |
| Selected | `accent-solid` fill, label `text-on-accent`, plus a 3px `accent-solid` indicator on the block-end edge | label **7.56** light, **8.74** dark |
| Disabled | label `text-disabled`, `aria-disabled="true"`, stays in the tab sequence so its tooltip is reachable | **5.17** floor |
| Loading | the panel loads, never the tab. The tab never spins. | |

### 10.2 Why the selected tab keeps an indicator bar as well as a fill

The fill alone is colour. The bar is geometry, and geometry survives forced-colors mode and greyscale.

### 10.3 Accessibility contract

- `role="tablist"` with an accessible name, `role="tab"` with `aria-selected` and `aria-controls`, `role="tabpanel"` with `aria-labelledby`.
- Roving tabindex: the selected tab is `tabIndex={0}`, the rest `tabIndex={-1}`. `AnalyticsWorkspace.tsx:232` does this.
- Arrow-key navigation is mandatory wherever a roving tabindex is used. Without it a keyboard user can reach the tablist but can only ever focus the one selected tab, and the rest are unreachable. Left and Right move focus, Home and End jump to the ends, and for an automatic tablist the selection follows focus.

### 10.4 Current implementation

The three tablists in the product are in materially different states. Verified against the tree on 2026-09-13; `src/` is under concurrent change by the engineering team, so re-check before acting on any line number here.

| Tablist | Roving tabindex | Arrow keys | `aria-controls` | `tabpanel` |
|---|---|---|---|---|
| `AnalyticsWorkspace.tsx:688-714, :732` (six tabs) | yes | **yes**, with Home and End | yes | yes |
| `App.tsx:257` analysis mode | no | **no** | yes | yes |
| `App.tsx:426` results view | no | **no** | **no** | **no** |

`AnalyticsWorkspace` is correct and has a companion test at `AnalyticsWorkspace.a11y.test.tsx:77`. It is the reference implementation, and the two tablists in `App.tsx` should be replaced by the same shared component rather than fixed in place. The results-view tablist is the worse of the two: its tabs have no `id`, no `aria-controls` and no corresponding `role="tabpanel"`, so the tab and the content it switches are not associated at all.

Colour, common to all three: the selected fill is `bg-gradient-to-r from-prism-500 to-purple-600` with a white label, measuring **2.77:1** at the left edge of the gradient and 5.38:1 at the right. The focus ring measures **1.00:1** against `prism-500`, so a keyboard user focusing the selected tab sees no ring at all.

---

## 11. Progress, determinate

### 11.1 Spec

Track 8px tall, `--prism-radius-full`, `surface-sunken` fill with a `border` 1px outline so the track is visible at 3:1. Fill is `accent-solid`.

| Element | Token | Measured |
|---|---|---|
| Track outline | `border` on `surface-sunken` | **3.68** light, **3.62** dark |
| Fill | `accent-solid` on `surface-sunken` | **6.90** light, **8.33** dark |
| Percentage text | `text-secondary` | **9.45** light |

### 11.2 Rules

- A determinate bar always has a numeric label next to it. The bar is the glanceable channel, the number is the precise one, and the number is the only one that works in a screenshot or for a low-vision user.
- The bar never animates its own fill with a looping animation. It moves when the value moves.
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and an `aria-label`. `App.tsx` already does all four correctly.

### 11.3 Current implementation

`.progress-bar` at `src/styles/index.css:284` uses a `slate-200` track measuring **1.22:1** against the card behind it, so an empty bar is invisible. The fill is `--gradient-primary`, so the bar changes colour as it fills, which reads as a change in meaning rather than a change in quantity.

---

## 12. Spinner, indeterminate

### 12.1 Spec

- 20px in a button, 24px inline, 48px for a full-panel operation.
- A 2px ring in `border` with a 2px arc in `accent-solid`. The arc measures **6.90:1** light and **8.33:1** dark against `surface-sunken`, so the moving part is perceivable, not just present.
- Rotation at `--prism-duration-spinner` (900ms), linear, infinite.

### 12.2 The mandatory paired text

**A spinner never appears alone.** Every spinner is accompanied by a text status that names the operation:

```
[spinner]  Loading scipy. First statistical test only.
[spinner]  Parsing sales_q3.xlsx
[spinner]  Computing correlations across 14 columns
```

Three reasons. Under `prefers-reduced-motion`, `tokens.css` slows the spinner to 2000ms rather than freezing it, but a very slow rotation is a weak signal and the text is the strong one. A screen-reader user gets nothing from rotation. And a user watching a Pyodide cold start needs to know that a long wait is expected rather than broken, which is information only the text can carry.

`AnalyticsWorkspace.tsx:1380` does this well: "This may take a moment for the first statistical test (loading scipy)." That is the standard for the rest.

### 12.3 Accessibility contract

- The spinner element is `aria-hidden`. The status text is inside `role="status" aria-live="polite"`.
- `aria-busy="true"` on the region being replaced, so assistive technology knows the content is stale rather than final.
- Never announce progress more than once every few seconds. A live region that fires on every percentage tick makes the product unusable with a screen reader.

### 12.4 Current implementation

Four spinner implementations exist, all slightly different: `App.tsx` (a 48px two-ring construction with `spin-slow` at 3s), and `AnalyticsWorkspace.tsx` at lines 1022 (20px, `animate-spin`), 1172 and 1376 (48px, `animate-spin`). One component, four builds. Only the `App.tsx` one has a progress percentage.

All four freeze completely under `prefers-reduced-motion` because of the global `animation-duration: 0.01ms !important` at `src/styles/index.css:56` (`DESIGN_SYSTEM.md` D9).

---

## 13. Skeleton

### 13.1 Spec

A static `surface-sunken` block at the radius of the content it stands in for. **No shimmer, no pulse, no animation.**

`.shimmer` at `src/styles/index.css:323` runs a 1.5s infinite gradient sweep. It loops indefinitely, which puts it under SC 2.2.2 with no in-page stop control, and it is the kind of continuous peripheral motion that is worst for vestibular sensitivity.

A static block already says "not yet loaded" through its shape. The movement adds nothing.

### 13.2 When to use a skeleton rather than a spinner

Skeleton when the shape of the result is known and stable (a table of a known column count, a card grid). Spinner when it is not, or when the operation is a single indivisible wait such as a Pyodide cold start.

Never both in the same region.

### 13.3 Accessibility

The skeleton container is `aria-hidden="true"` with `aria-busy="true"` on its parent. A screen reader should hear the text status, not a description of grey rectangles.

---

## 14. Empty state

The state most often missing from the current build, and the one that decides whether a new user continues.

### 14.1 Anatomy

`[icon 48px] [title] [one line of body] [primary action] [optional secondary link]`, centred in the region it fills, capped at `--prism-container-text`.

### 14.2 Four kinds, which must not be confused

| Kind | Title pattern | Action | Tone |
|---|---|---|---|
| First run | "No datasets yet" | the thing that creates one | inviting |
| Cleared by the user | "No datasets" | the same | neutral |
| Filtered to nothing | "No columns match **numer**" | "Clear filter" | neutral, echoes the query |
| Permitted but blocked | "Add a second dataset to enable linking" | the unblocking action | explanatory |

A filtered-empty state that looks like a first-run state tells the user the product is broken. The difference is the echoed query.

### 14.3 Tokens

| Element | Token | Measured |
|---|---|---|
| Icon | `text-tertiary` | **7.68** floor light, **8.13** dark |
| Title | `text`, `--prism-text-400` | **16.30** floor light |
| Body | `text-secondary`, `--prism-text-300` | **9.45** floor light |

### 14.4 Current implementation

`DatasetManager.tsx` has no empty state. With zero datasets the user sees a heading, a dropzone and nothing else; the "Loaded Datasets" section, the links section and the analyse button are all conditionally absent, so the page simply ends. At exactly one dataset, line 494 renders a tip. There is no equivalent at zero.

`AnalyticsWorkspace` has no empty state for a dataset with zero numeric columns, which is the case where several of its six tabs can do nothing at all and should say so.

---

## 15. Data table

### 15.1 Spec

| Element | Token | Measured |
|---|---|---|
| Header text | `text-secondary`, semibold | **9.45** light on `surface-sunken` |
| Header fill | `surface-sunken` | |
| Header bottom border | `border` 2px | **3.68** floor |
| Cell text | `text` | **17.85** light on `surface` |
| Row divider | `border-subtle` 1px | decorative, exempt |
| Row hover | `surface-sunken` | |
| Numeric cell | `text`, tabular lining numerals, right aligned | **17.85** light |
| Null cell | `text-disabled`, rendered as the literal string `null` | **5.17** floor |

### 15.2 Rules

- **Numeric columns are right aligned with tabular numerals.** A statistics product whose numbers do not line up is not credible.
- A null is rendered explicitly, never as an empty cell. An empty cell is ambiguous between "missing" and "zero", and that distinction is the whole subject of the preprocessing tab.
- The header is `position: sticky` at `--prism-z-raised` with an explicit `surface-sunken` fill, because a transparent sticky header shows the rows scrolling through it.
- Horizontal overflow lives in a container with `tabindex="0"` and an accessible name, so a keyboard user can scroll it. A scrollable region that cannot receive focus cannot be scrolled without a mouse.

### 15.3 Accessibility contract

- A real `<table>` with `<caption>`, `<thead>`, `<th scope="col">`.
- Sortable headers use `aria-sort` on the sorted column and a button inside the `<th>`.
- Row count is announced after a filter or a sort, once, in a polite live region.

### 15.4 Current implementation

`src/styles/index.css:128-138` styles `table`, `th` and `td` globally with `p-4` (16px all round) and a `border-b`. There is no numeric alignment, no tabular numerals, no null treatment, no sticky header, and no focusable overflow container. The `sr-only` table inside `SmartChart.tsx:184` is `role="table"` on a `div` rather than a real `<table>`, which loses native row and column navigation in every screen reader.

---

## 16. Chart frame

The container around a Recharts chart. Specified separately from the chart itself because the frame is where the honesty lives.

### 16.1 Anatomy

```
[ title                                        ] [ type badge ]
[ plain-language summary                                      ]
[ truncation notice, when truncated                           ]
[ plot area                                                   ]
[ legend, only if direct labelling is impossible              ]
[ <details> Show the data as a table                          ]
```

### 16.2 The truncation notice

Mandatory whenever the chart renders fewer rows than the dataset holds. `prism_core.py` truncates with `head(n)`: 500 for scatter, 100 for line and preview, 15 for bar, 10 for value counts.

```
Showing the first 500 of 128,431 rows. This is the first 500 rows in file
order, not a random sample, so the shape of this chart may not represent
the full dataset.
```

Rules: persistent, not a tooltip; rendered in `--prism-chart-truncation-note` (**9.16** light, **12.09** dark); uses the word **first**, never the word *sample*; states both numbers. A silently truncated chart pasted into an audit workpaper is a finding against the person who pasted it.

### 16.3 Series encoding

Colour plus a second channel, always. Full rules in `DESIGN_SYSTEM.md` section 7.3. Five series maximum, sixth becomes `Other`.

### 16.4 States

| State | Treatment |
|---|---|
| Default | plot rendered, summary present, data table collapsed |
| Loading | static skeleton at the plot's exact dimensions, plus a text status. Never a spinner over a half-drawn chart. |
| Error | danger alert inside the frame, keeping the title, with the recovery action |
| Empty | "No data to plot" plus the reason: all values null, one distinct value, no numeric column |
| Truncated | default plus the notice above |
| Too many series | first five plus `Other`, with a note naming how many were merged |

### 16.5 The data table should not be screen-reader-only

`SmartChart.tsx:184` renders a full data mirror inside `className="sr-only"`. It is the most useful element in the component and it is hidden from everyone who is not using a screen reader. Promote it to a `<details><summary>Show the data as a table</summary>` element: it stays available to assistive technology, becomes available to sighted users, and gives anyone the ability to check the chart against the numbers. For an audience of auditors, that is a feature rather than an accommodation.

### 16.6 Accessibility contract

- The plot is `role="img"` with an `aria-label` carrying the plain-language summary. Already correct at `SmartChart.tsx:558`.
- The title is a real heading at the right level for its position in the document.
- The summary text is visible, not `sr-only`. A sentence describing what a chart shows helps everyone.

---

## 17. Insight card

### 17.1 Spec

| Element | Token | Measured light | Measured dark |
|---|---|---|---|
| Surface | `surface` plus `border` plus `elevation-card` | border **3.68** | **3.45** |
| Severity edge, 4px inline-start | `info-edge` / `warning-edge` / `danger-edge` | **8.01** / **7.09** / **7.60** on its tint | **6.29** / **9.84** / **6.32** |
| Icon tile | severity `bg` fill, severity `text` glyph | **9.52** / **8.75** / **9.16** | **11.25** / **13.18** / **12.09** |
| Title | `text`, `--prism-text-400`, semibold | **17.85** | **15.54** |
| Body | `text-secondary`, `--prism-text-300` | **10.35** | **11.47** |
| Column chips | neutral badge | **9.45** | **11.47** |
| Confidence | see below | | |

### 17.2 The confidence meter needs rethinking

`InsightCard.tsx:99-110` renders confidence as a 64x6px bar filled with a `prism-500` to `purple-500` gradient, plus the text `"87% confidence"`.

Three problems. The bar is 6px tall and 64px wide, so at 87 percent versus 82 percent the difference is 3px, which is not readable. It has no `role="progressbar"` and no `aria-valuenow`. And the gradient fill measures between 2.77:1 and 5.38:1 against the card depending on how full it is, so a low-confidence bar is harder to see than a high-confidence one, which is backwards.

Replace it with the number alone, at `--prism-text-100` in `text-secondary` (**9.45** light), next to the severity label. If a visual meter is wanted, it needs to be at least 16px tall, use a flat `accent-solid` fill (**6.90** against `surface-sunken`), and carry the progressbar role.

### 17.3 The deeper issue

A confidence percentage attached to a heuristic is a number the user will trust, and nothing in the source verifies how it is derived. Design cannot fix that. What design can do is make the number look like what it is: a heuristic score, labelled as such, not a statistical confidence interval. Recommend the label read **"heuristic score"** until the underlying calculation is verified. `AnalyticsWorkspace.tsx` already uses the honest word `confidence: 'high' | 'medium' | 'low'` for its recommendation cards, and a three-level ordinal is a more truthful presentation than a two-decimal percentage.

---

## 18. Dataset card and link row

### 18.1 Dataset card

| State | Treatment |
|---|---|
| Default | `surface`, `border`, `elevation-card`, remove control at `text-tertiary` **7.68** floor |
| Hover | `elevation-raised`, remove control at `text` |
| Focus within | `--prism-focus-ring` on the card |
| Linked | `accent-edge` 2px border plus a "Linked" accent badge **8.24** |
| Loading | static skeleton at the card's dimensions plus a text status |
| Error | `danger-edge` border, danger badge naming the failure, retry action |

The remove control is always visible. See section 2.4 for why `opacity-0 group-hover:opacity-100` is a defect rather than a refinement.

### 18.2 Link row

Renders `left.column -> [join type] -> right.column`.

Three problems in the current build at `DatasetManager.tsx:299-334`.

The join type is an uppercase `purple-100` chip measuring **4.56:1**, which does not belong to any semantic family in the system and is below the 7:1 band.

The relationship direction is carried by two arrow SVGs with no text equivalent, so a screen reader hears `"sales" "id" "inner" "customers" "customer_id"` with no indication of which is joined to which. The row needs a `sr-only` sentence: "sales.id inner joined to customers.customer_id".

The remove control has the same hover-only visibility defect.

---

## 19. Modal

`LinkBuilder` at `DatasetManager.tsx:144` is currently rendered inline in the flow rather than as a dialog, which is a simpler and often better choice. If it becomes a dialog, this is the contract.

| Requirement | Detail |
|---|---|
| Element | `<dialog>` with `showModal()`, or `role="dialog" aria-modal="true"` |
| Name | `aria-labelledby` pointing at the visible title |
| Focus | moves to the dialog on open, to the element that opened it on close |
| Trap | Tab cycles within the dialog. Native `<dialog>` gives this free. |
| Escape | closes, and is equivalent to Cancel |
| Scrim | `--prism-color-scrim`, at `--prism-z-scrim`. Click to dismiss only when there is nothing unsaved. |
| Surface | `surface-overlay`, `border-strong`, `elevation-modal`, `--prism-radius-xl` |
| Scroll | the page behind does not scroll |
| Motion | opacity plus `--prism-motion-rise`, at `--prism-duration-slow` |

A destructive confirmation names the object and the consequence in the button, not just "Confirm": `"Remove sales_q3.csv"`.

---

## 20. Live region and status announcer

### 20.1 Three regions, mounted once at the app root

| Region | Politeness | Carries |
|---|---|---|
| Status | `role="status"`, polite | progress, completion, counts |
| Alert | `role="alert"`, assertive | errors and blocking warnings only |
| Log | `role="log"`, polite | the analysis history, if one is added |

### 20.2 Rules

- Mounted at first paint, before any message exists. A live region added to the DOM at the same instant as its content is often not announced.
- Assertive interrupts whatever the user is reading. Reserve it for errors. `App.tsx` uses `aria-live="assertive"` correctly for the file error and `polite` correctly for progress.
- Throttle progress announcements. Announce at 0, 25, 50, 75 and 100 percent, or on a message change, never on every tick.
- The announcement is a full sentence. "Analysis complete. 14 columns, 4 insights." Not "complete".

### 20.3 Current implementation

`prismStore.ts` maintains `processing.accessibleMessage` separately from `processing.message`, and `App.tsx` renders it into an `sr-only` paragraph inside the live region. That is a genuinely good pattern and should be kept and extended to `AnalyticsWorkspace`, whose live regions currently announce only the visible text.

---

## 21. Skip link

| Requirement | Detail |
|---|---|
| Position | first focusable element in the DOM |
| Hidden | visually hidden until focused. Never `display: none`, which removes it from the tab order. |
| On focus | fixed at the top inline-start, `--prism-z-skiplink` (9999), `surface` fill, `border-strong`, `elevation-modal`, 44px target |
| Target | `#main-content`, which must be focusable (`tabindex="-1"`) so focus actually lands there |
| Contrast | `text` on `surface`, **17.85** light, **15.54** dark |

### 21.1 Current implementation

Two skip links are rendered, at `index.html:123-124`, styled by a second `.skip-link` block inlined in `index.html:84-99`: white on `#000` (**21.00**) with a `#ffff00` focus outline (**19.56** on black). The colours are fine.

Three defects.

**The definition is duplicated.** `src/styles/index.css:147` defines a `.skip-link` class as well, using `prism-900` on white and a transform-based reveal. Nothing renders it, because the only two skip links in the product are in `index.html` and are matched by the inline block above them. Two definitions of one component, one of them dead.

**`#main-content` is not focusable.** `App.tsx:213` sets the id but no `tabindex="-1"`. In several browsers the fragment scrolls the page without moving focus, so the next Tab press returns the user to the top of the document and the skip link has achieved nothing.

**The second skip link points at an element that is conditionally absent.** `#file-upload` is on the section that `App.tsx` renders only when `!hasResults`. Once an analysis completes, "Skip to file upload" targets nothing. A skip link that silently does nothing is worse than no skip link, because a keyboard user has no way to tell the difference between a broken link and a mis-press. Either render the link conditionally alongside its target, or relabel it for the state the page is actually in.

---

## 22. Stat tile

| Element | Token | Measured |
|---|---|---|
| Value | `text`, `--prism-text-600`, bold, tabular numerals | **17.85** light, **15.54** dark |
| Label | `text-secondary`, `--prism-text-100` | **9.45** light, **11.47** dark |
| Delta, positive | `success-text` plus an up-arrow glyph | **9.23** light |
| Delta, negative | `danger-text` plus a down-arrow glyph | **9.16** light |
| Surface | `surface`, `border`, `elevation-card` | **3.68** floor |

The arrow glyph is required. A delta shown only in red or green is colour as the sole carrier of meaning.

`.stat-value` at `src/styles/index.css:275` renders the number in `bg-clip-text text-transparent` with a `prism-600` to `purple-600` gradient. The number is the most important content in the component and it is painted in a way that measures between **4.05:1** and **5.33:1** and vanishes entirely if the background image does not paint, which is the case in forced-colors mode. The stat value must be `--prism-color-text`.

`.stat-label` at `slate-500` measures **4.71:1** and misses the 7:1 band.

---

## 23. Theme and text-size controls

### 23.1 Text size

Currently a `<select>` with options `A`, `A+`, `A++` (`App.tsx`). Two problems.

The accessible name is `"Adjust font size"` but the option text is a single letter, so a screen reader user hears "A", "A plus", "A plus plus" with no indication of what they mean. Options should read "Normal", "Large (125%)", "Extra large (150%)".

A three-option select is more interaction than a three-option segmented control, which shows all three states at once and takes one click instead of two.

### 23.2 Theme

Currently a two-state toggle between light and dark, even though the store supports a third value, `high-contrast`. The high-contrast mode is therefore unreachable from the UI.

Recommended: a four-option segmented control, System / Light / Dark / High contrast, with `System` as the default so `prefers-color-scheme` and `prefers-contrast` are honoured for a first-time visitor. `tokens.css` already implements all four.

### 23.3 Both controls need a label

Both currently rely on `aria-label` alone. In a header with room for it, a visible label is better: it tells sighted users what the control does without hovering, and it satisfies SC 2.5.3 Label in Name by construction.

---

## 24. Component inventory and gaps

What exists in `src/components/` today, and what the system above assumes exists.

| Component | Exists | State |
|---|---|---|
| FileUploader | yes | states present, all state borders below 3:1, no in-zone progress |
| DatasetManager | yes | no empty state, hover-only remove controls |
| AnalyticsWorkspace | yes | 1,686 lines, 6 tabs, keyboard tablist correct and tested, 3 hand-rolled spinners, 3 hand-rolled error boxes |
| SmartChart | yes | data table hidden as `sr-only`, no truncation notice, single cross-theme palette |
| InsightCard | yes | confidence meter is 6px tall with no progressbar role |
| Button | no, only CSS classes | gradient fill, opacity disabled, no loading variant |
| Input, Select | no, only a CSS class | no error, disabled or read-only state |
| Alert | CSS classes exist | not used by most error paths |
| Badge | CSS classes exist | all four below the 7:1 band |
| Tabs | inline in three places | no shared implementation; only the AnalyticsWorkspace one has arrow keys |
| Modal | no | `LinkBuilder` is inline, no dialog semantics |
| Data table | global element styles only | no numeric alignment, no sticky header |
| Empty state | no | the largest single gap |
| Skeleton | `.shimmer` only | animated, should be static |
| Spinner | four separate implementations | should be one |
| Skip link | rendered in index.html | class defined twice, target not focusable, one target conditionally absent |
| Toast | no | not needed yet, live regions cover it |
| Tooltip | no | needed for the disabled-control explanations this document calls for |

### 24.1 Build order

Ranked by how much downstream work each unblocks.

1. **Button, Input, Alert, Badge as real components.** Four of the five existing components hand-roll these. Extracting them removes the inconsistency in one move.
2. **Spinner plus its paired text status.** Four implementations collapse to one, and the reduced-motion defect is fixed once instead of four times.
3. **One shared Tabs component.** `AnalyticsWorkspace` already has the correct keyboard behaviour and a test for it. Extracting it and replacing the two hand-rolled tablists in `App.tsx` closes the remaining keyboard gap without rewriting anything twice.
4. **Empty state.** The largest gap, and the cheapest component in the list.
5. **Chart frame with the truncation notice and the visible data table.** The change that most improves the product's credibility with an audience that checks.

> File ownership: this document and `tokens.css` live under `docs/design/ui/`. Nothing in `src/` has been modified. Everything above is a specification for the team that owns those files.
