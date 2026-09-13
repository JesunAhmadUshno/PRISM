# PRISM Onboarding: Designing the Trust Bootstrap

Owner: UX architecture
Date written: 2026-09-13
Status: design proposal. None of section 4 onward exists in the code today.

---

## 0. The problem, stated precisely

PRISM's entire value proposition is a negative claim: *your data does not go
anywhere*. A negative claim cannot be demonstrated by using the product. Nothing
happens, and nothing happening looks exactly like everything happening.

That produces a bootstrap problem with a specific shape:

> To believe the claim, the user must test it.
> To test it, the user must give PRISM a file.
> The only file whose safety they care about is the sensitive one.
> So the test they need to run is the one they are unwilling to run.

Every other analytics tool escapes this loop because the user is not asked to
believe anything: they already accepted that the data goes to a server, and the
question is only whether the server is trustworthy, which is answered by a brand,
a contract and an audit report. PRISM has none of those and does not want them.
PRISM's answer has to be different in kind: **do not ask to be believed, make the
claim checkable in under a minute by someone who does not trust you.**

This document designs that minute.

---

## 1. What the first thirty seconds look like today

Read from `src/App.tsx`, `index.html` and `src/stores/prismStore.ts` on
2026-09-13.

| Time | What happens | What the skeptic concludes |
| --- | --- | --- |
| T+0 | Page paints dark (`index.html:2` hardcodes `class="dark"`), "Loading PRISM Analytics Engine..." (`index.html:129`) | Neutral |
| T+0 | The store module is imported, which immediately runs `warmUpWorker()` at module scope (`src/stores/prismStore.ts:231`) | Nothing visible yet |
| T+0 | The worker fetches the runtime from `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`, each file pinned to a SHA-384 digest (`src/workers/prism.worker.js:22`, `:33`, `:1244`), then `loadPyodide()`, then `loadPackage(['pandas', 'numpy'])` (`:1355`). The code's own comment at `prismStore.ts:189` describes this as roughly 25 MB. UX has not independently measured it. | **The network tab is full of third party traffic before the user has touched anything** |
| T+1 | A green banner appears: "Zero-Trust Mode Active. All processing happens locally in your browser. No data leaves your device." (`src/App.tsx:225` to `:236`) | An assertion, with no way to check it |
| T+1 | Hero: "Analyze your data with complete privacy" | A second assertion |
| T+1 | Dropzone: "Drag & drop your data file", badges for CSV, Excel, XML, and "Max 500MB" (`FileUploader.tsx:220`) | The ask arrives before any evidence |
| T+1 | Feature grid: a lock reading "Data never leaves your browser", a bolt reading "Powered by WebAssembly", a wheelchair reading "WCAG 2.2 AAA compliant" (`src/App.tsx:383` to `:387`) | Third assertion, plus a standards claim |
| T+1 | Footer: "ISO 27001", "WCAG 2.2 AAA", "Zero Data Exfiltration" (`src/App.tsx:619` to `:624`) | Fourth, fifth and sixth assertions |

### 1.1 The three things wrong with this

**One. Six claims, zero checks.** Every trust signal on the screen is a sentence
PRISM wrote about itself. There is not one control anywhere in the interface that
lets a user verify any of them. The product asks for a sensitive file on the
strength of its own testimony.

**Two. Two of the badges name standards the repository cannot currently
evidence.** "ISO 27001" and "WCAG 2.2 AAA" appear as bare assertions in the app
footer and in the feature grid. These are exactly the claims the target user is
professionally trained to check, and they are the claims most likely to be
checked first. A claim that fails under scrutiny does not fail alone. It takes
the true claim next to it down with it. The real architecture is the strongest
thing PRISM has, and it is currently standing in a line-up with two claims that
cannot survive a question.

**Three, and worst: the one verification gesture we want the user to perform
currently produces evidence against us.** The natural skeptic's move is to open
DevTools and watch the Network panel. Today, on a cold cache, that panel fills
with requests to `cdn.jsdelivr.net` before the user has done anything at all.

