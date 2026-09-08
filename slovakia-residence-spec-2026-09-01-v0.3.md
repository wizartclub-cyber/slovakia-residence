# Slovakia Residence Guide — PRD and legal baseline

Version: 0.3.0 · First legal edition: 2026-09-01 (baseline is moving, see decisions below) · Languages: uk, sk (en deferred)

## Release-1 decisions — 2026-09-07 (supersede conflicting text below)

1. Release gate changed: Release 1 ships with a subset of fully reviewed routes; every other route is listed with explicit `incomplete` status and links to the competent authority (per §7). First routes: temporary protection → temporary residence transition (§131o + ÚHCP guidance), employment §23, business §22, family reunification §27, national visa (120-day) for filing in Slovakia, permanent residence §46/§52. 100% inventory remains the long-term target, not the R1 gate.
2. Legal reviewer works in uk + sk. Editorial workflow must not require reading YAML.
3. Legal baseline is moving: the displayed baseline = date of the last completed legal review. 2026-09-01 is the first edition; each reviewed edition and its source snapshots are preserved (§5B). Rule tests must cover the 2026-10-01 boundary (Act 128/2026 čl. I bod 62) and the ETIAS-dependent provision.
4. Purpose: charitable public service and a lead magnet. Privacy constraints of §1 stay; any contact/link to the owner's services is a static outbound link, no tracking.
5. Publisher: a charitable organisation (to be named). About/privacy page and disclaimer are written for that entity.
6. Hosting: GitHub Pages from the start; `<meta>` CSP as defense-in-depth; Cloudflare Pages migration only if response headers become a release requirement.
7. Release 1 has no PDF generator. Document preparation = printable checklist + link to the authority's original file + per-field hints "what to write" (in Slovak where the form requires Slovak completion — confirmed for T MV SR 11-057 and 11-056). §6 overlay/AcroForm work is deferred to a later release; keep the mapping data model.
8. UI languages for Release 1: uk + sk. en is deferred; build still fails on missing keys for the active locale set.
9. Built by the owner with Claude Code; start from content schemas + rule engine, UI after.
10. Source snapshots: `scripts/download_and_hash.py` must run on the owner's machine (sandbox has no egress to official domains). Registry v0.4 and SOURCE_AUDIT_v0.4.md record the 2026-09-07 URL checks.

## Confirmed decisions and document-registry handoff — 2026-09-07

The owner confirmed full coverage of all routes, availability of a legal reviewer, future legal-baseline editions, mandatory local state export/import, and GitHub hosting. Navigation between workflow steps must preserve in-memory input. This clarifies the navigation-reset wording below: reset, page closure and reload clear input; internal workflow navigation does not. Export/import is mandatory, superseding references to it as optional below. Encryption remains a proposed implementation choice pending confirmation. Machine translation may be used as a draft subject to editorial review; named language reviewers remain to be assigned.

Future editions must preserve reviewed historical source versions and explicitly identify the legal baseline presented to the visitor. The full route inventory remains the release scope. The previously discussed 4–6 month schedule is a preliminary planning estimate, not an agreed deadline or budget.

The owner supplied the following research handoff. These findings have not yet been independently verified in this repository; do not assign source_verified or legally_reviewed status from this summary alone. The initial document-registry.yaml, DOCUMENT_REGISTRY.md and download_and_hash.py were not present at handoff. Subsequently, document-registry-v0.3.yaml and SOURCE_AUDIT_v0.3.md were received and read from the workspace. The download script and local source binaries remain outstanding.

Registry v0.3 intake review (structural only; external sources not yet verified):
- The registry contains 20 resources, including employment templates in DOC/DOCX and a statutory annex. Preserve the original authority-issued format; any converted convenience PDF must be labelled generated_copy.
- The 404/2011 entry uses a floating URL despite temporal metadata. Pin the reviewed temporal URL before source verification.
- Guidance dated 2026-09-03 postdates the 2026-09-01 baseline. It may support that baseline only after checking the underlying provision and temporal applicability; the later page date alone does not establish applicability.
- Resource-level reviewStatus, checkedAt, locale, procedureIds, snapshots and hashes are missing. A registry-wide checkedAt is not sufficient evidence of review for each resource. Add these fields as evidence becomes available, without inventing values.
- The v0.3 Slovak national-visa entry does not establish availability of the Ukrainian/Slovak form mentioned in the earlier handoff. Preserve that distinction until the actual files are inspected.
- Do not interpret v0.3 as exhaustive: the previously mentioned MINV guides, PES electronic procedures and Hlásenie pobytu still need reconciliation with this registry.
- Source priority must account for legal authority, competent body, procedure and temporal applicability. A newer guidance page does not automatically override an older source.

