# PRISM Terms of Service (DRAFT)

> ## NOTICE: READ BEFORE USING THIS DOCUMENT
>
> **This is a non-binding draft prepared by an AI system. It is not legal advice,
> it does not create a lawyer-client relationship, and it must not be published,
> linked, relied on, incorporated into a contract, or shown to a customer until a
> qualified lawyer licensed in the relevant jurisdiction has reviewed and approved
> it.**
>
> Terms of service are the document most likely to be tested in a dispute and the
> document where an AI draft is least adequate on its own. Three areas below are
> specifically beyond what this draft can settle and are flagged inline:
> the enforceability of the limitation of liability in consumer contexts, the
> interaction with mandatory consumer-protection statutes in Ontario, Quebec and
> the European Union, and the choice of a liability cap for a product that is
> currently distributed at no charge.
>
> Document status: DRAFT v0.1
> Prepared: 2026-09-13
> Verified against: repository at `C:/Users/Jesun/PRISM`, branch `army/prism-upgrade`
> Draft author: AI. Reviewing lawyer: **NOT YET ASSIGNED**

---

## Part A: Drafting notes (internal, remove before publication)

### A.1 Why PRISM's terms are structurally unusual

Almost every SaaS terms-of-service template assumes four things that are false for
PRISM. Counsel should not adapt a standard template without noticing this, because
several standard clauses will be unenforceable, meaningless or actively misleading.

| Standard SaaS assumption | True for PRISM? | Consequence for the drafting |
| --- | --- | --- |
| There is an account | No | No registration, eligibility, password or account-security clauses. Nothing to bind a user by click-through at signup. |
| We operate a service that holds data | No | No data-processing, backup, retention, deletion or SLA clauses. No security-incident notification clause, because there is no repository of user data to breach. |
| We can suspend or terminate a user | **No** | This is the single biggest structural problem. See A.2. |
| We can measure usage | No | No metering, overage, fair-use enforcement or audit-rights clause is operable. The architecture that produces the privacy claim also removes every enforcement lever. |

### A.2 We cannot terminate anyone, and the terms must not pretend otherwise

PRISM is a static page plus a WebAssembly runtime. Once a user has loaded it, the
application runs on their machine with no call home. There is no session to
invalidate, no licence key check, no account to disable. If a user breaches these
terms, the only realistic remedies are the legal ones: the contractual claim, a
copyright claim, and (if the page is self-hosted by us) removing the page.

A clause saying "we may terminate your access at any time" is therefore close to
false as a description of capability. The draft below says what is actually true:
that the licence terminates automatically on breach, that continued use after
termination is unlicensed use, and that this is enforced by law rather than by a
switch. That is a weaker practical position and a much more honest one, and it is
the position a sophisticated counterparty will respect.

### A.3 The clause that actually matters

For this product, in this market, the operative risk is **not** privacy, data loss
or downtime. It is **reliance on a wrong number.**

The intended users identified by the business documents are auditors, healthcare
analysts and legal or eDiscovery teams. Those users take output into work product
that other people rely on. Verified defects currently in the product include, at
minimum: the independent-samples t-test silently comparing only the first two
groups it finds; the paired t-test pairing observations by row position after
truncating to the shorter column; the Shapiro-Wilk test silently subsampling large
inputs; charts silently truncating to the first N rows rather than sampling; and
only the first worksheet of any workbook ever being read. Each of these produces a
plausible-looking number that is wrong, with no visible warning.

Sections 6 and 7 below are therefore the centre of gravity of this document, not
boilerplate. Counsel should give them more attention than the rest of the draft
combined. See also `docs/legal/COMPLIANCE_POSTURE.md`.

### A.4 The free-product cap problem

A liability cap expressed as "fees paid in the preceding twelve months" evaluates
to zero for a product distributed at no charge. Zero-value caps are more likely to
be struck down as unconscionable than a small positive floor, and they give a
counterparty nothing to point at. Counsel should decide between a nominal fixed
floor (a specified sum in Canadian dollars) and the fees-paid formula with a floor.
This draft uses a placeholder and does not choose. See Section 7 and Part C, Open
Item 3.

