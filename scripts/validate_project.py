"""Quick structural verification of the 12 Vega-Lite JSON specs and local CSV links.
Run: python scripts/validate_project.py
Does not replace an actual browser-rendering test.
"""
import json
import re
from pathlib import Path

root=Path(__file__).resolve().parents[1]
failures=[]
for num in range(1,13):
    path=root/'js'/f'{num}.vg.json'
    try:
        spec=json.loads(path.read_text('utf-8'))
        if 'vega-lite/v5.json' not in spec.get('$schema',''):
            failures.append(f'{path.name}: invalid Vega-Lite version')
        for relative in set(re.findall(r'data/[\w.-]+\.csv',path.read_text('utf-8'))):
            if not (root / relative).exists():
                failures.append(f'{path.name}: missing {relative}')
    except Exception as e:
        failures.append(f'{path.name}: {e}')
if failures:
    print('\n'.join(failures))
    raise SystemExit(1)
print('PASS: 12 readable Vega-Lite v5 JSON specs and referenced local CSV files exist.')
