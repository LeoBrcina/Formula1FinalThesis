# plot_lap_times_improved.py

import requests
import matplotlib.pyplot as plt
import numpy as np
import matplotlib.ticker as mtick

# 1) Fetch only laps 2–56 for HAM and VER
URL = 'http://localhost:8000/telemetry/2021/1/Q/lap-times?drivers=HAM&drivers=VER&lap_min=1&lap_max=58'
params = {
    'drivers': ['HAM','VER'],
    'lap_min': 2,
    'lap_max': 56
}
resp = requests.get(URL, params=params)
resp.raise_for_status()
data = resp.json()

laps    = data['laps']
drivers = data['drivers']

# 2) Plot setup
plt.style.use('dark_background')
fig, ax = plt.subplots(figsize=(10, 5))

# 3) Plot each driver, filtering out any t > 140 s
threshold = 140
for d in drivers:
    times = [
        t if (t is not None and t < threshold) else np.nan
        for t in d['lapTimes']
    ]
    ax.plot(
        laps,
        times,
        label=f"{d['driverId']} ({d['fullName']})",
        color=d.get('color'),
        linewidth=2
    )

# 4) Format y-axis as MM:SS.ss
def to_mmss(x, pos):
    m = int(x // 60)
    s = x % 60
    return f"{m:02d}:{s:05.2f}"
ax.yaxis.set_major_formatter(mtick.FuncFormatter(to_mmss))

# 5) Styling
ax.set_xlabel('Lap')
ax.set_ylabel('Lap Time')
ax.set_title('2021 Bahrain GP: Lap Time Comparison (laps ≥ 2, < 140 s)')
ax.grid(True, color='#444444', linestyle='--', linewidth=0.5)
for spine in ['top','right']:
    ax.spines[spine].set_visible(False)

# 6) Legend & layout
ax.legend(loc='upper right', fontsize='small', frameon=False)
plt.tight_layout()
plt.show()
