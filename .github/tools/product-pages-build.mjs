// Generates /products/*.html and injects the shared nav + footer into the site's pages.
// Usage: node .github/tools/product-pages-build.mjs <site-root>
// Canonical URL form (SEO-01): extensionless, e.g. /products/qoe-screening, /plans.
// See .github/seo-manifest.md.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2];
if (!ROOT) throw new Error('site root required');

const SANDBOX = 'https://portal.moderntax.io/sandbox';
const TALK = '/walkthrough#get-access';
const ORDER = 'https://portal.moderntax.io/new';
const SOP_URL = 'https://www.sba.gov/document/sop-50-10-lender-development-company-loan-programs';
const PLAN_NOTE = 'Your quote or signed agreement defines covered services, billing and cancellation terms. Review those terms before submitting an order.';
// Enterprise focus for 2027 (Matt, Nov 17 2026): no prices anywhere on the site.
// Pricing is shared after a demo and set in the customer's MSA.
const MSA_NOTE = 'Pricing is shared after a demo and set in your master services agreement (MSA), sized to your volume and the products you use.';
const SITE = 'https://moderntax.io';
const BRAND = 'ModernTax Compliance Platform';
const TAGLINE = 'End-to-end compliance services for commercial and SBA lenders — screening, verification, Quality of Earnings, monitoring and recovery.';

