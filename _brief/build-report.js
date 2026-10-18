// Generates the PBIR report (theme + 5 pages) for AI Car Theft Analytics.
// Run: node _brief/build-report.js   (from the project root)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const REPORT = path.join(ROOT, 'AI Car Theft Analytics.Report');
const DEF = path.join(REPORT, 'definition');
const PAGES_DIR = path.join(DEF, 'pages');
const RR = path.join(REPORT, 'StaticResources', 'RegisteredResources');

const SCHEMA = {
  page: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.1.0/schema.json',
  pages: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/pagesMetadata/1.1.0/schema.json',
  visual: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.9.0/schema.json',
};

// ---------- palette (light theme, navy banner, crimson accent) ----------
const C = {
  page: '#E9E4DA', card: '#FDFBF7', cardAlt: '#F5F1E9', border: '#E0D9CB',
  text: '#1F1E1D', body: '#3D3A35', muted: '#6B655B', axis: '#55504A', grid: '#ECE6DA',
  shadow: '#4A3F2E',
  navy: '#13213C', navy2: '#24385F', navyText: '#C9D4E6',
  crimson: '#D62839', teal: '#0E9384', blue: '#2F6FDE', violet: '#7A5AF8', amber: '#F59E0B',
  heatLow: '#FBEDEA', heatHigh: '#E5484D',
};
const M = 'Key Measures';
const SERIF = 'Georgia';
const SERIF_NUM = 'Cambria';
const SANS = 'Segoe UI';
const SANS_B = 'Segoe UI Semibold';

// ---------- expression helpers ----------
const lit = (v) => ({ expr: { Literal: { Value: v } } });
const str = (s) => lit(`'${String(s).replace(/'/g, "''")}'`);
const num = (n) => lit(`${n}D`);
const int = (n) => lit(`${n}L`);
const bool = (b) => lit(b ? 'true' : 'false');
const fill = (hex) => ({ solid: { color: lit(`'${hex}'`) } });
const meas = (t, p) => ({ Measure: { Expression: { SourceRef: { Entity: t } }, Property: p } });
const col = (t, p) => ({ Column: { Expression: { SourceRef: { Entity: t } }, Property: p } });
const pm = (p) => ({ field: meas(M, p), queryRef: `${M}.${p}`, nativeQueryRef: p });
const pc = (t, p) => ({ field: col(t, p), queryRef: `${t}.${p}`, nativeQueryRef: p });
const props = (o) => ({ properties: o });
const sel = (o, selector) => ({ properties: o, selector });
const hex = (n) => crypto.randomBytes(n).toString('hex');

// ---------- container (VCO) helpers ----------
const shadow = () => [props({ show: bool(true), preset: str('Custom'), position: str('Outer'), color: fill(C.shadow), transparency: num(84), shadowBlur: num(16), shadowDistance: num(4), shadowSpread: num(0), angle: num(90) })];
function cardVco({ title, altText, subtitle, pad = 12 }) {
  const v = {
    background: [props({ show: bool(true), color: fill(C.card), transparency: num(0) })],
    border: [props({ show: bool(true), color: fill(C.border), radius: num(10), width: num(1) })],
    dropShadow: shadow(),
    padding: [props({ top: num(pad), bottom: num(pad), left: num(pad + 4), right: num(pad + 4) })],
    visualHeader: [props({ show: bool(false) })],
    title: title
      ? [props({ show: bool(true), text: str(title), fontColor: fill(C.text), fontSize: num(16), fontFamily: str(SERIF), bold: bool(false), alignment: str('left') })]
      : [props({ show: bool(false) })],
  };
  if (subtitle) v.subTitle = [props({ show: bool(true), text: str(subtitle), fontColor: fill(C.muted), fontSize: num(11), fontFamily: str(SANS), alignment: str('left') })];
  if (altText) v.general = [props({ altText: str(altText) })];
  return v;
}
const bareVco = (altText) => {
  const v = {
    background: [props({ show: bool(false) })],
    border: [props({ show: bool(false) })],
    dropShadow: [props({ show: bool(false) })],
    padding: [props({ top: num(0), bottom: num(0), left: num(0), right: num(0) })],
    title: [props({ show: bool(false) })],
    visualHeader: [props({ show: bool(false) })],
  };
  if (altText) v.general = [props({ altText: str(altText) })];
  return v;
};

// ---------- visual builder ----------
let z = 0;
function visual(type, pos, { query, objects, vco, filters } = {}) {
  z += 1000;
  const v = {
    $schema: SCHEMA.visual,
    name: hex(10),
    position: { x: pos[0], y: pos[1], z, height: pos[3], width: pos[2], tabOrder: z },
    visual: { visualType: type },
  };
  if (query) v.visual.query = query;
  if (objects) v.visual.objects = objects;
  if (vco) v.visual.visualContainerObjects = vco;
  if (filters) v.filterConfig = { filters };
  return v;
}

const catAxis = (extra = {}) => [props({ show: bool(true), labelColor: fill(C.axis), fontSize: num(11), fontFamily: str(SANS), showAxisTitle: bool(false), gridlineShow: bool(false), ...extra })];
const valAxisHidden = () => [props({ show: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false) })];
const labelsOn = (extra = {}) => [props({ show: bool(true), color: fill(C.text), fontSize: num(11), fontFamily: str(SANS_B), labelDisplayUnits: num(1), labelPosition: str('OutsideEnd'), ...extra })];
const sortBy = (field, direction) => ({ sort: [{ field, direction }], isDefaultSort: true });

