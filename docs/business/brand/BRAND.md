# PRISM Brand Platform

Owner: Brand and Voice
Last revised: 2026-09-13
Status: proposed, not yet applied to any shipping surface

This document defines what PRISM is, what it stands for, and which of those statements are
allowed to appear in public. It sits underneath the positioning work in
`docs/business/marketing/POSITIONING.md` and does not restate it. Positioning answers "who is
this for and why do they choose it." This document answers "what kind of company says that,
and what is it not permitted to say."

---

## 0. The rule that governs everything below

**The architecture is the brand. Where the two ever disagree, the architecture wins and the
brand copy changes.**

That is not a slogan. It is an operating constraint with a specific consequence: PRISM may
not adopt a brand attribute that the code does not currently support, and may not keep one
after the code stops supporting it. If a future release adds a server call, the brand does
not get to keep the word "local." The brand loses.

Three verified facts anchor the whole platform. Each was checked directly in this repository
on 2026-09-13, and each is re-checkable by anyone in under two minutes:

| Fact | Where | How to re-check |
|---|---|---|
| The document CSP is deny by default | `index.html`, the `Content-Security-Policy` meta tag | Read it. It sets `default-src 'none'`, `form-action 'none'`, `object-src 'none'`, `frame-src 'none'`, and limits `connect-src` to `'self'` plus the Pyodide CDN |
| No network primitive exists in the source | `src/` | Grep the source for `fetch(`, `XMLHttpRequest`, `WebSocket` and `sendBeacon`. One hit comes back, and that hit is a code comment in `src/stores/prismStore.ts` describing this very property |
| Statistics run in the tab | `src/workers/prism.worker.js` | Seventeen tests dispatch on `test_id`, all executed by `scipy.stats` inside Pyodide in a Web Worker |

Everything in section 3 and section 4 is derived from those three facts. Nothing in this
document is derived from a market study, a persona exercise or an aspiration.

---

## 1. The name

### 1.1 The metaphor, stated accurately

A prism separates white light into its component wavelengths. Three properties of that
object map onto this product exactly, and they are the reason the name is worth keeping:

**It separates without consuming.** The light that enters a prism is the same light that
leaves it. A prism holds nothing back. This is the product: a spreadsheet enters the tab, is
decomposed into distributions, correlations, outliers and test statistics, and nothing is
retained. `clearFile()` in `src/stores/prismStore.ts` terminates the worker and drops the
data. There is no store to retain it in.

**It is passive.** A prism has no power source, no memory and no outbound side. It performs
its function by its shape. PRISM's guarantee works the same way: not by policy, not by a
promise in a privacy notice, but by the shape of the thing. There is no fetch call to
disable, because there is no fetch call.

**The light never leaves the room.** The beam goes in, the spectrum comes out, and both stay
in front of you. That is the one sentence the company is built on.

### 1.2 The metaphor's limits, stated before someone else states them

A prism also **distorts**. It bends light, and it can produce a false impression of the
source. That is an uncomfortably accurate description of three defects currently in the
code, all documented in `docs/business/technical/`: charts truncate with `head(n)` rather
than sampling, `independent_t` silently compares only the first two groups it finds, and
only the first worksheet of a workbook is ever read. A brand built on a refraction metaphor
should be the first to admit that refraction can mislead. Fixing those defects is therefore
a brand obligation, not only an engineering one.

Do not build campaign copy on rainbows, spectra, light beams or "seeing your data in a new
light." The metaphor earns its place by explaining the mechanism. The moment it becomes
decoration it starts writing cheques the product cannot cash.

### 1.3 The name collision, named honestly

"PRISM" is also the name of the United States National Security Agency surveillance program
disclosed publicly in 2013. This is a real and permanent fact about the word, and any
security-literate buyer (which is exactly our ICP) will notice it.

There are three possible responses and only one of them is acceptable:

1. **Ignore it.** Unacceptable. The audience most likely to buy is the audience most likely
   to make the joke, and being caught unaware of it reads as unserious about security.
2. **Lean on it as an ironic reversal.** Tempting and wrong. "The opposite of the other
   PRISM" is a one-time laugh that permanently associates the product with mass
   surveillance in search results, and it trivialises a subject this audience treats
   seriously. Do not do it.
3. **Have a prepared, short, unbothered answer and move on.** Correct. The exact wording is
   in `VOICE.md`, section 4.

