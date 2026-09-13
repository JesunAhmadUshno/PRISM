# PRISM Positioning

Owner: CMO
Last updated: 2026-09-13
Status: DRAFT. Pre-revenue, zero users, zero customer interviews completed.
Scope: this document governs every outbound word. If a claim is not in Section 0's
"provable today" table, it does not go in a landing page, a post, a deck or a demo.

---

## 0. The evidence ledger (read before writing any copy)

Positioning built on a claim we cannot demonstrate in ninety seconds is not positioning,
it is exposure. This is the current state of the evidence.

### 0.1 Provable today, in front of a skeptic, without trusting us

| Claim | How a skeptic verifies it themselves | Status |
|---|---|---|
| The page declares default-src 'none' | View source on index.html, read the CSP meta tag | VERIFIED |
| Outbound connections are restricted to the runtime CDNs | Read connect-src and script-src in the same tag | VERIFIED |
| form-action 'none', object-src 'none', frame-src 'none' | Same tag | VERIFIED |
| There is no fetch, XMLHttpRequest, WebSocket or sendBeacon anywhere in src/ | A recursive grep for those four tokens across src/ | VERIFIED |
| Parsing and statistics run in the tab | SheetJS in the page, Pyodide in a Web Worker over WebAssembly | VERIFIED |
| The user can watch the network tab stay empty after load | DevTools, Network panel, disable cache, drop a file | VERIFIED, and this is the demo |
| Files accepted: Excel, CSV | The supported MIME map in src/security/validator.ts | VERIFIED |
| Analysis produced: column type inference, descriptive statistics, chart recommendations, outlier / trend / correlation flags | src/python/prism_core.py | VERIFIED as present, NOT verified as correct, see 0.2 |

### 0.2 Claims that are currently OFF LIMITS

Do not write these. Not softened, not hedged, not "essentially."

1. **"WCAG 2.2 AAA"** and **"accessible"** used as a compliance claim. The README asserts AAA
   with nothing behind it. Permitted substitute: "designed against WCAG 2.2, with keyboard
   navigation, screen reader data tables and chart sonification built in. Independent audit
   not yet performed." That sentence is true and still differentiating.
2. **"ISO/IEC 27001:2022 compliant"** or "certified." There is no ISMS, no scope statement,
   no Statement of Applicability, no auditor. Permitted substitute: "architected by a former
   KPMG IT Advisory auditor who ran ISO 27001 engagements in banking and healthcare."
   That is a biography fact, not a certification claim, and it is the one we are allowed.
3. **Any correctness claim about the statistics.** There are currently zero tests in the
   repository. An engineering team is fixing that now. Until a test suite exists and passes
   in CI, we do not say "accurate," "validated," "reliable" or "production ready."
4. **Any performance or throughput number.** No "handles 1M rows," no "analyses in N seconds."
   Nothing has been benchmarked. Note that src/security/validator.ts sets MAX_FILE_SIZE to
   500 MB while its own docstring says 50 MB, which is itself an unresolved inconsistency.
   We quote no size ceiling until engineering fixes and benchmarks it.
5. **Any user, customer, revenue, waitlist or market-size number.** There are none. There is
   also no telemetry, by design, so we will never have usage numbers of the usual kind.
6. **Any implication of KPMG endorsement.** "Ex-KPMG IT Advisory" is a true biographical fact
   about the founder. "Trusted by KPMG," "audit-firm approved," or the KPMG logo anywhere
   near our brand is false and, given this ICP, career damaging.

### 0.3 The marketing gate: one open item blocks the security story

xlsx@0.18.5 carries a HIGH severity prototype pollution advisory with no fix available on
npm. The remediation is migration to the SheetJS CDN build, and the CSP already whitelists
cdn.sheetjs.com, so the path is short.

