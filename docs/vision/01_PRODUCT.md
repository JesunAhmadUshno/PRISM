# 01 PRODUCT: What PRISM becomes

Owner: Product Strategy
Date: 2026-09-13
Status: Founding proposal for the pivot. Nothing here is built. Every capability carries a
feasibility tag: NOW (pandas, scipy, SheetJS and the browser as they exist in this repo
today), NEXT (real engineering, months), RESEARCH (unproven, may fail).

House rules observed: no em dashes, no invented numbers, every bold idea tagged, nothing
outside `docs/vision/` touched.

---

## 0. The decision this document asks for

Today PRISM is an analytics platform. It hands a non-statistician a menu of seventeen tests
and a preprocessing panel and asks them to already know what to do. The founder's own
verdict after using it is the right one: "I do not even know what I want. Nobody will
touch this."

The proposal: PRISM stops being a tool you operate and becomes an examiner you consult.
You drop in the spreadsheet somebody else prepared. It reads the file the way an auditor
reads a file, tells you what it found, shows you the rows that prove it, and asks you what
to pursue. It never sends a byte anywhere, and it never claims to know more than it can
show.

Same engine. Same zero-egress architecture. Opposite product.

---

## 1. The job to be done

> **"Before I put my name on a number somebody else prepared, show me what I would have
> missed."**

A CEO nods at that sentence because it names the exact fear: the spreadsheet arrives at
11 pm, the board meets at 9 am, the person who built it knows where the bodies are and the
person who signs it does not. The job is not "analyse data". The job is **not being the
one who takes the fall for a number they could not check.**

Three things the sentence deliberately says:

- "somebody else prepared": the file is adversarial, or at least not neutral. That is the
  premise of the whole product. Today's PRISM assumes the user owns the data and wants to
  explore it. The new PRISM assumes the user received the data and needs to test it.
- "show me": not "tell me". The product's authority comes from pointing at rows, never from
  asserting conclusions. This is Constraint B built into the job statement.
- "what I would have missed": the user does not know what question to ask. The product
  must lead. This is the Jarvis principle built into the job statement.

---

## 2. The product, in one paragraph, sharper than the brief

PRISM is a local examiner for spreadsheets you did not build. You drop in the workbook
your finance lead, your agency, your vendor or your subordinate sent you. In your browser,
with the network tab empty, it runs the checks a forensic auditor would run in the first
hour: does the summary tie to the detail, which "totals" are typed numbers instead of
formulas, what is hidden, what changed since the last version, which four rows carry the
entire "trend", which figures cluster suspiciously just under a threshold, and where the
story the chart tells reverses when you split the data. It ranks what it found, grades
each finding by how certain it can honestly be, shows you the exact cells, tells you how
each one could be innocent, and asks which thread you want to pull. It drafts the question
you should send back. It runs entirely on your machine, and you can prove that in ninety
seconds with developer tools, because the files this is for are precisely the files that
must never be uploaded.

What the founder said: "god mode", "knows everything". What the product says: **"I read
every tab and every row in the time it took you to pour a coffee. Here are the six things
I would ask about. Cell references attached."** That is the honest version of god mode,
and it is more frightening to a bad spreadsheet than the dishonest version, because every
claim can be checked.

---

## 3. The moment of value: the first sixty seconds

This is the script for the demo, the landing page and the onboarding. If the product
cannot do this, it is not this product.

**0 to 5 seconds.** A drop zone and one sentence: "Drop the spreadsheet someone sent you.
It does not leave this computer." The developer tools Network panel can be open beside it.
Nothing moves on it after load.

**5 to 15 seconds.** No menu appears. No test picker. No column chooser. A single line of
progress, in plain words: "Reading 14 sheets. Checking totals. Looking for hidden rows.
Comparing formulas to typed values." The user watches the examiner work, and the words
tell them what an examiner does. This is onboarding disguised as a progress bar.

**15 to 40 seconds.** The screen shows one headline sentence and a short ranked list:

> **I found five things worth a question before you trust this file.**
>
> 1. **FACT** The "Q3 Total" on the Summary sheet (cell E17) is a typed number, not a
>    formula. It differs from the sum of the Q3 detail rows. [Show the cells]
> 2. **FACT** 212 rows on the "Transactions" sheet are hidden. They are all from one
>    cost centre. [Show them]
> 3. **STATISTICAL** The revenue trend on "Overview" is carried by three customers. Remove
>    them and the trend reverses. [Show which three]
> 4. **STATISTICAL** 31 expense claims fall just under the approval threshold. Amounts
>    this close, this often, would be unusual under a smooth distribution. [Show them]
> 5. **QUESTION** The column called "Revenue" on sheet 2 and "Net Revenue" on sheet 5
>    hold different numbers for the same months. Which one does the board see?