The claim survives this, because the claim is "no *data* leaves", not "no bytes
arrive". But the user does not have that distinction loaded. They have one
heuristic, "a privacy tool that talks to a CDN is lying", and the interface gives
them nothing to correct it with. **We are currently losing the argument on the
one piece of evidence we most need to win.** Everything in section 6 exists to
fix that.

---

## 2. The principle: assertion versus evidence

Classify every trust signal in the product on one axis.

| Class | Definition | Cost to the skeptic | Persuasive value |
| --- | --- | --- | --- |
| **A. Assertion** | We say a thing about ourselves | Zero | Near zero to this audience |
| **B. Third party assertion** | Someone else says a thing about us | Zero | Moderate, and PRISM has none yet |
| **C. Guided check** | We show them how to check, they check | Seconds to a minute | **High** |
| **D. Self discovered proof** | They check without our help and it holds | Minutes | Highest |
| **E. Structural impossibility** | The thing cannot happen, and they can see why | Minutes, needs expertise | Highest and durable |

PRISM's onboarding today is 100 percent class A. The entire design goal of this
document is to move the first thirty seconds into class C, make class D easy
immediately afterward, and give class E a place to live for the one reader in
twenty who will actually go and read the source.

Corollary that governs all copy: **a claim without an adjacent check is worth
less than no claim at all**, because it consumes attention and invites a
challenge we have not equipped the user to resolve.

---

## 3. The three audiences arriving at once

The first screen has to serve three readers without making any of them read the
other two's content.

| Audience | Roughly | What they do | What they need |
| --- | --- | --- | --- |
| **The skimmer** | Most arrivals | Reads the headline, decides in a few seconds | One sentence, one thing to click that is not their file |
| **The skeptic** | The buyer we want | Opens DevTools, tries to break the claim | A named, guided check that takes under a minute and that we do not flinch from |
| **The auditor** | Few, decisive | Reads the CSP, greps the source, asks about the worker | A written page of exactly what is and is not guaranteed, including the limits |

The failure mode to avoid is building for the skeptic and burying the skimmer
under a security lecture. The structure that serves all three is progressive
disclosure with an honest first rung: one sentence, one control, and a door.

---

## 4. The designed first thirty seconds

This is a specification, not a description. None of it exists today.

### T+0 to T+3: the sentence and the two doors

```
+--------------------------------------------------------------------+
|  PRISM                                    [A]  [theme]  [verify]   |
+--------------------------------------------------------------------+
|                                                                    |
|   Analyze a spreadsheet you are not allowed to upload.             |
|                                                                    |
|   PRISM runs the analysis inside this browser tab. There is no     |
|   server to send your file to.                                     |
|                                                                    |
|   +------------------------------+  +---------------------------+  |
|   |  Try it with a sample file   |  |  Drop your own file       |  |
|   |  No account. Nothing of      |  |  CSV, Excel or XML        |  |
|   |  yours is involved.          |  |                           |  |
|   +------------------------------+  +---------------------------+  |
|                                                                    |
|   > Don't take our word for it. Check it yourself in 30 seconds.   |
|                                                                    |
|   Analysis engine: ready.  Loaded from cdn.jsdelivr.net.  Why?     |
+--------------------------------------------------------------------+
```

Four deliberate decisions in that wireframe:

1. **The sample file has equal visual weight to the dropzone.** Today the
   dropzone is the only way in, which means the first interaction the product
   asks for is the one requiring the most trust. Reversing that is the single
   highest leverage change in this document.

2. **The verification invitation is a link, not a badge.** Badges are class A.
   A link that opens a checklist is class C.

3. **The engine status line names the third party origin before the user finds
   it.** We say `cdn.jsdelivr.net` out loud, with a "Why?" that explains it, in
   the same breath as the claim. See section 6. Naming it first converts the
   skeptic's discovery from "caught them" into "they already told me".

4. **The compliance badges are gone.** Not softened. Gone. See section 11.

### T+3 to T+12: the sample path

Clicking "Try it with a sample file" runs the complete pipeline on a bundled
dataset. The user reaches a real results screen having risked nothing.

Two things must happen on that results screen that do not happen today:

- A persistent bar at the top: **"This is the sample dataset. Your own files
  work exactly the same way."** with a control to start over with their file.
