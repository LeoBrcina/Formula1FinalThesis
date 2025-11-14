from enum import Enum
from fastapi import APIRouter, HTTPException, Path
import fastf1
import pandas as pd

fastf1.Cache.enable_cache("Cache")

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

class SessionName(str, Enum):
    race   = "R"
    sprint = "S"

def _build_positions(session, laps):
    lap_numbers = sorted(laps["LapNumber"].unique())

    pivot = laps.pivot(index="LapNumber", columns="Driver", values="Position")
    pivot = pivot.reindex(lap_numbers)

    drivers = []
    for drv in pivot.columns:
        positions = [int(p) if not pd.isna(p) else None for p in pivot[drv]]
        try:
            info = session.results.query("Abbreviation == @drv").iloc[0]
            full_name  = info["FullName"]
            team_color = info.get("TeamColor")
        except Exception:
            full_name, team_color = drv, None

        drivers.append({
            "driverId":  drv,
            "fullName":  full_name,
            "color":     team_color,
            "positions": positions
        })

    return lap_numbers, drivers

@router.get(
    "/{year:int}/{round:int}/{session}/positions",
    summary="Lap-by-lap grid positions for either the race or the sprint"
)
def get_positions_any_session(
    year:    int          = Path(..., ge=2019, le=2025),
    round:   int          = Path(..., ge=1),
    session: SessionName  = Path(
        ...,
        description="Which session to load: race (Grand Prix) or sprint"
    )
):
    try:
        sess = fastf1.get_session(year, round, session.value)
        sess.load(laps=True)
    except Exception as e:
        raise HTTPException(503, f"FastF1 error: {e}")

    if sess.laps.empty:
        raise HTTPException(404, "No lap data found")

    laps = sess.laps
    lap_numbers, drivers = _build_positions(sess, laps)

    return {
        "session": session.name,  
        "laps":    lap_numbers,
        "drivers": drivers
    }
