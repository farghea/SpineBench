# SpineBench site

Static site (plain HTML/CSS/JS, no build step) for the SpineBench validation data.
Data comes from `bench/tests/<category>/*.json` (format: `bench/SCHEMA.md`).

## Preview locally

```bash
python3 site/build_index.py --examples   # --examples adds the 6 placeholder tests in site/dev/examples
cd site && python3 -m http.server 8770   # open http://localhost:8770
```

Drop `--examples` to build from real tests only (this is what the deploy workflow does).

## Publish on GitHub Pages (3 commands)

From the SpineBench folder, with an empty GitHub repo already created:

```bash
git init -b main && git add bench site .github .gitignore && git commit -m "SpineBench site"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

Then, once, in the repo on GitHub: **Settings > Pages > Source: GitHub Actions**.
Every push to `main` that touches `bench/` or `site/` runs `.github/workflows/pages.yml`,
which runs `build_index.py` and deploys `site/` to `https://<user>.github.io/<repo>/`.

`.gitignore` keeps the source PDFs and the generated `site/data/` out of the repo.

## Files

| Path | What |
|---|---|
| `index.html` | page shell |
| `assets/app.js` | router (`#category/<id>`, `#test/<id>`, `#group/<id>`, `#browse`, `#groups`, `#about`), views, charts |
| `assets/style.css` | tokens (light/dark) and layout |
| `build_index.py` | writes `data/index.json`, `data/tests/*`, `data/groups/*`, `data/categories/*.csv`, `data/all.json`, `data/all.csv` |
| `dev/examples/` | 6 EXAMPLE tests with placeholder values (`"example": true`), for development only |

Optional: `bench/groups/<id>.json` with `{"id", "title", "description"}` gives a pooled group a readable title;
otherwise the title is derived from the `combine_group` id.

Test JSON extras the site understands beyond the schema: `quantity.x_name` / `quantity.x_unit` (curve x axis),
`data[].series` (separate curves or bar sets), and any other `data[]` key (shown as a table column).
Numeric `x` gives a line plot with an SD band; text `x` gives bars with SD whiskers; text `x` with three or more
numeric loads each (e.g. `"load": "2.5 Nm"`) gives one curve per `x`.
