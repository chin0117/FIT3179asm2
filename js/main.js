/* FIT3179: responsive Vega-Lite chart loader.
 * Uses the original 12 editable Vega-Lite specifications and re-computes only
 * their presentation dimensions; data/encodings remain unchanged.
 */
const LAYOUT_BUILD = "20261027-state-spending-change-v13";
const chartFiles = {
  1: "01 choropleth.vg.json",
  2: "02 proportional symbol.vg.json",
  3: "03 flow map.vg.json",
  4: "04 streamgraph.vg.json",
  5: "05 small multiple.vg.json",
  6: "heatmap.vg.json",
  7: "07 slope chart.vg.json",
  8: "08 dumbbell.vg.json",
  9: "09 waterfall.vg.json",
  10: "10 boxplot.vg.json",
  11: "11 line.vg.json",
  12: "12 grouped bar.vg.json",
  13: "13 park pareto.vg.json"
};
// Chart 10 is also stored inline as a safety fallback for incomplete GitHub Pages deployments.
// Source JSON still remains editable in js/heatmap.vg.json.
const heatmapSpecFallback = {"description":"Relative domestic visitor nights; each cell / the state mean of the 5 available quarters. This is a short-term quarter profile, NOT multi-year evidence of seasonality. Seven discrete ordered colour bands and numeric cell labels improve mid-range discrimination.","width":460,"height":255,"data":{"url":"data/visitor_nights_quarterly.csv"},"transform":[{"joinaggregate":[{"op":"mean","field":"nights","as":"state_mean"}],"groupby":["state"]},{"calculate":"datum.nights / datum.state_mean","as":"relative_index"}],"encoding":{"x":{"field":"quarter","type":"ordinal","sort":["Jun 25","Sep 25","Dec 25","Mar 26","Jun 26"],"title":"Quarter","axis":{"labelAngle":0,"labelFontSize":13,"titleFontSize":14}},"y":{"field":"state","type":"nominal","title":null,"sort":["NSW","VIC","QLD","WA","SA","TAS","NT","ACT"]},"tooltip":[{"field":"state","type":"nominal"},{"field":"quarter","type":"nominal"},{"field":"nights","type":"quantitative","title":"Nights ('000)","format":",.0f"},{"field":"relative_index","type":"quantitative","title":"Relative demand","format":".2f"}]},"$schema":"https://vega.github.io/schema/vega-lite/v5.json","config":{"font":"Calibri, Arial, sans-serif","view":{"stroke":null},"axis":{"labelColor":"#334155","titleColor":"#334155","gridColor":"#ecf2f0","domainColor":"#bac9c5","labelFontSize":13,"titleFontSize":14,"labelFont":"Calibri, Arial, sans-serif","titleFont":"Calibri, Arial, sans-serif"},"legend":{"labelColor":"#233F38","titleColor":"#234D41","fillColor":"#F7FBF9","strokeColor":"#C7D9D0","cornerRadius":7,"padding":9,"labelFontSize":13,"titleFontSize":14},"title":{"font":"Times New Roman, Times, serif","fontSize":19,"fontWeight":"normal","anchor":"middle"},"header":{"labelFontSize":15,"titleFontSize":15,"labelFont":"Calibri, Arial, sans-serif"}},"params":[{"name":"heatmapState","value":"All states","bind":{"input":"select","options":["All states","NSW","VIC","QLD","WA","SA","TAS","NT","ACT"],"name":"Focus state: "}},{"name":"minRelativeIndex","value":0.6,"bind":{"input":"range","min":0.6,"max":1.5,"step":0.05,"name":"Highlight index >= "}}],"layer":[{"mark":{"type":"rect","stroke":"#ffffff","strokeWidth":1.8,"cornerRadius":2},"encoding":{"color":{"field":"relative_index","type":"quantitative","title":"Relative to 5-quarter avg","scale":{"type":"quantize","domain":[0.6,1.5],"range":["#FFF1B6","#FCD595","#F8B47C","#ED906C","#D46A75","#A54F8A","#6F3D8E"]},"legend":{"orient":"bottom","direction":"horizontal","titleLimit":230,"offset":11,"labelLimit":90,"labelFontSize":13,"titleFontSize":14,"gradientLength":235,"gradientThickness":14,"title":"Index (state average = 1.00)","format":".2f","fillColor":"#F7FBF9","strokeColor":"#C7D9D0","cornerRadius":7,"padding":9,"labelColor":"#233F38","titleColor":"#234D41"}},"opacity":{"condition":{"test":"datum.relative_index >= minRelativeIndex && (heatmapState === 'All states' || datum.state === heatmapState)","value":1},"value":0.2}}},{"mark":{"type":"text","fontSize":11,"fontWeight":"bold","baseline":"middle"},"encoding":{"text":{"field":"relative_index","type":"quantitative","format":".2f"},"color":{"condition":{"test":"datum.relative_index >= 1.09","value":"#FFFFFF"},"value":"#263449"},"opacity":{"condition":{"test":"datum.relative_index >= minRelativeIndex && (heatmapState === 'All states' || datum.state === heatmapState)","value":1},"value":0.2}}}]};
const chartOrder = [1, 2, 3, 13, 4, 7, 11, 9, 5, 6, 8, 10, 12];
const baseSpecs = new Map();
const lastSizes = new Map();
const maximumWidths = {
  1: 780, 2: 780, 3: 780, 4: 950, 6: 680, 13: 980,
  7: 510, 8: 525, 9: 880, 10: 525, 11: 510, 12: 525
};
const geoCharts = new Set([1, 2, 3]);
// Native Vega-Lite legends for these charts; other charts use HTML side keys.
const nativeLegendCharts = new Set([1, 4, 6, 7, 8, 9, 12]);
// Dashboard card numbers 05, 08, 11, 13 must use horizontal BOTTOM legends.
const bottomLegendCharts = new Set([4, 9, 8, 6, 7]);
let resizeTimeout;

