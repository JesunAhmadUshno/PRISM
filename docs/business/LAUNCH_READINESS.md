# PRISM: Launch Readiness

**Owner:** Chief of Staff
**Date:** 2026-09-13
**Audience:** The founder. This is not a document to show a customer.

---

## The verdict

**No. PRISM cannot launch today.**

Not "launch carefully", not "soft launch to a small list", not "launch and fix in
public". No.

The reason is narrow and it is not the one most of the reporting functions expected.
PRISM's architecture is sound and its central claim is true. I verified the claim myself
rather than accepting it: `src/stores/prismStore.ts:174` to `:183` creates the Web Worker
from a `blob:` URL specifically so it inherits the document's Content Security Policy,
with a regression test at `src/stores/prismStore.test.ts:85` to `:87` asserting the
worker source contains no `WebSocket`, `XMLHttpRequest` or `sendBeacon`. Exactly one
production `fetch` exists, at `src/workers/prism.worker.js:1271`, to the CDN named in the
policy, with a pinned integrity hash and `credentials: 'omit'`. The claim is real and it
is now enforced by the browser rather than by code review.

That is not what blocks the launch. What blocks the launch is that **the repository
currently makes eleven public statements that are false, and the product silently returns
wrong answers in at least four documented ways.**

The intended first audience is auditors, IT risk, healthcare analysts and litigation
support. They are professional verifiers. The launch message is "do not trust us, check
it yourself." We are inviting an audit and there are false claims sitting in the file
they will open first. A single one of those is enough to discredit the true claim
underneath, and the true claim is the entire company.

The gap is not large. Most of the blocking list is deletion, not construction. But it is
not zero, and today is the wrong day.

---

## What actually improved

Stated first so the rest is read correctly, and because three of the reporting functions
were working from a stale picture.

| Was reported as | Is actually true today | Evidence |
|---|---|---|
| Zero tests exist | 6 test files, 98 tests, all passing in 1.27s | `npx vitest run`, 2026-09-13 |
| The worker runs outside the CSP, enforced only by code review | The worker is built from a `blob:` URL and inherits the document policy container | `src/stores/prismStore.ts:174` to `:183` |
| There is not one `fetch` anywhere in `src/` | One, deliberate, pinned with SHA integrity, to the allowlisted CDN | `src/workers/prism.worker.js:1271` |
| Descriptive statistics only | 17 SciPy inferential tests dispatched from the worker | `prism.worker.js` test_id dispatch |
| No marketing site | 3,152 lines built, responsive, verified in headless Chrome at three widths | `web/` |

This is real progress and none of it should be discounted. It also means two of the
gates the marketing plan was waiting on have partially closed on their own.

---

## Blocker checklist

Three severities:

- **BLOCKER.** The launch does not happen until this is closed. Every one of these
  either publishes a false statement or produces a wrong answer that a user cannot see.
- **SHOULD-FIX.** Closing it before launch is strongly preferred. Shipping without it
  is a real cost, taken knowingly.
- **NICE-TO-HAVE.** Improves the product. Does not gate anything.

Severity here is assigned on one axis only: **would a reviewer who found this conclude
that PRISM's claims cannot be trusted?** That axis, not effort and not user impact, is
the right one for a company whose product is a claim.

---

### BLOCKERS

**B1. `xlsx@0.18.5`: prototype pollution and ReDoS, no fix available.**
Severity: **BLOCKER**

Evidence: `npm audit` returns `xlsx` at severity **high** with `"fixAvailable": false`,
via GHSA-4r6h-8v6p-xvw6 (Prototype Pollution in SheetJS) and GHSA-5pgg-2g8v-p4x9
(ReDoS). Still installed in `package.json` dependencies. Still statically imported at
`src/stores/prismStore.ts:11`, so it loads eagerly on every page view whether or not the
user opens an Excel file.

Why it blocks: `XLSX.read` is called at `src/stores/prismStore.ts:115` on bytes the user
just dragged in. That is the exact reachable path the advisory describes. Engineering has
bracketed it defensively (`prismStore.ts:103` to `:113` snapshots `Object.prototype` keys
before the parse and strips additions afterwards, on both the success and error paths),
which is genuinely thoughtful mitigation. It is not remediation, and it does not change
what `npm audit` prints.

