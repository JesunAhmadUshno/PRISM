# PRISM Voice and Tone

Owner: Brand and Voice
Last revised: 2026-09-13
Applies to: every word PRISM publishes. Product interface strings, error messages, README,
landing page, documentation, release notes, sales email, conference talk, support reply,
security advisory, commit message, social post.

`BRAND.md` says what we are. This says how we sound. `docs/business/marketing/MESSAGING.md`
says what we argue. Where this document and MESSAGING.md overlap, they agree deliberately;
where MESSAGING.md is more specific about a claim, it wins on the claim and this wins on the
wording.

---

## 1. The voice in one paragraph

PRISM sounds like a competent colleague explaining how something works, to someone who could
check. Short sentences. Concrete nouns. Mechanisms rather than benefits. The limitation
stated before the advantage. No intensifiers, no urgency, no flourish. When we do not know
something, we say we do not know and then say what would tell us. The credibility of this
product comes from restraint, so the correct volume for our strongest claim is the quietest
one available.

---

## 2. Five principles

### 2.1 Show the mechanism, not the benefit

The reader is technical and is trained to discount benefit language. A described mechanism
survives scrutiny; an asserted benefit invites it.

> **DO:** "The Content Security Policy sets `default-src 'none'` and allows outbound
> connections to one origin: the Pyodide CDN. Everything else is refused by the browser."
>
> **DO NOT:** "PRISM delivers uncompromising, enterprise-grade data protection."

### 2.2 Hand over a check instead of asking for belief

Every claim should arrive with the means to falsify it.

> **DO:** "Open DevTools, go to the Network tab, and load your file. After Pyodide finishes
> loading, nothing further is requested. You can also disconnect from the network and run the
> analysis anyway."
>
> **DO NOT:** "Rest assured, your data is safe with us."

The second sentence is worse than useless here. It contains the phrase "with us," which
concedes the exact thing we are claiming does not happen.

### 2.3 Concede the true half first

Almost every objection we receive is partly correct. Say the correct part first, in the
objector's own words, without softening it. The concession is what earns the reader's
attention for the rest of the sentence.

> **DO:** "Excel already runs on your machine, so on the no-upload point Excel and PRISM are
> the same. The difference is narrower than that: what Excel makes you build by hand,
> ANOVA, Kruskal-Wallis, Shapiro-Wilk, PRISM runs for you, in the same tab, without the
> add-in your IT department has disabled."
>
> **DO NOT:** "Excel simply cannot handle modern analytics workloads."

### 2.4 State the limitation before someone finds it

The audience is auditors. For them, a disclosed flaw is evidence of process. An undisclosed
flaw found later retroactively discredits everything you said before it.

> **DO:** "`xlsx@0.18.5` carries a HIGH severity prototype pollution advisory with no npm
> fix available. We are migrating to the SheetJS CDN build. Until that lands, this is the
> most serious known issue in the project, and it is listed here rather than in a footnote."
>
> **DO NOT:** Leave it out and hope.

### 2.5 Use a number only with its method attached

A number with no method is decoration. This applies even when the number is favourable.

> **DO:** "The production build is 1,294,138 bytes across `dist/`, of which the charts chunk
> is 564,384. Measured with `npm run build` on 2026-09-13."
>
> **DO NOT:** "Lightning-fast, ultra-lightweight."
>
> **ALSO DO NOT:** "Handles files up to 500MB." `MAX_FILE_SIZE` in `src/security/validator.ts`
> is set to 500 MB while the doc comment directly above it says 50 MB, and neither figure has
> been benchmarked. We have no agreed maximum input size, so we publish none.

---

## 3. Register calibration

Voice is fixed. Tone moves within a narrow band depending on the situation. The band is
narrow on purpose: PRISM is never playful, never grave.

