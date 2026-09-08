# External Sources Audit v0.4

Registry: document-registry-v0.4.yaml (20 resources)
Checked: 2026-09-07 (remote URL check from sandbox; HTML/text only, no binary download)
Baseline policy (decision 2026-09-07): moving — the legal baseline is the date of the last completed legal review; reviewed historical editions are preserved. The 2026-09-01 date is the first edition, not a fixed anchor.

## What was done
- Every URL in registry v0.3 was opened remotely and its content/date was recorded in `urlCheck` per resource.
- Binary download + SHA-256 could **not** be done from the sandbox (egress to mzv.sk, slov-lex.sk, upsvr.gov.sk, iom.sk is blocked). `scripts/download_and_hash.py` is ready to run on the owner's machine; see RUN_ME.md.
- No resource was promoted to `source_verified`. Statuses used: `url_verified` (15), `fetch_pending` (5, all ÚPSVaR — robots.txt timeouts from sandbox).

## Findings that change the spec or data model
1. **11-057 must be completed in Slovak** — confirmed on the form itself ("vyplnené písacím strojom alebo paličkovým písmom v slovenskom jazyku"). 11-056 carries the same requirement (note 2). Per-field hints in the uk UI must therefore show *what to write in Slovak*, not a translated value.
2. **National-visa forms**: the SK file is Slovak-only; the EN file is English with Slovak parentheticals. No Ukrainian/Slovak national-visa form was found. Drop the uk/sk form claim from the handoff until someone produces the file.
3. **Act 128/2026 effective-date structure confirmed**: 15.7.2026, except čl. I bod 62 → 1.10.2026 and čl. I bod 67 → ETIAS launch. Registry now records both boundaries; rule engine tests must cover 1.10.2026.
4. **404/2011 floating URL** replaced with pinned temporal URL `…/2011/404/20260715` + static print URL (shows účinnosť 15.07.2026–30.09.2026). Note: a new consolidated version starts 1.10.2026 — snapshot the 20260715 version *before* that date or it gets harder to cite.
5. **ÚPSVaR guidance pages are stale**: Blue Card page last updated 15.07.2024, VPM page 09.01.2023 — both predate the 15.7.2026 amendment. Keep them as `official_guidance_html` but mark `potentiallyStale: true` and never let them override upsvr-2026-07-15-changes or the statute.
6. **Annex 3 / §59(3) of Act 69/2026 not confirmed** from sandbox (text was cut before Prílohy). Confirm from the local snapshot before keeping the note in the registry.
7. **MZV national-visa page (03.09.2026)** confirms the 120-day national visa wording. It postdates 01.09 but the underlying rule is §15(3)(a) as amended from 15.7.2026 — so applicable; cite the statute, use the page as guidance.
8. **IOM fee page** matches spec §5 amounts and adds exemptions (under-18; spouses of SK citizens for permanent residence). These exemptions must be verified against Act 145/1995 tariff item 24 before entering FeeRule.exemptions.

## Still outstanding (owner machine / lawyer)
- Run `download_and_hash.py`; then check for each PDF: page count, `acroFormFields` (0 = flat PDF → overlay would be needed *later*; not needed for release 1 since no PDF generator).
- Verify the 5 `fetch_pending` ÚPSVaR resources (Priloha_7 docx, Priloha_10 doc, forms page, 15.7.2026 changes page).
- Reconcile with registry: MINV residence guides, PES electronic procedures, Hlásenie pobytu PDF, Act 145/1995 (2026-09-01 version), Act 5/2004 (pinned temporal version), Measure 155/2026 (životné minimum) — none of these are in the registry yet.
- Lawyer: review statuses `source_verified` → `legally_reviewed` per resource, in uk/sk.

## Release-1 scope reminder (decisions 2026-09-07)
uk + sk only; no PDF generator — checklist + link to official file + per-field "what to write" hints; unreviewed routes shown with explicit `incomplete` status; GitHub Pages first; charitable organisation as publisher.