// TopN visual filter on a column ranked by a measure
function topN(table, column, measureName, n) {
  return {
    name: 'Filter' + hex(12),
    field: col(table, column),
    type: 'TopN',
    filter: {
      Version: 2,
      From: [
        {
          Name: 'subquery',
          Expression: {
            Subquery: {
              Query: {
                Version: 2,
                From: [{ Name: 'd', Entity: table, Type: 0 }, { Name: 'k', Entity: M, Type: 0 }],
                Select: [{ Column: { Expression: { SourceRef: { Source: 'd' } }, Property: column }, Name: 'field' }],
                OrderBy: [{ Direction: 2, Expression: { Measure: { Expression: { SourceRef: { Source: 'k' } }, Property: measureName } } }],
                Top: n,
              },
            },
          },
          Type: 2,
        },
        { Name: 'd', Entity: table, Type: 0 },
      ],
      Where: [{ Condition: { In: { Expressions: [{ Column: { Expression: { SourceRef: { Source: 'd' } }, Property: column } }], Table: { SourceRef: { Source: 'subquery' } } } } }],
    },
    howCreated: 'User',
  };
}

// ---------- reusable visuals ----------
const run = (value, size, color, family = 'Segoe UI', extra = {}) => ({ value, textStyle: { fontFamily: family, fontSize: `${size}px`, color, ...extra } });
const para = (runs, align = 'left') => ({ textRuns: Array.isArray(runs) ? runs : [runs], horizontalTextAlignment: align });
const textbox = (pos, paragraphs, vco) => visual('textbox', pos, { objects: { general: [props({ paragraphs })] }, vco: vco || bareVco() });

function shape(pos, color, alt) {
  return visual('shape', pos, {
    objects: {
      shape: [sel({ tileShape: str('rectangle') }, { id: 'default' })],
      fill: [sel({ show: bool(true), fillColor: fill(color), transparency: num(0) }, { id: 'default' })],
      outline: [sel({ show: bool(false) }, { id: 'default' })],
    },
    vco: bareVco(alt),
  });
}

function kpi(pos, measureName, accent, label, valueSize = 32) {
  const vco = cardVco({ altText: `KPI card: ${label}` });
  vco.padding = [props({ top: num(8), bottom: num(8), left: num(8), right: num(8) })];
  vco.spacing = [props({ customizeSpacing: bool(true), verticalSpacing: num(2) })];
  return visual('cardVisual', pos, {
    query: { queryState: { Data: { projections: [pm(measureName)] } } },
    objects: {
      value: [sel({ fontSize: num(valueSize), fontColor: fill(C.text), bold: bool(false), fontFamily: str(SERIF_NUM), labelDisplayUnits: num(1) }, { id: 'default' })],
      label: [sel({ show: bool(true), text: str(label), fontSize: num(12), fontFamily: str(SANS_B), fontColor: fill(C.muted) }, { id: 'default' })],
      fillCustom: [sel({ show: bool(true), fillColor: fill(C.card), transparency: num(0) }, { id: 'default' })],
      accentBar: [sel({ show: bool(true), position: str('Left'), color: fill(accent), width: num(5) }, { id: 'default' })],
      outline: [sel({ show: bool(false) }, { id: 'default' })],
      padding: [sel({ paddingUniform: int(8) }, { id: 'default' })],
      layout: [sel({ paddingUniform: int(0) }, { id: 'default' })],
    },
    vco,
  });
}

function slicer(pos, table, column, headerText) {
  return visual('slicer', pos, {
    query: { queryState: { Values: { projections: [pc(table, column)] } } },
    objects: {
      data: [props({ mode: str('Dropdown') })],
      header: [props({ show: bool(true), text: str(headerText), fontColor: fill(C.muted), textSize: num(10), fontFamily: str('Segoe UI Semibold') })],
      items: [props({ fontColor: fill(C.text), background: fill(C.card), textSize: num(11), fontFamily: str(SANS) })],
    },
    vco: {
      background: [props({ show: bool(true), color: fill(C.card), transparency: num(0) })],
      border: [props({ show: bool(true), color: fill(C.border), radius: num(10), width: num(1) })],
      dropShadow: shadow(),
      padding: [props({ top: num(8), bottom: num(8), left: num(12), right: num(12) })],
      title: [props({ show: bool(false) })],
      visualHeader: [props({ show: bool(false) })],
      general: [props({ altText: str(`Filter by ${headerText}`) })],
    },
  });
}

function bar(type, pos, { category, measure, color, title, subtitle, alt, n, sort = 'value', valueLabels = {} }) {
  const [ct, cc] = category;
  return visual(type, pos, {
    query: {
      queryState: { Category: { projections: [pc(ct, cc)] }, Y: { projections: [pm(measure)] } },
      sortDefinition: sort === 'value' ? sortBy(meas(M, measure), 'Descending') : sortBy(col(ct, cc), 'Ascending'),
    },
    objects: {
      dataPoint: [props({ defaultColor: fill(color) })],
      labels: labelsOn(valueLabels),
      categoryAxis: catAxis(type === 'barChart' ? { innerPadding: int(25) } : {}),
      valueAxis: valAxisHidden(),
      legend: [props({ show: bool(false) })],
    },
    vco: cardVco({ title, subtitle, altText: alt }),
    filters: n ? [topN(ct, cc, measure, n)] : undefined,
  });
}

