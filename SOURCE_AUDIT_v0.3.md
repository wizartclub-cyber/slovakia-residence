# External Sources Audit v0.3

Baseline: 2026-09-01  
Checked: 2026-09-07

## Key conclusions
- MZV residence guidance updated 15–16 Aug 2026 should generally outrank older 2024–2025 MINV FAQ PDFs for practical document lists.
- MZV national-visa guidance updated 3 Sep 2026 explicitly confirms the 120-day national visa for submitting a residence application in Slovakia.
- ÚPSVaR is the primary source for employment and Blue Card supporting templates; many official forms are DOC/DOCX/RTF, not PDF.
- Slov-Lex remains the legal source of truth.
- Act 69/2026 contains Annex 3 “VYHLÁSENIE CUDZINCA”; §59(3) says police record the declaration on that official form.
- IOM MIC is a secondary cross-check, not the controlling legal source.

## Required DocumentResource types
official_form_pdf
official_form_doc
official_form_docx
official_form_rtf
official_forms_page
official_guidance_html
statute
statute_amendment
statutory_annex
secondary_guidance
electronic_form

## Implementation rule
Do not convert an official DOC/DOCX into an “official PDF”. If the site generates a PDF convenience copy, label it `generated_copy` and always retain/link the authority's original file.