This audience runs `npm audit` before it reads the headline. A security-forward launch
sitting on an unpatched high with no registry fix is the fastest available way to lose
them permanently. Marketing reached this conclusion independently and made it G1.

Fix: the X0 to X7 migration in `TECHNICAL_STRATEGY.md`, landing on the **vendored**
SheetJS build in `public/` (step X9), not the CDN build (step X8). See `GO_TO_MARKET.md`
C5 for why the CDN variant is not an acceptable intermediate state.

---

**B2. A production dependency carries a CRITICAL advisory and is used nowhere.**
Severity: **BLOCKER**

Evidence: `npm audit --json` reports `fast-xml-parser` at severity **critical**
(GHSA-m7jm-9gc2-mpf2, entity encoding bypass via regex injection in DOCTYPE entity
names, plus five more). It is declared in `package.json` dependencies.
`grep -rn "fast-xml-parser\|XMLParser\|XMLValidator" src/` returns **nothing**.
`papaparse` is likewise a declared production dependency with no import anywhere in
`src/`.

Why it blocks: it is a critical-severity finding in the production dependency tree of a
security product. It will appear in the SBOM, in `npm audit`, and in the first automated
scan any buyer runs. That it is unreachable in our code is a defence we would have to
make in a conversation we should never be in.

This is also the single cheapest security win available: **deleting two unused lines from
`package.json` removes a critical advisory.** No code changes. Nothing to test beyond a
build.

Nobody reported this. Every function's brief describes the dependency problem as one
high-severity CVE.

---

**B3. XML is advertised everywhere and has no parser.**
Severity: **BLOCKER**

Evidence: `src/security/validator.ts:157` lists `xml` in `supportedExtensions`.
`validator.ts:52` to `:56` validates `<?xml` magic bytes, so a real XML file passes
validation. `src/stores/prismStore.ts:154` then reads it with `file.text()`. The worker
contains **zero** XML handling (`grep -in xml src/workers/prism.worker.js` returns
nothing) and the text goes to `pd.read_csv` at `prism.worker.js:143`.

So a user drops in a valid XML file, every security check passes, and pandas is handed
XML and told it is CSV.

XML appears in `README.md`, seven times in `web/index.html`, and in `POSITIONING.md`,
`MESSAGING.md`, `SEO_STRATEGY.md`, `llms.txt` and the AEO answer blocks. It is in the
product's one-line description in `package.json`.

Why it blocks: this is not a bug, it is an advertised capability that does not exist. One
third of the stated input formats. A reviewer who tries all three formats finds it in
under a minute, and they will try all three, because that is what the marketing site
tells them to do.

Fix: remove `xml` from `supportedExtensions` and from all copy. One line plus a copy
pass. Building a real parser is the alternative and is not recommended before discovery.

Nobody reported this either. The likely reason is that `fast-xml-parser` is a declared
dependency (B2), so every function reasonably assumed something was using it.

---

**B4. The README asserts five compliance conformances, all unverified.**
Severity: **BLOCKER**

Evidence: `README.md:99` to `:103` is a table: ISO/IEC 40500:2025 / WCAG 2.2 AAA /
Compliant. EN 301 549 / EU Accessibility / Compliant. ISO/IEC 27001:2022 / Information
Security / Compliant. GDPR Article 32 / Data Security / Compliant. PIPEDA / Canadian
Privacy / Compliant. Plus a WCAG 2.2 AAA badge at `README.md:4` and the heading
"Security (ISO/IEC 27001:2022 Compliant)" at `README.md:17`.

None is backed. ISO 27001 is a certification of an organisation's management system,
issued by an accredited body after an audit. There has been no audit. There is no
management system. The company has one person and no documented controls.

The accessibility claim is worse than unsupported, it is **contradicted by our own
work**: `docs/design/ui/DESIGN_SYSTEM.md` measures the focus indicator failing the 3:1
non-text contrast threshold on every light surface it lands on, and measuring exactly
1.00:1 against the active tab because the ring colour and the tab fill are both
`prism-500`. That is a Level AA failure documented in this repository underneath a Level
AAA claim in this repository.