- The verification link is still present and now says something stronger:
  "That analysis ran here. Confirm it."

### T+12 to T+30: the check

The verification panel (specified in section 8) opens beside the results, not
over them, and offers four checks in ascending order of effort. The user does one
of them. That is the whole objective of the first thirty seconds: **one completed
check, chosen by the user, on evidence they gathered themselves.**

### What success looks like

Not "the user uploaded a file". The onboarding has succeeded when the user has
done one thing PRISM did not do for them. Everything after that is product.

---

## 5. The sample dataset

### 5.1 It does not exist

`public/` contains exactly one file: `favicon.svg`. There is no sample data
anywhere in the repository, and no code path that loads one. Today the only way
to see what PRISM does is to give it a real file.

### 5.2 Specification

| Property | Requirement | Reason |
| --- | --- | --- |
| Format | CSV, and a second copy as a two sheet `.xlsx` | Exercises both parse paths. The `.xlsx` copy also exercises the sheet chooser proposed in `USER_FLOWS.md` section 4.3 |
| Shape | A few hundred rows. Enough that the statistics are not trivially eyeballed, small enough that it renders instantly even on a cold runtime | The sample must never be the slow path |
| Columns | At least two numeric, at least one categorical with a small number of levels, at least one categorical with exactly two levels, at least one datetime, and at least one column with deliberate missing values | Every recommendation branch in `AnalyticsWorkspace.tsx:318` to `:409` needs a live case, and the missing values make the Preprocess tab non empty |
| Provenance | A genuinely public dataset, cited by URL in the UI and in the file's own header comment, or synthetic data generated by a script committed alongside it | PRISM cannot ship a dataset of unknown origin while telling users to care where data comes from |
| Domain | Neutral and non personal. No names, no health data, no anything that looks like a real person | A privacy tool shipping a sample containing personal data is an own goal |
| Delivery | Bundled into the origin, loaded with no network request to any third party | The sample path must not add a single external request, or it undermines the check running next to it |
| Naming in UI | "Sample dataset", never "demo data" | "Demo" implies the product behaves differently in a demo. It does not, and that is the point |

### 5.3 The one hard rule

**The sample path must be byte for byte the same code path as a real file.**

No preloaded results, no cached JSON of the answer, no special case. The sample
is fetched from the origin, handed to `setFile` exactly as a dropped file is, and
runs through `validateFile`, `readFileContent`, the worker and Pyodide. If we
shortcut it, then the first thing a skeptic will find is that the demo is fake,
and at that point nothing else on the page matters.

This also makes the sample self serving in the good sense: it is the fastest
smoke test PRISM will ever have, and it works in a browser with no test runner.

---

## 6. The CDN problem

This is the hardest honest problem in the onboarding and it deserves its own
section.

### 6.1 The situation

- `src/workers/prism.worker.js:22` pins `https://cdn.jsdelivr.net/pyodide/v0.25.1/full/`, and `:33` pins a SHA-384 digest per file.
- `index.html:24` permits that origin in `connect-src`, and `index.html:19`
  permits it in `script-src`.
- `src/stores/prismStore.ts:231` fires the download at module import time, before
  any user action.
- Therefore the Network panel on a first visit shows substantial third party
  traffic that the user did not initiate.

The claim is not violated: that traffic is inbound, it carries no user data, and
`connect-src` plus `form-action 'none'` prevent an outbound channel from the
document. But the user's check does not have that resolution, and we should not
require the user to be a CSP reader to survive their own first impression.

### 6.2 The options, honestly compared

| Option | What it is | Cost | Effect on the check |
| --- | --- | --- | --- |
| **A. Say nothing** | Today's behaviour | None | The skeptic finds it themselves and we look evasive |
| **B. Name it before they find it** | Persistent status line: what is downloading, from where, why, and that it carries nothing of theirs | One component, one paragraph of copy | Converts a discovery into a disclosure. Cheap, immediate, large |
| **C. Defer it until the user acts** | Do not warm up on load. Start the download when the user picks a file or the sample | Removes the overlap between download and reading, so the first analysis feels slower | Network panel is clean on arrival, then fills the moment they act, which is arguably more confusing |
| **D. Vendor the runtime into the origin** | Serve Pyodide and its packages from PRISM's own origin instead of a CDN | Larger deploy artifact, a hosting decision, and a technical call that is not UX's to make | **Eliminates the problem entirely.** Zero third party origins in the network panel, ever |
| **E. Offer both builds** | Hosted build uses the CDN, downloadable build vendors everything | Two artifacts to maintain | Strongest for the enterprise buyer, and it is the shape the finance documents already propose selling |

