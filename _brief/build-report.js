// Generates the PBIR report (theme + 5 pages) for AI Car Theft Analytics.
// Design language: "warm minimal" — Claude's ivory/clay palette and serif headlines,
// Apple-style white cards, soft shadows, segmented navigation and light numerals.
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

// ---------- design tokens ----------
const C = {
  page: '#F4F1EA', card: '#FFFFFF', cardAlt: '#FAF8F4', hair: '#E9E5DC', track: '#ECE8E0', trackHover: '#E2DDD2',
  ink: '#191918', body: '#3D3D3A', muted: '#716E67', faint: '#A8A49A', grid: '#EFEBE3', shadow: '#2B2620',
  clay: '#D4693F', clayDeep: '#C0502A', clayTint: '#F6DED2',
  teal: '#1F7A6E', ocean: '#2F6BB3', amber: '#D98E1F',
  kraft: '#D98E1F', slate: '#2B2B2A', sky: '#2F6BB3', olive: '#5E7A3A', plum: '#7B5EA7',
};
// Value gradients (light → deep): the biggest value carries the most colour.
const GRAD = {
  clay: ['#EBA88A', '#C0502A'],
  teal: ['#86C4B8', '#16655A'],
  ocean: ['#95B7E2', '#1F559C'],
  amber: ['#F1C77E', '#C27812'],
  heat: ['#FCEDE6', '#C0502A'],
};
// Categorical palette: rich, all dark enough for white labels; terracotta leads.
const CATEGORICAL = ['#D4693F', '#1F7A6E', '#2F6BB3', '#C27812', '#7B5EA7', '#3A3A38', '#5E7A3A', '#B8476A', '#3E5F8A', '#A0522D', '#4E7D5B', '#5B4A8A', '#56636F'];
const M = 'Key Measures';
const SERIF = 'Georgia';
const SANS = 'Segoe UI';
const SANS_B = 'Segoe UI Semibold';
const SANS_L = 'Segoe UI Light';

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
const WILD = { data: [{ dataViewWildcard: { matchingOption: 1 } }] };

// Gradient fill driven by a measure (light → deep)
const gradFill = (measureName, [lo, hi]) => ({
  solid: { color: { expr: { FillRule: {
    Input: meas(M, measureName),
    FillRule: { linearGradient2: {
      min: { color: { Literal: { Value: `'${lo}'` } } },
      max: { color: { Literal: { Value: `'${hi}'` } } },
      nullColoringStrategy: { strategy: { Literal: { Value: "'asZero'" } } },
    } },
  } } } },
});

