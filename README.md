# SpineBench

Validation benchmark and data portal for spine musculoskeletal (MSK) and finite-element (FE) models.

- `bench/tests/<category>/<id>.json` — one experimental test per file (reference, sample size, year, protocol, how to simulate, data, extraction provenance). Format: `bench/SCHEMA.md`.
- `bench/groups/` — tests measuring the same quantity under the same condition, pooled across studies.
- `site/` — static website built from `bench/` (`python3 site/build_index.py`, then `cd site && python3 -m http.server 8770`).

Source PDFs are not included. Values are extracted from the published papers; cite the original studies.

Created by Farshid Ghezelbash (https://sites.google.com/view/farshidghezelbash/home).

Licence: research and education use only (CC BY-NC 4.0, see LICENSE). Commercial use is not allowed. For any other use, please contact the author.