Why it blocks: the founder is ex-KPMG IT Advisory and ran ISO 27001 audits. Of every
false statement in the repository, this is the one the target audience is most qualified
to catch and least likely to forgive, precisely because the founder's credential says he
knows better. It converts the strongest asset in the pitch into the sharpest weapon
against it.

Fix: delete the table. `docs/legal/COMPLIANCE_POSTURE.md` already contains the ten-row
replacement ledger of what is actually defensible, each row checkable by a stranger
without our cooperation. It is written and ready.

---

**B5. Four documented ways the product returns a silently wrong answer.**
Severity: **BLOCKER**

Evidence, each verified today:

| Defect | Location | What the user sees |
|---|---|---|
| Only the first worksheet of any workbook is read | `src/stores/prismStore.ts:118`, `workbook.SheetNames[0]` | A complete-looking analysis of sheet 1 of 12. No notice |
| Charts truncate with `head(n)`, not a sample | `prism.worker.js:1030` (10), `:1041` `:1053` (15), `:1065` `:1080` `:1099` `:1114` (100), `:1087` (500) | A bar chart of the first 15 of 400 categories, presented as the data |
| Two-group tests silently use only the first two groups | `prism.worker.js:615` and `:711`, `df[group_col].dropna().unique()[:2]` | A t-test p-value across five treatment arms, computed on two of them |
| Shapiro-Wilk silently subsamples at 5,000 rows | `prism.worker.js:575` to `:576`, `col_data.sample(5000)` | A normality verdict on a random 5,000 of 80,000 rows, labelled as the result |

Why it blocks: the buyer is a person whose job is checking numbers, and they will put
this output into a workpaper. The UX team classified these as S1, defined as the product
producing a wrong answer the user cannot detect, and they are right. The technical team
named the worksheet defect the most likely source of a wrong answer in the product today,
and they are right too.

None of these is a performance problem or a polish problem. Each is the product
confidently reporting something that is not true, which is the one failure a
correctness-focused audience cannot absolve. A tool that is slow gets a second chance. A
tool that lies about a p-value does not.

Fix: none of the four requires architecture. Truncation needs a visible notice and a
count. The worksheet needs a picker, or at minimum a notice naming the sheet read and the
sheets skipped. The group tests need to refuse rather than silently truncate. Shapiro
needs to say it subsampled.

---

**B6. The dependency audit gate is disabled, and the CI comment says so.**
Severity: **BLOCKER**

Evidence: `.github/workflows/ci.yml:133`, `continue-on-error: true` on the `npm audit`
step. The comment block above it (`:121` to `:131`) explains the reasoning honestly and
ends: "DELETE the `continue-on-error` line below and this becomes a hard gate. That
removal is the acceptance criterion for that work."

The reasoning is correct engineering judgement. A gate that is red for reasons a PR
author cannot fix gets muted, and a muted gate gates nothing. But the consequence is that
PRISM today has **no** enforcement against a new advisory entering the tree, in a product
whose pitch is dependency discipline.

Current state: 22 advisories, 3 critical, 12 high (`npm audit --json`, 2026-09-13).

Why it blocks: the gate must be live before launch, not because of today's advisories but
because of the next one. Launching with it disabled means the first post-launch
regression is found by a reader rather than by CI.

Fix: B1 and B2 remove the two that cannot be bumped. The remaining highs are transitive
dev tooling with fixes available. Then delete line 133, as the file instructs.

---

**B7. No test verifies a single statistical result.**
Severity: **BLOCKER**

Evidence: 98 tests pass across 6 files. All of them live in `src/test/security/`,
`src/test/stores/` and `src/stores/`. `vitest.config.ts` restricts coverage `include` to
`src/security/**/*.ts` and `src/stores/**/*.ts`. The 1,710 line
`src/workers/prism.worker.js`, which contains all 17 statistical tests, all five
components and `App.tsx` are outside the coverage report entirely.

So the correct statement is not "zero tests". It is: **the security boundary is tested,
and the thing the product computes is not.** A coverage percentage published from this
configuration would be arithmetically true and materially misleading, which is the exact
failure mode we intend to criticise in competitors.

