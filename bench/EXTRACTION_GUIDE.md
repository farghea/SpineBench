# Extraction guide (every extraction agent)
Read SCHEMA.md first. Inputs: catalog/catalog_all.json (where each paper's numbers are), PDFs in ../donwload/.
Your group's papers: catalog entries whose category is in your list (usable yes/partly). Skip usable=no.

1. Extract. `pdftotext -layout` for tables/text. For figure-only data: render the page (`pdftoppm -r 200 -f P -l P file.pdf out`), crop the plot, read it as an image, digitise carefully against the axis ticks; record method "digitised_figure" and an uncertainty (≈ half the smallest readable tick, or ±2% of axis range). Prefer tables/text over figures. Never invent or "estimate from memory".
2. One JSON file per test in tests/<category>/<id>.json (format in SCHEMA.md). A "test" = one quantity under one condition set (e.g. Heuer 2007a, L4-L5, intact ROM, all directions/moments in its data array). Use consistent units: deg, Nm, N, N/mm, Nm/deg, MPa, kPa, mm, mm2, %MVC, kg, cm.
3. Always fill source.n (concrete: "8 specimens", "19 subjects (9F,10M)") and source.year; age/sex/height/weight when reported.
4. protocol.how_to_simulate: 2–5 short imperative steps (boundary conditions, load magnitude/rate/preload, posture, hand load, which output and where it is measured). For in vivo MSK tests fill protocol.subject_model {sex, age, height_cm, weight_kg, disc_area_mm2, source of each}.
5. Same thing under same condition across studies → same combine_group string, named <category>__<quantity>__<level/site>__<condition>__<load> (e.g. fe_rom_lumbar_fsu__rom__L4-L5__intact__flexion_7.5Nm). Also write groups/<combine_group>.json: {"id","title","quantity","unit","condition","tests":[ids],"notes"} (append ids if it exists).
6. Shared samples (same specimens/subjects in two papers): add "shared_sample_with": [ids] so pooled views don't double count.
7. Keep near-identical quantities apart (moment arm vs centroid distance; anatomical CSA vs PCSA vs fibre-angle-corrected CSA; ROM vs neutral zone; absolute vs relative IDP; in vivo vs in vitro; human vs animal → animal tagged "animal", never pooled with human).
8. DOUBLE-CHECK: after writing each test, re-open the source table/figure and compare every number; set extraction.checked=true and note any correction in check_notes. Digitised values: re-digitise 2 points independently; if they differ by > the stated uncertainty, widen it.
9. Write REPORT_<group>.md: tests written, data points, figure-digitised share, papers skipped (why), uncertainties, open questions.
