# PRISM Answer Engine Optimization Strategy

Owner: AEO
Written: 2026-09-13
Scope: how PRISM earns a citation when a person asks an AI assistant a question
PRISM genuinely answers, for example "how do I analyze a sensitive spreadsheet
without uploading it".

---

## 0. Evidence rules for this document

Three kinds of statement appear below and they are labelled every time.

| Tag | Meaning |
|---|---|
| VERIFIED | I checked it in this repository on 2026-09-13 and the file and line are cited. |
| MECHANISM | How retrieval systems are built and documented to work. Directionally reliable, not a measured PRISM result. |
| ASSUMPTION | My judgement, with the reasoning shown so you can reject it. |

No traffic number, citation-rate number, market size or share-of-voice figure
appears anywhere in this document. I have no measurement surface for any of
them yet, and Section 10 explains why that is a structural property of PRISM
rather than laziness.

Everything in Section 1.2 was verified by reading the tree, not by reading the
brief I was given. Two facts in that brief were already out of date and one was
wrong, so I re-derived all of them. See Section 1.3.

---

## 1. The situation, stated plainly

### 1.1 The bet

Classic SEO optimises for a human choosing between ten blue links. AEO optimises
for a language model choosing which two or three sources to quote inside a single
answer that the user will probably never click past. The second funnel is much
narrower. Ten results become roughly three cited sources, and being ranked
fourth is worth approximately nothing.

That is bad news for incumbents with broad content libraries and good news for a
product with one extremely specific, unusually checkable claim. PRISM does not
need to be the best analytics tool in the world. It needs to be the most
obviously correct answer to a narrow question that has a genuinely awkward
answer today.

### 1.2 What PRISM actually is, verified against the tree

Every row below was confirmed by reading the file on 2026-09-13.

| Fact | Evidence |
|---|---|
| Content Security Policy is `default-src 'none'` | `index.html` line 18 |
| `connect-src` permits only `'self'` and `https://cdn.jsdelivr.net/pyodide/` | `index.html`, connect-src directive |
| `form-action 'none'`, `object-src 'none'`, `frame-src 'none'` | same block |
| The only off-origin `fetch` in the source targets the Pyodide CDN and carries a subresource integrity digest | `src/workers/prism.worker.js:1244` |
| No `XMLHttpRequest`, `WebSocket` or `sendBeacon` anywhere in `src/` | grep across `src/`, only matches are in a regression test asserting their absence |
| The worker is created from a `blob:` URL so it inherits the document CSP | `src/stores/prismStore.ts:178-183` |
| No `localStorage`, `sessionStorage`, `indexedDB` or `document.cookie` anywhere in `src/` | grep across `src/`, zero matches |
| Pyodide pinned to 0.25.1 with sha256 digests per file | `src/workers/prism.worker.js:16`, `:33`, `:1244` |
| 17 inferential statistical tests are implemented | `src/workers/prism.worker.js` lines 569 to 846 |
| scipy is loaded lazily, only on the first statistical test | `src/workers/prism.worker.js:1551-1560` |
| pandas and numpy load eagerly at startup | `src/workers/prism.worker.js:1355` |
| Accepted input formats are CSV and XLSX/XLS | `src/security/validator.ts:157` |
| Only the first worksheet of a workbook is read | `src/stores/prismStore.ts:118` |
| No export or download feature exists | grep for download/saveAs across `src/`, zero matches outside comments |
| `xlsx@0.18.5` is still a static import | `src/stores/prismStore.ts:11`, `package.json` |
| Built output is 1,313,207 bytes across 8 files | `dist/`, measured |

### 1.3 Corrections to the briefing I was handed

I was told two things that are no longer true, and one that never was. AEO copy
is the layer where stale internal facts become public falsehoods, so these
matter more here than anywhere else.

**Correction 1, the worker CSP gap is closed.** The technical strategy document
records as a major finding that the meta-tag CSP does not govern the Web Worker,
leaving zero-egress enforced by code review rather than by the browser. That was
true when it was written. It is not true now. `src/stores/prismStore.ts:178-183`
now builds the worker from a `blob:` URL specifically so it inherits the
creating document's policy container, and the comment in the source says so.
There is also a regression test asserting the worker is never constructed from
an `https:` URL. This materially upgrades what we may claim: browser enforcement
of the boundary is now real, not aspirational. Do not repeat the old caveat.

