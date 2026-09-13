# PRISM Pricing Model

Owner: CFO
Date: 2026-09-13
Status: Proposal for founder decision. Not published. No tier below is live.

---

## 0. What this document is

This is the pricing model with the reasoning left in, so the founder can attack the
reasoning rather than argue about the numbers. Every external figure is either cited with
a URL or labelled ASSUMPTION with the thinking shown. Nothing here is a forecast.
Forecasts live in `UNIT_ECONOMICS.md`.

---

## 1. The structural fact

PRISM performs its computation on the user's own CPU. SheetJS parses in the tab. Pyodide
runs the Python statistics layer in a Web Worker via WebAssembly. Nothing is uploaded,
nothing is queried server side, nothing is stored by us.

Verified in this repository on 2026-09-13:

| Fact | Evidence |
| --- | --- |
| No network egress path in application code | No `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon` call anywhere in `src/` |
| Network policy is deny by default | `index.html` line 18: `default-src 'none'` |
| Outbound connections limited to one CDN | `connect-src 'self' https://cdn.jsdelivr.net/pyodide/` |
| No form can post anywhere | `form-action 'none'` |
| No embedding, no plugins | `frame-src 'none'; object-src 'none'` |
| Total shipped build | 1,294,138 bytes uncompressed across `dist/` |
| Largest single chunk | `dist/chunks/vendor-charts-*.js` at 564,384 bytes |

The financial consequence: **our cost to serve one more user is the cost of shipping
roughly 1.3 MB of static files once, plus whatever that user's browser pulls from a public
CDN that we do not pay for.** There is no inference bill, no query bill, no storage bill
and no egress bill tied to how hard anyone uses the product.

Static asset bandwidth on Cloudflare Pages is unmetered on every plan including the free
plan, which means the marginal hosting cost of an additional free user can be literally
zero rather than approximately zero
(https://developers.cloudflare.com/workers/platform/pricing/, as reported September 2026,
verify before relying on it contractually).

---

## 2. The structural problem that comes with it

The same architecture that zeroes our cost also removes our ability to bill by usage.

`connect-src` permits exactly two destinations: our own origin and the Pyodide CDN.
`form-action` is `none`. There is therefore **no license check, no seat count, no usage
meter and no telemetry, and there cannot be one without relaxing the Content Security
Policy.** Relaxing the CSP to add a license callback would convert the one defensible
claim we have into marketing copy. That trade is not available at any price.

So the pricing model cannot be the normal SaaS model. We are not able to sell metered
access, and we should stop designing around the hope that we can. What we sell instead:

1. **An artifact.** A signed, versioned, offline bundle the customer holds.
2. **Assurance.** The paperwork a regulated buyer needs in order to be allowed to use it.
3. **Obligation.** Our contractual promises, response times and liability.

Only item 1 is the software. Items 2 and 3 are where the money is, and critically **items
2 and 3 expire.** An SBOM goes stale. A pentest report describes a release that is no
longer current. A completed security questionnaire ages out of a vendor file. That decay
is the honest mechanism for recurring revenue in a product that cannot phone home.

> Design principle: sell the thing that expires, give away the thing that does not.

---

## 3. What near-zero COGS actually buys us

Three distinct advantages. They are often collapsed into one and they should not be.

### 3.1 Pricing power is decoupled from cost entirely