**Rule: PRISM does not run a security-forward campaign while a known HIGH severity advisory
sits in its dependency tree.** The exact audience we want is the audience that runs an audit
of our dependencies before it reads our headline. Launching into Hacker News or a CISO's
inbox on top of an unpatched advisory converts our single strongest asset, credibility with
skeptics, into our single worst liability. This is a launch gate, tracked in
LAUNCH_PLAN.md Section 1, not a caveat.

---

## 1. Positioning statement

### 1.1 Full form

> For the **analyst inside a regulated organization** who needs statistics and charts out of
> a spreadsheet **today**, and whose data cannot be uploaded to a cloud analytics vendor
> without legal review, a signed data agreement, or a procurement cycle that outlasts the
> question being asked,
>
> **PRISM** is a **browser-only analytics tool**
>
> that **profiles the file, computes descriptive statistics and draws charts with the file
> never leaving the machine**, because the parsing and the Python statistics run inside the
> browser tab itself.
>
> Unlike **Tableau Cloud, Power BI Service, Google Sheets, hosted notebooks and AI data
> analyst tools**, PRISM **has no server to send the data to**. The page's Content Security
> Policy sets default-src 'none' and there is no network call anywhere in the source. The
> user does not have to trust that claim. They can watch the network tab stay empty.

### 1.2 Compressed forms

- **Nine words:** Analyze the spreadsheet you are not allowed to upload.
- **One line:** PRISM runs statistics and charts on your Excel or CSV file entirely
  inside your browser tab, so the file never leaves your machine.
- **Elevator, for an auditor:** You know the PBC file you cannot put in a SaaS tool. Drop it
  in PRISM instead. Nothing is transmitted, because there is nothing on the other end to
  transmit to, and you can prove it from the network tab in front of your engagement partner.

### 1.3 Category

Recommended category label: **local-first analytics**.

Rejected alternatives and why:

- "Privacy-first analytics" collides with the web analytics category (Plausible, Fathom and
  similar). An analyst searching that phrase gets page-view tools, not spreadsheet tools.
- "Zero-trust analytics" is an architecture term borrowed badly. Zero trust is about never
  implicitly trusting a network actor. We are not doing that, we are eliminating the network.
  Auditors and security people will notice the misuse and mark us as marketing-led. The
  README currently uses it. That is a README defect for the engineering team, not ours to fix.
- "Offline analytics" undersells. It implies a degraded fallback mode rather than the design.
- "Serverless analytics" is actively confusing. Serverless means someone else's servers.

Hook phrase, used everywhere the category label is not: **no upload**.
"No upload" is the shortest expression of the buying trigger. "Privacy" is a value.
"No upload" is a procurement fact.

---

## 2. The wedge

### 2.1 The wedge is procurement, not privacy

Almost everyone claims to care about privacy and almost no one changes tools over it. That
is not our wedge. Our wedge is narrower and much harder.

**The wedge: in regulated work, the upload is not a preference. It is the blocker.**

In a hospital, a bank, an audit firm, a law firm or a government department, sending a file
containing regulated data to a third-party vendor is not a decision the analyst gets to make.
It triggers a process owned by other people: privacy office, legal, vendor risk, security
architecture, sometimes a regulator-facing register. The analyst's actual experience is not
"I chose not to use Tableau." It is "I asked, and I am still waiting, and meanwhile the
question I needed to answer is due Thursday."

PRISM does not make that review faster. **PRISM removes the thing the review is about.**
A tool that never receives the data is a categorically different conversation with a privacy
office than a tool that does. We are careful here: whether any specific deployment needs a
data agreement, a privacy impact assessment or a vendor risk entry is a determination for
that organization's counsel and privacy office, never for us. What we can say truthfully is
that the question they will ask first, "where does our data go," has an unusually short
answer.

### 2.2 The shape of the opportunity

The blocked analyst does not go without an answer. They fall back to something worse:

1. They do it in Excel, by hand, with no reproducibility and a fresh chance of silent error.
2. They email the extract to a colleague who has the licensed tool, which is itself a data
   movement event and frequently a worse one.