- Candidate shared official forms: T MV SR 11-057 (initial temporary, initial permanent and tolerated residence), T MV SR 11-056 III/2019 (renewal and several subsequent residence/document procedures), and national-visa forms in Ukrainian/Slovak and English. Confirm exact procedure applicability, versions and URLs before integration. Default to overlay-first and inspect actual PDF fields before selecting a fill mode. The reported Slovak completion requirement of 11-057 must be reflected in its mapping after verification.
- Model procedure-to-form relationships as many-to-many. Do not create a separate government form for every residence ground; conditional attachments and legal rules distinguish the packages.
- Separate resourceType from Source.sourceType: official_form, official_guide, electronic_form, and optionally community_example. Instructions are official_guide resources linked to legal rules, never fillable templates. Source classification continues to describe authority and evidentiary role.
- Official electronic procedures should link to the verified government service. Do not create a substitute PDF for the reported temporary-protection electronic declaration. Verify authentication, eligibility, personal attendance and biometrics separately for each procedure; existence of an electronic service does not establish universal availability or exclusivity.
- Retrieve and verify the actual Hlásenie pobytu PDF behind the reported ?hlasenie-pobytu-1 page before registering a downloadable asset.
- No official completed example for 11-057 or 11-056 was supplied. Any community example must have official: false, attribution and manual reviewer metadata, and must not be presented as an official sample.
- For every acquired PDF, record the exact official URL, retrieval time, MIME/signature validation, SHA-256, page dimensions, language, form identifier and review status. PDF copies were not supplied with the handoff. Review the supplied download script before execution when it becomes available.


## 1. Purpose and boundaries
A public, free-to-access informational reference service explaining all lawful routes of entry, stay and residence in Slovakia. Users select their situation, receive a legally sourced step-by-step route, prepare permitted documents locally, download and print them, and submit them themselves to the competent authority. The service is not a legal representative, filing intermediary, case-management system or government portal.

No accounts, server database of users, personal-data collection, document uploads, cloud storage, draft persistence, reminders, notifications, CRM, tracking analytics, advertising pixels or AI processing of personal data. No automatic submission or simulated government identity/signature. Input exists only in the current browser memory and is cleared on reset, page closure or navigation. The only optional persistence-like capability is an explicit user-initiated export/import of local state as a file stored by the user; the application itself does not retain the data between sessions. Downloaded files are controlled by the user. Avoid claiming that a download itself proves deletion of operating-system/browser caches.

## 2. Legal baseline and temporal scope
The controlling date is 1 September 2026, not the date on which a visitor opens the site. The public interface must prominently display this date and warn that subsequent law may differ. Every rule has validFrom/validTo and a source. Publication date, effective date and transitional applicability are distinct fields.

Primary legislation:
- Act 404/2011 Coll. on Residence of Foreigners, consolidated version effective 15 July–30 September 2026: https://static.slov-lex.sk/static/SK/ZZ/2011/404/20260715.print.html
- Act 128/2026 Coll., amendment effective 15 July 2026, with a provision effective 1 October 2026 and an ETIAS-dependent provision: https://static.slov-lex.sk/static/SK/ZZ/2026/128/20260715.print.html
- Act 69/2026 Coll. on International Protection, effective 12 June 2026: https://static.slov-lex.sk/static/SK/ZZ/2026/69/20260612.print.html
- Act 145/1995 Coll. on Administrative Fees, version effective 1 September 2026: https://static.slov-lex.sk/static/SK/ZZ/1995/145/20260901.print.html
- Act 5/2004 Coll. on Employment Services, version applicable from 15 July 2026, as amended by Act 128/2026; pin the exact Slov-Lex temporal version in the source registry rather than a floating consolidated URL.
- Schengen Borders Code, Regulation (EU) 2016/399; Visa Code, Regulation (EC) 810/2009; Directive 2004/38/EC; Directive 2003/109/EC; Directive (EU) 2021/1883; Directive (EU) 2024/1233; relevant temporary-protection Council implementing decisions. Verify each applicable version and Slovak implementing provisions.