**OPEN ITEM, not resolved here:** no trademark search, domain audit or search-results audit
has been performed. This document does not assert that the name is available, clear, or
registrable in any jurisdiction. Before any money is spent on brand assets, the checklist in
`NAMING.md` section 9 must be completed by someone qualified to do it.

---

## 2. Brand platform

**Category:** local-first analytics. (Selected in `POSITIONING.md` section 1.3. Not repeated
or re-argued here.)

**Purpose:** to make it possible to analyse the files that are currently not being analysed,
because uploading them is not permitted.

**The one claim:** the data never leaves the machine, and you do not have to trust us for
that to be true.

**Promise:** PRISM will never ask you to send us anything, including your email address, to
get an answer out of your own file.

**Reason to believe:** the CSP, the empty network panel, and a source tree with no network
call in it. All three are verifiable by the buyer, without our participation.

**What we sell:** artifacts, assurance and obligation. Not access. The finance work
(`docs/business/finance/PRICING.md`) establishes that the same CSP that makes the claim true
also makes metering impossible. The brand must therefore never imply a metered relationship:
no "seats used," no "your plan includes," no usage dashboards, no account-shaped language on
the free product.

---

## 3. The brand idea

> **Restraint is the product.**

Every competitor's product gets better by adding: more connectors, more cloud, more AI, more
collaboration, more telemetry. PRISM gets better by refusing. The value is in the missing
components: no account, no upload, no server, no analytics, no session, no retention.

This has a direct and unusual consequence for how the brand behaves. **Most brands are built
to make you believe something. This one is built so that you do not have to.** The goal of a
PRISM communication is not trust. It is the removal of the need for trust. Every piece of
copy should be judged against one question:

> Does this ask the reader to believe us, or does it hand them a way to check?

Copy that asks for belief is weak copy, even when it is true. Copy that hands over a check is
strong copy, even when it is dull. We would rather be dull and checkable.

The tone that follows from this is under-selling. When the claim is genuinely strong, the
correct volume is low. Shouting a strong claim makes it sound like a weak one. That principle
is the whole of `VOICE.md`.

---

## 4. Personality

Five traits. Each is stated as a contrast, because a trait with no opposite is decoration,
and each carries the behaviour that proves it and the cost of holding it.

### 4.1 Precise, not authoritative

We say exactly what is true at the resolution we actually know it. We use numbers with their
method attached, or we do not use them.

- **Behaviour:** `SCALING_LIMITS.md` publishes a measurement protocol instead of benchmark
  numbers, because the benchmarks have not been run. Every row in its summary table is tagged
  MEASURED, PLATFORM, ASSUMPTION or UNMEASURED.
- **Cost:** we cannot answer "how big a file can it handle" with a number yet, which is a
  question buyers ask early and dislike hearing hedged.
- **Failure mode to watch:** precision curdling into pedantry. Precision is for claims. It is
  not a licence to make a simple sentence complicated.

### 4.2 Quietly confident, not reassuring

We state the mechanism once and stop. We do not repeat a claim for emphasis, add
intensifiers, or reassure.

- **Behaviour:** the strongest single marketing act available to PRISM is the absence of a
  signup form. Nothing we could write about privacy is as persuasive as not asking for an
  email address.
- **Cost:** understated copy converts worse against a casual audience. We accept a narrower
  top of funnel in exchange for credibility with the people who actually buy.
- **Failure mode to watch:** confidence sliding into smugness about competitors who made
  different tradeoffs for defensible reasons.

### 4.3 Self-incriminating, not defensive

We publish our own weaknesses before anyone finds them, in our own words, with the fix and
the date.

- **Behaviour:** the currently open items are an unpatched HIGH advisory in `xlsx@0.18.5`, a
  licence stack that contradicts itself in three places (`LICENSE` contains the MIT License
  text, `package.json` declares `"license": "PROPRIETARY"` with `private: true`, and the
  README reads as open source), a `<meta>` CSP that does not govern the Web Worker, and
  README badges asserting WCAG 2.2 AAA and ISO/IEC 27001:2022 with no verification behind
  either. All four are ours to state first.
- **Cost:** it is genuinely harder to sell against a competitor who does not do this, and in
  the short term it makes us look less finished than rivals who are equally unfinished and
  quieter about it.
- **Why we pay it:** the ICP is auditors, security reviewers and compliance officers. For
  that audience a disclosed flaw is evidence of a functioning process and an undisclosed one
  is evidence of the opposite. Self-incrimination is not modesty here. It is the sales
  motion.

### 4.4 Technical, not exclusionary

We assume the reader can follow a mechanism. We do not assume they already know our jargon.

