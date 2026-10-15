"""Recalculate the six derived CSVs from the included source CSVs.

Run from project root: python scripts/prepare_data.py
No third-party Python packages are required.
"""
from pathlib import Path
import csv

DATA = Path(__file__).resolve().parents[1] / 'data'

def load(name):
    with (DATA / name).open(newline='', encoding='utf-8-sig') as stream:
        return list(csv.DictReader(stream))

def export(name, columns, records):
    with (DATA / name).open('w', newline='', encoding='utf-8') as stream:
        writer = csv.DictWriter(stream, fieldnames=columns)
        writer.writeheader()
        writer.writerows(records)
    print(f'Updated data/{name} ({len(records)} records)')

nature = load('nature_visitors.csv')
rename = {'International':'International','Domestic_overnight':'Domestic overnight','Domestic_day':'Domestic day'}
endpoints = []
for old, new in rename.items():
    for row in nature:
        if row['Year'] in ('2008','2015'):
            endpoints.append({'type':new,'year':row['Year'],'visitors_m':row[old]})
export('nature_endpoints.csv',['type','year','visitors_m'],endpoints)

first = next(r for r in nature if r['Year']=='2008')
last = next(r for r in nature if r['Year']=='2015')
start = sum(float(first[key]) for key in rename)
finish = sum(float(last[key]) for key in rename)
steps = [{'step':'2008 total','start':0,'end':round(start,3),'delta':round(start,3),'kind':'total','order':0}]
running = start
for order, key in enumerate(['Domestic_day','Domestic_overnight','International'], start=1):
    change = float(last[key]) - float(first[key])
    steps.append({'step':rename[key], 'start':round(running,3), 'end':round(running+change,3),'delta':round(change,3),'kind':'increase' if change>=0 else 'decrease','order':order})
    running += change
steps.append({'step':'2015 total','start':0,'end':round(finish,3),'delta':round(finish-start,3),'kind':'total','order':4})
assert abs(running-finish)<1e-5
export('waterfall_nature.csv',['step','start','end','delta','kind','order'],steps)

trips = {r['state']:r for r in load('day_trips_quarterly.csv')}
spend = []
for r in load('day_trip_expenditure.csv'):
    for year in ('2025','2026'):
        spend.append({'state':r['state'],'period':f'Jun {year}',
                      'spend_per_trip_aud':round(float(r[f'Q2_{year}'])/float(trips[r['state']][f'q2_{year}'])*1000,2)})
export('spend_per_trip.csv',['state','period','spend_per_trip_aud'],spend)

overnight = {(r['state'],r['quarter']):float(r['trips']) for r in load('overnight_trips_quarterly.csv')}
length = [{'state':r['state'],'quarter':r['quarter'],
           'average_nights':round(float(r['nights'])/overnight[(r['state'],r['quarter'])],3)}
          for r in load('visitor_nights_quarterly.csv')]
export('trip_length.csv',['state','quarter','average_nights'],length)

parks = sorted(load('nsw_parks.csv'), key=lambda r: float(r['visitors']))
park_total = sum(float(r['visitors']) for r in parks)
cumulative = 0
rows = [{'park_share':0,'visits_share':0,'equality_share':0,'park':'Start'}]
for position, r in enumerate(parks, start=1):
    cumulative += float(r['visitors'])
    portion = round(position / len(parks) * 100,3)
    rows.append({'park_share':portion,'visits_share':round(cumulative/park_total*100,3),
                 'equality_share':portion,'park':r['park']})
export('park_concentration.csv',['park_share','visits_share','equality_share','park'],rows)

positions = {}; corridors = {}
for r in load('interstate_flows.csv'):
    origin,destination = r['flow'].split('-')
    if int(r['order']) != 0:
        continue
    positions[origin] = (float(r['lon']),float(r['lat']))
    pair = tuple(sorted([origin,destination]))
    corridors[pair] = corridors.get(pair,0)+float(r['trips'])
rows = []
for (state_a,state_b), trips_000 in sorted(corridors.items(),key=lambda item:-item[1]):
    if state_a not in positions or state_b not in positions:
        continue
    for i,state in enumerate((state_a,state_b)):
        lon,lat=positions[state]
        rows.append({'corridor':f'{state_a}-{state_b}','state':state,'lon':lon,'lat':lat,
                     'point_order':i,'two_way_trips_000':round(trips_000,2)})
export('two_way_corridors.csv',['corridor','state','lon','lat','point_order','two_way_trips_000'],rows)