// ---------- container (VCO) helpers ----------
const shadow = () => [props({ show: bool(true), preset: str('Custom'), position: str('Outer'), color: fill(C.shadow), transparency: num(91), shadowBlur: num(26), shadowDistance: num(6), shadowSpread: num(0), angle: num(90) })];
function cardVco({ title, altText, subtitle, pad = 18 }) {
  const v = {
    background: [props({ show: bool(true), color: fill(C.card), transparency: num(0) })],
    border: [props({ show: bool(true), color: fill(C.hair), radius: num(16), width: num(1) })],
    dropShadow: shadow(),
    padding: [props({ top: num(pad), bottom: num(pad - 4), left: num(pad + 4), right: num(pad + 4) })],
    visualHeader: [props({ show: bool(false) })],
    title: title
      ? [props({ show: bool(true), text: str(title), fontColor: fill(C.ink), fontSize: num(17), fontFamily: str(SERIF), bold: bool(false), alignment: str('left') })]
      : [props({ show: bool(false) })],
  };
  if (subtitle) v.subTitle = [props({ show: bool(true), text: str(subtitle), fontColor: fill(C.muted), fontSize: num(11.5), fontFamily: str(SANS), alignment: str('left') })];
  v.spacing = [props({ customizeSpacing: bool(true), spaceBelowSubTitle: num(10) })];
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

const catAxis = (extra = {}) => [props({ show: bool(true), labelColor: fill(C.body), fontSize: num(11), fontFamily: str(SANS), showAxisTitle: bool(false), gridlineShow: bool(false), ...extra })];
const valAxisHidden = () => [props({ show: bool(false), gridlineShow: bool(false), showAxisTitle: bool(false) })];
const valAxisSoft = (extra = {}) => [props({ show: bool(true), labelColor: fill(C.faint), fontSize: num(10), fontFamily: str(SANS), showAxisTitle: bool(false), gridlineShow: bool(true), gridlineColor: fill(C.grid), gridlineStyle: str('solid'), gridlineThickness: num(1), ...extra })];
const labelsOn = (extra = {}) => [props({ show: bool(true), color: fill(C.ink), fontSize: num(11), fontFamily: str(SANS_B), labelDisplayUnits: num(1), labelPosition: str('OutsideEnd'), ...extra })];
const sortBy = (field, direction) => ({ sort: [{ field, direction }], isDefaultSort: true });
const legend = (show = true) => [props({ show: bool(show), position: str('TopRight'), labelColor: fill(C.muted), fontSize: num(11), fontFamily: str(SANS) })];

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
          Expression: { Subquery: { Query: {
            Version: 2,
            From: [{ Name: 'd', Entity: table, Type: 0 }, { Name: 'k', Entity: M, Type: 0 }],
            Select: [{ Column: { Expression: { SourceRef: { Source: 'd' } }, Property: column }, Name: 'field' }],
            OrderBy: [{ Direction: 2, Expression: { Measure: { Expression: { SourceRef: { Source: 'k' } }, Property: measureName } } }],
            Top: n,
          } } },
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
const run = (value, size, color, family = SANS, extra = {}) => ({ value, textStyle: { fontFamily: family, fontSize: `${size}px`, color, ...extra } });
const para = (runs, align = 'left') => ({ textRuns: Array.isArray(runs) ? runs : [runs], horizontalTextAlignment: align });
const textbox = (pos, paragraphs, vco) => visual('textbox', pos, { objects: { general: [props({ paragraphs })] }, vco: vco || bareVco() });

function shape(pos, color, { radius = 0, alt, kind } = {}) {
  const tile = kind || (radius ? 'rectangleRoundedByPixel' : 'rectangle');
  return visual('shape', pos, {
    objects: {
      shape: [props({ tileShape: str(tile), ...(radius ? { rectangleRoundedCurve: int(radius) } : {}) }), sel({ tileShape: str(tile), ...(radius ? { rectangleRoundedCurve: int(radius) } : {}) }, { id: 'default' })],
      fill: [props({ show: bool(true) }), sel({ fillColor: fill(color), transparency: num(0) }, { id: 'default' })],
      outline: [props({ show: bool(false) }), sel({ show: bool(false) }, { id: 'default' })],
    },
    vco: bareVco(alt),
  });
}

function kpi(pos, measureName, accent, label, valueSize = 38) {
  const vco = cardVco({ altText: `KPI card: ${label}` });
  vco.padding = [props({ top: num(8), bottom: num(8), left: num(10), right: num(10) })];
  vco.spacing = [props({ customizeSpacing: bool(true), verticalSpacing: num(2) })];
  return visual('cardVisual', pos, {
    query: { queryState: { Data: { projections: [pm(measureName)] } } },
    objects: {
      value: [sel({ fontSize: num(valueSize), fontColor: fill(C.ink), bold: bool(false), fontFamily: str(SANS_L), labelDisplayUnits: num(1) }, { id: 'default' })],
      label: [sel({ show: bool(true), text: str(label), fontSize: num(13.5), fontFamily: str(SANS_B), fontColor: fill(C.muted), position: str('aboveValue') }, { id: 'default' })],
      fillCustom: [sel({ show: bool(true), fillColor: fill(C.card), transparency: num(0) }, { id: 'default' })],
      accentBar: [sel({ show: bool(true), position: str('Top'), color: fill(accent), width: num(4) }, { id: 'default' })],
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
      header: [props({ show: bool(true), text: str(headerText), fontColor: fill(C.muted), textSize: num(10), fontFamily: str(SANS_B) })],
      items: [props({ fontColor: fill(C.ink), background: fill(C.card), textSize: num(11.5), fontFamily: str(SANS) })],
    },
    vco: {
      background: [props({ show: bool(true), color: fill(C.card), transparency: num(0) })],
      border: [props({ show: bool(true), color: fill(C.hair), radius: num(12), width: num(1) })],
      dropShadow: shadow(),
      padding: [props({ top: num(8), bottom: num(8), left: num(14), right: num(14) })],
      title: [props({ show: bool(false) })],
      visualHeader: [props({ show: bool(false) })],
      general: [props({ altText: str(`Filter by ${headerText}`) })],
    },
  });
}

function bar(type, pos, { category, measure, grad, title, subtitle, alt, n, sort = 'value', valueLabels = {}, axis = {} }) {
  const [ct, cc] = category;
  return visual(type, pos, {
    query: {
      queryState: { Category: { projections: [pc(ct, cc)] }, Y: { projections: [pm(measure)] } },
      sortDefinition: sort === 'value' ? sortBy(meas(M, measure), 'Descending') : sortBy(col(ct, cc), 'Ascending'),
    },
    objects: {
      dataPoint: [sel({ fill: gradFill(measure, grad) }, WILD)],
      labels: labelsOn(valueLabels),
      categoryAxis: catAxis(type === 'barChart' ? { innerPadding: int(30), ...axis } : { innerPadding: int(35), ...axis }),
      valueAxis: valAxisHidden(),
      legend: legend(false),
    },
    vco: cardVco({ title, subtitle, altText: alt }),
    filters: n ? [topN(ct, cc, measure, n)] : undefined,
  });
}

const tableStyle = (type, { font = 11, rowPadding = 4 } = {}) => {
  const o = {
    columnHeaders: [props({ fontColor: fill(C.muted), backColor: fill(C.card), bold: bool(true), fontSize: num(font - 0.5), fontFamily: str(SANS_B), autoSizeColumnWidth: bool(true), columnAdjustment: str('growToFit'), outlineStyle: lit('2D'), outlineColor: fill(C.hair) })],
    values: [props({ fontColorPrimary: fill(C.body), fontColorSecondary: fill(C.body), backColorPrimary: fill(C.card), backColorSecondary: fill(C.card), fontSize: num(font), fontFamily: str(SANS) })],
    grid: [props({ gridHorizontal: bool(true), gridHorizontalColor: fill(C.grid), gridHorizontalWeight: num(1), gridVertical: bool(false), outlineColor: fill(C.hair), rowPadding: num(rowPadding) })],
  };
  if (type === 'tableEx') o.total = [props({ totals: bool(true), fontColor: fill(C.ink), backColor: fill(C.cardAlt), bold: bool(true), fontFamily: str(SANS_B) })];
  return o;
};

// ---------- layout constants ----------
const W = 1920;
const X0 = 40;
const XR = 1880;
const CW = XR - X0; // 1840
const G = 24;
const TOP = 240; // content start
const BOTTOM = 1032; // content end (footer below)
const split = (total, parts, gutter = G) => {
  const sum = parts.reduce((a, b) => a + b, 0);
  const avail = total - gutter * (parts.length - 1);
  const widths = parts.map((p) => Math.round((avail * p) / sum / 8) * 8);
  widths[widths.length - 1] = avail - widths.slice(0, -1).reduce((a, b) => a + b, 0);
  let x = 0;
  return widths.map((w) => { const r = [x, w]; x += w + gutter; return r; });
};

// ---------- page chrome: top bar + segmented navigation + header + footer ----------
const PAGE_NAMES = ['Overview', 'Regions', 'Vehicles', 'Time Patterns', 'About'];
function chrome({ eyebrow, question, description, insight, slicers }) {
  const out = [];
  // top bar
  out.push(shape([0, 0, W, 88], C.card, { alt: 'Top bar' }));
  out.push(shape([0, 88, W, 1], C.hair, { alt: 'Top bar divider' }));
  out.push(textbox([X0 - 2, 16, 40, 56], [para(run('●', 34, C.clay, SANS))]));
  out.push(textbox([X0 + 44, 18, 760, 56], [
    para(run('New Zealand Vehicle Theft Analysis', 23, C.ink, SERIF)),
    para(run('4,553 stolen-vehicle reports  ·  NZ Police  ·  7 Oct 2021 – 6 Apr 2022', 12.5, C.muted)),
  ]));
  // segmented control
  // Track is its own layer: padding on the navigator's container misaligns the tabs.
  const segX = 1150, segW = XR - segX, segY = 20, segH = 52, inset = 5;
  const trackVco = bareVco('Navigation track');
  trackVco.background = [props({ show: bool(true), color: fill(C.track), transparency: num(0) })];
  trackVco.border = [props({ show: bool(true), color: fill(C.track), radius: num(14), width: num(1) })];
  out.push(textbox([segX, segY, segW, segH], [para(run(' ', 8, C.track))], trackVco));
  out.push(visual('pageNavigator', [segX + inset, segY + inset, segW - inset * 2, segH - inset * 2], {
    objects: {
      pages: [props({ showHiddenPages: bool(false), showTooltipPages: bool(false) })],
      shape: [props({ tileShape: str('rectangleRoundedByPixel'), rectangleRoundedCurve: int(10) })],
      fill: [
        props({ show: bool(true) }),
        sel({ fillColor: fill(C.track), transparency: num(0) }, { id: 'default' }),
        sel({ fillColor: fill(C.trackHover), transparency: num(0) }, { id: 'hover' }),
        sel({ fillColor: fill(C.card), transparency: num(0) }, { id: 'selected' }),
      ],
      text: [
        props({ show: bool(true) }),
        sel({ fontColor: fill(C.muted), fontSize: num(12.5), fontFamily: str(SANS_B) }, { id: 'default' }),
        sel({ fontColor: fill(C.ink), fontSize: num(12.5), fontFamily: str(SANS_B) }, { id: 'hover' }),
        sel({ fontColor: fill(C.ink), fontSize: num(12.5), fontFamily: str(SANS_B) }, { id: 'selected' }),
      ],
      outline: [props({ show: bool(false) })],
    },
    vco: bareVco('Page navigation'),
  }));
  // page header
  const slicerW = 236;
  const headerW = XR - X0 - slicers.length * (slicerW + 16) - 24;
  out.push(textbox([X0, 114, headerW, 116], [
    para(run(eyebrow.toUpperCase(), 11.5, C.clay, SANS_B, { letterSpacing: '1px' })),
    para(run(question, 33, C.ink, SERIF)),
    para(run(description, 14.5, C.muted)),
    para([run('Key insight  ', 14.5, C.clay, SANS_B), run(insight, 14.5, C.body, SANS_B)]),
  ]));
  slicers.forEach((s, i) => {
    const x = XR - (slicers.length - i) * slicerW - (slicers.length - i - 1) * 16;
    out.push(slicer([x, 132, slicerW, 80], s[0], s[1], s[2]));
  });
  out.push(textbox([X0, 1048, CW, 22], [
    para(run('Designed and built by Harpal Sinh Jhala with Claude Code   ·   Data: NZ Police stolen-vehicle records, Oct 2021 – Apr 2022 (first and last months are partial)', 11, C.faint), 'center'),
  ]));
  return out;
}

const kpiRow = (v, items) => split(CW, items.map(() => 1)).forEach(([x, w], i) => v.push(kpi([X0 + x, TOP, w, 120], ...items[i])));

// ---------- pages ----------
const pages = [];

// Page 1 — Overview
(() => {
  z = 0;
  const v = chrome({
    eyebrow: 'Overview',
    question: 'How many vehicles were stolen, and is it getting worse?',
    description: 'Every vehicle theft reported to New Zealand Police between October 2021 and April 2022.',
    insight: 'Monthly thefts more than doubled, from 464 in October to 1,053 in March.',
    slicers: [['Location', 'Region', 'Region'], ['Make', 'Make Type', 'Make type']],
  });
  kpiRow(v, [
    ['Total Thefts', C.clay, 'Vehicles stolen'],
    ['Average Daily Thefts', C.ocean, 'Thefts per day'],
    ['Peak Daily Thefts', C.amber, 'Busiest single day'],
    ['Thefts per 100K Population', C.teal, 'Per 100K people'],
    ['Luxury Theft %', C.plum, 'Luxury share'],
    ['Average Vehicle Age', C.slate, 'Avg. vehicle age (yrs)'],
  ]);
  const row1 = TOP + 120 + G;
  const h1 = 380;
  const row2 = row1 + h1 + G;
  const h2 = BOTTOM - row2;
  const [[ax, aw], [bx, bw]] = split(CW, [60, 40]);

  const dailyRef = `${M}.Total Thefts`;
  const avgRef = `${M}.Thefts 7-Day Rolling Average`;
  v.push(visual('areaChart', [X0 + ax, row1, aw, h1], {
    query: {
      queryState: { Category: { projections: [pc('Date', 'Date')] }, Y: { projections: [pm('Total Thefts'), pm('Thefts 7-Day Rolling Average')] } },
      sortDefinition: sortBy(col('Date', 'Date'), 'Ascending'),
    },
    objects: {
      dataPoint: [sel({ fill: fill('#EFB59C') }, { metadata: dailyRef }), sel({ fill: fill(C.clayDeep) }, { metadata: avgRef })],
      lineStyles: [
        props({ lineChartType: str('smooth'), showMarker: bool(false), areaShow: bool(true) }),
        sel({ strokeWidth: num(1), strokeTransparency: num(30) }, { metadata: dailyRef }),
        sel({ strokeWidth: num(3) }, { metadata: avgRef }),
      ],
      categoryAxis: catAxis({ labelColor: fill(C.muted) }),
      valueAxis: valAxisSoft(),
      legend: legend(),
      labels: [props({ show: bool(false) })],
    },
    vco: cardVco({
      title: 'Daily thefts are climbing',
      subtitle: 'Thefts per day, with the 7-day rolling average. The peak came in late March 2022.',
      altText: 'Area chart of daily vehicle thefts with a 7-day rolling average, October 2021 to April 2022, rising to a late-March peak.',
    }),
  }));
  v.push(visual('treemap', [X0 + bx, row1, bw, h1], {
    query: {
      queryState: { Group: { projections: [pc('Location', 'Region')] }, Values: { projections: [pm('Total Thefts')] } },
      sortDefinition: sortBy(meas(M, 'Total Thefts'), 'Descending'),
    },
    objects: {
      categoryLabels: [props({ show: bool(true), color: fill('#FFFFFF'), fontSize: num(12), fontFamily: str(SANS_B) })],
      labels: [props({ show: bool(true), color: fill('#FFFFFF'), fontSize: num(11), fontFamily: str(SANS), labelDisplayUnits: num(1) })],
      legend: legend(false),
    },
    vco: cardVco({
      title: 'Where thefts happen',
      subtitle: 'Box size shows theft count. Auckland alone has 36%.',
      altText: 'Treemap of thefts by region; Auckland is the largest block with 1,638 thefts, followed by Canterbury and Bay of Plenty.',
    }),
  }));
  const [[cx, cw2], [dx, dw], [ex, ew]] = split(CW, [27, 36.5, 36.5]);
  const makeType = (val, color) => sel({ fill: fill(color) }, {
    data: [{ scopeId: { Comparison: { ComparisonKind: 0, Left: col('Make', 'Make Type'), Right: { Literal: { Value: `'${val}'` } } } } }],
  });
  v.push(visual('donutChart', [X0 + cx, row2, cw2, h2], {
    query: { queryState: { Category: { projections: [pc('Make', 'Make Type')] }, Y: { projections: [pm('Total Thefts')] } } },
    objects: {
      dataPoint: [makeType('Standard', C.teal), makeType('Luxury', C.clay), makeType('Unknown', '#C9C4BA')],
      labels: [props({ show: bool(true), labelStyle: str('Category, percent of total'), position: str('outside'), color: fill(C.ink), fontSize: num(11.5), fontFamily: str(SANS_B), percentageLabelPrecision: int(1) })],
      legend: legend(false),
      slices: [props({ innerRadiusRatio: int(70) })],
      centerValue: [props({ show: bool(false) })],
      value: [props({ show: bool(false) })],
    },
    vco: cardVco({ title: 'Standard vs luxury', subtitle: 'Only 4.2% of stolen vehicles are luxury makes', altText: 'Donut chart: 95.5% of stolen vehicles are standard makes, 4.2% luxury.' }),
  }));
  v.push(bar('barChart', [X0 + dx, row2, dw, h2], {
    category: ['Vehicle', 'Vehicle Type'], measure: 'Total Thefts', grad: GRAD.teal, n: 6,
    title: 'Most stolen vehicle types', subtitle: 'Top 6. Everyday family cars are the main target.',
    alt: 'Bar chart of the six most stolen vehicle types; stationwagons (945) and saloons (851) lead.',
  }));
  v.push(bar('columnChart', [X0 + ex, row2, ew, h2], {
    category: ['Date', 'Year Month'], measure: 'Total Thefts', grad: GRAD.ocean, sort: 'category',
    title: 'Thefts by month', subtitle: 'October 2021 and April 2022 are partial months',
    alt: 'Column chart of monthly thefts from October 2021 (464) rising to March 2022 (1,053); April 2022 is partial.',
  }));
  pages.push({ name: '688b6b6d9c2ad0957e8b', displayName: PAGE_NAMES[0], visuals: v });
})();

// Page 2 — Regions
(() => {
  z = 0;
  const v = chrome({
    eyebrow: 'Regions',
    question: 'Where in New Zealand are vehicles being stolen?',
    description: 'Each region shown two ways: total thefts, and thefts per 100,000 residents so big and small regions compare fairly.',
    insight: 'Auckland has the most thefts (36%), but Gisborne has the highest rate: 338 per 100K people.',
    slicers: [['Make', 'Make Type', 'Make type'], ['Vehicle', 'Vehicle Type', 'Vehicle type']],
  });
  const full = BOTTOM - TOP;
  const hTbl = 488;
  const hSc = full - G - hTbl;
  const [[ax, aw], [bx, bw], [cx, cw2]] = split(CW, [29, 29, 42]);
  v.push(bar('barChart', [X0 + ax, TOP, aw, full], {
    category: ['Location', 'Region'], measure: 'Total Thefts', grad: GRAD.clay,
    title: 'Total thefts', subtitle: 'Bigger regions naturally report more',
    alt: 'Bar chart of total thefts by region, sorted descending; Auckland 1,638, Canterbury 660, Bay of Plenty 446.',
    axis: { innerPadding: int(28) },
  }));
  v.push(bar('barChart', [X0 + bx, TOP, bw, full], {
    category: ['Location', 'Region'], measure: 'Thefts per 100K Population', grad: GRAD.teal,
    title: 'Theft rate per 100K residents', subtitle: 'Adjusting for population changes the ranking',
    alt: 'Bar chart of thefts per 100,000 residents; Gisborne is highest at 338, then Nelson 169 and Bay of Plenty 128.',
    axis: { innerPadding: int(28) }, valueLabels: { labelPrecision: int(0) },
  }));
  v.push(visual('scatterChart', [X0 + cx, TOP, cw2, hSc], {
    query: { queryState: {
      Category: { projections: [pc('Location', 'Region')] },
      X: { projections: [pm('Population')] },
      Y: { projections: [pm('Total Thefts')] },
      Size: { projections: [pm('Thefts per 100K Population')] },
    } },
    objects: {
      dataPoint: [props({ defaultColor: fill(C.ocean) })],
      categoryLabels: [props({ show: bool(true), color: fill(C.body), fontSize: num(10.5), fontFamily: str(SANS) })],
      categoryAxis: [props({ show: bool(true), logAxisScale: bool(true), labelColor: fill(C.faint), fontSize: num(10), fontFamily: str(SANS), showAxisTitle: bool(true), titleText: str('Population (log scale)'), titleColor: fill(C.muted), gridlineShow: bool(false) })],
      valueAxis: valAxisSoft({ showAxisTitle: bool(true), titleText: str('Thefts'), titleColor: fill(C.muted) }),
      legend: legend(false),
    },
    vco: cardVco({ title: 'Population vs thefts', subtitle: 'Each bubble is a region; bigger bubble = higher theft rate', altText: 'Scatter chart of region population against thefts, with bubble size showing theft rate.' }),
  }));
  const tbl = tableStyle('tableEx', { font: 11, rowPadding: 1 });
  v.push(visual('tableEx', [X0 + cx, TOP + hSc + G, cw2, hTbl], {
    query: {
      queryState: { Values: { projections: [pc('Location', 'Region'), pm('Total Thefts'), pm('% of Total Thefts'), pm('Population'), pm('Thefts per 100K Population')] } },
      sortDefinition: sortBy(meas(M, 'Total Thefts'), 'Descending'),
    },
    objects: tbl,
    vco: { ...cardVco({ title: 'Regional scorecard', subtitle: 'Every region with recorded thefts, ranked by total', pad: 14, altText: 'Table of regions with thefts, share of total, population, theft rate per 100K and rank.' }), stylePreset: [props({ name: str('None') })] },
  }));
  pages.push({ name: 'a1c0f3e2b4d5960718a2', displayName: PAGE_NAMES[1], visuals: v });
})();

// Page 3 — Vehicles
(() => {
  z = 0;
  const v = chrome({
    eyebrow: 'Vehicles',
    question: 'Which vehicles do thieves target?',
    description: 'Thefts broken down by make, body type, colour and age.',
    insight: 'Ordinary cars, not luxury ones: Toyota, stationwagons and silver vehicles lead; only 4.2% are luxury makes.',
    slicers: [['Location', 'Region', 'Region'], ['Make', 'Make Type', 'Make type']],
  });
  kpiRow(v, [
    ['Top Stolen Make', C.clay, 'Most stolen make', 30],
    ['Top Stolen Vehicle Type', C.teal, 'Most stolen type', 30],
    ['Top Stolen Color', C.ocean, 'Most stolen colour', 30],
    ['Makes Stolen', C.slate, 'Different makes stolen'],
    ['Luxury Thefts', C.plum, 'Luxury vehicles stolen'],
    ['Average Vehicle Age', C.amber, 'Avg. vehicle age (yrs)'],
  ]);
  const row1 = TOP + 120 + G;
  const [[ax, aw], [bx, bw]] = split(CW, [40, 60]);
  v.push(bar('barChart', [X0 + ax, row1, aw, BOTTOM - row1], {
    category: ['Make', 'Make Name'], measure: 'Total Thefts', grad: GRAD.clay, n: 15,
    title: 'Most stolen makes', subtitle: 'Top 15. Japanese everyday brands dominate; "Trailer" is a make in the source data.',
    alt: 'Bar chart of the fifteen most stolen makes; Toyota leads with 716, then Trailer 543, Nissan 482 and Mazda 433.',
  }));
  const hTop = 312;
  const row2 = row1 + hTop + G;
  v.push(bar('barChart', [X0 + bx, row1, bw, hTop], {
    category: ['Vehicle', 'Vehicle Type'], measure: 'Total Thefts', grad: GRAD.teal, n: 8,
    title: 'Most stolen body types', subtitle: 'Top 8. Stationwagons, saloons and hatchbacks make up over half of all thefts.',
    alt: 'Bar chart of the eight most stolen vehicle types; stationwagon, saloon and hatchback lead.',
  }));
  const [[cx, cw2], [dx, dw]] = split(bw, [1, 1]);
  v.push(bar('barChart', [X0 + bx + cx, row2, cw2, BOTTOM - row2], {
    category: ['Vehicle', 'Color'], measure: 'Total Thefts', grad: GRAD.ocean, n: 8,
    title: 'Most stolen colours', subtitle: 'Top 8. Silver and white lead.',
    alt: 'Bar chart of the eight most stolen colours; silver 1,272 and white 934 lead.',
  }));
  v.push(bar('columnChart', [X0 + bx + dx, row2, dw, BOTTOM - row2], {
    category: ['Vehicle', 'Model Decade'], measure: 'Total Thefts', grad: GRAD.amber, sort: 'category',
    title: 'By model decade', subtitle: 'Most were built in the 2000s: 15+ years old',
    alt: 'Column chart of thefts by model decade; the 2000s has the most thefts.',
    axis: { labelColor: fill(C.muted), fontSize: num(10) },
  }));
  pages.push({ name: 'b2d1e4f3c5a6071829b3', displayName: PAGE_NAMES[2], visuals: v });
})();

// Page 4 — Time Patterns
(() => {
  z = 0;
  const v = chrome({
    eyebrow: 'Time patterns',
    question: 'When do vehicle thefts happen?',
    description: 'Thefts by month and by day of the week, and a heatmap that combines the two.',
    insight: 'Monday is the busiest day, at about 30 thefts a day; weekends are quieter at about 22.',
    slicers: [['Location', 'Region', 'Region'], ['Make', 'Make Type', 'Make type']],
  });
  const h1 = 340;
  const row2 = TOP + h1 + G;
  const [[ax, aw], [bx, bw]] = split(CW, [60, 40]);
  const colRef = `${M}.Total Thefts`;
  const lineRef = `${M}.Thefts MoM %`;
  v.push(visual('lineClusteredColumnComboChart', [X0 + ax, TOP, aw, h1], {
    query: {
      queryState: { Category: { projections: [pc('Date', 'Year Month')] }, Y: { projections: [pm('Total Thefts')] }, Y2: { projections: [pm('Thefts MoM %')] } },
      sortDefinition: sortBy(col('Date', 'Year Month'), 'Ascending'),
    },
    objects: {
      dataPoint: [sel({ fill: fill(C.clay) }, { metadata: colRef }), sel({ fill: fill(C.ocean) }, { metadata: lineRef })],
      lineStyles: [
        props({ strokeWidth: num(2.5), lineChartType: str('smooth'), showMarker: bool(true), markerSize: num(5) }),
        sel({ strokeWidth: num(2.5), markerColor: fill(C.ocean) }, { metadata: lineRef }),
      ],
      labels: [props({ show: bool(true), color: fill(C.ink), fontSize: num(10.5), fontFamily: str(SANS_B), labelDisplayUnits: num(1) })],
      categoryAxis: catAxis({ labelColor: fill(C.muted) }),
      valueAxis: [props({ show: bool(false), gridlineShow: bool(false), secShow: bool(false) })],
      legend: legend(),
    },
    vco: cardVco({ title: 'Thefts per month, and change vs the month before', subtitle: 'Columns = thefts; line = % change. March 2022 rose 38% on February.', altText: 'Combo chart of monthly thefts and month-over-month change; growth every month to March 2022.' }),
  }));
  v.push(bar('columnChart', [X0 + bx, TOP, bw, h1], {
    category: ['Date', 'Day Short'], measure: 'Average Daily Thefts', grad: GRAD.amber, sort: 'category', valueLabels: { labelPrecision: int(1) },
    title: 'Average thefts per day, by weekday', subtitle: 'The working week is busier than the weekend',
    alt: 'Column chart of average daily thefts by weekday; Monday is highest at 29.5, Saturday lowest at 22.2.',
  }));
  const heatRef = `${M}.Total Thefts`;
  const pt = tableStyle('pivotTable', { font: 12.5, rowPadding: 6 });
  pt.values = [
    props({ fontColorPrimary: fill(C.ink), fontColorSecondary: fill(C.ink), backColorPrimary: fill(C.card), backColorSecondary: fill(C.card), fontSize: num(12.5), fontFamily: str(SANS_B) }),
    sel({ backColor: { solid: { color: { expr: { FillRule: {
      Input: { SelectRef: { ExpressionName: heatRef } },
      FillRule: { linearGradient2: {
        min: { color: { Literal: { Value: `'${GRAD.heat[0]}'` } } },
        max: { color: { Literal: { Value: `'${GRAD.heat[1]}'` } } },
        nullColoringStrategy: { strategy: { Literal: { Value: "'noColor'" } } },
      } },
    } } } } } }, { data: [{ dataViewWildcard: { matchingOption: 1 } }], metadata: heatRef }),
  ];
  pt.rowHeaders = [props({ fontColor: fill(C.body), backColor: fill(C.card), fontSize: num(12), fontFamily: str(SANS_B) })];
  pt.rowTotal = [props({ fontColor: fill(C.ink), backColor: fill(C.cardAlt), fontFamily: str(SANS_B) })];
  pt.columnTotal = [props({ fontColor: fill(C.ink), backColor: fill(C.cardAlt), fontFamily: str(SANS_B) })];
  pt.grid = [props({ gridHorizontal: bool(true), gridHorizontalColor: fill(C.card), gridHorizontalWeight: num(4), gridVertical: bool(true), gridVerticalColor: fill(C.card), gridVerticalWeight: num(4), outlineColor: fill(C.card), rowPadding: num(6) })];
  v.push(visual('pivotTable', [X0, row2, CW, BOTTOM - row2], {
    query: { queryState: {
      Rows: { projections: [pc('Date', 'Day Name')] },
      Columns: { projections: [pc('Date', 'Year Month')] },
      Values: { projections: [pm('Total Thefts')] },
    } },
    objects: pt,
    vco: { ...cardVco({ title: 'Theft heatmap: day of week × month', subtitle: 'Deeper terracotta = more thefts. The hottest cells are weekdays in March 2022.', altText: 'Matrix heatmap of thefts by weekday and month; the hottest cells are weekdays in March 2022.' }), stylePreset: [props({ name: str('None') })] },
  }));
  pages.push({ name: 'c3e2f5a4d6b718293ac4', displayName: PAGE_NAMES[3], visuals: v });
})();

// Page 5 — About
(() => {
  z = 0;
  const v = chrome({
    eyebrow: 'About this project',
    question: 'How this report was built',
    description: 'What it covers, how it was made, and the tools behind it.',
    insight: 'Designed by a human, built with Claude Code: data model, DAX measures and every page.',
    slicers: [],
  });
  const kick = (t) => para(run(t.toUpperCase(), 11.5, C.clay, SANS_B, { letterSpacing: '1px' }));
  const h = (t) => para(run(t, 26, C.ink, SERIF));
  const p = (t) => para(run(t, 17, C.body));
  const gap = (n = 10) => para(run(' ', n, C.body));
  const b = (label, t, size = 17) => para([run(label, size, C.ink, SANS_B), run(t, size, C.body)]);
  const sp = (rows, g = 8) => rows.flatMap((r, i) => (i ? [gap(g), r] : [r]));
  const panel = (alt) => cardVco({ altText: alt, pad: 30 });
  const [[ax, aw], [bx, bw]] = split(CW, [54, 46]);
  v.push(textbox([X0 + ax, TOP, aw, BOTTOM - TOP], [
    kick('The project'),
    h('What this report covers'),
    gap(6),
    p('An analysis of 4,553 vehicle thefts reported to New Zealand Police between 7 October 2021 and 6 April 2022, across 16 regions and 138 makes. It answers four questions: how many, where, which vehicles, and when.'),
    gap(22),
    kick('The process'),
    h('How it was built'),
    gap(6),
    ...sp([
      b('01   Ingest — ', 'three CSV files loaded with Power Query, driven by one Data Folder parameter.'),
      b('02   Clean — ', 'missing makes mapped to "Unknown", blank text tidied, population text converted to numbers.'),
      b('03   Model — ', 'a star schema: one fact table, four dimensions, one-to-many single-direction relationships.'),
      b('04   Measure — ', '28 DAX measures in a dedicated Key Measures table, in six display folders.'),
      b('05   Optimise — ', 'hidden keys, implicit measures and auto date/time off, integer keys, sort-by columns.'),
      b('06   Design — ', 'a custom theme, five pages, segmented navigation and alt text, reviewed on screen.'),
    ]),
  ], panel('About this project: scope and build steps.')));
  const hTop = 372;
  v.push(textbox([X0 + bx, TOP, bw, hTop], [
    kick('The findings'),
    h('Four things the data says'),
    gap(10),
    ...sp([
      b('Growing — ', 'monthly thefts rose from 464 (Oct 2021) to 1,053 (Mar 2022).'),
      b('Where — ', 'Auckland has 36% of thefts; Gisborne has the highest rate (338 per 100K).'),
      b('What — ', 'only 4.2% are luxury makes; Toyota, stationwagons and silver cars lead.'),
      b('When — ', 'Monday is busiest (about 30 a day) versus about 22 on weekends.'),
    ], 10),
  ], panel('Key findings from the report pages.')));
  v.push(textbox([X0 + bx, TOP + hTop + G, bw, BOTTOM - TOP - hTop - G], [
    kick('The workflow'),
    h('Human + AI'),
    gap(10),
    ...sp([
      b('Human — ', 'set the goal, designed the semantic model, and art-directed the report through several review rounds.'),
      b('Claude Code — ', 'built the model through the Power BI Modeling MCP server and generated, validated and screenshot-checked every page.'),
      b('Stack — ', 'Power BI Desktop, Power Query, DAX, PBIP / PBIR / TMDL, Claude Code.'),
    ], 10),
  ], panel('Human and AI workflow and the tool stack.')));
  pages.push({ name: 'd4f3a6b5e7c8293a4bd5', displayName: PAGE_NAMES[4], visuals: v });
})();

// ---------- theme ----------
const themeBase = 'TheftAnalyticsWarm';
for (const f of fs.existsSync(RR) ? fs.readdirSync(RR) : []) {
  if (/^(TheftAnalyticsWarm|TheftAnalyticsLight|CaseFileDark)-/.test(f)) fs.unlinkSync(path.join(RR, f));
}
const themeFile = `${themeBase}-${hex(4)}.json`;
const theme = {
  $schema: 'https://raw.githubusercontent.com/microsoft/powerbi-desktop-samples/main/Report%20Theme%20JSON%20Schema/reportThemeSchema-2.153.json',
  name: themeFile,
  dataColors: CATEGORICAL,
  good: C.olive, neutral: C.kraft, bad: C.clayDeep,
  maximum: GRAD.clay[1], center: '#D98466', minimum: GRAD.clay[0], null: '#E5E1D8',
  foreground: C.ink, firstLevelElements: C.ink, secondLevelElements: C.muted, thirdLevelElements: C.grid, fourthLevelElements: C.faint,
  background: C.card, secondaryBackground: C.cardAlt, tableAccent: C.clay,
  textClasses: {
    callout: { fontSize: 38, fontFace: SANS_L, color: C.ink },
    title: { fontSize: 17, fontFace: SERIF, color: C.ink },
    header: { fontSize: 12, fontFace: SANS_B, color: C.ink },
    label: { fontSize: 11, fontFace: SANS, color: C.body },
  },
  visualStyles: {
    '*': {
      '*': {
        background: [{ show: true, color: { solid: { color: C.card } }, transparency: 0 }],
        border: [{ show: true, color: { solid: { color: C.hair } }, radius: 16 }],
        dropShadow: [{ show: true, preset: 'Custom', position: 'Outer', color: { solid: { color: C.shadow } }, transparency: 91, shadowBlur: 26, shadowDistance: 6, shadowSpread: 0, angle: 90 }],
        padding: [{ top: 18, bottom: 14, left: 22, right: 22 }],
        title: [{ fontColor: { solid: { color: C.ink } }, fontSize: 17, fontFamily: SERIF }],
        subTitle: [{ fontColor: { solid: { color: C.muted } }, fontSize: 11.5 }],
        categoryAxis: [{ labelColor: { solid: { color: C.body } }, gridlineColor: { solid: { color: C.grid } } }],
        valueAxis: [{ labelColor: { solid: { color: C.faint } }, gridlineColor: { solid: { color: C.grid } } }],
        legend: [{ labelColor: { solid: { color: C.muted } } }],
      },
    },
    page: { '*': { background: [{ color: { solid: { color: C.page } }, transparency: 0 }], outspace: [{ color: { solid: { color: C.page } }, transparency: 0 }] } },
    textbox: { '*': { padding: [{ top: 0, bottom: 0, left: 0, right: 0 }], background: [{ show: false }], border: [{ show: false }], dropShadow: [{ show: false }] } },
    shape: { '*': { padding: [{ top: 0, bottom: 0, left: 0, right: 0 }], background: [{ show: false }], border: [{ show: false }], dropShadow: [{ show: false }], outline: [{ show: false }] } },
    pageNavigator: { '*': { padding: [{ top: 0, bottom: 0, left: 0, right: 0 }], background: [{ show: false }], border: [{ show: false }], dropShadow: [{ show: false }] } },
    slicer: { '*': {
      header: [{ fontColor: { solid: { color: C.muted } }, fontFamily: SANS_B, textSize: 10 }],
      items: [{ fontColor: { solid: { color: C.ink } }, background: { solid: { color: C.card } }, textSize: 11.5 }],
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
