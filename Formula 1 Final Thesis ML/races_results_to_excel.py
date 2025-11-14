import csv
import pandas as pd
from pathlib import Path

source_folder = Path("Data")
output_folder = Path("DataExcel")
output_folder.mkdir(exist_ok=True)

# Schemas for races and results
schemas = {
    "races_trimmed.csv": [
        "raceId", "year", "round", "circuitId", "name", "date", "time", "url",
        "fp1_date", "fp1_time", "fp2_date", "fp2_time", "fp3_date", "fp3_time",
        "quali_date", "quali_time", "sprint_date", "sprint_time"
    ],
    "races_full.csv": [
        "raceId", "year", "round", "circuitId", "name", "date", "time", "url",
        "fp1_date", "fp1_time", "fp2_date", "fp2_time", "fp3_date", "fp3_time",
        "quali_date", "quali_time", "sprint_date", "sprint_time"
    ],
    "results_trimmed.csv": [
        "resultId", "raceId", "driverId", "constructorId", "number", "grid",
        "position", "positionText", "positionOrder", "points", "laps", "time",
        "milliseconds", "fastestLap", "rank", "fastestLapTime", "fastestLapSpeed",
        "statusId"
    ],
    "results_full.csv": [
        "resultId", "raceId", "driverId", "constructorId", "number", "grid",
        "position", "positionText", "positionOrder", "points", "laps", "time",
        "milliseconds", "fastestLap", "rank", "fastestLapTime", "fastestLapSpeed",
        "statusId"
    ]
}

def is_double_encoded(file_path: Path):
    """Check if rows are wrapped in outer quotes (double-encoded)."""
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("raceId") and not line.startswith("resultId"):
                return line.startswith('"') and line.endswith('"')
    return False

def fix_csv(file_path: Path, headers: list, output_path: Path):
    rows = []
    expected_cols = len(headers)
    double_encoded = is_double_encoded(file_path)

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            # Handle double-encoded lines
            if double_encoded and not line.startswith(headers[0]):
                if line.startswith('"') and line.endswith('"'):
                    line = line[1:-1]  # remove outer quotes
                line = line.replace('""', '"')  # fix inner escaped quotes
                row = line.split(",")
            else:
                # Normal CSV line
                row = next(csv.reader([line], delimiter=",", quotechar='"'))

            # Adjust row length
            if len(row) < expected_cols:
                row += [""] * (expected_cols - len(row))
            elif len(row) > expected_cols:
                row = row[:expected_cols]

            # Clean whitespace
            row = [cell.strip() for cell in row]

            # Skip accidental header duplication
            if row == headers:
                continue

            rows.append(row)

    df = pd.DataFrame(rows, columns=headers)

    # Convert obvious numeric fields
    for col in df.columns:
        if col.lower() in [
            "raceid", "driverid", "constructorid", "resultid", "grid", "position",
            "positionorder", "wins", "laps", "milliseconds", "year", "round", "points"
        ]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Save cleaned CSV with semicolons for Excel
    df.to_csv(output_path, sep=";", index=False, quoting=csv.QUOTE_MINIMAL)
    print(f"Fixed: {file_path} -> {output_path}")

# Process all 4 files
for filename, headers in schemas.items():
    matches = list(source_folder.rglob(filename))
    if not matches:
        print(f"File not found: {filename}")
        continue
    fix_csv(matches[0], headers, output_folder / filename)

print("\nRaces and Results files have been cleaned and saved to DataExcel!")
