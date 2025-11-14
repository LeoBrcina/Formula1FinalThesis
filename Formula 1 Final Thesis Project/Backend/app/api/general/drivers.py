from fastapi import APIRouter, HTTPException
import fastf1
from fastf1.ergast import Ergast
import datetime

fastf1.Cache.enable_cache("Cache")
erg = Ergast(result_type="raw", auto_cast=True)

router = APIRouter(
    prefix="/drivers",
    tags=["drivers"],
    responses={
        404: {"description": "Driver not found"},
        503: {"description": "Ergast API error"}
    }
)

@router.get("/{driver_id}", summary="Driver bio + true lifetime stats")
def get_driver_profile(driver_id: str):
    
    drivers = []
    limit = 100
    offset = 0
    try:
        while True:
            page = erg.get_driver_info(limit=limit, offset=offset)
            if not page:
                break
            drivers.extend(page)
            offset += limit
    except Exception as e:
        raise HTTPException(503, detail=f"Ergast error paging drivers: {e}")

    bio = next((d for d in drivers if d.get("driverId") == driver_id), None)
    if not bio:
        raise HTTPException(404, detail=f"No bio found for '{driver_id}'")

    
    current_year = datetime.datetime.now().year
    career = []
    for year in range(1950, current_year + 1):
        try:
            resp = erg.get_driver_standings(season=year, limit=1000)
        except Exception:
            
            continue
        season_list = resp[0].get("DriverStandings", [])
        for rec in season_list:
            if rec["Driver"]["driverId"] == driver_id:
                career.append(rec)

    
    total_seasons       = len(career)
    total_championships = sum(1 for s in career if int(s.get("position", 0)) == 1)
    total_wins          = sum(int(s.get("wins", 0))              for s in career)
    total_points        = sum(float(s.get("points", 0.0))        for s in career)

    
    return {
        "driverId":        bio.get("driverId"),
        "permanentNumber": bio.get("permanentNumber"),
        "code":            bio.get("code"),
        "givenName":       bio.get("givenName"),
        "familyName":      bio.get("familyName"),
        "dateOfBirth":     bio.get("dateOfBirth"),
        "nationality":     bio.get("nationality"),
        "stats": {
            "seasons":       total_seasons,
            "championships": total_championships,
            "wins":          total_wins,
            "points":        total_points
        }
    }