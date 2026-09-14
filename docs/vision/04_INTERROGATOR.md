# 04 INTERROGATOR: The detective who leads

Owner: Interrogator Design
Date: 2026-09-13
Status: Founding proposal. Nothing here is built. Every bold element carries a feasibility
tag: NOW (pandas, numpy, SheetJS, the browser and the worker as they exist in this repo
today), NEXT (real engineering, months), RESEARCH (unproven, may fail).

Upstream: `01_PRODUCT.md` (the job, the wedge, the grades), `02_DETECTORS.md` (the finding
contract, the wording ladder, the twenty detectors), `03_ARCHITECTURE.md` (Layer 0 and
Layer 1, the number firewall, the Case File state, `finding.schema.json` and
`turn.schema.json`). This document does not redefine any of that. It designs what the
user sees, hears, reads and takes into the boardroom.

House rules observed: no em dashes; no invented numbers (illustrative figures are labelled
as illustrative, real figures carry a URL); every bold element tagged; only this file
written.

---

## 0. What this document decides

The founder asked for a Jarvis. Jarvis has two properties that matter and one that does
not. He speaks first ("Sir, you should see this"). He is calm and precise. He does not
pretend to know things he cannot check; when Tony asks for the impossible, Jarvis says
what is possible. The property that does not matter is that he is a mind. PRISM's
conversational partner is not a mind and never presents as one. It is a detective's
notebook that reads itself aloud, in the right order, and hands you the evidence page
when you ask.

Eight decisions, each expanded below:

1. **The first screen is a case, not a chat.** The system speaks first with a ranked
   list of findings. The user never types to get value. (Section 2, NOW.)
2. **One finding at a time, full width.** The founder said the output is cramped. The
   fix is not smaller panels; it is one card open at a time with the evidence beneath
   it. (Section 3, NOW.)
3. **Every finding is a question the user can answer and the software cannot.** The
   rung-3 question from `02_DETECTORS.md` becomes a set of answer buttons. The user's
   answer changes what the card concludes. This is how a CEO steers without statistics.
   (Section 4, NOW.)
4. **The user steers with five verbs**: Show, Without, Split, Ask, Explained. Every
   verb is a deterministic engine query. No free text is required. (Section 4, NOW.)
5. **Free text is honest about its limits.** Layer 0 answers a closed intent set and
   says so. Layer 1 (optional, local, off by default) may reword and route but never
   count, per the number firewall in `03_ARCHITECTURE.md` 2.4. (Section 4, NOW and
   NEXT.)
6. **Being disproved is a feature path, not an error path.** "Explained" is a first-class
   state with its own section in the report. (Section 6, NOW.)
7. **The artifact is reproducible, not merely signed.** The honest claim is "anyone with
   this file and this build gets this report", which is stronger than any signature and
   needs no server. Signatures are layered on top for the enterprise. (Section 7, NOW,
   NEXT, RESEARCH.)
8. **The screen reader is a first-class reader, not a fallback.** The Interrogator's
   output is sentences by construction, so the spoken case is the same case. (Section 8,
   NOW.)

### 0.1 Vocabulary map across the four documents

The three upstream documents use slightly different words for the same things. This
document uses the user-facing words and gives the mapping once, here.

| On screen (this document) | `01_PRODUCT.md` | `02_DETECTORS.md` | `03_ARCHITECTURE.md` schema |
|---|---|---|---|
| FACT | FACT | arithmetic fact, bypasses BH | `confidence: "rule"` |
| STATISTICAL | STATISTICAL | test-based, `adjustedP`, `testsRun` | `confidence: "statistical"` |
| QUESTION | QUESTION | heuristic, no test | `confidence: "heuristic"` |
| "Decides the story" / "Changes the number" / "Worth a note" | ranked list | `severity: decision_changing / material / note` | `severity` |
| What I see / What it could mean / What only you know | (implicit) | Rung 1 Observed / Rung 2 Interpretation / Rung 3 Question | `observed / interpretation / question` |
| Show me the rows | Show the cells | `evidence.rowIndices` | `GET_ROWS(finding_id, ...)` |
| Check it in Excel | (implicit) | `evidence.recompute` | `reproduce` |
| How this could be innocent | How this could be innocent | Rung 2 escape clause | `hypotheses[]` |
| What would change my mind | (none) | `wouldChangeMind` | (add to schema, see section 10) |
| The case | findings screen | (none) | Case File |
| The tie-out | the tie-out report | (none) | (none) |

Where the schema in `03_ARCHITECTURE.md` 3.5 lacks a field this document needs
(`wouldChangeMind`, `explained`), section 10 lists the additions so the architect can
decide.

---

## 1. Principles that are specific to the Interrogator

`01_PRODUCT.md` section 4 gives the product principles. These six are the ones the
conversation layer adds, and each is checkable in a review of the interface strings.

1. **Lead, then ask.** Every screen either states a finding or asks a question the user
   can answer with a click. No screen waits for the user to think of something.
2. **Never a sentence without a source.** Every sentence on screen is either computed
   from a field (labelled Computed) or worded by a local model from computed fields
   (labelled Worded locally). There is no third kind.
3. **Show the number and its shadow.** Every headline number appears beside its
   counterfactual (`02_DETECTORS.md` 2.2 rule 2): the mean and the mean without the
   rows, the trend and the trend one month earlier. A number without its shadow is not
   displayed.
4. **Respect the preparer in every string.** The person who built the file will read
   the card. Every card carries the benign explanation before the question, and the
   question is phrased so it can be forwarded verbatim without insult.
5. **Be wrong in the open.** When the user marks a finding Explained, the finding is
   not hidden. It is moved, labelled with the user's reason, and printed in the report.
6. **Quietest volume for the strongest claim.** From `docs/business/brand/VOICE.md`:
   no intensifiers, no urgency, the limitation before the advantage.

---

## 2. The first sixty seconds, second by second

This is the demo, the landing page and the onboarding, made concrete to the word. It
extends the script in `01_PRODUCT.md` section 3 with exact screen text and honest
timing.

**Timing honesty.** The seconds below are design targets, not measurements
(ASSUMPTION). `03_ARCHITECTURE.md` 1.2 measured the base runtime (Pyodide core, numpy,
pandas) at about 44.4 MiB. On a first visit that download dominates and no script can
promise sixty seconds on an unknown connection. So there are two scripts: the return
visit (runtime cached by the browser, which is the demo and the monthly habit) and the
first visit, where the wait is used as onboarding. The detector run itself has a
performance budget in `02_DETECTORS.md` 2.6 that is also unmeasured; the first
engineering milestone must measure both on a real management-accounts workbook.

**Sample file for the script.** "Management Accounts Aug.xlsx", four sheets: Summary,
P&L Detail, Sales by Customer, Headcount. Every figure below is illustrative and is
not from any real file. The findings chosen are the ones tagged NOW in
`02_DETECTORS.md`'s v1 list (window shift, Simpson's reversal, fragile number, the
duplicate pre-pass) plus arithmetic consistency on values, which is also NOW. The
formula-mask upgrade that turns "a total that does not add" into "a typed number over a
formula" is NEXT (`03_ARCHITECTURE.md` risk 2) and is marked where it would appear.

### 2.1 Return visit (runtime cached)

**0:00.** The page. One sentence, one drop zone, one small link. Nothing else.

