# PRISM Messaging

Owner: CMO
Last updated: 2026-09-13
Depends on: POSITIONING.md. Read Section 0 of that document first. Every claim below is
constrained by its evidence ledger, and nothing here overrides it.

---

## 1. The message house

**Roof, the one thing to remember:**
Analyze the spreadsheet you are not allowed to upload.

**Three supporting pillars.** Every asset we produce should be traceable to exactly one.

| Pillar | The claim | The proof we can show today | Who it is for |
|---|---|---|---|
| **1. No upload** | The file never leaves the machine, because there is nothing on the other end to send it to | The CSP meta tag, the empty network tab, a source grep that finds no network primitive | All Tier 1 |
| **2. No wait** | You get the answer now, not after a vendor review | It is a URL. There is no install, no account, no seat, no request to file | The blocked analyst |
| **3. Real statistics, not a preview** | Actual Python, pandas and numpy, in the tab | Pyodide in a Web Worker over WebAssembly, running the analysis module in the repo | The technical evaluator |

**Foundation, the reason to believe:** built by a former KPMG IT Advisory auditor who ran
ISO 27001 engagements in banking and healthcare, and who therefore designed for the question
the privacy office asks first.

Pillar 1 is the differentiator. Pillar 2 is the reason they act today. Pillar 3 is what stops
Pillar 1 from being a party trick. If an asset does not carry Pillar 1, ask why it exists.

---

## 2. One line

Channel variants. Same claim, different entry point.

- **Default / website hero:**
  Statistics and charts for Excel, CSV and XML files, computed entirely inside your browser
  tab. The file never leaves your machine.

- **Hacker News, Show HN title:**
  Show HN: PRISM, browser-only spreadsheet analytics with a CSP of default-src 'none'
  (Lead with the mechanism. This audience reads the mechanism as the claim.)

- **LinkedIn, founder voice, audit network:**
  I built the tool I wanted at KPMG: drop a client file in, get the statistics, and nothing
  is transmitted anywhere.

- **Healthcare analyst:**
  Profile the extract before it goes anywhere. No upload, no vendor agreement, no ticket.

- **Legal and eDiscovery:**
  Counts, distributions and date range checks on a production file, with nothing leaving
  your machine.

- **Privacy and security audiences:**
  default-src 'none'. No fetch, no XHR, no WebSocket, no sendBeacon anywhere in the source.
  Check for yourself.

- **Six words, for a sticker or a slide:**
  Your data never leaves the tab.

---

## 3. One paragraph

**Standard version, use this unless there is a reason not to:**

> PRISM is a browser-only analytics tool. You drop in an Excel, CSV or XML file and it
> profiles the columns, computes descriptive statistics and draws the charts that suit the
> data. All of it runs inside the tab: SheetJS parses the file in the page, and Pyodide runs
> Python, pandas and numpy in a Web Worker through WebAssembly. There is no upload step,
> because there is no server to upload to. The page's Content Security Policy is set to
> default-src 'none', and there is no fetch, XMLHttpRequest, WebSocket or sendBeacon call
> anywhere in the source. You do not have to take that on faith. Open your network tab, drop
> in a file, and watch nothing happen. It was built by a former KPMG IT Advisory auditor,
> for the analysts who cannot put a client file, a patient extract or a privileged production
> into a cloud tool and do not want to spend a quarter asking permission.

**Short version, under 60 words, for a bio or a directory listing:**

> Browser-only analytics for Excel, CSV and XML. Statistics and charts computed inside your
> tab using Python via WebAssembly. No upload, no account, no server: the page's Content
> Security Policy blocks outbound connections and the source contains no network calls.
> Built for analysts in regulated work who cannot send a file to a cloud vendor.

---

## 4. One page

Use this as the landing page structure, the sales one-pager, and the spine of any talk.

### PRISM: analyze the spreadsheet you are not allowed to upload

**The problem**

You have a file. A general ledger extract from a client. A patient-level pull from the data
warehouse. A production export under a protective order. Someone needs to know what is in it
by Thursday.

The cloud analytics tool on your desk would answer the question in ten minutes. You are not
permitted to put that file into it, and getting permission is not your decision to make. It
goes to the privacy office, or vendor risk, or legal, or all three. So you do it in Excel by
hand, or you email it to the one colleague with a licence, or you file a ticket and wait.

The problem was never the analysis. The problem is the upload.

**What PRISM does**