---

## Part B: The terms (proposed published text)

> Everything from here to the end of Part B is intended for publication once
> approved. Parts A and C are internal and must be removed from the published
> version.

---

# Terms of Service

**Effective date:** [TO BE SET ON PUBLICATION]
**Last updated:** [TO BE SET ON PUBLICATION]

These terms govern your use of PRISM, a data analysis application that runs
entirely in your web browser. PRISM is provided by **[LEGAL ENTITY OR NAMED
INDIVIDUAL TO BE CONFIRMED]** ("we", "us"), of [ADDRESS], Ontario, Canada.

**Please read Sections 6 and 7. They limit what PRISM promises about the accuracy
of its output, and they matter more than anything else on this page.**

## 1. What PRISM is, plainly

PRISM opens spreadsheet, CSV and XML files that you select, analyses them using
Python running inside your own browser, and displays statistics and charts. It
does not upload your files. There is no PRISM account and no PRISM server that
receives your data. What we provide is a web page and the program it delivers to
your browser; the analysis itself happens on your computer, performed by software
running under your control.

How your data is handled is described in our Privacy Policy, which forms part of
these terms.

## 2. Agreement

By using PRISM you agree to these terms. If you do not agree, do not use it.

If you are using PRISM in the course of employment or on behalf of an
organisation, you confirm that you are authorised to accept these terms on that
organisation's behalf, and "you" in these terms means both you and that
organisation.

## 3. Licence

Subject to these terms, we grant you a limited, non-exclusive, non-transferable,
revocable licence to use PRISM for its intended purpose.

> **DRAFT FLAG, INTERNAL:** The scope, exclusivity and revocability of this grant,
> and whether the grant is even the operative instrument, depend entirely on the
> outcome of `docs/legal/LICENSE_RECOMMENDATION.md`. The repository currently
> contains the MIT License text in its `LICENSE` file, the string `"PROPRIETARY"`
> in `package.json`, and the word "Proprietary" in `README.md`. Those three cannot
> all be true. **Do not publish this section until that is resolved**, because a
> terms-of-service licence grant that contradicts a repository licence file is a
> gift to the other side in any dispute. See Part C, Open Item 1.

## 4. What you may not do

You may not:

- use PRISM in violation of any applicable law, or to process data you have no
  right to process;
- remove, obscure or alter any copyright, trademark or other proprietary notice;
- represent that PRISM is certified, accredited or approved by any standards body,
  regulator or auditor, or that it holds any certification, when it does not;
- state or imply that we endorse you, your organisation, or any work product you
  produce using PRISM;
- use the name PRISM, or our logo, in a way likely to cause confusion as to source
  or sponsorship.

We are aware that we have no technical means of detecting or preventing a breach
of this section, and we do not claim otherwise. These obligations are contractual.

## 5. Your data and your responsibility for it

Your files remain yours. We claim no ownership of, licence to, or interest in
anything you analyse in PRISM, and in any event we never receive it.

You are solely responsible for:

- having the legal right to process the data you open in PRISM, including under any
  applicable privacy, confidentiality, professional-secrecy, contractual or
  regulatory obligation you are subject to;
- the security of the device and browser you run PRISM on, including any browser
  extensions installed on it;
- retaining your own copies of your files. PRISM stores nothing. When you close or
  reload the tab, everything PRISM held is gone. There is no recovery, undo or
  restore, by us or by anyone.

## 6. Accuracy: what PRISM does not promise

**Read this section before using PRISM output in anything that matters.**

### 6.1 PRISM is a calculation tool, not professional advice

PRISM's output is not, and must not be treated as, audit evidence, an audit
opinion, an accounting determination, financial advice, investment advice, legal
advice, medical or clinical advice, a diagnosis, a regulatory filing, or a
professional opinion of any kind. Nothing PRISM displays discharges any
professional, statutory, evidentiary or regulatory obligation you are subject to.