(The figures above illustrate the format. They are not from any real file.)

**40 to 60 seconds.** The user clicks finding 1. The two cells are shown side by side with
the rows that make up the difference highlighted. Under it, two lines:

> *How this could be innocent:* a late adjustment was typed in after the detail was
> frozen, which is common at month end.
> *What to ask:* "E17 on Summary is hardcoded and does not match the Q3 detail. What was
> the adjustment and where is it documented?" [Copy this question]

That is the stare. Not because the machine was clever, but because the user just did in
one minute, without knowing anything about statistics, what would otherwise have taken
their controller an afternoon and a reason to look. And they can hit "copy" and send the
question before the meeting.

Everything in that script except the natural-language phrasing of the "what to ask" line
is **NOW** with pandas and SheetJS. The phrasing is templated (NOW) until a local language
model can do it better (NEXT, see section 6).

---

## 4. Design principles that make it a trust product rather than a claims product

These are the rules that keep Constraint B intact when the founder's ambition, or a
future marketing hire, pushes on it.

### 4.1 Three grades of certainty, and the grade is always visible

Every finding is stamped with exactly one of:

| Grade | Meaning | Example | How it can be wrong |
|---|---|---|---|
| **FACT** | Arithmetic or structural. True of the file, not a judgement. | "This cell is typed, not a formula." "212 rows are hidden." "Sum of detail differs from summary by X." | Only if the parser misread the file. We say so and show the raw cell. |
| **STATISTICAL** | A test was run. The test name and its result are shown. | "Amounts cluster under 5,000 more than a smooth distribution predicts (chi-square, p shown)." | The test's assumptions may not hold. We state the assumption next to the result. |
| **QUESTION** | A heuristic noticed something. It is a prompt, not a conclusion. | "Two columns with similar names disagree." "Last modified at 23:47 the night before the file date." | Often. That is why it is a question. |

The product never displays a "confidence" number it did not compute. Today's engine emits
`"confidence": 1.0` on a row count and `0.8` on a straight-line fit
(`generate_insights` in `src/workers/prism.worker.js`). Both are deleted. A p-value is a
computed number and may be shown, with the test named. A made-up decimal is an overclaim
and is banned.

### 4.2 Show the rows or do not say it

Every finding links to the exact cells, rows or ranges that produced it. If a check
cannot point at evidence in the file, it does not ship. This is the Sherlock rule: "observe
the tan line". The user must be able to open the original spreadsheet and see the same
thing.

### 4.3 Every finding carries "how this could be innocent"

The user is about to send a question to a colleague. If the product primes them with
accusation, it makes the user look paranoid the first time a finding is benign, and it
poisons the relationship with the preparer, who is a future user (see section 9). Each
check ships with a plain, honest benign explanation. This is also how an auditor is
trained to write: observation, possible explanations, request for information.

### 4.4 The model may talk. The model may never count.

If and when a local language model is added (section 6), it phrases, routes and explains.
It does not compute. Every number in a sentence is produced by pandas or scipy and cited
to a check identifier. A language model that hallucinates a total inside a trust product
is fatal; a language model that rephrases a pandas result in plain English is useful and
safe. This boundary is architectural, not a prompt instruction.

### 4.5 Read-only, always

PRISM never modifies data. Today's preprocessing menu (fill with mean, normalise, log
transform, remove outliers, encode categoricals) is deleted from the product. Those are
exactly the operations a preparer uses to make a spreadsheet say what they want. An
examiner that can also "fix" the data is a conflict of interest. The only derived artefact
PRISM produces is its own report.

### 4.6 It leads. It does not wait for a prompt.

The first screen is findings, not a chat box. A chat box that waits is a test that asks
the user to already be an expert, in a different costume. After the findings, the product
asks: "Which of these do you want to pursue?" and offers grounded next steps for each. The
user can type freely too, but the product has already done the first hour of work before
anyone types anything.

### 4.7 Respect the user's time and intelligence

