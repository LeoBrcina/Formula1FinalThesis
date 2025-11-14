from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Path
import fastf1
from fastf1.ergast import Ergast

fastf1.Cache.enable_cache("Cache")
erg = Ergast(result_type="raw", auto_cast=True)

router = APIRouter(
    prefix="/circuits",
    tags=["circuits"],
    responses={
        404: {"description": "Circuit not found or no races held"},
        503: {"description": "Ergast API error"}
    }
)

@router.get("/season/{year}", summary="List all circuits in a given season")
def list_circuits_by_year(
    year: int = Path(..., ge=1950, le=2025, description="F1 season year")
) -> List[Dict[str, Any]]:
    try:
        circuits = erg.get_circuits(season=year, limit=1000)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error fetching circuits: {e}")

    if not circuits:
        raise HTTPException(status_code=404, detail=f"No circuits held in season {year}")

    return [
        {
            "circuitId": c["circuitId"],
            "name":      c["circuitName"],
            "locality":  c["Location"]["locality"],
            "country":   c["Location"]["country"],
            "lat":       c["Location"]["lat"],
            "long":      c["Location"]["long"],
        }
        for c in circuits
    ]


@router.get("/{circuit_id}", summary="Circuit bio + basic stats")
def get_circuit_profile(
    circuit_id: str = Path(..., description="Circuit identifier, e.g. 'monza'")
):
    
    try:
        circuits = erg.get_circuits(limit=1000)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error fetching circuits: {e}")
    bio = next((c for c in circuits if c["circuitId"] == circuit_id), None)
    if not bio:
        raise HTTPException(status_code=404, detail=f"No circuit found for '{circuit_id}'")

    try:
        seasons = erg.get_seasons(circuit=circuit_id, limit=1000)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error fetching seasons: {e}")
    years = sorted(int(s["season"]) for s in seasons)
    if not years:
        raise HTTPException(status_code=404, detail=f"No races held at '{circuit_id}'")
    first_year, last_year = years[0], years[-1]
    total_events = len(years)

    winners: List[Dict[str, Any]] = []
    limit, offset = 100, 0
    try:
        while True:
            pages = erg.get_race_results(
                circuit=circuit_id,
                results_position=1,   
                limit=limit,
                offset=offset
            )
            if not pages:
                break
            for page in pages:
                season = page.get("season")
                rnd    = page.get("round")
                for r in page.get("Results", []):
                    winners.append({
                        "season":     int(season) if season is not None else None,
                        "round":      int(rnd)    if rnd    is not None else None,
                        "driver":     r["Driver"],
                        "constructor":r["Constructor"]
                    })
            if len(pages) < limit:
                break
            offset += limit
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error fetching winners: {e}")

    last_winner: Dict[str, Any] = {}
    if winners:
        last = max(winners, key=lambda w: (w["season"], w["round"]))
        drv  = last["driver"]
        ctor = last["constructor"]
        last_winner = {
            "season":      last["season"],
            "driverId":    drv["driverId"],
            "givenName":   drv["givenName"],
            "familyName":  drv["familyName"],
            "constructor": ctor["name"]
        }

    fastest: List[Dict[str, Any]] = []
    offset = 0
    try:
        while True:
            pages = erg.get_race_results(
                circuit=circuit_id,
                fastest_rank=1,       
                limit=limit,
                offset=offset
            )
            if not pages:
                break
            for page in pages:
                season = page.get("season")
                for r in page.get("Results", []):
                    fl = r.get("FastestLap") or {}
                    time_info = fl.get("Time", {})    
                    time_str  = time_info.get("time")  
                    if time_str:
                        fastest.append({
                            "season": int(season) if season is not None else None,
                            "driver": r["Driver"],
                            "time":   time_str
                        })
            if len(pages) < limit:
                break
            offset += limit
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Ergast error fetching fastest laps: {e}")

    fastest_lap: Dict[str, Any] = {}
    if fastest:
        def _to_secs(ts: str) -> float:
            m, s = ts.split(":")
            return int(m) * 60 + float(s)
        best = min(fastest, key=lambda x: _to_secs(x["time"]))
        drv  = best["driver"]
        fastest_lap = {
            "season":     best["season"],
            "driverId":   drv["driverId"],
            "givenName":  drv["givenName"],
            "familyName": drv["familyName"],
            "time":       best["time"]
        }

    return {
        "circuitId":  bio["circuitId"],
        "name":       bio["circuitName"],
        "url":        bio.get("url"),
        "locality":   bio["Location"]["locality"],
        "country":    bio["Location"]["country"],
        "lat":        bio["Location"]["lat"],
        "long":       bio["Location"]["long"],
        "stats": {
            "firstYear":   first_year,
            "lastYear":    last_year,
            "totalEvents": total_events,
            "lastWinner":  last_winner,
            "fastestLap":  fastest_lap
        }
    }
