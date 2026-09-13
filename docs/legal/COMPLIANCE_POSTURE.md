# PRISM Compliance Posture

> ## NOTICE: READ BEFORE USING THIS DOCUMENT
>
> **This is a non-binding assessment prepared by an AI system. It is not legal
> advice, it is not a compliance opinion, it is not an audit, and it does not
> create a lawyer-client relationship. A qualified lawyer in the relevant
> jurisdiction, and where indicated a qualified auditor or accessibility
> specialist, must review it before any statement in it is published or relied
> on.**
>
> Nothing in this document certifies, attests to, or accredits anything. Where it
> says a claim is "available," it means the wording appears defensible on the
> facts checked, not that a professional has signed it.
>
> Document status: v0.1
> Prepared: 2026-09-13
> Verified against: repository at `C:/Users/Jesun/PRISM`, branch `army/prism-upgrade`
> Author: AI. Reviewing lawyer: **NOT YET ASSIGNED**

---

## 1. Summary for the founder, in one page

PRISM currently publishes a compliance table in `README.md` that asserts, each with
a green check mark:

| Standard as stated in README | Requirement as stated | Status as stated |
| --- | --- | --- |
| ISO/IEC 40500:2025 | WCAG 2.2 AAA | Compliant |
| EN 301 549 | EU Accessibility | Compliant |
| ISO/IEC 27001:2022 | Information Security | Compliant |
| GDPR Article 32 | Data Security | Compliant |
| PIPEDA | Canadian Privacy | Compliant |
| OWASP Top 10 | Web Security | Mitigated |

Six rows. **Not one of them is currently supportable as written.** Two of them are
not the kind of thing a product can be, at all, regardless of how good the product
is. One of them is contradicted by measurements taken from this repository's own
design work.

This is the most serious legal exposure in the project, and it is more serious than
the unpatched dependency, because it is a set of affirmative public
representations rather than an omission.

The exposure has a specific shape worth naming. PRISM's intended buyers are
auditors, healthcare compliance functions and legal teams. Those are precisely the
people who know what an ISO 27001 certificate looks like, know that certificates
attach to organisations and not to software, and will ask for the certificate
number. The claim does not merely fail to help with that audience. It actively
destroys credibility with them, and it does so at the exact moment the buyer was
about to be impressed by something that is genuinely true. The founder's own
background conducting ISO 27001 audits makes this worse rather than better: a
reviewer who learns that background and then sees an unbacked certification badge
will not read it as carelessness.

**The good news is the substantive point of this document.** Strip the six
unsupportable claims out, and what remains is an unusually strong and genuinely
unusual compliance story, because PRISM's architecture makes several
data-protection questions disappear rather than answering them. Section 8 sets out
the wording that is available today. It is shorter than the current table and far
more persuasive to the audience that matters.

**Recommended action, in order:**

1. Delete the compliance table from `README.md` and the WCAG badge from the
   README header. Do this first and do it before any launch activity.
2. Replace with the accurate language in Section 8.
3. Do not publish the privacy policy until step 1 is done. See
   `docs/legal/PRIVACY_POLICY.draft.md`, Open Item 5.
4. Work the remediation path in Section 9 in the order given.

---

## 2. How to read the claim ledger

Every claim below is graded on one axis only: **can we defend this sentence to a
hostile, competent reviewer today, using evidence we already have?**

| Grade | Meaning |
| --- | --- |
| **GREEN** | Defensible now. Evidence exists and is re-checkable by a third party. |
| **AMBER** | True in substance but currently unprovable, or true only with wording changes. Usable with the precise phrasing given. |
| **RED** | Not claimable. Publishing it is a misrepresentation risk. |

A note on the difference between three words that are used interchangeably in
marketing and are not interchangeable anywhere else:

- **Compliant** asserts that a set of requirements is met. Self-assessable for
  some standards, not for others.
- **Certified** asserts that an accredited third party audited and issued a
  certificate. Never self-assessable. Using it without a certificate is the most
  dangerous of the three.
- **Designed against** or **architected toward** asserts an intention and a design
  input. Always available, provided it is true, and it is true here.

PRISM may use the third freely. It may use the first only where this document says
so. It may not currently use the second at all, anywhere, for anything.

---

## 3. ISO/IEC 27001:2022

