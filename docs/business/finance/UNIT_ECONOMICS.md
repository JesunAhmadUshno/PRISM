# PRISM Unit Economics

Owner: CFO
Date: 2026-09-13
Status: Model for founder decision. Every input is labelled. Nothing here is a promise.

---

## 0. How to read this

Every input in this model carries one of two labels:

- **CITED** with a URL, meaning it is a real published figure someone else stands behind.
- **ASSUMPTION** with the reasoning shown, meaning I made it up on purpose and you can
  disagree with it by attacking the reasoning.

There is no third category. If a number appears without a label, it is arithmetic derived
from labelled inputs, and the derivation is shown next to it.

PRISM has **no users, no revenue and no paying customers today.** Every revenue figure
below is scenario arithmetic, not a forecast. The purpose of the model is to find out what
would have to be true, not to predict what will be.

---

## 1. The headline, stated before the model

Cost of goods sold per user is approximately zero. Cost of customer acquisition is not.

The gross margin looks like software (about 97%, see `PRICING.md` section 3.4). The
constraint does not. The constraint is a single person's available hours, and those hours
are consumed almost entirely by the Enterprise tier, which is also where nearly all the
revenue is.

> **This business does not have software unit economics. It has professional services
> capacity economics wearing software gross margins.** Model it that way or the model lies
> to you.

---

## 2. Inputs

### 2.1 Cost inputs

| # | Input | Value | Label and reasoning |
| --- | --- | --- | --- |
| C1 | Static hosting | $0 to $240 / yr | CITED as unmetered static bandwidth on Cloudflare Pages including the free plan, https://developers.cloudflare.com/workers/platform/pricing/ (as reported September 2026). The $240 is optional headroom for a paid plan, not a requirement. |
| C2 | Domain registration | $20 / yr | ASSUMPTION. Reasoning: standard `.com` renewal band at a mainstream registrar. Immaterial either way. |
| C3 | Payment processing | 2.9% + $0.30 per charge | CITED, https://stripe.com/pricing. Verify the current rate before relying on it. |
| C4 | Legal entity setup | $300 to $1,500 one time | ASSUMPTION. Reasoning: the low end is self-filed incorporation, the high end is a lawyer doing it. Wide because it depends entirely on whether the founder does the paperwork himself. |
| C5 | Accounting and tax filing | $1,500 / yr | ASSUMPTION. Reasoning: a single-owner corporation with a handful of invoices and no payroll is the cheapest possible engagement for a small Toronto accounting practice. Revisit once payroll exists. |
| C6 | Legal templates: MSA, EULA, order form | $3,000 to $6,000 one time | ASSUMPTION. Reasoning: three related documents drafted once by a software-licensing lawyer. This is not optional, because the Enterprise tier sells a contractual warranty and that warranty must be drafted by someone who is insured to draft it. |
| C7 | E&O and cyber liability insurance | $1,500 to $4,000 / yr | ASSUMPTION. Reasoning: banking and healthcare buyers routinely require a vendor to carry it, and name the minimum cover in the MSA. Treat as a cost of entering the Enterprise tier, not a general overhead. |
| C8 | Third-party penetration test | $8,000 to $25,000 one time per release cycle | ASSUMPTION, and it is the largest and least certain line in the model. Reasoning for the low end: the scope is unusually small, being a static single-page app with no backend, no authentication, no database and no server-side session. Reasoning for the high end: a firm whose report a bank will accept charges for the brand on the cover page as much as for the work. **Get three written quotes before committing.** |
| C9 | Code signing certificate | $200 to $500 / yr | ASSUMPTION. Reasoning: an organisation-validated certificate is needed to sign the offline bundle, which is a paid-tier feature. Requires C4 to exist first. |
| C10 | Tooling and subscriptions | $600 / yr | ASSUMPTION. Reasoning: a placeholder for the handful of small recurring costs that always appear. Deliberately round. |

**Year one fixed cash cost, excluding founder compensation:**

- Low end: 0 + 20 + 300 + 1,500 + 3,000 + 1,500 + 8,000 + 200 + 600 = **$15,120**
- High end: 240 + 20 + 1,500 + 1,500 + 6,000 + 4,000 + 25,000 + 500 + 600 = **$39,360**
- Midpoint used throughout below: **$27,240**

