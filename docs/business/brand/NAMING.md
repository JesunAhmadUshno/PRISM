# PRISM Naming Conventions

Owner: Brand and Voice
Last revised: 2026-09-13
Scope: names for features, interface objects, tiers, releases, artifacts and documents.

This document is a set of rules and a set of proposals. It does not rename anything.
**Nothing here authorises an edit to `src/`, `package.json`, `index.html` or `README.md`.**
Where a rename is recommended, it is recorded as a proposal for the engineering team to
schedule.

---

## 1. Why naming is a brand control here

PRISM's entire proposition is that the buyer does not have to trust our description of the
product, because they can check it. A name is a description. When the name overclaims, it is
the first thing the checker finds wrong, and it discredits the claims that are true.

The repository currently contains three names that overclaim: `SmartChart`, "AI Insights"
and "Smart Visualizations." None of them describes what the code does. A buyer who reads
"AI Insights," opens `src/workers/prism.worker.js` and finds rule-based threshold logic over
pandas output has caught us in a small lie, and will then apply more scepticism to the
no-egress claim, which is the one that matters and which happens to be true.

**The governing rule: a PRISM name must survive a reader opening the code that implements
it.**

---

## 2. Principles

1. **Descriptive over evocative.** The name says what the thing does. Evocative names are
   for companies that need to create a feeling. We need to withstand an inspection.
2. **Boring is a feature.** The audience is auditors, analysts and security reviewers. A
   whimsical feature name costs credibility in exactly that room.
3. **No capability adjectives.** "Smart," "intelligent," "auto," "AI," "magic," "instant,"
   "advanced" and "pro" are all banned as name components. They claim quality rather than
   state function.
4. **Use the user's word, not ours.** An auditor says "normality test," not "distribution
   checker." When a standard term exists in statistics, accessibility or security, use it
   exactly. Deviation from a standard term reads as either ignorance or evasion.
5. **One name per concept, everywhere.** The same thing must carry the same name in the
   interface, the documentation, the code identifier and the sales conversation. Divergence
   between interface copy and code identifiers is a defect, not a stylistic choice.
6. **A name must not imply a property the architecture cannot deliver.** "Sync," "cloud,"
   "share," "workspace," "account," "dashboard" and "live" all imply persistence or a
   server. None of those exist, and none will.
7. **No light metaphor in sub-names.** The product name already carries it. Naming features
   Spectrum, Refract, Beam, Lumen or Facet turns a working metaphor into a theme park. One
   metaphor per company.
8. **No single-letter or numeric version suffixes as names.** "PRISM 2" is a version.
   "PRISM X" is nothing.

---

## 3. The name space, layer by layer

| Layer | Convention | Example |
|---|---|---|
| Product | `PRISM`, always full caps, never abbreviated, never pluralised | PRISM |
| Distribution tier | `PRISM` plus one plain English noun, sentence case | PRISM Offline |
| Interface region | Sentence case, plain noun phrase, no product prefix | Datasets, Analysis, Results |
| Feature | Verb phrase or standard technical noun. No adjectives | Merge datasets, Normality test |
| Statistical procedure | The standard textbook name, spelled conventionally | Kruskal-Wallis, Shapiro-Wilk |
| Chart type | The standard chart name | Histogram, Box plot, Heatmap |
| Release | Semantic version. See section 6 | 0.4.0 |
| Downloadable artifact | Name, version, date, integrity digest. See section 6.4 | `prism-0.4.0-20260913.zip` |
| Document | `SCREAMING_SNAKE_CASE.md` under `docs/`, matching current practice | `SCALING_LIMITS.md` |
| Code identifier | Existing repository conventions govern. Not this document's jurisdiction | |

---

## 4. Feature naming rules

**Form:** either a verb phrase describing the action the user takes, or the standard
technical noun for the object. Never a branded compound.

**Length:** two or three words. If a feature needs four words, the feature is probably two
features.

**Test before adopting any feature name, all four must pass:**

1. Would a reader who opens the implementing code find the name accurate?
2. Would an auditor use this word in conversation without explaining it?
3. Does it avoid every adjective in principle 3?
4. Does it avoid implying persistence, a server or collaboration?

### 4.1 Existing names, assessed