Why it blocks: B5 establishes that four statistical outputs are wrong today. They were
found by reading the code, not by a failing test, which means nothing would have caught
them and nothing will catch the fifth. Until the 17 tests are checked against published
reference values, PRISM cannot make any correctness claim, cannot sell a paid tier, and
cannot sign the no-egress warranty finance wants in the Enterprise MSA, because a
warranty is worthless from a vendor whose output is unverified.

This is the gate that unlocks revenue. It should be resourced like it.

Fix: known-answer tests for all 17 against published reference values (R, SciPy's own
documented examples, or a textbook). Widen the coverage `include`.

---

**B8. The licence is incoherent in four directions and MIT has a clock on it.**
Severity: **BLOCKER**

Evidence: `LICENSE` contains the **MIT License** text, "Copyright (c) 2026 PRISM
Analytics", granting permission free of charge to any person obtaining a copy.
`package.json` says `"license": "PROPRIETARY"` and `"private": true`. `README.md` reads
as an open source project. `package.json` `repository.url` is the placeholder
`https://github.com/organization/prism.git`.

Why it blocks: two separate reasons.

The commercial one: finance sells a Source/OEM tier at a $50,000 floor and an Enterprise
tier at $12,000 with a contractual warranty. Neither is sellable while the repository
cannot say what licence it is under. A buyer's counsel stops at this page.

The legal one, which is more urgent and is the reason this is a BLOCKER rather than a
SHOULD-FIX: **MIT is irrevocable for anything already distributed under it.** The text is
on disk now. Every day it stays there widens the set of code someone can later argue was
released permissively. This is the only item on this list that gets worse on its own
while nothing happens.

Fix: `docs/legal/LICENSE_RECOMMENDATION.md` recommends source-available with a scheduled
conversion to Apache 2.0, and argues it rather than presenting a menu. Adopted in
`GO_TO_MARKET.md` C10. It is a founder decision plus three file edits.

---

### SHOULD-FIX

**S1. The bundle split does not do what `vite.config.ts` claims.**
Evidence: `dist/chunks/vendor-react-*.js` is **37 bytes**. React, plus the statically
imported `xlsx`, are inside the 565,555 byte entry chunk. `dist/chunks/vendor-charts-*.js`
is 564,384 bytes and loads regardless of whether a chart is drawn. Total `dist/` is
roughly 1.3 MB before Pyodide.

Why: a performance-minded audience checks the network waterfall on a tool whose entire
argument is about the network tab. They will open DevTools. That is what we asked them to
do. Not a blocker because it is embarrassing rather than false.

**S2. `MAX_FILE_SIZE` contradicts its own docstring by a factor of ten.**
Evidence: `src/security/validator.ts:16` to `:20`. The comment says "Maximum file size:
50MB / Prevents memory exhaustion attacks". The constant is `500 * 1024 * 1024`.

Why: the product has no agreed maximum input size, and the error message shown to users
is generated from the constant. Marketing correctly refused to publish a size ceiling
because of exactly this. A 400MB file will be accepted and will fail somewhere deeper,
badly. Not a blocker only because the failure is loud rather than silent.

**S3. The marketing site has three unresolved placeholders.**
Evidence: `web/index.html:113`, `:142`, `:768` all link to `href="/app/"`;
`:806` is `mailto:REPLACE@example.invalid`. Nine `DEPLOY` markers in the file.

Why: the site is otherwise finished and good. The mailto is the only inbound channel a
product with no telemetry and no signup form has. Trivial to fix, fatal to forget.

**S4. There is no error boundary anywhere in the application.**
Evidence: UX finding U-07. A render exception loses the entire session, and there is no
persistence by design, so the user's work is gone.

Why: high user impact, no false claim attached. It becomes a blocker the moment a real
user has a real dataset open.

**S5. The focus indicator is invisible on the selected tab.**
Evidence: `docs/design/ui/DESIGN_SYSTEM.md` measures 1.00:1 between the focus ring and
the active tab fill, both `prism-500`, and below 3:1 on every light surface.

