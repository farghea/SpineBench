# SpineBench: proposed structure of the in vitro / FE part

Scope: tests a nonlinear FE spine model can run. That means a T1-S1 model in FEBio, or FSU and sub-models cut from it, with discs (nucleus plus fibre-reinforced annulus), ligaments, facets, optionally the rib cage, and implants.
Sources: `papers.csv` / `papers.md` (50 papers). Anything marked `[verify]` there must be confirmed in the full text before a numeric target is entered.

---

## 0. Conventions shared by all suites

**Test ID.** `<suite>-<nn>`, for example `S2-01`. Each test is a YAML record with these fields: specimen (levels and structures present), BCs, load steps, outputs, the experimental target with its source table or figure, and the pass rule.

**Boundary conditions (default unless a paper says otherwise)**
- Caudal vertebra: all nodes fixed, or bound to a fixed rigid body. This matches potting in PMMA.
- Cranial vertebra: bound to a rigid body. The pure moment acts on that rigid body, with the other 5 DOF free. This is the "unconstrained pure moment" of Wilke 1998 and Panjabi 2007.
- Fixation of intermediate vertebrae and the rib cage follows the paper. For example, Brasiliense 2011 fixes the distal ribs to their vertebrae, and Liebsch 2017/2020 test the whole C7-L1 specimen with the rib cage.
- Gravity off. Specimen weight is ignored, as in vitro.

**Follower load.** Model it as a set of tension-only cables or spring connectors through guides near each level's centre of rotation. Before applying any moment, check that the preload alone gives less than 1 deg of change in segmental angle (the Patwardhan 1999 criterion; Dreischarf 2014 cites Dreischarf 2010 on path optimisation). Report the path used.

**Load history.**
- Apply the moment quasi-statically in at least 10 increments.
- In vitro data come from the loading branch of the 3rd of 3.5 cycles (Wilke 1998, Wilke 2017, Liebsch 2017/2019/2020). A hyperelastic FE model should therefore be compared with the **loading branch at peak moment**.
- Do not use the neutral zone (NZ) as a pass/fail target. NZ comes from hysteresis and laxity that a quasi-static elastic model does not represent; report it as informative only.

**Outputs (standard names)**
- `ROM_<level>_<dir>` (deg): rotation of the upper vertebra relative to the lower one about the primary axis, at peak moment, measured from the unloaded (or preloaded) state.
- `ROMtot_<range>_<dir>`: total rotation over a multi-level range.
- `MR_curve`: rotation at each moment step.
- `IDP_<level>` (MPa): mean hydrostatic pressure (or −1/3 trace of stress) in the central nucleus elements. State the averaging volume.
- `FJF_<level>_<side>` (N): resultant facet contact force.
- `Fstiff` (N/mm), `Mstiff` (Nm/deg).
- `Coupled_<dir>` (deg): secondary rotations.

**Pass-rule templates** (thresholds are proposals to tune; none come from a paper)

| Data type | Rule | Grade |
|---|---|---|
| Mean ± SD (Panjabi/Oxland/Yamamoto style) | z = (FE − mean)/SD | PASS \|z\| ≤ 1; MARGINAL 1 < \|z\| ≤ 2; FAIL \|z\| > 2 |
| Median + min–max (Wilke/Liebsch/Rohlmann style) | FE within [min, max]; also report r = (FE − median)/(max − min) | PASS inside range; FAIL outside |
| Curves (moment–rotation, IDP–moment, IDP–force) | Fraction of moment steps inside the corridor (±1 SD or range); NRMSE = RMSE/(max exp value) | PASS ≥ 80 % of points inside and NRMSE ≤ 0.20 |
| Resection / intervention % changes | Δ% = (ROM_step − ROM_prev)/ROM_prev | PASS: sign correct AND inside the experimental range or ±1 SD of Δ%; also report cumulative change vs intact |
| FE inter-comparison | FE inside the Dreischarf 2014 range of 8 models AND inside the in vitro range | PASS both; MARGINAL one of the two |
| Qualitative (e.g. "facets unloaded in flexion") | Boolean | PASS / FAIL |

**Score aggregation.** Per suite, report the share of PASS tests and the mean |z| (or mean |r|). Never merge calibration tests and validation tests into one number. Any paper used to calibrate a parameter is tagged `calibration` and excluded from that model's validation score, following the calibrate/validate split of Schmidt 2007.

