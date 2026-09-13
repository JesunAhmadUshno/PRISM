# PRISM: Go To Market

**Owner:** Chief of Staff
**Date:** 2026-09-13
**Status:** The single sequenced plan. Where any two functions disagree, this document decides.

---

## 0. How to read this document

Nine functions reported: technical strategy, marketing, finance, market research, brand,
UX, UI, growth (SEO and AEO), and legal. They produced roughly 19,700 lines across
`docs/` plus a 3,152 line marketing site in `web/`. The work is good. It also
contradicts itself in eleven places, because each function read the codebase at a
different hour of the same day and the engineering team shipped changes underneath
three of them.

This document does two things and nothing else:

1. It resolves every contradiction, naming which function was overruled and why.
2. It puts the surviving recommendations into one order.

**Rule of evidence used throughout.** Where a function's claim and the repository
disagree, the repository wins. Every factual statement below was re-derived from the
tree on 2026-09-13, with the file and line recorded. Where a number is not measured it
is labelled ASSUMPTION and the reasoning is shown. No figure in this document was
invented.

---

## 1. The fact base, re-verified today

Everything downstream depends on these being right, so they were checked rather than
inherited from the briefs.

| # | Fact | Evidence | Status vs the briefs |
|---|---|---|---|
| F1 | Zero egress is real and now browser enforced | `src/stores/prismStore.ts:162` to `:186` builds the worker from a `blob:` URL so it inherits the document policy container. `src/stores/prismStore.test.ts:85` to `:87` asserts no `WebSocket`, `XMLHttpRequest` or `sendBeacon` in the worker source | **Changed.** Technical strategy says this gap is open |
| F2 | Exactly one production network call exists | `src/workers/prism.worker.js:1271`, `fetch(PYODIDE_BASE + fileName, { integrity, credentials: 'omit' })` | **Changed.** Several briefs say there is no `fetch` anywhere |
| F3 | PRISM performs inferential statistics, not only descriptive | `src/workers/prism.worker.js` dispatches 17 `test_id` values including `independent_t`, `one_way_anova`, `two_way_anova`, `chi_square_ind`, `fisher_exact`, `pearson`, `spearman`, `mann_whitney`, `kruskal_wallis`, `wilcoxon`, `levene`, `linear_regression` | **Contradicted.** Market research states descriptive only |
| F4 | A test suite exists and passes | `npx vitest run` today: 6 files, 98 tests, all passing, 1.27s | **Changed.** Several briefs say zero tests |
| F5 | Coverage measures two directories only | `vitest.config.ts` coverage `include` is `src/security/**` and `src/stores/**`. The 1,710 line worker and all five components are outside it | **New.** No function reported this |
| F6 | `xlsx@0.18.5` is still installed and still statically imported | `package.json` dependencies; `src/stores/prismStore.ts:11` `import * as XLSX from 'xlsx'`. `npm audit`: high, `fixAvailable: false` | Unchanged |
| F7 | The dependency tree carries 22 advisories, 3 critical and 12 high | `npm audit --json`, 2026-09-13 | **New.** Every brief discusses one CVE |
| F8 | `fast-xml-parser` (critical) and `papaparse` are production dependencies imported nowhere in `src/` | `grep -rn "fast-xml-parser\|XMLParser\|papaparse\|Papa\." src/` returns nothing | **New** |
| F9 | XML is an advertised input format with no parser behind it | `src/security/validator.ts:157` accepts `xml`; `src/stores/prismStore.ts:154` reads it as text; the worker has zero XML handling and feeds the text to `pd.read_csv` at `prism.worker.js:143` | **New.** README, `web/index.html` and every positioning document sell XML |
| F10 | Licence state is four way incoherent | `LICENSE` is the MIT licence text; `package.json` says `"license": "PROPRIETARY"` and `"private": true`; README reads open source; `repository.url` is `https://github.com/organization/prism.git` | Confirmed, and worse than briefed |
| F11 | README asserts five compliance conformances with nothing behind them | `README.md:99` to `:103`: ISO/IEC 40500:2025, EN 301 549, ISO/IEC 27001:2022, GDPR Article 32, PIPEDA, each marked Compliant | Confirmed |
| F12 | README lists a library the product does not use | `README.md:111` lists Scikit-Learn. It appears nowhere in `src/` | Confirmed |
| F13 | `MAX_FILE_SIZE` contradicts its own docstring | `src/security/validator.ts:16` to `:20`: comment says 50MB, constant is `500 * 1024 * 1024` | Confirmed |
| F14 | The bundle split does not work | `dist/chunks/vendor-react-*.js` is 37 bytes. React and `xlsx` are inside the 565,555 byte entry chunk. `dist/chunks/vendor-charts-*.js` is 564,384 bytes | Confirmed |
| F15 | Charts truncate with `head(n)` and say nothing | `prism.worker.js:1030` (10), `:1041` and `:1053` (15), `:1065` `:1080` `:1099` `:1114` (100), `:1087` (500) | Confirmed |
| F16 | Three statistical results can be silently wrong | `prism.worker.js:615` and `:711` take `unique()[:2]`, comparing only the first two groups; `:575` to `:576` subsamples Shapiro-Wilk at 5,000 rows | Confirmed |
| F17 | Only the first worksheet of a workbook is ever read | `src/stores/prismStore.ts:118`, `workbook.SheetNames[0]` | Confirmed |
| F18 | The dependency audit gate does not gate | `.github/workflows/ci.yml:133`, `continue-on-error: true` on the `npm audit` step, with the reasoning written above it | Confirmed, and the comment names its own removal as the acceptance criterion |
| F19 | There is no domain and no stable canonical URL | `vite.config.ts` sets `base: '/PRISM/'`; `private: true`; no CNAME anywhere | Confirmed |
| F20 | The marketing site is built and has three unresolved placeholders | `web/index.html`, 827 lines, `href="/app/"` at `:113` `:142` `:768` and `mailto:REPLACE@example.invalid` at `:806` | Confirmed |

