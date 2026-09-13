# PRISM Design System

**Owner:** UI and visual design
**Version:** 1.0.0
**Date:** 2026-09-13
**Implements:** `docs/design/ui/tokens.css`
**Component contracts:** `docs/design/ui/COMPONENTS.md`

---

## 0. What this document is, and what it is not

This is the colour, type, space, elevation and motion system for PRISM, written against the code as it exists on branch `army/prism-upgrade` on 2026-09-13.

Every contrast ratio in this document was computed, not estimated. Section 1 gives the formula, the script and the command so that any reader can reproduce every number in this file on their own machine.

**What this document does not do.** It does not assert that PRISM conforms to WCAG 2.2 at any level. Contrast is one success criterion family out of roughly ninety. A measured 8.41:1 on one text pair is a fact about that pair. A conformance claim is a statement about an entire product against every applicable criterion, verified by a full audit, and no such audit has been performed on PRISM. The repository README currently claims **WCAG 2.2 Level AAA** and the Tailwind config repeats it in a comment. Section 13 explains why that claim must be removed before anything else in this system ships, and what may honestly be said instead.

The correct phrasing for external material is **"designed against WCAG 2.2 Level AAA contrast thresholds, with measured ratios published"**. That is defensible because the ratios are in this file and in `tokens.css`, and anyone can recompute them.

---

## 1. Measurement method

### 1.1 The formula

WCAG 2.x contrast ratio, from the W3C definition at <https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio>:

```
ratio = (L1 + 0.05) / (L2 + 0.05)
```

where `L1` is the relative luminance of the lighter colour and `L2` of the darker, and relative luminance is defined at <https://www.w3.org/TR/WCAG22/#dfn-relative-luminance>:

```
L = 0.2126 R + 0.7152 G + 0.0722 B

for each channel c in {R, G, B}:
    c_srgb = channel_8bit / 255
    c = c_srgb / 12.92                        if c_srgb <= 0.04045
    c = ((c_srgb + 0.055) / 1.055) ^ 2.4      otherwise
```

### 1.2 The thresholds this system is measured against

| Threshold | Applies to | WCAG reference |
|---|---|---|
| 3:1 | Non-text: UI component boundaries, state indicators, focus rings, icons that carry meaning, graph elements | SC 1.4.11 Non-text Contrast (AA) |
| 3:1 | Large text: 18.66px bold or 24px regular and above | SC 1.4.3 (AA) |
| 4.5:1 | Normal body text | SC 1.4.3 Contrast Minimum (AA) |
| 4.5:1 | Large text, enhanced | SC 1.4.6 (AAA) |
| 7:1 | Normal body text, enhanced | SC 1.4.6 Contrast Enhanced (AAA) |

PRISM's target: **7:1 for every text token against every surface it is permitted to sit on, and 3:1 for every border, focus ring and chart mark.** Where a token cannot reach 7:1 it is named as a non-body role (`text-disabled`) and its measured floor is published.

### 1.3 Reproducing every number in this document

The measurements were produced with a fifteen-line script. It has no dependencies.

```js
// contrast.js
function hex2rgb(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function lin(c){c=c/255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
function lum(rgb){const[r,g,b]=rgb.map(lin);return 0.2126*r+0.7152*g+0.0722*b;}
function ratio(a,b){const L1=lum(hex2rgb(a)),L2=lum(hex2rgb(b));
  const hi=Math.max(L1,L2),lo=Math.min(L1,L2);return (hi+0.05)/(lo+0.05);}
// alpha compositing, needed for every translucent surface in the current build
function over(src,alpha,dst){const s=hex2rgb(src),d=hex2rgb(dst);
  return '#'+s.map((v,i)=>Math.round(v*alpha+d[i]*(1-alpha)).toString(16).padStart(2,'0')).join('');}
module.exports={ratio,over};
```

```bash
node -e "const{ratio}=require('./contrast.js');console.log(ratio('#0ea5e9','#ffffff').toFixed(2))"
# 2.77
```

**Rule for this repository:** any colour value changed in `tokens.css` must have its ratio comment recomputed in the same commit. A colour changed without its ratio updated is a defect, not a style preference.

### 1.4 A note on translucency

Seven of the surfaces in the current build are translucent (`.glass-card` is `rgba(255,255,255,0.7)` in light and `rgba(15,23,42,0.7)` in dark). Contrast is measured against the **composited** colour, not the declared one, so every glass surface had to be composited against what sits behind it before the ratio could be taken. Composited values used throughout this document:

| Surface | Declared | Behind it | Composited | Note |
|---|---|---|---|---|
| `.glass-card` light | `rgba(255,255,255,0.7)` | `.mesh-bg` base `#f8fafc` | `#fdfefe` | measured |
| `.glass-card` light over a mesh hotspot | same | `hsla(221,83%,67%,0.3)` over `#f8fafc` = `#ccdbf9` | `#f0f4fd` | measured |
| `.glass-card` dark | `rgba(15,23,42,0.7)` | `.mesh-bg` dark base `#0f172a` | `#0f172a` | identical, the alpha does nothing |
| `.glass-card` dark over a mesh hotspot | same | `#293c66` | `#17223c` | measured |
| `bg-slate-800/50` over `slate-900` | `rgba(30,41,59,0.5)` | `#0f172a` | `#172033` | measured |

This is the structural reason glass surfaces are removed in Section 4.6: the contrast of text on a translucent surface is a function of what is scrolling behind it, so it cannot be guaranteed by a token. `backdrop-filter: blur(16px)` reduces the variance but does not bound it.

---

## 2. Audit of the system as built

Everything in this section is a measurement of the code on disk at `src/styles/index.css`, `tailwind.config.js`, and the five components under `src/components/`. Nothing here is a proposal.

### 2.1 Light theme, text pairs

