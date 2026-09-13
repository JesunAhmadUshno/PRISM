# PRISM Licensing: Resolving the Contradiction

> ## NOTICE: READ BEFORE USING THIS DOCUMENT
>
> **This is a non-binding analysis and recommendation prepared by an AI system. It
> is not legal advice, it is not an opinion on the validity or enforceability of
> any licence, and it does not create a lawyer-client relationship. A qualified
> lawyer in the relevant jurisdiction must review it before any licensing change is
> made, published or relied on.**
>
> Licensing decisions are difficult to reverse. A grant made to a recipient
> generally cannot be withdrawn from that recipient afterwards. Do not act on this
> document alone. The single most useful thing in it may be Section 2, which
> records what the repository currently says, so that a reviewing lawyer can start
> from facts rather than from a description of them.
>
> Document status: v0.1
> Prepared: 2026-09-13
> Verified against: repository at `C:/Users/Jesun/PRISM`, branch `army/prism-upgrade`
> Author: AI. Reviewing lawyer: **NOT YET ASSIGNED**

---

## 1. The recommendation, up front

**Adopt a single source-available licence. Publish the source. Prohibit
redistribution and prohibit offering PRISM to third parties. Sell the paid
artifacts and the contractual obligations, not the secrecy of the code.**

The reasoning in one paragraph: PRISM's entire commercial proposition is a claim
that a buyer is expected to verify rather than believe. Verification, at the level
a security-literate buyer actually performs it, means reading the code. Closing the
source therefore does not protect the asset; it removes the mechanism by which the
asset is demonstrated. Meanwhile, the code itself is not a moat: the architecture
is assemblable from freely available components by a competent engineer, and the
market analysis in `docs/business/market/` already found free products publishing
close to PRISM's exact sentence. Secrecy defends something that is not defensible
and costs something that is irreplaceable. Source-available keeps the verification
argument, which is the product, while withholding the one right that would let a
competitor ship PRISM under another name, which is the only right worth
withholding.

Section 6 sets out the recommendation in detail, including which instrument, and
Section 7 states the commercial consequences honestly, including the ones that
count against it.

---

## 2. What the repository actually says today

Four artifacts. They do not agree. Verified 2026-09-13.

| # | Artifact | What it says | What kind of statement it is |
| --- | --- | --- | --- |
| 1 | `LICENSE` | The full text of the **MIT License**, with "Copyright (c) 2026 PRISM Analytics". Grants rights "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies". | A licence grant. This is the operative instrument by convention and by reasonable reader expectation. |
| 2 | `package.json` | `"license": "PROPRIETARY"` | Package metadata. Not a grant, not a notice, not addressed to a human. |
| 3 | `package.json` | `"private": true` | **Not a legal statement at all.** See Section 3.2. |
| 4 | `README.md` | A badge reading "License-Proprietary-red" and the line "Proprietary - See LICENSE for details." | Marketing copy that points the reader at artifact 1, which contradicts it. |

A fifth item is relevant and is a separate defect:

| # | Artifact | What it says | Problem |
| --- | --- | --- | --- |
| 5 | `package.json` | `"repository": { "url": "https://github.com/organization/prism.git" }` | A template placeholder that was never filled in. It points at a repository that is not PRISM's. |

### 2.1 The contradiction is not symmetrical

The four statements do not carry equal weight, and it is important not to treat
this as a tie that can be broken in whichever direction is convenient.

A `LICENSE` file containing the complete, unmodified MIT text, with a copyright
line filled in, is the most explicit and most conventional way a software project
grants rights. A recipient who obtains a copy of the repository and reads that file
has been handed a document that says, in terms, that they may copy, modify,
distribute and sell it. That the `README` disagrees is weak counter-evidence: the
README does not itself grant or withhold anything, and it expressly refers the
reader to the LICENSE file for details. That `package.json` contains the string
`"PROPRIETARY"` is weaker still.

So the honest characterisation is not "the project has not decided." It is: **the
project has, on the face of its own documents, made a permissive grant, and is
saying elsewhere that it did not intend to.** Counsel should assume that a
recipient's argument is the stronger one and plan accordingly, rather than assuming
the proprietary intent controls.