Official operational sources:
- https://www.mzv.sk/en/web/en/visa-and-services/residence-of-foreign-nationals-in-slovakia
- https://www.minv.sk/
- https://www.slovensko.sk/
- https://www.upsvr.gov.sk/
- https://www.mic.iom.sk/ (secondary explanatory source; snapshot each language-specific URL separately)
- IOM fee comparison: Slovak page reports “Posledná aktualizácia: 14. júl 2026”; English fee page reports “Last Updated: 16 July 2026”. Store the date shown by each exact URL/locale; primary statutory tariff controls in case of inconsistency.

The former Act 480/2002 on Asylum must not be treated as the current primary act after the new international-protection legislation entered into force. Preserve it only for explicitly applicable historic/transitional cases. Proceedings initiated before 15 July 2026 require assessment under §131n of Act 404/2011. The Ukraine-related transition in §131o concerns termination of temporary protection and is not evidence that protection has already ended. The Ministry of Interior announced extension to 4 March 2027 on 18 February 2026.

## 3. Complete route taxonomy
The inventory below is the mandatory coverage map, not a claim that every subprocedure has already undergone a complete legal audit. Each statutory paragraph and exception must be expanded before publication as a complete guide.

### A. Entry and short stay
A1 Schengen visa and exemptions; A2 visa-free short stay and 90/180 calculation; A3 national visa with all statutory purposes and special programmes, including the §15(3)(a) validity of up to 120 days for the relevant §15(1)(a)/(b) cases from 15 July 2026; A4 entry on residence rights issued by another Schengen state where applicable; A5 border conditions, invitation, extension and exceptional circumstances; A6 lawful stay pending a decision where expressly provided. Distinguish a visa from residence authorization and from a right to work.

### B. Temporary residence of third-country nationals
B1 Business (§22): sole trader, company-related business and statutory subcases.
B2 Employment (§23): single-permit routes, work-permit routes, exemptions and seasonal employment, with separate labour-market prerequisites. For the post-national-visa route, model the Act 5/2004 §21b(4)(f) condition explicitly: the Labour Office confirmation for temporary residence for employment is available in this branch only where the third-country national will be employed at the same job position as under the national visa.
B3 Study (§24): all eligible educational purposes and statutory subcases.
B4 Special activity (§25): expand every letter and eligible activity separately, including applicable volunteering, training, internships and other categories.
B5 Research and development (§26).
B6 Family reunification (§27): spouse, children, dependent relatives and every other eligible category; special sponsor categories and restrictions.
B7 Civilian components of armed forces (§28).
B8 Slovak living abroad (§29).
B9 Long-term resident of another EU member state (§30): each purpose and family subcase.
B10 EU Blue Card (§§37–41): first issue, renewal, mobility and relevant family routes.
B11 Every special statutory temporary-residence route or exception outside the ordinary purpose list, including applicable intra-corporate transfer, mobility, seasonal, research and study rules. Do not invent a new residence category merely because it has a separate administrative workflow.

### C. Permanent residence of third-country nationals
C1 Five-year permanent residence (§43): each eligible family category and other statutory grounds.
C2 Special five-year residence (§45a): stateless persons, special-consideration grounds and other statutory cases.
C3 Unlimited permanent residence (§46): all statutory grounds and exceptions.
C4 EU long-term residence (§52): standard qualifying residence, Blue Card mobility, international-protection counting rules, exclusions and exceptions. Include the 8 April 2026 ÚHCP P PZ administrative guidance concerning counting periods of temporary protection (dočasné útočisko) toward the five-year period, with the guidance stored as an administrative-guidance source rather than treated as legislation.
C5 Renewal/replacement of residence cards and changes to residence where applicable.

### D. Tolerated stay
D1 All grounds under §58 and other relevant statutory provisions, including special circumstances and vulnerable persons where applicable. D2 Applications, extension, termination and rights/limitations. D3 Special routes for persons without nationality and relevant protection-related situations. Every ground must be checked independently; tolerated stay is not a general fallback for an unsuccessful residence application.

### E. International and temporary protection
E1 International-protection application under Act 69/2026; E2 asylum, statutory grounds and family-related routes; E3 subsidiary protection and related family routes; E4 border procedures and responsibility/Dublin-related procedures; E5 unaccompanied minors and vulnerable applicants; E6 review and appeal, legal assistance, status documents and cessation/revocation; E7 temporary protection (dočasné útočisko), eligibility and exclusions, registration, proof of status, family situations, transfers between states, termination and transitions; E8 transitional cases from Act 480/2002 and the Ukraine-related provisions of Acts 69/2026 and 128/2026. Protection eligibility cannot be inferred from Ukrainian citizenship alone.

