/* FIT3179 - one Vega-Lite specification per chart. Keep IDs matched to HTML chart containers. */
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
};
const chartOrder = [1, 2, 3, 4, 7, 11, 9, 5, 6, 8, 10, 12];
for (const number of chartOrder) {
  const selector = `#chart${number}`;
  const source = `js/${encodeURIComponent(chartFiles[number])}`;
  vegaEmbed(selector, source, {
    renderer: "svg",
    actions: { export: true, source: true, compiled: false, editor: false },
    tooltip: { theme: "light" },
    hover: true
  }).catch((error) => {
    const node = document.querySelector(selector);
    if (node) {
      node.innerHTML = '<p class="error">The chart could not load. Check its JSON filename and data URL, run a local web server, and inspect the browser console.</p>';
    }
    console.error(`Vega-Lite chart ${number} failed:`, error);
  });
}