No jargon in the headline. Jargon available one click down, for the user who wants to know
what a chi-square test is or who has to defend the finding to a statistician. Never a
paragraph where a sentence will do. Never a modal. The user is busy and outgunned, not
slow.

---

## 5. The check catalogue for version one

This is the examiner's toolkit. Each check produces findings in the format of section 4.
Feasibility tags refer to what this repository's stack can do today.

### 5.1 Structural checks on the workbook (the audit-firm first hour)

| Check | What it catches | Feasibility |
|---|---|---|
| **Tie-out**: every summary-looking number is compared to the sum, count or mean of the detail rows it appears to summarise | Summary tabs that do not reconcile to their own detail | **NOW**. Heuristic matching of summary cells to detail ranges is the hard part; formula references make it exact where they exist |
| **Hardcode detection**: cells in a formula column or a totals row that contain typed values | Overrides pasted over formulas, the single most common manipulation in a management pack | **NOW**. SheetJS exposes formula text per cell; verify the read options in `src/lib/sheetjs-loader.ts` |
| **Hidden content**: hidden rows, hidden columns, hidden and "very hidden" sheets, active autofilters that exclude rows | Survivorship: what was filtered out of the view you were shown | **NOW**. SheetJS exposes row and column hidden flags, sheet visibility and autofilter ranges |
| **Metadata**: author, last modified by, created and modified timestamps, application | Context for the reviewer. Shown as FACT, never as accusation | **NOW**. SheetJS exposes document properties |
| **Same-name disagreement**: columns or labels with matching or near-matching names across sheets whose values differ for the same key | Definitions changed between the tab the board sees and the tab the analyst built | **NOW** |
| **Version compare**: drop two versions of the same workbook, see every cell that changed, added or was removed | "The numbers moved between draft 3 and the board version" | **NOW**. The existing dataset merge code is the seed |
| **Chart axis and range inspection**: read embedded chart definitions, flag truncated axes, series that cover a subset of the data, dual axes with misaligned scales | Charts engineered to exaggerate | **NEXT**. Charts live in the xlsx zip as XML that SheetJS Community does not parse; needs a small dedicated parser |

### 5.2 Analytical checks on the numbers (the forensic hour)

| Check | What it catches | Feasibility |
|---|---|---|
| **Concentration**: how many rows, customers, or periods carry a total or a trend; what the picture looks like without them | A "growth story" that is three deals | **NOW** |
| **Reversal under split** (Simpson-type): a trend or comparison that flips sign when the data is split by any categorical column present | The most respectable way to mislead with true numbers | **NOW**. Loop over categorical columns, compare direction of aggregate versus within-group |
| **Threshold hugging**: clustering of amounts just below round numbers or a user-supplied approval limit | Split invoices, approval avoidance | **NOW**. Round-number version is automatic; the user can type their limit |
| **First-digit distribution** (Benford): whether naturally occurring amounts follow the expected leading-digit pattern | Fabricated or heavily massaged transaction populations | **NOW**, with a mandatory applicability guard. The test is only valid for naturally occurring amounts spanning several orders of magnitude; the product must say when it does not apply rather than run it anyway |
| **Period-end behaviour**: spikes in the last days of a period, and reversals in the first days of the next | Pulled-forward revenue, pushed-out cost | **NOW**, when a date column exists |
| **Duplicates and near-duplicates**: same amount, same counterparty, close dates | Double counting, double payment | **NOW** |
| **Missing-data pattern**: whether blanks concentrate in one segment, period or preparer | Selective omission that looks like noise | **NOW** |
| **Outliers, with context**: values far from their group, shown with what group they belong to and what the total looks like without them | Mislabelled or fat-fingered rows that carry the result | **NOW** (the existing z-score and IQR code, repurposed) |
| **Rate-of-change plausibility**: month-on-month or year-on-year changes that are extreme relative to the series' own history | Silent unit changes, silent restatement | **NOW** |

### 5.3 The seventeen tests

They stay in the codebase. They stop being a menu. They become instruments the checks
above call when a question needs one (a chi-square for first-digit distribution, a
Mann-Whitney when comparing two groups without assuming normality, and so on). An
"Instruments" drawer stays available for the analyst who wants to run one directly,
below the fold. The seventeen tests are the engine room. The user never has to go there.

### 5.4 What the catalogue deliberately does not attempt in version one

- Detecting fraud. PRISM finds things worth a question. Whether they are fraud is a human
  judgement and a legal term. The word does not appear in the interface.