function combo(pos, { category, colMeasure, lineMeasure, colColor, lineColor, title, subtitle, alt, columnLabels = false, lineLabels = false }) {
  const [ct, cc] = category;
  const colRef = `${M}.${colMeasure}`;
  const lineRef = `${M}.${lineMeasure}`;
  const objects = {
    dataPoint: [sel({ fill: fill(colColor) }, { metadata: colRef }), sel({ fill: fill(lineColor) }, { metadata: lineRef })],
    lineStyles: [
      props({ strokeWidth: num(3), lineChartType: str('smooth'), showMarker: bool(lineLabels) }),
      sel({ strokeWidth: num(3), markerColor: fill(lineColor) }, { metadata: lineRef }),
    ],
    categoryAxis: catAxis(),
    valueAxis: [props({
      show: bool(true), labelColor: fill(C.muted), fontSize: num(10), showAxisTitle: bool(false), gridlineShow: bool(true), gridlineColor: fill(C.grid), gridlineStyle: str('dotted'),
      secShow: bool(true), secLabelColor: fill(C.muted), secFontSize: num(10), secShowAxisTitle: bool(false),
    })],
    legend: [props({ show: bool(true), position: str('TopRight'), labelColor: fill(C.axis), fontSize: num(11), fontFamily: str(SANS) })],
  };
  if (columnLabels || lineLabels) {
    objects.labels = [props({ show: bool(true), color: fill(C.text), fontSize: num(11), fontFamily: str(SANS_B), labelDisplayUnits: num(1) })];
    if (!columnLabels) objects.labels.push(sel({ showSeries: bool(false) }, { metadata: colRef }));
    if (!lineLabels) objects.labels.push(sel({ showSeries: bool(false) }, { metadata: lineRef }));
  }
  return visual('lineClusteredColumnComboChart', pos, {
    query: {
      queryState: { Category: { projections: [pc(ct, cc)] }, Y: { projections: [pm(colMeasure)] }, Y2: { projections: [pm(lineMeasure)] } },
      sortDefinition: sortBy(col(ct, cc), 'Ascending'),
    },
    objects,
    vco: cardVco({ title, subtitle, altText: alt }),
  });
}

const tableStyle = (type) => {
  const o = {
    columnHeaders: [props({ fontColor: fill(C.axis), backColor: fill(C.cardAlt), bold: bool(true), fontSize: num(11), fontFamily: str(SANS_B), autoSizeColumnWidth: bool(true), columnAdjustment: str('growToFit') })],
    values: [props({ fontColorPrimary: fill(C.body), fontColorSecondary: fill(C.body), backColorPrimary: fill(C.card), backColorSecondary: fill(C.cardAlt), fontSize: num(11), fontFamily: str(SANS) })],
    grid: [props({ gridHorizontal: bool(true), gridHorizontalColor: fill(C.grid), gridVertical: bool(false), outlineColor: fill(C.border), rowPadding: num(5) })],
  };
  if (type === 'tableEx') o.total = [props({ totals: bool(true), fontColor: fill(C.text), backColor: fill(C.cardAlt), bold: bool(true) })];
  return o;
};

// ---------- layout constants ----------
const W = 1920;
const X0 = 32;
const XR = 1888;
const CW = XR - X0; // 1856
const G = 24; // gutter
const TOP = 232; // content start
const BOTTOM = 1040; // content end (footer below)

// ---------- page chrome: banner + navigator + page header + footer ----------
const PAGE_NAMES = ['Theft Overview', 'Regional Hotspots', 'Vehicles Targeted', 'Time Patterns', 'About the Project'];
function chrome({ question, description, insight, slicers }) {
  const out = [];
  out.push(shape([0, 0, W, 88], C.navy, 'Report banner'));
  out.push(shape([0, 88, W, 4], C.crimson, 'Banner accent line'));
  out.push(textbox([X0, 14, 860, 64], [
    para(run('New Zealand Vehicle Theft Analysis', 26, '#FFFFFF', SERIF)),
    para(run('4,553 vehicles reported stolen to NZ Police  ·  7 Oct 2021 – 6 Apr 2022  ·  16 regions', 13, C.navyText)),
  ]));
  out.push(visual('pageNavigator', [930, 20, XR - 930, 48], {
    objects: {
      pages: [props({ showHiddenPages: bool(false), showTooltipPages: bool(false) })],
      shape: [props({ tileShape: str('pill') })],
      fill: [
        props({ show: bool(true) }),
        sel({ fillColor: fill(C.navy), transparency: num(0) }, { id: 'default' }),
        sel({ fillColor: fill(C.navy2), transparency: num(0) }, { id: 'hover' }),
        sel({ fillColor: fill('#FFFFFF'), transparency: num(0) }, { id: 'selected' }),
      ],
      text: [
        props({ show: bool(true) }),
        sel({ fontColor: fill(C.navyText), fontSize: num(12), fontFamily: str('Segoe UI Semibold') }, { id: 'default' }),
        sel({ fontColor: fill('#FFFFFF'), fontSize: num(12), fontFamily: str('Segoe UI Semibold') }, { id: 'hover' }),
        sel({ fontColor: fill(C.navy), fontSize: num(12), fontFamily: str('Segoe UI Semibold') }, { id: 'selected' }),
      ],
      outline: [
        props({ show: bool(true) }),
        sel({ lineColor: fill(C.navy2), weight: num(1), transparency: num(0) }, { id: 'default' }),
        sel({ lineColor: fill('#FFFFFF'), weight: num(1), transparency: num(0) }, { id: 'selected' }),
      ],
    },
    vco: bareVco('Page navigation tabs'),
  }));
  // page header
  out.push(shape([X0, 116, 6, 92], C.crimson, 'Page title accent'));
  const slicerW = 240;
  const headerW = XR - (X0 + 24) - slicers.length * (slicerW + 16) - 24;
  out.push(textbox([X0 + 24, 110, headerW, 104], [
    para(run(question, 30, C.text, SERIF)),
    para(run(description, 15, C.muted)),
    para([run('Key insight:  ', 15, C.crimson, 'Segoe UI Semibold'), run(insight, 15, C.body, 'Segoe UI Semibold')]),
  ]));
  slicers.forEach((s, i) => {
    const x = XR - (slicers.length - i) * slicerW - (slicers.length - i - 1) * 16;
    out.push(slicer([x, 124, slicerW, 80], s[0], s[1], s[2]));
  });
  out.push(textbox([X0, 1048, CW, 24], [
    para(run('Built by Harpal Sinh Jhala with Power BI and Claude Code  ·  Source: NZ Police stolen vehicle records (Oct 2021 – Apr 2022)  ·  Oct 2021 and Apr 2022 are partial months', 11, C.muted), 'center'),
  ]));
  return out;
}