// Source: the same editable CSV used by Chart 11. No hard-coded spending amounts.
const spendingByState = new Map();
let selectedSpendState = 'All states';

async function loadStateSpending() {
  try {
    const response = await fetch('data/spend_per_trip.csv?v=' + LAYOUT_BUILD, {cache:'no-store'});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = (await response.text()).trim().split(/\r?\n/);
    const columns = rows.shift().replace(/^\uFEFF/, '').split(',');
    const stateIndex = columns.indexOf('state');
    const periodIndex = columns.indexOf('period');
    const valueIndex = columns.indexOf('spend_per_trip_aud');
    if (Math.min(stateIndex, periodIndex, valueIndex) < 0) throw new Error('Unexpected spending CSV headings');
    for (const row of rows) {
      if (!row.trim()) continue;
      const cells = row.split(',');
      const state = cells[stateIndex].trim();
      const period = cells[periodIndex].trim();
      const value = Number(cells[valueIndex]);
      if (!Number.isFinite(value)) continue;
      if (!spendingByState.has(state)) spendingByState.set(state, {});
      spendingByState.get(state)[period] = value;
    }
  } catch (error) {
    console.warn('Could not load state spending comparisons:', error);
  }
}

function showStateSpendingDifference(state) {
  selectedSpendState = state || 'All states';
  const panel = document.getElementById('chart11-change');
  if (!panel) return;
  const values = spendingByState.get(selectedSpendState);
  const before = values?.['Jun 2025'];
  const after = values?.['Jun 2026'];
  if (!Number.isFinite(before) || !Number.isFinite(after)) {
    panel.hidden = true;
    panel.replaceChildren();
    return;
  }
  const delta = Math.round((after - before + Number.EPSILON) * 100) / 100;
  const percent = delta / before * 100;
  const money = value => `A$${value.toFixed(2)}`;
  const signed = value => `${value >= 0 ? '+' : '-'}A$${Math.abs(value).toFixed(2)}`;
  const heading = document.createElement('strong');
  heading.textContent = `${selectedSpendState}: ${signed(delta)} per trip (${percent >= 0 ? '+' : '-'}${Math.abs(percent).toFixed(1)}%)`;
  const context = document.createElement('span');
  context.className = 'change-baseline';
  context.textContent = `Jun 2025 ${money(before)} -> Jun 2026 ${money(after)}`;
  panel.replaceChildren(heading, context);
  panel.hidden = false;
}

