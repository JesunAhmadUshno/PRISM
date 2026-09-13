# PRISM Content Plan

Owner: SEO
Last updated: 2026-09-13
Depends on: `SEO_STRATEGY.md` (intent and keyword map), `TECHNICAL_SEO.md` (the site must
exist first), `docs/business/marketing/POSITIONING.md` Section 0 (the claim ledger),
`docs/business/brand/VOICE.md` (register and banned words).

---

## 0. The governing constraint: one author, and the wrong kind of scarcity

Most content plans are limited by budget. This one is limited by something narrower.

`docs/business/finance/UNIT_ECONOMICS.md` puts the founder's commercial capacity at 630
hours per year, and every one of those hours is contested by sales, engineering and
support. Writing competes with shipping the `xlsx` fix.

More importantly, **the content that works here cannot be delegated.** The entire premise
of this plan is that the author has done ISO 27001 audit work in banking and healthcare,
and has applied DMAIC to security processes. A contractor cannot write that. An AI cannot
write that. A second engineer cannot write that. The supply of articles that will actually
move this business is capped at whatever one specific person can write.

So this plan is deliberately small. **Eight articles over twelve months.** Not forty. Each
one is long, sourced, and the kind of thing a professional bookmarks. If the choice is
between eight good pieces and twenty-four adequate ones, take the eight, because the
audience is auditors and auditors can smell filler.

### 0.1 The one thing that must not happen

The founder writes content that is generically about data analytics. "10 Excel tips for
finance teams". "What is a p-value". This content is infinitely supplied, ranks nowhere for
a new domain, converts nobody, and costs the only scarce resource the company has.

**Test before writing anything: could a competent freelancer with a search engine write
this?** If yes, do not write it. That test eliminates roughly ninety percent of what a
content calendar would otherwise contain, and it is the most valuable line in this file.

---

## 1. Where the authority actually is, and where it is not

Honest inventory, because a content plan built on overstated authority collapses at the
first informed reader.

### 1.1 Genuine authority

| Domain | Basis | Can write with authority? |
|---|---|---|
| ISO/IEC 27001 audit practice | Ran engagements at KPMG IT Advisory, in banking and healthcare | **Yes.** This is lived practice, not reading. |
| How assurance professionals evaluate a vendor | Was the person doing the evaluating | **Yes.** The rarest asset here. |
| DMAIC applied to security and control processes | Practitioner application, and the published literature is thin (Section 1.3) | **Yes**, and the gap is real. |
| Evidence, sampling and control testing | Audit fieldwork | **Yes**, with standards cited rather than paraphrased. |
| Data analytics method | MSc in Data Analytics, two peer-reviewed papers | **Yes**, for method. See 1.2 for the limit. |
| Building this specific architecture | Built it | **Yes**, and it is interesting to developers. |

### 1.2 Where authority stops

- **PRISM's statistical correctness.** Zero tests today, and three known defects recorded
  in `TECHNICAL_STRATEGY.md` (independent_t silently comparing only the first two groups,
  paired_t pairing by row position, shapiro_wilk silently subsampling). The founder can
  write with authority about statistical *method*. He cannot yet write that PRISM
  implements it correctly. No article claims otherwise.
- **Legal interpretation of HIPAA, GDPR, PHIPA or PIPEDA.** Auditing against a standard is
  not practising law. Every regulatory article carries an explicit line saying so.
- **Accessibility compliance.** The README's WCAG 2.2 AAA claim has nothing behind it and
  `docs/design/ui/DESIGN_SYSTEM.md` found the focus indicator failing 3:1 on light
  surfaces. No accessibility article until that is fixed and, ideally, audited. When it
  happens, "here is what we found when we measured our own contrast" is a genuinely good
  article and an honest one.
- **Any market sizing or industry trend.** Not the founder's field, infinitely supplied,
  and `docs/business/market/COMPETITIVE_LANDSCAPE.md` already established that no credible
  primary source for browser-analytics market size was found.

### 1.3 Why the DMAIC angle is the strongest card

A search for Six Sigma applied to information security management returns a small set of
academic papers and almost no practitioner writing. Examples found on 2026-09-13:

- "Application of Six Sigma Tools for Improvement of Information Security Management
  System", ResearchGate:
  https://www.researchgate.net/publication/351607267_Application_of_Six_Sigma_Tools_for_Improvement_of_Information_Security_Management_System
- "Refinement of Strategy and Technology Domains STOPE View on ISO 27001", arXiv:
  https://arxiv.org/pdf/1204.1385

The structural observation the literature keeps making, that DMAIC and the ISMS
Plan-Do-Check-Act cycle are the same shape, is correct but is where the papers stop. Nobody
appears to have written the practitioner version: what you actually measure, what the
control chart looks like when the process is "access reviews completed", and what happens
when the measurement says the control is theatre.

That is a genuinely underserved query with genuinely scarce supply, and the founder is one
of a small number of people who can supply it. It is Article 1.

---

## 2. Rules that apply to every article

1. **Every claim about PRISM is checked against the POSITIONING 0.2 forbidden list before
   publishing.** No exceptions, including for drafts shown to anyone.
2. **Every regulation is linked to its primary source**, not to a vendor blog summarising
   it. If the primary source cannot be found, the claim comes out.
3. **Every number is cited or labelled ASSUMPTION with the reasoning shown.** No industry
   statistics repeated from memory. This is a rule for an audience that checks.
4. **No client names, engagement details, or anything identifiable from KPMG work.** Ever.
   This is a professional obligation that outranks the marketing value, and violating it
   would destroy the exact credibility the plan is built on.
5. **No implication of KPMG endorsement.** "Formerly IT Advisory at KPMG" is a biographical
   fact. Anything warmer is false.
6. **Product mention is the last section, or a single line, never the thesis.** An article
   that argues its way to "and therefore buy our thing" is an ad, and this audience
   discounts ads to zero. The correct ending is the honest one: here is how to think about
   the problem, and here is the thing I built, which addresses a narrow slice of it.
7. **Write the limitations before a critic does.** House style, per `VOICE.md`.
8. **No em dash characters.** `grep -P '\x{2014}'` must return nothing.
9. **Byline, date, and a visible update date.** For an authority play, provenance is part
   of the argument.
10. **No article publishes before the LAUNCH_PLAN gates are green**, first among them the
    `xlsx@0.18.5` advisory.

---

## 3. The articles

Eight, ordered. Each entry gives the working title, the intent it serves, the thesis, why
only this author can write it, the outline, the sources to cite, and the claim ceiling.

Word counts are targets, not quotas. An article that makes its case in 1,400 words should
not be padded to 2,500.

---

### Article 1. DMAIC is the ISMS improvement loop that ISO 27001 does not give you

- **Tier / intent:** Tier 2, I-4 (compliance and methodology research).
- **Targets:** "dmaic applied to information security", "six sigma iso 27001",
  "iso 27001 continual improvement in practice", "how to measure security control
  effectiveness".
