# Australian Nature-based Tourism - Improved Vega-Lite Project

This is the improved version of the supplied `nature_tourism_viz_fixed.zip`. There are **12 independently editable Vega-Lite v5 charts**, **3 different map idioms**, and **at least 8 advanced chart candidates**. Chart 5 contains eight faceted panels but is counted as **one** idiom.

## Run in VS Code

1. Extract this whole ZIP (do not open `index.html` inside the ZIP).
2. Open the resulting `nature_tourism_improved` folder in VS Code.
3. Right-click **index.html** and choose **Open with Live Server**. Alternatively, open a terminal in this directory and run `python -m http.server 8000`; visit `http://localhost:8000/`.
4. Keep an internet connection for the Vega, Vega-Lite, Vega Embed libraries and the states GeoJSON basemap. CSV datasets and visualisation specs are stored locally.
5. Modify `js/1.vg.json` through `js/12.vg.json` to edit each Vega-Lite specification; `index.html` describes the visualisations and `js/main.js` embeds them.

## The 12 idioms

| No. | Idiom | Classification to propose | Source / question |
|---|---|---|---|
| 01 | Choropleth state map | Advanced, map 1 | Jun 2026 day-trip destinations; all purposes |
| 02 | Proportional-symbol park map | Advanced, map 2 | FY2024-25 NSW park visits; nature-specific |
| 03 | Interstate link/flow map | Advanced, map 3 | YE Dec 2024 interstate overnight trips; all purposes |
| 04 | Centred streamgraph | Advanced | Historical nature visitor mix, 2008-2015 |
| 05 | Faceted/small-multiple line chart | Treat conservatively as basic | Five quarterly overnight-trip observations by state |
| 06 | State × quarter heatmap | Advanced | Demand relative to each state's five-quarter mean |
| 07 | Nature visitor slope chart | Advanced | Nature visitor segments, 2008 versus 2015 |
| 08 | Layered dumbbell chart | Advanced | Day-trip spend per trip in 2025 versus 2026 |
| 09 | Additive waterfall chart | Advanced | Decomposes 2008-2015 nature visitor segment changes |
| 10 | Box-and-whisker chart | Advanced | Average nights per trip over five quarters |
| 11 | Lorenz concentration curve | Advanced candidate; may be called a line-based analytical chart | Distribution of FY2024-25 visits within 10 leading parks |
| 12 | Grouped bar chart | Basic | Overall reasons for domestic overnight travel |

**Conservative advanced count excluding Lorenz, faceted lines and the grouped bar: 9** (maps 1-3; streamgraph 4; heatmap 6; slope 7; dumbbell 8; waterfall 9; boxplot 10). If the instructor treats a streamgraph as a basic area chart, 8 still remain. Ask your instructor if their idiom taxonomy treats slope/dumbbell as separate advanced designs.

## Dataset-to-idiom relationships

- `data/nature_visitors.csv`: original historical nature-participation observations; Charts 04, 07, 09.
- `data/nsw_parks.csv`: NSW NPWS reported **park visits** in 2024-25; Charts 02, 11. The lat/lon fields are approximations of park locations, not boundaries.
- `data/day_trips_quarterly.csv`: by destination state; Chart 01 and numerator/denominator inputs to Chart 08.
- `data/day_trip_expenditure.csv`: Chart 08.
- `data/interstate_flows.csv`: original directed counts; Chart 03 uses `data/two_way_corridors.csv`, which adds reverse-direction pairs for an undirected geographic corridor representation.
- `data/overnight_trips_quarterly.csv`: Chart 05; also denominator for Chart 10.
- `data/visitor_nights_quarterly.csv`: Chart 06; also numerator for Chart 10.
- `data/reason_of_visit.csv`: Chart 12.
- `data/nature_endpoints.csv`, `data/waterfall_nature.csv`, `data/spend_per_trip.csv`, `data/trip_length.csv`, `data/park_concentration.csv`, `data/two_way_corridors.csv`: generated from the above CSVs in the original uploaded project. Derivations are described below.
- `source_datasets/` contains copies of the user-provided source files.

## Calculation details

- **Day-trip spend per trip in AUD** = expenditure in $M × 1,000,000 / day trips measured in '000 × 1,000 = `expenditure_M / trips_000 × 1,000`.
- **Average nights per overnight trip** = visitor nights ('000) / trips ('000) in the same state-quarter.
- **Relative quarterly demand** = visitor nights for a state-quarter / mean visitor nights for that state across the five available quarters.
- **Waterfall** = start 2008 sum of *reported segment counts*; add the change in domestic day, domestic overnight, international; end at the 2015 segment sum. These figures are **not unique people**. Original provided chart 09 contained an unsourced hard-coded 2025-26 waterfall and was replaced.
- **Lorenz** = sort the ten parks from lowest to highest visits; compare cumulative share of their total visits against cumulative share of the ten parks. It does **not** describe all NSW parks.
- **Interstate corridor map** = add trips for A to B and B to A once per state pair, then draw a single straight connector. It does not show directional imbalance or road route.

## Caveats to state in your report

1. Only five visuals (02, 04, 07, 09, 11) directly measure the nature-based topic. The other seven describe background domestic travel trends. The strongest possible future improvement is to obtain more **recent nature-based activity participation by state, region, year and visitor segment** so that the maps show nature-specific rates rather than all-purpose demand.
2. The 2008-2015 visitor data and 2024-25 NSW park visit data refer to different populations, units and periods. Do **not** connect them as a continuous growth trend or claim causation.
3. NSW reported **visits**, not unique people; repeat visits are counted. The 2024-25 ten-park total is a subtotal, not all NSW parks.
4. DoTS (starting January 2025) replaced the National Visitor Survey. TRA cautions when comparing backcast NVS and DoTS estimates.
5. For overnight tourism, destination-state estimates are not necessarily additive to the national total, including where travellers visit more than one destination state. Similarly, do not assume tourism reason estimates are mutually exclusive without reviewing source footnotes.
6. Five quarterly observations do not support strong seasonality conclusions.
7. Charts and transformations in Vega-Lite JSON were validated structurally, but a full browser rendering test was not available in this environment. Use Live Server and inspect Console for unexpected chart errors.

## Source references

- Tourism Research Australia, **Domestic Tourism Statistics June quarter 2026**: https://www.tra.gov.au/en/tourism-statistics/domestic-tourism-statistics-results
- Destination NSW, **Top 10 most-visited national parks in NSW**, published 13 July 2026: https://www.destinationnsw.com.au/newsroom/top-10-most-visited-national-parks-in-nsw
- Australian Government, **2016 State of the Environment (Coasts), nature visitors, 2008-2015**: https://www.data.gov.au/data/dataset/2016-soe-coasts-annual-proportion-of-visitors-by-type-of-nature-activity-2008to15
- State map boundaries: https://github.com/rowanhogan/australian-states (runtime GeoJSON download).
- Vega-Lite map projections: https://vega.github.io/vega-lite/docs/projection.html

### Optional next improvement

Download the *annual proportion of visitors by type of nature activity* CSV that is cited in the original source dataset and add a nature-activity heatmap (bushwalking, national parks, wildlife watching) by international / domestic overnight / domestic day visitors. That would deepen the behaviour story more than adding additional generic-tourism charts.

## Reproducing calculated data

Run `python scripts/prepare_data.py` from the project root to regenerate all six derived CSV datasets from the original input files. Run `python scripts/validate_project.py` to check that the 12 Vega-Lite specs are parseable JSON and the referenced local CSVs exist. These checks do not validate the rendered output in a browser.
