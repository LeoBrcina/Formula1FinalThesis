from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Path, Query
import fastf1
import pandas as pd
import numpy as np
from scipy.interpolate import interp1d
from app.db import get_db_connection
import json
import logging

logging.basicConfig(level=logging.INFO)

fastf1.Cache.enable_cache("Cache")

router = APIRouter(
    prefix="/telemetry",
    tags=["telemetry"],
    responses={
        404: {"description": "Lap or telemetry data not found"},
        503: {"description": "FastF1 error loading session"}
    }
)


def fetch_from_db(year, rnd, driver_a, lap_a, driver_b, lap_b):
    """Retrieve cached dominance data if it exists (order-insensitive)."""
    logging.info(f"DB CHECK → year={year}, round={rnd}, drivers={driver_a}-{driver_b}, laps={lap_a}/{lap_b}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT data FROM telemetry_dominance
        WHERE year=%s AND round=%s AND driver_a=%s AND lap_a=%s
              AND driver_b=%s AND lap_b=%s
    """, (year, rnd, driver_a, lap_a, driver_b, lap_b))
    row = cur.fetchone()
    conn.close()

    if row and "data" in row:
        logging.info(f"DB HIT for {driver_a}-{driver_b}")
        return row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])

    logging.info(f"DB MISS for {driver_a}-{driver_b}")
    return None


def save_to_db(year, rnd, driver_a, lap_a, driver_b, lap_b, payload):
    """Insert or update dominance data (order-insensitive)."""
    logging.info(f"CACHING → year={year}, round={rnd}, drivers={driver_a}-{driver_b}, laps={lap_a}/{lap_b}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO telemetry_dominance (year, round, driver_a, lap_a, driver_b, lap_b, data)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (year, round, driver_a, lap_a, driver_b, lap_b)
        DO UPDATE SET data = EXCLUDED.data
    """, (year, rnd, driver_a, lap_a, driver_b, lap_b, json.dumps(payload)))
    conn.commit()
    conn.close()


def normalize_coordinates(df: pd.DataFrame) -> (pd.DataFrame, float, float, float):
    xs = df["X"]
    ys = df["Y"]
    min_x, max_x = xs.min(), xs.max()
    min_y, max_y = ys.min(), ys.max()
    span_x = max_x - min_x
    span_y = max_y - min_y
    scale = float(max(span_x, span_y) or 1.0)
    df_norm = df.copy()
    df_norm["X_norm"] = (df_norm["X"] - min_x) / scale
    df_norm["Y_norm"] = (df_norm["Y"] - min_y) / scale
    return df_norm, scale, -min_x / scale, -min_y / scale


def generate_svg_path(points: np.ndarray, scale: float = 1.0,
                      offset_x: float = 0.0, offset_y: float = 0.0) -> str:
    if points.shape[0] < 2:
        return ""
    xs, ys = points[:, 0], points[:, 1]
    path = f"M {(xs[0] * scale) + offset_x},{(ys[0] * scale) + offset_y}"
    for x, y in points[1:]:
        path += f" L {(x * scale) + offset_x},{(y * scale) + offset_y}"
    return path


