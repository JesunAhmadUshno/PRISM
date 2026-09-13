# PRISM Launch Plan

Owner: CMO
Last updated: 2026-09-13
Depends on: POSITIONING.md and MESSAGING.md
Status: DRAFT. Nothing in Phase 2 or later may start until every gate in Section 1 is closed.

Dates are expressed as relative weeks from the day the last gate closes (W0). Calendar dates
are not used here because the gates are engineering-dependent and inventing a date would be
inventing a number.

---

## 1. Launch gates, all blocking

We are launching a product whose entire claim is that it is trustworthy with sensitive data,
into audiences that verify claims for a living. Launching before these close does not slow us
down, it costs us the one thing we cannot rebuild.

| # | Gate | Owner | Why it blocks |
|---|---|---|---|
| G1 | xlsx@0.18.5 HIGH severity advisory remediated via the SheetJS CDN build | Engineering | A security pitch on top of a known unpatched HIGH is the fastest way to lose this audience permanently. Hacker News will find it in the first hour |
| G2 | A test suite exists and passes in CI, with the run publicly linkable | Engineering | "Zero tests" is a fair criticism we cannot answer while it is true. Any correctness language is blocked until this closes |
| G3 | LICENSE, package.json and README made mutually coherent | Engineering | Today they contradict each other: proprietary, private, and open-source-reading prose. A reviewer who spots that discounts everything else we say |
| G4 | README claims of WCAG 2.2 AAA and ISO/IEC 27001:2022 removed or correctly qualified | Engineering | These are unverified compliance claims in our most-read document. They are a correctness problem before they are a marketing one |
| G5 | Bundle work done: xlsx no longer statically imported, the 564 kB charts chunk split | Engineering | A performance-minded audience checks the network waterfall on a tool whose whole claim is about the network tab |
| G6 | Verification page live: the CSP quoted, the grep command shown, the three-step network tab check | CMO | This is the campaign's single most important asset. Nothing ships without it |
| G7 | At least eight Tier 1 discovery interviews completed, notes written up | Founder | We currently have zero. Launching without knowing whether the wedge is real is a guess with one shot attached |

Gates G1 through G5 are engineering deliverables outside this directory. Marketing tracks
them, does not touch them, and does not schedule around optimistic estimates.

---

## 2. Objectives, and the metrics we refuse

### 2.1 Objectives for this launch

The launch has exactly three jobs. It is not trying to grow.

1. **Falsify or confirm the wedge.** Do blocked analysts in Tier 1 change behaviour, or do
   they merely agree that the idea sounds good?
2. **Get the architecture attacked by competent skeptics, in public, and survive it.** A
   technical thread that ends with critics conceding the claim holds is worth more than any
   volume of traffic.
3. **Produce the first three repeat users we can name and talk to.**

### 2.2 Metrics we will not report

These are banned from every update, deck and post-mortem. They are noise that feels like
progress.

- Page views, unique visitors, impressions, reach.
- Upvotes, likes, follower counts, "trending" placements.
- Product Hunt rank or badge.
- Email list size with no engagement behind it.
- GitHub stars, unless accompanied by an issue or a question from the starrer.
- Anything that goes up when strangers with no relation to the ICP look at us once.

We also have a structural constraint that makes the usual funnel impossible and we should
treat it as a feature: **PRISM has no telemetry, by design, so we cannot instrument the
product.** We do not know who used it, how often, or on what. Every signal below is either
channel-side or comes from an actual conversation. Any proposal to add product analytics
"just for the launch" is a proposal to destroy the positioning and must be refused.

### 2.3 Signals that count

| Signal | How we capture it | Why it matters |
|---|---|---|
| Discovery interviews completed with Tier 1 roles | Founder's notes | The only source of truth about the wedge |
| Inbound messages describing a specific blocked file | LinkedIn DMs, email | Proof the problem statement lands |
| People who ran the verification steps and say so | Comments, replies, issues | Proof the trust mechanism works |
| Substantive technical critiques and whether they survived | Thread archive | The architecture's real audit |
| Named repeat users, by name, who will talk to us | Founder's list | The only leading indicator of a business |
| Requests for a self-hosted or distributable build | Any channel | The first real pricing signal |
| Security questionnaires received | Email | Evidence we reached a buying committee, not just readers |