### 2.2 Why this is urgent and why it is also, right now, cheap to fix

A licence grant, once made to a recipient, is generally not retractable as against
that recipient for the copy they received. Changing the licence going forward does
not un-license copies already distributed.

The repository is pre-revenue, has a small number of commits, and has no known
users. **The population of people who may hold an MIT grant is therefore currently
very close to zero.** That will not remain true after a launch. Every week this
stays unresolved, the set of recipients who can point at the MIT file grows, and
the cost of the fix grows with it. This is the cheapest it will ever be.

Counsel should establish, as a matter of fact, whether the repository is or has
been publicly accessible, and whether any copy has been distributed. GitHub Pages
deployment does not by itself make the source repository public, but the free plan
historically required it, so the answer must be checked rather than assumed. That
fact determines whether the problem is theoretical or actual.

### 2.3 Two further defects in the same area

- **The copyright holder may not exist.** The MIT text names "PRISM Analytics." If
  no entity by that name exists, the notice does not identify a legal person
  capable of holding the copyright or granting a licence. Whatever licence is
  chosen, the copyright line must name a real person or a real incorporated entity,
  and it must be the one that will sign customer contracts. This connects to the
  open item in `docs/legal/PRIVACY_POLICY.draft.md` about naming the operating
  entity: the same entity should appear in all three places.
- **There is no third-party notices file.** PRISM's dependency tree includes
  components under MIT, BSD and similar licences, and Pyodide and its Python
  packages carry their own terms. Most of those licences require the copyright
  notice and permission notice to be preserved in distributed copies. Shipping a
  built bundle without a notices file is a licence-compliance defect that exists
  **today, under any of the options below**, and is independent of which one is
  chosen. It is also an item that appears on standard vendor security
  questionnaires.

---

## 3. Two misconceptions to clear before choosing

### 3.1 "The LICENSE file is boilerplate, so it does not really count"

It is the opposite. In software, the LICENSE file is the closest thing the industry
has to a signed instrument. Tooling reads it, scanners report it, lawyers ask for
it, and developers rely on it. Its being conventional is precisely what gives it
weight. Treat it as the controlling document and reconcile everything else to it,
or change it deliberately.

### 3.2 `"private": true` is not a licence and does not protect anything

This is worth stating plainly because the field's name invites the wrong reading.
`"private": true` in `package.json` is a flag for the npm command-line tool. Its
sole effect is that `npm publish` refuses to run, which prevents the package being
accidentally pushed to the public npm registry. It says nothing about copyright,
grants nothing, withholds nothing, and would not be mentioned in a dispute except
as evidence of what someone believed.

If the project's proprietary posture is resting on that field, it is resting on
nothing.

### 3.3 "Open source" and "source-available" are not the same thing

These are used interchangeably in casual conversation and must not be here.

- **Open source**, in the sense recognised by the Open Source Initiative, requires
  (among other things) permission to redistribute and to use for any purpose,
  including commercial competition. MIT and Apache 2.0 qualify.
- **Source-available** means the source can be read, and usually self-hosted, but
  some rights are withheld. Business Source License, PolyForm licences and Elastic
  License 2.0 are of this kind. They are not OSI-approved and should never be
  described as open source.

PRISM needs the reading right. It does not need to hand over the redistribution
right. That gap is exactly what source-available exists to occupy. Describing the
result as "open source" would be inaccurate and would attract deserved criticism
from a community that cares about the distinction, from the same channels PRISM's
launch plan intends to use.

---

## 4. What the licence has to accomplish

Any recommendation has to be tested against what this specific business needs. From
the strategy, market and finance work already done:

| Requirement | Why | Bears on licensing |
| --- | --- | --- |
| A sceptic must be able to read the source and confirm there is no exfiltration. | This is the product's only real differentiator and the core of the launch plan and the privacy policy's verification section. | **Requires source availability.** This is decisive. |
| A competitor must not be able to rebrand and ship PRISM. | There is no technical moat and no switching cost. The code is the only thing that is actually ours. | **Requires withholding redistribution.** |
| An enterprise must be able to self-host to remove the CDN and the US host. | Already contemplated in the pricing work and in the privacy policy's Section 4.7. | **Requires a self-hosting right for customers.** |
| The product cannot phone home, so licences cannot be technically enforced. | The CSP that creates the privacy claim also removes every metering lever. Adding one would falsify the claim. | Enforcement must be **contractual and legal**, not technical. Choose a licence whose breach is legally clean to prove. |
| A buyer must not fear the one-person vendor disappearing. | Real objection for a pre-revenue single-founder product selling to risk-averse regulated buyers. | Favours a licence with a **future conversion date**, or a source escrow, or both. |
| The name must be protectable even where the code is readable. | Reputation attaches to the name, not the bytes. | **Withhold trademark rights explicitly.** Note that Apache 2.0 does this and MIT does not. |

---

## 5. The options, with commercial consequences

### Option A: Fully proprietary, all rights reserved

Replace the MIT text with a proprietary notice. Nobody may copy, modify or
redistribute. Source not published.

**In favour:** maximum theoretical control. Familiar to enterprise procurement.
Simplest to explain in a sales conversation.

**Against, and this is fatal:** it removes the verification argument. Step 4 of the
privacy policy's "do not trust us, check" section, and the corresponding move in
the messaging work, both invite the reader to read the source. Those are the
strongest sentences the company has. Under Option A they are deleted, and the
product is reduced to asking to be believed, which is precisely the position every
cloud competitor is already in and which PRISM exists to escape.

The secrecy it buys is also worth little. The architecture is describable in a
paragraph, uses freely available components, and the market research found existing
free products making near-identical claims. There is no secret to keep.

**Verdict: reject.** Option A protects the thing that is not valuable and destroys
the thing that is.

### Option B: Permissive open source (MIT or Apache 2.0)

Keep the MIT file, or upgrade to Apache 2.0, and say so everywhere.

**In favour:** maximum trust and maximum verifiability. Zero licence friction in
procurement, because every enterprise already has a policy that permits MIT and
Apache. Attracts contributors and scrutiny, and scrutiny is marketing for this
product. It is also the path of least resistance from where the repository already
stands, since it requires correcting the other three artifacts rather than the
LICENSE file.

Apache 2.0 is materially better than MIT here for two reasons: it contains an
express patent grant and an express statement that it does not grant trademark
rights, which MIT leaves silent.

**Against:** it gives away the only asset the company owns outright. Anyone may
take the code, rename it, host it, and sell it, including a competitor with a
distribution advantage, which is to say almost anyone. The finance work is built on
selling offline builds, assurance artifacts and contractual warranties; under
Option B a third party can offer the software for free and compete with the paid
tier using the company's own code. Given that the business has no switching cost,
no network effect, no data gravity and no telemetry, that is a serious exposure
rather than a theoretical one.

**Verdict: viable, and it is the honest runner-up.** Choose it if the founder's
priority is adoption and reputation over revenue from the software itself, for
example if PRISM is primarily a credibility asset supporting consulting work. That
is a legitimate strategy and should be chosen deliberately rather than arrived at
by leaving the MIT file in place.

### Option C: Source-available (RECOMMENDED)

Publish the complete source. Grant the right to read, audit, modify for one's own
use, and self-host for one's own internal purposes. Withhold the right to
redistribute and the right to provide PRISM to third parties.

**In favour:** it keeps every property Section 4 requires. The sceptic reads the
code. The enterprise self-hosts. The competitor cannot ship it. The trademark is
reserved. If the instrument includes a future conversion to an open licence, the
vendor-disappears objection is answered by the licence itself, which is unusual and
memorable in a sales conversation.

**Against:** it is not open source, and must never be called that. Some corporate
policies distinguish only between OSI-approved licences and commercial licences and
have no category for this, which creates friction in exactly the procurement
conversations PRISM is optimising for. Some developer communities react negatively
to source-available licences, and PRISM's launch plan targets several of those
communities. Both of these are real costs and are addressed in Section 7.

**Verdict: recommended.** See Section 6.

### Option D: Open core or dual licence

Permissive core plus a proprietary paid layer, or a copyleft licence such as AGPL
alongside a paid commercial licence.

**Against, specifically for PRISM:** open core requires a feature split, and PRISM
has no natural one. The pricing work deliberately does not gate features: the paid
tiers sell location, provenance, paperwork and contractual obligation, all of which
sit outside the software. There is nothing to put behind the wall.