F3, F5, F7, F8 and F9 are new. F8 and F9 materially change the plan.

---

## 2. The eleven contradictions, resolved

Each entry names the functions in conflict, the ruling, and who was overruled.

### C1. Is the worker CSP gap open or closed?

**Technical strategy** (`TECHNICAL_STRATEGY.md:72` to `:81`) calls this its headline
finding: the `<meta>` CSP does not govern a worker loaded from an `https:` URL, so zero
egress is enforced by code review rather than by the browser, and schedules the fix for
Month 3. **Legal**, **AEO** and the **web build** all report the gap closed.

**Ruling: the gap is closed. Technical strategy is overruled on the finding and upheld
on the remedy.**

`src/stores/prismStore.ts:174` to `:183` now creates the worker from a `blob:` URL with
a source comment giving exactly the reasoning above, and `prismStore.test.ts` asserts
it. Because `blob:` is a local scheme, the worker inherits the creating document's
policy container. Browser enforcement is real today.

The Month 3 host migration survives, with its justification demoted and corrected. A
`<meta>` CSP cannot express `frame-ancestors` and cannot carry a report endpoint, and a
header delivered policy does not depend on a future engineer swapping the `blob:` URL
back for a module worker. That is defence in depth and durability, not a live hole.

**Every function must stop repeating the old caveat.** It is now a false statement about
our own product, published in our own repository, which is precisely the category of
error this company sells against.

### C2. Descriptive statistics only, or inferential?

**Market research** (`DIFFERENTIATION.md:22`) states that PRISM performs descriptive
statistics and that no t-test, regression, ANOVA or confidence interval exists. **AEO**
says 17 inferential tests exist.

**Ruling: market research is overruled on the fact and upheld on the copy.**

The 17 tests exist (F3). Market research read `src/python/prism_core.py`, which imports
only pandas and numpy; the statistical engine is in `src/workers/prism.worker.js` and
SciPy loads lazily, which is why it was missed. Any positioning built on "descriptive
only" understates the product and is refuted by the first reviewer who opens the file,
which for this audience is the first reviewer.

