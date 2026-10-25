"""Check current dashboard JSON specs and local input paths; does not render charts."""
import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
files = {1: '01 choropleth.vg.json', 2: '02 proportional symbol.vg.json', 3: '03 flow map.vg.json', 4: '04 streamgraph.vg.json', 5: '05 small multiple.vg.json', 6: '06 heatmap.vg.json', 7: '07 slope chart.vg.json', 8: '08 dumbbell.vg.json', 9: '09 waterfall.vg.json', 10: '10 boxplot.vg.json', 11: '11 line.vg.json', 12: '12 grouped bar.vg.json'}
failures=[]
for id,filename in files.items():
    path=root/'js'/filename
    try:
        spec=json.loads(path.read_text(encoding='utf-8'))
        if 'vega-lite/v5.json' not in spec.get('$schema',''):
            failures.append(f'{filename}: not Vega-Lite v5')
        for ref in re.findall(r'data/[\w.-]+\.csv',path.read_text(encoding='utf-8')):
            if not (root/ref).is_file():failures.append(f'{filename}: missing {ref}')
    except Exception as e:failures.append(f'{filename}: {e}')
if failures:
    print('\n'.join(failures));raise SystemExit(1)
print(f'PASS: {len(files)} Vega-Lite v5 JSON files are parseable and their local CSV links exist.')