| Situation | Tone | Target length | Never |
|---|---|---|---|
| Landing page | Plain declarative. Mechanism first. | Shortest possible | Adjective stacks, hero-copy rhythm |
| Product interface | Instructional, second person, present tense | Under 12 words per string | Personality, jokes, exclamation marks |
| Error and limit messages | Factual, no apology theatre, always name the next action | One or two sentences | "Oops," "Something went wrong," blame on the user |
| Security page | Most precise register we have. Assume a hostile, qualified reader | As long as accuracy requires | Reassurance, absolutes, "unhackable" |
| Security advisory about our own defect | Flat, chronological, no mitigation until the facts are stated | As long as it takes | Passive voice hiding the actor, "out of an abundance of caution" |
| Release notes | Terse, factual, defects listed alongside features | One line per change | Feature marketing inside a changelog |
| Sales conversation | Consultative. Ask what the review blocked | Listening more than talking | Pressure, scarcity, discount urgency |
| Support reply | Direct. If we cannot do it, say so in the first sentence | Short | Roadmap promises to close a conversation |
| Conference or chapter talk | Teaching a mechanism, not pitching | Product mentioned late and once | A demo that hides a limitation |

---

## 4. The awkward questions, with the actual words

House rule: an awkward question gets a short answer and no defensiveness. Length signals
discomfort.

**"Isn't PRISM the NSA program?"**

> "Same word, different thing. Ours is the optical one: light goes in, the spectrum comes
> out, nothing is kept. If the name becomes a distraction for your team we can talk about
> that, but the product does the opposite of the program you are thinking of, and you can
> verify that in the network panel rather than taking my word for it."

Then move on. Do not make a joke about it, do not build a campaign on the reversal, and do
not act wounded.

**"How do I know it is really local?"**

Four escalating checks, in this order, and stop as soon as the asker is satisfied: the
Network tab, disconnecting from the network and running the analysis anyway, reading the CSP
in `index.html`, and grepping the source for the four network primitives. Never answer this
question with a sentence about our intentions.

**"Is it open source?"**

> "The repository currently contradicts itself on that: the LICENSE file contains the MIT
> text, package.json says PROPRIETARY, and the README reads as open source. That is our
> mistake and we are resolving it. I will not tell you which one it is until the files
> agree."

Do not answer this question any other way until the files agree.

**"Are you going to start collecting data later?"**

> "We cannot without breaking the product's only claim, and the pricing model is built so
> that we never need to. There is no metering in it, because the CSP that makes the claim
> true also makes metering impossible."

**"Who else is using it?"**

> "Nobody yet. It is pre-revenue and you would be first."

Do not soften this, do not gesture at a pipeline, do not say "we are in conversations with."

---

## 5. Banned words and phrases

These are prohibited in all PRISM copy. The right-hand column is not optional: replace, do
not simply delete.

### 5.1 Hype vocabulary

| Banned | Why | Write instead |
|---|---|---|
| revolutionary | Claims a category shift we have not caused, from a project with seven commits | Say what is different, mechanically |
| game-changing | Says nothing and signals marketing-led copy to a technical reader | Name the thing that changed for the reader |
| seamless | The seams are real: Pyodide cold start, single-worksheet reads, chart truncation | Describe the actual step, including the wait |
| cutting-edge | Every component we use is mature and boring, which is the point | "Pyodide, pandas, scipy, in the browser" |
| leverage (as a verb) | Corporate filler for "use" | use, run, rely on |
| powerful, robust, blazing fast, lightning fast | Unmeasurable adjectives standing in for a benchmark | A measured number with its method, or nothing |
| effortless, magic, magical, just works | Denies the friction the user will meet in the first 30 seconds | State the friction |
| unlock, empower, supercharge, elevate | Verbs with no referent | The specific action the user can now take |
| best-in-class, world-class, industry-leading | Unprovable, and we have no users | Nothing. Cut the sentence. |
| disrupt, disruptive | We are not displacing an incumbent | "reaches work that is not happening today" |
| solution (as a noun for our product) | Vague, and it is the word the audience skims past | PRISM, the app, the tool, the page |