### F. EU/EEA/Swiss free movement
F1 Short stay; F2 residence registration; F3 employment/self-employment; F4 studies; F5 sufficient resources and health insurance; F6 family-related rights; F7 permanent residence; F8 retention of rights and exceptional grounds; F9 non-EU family members, residence cards, retained rights and permanent residence. Separate the EU-law route from family reunification under §27 for third-country sponsors.

### G. Cross-cutting administrative actions
First application; renewal; change of purpose; change of residence type; change of employer where relevant; change of address or civil status; lost/damaged card; issuance of new card; travel document; certified residence confirmation; additional evidence; refusal and appeal; termination/cancellation; departure obligations; birth of a child; family changes; applicable post-grant obligations. Include citizenship only as a clearly marked adjacent topic, not as a residence type.

## 4. Standard route workflow
Every route must contain: eligibility and exclusion checks; correct competent authority and lawful place of filing; prerequisites and ordered dependencies; required and conditional documents; source and legal basis for every document; document age, originals/copies, translation, legalization/apostille and signature certification; official form; fees and exemptions; booking and permitted filing channel; processing time and legal effect of filing; biometrics and residence-card issue; decision and review; post-grant statutory duties. Never substitute a general rule for a route-specific exception.

Document status types: prepare_locally, obtain_from_authority, obtain_from_third_party, translate_officially, legalize, certify_signature, present_original, submit. A generated document must never be described as an issued certificate, official translation, apostille or certified signature.

## 5. Fee baseline
The primary authority is tariff item 24 and other applicable items of Act 145/1995 in its 2026-09-01 version. The following amounts are reference entries confirmed against the statutory tariff and/or the IOM update of 16 July 2026. They are not a complete fee schedule and exemptions must be evaluated separately.

Initial temporary residence: business €330 at foreign police / €350 at diplomatic mission; employment €250; seasonal employment €50; specified special activities €140; family reunion €200; civilian armed-forces duties €100; Blue Card €250. Other purposes and exemptions require separate entries rather than an assumed zero fee.

Renewal reference amounts: business €200; employment €140; seasonal €25; specified special activities €50; family reunion €100; civilian armed-forces duties €50; Blue Card €140.

Permanent-residence application: reference €250. Tolerated stay: reference €140; extension €50. Residence card: ordinary issue €10 and expedited issue €39 under the reference tariff. National visa: distinguish the €15, €90 and €50 statutory-purpose cases. Schengen visa reference: €90 adult / €45 child aged 6–12. These are not universal totals.

Electronic-filing reductions must be conditional on legal availability and compliance with the prescribed electronic process, generally 50% capped at €50 where applicable. Do not apply the discount merely because a PDF was prepared online. Do not assume all applicants owe a fee: age, family relationship, residence purpose, protection status and statutory exemptions may change the amount. Separate application fees, card fees, visa fees, commercial-register/trade fees, translation and legalization costs. Do not invent payment IBANs, QR codes or bank instructions. Show only verified official payment methods.

## 5A. Financial thresholds and annually changing baselines
Do not hard-code financial-capacity amounts in route steps. Store the baseline and derived thresholds as first-class data. From 1 July 2026 the subsistence minimum (životné minimum) for one adult is €295.22/month under Measure 155/2026 Coll. Representative derived values include 12× = €3,542.64, 20× = €5,904.40 and 100× = €29,522.00. The legal meaning of each multiplier must be linked to the specific statutory route; a numerical threshold must never be shown merely because it can be calculated. Business-residence logic must distinguish financial security of stay from financial security of business activity and renewal/profit tests.

Recommended schema example: `Threshold { id, baselineId, multiplier, calculationPeriod, derivedAmount, currency, validFrom, validTo, sourceIds[], appliesWhen }`. Prefer calculating `derivedAmount` at build/runtime from the baseline to prevent arithmetic drift, while storing expected values in tests.

## 5B. Source snapshots and legal-drift detection
For each primary/official source used by a published rule, retain a lawful local snapshot or normalized extract where licensing/terms permit, plus SHA-256, checkedAt, locale and canonical URL. A scheduled GitHub Action (e.g. weekly) may fetch public source URLs, compare normalized hashes, and open an issue on change. A hash difference is only a review trigger, not an automatic legal update. Dynamic pages and Slov-Lex consolidations require normalization to avoid false positives. Preserve the source version actually reviewed for the 2026-09-01 baseline.