const split = (total, parts, gutter = G) => {
  const sum = parts.reduce((a, b) => a + b, 0);
  const avail = total - gutter * (parts.length - 1);
  const widths = parts.map((p) => Math.round((avail * p) / sum / 8) * 8);
  widths[widths.length - 1] = avail - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  let x = 0;
  return widths.map((w) => { const r = [x, w]; x += w + gutter; return r; });
};

function kpiRow(v, items) {
  split(CW, items.map(() => 1)).forEach(([x, w], i) => v.push(kpi([X0 + x, TOP, w, 112], ...items[i])));
}

// ---------- pages ----------
const pages = [];

// Page 1 — Theft Overview
(() => {
  z = 0;
  const v = chrome({
    question: 'How many vehicles were stolen, and is the problem growing?',
    description: 'Headline numbers and trends for every vehicle theft reported in New Zealand between October 2021 and April 2022.',
    insight: 'Monthly thefts more than doubled, from 464 in October 2021 to 1,053 in March 2022.',
    slicers: [['Location', 'Region', 'Region'], ['Make', 'Make Type', 'Make type']],
  });
  kpiRow(v, [
    ['Total Thefts', C.crimson, 'Vehicles stolen'],
    ['Average Daily Thefts', C.blue, 'Average thefts per day'],
    ['Peak Daily Thefts', C.amber, 'Most thefts in one day'],
    ['Thefts per 100K Population', C.teal, 'Thefts per 100K people'],
    ['Luxury Theft %', C.violet, 'Share that are luxury cars'],
    ['Average Vehicle Age', C.navy2, 'Avg. vehicle age (years)'],
  ]);
  const row1 = TOP + 112 + G; // 368
  const h1 = 392;
  const row2 = row1 + h1 + G;
  const h2 = BOTTOM - row2;
  const [[ax, aw], [bx, bw]] = split(CW, [60, 40]);

  // Hero: smooth area chart of daily thefts + 7-day average (blue family, no red)
  const dailyRef = `${M}.Total Thefts`;
  const avgRef = `${M}.Thefts 7-Day Rolling Average`;
  v.push(visual('areaChart', [X0 + ax, row1, aw, h1], {
    query: {
      queryState: { Category: { projections: [pc('Date', 'Date')] }, Y: { projections: [pm('Total Thefts'), pm('Thefts 7-Day Rolling Average')] } },
      sortDefinition: sortBy(col('Date', 'Date'), 'Ascending'),
    },
    objects: {
      dataPoint: [sel({ fill: fill('#A9BEE6') }, { metadata: dailyRef }), sel({ fill: fill(C.blue) }, { metadata: avgRef })],
      lineStyles: [
        props({ lineChartType: str('smooth'), showMarker: bool(false), areaShow: bool(true) }),
        sel({ strokeWidth: num(1), strokeTransparency: num(20) }, { metadata: dailyRef }),
        sel({ strokeWidth: num(3) }, { metadata: avgRef }),
      ],
      categoryAxis: catAxis(),
      valueAxis: [props({ show: bool(true), labelColor: fill(C.muted), fontSize: num(10), fontFamily: str(SANS), showAxisTitle: bool(false), gridlineShow: bool(true), gridlineColor: fill(C.grid), gridlineStyle: str('dotted') })],
      legend: [props({ show: bool(true), position: str('TopRight'), labelColor: fill(C.axis), fontSize: num(11), fontFamily: str(SANS) })],
      labels: [props({ show: bool(false) })],
    },
    vco: cardVco({
      title: 'Daily thefts are trending upward',
      subtitle: 'Light area = thefts each day; dark blue = 7-day rolling average. Thefts peaked in late March 2022.',
      altText: 'Area chart of daily vehicle thefts with a 7-day rolling average, October 2021 to April 2022, showing a rising trend.',
    }),
  }));

  // Treemap of regions (multi-colour)
  v.push(visual('treemap', [X0 + bx, row1, bw, h1], {
    query: {
      queryState: { Group: { projections: [pc('Location', 'Region')] }, Values: { projections: [pm('Total Thefts')] } },
      sortDefinition: sortBy(meas(M, 'Total Thefts'), 'Descending'),
    },
    objects: {
      categoryLabels: [props({ show: bool(true), color: fill('#FFFFFF'), fontSize: num(12), fontFamily: str(SANS_B) })],
      labels: [props({ show: bool(true), color: fill('#FFFFFF'), fontSize: num(11), fontFamily: str(SANS), labelDisplayUnits: num(1) })],
      legend: [props({ show: bool(false) })],
    },
    vco: cardVco({
      title: 'Where thefts happen',
      subtitle: 'Box size = number of thefts. Auckland alone has 36%.',
      altText: 'Treemap of thefts by New Zealand region; Auckland is the largest block with 1,638 thefts, followed by Canterbury and Bay of Plenty.',
    }),
  }));

  // Bottom row: donut + bar + column, each in its own colour
  const [[cx, cw2], [dx, dw], [ex, ew]] = split(CW, [26, 37, 37]);
  const makeType = (val, color) => sel({ fill: fill(color) }, {
    data: [{ scopeId: { Comparison: { ComparisonKind: 0, Left: col('Make', 'Make Type'), Right: { Literal: { Value: `'${val}'` } } } } }],
  });
  v.push(visual('donutChart', [X0 + cx, row2, cw2, h2], {
    query: { queryState: { Category: { projections: [pc('Make', 'Make Type')] }, Y: { projections: [pm('Total Thefts')] } } },
    objects: {
      dataPoint: [makeType('Standard', C.navy2), makeType('Luxury', C.violet), makeType('Unknown', '#B8B2A7')],
      labels: [props({ show: bool(true), labelStyle: str('Category, percent of total'), position: str('outside'), color: fill(C.text), fontSize: num(11), fontFamily: str(SANS_B), percentageLabelPrecision: int(1) })],
      legend: [props({ show: bool(false) })],
      slices: [props({ innerRadiusRatio: int(62) })],
      value: [props({ show: bool(true), valueDisplayUnits: num(1), valueFontFamily: str(SERIF_NUM), valueFontSize: num(24), valueFontColor: fill(C.text) })],
    },
    vco: cardVco({ title: 'Standard vs luxury makes', subtitle: 'Only 4.2% of stolen vehicles are luxury makes', altText: 'Donut chart showing 95.5% of stolen vehicles are standard makes and 4.2% are luxury makes.' }),
  }));
  v.push(bar('barChart', [X0 + dx, row2, dw, h2], {
    category: ['Vehicle', 'Vehicle Type'], measure: 'Total Thefts', color: C.navy2, n: 6,
    title: 'Most stolen vehicle types', subtitle: 'Top 6 – everyday family cars are the main target',
    alt: 'Bar chart of the six most stolen vehicle types; stationwagons (945) and saloons (851) lead.',
  }));
  v.push(bar('columnChart', [X0 + ex, row2, ew, h2], {
    category: ['Date', 'Year Month'], measure: 'Total Thefts', color: C.teal, sort: 'category',
    title: 'Thefts by month', subtitle: 'Oct 2021 and Apr 2022 are partial months',
    alt: 'Column chart of monthly thefts from October 2021 (464) rising to March 2022 (1,053); April 2022 is a partial month.',
  }));
  pages.push({ name: '688b6b6d9c2ad0957e8b', displayName: PAGE_NAMES[0], visuals: v });
})();

