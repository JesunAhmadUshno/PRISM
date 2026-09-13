# 06 LAUNCH: Build the thing that deserves attention, then the mechanics

Owner: Launch Strategy
Date: 2026-09-13
Status: Founding proposal. Nothing here is built and nothing here is scheduled to a
calendar date. Weeks are relative to W1, the week the first detector reproduces the
demo measurements in section 1.2.
Depends on: 01_PRODUCT.md (the job, the wedge, the spread mechanism), 02_DETECTORS.md
(what fires and how it is worded), 03_ARCHITECTURE.md (what "zero egress" means and
what the CSP allows), 04_INTERROGATOR.md (the card, the verbs, the tie-out),
05_RED_TEAM.md (what the product may promise and what it must never say). Where this
document and docs/business/marketing/LAUNCH_PLAN.md disagree, section 7.5 says why.

House rules observed: no em dashes; no invented numbers (every figure is measured here
with its method and date, cited to a URL, or labelled ASSUMPTION or illustrative);
every proposal carries a feasibility tag (NOW, NEXT, RESEARCH); nothing outside
docs/vision/ touched; no git.

---

## 0. What this document decides

The founder wants a storm. This document does not promise one, because nobody can, and
a trust product that starts life with a promise it cannot keep has already violated its
own premise. What it does instead:

1. Picks the one real, public file that gets dropped in on camera, measures today what
   the detectors must find in it, and rejects the famous candidate that does not survive
   measurement (section 1). The demo is reproducible by a sceptic with a URL and a
   digest, because sceptics are the audience.
2. Tests five hook sentences against the product as designed and picks one (section 2).
3. Designs the screenshot: the finding card carries a footer that names the dataset and
   its URL, so every shared card is a reproducible experiment, not an advertisement
   (section 3).
4. Writes the actual opening lines for Hacker News, LinkedIn, Product Hunt and
   r/dataisbeautiful, each true of the product as designed and each in the register of
   docs/business/brand/VOICE.md (section 4), and the founder's 150 words (section 5).
5. Translates 05_RED_TEAM.md into launch-day failure modes with a control for each
   (section 6).
6. Sequences the work week by week from "detector 1 reproduces the demo numbers" to
   "public" (section 7).

The sentence every piece of copy below must fit inside is the one that survived the red
team (05 section 4.5):

> "PRISM shows you what a spreadsheet's own numbers can prove, where they are fragile,
> what could not be checked, and the exact question to ask; it never tells you who to
> blame, and it never sees the system the file came from."

If a line in this document cannot be derived from that sentence, it is a mistake and
should be cut.

---

## 1. The demo: ninety seconds, one real file

### 1.1 The rule for choosing the file

The video will be watched by two audiences with opposite instincts. The CEO has never
heard of Simpson's paradox and needs to feel "that is my management pack". The Hacker
News reader has heard of it a dozen times and is waiting to catch the tool overclaiming.
A file that satisfies both must be:

- Real and public, at a stable URL, with a licence that permits redistribution, so a
  sceptic can download the identical bytes and drop them in.
- Row-level, not a summary table, so the detectors have rows to point at (02 section
  2.2: a finding that cannot name rows is not emitted).
- Small enough that the runtime cached, the findings appear within the sixty-second
  script in 04 section 2.1.
- Containing at least one thing the audience did not see coming, including the audience
  that thinks it knows the dataset.
- Not about a real company or a named person, because the product's own rules (05
  section 3.2) forbid attribution and the launch must not be the first violation.

### 1.2 Candidates, measured

Every candidate below was downloaded or read on 2026-09-13 and the arithmetic was run
with pandas on the file as downloaded. The detectors described in 02 do not exist yet;
the numbers below are what they must reproduce before the video is filmed.

| Candidate | Source | Licence | What the 02 detectors would report | Verdict |
|---|---|---|---|---|
| UC Berkeley 1973 graduate admissions, per applicant | https://waf.cs.illinois.edu/discovery/berkeley.csv, described at https://discovery.cs.illinois.edu/dataset/berkeley/ ; underlying paper Bickel, Hammel and O'Connell, Science 1975, https://doi.org/10.1126/science.187.4175.398 | Hosted for teaching by the University of Illinois Data Science Discovery programme; redistribution terms to be confirmed with the host before the sceptic's kit ships (section 1.5) | Segment reversal (4.1) inside the six named departments; a catch-all Other bucket (4.7) holding most of the file; a duplicate-detector trap (4.5) that must produce "does not apply" | **Chosen.** Section 1.3 |
| Kidney stone treatment outcomes, Charig et al., BMJ 1986 | https://doi.org/10.1136/bmj.292.6524.879 ; the 2x2x2 table is reproduced at https://en.wikipedia.org/wiki/Simpson's_paradox | Published table; a row-level file must be reconstructed from the counts | Full reversal in both strata (open surgery 81 of 87 small and 192 of 263 large; PN 234 of 270 small and 55 of 80 large; overall 273 of 350 against 289 of 350) | **Second demo**, for the hospital audience. Reconstructed rows, so not the hero |
| Covid-19 case fatality by age, Italy against China, von Kugelgen, Gresele and Scholkopf 2021 | https://arxiv.org/abs/2005.07180 | Curated from public health reports; aggregated by age band | Reversal across every age group | Rejected for the launch: aggregated, and the subject is deaths |
| Justice against Jeter batting averages 1995 to 1997 | https://en.wikipedia.org/wiki/Simpson's_paradox | Public statistics | Average-of-averages over seasons (4.17) | Rejected: 4.17 is not in v1, and the audience outside the United States has no reference point |
| Global temperature "pause since 1998", NASA GISTEMP v4 annual | https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv | US government work | Window shift (4.2) was expected. Measured: not present on current data (below) | **Rejected on measurement.** The famous example does not fire on today's revised series |
| US unemployment rate "since April 2020", BLS series LNS14000000 | https://data.bls.gov/timeseries/LNS14000000 (canonical); mirrored as UNRATE at https://fred.stlouisfed.org/series/UNRATE | BLS: "everything that we publish ... is in the public domain", https://www.bls.gov/bls/linksite.htm ; cite BLS as source | Window shift (4.2): start-point extremity and a sign flip when the start moves two months | **Chosen for the second video** (window shift) |
| Reinhart and Rogoff spreadsheet, as replicated by Herndon, Ash and Pollin 2013 | https://peri.umass.edu/publication/does-high-public-debt-consistently-stifle-economic-growth-a-critique-of-reinhart-and-rogoff/ (data and code, BSD 2-clause) | Replication files open; whether the original workbook is redistributable is unverified | Formula range that stops short of the data block (structural check; needs the formula mask, NEXT per 03), average of averages (4.17, not v1), selective exclusion (a checkability note) | **Deferred to v1.1** as the "real economic decision" demo. Tag NEXT |
| Titanic passenger list | https://github.com/datasciencedojo/datasets/blob/master/titanic.csv | Public domain per 02 section 6 | Must NOT report a full reversal for sex by class (02 section 6 uses it as the false-positive control) | Control, not demo |
| Anscombe's quartet | https://doi.org/10.1080/00031305.1973.10478966 | Published table | Fragile number (4.3) and perfect fits (4.13) must separate the four | Control, not demo |

**Berkeley, measured on the file as downloaded (12,763 rows, 4 columns: Year, Major,
Sex, Admission; SHA-256 431abcb370efe34dd12b807ae214111b2ffdf673462635503b7772b46f1b6656;
275,471 bytes).**