## 6. Local Document Workspace
No persistence. All form data stays in ephemeral browser state. Offline-capable processing after required static assets have been obtained; no network calls containing form content. Avoid service-worker caching of personal content. A third-party analytics SDK, remote PDF-rendering API or external AI service is prohibited. Third-party packages are bundled locally and subject to dependency review.

Treat coordinate overlay as the primary PDF strategy because many Ministry of Interior forms are flat PDFs; support AcroForm filling as an exception when the official file exposes usable form fields. Overlay mappings must implement text-fit logic: measure rendered width, reduce font size within approved min/max bounds, optionally wrap only in fields explicitly marked multiline, and fail visibly rather than clip or overflow. Do not rebuild a government form without legal/format approval. Maintain a versioned mapping per form with source URL, SHA-256, page dimensions, fields, coordinates, required data types, date format, permitted characters and test fixtures. Preserve diacritics through Unicode-capable fonts. Provide zoom, field explanations in the selected UI language, validation, PDF download, print and explicit clear-all. Optional editable state export must be a user-initiated local download only; no automatic drafts. Support export/import of a local state file (preferably encrypted with a user-supplied passphrase using Web Crypto API, with authenticated encryption such as AES-GCM). Do not store the passphrase or derived key. The file format must be versioned and schema-validated on import. Avoid promising that every official form is fillable: some require original issuance, certification, a government electronic service or handwritten completion.

Suggested implementation: TypeScript, React, Vite, i18next, pdf-lib + @pdf-lib/fontkit, with Noto Sans (OFL) embedded locally for Unicode/Slovak/Ukrainian diacritics where compatible with the official form. Exact library and font licensing must be validated against representative official PDFs. Use no remote fonts in the document-generation path. PDF output is not a qualified electronic signature.

## 7. Data model
Procedure: id, category, legalBasis[], validFrom, validTo, reviewStatus, reviewedAt, reviewer, sourceIds[], eligibilityRules[], steps[], documentIds[], feeRuleIds[], authorityIds[], transitionRules[], relatedProcedureIds[].
Step: id, order, localizedContentKey, prerequisites[], conditions[], actions[], sourceIds[].
Document: id, officialName, sourceUrl, formVersion, sourceHash, requiredWhen, preparationType, validityRule, translationRule, legalizationRule, certificationRule, formMappingId.
FeeRule: id, tariffItem, amount, currency, filingChannel, applicantConditions, exemptions[], reductionRule, validFrom, validTo, sourceIds[].
Source: id, authority, title, url, locale, lawNumber, provision, publicationDate, effectiveFrom, effectiveTo, checkedAt, sourceType, snapshotPath, sha256. sourceType enum must include at least legislation, implementing_regulation, eu_law, official_web_guidance, administrative_guidance, official_form, official_fee_schedule, secondary_explanatory_source.
Threshold: id, baseValue, unit, multiplier, formula, validFrom, validTo, sourceIds[], notes. Values derived from annually changing baselines (e.g. životné minimum) must reference the baseline source and never be hard-coded inside Step.
Authority: id, type, officialName, territorialCompetence, filingChannels[], bookingUrl, infoUrl, checkedAt, sourceIds[]. Authority type should cover at least OCP_PZ, DIPLOMATIC_MISSION, UPSVAR, MUNICIPALITY and other competent bodies required by specific routes.
Translation: locale, key, value, reviewStatus. Legal data are shared across locales. A missing translation does not silently create a different legal rule.

Review statuses: draft, source_verified, legally_reviewed, published, superseded, blocked. No publication of a complete route without legal review of all mandatory fields. An incomplete route can be listed with an explicit incomplete status and links to competent authorities, but must not generate a misleading definitive package or fee total.

## 8. UI/UX
Home: clear scope/date disclaimer, language selector, route finder and browse-all catalogue.
Finder: citizenship group, current legal status, location, intended purpose, family situation and other strictly necessary non-identifying answers. No names, passport numbers or exact addresses during route selection.
Results: possible routes, eligibility caveats, alternatives and comparison. Do not promise eligibility or rank routes as guaranteed outcomes.
Route page: progress through information steps without persisted progress; legal basis, document checklist, fee breakdown, authority and official links; printable checklist.
Document preparation: explanatory fields, local PDF preview/download/print/reset, source version and warnings.
Source library: legislation, forms, authorities, historical versions and last verification dates.
About/privacy: no public-body affiliation, no legal representation, no personal-data storage, clear explanation of browser memory and user-controlled downloads.
Accessibility: WCAG 2.2 AA target, keyboard navigation, screen-reader labels, adequate contrast and mobile-first layouts.