If you are a professional operating under a standard of care, a professional
standard or a regulatory regime, that standard applies to your use of PRISM's
output in full, unmodified. It is your obligation, not ours, to determine whether a
tool is appropriate for your purpose and to validate its output to the standard
your work requires.

### 6.2 We do not warrant that the output is correct

PRISM is provided without any warranty that its statistical calculations,
transformations, inferences, charts or summaries are accurate, complete, free from
error, or appropriate for any particular data set or purpose.

This is a deliberate, specific disclaimer and not boilerplate. Statistical software
can produce a result that is well-formatted, plausible and wrong. It can select a
subset of your data, apply a method whose assumptions your data violates, or
silently reduce what it displays. A number appearing on the screen is not a
representation by us that the number is right.

### 6.3 Verify before you rely

Where a result will be relied on, you should independently verify it, for example
by reproducing it in a second tool, checking it against a data set with a known
answer, or having it reviewed by someone qualified to assess the method.

### 6.4 Known limitations

We publish known limitations and known defects rather than leaving you to
discover them. Consult the current limitations documentation before relying on
output. The absence of a limitation from that list is not a representation that no
such limitation exists.

> **DRAFT FLAG, INTERNAL:** Section 6.4 must link to a real, published, maintained
> limitations page before these terms go live. A terms clause pointing at nothing
> is worse than no clause, because it advertises that a list was contemplated and
> not produced. The specific defects listed in Part A, Section A.3 above should be
> on it. See Part C, Open Item 2.

### 6.5 Availability

PRISM is provided as available. We do not promise that it will be accessible,
uninterrupted, error-free, compatible with your browser or device, or maintained.
We may change, suspend or discontinue it at any time without notice. There is no
service level commitment.

## 7. Disclaimer of warranties and limitation of liability

### 7.1 Disclaimer

**To the maximum extent permitted by applicable law, PRISM is provided "as is" and
"as available", without warranty of any kind, whether express, implied, statutory
or otherwise.** We specifically disclaim all implied warranties and conditions of
merchantability, merchantable quality, fitness for a particular purpose,
durability, title, non-infringement, accuracy, and any warranty arising from a
course of dealing or usage of trade.

We do not warrant that PRISM is free of defects, security vulnerabilities or
errors, that defects will be corrected, or that any third-party component
distributed with or loaded by PRISM is free of vulnerabilities.

### 7.2 Limitation of liability

**To the maximum extent permitted by applicable law, we will not be liable for any
indirect, incidental, special, consequential, exemplary or punitive damages, or for
any loss of profits, revenue, goodwill, business opportunity, anticipated savings,
data, or use, arising out of or relating to PRISM, however caused and on any theory
of liability, whether in contract, tort (including negligence), strict liability or
otherwise, and whether or not we were advised of the possibility of such damages.**

**To the maximum extent permitted by applicable law, our total aggregate liability
arising out of or relating to PRISM and these terms will not exceed the greater of
(a) the total amount you paid us for PRISM in the twelve months before the event
giving rise to the claim, and (b) [AMOUNT TO BE SET] Canadian dollars.**

> **DRAFT FLAG, INTERNAL:** The figure in (b) is not set. See Part A, Section A.4
> and Part C, Open Item 3. A cap that evaluates to zero for every free user is more
> vulnerable than a small positive floor.

### 7.3 Exclusions that cannot be excluded

Nothing in these terms excludes or limits liability that cannot lawfully be
excluded or limited, including liability for fraud or fraudulent
misrepresentation, for death or personal injury caused by negligence, or any other
liability to the extent applicable law forbids its exclusion.

Some jurisdictions do not allow the exclusion of implied warranties or the
limitation of certain damages, so some of the above may not apply to you. If you
are a consumer, you may have statutory rights that these terms cannot displace,
and nothing here is intended to displace them.