| Pair | Foreground | Background | Ratio | 4.5:1 | 7:1 | Where |
|---|---|---|---|---|---|---|
| Body heading | `#0f172a` | `#fdfefe` glass | **17.67** | pass | pass | `App.tsx`, all headings |
| Body on canvas | `#0f172a` | `#f8fafc` | **17.06** | pass | pass | `.mesh-bg` |
| Card description | `#475569` | `#fdfefe` glass | **7.50** | pass | pass | `InsightCard.tsx:80` |
| Stat label | `#64748b` | `#fdfefe` glass | **4.71** | pass | **fail** | `.stat-label` |
| Dropzone description | `#64748b` | `#ffffff` | **4.76** | pass | **fail** | `FileUploader.tsx:194` |
| Format chip | `#475569` | `#f1f5f9` | **6.92** | pass | **fail** | `FileUploader.tsx:209` |
| Placeholder | `#94a3b8` | `#ffffff` | **2.56** | **fail** | **fail** | `.input` placeholder |
| Link, resting | `#0284c7` | `#fdfefe` glass | **4.05** | **fail** | **fail** | `index.css:105` |
| Link, hover | `#075985` | `#fdfefe` glass | **7.49** | pass | pass | `index.css:110` |
| Security banner emphasis | `#059669` | `#fdfefe` glass | **3.73** | **fail** | **fail** | `App.tsx`, "Zero-Trust Mode Active" |
| `gradient-text` left stop | `#0284c7` | `#fdfefe` glass | **4.05** | **fail** | **fail** | `.gradient-text`, the `PRISM` wordmark |
| `gradient-text` mid stop | `#9333ea` | `#fdfefe` glass | **5.33** | pass | **fail** | same |
| `gradient-text` right stop | `#db2777` | `#fdfefe` glass | **4.55** | pass | **fail** | same |
| `badge-primary` | `#0369a1` | `#e0f2fe` | **5.17** | pass | **fail** | `.badge-primary` |
| `badge-success` | `#047857` | `#d1fae5` | **4.84** | pass | **fail** | `.badge-success` |
| `badge-warning` | `#b45309` | `#fef3c7` | **4.51** | pass (by 0.01) | **fail** | `.badge-warning` |
| `badge-error` | `#b91c1c` | `#fee2e2` | **5.30** | pass | **fail** | `.badge-error` |
| `alert-info` | `#1e40af` | `#eff6ff` | **8.01** | pass | pass | `.alert-info` |
| `alert-success` | `#065f46` | `#ecfdf5` | **7.29** | pass | pass | `.alert-success` |
| `alert-warning` | `#92400e` | `#fffbeb` | **6.84** | pass | **fail** | `.alert-warning` |
| `alert-error` | `#991b1b` | `#fef2f2` | **7.60** | pass | pass | `.alert-error` |
| Inline error body | `#dc2626` | `#fef2f2` | **4.41** | **fail** | **fail** | `AnalyticsWorkspace.tsx:1037` |
| Stat label over mesh hotspot | `#64748b` | `#f0f4fd` | **4.32** | **fail** | **fail** | glass over gradient blob |

### 2.2 Light theme, non-text pairs (3:1 required)

| Pair | Foreground | Background | Ratio | 3:1 | Where |
|---|---|---|---|---|---|
| **Focus ring** | `#0ea5e9` | `#ffffff` | **2.77** | **fail** | `index.css:65`, global `:focus-visible` |
| **Focus ring** | `#0ea5e9` | `#fdfefe` glass | **2.74** | **fail** | every card |
| **Focus ring** | `#0ea5e9` | `#f1f5f9` | **2.53** | **fail** | `btn-secondary`, header controls |
| **Focus ring** on its own button | `#0ea5e9` | `#0ea5e9` | **1.00** | **fail** | active tab, `prism-500` fill |
| **Focus ring** on primary button | `#0ea5e9` | `#667eea` | **1.32** | **fail** | `btn-primary` gradient |
| Card border | `#e2e8f0` | `#ffffff` | **1.23** | **fail** | `.card`, every panel edge |
| Dropzone resting border | `#e2e8f0` | `#ffffff` | **1.23** | **fail** | `FileUploader.tsx:135` |
| Dropzone **drag-accept** border | `#34d399` | `#ecfdf5` | **1.82** | **fail** | `FileUploader.tsx:129` |
| Dropzone **drag-reject** border | `#f87171` | `#fef2f2` | **2.53** | **fail** | `FileUploader.tsx:126` |
| Dropzone **drag-active** border | `#38bdf8` | `#f0f9ff` | **2.01** | **fail** | `FileUploader.tsx:132` |
| Progress track | `#e2e8f0` | `#fdfefe` glass | **1.22** | **fail** | `.progress-bar` |
| Dropzone idle icon | `#94a3b8` | `#ffffff` | **2.56** | **fail** | `FileUploader.tsx:139` |
| Insight icon, warning | `#d97706` | `#fef3c7` | **2.86** | **fail** | `InsightCard.tsx:35` |
| Insight icon, info | `#2563eb` | `#dbeafe` | **4.24** | pass | `InsightCard.tsx:23` |
| Insight icon, critical | `#dc2626` | `#fee2e2` | **3.95** | pass | `InsightCard.tsx:44` |

### 2.3 Light theme, button fills

| Pair | Ratio | 4.5:1 | 7:1 | Where |
|---|---|---|---|---|
| White on `#667eea` (`--gradient-primary` start) | **3.66** | **fail** | **fail** | `.btn-primary` |
| White on `#764ba2` (`--gradient-primary` end) | **6.37** | pass | **fail** | `.btn-primary` |
| White on `#0ea5e9` (active tab gradient start) | **2.77** | **fail** | **fail** | `App.tsx` tabs, `AnalyticsWorkspace.tsx:237` |
| White on `#9333ea` (active tab gradient end) | **5.38** | pass | **fail** | same |
| `#0f172a` on `#f1f5f9` | **16.30** | pass | pass | `.btn-secondary` |
| Disabled `.btn-primary` label, `opacity-50` composited | **2.04** | **fail** | **fail** | `.btn:disabled` |
| Disabled active-tab label, `opacity-50` composited | **1.66** | **fail** | **fail** | same mechanism |

The gradient buttons are the sharpest case in the audit. A label sitting on a left-to-right gradient has a contrast ratio that **varies across its own width**. On `.btn-primary` the label starts at 3.66:1 and ends at 6.37:1. There is no single number to report, and no token can fix a value that changes along the x axis.

### 2.4 Dark theme

Dark is in materially better shape than light. This is worth saying plainly: the dark palette is close to shippable and the light palette is not.

| Pair | Ratio | 4.5:1 | 7:1 |
|---|---|---|---|
| `#f1f5f9` on `#0f172a` | **16.30** | pass | pass |
| `#f1f5f9` on `#1e293b` | **13.35** | pass | pass |
| `#cbd5e1` on `#1e293b` | **9.85** | pass | pass |
| `#94a3b8` on `#0f172a` | **6.96** | pass | **fail** |
| `#94a3b8` on `#1e293b` | **5.71** | pass | **fail** |
| `#64748b` placeholder on `#0f172a` | **3.75** | **fail** | **fail** |
| Link `#38bdf8` on `#0f172a` | **8.33** | pass | pass |
| `badge-primary` `#7dd3fc` on `#0c4a6e` | **5.67** | pass | **fail** |
| `badge-success` `#6ee7b7` on `#064e3b` | **6.38** | pass | **fail** |
| `badge-warning` `#fcd34d` on `#78350f` | **6.29** | pass | **fail** |
| `badge-error` `#fca5a5` on `#7f1d1d` | **5.28** | pass | **fail** |
| `alert-info` `#bfdbfe` on composited `#131e3f` | **11.50** | pass | pass |
| `alert-success` `#a7f3d0` on composited `#092226` | **12.91** | pass | pass |
| `alert-warning` `#fde68a` on composited `#2a1917` | **13.49** | pass | pass |
| `alert-error` `#fecaca` on composited `#2a111a` | **12.16** | pass | pass |
| Focus ring `#0ea5e9` on `#0f172a` | **6.44** | n/a | pass (UI needs 3) |
| Focus ring `#0ea5e9` on `#1e293b` | **5.28** | n/a | pass (UI needs 3) |
| Border `#334155` on `#0f172a` | **1.72** | n/a | **fail** (UI needs 3) |

**The focus ring passes in dark and fails in light.** That asymmetry is not a coincidence: `#0ea5e9` is a mid-luminance colour, and a mid-luminance ring can only clear 3:1 in one direction.

### 2.5 Chart palette as built