## 9. Repository and deployment
src/app, src/components, src/features/route-finder, src/features/document-workspace, src/lib/rules, src/lib/pdf, src/locales/{uk,sk,en}, content/procedures, content/documents, content/fees, content/thresholds, content/authorities, content/sources, public/forms, sources/snapshots, tests, scripts/validate-content, scripts/check-source-drift, docs/legal-review. Legal content should be YAML/JSON data validated at build time with Zod. Consider a Git-based editorial CMS (Decap CMS or TinaCMS) only if it preserves review gates and commits changes through Git; lawyers should not need to edit raw JSON directly.
GitHub Pages deploys a static production build via GitHub Actions. No backend, database, authentication, server functions or form-submission endpoint. Use lockfiles, dependency pinning, supply-chain checks and secret scanning. GitHub Pages cannot provide arbitrary origin-level security headers such as HSTS or a response-header CSP. If GitHub Pages remains the host, document this limitation and use a restrictive `<meta http-equiv="Content-Security-Policy">` as defense-in-depth where compatible. If response headers are a release requirement, prefer Cloudflare Pages (e.g. `_headers`) or another static host that supports them. No secrets or personal-data fixtures in the repository. Use synthetic test identities only.

## 10. Tests and acceptance
Unit tests: rules, dates, conditional document requirements, fees/exemptions, thresholds, multilingual consistency, PDF mappings and validation. Implement the rule engine as pure UI-independent functions (`evaluate(answers) -> routes[]`) and test it with Vitest table cases (`answers -> expected routes`).
Integration tests: route selection to checklist and PDF, no outbound personal-data requests, reset clears state, no storage API writes, all public links and source IDs resolve. For published content, build validation must fail when reviewer is missing, a FeeRule lacks sourceIds, an Authority lacks checkedAt/sourceIds, or validTo predates the legal baseline.
E2E: mobile/desktop, Ukrainian/Slovak/English, keyboard use, form preview and printed-page geometry. Use Playwright for PDF visual regression: generate representative filled PDFs, rasterize/render pages in CI, compare screenshots against approved baselines with controlled tolerances, and flag text displacement or overflow. Test offline behavior after initial load and verify that closing/reloading does not restore personal input. If a Service Worker is used, cache only allowlisted static paths such as `/assets/*` and `/forms/*.pdf`; never cache request bodies, POSTs, query-bearing personal-data URLs or generated documents. Playwright must assert that after form completion `localStorage`, `sessionStorage` and IndexedDB remain empty and that no network request contains a request body derived from personal form input.
Legal tests: every published route has a statutory basis, applicable date, complete conditional document logic, authority, filing channel, fee/exemption logic and legal reviewer. Test pre-15-July-2026 applications, the 1-October-2026 amendment boundary, the Ukraine temporary-protection transition, and the absolute 15-July-2027 sunset for the extraordinary Ukraine-conflict procedural/employment extensions introduced into §131k of Act 404/2011 and §72au of Act 5/2004.
Release gate: 100% of statutory route inventory accounted for; 100% of published routes legally reviewed; no invented fee/authority/filing method; no user-data persistence or transmission; three complete UI languages; every localizedContentKey must exist in uk/sk/en or the build fails; representative official PDF tests passed. Full legal coverage and legal review are independent of completion of the software MVP.

## 11. Delivery sequence
Phase 1: exhaustive statutory inventory and source registry as of 2026-09-01; map every paragraph, exception, transitional rule and applicable administrative action.
Phase 2: legal rule schemas, review workflow, shared content and translations.
Phase 3: static site, route finder, source library and complete guide template.
Phase 4: audited forms, local PDF mappings and printable checklists.
Phase 5: population and legal review of every route, tariff and official form; three-language editorial review.
Phase 6: automated tests, accessibility/security audit, GitHub Pages release and public legal-baseline notice.

## 12. Explicit unresolved work
This document is an implementation baseline, not a completed legal opinion or an assertion that all required administrative packages are already verified. Before public release, conduct a paragraph-by-paragraph audit of Acts 404/2011 and 69/2026, the full September tariff including exemptions and consular differences, all relevant implementing regulations and EU rules, official forms and their current versions, actual authority/appointment links and permissible filing methods. The full details of each special-activity, tolerated-stay, family, EU mobility and protection subroute must be populated from those sources. Do not substitute model-generated assumptions for the missing legal review.