Note what dominates. C8, the pentest, is between 53% and 64% of the entire year one cash
cost. See section 5.3.

### 2.2 Capacity inputs

This is the section that actually matters.

| # | Input | Value | Label and reasoning |
| --- | --- | --- | --- |
| H1 | Founder working hours | 1,800 / yr | ASSUMPTION. Reasoning: 45 working weeks at 40 hours, leaving 7 weeks for holidays, illness and slack. Higher figures are achievable in bursts and are not sustainable for a solo founder across a full year. |
| H2 | Split between build and sell | 65% build, 35% sell | ASSUMPTION. Reasoning: the product still needs tests, a CVE migration and an offline build pipeline before the paid tiers exist at all. Gives **630 commercial hours** in year one. |
| H3 | Prospecting hours per closed Enterprise deal | 25 h | ASSUMPTION. Reasoning: outreach, qualification and the meetings that do not convert, amortised over the one that does. |
| H4 | Deal execution hours, first Enterprise deal | 40 h | ASSUMPTION. Reasoning: a vendor security review at a bank or hospital is a multi-round questionnaire plus an architecture call plus contract redlines. Grounded in the founder's own KPMG IT advisory experience running ISO 27001 audits in those sectors, which is direct observation of the process from the other side of the table. |
| H5 | Deal execution hours, fifth Enterprise deal | 15 h | ASSUMPTION. Reasoning: by the fifth deal the answer library from section 6 covers most questions verbatim. Assumed to decline roughly 20% per deal from H4. |
| H6 | Ongoing support, per Enterprise customer | 10 h / yr | ASSUMPTION. Reasoning: a 48 hour response SLA on security questions, plus one renewal conversation, plus a refreshed questionnaire. |
| H7 | Hours to close one Team customer | 6 h | ASSUMPTION. Reasoning: self-serve plus one call plus sending the artifact pack. No negotiation at $1,200. |
| H8 | Imputed founder hourly cost | $85 / h | ASSUMPTION, and it is a **shadow price, not a cash cost.** Reasoning: an approximation of what a senior AI engineer and data architect in Toronto forgoes by not contracting. Used only to compute CAC honestly. It never appears in the cash P&L. |

**The year one capacity ceiling, derived from H1 to H7:**

| Activity | Hours |
| --- | --- |
| Enterprise deal 1 (25 prospect + 40 execute) | 65 |
| Enterprise deal 2 (25 + 32) | 57 |
| Enterprise deal 3 (25 + 26) | 51 |
| Enterprise deal 4 (25 + 20) | 45 |
| Enterprise deal 5 (25 + 15) | 40 |
| Enterprise support, partial year, 5 customers | 25 |
| General content, writing and inbound | 200 |
| **Subtotal** | **483** |
| Remaining from the 630 commercial hours | 147 |
| Team customers that 147 hours could close, at H7 | 24 |

So the physical ceiling for year one is roughly **5 Enterprise plus up to 24 Team
customers**, and only if every hour lands perfectly and demand is never the constraint.
That is a ceiling, not a plan. The base case below is deliberately well underneath it.

### 2.3 Revenue inputs

Prices are from `PRICING.md`. Volumes are the scenario variable.

| Tier | Price | Net after C3 fees |
| --- | --- | --- |
| Offline | $49 one time | 49 - (1.42 + 0.30) = **$47.28** |
| Team | $1,200 / yr | 1,200 - (34.80 + 0.30) = **$1,164.90** |
| Enterprise, design partner year one | $6,000 / yr | 6,000 - (174.00 + 0.30) = **$5,825.70** |
| Enterprise, full price | $12,000 / yr | 12,000 - (348.00 + 0.30) = **$11,651.70** |

