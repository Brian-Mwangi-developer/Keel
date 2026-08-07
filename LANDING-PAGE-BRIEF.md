# Keel — landing page brief

This is a content + product brief for building a marketing landing page in Next.js.
It describes **what Keel is, who it's for, and what the page needs to say and show** —
not how to code it. When you build this, load the `saas-ui-design` skill first and let
it make the visual-craft decisions; this doc is the input to that process, not a
substitute for it.

---

## 1. What Keel is, in one paragraph

Keel is a trust layer for data pipelines, built on top of DataHub. It computes a live
score — 0 to 100 — for every table, dashboard, and model in a pipeline, and that score
is **inherited**: nothing can be more trustworthy than the data it's built from. When a
bad event enters at the source, Keel shows the damage traveling downstream in real
time — which dashboards are now unreliable, which ML models are affected, who owns each
one — before a human notices anything is wrong. It answers one question nobody could
answer quickly before: *"is this number on my screen actually true right now?"*

## 2. The problem (what the page needs to make someone feel)

A dashboard can be working perfectly — query is correct, chart renders, page loads —
and still be **showing a lie**, because something four steps upstream broke twenty
minutes ago and nobody connected the two. The dashboard has no way to know. The person
who owns the broken upstream table doesn't know the dashboard exists. Today, finding
this out takes an incident, a war room, and a very unhappy executive. Keel finds it in
under a minute, automatically, before anyone acts on the bad number.

This is the emotional core of the page: **the scariest bugs are the ones where nothing
looks broken.** Lead with that, not with feature bullets.

## 3. Who this is for

- **Data platform / data engineering teams** at companies with real pipelines (Snowflake,
  Kafka, Spark, dbt) who already run DataHub or are evaluating a catalog.
- **Data leaders / heads of data** who need to answer "can I trust this number" for
  execs, without personally tracing lineage by hand.
- Secondary: teams building AI agents against a warehouse, who need the agent to know
  what's safe to query and what isn't.

## 4. The core mechanic (the one thing to explain well)

State this in plain language, once, prominently — it's the whole product:

> Every asset's trust score is capped by the least trustworthy thing it's built from.
> A perfectly healthy dashboard still drops to 61 if the table underneath it is broken —
> not because anything is wrong with the dashboard, but because of what it's made of.

The formula, if you want a technical callout for credibility (not hero copy):

```
trust = min( own_hygiene × validity_gate,  min(upstream_trust) + hop_recovery )
```

- `own_hygiene` — freshness, schema stability, ownership, documentation (all pulled from DataHub)
- `validity_gate` — did this asset's own data-quality checks pass? A failing critical
  check zeroes this out.
- `upstream_trust` — the lowest score among everything this asset is built from
- `hop_recovery` — damage fades ~14 points per hop of distance, so one bad source
  doesn't paint the entire pipeline red — it produces a real gradient (a dashboard
  three hops away reads differently than the table that's actually broken)

**Why this can only exist on top of DataHub:** you cannot compute "what is this built
from" without a real lineage graph. That's the technical proof point — Keel isn't a
health-check dashboard, it's something that's structurally impossible without lineage
metadata already being tracked.

## 5. What the product actually does (feature-level, in priority order)

1. **Live trust scoring** for every asset in a pipeline — tables, dashboards, ML models —
   updating in real time as upstream data changes.
2. **Visual lineage propagation** — when something breaks, you watch the damage travel
   hop by hop through a graph, not just see a static red dot.
3. **Root-cause drill-down** — click any low score and see exactly which upstream asset
   capped it, how many hops away, and the literal bad row/event that caused it.
4. **Blast-radius + ownership** — instantly see every team and asset affected by a
   break, and alert the right owners (pulled from DataHub, not hardcoded).
5. **Plain-language verdicts** — every score comes with "Safe to use" / "Use with care" /
   "Don't trust today," never a bare number. (This matters for the page's tone too —
   Keel talks like a person, not a dashboard.)
6. **Governance actions** — flag downstream assets as unsafe (writes a deprecation tag
   to DataHub) so nothing new gets built on broken data while it's being fixed.
7. **Full CRUD on the pipeline itself** — connect a new source (runs it through
   Spark → Snowflake → DataHub live), create/edit/delete data-quality rules, and watch
   the whole pipeline re-score instantly. This is proof the numbers are computed, not
   fixtures.

## 6. Suggested page structure

Standard long-form SaaS landing page, but keep it lean — this is a hackathon/early
product page, not an enterprise site with twelve sections.

1. **Hero** — headline + subhead that leads with the problem/feeling from §2, not a
   feature list. Primary CTA (e.g. "See it break live" / "Watch the demo" / "Try it").
   A hero visual showing the actual product (the trust index dropping, or the
   lineage graph mid-propagation) beats an abstract illustration — see §7.
