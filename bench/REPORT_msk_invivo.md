# REPORT: msk_invivo (msk_idp_lumbar, msk_idp_thoracic, msk_implant_loads, msk_flexion_relaxation)

79 tests, 74 groups, ~1,300 points (~15% digitised). Sato/Takahashi/Polga tests: checked = "via user's targets" (original PDFs not in donwload/).

## IDP (30 lumbar, 9 thoracic)
Every test: subject_model (sex, age, height, weight, disc area + source of each), how_to_simulate, idp_conversion (Ghezelbash 2016 Eq. 6; Nachemson F/(0.66A) as sensitivity alternative).
- **Wilke 2001** (16 tests): male, 45 y, 174 cm, **70 kg during IDP** (72 kg at anthropometry kept as weight_kg_anthropometry), disc 1800 mm² (MRI). Relative IDP (Rohlmann 2001 Ergonomics) 27 rows as % standing.
- **Sato 1999**: 8 per-subject rows (V05 Table 2, re-assembled from split cells), disc mean 1585 mm² (1340–1890); flexed-5° values digitised from Ghezelbash 2020 (mean 1.323, SD 0.222).
- **Takahashi 2006** (8 tasks), **Polga 2004** (8 tasks × mid/lower thoracic): from targets_msk.json; Takahashi re-digitised from Ghezelbash 2020, agrees within 0.012 MPa. Polga 73 kg / 178 cm confirmed in Bruno 2015 Table 3.
- Nachemson L4-L5/L3-L4 and Schultz 1982 (corrected early-transducer values, separate groups); Meir 2007 intraoperative (thoracic, own group).
Cross-study groups: standing relaxed L4-L5 (Wilke, Sato, Takahashi); trunk flexion 10°/30° (Wilke, Takahashi).

## Implant loads (27)
21 from a sub-agent, all re-verified (tables against source text; Dreischarf 2015 re-digitised within 8 N, Rohlmann 2014c within 3 N) + 6 from text. Absolute vs relative stated, reference activity named, patients per patient.

## Flexion-relaxation (13)
Gupta 2001, Descarreaux 2008, Olson 2006, Zwambag 2016/2020 (2020 partition = model output), Dolan 1994 (n=149), Toussaint 1995, Shin 2004. Electrode sites and on/off criteria in protocol notes. All EMG normalised.

## Discrepancies for the user
1. Wilke crate held close: results ~1.0 MPa (holding at chest); abstract 1.1 MPa is lifting close. Targets use 1.1. Stored 1.0, 1.1 in alt_values.
2. Takahashi disc area: V05 18.8/21.2/19.1 cm² (mean 1970 mm²) vs targets 1910 mm² (Fasser 2021). Sato weight range 60–94 (V05) vs 60–96 kg (targets).
3. Sato sex not printed in V05; Bruno 2015 lists 8 men.
4. WP4 fixation level T12–L2 (Rohlmann 2011) vs T11–L3 (Rohlmann 2014, Dreischarf 2016a).
5. Olson n for RA/EO swapped between table and text.
6. Dolan Table 1 OCR corrected from page image.

## Not extracted
Han 2012, Ignasiak 2016, Kippers & Parker 1985 (out of scope); per-patient figures in Rohlmann 2000/2011/2013/2014b, Dreischarf 2016a; original PDFs missing: Wilke 1999, Sato 1999, Takahashi 2006, Polga 2004, Schmid 2020.