| # | Input | Value | Label and reasoning |
| --- | --- | --- | --- |
| R1 | Enterprise annual renewal rate | 85% base, 50% downside, 30% stress | ASSUMPTION, and **the single most uncertain input in this model.** Reasoning for 85%: the renewal buys artifacts that genuinely decay, a pentest of a release that is no longer current, a stale SBOM, an ageing questionnaire response, so there is a real recurring reason to pay. Reasoning for the downside: the customer's copy of the software keeps working forever whether they renew or not, because there is no call home and we cannot revoke it. **Renewal here is entirely voluntary in a way that normal SaaS renewal is not.** Model the downside seriously. |
| R2 | Enterprise customer life | 3 years at 85% renewal | Derived from R1. |
| R3 | Offline tier volume | Scenario variable | ASSUMPTION in every scenario. Reasoning: with no audience, no users and no launch, there is no defensible basis for any conversion rate. Treated purely as a sensitivity lever in section 5.4 rather than a forecast. |

---

## 3. Year one scenarios

All three scenarios sit under the capacity ceiling from 2.2. Fixed cost is the $27,240
midpoint from 2.1 in every case, because these costs are close to fixed and do not scale
with the number of customers.

### 3.1 Conservative

| Line | Volume | Gross | Net of fees |
| --- | --- | --- | --- |
| Enterprise, design partner | 1 | $6,000 | $5,826 |
| Team | 2 | $2,400 | $2,330 |
| Offline | 40 | $1,960 | $1,891 |
| **Total revenue** | | **$10,360** | **$10,047** |
| Fixed cash cost | | | ($27,240) |
| **Cash contribution** | | | **($17,193)** |

### 3.2 Base

| Line | Volume | Gross | Net of fees |
| --- | --- | --- | --- |
| Enterprise, design partner | 3 | $18,000 | $17,477 |
| Team | 6 | $7,200 | $6,989 |
| Offline | 120 | $5,880 | $5,673 |
| **Total revenue** | | **$31,080** | **$30,140** |
| Fixed cash cost | | | ($27,240) |
| **Cash contribution** | | | **$2,900** |

### 3.3 Optimistic

| Line | Volume | Gross | Net of fees |
| --- | --- | --- | --- |
| Enterprise, design partner | 3 | $18,000 | $17,477 |
| Enterprise, full price | 2 | $24,000 | $23,303 |
| Team | 14 | $16,800 | $16,309 |
| Offline | 300 | $14,700 | $14,184 |
| **Total revenue** | | **$73,500** | **$71,273** |
| Fixed cash cost | | | ($27,240) |
| **Cash contribution** | | | **$44,033** |

### 3.4 What these scenarios actually say

**The base case pays the founder nothing.** $2,900 of cash contribution after a year of
work is not a salary, it is a rounding error. Read that plainly rather than around it: on
base assumptions, year one of paid revenue covers its own costs and nothing else.

The optimistic case produces about $44,000, which is a fraction of a Toronto senior
engineering salary. **Even the good case does not replace the founder's opportunity cost
in year one.** The case for continuing is entirely about year two, where the fixed costs
have already been paid, the answer library exists, and renewals arrive at full price with
only 10 support hours behind them.

Year two arithmetic on base-case customers, at 85% renewal, with no new sales at all:
3 Enterprise renewing at full $12,000 gives 3 x 0.85 x $11,651.70 = **$29,712** against maybe
$12,000 of recurring fixed cost, for roughly $17,712 of contribution on about 26 hours of
support work. That is the shape of the business, and it only exists if R1 holds.

---

## 4. CAC, LTV and the hours problem

Cash CAC is close to zero because there is no ad spend. That number is useless. The honest
CAC is founder hours priced at the H8 shadow rate.

**First Enterprise customer:**

- Acquisition: 65 hours x $85 = **$5,525 imputed CAC**
- Year one revenue at the design partner price: $6,000
- The first deal is therefore roughly break-even against the founder's own time, before
  any of the fixed costs in 2.1. It is not a profitable sale. It is an investment in the
  answer library and the reference.

**Fifth Enterprise customer:**

- Acquisition: 40 hours x $85 = **$3,400 imputed CAC**
- Year one revenue at full price: $12,000
- Contribution after the imputed cost of time: **$8,600**

The curve is the whole point. The deals get dramatically better as the reusable assurance
assets accumulate.

**Lifetime value, Enterprise, at each renewal assumption:**