Proposals only. Code renames are for the engineering team to schedule, and interface copy
changes should ship before or with the code rename so the two never disagree in a release.

| Current name | Where | Verdict | Proposed |
|---|---|---|---|
| `SmartChart` | `src/components/visualization/SmartChart/` | Fails rule 3. The component recommends a chart type from inferred column types, which is useful and is not smart | `RecommendedChart` in code, "Recommended chart" in the interface |
| `InsightCard` | `src/components/visualization/InsightCard/` | Acceptable in code. "Insight" is weak but not false, since the object genuinely presents a finding | Keep in code. In user-facing copy prefer "finding" |
| "AI Insights" | `README.md` features list | Fails rule 1 and section 5.2 of `VOICE.md`. There is no model. `prism_core.py` imports pandas and numpy only | "Automated findings" or, better, the literal list: "trend, outlier and correlation detection" |
| "Smart Visualizations" | `README.md` | Fails rule 3 | "Recommended charts" |
| "Auto Column Detection" | `README.md` | "Auto" is borderline but here it is literally true and the standard term in the field is "type inference" | "Column type inference" |
| `AnalyticsWorkspace` | `src/components/analytics/` | "Workspace" implies saved state that does not exist. Acceptable as an internal component name, misleading in user-facing copy | Keep in code. In the interface say "Analysis" |
| `DatasetManager` | `src/components/core/` | Accurate. "Manager" is dull, which is correct | Keep |
| `FileUploader` | `src/components/core/` | **The worst name in the repository for this brand.** PRISM's entire proposition is that there is no upload. A component called `FileUploader` in a product whose tagline is "no upload" is the single most quotable internal contradiction available to a critic | `FileSelector` or `FileDropzone` in code. In the interface: "Open a file", never "Upload" |
| `PrismAnalytics` | `src/python/prism_core.py`, `src/workers/prism.worker.js` | "Analytics" is a category word, not a function. Acceptable internally | Keep |
| "Analysis mode", "Results view mode" | Interface strings | Accurate, plain, sentence case | Keep |

**The `FileUploader` item is not a nitpick.** The word "upload" must not appear in any
user-facing PRISM string, ever, including button labels, drop zone text, accessibility
labels, error messages and documentation. The correct verbs are open, select, choose, drop
and load. A screen reader announcing "upload file button" undoes the positioning for the
user most likely to be reading the documentation carefully.

### 4.2 Names for the seventeen statistical tests

The worker implements seventeen tests dispatched on `test_id`: `chi_square_gof`,
`chi_square_ind`, `f_test`, `fisher_exact`, `independent_t`, `kruskal_wallis`, `levene`,
`linear_regression`, `mann_whitney`, `one_sample_t`, `one_way_anova`, `paired_t`, `pearson`,
`shapiro_wilk`, `spearman`, `two_way_anova`, `wilcoxon`.

**Rule: use the conventional published name, with conventional capitalisation and hyphenation,
and never invent a friendly alias.** Write "Shapiro-Wilk test," not "Normality checker."
Write "Mann-Whitney U test," not "Compare two groups." A user who does not recognise the test
name needs a one-line explanation underneath it, not a renamed test. An auditor who does
recognise it needs to see that we spelled it correctly.

Two specific requirements follow from defects documented in
`docs/business/technical/TECHNICAL_STRATEGY.md`, and they are naming requirements because the
name is what sets the user's expectation:

- `independent_t` takes `unique()[:2]` and silently compares only the first two groups it
  finds. Until that is fixed, the interface must not present it as "Independent samples
  t-test" without qualification, because that name promises a comparison the code does not
  perform. Either fix the code or name the limitation next to the test.
- `shapiro_wilk` silently subsamples to 5,000 rows. The published result must carry the
  actual n used, in the label, not in a tooltip.

---

## 5. Tier naming

The finance work in `docs/business/finance/PRICING.md` defines five commercial tiers. This
section names them and sets the rules.

**Rules:**

1. **The tier name describes what the customer gets, not how good they are.** No Basic,
   Plus, Pro, Premium, Advanced, Ultimate, Elite. Those are quality ladders, and a quality
   ladder implies the cheaper tier is a worse product. Ours is the same product in different
   forms.
2. **No metals, no gems, no light puns.** Bronze, Silver, Gold, Platinum, Diamond, Spectrum,
   Clarity are all banned. They carry no information and they date badly.