**Current claim: "Security (ISO/IEC 27001:2022 Compliant)" and a table row reading
"Compliant."**

**Grade: RED. Remove immediately.**

### 3.1 Why this is not a close call

ISO/IEC 27001 is a management system standard. It specifies requirements for
establishing, implementing, maintaining and continually improving an **Information
Security Management System**. Its subject is an organisation, not a piece of
software.

There is no such thing as ISO 27001 compliant software. A product cannot hold the
certificate any more than a spreadsheet can hold a driving licence. The sentence is
not an overstatement of a partial truth; it is a category error, and it is the
specific category error that tells a security reviewer that whoever wrote it has
not been through the process.

### 3.2 What certification would actually require

For PRISM's operating entity, not for PRISM:

1. **Define the ISMS scope.** Which entity, which locations, which people, which
   systems. For a one-person company the scope is small, which makes this cheaper
   than it sounds, not impossible.
2. **Leadership, policy and objectives.** A documented information security policy,
   assigned responsibilities, and measurable objectives.
3. **Risk assessment and risk treatment.** A repeatable methodology, applied, with
   results documented, and a risk treatment plan.
4. **Statement of Applicability.** A document addressing each control in Annex A of
   the 2022 edition (93 controls, grouped into organisational, people, physical and
   technological themes), recording whether it applies, the justification, and its
   implementation status. Controls may be excluded; the exclusion must be
   justified. Source: https://www.iso.org/standard/27001
5. **Operate the ISMS and generate records.** Certification audits examine evidence
   of operation over a period. There is no way to produce that retrospectively.
6. **Internal audit and management review.** Both must have actually happened.
7. **Stage 1 audit** (documentation and readiness) and **Stage 2 audit**
   (implementation effectiveness) by a certification body accredited by a member of
   the International Accreditation Forum. Choosing an unaccredited body produces a
   certificate that sophisticated buyers reject.
8. **Surveillance audits** annually and **recertification** on a three-year cycle.

Cost and elapsed time are real and should be budgeted as a commercial decision, not
assumed. This document deliberately quotes no figure, because a fabricated cost
estimate would be the same error as a fabricated certificate. Obtain quotes from
accredited bodies.

### 3.3 What is actually true, and it is not nothing

The following statements about PRISM's security design were verified directly
against the repository on 2026-09-13 and are defensible:

- The application enforces a restrictive Content Security Policy with
  `default-src 'none'`, `object-src 'none'`, `frame-src 'none'`, `form-action
  'none'`, and a `connect-src` allowlist containing only the application's own
  origin and the Pyodide distribution path.
- The Web Worker that holds user data is constructed from a `blob:` URL
  (`src/stores/prismStore.ts:178`), which causes it to inherit the document's
  policy container. This is the non-obvious step that makes the CSP actually bind
  to the thread holding the data, rather than leaving the worker unpoliced. It is
  good security engineering and is worth describing in a whitepaper.
- The WebAssembly runtime is loaded only against pinned SHA-384 digests recorded in
  the application's own source, with a guard that refuses any undigested file from
  that origin (`src/workers/prism.worker.js`).
- `src/` contains no `XMLHttpRequest`, `WebSocket`, `sendBeacon` or `EventSource`,
  and no analytics or error-reporting SDK.
- File input is validated by extension, declared MIME type and magic bytes before
  parsing (`src/security/validator.ts`).
- Output is sanitised through DOMPurify (`src/security/sanitizer.ts`).

### 3.4 Available wording

> "PRISM's security architecture is designed against the control objectives of
> ISO/IEC 27001:2022 Annex A. PRISM is not ISO 27001 certified, and no
> certification is claimed. Our architecture and the reasoning behind it are
> documented and independently verifiable."

That sentence does three things the current claim does not: it is true, it signals
that the author knows what the standard is, and the second sentence buys
credibility for everything else on the page.

---

## 4. WCAG 2.2 Level AAA and ISO/IEC 40500:2025

**Current claim: a README badge reading "WCAG 2.2 AAA", a section headed
"Accessibility (WCAG 2.2 Level AAA)", and a table row citing ISO/IEC 40500:2025
as "Compliant."**

**Grade: RED. Remove immediately. This is the claim most likely to be tested,
because accessibility is trivially testable by anyone.**