const MARK = `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><rect x="3" y="6" width="3.4" height="16" fill="currentColor"/><rect x="21.6" y="6" width="3.4" height="16" fill="currentColor"/><path d="M6.4 6 L14 18 L21.6 6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="square" stroke-linejoin="miter"/><circle cx="14" cy="22.5" r="1.6" fill="var(--accent)"/></svg>`;
const CHEV = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M19 9l-7 7-7-7"/></svg>`;
const CHECK = `<span class="check"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 6.2 L4.8 8.5 L9.5 3.6" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

// ───────────────────────── PRODUCTS ─────────────────────────
// NO PRICES ARE RENDERED (Nov 17 2026, enterprise/MSA-only). The price/pricing
// fields below are kept only as internal reference and are not output.
// Prices (historical note): ONLY verified MSA numbers that the lender-path brief (Nov 17 2026)
// leaves publishable. Anything gated (COMM-01, COMM-02, POL-01) is "Quoted" or
// "Contact us" until the owner decision exists. Do not reintroduce:
//   - an isolated $49.99 Tier C rate (COMM-02)
//   - a monitoring charge trigger / cadence / auto-stop (COMM-01)
//   - the $1,000 check-reissue fee trigger (POL-01 / COMM-02)
//   - "per quarter" 941 pricing (COPY-04)
//   - same-day / real-time / no-fax promises (OPS-01)
// Every product page leads with a lender action; the sandbox is a separate,
// clearly-developer link that does not promise every product works there.
const P = [
  {
    slug: 'compliance-verification',
    stage: 'verify',
    name: 'Compliance Verification',
    short: 'Filed and unfiled years, balances and IRS-of-record figures for businesses and individuals.',
    price: '$84.99 / entity',
    title: 'Compliance Verification',
    desc: 'Review a borrower\'s IRS filing status and balances before you fund: filed and unfiled years, balances due and IRS-of-record figures from IRS transcripts, authorized with a signed Form 8821.',
    h1: 'Know a borrower\'s IRS standing <span class="italic-em">before you fund.</span>',
    lede: 'Which years are filed, which are not, what is owed, and what the IRS has on record for revenue and income — for businesses and individuals, authorized with a signed Form 8821 and delivered in the portal or by API.',
    cta: { primary: ['Start a verification', ORDER], secondary: ['Talk to us', TALK] },
    whatHead: 'One order answers the questions underwriting actually asks.',
    what: [
      ['Filed &amp; unfiled years', 'Year by year, whether a return is on record with the IRS — including the years that come back &ldquo;no record&rdquo;, with the reason, so a missing return is caught before closing rather than after.'],
      ['Balances &amp; account activity', 'Record of Account data: balance due, assessed penalties and interest, payments and the IRS transaction codes behind them.'],
      ['IRS-of-record figures', 'Gross receipts, total income, net income and total tax as the IRS has them — ready to compare against the returns the borrower handed you.'],
      ['Pre-filled Form 8821', 'Enter the taxpayer once and get a pre-filled Form 8821 with only the signature left. Upload the signed form to the order.'],
      ['Portal or API delivery', 'PDF transcripts plus structured JSON and a compliance summary, on the order in the portal and through the API.'],
      ['What a result means', 'A result reflects the IRS transcript at retrieval. Keep it with your loan file and use it alongside the borrower&rsquo;s own documents.'],
    ],
    forms: ['1040', '1065', '1120', '1120-S', '941', 'Return Transcript', 'Record of Account', 'Account Transcript', 'Entity Transcript'],
    steps: [
      ['Submit the taxpayer', 'Portal form, CSV upload or one API call. Business returns state the fiscal year end; years and form type travel with the order.'],
      ['Sign the 8821', 'A pre-filled 8821 comes back with only the signature open. It goes through your own closing process, then is uploaded to the order.'],
      ['We request from the IRS', 'Once the signed 8821 is in, the request goes to the IRS and its status is tracked in the portal and the API.'],
      ['Read the result', 'PDF transcripts, structured JSON and a compliance summary land on the order, by webhook or poll.'],
    ],
    pricing: [
      ['Tier A · Pay-as-you-go', '$84.99', '/ entity', 'Self-serve. Card on file, no minimum, no contract.'],
      ['Tier B · Deposit', '$64.99', '/ entity', 'Prepaid balance; each verification draws against it.'],
      ['Custom volume plan', 'Quoted', '', 'Request a quote for the platform subscription, included usage and per-entity pricing.'],
      ['Reorder', '$29.99', '/ TIN', 'Re-pull a prior taxpayer for new years on the 8821 already on file.'],
    ],
    pricingCols: 4,
    related: ['continuous-monitoring', 'payroll-liability-941', 'partner-api-mcp'],
  },
  {
    // COPY-03 — gate COMM-01. Replaces the product block and the pricing FAQ together.
    slug: 'continuous-monitoring',
    stage: 'monitor',
    name: 'Continuous Monitoring',
    short: 'Follow-up transcript requests for a filing that came back missing.',
    price: 'Quoted',
    title: 'Continuous Monitoring',
    desc: 'Track unresolved IRS filing records: ask ModernTax about follow-up transcript requests for a missing filing, with the check schedule, charges and stopping rule confirmed in your quote before enrollment.',
    h1: 'Track unresolved IRS <span class="italic-em">filing records.</span>',
    lede: 'Ask us about follow-up transcript requests for a missing filing. Confirm the check schedule, charges and stopping rule in your quote before enrollment.',
    cta: { primary: ['Review monitoring terms', TALK], secondary: ['How it works', '/how-it-works'] },
    whatHead: 'Follow up on the year that came back missing.',
    what: [
      ['Starts from a missing filing', 'Monitoring is for a tax year that came back with no record on the original verification.'],
      ['Terms in your quote', 'The check schedule, charges and stopping rule are confirmed in your quote before any entity is enrolled.'],
      ['Results on the original order', 'When a follow-up request returns a transcript, it is added to the order your team already works from.'],
    ],
    steps: [
      ['Ask about a missing filing', 'Tell us which entity and tax year came back with no record.'],
      ['Confirm the terms', 'Agree the check schedule, charges and stopping rule in your quote before enrollment.'],
      ['Read follow-up results', 'Transcripts from follow-up requests land on the original order in the portal and the API.'],
    ],
    pricing: [
      ['Continuous Monitoring', 'Quoted', '', 'Check schedule, charges and stopping rule are set in your quote before enrollment.'],
      ['Reorder', '$29.99', '/ TIN', 'Prefer a one-off follow-up? Reorder new years on the 8821 already on file.'],
    ],
    related: ['compliance-verification', 'check-reissue-recovery', 'partner-api-mcp'],
  },
  {
    // COPY-06 — gate POL-01.
    slug: 'employment-income-verification',
    stage: 'verify',
    name: 'Employment &amp; Income Verification',
    plain: 'Employment & Income Verification',
    short: 'IRS-reported W-2 and 1099 wage and income information.',
    price: 'Contact us',
    title: 'Employment &amp; Income Verification',
    desc: 'Review IRS-reported wage and income information from IRS Wage & Income transcripts. Records may be incomplete for the current processing year and do not establish current employment.',
    h1: 'Review IRS-reported wage <span class="italic-em">and income information.</span>',
    lede: 'Wage and income transcripts show information reported to the IRS. Records may be incomplete, especially for the current processing year, and do not establish current employment. Use the results with other verification sources.',
    cta: { primary: ['Talk to us', TALK], secondary: ['How it works', '/how-it-works'] },
    whatHead: 'What the wage and income transcript shows.',
    what: [
      ['W-2 wages', 'Employer, wages and withholding as reported to the IRS on Form W-2, year by year.'],
      ['1099 income', '1099-NEC, 1099-MISC, 1099-K and other information returns, by payer, as reported to the IRS.'],
      ['Multi-year history', 'Request several tax years in one order to compare what was reported over time.'],
      ['Signed Form 8821', 'The individual signs a pre-filled 8821, which you upload to the order.'],
      ['Structured JSON', 'Parsed employer and payer records alongside the PDF transcript.'],
      ['Known limits', 'Information returns can post late or be missing, especially for the current processing year. A transcript does not show current employment.'],
    ],
    forms: ['W-2', '1099-NEC', '1099-MISC', '1099-K', 'Wage &amp; Income Transcript'],
    steps: [
      ['Submit the individual', 'Name, SSN and tax years — through the portal or the API.'],
      ['Consent by 8821', 'The individual signs the pre-filled 8821; you upload it.'],
      ['Receive the record', 'Wage &amp; Income transcript as PDF plus structured JSON, to use with your other verification sources.'],
    ],
    pricing: [
      ['Employment &amp; Income Verification', 'Contact us', '', 'Pricing depends on volume and integration. Talk to us for a quote.'],
    ],
    pricingCols: 1,
    related: ['compliance-verification', 'partner-api-mcp', 'continuous-monitoring'],
  },
  {
    // COPY-04 — gates COMM-02 (publication + quarters presentation) and OPS-01.
    slug: 'payroll-liability-941',
    stage: 'verify',
    name: 'Payroll Liability (941) Report',
    plain: 'Payroll Liability (941) Report',
    short: 'Payroll-tax filings and balances from IRS Form 941 account transcripts.',
    price: '$30 / entity, per tax year',
    title: 'Payroll Liability (941) Report',
    desc: 'Form 941 payroll liability report: employment-tax filings and outstanding balances from IRS account transcripts. Covered quarters and authorization scope are confirmed in your MSA.',
    h1: 'The liability an income transcript <span class="italic-em">won&rsquo;t show.</span>',
    lede: 'A business can be current on its income tax return and still be behind on payroll withholding. The 941 report reads IRS account transcripts and surfaces outstanding employment-tax balances before they become your problem.',
    cta: { primary: ['Confirm payroll report scope', TALK], secondary: ['How it works', '/how-it-works'] },
    whatHead: 'Payroll-tax exposure from the IRS account transcript.',
    what: [
      ['Covered quarters', 'Form 941 account transcripts for the quarters confirmed in your quote, within the tax years you request.'],
      ['Outstanding balances', 'Unpaid payroll-tax balances, penalties and interest as the IRS has them assessed.'],
      ['Trust-fund exposure', 'Withheld taxes that were not paid over carry personal exposure for responsible persons — see it at underwriting, not in a demand letter.'],
      ['Alongside income verification', 'Order it on the same taxpayer as a Compliance Verification so both views sit on one order.'],
    ],
    forms: ['941', 'Account Transcript'],
    steps: [
      ['Confirm the scope', 'Confirm covered quarters and authorization scope in your quote.'],
      ['Add 941 to the order', 'Choose Form 941 and the tax years to cover on a business order.'],
      ['Read the report', 'Filing status and balances for the covered quarters, as PDF and structured JSON.'],
    ],
    pricing: [
      ['Payroll Liability (941) Report', '$30', '/ entity, per requested tax year', 'Confirm covered quarters and authorization scope in your quote. Existing signed terms control.'],
    ],
    pricingCols: 1,
    related: ['compliance-verification', 'qoe-screening', 'check-reissue-recovery'],
  },
  {
    // COPY-05 — gate POL-01. No loan-amount-only eligibility, no numeric threshold.
    slug: 'qoe-screening',
    stage: 'screen',
    name: 'QoE Screening',
    short: 'Screen a transaction for a Quality of Earnings scope discussion.',
    price: 'Contact us',
    title: 'QoE Screening',
    desc: 'Screen a transaction for a Quality of Earnings scope discussion: review transaction type, business purchase price and applicable exceptions under SBA SOP 50 10 8.1 with technical policy updates. Screening does not replace an independent QoE report or Cash Proof.',
    h1: 'Screen a transaction for a <span class="italic-em">QoE scope discussion.</span>',
    lede: `Review transaction type, business purchase price and applicable exceptions under <a href="${SOP_URL}" rel="noopener" style="color:var(--accent-ink);text-decoration:underline;text-underline-offset:3px;">SBA SOP 50 10 8.1 with technical policy updates</a> (effective October 1, 2026). Transcript screening can support a review; it does not replace an independent Quality of Earnings report or Cash Proof.`,
    cta: { primary: ['Review transaction scope', TALK], secondary: ['How it works', '/how-it-works'] },
    whatHead: 'Support for the review, not a substitute for it.',
    what: [
      ['Transaction context', 'Discuss transaction type, business purchase price and any applicable exceptions with your team before scoping a review.'],
      ['Reads the IRS record', 'The screen runs on transcripts already pulled: filed years, reported revenue and earnings, and the fiscal year end.'],
      ['Flags for the underwriter', 'Unfiled years, negative earnings and falling revenue are flagged for the underwriter to review.'],
      ['Not a QoE report', 'Screening does not replace an independent Quality of Earnings report or Cash Proof, and does not decide whether one is required.'],
    ],
    steps: [
      ['Verify', 'A Compliance Verification order pulls the business&rsquo;s IRS transcripts.'],
      ['Screen', 'Run the screen on the order and read the flags.'],
      ['Discuss scope', 'Review the transaction against the SBA SOP with your team and the independent reviewer.'],
    ],
    pricing: [
      ['QoE Screening', 'Contact us', '', 'Screening runs on Compliance Verification orders. Talk to us about enabling it.'],
    ],
    pricingCols: 1,
    related: ['compliance-verification', 'payroll-liability-941', 'continuous-monitoring'],
  },
  {
    // QoE Agent — gate POL-01. AI-assisted with human review. No price (internal range is not
    // approved for publication), no turnaround, no accuracy or "automated QoE" claim, and never
    // presented as the independent QoE that SBA SOP 50 10 8.1 may require.
    slug: 'qoe-agent',
    stage: 'qoe',
    name: 'QoE Agent',
    short: 'AI-assisted Quality of Earnings analysis on IRS-of-record data and borrower financials, with human review.',
    price: 'Contact us',
    title: 'QoE Agent',
    desc: 'The ModernTax QoE Agent: AI-assisted Quality of Earnings analysis built on IRS-of-record data and borrower financials, with human review. Supports a lender\'s review and scoping; it is not by itself an independent QoE report.',
    h1: 'Quality of Earnings analysis, <span class="italic-em">AI-assisted and human-reviewed.</span>',
    lede: 'The QoE Agent works from IRS-of-record data and the borrower&rsquo;s financials to prepare a Quality of Earnings analysis, and a person reviews it before it reaches you. It supports your underwriting and scoping; on its own it is not an independent Quality of Earnings report.',
    cta: { primary: ['Scope a QoE', TALK], secondary: ['QoE full-service', '/products/qoe-services'] },
    whatHead: 'Built on the record, checked by a person.',
    what: [
      ['IRS-of-record inputs', 'Starts from the transcripts on the order: filed years, reported revenue and earnings, balances and the fiscal year end.'],
      ['Borrower financials', 'Works alongside the financial statements and returns the borrower provided, and flags where they differ from the IRS record.'],
      ['Human review', 'A person reviews the agent&rsquo;s analysis before it is delivered. Nothing goes out as an unreviewed machine result.'],
      ['Scope first', 'What the analysis covers for a given transaction is confirmed with you before work begins.'],
      ['Not the independent review', `Where <a href="${SOP_URL}" rel="noopener">SBA SOP 50 10 8.1 with technical policy updates</a> calls for an independent Quality of Earnings report, the agent&rsquo;s analysis does not replace it.`],
      ['On the same order', 'The analysis sits with the verification on the order your team already works from.'],
    ],
    steps: [
      ['Scope', 'Tell us about the transaction; we confirm what the analysis covers.'],
      ['Gather inputs', 'IRS transcripts from a Compliance Verification order, plus the borrower&rsquo;s financials.'],
      ['Agent analysis', 'The agent prepares the analysis and flags differences from the IRS record.'],
      ['Human review', 'A reviewer checks the analysis before it is delivered to you.'],
    ],
    pricing: [
      ['QoE Agent', 'Contact us', '', 'Scope and pricing are confirmed before work begins.'],
    ],
    pricingCols: 1,
    related: ['qoe-services', 'qoe-screening', 'compliance-verification'],
  },
  {
    // QoE full-service — gate POL-01. Whether an engagement meets SBA SOP independence
    // requirements is NOT claimed here; it is confirmed in scoping.
    slug: 'qoe-services',
    stage: 'qoe',
    name: 'QoE Full-Service',
    short: 'Quality of Earnings engagements run by ModernTax, scoped to your transaction.',
    price: 'Contact us',
    title: 'Quality of Earnings Full-Service',
    desc: 'ModernTax-run Quality of Earnings engagements for commercial and SBA lenders, scoped to the transaction before work begins. Contact us to scope a QoE.',
    h1: 'Quality of Earnings engagements, <span class="italic-em">run by ModernTax.</span>',
    lede: 'When a transaction needs more than a screen, ModernTax runs the Quality of Earnings engagement, starting from the IRS record and the borrower&rsquo;s financials. Scope, deliverables, timing and fees are agreed with you before work begins.',
    cta: { primary: ['Scope a QoE', TALK], secondary: ['See the QoE Agent', '/products/qoe-agent'] },
    whatHead: 'One team from screen to engagement.',
    what: [
      ['Scoped to the deal', 'Transaction type, business purchase price and any applicable exceptions are reviewed with you to set the scope.'],
      ['IRS record as an input', 'The engagement uses the IRS transcripts already on the order alongside the borrower&rsquo;s financials.'],
      ['SBA requirements', `Whether an engagement meets the requirements of <a href="${SOP_URL}" rel="noopener">SBA SOP 50 10 8.1 with technical policy updates</a> for a given transaction is confirmed during scoping, before work begins.`],
      ['Agreed terms', 'Deliverables, timing and fees are set in the engagement terms, not on this page.'],
    ],
    steps: [
      ['Screen', 'QoE Screening on the verification order frames the scope discussion.'],
      ['Scope', 'We agree the transaction scope, deliverables, timing and fees with you.'],
      ['Engagement', 'ModernTax runs the engagement and delivers the report under the agreed terms.'],
    ],
    pricing: [
      ['QoE Full-Service', 'Contact us', '', 'Scope, deliverables, timing and fees are agreed before work begins.'],
    ],
    pricingCols: 1,
    related: ['qoe-agent', 'qoe-screening', 'payroll-liability-941'],
  },
  {
    // COPY-08 — gates POL-01 / COMM-02 before any fee trigger is published.
    slug: 'check-reissue-recovery',
    stage: 'recover',
    name: 'Check Reissue Recovery',
    short: 'Review a tax-check reissue request: authorization, steps and scope.',
    price: 'Quoted',
    title: 'Check Reissue Recovery',
    desc: 'Review a tax-check reissue request: the authorization and steps needed, with scope, fees and follow-up responsibilities confirmed before work begins. IRS processing and delivery are outside ModernTax\'s control.',
    h1: 'Review a tax-check <span class="italic-em">reissue request.</span>',
    lede: 'Ask us to review the authorization and steps needed for a check-reissue request. Scope, fees and follow-up responsibilities must be confirmed before work begins. IRS processing and delivery are outside our control.',
    cta: { primary: ['Review recovery scope', TALK], secondary: ['How it works', '/how-it-works'] },
    whatHead: 'What a reissue request involves.',
    what: [
      ['Confirm the return', 'The account transcript shows when a refund check was issued and returned. We read it first, so you know what the request involves.'],
      ['Address of record', 'Where the address of record needs updating, we can prepare the IRS change-of-address filing (Form 8822-B for businesses).'],
      ['Reissue request', 'We review the authorization needed to ask the IRS to reissue the check.'],
      ['Agreed follow-up', 'Who follows up, and how, is confirmed in the scope before work begins. IRS processing and delivery are outside our control.'],
    ],
    steps: [
      ['Review', 'Pull the account transcript to confirm a returned check.'],
      ['Scope', 'Confirm authorization, fees and follow-up responsibilities.'],
      ['Request', 'Prepare the address update and reissue request as scoped.'],
    ],
    pricing: [
      ['Check Reissue Recovery', 'Quoted', '', 'Scope, fees and follow-up responsibilities are confirmed before work begins.'],
    ],
    pricingCols: 1,
    related: ['continuous-monitoring', 'payroll-liability-941', 'compliance-verification'],
  },
  {
    slug: 'partner-api-mcp',
    stage: 'build',
    name: 'Partner API &amp; MCP',
    plain: 'Partner API & MCP',
    short: 'REST, webhooks, structured JSON and an MCP server for AI agents, with a sandbox on synthetic data.',
    price: 'Quoted',
    title: 'Partner API &amp; MCP',
    desc: 'The ModernTax Partner API and MCP server: REST intake, webhooks, structured JSON, cross-reference, and Model Context Protocol tools for AI agents. Explore the sandbox against synthetic data.',
    h1: 'IRS-of-record data, <span class="italic-em">as an endpoint.</span>',
    lede: 'Embed compliance verification in your product: REST intake, webhook or polling delivery, structured JSON, a cross-reference check against borrower-stated figures, and an MCP server so AI agents can order and read results directly.',
    cta: { primary: ['Explore the sandbox', SANDBOX], secondary: ['Talk to us', TALK] },
    developer: true,
    whatHead: 'Built for platforms and the agents they run.',
    what: [
      ['REST + webhooks', 'One POST creates an order; results arrive by signed webhook or polling, with idempotent request tokens.'],
      ['Structured JSON', 'Filings with financials, transaction codes, balances and a compliance summary — alongside the PDF transcripts.'],
      ['Cross-reference', 'Compare what a borrower stated against the IRS record and get the differences back as data.'],
      ['MCP server', 'Model Context Protocol tools — verify, order, status, transcript data and cross-reference — for AI agents, on the same API key.'],
      ['Sandbox', 'A work email gets an API key against synthetic taxpayers. Not every product is available in the sandbox; the API docs list what is.'],
      ['Portal visibility', 'Every API order is also visible in the portal, so operations teams work the same record.'],
    ],
    code: `<span class="c"># Create an order</span>
