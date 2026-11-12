# SpineBench data format (shared by every agent)

## Taxonomy (layer → category → subcategory)
**input** – what you must feed a model; never graded
- kinematics: lumbopelvic rhythm · thoracic/lumbar/pelvis shares · thoracic rotation & lateral bending · rib motion
- anthropometry: segment mass & COM · body dimensions
**property** – model anatomy/tissue checked before any task
- muscle_geometry: moment_arm (true moment arm about the joint) · centroid_distance (MRI/CT muscle-centroid to disc-centre distance; NOT the same as moment arm) · csa_anatomical · pcsa · fascicle_architecture (length, pennation, sarcomere) · line_of_action
- passive_tissue: ligament (stiffness, failure, slack) · annulus · nucleus · endplate · disc_whole (axial/shear/torsion) · costal_cartilage · costovertebral_joint · rib
- segment_stiffness: FSU 6-DOF stiffness matrix · preload effect
- trunk_passive_invivo: passive trunk moment–angle in vivo
**outcome** – model predictions graded against data
- msk_idp_lumbar · msk_idp_thoracic · msk_implant_loads · msk_emg_posture · msk_flexion_relaxation · msk_mvc_coupled · msk_successive_reduction
- fe_rom_lumbar_fsu · fe_rom_lumbar_multi · fe_rom_thoracic (± rib cage) · fe_idp_invitro · fe_compression_stiffness · fe_resection_lumbar · fe_resection_thoracic · fe_facet · fe_instrumented · fe_model_comparison

Keep near-identical quantities apart (moment arm vs centroid distance; anatomical CSA vs PCSA; ROM at peak moment vs neutral zone; IDP absolute vs relative).

## One test = one JSON file: bench/tests/<category>/<id>.json
```json
{
  "id": "fe_rom_lumbar_fsu.heuer2007a.L4L5_intact",
  "title": "L4–L5 intact ROM under pure moments",
  "layer": "outcome", "category": "fe_rom_lumbar_fsu", "subcategory": "intact",
  "region": "lumbar", "levels": ["L4-L5"], "condition": "intact",
  "quantity": {"name": "ROM", "definition": "rotation at peak moment, loading branch, 3rd cycle", "unit": "deg"},
  "source": {"short": "Heuer 2007a", "authors": "Heuer F, Schmidt H, Klezl Z, Claes L, Wilke HJ", "year": 2007,
             "journal": "J Biomech", "doi": "10.1016/...", "n": 8, "sample": "human cadaver L4-L5, 8 specimens",
             "age": "mean 49 (range ...)", "sex": "", "height_cm": null, "weight_kg": null},
  "protocol": {"summary": "pure moments 1-10 Nm, 1 deg/s, 3 cycles, no preload",
               "how_to_simulate": ["Fix L5 inferior endplate", "Apply pure moment to L4 ...", "Report rotation at 7.5 Nm, loading branch"],
               "subject_model": null, "notes": ""},
  "data": [{"x": "flexion", "load": "7.5 Nm", "mean": 5.6, "sd": 1.2, "min": null, "max": null, "median": null, "n": 8}],
  "extraction": {"from": "Table 2", "method": "table|text|digitised_figure", "uncertainty": "±0.2 deg (digitised)",
                 "checked": false, "check_notes": ""},
  "pass_rule": {"template": true, "rule": "|model-mean| <= 1 SD"},
  "combine_group": "lumbar_fsu_rom_flexion_7p5Nm",
  "tags": ["lumbar", "in vitro", "FSU"]
}
```
Rules: never invent numbers; every number has its table/figure; digitised values say so with uncertainty; `n` and `year` always filled (they are shown on the site). For in vivo MSK tests `protocol.subject_model` gives the subject to simulate (sex, age, height_cm, weight_kg, disc area if reported, and where these came from) and `how_to_simulate` gives posture, hand load, and which output to compare. Pooled studies: `combine_group` links tests measuring the same thing under the same condition.