function prepareResponsiveSpec(number, original, availableWidth) {
  const spec = JSON.parse(JSON.stringify(original));
  const contentWidth = Math.max(260, Math.floor(availableWidth));
  const forceBottom = bottomLegendCharts.has(number);
  const overlayLegend = number === 12; // Chart 13: legend inside plot, top-right.
  const legendOnRight = nativeLegendCharts.has(number) && !forceBottom && !overlayLegend && contentWidth >= 480;
  spec.config = spec.config || {};
  spec.config.legend = {
    ...(spec.config.legend || {}),
    labelFont: 'Calibri, Arial, sans-serif',
    titleFont: 'Times New Roman, Times, serif',
    labelFontSize: 13,
    titleFontSize: 14,
    titleLimit: legendOnRight ? 110 : 155,
    labelLimit: legendOnRight ? 110 : 145,
    offset: 8,
    fillColor: '#F7FBF9',
    strokeColor: '#C7D9D0',
    cornerRadius: 9,
    padding: 10,
    layout: {
      ...((spec.config.legend || {}).layout || {}),
      bottom: {anchor: 'middle', center: true, direction: 'horizontal', margin: 10}
    }
  };
  spec.config.axis = {...(spec.config.axis || {}), labelFontSize:13, titleFontSize:14};
  spec.config.header = {...(spec.config.header || {}), labelFontSize:15, titleFontSize:15};
  // Override chart-local tiny axis labels for consistency.
  function enlargeAxes(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [k,v] of Object.entries(obj)) {
      if (k === 'axis' && v && typeof v === 'object') {
        v.labelFontSize = 13;
        v.titleFontSize = 14;
      } else if (!['data','tooltip','config'].includes(k)) enlargeAxes(v);
    }
  }
  enlargeAxes(spec);
    // Move native colour/size legends beside their marks when width permits.
  // Never create duplicate legends for maps that already have HTML side keys.
  function positionLegends(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      if (['color', 'size', 'strokeWidth'].includes(key) && value && typeof value === 'object' && value.legend && typeof value.legend === 'object') {
        value.legend.orient = overlayLegend ? 'top-right' : forceBottom ? 'bottom' : legendOnRight ? 'right' : 'bottom';
        value.legend.direction = overlayLegend ? 'vertical' : forceBottom ? 'horizontal' : legendOnRight ? 'vertical' : 'horizontal';
        value.legend.titleLimit = legendOnRight ? 105 : 150;
        value.legend.labelLimit = legendOnRight ? 105 : 145;
        value.legend.offset = overlayLegend ? 6 : 8;
        value.legend.fillColor = '#F7FBF9';
        value.legend.strokeColor = '#C7D9D0';
        value.legend.cornerRadius = 9;
        value.legend.padding = 10;
        value.legend.labelFontSize = 13;
        value.legend.titleFontSize = 14;
        if (value.legend.orient === 'bottom') {
          value.legend.direction = 'horizontal';
        }
        if (forceBottom) {
          value.legend.title = number === 6 ? 'Index (state avg = 1.00)' : null; // Keep heatmap units.
          value.legend.symbolSize = 90;
          value.legend.labelLimit = 135;
        }
        if (value.type === 'quantitative' && key === 'color') {
          value.legend.gradientLength = number === 6 ? Math.max(130, Math.min(235, contentWidth - 160)) : legendOnRight ? 132 : 190;
          value.legend.gradientThickness = 12;
        }
      } else if (key !== 'data' && key !== 'tooltip') {
        positionLegends(value);
      }
    }
  }
  positionLegends(spec);

  // Faceted charts have separate plot widths for each state. Their facet
  // count must change on small screens to avoid eight horizontal panels.
  if (number === 5) {
    const columns = contentWidth >= 800 ? 4 : contentWidth >= 450 ? 2 : 1;
    // Reserve space for each independent y-axis, state label and facet gaps.
    // The available full-row width determines the actual size of each plot.
    const axisAllowancePerFacet = columns === 4 ? 60 : 52;
    const gap = 14;
    const outerPadding = 32;
    const innerWidth = Math.max(115, Math.min(270,
      Math.floor((contentWidth - outerPadding - columns * axisAllowancePerFacet - (columns - 1) * gap) / columns)
    ));
    spec.columns = columns;
    spec.spec.width = innerWidth;
    spec.spec.height = columns === 4 ? 154 : columns === 2 ? 145 : 120;
    spec.spec.encoding.x.axis.labelFontSize = columns === 4 ? 12 : 12;
    spec.spec.encoding.y.axis.labelFontSize = columns === 4 ? 12 : 12;
    spec.config = spec.config || {};
    spec.config.facet = {...(spec.config.facet || {}), spacing: 14};
    spec.config.font = 'Calibri, Arial, sans-serif';
    spec.config.title = {...(spec.config.title || {}), font: 'Times New Roman, Times, serif', fontSize: 19, fontWeight:'normal', anchor:'middle'};
    return spec;
  }

  // Leave comfortable space for axes, titles, endpoint annotations and any
  // internal legends. For maps, legends are below / alongside the plots.
  const reserve = geoCharts.has(number) ? 18 : number === 13 ? 60 : [7, 8, 10, 11, 12].includes(number) ? 81 : 65;
  const legendReserve = legendOnRight ? (number === 6 ? 126 : number === 4 ? 130 : 116) : 0;
  const targetWidth = Math.max(210, Math.min(maximumWidths[number], contentWidth - reserve - legendReserve));
  const originalWidth = typeof original.width === 'number' ? original.width : targetWidth;
  const originalHeight = typeof original.height === 'number' ? original.height : 310;
  spec.width = Math.round(targetWidth);

  if (geoCharts.has(number)) {
    const factor = targetWidth / originalWidth;
    const height = Math.max(205, Math.min(425, Math.round(originalHeight * Math.max(0.65, factor))));
    spec.height = number === 3
      ? Math.max(270, Math.min(385, Math.round(targetWidth * 0.82)))
      : height;
    // Compact map marks to avoid circles/lines covering everything.
    if (number === 2 && spec.layer?.[1]?.encoding?.size?.scale) {
      spec.layer[1].encoding.size.scale.range = [40, Math.round(1900 * Math.min(1, factor))];
    }
    if (number === 3 && spec.layer?.[1]?.encoding?.strokeWidth?.scale) {
      spec.layer[1].encoding.strokeWidth.scale.range = [0.6, Math.max(3, Math.round(9 * Math.min(1, factor)))];
    }
    if (spec.projection && typeof spec.projection.scale === 'number') {
      // Keep geographic proportions consistent when the map grows/shrinks.
      const verticalFactor = height / originalHeight;
      // Give the flow map more visual emphasis; it has no axis labels.
      const scaleBoost = number === 3 ? 1.12 : 1;
      spec.projection.scale = Math.round(original.projection.scale * Math.min(factor, verticalFactor) * scaleBoost);
    }
  } else {
    // Use wider, moderately tall charts for full-width panels, rather than
    // stretching all marks and font sizes into oversized plots.
    spec.height = Math.round(originalHeight);
    if (number === 13) spec.height = 230;
  }
  // Use serif titles and Calibri axis/legend labels consistently.
  spec.config = spec.config || {};
  spec.config.font = 'Calibri, Arial, sans-serif';
  spec.config.title = {...(spec.config.title || {}), font: 'Times New Roman, Times, serif', fontSize: 19, fontWeight:'normal', anchor:'middle'};
  return spec;
}

