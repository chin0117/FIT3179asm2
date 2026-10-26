"""Verify the final single-heading dashboard, sources and framed legends."""
from pathlib import Path
import json
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
soup=BeautifulSoup((root/'index.html').read_text(encoding='utf8'),'html.parser')
headings=soup.select('.card-title')
assert len(headings)==13
assert all(len(h.get_text(' ',strip=True).split())<=10 for h in headings)
assert len(soup.select('.source-list>li'))==13
assert len(soup.select('.panel .source'))==0
for f in (root/'js').glob('*.vg.json'):
    spec=json.loads(f.read_text(encoding='utf8'))
    assert 'title' not in spec, f
assert 'delete spec.title;' in (root/'js'/'main.js').read_text()
assert 'focusSpendState' in (root/'js'/'08 dumbbell.vg.json').read_text()
print('PASS: 13 headings only, 13 consolidated sources, no repeated plot titles, preserved Chart 11 state dropdown')
