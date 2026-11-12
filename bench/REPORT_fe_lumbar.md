# REPORT fe_lumbar

Group categories: fe_rom_lumbar_fsu, fe_rom_lumbar_multi, fe_resection_lumbar, fe_idp_invitro, fe_compression_stiffness, fe_facet, fe_instrumented, fe_model_comparison (+ fe_rom_thoracic for thoracic papers that sit in these catalog categories).
Status at writing: **243 tests, 2686 data points, 261 group files**. About 45% of the data points come from digitised figures; the rest are from tables or text. Every test has `extraction.checked = true`.

How the work was split: fork A did the Ulm ROM and resection papers, fork B the multi-segment ROM and stiffness papers, fork C the IDP papers. The coordinator did the facet papers, finished fork D1 after it stopped early on a rate limit (Liebsch 2020 instrumented steps, Widmer 2020), and built the groups and normalisation. Forks A, B and C were resumed by main, so counts can grow. Re-run the two scripts below after they finish.

## Tests per paper
| Paper | Tests | Data points | Digitised | Categories |
|---|---|---|---|---|
| Anderson 2016 | 6 | 78 | 24 | idp_invitro, rom_thoracic |
| Anderson 2018 | 5 | 41 | 36 | idp_invitro, rom_thoracic |
| Cannella 2008 | 9 | 80 | 59 | compression_stiffness, idp_invitro, resection_lumbar, rom_lumbar_fsu |
| Cook 2015 | 2 | 30 | 30 | rom_lumbar_multi |
| Crisco 1992 | 6 | 38 | 0 | compression_stiffness |
| Dennison 2008 | 2 | 15 | 0 | idp_invitro |
| Dreischarf 2014 | 11 | 93 | 90 | model_comparison |
| Frei 2002 | 2 | 15 | 9 | compression_stiffness, idp_invitro |
| Ghezelbash 2020b (review) | 19 | 111 | 0 | facet, model_comparison, resection_lumbar (all secondary) |
| Gornet 2011 | 4 | 12 | 12 | instrumented, rom_lumbar_multi |
| Guan 2007 | 3 | 294 | 128 | rom_lumbar_multi |
| Heuer 2007a | 19 | 368 | 0 | resection_lumbar, rom_lumbar_fsu |
| Heuer 2007b | 10 | 87 | 81 | idp_invitro, resection_lumbar |
| Heuer 2008 | 11 | 206 | 0 | resection_lumbar, rom_lumbar_fsu |
| Ianuzzi 2004 | 1 | 19 | 0 | facet |
| Ivicsics 2014 | 2 | 30 | 18 | facet |
| Kettler 2011 | 10 | 48 | 24 | rom_lumbar_fsu |
| Liebsch 2020 FB | 17 | 114 | 64 | instrumented, rom_thoracic |
| Meakin 2001 | 2 | 14 | 0 | resection_lumbar |
| Panjabi 1994 | 3 | 188 | 188 | rom_lumbar_multi |
| Patwardhan 2003 | 4 | 64 | 0 | compression_stiffness, rom_lumbar_multi |
| Popovich 2013 | 2 | 12 | 6 | facet, idp_invitro |
| Renner 2007 | 3 | 29 | 29 | compression_stiffness, rom_lumbar_multi |
| Rohlmann 2001a | 10 | 121 | 112 | idp_invitro, instrumented, rom_lumbar_multi |
| Sawa 2008 | 3 | 12 | 9 | facet, rom_lumbar_fsu |
| Schendel 1993 | 3 | 15 | 0 | facet, rom_lumbar_fsu |
| Schmidt 2007 | 4 | 8 | 8 | resection_lumbar (secondary) |
| Schultz 1979 | 7 | 97 | 0 | idp_invitro, resection_lumbar, rom_lumbar_fsu |
| Spenciner 2006 | 3 | 78 | 78 | rom_lumbar_fsu |
| Steffen 1998 | 4 | 92 | 0 | idp_invitro, rom_lumbar_multi |
| Widmer 2020 | 2 | 55 | 0 | resection_lumbar |
| Wilke 2020b (thoracic IDP) | 1 | 21 | 21 | idp_invitro |
| Wilke 2025 | 49 | 147 | 147 | rom_lumbar_fsu, rom_lumbar_multi, rom_thoracic |
| Wilson 2006 | 2 | 38 | 36 | facet |
| Zhu 2008 | 2 | 16 | 0 | facet |

## Papers skipped
These catalog entries are marked usable = no:
- **Carpenedo 2025:** a review with no primary data.
- **Marini 2016, Meng 2015, Naserkhaki 2018:** modelling only; their experimental values are re-plots of other papers.
- **Panjabi 2007:** a methods paper with a literature table only.

## Conventions applied (coordinator rules)
- **`source.n`** is an integer. The descriptive text is in `source.sample`.
- **`combine_group`** is `<category>__<quantity>__<level>__<condition>__<load>`, lower-case snake case. A decimal point becomes `_` (7.5 Nm is `7_5nm`), matching the forks' existing names. Ranges also use `_` (`1_10nm`), so read the load token together with the test's data.
- **fe_rom_thoracic tests** keep the thoracic group's existing names (for example `fe_rom_thoracic__rom__T1-T12__ribcage_intact__5Nm`), so Liebsch 2020 pools with them.
- **Group files** that this group created carry `"built_by": "fe_lumbar"`. Groups owned by other groups are only appended to.
- **Re-runnable scripts:**
  - `python3 -I /tmp/fel/scripts/normalize.py` makes n an integer, converts names to snake case and makes `shared_sample_with` symmetric.
  - `python3 -I /tmp/fel/scripts/build_groups.py` rebuilds this group's group files.

