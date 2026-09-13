# PRISM Funding Posture

Owner: CFO
Date: 2026-09-13
Status: Recommendation to the founder. This is a position, not a menu.

---

## The recommendation

**Bootstrap. Do not raise. Do not take a meeting about raising.**

Revisit this document only when one of the three named triggers in section 6 actually
fires, not when someone offers, not when a peer raises, and not when the work gets hard.

The rest of this document is why, written so you can attack the reasoning.

---

## 1. There is almost nothing to fund

Capital exists to buy things you cannot earn your way to. Look at what PRISM actually
needs money for, from `UNIT_ECONOMICS.md` section 2.1:

| What | Cost | Can it be customer-funded or deferred? |
| --- | --- | --- |
| Static hosting | $0 to $240 / yr | Zero on Cloudflare's free plan (https://developers.cloudflare.com/workers/platform/pricing/) |
| Domain | $20 / yr | Trivial |
| Legal entity | $300 to $1,500 one time | Required before the first invoice. Small |
| Legal templates (MSA, EULA, order form) | $3,000 to $6,000 | Deferrable until the first Team or Enterprise sale is in sight |
| Accounting | $1,500 / yr | Follows revenue |
| Insurance | $1,500 to $4,000 / yr | Only needed for the Enterprise tier. Deferrable |
| **Penetration test** | **$8,000 to $25,000** | **Deferrable, and should be conditional on a signed order form** |
| Code signing certificate | $200 to $500 / yr | Small |

The pentest is between 53% and 64% of the entire year one cash cost, and it is the only
item that looks like it needs financing. It does not, because it can be sequenced behind a
customer commitment (`UNIT_ECONOMICS.md` section 5.3).

**Founder cash genuinely at risk before the first dollar of revenue: roughly $350 to
$1,550.** That is the entity, the domain, the payment account and the signing certificate.
Everything else waits for a customer.

A company whose pre-revenue cash exposure is under two thousand dollars does not have a
financing problem. There is no inference bill to prepay, no GPU reservation, no data
warehouse minimum, no cloud commit. The architecture that makes COGS near zero also makes
the capital requirement near zero. **Those are the same fact, and it should be obvious what
follows from it.**

---

## 2. Venture money would buy the destruction of the moat

This is the argument that settles it, and it is structural rather than stylistic.

The one claim that matters is that no bytes leave the machine. It is enforced by a Content
Security Policy in `index.html`: `default-src 'none'`, `connect-src` limited to our own
origin and the Pyodide CDN, `form-action 'none'`.

Now consider what an institutional investor needs, reasonably and in good faith, after
wiring money:

- Activation and retention metrics, which require product analytics, which require an
  outbound connection.
- A usage-based or seat-based revenue model that can be shown to compound, which requires
  metering, which requires a license check, which requires an outbound connection.
- Growth experiments measured on real user behaviour, which require an outbound connection.

Every single one of those requires relaxing `connect-src`. **The moment PRISM can phone
home for any reason at all, the sentence that the entire company rests on becomes false,
and a technically literate buyer at a bank will discover that in ninety seconds with dev
tools open.**

So the trade on the table is: accept capital, and in exchange accept a governance structure
whose ordinary and legitimate expectations can only be satisfied by breaking the product.
That is not a trade with a price. It is a trade to decline.

The counter-argument is that a sympathetic investor would understand and never ask. Some
would. But you would be betting the only defensible asset in the company on the personal
forbearance of someone who has a fiduciary duty to their own fund, across a five to ten
year horizon and possibly a change of partner at the firm. Do not structure a company so
that its core property survives only by goodwill.

---

## 3. You would be selling at the worst price you will ever have

Honest inventory of what a term sheet would be priced against today:

- 6,108 lines of code across 20 files and 7 commits, last touched January 2026
- Zero tests, although an engineering team is closing that now
- A live HIGH severity prototype pollution CVE in `xlsx@0.18.5` with no npm fix available
- `LICENSE` says PROPRIETARY, `package.json` says private, the README reads open source
- README asserts WCAG 2.2 AAA and ISO/IEC 27001:2022 with nothing verified behind either
- No users, no revenue, no waitlist, no design partner

Every one of those is fixable in weeks and most cost nothing but attention. Items two,
three, four and five are on the critical path to revenue anyway
(`UNIT_ECONOMICS.md` section 6). Raising before fixing them means paying for them in
equity at the lowest valuation this company will ever carry, to fix problems that will get
fixed regardless.

Illustrative arithmetic on what that costs, labelled clearly:

> ASSUMPTION, purely illustrative to show the shape of the trade, not a claim about any
> real market terms: a $500,000 round at a $2,500,000 post-money valuation is 20% dilution.
> Against the base case in `UNIT_ECONOMICS.md` of roughly $31,000 of year one gross revenue, that
> capital is being raised entirely on narrative. Reasoning: I have no basis for asserting
> what terms would actually be available and I am not going to invent one. The point of the
> arithmetic is only that 20% of the company is an enormous price for money that section 1
> shows is not needed.

---

## 4. The asset is not the shape venture capital buys

A venture asset needs revenue that decouples from headcount. PRISM's does not, yet.

From `UNIT_ECONOMICS.md` section 2.2, the binding constraint is founder hours, and almost
all revenue sits in the Enterprise tier whose sales motion is a vendor security review at
a bank or hospital. That review is won by someone who has run ISO 27001 audits in those
sectors and can speak to a second line of defence in their own vocabulary.

**That is the founder specifically. It does not transfer to a junior salesperson, which
means hiring salespeople with raised money does not relieve the constraint.** It converts
cash into headcount that cannot do the one thing the company needs done. This is the
failure mode where a company raises, hires a sales team, discovers the founder still has
to be on every call, and ends up with a burn rate and the same ceiling.

The constraint that money *can* relieve is the founder's own time, and the mechanism for
that is the reusable answer library in `PRICING.md` section 6, which is bought with the
first three design partner deals rather than with equity.

---

## 5. What to do instead, with a sequence and dollar amounts

Revenue first, customer-funded, in this order. Do not run these in parallel.

**Phase 0. Weeks 0 to 6. Cost: $0. Founder hours only.**
Close the four revenue blockers in `PRICING.md` section 7. Migrate `xlsx` to the SheetJS
CDN build to clear the CVE, which the CSP already permits. Make `LICENSE`, `package.json`
and the README tell one consistent story. Remove the unverified WCAG AAA and ISO 27001
claims and replace them with "architected against" where that is true. Land the no-egress
regression test so the claim is enforced by a gate rather than by memory. **None of this
costs money and all of it is required before anyone can buy anything.**

**Phase 1. Weeks 6 to 12. Cost: $350 to $1,550.**
Incorporate, register the domain, open the payment account, buy the code signing
certificate. This is the minimum apparatus required to accept money. It is also the entire
amount of founder cash genuinely at risk.

**Phase 2. Weeks 12 to 24. Cost: $3,000 to $6,000, ideally funded by Phase 2 revenue.**
Build the signed offline bundle with Pyodide self-hosted, produce the SBOM, write the
standard security questionnaire answers once. Sell the **Team tier at $1,200** with no
pentest, no insurance and no SLA, so break-even is 5 to 9 customers rather than 24
(`UNIT_ECONOMICS.md` section 5.3). Commission the legal templates when the first Team sale
is in sight, not before.

**Phase 3. Trigger-based only. Cost: $8,000 to $25,000 plus insurance.**
Buy the penetration test **only when an Enterprise design partner has signed an order form
that is conditional on it.** The deposit funds the test. Commissioning a $25,000 pentest
for a tier with no signed customer is the single most plausible way this company runs out
of money, and it would be self-inflicted rather than a market outcome.