curl <span class="k">-X POST</span> https://portal.moderntax.io/api/intake/transcript \\
  -H <span class="k">"x-api-key: $MT_KEY"</span> \\
  -d '{"request_token":"loan-4482","entities":[{"entity_name":"Atlas Roofing LLC",
       "tid":"88-1213417","form_type":"1120S","fiscal_year_end_month":12,
       "years":["2024","2023"]}]}'

<span class="c"># MCP: point your agent at</span>
https://portal.moderntax.io/api/mcp   <span class="c"># Authorization: Bearer $MT_KEY</span>`,
    steps: [
      ['Get a sandbox key', 'Sign up with a work email at the sandbox and get a key against synthetic data.'],
      ['Build against synthetic data', 'Exercise the order flow against simulated taxpayers and IRS outcomes.'],
      ['Go live', 'Production keys are provisioned with your agreement.'],
    ],
    pricing: [
      ['Custom volume plan', 'Quoted', '', 'Request a quote for the platform subscription, included usage and per-entity pricing.'],
      ['Sandbox', 'Free', '', 'Self-serve API key against synthetic data.'],
    ],
    related: ['compliance-verification', 'continuous-monitoring', 'employment-income-verification'],
  },
];
// Commercial-lending deal lifecycle (Matt, Nov 17): IRS data is one input, not the whole story.
const STAGES = [
  ['screen', 'Screen &amp; underwrite', 'Frame the deal before you commit underwriting time.'],
  ['verify', 'Verify', 'Confirm filings, balances, income and payroll-tax exposure against the IRS record.'],
  ['qoe', 'Quality of Earnings', 'AI-assisted analysis with human review, or a ModernTax-run engagement.'],
  ['close', 'Close', 'Clear filing conditions and keep the record with the loan file.'],
  ['monitor', 'Monitor post-close', 'Follow up on filings that were still open at closing.'],
  ['recover', 'Recover', 'Review a tax-check reissue request.'],
  ['build', 'Build', 'Run any stage from your own platform by API or MCP.'],
];
const STAGE_ORDER = Object.fromEntries(STAGES.map(([k], i) => [k, i]));
P.sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage]);
const bySlug = Object.fromEntries(P.map((p) => [p.slug, p]));
const plain = (p) => p.plain || p.name;