// Page 2 — Regional Hotspots
(() => {
  z = 0;
  const v = chrome({
    question: 'Where in New Zealand are vehicles being stolen?',
    description: 'Thefts for each region, shown as a total count and as a rate per 100,000 residents so large and small regions can be compared fairly.',
    insight: 'Auckland has the most thefts (36%), but Gisborne has the highest theft rate at 338 per 100K people.',
    slicers: [['Make', 'Make Type', 'Make type'], ['Vehicle', 'Vehicle Type', 'Vehicle type']],
  });
  const h1 = 344;
  const row2 = TOP + h1 + G;
  const h2 = BOTTOM - row2;
  const [[ax, aw], [bx, bw]] = split(CW, [1, 1]);
  v.push(bar('barChart', [X0 + ax, TOP, aw, h1], {
    category: ['Location', 'Region'], measure: 'Total Thefts', color: C.crimson,
    title: 'Total thefts by region', subtitle: 'Bigger regions naturally report more thefts',
    alt: 'Bar chart of total thefts by region, sorted descending; Auckland 1,638, Canterbury 660, Bay of Plenty 446.',
  }));
  v.push(bar('barChart', [X0 + bx, TOP, bw, h1], {
    category: ['Location', 'Region'], measure: 'Thefts per 100K Population', color: C.teal, valueLabels: { labelPrecision: int(0) },
    title: 'Theft rate: thefts per 100,000 residents', subtitle: 'Adjusting for population changes the ranking: Gisborne and Nelson move to the top',
    alt: 'Bar chart of thefts per 100,000 residents by region; Gisborne is highest at 338, followed by Nelson 169 and Bay of Plenty 128.',
  }));
  v.push(visual('scatterChart', [X0 + ax, row2, aw, h2], {
    query: {
      queryState: {
        Category: { projections: [pc('Location', 'Region')] },
        X: { projections: [pm('Population')] },
        Y: { projections: [pm('Total Thefts')] },
        Size: { projections: [pm('Thefts per 100K Population')] },
      },
    },
    objects: {
      dataPoint: [props({ defaultColor: fill(C.teal) })],
      categoryLabels: [props({ show: bool(true), color: fill(C.axis), fontSize: num(10) })],
      categoryAxis: [props({ show: bool(true), logAxisScale: bool(true), labelColor: fill(C.muted), fontSize: num(10), showAxisTitle: bool(true), titleText: str('Population (log scale)'), titleColor: fill(C.muted), gridlineShow: bool(false) })],
      valueAxis: [props({ show: bool(true), labelColor: fill(C.muted), fontSize: num(10), showAxisTitle: bool(true), titleText: str('Thefts'), titleColor: fill(C.muted), gridlineShow: bool(true), gridlineColor: fill(C.grid), gridlineStyle: str('dotted') })],
      legend: [props({ show: bool(false) })],
    },
    vco: cardVco({ title: 'Population vs thefts', subtitle: 'Each bubble is a region; bigger bubble = higher theft rate', altText: 'Scatter chart of region population against thefts, bubble size showing theft rate.' }),
  }));
  v.push(visual('tableEx', [X0 + bx, row2, bw, h2], {
    query: {
      queryState: { Values: { projections: [pc('Location', 'Region'), pm('Total Thefts'), pm('% of Total Thefts'), pm('Population'), pm('Thefts per 100K Population'), pm('Region Theft Rank')] } },
      sortDefinition: sortBy(meas(M, 'Total Thefts'), 'Descending'),
    },
    objects: { ...tableStyle('tableEx'), grid: [props({ gridHorizontal: bool(true), gridHorizontalColor: fill(C.grid), gridVertical: bool(false), outlineColor: fill(C.border), rowPadding: num(2) })] },
    vco: { ...cardVco({ title: 'Regional scorecard', subtitle: 'All regions with thefts, ranked by total', altText: 'Table of regions with thefts, share of total, population, theft rate per 100K and rank.' }), stylePreset: [props({ name: str('None') })] },
  }));
  pages.push({ name: 'a1c0f3e2b4d5960718a2', displayName: PAGE_NAMES[1], visuals: v });
})();