Drop the file into the page. PRISM detects the column types, computes descriptive statistics
across every column, flags outliers and correlations, and recommends and draws the charts the
data actually supports. Excel, CSV and XML.

**How it works, and why the claim holds**

- SheetJS parses the file **in the page**. The bytes go from your disk into your tab's memory
  and nowhere else.
- Pyodide runs **Python, pandas and numpy in a Web Worker** through WebAssembly. The same
  stack a data scientist would use, executing on your own CPU.
- The page's **Content Security Policy is default-src 'none'**, with form-action, object-src
  and frame-src all set to 'none'. The only outbound connections the policy permits are to
  the CDNs that deliver the runtime itself, before your file is ever opened.
- There is **no fetch, no XMLHttpRequest, no WebSocket and no sendBeacon anywhere in the
  source**. There is no analytics, no error reporting, no telemetry of any kind. We do not
  know you used it.

**Verify it in two minutes, without trusting us**

1. Open DevTools, go to the Network tab, and check "disable cache."
2. Load the page. You will see the application and the runtime download. That is the last
   traffic you will see.
3. Drop in your file. Run the analysis. Watch the Network tab stay empty.
4. If you want to go further: disconnect from the network entirely after the page loads, then
   run the analysis. It still works.
5. If you want to go further still: read the CSP in the page source, and grep the source for
   the four network primitives above. Nothing is hidden.

**Who it is for**

Auditors profiling a client file. Healthcare analysts working with identifiable extracts.
Litigation support teams under a protective order. Public sector analysts with residency
constraints. Anyone whose first question about a new tool is "where does the data go."

**Who it is not for**

If you need shared dashboards, scheduled refreshes, a warehouse connection or multi-user
permissions, PRISM cannot do any of it, and it never will, because doing so would require the
server we deliberately do not have. Use a BI platform for that. Use PRISM for the first
ninety minutes with a new file.

**Who built it**

Jesun Ahmad Ushno, AI engineer and data architect in Toronto, formerly KPMG IT Advisory,
where the work was ISO 27001 audits in banking and healthcare. PRISM is designed against the
question those audits always start with: can you demonstrate, not assert, where the data went.

**Current state, stated plainly**

PRISM is early and pre-revenue. What is proven is the architecture: the data does not move,
and you can confirm that yourself in two minutes. What is not yet proven is everything a
mature product earns over time, including an independent accessibility audit and an external
security review. We will publish those when they exist and not before.

---

## 5. Proof points and their evidence status

Never use a proof point whose status is not GREEN.

| # | Proof point | Status | Note |
|---|---|---|---|
| P1 | CSP is default-src 'none' with form-action, object-src and frame-src at 'none' | GREEN | Visible in page source |
| P2 | No fetch, XHR, WebSocket or sendBeacon in the source | GREEN | Reproducible with one grep |
| P3 | Analysis continues with the network disconnected | GREEN after a manual check per release | Add to the release checklist |
| P4 | Python, pandas and numpy via Pyodide in a Web Worker | GREEN | Architectural fact |
| P5 | No telemetry, no analytics, no error reporting | GREEN | Follows from P2 |
| P6 | Founder is ex-KPMG IT Advisory, ISO 27001 engagements in banking and healthcare | GREEN as biography | Never as endorsement or certification |
| P7 | Statistics are correct | RED | Zero tests exist today. Turns GREEN when the suite passes in CI |
| P8 | WCAG 2.2 AAA | RED | Asserted in the README with nothing behind it. Do not repeat it |
| P9 | ISO/IEC 27001:2022 compliant | RED | No ISMS, no scope, no auditor. Off limits |
| P10 | Any row count, file size or timing figure | RED | Nothing benchmarked. The repo's own size constant contradicts its docstring |
| P11 | Dependency tree is clean | RED until the SheetJS CDN migration ships | Blocks the whole security-forward campaign |
| P12 | Any user, customer or revenue number | RED, permanently in its current form | There are no users, and there is no telemetry to count them with |

---

## 6. Objection handling

House style for all of these: concede the true part first, in the objector's own words. Our
ICP is professionally skeptical. An answer that starts by agreeing is the only kind they read
past. Never argue the objector into a corner in public.

### 6.1 "Why not just use Excel?"

**Short answer:**
Keep using Excel. PRISM reads the file Excel gave you and tells you in one pass what is in it,
so you know where to look when you go back.

