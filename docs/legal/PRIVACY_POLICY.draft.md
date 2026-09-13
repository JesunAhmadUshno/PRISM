# PRISM Privacy Policy (DRAFT)

> ## NOTICE: READ BEFORE USING THIS DOCUMENT
>
> **This is a non-binding draft prepared by an AI system. It is not legal advice,
> it does not create a lawyer-client relationship, and it must not be published,
> linked, relied on, or shown to a customer until a qualified lawyer licensed in
> the relevant jurisdiction has reviewed and approved it.**
>
> The relevant jurisdictions for PRISM as currently constituted are, at minimum:
> Ontario and Canada federally (PIPEDA), the European Economic Area and the United
> Kingdom (GDPR and UK GDPR) if the site is reachable from there, and California
> (CCPA/CPRA) on the same reasoning. A privacy policy is a public representation.
> A false or overstated one is a deceptive-practice risk in every one of those
> jurisdictions independently of any privacy-law breach.
>
> Several items in this draft carry named OPEN ITEMS that counsel must close
> before publication. They are listed in Part C and flagged inline.
>
> Document status: DRAFT v0.1
> Prepared: 2026-09-13
> Verified against: repository at `C:/Users/Jesun/PRISM`, branch `army/prism-upgrade`
> Draft author: AI. Reviewing lawyer: **NOT YET ASSIGNED**

---

## Part A: Verification record (internal, remove before publication)

A privacy policy that says "we collect nothing" is only an asset if it is true.
Counsel should not take the founder's word for it, and did not take it here. This
section records exactly what was checked, so that a reviewing lawyer, a customer's
security team, or a regulator can re-run the same checks rather than trust a
summary. Everything below was verified directly against the working tree on
2026-09-13.

### A.1 Does the application store anything on the user's device?

Command run:

```
grep -rni "localstorage\|sessionstorage\|indexeddb\|document\.cookie" src/
```

Result: **zero matches.** No cookie is set. No Web Storage key is written. No
IndexedDB database is opened. There is no service worker registration in `src/`.

Legal consequence: this is why PRISM needs no cookie banner and no consent
mechanism under the ePrivacy Directive Article 5(3) or its national
implementations, which regulate storing information on, or gaining access to
information stored on, a user's terminal equipment. PRISM does neither. This
should be re-verified by CI rather than by memory. See Part C, Open Item 3.

### A.2 Does the application transmit user data anywhere?

Commands run:

```
grep -rn "fetch(\|XMLHttpRequest\|WebSocket\|sendBeacon\|EventSource" src/
grep -rni "analytics\|telemetry\|gtag\|posthog\|sentry\|mixpanel\|amplitude" src/
```

Result: exactly one production `fetch()` call site, at
`src/workers/prism.worker.js:1244`. It is not a data-transmitting call. It is a
download of the Python runtime, and it is described in full in Part B, Section 4
below. There is no `XMLHttpRequest`, no `WebSocket`, no `sendBeacon` and no
`EventSource` anywhere in `src/`. The second grep returns only the product's own
feature names (for example the "Analytics Workspace" component), never a vendor
library. There is no analytics SDK, no error-reporting SDK and no tag manager.

### A.3 Is that enforced by the browser, or only by code review?

This is the question that separates a real architectural guarantee from a promise.
As of this commit the answer is **the browser enforces it**, and the mechanism is
worth recording because it is subtle and easy to lose.

`index.html` carries a `<meta http-equiv="Content-Security-Policy">` with
`default-src 'none'`, `connect-src 'self' https://cdn.jsdelivr.net/pyodide/`,
`form-action 'none'`, `object-src 'none'` and `frame-src 'none'`.

A `<meta>` CSP governs the document. It does **not** automatically govern a
dedicated Web Worker loaded from an `https:` URL: such a worker takes its policy
from its own script's HTTP response headers, and the GitHub Pages deploy target
cannot send response headers. A worker created that way would run with the network
open to every origin, while holding the user's entire spreadsheet in memory.

PRISM does not create the worker that way. At `src/stores/prismStore.ts:178` the
worker source is wrapped in a `Blob` and the worker is constructed from a `blob:`
URL. `blob:` is a local scheme, so the resulting worker inherits the creating
document's policy container, which is the `<meta>` CSP above. The comment at
`src/stores/prismStore.ts:173` states this reasoning in the code itself.

