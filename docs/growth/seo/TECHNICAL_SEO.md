# PRISM Technical SEO

Owner: SEO
Last updated: 2026-09-13
Scope: the marketing site that will live in `web/`, plus the indexability posture of the
application itself.

**Status note, and it changed during the writing of this document.** When I began, `web/`
did not exist. The web team shipped it mid-session. This document has been re-verified
against the delivered files rather than left as a specification for a page that now exists.

What is there now: `web/index.html` (39,228 bytes), `web/styles.css` (48,045 bytes),
`web/app.js` (22,086 bytes). What is still missing: **every single SEO tag.** No canonical,
no Open Graph, no Twitter card, no `robots` meta, no JSON-LD, no `robots.txt`, no
`sitemap.xml`. Section 1.2 is the gap list and it is the actionable part of this file.

Every byte figure below was measured with `find dist -type f -printf "%s\t%p\n"` against the
build present in the tree at the time of writing. Chunk hashes change on every build, so
treat the hashed filenames as illustrative and the sizes as a baseline to re-measure.

---

## 1. Audit of what exists today

### 1.0 The two HTML files are different artifacts with different jobs

- `index.html` at the repository root is the **application shell**. It is not a landing page
  and should never be asked to be one. Audited in 1.1.
- `web/index.html` is the **marketing site**. Audited in 1.2.

### 1.1 The application shell

Current state, by line:

| Element | Current value | Verdict |
|---|---|---|
| `<title>` (line 50) | `PRISM - Secure Data Analytics` | WEAK. Generic, uses the bare brand term, targets nothing from the keyword map. |
| `<meta name="description">` (line 43) | "PRISM - Secure, browser-based data analytics platform. Your data never leaves your browser." | ACCEPTABLE and, importantly, true. Leads with the brand instead of the benefit, which wastes the first characters. |
| `<html lang>` | `en` | CORRECT. |
| Viewport | present, `viewport-fit=cover` | CORRECT. |
| Canonical | **absent** | MISSING. |
| Open Graph | **absent** | MISSING. Every link shared to LinkedIn, which LAUNCH_PLAN names the primary channel, currently renders as a bare URL. |
| Twitter card | **absent** | MISSING. |
| `robots` meta | **absent** | See Section 9.2. The app should be `noindex`, so its absence is a live defect. |
| JSON-LD | **absent** | MISSING. `schema.jsonld` in this directory is the deliverable. |
| Favicon | `/favicon.svg` plus a PNG | Works, but the PNG is 106,495 bytes. See 8.3. |
| `preconnect` to `cdn.jsdelivr.net` (line 53) | present | CORRECT and well judged. |
| Critical CSS inlined | present, with `prefers-color-scheme` and `prefers-reduced-motion` | GOOD. This is better than most production sites. |
| `<noscript>` fallback | present, with real content | GOOD. |
| Skip links | present | GOOD. |

Two things worth saying plainly. First, whoever wrote this file cared about the right
things: the CSP, the critical CSS, reduced motion, the noscript block. Second, none of that
is SEO, and the SEO surface is close to empty.

One correctness note on the description tag: it says "Your data never leaves your browser".
Per the evidence ledger in `POSITIONING.md` this is a claim we are allowed to make, and per
`TECHNICAL_STRATEGY.md` it is architecturally true. Keep the substance. Change the wording
only to lead with the reader's problem rather than our name.

### 1.2 The marketing site in `web/`, as delivered

The page is better than most of what this document was written to prevent. Verified
directly:

| Property | Verdict |
|---|---|
| `<title>`: "PRISM: analyze the spreadsheet you are not allowed to upload" | **EXCELLENT.** Benefit-first, brand second, and it targets the exact Tier 1 money query from SEO_STRATEGY 3. Better than the title pattern I specified in Section 4. |
| `<meta name="description">` | **GOOD.** Specific, true, no banned words. |
| Exactly one `<h1>`, ordered `<h2>` section headings | CORRECT. |
| Third-party requests | **ZERO.** The only external hosts referenced anywhere are inside quoted CSP text, not as live subresources. This is the hardest requirement in Section 3 and it was met. |
| Analytics or tag manager | **NONE.** The recommendation in 9.3 was adopted. |
| `<html lang="en">`, `color-scheme`, `theme-color`, `referrer` | CORRECT. |
| A "what is wrong with PRISM today" section (line 573) | Not an SEO tag, but it is the single best link-earning asset on the page, and it is what `/verify` and `/security` were specified to do. |