// ───────────────────────── AGENTS ─────────────────────────
// Public description of the agent workforce (Matt, Nov 17). Outcome terms only: never say
// software logs into IRS e-Services, automates the IRS website or uses browser automation,
// and never name vendors. No speed / accuracy / volume numbers, no "fully automated" or
// "no humans" claims, no turnaround promises (OPS-01). Matt/counsel to confirm this wording.
const AGENT_FRAME = 'Agents that prepare authorizations, request and retrieve IRS records and keep every order moving, with credentialed practitioners (CAF-registered) on every IRS interaction and accountable for every request.';
const AGENTS = [
  ['8821 agent', 'Authorization', 'Prepares the Form 8821 and audits it before it goes out: the right designee, signer, title, tax years and forms. Once signed, it submits the authorization to the IRS so it can be recorded on the CAF (Centralized Authorization File, the IRS record of who a taxpayer has authorized).'],
  ['Transcript retrieval agent', 'TDS', 'Once the authorization is on file, requests the transcripts through TDS (the IRS Transcript Delivery System that tax professionals use) and attaches them to the order.'],
  ['Mailbox agent', 'SOR', 'Picks up transcripts the IRS delivers to the practitioner&rsquo;s SOR (Secure Object Repository, the IRS secure mailbox for tax professionals) and matches each one to the right order and taxpayer.'],
  ['IRS call agent and call assistant', 'PPS', 'Places and holds Practitioner Priority Service (PPS) calls, the IRS phone line for tax professionals, then guides the credentialed practitioner who handles the live call.'],
  ['Monitoring and follow-up agents', 'Follow-up', 'Re-check years that came back unfiled and chase missing years, on the terms set in your quote, so an open item does not sit unnoticed.'],
  ['QoE agent', 'Quality of Earnings', 'Prepares an AI-assisted Quality of Earnings analysis from IRS-of-record data and borrower financials. A person reviews it before it reaches you.'],
];
const GLOSSARY = [
  ['CAF', 'Centralized Authorization File: the IRS record of the authorizations a taxpayer has given, and of the registered practitioners who hold them.'],
  ['TDS', 'Transcript Delivery System: the IRS service tax professionals use to request transcripts.'],
  ['SOR', 'Secure Object Repository: the IRS secure mailbox where some transcripts are delivered to a practitioner.'],
  ['PPS', 'Practitioner Priority Service: the IRS phone line for tax professionals.'],
];

