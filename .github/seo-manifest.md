# moderntax.io canonical, redirect and tracking manifest

Covers the lender-path brief of Nov 17 2026: SEO-01, SEO-02, SEO-03 and the R1 event mapping.
This file lives under `.github/` because `docs/` is the published API reference
(moderntax.io/docs). `_redirects` returns 404 for `/.github/*`.

## SEO-01: canonical URL form

**Decision: extensionless paths. The root and directory indexes keep a trailing slash.**
Examples: `/`, `/plans`, `/products/`, `/products/qoe-screening`, `/docs/`.

Hosting evidence (production, checked with curl on 2026-11-17, before this change):

| Request | Result |
|---|---|
| `/plans.html` | 200 |
| `/plans` | 200, same file |
| `/plans/` | 301 to `/plans` |
| `/products` | 301 to `/products/` |
| `/products/qoe-screening` and `.html` | both 200 |
| `/privacy` and `/privacy.html` | both 200 |
| `/robots.txt`, `/sitemap.xml` | 404 (missing) |

Netlify already serves every page at both URLs, which creates duplicate content. Now that
both forms are shown to return the same file, each `.html` URL gets an explicit
`301!` to its extensionless twin in `_redirects`. There is no wildcard rule and no
redirect to the home page. Check these on the deploy preview before release. To roll
back, delete that block in `_redirects`.

Links, `<link rel="canonical">`, `og:url` and `sitemap.xml` were updated together.
Product pages and the shared nav and footer come from `.github/tools/product-pages-build.mjs`,
which writes extensionless links.

| Page | Source file | Canonical | Sitemap | Notes |
|---|---|---|---|---|
| Home | `index.html` | `https://moderntax.io/` | yes | COPY-01 title and description |
| Pricing | `plans.html` | `/plans` | yes | `/pricing` 301 to `/plans` |
| Products overview | `products/index.html` | `/products/` | yes | |
| Compliance Verification | `products/compliance-verification.html` | `/products/compliance-verification` | yes | |
| Continuous Monitoring | `products/continuous-monitoring.html` | `/products/continuous-monitoring` | yes | COPY-03 |
| Employment & Income Verification | `products/employment-income-verification.html` | `/products/employment-income-verification` | yes | COPY-06 |
| Payroll Liability (941) | `products/payroll-liability-941.html` | `/products/payroll-liability-941` | yes | COPY-04 |
| QoE Screening | `products/qoe-screening.html` | `/products/qoe-screening` | yes | COPY-05 |
| QoE Agent | `products/qoe-agent.html` | `/products/qoe-agent` | yes | POL-01 gated, no price |
| QoE Full-Service | `products/qoe-services.html` | `/products/qoe-services` | yes | POL-01 gated, no price |
| Check Reissue Recovery | `products/check-reissue-recovery.html` | `/products/check-reissue-recovery` | yes | COPY-08 |
| Partner API & MCP | `products/partner-api-mcp.html` | `/products/partner-api-mcp` | yes | developer path |
| SBA 504 | `use-cases/sba-504.html` | `/use-cases/sba-504` | yes | |
| SBA 7(a) | `use-cases/sba-7a.html` | `/use-cases/sba-7a` | yes | |
| Commercial lending | `use-cases/commercial-lending.html` | `/use-cases/commercial-lending` | yes | |
| Employment & HR | `use-cases/employment-hr.html` | `/use-cases/employment-hr` | yes | COPY-06 |
| Tax payment verification | `use-cases/tax-payment-verification.html` | `/use-cases/tax-payment-verification` | yes | COPY-07 |
| Tax resolution firms | `use-cases/tax-resolution.html` | `/use-cases/tax-resolution` | yes | `/tax-resolution` 301 here |
| How it works (agents) | `how-it-works.html` | `/how-it-works` | yes | IRS-facing automation wording pending Matt/counsel |
| Developers | `developers.html` | `/developers` | yes | developer path |
| API reference | `docs/index.html` | `/docs/` | yes | canonical API docs |
| Walkthrough | `walkthrough.html` | `/walkthrough` | yes | |
| Privacy | `privacy.html` | `/privacy` | yes | entity text is held for LEGAL-01 |
| SMS terms | `terms.html` | `/terms` | yes | |
| SMS opt-in | `sms-opt-in.html` | `/sms-opt-in` | no | indexable, but a compliance page rather than a marketing page |
| Walkthrough thanks | `walkthrough-thanks.html` | none | no | `noindex`. Kept at `.html` because it is the form action |
| Demos | `demos/*.html` | none | no | framed by the walkthrough and developers pages. Disallowed in robots.txt |
| Sandbox interface | `sandbox-interface.html` | none | no | served on sandbox.moderntax.io. Disallowed |
| Old home | `index-old.html` | none | no | already 301s to `/` (netlify.toml) |