**Non-dilutive money worth one conversation with the accountant, not a campaign.** Two real
federal programmes:
SR&ED, https://www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program.html
and NRC IRAP, https://nrc.canada.ca/en/support-technology-innovation.
No amount is modelled anywhere, because eligibility and value depend on facts not yet
established. Ask, do not assume.

---

## 6. The three triggers that would change this recommendation

Written as falsifiable conditions so that the decision is not made on mood.

**Trigger A: demand exceeds hours.** Two or more Enterprise opportunities are in the
pipeline that the founder demonstrably cannot service inside the 630 commercial hours in
`UNIT_ECONOMICS.md` section 2.2, and they are losing to the delay. Then raise, but raise
specifically to hire a security-literate solutions engineer who can carry a vendor review,
and size the raise to that hire and nothing else.

**Trigger B: a single customer needs a deployment that needs a team.** For example an
internal distribution across tens of thousands of seats with per-release attestation and a
managed update channel. That is a contract, not a market bet, and the right instrument is
financing against the signed contract, which means debt or revenue-based financing rather
than equity. **Never sell equity to fund work a customer has already agreed to pay for.**

**Trigger C: a large vendor ships browser-local analysis inside a product these buyers
already own** (risk K4 in `UNIT_ECONOMICS.md` section 7) and speed becomes existential.
This is the only genuine equity case on the list, and it is a bad position to be raising
from. Watch for it rather than plan for it.

Notably absent from this list: running out of personal runway. That is a real problem and
section 7 addresses it, but it is not a reason to sell equity in the company.

---

## 7. The honest addendum about founder runway

The financing question that actually matters here is not the company's costs. It is how
many months the founder can work on this full time.

`UNIT_ECONOMICS.md` section 5.5 is blunt about it: halve the commercial hours because the
founder takes contract work to pay rent, and the year one capacity ceiling falls from about
five Enterprise customers to about two, which swings cash contribution from roughly
$14,551 to roughly negative $2,926. **A part-time founder makes even the base case
unreachable.**

So the real decision tree is about personal runway, and the recommendation splits:

- **Nine months or more of full-time runway:** execute Phases 0 to 3 exactly as written and
  do not raise. This is the good case and it is the one to aim for.
- **Under nine months:** do not raise on that basis either, at least not first. Pre-revenue
  money raised to pay a founder's salary, with no users and seven commits, is the hardest
  money to raise and the most expensive by a wide margin. Extend the runway with contract
  work, accept a longer calendar and a lower year one ceiling, and get through Phase 0 and
  Phase 1 regardless, because they cost hours and $1,550. A small angel bridge to buy
  founder months only becomes a sane conversation **after** the first design partner has
  signed, because at that point you are selling evidence instead of a story, and the price
  of the equity changes accordingly.

---

## 8. What money cannot buy here, which is most of what this company needs

Worth listing plainly, because it is the compressed version of the whole argument:

- **It cannot buy the network.** The ex-KPMG IT advisory background, running ISO 27001
  audits in banking and healthcare, is the distribution channel. It is not purchasable and
  it is already owned outright.
- **It cannot buy trust.** Trust here comes from a CSP a stranger can read and a dev tools
  network tab a stranger can watch. Capital cannot accelerate that and, per section 2, is
  structurally inclined to erode it.
- **It cannot buy the pentest result.** It can buy the test. The result depends on the code
  being right, which is Phase 0 work.
- **It cannot buy renewal.** Renewal in this product is voluntary by construction, because
  there is no call home and no revocation (`UNIT_ECONOMICS.md` R1). It is earned with
  refreshed artifacts and answered questions, and no amount of capital substitutes for that.

The one thing money could buy is time, and section 7 says how to think about that, and says
to buy it later and cheaper.

---

## 9. One line to carry out of this document

The architecture that removed the server also removed the reason to raise. Keep the server
gone and keep the cap table clean, and let the first three design partners fund everything
else.