// ───────────────────────── CHROME ─────────────────────────
function nav() {
  const prodLinks = P.map((p) => `<a href="/products/${p.slug}"><span class="t">${p.name}</span><span class="d">${p.short}</span></a>`).join('\n          ');
  const mobProd = P.map((p) => `<a href="/products/${p.slug}">${p.name}</a>`).join('\n      ');
  return `<!-- GNAV:START (generated — shared global nav) -->
<a class="gskip" href="#main">Skip to content</a>
<header class="gnav">
  <div class="gnav-wrap">
    <div class="gnav-inner">
      <a href="/" class="gnav-brand" aria-label="${BRAND} home">${MARK}ModernTax<span class="gtag">Compliance Platform</span></a>
      <nav class="gnav-links" aria-label="Primary">
        <a href="/#platform">Platform</a>
        <a href="/how-it-works">How it works</a>
        <div class="gnav-dd">
          <button type="button" aria-haspopup="true" aria-expanded="false">Products ${CHEV}</button>
          <div class="gnav-menu wide">
          ${prodLinks}
          <a class="all" href="/products/"><span class="t">All products &rarr;</span></a>
          </div>
        </div>
        <div class="gnav-dd">
          <button type="button" aria-haspopup="true" aria-expanded="false">Developers ${CHEV}</button>
          <div class="gnav-menu">
            <a href="/developers"><span class="t">API</span><span class="d">REST intake, webhooks, structured JSON</span></a>
            <a href="/docs/"><span class="t">Docs</span><span class="d">The Partner API reference</span></a>
            <a href="/docs/#mcp"><span class="t">MCP</span><span class="d">Model Context Protocol server for AI agents</span></a>
            <a href="${SANDBOX}"><span class="t">Sandbox</span><span class="d">An API key against synthetic data</span></a>
          </div>
        </div>
        <a href="/plans">Plans</a>
      </nav>
      <div class="gnav-cta">
        <a href="https://portal.moderntax.io/login" class="gsignin">Sign in</a>
        <a href="https://portal.moderntax.io/signup" class="gbtn">Get started</a>
      </div>
      <button type="button" class="gnav-menu-btn" id="gnav-menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="gnav-mobile">
        <svg width="17" height="17" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>
    <nav class="gnav-mobile" id="gnav-mobile" aria-label="Mobile">
      <a href="/#platform">Platform</a>
      <a href="/how-it-works">How it works</a>
      <div class="mh">Products</div>
      ${mobProd}
      <a href="/products/">All products</a>
      <div class="mh">Developers</div>
      <a href="/developers">API</a>
      <a href="/docs/">Docs</a>
      <a href="/docs/#mcp">MCP</a>
      <a href="${SANDBOX}">Sandbox</a>
      <div class="mh">More</div>
      <a href="/plans">Plans</a>
      <div class="mcta">
        <a href="https://portal.moderntax.io/login" class="gbtn ghost">Sign in</a>
        <a href="https://portal.moderntax.io/signup" class="gbtn">Get started</a>
      </div>
    </nav>
  </div>
</header>
<!-- GNAV:END -->`;
}

