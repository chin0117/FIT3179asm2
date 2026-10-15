/* One Vega-Lite JSON file per idiom. The order below is deliberately narrative. */
const chartNumbers = [1, 2, 3, 4, 7, 9, 11, 5, 6, 8, 10, 12];
for (const number of chartNumbers) {
  const selector = `#chart${number}`;
  vegaEmbed(selector, `js/${number}.vg.json`, {
    renderer: "svg",
    actions: { export: true, source: true, compiled: false, editor: false },
    tooltip: { theme: "light" },
    hover: true
  }).catch((error) => {
    const node = document.querySelector(selector);
    if (node) {
      node.innerHTML = '<p class="error">The visualisation could not load. Open this project through VS Code Live Server (not file://), check your internet connection for CDN/GeoJSON resources, and see the browser Console for details.</p>';
    }
    console.error(`Vega-Lite chart ${number} failed:`, error);
  });
}