---

## S0. Tissue calibration (pre-benchmark gate)

Not one of the requested suites. It is included because Ghezelbash 2021 shows that tissue-level results depend strongly on specimen geometry and BCs (up to 16×). A model should state how it meets this gate before any segment result counts.

- **Specimens:** single-lamella strips (Holzapfel 2005, L1-L2), multi-layer circumferential AF strips (Ebara 1996), and whole ligaments (Pintar 1992 lumbar, Chazal 1985 thoracic/lumbar).
- **BCs:** replicate grip geometry. For example, Holzapfel strips have bone fragments at their ends.
- **Load:** uniaxial tension along and transverse to the fibres; ligament force–deflection to the failure onset.
- **Outputs:** stress–strain curves; tangent moduli in the bands used by Holzapfel (0–0.1, 0.1–0.5, 0.5–1 MPa); ligament force–deflection.
- **Pass rule:** curve corridor. The ligament curves are inputs, so this gate checks implementation rather than validation.
- **Geometry inputs:** fibre angle field from Cassidy 1989 (62→45 deg from vertical, outer to inner) and the Holzapfel 2005 regression |φ| = 23.2 + 0.130·α.
- **Papers:** Pintar1992, Chazal1985, Holzapfel2005, Ebara1996, Cassidy1989, Ghezelbash2021.

---

## S1. Lumbar FSU ROM

| ID | Specimen | Load | Outputs | Target source | Rule |
|---|---|---|---|---|---|
| S1-01 | L4-L5 intact (all structures) | Pure moment 1, 2.5, 5, 7.5, 10 Nm in F, E, LLB, RLB, LAR, RAR; no preload; L5 fixed | MR_curve, ROM at each moment | Heuer2007a (intact step), n=8, median age 52 | Curve corridor + range at 10 Nm |
| S1-02 | Each lumbar level L1-L2 … L5-S1 (extracted from the L1-S1 model with the levels below fixed) | Pure moment to 10 Nm | ROM per level, primary + coupled | Yamamoto1989 (n=10), Panjabi1994 (n=9) | z-score per level |
| S1-03 | L4-L5 intact | Pure moment 7.5 Nm (Wilke 1998 standard) | ROM | Heuer2007a interpolated at 7.5 Nm; Lund1998 intact | Range |
| S1-04 | FSU, force-controlled loads with preload | As in Schultz1979 [verify loads] | Rotation/translation per load | Schultz1979 | z-score (if SD reported) |
| S1-05 | L1-L2 | Combined moment + axial load (see S7-03) | Segment motion | Schendel1993 | Range |

- **Notes:** Report both "FSU cut from the full model" and "FSU with its own calibrated BCs". Liebsch 2020 shows that segment length changes thoracic ROM, and the same check is worth running for the lumbar spine.
- **Papers:** Heuer2007a, Yamamoto1989, Panjabi1994, Schultz1979, Wilke1998, Lund1998 (intact), Schendel1993.

---

## S2. Lumbar multi-segment ROM

| ID | Specimen | Load | Outputs | Target source | Rule |
|---|---|---|---|---|---|
| S2-01 | L1-L5, L5 fixed | Pure moment 3.75 and 7.5 Nm, F/E, LB, AR | ROMtot L1-L5, segmental ROM, MR_curve | Rohlmann2001Spine (n=10, median + range); Dreischarf2014 Fig. 2a/b | Range; also inside the Dreischarf 8-model range (S9) |
| S2-02 | L1-L5 | 7.5 Nm + 280 N follower | Segmental ROM (AR expected to drop slightly, F/E and LB hardly change) | Rohlmann2001Spine | Range + qualitative trend |
| S2-03 | L1-S1, sacrum fixed | Pure moment to 10 Nm | Per-level ROM including L5-S1 | Yamamoto1989, Panjabi1994 | z-score |
| S2-04 | L1-S1 (or as specified [verify]) | F/E under follower 0, 400, 800, 1200 N along a neutral path | ROM, flexion stiffness vs preload | Patwardhan2003 (n=21): ~2× flexion stiffness at 1200 N, ROM −25 % (neutral path) | Δ% vs 0 N within reported SD [verify]; sign rule |
| S2-05 | L1-S1 | Bending without preload; F/E with 800 N follower | Per-level disc compression, ROM | Renner2007 (10 L1-S1 in vitro + FE) | Range |
| S2-06 | L1-L4 (4-vertebra segment) | Pure moment 4 Nm, F/E, LB, AR | Segmental ROM | Busscher2009 (same protocol as S3-04) | z-score / range |

