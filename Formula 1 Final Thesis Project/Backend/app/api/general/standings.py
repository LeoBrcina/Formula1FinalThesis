from fastapi import APIRouter, HTTPException
from fastf1.ergast import Ergast

import fastf1
fastf1.Cache.enable_cache("Cache")

erg = Ergast(result_type="raw", auto_cast=True)

router = APIRouter(
    prefix="/standings",
    tags=["standings"],
    responses={404: {"description": "Not found"}, 503: {"description": "Ergast error"}}
)

@router.get("/drivers/{year}", summary="End-of-season driver standings")
def driver_standings(year: int):
    try:
        raw = erg.get_driver_standings(season=year, limit=1000)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error: {e}")
    if not raw or "DriverStandings" not in raw[0]:
        raise HTTPException(status_code=404, detail=f"No driver standings for {year}")
    return [
        {
            "position": int(d.get("position", 0)),
            "driver": f"{d['Driver'].get('givenName','')} {d['Driver'].get('familyName','')}".strip(),
            "constructor": (d["Constructors"][0].get("name","") if d.get("Constructors") else ""),
            "points": float(d.get("points", 0)),
            "wins": int(d.get("wins", 0))
        }
        for d in raw[0]["DriverStandings"]
    ]

@router.get("/constructors/{year}", summary="End-of-season constructor standings")
def constructor_standings(year: int):
    try:
        raw = erg.get_constructor_standings(season=year, limit=1000)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error: {e}")
    if not raw or "ConstructorStandings" not in raw[0]:
        raise HTTPException(status_code=404, detail=f"No constructor standings for {year}")
    return [
        {
            "position": int(c.get("position", 0)),
            "constructor": c["Constructor"].get("name", ""),
            "points": float(c.get("points", 0)),
            "wins": int(c.get("wins", 0))
        }
        for c in raw[0]["ConstructorStandings"]
    ]