AGPL dual licensing works when the copyleft obligation bites, which is when someone
runs modified code as a network service. PRISM is client-side and its competitors
are cloud products that would not be incorporating its code anyway. The trigger
rarely fires.

**Verdict: reject.** Structurally mismatched, and it adds complexity to a
conversation that currently benefits from being simple.

---

## 6. The recommendation in detail

### 6.1 Position

**Source-available, published, with a scheduled conversion to a permissive open
licence.**

The concrete shape:

- **Permitted without payment:** read, inspect, audit, fork privately, modify for
  your own use, run it, and self-host it for your own or your organisation's
  internal purposes, including for commercial work done by your organisation.
- **Not permitted:** redistributing PRISM, offering PRISM or a derivative to third
  parties (whether as a product, a hosted service, or bundled into an offering),
  removing notices, or using the PRISM name and marks.
- **Conversion:** on a stated future date, each released version becomes available
  under a permissive open licence.

### 6.2 Candidate instruments

Counsel to choose. These are the realistic candidates and none should be adopted
without review.

| Instrument | Fit | Note |
| --- | --- | --- |
| **Business Source License 1.1** | Strong | Widely used and widely understood by procurement. Requires the licensor to set an Additional Use Grant, a Change Date and a Change License. The built-in conversion directly answers the vendor-continuity objection. |
| **PolyForm Internal Use 1.0.0** | Strong | Short, readable, drafted by lawyers, and its permitted scope ("internal business purposes") maps almost exactly onto what PRISM wants to allow. No conversion mechanism, so pair it with a separate written commitment if conversion is wanted. |
| **Functional Source License** | Possible | Similar shape with a shorter conversion period. Less established in enterprise procurement. |
| **Elastic License 2.0** | Weaker fit | Written for hosted services. Its central restriction, on providing the software as a managed service, is aimed at a threat model that is not PRISM's. |

If BUSL 1.1 is chosen, the three variables need decisions, and they are commercial
decisions rather than legal ones:

- **Additional Use Grant:** should be drafted generously, to permit use and
  self-hosting for the licensee's own internal purposes. Generosity here costs
  nothing, because the paid tiers do not sell access.
- **Change Date:** a defined period after each version's release.
- **Change License:** Apache 2.0 is recommended over MIT, for the patent and
  trademark clauses.

### 6.3 Why the conversion date is worth more than it looks

PRISM asks regulated, risk-averse buyers to depend on software from a single
pre-revenue founder. "What happens if you stop maintaining it, or you are hit by a
bus?" is not a rude question; it is the question, and it will be asked in every
enterprise conversation.

A licence that converts on a stated date answers it in the licence itself, without
an escrow agreement, an escrow agent, or an escrow fee. That is a better answer
than most vendors twenty times the size can give, and it can be said in one
sentence in a sales meeting.

### 6.4 The verification clause

Whichever instrument is chosen, counsel should consider adding an express,
unconditional grant of the right to inspect, analyse, test and publish findings
about the software, including security findings, without permission and without
restriction, and to say so in the licence text.

This is unusual, and that is the point. It is cheap, since the source is public
anyway. It is directly on-message for a product whose pitch is "do not trust us,
check." And it pre-empts the objection that a source-available licence might be
used to suppress a critical security review, which is a live concern in that
community and a reasonable one.

---

## 7. Commercial consequences, stated honestly

### 7.1 What is gained

- The verification argument survives, and it is the only argument the company has
  that a cloud competitor cannot copy.
- Enterprise self-hosting becomes a licensing question with a written answer rather
  than a bespoke negotiation each time.
- The trademark stays reserved, so reputation accrues to the name.
- The conversion date neutralises the single-founder continuity objection.
- The internal contradiction disappears, and with it the question "which of your
  three licence statements is true?", which is currently the worst possible first
  impression to make on a buyer who audits for a living.

### 7.2 What is lost or risked

