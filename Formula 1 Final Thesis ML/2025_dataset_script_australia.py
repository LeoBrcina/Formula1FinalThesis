import fastf1
import pandas as pd
import numpy as np

# --- SETTINGS ---
OUTPUT_FILE = "DataML/podium_prediction_2025_australia_normalized.csv"
YEAR_PREDICT = 2025
ROUND = 1  # Australia GP
CIRCUIT_ID = 1  # Matches training CSV (Albert Park)

# Enable FastF1 cache
fastf1.Cache.enable_cache("fastf1_cache")

# --- HELPER FUNCTIONS ---
def get_form(results_df, entity_col, entity_value, window=5):
    df = results_df[results_df[entity_col] == entity_value].sort_values(["year", "round"])
    last_races = df.tail(window)
    return last_races["positionOrder"].mean() if not last_races.empty else 10.0

def min_max_scale(series, min_val=None, max_val=None):
    if min_val is None:
        min_val = series.min()
    if max_val is None:
        max_val = series.max()
    return (series - min_val) / (max_val - min_val + 1e-9)

# --- STEP 1: Load 2024 results for form and averages ---
results_list = []
schedule_2024 = fastf1.get_event_schedule(2024)
for rnd, event in schedule_2024.iterrows():
    try:
        session = fastf1.get_session(2024, event["RoundNumber"], "R")
        session.load(laps=False, telemetry=False, weather=False)
        for row in session.results.itertuples():
            results_list.append({
                "year": 2024,
                "round": event["RoundNumber"],
                "driverId": row.DriverNumber,
                "constructorId": row.TeamName.lower().replace(" ", "_"),
                "positionOrder": row.Position,
                "circuitId": event["EventName"]  # Treat circuit by name for lookup
            })
    except Exception as e:
        print(f"Skipping round {event['RoundNumber']} ({event['EventName']}): {e}")

results_df = pd.DataFrame(results_list)

# --- STEP 2: Fetch 2025 Qualifying data ---
session_2025 = fastf1.get_session(YEAR_PREDICT, ROUND, "Q")
session_2025.load(laps=False, telemetry=False, weather=False)

grid_data = []
for row in session_2025.results.itertuples():
    grid_data.append({
        "year": YEAR_PREDICT,
        "raceId": 1,
        "driverId": row.DriverNumber,
        "constructorId": row.TeamName.lower().replace(" ", "_"),
        "grid": row.Position,
        "driverStandPos": 20.0,  # start of season
        "driverPoints": 0.0,
        "constructorStandPos": 10.0,
        "constructorPoints": 0.0,
        "driverAvgCircuit": 10.0,
        "constructorAvgCircuit": 10.0,
        "driverForm": 10.0,
        "constructorForm": 10.0,
        "circuitId": CIRCUIT_ID,
        "round": ROUND
    })

df_2025 = pd.DataFrame(grid_data)

# --- STEP 3: Compute driver and constructor forms + Albert Park averages ---
for idx, row in df_2025.iterrows():
    drv, cons = row["driverId"], row["constructorId"]
    df_2025.loc[idx, "driverForm"] = get_form(results_df, "driverId", drv, 5)
    df_2025.loc[idx, "constructorForm"] = get_form(results_df, "constructorId", cons, 5)

    drv_races = results_df[(results_df["driverId"] == drv) & (results_df["circuitId"] == "Australian Grand Prix")]
    df_2025.loc[idx, "driverAvgCircuit"] = drv_races["positionOrder"].mean() if not drv_races.empty else 10.0

    cons_races = results_df[(results_df["constructorId"] == cons) & (results_df["circuitId"] == "Australian Grand Prix")]
    df_2025.loc[idx, "constructorAvgCircuit"] = cons_races["positionOrder"].mean() if not cons_races.empty else 10.0

# --- STEP 4: Normalize using min-max (0 to 1) ---
for col in ["grid", "driverStandPos", "driverPoints", "constructorStandPos",
            "constructorPoints", "driverAvgCircuit", "constructorAvgCircuit",
            "driverForm", "constructorForm", "circuitId", "round"]:
    df_2025[col] = min_max_scale(df_2025[col], min_val=0, max_val=25)  # assuming typical F1 ranges

# --- Save final normalized CSV ---
df_2025.to_csv(OUTPUT_FILE, sep=";", index=False)
print(f"Normalized CSV created: {OUTPUT_FILE}")
