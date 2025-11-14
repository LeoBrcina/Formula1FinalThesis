import csv
import pandas as pd
from pathlib import Path

# Folders
source_folder = Path("Data")       # Folder with raw Kaggle CSVs (single-column or normal)
output_folder = Path("DataExcel")  # Destination for cleaned Excel-ready files
output_folder.mkdir(exist_ok=True)

# Expected headers for each CSV (Kaggle schema)
schemas = {
    "circuits_full.csv": [
        "circuitId", "circuitRef", "name", "location", "country",
        "lat", "lng", "alt", "url"
    ],
    "constructors_full.csv": [
        "constructorId", "constructorRef", "name", "nationality", "url"
    ],
    "constructor_standings_trimmed.csv": [
        "constructorStandingsId", "raceId", "constructorId",
        "points", "position", "positionText", "wins"
    ],
    "constructor_standings_full.csv": [
        "constructorStandingsId", "raceId", "constructorId",
        "points", "position", "positionText", "wins"
    ],
    "drivers_full.csv": [
        "driverId", "driverRef", "number", "code",
        "forename", "surname", "dob", "nationality", "url"
    ],
    "driver_standings_trimmed.csv": [
        "driverStandingsId", "raceId", "driverId",
        "points", "position", "positionText", "wins"
    ],
    "driver_standings_full.csv": [
        "driverStandingsId", "raceId", "driverId",
        "points", "position", "positionText", "wins"
    ],
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
    "status_full.csv": [
        "statusId", "status"
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
    """Detect if the CSV rows are fully quoted (double-encoded)."""
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("constructorStandingsId") and not line.startswith("driverStandingsId"):
                return line.startswith('"') and line.endswith('"')
    return False

def clean_csv(file_path: Path, headers: list, output_path: Path):
    rows = []
    expected_cols = len(headers)
    double_encoded = is_double_encoded(file_path)

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue

            # Handle double-encoded rows (standings files)
            if double_encoded and not line.startswith(headers[0]):
                if line.startswith('"') and line.endswith('"'):
                    line = line[1:-1]  # strip outer quotes
                line = line.replace('""', '"')  # fix escaped quotes
                row = line.split(",")
            else:
                # Normal CSV row
                row = next(csv.reader([line], delimiter=",", quotechar='"'))

            # Adjust row length
            if len(row) < expected_cols:
                row += [""] * (expected_cols - len(row))
            elif len(row) > expected_cols:
                row = row[:expected_cols]

            # Clean up whitespace
            row = [cell.strip() for cell in row]

            # Skip accidental duplicate header rows inside data
            if row == headers:
                continue

            rows.append(row)

    df = pd.DataFrame(rows, columns=headers)

    # Convert numeric fields
    for col in df.columns:
        if col.lower() in [
            "raceid", "driverid", "constructorid", "points", "position",
            "positionorder", "wins", "laps", "milliseconds", "year", "round"
        ]:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # Save as semicolon-delimited (Excel-friendly)
    df.to_csv(output_path, sep=";", index=False, quoting=csv.QUOTE_MINIMAL)
    print(f"Converted: {file_path} -> {output_path}")

# Process every CSV file
for filename, headers in schemas.items():
    matches = list(source_folder.rglob(filename))
    if not matches:
        print(f"File not found: {filename}")
        continue
    clean_csv(matches[0], headers, output_folder / filename)

print("\nAll CSVs have been cleaned and saved to DataExcel!")