- Reading PDFs or decks. The wedge file is a workbook (section 8). A deck's numbers come
  from a workbook; ask for the workbook.
- Connecting to accounting systems. That requires egress. It does not exist.

---

## 6. The conversational partner, under zero egress

The founder wants "a Jarvis: a conversational partner so a complete newbie CEO can ask and
be told what is really going on." Here is how that works when no cloud model may be
called.

### 6.1 The layered design

**Layer 1: the examiner's monologue (NOW).** The findings screen is already the
conversation's opening turn. It speaks first. Every finding offers grounded next steps as
buttons: "Show me the cells", "What does this test mean?", "How could this be innocent?",
"Compare with last month's file", "Draft the question for my controller". Each of these
is a deterministic action with templated language. A CEO who never types a word gets the
full product. This is the strong version of Jarvis (he leads) built without any language
model at all.

**Layer 2: intent routing over a fixed catalogue (NEXT).** A small language model running
in the browser via WebGPU maps a typed question ("is the sales growth real?") to one or
more checks from section 5 (concentration, reversal under split, period-end) and to the
columns they should run on. The model chooses; pandas computes; the result is rendered
in the section 4 format. If the model picks wrongly, the user sees a finding that does not
answer their question and can redirect. Nothing is fabricated because nothing numeric
comes from the model.

Candidate runtimes to evaluate, all of which run models client-side in the browser
(verify current status before committing):
- WebLLM, https://github.com/mlc-ai/web-llm
- wllama (llama.cpp compiled to WebAssembly), https://github.com/ngxson/wllama
- Transformers.js, https://github.com/huggingface/transformers.js

Model weights would be fetched once from a pinned CDN with integrity digests, exactly as
Pyodide is today (`PYODIDE_INTEGRITY` in `src/workers/prism.worker.js`). This is ingress,
not egress; the CSP `connect-src` allows the download and forbids everything else. An
offline bundle with weights included is the enterprise variant.

**Layer 3: plain-English narration of results (NEXT).** The same local model rewrites a
templated finding in the user's own terms, using only the numbers pandas produced and
citing the check identifier. Guarded by a validator: any number in the model's output that
does not appear in the check result is rejected and the template is shown instead.

**Layer 4: open-ended questions answered by generated code (RESEARCH).** The user asks
something the catalogue does not cover; the model writes a pandas snippet; Pyodide runs it
in the already-sandboxed worker; the code and its output are shown. Egress risk is nil
because the worker cannot reach the network regardless of what code runs in it. The
unsolved problem is correctness: small local models write wrong pandas often enough that
every result here must be graded QUESTION, shown with its code, and never ranked alongside
FACT findings. This may not be shippable. It is listed so nobody mistakes it for NEXT.

### 6.2 Graceful degradation is mandatory

If the user's machine has no WebGPU, or they decline the weights download, Layer 1 and
the templated parts of the product work in full. The product is never "broken without the
model". The model is an upgrade to the phrasing, not the source of the findings.

### 6.3 What the partner is called

Not "Jarvis" (a Marvel trademark) and not any name that implies a mind. Per
`docs/business/brand/NAMING.md`, no capability adjectives and boring is a feature. The
interface refers to "the review" and "findings". If a persona name is wanted for warmth,
"the Examiner" is the audit profession's own word and survives a reader opening the code.

---

## 7. The name

### 7.1 Does the prism metaphor survive the pivot?

The metaphor: a prism reveals what was inside the light without consuming or altering it.
Test it against the new product:

- Reveals hidden components of something that looked uniform: **yes**. A total is white
  light. The tie-out shows the spectrum it is made of. That is a genuinely good fit for
  reconciliation, concentration and reversal-under-split.
- Does not alter what it examines: **yes**, and stronger than before. Section 4.5 makes
  read-only a principle. The metaphor now carries a promise the product keeps.
- Neutral, physical, checkable: **yes**. A prism does not have opinions. It fits a product
  whose authority is "look for yourself".
- Adversarial, detective, catching: **no**. A prism does not hunt. The detective energy
  has to come from the tagline and the interface, not from the name.

Verdict: the name still fits, arguably better than it fit the analytics platform. What
changes is the line under it.

### 7.2 Candidates

