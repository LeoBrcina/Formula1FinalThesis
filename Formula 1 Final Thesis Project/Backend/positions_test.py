import requests
import matplotlib.pyplot as plt

year = 2025
rnd  = 2
sess= "R"

# 1) Point this at your running API
URL = f'http://localhost:8000/telemetry/{year}/{rnd}/{sess}/positions'

# 2) Fetch the data
resp = requests.get(URL)
resp.raise_for_status()
data = resp.json()

laps = data['laps']
drivers = data['drivers']

# 3) Plot
plt.figure(figsize=(10,6))
for d in drivers:
    plt.plot(laps, d['positions'], label=d['driverId'])
plt.gca().invert_yaxis()
plt.xlabel('Lap')
plt.ylabel('Position')
plt.title('2021 Bahrain GP: Lap-by-Lap Positions')
plt.legend(bbox_to_anchor=(1.02,1), loc='upper left', fontsize='small')
plt.tight_layout()
plt.show()