3. They file a ticket with the central data team and wait in a queue.
4. They do it anyway in an unapproved tool and do not mention it. This happens, it is the
   real reason vendor risk teams are tired, and it is the behaviour we are competing with.

PRISM's entry point is that gap: **the fast, first-pass look at a file**, done in a way the
analyst can actually defend if asked. Not the governed dashboard. Not the system of record.
The first ninety minutes with a new extract.

### 2.3 Three qualifying questions

If a prospect answers yes to all three, they are in the wedge. If they miss one, they are
Tier 2 at best and we should not spend the meeting.

1. **Custody:** Does your data carry an obligation that makes sending it to an outside
   service a decision someone other than you has to sign off on?
2. **Latency:** When you need a quick statistical look at a new file, is your current path
   measured in days or longer rather than minutes?
3. **Frequency:** Does a new file like that reach you at least a few times a month?

Question 2 separates a sympathetic listener from a user. Plenty of people work with sensitive
data and already have an approved, fast, local tool. They are not blocked, so they are not
our buyer.

### 2.4 What the wedge is not

It is not a beachhead into becoming a BI platform. Every claim in this document depends on
having no server. Adding a server later does not extend the position, it deletes it. Any
future paid tier must be sellable without ever receiving customer data: licensing,
self-hosted distribution, support, verification artifacts. That constraint is the product.

---

## 3. The ICP

### 3.1 Tier 1A: Audit and assurance

**Why this is first:** the founder is ex-KPMG IT Advisory with ISO 27001 audit engagements in
banking and healthcare. This is a warm, reachable, high-trust network where the founder
speaks the language natively and where credibility transfers. It is also an audience trained
to demand evidence, which suits a product whose core claim is independently verifiable. We
do not have to be believed, we have to be checked.

- **Roles:** external audit senior and manager, IT audit and IT general controls testers,
  internal audit analysts, SOX 404 control testers, forensic accounting and disputes staff.
- **Setting:** Big Four and mid-tier firms, plus in-house internal audit functions.
- **Trigger event:** a client "prepared by client" file lands, typically a general ledger
  extract, a user access listing, a journal entry population or a transaction log. The
  auditor needs a completeness and plausibility read on it within hours.
- **Why they are blocked:** client data on an auditor's laptop is governed by engagement
  terms and firm policy. Independence, confidentiality and documentation obligations apply.
  Public reference, cited not characterized: PCAOB AS 1215 on audit documentation,
  https://pcaobus.org/oversight/standards/auditing-standards/details/AS1215
- **Current fallback:** Excel pivot tables, a firm-licensed tool the junior does not have a
  seat for, or a request to the data analytics team that returns next week.
- **What they say out loud:** "I just need to know if this population is complete and whether
  anything looks off before I sample it."

### 3.2 Tier 1B: Healthcare analytics

- **Roles:** clinical quality and safety analyst, revenue cycle analyst, hospital
  epidemiologist, health economics and outcomes research analyst, population health analyst,
  research coordinator handling a de-identified or limited data set.
- **Setting:** hospital systems, payers, provincial and state health agencies, contract
  research organizations, academic medical centres.
- **Regulatory context, cited not characterized:**
  - HIPAA Security Rule, https://www.hhs.gov/hipaa/for-professionals/security/index.html
  - Business associate obligations, 45 CFR 164.504(e),
    https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html
  - HHS OCR breach reporting portal, https://ocrportal.hhs.gov/ocr/breach/breach_report.jsf
  - Ontario PHIPA, relevant to the founder's home market,
    https://www.ontario.ca/laws/statute/04p03
- **Trigger event:** an extract arrives from the EHR or claims warehouse for a one-off
  question. Readmission distribution, denial reason frequencies, outlier length of stay.
- **Why they are blocked:** engaging a vendor that will hold identifiable health information
  is a governed act with named accountable parties. The analyst cannot self-serve it.
- **What they say out loud:** "I can't put this anywhere. It still has MRNs in it."