### 5.2 Claims that are factually unsupported today

| Banned | Why | Write instead |
|---|---|---|
| certified, compliant, conformant | No certification or audit of any kind exists | "designed against", "architected to" |
| ISO 27001, ISO/IEC 27001:2022 (as our status) | Currently claimed in the README with nothing behind it. Off limits. | "built by someone who audited against ISO 27001 at KPMG", if and only if describing the founder, never the product |
| WCAG 2.2 AAA, AAA accessible | No audit exists. The design work is real, the badge is not | Name the features: keyboard navigation, screen reader data tables, sonification, high contrast mode, 7:1 target contrast |
| enterprise-grade, production-ready, battle-tested | Untrue at this maturity | "early, and honest about it" |
| zero trust | Misused in the README and in `package.json`'s description. This audience knows the term and we are not using it correctly | "no server, no upload" |
| AI, AI-powered, AI-driven, AI insights | The insight engine is rule-based logic over pandas and numpy output. There is no model | "automated statistical flags", "outlier and correlation detection" |
| military grade, bank grade, hardened, unhackable | Meaningless, and this audience mocks it | "browser-enforced", "verifiable" |
| guaranteed, 100%, always, never fails, completely secure | Absolutes we cannot defend at the endpoint layer. A malicious browser extension or a compromised machine defeats any in-page guarantee | "the architecture prevents", "you can verify", plus the stated limits |
| trusted by, loved by | We have no users | Nothing |

### 5.3 Structural tics

| Banned | Why |
|---|---|
| "In today's data-driven world" and any variant | Filler opening. Start at the second sentence. |
| "We are excited to announce" | Our excitement is not information |
| "Simply", "just", "easily" before an instruction | Tells the reader that their difficulty is a personal failing |
| "Oops", "Uh oh", "Something went wrong" | Error copy that withholds the error |
| Rhetorical questions as headings ("Why PRISM?") | Reads as a sales deck |
| Exclamation marks | Zero permitted outside a direct quotation |
| Emoji in product interface, documentation headings, README headings or release notes | The README currently uses decorative emoji in headings. The convention is wrong for this audience and this voice. Emoji are permitted only in informal social posts, and even there sparingly. |
| ALL CAPS for emphasis | Use bold. Caps are reserved for evidence tags: MEASURED, PLATFORM, ASSUMPTION, UNMEASURED, OPEN ITEM, GREEN, RED. |

---

## 6. The em dash is banned

**The character U+2014 (the em dash) must not appear in any PRISM text, ever.** Not in
marketing copy, not in documentation, not in interface strings, not in commit messages, not
in an email.

This is a house rule, not a typographic opinion, and it has a practical benefit: an em dash
is now one of the most reliable surface signals that a passage was generated rather than
written. The entire brand rests on being checkable by a skeptical reader. A reader who
concludes that our security page was machine-written has already discounted it.

**Replacement ladder, in order of preference:**

1. **A full stop.** Most em dashes are joining two sentences that should be two sentences.
2. **A colon,** when the second half explains or delivers the first.
3. **A comma pair,** for a parenthetical aside that belongs in the flow.
4. **Parentheses,** for an aside that does not.
5. **A single hyphen with spaces,** last resort, and rare.

**Also banned:** the en dash (U+2013) used as a sentence connector. It is permitted only in
genuine numeric ranges, and even there "to" is preferred: write "10 to 20 rows", not
"10 - 20 rows".

**Known live violation:** `README.md` line 13 currently reads "complete data
sovereignty[em dash]**no bytes ever leave your machine**". That file belongs to another
team; this document records the defect rather than editing it.

**How to check before publishing:** grep the file for the U+2014 character. The count must be
zero. Add the same check to any pre-commit or CI setup that covers documentation and copy.

---

## 7. Mechanics

