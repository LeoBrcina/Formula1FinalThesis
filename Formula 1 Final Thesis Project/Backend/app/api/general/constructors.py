from fastapi import APIRouter, HTTPException
import datetime
import fastf1
from fastf1.ergast import Ergast

fastf1.Cache.enable_cache("Cache")
erg = Ergast(result_type="raw", auto_cast=True)

router = APIRouter(
    prefix="/constructors",
    tags=["constructors"],
    responses={
        404: {"description": "Constructor not found"},
        503: {"description": "Ergast API error"}
    }
)

@router.get("/{constructor_id}", summary="Constructor bio + true lifetime stats")
def get_constructor_profile(constructor_id: str):
    
    constructors = []
    limit, offset = 100, 0
    try:
        while True:
            page = erg.get_constructor_info(limit=limit, offset=offset)
            if not page:
                break
            constructors.extend(page)
            offset += limit
    except Exception as e:
        raise HTTPException(503, detail=f"Ergast error paging constructors: {e}")

    bio = next((c for c in constructors
                if c.get("constructorId") == constructor_id), None)
    if not bio:
        raise HTTPException(404, detail=f"No constructor found for '{constructor_id}'")

    career = []
    current_year = datetime.datetime.now().year
    for year in range(1950, current_year + 1):
        try:
            resp = erg.get_constructor_standings(season=year, limit=1000)
        except Exception:
            continue
        
        if not resp or len(resp) == 0:
            continue
        standings = resp[0].get("ConstructorStandings") or []
        for rec in standings:
            ctor = rec.get("Constructor", {})
            if ctor.get("constructorId") == constructor_id:
                career.append(rec)
    
    total_seasons       = len(career)
    total_championships = sum(1 for s in career
                              if int(s.get("position", 0)) == 1)
    total_wins          = sum(int(s.get("wins", 0)) for s in career)
    total_points        = sum(float(s.get("points", 0)) for s in career)

    return {
        "constructorId":  bio.get("constructorId"),
        "name":           bio.get("name"),
        "nationality":    bio.get("nationality"),
        "stats": {
            "seasons":       total_seasons,
            "championships": total_championships,
            "wins":          total_wins,
            "points":        total_points
        }
    }