| Name | For | Against | Verdict |
|---|---|---|---|
| **PRISM** | Metaphor fits (7.1). Existing repo, docs, brand work. Neutral and inspectable. | Generic; the word is used by many products in many categories. Carries no detective signal on its own | **Recommended.** Keep the name, replace the tagline |
| **Tie-Out** | The audit profession's exact term for reconciling summary to detail. "Does it tie out?" is a sentence CFOs say. Domain-authentic, zero overclaim | Names one check, not the whole product. Unfamiliar outside finance | Use as the name of the flagship report: "the PRISM tie-out" |
| **Vouch** | Audit term (vouching: tracing an entry to its source). Short | In plain English it means "to guarantee". That is an overclaim in one syllable | Reject |
| **Attest** | Audit term | Attestation is what a licensed auditor does and what this product explicitly does not do | Reject |
| **Second Look** | Says exactly what the user does with it. Warm, humble | Weak as a company name, not distinctive | Keep as a possible feature or campaign line |

Tagline candidates, all of which pass the "would a reader who opens the code find this
accurate" test:

- "See what is in the numbers before you sign them."
- "The spreadsheet check for the person who has to sign."
- "Read it like an auditor. Keep it on your machine."

Recommendation: PRISM stays. The flagship output is called the tie-out. The old tagline
("Secure Data Analytics Platform") goes.

---

## 8. The wedge: one user, one file

### 8.1 The choice

**The user:** the chief executive or owner of a private company large enough to have a
finance function of a few people and small enough that the CEO personally receives and
signs off the monthly numbers. They are not a statistician and never will be. They hold
authority, they carry personal exposure, and they receive a recurring file from someone
who knows the numbers better than they do.

**The file:** the monthly management accounts workbook. One xlsx, a handful of tabs: a
summary P&L or KPI sheet the CEO actually reads, and detail tabs behind it that the CEO
does not. Sent by the controller or finance lead, usually the day before it is discussed.

### 8.2 Why this and not the others