```
        Drop the spreadsheet someone sent you.
        It does not leave this computer.

        [ drop zone ]        or choose a file

        How do I know it stays here?
```

The link opens the "Prove it" panel (section 6.5). The Network panel of developer
tools, if open, shows nothing after page load. Tag: NOW.

**0:02.** File dropped. The drop zone becomes a single line of progress text. There is
no spinner alone; the words are the progress. Each line replaces the last after the
step completes, and each is also announced to a screen reader (section 8.4).

```
Reading Management Accounts Aug.xlsx. 4 sheets.
```

**0:04.**

```
Reading Management Accounts Aug.xlsx. 4 sheets. 1,812 rows.
Checking for rows that appear twice.
```

**0:07.**

```
Checking whether the totals add up.
```

**0:10.**

```
Checking which numbers depend on a handful of rows.
```

**0:14.**

```
Checking whether trends survive a different start month.
```

**0:19.**

```
Checking whether the overall picture reverses inside segments.
```

Six lines of plain English. A CEO who reads them now knows what an examiner does. This
is the onboarding, and it costs nothing because the detectors run in this order anyway
(`02_DETECTORS.md` 2.5). Tag: NOW.

**0:24.** The case opens. The progress text becomes the opening turn. No menu. No
column picker. No chart. The Instruments drawer is below the fold and closed.

```
Management Accounts Aug.xlsx                                   4 sheets, 1,812 rows

I read every sheet. Five things are worth a question before you rely on this file.
Two of them would change the story the Summary tells.

  1  DECIDES THE STORY    STATISTICAL
     Sales growth of 18% depends on starting in January.
     Start one month earlier and it is a 4% fall.
                                                          Open

  2  DECIDES THE STORY    STATISTICAL
     Overall, the North region converts better than South.
     Inside every product line, South converts better.
                                                          Open

  3  CHANGES THE NUMBER   FACT
     The Total row on P&L Detail does not equal the rows above it.
     Difference: 38,200.
                                                          Open

  4  CHANGES THE NUMBER   STATISTICAL
     Average deal size of 4,200 is carried by three deals.
     Without them it is 1,050. The median is 900.
                                                          Open

  5  WORTH A NOTE         FACT
     14 rows on Sales by Customer appear twice.
     Every count below was recomputed without them.
                                                          Open

  Which one do you want to pull on first? I would start with 1.

                                              3 more checks still running (SciPy tier)
```

Every headline is two sentences, both true by arithmetic, both carrying the shadow
number. No jargon. No "p-value" above the fold. The "I would start with 1" line is the
Jarvis move: the system has an opinion about order and says it, and the opinion is
the rubric in `03_ARCHITECTURE.md` 2.2 item 2, not a mood. The trailing line is the
`requires_scipy` tier from `03_ARCHITECTURE.md` 3.4, announced honestly. Tag: NOW.

**0:31.** The user clicks Open on finding 1. The list collapses to a rail on the left
(numbers 1 to 5, current one marked) and finding 1 takes the full width. The card is
drawn in section 3. What the user reads, top to bottom:

```
1 of 5   DECIDES THE STORY   STATISTICAL   Check: window shift v1.0

Sales growth of 18% depends on starting in January.

WHAT I SEE
  Monthly Sales on sheet "Sales by Customer", January to August.
  January to August: up 18%.
  December to August: down 4%.
  January is the lowest month in the surrounding 24.

WHAT IT COULD MEAN
  If something happened in January (a launch, a price change, a fix),
  January is the right place to start and this is a turnaround.
  If nothing happened, the start month is doing the work.

WHAT ONLY YOU KNOW
  Did something change in January?
  [ Yes, I know what ]   [ No, nothing I know of ]   [ Not sure ]

  Show me the months   Show me without January   Check it in Excel   Ask my team
```

**0:40.** The user clicks "Show me the months". The evidence drawer opens below the
card with the series as a chart and, beside it, the shift table from `02_DETECTORS.md`
4.2: one row per alternative start month, the headline row marked. The chart has the
January-to-August window shaded and the December-to-August window outlined. Under
the chart is a hidden-by-default data table for screen readers (the pattern already in
`SmartChart.tsx`). Tag: NOW.

**0:48.** The user clicks "Check it in Excel". A single line appears, copyable:

```
In your chart, change the first month from January to December and read the
percentage again.
```

That line is `evidence.recompute` from the detector. The user can do it in the original
file in thirty seconds. This is the tan line. Tag: NOW.

**0:55.** The user clicks "Ask my team". A text block appears, already selected, with a
Copy button:

```
On "Sales by Customer", the 18% growth is measured January to August. Measured from
December it is a 4% fall, and January is the lowest month in the last two years.
Was there a reason to start the comparison in January?

Checked locally with PRISM. The file did not leave my computer.
```

The question is rung 3 from the detector. It states what was observed, states the
alternative, and asks. It contains no accusation and can be forwarded to the controller
without editing. Tag: NOW.

**1:00.** The user has, without typing a word or knowing what a Theil-Sen slope is,
found that the headline growth figure is a start-month artefact, seen the proof, learned
how to check it themselves, and drafted the question. That is the moment the founder
asked for. It was produced by a template over a computed finding, and every sentence
can be traced to a field.

### 2.2 First visit (runtime not cached)

Same page. On drop, the progress line reads:

```
Preparing the examiner. This happens once and is kept by your browser.
About 44 MB. Nothing about your file is sent; the file is already open here.
```