`src/components/visualization/SmartChart/SmartChart.tsx:70` declares `ACCESSIBLE_COLORS` with the comment "selected for colorblind users". Measured against the chart plot background, which is `bg-white dark:bg-slate-900/50`:

| Colour | On `#ffffff` | 3:1 light | On `#0f172a` | 3:1 dark |
|---|---|---|---|---|
| `#0077BB` blue | **4.82** | pass | **3.70** | pass |
| `#EE7733` orange | **2.87** | **fail** | **6.22** | pass |
| `#009988` teal | **3.55** | pass | **5.03** | pass |
| `#EE3377` magenta | **3.91** | pass | **4.57** | pass |
| `#33BBEE` cyan | **2.21** | **fail** | **8.06** | pass |
| `#CC3311` red | **5.19** | pass | **3.44** | pass |
| `#BBBBBB` grey | **1.92** | **fail** | **9.30** | pass |
| `#332288` indigo | **12.17** | pass | **1.47** | **fail** |

Four of the eight fail 3:1 in one theme or the other. A single palette used across both themes cannot pass, because a colour that is dark enough for a white background is too dark for a near-black one. Section 7 replaces it with two palettes.

### 2.6 High-contrast mode as built

The `.high-contrast` block in `src/styles/index.css:429` is the strongest part of the current system. Every pair clears 7:1.

| Pair | Ratio |
|---|---|
| `#ffffff` on `#000000` | **21.00** |
| `#e5e5e5` on `#000000` | **16.67** |
| `#00ffff` link on `#000000` | **16.75** |
| `#ffff00` focus on `#000000` | **19.56** |
| `#00ff00` success on `#000000` | **15.30** |
| `#ff6b6b` error on `#000000` | **7.57** |
| `#ffffff` on `#1a1a1a` | **17.40** |

The values are correct. The problems are structural rather than chromatic and are listed in Section 3.

---

## 3. Defects found, ranked

Ranked by how badly each one breaks the product for a real user, not by how easy it is to fix.

### D1. The focus indicator fails 3:1 on every light surface it appears on

`:focus-visible { outline: 3px solid #0ea5e9 }` measures 2.77:1 on white, 2.74:1 on a glass card, 2.53:1 on `slate-100`, and **1.00:1 when the focused element is itself filled with `prism-500`**, which is the case for the active tab in `App.tsx` and `AnalyticsWorkspace.tsx:237`. On the primary button gradient it measures 1.32:1.

For a keyboard-only user, the focus ring is the entire interface. A ring at 1.00:1 is not a weak ring, it is no ring. This is the single defect that most contradicts the accessibility positioning in the README. Fixed by Section 5.

### D2. Every state on the dropzone is signalled by a border that fails 3:1

The drop zone is the product's front door and the only place where a wrong action has a real cost. Its accept, reject and active states are carried by border colours measuring 1.82:1, 2.53:1 and 2.01:1 against their own fills.

There is a mitigating fact worth recording honestly: the icon **and** the label text both change with the state (`FileUploader.tsx:145` and `:181`), so the state is not conveyed by colour alone and SC 1.4.1 Use of Color is satisfied. What fails is SC 1.4.11, the requirement that the boundary itself be perceivable.

### D3. `gradient-text` is applied to headings, including the wordmark

`.gradient-text` uses `bg-clip-text` with `text-transparent`. Two separate problems.

First, contrast: the three gradient stops measure 4.05:1, 5.33:1 and 4.55:1 on a light card. The left third of the word `PRISM` fails AA outright.

Second, and worse, `color: transparent` is the fallback. If the background image does not paint, for any reason, the text is invisible rather than merely low contrast. Background images are not painted in Windows forced-colors mode. The wordmark disappears there.

### D4. Disabled controls fall to 1.66:1 and 2.04:1

`.btn:disabled` applies `opacity-50` to the whole control. Compositing the white label at 50 percent over the `prism-500` fill gives 1.66:1, and over the `#667eea` gradient stop gives 2.04:1.

WCAG exempts disabled controls from contrast requirements, so this is not a conformance failure. It is a usability failure. A user needs to read the label of the button they cannot press in order to work out why. Section 4.5 replaces the opacity approach.

### D5. The light link colour fails AA

`a { @apply text-prism-600 }` measures **4.05:1** on a glass card. Links are body text. This fails 4.5:1, let alone 7:1. The hover state, `prism-800`, measures 7.49:1 and is fine, which means the resting state is the only one that fails: a link is legible only once you are already pointing at it.

### D6. Text contrast on glass surfaces is not a fixed value

`.glass-card` composites to `#fdfefe` over the plain mesh background and `#f0f4fd` over a gradient hotspot. `slate-500` measures 4.71:1 in the first case and **4.32:1** in the second. A token whose contrast changes depending on scroll position cannot be verified, cannot be regression-tested, and cannot be put in a claim.

The five mesh stops in `--gradient-mesh` are all light hues. In dark mode `.dark .mesh-bg` overrides `background-color` but **not** `background-image`, so those five light hotspots still paint over the dark canvas: the composited hotspot measures `#293c66`. Text contrast survives it (`slate-100` on a glass card over the hotspot is still 14.41:1), so this is a visual inconsistency rather than a contrast failure, but it is unintended and should be recorded as such.

### D6b. The mesh gradient and glassmorphism cost more than they return

`backdrop-filter: blur(16px)` is applied to every card, the sticky header, every stat tile and every insight card. The mesh background paints five radial gradients behind all of it. On a locked-down corporate laptop with software compositing, this is the most expensive thing on the page, and PRISM's ICP is corporate laptops. The analysis result is the product. The blur is not.

### D7. Semantic badges sit in the AA band, not the AAA band

All four `.badge-*` variants measure between 4.51:1 and 5.30:1. `badge-warning` clears 4.5:1 by 0.01. That is inside measurement noise for anyone who picks a slightly different shade later. Badges carry state words such as `numeric`, `categorical` and `high confidence`, which are meaningful, so they should sit in the same band as body text.

### D8. Four of eight chart colours fail 3:1 in one theme

Covered in Section 2.5 and replaced in Section 7.

### D9. The reduced-motion block freezes loading spinners

`src/styles/index.css:48` sets, for every element, `animation-duration: 0.01ms !important` and `animation-iteration-count: 1 !important` under `prefers-reduced-motion: reduce`.

This is the standard recipe and it is correct for decorative motion. Applied globally it also stops the four loading spinners in `AnalyticsWorkspace.tsx` (lines 1022, 1172, 1376) and `App.tsx`. A reduced-motion user watching a Pyodide cold start sees a static circle and a static message for as long as the load takes, with nothing to distinguish "loading" from "hung".

Partially mitigated already: the `App.tsx` progress panel prints `{processing.progress}% complete` as text. The `AnalyticsWorkspace` spinners have no such text. Section 11 sets the rule.

### D10. Four animations loop indefinitely with no in-page stop

`.float` (6s infinite), `.pulse-glow` (2s infinite), `.shimmer` (1.5s infinite) and `.spin-slow` (3s infinite). SC 2.2.2 Pause, Stop, Hide requires a mechanism to pause any automatically-starting motion that runs longer than five seconds alongside other content. An OS-level `prefers-reduced-motion` setting is not that mechanism, because the criterion asks for something the user can operate in the page.