function footer() {
  const prod = P.map((p) => `<li><a href="/products/${p.slug}">${p.name}</a></li>`).join('\n          ');
  return `<!-- GFOOT:START (generated — shared global footer) -->
<footer class="gfoot">
  <div class="gnav-wrap">
    <div class="gfoot-grid">
      <div class="gfoot-about">
        <a href="/" class="gnav-brand">${MARK}ModernTax</a>
        <p>The ${BRAND}. ${TAGLINE}</p>
      </div>
      <div>
        <h2>Products</h2>
        <ul>
          ${prod}
        </ul>
      </div>
      <div>
        <h2>Developers</h2>
        <ul>
          <li><a href="/developers">API</a></li>
          <li><a href="/docs/">Docs</a></li>
          <li><a href="/docs/#mcp">MCP</a></li>
          <li><a href="${SANDBOX}">Sandbox</a></li>
          <li><a href="https://portal.moderntax.io/status">IRS pull status</a></li>
        </ul>
      </div>
      <div>
        <h2>Use cases</h2>
        <ul>
          <li><a href="/use-cases/sba-504">SBA 504</a></li>
          <li><a href="/use-cases/sba-7a">SBA 7(a)</a></li>
          <li><a href="/use-cases/commercial-lending">Commercial lending</a></li>
          <li><a href="/use-cases/employment-hr">Employment &amp; HR</a></li>
          <li><a href="/use-cases/tax-payment-verification">Tax payment verification</a></li>
          <li><a href="/use-cases/tax-resolution">Tax resolution firms</a></li>
        </ul>
      </div>
      <div>
        <h2>Company</h2>
        <ul>
          <li><a href="/how-it-works">How it works</a></li>
          <li><a href="/plans">Plans</a></li>
          <li><a href="${TALK}">Talk to us</a></li>
          <li><a href="https://portal.moderntax.io/login">Sign in</a></li>
          <li><a href="https://portal.moderntax.io/security">Security</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Text message terms</a></li>
        </ul>
      </div>
    </div>
    <div class="gfoot-bottom">
      <!-- TODO(LEGAL-01): contracting/legal entity (ModernTax Inc. vs Rapidly Financial Inc.), privacy controller identity and service terms are
           unverified. Do not replace this line with another legal name until LEGAL-01 is decided. Security badges stay off the site until then. -->
      <p>&copy; 2026 ModernTax, Inc. All rights reserved.</p>
      <p>${BRAND}</p>
    </div>
  </div>
</footer>
<!-- GFOOT:END -->`;
}

const HEAD_ASSETS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/use-cases/brand.css">
<link rel="stylesheet" href="/products/products.css">
<link rel="stylesheet" href="/assets/site-chrome.css">`;

function head({ title, desc, url }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${BRAND}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
${HEAD_ASSETS}
</head>
<body>
`;
}

const LENDER_CTA = { primary: ['Start a verification', ORDER], secondary: ['Talk to us', TALK] };
const ctas = (c = LENDER_CTA, cls = 'btn-lg') => `<a href="${c.primary[1]}" class="btn ${cls} btn-accent">${c.primary[0]} <span class="arrow">&rarr;</span></a>
        <a href="${c.secondary[1]}" class="btn ${cls} btn-ghost">${c.secondary[0]}</a>`;
// Developer entry kept separate from the lender path, and never a promise that every product works there.
const devLink = `<p class="sub-ctas dev-link">Building on the API? <a href="${SANDBOX}">Explore the sandbox</a> &middot; synthetic data; the <a href="/docs/">API docs</a> list what it supports.</p>`;