### 6.3 Recommendation

**Do B now. Plan for D. Do not do C.**

- **B now**, because it costs a component and a paragraph, and it is the
  difference between "they told me" and "I caught them". The status line appears
  in the wireframe in section 4.

- **D eventually**, because it is the only option that makes the check
  unambiguous. When the network panel on a PRISM page shows zero third party
  origins, the argument is over in one screenshot. Whether and how to vendor is a
  decision for the technical strategy document, not for UX. The UX requirement is
  stated here as a target: **the number of third party origins a user sees should
  be zero, and until it is zero, every one of them must be named on screen before
  the user looks.**

- **Not C**, because deferring the download trades a small explainable oddity
  for a large unexplainable wait, and because the warm up on load is a genuinely
  good engineering decision that overlaps a fixed cost with reading time. Fix the
  disclosure, not the prefetch.

### 6.4 The copy

The status line and its "Why?" disclosure. This text is the load bearing paragraph
of the entire onboarding.

> **Analysis engine: ready.** Loaded from `cdn.jsdelivr.net`. [Why?]
>
> PRISM runs Python in your browser using Pyodide, which is compiled to
> WebAssembly. That runtime has to be downloaded once, and it comes from a public
> CDN. That download is one way: the browser asks for a file and receives it. It
> carries nothing about you and nothing from your file, because at the moment it
> happens PRISM has not read a file.
>
> After it loads, your file is read by code running inside this tab. You can
> confirm that by disconnecting from the network and running an analysis anyway.

Three rules that copy follows and all future copy must follow:

1. Say the uncomfortable fact in the first line, not the third.
2. Explain the mechanism, not the intention. "It carries nothing about you
   because PRISM has not read a file yet" is checkable. "We would never do that"
   is not.
3. End with a check, not a reassurance.

---

## 7. Making offline capability visible and provable

Offline is the strongest available proof because it is binary, it requires no
tooling, and it cannot be faked. If the tab still computes with the network
switched off, the computation is local. There is no other explanation.

### 7.1 What is true today

Once Pyodide has loaded, the analysis path makes no further network calls. A
search across `src/` returns no `XMLHttpRequest`, no `WebSocket` and no
`sendBeacon` at all, and exactly one `fetch`
(`src/workers/prism.worker.js:1244`), which is the runtime download itself and
runs before any file is read. Section 8.1.1 covers how to present that one hit.
I confirmed this by search across the tree on the date at the top of this
document.

### 7.2 What is not true today

A cold visit cannot run offline at all, because the runtime has not arrived yet.
There is no service worker in the repository, so nothing caches the runtime for
a second visit either. So the honest statement today is:

> After the engine has loaded in this tab, analysis works with the network
> disconnected.

and not

> PRISM works offline.

Do not write the second sentence until a caching strategy makes it true.

### 7.3 The design: make the user do it

The strongest possible onboarding moment available to this product costs one
component:

```
+--------------------------------------------------------------------+
|  Prove it to yourself                                              |
|                                                                    |
|  1. Turn off your wifi, or switch to airplane mode.                |
|  2. Come back here. This box will notice.                          |
|  3. Run the analysis again.                                        |
|                                                                    |
|  Connection: ONLINE                                                |
|                                                                    |
|  When it still works with the network off, you have your answer.   |
+--------------------------------------------------------------------+
```

`navigator.onLine` and the `online` / `offline` window events are enough to drive
the state, they cost nothing, and they need no permission. When the user
disconnects, the box changes state in front of them:

```
|  Connection: OFFLINE                                               |
|  The engine is loaded. Run an analysis now.                        |
```

