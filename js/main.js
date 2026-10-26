/* FIT3179: responsive Vega-Lite chart loader.
 * Uses the original 12 editable Vega-Lite specifications and re-computes only
 * their presentation dimensions; data/encodings remain unchanged.
 */
const LAYOUT_BUILD = "colours-boxlabels-20261026";
const chartFiles = {
  1: "01 choropleth.vg.json",
  2: "02 proportional symbol.vg.json",
  3: "03 flow map.vg.json",
  4: "04 streamgraph.vg.json",
  5: "05 small multiple.vg.json",
  6: "06 heatmap.vg.json",
  7: "07 slope chart.vg.json",
  8: "08 dumbbell.vg.json",
  9: "09 waterfall.vg.json",
  10: "10 boxplot.vg.json",
  11: "11 line.vg.json",
  12: "12 grouped bar.vg.json",
  13: "13 park pareto.vg.json"
};
const chartOrder = [1, 2, 3, 13, 4, 7, 11, 9, 5, 6, 8, 10, 12];
const baseSpecs = new Map();
const lastSizes = new Map();
const maximumWidths = {
  1: 780, 2: 780, 3: 780, 4: 950, 6: 680, 13: 980,
  7: 510, 8: 525, 9: 880, 10: 525, 11: 510, 12: 525
};
const geoCharts = new Set([1, 2, 3]);
let resizeTimeout;

function prepareResponsiveSpec(number, original, availableWidth) {
  const spec = JSON.parse(JSON.stringify(original));
  const contentWidth = Math.max(260, Math.floor(availableWidth));

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
    spec.spec.encoding.x.axis.labelFontSize = columns === 4 ? 10 : 9;
    spec.spec.encoding.y.axis.labelFontSize = columns === 4 ? 10 : 9;
    spec.config = spec.config || {};
    spec.config.facet = {...(spec.config.facet || {}), spacing: 14};
    spec.config.font = 'Calibri, Arial, sans-serif';
    spec.config.title = {...(spec.config.title || {}), font: 'Times New Roman, Times, serif', fontSize: 15};
    return spec;
  }

  // Leave comfortable space for axes, titles, endpoint annotations and any
  // internal legends. For maps, legends are below / alongside the plots.
  const reserve = geoCharts.has(number) ? 22 : number === 13 ? 86 : [7, 8, 10, 11, 12].includes(number) ? 94 : 78;
  const targetWidth = Math.max(230, Math.min(maximumWidths[number], contentWidth - reserve));
  const originalWidth = typeof original.width === 'number' ? original.width : targetWidth;
  const originalHeight = typeof original.height === 'number' ? original.height : 310;
  spec.width = Math.round(targetWidth);

  if (geoCharts.has(number)) {
    const factor = targetWidth / originalWidth;
    const height = Math.max(205, Math.min(425, Math.round(originalHeight * Math.max(0.65, factor))));
    spec.height = height;
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
      spec.projection.scale = Math.round(original.projection.scale * Math.min(factor, verticalFactor));
    }
  } else {
    // Use wider, moderately tall charts for full-width panels, rather than
    // stretching all marks and font sizes into oversized plots.
    spec.height = Math.round(originalHeight);
  }
  // Use serif titles and Calibri axis/legend labels consistently.
  spec.config = spec.config || {};
  spec.config.font = 'Calibri, Arial, sans-serif';
  spec.config.title = {...(spec.config.title || {}), font: 'Times New Roman, Times, serif', fontSize: 15};
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
  if ([1,2,3,13].includes(number)) spec.title = null;
  if (number === 13 && spec.layer?.[0]?.encoding?.x?.axis) {
    spec.layer[0].encoding.x.axis.labelAngle = -48;
    spec.layer[0].encoding.x.axis.labelFontSize = 9;
    spec.layer[0].encoding.x.axis.labelLimit = 90;
  }
  if (number === 2) {
    if (spec.layer?.[1]?.encoding?.size) spec.layer[1].encoding.size.legend = null;
    if (spec.layer?.[1]?.encoding?.color) spec.layer[1].encoding.color.legend = null;
  }
  if (number === 3) {
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
  } catch (error) {
    node.innerHTML = '<p class="error">This chart could not load. Check the browser console, dataset URL, and your internet connection.</p>';
    console.error(`Vega-Lite chart ${number} failed`, error);
  }
}

async function startDashboard() {
  await Promise.all(chartOrder.map(async number => {
    const filename = chartFiles[number];
    const url = `js/${encodeURIComponent(filename)}?v=${LAYOUT_BUILD}`;
    try {
      const result = await fetch(url, {cache: "no-store"});
      if (!result.ok) throw new Error(`HTTP ${result.status}`);
      baseSpecs.set(number, await result.json());
    } catch (error) {
      const node = document.getElementById(`chart${number}`);
      if (node) node.innerHTML = '<p class="error">Missing Vega-Lite specification. Check the JSON filename and server.</p>';
      console.error(url, error);
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