But market research's instinct was right for the wrong reason. Three of the 17 can be
silently wrong (F16) and none of the 17 is verified against a known answer. So:

- **Correct the fact** in `DIFFERENTIATION.md` and anywhere it propagated.
- **Do not advertise the tests** until gate B7 below closes. The honest line is that
  PRISM runs real statistical tests in the browser and that we will publish the
  known-answer suite before we ask anyone to rely on them.

Understating the product is a smaller error than overstating it, but publishing a false
statement about our own code is not a small error in either direction.

### C3. Which comes first, the domain or the CVE?

**Growth (SEO and AEO)** makes the domain Gate 0 ahead of everything, because without a
stable canonical origin PRISM cannot be linked, cited or crawled, and because the same
purchase unlocks response headers (F19). **Marketing** lists seven gates G1 to G7 and
does not mention a domain at all.

**Ruling: both, and they do not compete. Marketing is overruled on the omission.**

A domain is a purchase with a lead time, not an engineering gate. It belongs in week 1
of the sequence and blocks no code. The CVE work is a gate on the public campaign, not
on buying a name. Running them in parallel costs nothing.

One ordering constraint does exist and is recorded in C4.

### C4. Keep the name PRISM, or rename?

**AEO** (`AEO_STRATEGY.md:178` to `:220`) argues the name collides with the NSA
surveillance program in exactly the semantic space we want to own, that no amount of
optimisation wins that retrieval fight, and that today is the cheapest a rename will
ever be. **Brand** (`NAMING.md:7`) treats the name as settled and renames nothing.
**Brand voice** (`VOICE.md:115`) prepares an answer to the question and forbids the
ironic reversal.

**Ruling: keep PRISM, with a forcing function. Neither function is overruled; the
decision is escalated and dated.**

Brand is right that a name is not a search problem and that a product whose entire
argument is anti-surveillance can hold this name with a straight face. AEO is right that
the cost curve only goes one way.

So the decision is not deferred, it is **scheduled to the domain purchase**. The moment
a domain is bought, the name acquires inbound links, a canonical URL, printed collateral
and a payment processor product record, and the rename stops being free. The founder
decides before that purchase, not after. If the answer is keep, it is kept permanently
and nobody reopens it.

### C5. The xlsx fix breaks the offline product we plan to sell

**Technical strategy** step X8 records honestly that migrating `xlsx` to the SheetJS CDN
build stops Excel parsing from working offline. **Finance** sells a $49 perpetual
**Offline** tier (`PRICING.md:182`). **Brand** gates the name "PRISM Offline" until step
X9 vendors SheetJS locally.

**Ruling: skip X8 as a shipped state. Go directly to X9. Technical strategy is overruled
on sequencing, not on content.**

X0 through X7 stand as written, including computing the SRI hash locally rather than
copying one, and loading via an injected script tag rather than `fetch` so that
`connect-src` never gains `cdn.sheetjs.com`. But the artifact those steps point at is
the vendored copy in `public/`, not the CDN.

Shipping the CDN variant even briefly would: break the offline claim that the $49 tier
is entirely made of, add a third party to a page whose argument is that it has no third
parties, and force the marketing site to be rewritten twice. The vendored variant closes
the CVE, keeps full offline operation, and removes the SRI exposure. It is more work by
roughly one step and it is the only variant consistent with the rest of the plan.

### C6. Marketing's gates omit the defects that would end the company

**Marketing** gates the launch on G1 to G7: the CVE, tests in CI, licence coherence,
README claims, bundle split, a verification page, and eight discovery interviews.
**UX** documents nine S1 defects, defined as the product producing a wrong answer the
user cannot detect. **Technical strategy** names the single worksheet read (F17) as the
most likely source of a silently wrong answer in the product today.

**Ruling: marketing is overruled. Three S1 correctness defects join the gate list.**

The ICP is auditors, healthcare analysts and litigation support. The product asks them
to rely on a number. A tool that silently charts the first 15 categories of 400 and
labels the chart as the data (F15), silently analyses sheet 1 of 12 (F17), and silently
compares the first two of five treatment groups (F16), is not a performance problem. It
is the failure mode that ends a company selling to people whose profession is checking
numbers.

