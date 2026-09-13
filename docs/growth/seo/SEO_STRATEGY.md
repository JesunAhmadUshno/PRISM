# PRISM SEO Strategy

Owner: SEO
Last updated: 2026-09-13
Status: DRAFT. Pre-launch. No site is indexed today, no Search Console property exists,
no keyword volume data has been purchased.
Governing document: `docs/business/marketing/POSITIONING.md` Section 0 (the evidence ledger).
If a phrase in this file conflicts with that ledger, the ledger wins and this file is wrong.

---

## 0. What this strategy is allowed to assume

Four constraints shape every decision below. They are stated first because most SEO plans
quietly assume the opposite of all four.

### 0.1 There are no keyword volume numbers in this document

I have no authenticated Ahrefs or Semrush session in this environment. Every volume,
difficulty score and CPC is therefore **UNMEASURED** and appears nowhere. I will not
estimate them from memory, because a fabricated volume figure is exactly the kind of
number that gets built into a roadmap and never re-checked.

What I did instead: ran live searches on 2026-09-13 and read the actual result pages.
That gives something a volume number does not, which is **who currently owns the SERP and
what they say**. Ranked competitors are evidence. Volume is an input we can buy later.

How to fill the gap, in priority order:

1. Google Search Console, once a property exists. Free, and it is the only source that
   reports *our* impressions rather than a third party's model. This is the single highest
   value action and it costs nothing.
2. Google Keyword Planner via a Google Ads account. Free with an account, gives banded
   volumes, sufficient for the tier ordering in Section 3.
3. A paid tool (Ahrefs or Semrush) only once Section 3 Tier 1 has produced measurable
   impressions. Buying one now would produce numbers for pages that do not exist.

Until then, the tiering in Section 3 is ordered by **intent value and winnability**, not
by volume, and that is stated on every row.

### 0.2 PRISM has no telemetry, deliberately, and that breaks conventional SEO measurement

The product ships no analytics. `connect-src` permits only `'self'` and the Pyodide CDN
(`index.html` line 18), so a Google Analytics or Plausible snippet would be blocked by the
browser, and relaxing the CSP to admit one would falsify the only claim the company has.

Consequence, stated plainly: **we cannot measure conversion from organic traffic inside the
product.** We can measure impressions, clicks and position in Search Console. We cannot
measure what a visitor did after arriving. Any SEO plan for PRISM that promises a
conversion funnel is promising something the architecture forbids.

The one honest workaround is that the landing page in `web/` is a separate static page and
*could* carry privacy-preserving analytics without touching the app's CSP. That is a real
option and a real decision, not a technicality. Recommendation in `TECHNICAL_SEO.md`
Section 9.3: keep the landing page instrument-free too, and accept Search Console as the
only metric, because "the marketing site does not track you either" is a sentence this ICP
will check, and a third-party analytics request in the network tab of the marketing site
while the app claims zero egress is a gift to a critic.

### 0.3 The site does not exist yet and its address is a live problem

A `web/` directory was delivered by the web team during this session and is audited in
`TECHNICAL_SEO.md` Section 1.2. It is a strong page with zero SEO tags on it: no canonical,
no Open Graph, no sitemap, no `robots.txt`. So the content is ahead of the infrastructure,
and the infrastructure is still blocked on the same thing.

The only deployed surface is the application itself, built by `.github/workflows/deploy.yml`
to GitHub Pages
with `base: '/PRISM/'` (`vite.config.ts` line 36), which resolves to a project page under a
`github.io` user account.

That address cannot be SEO'd properly. `robots.txt` is only honoured at an origin root, and
the origin root of a GitHub project page belongs to the user account repository, not to
this one. The full argument and the three options are in `TECHNICAL_SEO.md` Section 2. The
strategy below assumes a real apex domain is acquired before any content ships. If that
decision is deferred, Sections 3 through 7 should be deferred with it, because publishing
articles on an address we intend to abandon buys redirects and nothing else.

### 0.4 SEO is gated behind the launch gates, not parallel to them

`docs/business/marketing/LAUNCH_PLAN.md` puts seven blocking gates ahead of any public
beat, the first being the open `xlsx@0.18.5` HIGH severity advisory. SEO inherits every
one of them, and has an additional reason to: search content is durable in a way a social
post is not. A page about "how to analyze audit data without uploading it" that ranks, and
sits above a repository carrying an unpatched HIGH advisory in its dependency tree, is a
liability that accrues interest. Ship the fixes, then the content.