| Renewal rate (R1) | Revenue over life | Imputed CAC | LTV / CAC |
| --- | --- | --- | --- |
| 85% | 6,000 + 12,000 + 12,000 = $30,000 | $5,525 | **5.4x** |
| 50% | 6,000 + 6,000 + 3,000 = $15,000 | $5,525 | **2.7x** |
| 30% | 6,000 + 3,600 + 1,080 = $10,680 | $5,525 | **1.9x** |

At 85% this is an excellent business. At 30% it is a job. **The entire valuation of this
company sits on an input we have zero evidence for, in a product that structurally cannot
enforce the renewal it depends on.** That is the single most important sentence in this
document.

**Team tier, for contrast:** 6 hours x $85 = $510 imputed CAC against $1,165 net in year
one. It pays back inside the first year and it needs no pentest, no SLA and no warranty.
See section 5.3, because this matters more than it first appears.

---

## 5. Sensitivity

### 5.1 Break-even, stated as a choice about where to spend 630 hours

To cover the $27,240 midpoint fixed cost from one tier alone:

| Tier | Units needed | Hours needed at H3 to H7 | Hours per dollar of break-even |
| --- | --- | --- | --- |
| Enterprise at $12,000 | 3 customers (27,240 / 11,652 = 2.34) | ~173 h | Best |
| Enterprise at $6,000 design partner | 5 customers (27,240 / 5,826 = 4.68) | ~258 h | Good |
| Team at $1,200 | 24 customers (27,240 / 1,165 = 23.4) | ~144 h plus the demand to fill it | Good, if demand exists |
| Offline at $49 | **576 units** (27,240 / 47.28 = 576.2) | Not hours-bound. Audience-bound | Unknown |

Read the first and last rows against each other. **Three enterprise conversations and 576
individual credit card sales buy exactly the same thing.** With one person and 630 hours,
that comparison decides the go-to-market on its own. The Offline tier is a by-product of
having built the bundle for Enterprise, not a strategy.

### 5.2 The one input that moves everything: number of Enterprise customers

| Enterprise customers in year one | Revenue net of fees, all tiers, base Team and Offline volumes | Cash contribution |
| --- | --- | --- |
| 0 | $12,663 | ($14,577) |
| 1 | $18,489 | ($8,751) |
| 2 | $24,314 | ($2,926) |
| 3 (base case) | $30,140 | $2,900 |
| 4 | $35,966 | $8,726 |
| 5 (capacity ceiling) | $41,791 | $14,551 |

Each Enterprise customer is worth roughly $5,826 of contribution in year one at the design
partner price, and roughly $11,652 at full price. Nothing else in the model has that
leverage. Everything else is noise around this row.

### 5.3 The pentest is a bet, and it should be sequenced as one

C8 is $8,000 to $25,000 and it exists only to serve the Enterprise tier. Remove the
Enterprise tier and the year one fixed cost falls to roughly **$5,620 to $10,360**, a midpoint of $7,990.

This produces a genuinely different strategy that deserves to be on the table:

> **Team-only year one.** No pentest, no insurance, no warranty, no SLA. Sell SBOM, signed
> builds, a CVE stream and a questionnaire response at $1,200. Break-even is 5 to 9
> customers instead of 24, and the founder keeps almost all 630 commercial hours for
> building and for content.

The recommendation is not to choose between these upfront. It is to **sequence**: do not
buy the pentest until an Enterprise design partner has signed an order form that is
conditional on it. The deposit funds the test. Buying a $25,000 pentest for a tier with no
signed customer is the most likely way this company runs out of money, and it would be a
self-inflicted wound rather than a market outcome.

### 5.4 The Offline tier is entirely unmodelled and should be treated that way

Volumes in section 3 are placeholders. There is no audience, no traffic history and no
conversion data, so there is no honest basis for a number. What can be said structurally:
each unit nets $47.28, marginal cost is zero, and the tier requires no founder hours per
sale once the bundle exists. It is therefore **pure upside with a floor of zero**, and the
correct treatment is to exclude it from any decision. If it works it is a bonus. If it
produces nothing, no part of the plan above changes.

### 5.5 Founder hours

