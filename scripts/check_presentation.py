"""Lightweight checks for chart titles, boxed legends, and saved files."""
from pathlib import Path
import json, re
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
soup=BeautifulSoup((root/'index.html').read_text(),'html.parser')
heading=soup.select('.card-title')
assert len(heading)==13
for h in heading:
 assert len(h.get_text(' ',strip=True).split())<=10, h.text
for p in sorted((root/'js').glob('*.vg.json')):
 data=json.loads(p.read_text())
 assert isinstance(data.get('title'),str) and '\n' not in data['title'],p
 assert len(data['title'].split()) <= 10, (p,data['title'])
 conf=data.get('config',{})
 assert conf.get('title',{}).get('fontWeight')=='normal',p
 assert conf.get('legend',{}).get('fillColor'),p
 assert conf.get('legend',{}).get('strokeColor'),p
 assert conf.get('axis',{}).get('labelFontSize',0) >= 13,p
spend=json.loads((root/'js'/'08 dumbbell.vg.json').read_text())
assert 'spendXZoom' not in str(spend)
assert any(x.get('name')=='focusSpendState' for x in spend['params'])
print('PASS: 13 short titles, normal-weight typography, framed legends, larger axis labels, stable Chart 11 dropdown.')