---

## 1. The SERP reality, verified 2026-09-13

I searched the obvious terms and read the results. This is what is actually there.

### 1.1 The generic tool terms are saturated and unwinnable

A search for client-side CSV tooling returns a dense field of free, ad-supported,
SEO-optimised utility sites already using PRISM's exact sentence:

| Site | Their published claim | Source |
|---|---|---|
| CSV Tools | "Your data never leaves your device, no uploads, no servers, no tracking" | https://csvtools.com/ |
| HowToCSV | 60+ browser tools, "Your data never leaves your device" | https://howtocsv.com/ |
| AnalyzeData CSV Viewer | "parsing is 100% client-side" | https://analyzedata.io/tools/csv-viewer |
| Online CSV Viewer | "100% client-side, your data never leaves your device" | https://onlinecsvviewer.com/ |
| CSV Viewer Online | "no signup, no installation, no data ever leaves your browser" | https://csv-viewer.online/ |
| Local Data Tools | "no uploads, works offline, free, no sign-up" | https://www.localdatatools.com/ |
| goodyuanbo tool set | "32 tiny offline apps that never upload your data" | https://goodyuanbo.github.io/ |

This confirms and extends the finding already recorded in
`docs/business/market/COMPETITIVE_LANDSCAPE.md`. The relevant SEO conclusion is harder
than the competitive one:

> **PRISM's core marketing sentence is already the meta description of a dozen free sites
> that have years of domain age on us. We cannot win "csv tool no upload" and we should
> not spend a single article trying.**

Those sites are also structurally better suited to those queries than we are. A query like
"csv viewer online" is a *utility* intent: the searcher wants a table in four seconds. PRISM
downloads roughly 1.3 MB of application bundle and then a Pyodide runtime before it can
answer anything. On the query that rewards speed, we lose on the merits.

### 1.2 The professional-context queries are wide open

The same searches reframed around a *blocked professional* return a completely different
picture: articles and guidance, almost no products.