A loading spinner is defensible under the "essential" exception. `.float` and `.pulse-glow` are decorative and are not.

### D11. Reading measure is roughly 135 characters at the default size

The main column is `max-w-7xl` (1280px) with `px-8` at desktop. Body text is 18px.

> ASSUMPTION: the average advance width of a system-ui sans at 18px is about 9px per character (0.5em). This varies by font and by content, so treat the figure as an order of magnitude, not a measurement. Reasoning: 0.5em is the conventional planning figure for a humanist sans at body size.

1280px minus 64px of padding, divided by 9px, gives roughly **135 characters per line**. SC 1.4.8 Visual Presentation puts the ceiling at 80. Nothing in the current CSS constrains running text separately from the tool chrome. Section 9 introduces `--prism-measure` at 68ch and a separate reading container.

### D12. `min-height: 44px` is applied to every anchor, including inline links

`src/styles/index.css:99` puts `min-height: 44px` on `a` along with buttons and selects. SC 2.5.5 Target Size (Enhanced) explicitly exempts targets that are "in a sentence or block of text". Forcing 44px on an inline link either inflates the line box or does nothing, depending on the anchor's display, and neither outcome is intended. The rule should not name `a`.

### D13. The `.high-contrast` mode is reachable only through code that also forces dark

`App.tsx` maps `colorScheme === 'high-contrast'` to `root.classList.add('dark', 'high-contrast')`. Two consequences. There is no light high-contrast mode, which some users of increased-contrast settings prefer. And the app's own high-contrast toggle does not respond to the OS `prefers-contrast: more` setting, so a user who set it at the OS level still gets the standard palette until they find the in-app control. `tokens.css` Section 10 wires both paths to the same values.

### D14. `.high-contrast` still runs `backdrop-filter` and shadows

Nothing in the `.high-contrast` block disables `backdrop-filter`, `box-shadow` or the mesh background image, so a high-contrast user still receives a blurred translucent card over a five-stop gradient. In forced-colors mode the shadow vanishes entirely, and since `.glass-card` has a 1px border at `rgba(255,255,255,0.4)`, the card boundary goes with it.

---

## 4. Colour

Token names and values are in `tokens.css`. This section is the reasoning and the evidence.

### 4.1 Surfaces

Three surfaces per theme, plus an overlay and a scrim. Not more. Every additional surface multiplies the number of pairs that have to be measured and re-measured.

| Role | Light | Dark | Use |
|---|---|---|---|
| `canvas` | `#f8fafc` | `#0b1220` | page background |
| `surface` | `#ffffff` | `#131c2e` | cards, panels, popovers |
| `surface-sunken` | `#f1f5f9` | `#0f172a` | wells, table headers, code blocks |
| `surface-overlay` | `#ffffff` | `#1a2540` | modals and menus |
| `scrim` | `rgb(11 18 32 / 0.60)` | `rgb(2 6 14 / 0.70)` | modal backdrop |

The dark canvas is `#0b1220` rather than the current `#0f172a`, and `#0f172a` is demoted to `surface-sunken`. This buys the dark theme a genuine three-step depth ladder. In the current build `.mesh-bg` dark, `.glass-card` dark and `dark:bg-slate-900` all composite to exactly `#0f172a`, so there is no depth at all: the alpha on the glass card is doing nothing.

### 4.2 Text

Every text token clears 7:1 against every surface it is permitted to occupy. Measured, light theme, as surface / canvas / sunken:

| Token | Value | surface | canvas | sunken | Floor |
|---|---|---|---|---|---|
| `text` | `#0f172a` | 17.85 | 17.06 | 16.30 | **16.30** |
| `text-secondary` | `#334155` | 10.35 | 9.90 | 9.45 | **9.45** |
| `text-tertiary` | `#434e60` | 8.41 | 8.04 | 7.68 | **7.68** |
| `text-disabled` | `#5c6879` | 5.66 | 5.41 | 5.17 | **5.17** |

Dark theme, as canvas / surface / sunken:

| Token | Value | canvas | surface | sunken | Floor |
|---|---|---|---|---|---|
| `text` | `#f1f5f9` | 17.09 | 15.54 | 16.30 | **15.54** |
| `text-secondary` | `#cbd5e1` | 12.61 | 11.47 | 12.02 | **11.47** |
| `text-tertiary` | `#a9b4c6` | 8.94 | 8.13 | 8.53 | **8.13** |
| `text-disabled` | `#8b97a8` | 6.32 | 5.75 | 6.03 | **5.75** |

Note what changed and why.

- `text-tertiary` in light is `#434e60`, not Tailwind `slate-600` `#475569`. `slate-600` measures 6.92:1 on `surface-sunken`, which misses 7:1. `#434e60` is the nearest value on the same hue that clears 7:1 on all three.
- `text-tertiary` in dark is `#a9b4c6`, not `slate-400` `#94a3b8`. `slate-400` measures 6.64:1 on the dark surface.
- `text-disabled` deliberately does not reach 7:1. It is the only text token that does not, it is named so nobody mistakes it for a body role, and its floor of 5.17:1 is published. It still clears AA. A disabled control must remain readable: the user needs to know what they cannot do.

**There is no fifth text tier.** Requests for "just one step lighter" are how a system drifts below threshold. The answer is to use size, weight or position instead.

### 4.3 Borders

| Role | Light | Ratio floor | Dark | Ratio floor | Rule |
|---|---|---|---|---|---|
| `border` | `#767f8f` | **3.68** | `#657185` | **3.45** | anything that bounds a component or carries state |
| `border-strong` | `#475569` | **6.92** | `#a9b4c6` | **8.13** | selected, focused-within, invalid |
| `border-subtle` | `#cbd5e1` | 1.48 | `#334155` | 1.72 | decorative dividers only, never state |

`border-subtle` fails 3:1 on purpose and is labelled DECORATIVE in `tokens.css`. It may separate rows in a table. It may never be the only thing telling a user that a field is selected, an upload will be accepted, or a card is interactive. The current build uses `slate-200` (1.23:1) for exactly those load-bearing jobs.

### 4.4 Accent

The brand is the `prism` sky ramp already in `tailwind.config.js`. What changes is which step is used for which job.

| Role | Light | Evidence | Dark | Evidence |
|---|---|---|---|---|
| `accent-text` (links) | `#0c4a6e` | 8.63 floor | `#7dd3fc` | 10.21 floor |
| `accent-solid` (button fill) | `#075985` | white label **7.56** | `#38bdf8` | ink label **8.74** |
| `accent-solid-hover` | `#0c4a6e` | white label **9.46** | `#7dd3fc` | ink label **11.23** |
| `accent-subtle` (tinted bg) | `#e0f2fe` | accent-text on it **8.24** | `#0b2f47` | accent-text on it **8.33** |

Dark solid buttons invert: dark ink on a light fill. `#0b1220` on `#38bdf8` measures 8.74:1. White on `#38bdf8` measures 2.14:1, which is why the dark accent button must not use a white label.

### 4.5 Disabled, without opacity

