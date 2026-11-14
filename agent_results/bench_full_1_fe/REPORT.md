# SpineBench run bench_full_1_fe

Model versions: {'msk_params': 'b33a89c3566a', 'fe_params': '266e606f93ed', 'git': 'ec64f8a'}

| card | units | answered | passed | score | rejected | flagged | s |
|---|---|---|---|---|---|---|---|
| lumbar_rom | 16 | 11 | 2 | 0.12 | 0 | 0 | 29 |
| thoracic_rom | 23 | 7 | 0 | 0.00 | 0 | 0 | 6956 |
| lumbar_resection | 12 | 10 | 0 | 0.00 | 0 | 0 | 2251 |
| thoracic_resection | 38 | 8 | 1 | 0.03 | 0 | 0 | 2361 |
| idp_invitro | 29 | 16 | 4 | 0.14 | 0 | 0 | 126 |
| facet_forces | 19 | 6 | 1 | 0.05 | 0 | 0 | 5781 |

**Overall:** 8/634 units passed; mean card score 0.021 (unanswered units count as failed).

## Main reasons for unanswered units
- **lumbar_rom**: 5 x FEBio run failed: not run: specimen of 5 segments (> 4; owner: short specimens only) [rom_
- **thoracic_rom**: 15 x rib cage intact: the FE model has no ribs, sternum or costovertebral joints [rom_total/T1-; 1 x FEBio run failed: not run: specimen of 16 segments (> 4; owner: short specimens only) [rom
- **lumbar_resection**: 1 x nucleus removal (nucleotomy) needs the nucleus mesh changed: not expressible on the existi; 1 x output rom_pct: % of intact after nucleotomy / axial cases needs nucleus removal (new mesh
- **thoracic_resection**: 20 x rib cage (or rib stumps / rib heads) present in this state: the FE model has no ribs [rom_; 5 x rib cage (or rib stumps / rib heads) present in this state: the FE model has no ribs [rom/; 1 x nucleus removal (nucleotomy) needs the nucleus mesh changed: not expressible on the existi; 1 x % of intact needs the intact rib-cage specimen (the model has no rib cage) [rom_pct/left+r; 1 x FEBio run failed: AxisError(1, 1, None) [rom_range/flexion+extension, rom_range/left+right; 1 x FEBio run failed: not run: specimen of 11 segments (> 4; owner: short specimens only) [rom
- **idp_invitro**: 5 x FEBio run failed: AxisError(1, 1, None) [idp/T1-T12 FSUs]; 2 x FEBio run failed: not run: specimen of 11 segments (> 4; owner: short specimens only) [idp; 1 x 'clockwise' axial rotation: side depends on the (unstated) viewpoint [idp_change/L1-L5 FSU; 1 x rib cage intact: the FE model has no ribs [idp/T4-T5, idp/T8-T9, idp_load_slope/T4-T5, idp; 1 x eccentric load: eccentric / shear force cases are not mapped (only pure moments, preloads ; 1 x imposed posture (rotation-controlled) with fused levels: not mapped [idp/upright/L3-L4, id
- **facet_forces**: 8 x imposed rotation (rotation-controlled test): not mapped to the moment / compression cases ; 1 x pelvic obliquity (tilted sacrum): not mapped [facet_force/sacrum tilted 5 deg left (pelvic; 1 x 0 beyond the run's reach (status ok, t_final 0.999999) [facet_force/neutral (upright)/L1-L; 1 x eccentric compression at lever arms (Schendel 1993): not a pure moment run [facet_force/ex; 1 x condition 'intact, eccentric compression 50-300 n': eccentric / shear / creep / nucleotomy; 1 x eccentric compression: not mapped [facet_share/compression, 10 mm anterior/lumbar, facet_s