A search for auditor confidentiality and uploading client data surfaced, among others, a
July 2026 practitioner article in QuickRead (the NACVA financial-consulting publication)
titled "A Guide to AI Confidentiality: What You Can and Can't Upload", whose advice is
explicitly that if the data contains client-identifiable information and you do not have a
reviewed enterprise agreement, you must anonymise fully or not upload
(https://quickreadbuzz.com/2026/07/22/colin-brown-ai-confidentiality-what-you-can-and-cant-upload/).

That sentence is the whole business. A named professional publication is telling this exact
ICP, in 2026, that their options are redaction or abstention. PRISM is a third option and
nobody is present on that query with a product.

The healthcare equivalent behaves the same way. Searching HIPAA-compliant spreadsheet
analysis returns compliance explainers and cloud vendors positioning on a signed BAA
(Row Zero, Smartsheet, Google Workspace). Every one of them answers "how do I upload PHI
safely". None answers "what if I do not upload it at all". That is an unoccupied angle,
with one hard constraint covered in Section 4.

### 1.3 What this means

Two lanes, and they are not equally good:

- **Lane A, generic tool queries.** High volume, near-zero qualification, owned by
  incumbents with better product-market fit for the query. **Do not contest.**
- **Lane B, blocked-professional queries.** Lower volume, extremely high qualification,
  currently answered by articles rather than products, and requiring domain authority we
  uniquely have (an ex-KPMG ISO 27001 auditor writing the answer). **This is the strategy.**

The entire plan below is Lane B. Lane A appears exactly once, in Section 5.4, as a
low-effort defensive move, not as a growth channel.

---

## 2. Intent taxonomy

Four intents, ranked by value to PRISM. Value here means: probability that a person issuing
this query has both the problem PRISM solves and the authority to act on it.

### I-1. Blocked professional (HIGHEST VALUE)

The searcher has a specific file and a specific prohibition. They are not shopping for a
tool category, they are looking for a permitted path.

Shape of the query: a question, often first person, often naming a regulation or a
counterparty. "can I upload client data to", "is it ok to put PHI in", "vendor risk
assessment for a web tool", "analyze a file without sending it to a server".

Why it is the best intent we have: the searcher has already been told no. They are not
comparing features, they are looking for permission. PRISM's answer is not "we are safer",
it is "there is nothing to review, because nothing leaves". This is the procurement wedge
from POSITIONING Section 2 expressed as a search query.

Why nobody owns it: answering it well requires writing honestly about compliance, which
tool farms cannot do and cloud vendors will not do, because the honest answer to "is this
cloud tool HIPAA compliant" is "only with a signed BAA and a correctly configured tenant",
which is an unsatisfying article to publish if you are selling the tenant.

### I-2. Generic tool seeking (HIGH VOLUME, LOW VALUE)

"csv viewer online", "excel analyzer free", "data analysis tool no upload".

Covered in 1.1. Saturated, mismatched to our load profile, and it attracts the audience
that will never pay: the anti-ICP named in POSITIONING Section 3. Deliberately conceded.

### I-3. Mechanism curious (MEDIUM VALUE, HIGH STRATEGIC VALUE)

Developers, architects and security engineers researching the technique rather than the
product: "pyodide web worker", "run pandas in browser", "client-side data processing
architecture", "CSP default-src none real world", "is a web worker covered by the page CSP".

Low commercial intent per visit. High strategic value for three reasons: this audience
writes the internal memo that either clears or blocks a tool; they are the audience for
Hacker News and Lobste.rs in LAUNCH_PLAN Phase 2, so the article and the launch beat are
the same asset; and one of these queries (worker CSP inheritance) is a question PRISM has
an unusually well-researched, slightly embarrassing answer to, which is the kind of content
that earns links.

### I-4. Compliance and methodology research (MEDIUM VALUE, HIGHEST AUTHORITY FIT)

"ISO 27001 Annex A control evidence", "DMAIC applied to security", "how to measure control
effectiveness", "statistical sampling for SOX 404 testing".

Almost no purchase intent. This is the founder's genuine expertise and it is the only
content on this list that a competitor cannot commission. The literature here is thin and
academic: a search for Six Sigma applied to an ISMS returns a handful of ResearchGate and
arXiv papers (for example
https://www.researchgate.net/publication/351607267_Application_of_Six_Sigma_Tools_for_Improvement_of_Information_Security_Management_System)
and essentially no practitioner writing. An ex-KPMG auditor writing the practitioner
version of that is genuinely differentiated supply against genuinely thin supply.

Its role is not to convert. Its role is to make the author credible so that the I-1 pages
are believed. Treated as authority infrastructure, budgeted accordingly, and measured on
links and referring domains rather than on sign-ups (of which there are none, since the
product has no sign-up).

---

## 3. Keyword map

Every row is a real query shape, checked for the existence of the intent rather than for
volume. Columns:

- **Winnable**: my judgement of whether a new domain with one author can reach page one
  within twelve months. LIKELY / POSSIBLE / NO.
- **Claim ceiling**: the strongest thing we are permitted to say on that page, per the
  POSITIONING evidence ledger. This column is the point of the table.

All volume is UNMEASURED. Priority is intent value multiplied by winnability.

### Tier 1: build these first (intent I-1, the blocked professional)

| Query shape | Winnable | Page type | Claim ceiling |
|---|---|---|---|
| can i upload client data to an online tool | LIKELY | Article | We may describe the risk and cite the QuickRead guidance. We may say PRISM removes the upload. We may not say PRISM makes you compliant. |
| analyze a spreadsheet without uploading it | LIKELY | Landing page (money page) | "Runs in your tab. Here are four ways to verify that yourself." Nothing about accuracy. |
| how to analyse confidential data without sending it to a server | LIKELY | Article | Architecture explanation, network-tab demo, named limits (extensions, compromised endpoint). |
| is it safe to upload financial data to a web app | LIKELY | Article | Threat model, honest. Must include the cases where the answer is "yes, it is fine". |
| tool that does not upload your excel file | POSSIBLE | Comparison page | We must concede Lane A competitors exist and say what we add. Lying by omission here is not survivable with this audience. |
| offline excel analysis no install | POSSIBLE | Article | Gated: PRISM is not fully offline until SheetJS is vendored locally (TECHNICAL_STRATEGY step X9). See Section 4.2. |
| statistical analysis without sending data to the cloud | POSSIBLE | Article | We may list the 17 tests as present. We may not call them validated until tests exist. |

### Tier 2: authority pages (intent I-4, founder expertise)

| Query shape | Winnable | Page type | Claim ceiling |
|---|---|---|---|
| dmaic applied to information security | LIKELY | Long-form article | Founder's own practice. No client names, no engagement details, no KPMG endorsement implied. |
| iso 27001 control effectiveness measurement | POSSIBLE | Long-form article | "Designed against", never "certified". Biography fact only. |
| vendor risk assessment for a browser based tool | LIKELY | Article plus a real questionnaire response page | The strongest asset on this list. See 5.2. |
| how auditors evaluate saas data handling | POSSIBLE | Article | Practitioner view. Must not read as a sales page. |
| statistical sampling for control testing | POSSIBLE | Article | Cite PCAOB AS 1215 and the standard, not our product. |

### Tier 3: mechanism pages (intent I-3, technical audience)

| Query shape | Winnable | Page type | Claim ceiling |
|---|---|---|---|
| does a web worker inherit the page content security policy | LIKELY | Technical article | We have a researched, self-incriminating answer. See 5.3. |
| pyodide in a web worker production | POSSIBLE | Technical article | Cold start is UNMEASURED. Publish the method, not a number. |
| run pandas in the browser | NO (Pyodide's own docs own this) | Skip | Not contested |
| csp default-src none real application | LIKELY | Technical article | Our actual CSP, quoted from `index.html`, including what it fails to cover. |
| client side only analytics architecture | POSSIBLE | Technical article | Architecture, with the ADR costs from ARCHITECTURE_DECISIONS.md included. |

### Tier 4: brand and defensive

| Query shape | Winnable | Page type | Notes |
|---|---|---|---|
| prism data analytics | POSSIBLE | Home | Heavily contested name. See 3.1. |
| prism browser analytics | LIKELY | Home | The disambiguated form. Optimise for this, not the bare name. |
| prism analytics review | LIKELY | Nothing yet | Do not create a review page. There are no reviews. |

### 3.1 The brand name is an SEO liability and should be treated as one

"PRISM" collides with, at minimum: the NSA surveillance programme disclosed in 2013, and a
large number of existing software products using the name. `docs/business/brand/NAMING.md`
already addresses the surveillance collision as a messaging problem and correctly forbids
the ironic reversal.

The SEO problem is separate and simpler: **the bare brand term is not rankable and not
worth ranking.** A privacy product named after a mass-surveillance programme will not
outrank the programme, and would not benefit if it did, because that searcher is not
looking for us.

Decision: never optimise for "prism" alone. Every title, `<h1>`, JSON-LD `name` and Open
Graph title uses a qualified form. `NAMING.md` should be consulted for the canonical
qualifier before any of these strings are written. Until it is decided, this document uses
"PRISM browser analytics" as a working form, not as a recommendation.

This also means: **a name change is on the table and SEO is a real input to that decision.**
If naming is ever reopened, note that a distinctive name would make Tier 4 free, and
Tier 4 is currently unwinnable at any cost.

---

## 4. Terms we must not chase, and why

This section exists because the brief named two terms that are traps.

### 4.1 "HIPAA compliant analytics" is a trap in its literal form

The intent is real and valuable (Section 1.2). The phrase is not usable as a target,
because of a specific mechanic: the searcher typing "HIPAA compliant analytics" is looking
for a vendor who will sign a Business Associate Agreement. Ranking for that phrase and then
not signing a BAA produces a bounce and a bad impression with the exact person we want.

More seriously: **"HIPAA compliant" is a claim about an organisation and its agreements,
not a property of software.** HHS does not certify products. Any page implying PRISM is
HIPAA compliant is a false compliance claim and is banned by the same rule that bans
"ISO 27001 certified" (POSITIONING Section 0.2).

The permitted, and better, target is the *question* rather than the *badge*:

- Target: "can I analyze PHI without a BAA", "HIPAA and third party analytics tools",
  "does HIPAA apply if the data never leaves my computer".
- The honest answer, which is also our best pitch: a business associate agreement is
  required where a third party creates, receives, maintains or transmits protected health
  information on a covered entity's behalf (45 CFR 164.504(e),
  https://www.ecfr.gov/current/title-45/section-164.504). If no third party receives
  anything, there is no business associate relationship to paper. That is an argument a
  compliance officer can evaluate, and it is true.
- Hard rule: that page must be reviewed before publication by someone who will say "you are
  giving legal advice" if it starts to. It must carry an explicit line that it is not legal
  advice and that the covered entity's own assessment governs.

The same reasoning applies to GDPR, PIPEDA and PHIPA pages. Target the question. Never the
badge.

### 4.2 "Offline" is gated until SheetJS is vendored

`TECHNICAL_STRATEGY.md` step X8 records the honest regression in the xlsx CVE fix: moving
SheetJS to the CDN build means **Excel parsing stops working offline**, until step X9
vendors the same pinned file into `public/`. Pyodide also loads from a CDN on first run.

So "offline data analysis tool", which is a genuinely good query, is currently a claim we
cannot fully make.

Rule: no page targets "offline" until X9 ships. When it does, the claim is still not
"works offline" unqualified, it is "after the first load, works with the network
disconnected", which is a stronger and more checkable claim anyway because the reader can
test it in ten seconds. That test is already the centrepiece of the onboarding design in
`docs/design/ux/ONBOARDING.md`.

### 4.3 Anything implying the statistics are validated

There are 17 statistical tests in `src/workers/prism.worker.js` (one_sample_t,
independent_t, paired_t, one_way_anova, two_way_anova, chi_square_ind, chi_square_gof,
fisher_exact, mann_whitney, wilcoxon, kruskal_wallis, pearson, spearman,
linear_regression, f_test, levene, shapiro_wilk), backed by scipy loaded lazily in the
worker.

Note for the market team: `docs/business/market/DIFFERENTIATION.md` states PRISM is
descriptive-only because `src/python/prism_core.py` imports pandas and numpy only. That
was true of that file and is not true of the product. The inferential tests live in the
worker, not in `prism_core.py`. **That document needs correcting, and this is the SEO file
flagging it because SEO copy would otherwise have inherited the error.**

What SEO may do with this: pages may say the tests exist, and may name them, because they
demonstrably do. Pages may not say accurate, validated, reliable, or peer-reviewed.
`TECHNICAL_STRATEGY.md` also records three known correctness defects (independent_t
silently comparing only the first two groups, paired_t pairing by row position,
shapiro_wilk silently subsampling). Until those are fixed and tested, a page that ranks for
"t test online" would be actively harmful, because the person who finds it will trust the
output. **Tiers 1 through 4 contain no statistical-method queries for this reason.** That is
a deliberate omission of the largest available volume pool on the list.

---

## 5. Site architecture

Hub and spoke, with the hub being the thing that converts and the spokes being the thing
that ranks.

```
/                        Home. The money page. Target: "analyze a spreadsheet
                         without uploading it". Contains the four-step
                         self-verification sequence from MESSAGING.md.
/verify                  The proof page. See 5.1.
/security                Architecture, threat model, and our own limits.
/security/questionnaire  Pre-answered vendor security questionnaire. See 5.2.
/app  (or app.domain)    The application itself. NOINDEX. See TECHNICAL_SEO 9.2.
/writing/                Article index.
/writing/<slug>          Spokes. Tiers 1 to 3 above.
/about                   Founder. Carries the experience and expertise weight for Tier 2.
/changelog               Dated, factual. Also the natural home for correctness fixes.
```

### 5.1 `/verify` is the highest-leverage page on the site

Not a marketing page. A page whose entire content is instructions for disproving us:

1. Open DevTools, Network panel, drop a file, watch it stay empty.
2. Disconnect the network after load, run an analysis, watch it still work.
3. Read the CSP, quoted in full, with the directives explained.
4. Run `grep -rn "fetch(\|XMLHttpRequest\|WebSocket\|sendBeacon" src/` and see what comes back.

Plus a plainly worded limits section: a malicious browser extension can read the page, and
a compromised endpoint is compromised regardless. Writing our own
limits before a critic does is the house style in `VOICE.md` and it is also, incidentally,
good SEO: it is the only page in this space that will be linked to by people arguing.

### 5.2 `/security/questionnaire` is the sleeper asset

A pre-filled, public answer to the standard vendor security questionnaire: data flows,
subprocessors (there are none), data retention (nothing is stored), encryption in transit
(nothing is in transit), breach notification, SBOM.

Why it matters for search: security reviewers search for exactly this before a call, in the
form "<product> security questionnaire", "<product> SOC 2", "<product> data processing
agreement". Almost no early-stage company publishes it, so the query goes unanswered and
the reviewer emails instead, which costs the founder an hour. Publishing it captures the
query, shortens the sale, and demonstrates the personality trait BRAND.md calls
"self-incriminating, not defensive".

It must include the open `xlsx` advisory honestly while it is open, or it is worthless.

### 5.3 The worker CSP article is our best link bait, and it is self-incriminating

**Status: the underlying defect was fixed during the writing of this document, which makes
the article publishable rather than reckless.**

`TECHNICAL_STRATEGY.md` recorded that a dedicated Web Worker takes its CSP from its own
script's HTTP response headers, not from the parent document's `<meta>` tag, and that
GitHub Pages sends no CSP header, so the worker (where all the data actually is) was
running under no CSP at all.

Engineering has since changed `src/stores/prismStore.ts` to create the worker from a
`blob:` URL. A `blob:` URL is a local scheme, so the worker inherits the creating document's
policy container, which is the CSP in `index.html`. The comment in the source states the
reasoning and there is a test asserting it. Separately, the worker now pins SHA-384 digests
for every Pyodide artifact it executes (`src/workers/prism.worker.js` lines 24 to 39).

That is a better article than the one I originally planned, because it now has an ending.

That is a genuinely useful, non-obvious, under-documented fact about the web platform. An
article titled along the lines of "our Content Security Policy did not cover the part of
our app that holds the data" is:

- accurate,
- useful to every other developer building this pattern,
- exactly the register `VOICE.md` mandates,
- and a natural Hacker News and Lobste.rs post, which is LAUNCH_PLAN Phase 2 anyway.

It should be published **after** the fix is deployed, not before, and it should describe the
fix. That ordering is not spin: publishing an unfixed hole in your own product is
irresponsible, and publishing the fixed one is a case study.

### 5.4 The one concession to Lane A

Build a single, honest comparison page listing the free browser-local tools found in
Section 1.1 by name, with what each does better. It will not rank for their head terms. It
will rank for "X alternative" and "X vs" long tails, it costs one page, and it is
insurance: when a prospect searches for competitors (they will), the page they find should
be ours and should be scrupulously fair. DIFFERENTIATION.md already contains the honest
version of this content.

---

## 6. Measurement

### 6.1 What we can actually measure

| Signal | Source | Available? |
|---|---|---|
| Impressions, clicks, position per query | Google Search Console | Yes, once a property exists |
| Indexed page count, crawl errors | Search Console | Yes |
| Referring domains | Search Console links report (free) | Yes, coarse |
| Core Web Vitals field data | Search Console and CrUX | Only once there is enough traffic, which is likely never for a low-traffic site. Lab data via Lighthouse is the fallback and must be labelled as lab data. |
| What a visitor did on the site | Nothing | **No.** By choice. See 0.2. |
| Whether they used the product | Nothing | **No.** By design, permanently. |

### 6.2 Targets

No traffic targets appear here, because setting one before a single page is indexed would
be inventing a number. What appears instead are **falsifiable checkpoints**, which do the
job a target is supposed to do:

- **Checkpoint 1, 30 days after the first article ships.** Is any Tier 1 or Tier 2 query
  showing impressions in Search Console at all? Not clicks. Impressions. If zero, either
  the domain is not being crawled or the topic is wrong, and both are diagnosable.
- **Checkpoint 2, 90 days.** Is there at least one query where average position improved
  between month two and month three? Direction, not magnitude.
- **Checkpoint 3, 180 days.** Has any organic visitor become a conversation? Since there is
  no funnel, the only honest conversion metric is a human contact that can be traced to a
  page. One is a signal. Zero, with impressions present, means the pages rank but do not
  persuade, which is a copy problem and not an SEO problem.

Record the actual numbers at each checkpoint in this file. The first real number this
document contains should be a measured one.

### 6.3 Vanity metrics banned by name

Consistent with LAUNCH_PLAN: no reporting of total pageviews, social shares, "reach", or
domain authority scores from third-party tools. None of them predicts whether an audit
manager in Toronto opened the product.

---

## 7. Sequencing

Every phase is gated. Nothing in Phase 1 starts until the LAUNCH_PLAN gates are green,
because search content is durable and premature content is durable embarrassment.

**Phase 0: infrastructure (no content)**
- Resolve the domain decision (TECHNICAL_SEO Section 2).
- Build `web/` as static HTML per TECHNICAL_SEO.
- `robots.txt`, `sitemap.xml`, canonical tags and `schema.jsonld` deployed.
- Search Console property verified, sitemap submitted.
- Exit criterion: home page indexed and appearing for the exact brand-qualified term.

**Phase 1: the pages that convert (Tier 1)**
- Home, `/verify`, `/security`, `/security/questionnaire`.
- These are not articles, they are the destination every other channel links to.
- Exit criterion: all four indexed, `/verify` loading under the performance budget.

**Phase 2: authority (Tier 2, one article)**
- The DMAIC and ISO 27001 piece. Deepest moat, least competition, and it makes the founder
  a credible author for everything after.
- Exit criterion: published, and submitted to the professional rooms named in LAUNCH_PLAN
  (IIA and ISACA chapters) rather than to a general audience.

**Phase 3: mechanism (Tier 3, one article)**
- The worker CSP piece, after the fix ships. Doubles as the Hacker News beat.
- Exit criterion: published, with link acquisition measured rather than traffic.

**Phase 4: the blocked-professional long tail (Tier 1 articles)**
- Two to four pieces, driven by whatever Search Console shows is already producing
  impressions after Phases 1 to 3. Let the data pick, not this document.

Cadence note: one author, no budget for a content team, and the founder's hours are the
binding constraint named in `UNIT_ECONOMICS.md` (630 commercial hours per year). A plan of
four strong pages per year that are genuinely authoritative beats twenty thin ones, and it
is the only plan that fits the hours. Anything faster is a plan to hire, which is a
different document.

---

## 8. Risks

| Risk | Likelihood | What it does | Response |
|---|---|---|---|
| The domain decision is deferred and content ships on a `github.io` project path | Medium | Wasted work, forced migration, lost equity | Phase 0 is a hard gate. Do not write Phase 1 copy first. |
| A compliance page drifts into a compliance claim | Medium | The exact failure the POSITIONING ledger exists to prevent, and credibility loss with the only audience that matters | Every page with a regulation in the title gets a second read against POSITIONING 0.2 before publishing. Non-negotiable. |
| We chase the generic tool terms anyway because the volume is tempting | Medium | Months of effort, no ranking, and the anti-ICP if it half works | Section 1.3 is the decision. Revisit only with SERP evidence that it changed. |
| Google's treatment of a single-author site with no backlinks | High | Slow or no indexing regardless of quality | Accept it. This is why Phases 2 and 3 target professional rooms and link-earning technical writing rather than keyword volume. |
| An article ranks for a statistical method query and someone trusts a defective test | Low, but severe | Actual harm to a user's work | Section 4.3. No statistical-method pages until the three known defects are fixed and tested. |
| AI answer engines summarise our pages without a click | High, and rising | Impressions without traffic | Partly why `schema.jsonld` exists: if we are going to be quoted without a visit, the structured facts should be ours and should be accurate. Not a solvable problem, and not worth optimising against. |
| The brand name buries us | Certain, ongoing | Tier 4 unwinnable | Section 3.1. Never optimise for the bare name. Feed the naming decision. |

---

## 9. Open items

1. **Domain not chosen.** Blocks everything. TECHNICAL_SEO Section 2 lays out the options.
2. **Canonical brand qualifier not chosen.** Needed before any `<title>`, JSON-LD `name`
   or Open Graph string is finalised. Owner: `NAMING.md`.
3. **No Search Console property.** Five minutes of work, but it needs the domain first.
4. **`DIFFERENTIATION.md` states PRISM is descriptive-only.** It is not. 17 inferential
   tests exist in the worker. Flagged in Section 4.3, owner is the market team.
5. **Whether the marketing site carries any analytics at all.** Recommendation is no
   (Section 0.2). It is a founder decision, not an SEO one, and it should be made
   deliberately rather than by default.