The 44 MB figure is the measured base tier from `03_ARCHITECTURE.md` 1.2 and is
displayed because a trust product tells the user what it is downloading and why.
While it downloads, three short cards appear, one at a time, each a named check pattern
from `02_DETECTORS.md` written for a general reader ("A trend that depends on where you
start counting", "An average that three rows carry", "An overall winner that loses in
every segment"). This is the public content mechanism from `01_PRODUCT.md` 9.5 used
as a waiting room. Tag: NOW.

When the runtime is ready the return-visit script runs from 0:02.

### 2.3 When nothing is found

```
Management Accounts Aug.xlsx                                   4 sheets, 1,812 rows

I read every sheet and ran 11 checks. None of them found anything worth a question.

That is not the same as the file being right. It means these eleven patterns are
absent. Here is what I checked and what I could not check.

  Ran (11)         Totals add up. No duplicate rows. Trends hold from other start
                   months. No segment reversals. ...
  Could not run    First-digit test: needs at least 500 amounts spanning 100x.
  (2)              This file has 212. Same-period-last-year: needs 24 months,
                   file has 8.

  Make the tie-out report          Compare with last month's file
```

A clean file is the most dangerous moment for overclaiming. The screen says what was
checked, says what could not be, and never says "this file is fine". Tag: NOW.

### 2.4 When the file cannot be read

```
I could not read this file as a table.

Sheet "Summary" has merged cells and no header row I could find. Sheets "P&L
Detail" and "Sales by Customer" read cleanly and the checks ran on them.

  Continue with 2 sheets          Show me what I saw on "Summary"
```

Partial failure is stated as a fact with the sheet named, and the product continues
with what it could read rather than refusing the whole file. Tag: NOW.

---

## 3. The finding card

One detection, one card, full width, one open at a time. The card is designed to be
screenshotted whole (`01_PRODUCT.md` 9.1), so it must make sense with nothing around it.

### 3.1 Closed (in the list)

```
+------------------------------------------------------------------------------+
|  2   DECIDES THE STORY                                        STATISTICAL   |
|                                                                              |
|  Overall, the North region converts better than South.                       |
|  Inside every product line, South converts better.                           |
|                                                                        Open  |
+------------------------------------------------------------------------------+
```

Three things and nothing else: rank and severity, grade, two-sentence headline with the
shadow number. The grade is a word, not only a colour (section 8.7).

### 3.2 Open

```
+------------------------------------------------------------------------------+
|  2 of 5    DECIDES THE STORY    STATISTICAL         Check: segment reversal  |
|                                                     v1.0, tried 38 splits    |
|                                                                              |
|  Overall, the North region converts better than South.                       |
|  Inside every product line, South converts better.                           |
|                                                                              |
|  WHAT I SEE                                                       Computed   |
|    Conversion, sheet "Sales by Customer", column "Won".                      |
|    Overall:  North 34.1% (412 of 1,208).  South 28.4% (301 of 1,060).        |
|    Split by Product line, all four lines: South ahead, by 3 to 6 points.     |
|    Like-for-like (weighted across lines): South ahead by 4.2 points.         |
|    78% of North's deals are in Hardware, where everyone converts well.       |
|                                                                              |
|  WHAT IT COULD MEAN                                               Computed   |
|    North's overall lead comes from where its deals happen to sit, not from   |
|    doing better on like-for-like deals. Which number matters depends on      |
|    whether Product line is chosen before the region does its work, or is a   |
|    result of it.                                                             |
|                                                                              |
|  WHAT ONLY YOU KNOW                                                          |
|    Is a deal's Product line decided before the region works it, or does the  |
|    region influence it?                                                      |
|    [ Decided before ]     [ Region influences it ]     [ Not sure ]          |
|                                                                              |
|  HOW SURE                                                                    |
|    STATISTICAL. This is the result of a test (Mantel-Haenszel across the     |
|    four lines), adjusted for the 38 splits I tried in this file. It holds in |
|    96 of 100 resamples. It could be wrong if Product line is caused by the   |
|    region, which no test can tell.                             What is this? |
|                                                                              |
|  ---------------------------------------------------------------------------- |
|   Show me the rows    Show me the segments    Check it in Excel    Ask my team|
|   Without these rows  Split by something else                    Explained   |
+------------------------------------------------------------------------------+
```

Illustrative figures throughout; the structure is the point. Every line in WHAT I SEE
is rung 1 and carries the count as "k of n" (`02_DETECTORS.md` 2.2 rule 4). WHAT IT
COULD MEAN is rung 2 with the escape clause. WHAT ONLY YOU KNOW is rung 3 with answer
buttons. HOW SURE is the grade explained in one sentence a CEO can read, with the test
name present but not leading, and "What is this?" opens a one-paragraph explanation of
the test for the user who has to defend the finding to an analyst. Tag: NOW.

### 3.3 The evidence drawer ("show me")

Clicking any evidence verb opens a drawer below the card. The drawer is the proof, and
it has three panes, always in this order:

```
+------------------------------------------------------------------------------+
|  EVIDENCE for finding 2                                       Close drawer   |
|                                                                              |
|  SEGMENTS                                                                    |
|   Product line   North won / deals   rate    South won / deals   rate   who  |
|   Hardware        350 / 940         37.2%     61 / 150          40.7%  South |
|   Software         40 / 160         25.0%    120 / 430          27.9%  South |
|   Services         18 / 80          22.5%     90 / 340          26.5%  South |
|   Support           4 / 28          14.3%     30 / 140          21.4%  South |
|   All             412 / 1,208       34.1%    301 / 1,060        28.4%  North |
|                                                                              |
|   Click any cell to open those rows.                                         |
|                                                                              |
|  MIX (why the overall number flips)                                          |
|   Share of North's deals in Hardware: 78%.  Share of South's: 14%.           |
|                                                                              |
|  ROWS                                        showing 1 to 50 of 940  Next    |
|   #    Customer        Region   Product line   Won   Amount   Close date     |
|   17   ...             North    Hardware       Yes   ...      2026-03-04     |
|   ...                                                                        |
|                                                                              |
|  CHECK IT IN EXCEL                                                  Copy     |
|   Filter "Product line" to Hardware, then average "Won" for North and for    |
|   South. Repeat for each product line. Then clear the filter and average     |
|   again.                                                                     |
|                                                                              |
|  HOW I COMPUTED IT                                                  Show     |
+------------------------------------------------------------------------------+
```

Rows are fetched on demand through `GET_ROWS` (`03_ARCHITECTURE.md` 3.3), fifty at a
time, so a million-row file does not move to the main thread. Every cell in the
segments table is a link to the rows behind it, which is the single most useful
affordance in the product: the user clicks "Hardware, North, 350" and sees the 350
deals with all their columns. "HOW I COMPUTED IT" discloses the `reproduce` field (the
Python that recomputed the finding) for the analyst; it is closed by default and the
CEO never needs it. Tag: NOW.

### 3.4 The "without" toggle

"Without these rows" is a live counterfactual. For fragile-number findings it recomputes
the headline with the carrying rows excluded and shows both numbers side by side with a
switch:

```
   Average deal size        [ with all rows ]  [ without rows 17, 88, 203 ]
                                4,200                    1,050
```

Nothing in the file is altered (`01_PRODUCT.md` 4.5). The toggle is a view. The engine
already has the exclusion primitive (the row-drop path in the preprocessing library,
kept as a library function per `03_ARCHITECTURE.md` 3.1). Tag: NOW.

### 3.5 Anatomy, and what each part is for

| Part | Source field | Who it serves | Rule |
|---|---|---|---|
| Rank and severity word | rubric, `severity` | the busy CEO | three words only: Decides the story, Changes the number, Worth a note |
| Grade word | `confidence` enum | everyone | FACT, STATISTICAL or QUESTION; never a percentage |
| Check name and version, tries | `detectorId`, `detector_version`, `testsRun` | the sceptic, the preparer | always shown; "tried 38 splits" is evidence |
| Two-sentence headline | `observed` | everyone | both sentences true by arithmetic; the second is the shadow |
| What I see | `observed` expanded, `evidence.tables` | the CEO checking | k of n always |
| What it could mean | `interpretation`, `hypotheses` | the CEO and the preparer | benign reading first, always with "if" |
| What only you know | `question` | the CEO | answer buttons, never free text required |
| How sure | grade plus `adjustedP`, `stability`, `wouldChangeMind` | the sceptic | one plain sentence, jargon one click down |
| Verbs | `nextSteps`, `follow_ups` | the CEO | five verbs, deterministic |
| Provenance label | `sentences[].provenance` | everyone | Computed or Worded locally, on every block |

### 3.6 Screenshot mode

A camera icon on the card produces a "share view": the card alone, with a footer line
"Checked locally with PRISM build <short digest>. The file did not leave the reviewer's
computer." and an optional "hide values" state that replaces every number with a grey
bar but keeps structure and text (`01_PRODUCT.md` 9.1). The share view is rendered by
the page, not captured by it; the user takes the screenshot with their own tools, so no
image is generated or stored by PRISM. Tag: NOW.

---

## 4. The conversation model

### 4.1 The Interrogator is a state machine, and the states are the conversation

```
  EMPTY ---drop---> READING ---done---> CASE_OPEN <----------------------+
                       |                    |                             |
                       |                    +--open n--> FINDING_OPEN     |
                    partial                 |               |    ^        |
                       |                    |         verb  |    | back   |
                       v                    |               v    |        |
                  PARTIAL_READ -continue->  |          EVIDENCE_OPEN      |
                                            |               |             |
                                            |          query/answer       |
                                            |               v             |
                                            |          QUERY_RESULT ------+
                                            |               |
                                            |          Explained
                                            |               v
                                            +-------- EXPLAINED (ledger)
                                            |
                                            +--report--> TIE_OUT
```

Each state has exactly one thing the system says and a closed set of things the user
can do. There is no state in which the user faces an empty box and a cursor. This is the
`interrogator.py` state machine from `03_ARCHITECTURE.md` 2.2 item 3, with the
user-facing states named. Tag: NOW.

### 4.2 What the system says first

The opening turn (state CASE_OPEN) has a fixed grammar, filled from the Case File:

```
I read every sheet. <N> things are worth a question before you rely on this file.
<M> of them would change the story the Summary tells.
[ranked list]
Which one do you want to pull on first? I would start with <k>.
```

Variants for the edges:

- N = 0: section 2.3 wording. Never "the file is clean".
- N = 1: "One thing is worth a question." No "I would start with".
- N > 7: show seven, then "and <N minus 7> more, lower down" with a link. The rubric
  decides the seven; the user never has to scroll a wall.
- Two files loaded (reconciliation shapes from `03_ARCHITECTURE.md` 3.6): "I compared
  August with July. <N> things changed that are worth a question." Findings from the
  comparison rank alongside single-file findings by the same rubric.

The phrase "I would start with" is the only place the system expresses preference, and
it is always the top of the rubric. It is there because a user who does not know what to
ask needs to be told where to begin, and a detective who found five things has an
opinion about which matters. Tag: NOW.

### 4.3 The five verbs

Every follow-up on every card is one of five verbs. They are the whole steering
vocabulary, and each is a deterministic engine query with typed parameters generated
from the finding and the schema, so it is always answerable.

| Verb | On the card | Engine query | What comes back |
|---|---|---|---|
| **Show** | Show me the rows / the months / the segments | `show_rows`, `show_series`, `show_strata` | evidence drawer pane |
| **Without** | Show me without January / without these rows | `recompute_excluding(rows or periods)` | headline with both numbers, switchable |
| **Split** | Split by something else | `stratify(outcome, by=<column chooser>)` | a new strata table; the chooser lists only columns that can split (categorical, binned numeric, date part), each with its distinct count |
| **Ask** | Ask my team | template render of rung 3 plus rung 1 | copyable text |
| **Explained** | Explained | state change with a reason | finding moves to the ledger (section 6.3) |

Five verbs is a deliberate ceiling. A sixth verb needs a reason that a wedge user
articulated. "Compare with last month's file" is a Show over two files and does not
need a new verb. Tag: NOW.

### 4.4 Steering without typing statistics: the answer buttons

The most important interaction in the product is the rung-3 answer. The system asks
the one thing it cannot know and the user picks an answer. The answer changes the
card's conclusion, and the change is templated per detector.

Segment reversal (illustrative):

| User picks | Card's WHAT IT COULD MEAN becomes | Severity |
|---|---|---|
| Decided before | "Then the like-for-like number is the fair comparison. South converts better by 4.2 points; North's overall lead is mix." | stays Decides the story |
| Region influences it | "Then the overall number stands. Splitting by Product line would mislead here, because the region shapes the split." | drops to Worth a note, with the user's answer recorded |
| Not sure | "Here is how to find out: does moving a deal between regions ever change its Product line? If never, pick Decided before." | unchanged, marked Open question |

Window shift:

| User picks | Card becomes |
|---|---|
| Yes, I know what | "Then January is a justified start and this is a turnaround. Tell your team what it was so the chart can say so." Severity drops. A one-line note field appears (optional, free text, stored in the case only). |
| No, nothing I know of | "Then the start month is doing the work. The December start is the fairer picture." Severity stays. |
| Not sure | "Ask my team" is promoted to the primary button with the question pre-filled. |

The user's answers are recorded in the Case File and printed in the tie-out under each
finding as "Reviewer's answer". This is how a non-statistician steers: by supplying the
facts about the business that the software cannot see, one click at a time. Tag: NOW.

### 4.5 The Turn, as the UI receives it

From `turn.schema.json` (`03_ARCHITECTURE.md` 3.5), with the fields this document
relies on:

```
{
  "finding_id": "f_02",
  "sentences": [
    { "block": "headline",  "text": "...", "provenance": "computed", "template_key": "simpson.headline.v1" },
    { "block": "observed",  "text": "...", "provenance": "computed", "template_key": "simpson.observed.overall" },
    ...
  ],
  "question": { "text": "...", "answers": [ { "key": "z_before", "label": "Decided before" }, ... ] },
  "follow_ups": [ { "verb": "show", "label": "Show me the segments", "query": "show_strata", "params": {...} }, ... ],
  "how_sure": { "grade": "statistical", "text": "...", "jargon_key": "mantel_haenszel" },
  "can_answer": [ "...", "..." ]
}
```

The UI renders blocks in the fixed order of section 3.2. It never reorders, never
truncates and never composes sentences of its own; if a block is missing, the block is
omitted, not improvised. `can_answer` is used only when free text fails (4.6). Tag: NOW.

### 4.6 Free text, Layer 0: honest keyword intake

There is a text field. It sits below the verbs, closed by default behind "Ask something
else", because the verbs answer most needs and an open box invites the user to expect a
mind. When opened, its placeholder is a list, not a prompt:

```
Try: "total Amount by Region"   "duplicates in Invoice"   "trend of Sales"
```

The intake is the closed intent set from `03_ARCHITECTURE.md` 2.2 item 4: a question
containing a column name and one of a small verb list (total, sum, average, count, by,
trend, compare, duplicates, missing, without, split) maps to an engine query. When it
maps, the result renders as a finding card graded FACT or QUESTION (a user-requested
aggregate is a fact; a user-requested split with no test is a question) and is marked
"You asked for this", so it never ranks alongside detector findings in the report.

When it does not map, the system says so in one line and shows `can_answer`:

```
I cannot answer that from this file. Here is what I can answer about these columns:
  total or average of Amount, Sales, Headcount, by any of Region, Product line, Month
  trend of any of those over Month
  duplicates or missing values in any column
  split any finding above by Region, Product line or Month
```

That admission is the product's honesty in miniature: it never fakes comprehension, and
the user learns the tool's shape from the refusal. Tag: NOW.

### 4.7 Free text, Layer 1: the local narrator, off by default

When the user has loaded a local model (bring-your-own-model, `03_ARCHITECTURE.md`
2.3) and turned the narrator on, three things become possible and everything else
stays impossible.

**Can do:**

1. **Reword a card for an audience.** Two buttons appear on each card: "Say it for the
   board" and "Say it for my controller". The model receives the Turn with every number
   replaced by an opaque token, returns prose, and the number firewall
   (`03_ARCHITECTURE.md` 2.4) rejects any output containing a digit outside a known
   token or a column not in the schema. The reworded block is labelled "Worded locally"
   and sits beside the Computed block, never replacing it. Tag: NEXT.
2. **Summarise the case.** "Sum up the five findings in a paragraph" produces a
   paragraph under the same firewall, for the top of the tie-out. Tag: NEXT.
3. **Route a question the keyword intake could not.** The model is shown the schema
   and the closed query list and must return one query with typed parameters; the
   engine runs it; the result renders as a finding card. The model's own words are
   never shown. If it returns anything else, the `can_answer` list appears. Tag: NEXT.

**Must refuse, and how the refusal reads on screen:**

| User asks | Why it must refuse | What the screen says |
|---|---|---|
| "What is the real growth figure?" | it asks the model to compute or to adjudicate | "I do not compute numbers. The engine found two: 18% from January, minus 4% from December. Which is fair depends on your answer above." |
| "Is my controller hiding something?" | rung 4; a judgement about a person | "I can only tell you what the file shows and which rows it depends on. I cannot tell you why a file looks the way it does. The question to ask is drafted under finding 1." |
| "Forecast next quarter" | not a detector, not an audit question, and a small model's arithmetic is unreliable (GSM8K figures in `03_ARCHITECTURE.md` 2.3) | "PRISM checks the numbers you were given. It does not produce new ones. That is deliberate." |
| "Fix the total" | read-only principle | "I do not change files. The Check it in Excel line under finding 3 shows you where the total and the rows disagree." |
| "Are you sure?" | invites false confidence | the HOW SURE block is repeated, verbatim, with "What would change my mind" appended; the model may not add reassurance |
| Anything requiring facts outside the file | no source, and the model has none | "I only know what is in this file." |

The refusal strings are templates, not model output, so they are identical with and
without the narrator. Tag: NOW for the strings, NEXT for the narrator that triggers
them.

### 4.8 Register, without a model

The "board" and "controller" rewordings are the narrator's best use, but a template
version exists first: each detector ships two headline templates, one for the person
who signs and one for the person who prepares. The controller register is more
specific about cells and less about consequence:

- Signer: "Sales growth of 18% depends on starting in January."
- Preparer: "Sales by Customer, column Sales, January to August: +18%. December to
  August: minus 4%. January is the local minimum."

The Ask verb uses the preparer register, because the preparer is who receives it.
Tag: NOW.

---

## 5. Tone and voice

The Interrogator sounds like the examiner `01_PRODUCT.md` 6.3 describes, in the voice
`docs/business/brand/VOICE.md` prescribes: a competent colleague explaining to someone
who could check. Sherlock's precision (the observation before the inference, and the
inference always falsifiable). Jarvis's calm (no exclamation marks exist in the string
table). Never a salesman: no benefit language, no superlatives, no urgency. Never
breathless: two sentences where two suffice.