async function renderChart(number) {
  const node = document.getElementById(`chart${number}`);
  const base = baseSpecs.get(number);
  if (!node || !base) return;
  const width = Math.floor(node.getBoundingClientRect().width);
  if (width <= 0 || (lastSizes.get(number) === width && node.querySelector('svg'))) return;
  lastSizes.set(number, width);
  const spec = prepareResponsiveSpec(number, base, width);
  // For Chart 11, discard stale controls from the previous render before
  // Vega recreates the state dropdown inside its chart container.
  const chart11FilterSlot = number === 8 ? document.getElementById('chart11-filter-slot') : null;
  if (chart11FilterSlot) {
    chart11FilterSlot.replaceChildren();
    const param = spec.params?.find(param => param.name === 'focusSpendState');
    if (param) param.value = selectedSpendState;
  }
  // Keep only the numbered heading above the card; no repeated Vega plot title.
  delete spec.title;
  if (spec.title) {
    spec.config.title = {...(spec.config.title || {}), fontSize: width < 410 ? 17 : 19,
                         fontWeight: 'normal', anchor: 'middle'};
  }
  if (number === 13 && spec.layer?.[0]?.encoding?.x?.axis) {
    spec.layer[0].encoding.x.axis.labelAngle = -48;
    spec.layer[0].encoding.x.axis.labelFontSize = 12;
    spec.layer[0].encoding.x.axis.labelLimit = 90;
  }
  if (number === 2) {
    // Custom park-colour/size key sits beside this chart in the HTML.
    if (spec.layer?.[1]?.encoding?.size) spec.layer[1].encoding.size.legend = null;
    if (spec.layer?.[1]?.encoding?.color) spec.layer[1].encoding.color.legend = null;
  }
  if (number === 3) {
    // Chart 03 intentionally has no legend; insight text explains thickness.
    if (spec.layer?.[1]?.encoding?.strokeWidth) spec.layer[1].encoding.strokeWidth.legend = null;
    if (spec.layer?.[1]?.encoding?.color) spec.layer[1].encoding.color.legend = null;
  }
  try {
    await vegaEmbed(node, spec, {
      mode: 'vega-lite',
      renderer: 'svg',
      actions: false,
      tooltip: {theme: 'light'},
      hover: true
    });
    // Move Chart 11's live Vega dropdown next to its custom year legend.
    // Re-parenting preserves Vega's existing control event handlers.
    if (chart11FilterSlot) {
      const bindings = node.querySelector('.vega-bindings') ||
        node.closest('article')?.querySelector('.vega-bindings');
      if (bindings) {
        chart11FilterSlot.appendChild(bindings);
        const stateSelect = bindings.querySelector('select');
        if (stateSelect) {
          // The existing Vega binding keeps highlighting the selected state.
          // Our listener only updates the additional data-derived delta panel.
          stateSelect.addEventListener('change', () =>
            showStateSpendingDifference(stateSelect.value)
          );
          showStateSpendingDifference(stateSelect.value);
        }
      }
    }
  } catch (error) {
    node.innerHTML = '<p class="error">This chart could not load. Check the browser console, dataset URL, and your internet connection.</p>';
    console.error(`Vega-Lite chart ${number} failed`, error);
  }
}

async function startDashboard() {
  await loadStateSpending();
  await Promise.all(chartOrder.map(async number => {
    const filename = chartFiles[number];
    const url = `js/${encodeURIComponent(filename)}?v=${LAYOUT_BUILD}`;
    try {
      const result = await fetch(url, {cache: "no-store"});
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      baseSpecs.set(number, await result.json());
    } catch (error) {
      if (number === 6) {
        // Incomplete uploads sometimes omit the original spaced filename.
        // The inline copy lets Chart 10 render with its full interactions.
        baseSpecs.set(number, JSON.parse(JSON.stringify(heatmapSpecFallback)));
        console.warn('Heatmap JSON could not load; using packaged fallback:', url, error);
      } else {
        const node = document.getElementById(`chart${number}`);
        if (node) node.innerHTML = '<p class="error">Missing Vega-Lite specification. Check the JSON filename and server.</p>';
        console.error(url, error);
      }
    }
  }));
  await Promise.all(chartOrder.map(number => renderChart(number)));
}

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    chartOrder.forEach(number => renderChart(number));
  }, 220);
});

startDashboard();