> **DRAFT FLAG, INTERNAL:** This is the part of the draft most in need of a lawyer
> and least suitable for AI drafting. At minimum, counsel must consider: the
> Ontario *Consumer Protection Act, 2002* and its restrictions on waiving statutory
> rights and on exclusion clauses in consumer agreements; the Quebec *Consumer
> Protection Act* and the Civil Code of Quebec, including the language requirements
> of the Charter of the French Language if PRISM is offered to Quebec consumers; EU
> and UK consumer law, where a blanket exclusion of implied terms is unenforceable
> against consumers; and whether PRISM is in fact offered to consumers at all or
> only to businesses. If PRISM is business-only, say so explicitly and gate it,
> because a clause asserting business-only that is contradicted by a free public
> web page open to anyone will not hold. See Part C, Open Item 4.

### 7.4 Basis of the bargain

You acknowledge that the allocation of risk in this section is a fundamental basis
of the bargain between us, that we would not provide PRISM on these terms without
it, and that it applies even if a limited remedy is found to have failed of its
essential purpose.

## 8. Third-party components

PRISM incorporates and loads third-party open-source software, including the
Pyodide Python-to-WebAssembly runtime and its scientific Python packages, and
various JavaScript libraries. Those components are licensed by their own authors
under their own terms, which continue to govern them. We make no warranty in
respect of them and disclaim liability for them to the extent permitted by law.

PRISM downloads the Python runtime from a third-party public distribution network
when you use it. That network is operated by a third party, is not under our
control, and is subject to its own terms and privacy practices. See the Privacy
Policy for a precise description of what that request does and does not reveal.

A list of third-party components and their licences is published at [LOCATION TO
BE CONFIRMED].

> **DRAFT FLAG, INTERNAL:** Two items. First, the third-party notices file does not
> yet exist and is a distribution obligation under several of the licences already
> in use, not an optional nicety. Second, the current dependency tree includes
> `xlsx@0.18.5`, which carries a publicly disclosed high-severity prototype
> pollution vulnerability with no patched release on that distribution channel.
> Counsel's position is that shipping a known-vulnerable component while marketing
> the product primarily on its security posture is a misrepresentation risk
> independent of any technical risk, and that it should be remediated before any
> commercial launch rather than disclosed around. See Part C, Open Item 5.

## 9. Intellectual property

PRISM, including its source code, design, interface and documentation, and the
PRISM name and logo, are owned by us or our licensors and are protected by
copyright and other laws. Except for the licence in Section 3, no rights are
granted to you.

> **DRAFT FLAG, INTERNAL:** This section is currently inconsistent with the MIT
> License text sitting in the repository's `LICENSE` file, which grants rights to
> use, copy, modify, merge, publish, distribute, sublicense and sell copies. Both
> cannot stand. See `docs/legal/LICENSE_RECOMMENDATION.md`.

## 10. Feedback

If you send us suggestions, bug reports or ideas, you grant us a perpetual,
irrevocable, worldwide, royalty-free licence to use them without restriction or
obligation to you. Do not send us anything you consider confidential, and do not
send us data samples containing confidential or personal information. If you are
reporting a defect, describe the shape of the data rather than sending the data.

## 11. Term and termination

These terms apply for as long as you use PRISM.

Your licence terminates automatically if you breach these terms. On termination
you must stop using PRISM.

We do not have, and do not claim, a technical means of disabling your copy of
PRISM or of blocking your access to it. PRISM runs on your machine and does not
contact us. Enforcement of this section is legal, not technical. We may cease
publishing PRISM at any time, which will not affect any copy already delivered to
you.

Sections 5 to 10, 12 and 13 survive termination.

## 12. Governing law and disputes

These terms are governed by the laws of the Province of Ontario and the laws of
Canada applicable in it, without regard to conflict-of-laws rules. The courts of
Ontario have exclusive jurisdiction, and you submit to their jurisdiction.

If you are a consumer resident elsewhere, this does not deprive you of the
protection of mandatory rules of the law of your place of residence.

The United Nations Convention on Contracts for the International Sale of Goods
does not apply.

> **DRAFT FLAG, INTERNAL:** Counsel should decide whether to add an arbitration
> clause and a class-action waiver. That decision depends on the answer to whether
> PRISM is consumer-facing, and on the target enterprise market's tolerance for
> arbitration clauses, which in procurement is often low. This draft deliberately
> includes neither.

## 13. General