### 3.3 Tier 1C: Legal, eDiscovery and disputes

- **Roles:** litigation support analyst, eDiscovery project manager, in-house counsel and
  paralegals working a production, forensic examiners.
- **Trigger event:** a load file, privilege log, custodian list or transaction export in CSV
  needs counts, dedup profiling and date range sanity checks before it moves on.
- **Why they are blocked:** protective orders and confidentiality agreements routinely
  constrain where material may reside and who may access it. Inadvertent disclosure and
  clawback are live risks. Reference, not a claim: FRCP Rule 26,
  https://www.law.cornell.edu/rules/frcp/rule_26
- **Why this segment is attractive:** privilege makes them the most upload-averse group of
  all, and the work is bursty and deadline-driven, which is exactly PRISM's shape.
- **Why it is 1C and not 1A:** the founder has no native network here, and the segment buys
  through a dense incumbent vendor ecosystem. Enter via content and referral, not cold.

### 3.4 Tier 2, pursue opportunistically, do not build for

- **Public sector analysts.** Strong structural fit: data residency rules, and in the US a
  procurement path that runs through FedRAMP authorization,
  https://marketplace.fedramp.gov/ . A tool that is not a cloud service sidesteps a category
  of that question. Downside: slow, relationship-driven, and a browser tool with no
  purchasing vehicle is hard to actually buy. Good for credibility, bad for early velocity.
- **Finance front office and corporate development.** Unreleased earnings, deal models,
  material non-public information. Real fit, genuinely upload-averse. Downside: they already
  live in Excel with a strong local toolchain and high switching inertia.
- **Security and incident response.** Log and export CSVs that must not leave the
  environment. Fit is good, but this audience is highly capable of writing their own
  five-line pandas script and will say so publicly.
- **Cross-border teams under GDPR Chapter V transfer rules,** https://gdpr-info.eu/chapter-5/
  Structurally strong, but the buyer is a privacy function rather than an analyst, which is a
  different and longer motion.

### 3.5 Anti-ICP, name these and walk away

Being explicit here saves more time than any targeting exercise. PRISM is wrong for:

- Anyone who needs a **shared or scheduled dashboard**. There is no server, so there is no
  refresh, no distribution and no shared state. This is not a roadmap gap, it is the design.
- Anyone who needs to connect to a **warehouse, database or API**. The CSP forbids it.
- Anyone who needs **multi-user collaboration, comments, permissions or row-level security**.
- Anyone whose working set is genuinely large. Until benchmarks exist we do not know the
  ceiling, and we will not pretend a browser tab is a cluster.
- **Casual consumer use.** Someone analyzing a personal budget has no procurement problem, so
  the wedge does not apply and they will not value the thing we are best at.

---

## 4. Who this beats, specifically

For each competitor: what they genuinely do better, where they lose to us, the line we use,
and the trap that makes us look foolish.

### 4.1 Excel, the real incumbent

- **Wins over us at:** universality, already approved everywhere, cell-level manipulation,
  formulas the user already knows, no new tool to explain to anyone.
- **Loses at:** the statistical work is manual and unreproducible. Getting quartiles,
  correlation structure and outlier flags across twenty columns is an afternoon of clicking.
  The Analysis ToolPak is an add-in that many locked down corporate builds do not enable.
- **Our line:** "PRISM does not replace Excel. It reads the file Excel gave you and tells you,
  in one pass, what is in it. Then you go back to Excel knowing where to look."
- **Trap:** never position as an Excel killer. Our ICP lives in Excel, is good at it, and will
  read that as proof we do not understand their job.

### 4.2 Power BI Service and Tableau Cloud

- **Win over us at:** everything after the first look. Governed models, refresh, sharing,
  scale, enterprise identity, an ecosystem, a support contract.
- **Lose at:** they are the upload. Getting a new, sensitive, ungoverned extract into them is
  precisely the event that triggers the review. And for an ad hoc question, the effort of
  modelling the data is disproportionate to a question the analyst will ask once.