- **Person:** "you" for the reader, "we" for PRISM. Never "PRISM believes" or "PRISM is
  committed to." A tool does not hold beliefs.
- **Tense:** present tense for what the product does. Future tense only with a date or a
  named gate attached, never on its own.
- **Voice:** active. If a sentence hides who did something, rewrite it. This matters most in
  incident copy, where passive voice reads as evasion.
- **Contractions:** allowed and preferred in conversational contexts. Avoided in security,
  legal and advisory copy, where flatness is the point.
- **Sentence length:** vary, but the average should sit under 20 words. If a sentence needs
  a second comma to survive, it is two sentences.
- **Lists:** Oxford comma. Parallel grammatical structure within any list.
- **Numbers:** digits for all quantities, including under ten, since this is a statistics
  product and consistency matters more than prose convention. Thousands separators on
  anything over four digits. Units always stated. Method always attached.
- **Capitalisation:** sentence case for every heading, button and label. Title case only for
  proper nouns. "PRISM" is always capitalised in full; never "Prism", never "prism" except
  when referring to the optical object.
- **Spelling:** the founder is in Toronto. Pick Canadian or American spelling, write it down
  here once chosen, and be consistent within a document. **OPEN ITEM: not yet decided.**
- **Technical nouns:** exact and cased correctly. Pyodide, WebAssembly, Web Worker, pandas,
  NumPy, SciPy, Content Security Policy, SheetJS. Not "webassembly", not "Pandas".
- **Quoting our own numbers:** any figure in public copy must be traceable to a document in
  `docs/business/` that shows how it was obtained.

---

## 8. Product interface copy

This is the highest-leverage surface and the one where voice failures are most visible,
because the user is mid-task and every word is in their way.

**Rules:**

1. Labels are nouns. Buttons are verbs. Never the reverse.
2. Under 12 words for any string that sits in the interface chrome.
3. Never explain the architecture inside a task flow. The user chose PRISM for the
   architecture and does not need it re-sold while they are working.
4. Every limit or degradation the software applies silently must be disclosed at the moment
   it applies. This is a correctness requirement wearing copy clothing.

### 8.1 Copy that does not exist yet and must

These are three places where the product currently does something silently that the user
would want to know about. Suggested strings follow the voice. The engineering work is not
ours; the wording is.

**Chart truncation.** Charts are built with `head(n)` rather than a sample: 500 points for
scatter, 100 for line and preview, 15 for bar, 10 for value counts. The user is told nothing.

> **DO:** "Showing the first 500 of 84,213 rows. These are the first rows in file order, not
> a random sample, so this chart may not represent the whole dataset."
>
> **DO NOT:** "Chart optimised for performance."
>
> **DO NOT:** stay silent, which is the current behaviour.

**Single worksheet.** Only `SheetNames[0]` is ever read from a workbook.

> **DO:** "Read sheet 1 of 4: `Q3 Detail`. PRISM currently reads only the first worksheet.
> The other 3 sheets in this workbook were not analysed."

This is the most likely source of a silently wrong answer in the product today, which makes
it the most important string in the application.

**Cold start.** Pyodide downloads and initialises on first analysis, and `scipy` loads
lazily on first statistical test, so there are two waits.

> **DO:** "Loading the Python runtime from the Pyodide CDN. This happens once per tab. Your
> file is not part of these requests and stays in the tab."
>
> **DO NOT:** "Preparing your insights."

The second is worse than a spinner, because it hides both the wait and the only outbound
requests PRISM makes, and those requests are the one thing a suspicious user will see in
their network panel.

Note what this string deliberately does not say. It does not quote a download size, because
the Pyodide payload has not been measured and `scipy` loads lazily on top of it, so there are
two waits of unknown size. **UNMEASURED.** Once the measurement protocol in
`SCALING_LIMITS.md` has been run, add the figure with its method. Until then, describing the
request without sizing it is accurate and a guessed size is not.