- **Behaviour:** we say "the browser blocks outbound requests" and then show where. We do not
  say "zero trust," which the README currently does and which this audience knows we are
  using incorrectly.
- **Cost:** more words per explanation than a vendor who just says "bank grade security."
- **Failure mode to watch:** using accuracy as an excuse for density. Accurate and
  unreadable is still a failure.

### 4.5 Unhurried, not slow

We do not manufacture urgency. No launch countdowns, no scarcity, no "limited beta," no
fear-led breach copy.

- **Behaviour:** the launch plan gates the campaign behind fixing the CVE rather than
  shipping the campaign and footnoting the CVE.
- **Cost:** slower to first revenue.
- **Failure mode to watch:** using "unhurried" to justify not shipping. Restraint in tone is
  not permission for delay in work.

---

## 5. Values, each traceable to a line of code

A value that is not enforced by something is a preference. Each of these is enforced, and
each has a price we are knowingly paying.

### 5.1 Verifiability over trust

- **Enforced by:** the CSP in `index.html` and a source tree with no network primitive in it.
  Both readable by anyone.
- **Price:** we get no credit for good intentions and we cannot ask for the benefit of the
  doubt. Everything must be demonstrable or it does not get said.

### 5.2 Possession over custody

The user keeps the file. We never take custody, so there is nothing to return, delete,
subpoena, breach or migrate.

- **Enforced by:** no persistence layer anywhere in `src/`, and `clearFile()` terminating the
  worker.
- **Price:** no cross-device continuity, no saved workspaces, no sharing, no recovery after a
  tab crash. Users will ask for all of these. Every one of them, built our way, would break
  the claim.

### 5.3 Legibility over convenience

The user should be able to see how an answer was produced.

- **Enforced by:** analysis written as readable Python in `src/python/prism_core.py` and
  `src/workers/prism.worker.js`, using `pandas`, `numpy` and `scipy.stats`, rather than an
  opaque model.
- **Price:** more friction than a chat box that answers in a sentence.
- **Obligation this creates:** legibility is currently incomplete. Chart truncation is
  invisible to the user, and the single-worksheet limitation is undisclosed in the interface.
  Until those are surfaced, this value is aspirational and must not be claimed in public
  copy.

### 5.4 Accessibility as an architectural commitment, not a badge

- **Enforced by:** design decisions already in the code. `tailwind.config.js` sets a
  colourblind-safe chart palette with each hex annotated for its reason
  (`#0077BB` blue, `#EE7733` orange, `#33BBEE` cyan, `#EE3377` magenta, `#009988` teal,
  `#BBBBBB` grey), defines a separate high contrast token set including a yellow focus ring,
  sets the minimum body size to 16px and the default to 18px, and sizes touch targets against
  a 44px minimum. `src/components/visualization/InsightCard/` carries an accessibility test
  file.
- **Price and hard rule:** none of this is a conformance claim, and the README's WCAG 2.2 AAA
  badge is not supported by any audit. Until a real audit exists, the only permitted phrasing
  is "designed against WCAG 2.2 AAA" or a plain description of the specific features. See
  `VOICE.md` section 5. This is the single most likely place for the brand to accidentally
  lie, because the underlying work is genuinely good and the temptation to claim the badge is
  therefore strongest.

### 5.5 Say the limitation first

- **Enforced by:** house style, and by the fact that our buyer is professionally trained to
  hunt for the omission.
- **Price:** every asset is longer and less quotable than a competitor's.

---

## 6. What the brand is not

Naming the anti-brand is how the personality stays enforceable.

| We are not | Because |
|---|---|
| A privacy advocacy brand | We are not campaigning about surveillance. We are removing a step from a workflow. Ideology attracts an audience that does not buy software. |
| A security vendor | We do not secure anything the customer owns. We decline to take custody of it. Those are different businesses with different liabilities. |
| An AI product | The insight engine is rule-based logic over `pandas` and `numpy` output. The README's "AI-driven visual insights" and "AI Insights" are overclaims and are banned, see `VOICE.md` section 5. |
| An open source project | The repository is currently incoherent about this and nothing may be claimed until it is resolved. |
| A developer tool | The user is an analyst, an auditor or a clinician who has a file and a deadline, not an engineer looking for a library. |
| Enterprise software, today | Seven commits, an open HIGH advisory and a thin test suite. The word "enterprise" describes a future tier name, never our current maturity. |
| A disruptor | We are not displacing an incumbent. We are reaching work that currently does not happen at all. |