2. **The moment of trust** — a short section stating the core mechanic from §4 in one
   or two sentences, ideally with a small before/after visual (dashboard at 90 → 61,
   nothing about the dashboard itself changed).
3. **How it works / the graph** — visual explanation of inherited trust: a small
   lineage chain with scores cascading, annotated simply.
4. **Feature highlights** — 3–4 of the items from §5, each shown with real product UI
   (screenshot or lightweight recreation), not icon+text cards. Prioritize live
   propagation, root-cause drill-down, and ownership/alerting.
5. **Built on DataHub** — brief credibility section: this isn't a new catalog, it's
   the layer on top of the metadata graph you already have (or are adopting).
6. **CTA / closing** — repeat the emotional hook from §2 in one line, plus a final CTA.

Skip: pricing, testimonials, logos, the "3 icon cards" feature grid, integrations
marquee — none of these are earned yet, and forcing them in reads as filler.

## 7. Visual material available for the page

The real product UI already exists as a static HTML/CSS/JS prototype at
`keel-ui/` in this repo, and it's the source of truth for how Keel actually looks
(design tokens, color system, typography). **Reuse its screenshots or its actual
markup/styling for hero and feature visuals wherever possible** — real product UI is
more credible than any illustration or mockup you'd generate fresh, and it means the
landing page and the product look like one thing, not two.

Specifically worth capturing as visuals for the page:
- The trust index chart mid-drop (the "before/after" moment from §4)
- The lineage constellation mid-propagation (red spreading hop by hop)
- The drill-down drawer showing a root-cause chain with the actual bad event payload
- The plain-language verdict line stating a finding in one sentence

Do not invent new UI for the landing page that contradicts `keel-ui/`'s design system
(see below) — the page should look like it was designed by the same team, same day.

## 8. Design system (carried over from the product — do not deviate without reason)

This was deliberately built to avoid generic AI-generated SaaS aesthetics. Preserve
these decisions on the landing page:

**Color — two families only, nothing else:**
- One accent (indigo, `#4f46e5`) — used *exclusively* for interactive elements
  (buttons, links, focus states). It never carries meaning about good/bad.
- One status ramp for trust, validated for colorblind-safety — don't substitute a
  different red/amber/green without re-validating:
  - Good: `#0e9f6e` (safe to use)
  - Warning: `#e3a008` (use with care)
  - Bad: `#e02424` (don't trust)
- No third color anywhere on the page. No gradients, no decorative color.

**Typography:**
- **Inter** for all prose, headings, UI copy.
- **JetBrains Mono** reserved specifically for anything that looks like it came from a
  machine — code snippets, table/column names, event payloads, URNs. This pairing is
  semantic (it signals "this is a real system," not decorative monospace).

**Overall aesthetic:** cool-neutral light theme, technical but calm. Structure comes
from hairline borders and whitespace, not shadows — cards get a 1px border and minimal
shadow, never heavy drop shadows or glassmorphism. No gradient backgrounds, no glowing
blobs, no particle effects. This is a tool for people who move real money and real
data through pipelines; it should look precise and trustworthy, not flashy.

**Tone of voice:** plain language over jargon, always paired with a verdict. Never
show a bare number without saying what it means ("61 — use with care," not just "61").
Avoid data-platform insider vocabulary in anything customer-facing (this was a real
correction made during the product build — words like "estate," "hygiene," and
"quarantine" were replaced with "pipeline," "health," and "flag as unsafe" because a
first-time viewer couldn't parse them).

## 9. Naming note

The name "Keel" is a nautical metaphor — a keel is the structural spine along the
bottom of a ship's hull, the first piece built and the one everything else depends on
for both strength and staying upright. It maps to the product's core mechanic
(inherited trust — nothing is stronger than what's underneath it), but the metaphor
does not explain itself on sight. **The landing page's job is to make the name earn
itself** — either through a tagline that states the mechanic plainly near the logo
(e.g. "Keel — nothing is more trustworthy than what it's built on"), or by never
relying on the name alone to carry meaning. Don't assume a first-time visitor knows
what a keel is.

## 10. What NOT to do

- Don't write generic SaaS copy ("Unlock the power of your data," "One platform for
  all your data needs"). Every sentence should be specific to the trust/lineage
  mechanic — if a sentence could describe any data tool, cut it.
- Don't add a pricing table, testimonials, or customer logos — none exist yet and
  fabricating them would misrepresent the product's actual stage.
- Don't invent integrations, partners, or a company backstory that isn't established
  in this brief or in `keel-ui/`.
- Don't use stock illustration, 3D renders, or abstract "data flowing" hero graphics —
  use real product screenshots per §7.
- Don't deviate from the two-color-family system in §8 to "make the hero pop." The
  restraint is the point.