And after a successful offline run:

```
|  You just analysed a file with the network disconnected.           |
|  Nothing was sent, because there was nothing to send it to.        |
```

That sentence is earned by the user rather than claimed by us, which is the whole
thesis of this document in one interaction.

Caveat to state in the panel, because a critic will state it otherwise:
`navigator.onLine` reflects what the browser believes about the network
interface, not whether a route exists. It is a convenience for the user's own
test, not our evidence. Our evidence is that the analysis produced a result.

---

## 8. The verification panel

One component, reachable from the header on every screen and from a link on the
landing screen. Opens as a side panel so the user can keep what they were looking
at.

### 8.1 Contents: four checks, ascending effort

| # | Check | Time | What it proves | What it does not prove |
| --- | --- | --- | --- | --- |
| 1 | **Watch the network panel.** Open DevTools, go to Network, clear it, then run an analysis. | Under a minute | No request is made while your file is processed | Nothing about what happened before you opened the panel |
| 2 | **Disconnect and run it anyway.** Section 7. | Under a minute | The computation is local. There is no remote dependency at analysis time | Nothing about a build that differs from this one |
| 3 | **Read the policy.** View source, find the `Content-Security-Policy` meta tag. `default-src 'none'`, `connect-src` limited, `form-action 'none'`, `object-src 'none'`, `frame-src 'none'`. | A minute | The document is denied every network destination except the one named | The policy a document declares and the policy a Web Worker runs under are not the same thing. See 8.2 |
| 4 | **Read the source.** The repository, and a search for `fetch(`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`. | Minutes | Exactly one network call exists in the whole application, and you can read what it does. See 8.1.1 | That the deployed bundle is built from that source, unless you build it yourself |

#### 8.1.1 Check 4 returns one hit, and we say so first

This is the most important piece of copy in the verification panel, because it is
the one place where the honest answer is not "zero".

Searching `src/` for the four network primitives returns exactly one call site
today:

```
src/workers/prism.worker.js:1244
  response = await fetch(`${PYODIDE_BASE}${fileName}`, { integrity, credentials: 'omit' });
