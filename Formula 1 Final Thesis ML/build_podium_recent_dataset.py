import pandas as pd
from pathlib import Path

# Directories
input_file = Path("DataML") / "podium_training_dataset_cleaned.csv"
output_dir = Path("DataML")
output_dir.mkdir(exist_ok=True)

# Load the cleaned full dataset
df = pd.read_csv(input_file, sep=";")

# 1. Filter to 2000–2024
modern_df = df[(df["year"] >= 2000) & (df["year"] <= 2024)].copy()

# 2. Fix grid = 0 (pitlane or no qualy start)
def fix_grid_zero(group):
    max_grid = group["grid"].max()
    group.loc[group["grid"] == 0, "grid"] = max_grid + 1
    return group

modern_df = modern_df.groupby("raceId", group_keys=False).apply(fix_grid_zero)

# 3. Ensure rolling stats are still clean (1–20 capped, already done in cleaned dataset)
for col in ["driverAvgCircuit", "constructorAvgCircuit", "driverForm", "constructorForm"]:
    modern_df[col] = modern_df[col].clip(upper=20)

# 4. Save the modern-era raw dataset
output_file = output_dir / "podium_training_dataset_modern_raw.csv"
modern_df.to_csv(output_file, sep=";", index=False, float_format="%.3f")

print(f"Modern-era dataset (2000–2024) built and saved to {output_file}")
