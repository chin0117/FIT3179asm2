/* FIT3179: responsive Vega-Lite chart loader.
 * Uses the original 12 editable Vega-Lite specifications and re-computes only
 * their presentation dimensions; data/encodings remain unchanged.
 */
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
  12: "12 grouped bar.vg.json"
};
const chartOrder = [1, 2, 3, 4, 7, 11, 9, 5, 6, 8, 10, 12];
const baseSpecs = new Map();
const lastSizes = new Map();
const maximumWidths = {
  1: 900, 2: 900, 3: 960, 4: 950, 6: 680,
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
    const columns = contentWidth >= 760 ? 4 : contentWidth >= 440 ? 2 : 1;
    const estimatedAxisAndHeading = 65; // pixels per small plot
    const gap = 14;
    const innerWidth = Math.max(112, Math.min(184,
      Math.floor((contentWidth - 40 - columns * estimatedAxisAndHeading - (columns - 1) * gap) / columns)
    ));
    spec.columns = columns;
    spec.spec.width = innerWidth;
    spec.spec.height = columns === 4 ? 132 : 120;
    return spec;
  }

  // Leave comfortable space for axes, titles, endpoint annotations and any
  // internal legends. For maps, legends are below / alongside the plots.
  const reserve = geoCharts.has(number) ? 48 : [7, 8, 10, 11, 12].includes(number) ? 94 : 78;
  const targetWidth = Math.max(230, Math.min(maximumWidths[number], contentWidth - reserve));
  const originalWidth = typeof original.width === 'number' ? original.width : targetWidth;
  const originalHeight = typeof original.height === 'number' ? original.height : 310;
  spec.width = Math.round(targetWidth);

  if (geoCharts.has(number)) {
    const factor = targetWidth / originalWidth;
    const height = Math.max(250, Math.min(520, Math.round(originalHeight * Math.max(0.70, factor))));
    spec.height = height;
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
  try {
    await vegaEmbed(node, spec, {
      mode: 'vega-lite',
      renderer: 'svg',
      actions: {export: true, source: true, compiled: false, editor: false},
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
    const url = `js/${encodeURIComponent(filename)}`;
    try {
      const result = await fetch(url);
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