### 5.1 Ten lines it says

1. "I read every sheet. Five things are worth a question before you rely on this file."
2. "Starting one month earlier turns 18% growth into a 4% fall."
3. "Overall, North is ahead. Inside every product line, South is ahead. Both are true."
4. "The average is 4,200. Without three rows it is 1,050. The median is 900."
5. "This holds in 96 of 100 resamples. It could be wrong if Product line is caused by
   region, which no test can tell."
6. "I tried 38 ways of splitting this file. This is the one that survived."
7. "I could not run the first-digit test: it needs at least 500 amounts and this file
   has 212."
8. "You marked this as explained: a late adjustment. I have kept it in the report with
   your note."
9. "I cannot answer that from this file. Here is what I can."
10. "Nothing from this file has left this computer. Here is how to check that
    yourself."

Every one of those is either a rendering of a computed field or a statement about the
product's own behaviour that the user can verify. That is the test for any new string.

### 5.2 Five lines it must never say

1. "This looks like fraud." (Rung 4. A legal term and a judgement about a person.
   Also: "manipulated", "cherry-picked", "lying", "cooked".)
2. "I am 92% confident." (An uncomputed number. The grade is a word; a p-value may be
   shown with its test named.)
3. "The true figure is 1,050." (There is no true figure. There is the number with the
   rows and the number without, and the user decides which is the plan.)