```

There is no `XMLHttpRequest`, no `WebSocket` and no `sendBeacon` anywhere. The
one `fetch` has four properties the reader can check in the same file:

- Its URL is built from `PYODIDE_BASE`, a hardcoded constant at `:22`. It cannot
  be pointed at another origin at runtime.
- It carries an `integrity` digest taken from the pinned table at `:33`, so the
  browser refuses the response if the bytes differ.
- It passes `credentials: 'omit'`, so no cookie is attached.
- It is a `GET` with no body. There is nowhere for user data to ride along, and
  it runs before PRISM has read a file.

The panel must present this as a finding, not as a footnote. A skeptic who runs
the search and finds a hit we did not mention will stop trusting the other three
checks. A skeptic who runs the search and finds exactly what we told them they
would find has just verified us twice: once on the code, and once on our
willingness to describe it accurately.

Copy:

> Search the source for `fetch`, `XMLHttpRequest`, `WebSocket` and `sendBeacon`.
> You will find exactly one hit, in the worker, and it is the runtime download
> described above. It is a GET to a hardcoded address, pinned to a cryptographic
> digest, with no credentials and no body, and it happens before PRISM has opened
> your file. Nothing else in PRISM can reach the network at all.

**Maintenance rule:** this count is load bearing. If a change adds a second
network call anywhere in `src/`, this copy is wrong and the verification panel
becomes a liability. That should be enforced by a test that fails on a second
call site, not by remembering.

Each check ships with a copyable command or an exact click path. Do not make the
user guess what we meant.

### 8.2 The limits section, which we write ourselves

This is the section that wins the auditor, and it is the section every competitor
omits. Rules: we write our own limitations before a critic writes them for us,
and we do not soften them.

Content, subject to review by the technical owners before it ships:

- **A meta tag CSP and a Web Worker are not the same policy surface.** A
  document's `<meta>` CSP governs the document. A dedicated worker derives its
  policy from how it was created and from its own response headers. The current
  code creates the worker from a `blob:` URL specifically so that it inherits the
  document's policy container (`src/stores/prismStore.ts:166` to `:186` explains
  the reasoning in a comment). Whether that inheritance holds in every browser
  the product supports is a question for the technical team, and the answer
  belongs in this panel in plain language. The user deserves to know which of our
  guarantees is enforced by the browser and which is enforced by our code review.
  Do not publish a sentence here until that team has confirmed it.

- **We cannot protect you from your own browser.** A malicious extension with
  access to page content can read anything on the page, including your file, and
  no CSP stops it. If your endpoint is compromised, PRISM's guarantee is not the
  thing protecting you.

- **This claim is about this page.** If you got this page from somewhere other
  than our published address, we cannot speak for what you are running. Build it
  yourself if that matters to you.

- **What we have not verified.** A plain list. Right now it includes accessibility
  conformance and information security certification, neither of which has been
  independently assessed. Saying so here is not a weakness. It is the single most
  credible thing on the page, and for the ex-audit buyer it reads as someone who
  knows what an assessment actually involves.

### 8.3 What the panel must not do

- It must not contain a badge, a shield icon, a percentage, or a score.
- It must not use the word "guarantee" about anything a browser does not enforce.
- It must not grow longer than a screen for checks 1 and 2. The skeptic who is
  going to do one check will do the first one they can see.

---

## 9. Copy deck for the first screen

### 9.1 Approved

| Slot | Copy |
| --- | --- |
| Headline | Analyze a spreadsheet you are not allowed to upload. |
| Subhead | PRISM runs the analysis inside this browser tab. There is no server to send your file to. |
| Sample CTA | Try it with a sample file |
| Sample CTA support | No account. Nothing of yours is involved. |
| Upload CTA | Drop your own file |
| Verify link | Don't take our word for it. Check it yourself in 30 seconds. |
| Engine status, loading | Analysis engine: downloading. First visit only. Loaded from cdn.jsdelivr.net. [Why?] |
| Engine status, ready | Analysis engine: ready. Loaded from cdn.jsdelivr.net. [Why?] |
| Engine status, failed | Analysis engine could not load. PRISM needs it once, from cdn.jsdelivr.net. If you are behind a proxy that blocks it, that is the likely cause. [Retry] |
| Offline box, online | Turn off your network and run an analysis. It will still work. |
| Offline box, offline | You are offline. The engine is loaded. Run an analysis now. |
| Results banner, sample | This is the sample dataset. Your own files work exactly the same way. |

Note the engine-failed copy. A locked down corporate network blocking a public
CDN is a realistic scenario for exactly the audience PRISM wants, and today that
produces a raw worker error through `prismStore.ts:413`. Naming the likely cause
is a meaningful piece of onboarding for the enterprise user.

### 9.2 Banned from the first screen

| Banned | Why |
| --- | --- |
| "ISO 27001" in any form | Not assessed. Appears today at `src/App.tsx:619` |
| "WCAG 2.2 AAA" or "AAA compliant" | Not assessed. Appears today at `src/App.tsx:386` and `:622` |
| "Zero-Trust Mode Active" | Misuses a term this audience knows precisely. Appears today at `src/App.tsx:231` |
| "complete privacy" | An absolute we cannot hold against a compromised endpoint |
| "military grade", "bank grade", "enterprise grade" | Means nothing, and signals the opposite to a security reader |
| "AI-powered", "AI-generated" | `src/python/prism_core.py` imports pandas and numpy. There is no model. Appears today at `src/App.tsx:489` |
| "100% secure", "completely safe", "guaranteed" | Absolutes |
| "certified", "compliant", "audited" | Until there is a certificate, a conformance report or an audit to point at |

### 9.3 House style

- Concede the true half of an objection before answering it.
- Prefer a mechanism to an intention. "There is no server" beats "we respect your
  privacy".
- Every claim gets a check next to it or it does not ship.
- Never use a shield icon to carry an argument.

---

## 10. Progressive disclosure map

```
Landing screen
  |
  +-- One sentence + two CTAs + one verify link      <- the skimmer stops here
  |
  +-- Engine status line
  |     +-- "Why?" disclosure                        <- the curious stop here
  |
  +-- Verify link
        |
        +-- Verification panel
              +-- Check 1: network panel             <- most skeptics stop here
              +-- Check 2: disconnect and run        <- the convinced stop here
              +-- Check 3: read the policy
              +-- Check 4: read the source
              +-- Limits: what we do not claim       <- the auditor reads all of it
                    +-- link to the repository