const esc = (s) => s.replace(/&(?!(?:[a-z]+|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');

function sectionHead(num, eyebrow, h2, lede = '') {
  return `<div class="section-head">
      <div>
        <div class="section-num">${num}</div>
        <span class="eyebrow">${eyebrow}</span>
      </div>
      <div>
        <h2 class="display-3">${h2}</h2>${lede ? `\n        <p class="lede">${lede}</p>` : ''}
      </div>
    </div>`;
}

function card(p) {
  return `<a class="pitem" href="/products/${p.slug}">
        <span class="k"><span class="dotsq"></span>Product</span>
        <h3>${p.name}</h3>
        <p>${p.short}</p>
        <span class="foot"><span class="go">Learn more <span class="arrow">&rarr;</span></span></span>
      </a>`;
}

function productPage(p) {
  const url = `${SITE}/products/${p.slug}`;
  const title = `${plain(p)} — ${BRAND}`;
  let n = 0;
  const num = () => String(++n).padStart(2, '0');
  const what = p.what.map(([h, t], i) => `<article class="gcell">
        <div class="idx"><span class="dotsq"></span>${String(i + 1).padStart(2, '0')}</div>
        <h3>${h}</h3>
        <p>${t}</p>
      </article>`).join('\n      ');
  const forms = p.forms ? `
    <h3 class="eyebrow" style="margin:40px 0 14px;">IRS forms covered</h3>
    <div class="forms">
      ${p.forms.map((f) => `<span class="fpill">${f}</span>`).join('\n      ')}
    </div>` : '';
  const code = () => p.code ? `
<section class="section">
  <div class="wrap">
    ${sectionHead(num(), 'In code', 'One call to order. <span class="italic-em">One URL for agents.</span>', 'The full reference — authentication, ordering, polling, webhooks, errors and the MCP tool list — lives in the <a href="/docs/" style="color:var(--accent-ink);text-decoration:underline;text-underline-offset:3px;">API docs</a>.')}
    <pre class="pcode" tabindex="0" aria-label="Example API request">${p.code}</pre>
  </div>
</section>
` : '';
  const steps = p.steps.map(([h, t]) => `<li><h3>${h}</h3><p>${t}</p></li>`).join('\n      ');
  const rel = p.related.map((s) => card(bySlug[s])).join('\n      ');

  return `${head({ title, desc: esc(p.desc), url })}${nav()}

<main id="main">

<section class="hero">
  <div class="wrap hero-in wide">
    <span class="pill"><span class="dot"></span>${p.name}</span>
    <h1 class="display-2">${p.h1}</h1>
    <p class="lede">${p.lede}</p>
    <div class="hero-ctas">
        ${ctas(p.cta)}
    </div>
    <p class="sub-ctas">Part of the ${BRAND} &middot; <a href="/products/">See all products</a></p>${p.developer ? '' : '\n    ' + devLink}
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${sectionHead(num(), 'What you get', p.whatHead)}
    <div class="grid-flush three">
      ${what}
    </div>${forms}
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    ${sectionHead(num(), 'How it works', 'From order <span class="italic-em">to answer.</span>')}
    <ol class="psteps${p.steps.length === 4 ? ' four' : ''}">
      ${steps}
    </ol>
  </div>
</section>
${code()}
<section class="section">
  <div class="wrap">
    ${sectionHead(num(), 'Engagement', 'Scoped to your <span class="italic-em">program.</span>', `${MSA_NOTE} <a href="${TALK}" style="color:var(--accent-ink);text-decoration:underline;text-underline-offset:3px;">Book a demo</a>.`)}
  </div>
</section>

<section class="section alt">
  <div class="wrap">
    ${sectionHead(num(), 'Related', 'Pairs well <span class="italic-em">with.</span>')}
    <div class="plist three">
      ${rel}
    </div>
  </div>
</section>

<section class="section cta-sec" style="padding-top:clamp(56px,8vw,120px)">
  <div class="wrap">
    <div class="cta-band">
      <div class="cta-in">
        <h2>${p.developer ? 'Explore the API <span class="italic-em">in the sandbox.</span>' : `Talk to us about <span class="italic-em">${p.name}.</span>`}</h2>
        <p>${p.developer ? 'A work email gets you an API key and synthetic taxpayers to test against. Not every product is available in the sandbox.' : 'We confirm scope and authorization requirements in a demo; pricing is set in your MSA.'}</p>
        <div class="cta-btns">
          ${ctas(p.cta)}
        </div>
      </div>
    </div>
  </div>
</section>

</main>

${footer()}
<script src="/assets/site-chrome.js"></script>
</body>
</html>
`;
}

function overviewPage() {
  const url = `${SITE}/products/`;
  const title = `Products — ${BRAND}`;
  const desc = `Compliance services across the commercial lending deal: QoE screening, IRS compliance verification, employment and income, payroll liability (941), the QoE Agent and QoE full-service, post-close monitoring, check reissue review and a Partner API with an MCP server.`;
  const cards = STAGES.map(([k, label, blurb], i) => {
    const items = P.filter((p) => p.stage === k);
    const body = items.length
      ? `<div class="plist three">\n      ${items.map(card).join('\n      ')}\n    </div>`
      : `<p class="stage-note">Unfiled years are flagged at verification, so a missing return is a closing condition rather than a surprise. Transcripts, results and the signed 8821 stay on the order for the loan file. Back-year filing is scoped in your MSA.</p>`;
    return `<div class="stage">\n    <h3 class="stage-h"><span class="stage-n">${String(i + 1).padStart(2, '0')}</span>${label}<span class="stage-b">${blurb}</span></h3>\n    ${body}\n    </div>`;
  }).join('\n    ');
  return `${head({ title, desc: esc(desc), url })}${nav()}

<main id="main">

<section class="hero">
  <div class="wrap hero-in wide">
    <span class="pill"><span class="dot"></span>${BRAND}</span>
    <h1 class="display-2">Compliance across the <span class="italic-em">commercial lending deal.</span></h1>
    <p class="lede">From screening and verification to Quality of Earnings, closing, post-close monitoring and recovery. IRS-of-record data is one input; borrower financials and human review are others. Work in the portal or through the API.</p>
    <div class="hero-ctas">
        ${ctas()}
    </div>
    ${devLink}
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${sectionHead('01', 'By deal stage', 'Screen, verify, <span class="italic-em">close and follow through.</span>', 'Each stage below lists the products that serve it. Scope, authorization and pricing for each are confirmed before you order. <a href="/how-it-works">How it works: our agents and practitioners</a>.')}
    ${cards}
    <p class="fine">${MSA_NOTE} ${PLAN_NOTE}</p>
  </div>
</section>

<section class="section cta-sec" style="padding-top:0">
  <div class="wrap">
    <div class="cta-band">
      <div class="cta-in">
        <h2>Start with <span class="italic-em">a verification.</span></h2>
        <p>Submit a business or individual through the portal, or talk with us about an API workflow.</p>
        <div class="cta-btns">
          ${ctas()}
        </div>
      </div>
    </div>
  </div>
</section>

</main>

${footer()}
<script src="/assets/site-chrome.js"></script>
</body>
</html>
`;
}


// How It Works page. Copy: Matt Parker, 2026-11-18 (replaces the generated
// agent cards, practitioner panel and glossary).
const HOW_IT_WORKS = [
  ['Where we start', 'Lenders typically collect eleven or more packets of documents and information from borrowers. ModernTax exists to solve as much of this as we can, and we have started with tax returns, as they often serve as the largest file and most critical data point for government-guaranteed lenders.'],
  ['The order', 'Our customers get one document signed, the authorization the IRS requires before it releases information, and pass it to us. That is our core requirement. From there, we handle the end-to-end process of getting the documents from the IRS on the business and all entities owned by the principal owners. Our job does not stop there, as many businesses have missing documents that are required. We build tools to continually track down the records and monitor the accounts all the way through completion. We take away all the complexity of IVR systems, SOR dashboards, credentialing, and up to sixty-minute call waits to get this information in hours for our customers.'],
  ['Software and people', 'We&rsquo;ve built the first software stack for tax for commercial lenders. This includes compliance requirements for all records we store, how we communicate on behalf of our clients, and the system that interfaces with IRS sites and tools. In addition to the technology, the human component is critical; we leverage human experts and intelligence to deal with the real-time issues we face in dealing with federally regulated agencies, banks, and non-profits. There are boundaries around session time-outs, credentialing, and wait times that we manage. Our infrastructure is built to handle thousands of daily transactions. Lastly, we are excited to leverage agents that specialize in six areas of business, and these agents handle workflows across customer support, accessing transcripts, managing and handling IVRs, and routing things across fax, voice, and more.'],
  ['When records are missing', 'The automation around our solution is always critical; the difference between a business owner being compliant and not compliant can be a gray area. Every business is different; every accountant or CPA files taxes (the hope is that they do) with varying degrees of style, and the tax code changes all the time. The other complexity we help solve is that businesses move, change addresses, and change names all the time. Small businesses span a wide variety of industries, including franchises, services, law, food and beverage, and beyond. One of the core problems we solve is when the IRS has no record of a business entity. We manage this end-to-end for the lender and work with them as long as needed. We even go a step further and work with CPAs and business owners on resolving issues to make sure they are compliant.'],
];

function agentsPage() {
  const url = `${SITE}/how-it-works`;
  const title = `How It Works | ModernTax`;
  const desc = 'How a ModernTax order works: one signed IRS authorization, then we get the records from the IRS on the business and its owners, track down what is missing and monitor through completion.';
  const sections = HOW_IT_WORKS.map(([h, t], i) => `<section class="section hiw${i % 2 ? ' alt' : ''}">
  <div class="wrap">
    ${sectionHead(String(i + 1).padStart(2, '0'), 'How it works', h, t)}
  </div>
</section>`).join('\n\n');
  return `${head({ title, desc: esc(desc), url })}${nav()}

<main id="main">
<style>.hiw .section-head { align-items: start; }</style>

<section class="hero">
  <div class="wrap hero-in wide">
    <span class="pill"><span class="dot"></span>How it works</span>
    <h1 class="display-2">How it works</h1>
    <div class="hero-ctas">
        <a href="${TALK}" class="btn btn-lg btn-accent">Book a demo <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</section>

${sections}

</main>

${footer()}
<script src="/assets/site-chrome.js"></script>
</body>
</html>
`;
}

// Homepage "Our agents" block, injected between AGENTS markers in index.html.
function homeAgents() {
  return `<!-- AGENTS:START (generated — see .github/tools/product-pages-build.mjs) -->
<!-- AGENTS:END -->`;
}

// ───────────────────────── WRITE PRODUCTS ─────────────────────────
fs.mkdirSync(path.join(ROOT, 'products'), { recursive: true });
for (const p of P) fs.writeFileSync(path.join(ROOT, 'products', `${p.slug}.html`), productPage(p));
fs.writeFileSync(path.join(ROOT, 'products', 'index.html'), overviewPage());
fs.writeFileSync(path.join(ROOT, 'how-it-works.html'), agentsPage());
{
  const f = path.join(ROOT, 'index.html');
  const h = fs.readFileSync(f, 'utf8');
  if (!h.includes('<!-- AGENTS:START')) throw new Error('index.html: AGENTS markers missing');
  fs.writeFileSync(f, h.replace(/<!-- AGENTS:START[\s\S]*?<!-- AGENTS:END -->/, homeAgents()));
}

// ───────────────────────── INJECT CHROME INTO EXISTING PAGES ─────────────────────────
// First run replaces the page's own <header>…</header> / <footer>…</footer>;
// later runs replace between the GNAV/GFOOT markers, so this is idempotent.
function inject(rel, { headerRe, footerRe, addSkip = false, mainId = true }) {
  const file = path.join(ROOT, rel);
  let html = fs.readFileSync(file, 'utf8');
  const n = nav();
  if (html.includes('<!-- GNAV:START')) html = html.replace(/<!-- GNAV:START[\s\S]*?<!-- GNAV:END -->/, n);
  else {
    if (!headerRe.test(html)) throw new Error(`${rel}: header not found`);
    // drop an existing skip link right before the header (the nav brings its own)
    html = html.replace(/<a class="skip" href="#main">Skip to content<\/a>\s*/, '');
    html = html.replace(headerRe, n);
  }
  if (footerRe) {
    const f = footer();
    if (html.includes('<!-- GFOOT:START')) html = html.replace(/<!-- GFOOT:START[\s\S]*?<!-- GFOOT:END -->/, f);
    else {
      if (!footerRe.test(html)) throw new Error(`${rel}: footer not found`);
      html = html.replace(footerRe, f);
    }
  }
  if (!html.includes('/assets/site-chrome.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/assets/site-chrome.css">\n</head>');
  if (!html.includes('/assets/site-chrome.js')) html = html.replace(/<\/body>/, '<script src="/assets/site-chrome.js"></script>\n</body>');
  if (!/id="main"/.test(html)) console.warn(`${rel}: no #main target for skip link`);
  fs.writeFileSync(file, html);
}

const ucHeader = /<header class="nav">[\s\S]*?<\/header>/;
const ucFooter = /<footer>[\s\S]*?<\/footer>/;
for (const f of fs.readdirSync(path.join(ROOT, 'use-cases')).filter((x) => x.endsWith('.html'))) {
  inject(`use-cases/${f}`, { headerRe: ucHeader, footerRe: ucFooter });
}
const headHeader = /<header class="head">[\s\S]*?<\/header>/;
inject('plans.html', { headerRe: headHeader, footerRe: /<footer>[\s\S]*?<\/footer>/ });
inject('walkthrough.html', { headerRe: headHeader, footerRe: /<footer>[\s\S]*?<\/footer>/ });
inject('walkthrough-thanks.html', { headerRe: headHeader, footerRe: /<footer>[\s\S]*?<\/footer>/ });
inject('developers.html', { headerRe: headHeader, footerRe: /<footer>[\s\S]*?<\/footer>/ });
inject('index.html', { headerRe: /<header class="nav">[\s\S]*?<\/header>/, footerRe: /<footer style="margin-top: clamp\(64px,8vw,120px\);">[\s\S]*?<\/footer>/ });

console.log('done', P.length, 'products');