Why: a keyboard user cannot see where they are. It is a genuine WCAG 2.2 Level AA
failure. It is SHOULD-FIX rather than BLOCKER only because B4 removes the false AAA claim
that makes it a *lie*; after B4 it is an ordinary accessibility defect, and after that it
should be fixed quickly.

**S6. `clearFile()` terminates the worker, destroying the initialised Pyodide runtime.**
Evidence: technical strategy finding, `prismStore.ts`. The next file in the same session
pays a full cold start again, including the roughly 25 MB download if it is not cached.

Why: the second file in a session is where a real user forms their opinion. Roughly half
of a working session happens after the first file.

**S7. No canonical URL exists.**
Evidence: `vite.config.ts` sets `base: '/PRISM/'`, a GitHub Pages project path.
`private: true`. No CNAME. `repository.url` is a placeholder.

Why: growth is right that this makes PRISM uncitable, and right that the same purchase
unlocks the response headers the security roadmap wants. It is SHOULD-FIX rather than
BLOCKER because it gates the *campaign*, not the *truthfulness*, and because it is a
purchase rather than work. It must be done before any public beat.

**S8. `vite.config.ts` sets `worker.format: 'es'` while the worker is constructed as
`{ type: 'classic' }`.**
Evidence: `src/stores/prismStore.ts:186`. The worker needs classic for `importScripts`.

Why: a latent break on any Vite upgrade, in the single most security-critical line in the
codebase. Deserves a comment at minimum and a build assertion ideally.

---

### NICE-TO-HAVE

**N1. `README.md:111` lists Scikit-Learn, which appears nowhere in `src/`.** Minor, but
it is a false statement about the stack and costs one deletion. Fold it into B4's pass.

**N2. `README.md:13` contains an em dash.** House style violation in the most-read file.

**N3. `logo.png` and `favicon.png` are byte-identical 104 KB files.** Brand found the MD5
match. A 104 KB favicon is wasteful, not wrong.

**N4. `merge_datasets` serialises the merged frame back to a CSV string and re-parses
it,** holding all sources plus the merged frame plus its CSV simultaneously. A real
memory ceiling issue, but unmeasured and not on the critical path.

**N5. Chart palette: four of eight colours below 3:1,** in a palette commented "selected
for colorblind users." UI's CVD simulation shows no five-colour palette separates series
under protanopia on colour alone, so a second visual channel is needed regardless. Real
work, no false claim once B4 lands.

---

## Summary

| Severity | Count | Items |
|---|---|---|
| BLOCKER | 8 | B1 to B8 |
| SHOULD-FIX | 8 | S1 to S8 |
| NICE-TO-HAVE | 5 | N1 to N5 |

**Of the eight blockers, five are deletions or corrections rather than construction.**
B2 (delete two dependency lines), B3 (delete one array entry and do a copy pass), B4
(delete a table, paste the replacement that is already written), B8 (pick a licence, edit
three files), and most of B6 (bump versions, delete one CI line). Those five could
plausibly close in a focused week.

The three that are real work are **B1** (the SheetJS migration, ten defined steps), **B5**
(four correctness fixes), and **B7** (known-answer tests for 17 statistical procedures).
B7 is the largest and is the one that unlocks paid revenue.

---

## The blunt version

PRISM has a true and unusual claim, an architecture that genuinely supports it, and a
founder whose background is exactly right for the buyer. That combination is rare and it
is worth protecting.

What it does not have is the discipline, yet, to match the claim. The README asserts five
certifications nobody audited. The product advertises a file format it cannot parse. It
analyses one sheet of a twelve sheet workbook without saying so. It charts the first 15 of
400 categories and calls it the data. It runs a t-test on two of five groups and reports a
p-value. A critical advisory sits in the production dependency tree for a library the code
does not use.

Every one of those is discoverable in under an hour by the exact person we are trying to
sell to, using the exact method we are inviting them to use. The launch strategy is "do
not trust us, verify it yourself." That strategy is correct and it is the best asset this
company has. It is also completely unforgiving, because it hands the reviewer the evidence
and dares them to look.

Do not launch into that. Close the eight blockers, most of which are an afternoon of
deletions, and then the invitation to verify becomes the strongest thing anyone in this
category can say.
