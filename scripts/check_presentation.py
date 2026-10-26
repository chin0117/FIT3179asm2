"""Verify presentation and links for the 26 October 2026 final dashboard."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
root = Path(__file__).resolve().parents[1]
soup = BeautifulSoup((root / 'index.html').read_text(encoding='utf8'), 'html.parser')
headings = soup.select('.card-title')
assert len(headings) == 13
assert all(len(h.get_text(' ', strip=True).split()) <= 10 for h in headings)
assert len(soup.select('.source-list > li')) == 6
assert len(soup.select('.source-list a[href^="https://"]')) == 6
assert len(soup.select('.panel .source')) == 0
assert not soup.select('.micro-notes .interaction-tip')
assert soup.select_one('.authorship').get_text(' ', strip=True) == 'Create by: Chin Hui Ni'
assert soup.select_one('.last-modified').get_text(' ', strip=True) == 'Last modified: 26 October 2026'
assert soup.select_one('.chapter-conclusion h3').get_text(' ', strip=True) == 'Conclusion'
assert soup.select_one('.chapter-methods h3').get_text(' ', strip=True) == 'Data sources'
assert 'interpretation' not in soup.select_one('.chapter-methods').get_text(' ', strip=True).lower()
assert soup.select_one('#chart11-filter-slot')
assert not soup.select_one('#chart10').find_parent('article').select('.boxplot-key')
for f in (root / 'js').glob('*.vg.json'):
    spec = json.loads(f.read_text(encoding='utf8'))
    assert 'title' not in spec, f
assert 'delete spec.title;' in (root / 'js' / 'main.js').read_text()
chart11 = json.loads((root / 'js' / '08 dumbbell.vg.json').read_text())
assert chart11['layer'][1]['encoding']['color']['legend'] is None
assert chart11.get('params')
chart12 = json.loads((root / 'js' / '10 boxplot.vg.json').read_text())
assert not chart12.get('params')
assert 'boxState' not in json.dumps(chart12)
chart6 = json.loads((root / 'js' / '07 slope chart.vg.json').read_text())
assert chart6['encoding']['color']['legend']['orient'] == 'bottom'
assert chart6['layer'][2]['encoding']['text']['field'] == 'visitor_increase'
assert 'joinaggregate' in chart6['layer'][2]['transform'][0]
print('PASS: 13 charts, Chart 6 growth labels/legend, conclusion, 6 source links, authorship and controls')