4. "Your data is safe with us." (There is no "us". Say what the browser does, per
   VOICE.md 2.2.)
5. "Great question!" (Or any praise, filler, warmth-by-exclamation, or reference to
   itself as knowing, thinking, feeling or being sure.)

### 5.3 Lexicon

| Never | Instead |
|---|---|
| fraud, manipulated, cherry-picked, hidden (as a verb about a person) | "depends on", "carried by", "reverses inside", "worth a question" |
| the truth, the real number, actually | "with these rows" / "without these rows", "from January" / "from December" |
| confidence 92% | FACT / STATISTICAL / QUESTION, plus "holds in 96 of 100 resamples" |
| AI, insight, smart, intelligent, powerful | "check", "finding", "examiner", "computed" |
| error, wrong (about the preparer's file) | "does not equal", "differs by", "does not match" |
| clean, passed, verified (about the whole file) | "11 checks ran and found nothing", "2 could not run" |
| I think, I believe, I feel | "the rows show", "the test finds", "I could not tell" |
| you should, you must | "the question to ask is", "the fairer comparison is" |

### 5.4 Provenance labels

Every text block carries one of two labels in its top right corner: **Computed** or
**Worded locally**. There is no unlabelled prose. Turning the narrator off removes every
"Worded locally" block and the page still reads completely. This is the on-screen form
of `01_PRODUCT.md` 4.4 (the model may talk but may never count). Tag: NOW for the
labels; NEXT for the second label ever appearing.

---

## 6. Trust mechanics

A tool like this earns trust by being checkable and by being wrong gracefully. Six
mechanisms, all present in v1.

### 6.1 It shows its work, at three depths

| Depth | Who | What | Where |
|---|---|---|---|
| 1 | the CEO | the rows, the k-of-n counts, the shadow number | WHAT I SEE, the evidence drawer |
| 2 | the CEO who wants to verify | the Check it in Excel line | drawer, copyable |
| 3 | the analyst or the preparer | the `reproduce` Python, the thresholds with their provenance tags (CITED / ASSUMPTION / DATA-DRIVEN from `02_DETECTORS.md`), `testsRun`, `adjustedP`, `stability`, the detector version | HOW I COMPUTED IT, closed by default |

Depth 3 also links each detector to the public golden datasets it was tuned on
(`02_DETECTORS.md` section 6): "This check was validated on the 1973 Berkeley admissions
table and the kidney stone table." A named, public, re-runnable validation is the
strongest honest credibility signal available to a product with no telemetry. Tag: NOW.

### 6.2 It admits uncertainty in a fixed place

The HOW SURE block is mandatory on every card and has a fixed three-sentence shape:

1. The grade, in a sentence a CEO reads: "This is arithmetic" / "This is the result of a
   test" / "This is a pattern I noticed, not a test."
2. What controls were applied: "adjusted for the 38 splits I tried", "holds in 96 of
   100 resamples", or "no adjustment applies; it is a count".
3. **What would change my mind**: the `wouldChangeMind` field from `02_DETECTORS.md`
   2.1, rendered verbatim. "If Product line is caused by region, this finding should be
   ignored." "If this export was filtered, the total may be right and the rows
   incomplete."

Sentence 3 is the one users remember. A product that tells you in advance how it could
be wrong is believed when it says it is probably right. Tag: NOW.

### 6.3 The user disproves it: the Explained ledger

The Explained verb opens a two-field form: a reason chosen from the detector's
`hypotheses` (the benign explanations it already offered, for example "late adjustment
typed after the detail was frozen") or "Other", and an optional one-line note. On
submit:

- The finding leaves the ranked list and enters the **Explained** section at the bottom
  of the case, labelled with the reason and note.
- It is not deleted. It prints in the tie-out under "Explained by the reviewer", with
  the original observation intact and the reviewer's reason beside it. A finding that
  is quietly deleted would make the report a curated document; a finding that is
  explained in the open makes it an audit working paper.
- Dependent findings are re-evaluated. If the explained finding was the duplicate
  pre-pass ("these 14 rows are legitimate repeat orders"), every count downstream is
  recomputed with the rows included and the affected cards show "recomputed after your
  answer on finding 5".
- The system's response is one line, in the same register as everything else:
  "Moved to Explained: late adjustment. It stays in the report with your note."

Undo is one click for the session. Tag: NOW.

### 6.4 When it is wrong, it is wrong gracefully

Three failure modes, each with a scripted response:

**A false positive the user recognises instantly** (the fragile-number detector flags
three deals that are the company's three biggest customers, every year). The card
already says "if they are your business, the average is the right number; know them by
name". The user clicks Explained, picks "these are repeatable", done. The finding
becomes a line in the report that says the reviewer knows the three names. Not a
failure; the detector did its job, which was to make the user say the names.

**A parser misread** (a FACT finding that the total does not add, because a currency
symbol made a column read as text). The card shows the raw cells in the drawer, the
user sees the symbol, and clicks "Report a wrong finding". This produces a local
bundle: the finding JSON, the detector version, the affected column's inferred type and
the first rows as the parser saw them, saved as a file on the user's machine. Nothing
is sent anywhere; the screen says: "Saved to your computer. If you choose to email it to
us, remove anything confidential first. We never receive anything you do not send."
Tag: NOW.

**A finding the user disputes and the system cannot resolve** (the user says Product
line is caused by region; the system has no way to know). The system does not argue.
It re-renders the card under the user's answer, records the answer, and drops the
severity. The tie-out shows both the original observation and the reviewer's answer.
The disagreement is preserved, not hidden, which is exactly what a working paper does.
Tag: NOW.

### 6.5 The user proves zero egress: the "Prove it" panel

The most important trust claim is the one the user can verify in ninety seconds. The
panel, reachable from the first screen and the footer of every case, says:

```
HOW TO CHECK THAT NOTHING LEAVES THIS COMPUTER

1. Open your browser's developer tools (F12) and choose the Network tab.
2. Drop your file. Watch the list. After the examiner finishes loading, nothing
   further appears. Your file is read in this tab and never requested by anything.
3. Or: turn off your Wi-Fi now, then drop the file. Everything works.
   [ I am offline, run the checks ]

The browser enforces this, not our promise. This page's policy allows connections to
exactly one place, and only to fetch the examiner itself.       Show the policy
```

"Show the policy" prints the CSP meta tag from `index.html` verbatim. When
`03_ARCHITECTURE.md` 3.7 (vendoring Pyodide same-origin) ships, the sentence becomes
"allows connections to no place but this page itself". The offline invitation uses
`navigator.onLine` (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)
only to change the button label; the checks run regardless. Tag: NOW.

### 6.6 Reproducibility as the deepest trust mechanism

The same file, the same build, the same findings, in the same order, with the same
numbers. `02_DETECTORS.md` 2.6 fixes seeds for this reason. The case footer shows:

```
File digest  sha256: 3f9a...c21e      PRISM build  1.0.0  sha256: 8b07...44d1
Drop the same file into the same build anywhere and you will get this case.
```

(Digests illustrative.) That sentence is the honest superpower. It does not ask for
trust in PRISM; it offers a way for a second person to get the same answer without
PRISM's help. Tag: NOW (SHA-256 via `crypto.subtle.digest`,
https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest).

---

## 7. The artifact: the tie-out

What the user carries into the boardroom. Named "the tie-out" per `01_PRODUCT.md` 7.2.
One document, printable to PDF from the browser, with a machine-readable twin.

### 7.1 An honest sentence about "provably never left their machine"

No document can prove a negative to a third party. A signature proves who signed; a
digest proves what was signed; neither proves where a file has been. What the tie-out
can prove, to anyone who holds the same file, is stronger and needs no authority:

> Anyone who drops this file into PRISM build 1.0.0 will get this report.

That is reproducibility, and it is what auditors mean by a working paper. The zero-egress
property is proven separately, by the browser's policy and the Prove-it panel (6.5), and
the report states that mechanism rather than asserting the outcome. The cover says
"Produced entirely on the reviewer's computer. See the last section for how to verify
this." It never says "provably never uploaded".

### 7.2 Structure

```
THE PRISM TIE-OUT
Management Accounts Aug.xlsx

  1  COVER
     File: name, size, sheets, rows, file digest (SHA-256)
     Reviewed: date and time (local clock), by (optional name, typed by reviewer)
     PRISM build: version, build digest
     Checks run: 11 of 13 (2 could not run; see section 6)
     Findings: 5 (2 decide the story, 2 change the number, 1 worth a note)
     Explained by the reviewer: 1
     Reviewer's answers recorded: 3

  2  SUMMARY (one page)
     The ranked list exactly as the case showed it, two sentences per finding.
     Optional narrator paragraph, labelled "Worded locally", only if enabled.

  3  FINDINGS (one per page)
     For each: the full card (section 3.2 blocks), the evidence tables, the first
     50 rows or all rows if fewer, the Check it in Excel line, the reviewer's
     answer to WHAT ONLY YOU KNOW, the question drafted for the team.

  4  EXPLAINED BY THE REVIEWER
     Each explained finding: original observation intact, reason, note, date.

  5  ASKED FOR BY THE REVIEWER
     Any free-text queries the reviewer ran, labelled as such, never ranked.

  6  WHAT WAS CHECKED AND WHAT COULD NOT BE
     Every detector: name, version, ran / could not run, and why not
     (applicability gate that failed, with the file's actual value beside it).

  7  METHOD
     For each detector that fired: the threshold, its provenance tag
     (CITED with URL / ASSUMPTION with reasoning / DATA-DRIVEN), testsRun,
     adjustedP, stability, and the golden datasets it was validated on.

  8  REPRODUCE
     The reproduce string for every finding.
     "Drop the same file into PRISM build 1.0.0 and compare digests."

  9  HOW THIS WAS PRODUCED
     The zero-egress mechanism in four sentences, the CSP verbatim, and the
     Prove-it instructions.

  MACHINE-READABLE TWIN
     A JSON file: the Case File (every finding, every answer, every explanation)
     plus file digest and build digest. Saved beside the PDF from PRISM's own page.
```

Section 6 (what could not be checked) is the page a sceptical board member reads first,
and its presence is what separates a working paper from a marketing PDF. Tag: NOW
(browser print to PDF, WebCrypto digest, JSON saved from PRISM's own page as a local
download).

### 7.3 Redacted variant

"Hide values" produces the same document with every number, name and free-text cell
replaced by a fixed-width grey bar, structure and wording intact. Use: showing a board
member or an adviser that the review happened and what kind of things it found, without
disclosing the figures. The redacted variant carries the same file digest so it can be
matched to the full one later. Tag: NOW.

### 7.4 The preparer's response

When a controller receives a finding card and drops the same file, they get the same
case (6.6). Their PRISM offers "Respond to this finding": the same Explained form, but
the output is a response block for the tie-out, not a state change in the CEO's copy.
They export a response JSON; the CEO drops it onto their case; it attaches under the
finding as "Preparer's response", with the preparer's typed name and the digest of the
file they ran it on (which must match). No server, no account, two files passed by
email. This is how the spell-check dynamic (`01_PRODUCT.md` 9.2) gets a mechanism. Tag:
NOW for the file exchange; the matching UI is a week inside the Case File work
(ASSUMPTION on the week).

### 7.5 Signing, in three honest tiers

| Tier | What it proves | Mechanism | Tag |
|---|---|---|---|
| Digest | this report is about exactly this file and this build; any recipient can recompute both | SHA-256 via `crypto.subtle.digest`, printed on the cover, embedded in the JSON twin | NOW |
| Reviewer's signature | this report was produced by someone holding a key generated on this machine and not changed since signing | ECDSA P-256 key pair generated with `crypto.subtle.generateKey` as non-extractable, stored in IndexedDB, signature over the JSON twin; public key exported once and shared by the reviewer out of band (pasted into the board pack template). Verification page in PRISM: drop the report and the public key. | NEXT (WebCrypto is available today, https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign; the work is key management UX and the verification page) |
| Organisation key and build attestation | this report was produced by an unmodified PRISM build approved by the organisation | the organisation distributes a build whose digest is on their allowlist; the report carries the build digest; the verifier checks it against the allowlist. Proving the build was unmodified at run time, rather than merely that the report names an approved digest, is not possible from inside a web page and would need a desktop wrapper or OS attestation | RESEARCH, and the paid tier's honest ceiling per `01_PRODUCT.md` 11 |

The report never displays a signature as "verified" unless PRISM itself checked it on
this machine in this session. A green tick that appeared because the PDF said so would
be the overclaim this product exists to catch.

---

## 8. Accessibility as a first-class path

This product reads data to people. A screen reader user is not an edge case; they are
the purest form of the target user, someone who needs the numbers explained in order,
in sentences, with the evidence available on demand. The Interrogator's output is
already sentences by construction, so the spoken case is not a translation of the
visual one; it is the same Turn rendered by a different device.

What already exists in the repo and is kept: the axe harness (`vitest.a11y.config.ts`,
`InsightCard.a11y.test.tsx`, `AnalyticsWorkspace.a11y.test.tsx`), the hidden data-table
fallback and sonification in `SmartChart.tsx`, `reducedMotion`, `sonificationEnabled`
and `screenReaderMode` in `prismStore.ts`, the focus ring and forced-colors handling in
`docs/design/ui/tokens.css` (with measured contrast ratios recorded per pair), and the
font-scale control the tokens file describes. New components inherit all of it.

### 8.1 The spoken case (NOW)

Every Turn already has an `accessibleDescription` equivalent: the concatenation of its
blocks in order. For a screen reader the case is a document with landmarks:

```
<main aria-label="Case: Management Accounts Aug.xlsx">
  <section aria-labelledby="opening">   the opening turn, as a paragraph and a list
  <nav aria-label="Findings">           the rail: a list of 5 links, current marked
  <article aria-labelledby="f2-title" aria-describedby="f2-observed">
     h2  headline
     h3  What I see        (dl or table)
     h3  What it could mean
     h3  What only you know (fieldset with three radio buttons, legend = question)
     h3  How sure
     toolbar of verbs (role="toolbar", arrow-key navigable)
  </article>
  <section aria-label="Evidence" aria-live="off">   opened on demand
  <section aria-label="Explained">
</main>
```

Headings are real headings so the H key walks the card in the same order a sighted user
reads it. Tables are real `<table>` elements with `<th scope>`, never divs styled as
grids; the strata table is announced as "Product line Hardware, North won 350 of 940,
37.2 percent". Numbers in the accessible text are spoken forms ("37.2 percent", not
"37.2%") produced by the same Python formatter, so they match the visible text and the
firewall. Tag: NOW. Pattern reference: WAI-ARIA Authoring Practices,
https://www.w3.org/WAI/ARIA/apg/patterns/.

### 8.2 Read it to me, locally (NOW with a guard)

A "Read this finding" button uses the Web Speech API's `speechSynthesis` to speak the
Turn's blocks in order, pausing at each block. One constraint that is an egress matter:
some browsers offer network-backed voices. PRISM must filter
`speechSynthesis.getVoices()` to those with `localService === true`
(https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService)
and, if none exists, hide the button and say why: "No on-device voice is available in
this browser, so reading aloud is off. PRISM does not use online voices." The text
being spoken is finding text derived from the user's data, so this is not a corner to
cut. Tag: NOW.

### 8.3 Sonification stays, for the one detector that needs it (NOW)

Window shift is a series, and a series is what sonification is for. The existing
`SmartChart` audio graph (sine oscillator, pitch mapped to value, per-point playback,
`aria-pressed` play control, status live region) is reused to play the series twice:
January to August, then December to August. Hearing the second run start higher and end
lower is the finding. Sonification is not applied to tables or single numbers, where it
adds nothing. The AudioContext is local; nothing is fetched. Tag: NOW.

### 8.4 Live regions for the reading phase (NOW)

The progress lines in section 2.1 are announced through a single `role="status"`
`aria-live="polite"` `aria-atomic="true"` region, one line at a time, so a screen reader
user hears "Checking whether the totals add up" as the sighted user reads it. When the
case opens, focus moves to the opening turn's heading and the live region is cleared,
so the list is read once, by the user, in order, rather than announced over itself.
Query results (Without, Split) announce one line: "Recomputed. Average without three
rows: 1,050." Reference:
https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live.
Tag: NOW.

### 8.5 Keyboard model (NOW)

Everything reachable by Tab; nothing requires a pointer. Within the findings rail,
arrow keys move and Enter opens. Within a card, Tab walks blocks and verbs; the verb
row is a `role="toolbar"` with arrow keys between verbs. Escape closes the evidence
drawer and returns focus to the verb that opened it. In tables, arrow keys move
between cells and Enter opens the rows behind a cell. Single-letter shortcuts are
offered as an opt-in ("J and K to move between findings") and are off by default so
they never collide with a screen reader's own keys. Focus is always visible, using the
two-ring focus indicator already in `tokens.css`. Tag: NOW.

### 8.6 Motion and time (NOW)

`prefers-reduced-motion` is already read into the store. Under it, the collapse of the
list into the rail and the opening of the drawer are instant. No content ever appears
on a timer: the progress lines advance when a step completes, not on a clock, and the
case never auto-advances. Reference: WCAG 2.2 SC 2.3.3 and 2.2.1,
https://www.w3.org/TR/WCAG22/.

### 8.7 Never colour alone (NOW)

Grades and severities are words first. If a colour is used behind FACT, STATISTICAL
and QUESTION it is decorative, and the word is always present; in the strata table the
"who is ahead" column is text ("South"), not a coloured cell. This satisfies WCAG 2.2
SC 1.4.1 (use of colour) and is already how `InsightCard` renders its badge ("renders
confidence as text, not colour alone" in the existing a11y test). Contrast follows the
measured pairs in `tokens.css`, minimum 4.5:1 for text per SC 1.4.3.

### 8.8 Plain language as an accessibility property (NOW)

The two-sentence headline rule, the k-of-n rule and the ban on jargon above the fold
are cognitive accessibility as much as they are product design. The interface strings
are reviewed against one test: could the sentence be read aloud, once, to a busy person
on a phone call, and be understood. If not, it is rewritten.

### 8.9 Testing (NOW)

Every new component gets an axe test in the existing harness. In addition, three
scripted screen-reader walkthroughs (the opening turn, one card with its drawer, the
Explained flow) are recorded as expected announcement sequences and checked with
`@testing-library`'s accessible-name queries, so a regression in heading order or
missing table headers fails CI, not a user.

---

## 9. Feasibility ledger

Every bold element in this document, in one table.

| Element | Section | Tag | Depends on |
|---|---|---|---|
| Progress lines as onboarding, one per detector | 2.1 | NOW | detector pipeline order |
| Opening turn with "I would start with" | 2.1, 4.2 | NOW | rubric |
| Two-sentence headline with shadow number on every finding | 2.1, 3.1 | NOW | `observed` field |
| Clean-file screen listing what could not run | 2.3 | NOW | applicability gates report their failing value |
| Partial-read continuation | 2.4 | NOW | per-sheet parse errors surfaced |
| First-visit waiting-room cards | 2.2 | NOW | none |
| Formula-mask upgrade (typed number over formula as FACT) | 2 | NEXT | `workbook_meta` in `LOAD_DATASET` (03 risk 2) |
| One card open at a time, full width | 3 | NOW | Case File UI |
| Evidence drawer with clickable table cells to rows | 3.3 | NOW | `GET_ROWS`, `rowIndices` named sets |
| Without toggle (live counterfactual view) | 3.4 | NOW | exclusion primitive in the library |
| Screenshot share view with hide-values | 3.6 | NOW | none |
| Five-verb steering | 4.3 | NOW | follow-up grammar |
| Rung-3 answer buttons that change the card | 4.4 | NOW | per-detector answer templates |
| Keyword intake with `can_answer` refusal | 4.6 | NOW | intent set |
| Register templates (signer / preparer) | 4.8 | NOW | two templates per detector |
| Narrator rewording for board / controller | 4.7 | NEXT | number firewall, bring-your-own-model |
| Narrator case summary | 4.7 | NEXT | same |
| Model-as-classifier routing | 4.7 | NEXT | same, plus parameter validation |
| Refusal strings | 4.7 | NOW | none |
| Provenance labels | 5.4 | NOW | `sentences[].provenance` |
| HOW SURE block with "what would change my mind" | 6.2 | NOW | `wouldChangeMind` field |
| Golden-dataset validation link per detector | 6.1 | NOW | 02 section 6 |
| Explained ledger with dependent recompute | 6.3 | NOW | Case state machine |
| Report-a-wrong-finding local bundle | 6.4 | NOW | none |
| Prove-it panel with offline run | 6.5 | NOW | none |
| File and build digests on every case | 6.6 | NOW | WebCrypto |
| Tie-out report, nine sections plus JSON twin | 7.2 | NOW | Case File |
| Redacted variant | 7.3 | NOW | none |
| Preparer's response file exchange | 7.4 | NOW | JSON twin |
| Reviewer's ECDSA signature and verification page | 7.5 | NEXT | key management UX |
| Organisation build allowlist and attestation | 7.5 | RESEARCH | desktop wrapper or OS attestation |
| Spoken case (landmarks, real tables, spoken number forms) | 8.1 | NOW | formatter emits spoken forms |
| Read-aloud with local-voice guard | 8.2 | NOW | none |
| Sonified window shift | 8.3 | NOW | existing SmartChart audio |
| Live-region progress | 8.4 | NOW | none |
| Keyboard model and toolbar roles | 8.5 | NOW | none |
| Screen-reader walkthrough tests | 8.9 | NOW | existing a11y harness |

Nothing the CEO needs in the first sixty seconds is tagged NEXT. Everything tagged NEXT
is an upgrade to phrasing or to assurance, never to truth.

---

## 10. Requests to the other documents

Small additions this design needs, for the owners of 02 and 03 to accept or refuse.

1. **Schema:** add `wouldChangeMind` (string, required) and `answers[]` (the rung-3
   answer keys and their per-answer re-render templates) to `finding.schema.json`; add
   `explained: { reason_key, note, at }` and `reviewer_answers: {}` to the Case File
   state and the JSON twin.
2. **Detectors:** every applicability gate that fails must report the file's actual
   value beside the threshold ("needs 500, file has 212") so section 2.3 and report
   section 6 can print it.
3. **Formatter:** the Python number formatter should emit a spoken form alongside the
   visual form ("37.2 percent", "412 of 1,208") so 8.1 does not re-format in JS and the
   firewall's token table covers both.
4. **Exclusion primitive:** confirm the row-drop function survives the deletion of the
   preprocessing menu as a library call, for the Without toggle.
5. **Templates as copy:** `03_ARCHITECTURE.md` risk 5 says templates should be reviewed
   like copy. Proposal: the string table lives in one file per detector with the
   template key, the signer and preparer variants, and a comment citing the field each
   placeholder comes from, and a pytest asserts every placeholder maps to a schema
   field.

---

## 11. Open questions for the founding team

1. **Does "I would start with" read as helpful or as presumptuous** to a wedge CEO?
   Five conversations. If presumptuous, keep the ranking and drop the sentence.
2. **How many findings before the list becomes noise?** Seven above the fold is an
   ASSUMPTION. The clean-file and the fifteen-finding cases both need real packs to
   judge.
3. **Answer buttons versus free text for rung 3.** The buttons are the design. Do CEOs
   want a note field beside them from day one, or does that reintroduce the empty box?
4. **The preparer's response exchange** (7.4) is two JSON files passed by email. Is that
   acceptable friction for a controller, or does it need to wait until both parties'
   PRISM can read each other's report PDF directly?
5. **Read-aloud voice availability.** Which browsers on corporate Windows laptops
   actually expose a `localService` voice? If most do not, 8.2 is honest but rarely
   available and should not be in the first release notes.
6. **The word "tie-out"** is finance-native. Does the wedge CEO know it, or does the
   cover need "the PRISM tie-out (reconciliation report)" the first time?

---

## 12. Sources

Repository facts from `C:/Users/Jesun/PRISM` on 2026-09-13:
`src/components/visualization/SmartChart/SmartChart.tsx` (sonification, hidden data
table, `role="img"` summary), `src/components/visualization/InsightCard/InsightCard.a11y.test.tsx`
(axe harness, text-not-colour assertion), `src/stores/prismStore.ts` (`reducedMotion`,
`sonificationEnabled`, `screenReaderMode`), `docs/design/ui/tokens.css` (measured contrast
pairs, focus ring geometry, forced-colors), `docs/business/brand/VOICE.md`. Measured
runtime size (44.4 MiB base tier) from `03_ARCHITECTURE.md` 1.2.

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- aria-live (MDN): https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-live
- SpeechSynthesisVoice.localService (MDN): https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService
- SubtleCrypto.digest (MDN): https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
- SubtleCrypto.sign (MDN): https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign
- Navigator.onLine (MDN): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
- Real-world burns cited by the detectors this document renders are in `02_DETECTORS.md`
  (Bickel, Hammel and O'Connell 1975 for segment reversal; Rahmstorf, Foster and Cahill
  2017 for start-point selection; the JPMorgan CIO task force report and Herndon, Ash and
  Pollin 2014 for arithmetic consistency).

---

*This document designs what the user sees. It does not build. The engine that produces
every sentence is specified in `02_DETECTORS.md`; the code layout in `03_ARCHITECTURE.md`.*
