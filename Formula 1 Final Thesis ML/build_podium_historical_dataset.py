import pandas as pd
import numpy as np
from pathlib import Path

# Directories
input_dir = Path("DataExcel")
output_dir = Path("DataML")
output_dir.mkdir(exist_ok=True)

# Load necessary CSVs
results = pd.read_csv(input_dir / "results_full.csv", sep=";")
driver_standings = pd.read_csv(input_dir / "driver_standings_full.csv", sep=";")
constructor_standings = pd.read_csv(input_dir / "constructor_standings_full.csv", sep=";")
races = pd.read_csv(input_dir / "races_full.csv", sep=";")

# Merge race details into results
results = results.merge(races[["raceId", "circuitId", "round", "year"]], on="raceId", how="left")

# Sort chronologically
results.sort_values(by=["year", "round", "driverId"], inplace=True)
results.reset_index(drop=True, inplace=True)

# Helper function for safe averages (caps at 20th place, skips DNFs and NaNs)
def safe_average(series, cap=20):
    numeric = pd.to_numeric(series, errors="coerce").dropna()
    numeric = numeric[numeric > 0]  # Ignore DNFs (0th place or invalid)
    if numeric.empty:
        return np.nan
    avg = numeric.mean()
    return min(avg, cap)

# Functions to compute rolling stats
def get_driver_form(driver_id, current_idx, window=5):
    past = results.loc[(results["driverId"] == driver_id) & (results.index < current_idx), "positionOrder"]
    return safe_average(past.tail(window))

def get_constructor_form(constructor_id, current_idx, window=5):
    past = results.loc[(results["constructorId"] == constructor_id) & (results.index < current_idx), "positionOrder"]
    return safe_average(past.tail(window))

def get_driver_avg_on_circuit(driver_id, circuit_id, current_idx):
    past = results.loc[
        (results["driverId"] == driver_id) &
        (results["circuitId"] == circuit_id) &
        (results.index < current_idx),
        "positionOrder"
    ]
    return safe_average(past)

def get_constructor_avg_on_circuit(constructor_id, circuit_id, current_idx):
    past = results.loc[
        (results["constructorId"] == constructor_id) &
        (results["circuitId"] == circuit_id) &
        (results.index < current_idx),
        "positionOrder"
    ]
    return safe_average(past)

# Build the dataset row by row
rows = []
for idx, row in results.iterrows():
    race_id = row["raceId"]
    driver_id = row["driverId"]
    constructor_id = row["constructorId"]
    circuit_id = row["circuitId"]
    round_number = row["round"]
    year = row["year"]

    grid = row["grid"]

    # Driver standings (before race)
    ds = driver_standings[(driver_standings["raceId"] == race_id) & (driver_standings["driverId"] == driver_id)]
    driver_stand_pos = ds["position"].values[0] if not ds.empty else np.nan
    driver_points = ds["points"].values[0] if not ds.empty else np.nan

    # Constructor standings (before race)
    cs = constructor_standings[(constructor_standings["raceId"] == race_id) & (constructor_standings["constructorId"] == constructor_id)]
    constructor_stand_pos = cs["position"].values[0] if not cs.empty else np.nan
    constructor_points = cs["points"].values[0] if not cs.empty else np.nan

    # Rolling stats (historical)
    driver_avg_circuit = get_driver_avg_on_circuit(driver_id, circuit_id, idx)
    constructor_avg_circuit = get_constructor_avg_on_circuit(constructor_id, circuit_id, idx)
    driver_form = get_driver_form(driver_id, idx)
    constructor_form = get_constructor_form(constructor_id, idx)

    # Podium label (1 if P1-P3, else 0)
    podium = 1 if row["positionOrder"] in [1, 2, 3] else 0

    rows.append([
        year, race_id, driver_id, constructor_id, grid,
        driver_stand_pos, driver_points,
        constructor_stand_pos, constructor_points,
        driver_avg_circuit, constructor_avg_circuit,
        driver_form, constructor_form,
        circuit_id, round_number, podium
    ])

# Create final DataFrame
final_df = pd.DataFrame(rows, columns=[
    "year", "raceId", "driverId", "constructorId", "grid",
    "driverStandPos", "driverPoints",
    "constructorStandPos", "constructorPoints",
    "driverAvgCircuit", "constructorAvgCircuit",
    "driverForm", "constructorForm",
    "circuitId", "round", "podium"
])

# Clean all numeric columns (force floats, replace errors with NaN, cap averages/forms at 20)
for col in ["driverAvgCircuit", "constructorAvgCircuit", "driverForm", "constructorForm"]:
    final_df[col] = pd.to_numeric(final_df[col], errors="coerce")
    final_df[col] = final_df[col].clip(upper=20)

# Drop rows with missing essential rolling stats (no historical data)
final_df.dropna(inplace=True)

# Save final dataset
output_file = output_dir / "podium_training_dataset_cleaned.csv"
final_df.to_csv(output_file, sep=";", index=False, float_format="%.3f")

print(f"Clean dataset successfully built! Saved to {output_file}")