// Page 3 — Vehicles Targeted
(() => {
  z = 0;
  const v = chrome({
    question: 'Which vehicles do thieves target?',
    description: 'Thefts broken down by vehicle make, body type, colour and age.',
    insight: 'Ordinary cars are taken, not luxury ones: Toyota, stationwagons and silver vehicles top the lists, and only 4.2% are luxury makes.',
    slicers: [['Location', 'Region', 'Region'], ['Make', 'Make Type', 'Make type']],
  });
  kpiRow(v, [
    ['Top Stolen Make', C.crimson, 'Most stolen make', 28],
    ['Top Stolen Vehicle Type', C.crimson, 'Most stolen vehicle type', 28],
    ['Top Stolen Color', C.crimson, 'Most stolen colour', 28],
    ['Makes Stolen', C.navy2, 'Different makes stolen'],
    ['Luxury Thefts', C.violet, 'Luxury vehicles stolen'],
    ['Average Vehicle Age', C.amber, 'Avg. vehicle age (years)'],
  ]);
  const row1 = TOP + 112 + G;
  const [[ax, aw], [bx, bw]] = split(CW, [40, 60]);
  v.push(bar('barChart', [X0 + ax, row1, aw, BOTTOM - row1], {
    category: ['Make', 'Make Name'], measure: 'Total Thefts', color: C.crimson, n: 15,
    title: 'Most stolen makes (top 15)', subtitle: 'Japanese everyday brands dominate; "Trailer" is a make category in the source data',
    alt: 'Bar chart of the fifteen most stolen vehicle makes; Toyota leads with 716, then Trailer 543, Nissan 482 and Mazda 433.',
  }));
  const hTop = 320;
  const row2 = row1 + hTop + G;
  v.push(bar('barChart', [X0 + bx, row1, bw, hTop], {
    category: ['Vehicle', 'Vehicle Type'], measure: 'Total Thefts', color: C.navy2, n: 8,
    title: 'Most stolen vehicle types (top 8)', subtitle: 'Stationwagons, saloons and hatchbacks make up over half of all thefts',
    alt: 'Bar chart of the eight most stolen vehicle types; stationwagon, saloon and hatchback lead.',
  }));
  const [[cx, cw2], [dx, dw]] = split(bw, [1, 1]);
  v.push(bar('barChart', [X0 + bx + cx, row2, cw2, BOTTOM - row2], {
    category: ['Vehicle', 'Color'], measure: 'Total Thefts', color: C.teal, n: 8,
    title: 'Most stolen colours (top 8)', subtitle: 'Silver and white are the most common',
    alt: 'Bar chart of the eight most stolen vehicle colours; silver 1,272 and white 934 lead.',
  }));
  v.push(bar('columnChart', [X0 + bx + dx, row2, dw, BOTTOM - row2], {
    category: ['Vehicle', 'Model Decade'], measure: 'Total Thefts', color: C.amber, sort: 'category',
    title: 'Stolen vehicles by model decade', subtitle: 'Most were built in the 2000s, so 15+ years old',
    alt: 'Column chart of thefts by vehicle model decade; the 2000s decade has the most thefts.',
  }));
  pages.push({ name: 'b2d1e4f3c5a6071829b3', displayName: PAGE_NAMES[2], visuals: v });
})();

// Page 4 — Time Patterns
(() => {
  z = 0;
  const v = chrome({
    question: 'When do vehicle thefts happen?',
    description: 'Thefts by month and by day of the week, plus a heatmap that combines the two.',
    insight: 'Monday is the busiest day at about 30 thefts a day; weekends are quieter at about 22.',
    slicers: [['Location', 'Region', 'Region'], ['Make', 'Make Type', 'Make type']],
  });
  const h1 = 336;
  const row2 = TOP + h1 + G;
  const [[ax, aw], [bx, bw]] = split(CW, [60, 40]);
  v.push(combo([X0 + ax, TOP, aw, h1], {
    category: ['Date', 'Year Month'], colMeasure: 'Total Thefts', lineMeasure: 'Thefts MoM %', colColor: C.navy2, lineColor: C.crimson,
    title: 'Thefts per month and change vs previous month', subtitle: 'Bars = thefts; line = % change. March 2022 rose 38% on February.',
    alt: 'Combo chart of monthly thefts and month-over-month percentage change; growth every month to March 2022.',
    columnLabels: true, lineLabels: true,
  }));
  v.push(bar('columnChart', [X0 + bx, TOP, bw, h1], {
    category: ['Date', 'Day Short'], measure: 'Average Daily Thefts', color: C.blue, sort: 'category', valueLabels: { labelPrecision: int(1) },
    title: 'Average thefts per day, by weekday', subtitle: 'Early in the week is busiest',
    alt: 'Column chart of average daily thefts by weekday; Monday is highest at 29.5, Saturday lowest at 22.2.',
  }));
  const heatRef = `${M}.Total Thefts`;
  const pt = tableStyle('pivotTable');
  pt.values = [
    props({ fontColorPrimary: fill(C.text), fontColorSecondary: fill(C.text), backColorPrimary: fill(C.card), backColorSecondary: fill(C.card), fontSize: num(13), bold: bool(true) }),
    sel({
      backColor: { solid: { color: { expr: { FillRule: {
        Input: { SelectRef: { ExpressionName: heatRef } },
        FillRule: { linearGradient2: {
          min: { color: { Literal: { Value: `'${C.heatLow}'` } } },
          max: { color: { Literal: { Value: `'${C.heatHigh}'` } } },
          nullColoringStrategy: { strategy: { Literal: { Value: "'noColor'" } } },
        } },
      } } } } },
    }, { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: heatRef }),
  ];
  pt.rowHeaders = [props({ fontColor: fill(C.axis), backColor: fill(C.card), fontSize: num(12), bold: bool(true) })];
  pt.rowTotal = [props({ fontColor: fill(C.text), backColor: fill(C.cardAlt), bold: bool(true) })];
  pt.columnTotal = [props({ fontColor: fill(C.text), backColor: fill(C.cardAlt), bold: bool(true) })];
  pt.grid = [props({ gridHorizontal: bool(true), gridHorizontalColor: fill(C.card), gridVertical: bool(true), gridVerticalColor: fill(C.card), gridVerticalWeight: num(3), gridHorizontalWeight: num(3), outlineColor: fill(C.border), rowPadding: num(5) })];
  v.push(visual('pivotTable', [X0, row2, CW, BOTTOM - row2], {
    query: {
      queryState: {
        Rows: { projections: [pc('Date', 'Day Name')] },
        Columns: { projections: [pc('Date', 'Year Month')] },
        Values: { projections: [pm('Total Thefts')] },
      },
    },
    objects: pt,
    vco: { ...cardVco({ title: 'Theft heatmap: day of week × month', subtitle: 'Darker red = more thefts. The hottest cells are Mondays to Thursdays in March 2022.', altText: 'Matrix heatmap of thefts by weekday and month; the hottest cells are weekdays in March 2022.' }), stylePreset: [props({ name: str('None') })] },
  }));
  pages.push({ name: 'c3e2f5a4d6b718293ac4', displayName: PAGE_NAMES[3], visuals: v });
})();

