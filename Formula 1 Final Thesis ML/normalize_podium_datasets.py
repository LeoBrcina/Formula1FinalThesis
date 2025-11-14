import pandas as pd
from pathlib import Path
from sklearn.preprocessing import MinMaxScaler

# Paths
data_folder = Path("DataML")
historic_file = data_folder / "podium_training_dataset_cleaned.csv"
modern_file = data_folder / "podium_training_dataset_modern_raw.csv"

# Output files
historic_out = data_folder / "podium_training_dataset_normalized.csv"
modern_out = data_folder / "podium_training_dataset_modern_normalized.csv"

# Columns to normalize
normalize_cols = [
    "grid", "driverStandPos", "driverPoints",
    "constructorStandPos", "constructorPoints",
    "driverAvgCircuit", "constructorAvgCircuit",
    "driverForm", "constructorForm", "round"
]

def normalize_dataset(input_file, output_file):
    print(f"Processing: {input_file}")
    
    # Load dataset
    df = pd.read_csv(input_file, sep=";")
    
    # Check columns exist
    for col in normalize_cols:
        if col not in df.columns:
            raise ValueError(f"Missing column '{col}' in {input_file}")
    
    # Scale values 0–1 using Min-Max
    scaler = MinMaxScaler()
    df[normalize_cols] = scaler.fit_transform(df[normalize_cols])
    
    # Save normalized dataset
    df.to_csv(output_file, sep=";", index=False)
    print(f"Saved normalized file to: {output_file}")

# Normalize both datasets
normalize_dataset(historic_file, historic_out)
normalize_dataset(modern_file, modern_out)

print("Both datasets normalized successfully!")
