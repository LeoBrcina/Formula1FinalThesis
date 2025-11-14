from enum import Enum
from typing import Optional
from fastapi import APIRouter, HTTPException, Path, Query
import fastf1
import pandas as pd
from app.db import get_db_connection
import json
import logging

logging.basicConfig(level=logging.INFO)

fastf1.Cache.enable_cache("Cache")

router = APIRouter(
    prefix="/telemetry",
    tags=["telemetry"],
    responses={
        404: {"description": "No lap or telemetry data found"},
        503: {"description": "FastF1 error loading session"}
    }
)


class SessionName(str, Enum):
    practice1 = "FP1"
    practice2 = "FP2"
    practice3 = "FP3"
    qualifying = "Q"
    sprint_qualifying = "SQ"
    race = "R"
    sprint_race = "S"


def fetch_from_db(year, rnd, session, driver, lap):
    """Retrieve cached telemetry data if it exists."""
    logging.info(f"DB CHECK → year={year}, round={rnd}, session={session}, driver={driver}, lap={lap}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT data FROM telemetry_laps 
        WHERE year=%s AND round=%s AND session=%s AND driver=%s AND lap=%s
    """, (year, rnd, session, driver, lap))
    row = cur.fetchone()
    conn.close()

    if row and "data" in row:
        logging.info(f"DB HIT for {driver} (lap {lap})")
        return row["data"] if isinstance(row["data"], dict) else json.loads(row["data"])

    logging.info(f"DB MISS for {driver} (lap {lap})")
    return None


def save_to_db(year, rnd, session, driver, lap, payload):
    """Insert or update telemetry data in the cache."""
    logging.info(f"CACHING → year={year}, round={rnd}, session={session}, driver={driver}, lap={lap}")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO telemetry_laps (year, round, session, driver, lap, data)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (year, round, session, driver, lap) 
        DO UPDATE SET data = EXCLUDED.data
    """, (year, rnd, session, driver, lap, json.dumps(payload)))
    conn.commit()
    conn.close()


@router.get(
    "/{year}/{round}/{session}/lapdata",
    summary="Get throttle, brake, gear and speed for a single lap in any session",
    operation_id="get_telemetry_lapdata"
)
def get_lapdata(
    year: int = Path(..., ge=2019, le=2025, description="Season year"),
    round: int = Path(..., ge=1, description="Round number"),
    session: SessionName = Path(..., description="One of: practice1, practice2, practice3, qualifying, sprint qualifying, race and sprint race"),
    driver1: str = Query(..., min_length=3, max_length=3, description="First driver code"),
    driver2: Optional[str] = Query(None, min_length=3, max_length=3, description="Second driver code (optional)"),
    lap: Optional[int] = Query(None, ge=1, description="Lap number to fetch (defaults to fastest)")
):
    def fetch_for(drv: str):
        cache_lap = lap if lap is not None else -1  

        cached = fetch_from_db(year, round, session.value, drv, cache_lap)
        if cached:
            logging.info(f"Returning cached telemetry for {drv} (lap={cache_lap})")
            return cached

        logging.info(f"FETCHING from FastF1 for {drv} (lap={cache_lap})")
        try:
            sess = fastf1.get_session(year, round, session.value)
            sess.load(laps=True)
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"FastF1 error loading {session.value}: {e}")

        laps = sess.laps
        drv_laps = laps.pick_drivers([drv])
        if drv_laps.empty:
            raise HTTPException(status_code=404, detail=f"No laps for driver {drv}")

        if lap is not None:
            sel = drv_laps[drv_laps["LapNumber"] == lap]
            if sel.empty:
                raise HTTPException(status_code=404, detail=f"Driver {drv} did not complete lap {lap}")
            chosen = sel.iloc[0]
        else:
            chosen = drv_laps.loc[drv_laps['LapTime'].idxmin()]

        try:
            tel = sess.laps.pick_drivers([drv]).loc[chosen.name].get_telemetry()
        except Exception as e:
            raise HTTPException(status_code=503, detail=f"Telemetry error for {drv} lap {chosen['LapNumber']}: {e}")

        if 'Distance' not in tel.columns:
            tel = tel.add_distance()

        data = {
            "distance": tel["Distance"].tolist(),
            "speed": tel["Speed"].tolist(),
            "throttle": tel["Throttle"].tolist(),
            "brake": tel["Brake"].tolist(),
            "gear": tel["nGear"].tolist(),
        }

        try:
            info = sess.results.query("Abbreviation == @drv").iloc[0]
            full_name = info["FullName"]
            color = f"#{info['TeamColor']}"
        except Exception:
            full_name, color = drv, None

        result = {
            "id": drv,
            "fullName": full_name,
            "color": color,
            "lap": int(chosen["LapNumber"]),
            "telemetry": data
        }

        save_to_db(year, round, session.value, drv, cache_lap, result)
        return result

    d1 = fetch_for(driver1)
    d2 = fetch_for(driver2) if driver2 else None

    return {
        "session": session.name,
        "driver1": d1,
        "driver2": d2
    }