| Candidate wedge | Why not first |
|---|---|
| Internal auditors | Already have tooling (the audit analytics category is mature), and they are statisticians enough to use the old PRISM. They are a fine second market and a channel, not the wedge |
| Board members and audit committees | Highest leverage, slowest to reach, and they receive decks, not workbooks. They arrive via the CEO (section 9) |
| Investors in diligence | One-off use. No habit forms. No monthly file |
| Hospitals and banks (the founder's audit domain) | Exactly right on the data-sensitivity constraint, wrong on procurement speed for a product with zero users. They are the enterprise tier, later. The architecture is built for them; the first customer is not them |
| "Anyone with a CSV" | This is the product we are leaving. Everyone is nobody |

The management-accounts workbook is chosen because it has the structure the checks exploit
(summary versus detail, formula columns, hidden rows, monthly versions to compare), it
recurs monthly so a habit can form, its recipient has both the pain and the authority, and
it is precisely the file that must never leave the machine, so the zero-egress moat is not
a feature to explain but a precondition the buyer already holds.

### 8.3 What "brutal narrowness" means in practice

Version one's check catalogue is tuned on management-accounts workbooks and nothing else.
The onboarding copy says "the monthly numbers your finance team sent you", not "any
spreadsheet". The example findings use P&L vocabulary. If a marketing agency's campaign
report or a hospital's departmental census also works, good, but it is not designed for,
not tested against and not promised.

---

## 9. Why it spreads: the mechanism, not the hope

There is no telemetry and there never will be, so spread cannot be measured in the usual
way and cannot be engineered with growth loops that phone home. It has to be built into
the artefact itself. Five mechanisms, in the order they fire.

### 9.1 The finding card is a screenshot by design

The unit of sharing is one finding: a plain sentence, the evidence cells, the grade, the
check identifier, and a footer line: "Checked locally with PRISM. This file did not leave
the reviewer's computer." Every finding is laid out to be screenshotted or copied whole.
The "copy this question" button produces text a CEO can paste into an email to their
controller with the finding attached. A "hide values" toggle blanks the numbers and keeps
the structure, so a finding can be shared outside the company without sharing the data
(**NOW**).

The first time a CEO drops in the pack and finding 1 appears, the person they forward it
to is the person who prepared the file. That is the first hop, and it is guaranteed by the
product's function, not by a share button.

### 9.2 The preparer adopts defensively

The controller who receives "E17 is hardcoded and does not tie to detail" now knows two
things: the CEO has a tool, and the tool runs on the file before the meeting. The rational
response is to run the file through PRISM before sending it. This is the spell-check
dynamic: once the reader has it, the writer needs it. Both sides of the table use the same
free product on the same file, and neither has to trust the other's copy because each can
run it locally.

Design consequence: the product must be as pleasant for the preparer as for the reviewer.
"How this could be innocent" (section 4.3) exists partly for this reason. A product that
humiliates preparers gets sabotaged; a product that helps them send a clean file gets
adopted.

### 9.3 The clean report becomes a norm

When a file passes, PRISM produces a one-page report: checks run, nothing found, file
digest (SHA-256 computed locally via WebCrypto, **NOW**), date, version of PRISM. The
preparer attaches it: "Management accounts for August, PRISM tie-out attached." The
recipient can drop the same file and confirm the digest matches and the findings match,
with no server in between. The report is a trust signal that costs nothing to include and
looks negligent to omit once one department starts. It moves sideways across the
organisation faster than any sales motion.

Feasibility of the report: **NOW** (browser print to PDF, plus a digest). A signed report,
where the recipient can verify it came from an unmodified PRISM build, is **NEXT** and
worth doing for the enterprise tier.

### 9.4 The board is the high-fanout node

A CEO who has caught something once brings the tie-out into the board pack, either as an
attachment or by mentioning it. Board members sit on several boards. Each one who sees a
clean tie-out attached to one company's pack asks the next company why theirs does not
have one. This is the only node in the corporate graph with natural fan-out across
companies, and it is reached by the wedge user (section 8) in the ordinary course of their
job. Nothing about this can be forced or measured; the product simply has to be present in
the board pack, which section 9.3 achieves.

### 9.5 The public mechanism: the named pattern

Every check in section 5 is a named, explainable pattern ("threshold hugging", "reversal
under split"). Each is a piece of content that teaches a decision maker something true
about how numbers mislead, with no data required. This is the honest version of a content
engine: the checks are the articles, the articles are the product's table of contents, and
a reader who recognises their own management pack in one of them drops the file in. Owned
by the growth team, not this document, but the product must keep check names and
explanations public and stable to feed it.

### 9.6 What we will not do

No "share to social" button. No referral codes (they require a server). No watermark on
the user's data. No collection of which findings fire, ever, because that is telemetry
about the contents of confidential files.

---

## 10. What it is NOT: the deletion list

Today's PRISM must lose the following, or the new product is a layer of paint on the old
one.

| Today | Verdict | Reason |
|---|---|---|
| The seventeen-test menu as the primary interface | **Demote** to an "Instruments" drawer below the findings | The user must never be asked which test to run |
| The preprocessing panel (`remove_nulls`, `fill_mean`, `fill_median`, `fill_mode`, `normalize`, `standardize`, `log_transform`, `remove_outliers`, `encode_categorical`, `remove_duplicates`) | **Delete from the product** | Section 4.5. An examiner does not alter evidence. These are the preparer's tools, not the reviewer's |
| `generate_insights`: a row-count "insight" at confidence 1.0 and a linear-fit "trend" at 0.8 | **Delete** | Section 4.1. Uncomputed confidence numbers are the overclaim the product exists to catch |
| "AI Insights" as a phrase, anywhere | **Delete** | Already flagged in `NAMING.md`. There is no model today; when there is one, it phrases and never counts |
| Chart recommendation as a feature ("this data suits a line chart") | **Delete as a feature, keep as a utility** | Charts appear only as evidence for a finding. The product does not help people make charts; it checks the ones they were sent |
| The tabbed "Analysis / Results / Preprocessing" workspace | **Delete** | Replaced by a single findings view with drill-down |
| Dataset merge ("linked data") | **Repurpose** as version compare only | Merging two arbitrary datasets is an analyst task. Comparing two versions of the same file is a reviewer task |
| Descriptive statistics tables as a headline output | **Demote** | Available on request per column. Never the first screen |
| "Secure Data Analytics Platform" positioning and the platform vocabulary (workspace, dashboard, analytics) | **Delete** | It is not a platform. It is an examiner |
| Sonification and the accessibility layer | **Keep**, not as a headline | It is right and it is rare. It is not why anyone arrives |
| Zero-egress architecture, CSP, blob worker, integrity-pinned runtime, no storage, no account | **Keep, unchanged, and put at the centre** | This is the moat. Every design decision above is made inside it |

The rule for anything not listed: if it exists because "an analytics platform should have
it", it goes. If it exists because a reviewer of somebody else's spreadsheet needs it, it
stays.

---

## 11. Pricing hypothesis

**HYPOTHESIS, not a decision.** Consistent with `docs/business/finance/PRICING.md`, which
establishes that the CSP forbids any licence check, seat count or usage meter, and that
the honest recurring revenue in a product that cannot phone home is the thing that
expires: assurance, obligation and currency.

**Free, permanently, no account, no email:** the full examiner. Every check in section 5,
unlimited files, unlimited size within what the browser can hold, the tie-out report with
digest. Reasoning: the spread mechanisms in section 9 require both the reviewer and the
preparer to have it, and a preparer will not pay to be checked. Marginal cost to serve is
near zero as documented in `PRICING.md`. The free tier is the distribution.

**Paid, per organisation, flat, annual:** everything that an organisation, rather than an
individual, needs in order to be allowed to rely on it.
- A signed, versioned offline bundle with the language model weights included, for
  machines that may not fetch from a CDN (**NEXT**).
- Check packs configured to the organisation: their approval thresholds, their chart of
  accounts, their period calendar, their known-benign exceptions. Configuration is a
  local file the organisation holds; PRISM never sees it (**NOW** for the file format,
  **NEXT** for a decent editor).
- The assurance pack a procurement or risk function needs: architecture description,
  dependency inventory, third-party test results, completed questionnaires. These expire
  and are refreshed, which is the recurring mechanism.
- A verifiable report signature so a recipient can confirm a tie-out came from an
  unmodified build (**NEXT**).

**Price point:** ASSUMPTION, deliberately unnumbered here. The anchor to test in the first
customer conversations is the cost of external audit time the buyer already pays, which
the buyer knows precisely and we do not. The organisation price should read as a small
fraction of one month's external audit fee, and should never be metered by files or seats,
because we cannot count them and because we want maximum use. The number is set after
five conversations with wedge users, not before.

**Who pays first:** not the wedge CEO. The wedge CEO uses it free and brings it into the
board pack. The first payer is the organisation whose board or risk function then asks for
the assurance pack and the configured check packs, or the regulated enterprise (the
founder's hospital and bank domain) that needs the offline bundle before its security team
will allow a browser tab to open a patient file. That sequencing is the reason the free
tier has to be complete rather than crippled.

---

## 12. What would prove this wrong

Kill criteria, so the pivot is a bet and not a belief.

1. **The tie-out finds nothing on real packs.** If, on a sample of genuine management
   accounts workbooks obtained with permission, the structural checks (5.1) produce no
   FACT findings in most files, the first-sixty-seconds script fails and the product has
   no opening. Test this before building the conversational layer. The founder's audit
   network is the place to source files.
2. **CEOs will not drop the file.** If wedge users, shown the demo, say they would rather
   ask their controller than run a tool, the user is wrong or the wedge is. Five
   conversations decide.
3. **Preparers sabotage rather than adopt.** If the first controllers to receive a
   finding respond by making the file harder to check (flattening formulas to values,
   sending PDFs) rather than by running PRISM themselves, mechanism 9.2 is dead and the
   product needs a different spread path. Note that flattening formulas is itself a FACT
   finding ("no formulas anywhere in a totals sheet"), so sabotage leaves a mark.
4. **The local model is not good enough to route.** If Layer 2 in section 6 picks the
   wrong check more often than a two-line menu would, ship without it and revisit. The
   product must not wait for the model.

---

## 13. Open questions for the founding team

1. Which real workbooks can we test the check catalogue against before writing a line of
   interface code? (This is the single most important question in the document.)
2. Tie-out heuristics: how do we identify "summary" cells and their "detail" ranges in a
   workbook with no formulas linking them? Formula-linked cases are exact; unlinked cases
   need a matching strategy and a way to say "I could not tell what this total refers to."
3. How far does SheetJS Community take us on hidden content, autofilters and document
   properties, and where do we need our own zip-and-XML parser (charts, in particular)?
4. What is the smallest local model that routes questions to checks reliably, and what
   is its weights download size against the Pyodide download the user already accepts?
5. Report signing without a server: what key does an unmodified build sign with, and how
   does a recipient verify it offline?
6. Does the paid tier need a legal entity and insurance posture before the assurance pack
   is credible to a regulated buyer, and what does that cost?

---

*This document proposes. It does not build. Engineering, design and go-to-market
responses live in the sibling files under `docs/vision/`.*