`opacity: 0.5` on a whole control is banned. It multiplies the control's contrast by an unpredictable factor that depends on what is behind it, and it measured 1.66:1 and 2.04:1 in the audit.

A disabled control is instead expressed as:

- fill: `--prism-color-surface-sunken`
- label: `--prism-color-text-disabled` (floor 5.17 light, 5.75 dark)
- border: `--prism-color-border` (floor 3.68 light, 3.45 dark)
- `aria-disabled="true"` rather than the `disabled` attribute wherever the control still needs to be reachable by a screen reader user who wants to know why it is off
- `cursor: not-allowed`

Contrast is preserved. The control still reads as unavailable because it has lost its fill, not because it has been faded.

### 4.6 Glass and gradients are removed

Removed: `--gradient-primary`, `--gradient-secondary`, `--gradient-success`, `--gradient-mesh`, `.glass-card`, `.gradient-text`, `.gradient-border`, `.pulse-glow`, `.float`, `.mesh-bg`.

Reasons, in order of weight.

1. A gradient fill gives a label a contrast ratio that varies along its own width. `.btn-primary` runs from 3.66:1 to 6.37:1. There is no number to publish.
2. `.gradient-text` renders the text `transparent` and relies on a background image to paint it. In forced-colors mode the image is dropped and the word disappears.
3. Contrast on a translucent surface depends on what is behind it, which moves when the page scrolls. A verified system cannot have a variable in it.
4. `backdrop-filter: blur(16px)` on every card is the most expensive paint on the page, and PRISM's audience runs it on managed corporate hardware.
5. The brand asset that matters is the `PrismLogo` SVG in `App.tsx`, which is a real prism refracting a beam. It already carries the idea. The gradients restate it four more times.

What replaces them: one accent, flat surfaces, a real elevation ladder, and a wordmark set in `--prism-color-text` next to the existing SVG.

---

## 5. The focus indicator

This is the most important single decision in the system, so the reasoning is given in full.

### 5.1 The problem is not that `#0ea5e9` is a bad colour

It is that **no single colour can clear 3:1 against every surface a focus ring lands on.** A focus ring must be visible on white, on a near-black panel, and on the accent-filled button it is currently wrapping. Any colour light enough to show on `#0b1220` is too light to show on `#ffffff`, and the converse.

Measured, for the current ring `#0ea5e9`: 2.77 on white, 6.44 on the dark canvas, and 1.00 on an accent-filled button.

### 5.2 The two-tone ring, and why it always works

PRISM draws focus as two concentric rings: an inner ring in one theme's extreme and an outer ring in the other.

| Theme | Inner | Outer |
|---|---|---|
| Light | `#ffffff` | `#0b1220` |
| Dark | `#0b1220` | `#f8fafc` |
| Increased contrast | `#000000` | `#ffff00` (19.56 on black) |
| Forced colors | `Canvas` | `CanvasText` |

At least one of the two rings is guaranteed to clear 3:1 against any surface whatsoever, and this can be shown rather than asserted. For any surface luminance `Ls`:

```
ratio(white, S) * ratio(S, black) = (1.05 / (Ls + 0.05)) * ((Ls + 0.05) / 0.05) = 21
```

The two ratios multiply to exactly 21 for every possible surface. Therefore the larger of the two is at least `sqrt(21)` = **4.58**, which comfortably exceeds the 3:1 requirement. Using `#0b1220` rather than pure black lowers the guarantee slightly but leaves it far above 3.

Measured against the fifteen surfaces this system can produce, the worst case was **5.12** (on `#667eea`, the gradient stop being removed). Against every surface that survives into the new system, the worst case is **7.56**.

### 5.3 Geometry

```css
--prism-focus-inner-width: 2px;
--prism-focus-outer-width: 2px;
--prism-focus-offset:      2px;
--prism-focus-ring:
    0 0 0 2px var(--prism-color-focus-inner),
    0 0 0 4px var(--prism-color-focus-outer);
```

Drawn with `box-shadow`, not `outline`, for three reasons: it follows `border-radius` exactly, it never shifts layout, and a stacked pair is expressible in one property.

Against WCAG 2.2 SC 2.4.13 Focus Appearance (AAA), which asks for an area at least equal to a 2px perimeter of the control and a 3:1 change against the unfocused state: a 4px total ring around the full perimeter exceeds the area requirement, and a ring where none existed before is a full change of state.

SC 2.4.11 Focus Not Obscured (AA) is a layout obligation, not a colour one, and applies to the sticky header in `App.tsx`, which is `z-50` and 76px tall. Any focusable element scrolled to just under it will be covered. The fix is `scroll-margin-block-start` on focusable content equal to the header height, and it belongs in the component layer.

---

## 6. Semantic colour

Four semantic families. Each has four tokens: `bg`, `text`, `edge`, `solid`.

### 6.1 Light

| Family | bg | text | measured | edge | measured on bg | solid | white on it |
|---|---|---|---|---|---|---|---|
| info | `#eff6ff` | `#1e3a8a` | **9.52** | `#1e40af` | **8.01** | `#1e40af` | **8.72** |
| success | `#ecfdf5` | `#064e3b` | **9.23** | `#065f46` | **7.29** | `#065f46` | **7.68** |
| warning | `#fffbeb` | `#78350f` | **8.75** | `#92400e` | **7.09** | `#78350f` | **9.07** |
| danger | `#fef2f2` | `#7f1d1d` | **9.16** | `#991b1b` | **7.60** | `#991b1b` | **8.31** |

### 6.2 Dark

| Family | bg | text | measured | edge | measured on bg | solid | ink on it |
|---|---|---|---|---|---|---|---|
| info | `#11213f` | `#bfdbfe` | **11.25** | `#60a5fa` | **6.29** | `#60a5fa` | **7.36** |
| success | `#082a22` | `#a7f3d0` | **12.00** | `#34d399` | **8.01** | `#34d399` | **9.74** |
| warning | `#2a1d0b` | `#fde68a` | **13.18** | `#fbbf24` | **9.84** | `#fbbf24` | **11.22** |
| danger | `#2b1216` | `#fecaca` | **12.09** | `#f87171` | **6.32** | `#fca5a5` | **9.86** |

Dark `danger-solid` is `#fca5a5` rather than `#f87171` because dark ink on `#f87171` measures 6.77:1, which misses 7:1. `#fca5a5` reaches 9.86:1.

### 6.3 The tinted background is not enough on its own

A light semantic background against the page canvas is barely distinguishable: `#eff6ff` against `#f8fafc` measures **1.10:1**. In dark, `#0b2f47` against `#0b1220` measures **1.35:1**.

So the tint never defines the region. The region is defined by a **4px `edge` bar on the inline start**, which clears 7:1 against its own tint in every family and theme. Every semantic component therefore carries three signals: an icon with a distinct shape, a text label naming the severity, and the edge bar. Colour is the fourth, never the first.

### 6.4 Do not reuse semantic colour for identity

`success` means an operation completed. It does not mean "privacy". The security banner in `App.tsx` currently renders "Zero-Trust Mode Active" in `emerald-600`, measured at **3.73:1**, which fails AA. The privacy property is the product's central claim and it deserves `text` and `accent`, not a status green that was picked because green feels safe. It is a persistent architectural fact, not an event outcome.

---