Now the gaps. **Every one of these is missing and every one is required:**

| Missing | Where the fix is specified | Severity |
|---|---|---|
| `<link rel="canonical">` | Section 5 | HIGH |
| Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) | Section 4 | **HIGH.** LAUNCH_PLAN names LinkedIn the primary channel. Today every share renders as a bare URL. |
| Twitter card tags | Section 4 | MEDIUM |
| `<meta name="robots">` | Section 4 | LOW (default is indexable, so this is explicitness, not a bug) |
| JSON-LD | `schema.jsonld`, Section 9.4 | MEDIUM |
| `robots.txt` | Section 6 | HIGH |
| `sitemap.xml` | Section 7 | HIGH |
| Favicon links | Section 4 | LOW |
| OG image asset (1200x630) | Section 4.2 | HIGH, and it is the long-pole item because someone has to make the image |

### 1.3 Budget variance on the delivered page, stated honestly

Measured: 39,228 + 48,045 + 22,086 = **109,359 bytes** across three same-origin files.

Against the budget in Section 8.2: total page weight is **within** the 150 KB budget. Two
line items are over:

- **HTML is 39 KB against a 50 KB budget that assumed inlined CSS.** With CSS in a separate
  48 KB file, the combined first-render cost is about 87 KB. Not a problem, but the budget
  line was written for a different structure and should be restated rather than quietly
  failed. Recommendation: leave it as is. Three cacheable same-origin files is a reasonable
  structure and inlining 48 KB of CSS into every page would be worse once there are eight
  pages.
- **`app.js` is 22 KB against a budget of "0, or under 5 KB if genuinely needed."** This is
  the one to look at. The page's interactive elements (the live request counter that lets a
  visitor confirm the page makes no requests) are genuinely load-bearing for the argument,
  so the budget was too aggressive. But 22 KB is a lot for that, and the page must still be
  fully readable with JavaScript disabled. **Action: verify the no-JS reading experience
  (Section 9.1), then either justify the 22 KB in a comment or trim it.** Raising the
  budget line to 25 KB with a stated reason is a legitimate outcome. Silently exceeding it
  is not.

No compressed transfer sizes have been measured for these files. See Section 12.

---

## 2. The address problem, which blocks everything else

`vite.config.ts` line 36 sets `base: '/PRISM/'`, and `.github/workflows/deploy.yml`
publishes `dist/` to GitHub Pages. That produces a **project page** at a path under a
`github.io` account.

Three consequences, in descending severity.