**Correction 2, PRISM does inferential statistics.** The market research document
states that PRISM performs descriptive statistics only and that "no t-test,
regression, ANOVA or confidence interval exists." That conclusion came from
reading `src/python/prism_core.py`, which does import only pandas and numpy. But
the statistical engine is not in that file. It is in `src/workers/prism.worker.js`
lines 569 to 846, and it dispatches seventeen tests through `scipy.stats`:
shapiro_wilk, one_sample_t, independent_t, paired_t, one_way_anova, two_way_anova,
chi_square_ind, chi_square_gof, fisher_exact, pearson, spearman, mann_whitney,
kruskal_wallis, wilcoxon, levene, f_test and linear_regression. scipy is loaded
lazily at `:1559`, which is why it is absent from the eager package list and easy
to miss. Positioning built on "descriptive only" would have understated the
product and, worse, would have been contradicted by the first person to open the
file. Flag this back to the market and marketing owners.

**Correction 3, there is no canonical URL.** See Section 2.

### 1.4 The question we are competing for

The target query family, in the words a real person would use:

- "how do I analyze a sensitive spreadsheet without uploading it"
- "analyze CSV without uploading to a website"
- "is there a data analysis tool where the data never leaves my computer"
- "my company will not let me upload client data to a SaaS tool, what can I use"
- "browser based statistics tool no upload"
- "offline alternative to online CSV analyzer"

These queries share a shape worth noticing. The user is not asking for the best
tool. They are asking for permission to get work done under a constraint. The
constraint is the subject of the sentence. That is the question PRISM is built
to answer, and it is a question most analytics vendors cannot answer at all
because their architecture is the thing being excluded.

---

## 2. The blunt part: PRISM is currently uncitable

Before any tactic in this document matters, understand the starting position.

VERIFIED: `package.json` sets `"repository.url"` to
`https://github.com/organization/prism.git`, a placeholder. `vite.config.ts:36`
sets `base: '/PRISM/'`, targeting a GitHub Pages path deploy. No custom domain,
no CNAME file, no published site. `package.json` also sets `"private": true`.

Consequences, all of them fatal to citation and none of them fixable by writing
better copy:

1. There is no stable URL for a model to cite. A citation is a link. We do not
   have one.
2. There is no indexed page, so no retrieval system has anything to retrieve.
3. There are no third-party mentions, and third-party corroboration is what
   converts a vendor claim into something an answer engine will restate.
4. `private: true` plus a placeholder repository URL means the source cannot
   currently be read by anyone, including the crawlers that read source.

**Gate 0, and it precedes everything else in this document: publish at a stable
canonical origin you control.** Not a GitHub Pages project path. A real domain.
Path-based project pages are weak canonical targets, they make the origin a
shared one for security purposes, and they signal impermanence to both humans
and crawlers. Every artifact in this strategy, including the `llms.txt` I am
shipping alongside it, contains a placeholder host that must be replaced exactly
once, in one pass, when that domain exists.

ASSUMPTION: a real apex domain also unlocks response headers, which the
technical roadmap wants for a header-delivered CSP. Reasoning: GitHub Pages does
not let you set arbitrary response headers, and every static host that does
(Netlify, Cloudflare Pages, Vercel and others) expects a domain you control.
Domain acquisition therefore serves the security roadmap and the AEO roadmap
with one purchase, which is a rare thing and an argument for doing it now.

---

## 3. The naming problem, which is the single largest AEO risk

I am putting this third because it outranks every piece of structured data and
every content tactic below it.

### 3.1 The collision

"PRISM" is the name of a United States National Security Agency surveillance
program disclosed in 2013. It is one of the most heavily documented entity names
in the privacy and surveillance corpus that every large model has trained on.

This is not an ordinary trademark collision. Ordinary collisions are survivable
because they sit in different topical neighbourhoods: a person asking about
running shoes is not going to be confused by a database with the same name. Our
collision is worse in the specific way that matters most:

**The colliding entity occupies the exact semantic space we are trying to own.**

