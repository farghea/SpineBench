# REPORT: passive_tissue

**Totals.** 429 tests, 2,241 rows, 40 papers; 399 group files (26 pool more than one study).
Subcategories: ligament 211, annulus 116, costovertebral_joint 34, nucleus 18, rib 15, endplate 13, costal_cartilage 12, disc_whole 10.

**Provenance.**
- 37 tests (279 rows, ~12%) digitised from figures (frame/tick calibration at 200–300 dpi; 2 points per test re-checked independently; uncertainty stated per test): Pintar Fig 1, Wolny Fig 7, Elliott & Setton Fig 5, Bass Fig 3c/d, Iatridis 1999 Figs 2a/3a/4a, Jamison Fig 2.
- 19 tests derived/evaluated by the extractor, tagged `derived`: Chazal and Wolny linear stiffness from characteristic points; Duprey polynomials and Little/Wagner regressions evaluated to points; mean/SD computed from per-specimen tables.
- OCR-garbled tables (Chazal, Pintar, Nachemson, Tkaczuk, Schultz, Granik, Galante) re-read from page renders; see `check_notes`.
- Old units converted, original kept in `orig` (kp→N ×9.80665; kp/cm² ×0.0980665 MPa; kp/mm² ×9.80665 MPa; psi ×0.00689476 MPa).
- Galante ±SE (`se`); Jamison bars are SE; Yoganandan ± unspecified (`pm`).

**Shared samples.** Wolny 2024 ↔ Wiczenbach 2025 (4 donors); Adams & Green 1993 ↔ Green 1993; Gradischar 2022 ↔ Lebschy 2024 (donors K25, K35). No animal tissue.

**Annulus/disc coverage (Ghezelbash 2021/2020 validation map).**
| Mode | Sources |
|---|---|
| Single lamella, along fibre | Holzapfel 2005 |
| Uniaxial circ/axial/radial | Elliott & Setton 2001, O'Connell 2009, Wagner & Lotz 2004, Galante 1967, Fujita 1997 |
| Biaxial | Bass 2004 (uniaxial curves + 3 biaxial points; 6-run curves too overlapped) |
| Bone–AF–bone failure/fatigue | Green 1993, Adams & Green 1993 |
| Shear | Fujita 2000, Iatridis 1999, Iatridis 1997a/b |
| Confined compression / swelling | Iatridis 1998, Cortes 2014, Galante 1967, Elliott 2001 |
| Whole disc | Jamison 2013, Skrzypiec 2013, Costi 2007 |

Missing from `donwload/`: Skaggs 1994, Skrzypiec 2007, Acaroglu 1995, Ebara 1996, O'Connell 2012, Brown 1957, Markolf & Morris 1974, Asano 1992.

**Ligaments.** Pintar 1992 (6 ligaments × 6 levels), Chazal 1985 (lumbar/thoracic), Neumann 1992, Nachemson 1968, Tkaczuk 1968, Iida 2002, Hindle 1990 (force at 10°, own group), Little 2005, Robertson 2013; thoracic Wolny 2024, Wiczenbach 2025. Rib cage: Gradischar 2022, Weber 2021, Forman 2011, Schultz 1974b, Lemosse 1998, Duprey 2010, Lebschy 2024, Kindig 2011/2013, Yoganandan 1998, Granik 1973.

**Skipped.** Jaumard 2011, Newell 2017 (reviews); Forman 2010 (normalised force only); Schultz 1974a (bar charts, not digitised). Fitted constitutive coefficients not extracted (Bass T1, O'Connell T2–3, Wiczenbach T3+, Iatridis 1997a T1).

**Open questions.**
1. Weber 2021 Eimax 14.6 (abstract) vs 15.6 MPa (results); 15.6 used.
2. Fujita 1997 grade II sits in a `human_nondegen` group (grade per row) — relabel?
3. Iatridis 1997a/b possible sample overlap, not linked.
4. Pintar 1992 failure points: 4 touch the plot frame, flagged as possibly clipped.
5. Chazal 1985 mixes surgical and cadaveric ISL+SSL (per row).
6. Duprey 2010 Z-axis polynomial range (±2°) assumed.