**2.1 `robots.txt` cannot be controlled from this repository.** A crawler fetches
`robots.txt` from the *origin root*. For a GitHub project page the origin root is the user
or organisation site, served from a different repository. A `robots.txt` placed in
`public/` ships to `/PRISM/robots.txt`, which no crawler will request as a policy file.
GitHub's own community discussion confirms the platform does not support custom response
headers or per-repository origin-root control
(https://github.com/orgs/community/discussions/84963).

**2.2 No custom HTTP response headers.** Same source. This is already a known product
problem (the worker CSP finding in `TECHNICAL_STRATEGY.md`), and it is also an SEO problem:
no `X-Robots-Tag`, no `Link: rel=canonical` header, no cache-control tuning, no
`Content-Security-Policy` header.

**2.3 No domain equity.** Links earned on `github.io/PRISM/` accrue to a shared hostname
that we do not control and cannot migrate cleanly.

### Options

| Option | Cost | Verdict |
|---|---|---|
| A. Stay on the GitHub Pages project path | Zero | **Rejected.** Cannot do robots, cannot do headers, cannot do canonical properly, no equity. |
| B. Custom domain on GitHub Pages (a `CNAME` file, DNS at the registrar) | Domain registration only | **Acceptable minimum.** Fixes 2.1 and 2.3. Does **not** fix 2.2, so the worker CSP problem survives. |
| C. Custom domain on a static host that sets response headers (Cloudflare Pages, Netlify, Vercel and others all do) | Domain, plus a free tier | **Recommended.** Fixes all three, and it is the same move `TECHNICAL_STRATEGY.md` Month 3 already requires in order to serve a real CSP header over the worker. |

Option C is not an SEO preference that happens to align with engineering. It is one
migration that two separate workstreams independently need. Do it once.

**If Option B or C is chosen, `base` must change from `'/PRISM/'` to `'/'`.** That is a
`vite.config.ts` edit and therefore belongs to the engineering team, not to this directory.
It is listed here so it is not forgotten, because every asset path in `dist/index.html`
currently hard-codes the `/PRISM/` prefix.

### 2.4 Placeholder origin used in this directory

Until the domain exists, `schema.jsonld` and every example below use
`https://prism.example.com` as the origin. `example.com` is reserved by IANA for exactly
this purpose (RFC 2606), so it is unambiguously a placeholder and will never accidentally
resolve to someone else's site.

To adopt the real domain, one command replaces every occurrence:

```bash
grep -rl "prism.example.com" web/ docs/growth/seo/ \
  | xargs sed -i 's|https://prism\.example\.com|https://YOUR-REAL-DOMAIN|g'
```

---

## 3. Why `web/` must be static HTML, separate from the app

The application is a React SPA whose `#root` is empty until JavaScript executes and whose
first meaningful interaction requires downloading a Pyodide runtime from a CDN. Googlebot
does render JavaScript, but rendering is queued, budgeted, and the last thing to happen.
For a single-author site with no authority, spending crawl budget on a rendering pass to
discover a marketing paragraph is a bad trade.

More decisively: the landing page's whole job is to be trustworthy to a security reviewer.
A page that is 1.3 MB of JavaScript before it displays a sentence about how little it does
argues against itself.

**Specification for `web/`.** As of 1.2 the delivered page already satisfies most of this.
Kept in full because it governs the seven pages still to be built, and because the easiest
way to lose a zero-third-party page is for the second page to quietly add a font CDN.

- Hand-written or statically generated HTML. Content present in the initial response body.
- No client-side framework. No hydration.
- Zero third-party requests. No font CDN, no analytics, no embedded video, no tag manager.
  Self-host everything, including fonts, or use a system font stack (the app's inlined
  critical CSS already uses one and it looks fine).
- Inline the CSS. At this page count the extra request is not worth the cache benefit.
- Progressive enhancement only. Every page must be fully readable with JavaScript disabled,
  which is also the honest posture for this audience and costs nothing.
- The application is linked to, not embedded.

Suggested layout, matching the architecture in `SEO_STRATEGY.md` Section 5. Note that the
delivered `web/index.html` currently carries the content of several of these pages as
sections on one long page. That is a reasonable launch shape. Split `/verify` and
`/security/questionnaire` into their own URLs when they are strong enough to rank on their
own, because a section anchor cannot rank for its own query and those two are the pages
SEO_STRATEGY 5.1 and 5.2 depend on.

```
web/
  index.html                    /
  verify/index.html             /verify
  security/index.html           /security
  security/questionnaire/index.html
  writing/index.html            /writing/
  writing/<slug>/index.html
  about/index.html
  changelog/index.html
  robots.txt
  sitemap.xml
  schema.jsonld                 (copied from docs/growth/seo/, or inlined)
  assets/
    og-default.png              1200x630
    og-verify.png               1200x630
```

Directory-with-`index.html` gives clean trailing-slash URLs on every static host without
rewrite rules.

---

## 4. The head block

Per page. Everything below is deliberately boring, which is correct for this layer.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <title>Analyze a spreadsheet without uploading it | PRISM</title>
  <meta name="description"
        content="Drop an Excel, CSV or XML file into your browser and get statistics and
                 charts. Parsing and computation run in the tab. Open the network panel
                 and watch it stay empty.">

  <link rel="canonical" href="https://prism.example.com/">

  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">

  <!-- Open Graph -->
  <meta property="og:type"         content="website">
  <meta property="og:site_name"    content="PRISM">
  <meta property="og:url"          content="https://prism.example.com/">
  <meta property="og:title"        content="Analyze a spreadsheet without uploading it">
  <meta property="og:description"  content="Statistics and charts for Excel, CSV and XML,
                                            computed in your browser tab. Nothing is
                                            uploaded. Verify it yourself in the network
                                            panel.">
  <meta property="og:image"        content="https://prism.example.com/assets/og-default.png">
  <meta property="og:image:width"  content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt"    content="A browser network panel showing no requests
                                            while a spreadsheet is analysed.">
  <meta property="og:locale"       content="en_CA">

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image">
  <meta name="twitter:title"       content="Analyze a spreadsheet without uploading it">
  <meta name="twitter:description" content="Statistics and charts for Excel, CSV and XML,
                                            computed in your browser tab. Nothing is
                                            uploaded.">
  <meta name="twitter:image"       content="https://prism.example.com/assets/og-default.png">
  <meta name="twitter:image:alt"   content="A browser network panel showing no requests
                                            while a spreadsheet is analysed.">

  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <script type="application/ld+json">
  <!-- contents of docs/growth/seo/schema.jsonld -->
  </script>

  <style>/* inlined page CSS */</style>
</head>
```

### 4.1 Rules for the strings

**Title.** Pattern: `<what the reader wants> | PRISM`. Benefit first, brand last, because
per `SEO_STRATEGY.md` 3.1 the brand token is worth nothing in search and worth something
only as a signature. Aim for roughly 50 to 60 characters before truncation. Never two pages
with the same title.

**Description.** Not a ranking factor, it is the click decision. Two sentences: what it does,
then the verification invitation, because the verification invitation is the differentiator
and it survives truncation better at the end of a short second sentence. Around 150 to 160
characters. Write one per page. Never leave it to be auto-generated.

**Forbidden in every string on this page, per POSITIONING 0.2 and VOICE.md:** "compliant",
"certified", "WCAG AAA", "ISO 27001", "zero trust", "enterprise-grade", "AI-powered
insights", "military-grade", "100% secure", "guaranteed", and any absolute. Also forbidden:
the em dash character, per house style.

### 4.2 Open Graph image

One image, not a template with the page title burned in, until there are enough pages to
justify generation. 1200x630, PNG or JPEG, under 300 KB (see the budget in Section 8).

Content recommendation: an actual screenshot of a browser network panel, empty, alongside a
rendered chart. It is the product demo, it is literally the argument, and it is
self-explanatory in a LinkedIn feed. A logo on a gradient is not.

`og:image:alt` is required and is not optional politeness. It is read by screen readers on
LinkedIn and X.

---

## 5. Canonical

Rules:

1. Every page has a self-referencing canonical, absolute, with the protocol and host.
2. Pick trailing slash or no trailing slash and never mix. The `index.html` layout in
   Section 3 gives trailing slashes. Use them everywhere.
3. Pick `https://` and the naked-or-`www` form once, redirect the other permanently at the
   host, and make the canonical match the redirect target. A canonical that points at a URL
   which then redirects is a common and entirely self-inflicted error.
4. The application, wherever it lives, does **not** canonicalise to the marketing home page.
   They are different pages. The app gets `noindex` instead (Section 9.2).
5. No URL parameters exist on this site. Do not introduce campaign parameters that create
   crawlable duplicates. Since there is no analytics (Section 9.3), campaign parameters
   would have nothing to report to anyway.

---

## 6. robots.txt

Must be served from the origin root, which is the entire argument for Section 2.

```
# https://prism.example.com/robots.txt

User-agent: *
Allow: /

# The application shell is not a document. It renders nothing without JavaScript
# and has no content to index. The marketing site is what should rank.
Disallow: /app/

Sitemap: https://prism.example.com/sitemap.xml
```

Notes:

- Keep it this short. Every extra rule is a chance to accidentally deindex something.
- `Disallow: /app/` only stops crawling, it does not guarantee the URL is kept out of the
  index. The `noindex` meta tag in Section 9.2 is what actually does that, and the two are
  in tension: a crawler blocked by `robots.txt` never reads the `noindex`. **Pick one.**
  Recommendation: use the `noindex` meta tag on the app and **remove** the `Disallow` line,
  so the crawler is allowed in, reads `noindex`, and drops it. This is the standard fix for
  a well-known trap and it is worth getting right the first time.
- Do not block AI crawlers by default. PRISM's argument benefits from being summarised
  accurately by answer engines (see SEO_STRATEGY Section 8). If that changes, it is a
  founder decision, and the place to make it is here.

---

## 7. sitemap.xml

Small enough to hand-maintain at this page count. Generate it only once the article count
makes hand-editing error-prone.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://prism.example.com/</loc>
    <lastmod>2026-09-13</lastmod>
  </url>
  <url>
    <loc>https://prism.example.com/verify/</loc>
    <lastmod>2026-09-13</lastmod>
  </url>
  <url>
    <loc>https://prism.example.com/security/</loc>
    <lastmod>2026-09-13</lastmod>
  </url>
  <url>
    <loc>https://prism.example.com/security/questionnaire/</loc>
    <lastmod>2026-09-13</lastmod>
  </url>
  <url>
    <loc>https://prism.example.com/about/</loc>
    <lastmod>2026-09-13</lastmod>
  </url>
  <url>
    <loc>https://prism.example.com/writing/</loc>
    <lastmod>2026-09-13</lastmod>
  </url>
</urlset>
```

Rules:

- Only canonical, indexable URLs. Never list the app.
- `lastmod` must be truthful. A sitemap that claims every page changed today, every day, is
  a signal that the `lastmod` field is noise, and it gets treated as noise.
- Omit `changefreq` and `priority`. Google has said for years that it ignores them, and
  they are two more fields that can be wrong.
- Submit it in Search Console, and reference it from `robots.txt`. Do both.

---

## 8. Performance budget

### 8.1 Measured baseline of the application (not the landing page)

Measured 2026-09-13 with `find dist -type f -printf "%s\t%p\n" | sort -rn`:

| File | Bytes |
|---|---|
| `dist/js/index-*.js` (entry) | 564,568 |
| `dist/chunks/vendor-charts-*.js` | 564,384 |
| `dist/assets/favicon-*.png` | 106,495 |
| `dist/assets/index-*.css` | 44,126 |
| `dist/chunks/vendor-utils-*.js` | 25,423 |
| `dist/index.html` | 5,918 |
| `dist/favicon.svg` | 3,175 |
| `dist/chunks/vendor-react-*.js` | **37** |
| **Total** | **1,314,126** |

These are uncompressed on-disk sizes. Transfer size over a host with Brotli or gzip will be
materially smaller, and nobody has measured that yet, so it is **UNMEASURED** and no
compressed figure appears in this document.

Two observations that belong to engineering but are recorded here because they affect any
future Core Web Vitals work:

- `vendor-react` is **37 bytes**, which means the `manualChunks` split in `vite.config.ts`
  is not doing what its name says. React is inside the 564,568-byte entry chunk. Already
  noted in `TECHNICAL_STRATEGY.md`.
- The favicon PNG is 106,495 bytes and ships on every cold load. For a favicon. Section 8.3.

### 8.2 Budget for the landing page in `web/`

The landing page is a separate artifact and must be held to a much harder standard than the
app. This is achievable because it is static HTML.

| Metric | Budget | Why |
|---|---|---|
| HTML document, uncompressed | under 50 KB | Includes inlined CSS. Comfortable for a text page. |
| Total page weight excluding the OG image | under 150 KB | No framework, no fonts, no third-party anything. |
| JavaScript on the landing page | **0 bytes**, or under 5 KB if genuinely needed | A page arguing that we do not run code on your data should not run much code on your browser. |
| Third-party requests | **0** | Non-negotiable. A single `fonts.googleapis.com` request destroys the page's whole argument. |
| Requests on first load | under 8 | HTML, one CSS if not inlined, favicon, one or two images. |
| Images | Any image over 100 KB needs a reason. Serve `webp` or `avif` with a fallback, and set explicit `width` and `height`. | CLS. |

### 8.3 Core Web Vitals

Google's "good" thresholds, measured at the 75th percentile of field data: LCP under 2.5 s,
INP under 200 ms, CLS under 0.1 (https://web.dev/articles/vitals).

Honest note on measurement: field data requires enough traffic to appear in the Chrome UX
Report. A pre-launch site will not have it, possibly for a long time. So the operating
metric is **Lighthouse lab data, explicitly labelled as lab data**, and we do not report a
lab score as if it were a field score.

For the landing page, all three should be trivially green given the budget in 8.2. If they
are not, something violated the budget.

For the application, LCP is genuinely at risk: the shell shows "Loading PRISM Analytics
Engine..." while roughly 1.2 MB of JavaScript parses. That is an application performance
problem, it belongs to the roadmap in `TECHNICAL_STRATEGY.md`, and it is **not** an SEO
problem once the app is `noindex`. Recording it here so the two are not conflated.

Three cheap wins available now, all owned by engineering:

1. Fix the `manualChunks` split so React is actually split out.
2. Replace the 106 KB favicon PNG with a 32x32 PNG (typically low single-digit KB) and keep
   the existing SVG as the primary. The 106,495-byte file is a full-size logo being used as
   a favicon.
3. Code-split the charts chunk behind the first analysis, since no chart can render before a
   file is dropped.

---

## 9. Indexability and rendering

### 9.1 The landing page must render without JavaScript

Stated in Section 3, repeated here because it is the single most consequential technical SEO
decision on the list. Verify it the crude way, which is also the honest way: disable
JavaScript in the browser and read the page.

### 9.2 The application must be `noindex`

Add to the app shell's head (an engineering change to `index.html`, outside this
directory's write scope, recorded here as the request):

```html
<meta name="robots" content="noindex, follow">
```

Reasons: it has no indexable content, it competes with the landing page for the brand query,
and a searcher who lands directly in a file dropzone with no context is a searcher who
leaves. `follow` is kept so any links from it still pass.

Note the interaction with `robots.txt` covered in Section 6. Do not also `Disallow` it.

### 9.3 Analytics: the recommendation is none

`SEO_STRATEGY.md` 0.2 sets out the argument. The recommendation is that `web/` carries no
analytics at all, including privacy-preserving analytics.

The case for: our entire pitch is that a reader can open the network panel and see nothing.
That test will be run on the marketing site first, because it loads first. A single
third-party beacon there, however benign and however GDPR-friendly, hands a critic a
screenshot. The cost is that we fly on Search Console alone.

The case against, stated fairly: without analytics we cannot tell which page produced a
conversation, which makes SEO Checkpoint 3 in `SEO_STRATEGY.md` 6.2 partly guesswork.

If the founder overrules this, the only acceptable implementations are self-hosted on the
same origin with no cookies, or server-log analysis. Not a third-party script. This is a
founder decision and should be made explicitly rather than by whoever builds the page first.

### 9.4 Structured data

Ship `schema.jsonld` (this directory) inline in the home page `<head>`. Validation:

```bash
python -c "import json,sys; json.load(open('docs/growth/seo/schema.jsonld')); print('valid JSON')"
```

then paste into https://validator.schema.org/ and Google's Rich Results Test.

**Expect the Rich Results Test to report that no rich result is eligible. That is correct
and intended.** Google's Software App documentation requires `name`, `offers.price`, and
either `aggregateRating` or `review`
(https://developers.google.com/search/docs/appearance/structured-data/software-app).
PRISM has zero users and therefore zero reviews and zero ratings. Fabricating either would
be both a lie and a structured data policy violation. The markup ships anyway, because its
job here is entity understanding and accurate machine-readable facts, not a star rating.

Revisit only when real reviews exist, from real users, published somewhere verifiable.

---

## 10. Accessibility and SEO overlap

There is real overlap (semantic headings, alt text, link text, language attribute) and the
work in `docs/design/ui/` and `docs/design/ux/` covers it properly for the application.

For `web/`, the SEO-relevant minimum:

- One `<h1>` per page, describing the page, not the brand.
- Heading levels in order. No level skipping for visual reasons.
- `<main>`, `<nav>`, `<header>`, `<footer>` landmarks.
- Descriptive link text. Never "click here", never "read more" as the entire link.
- `alt` on every image. Decorative images get `alt=""`, not a missing attribute.
- `lang="en"` on `<html>`.

**What this does not license us to say.** The README currently claims WCAG 2.2 AAA with
nothing behind it, and `docs/design/ui/DESIGN_SYSTEM.md` found that the focus indicator
fails 3:1 on every light surface and measures 1.00:1 against the active tab. No page in
`web/` makes any accessibility compliance claim. The permitted phrasing is in
POSITIONING 0.2.

---

## 11. Launch checklist

Ordered. Nothing below a blocked line starts before the line above is done.

### Phase 0a: decisions
- [ ] Domain chosen and registered.
- [ ] Host chosen (Option B or C, Section 2). Option C recommended.
- [ ] Canonical brand qualifier chosen with `NAMING.md`.
- [ ] Trailing-slash and `www` conventions chosen.
- [ ] Analytics decision made explicitly (Section 9.3).

### Phase 0b: build `web/`
- [ ] Static HTML, zero framework, zero third-party requests.
- [ ] Head block per Section 4 on every page, unique title and description each.
- [ ] Self-referencing canonical on every page.
- [ ] `robots.txt` at the origin root, with the sitemap line.
- [ ] `sitemap.xml` with truthful `lastmod`.
- [ ] `schema.jsonld` inlined in the home page, placeholder origin replaced.
- [ ] One 1200x630 OG image with `og:image:alt`.
- [ ] Favicon set (SVG plus a small PNG, not the 106 KB one).
- [ ] Every page readable with JavaScript disabled.
- [ ] Every page passes the budget in 8.2.
- [ ] Every string checked against the POSITIONING 0.2 forbidden list.
- [ ] Zero em dash characters (`grep -P '\x{2014}' web/ -r` returns nothing).

### Phase 0c: application changes (engineering, outside this directory)
- [ ] `noindex, follow` added to the app shell.
- [ ] `base` changed from `/PRISM/` if the domain moved.
- [ ] Favicon PNG replaced with a correctly sized one.
- [ ] `manualChunks` split fixed so `vendor-react` is not 37 bytes.

### Phase 0d: verification
- [ ] Search Console property verified.
- [ ] Sitemap submitted.
- [ ] Live URL inspected in Search Console, rendered HTML confirmed to contain the content.
- [ ] `schema.jsonld` passes validator.schema.org.
- [ ] OG preview checked on LinkedIn's post composer and on X.
- [ ] Lighthouse run and the scores recorded in this file, labelled as lab data.
- [ ] Redirect from the non-canonical host form confirmed to be a single hop, 301.
- [ ] `https://prism.example.com/robots.txt` returns 200 with the expected body.

### Phase 0e: content gate
- [ ] All seven LAUNCH_PLAN blocking gates green, starting with the `xlsx@0.18.5` advisory.
- [ ] Only then: publish anything from `CONTENT_PLAN.md`.

---

## 12. Open items

1. Domain and host undecided. Blocks the whole checklist.
2. Whether the app lives at `/app/` on the same origin or at an `app.` subdomain. Same
   origin is simpler and keeps all link equity on one host. A subdomain makes the CSP
   header story cleaner. Engineering decision, SEO prefers same origin.
3. No compressed transfer sizes have been measured. The 8.1 table is uncompressed disk size
   only, and the difference matters for any real Core Web Vitals conversation.
4. No Lighthouse run exists for the application. Worth doing once, now, to establish a
   baseline before the roadmap changes things.