## SEO-02: robots.txt and sitemap.xml

- `robots.txt` allows the site. It disallows `/api/`, `/.netlify/`, `/employment-verify/` (functions),
  `/demos/`, `/sandbox-interface.html`, `/walkthrough-thanks` and `/.github/`. It also names the sitemap.
- `sitemap.xml` lists the 24 canonical, indexable marketing pages in the table above. It leaves out
  login, the portal (portal.moderntax.io), API endpoints and previews.
- Netlify serves deploy previews and branch deploys with `X-Robots-Tag: noindex`. Check this on each
  preview with `curl -I`.

## SEO-03: snippets

- Home uses the COPY-01 title and meta description.
- Every page in the sitemap has its own title and description.
- Organization and BreadcrumbList structured data are **not** added. They wait on entity
  verification (LEGAL-01).

## SEO-04: 404 triage

This is still open. It needs a Search Console or log export of legacy paths and subdomains. The known
legacy paths are already handled: `/index-old*` and `/docs/moderntax-redesign.html` go to `/`, and
`/docs/developers.html` goes to `/developers`.

## R1: event mapping (tracking spec)

DATA-01 is undecided. There is no GA4 tag on the site, and none was added. The only collector
already in use is the portal's custom endpoint `POST https://portal.moderntax.io/api/analytics/track`.
It accepts `type` in {page_view, session_start, feature_used}, and its CORS rules allow moderntax.io
and www.moderntax.io.

| Event | Where | Status |
|---|---|---|
| EV-1 `site_cta_click` | Home primary CTA (`[data-cta="home_primary"]`), sent with sendBeacon to the collector as `type: feature_used` | **Implemented** in this change |
| EV-2 `signup_started` / `signup_completed` | Portal | Mapping only. Exclude sandbox and test traffic |
| EV-3 `authorization_accepted` | Portal backend, on a validated transition | Mapping only |
| EV-4 `order_submitted` | Portal backend, once the order is persisted | Mapping only. The portal has `live_file_submitted` today |
| EV-5 `billable_delivery_completed` | Internal only | Mapping only |
| EV-6 `quote_accepted` / `cash_collected` | Internal only | Mapping only |
| EV-7 `sandbox_started` / `sandbox_key_issued` | Portal sandbox signup | Mapping only. Never send the key, token or email |

EV-1 payload (`metadata`):

```
event_name: "site_cta_click"
schema_version: 1
occurred_at: ISO-8601 click time (client)
event_id: crypto.randomUUID() (fallback: time + random)
environment: "production" | "preview"   // only production hosts send
page_key: "home"
cta_id: "home_primary"
placement: "hero"
destination_class: "portal_order"
source: "home_cta"                      // normalized source code
funnel_step: "cta_click"                // existing portal funnel join (lib/cta-funnel.ts)
experiment: "homepage_primary_cta"      // existing portal funnel join
variant: "start_a_verification"         // was "submit_a_live_file" before COPY-01
```

`path` is the fixed string `/`. The site no longer sends `referrer`, the full URL, query
strings, emails, names, TINs, or account, order, quote or payment IDs. Preview and localhost
builds put the payload together (it can be inspected as `window.__mtLastCtaEvent`) but do not send it.

Collector caveats for DATA-01. These are portal-side and out of scope for this change:

- The collector adds user id, email, role, client id, IP and user agent when the visitor is
  signed in to the portal. That is fine for an internal product table. It must not be forwarded to a
  marketing destination.
- The click and the receipt do not have separate times. The row's `created_at` is the receipt time, and
  `metadata.occurred_at` is the click time.
- The collector does not enforce idempotency on `event_id`. Dedupe on it when reporting.
- There is no consent banner yet, so consent accept, refuse and withdraw (QA-03) cannot be tested.
  That waits on DATA-01.
