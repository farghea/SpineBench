# SpineBench run bench_full_1

Model versions: {'msk_params': 'b33a89c3566a', 'fe_params': '266e606f93ed', 'git': 'ee39834'}

| card | units | answered | passed | score | rejected | flagged | s |
|---|---|---|---|---|---|---|---|
| lumbar_idp_invivo | 36 | 28 | 16 | 0.44 | 0 | 0 | 57 |
| thoracic_idp_invivo | 32 | 32 | 22 | 0.69 | 0 | 0 | 37 |
| implant_loads_invivo | 30 | 13 | 0 | 0.00 | 0 | 0 | 22 |

**Overall:** 38/634 units passed; mean card score 0.071 (unanswered units count as failed).

## Main reasons for unanswered units
- **lumbar_idp_invivo**: 3 x sitting with an external support (backrest/armrest/hands): support not modelled; 2 x no study subject with a disc area; 1 x squat posture without a trunk angle; 1 x maximal sitting flexion without an angle; 1 x prone on elbows: arm support not modelled
- **thoracic_idp_invivo**: 
- **implant_loads_invivo**: 7 x dynamic or ground-supported activity: not a static trunk-only posture; 7 x fixator bending moment: the model's joints carry no bending moment (spherical joints); a f; 3 x sitting with an external support (backrest/armrest/hands): support not modelled
