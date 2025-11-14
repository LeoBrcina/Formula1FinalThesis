# plot_strategy_ranked.py

import requests
import fastf1
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ─── Parameters ─────────────────────────────────────────────────────────────
year = 2025
rnd  = 2
sess= "SQ"

# ─── 1) Enable FastF1 cache & load session ─────────────────────────────────
fastf1.Cache.enable_cache("Cache")
session = fastf1.get_session(year, rnd, 'R')
# we need both laps (for stints) and results (for finishing order)
session.load(laps=True)

# ─── 2) Fetch strategy data from your API ───────────────────────────────────
URL = f'http://localhost:8000/telemetry/{year}/{rnd}/{sess}/strategy'
resp = requests.get(URL)
resp.raise_for_status()
data = resp.json()
strategy_drivers = data['drivers']

# ─── 3) Determine finishing order from session.results ─────────────────────
# session.results is a DataFrame with columns including 'Position' and 'Abbreviation'
results_df = session.results.sort_values(by='Position')
finish_order = results_df['Abbreviation'].tolist()  # e.g. ['HAM','VER','BOT',...]

# ─── 4) Reorder strategy_drivers by finish_order ────────────────────────────
# build a lookup
drv_map = {d['driverId']: d for d in strategy_drivers}

ordered_drivers = []
for pos, abbr in enumerate(finish_order, start=1):
    if abbr in drv_map:
        d = drv_map[abbr]
        d['_finish_pos'] = pos
        ordered_drivers.append(d)

# in case some drivers aren't in results (DNS), append them at the end
for d in strategy_drivers:
    if d['driverId'] not in finish_order:
        d['_finish_pos'] = None
        ordered_drivers.append(d)

# ─── 5) Prepare for plotting ─────────────────────────────────────────────────
n = len(ordered_drivers)
y_pos    = list(range(n))
y_labels = [f"P{d['_finish_pos']} {d['driverId']}" if d['_finish_pos'] 
            else d['driverId']
            for d in ordered_drivers]

# colour map for tyre compounds
color_map = {
    'SOFT':        '#FF4C4C',
    'MEDIUM':      '#FFD700',
    'HARD':        '#EEEEEE',
    'INTERMEDIATE':'#00AF00',
    'WET':         '#0077FF'
}

# full race length
max_lap = max(
    stint['endLap']
    for d in ordered_drivers
    for stint in d['stints']
)

# ─── 6) Plot ─────────────────────────────────────────────────────────────────
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(10, n * 0.3))

# background bars
for i in range(n):
    ax.barh(y=i, width=max_lap, left=1, height=0.4, color='#333333')

# stint overlays
for i, d in enumerate(ordered_drivers):
    for stint in d['stints']:
        start  = stint['startLap']
        length = stint['endLap'] - start + 1
        comp   = stint['compound']
        ax.barh(
            y=i,
            width=length,
            left=start,
            height=0.4,
            color=color_map.get(comp, '#888888'),
            edgecolor='none'
        )

# styling
ax.set_yticks(y_pos)
ax.set_yticklabels(y_labels)
ax.invert_yaxis()
ax.set_xlabel('Lap')
ax.set_title(f'{year} Round {rnd} Strategy Stints', pad=12)

ax.xaxis.grid(True, color='#444444', linestyle='--', linewidth=0.5)
for spine in ax.spines.values():
    spine.set_visible(False)

# legend
patches = [mpatches.Patch(color=c, label=name.title()) 
           for name, c in color_map.items()]
ax.legend(
    handles=patches,
    bbox_to_anchor=(1.05, 1),
    loc='upper left',
    frameon=False,
    title='Compound'
)

plt.tight_layout()
plt.show()