- **Our line:** "Those are systems of record. This is the first ninety minutes with a file,
  before anyone has decided whether it deserves a dashboard."
- **Trap:** do not benchmark against them on features. We lose that table on purpose.

### 4.3 Power BI Desktop and Tableau Desktop, our most honest competitor

This is the comparison we must handle with integrity, because these also run locally.

- **Win over us at:** far more capability, mature, local computation, and Power BI Desktop is
  free to download.
- **Lose at:** they require an install, which in a locked down enterprise means an IT
  entitlement request and a wait, and Power BI Desktop requires Windows. PRISM is a page. An
  auditor on a client site with a restricted laptop can open a page.
- **Our line:** "If you already have a desktop BI tool installed and approved, use it. PRISM
  is for the machine where you cannot install anything."
- **Open item, do not assert until verified:** the default diagnostic and telemetry behaviour
  of desktop BI tools. There is a real differentiator in that neighbourhood, but we state it
  only after reading the current vendor documentation ourselves and citing it. Until then
  this comparison rests on install friction alone, which is enough.

### 4.4 Google Sheets, Colab and hosted notebooks

- **Win over us at:** free, collaborative, flexible, and Colab gives a real Python kernel.
- **Lose at:** every one of them is a cloud upload by definition. For our ICP that is an
  immediate disqualification, and in several of these segments it is a reportable event.
- **Our line:** "Same Python, same pandas and numpy, running in your tab instead of someone
  else's datacentre."
- **Note:** this line is strong precisely because PRISM really does run Python via Pyodide.
  We are not offering a lesser substitute for a notebook, we are offering the same stack in a
  different place, with a much narrower feature set.

### 4.5 AI data analyst tools

- **Win over us at:** natural language, breadth, speed to a plausible looking answer, heavy
  funding and attention.
- **Lose at:** the file goes to a provider. For PHI, client audit data or privileged material
  that is frequently the end of the conversation regardless of the vendor's assurances.
- **Our line:** "The question is not whether the vendor is trustworthy. It is whether you are
  permitted to make that determination on your own."
- **Trap:** do not argue that AI analysis is bad or inaccurate. We would be picking a fight we
  cannot evidence, on someone else's turf, while the ICP quietly disagrees with us.

### 4.6 Other browser-local tools

Browser-local data tools exist, and honesty demands we say so. Our differentiation is not
inventing the category, it is the strictness and the verifiability: a CSP of
default-src 'none', no network primitive anywhere in the source, and an architecture where
the absence of exfiltration is something a reviewer confirms in two minutes rather than
something they take on faith.

If a competitor matches that posture, we compete on analysis quality and on the founder's
audit fluency, and we say so plainly rather than pretending to be alone.

### 4.7 "Just do it yourself in pandas"

- **Wins at:** total control, zero cost, and for a competent Python user it is genuinely fast.
- **Loses at:** our Tier 1 users mostly do not write Python, and on a locked down corporate or
  client laptop they frequently cannot install it.
- **Our line:** "If you can install pandas on that machine, you do not need us. Most of the
  people we built this for cannot."
- **Trap:** this objection will arrive loudly on Hacker News. Answer with that sentence,
  concede the point for their case, and move on. Arguing is how the thread goes bad.

---

## 5. The founder as a positioning asset

**The asset:** Jesun Ahmad Ushno. AI engineer and data architect, Toronto. Formerly KPMG IT
Advisory, running ISO 27001 audits in banking and healthcare. MSc Data Analytics. Two
peer-reviewed papers.

**Why it matters here and almost nowhere else.** A generic founder saying "your data stays
local" is a marketing claim. A former Big Four IT auditor saying it is someone who has sat on
the other side of the table, reviewed the controls, written the findings, and knows exactly
which question the privacy office asks third. For Tier 1A this is near total credibility
transfer. For Tier 1B it is substantial, since the ISO 27001 engagements included healthcare.

**How to use it:**