### 4.1 One point of fairness to the README

The standard reference is correct. ISO/IEC 40500:2025 does exist: WCAG 2.2 was
approved as an ISO/IEC International Standard in October 2025
(https://www.w3.org/WAI/news/2025-10-21/wcag22-iso). The problem is not the
citation. The problem is the word "Compliant" next to it.

### 4.2 Why AAA in particular cannot be claimed

The W3C's own conformance guidance states:

> "It is not recommended that Level AAA conformance be required as a general policy
> for entire sites because it is not possible to satisfy all Level AAA success
> criteria for some content."
>
> Source: https://www.w3.org/WAI/WCAG22/Understanding/conformance

Claiming AAA therefore signals to any accessibility professional that the claim was
not made by an accessibility professional. It is the accessibility equivalent of
the ISO 27001 row.

AAA conformance requires satisfying **all** Level A, AA **and** AAA success
criteria. Several AAA criteria are demanding in ways that are unrelated to code
quality and cannot be quietly satisfied, including 1.4.6 Contrast (Enhanced), which
requires a 7:1 ratio for normal text; 1.4.8 Visual Presentation; 2.4.9 Link Purpose
(Link Only); 2.5.5 Target Size (Enhanced); 3.1.5 Reading Level; and 3.3.6 Error
Prevention (All). A tool whose primary output is dense numeric tables and charts
has real work to do on several of these.

Two further conformance requirements bite hard:

> "Conformance (and conformance level) is for full web page(s) only, and cannot be
> achieved if part of a web page is excluded."

> "When a web page is one of a series of web pages presenting a process ... all web
> pages in the process conform at the specified level or better."

PRISM's charts are a part of its pages, and its upload-to-result sequence is a
process. Both requirements apply.

### 4.3 The claim is contradicted by this project's own measurements

This is the part that makes the claim untenable rather than merely unproven. The
design work in `docs/design/ui/` measured the shipped palette directly and found,
among other results:

- the focus indicator fails the 3:1 requirement of **1.4.11 Non-text Contrast** on
  every light surface it lands on, and measures 1.00:1 against the active tab,
  because the ring colour and the tab fill are the same colour. A keyboard user
  focusing the selected tab sees no focus indicator at all. That also engages
  **2.4.13 Focus Appearance**.
- four of the eight colours in the chart palette commented in the source as
  "selected for colorblind users" fall below 3:1.

**Those are Level AA failures.** The product is currently claiming AAA while
failing AA on measurable, reproducible grounds documented inside its own
repository. If a reviewer finds the claim and the measurement in the same
repository, the inference available to them is not carelessness.

### 4.4 What the existing accessibility testing does and does not establish

PRISM does have automated accessibility tests, and they are worth having: a
dedicated `npm run test:a11y` suite (`vitest.a11y.config.ts`) runs axe-core against
rendered components. As of this commit it comprises 12 tests across 2 of the 5
components in `src/components/`, executing in jsdom.

What that establishes: those two components, rendered in those states, in a
simulated DOM, produce no violation of the axe rules configured.

What it does not establish, and must never be described as establishing:

- **Coverage of the standard.** Automated rules detect only a subset of WCAG
  success criteria. W3C is explicit that "testing the success criteria would
  involve a combination of automated testing and human evaluation."
- **Coverage of the product.** Three of five components are untested.
- **Real assistive technology behaviour.** jsdom is not a browser and does not run
  a screen reader. Claims about NVDA and VoiceOver compatibility, which the README
  currently makes, require testing with NVDA and VoiceOver.
- **Rendered contrast.** Contrast cannot be evaluated in jsdom, which is precisely
  why the failures in Section 4.3 were not caught by this suite.

The suite is a genuine asset and should be expanded. It is not a conformance
claim, and it should never be cited as one.

### 4.5 What conformance would actually require

1. Fix the measured AA failures first. Contrast is cheap to fix and is the fastest
   path from "claim is false" to "claim is true."
2. Test with real assistive technology in real browsers. At minimum NVDA on
   Windows and VoiceOver on macOS and iOS, by someone competent with them.
3. Evaluate against every applicable success criterion at the target level, over
   full pages and complete processes, not component by component.
4. Produce an **Accessibility Conformance Report** using the Voluntary Product
   Accessibility Template. This is the artifact procurement asks for, and it is the
   commercially useful output. An honest ACR that records "partially supports"
   against some criteria with explanatory remarks is a normal, respected document.
   A perfect ACR is a suspicious document.
5. For the European market, note that EN 301 549 is the relevant harmonised
   standard and the currently cited version, v3.2.1 (2021), references WCAG 2.1
   Level AA, not AAA. A later version referencing WCAG 2.2 is anticipated but the
   cited reference governs until the European Commission cites it in the Official
   Journal. The European Accessibility Act became enforceable on 28 June 2025.
   Counsel should determine whether the Act applies to PRISM at all, which depends
   on whether PRISM is offered to consumers in the EU and on the
   microenterprise provisions.

### 4.6 Available wording

> "PRISM is designed and built against WCAG 2.2. We target Level AA conformance.
> We do not claim Level AAA, and we do not claim conformance we have not measured.
> Our current automated accessibility test suite, known gaps, and remediation plan
> are published."

And, once the AA defects are fixed and an ACR exists:

> "PRISM's Accessibility Conformance Report, covering WCAG 2.2 Level AA, is
> available at [URL]. It records where we partially support a criterion and why."

Aiming at AA and publishing an honest report beats claiming AAA, by a wide margin,
with every buyer who can tell the difference. Those are the buyers PRISM wants.

---

## 5. EN 301 549

**Current claim: "EU Accessibility ... Compliant."**

**Grade: RED.** EN 301 549 conformance is assessed against WCAG at the level the
cited version references, plus additional non-web ICT requirements. It inherits
every problem in Section 4. It cannot be claimed while measured AA failures exist,
and it should not be claimed thereafter without an evaluation against the standard
itself.

**Available wording:** none yet, beyond "we are working toward WCAG 2.2 Level AA,
which is the basis of EN 301 549." Do not use the standard's number as a badge.

---

## 6. GDPR Article 32, PIPEDA, and the privacy claims

**Current claims: "GDPR Article 32 | Data Security | Compliant" and "PIPEDA |
Canadian Privacy | Compliant."**

**Grade: AMBER, and only with rewording. The underlying position is strong; the
framing is wrong.**

### 6.1 Why the framing is wrong

Neither GDPR nor PIPEDA issues certificates, and neither is a thing a product can
be compliant with in the abstract. Compliance is a property of a controller's or
organisation's processing activities. A table row reading "GDPR Article 32:
Compliant" invites the reader to ask "assessed by whom, against what processing?"
and there is no answer.

More importantly, the framing understates the case. Article 32 obliges a controller
to implement appropriate technical and organisational measures to secure
processing. PRISM's real position is not that it implements good Article 32
measures. It is that **PRISM removes an entire category of processing from the
controller's risk surface**, because the data never reaches a third party at all.
Filing that under "we have good security measures" throws away the argument.

### 6.2 What is defensible

- PRISM collects no personal data through the application. Verified: no network
  transmission of user data, no storage of any kind on the device, no telemetry.
  See `docs/legal/PRIVACY_POLICY.draft.md`, Part A.
- Using PRISM does not involve disclosing analysed data to us, and therefore does
  not create a processor relationship in respect of that data, does not require a
  data processing agreement in respect of it, and does not involve an international
  transfer of it.
- Our hosting provider logs visitor IP addresses for the web page itself, which is
  disclosed, and which is an ordinary property of being on the internet.

### 6.3 Available wording

> "PRISM processes your data entirely on your own device. We receive nothing, so
> there is nothing for us to transfer, retain or disclose. For a controller, that
> means analysing a data set in PRISM does not add a processor to your record of
> processing activities and does not create an international transfer. We do not
> claim GDPR or PIPEDA certification; neither exists. We claim, and will explain in
> detail, that our architecture removes a category of risk rather than managing
> it."

That paragraph is worth more to a privacy officer than the entire current table.

---

## 7. OWASP Top 10

**Current claim: "OWASP Top 10 | Web Security | Mitigated."**

**Grade: RED as a claim, AMBER as a design statement.**

The OWASP Top 10 is an awareness document describing common categories of web
application security risk. It is not a certification, has no conformance criteria,
and "mitigated" against it means nothing verifiable.

Asserting it is also unwise for a specific reason: the product currently ships
`xlsx@0.18.5`, which carries a publicly disclosed high-severity prototype pollution
vulnerability with no patched release on that distribution channel. That sits
squarely within the Top 10 category concerning vulnerable and outdated components.
The code at `src/stores/prismStore.ts` contains a deliberate, well-reasoned
mitigation that strips anything the parse adds to `Object.prototype`, on both the
success and error paths. That is genuinely good defensive engineering and deserves
to be described. It is still a mitigation of a known-vulnerable component, not its
absence, and it will still appear in any customer's dependency scan.

Claiming Top 10 mitigation while shipping an open high-severity advisory is the
kind of contradiction a security reviewer finds in the first five minutes.

**Available wording, once remediated:**

> "PRISM's threat model and design decisions are documented, including how each
> relevant OWASP Top 10 category is addressed and where residual risk remains. We
> publish our dependency inventory and known advisories."

**Recommended remediation order:** remove the vulnerable dependency before making
any security-category claim at all. See `docs/legal/TERMS.draft.md`, Open Item 5.

---

## 8. The accurate claim set: what PRISM may say today

This is the replacement for the README table. Everything here was verified against
the repository on 2026-09-13 and is re-checkable by a third party without our
cooperation. That last property is the whole point.

| # | Claim | Grade | Evidence a reviewer can check themselves |
| --- | --- | --- | --- |
| 1 | Your data is never uploaded. Analysis happens entirely in your browser. | GREEN | Open the Network tab and use the product. Disconnect the network and keep using it. |
| 2 | The application contains no code that can transmit your data: no XMLHttpRequest, WebSocket or sendBeacon, and the only fetch is the Python runtime download. | GREEN | Search the source for those four terms. |
| 3 | The browser, not our good intentions, enforces the network boundary. The Content Security Policy denies all origins by default and permits only the runtime download. | GREEN | Read the CSP in the page source. |
| 4 | That policy binds the worker thread that holds your data, because the worker is created from a blob URL and inherits the document policy. | GREEN | `src/stores/prismStore.ts:178` and the comment above it. |
| 5 | PRISM stores nothing on your device: no cookies, no local storage, no IndexedDB. Closing the tab destroys everything. | GREEN | Search the source. Check Application storage in developer tools. |
| 6 | There is no account, no login and no telemetry, and therefore no user record to subpoena, breach or sell. | GREEN | There is no signup form. |
| 7 | The Python runtime is verified against pinned SHA-384 digests before it executes, so a compromised distribution network cannot inject code. | GREEN | `PYODIDE_INTEGRITY` in `src/workers/prism.worker.js`. |
| 8 | The security architecture is designed against ISO/IEC 27001:2022 Annex A control objectives. PRISM holds no certification and claims none. | AMBER, with that exact second sentence attached | Published architecture documentation. |
| 9 | PRISM is built against WCAG 2.2 and targets Level AA. Known gaps are published. | AMBER, only once the gap list is published | The published gap list. |
| 10 | An automated accessibility test suite runs in CI. | GREEN, stated exactly that way | `vitest.a11y.config.ts` and the CI workflow. |

**Claims that are OFF LIMITS until the corresponding gate in Section 9 is passed:**

- ISO 27001 certified, ISO 27001 compliant, or any ISO 27001 badge
- WCAG 2.2 AAA, WCAG AAA, or any AAA badge
- WCAG AA conformant (blocked by measured failures, available after Gate 3)
- EN 301 549 compliant
- GDPR compliant, PIPEDA compliant, or any privacy certification
- OWASP Top 10 mitigated
- Full NVDA and VoiceOver compatibility (not yet tested with either)
- 7:1 contrast support (measured failures exist)
- Any statement that PRISM's statistical output is correct, accurate or validated
- Any implication of endorsement by the founder's former employer

---

## 9. Remediation path

Ordered by ratio of credibility gained to effort spent. Each gate unlocks specific
language and nothing more.

**Gate 1: Stop the misrepresentation. Today.**
Remove the compliance table and the WCAG badge from `README.md`. Replace with
Section 8's claim set. This is a documentation edit owned by another team; counsel's
role is to say it is not optional and not a nice-to-have. Until it is done, every
other document produced by this project is discounted by a reader who finds it.
**Unlocks:** the ability to publish the privacy policy honestly.

**Gate 2: Remove the known-vulnerable dependency.**
Migrate off `xlsx@0.18.5`. **Unlocks:** any security-category statement at all, and
the ability to answer a dependency-scan question with "none" instead of an
explanation.

**Gate 3: Fix the measured accessibility failures.**
Focus indicator contrast and chart palette contrast, both already measured and
specified in `docs/design/ui/`. These are token changes, not architecture.
**Unlocks:** "targets WCAG 2.2 Level AA" without an immediate contradiction.

**Gate 4: Publish a known-limitations page.**
Including the statistical defects: the independent t-test comparing only the first
two groups found, the paired t-test pairing by row position, the Shapiro-Wilk
subsampling, silent chart truncation, and reading only the first worksheet of a
workbook. **Unlocks:** the accuracy clauses in the terms of service, which
currently point at nothing. For this buyer, a published defects list is also a
sales asset. It is what an auditor does.

**Gate 5: Fix the statistical defects themselves, and test against known answers.**
A published limitations page is a holding position, not a destination. **Unlocks:**
the ability to describe PRISM as suitable for professional work without a
qualification that undercuts the sentence.

**Gate 6: Resolve licensing.**
See `docs/legal/LICENSE_RECOMMENDATION.md`. **Unlocks:** the "read the source
yourself" verification step, which is the strongest single line available to this
product, and which currently cannot be published.

**Gate 7: Real assistive-technology testing, then an Accessibility Conformance
Report.** **Unlocks:** procurement conversations where an ACR is requested, which
for public sector and large enterprise is most of them.

**Gate 8: Independent penetration test of the application and its architecture.**
**Unlocks:** the ability to answer a security questionnaire with a document rather
than a paragraph. Note that for a product with no server, a penetration test is
narrower and cheaper than the standard assumption, and that a written third-party
review of the zero-egress property specifically may be worth more per dollar than a
generic web application test. Sequence this behind customer demand rather than
speculatively.

**Gate 9: ISO 27001 certification of the operating entity, if and only if a real
customer requires it and will pay for it.** This is a commercial decision, not a
compliance one, and it should be triggered by a purchase order rather than by
ambition. Until then, "designed against Annex A, not certified, and we will tell
you which controls we address and which we do not" is a better answer than most
vendors give.

---

## 10. One structural observation counsel wishes to record

PRISM's architecture creates a compliance position that is unusual and, handled
correctly, better than certification: **many compliance questions do not apply
rather than being answered well.**

Where does the data reside? It does not reside with us. What is your breach
notification process for customer data? We hold no customer data. What are your
sub-processors? We have none for your data. What is your data retention period?
There is no retention. What happens on termination? Nothing needs to happen.

Those answers are unusual enough to be disbelieved on first reading, which is
exactly why the verification steps in Section 8 matter more than any badge would.
A buyer who checks and finds it true trusts the vendor more than a buyer who is
shown a certificate.

The corollary is the reason this document is written as sharply as it is. That
position works **only** if every other claim on the page is equally exact. One
decorative badge poisons it, because it invites the reader to treat the remarkable
claims as decorative too. The unsupported compliance table is not a small
inaccuracy sitting next to the company's main asset. It is the single thing most
capable of destroying it.

---

## 11. Sources

- ISO/IEC 27001:2022, Information security management systems: https://www.iso.org/standard/27001
- W3C, Understanding WCAG 2.2 Conformance: https://www.w3.org/WAI/WCAG22/Understanding/conformance
- W3C, WCAG 2.2 Approved as an ISO Standard (21 October 2025): https://www.w3.org/WAI/news/2025-10-21/wcag22-iso
- ISO/IEC 40500:2025: https://www.iso.org/standard/91029.html
- ETSI EN 301 549 V3.2.1 (2021-03): https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf
- GitHub Pages data collection: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Privacy Statement: https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement

Repository evidence cited in this document is at the paths and line numbers given,
on branch `army/prism-upgrade` as at 2026-09-13. Line numbers move; the facts were
checked, not copied.

---

*End of assessment. Not legal advice. Not a compliance opinion. Requires review by
a qualified lawyer, and where indicated a qualified auditor or accessibility
specialist, before publication or reliance.*