- **Papers:** Rohlmann2001Spine, Yamamoto1989, Panjabi1994, Patwardhan2003, Renner2007, Busscher2009, Dreischarf2014.

---

## S3. Thoracic FSU and multi-segment ROM, with and without rib cage

**S3-A: without rib cage**

| ID | Specimen | Load | Outputs | Target source | Rule |
|---|---|---|---|---|---|
| S3-01 | Each FSU T1-T2 … T11-T12 with costovertebral joints (rib heads/stumps) | ±7.5 Nm, F/E, LB, AR; no preload | ROM per level; full MR_curve | Wilke2017 (68 FSUs; raw curves in S1-S7 datasets) | Curve corridor + range |
| S3-02 | T11-L1 (two levels) | ±7.5 Nm, 3 planes | ROM T11-T12, T12-L1 (mean ± SD) | Oxland1992 (n=11) | z-score |
| S3-03 | Each thoracic FSU | Six forces and six moments at the upper vertebral centre [magnitudes: verify] | Main + coupled flexibilities | Panjabi1976 | Range / z [verify] |
| S3-04 | T1-T4, T5-T8, T9-T12 (4-vertebra segments) | 4 Nm, 3 planes | Segmental ROM | Busscher2009 | z-score |

**S3-B: with rib cage**

| ID | Specimen | Load | Outputs | Target source | Rule |
|---|---|---|---|---|---|
| S3-05 | T1-T12 / C7-L1 with intact rib cage and sternum | ±2 Nm, 3 planes | ROMtot T1-T12, monosegmental ROM, coupled ROM | Liebsch2017 intact step (n=6; Tables 1-3 + S1 raw) | Range |
| S3-06 | C7-L1 with rib cage | ±5 Nm, 3 planes | ROMtot T1-T12; segmental ROM at T1-T2, T3-T4, … T11-T12 | Liebsch2020 intact step (n=8; Tables 2-9) | Range |
| S3-07 | C7-L1 with rib cage | 5 Nm, 3 planes | Rib-vertebra and rib-sternum relative angles; intercostal strain | Liebsch2019 (n=8) | Range; qualitative (rib deformation < 1 %) |
| S3-08 | T1-T12 with rib cage | 5 Nm + follower 0–400 N | FSU and total ROM, stiffness | Sis2016 (n=8) | Δ% with follower load; range |
| S3-09 | Whole thoracic spine with rib cage → rib cage removed | As in Watkins2005 [verify] | Stability (%) | Watkins2005 (n=10) | Δ% sign + magnitude |

- **Specimen-length check.** Liebsch 2020 steps 2→3 (polysegmental → monosegmental) are a direct test of FSU-vs-long-segment BCs. A model should pass S3-06 in both configurations.
- **Papers:** Wilke2017, Oxland1992, Panjabi1976, Busscher2009, Liebsch2017, Liebsch2019, Liebsch2020, Sis2016, Watkins2005, Healy2014 (intact), Brasiliense2011 (intact).

---

## S4. Intradiscal pressure in vitro

| ID | Specimen | Load | Outputs | Target source | Rule |
|---|---|---|---|---|---|
| S4-01 | L4-L5 FSU | Axial compression 0 → 1000 N (follower or centred) | IDP vs force | Brinckmann1991 (via Dreischarf2014 Fig. 2d: median/range at 0, 300, 1000 N, five L4-5) | Range at 300 and 1000 N |
| S4-02 | L1-L5 | 3.75 / 7.5 Nm ± 280 N follower | IDP at all levels | Rohlmann2001Spine | Range |
| S4-03 | L4-L5 | 1–10 Nm, 3 planes, resection steps | IDP vs moment per step | Heuer2007b (n=8) | Curve corridor; sharp rise after facet removal (qualitative) |
| S4-04 | T1-T12 with rib cage, then without | 0 to ±5 Nm + 400 N follower | IDP at T4-T5, T8-T9; pressure–moment slope | Anderson2018 | Slope with vs without rib cage; rib cage share of AR moment (~62 % T4-5, ~56 % T8-9) |
| S4-05 | L4-L5 | Partial nucleotomy (mass removal) under compression | IDP and height change | Brinckmann1991 (3 g removed → IDP ~40 % of initial; 1 g → −0.8 mm height) | Range [verify SD] |
| S4-06 | Lumbar with fixator | Pure moments [verify] | Adjacent-level IDP | Rohlmann2001ESJ, Cripton2000 | Range |