Marketing's gates are all correct. They are incomplete.

### C7. Is XML a supported format?

Nobody raised this. It was found today.

**Ruling: XML is not a supported format. Every claim that it is must be removed or the
parser must be built.**

`src/security/validator.ts:157` accepts `.xml`, validates its magic bytes at `:52` to
`:56`, and passes. `src/stores/prismStore.ts:154` reads it as text. The worker has no
XML handling and hands the text to `pd.read_csv` (`prism.worker.js:143`). A real XML
file therefore produces a garbage frame or an error, having passed every validation we
wrote.

`README.md`, `web/index.html` (seven mentions), `POSITIONING.md`, `MESSAGING.md`,
`SEO_STRATEGY.md`, `llms.txt` and the answer blocks all sell XML.

The cheap fix is to drop XML from the accepted extension list and from all copy, which
is one line in the validator plus a copy pass. The expensive fix is a real parser. **The
cheap fix is correct for now**, because two of the three formats work well and the third
is worth building only if a discovery interview asks for it. Note the irony to avoid
repeating it: `fast-xml-parser` is already a declared dependency (F8), which is almost
certainly why everyone assumed XML worked.

### C8. How bad is the dependency situation?

Every function treats this as one HIGH CVE in `xlsx`. `npm audit` today reports 22
advisories: 3 critical, 12 high (F7).

**Ruling: the framing changes, and one finding makes it much cheaper than it looks.**

The critical advisories are `fast-xml-parser`, `vitest` and `@vitest/coverage-v8`. Two
of those three are dev tooling. The third, `fast-xml-parser`, is a **production**
dependency carrying a critical entity encoding bypass, and it is **imported nowhere in
`src/`** (F8). Neither is `papaparse`.

So the single highest leverage security action available to this company is deleting two
unused lines from `package.json`. That removes a critical advisory from the SBOM, from
`npm audit`, and from the first thing a buyer's security team runs. It is a few minutes
of work.

`xlsx` remains the only advisory with no fix available on the registry and is handled by
C5. The remainder are transitive dev tooling with fixes available and are a version bump.

The gate is not "the xlsx CVE is fixed". The gate is **`npm audit --audit-level=high`
exits 0 and `continue-on-error` is deleted from `.github/workflows/ci.yml:133`**, which
is the acceptance criterion the CI comment already names for itself.

### C9. Zero tests, or a test suite?

Several briefs say zero tests. Today: 6 files, 98 tests, all passing (F4). Marketing's
G2 asks for a suite that exists and passes in CI.

**Ruling: G2 is not met, despite the suite existing. Nobody is overruled; the bar moves.**

Coverage is configured to measure `src/security/**` and `src/stores/**` only (F5). The
1,710 line worker holding all 17 statistical tests, all five components and `App.tsx`
are outside the coverage report entirely. A coverage number published from this config
would be true and misleading, which is the exact failure mode we criticise in others.

What exists is good and real: 98 passing tests, including a regression test that asserts
the worker is never constructed from an `https:` URL, which is the test that makes F1
durable. What does not exist is a single test of a statistical result.

G2 becomes two gates: B6 (CI green and public) and B7 (17 tests verified against
published reference values). B7 is the one that unlocks correctness language.

### C10. Which licence, and does it break the revenue model?

**LICENSE** on disk is MIT. **package.json** says PROPRIETARY and private. **README**
reads open source. **Legal** recommends source-available with a scheduled conversion to
Apache 2.0. **Finance** sells a Source/OEM tier at a $50,000 floor.

**Ruling: adopt legal's recommendation. Nobody is overruled. Two things must be said
plainly.**

First, the finance Source/OEM tier survives intact. It sells rights, indemnity, support
and a named counterparty, none of which is secrecy. Every function's plan, marketing's
"grep the source yourself", legal's verification argument, growth's citation strategy,
depends on the source being readable. Closing it would delete the verification invitation
the entire company rests on.

