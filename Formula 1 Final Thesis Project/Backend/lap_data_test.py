import requests
import matplotlib.pyplot as plt

# ─── 1) Point this at your running API ───────────────────────────────────────
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}//telemetry/2021/1/FP1/lapdata?driver1=HAM&driver2=VER"
params = {"driver1": "HAM", "driver2": "VER"}

# ─── 2) Fetch the data ───────────────────────────────────────────────────────
resp = requests.get(ENDPOINT, params=params)
resp.raise_for_status()
data = resp.json()

for key in ("driver1", "driver2"):
    drv = data.get(key)
    if not drv:
        continue

    tel = drv["telemetry"]
    dist = tel["distance"]
    speed = tel["speed"]
    throttle = tel["throttle"]
    brake = tel["brake"]
    gear = tel["gear"]
    name = drv["fullName"]

    # ─── Speed vs Distance ──────────────────────────────────────────────────
    plt.figure()
    plt.plot(dist, speed)
    plt.xlabel("Distance (m)")
    plt.ylabel("Speed (km/h)")
    plt.title(f"{name} – Speed")
    plt.tight_layout()

    # ─── Throttle vs Distance ───────────────────────────────────────────────
    plt.figure()
    plt.plot(dist, throttle)
    plt.xlabel("Distance (m)")
    plt.ylabel("Throttle (%)")
    plt.title(f"{name} – Throttle")
    plt.tight_layout()

    # ─── Brake vs Distance ──────────────────────────────────────────────────
    # show as 0/1
    plt.figure()
    plt.plot(dist, [1 if b else 0 for b in brake])
    plt.xlabel("Distance (m)")
    plt.ylabel("Brake (1=on)")
    plt.title(f"{name} – Brake")
    plt.tight_layout()

    # ─── Gear vs Distance ───────────────────────────────────────────────────
    plt.figure()
    plt.plot(dist, gear)
    plt.xlabel("Distance (m)")
    plt.ylabel("Gear")
    plt.title(f"{name} – Gear")
    plt.tight_layout()

# ─── Show all plots ─────────────────────────────────────────────────────────
plt.show()