A cloud analytics vendor has a cost floor that rises with usage. Google BigQuery on-demand
query pricing is $6.25 per TiB scanned (as reported September 2026 from Google Cloud's
published pricing, verify at https://cloud.google.com/bigquery/pricing). Any product built
on a warehouse inherits a per-query marginal cost, must price above it, must meter, and
must design a plan structure that protects itself from a heavy user.

We have no floor. Our price is set purely by value delivered and willingness to pay. The
practical consequence is not "charge less". It is **charge whatever the buyer values, and
never let cost recovery distort the plan structure.** Zero COGS is a reason to price
confidently at the top and a reason to give away the bottom. It is not a reason to be
cheap in the middle.

### 3.2 We can be genuinely generous at the free tier, permanently

A cloud competitor cannot offer unlimited free analysis of a 500 MB file, because every
run costs them money and a free user is a drag on their gross margin. For us that same
user costs one 1.3 MB download. They can run a hundred regressions on a 500 MB file and
our bill does not move by a cent.

So our free tier should not be a trial. It should be a permanent, unlimited, no-account,
no-email product. See section 4.

### 3.3 We can price flat and never punish heavy use

Every usage-metered competitor has to charge more when the customer uses the product more,
which teaches the customer to use it less. We can charge a flat fee and actively encourage
maximum use. For an analytics tool that is a real behavioural difference, because the
customers who use it most are the ones who renew.

### 3.4 Gross margin, computed rather than claimed

Our cost of revenue is payment processing plus hosting plus nothing.

Stripe's published standard rate for online card payments is 2.9% plus 30 cents per
successful charge (https://stripe.com/pricing, verify the current rate before modelling).

On a $12,000 annual enterprise invoice paid by card: $348.30 in fees, which is 2.90% of
revenue. Hosting contribution is effectively nil at our volumes. **Gross margin on
software revenue lands around 97%.** Invoicing by bank transfer instead of card pushes it
higher.

The honest qualifier: that is gross margin, not contribution margin. The Enterprise tier
consumes founder hours, and founder hours are the real cost of that revenue. That analysis
is in `UNIT_ECONOMICS.md` section 4 and it materially changes the picture. Do not quote
the 97% figure without it.

### 3.5 The free ride we should declare out loud

Our COGS is near zero partly because the browser pulls Pyodide from jsDelivr, a public CDN
we do not pay for. That is legitimate and it is how the CSP is written today. Two things
follow:

- **Risk.** A third party controls availability of a runtime our product needs. If jsDelivr
  changes terms, rate limits us, or is blocked by a corporate proxy, the free product stops
  working for that user. In a locked-down bank network, being blocked is the likely case,
  not the edge case.
- **Cost.** The paid offline bundle must self-host Pyodide, which is precisely what makes
  it worth paying for. Self-hosting it for the free hosted tier would move that egress onto
  our bill.

  ASSUMPTION: the Pyodide runtime plus the scientific packages is in the tens of megabytes
  per cold load. Reasoning: it ships a CPython build compiled to WebAssembly plus NumPy and
  pandas wheels, which are large by construction. This has not been measured in this repo
  and must be measured before any decision to self-host the free tier.

Recommendation: keep the free tier on the public CDN, make self-hosted Pyodide a paid
feature, and measure the real byte count before revisiting.

---

## 4. The tiers

Prices in USD. Annual tiers billed annually in advance.

### Tier 0: PRISM (free, hosted)

**$0. Forever. No account. No email. No card. No usage limit.**

Includes every analytical capability in the product: Excel and CSV ingestion, column
type inference, descriptive statistics, the automated insight pass and the chart layer.
The only limit is the user's own RAM, which is a limit imposed by physics rather than by us.

Why free and why unlimited:

- The marginal cost is one static download. Gating it protects revenue we could not have
  collected anyway, because we have no meter.
- Trust is the entire product. A tool that claims your data never leaves your machine and
  then demands your email address before it will open a spreadsheet has already lost the
  argument. **The absence of a signup form is itself a product feature, and it is also the
  strongest available demonstration of the CSP.**
- It is our whole distribution strategy. A security-conscious analyst can verify the claim
  in their own browser dev tools in ninety seconds without talking to us. That is a sales
  motion with a zero dollar cost per lead.

What it deliberately does not include: anything written down. No SBOM, no signed build, no
support, no contract, no offline bundle, no warranty. That is the boundary.

---

### Tier 1: PRISM Offline (individual)

**$49 one time, per major version. Optional upgrade to the next major version at $29.**

A signed, checksummed bundle that runs from a local folder or a USB stick with the network
cable unplugged. Pyodide is bundled rather than pulled from a CDN, so it works in an
air-gapped room. Licensed to one named person, including commercial use in their own work.

Why one time rather than a subscription: because we cannot enforce a subscription. There is
no call home and there will never be one. Selling a recurring licence that we are unable to
verify, and which the customer's copy will keep working without, is a model that depends on
the customer not noticing. That is a bad business and a worse fit for a company whose whole
pitch is technical honesty. A perpetual licence matches what the software actually does.

Why $49: it is close to the highest price a working analyst can put through without asking
anyone.

ASSUMPTION: individual professional discretionary software spend clears without approval
below roughly $50 to $100 in most organisations. Reasoning: this is the common corporate
card and expense-policy threshold band. It has not been validated for PRISM's specific
buyer and should be tested in the first twenty sales conversations.

Pricing at $49 rather than $99 trades revenue per unit for a wider base of people who
become internal advocates for the Team tier, which is where the money is.

Boundary from Tier 0: the boundary is not features. It is **location and provenance.** Free
runs from our URL over the internet. Paid runs from your disk in a room with no network,
and arrives with a signature you can verify. An auditor cares about that difference. It
costs us nothing extra to produce.

---

### Tier 2: PRISM Team

**$1,200 per year. Up to 25 named users at one legal entity.**

Everything in Offline, plus the assurance artifacts:

- Current SBOM in CycloneDX format, refreshed each release
- Signed releases with published checksums
- A dependency CVE stream with a stated remediation window
- A completed standard security questionnaire (CAIQ-lite or SIG-lite shape), refreshed annually
- Internal redistribution rights within the entity, for example on an internal file share

Why $1,200: that is $48 per seat per year at the 25 seat ceiling, deliberately far below
per-seat BI tooling. For comparison, as reported September 2026: Microsoft Power BI Pro is
$14 per user per month (https://www.microsoft.com/power-platform/products/power-bi/pricing)
and Tableau Creator is $75 per user per month with Viewer at $15
(https://www.tableau.com/pricing/teams-orgs). We are not competing with those products on
capability and should not price as though we were. We are a specific tool for a specific
situation: data that is not allowed to go to those products at all.

Boundary from Tier 1: the boundary is **paperwork with a named counterparty.** A company
cannot file a $49 receipt in a vendor risk register. The moment a real organisation wants
to use this on real data, someone in their second line of defence asks for an SBOM and a
questionnaire response, and that request needs a legal entity on the other end to answer
it. That is the product being sold here.

---

### Tier 3: PRISM Enterprise

**$12,000 per year floor. Unlimited internal seats at one legal entity.**

Everything in Team, plus the things that cost us human time:

- Intranet or internal portal deployment rights
- A third-party penetration test report covering the current release
- A named security contact and a 48 hour response commitment on security questions
- **A contractual warranty on the no-egress property in the MSA**, not just a claim on a website
- Vendor review support: we complete the customer's own security questionnaires, DPIA
  inputs and procurement forms

Why the ten times step up from Team: because this is the first tier where our marginal cost
stops being zero. Everything in Tier 2 is an artifact we produce once and hand to everyone.
Everything in Tier 3 is founder hours spent on one named customer, plus a pentest we have
to buy, plus liability we have to carry. The price must step hard at exactly the point
where scalable cost becomes unscalable cost, or the tier eats the company.

Why the warranty matters more than the pentest: a bank's third line does not want a promise,
it wants a counterparty who is contractually liable if the promise turns out to be false.
We can make that promise cheaply and safely because it is architecturally true. A cloud
competitor cannot make it at any price. **This is the most valuable line item in the entire
price list and its marginal cost is zero.**

Boundary from Tier 2: the boundary is **us taking on obligations.**

---

### Tier 4: Source and OEM

**Quoted. Floor $50,000 per year.**

Source access and the right to embed PRISM inside the customer's own product or internal
platform. Term licence, not perpetual.

Why a floor and why quoted: embedding rights give away our future direct sales into that
customer's entire install base. The price has to reflect the channel we are closing off,
which is specific to each deal and cannot be listed. The floor exists so the conversation
starts in the right order of magnitude.

Honesty note: there is no evidence of demand for this tier today. It is listed because it
should exist as a ceiling anchor and because the question will eventually be asked, not
because it is forecast to sell. It carries zero revenue in the base case in
`UNIT_ECONOMICS.md`.

---

## 5. Summary table

| Tier | Price | What the money actually buys | Our marginal cost |
| --- | --- | --- | --- |
| PRISM (hosted) | $0 forever | The full tool. No account, no limits | About 1.3 MB of static bandwidth |
| PRISM Offline | $49 one time, per major version | Signed air-gap bundle, self-hosted runtime | Effectively zero |
| PRISM Team | $1,200 / year | SBOM, signed builds, CVE stream, questionnaire | Artifact production, amortised across all customers |
| PRISM Enterprise | $12,000 / year floor | Pentest, SLA, contractual no-egress warranty, vendor review support | Founder hours. Not zero |
| Source / OEM | Quoted, $50,000 / year floor | Source access, embedding rights | The direct channel we give up |

---

## 6. Design partner programme

The first three Enterprise customers at **$6,000 for year one, full $12,000 on renewal**,
in exchange for two things:

1. A named public reference, subject to their approval of the wording.
2. Their completed security questionnaire, retained by us as a reusable answer library.

The second item is the real consideration. Every enterprise security review after the first
gets cheaper in founder hours because the answers already exist. Since founder hours are
the binding constraint on this business (see `UNIT_ECONOMICS.md` section 4), buying down
the hours cost of the next deal is worth more than the $6,000 of discounted revenue.

The discount is explicitly year one only and must be written that way in the order form,
not agreed verbally.

---

## 7. What must be true before any of this can be sold

These are not engineering preferences. They are revenue blockers, and they are the reason
no tier above is live today.

1. **The `xlsx@0.18.5` HIGH severity prototype pollution CVE must be resolved.** A known
   high severity CVE in a shipped dependency is an automatic fail in a bank or hospital
   vendor review. It blocks Tier 2, Tier 3 and Tier 4 completely. The CSP already
   whitelists `cdn.sheetjs.com`, so the migration path is open.
2. **The licence position must become coherent.** `LICENSE` says PROPRIETARY,
   `package.json` says `private: true`, the README reads like an open source project. You
   cannot sell a licence to something whose own terms contradict each other, and no
   procurement lawyer will sign against it.
3. **The unverified compliance claims must come out of the README.** "ISO/IEC 27001:2022
   Compliant" and "WCAG 2.2 Level AAA" are currently asserted with nothing behind either.
   Selling to buyers whose job is verifying exactly those claims, with a founder whose own
   background is ISO 27001 audit work, makes this an unforced credibility risk and a
   possible misrepresentation exposure. Acceptable replacements where true: "architected
   against" or "designed to the requirements of". Neither claim may appear in a price list,
   an order form or a procurement response until a third party has verified it.
4. **Tests must exist for the no-egress property specifically.** The claim is currently true
   by inspection. It needs to be true by regression gate, so that one careless import in a
   future commit cannot silently void the only thing we sell. Until that gate exists, the
   contractual warranty in Tier 3 is an uncapped liability rather than a product feature.

Items 1 to 3 cost nothing but attention. Item 4 is in progress with the engineering team.

---

## 8. Open questions for the founder

1. Is the $49 individual tier worth the support burden it creates, or should individuals
   simply use the free hosted product and the paid line start at Team? There is a serious
   argument that a $49 tier generates a disproportionate share of email volume against a
   trivial share of revenue.
2. Should Team be priced per entity or per site? Per entity is simpler to sell and simpler
   to honour. Per site extracts more from large customers but starts an argument we cannot
   win, because we have no way to observe where the software is running.
3. USD or CAD? The founder is Toronto based. USD is the default for this buyer and removes
   an FX conversation from the sale, but it creates an FX exposure against CAD costs.