### 8.2 Error copy

Pattern: what happened, why, what to do. No apology, no blame, no exclamation mark.

> **DO:** "This file is 612 MB. PRISM has not been tested above [measured ceiling] and the
> tab is likely to run out of memory. Try a filtered export or a subset of columns."
>
> **DO NOT:** "Oops! Something went wrong. Please try again later."
>
> **DO NOT:** "Your file is too large." (Tells the user nothing actionable, and implies a
> ceiling we have not measured.)

Note the bracket. Until the measurement protocol in `SCALING_LIMITS.md` has been run, that
string cannot be finished, and shipping a made-up number in its place would violate section
2.5.

---

## 9. Three rewrites from the current README

Each of these is live text in the repository today. They are the clearest available
illustration of the gap between where the words are and where this document says they should
be. The README belongs to another team; these are the rewrites, not the edits.

### 9.1 The subtitle

> **Current:** "PRISM is a zero-trust data analytics platform that processes sensitive data
> (Excel, CSV) entirely within your browser. It generates AI-driven visual insights
> while guaranteeing complete data sovereignty[em dash]**no bytes ever leave your machine**."

Four violations in two sentences: "zero trust" misused, "AI-driven" unsupported,
"guaranteeing" an absolute, and an em dash.

> **Rewrite:** "PRISM analyses Excel and CSV files entirely inside your browser tab.
> Parsing runs in JavaScript, statistics run in Python through WebAssembly, and there is no
> server. The only outbound requests the page makes are for the Python runtime itself, from a
> public CDN, and your file is never part of them. You can confirm that in your network
> panel."

Be careful with this sentence in particular. "One request" would be wrong: Pyodide fetches
several files, and `scipy` is fetched separately and lazily on the first statistical test. If
the xlsx migration lands as CDN-loaded SheetJS, that adds another origin. Any copy that
counts our outbound requests has to be re-checked against the network panel on the day it is
published, because a reader will count them.

Longer by a line. It survives a hostile reading, which the original does not.

### 9.2 The security section heading

> **Current:** "### Security (ISO/IEC 27001:2022 Compliant)"
>
> **Rewrite:** "### Security"
>
> and, in the body: "No certification has been obtained or sought. The controls below were
> designed by an engineer who previously performed ISO 27001 audits in banking and
> healthcare at KPMG. That is a statement about the design, not a statement about a
> certificate."

The second version is more persuasive to the buyer precisely because it refuses the badge.
An auditor who reads a compliance claim with nothing behind it stops reading the document.

### 9.3 The accessibility section heading

> **Current:** "### Accessibility (WCAG 2.2 Level AAA)"
>
> **Rewrite:** "### Accessibility
>
> Designed against WCAG 2.2 Level AAA. Not audited, so not claimed as conformant. What is
> actually implemented: full keyboard navigation, screen reader data tables behind every
> chart, sonification of chart data, a high contrast theme, a colourblind-safe chart palette,
> an 18px default body size, and 44px minimum touch targets."

The list is more convincing than the badge, and it is true.

---

## 10. Pre-publish checklist

Run this against anything before it goes out. Any "no" blocks publication.

1. Zero U+2014 characters in the file.
2. Every number has a method or a cited source, or it has been cut.
3. No word from section 5 appears.
4. The strongest claim in the piece arrives with a way for the reader to check it.
5. The most obvious objection is conceded in the piece, in the objector's words, before we
   answer it.
6. Every known limitation relevant to the claim is stated in the piece, not in a footnote
   elsewhere.
7. No compliance, certification or conformance word appears.
8. Nothing implies endorsement by KPMG, a former client, or any standards body.
9. Read the piece as a hostile qualified reviewer who has already opened the source. Is
   there anything in the repository that contradicts it?
10. Could a competitor's honest engineer read it and find nothing to object to? That, not
    persuasiveness, is the bar.
