# REPORT: muscle_geometry

1,087 tests, 4,440 points, 998 groups (64 multi-study). All from tables (1,075) or text (12); none digitised. Garbled text layers re-read from page renders. checked=true.
Group id: `muscle_geometry__<quantity>__<level>_<muscle>__<sex>_<posture>[_extra]__no_load`. Mid-vertebral and disc levels never share a group; literature-compiled data (Christophy) in `_compiled` groups.

## Quantity classes (never pooled across)
- **True moment arm:** Bogduk 1992 only (psoas about each segment's axis; erect/flexed/extended; n=10).
- **Estimated moment arm** (centroid + literature line of action): McGill 1993 T5, Anderson 2012 T4.
- **MRI/CT centroid distance:** Jorgensen 2001/2003/2005, Marras 2001, Kumar 1988, Chaffin 1990, Reid 1985, Santaguida 1995, Wood 1996, Seo 2003, Sasaki 2017, Gungor 2015, Meakin 2013, Hwang 2016.
- **Anatomical CSA** vs **fibre-corrected CSA** (papers' "PCSA": Marras 2001, McGill 1988/1993, Jorgensen 2003a, Hwang 2016) vs **true PCSA** (cadaver: Delp 2001, Ward 2009, Brown 2011, Rosatelli 2008, Zwambag 2014, Bayoglu 2017a/b).
Conventions: mm, mm², deg; AP + anterior (flipped where needed, noted); ML unsigned; `AP_unsigned` where sign unknowable.

## Shared samples
Jorgensen 2001 ↔ Marras 2001 ↔ Hwang 2016 (30) · Jorgensen 2003a ↔ 2003b (24) · McGill 1993 ↔ Santaguida 1995 (15 M, likely) · Allaire 2023 ↔ Anderson 2012 (Framingham) · Bayoglu 2017a ↔ 2017b (same cadaver).

## Partial / skipped
- **Allaire 2023:** means/SD and regression coefficients only in Supplementary Tables 1–2 (not downloaded); stored Table 3 (R², RMSE). Get supplement or simtk.org/projects/trunk_muscle_py.
- Figure-only, not digitised: Daggfeldt 2003 lever arms, Crawford 2016, Ward 2009 Fig 4, Anderson 2012 Fig 2.
- No group stats: Phillips 2008, Zwambag 2016, McGill 1996 (standing AP ~30% > supine), Macintosh 1986a.

## Misprints (noted per test)
Jorgensen 2001 erratum applied (regressions cm/cm); RLD female T8 AP SD "(10.2)" likely 1.0; male LES L4 operator inferred "−". Marras 2001 RRA male HTDWT slope sign; LQL female no intercept. Jorgensen 2005 8.6 vs 8.7. Sasaki 2017 decimals restored. Delp 2001 / Ward 2009 sarcomere length µm (labelled mm). Christophy EO 1006 vs Marras 1060.

## Open
- McGill 1993 vertebra-labelled columns mapped to disc below (L3 → L3-L4): confirm.
- "Erector spinae" with/without multifidus: Seo, Chaffin, Kumar kept as erector_spinae; OSU keyed erector_spinae_multifidus.
- Side/posture unstated: Wood 1996, Reid 1985, Meakin 2013 → `unspecified`.
- Some groups mix scanner-transverse and disc-parallel planes (noted in group).
