from enum import Enum
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Path, Query
import fastf1
import pandas as pd
from app.db import get_db_connection
import json
import logging

fastf1.Cache.enable_cache("Cache")

logging.basicConfig(level=logging.INFO)

router = APIRouter(
    prefix="/telemetry",
    tags=["telemetry"],
    responses={
        404: {"description": "No lap data found"},
        503: {"description": "FastF1 error loading session"}
    }
)

class SessionName(str, Enum):
    practice1         = "FP1"
    practice2         = "FP2"
    practice3         = "FP3"
    qualifying        = "Q"
    sprint_qualifying = "SQ"
    race              = "R"
    sprint_race       = "S"

def fetch_from_db(year: int, rnd: int, session: str):
    """Fetch lap times JSON for a session/year/round if cached."""
    logging.info(f"DB CHECK → LapTimes year={year}, round={rnd}, session={session}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT data FROM telemetry_laptimes
        WHERE year=%s AND round=%s AND session=%s
    """, (year, rnd, session))
    row = cur.fetchone()
    conn.close()
    if row and "data" in row:
        logging.info("DB HIT for LapTimes")
        return row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])
    logging.info("DB MISS for LapTimes")
    return None

def save_to_db(year: int, rnd: int, session: str, payload: dict):
    """Insert or update cached lap times."""
    logging.info(f"CACHING → LapTimes year={year}, round={rnd}, session={session}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO telemetry_laptimes (year, round, session, data)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (year, round, session)
        DO UPDATE SET data = EXCLUDED.data
    """, (year, rnd, session, json.dumps(payload)))
    conn.commit()
    conn.close()

@router.get(
    "/{year}/{round}/{session}/lap-times",
    summary="Lap times for every driver in any session",
    operation_id="get_telemetry_lap_times_any_session"
)
def get_lap_times(
    year: int = Path(..., ge=2019, le=2025, description="Season year"),
    round: int = Path(..., ge=1, description="Round number"),
    session: SessionName = Path(..., description="One of: FP1, FP2, FP3, Q, SQ, R, S"),
    drivers: Optional[List[str]] = Query(None, description="Filter by driver abbreviations, e.g. ['HAM','VER']"),
    lap_min: Optional[int] = Query(None, ge=1, description="Minimum lap number to include"),
    lap_max: Optional[int] = Query(None, ge=1, description="Maximum lap number to include")
):
    # Check cache first
    cached = fetch_from_db(year, round, session.value)
    if cached:
        if drivers:
            cached["drivers"] = [d for d in cached["drivers"] if d["driverId"] in drivers]
        if lap_min or lap_max:
            indices = [i for i, lap in enumerate(cached["laps"])
                       if (lap_min is None or lap >= lap_min) and (lap_max is None or lap <= lap_max)]
            cached["laps"] = [cached["laps"][i] for i in indices]
            for d in cached["drivers"]:
                d["lapTimes"] = [d["lapTimes"][i] for i in indices]
        return cached

    try:
        sess = fastf1.get_session(year, round, session.value)
        sess.load(laps=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"FastF1 error: {e}")

    laps_df = sess.laps
    if laps_df.empty:
        raise HTTPException(status_code=404, detail="No lap data found")

    all_laps = sorted(laps_df["LapNumber"].unique())
    pivot = (
        laps_df
        .pivot(index="LapNumber", columns="Driver", values="LapTime")
        .reindex(all_laps)
    )

    output = {
        "session": session.name,
        "laps": all_laps,
        "drivers": []
    }

    for drv in pivot.columns:
        times = [float(td.total_seconds()) if pd.notna(td) else None for td in pivot[drv]]
        try:
            info = sess.results.query("Abbreviation == @drv").iloc[0]
            full_name = info["FullName"]
            team_color = f"#{info.get('TeamColor','')}"
        except Exception:
            full_name, team_color = drv, None
        output["drivers"].append({
            "driverId": drv,
            "fullName": full_name,
            "color": team_color,
            "lapTimes": times
        })

    save_to_db(year, round, session.value, output)

    if drivers:
        output["drivers"] = [d for d in output["drivers"] if d["driverId"] in drivers]
    if lap_min or lap_max:
        indices = [i for i, lap in enumerate(output["laps"])
                   if (lap_min is None or lap >= lap_min) and (lap_max is None or lap <= lap_max)]
        output["laps"] = [output["laps"][i] for i in indices]
        for d in output["drivers"]:
            d["lapTimes"] = [d["lapTimes"][i] for i in indices]

    return output