**Full answer:**
Excel is where this work lives and we are not trying to change that. The gap is not
capability, it is effort and repeatability. Producing quartiles, correlation structure,
missing-value counts and outlier flags across twenty columns is an afternoon of manual work
and a fresh opportunity for an error nobody catches. The Analysis ToolPak helps, when the
corporate build has it enabled, which is not always.

PRISM does that pass automatically the moment the file lands, then tells you which columns
look wrong and which charts the data actually supports. It is a profiling step in front of
Excel, not a replacement for it. If your file is small, familiar and you already know the
answer, Excel is faster and you should use it.

**Do not say:** anything that implies Excel users are unsophisticated. Our buyers are expert
Excel users and the insult lands instantly.

### 6.2 "Why not Tableau?" (or Power BI, or any BI platform)

**Short answer:**
Tableau is a system of record. PRISM is the first ninety minutes with a file, before anyone
has decided whether it deserves a dashboard.

**Full answer:**
For a governed, shared, refreshing dashboard, a BI platform wins and it is not close. PRISM
has no server, so it has no sharing, no scheduled refresh, no warehouse connection and no
row-level security. Those are not gaps we intend to close. They are what we traded away.

Two things go wrong with a BI platform for this specific job. The first is custody: putting a
new sensitive extract into a cloud service is exactly the event that starts the review, and
that review is not the analyst's to accelerate. The second is proportionality: modelling and
publishing takes real effort for a question you will ask once and then never again.

A useful way to split them. If the answer will be looked at repeatedly by several people,
build it in the BI platform. If you are trying to work out whether the file is even worth
that, start in PRISM.

**If they use Tableau Desktop or Power BI Desktop:** concede it directly. Those run locally
too. Our honest edge is install friction. PRISM is a page, so it works on a locked down client
laptop where you have no rights to install anything and no time to request them. If they
already have a desktop tool installed and approved, tell them to use it.

### 6.3 "How do I trust that it is really local?"

**Short answer:**
Do not trust it. Check it. Open your network tab, drop in a file and watch nothing happen.

**Full answer, this is the most important objection we handle and it deserves the most space:**

You should not take this on faith from a vendor, and the design exists so that you do not
have to. Four checks, in increasing order of rigor:

1. **The network tab.** DevTools, Network panel, disable cache, load the page. You will see
   the app and the Python runtime download. Then drop in your file and run the analysis.
   Nothing further appears. No request, no beacon, no websocket.
2. **Pull the plug.** Load the page, then disconnect from the network entirely. Drop in the
   file. The analysis still runs. A tool that needed a server could not do that.
3. **Read the policy.** The page ships a Content Security Policy of default-src 'none', with
   form-action 'none', object-src 'none' and frame-src 'none'. The browser itself enforces
   this. It is not a promise in our code that our code could later break, it is a restriction
   the browser applies to the page. The only connections permitted are to the CDNs that
   deliver the runtime.
4. **Read the source.** Grep it for fetch, XMLHttpRequest, WebSocket and sendBeacon. Those
   are the four ways a browser page can send data out. None of them appear.

**The honest limits, state these before anyone else does:**

- This is a claim about PRISM's code and the browser's enforcement of its policy. It is not a
  claim about your whole machine. A malicious browser extension, a compromised endpoint or a
  keylogger can read anything on your screen, and that is true of every web application and
  most desktop ones. We cannot fix your endpoint and we will not pretend otherwise.
- The page is served over the network, so your browser fetched it from somewhere, and the
  Python runtime comes from a CDN. That happens before your file is involved. If your
  environment requires it, load the page, disconnect, then work.
- We have not yet had an independent third party review this architecture. When we do, we
  will publish the report, including whatever it finds.

**For an auditor specifically:** the control here is preventive and browser-enforced rather
than detective and vendor-attested. There is no data processing agreement to review, because
there is no processor. Your privacy office and counsel make the determination about your
specific use. We are not in a position to make it for you, and we will not pretend to be.

### 6.4 "What happens when my dataset is too big for a tab?"

**Short answer:**
At some size it will not work, and we would rather tell you that now than have you find out
mid-deadline. PRISM is for files that fit comfortably in browser memory.

**Full answer:**
A browser tab has a memory ceiling, and PRISM holds the parsed data in it. There is a real
limit, and we are deliberately not quoting a number yet because we have not benchmarked it
honestly. The size constant in the repository is currently inconsistent with its own
documentation, engineering is resolving that, and until a measured figure exists, publishing
one would be making it up.