3. **Sentence case, one word where possible, `PRISM` prefix when standing alone.**
4. **The free tier is never called Free in the interface.** It is the product. "Free" as a
   price appears on the pricing page, not as an identity.
5. **No tier name may imply metering.** Nothing counts seats or usage, so nothing may be
   named as though it does.

### 5.1 Recommended tier names

| Price line | Tier name | What the name has to be true about |
|---|---|---|
| $0 hosted, no account | **PRISM Web** | It runs on the web, from us, with nothing to sign up for. Not "Free," not "Community," not "Lite," all of which imply a reduced product |
| $49 one time, perpetual | **PRISM Offline** | The artifact runs with no network connection at all. See the warning below |
| $1,200 per year, 25 seats | **PRISM Team** | Plain and accurate. Carries the paperwork, not a feature difference |
| $12,000 per year floor | **PRISM Enterprise** | The only tier where the word "enterprise" is permitted anywhere in PRISM copy, and it names a contract shape, never our maturity |
| $50,000 per year floor | **PRISM Source** | Source access and OEM rights. "Source" is literal. Do not call it OEM externally, which is our word, not the buyer's |

### 5.2 A blocking dependency on the name "PRISM Offline"

**The Offline tier must not be named, priced or sold until the SheetJS file is vendored
locally.**

The xlsx migration described in the technical strategy as steps X0 to X9 moves SheetJS to a
CDN script load. Step X8 records the honest regression this introduces: Excel parsing stops
working without a network connection. Step X9 recommends vendoring the same pinned file into
`public/` as a follow-up, which restores full offline operation.

Between X8 and X9, a tier called "Offline" would not be offline for Excel files, which is the
majority of what this audience opens. Selling it in that window would be a false name
attached to a paid product, which is the worst category of naming failure available to us.

**Gate: X9 complete, verified by loading an `.xlsx` file with the network disabled, before
the name ships.**

### 5.3 What tier names may not promise

Nothing named in this system may suggest cloud storage, syncing, a shared workspace, an
admin console, seat management, usage reporting or a customer dashboard. None of these exist
and none can exist without breaking the architecture. A tier name that implies one creates a
support expectation we can never satisfy.

---

## 6. Release naming

### 6.1 Versioning scheme

Semantic versioning, `MAJOR.MINOR.PATCH`. No codenames, no animals, no cities, no Greek
letters.

**Current state, recorded rather than edited:** `package.json` declares version `1.0.0`. At
seven commits, with a thin test suite, an open HIGH advisory, a licence stack that
contradicts itself three ways and unverified compliance claims in the README, `1.0.0` is not
an accurate statement about this software. `1.0.0` tells a reader "stable, supported, API
frozen." Our own documentation says the opposite.

**Recommendation for the engineering team, not applied here:** version the public product in
the `0.x` range until the sellable gates in `TECHNICAL_STRATEGY.md` are met, then release
`1.0.0` and mean it. Under semver, `0.x` is the correct and honest signal for software whose
interface may still change.

This matters more for PRISM than for most projects. Our brand rests on not overclaiming. A
version number is a claim, it is machine-readable, and it is the first metadata a reviewer
reads.

### 6.2 What each increment means

| Increment | Trigger |
|---|---|
| PATCH | Defect fixes, dependency bumps, copy corrections. No behaviour change a user would need to be told about |
| MINOR | New capability, new test, new chart type, new interface surface. Backward compatible |
| MAJOR | A change to what a user can rely on. **Any change to the CSP, to where computation happens, or to what leaves the machine is automatically MAJOR, regardless of how small the diff is.** A one-line CSP edit is a major release, because it changes the only promise we make |

### 6.3 Release channel names

Three, and no more:

- **stable**: what `prism.app` or the equivalent serves. Default for everyone.
- **preview**: built from the working branch. Explicitly labelled as unverified in the
  interface. Never linked from a marketing page.
- **archive**: previous pinned versions retained for reproducibility. An auditor who produced
  a figure in March needs to be able to run the March build in September. Given that the
  product is a static bundle with no server, retaining old versions costs almost nothing and
  is worth real money to this audience.

No "beta," no "early access," no "insider." Those names manufacture the scarcity that section
4.5 of `BRAND.md` prohibits.