- Year is 1973 in every row. Major has seven levels: A to F and Other. Other holds
  8,237 of 12,763 rows (64.5%). The six lettered departments hold 4,526 rows, which is
  exactly the count in R's `UCBAdmissions` table
  (https://web.mit.edu/r/current/lib/R/library/datasets/html/UCBAdmissions.html) and in
  Bickel et al.
- All rows: men admitted 44.3% (of 8,442), women 34.6% (of 4,321). Gap 9.7 points.
- Six departments only: men 1,198 of 2,691 (44.5%), women 557 of 1,835 (30.4%). Gap
  14.2 points. Matches the published table.
- Per department (men applicants, men admitted %, women applicants, women admitted %):
  A 825, 62.1%, 108, 82.4%. B 560, 63.0%, 25, 68.0%. C 325, 36.9%, 593, 33.9%.
  D 417, 33.1%, 375, 34.9%. E 191, 27.7%, 393, 23.9%. F 373, 5.9%, 341, 7.3%.
  Women ahead in A, B, D, F; men ahead in C, E. Matches the table at
  https://en.wikipedia.org/wiki/Simpson's_paradox to rounding.
- Like-for-like gap, six departments, weighting each department's within-department
  gap by its applicant count: women ahead by 4.3 points (method: n-weighted mean of
  the six within-department differences). Mantel-Haenszel common odds ratio, men
  against women, across the six departments: 0.904. Across all seven strata including
  Other: 1.184. Crude odds ratio, all rows: 1.504.
- Mix: 92.8% of women applied to departments C to F, where overall admission was 35%
  or lower (C 35.0%, D 34.0%, E 25.2%, F 6.6%). 51.5% of men applied to A and B, where
  overall admission was 64.4% and 63.2%.
- Within Other: men 44.2%, women 37.7%. The bucket cannot be split in this file.
- Exact duplicate rows: 12,735 of 12,763. There are only 28 distinct row patterns,
  because every column is a category. A duplicate detector that does not gate on an
  identifier or amount column will make "12,735 duplicate rows" the first finding on
  camera. See section 6, risk L1.

What this means for the demo, and it is better than the textbook version: dropped as
downloaded, the file does not contain the famous reversal. It contains a catch-all
bucket holding two thirds of the rows, an attenuated gap once Major is held constant
(crude odds ratio 1.504, adjusted 1.184), and a full reversal only inside the six
departments that the original authors itemised (adjusted odds ratio 0.904, like-for-like
4.3 points the other way). A tool that reports the famous result on this file would be
overclaiming. A tool that says "the biggest segment is a bucket I cannot split; inside
the six named departments the direction reverses" is telling the truth, and that
sentence is the product.

**GISTEMP, measured (149 lines, annual J-D anomaly; SHA-256 of the snapshot
c9ce0750ca93a8241c42fe86cd5bf54d07b28b21ae650b0ae49a206907018cd9; the file changes
monthly).** The "no warming since 1998" window (1998 to 2012) gives an endpoint change
of +0.04 C and an ordinary least squares slope of 0.134 C per decade; starting in 1996,
1997, 1999 or 2000 gives slopes of 0.163, 0.137, 0.171 and 0.134. No sign flip. 1998
ranks 8th of 25 in the 1986 to 2010 neighbourhood, so the start-point extremity gate in
02 section 4.2 (bottom or top 10%) does not fire either. On the current, revised v4
series the famous cherry-pick is not visible to the detector as specified. The lesson
is recorded here rather than discovered on camera: measure the famous example before
promising it. Rahmstorf, Foster and Cahill 2017 (https://doi.org/10.1088/1748-9326/aa6825)
remain the citation for the start-point pitfall in 02; the demo uses a series where it
is visible today.

**Unemployment, measured (945 lines, monthly, seasonally adjusted, January 1948 to
August 2026 at download; SHA-256 of the snapshot
ffe86c903f6944ebc8281e5474a15fc4ceaac61059bc51ec86a7241391d8713d; the series is
revised, so re-measure before filming).** Headline window April 2020 to April 2022:
14.8% to 3.7%, a fall of 11.1 points. Move the start to February 2020 (3.5%): a rise of
0.2 points. To March 2020 (4.4%): a fall of 0.7. To May 2020: a fall of 9.5. April 2020
is the highest value in the 25 months centred on it (rank 1 of 25), which is exactly the
start-point extremity signature in 02 section 4.2 step 7. The rung-3 question the card
asks is "Did something happen in April 2020?", and the honest answer is yes. That is the
point: the tool does not accuse anyone of cherry-picking. It shows that the start date
does the work, asks whether the start is justified, and offers the fairer comparison
(the last month before the shock).

### 1.3 The choice: Berkeley, as downloaded, with nothing removed

Why Berkeley over kidney stones, which is the cleaner paradox:

- It is a row-level public file at a university URL. Nobody has to trust our
  reconstruction. The sceptic's kit is a URL and a digest.
- It contains three findings of three different kinds, which shows the product is a
  case file and not a one-trick chart: a FACT about the Other bucket, a STATISTICAL
  reversal with the mediator question, and a checkability screen that says what could
  not be checked (one period only, no amounts, no identifiers, no formulas).
- The audience that already knows the dataset gets the surprise that the file is 64.5%
  Other and that the celebrated reversal is a property of the six itemised departments.
  The audience that does not know it gets the CEO lesson directly: the story depends on
  which rows were included and on a bucket somebody chose not to itemise, which is what
  every management pack does with "Other".
- The mediator question has a known answer (the department is chosen before the
  application is assessed), so the "Chosen before" button leads the viewer to the
  reading Bickel et al. themselves reached, without the word "confounder".
- The subject is sensitive. That is a reason to be careful with wording, not a reason
  to avoid it: the card's first line is arithmetic, the second is arithmetic, and the
  product never says who was biased. Section 6 risk L6 covers the failure mode.

Why not kidney stones as the hero: the rows are reconstructed from a published table.
It is honest if labelled, and it is the right demo for a hospital audience because it is
the founder's domain and the reversal is total (both strata), but the first demo must
not contain the word "reconstructed".

### 1.4 The ninety-second script

Return visit, runtime cached, as 04 section 2.1 assumes. Every on-screen number is from
section 1.2. Lines marked [needs 02 change] depend on the spec requests in section 9;
the demo is not filmed until they land. Stability figures ("holds in k of 100
resamples") are shown as "to be computed" here because no engine exists to compute them;
the filmed card shows the computed value or the line is cut.

**0:00 to 0:08. Title card, plain text.**

> Before you sign a number someone else prepared, see which rows it depends on.

Cut to the browser. The drop page, one sentence: "Drop the spreadsheet someone sent
you. It does not leave this computer." Developer tools open beside it, Network panel
visible. The presenter toggles the browser offline (DevTools Network throttling set to
Offline, per 05 rule 4.1.8: the demo turns off the network after load).

**0:08 to 0:14. The drop.** The presenter drags `berkeley.csv` in. Voice, one line:
"This is the 1973 Berkeley admissions file. Twelve thousand rows. Every statistics
course uses it. I have not touched it."

**0:14 to 0:24. Progress lines**, one per detector in pipeline order, each doubling as
onboarding (04 section 2.1). On this file: "Reading one sheet, 12,763 rows." "Checking
what can be checked." "Looking for rows that carry a total." "Trying every way of
splitting the comparison." The Network panel stays empty throughout; the camera holds
on it for one full second.

**0:24 to 0:34. The checkability screen** (05 section 1.9), before any finding:

> Checked 6 of 20 things. 14 could not be checked: the file has one period only (Year
> is 1973 in every row), no amounts, no identifiers, no formulas (it is a CSV), and no
> earlier version on this computer.

The exact counts are what the engine reports on the built detector set; "6 of 20" is a
format illustration, not a promise. Voice: "First it tells me what it could not check.
Remember that."

**0:34 to 0:50. The opening turn.** Two headline findings and one note:

> 1. DECIDES THE STORY. STATISTICAL. Overall, men were admitted more often than women:
>    44.3% against 34.6%. Inside the six named departments, women were admitted more
>    often on like-for-like applications.
> 2. CHANGES THE NUMBER. FACT. 8,237 of 12,763 rows (64.5%) carry the label Other in
>    Major. Within Other, men were admitted 44.2% and women 37.7%. This bucket cannot
>    be split further in this file.
> Checked and looked fine, with notes: 1 item. I would start with 1.

Voice: "Two things. The famous one, and the one nobody mentions: two thirds of this
file is a bucket called Other."

**0:50 to 1:12. Finding 1 opens.** The card as in section 3.6. The presenter reads
the two lines under WHAT I SEE that carry the mechanism: "93% of women applied to
departments C to F, where 35% or fewer of everyone was admitted. 52% of men applied to
A and B, where 63% or more was admitted." Then WHAT ONLY YOU KNOW: "Is the department
chosen before the application is assessed, or does the assessment decide it?" The
presenter clicks **Chosen before**. The conclusion re-renders (04 section 4.4):
"Then compare within departments. The overall gap is mix." Voice: "One click. I told
it one fact about the world and it told me which number to believe. It did not tell me
who to blame."

**1:12 to 1:22. Show me the segments.** The evidence drawer opens: six rows, one per
department, both rates as k of n, the direction column, the mix table underneath. The
presenter clicks the cell "A, women, 89 of 108" and fifty rows appear. Voice: "Every
number is a link to its rows. That is the whole idea."

**1:22 to 1:30. Close.** The presenter clicks the camera icon; the share view renders
(section 3.6) with the footer naming the dataset URL and the PRISM build digest. Cut
to the title card:

> PRISM. Free. Runs in your browser. Nothing leaves your computer, and here is how to
> check that: [URL of the verification page]. Same file, same result: [URL of the
> sceptic's kit].

No music under the voice. No exclamation marks in any caption (VOICE.md 5.3). The
video is published with a text transcript and the script above, so that a viewer who
distrusts video can read every claim.

A one-dataset cut is the default. If the team wants the window-shift demo in the same
video, it must replace the segments step (1:12 to 1:22), not extend the running time.

### 1.5 The sceptic's kit

A public folder (location to be decided; proposed `demo/` at the repository root, which
is outside this document's write scope and is therefore a request) containing:

1. `SOURCES.md`: for each demo file, the canonical URL, the licence statement quoted
   from the host, the download date, byte count and SHA-256 as measured, and a note on
   whether the file changes over time (Berkeley: static; unemployment: revised monthly).
2. The snapshot files themselves where the licence permits redistribution (BLS: yes,
   public domain; Berkeley: confirm with the host first, otherwise the kit contains the
   URL and the digest only).
3. `EXPECTED_FINDINGS.json`: the finding objects in the 03 section 3.5 schema that the
   shipped build produces on each snapshot, checked into the repository and asserted by
   pytest. A sceptic diffs their run against this file.
4. `SCRIPT.md`: section 1.4 verbatim, plus the transcript of the published video.
5. `NETWORK_EVENTS.md`: the published network-events table required by 05 rule 4.1.8
   (trigger, origin, what the origin learns), which on the vendored build of 03 section
   3.7 has one row: the page's own origin, at load, learns that the page was loaded.
6. `REPRODUCE.md`: three ways to reproduce, shortest first: drop the file into the
   hosted build; run the pytest suite locally; run the `reproduce` Python from any
   finding's HOW I COMPUTED IT pane in a plain Python environment.

Tag: NOW for every item. It is documentation plus a pytest fixture.

### 1.6 The second and third demos

**Window shift, 45 seconds, unemployment (NOW).** Drop the BLS series trimmed to
April 2020 to April 2022, because the file's own range is the choice someone made (02
section 4.2 step 3). Finding: "Measured from April 2020, the rate fell 11.1 points.
Measured from February 2020, it rose 0.2 points." WHAT I SEE: "April 2020 is the
highest value in the 25 months around it." WHAT ONLY YOU KNOW: "Did something happen
in April 2020?" Click **Yes**: "Then this is a recovery from a shock and the start is
justified. The fairer comparison is with the last month before it, February 2020." The
demo makes no statement about who has used the April 2020 framing. It shows that the
start date does the work, which is true whoever picks it.

**Hospital audience, 60 seconds, kidney stones (NOW, with the reconstruction stated
on screen).** A 700-row file expanded from the Charig et al. table, with the caption
"rows reconstructed from the published counts; patient ids are synthetic". Finding:
"Overall, the less invasive treatment succeeded more often: 289 of 350 against 273 of
350. For small stones and for large stones separately, open surgery succeeded more
often." Mix: 270 of 350 PN cases were small stones; 263 of 350 open-surgery cases were
large. Mediator question: "Is stone size known before the treatment is chosen?" It is.
This is the founder's domain and the only demo that should be shown in a hospital.

**The real economic decision, deferred (NEXT).** The Herndon, Ash and Pollin
replication of Reinhart and Rogoff: a formula range that stopped short of the data
block excluded five countries from an average, and the corrected average for the
high-debt group moved from -0.1% to 2.2% growth (https://peri.umass.edu/publication/does-high-public-debt-consistently-stifle-economic-growth-a-critique-of-reinhart-and-rogoff/).
This is the strongest possible illustration of "a spreadsheet shaped a decision", but it
needs the formula mask (03 established that SheetJS flattens the workbook today), the
average-of-averages detector (02 section 4.17, not v1), and confirmation that the
original workbook can be redistributed. It is the v1.1 demo and should be announced as
such, not promised.

### 1.7 Feasibility ledger for the demo

| Element | Depends on | Tag |
|---|---|---|
| Berkeley reversal inside six departments with the Other bucket excluded and stated | 02 section 4.1 plus the catch-all exclusion pass (section 9, request D2) | NOW |
| Other bucket as FACT with within-bucket rates | 02 section 4.7 pulled into the v1 build (request D3) | NOW |
| Duplicate detector reports "does not apply" on a file with no identifier or amount | 02 section 4.5 gate (request D1) | NOW |
| Checkability screen with one-period and no-formula reasons | 05 section 1.9 | NOW |
| Answer buttons re-rendering the conclusion | 04 section 4.4 | NOW |
| Segments table with every cell a link to rows | 04 section 3.3, GET_ROWS | NOW |
| Share view with dataset footer | 04 section 3.6 plus section 3.6 below | NOW |
| Offline run during the demo | 03 section 3.7 (vendored Pyodide) and 04 section 6.5 | NOW, one week of plumbing per 03 |
| Stability figure on the card | bootstrap in 02 section 4.1 | NOW |
| Window shift on the unemployment series | 02 section 4.2 | NOW |
| Kidney stones with reconstruction caption | a generator script in the kit | NOW |
| Reinhart and Rogoff formula-range finding | formula mask, 4.17 | NEXT |
| Any "Worded locally" text on a demo card | Layer 1 narrator | NEXT. Not in the launch build; the launch ships Layer 0 only (03 section 2.5) |

---

## 2. The hook: five sentences tested, one chosen

The test for each: is it true of the product as designed; does it name the user's
moment rather than the product's category; does it survive 05 (no "catch", no "truth",
no "clean"); does it pass VOICE.md section 5 (no hype vocabulary, no absolutes); would
a reader who then opens the code find it accurate.

| # | Sentence | Passes | Fails | Verdict |
|---|---|---|---|---|
| 1 | "Before you sign a number someone else prepared, see which rows it depends on." | Names the moment (signing), the situation (someone else prepared), the mechanism (rows it depends on: the Without toggle, the mix table, the shift table all literally show this). No claim about truth or catching. Works as the first frame of the video and the first line of the page | "Rows" is slightly technical for a CEO; "depends on" is abstract until the demo shows it | **Chosen** |
| 2 | "Your team can show you true numbers and still mislead you. See how." | Names the premise honestly ("true numbers") | "Your team" primes accusation, which 05 section 3.2 says the product must not do; a preparer reading it is already an adversary. It sells fear, and VOICE.md forbids urgency | Rejected for the product. Usable, once, as the LinkedIn essay's argument in section 4.2, where the essay has room to say "and most of the time nobody meant to" |
| 3 | "It reads the spreadsheet like an auditor. Nothing leaves your computer." | Mechanism plus constraint, in the founder's credibility register | Two claims; "like an auditor" invites "so is it an audit?", which 05 section 3.5 flags for counsel. The zero-egress line is the HN hook, not the CEO hook | Kept as the second line under the hook, and as the HN title's substance |
| 4 | "Drop in the spreadsheet you were handed. See what you would have missed." | Concrete action, the 01 job-to-be-done in eight words | "What you would have missed" is a claim about the user's competence, and on an honest file the product finds nothing, so the sentence over-promises exactly the way 05 section 2.0 warns about | Rejected |
| 5 | "Checked, not trusted." | Three words, memorable, audit-native | "Checked" is a whole-file verdict word; 05 rule 4.1.3 bans "clean, verified" and this sits next to them. Also unclear what was checked | Rejected |

Chosen: **"Before you sign a number someone else prepared, see which rows it depends
on."** Second line, everywhere the hook appears: "It runs in your browser. Nothing
leaves your computer, and you can check that yourself." Both sentences are true of the
Layer 0 build with vendored Pyodide, and neither survives a code read as an
exaggeration.

Tagline for the site header, from 01 section 7.2's shortlist, unchanged: "Read it like
an auditor. Keep it on your machine."

---

## 3. The share moment: the card is the marketing

### 3.1 What gets screenshotted

One finding card, whole, in the share view. Not the case list, not the drawer, not a
chart. 01 section 9.1 designed the card as the unit of sharing; 05 section 3.2 made the
block inseparable (grade, observation, innocent line, question, in that order, one
border) so that a crop that keeps the observation keeps the innocent line. This document
adds one thing for the public case: a footer that names the dataset and its URL.

### 3.2 Two kinds of card, one layout

**The private card** is what a CEO forwards to a controller. Values may be hidden (grey
bars, structure kept) for sharing outside the company. The footer reads: "PRISM
observation. Often innocent. Recompute steps attached. Checked locally with PRISM build
<short digest>. The file did not leave the reviewer's computer." Copy copies the whole
block with that footer; there is no copy-question-only action (05 rule 4.1.4).

**The public card** is what appears in the video, the posts and the named-pattern
articles. It is only ever generated on a public dataset, and its footer adds one line:
"Data: <dataset name>, <URL>. Anyone can drop the same file and get this card." That
line is the growth mechanism for the public channel: a public card is not an
advertisement, it is an experiment with its materials attached, and the reader's natural
next move is to run it. Tag: NOW (a footer string keyed on a "public dataset" flag the
presenter sets; the product never guesses whether a file is public).

### 3.3 What the receiver feels, by receiver

| Receiver | Sees | Should feel | Design element that produces it |
|---|---|---|---|
| The preparer, receiving the private card from their CEO | An arithmetic observation about their file, an innocent explanation in the same block, a one-sentence question | "I can answer this in one line, and the tool already offered my answer for me" | The innocent line above the fold; the rung-3 question phrased so it can be answered without defending oneself (05 rule 2.2.4); "Often innocent" in the footer |
| The board member, seeing a card in a pack | Grade word, two true sentences, "what only you know" | "I know what to ask, and I could check this myself in sixty seconds" | k of n on every number; Check it in Excel one click down; the digest |
| A stranger on LinkedIn, seeing the Berkeley public card | A famous dataset saying something they did not expect, with the URL | "I have a file like this. What would it say about mine?" | The Other-bucket finding, which every management pack has; the dataset footer |
| A Hacker News reader, seeing the same card | testsRun, the adjusted p, the Mantel-Haenszel name one click down, a digest, a reproduce pane | "They are not hiding the method. Let me try to break it" | HOW SURE with the test named; HOW I COMPUTED IT; the sceptic's kit link |
| A journalist or teacher, six months later | A card about a public dataset that anyone can regenerate | "This is citable" | The public footer, the stable check name and version (01 section 9.5) |

The feeling the card must never produce, in any receiver, is "gotcha". The lexicon in 04
section 5.3 and the wording rules in 05 section 2.2 are enforced by the template layer,
not by taste, so the launch cannot drift from them under time pressure.

### 3.4 What the card never carries in public

- A person's name, a department's name where the department is a person's team, or any
  segment that looks like a person (05 rule 4.1.5). Public cards are generated only on
  public datasets about populations, treatments, periods or categories.
- A real company's file, ever, at launch. The first public card about a real company
  would be the first employment-dispute exhibit (05 section 3.5), and it would be ours.
- A percentage confidence. The grade is a word (01 section 4.1).
- The words found, caught, detected, flagged, suspicious, anomaly, manipulated, fraud,
  cherry-picked, the truth is (05 rule 2.2.5). The demo voiceover obeys the same list.

### 3.5 Hide values

The private card's "hide values" state (04 section 3.6) exists so that a card can leave
a company without its numbers. For launch it has a second use: the founder can show
real wedge cards from the five wedge conversations (section 7, W6), with permission and
values hidden, as the "this is what it looks like on a real management pack" proof,
without disclosing a number from anyone's business. Tag: NOW.

### 3.6 The Berkeley public card, drawn

Figures are the measurements in section 1.2; the two "to be computed" values are the
engine's job.

```
+------------------------------------------------------------------------------+
|  1 of 2    DECIDES THE STORY    STATISTICAL       Check: segment reversal    |
|                                                   v1.0, tried N splits       |
|                                                                              |
|  Overall, men were admitted more often than women: 44.3% against 34.6%.      |
|  Inside the six named departments, women were admitted more often on         |
|  like-for-like applications.                                                 |
|                                                                              |
|  WHAT I SEE                                                       Computed   |
|    Admission, column "Admission", split by "Major".                          |
|    All rows: men 44.3% (3,738 of 8,442), women 34.6% (1,494 of 4,321).       |
|    Six named departments: men 44.5% (1,198 of 2,691),                        |
|    women 30.4% (557 of 1,835). Women ahead in A, B, D and F; men in C and E.  |
|    Like-for-like across the six (weighted by department size): women ahead   |
|    by 4.3 points.                                                            |
|    93% of women applied to C to F, where 35% or fewer of everyone was        |
|    admitted. 52% of men applied to A and B, where 63% or more was admitted.  |
|    8,237 rows (64.5%) are labelled Other and cannot be split. See finding 2. |
|                                                                              |
|  WHAT IT COULD MEAN                                               Computed   |
|    The overall gap comes from where the applications went, not from          |
|    departments admitting men more often on like-for-like applications.       |
|    Which number matters depends on whether the department is chosen before   |
|    the application is assessed, or is a result of it.                        |
|                                                                              |
|  WHAT ONLY YOU KNOW                                                          |
|    Is the department chosen before the application is assessed, or does the  |
|    assessment decide it?                                                     |
|    [ Chosen before ]     [ Assessment decides it ]     [ Not sure ]          |
|                                                                              |
|  HOW SURE                                                                    |
|    STATISTICAL. Mantel-Haenszel across the six departments, adjusted for the |
|    N splits tried in this file. Holds in K of 100 resamples. It could be     |
|    wrong if the department were a result of the assessment, which no test    |
|    can tell.                                                    What is this?|
+------------------------------------------------------------------------------+
   PRISM observation. Often innocent. Recompute steps attached.
   Checked locally with PRISM build <short digest>. The file did not leave this computer.
   Data: UC Berkeley 1973 graduate admissions, per applicant,
   waf.cs.illinois.edu/discovery/berkeley.csv. Anyone can drop the same file.
```

Every count on the card is read from the file (men admitted 3,738 of 8,442; women
1,494 of 4,321; women in department A admitted 89 of 108), not back-computed from a
percentage. The engine must reproduce them exactly or the card is not filmed.

---

## 4. The story for each channel, with the opening lines

Each channel gets the true story that its audience is equipped to verify. Nothing is
said in one channel that would be false in another. Every post links to the
verification page and the sceptic's kit. Nobody on the team asks anyone to vote,
anywhere, ever (Hacker News guidelines: "Don't solicit upvotes, comments, or
submissions", https://news.ycombinator.com/newsguidelines.html).

### 4.1 Hacker News: the engineering is the story

Show HN is for working software that can be tried
(https://news.ycombinator.com/newsguidelines.html on titles: "don't editorialize"). The
title therefore states what it is and the one mechanical fact this audience will check.

**Title:**

> Show HN: PRISM, a spreadsheet examiner that runs in the browser with connect-src 'self'

**First comment, posted by the founder within minutes of the submission:**

> I used to run ISO 27001 audits for banks and hospitals at KPMG. The files I would most
> want to check are exactly the files nobody is allowed to upload, so I built the check
> to run where the file already is.
>
> What it is: you drop a workbook or CSV. Pyodide runs pandas and numpy in a Web Worker.
> A fixed set of detectors runs (in this build: window shift, segment reversal with an
> automatic search over every categorical, binned numeric and date-part column, an
> outlier-carried mean plus small-denominator check, arithmetic consistency, and a
> catch-all bucket check, with duplicate detection as a pre-pass). Every finding names
> the row indices, shows the counterfactual number, carries an Excel recompute string
> and the Python that recomputed it, and prints how many tests were tried. Hypothesis
> tests are pooled under Benjamini-Hochberg at q = 0.05. There is no model in this
> build. The text is templated over computed fields; anything that is not a computed
> field does not appear.
>
> What "nothing leaves your machine" means, precisely: the CSP is default-src 'none'
> with connect-src 'self'. Pyodide is vendored same-origin with pinned digests. The
> worker is created from a blob: URL so it inherits the document CSP, and a test asserts
> the worker source contains no fetch, XMLHttpRequest, WebSocket or sendBeacon. The
> network-events table is here: [link]. The demo video runs with the browser offline
> after load. If you find an outbound byte, that is the bug I most want.
>
> What it does not do: it cannot see what is not in the file. Pre-aggregate the data,
> drop the column, send a PDF, and it will tell you what it could not check, which is
> the first thing it shows, but it will not find the missing column. It does not say
> fraud, it does not name people, and it is sometimes wrong; the grade on each card
> (FACT / STATISTICAL / QUESTION) says how, and the report keeps the findings you
> mark as explained rather than deleting them.
>
> Reproduce the demo: [sceptic's kit link]. The Berkeley 1973 admissions CSV as hosted
> by the University of Illinois, SHA-256 431abcb3..., produces the findings in
> EXPECTED_FINDINGS.json. If your run differs, please post the diff.
>
> Known issues in this build: [the list from the release notes, verbatim, including the
> ones we would rather not mention]. Licence: [the single answer the repository gives,
> which must be settled before this is posted].

Rules for the thread, from LAUNCH_PLAN.md 4.1 and VOICE.md section 4: concede the true
half of every objection first ("yes, this is groupby and a Mantel-Haenszel; the product
is the discipline around them, not the arithmetic"); never argue with "this is just X";
answer "how do I know it is local" with the four escalating checks, never with a
sentence about intentions; if someone finds a false FACT, say so in the thread, file the
issue publicly, and thank them by handle.

### 4.2 LinkedIn: the boardroom story, in the founder's register

The audience is the wedge user and the people who advise them. The story is "true
numbers can still mislead, and the person who signs takes the fall", told without
accusing anyone's team. LAUNCH_PLAN.md 4.4 says LinkedIn is the one channel that is
repeatable; section 7 makes it weekly.

**Opening post (the Berkeley card as the image):**

> This is the most famous spreadsheet in statistics, and it still had something in it I
> had not been told.
>
> The 1973 Berkeley admissions file. Overall, men were admitted more often than women:
> 44% against 35%. Inside the six named departments, women were admitted more often on
> like-for-like applications. Both sentences are true. The gap comes from where the
> applications went.
>
> What I had not seen before I dropped the raw file in: two thirds of the rows sit in a
> bucket called Other. The famous result lives in the six departments somebody chose to
> itemise.
>
> Every management pack has an Other. Every trend has a start date somebody picked.
> Every average has three rows carrying it. None of that is dishonest. All of it is a
> choice, and the person who signs the number usually did not make the choice.
>
> I audited banks and hospitals at KPMG. Audit is one question asked politely and
> repeatedly: how do you know? I built PRISM so that the person signing the number can
> ask it in sixty seconds, in their browser, without the file leaving their computer.
> It shows the rows the story depends on, says how each finding could be innocent, and
> drafts the question to send back. It never says who to blame.
>
> Free. Same file, same result, here: [sceptic's kit]. Your own file: [app].

The image is the public card from section 3.6. The comment thread rule: when a CFO or
controller pushes back ("you are teaching CEOs to distrust their finance teams"), agree
with the risk, point to the innocent line and the fact that the preparer runs the same
free tool first (01 section 9.2), and stop. One reply, no thread.

The weekly follow-ups are the named patterns (01 section 9.5), one per post, each with
a public card on a public dataset: the Other bucket, the start date (unemployment,
April 2020), the three rows that carry an average (Anscombe), the treatment that looks
better overall and worse in every group (kidney stones), the total that does not add
(a synthetic workbook, labelled synthetic on the card).

### 4.3 Product Hunt: the demo is the story

LAUNCH_PLAN.md 4.5 deferred Product Hunt on audience mismatch and re-decides at W8. This
document keeps that decision (section 7, W12) and pre-writes the assets so that the
decision is about audience, not about readiness. Product Hunt's own guidance asks for a
concise tagline of at most 60 characters without hyperbole and a personal maker comment
within minutes of going live (https://www.producthunt.com/launch/preparing-for-launch ;
https://github.com/fmerian/awesome-product-hunt/blob/main/product-hunt-launch-guide.md).

**Tagline (60 characters, exactly the limit; counted by script):**

> Read the spreadsheet you were sent like an auditor. Locally.

**Description:**

> Drop in the workbook someone sent you. PRISM runs an auditor's first hour in your
> browser: which rows carry the trend, where a comparison reverses when you split it,
> whether the start date does the work, which totals do not add. Every finding shows its
> rows, says how it could be innocent, and drafts the question to send back. Nothing
> leaves your computer, and the page shows you how to check that.

**Maker comment:**

> I spent my audit career asking one question: how do you know? Most people who sign a
> number never get to ask it. The pack lands the night before the meeting, and the
> person who built it knows where the soft spots are.
>
> PRISM asks the question for you, in the browser, with the network off. The ninety
> second video uses a public file anyone can download; the digest and the expected
> findings are in the kit so you can check that I did not stage it.
>
> It is deliberately narrow. It reads workbooks and CSVs. It does not read PDFs, it
> does not connect to anything, and it does not use a model in this build. It is
> sometimes wrong, and every card says how sure it is and what would change its mind.
> Tell me where it is wrong on your file; that is the feedback I need most.

The rank is not reported (LAUNCH_PLAN.md 2.2).

### 4.4 r/dataisbeautiful: the paradox is the story, the tool is a credit

LAUNCH_PLAN.md 4.2 argued this channel down to "only in its honest form", because the
subreddit is for visualisations, not tools, and its rules require an [OC] title plus a
comment naming the data source and the tool
(https://www.reddit.com/r/dataisbeautiful/about/rules/). The pivot changes one thing:
PRISM's evidence pane for a segment reversal is a visualisation of a paradox, and the
paradox is on-topic. The post is therefore a chart with a rules-compliant credit, not a
launch beat. It is posted only if the chart is good enough to stand without the credit.

**Title:**

> [OC] Berkeley 1973 admissions: men admitted more often overall, women more often
> inside four of the six departments, and the 64% of applicants filed under "Other"

**Required first comment:**

> Source: UC Berkeley 1973 graduate admissions, per-applicant CSV hosted by the
> University of Illinois Data Science Discovery programme,
> https://waf.cs.illinois.edu/discovery/berkeley.csv (12,763 rows). Underlying paper:
> Bickel, Hammel and O'Connell, Science 1975, doi:10.1126/science.187.4175.398.
> Tool: PRISM (browser, pandas via Pyodide), evidence view exported as an image. The
> mix panel shows the share of each group's applications by department; the reversal
> is only visible once the "Other" bucket, which holds 8,237 rows and cannot be split,
> is set aside. Rates per department are in the table; happy to share the pandas.

The chart is the segments table plus the mix table from 04 section 3.3, drawn well.
"Drawn well" is chart craft and is out of scope here; the dataviz discipline in the
repository's design docs applies. Do not measure this post. Do not repeat it.

### 4.5 r/privacy: a request for scrutiny, one line

Kept as LAUNCH_PLAN.md 4.3 specified: not an announcement.

> I built a browser tool for checking spreadsheets that claims nothing leaves the
> machine, and I would like that claim attacked. CSP, worker source and the network
> events table are here: [verification page]. What did I miss?

### 4.6 The named-pattern articles, the durable channel

01 section 9.5 makes the check names the public content. Each article is one pattern,
one public card, one plain explanation of how the pattern misleads, one "how this could
be innocent" paragraph, and the recompute steps in Excel. No product pitch beyond the
card footer. The first five, in publishing order, are the five LinkedIn follow-ups in
4.2. The articles are what a search for "why does my total not match the detail" or
"average of averages" should land on in a year. Owned by growth; this document only
fixes the rule that every article is built from a real public dataset or a workbook
labelled synthetic on its face.

---

## 5. The founder's story: 150 words

To be posted under the founder's own name, on LinkedIn first, and used as the "About"
text on the site. Every biographical sentence is written from the brief for this
document (ex-KPMG IT Advisory; ran ISO 27001 audits for banks and hospitals) and must be
checked word by word by the founder before it is published; nothing here adds a year, a
count or a client.

> I worked in IT Advisory at KPMG, running ISO 27001 audits for banks and hospitals.
> Audit is one question asked politely and repeatedly: how do you know?
>
> Most people who sign numbers never get to ask that. The pack lands the night before
> the board. The person who built it knows where the soft spots are. The person who
> signs it does not, and carries the consequences anyway.
>
> So I built the examiner I wished every client had. It reads the workbook the way an
> auditor reads it in the first hour, shows you which rows the story depends on, says
> how each finding could be innocent, and drafts the question to send back. It runs in
> your own browser. Nothing leaves your computer, and you can check that yourself.
>
> It is called PRISM. It is free. It is sometimes wrong, and it shows its work so you
> can tell.

(150 words, counted by script on 2026-09-13; the count treats each whitespace-separated
token as a word.) Note what it does not say: no "watched
numbers lie for a living", because ISO 27001 audits examine controls and systems, and a
sceptic who knows that would catch the stretch. The true sentence, that audit is the
discipline of "how do you know", is stronger.

---

## 6. What kills it at launch

05_RED_TEAM.md attacked the product. This section translates each surviving attack into
the form it takes on launch day, and names the control. "Control" means something that
exists before the post goes up, not a reply prepared for after.

| # | Launch risk | How it shows up | Control before launch | Response on the day | Tag |
|---|---|---|---|---|---|
| L1 | **A false FACT on camera or in the first hour.** The Berkeley file has 12,735 exact duplicate rows because every column is a category (section 1.2). A naive duplicate pre-pass makes "12,735 duplicates" the first finding, and the product is a joke by minute two | The demo file itself | 02 section 4.5 gains a gate: duplicates run only when an identifier or amount column exists; otherwise the checkability screen says "duplicates: does not apply, every column is a category" (request D1). pytest asserts zero FACT findings on the clean corpus (05 rule 4.1.6) and asserts the exact expected findings on every demo snapshot | If a false FACT is reported anywhere on launch day, the founder confirms it in the thread within the hour, the release note is amended, and 05 kill criterion 7 is invoked as written | NOW |
| L2 | **The headline false-alarm rate on honest packs.** A CEO drops their real August pack the same afternoon and gets five findings the controller answers in five sentences | The first real user, not the demo | The clean corpus gate (05 section 2.0 rule 3) with a recorded acceptable headline rate, set by the founding team on the five wedge files from W6, not invented here; the severity floor; "nothing worth a question" as a designed screen | Nothing to do on the day; if it happens, the launch was early and section 7's W6 exit criterion was skipped | NOW |
| L3 | **The cropped card as a weapon.** Someone screenshots a card about a colleague's file and posts it | Any day after launch | The inseparable block, copy-copies-the-block, person-like attribution off by default and one click down, the onboarding sentence "send the whole card, not a crop" (05 section 3.2) | Do not amplify; do not comment on the file; if asked, point to the innocent line that the crop removed | NOW |
| L4 | **The clean report launders a curated file.** A launch-week user attaches a "PRISM tie-out" to a board pack that was summary-only | Weeks after launch, invisible to us | The report's first page is "could not check N of M things and why" (05 sections 1.9 and 3.3); the report never carries the words assurance, audit, attest, verify, certify or clean; the on-report sentence "a report that says could not check is telling you where to look" | None possible; the product cannot see it. Say this in the HN comment before someone else does | NOW |
| L5 | **"Zero egress" contradicted by a network request.** An HN reader opens the Network panel and sees a request to a CDN, or a model download | First hour of the Show HN | Ship Layer 0 only; vendor Pyodide so connect-src is 'self' alone (03 section 3.7); publish the network-events table; delete the pinned-CDN weights option from 03 (05 rule 4.3.1); run the demo offline after load | Thank the reporter, post the table, and if they are right, pull the claim from the page before replying further | NOW; the vendoring is a launch gate (section 7, W3) |
| L6 | **The demo dataset reads as a statement about gender.** The Berkeley card is quoted as "PRISM says Berkeley was not biased" or the opposite | LinkedIn and Reddit, same day | The card's first two lines are arithmetic; the product never says who was biased; the mediator question is on the card; the voiceover says "it did not tell me who to blame"; the HN comment states what the tool cannot know (cause) | Do not litigate the history. Point to Bickel et al.'s own conclusion and to the rows. One reply | NOW |
| L7 | **"This is just groupby."** The reflex in every technical thread | HN, first ten minutes | The first comment concedes it in advance and names what the product actually is: the gate discipline, the evidence rules, the wording ladder, the BH pooling, the checkability screen | Agree. Never defend the arithmetic. Offer the false-positive controls as the interesting part | NOW |
| L8 | **The repository contradicts itself.** Licence, README claims, package description, the old "AI insights" phrase | HN, first ten minutes | LAUNCH_PLAN.md gates G3 and G4; the deletion list in 01 section 10 executed in the codebase, not only in the docs | If a stale claim is found, fix it in the repository the same hour and say so | NOW |
| L9 | **The word "tie-out" is read as an assurance claim.** A practitioner asks whether an ex-KPMG founder is offering audit opinions from a browser tab | LinkedIn, week one | Counsel's answer to 05 open question 4 before launch; the report's face text per 05 rule 4.1.12 (describes one file by digest; unsigned; not an opinion on people or the business) | Quote the report's face text. Do not improvise a legal position in a comment | NOW for the text; counsel is a dependency |
| L10 | **The founder argues.** One defensive reply sets the tone of the thread (LAUNCH_PLAN.md 4.1) | HN and LinkedIn | The reply rules in 4.1 and VOICE.md section 4, printed and beside the keyboard; a second person reads every reply before it is posted on launch day | If a reply was defensive, do not delete it; post the concession under it | NOW |
| L11 | **Preparers respond by sending less.** The first controllers who receive a card reply with PDFs and summaries | Month two | The checkability screen makes the reduction visible and hands the CEO a neutral request; 05 kill criterion 6 names the observable | Record it in the W12 review. It is a kill signal, not a comms problem | NOW |
| L12 | **A number in the demo does not reproduce.** A sceptic runs the kit and gets a different adjusted odds ratio because the unemployment series was revised or the engine changed | Any day | Static snapshots with digests in the kit; EXPECTED_FINDINGS.json regenerated and reviewed on every detector change; "the series is revised monthly" stated in SOURCES.md | Thank them, diff, explain, and update the kit publicly | NOW |
| L13 | **Spreadsheet-borne text reaches the screen.** A cell containing instructions or an insult is rendered inside a finding | Any file | Layer 0 renders cell text only inside evidence tables with the existing sanitizer; there is no narrator at launch (05 section 1.5 is a Layer 1 concern) | None needed at launch | NOW |
| L14 | **Nothing happens.** No storm, no thread, a quiet week | Launch week | Section 8: the only metrics that count are reproductions, filed issues and described files; a quiet week with two reproductions and one bug is a good week | Continue the weekly LinkedIn pattern posts. Do not repost the Show HN (LAUNCH_PLAN.md section 6) | NOW |

The two risks that decide whether there is a product at all are L1 and L2, and both
are pytest fixtures before they are anything else. That is why section 7 spends its
first four weeks on them and not on the video.

---

## 7. Sequencing, week by week

Weeks are relative. W1 begins when an engineer can run the segment-reversal detector on
`berkeley.csv` in pytest. Nothing in W7 or later starts until every earlier exit
criterion is met, and the exit criteria are observable, not felt.

| Week | Work | Exit criterion | Tag |
|---|---|---|---|
| **W1** | Golden-file harness: the four snapshots (Berkeley, unemployment, kidney stones reconstructed with its generator, Titanic control) plus the synthetic clean control from 02 section 6, with digests. Segment reversal (4.1) reproduces the section 1.2 numbers on the six departments: crude 44.5% against 30.4%, adjusted OR 0.904, four of six departments reversed. On Titanic it reports interaction, not reversal. On the synthetic random file it reports nothing after BH | pytest green on all five; EXPECTED_FINDINGS.json committed for Berkeley | NOW |
| **W2** | Duplicate pre-pass gate (D1); catch-all exclusion pass in 4.1 and the Other-bucket detector 4.7 (D2, D3); the checkability screen's data (what ran, what could not, with the failing value); window shift (4.2) reproduces the unemployment numbers: -11.1 from April 2020, +0.2 from February 2020, rank 1 of 25 | Berkeley run produces exactly the two findings and the checkability counts in section 1.4, no duplicate finding; unemployment run produces the window-shift finding | NOW |
| **W3** | Egress hardening as a gate: vendor Pyodide same-origin, connect-src 'self' alone, preconnect removed, csp.test.ts tightened (03 section 3.7); the network-events table written from the built page; offline run verified by a person with the Network panel open | csp.test.ts asserts ["'self'"]; the app completes a Berkeley run with the browser offline after load | NOW (03 estimates one week) |
| **W4** | Case File UI on the schema: finding card with the inseparable block, evidence drawer with GET_ROWS, answer buttons re-rendering the conclusion, share view with private and public footers, hide values, Prove-it panel. No chat box, no menu, no chart recommendation | The section 1.4 script can be walked end to end by hand on Berkeley in under ninety seconds on a cached runtime | NOW |
| **W5** | Words as a legal control (05 rule 4.1.11): every template string reviewed against 04 section 5.3 and 05 section 2.2 by a second person; the banned-word test added to the test suite; counsel's answers on "tie-out" and on the report's face text; report face text implemented | Banned-word test green; counsel's written answers on file | NOW; counsel is external |
| **W6** | The clean corpus: the founder obtains, with permission, at least five real monthly management packs from the wedge network (01 kill criterion 1 and 05 section 2.0 rule 3), values scrambled if needed, structure preserved. Run the build on each. Record the headline count per file. Hold the five wedge conversations (01 kill criterion 2) with the Berkeley demo and, with permission, their own pack | The founding team writes down the acceptable headline rate and the build meets it; zero FACT findings on the corpus; at least three of five wedge users say they would drop their next pack in | NOW; this week decides whether W7 happens |
| **W7** | Fix what W6 found. Regenerate EXPECTED_FINDINGS.json. Record the ninety-second video from the section 1.4 script with the browser offline; publish the transcript and the sceptic's kit; landing page with the hook, the second line, the verification page and the card | A person outside the team reproduces the Berkeley findings from the kit without help | NOW |
| **W8** | Quiet proof (LAUNCH_PLAN.md Phase 1): the warm network only. Founder posts the 150 words and the Berkeley card on LinkedIn. Fix what comes back for one week | No open defect that a stranger could find in ten minutes (L8 checklist); LAUNCH_PLAN.md gates G1 to G7 re-verified against the current repository (the brief for this document states 152 tests, CI gates and zero advisories; verify, do not assume) | NOW |
| **W9** | Show HN, with the section 4.1 title and comment. Two people on the thread: one writes, one reads before posting. r/privacy scrutiny request the same week | The thread is judged on whether the claim survived and how many reproductions were posted, never on rank | NOW |
| **W10 to W11** | Weekly LinkedIn pattern posts (4.2): unemployment start date, Anscombe carried average, kidney stones. r/dataisbeautiful only if the segments chart is good enough to stand alone. The named-pattern articles begin | Three articles live, each on a public dataset | NOW |
| **W12** | Review against kill criteria: 01 section 12 items 1 to 3 and 05 section 4.4 items 5 to 7, using what W6 to W11 produced. Decide Product Hunt (section 4.3 assets are ready). Decide whether to open the enterprise conversations in the founder's hospital and bank network (01 section 8.2) | A written go or no-go on each kill criterion | NOW |
| **W13 onward** | v1.1 detector wave (Benford with gates, average of averages, arithmetic consistency with the formula mask), the Reinhart and Rogoff demo when the formula mask exists, the optional Layer 1 narrator behind the number firewall and BYOM only | Not scheduled here | NEXT |

### 7.1 What is deliberately not in the sequence

- No model of any kind before W13. The launch build is Layer 0, and it must feel like a
  detective without one (04 section 0). A model download during launch week is risk L5.
- No paid tier before the report can be signed (05 rule 4.3.5) and before 01 kill
  criteria 1 to 3 have been answered. The free examiner is the distribution.
- No press outreach. The channels above are the ones whose audiences can verify the
  claim. A journalist who cannot run the kit will quote the hook, and the hook is not
  the product.
- No repost, no second Show HN, no deleting and retrying (LAUNCH_PLAN.md section 6).

### 7.2 Reconciliation with docs/business/marketing/LAUNCH_PLAN.md and GO_TO_MARKET.md

LAUNCH_PLAN.md was written for the analytics product and its gates G1 to G7 stand. Its
channel verdicts also stand: Hacker News gated and once; LinkedIn first and continuous;
r/privacy as a request for scrutiny; r/dataisbeautiful only in its honest form; Product
Hunt deferred and re-decided. Three things change because the product changed:

1. The demo is now a specific public file with expected findings, so the launch has a
   reproducible artefact where the analytics product had a feature list. Gate G6 (the
   verification page) gains the sceptic's kit as a second required asset.
2. G7 (eight discovery interviews) is replaced in spirit by W6 (five wedge conversations
   with the actual demo and the clean corpus), because 01 section 12 defines the kill
   criteria in those terms. The count is 01's; this document does not change it.
3. The GO_TO_MARKET.md Phase 4 amendment ("nothing is sold until Phase 1 exits") is
   kept and sharpened: nothing is sold until the report can be signed and the clean
   corpus gate has a recorded rate.

---

## 8. What counts, and what does not

There is no telemetry and there never will be (01 section 9.6), so the launch cannot
count users, files or findings, and must not try. LAUNCH_PLAN.md 2.2's banned metrics
(views, upvotes, rank, stars without an issue) apply unchanged. What counts, because
each is a thing a person did on purpose and told us about:

- A reproduction: someone ran the kit and posted "same digest, same findings" or a diff.
- A filed false finding, through the manual structure-only channel (05 rule 4.1.10).
- A described file: an inbound message that describes a specific management pack the
  sender would drop in, or did.
- A preparer who says they ran it before sending (01 section 9.2 firing).
- A card forwarded to us by its recipient, with the sender's permission.

Five of any of these in the first month is a launch that worked. The number five is an
ASSUMPTION about what a founding team of this size can follow up properly, not a
forecast.

---

## 9. Requests to the other documents

| # | To | Request | Why | Tag |
|---|---|---|---|---|
| D1 | 02 section 4.5 | Duplicate detection runs only when an identifier-like or amount-like column exists; otherwise the checkability screen shows "does not apply: every column is a category" | The demo file has 12,735 exact duplicate rows by construction (section 1.2); risk L1 | NOW, blocks the demo |
| D2 | 02 section 4.1 | Catch-all exclusion pass: when a Z level meets the 4.7 catch-all criteria (name matches Other/Misc/Unknown and holds a large share of rows), compute and report the adjusted effect with and without that level, and word the headline as "inside the named segments" when the reversal exists only without it | The Berkeley reversal exists only outside the Other bucket; reporting it without saying so would be an overclaim, and every management pack has an Other | NOW |
| D3 | 02 section 3 | Pull the Other-bucket detector (4.7) into the v1 build | It is the second demo finding, it is a value count and a name match, and it is the finding CEOs recognise | NOW |
| D4 | 02 section 6 | Add the four launch snapshots with digests to the golden datasets, and add EXPECTED_FINDINGS.json as a pytest fixture | Section 1.5 | NOW |
| D5 | 02 section 4.2 | Record that GISTEMP v4 does not exhibit the 1998 start-point signature on current data (section 1.2), and use the BLS unemployment series as the tuning example for start-point extremity | The famous example fails measurement; the doc should not imply otherwise | NOW |
| I1 | 04 section 3.6 | Public card footer: "Data: <name>, <URL>. Anyone can drop the same file." behind a presenter-set public-dataset flag | Section 3.2 | NOW |
| I2 | 04 section 4.3 | The Without verb accepts a segment on catch-all findings ("Show me without Other") and reruns the case | Manual path when D2 has not fired, and the natural follow-up on finding 2 | NOW |
| A1 | 03 section 3.7 | Vendoring Pyodide is a launch gate, not a follow-up | Risk L5; the demo runs offline | NOW |
| A2 | 03 section 2.3 | Confirm deletion of the pinned-CDN weights option per 05 rule 4.3.1 before any Layer 1 work | Risk L5 | NOW |
| P1 | 01 section 7.2 | Adopt the hook from section 2 as the line under the name, with the second line | Consistency across the site, the video and the posts | NOW |
| P2 | 01 section 9.5 | Every named-pattern article is built on a public dataset or a workbook labelled synthetic on its face; never on a real company's file | Risk L3 and 05 section 3.5 | NOW |

---

## 10. Open questions this document could not close

1. Does the University of Illinois host permit redistribution of `berkeley.csv` inside
   the sceptic's kit, or does the kit carry the URL and digest only? One email decides.
2. What is the acceptable headline rate on the clean corpus? W6 records it; nothing here
   proposes a value.
3. Is there a public, row-level business dataset with a known reversal or a known window
   choice that names no company and no person? None was found in this pass. If one
   exists, it replaces kidney stones as the second demo, because the wedge user's
   recognition is worth more than the hospital's.
4. Will the built detector's testsRun and stability values on Berkeley leave the card
   readable, or does a four-column file produce a testsRun so small that "adjusted for
   N splits" reads oddly? Decide the wording variant for small N in 04.
5. Which two people are on the Show HN thread, and has the second one read VOICE.md
   section 4 aloud?
6. Should the ninety-second video be recorded by the founder or by a voice that is not
   the founder's? The founder's credibility is the asset (01 brief); the founder's
   accent, pacing and comfort on camera are unknown to this document.

---

## 11. Sources

All accessed 2026-09-13.

- Bickel, Hammel and O'Connell (1975), Sex bias in graduate admissions: data from
  Berkeley. Science 187, 398 to 403. https://doi.org/10.1126/science.187.4175.398
- R datasets, UCBAdmissions (4,526 observations, six departments).
  https://web.mit.edu/r/current/lib/R/library/datasets/html/UCBAdmissions.html
- University of Illinois Data Science Discovery, Berkeley's 1973 Graduate Admissions
  Dataset (12,763 rows, four columns). https://discovery.cs.illinois.edu/dataset/berkeley/
  and https://waf.cs.illinois.edu/discovery/berkeley.csv
- Wikipedia, Simpson's paradox (department table and kidney stone table).
  https://en.wikipedia.org/wiki/Simpson's_paradox
- Charig, Webb, Payne and Wickham (1986), Comparison of treatment of renal calculi by
  open surgery, percutaneous nephrolithotomy, and extracorporeal shockwave lithotripsy.
  BMJ 292, 879 to 882. https://doi.org/10.1136/bmj.292.6524.879 ; full text at
  https://pmc.ncbi.nlm.nih.gov/articles/PMC1339981/ (350 open surgery, 350 PN patients;
  273 and 289 successes)
- von Kugelgen, Gresele and Scholkopf (2021), Simpson's paradox in Covid-19 case
  fatality rates. https://arxiv.org/abs/2005.07180
- NASA GISS, GISTEMP v4, GLB.Ts+dSST.csv.
  https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv
- Rahmstorf, Foster and Cahill (2017), Global temperature evolution: recent trends and
  some pitfalls. Environmental Research Letters. https://doi.org/10.1088/1748-9326/aa6825
- US Bureau of Labor Statistics, series LNS14000000, unemployment rate, seasonally
  adjusted. https://data.bls.gov/timeseries/LNS14000000 ; public domain statement at
  https://www.bls.gov/bls/linksite.htm ; mirrored as UNRATE at
  https://fred.stlouisfed.org/series/UNRATE
- Herndon, Ash and Pollin (2013), Does High Public Debt Consistently Stifle Economic
  Growth? PERI Working Paper 322, with data and code.
  https://peri.umass.edu/publication/does-high-public-debt-consistently-stifle-economic-growth-a-critique-of-reinhart-and-rogoff/
- Anscombe (1973), Graphs in statistical analysis.
  https://doi.org/10.1080/00031305.1973.10478966
- Titanic passenger list. https://github.com/datasciencedojo/datasets/blob/master/titanic.csv
- Hacker News guidelines. https://news.ycombinator.com/newsguidelines.html
- Product Hunt, Prepare for your launch. https://www.producthunt.com/launch/preparing-for-launch
- fmerian, Product Hunt launch guide.
  https://github.com/fmerian/awesome-product-hunt/blob/main/product-hunt-launch-guide.md
- r/dataisbeautiful rules. https://www.reddit.com/r/dataisbeautiful/about/rules/
- Measurements in section 1.2: pandas on the files as downloaded on 2026-09-13; digests
  by sha256sum; the commands are reproducible from the description and will be committed
  to the sceptic's kit as scripts.

---

*This document designs the launch. It does not build the product, and it does not
promise a result. Where it conflicts with 01 to 05, the requests in section 9 say what
should change and where.*