## 7. Chart colour

This is the section where the honest answer is uncomfortable, so it is stated first.

> **No five-colour categorical palette survives colour vision deficiency on colour alone.** A second visual channel is mandatory for every PRISM chart with more than one series. This is a measured conclusion, given below, not a precaution.

### 7.1 Two palettes, one per theme

A single palette cannot clear 3:1 against both a white plot background and a near-black one (Section 2.5). PRISM ships two, each built as a **luminance ladder** so the series order survives greyscale printing and total colour blindness.

**Light**, measured against `#ffffff` / `#f1f5f9` / `#f8fafc`:

| Slot | Value | on surface | on sunken | on canvas |
|---|---|---|---|---|
| `chart-1` | `#2c105d` | **15.68** | 14.31 | 14.99 |
| `chart-2` | `#114162` | **10.73** | 9.80 | 10.26 |
| `chart-3` | `#11605e` | **7.35** | 6.71 | 7.02 |
| `chart-4` | `#ba4e00` | **5.03** | 4.59 | 4.80 |
| `chart-5` | `#ab8513` | **3.44** | 3.14 | 3.29 |

Worst ratio of any series against any light surface: **3.14**. Ratio between adjacent series: **1.46** at every step, by construction.

**Dark**, measured against `#0b1220` / `#131c2e` / `#0f172a`:

| Slot | Value | on canvas | on surface | on sunken |
|---|---|---|---|---|
| `chart-1` | `#8443f5` | **3.66** | 3.33 | 3.49 |
| `chart-2` | `#258bd4` | **5.10** | 4.64 | 4.86 |
| `chart-3` | `#09b3ad` | **7.19** | 6.54 | 6.85 |
| `chart-4` | `#f1b184` | **10.13** | 9.21 | 9.66 |
| `chart-5` | `#ffe74f` | **14.97** | 13.62 | 14.28 |

Worst ratio of any series against any dark surface: **3.33**. Worst adjacent step: **1.39**.

### 7.2 Colour vision deficiency, measured

The palettes were run through the Machado, Oliveira and Fernandes (2009) severity-1.0 CVD simulation matrices, then re-measured. Source: Machado, G. M., Oliveira, M. M., Fernandes, L. A. F., "A Physiologically-based Model for Simulation of Color Vision Deficiency", IEEE Transactions on Visualization and Computer Graphics, 2009, <https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html>.

The numbers below are a **diagnostic**, not a conformance measure. WCAG does not require a contrast ratio to be computed on a simulated image.

**Proposed light palette:**

| Vision | Worst ratio between two series | Worst series against background |
|---|---|---|
| Typical | 1.46 | 3.14 |
| Protanopia | **1.08** | 3.41 |
| Deuteranopia | **1.34** | 3.00 |
| Tritanopia | **1.40** | 3.19 |

**Current `ACCESSIBLE_COLORS`, first five, for comparison:**

| Vision | Worst ratio between two series | Worst series against background |
|---|---|---|
| Typical | 1.10 | **2.21** |
| Protanopia | 1.10 | **1.98** |
| Deuteranopia | 1.06 | **2.39** |
| Tritanopia | 1.09 | **2.05** |

Read this carefully, because it is the part that matters.

The proposed palette is **strictly better on the requirement that is actually a WCAG requirement**: no series ever drops below 3.00:1 against its background under any simulated vision, where the current palette falls to 1.98:1.

The proposed palette is **not meaningfully better at separating series from one another under protanopia**: 1.08 against 1.10. A luminance ladder does not survive protanopia, because protanopes perceive long-wavelength light as substantially darker, which collapses a ladder that was built on standard luminance.

Therefore the honest conclusion is that the `ACCESSIBLE_COLORS` comment in `SmartChart.tsx:67`, "selected for colorblind users", overstates what any palette can deliver. The palette is not the mechanism. The second channel is.

### 7.3 The mandatory second channel

Every chart with more than one series must encode series identity twice. Colour plus one of:

| Chart type | Required second channel |
|---|---|
| Line | dash pattern per series, and a direct end-of-line label |
| Bar, grouped | a fill pattern or a per-bar direct value label |
| Scatter | marker shape per series (circle, square, triangle, diamond, cross) |
| Pie or donut | direct labels with leader lines. No standalone legend. |
| Area, stacked | direct in-band labels where the band is tall enough, otherwise a table |

**Five series is the ceiling.** A sixth category becomes `Other` in `--prism-chart-other`, and the full breakdown moves to the accompanying data table. The data table already exists: `SmartChart.tsx:184` renders a `sr-only` `role="table"` mirror of every chart. That table should be promoted from screen-reader-only to a `<details>` element that any user can open, because it is the most accessible thing in the product and it is currently hidden from the people who could most easily use it.

### 7.4 Axis versus grid

| Token | Light | Ratio | Dark | Ratio | Status |
|---|---|---|---|---|---|
| `chart-axis` | `#767f8f` | **4.04** | `#657185` | **3.45** | load bearing, needs 3:1 |
| `chart-grid` | `#cbd5e1` | 1.48 | `#334155` | 1.64 | decorative, exempt |

The axis line and its tick labels convey the scale, so they must clear 3:1. Interior grid lines are a reading aid whose information is duplicated by the axis, so they are exempt and are deliberately kept quiet.

### 7.5 Truncation must be visible, not just true

`prism_core.py` truncates chart input with `head(n)`: 500 rows for scatter, 100 for line and preview, 15 for bar, 10 for value counts. That is a head, not a sample, and the user is not told.

This is a correctness problem before it is a design problem, and it is being handled in the technical roadmap. The design obligation is narrower and belongs here: whenever a chart renders fewer rows than the dataset contains, the chart frame must carry a persistent visible notice in `--prism-chart-truncation-note`, naming the number shown, the number available, and the word **first** rather than the word *sample*. It is not a tooltip, it is not `sr-only`, and it does not disappear on hover. A silently truncated chart in an audit workpaper is a finding against the auditor.

---

## 8. Type

### 8.1 The scale

Kept close to what `tailwind.config.js` already defines, because that scale is sound: a 16px floor, an 18px default body, and a ratio near 1.125 at the small end widening to 1.25 at the display end.

| Token | rem | px at default | Leading | Use |
|---|---|---|---|---|
| `--prism-text-050` | 0.75 | 12 | 1.5 | axis ticks, legal. Never body. |
| `--prism-text-100` | 0.875 | 14 | 1.5 | metadata, chips, table meta |
| `--prism-text-200` | 1 | 16 | 1.5 | minimum body size |
| `--prism-text-300` | 1.125 | 18 | 1.6 | **default body** |
| `--prism-text-400` | 1.25 | 20 | 1.6 | lead paragraph, card title |
| `--prism-text-500` | 1.5 | 24 | 1.5 | h4, section heading |
| `--prism-text-600` | 1.875 | 30 | 1.4 | h3 |
| `--prism-text-700` | 2.25 | 36 | 1.3 | h2 |
| `--prism-text-800` | 3 | 48 | 1.2 | h1, hero |

One change from the current config: it maps `xs` to 14px and has no 12px step. That means axis tick labels and a chip label are forced to the same size. A 12px step is added and is restricted by rule to axis ticks and legal text, never to anything a user must read to operate the product.