- **Length:** 2,500 to 3,500 words.
- **Thesis:** ISO 27001 requires continual improvement (Clause 10) but does not tell you how
  to know whether a control is actually working. DMAIC does, because it forces you to define
  the defect before you measure. Most security metrics programmes fail at Define, not at
  Measure: they count activity ("patches applied") instead of defining the defect ("a
  system remained exposed past its remediation window"), and then the dashboard is green
  while the risk is unchanged.
- **Why only this author:** he has sat on the audit side of exactly this conversation, in
  regulated industries, and has watched a metrics programme measure the wrong thing.
- **Outline:**
  1. The gap: the standard says improve, the standard does not say how to know.
  2. Why DMAIC and PDCA are the same shape, and what the academic literature has already
     observed (cite, briefly, and move past it, because this is where the papers stop).
  3. Define: the hardest phase. Choosing a defect definition for a security control. Three
     worked examples: access review completion, patch remediation, phishing simulation.
  4. Measure: what data actually exists in a typical ISMS, what is missing, and what
     measuring the wrong thing looks like.
  5. Analyze: variation versus special cause in a control process. Why "one bad month"
     usually is not a special cause and what you need before you can say it is.
  6. Improve and Control: the control chart as ISMS evidence, and what an auditor would
     actually accept as evidence of a working improvement loop.
  7. The uncomfortable result: sometimes the honest measurement shows the control is
     theatre, and what to do then.
  8. What this has to do with a browser analytics tool: one honest paragraph, no more.
- **Sources:** ISO/IEC 27001:2022 (referenced by clause, never quoted at length, since the
  standard is copyrighted), the ResearchGate and arXiv papers in 1.3, and any published
  ASQ or ISACA guidance actually read before citing.
- **Claim ceiling:** No PRISM compliance claim of any kind. The founder's KPMG background is
  a biographical line in the byline, not an argument in the body.
- **Distribution:** IIA and ISACA chapter mailing lists, LinkedIn, and the professional
  rooms in LAUNCH_PLAN. Not Hacker News; wrong audience.

---

### Article 2. What actually happens when an auditor reviews your web tool

- **Tier / intent:** Tier 2, I-4 crossing into I-1.
- **Targets:** "vendor risk assessment for a browser based tool", "how auditors evaluate
  saas data handling", "security review web application checklist".
- **Length:** 2,000 to 3,000 words.
- **Thesis:** Most engineers think a vendor security review is a questionnaire. It is not.
  It is an evidence-gathering exercise with a specific structure, and knowing that structure
  changes what you build. The reviewer is asking one question in many forms: where does the
  data go, and who can I hold responsible when it goes wrong.
- **Why only this author:** he was the reviewer.
- **Outline:**
  1. What the reviewer is actually trying to establish, and why it is almost never the
     thing the questionnaire literally asks.
  2. The evidence hierarchy: an assertion, a document, a configuration, a test result. What
     each is worth.
  3. Why "we take security seriously" is a negative signal.
  4. The data flow diagram, and why almost every vendor's is wrong.
  5. Subprocessors: the question nobody answers well.
  6. The architectural shortcut: what happens to this review when there is no data flow at
     all. This is the whole PRISM argument, arrived at honestly rather than asserted.
  7. What still gets reviewed even then: supply chain, the browser, the endpoint, the
     people. Including PRISM's own open items.
- **Sources:** Any standard questionnaire actually read (CAIQ, SIG) linked to its publisher.
  No paraphrasing from memory.
- **Claim ceiling:** Section 6 is where PRISM enters. It must include Section 7, and Section
  7 must name the `xlsx` advisory if it is still open on the publication date.
- **Note:** This article and `/security/questionnaire` (SEO_STRATEGY 5.2) are the same
  research. Write them together.

---

### Article 3. Can you put client data in an online tool? A practitioner's decision tree

- **Tier / intent:** Tier 1, I-1. **This is the highest commercial-intent piece on the list.**
- **Targets:** "can i upload client data to an online tool", "is it ok to upload client
  data to chatgpt", "confidentiality online tools accountants".
- **Length:** 1,800 to 2,500 words.
- **Thesis:** The question has a real answer and it is not "no". It is a decision tree with
  about six nodes, and most professionals have never seen it written down, so they either
  freeze or they paste the data in anyway.
- **Why only this author:** the tree is the one an auditor actually applies.
- **Outline:**
  1. The honest framing of the problem: the file exists, the deadline exists, the
     prohibition exists.
  2. Node 1: does the data identify a client, a patient or a person?
  3. Node 2: does your engagement letter permit third-party processors, and have you read
     it? Most have not.
  4. Node 3: is there an agreement in place with confidentiality and non-training terms?
     Why a training opt-out checkbox is not an agreement.
  5. Node 4: can it be de-identified, and what de-identification actually requires. This is
     where most people are wrong: removing the name column is not de-identification.
  6. Node 5: is there a path that involves no third party at all?
  7. The honest conclusion, including the cases where uploading is completely fine.
- **Sources:** The QuickRead practitioner guidance
  (https://quickreadbuzz.com/2026/07/22/colin-brown-ai-confidentiality-what-you-can-and-cant-upload/),
  and the relevant professional body's confidentiality rule for whichever jurisdiction the
  article addresses, linked directly.
- **Claim ceiling:** Node 6 names PRISM as one option among several, alongside a local
  desktop tool and the client's own environment. If it reads as though the tree was
  reverse-engineered to reach PRISM, it has failed. The de-identification and agreement
  paths must be given honest weight.
- **Required line:** not legal advice, and the professional's own obligations govern.

---

### Article 4. Our Content Security Policy did not cover the part of the app that holds the data

- **Tier / intent:** Tier 3, I-3. Link bait, and the Hacker News beat.
- **Targets:** "does a web worker inherit the page content security policy", "csp meta tag
  web worker", "csp default-src none real application".
- **Length:** 1,500 to 2,200 words.
- **Thesis:** A dedicated Web Worker takes its CSP from the HTTP response headers of its own
  script, not from the parent document's `<meta>` tag. If you deliver your policy by meta
  tag on a static host that cannot set headers, the worker runs under no policy. We shipped
  that, and the worker is where all of the data actually lives.
- **Gate status: SATISFIED.** The fix landed during the writing of this plan. The worker is
  now created from a `blob:` URL, which is a local scheme and therefore inherits the
  creating document's policy container (`src/stores/prismStore.ts`, with a test asserting
  it). The article can be written now, and it can be written with an ending.
- **Why only this author:** he found it in his own product and is willing to publish it.
- **Outline:**
  1. The architecture and the guarantee we make.
  2. The CSP, quoted in full from `index.html`, and what each directive is doing.
  3. The assumption: that the worker inherits it.
  4. The discovery, and the specific evidence (the CDN `importScripts` call that should have
     been blocked and was not).
  5. The spec text and why the behaviour is correct, and arguably obvious in hindsight.
  6. Why it did not make the product unsafe, stated carefully and without minimising: there
     are no network primitives in the source, so the property held, but it was held by code
     review and not by the browser. That distinction is the whole point of the article.
  7. The fix we actually shipped: create the worker from a `blob:` URL, because `blob:` is
     a local scheme and a worker created from one inherits the creating document's policy
     container. Include the test that asserts it, because a security property without a
     regression test is a property you will lose again.
  8. The related hardening: pinned SHA-384 digests for every Pyodide artifact the worker
     executes, and why `importScripts` cannot carry an integrity attribute, which is the
     reason that code looks the way it does.
  9. The fix we did not ship: a host that sets real response headers, which is still worth
     doing because it unlocks COOP/COEP, the precondition for `SharedArrayBuffer` and
     therefore for threaded Pyodide.
  10. What to check in your own app.
- **Sources:** The relevant HTML and CSP specification sections, linked. MDN. The GitHub
  community discussion confirming GitHub Pages cannot set custom response headers
  (https://github.com/orgs/community/discussions/84963).
- **Claim ceiling:** **Publish only after the fix is deployed**, and describe the fix.
  Publishing a live hole in your own security boundary is not transparency, it is
  negligence.
- **Distribution:** Hacker News, Lobste.rs, LinkedIn. This one earns links.

---

### Article 5. How to verify a web app is not sending your data anywhere

- **Tier / intent:** Tier 1, I-1 crossing into I-3.
- **Targets:** "how to check if a website uploads my file", "verify a web app does not send
  data", "is this online tool safe to use with my data".
- **Length:** 1,500 to 2,000 words.
- **Thesis:** You do not have to trust the claim. Four checks, in ascending order of effort,
  that anyone can run. And here is what each check cannot tell you.
- **Why only this author:** anybody could technically write this, which breaks the test in
  0.1. It survives anyway because of the second half: the honest limits section, which the
  free tool sites will not write because it costs them something.
- **Outline:**
  1. Check 1: the network panel, with a screenshot, including how to spot a beacon fired on
     unload, which is the check most people miss.
  2. Check 2: disconnect the network and see whether it still works. The strongest check and
     the least used.
  3. Check 3: read the Content Security Policy, with a plain reading of the directives.
  4. Check 4: read the source, if it is available, and the four tokens to grep for.
  5. What none of these prove: a malicious extension, a compromised endpoint, a future
     version of the same site, a service worker caching for later transmission.
  6. Applying all four to PRISM, including where PRISM currently fails to make it easy.
- **Claim ceiling:** This is the article version of `/verify`. It must include Section 5 at
  full strength. An article about verification that is not itself verifiable is worthless.

---

### Article 6. Statistical sampling for control testing, and the part everyone gets wrong

- **Tier / intent:** Tier 2, I-4.
- **Targets:** "statistical sampling for control testing", "sample size for sox 404
  testing", "attribute sampling internal audit".
- **Length:** 2,000 to 2,800 words.
- **Thesis:** Audit sampling is applied statistics that is frequently performed without the
  statistics. The specific failure: sample sizes taken from a firm table without reference
  to the population, the tolerable deviation rate, or what the resulting confidence actually
  is, so the conclusion is stated with a precision the sample cannot support.
- **Why only this author:** the intersection of audit fieldwork and an MSc in Data Analytics
  is exactly this article, and it is a rare intersection.
- **Outline:**
  1. What a control test is trying to conclude, stated as a statistical claim.
  2. Attribute sampling: the three inputs, and which one people guess.
  3. Where the firm's sample size table comes from and what it assumes.
  4. The failure mode: a clean sample of 25 and what it actually licenses you to say.
  5. Population completeness, which is the real problem and is not a sampling problem.
  6. What changes when the population is a spreadsheet the auditor can test in full.
- **Sources:** PCAOB AS 2315 on audit sampling and AS 1215 on documentation, linked to
  pcaobus.org directly. Any textbook cited by edition.
- **Claim ceiling:** Section 6 is the PRISM-adjacent point and it must **not** claim PRISM's
  statistics are validated. Given the three known defects in `TECHNICAL_STRATEGY.md`, this
  article is **gated until those are fixed and covered by tests.** An audit-sampling article
  from a vendor whose t-test silently compares only the first two groups is an unacceptable
  risk.

---

### Article 7. The cost of building analytics that cannot phone home

- **Tier / intent:** Tier 3, I-3. Founder and builder audience.
- **Targets:** "client side only analytics architecture", "building software with no
  backend", "local first software trade-offs".
- **Length:** 2,000 to 2,500 words.
- **Thesis:** The architecture that makes the privacy claim true also takes away seven
  things you would normally have, permanently, and most of them are not obvious until you
  have shipped. This is the honest version of a decision that usually gets marketed as
  pure upside.
- **Why only this author:** `docs/business/technical/ARCHITECTURE_DECISIONS.md` already
  contains eleven things the architecture can never do, each mapped to the decision that
  causes it. That table is the article, and almost nobody publishes that table.
- **Outline:**
  1. The decision and the guarantee it buys.
  2. No telemetry, therefore no product analytics, therefore permanently degraded product
     judgement. The one that hurts most.
  3. No crash reporting.
  4. No server-side scheduling, no collaboration, no cross-device continuity.
  5. No runtime licence enforcement, and what that does to a business model (offline signed
     keys, or a paid self-hosted build, and why you pick one).
  6. Memory as a hard ceiling, and the copy pipeline that makes it worse.
  7. What it buys, and the honest assessment of whether that is a durable moat. It is not:
     `DIFFERENTIATION.md` grades it THIN and that assessment belongs in the article.
- **Claim ceiling:** No performance numbers. Cold start and row ceilings are UNMEASURED per
  `SCALING_LIMITS.md`. Publish the measurement protocol instead, which is a more useful
  artifact than a benchmark anyway.

---

### Article 8. Data-driven, undecided: a reserved slot

- **Tier / intent:** Determined by evidence, not by this document.
- **Thesis:** By the time Articles 1 through 7 are published, Search Console will show which
  queries are producing impressions. Article 8 is written against that data.
- **Why it is reserved:** the honest thing for a plan with no traffic data to do is to stop
  guessing after seven and let the eighth be chosen by measurement. A twelve-month calendar
  written today with twelve specified titles would be twelve guesses wearing the costume of
  a plan.
- **Rule:** do not fill this slot before Checkpoint 2 in `SEO_STRATEGY.md` 6.2.

---

## 4. Sequence and cadence

| Slot | Article | Gate |
|---|---|---|
| Month 1 | 1. DMAIC and the ISMS loop | Site live. No product gate: this article does not depend on PRISM being anything. |
| Month 2 | 2. What actually happens in a vendor security review | Published with `/security/questionnaire`. |
| Month 3 | 3. Can you put client data in an online tool | LAUNCH_PLAN gates green. |
| Month 4 | 5. How to verify a web app is not sending your data | `/verify` page live first. |
| Month 6 | 4. The worker CSP article | Gate SATISFIED (fix shipped). Could be pulled earlier if a Hacker News beat is wanted sooner. |
| Month 8 | 7. The cost of analytics that cannot phone home | None. |
| Month 10 | 6. Statistical sampling for control testing | **Hard gate: the three statistical defects fixed and tested.** |
| Month 12 | 8. Reserved | Chosen from Search Console data. |

Note that Article 1 leads, and it is the one with the least to do with the product. That is
deliberate. It establishes the author before the author makes a claim, which is the only
sequence that works when the claim is "trust the architecture, here is the person who built
it".

Gaps between articles are intentional. An eight-week gap that produces a piece an ISACA
chapter will circulate beats four weekly posts that nobody finishes.

---

## 5. What is deliberately not on this plan

Recorded so these get rejected quickly when they are proposed, which they will be.

| Not doing | Why |
|---|---|
| Statistical method tutorials ("how to run a t-test") | Enormous volume, enormous supply, and we would be ranking a tutorial next to a tool whose t-test has a known defect. The worst risk-reward on the list. |
| Excel tips and tricks | Fails the 0.1 test on the first read. |
| "Top 10 data analysis tools" listicles | Would rank, would attract the anti-ICP, and writing a listicle that puts your own product on it is the genre this audience trusts least. |
| Anything with "AI-powered" in it | Banned by `VOICE.md`. The product's insight generation is rule-based, and calling it AI would be the kind of small lie that makes every other claim suspect. |
| Accessibility thought leadership | Gated on 1.2. Becomes available, and genuinely good, once the contrast failures in `DESIGN_SYSTEM.md` are fixed and the article can be "what we found when we measured ourselves". |
| Market size and industry trend pieces | Not the founder's field, and no credible primary source exists per `COMPETITIVE_LANDSCAPE.md`. |
| A weekly newsletter | Requires an email list, which requires a signup form, which requires a backend or a third party, which is a CSP and positioning problem. If it is ever wanted, that trade must be made explicitly. |
| Guest posts on SEO-driven blogs | Wrong audience, and link schemes are a Google Search Essentials violation. Chapter talks and professional publications instead. |
| Case studies | There are no customers. Writing one would be fabrication. |

---

## 6. Production checklist, per article

- [ ] Passes the 0.1 test: a freelancer with a search engine could not have written this.
- [ ] Every claim about PRISM checked against POSITIONING 0.2.
- [ ] Every regulation linked to its primary source.
- [ ] Every number cited or labelled ASSUMPTION with reasoning shown.
- [ ] No client, engagement or employer-confidential detail.
- [ ] No implied KPMG endorsement.
- [ ] Limitations section present and written at full strength.
- [ ] Product mention confined to one section, at the end.
- [ ] Legal-advice disclaimer present on any article naming a regulation.
- [ ] Zero em dash characters.
- [ ] Unique `<title>` and meta description per TECHNICAL_SEO Section 4.
- [ ] Self-referencing canonical, added to `sitemap.xml` with a truthful `lastmod`.
- [ ] Byline, publication date, and update date visible on the page.
- [ ] Internal links to the relevant hub page (`/verify`, `/security`, or home).
- [ ] Readable with JavaScript disabled.
- [ ] Any hard gate in Section 4 confirmed green.

---

## 7. Open items

1. **Article 6 is still hard-gated on engineering work** (the three statistical defects).
   Article 4's gate was satisfied mid-session. If the Article 6 fix slips, that slot slips.
   Do not publish it early.
2. **No email capture mechanism exists and none is planned** (Section 5). That means an
   article that persuades someone has no way to keep them, other than a bookmark. This is a
   real gap created by a deliberate architectural choice, and it should be decided on
   purpose rather than discovered in month four.
3. **Nobody has been identified to review the compliance articles.** Rule 2 in Section 2
   needs a second reader who will push back on a drifting claim. The founder cannot be his
   own reviewer on the one class of claim that carries professional risk.
4. **Article 1 needs a decision on how much of ISO/IEC 27001:2022 can be quoted.** The
   standard is copyrighted. Reference by clause number and paraphrase, and confirm that
   approach before drafting rather than after.