We want to be retrieved for queries about data privacy, surveillance avoidance,
and keeping data away from third parties. The NSA program is about mass
surveillance and data collection by a third party. In an embedding space, "PRISM"
plus "data privacy" plus "surveillance" does not point at us. It points at a
2013 intelligence scandal, with a decade of high-authority journalism behind it.

MECHANISM: retrieval blends lexical matching with semantic similarity, and
both channels fail us here. Lexically, "PRISM" is dominated. Semantically, our
topic makes the domination worse rather than better.

There is also a crowded software field. Numerous unrelated products ship under
the name PRISM or Prism, including a widely used scientific graphing application
in the statistics space adjacent to ours. ASSUMPTION: that adjacency is a second,
smaller collision that will produce specifically harmful confusion, because a
model asked for statistics software named Prism has a much older and better
documented candidate to reach for.

### 3.2 The honest options

I am not the naming owner, and `docs/business/brand/NAMING.md` holds that
decision. My job is to state the AEO cost accurately so the decision is informed.

**Option A, rename the product.** Highest cost, and it is the only option that
actually solves the problem rather than working around it. The cost is lowest
right now, at pre-revenue with no users and no inbound links, and it rises
permanently and monotonically from here. If a rename is ever going to happen,
the cheapest day it will ever be is today.

**Option B, always use a qualified entity name.** Never ship the bare token
"PRISM" in a title, heading, structured-data name or first sentence. Always use
a compound that carries disambiguating signal, for example "PRISM Analytics" at
minimum, and prefer a form that includes the category, for example
"PRISM local-first analytics". Compound tokens are what entity resolution has to
work with. This is cheap, immediate, and partial.

**Option C, win on the query rather than the name.** Accept that nobody will
search our name and optimise entirely for the problem-shaped queries in Section
1.4, where the competing entity is irrelevant because nobody asks the NSA program
how to analyze a spreadsheet. This is the realistic near-term play and it is
what the rest of this document assumes.

**Recommendation: B and C immediately and unconditionally, and put A in front of
the founder as a real decision with a real deadline rather than letting it drift
into a default by inaction.** Note that a rename is significantly cheaper than
it looks, because the repository is private, there are no users, there are no
inbound links, and nothing in this document except the placeholder host would
need to change.

### 3.3 The rule that follows

Whatever the name, the disambiguation burden falls on the sentence, not the
noun. Every canonical description of the product must name the category and the
distinguishing property within the first clause, because a model reading one
paragraph in isolation has nothing else to anchor on. "PRISM is a browser-based
analytics tool" is weak. "PRISM Analytics is a browser-based data analysis tool
that runs entirely on the user's own machine, with no server upload" is strong,
because every content word in it is a retrieval handle and none of them belong
to the other entity.

---

## 4. What actually drives citation

Being honest about mechanism here, because the field is full of confident
claims that do not survive contact with how these systems are built.

### 4.1 Three different surfaces, only two of which we can influence

**Surface 1, the training corpus.** A model may know about PRISM because pages
about it existed when the model was trained. We cannot target this directly, the
lead time is many months to years, and it is unfalsifiable in the short term. Do
not build a plan on it. It is a lagging consequence of doing Surfaces 2 and 3
well for a long time.

**Surface 2, retrieval at answer time.** The assistant runs a search, fetches a
handful of pages, and grounds its answer in what comes back. This is the surface
that matters, it is the one we can influence this quarter, and it has a hard
prerequisite that is easy to skip past: to be retrieved at answer time, we must
be findable by the underlying search index. MECHANISM: assistant browsing is
generally layered on top of a conventional web index rather than replacing it.
Classic indexability is therefore not superseded by AEO, it is a dependency of
AEO. A page that is not indexed cannot be retrieved, and a page that cannot be
retrieved cannot be cited.

**Surface 3, the model reading a page we handed it.** A user pastes our URL, or
an agent follows a link. Here the entire game is whether the page is
comprehensible in one read without navigation. This is where `llms.txt` and
clean extractable prose pay off.

### 4.2 What makes a passage get lifted

MECHANISM, plus judgement. A passage tends to be quoted when it is:

- **Self-contained.** It answers the question without requiring the sentence
  before it. Anaphora is the enemy: "It does not do this" is unliftable, because
  lifted out of context it means nothing.
- **Declarative and specific.** "PRISM reads CSV and XLSX" beats "PRISM
  supports many common formats." Specificity is not just better writing, it is
  a stronger retrieval match against the specific thing the user asked.
- **Correctly scoped.** A sentence with its own qualifier attached survives
  extraction. A sentence whose qualifier lives two paragraphs away becomes a
  false claim the moment it is quoted, and we get blamed for the falsehood.
- **Question-shaped in its heading.** Headings written as the user's actual
  question match the user's actual question. This is not a trick, it is just
  removing a translation step.
- **Verifiable.** See 4.3, which is the part of this strategy I believe in most.

### 4.3 Verifiability is our unfair advantage

Most vendor claims are unverifiable assertions, and a well-behaved model hedges
them: "according to the vendor's website." That hedge is a weak citation.

PRISM's central claim is different in kind. It is checkable by anyone in under a
minute, without trusting us, using tools already on their machine:

1. Open the browser network panel, load a file, run an analysis, and observe
   that no request carries the data.
2. Disconnect from the network after the page has loaded and confirm analysis
   still runs.
3. Read the CSP in the page source.
4. Read the source and find no network primitives.

ASSUMPTION, with reasoning: a claim accompanied by a reproducible verification
procedure is more likely to be restated confidently, because the procedure is
itself a fact about the world rather than a promise about our behaviour, and
because a model summarising us can pass the procedure along to the user instead
of vouching for us. Reasoning: this is how citation works for technical claims
generally, where the method is the credibility. I cannot measure this, so it is
labelled as judgement, but it is the judgement the whole content plan rests on.

**The strategic consequence: the highest-value page we can build is not a
marketing page. It is a verification page that teaches the reader how to check
our claim and tells them exactly what they will see, including what our
architecture does not protect them from.** That page should carry the limits
section from Section 8.2 in full. Publishing our own limitations is not modesty
here, it is retrieval surface for the skeptical queries, and those are the
queries our buyer actually types.

---

## 5. Claim discipline, or how we avoid getting cited for something false

An answer engine will restate what it finds. If it finds something false on our
own site it will repeat the falsehood with our name attached, and we will have
laundered our own error into an apparently independent source. This section is
therefore a safety control, not a style guide.

### 5.1 The red list, never publish these

VERIFIED problems in the current `README.md`, which today is the most
model-readable artifact we have and is actively dangerous:

| Current claim | Status | Why it is dangerous |
|---|---|---|
| "WCAG 2.2 Level AAA" badge and compliance table row | No audit exists | An accessibility compliance claim with nothing behind it, in a document a crawler will read as authoritative |
| "ISO/IEC 27001:2022 Compliant" | No certification exists | Certification is a factual status granted by a certification body. This one is checkable and false. |
| "EN 301 549 Compliant", "GDPR Article 32 Compliant", "PIPEDA Compliant" | Unverified | Same class of problem, repeated four more times in one table |
| "Scikit-Learn (in browser)" in the stack list | Not true | `src/workers/prism.worker.js:1355` loads pandas and numpy; `:1559` loads scipy. sklearn appears nowhere. |
| "Zero Trust" badge | Term misuse | Zero trust is a specific network security architecture. This audience knows the term and will mark us down for misusing it. |

The compliance table is the single worst AEO liability in the repository. It is
formatted as a structured table of standard names with checkmarks, which is
close to the ideal shape for machine extraction. We have optimised a false claim
for liftability. If an assistant tells a hospital that PRISM is ISO 27001
certified, on our own authority, that is both a commercial and a legal problem.

**Blocking: the compliance table and both badges must be removed or rewritten
before the site is indexable.** `README.md` is outside my file scope, so this is
a handoff, not an edit. Flagging it to the engineering owner.

The honest replacements, which are true today and still strong:

- "Designed against WCAG 2.2 AA, not independently audited."
- "Architected on ISO/IEC 27001 principles by a founder who audited to that
  standard at KPMG. PRISM itself is not certified."

Both keep the substance, both survive a skeptic, and the second is arguably more
persuasive than the badge precisely because it refuses the badge.