What we will say:

- PRISM is built for the everyday analytical extract, the file that arrived by email or came
  out of a warehouse query, not for a warehouse-scale table.
- If your file exceeds what the tab can hold, the right answer is not PRISM. It is a sampled
  or filtered extract, a local Python environment, or a governed platform that was built for
  the volume. We will say this to your face rather than sell you a tool that will fall over.
- Performance is bounded by your own machine, which cuts both ways: a well-specified laptop
  goes further, and nothing we can do on our end changes your ceiling, because there is no
  our end.

**Commitment:** once the benchmark exists, publish it with the method, the machine and the
browser stated, and publish the point at which it degrades. A published ceiling is a trust
asset with this audience. A vague "handles large files" is the opposite.

### 6.5 "Our security team will still want to review it"

Good, and they should. Send them the CSP, the source, and the three verification steps.
The review is a different shape from a normal vendor assessment because there is no data
flow to assess and no processor to contract with. That does not mean no review, it means a
shorter one. We will answer any questionnaire, and we will answer "not yet" where that is
the true answer.

### 6.6 "You have an unpatched vulnerability in your dependencies"

**Only relevant until the SheetJS CDN migration ships. Until then, answer it truthfully and
never let someone else raise it first.**

Correct. xlsx@0.18.5 carries a HIGH severity prototype pollution advisory with no fix
published on npm. The remediation is migration to the SheetJS CDN distribution, our Content
Security Policy already whitelists that origin, and the work is in progress. We are not going
to tell you it does not matter. It matters, and for a product whose entire claim is security
posture it matters more than usual, which is why we are not running a security campaign until
it is closed.

### 6.7 "There are no tests and this looks early"

Also correct. There are zero tests in the repository today and a test suite is being built
now. We are not claiming the statistics are validated, and you will not find that word
anywhere in our material. What is proven right now is the architecture, which you can verify
in two minutes. Everything else has to be earned, and we would rather you hold us to that
than take our word for it.

### 6.8 "What is the business model? Are you going to start collecting data later?"

We cannot start collecting data without deleting the only thing that makes this product
worth using, and we would be doing it in public, in a page anyone can read the source of.
The commercial paths that remain open all avoid data custody: licensing, a distributable or
self-hostable build for firms that want to serve it internally, support, and paid
verification artifacts. We are pre-revenue and we are not going to invent a pricing page we
have not thought through.

### 6.9 "Is it open source?"

Right now the repository's own signals disagree with each other, and the engineering team is
resolving it. Until they have, the honest answer is: the source is readable, which is the
property that matters for verifying the privacy claim, and the licensing terms are being made
coherent. Do not answer this question with a guess, and do not describe PRISM as open source
until the LICENSE says so.

---

## 7. Language rules

**Words we use:** local, in your browser, in the tab, on your machine, no upload, verify,
check it yourself, browser-enforced, designed against, architected to, not yet, we have not
measured that.

**Words we do not use:**

| Banned | Why | Use instead |
|---|---|---|
| certified, compliant | No certification exists | designed against, architected to |
| AAA, WCAG conformant | Unverified | built with keyboard navigation, screen reader tables and sonification |
| military grade, bank grade, unhackable | Meaningless, and this audience mocks it | browser-enforced, verifiable |
| zero trust | Misused in the README, and this audience knows the term | no server, no upload |
| AI-powered insights | Overclaims what the code does: statistical flags, not a model | automated statistical flags, outlier and correlation detection |
| guaranteed, 100 percent, never | Absolutes we cannot defend at the endpoint layer | the architecture prevents, you can verify |
| seamless, effortless, revolutionary, game-changing | Empty, and it reads as marketing-led to a technical buyer | say the specific thing instead |
| enterprise-grade | Undefined and untrue at this maturity | early, and honest about it |

**Tone:** the register is a competent colleague explaining a mechanism, not a vendor selling
an outcome. Short sentences. Concrete nouns. Concede first. When we do not know, say so, and
say what would make us know. Our ICP's professional instinct is to look for the thing the
vendor is not saying. The strategy is to leave nothing there to find.

**Formatting rules:** no em dashes anywhere in PRISM copy, use a colon, a comma pair,
parentheses or a single hyphen. No fabricated numbers of any kind. Every figure is either a
cited public source with a URL or is labelled ASSUMPTION with the reasoning shown.
