/* SpineBench static site. No build step; data comes from data/index.json written by build_index.py. */
(function () {
  'use strict';

  // ---------- state & helpers ----------
  var S = { index: null, testById: {}, groupById: {}, catById: {}, layerById: {}, cache: {}, charts: [], view: null };
  var main = document.getElementById('main');

  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function toNum(v) {
    if (isNum(v)) return v;
    if (typeof v === 'string' && /^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/.test(v)) return parseFloat(v);
    return null;
  }
  function fmt(v) { var n = toNum(v); return n == null ? '' : String(+n.toPrecision(6)); }
  function decs(v) { var a = Math.abs(v); return a >= 100 ? 0 : a >= 10 ? 1 : a >= 0.1 ? 2 : 3; }
  function fmtC(v, ref) { // computed values; ref sets the decimals (so an SD matches its mean)
    if (v == null || !isFinite(v)) return '';
    return v.toFixed(decs(ref != null && isFinite(ref) ? ref : v));
  }
  function human(s) { return String(s == null ? '' : s).replace(/_/g, ' '); }
  function condLabel(c) {
    var m = { with_ribcage: 'with rib cage', without_ribcage: 'without rib cage', in_vivo: 'in vivo', in_vitro: 'in vitro' };
    return m[c] || human(c);
  }
  function methodLabel(m) {
    var k = String(m || '').toLowerCase();
    if (k.indexOf('digit') >= 0) return 'digitised figure';
    if (k === 'table') return 'table';
    if (k === 'text') return 'text';
    return human(m);
  }
  function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { var k = String(x); if (!seen[k]) { seen[k] = 1; out.push(x); } }); return out; }
  function groupBy(arr, keyFn) {
    var map = {}, order = [];
    arr.forEach(function (x) { var k = keyFn(x); if (!(k in map)) { map[k] = []; order.push(k); } map[k].push(x); });
    return order.map(function (k) { return { key: k, rows: map[k] }; });
  }
  function nOf(t) { return t.n == null || t.n === '' ? '' : t.n; }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function alpha(color, a) {
    var m = /^#([0-9a-f]{6})$/i.exec(color);
    if (!m) return color;
    var v = parseInt(m[1], 16);
    return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a + ')';
  }
  function palette() { var p = []; for (var i = 1; i <= 12; i++) p.push(cssVar('--s' + i)); return p; }
  function enc(s) { return encodeURIComponent(s); }
  function testHref(id) { return '#test/' + enc(id); }
  function groupHref(id) { return '#group/' + enc(id); }
  function catHref(id) { return '#category/' + enc(id); }
  function exTag(isEx) { return isEx ? ' <span class="tag ex" title="Placeholder values, not real data">EXAMPLE</span>' : ''; }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || '')) ? String(u) : null; }
  function doiLink(doi, isExample) {
    var d = String(doi || '').trim();
    if (!d) return '<span class="muted">not given</span>';
    var url = safeUrl(d) || (/^10\.\d{4,9}\//.test(d) ? 'https://doi.org/' + d.split('/').map(encodeURIComponent).join('/').replace(/%2F/g, '/') : null);
    if (isExample || !url) return '<span class="mono">' + esc(d) + '</span>';
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(d) + '</a>';
  }
  var ICON_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"/></svg>';
  function dlBtn(href, label, primary) {
    return '<a class="btn' + (primary ? ' primary' : '') + '" href="' + esc(href) + '" download>' + ICON_DL + esc(label) + '</a>';
  }
  function fetchJSON(url) {
    if (S.cache[url]) return Promise.resolve(S.cache[url]);
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText + ' for ' + url);
      return r.json();
    }).then(function (j) { S.cache[url] = j; return j; });
  }
  function studyStats(tests) {
    var by = {};
    tests.forEach(function (t) {
      var k = String(t.short).toLowerCase() + '|' + t.year;
      var n = toNum(t.n) || 0;
      by[k] = Math.max(by[k] || 0, n);
    });
    var keys = Object.keys(by);
    return { studies: keys.length, n: keys.reduce(function (s, k) { return s + by[k]; }, 0) };
  }
  function catLabel(id) { return (S.catById[id] && S.catById[id].label) || human(id); }
  function layerLabel(id) { return (S.layerById[id] && S.layerById[id].label) || human(id); }
  function setTitle(t) { document.title = t ? t + ' · SpineBench' : 'SpineBench'; }

  // ---------- statistics ----------
  function nNum(v) { // "26 males" -> 26
    var n = toNum(v);
    if (n != null) return n;
    var m = /^\s*(\d+)/.exec(String(v == null ? '' : v));
    return m ? parseInt(m[1], 10) : null;
  }
  function rowValue(r) {
    var m = toNum(r.mean), sd = toNum(r.sd), se = toNum(r.se), med = toNum(r.median), mn = toNum(r.min), mx = toNum(r.max), v = toNum(r.value);
    var range = mn != null && mx != null;
    if (m != null) {
      if (sd != null) return { y: m, sd: sd, lo: m - sd, hi: m + sd, stat: 'msd' };
      if (se != null) return { y: m, sd: null, se: se, lo: m - se, hi: m + se, stat: 'mse' };
      return { y: m, sd: null, lo: range ? mn : null, hi: range ? mx : null, stat: range ? 'mrange' : 'm' };
    }
    if (med != null) return { y: med, sd: null, lo: range ? mn : null, hi: range ? mx : null, stat: range ? 'medrange' : 'med' };
    if (v != null) return { y: v, sd: null, lo: null, hi: null, stat: 'v' };
    return null;
  }
  function describe(v, unit) {
    if (!v) return 'no value';
    var u = unit ? ' ' + unit : '';
    switch (v.stat) {
      case 'msd': return fmt(v.y) + ' ± ' + fmt(v.sd) + u;
      case 'mse': return fmt(v.y) + ' ± ' + fmt(v.se) + ' (SE)' + u;
      case 'mrange': return fmt(v.y) + u + ' [' + fmt(v.lo) + ' to ' + fmt(v.hi) + ']';
      case 'medrange': return 'median ' + fmt(v.y) + u + ' [' + fmt(v.lo) + ' to ' + fmt(v.hi) + ']';
      case 'med': return 'median ' + fmt(v.y) + u;
      case 'pooled': return fmtC(v.y) + (v.sd != null ? ' ± ' + fmtC(v.sd, v.y) : '') + u;
      default: return fmt(v.y) + u;
    }
  }
  function poolable(v) { return v && (v.stat === 'msd' || v.stat === 'm' || v.stat === 'mrange' || v.stat === 'mse' || v.stat === 'v'); }
  // n-weighted mean; SD combines within- and between-study variance when every study has an SD.
  function pool(items) {
    var v = items.filter(function (i) { return i.m != null && i.n > 0; });
    if (!v.length) return null;
    var N = 0, sm = 0;
    v.forEach(function (i) { N += i.n; sm += i.n * i.m; });
    var M = sm / N, sd = null, kind = '';
    if (v.every(function (i) { return i.sd != null; }) && N > 1) {
      var ss = 0;
      v.forEach(function (i) { ss += (i.n - 1) * i.sd * i.sd + i.n * (i.m - M) * (i.m - M); });
      sd = Math.sqrt(ss / (N - 1)); kind = 'pooled SD';
    } else if (v.length > 1) {
      var mu = v.reduce(function (s, i) { return s + i.m; }, 0) / v.length;
      sd = Math.sqrt(v.reduce(function (s, i) { return s + (i.m - mu) * (i.m - mu); }, 0) / (v.length - 1)); kind = 'SD of study means';
    }
    var ms = v.map(function (i) { return i.m; });
    return { y: M, sd: sd, lo: sd != null ? M - sd : null, hi: sd != null ? M + sd : null, N: N, k: v.length,
      min: Math.min.apply(null, ms), max: Math.max.apply(null, ms), kind: kind, stat: 'pooled' };
  }

  // ---------- chart model: decide bars vs curve, axis and series from the data ----------
  function parseLoad(s) {
    if (isNum(s)) return { v: s, u: '' };
    var m = /^\s*(-?\d+(?:\.\d+)?)\s*([^\d\s].*)?$/.exec(String(s == null ? '' : s));
    return m ? { v: parseFloat(m[1]), u: (m[2] || '').trim() } : null;
  }
  function str(v) { return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v); }
  // keys that hold values or annotations, never a dimension to split by
  var META = { x: 1, mean: 1, sd: 1, se: 1, min: 1, max: 1, median: 1, n: 1, value: 1, unit: 1, note: 1, notes: 1, source_where: 1,
    printed: 1, native: 1, per_specimen: 1, sign: 1, site: 1, row: 1, col: 1, dof_row: 1, dof_col: 1 };
  var DIM_ORDER = ['series', 'level', 'segment', 'sex', 'side', 'phase', 'component', 'load', 'muscle_code', 'muscle', 'dof', 'basis', 'posture'];
  // smallest set of keys (x first) that tells the rows apart
  function dimsFor(rows, base) {
    var cand = DIM_ORDER.slice();
    rows.forEach(function (r) { Object.keys(r).forEach(function (k) { if (!META[k] && cand.indexOf(k) < 0 && !/^(raw_|pct_)/.test(k)) cand.push(k); }); });
    cand = cand.filter(function (k) {
      return base.indexOf(k) < 0 && uniq(rows.map(function (r) { return str(r[k]); })).length > 1 &&
        rows.every(function (r) { return r[k] == null || typeof r[k] !== 'object'; });
    });
    var dims = base.slice();
    var count = function (ds) { return uniq(rows.map(function (r) { return ds.map(function (d) { return str(r[d]); }).join('\u0001'); })).length; };
    for (var i = 0; i < cand.length && count(dims) < rows.length; i++) {
      if (count(dims.concat([cand[i]])) > count(dims)) dims.push(cand[i]);
    }
    return dims;
  }
  function buildModel(test) {
    var rows = (test.data || []).filter(function (r) { return r && typeof r === 'object'; });
    var q = test.quantity || {};
    var qUnit = q.unit || '';
    var mixed = /mixed|see data/i.test(qUnit);
    var unit = mixed ? '' : qUnit;
    var yName = q.name || 'Value';
    var yTitle = yName + (unit ? ' (' + unit + ')' : '');
    var nDefault = nNum((test.source || {}).n);
    function pt(r, x) { var v = rowValue(r); if (!v) return null; v.x = x; v.row = r; v.n = toNum(r.n) != null ? toNum(r.n) : nDefault; return v; }
    var loadsNumeric = rows.length > 0 && rows.every(function (r) { return parseLoad(r.load); });
    var xNum = rows.length > 0 && rows.every(function (r) { return toNum(r.x) != null; });
    var sortX = function (a, b) { return a.x - b.x; };

    if (xNum && uniq(rows.map(function (r) { return toNum(r.x); })).length >= 2) {
      var cd = dimsFor(rows, ['x']).filter(function (d) { return d !== 'x'; });
      var key = function (r) { return cd.map(function (d) { return human(str(r[d])); }).join(' · '); };
      return { kind: 'curve', unit: unit, yTitle: yTitle,
        xTitle: q.x_name ? q.x_name + (q.x_unit ? ' (' + q.x_unit + ')' : '') : 'x',
        series: groupBy(rows, key).map(function (g) {
          return { key: g.key, label: g.key, points: g.rows.map(function (r) { return pt(r, toNum(r.x)); }).filter(Boolean).sort(sortX) };
        }) };
    }
    if (loadsNumeric && rows.length) {
      var byX = groupBy(rows, function (r) { return str(r.x); });
      var multi = byX.every(function (g) { return uniq(g.rows.map(function (r) { return parseLoad(r.load).v; })).length >= 3; });
      if (multi) {
        var lu = parseLoad(rows[0].load).u;
        return { kind: 'curve', unit: unit, yTitle: yTitle, xTitle: 'Load' + (lu ? ' (' + lu + ')' : ''),
          series: byX.map(function (g) {
            return { key: g.key, label: human(g.key), points: g.rows.map(function (r) { return pt(r, parseLoad(r.load).v); }).filter(Boolean).sort(sortX) };
          }) };
      }
    }
    // bars: the dimension with most distinct values is the axis, the rest form the series
    var dims = dimsFor(rows, ['x']);
    var varying = dims.filter(function (d) { return uniq(rows.map(function (r) { return str(r[d]); })).length > 1; });
    var axis = 'x';
    varying.forEach(function (d) {
      if (uniq(rows.map(function (r) { return str(r[d]); })).length > uniq(rows.map(function (r) { return str(r[axis]); })).length) axis = d;
    });
    if (!varying.length || varying.indexOf(axis) < 0) axis = varying[0] || 'x';
    var sdims = varying.filter(function (d) { return d !== axis; });
    var sKey = function (r) { return sdims.map(function (d) { return human(str(r[d])); }).join(' · '); };
    var labels = uniq(rows.map(function (r) { return str(r[axis]); }));
    var labelUnit = {}, labelText = {};
    labels.forEach(function (l) {
      var r = rows.filter(function (x) { return str(x[axis]) === l; })[0];
      labelUnit[l] = (r && r.unit) || unit;
      labelText[l] = human(l);
    });
    return { kind: 'bar', unit: unit, yName: yName, yTitle: yTitle, labels: labels, labelUnit: labelUnit, labelText: labelText,
      axis: axis, seriesDims: sdims,
      series: groupBy(rows, sKey).map(function (g) {
        return { key: g.key, label: g.key, values: labels.map(function (l) {
          var hit = g.rows.filter(function (r) { return str(r[axis]) === l; });
          for (var i = 0; i < hit.length; i++) { var p = pt(hit[i], l); if (p) return p; }
          return null;
        }) };
      }) };
  }
  // one bar chart per unit (never two units on one axis)
  function drawBars(container, labels, datasets, labelUnit, labelText, yName, aria) {
    container.innerHTML = '';
    var units = uniq(labels.map(function (l) { return labelUnit[l] || ''; }));
    var charts = [];
    units.forEach(function (u) {
      var idx = []; labels.forEach(function (l, i) { if ((labelUnit[l] || '') === u) idx.push(i); });
      var wrap = document.createElement('div');
      if (units.length > 1) { var h = document.createElement('p'); h.className = 'chart-unit'; h.textContent = u || 'no unit'; wrap.appendChild(h); }
      var box = document.createElement('div'); box.className = 'chart-box' + (idx.length > 12 ? ' tall' : '');
      wrap.appendChild(box); container.appendChild(wrap);
      var ds = datasets.map(function (d) { var o = {}; for (var k in d) o[k] = d[k]; o.values = idx.map(function (i) { return d.values[i]; }); return o; })
        .filter(function (d) { return d.values.some(Boolean); });
      charts.push(barChart(box, idx.map(function (i) { return labelText[labels[i]] || labels[i]; }), ds, yName + (u ? ' (' + u + ')' : ''), u, aria));
    });
    return charts;
  }

  // ---------- Chart.js rendering ----------
  var whiskers = {
    id: 'sbWhiskers',
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx, y = chart.scales.y, ink = cssVar('--ink');
      chart.data.datasets.forEach(function (ds, i) {
        if (!ds._vals || !chart.isDatasetVisible(i)) return;
        var meta = chart.getDatasetMeta(i);
        ctx.save();
        ctx.strokeStyle = alpha(ink, 0.7); ctx.lineWidth = 1.25;
        meta.data.forEach(function (el, j) {
          var v = ds._vals[j];
          if (!v || v.lo == null || v.hi == null || el.skip) return;
          var x = el.x, y1 = y.getPixelForValue(v.lo), y2 = y.getPixelForValue(v.hi);
          var cap = Math.max(2, Math.min(5, (el.width || 10) / 4));
          ctx.beginPath();
          ctx.moveTo(x, y1); ctx.lineTo(x, y2);
          ctx.moveTo(x - cap, y1); ctx.lineTo(x + cap, y1);
          ctx.moveTo(x - cap, y2); ctx.lineTo(x + cap, y2);
          ctx.stroke();
        });
        ctx.restore();
      });
    }
  };
  function chartBase() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    Chart.defaults.font.family = '"IBM Plex Sans", system-ui, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = cssVar('--muted');
    Chart.defaults.borderColor = cssVar('--grid');
    return {
      responsive: true, maintainAspectRatio: false, animation: reduce ? false : { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--surface'), titleColor: cssVar('--ink'), bodyColor: cssVar('--ink-2'),
          borderColor: cssVar('--line-2'), borderWidth: 1, padding: 10, boxPadding: 4, usePointStyle: true
        }
      }
    };
  }
  function noChart(box, msg) {
    box.innerHTML = '<div class="chart-msg">' + esc(msg) + '</div>';
  }
  function canvasIn(box, label) {
    box.innerHTML = '<canvas role="img" aria-label="' + esc(label) + '"></canvas>';
    return box.querySelector('canvas');
  }
  // datasets: [{key,label,color,values:[pt|null],pooled}]
  function barChart(box, labels, datasets, yTitle, unit, ariaLabel) {
    if (typeof Chart === 'undefined') return noChart(box, 'Chart library did not load. The table below has every value.'), null;
    var all = [];
    datasets.forEach(function (d) { d.values.forEach(function (v) { if (v) { all.push(v.y); if (v.lo != null) all.push(v.lo); if (v.hi != null) all.push(v.hi); } }); });
    if (!all.length) return noChart(box, 'No plottable values. See the table.'), null;
    var opts = chartBase();
    var hi = Math.max.apply(null, all), lo = Math.min.apply(null, all);
    opts.interaction = { mode: 'index', intersect: false };
    opts.scales = {
      x: { grid: { display: false }, ticks: { color: cssVar('--ink-2'), autoSkip: false, maxRotation: 40 } },
      y: { beginAtZero: true, suggestedMax: hi > 0 ? hi * 1.04 : 0, suggestedMin: lo < 0 ? lo * 1.04 : 0,
        title: { display: true, text: yTitle, color: cssVar('--ink-2') }, grid: { color: cssVar('--grid') }, border: { display: false } }
    };
    opts.plugins.tooltip.callbacks = {
      label: function (c) { var v = c.dataset._vals[c.dataIndex]; return v ? ' ' + c.dataset.label + ': ' + describe(v, unit) + (v.N ? ' (N=' + v.N + ')' : v.n ? ' (n=' + v.n + ')' : '') : null; }
    };
    opts.plugins.tooltip.filter = function (item) { return item.dataset._vals[item.dataIndex] != null; };
    var pooledInk = cssVar('--pooled');
    var chart = new Chart(canvasIn(box, ariaLabel), {
      type: 'bar',
      data: { labels: labels, datasets: datasets.map(function (d) {
        return { label: d.label, data: d.values.map(function (v) { return v ? v.y : null; }), _vals: d.values, _key: d.key,
          backgroundColor: d.pooled ? alpha(pooledInk, 0.18) : d.color, borderColor: d.pooled ? pooledInk : d.color,
          borderWidth: d.pooled ? 1.5 : 0, borderRadius: 3, borderSkipped: 'start',
          maxBarThickness: 46, categoryPercentage: 0.78, barPercentage: 0.92, pointStyle: 'rectRounded' };
      }) },
      options: opts, plugins: [whiskers]
    });
    S.charts.push(chart);
    return chart;
  }
  // lines: [{key,label,color,dash,points:[pt],pooled}]
  function curveChart(box, lines, xTitle, yTitle, unit, ariaLabel, bandAlpha) {
    bandAlpha = bandAlpha == null ? 0.14 : bandAlpha;
    if (typeof Chart === 'undefined') return noChart(box, 'Chart library did not load. The table below has every value.'), null;
    if (!lines.some(function (l) { return l.points.length; })) return noChart(box, 'No plottable values. See the table.'), null;
    var opts = chartBase();
    opts.interaction = { mode: 'nearest', axis: 'x', intersect: false };
    opts.scales = {
      x: { type: 'linear', title: { display: true, text: xTitle, color: cssVar('--ink-2') }, grid: { color: cssVar('--grid') }, border: { display: false } },
      y: { title: { display: true, text: yTitle, color: cssVar('--ink-2') }, grid: { color: cssVar('--grid') }, border: { display: false } }
    };
    opts.plugins.tooltip.filter = function (item) { return !item.dataset._band; };
    opts.plugins.tooltip.callbacks = {
      title: function (items) { return items.length ? xTitle + ' = ' + fmt(items[0].raw.x) : ''; },
      label: function (c) { var v = c.raw._v; return ' ' + c.dataset.label + ': ' + describe(v, unit) + (v.N ? ' (N=' + v.N + ')' : ''); }
    };
    var ds = [];
    lines.forEach(function (l) {
      var col = l.pooled ? cssVar('--pooled') : l.color;
      if (bandAlpha > 0 && !l.pooled && l.points.some(function (p) { return p.lo != null && p.hi != null; })) {
        ds.push({ label: l.label + ' +SD', _band: true, _key: l.key, data: l.points.map(function (p) { return { x: p.x, y: p.hi != null ? p.hi : p.y }; }),
          borderWidth: 0, pointRadius: 0, pointHitRadius: 0, fill: '+1', backgroundColor: alpha(col, bandAlpha), tension: 0 });
        ds.push({ label: l.label + ' -SD', _band: true, _key: l.key, data: l.points.map(function (p) { return { x: p.x, y: p.lo != null ? p.lo : p.y }; }),
          borderWidth: 0, pointRadius: 0, pointHitRadius: 0, fill: false, tension: 0 });
      }
      ds.push({ label: l.label, _key: l.key, data: l.points.map(function (p) { return { x: p.x, y: p.y, _v: p }; }),
        borderColor: col, backgroundColor: col, borderWidth: l.pooled ? 2.5 : 2, borderDash: l.dash || [], pointRadius: 3, pointHoverRadius: 5,
        pointStyle: 'circle', fill: false, tension: 0 });
    });
    var chart = new Chart(canvasIn(box, ariaLabel), { type: 'line', data: { datasets: ds }, options: opts });
    S.charts.push(chart);
    return chart;
  }
  function destroyCharts() { S.charts.forEach(function (c) { try { c.destroy(); } catch (e) { /* ignore */ } }); S.charts = []; }

  // HTML legend: chips toggle every dataset with the same _key (lines + their SD band).
  function legend(box, entries, onToggle) {
    if (!entries.length) { box.innerHTML = ''; return; }
    box.innerHTML = entries.map(function (e) {
      var sw = e.dash ? 'background:none;border:2px dashed ' + e.color : 'background:' + e.color;
      return '<button type="button" class="chip" aria-pressed="' + (e.hidden ? 'false' : 'true') + '" data-key="' + esc(e.key) + '">' +
        '<span class="sw" style="' + sw + '"></span>' + esc(e.label) + '</button>';
    }).join('');
    $$('.chip', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        onToggle(b.getAttribute('data-key'), on);
      });
    });
  }
  function toggleKey(charts, key, on) {
    [].concat(charts || []).forEach(function (chart) {
      if (!chart) return;
      chart.data.datasets.forEach(function (d, i) { if (String(d._key) === key) chart.setDatasetVisibility(i, on); });
      chart.update();
    });
  }

  // ---------- views ----------
  function crumbs(items) {
    return '<nav class="crumbs" aria-label="Breadcrumb">' + items.map(function (it, i) {
      var s = it[1] ? '<a href="' + esc(it[1]) + '">' + esc(it[0]) + '</a>' : '<span>' + esc(it[0]) + '</span>';
      return (i ? '<span aria-hidden="true">/</span>' : '') + s;
    }).join('') + '</nav>';
  }
  function kf(label, value, cls) {
    return '<div class="kf' + (cls ? ' ' + cls : '') + '"><small>' + esc(label) + '</small><b>' + value + '</b></div>';
  }

  function viewHome() {
    var I = S.index, c = I.counts;
    setTitle('');
    var html = '<div class="stack"><section class="hero">' +
      '<h1>Validation data for thoracic and lumbar spine models, each value traced to its source table or figure.</h1>' +
      '<div class="stats">' +
      stat(c.studies, 'studies') + stat(c.tests, 'tests') + stat(c.points, 'data points') + stat(c.subjects, 'subjects / specimens') +
      '</div><div class="dl-line"><span>Download everything:</span>' + dlBtn('data/all.csv', 'CSV') + dlBtn('data/all.json', 'JSON') +
      '<a href="#groups">' + c.groups + ' pooled comparisons</a></div></section>';
    I.taxonomy.forEach(function (layer) {
      var used = [], empty = [];
      layer.categories.forEach(function (cat) {
        var ts = I.tests.filter(function (t) { return t.category === cat.id; });
        (ts.length ? used : empty).push({ cat: cat, tests: ts });
      });
      html += '<section aria-labelledby="L-' + esc(layer.id) + '"><div class="layer-head"><h2 id="L-' + esc(layer.id) + '">' + esc(layer.label) + '</h2><p>' + esc(layer.blurb) + '</p></div>';
      if (used.length) {
        groupBy(used, function (u) { return u.cat.family || ''; }).forEach(function (fam) {
          if (fam.key) html += '<div class="fam">' + (fam.key === 'MSK' ? 'Musculoskeletal (MSK)' : fam.key === 'FE' ? 'Finite element (FE) and in vitro' : esc(fam.key)) + '</div>';
          html += '<div class="tiles">' + fam.rows.map(tile).join('') + '</div>';
        });
      } else {
        html += '<p class="muted small">No tests yet.</p>';
      }
      if (empty.length) {
        html += '<details class="planned"><summary>' + empty.length + ' more ' + (empty.length === 1 ? 'category' : 'categories') + ' without tests yet</summary><p>' +
          empty.map(function (e) { return esc(e.cat.label); }).join(' · ') + '</p></details>';
      }
      html += '</section>';
    });
    main.innerHTML = html + '</div>';

    function stat(v, l) { return '<div class="stat"><b class="num">' + esc(v) + '</b><span>' + esc(l) + '</span></div>'; }
    function tile(u) {
      var st = studyStats(u.tests), g = I.groups.filter(function (x) { return x.category === u.cat.id && x.tests.length > 1; }).length;
      var ex = u.tests.every(function (t) { return t.example; });
      return '<a class="tile" href="' + catHref(u.cat.id) + '"><b>' + esc(u.cat.label) + exTag(ex) + '</b>' +
        (u.cat.blurb ? '<span class="blurb">' + esc(u.cat.blurb) + '</span>' : '') +
        '<span class="meta">' + st.studies + ' ' + (st.studies === 1 ? 'study' : 'studies') + ' · ' + u.tests.length + ' tests · n ' + st.n +
        (g ? ' · ' + g + ' pooled' : '') + '</span></a>';
    }
  }

  // shared list (category page and browse page)
  var SORTS = {
    study: function (t) { return String(t.short).toLowerCase(); },
    year: function (t) { return toNum(t.year) || 0; },
    n: function (t) { return toNum(t.n) || 0; },
    levels: function (t) { return t.levels.join(','); },
    condition: function (t) { return t.condition; },
    quantity: function (t) { return (t.quantity + ' ' + t.subcategory).toLowerCase(); },
    category: function (t) { return catLabel(t.category); }
  };
  function hay(t) {
    return [t.short, t.title, t.id, t.year, t.levels.join(' '), condLabel(t.condition), t.quantity, t.unit, human(t.subcategory),
      t.region, catLabel(t.category), t.tags.join(' '), t.method].join(' ').toLowerCase();
  }
  function viewList(tests, opts, params) {
    var st = {
      q: params.get('q') || '', cond: params.get('cond') || '', level: params.get('level') || '', sub: params.get('sub') || '',
      region: params.get('region') || '', cat: params.get('cat') || '', sort: params.get('sort') || 'year', dir: params.get('dir') || 'desc'
    };
    var conds = uniq(tests.map(function (t) { return t.condition; }).filter(Boolean));
    var levels = uniq([].concat.apply([], tests.map(function (t) { return t.levels; }))).sort();
    var subs = uniq(tests.map(function (t) { return t.subcategory; }).filter(Boolean));
    var regions = uniq(tests.map(function (t) { return t.region; }).filter(Boolean));
    var cats = uniq(tests.map(function (t) { return t.category; }));
    function sel(name, label, values, cur, fmtFn) {
      if (values.length < 2) return '';
      return '<label class="field"><span>' + esc(label) + '</span><select data-f="' + name + '"><option value="">All</option>' +
        values.map(function (v) { return '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(fmtFn ? fmtFn(v) : v) + '</option>'; }).join('') + '</select></label>';
    }
    var html = '<div class="filters">' +
      '<label class="field grow"><span>Filter</span><input type="search" data-f="q" value="' + esc(st.q) + '" placeholder="Author, year, level, quantity"></label>' +
      (opts.showCat ? sel('cat', 'Category', cats, st.cat, catLabel) : '') +
      sel('level', 'Level', levels, st.level) + sel('sub', 'Subcategory', subs, st.sub, human) + sel('region', 'Region', regions, st.region) + '</div>' +
      (conds.length > 1 ? '<div class="chips" role="group" aria-label="Condition" style="margin-bottom:12px">' +
        ['' ].concat(conds).map(function (c) {
          return '<button type="button" class="chip" data-cond="' + esc(c) + '" aria-pressed="' + (st.cond === c) + '">' + esc(c ? condLabel(c) : 'All conditions') + '</button>';
        }).join('') + '</div>' : '') +
      '<div class="count-line"><span data-count></span>' + (opts.download || '') + '</div>' +
      '<div class="table-wrap"><table class="cards"><thead><tr>' +
      th('study', 'Study') + th('year', 'Year', 1) + th('n', 'n', 1) + (opts.showCat ? th('category', 'Category') : '') +
      th('levels', 'Levels') + th('condition', 'Condition') + th('quantity', 'Quantity') + '<th>Source</th><th>Pooled</th>' +
      '</tr></thead><tbody data-body></tbody></table></div>';
    opts.box.innerHTML = html;
    function th(k, l, right) { return '<th' + (right ? ' class="r"' : '') + '><button type="button" class="sort" data-sort="' + k + '">' + l + '</button></th>'; }

    function apply() {
      var toks = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      var rows = tests.filter(function (t) {
        if (st.cond && t.condition !== st.cond) return false;
        if (st.level && t.levels.indexOf(st.level) < 0) return false;
        if (st.sub && t.subcategory !== st.sub) return false;
        if (st.region && t.region !== st.region) return false;
        if (st.cat && t.category !== st.cat) return false;
        if (toks.length) { var h = hay(t); return toks.every(function (k) { return h.indexOf(k) >= 0; }); }
        return true;
      });
      var f = SORTS[st.sort] || SORTS.year, d = st.dir === 'asc' ? 1 : -1;
      rows.sort(function (a, b) { var x = f(a), y = f(b); return (x > y ? 1 : x < y ? -1 : 0) * d || String(a.short).localeCompare(String(b.short)); });
      $('[data-count]', opts.box).textContent = rows.length + ' of ' + tests.length + ' tests';
      $$('.sort', opts.box).forEach(function (b) {
        if (b.getAttribute('data-sort') === st.sort) b.setAttribute('aria-sort', st.dir === 'asc' ? 'ascending' : 'descending');
        else b.removeAttribute('aria-sort');
      });
      $('[data-body]', opts.box).innerHTML = rows.length ? rows.map(function (t) {
        var gl = t.groups.map(function (g) { var G = S.groupById[g]; return G && G.tests.length > 1 ? '<a href="' + groupHref(g) + '">' + G.tests.length + ' studies</a>' : ''; }).filter(Boolean).join('<br>');
        return '<tr><td class="c-cite"><a class="cite" href="' + testHref(t.id) + '">' + esc(t.short || t.id) + '</a>' + exTag(t.example) +
          '<span class="sub">' + esc(t.title) + '</span></td>' +
          '<td class="r" data-l="Year">' + esc(t.year) + '</td><td class="r n-cell" data-l="n">' + esc(nOf(t)) + '</td>' +
          (opts.showCat ? '<td data-l="Category"><a href="' + catHref(t.category) + '">' + esc(catLabel(t.category)) + '</a></td>' : '') +
          '<td data-l="Levels">' + esc(t.levels.join(', ')) + '</td><td data-l="Condition">' + esc(condLabel(t.condition)) + '</td>' +
          '<td data-l="Quantity">' + esc(t.quantity) + (t.unit ? ' <span class="muted">(' + esc(t.unit) + ')</span>' : '') +
          (t.subcategory && t.subcategory !== t.condition ? '<span class="sub">' + esc(human(t.subcategory)) + '</span>' : '') + '</td>' +
          '<td data-l="Source">' + esc(methodLabel(t.method)) + (t.checked ? ' <span class="tag ok">checked</span>' : '') + '</td>' +
          '<td data-l="Pooled">' + (gl || '<span class="muted">-</span>') + '</td></tr>';
      }).join('') : '<tr><td colspan="9"><div class="empty">No tests match these filters.</div></td></tr>';
      var p = new URLSearchParams();
      Object.keys(st).forEach(function (k) { if (st[k] && !(k === 'sort' && st[k] === 'year') && !(k === 'dir' && st[k] === 'desc')) p.set(k, st[k]); });
      var base = location.hash.split('?')[0] || '#';
      var ps = p.toString();
      try { history.replaceState(null, '', base + (ps ? '?' + ps : '')); } catch (e) { /* file:// */ }
    }
    var timer;
    $$('[data-f]', opts.box).forEach(function (el) {
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', function () {
        st[el.getAttribute('data-f')] = el.value;
        clearTimeout(timer); timer = setTimeout(apply, el.tagName === 'INPUT' ? 120 : 0);
      });
    });
    $$('[data-cond]', opts.box).forEach(function (b) {
      b.addEventListener('click', function () {
        st.cond = b.getAttribute('data-cond');
        $$('[data-cond]', opts.box).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        apply();
      });
    });
    $$('.sort', opts.box).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-sort');
        if (st.sort === k) st.dir = st.dir === 'asc' ? 'desc' : 'asc';
        else { st.sort = k; st.dir = (k === 'year' || k === 'n') ? 'desc' : 'asc'; }
        apply();
      });
    });
    apply();
  }

  function viewCategory(id, params) {
    var cat = S.catById[id];
    var tests = S.index.tests.filter(function (t) { return t.category === id; });
    if (!cat && !tests.length) return notFound('No category "' + id + '".');
    var label = catLabel(id), layer = cat ? cat.layer : (tests[0] && tests[0].layer);
    setTitle(label);
    var groups = S.index.groups.filter(function (g) { return g.category === id && g.tests.length > 1; });
    var st = studyStats(tests);
    main.innerHTML = crumbs([[layerLabel(layer), '#'], [label]]) +
      '<h1>' + esc(label) + '</h1>' + (cat && cat.blurb ? '<p class="lede">' + esc(cat.blurb) + '</p>' : '') +
      '<div class="keyfacts">' + kf('Studies', st.studies) + kf('Tests', tests.length) + kf('Subjects / specimens', st.n) + '</div>' +
      (groups.length ? '<section style="margin-top:22px"><h2 class="fam" style="margin-top:0">Pooled comparisons</h2><div class="chips">' +
        groups.map(function (g) { return '<a class="chip" href="' + groupHref(g.id) + '">' + esc(g.title) + ' <span class="muted">(' + g.tests.length + ')</span></a>'; }).join('') + '</div></section>' : '') +
      '<section style="margin-top:22px" data-list></section>';
    if (!tests.length) { $('[data-list]').innerHTML = '<div class="empty">No tests in this category yet.</div>'; return; }
    viewList(tests, { box: $('[data-list]'), download: '<span class="btns">' + dlBtn('data/categories/' + safeName(id) + '.csv', 'Category CSV') + '</span>' }, params);
  }
  function safeName(s) { return String(s).replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._]+|[._]+$/g, '') || 'unnamed'; }

  function viewBrowse(params) {
    setTitle('Browse');
    main.innerHTML = '<h1>All tests</h1><p class="lede">Filter, sort, open a row for the data.</p><section style="margin-top:18px" data-list></section>';
    if (!S.index.tests.length) { $('[data-list]').innerHTML = '<div class="empty">No tests yet.</div>'; return; }
    viewList(S.index.tests, { box: $('[data-list]'), showCat: true, download: '<span class="btns">' + dlBtn('data/all.csv', 'All CSV') + dlBtn('data/all.json', 'All JSON') + '</span>' }, params);
    var q = $('#q'); if (q && params.get('q') != null) q.value = params.get('q');
  }

  function viewGroups() {
    setTitle('Compare');
    var gs = S.index.groups.filter(function (g) { return g.tests.length > 1; }).sort(function (a, b) { return b.tests.length - a.tests.length || a.title.localeCompare(b.title); });
    var html = '<h1>Pooled comparisons</h1><p class="lede">Tests that measure the same quantity under the same condition, side by side, with an n-weighted pooled mean.</p>';
    if (!gs.length) { main.innerHTML = html + '<div class="empty" style="margin-top:18px">No group has two or more tests yet.</div>'; return; }
    groupBy(gs, function (g) { return g.category; }).forEach(function (c) {
      html += '<section style="margin-top:22px"><h2 class="fam">' + esc(catLabel(c.key)) + '</h2><div class="tiles group-list">' + c.rows.map(function (g) {
        return '<a class="tile" href="' + groupHref(g.id) + '"><b>' + esc(g.title) + exTag(g.example) + '</b>' +
          '<span class="blurb">' + esc(g.quantity) + (g.unit ? ' (' + esc(g.unit) + ')' : '') + (g.levels.length ? ' · ' + esc(g.levels.join(', ')) : '') + '</span>' +
          '<span class="meta"><span>' + g.tests.length + ' tests</span><span>n ' + g.n_total + '</span>' + (g.years.length ? '<span>' + g.years[0] + (g.years[1] !== g.years[0] ? '-' + g.years[1] : '') + '</span>' : '') + '</span></a>';
      }).join('') + '</div></section>';
    });
    main.innerHTML = html;
  }

  function viewTest(id) {
    var entry = S.testById[id];
    if (!entry) return notFound('No test with id "' + id + '".');
    main.innerHTML = '<p class="loading">Loading ' + esc(id) + '</p>';
    return fetchJSON('data/tests/' + entry.file + '.json').then(function (t) { renderTest(t, entry); });
  }
  function renderTest(t, entry) {
    var src = t.source || {}, q = t.quantity || {}, pr = t.protocol || {}, ex = t.extraction || {}, pass = t.pass_rule || {};
    var isEx = !!t.example;
    setTitle((src.short || '') + ' · ' + (t.title || t.id));
    var groups = entry.groups.map(function (g) { return S.groupById[g]; }).filter(function (g) { return g && g.tests.length > 1; });
    var file = 'data/tests/' + entry.file;
    var html = crumbs([[layerLabel(t.layer), '#'], [catLabel(t.category), catHref(t.category)], [condLabel(t.condition) || 'test']]) +
      '<div class="title-row"><h1 tabindex="-1">' + esc(t.title || t.id) + exTag(isEx) + '</h1>' +
      '<div class="btns">' + dlBtn(file + '.json', 'JSON', true) + dlBtn(file + '.csv', 'CSV') + '</div></div>' +
      '<div class="keyfacts">' + kf('Study', esc(src.short || '?'), 'big cite') + kf('n', esc(nNum(src.n) == null ? (src.n || '?') : nNum(src.n)), 'big') + kf('Year', esc(src.year || '?'), 'big') +
      (t.levels && t.levels.length ? kf('Levels', esc([].concat(t.levels).join(', '))) : '') +
      (t.condition ? kf('Condition', esc(condLabel(t.condition))) : '') + (t.region ? kf('Region', esc(t.region)) : '') + '</div>' +
      (src.n != null && toNum(src.n) == null ? '<p class="qty muted">n: ' + esc(src.n) + '</p>' : '') +
      '<p class="qty"><b>' + esc(q.name || '') + '</b>' + (q.unit ? ' (' + esc(q.unit) + ')' : '') + (q.definition ? ': ' + esc(q.definition) : '') + '</p>' +
      (isEx ? '<p class="notice" style="margin-top:14px">EXAMPLE test with placeholder values for site development. Not real data; do not use.</p>' : '') +
      (groups.length ? '<div class="chips" style="margin-top:14px">' + groups.map(function (g) {
        return '<a class="chip" href="' + groupHref(g.id) + '">Compare with ' + (g.tests.length - 1) + ' other ' + (g.tests.length === 2 ? 'study' : 'studies') + ': ' + esc(g.title) + '</a>';
      }).join('') + '</div>' : '') +
      '<div class="grid2" style="margin-top:22px"><div class="col">' +
      '<section class="panel" aria-label="Chart"><div class="charts" data-chart></div><div class="legend" data-legend></div><p class="chart-cap" data-cap></p></section>' +
      '<section class="panel"><div class="panel-head"><h2>Data</h2><span class="muted small">' + (t.data || []).length + ' rows</span></div>' + dataTable(t) + '</section>' +
      '</div><div class="col">' + simulatePanel(t, pr, pass) + sourcePanel(t, src, ex) + '</div></div>';
    main.innerHTML = html;
    drawTestChart(t);
    var more = $('[data-more]');
    if (more) more.addEventListener('click', function () {
      $$('tr.more', main).forEach(function (r) { r.hidden = false; });
      more.parentNode.removeChild(more);
    });
    var cp = $('[data-copy]');
    if (cp) cp.addEventListener('click', function () { copyText($('.cite-box').textContent, cp); });
  }
  function capText(stats, kind) {
    var c = [];
    if (stats.msd) c.push(kind === 'bar' ? 'Bars: mean, whiskers: ±1 SD' : 'Lines: mean, bands: ±1 SD');
    if (stats.mse) c.push('±1 SE where no SD is given');
    if (stats.mrange) c.push('mean with min to max');
    if (stats.medrange || stats.med) c.push('median' + (stats.medrange ? ' with min to max' : '') + ' where no mean is given');
    return c.join('; ') + (c.length ? '.' : '');
  }
  function statsOf(m) {
    var st = {};
    m.series.forEach(function (s) { (s.values || s.points).forEach(function (v) { if (v) st[v.stat] = 1; }); });
    return st;
  }
  function drawTestChart(t) {
    var m = buildModel(t), box = $('[data-chart]'), lg = $('[data-legend]'), pal = palette();
    $('[data-cap]').textContent = capText(statsOf(m), m.kind);
    var aria = (t.title || '') + ' chart';
    var charts;
    if (m.kind === 'bar') {
      var multi = m.series.length > 1;
      var ds = m.series.map(function (s, i) { return { key: s.key, label: multi ? s.label : ((t.source || {}).short || 'value'), color: pal[i % 12], values: s.values }; });
      charts = drawBars(box, m.labels, ds, m.labelUnit, m.labelText, m.yName, aria);
      if (multi) legend(lg, ds.map(function (d) { return { key: d.key, label: d.label, color: d.color }; }), function (k, on) { toggleKey(charts, k, on); });
    } else {
      var lines = m.series.map(function (s, i) { return { key: s.key, label: s.label || ((t.source || {}).short || 'value'), color: pal[i % 12], points: s.points }; });
      box.innerHTML = '<div class="chart-box"></div>';
      charts = [curveChart(box.firstChild, lines, m.xTitle, m.yTitle, m.unit, aria)];
      if (lines.length > 1) legend(lg, lines.map(function (l) { return { key: l.key, label: l.label, color: l.color }; }), function (k, on) { toggleKey(charts, k, on); });
    }
    // nothing plottable (e.g. regression coefficients): the table says it all
    if (typeof Chart !== 'undefined' && !box.querySelector('canvas')) box.parentNode.hidden = true;
  }
  var STD = ['x', 'series', 'load', 'mean', 'sd', 'median', 'min', 'max', 'n'];
  function dataTable(t) {
    var rows = (t.data || []).filter(function (r) { return r && typeof r === 'object'; });
    if (!rows.length) return '<div class="empty">No data rows.</div>';
    var q = t.quantity || {}, u = q.unit ? ' (' + q.unit + ')' : '';
    var has = function (k) { return rows.some(function (r) { return r[k] != null && r[k] !== ''; }); };
    var allExtra = uniq([].concat.apply([], rows.map(function (r) { return Object.keys(r); }))).filter(function (k) { return STD.indexOf(k) < 0 && has(k); });
    // keep the table short: nested objects and long free-text annotations stay in the JSON/CSV download
    var bulky = function (k) { return rows.some(function (r) { var v = r[k]; return v != null && (typeof v === 'object' || String(v).length > 40); }); };
    var extra = allExtra.filter(function (k) { return !bulky(k); });
    var hiddenCols = allExtra.filter(bulky);
    var cols = [];
    if (has('x')) cols.push(['x', q.x_name ? q.x_name + (q.x_unit ? ' (' + q.x_unit + ')' : '') : 'Case', 0]);
    if (has('series')) cols.push(['series', 'Series', 0]);
    if (has('load')) cols.push(['load', 'Load', 0]);
    [['mean', 'Mean' + u], ['sd', 'SD'], ['median', 'Median' + u], ['min', 'Min'], ['max', 'Max'], ['n', 'n']].forEach(function (c) { if (has(c[0])) cols.push([c[0], c[1], 1]); });
    extra.forEach(function (k) { cols.push([k, human(k), rows.every(function (r) { return r[k] == null || toNum(r[k]) != null; }) ? 1 : 0]); });
    return '<div class="table-wrap"><table><thead><tr>' + cols.map(function (c) { return '<th' + (c[2] ? ' class="r"' : '') + '>' + esc(c[1]) + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r, ri) {
        return '<tr' + (ri >= 15 ? ' class="more" hidden' : '') + '>' + cols.map(function (c) {
          var v = r[c[0]];
          var s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : c[2] && toNum(v) != null ? fmt(v) : String(v);
          return '<td' + (c[2] ? ' class="r"' : '') + '>' + esc(s) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      (rows.length > 15 ? '<div class="btns" style="margin-top:10px"><button type="button" class="btn" data-more>Show all ' + rows.length + ' rows</button></div>' : '') +
      (hiddenCols.length ? '<p class="muted" style="margin-top:8px;font-size:.85em">Notes per row (' + esc(hiddenCols.map(human).join(', ')) + ') are in the JSON download.</p>' : '');
  }
  var SUBJ = { sex: ['Sex', ''], age: ['Age', 'y'], age_years: ['Age', 'y'], height_cm: ['Height', 'cm'], weight_kg: ['Weight', 'kg'], mass_kg: ['Mass', 'kg'],
    bmi: ['BMI', ''], disc_area_mm2: ['Disc area', 'mm²'], disc_area_cm2: ['Disc area', 'cm²'] };
  function simulatePanel(t, pr, pass) {
    var steps = pr.how_to_simulate, sm = pr.subject_model;
    var html = '<section class="panel"><h2>How to simulate</h2>';
    if (sm && typeof sm === 'object') {
      var cells = [], rest = [];
      Object.keys(sm).forEach(function (k) {
        var v = sm[k]; if (v == null || v === '') return;
        if (SUBJ[k]) cells.push('<div><small>' + esc(SUBJ[k][0]) + '</small><b>' + esc(typeof v === 'object' ? JSON.stringify(v) : v) + (SUBJ[k][1] && toNum(v) != null ? ' ' + esc(SUBJ[k][1]) : '') + '</b></div>');
        else rest.push('<dt>' + esc(human(k)) + '</dt><dd>' + esc(typeof v === 'object' ? JSON.stringify(v) : v) + '</dd>');
      });
      html += '<h3 style="margin-bottom:8px">Subject</h3>' + (cells.length ? '<div class="subject">' + cells.join('') + '</div>' : '') +
        (rest.length ? '<details class="fold"><summary>Where these values come from</summary><dl class="kv">' + rest.join('') + '</dl></details>' : '');
    } else if (typeof sm === 'string' && sm) {
      html += '<p style="margin-bottom:12px"><b>Subject:</b> ' + esc(sm) + '</p>';
    }
    if (pr.summary) html += '<p style="margin-bottom:10px"><span class="muted">Protocol:</span> ' + esc(pr.summary) + '</p>';
    if (Array.isArray(steps) && steps.length) html += '<ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    else if (typeof steps === 'string' && steps) html += '<p>' + esc(steps) + '</p>';
    else if (!pr.summary) html += '<p class="muted">No protocol given.</p>';
    if (pass && pass.rule) html += '<div class="rule"><b>Pass rule' + (pass.template ? ' (proposed)' : '') + ':</b> ' + esc(pass.rule) + '</div>';
    if (pr.notes) html += '<details class="fold"><summary>Protocol notes</summary><p class="note">' + esc(pr.notes) + '</p></details>';
    return html + '</section>';
  }
  function citation(t) {
    var s = t.source || {};
    var parts = [(s.authors || s.short || '') + (s.year ? ' (' + s.year + ')' : '')];
    if (s.title) parts.push(s.title);
    if (s.journal) parts.push(s.journal);
    var c = parts.filter(Boolean).join('. ') + '.';
    if (s.doi) c += ' ' + (safeUrl(s.doi) || 'https://doi.org/' + s.doi);
    return c;
  }
  function sourcePanel(t, s, ex) {
    var row = function (k, v) { return v == null || v === '' ? '' : '<dt>' + esc(k) + '</dt><dd>' + v + '</dd>'; };
    var subj = [s.sex, s.height_cm != null ? s.height_cm + ' cm' : '', s.weight_kg != null ? s.weight_kg + ' kg' : ''].filter(Boolean).join(', ');
    var chk = ex.checked ? '<span class="tag ok">checked against source</span>' : '<span class="tag">not yet checked</span>';
    return '<section class="panel"><h2>Source</h2><dl class="kv">' +
      row('Study', '<b>' + esc(s.short) + '</b>') + row('Authors', esc(s.authors)) + row('Journal', esc([s.journal, s.year].filter(Boolean).join(', '))) +
      row('DOI', doiLink(s.doi, t.example)) + row('Sample', esc(s.sample)) + row('n', esc(s.n)) + row('Age', esc(s.age)) + row('Subjects', esc(subj)) +
      '</dl><div class="cite-box" style="margin-top:12px">' + esc(citation(t)) + '</div><div class="btns" style="margin-top:8px"><button type="button" class="btn" data-copy>Copy reference</button></div></section>' +
      '<section class="panel"><h2>Extraction</h2><dl class="kv">' +
      row('From', esc(ex.from) || '<span class="muted">not given</span>') + row('Method', esc(methodLabel(ex.method))) +
      row('Uncertainty', esc(ex.uncertainty)) + row('Status', chk) + (ex.check_notes ? row('Notes', '<details class="fold"><summary>Check notes</summary>' + esc(ex.check_notes) + '</details>') : '') + row('Test id', '<span class="mono">' + esc(t.id) + '</span>') +
      '</dl></section>';
  }
  function copyText(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ } document.body.removeChild(ta);
    }
  }

  // ---------- group view ----------
  function viewGroup(id) {
    var G = S.groupById[id];
    if (!G) return notFound('No pooled group "' + id + '".');
    main.innerHTML = '<p class="loading">Loading ' + esc(G.title) + '</p>';
    return fetchJSON('data/groups/' + G.file + '.json').then(function (g) { renderGroup(G, g.tests || []); });
  }
  function studyN(t) { var s = t.source || {}; var n = nNum(s.n); return n == null ? '?' : n; }
  // "Zhu 2008 (n=10)", plus the id words that tell two tests of the same study apart
  function studyLabels(tests) {
    var shorts = tests.map(function (t) { return (t.source || {}).short || t.id; });
    return tests.map(function (t, i) {
      var same = tests.filter(function (u, j) { return shorts[j] === shorts[i]; });
      var extra = '';
      if (same.length > 1) {
        var toks = function (u) { return String(u.id).split('.').pop().split(/[_.]+/); };
        var others = same.filter(function (u) { return u !== t; }).map(toks);
        extra = toks(t).filter(function (w) { return others.every(function (o) { return o.indexOf(w) < 0; }); }).join(' ');
      }
      return shorts[i] + (extra ? ' · ' + extra : '') + ' (n=' + studyN(t) + ')';
    });
  }
  function renderGroup(G, tests) {
    setTitle(G.title);
    var pal = palette();
    var slabels = studyLabels(tests);
    // individual-subject / per-specimen rows stay on the test page; the comparison uses group-level rows
    var PER = /\b(subject|participant|specimen|donor|patient)\s*(no\.?\s*)?#?\d+\b|^(s|p|wp|sp)\d+$/i;
    var forGroup = function (t) {
      var rows = (t.data || []).filter(function (r) { return r && typeof r === 'object'; });
      var keep = rows.filter(function (r) { return !PER.test(str(r.x)) && !r.per_subject && !r.per_specimen; });
      if (!keep.length || keep.length === rows.length) return t;
      var c = {}; Object.keys(t).forEach(function (k) { c[k] = t[k]; }); c.data = keep; return c;
    };
    var studies = tests.map(function (t, i) { return { t: t, key: t.id, label: slabels[i], color: pal[i % 12], model: buildModel(forGroup(t)) }; });
    var shortsAll = tests.map(function (t) { return (t.source || {}).short; });
    var dupStudy = shortsAll.length !== uniq(shortsAll).length;
    var kind = studies.length ? studies[0].model.kind : 'bar';
    var plotted = studies.filter(function (s) { return s.model.kind === kind; });
    var skipped = studies.filter(function (s) { return s.model.kind !== kind; });
    var isEx = tests.every(function (t) { return t.example; });
    var defs = uniq(tests.map(function (t) { return (t.quantity || {}).definition || ''; }).filter(Boolean));
    var conds = uniq(tests.map(function (t) { return condLabel(t.condition); }).filter(Boolean));
    var state = { hidden: {}, hiddenLabels: {}, hiddenSeries: {} };
    var file = 'data/groups/' + G.file;
    var years = G.years.length ? G.years[0] + (G.years[1] !== G.years[0] ? '-' + G.years[1] : '') : '?';

    var labels = [], labelUnit = {}, labelText = {};
    // every study gives one value for the group's single condition -> pool them on one bar
    var oneEach = kind === 'bar' && plotted.length > 1 && plotted.every(function (s) {
      return s.model.labels.length === 1 && s.model.series.length === 1; });
    if (oneEach) {
      var common = conds[0] || G.quantity || 'value';
      plotted.forEach(function (s) {
        var l0 = s.model.labels[0];
        s.model.labelText = {}; s.model.labelUnit = (function (o) { var u = {}; u[common] = o[l0]; return u; })(s.model.labelUnit);
        s.model.labelText[common] = common; s.model.labels = [common];
        s.model.series[0].key = ''; s.model.series[0].label = '';
      });
    }
    if (kind === 'bar') {
      plotted.forEach(function (s) {
        s.vals = {};
        s.model.series.forEach(function (ser) {
          s.model.labels.forEach(function (l, j) {
            var k = ser.key ? l + ' · ' + ser.key : l;
            if (labels.indexOf(k) < 0) {
              labels.push(k);
              labelUnit[k] = s.model.labelUnit[l];
              labelText[k] = s.model.labelText[l] + (ser.key ? ' · ' + ser.key : '');
            }
            if (ser.values[j] && !s.vals[k]) s.vals[k] = ser.values[j];
          });
        });
      });
    }
    var seriesKeys = kind === 'curve' ? uniq([].concat.apply([], plotted.map(function (s) { return s.model.series.map(function (x) { return x.key; }); }))) : [];
    var DASH = [[], [6, 4], [2, 3], [10, 3, 2, 3]];

    main.innerHTML = crumbs([['Compare', '#groups'], [catLabel(G.category), catHref(G.category)]]) +
      '<div class="title-row"><h1 tabindex="-1">' + esc(G.title) + exTag(isEx) + '</h1><div class="btns">' + dlBtn(file + '.csv', 'CSV', true) + dlBtn(file + '.json', 'JSON') + '</div></div>' +
      '<div class="keyfacts">' + kf('Studies', G.studies, 'big') + kf('Total n', G.n_total, 'big') + kf('Years', esc(years), 'big') +
      kf('Quantity', esc(G.quantity) + (G.unit ? ' (' + esc(G.unit) + ')' : '')) + (G.levels.length ? kf('Levels', esc(G.levels.join(', '))) : '') +
      (conds.length ? kf('Condition', esc(conds.join(', '))) : '') + '</div>' +
      (G.description ? '<p class="lede" style="margin-top:12px">' + esc(G.description) + '</p>' : '') +
      (isEx ? '<p class="notice" style="margin-top:14px">EXAMPLE group built from placeholder tests. Not real data.</p>' : '') +
      (kind === 'bar' && labels.length > 1 ? '<div class="xchips" data-xchips></div>' : '') +
      (kind === 'curve' && seriesKeys.length > 1 ? '<div class="chips" role="group" aria-label="Show" data-schips style="margin-top:18px"></div>' : '') +
      '<section class="panel" style="margin-top:14px" aria-label="Pooled chart"><div class="charts" data-chart></div>' +
      '<div class="legend" data-legend></div><p class="chart-cap">' + (kind === 'bar' ? 'Bars: mean, whiskers: ±1 SD (min to max for median-only rows). Outlined bar: pooled.' : 'Lines: mean, bands: ±1 SD. Thick neutral line: pooled.') + '</p>' + (seriesKeys.length > 1 ? '<p class="note">' + seriesKeys.map(function (k, i) { return (i === 0 ? 'solid' : ['dashed', 'dotted', 'dash-dot'][i - 1] || 'line ' + (i + 1)) + ': ' + esc(k || 'value'); }).join(' · ') + '</p>' : '') + '</section>' +
      '<section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Studies</h2><span class="muted small">Pooled over the studies shown; weighted by n.</span></div><div data-table></div>' +
      '<p class="note">Pooled mean = Σ n·mean / Σ n. Pooled SD combines within-study SDs and between-study spread: √[(Σ(n−1)SD² + Σ n(mean − pooled)²) / (N − 1)]; if a study lacks an SD, the SD of study means is shown. Median-only rows are not pooled.</p>' +
      (dupStudy ? '<p class="notice" style="margin-top:10px">Some tests here come from the same study. If they share specimens, the pooled N counts them more than once.</p>' : '') +
      (defs.length > 1 ? '<p class="note"><b>Definitions differ between studies:</b></p><ul class="defs">' + defs.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : (defs.length ? '<p class="note">Definition: ' + esc(defs[0]) + '</p>' : '')) +
      (skipped.length ? '<p class="note">Not plotted (different data shape): ' + skipped.map(function (s) { return '<a href="' + testHref(s.key) + '">' + esc(s.label) + '</a>'; }).join(', ') + '</p>' : '') +
      '</section>';

    var xchips = $('[data-xchips]');
    var parts = {};
    labels.forEach(function (l) { parts[l] = String(labelText[l] || l).split(' · '); });
    var nPos = Math.max.apply(null, labels.map(function (l) { return parts[l].length; }).concat([1]));
    var hiddenPart = []; for (var pi = 0; pi < nPos; pi++) hiddenPart.push({});
    function labelOn(l) { return parts[l].every(function (v, i) { return !hiddenPart[i][v]; }); }
    if (xchips) {
      var rowsHtml = [];
      for (var pos = 0; pos < nPos; pos++) {
        var vals = uniq(labels.map(function (l) { return parts[l][pos]; }).filter(function (v) { return v != null; }));
        if (vals.length < 2) continue;
        rowsHtml.push('<div class="chips" role="group" aria-label="Show">' + vals.map(function (v) {
          return '<button type="button" class="chip" aria-pressed="true" data-pos="' + pos + '" data-v="' + esc(v) + '">' + esc(v) + '</button>';
        }).join('') + '</div>');
      }
      xchips.innerHTML = rowsHtml.join('');
      $$('[data-v]', xchips).forEach(function (b) {
        b.addEventListener('click', function () {
          var pos = +b.getAttribute('data-pos'), v = b.getAttribute('data-v'), on = b.getAttribute('aria-pressed') !== 'true';
          hiddenPart[pos][v] = !on;
          if (!labels.some(labelOn)) { hiddenPart[pos][v] = false; return; } // keep at least one case
          b.setAttribute('aria-pressed', String(on));
          labels.forEach(function (l) { state.hiddenLabels[l] = !labelOn(l); });
          draw(false);
        });
      });
    }
    var lgEntries = plotted.map(function (s) { return { key: s.key, label: s.label, color: s.color }; });
    if (plotted.length > 1) lgEntries.push({ key: '__pooled', label: 'Pooled, n-weighted', color: cssVar('--pooled'), dash: kind === 'bar' });
    if (kind === 'curve') lgEntries.push({ key: '__bands', label: 'SD bands', color: alpha(cssVar('--ink-2'), 0.3) });
    legend($('[data-legend]'), lgEntries, function (k, on) { state.hidden[k] = !on; draw(false); });
    var schips = $('[data-schips]');
    if (schips) {
      schips.innerHTML = '<span class="muted small" style="align-self:center;margin-right:4px">Show</span>' + seriesKeys.map(function (k) {
        return '<button type="button" class="chip" aria-pressed="true" data-s="' + esc(k) + '">' + esc(k || 'value') + '</button>';
      }).join('');
      $$('[data-s]', schips).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-s'), on = b.getAttribute('aria-pressed') !== 'true';
          if (!on && seriesKeys.filter(function (x) { return !state.hiddenSeries[x]; }).length <= 1) return;
          b.setAttribute('aria-pressed', String(on));
          state.hiddenSeries[k] = !on; draw(false);
        });
      });
    }
    draw(true);

    function visible() { return plotted.filter(function (s) { return !state.hidden[s.key]; }); }
    function vis2() { return visible().length > 1; }
    function showPooled() { return vis2() && !state.hidden.__pooled; }
    function draw(first) {
      destroyCharts();
      var box = $('[data-chart]'), vis = visible();
      var ink = cssVar('--pooled');
      if (kind === 'bar') {
        var shown = labels.filter(function (l) { return !state.hiddenLabels[l]; });
        var pooled = shown.map(function (l) {
          return pool(vis.map(function (s) { var v = s.vals[l]; return poolable(v) ? { m: v.y, sd: v.sd, n: v.n } : { m: null }; }));
        });
        var ds = vis.map(function (s) { return { key: s.key, label: s.label, color: s.color, values: shown.map(function (l) { return s.vals[l] || null; }) }; });
        var pooledN = pooled.reduce(function (m, p) { return Math.max(m, p ? p.N : 0); }, 0);
        if (showPooled()) ds.push({ key: '__pooled', label: 'Pooled, n-weighted (N=' + pooledN + ')', pooled: true, color: ink, values: pooled });
        drawBars(box, shown, ds, labelUnit, labelText, studies[0] ? studies[0].model.yName : '', G.title + ' pooled chart');
        $('[data-table]').innerHTML = studiesTable(plotted) + groupBarTable(vis, shown, pooled, vis2(), ink, labelText, labelUnit);
      } else {
        var lines = [];
        var sk2 = seriesKeys.filter(function (k) { return !state.hiddenSeries[k]; });
        var pooledRows = [];
        vis.forEach(function (s) {
          s.model.series.forEach(function (ser) {
            if (state.hiddenSeries[ser.key]) return;
            var si = seriesKeys.indexOf(ser.key);
            lines.push({ key: s.key, label: s.label + (seriesKeys.length > 1 ? ' · ' + (ser.key || 'value') : ''), color: s.color, dash: DASH[si % DASH.length], points: ser.points });
          });
        });
        if (vis2()) {
          sk2.forEach(function (sk) {
            var si = seriesKeys.indexOf(sk);
            var byX = {};
            vis.forEach(function (s) { s.model.series.forEach(function (ser) { if (ser.key !== sk) return; ser.points.forEach(function (p) { if (poolable(p)) (byX[p.x] = byX[p.x] || []).push({ m: p.y, sd: p.sd, n: p.n }); }); }); });
            var pts = Object.keys(byX).map(Number).sort(function (a, b) { return a - b; }).filter(function (x) { return byX[x].length > 1; })
              .map(function (x) { var p = pool(byX[x]); if (p) p.x = x; return p; }).filter(Boolean);
            pts.forEach(function (p) { pooledRows.push({ series: sk, p: p }); });
            if (pts.length > 1 && showPooled()) lines.push({ key: '__pooled', label: 'Pooled, n-weighted' + (seriesKeys.length > 1 ? ' · ' + (sk || 'value') : ''), pooled: true, dash: DASH[si % DASH.length], points: pts });
          });
        }
        var y0 = studies[0] ? studies[0].model : {};
        box.innerHTML = '<div class="chart-box tall"></div>';
        curveChart(box.firstChild, lines, y0.xTitle || 'x', y0.yTitle || '', G.unit, G.title + ' pooled chart', state.hidden.__bands ? 0 : 0.1);
        $('[data-table]').innerHTML = groupCurveTable(plotted) + pooledCurveTable(pooledRows, y0.xTitle || 'x', seriesKeys.length > 1);
      }
    }
  }
  function studyCell(s, color) {
    var t = s.t || s;
    return '<td class="c-cite"><span class="sw-cell" style="background:' + esc(color) + '"></span><a class="cite" href="' + testHref(t.id) + '">' + esc((t.source || {}).short || t.id) + '</a>' + exTag(t.example) + '</td>';
  }
  function studiesTable(plotted) {
    return '<div class="table-wrap"><table><thead><tr><th>Study</th><th class="r">Year</th><th class="r">n</th><th>Sample</th><th>Source</th></tr></thead><tbody>' +
      plotted.map(function (s) {
        var src = s.t.source || {}, ex = s.t.extraction || {};
        return '<tr><td class="c-cite"><span class="sw-cell" style="background:' + esc(s.color) + '"></span><a class="cite" href="' + testHref(s.t.id) + '">' + esc(s.label.replace(/ \(n=[^)]*\)$/, '')) + '</a>' + exTag(s.t.example) + '</td>' +
          '<td class="r">' + esc(src.year) + '</td><td class="r n-cell">' + esc(studyN(s.t)) + '</td><td>' + esc(src.sample || (toNum(src.n) == null ? src.n : '') || '') + '</td>' +
          '<td>' + esc(ex.from || '') + (ex.method ? '<span class="sub">' + esc(methodLabel(ex.method)) + (ex.uncertainty ? ', ' + esc(ex.uncertainty) : '') + '</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function groupBarTable(vis, shown, pooled, withPooled, ink, labelText, labelUnit) {
    var units = uniq(shown.map(function (l) { return labelUnit[l] || ''; }));
    var head = '<tr><th>Case</th>' + (units.length > 1 ? '<th>Unit</th>' : '') + vis.map(function (s) {
      return '<th class="r"><span class="sw-cell" style="background:' + esc(s.color) + '"></span>' + esc(s.label) + '</th>';
    }).join('') + (withPooled ? '<th class="r">Pooled, n-weighted</th>' : '') + '</tr>';
    var body = shown.map(function (l, i) {
      var p = pooled[i];
      return '<tr><td>' + esc(labelText[l] || l) + '</td>' + (units.length > 1 ? '<td>' + esc(labelUnit[l] || '') + '</td>' : '') +
        vis.map(function (s) { var v = s.vals[l]; return '<td class="r">' + (v ? esc(describe(v, '')) : '<span class="muted">-</span>') + '</td>'; }).join('') +
        (withPooled ? '<td class="r"><b>' + (p ? esc(describe(p, '')) : '-') + '</b>' + (p ? '<span class="sub">' + pooledSub(p) + '</span>' : '') + '</td>' : '') + '</tr>';
    }).join('');
    return '<h3 style="margin:18px 0 8px">Values' + (units.length === 1 && units[0] ? ' (' + esc(units[0]) + ')' : '') + '</h3><div class="table-wrap"><table><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  }
  function pooledSub(p) {
    return 'k=' + p.k + ' · N=' + p.N + (p.k > 1 ? ' · range ' + fmtC(p.min, p.y) + '–' + fmtC(p.max, p.y) : '') + (p.kind === 'SD of study means' ? ' · SD of means' : '');
  }
  function pooledCurveTable(rows, xTitle, multi) {
    if (!rows.length) return '';
    return '<h3 style="margin:18px 0 8px">Pooled, n-weighted</h3><div class="table-wrap"><table><thead><tr>' + (multi ? '<th>Series</th>' : '') +
      '<th class="r">' + esc(xTitle) + '</th><th class="r">Mean ± SD</th><th class="r">k</th><th class="r">N</th><th class="r">Range of means</th></tr></thead><tbody>' +
      rows.map(function (r) {
        var p = r.p;
        return '<tr>' + (multi ? '<td>' + esc(r.series || 'value') + '</td>' : '') + '<td class="r">' + fmt(p.x) + '</td><td class="r">' + esc(describe(p, '')) +
          '</td><td class="r">' + p.k + '</td><td class="r">' + p.N + '</td><td class="r">' + fmtC(p.min, p.y) + '–' + fmtC(p.max, p.y) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function groupCurveTable(plotted) {
    var body = plotted.map(function (s) {
      var src = s.t.source || {}, ex = s.t.extraction || {};
      var pts = [].concat.apply([], s.model.series.map(function (x) { return x.points; }));
      var xs = pts.map(function (p) { return p.x; });
      return '<tr>' + studyCell(s, s.color) + '<td class="r">' + esc(src.year) + '</td><td class="r n-cell">' + esc(studyN(s.t)) + '</td>' +
        '<td>' + esc(s.model.series.map(function (x) { return x.key || 'value'; }).join(', ')) + '</td>' +
        '<td class="r">' + pts.length + '</td><td class="r">' + (xs.length ? fmt(Math.min.apply(null, xs)) + ' to ' + fmt(Math.max.apply(null, xs)) : '') + '</td>' +
        '<td>' + esc(ex.from || '') + (ex.method ? '<span class="sub">' + esc(methodLabel(ex.method)) + '</span>' : '') + '</td></tr>';
    }).join('');
    return '<div class="table-wrap"><table><thead><tr><th>Study</th><th class="r">Year</th><th class="r">n</th><th>Series</th><th class="r">Points</th><th class="r">x range</th><th>Source</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  // ---------- about ----------
  function viewAbout() {
    setTitle('About');
    var url = location.href.split('#')[0];
    var today = new Date().toISOString().slice(0, 10);
    main.innerHTML = '<div class="prose"><h1 tabindex="-1">About</h1>' +
      '<p class="lede">SpineBench collects published experimental data that thoracic and lumbar spine musculoskeletal (MSK) and finite element (FE) models can be checked against.</p>' +
      '<h2>Structure</h2><ul>' +
      '<li><b>Input</b>: what a model must be fed (kinematics, anthropometry). Never graded.</li>' +
      '<li><b>Property</b>: anatomy and tissue to check before any task (muscle geometry, passive tissue, segment stiffness).</li>' +
      '<li><b>Outcome</b>: predictions to grade (in vivo IDP, EMG, flexion-relaxation, ROM, resection, instrumentation).</li></ul>' +
      '<p>A <b>test</b> is one quantity from one study under one condition (intact, resected, instrumented, with or without rib cage). Tests that measure the same thing under the same condition form a <a href="#groups">pooled comparison</a>.</p>' +
      '<h2>Data provenance</h2><ul>' +
      '<li>Every value names its table or figure in the source paper.</li>' +
      '<li>Method: <i>table</i> or <i>text</i> (copied), or <i>digitised figure</i> (read off a plot, with the stated uncertainty).</li>' +
      '<li><span class="tag ok">checked</span> means a second pass compared the values with the paper; otherwise the test shows <span class="tag">not yet checked</span>.</li>' +
      '<li>Near-identical quantities are kept apart: moment arm vs centroid distance, anatomical CSA vs PCSA, ROM at peak moment vs neutral zone, absolute vs relative IDP.</li>' +
      '<li>Tests marked <span class="tag ex">EXAMPLE</span> hold placeholder values for development and are never real data.</li></ul>' +
      '<h2>How to cite</h2><p>Cite the original study for any value you use; its DOI is on the test page. To cite the collection:</p>' +
      '<div class="cite-box" style="margin-top:8px">SpineBench: validation data for thoracic and lumbar spine musculoskeletal and finite element models. ' + esc(url) + ' (accessed ' + today + ').</div>' +
      '<h2>Downloads and format</h2><p>Every test and group page has JSON and CSV downloads. Everything: ' + dlBtn('data/all.csv', 'all.csv') + ' ' + dlBtn('data/all.json', 'all.json') +
      '. The JSON format is described in <a href="data/SCHEMA.md">SCHEMA.md</a>.</p>' +
      '<p class="note">Build: ' + esc(S.index.generated) + '.</p></div>';
  }

  function notFound(msg) {
    setTitle('Not found');
    main.innerHTML = '<h1 tabindex="-1">Not found</h1><p class="lede">' + esc(msg) + '</p><p style="margin-top:14px"><a href="#">Home</a> · <a href="#browse">Browse all tests</a></p>';
  }

  // ---------- router ----------
  function parseHash() {
    var h = location.hash.replace(/^#\/?/, ''), q = '', i = h.indexOf('?');
    if (i >= 0) { q = h.slice(i + 1); h = h.slice(0, i); }
    var parts = h.split('/');
    var arg = parts.slice(1).join('/');
    try { arg = decodeURIComponent(arg); } catch (e) { /* keep raw */ }
    return { view: parts[0] || 'home', arg: arg, params: new URLSearchParams(q) };
  }
  function route(opts) {
    opts = opts || {};
    destroyCharts();
    var r = parseHash();
    S.view = r.view;
    $$('[data-nav]').forEach(function (a) {
      var cur = a.getAttribute('data-nav') === r.view || (a.getAttribute('data-nav') === 'groups' && r.view === 'group') || (a.getAttribute('data-nav') === 'browse' && r.view === 'category');
      if (cur) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    var p;
    try {
      switch (r.view) {
        case 'home': p = viewHome(); break;
        case 'browse': case 'search': p = viewBrowse(r.view === 'search' && r.arg ? new URLSearchParams('q=' + enc(r.arg)) : r.params); break;
        case 'category': p = viewCategory(r.arg, r.params); break;
        case 'test': p = viewTest(r.arg); break;
        case 'group': p = viewGroup(r.arg); break;
        case 'groups': p = viewGroups(); break;
        case 'about': p = viewAbout(); break;
        default: p = notFound('Unknown page "' + r.view + '".');
      }
    } catch (e) { showError(e); }
    Promise.resolve(p).then(function () {
      if (opts.keepScroll) { window.scrollTo(0, opts.keepScroll); return; }
      window.scrollTo(0, 0);
      if (!opts.initial) { var h1 = $('h1', main); if (h1) { if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); } }
    }, showError);
  }
  function showError(e) {
    if (window.console) console.warn(e);
    main.innerHTML = '<h1>Could not load this page</h1><p class="lede">' + esc(e && e.message ? e.message : e) + '</p>' +
      '<p class="note">If you opened index.html straight from disk, serve the folder instead: <code>python3 -m http.server</code>.</p>';
  }

  // ---------- boot ----------
  function setupChrome() {
    $('#skip').addEventListener('click', function (e) { e.preventDefault(); main.focus(); });
    $('#search-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#q').value.trim();
      location.hash = '#browse' + (v ? '?q=' + enc(v) : '');
    });
    $('#theme-toggle').addEventListener('click', function () {
      var root = document.documentElement;
      var cur = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sb-theme', next); } catch (e) { /* ignore */ }
      rerender();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', rerender);
    }
    window.addEventListener('hashchange', function () { route(); });
  }
  function rerender() { if (S.charts.length) route({ keepScroll: window.scrollY || 1 }); }

  function boot() {
    setupChrome();
    fetchJSON('data/index.json').then(function (I) {
      I.tests = I.tests || []; I.groups = I.groups || []; I.taxonomy = I.taxonomy || []; I.counts = I.counts || {};
      I.tests.forEach(function (t) { t.levels = t.levels || []; t.groups = t.groups || []; t.tags = t.tags || []; S.testById[t.id] = t; });
      I.groups.forEach(function (g) { g.levels = g.levels || []; g.years = g.years || []; S.groupById[g.id] = g; });
      I.taxonomy.forEach(function (L) { S.layerById[L.id] = L; L.categories.forEach(function (c) { c.layer = L.id; S.catById[c.id] = c; }); });
      S.index = I;
      $('#foot-build').textContent = 'Build ' + I.generated;
      if (I.counts.examples) {
        var bar = $('#example-bar');
        bar.innerHTML = '<div>This build includes ' + I.counts.examples + ' EXAMPLE tests with placeholder values. They are not real data.</div>';
        bar.hidden = false;
      }
      route({ initial: true });
    }).catch(showError);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