### 5.2 The qualifier-adjacency rule

Any claim with a limit must carry its limit in the same sentence or the
immediately following one. This is mandatory, because extraction does not
respect our paragraph structure.

Bad: "PRISM runs entirely in your browser." (Two sections later: "an internet
connection is required on first load to fetch the Python runtime.")

Good: "PRISM runs all analysis in your browser. It does download its Python
runtime from a public CDN on first load, so the first visit needs an internet
connection, but your file is never part of any request."

The second survives being lifted alone. The first becomes a lie the moment
somebody asks whether PRISM works offline.

### 5.3 The four claims we must never let drift

These are true today. They are also easy to overstate by one word, and each
overstatement is the one a critic would go for first.

| True claim | The overstatement to avoid |
|---|---|
| Your file is never sent anywhere | "PRISM never makes any network request" (false: it fetches Pyodide) |
| Analysis runs on your machine | "PRISM works offline" (false on first load, see 8.2) |
| The browser enforces the boundary via CSP | "PRISM is unhackable" or "PRISM is certified secure" |
| No account, no telemetry, no cookies | "PRISM is anonymous" (we do not control the network path or the host's logs) |

---

## 6. Structured data

MECHANISM: structured data is a machine-readable restatement of what the page
already says. It helps parsers agree on entities and relationships. It is not a
ranking cheat, and marking up a claim does not make the claim true or make an
unindexed page retrievable. Treat it as hygiene that removes ambiguity, not as
leverage.

### 6.1 What to mark up, in priority order

**1. `SoftwareApplication` on the home page.** This is the entity definition and
the main disambiguation lever against Section 3's collision. Fill `name`,
`alternateName`, `applicationCategory`, `applicationSubCategory`,
`operatingSystem`, `browserRequirements`, `featureList`, `softwareVersion`, and
`offers`. Do not fill `aggregateRating` or `review`. We have no users, so any
rating would be fabricated, and fabricated ratings in structured data are both a
policy violation and a direct breach of our own honesty rules.

**2. `FAQPage` on the verification and FAQ pages.** Source every entry verbatim
from `ANSWER_BLOCKS.md` so the visible text and the markup cannot drift apart.
Never mark up an answer that is not visible on the page.

**3. `TechArticle` on the architecture write-up.** This is the deep artifact
that third parties will link to, and the one most likely to be read by a
technical audience.

**4. `Organization`** with `founder` as a `Person`, carrying the founder's real
credentials. ASSUMPTION: named-human provenance helps entity resolution and
carries some authority signal for a product with no usage history. This is the
one authority asset we have that competitors with more traffic may not.

### 6.2 The `SoftwareApplication` block

Every value below is VERIFIED against the tree. Replace `example.invalid` with
the real host exactly once, when Gate 0 closes.

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PRISM Analytics",
  "alternateName": "PRISM",
  "applicationCategory": "BusinessApplication",
  "applicationSubCategory": "Data Analysis",
  "operatingSystem": "Any modern web browser with WebAssembly support",
  "browserRequirements": "Requires JavaScript and WebAssembly",
  "url": "https://prism.example.invalid/",
  "description": "PRISM Analytics is a browser-based data analysis tool for CSV and Excel files. All parsing, statistics and charting run locally in the browser using WebAssembly. Files are never uploaded to a server.",
  "featureList": [
    "Reads CSV and XLSX files entirely in the browser",
    "Descriptive statistics and automatic column type detection",
    "17 inferential statistical tests including t-tests, ANOVA, chi-square, Mann-Whitney and linear regression",
    "Charts rendered locally from local data",
    "No account, no sign-up, no cookies and no telemetry"
  ],
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free hosted version, no account required"
  },
  "isAccessibleForFree": true,
  "author": {
    "@type": "Person",
    "name": "Jesun Ahmad Ushno",
    "jobTitle": "AI Engineer and Data Architect"
  }
}
```

Deliberately absent: `aggregateRating`, `review`, `downloadUrl` (no offline
build exists yet), and any `award` or certification property. Note that `offers`
at price 0 is only accurate while the hosted tier is free and unauthenticated,
which the finance document proposes to keep permanently. If that changes, this
changes the same day.

### 6.3 Anti-patterns

Do not mark up the compliance table from Section 5.1, in any form, ever. Do not
invent a `softwareVersion` that does not correspond to a real release. Do not
use `FAQPage` for questions nobody asks in order to farm surface area, because
it degrades the pages that answer real questions.

---

## 7. Where assistants actually read

MECHANISM plus ASSUMPTION. Ranked by my estimate of citation value for this
specific product and query family. I have no measured citation data, so this is
reasoning about retrieval behaviour, not a measured ranking.

**Tier 1, the ones worth real effort.**

1. **Our own canonical domain.** Blocked by Gate 0. Everything else here amplifies
   this or substitutes poorly for it.
2. **A public source repository.** Source repositories are unusually well
   represented in what models read, they carry a README that is effectively a
   structured product description, and for a product whose whole claim is "read
   the source and check," a private repository is a strategic contradiction. Our
   claim is verifiability. We are currently asking people to take verifiability
   on faith. See Section 11 for the tension with the proprietary licence.
3. **Technical community discussion, earned not placed.** Hacker News, Lobste.rs
   and the relevant subreddits produce durable, heavily-read pages. The launch
   plan already gates these correctly. A thread where the claim survived hostile
   scrutiny is worth more than any page we write about ourselves, because it is
   third-party corroboration of exactly the thing a model would otherwise hedge.

**Tier 2, worth doing once each.**

4. **Stack Overflow and technical Q&A**, only as a genuine answer to a genuine
   question that PRISM genuinely solves, disclosed as ours. Undisclosed
   self-promotion is both against site rules and against our brand's entire
   premise. An honest disclosed answer on a real "analyze CSV without uploading"
   question is legitimate and durable.
5. **Wikipedia-adjacent reference works.** We do not qualify for a Wikipedia
   article and should not attempt one. Notability is not there and the attempt
   would backfire.
6. **Comparison and alternative-to directories.** Low quality individually,
   collectively part of how entity facts propagate. Submit accurate data, expect
   little, and check periodically that they have not invented features for us.

**Tier 3, explicitly deprioritised.**

7. Product Hunt, for the audience-mismatch reason the launch plan already argues.
8. Any paid placement, any AI-generated content farm, any reciprocal link
   scheme. These damage the exact credibility our claim depends on, and for a
   security product the downside is asymmetric.

**The honest ordering note:** Tier 1 item 3 is worth more than items 1 and 2
combined for citation purposes, and it is the one we cannot directly control. We
can only earn it by being genuinely interesting to a skeptical technical
audience, which means the engineering gates in the launch plan are also the AEO
plan. There is no content shortcut around a live HIGH severity CVE.

---

## 8. The content set

Small, specific, and each piece written to be liftable. I would rather ship six
excellent extractable pages than forty thin ones. MECHANISM: thin pages compete
with our own strong pages for retrieval and dilute the entity.

### 8.1 The six pages

| Page | Purpose | Primary query it answers |
|---|---|---|
| Home | Entity definition, the claim, the check | "what is PRISM Analytics" |
| **Verify it yourself** | The credibility engine, see 4.3 | "is it really local", "how do I verify" |
| How it works | Architecture, honest boundaries | "how does browser-based analysis work" |
| What PRISM cannot do | Limits, stated by us first | "PRISM limitations", "what are the downsides" |
| FAQ | `ANSWER_BLOCKS.md` rendered with `FAQPage` markup | the long tail |
| Architecture deep dive | The linkable technical asset | "CSP browser analytics", "Pyodide in a worker" |

"What PRISM cannot do" is not a humility exercise. It is a retrieval play. When
somebody asks an assistant "what are the limitations of PRISM", the assistant
will answer from somewhere. Either that source is us, accurate and in our own
framing, or it is a critic, or it is invention. Writing it ourselves is the only
option where the answer is both accurate and ours.

### 8.2 The limits page must include these, all VERIFIED

- First load requires an internet connection to fetch the Pyodide runtime from
  a public CDN. Your file is not part of that request, and after loading,
  analysis runs without the network.
- Only the first worksheet of a multi-sheet workbook is read
  (`src/stores/prismStore.ts:118`). This is the most likely way PRISM gives a
  silently wrong answer today, and it deserves to be stated publicly, not buried.
- Charts truncate to a fixed number of rows rather than sampling
  (`src/workers/prism.worker.js`, multiple `.head()` calls), so a chart may not
  represent the whole dataset.
- There is no export or download feature yet (verified: zero matches in `src/`).
- Dataset size is bounded by browser memory, and we have not published a measured
  ceiling. We will not quote one until it is measured, and the scaling document
  contains the measurement protocol.
- PRISM cannot protect you from a compromised machine, a malicious browser
  extension, or a hostile endpoint. It removes the upload, not every risk.
- Input formats are limited to CSV and XLSX/XLS.

Publishing the second and third items costs us something real. It is still the
right call, both ethically and tactically: an audit-minded buyer who finds the
worksheet limitation themselves after we hid it will not come back, and an
assistant that finds our own frank limitations page will treat the rest of our
claims as more credible, not less.

### 8.3 The format rule

Every page: question-shaped H2s, one claim per paragraph, the answer in the
first sentence after the heading rather than the last, no marketing preamble
before the substance, tables for anything enumerable. Write the answer, then
the reasoning. Not the reverse.

---

## 9. llms.txt

I have shipped a real one at `docs/growth/aeo/llms.txt`.

**Honest framing, because this convention is over-sold.** `llms.txt` is a
proposed convention (llmstxt.org) for a markdown file at the site root that
gives a model a curated, navigable summary of a site. Adoption by major
assistants is not universal and it is not a ranking mechanism. MECHANISM: its
real, reliable value is Surface 3 from Section 4.1, the case where a model or
agent is already reading our site and benefits from a clean map instead of
having to parse marketing HTML.

That is a modest benefit. It is also nearly free, it costs one file, and the
discipline of writing it forces exactly the clarity the rest of the site needs.
Ship it. Do not expect it to move anything on its own, and do not let anyone
report it as an AEO win.

Placement when Gate 0 closes: served at the site root as `/llms.txt`,
`Content-Type: text/plain; charset=utf-8`. Note VERIFIED: `vite.config.ts:36`
sets `base: '/PRISM/'`, so under the current GitHub Pages path deploy the file
would land at `/PRISM/llms.txt`, which is not the root and is one more reason
Gate 0 matters. Keep it in sync with the site on every release, because a stale
`llms.txt` is worse than none: it feeds confident, wrong, quotable facts.

Also ensure `robots.txt` does not block the crawlers we want. ASSUMPTION worth
stating: we have no business reason to block AI crawlers, since our entire
strategy is to be read and quoted accurately by them. If anyone proposes
blocking them, the burden of proof is on that proposal.

---

## 10. Measuring this without telemetry

VERIFIED: `src/` contains no `localStorage`, `sessionStorage`, `indexedDB` or
`document.cookie`, and `connect-src` forbids reaching any analytics endpoint.
PRISM cannot instrument itself. This is deliberate and it is the product.

So we cannot measure citation the way an instrumented SaaS would, and I am not
going to pretend otherwise or propose a metric I cannot collect.

**What we can actually observe:**

1. **Manual citation audits.** A fixed panel of roughly 20 queries from Section
   1.4, run across the major assistants on a fixed schedule, with results
   recorded by hand in a dated log. Record whether PRISM appeared, whether it
   was cited with a link, and critically **whether what was said about PRISM was
   true**. Accuracy is a first-class metric here, not an afterthought.
2. **Server-side request logs**, once we are on a host that provides them. This
   is site-side, not user-side, and reveals nothing about any user's data. It is
   compatible with our claim, and we should say so plainly when asked, because
   somebody will ask and the question is fair.
3. **Referral origin**, available from logs, showing which pages assistants
   actually fetch.
4. **Conversations.** Warm-network and inbound conversations where a person says
   how they found us. Unscalable, small-n, and the highest-quality signal we
   have at this stage.

**The metric that matters most is citation accuracy, not citation count.** A
confident wrong citation, for example an assistant telling someone we are ISO
27001 certified, is worse for this company than no citation. Track it
deliberately, and treat a correction as a content bug with a fix deadline.

**Banned:** any invented citation-rate figure, any "AI search share" number, any
projection of assistant-driven traffic. We have no basis for any of them.

---

## 11. The open tension I cannot resolve

Our AEO strategy says: be verifiable, publish the source, let skeptics check us,
and earn technical community corroboration.

Our licensing says: VERIFIED, `LICENSE` contains the MIT licence text,
`package.json` says `"license": "PROPRIETARY"` and `"private": true`, and the
`README` reads as an open source project. These are three mutually incompatible
positions held simultaneously, and `repository.url` still points at a
placeholder.

This is not only a legal tidiness problem, it is directly an AEO problem:

- A model asked "is PRISM open source" has no correct answer available, and will
  pick one, and will be wrong at least some of the time.
- "Read the source and verify" is our strongest content asset and it requires a
  readable source.
- A private repository forfeits Tier 1 item 2 entirely.

I cannot resolve this: licensing is a founder decision and those files are
outside my scope. **What I need is a single decided answer before launch**,
because `llms.txt` and the FAQ both have a licence line and I will not guess.
Until then, both artifacts say the status is being finalised, which is honest
and unsatisfying. The finance document proposes a source-available commercial
tier, which would resolve the tension in the direction the AEO strategy wants,
but that is a recommendation from another desk and not my call to make.

---

## 12. Sequenced plan

**Gate 0, blocking everything.** Acquire a domain, deploy to a host that serves
response headers, resolve the canonical URL. Nothing below matters first.

**Phase 1, remove the liabilities.** Strip the false compliance claims and
badges from `README.md` and every other public surface. Fix the sklearn claim.
Resolve the licence question. Handoff: engineering and founder own these; they
are outside my file scope.

**Phase 2, ship the content set.** The six pages in 8.1, all `ANSWER_BLOCKS.md`
entries live and marked up, `llms.txt` at root, structured data deployed. The
verification page is the priority and should ship first if anything slips.

**Phase 3, earn corroboration.** Launch-plan channels, in the launch plan's
order, behind the launch plan's gates. Publish the architecture deep dive as
the linkable asset first, so every discussion has somewhere substantive to point.

**Phase 4, audit and correct.** Start the manual citation audit at a fixed
cadence. Treat every inaccurate citation as a content bug: find the page that
permitted the misreading, fix it, re-audit.

**Ongoing discipline.** Every product change that touches the claim surface,
CSP, network behaviour, storage, formats, licence, updates `llms.txt` and
`ANSWER_BLOCKS.md` in the same change. Stale AEO artifacts are not neutral, they
are a mechanism for publishing confident falsehoods at scale.

---

## 13. Risks

| Risk | Severity | Honest assessment |
|---|---|---|
| The name collision is unwinnable | High | Section 3. Option C works around it. Only a rename solves it, and today is the cheapest it will ever be. |
| We get cited for the false compliance claims | High | Live right now in `README.md`. Phase 1 exists for this. |
| No canonical URL | High | Gate 0. Purely a blocker, fully within our control. |
| Open CVE surfaces in a technical discussion | High | The launch plan already gates on this, and the audience we want checks dependencies before reading copy. |
| The claim is quoted without its qualifier | Medium | Section 5.2 is the control. Enforce it in review, not by hoping. |
| Assistants do not read `llms.txt` | Low | Section 9 already assumes limited value. Cheap either way. |
| Competitors publish the same sentence | Medium | They already do. The market document verified DuckDB's Local UI making a near-identical claim. Our differentiator is the intersection in `DIFFERENTIATION.md`, not the sentence. Do not build AEO copy on the assumption that the sentence is ours. |
| We cannot measure any of this well | Medium | Section 10. Accepted deliberately as the cost of the architecture. |

---

## 14. What I would tell the founder in one paragraph

PRISM has an unusually good AEO position on the merits, because it answers a
specific question that most competitors architecturally cannot answer, and
because its central claim is checkable in sixty seconds rather than merely
asserted. It also currently has no published URL, a product name that collides
with a famous surveillance program in exactly our topical space, and a README
containing false compliance claims formatted for easy machine extraction. The
merits are real and the liabilities are all fixable, but the liabilities are not
content problems and no amount of writing will move them. Buy the domain, delete
the badges, decide the licence, and then the content in this directory is worth
shipping.