Halve H2 from 35% commercial to 17.5% commercial, say because the founder takes contract
work to pay rent, and the capacity ceiling falls from about 5 Enterprise customers to
about 2. From section 5.2 that is a swing from $14,551 of contribution to negative $2,926.

**A part-time founder makes the base case unreachable.** This is not a motivational point,
it is arithmetic, and it is the main reason the funding question in `FUNDING_POSTURE.md`
is really a question about the founder's runway rather than about the company's costs.

---

## 6. What has to be true

Ranked by how much damage the failure does.

1. **Three enterprise-shaped buyers exist and the founder can reach them within twelve
   months.** The only reason to believe this is the founder's own background: ex-KPMG IT
   advisory running ISO 27001 audits in banking and healthcare. He has sat on the buyer's
   side of exactly this vendor review. That network is the distribution channel, and it is
   the most valuable asset this company has. If it does not convert, nothing in section 3
   happens.
2. **The no-egress claim survives adversarial technical review by a bank's security team.**
   Today the claim is true by inspection and there are **zero tests**, so nothing prevents
   a future commit from quietly voiding it. Until a regression gate exists, the warranty in
   the Enterprise tier is an uncapped liability rather than a product feature.
3. **The `xlsx@0.18.5` HIGH severity CVE is closed before the first security review.** A
   live high severity CVE in a shipped dependency is an automatic fail. It does not reduce
   the probability of closing the Enterprise tier, it zeroes it.
4. **Renewal (R1) lands at 50% or better.** Below that the LTV/CAC in section 4 stops
   justifying the hours.
5. **The founder is full time.** See 5.5.
6. **The licence incoherence is resolved.** `LICENSE` says PROPRIETARY, `package.json` says
   private, the README reads open source. No procurement lawyer signs against contradictory
   terms, and no revenue arrives until one does.

---

## 7. What kills it

**K1. The free tier cannibalises the Enterprise tier.** The prospect's security team simply
approves the public URL, because it is genuinely safe, and then nobody needs to buy
anything. This is the most likely quiet failure and it is caused directly by our own best
feature. Mitigation is to make the Enterprise tier about artifacts and obligations that
the free URL cannot supply, which is exactly how `PRICING.md` is constructed, but the
mitigation is unproven and this risk should be watched in every single sales conversation.

**K2. Voluntary renewal collapses.** We cannot revoke a licence. A customer who stops
paying keeps a fully working copy. See the 30% row in section 4.

**K3. Founder capacity.** One person. Illness, a family event or a contract gig that pays
better removes the year. There is no redundancy anywhere in this model.

**K4. A large vendor ships browser-local analysis as a free feature.** Our defence is a
specific architectural claim, not a patent and not a network effect. If Microsoft or
Google ships local-only processing in a product these buyers already own, the wedge closes.
There is no good mitigation and it should not be pretended otherwise.

**K5. The RAM ceiling.** Computation happens in a browser tab, so the addressable dataset
is bounded by what fits in that tab's memory. A multi-gigabyte extract is out of scope by
construction. This caps which use cases, and therefore which deal sizes, are reachable.

**K6. One egress regression, uncapped.** A single `fetch` merged to main voids the
warranty across every customer at once. Two required mitigations: the regression test from
point 2 above, and **a liability cap in the MSA set at twelve months of fees paid.** Selling
an uncapped warranty on a property enforced only by code review is not a risk worth taking
at $12,000 a year.

---

## 8. Bookkeeping notes

- Annual Team and Enterprise fees are collected up front but earned over twelve months.
  Cash received is **deferred revenue**, not profit. Do not spend it as though it were.
- The $49 Offline perpetual licence is earned on delivery, because delivery is the whole
  performance obligation and there is no ongoing service behind it.
- The founder's hours at H8 are a shadow price used only for the CAC arithmetic in section
  4. They never enter the cash P&L and must not be added to the cost lines in section 3.
- Canadian R&D tax incentives may recover part of the engineering cost. Two real federal
  programmes worth a conversation with the accountant at C5:
  SR&ED, https://www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program.html
  and NRC IRAP, https://nrc.canada.ca/en/support-technology-innovation.
  No amount is modelled, because eligibility and value depend on facts not yet established.