Second, the current state is not neutral, it is the worst of the four. The MIT text is
sitting in a repository right now. MIT is irrevocable for anything already distributed
under it. Every day this stays unresolved widens the set of code someone can argue was
released under MIT. This is not a tidiness issue with a low priority; it is the item
with a clock on it.

### C11. Sell on privacy, or on procurement?

**Marketing** positions on procurement: the upload is the blocker, PRISM removes the
thing the review is about. **Market research** finds the privacy sentence is already
taken, quoting DuckDB's Local UI page verbatim, and grades the moat THIN. **Finance**
builds the model on assurance artifacts and contractual obligation rather than metered
access.

**Ruling: all three agree and have written the same strategy in three vocabularies. No
overrule. It is worth stating the agreement because it is the plan's spine.**

PRISM cannot win "we are the local one". Free, better distributed tools say it already.
What PRISM can sell is the intersection that a free tool farm will not assemble: no
upload, no install, guided analysis for someone who does not write code, and a founder
who will sign a document about it. Marketing calls that procurement. Finance calls it
selling artifacts and obligation. Market research calls it a thin moat that must be
defended by the founder's network rather than by the code. Same plan.

The operational consequence, which all three imply and none states: **the moat is the
founder, not the architecture.** The architecture is a few engineer-weeks of free
components. The network of audit partners who will take the call is not. Sequence
accordingly, which is what Section 3 does.

---

## 3. The sequence

Five phases. A phase does not start until the previous phase's exit criterion is met.
Durations are deliberately absent: this is a one person company and a calendar would be
an invented number. The order is the deliverable.

### Phase 0: Stop saying false things

Nothing here needs a decision, a budget or a customer. All of it is currently published.

1. Delete `fast-xml-parser` and `papaparse` from `package.json`. Removes a critical
   advisory (C8).
2. Remove XML from the accepted extension list and from all copy in `README.md` and
   `web/index.html` (C7).
3. Delete the five compliance rows at `README.md:99` to `:103`. Replace with the
   honest ledger in `docs/legal/COMPLIANCE_POSTURE.md`, which already has the
   replacement wording (F11).
4. Delete Scikit-Learn from the stack list at `README.md:111` (F12).
5. Resolve the licence to source-available (C10). One decision, three files.
6. Fix `MAX_FILE_SIZE` or its docstring, and decide which number is true (F13).
7. Correct `DIFFERENTIATION.md:22` and remove the closed worker-CSP caveat wherever it
   was repeated (C1, C2).
8. Replace the em dash at `README.md:13`.

**Exit criterion:** every published sentence about PRISM is one the founder would defend
under questioning from a reviewer holding the source open.

### Phase 1: Earn the right to make the claim

The engineering gates. These are the B list in `LAUNCH_READINESS.md` and they are what
stands between today and a public beat.

1. `xlsx` migrated to a vendored, pinned SheetJS file in `public/`, per X0 to X7 landing
   on X9 rather than X8 (C5).
2. Remaining advisories cleared; `continue-on-error` deleted from CI (C8).
3. The three S1 correctness defects fixed: silent chart truncation, single worksheet,
   silent two-group comparison (C6).
4. The 17 statistical tests verified against published reference values (C9).
5. Coverage config widened to include the worker and the components, so the number means
   what a reader will think it means (F5).
6. Bundle split actually working, `xlsx` no longer eagerly loaded (F14).

**Exit criterion:** a competent hostile reviewer with the repository open cannot find a
false claim or a silently wrong answer in an hour.

### Phase 2: Become linkable

Runs in parallel with Phase 1. Blocks no code.

1. Name decision made and closed (C4).
2. Domain purchased. Host chosen for its ability to set response headers, which serves
   the security roadmap and the growth roadmap with one purchase (C3, F19).
3. `base: '/PRISM/'` removed; canonical origin live.
4. The `web/` site's three placeholders resolved (F20), the SEO tags from
   `docs/growth/seo/` applied, `schema.jsonld` and `llms.txt` deployed.
5. The verification page live: the CSP quoted verbatim, the grep shown, the network
   panel walkthrough. Marketing's G6, and it is correctly identified as the campaign's
   single most important asset.

