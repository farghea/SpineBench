# SpineBench changelog

## 2026-11-11 (b): three-layer restructure and deeper search

Backups of the files as they were before this round: `_old_20261111b/` (PLAN.md, papers_all.csv, ACCESS_LIST.md). The earlier round is in `_old_20261111/`.

### What the stopped agent had done (papers_all.csv, 14:50), checked against `_old_20261111/`
- It kept the 100-paper cap. It **removed 25 rows** and **added 25**.
- **Removed:** G06 Tafazzol, G07 Hajibozorgi, K01, K02 Pries (whose PDF you have), K03 Morita, P05, C02, C03, C06, Ebara1996, Cassidy1989, Panjabi1976 (JBJS, not Spine), Virgin1951, Brown1957, and the Spine papers Yamamoto1989, Busscher2009, Watkins2005, Brinckmann1991, Patwardhan1999, Brasiliense2011, Oda2002, Anderson2009, Niosi2008, Cunningham2003 and Cripton2000.
- **Added:** Guan2007, Kettler2011, Liebsch2018, Dennison2008, Steffen1998, Crisco1992, Cripton2000JB, Sawa2008, Wilke2020ESJ, LiebschWilke2022, Widmer2020, Stokes2002, GardnerMorse2003, GardnerMorse2004, Mannen2015, Anderson2016, Wilke2020IDP, Duprey2010, Naserkhaki2018, Fujita2000, Ghezelbash2020AF, E06, E07, C08 and C09.
- **Edited:**
  - Marked P01, P03, P04, P08 and C04 `covered_by_own_papers`.
  - Marked G01 and Rohlmann2001Spine inaccessible.
  - Expanded the Ghezelbash2021 and Holzapfel2005 notes.
  - Dropped M8 from U04, U08, G02 and V03.
- **Kept now:**
  - All 25 additions: their DOIs were re-checked in Crossref.
  - All 25 removed rows are restored, because there is no cap any more. The Spine ones carry `status = spine_inaccessible` and a `replaced_by` link. G06 and G07 are inputs again.
  - Its `local_pdf` column still pointed at the 9 deleted PDFs. That column is replaced by `pdf_in_folder`.

### papers_all.csv
- **Size:** 99 → **408 rows**. The total is 124 earlier rows (99 current plus 25 restored) and 284 new verified papers from this search (the thoracic, muscle-geometry, passive/ligament/disc and MSK-outcome searches, after removing 10 cross-search duplicates).
- **New columns:**
  - `layer` (input / property / outcome; two values when a paper serves two layers, primary first).
  - `suites` (new IDs).
  - `tier`.
  - `status`: keep / covered_by_own_papers / leave_out / spine_inaccessible.
  - `pdf_in_folder`: `yes: donwload/<file>`, `no`, or `no (deleted by user)`.
  - `journal`, `species`, `why`, `replaces`, `replaced_by`.
  - `old_suite_ids`, which keeps the previous codes.
- **Removed column:** `local_pdf`.
- **Verification:**
  - All 408 DOIs resolve in Crossref. The first author and year match, apart from online-vs-print year differences.
  - Six papers have no DOI and are verified by PMID or DTIC: Nachemson1970, Andersson1974, Liu1971, Kamaz2007, LopezValdes2011 and Gordon2014ANSUR.
  - Open-access status comes from OpenAlex.
- **Suite renames:**
  - M8 → IN1/IN2; M9 → IR.
  - F0 → PC3 (ligaments) and PC4 (disc).
  - FSU stiffness from F5 → PC6.
  - M2/M01 mass tables → PC7.
- **Tier changes:**
  - GardnerMorse2004 (human) → tier 1. Stokes2002 and GardnerMorse2003 stay tier 3 because they are porcine (abstracts checked).
  - C09 → tier 3, as a model-only method reference.
- **Uid renames:** the Epionics paper Dreischarf et al. 2014 PLoS One is `Dreischarf2014KIN`, to keep it apart from the FE inter-comparison `Dreischarf2014`.

### The 9 deleted PDFs
- **Re-download (2):**
  - G06 Tafazzol 2014: input IN1.
  - G07 Hajibozorgi & Arjmand 2016: input IN1/IR.
- **Leave out (7):** C01, G03, G05, U05, U07, U09 and U10. All are model-only or method papers with no measured target; TO_DOWNLOAD.md §B gives the reason for each. They stay in the csv with `status = leave_out`.

### PLAN.md
- Rewritten in the three-layer structure:
  - **Inputs:** IN1–IN5 and the IR robustness rule.
  - **Property checks:** PC1 muscle geometry, PC2 in vivo passive stiffness, PC3 ligaments, PC4 disc tissue anchored on Ghezelbash 2021 Acta, PC5 rib cage tissues and joints, PC6 FSU stiffness, PC7 mass properties.
  - **Outcomes:** M1–M7 and F1–F9 (F6a/F6b).
- Each suite lists ID, what, region, inputs, outputs, a pass-rule template (marked `template`) and key papers.
- Appendix A maps the experimental data inside the own papers, with figure and table numbers.

### New files
- `TO_DOWNLOAD.md`: the download list. It replaces `ACCESS_LIST.md`, which is kept unchanged for history.
- `DISSERTATIONS.md`: 36 verified (+13 unverified, listed separately) verified theses.
- `CHANGES.md`: this file.

### Findings to check
- **Mislabelled PDF:** `donwload/Mitutoyo Digital Caliper - Certificate of Calibration Control # DDE14R52L.PDF` is the IRSST accepted manuscript of **U04** (Ghezelbash et al. 2020 J Biomech), not a certificate. It was **not** moved to `_not_papers/`. Suggest renaming it `U04_Ghezelbash2020.pdf`.
- **Covered papers not found:** Polga 2004 (P08) and McGill & Kippers 1994 (C04) were not found in any own paper checked: the 9 local PDFs, plus the reference lists of 19 own works. They stay `covered_by_own_papers` as you instructed. Please say which paper or thesis chapter holds them.
- **Wilke 1999 (P01):** the own papers plot the same volunteer through Wilke 2001 (P02, in the folder), not P01 itself.
- **Spine papers with free PMC copies:** Brown 2011 (abdominal wall architecture) and Costi 2008 (6-DOF disc) are in Spine but have free copies on PMC, so they are downloadable.

### Not done
- No PDFs were downloaded or moved. No files in `donwload/` were changed.
- Pass rules are still templates; no numbers were extracted.