- First person, always. "I spent my career auditing whether organizations could prove where
  their data went. Then I built an analytics tool where the answer is trivially provable."
- As the reason the architecture looks the way it does, not as an authority badge.
- To set the standard of proof high, openly: publish the CSP, invite the grep, welcome the
  audit. That is the auditor's instinct and it is also the best available marketing here.
- The two peer-reviewed papers support rigor in the statistical work. Cite them by title and
  venue with a link, or do not mention them at all.

**How not to use it:**

- No KPMG logo, no "trusted by," no implication of endorsement or affiliation. This is both
  false and, with this ICP, reputationally fatal.
- Never "ISO 27001 certified product." Auditing to a standard and being certified against it
  are different things, and this exact audience knows the difference cold.
- Do not lead with the credential in developer channels. Hacker News rewards the artifact and
  is allergic to the resume. Lead with the CSP there and let the biography be paragraph two.

---

## 6. The claim ladder

Each rung unlocks specific language. Do not skip rungs.

| Rung | Evidence required | Language it unlocks |
|---|---|---|
| 0, today | CSP and source grep verifiable by anyone | "No network calls exist in the source. Verify it yourself." |
| 1 | HIGH severity xlsx advisory remediated via the SheetJS CDN build | Any security-forward campaign at all. This is a launch gate. |
| 2 | Test suite exists and passes in CI, coverage published | "The statistics are tested," with a link to the run |
| 3 | LICENSE, package.json and README made mutually coherent | Any statement about how PRISM may be used or licensed |
| 4 | Independent accessibility audit completed | Anything referencing WCAG conformance, at the level actually achieved |
| 5 | Third-party review of the client-side architecture published | "Independently reviewed," with the report linked |
| 6 | Named reference user willing to be quoted | The first case study. Not before. |
| 7 | Formal certification, if ever pursued | ISO 27001 language, scoped precisely to what was certified |

---

## 7. Risks to this position

1. **A browser extension or a compromised endpoint breaks the guarantee.** Our claim is about
   our code, not about the entire client environment. Say so first, before a critic says it
   for us. A malicious extension can read the page. That is true of every web tool, and it is
   a sentence we should write ourselves rather than have written about us.
2. **Someone ships a server "just for sharing."** This deletes the position. Treat any
   proposal to add a backend as a change to the company, not as a feature request.
3. **The capability floor is too low to matter.** Descriptive statistics and charts may not be
   enough to change behaviour even for a blocked analyst. This is the single biggest
   commercial risk, it is not solvable with messaging, and it is what the customer interviews
   in LAUNCH_PLAN.md Phase 1 exist to test.
4. **The ICP cannot actually adopt an unapproved page.** Some enterprises block unknown
   domains outright. The wedge assumes the analyst has latitude. That assumption is untested,
   and it is the second interview question we must ask.
5. **Credibility collapse from an unpatched dependency.** Covered in 0.3. This is the
   avoidable risk, so avoid it.

---

## 8. Open questions this document cannot answer

None of these should be guessed at. All are interview questions for Phase 1.

- What does the analyst actually do today when they are blocked, in order, with timings?
- Who, by title, would need to know they used PRISM, and would they need to disclose it?
- Is the first-pass profile valuable on its own, or only as an on-ramp to deeper work?
- Would a firm pay for a distributable or self-hosted build, given there is no data custody
  to charge for?
- Which of the three Tier 1 segments converts from conversation to repeat use fastest?

**ASSUMPTION, flagged and unverified:** we assume the vendor review path for a new cloud
analytics tool in a regulated enterprise is long enough that analysts route around it.
Reasoning: the founder's direct experience of vendor risk and ISO 27001 engagements in
banking and healthcare, where third-party assessments involve security questionnaires, legal
review of data agreements and sign-off from multiple accountable functions. We have
deliberately not attached a number to "long." If we ever want to publish one, it must come
from our own interviews, quoted as a range with the sample size stated, or from a named
public source with a URL.