// Page 5 — About the Project
(() => {
  z = 0;
  const v = chrome({
    question: 'About this project',
    description: 'What this report covers, how it was built, and the tools used.',
    insight: 'Built end to end with Power BI and Claude Code: data model, DAX measures and report pages.',
    slicers: [],
  });
  const h = (t) => para(run(t, 26, C.crimson, SERIF));
  const p = (t) => para(run(t, 18, C.body));
  const gap = (n = 10) => para(run(' ', n, C.body));
  const b = (label, t, size = 18) => para([run(label, size, C.text, 'Segoe UI Semibold'), run(t, size, C.body)]);
  const sp = (rows, g = 6) => rows.flatMap((r, i) => (i ? [gap(g), r] : [r]));
  const panel = (alt) => cardVco({ altText: alt, pad: 24 });
  const [[ax, aw], [bx, bw]] = split(CW, [52, 48]);
  v.push(textbox([X0 + ax, TOP, aw, BOTTOM - TOP], [
    h('What this report covers'),
    gap(6),
    p('An analysis of 4,553 vehicle thefts reported to New Zealand Police between 7 October 2021 and 6 April 2022, across 16 regions and 138 vehicle makes. It answers four questions: how many, where, which vehicles, and when.'),
    gap(26),
    h('How it was built'),
    gap(6),
    ...sp([
      b('01  Ingest — ', 'three CSV files loaded with Power Query (M), driven by a single Data Folder parameter.'),
      b('02  Clean — ', 'missing makes mapped to an "Unknown" member, blank text set to "Unknown", population text converted to numbers.'),
      b('03  Model — ', 'star schema with one fact table and four dimensions, joined by one-to-many, single-direction relationships.'),
      b('04  Measure — ', '28 DAX measures in a dedicated Key Measures table, grouped into six display folders.'),
      b('05  Optimise — ', 'hidden keys, implicit measures off, auto date/time off, integer keys, sort-by columns.'),
      b('06  Design — ', 'custom theme, five report pages, page navigation, accessibility alt text, screenshot-reviewed.'),
    ], 10),
    gap(26),
    h('AI-assisted workflow'),
    gap(6),
    p('Built with Claude Code driving Power BI Desktop through the Power BI Modeling MCP server (model, DAX, optimisation) and the Power BI report authoring CLI (pages, theme, validation, screenshots). Every measure was tested against live data with DAX queries.'),
  ], panel('About this project: scope, build steps and AI-assisted workflow.')));
  const hTop = 400;
  v.push(textbox([X0 + bx, TOP, bw, hTop], [
    h('Key findings'),
    gap(8),
    ...sp([
      b('Growing problem — ', 'monthly thefts rose from 464 (Oct 2021) to 1,053 (Mar 2022).', 20),
      b('Where — ', 'Auckland has 36% of thefts; Gisborne has the highest rate (338 per 100K).', 20),
      b('Which vehicles — ', 'only 4.2% are luxury makes; Toyota, stationwagons and silver cars lead.', 20),
      b('When — ', 'Monday is the busiest day (about 30 a day) vs about 22 on weekends.', 20),
    ], 20),
  ], panel('Key findings from the report pages.')));
  v.push(textbox([X0 + bx, TOP + hTop + G, bw, BOTTOM - TOP - hTop - G], [
    h('Data model & tools'),
    gap(8),
    ...sp([
      b('Fact table — ', 'Thefts (one row per stolen vehicle).', 20),
      b('Dimensions — ', 'Vehicle, Make, Location and Date (marked date table).', 20),
      b('Skills — ', 'data modelling, DAX, Power Query, time intelligence, report design, data storytelling.', 20),
      b('Tools — ', 'Power BI Desktop, Power Query, DAX, PBIP / PBIR / TMDL, Claude Code.', 20),
    ], 20),
  ], panel('Data model, skills and tools.')));
  pages.push({ name: 'd4f3a6b5e7c8293a4bd5', displayName: PAGE_NAMES[4], visuals: v });
})();