- **It is not open source, and some people will object.** The launch plan
  contemplates Hacker News, Lobste.rs and privacy-focused communities. Some
  participants in those communities hold strong views about source-available
  licences. The correct response is to be straightforward: say "source-available,
  not open source," name the licence, explain in one sentence that the restriction
  is on redistribution rather than on inspection, and do not argue. Attempting to
  borrow the "open source" label is what converts a mild objection into a
  credibility story.
- **Procurement friction in a minority of organisations.** Some open-source review
  boards have only two categories. Mitigation: enterprise customers on a paid tier
  are signing a commercial agreement anyway, and that agreement governs.
- **Fewer external contributors.** Source-available projects attract less
  contribution than open-source ones. For a project whose value is auditability
  rather than feature velocity, this is a smaller loss than it first appears, and
  external scrutiny, which is what actually matters here, does not require a
  contributor licence.
- **Irreversibility in one direction.** Moving from source-available to permissive
  later is easy. Moving the other way is not. Counsel should note that Option B
  remains available at any future point, which makes Option C the lower-regret
  choice, not the higher-regret one.
- **Copies already distributed under MIT keep their MIT rights.** See Section 2.2.
  This is why the change should be made now.

### 7.3 What does not change

Revenue. This is worth stating because it is counter-intuitive. Under the pricing
work in `docs/business/finance/`, nothing that PRISM sells is access to the code.
The paid tiers sell a signed offline artifact, assurance paperwork, and contractual
obligations including a warranty on the no-exfiltration property. Every one of
those survives publication of the source intact. A customer who can read the code
still cannot produce their own countersigned warranty.

That is the structural reason this recommendation is not a sacrifice. The company
was never selling the secret.

---

## 8. Implementation checklist

**Scope note:** every file listed below is outside `docs/legal/` and is owned by
other teams. Nothing in this section has been changed by counsel. It is a list of
required changes to be routed to whoever owns each file, and none of it should be
actioned before a qualified lawyer has approved the chosen position.

Do these together, in one change, so that the repository is never in a
half-contradictory state:

1. **Decide the entity.** Name the real person or incorporated entity that will
   hold copyright and sign contracts. Must match the entity named in the privacy
   policy and the terms.
2. **Replace `LICENSE`** with the chosen instrument's full, unmodified text, with
   the licensor, copyright year and any required variables correctly filled in.
   Adopt no licence by paraphrase.
3. **Correct `package.json`:** set the `license` field to the correct SPDX
   identifier, or to `"SEE LICENSE IN LICENSE"` where no SPDX identifier exists,
   which is the case for most source-available licences. Decide separately whether
   `"private": true` should remain; it should, unless the package is ever intended
   for npm, but it must no longer be treated as a legal control.
4. **Fix the placeholder repository URL** in `package.json`.
5. **Correct `README.md`:** the badge and the licence section must state the chosen
   position in the same words as the LICENSE file, and must not use the words "open
   source" unless Option B is chosen.
6. **Reconcile `docs/legal/TERMS.draft.md`**, Sections 3 and 9, which currently
   assume a proprietary grant. If Option C is adopted, the licence grant in the
   terms must defer to the LICENSE file rather than contradict it.
7. **Update `docs/legal/PRIVACY_POLICY.draft.md`**, Section 7 step 4. If the source
   is published, replace the placeholder with a direct link to the repository and
   strengthen the sentence. This is the payoff for the whole exercise.
8. **Add a third-party notices file** listing every distributed dependency and its
   licence text. Required today, under every option. See Section 2.3.
9. **Add a licence header policy** if the chosen instrument expects per-file
   notices. BUSL 1.1 does.
10. **Record the decision** in an architecture decision record alongside the
    existing ones in `docs/business/technical/`, so that the reasoning survives the
    founder's memory of it.

---

## 9. If only one thing is done

Delete the MIT text or commit to it, today, and make the other three artifacts
agree with whichever is chosen.

An unresolved licence is worse than either resolution. It means the company cannot
answer the first question on every vendor form, cannot publish the verification
invitation that its entire marketing rests on, and is simultaneously asserting to
some readers that the code is free and to others that it is proprietary. For a
company whose one asset is that it can be checked and found accurate, that is the
wrong thing to be caught being wrong about.

---

*End of analysis. Not legal advice. Requires review by a qualified lawyer in the
relevant jurisdiction before any licensing change is made, published or relied on.*