### 8.2 Everything is in rem

`html { font-size: 100% }` in `src/styles/index.css:43` is correct and must stay. It means 1rem equals whatever the user set in their browser. `App.tsx` then sets `root.style.fontSize` to `100%`, `125%` or `150%` for the A / A+ / A++ control. Because that is also a percentage, it multiplies the user's preference rather than replacing it. A user at 20px browser default who chooses A++ gets 30px. That behaviour is right and should be preserved.

The consequence: no font size, no target size, no container width and no spacing value may be expressed in px. `tokens.css` holds to this everywhere except border widths and shadow offsets, which are hairlines and should not scale.

### 8.3 Weight, tracking, numerals

Four weights only: 400, 500, 600, 700. The `system-ui` stack cannot be relied on to render more than four distinct weights across Windows, macOS and Linux.

Negative tracking only at `--prism-text-700` and above. At body size it costs legibility and returns nothing.

**Every numeral in a table, a statistic or a test result uses `font-variant-numeric: tabular-nums lining-nums`.** A p-value column where the digits shift width between rows is harder to scan and looks unserious in a document that will be attached to a workpaper. `tokens.css` provides `[data-numeric]` and `.prism-numeric` for this.

---

## 9. Space and layout

### 9.1 The grid

A strict 4px grid: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. Nothing off the scale. The current build already holds to this by using Tailwind defaults, and the discipline is worth naming so it survives the first hand-written value.

### 9.2 Targets

| Token | Value | Basis |
|---|---|---|
| `--prism-target-min` | 24px | SC 2.5.8 Target Size (Minimum), AA |
| `--prism-target` | **44px** | SC 2.5.5 Target Size (Enhanced), AAA. PRISM's floor. |
| `--prism-target-large` | 48px | primary actions, dropzone button |
| `--prism-target-gap` | 8px | minimum separation between adjacent targets |

The 44px floor applies to buttons, selects, tabs, summaries and text inputs. It does **not** apply to links inside a sentence, which SC 2.5.5 exempts and which the current `src/styles/index.css:99` rule wrongly includes. See D12.

### 9.3 Two containers, not one

| Token | Value | For |
|---|---|---|
| `--prism-container-text` | 46rem (736px) | running prose, help text, insight descriptions, error explanations |
| `--prism-container-app` | 80rem (1280px) | tables, chart grids, tool chrome |
| `--prism-measure` | 68ch | hard cap on any paragraph, regardless of container |

The current build puts everything in `max-w-7xl`, which gives roughly 135 characters per line for body copy (D11, with the character-width assumption stated there). Prose gets its own narrower container and a `ch`-based cap so the limit holds when the user enlarges text.

### 9.4 Density

One density, not a toggle. A density switch doubles every spacing decision and every visual regression test, and PRISM has no users yet to tell us which one they want. Revisit when there is evidence.

---

## 10. Elevation

Five levels, each a shadow **and** a border obligation.

| Alias | Level | Light shadow | Dark treatment | Border required |
|---|---|---|---|---|
| `flat` | 0 | none | none | `border-subtle` if it needs an edge |
| `card` | 1 | `0 1px 2px / 0.06, 0 1px 3px / 0.10` | shadow plus 4 percent inset top highlight | `border` |
| `raised` | 2 | `0 2px 4px / 0.08, 0 4px 8px / 0.10` | shadow plus 5 percent inset | `border` |
| `popover` | 3 | `0 4px 8px / 0.08, 0 12px 20px / 0.12` | shadow plus 6 percent inset | `border` |
| `modal` | 4 | `0 8px 16px / 0.10, 0 24px 40px / 0.16` | shadow plus 8 percent inset | `border-strong` |

Three rules.

**Shadows are never the only boundary.** In forced-colors mode `box-shadow` is dropped entirely. A card whose only edge is a shadow becomes an invisible region. Every elevated surface carries a border token as well.

**Dark elevation is a top highlight, not a bigger shadow.** A black shadow on a near-black canvas is invisible. The dark values in `tokens.css` add an `inset 0 1px 0` white highlight at 4 to 8 percent, which is how the eye reads a raised surface in a dark interface.

**Elevation is not decoration.** It encodes distance from the page. A stat tile is not closer to the user than the panel containing it. The current build gives `.card` a `shadow-xl`, which is level 4 geometry on a level 1 object.

---

## 11. Motion

### 11.1 Duration tokens

| Token | Value | Use |
|---|---|---|
| `--prism-duration-fast` | 120ms | hover, press, colour change |
| `--prism-duration-base` | 200ms | panel open, tab change |
| `--prism-duration-slow` | 320ms | modal, route transition |
| `--prism-duration-spinner` | 900ms | the one permitted indefinite loop |

No component may hard-code a duration. Every duration is a token so that reduced motion can collapse the whole system in one place.

### 11.2 Reduced motion, done properly

`tokens.css` sets `fast`, `base` and `slow` to 1ms and zeroes the translation distance tokens under `prefers-reduced-motion: reduce`. It deliberately does **not** kill the spinner. It slows it to 2000ms instead.

This is a departure from the global `animation-duration: 0.01ms !important` recipe in `src/styles/index.css:48`, and D9 is why. A reduced-motion user who starts a Pyodide cold start currently gets a frozen circle with no way to tell loading from hung. The rule that resolves it:

> **Every spinner must be accompanied by a text status that changes.** If the only way to tell that work is happening is that something is spinning, the component is wrong for a reduced-motion user, a screen-reader user, and anyone looking at a screenshot. `App.tsx` already does this with `{processing.progress}% complete`. The three `AnalyticsWorkspace` spinners do not, and must.

A slowed spinner honours the preference (2000ms is a gentle, non-vestibular rotation) without removing the signal. A user who wants no motion at all can still read the text.

### 11.3 What is removed

`.float` (6s infinite), `.pulse-glow` (2s infinite), `.shimmer` (1.5s infinite) and `.gradient-border`. They are decorative, they loop forever, and SC 2.2.2 asks for an in-page mechanism to stop motion that runs beyond five seconds. An OS preference is not that mechanism. Removing them is cheaper than building a pause control for decoration.

`.shimmer` has one legitimate use, a skeleton placeholder, and Section 3 of COMPONENTS.md specifies a static skeleton instead: a `surface-sunken` block with no animation. It reads as "not yet loaded" without moving.

### 11.4 What motion is for

Motion in PRISM does exactly one job: showing that something moved from one place to another, or that a new region appeared. Entrance is opacity plus `--prism-motion-rise` (4px). Exit is opacity only, and faster. Nothing draws attention to itself, and nothing loops.

---

## 12. Theming

### 12.1 Four states, one set of tokens

| State | Trigger | Where in `tokens.css` |
|---|---|---|
| Light | default | Section 1, bare `:root` |
| Dark | `.dark`, `[data-theme="dark"]`, or OS preference without an explicit light choice | Section 2 |
| Increased contrast | `.high-contrast`, or `prefers-contrast: more` | Section 10 |
| Forced colors | `forced-colors: active` | Section 11 |

Light is defined on bare `:root` so that no value depends on a media query alone. A token that exists only inside `@media (prefers-color-scheme: dark)` produces an unstyled page in any context where the query does not evaluate.