Legal consequence: the statement "the browser will not permit this application to
send your file anywhere" is defensible as written, not merely aspirational. It is
a statement about an enforcement mechanism, which is a stronger and more honest
claim than a statement about intent. Counsel should nonetheless treat it as a
property that can regress in a single commit, which is why Open Item 3 asks for a
regression test rather than a footnote.

### A.4 Who hosts the page?

`.github/workflows/deploy.yml` publishes to GitHub Pages via
`actions/deploy-pages@v4`, and `vite.config.ts` line 36 sets `base: '/PRISM/'`.
GitHub Pages logs visitor IP addresses. This is disclosed in Part B, Section 5.

### A.5 Scope limit on this verification

This verification covers `src/`, `index.html`, `vite.config.ts` and the deploy
workflow at one commit. It does not cover: third-party npm dependencies at runtime
beyond the CSP boundary that constrains them, the Pyodide WebAssembly runtime's
internal behaviour beyond the integrity guard described below, browser extensions
installed by the user, or any future commit. Part B, Sections 6 and 7 say so
publicly rather than leaving it implied.

---

## Part B: The policy (proposed published text)

> Everything from here to the end of Part B is intended for publication once
> approved. Parts A and C are internal and must be removed from the published
> version.

---

# Privacy Policy

**Effective date:** [TO BE SET ON PUBLICATION]
**Last updated:** [TO BE SET ON PUBLICATION]
**Applies to:** the PRISM web application at [CANONICAL URL TO BE CONFIRMED] and
any offline or self-hosted build distributed under the name PRISM.

## 1. The short version

PRISM does not collect your data, because PRISM has nowhere to send it.

Your spreadsheet is opened by your browser, analysed by your browser, and charted
by your browser. It is never uploaded. There is no PRISM account, no PRISM login,
no PRISM server that receives files, and no PRISM database. We could not produce a
copy of your data in response to a subpoena, a court order, a government demand,
or our own curiosity, because we never receive one.

This is not a promise about what we choose to do. It is a description of what the
software is able to do. Section 7 tells you how to verify it yourself in about two
minutes, without trusting anything written on this page.

## 2. What we collect

**Nothing that you put into the application.**

Specifically, we do not receive, store, transmit, log, process, sell, share or
disclose:

- the contents of any file you open in PRISM
- the name, size or type of any file you open in PRISM
- column headings, row counts, cell values, or any sample of them
- the statistical results, charts or insights PRISM produces
- which analyses you run, or in what order
- any account, email address, name or payment detail, because PRISM asks for none

We also do not use cookies, local storage, session storage, IndexedDB, browser
fingerprinting, session recording, heatmaps, advertising pixels, or any analytics
or product-telemetry service of any kind. PRISM writes nothing to your device and
reads nothing from it other than the file you explicitly choose to open. When you
close or reload the tab, everything PRISM held is gone, including from PRISM's own
memory. There is nothing to delete, because nothing was kept.

## 3. Why there is no "data subject rights" section in the usual form

Privacy law gives you rights of access, correction, deletion, portability and
objection over personal data a company holds about you. Those rights are
meaningful against a company that holds data. We hold none.

- **Access:** we have nothing to give you. We cannot identify you.
- **Deletion:** already satisfied. Closing the tab is the deletion.
- **Portability:** your data never left the file you already have.
- **Objection and restriction:** there is no processing by us to object to.

If you believe this is wrong, or you believe we hold something about you, contact
us at the address in Section 9 and we will investigate and answer you. We would
rather be told we are wrong than be quietly wrong.

## 4. The one network request PRISM makes, described precisely

PRISM is explicit about this rather than silent, because a security reviewer will
find it in thirty seconds and their conclusion should be "they disclosed it
accurately," not "they hid it."

PRISM runs Python inside your browser using Pyodide, a build of the Python
interpreter compiled to WebAssembly. That interpreter is far too large to bundle
into a web page, so it is downloaded from a public software distribution network,
jsDelivr, at:

```
https://cdn.jsdelivr.net/pyodide/v0.25.1/full/
```

**That request travels in one direction: it downloads a general-purpose Python
runtime to you. It carries no part of your file.**

### 4.1 What that request necessarily reveals to the network operator

Any HTTP request reveals certain things by the nature of the protocol, whatever a
policy says about them. When your browser downloads the Python runtime, the
operator of that network, and any network between you and it, can observe:

- your **IP address**, and therefore your approximate geographic location and your
  internet service provider or corporate network
- the **date and time** of the request
- your **User-Agent string**, which identifies your browser and operating system
- the **file paths requested**, which reveal that you are downloading Pyodide
  version 0.25.1 and which Python packages were loaded
- TLS connection characteristics normally visible to any web server

### 4.2 What that request does not reveal

- **no part of your file's contents**
- **no filename, file size or file type**
- **no column names, row counts or cell values**
- **no analysis result, statistic, chart or insight**
- **no cookie and no session identifier.** The request is issued with
  `credentials: 'omit'`, which instructs the browser not to attach cookies or
  other credentials. The network operator therefore cannot use a cookie to link
  this request to any other request you have ever made to it.

### 4.3 The one inference we will not pretend away

PRISM loads the SciPy statistics package only when you run a statistical test,
rather than loading it upfront. The request for that package is therefore a coarse
behavioural signal: an observer of that network can infer that some visitor at
your IP address ran a statistical test at that moment. It does not reveal which
test, on what data, or with what result. We state it because it is true, and
because a reviewer who found it unmentioned would be right to distrust everything
else on this page.

### 4.4 The connection is opened before you choose a file

The page contains a `preconnect` hint for that network, which means your browser
performs the DNS lookup and opens the connection while the page is loading, before
you have selected anything. If you open PRISM and close it again without touching
a file, the network operator may still have seen your IP address. This is a speed
optimisation, not a data-collection mechanism. We disclose it because "one network
request" would otherwise be misleading about timing.

### 4.5 What PRISM does to make that download safe

The Python runtime is executable code, and it runs in the same thread that holds
your data. PRISM therefore does not trust the network to serve the right bytes.

Every runtime file PRISM loads carries a pinned SHA-384 cryptographic digest
recorded in the application's own source code. The browser verifies the downloaded
bytes against that digest before a single instruction executes. If the
distribution network were compromised, or a network operator substituted different
code, the digest would not match and the file would be rejected rather than run.
The application additionally installs a guard that refuses to load any file from
that location which does not carry a pinned digest.

### 4.6 Your relationship with the network operator

Your browser's request to jsDelivr is a request you make to a third party, not a
request we make on your behalf, and that operator's own privacy practices apply to
it. We name it so that you can read them:

- jsDelivr policies: https://www.jsdelivr.com/terms

> **DRAFT FLAG, INTERNAL:** The exact legal operator of `cdn.jsdelivr.net` and the
> correct privacy-policy URL must be confirmed by counsel before publication.
> Public sources encountered during drafting were not consistent, referring to more
> than one entity in connection with different parts of the jsDelivr service. This
> draft deliberately does not name a legal entity, because naming the wrong one in
> a published privacy policy is worse than naming none. See Part C, Open Item 1.

### 4.7 How to eliminate this request entirely

If your environment forbids any outbound connection, the runtime can be served
from the same origin as the application itself instead of from a public network.
The digests do not change, because the files are byte-for-byte identical. The
source code notes this at `src/workers/prism.worker.js:18`. Contact us about a
self-hosted or offline build.

## 5. Website hosting

The PRISM web page is currently served by **GitHub Pages**, a service of GitHub,
Inc. GitHub operates the web servers that deliver the page's HTML, JavaScript and
images to your browser. Like effectively every web host, GitHub logs requests.

GitHub's own documentation states:

> "When a GitHub Pages site is visited, the visitor's IP address is logged and
> stored for security purposes, regardless of whether the visitor has signed into
> GitHub or not."
>
> Source: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

What this means for you:

- GitHub may log your **IP address, the time of the request, and the page
  requested**, for security purposes.
- GitHub does **not** receive your data file, because your data file is never sent
  to the web server. Loading the page and analysing a file are separate events;
  only the first involves GitHub at all.
- We do not have access to those logs, do not receive them and cannot query them.
- GitHub's handling of that data is governed by the GitHub Privacy Statement:
  https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement

If your organisation's policy is that no request may reach a US-hosted service, a
self-hosted build removes GitHub from the picture entirely. Contact us.

## 6. What PRISM does not protect you from

A privacy policy that lists only good news is marketing. These are the real limits
of what this architecture can do, written by us before anyone else writes them for
us.

