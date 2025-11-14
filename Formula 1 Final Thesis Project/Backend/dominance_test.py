# track_dominance_test.py

import requests
import matplotlib.pyplot as plt
from svgpath2mpl import parse_path
from matplotlib.patches import PathPatch

# ─── 1) Point this at your running API ────────────────────────────────────────
URL = 'http://localhost:8000/telemetry/2021/19/dominance?driver1=PER&driver2=HAM'

# ─── 2) Fetch the data ───────────────────────────────────────────────────────
resp = requests.get(URL)
resp.raise_for_status()
data = resp.json()

driver1 = data['driver1']
driver2 = data['driver2']
circuit  = data['circuitLayout']
sections = data['sections']

# ─── 3) Dark‐theme setup ──────────────────────────────────────────────────────
plt.style.use('dark_background')
fig = plt.figure(figsize=(6,6))
fig.patch.set_facecolor('#111318')
ax = fig.add_subplot(111)
ax.set_aspect('equal')
ax.axis('off')
ax.set_facecolor('#111318')

# ─── 4) Draw full track outline ──────────────────────────────────────────────
base_path = parse_path(circuit)
base_patch = PathPatch(
    base_path,
    facecolor='none',
    edgecolor='#444444',
    linewidth=1,
    capstyle='round',
    joinstyle='round'
)
ax.add_patch(base_patch)

# ─── 5) Overlay each sector ──────────────────────────────────────────────────
for sec in sections:
    path = parse_path(sec['path'])
    faster = driver1['color'] if sec['driver1Advantage'] == driver1['id'] else driver2['color']
    patch = PathPatch(
        path,
        facecolor='none',
        edgecolor=faster,
        linewidth=3,
        capstyle='round',
        joinstyle='round'
    )
    ax.add_patch(patch)

# ─── 6) Legend ───────────────────────────────────────────────────────────────
# draw invisible handles for each driver
h1, = ax.plot([], [], color=driver1['color'], linewidth=3)
h2, = ax.plot([], [], color=driver2['color'], linewidth=3)
leg = ax.legend(
    [h1, h2],
    [driver1['fullName'], driver2['fullName']],
    loc='upper right',
    frameon=False,
    fontsize='medium'
)
for t in leg.get_texts():
    t.set_color('white')

# ─── 7) Finish ───────────────────────────────────────────────────────────────
plt.tight_layout()
plt.show()