### 12.2 Increased contrast responds to both the OS and the app

Currently only the in-app control reaches `.high-contrast` (D13). `tokens.css` also binds `@media (prefers-contrast: more)`, which does not repaint the palette but does remove the low-contrast tiers: `text-tertiary` is promoted to `text-secondary`, `text-disabled` is promoted to `text-secondary`, `border-subtle` becomes `border`, `border` becomes `border-strong`, border width goes to 2px and the focus ring outer width goes to 3px.

That transformation is safe by construction. It only ever raises a token to another token that has already been measured.

### 12.3 Forced colors

In forced-colors mode the browser replaces colour. The job is to stop fighting it.

- Every colour token maps to a system colour keyword: `Canvas`, `CanvasText`, `LinkText`, `Highlight`, `HighlightText`, `GrayText`.
- Every elevation goes to `none`, and the borders that Section 10 already mandated take over.
- Chart hues collapse to `CanvasText`, and series identity is carried entirely by the second channel from Section 7.3. This is the strongest argument for the second channel: in forced colors it is the *only* channel.
- `backdrop-filter` and background images must be disabled. This is not expressible in `tokens.css` because it is a property, not a value, and it belongs in the component layer. See D14.

---

## 13. What may and may not be claimed

This section exists because the repository currently contains claims that the code does not support, and because PRISM's entire commercial position rests on its claims being checkable.

### 13.1 Claims that are false today and must be removed

| Claim | Where | Why it is false |
|---|---|---|
| "WCAG 2.2 Level AAA" | README, `App.tsx` features grid, `FileUploader.tsx:10` docblock, `tailwind.config.js` comment | No audit has been performed. The audit in Section 2 finds fourteen defects, of which D1, D2 and D5 are conformance failures at AA, below the claimed level. |
| "Designed for WCAG 2.2 Level AAA compliance: minimum 7:1 contrast ratio for normal text" | `tailwind.config.js` colour block comment | The palette it introduces produces 4.05:1 links, a 2.77:1 focus ring and 4.51:1 badges. The comment describes an intention as an achievement. |
| "ISO/IEC 27001:2022" | README | Out of scope for this document. Named because it sits in the same sentence and carries the same risk. |

### 13.2 What may be said instead, and is true

- "Designed against WCAG 2.2 Level AAA contrast thresholds. Every colour pair in the system has a published, measured ratio."
- "Contrast ratios are computed from the W3C relative-luminance formula and are reproducible from `docs/design/ui/tokens.css` with the script in `DESIGN_SYSTEM.md` section 1.3."
- "The interface ships a keyboard skip link, ARIA landmarks, live regions on every asynchronous operation, a screen-reader data table for every chart, a 44px minimum target size, an in-product text-size control, a high-contrast theme and full support for `prefers-reduced-motion`, `prefers-contrast` and Windows forced-colors mode." Every item in that list is verifiable in the source.
- "A third-party accessibility audit has not been performed."

That last sentence is an asset, not a liability, for an audience of auditors. PRISM's positioning rests on refusing to assert what has not been verified. An accessibility badge nobody checked is exactly the kind of claim this company exists to be the opposite of.

### 13.3 The regression test that makes the claim durable

Contrast is the one accessibility property that can be tested mechanically with no browser and no user. The system should ship a test that parses `tokens.css`, extracts every token, and asserts every documented pair against its threshold. It fails the build on any regression.

That test is the difference between "we measured it once in September 2026" and "it is measured on every commit". It belongs in the same test suite the engineering team is building now, and it is the cheapest accessibility test the project will ever write.

---

## 14. Migration order

Ordered by user impact per unit of work. Each step is independently shippable.

| Step | Change | Defects closed | Blast radius |
|---|---|---|---|
| 1 | Import `tokens.css`. Replace the global `:focus-visible` outline with `--prism-focus-ring`. | D1 | one rule in `src/styles/index.css` |
| 2 | Retire `opacity-50` on disabled controls for the sunken-fill treatment. | D4 | `.btn` |
| 3 | Move the link colour to `--prism-color-accent-text`. Remove `a` from the 44px rule. | D5, D12 | two rules |
| 4 | Rebuild the dropzone states on `--prism-color-border-strong` plus a semantic edge. | D2 | `FileUploader.tsx` |
| 5 | Replace `.gradient-text` with `--prism-color-text`. Replace the `.btn-primary` gradient with `--prism-color-accent-solid`. Replace the active-tab gradient with the same. | D3 | three rules, three components |
| 6 | Replace `.glass-card` with `surface` plus `elevation-card` plus `border`. Remove `.mesh-bg`. | D6, D6b | every component, but mechanically |
| 7 | Split the chart palette into light and dark token sets. Add the mandatory second channel. Surface the truncation notice. | D8, and the truncation issue in 7.5 | `SmartChart.tsx` |
| 8 | Promote the badges into the AAA band. Move the security banner off `success` green. | D7, and 6.3 | `.badge-*`, `App.tsx` |
| 9 | Scope the reduced-motion override so spinners slow rather than freeze. Add a text status to the three `AnalyticsWorkspace` spinners. Delete `.float`, `.pulse-glow`, `.gradient-border`. | D9, D10 | `src/styles/index.css` |
| 10 | Add `prefers-contrast: more`. Disable `backdrop-filter` and background images in high-contrast and forced-colors. Offer a light high-contrast variant. | D13, D14 | `src/styles/index.css`, `App.tsx` |
| 11 | Introduce `--prism-container-text` and `--prism-measure` for prose. | D11 | layout only |
| 12 | Add the contrast regression test from 13.3. Remove the AAA claims from the README, `tailwind.config.js` and `App.tsx`. | 13.1 | docs and CI |

Steps 1 through 5 close every AA conformance failure in the audit and touch fewer than a dozen rules. They should ship together.

> Note on file ownership: this document and `tokens.css` live under `docs/design/ui/`. None of the migration steps above have been applied to `src/`, `index.html`, `package.json` or the Tailwind config. They are a proposal for the team that owns those files.

---

## 15. Open items

Recorded so they are not mistaken for settled.

1. **Font.** The system stack is the right default for a browser-only tool with no network egress: zero bytes, zero latency, no CDN in the CSP. A licensed face would have to be inlined as base64 in the bundle, which is at odds with the 564kB chart chunk already in the build. Recommendation: stay on system-ui and spend the identity budget on the logo. Not yet decided.
2. **Dark as the default.** The dark palette measures better than the light one and matches the tool's context. No user evidence exists either way. Not decided.
3. **The `PrismLogo` SVG gradients.** `App.tsx` hard-codes six gradient stops inside the logo markup. The logo is a brand asset, not UI, and is exempt from Section 4.6. Its contrast against both canvases has not been measured.
4. **Chart luminance ladder versus perceptual uniformity.** The palettes in Section 7.1 were built in HSL against measured WCAG luminance. Building them in OKLCH would give more even perceptual steps at the same measured ratios. Worth doing, not worth blocking on.
5. **Sonification colours.** `SmartChart.tsx:236` renders a sonification control on a `prism-100` / `prism-900` background. It was measured (5.17:1 light) but the feature was not reviewed as a whole.