Target for the whole launch: three named repeat users and twenty completed Tier 1 interviews.
These are effort targets, not forecasts. We are not projecting outcomes we have no basis for.

---

## 3. Phased sequence

### Phase 0, W minus 4 to W0: prepare while gates close

Nothing public. Everything here is an asset or a conversation.

- Verification page written and published (G6). The CSP quoted verbatim, the grep command
  copy-pasteable, the network tab walkthrough with screenshots, the disconnect-the-network
  test, and an explicit "what this does not protect you from" section covering extensions and
  compromised endpoints. Write our own limitations before a critic does.
- A 45 second screen recording: DevTools open, network tab visible, file dropped, analysis
  runs, network tab stays empty. No voiceover, no music, no cuts. The absence of production
  polish is the point. This is the single most shareable asset we will make.
- A demo dataset that is genuinely interesting and carries no confidentiality risk at all.
  Use a named public open dataset, cite the source URL on the page. Never a synthetic file
  that implies a real one, and never anything that looks like real patient or client data.
- One-pager built from MESSAGING.md Section 4, as a plain web page. No gated PDF. Gating a
  one-pager behind an email form, for this ICP, is an own goal.
- Founder discovery interviews begin, 8 minimum before W0 (G7). Target: ex-KPMG colleagues
  first, then second-degree introductions into hospital analytics and litigation support.
  Ask about the last blocked file, not about PRISM. Do not demo in the first half.

**Exit criteria for Phase 0:** all seven gates closed.

### Phase 1, W0 to W2: quiet proof in the warm network

Still not a launch. This is where the wedge gets tested with people who will tell the founder
the truth.

- Direct, individual outreach. No blast. Ex-KPMG contacts, IT audit peers, the founder's MSc
  cohort, anyone in the Toronto analytics community. The message is a question about their
  work, with the link offered second.
- Ask each person for one specific thing: try it on a real file you are allowed to use, and
  tell me what was wrong with it.
- Collect the objections verbatim. Update MESSAGING.md Section 6 with anything we could not
  answer well. The objection list is a living document, and Phase 1's main output is a better
  version of it.
- Recruit two or three people willing to be named later. Do not ask for a quote yet.

**Go / no-go for Phase 2:** at least three people used it on a real file and came back
unprompted. If nobody comes back, the problem is the product or the wedge, and posting it to
Hacker News will not fix either. Stay in Phase 1 and fix the thing they told us about.

### Phase 2, W3: Hacker News, Show HN

The highest-risk and highest-value moment. See the channel analysis in 4.1.

- Post Tuesday to Thursday, mid-morning US Eastern. Founder present and replying for the
  following eight hours, uninterrupted. Do not post before a day the founder cannot be
  online.
- First comment, posted by the founder immediately: the honest state of the project. Early,
  no tests until recently, the dependency advisory that was closed and how, what is not
  verified, what we will not claim. Hacker News rewards a founder who audits themselves in
  the opening comment and punishes one who has to be caught.
- Pre-write answers to: "this is just pandas in a browser," "Power BI Desktop is also local,"
  "an extension can still read the page," "the CDN is still a network call," "what about big
  files," "why not open source." Answers come from MESSAGING.md Section 6. Never argue. Concede
  the true half, answer the rest, thank the critic by name.
- If the thread finds a real flaw, say so in the thread, fix it, and come back to the thread
  with the commit. That single move earns more credibility than the original post.

### Phase 3, W3 to W6: LinkedIn, the founder's own network

Runs concurrently with and after Phase 2. This is the highest-fit channel we have.