### 6.4 Artifact naming

Downloadable builds are the paid product for the Offline tier and the evidence object for a
security review. Their names have to be unambiguous years later.

**Form:** `prism-<version>-<YYYYMMDD>.<ext>`

Example: `prism-0.4.0-20260913.zip`

Every published artifact ships alongside:

- its SHA-256 digest, published in the release notes and on the download page
- the SRI hash of any pinned third party file it loads, computed locally and never copied
  from a third party page, per step X3 of the xlsx migration
- an SBOM, named `prism-<version>-sbom.json`

**Rule:** the digest is published in at least two places under our control, so a buyer can
cross-check. A single published hash next to a single download proves nothing.

**Rule:** a released artifact is never rebuilt under the same name. If it changes, the
version changes. For a customer whose reason for buying is reproducibility, a silently
replaced artifact is the worst possible failure.

---

## 7. Naming for security and assurance artifacts

Predictable names, because reviewers look for them at conventional paths:

| Artifact | Name |
|---|---|
| Security contact and disclosure policy | `SECURITY.md` at repository root |
| Machine-readable disclosure contact | `.well-known/security.txt` |
| Our own advisories | `PRISM-ADV-<YYYY>-<NNN>`, sequential per year, never reused |
| Third party advisories | Always the upstream identifier, never renumbered. Cite GHSA and CVE identifiers exactly as published |
| SBOM | `prism-<version>-sbom.json` |
| Verification instructions page | `/verify`, linked from the landing page |

**Rule:** never assign our own identifier to someone else's vulnerability, and never quote an
advisory number from memory. Record the identifier from the tooling output at the time you
write, per step X0 of the migration plan.

---

## 8. Banned name patterns, consolidated

| Pattern | Examples | Why |
|---|---|---|
| Capability adjectives | Smart, Intelligent, Auto, AI, Advanced, Pro, Magic, Instant | Claims quality instead of stating function. Rule 3 |
| Quality-ladder tiers | Basic, Plus, Premium, Ultimate, Elite | Implies the cheap tier is a worse product. It is the same product |
| Metals and gems | Bronze, Gold, Platinum, Diamond | No information, dates badly |
| Light metaphors below the product name | Spectrum, Refract, Beam, Lumen, Facet, Prismatic | One metaphor per company. Principle 7 |
| Server-implying words | Cloud, Sync, Hub, Workspace, Portal, Console, Live, Share | Promises architecture we do not have and will not build |
| The word "upload" anywhere user-facing | Upload, Uploader, Re-upload | Directly contradicts the positioning. Section 4.1 |
| Compliance words in names | Certified, Compliant, Secure Edition, HIPAA Edition | Asserts status we do not hold. `VOICE.md` section 5.2 |
| Trend suffixes | .ai, .io in the product name, GPT, Copilot, Agent | Dates instantly and, in our case, is false |
| Codenames | Project Falcon, Operation Clarity | Two names for one thing. Rule 5 |
| Internal jargon shipped to users | OEM, ICP, egress, exfiltration in interface copy | Our words, not the buyer's. Rule 4 |

---

## 9. Before a name ships

**For a feature or interface name:**

1. It passes the four tests in section 4.
2. It appears in the same form in the interface, the documentation and the code identifier.
3. It matches the standard term if a standard term exists.
4. No word from section 8 appears in it.

**For a tier or product-level name, add:**

5. A trademark search has been run in the relevant jurisdictions by someone qualified. This
   has not been done for "PRISM" itself. **OPEN ITEM, and a real one:** the word is common,
   it is generic in optics, and it is the name of a publicly disclosed intelligence program.
   This document asserts nothing about availability or registrability. Complete this before
   any spend on brand assets or any filing.
6. A plain search-results check has been run for what a buyer finds when they search the
   name plus "analytics" and the name plus "security."
7. Domain and handle availability has been checked and recorded.
8. The name does not promise anything in section 5.3.
9. For "PRISM Offline" specifically, the X9 vendoring gate in section 5.2 is closed and
   verified with the network disabled.

**For a release, add:**

10. The version increment matches section 6.2, and any CSP change has forced a MAJOR.
11. Digest and SBOM exist and are published in two places under our control.
12. The version number is an honest statement about maturity. If it is not, it is the wrong
    number.
