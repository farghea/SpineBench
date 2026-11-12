# Independent verification (2026-11-12)

Three independent agents re-read values against the PDFs (tables/text exactly; digitised values within stated uncertainty).

| Check | Tests | OK | Fixed | Not checkable |
|---|---|---|---|---|
| Random stratified sample A | 64 | 57 | 3 | 4 (primary PDF missing) |
| Random stratified sample B | 64 | 55 | 5 | 4 (primary PDF missing) |
| Sign check (PDFs that drop minus signs) | 48 | 48 | 0 | 0 |

- **Numeric values:** ~1–2 wrong of ~2,000 re-read (<0.5%). Fixed: Koopman 2020b Q1/median (lumbar, 100% row).
- **Metadata:** one systematic bug found and fixed everywhere: 18 review-derived (`*_secondary`) tests stored the primary paper's year as `source.n`. Now set from the primary study in SpineBench (6) or null (12).
- **Per-row n:** Wilke 2020 ESJ steps marked "# n = 5" corrected from 6.
- Unverifiable here (PDF not in collection): Sato 1999, Takahashi 2006, Polga 2004 (values from Ghezelbash lab validation targets and Dreischarf 2016 / Schmid 2020 secondary sources).

Known paper-level issues are recorded in each test's `extraction.check_notes` and in REPORT_*.md.
