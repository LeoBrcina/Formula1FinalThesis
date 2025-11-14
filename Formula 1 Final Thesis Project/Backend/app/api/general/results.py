from fastapi import APIRouter, HTTPException
from fastf1.ergast import Ergast

import fastf1
fastf1.Cache.enable_cache("Cache")

erg = Ergast(result_type="raw", auto_cast=True)

router = APIRouter(
    prefix="/results",
    tags=["results"],
    responses={404: {"description": "No results found"}, 503: {"description": "Ergast error"}}
)

@router.get("/{year}/{round}", summary="Get final classification for a race")
def race_results(year: int, round: int):
    try:
        raw = erg.get_race_results(season=year, round=round)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error: {e}")
    if not raw or "Results" not in raw[0]:
        raise HTTPException(status_code=404, detail=f"No results for year={year}, round={round}")
    return [
        {
            "position": int(r.get("position", 0)),
            "driver": f"{r['Driver'].get('givenName','')} {r['Driver'].get('familyName','')}".strip(),
            "constructor": r["Constructor"].get("name", ""),
            "grid": int(r.get("grid", 0)),
            "laps": int(r.get("laps", 0)),
            "status": r.get("status", ""),
            "points": float(r.get("points", 0))
        }
        for r in raw[0]["Results"]
    ]