```

Every level is optional and every level is complete on its own. Nobody has to
descend to get value, and nobody who descends hits a dead end.

---

## 11. What must be removed before any of this ships

These are not softening edits. They are deletions.

| Remove | Location | Replace with |
| --- | --- | --- |
| "ISO 27001" footer badge | `src/App.tsx:619` | Nothing, or a link to the verification panel |
| "WCAG 2.2 AAA" footer badge | `src/App.tsx:622` | Nothing |
| "WCAG 2.2 AAA compliant" feature card | `src/App.tsx:386` | "Keyboard and screen reader support", which is checkable and is what the components actually attempt |
| "Zero-Trust Mode Active" banner | `src/App.tsx:225` to `:236` | The engine status line from section 6 |
| "AI-Generated Insights" heading | `src/App.tsx:489` | "Automated checks" |
| The confidence percentage bar | `InsightCard.tsx:99` to `:107` | The rule that fired, in words. The underlying values are hardcoded literals at `worker:261`, `:267`, `:274`, `:280`, `:302`, `:326` |
| Fifteen buttons with no handler | `AnalyticsWorkspace.tsx:1502`, `:1522`, `:1610` | Remove the buttons. A dead control on a trust-led product is worse than a missing feature |

The sequencing argument: **the removals must land before or with the new
onboarding, never after.** An onboarding flow that invites the user to check our
claims, on a page that still carries two claims that fail a check, is worse than
today. We would be actively directing the skeptic to our weakest point.

---

## 12. How we will know it worked

PRISM has no telemetry and should not acquire any. That is a real constraint and
it means every signal here comes from a person, not a dashboard. Stated plainly
so nobody later proposes analytics to answer these questions.

| Question | How to answer it without instrumenting the product |
| --- | --- |
| Does the skeptic complete a check? | Watch them. Moderated sessions, screen shared, with the instruction "convince yourself this is safe, think aloud". A handful of sessions will tell us whether the verify link is findable |
| Is the sample the first thing clicked? | Same sessions. If they still reach for a real file first, the visual weighting is wrong |
| Does the CDN line defuse the network panel? | Ask them to open DevTools and narrate. If they say "wait, what is jsdelivr", the line is not where they look |
| Does the limits section help or scare? | Ask an auditor to read it cold and say whether it increases or decreases their willingness to proceed. This is the one question where the target user's professional instinct is the measurement |
| Did the removals cost us anything? | Nothing to measure. A claim we cannot support has negative value regardless of how it performs |

No conversion rate, time on page, or funnel figure appears in this document,
because PRISM cannot collect one and should not start.

---

## 13. Open questions

1. **Does the `blob:` worker actually inherit the document CSP in every browser
   we support?** This determines whether check 3 in the verification panel is a
   proof or an approximation, and it determines what section 8.2 is allowed to
   say. Owner: technical strategy. This panel does not ship until that sentence
   is confirmed.

2. **Do we vendor Pyodide?** Determines whether the CDN disclosure is permanent
   or temporary. Owner: technical strategy, informed by section 6.

3. **What is the honest maximum file size?** `src/security/validator.ts:20` sets
   500MB with a comment above it saying 50MB. The landing screen currently
   promises the larger number (`FileUploader.tsx:220`). Onboarding cannot make a
   promise the product has not measured. Owner: technical strategy, via the
   measurement protocol in `SCALING_LIMITS.md`.

4. **Which public dataset is the sample?** Needs a real, citable source and a
   licence that permits redistribution. Owner: UX, blocked on nothing.

5. **Does an offline-capable second visit require a service worker, and does a
   service worker complicate the verification story?** A cache that serves the
   app offline is a strong proof. A cache the user cannot see the contents of is
   a new thing to explain. Owner: technical strategy with UX review.
