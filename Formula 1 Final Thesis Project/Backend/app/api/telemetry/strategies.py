from enum import Enum
from fastapi import APIRouter, HTTPException, Path
import fastf1, pandas as pd

fastf1.Cache.enable_cache("Cache")

router = APIRouter(
    prefix="/telemetry",
    tags=["telemetry"],
    responses={
        404: {"description": "No lap data found"},
        503: {"description": "FastF1 error loading session"}
    }
)

class SessionName(str, Enum):
    practice1          = "FP1"
    practice2          = "FP2"
    practice3          = "FP3"
    qualifying         = "Q"
    sprint_qualifying  = "SQ"
    race               = "R"
    sprint_race        = "S"

@router.get(
    "/{year:int}/{round:int}/{session}/strategy",
    summary="Tyre-stint overview for any session",
)
def get_strategy(
    year:    int         = Path(..., ge=2019, le=2025),
    round:   int         = Path(..., ge=1),
    session: SessionName = Path(
        ...,
        description="One of: practice1, practice2, practice3, qualifying, sprint qualifying, race and sprint race"
    )
):
    try:
        sess = fastf1.get_session(year, round, session.value)
        sess.load(laps=True)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"FastF1 error: {e}")

    laps = sess.laps
    if laps.empty:
        raise HTTPException(status_code=404, detail="No lap data found")

    order_map = {}
    if hasattr(sess, "results") and not sess.results.empty:
        for _, row in sess.results.iterrows():
            abbr = row.get("Abbreviation")
            pos  = row.get("Position")
            if abbr is not None and pos is not None:
                order_map[abbr] = int(pos)

    out = {
        "session": session.name,  
        "drivers": []
    }

    for drv, grp in laps.groupby("Driver"):
        stints = []
        for stint_no, sg in grp.groupby("Stint"):
            start = int(sg["LapNumber"].min())
            end   = int(sg["LapNumber"].max())
            comp  = sg["Compound"].iloc[0]  
            stints.append({
                "stint":    int(stint_no),
                "startLap": start,
                "endLap":   end,
                "compound": comp
            })

        try:
            info = sess.results.query("Abbreviation == @drv").iloc[0]
            full = info["FullName"]
            col  = f"#{info.get('TeamColor','')}"
        except Exception:
            full, col = drv, None

        out["drivers"].append({
            "driverId": drv,
            "fullName": full,
            "color":    col,
            "stints":   stints
        })

    out["drivers"].sort(
        key=lambda d: order_map.get(d["driverId"], float("inf"))
    )

    return out