## Shared specimens and pooling
- **Heuer 2007a and 2007b** are the same 8 L4-L5 specimens; they are cross-linked in every test. **Heuer 2008** uses 6 L2-L3 specimens from the same donor pool (different level).
- **Wilke 2025** lists Heuer 2007a/b (n=8, L4-L5) and Heuer 2008 (n=6, L2-L3) as sources. Its pooled ROM and NZ groups are therefore linked to those tests. **Kettler 2011** uses the same Ulm database (overlap is likely but not itemised).
- **Patwardhan 2003 and Renner 2007** are linked as possible overlaps (same lab, follower-load L1-S1 specimens).
- **Zhu 2008** EAS and Tekscan results come from the same 10 specimens.
- **Secondary and model data are never pooled with primary data.** Re-plots from Schmidt 2007, Ghezelbash 2020b and the Dreischarf 2014 in vitro/in vivo references are tagged `secondary` with a `secondary__` group prefix. The Dreischarf 8-model ranges are tagged `fe_model_range`.
- **No animal specimens** are in this group.
- **Groups that pool across papers:**
  - L4-L5 ROM and NZ at 7.5 Nm: Heuer 2007a + Wilke 2025 (shared specimens flagged).
  - L2-L3 ROM at 7.5 Nm: Heuer 2008 + Wilke 2025.
  - L1-L2 ROM at 7.5 Nm: Sawa 2008 + Wilke 2025 (independent specimens).
  - L4-L5 absolute IDP at 10 Nm: Heuer 2007b + Popovich 2013. Note that Heuer's sensor is a single nucleus sensor, while Popovich reports the mean of 9 needle sensors.
- Most other groups hold one paper, because the protocols genuinely differ (preload, eccentric load, displacement control, paper-specific resection order).

## Facet papers (coordinator) – key points
- **Zhu 2008:** forces are at **L3-L4** (the catalog said L2-L3/L4-L5). Per-specimen tables are given for EAS and Tekscan. The minus signs were lost by pdftotext and were read from the rendered page. Column means were recomputed and match.
- **Sawa 2008:** Fig 3 was digitised (±1 N). Seven bars were checked against values in the text and agree within 0.2 N. The 400 N follower test is angle-controlled.
- **Schendel 1993:** this is eccentric compression, not pure moments, and only the right facet is measured. The test holds text slopes (N/Nm), abstract peak values and ROM. Figs 7-10 are per-specimen scatter and were not digitised.
- **Wilson 2006:** the specimens were **injured**: nucleotomy, plus capsule and posterior-ligament section. Fig 3 was digitised (±1 N). The method errors (overestimation of 18-56%) are recorded for widening tolerances.
- **Ivicsics 2014:** the measure is facet load share (% of the 700 N axial force), displacement-controlled. Fig 3 box plots were digitised (±0.2%) and the medians match the text. The sagittal force vectors come from text.
- **Popovich 2013:** right L4-L5 facet force (FlexiForce) and the 9-sensor mean IDP. Fig 5/6 were digitised and agree with the text values within 1 N / 1.6 kPa.
- **Ianuzzi 2004:** the protocol is displacement-controlled. Only Table 1 and the text extremes were extracted. The Fig 3-7 line plots (overlapping markers) were **not digitised**, including the in situ IVA-moment curves in Fig 5.

## D1 completion (coordinator)
- **Liebsch 2020 FB:** the four VBR/instrumentation steps were added: T1-T12 ROM (median, min-max), NZ and coupled ROM. Also added are the printed relative-change boxes and T4-T5 lateral bending across all 5 steps. Pixel scans reproduce the printed % changes within about 1-2%.
- **Widmer 2020:** the % moment contribution of each structure was taken from the printed pie labels, median (IQR), n = 32. Two text inconsistencies are kept as printed:
  - flexion ITL label 3% vs text "<2%";
  - flexion IVD 25% in the Results vs 20% in the Discussion.
- **Dreischarf 2014, Ghezelbash 2020b, Gornet 2011:** completed by D1 before it stopped. Spot checks: the Dreischarf in vitro medians reproduce the "2/1/5 deg" model differences stated in the text.

## Open questions
1. Schendel 1993: the torsion moments (text "10-40 Nm", Fig 9 axis up to 35 Nm) look implausibly large for an L1-L2 FSU with 1.3 deg of rotation. Possibly a unit problem in the paper.
2. Ianuzzi 2004: Table 1 gives a maximum lateral-bending IVA of 6.0 deg at L3-L4, while the Discussion gives 6.6 deg.
3. Ianuzzi 2004 Fig 5 and Schendel 1993 Figs 7-10 could be digitised by hand if moment-rotation curves from displacement-controlled tests are wanted.
4. Decimal and range tokens in group names both use `_`. A future schema version might use `p` for decimals.