- **Browser extensions.** An extension with permission to read page content can
  read data you have loaded into PRISM, exactly as it can read data in any other
  web page or web application, including your webmail. PRISM cannot prevent this.
  If you are handling highly sensitive data, use a browser profile with no
  extensions.
- **A compromised device.** If malware is running on your computer, it can read
  your file directly from disk. PRISM changes nothing about that.
- **Screen sharing and observation.** PRISM displays your data on your screen.
- **What you do with the output.** If you export, screenshot or copy results and
  send them somewhere, that is your transmission, not ours.
- **Your own network.** Your employer or internet provider can see that you
  connected to the PRISM page and to the runtime network, in the same way they can
  see any other site you visit. They cannot see your file, because it does not
  traverse the network.
- **Correctness.** This is a privacy policy, not a warranty of accuracy. Nothing
  here represents that PRISM's statistical output is correct. See the Terms of
  Service and `docs/legal/COMPLIANCE_POSTURE.md`.

## 7. Do not trust us. Check.

Every claim in Sections 1 to 4 is verifiable by you, without our cooperation, in
about two minutes. We would rather you did this than believed us.

1. **Watch the network.** Open your browser's developer tools, go to the Network
   tab and clear it. Load a file into PRISM and run an analysis. You will see
   requests for the page's own files and for the Python runtime. You will see no
   request carrying your data, because there is no such request to see.
2. **Disconnect and keep working.** Load PRISM, wait for it to finish loading the
   Python runtime, then turn off your network connection entirely. PRISM will
   continue to open files and produce analyses with no network at all. Software
   that was exfiltrating your data could not do this.
3. **Read the policy the browser enforces.** View the page source and read the
   `Content-Security-Policy` meta tag. `default-src 'none'` means nothing is
   permitted by default. `connect-src` lists the only network destination the
   browser will allow the application to reach. `form-action 'none'` means the
   application cannot submit a form anywhere at all.
4. **Read the source.** Search it for `fetch`, `XMLHttpRequest`, `WebSocket` and
   `sendBeacon`. Those are the four ways a web page can send data out. Judge for
   yourself what you find.

> **DRAFT FLAG, INTERNAL:** Step 4 promises source availability. This is the single
> most persuasive sentence in the document for the target audience, and it is
> currently unbacked: the repository's licensing position is internally
> contradictory. Do not publish step 4 until
> `docs/legal/LICENSE_RECOMMENDATION.md` is resolved. See Part C, Open Item 2.

## 8. Changes to this policy

The value of this policy is that it is short and absolute. If that ever stops
being true, you are entitled to know loudly, not through a quiet edit.

We commit that if a future version of PRISM ever transmits user data, receives
user data on a server, introduces an account system, sets a cookie or other
persistent identifier, or adds any analytics or telemetry, we will:

1. change the effective date and publish a dated summary of what changed,
2. state the change in plain language at the top of this page, not only in the
   body, and
3. treat it as a major version change of the product.

We will not make a change of that kind silently. The architecture is the product;
changing it is changing the product, not the wording.

## 9. Contact

Questions, corrections, challenges to anything asserted here, or a security
disclosure:

**[CONTACT EMAIL TO BE INSERTED]**

PRISM is operated by **[LEGAL ENTITY OR NAMED INDIVIDUAL TO BE CONFIRMED]**,
[ADDRESS], Ontario, Canada.

> **DRAFT FLAG, INTERNAL:** The operating entity must be named before publication.
> If PRISM is currently operated by an individual rather than through an
> incorporated entity, that must be stated accurately, and counsel should advise
> whether personal liability exposure makes incorporation advisable before any
> commercial launch. A privacy policy naming no accountable entity is a defect a
> corporate security reviewer will flag immediately. See Part C, Open Item 4.

## 10. Regulatory notes

This section is written for privacy officers and security reviewers.

**PIPEDA (Canada).** PIPEDA applies to the collection, use and disclosure of
personal information in the course of commercial activities. PRISM collects no
personal information through the application. Our position is that PIPEDA's
obligations in respect of application data are not engaged, because there is no
collection. Server-log data collected by our hosting provider is addressed in
Section 5. Nothing in this section is a determination by any regulator.