// ---------- theme ----------
const themeBase = 'TheftAnalyticsLight';
for (const f of fs.existsSync(RR) ? fs.readdirSync(RR) : []) {
  if (f.startsWith(themeBase + '-') || f.startsWith('CaseFileDark-')) fs.unlinkSync(path.join(RR, f));
}
const themeFile = `${themeBase}-${hex(4)}.json`;
const theme = {
  $schema: 'https://raw.githubusercontent.com/microsoft/powerbi-desktop-samples/main/Report%20Theme%20JSON%20Schema/reportThemeSchema-2.153.json',
  name: themeFile,
  // Categorical palette (treemap etc.): all dark enough for white labels; red is not first.
  dataColors: [C.navy2, C.teal, C.blue, C.violet, '#B54708', '#C11574', '#0B7285', '#5925DC', '#027A48', C.crimson, '#475467', '#9E6B00', '#3E4784'],
  good: '#12B76A', neutral: C.amber, bad: C.crimson,
  maximum: C.heatHigh, center: '#F8A1A8', minimum: C.heatLow, null: '#D0D5DD',
  foreground: C.text, firstLevelElements: C.text, secondLevelElements: C.axis, thirdLevelElements: C.grid, fourthLevelElements: C.muted,
  background: C.card, secondaryBackground: C.cardAlt, tableAccent: C.crimson,
  textClasses: {
    callout: { fontSize: 32, fontFace: SERIF_NUM, color: C.text },
    title: { fontSize: 16, fontFace: SERIF, color: C.text },
    header: { fontSize: 12, fontFace: 'Segoe UI Semibold', color: C.text },
    label: { fontSize: 10, fontFace: 'Segoe UI', color: C.body },
  },
  visualStyles: {
    '*': {
      '*': {
        background: [{ show: true, color: { solid: { color: C.card } }, transparency: 0 }],
        border: [{ show: true, color: { solid: { color: C.border } }, radius: 10 }],
        dropShadow: [{ show: true, preset: 'Custom', position: 'Outer', color: { solid: { color: C.shadow } }, transparency: 84, shadowBlur: 16, shadowDistance: 4, shadowSpread: 0, angle: 90 }],
        padding: [{ top: 12, bottom: 12, left: 16, right: 16 }],
        title: [{ fontColor: { solid: { color: C.text } }, fontSize: 16, fontFamily: SERIF }],
        subTitle: [{ fontColor: { solid: { color: C.muted } }, fontSize: 11 }],
        categoryAxis: [{ labelColor: { solid: { color: C.axis } }, gridlineColor: { solid: { color: C.grid } } }],
        valueAxis: [{ labelColor: { solid: { color: C.muted } }, gridlineColor: { solid: { color: C.grid } }, gridlineStyle: 'dotted' }],
        legend: [{ labelColor: { solid: { color: C.axis } } }],
      },
    },
    page: { '*': { background: [{ color: { solid: { color: C.page } }, transparency: 0 }], outspace: [{ color: { solid: { color: C.page } }, transparency: 0 }] } },
    textbox: { '*': { padding: [{ top: 0, bottom: 0, left: 0, right: 0 }], background: [{ show: false }], border: [{ show: false }], dropShadow: [{ show: false }] } },
    shape: { '*': { padding: [{ top: 0, bottom: 0, left: 0, right: 0 }], background: [{ show: false }], border: [{ show: false }], dropShadow: [{ show: false }] } },
    pageNavigator: { '*': { padding: [{ top: 0, bottom: 0, left: 0, right: 0 }], background: [{ show: false }], border: [{ show: false }], dropShadow: [{ show: false }] } },
    slicer: { '*': {
      header: [{ fontColor: { solid: { color: C.muted } }, fontFamily: 'Segoe UI Semibold', textSize: 10 }],
      items: [{ fontColor: { solid: { color: C.text } }, background: { solid: { color: C.card } }, textSize: 11 }],
    } },
    tableEx: { '*': { columnHeaders: [{ autoSizeColumnWidth: true, columnAdjustment: 'growToFit' }] } },
    pivotTable: { '*': { columnHeaders: [{ autoSizeColumnWidth: true, columnAdjustment: 'growToFit' }] } },
  },
};
fs.mkdirSync(RR, { recursive: true });
fs.writeFileSync(path.join(RR, themeFile), JSON.stringify(theme, null, 2));

// ---------- report.json ----------
const reportPath = path.join(DEF, 'report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
report.themeCollection.customTheme = { name: themeFile, reportVersionAtImport: report.themeCollection.baseTheme.reportVersionAtImport, type: 'RegisteredResources' };
report.resourcePackages = report.resourcePackages.filter((p) => p.type !== 'RegisteredResources');
report.resourcePackages.push({ name: 'RegisteredResources', type: 'RegisteredResources', items: [{ name: themeFile, path: themeFile, type: 'CustomTheme' }] });
report.objects = report.objects || {};
report.objects.outspacePane = [props({ visible: bool(false) })];
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// ---------- pages ----------
fs.rmSync(PAGES_DIR, { recursive: true, force: true });
fs.mkdirSync(PAGES_DIR, { recursive: true });
for (const pg of pages) {
  const dir = path.join(PAGES_DIR, pg.name);
  fs.mkdirSync(path.join(dir, 'visuals'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.json'), JSON.stringify({
    $schema: SCHEMA.page,
    name: pg.name,
    displayName: pg.displayName,
    displayOption: 'FitToPage',
    height: 1080,
    width: 1920,
    objects: {
      background: [props({ color: fill(C.page), transparency: num(0) })],
      outspace: [props({ color: fill(C.page), transparency: num(0) })],
    },
  }, null, 2));
  for (const v of pg.visuals) {
    const vdir = path.join(dir, 'visuals', v.name);
    fs.mkdirSync(vdir, { recursive: true });
    fs.writeFileSync(path.join(vdir, 'visual.json'), JSON.stringify(v, null, 2));
  }
}
fs.writeFileSync(path.join(PAGES_DIR, 'pages.json'), JSON.stringify({ $schema: SCHEMA.pages, pageOrder: pages.map((p) => p.name), activePageName: pages[0].name }, null, 2));

// Desktop drops $schema from these two files on save; restore it for validation/Fabric.
for (const [file, schema] of [
  [path.join(ROOT, 'AI Car Theft Analytics.pbip'), 'https://developer.microsoft.com/json-schemas/fabric/pbip/pbipProperties/1.0.0/schema.json'],
  [path.join(REPORT, 'definition.pbir'), 'https://developer.microsoft.com/json-schemas/fabric/item/report/definitionProperties/2.0.0/schema.json'],
]) {
  const { $schema, ...rest } = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, JSON.stringify({ $schema: schema, ...rest }, null, 2));
}

console.log(`Theme: ${themeFile}`);
for (const p of pages) console.log(`${p.displayName}: ${p.visuals.length} visuals (${p.name})`);