---

## 7. Visual identity: what the code already decided

This is not a full visual identity system and does not pretend to be. It records the
commitments the code has already made, so that a future designer inherits constraints rather
than a blank page.

**Already committed in code:**

- **Dark by default.** `index.html` line 2 is `<html lang="en" class="dark">`. The product is
  dark-first today. That is a real brand decision that was made implicitly and should now be
  made deliberately or reversed deliberately.
- **The blue ramp.** `tailwind.config.js` defines a `prism` scale from `#f0f9ff` to
  `#082f49`. It is close to the framework's default sky ramp and was chosen for contrast
  behaviour rather than for brand distinctiveness. It is fit for purpose and it is not
  ownable. Treat it as a placeholder with a real accessibility rationale attached, not as an
  equity to protect.
- **The chart palette is the most brand-relevant asset in the repository.** Six hexes chosen
  for protanopia and deuteranopia safety, each with its reason written next to it. This is a
  visible, defensible expression of the accessibility value, and it should be the palette any
  future identity is built around rather than the other way round.
- **Type scale is accessibility-led.** 18px default body, 16px floor, with the comment citing
  EN 301 549's 16px requirement. Any future identity must not reduce these.

**Unresolved, and flagged rather than invented:**

- There is no wordmark specification, no logo construction, no clear space rule and no
  typeface decision anywhere in the repository.
- `logo.png` and `favicon.png` are byte-identical (both 106,495 bytes, MD5
  `bb5a126d8b5e354bbc03a324808c7b86`). One 104 KB PNG is serving as both a logo and a
  favicon. Whatever this file is, it is not a designed identity, and it should be treated as
  a placeholder.

**The visual principle, if one is ever commissioned:** the identity should look like
instrumentation, not like a consumer app. Restraint, high contrast, generous type, no
gradients standing in for confidence. A tool an auditor could open on a shared screen during
fieldwork without it looking like a pitch.

---

## 8. Brand risks

| Risk | Why it is live | Mitigation |
|---|---|---|
| One accidental network call ends the brand | The claim is binary. There is no partial version of "nothing leaves." | The no-egress regression test named in the technical roadmap is a brand control, not only an engineering task. It is the single highest-value item on this list. |
| The worker is not governed by the meta CSP | A `<meta>` CSP does not apply to a dedicated worker, which takes policy from its own script's response headers, and GitHub Pages sends none. The claim is still true but is currently enforced by code review rather than by the browser. | Never say "the browser prevents it" about the worker until response headers are served. Say what is true today: there is no network call in the source, and the document policy is deny by default. |
| The README is currently off-brand and public | It asserts ISO/IEC 27001:2022 compliance and WCAG 2.2 AAA, uses "zero trust" incorrectly, says "AI-driven," and contains an em dash on line 13. It is the first thing a buyer reads. | README correction is a launch gate. This document does not touch that file (another team owns it) but flags it as the highest-priority brand defect in the repository. |
| The licence stack contradicts itself three ways | MIT text in `LICENSE`, `"license": "PROPRIETARY"` in `package.json`, open-source framing in the README, and a placeholder `repository.url`. For a brand whose entire pitch is "check us yourself," the first thing a checker finds is a contradiction. | Resolve before any launch beat. Until resolved, say nothing about licensing at all. |
| Metaphor drift into light-show marketing | The name invites it. | Section 1.2. The metaphor explains the mechanism or it is cut. |
| Founder-credential drift | "Ex-KPMG" is a real and useful fact. "KPMG-approved" is a fabrication. | Never imply endorsement by a former employer, a former client, or any standards body. |
| Brand outliving the architecture | If a server is ever added, every asset becomes false simultaneously. | Section 0. Any proposal that adds a server triggers a full brand review before it triggers an engineering estimate. |

---

## 9. Governance

**Who decides:** the founder, for now. This document exists so that the decisions are
written down before there is a second person making them.

**What triggers a brand review, without exception:**

1. Any change to the CSP in `index.html`.
2. Any new network request from any surface, including an analytics script on a marketing
   page. A tracker on the marketing site is a brand breach even though it is not a product
   breach, because the reader cannot be expected to distinguish the two domains.
3. Any claim entering public copy that is not already on the GREEN list in
   `POSITIONING.md` section 0.1.
4. Any tier, feature or release name, per `NAMING.md`.

**The standing test for any asset, in one line:** if a reviewer at a firm our founder used to
work at read this and then opened the source, would they find anything we did not already
tell them? If yes, the asset is not finished.