- Post 1, W3: the personal origin. "I spent years at KPMG auditing whether organizations
  could prove where their data went." Link to the verification page, not the product. First
  person, no company voice.
- Post 2, W4: the mechanism, written for a non-engineer. What a Content Security Policy is
  and why default-src 'none' means something specific. Teaching, not selling. This is the
  post that travels inside audit and risk functions.
- Post 3, W5: the honest scorecard. What is proven, what is not, what we refuse to claim and
  why. Include the WCAG and ISO 27001 walk-back explicitly. Publishing our own correction is
  the most credible thing we can do in front of auditors.
- Post 4, W6: a real use case from a Phase 1 user, only if they agree to be named. If nobody
  agrees, skip it. We do not write an anonymized composite, because a composite is a fabricated
  customer story.
- Throughout: comment substantively on other people's posts in audit, privacy and health data
  circles. Reply to every DM personally. Convert conversations to interviews.

### Phase 4, W4 to W8: the ICP's own rooms

Where Tier 1 actually is, as opposed to where tech launches happen. Slower, no spike, better
people.

- **Professional bodies and chapters.** IIA and ISACA local chapters (https://www.theiia.org,
  https://www.isaca.org) run talks that are actively looking for speakers. A talk titled
  "Verifying where your data goes: a live demonstration" is a product demo the audience asked
  for. The founder's background makes this credible to a chapter programme committee.
- **Healthcare analytics communities.** HIMSS and HFMA local chapters, health data groups.
  Same shape: a talk, not a booth.
- **eDiscovery and litigation support communities.** ACEDS chapters and regional litigation
  support groups. Enter via referral, since the founder has no native network here.
- **Toronto, in person.** The founder's home market, with a dense financial services and
  hospital sector. Local meetups convert at a rate no online channel matches, and a real
  conversation produces an interview, not a page view.
- **Occupational subreddits,** where the rules permit: r/audit, r/accounting, r/datascience,
  r/healthIT. Participate as a practitioner for weeks before ever linking. A drive-by link
  gets removed and earns a reputation that follows the domain.

### Phase 5, W8 onward: evaluate, then decide about Product Hunt

Product Hunt is deliberately last and conditional. See 4.5.

**Decision point at W8.** Review honestly against the objectives in 2.1:

- If we have three named repeat users and a clear picture of the wedge, continue with the
  professional channels and start the pricing conversation.
- If we have interest but no repeat use, the wedge is wrong or the capability floor is too
  low. Go back to Phase 1. Do not launch harder into a problem that is not adoption.
- If the interviews say the blocked-analyst story is not real, say so out loud and reposition.
  That is a successful launch too. It just costs less than finding out in year two.

---

## 4. Channel analysis

Each channel gets the honest case for and against, and a verdict.

### 4.1 Hacker News, Show HN

**For:**

- This is the only large venue where the mechanism *is* the story. "CSP default-src 'none',
  no network primitives in the source" is a headline here and nowhere else.
- The audience will actually run the verification. Free, adversarial, expert review of our
  central claim, from people with no obligation to be kind. That is exactly what we need.
- Second-order reach into our ICP is real: the security architects and platform engineers who
  read HN are the people who advise the privacy offices that block our users.
- A Show HN that survives scrutiny becomes a durable citation we can point security teams to
  for years.

**Against:**

- Everything unfinished becomes public simultaneously. Zero tests, an unpatched advisory, a
  564 kB chunk, contradictory licensing. All four are findable in minutes. This is precisely
  why the gates exist.
- The "this is just X" reflex is strong and the founder must not argue with it. One defensive
  reply sets the tone of the whole thread.
- Wrong primary audience: most of the thread will be engineers who could write this
  themselves, not blocked healthcare analysts. Expect good critique and few users.
- One shot in practice. A flopped or torched Show HN is not easily redone.
- Outcome is high variance and largely outside our control.

**Verdict: yes, Phase 2, only after all gates close.** Judge it on the quality of the
critique and whether the claim survived, never on points or ranking.

### 4.2 r/dataisbeautiful

**For:**

- Enormous, visual, and PRISM produces charts.
- Their rules require original content posts to cite the data source and the tool used, which
  means an accepted post carries an honest, rules-compliant tool credit rather than an ad.

**Against:**

- The subreddit is for visualizations, not tools. A product post is off-topic and will be
  removed, correctly. Rules: https://www.reddit.com/r/dataisbeautiful/about/rules/
- The audience is people who enjoy charts. The overlap with auditors blocked by procurement
  is close to nothing.
- The chart itself has to be genuinely excellent to survive, which means the work is
  chart-craft, not marketing, and PRISM's auto-recommended charts are built for speed and
  defensibility rather than for beauty.
- Even a successful post produces the exact vanity metric we said we would not count.
- Risk of looking like astroturf if the tool credit reads as the reason for the post.

**Verdict: low priority, and only in its honest form.** If the founder makes a genuinely
interesting visualization from a public dataset and wants to post it with the source and tool
cited per the rules, that is fine and it is not a campaign. Do not build a launch beat around
it, and do not let anyone measure it.

### 4.3 r/privacy

**For:**

- Ideologically aligned, and they will actually read the CSP. Another source of free
  adversarial verification.
- If this community concludes the claim holds, that is a strong external signal we can cite.
- Nobody is better at spotting a privacy claim that quietly does not hold.

**Against:**

- The audience is privacy-conscious individuals, not regulated-industry analysts. Almost zero
  ICP overlap. They are not the buyer and mostly not the user.
- Deeply hostile to promotion, and correctly so. A proprietary licence and a closed-source
  posture will draw immediate, reasonable fire that we cannot currently answer well.
- The CDN dependency for the Pyodide runtime will be raised, and it is a legitimate point
  that needs a prepared, honest answer.
- Low commercial value even when it goes well.

**Verdict: yes, but reframed.** Post it as a request for scrutiny, not an announcement:
here is the architecture, here is how to verify it, tell me what I got wrong. Value is the
audit and the resulting credibility, not leads. Only after G1 and G3 close, since licensing
incoherence and an unpatched advisory are precisely what this crowd will find.

### 4.4 LinkedIn

**For:**

- The founder's ex-KPMG network is Tier 1A almost by definition. This is the warmest, highest
  fit audience we will ever have and it costs nothing to reach.
- The credibility transfer works here better than anywhere: a former Big Four IT auditor
  writing about data custody is read as a practitioner, not a vendor.
- Content travels inside the exact organizations we want: audit firms, banks, hospitals.
- Every reaction has a name and a job title attached, so we can go from post to conversation
  to interview in one step. That is the opposite of a vanity metric.
- Repeatable. Unlike Hacker News or Product Hunt, we can do this every week indefinitely.
- Best source of discovery interviews by a wide margin.

**Against:**

- Reach is modest and slow relative to the tech channels.
- Founder-brand dependent, which is a real single point of failure.
- Professional reputation is on the line in front of former colleagues, which raises the cost
  of any overclaim. That is an argument for discipline, not for avoiding the channel.
- The platform rewards a tone our messaging rules ban. Write plainly and accept lower reach.

**Verdict: yes, highest priority, and the only channel we run continuously.** This is the
backbone. Everything else is a spike.

### 4.5 Product Hunt

**For:**

- Produces a durable, indexable page and a backlink.
- Some genuine discovery traffic, and the format handles a visual demo well.
- A small amount of social proof that is useful when a prospect searches for us.

**Against:**

- Audience mismatch, and it is the deepest of any channel here. The community is founders,
  makers and early adopters hunting for novelty. Our ICP is a hospital revenue cycle analyst
  who has never opened the site.
- Optimized for exactly the metrics we banned in 2.2. Rank, upvotes, badges, none of which
  correlate with a blocked analyst changing tools.
- Effectively one-shot, and the coordination effort is large.
- The "no data leaves your browser" claim gets skimmed as a tagline rather than verified,
  which wastes our strongest asset on an audience that will not check it.
- Launch-day dynamics reward hustle and mobilized networks. We have neither, and simulating
  them would be the sort of manufactured signal this whole document exists to avoid.

**Verdict: defer, and re-decide at the W8 checkpoint.** Not a launch beat. If we do it later,
it is for the artifact and the backlink, with zero expectation of users, and nobody reports
the rank.

### 4.6 Additional channels worth more than Product Hunt

- **IIA and ISACA chapter talks.** Direct Tier 1A access, the founder is credible on sight,
  and the format is a demo the audience requested. Highest conversion per hour of any channel
  on this list. Phase 4.
- **Lobste.rs.** Smaller and more technical than Hacker News, invite-only, and the comment
  quality is high. Good supplementary technical review if the founder can get an invite.
  Never cross-post the same day.
- **A written technical post on the architecture,** published on our own domain, covering how
  a CSP of default-src 'none' actually constrains a page, what Pyodide in a Web Worker does
  and does not isolate, and the limits of the guarantee. This is the asset every other channel
  links to, and it is what a security team forwards internally. It outlives every launch beat.
- **Direct outreach to healthcare analytics and internal audit leaders,** individually, by
  name, referencing their actual work. Slow, unscalable, and the most likely source of our
  first three named users.
- **Answering questions where they are already asked,** in professional forums and Q and A
  sites, about analyzing sensitive data without uploading it. Durable, compounding, and the
  intent is already correct.

---

## 5. Asset checklist

Nothing in Phase 2 starts until every item is ready.

- [ ] Verification page, with the CSP quoted, the grep shown, the network tab walkthrough,
      the offline test, and an explicit limitations section (G6)
- [ ] 45 second unedited screen recording of the empty network tab
- [ ] Landing page built from MESSAGING.md Section 4, ungated
- [ ] Technical architecture post on our own domain
- [ ] Founder's Show HN opening comment, pre-written and reviewed
- [ ] Objection responses from MESSAGING.md Section 6, printed and beside the keyboard
- [ ] Public demo dataset, from a named open source, with the URL cited on the page
- [ ] Honest current-state section on the site: early, pre-revenue, here is what is not proven
- [ ] Interview script for discovery calls, written around the last blocked file, not the product
- [ ] Thread archive set up, so critiques are captured rather than lost when the spike passes

---

## 6. Kill criteria and failure handling

**Stop and reassess if any of these occur:**

- A credible technical critique shows the no-exfiltration claim does not hold as stated. Stop
  all outbound immediately, say so publicly in the same thread that found it, fix it, and
  publish what happened. Handled this way, this is survivable and even reputation-building.
  Handled defensively, it is terminal.
- Twenty Tier 1 interviews produce no one who describes being blocked in a way PRISM would
  solve. The wedge is wrong. Reposition rather than spend more on distribution.
- People try it and do not return. The capability floor is too low. That is a product problem
  and no channel fixes it.
- We catch ourselves wanting product telemetry to answer a launch question. Refuse it, and
  answer the question by talking to a human instead. The day we add analytics is the day the
  positioning becomes marketing.

**If Hacker News goes badly:** do not repost, do not complain about it, and do not blame the
audience. Take the top three criticisms, fix them, write up the fixes, and re-enter through
the professional channels in Phase 4 where the audience is the actual ICP. A bad HN thread is
cheap market research as long as nobody gets defensive in public.

---

## 7. What this plan deliberately does not do

- No paid acquisition. We do not know the message works yet, and paying to distribute an
  unvalidated message just buys a faster wrong answer.
- No press or analyst outreach. There is no story yet beyond a founder and a repo, and
  spending a first-contact on that is wasteful.
- No email list building before we have something worth sending.
- No launch video, no logo work, no brand system. The 45 second unedited screen recording
  outperforms all of it with this audience.
- No growth targets. We have no users and no baseline, so any number here would be invented,
  and inventing numbers is the one thing this company cannot afford to be caught doing.