**Exit criterion:** a skeptic can reach a stable URL, verify the claim themselves in
under two minutes, and cite it.

### Phase 3: Find out whether the wedge is real

Marketing's G7 and the only phase whose output is information rather than artifacts.

Eight Tier 1A discovery interviews from the founder's audit network. The hypothesis
under test is marketing's one labelled ASSUMPTION: that vendor review is long enough
that analysts route around it. It is the load-bearing premise of the entire positioning
and it currently has no evidence.

**Exit criterion:** eight conversations written up, and a yes or no on whether the
blocked-upload moment is a thing people actually experience. A no here is worth more than
a successful launch, because it arrives before the money.

### Phase 4: Launch, in the order marketing specified

Marketing's channel sequence is adopted unchanged, including the judgements that are
easy to second guess: LinkedIn first and continuous, Hacker News gated, r/privacy
reframed as a request for scrutiny rather than an announcement, r/dataisbeautiful argued
down to a non-beat, Product Hunt deferred on audience mismatch. Growth's additions (IIA
and ISACA chapters, an owned-domain architecture post) are folded in.

One amendment. **Nothing is sold until Phase 1 exits.** Finance's Enterprise tier
includes a contractual warranty on the no-egress property, correctly identified as the
highest value line item in the price list. Legal recommends a twelve month fee cap
before that warranty is sold. Both are right, and neither matters if the product can
still hand an auditor a wrong number, because the operative risk for this product is not
egress, it is reliance. Legal reached that conclusion independently in
`TERMS.draft.md:193`. The free tier can go live at Phase 2. Paid tiers wait for B7.

**Exit criterion:** the claim survived public critique by people trying to break it.

---

## 4. Decisions the founder owns, which nobody else can make

Four. Each is a fork, not a task.

1. **The name.** Before the domain purchase (C4).
2. **Licence instrument.** Source-available with a scheduled Apache 2.0 conversion is the
   recommendation, and the MIT text on disk is accruing risk while it waits (C10).
3. **Whether to build XML or drop it.** Drop is recommended, revisit only if discovery
   asks for it (C7).
4. **When to commission the penetration test.** Finance computes it at 53% to 64% of all
   year one cash cost, serving one tier, and recommends sequencing it behind a signed
   conditional order and funding it from the deposit. That recommendation is adopted.
   Commissioning it speculatively is the most plausible way this company runs out of
   money, and it is a temptation that will present itself as diligence.

---

## 5. What this plan is not

Recorded so that a future reader does not mistake omission for oversight.

- **No backend, no telemetry, no collaboration, no scheduling.** Technical strategy's
  non-goals are adopted without modification. Each of them would delete the position
  rather than extend it, which marketing states directly and finance proves with the
  metering argument: `connect-src` cannot gain a licence callback without falsifying the
  one claim the company rests on.
- **No new statistical tests until the existing 17 are verified.** Adopted from technical
  strategy. Growth independently reached the same conclusion by a different route,
  omitting the highest volume keyword pool because a visitor who found such a page would
  trust a defective test.
- **No compliance badge.** Market research's argument is the right one and it is
  counterintuitive enough to restate: the founder's KPMG ISO 27001 audit background is
  more persuasive *because* it refuses the badge. An auditor who declines to claim a
  certification they have not earned is demonstrating the thing the certification is
  supposed to prove.
- **No growth target, no revenue projection, no user number in this document.** Finance's
  scenarios exist and are labelled. Repeating them here without their labels would turn
  a modelled range into a plan, which is how invented numbers get born.

---

## 6. The one thing that would change this plan

Phase 3 returns a no.

If eight interviews with the warm network say the blocked-upload moment is rare, or that
people route around it with a redaction script and do not feel the pain, then the
positioning is wrong. Phases 1 and 2 would still have been worth doing, because they
produce a correct, honest, linkable product either way. But the market would then be
somewhere else and this document would need rewriting from Section 2 down.

That is the honest shape of a pre-revenue plan with zero customer conversations behind
it. Marketing labelled the same premise ASSUMPTION and declined to attach a duration
figure to it. That restraint was correct and it is preserved here.