**Entire agreement.** These terms and the Privacy Policy are the entire agreement
between us regarding PRISM and supersede any prior understanding. A separate
signed agreement with us, if any, prevails over these terms to the extent of any
conflict.

**Severability.** If any provision is held unenforceable, it will be modified to
the minimum extent necessary, or severed, and the remainder will continue in
effect.

**No waiver.** A failure to enforce any provision is not a waiver of it.

**Assignment.** You may not assign these terms without our written consent. We may
assign them in connection with a merger, acquisition or sale of assets.

**Changes.** We may update these terms. Material changes will be reflected in the
"Last updated" date, and continued use after a change constitutes acceptance. If
you do not accept a change, stop using PRISM.

**Export and sanctions.** You may not use PRISM in violation of applicable export
control or economic sanctions laws, including those of Canada and, where
applicable, the United States and the European Union.

**Contact.** [CONTACT EMAIL TO BE INSERTED]

---

## Part C: Open items for counsel (internal, remove before publication)

**Open Item 1: resolve licensing before publishing Sections 3 and 9.** The
repository simultaneously contains the MIT License text in `LICENSE`,
`"license": "PROPRIETARY"` with `"private": true` in `package.json`, and the word
"Proprietary" in `README.md`. Sections 3 and 9 of these terms assume a proprietary
position that the `LICENSE` file contradicts. Publishing terms in that state
creates an argument that the permissive grant governs. See
`docs/legal/LICENSE_RECOMMENDATION.md`, which recommends a single coherent
position and sets out the commercial consequences of each option.

**Open Item 2: produce the limitations page referenced in Section 6.4.** Should
list, at minimum, the known statistical and data-handling defects recorded in Part
A, Section A.3. This page is not only a liability document. For the identified
buyer, who audits claims for a living, a published defects list is a credibility
asset. Write it before a customer finds the defects unaided.

**Open Item 3: set the liability cap figure in Section 7.2(b).** See Part A,
Section A.4.

**Open Item 4: decide whether PRISM is offered to consumers.** This determines
whether Ontario, Quebec, EU and UK consumer-protection regimes constrain Sections
7.1 and 7.2, and whether French-language obligations apply in Quebec. If the answer
is business-only, the product must be gated in a way consistent with that claim,
not merely labelled.

**Open Item 5: remediate the known-vulnerable dependency before commercial
launch.** `xlsx@0.18.5` carries a publicly disclosed high-severity prototype
pollution vulnerability. The code at `src/stores/prismStore.ts` mitigates the known
prototype-pollution path defensively, which is good engineering, but a mitigation
is not a fix and does not remove the advisory from a dependency scan. Marketing a
product on its security architecture while shipping a component with an open
high-severity advisory is a misrepresentation risk, separate from the technical
risk, and it is the first thing a security-literate buyer will check.

**Open Item 6: warranty exposure if a no-exfiltration warranty is ever sold.** The
finance documents contemplate offering a contractual warranty on the
no-exfiltration property in an enterprise agreement. Counsel should note that such
a warranty is the one promise in this product that is both architecturally true
and genuinely valuable, and that it should therefore be drafted deliberately rather
than falling out of a general "conforms to documentation" clause. Specific points
to decide: whether the warranty is scoped to the application as distributed
(excluding user-installed browser extensions and compromised endpoints, which
Section 6 of the Privacy Policy already discloses), whether breach triggers an
uncapped indemnity or sits under the general cap, and what the remedy is. A
warranty of this kind should carry its own carve-outs, not inherit generic ones.

**Open Item 7: trademark.** Section 4 and Section 9 assume rights in the name
PRISM. Counsel should advise on availability and registrability in Canada and any
target market. The name collides with a widely known government surveillance
programme, which is a marketing question rather than a legal one, but it may also
affect clearance.

**Open Item 8: accessibility of the terms themselves.** If the product markets
itself on accessibility, the terms and privacy policy should meet the same standard
as the application. This is a real and frequently missed inconsistency.

---

*End of draft. Not legal advice. Requires review by a qualified lawyer in the
relevant jurisdiction before publication or reliance.*