**GDPR and UK GDPR.** Our position is that we are neither a controller nor a
processor in respect of data you analyse in PRISM, because we neither determine
the purposes and means of processing that data nor process it on anyone's behalf:
the processing takes place entirely on your device, under your control, by
software running in your browser. No international transfer of your analysed data
occurs, because no transfer of any kind occurs. If you are a controller using
PRISM to process personal data, you are doing so on your own equipment, and
PRISM's architecture is intended to keep it that way. We do not require a data
processing agreement with you in respect of that data, because we do not process
it. Counsel should confirm this characterisation before an enterprise customer
relies on it in a vendor assessment.

**CCPA and CPRA (California).** We do not collect personal information through the
application, and we do not sell or share personal information. There is no opt-out
mechanism because there is nothing to opt out of.

**ePrivacy Directive Article 5(3) and national cookie rules.** PRISM neither
stores information on, nor accesses information stored on, your terminal
equipment, other than the ordinary browser caching of the application's own
program files. This is why PRISM shows no cookie banner. We regard the absence of
a cookie banner as a property to be defended, not an oversight to be corrected.

**Children.** PRISM has no account system, collects nothing and directs no content
at children. Counsel should confirm whether any children's-privacy disclosure is
nonetheless expected in the target markets.

---

## Part C: Open items for counsel (internal, remove before publication)

These must be closed before this document is published.

**Open Item 1: identify the network operator correctly, or remove the reference.**
Section 4.6 deliberately declines to name a legal entity for `cdn.jsdelivr.net`.
Public sources consulted during drafting were inconsistent, referring to more than
one company in relation to different parts of the service. Counsel must either
confirm the operator and the correct policy URL from primary sources, or leave the
section linking to the operator's own policies page without asserting who runs it.
Do not paraphrase a third party's data practices from memory: link, and let the
reader read.

**Open Item 2: source-availability claim in Section 7, step 4.** Resolve licensing
first. See `docs/legal/LICENSE_RECOMMENDATION.md`. If the outcome is
source-available, this sentence is a major asset and should be strengthened with a
direct link to the repository. If the outcome is closed-source, the sentence must
be deleted, and Section 7 will rest on steps 1 to 3, which remain genuinely
strong on their own.

**Open Item 3: make the claims regression-tested, not merely documented.** This
policy asserts properties of code, and code changes. Ask the engineering team to
add, as a CI gate:

- a test asserting `src/` contains no `XMLHttpRequest`, `WebSocket` or
  `sendBeacon` construction, and no `fetch` call outside the pinned runtime loader;
- a test asserting no `localStorage`, `sessionStorage`, `indexedDB` or
  `document.cookie` access in `src/`;
- a test asserting the worker is constructed from a `blob:` URL, since that is
  what makes the CSP bind to the thread holding user data.

A partial version already exists at `src/stores/prismStore.test.ts:82`, which is a
good sign. Counsel's interest is that a published privacy representation should be
enforced by the build rather than by anyone's memory. A representation that
silently becomes false is the scenario that turns a privacy policy from an asset
into a liability.

**Open Item 4: name the operating entity.** See the flag in Section 9.

**Open Item 5: fix the README before publishing this.** `README.md` currently
publishes a compliance table asserting ISO/IEC 27001:2022 compliance, WCAG 2.2 AAA
conformance, EN 301 549 conformance, GDPR Article 32 compliance and PIPEDA
compliance, each with a green check mark. Those claims are not supported. See
`docs/legal/COMPLIANCE_POSTURE.md`. Publishing a scrupulously honest privacy
policy alongside an unsupported compliance table does not average out to honest:
it invites the inference that the honest document is also decoration. Counsel's
recommendation is that the README claims be corrected **before or at the same time
as** this policy is published, never afterwards.

**Open Item 6: consistency review across all published surfaces.** Before
publication, check that this policy does not contradict the README, the
in-application copy, the marketing site or any sales material. The specific risk is
a marketing claim of "zero network requests," which would be false, or "no data
leaves your machine" used without the runtime-download carve-out in a context where
the carve-out matters. The accurate short form is: **your data never leaves your
machine; the program itself is downloaded to you.**

**Open Item 7: decide whether the offline build gets its own policy.** If a
self-hosted or offline build is distributed, Sections 4 and 5 do not apply to it at
all, and a one-paragraph variant policy is both accurate and a stronger sales
document than this one. Do not reuse this text unchanged for that build.

---

*End of draft. Not legal advice. Requires review by a qualified lawyer in the
relevant jurisdiction before publication or reliance.*