- **Notes:** Define the IDP sampling volume (for example, the central 20 % of nucleus elements). In vitro probes measure the local stress at the needle tip. Report the sensitivity of IDP to that choice.
- **Papers:** Brinckmann1991, Rohlmann2001Spine, Heuer2007b, Anderson2018, Rohlmann2001ESJ, Cripton2000, Dreischarf2014.

---

## S5. Compression stiffness

| ID | Specimen | Load | Outputs | Target source | Rule |
|---|---|---|---|---|---|
| S5-01 | Lumbar FSU | Axial compression; A/P and lateral shear | Fstiff (N/mm), shear stiffness | Berkson1979 [verify loads] | z / range |
| S5-02 | Thoracolumbar FSUs | Compression, tension, shear, bending, torsion | Stiffness per mode | Markolf1972 [verify] | Range |
| S5-03 | Disc, intact → nucleus removed | Axial compression | Fstiff, creep | MarkolfMorris1974 [verify] | Δ% sign + range |
| S5-04 | Lumbar disc / FSU | Axial compression | Load–deflection, bulge | Virgin1951, Brown1957 (sanity bounds only, tier 3) | Bound check |
| S5-05 | Whole lumbar (L1-S1) | Vertical load vs follower load to 1200 N | Lordosis change; buckling | Patwardhan1999 | Qualitative: vertical load → near flexion/extension limit at ~100 N; follower load → stable at 1200 N |
| S5-06 | L1-S1 | Follower compression | Per-level disc compression | Renner2007 | Range |
| S5-07 | Thoracic with rib cage | Follower 0–400 N + 5 Nm | Stiffness change | Sis2016 | Δ% |

- **Papers:** Berkson1979, Markolf1972, MarkolfMorris1974, Virgin1951, Brown1957, Patwardhan1999, Renner2007, Sis2016, Ghezelbash2021 (whole-disc compression check).

---

## S6. Sequential resection

**S6a: lumbar**