@router.get(
    "/{year}/{round}/dominance",
    summary="Track-dominance by comparing two drivers over equal-distance segments",
    operation_id="get_telemetry_dominance"
)
def get_telemetry_dominance(
    year:    int             = Path(..., ge=2019, le=2025, description="Season year"),
    round:   int             = Path(..., ge=1, description="Round number"),
    driver1: str             = Query(..., min_length=3, max_length=3,
                                      description="First driver code, e.g. 'HAM'"),
    lap1:    Optional[int]   = Query(None,
                                      description="Lap number for driver1; defaults to fastest"),
    driver2: str             = Query(..., min_length=3, max_length=3,
                                      description="Second driver code, e.g. 'VER'"),
    lap2:    Optional[int]   = Query(None,
                                      description="Lap number for driver2; defaults to fastest")
) -> Dict[str, Any]:
    
    pairs = [(driver1, lap1 or -1), (driver2, lap2 or -1)]
    pairs.sort(key=lambda x: x[0])
    d1_code, d1_lap = pairs[0]
    d2_code, d2_lap = pairs[1]

    cached = fetch_from_db(year, round, d1_code, d1_lap, d2_code, d2_lap)
    if cached:
        if (driver1, driver2) != (d1_code, d2_code):
            cached["driver1"], cached["driver2"] = cached["driver2"], cached["driver1"]
        return cached

    try:
        session = fastf1.get_session(year, round, "R")
        session.load(laps=True, telemetry=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"FastF1 error loading session: {e}")

    laps_df = session.laps
    if laps_df.empty:
        raise HTTPException(status_code=404, detail="No lap data available for this race")

    def pick_lap(driver_code: str, lapnum: Optional[int]) -> pd.Series:
        df = laps_df.pick_drivers([driver_code])
        if df.empty:
            raise HTTPException(status_code=404, detail=f"Driver '{driver_code}' did not participate")
        if lapnum is None:
            lap = df.pick_fastest()
        else:
            sel = df[df["LapNumber"] == lapnum]
            lap = sel.iloc[0] if not sel.empty else None
        if lap is None or pd.isna(lap["LapTime"]):
            raise HTTPException(status_code=404,
                                detail=f"Lap '{lapnum or 'fastest'}' not found for '{driver_code}'")
        return lap

    lap_a = pick_lap(d1_code, d1_lap if d1_lap != -1 else None)
    lap_b = pick_lap(d2_code, d2_lap if d2_lap != -1 else None)

    tel1 = lap_a.get_telemetry().add_distance().dropna(subset=["X", "Y", "Distance", "Time"])
    tel2 = lap_b.get_telemetry().add_distance().dropna(subset=["Distance", "Time"])
    if tel1.empty or tel2.empty:
        raise HTTPException(status_code=404, detail="Telemetry data missing for one of the laps")

    tel1_norm, scale, off_x, off_y = normalize_coordinates(tel1)
    circuit_layout = generate_svg_path(tel1_norm[["X_norm", "Y_norm"]].to_numpy(), 1.0, 0.0, 0.0)

    num_sectors = 15
    total_dist = float(tel1["Distance"].max())
    boundaries = np.linspace(0.0, total_dist, num_sectors + 1)

    t1 = tel1["Time"].dt.total_seconds().to_numpy()
    d1 = tel1["Distance"].to_numpy()
    t2 = tel2["Time"].dt.total_seconds().to_numpy()
    d2 = tel2["Distance"].to_numpy()
    interp1 = interp1d(d1, t1, bounds_error=False, fill_value="extrapolate")
    interp2 = interp1d(d2, t2, bounds_error=False, fill_value="extrapolate")

    sections: List[Dict[str, Any]] = []
    for i in range(num_sectors):
        start_d = boundaries[i]
        end_d = boundaries[i + 1]
        seg_df = tel1_norm[(tel1_norm["Distance"] >= start_d) & (tel1_norm["Distance"] <= end_d)]
        if seg_df.empty:
            continue
        seg_pts = seg_df[["X_norm", "Y_norm"]].to_numpy()
        seg_path = generate_svg_path(seg_pts, 1.0, 0.0, 0.0)
        delta1 = float(interp1(end_d) - interp1(start_d))
        delta2 = float(interp2(end_d) - interp2(start_d))
        adv = d1_code if delta1 < delta2 else d2_code

        sections.append({
            "id": f"segment_{i+1}",
            "name": f"Segment {i+1}",
            "type": "sector",
            "path": seg_path,
            "driver1Advantage": adv
        })

    def meta(abbr: str) -> Dict[str, Any]:
        try:
            info = session.results.query("Abbreviation == @abbr").iloc[0]
            color = info.get("TeamColor")
            return {"id": abbr, "fullName": info["FullName"], "color": f"#{color}" if color else None}
        except Exception:
            return {"id": abbr, "fullName": abbr, "color": None}

    result = {
        "driver1": meta(d1_code),
        "driver2": meta(d2_code),
        "circuitLayout": circuit_layout,
        "sections": sections
    }

    save_to_db(year, round, d1_code, d1_lap, d2_code, d2_lap, result)

    if (driver1, driver2) != (d1_code, d2_code):
        result["driver1"], result["driver2"] = result["driver2"], result["driver1"]

    return result