- **Specimen:** L4-L5 FSU (Heuer2007a/b, n=8, median age 52, low degeneration).
- **Load:** pure moments 1–10 Nm, 3 planes. Rate 1 deg/s in vitro; quasi-static in FE.
- **Steps (follow the paper's exact order):** intact → supra- and interspinous ligaments → ligamentum flavum → facet capsules → facet joints → PLL/ALL [verify exact order] → nucleus. Each step is a separate FE variant made by deleting elements or setting their stiffness to zero.
- **Outputs:** ROM, MR_curve, IDP (Heuer2007b), L4 translation, lordosis change (ligament pretension).
- **Rules:**
  - Per-step Δ% sign and range.
  - Qualitative checks: posterior ligaments → mainly a flexion increase; facets → affect AR, not LB; ALL → strong in extension; nucleotomy → largest increase.
  - Report the cumulative curve.
- **Calibration vs validation:** follow Schmidt2007. Calibrate on the intact state plus the Heuer steps. Validate on held-out defects (bilateral hemifacetectomy, nucleotomy, interspinous defect).
- **Control mode:** Ghezelbash2020rev shows that resection order and control mode (force vs displacement) change conclusions. Every S6 test must state both.
- **Papers:** Heuer2007a, Heuer2007b, Schmidt2007, Ghezelbash2020rev, Pintar1992 (inputs), MarkolfMorris1974.

**S6b: thoracic and rib cage**

| ID | Specimen | Load | Steps | Source |
|---|---|---|---|---|
| S6b-01 | T1-T12 / C7-L1 with rib cage | ±2 Nm | intact → −intercostal muscles → median sternotomy → −anterior rib cage → −right 6–8th rib heads → −all rib heads | Liebsch2017 (Tables 1-5, S1) |
| S6b-02 | C7-L1 with rib cage | ±5 Nm | intact → anterior rib-to-rib connections cut → monosegments → ribs removed | Liebsch2020 (Tables 2-9) |
| S6b-03 | Upper thoracic 3-level + 4 ribs + sternum, distal ribs fixed | 7.5 Nm | intact → sternum split → sternum removed → 50 % ribs → 75 % ribs → all ribs | Brasiliense2011 |
| S6b-04 | C7-L1 with rib cage | ±5 Nm | at T4-T5: laminectomy → unilateral facetectomy → unilateral costotransversectomy → T3-T7 fusion | Healy2014 |
| S6b-05 | Thoracic FSU with costovertebral joints | [verify] | Group 1 anterior→posterior (discectomy, rib head, …); Group 2 posterior→anterior (laminectomy + medial facetectomy, total facetectomy, …) | Oda2002 (16 FSUs) |
| S6b-06 | Thoracic FSU | Flexion to ~3.2 deg (displacement control), 0.1 Hz | 6 posterior procedures (anchor site preparation, SSL/ISL, facets + remaining posterior structures) | Anderson2009 (23 FSUs) |
| S6b-07 | Whole thoracic with rib cage | [verify] | intact → sternal fracture → rib cage removed | Watkins2005 |

- **Rule:** per-step Δ% (sign + range). Report the rib cage contribution as (ROM_noRC − ROM_intact)/ROM_noRC so it can be compared with the Brasiliense 78 % figure.
- **Papers:** Liebsch2017, Liebsch2020, Brasiliense2011, Healy2014, Oda2002, Anderson2009, Watkins2005.

---

## S7. Facet forces

| ID | Specimen | Load | Outputs | Target | Rule |
|---|---|---|---|---|---|
| S7-01 | L1-L5 | 7.5 Nm extension, AR | FJF per level | Wilson2006 ranges as used in Dreischarf2014 Fig. 2c (in vitro median 30 N extension, 83 N AR) | Range; plus the Dreischarf 8-model range |
| S7-02 | L2-L5 | ±7.5 Nm, 3 planes, with and without 600 N follower | Peak FJF per side | Niosi2008 (n=10; intact flexion ~3 N/side, LB ~14 N/side) | Range |
| S7-03 | L1-L2 | 10 Nm extension + 190 N; 10 Nm torsion + 150 N; 3 Nm LB + 160 N | FJF, ALL/PLL force, motion | Schendel1993 (n=5; facet 205 / 65 / 78 N; zero in flexion) | Range + qualitative (zero FJF in flexion; tip impingement at 4–6 Nm extension) |

- **Tolerance:** Wilson2006 reports that the Tekscan sensor overestimates load by 18 ± 9 % at 100 N and 50 ± 9 % at 25 N. Widen the corridor, or compare against the corrected range.
- **Papers:** Wilson2006, Niosi2008, Schendel1993, Dreischarf2014, Cripton2000.

---

## S8. Instrumented spine

**Load rule.** Use the Panjabi2007 hybrid protocol for adjacent-level outputs: apply the intact pure moment, record the intact total ROM, then drive the instrumented model until it reaches the same total ROM. Use standard pure moments (Wilke1998) for operative-level ROM.

| ID | Construct | Specimen | Load | Outputs | Source |
|---|---|---|---|---|---|
| S8-01 | Bisegmental internal fixator; corpectomy + graft | Lumbar | Pure moments [verify] | ROM and IDP at all levels | Rohlmann2001ESJ (n=7) |
| S8-02 | Posterior fixator after sequential injury | Lumbar FSU | Flexibility protocol [verify] | IDP, rod forces/moments | Cripton2000 |
| S8-03 | Posterior interbody cages ± pedicle screws ± cross-bracing | Lumbar FSU | Pure moments [verify] | ROM per configuration | Lund1998 (6 per cage type) |
| S8-04 | TDR (Charité), BAK cages, BAK + pedicle screws at L4-L5 | L2-S1 | ±8 Nm | Operative and adjacent ROM (% of intact) | Cunningham2003 (n=8) |
| S8-05 | PEEK vs Ti rods | Lumbar | Pure moments [verify] | ROM reduction (%), anterior/posterior load share | Gornet2011 |
| S8-06 | Dynamic posterior device (Dynesys) | L2-L5 | ±7.5 Nm ± 600 N | Facet force | Niosi2008 |
| S8-07 | T3-T7 pedicle screw fusion | C7-L1 with rib cage | ±5 Nm | T1-T12 ROM change (−16.3 % AR, −12 % FE, −18.4 % LB) | Healy2014 |

- **Implant modelling rule:** state screw–bone interface (tied or contact), rod material (Ti E ≈ 110 GPa; PEEK E ≈ 3–4 GPa) and diameter. These values are general material data, not taken from the papers; enter the paper-specific values once verified.
- **Rule:** Δ% vs intact, within the reported range or SD. Adjacent-level: Δ% sign and range.
- **Papers:** Panjabi2007, Wilke1998, Rohlmann2001ESJ, Cripton2000, Lund1998, Cunningham2003, Gornet2011, Niosi2008, Healy2014.

---

## S9. FE model inter-comparison

The template is Dreischarf2014: 8 lumbar models, anonymised, with the Shirazi-Adl model among them.

**Part A (in vitro) — run exactly as Dreischarf 2014**
- L1-L5, L5 fixed (S1 fixed if the model includes L5-S1).
- (i) Pure moment 7.5 Nm in F, E, LB, AR, giving ROMtot L1-L5, MR_curve and FJF at all levels.
- (ii) Follower compression to 1000 N, giving L4-L5 IDP at 0, 300 and 1000 N.
- Comparators: in vitro data (Rohlmann2001Spine n=10, Wilson2006, Brinckmann1991) and the 8-model median and range. From the full text: FE median L1-5 ROM was F/E 34 deg (24–41), LB 35 deg (25–41), AR 17 deg (11–22).

**Part B (in vivo-like combined loads)**
- Follower plus moment cases from Dreischarf 2014 Table 3. Flexion is 1175 N + 7.5 Nm (from the full text); the extension, LB and AR values must be read from Table 3, which is an image.
- Comparators: segmental IVR vs Pearcy (in vivo) and L4-L5 IDP vs Wilke 2001 (in vivo). These belong to the in vivo agent's scope; here only the load cases are reused.

**Reporting**
- Each model reports Table 1/2-style properties (material laws, disc height, lordosis) so that the spread can be explained.
- Pooled-median scoring is used: Dreischarf showed the median of several models predicts better than any single one.
- Rules:
  - PASS = inside both the in vitro range and the 8-model range.
  - MARGINAL = inside one of the two.
  - Also report the distance to the pooled median.

**V&V checklist (Jones & Wilcox 2008)**
- Mesh convergence: ROM and IDP change < 5 % at the next refinement. This threshold is a proposed default.
- One-at-a-time sensitivity on the uncertain parameters: annulus fibre stiffness, nucleus bulk modulus, ligament slack and pre-strain, facet gap and friction.
- A calibration vs validation table, as in Schmidt2007.

**Multi-level reporting (Ghezelbash2025, user's own work)**
- Report tissue → segment → whole spine → MSK-coupled results, the hierarchy that paper used.
- The lumbar load-sharing outcomes summarised in Ghezelbash2020rev become a qualitative "component contribution" checklist.

**Papers:** Dreischarf2014, Schmidt2007, JonesWilcox2008, Ghezelbash2020rev, Ghezelbash2025, plus every in vitro source above.

---

## Gaps and next additions (beyond the 50-paper cap)

Candidates for adding as a replacement or after verification:
- Schmidt et al. 2006 Clin Biomech (annulus calibration).
- Zander et al. 2017 J Biomech (FE sensitivity, 10.1016/j.jbiomech.2016.12.014 [verify]).
- Guan et al. 2007 J Biomech (lumbosacral moment–rotation).
- Mannen et al. 2015 Spine (rib cage contribution, 10.1097/brs.0000000000000879).
- Anderson et al. 2016 J Biomech (thoracic IDP vs follower load, 10.1016/j.jbiomech.2016.02.038).
- Lubelski et al. 2014 Spine J (lower thoracic decompression, 10.1016/j.spinee.2014.03.026).
- Horton et al. 2005 Spine (thoracic release sequences).
- Dreischarf et al. 2011/2012 (optimised AR and LB loads).
- Nachemson 1960 (classic IDP vs compression).

Remaining gaps:
- **Thoracic facet forces:** no in vitro thoracic facet-force dataset was found.
- **Long T1-S1 in vitro data:** no single study tests T1-S1 under pure moments. SpineBench should validate thoracic and lumbar parts separately and treat T1-S1 runs as combined-region checks.
- **"Effective dimension" FE paper by the user:** not found in OpenAlex for F. Ghezelbash (47 works checked). It may be unpublished or under a different title; the user should add it.
